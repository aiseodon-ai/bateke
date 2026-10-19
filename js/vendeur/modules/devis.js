// js/vendeur/modules/devis.js - stub prêt
import { STATE } from '../core/state.js';
export function searchArticleDevis(){ return window.searchArticle?.(); }
export function addPanierDevis(){ console.log("Devis à implémenter"); }
export function renderPanierDevis(){}
export function validerDevis(){ alert('Devis - module prêt'); }
export function renderDevisList(){
  let el=document.getElementById('devisList'); if(!el) return;
  el.innerHTML=(STATE.DEVIS||[]).slice(0,30).map(d=>`<tr><td>${d.numero||''}</td><td>${d.client?.nom||''}</td><td>${(d.total||0).toLocaleString()}</td><td>${d.devise||'FC'}</td><td>${d.taux||''}</td><td><button onclick="convertDevisToFact('${d._id}')">→Fact</button></td></tr>`).join('')||'<tr><td colspan=6>Aucun</td></tr>';
}
window.searchArticleDevis=searchArticleDevis; window.addPanierDevis=addPanierDevis; window.renderPanierDevis=renderPanierDevis; window.validerDevis=validerDevis; window.renderDevisList=renderDevisList;
window.onDeviseDevisChange=function(){};
