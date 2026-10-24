// js/core/presence.js - PROD FIX 404
export function setPresenceOnline(){
  try{
    let shop = window.SHOP || localStorage.getItem('patron_shop') || 'Menkao1';
    let pin = localStorage.getItem('patron_pin') || 'patron';
    if(!window.db) return;
    let ref = window.db.ref(`shops/${shop}/presence/${pin}`);
    ref.set({ online:true, lastSeen: Date.now(), nom: localStorage.getItem('patron_nom')||pin });
    ref.onDisconnect().set({ online:false, lastSeen: Date.now() });
  }catch(e){}
}
export function setPresenceOffline(){
  try{
    let shop = window.SHOP || 'Menkao1';
    let pin = localStorage.getItem('patron_pin') || 'patron';
    window.db?.ref(`shops/${shop}/presence/${pin}`).set({ online:false, lastSeen: Date.now() });
  }catch(e){}
}
window.setPresenceOnline = setPresenceOnline;
window.setPresenceOffline = setPresenceOffline;
