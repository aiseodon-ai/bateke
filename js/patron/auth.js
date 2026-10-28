// js/patron/auth.js - V6.7 SECURE SAAS - ORDI COMMUN - sessionStorage + auto-lock
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';

export async function loginPat(){
  let pinEl = document.getElementById('pinPat');
  let emailEl = document.getElementById('emailPat');
  let passEl = document.getElementById('passPat');
  let msgEl = document.getElementById('msgPat');
  let modeEmailDiv = document.getElementById('modeEmail');
  
  let isEmailMode = modeEmailDiv && modeEmailDiv.style.display !== 'none';

  // ===== MODE SUPERADMIN SAAS =====
  if(isEmailMode){
    let email = emailEl?.value?.trim();
    let pass = passEl?.value?.trim();
    if(!email || !pass){ msgEl.style.color='red'; msgEl.innerText='Email/mdp requis'; return; }
    msgEl.style.color='#f59e0b'; msgEl.innerText='Connexion SuperAdmin...';
    try{
      let cred = await firebase.auth().signInWithEmailAndPassword(email, pass);
      let uid = cred.user.uid;
      let snap = await window.db.ref('superadmins/'+uid).once('value');
      if((snap.exists() && snap.val()===true) || email==='admin@bateke.com'){
        STATE.CURRENT_VENDEUR = { pin:'SUPERADMIN', nom:'DG SUPRÊME', email, uid, isAdmin:true, isSuperAdmin:true };
        window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
        // SUPERADMIN reste en localStorage (toi seul sur ton PC perso)
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
        msgEl.style.color='red'; msgEl.innerText='Accès refusé: pas SuperAdmin';
        await firebase.auth().signOut(); return;
      }
    }catch(e){
      msgEl.style.color='red'; msgEl.innerText='Erreur SAAS: '+e.message; return;
    }
  }

  // ===== MODE PIN CLIENT SAAS - SÉCURISÉ ORDI COMMUN =====
  let pin = pinEl?.value?.trim();
  if(!pin){ msgEl.style.color='red'; msgEl.innerText='PIN requis'; return; }
  msgEl.style.color='#f59e0b'; msgEl.innerText='⏳ Vérification PIN '+pin+'...';

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
    console.log(`🛑 PIN ${pin} bloqué`);
    sessionStorage.clear();
    localStorage.removeItem('BATEKE_PIN');
    return; 
  }
  if(patronData.actif===false){ msgEl.style.color='red'; msgEl.innerText='❌ PIN bloqué - Abonnement expiré'; return; }

  STATE.CURRENT_VENDEUR = { pin, nom:patronData.nom||'PATRON', ...patronData, isAdmin:true };
  window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
  
  // 🔒 FIX ORDI COMMUN: sessionStorage = se vide à la fermeture de l'onglet
  sessionStorage.setItem('BATEKE_PIN', pin);
  sessionStorage.setItem('BATEKE_ROLE','patron');
  sessionStorage.setItem('pin', pin);
  sessionStorage.setItem('BATEKE_BOUTIQUE', patronData.boutique||Object.keys(patronData.boutiques||{})[0]||'');
  
  // On garde aussi une trace en localStorage pour savoir qui était là, mais elle ne suffit PAS à se reconnecter
  localStorage.setItem('BATEKE_LAST_PIN', pin);
  localStorage.setItem('patron_session', JSON.stringify({ pin, ts:Date.now() }));
  
  document.getElementById('loginPat').style.display='none';
  try{ setPresenceOnline(); }catch(e){}
  console.log("✅ CLIENT SAAS LOGIN:", pin, patronData.nom);
  location.reload();
}

export function logoutPat(){
  try{ setPresenceOffline(); }catch(e){}
  sessionStorage.clear();
  localStorage.clear();
  firebase.auth().signOut().finally(()=>location.reload());
}

window.lockApp = function(){
  try{ setPresenceOffline(); }catch(e){}
  sessionStorage.clear();
  document.getElementById('loginPat').style.display='flex';
  document.getElementById('msgPat').innerText='🔒 Verrouillé - Entrez votre PIN';
  document.getElementById('msgPat').style.color='#f59e0b';
  if(window.db) firebase.database().ref().off();
  console.log("🔒 App verrouillée manuellement");
}

window.loginPat = loginPat;
window.logoutPat = logoutPat;
console.log("✅ auth.js V6.7 SECURE ORDI COMMUN CHARGÉ");
