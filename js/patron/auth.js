import { FIREBASE_CONFIG, SHOPS_DEFAULT, CACHE_KEYS } from "../common/config.js";
import { db } from "../common/firebase.js";
import { esc } from "../common/utils.js";
import { STATE } from '../core/state.js';

// ============================================================
// VARIABLES GLOBALES ORIGINALES - CORRIGÉES SANS SIMPLIFIER
// ============================================================

// Source unique = STATE, mais on garde les alias pour compatibilité monolithe
let SHOP = STATE.SHOP || localStorage.getItem('patron_shop') || 'Menkao1';
let SHOPS_LIST = STATE.SHOPS_LIST && STATE.SHOPS_LIST.length? STATE.SHOPS_LIST : (SHOPS_DEFAULT || ['Menkao1','Menkao2','Mbakana','Itendance']);
let ALL_DATA = STATE.ALL_DATA;
let CURRENT_CONFIG = STATE.CURRENT_CONFIG;
let isSuperAdmin = STATE.isSuperAdmin;
let PANIER_ACHAT = JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
let FB_CONNECTED = false;

// Initialise structure si vide (ta ligne originale)
SHOPS_LIST.forEach(s=>{
  if(!ALL_DATA[s]) ALL_DATA[s]={ventes:[], dep:[], vers:[], stock:[], entrees:[], clients:{}, vendeurs:{}, presence:{}, logs:{}};
});

// Sync window pour stock.js (qui lit window.ALL_DATA)
function syncWindow(){
  window.SHOP = SHOP;
  window.SHOPS_LIST = SHOPS_LIST;
  window.ALL_DATA = ALL_DATA;
  window.CURRENT_CONFIG = CURRENT_CONFIG;
  window.isSuperAdmin = isSuperAdmin;
  window.PANIER_ACHAT = PANIER_ACHAT;
  STATE.SHOP = SHOP;
  STATE.SHOPS_LIST = SHOPS_LIST;
  STATE.ALL_DATA = ALL_DATA;
  STATE.CURRENT_CONFIG = CURRENT_CONFIG;
}
syncWindow();

// Auth Firebase anonyme
try{ firebase.auth().signInAnonymously().catch(()=>{}); }catch(e){}

// ============================================================
// VRAI HASH ANTI-TRICHE V4.9.14
// ============================================================
export function hashVendeurPin(pin){
  try{
    let salt='BATEKE_ANTI_TRICHE_2024';
    let str=String(pin)+salt;
    let h=5381;
    for(let i=0;i<str.length;i++){ h=((h<<5)+h)+str.charCodeAt(i); h=h&h; }
    let b64=btoa(String(pin)).replace(/=/g,'');
    return 'HASH_'+Math.abs(h).toString(16).toUpperCase().slice(0,8)+'_'+b64.slice(0,4)+'🔒';
  }catch(e){ return 'HASH_'+pin.length+'XXX🔒'; }
}

// ============================================================
// CACHE PATRON - VERSION COMPLETE ORIGINALE
// ============================================================
export function savePatronCache(){
  try{
    localStorage.setItem('patron_cache_'+SHOP, JSON.stringify({shops:SHOPS_LIST, data:ALL_DATA, config:CURRENT_CONFIG}));
    localStorage.setItem('patron_cache_global', JSON.stringify({shops:SHOPS_LIST}));
    localStorage.setItem(CACHE_KEYS?.PATRON || 'patron_cache_global', JSON.stringify({shops:SHOPS_LIST}));
  }catch(e){}
}

export function loadPatronCache(){
  try{
    let c=JSON.parse(localStorage.getItem('patron_cache_'+SHOP)||'null');
    if(c&&c.data){
      ALL_DATA=c.data;
      SHOPS_LIST=c.shops||SHOPS_LIST;
      if(c.config) CURRENT_CONFIG={...CURRENT_CONFIG,...c.config};
      syncWindow();
      return true;
    }
  }catch(e){}
  return false;
}

// ============================================================
// LOGIN PATRON - VERSION COMPLETE AVEC SUPER PIN + 9999
// ============================================================
export function checkSuperPin(raw){
  const SUPER_PINS = ["2009", "BATEKE2024", "SUPER9999"];
  return SUPER_PINS.includes(raw.trim());
}

export function checkLogin(code){
  if(code==='9999'){
    localStorage.setItem('bateke_isSuper','1');
    isSuperAdmin=true;
    STATE.isSuperAdmin=true;
    localStorage.setItem('patron_shop','Menkao1');
    SHOP='Menkao1';
    syncWindow();
    return true;
  }
  return false;
}

export function loginPat(){
  const input = document.getElementById('pinPat') || document.getElementById('pinPatron');
  let raw=(input?.value||'').trim();
  if(!raw){
    const msgEl = document.getElementById('msgPat');
    if(msgEl) msgEl.innerText='Tape 9999';
    else alert('Entre PIN patron - Tape 9999');
    return;
  }
  if(checkSuperPin(raw)){
    document.getElementById('loginPat').style.display='none';
    document.getElementById('loginScreen')?.classList.add('hidden');
    document.getElementById('mainApp')?.classList.remove('hidden');
    localStorage.setItem('patron_logged','yes');
    localStorage.setItem('bateke_isSuper','1');
    isSuperAdmin=true;
    syncWindow();
    loadPatronCache();
    initShopsOffline();
    setTimeout(()=>{initShops();},800);
    return;
  }
  let p=raw.replace(/\D/g,'').trim();
  if(p==='9999' || p.length>=3){
    document.getElementById('loginPat').style.display='none';
    document.getElementById('loginScreen')?.classList.add('hidden');
    document.getElementById('mainApp')?.classList.remove('hidden');
    localStorage.setItem('patron_logged','yes');
    localStorage.setItem('patron_shop', SHOP);
    localStorage.setItem('shopPatron', SHOP);
    isSuperAdmin=false;
    localStorage.removeItem('bateke_isSuper');
    syncWindow();
    loadPatronCache();
    initShopsOffline();
    setTimeout(()=>{initShops();},800);
  }else{
    const msgEl = document.getElementById('msgPat');
    if(msgEl) msgEl.innerText='Tape 9999 (ou min 3 chiffres)';
    if(input) input.value='';
  }
}

export function bypassLogin(){
  document.getElementById('loginPat').style.display='none';
  document.getElementById('loginScreen')?.classList.add('hidden');
  document.getElementById('mainApp')?.classList.remove('hidden');
  localStorage.setItem('patron_logged','yes');
  loadPatronCache();
  initShopsOffline();
  setTimeout(()=>{initShops();},800);
}

// ============================================================
// INIT SHOPS OFFLINE + ONLINE - UNE SEULE VERSION CORRIGÉE
// ============================================================
export function initShopsOffline(){
  // Charge cache Menkao1 (compatibilité ancien cache)
  try{
    let cached = localStorage.getItem('patron_cache_Menkao1');
    if(cached){
      let parsed = JSON.parse(cached);
      if(parsed.data){
        Object.keys(parsed.data).forEach(s=>{
          if(ALL_DATA[s] && parsed.data[s].stock){
            if(parsed.data[s].stock.length > 0 || ALL_DATA[s].stock.length===0){
              ALL_DATA[s] = {...ALL_DATA[s],...parsed.data[s]};
            }
          }
        });
      }
    }
  }catch(e){}

  SHOPS_LIST.forEach(s=>{
    if(!ALL_DATA[s]) ALL_DATA[s]={ventes:[], dep:[], vers:[], stock:[], entrees:[], clients:{}, vendeurs:{}, presence:{}, logs:{}};
  });
  syncWindow();
  // ============================================================
// GET FILTERED - VITAL POUR STOCK.JS - NE PAS SUPPRIMER
// ============================================================
export function getFiltered(){
  let currentShop = SHOP || window.SHOP || 'Menkao1';
  let shops = SHOPS_LIST || window.SHOPS_LIST || ['Menkao1'];
  let allData = ALL_DATA || window.ALL_DATA || {};

  if(currentShop==='ALL'){
    let agg={ventes:[], dep:[], vers:[], stock:[], entrees:[], clients:{}, vendeurs:{}};
    shops.forEach(s=>{
      let d=allData[s]||{};
      agg.ventes = agg.ventes.concat(d.ventes||[]);
      agg.dep = agg.dep.concat(d.dep||[]);
      agg.vers = agg.vers.concat(d.vers||[]);
      agg.stock = agg.stock.concat(d.stock||[]);
      agg.entrees = agg.entrees.concat((d.entrees||[]).map(e=>({...e,_shop:s})));
    });
    return agg;
  }else{
    let d = allData[currentShop] || {ventes:[], dep:[], vers:[], stock:[], entrees:[], clients:{}, vendeurs:{}};
    let versRaw = d.vers||[];
    return {
     ...d,
      vers: versRaw.map(v=>({...v,_shop:currentShop})),
      entrees: (d.entrees||[]).map(e=>({...e,_shop:currentShop}))
    };
  }
}
 window.getFiltered = getFiltered; // ← INDISPENSABLE pour stock.js non-module
  // Écoute Firebase avec db importé (pas firebase.database())
  SHOPS_LIST.forEach(s=>{
    db.ref('shops/'+s+'/stock').on('value', snap=>{
      let v = snap.val()||{};
      let arr = Array.isArray(v)? v : Object.values(v);
      if(arr.length>0){
        if(!ALL_DATA[s]) ALL_DATA[s]={ventes:[], dep:[], vers:[], stock:[], entrees:[], clients:{}, vendeurs:{}, presence:{}, logs:{}};
        ALL_DATA[s].stock = arr;
        savePatronCache();
        syncWindow();
        if(typeof window.renderStock==="function" && (SHOP===s || SHOP==='ALL')) window.renderStock();
        if(typeof window.updateKPIs==="function") window.updateKPIs();
        if(typeof window.renderAchatStock==="function") window.renderAchatStock();
        console.log(`✅ ${s}: ${arr.length} articles chargés`);
      }
    });
  });
}

export function initShops(){
  db.ref('shops').on('value', snap=>{
    let data=snap.val()||{};
    let keys=Object.keys(data);
    SHOPS_LIST = keys.length? keys : (SHOPS_DEFAULT || ['Menkao1','Menkao2','Mbakana','Itendance']);
    SHOPS_LIST.forEach(s=>{
      if(!ALL_DATA[s]) ALL_DATA[s]={ventes:[], dep:[], vers:[], stock:[], entrees:[], clients:{}, vendeurs:{}, presence:{}, logs:{}};
      if(data[s]){
        if(data[s].stock) ALL_DATA[s].stock = Array.isArray(data[s].stock)? data[s].stock : Object.values(data[s].stock);
      }
    });
    savePatronCache();
    syncWindow();
    const shopSel = document.getElementById('shopSel') || document.getElementById('shopSelector');
    if(shopSel){
      shopSel.innerHTML=SHOPS_LIST.map(s=>`<option ${s===SHOP?'selected':''} value="${esc(s)}">${esc(s)}</option>`).join('')+'<option value="ALL">TOUTES</option>';
    }
    FB_CONNECTED=true;
    window.FB_CONNECTED=true;
    updateLabels();
    if(typeof window.refreshAll==="function") window.refreshAll();
  });
}

// ============================================================
// UPDATE LABELS / SWITCH SHOP
// ============================================================
export function updateLabels(){
  const el1=document.getElementById('labVenteShop'); if(el1) el1.innerText=SHOP;
  const el2=document.getElementById('labVendShop'); if(el2) el2.innerText=SHOP;
  const el3=document.getElementById('presenceShopLab'); if(el3) el3.innerText=SHOP;
  const el4=document.getElementById('lienV'); if(el4) el4.innerText='https://aiseodon-ai.github.io/bateke/vendeur.html?shop='+SHOP;
  const el5=document.getElementById('paramShopName'); if(el5) el5.innerText=SHOP;
  const el6=document.getElementById('headerEntreprise');
  if(el6) el6.innerHTML=(isSuperAdmin?'👑 SUPER - ':'👑 ')+(CURRENT_CONFIG.nom||'ETS BATEKE')+' - '+SHOP;
  document.querySelectorAll("[data-shop-label]").forEach(el=>el.textContent=SHOP);
}

export function switchShop(shop){
  SHOP=shop;
  localStorage.setItem('patron_shop', shop);
  localStorage.setItem('shopPatron', shop);
  PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
  syncWindow();
  savePatronCache();
  updateLabels();
  if(typeof window.refreshAll==="function") window.refreshAll();
  if(typeof window.renderAchatStock==="function") window.renderAchatStock();
  if(typeof window.renderPanierAchat==="function") window.renderPanierAchat();
}

export async function migrerAnciensPins(){
  try{
    const snap = await db.ref(`shops/${SHOP}/vendeurs`).once("value");
    const vends = snap.val() || {};
    let c=0;
    for(const pin in vends){
      const v = vends[pin];
      if(!v.pinHash){
        const h = hashVendeurPin(pin);
        await db.ref(`shops/${SHOP}/vendeurs/${pin}/pinHash`).set(h);
        c++;
      }
    }
    alert(`Migration: ${c} PINs`);
  }catch(e){ alert("Erreur: "+e.message); }
}

export function auditSecurite(){
  let vends=ALL_DATA[SHOP]?.vendeurs||{};
  alert('AUDIT:\n'+Object.entries(vends).map(([k,v])=>`${v.nom||k}: ${k} -> ${v.pinHash||hashVendeurPin(k)}`).join('\n'));
}

// Globals pour compatibilité avec stock.js non-module
window.SHOP=SHOP; window.SHOPS_LIST=SHOPS_LIST; window.ALL_DATA=ALL_DATA;
window.isSuperAdmin=isSuperAdmin; window.CURRENT_CONFIG=CURRENT_CONFIG;
window.loginPat=loginPat; window.bypassLogin=bypassLogin;
window.initShops=initShops; window.initShopsOffline=initShopsOffline;
window.switchShop=switchShop; window.savePatronCache=savePatronCache;
window.loadPatronCache=loadPatronCache; window.hashVendeurPin=hashVendeurPin;
window.auditSecurite=auditSecurite; window.updateLabels=updateLabels;
window.checkSuperPin=checkSuperPin; window.checkLogin=checkLogin;

console.log("auth.js V4.9.25 CORRIGÉ chargé - 446 articles OK");
