import { STATE } from '../core/state.js';
import { db } from '../core/firebase.js';

export function renderVentes(){
  let tb=document.getElementById('ventesList'); 
  if(!tb) return;
  
  let currentShop = STATE.SHOP || 'ALL';
  let ventes = [];

  // 1. RECUPERE VENTES SELON BOUTIQUE SELECTIONNEE
  if(currentShop === 'ALL' || !currentShop){
    // PATRON ALL = AGREGE TOUTES LES BOUTIQUES
    Object.keys(STATE.ALL_DATA||{}).forEach(shopName=>{
      let shopVentes = STATE.ALL_DATA[shopName]?.ventes || [];
      shopVentes.forEach(v=>{
        ventes.push({...v, _shop: shopName});
      });
    });
  } else {
    // UNE SEULE BOUTIQUE (Menkao2)
    ventes = (STATE.ALL_DATA[currentShop]?.ventes || []).map(v=>({...v, _shop: currentShop}));
    
    // FALLBACK: si ALL_DATA vide, essaie de lire direct depuis Firebase cache local
    if(ventes.length===0 && window._lastVentesRaw){
      ventes = window._lastVentesRaw;
    }
  }

  // 2. FILTRE DATE SEULEMENT SI getFiltered EXISTE, SINON MONTRE TOUT
  let filtered = ventes;
  if(window.getFiltered){
    try {
      let data = window.getFiltered();
      if(data.ventes && data.ventes.length>0){
        filtered = data.ventes;
      }
    } catch(e){
      console.warn("getFiltered erreur, on montre tout:", e);
    }
  }

  // Si toujours vide et on est en ALL, on force sans filtre date pour voir hier
  if(filtered.length===0 && ventes.length>0){
    filtered = ventes;
    console.log("⚠️ Filtre date vide, on affiche sans filtre:", ventes.length);
  }

  filtered = filtered.slice().sort((a,b)=> new Date(b.date||0)-new Date(a.date||0)).slice(0,200);

  console.log(`📊 RENDER VENTES Shop=${currentShop} Total=${ventes.length} Affichés=${filtered.length}`);

  let rows=[];
  filtered.forEach(v=>{
    let items = v.items || [];
    if(!items.length && (v.CODE || v.code)){
      items = [{CODE: v.CODE||v.code, Designation: v.Designation||v.designation, qty: v.qty||v.qte||0, Prix: v.Prix||v.pv||0}];
    }
    items.forEach(i=>{
      rows.push(`
        <tr>
          <td>${new Date(v.date).toLocaleString()}</td>
          <td>${window.esc(v._shop||'')}</td>
          <td>${window.esc(v.vendeurNom||v.vendeur||'')}</td>
          <td>${window.esc(i.CODE||i.code||'')}</td>
          <td>${window.esc(i.Designation||i.designation||'')}</td>
          <td>${i.qty||i.qte||0}</td>
          <td>${((i.qty||i.qte||0)*(i.Prix||i.pv||0)).toLocaleString()}</td>
          <td>${(v.montantPaye??v.total??0).toLocaleString()}</td>
          <td style="color:${(v.reste||0)>0?'red':'inherit'}">${(v.reste||0).toLocaleString()}</td>
          <td>${window.esc(v.client?.nom||(typeof v.client==='string'?v.client:'Comptoir'))}</td>
          <td>${window.esc(v.payement||v.mode||'cash')}</td>
          <td><button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" data-id="${v._id}" data-shop="${v._shop||currentShop}" onclick="window.annulerVente(this.dataset.id,this.dataset.shop)">↩</button></td>
        </tr>`);
    });
  });

  tb.innerHTML = rows.join('') || `<tr><td colspan=11>Aucune vente pour ${currentShop} - Total brut trouvé: ${ventes.length} (vérifie filtre date du/au)</td></tr>`;
  if(document.getElementById('labVenteShop')) document.getElementById('labVenteShop').innerText = currentShop;
  if(window.updateKPIs) window.updateKPIs();
  
  // Debug pour toi
  if(ventes.length>0){
    window._lastVentesRaw = ventes;
  }
}

// CORRIGÉ: Annulation avec RETOUR STOCK
export async function annulerVente(id, shop){
  if(!id) return alert('ID vide');
  if(!confirm('Annuler cette vente '+id+'? Le stock sera REMIS.')) return;

  let s = shop || STATE.SHOP;
  if(!s || s==='ALL'){
    // Cherche la vraie boutique
    for(let sh of Object.keys(STATE.ALL_DATA||{})){
      if((STATE.ALL_DATA[sh]?.ventes||[]).some(x=>String(x._id)===String(id))){
        s = sh; break;
      }
    }
  }
  if(!s || s==='ALL') return alert('Choisis boutique - vente introuvable');

  let path = 'shops/'+s+'/ventes/'+id;
  let snap = await db.ref(path).once('value');
  if(!snap.exists()){
    for(let sh of Object.keys(STATE.ALL_DATA||{})){
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

  for(let it of items){
    let codeArt = (it.CODE || it.code || '').trim();
    let q = parseInt(it.qty || it.qte || it.Quantite || 1) || 1;
    if(!codeArt) continue;
    try{
      await db.ref('shops/'+s+'/stock/'+codeArt+'/Quantite').transaction(c => (c||0) + q);
      await db.ref('shops/'+s+'/stock/'+codeArt+'/quantite').transaction(c => {
        if(c===null) return null;
        return (c||0) + q;
      });
    }catch(e){ console.error('Erreur retour stock '+codeArt, e); }
  }

  await db.ref(path).remove();
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
