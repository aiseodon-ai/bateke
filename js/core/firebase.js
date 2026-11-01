// js/core/firebase.js - BATEKE V4 - FINAL V6.4.1 APP CHECK + SUPPORT DG FORCE
window.esc = (t) => String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
export const esc = window.esc;

const firebaseConfig = {
  apiKey: "AIzaSyBOD42Ibg7tGVafz44cwCyI0CUjgAn5MNY",
  authDomain: "bateke-v4.firebaseapp.com",
  databaseURL: "https://bateke-v4-default-rtdb.firebaseio.com",
  projectId: "bateke-v4",
  storageBucket: "bateke-v4.firebasestorage.app",
  messagingSenderId: "321333206282",
  appId: "1:321333206282:web:6d1603446be3d195de6ef3"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// 🔐 APP CHECK PROD - ACTIVÉ PARTOUT y compris github.io
const isLocalhost = location.hostname.includes('localhost') || location.hostname.includes('127.0.0.1');
const isSupportDG = sessionStorage.getItem('DG_SUPPORT_MODE')==='1';

if (isLocalhost || isSupportDG) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  console.log("🛠️ DEBUG TOKEN ON pour", isSupportDG ? "SUPPORT DG" : "localhost");
}

try {
  const appCheck = firebase.appCheck();
  appCheck.activate(
    new firebase.appCheck.ReCaptchaEnterpriseProvider('6Lf_U_QtAAAAAHpf_J8KwWnKBPAFQUBSYO41tx5o'),
    true
  );
  console.log("🛡️ App Check PROD V6.4 ON sur", location.hostname);
} catch(e) {
  console.warn("App Check:", e.message);
}

const db = firebase.database();
const auth = firebase.auth();
window.db = db;
window.auth = auth;

setTimeout(()=>{ 
  try{ firebase.auth().signInAnonymously().catch(()=>{}); }catch(e){} 
}, 300);

// === FIX V6.4.1 - FORCE BOUTIQUE EN MODE SUPPORT DG ===
// === FIX V6.4.2 - FORCE BOUTIQUE SANS EFFACER LES 4 ===
function forceSupportShop(){
  try{
    let params = new URLSearchParams(location.search);
    let shop = params.get('support') || params.get('support_boutique') || sessionStorage.getItem('DG_SUPPORT_SHOP');
    if(!shop) return;
    
    let sel = document.getElementById('shopSel');
    if(!sel) return;

    // Si la liste a déjà 4 boutiques, on ne l'efface pas, on sélectionne juste
    if(sel.options.length > 1){
      sel.value = shop;
      if(sel.value === shop){
        sel.dispatchEvent(new Event('change'));
        console.log("✅ SELECT SUPPORT:", shop, "parmi", sel.options.length, "boutiques");
        return;
      }
    }
    // Si liste pas encore chargée, on attend
    if(sel.options.length <= 1){
      console.log("⏳ Attente chargement des 4 boutiques...");
      setTimeout(forceSupportShop, 1000);
    }
  }catch(e){ console.warn("forceSupportShop", e.message); }
}
document.addEventListener('DOMContentLoaded', ()=>{
  setTimeout(forceSupportShop, 1500);
  setTimeout(forceSupportShop, 3500);
});

export { db, auth };
console.log("🔥 BATEKE V4 FINAL V6.4.1 - AppCheck ON + SUPPORT FORCE");
