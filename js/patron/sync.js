import { STATE, db, esc } from '../core/state.js';

export function savePatronCache(){try{localStorage.setItem('patron_cache_'+STATE.SHOP, JSON.stringify({shops:STATE.SHOPS_LIST,data:STATE.ALL_DATA,config:STATE.CURRENT_CONFIG}));localStorage.setItem('patron_cache_global',JSON.stringify({shops:STATE.SHOPS_LIST}));}catch(e){}}
export function loadPatronCache(){try{let c=JSON.parse(localStorage.getItem('patron_cache_'+STATE.SHOP)||'null');if(c&&c.data){STATE.ALL_DATA=c.data;STATE.SHOPS_LIST=c.shops||STATE.SHOPS_LIST;if(c.config)STATE.CURRENT_CONFIG={...STATE.CURRENT_CONFIG,...c.config};syncWindow();return true;}}catch(e){}return false;}
function syncWindow(){window.SHOP=STATE.SHOP;window.SHOPS_LIST=STATE.SHOPS_LIST;window.ALL_DATA=STATE.ALL_DATA;window.CURRENT_CONFIG=STATE.CURRENT_CONFIG;}

export function getFiltered(){
  if(STATE.SHOP==='ALL'){
    let agg={ventes:[],dep:[],vers:[],stock:[],entrees:[]};
    STATE.SHOPS_LIST.forEach(s=>{let d=STATE.ALL_DATA[s]||{};agg.ventes=[...agg.ventes,...(d.ventes||[])];agg.dep=[...agg.dep,...(d.dep||[])];agg.stock=[...agg.stock,...(d.stock||[])];agg.entrees=[...agg.entrees,...(d.entrees||[]).map(e=>({...e,_shop:s}))];});
    return agg;
  }else{
    let d=STATE.ALL_DATA[STATE.SHOP]||{ventes:[],dep:[],vers:[],stock:[],entrees:[]};
    return {...d,vers:(d.vers||[]).map(v=>({...v,_shop:STATE.SHOP})),entrees:(d.entrees||[]).map(e=>({...e,_shop:STATE.SHOP}))};
  }
}

export function listenShop(s){
  db.ref('shops/'+s+'/stock').on('value',snap=>{STATE.ALL_DATA[s].stock=Object.values(snap.val()||{});savePatronCache();syncWindow();if(STATE.SHOP===s||STATE.SHOP==='ALL'){if(window.renderStock)window.renderStock();if(window.renderAchatStock)window.renderAchatStock();if(window.updateKPIs)window.updateKPIs();}});
  db.ref('shops/'+s+'/ventes').on('value',snap=>{let raw=snap.val()||{};STATE.ALL_DATA[s].ventes=Object.entries(raw).map(([k,v])=>({...v,_id:k,_shop:s}));savePatronCache();if(STATE.SHOP===s||STATE.SHOP==='ALL'){if(window.renderVentes)window.renderVentes();if(window.updateKPIs)window.updateKPIs();}});
  db.ref('shops/'+s+'/depenses').on('value',snap=>{let raw=snap.val()||{};STATE.ALL_DATA[s].dep=Object.entries(raw).map(([k,v])=>({...v,_id:k}));savePatronCache();});
  db.ref('shops/'+s+'/entrees').on('value',snap=>{let raw=snap.val()||{};STATE.ALL_DATA[s].entrees=Object.entries(raw).map(([k,v])=>({...v,_id:k,_shop:s}));savePatronCache();});
  db.ref('shops/'+s+'/vendeurs').on('value',snap=>{STATE.ALL_DATA[s].vendeurs=snap.val()||{};savePatronCache();if(STATE.SHOP===s&&window.renderVendeurs)window.renderVendeurs();});
  db.ref('shops/'+s+'/presence').on('value',snap=>{STATE.ALL_DATA[s].presence=snap.val()||{};savePatronCache();if(window.renderPresenceKPI)window.renderPresenceKPI();});
  db.ref('shops/'+s+'/versements').on('value',snap=>{let raw=snap.val()||{};STATE.ALL_DATA[s].vers=Object.entries(raw).map(([k,v])=>({...v,_id:k}));savePatronCache();});
}

export function initShops(){
  db.ref('shops').on('value',snap=>{
    let data=snap.val()||{};STATE.SHOPS_LIST=Object.keys(data);if(!STATE.SHOPS_LIST.length)STATE.SHOPS_LIST=['Menkao1','Menkao2','Mbakana','Itendance'];
    STATE.SHOPS_LIST.forEach(s=>{if(!STATE.ALL_DATA[s])STATE.ALL_DATA[s]={ventes:[],dep:[],vers:[],stock:[],entrees:[],clients:{},vendeurs:{},presence:{},logs:{}};listenShop(s);});
    document.getElementById('shopSel').innerHTML=STATE.SHOPS_LIST.map(s=>`<option ${s===STATE.SHOP?'selected':''} value="${s}">${s}</option>`).join('')+'<option value="ALL">TOUTES</option>';
    syncWindow(); if(window.renderBoutiques)window.renderBoutiques(data); if(window.refreshAll)window.refreshAll(); if(window.loadConfig)window.loadConfig(); savePatronCache();
  });
}

export function initShopsOffline(){
  let cg=JSON.parse(localStorage.getItem('patron_cache_global')||'null');if(cg&&cg.shops)STATE.SHOPS_LIST=cg.shops;if(!STATE.SHOPS_LIST.length)STATE.SHOPS_LIST=['Menkao1','Menkao2','Mbakana','Itendance'];
  STATE.SHOPS_LIST.forEach(s=>{if(!STATE.ALL_DATA[s])STATE.ALL_DATA[s]={ventes:[],dep:[],vers:[],stock:[],entrees:[],clients:{},vendeurs:{},presence:{},logs:{}};});
  syncWindow();
}

window.getFiltered=getFiltered; window.listenShop=listenShop; window.initShops=initShops; window.initShopsOffline=initShopsOffline;
window.savePatronCache=savePatronCache; window.loadPatronCache=loadPatronCache;
