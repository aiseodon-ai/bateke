// js/core/firebase.js - BATEKE V4 - FIX TECNO 4% -> 90% - V2.1 FINAL
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

// 🔐 APP CHECK - Mode DEBUG activé pour capturer token Tecno
self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

// Capture du token pour l'afficher sur Tecno
const _origLog = console.log;
const _origWarn = console.warn;
function checkToken(...args){
  let msg = args.join(' ');
  if(msg.includes('App Check debug token:')){
    let token = msg.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if(token){
      console.log("📱 TOKEN TECNO DÉTECTÉ:", token[0]);
      // Sur Android, on l'affiche 3 secondes après chargement
      if(/Android/i.test(navigator.userAgent)){
        setTimeout(()=>{
          alert('📱 TOKEN TÉLÉPHONE À ENVOYER AU DG:\n\n'+token[0]+'\n\nCopie ce code et envoie sur WhatsApp PC');
        }, 3000);
      }
    }
  }
}
console.log = function(...a){ _origLog.apply(console, a); checkToken(...a); };
console.warn = function(...a){ _origWarn.apply(console, a); checkToken(...a); };

try {
  const appCheck = firebase.appCheck();
  appCheck.activate(
    new firebase.appCheck.ReCaptchaEnterpriseProvider('6Lf_U_QtAAAAAHpf_J8KwWnKBPAFQUBSYO41tx5o'),
    true
  );
  console.log("🛡️ App Check V2 OK - 6Lf_U_Qt...");
} catch(e) {
  console.warn("App Check non chargé:", e);
}

const db = firebase.database();
const auth = firebase.auth();

window.db = db;
window.auth = auth;
window.firebaseConfig = firebaseConfig;

setTimeout(()=>{ 
  try{ firebase.auth().signInAnonymously().catch(()=>{}); }catch(e){} 
}, 500);

export { db, auth };
console.log("🔥 Firebase OK - bateke-v4 + App Check V2:", firebaseConfig.projectId);
