// js/vendeur/core/presence.js
import { STATE } from './state.js';
export function setPresenceOnline(){
  if(!STATE.CURRENT_VENDEUR?.pin) return;
  let pin=STATE.CURRENT_VENDEUR.pin; let nom=STATE.CURRENT_VENDEUR.nom||pin;
  let ref=window.db.ref('shops/'+STATE.SHOP+'/presence/'+pin);
  STATE.PRESENCE_REF=ref; window.PRESENCE_REF=ref;
  ref.set({online:true,lastSeen:Date.now(),nom,pin,shop:STATE.SHOP});
  ref.onDisconnect().set({online:false,lastSeen:Date.now(),nom,pin,shop:STATE.SHOP});
}
export function setPresenceOffline(){ try{ if(STATE.PRESENCE_REF) STATE.PRESENCE_REF.update({online:false,lastSeen:Date.now()}); }catch(e){} }
window.setPresenceOnline=setPresenceOnline; window.setPresenceOffline=setPresenceOffline;
