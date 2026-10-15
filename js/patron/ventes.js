import { STATE } from '../core/state.js';
import { db } from '../core/firebase.js';

export function renderVentes(){
  let tb=document.getElementById('ventesList'); if(!tb) return;
  let data = window.getFiltered? window.getFiltered() : {ventes:[]};
  let ventes = (data.ventes||[]).slice().sort((a,b)=> new Date(b.date||0)-new Date(a.date||0)).slice(0,200);

  let rows=[];
  ventes.forEach(v=>{
    let items = v.items || [];
    if(!items.length && (v.CODE || v.code)){
      items = [{CODE: v.CODE||v.code, Designation: v.Designation||v.designation, qty: v.qty||v.qte||0, Prix: v.Prix||v.pv||0}];
    }
    items.forEach(i=>{
      rows.push(`
        <tr>
          <td>${new Date(v.date).toLocaleString()}</td>
          <td>${window.esc(v.vendeurNom||v.vendeur||'')}</td>
          <td>${window.esc(i.CODE||i.code||'')}</td>
          <td>${window.esc(i.Designation||i.designation||'')}</td>
          <td>${i.qty||i.qte||0}</td>
          <td>${((i.qty||i.qte||0)*(i.Prix||i.pv||0)).toLocaleString()}</td>
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
  if(window.updateKPIs) window.updateKPIs();
}

// CORRIGÉ: Annulation avec RETOUR STOCK
export async function annulerVente(id, shop){
  if(!id) return alert('ID vide');
  if(!confirm('Annuler cette vente '+id+'? Le stock sera REMIS.')) return;

  let s = shop || STATE.SHOP;
  if(!s || s==='ALL') return alert('Choisis boutique');

  let path = 'shops/'+s+'/ventes/'+id;
  let snap = await db.ref(path).once('value');
  if(!snap.exists()){
    // essaie de trouver la boutique si shop mal passé
    for(let sh of (STATE.SHOPS_LIST||[])){
      let snap2 = await db.ref('shops/'+sh+'/ventes/'+id).once('value');
      if(snap2.exists()){ snap = snap2; s = sh; path = 'shops/'+s+'/ventes/'+id; break; }
    }
  }
  if(!snap.exists()) return alert('Vente introuvable: '+id);

  let v = snap.val();
  let items = v.items || [];
  if(!items.length && (v.CODE || v.code)){
    items = [{CODE: v.CODE||v.code, qty: v.qty||v.qte||v.Quantite||1}];
  }

  // 1. REMISE STOCK
  for(let it of items){
    let codeArt = (it.CODE || it.code || '').trim();
    let q = parseInt(it.qty || it.qte || it.Quantite || it.quantite || 1) || 1;
    if(!codeArt) continue;
    try{
      // Ta clé réelle dans Firebase est Quantite avec majuscule
      await db.ref('shops/'+s+'/stock/'+codeArt+'/Quantite').transaction(c => (c||0) + q);
      // Compat si jamais tu as aussi quantite minuscule quelque part
      await db.ref('shops/'+s+'/stock/'+codeArt+'/quantite').transaction(c => {
        if(c===null) return null; // si n'existe pas, on ignore
        return (c||0) + q;
      });
      console.log(`✅ Stock remis ${codeArt} +${q}`);
    }catch(e){ console.error('Erreur retour stock '+codeArt, e); }
  }

  // 2. SUPPRESSION VENTE
  await db.ref(path).remove();

  // 3. SYNC LOCAL
  if(STATE.ALL_DATA[s]?.ventes){
    STATE.ALL_DATA[s].ventes = STATE.ALL_DATA[s].ventes.filter(x=>String(x._id)!==String(id));
  }
  window.savePatronCache?.();
  renderVentes();
  window.renderCaisse?.();
  window.renderStock?.();
  window.updateKPIs?.();

  alert('✅ Vente annulée et stock remis!');
}

window.renderVentes = renderVentes;
window.annulerVente = annulerVente;

console.log("✅ ventes.js FIDÈLE V4.9.25 + RETOUR STOCK chargé");
