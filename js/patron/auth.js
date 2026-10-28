// js/patron/auth.js - PATRON V6.1 FIX LOGIN SÉCURISÉ - SANS CACHE
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';

export async function loginPat(){
  let pinEl = document.getElementById('pinPat');
  let emailEl = document.getElementById('emailPat');
  let passEl = document.getElementById('passPat');
  let msgEl = document.getElementById('msgPat');
  
  // ===== MODE 1: SUPERADMIN EMAIL/PASSWORD =====
  if(emailEl && emailEl.value.trim() && passEl && passEl.value.trim()){
    let email = emailEl.value.trim();
    let pass = passEl.value.trim();
    if(msgEl) { msgEl.style.color='#f59e0b'; msgEl.innerText='Connexion SuperAdmin...'; }
    try{
      let cred = await firebase.auth().signInWithEmailAndPassword(email, pass);
      let uid = cred.user.uid;
      let snap = await window.db.ref('superadmins/'+uid).once('value');
      if(snap.exists() && snap.val()===true){
        STATE.CURRENT_VENDEUR = { pin: 'SUPERADMIN', nom: 'DG SUPRÊME', email, uid, isAdmin:true, isSuperAdmin:true };
        window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
        localStorage.setItem('patron_session', JSON.stringify({ uid, email, isSuperAdmin:true, ts: Date.now() }));
        localStorage.setItem('BATEKE_PIN', 'SUPERADMIN');
        localStorage.setItem('BATEKE_ROLE', 'superadmin');
        document.getElementById('loginPat').style.display='none';
        console.log("✅ SUPERADMIN LOGIN:", email, uid);
        if(typeof window.initShops === 'function') window.initShops(); else location.reload();
        return;
      }else{
        if(msgEl) { msgEl.style.color='red'; msgEl.innerText='Accès refusé: pas SuperAdmin'; }
        await firebase.auth().signOut();
        return;
      }
    }catch(e){
      if(msgEl) { msgEl.style.color='red'; msgEl.innerText='Erreur login: '+e.message; }
      return;
    }
  }

  // ===== MODE 2: PIN - VÉRIFICATION FIREBASE OBLIGATOIRE =====
  let pin = pinEl?.value?.trim();
  if(!pin){ if(msgEl) { msgEl.style.color='red'; msgEl.innerText='PIN requis'; } return; }
  if(msgEl) { msgEl.style.color='#f59e0b'; msgEl.innerText='Vérification PIN '+pin+' dans Firebase...'; }

  try{ if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously(); }catch(e){}

  // 1. Vérifie PATRON dans Firebase - SEULE SOURCE DE VÉRITÉ
  let patronData = null;
  try{
    let snap = await window.db.ref('patrons/'+pin).once('value');
    if(snap.exists()) patronData = snap.val();
  }catch(e){ console.warn("Firebase patron check:", e.message); }

  if(patronData){
    if(patronData.actif===false){ if(msgEl) { msgEl.style.color='red'; msgEl.innerText='PIN bloqué'; } return; }
    STATE.CURRENT_VENDEUR = { pin, nom: patronData.nom||'PATRON', ...patronData, isAdmin:true };
    window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
    localStorage.setItem('patron_pin', pin);
    localStorage.setItem('BATEKE_PIN', pin);
    localStorage.setItem('pin', pin);
    localStorage.setItem('BATEKE_ROLE', 'patron');
    localStorage.setItem('patron_session', JSON.stringify({ pin, ts: Date.now() }));
    document.getElementById('loginPat').style.display='none';
    try{ setPresenceOnline(); }catch(e){}
    console.log("✅ PATRON PIN LOGIN:", patronData.nom, pin);
    if(typeof window.initShops === 'function') window.initShops(); else location.reload();
    return;
  }

  // 2. Vérifie VENDEUR dans tous les shops
  try{
    let shopsSnap = await window.db.ref('shops').once('value');
    let shops = shopsSnap.val()||{};
    for(const shopName in shops){
      const vendeurs = shops[shopName].vendeurs||{};
      for(const vKey in vendeurs){
        const v = vendeurs[vKey];
        const vPin = String(v.pin||v.PIN||vKey);
        if(vPin===pin){
          if(v.actif===false){ if(msgEl) { msgEl.style.color='red'; msgEl.innerText='❌ Vendeur désactivé'; } return; }
          STATE.CURRENT_VENDEUR = { pin, nom: v.nom||vKey, boutique: shopName, isAdmin:false };
          window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
          localStorage.setItem('BATEKE_PIN', pin);
          localStorage.setItem('pin', pin);
          localStorage.setItem('BATEKE_ROLE', 'vendeur');
          localStorage.setItem('BATEKE_SHOP', shopName);
          localStorage.setItem('BATEKE_BOUTIQUE', shopName);
          document.getElementById('loginPat').style.display='none';
          console.log("✅ VENDEUR LOGIN:", v.nom, shopName);
          location.href='vendeur/';
          return;
        }
      }
    }
  }catch(e){ console.warn("Check vendeur:", e.message); }

  // 3. INTROUVABLE = BLOQUÉ - SUPPRIME CACHE DANGEREUX
  console.log("❌ PIN "+pin+" INTROUVABLE");
  localStorage.removeItem('bateke_patrons_cache');
  localStorage.removeItem('BATEKE_PIN');
  localStorage.removeItem('pin');
  localStorage.removeItem('patron_pin');
  localStorage.removeItem('patron_session');
  if(msgEl) { msgEl.style.color='red'; msgEl.innerText='❌ PIN '+pin+' INTROUVABLE - N\'existe pas'; }
}

export function logoutPat(){
  try{ setPresenceOffline(); }catch(e){}
  localStorage.removeItem('patron_session');
  localStorage.removeItem('BATEKE_PIN');
  localStorage.removeItem('pin');
  localStorage.removeItem('patron_pin');
  localStorage.removeItem('BATEKE_ROLE');
  localStorage.removeItem('bateke_patrons_cache'); // SUPPRIME CACHE
  firebase.auth().signOut().finally(()=>location.reload());
}

window.loginPat = loginPat;
window.logoutPat = logoutPat;
console.log("auth.js PATRON V6.1 FIX LOGIN SÉCURISÉ OK - SANS CACHE");
