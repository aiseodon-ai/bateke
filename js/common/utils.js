// UTILS BATEKE - Fonctions globales extraites de ton patron 88.400 chars

export function esc(t){
  if(t===null||t===undefined) return '';
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function fmtVu(n){
  if(n===null||n===undefined) return '0 FC';
  return Number(n).toLocaleString('fr-FR') + ' FC';
}

export function savePatronCache(k, v){
  try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){}
}

export function loadPatronCache(k){
  try{ 
    const s = localStorage.getItem(k);
    return s ? JSON.parse(s) : null;
  }catch(e){ return null; }
}

export function saveStockCache(shop, data){
  savePatronCache(`stock_${shop}`, { data, ts: Date.now() });
}

export function updateLastAuth(){
  localStorage.setItem("lastAuth", Date.now().toString());
}

export function isCacheExpired(ts, hours=24){
  return !ts || (Date.now() - ts) > hours*3600*1000;
}

export function formatDate(ts){
  if(!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
}

export function genId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

// Expose en global pour ne rien casser
window.esc = esc;
window.fmtVu = fmtVu;
window.savePatronCache = savePatronCache;
window.loadPatronCache = loadPatronCache;
window.saveStockCache = saveStockCache;
window.formatDate = formatDate;
window.genId = genId;
