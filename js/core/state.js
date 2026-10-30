// state.js - V4.9.27 - FIX PANIER + SYNC
const SAVED_SHOP = localStorage.getItem('patron_shop') || "Menkao1";
const SAVED_PANIER = JSON.parse(localStorage.getItem('panier_achat_'+SAVED_SHOP) || '[]');

export const STATE = {
  SHOPS_LIST: ["Menkao1","Menkao2","Mbakana","Itendance"], // tes vraies boutiques, sans ALL
  SHOP: SAVED_SHOP,
  ALL_DATA: {},
  CURRENT_CONFIG: {
    nom:"ETS BATEKE",
    taux:2850,
    tauxUSD:2850,
    taux:{USD:2850, EUR:3100, XAF:0, XOF:0},
    compta:{base:50000,comPct:10,loyer:100000,autreFixe:0,emprunt:0,primePct:25,patronPct:45,devPct:30,exclus:[]},
    logo:""
  },
  PANIER_ACHAT: SAVED_PANIER, // <-- FIX: on charge le vrai panier
  DATA_MAP: {}
};

// Init ALL_DATA vide pour chaque boutique
STATE.SHOPS_LIST.forEach(s=>{
  if(!STATE.ALL_DATA[s]) {
    STATE.ALL_DATA[s]={ventes:[],dep:[],vers:[],stock:[],entrees:[],clients:{},vendeurs:{},presence:{},logs:{},achats:[]};
  }
});

// Expose en global pour tes anciens fichiers
window.SHOPS_LIST = STATE.SHOPS_LIST;
window.SHOP = STATE.SHOP;
window.ALL_DATA = STATE.ALL_DATA;
window.CURRENT_CONFIG = STATE.CURRENT_CONFIG;
window.PANIER_ACHAT = STATE.PANIER_ACHAT; // maintenant synchro
window.DATA_MAP = STATE.DATA_MAP;

// Helper pour changer de boutique partout
STATE.setShop = function(newShop){
  STATE.SHOP = newShop;
  window.SHOP = newShop;
  localStorage.setItem('patron_shop', newShop);
  // recharge le panier de la nouvelle boutique
  STATE.PANIER_ACHAT = JSON.parse(localStorage.getItem('panier_achat_'+newShop) || '[]');
  window.PANIER_ACHAT = STATE.PANIER_ACHAT;
  console.log("📦 Shop changé ->", newShop, "Panier:", STATE.PANIER_ACHAT.length);
};

STATE.savePanier = function(){
  localStorage.setItem('panier_achat_'+STATE.SHOP, JSON.stringify(STATE.PANIER_ACHAT));
  window.PANIER_ACHAT = STATE.PANIER_ACHAT;
};

console.log("✅ STATE V4.9.27 chargé - SHOP:", STATE.SHOP, "PANIER:", STATE.PANIER_ACHAT.length);

export const SHOP = STATE.SHOP;
export const ALL_DATA = STATE.ALL_DATA;

// state.js - V4.9.27 - AJOUTE ÇA À LA FIN
window.STATE = STATE; // expose STATE global
window.setShop = STATE.setShop; // pour que boutiques.js puisse l'appeler même sans import

// Fix export SHOP qui était une copie figée
export function getShop(){ return STATE.SHOP; }
