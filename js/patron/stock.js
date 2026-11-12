// stock.js V8.26 STABLE - SANS CATEGORIE - BOUTON QUI MARCHAIT
import { esc } from "../common/utils.js";
let DATA_MAP = {};
function getShop(){ try{ if(window.STATE && window.STATE.SHOP) return window.STATE.SHOP; }catch(e){} try{ if(window.SHOP) return window.SHOP; }catch(e){} try{ if(typeof SHOP!=='undefined' && SHOP) return SHOP; }catch(e){} return localStorage.getItem('patron_shop')||'Menkao1'; }
function getFilteredSafe(){ try{ if(typeof getFiltered==='function') return getFiltered(); }catch(e){} try{ if(window.getFiltered) return window.getFiltered(); }catch(e){} let shop = getShop(); let all = (window.ALL_DATA||{})[shop]||{stock:[]}; return {stock: all.stock||[], shop}; }
function buildDataMap(stock){ DATA_MAP={}; stock.forEach(p=>{ let uid = p._id || p.CODE; if(uid) DATA_MAP[uid]=p; }); window.DATA_MAP=DATA_MAP; }
export function renderStock(){
  let data = getFilteredSafe(); let q=(document.getElementById('searchS')?.value||'').toLowerCase();
  let list = (data.stock||[]).filter(p=>(p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q)).sort((a,b)=>(a.CODE||'').localeCompare(b.CODE||''));
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
    let uid = (p._id || p.CODE || '').toString().replace(/'/g,"\\'");
    let codeTxt = esc(p.CODE||''); let desTxt = esc(p.Designation||'');
    let qte = p.Quantite ?? 0; let seuil = p.seuil ?? 3; let pv = p['Prix Unit']||p.Prix||0; let pa = p['Prix Achat']||0;
    return `<tr><td><b>${codeTxt}</b></td><td class="editable" onclick="window.editField('${uid}','Designation')">${desTxt} ✏️</td><td class="editable" onclick="window.editField('${uid}','Quantite')">${qte} ✏️</td><td class="editable" onclick="window.editField('${uid}','seuil')">${seuil} ✏️</td><td class="editable" onclick="window.editField('${uid}','Prix Unit')">${Number(pv).toLocaleString()} ✏️</td><td class="editable" onclick="window.editField('${uid}','Prix Achat')">${Number(pa).toLocaleString()} ✏️</td><td>${(Number(pv)-Number(pa)).toLocaleString()}</td><td>${p.actif!==false?'✅':'🚫'}</td><td><button class="btn" onclick="window.toggleActif('${uid}')">Toggle</button> <button class="btn btn-g" onclick="window.entree('${uid}')">+Entrée</button> <button class="btn btn-r" onclick="window.supp('${uid}')">X</button></td></tr>`;
  }).join('');
}
export function toggleActif(uid){ let s=getShop(); let p=DATA_MAP[uid]; let cur=p?.actif!==false; if(confirm(cur?'Désactiver '+uid+'?':'Activer '+uid+'?')){ let dbRef = window.db || firebase.database(); dbRef.ref('shops/'+s+'/stock/'+uid).update({actif:!cur}); } }
export function editField(uid, field){ let p = DATA_MAP[uid]; if(!p) return; let oldVal = p[field] ?? ''; if(field==='Designation') oldVal = p.Designation||''; if(field==='Quantite') oldVal = p.Quantite??0; if(field==='seuil') oldVal = p.seuil??3; if(field==='Prix Unit') oldVal = p['Prix Unit']||0; if(field==='Prix Achat') oldVal = p['Prix Achat']||0; let nv=prompt(`Modifier ${field} ${oldVal}`, oldVal); if(nv===null) return; let val = field==='Designation'? nv.trim() : Number(nv)||0; let s=getShop(); let dbRef = window.db || firebase.database(); if(field==='Quantite'){ dbRef.ref('shops/'+s+'/stock/'+uid+'/Quantite').transaction(()=>val); }else{ dbRef.ref('shops/'+s+'/stock/'+uid).update({[field]:val}); } }
export function entree(uid){ let qty=parseInt(prompt('Qté entrée ?')); if(!qty) return; let s=getShop(); let qui=prompt('Qui?','PATRON'); let dbRef = window.db || firebase.database(); dbRef.ref('shops/'+s+'/stock/'+uid+'/Quantite').transaction(cur=> (cur||0)+qty); }
export function supp(uid){ if(!confirm('Supprimer '+uid+' ?')) return; let s=getShop(); let dbRef = window.db || firebase.database(); dbRef.ref('shops/'+s+'/stock/'+uid).remove(); }
export function saveNewArt(){ let code=document.getElementById('newCode')?.value.trim().toUpperCase(); if(!code) return; let des=document.getElementById('newDes')?.value.trim()||''; let data={ CODE:code, Designation:des, 'Prix Unit':Number(document.getElementById('newPV')?.value)||0, 'Prix Achat':Number(document.getElementById('newPA')?.value)||0, Quantite:Number(document.getElementById('newQte')?.value)||0, seuil:Number(document.getElementById('newSeuil')?.value)||3, actif:true }; let s=getShop(); let dbRef = window.db || firebase.database(); dbRef.ref('shops/'+s+'/stock/'+code).set(data).then(()=>{ window.closeModal('modalArt'); renderStock(); }); }
window.renderStock=renderStock; window.toggleActif=toggleActif; window.editField=editField; window.entree=entree; window.supp=supp; window.saveNewArt=saveNewArt; window.buildDataMap=buildDataMap;
window.openNewArt=function(){ let m=document.getElementById('modalArt'); if(m){ m.classList.add('active'); m.style.display='flex'; } };
window.closeModal=function(id){ let m=document.getElementById(id||'modalArt'); if(m){ m.classList.remove('active'); m.style.display='none'; } };
console.log('✅ STOCK V8.26 STABLE SANS CATEGORIE - BOUTON DOIT MARCHER');
