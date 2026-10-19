// js/vendeur/modules/facture.js
import { STATE } from '../core/state.js';
export function searchArticleFact(){ return window.searchArticle?.(); }
export function addPanierFact(){}
export function renderPanierFact(){}
export function validerFacture(){ alert('Facture - module prêt'); }
export function renderFactList(){
  let el=document.getElementById('factList'); if(!el) return;
  el.innerHTML=(STATE.FACTURES||[]).slice(0,30).map(f=>`<tr><td>${f.numero||''}</td><td>${f.client?.nom||''}</td><td>${(f.total||0).toLocaleString()}</td><td>${f.devise||'FC'}</td><td></td><td><button>PDF</button></td></tr>`).join('')||'<tr><td colspan=6>Aucune</td></tr>';
}
export function convertDevisToFact(id){ console.log("Convert", id); }
window.searchArticleFact=searchArticleFact; window.addPanierFact=addPanierFact; window.renderPanierFact=renderPanierFact; window.validerFacture=validerFacture; window.convertDevisToFact=convertDevisToFact; window.renderFactList=renderFactList;
window.onDeviseFactChange=function(){};
