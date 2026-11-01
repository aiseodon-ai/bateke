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
function forceSupportShop(){
  try{
    let params = new URLSearchParams(location.search);
    let shop = params.get('support') || params.get('support_boutique') || sessionStorage.getItem('DG_SUPPORT_SHOP');
    if(!shop || !isSupportDG) return;
    
    let sel = document.getElementById('shopSel');
    if(sel){
      // Force la liste à cette boutique
      sel.innerHTML = `<option value="${shop}">${shop}</option>`;
      sel.value = shop;
      // Déclenche ton switchShop existant
      sel.dispatchEvent(new Event('change'));
      console.log("✅ FORCE SHOP SUPPORT:", shop);
    }
    // Force aussi les labels
    let lab = document.getElementById('paramShopName');
    if(lab) lab.innerText = shop;
    let labVente = document.getElementById('labVenteShop');
    if(labVente) labVente.innerText = shop;
  }catch(e){ console.warn("forceSupportShop", e.message); }
}
// Lance 3 fois pour être sûr après render
setTimeout(forceSupportShop, 800);
setTimeout(forceSupportShop, 2000);
setTimeout(forceSupportShop, 4000);
document.addEventListener('DOMContentLoaded', forceSupportShop);

export { db, auth };
console.log("🔥 BATEKE V4 FINAL V6.4.1 - AppCheck ON + SUPPORT FORCE");
