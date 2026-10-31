// js/patron/auth.js - V7.3 PATRON ONLY + SUPPORT DG UNIVERSEL
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';

export async function loginPat(){
  let pinEl = document.getElementById('pinPat');
  let msgEl = document.getElementById('msgPat');
  
  // ===== 🛠️ MODE SUPPORT DG - UNIVERSEL =====
  let urlParams = new URLSearchParams(location.search);
  let supportShopParam = urlParams.get('support') || urlParams.get('support_boutique');
  let supportPidParam = urlParams.get('pid');
  let isDgSupport = (sessionStorage.getItem('DG_SUPPORT_MODE')==='1') || supportShopParam;

  if(isDgSupport){
    let supportShopName = supportShopParam || sessionStorage.getItem('DG_SUPPORT_SHOP');
    let supportPid = supportPidParam || sessionStorage.getItem('DG_SUPPORT_PID');
    
    if(!supportShopName && supportPid){
      // Si on a juste le PID, on va chercher sa boutique principale
      try{ if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously(); }catch(e){}
      try{
        let s = await window.db.ref('patrons/'+supportPid).once('value');
        if(s.exists()){
          let p = s.val();
          supportShopName = p.boutique || Object.keys(p.boutiques||{})[0] || supportShopName;
        }
      }catch(e){}
    }

    if(supportShopName){
      if(msgEl){ msgEl.style.color='#a855f7'; msgEl.innerText=`🛠️ SUPPORT DG - ${supportShopName} (${supportPid||''})...`; }
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
        console.log(`🛠️ SUPPORT DG - Login comme ${supportShopName} - Patron ${pidFinal} - Client ${patronData.nom}`);

        // FORCE TOUT POUR AVOIR LES DONNEES
        let vendeurObj = { 
          pin: pidFinal, 
          nom: (patronData.nom||'PATRON')+' (Support DG)', 
          ...patronData, 
          isAdmin:true, 
          isSupport:true, 
          boutique: supportShopName,
          BOUTIQUE: supportShopName,
          SHOP: supportShopName,
          supportBy: 'DG',
          expire: Date.now()+86400000*30, // bypass abo en support
          joursRestants: 30
        };
        STATE.CURRENT_VENDEUR = vendeurObj;
        window.CURRENT_VENDEUR = vendeurObj;
        if(STATE) { STATE.BOUTIQUE = supportShopName; STATE.SHOP = supportShopName; STATE.CURRENT_SHOP = supportShopName; }
        if(window.STATE) { window.STATE.BOUTIQUE = supportShopName; window.STATE.SHOP = supportShopName; }
        
        sessionStorage.setItem('BATEKE_PIN', pidFinal);
        sessionStorage.setItem('BATEKE_ROLE','patron');
        sessionStorage.setItem('BATEKE_BOUTIQUE', supportShopName);
        sessionStorage.setItem('pin', pidFinal);
        sessionStorage.setItem('DG_SUPPORT_MODE','1');
        sessionStorage.setItem('DG_SUPPORT_SHOP', supportShopName);
        sessionStorage.setItem('DG_SUPPORT_PID', pidFinal);
        
        localStorage.setItem('BATEKE_BOUTIQUE', supportShopName);
        localStorage.setItem('CURRENT_SHOP', supportShopName);
        localStorage.setItem('patron_session', JSON.stringify({ pin:pidFinal, nom:patronData.nom, ts:Date.now(), boutique:supportShopName, isSupport:true }));

// ===== BANDEAU SUPPORT DG - ROBUSTE V7.4 =====
(() => {
  const createBanner = () => {
    try {
      // évite doublon
      let old = document.getElementById('dgSupportBanner');
      if (old) old.remove();

      if (!document.body) return false;

      let banner = document.createElement('div');
      banner.id = 'dgSupportBanner';
      banner.setAttribute('data-support', '1');
      // Utilise textContent pour le shop/nom pour éviter XSS, innerHTML seulement pour le bouton
      let safeShop = document.createElement('span');
      safeShop.textContent = supportShopName;
      safeShop.style.fontWeight = '900';
      
      let safePatron = document.createElement('span');
      safePatron.textContent = ` (Patron ${pidFinal} - ${patronData.nom || ''})`;

      banner.appendChild(document.createTextNode('🛠️ MODE SUPPORT DG - Tu vois comme '));
      banner.appendChild(safeShop);
      banner.appendChild(safePatron);
      banner.appendChild(document.createTextNode(' '));

      let btn = document.createElement('button');
      btn.textContent = '✖️ Quitter Support';
      btn.style.cssText = 'background:#fff;color:#000;border:0;padding:2px 10px;border-radius:10px;cursor:pointer;font-weight:bold;margin-left:8px';
      btn.onclick = () => window.exitSupport && window.exitSupport();
      banner.appendChild(btn);

      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ef4444;color:#fff;padding:8px;text-align:center;z-index:9999999;font-size:13px;font-family:Inter,system-ui;line-height:1.4;box-shadow:0 2px 10px rgba(0,0,0,.3)';

      // prepend sécurisé
      if (document.body.firstChild) document.body.insertBefore(banner, document.body.firstChild);
      else document.body.appendChild(banner);

      // padding une seule fois
      if (document.body.dataset.supportPadding !== '1') {
        document.body.style.paddingTop = (parseInt(getComputedStyle(document.body).paddingTop || '0') + 38) + 'px';
        document.body.dataset.supportPadding = '1';
      }

      let loginDiv = document.getElementById('loginPat');
      if (loginDiv) loginDiv.style.display = 'none';

      try { setPresenceOnline && setPresenceOnline(); } catch(e){}

      return true;
    } catch(e){ console.warn('banner fail', e); return false; }
  };

  const tryInitApp = () => {
    try { window.initApp && window.initApp(); } catch(e){}
    try { window.loadData && window.loadData(); } catch(e){}
    try { 
      if (window._initDone) window._initDone = false;
      window.init && window.init(); 
    } catch(e){}
  };

  // 1. Essaye maintenant
  setTimeout(() => { createBanner(); tryInitApp(); }, 400);
  
  // 2. Re-essaye après le gros init V6.2
  setTimeout(() => { createBanner(); }, 1500);
  setTimeout(() => { createBanner(); }, 3000);

  // 3. MutationObserver: si V6.2 supprime le bandeau, on le remet
  try {
    const obs = new MutationObserver(() => {
      if (!document.getElementById('dgSupportBanner') && sessionStorage.getItem('DG_SUPPORT_MODE')==='1') {
        createBanner();
      }
    });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: false });
    // stop après 15s pour pas consommer
    setTimeout(() => obs.disconnect(), 15000);
  } catch(e){}
})();
        //
        return;
      }catch(e){
        console.warn('Support mode fail', e);
        if(msgEl){ msgEl.style.color='red'; msgEl.innerText='❌ Support fail: '+e.message; }
        return;
      }
    }
  }
  
  // ===== LOGIN NORMAL V7.0 =====
  let pin = pinEl?.value?.trim();
  if(!pin){ msgEl.style.color='red'; msgEl.innerText='PIN requis'; return; }
  msgEl.style.color='#f59e0b'; msgEl.innerText='⏳ Vérification PIN '+pin+'...';
  try{ if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously(); }catch(e){}
  let patronData = null;
  try{
    let snap = await window.db.ref('patrons/'+pin).once('value');
    if(snap.exists()) patronData = snap.val();
  }catch(e){ 
    if(e.message.includes('Permission denied')){
      msgEl.style.color='red'; msgEl.innerText='❌ Active Auth Anonyme dans Firebase'; return;
    }
  }
  if(!patronData){ msgEl.style.color='red'; msgEl.innerText=`❌ PIN ${pin} INTROUVABLE`; sessionStorage.clear(); localStorage.removeItem('BATEKE_PIN'); if(pinEl) pinEl.value=''; return; }
  if(patronData.actif===false){ msgEl.style.color='red'; msgEl.innerText='❌ PIN bloqué - Abonnement expiré'; return; }
  let boutiquePrincipale = patronData.boutique || Object.keys(patronData.boutiques||{})[0];
  if(!boutiquePrincipale){ msgEl.style.color='red'; msgEl.innerText='❌ Aucune boutique assignée - Contact DG'; return; }
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
    msgEl.style.color='red'; msgEl.innerHTML=`🚫 ${boutiquePrincipale} JAMAIS PAYÉ<br><small>Contact DG - 15K/30j</small>`;
    sessionStorage.clear(); localStorage.removeItem('BATEKE_PIN'); return;
  }
  if(expireFinal < now){
    let joursRetard = Math.ceil((now - expireFinal)/86400000);
    msgEl.style.color='red'; msgEl.innerHTML=`🚫 ${boutiquePrincipale} BLOQUÉ depuis ${joursRetard}j<br><small>Expire: ${new Date(expireFinal).toLocaleDateString()} - Paye 15K</small>`;
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
  document.getElementById('loginPat').style.display='none';
  try{ setPresenceOnline(); }catch(e){}
  location.reload();
}

export function logoutPat(){
  try{ setPresenceOffline(); }catch(e){}
  sessionStorage.clear();
  localStorage.removeItem('BATEKE_PIN'); localStorage.removeItem('BATEKE_ROLE'); localStorage.removeItem('BATEKE_LAST_PIN');
  let pinEl = document.getElementById('pinPat'); if(pinEl) pinEl.value='';
  firebase.auth().signOut().finally(()=>location.reload());
}

if(!window.lockApp){
  window.lockApp = function(){
    if(sessionStorage.getItem('DG_SUPPORT_MODE')==='1'){
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
  let banner = document.getElementById('dgSupportBanner'); if(banner) banner.remove();
  location.href='https://aiseodon-ai.github.io/bateke/superadmin/';
};

window.loginPat = loginPat;
window.logoutPat = logoutPat;
console.log("✅ auth.js V7.3 UNIVERSEL - SUPPORT DG TOUT CLIENT");
