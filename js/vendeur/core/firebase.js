// js/vendeur/core/firebase.js - V4.9.28 - App Check PROD FIX
console.log("App Check PROD V2 OK");
const firebaseConfig = {
  apiKey: "AIzaSyBOD42Ibg7tGVafz44cwCyI0CUjgAn5MNY",
  authDomain: "bateke-v4.firebaseapp.com",
  databaseURL: "https://bateke-v4-default-rtdb.firebaseio.com",
  projectId: "bateke-v4",
  storageBucket: "bateke-v4.firebasestorage.app",
  messagingSenderId: "321333206282",
  appId: "1:321333206282:web:6d1603446be3d195de6ef3"
};

if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);

// ✅ APP CHECK DIRECTEMENT ICI - APRES INIT, AVANT TOUT
try {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  const appCheck = firebase.appCheck();
  appCheck.activate(
    new firebase.appCheck.ReCaptchaEnterpriseProvider('6Lf_U_QtAAAAAHpf_J8KwWnKBPAFQUBSYO41tx5o'),
    true
  );
  console.log("✅ APP CHECK PROD ACTIVÉ DANS firebase.js");
} catch(e){
  console.warn("⚠️ App Check erreur:", e.message);
}

window.db = firebase.database();
window.auth = firebase.auth();
window.SHOP = new URLSearchParams(location.search).get('shop') || localStorage.getItem('vendeur_shop') || 'Menkao2';
console.log("BATEKE V4 FINAL - PROD - SHOP:", window.SHOP);
