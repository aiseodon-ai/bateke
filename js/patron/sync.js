import { STATE, db, esc } from '../core/state.js';

export function savePatronCache(){
  try{
    localStorage.setItem('patron_cache_'+STATE.SHOP, JSON.stringify({shops:STATE.SHOPS_LIST,data:STATE.ALL_DATA,config:STATE.CURRENT_CONFIG}));
    localStorage.setItem('patron_cache_global', JSON.stringify({shops:STATE.SHOPS_LIST}));
  }catch(e){}
}
export function loadPatronCache(){
  try{
    let c=JSON.parse(localStorage.getItem('patron_cache_'+STATE.SHOP)||'null');
    if(c&&c.data){STATE.ALL_DATA=c.data;STATE.SHOPS_LIST=c.shops||STATE.SHOPS_LIST;if(c.config)STATE.CURRENT_CONFIG={...STATE.CURRENT_CONFIG,...c.config};sync();return true;}
  }catch(e){} return false;
}
function sync(){window.SHOP=STATE.SHOP;window.SHOPS_LIST=STATE.SHOPS_LIST;window.ALL_DATA=STATE.ALL_DATA;window.CURRENT_CONFIG=STATE.CURRENT_CONFIG;}

export function getFiltered(){
  if(STATE.SHOP==='ALL'){
    let agg={ventes:[],dep:[],vers:[],stock:[],entrees:[]};
    STATE.SHOPS_LIST.forEach(s=>{
      let d=STATE.ALL_DATA[s]||{};
      agg.ventes=agg.ventes.concat(d.ventes||[]);
      agg.dep=agg.dep.concat(d.dep||[]);
      agg.stock=agg.stock.concat(d.stock||[]);
      agg.entrees=agg.entrees.concat((d.entrees||[]).map(e=>({...e,_shop:s})));
    }); return agg;
  }else{
    let d=STATE.ALL_DATA[STATE.SHOP]||{ventes:[],dep:[],vers:[],stock:[],entrees:[]};
    return {...d,vers:(d.vers||[]).map(v=>({...v,_shop:STATE.SHOP})),entrees:(d.entrees||[]).map(e=>({...e,_shop:STATE.SHOP}))};
  }
}

export function listenShop(s){
  db.ref('shops/'+s+'/stock').on('value',snap=>{
    let v=snap.val()||{}; let arr=Array.isArray(v)?v:Object.values(v);
    if(arr.length>0){STATE.ALL_DATA[s].stock=arr; savePatronCache(); sync(); if(window.renderStock)window.renderStock(); if(window.updateKPIs)window.updateKPIs(); console.log(`✅ ${s}: ${arr.length}`);}
  });
  db.ref('shops/'+s+'/ventes').on('value',snap=>{let raw=snap.val()||{};STATE.ALL_DATA[s].ventes=Object.entries(raw).map(([k,v])=>({...v,_id:k,_shop:s})); savePatronCache(); if(window.renderVentes)window.renderVentes();});
  db.ref('shops/'+s+'/depenses').on('value',snap=>{let raw=snap.val()||{};STATE.ALL_DATA[s].dep=Object.entries(raw).map(([k,v])=>({...v,_id:k})); savePatronCache();});
  db.ref('shops/'+s+'/entrees').on('value',snap=>{let raw=snap.val()||{};STATE.ALL_DATA[s].entrees=Object.entries(raw).map(([k,v])=>({...v,_id:k,_shop:s})); savePatronCache();});
  db.ref('shops/'+s+'/vendeurs').on('value',snap=>{STATE.ALL_DATA[s].vendeurs=snap.val()||{}; savePatronCache();});
  db.ref('shops/'+s+'/presence').on('value',snap=>{STATE.ALL_DATA[s].presence=snap.val()||{}; savePatronCache(); if(window.renderPresenceKPI)window.renderPresenceKPI();});
  db.ref('shops/'+s+'/versements').on('value',snap=>{let raw=snap.val()||{};STATE.ALL_DATA[s].vers=Object.entries(raw).map(([k,v])=>({...v,_id:k})); savePatronCache();});
}

export function initShops(){
  db.ref('shops').on('value',snap=>{
    let data=snap.val()||{}; STATE.SHOPS_LIST=Object.keys(data); if(!STATE.SHOPS_LIST.length)STATE.SHOPS_LIST=['Menkao1','Menkao2','Mbakana','Itendance'];
    STATE.SHOPS_LIST.forEach(s=>{if(!STATE.ALL_DATA[s])STATE.ALL_DATA[s]={ventes:[],dep:[],vers:[],stock:[],entrees:[]}; listenShop(s);});
    document.getElementById('shopSel').innerHTML=STATE.SHOPS_LIST.map(s=>`<option ${s===STATE.SHOP?'selected':''} value="${s}">${s}</option>`).join('')+'<option value="ALL">TOUTES</option>';
    sync(); if(window.refreshAll)window.refreshAll(); savePatronCache();
  });
}
export function initShopsOffline(){
  let cg=JSON.parse(localStorage.getItem('patron_cache_global')||'null'); if(cg&&cg.shops)STATE.SHOPS_LIST=cg.shops; if(!STATE.SHOPS_LIST.length)STATE.SHOPS_LIST=['Menkao1','Menkao2','Mbakana','Itendance'];
  STATE.SHOPS_LIST.forEach(s=>{if(!STATE.ALL_DATA[s])STATE.ALL_DATA[s]={ventes:[],dep:[],vers:[],stock:[],entrees:[]};}); sync();
}

export function updateLabels(){
  document.getElementById('labVenteShop').innerText=STATE.SHOP;
  document.getElementById('labVendShop').innerText=STATE.SHOP;
  document.getElementById('presenceShopLab').innerText=STATE.SHOP;
  document.getElementById('lienV').innerText='https://aiseodon-ai.github.io/bateke/vendeur.html?shop='+STATE.SHOP;
  document.getElementById('paramShopName').innerText=STATE.SHOP;
  document.getElementById('headerEntreprise').innerHTML=(STATE.isSuperAdmin?'👑 SUPER - ':'👑 ')+(STATE.CURRENT_CONFIG.nom||'ETS BATEKE')+' - '+STATE.SHOP;
}
export function switchShop(){
  let sel=document.getElementById('shopSel').value; STATE.SHOP=sel; localStorage.setItem('patron_shop',sel); STATE.PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+sel)||'[]');
  sync(); updateLabels(); if(window.refreshAll)window.refreshAll();
}

window.getFiltered=getFiltered; window.listenShop=listenShop; window.initShops=initShops; window.initShopsOffline=initShopsOffline;
window.savePatronCache=savePatronCache; window.loadPatronCache=loadPatronCache; window.updateLabels=updateLabels; window.switchShop=switchShop;
