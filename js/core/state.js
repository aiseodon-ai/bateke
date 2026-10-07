function esc(t){
  if(t===null||t===undefined) return '';
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
const firebaseConfig={apiKey:"AIzaSyBOD42Ibg7tGVafz44cwCyI0CUjgAn5MNY",authDomain:"bateke-v4.firebaseapp.com",databaseURL:"https://bateke-v4-default-rtdb.firebaseio.com",projectId:"bateke-v4",storageBucket:"bateke-v4.firebasestorage.app",messagingSenderId:"321333206282",appId:"1:321333206282:web:6d1603446be3d195de6ef3"};
firebase.initializeApp(firebaseConfig);const db=firebase.database();
let isSuperAdmin=localStorage.getItem('bateke_isSuper')==='1';
let SHOP=localStorage.getItem('patron_shop')||'Menkao1';let SHOPS_LIST=[];let ALL_DATA={};let FB_CONNECTED=false;
let CURRENT_CONFIG={nom:"ETS BATEKE",slogan:"Qualité et confiance",adresse:"Menkao, Kinshasa",tel:"+243...",email:"",rccm:"",devise:"FC",deviseBase:"FC",taux:2850,tauxUSD:2850,tauxEUR:3100,tauxXAF:0,tauxXOF:0,taux:{USD:2850,EUR:3100,XAF:0,XOF:0},logo:"",piedFacture:"Merci.",piedDevis:"Devis 7j.", imprimante:{type:"pdf",nom:"",largeur:"58mm",print_logo:"oui",copies:1}, compta:{base:50000,comPct:10,loyer:100000,autreFixe:0,emprunt:0,primePct:25,patronPct:45,devPct:30,exclus:[]}};
let PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
let DATA_MAP={};
let chartRapport=null;
function savePatronCache(){try{localStorage.setItem('patron_cache_'+SHOP, JSON.stringify({shops:SHOPS_LIST,data:ALL_DATA,config:CURRENT_CONFIG}));localStorage.setItem('patron_cache_global',JSON.stringify({shops:SHOPS_LIST}));}catch(e){}}
function loadPatronCache(){try{let c=JSON.parse(localStorage.getItem('patron_cache_'+SHOP)||'null');if(c&&c.data){ALL_DATA=c.data;SHOPS_LIST=c.shops||SHOPS_LIST;if(c.config)CURRENT_CONFIG={...CURRENT_CONFIG,...c.config};return true;}}catch(e){}return false;}
try{firebase.auth().signInAnonymously().catch(()=>{});}catch(e){}
document.getElementById('du').valueAsDate=new Date(new Date().setDate(1));document.getElementById('au').valueAsDate=new Date();
if(document.getElementById('cDu'))document.getElementById('cDu').valueAsDate=new Date(new Date().setDate(1));
if(document.getElementById('cAu'))document.getElementById('cAu').valueAsDate=new Date();
