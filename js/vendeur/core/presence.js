// js/vendeur/core/presence.js
import { STATE } from './state.js';
import { saveStockCache } from './offline.js';

export function setPresenceOnline(){
  if(!STATE.CURRENT_VENDEUR?.pin) return;
  if(!STATE.IS_ONLINE || !STATE.FIREBASE_CONNECTED) return;
  let pin=STATE.CURRENT_VENDEUR.pin; let nom=STATE.CURRENT_VENDEUR.nom||pin;
  let ref=window.db.ref('shops/'+STATE.SHOP+'/presence/'+pin);
  STATE.PRESENCE_REF=ref; ref.set({online:true,lastSeen:Date.now(),nom,pin,shop:STATE.SHOP});
  ref.onDisconnect().set({online:false,lastSeen:Date.now(),nom,pin,shop:STATE.SHOP});
  if(STATE.HEARTBEAT_TIMER) clearInterval(STATE.HEARTBEAT_TIMER);
  STATE.HEARTBEAT_TIMER=setInterval(()=>{ if(STATE.IS_ONLINE) ref.update({lastSeen:Date.now(),online:true}); },60000);
  logPresence('LOGIN');
}
export function setPresenceOffline(){
  try{
    if(STATE.PRESENCE_REF){ STATE.PRESENCE_REF.update({online:false,lastSeen:Date.now()}); STATE.PRESENCE_REF.onDisconnect().cancel(); }
    else if(STATE.CURRENT_VENDEUR?.pin) window.db.ref('shops/'+STATE.SHOP+'/presence/'+STATE.CURRENT_VENDEUR.pin).update({online:false,lastSeen:Date.now()});
  }catch(e){}
  if(STATE.HEARTBEAT_TIMER){ clearInterval(STATE.HEARTBEAT_TIMER); STATE.HEARTBEAT_TIMER=null; }
  logPresence('LOGOUT');
}
export function logPresence(type, extra){
  if(!STATE.CURRENT_VENDEUR?.pin || !STATE.FIREBASE_CONNECTED) return;
  let payload={ts:Date.now(),type,date:new Date().toISOString(),vendeur:STATE.CURRENT_VENDEUR.nom||STATE.CURRENT_VENDEUR.pin,pin:STATE.CURRENT_VENDEUR.pin,shop:STATE.SHOP};
  if(extra) payload.extra=extra;
  window.db.ref('shops/'+STATE.SHOP+'/presence_logs/'+Date.now()+'_'+STATE.CURRENT_VENDEUR.pin).set(payload);
}
export function cleanupOldLogs(){ /* garde 7 jours */ }
window.setPresenceOnline=setPresenceOnline; window.setPresenceOffline=setPresenceOffline;
