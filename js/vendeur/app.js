// js/vendeur/app.js - ORCHESTRATEUR FINAL V5.6.3 - FIX ENTREE + BOUTIQUE LOCK
import "./core/firebase.js";
import { STATE } from "./core/state.js";
import "./core/offline.js";
import "./core/presence.js";
import { doLogin, logoutAll, switchShop } from "./modules/auth.js";
import { renderStock, searchArticle, selectArt, selectArticle, openEntree } from "./modules/stock.js";
import "./modules/vente.js";
import "./modules/caisse.js";
import "./modules/devis.js";
import "./modules/facture.js";
import "./modules/synthese.js";

window.STATE = STATE;
window.SHOP = STATE.SHOP;

window.esc = (t)=>{ if(t==null) return ''; return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };

// ✅ FIX - ON GARDE LE VRAI openEntree DE stock.js - PLUS DE PLACEHOLDER
window.doLogin = doLogin;
window.logoutAll = logoutAll;
window.switchShop = switchShop;
window.renderStock = renderStock;
window.searchArticle = searchArticle;
window.selectArt = selectArt;
window.selectArticle = selectArticle;
window.openEntree = openEntree; // ← LE VRAI FIX, pas l'alert !

window.switchTab = function(id){
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  document.getElementById('btn-'+id)?.classList.add('active');
  document.getElementById(id)?.classList.add('active');
};

console.log("✅ VENDEUR MODULAIRE 7 MODULES CHARGÉS - SHOP:", STATE.SHOP, "- openEntree FIX ACTIF");

window.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('shopName').innerText=STATE.SHOP;
  let elShopStock=document.getElementById('shopStock'); if(elShopStock) elShopStock.innerText=STATE.SHOP;
  let elLoginShop=document.getElementById('loginShopName'); if(elLoginShop) elLoginShop.innerText='Boutique: '+STATE.SHOP;
  let du=document.getElementById('du'); let au=document.getElementById('au'); if(du) du.valueAsDate=new Date(new Date().setDate(1)); if(au) au.valueAsDate=new Date();
  
  let cached=JSON.parse(localStorage.getItem('bateke_stock_'+STATE.SHOP)||'[]'); 
  if(cached.length){ STATE.STOCK=cached; window.STOCK=cached; window.renderStock?.(); console.log("Stock CACHE:", cached.length); }
  
  if(window.db){
    window.db.ref('.info/connected').on('value',snap=>{ STATE.FIREBASE_CONNECTED=snap.val()===true; window.FIREBASE_CONNECTED=STATE.FIREBASE_CONNECTED; STATE.IS_ONLINE=navigator.onLine; window.updateOfflineUI?.(); if(STATE.FIREBASE_CONNECTED) window.syncOfflineQueue?.(); });
    window.addEventListener('online',()=>{ STATE.IS_ONLINE=true; window.updateOfflineUI?.(); }); 
    window.addEventListener('offline',()=>{ STATE.IS_ONLINE=false; STATE.FIREBASE_CONNECTED=false; window.updateOfflineUI?.(); });
    
    window.db.ref('shops/'+STATE.SHOP+'/stock').on('value',s=>{ if(s.val()){ STATE.STOCK=Object.values(s.val()); window.STOCK=STATE.STOCK; window.saveStockCache?.(); window.renderStock?.(); console.log("✅ SYNC "+STATE.SHOP+" stock:", STATE.STOCK.length); } });
    window.db.ref('shops/'+STATE.SHOP+'/ventes').on('value',s=>{ STATE.VENTES=Object.values(s.val()||{}); window.VENTES=STATE.VENTES; window.renderVentesJour?.(); window.updateKPI?.(); });
    window.db.ref('shops/'+STATE.SHOP+'/depenses').on('value',s=>{ STATE.DEP=Object.values(s.val()||{}); window.renderCaisse?.(); window.updateKPI?.(); });
    window.db.ref('shops/'+STATE.SHOP+'/versements').on('value',s=>{ STATE.VERS=Object.values(s.val()||{}); window.renderCaisse?.(); window.updateKPI?.(); });
    window.db.ref('shops/'+STATE.SHOP+'/devis').on('value',s=>{ if(s.val()){ STATE.DEVIS=Object.entries(s.val()).map(([k,v])=>({...v,_id:k})); window.renderDevisList?.(); } });
    window.db.ref('shops/'+STATE.SHOP+'/factures').on('value',s=>{ if(s.val()){ STATE.FACTURES=Object.entries(s.val()).map(([k,v])=>({...v,_id:k})); window.renderFactList?.(); } });
    // 🔒 BOUTIQUE LOCK - si vendeur verrouillé, on ne re-remplit pas le select avec toutes les boutiques
    window.db.ref('shops').on('value',snap=>{ 
      if(STATE._lockedShop || (STATE.CURRENT_VENDEUR && !STATE.CURRENT_VENDEUR.isAdmin)) return; // ne pas écraser si verrouillé
      let data=snap.val()||{}; let list=Object.keys(data); let sel=document.getElementById('shopSel'); if(sel) sel.innerHTML=list.map(ss=>`<option ${ss===STATE.SHOP?'selected':''} value="${ss}">${ss}</option>`).join(''); 
    });
  }
  let sess=JSON.parse(localStorage.getItem('vendeur_session_'+STATE.SHOP)||'null'); if(sess && (Date.now()-sess.ts)<12*60*60*1000){ let pinEl=document.getElementById('pinInput'); if(pinEl) pinEl.value=sess.pin; }
  console.log("Vendeur prêt - Stock:", STATE.STOCK.length);
});
