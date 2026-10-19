// js/vendeur/core/offline.js - Cache 12h + Queue
import { STATE } from './state.js';
const CACHE_DURATION = 12*60*60*1000;

export function isCacheExpired(){
  let ts = parseInt(localStorage.getItem('bateke_cache_ts_'+STATE.SHOP)||'0');
  return !ts || (Date.now()-ts) > CACHE_DURATION;
}
export function saveStockCache(){
  localStorage.setItem('bateke_stock_'+STATE.SHOP, JSON.stringify(STATE.STOCK));
  localStorage.setItem('bateke_cache_ts_'+STATE.SHOP, Date.now().toString());
  window.OFFLINE_STOCK_CACHE = STATE.STOCK;
}
export function saveQueue(){
  localStorage.setItem('offline_queue_'+STATE.SHOP, JSON.stringify(STATE.OFFLINE_QUEUE));
  window.OFFLINE_QUEUE = STATE.OFFLINE_QUEUE;
}
export function saveShopsCache(list){
  localStorage.setItem('bateke_shops', JSON.stringify(list));
}
export function saveBlockedCache(){
  localStorage.setItem('blocked_pins_'+STATE.SHOP, JSON.stringify(STATE.BLOCKED_PINS_CACHE));
}
export function updateOfflineUI(){
  let q = STATE.OFFLINE_QUEUE.length;
  let badge = document.getElementById('offlineBadge');
  let qInfo = document.getElementById('queueInfo');
  if(qInfo) qInfo.innerText = q ? `🔴 OFFLINE - ${q} en attente` : `🟢 SYNC OK - ${STATE.STOCK.length} articles`;
  if(badge){
    if(isCacheExpired()){ badge.style.background='#000'; badge.innerText='⚠️ CACHE EXPIRE'; }
    else if(!STATE.IS_ONLINE || !STATE.FIREBASE_CONNECTED){ badge.style.background='#ef4444'; badge.innerText = q?`🔴 OFFLINE ${q}`:'🔴 HORS LIGNE'; }
    else if(q>0){ badge.style.background='#facc15'; badge.innerText=`🟡 SYNC ${q}...`; }
    else{ badge.style.background='#22c55e'; badge.innerText='🟢 SYNC OK'; }
  }
  let src = document.getElementById('stockSource');
  if(src) src.innerText = (!STATE.IS_ONLINE || !STATE.FIREBASE_CONNECTED) ? 'LOCAL OFFLINE' : 'SERVEUR';
}
export async function syncOfflineQueue(){
  if(!STATE.IS_ONLINE || !STATE.FIREBASE_CONNECTED) return;
  if(!STATE.OFFLINE_QUEUE.length) return;
  let remaining=[];
  for(let item of STATE.OFFLINE_QUEUE){
    try{
      if(item.type==='vente'){
        let snap=await window.db.ref('shops/'+item.shop+'/vendeurs/'+(item.data.vendeurPin||'')).once('value');
        if(!snap.val() || snap.val().actif===false) continue;
        await window.db.ref('shops/'+item.shop+'/ventes/'+item.id).set(item.data);
        if(item.stockUpdates) for(let u of item.stockUpdates) await window.db.ref('shops/'+item.shop+'/stock/'+u.CODE).update({Quantite:u.newQte});
      } else if(item.type==='depense') await window.db.ref('shops/'+item.shop+'/depenses/'+item.id).set(item.data);
      else if(item.type==='versement') await window.db.ref('shops/'+item.shop+'/versements/'+item.id).set(item.data);
      else if(item.type==='entree'){
        await window.db.ref('shops/'+item.shop+'/stock/'+item.CODE).update({Quantite:item.newQte});
        await window.db.ref('shops/'+item.shop+'/entrees/'+item.id).set(item.data);
      }
    }catch(e){ remaining.push(item); }
  }
  STATE.OFFLINE_QUEUE=remaining; saveQueue(); updateOfflineUI();
}
window.isCacheExpired=isCacheExpired; window.saveStockCache=saveStockCache; window.saveQueue=saveQueue;
window.updateOfflineUI=updateOfflineUI; window.syncOfflineQueue=syncOfflineQueue;
console.log("offline.js chargé - Cache 12h OK");
