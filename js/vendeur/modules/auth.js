// js/vendeur/modules/auth.js
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';
import { updateOfflineUI, syncOfflineQueue } from '../core/offline.js';

export function doLogin(){
  let pin=document.getElementById('pinInput')?.value?.trim();
  if(!pin){ document.getElementById('loginMsg').innerText='PIN requis'; return; }
  if(STATE.BLOCKED_PINS_CACHE.includes(pin)){ alert('🚫 Accès révoqué'); return; }
  window.db.ref('shops/'+STATE.SHOP+'/vendeurs/'+pin).once('value').then(snap=>{
    let v=snap.val();
    if(!v || v.actif===false){ document.getElementById('loginMsg').innerText='PIN invalide ou bloqué'; return; }
    STATE.CURRENT_VENDEUR={pin, nom:v.nom||pin, ...v};
    window.CURRENT_VENDEUR=STATE.CURRENT_VENDEUR;
    localStorage.setItem('vendeur_session_'+STATE.SHOP, JSON.stringify({pin, ts:Date.now()}));
    document.getElementById('loginOverlay').style.display='none';
    document.getElementById('authStatus').innerText='✅ '+v.nom;
    setPresenceOnline();
    if(STATE.FIREBASE_CONNECTED) syncOfflineQueue();
  }).catch(e=>{
    // OFFLINE fallback
    let cached=JSON.parse(localStorage.getItem('bateke_vendeurs_'+STATE.SHOP)||'[]');
    let found=cached.find(x=>x.pin===pin);
    if(found){ STATE.CURRENT_VENDEUR={pin, nom:found.nom}; window.CURRENT_VENDEUR=STATE.CURRENT_VENDEUR; document.getElementById('loginOverlay').style.display='none'; }
    else document.getElementById('loginMsg').innerText='Hors ligne - PIN inconnu';
  });
}
export function logoutAll(){ setPresenceOffline(); localStorage.removeItem('vendeur_session_'+STATE.SHOP); location.reload(); }
export function checkSession(){
  let sess=JSON.parse(localStorage.getItem('vendeur_session_'+STATE.SHOP)||'null');
  if(sess && (Date.now()-sess.ts)<12*60*60*1000){ document.getElementById('pinInput').value=sess.pin; doLogin(); }
}
window.doLogin=doLogin; window.logoutAll=logoutAll;
console.log("auth.js chargé");
