import { esc } from "../common/utils.js";
import { STATE } from "../core/state.js";

let DATA_MAP = {}; 

function buildDataMap(stock){ 
  DATA_MAP={}; 
  stock.forEach(p=>{
    let key = p._id || p.CODE; // utilise _id unique, pas CODE dupliqué
    if(key) DATA_MAP[key]=p;
    // garde aussi par CODE pour compatibilité mais seulement si unique
    if(p.CODE && !DATA_MAP[p.CODE]) DATA_MAP[p.CODE]=p;
  }); 
  window.DATA_MAP=DATA_MAP; 
}

function renderStock(){
 let data=getFiltered();
 let q=(document.getElementById('searchS').value||'').toLowerCase();
 let f=data.stock.filter(p=>(p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q)).sort((a,b)=>(a.CODE||'').localeCompare(b.CODE||''));
 let totalFC=0,totalPA=0,totalQte=0,totalRef=0;
 data.stock.filter(p=>p.actif!==false).forEach(p=>{totalFC+=(p.Quantite||0)*(p['Prix Unit']||p.Prix||0);totalPA+=(p.Quantite||0)*(p['Prix Achat']||0);totalQte+=(p.Quantite||0);totalRef++;});
 let tauxUSD=(CURRENT_CONFIG.taux&&typeof CURRENT_CONFIG.taux==='object'?CURRENT_CONFIG.taux.USD:CURRENT_CONFIG.tauxUSD)||2850;
 let benefLatent=totalFC-totalPA;
 if(document.getElementById('valStockFC')) document.getElementById('valStockFC').innerText=totalFC.toLocaleString()+' FC';
 if(document.getElementById('valStockFCDetail')) document.getElementById('valStockFCDetail').innerText=totalQte.toLocaleString()+' pcs - '+totalRef+' réf - PV x Qté';
 if(document.getElementById('valStockUSD')) document.getElementById('valStockUSD').innerText=(tauxUSD?totalFC/tauxUSD:0).toLocaleString(undefined,{maximumFractionDigits:2})+' $';
 if(document.getElementById('valStockUSDDetail')) document.getElementById('valStockUSDDetail').innerText='Taux 1$='+tauxUSD.toLocaleString()+' FC';
 if(document.getElementById('valStockPA')) document.getElementById('valStockPA').innerText=totalPA.toLocaleString()+' FC';
 if(document.getElementById('valStockBenef')) document.getElementById('valStockBenef').innerText=benefLatent.toLocaleString()+' FC';

 buildDataMap(f);
 
 document.getElementById('stockT').innerHTML=f.map(p=>{
   let uid = p._id || p.CODE; // ID unique Firebase
   let codeAff = esc(p.CODE || uid.slice(0,8));
   return `<tr style="${p.actif===false?'opacity:.5;background:#fee':''}">
   <td><b>${codeAff}</b></td>
   <td class="editable" data-id="${esc(uid)}" data-field="Designation" onclick="editField(this.dataset.id,this.dataset.field,DATA_MAP[this.dataset.id]?.Designation||'')">${esc(p.Designation)} ✏</td>
   <td class="editable" data-id="${esc(uid)}" data-field="Quantite" onclick="editField(this.dataset.id,this.dataset.field,DATA_MAP[this.dataset.id]?.Quantite||0)">${p.Quantite??0} ✏</td>
   <td class="editable" data-id="${esc(uid)}" data-field="seuil" onclick="editField(this.dataset.id,this.dataset.field,DATA_MAP[this.dataset.id]?.seuil||3)">${p.seuil||3} ✏</td>
   <td class="editable" data-id="${esc(uid)}" data-field="Prix Unit" onclick="editField(this.dataset.id,this.dataset.field,DATA_MAP[this.dataset.id]?.['Prix Unit']||DATA_MAP[this.dataset.id]?.Prix||0)">${(p['Prix Unit']||p.Prix||0).toLocaleString()} ✏</td>
   <td class="editable" data-id="${esc(uid)}" data-field="Prix Achat" onclick="editField(this.dataset.id,this.dataset.field,DATA_MAP[this.dataset.id]?.['Prix Achat']||0)">${(p['Prix Achat']||0).toLocaleString()} ✏</td>
   <td>${((p['Prix Unit']||p.Prix||0)-(p['Prix Achat']||0)).toLocaleString()}</td>
   <td>${p.actif!==false?'✅ Actif':'🚫'}</td>
   <td>
     <button class="btn ${p.actif!==false?'btn-r':'btn-g'}" style="width:auto" onclick="toggleActif('${esc(uid)}')">${p.actif!==false?'Désactiver':'Activer'}</button> 
     <button class="btn btn-g" style="width:auto" onclick="entree('${esc(uid)}')">+Entrée</button> 
     <button class="btn btn-r" style="width:auto" onclick="supp('${esc(uid)}')">X</button>
   </td></tr>`;
 }).join('');
}

function toggleActif(uid){
  let t=STATE.SHOP || window.SHOP || SHOP;
  let p=DATA_MAP[uid];
  let cur=p?.actif!==false;
  if(confirm(cur?'Désactiver '+(p.CODE||uid)+'?':'Activer '+(p.CODE||uid)+'?')){
    // FIX: utilise _id, pas CODE
    db.ref('shops/'+t+'/stock/'+uid).update({actif:!cur});
  }
}

async function editField(uid,field,oldVal){
  let safeOld = esc(oldVal);
  let p = DATA_MAP[uid];
  let safeCode = esc(p?.CODE || uid);
  let nv=prompt(`Modifier ${field} pour ${safeCode}\nAncien: ${safeOld}\nNouveau:`, oldVal);
  if(nv===null||nv==='') return;
  let val;
  if(field==='Designation'){
    if(/[<>]/.test(nv)){ alert('⛔ Caractères < > interdits'); return; }
    val = nv.trim();
  } else {
    val = Number(nv);
  }
  let t=STATE.SHOP || window.SHOP || SHOP;
  if(!t) return;
  
  // FIX CRITIQUE: update avec _id, pas CODE, et update pas set
  if(field==='Quantite'){
    let ref=db.ref('shops/'+t+'/stock/'+uid+'/Quantite');
    let res=await ref.transaction(current=>{ return val; });
    if(res.committed) { 
      if(p) p.Quantite = val;
      renderStock(); 
    }
  }else{
    // Pour Designation, seuil, Prix -> update seulement ce champ
    await db.ref('shops/'+t+'/stock/'+uid).update({[field]:val});
    if(p) p[field]=val;
    renderStock();
  }
}

async function entree(uid){
  let qty=parseInt(prompt('Qté entrée ?'));
  if(!qty) return;
  let s=STATE.SHOP || window.SHOP || SHOP;
  if(!s) return;
  let qui=prompt('Qui?','PATRON');
  try{
    let ref=db.ref('shops/'+s+'/stock/'+uid+'/Quantite');
    let result=await ref.transaction(currentQte=>{
      if(currentQte===null) return qty;
      return currentQte + qty;
    });
    if(result.committed){
      db.ref('shops/'+s+'/stock/'+uid).once('value').then(snap=>{
        let p=snap.val();
        db.ref('shops/'+s+'/entrees/'+Date.now()).set({date:new Date().toISOString(),CODE:p?.CODE||uid,Designation:p?.Designation||uid,boutique:s,qty:qty,vendeur:qui});
      });
      alert(`✅ Entrée OK: +${qty}. Nouveau stock: ${result.snapshot.val()}`);
      renderStock();
    }
  }catch(e){ alert('Erreur: '+e.message); }
}

function supp(uid){
  let p = DATA_MAP[uid];
  if(!confirm('Supprimer '+(p?.CODE||uid)+' - '+(p?.Designation||'')+' ?')) return;
  let s=STATE.SHOP || window.SHOP || SHOP;
  db.ref('shops/'+s+'/stock/'+uid).remove();
}

function saveNewArt(){
  let code=document.getElementById('newCode').value.trim();
  if(!code){ alert('CODE vide'); return; }
  let data={CODE:code,Designation:document.getElementById('newDes').value,'Prix Unit':Number(document.getElementById('newPV').value)||0,'Prix Achat':Number(document.getElementById('newPA').value)||0,Quantite:Number(document.getElementById('newQte').value)||0,seuil:Number(document.getElementById('newSeuil').value)||3,actif:document.getElementById('newActif').checked};
  let s=STATE.SHOP || window.SHOP || SHOP;
  // FIX: push() avec ID auto, pas set avec CODE (évite écraser si CODE -- existe)
  db.ref('shops/'+s+'/stock').push(data).then(()=>{ closeModal('modalArt'); renderStock(); });
}

// ACHAT - ton code d'origine inchangé mais utilise CODE pour panier (ok)
function savePanierAchat(){localStorage.setItem('panier_achat_'+(STATE.SHOP||SHOP), JSON.stringify(PANIER_ACHAT));}
function updateQteAchat(code,qte){ let p=PANIER_ACHAT.find(x=>x.CODE===code); if(p){p.qteAchat=parseInt(qte)||1;savePanierAchat();renderPanierAchat();} }
function ajouterAchat(code){
  let data=getFiltered(); let p=data.stock.find(x=>x.CODE===code || x._id===code); if(!p) return;
  let qte=parseInt(document.getElementById('qa_'+code)?.value)||1;
  let exist=PANIER_ACHAT.find(x=>x.CODE===code);
  if(exist){exist.qteAchat+=qte;}else{PANIER_ACHAT.push({CODE:p.CODE,Designation:p.Designation,Quantite:p.Quantite,seuil:p.seuil,PA:p['Prix Achat']||0,qteAchat:qte});}
  savePanierAchat();renderPanierAchat();
}
function renderAchatStock(){
  let data=getFiltered(); let q=(document.getElementById('searchAchat')?.value||'').toLowerCase();
  let filtre=document.getElementById('filtreAchat')?.value||'tous';
  let f=data.stock.filter(p=>{
    if(p.actif===false) return false;
    if(q&&!((p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q))) return false;
    if(filtre==='manque'&&(p.Quantite||0)>(p.seuil||3)) return false;
    if(filtre==='rupture'&&(p.Quantite||0)>0) return false;
    return true;
  }).slice(0,400);
  document.getElementById('achatStockT').innerHTML=f.map(p=>{
    let uid = p._id || p.CODE;
    let manque=Math.max(0,(p.seuil||3)-(p.Quantite||0));
    let deja=PANIER_ACHAT.find(x=>x.CODE===p.CODE);
    let qteAchat=deja?deja.qteAchat:manque||1;
    return `<tr><td><b>${esc(p.CODE)}</b></td><td>${esc(p.Designation)}</td><td style="text-align:center;color:${(p.Quantite||0)<= (p.seuil||3)?'red':''};font-weight:bold">${p.Quantite||0}</td><td>${p.seuil||3}</td><td style="color:#ef4444;font-weight:bold">${manque}</td><td style="background:#fffde7;font-weight:bold">${(p['Prix Achat']||0).toLocaleString()}</td><td><input type="number" id="qa_${uid}" value="${qteAchat}" min="1" style="width:70px" onchange="updateQteAchat('${p.CODE}',this.value)"></td><td>${((p['Prix Achat']||0)*qteAchat).toLocaleString()}</td><td><button class="btn btn-g" style="width:auto" onclick="ajouterAchat('${p.CODE}')">➕</button></td></tr>`;
  }).join('')||'<tr><td colspan=9>Aucun</td></tr>';
}
function renderPanierAchat(){
  let total=0; let taux=(CURRENT_CONFIG.taux&&typeof CURRENT_CONFIG.taux==='object'?CURRENT_CONFIG.taux.USD:CURRENT_CONFIG.tauxUSD)||2850;
  document.getElementById('panierAchatT').innerHTML=PANIER_ACHAT.map((p,i)=>{
    let lineTotal=(p.PA||0)*p.qteAchat;total+=lineTotal;
    return `<tr><td>${esc(p.CODE)}</td><td>${esc(p.Designation)}</td><td>${p.Quantite}</td><td><input type="number" value="${p.qteAchat}" min="1" style="width:60px" onchange="PANIER_ACHAT[${i}].qteAchat=parseInt(this.value)||1;savePanierAchat();renderPanierAchat()"></td><td>${(p.PA||0).toLocaleString()}</td><td><b>${lineTotal.toLocaleString()}</b></td><td><button class="btn btn-r" style="width:auto" onclick="supprimerAchat(${i})">X</button></td></tr>`;
  }).join('')||'<tr><td colspan=7>Aucun</td></tr>';
  if(document.getElementById('totalAchat')) document.getElementById('totalAchat').innerText=total.toLocaleString()+' FC';
  if(document.getElementById('totalAchat2')) document.getElementById('totalAchat2').innerText=total.toLocaleString()+' FC';
  if(document.getElementById('nbAchat')) document.getElementById('nbAchat').innerText=PANIER_ACHAT.length;
  if(document.getElementById('totalAchatUSD')) document.getElementById('totalAchatUSD').innerText=(taux?total/taux:0).toLocaleString()+' $';
}
function supprimerAchat(idx){PANIER_ACHAT.splice(idx,1);savePanierAchat();renderPanierAchat();}
function viderPanierAchat(){if(!confirm('Vider?'))return;PANIER_ACHAT=[];savePanierAchat();renderPanierAchat();}

window.renderStock=renderStock; window.toggleActif=toggleActif; window.editField=editField;
window.entree=entree; window.supp=supp; window.saveNewArt=saveNewArt;
window.savePanierAchat=savePanierAchat; window.renderAchatStock=renderAchatStock;
window.updateQteAchat=updateQteAchat; window.ajouterAchat=ajouterAchat;
window.renderPanierAchat=renderPanierAchat; window.supprimerAchat=supprimerAchat;
window.viderPanierAchat=viderPanierAchat; window.buildDataMap=buildDataMap;

console.log('✅ STOCK.JS V8.25 FIX - utilise _id plus CODE --');
