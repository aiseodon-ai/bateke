// app.js - ORCHESTRATEUR V6.3
import "../core/firebase.js";
import "../core/state.js";
// PLUS DE APP CHECK ICI - TOUT EST DANS firebase.js
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

console.log("✅ BATEKE V6.3 - SHOP:", window.SHOP);

let _initDone = false;
window.addEventListener('DOMContentLoaded', ()=>{
  if(_initDone) return; _initDone=true;
  if(typeof window.initShops === 'function') window.initShops();
});
