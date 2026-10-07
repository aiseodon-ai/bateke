// SOURCE UNIQUE - Plus de duplication
export const SHOP_REF = { current: localStorage.getItem('patron_shop') || 'Menkao1' };
export const SHOPS_LIST_REF = { list: [] };
export const ALL_DATA_REF = { data: {} };
export const CURRENT_CONFIG_REF = { config: {
  nom:"ETS BATEKE", slogan:"Qualité et confiance", adresse:"Menkao, Kinshasa",
  tel:"+243...", devise:"FC", deviseBase:"FC", taux:2850, tauxUSD:2850, tauxEUR:3100,
  piedFacture:"Merci.", piedDevis:"Devis 7j.",
  imprimante:{type:"pdf", largeur:"58mm", print_logo:"oui", copies:1},
  compta:{base:50000, comPct:10, loyer:100000, autreFixe:0, emprunt:0, primePct:25, patronPct:45, devPct:30, exclus:[]}
}};

// Compat window pour l'ancien code
window.ALL_DATA = ALL_DATA_REF.data;
window.SHOPS_LIST = SHOPS_LIST_REF.list;
