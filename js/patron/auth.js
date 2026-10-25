// js/patron/auth.js - PATRON V6.0 SAAS SUPERADMIN + PIN LEGACY
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';

const PATRON_CACHE_KEY = 'bateke_patrons_cache';

export async function loginPat(){
  let pinEl = document.getElementById('pinPat');
  let emailEl = document.getElementById('emailPat');
  let passEl = document.getElementById('passPat');
  let msgEl = document.getElementById('msgPat');
  
  // ===== MODE 1: SUPERADMIN EMAIL/PASSWORD (NOUVEAU SAAS) =====
  if(emailEl && emailEl.value.trim() && passEl && passEl.value.trim()){
    let email = emailEl.value.trim();
    let pass = passEl.value.trim();
    if(msgEl) msgEl.innerText='Connexion SuperAdmin...';
    try{
      let cred = await firebase.auth().signInWithEmailAndPassword(email, pass);
      let uid = cred.user.uid;
      // Vérifie si superadmin
      let snap = await window.db.ref('superadmins/'+uid).once('value');
      if(snap.exists() && snap.val()===true){
        STATE.CURRENT_VENDEUR = { pin: 'SUPERADMIN', nom: 'DG SUPRÊME', email, uid, isAdmin:true, isSuperAdmin:true };
        window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
        localStorage.setItem('patron_session', JSON.stringify({ uid, email, isSuperAdmin:true, ts: Date.now() }));
        document.getElementById('loginPat').style.display='none';
        console.log("✅ SUPERADMIN LOGIN:", email, uid);
        if(typeof window.initShops === 'function') window.initShops(); else location.reload();
        return;
      }else{
        if(msgEl) msgEl.innerText='Accès refusé: pas SuperAdmin';
        await firebase.auth().signOut();
        return;
      }
    }catch(e){
      if(msgEl) msgEl.innerText='Erreur login: '+e.message;
      return;
    }
  }

  // ===== MODE 2: PIN LEGACY (ANCIENS PATRONS) =====
  let pin = pinEl?.value?.trim();
  if(!pin){ if(msgEl) msgEl.innerText='PIN ou Email requis'; return; }
  if(msgEl) msgEl.innerText='Vérification PIN...';

  try{ if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously(); }catch(e){}

  let patronData = null;
  try{
    let snap = await window.db.ref('patrons/'+pin).once('value');
    if(snap.exists()) patronData = snap.val();
  }catch(e){ console.warn(e.message); }

  if(!patronData){
    try{
      let cached = JSON.parse(localStorage.getItem(PATRON_CACHE_KEY)||'{}');
      if(cached[pin] && cached[pin].actif!==false) patronData = cached[pin];
    }catch(e){}
  }

  if(!patronData){ if(msgEl) msgEl.innerText='PIN invalide: '+pin; return; }
  if(patronData.actif===false){ if(msgEl) msgEl.innerText='PIN bloqué'; return; }

  STATE.CURRENT_VENDEUR = { pin, nom: patronData.nom||'PATRON', ...patronData, isAdmin:true };
  window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
  localStorage.setItem('patron_pin', pin);
  localStorage.setItem('patron_session', JSON.stringify({ pin, ts: Date.now() }));
  document.getElementById('loginPat').style.display='none';
  try{ setPresenceOnline(); }catch(e){}
  console.log("✅ PATRON PIN LOGIN:", patronData.nom);
  if(typeof window.initShops === 'function') window.initShops(); else location.reload();
}

export function logoutPat(){
  try{ setPresenceOffline(); }catch(e){}
  localStorage.removeItem('patron_session');
  firebase.auth().signOut().finally(()=>location.reload());
}

window.loginPat = loginPat;
window.logoutPat = logoutPat;
console.log("auth.js PATRON V6.0 SAAS OK");
