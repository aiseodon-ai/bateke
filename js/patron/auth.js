// js/patron/auth.js - V7.1 PATRON ONLY + SUPPORT DG VOIR COMME PATRON
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';

export async function loginPat(){
  let pinEl = document.getElementById('pinPat');
  let msgEl = document.getElementById('msgPat');
  
  // ===== 🛠️ MODE SUPPORT DG - DETECTION URL =====
  let urlParams = new URLSearchParams(location.search);
  let supportShop = urlParams.get('support');
  let isDgSupport = (sessionStorage.getItem('DG_SUPPORT_MODE')==='1' && sessionStorage.getItem('DG_SUPPORT_SHOP')) || supportShop;
  let supportShopName = supportShop || sessionStorage.getItem('DG_SUPPORT_SHOP');
  let supportRole = localStorage.getItem('BATEKE_ROLE');

  if(isDgSupport && supportShopName && supportRole==='superadmin'){
    if(msgEl){ msgEl.style.color='#a855f7'; msgEl.innerText=`🛠️ MODE SUPPORT DG - Ouverture ${supportShopName}...`; }
    try{ if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously(); }catch(e){}
    try{
      let patronData = null;
      let snapPid = urlParams.get('pid');
      if(snapPid){
        let s = await window.db.ref('patrons/'+snapPid).once('value');
        if(s.exists()) patronData = s.val();
      }
      if(!patronData){
        // cherche patron qui a cette boutique
        let all = await window.db.ref('patrons').once('value');
        let allVal = all.val()||{};
        for(let pid in allVal){
          let p = allVal[pid];
          if(p.boutiques && p.boutiques[supportShopName]){ patronData = p; patronData._pid = pid; break; }
          if(p.boutique===supportShopName){ patronData = p; patronData._pid = pid; break; }
        }
      }
      if(!patronData) throw new Error('Patron introuvable pour '+supportShopName);
      
      let pidFinal = patronData._pid || patronData.pin || snapPid || 'SUPPORT';
      console.log(`🛠️ SUPPORT DG - Login comme ${supportShopName} - Patron ${pidFinal}`);

      STATE.CURRENT_VENDEUR = { pin: pidFinal, nom: (patronData.nom||'PATRON')+' (Support DG)', ...patronData, isAdmin:true, isSupport:true, boutique:supportShopName, supportBy:'7832' };
      window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
      
      sessionStorage.setItem('BATEKE_PIN', pidFinal);
      sessionStorage.setItem('BATEKE_ROLE','patron');
      sessionStorage.setItem('BATEKE_BOUTIQUE', supportShopName);
      sessionStorage.setItem('pin', pidFinal);
      localStorage.setItem('patron_session', JSON.stringify({ pin:pidFinal, nom:patronData.nom, ts:Date.now(), boutique:supportShopName, isSupport:true }));

      // Bandeau rouge support
      setTimeout(()=>{
        let banner = document.createElement('div');
        banner.id='dgSupportBanner';
        banner.innerHTML = `🛠️ MODE SUPPORT DG - Tu vois comme <b>${supportShopName}</b> (Patron ${pidFinal}) - <button onclick="window.exitSupport()" style="background:#fff;color:#000;border:0;padding:2px 10px;border-radius:10px;cursor:pointer;font-weight:bold;margin-left:8px">✖️ Quitter Support</button>`;
        banner.style.cssText='position:fixed;top:0;left:0;right:0;background:#ef4444;color:#fff;padding:8px;text-align:center;z-index:99999;font-size:13px;font-family:Inter';
        document.body.prepend(banner);
        let loginDiv = document.getElementById('loginPat');
        if(loginDiv) loginDiv.style.display='none';
        try{ setPresenceOnline(); }catch(e){}
      },300);
      
      return; // on sort, pas de reload, on laisse l'app continuer
    }catch(e){
      console.warn('Support mode fail', e);
      if(msgEl){ msgEl.style.color='red'; msgEl.innerText='❌ Support fail: '+e.message; }
      return;
    }
  }
  
  // ===== LOGIN NORMAL V7.0 =====
  let pin = pinEl?.value?.trim();
  if(!pin){ 
    msgEl.style.color='red'; 
    msgEl.innerText='PIN requis'; 
    return; 
  }
  msgEl.style.color='#f59e0b'; 
  msgEl.innerText='⏳ Vérification PIN '+pin+'...';

  try{ if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously(); }catch(e){}

  let patronData = null;
  try{
    let snap = await window.db.ref('patrons/'+pin).once('value');
    if(snap.exists()) patronData = snap.val();
  }catch(e){ 
    console.warn("patrons/"+pin+" read error:", e.message);
    if(e.message.includes('Permission denied')){
      msgEl.style.color='red'; 
      msgEl.innerText='❌ Active Auth Anonyme dans Firebase';
      return;
    }
  }

  if(!patronData){ 
    msgEl.style.color='red'; 
    msgEl.innerText=`❌ PIN ${pin} INTROUVABLE`; 
    sessionStorage.clear(); localStorage.removeItem('BATEKE_PIN');
    if(pinEl) pinEl.value=''; return; 
  }
  if(patronData.actif===false){ 
    msgEl.style.color='red'; msgEl.innerText='❌ PIN bloqué - Abonnement expiré'; return; 
  }

  let boutiquePrincipale = patronData.boutique || Object.keys(patronData.boutiques||{})[0];
  if(!boutiquePrincipale){
    msgEl.style.color='red'; msgEl.innerText='❌ Aucune boutique assignée - Contact DG'; return;
  }

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
  console.log(`✅ ABO OK - ${boutiquePrincipale} - ${joursRestants}j restants`);

  STATE.CURRENT_VENDEUR = { pin, nom:patronData.nom||'PATRON', ...patronData, isAdmin:true, boutique:boutiquePrincipale, expire:expireFinal, joursRestants };
  window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
  
  sessionStorage.setItem('BATEKE_PIN', pin);
  sessionStorage.setItem('BATEKE_ROLE','patron');
  sessionStorage.setItem('pin', pin);
  sessionStorage.setItem('BATEKE_BOUTIQUE', boutiquePrincipale);
  
  localStorage.setItem('BATEKE_LAST_PIN', pin);
  localStorage.setItem('patron_session', JSON.stringify({ pin, nom:patronData.nom, ts:Date.now(), boutique:boutiquePrincipale, expire:expireFinal, joursRestants }));
  
  document.getElementById('loginPat').style.display='none';
  try{ setPresenceOnline(); }catch(e){}
  console.log("✅ PATRON LOGIN V7.1:", pin, patronData.nom, boutiquePrincipale);
  location.reload();
}

export function logoutPat(){
  try{ setPresenceOffline(); }catch(e){}
  sessionStorage.clear();
  localStorage.removeItem('BATEKE_PIN');
  localStorage.removeItem('BATEKE_ROLE');
  localStorage.removeItem('BATEKE_LAST_PIN');
  let pinEl = document.getElementById('pinPat');
  if(pinEl) pinEl.value='';
  firebase.auth().signOut().finally(()=>location.reload());
}

if(!window.lockApp){
  window.lockApp = function(){
    // Ne pas clearer si support DG
    if(sessionStorage.getItem('DG_SUPPORT_MODE')==='1'){
      if(confirm("Quitter mode support DG et retourner superadmin?")){
        window.exitSupport();
      }
      return;
    }
    try{ setPresenceOffline(); }catch(e){}
    sessionStorage.clear();
    let pinEl = document.getElementById('pinPat');
    if(pinEl) pinEl.value='';
    let loginDiv = document.getElementById('loginPat');
    let msg = document.getElementById('msgPat');
    if(loginDiv) loginDiv.style.display='flex';
    if(msg){ msg.innerText='🔒 Verrouillé - Entrez votre PIN'; msg.style.color='#f59e0b'; }
    try{ if(window.db) firebase.database().ref().off(); }catch(e){}
    console.log("🔒 App verrouillée");
    if(window._initDone) window._initDone=false;
  }
}

// Fonction globale quitter support
window.exitSupport = function(){
  let shop = sessionStorage.getItem('DG_SUPPORT_SHOP')||'';
  console.log(`👋 Quitte support ${shop}`);
  sessionStorage.removeItem('DG_SUPPORT_MODE');
  sessionStorage.removeItem('DG_SUPPORT_SHOP');
  sessionStorage.removeItem('DG_SUPPORT_PID');
  sessionStorage.removeItem('BATEKE_PIN');
  sessionStorage.removeItem('BATEKE_BOUTIQUE');
  let banner = document.getElementById('dgSupportBanner');
  if(banner) banner.remove();
  location.href='https://aiseodon-ai.github.io/bateke/superadmin/';
};

window.loginPat = loginPat;
window.logoutPat = logoutPat;
console.log("✅ auth.js V7.1 PATRON + SUPPORT DG VOIR PATRON");
