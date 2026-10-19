// js/vendeur/modules/stock.js
import { STATE } from '../core/state.js';
function esc(t){ return window.esc ? window.esc(t) : String(t||''); }
export function renderStock(){
  let tb=document.getElementById('stockT'); if(!tb) return;
  let q=(document.getElementById('searchS')?.value||'').toLowerCase();
  let filt=STATE.STOCK.filter(s=>{ if(!q) return true; return (s.CODE||'').toLowerCase().includes(q) || (s.Designation||'').toLowerCase().includes(q); }).slice(0,200);
  tb.innerHTML=filt.map(s=>`<tr><td><b>${esc(s.CODE)}</b></td><td>${esc(s.Designation)}</td><td>${s.Quantite||0}</td><td>${(s.Prix||s.PV||0).toLocaleString()}</td><td>${(s.Quantite||0)<=0?'🔴 Rupture':(s.Quantite||0)<=3?'🟡 Faible':'🟢 OK'}</td><td><button class="btn btn-b" style="width:auto" onclick="selectArticle('${esc(s.CODE)}')">➕</button></td></tr>`).join('')||'<tr><td colspan=6>Aucun</td></tr>';
  if(window.updateOfflineUI) window.updateOfflineUI();
}
export function selectArticle(code){ let art=STATE.STOCK.find(s=>s.CODE===code); if(!art) return; document.getElementById('codeArt').value=art.CODE; document.getElementById('pvArt').value=art.Prix||art.PV||0; document.getElementById('qteArt').value=1; }
export function searchArticle(){
  let q=(document.getElementById('searchArt')?.value||'').toLowerCase(); let sug=document.getElementById('suggest'); if(!sug) return;
  if(!q){ sug.style.display='none'; return; }
  let res=STATE.STOCK.filter(s=> (s.CODE||'').toLowerCase().includes(q) || (s.Designation||'').toLowerCase().includes(q)).slice(0,10);
  sug.innerHTML=res.map(s=>`<div onclick="selectArticle('${esc(s.CODE)}');document.getElementById('suggest').style.display='none'">${esc(s.CODE)} - ${esc(s.Designation)} (${s.Quantite||0})</div>`).join(''); sug.style.display=res.length?'block':'none';
}
window.renderStock=renderStock; window.selectArticle=selectArticle; window.searchArticle=searchArticle;
