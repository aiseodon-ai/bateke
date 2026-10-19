// js/vendeur/modules/caisse.js
import { STATE } from '../core/state.js';
import { saveQueue, updateOfflineUI } from '../core/offline.js';
export function addDepense(){
  let type=document.getElementById('motifDep')?.value||'autre'; let montant=parseFloat(document.getElementById('montDep')?.value||0); if(!montant) return alert('Montant');
  let data={date:new Date().toISOString(), boutique:STATE.SHOP, type, montant, desc:document.getElementById('descDep')?.value||'', vendeur:STATE.CURRENT_VENDEUR?.nom||''};
  let id=Date.now(); if(!STATE.FIREBASE_CONNECTED){ STATE.OFFLINE_QUEUE.push({type:'depense', id, shop:STATE.SHOP, data}); saveQueue(); } else window.db.ref('shops/'+STATE.SHOP+'/depenses/'+id).set(data);
  document.getElementById('montDep').value=''; updateOfflineUI();
}
export function addVersement(){
  let montant=parseFloat(document.getElementById('montVers')?.value||0); if(!montant) return alert('Montant');
  let data={date:new Date().toISOString(), boutique:STATE.SHOP, montant, desc:document.getElementById('descVers')?.value||'', vendeur:STATE.CURRENT_VENDEUR?.nom||''};
  let id=Date.now(); if(!STATE.FIREBASE_CONNECTED){ STATE.OFFLINE_QUEUE.push({type:'versement', id, shop:STATE.SHOP, data}); saveQueue(); } else window.db.ref('shops/'+STATE.SHOP+'/versements/'+id).set(data);
  document.getElementById('montVers').value=''; updateOfflineUI();
}
export function renderCaisse(){
  let el=document.getElementById('caisseList'); if(!el) return;
  let all=[...(STATE.DEP||[]).map(d=>({...d,_type:'depense'})),...(STATE.VERS||[]).map(v=>({...v,_type:'versement'}))].sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,50);
  el.innerHTML=all.map(x=>`<tr><td>${new Date(x.date).toLocaleTimeString()}</td><td>${x._type}</td><td>${(x.montant||0).toLocaleString()}</td><td>${x.desc||x.type||''}</td></tr>`).join('')||'<tr><td colspan=4>Aucun</td></tr>';
}
export function updateKPI(){
  let today=new Date().toDateString(); let ca=(STATE.VENTES||[]).filter(v=> new Date(v.date).toDateString()===today).reduce((s,v)=>s+(v.total||0),0);
  let dep=(STATE.DEP||[]).filter(d=> new Date(d.date).toDateString()===today).reduce((s,d)=>s+(d.montant||0),0);
  if(document.getElementById('caJour')) document.getElementById('caJour').innerText='CA Jour: '+ca.toLocaleString();
  if(document.getElementById('caJour2')) document.getElementById('caJour2').innerText=ca.toLocaleString()+' FC';
  if(document.getElementById('aVerser')) document.getElementById('aVerser').innerText=(ca-dep).toLocaleString()+' FC';
}
window.addDepense=addDepense; window.addVersement=addVersement; window.renderCaisse=renderCaisse; window.updateKPI=updateKPI;
