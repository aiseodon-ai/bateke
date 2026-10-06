// BATEKE - CONFIG GLOBALE V4.9.25 - EXTRAIT DE TON PATRON REEL
// Fichier centralisé - Plus jamais de duplication

export const VERSION_PATRON = "V4.9.25-MODULAIRE";
export const VERSION_VENDEUR = "V5.6.3-MODULAIRE";

export const SHOPS_DEFAULT = ["Mbakana", "Menkao1", "Menkao2", "Zongo", "Bateke"];

export const SHOP_PARAM = new URLSearchParams(location.search).get("shop") || localStorage.getItem("shopPatron") || "Mbakana";

// ==== TA VRAIE CONFIG FIREBASE - BATEKE-V4 ====
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBOD42Ibg7tGVafz44cwCyI0CUjgAn5MNY",
  authDomain: "bateke-v4.firebaseapp.com",
  databaseURL: "https://bateke-v4-default-rtdb.firebaseio.com",
  projectId: "bateke-v4",
  storageBucket: "bateke-v4.firebasestorage.app",
  messagingSenderId: "321333206282",
  appId: "1:321333206282:web:6d1603446be3d195de6ef3"
};

// TAUX
export const TAUX_USD = 2850;
export const TAUX_CDF_DEFAULT = 2850;

// PARAMS COMPTA PAR DEFAUT (V4.9.10)
export const COMPTA_DEFAULT = {
  loyer: 0,
  electricite: 0,
  salaire: 0,
  transport: 0,
  autres: 0
};

// CACHE KEYS
export const CACHE_KEYS = {
  patron: "bateke_patron_cache_v4",
  stock: "bateke_stock_cache",
  shops: "bateke_shops_cache",
  vendeurs: "bateke_vendeurs_cache",
  queue: "bateke_offline_queue"
};

// SHOP ACTUEL
export const CURRENT_SHOP = SHOP_PARAM;

// Expose en global pour compatibilité avec ancien code qui utilise window
window.BATEKE_CONFIG = {
  VERSION_PATRON,
  VERSION_VENDEUR,
  SHOPS_DEFAULT,
  FIREBASE_CONFIG,
  CURRENT_SHOP
};

console.log(`Bateke Config chargée - Shop: ${CURRENT_SHOP} - Version: ${VERSION_PATRON}`);
