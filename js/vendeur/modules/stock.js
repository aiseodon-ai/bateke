// js/vendeur/modules/stock.js
import { STATE } from '../core/state.js';
export function renderStock(){
  let tb=document.getElementById('stockList'); if(!tb) return;
  let q=(document.getElementById('searchStock')?.value||'').toLowerCase();
  let filt=STATE.STOCK.filter(s=>{
    if(!q) return true;
    return (s.CODE||'').toLowerCase().includes(q) || (s.Designation||'').toLowerCase().includes(q);
  }).slice(0,200);
  tb.innerHTML=filt.map(s=>`<tr><td><b>${esc(s.CODE)}</b></td><td>${esc(s.Designation)}</td><td>${s.Quantite||0}</td><td>${(s.Prix||s.PV||0).toLocaleString()}</td><td><button class="btn btn-b" style="width:auto" onclick="selectArticle('${esc(s.CODE).replace(/'/g,"\\'")}')">➕</button></td></tr>`).join('')||'<tr><td colspan=5>Aucun</td></tr>';
}
export function selectArticle(code){
  let art=STATE.STOCK.find(s=> (s.CODE||'')===code ); if(!art) return;
  document.getElementById('codeArt').value=art.CODE;
  document.getElementById('pvArt').value=art.Prix||art.PV||0;
  document.getElementById('designArt').value=art.Designation||'';
  document.getElementById('stockArt').value=art.Quantite||0;
  window.SELECTED_ART=art;
}
function esc(t){ return window.esc ? window.esc(t) : String(t||''); }
window.renderStock=renderStock; window.selectArticle=selectArticle;
