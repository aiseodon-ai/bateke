// js/patron/auth.js - V8.0 FIX CAUSE RACINE SUPPORT + V10.3 PIN SECURE SEARCH
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';

function hashPinV10(pin){ return btoa(pin+"|BATEKE_SALT_V10"); }

export async function loginPat(){
  let pinEl = document.getElementById('pinPat');
  let msgEl = document.getElementById('msgPat');
  let urlParams = new URLSearchParams(location.search);
  let supportShopParam = urlParams.get('support') || urlParams.get('support_boutique');
  let supportPidParam = urlParams.get('pid');
  let hasSupportUrl = !!supportShopParam;

  // === MODE SUPPORT DG - FIX RATIONNEL - GARDÉ STABLE ===
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
  
  // === MODE NORMAL - V10.3 PATCH SECURE ===
  try{ document.getElementById('dgSupportBanner')?.remove(); document.body.style.paddingTop='0'; window.BATEKE_ABO_BYPASS=false; sessionStorage.removeItem('DG_SUPPORT_MODE'); }catch(e){}

  let pin = pinEl?.value?.trim();
  if(!pin){ if(msgEl){ msgEl.style.color='red'; msgEl.innerText='PIN requis'; } return; }
  if(msgEl){ msgEl.style.color='#f59e0b'; msgEl.innerText='⏳ Vérification PIN '+pin+'...'; }
  try{ if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously(); }catch(e){}
  
  let patronData = null;
  let patronIdFound = pin;

  try{
    // 1. Direct ID
    let snap = await window.db.ref('patrons/'+pin).once('value');
    if(snap.exists()){ patronData = snap.val(); patronIdFound = pin; }
    
    // 2. V10 - Recherche par pin == 3575 (ton cas 8888)
    if(!patronData){
      let snapByPin = await window.db.ref('patrons').orderByChild('pin').equalTo(pin).once('value');
      if(snapByPin.exists()){
        snapByPin.forEach(child=>{ patronData = child.val(); patronIdFound = child.key; });
      }
    }
    
    // 3. V10 - Recherche par pinHash
    if(!patronData){
      let h = hashPinV10(pin);
      let snapByHash = await window.db.ref('patrons').orderByChild('pinHash').equalTo(h).once('value');
      if(snapByHash.exists()){
        snapByHash.forEach(child=>{ patronData = child.val(); patronIdFound = child.key; });
      }
    }
  }catch(e){ 
    if(e.message && e.message.includes('Permission denied')){
      if(msgEl){ msgEl.style.color='red'; msgEl.innerText='❌ Active Auth Anonyme + index pin/pinHash'; } return;
    }
  }
  
  if(!patronData){ if(msgEl){ msgEl.style.color='red'; msgEl.innerText=`❌ PIN ${pin} INTROUVABLE`; } sessionStorage.clear(); localStorage.removeItem('BATEKE_PIN'); if(pinEl) pinEl.value=''; return; }
  if(patronData.actif===false){ if(msgEl){ msgEl.style.color='red'; msgEl.innerText='❌ PIN bloqué - Abonnement expiré'; } return; }
  
  let boutiquePrincipale = patronData.boutique || Object.keys(patronData.boutiques||{})[0];
  if(!boutiquePrincipale){ if(msgEl){ msgEl.style.color='red'; msgEl.innerText='❌ Aucune boutique assignée - Contact DG'; } return; }
  
  let expirePatron = 0;
  try{ expirePatron = patronData.boutiques?.[boutiquePrincipale]?.expire || patronData.abonnement_fin || 0; }catch(e){}
  let expireShop = 0;
  try{
    let snapShop = await window.db.ref('shops/'+boutiquePrincipale+'/abonnements/expire').once('value');
    expireShop = snapShop.val() || 0;
    if(typeof expireShop === 'string') expireShop = parseInt(expireShop,10) || new Date(expireShop).getTime() || 0;
  }catch(e){}
  let expireFinal = Math.max(expirePatron, expireShop);
  if(expirePatron===0 && expireShop===0) expireFinal = 0;
  let now = Date.now();

  function goAbonnement(boutique, pid, expireVal, joursRetard){
    let url = `/bateke/abonnement/?boutique=${encodeURIComponent(boutique)}&patron=${encodeURIComponent(pid)}&expire=${expireVal||0}`;
    if(msgEl){
      msgEl.style.color='red';
      let title = !expireVal || expireVal===0 ? `🚫 ${boutique} JAMAIS PAYÉ` : `🚫 ${boutique} BLOQUÉ depuis ${joursRetard||0}j`;
      msgEl.innerHTML = `${title}<br><small>Expire: ${expireVal?new Date(expireVal).toLocaleDateString():'JAMAIS'}</small><br><a href="${url}" style="display:block;margin-top:10px;background:#22c55e;color:#fff;padding:14px;border-radius:12px;text-align:center;text-decoration:none;font-weight:900;font-size:14px">💳 PAYER 15.000 FC - RÉACTIVER MAINTENANT</a><br><small style="color:#888">Redirection auto dans 3s...</small>`;
    }
    setTimeout(()=>{ location.href=url; }, 3500);
  }

  // V10.3: Si mustChangePin, on laisse passer même si bloqué, pour qu'il change son PIN puis paye
  if(patronData.mustChangePin === true){
    // On logue mais on force le modal via session
    sessionStorage.setItem('BATEKE_MUST_CHANGE_PIN','1');
  }

  if(!expireFinal || expireFinal===0){
    // Si c'est un PIN temporaire V10, on ne bloque pas tout de suite, on laisse changer PIN
    if(patronData.mustChangePin === true){
      // laisse passer vers modal
    } else {
      goAbonnement(boutiquePrincipale, patronIdFound, 0, 0);
      return;
    }
  }
  if(expireFinal < now && patronData.mustChangePin !== true){
    let joursRetard = Math.ceil((now - expireFinal)/86400000);
    goAbonnement(boutiquePrincipale, patronIdFound, expireFinal, joursRetard);
    return;
  }

  let joursRestants = Math.ceil((expireFinal-now)/86400000);
  STATE.CURRENT_VENDEUR = { pin: patronIdFound, nom:patronData.nom||'PATRON', ...patronData, isAdmin:true, boutique:boutiquePrincipale, expire:expireFinal, joursRestants };
  window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
  sessionStorage.setItem('BATEKE_PIN', patronIdFound);
  sessionStorage.setItem('BATEKE_ROLE','patron');
  sessionStorage.setItem('pin', patronIdFound);
  sessionStorage.setItem('BATEKE_BOUTIQUE', boutiquePrincipale);
  localStorage.setItem('BATEKE_LAST_PIN', patronIdFound);
  localStorage.setItem('BATEKE_BOUTIQUE', boutiquePrincipale);
  localStorage.setItem('patron_session', JSON.stringify({ pin: patronIdFound, nom:patronData.nom, ts:Date.now(), boutique:boutiquePrincipale, expire:expireFinal, joursRestants }));
  let loginDiv = document.getElementById('loginPat');
  if(loginDiv) loginDiv.style.display='none';
  try{ setPresenceOnline(); }catch(e){}
  location.reload();
}

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
console.log("✅ auth.js V8.0 + V10.3 PIN SECURE");
