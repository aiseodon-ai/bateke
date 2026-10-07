import { esc } from "../common/utils.js";

// On récupère les globals de auth.js
let SHOP = () => window.SHOP || localStorage.getItem('patron_shop') || 'Menkao1';
let SHOPS_LIST = () => window.SHOPS_LIST || [];
let ALL_DATA = () => window.ALL_DATA || {};
let CURRENT_CONFIG = () => window.CURRENT_CONFIG || {nom:"ETS BATEKE", taux:2850, tauxUSD:2850};
let PANIER_ACHAT = () => window.PANIER_ACHAT || [];

// ============================================================
// GET FILTERED - ORIGINAL
// ============================================================
export function getFiltered(){
  const shop = SHOP();
  const shopsList = SHOPS_LIST();
  const allData = ALL_DATA();
  if(shop==='ALL'){
    let agg={ventes:[],dep:[],vers:[],stock:[],entrees:[]};
    shopsList.forEach(s=>{
      let d=allData[s]||{};
      agg.ventes=[...agg.ventes,...(d.ventes||[])];
      agg.dep=[...agg.dep,...(d.dep||[])];
      agg.stock=[...agg.stock,...(d.stock||[])];
      agg.entrees=[...agg.entrees,...(d.entrees||[]).map(e=>({...e,_shop:s}))];
    });
    return agg;
  }else{
    let d=allData[shop]||{ventes:[],dep:[],vers:[],stock:[],entrees:[]};
    let versRaw=allData[shop]?.vers||[];
    return {...d,vers:versRaw.map(v=>({...v,_shop:shop})),entrees:(d.entrees||[]).map(e=>({...e,_shop:shop}))};
  }
}

// ============================================================
// UPDATE KPIs - ORIGINAL
// ============================================================
export function updateKPIs(){
  let data=getFiltered();
  let today=new Date().toDateString();
  let vToday=data.ventes.filter(v=>new Date(v.date).toDateString()===today);
  let caJ=vToday.reduce((s,v)=>s+(v.total||0),0);
  const caJourEl = document.getElementById('caJour'); if(caJourEl) caJourEl.innerText=caJ.toLocaleString()+' FC';
  const caDetailEl = document.getElementById('caJourDetail'); if(caDetailEl) caDetailEl.innerText='Encaissé: '+vToday.reduce((s,v)=>s+(v.montantPaye??v.total),0).toLocaleString();
  const benefEl = document.getElementById('benefJour');
  if(benefEl) benefEl.innerText=(vToday.reduce((s,v)=>s+(v.benefice||0),0)-data.dep.filter(d=>new Date(d.date).toDateString()===today).reduce((s,d)=>s+d.montant,0)).toLocaleString()+' FC';
  const aVerserEl = document.getElementById('aVerser'); if(aVerserEl && caDetailEl) aVerserEl.innerText=caDetailEl.innerText;
  const detteEl = document.getElementById('detteJour'); if(detteEl) detteEl.innerText=vToday.reduce((s,v)=>s+(v.reste||0),0).toLocaleString()+' FC';
}

// ============================================================
// RENDER STOCK - ORIGINAL COMPLET AVEC DATA_MAP
// ============================================================
let DATA_MAP = {};

export function renderStock(){
 let data=getFiltered();
 let q=(document.getElementById('searchS')?.value||'').toLowerCase();
 let f=data.stock.filter(p=>(p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q)).sort((a,b)=>(a.CODE||'').localeCompare(b.CODE||''));
 let totalFC=0,totalPA=0,totalQte=0,totalRef=0;
 data.stock.filter(p=>p.actif!==false).forEach(p=>{
   totalFC+=(p.Quantite||0)*(p['Prix Unit']||0);
   totalPA+=(p.Quantite||0)*(p['Prix Achat']||0);
   totalQte+=(p.Quantite||0);
   totalRef++;
 });
 let tauxUSD=(CURRENT_CONFIG().taux&&typeof CURRENT_CONFIG().taux==='object'?CURRENT_CONFIG().taux.USD:CURRENT_CONFIG().tauxUSD)||2850;
 let benefLatent=totalFC-totalPA;

 // KPI Stock
 const valFC = document.getElementById('valStockFC'); if(valFC) valFC.innerText=totalFC.toLocaleString()+' FC';
 const valFCDet = document.getElementById('valStockFCDetail'); if(valFCDet) valFCDet.innerText=totalQte.toLocaleString()+' pcs - '+totalRef+' réf - PV x Qté';
 const valUSD = document.getElementById('valStockUSD'); if(valUSD) valUSD.innerText=(tauxUSD?totalFC/tauxUSD:0).toLocaleString(undefined,{maximumFractionDigits:2})+' $';
 const valUSDDet = document.getElementById('valStockUSDDetail'); if(valUSDDet) valUSDDet.innerText='Taux 1$='+tauxUSD.toLocaleString()+' FC';
 const valPA = document.getElementById('valStockPA'); if(valPA) valPA.innerText=totalPA.toLocaleString()+' FC';
 const valBenef = document.getElementById('valStockBenef'); if(valBenef) valBenef.innerText=benefLatent.toLocaleString()+' FC';

 // Build DATA_MAP for editField
 DATA_MAP={};
 f.forEach(p=>{ DATA_MAP[p.CODE]=p; });
 window.DATA_MAP=DATA_MAP;

 const tbody = document.getElementById('stockT');
 if(!tbody) return;
 tbody.innerHTML=f.map(p=>`<tr style="${p.actif===false?'opacity:.5;background:#fee':''}">
   <td>${esc(p.CODE)}</td>
   <td class="editable" data-code="${esc(p.CODE)}" data-field="Designation" onclick="window.editField(this.dataset.code,this.dataset.field,window.DATA_MAP[this.dataset.code]?.Designation||'')">${esc(p.Designation)} ✏</td>
   <td class="editable" data-code="${esc(p.CODE)}" data-field="Quantite" onclick="window.editField(this.dataset.code,this.dataset.field,window.DATA_MAP[this.dataset.code]?.Quantite||0)">${p.Quantite} ✏</td>
   <td class="editable" data-code="${esc(p.CODE)}" data-field="seuil" onclick="window.editField(this.dataset.code,this.dataset.field,window.DATA_MAP[this.dataset.code]?.seuil||3)">${p.seuil||3} ✏</td>
   <td class="editable" data-code="${esc(p.CODE)}" data-field="Prix Unit" onclick="window.editField(this.dataset.code,this.dataset.field,window.DATA_MAP[this.dataset.code]?.['Prix Unit']||0)">${(p['Prix Unit']||0).toLocaleString()} ✏</td>
   <td class="editable" data-code="${esc(p.CODE)}" data-field="Prix Achat" onclick="window.editField(this.dataset.code,this.dataset.field,window.DATA_MAP[this.dataset.code]?.['Prix Achat']||0)">${(p['Prix Achat']||0).toLocaleString()} ✏</td>
   <td>${((p['Prix Unit']||0)-(p['Prix Achat']||0)).toLocaleString()}</td>
   <td>${p.actif!==false?'✅ Actif':'🚫'}</td>
   <td>
     <button class="btn ${p.actif!==false?'btn-r':'btn-g'}" style="width:auto" onclick="window.toggleActif('${esc(p.CODE)}')">${p.actif!==false?'Désactiver':'Activer'}</button>
     <button class="btn btn-g" style="width:auto" onclick="window.entree('${esc(p.CODE)}')">+Entrée</button>
     <button class="btn btn-r" style="width:auto" onclick="window.supp('${esc(p.CODE)}')">X</button>
   </td>
 </tr>`).join('') || '<tr><td colspan=9>Aucun article</td></tr>';
}

// ============================================================
// TOGGLE ACTIF - ORIGINAL
// ============================================================
export function toggleActif(code){
  let t=SHOP()==='ALL'?prompt('Boutique? '+SHOPS_LIST().join('/')):SHOP();
  let p=ALL_DATA()[t]?.stock?.find(x=>x.CODE===code);
  let cur=p?.actif!==false;
  if(confirm(cur?'Désactiver '+code+'?':'Activer '+code+'?')){
    window.db.ref('shops/'+t+'/stock/'+code).update({actif:!cur});
  }
}

// ============================================================
// EDIT FIELD - VERSION SECURISEE AVEC TRANSACTION
// ============================================================
export async function editField(code,field,oldVal){
  let safeOld = esc(oldVal);
  let safeCode = esc(code);
  let nv=prompt(`Modifier ${field} pour ${safeCode}\nAncien: ${safeOld}\nNouveau:`, oldVal);
  if(nv===null||nv==='') return;

  let val;
  if(field==='Designation'){
    if(/[<>]/.test(nv)){ alert('⛔ Caractères < > interdits'); return; }
    val = nv.trim();
  } else {
    val = Number(nv);
  }

  let t=SHOP()==='ALL'?prompt('Boutique cible? '+SHOPS_LIST().join('/')):SHOP();
  if(!t) return;

  if(field==='Quantite'){
    let ref=window.db.ref('shops/'+t+'/stock/'+code+'/Quantite');
    let res=await ref.transaction(current=>{ return val; });
    if(res.committed) alert('✅ Quantité mise à jour');
    else alert('❌ Conflit, réessaie');
  }else{
    window.db.ref('shops/'+t+'/stock/'+code).update({[field]:val});
  }
}

// ============================================================
// ENTREE STOCK - TRANSACTION SECURISEE
// ============================================================
export async function entree(code){
  let qty=parseInt(prompt('Qté entrée '+code+'?'));
  if(!qty) return;
  let s=SHOP()==='ALL'?prompt('Boutique? '+SHOPS_LIST().join('/')):SHOP();
  if(!s) return;
  let qui=prompt('Qui?','PATRON');
  try{
    let ref=window.db.ref('shops/'+s+'/stock/'+code+'/Quantite');
    let result=await ref.transaction(currentQte=>{
      if(currentQte===null) return qty;
      return currentQte + qty;
    });
    if(result.committed){
      window.db.ref('shops/'+s+'/stock/'+code).once('value').then(snap=>{
        let p=snap.val();
        window.db.ref('shops/'+s+'/entrees/'+Date.now()).set({date:new Date().toISOString(),CODE:code,Designation:p?.Designation||code,boutique:s,qty:qty,vendeur:qui});
      });
      alert(`✅ Entrée OK: +${qty}. Nouveau stock: ${result.snapshot.val()}`);
    }else{
      alert('❌ Entrée annulée');
    }
  }catch(e){ alert('Erreur: '+e.message); }
}

export function supp(code){
  if(!confirm('Supprimer '+code+'?')) return;
  let s=SHOP()==='ALL'?prompt('Boutique?'):SHOP();
  window.db.ref('shops/'+s+'/stock/'+code).remove();
}

export function saveNewArt(){
  let code=document.getElementById('newCode')?.value.trim();
  if(!code) return alert("CODE requis");
  let data={
    CODE:code,
    Designation:document.getElementById('newDes')?.value||'',
    'Prix Unit':Number(document.getElementById('newPV')?.value)||0,
    'Prix Achat':Number(document.getElementById('newPA')?.value)||0,
    Quantite:Number(document.getElementById('newQte')?.value)||0,
    seuil:Number(document.getElementById('newSeuil')?.value)||3,
    actif:document.getElementById('newActif')?.checked!==false
  };
  let s=SHOP()==='ALL'?prompt('Boutique?'):SHOP();
  window.db.ref('shops/'+s+'/stock/'+code).set(data);
  window.closeModal?.('modalArt');
}

// ============================================================
// ACHAT - CODE INTACT V4.9.14
// ============================================================
export function savePanierAchat(){
  localStorage.setItem('panier_achat_'+SHOP(), JSON.stringify(window.PANIER_ACHAT||PANIER_ACHAT()));
}

export function renderAchatStock(){
  let data=getFiltered();
  let q=(document.getElementById('searchAchat')?.value||'').toLowerCase();
  let filtre=document.getElementById('filtreAchat')?.value||'tous';
  let panier = window.PANIER_ACHAT || [];
  let f=data.stock.filter(p=>{
    if(p.actif===false) return false;
    if(q&&!((p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q))) return false;
    if(filtre==='manque'&&(p.Quantite||0)>(p.seuil||3)) return false;
    if(filtre==='rupture'&&(p.Quantite||0)>0) return false;
    return true;
  }).slice(0,400);

  const tbody = document.getElementById('achatStockT');
  if(!tbody) return;
  tbody.innerHTML=f.map(p=>{
    let manque=Math.max(0,(p.seuil||3)-(p.Quantite||0));
    let deja=panier.find(x=>x.CODE===p.CODE);
    let qteAchat=deja?deja.qteAchat:manque||1;
    return `<tr>
      <td><b>${esc(p.CODE)}</b></td>
      <td>${esc(p.Designation)}</td>
      <td style="text-align:center;color:${(p.Quantite||0)<= (p.seuil||3)?'red':''};font-weight:bold">${p.Quantite||0}</td>
      <td>${p.seuil||3}</td>
      <td style="color:#ef4444;font-weight:bold">${manque}</td>
      <td style="background:#fffde7;font-weight:bold">${(p['Prix Achat']||0).toLocaleString()}</td>
      <td><input type="number" id="qa_${p.CODE}" value="${qteAchat}" min="1" style="width:70px" onchange="window.updateQteAchat('${esc(p.CODE)}',this.value)"></td>
      <td>${((p['Prix Achat']||0)*qteAchat).toLocaleString()}</td>
      <td><button class="btn btn-g" style="width:auto" onclick="window.ajouterAchat('${esc(p.CODE)}')">➕</button></td>
    </tr>`;
  }).join('')||'<tr><td colspan=9>Aucun</td></tr>';
}

export function updateQteAchat(code,qte){
  let panier = window.PANIER_ACHAT||[];
  let p=panier.find(x=>x.CODE===code);
  if(p){ p.qteAchat=parseInt(qte)||1; savePanierAchat(); renderPanierAchat(); }
}

export function ajouterAchat(code){
  let data=getFiltered();
  let p=data.stock.find(x=>x.CODE===code);
  if(!p) return;
  let qte=parseInt(document.getElementById('qa_'+code)?.value)||1;
  let panier = window.PANIER_ACHAT||[];
  let exist=panier.find(x=>x.CODE===code);
  if(exist){ exist.qteAchat+=qte; }
  else{ panier.push({CODE:p.CODE,Designation:p.Designation,Quantite:p.Quantite,seuil:p.seuil,PA:p['Prix Achat']||0,qteAchat:qte}); }
  window.PANIER_ACHAT=panier;
  savePanierAchat(); renderPanierAchat();
}

export function ajouterManquesAuto(){
  let data=getFiltered();
  let panier = window.PANIER_ACHAT||[];
  let manques=data.stock.filter(p=>p.actif!==false&&(p.Quantite||0)<=(p.seuil||3));
  manques.forEach(p=>{
    let manque=Math.max(1,(p.seuil||3)-(p.Quantite||0));
    if(!panier.find(x=>x.CODE===p.CODE)) panier.push({CODE:p.CODE,Designation:p.Designation,Quantite:p.Quantite,seuil:p.seuil,PA:p['Prix Achat']||0,qteAchat:manque});
  });
  window.PANIER_ACHAT=panier;
  savePanierAchat(); renderPanierAchat(); alert(manques.length+' ajoutés');
}

export function renderPanierAchat(){
  let panier = window.PANIER_ACHAT||[];
  let total=0;
  let taux=(CURRENT_CONFIG().taux&&typeof CURRENT_CONFIG().taux==='object'?CURRENT_CONFIG().taux.USD:CURRENT_CONFIG().tauxUSD)||2850;
  const tbody = document.getElementById('panierAchatT');
  if(!tbody) return;
  tbody.innerHTML=panier.map((p,i)=>{
    let lineTotal=(p.PA||0)*p.qteAchat; total+=lineTotal;
    return `<tr>
      <td>${esc(p.CODE)}</td><td>${esc(p.Designation)}</td><td>${p.Quantite}</td>
      <td><input type="number" value="${p.qteAchat}" min="1" style="width:60px" onchange="window.PANIER_ACHAT[${i}].qteAchat=parseInt(this.value)||1;window.savePanierAchat();window.renderPanierAchat()"></td>
      <td>${(p.PA||0).toLocaleString()}</td><td><b>${lineTotal.toLocaleString()}</b></td>
      <td><button class="btn btn-r" style="width:auto" onclick="window.supprimerAchat(${i})">X</button></td>
    </tr>`;
  }).join('')||'<tr><td colspan=7>Aucun - ajoute depuis tableau</td></tr>';

  const totalEl = document.getElementById('totalAchat'); if(totalEl) totalEl.innerText=total.toLocaleString()+' FC';
  const total2El = document.getElementById('totalAchat2'); if(total2El) total2El.innerText=total.toLocaleString()+' FC';
  const nbEl = document.getElementById('nbAchat'); if(nbEl) nbEl.innerText=panier.length;
  const usdEl = document.getElementById('totalAchatUSD'); if(usdEl) usdEl.innerText=(taux?total/taux:0).toLocaleString(undefined,{maximumFractionDigits:2})+' $';
}

export function supprimerAchat(idx){
  let panier = window.PANIER_ACHAT||[];
  panier.splice(idx,1);
  window.PANIER_ACHAT=panier;
  savePanierAchat(); renderPanierAchat();
}

export function viderPanierAchat(){
  if(!confirm('Vider?')) return;
  window.PANIER_ACHAT=[];
  savePanierAchat(); renderPanierAchat();
}

export function pdfRequisitionAchat(){
  let panier = window.PANIER_ACHAT||[];
  if(!panier.length){ alert('Vide'); return; }
  let total=panier.reduce((s,p)=>s+(p.PA||0)*p.qteAchat,0);
  let html=`<html><head><title>Requisition Achat ${SHOP()}</title><style>body{font-family:Arial;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px}th{background:#111;color:#fff}</style></head><body><h2>${CURRENT_CONFIG().nom} - REQUISITION ACHAT</h2><p>Boutique: ${SHOP()} - Date: ${new Date().toLocaleDateString()}</p><table><tr><th>N°</th><th>CODE</th><th>Désignation</th><th>Stock actuel</th><th>Seuil</th><th>Qté achat</th><th>PA</th><th>Total PA</th></tr>`+panier.map((p,i)=>`<tr><td>${i+1}</td><td>${p.CODE}</td><td>${p.Designation}</td><td>${p.Quantite}</td><td>${p.seuil}</td><td><b>${p.qteAchat}</b></td><td>${(p.PA||0).toLocaleString()}</td><td>${((p.PA||0)*p.qteAchat).toLocaleString()}</td></tr>`).join('')+`<tr style="background:#111;color:#fff"><td colspan=5>TOTAL</td><td>${panier.reduce((s,p)=>s+p.qteAchat,0)}</td><td></td><td>${total.toLocaleString()} FC</td></tr></table></body></html>`;
  let w=window.open('','','width=1000'); w.document.write(html); w.print();
}

export function exportExcelAchat(){
  let panier = window.PANIER_ACHAT||[];
  if(!panier.length){ alert('Vide'); return; }
  let csv='CODE,Designation,Stock,Seuil,Qte Achat,PA,Total\n'+panier.map(p=>`${p.CODE},${p.Designation.replace(/,/g,' ')},${p.Quantite},${p.seuil},${p.qteAchat},${p.PA},${p.PA*p.qteAchat}`).join('\n');
  let blob=new Blob([csv],{type:'text/csv'}); let url=URL.createObjectURL(blob);
  let a=document.createElement('a'); a.href=url; a.download='requisition_achat_'+SHOP()+'.csv'; a.click();
}

// LISTEN SHOP - ECOUTE TEMPS REEL FIREBASE
export function listenShop(s){
  const db = window.db;
  if(!db) return;
  db.ref('shops/'+s+'/stock').on('value',snap=>{
    if(!window.ALL_DATA[s]) window.ALL_DATA[s]={};
    window.ALL_DATA[s].stock=Object.values(snap.val()||{});
    if(window.savePatronCache) window.savePatronCache();
    if(SHOP()===s||SHOP()==='ALL'){ renderStock(); renderAchatStock(); updateKPIs(); }
  });
  db.ref('shops/'+s+'/ventes').on('value',snap=>{
    let raw=snap.val()||{};
    if(!window.ALL_DATA[s]) window.ALL_DATA[s]={};
    window.ALL_DATA[s].ventes=Object.entries(raw).map(([k,v])=>({...v,_id:k,_shop:s}));
    if(window.savePatronCache) window.savePatronCache();
    if(SHOP()===s||SHOP()==='ALL'){
      if(typeof window.renderVentes==="function") window.renderVentes();
      updateKPIs();
      if(typeof window.renderCaisse==="function") window.renderCaisse();
      if(typeof window.renderCRM==="function") window.renderCRM();
      if(typeof window.renderDettes==="function") window.renderDettes();
    }
  });
}

// Globals
window.getFiltered=getFiltered;
window.updateKPIs=updateKPIs;
window.renderStock=renderStock;
window.toggleActif=toggleActif;
window.editField=editField;
window.entree=entree;
window.supp=supp;
window.saveNewArt=saveNewArt;
window.savePanierAchat=savePanierAchat;
window.renderAchatStock=renderAchatStock;
window.updateQteAchat=updateQteAchat;
window.ajouterAchat=ajouterAchat;
window.ajouterManquesAuto=ajouterManquesAuto;
window.renderPanierAchat=renderPanierAchat;
window.supprimerAchat=supprimerAchat;
window.viderPanierAchat=viderPanierAchat;
window.pdfRequisitionAchat=pdfRequisitionAchat;
window.exportExcelAchat=exportExcelAchat;
window.listenShop=listenShop;

console.log("stock.js V4.9.25 COMPLET chargé");
