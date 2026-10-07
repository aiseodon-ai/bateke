// Garage ligne 1-30 : esc + firebase + STATE
export function esc(t){
  if(t==null) return '';
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
export const firebaseConfig={
  apiKey:"AIzaSyBOD42Ibg7tGVafz44cwCyI0CUjgAn5MNY",
  authDomain:"bateke-v4.firebaseapp.com",
  databaseURL:"https://bateke-v4-default-rtdb.firebaseio.com",
  projectId:"bateke-v4"
};
if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
export const db=firebase.database();

export const STATE={
  SHOP: localStorage.getItem('patron_shop')||'Menkao1',
  SHOPS_LIST: [],
  ALL_DATA: {},
  CURRENT_CONFIG:{
    nom:"ETS BATEKE",slogan:"Qualité et confiance",adresse:"Menkao, Kinshasa",tel:"+243...",devise:"FC",deviseBase:"FC",
    taux:2850,tauxUSD:2850,tauxEUR:3100,taux:{USD:2850},
    piedFacture:"Merci.",piedDevis:"Devis 7j.",
    imprimante:{type:"pdf",largeur:"58mm",print_logo:"oui",copies:1},
    compta:{base:50000,comPct:10,loyer:100000,autreFixe:0,emprunt:0,primePct:25,patronPct:45,devPct:30,exclus:[]}
  },
  isSuperAdmin: localStorage.getItem('bateke_isSuper')==='1',
  PANIER_ACHAT: []
};
// compat window pour stock.js qui lit window.
window.SHOP=STATE.SHOP; window.SHOPS_LIST=STATE.SHOPS_LIST; window.ALL_DATA=STATE.ALL_DATA;
window.CURRENT_CONFIG=STATE.CURRENT_CONFIG; window.db=db; window.esc=esc;
