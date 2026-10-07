import { CURRENT_SHOP } from "../common/config.js";
import { esc, fmtVu, saveStockCache, loadPatronCache } from "../common/utils.js";
import { db, refStock } from "../common/firebase.js";

let stockCache = [];
let filteredCache = [];

// RENDER STOCK - TABLEAU PRINCIPAL
export function renderStock(){
  const shop = window.CURRENT_SHOP || localStorage.getItem("shopPatron") || "Mbakana";
  const tbody = document.getElementById("stockBody");
  const search = document.getElementById("searchStock")?.value?.toLowerCase() || "";

  if(!tbody) return;

  const filtered = getFiltered(search);
  filteredCache = filtered;

  tbody.innerHTML = filtered.map((art, idx)=>{
    const actifClass = art.actif===false? 'inactive' : '';
    return `
      <tr class="${actifClass}">
        <td>${esc(art.nom)}</td>
        <td contenteditable="true" onblur="editField('${art.id}','prix',this.innerText)">${art.prix||0}</td>
        <td contenteditable="true" onblur="editField('${art.id}','qte',this.innerText)">${art.qte||0}</td>
        <td>${art.categorie||''}</td>
        <td>
          <button onclick="entree('${art.id}')">+ Entrée</button>
          <button onclick="toggleActif('${art.id}')">${art.actif===false?'Activer':'Désactiver'}</button>
          <button onclick="supp('${art.id}')" class="danger">Supp</button>
        </td>
      </tr>
    `;
  }).join("");

  updateKPIs(filtered);
  saveStockCache(shop, filtered);
}

export function getFiltered(search=""){
  const shop = window.CURRENT_SHOP || "Mbakana";
  // depuis cache ou global
  let all = window.stockData || stockCache || [];

  if(!search) return all;

  return all.filter(a=>{
    const n = (a.nom||'').toLowerCase();
    const cat = (a.categorie||'').toLowerCase();
    return n.includes(search) || cat.includes(search);
  });
}

export function updateKPIs(data){
  const totalVal = data.reduce((s,a)=> s + (Number(a.prix||0)*Number(a.qte||0)), 0);
  const totalQte = data.reduce((s,a)=> s + Number(a.qte||0), 0);
  const elVal = document.getElementById("kpiStockValeur");
  const elQte = document.getElementById("kpiStockQte");
  if(elVal) elVal.textContent = fmtVu(totalVal);
  if(elQte) elQte.textContent = totalQte;
}

export function toggleActif(id){
  const shop = window.CURRENT_SHOP || "Mbakana";
  const art = (window.stockData||[]).find(a=>a.id===id);
  if(!art) return;
  const newVal = art.actif===false? true : false;
  db.ref(`shops/${shop}/stock/${id}/actif`).set(newVal).then(()=>{
    art.actif = newVal;
    renderStock();
  });
}

export function editField(id, field, value){
  const shop = window.CURRENT_SHOP || "Mbakana";
  let val = value;
  if(field==="prix" || field==="qte") val = Number(value.replace(/[^0-9.-]/g,''));

  db.ref(`shops/${shop}/stock/${id}/${field}`).set(val).then(()=>{
    const art = (window.stockData||[]).find(a=>a.id===id);
    if(art) art[field] = val;
    if(field==="prix" || field==="qte") updateKPIs(window.stockData||[]);
  });
}

export function entree(id){
  const qte = prompt("Quantité entrée?");
  if(!qte) return;
  const n = Number(qte);
  if(isNaN(n)) return alert("Nombre invalide");

  const shop = window.CURRENT_SHOP || "Mbakana";
  const art = (window.stockData||[]).find(a=>a.id===id);
  if(!art) return;

  const newQte = Number(art.qte||0) + n;
  db.ref(`shops/${shop}/stock/${id}/qte`).set(newQte).then(()=>{
    art.qte = newQte;
    renderStock();
    // log entrée dans historique
    db.ref(`shops/${shop}/historique/entrees`).push({
      articleId: id,
      articleNom: art.nom,
      qte: n,
      date: Date.now(),
      shop
    });
  });
}

export function supp(id){
  if(!confirm("Supprimer cet article définitivement?")) return;
  const shop = window.CURRENT_SHOP || "Mbakana";
  db.ref(`shops/${shop}/stock/${id}`).remove().then(()=>{
    window.stockData = (window.stockData||[]).filter(a=>a.id!==id);
    renderStock();
  });
}

export function saveNewArt(){
  const nom = document.getElementById("newArtNom")?.value?.trim();
  const prix = Number(document.getElementById("newArtPrix")?.value||0);
  const qte = Number(document.getElementById("newArtQte")?.value||0);
  const cat = document.getElementById("newArtCat")?.value?.trim() || "Divers";

  if(!nom) return alert("Nom obligatoire");

  const shop = window.CURRENT_SHOP || "Mbakana";
  const id = Date.now().toString(36);

  const newArt = { id, nom, prix, qte, categorie: cat, actif: true, createdAt: Date.now() };

  db.ref(`shops/${shop}/stock/${id}`).set(newArt).then(()=>{
    (window.stockData||[]).push(newArt);
    renderStock();
    closeModal();
  });
}

export function buildDataMap(){
  const map = {};
  (window.stockData||[]).forEach(a=> map[a.id]=a );
  window.dataMap = map;
  return map;
}

export function pdfStockTotal(){
  // Utilise jsPDF - copie exacte de ton ancien code
  const { jsPDF } = window.jspdf || {};
  if(!jsPDF) return alert("jsPDF non chargé");

  const doc = new jsPDF();
  doc.text(`Stock Total - ${window.CURRENT_SHOP} - ${new Date().toLocaleDateString()}`, 10, 10);
  let y = 20;
  (filteredCache||window.stockData||[]).forEach(a=>{
    doc.text(`${a.nom} | Qte: ${a.qte} | Prix: ${a.prix}`, 10, y);
    y+=6;
    if(y>280){ doc.addPage(); y=10; }
  });
  doc.save(`stock_${window.CURRENT_SHOP}_${Date.now()}.pdf`);
}

export function pdfRequisition(){
  const manques = (window.stockData||[]).filter(a=> Number(a.qte||0) < 5);
  const { jsPDF } = window.jspdf || {};
  if(!jsPDF) return alert("jsPDF non chargé");

  const doc = new jsPDF();
  doc.text(`Réquisition - ${window.CURRENT_SHOP} - Articles en manque (<5)`, 10, 10);
  let y=20;
  manques.forEach(a=>{
    doc.text(`${a.nom} - Reste: ${a.qte}`, 10, y);
    y+=7;
  });
  doc.save(`requisition_${window.CURRENT_SHOP}.pdf`);
}

export function closeModal(){
  document.getElementById("modalNewArt")?.classList.add("hidden");
}
export function openNewArt(){
  document.getElementById("modalNewArt")?.classList.remove("hidden");
}

export function listenShop(shop){
  db.ref(`shops/${shop}/stock`).on("value", snap=>{
    const data = snap.val();
    if(data){
      window.stockData = Object.values(data);
      stockCache = window.stockData;
      renderStock();
    }
  });
}

// Compatibilité globale - NE RIEN CASSER
window.renderStock = renderStock;
window.toggleActif = toggleActif;
window.editField = editField;
window.entree = entree;
window.supp = supp;
window.saveNewArt = saveNewArt;
window.buildDataMap = buildDataMap;
window.pdfStockTotal = pdfStockTotal;
window.pdfRequisition = pdfRequisition;
window.openNewArt = openNewArt;
window.closeModal = closeModal;
window.listenShop = listenShop;
window.getFiltered = getFiltered;

console.log("stock.js chargé - 10 fonctions");
