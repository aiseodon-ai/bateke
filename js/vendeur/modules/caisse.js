// js/vendeur/modules/caisse.js - V5.6.4 FIX DATE DYNAMIQUE + ASCII
import { STATE } from '../core/state.js';
import { saveQueue, updateOfflineUI } from '../core/offline.js';

const CACHE_VERSION = 'v5.6.4-appcheck-20261020';

function formatPrix(n){
  let v = Math.round(parseFloat(n)||0);
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
function fmtDate(d){
  let dt = new Date(d);
  let j = String(dt.getDate()).padStart(2,'0');
  let m = String(dt.getMonth()+1).padStart(2,'0');
  let a = dt.getFullYear();
  return `${j}/${m}/${a}`;
}
function fmtHeure(d){
  let dt = new Date(d);
  let h = String(dt.getHours()).padStart(2,'0');
  let mi = String(dt.getMinutes()).padStart(2,'0');
  return `${h}:${mi}`;
}

export function renderCaisse(){
  let today=new Date().toDateString();
  let vToday=(STATE.VENTES||[]).filter(v=>new Date(v.date).toDateString()===today);
  let vQueue=STATE.OFFLINE_QUEUE.filter(q=>q.type==='vente').map(q=>q.data).filter(v=>new Date(v.date).toDateString()===today);
  let allV=[...vToday,...vQueue];
  let ca=allV.reduce((s,v)=>s+(v.total||0),0);
  let depJ=(STATE.DEP||[]).filter(d=>new Date(d.date).toDateString()===today).reduce((s,d)=>s+(d.montant||0),0);
  let versJ=(STATE.VERS||[]).filter(v=>new Date(v.date).toDateString()===today).reduce((s,v)=>s+(v.montant||0),0);
  
  if(document.getElementById('caJour')) document.getElementById('caJour').innerText='CA Jour: '+formatPrix(ca);
  if(document.getElementById('caJour2')) document.getElementById('caJour2').innerText=formatPrix(ca)+' FC';
  if(document.getElementById('aVerser')) document.getElementById('aVerser').innerText=formatPrix(ca-depJ-versJ)+' FC';
  
  // ✅ LOGIQUE DEMANDÉE : date début = date du dernier versement
  let allVers = [...(STATE.VERS||[]), ...STATE.OFFLINE_QUEUE.filter(q=>q.type==='versement').map(q=>q.data)];
  allVers = allVers.filter(v=>v.date && !isNaN(new Date(v.date).getTime())).sort((a,b)=> new Date(b.date) - new Date(a.date));
  
  let lastVersement = allVers.length ? allVers[0] : null;
  let dateDebut;
  let cumule;
  
  if(lastVersement){
    // Date début = date du dernier versement
    dateDebut = new Date(lastVersement.date);
    // Cumulé = tout ce qui s'est passé APRES le dernier versement
    let lastTs = dateDebut.getTime();
    let caDepuis = (STATE.VENTES||[]).filter(v=> new Date(v.date).getTime() > lastTs).reduce((s,v)=>s+(v.total||0),0) + STATE.OFFLINE_QUEUE.filter(q=>q.type==='vente').filter(q=> new Date(q.data.date).getTime() > lastTs).reduce((s,q)=>s+(q.data.total||0),0);
    let depDepuis = (STATE.DEP||[]).filter(d=> new Date(d.date).getTime() > lastTs).reduce((s,d)=>s+(d.montant||0),0);
    let versDepuis = (STATE.VERS||[]).filter(v=> new Date(v.date).getTime() > lastTs).reduce((s,v)=>s+(v.montant||0),0) + STATE.OFFLINE_QUEUE.filter(q=>q.type==='versement').filter(q=> new Date(q.data.date).getTime() > lastTs).reduce((s,q)=>s+(q.data.montant||0),0);
    cumule = caDepuis - depDepuis - versDepuis;
  } else {
    // Pas de versement = on prend depuis le début
    let allDates=[...(STATE.VENTES||[]).map(v=>new Date(v.date)),...(STATE.DEP||[]).map(d=>new Date(d.date)),...(STATE.VERS||[]).map(v=>new Date(v.date))].filter(d=>!isNaN(d.getTime()));
    dateDebut = allDates.length ? new Date(Math.min(...allDates.map(d=>d.getTime()))) : new Date();
    let caTotal=(STATE.VENTES||[]).reduce((s,v)=>s+(v.total||0),0)+STATE.OFFLINE_QUEUE.filter(q=>q.type==='vente').reduce((s,q)=>s+(q.data.total||0),0);
    let depTotal=(STATE.DEP||[]).reduce((s,d)=>s+(d.montant||0),0);
    let versTotal=(STATE.VERS||[]).reduce((s,v)=>s+(v.montant||0),0);
    cumule=caTotal-depTotal-versTotal;
  }
  
  let dateFin=new Date();
  
  let el=document.getElementById('aVerserCumule'); 
  if(el){ el.innerText=formatPrix(cumule)+' FC'; el.style.color=cumule>0?'#ef4444':'#16a34a'; }
  
  let elD=document.getElementById('cumuleDates'); 
  if(elD){ 
    if(lastVersement){
      elD.innerText=`Du ${fmtDate(dateDebut)} ${fmtHeure(dateDebut)} (dernier versement ${formatPrix(lastVersement.montant)} FC) jusqu'au ${fmtDate(dateFin)} ${fmtHeure(dateFin)}`;
      elD.style.background='#fef3c7';
      elD.style.border='1px solid #facc15';
    } else {
      elD.innerText=`Du ${fmtDate(dateDebut)} ${fmtHeure(dateDebut)} jusqu'au ${fmtDate(dateFin)} ${fmtHeure(dateFin)} - Aucun versement`;
    }
  }
  
  let all=[...allV.map(v=>({date:v.date,type:'Vente',montant:v.total,motif:(v.items||[]).map(i=>i.CODE).join(',')})),...(STATE.DEP||[]).filter(d=>new Date(d.date).toDateString()===today).map(d=>({date:d.date,type:'Depense',montant:-d.montant,motif:d.motif})),...(STATE.VERS||[]).filter(v=>new Date(v.date).toDateString()===today).map(v=>({date:v.date,type:'Versement',montant:-v.montant,motif:v.description}))].sort((a,b)=>new Date(b.date)-new Date(a.date));
  let list=document.getElementById('caisseList'); 
  if(list) list.innerHTML=all.map(a=>`<tr><td>${fmtHeure(a.date)}</td><td>${a.type}</td><td style="color:${a.montant<0?'red':'green'}">${formatPrix(a.montant)}</td><td>${a.motif}</td></tr>`).join('')||'<tr><td colspan=4>Aucune</td></tr>';
}

export function updateKPI(){ renderCaisse(); }

export function addDepense(){
  let motif=document.getElementById('motifDep').value; let mont=parseFloat(document.getElementById('montDep').value); if(!mont) return alert('Montant');
  let desc=document.getElementById('descDep').value; let id=Date.now();
  let data={date:new Date().toISOString(),boutique:STATE.SHOP,vendeur:STATE.CURRENT_VENDEUR?STATE.CURRENT_VENDEUR.nom:'',motif:motif,montant:mont,description:desc,offline:!STATE.FIREBASE_CONNECTED};
  if(STATE.FIREBASE_CONNECTED){ window.db.ref('shops/'+STATE.SHOP+'/depenses/'+id).set(data); } else { STATE.OFFLINE_QUEUE.push({type:'depense',shop:STATE.SHOP,id:id,data:data}); saveQueue(); STATE.DEP.push(data); renderCaisse(); updateOfflineUI(); }
  document.getElementById('montDep').value=''; document.getElementById('descDep').value='';
}

export function addVersement(){
  let mont=parseFloat(document.getElementById('montVers').value); if(!mont) return alert('Montant');
  let desc=document.getElementById('descVers').value; let id=Date.now();
  let data={date:new Date().toISOString(),boutique:STATE.SHOP,vendeur:STATE.CURRENT_VENDEUR?STATE.CURRENT_VENDEUR.nom:'',montant:mont,description:desc,offline:!STATE.FIREBASE_CONNECTED};
  if(STATE.FIREBASE_CONNECTED){ window.db.ref('shops/'+STATE.SHOP+'/versements/'+id).set(data); } else { STATE.OFFLINE_QUEUE.push({type:'versement',shop:STATE.SHOP,id:id,data:data}); saveQueue(); STATE.VERS.push(data); renderCaisse(); updateOfflineUI(); }
  document.getElementById('montVers').value=''; document.getElementById('descVers').value='';
  // ✅ Force refresh affichage date après versement
  setTimeout(()=>renderCaisse(), 500);
}

window.renderCaisse=renderCaisse; window.updateKPI=updateKPI; window.addDepense=addDepense; window.addVersement=addVersement;
console.log("caisse.js V5.6.4 DATE DYNAMIQUE OK -", CACHE_VERSION);
