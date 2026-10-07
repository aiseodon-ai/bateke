import { esc } from "../common/utils.js";

// Tes variables originales - ne pas toucher
let DATA_MAP={};
function buildDataMap(stock){ DATA_MAP={}; stock.forEach(p=>{DATA_MAP[p.CODE]=p;}); }

function getFiltered(){
  if(SHOP==='ALL'){
    let agg={ventes:[],dep:[],vers:[],stock:[],entrees:[]};
    SHOPS_LIST.forEach(s=>{
      let d=ALL_DATA[s]||{};
      agg.ventes=[...agg.ventes,...(d.ventes||[])];
      agg.dep=[...agg.dep,...(d.dep||[])];
      agg.stock=[...agg.stock,...(d.stock||[])];
      agg.entrees=[...agg.entrees,...(d.entrees||[]).map(e=>({...e,_shop:s}))];
    });
    return agg;
  }else{
    let d=ALL_DATA[SHOP]||{ventes:[],dep:[],vers:[],stock:[],entrees:[]};
    let versRaw=ALL_DATA[SHOP]?.vers||[];
    return {...d,vers:versRaw.map(v=>({...v,_shop:SHOP})),entrees:(d.entrees||[]).map(e=>({...e,_shop:SHOP}))};
  }
}

function updateKPIs(){
  let data=getFiltered();
  let today=new Date().toDateString();
  let vToday=data.ventes.filter(v=>new Date(v.date).toDateString()===today);
  let caJ=vToday.reduce((s,v)=>s+(v.total||0),0);
  document.getElementById('caJour').innerText=caJ.toLocaleString()+' FC';
  document.getElementById('caJourDetail').innerText='Encaissé: '+vToday.reduce((s,v)=>s+(v.montantPaye??v.total),0).toLocaleString();
  document.getElementById('benefJour').innerText=(vToday.reduce((s,v)=>s+(v.benefice||0),0)-data.dep.filter(d=>new Date(d.date).toDateString()===today).reduce((s,d)=>s+d.montant,0)).toLocaleString()+' FC';
  document.getElementById('aVerser').innerText=document.getElementById('caJourDetail').innerText;
  document.getElementById('detteJour').innerText=vToday.reduce((s,v)=>s+(v.reste||0),0).toLocaleString()+' FC';
}

function renderStock(){
 let data=getFiltered();
 let q=(document.getElementById('searchS').value||'').toLowerCase();
 let f=data.stock.filter(p=>(p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q)).sort((a,b)=>(a.CODE||'').localeCompare(b.CODE||''));
 let totalFC=0,totalPA=0,totalQte=0,totalRef=0;
 data.stock.filter(p=>p.actif!==false).forEach(p=>{totalFC+=(p.Quantite||0)*(p['Prix Unit']||0);totalPA+=(p.Quantite||0)*(p['Prix Achat']||0);totalQte+=(p.Quantite||0);totalRef++;});
 let tauxUSD=(CURRENT_CONFIG.taux&&typeof CURRENT_CONFIG.taux==='object'?CURRENT_CONFIG.taux.USD:CURRENT_CONFIG.tauxUSD)||2850;
 let benefLatent=totalFC-totalPA;
 document.getElementById('valStockFC').innerText=totalFC.toLocaleString()+' FC';
 document.getElementById('valStockFCDetail').innerText=totalQte.toLocaleString()+' pcs - '+totalRef+' réf - PV x Qté';
 document.getElementById('valStockUSD').innerText=(tauxUSD?totalFC/tauxUSD:0).toLocaleString(undefined,{maximumFractionDigits:2})+' $';
 document.getElementById('valStockUSDDetail').innerText='Taux 1$='+tauxUSD.toLocaleString()+' FC - Conversion PV total';
 document.getElementById('valStockPA').innerText=totalPA.toLocaleString()+' FC';
 document.getElementById('valStockBenef').innerText=benefLatent.toLocaleString()+' FC';
 buildDataMap(f);
 document.getElementById('stockT').innerHTML=f.map(p=>`<tr style="${p.actif===false?'opacity:.5;background:#fee':''}"><td>${esc(p.CODE)}</td><td class="editable" data-code="${esc(p.CODE)}" data-field="Designation" onclick="editField(this.dataset.code,this.dataset.field,DATA_MAP[this.dataset.code]?.Designation||'')">${esc(p.Designation)} ✏</td><td class="editable" data-code="${esc(p.CODE)}" data-field="Quantite" onclick="editField(this.dataset.code,this.dataset.field,DATA_MAP[this.dataset.code]?.Quantite||0)">${p.Quantite} ✏</td><td class="editable" data-code="${esc(p.CODE)}" data-field="seuil" onclick="editField(this.dataset.code,this.dataset.field,DATA_MAP[this.dataset.code]?.seuil||3)">${p.seuil||3} ✏</td><td class="editable" data-code="${esc(p.CODE)}" data-field="Prix Unit" onclick="editField(this.dataset.code,this.dataset.field,DATA_MAP[this.dataset.code]?.['Prix Unit']||0)">${(p['Prix Unit']||0).toLocaleString()} ✏</td><td class="editable" data-code="${esc(p.CODE)}" data-field="Prix Achat" onclick="editField(this.dataset.code,this.dataset.field,DATA_MAP[this.dataset.code]?.['Prix Achat']||0)">${(p['Prix Achat']||0).toLocaleString()} ✏</td><td>${((p['Prix Unit']||0)-(p['Prix Achat']||0)).toLocaleString()}</td><td>${p.actif!==false?'✅ Actif':'🚫'}</td><td><button class="btn ${p.actif!==false?'btn-r':'btn-g'}" style="width:auto" onclick="toggleActif('${esc(p.CODE)}')">${p.actif!==false?'Désactiver':'Activer'}</button> <button class="btn btn-g" style="width:auto" onclick="entree('${esc(p.CODE)}')">+Entrée</button> <button class="btn btn-r" style="width:auto" onclick="supp('${esc(p.CODE)}')">X</button></td></tr>`).join('');
}

function toggleActif(code){
  let t=SHOP==='ALL'?prompt('Boutique? '+SHOPS_LIST.join('/')):SHOP;
  let p=ALL_DATA[t]?.stock?.find(x=>x.CODE===code);
  let cur=p?.actif!==false;
  if(confirm(cur?'Désactiver '+code+'?':'Activer '+code+'?')){
    db.ref('shops/'+t+'/stock/'+code).update({actif:!cur});
  }
}

async function editField(code,field,oldVal){
  let safeOld = esc(oldVal);
  let safeCode = esc(code);
  let nv=prompt(`Modifier ${field} pour ${safeCode}\nAncien: ${safeOld}\nNouveau:`, oldVal);
  if(nv===null||nv==='') return;
  let val;
  if(field==='Designation'){
    if(/[<>]/.test(nv)){
      alert('⛔ Caractères < > interdits dans la désignation');
      return;
    }
    val = nv.trim();
  } else {
    val = Number(nv);
  }
  let t=SHOP==='ALL'?prompt('Boutique cible? '+SHOPS_LIST.join('/')):SHOP;
  if(!t) return;
  if(field==='Quantite'){
    let ref=db.ref('shops/'+t+'/stock/'+code+'/Quantite');
    let res=await ref.transaction(current=>{ return val; });
    if(res.committed) alert('✅ Quantité mise à jour');
    else alert('❌ Conflit, réessaie');
  }else{
    db.ref('shops/'+t+'/stock/'+code).update({[field]:val});
  }
}

async function entree(code){
  let qty=parseInt(prompt('Qté entrée '+code+'?'));
  if(!qty) return;
  let s=SHOP==='ALL'?prompt('Boutique? '+SHOPS_LIST.join('/')):SHOP;
  if(!s) return;
  let qui=prompt('Qui?','PATRON');
  try{
    let ref=db.ref('shops/'+s+'/stock/'+code+'/Quantite');
    let result=await ref.transaction(currentQte=>{
      if(currentQte===null) return qty;
      return currentQte + qty;
    });
    if(result.committed){
      db.ref('shops/'+s+'/stock/'+code).once('value').then(snap=>{
        let p=snap.val();
        db.ref('shops/'+s+'/entrees/'+Date.now()).set({date:new Date().toISOString(),CODE:code,Designation:p?.Designation||code,boutique:s,qty:qty,vendeur:qui});
      });
      alert(`✅ Entrée OK: +${qty}. Nouveau stock: ${result.snapshot.val()}`);
    }else{
      alert('❌ Entrée annulée');
    }
  }catch(e){
    alert('Erreur: '+e.message);
  }
}

function supp(code){
  if(!confirm('Supprimer '+code+'?')) return;
  let s=SHOP==='ALL'?prompt('Boutique?'):SHOP;
  db.ref('shops/'+s+'/stock/'+code).remove();
}

function saveNewArt(){
  let code=document.getElementById('newCode').value.trim();
  if(!code) return;
  let data={CODE:code,Designation:document.getElementById('newDes').value,'Prix Unit':Number(document.getElementById('newPV').value)||0,'Prix Achat':Number(document.getElementById('newPA').value)||0,Quantite:Number(document.getElementById('newQte').value)||0,seuil:Number(document.getElementById('newSeuil').value)||3,actif:document.getElementById('newActif').checked};
  let s=SHOP==='ALL'?prompt('Boutique?'):SHOP;
  db.ref('shops/'+s+'/stock/'+code).set(data);
  closeModal('modalArt');
}

function savePanierAchat(){localStorage.setItem('panier_achat_'+SHOP, JSON.stringify(PANIER_ACHAT));}

function renderAchatStock(){
  let data=getFiltered();
  let q=(document.getElementById('searchAchat')?.value||'').toLowerCase();
  let filtre=document.getElementById('filtreAchat')?.value||'tous';
  let f=data.stock.filter(p=>{
    if(p.actif===false) return false;
    if(q&&!((p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q))) return false;
    if(filtre==='manque'&&(p.Quantite||0)>(p.seuil||3)) return false;
    if(filtre==='rupture'&&(p.Quantite||0)>0) return false;
    return true;
  }).slice(0,400);
  document.getElementById('achatStockT').innerHTML=f.map(p=>{
    let manque=Math.max(0,(p.seuil||3)-(p.Quantite||0));
    let deja=PANIER_ACHAT.find(x=>x.CODE===p.CODE);
    let qteAchat=deja?deja.qteAchat:manque||1;
    return `<tr><td><b>${esc(p.CODE)}</b></td><td>${esc(p.Designation)}</td><td style="text-align:center;color:${(p.Quantite||0)<= (p.seuil||3)?'red':''};font-weight:bold">${p.Quantite||0}</td><td>${p.seuil||3}</td><td style="color:#ef4444;font-weight:bold">${manque}</td><td style="background:#fffde7;font-weight:bold">${(p['Prix Achat']||0).toLocaleString()}</td><td><input type="number" id="qa_${p.CODE}" value="${qteAchat}" min="1" style="width:70px" onchange="updateQteAchat('${p.CODE}',this.value)"></td><td>${((p['Prix Achat']||0)*qteAchat).toLocaleString()}</td><td><button class="btn btn-g" style="width:auto" onclick="ajouterAchat('${p.CODE}')">➕</button></td></tr>`;
  }).join('')||'<tr><td colspan=9>Aucun</td></tr>';
}

function updateQteAchat(code,qte){
  let p=PANIER_ACHAT.find(x=>x.CODE===code);
  if(p){p.qteAchat=parseInt(qte)||1;savePanierAchat();renderPanierAchat();}
}

function ajouterAchat(code){
  let data=getFiltered();
  let p=data.stock.find(x=>x.CODE===code);
  if(!p) return;
  let qte=parseInt(document.getElementById('qa_'+code)?.value)||1;
  let exist=PANIER_ACHAT.find(x=>x.CODE===code);
  if(exist){exist.qteAchat+=qte;}
  else{PANIER_ACHAT.push({CODE:p.CODE,Designation:p.Designation,Quantite:p.Quantite,seuil:p.seuil,PA:p['Prix Achat']||0,qteAchat:qte});}
  savePanierAchat();renderPanierAchat();
}

function ajouterManquesAuto(){
  let data=getFiltered();
  let manques=data.stock.filter(p=>p.actif!==false&&(p.Quantite||0)<=(p.seuil||3));
  manques.forEach(p=>{
    let manque=Math.max(1,(p.seuil||3)-(p.Quantite||0));
    if(!PANIER_ACHAT.find(x=>x.CODE===p.CODE))PANIER_ACHAT.push({CODE:p.CODE,Designation:p.Designation,Quantite:p.Quantite,seuil:p.seuil,PA:p['Prix Achat']||0,qteAchat:manque});
  });
  savePanierAchat();renderPanierAchat();alert(manques.length+' ajoutés');
}

function renderPanierAchat(){
  let total=0;
  let taux=(CURRENT_CONFIG.taux&&typeof CURRENT_CONFIG.taux==='object'?CURRENT_CONFIG.taux.USD:CURRENT_CONFIG.tauxUSD)||2850;
  document.getElementById('panierAchatT').innerHTML=PANIER_ACHAT.map((p,i)=>{
    let lineTotal=(p.PA||0)*p.qteAchat;total+=lineTotal;
    return `<tr><td>${esc(p.CODE)}</td><td>${esc(p.Designation)}</td><td>${p.Quantite}</td><td><input type="number" value="${p.qteAchat}" min="1" style="width:60px" onchange="PANIER_ACHAT[${i}].qteAchat=parseInt(this.value)||1;savePanierAchat();renderPanierAchat()"></td><td>${(p.PA||0).toLocaleString()}</td><td><b>${lineTotal.toLocaleString()}</b></td><td><button class="btn btn-r" style="width:auto" onclick="supprimerAchat(${i})">X</button></td></tr>`;
  }).join('')||'<tr><td colspan=7>Aucun - ajoute depuis tableau</td></tr>';
  document.getElementById('totalAchat').innerText=total.toLocaleString()+' FC';
  document.getElementById('totalAchat2').innerText=total.toLocaleString()+' FC';
  document.getElementById('nbAchat').innerText=PANIER_ACHAT.length;
  document.getElementById('totalAchatUSD').innerText=(taux?total/taux:0).toLocaleString()+' $';
}

function supprimerAchat(idx){PANIER_ACHAT.splice(idx,1);savePanierAchat();renderPanierAchat();}
function viderPanierAchat(){if(!confirm('Vider?'))return;PANIER_ACHAT=[];savePanierAchat();renderPanierAchat();}

function listenShop(s){
  db.ref('shops/'+s+'/stock').on('value',snap=>{ALL_DATA[s].stock=Object.values(snap.val()||{});savePatronCache();if(SHOP===s||SHOP==='ALL'){renderStock();renderAchatStock();updateKPIs();}});
  db.ref('shops/'+s+'/ventes').on('value',snap=>{let raw=snap.val()||{};ALL_DATA[s].ventes=Object.entries(raw).map(([k,v])=>({...v,_id:k,_shop:s}));savePatronCache();if(SHOP===s||SHOP==='ALL'){renderVentes();updateKPIs();renderCaisse();renderCRM();renderDettes();if(document.getElementById('rapport')?.classList.contains('active'))genRapport();}});
  db.ref('shops/'+s+'/depenses').on('value',snap=>{let raw=snap.val()||{};ALL_DATA[s].dep=Object.entries(raw).map(([k,v])=>({...v,_id:k}));savePatronCache();});
  db.ref('shops/'+s+'/entrees').on('value',snap=>{let raw=snap.val()||{};ALL_DATA[s].entrees=Object.entries(raw).map(([k,v])=>({...v,_id:k,_shop:s}));savePatronCache();});
  db.ref('shops/'+s+'/vendeurs').on('value',snap=>{ALL_DATA[s].vendeurs=snap.val()||{};savePatronCache();if(SHOP===s)renderVendeurs();renderPresenceKPI();});
  db.ref('shops/'+s+'/config_entreprise').on('value',snap=>{if(snap.val()&&(SHOP===s||SHOP==='ALL')){let c=snap.val();CURRENT_CONFIG={...CURRENT_CONFIG,...c,compta:{...CURRENT_CONFIG.compta,...(c.compta||{})}};applyConfigToUI();savePatronCache();}});
  db.ref('shops/'+s+'/presence').on('value',snap=>{ALL_DATA[s].presence=snap.val()||{};savePatronCache();renderPresenceKPI();if(SHOP===s)renderVendeurs();});
  db.ref('shops/'+s+'/vendeur_logs').on('value',snap=>{ALL_DATA[s].logs=snap.val()||{};savePatronCache();if(SHOP===s)renderVendeurs();});
  db.ref('shops/'+s+'/versements').on('value',snap=>{let raw=snap.val()||{};ALL_DATA[s].vers=Object.entries(raw).map(([k,v])=>({...v,_id:k}));savePatronCache();if(SHOP===s||SHOP==='ALL')renderCaisse();});
}

// Tes exports globaux originaux
window.getFiltered=getFiltered; window.updateKPIs=updateKPIs; window.renderStock=renderStock;
window.toggleActif=toggleActif; window.editField=editField; window.entree=entree; window.supp=supp;
window.saveNewArt=saveNewArt; window.savePanierAchat=savePanierAchat; window.renderAchatStock=renderAchatStock;
window.updateQteAchat=updateQteAchat; window.ajouterAchat=ajouterAchat; window.ajouterManquesAuto=ajouterManquesAuto;
window.renderPanierAchat=renderPanierAchat; window.supprimerAchat=supprimerAchat; window.viderPanierAchat=viderPanierAchat;
window.listenShop=listenShop; window.buildDataMap=buildDataMap;
