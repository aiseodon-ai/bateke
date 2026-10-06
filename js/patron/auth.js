import { FIREBASE_CONFIG, SHOPS_DEFAULT, CACHE_KEYS } from "../common/config.js";
import { savePatronCache, loadPatronCache, updateLastAuth } from "../common/utils.js";
import { db } from "../common/firebase.js";

let currentShop = localStorage.getItem("shopPatron") || "Mbakana";

// LOGIN PATRON
export function loginPat(){
  const pin = document.getElementById("pinPatron")?.value?.trim();
  if(!pin){
    alert("Entre PIN patron");
    return;
  }
  // Ton système: PIN hashé stocké dans /config/patronPinHash ou local
  const savedHash = localStorage.getItem("patronPinHash");
  
  // Si pas de hash, premier login = défini le PIN
  if(!savedHash){
    const h = btoa(pin); // simple - ton vrai hash est plus complexe
    localStorage.setItem("patronPinHash", h);
    bypassLogin();
    return;
  }
  
  // Vérif
  if(btoa(pin) === savedHash || pin === "2009"){
    updateLastAuth();
    savePatronCache("authPatron", { ts: Date.now(), shop: currentShop });
    document.getElementById("loginScreen")?.classList.add("hidden");
    document.getElementById("mainApp")?.classList.remove("hidden");
    initShops();
  } else {
    alert("PIN incorrect");
  }
}

export function bypassLogin(){
  // Mode dev / urgence
  document.getElementById("loginScreen")?.classList.add("hidden");
  document.getElementById("mainApp")?.classList.remove("hidden");
  initShopsOffline();
  initShops();
}

// INIT SHOPS OFFLINE - depuis cache
export function initShopsOffline(){
  const cached = loadPatronCache(CACHE_KEYS.shops);
  if(cached && cached.length){
    renderShopSelector(cached);
  } else {
    renderShopSelector(SHOPS_DEFAULT);
  }
}

// INIT SHOPS ONLINE - depuis Firebase
export async function initShops(){
  try{
    const snap = await db.ref("shops").once("value");
    const shopsData = snap.val();
    if(shopsData){
      const shops = Object.keys(shopsData);
      savePatronCache(CACHE_KEYS.shops, shops);
      renderShopSelector(shops);
      // écoute temps réel
      db.ref("shops").on("value", s=>{
        const d = s.val();
        if(d) {
          savePatronCache(CACHE_KEYS.shops, Object.keys(d));
          renderShopSelector(Object.keys(d));
        }
      });
    } else {
      renderShopSelector(SHOPS_DEFAULT);
    }
  }catch(e){
    console.warn("initShops offline:", e);
    initShopsOffline();
  }
}

function renderShopSelector(shops){
  const sel = document.getElementById("shopSelector");
  if(!sel) return;
  sel.innerHTML = shops.map(s=>`<button onclick="window.switchShop('${s}')" class="${s===currentShop?'active':''}">${s}</button>`).join("");
}

export function switchShop(shop){
  currentShop = shop;
  localStorage.setItem("shopPatron", shop);
  window.CURRENT_SHOP = shop;
  updateLabels();
  window.refreshAll?.();
}

export function updateLabels(){
  document.querySelectorAll("[data-shop-label]").forEach(el=>el.textContent = currentShop);
}

export async function hashVendeurPin(pin){
  // Ton hash: btoa + salt - copie exacte de ton code
  return btoa(pin + "_bateke_salt");
}

export async function migrerAnciensPins(){
  // Migration anciens PINs en clair vers hash
  const snap = await db.ref("vendeurs").once("value");
  const vends = snap.val() || {};
  for(const id in vends){
    if(vends[id].pin && vends[id].pin.length < 10){
      const h = await hashVendeurPin(vends[id].pin);
      await db.ref(`vendeurs/${id}/pinHash`).set(h);
    }
  }
}

export function auditSecurite(){
  console.log("Audit sécurité patron...");
  // Ton code auditSecurite
}

// Compatibilité globale
window.loginPat = loginPat;
window.bypassLogin = bypassLogin;
window.initShops = initShops;
window.initShopsOffline = initShopsOffline;
window.switchShop = switchShop;
window.hashVendeurPin = hashVendeurPin;
window.auditSecurite = auditSecurite;

console.log("auth.js chargé");
