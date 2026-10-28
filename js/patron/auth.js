// js/patron/auth.js - V6.5 FIX DEFINITIF - BLOQUE PIN FICTIF
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';

export async function loginPat(){
  let pinEl = document.getElementById('pinPat');
  let emailEl = document.getElementById('emailPat');
  let passEl = document.getElementById('passPat');
  let msgEl = document.getElementById('msgPat');
  let modeEmailDiv = document.getElementById('modeEmail');
  
  // DÉTECTE VRAI MODE PAR DISPLAY, PAS PAR VALUE
  let isEmailMode = modeEmailDiv && modeEmailDiv.style.display !== 'none';

  // ===== MODE SAAS =====
  if(isEmailMode){
    let email = emailEl?.value?.trim();
    let pass = passEl?.value?.trim();
    if(!email || !pass){ if(msgEl){msgEl.style.color='red'; msgEl.innerText='Email/mdp requis';} return; }
    msgEl.style.color='#f59e0b'; msgEl.innerText='Connexion SuperAdmin...';
    try{
      let cred = await firebase.auth().signInWithEmailAndPassword(email, pass);
      let uid = cred.user.uid;
      let snap = await window.db.ref('superadmins/'+uid).once('value');
      // Si superadmins contient true ou si email est admin@bateke.com on autorise
      if((snap.exists() && snap.val()===true) || email==='admin@bateke.com'){
        STATE.CURRENT_VENDEUR = { pin:'SUPERADMIN', nom:'DG SUPRÊME', email, uid, isAdmin:true, isSuperAdmin:true };
        window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
        localStorage.setItem('BATEKE_PIN','SUPERADMIN');
        localStorage.setItem('BATEKE_ROLE','superadmin');
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

  // ===== MODE PIN - SÉCURISÉ SANS CACHE =====
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
      msgEl.innerText='❌ Active Auth Anonyme dans Firebase Console';
      return;
    }
  }

  // ❌ PLUS DE FALLBACK CACHE - C'ÉTAIT LA 2ÈME PASSOIRE
  // if(!patronData){ cached... } -> SUPPRIMÉ

  if(!patronData){ 
    msgEl.style.color='red'; 
    msgEl.innerText=`❌ PIN ${pin} INTROUVABLE`; 
    console.log(`🛑 PIN ${pin} bloqué`);
    localStorage.clear(); 
    return; 
  }
  if(patronData.actif===false){ msgEl.style.color='red'; msgEl.innerText='❌ PIN bloqué'; return; }

  STATE.CURRENT_VENDEUR = { pin, nom:patronData.nom||'PATRON', ...patronData, isAdmin:true };
  window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
  localStorage.setItem('BATEKE_PIN', pin);
  localStorage.setItem('BATEKE_ROLE','patron');
  localStorage.setItem('pin', pin);
  localStorage.setItem('patron_pin', pin);
  localStorage.setItem('patron_session', JSON.stringify({ pin, ts:Date.now() }));
  localStorage.setItem('BATEKE_BOUTIQUE', patronData.boutique||Object.keys(patronData.boutiques||{})[0]||'');
  document.getElementById('loginPat').style.display='none';
  try{ setPresenceOnline(); }catch(e){}
  console.log("✅ PATRON PIN LOGIN:", pin, patronData.nom);
  location.reload();
}

export function logoutPat(){
  try{ setPresenceOffline(); }catch(e){}
  localStorage.clear();
  firebase.auth().signOut().finally(()=>location.reload());
}

window.loginPat = loginPat;
window.logoutPat = logoutPat;
console.log("✅ auth.js V6.5 FIX DEFINITIF CHARGÉ - cache supprimé");
