// js/vendeur/app.js - ORCHESTRATEUR V4.9.27
import "./core/firebase.js";
import "./core/state.js";
import "./core/offline.js";
import "./core/presence.js";
import "./modules/auth.js";
import "./modules/stock.js";
import "./modules/vente.js";
import "./modules/caisse.js";
import "./modules/devis.js";
import "./modules/facture.js";
import "./modules/synthese.js";

console.log("✅ VENDEUR MODULAIRE 7 MODULES CHARGÉS - SHOP:", window.SHOP);

// LISTENERS - fidèle à vendeur.txt
window.addEventListener('DOMContentLoaded', ()=>{
  // Tabs
  document.querySelectorAll('.tabs button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
      btn.classList.add('active');
      let target=document.getElementById(btn.dataset.tab || btn.getAttribute('data-sec') || 'vente');
      if(target) target.classList.add('active');
    });
  });
  // Firebase listeners
  if(window.db){
    window.db.ref('.info/connected').on('value',snap=>{
      STATE.FIREBASE_CONNECTED=snap.val()===true;
      if(window.updateOfflineUI) window.updateOfflineUI();
      if(STATE.FIREBASE_CONNECTED && window.syncOfflineQueue) window.syncOfflineQueue();
    });
    window.addEventListener('online', ()=>{ STATE.IS_ONLINE=true; if(window.updateOfflineUI) window.updateOfflineUI(); });
    window.addEventListener('offline', ()=>{ STATE.IS_ONLINE=false; STATE.FIREBASE_CONNECTED=false; if(window.updateOfflineUI) window.updateOfflineUI(); });

    window.db.ref('shops').on('value',snap=>{
      let data=snap.val()||{}; STATE.SHOPS_LIST=Object.keys(data);
      let shop=STATE.SHOP;
      if(data[shop]?.stock){ STATE.STOCK=Object.values(data[shop].stock); window.STOCK=STATE.STOCK; if(window.saveStockCache) window.saveStockCache(); if(window.renderStock) window.renderStock(); }
      if(data[shop]?.ventes){ STATE.VENTES=Object.values(data[shop].ventes); window.VENTES=STATE.VENTES; if(window.renderVentesJour) window.renderVentesJour(); if(window.updateKPI) window.updateKPI(); }
      if(data[shop]?.depenses){ STATE.DEP=Object.values(data[shop].depenses); if(window.renderCaisse) window.renderCaisse(); }
      if(data[shop]?.versements){ STATE.VERS=Object.values(data[shop].versements); if(window.renderCaisse) window.renderCaisse(); }
      if(data[shop]?.devis){ STATE.DEVIS=Object.entries(data[shop].devis).map(([k,v])=>({...v,_id:k})).sort((a,b)=> new Date(b.date)-new Date(a.date)); if(window.renderDevisList) window.renderDevisList(); }
      if(data[shop]?.factures){ STATE.FACTURES=Object.entries(data[shop].factures).map(([k,v])=>({...v,_id:k})); }
      if(data[shop]?.config_entreprise){ STATE.CONFIG_ENT=Object.assign(STATE.CONFIG_ENT, data[shop].config_entreprise); }
    });
  }
  if(window.checkSession) window.checkSession();
  console.log("Vendeur prêt - Stock:", STATE.STOCK.length);
});
