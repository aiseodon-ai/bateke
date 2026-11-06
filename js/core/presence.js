export function setPresenceOnline(){
  try{
    let shop = sessionStorage.getItem('DG_SUPPORT_SHOP') || window.SHOP || localStorage.getItem('BATEKE_BOUTIQUE') || localStorage.getItem('patron_shop') || 'Menkao1';
    let pin = sessionStorage.getItem('BATEKE_PIN') || sessionStorage.getItem('DG_SUPPORT_PID') || localStorage.getItem('BATEKE_PIN') || localStorage.getItem('patron_pin') || localStorage.getItem('BATEKE_LAST_PIN') || '7832';
    if(!window.db) return;
    let ref = window.db.ref(`shops/${shop}/presence/${pin}`);
    ref.set({ online:true, lastSeen: Date.now(), nom: localStorage.getItem('patron_nom')||pin });
    ref.onDisconnect().set({ online:false, lastSeen: Date.now() });
    console.log("✅ Presence Online:", shop, pin);
  }catch(e){ console.warn(e); }
}
export function setPresenceOffline(){
  try{
    let shop = sessionStorage.getItem('DG_SUPPORT_SHOP') || window.SHOP || 'Menkao1';
    let pin = sessionStorage.getItem('BATEKE_PIN') || 'patron';
    window.db?.ref(`shops/${shop}/presence/${pin}`).set({ online:false, lastSeen: Date.now() });
  }catch(e){}
}
window.setPresenceOnline = setPresenceOnline;
window.setPresenceOffline = setPresenceOffline;
