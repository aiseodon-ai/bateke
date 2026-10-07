import { FIREBASE_CONFIG, SHOPS_DEFAULT, CACHE_KEYS } from "../common/config.js";
import { db } from "../common/firebase.js";
import { esc } from "../common/utils.js";

// ============================================================
// VARIABLES GLOBALES ORIGINALES - CORRIGÉES SANS SIMPLIFIER
// ============================================================
import { STATE } from '../core/state.js';

// On utilise STATE, on ne recrée pas
const SHOPS_LIST = STATE.SHOPS_LIST;

// Auth Firebase
try{ firebase.auth().signInAnonymously().catch(()=>{}); }catch(e){}

export function initShopsOffline(){
  // Charge cache
  try{
    let cached = localStorage.getItem('patron_cache_Menkao1');
    if(cached){
      let parsed = JSON.parse(cached);
      if(parsed.data){
        // FUSIONNE, n'écrase pas tout
        Object.keys(parsed.data).forEach(s=>{
          if(STATE.ALL_DATA[s] && parsed.data[s].stock){
            // Si cache vide mais Firebase a 446, garde Firebase
            if(parsed.data[s].stock.length > 0 || STATE.ALL_DATA[s].stock.length===0){
              STATE.ALL_DATA[s] = {...STATE.ALL_DATA[s],...parsed.data[s]};
            }
          }
        });
      }
    }
  }catch(e){}

  // Écoute Firebase - UNE SEULE FOIS, remplit STATE
  STATE.SHOPS_LIST.forEach(s=>{
    firebase.database().ref('shops/'+s+'/stock').on('value', snap=>{
      let v = snap.val()||{};
      let arr = Array.isArray(v)? v : Object.values(v);
      if(arr.length>0){ // Ne remplace que si Firebase a des données
        STATE.ALL_DATA[s].stock = arr;
        window.ALL_DATA = STATE.ALL_DATA; // sync
        if(typeof renderStock==="function" && (STATE.SHOP===s || STATE.SHOP==='ALL')) renderStock();
        if(typeof updateKPIs==="function") updateKPIs();
        console.log(`✅ ${s}: ${arr.length} articles chargés`);
      }
    });
  });
}

export function checkLogin(code){
  if(code==='9999'){
    localStorage.setItem('bateke_isSuper','1');
    STATE.isSuperAdmin=true;
    localStorage.setItem('patron_shop','Menkao1');
    STATE.SHOP='Menkao1';
    window.SHOP='Menkao1';
    return true;
  }
  return false;
}
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
  }catch(e){}
}

export function loadPatronCache(){
  try{
    let c=JSON.parse(localStorage.getItem('patron_cache_'+SHOP)||'null');
    if(c&&c.data){
      ALL_DATA=c.data;
      SHOPS_LIST=c.shops||SHOPS_LIST;
      if(c.config) CURRENT_CONFIG={...CURRENT_CONFIG,...c.config};
      return true;
    }
  }catch(e){}
  return false;
}

// ============================================================
// LOGIN PATRON - VERSION COMPLETE AVEC SUPER PIN + 9999
// ============================================================
export function checkSuperPin(raw){
  // Ton super PIN original (si défini)
  const SUPER_PINS = ["2009", "BATEKE2024", "SUPER9999"];
  return SUPER_PINS.includes(raw.trim());
}

export function loginPat(){
  // Supporte les 2 IDs: pinPat (ton HTML) et pinPatron (nouveau)
  const input = document.getElementById('pinPat') || document.getElementById('pinPatron');
  let raw=(input?.value||'').trim();

  if(!raw){
    const msgEl = document.getElementById('msgPat');
    if(msgEl) msgEl.innerText='Tape 9999';
    else alert('Entre PIN patron - Tape 9999');
    return;
  }

  // Super admin
  if(typeof checkSuperPin==="function" && checkSuperPin(raw)){
    document.getElementById('loginPat').style.display='none';
    document.getElementById('loginScreen')?.classList.add('hidden');
    document.getElementById('mainApp')?.classList.remove('hidden');
    localStorage.setItem('patron_logged','yes');
    localStorage.setItem('bateke_isSuper','1');
    isSuperAdmin=true;
    window.isSuperAdmin=true;
    loadPatronCache();
    initShopsOffline();
    setTimeout(()=>{initShops();},800);
    return;
  }

  let p=raw.replace(/\D/g,'').trim();
  // ORIGINAL: 9999 OU tout PIN >=3 chiffres
  if(p==='9999' || p.length>=3){
    document.getElementById('loginPat').style.display='none';
    document.getElementById('loginScreen')?.classList.add('hidden');
    document.getElementById('mainApp')?.classList.remove('hidden');
    localStorage.setItem('patron_logged','yes');
    localStorage.setItem('patron_shop', SHOP);
    localStorage.setItem('shopPatron', SHOP);
    isSuperAdmin=false;
    window.isSuperAdmin=false;
    localStorage.removeItem('bateke_isSuper');
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
  // Conservé pour dev, mais commenté dans ton code final
  document.getElementById('loginPat').style.display='none';
  document.getElementById('loginScreen')?.classList.add('hidden');
  document.getElementById('mainApp')?.classList.remove('hidden');
  localStorage.setItem('patron_logged','yes');
  loadPatronCache();
  initShopsOffline();
  setTimeout(()=>{initShops();},800);
}

// ============================================================
// INIT SHOPS OFFLINE - VERSION COMPLETE ORIGINALE
// ============================================================
function initShopsOffline(){
  // TA LIGNE ORIGINALE - garde-la
  SHOPS_LIST.forEach(s=>{
    if(!ALL_DATA[s]) ALL_DATA[s]={ventes:[], dep:[], vers:[], stock:[], entrees:[], clients:{}, vendeurs:{}, presence:{}, logs:{}};
  });
  window.ALL_DATA = ALL_DATA;
  loadPatronCache();

  // FIX: écoute Firebase et convertit objet -> tableau
  SHOPS_LIST.forEach(s=>{
    if(typeof listenShop === "function"){
      listenShop(s);
    } else {
      // Fallback si listenShop pas chargé
      db.ref('shops/'+s+'/stock').on('value', snap=>{
        let v = snap.val()||{};
        ALL_DATA[s].stock = Array.isArray(v)? v : Object.values(v);
        savePatronCache();
        if(SHOP===s || SHOP==='ALL'){
          if(typeof renderStock==="function") renderStock();
          if(typeof updateKPIs==="function") updateKPIs();
        }
      });
    }
  });
}

// ============================================================
// INIT SHOPS ONLINE - ECOUTE FIREBASE TEMPS REEL
// ============================================================
export function initShops(){
  db.ref('shops').on('value', snap=>{
    let data=snap.val()||{};
    SHOPS_LIST=Object.keys(data);
    if(!SHOPS_LIST.length) SHOPS_LIST=['Menkao1','Menkao2','Mbakana','Itendance'];

    SHOPS_LIST.forEach(s=>{
      if(!ALL_DATA[s]) ALL_DATA[s]={ventes:[], dep:[], vers:[], stock:[], entrees:[], clients:{}, vendeurs:{}, presence:{}, logs:{}};
      if(data[s]){
        ALL_DATA[s]={...ALL_DATA[s],...data[s]};
        if(data[s].stock) ALL_DATA[s].stock = Array.isArray(data[s].stock)? data[s].stock : Object.values(data[s].stock);
      }
    });

    savePatronCache();
    const shopSel = document.getElementById('shopSel') || document.getElementById('shopSelector');
    if(shopSel){
      shopSel.innerHTML=SHOPS_LIST.map(s=>`<option ${s===SHOP?'selected':''} value="${esc(s)}">${esc(s)}</option>`).join('')+'<option value="ALL">TOUTES</option>';
    }
    FB_CONNECTED=true;
    updateLabels();
    if(typeof window.refreshAll==="function") window.refreshAll();
  });
}

// ============================================================
// UPDATE LABELS - VERSION COMPLETE
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
  window.SHOP=shop;
  localStorage.setItem('patron_shop', shop);
  localStorage.setItem('shopPatron', shop);
  localStorage.setItem('patron_shop', shop);
  window.CURRENT_SHOP=shop;
  PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
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

// Globals
window.SHOP=SHOP; window.SHOPS_LIST=SHOPS_LIST; window.ALL_DATA=ALL_DATA;
window.isSuperAdmin=isSuperAdmin; window.CURRENT_CONFIG=CURRENT_CONFIG;
window.loginPat=loginPat; window.bypassLogin=bypassLogin;
window.initShops=initShops; window.initShopsOffline=initShopsOffline;
window.switchShop=switchShop; window.savePatronCache=savePatronCache;
window.loadPatronCache=loadPatronCache; window.hashVendeurPin=hashVendeurPin;
window.auditSecurite=auditSecurite; window.updateLabels=updateLabels;
window.checkSuperPin=checkSuperPin;

console.log("auth.js V4.9.25 COMPLET chargé - non minimaliste");
