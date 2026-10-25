// app.js - ORCHESTRATEUR FIDÈLE V6.2 + APP CHECK FIX GITHUB
// ✅ DEBUG TOKEN DOIT ÊTRE AVANT TOUT IMPORT FIREBASE
self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

import "../core/firebase.js"; // EN PREMIER - initialise firebase
import "../core/state.js";

// ✅ APP CHECK - UNIQUEMENT SI PAS SUR GITHUB.IO
try {
  const isGithub = location.hostname.includes('github.io') || location.hostname.includes('localhost') === false && location.hostname.includes('github') ;
  
  // Sur github.io, on désactive App Check pour éviter 403
  if (location.hostname.includes('github.io')) {
    console.log("⚠️ App Check désactivé sur github.io pour éviter 403 - mode Surveillance actif côté Firebase");
  } else {
    const appCheck = firebase.appCheck();
    appCheck.activate(
      new firebase.appCheck.ReCaptchaEnterpriseProvider('6Lf_U_QtAAAAAHpf_J8KwWnKBPAFQUBSYO41tx5o'),
      true
    );
    console.log("✅ APP CHECK PATRON ACTIVÉ");
  }
} catch(e){ 
  console.warn("⚠️ App Check non actif:", e.message); 
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

console.log("✅ BATEKE V6.2 MODULAIRE 12 ONGLETS - SHOP:", window.SHOP, "ALL_DATA:", Object.keys(window.ALL_DATA));

// INIT après chargement - UNE SEULE FOIS
let _initDone = false;
window.addEventListener('DOMContentLoaded', ()=>{
  if(_initDone) return; _initDone=true;
  if(typeof window.initShops === 'function') window.initShops();
});
