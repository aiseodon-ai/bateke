// js/vendeur/core/state.js - V4.9.27
export const STATE = {
  SHOP: window.SHOP,
  SHOPS_LIST: [],
  STOCK: [],
  VENTES: [],
  DEP: [],
  VERS: [],
  DEVIS: [],
  FACTURES: [],
  PANIER: [],
  PANIER_DEVIS: [],
  PANIER_FACT: [],
  CURRENT_VENDEUR: null,
  CONFIG_ENT: { nom:'ETS BATEKE', deviseBase:'FC', taux:{USD:2850}, tauxUSD:2850 },
  OFFLINE_QUEUE: JSON.parse(localStorage.getItem('offline_queue_'+(window.SHOP||''))||'[]'),
  OFFLINE_STOCK_CACHE: JSON.parse(localStorage.getItem('bateke_stock_'+(window.SHOP||''))||'[]'),
  IS_ONLINE: navigator.onLine,
  FIREBASE_CONNECTED: false,
  BLOCKED_PINS_CACHE: [],
  PRESENCE_REF: null,
  HEARTBEAT_TIMER: null
};
window.STATE = STATE;
window.SHOP = STATE.SHOP;
window.STOCK = STATE.STOCK;
window.PANIER = STATE.PANIER;
window.VENTES = STATE.VENTES;
window.DEP = STATE.DEP;
window.VERS = STATE.VERS;
window.DEVIS = STATE.DEVIS;
window.FACTURES = STATE.FACTURES;
window.CONFIG_ENT = STATE.CONFIG_ENT;
window.OFFLINE_QUEUE = STATE.OFFLINE_QUEUE;
window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
console.log("STATE V4.9.27 vendeur chargé - SHOP:", STATE.SHOP, "QUEUE:", STATE.OFFLINE_QUEUE.length);
