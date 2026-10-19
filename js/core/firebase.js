// js/core/firebase.js - BATEKE V4 - FINAL PROD 90% - TOUS TELEPHONES OK
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

// 🔐 APP CHECK PROD - 90% auto, tous téléphones (Tecno, Samsung, Infinix, iPhone)
self.FIREBASE_APPCHECK_DEBUG_TOKEN = false;

try {
  const appCheck = firebase.appCheck();
  appCheck.activate(
    new firebase.appCheck.ReCaptchaEnterpriseProvider('6Lf_U_QtAAAAAHpf_J8KwWnKBPAFQUBSYO41tx5o'),
    true
  );
  console.log("🛡️ App Check PROD V2 OK");
} catch(e) {
  console.warn("App Check:", e);
}

const db = firebase.database();
const auth = firebase.auth();

window.db = db;
window.auth = auth;

setTimeout(()=>{ 
  try{ firebase.auth().signInAnonymously().catch(()=>{}); }catch(e){} 
}, 500);

export { db, auth };
console.log("🔥 BATEKE V4 FINAL - PROD");
