// app.js - ORCHESTRATEUR FIDÈLE V4.9.25 - 12 ONGLETS
// PATCH XSS GLOBAL V4.9.26 - à mettre ligne 1 de app.js
window.esc = (t) => String(t==null?'':t)
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#039;');
import "../core/firebase.js"; // EN PREMIER
import "../core/state.js";
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

console.log("✅ BATEKE MODULAIRE 12 ONGLETS CHARGÉS - SHOP:", window.SHOP, "ALL_DATA:", Object.keys(window.ALL_DATA));

// INIT après chargement
window.addEventListener('DOMContentLoaded', ()=>{
  if(typeof window.initShops === 'function') window.initShops();
  if(typeof window.listenShop === 'function'){
    SHOPS_LIST.forEach(s=>{ if(s!=='ALL') window.listenShop(s); });
  }
});
