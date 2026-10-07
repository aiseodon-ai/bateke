import { STATE } from '../core/state.js';
export function renderVentes(){
  let tb=document.getElementById('ventesList'); if(!tb) return;
  let data=window.getFiltered?window.getFiltered():{ventes:[]};
  let ventes=(data.ventes||[]).slice().sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,500);
  tb.innerHTML=ventes.map(v=>`
    <tr>
      <td>${(v.date||'').toString().slice(0,19)}</td>
      <td>${window.esc(v.vendeur||'')}</td>
      <td>${window.esc(v.code||'')}</td>
      <td>${window.esc(v.designation||'')}</td>
      <td>${v.qte||0}</td>
      <td>${(v.total||0).toLocaleString()}</td>
      <td>${(v.paye||0).toLocaleString()}</td>
      <td>${(v.reste||0).toLocaleString()}</td>
      <td>${window.esc(v.client||'Comptoir')}</td>
      <td>${window.esc(v.mode||'cash')}</td>
      <td><button class="btn btn-r" onclick="window.annulerVente('${v._id}','${v._shop||STATE.SHOP}')">↩️</button></td>
    </tr>`).join('');
  document.getElementById('labVenteShop').innerText=STATE.SHOP;
  updateKPIVentes(data.ventes);
}
function updateKPIVentes(ventes){
  let today=new Date().toISOString().slice(0,10);
  let jour=ventes.filter(v=>(v.date||'').slice(0,10)===today);
  let caJ=jour.reduce((s,v)=>s+(parseFloat(v.total)||0),0);
  let payeJ=jour.reduce((s,v)=>s+(parseFloat(v.paye)||0),0);
  document.getElementById('caJour').innerText=caJ.toLocaleString()+' FC';
  document.getElementById('caJourDetail').innerText='Encaissé: '+payeJ.toLocaleString();
  let benef=jour.reduce((s,v)=>{let stock=(STATE.ALL_DATA[STATE.SHOP]?.stock||[]).find(a=>a.code===v.code); let pa=stock?parseFloat(stock.pa||0):0; return s+((parseFloat(v.total)||0)-(pa*(parseFloat(v.qte)||0)));},0);
  document.getElementById('benefJour').innerText=benef.toLocaleString()+' FC';
  let dettesJ=jour.reduce((s,v)=>s+(parseFloat(v.reste)||0),0);
  document.getElementById('detteJour').innerText=dettesJ.toLocaleString()+' FC';
}
export function annulerVente(id,shop){if(!confirm('Annuler vente?'))return; window.db.ref('shops/'+shop+'/ventes/'+id).remove();}
window.renderVentes=renderVentes; window.annulerVente=annulerVente;
