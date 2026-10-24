// js/core/offline.js - PROD FIX 404
export function saveStockCache(shop, data){
  try{ localStorage.setItem(`stock_cache_${shop}`, JSON.stringify({ts:Date.now(), data})); }catch(e){}
}
export function getStockCache(shop){
  try{ return JSON.parse(localStorage.getItem(`stock_cache_${shop}`)||'null'); }catch(e){ return null; }
}
window.saveStockCache = saveStockCache;
