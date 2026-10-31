// js/patron/auth.js - V7.4 FIX BANDEAU 30s + PATRON NORMAL
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';

export async function loginPat(){
  let pinEl = document.getElementById('pinPat');
  let msgEl = document.getElementById('msgPat');
  let urlParams = new URLSearchParams(location.search);
  let supportShopParam = urlParams.get('support') || urlParams.get('support_boutique');
  let supportPidParam = urlParams.get('pid');

  // ===== FIX 1: SUPPORT UNIQUEMENT SI URL ?support= EST PRESENT =====
  // Si pas de ?support= dans l'URL, on nettoie l'ancien mode support qui traînait
  let hasSupportUrl = !!supportShopParam;
  let isDgSupport = false;
  
  if(hasSupportUrl){
    isDgSupport = true;
  } else {
    // Pas de ?support= => on est en patron normal, on nettoie tout
    if(sessionStorage.getItem('DG_SUPPORT_MODE')==='1'){
      sessionStorage.removeItem('DG_SUPPORT_MODE');
      sessionStorage.removeItem('DG_SUPPORT_SHOP');
      sessionStorage.removeItem('DG_SUPPORT_PID');
      try{ document.getElementById('dgSupportBanner')?.remove(); document.body.style.paddingTop='0'; }catch(e){}
    }
    isDgSupport = false;
  }

  if(isDgSupport){
    let supportShopName = supportShopParam || sessionStorage.getItem('DG_SUPPORT_SHOP');
    let supportPid = supportPidParam || sessionStorage.getItem('DG_SUPPORT_PID');

    // Bandeau instantané (ne dépend pas de Firebase)
    try{
      if(supportShopName && !document.getElementById('dgSupportBanner')){
        let b = document.createElement('div');
        b.id='dgSupportBanner';
        b.innerHTML = `🛠️ MODE SUPPORT DG - <b>${supportShopName}</b> (Patron ${supportPid||''}) <button onclick="window.exitSupport()" style="background:#fff;color:#ef4444;border:0;padding:3px 10px;border-radius:10px;cursor:pointer;font-weight:900;margin-left:10px">✖️ Quitter</button>`;
        b.style.cssText='position:fixed;top:0;left:0;right:0;background:#ef4444;color:#fff;padding:8px;text-align:center;z-index:9999999;font-size:13px;font-family:Inter;box-shadow:0 2px 10px rgba(0,0,0,.3)';
        document.body.prepend(b);
        document.body.style.paddingTop='38px';
        let loginDiv = document.getElementById('loginPat');
        if(loginDiv) loginDiv.style.display='none';
      }
    }catch(e){}

    // ===== FIX 2: ATTEND FIREBASE AVANT DB =====
    let tries = 0;
    let waitFirebase = setInterval(async ()=>{
      tries++;
      if(!window.db || !window.firebase || !firebase.apps || firebase.apps.length===0){
        if(tries>100){ clearInterval(waitFirebase); return; } // 30s max
        return;
      }
      clearInterval(waitFirebase);
      try{ if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously(); }catch(e){}
      try{
        let patronData = null;
        if(supportPid){
          let s = await window.db.ref('patrons/'+supportPid).once('value');
          if(s.exists()){ patronData = s.val(); patronData._pid = supportPid; }
        }
        if(!patronData && supportShopName){
          let all = await window.db.ref('patrons').once('value');
          let allVal = all.val()||{};
          for(let pid in allVal){
            let p = allVal[pid];
            if(p.boutiques && p.boutiques[supportShopName]){ patronData = p; patronData._pid = pid; break; }
            if((p.boutique||'').toLowerCase()===supportShopName.toLowerCase()){ patronData = p; patronData._pid = pid; break; }
          }
        }
        if(!patronData) throw new Error('Patron introuvable pour '+supportShopName+' / '+supportPid);

        let pidFinal = patronData._pid || patronData.pin || supportPid || 'SUPPORT';
        let vendeurObj = { 
          pin: pidFinal, nom: (patronData.nom||'PATRON')+' (Support DG)', ...patronData,
          isAdmin:true, isSupport:true, boutique:supportShopName, BOUTIQUE:supportShopName, SHOP:supportShopName,
          supportBy:'DG', expire: Date.now()+86400000*365, joursRestants: 365
        };
        STATE.CURRENT_VENDEUR = vendeurObj;
        window.CURRENT_VENDEUR = vendeurObj;
        if(STATE){ STATE.BOUTIQUE=supportShopName; STATE.SHOP=supportShopName; STATE.CURRENT_SHOP=supportShopName; }
        sessionStorage.setItem('BATEKE_PIN', pidFinal);
        sessionStorage.setItem('BATEKE_ROLE','patron');
        sessionStorage.setItem('BATEKE_BOUTIQUE', supportShopName);
        sessionStorage.setItem('pin', pidFinal);
        sessionStorage.setItem('DG_SUPPORT_MODE','1');
        sessionStorage.setItem('DG_SUPPORT_SHOP', supportShopName);
        sessionStorage.setItem('DG_SUPPORT_PID', pidFinal);
        localStorage.setItem('BATEKE_BOUTIQUE', supportShopName);
        localStorage.setItem('patron_session', JSON.stringify({ pin:pidFinal, nom:patronData.nom, ts:Date.now(), boutique:supportShopName, isSupport:true }));
        window.BATEKE_ABO_BYPASS = true;
        try{ setPresenceOnline(); }catch(e){}
        try{ window.initApp && window.initApp(); }catch(e){}
        try{ window.loadData && window.loadData(); }catch(e){}
      }catch(e){
        if(msgEl){ msgEl.style.color='red'; msgEl.innerText='❌ Support fail: '+e.message; }
      }
    }, 300);
    return;
  }
  
  // ===== LOGIN NORMAL PATRON - SANS SUPPORT =====
  try{ document.getElementById('dgSupportBanner')?.remove(); document.body.style.paddingTop='0'; window.BATEKE_ABO_BYPASS=false; }catch(e){}

  let pin = pinEl?.value?.trim();
  if(!pin){ if(msgEl){ msgEl.style.color='red'; msgEl.innerText='PIN requis'; } return; }
  if(msgEl){ msgEl.style.color='#f59e0b'; msgEl.innerText='⏳ Vérification PIN '+pin+'...'; }
  try{ if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously(); }catch(e){}
  let patronData = null;
  try{
    let snap = await window.db.ref('patrons/'+pin).once('value');
    if(snap.exists()) patronData = snap.val();
  }catch(e){ 
    if(e.message && e.message.includes('Permission denied')){
      if(msgEl){ msgEl.style.color='red'; msgEl.innerText='❌ Active Auth Anonyme dans Firebase'; } return;
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
  if(!expireFinal || expireFinal===0){
    if(msgEl){ msgEl.style.color='red'; msgEl.innerHTML=`🚫 ${boutiquePrincipale} JAMAIS PAYÉ<br><small>Contact DG - 15K/30j</small>`; }
    sessionStorage.clear(); localStorage.removeItem('BATEKE_PIN'); return;
  }
  if(expireFinal < now){
    let joursRetard = Math.ceil((now - expireFinal)/86400000);
    if(msgEl){ msgEl.style.color='red'; msgEl.innerHTML=`🚫 ${boutiquePrincipale} BLOQUÉ depuis ${joursRetard}j<br><small>Expire: ${new Date(expireFinal).toLocaleDateString()} - Paye 15K</small>`; }
    sessionStorage.clear(); localStorage.removeItem('BATEKE_PIN'); return;
  }
  let joursRestants = Math.ceil((expireFinal-now)/86400000);
  STATE.CURRENT_VENDEUR = { pin, nom:patronData.nom||'PATRON', ...patronData, isAdmin:true, boutique:boutiquePrincipale, expire:expireFinal, joursRestants };
  window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
  sessionStorage.setItem('BATEKE_PIN', pin);
  sessionStorage.setItem('BATEKE_ROLE','patron');
  sessionStorage.setItem('pin', pin);
  sessionStorage.setItem('BATEKE_BOUTIQUE', boutiquePrincipale);
  localStorage.setItem('BATEKE_LAST_PIN', pin);
  localStorage.setItem('BATEKE_BOUTIQUE', boutiquePrincipale);
  localStorage.setItem('patron_session', JSON.stringify({ pin, nom:patronData.nom, ts:Date.now(), boutique:boutiquePrincipale, expire:expireFinal, joursRestants }));
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
console.log("✅ auth.js V7.4 - FIX PATRON NORMAL + SUPPORT INSTANTANE");
