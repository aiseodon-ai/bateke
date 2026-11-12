// STOCK V8.29 FINALE - V8.26 COMPLETE + CATEGORIE + BOUTON FORCE
import { esc } from "../common/utils.js";
let DATA_MAP = {};
function getShop(){ try{ if(window.STATE && window.STATE.SHOP) return window.STATE.SHOP; }catch(e){} try{ if(window.SHOP) return window.SHOP; }catch(e){} try{ if(typeof SHOP!=='undefined' && SHOP) return SHOP; }catch(e){} return localStorage.getItem('patron_shop')||'Menkao1'; }
function getFilteredSafe(){ try{ if(typeof getFiltered==='function') return getFiltered(); }catch(e){} try{ if(window.getFiltered) return window.getFiltered(); }catch(e){} let shop = getShop(); let all = (window.ALL_DATA||{})[shop]||{stock:[]}; return {stock: all.stock||[], shop}; }
function buildDataMap(stock){ DATA_MAP={}; stock.forEach(p=>{ let uid = p._id || p.CODE; if(uid) DATA_MAP[uid]=p; }); window.DATA_MAP=DATA_MAP; }

export function renderStock(){
  let data = getFilteredSafe(); let q=(document.getElementById('searchS')?.value||'').toLowerCase();
  let list = (data.stock||[]).filter(p=>{ let txt=((p.CODE||'')+' '+(p.Designation||'')+' '+(p.Categorie||'')).toLowerCase(); return txt.includes(q); }).sort((a,b)=>(a.CODE||'').localeCompare(b.CODE||''));
  let totalFC=0,totalPA=0,totalQte=0,totalRef=0; (data.stock||[]).filter(p=>p.actif!==false).forEach(p=>{ let pv = p['Prix Unit']||p.Prix||p.PV||0; let pa = p['Prix Achat']||p.PA||0; totalFC+=(p.Quantite||0)*pv; totalPA+=(p.Quantite||0)*pa; totalQte+=(p.Quantite||0); totalRef++; });
  let tauxUSD=(window.CURRENT_CONFIG?.taux&&typeof window.CURRENT_CONFIG.taux==='object'?window.CURRENT_CONFIG.taux.USD:window.CURRENT_CONFIG?.tauxUSD)||2850;
  if(document.getElementById('valStockFC')) document.getElementById('valStockFC').innerText=totalFC.toLocaleString()+' FC';
  if(document.getElementById('valStockFCDetail')) document.getElementById('valStockFCDetail').innerText=totalQte.toLocaleString()+' pcs - '+totalRef+' réf';
  if(document.getElementById('valStockUSD')) document.getElementById('valStockUSD').innerText=(tauxUSD?totalFC/tauxUSD:0).toLocaleString(undefined,{maximumFractionDigits:2})+' $';
  if(document.getElementById('valStockPA')) document.getElementById('valStockPA').innerText=totalPA.toLocaleString()+' FC';
  if(document.getElementById('valStockBenef')) document.getElementById('valStockBenef').innerText=(totalFC-totalPA).toLocaleString()+' FC';
  buildDataMap(list);
  let tbody = document.getElementById('stockT'); if(!tbody) return;
  tbody.innerHTML = list.map(p=>{
    let uid = p._id || p.CODE; let uidSafe = (uid+'').replace(/'/g,"\\'");
    return `<tr style="${p.actif===false?'opacity:.5;background:#fee':''}">
      <td><b>${esc(p.CODE||'')}</b></td>
      <td class="editable" style="background:#e8f5e9;cursor:pointer" onclick="window.editField('${uidSafe}','Categorie')">${esc(p.Categorie||'AUTRE')} ✏️</td>
      <td class="editable" style="background:#fffde7;cursor:pointer" onclick="window.editField('${uidSafe}','Designation')">${esc(p.Designation||'')} ✏️</td>
      <td class="editable" style="background:#fffde7;cursor:pointer" onclick="window.editField('${uidSafe}','Quantite')">${p.Quantite ?? 0} ✏️</td>
      <td class="editable" style="cursor:pointer" onclick="window.editField('${uidSafe}','seuil')">${p.seuil ?? 3} ✏️</td>
      <td class="editable" style="cursor:pointer" onclick="window.editField('${uidSafe}','Prix Unit')">${Number(p['Prix Unit']||p.Prix||0).toLocaleString()} ✏️</td>
      <td class="editable" style="cursor:pointer" onclick="window.editField('${uidSafe}','Prix Achat')">${Number(p['Prix Achat']||0).toLocaleString()} ✏️</td>
      <td>${(Number(p['Prix Unit']||0)-Number(p['Prix Achat']||0)).toLocaleString()}</td>
      <td>${p.actif!==false?'✅ Actif':'🚫'}</td>
      <td><button class="btn ${p.actif!==false?'btn-r':'btn-g'}" style="width:auto;padding:4px 8px;font-size:11px" onclick="window.toggleActif('${uidSafe}')">${p.actif!==false?'Désactiver':'Activer'}</button> <button class="btn btn-g" style="width:auto;padding:4px 8px;font-size:11px" onclick="window.entree('${uidSafe}')">+Entrée</button> <button class="btn btn-r" style="width:auto;padding:4px 6px;font-size:11px" onclick="window.supp('${uidSafe}')">X</button></td></tr>`;
  }).join('');
}

export function toggleActif(uid){
  let s=getShop(); let p=DATA_MAP[uid]; let cur=p?.actif!==false;
  if(confirm(cur?'Désactiver '+(p?.CODE||uid)+'?':'Activer '+(p?.CODE||uid)+'?')){ let dbRef = window.db || firebase.database(); dbRef.ref('shops/'+s+'/stock/'+uid).update({actif:!cur}); }
}

export function editField(uid, field){
  let p = DATA_MAP[uid]; if(!p){ alert('Article non trouvé: '+uid); return; }
  let oldVal = p[field] ?? ''; 
  if(field==='Designation') oldVal = p.Designation||'';
  if(field==='Categorie') oldVal = p.Categorie||'AUTRE';
  if(field==='Quantite') oldVal = p.Quantite??0;
  if(field==='seuil') oldVal = p.seuil??3;
  if(field==='Prix Unit') oldVal = p['Prix Unit']||p.Prix||0;
  if(field==='Prix Achat') oldVal = p['Prix Achat']||0;
  let nv=prompt(`Modifier ${field} pour ${p.CODE||uid}\nAncien: ${oldVal}\nNouveau:`, oldVal);
  if(nv===null || nv==='') return;
  let val = nv;
  if(field!=='Designation' && field!=='Categorie'){ val = Number(nv.replace(',','.'))||0; }
  else { if(/[<>]/.test(nv)){ alert('⛔ < > interdits'); return; } val = nv.trim().toUpperCase(); if(field==='Designation') val = nv.trim(); }
  let s=getShop(); let dbRef = window.db || firebase.database();
  if(field==='Quantite'){
    dbRef.ref('shops/'+s+'/stock/'+uid+'/Quantite').transaction(()=>val).then(r=>{ if(r.committed){ p.Quantite=val; renderStock(); } });
  }else{
    dbRef.ref('shops/'+s+'/stock/'+uid).update({[field]:val}).then(()=>{ p[field]=val; if(field==='Designation') p.Designation=val; if(field==='Categorie') p.Categorie=val; renderStock(); });
  }
}

export function entree(uid){
  let qty=parseInt(prompt('Qté entrée ?')); if(!qty) return;
  let s=getShop(); let qui=prompt('Qui?','PATRON');
  let dbRef = window.db || firebase.database();
  dbRef.ref('shops/'+s+'/stock/'+uid+'/Quantite').transaction(cur=> (cur||0)+qty).then(r=>{
    if(r.committed){
      dbRef.ref('shops/'+s+'/stock/'+uid).once('value').then(snap=>{
        let p=snap.val();
        dbRef.ref('shops/'+s+'/entrees/'+Date.now()).set({date:new Date().toISOString(),CODE:p?.CODE||uid,Designation:p?.Designation||uid,boutique:s,qty:qty,vendeur:qui});
      });
      alert(`✅ +${qty} => ${r.snapshot.val()}`); renderStock();
    }
  });
}

export function supp(uid){
  let p=DATA_MAP[uid]; if(!confirm('Supprimer '+(p?.CODE||uid)+' - '+(p?.Designation||'')+' ?\nCette action est définitive.')) return;
  let s=getShop(); let dbRef = window.db || firebase.database();
  dbRef.ref('shops/'+s+'/stock/'+uid).remove().then(()=>{ renderStock(); });
}

export function saveNewArt(){
  let codeEl = document.getElementById('newCodeForce') || document.getElementById('newCode');
  let desEl = document.getElementById('newDesForce') || document.getElementById('newDes');
  let catEl = document.getElementById('newCatForce');
  let pvEl = document.getElementById('newPVForce') || document.getElementById('newPV');
  let paEl = document.getElementById('newPAForce') || document.getElementById('newPA');
  let qteEl = document.getElementById('newQteForce') || document.getElementById('newQte');
  let seuilEl = document.getElementById('newSeuilForce') || document.getElementById('newSeuil');
  let actifEl = document.getElementById('newActif');
  let code = codeEl?.value.trim().toUpperCase(); if(!code){ alert('CODE vide'); return; }
  let des = desEl?.value.trim(); if(!des){ alert('Désignation vide'); return; }
  let data={ CODE:code, Categorie: (catEl?.value.trim().toUpperCase()||'AUTRE'), Designation:des, 'Prix Unit':Number(pvEl?.value)||0, 'Prix Achat':Number(paEl?.value)||0, Quantite:Number(qteEl?.value)||0, seuil:Number(seuilEl?.value)||3, actif: actifEl?.checked!==false };
  let s=getShop(); let dbRef = window.db || firebase.database();
  dbRef.ref('shops/'+s+'/stock/'+code).set(data).then(()=>{
    if(codeEl) codeEl.value=''; if(desEl) desEl.value=''; if(catEl) catEl.value=''; if(pvEl) pvEl.value=''; if(paEl) paEl.value=''; if(qteEl) qteEl.value=''; if(seuilEl) seuilEl.value='3'; if(actifEl) actifEl.checked=true;
    try{ window.closeModal('modalForce'); window.closeModal('modalArt'); }catch(e){}
    renderStock(); console.log('✅ Article créé et champs vidés:', code);
  }).catch(e=> alert('Erreur: '+e.message));
}

window.renderStock=renderStock; window.toggleActif=toggleActif; window.editField=editField; window.entree=entree; window.supp=supp; window.saveNewArt=saveNewArt; window.buildDataMap=buildDataMap;

window.openNewArtForce=function(){
  let old=document.getElementById('modalForce'); if(old) old.remove();
  let m=document.createElement('div'); m.id='modalForce';
  m.innerHTML=`<div style="background:#fff;padding:16px;border-radius:12px;width:95%;max-width:440px"><h3>+ Nouvel Article</h3><input id="newCodeForce" placeholder="CODE" style="width:100%;padding:8px;margin:4px 0;border:1px solid #ccc;border-radius:8px"><input id="newCatForce" list="listCatsForce" placeholder="CATEGORIE" style="width:100%;padding:8px;margin:4px 0;border:1px solid #a5d6a7;background:#e8f5e9;border-radius:8px"><datalist id="listCatsForce"><option value="CABLE"><option value="CHARGEUR"><option value="FICHE"><option value="AMPOULE"><option value="SOCKET"><option value="AUTRE"></datalist><input id="newDesForce" placeholder="Désignation" style="width:100%;padding:8px;margin:4px 0;border:1px solid #ccc;border-radius:8px"><div style="display:flex;gap:6px"><input id="newPVForce" type="number" placeholder="PV" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"><input id="newPAForce" type="number" placeholder="PA" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"></div><div style="display:flex;gap:6px;margin-top:4px"><input id="newQteForce" type="number" placeholder="Qté" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"><input id="newSeuilForce" type="number" value="3" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"></div><div style="display:flex;gap:6px;justify-content:end;margin-top:10px"><button class="btn" onclick="window.closeModal('modalForce')" style="background:#ccc;padding:8px 12px;border-radius:8px">Annuler</button><button class="btn btn-g" onclick="window.saveNewArt()" style="background:#0b5e2f;color:#fff;padding:8px 12px;border-radius:8px">Créer</button></div></div>`;
  m.style.cssText='display:flex !important;position:fixed !important;inset:0 !important;background:rgba(0,0,0,.75) !important;z-index:99999999 !important;align-items:center !important;justify-content:center !important;';
  document.body.appendChild(m);
};
window.openNewArt=window.openNewArtForce;
window.closeModal=function(id){ let m=document.getElementById(id)||document.getElementById('modalForce')||document.getElementById('modalArt'); if(m) m.remove(); };
console.log('✅ STOCK V8.29 FINALE COMPLETE - V8.26 + CATEGORIE + FORCE');
