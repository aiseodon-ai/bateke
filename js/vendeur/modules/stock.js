// js/vendeur/modules/stock.js - FIX V5.6.4 APP CHECK + ASCII
import { STATE } from '../core/state.js';
import { saveStockCache, saveQueue, updateOfflineUI } from '../core/offline.js';

const CACHE_VERSION = 'v5.6.4-appcheck-20261020'; // 👈 FORCER MAJ PWA

function esc(t){ return window.esc?window.esc(t):String(t||''); }

// ✅ FIX PRIX ASCII PUR
function formatPrix(n){
  return String(Math.round(parseFloat(n)||0));
}

export function renderStock(){
  let q=(document.getElementById('searchS')?.value||'').toLowerCase().trim();
  let f=STATE.STOCK.filter(p=>p.actif!==false).filter(p=>(p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q)).sort((a,b)=>(a.CODE||'').localeCompare(b.CODE||''));
  let el=document.getElementById('stockT'); if(!el) return;
  if(!f.length){ el.innerHTML='<tr><td colspan=6>Aucun article</td></tr>'; return; }
  el.innerHTML=f.map(p=>{
    let actif=p.actif!==false;
    let seuil=p.seuil||3;
    let statut=p.Quantite<=seuil?`<span style="color:red;font-weight:bold">⚠️ Faible (${p.Quantite})</span>`:`<span style="color:green">OK</span>`;
    let prix=p['Prix Unit']||p.Prix||p.PV||0;
    return `<tr style="${!actif?'background:#fee;opacity:0.6':''}"><td><b>${esc(p.CODE)}</b></td><td>${esc(p.Designation)}</td><td>${p.Quantite}</td><td>${formatPrix(prix)} FC</td><td>${statut}</td><td>${actif?'✅ Actif':'🚫 Désactivé'}</td></tr>`;
  }).join('');
  if(window.updateOfflineUI) window.updateOfflineUI();
}

export function searchArticle(){
  let q=document.getElementById('searchArt')?.value?.toLowerCase().trim()||''; 
  let sug=document.getElementById('suggest'); if(!sug) return;
  if(!q){ sug.style.display='none'; return; }
  let f=STATE.STOCK.filter(p=>p.actif!==false).filter(p=>(p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q)).slice(0,10);
  if(!f.length){ sug.style.display='none'; return; }
  sug.innerHTML=f.map(p=>`<div onclick="selectArt('${esc(p.CODE)}')"><b>${esc(p.CODE)}</b> - ${esc(p.Designation)} - ${formatPrix(p['Prix Unit']||0)} FC - Stock:${p.Quantite}</div>`).join('');
  sug.style.display='block';
}
export function selectArt(code){
  let p=STATE.STOCK.find(x=>x.CODE===code); if(!p) return;
  document.getElementById('codeArt').value=p.CODE;
  document.getElementById('pvArt').value=p['Prix Unit']||0;
  document.getElementById('searchArt').value=p.CODE+' '+p.Designation;
  document.getElementById('suggest').style.display='none';
  document.getElementById('qteArt')?.focus();
}
export function selectArticle(code){ return selectArt(code); }

export function openEntree(){
  let code=prompt('CODE article entrée?'); if(!code) return;
  code=code.toUpperCase().trim();
  let st=STATE.STOCK.find(s=>s.CODE===code); if(!st) return alert('CODE introuvable: '+code);
  let qty=parseInt(prompt(`Qté entrée pour ${st.Designation} (stock actuel ${st.Quantite})?`));
  if(!qty||qty<=0) return;
  let qui=STATE.CURRENT_VENDEUR?STATE.CURRENT_VENDEUR.nom:(localStorage.getItem('vendeur_nom')||'');
  let pin=STATE.CURRENT_VENDEUR?STATE.CURRENT_VENDEUR.pin:(localStorage.getItem('vendeur_pin')||'');
  let now=new Date(); let id=Date.now();
  let newQte=st.Quantite+qty; st.Quantite=newQte;
  saveStockCache(); renderStock();
  let ent={
    date: now.toISOString(),
    jour: now.toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}),
    heure: now.toLocaleTimeString('fr-FR'),
    CODE: code,
    Designation: st.Designation,
    boutique: STATE.SHOP,
    qty: qty,
    vendeur: qui,
    faitPar: qui,
    pin: pin,
    vendeurPin: pin
  };
  if(STATE.FIREBASE_CONNECTED){
    window.db.ref('shops/'+STATE.SHOP+'/stock/'+code).update({Quantite:newQte});
    window.db.ref('shops/'+STATE.SHOP+'/entrees/'+id).set(ent);
  }else{
    STATE.OFFLINE_QUEUE.push({type:'entree',shop:STATE.SHOP,id:id,CODE:code,newQte:newQte,data:ent});
    saveQueue(); updateOfflineUI();
  }
  alert('✅ Entrée +'+qty+' '+code+' -> Stock: '+newQte);
}

window.renderStock=renderStock;
window.searchArticle=searchArticle;
window.selectArt=selectArt;
window.selectArticle=selectArt;
window.openEntree=openEntree;
console.log("stock.js V5.6.4 APP CHECK + ASCII OK -", STATE.STOCK.length, "articles - CACHE:", CACHE_VERSION);
