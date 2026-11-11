// stock.js V8.29 FINAL - STABLE V8.26 + CATEGORIE + AUTO-CREATE MODAL
import { esc } from "../common/utils.js";
let DATA_MAP = {};
function getShop(){ try{ if(window.STATE && window.STATE.SHOP) return window.STATE.SHOP; }catch(e){} try{ if(window.SHOP) return window.SHOP; }catch(e){} try{ if(typeof SHOP!=='undefined' && SHOP) return SHOP; }catch(e){} return localStorage.getItem('patron_shop')||'Menkao1'; }
function getFilteredSafe(){ try{ if(typeof getFiltered==='function') return getFiltered(); }catch(e){} try{ if(window.getFiltered) return window.getFiltered(); }catch(e){} let shop = getShop(); let all = (window.ALL_DATA||{})[shop]||{stock:[]}; return {stock: all.stock||[], shop}; }
function buildDataMap(stock){ DATA_MAP={}; stock.forEach(p=>{ let uid = p._id || p.CODE; if(uid) DATA_MAP[uid]=p; }); window.DATA_MAP=DATA_MAP; }

function ensureModal(){
  let m=document.getElementById('modalArt');
  if(m) return m;
  // CRÉE LE MODAL AUTOMATIQUEMENT A LA FIN DU BODY
  let div=document.createElement('div');
  div.id='modalArt';
  div.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;align-items:center;justify-content:center';
  div.innerHTML=`<div class="modalBox" style="background:#fff;padding:16px;border-radius:12px;width:95%;max-width:420px;max-height:90vh;overflow:auto">
<h3 style="margin:0 0 10px">+ Nouvel Article</h3>
<input id="newCode" placeholder="CODE" style="width:100%;padding:8px;margin:4px 0;border:1px solid #ccc;border-radius:8px">
<input id="newDes" placeholder="Désignation" style="width:100%;padding:8px;margin:4px 0;border:1px solid #ccc;border-radius:8px">
<input id="newCategorie" list="listCats" placeholder="CATEGORIE ex: CABLE" style="width:100%;padding:8px;margin:4px 0;border:2px solid #4caf50;border-radius:8px;background:#e8f5e9">
<datalist id="listCats"><option value="CABLE"><option value="CHARGEUR"><option value="FICHE"><option value="AMPOULE"><option value="SOCKET"><option value="INTERRUPTEUR"><option value="ACCESSOIRE"><option value="AUTRE"></datalist>
<div style="display:flex;gap:6px"><input id="newPV" type="number" placeholder="PV" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"><input id="newPA" type="number" placeholder="PA" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"></div>
<div style="display:flex;gap:6px;margin-top:4px"><input id="newQte" type="number" placeholder="Qté" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"><input id="newSeuil" type="number" value="3" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"></div>
<label style="display:flex;gap:6px;margin:8px 0"><input type="checkbox" id="newActif" checked> Actif</label>
<div style="display:flex;gap:6px;justify-content:end"><button class="btn" onclick="closeModal('modalArt')" style="background:#ccc;padding:8px 12px;border-radius:8px">Annuler</button><button class="btn btn-g" onclick="saveNewArt()" style="background:#4caf50;color:#fff;padding:8px 12px;border-radius:8px">Créer</button></div>
</div>`;
  document.body.appendChild(div);
  return div;
}

export function renderStock(){
  let data = getFilteredSafe();
  let shop = getShop();
  let q=(document.getElementById('searchS')?.value||'').toLowerCase();
  let list = (data.stock||[]).filter(p=>(p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q)||(p.Categorie||'').toLowerCase().includes(q)).sort((a,b)=>(a.CODE||'').localeCompare(b.CODE||''));
  let totalFC=0,totalPA=0,totalQte=0,totalRef=0;
  (data.stock||[]).filter(p=>p.actif!==false).forEach(p=>{ let pv = p['Prix Unit']||p.Prix||p.PV||0; let pa = p['Prix Achat']||p.PA||0; totalFC+=(p.Quantite||0)*pv; totalPA+=(p.Quantite||0)*pa; totalQte+=(p.Quantite||0); totalRef++; });
  let tauxUSD=(window.CURRENT_CONFIG?.taux&&typeof window.CURRENT_CONFIG.taux==='object'?window.CURRENT_CONFIG.taux.USD:window.CURRENT_CONFIG?.tauxUSD)||2850;
  if(document.getElementById('valStockFC')) document.getElementById('valStockFC').innerText=totalFC.toLocaleString()+' FC';
  if(document.getElementById('valStockFCDetail')) document.getElementById('valStockFCDetail').innerText=totalQte.toLocaleString()+' pcs - '+totalRef+' réf';
  if(document.getElementById('valStockUSD')) document.getElementById('valStockUSD').innerText=(tauxUSD?totalFC/tauxUSD:0).toLocaleString(undefined,{maximumFractionDigits:2})+' $';
  if(document.getElementById('valStockPA')) document.getElementById('valStockPA').innerText=totalPA.toLocaleString()+' FC';
  if(document.getElementById('valStockBenef')) document.getElementById('valStockBenef').innerText=(totalFC-totalPA).toLocaleString()+' FC';
  buildDataMap(list);
  let tbody = document.getElementById('stockT'); if(!tbody) return;
  tbody.innerHTML = list.map(p=>{
    let uid = p._id || p.CODE; let codeTxt = esc(p.CODE||''); let desTxt = esc(p.Designation||''); let catTxt = esc(p.Categorie||'AUTRE');
    let qte = p.Quantite ?? 0; let seuil = p.seuil ?? 3; let pv = p['Prix Unit']||p.Prix||0; let pa = p['Prix Achat']||0;
    return `<tr style="${p.actif===false?'opacity:.5;background:#fee':''}"><td><b>${codeTxt}</b></td><td class="editable" style="background:#fffde7;cursor:pointer" onclick="window.editField('${uid}','Designation')">${desTxt} ✏️</td><td class="editable" style="background:#e8f5e9;cursor:pointer" onclick="window.editField('${uid}','Categorie')">${catTxt} ✏️</td><td class="editable" style="background:#fffde7;cursor:pointer" onclick="window.editField('${uid}','Quantite')">${qte} ✏️</td><td class="editable" style="cursor:pointer" onclick="window.editField('${uid}','seuil')">${seuil} ✏️</td><td class="editable" style="cursor:pointer" onclick="window.editField('${uid}','Prix Unit')">${Number(pv).toLocaleString()} ✏️</td><td class="editable" style="cursor:pointer" onclick="window.editField('${uid}','Prix Achat')">${Number(pa).toLocaleString()} ✏️</td><td>${(Number(pv)-Number(pa)).toLocaleString()}</td><td>${p.actif!==false?'✅ Actif':'🚫'}</td><td><button class="btn ${p.actif!==false?'btn-r':'btn-g'}" style="width:auto;padding:4px 8px;font-size:11px" onclick="window.toggleActif('${uid}')">${p.actif!==false?'Désactiver':'Activer'}</button> <button class="btn btn-g" style="width:auto;padding:4px 8px;font-size:11px" onclick="window.entree('${uid}')">+Entrée</button> <button class="btn btn-r" style="width:auto;padding:4px 6px;font-size:11px" onclick="window.supp('${uid}')">X</button></td></tr>`;
  }).join('');
}
export function toggleActif(uid){ let s=getShop(); let p=DATA_MAP[uid]; let cur=p?.actif!==false; if(confirm(cur?'Désactiver '+(p?.CODE||uid)+'?':'Activer '+(p?.CODE||uid)+'?')){ let dbRef = window.db || firebase.database(); dbRef.ref('shops/'+s+'/stock/'+uid).update({actif:!cur}); } }
export function editField(uid, field){
  let p = DATA_MAP[uid]; if(!p){ alert('Article non trouvé: '+uid); return; }
  let oldVal = p[field] ?? ''; if(field==='Designation') oldVal = p.Designation||''; if(field==='Categorie') oldVal = p.Categorie||'AUTRE'; if(field==='Quantite') oldVal = p.Quantite??0; if(field==='seuil') oldVal = p.seuil??3; if(field==='Prix Unit') oldVal = p['Prix Unit']||p.Prix||0; if(field==='Prix Achat') oldVal = p['Prix Achat']||0;
  let nv=prompt(`Modifier ${field} pour ${p.CODE||uid}\nAncien: ${oldVal}\nNouveau:`, oldVal); if(nv===null || nv==='') return;
  let val = nv; if(field!=='Designation' && field!=='Categorie'){ val = Number(nv.replace(',','.'))||0; } else { if(/[<>]/.test(nv)){ alert('⛔ < > interdits'); return; } val = (field==='Categorie'? nv.trim().toUpperCase() : nv.trim()); }
  let s=getShop(); let dbRef = window.db || firebase.database();
  if(field==='Quantite'){ dbRef.ref('shops/'+s+'/stock/'+uid+'/Quantite').transaction(()=>val).then(r=>{ if(r.committed){ p.Quantite=val; renderStock(); } }); }
  else { let firebaseField = field; if(field==='Prix Unit') firebaseField='Prix Unit'; if(field==='Prix Achat') firebaseField='Prix Achat'; dbRef.ref('shops/'+s+'/stock/'+uid).update({[firebaseField]:val}).then(()=>{ p[firebaseField]=val; if(field==='Designation') p.Designation=val; if(field==='Categorie') p.Categorie=val; renderStock(); }); }
}
export function entree(uid){ let qty=parseInt(prompt('Qté entrée ?')); if(!qty) return; let s=getShop(); let qui=prompt('Qui?','PATRON'); let dbRef = window.db || firebase.database(); dbRef.ref('shops/'+s+'/stock/'+uid+'/Quantite').transaction(cur=> (cur||0)+qty).then(r=>{ if(r.committed){ dbRef.ref('shops/'+s+'/stock/'+uid).once('value').then(snap=>{ let p=snap.val(); dbRef.ref('shops/'+s+'/entrees/'+Date.now()).set({date:new Date().toISOString(),CODE:p?.CODE||uid,Designation:p?.Designation||uid,boutique:s,qty:qty,vendeur:qui,Categorie:p?.Categorie||'AUTRE'}); }); alert(`✅ +${qty} => ${r.snapshot.val()}`); renderStock(); } }); }
export function supp(uid){ let p=DATA_MAP[uid]; if(!confirm('Supprimer '+(p?.CODE||uid)+' - '+(p?.Designation||'')+' ?')) return; let s=getShop(); let dbRef = window.db || firebase.database(); dbRef.ref('shops/'+s+'/stock/'+uid).remove().then(()=>{ renderStock(); }); }
export function saveNewArt(){
  let codeEl=document.getElementById('newCode'); let desEl=document.getElementById('newDes'); let catEl=document.getElementById('newCategorie');
  let pvEl=document.getElementById('newPV'); let paEl=document.getElementById('newPA'); let qteEl=document.getElementById('newQte'); let seuilEl=document.getElementById('newSeuil'); let actifEl=document.getElementById('newActif');
  let code=codeEl?.value.trim().toUpperCase(); if(!code){ alert('CODE vide'); return; }
  let des=desEl?.value.trim(); if(!des){ alert('Désignation vide'); return; }
  let cat=(catEl?.value||'AUTRE').trim().toUpperCase(); if(!cat) cat='AUTRE';
  let data={ CODE:code, Designation:des, Categorie:cat, 'Prix Unit':Number(pvEl?.value)||0, 'Prix Achat':Number(paEl?.value)||0, Quantite:Number(qteEl?.value)||0, seuil:Number(seuilEl?.value)||3, actif: actifEl?.checked!==false };
  let s=getShop(); let dbRef = window.db || firebase.database();
  dbRef.ref('shops/'+s+'/stock/'+code).set(data).then(()=>{
    if(codeEl) codeEl.value=''; if(desEl) desEl.value=''; if(catEl) catEl.value=''; if(pvEl) pvEl.value=''; if(paEl) paEl.value=''; if(qteEl) qteEl.value=''; if(seuilEl) seuilEl.value='3'; if(actifEl) actifEl.checked=true;
    try{ closeModal('modalArt'); }catch(e){ let m=document.getElementById('modalArt'); if(m) m.style.display='none'; }
    renderStock();
  }).catch(e=> alert('Erreur: '+e.message));
}
window.renderStock=renderStock; window.toggleActif=toggleActif; window.editField=editField; window.entree=entree; window.supp=supp; window.saveNewArt=saveNewArt; window.buildDataMap=buildDataMap;
window.openNewArt=function(){ let m=ensureModal(); m.style.display='flex'; };
window.closeModal=function(id){ let m=document.getElementById(id||'modalArt'); if(m) m.style.display='none'; };
console.log('✅ STOCK V8.29 FINAL - CATEGORIE + AUTO MODAL');
