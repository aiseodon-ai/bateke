import { esc } from "../common/utils.js";

// PAS de let SHOP = () =>... -> on utilise directement window.SHOP comme ton original

let DATA_MAP = {}; 

function buildDataMap(stock){ DATA_MAP={}; stock.forEach(p=>{DATA_MAP[p.CODE]=p;}); window.DATA_MAP=DATA_MAP; }

// getFiltered et updateKPIs viennent de auth.js - on ne les redéfinit PAS ici pour ne pas casser le login

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
   // AUTO-RECOVERY si ALL_DATA vide mais Firebase a des données
  if(f.length===0 && data.stock.length===0 && window.db && window.SHOP){
    window.db.ref('shops/'+window.SHOP+'/stock').once('value').then(snap=>{
      let v = snap.val()||{};
      let arr = Array.isArray(v)? v : Object.values(v);
      if(arr.length>0){
        if(!window.ALL_DATA[window.SHOP]) window.ALL_DATA[window.SHOP]={ventes:[],dep:[],vers:[],stock:[],entrees:[]};
        window.ALL_DATA[window.SHOP].stock = arr;
        console.log("Recovery: "+arr.length+" articles chargés");
        renderStock();
      }
    });
    return;
  }
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
    if(/[<>]/.test(nv)){ alert('⛔ Caractères < > interdits'); return; }
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
    else alert('❌ Conflit');
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
    }
  }catch(e){ alert('Erreur: '+e.message); }
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

// ACHAT - ton code d'origine
function savePanierAchat(){localStorage.setItem('panier_achat_'+SHOP, JSON.stringify(PANIER_ACHAT));}
function updateQteAchat(code,qte){ let p=PANIER_ACHAT.find(x=>x.CODE===code); if(p){p.qteAchat=parseInt(qte)||1;savePanierAchat();renderPanierAchat();} }
function ajouterAchat(code){
  let data=getFiltered(); let p=data.stock.find(x=>x.CODE===code); if(!p) return;
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
    let manque=Math.max(0,(p.seuil||3)-(p.Quantite||0));
    let deja=PANIER_ACHAT.find(x=>x.CODE===p.CODE);
    let qteAchat=deja?deja.qteAchat:manque||1;
    return `<tr><td><b>${esc(p.CODE)}</b></td><td>${esc(p.Designation)}</td><td style="text-align:center;color:${(p.Quantite||0)<= (p.seuil||3)?'red':''};font-weight:bold">${p.Quantite||0}</td><td>${p.seuil||3}</td><td style="color:#ef4444;font-weight:bold">${manque}</td><td style="background:#fffde7;font-weight:bold">${(p['Prix Achat']||0).toLocaleString()}</td><td><input type="number" id="qa_${p.CODE}" value="${qteAchat}" min="1" style="width:70px" onchange="updateQteAchat('${p.CODE}',this.value)"></td><td>${((p['Prix Achat']||0)*qteAchat).toLocaleString()}</td><td><button class="btn btn-g" style="width:auto" onclick="ajouterAchat('${p.CODE}')">➕</button></td></tr>`;
  }).join('')||'<tr><td colspan=9>Aucun</td></tr>';
}
function renderPanierAchat(){
  let total=0; let taux=(CURRENT_CONFIG.taux&&typeof CURRENT_CONFIG.taux==='object'?CURRENT_CONFIG.taux.USD:CURRENT_CONFIG.tauxUSD)||2850;
  document.getElementById('panierAchatT').innerHTML=PANIER_ACHAT.map((p,i)=>{
    let lineTotal=(p.PA||0)*p.qteAchat;total+=lineTotal;
    return `<tr><td>${esc(p.CODE)}</td><td>${esc(p.Designation)}</td><td>${p.Quantite}</td><td><input type="number" value="${p.qteAchat}" min="1" style="width:60px" onchange="PANIER_ACHAT[${i}].qteAchat=parseInt(this.value)||1;savePanierAchat();renderPanierAchat()"></td><td>${(p.PA||0).toLocaleString()}</td><td><b>${lineTotal.toLocaleString()}</b></td><td><button class="btn btn-r" style="width:auto" onclick="supprimerAchat(${i})">X</button></td></tr>`;
  }).join('')||'<tr><td colspan=7>Aucun</td></tr>';
  document.getElementById('totalAchat').innerText=total.toLocaleString()+' FC';
  document.getElementById('totalAchat2').innerText=total.toLocaleString()+' FC';
  document.getElementById('nbAchat').innerText=PANIER_ACHAT.length;
  document.getElementById('totalAchatUSD').innerText=(taux?total/taux:0).toLocaleString()+' $';
}
function supprimerAchat(idx){PANIER_ACHAT.splice(idx,1);savePanierAchat();renderPanierAchat();}
function viderPanierAchat(){if(!confirm('Vider?'))return;PANIER_ACHAT=[];savePanierAchat();renderPanierAchat();}

// On expose en global comme ton original
window.renderStock=renderStock; window.toggleActif=toggleActif; window.editField=editField;
window.entree=entree; window.supp=supp; window.saveNewArt=saveNewArt;
window.savePanierAchat=savePanierAchat; window.renderAchatStock=renderAchatStock;
window.updateQteAchat=updateQteAchat; window.ajouterAchat=ajouterAchat;
window.renderPanierAchat=renderPanierAchat; window.supprimerAchat=supprimerAchat;
window.viderPanierAchat=viderPanierAchat; window.buildDataMap=buildDataMap;
