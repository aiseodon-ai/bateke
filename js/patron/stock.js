// stock.js V8.26 - FIX EDIT/SUPP - utilise _id unique - compatible V6.2
import { esc } from "../common/utils.js";

let DATA_MAP = {};

function getShop(){
  try{ if(window.STATE && window.STATE.SHOP) return window.STATE.SHOP; }catch(e){}
  try{ if(window.SHOP) return window.SHOP; }catch(e){}
  try{ if(typeof SHOP!=='undefined' && SHOP) return SHOP; }catch(e){}
  return localStorage.getItem('patron_shop')||'Menkao1';
}

function getFilteredSafe(){
  try{ if(typeof getFiltered==='function') return getFiltered(); }catch(e){}
  try{ if(window.getFiltered) return window.getFiltered(); }catch(e){}
  let shop = getShop();
  let all = (window.ALL_DATA||{})[shop]||{stock:[]};
  return {stock: all.stock||[], shop};
}

function buildDataMap(stock){
  DATA_MAP={};
  stock.forEach(p=>{
    let uid = p._id || p.CODE; // uid unique = clé Firebase
    if(uid) DATA_MAP[uid]=p;
  });
  window.DATA_MAP=DATA_MAP;
}

export function renderStock(){
  let data = getFilteredSafe();
  let shop = getShop();
  let q=(document.getElementById('searchS')?.value||'').toLowerCase();
  let list = (data.stock||[]).filter(p=>(p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q)).sort((a,b)=>(a.CODE||'').localeCompare(b.CODE||''));
  
  let totalFC=0,totalPA=0,totalQte=0,totalRef=0;
  (data.stock||[]).filter(p=>p.actif!==false).forEach(p=>{
    let pv = p['Prix Unit']||p.Prix||p.PV||0;
    let pa = p['Prix Achat']||p.PA||0;
    totalFC+=(p.Quantite||0)*pv; totalPA+=(p.Quantite||0)*pa; totalQte+=(p.Quantite||0); totalRef++;
  });
  let tauxUSD=(window.CURRENT_CONFIG?.taux&&typeof window.CURRENT_CONFIG.taux==='object'?window.CURRENT_CONFIG.taux.USD:window.CURRENT_CONFIG?.tauxUSD)||2850;
  if(document.getElementById('valStockFC')) document.getElementById('valStockFC').innerText=totalFC.toLocaleString()+' FC';
  if(document.getElementById('valStockFCDetail')) document.getElementById('valStockFCDetail').innerText=totalQte.toLocaleString()+' pcs - '+totalRef+' réf';
  if(document.getElementById('valStockUSD')) document.getElementById('valStockUSD').innerText=(tauxUSD?totalFC/tauxUSD:0).toLocaleString(undefined,{maximumFractionDigits:2})+' $';
  if(document.getElementById('valStockPA')) document.getElementById('valStockPA').innerText=totalPA.toLocaleString()+' FC';
  if(document.getElementById('valStockBenef')) document.getElementById('valStockBenef').innerText=(totalFC-totalPA).toLocaleString()+' FC';

  buildDataMap(list);

  let tbody = document.getElementById('stockT');
  if(!tbody) return;
  
  tbody.innerHTML = list.map(p=>{
    let uid = p._id || p.CODE;
    // PAS de esc() sur uid pour data-id, sinon -O... cassé
    let codeTxt = esc(p.CODE||'');
    let desTxt = esc(p.Designation||'');
    let qte = p.Quantite ?? 0;
    let seuil = p.seuil ?? 3;
    let pv = p['Prix Unit']||p.Prix||0;
    let pa = p['Prix Achat']||0;
    return `<tr style="${p.actif===false?'opacity:.5;background:#fee':''}">
      <td><b>${codeTxt}</b></td>
      <td class="editable" style="background:#fffde7;cursor:pointer" onclick="window.editField('${uid}','Designation')">${desTxt} ✏️</td>
      <td class="editable" style="background:#fffde7;cursor:pointer" onclick="window.editField('${uid}','Quantite')">${qte} ✏️</td>
      <td class="editable" style="cursor:pointer" onclick="window.editField('${uid}','seuil')">${seuil} ✏️</td>
      <td class="editable" style="cursor:pointer" onclick="window.editField('${uid}','Prix Unit')">${Number(pv).toLocaleString()} ✏️</td>
      <td class="editable" style="cursor:pointer" onclick="window.editField('${uid}','Prix Achat')">${Number(pa).toLocaleString()} ✏️</td>
      <td>${(Number(pv)-Number(pa)).toLocaleString()}</td>
      <td>${p.actif!==false?'✅ Actif':'🚫'}</td>
      <td>
        <button class="btn ${p.actif!==false?'btn-r':'btn-g'}" style="width:auto;padding:4px 8px;font-size:11px" onclick="window.toggleActif('${uid}')">${p.actif!==false?'Désactiver':'Activer'}</button> 
        <button class="btn btn-g" style="width:auto;padding:4px 8px;font-size:11px" onclick="window.entree('${uid}')">+Entrée</button> 
        <button class="btn btn-r" style="width:auto;padding:4px 6px;font-size:11px" onclick="window.supp('${uid}')">X</button>
      </td></tr>`;
  }).join('');
}

export function toggleActif(uid){
  let s=getShop();
  let p=DATA_MAP[uid];
  let cur=p?.actif!==false;
  if(confirm(cur?'Désactiver '+(p?.CODE||uid)+'?':'Activer '+(p?.CODE||uid)+'?')){
    let dbRef = window.db || firebase.database();
    dbRef.ref('shops/'+s+'/stock/'+uid).update({actif:!cur});
  }
}

export function editField(uid, field){
  let p = DATA_MAP[uid];
  if(!p){ alert('Article non trouvé: '+uid); return; }
  let oldVal = p[field] ?? p.Designation ?? p.Quantite ?? '';
  if(field==='Designation') oldVal = p.Designation||'';
  if(field==='Quantite') oldVal = p.Quantite??0;
  if(field==='seuil') oldVal = p.seuil??3;
  if(field==='Prix Unit') oldVal = p['Prix Unit']||p.Prix||0;
  if(field==='Prix Achat') oldVal = p['Prix Achat']||0;

  let nv=prompt(`Modifier ${field} pour ${p.CODE||uid}\nAncien: ${oldVal}\nNouveau:`, oldVal);
  if(nv===null || nv==='') return;
  
  let val = nv;
  if(field!=='Designation'){
    val = Number(nv.replace(',','.'))||0;
  } else {
    if(/[<>]/.test(nv)){ alert('⛔ < > interdits'); return; }
    val = nv.trim();
  }

  let s=getShop();
  let dbRef = window.db || firebase.database();
  
  // FIX: update avec uid unique, pas avec CODE --
  if(field==='Quantite'){
    dbRef.ref('shops/'+s+'/stock/'+uid+'/Quantite').transaction(()=>val).then(r=>{
      if(r.committed){ p.Quantite=val; renderStock(); }
    });
  }else{
    let firebaseField = field;
    if(field==='Prix Unit') firebaseField='Prix Unit';
    dbRef.ref('shops/'+s+'/stock/'+uid).update({[firebaseField]:val}).then(()=>{
      p[firebaseField]=val;
      if(field==='Designation') p.Designation=val;
      renderStock();
    });
  }
}

export function entree(uid){
  let qty=parseInt(prompt('Qté entrée ?'));
  if(!qty) return;
  let s=getShop();
  let qui=prompt('Qui?','PATRON');
  let dbRef = window.db || firebase.database();
  dbRef.ref('shops/'+s+'/stock/'+uid+'/Quantite').transaction(cur=> (cur||0)+qty).then(r=>{
    if(r.committed){
      dbRef.ref('shops/'+s+'/stock/'+uid).once('value').then(snap=>{
        let p=snap.val();
        dbRef.ref('shops/'+s+'/entrees/'+Date.now()).set({date:new Date().toISOString(),CODE:p?.CODE||uid,Designation:p?.Designation||uid,boutique:s,qty:qty,vendeur:qui});
      });
      alert(`✅ +${qty} => ${r.snapshot.val()}`);
      renderStock();
    }
  });
}

export function supp(uid){
  let p=DATA_MAP[uid];
  if(!confirm('Supprimer '+(p?.CODE||uid)+' - '+(p?.Designation||'')+' ?\nCette action est définitive.')) return;
  let s=getShop();
  let dbRef = window.db || firebase.database();
  dbRef.ref('shops/'+s+'/stock/'+uid).remove().then(()=>{ renderStock(); });
}

export function saveNewArt(){
  let codeEl = document.getElementById('newCode');
  let desEl = document.getElementById('newDes');
  let pvEl = document.getElementById('newPV');
  let paEl = document.getElementById('newPA');
  let qteEl = document.getElementById('newQte');
  let seuilEl = document.getElementById('newSeuil');
  let actifEl = document.getElementById('newActif');

  let code = codeEl?.value.trim().toUpperCase();
  if(!code){ alert('CODE vide'); return; }
  let des = desEl?.value.trim();
  if(!des){ alert('Désignation vide'); return; }

  let data={
    CODE:code,
    Designation:des,
    'Prix Unit':Number(pvEl?.value)||0,
    'Prix Achat':Number(paEl?.value)||0,
    Quantite:Number(qteEl?.value)||0,
    seuil:Number(seuilEl?.value)||3,
    actif: actifEl?.checked!==false
  };
  
  let s=getShop();
  let dbRef = window.db || firebase.database();
  
  dbRef.ref('shops/'+s+'/stock/'+code).set(data).then(()=>{
    // ✅ VIDAGE DES CHAMPS - c'est ce qui manquait
    if(codeEl) codeEl.value='';
    if(desEl) desEl.value='';
    if(pvEl) pvEl.value='';
    if(paEl) paEl.value='';
    if(qteEl) qteEl.value='';
    if(seuilEl) seuilEl.value='3';
    if(actifEl) actifEl.checked=true;
    
    try{ closeModal('modalArt'); }catch(e){}
    renderStock();
    console.log('✅ Article créé et champs vidés:', code);
  }).catch(e=> alert('Erreur: '+e.message));
}

// Expose global
window.renderStock=renderStock; window.toggleActif=toggleActif; window.editField=editField; window.entree=entree; window.supp=supp; window.saveNewArt=saveNewArt; window.buildDataMap=buildDataMap;

console.log('✅ STOCK V8.26 FIX EDIT/SUPP - _id unique');
