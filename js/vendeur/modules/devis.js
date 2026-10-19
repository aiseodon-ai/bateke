// js/vendeur/modules/devis.js
import { STATE } from '../core/state.js';
export function renderPanierDevis(){ /* même logique que vente mais PANIER_DEVIS */ 
  let el=document.getElementById('panierDevis'); if(!el) return;
  el.innerHTML=STATE.PANIER_DEVIS.map((p,i)=>`<div>${p.CODE} x${p.qty} <button onclick="removeDevis(${i})">🗑️</button></div>`).join('')||'Vide';
}
export function addPanierDevis(){ let code=document.getElementById('codeArtDevis')?.value; if(!code) return; STATE.PANIER_DEVIS.push({CODE:code, qty:1}); renderPanierDevis(); }
export function validerDevis(){ if(!STATE.PANIER_DEVIS.length) return alert('Vide'); let d={numero:'DEV-'+Date.now(), date:new Date().toISOString(), boutique:STATE.SHOP, vendeur:STATE.CURRENT_VENDEUR?.nom||'', items:STATE.PANIER_DEVIS, total:0}; window.db.ref('shops/'+STATE.SHOP+'/devis/'+Date.now()).set(d).then(()=>{ STATE.PANIER_DEVIS=[]; renderPanierDevis(); alert('Devis '+d.numero); }); }
export function renderDevisList(){ let el=document.getElementById('devisList'); if(!el) return; el.innerHTML=(STATE.DEVIS||[]).slice(0,30).map(d=>`<tr><td>${d.numero}</td><td>${d.client?.nom||''}</td><td>${(d.total||0).toLocaleString()}</td><td><button onclick="convertDevisToFact('${d._id}')">→Fact</button></td></tr>`).join('')||'<tr><td colspan=4>Aucun</td></tr>'; }
window.renderPanierDevis=renderPanierDevis; window.addPanierDevis=addPanierDevis; window.validerDevis=validerDevis; window.renderDevisList=renderDevisList;
