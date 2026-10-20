// js/vendeur/core/offline.js - Cache 12H V5.6.4 APP CHECK
import { STATE } from './state.js';

const CACHE_VERSION = 'v5.6.4-appcheck-20261020'; // 👈 BUMP VERSION FORCE MAJ
const CACHE_NAME = 'bateke-' + CACHE_VERSION;
const CACHE_12H=12*60*60*1000;

export function isCacheExpired(){ 
  let ts=parseInt(localStorage.getItem('bateke_cache_ts_'+STATE.SHOP)||'0'); 
  // Force expiration si ancienne version
  let savedVer = localStorage.getItem('bateke_cache_version_'+STATE.SHOP);
  if(savedVer !== CACHE_VERSION) return true;
  return !ts || (Date.now()-ts)>CACHE_12H; 
}

export function saveStockCache(){ 
  localStorage.setItem('bateke_stock_'+STATE.SHOP, JSON.stringify(STATE.STOCK)); 
  localStorage.setItem('bateke_cache_ts_'+STATE.SHOP, Date.now().toString()); 
  localStorage.setItem('bateke_cache_version_'+STATE.SHOP, CACHE_VERSION); // 👈 sauve version
}

export function saveQueue(){ localStorage.setItem('offline_queue_'+STATE.SHOP, JSON.stringify(STATE.OFFLINE_QUEUE)); window.OFFLINE_QUEUE=STATE.OFFLINE_QUEUE; }

export function updateOfflineUI(){
  let q=STATE.OFFLINE_QUEUE.length; let badge=document.getElementById('offlineBadge'); let qInfo=document.getElementById('queueInfo');
  if(qInfo) qInfo.innerText= q ? `🔴 OFFLINE ${q} en attente` : `🟢 SYNC ${CACHE_VERSION} - ${STATE.STOCK.length} articles`;
  if(badge){ if(isCacheExpired()){ badge.style.background='#000'; badge.innerText='⚠️ CACHE EXPIRE V5.6.4'; } else if(!STATE.IS_ONLINE||!STATE.FIREBASE_CONNECTED){ badge.style.background='#ef4444'; badge.innerText= q?`🔴 OFFLINE ${q}`:'🔴 HORS LIGNE'; } else if(q>0){ badge.style.background='#facc15'; badge.innerText=`🟡 SYNC ${q}...`; } else { badge.style.background='#22c55e'; badge.innerText='🟢 SYNC OK '+CACHE_VERSION; } }
  let src=document.getElementById('stockSource'); if(src) src.innerText= (!STATE.IS_ONLINE||!STATE.FIREBASE_CONNECTED)?'LOCAL OFFLINE':'SERVEUR';
}

export async function syncOfflineQueue(){
  if(!STATE.IS_ONLINE||!STATE.FIREBASE_CONNECTED||!STATE.OFFLINE_QUEUE.length) return;
  let rem=[]; 
  for(let item of STATE.OFFLINE_QUEUE){ 
    try{
      if(item.type==='vente'){ let snap=await window.db.ref('shops/'+item.shop+'/vendeurs/'+(item.data.vendeurPin||'')).once('value'); if(!snap.val()||snap.val().actif===false) continue; await window.db.ref('shops/'+item.shop+'/ventes/'+item.id).set(item.data); if(item.stockUpdates) for(let u of item.stockUpdates) await window.db.ref('shops/'+item.shop+'/stock/'+u.CODE).update({Quantite:u.newQte}); }
      else if(item.type==='depense') await window.db.ref('shops/'+item.shop+'/depenses/'+item.id).set(item.data);
      else if(item.type==='versement') await window.db.ref('shops/'+item.shop+'/versements/'+item.id).set(item.data);
      else if(item.type==='entree'){ await window.db.ref('shops/'+item.shop+'/stock/'+item.CODE).update({Quantite:item.newQte}); await window.db.ref('shops/'+item.shop+'/entrees/'+item.id).set(item.data); }
    }catch(e){ rem.push(item); } 
  }
  STATE.OFFLINE_QUEUE=rem; saveQueue(); updateOfflineUI();
}

window.updateOfflineUI=updateOfflineUI; 
window.syncOfflineQueue=syncOfflineQueue; 
window.saveStockCache=saveStockCache;
window.CACHE_VERSION = CACHE_VERSION;
console.log("offline.js V5.6.4 APP CHECK chargé - Cache 12h OK -", CACHE_VERSION);

// Auto-clear si version différente - FORCE MAJ TECNO
(function autoClearOldCache(){
  let saved = localStorage.getItem('bateke_global_version');
  if(saved !== CACHE_VERSION){
    console.log(`🔄 Mise à jour cache ${saved} -> ${CACHE_VERSION}`);
    localStorage.setItem('bateke_global_version', CACHE_VERSION);
    // Ne supprime pas le stock, juste force re-sync
    localStorage.setItem('bateke_cache_ts_'+STATE.SHOP, '0');
  }
})();
