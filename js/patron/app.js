// app.js - ORCHESTRATEUR FIDÈLE V5.6.4 + APP CHECK
import "../core/firebase.js"; // EN PREMIER - initialise firebase
import "../core/state.js";

// ✅ APP CHECK - JUSTE APRES FIREBASE
try {
  // Debug token pour localhost - à retirer en prod si tu veux
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  
  const appCheck = firebase.appCheck();
  appCheck.activate(
    // 👇 REMPLACE PAR TA VRAIE CLÉ reCAPTCHA Enterprise
    // Firebase Console > App Check > bateke-v4 > Realtime Database > Gérer > reCAPTCHA Enterprise
    new firebase.appCheck.ReCaptchaEnterpriseProvider('6Lf_U_QtAAAAAHpf_J8KwWnKBPAFQUBSYO41tx5o'),
    true // auto-refresh token
  );
  console.log("✅ APP CHECK PATRON ACTIVÉ - token auto");
} catch(e){ 
  console.warn("⚠️ App Check patron non actif:", e.message); 
}

import "./sync.js";
import "./auth.js";
import "./tabs.js";
import "./stock.js";
import "./achat.js";
import "./ventes.js";
import "./caisse.js";
import "./vendeurs.js";
import "./crm.js";
import "./dettes.js";
import "./boutiques.js";
import "./rapport.js";
import "./compta.js";
import "./parametres.js";

console.log("✅ BATEKE MODULAIRE 12 ONGLETS + APP CHECK CHARGÉS - SHOP:", window.SHOP, "ALL_DATA:", Object.keys(window.ALL_DATA));

// INIT après chargement - UNE SEULE FOIS
let _initDone = false;
window.addEventListener('DOMContentLoaded', ()=>{
  if(_initDone) return; _initDone=true;
  if(typeof window.initShops === 'function') window.initShops();
});
