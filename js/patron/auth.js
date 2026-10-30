// js/patron/auth.js - V6.8 SECURE SAAS - ORDI COMMUN - FIX BOUCLE
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';

export async function loginPat(){
  let pinEl = document.getElementById('pinPat');
  let emailEl = document.getElementById('emailPat');
  let passEl = document.getElementById('passPat');
  let msgEl = document.getElementById('msgPat');
  let modeEmailDiv = document.getElementById('modeEmail');
  
  let isEmailMode = modeEmailDiv && modeEmailDiv.style.display === 'block';

  // ===== MODE SUPERADMIN SAAS =====
  if(isEmailMode){
    let email = emailEl?.value?.trim();
    let pass = passEl?.value?.trim();
    if(!email || !pass){ 
      msgEl.style.color='red'; 
      msgEl.innerText='Email/mdp requis'; 
      return; 
    }
    msgEl.style.color='#f59e0b'; 
    msgEl.innerText='Connexion SuperAdmin...';
    try{
      let cred = await firebase.auth().signInWithEmailAndPassword(email, pass);
      let uid = cred.user.uid;
      let snap = await window.db.ref('superadmins/'+uid).once('value');
      if((snap.exists() && snap.val()===true) || email==='admin@bateke.com'){
        STATE.CURRENT_VENDEUR = { pin:'SUPERADMIN', nom:'DG SUPRÊME', email, uid, isAdmin:true, isSuperAdmin:true };
        window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
        localStorage.setItem('BATEKE_PIN','SUPERADMIN');
        localStorage.setItem('BATEKE_ROLE','superadmin');
        sessionStorage.setItem('BATEKE_PIN','SUPERADMIN');
        sessionStorage.setItem('BATEKE_ROLE','superadmin');
        localStorage.setItem('patron_session', JSON.stringify({ uid, email, isSuperAdmin:true, ts:Date.now() }));
        document.getElementById('loginPat').style.display='none';
        console.log("✅ SUPERADMIN LOGIN:", email);
        location.reload();
        return;
      }else{
        msgEl.style.color='red'; 
        msgEl.innerText='Accès refusé: pas SuperAdmin';
        await firebase.auth().signOut(); 
        return;
      }
    }catch(e){
      msgEl.style.color='red'; 
      msgEl.innerText='Erreur SAAS: '+e.message; 
      return;
    }
  }

  // ===== MODE PIN CLIENT SAAS - SÉCURISÉ ORDI COMMUN =====
  let pin = pinEl?.value?.trim();
  if(!pin){ 
    msgEl.style.color='red'; 
    msgEl.innerText='PIN requis'; 
    return; 
  }
  msgEl.style.color='#f59e0b'; 
  msgEl.innerText='⏳ Vérification PIN '+pin+'...';

  try{ 
    if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously(); 
  }catch(e){}

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
    console.log(`🛑 PIN ${pin} bloqué`);
    sessionStorage.clear();
    localStorage.removeItem('BATEKE_PIN');
    if(pinEl) pinEl.value='';
    return; 
  }
  if(patronData.actif===false){ 
    msgEl.style.color='red'; 
    msgEl.innerText='❌ PIN bloqué - Abonnement expiré'; 
    return; 
  }


  // ===== 🔒 FIX V6.9 - CHECK ABO PAR BOUTIQUE - JAMAIS PAYÉ =====
  let boutiquePrincipale = patronData.boutique || Object.keys(patronData.boutiques||{})[0];
  if(!boutiquePrincipale){
    msgEl.style.color='red';
    msgEl.innerText='❌ Aucune boutique assignée - Contact DG';
    return;
  }

  // Vérifie expire dans 2 endroits (patrons et shops) pour être sûr
  let expirePatron = 0;
  try{ expirePatron = patronData.boutiques?.[boutiquePrincipale]?.expire || patronData.abonnement_fin || 0; }catch(e){}

  let expireShop = 0;
  try{
    let snapShop = await window.db.ref('shops/'+boutiquePrincipale+'/abonnements/expire').once('value');
    expireShop = snapShop.val() || 0;
    if(typeof expireShop === 'string') expireShop = parseInt(expireShop,10) || new Date(expireShop).getTime() || 0;
  }catch(e){ console.warn('check shop abo', e.message); }

  let expireFinal = Math.max(expirePatron, expireShop); // prend le plus grand des 2 pour éviter faux blocage
  // Si les 2 sont à 0 = JAMAIS PAYÉ
  if(expirePatron===0 && expireShop===0) expireFinal = 0;

  let now = Date.now();
  
  if(!expireFinal || expireFinal===0){
    msgEl.style.color='red';
    msgEl.innerHTML=`🚫 ${boutiquePrincipale} JAMAIS PAYÉ<br><small>Contact DG - 15K/30j</small>`;
    console.log(`🛑 BOUTIQUE ${boutiquePrincipale} JAMAIS PAYÉ - PIN ${pin} bloqué`);
    sessionStorage.clear();
    localStorage.removeItem('BATEKE_PIN');
    return;
  }
  
  if(expireFinal < now){
    let joursRetard = Math.ceil((now - expireFinal)/86400000);
    msgEl.style.color='red';
    msgEl.innerHTML=`🚫 ${boutiquePrincipale} BLOQUÉ depuis ${joursRetard}j<br><small>Expire: ${new Date(expireFinal).toLocaleDateString()} - Paye 15K</small>`;
    console.log(`🛑 BOUTIQUE ${boutiquePrincipale} BLOQUÉE - PIN ${pin}`);
    sessionStorage.clear();
    localStorage.removeItem('BATEKE_PIN');
    return;
  }

  let joursRestants = Math.ceil((expireFinal-now)/86400000);
  console.log(`✅ ABO OK - ${boutiquePrincipale} - ${joursRestants}j restants`);
  
  STATE.CURRENT_VENDEUR = { pin, nom:patronData.nom||'PATRON', ...patronData, isAdmin:true };
  window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
  
  // 🔒 FIX ORDI COMMUN: sessionStorage se vide à fermeture onglet
  sessionStorage.setItem('BATEKE_PIN', pin);
  sessionStorage.setItem('BATEKE_ROLE','patron');
  sessionStorage.setItem('pin', pin);
  sessionStorage.setItem('BATEKE_BOUTIQUE', patronData.boutique||Object.keys(patronData.boutiques||{})[0]||'');
  
  // Trace pour debug, mais NE suffit PAS à se reconnecter
  localStorage.setItem('BATEKE_LAST_PIN', pin);
  localStorage.setItem('patron_session', JSON.stringify({ pin, nom:patronData.nom, ts:Date.now() }));
  
  document.getElementById('loginPat').style.display='none';
  try{ setPresenceOnline(); }catch(e){}
  console.log("✅ CLIENT SAAS LOGIN:", pin, patronData.nom);
  location.reload();
}

export function logoutPat(){
  try{ setPresenceOffline(); }catch(e){}
  sessionStorage.clear();
  // FIX: ne pas clear tout localStorage, garde juste le timestamp pour éviter boucle
  localStorage.removeItem('BATEKE_PIN');
  localStorage.removeItem('BATEKE_ROLE');
  localStorage.removeItem('BATEKE_LAST_PIN');
  // On garde patron_session 2 sec pour que app.js comprenne que c'était une déco volontaire
  let pinEl = document.getElementById('pinPat');
  if(pinEl) pinEl.value='';
  firebase.auth().signOut().finally(()=>location.reload());
}

// FIX: une seule définition de lockApp, compatible avec app.js V6.8
if(!window.lockApp){
  window.lockApp = function(){
    try{ setPresenceOffline(); }catch(e){}
    sessionStorage.clear();
    let pinEl = document.getElementById('pinPat');
    if(pinEl) pinEl.value='';
    let loginDiv = document.getElementById('loginPat');
    let msg = document.getElementById('msgPat');
    if(loginDiv) loginDiv.style.display='flex';
    if(msg){ msg.innerText='🔒 Verrouillé - Entrez votre PIN'; msg.style.color='#f59e0b'; }
    try{ if(window.db) firebase.database().ref().off(); }catch(e){}
    console.log("🔒 App verrouillée manuellement");
    // Réinitialise le flag pour permettre reconnexion
    if(window._initDone) window._initDone=false;
  }
}

window.loginPat = loginPat;
window.logoutPat = logoutPat;
console.log("✅ auth.js V6.8 SECURE FIX BOUCLE CHARGÉ");
