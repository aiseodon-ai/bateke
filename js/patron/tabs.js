import { SHOP as SHOP_AUTH, SHOPS_LIST as SHOPS_LIST_AUTH, ALL_DATA as ALL_DATA_AUTH, CURRENT_CONFIG, PANIER_ACHAT, savePatronCache, loadPatronCache } from "./auth.js";
import { esc } from "../common/utils.js";

// On utilise les variables globales de auth.js
let SHOP = window.SHOP || localStorage.getItem('patron_shop') || 'Menkao1';
let SHOPS_LIST = window.SHOPS_LIST || [];
let ALL_DATA = window.ALL_DATA || {};

// ============================================================
// SWITCH TAB - CODE ORIGINAL INTACT V4.9.25
// ============================================================
export function switchTab(id){
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  const target = document.getElementById(id);
  if(target) target.classList.add('active');

  document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
  document.getElementById('btn-'+id)?.classList.add('active');

  // Appels originaux pour charger les données au clic
  if(id==='achat'){
    if(typeof window.renderAchatStock==="function") window.renderAchatStock();
    if(typeof window.renderPanierAchat==="function") window.renderPanierAchat();
  }
  if(id==='parametres' || id==='paramètres' || id==='params'){
    if(typeof window.renderApercu==="function") window.renderApercu();
  }
  if(id==='rapport'){
    if(typeof window.genRapport==="function") window.genRapport();
  }
  if(id==='crm'){
    if(typeof window.renderCRM==="function") window.renderCRM();
  }
  if(id==='dettes'){
    if(typeof window.renderDettes==="function") window.renderDettes();
  }
  if(id==='compta'){
    if(typeof window.calcCompta==="function") window.calcCompta();
  }
  if(id==='stock'){
    if(typeof window.renderStock==="function") window.renderStock();
  }
  if(id==='ventes'){
    if(typeof window.renderVentes==="function") window.renderVentes();
  }
  if(id==='caisse'){
    if(typeof window.renderCaisse==="function") window.renderCaisse();
  }
}

export function switchSub(id){
  const vueTable = document.getElementById('vue-table');
  const vueGraph = document.getElementById('vue-graph');
  if(vueTable) vueTable.style.display=id==='table'?'block':'none';
  if(vueGraph) vueGraph.style.display=id==='graph'?'block':'none';
  document.getElementById('sub-table')?.classList.toggle('active',id==='table');
  document.getElementById('sub-graph')?.classList.toggle('active',id==='graph');
  if(id==='graph' && typeof window.genGraph==="function") window.genGraph();
}

// ============================================================
// REFRESH ALL - ORIGINAL
// ============================================================
export function refreshAll(){
  try{
    if(typeof window.updateKPIs==="function") window.updateKPIs();
    if(typeof window.renderVentes==="function") window.renderVentes();
    if(typeof window.renderCaisse==="function") window.renderCaisse();
    if(typeof window.renderStock==="function") window.renderStock();
    if(typeof window.renderCRM==="function") window.renderCRM();
    if(typeof window.renderDettes==="function") window.renderDettes();
    if(typeof window.renderPresenceKPI==="function") window.renderPresenceKPI();
    if(typeof window.renderAchatStock==="function") window.renderAchatStock();
    if(typeof window.renderPanierAchat==="function") window.renderPanierAchat();
    updateLabels();
  }catch(e){ console.warn("refreshAll:", e); }
}

// ============================================================
// BOUTIQUES - ORIGINAL
// ============================================================
export function renderBoutiques(data){
  SHOPS_LIST = window.SHOPS_LIST || SHOPS_LIST;
  ALL_DATA = window.ALL_DATA || ALL_DATA;

  let html=SHOPS_LIST.map(shop=>{
    const nbArt = (ALL_DATA[shop]?.stock?.length||0);
    return `<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #eee">
      <div><b>${esc(shop)}</b><br><small>${nbArt} articles</small></div>
      <div><button class="btn btn-b" style="width:auto" onclick="window.selectShop('${esc(shop)}')">Ouvrir</button></div>
    </div>`;
  }).join('');

  const listShops = document.getElementById('listShops');
  if(listShops) listShops.innerHTML=html||'<p>Aucune boutique</p>';

  const allLinks = document.getElementById('allLinks');
  if(allLinks){
    allLinks.innerHTML=SHOPS_LIST.map(s=>`<div style="padding:6px;border-bottom:1px solid #eee"><b>${esc(s)}</b><br><small>vendeur.html?shop=${s}</small></div>`).join('');
  }
}

export function createShop(){
  const input = document.getElementById('newShop');
  let n=(input?.value||'').trim();
  if(!n) return alert("Nom boutique requis");
  const clean = n.replace(/[^a-zA-Z0-9]/g,'');
  if(!clean) return alert("Nom invalide");

  const { db } = window.firebase? {db: firebase.database()} : {db: null};
  if(window.db) window.db.ref('shops/'+clean+'/config').set({created:new Date().toISOString()}).then(()=>alert('Boutique créée: '+clean));
  else if(typeof db!=="undefined" && db) db.ref('shops/'+clean+'/config').set({created:new Date().toISOString()});
  else alert('Créée localement: '+clean);
}

export function selectShop(shop){
  SHOP=shop;
  window.SHOP=shop;
  localStorage.setItem('patron_shop',SHOP);
  localStorage.setItem('shopPatron',SHOP);
  window.CURRENT_SHOP=shop;

  const panier = JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
  window.PANIER_ACHAT = panier;

  const sel = document.getElementById('shopSel');
  if(sel) sel.value=shop;

  updateLabels();
  refreshAll();
}

// ============================================================
// MODALS & UI - ORIGINAL
// ============================================================
export function openNewArt(){
  const modal = document.getElementById('modalArt') || document.getElementById('modalNewArt');
  if(modal) modal.classList.add('active');
}
export function closeModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove('active');
  else document.querySelectorAll('.modal').forEach(m=>m.classList.remove('active'));
}

export function previewLogo(inp){
  if(inp.files&&inp.files[0]){
    let r=new FileReader();
    r.onload=e=>{
      const preview = document.getElementById('logoPreview');
      if(preview) preview.src=e.target.result;
      if(window.CURRENT_CONFIG) window.CURRENT_CONFIG.logo=e.target.result;
      if(typeof window.renderApercu==="function") window.renderApercu();
    };
    r.readAsDataURL(inp.files[0]);
  }
}

// ============================================================
// UPDATE LABELS - CORRIGE LE BUG "undefined"
// ============================================================
export function updateLabels(){
  SHOP = window.SHOP || SHOP;
  const isSuper = window.isSuperAdmin || false;
  const config = window.CURRENT_CONFIG || CURRENT_CONFIG || {nom:"ETS BATEKE"};

  const lab1=document.getElementById('labVenteShop'); if(lab1) lab1.innerText=SHOP;
  const lab2=document.getElementById('labVendShop'); if(lab2) lab2.innerText=SHOP;
  const lab3=document.getElementById('presenceShopLab'); if(lab3) lab3.innerText=SHOP;
  const lienV=document.getElementById('lienV'); if(lienV) lienV.innerText='https://aiseodon-ai.github.io/bateke/vendeur.html?shop='+SHOP;
  const paramShop=document.getElementById('paramShopName'); if(paramShop) paramShop.innerText=SHOP;
  const headerEnt=document.getElementById('headerEntreprise');
  if(headerEnt) headerEnt.innerHTML=(isSuper?'👑 SUPER - ':'👑 ')+(config.nom||'ETS BATEKE')+' - '+SHOP;

  // Fix aussi pour data-shop-label
  document.querySelectorAll("[data-shop-label]").forEach(el=>el.textContent=SHOP);

  // Fix titre page
  document.title = `Bateke Patron - ${SHOP} - V4.9.25`;

  // Fix le header qui affichait "undefined" - cible le h1
  const h1 = document.querySelector('header h1,.header h1, #headerEntreprise');
  if(h1 && h1.innerText.includes('undefined')){
    h1.innerHTML = `👑 ${config.nom||'ETS BATEKE'} - ${SHOP}`;
  }
}

export function switchShop(){
  const sel = document.getElementById('shopSel') || document.getElementById('shopSelector');
  if(!sel) return;
  SHOP=sel.value;
  window.SHOP=SHOP;
  localStorage.setItem('patron_shop',SHOP);
  localStorage.setItem('shopPatron',SHOP);
  window.CURRENT_SHOP=SHOP;
  window.PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
  updateLabels();
  refreshAll();
  if(typeof window.renderAchatStock==="function") window.renderAchatStock();
  if(typeof window.renderPanierAchat==="function") window.renderPanierAchat();
}

// Compatibilité globale - TOUTES les fonctions doivent être sur window
window.switchTab=switchTab;
window.switchSub=switchSub;
window.refreshAll=refreshAll;
window.renderBoutiques=renderBoutiques;
window.createShop=createShop;
window.selectShop=selectShop;
window.openNewArt=openNewArt;
window.closeModal=closeModal;
window.previewLogo=previewLogo;
window.updateLabels=updateLabels;
window.switchShop=switchShop;

console.log("tabs.js V4.9.25 COMPLET chargé - onglets actifs");
