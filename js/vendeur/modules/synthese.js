// js/vendeur/modules/synthese.js
import { STATE } from '../core/state.js';
export function genSyntheseVendeur(){
  let du=new Date(document.getElementById('du')?.value|| new Date().setDate(1)); let au=new Date(document.getElementById('au')?.value||Date.now());
  let vFiltre=(STATE.VENTES||[]).filter(v=>{ let d=new Date(v.date); return d>=du && d<=au; });
  let byArt={}; vFiltre.forEach(v=>{ (v.items||[]).forEach(it=>{ if(!byArt[it.CODE]) byArt[it.CODE]={CODE:it.CODE, Designation:it.Designation||'', qty:0, ca:0}; byArt[it.CODE].qty+=it.qty||0; byArt[it.CODE].ca+= (it.prix||it.PV||0)*(it.qty||0); }); });
  let totalCA=Object.values(byArt).reduce((s,a)=>s+a.ca,0); let totalQte=Object.values(byArt).reduce((s,a)=>s+a.qty,0);
  let html=`<h4>Synthèse ${STATE.SHOP} - ${du.toLocaleDateString()} au ${au.toLocaleDateString()}</h4><p>Qté: ${totalQte} - CA: ${totalCA.toLocaleString()} FC</p><table><tr><th>CODE</th><th>Désignation</th><th>Qté</th><th>CA</th></tr>`+Object.values(byArt).map(r=>`<tr><td>${r.CODE}</td><td>${r.Designation}</td><td>${r.qty}</td><td>${r.ca.toLocaleString()}</td></tr>`).join('')+'</table>';
  document.getElementById('syntheseC').innerHTML=html;
}
export function pdfSynthese(){ let c=document.getElementById('syntheseC').innerHTML; let w=window.open('','','width=900'); w.document.write('<html><body>'+c+'</body></html>'); w.print(); }
window.genSyntheseVendeur=genSyntheseVendeur; window.pdfSynthese=pdfSynthese;
