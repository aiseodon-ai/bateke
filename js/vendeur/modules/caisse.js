// caisse.js - RESTAURATION ORIGINALE V5.6.3
import { STATE } from '../core/state.js';
import { saveQueue, updateOfflineUI } from '../core/offline.js';

export function renderCaisse(){
  let today=new Date().toDateString();
  let vToday=(STATE.VENTES||[]).filter(v=>new Date(v.date).toDateString()===today);
  let vQueue=STATE.OFFLINE_QUEUE.filter(q=>q.type==='vente').map(q=>q.data).filter(v=>new Date(v.date).toDateString()===today);
  let allV=[...vToday,...vQueue];
  let ca=allV.reduce((s,v)=>s+(v.total||0),0);
  let depJ=(STATE.DEP||[]).filter(d=>new Date(d.date).toDateString()===today).reduce((s,d)=>s+(d.montant||0),0);
  let versJ=(STATE.VERS||[]).filter(v=>new Date(v.date).toDateString()===today).reduce((s,v)=>s+(v.montant||0),0);
  
  if(document.getElementById('caJour')) document.getElementById('caJour').innerText='CA Jour: '+ca.toLocaleString();
  if(document.getElementById('caJour2')) document.getElementById('caJour2').innerText=ca.toLocaleString()+' FC';
  if(document.getElementById('aVerser')) document.getElementById('aVerser').innerText=(ca-depJ-versJ).toLocaleString()+' FC';
  
  let caTotal=(STATE.VENTES||[]).reduce((s,v)=>s+(v.total||0),0)+STATE.OFFLINE_QUEUE.filter(q=>q.type==='vente').reduce((s,q)=>s+(q.data.total||0),0);
  let depTotal=(STATE.DEP||[]).reduce((s,d)=>s+(d.montant||0),0);
  let versTotal=(STATE.VERS||[]).reduce((s,v)=>s+(v.montant||0),0);
  let cumule=caTotal-depTotal-versTotal;
  
  let allDates=[...(STATE.VENTES||[]).map(v=>new Date(v.date)),...(STATE.DEP||[]).map(d=>new Date(d.date)),...(STATE.VERS||[]).map(v=>new Date(v.date))].filter(d=>!isNaN(d.getTime()));
  let dateDebut=allDates.length? new Date(Math.min(...allDates)) : new Date();
  let dateFin=new Date();
  let fmt=d=>d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'});
  let fmtH=d=>d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  
  let el=document.getElementById('aVerserCumule'); if(el){ el.innerText=cumule.toLocaleString()+' FC'; el.style.color=cumule>0?'#ef4444':'#16a34a'; }
  let elD=document.getElementById('cumuleDates'); if(elD){ elD.innerText=`Du ${fmt(dateDebut)} ${fmtH(dateDebut)} jusqu'au ${fmt(dateFin)} ${fmtH(dateFin)}`; }
  
  let all=[...allV.map(v=>({date:v.date,type:'Vente',montant:v.total,motif:(v.items||[]).map(i=>i.CODE).join(',')})),...(STATE.DEP||[]).filter(d=>new Date(d.date).toDateString()===today).map(d=>({date:d.date,type:'Dépense',montant:-d.montant,motif:d.motif})),...(STATE.VERS||[]).filter(v=>new Date(v.date).toDateString()===today).map(v=>({date:v.date,type:'Versement',montant:-v.montant,motif:v.description}))].sort((a,b)=>new Date(b.date)-new Date(a.date));
  let list=document.getElementById('caisseList'); if(list) list.innerHTML=all.map(a=>`<tr><td>${new Date(a.date).toLocaleTimeString()}</td><td>${a.type}</td><td style="color:${a.montant<0?'red':'green'}">${a.montant.toLocaleString()}</td><td>${a.motif}</td></tr>`).join('')||'<tr><td colspan=4>Aucune</td></tr>';
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
}
window.renderCaisse=renderCaisse; window.updateKPI=updateKPI; window.addDepense=addDepense; window.addVersement=addVersement;
