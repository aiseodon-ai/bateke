// js/vendeur/modules/facture.js
import { STATE } from '../core/state.js';
export function renderPanierFact(){ let el=document.getElementById('panierFact'); if(el) el.innerHTML=STATE.PANIER_FACT.map(p=>`<div>${p.CODE} x${p.qty}</div>`).join('')||'Vide'; }
export function convertDevisToFact(id){ let d=(STATE.DEVIS||[]).find(x=>x._id===id); if(!d) return; STATE.PANIER_FACT=d.items; renderPanierFact(); }
export function validerFacture(){ if(!STATE.PANIER_FACT.length) return alert('Vide'); let f={numero:'FACT-'+Date.now(), date:new Date().toISOString(), boutique:STATE.SHOP, items:STATE.PANIER_FACT}; window.db.ref('shops/'+STATE.SHOP+'/factures/'+Date.now()).set(f).then(()=>{ STATE.PANIER_FACT=[]; renderPanierFact(); alert('Facture '+f.numero); }); }
window.renderPanierFact=renderPanierFact; window.convertDevisToFact=convertDevisToFact; window.validerFacture=validerFacture;
