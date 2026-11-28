// js/patron/auth.js - V8.2 STABLE PER-BOUTIQUE + MUSTCHANGEPIN PROTÉGÉ
// RÈGLES SAAS RESPECTÉES :
// 1. mustChangePin = SACRÉ. DG ne connait jamais le vrai PIN. On ne l'enlève pas.
// 2. Abonnement = PAR BOUTIQUE. 4 boutiques = 4 expire séparés. Une bloquée ne bloque pas les autres.
// 3. Badge et verrou regardent LA MÊME boutique : celle qu'on ouvre, pas la principale.
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';

function hashPinV10(pin){ return btoa(pin+"|BATEKE_SALT_V10"); }

// --- VERROU PAR BOUTIQUE - Utilisé au login + à chaque changement de boutique ---
async function checkAboBoutique(boutique, patronData, patronId){
  let expirePatron = 0;
  try{ expirePatron = patronData.boutiques?.[boutique]?.expire || patronData.abonnement_fin || 0; }catch(e){}
  let expireShop = 0;
  try{
    let snapShop = await window.db.ref('shops/'+boutique+'/abonnements/expire').once('value');
    expireShop = snapShop.val() || 0;
    if(typeof expireShop === 'string') expireShop = parseInt(expireShop,10) || new Date(expireShop).getTime() || 0;
  }catch(e){}
  let expireFinal = Math.max(expirePatron, expireShop);
  return expireFinal;
}

function goAbonnement(boutique, pid, expireVal, joursRetard, msgEl){
  let url = `/bateke/abonnement/?boutique=${encodeURIComponent(boutique)}&patron=${encodeURIComponent(pid)}&expire=${expireVal||0}`;
  if(msgEl){
    msgEl.style.color='red';
    let title = !expireVal || expireVal===0 ? `🚫 ${boutique} JAMAIS PAYÉ` : `🚫 ${boutique} BLOQUÉ depuis ${joursRetard||0}j`;
    msgEl.innerHTML = `${title}<br><small>Expire: ${expireVal?new Date(expireVal).toLocaleDateString():'JAMAIS'}</small><br><a href="${url}" style="display:block;margin-top:10px;background:#22c55e;color:#fff;padding:14px;border-radius:12px;text-align:center;text-decoration:none;font-weight:900;font-size:14px">💳 PAYER 15.000 FC - RÉACTIVER MAINTENANT</a><br><small style="color:#888">Redirection auto dans 3s...</small>`;
  }
  setTimeout(()=>{ location.href=url; }, 3500);
}

// Vérifie à chaque ouverture / changement de boutique - même boutique que le badge
export async function checkAboCurrentBoutique(){
  try{
    let boutique = sessionStorage.getItem('BATEKE_BOUTIQUE') || localStorage.getItem('BATEKE_BOUTIQUE') || STATE.BOUTIQUE || STATE.CURRENT_SHOP;
    let pin = sessionStorage.getItem('BATEKE_PIN') || localStorage.getItem('BATEKE_LAST_PIN');
    if(!boutique || !pin) return true;
    if(sessionStorage.getItem('DG_SUPPORT_MODE')==='1') return true; // Support DG = bypass volontaire
    if(window.BATEKE_ABO_BYPASS) return true;
    let snap = await window.db.ref('patrons/'+pin).once('value');
    if(!snap.exists()) return true;
    let patronData = snap.val();
    let expireFinal = await checkAboBoutique(boutique, patronData, pin);
    let now = Date.now();
    if(!expireFinal || expireFinal < now){
      let joursRetard = expireFinal ? Math.ceil((now - expireFinal)/86400000) : 0;
      let msgEl = document.getElementById('msgPat');
      goAbonnement(boutique, pin, expireFinal, joursRetard, msgEl);
      return false;
    }
    return true;
  }catch(e){ return true; }
}
window.checkAboCurrentBoutique = checkAboCurrentBoutique;

export async function loginPat(){
  let pinEl = document.getElementById('pinPat');
  let msgEl = document.getElementById('msgPat');
  let urlParams = new URLSearchParams(location.search);
  let supportShopParam = urlParams.get('support') || urlParams.get('support_boutique');
  let supportPidParam = urlParams.get('pid');
  let hasSupportUrl = !!supportShopParam;

  if(hasSupportUrl){
    let supportShopName = supportShopParam || sessionStorage.getItem('DG_SUPPORT_SHOP') || 'Intendance';
    let supportPid = supportPidParam || sessionStorage.getItem('DG_SUPPORT_PID') || '7832';
    if(!sessionStorage.getItem('DG_SUPPORT_MODE')){
      sessionStorage.setItem('DG_SUPPORT_MODE','1');
      sessionStorage.setItem('DG_SUPPORT_SHOP', supportShopName);
      sessionStorage.setItem('DG_SUPPORT_PID', supportPid);
      sessionStorage.setItem('BATEKE_PIN', supportPid);
      sessionStorage.setItem('BATEKE_ROLE','patron');
      sessionStorage.setItem('BATEKE_BOUTIQUE', supportShopName);
      sessionStorage.setItem('pin', supportPid);
      localStorage.setItem('BATEKE_BOUTIQUE', supportShopName);
      localStorage.setItem('CURRENT_SHOP', supportShopName);
      localStorage.setItem('BATEKE_LAST_PIN', supportPid);
      localStorage.setItem('patron_session', JSON.stringify({ pin:supportPid, ts:Date.now(), boutique:supportShopName, isSupport:true }));
      location.reload();
      return;
    }
    let tries=0;
    let waitFirebase = setInterval(async ()=>{
      tries++;
      if(!window.db || !window.firebase || !firebase.apps || firebase.apps.length===0){
        if(tries>150){ clearInterval(waitFirebase); if(msgEl) msgEl.innerText='❌ Firebase pas prêt'; return; }
        return;
      }
      clearInterval(waitFirebase);
      try{ if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously(); }catch(e){}
      try{
        let patronData=null;
        if(supportPid){
          let s=await window.db.ref('patrons/'+supportPid).once('value');
          if(s.exists()){ patronData=s.val(); patronData._pid=supportPid; }
        }
        if(!patronData && supportShopName){
          let all=await window.db.ref('patrons').once('value');
          let allVal=all.val()||{};
          for(let pid in allVal){
            let p=allVal[pid];
            if(p.boutiques && p.boutiques[supportShopName]){ patronData=p; patronData._pid=pid; break; }
            if((p.boutique||'').toLowerCase()===supportShopName.toLowerCase()){ patronData=p; patronData._pid=pid; break; }
          }
        }
        if(!patronData) throw new Error('Patron introuvable '+supportShopName);
        let pidFinal = patronData._pid || supportPid || 'SUPPORT';
        let vendeurObj = { 
          pin: pidFinal, nom: (patronData.nom||'PATRON')+' (Support DG)', ...patronData,
          isAdmin:true, isSupport:true, boutique:supportShopName, BOUTIQUE:supportShopName, SHOP:supportShopName,
          supportBy:'DG', expire: Date.now()+86400000*365, joursRestants: 365
        };
        STATE.CURRENT_VENDEUR = vendeurObj;
        window.CURRENT_VENDEUR = vendeurObj;
        STATE.BOUTIQUE=supportShopName; STATE.SHOP=supportShopName; STATE.CURRENT_SHOP=supportShopName;
        try{
          let sel=document.getElementById('shopSel');
          if(sel && patronData.boutiques){
            let list=Object.keys(patronData.boutiques);
            sel.innerHTML=list.map(b=>`<option value="${b}" ${b===supportShopName?'selected':''}>${b}</option>`).join('');
            sel.value=supportShopName;
          }
        }catch(e){}
        localStorage.setItem('BATEKE_BOUTIQUE', supportShopName);
        localStorage.setItem('CURRENT_SHOP', supportShopName);
        sessionStorage.setItem('BATEKE_BOUTIQUE', supportShopName);
        window.BATEKE_ABO_BYPASS=true;
        if(!document.getElementById('dgSupportBanner')){
          let b=document.createElement('div');
          b.id='dgSupportBanner';
          b.innerHTML=`🛠️ MODE SUPPORT DG - Tu vois comme <b>${supportShopName}</b> (Patron ${supportPid}) <button onclick="window.exitSupport()" style="background:#fff;color:#ef4444;border:0;padding:3px 10px;border-radius:10px;cursor:pointer;font-weight:900;margin-left:10px">✖️ Quitter</button>`;
          b.style.cssText='position:fixed;top:0;left:0;right:0;background:#ef4444;color:#fff;padding:8px;text-align:center;z-index:9999999;font-size:13px;font-family:Inter;box-shadow:0 2px 10px rgba(0,0,0,.3)';
          document.body.prepend(b);
          document.body.style.paddingTop='38px';
          let loginDiv=document.getElementById('loginPat'); if(loginDiv) loginDiv.style.display='none';
        }
        try{ setPresenceOnline(); }catch(e){}
        try{ window.initApp && window.initApp(); }catch(e){}
        try{ window.loadData && window.loadData(); }catch(e){}
      }catch(e){
        if(msgEl){ msgEl.style.color='red'; msgEl.innerText='❌ Support fail: '+e.message; }
      }
    }, 300);
    return;
  }
  
  try{ document.getElementById('dgSupportBanner')?.remove(); document.body.style.paddingTop='0'; window.BATEKE_ABO_BYPASS=false; sessionStorage.removeItem('DG_SUPPORT_MODE'); }catch(e){}

  let pin = pinEl?.value?.trim();
  if(!pin){ if(msgEl){ msgEl.style.color='red'; msgEl.innerText='PIN requis'; } return; }
  if(msgEl){ msgEl.style.color='#f59e0b'; msgEl.innerText='⏳ Vérification en cours...'; }
  try{ if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously(); }catch(e){}
  
  let patronData = null;
  let patronIdFound = null;

  try{
    let h = hashPinV10(pin);
    let snapByHash = await window.db.ref('patrons').orderByChild('pinHash').equalTo(h).once('value');
    if(snapByHash.exists()){
      snapByHash.forEach(child=>{ patronData = child.val(); patronIdFound = child.key; });
    }
    if(!patronData){
      let snapByPin = await window.db.ref('patrons').orderByChild('pin').equalTo(pin).once('value');
      if(snapByPin.exists()){
        snapByPin.forEach(child=>{ patronData = child.val(); patronIdFound = child.key; });
      }
    }
  }catch(e){ 
    if(e.message && e.message.includes('Permission denied')){
      if(msgEl){ msgEl.style.color='red'; msgEl.innerText='❌ Active Auth Anonyme + index pin/pinHash'; } return;
    }
  }
  
  if(!patronData){ if(msgEl){ msgEl.style.color='red'; msgEl.innerText=`❌ PIN introuvable`; } sessionStorage.clear(); localStorage.removeItem('BATEKE_PIN'); if(pinEl) pinEl.value=''; return; }

  if(patronData.mustChangePin && patronData.tempPinExpire && Date.now() > patronData.tempPinExpire){
    if(msgEl){ msgEl.style.color='red'; msgEl.innerText=`⏳ PIN temporaire expiré. Demande à DG de régénérer.`; } return;
  }

  if(patronData.actif===false){ if(msgEl){ msgEl.style.color='red'; msgEl.innerText='❌ PIN bloqué - Abonnement expiré'; } return; }
  
  // CORRIGÉ V8.2 - BOUTIQUE À OUVRIR = celle choisie / en session, PAS toujours la principale
  // Si le client a 4 boutiques, on contrôle celle qu'il veut ouvrir. Les autres ne le bloquent pas.
  let boutiqueAOuvrir = sessionStorage.getItem('BATEKE_BOUTIQUE') || localStorage.getItem('BATEKE_BOUTIQUE') || patronData.boutique || Object.keys(patronData.boutiques||{})[0];
  if(!boutiqueAOuvrir){ if(msgEl){ msgEl.style.color='red'; msgEl.innerText='❌ Aucune boutique assignée - Contact DG'; } return; }

  // CORRIGÉ V8.2 - mustChangePin NE BYPASS PLUS LE BLOCAGE
  // Si mustChangePin = true : on ouvre UNIQUEMENT l'écran changement PIN, PAS le dashboard.
  // Le dashboard ne s'ouvre qu'après changement PIN + contrôle abonnement de CETTE boutique.
  if(patronData.mustChangePin === true){
    sessionStorage.setItem('BATEKE_MUST_CHANGE_PIN','1');
    sessionStorage.setItem('BATEKE_PIN_PENDING', patronIdFound);
    sessionStorage.setItem('BATEKE_BOUTIQUE_PENDING', boutiqueAOuvrir);
    if(msgEl){
      msgEl.style.color='#f59e0b';
      msgEl.innerHTML = `🔑 PIN temporaire détecté.<br>Change ton PIN pour sécuriser <b>${boutiqueAOuvrir}</b>.<br><small>Personne, même pas DG, ne connaitra ton nouveau PIN.</small><br><button onclick="window.changePinForce()" style="display:block;margin-top:10px;background:#7c3aed;color:#fff;padding:12px;border-radius:12px;width:100%;border:0;font-weight:900;cursor:pointer">🔑 CHANGER MON PIN MAINTENANT</button>`;
    }
    // On ne rentre PAS dans le dashboard ici. On attend le changement de PIN.
    return;
  }

  let expireFinal = await checkAboBoutique(boutiqueAOuvrir, patronData, patronIdFound);
  let now = Date.now();

  // CORRIGÉ V8.2 - Bloque CETTE boutique, pas tout le compte
  if(!expireFinal || expireFinal===0){
    goAbonnement(boutiqueAOuvrir, patronIdFound, 0, 0, msgEl);
    return;
  }
  if(expireFinal < now){
    let joursRetard = Math.ceil((now - expireFinal)/86400000);
    goAbonnement(boutiqueAOuvrir, patronIdFound, expireFinal, joursRetard, msgEl);
    return;
  }

  let joursRestants = Math.ceil((expireFinal-now)/86400000);
  STATE.CURRENT_VENDEUR = { pin: patronIdFound, nom:patronData.nom||'PATRON', ...patronData, isAdmin:true, boutique:boutiqueAOuvrir, expire:expireFinal, joursRestants };
  window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
  sessionStorage.setItem('BATEKE_PIN', patronIdFound);
  sessionStorage.setItem('BATEKE_ROLE','patron');
  sessionStorage.setItem('pin', patronIdFound);
  sessionStorage.setItem('BATEKE_BOUTIQUE', boutiqueAOuvrir);
  localStorage.setItem('BATEKE_LAST_PIN', patronIdFound);
  localStorage.setItem('BATEKE_BOUTIQUE', boutiqueAOuvrir);
  localStorage.setItem('patron_session', JSON.stringify({ pin: patronIdFound, nom:patronData.nom, ts:Date.now(), boutique:boutiqueAOuvrir, expire:expireFinal, joursRestants }));
  let loginDiv = document.getElementById('loginPat');
  if(loginDiv) loginDiv.style.display='none';
  try{ setPresenceOnline(); }catch(e){}
  location.reload();
}

// Changement PIN forcé - SANS ouvrir le dashboard avant
window.changePinForce = async function(){
  let pid = sessionStorage.getItem('BATEKE_PIN_PENDING');
  let boutique = sessionStorage.getItem('BATEKE_BOUTIQUE_PENDING');
  if(!pid){ alert('Session expirée, retape ton PIN temporaire'); return; }
  let nouveau = prompt('🔑 Nouveau PIN secret (4 chiffres, personne ne le verra, même pas DG) :');
  if(!nouveau || nouveau.length < 4){ alert('PIN trop court'); return; }
  let confirmPin = prompt('Retape ton nouveau PIN :');
  if(nouveau !== confirmPin){ alert('PIN différents'); return; }
  try{
    await window.db.ref('patrons/'+pid).update({
      pin: nouveau,
      pinHash: hashPinV10(nouveau),
      mustChangePin: false,
      tempPinExpire: null,
      pinChangeLe: Date.now()
    });
    sessionStorage.removeItem('BATEKE_MUST_CHANGE_PIN');
    sessionStorage.removeItem('BATEKE_PIN_PENDING');
    sessionStorage.removeItem('BATEKE_BOUTIQUE_PENDING');
    alert('✅ PIN changé. Retapе ton NOUVEAU PIN pour entrer.');
    let pinEl = document.getElementById('pinPat'); if(pinEl){ pinEl.value=''; pinEl.focus(); }
    let msgEl = document.getElementById('msgPat'); if(msgEl){ msgEl.style.color='#22c55e'; msgEl.innerText='✅ PIN changé. Retape ton nouveau PIN.'; }
  }catch(e){ alert('❌ Erreur changement PIN: '+e.message); }
};

export function logoutPat(){
  try{ setPresenceOffline(); }catch(e){}
  sessionStorage.clear();
  localStorage.removeItem('BATEKE_PIN'); localStorage.removeItem('BATEKE_ROLE'); localStorage.removeItem('BATEKE_LAST_PIN');
  let pinEl = document.getElementById('pinPat'); if(pinEl) pinEl.value='';
  try{ firebase.auth().signOut().finally(()=>location.reload()); }catch(e){ location.reload(); }
}

if(!window.lockApp){
  window.lockApp = function(){
    if(sessionStorage.getItem('DG_SUPPORT_MODE')==='1' && new URLSearchParams(location.search).get('support')){
      if(confirm("Quitter mode support DG?")) window.exitSupport();
      return;
    }
    try{ setPresenceOffline(); }catch(e){}
    sessionStorage.clear();
    let pinEl = document.getElementById('pinPat'); if(pinEl) pinEl.value='';
    let loginDiv = document.getElementById('loginPat'); let msg = document.getElementById('msgPat');
    if(loginDiv) loginDiv.style.display='flex';
    if(msg){ msg.innerText='🔒 Verrouillé - Entrez votre PIN'; msg.style.color='#f59e0b'; }
    try{ if(window.db) firebase.database().ref().off(); }catch(e){}
    if(window._initDone) window._initDone=false;
  }
}

window.exitSupport = function(){
  sessionStorage.removeItem('DG_SUPPORT_MODE'); sessionStorage.removeItem('DG_SUPPORT_SHOP');
  sessionStorage.removeItem('DG_SUPPORT_PID'); sessionStorage.removeItem('BATEKE_PIN');
  sessionStorage.removeItem('BATEKE_BOUTIQUE'); localStorage.removeItem('BATEKE_BOUTIQUE');
  localStorage.removeItem('CURRENT_SHOP');
  let banner = document.getElementById('dgSupportBanner'); if(banner) banner.remove();
  document.body.style.paddingTop='0';
  location.href='https://aiseodon-ai.github.io/bateke/superadmin/';
};

window.loginPat = loginPat;
window.logoutPat = logoutPat;
console.log("✅ auth.js V8.2 STABLE PER-BOUTIQUE + MUSTCHANGEPIN PROTÉGÉ");
