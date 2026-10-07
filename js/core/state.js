export function esc(t){
  if(t===null||t===undefined) return '';
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
export const firebaseConfig={apiKey:"AIzaSyBOD42Ibg7tGVafz44cwCyI0CUjgAn5MNY",authDomain:"bateke-v4.firebaseapp.com",databaseURL:"https://bateke-v4-default-rtdb.firebaseio.com",projectId:"bateke-v4",storageBucket:"bateke-v4.firebasestorage.app",messagingSenderId:"321333206282",appId:"1:321333206282:web:6d1603446be3d195de6ef3"};
if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
export const db=firebase.database();

export const STATE = {
  SHOP: localStorage.getItem('patron_shop')||'Menkao1',
  SHOPS_LIST: [],
  ALL_DATA: {},
  CURRENT_CONFIG:{nom:"ETS BATEKE",slogan:"Qualité et confiance",adresse:"Menkao, Kinshasa",tel:"+243...",email:"",rccm:"",devise:"FC",deviseBase:"FC",taux:2850,tauxUSD:2850,tauxEUR:3100,tauxXAF:0,tauxXOF:0,taux:{USD:2850,EUR:3100,XAF:0,XOF:0},logo:"",piedFacture:"Merci.",piedDevis:"Devis 7j.",imprimante:{type:"pdf",nom:"",largeur:"58mm",print_logo:"oui",copies:1},compta:{base:50000,comPct:10,loyer:100000,autreFixe:0,emprunt:0,primePct:25,patronPct:45,devPct:30,exclus:[]}},
  isSuperAdmin: localStorage.getItem('bateke_isSuper')==='1',
  FB_CONNECTED:false,
  PANIER_ACHAT: JSON.parse(localStorage.getItem('panier_achat_'+(localStorage.getItem('patron_shop')||'Menkao1'))||'[]')
};
STATE.SHOPS_LIST.forEach(s=>{if(!STATE.ALL_DATA[s]) STATE.ALL_DATA[s]={ventes:[],dep:[],vers:[],stock:[],entrees:[],clients:{},vendeurs:{},presence:{},logs:{}};});

// Compat window pour ton stock.js actuel
window.SHOP=STATE.SHOP; window.SHOPS_LIST=STATE.SHOPS_LIST; window.ALL_DATA=STATE.ALL_DATA;
window.CURRENT_CONFIG=STATE.CURRENT_CONFIG; window.db=db; window.esc=esc;
