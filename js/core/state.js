function esc(t){
  if(t===null||t===undefined) return '';
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
// state.js - FIDÈLE V4.9.25 - SINGLE SOURCE OF TRUTH
export const STATE = {
  SHOPS_LIST: ["Menkao1","Menkao2","Menkao3","ALL"],
  SHOP: localStorage.getItem('patron_shop') || "Menkao1",
  ALL_DATA: {},
  CURRENT_CONFIG: {
    nom:"BATEKE", taux:2850, tauxUSD:2850, taux:{USD:2850},
    compta:{base:50000,comPct:10,loyer:100000,autreFixe:0,emprunt:0,primePct:25,patronPct:45,devPct:30,exclus:[]},
    logo:""
  },
  PANIER_ACHAT: [],
  DATA_MAP: {}
};

// Init ALL_DATA vide
STATE.SHOPS_LIST.forEach(s=>{
  if(!STATE.ALL_DATA[s]) STATE.ALL_DATA[s]={ventes:[],dep:[],vers:[],stock:[],entrees:[],vendeurs:{},presence:{},logs:{}};
});

// Expose en global pour compatibilité avec tes anciens fichiers qui utilisent window.SHOP
window.SHOPS_LIST = STATE.SHOPS_LIST;
window.SHOP = STATE.SHOP;
window.ALL_DATA = STATE.ALL_DATA;
window.CURRENT_CONFIG = STATE.CURRENT_CONFIG;
window.PANIER_ACHAT = JSON.parse(localStorage.getItem('panier_achat_'+STATE.SHOP)||'[]');
window.DATA_MAP = STATE.DATA_MAP;

export const SHOP = STATE.SHOP;
export const ALL_DATA = STATE.ALL_DATA;
