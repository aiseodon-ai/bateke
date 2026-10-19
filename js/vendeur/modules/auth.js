// js/vendeur/modules/auth.js
import { STATE } from '../core/state.js';
import { setPresenceOnline } from '../core/presence.js';
export function doLogin(){
  let pin=document.getElementById('pinInput')?.value?.trim(); if(!pin){ document.getElementById('loginMsg').innerText='PIN requis'; return; }
  window.db.ref('shops/'+STATE.SHOP+'/vendeurs/'+pin).once('value').then(snap=>{
    let v=snap.val(); if(!v||v.actif===false){ document.getElementById('loginMsg').innerText='PIN invalide ou bloqué'; return; }
    STATE.CURRENT_VENDEUR={pin, nom:v.nom||pin, ...v}; window.CURRENT_VENDEUR=STATE.CURRENT_VENDEUR;
    localStorage.setItem('vendeur_session_'+STATE.SHOP, JSON.stringify({pin, ts:Date.now()}));
    document.getElementById('loginOverlay').style.display='none';
    document.getElementById('vendeurName').innerText=v.nom; document.getElementById('shopName').innerText=STATE.SHOP;
    setPresenceOnline();
  }).catch(e=>{ document.getElementById('loginMsg').innerText='Erreur: '+e.message; });
}
export function logoutAll(){ try{ if(STATE.PRESENCE_REF) STATE.PRESENCE_REF.update({online:false,lastSeen:Date.now()}); }catch(e){} localStorage.removeItem('vendeur_session_'+STATE.SHOP); location.reload(); }
export function switchShop(){ let sel=document.getElementById('shopSel')?.value; if(sel){ localStorage.setItem('vendeur_shop', sel); location.href='?shop='+encodeURIComponent(sel); } }
window.doLogin=doLogin; window.logoutAll=logoutAll; window.switchShop=switchShop;
console.log("auth.js chargé");
