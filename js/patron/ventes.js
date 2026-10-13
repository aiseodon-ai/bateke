import { STATE } from '../core/state.js';
import { db } from '../core/firebase.js';

export function renderVentes(){
  let tb=document.getElementById('ventesList'); if(!tb) return;
  let data = window.getFiltered? window.getFiltered() : {ventes:[]};
  let ventes = (data.ventes||[]).slice().sort((a,b)=> new Date(b.date||0)-new Date(a.date||0)).slice(0,200);

  let rows=[];
  ventes.forEach(v=>{
    // Structure fidèle V4.9.25 = v.items[]
    let items = v.items || [];
    // Compat si ancienne vente plate sans items
    if(!items.length && v.CODE){
      items = [{CODE: v.CODE||v.code, Designation: v.Designation||v.designation, qty: v.qty||v.qte||0, Prix: v.Prix||v.pv||0}];
    }
    items.forEach(i=>{
      rows.push(`
        <tr>
          <td>${new Date(v.date).toLocaleString()}</td>
          <td>${window.esc(v.vendeurNom||v.vendeur||'')}</td>
          <td>${window.esc(i.CODE||'')}</td>
          <td>${window.esc(i.Designation||'')}</td>
          <td>${i.qty||0}</td>
          <td>${((i.qty||0)*(i.Prix||0)).toLocaleString()}</td>
          <td>${(v.montantPaye??v.total??0).toLocaleString()}</td>
          <td style="color:${(v.reste||0)>0?'red':'inherit'}">${(v.reste||0).toLocaleString()}</td>
          <td>${window.esc(v.client?.nom||(typeof v.client==='string'?v.client:'Comptoir'))}</td>
          <td>${window.esc(v.payement||v.mode||'cash')}</td>
          <td><button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" data-id="${v._id}" data-shop="${v._shop||STATE.SHOP}" onclick="window.annulerVente(this.dataset.id,this.dataset.shop)">↩</button></td>
        </tr>`);
    });
  });

  tb.innerHTML = rows.join('') || '<tr><td colspan=11>Aucune vente</td></tr>';
  if(document.getElementById('labVenteShop')) document.getElementById('labVenteShop').innerText = STATE.SHOP;

  // On laisse updateKPIs global gérer les KPI (plus fiable)
  if(window.updateKPIs) window.updateKPIs();
}

export function annulerVente(id,shop){
  if(!confirm('Annuler cette vente? '+id)) return;
  let s = shop||STATE.SHOP;
  db.ref('shops/'+s+'/ventes/'+id).remove().then(()=>{
    // sync local
    if(STATE.ALL_DATA[s]?.ventes){
      STATE.ALL_DATA[s].ventes = STATE.ALL_DATA[s].ventes.filter(x=>String(x._id)!==String(id));
    }
    window.savePatronCache?.();
    renderVentes();
    window.renderCaisse?.();
    window.updateKPIs?.();
  });
}

// Expose global pour onclick HTML
window.renderVentes = renderVentes;
window.annulerVente = annulerVente;

console.log("✅ ventes.js FIDÈLE V4.9.25 chargé");
