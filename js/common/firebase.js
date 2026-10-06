import { FIREBASE_CONFIG } from "./config.js";

// Initialise Firebase une seule fois (compat v10)
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

export const db = firebase.database();
export const auth = firebase.auth();

export const refShops = db.ref("shops");
export const refStock = (shop) => db.ref(`shops/${shop}/stock`);
export const refVentes = (shop) => db.ref(`shops/${shop}/ventes`);
export const refCaisse = (shop) => db.ref(`shops/${shop}/caisse`);
export const refVendeurs = db.ref("vendeurs");
export const refConfig = db.ref("config");

// Helpers Firebase
export function listenShop(shop, callback){
  const r = db.ref(`shops/${shop}`);
  r.on("value", snap => callback(snap.val()));
  return r;
}

export function saveShopData(shop, path, data){
  return db.ref(`shops/${shop}/${path}`).set(data);
}

// Compatibilité ancien code
window.db = db;
window.auth = auth;
window.refShops = refShops;

console.log("Firebase Bateke-V4 connecté:", FIREBASE_CONFIG.projectId);
