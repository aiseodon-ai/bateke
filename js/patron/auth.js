// js/patron/auth.js - PATRON V5.6.5 SECURE + APP CHECK + FIX 7832
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';

const PATRON_CACHE_KEY = 'bateke_patrons_cache';
const CACHE_VERSION = 'v5.6.5-patron-7832';

export async function loginPat(){
  let pinEl = document.getElementById('pinPat');
  let msgEl = document.getElementById('msgPat');
  let pin = pinEl?.value?.trim();
  if(!pin){ if(msgEl) msgEl.innerText='PIN requis'; return; }
  if(msgEl) msgEl.innerText='Vérification...';

  // Force anonymous auth pour AppCheck
  try{
    if(!firebase.auth().currentUser){
      await firebase.auth().signInAnonymously();
      console.log("✅ Anon auth OK pour patron");
    }
  }catch(e){ console.warn("Anon auth", e.message); }

  // ========== 1. CHECK /patrons/{pin} - FORCE FIREBASE DIRECT ==========
  let patronData = null;
  try{
    let snap = await window.db.ref('patrons/'+pin).once('value');
    if(snap.exists()) patronData = snap.val();
  }catch(e){
    console.warn("Firebase patron read fail, try cache", e.message);
  }
  
  // Fallback cache offline
  if(!patronData){
    try{
      let cached = JSON.parse(localStorage.getItem(PATRON_CACHE_KEY)||'{}');
      if(cached[pin] && cached[pin].actif!==false) patronData = cached[pin];
    }catch(e){}
  }

  if(!patronData){
    if(msgEl) msgEl.innerText='PIN invalide: '+pin+' (pas dans /patrons/)';
    console.error("❌ Patron", pin, "introuvable dans Firebase /patrons/");
    return;
  }
  if(patronData.actif===false){
    if(msgEl) msgEl.innerText='PIN bloqué - Contacte DG';
    return;
  }

  // Cache pour 12h offline
  try{
    let cache = JSON.parse(localStorage.getItem(PATRON_CACHE_KEY)||'{}');
    cache[pin]=patronData;
    localStorage.setItem(PATRON_CACHE_KEY, JSON.stringify(cache));
  }catch(e){}

  // LOGIN OK
  STATE.CURRENT_VENDEUR = { pin, nom: patronData.nom||'PATRON', ...patronData, isAdmin:true };
  window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
  localStorage.setItem('patron_pin', pin);
  localStorage.setItem('patron_nom', patronData.nom||'PATRON');
  localStorage.setItem('patron_session', JSON.stringify({ pin, ts: Date.now() }));

  let loginDiv = document.getElementById('loginPat');
  if(loginDiv) loginDiv.style.display='none';
  if(msgEl) msgEl.innerText='';

  try{ setPresenceOnline(); }catch(e){}
  try{ window.db.ref('patrons/'+pin).update({ lastLogin: Date.now() }); }catch(e){}

  console.log("✅ PATRON SECURISE LOGIN:", patronData.nom, "PIN:", pin);
  
  // Lance l'init shops
  if(typeof window.initShops === 'function') window.initShops();
  else if(typeof window.loadShops === 'function') window.loadShops();
  else location.reload();
}

export function logoutPat(){
  try{ setPresenceOffline(); }catch(e){}
  localStorage.removeItem('patron_session');
  location.reload();
}

window.loginPat = loginPat;
window.logoutPat = logoutPat;
console.log("auth.js PATRON V5.6.5 FIX 7832 OK -", CACHE_VERSION);
