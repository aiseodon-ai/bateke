// js/core/state.js - SOURCE UNIQUE DE VÉRITÉ
export const STATE = {
  SHOP: localStorage.getItem('patron_shop') || 'Menkao1',
  SHOPS_LIST: ['Menkao1','Menkao2','Mbakana','Itendance'],
  ALL_DATA: {},
  CURRENT_CONFIG: {
    nom:"ETS BATEKE", slogan:"Qualité et confiance", adresse:"Menkao, Kinshasa",
    tel:"+243...", devise:"FC", deviseBase:"FC", taux:2850, tauxUSD:2850,
    piedFacture:"Merci.", piedDevis:"Devis 7j.",
    imprimante:{type:"pdf", largeur:"58mm"}, compta:{base:50000, comPct:10}
  },
  FB_CONNECTED: false,
  isSuperAdmin: localStorage.getItem('bateke_isSuper')==='1',
  PANIER_ACHAT: []
};

// Initialise la structure une seule fois
STATE.SHOPS_LIST.forEach(s=>{
  STATE.ALL_DATA[s]={ventes:[], dep:[], vers:[], stock:[], entrees:[], clients:{}, vendeurs:{}, presence:{}, logs:{}};
});

// Expose pour compatibilité console F12
window.STATE = STATE;
window.ALL_DATA = STATE.ALL_DATA;
window.SHOP = STATE.SHOP;
window.SHOPS_LIST = STATE.SHOPS_LIST;
