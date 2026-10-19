// synthese.js - FIX ORIGINAL + inclut OFFLINE_QUEUE comme CA Jour
import { STATE } from '../core/state.js';
function esc(t){ return window.esc?window.esc(t):String(t||''); }

export function genSyntheseVendeur(){
  let duInput=document.getElementById('du').value;
  let auInput=document.getElementById('au').value;
  if(!duInput||!auInput){ alert('Choisis Du et Au'); return; }
  let du=new Date(duInput);
  let au=new Date(auInput); au.setHours(23,59,59,999);
  
  // ORIGINAL + OFFLINE - c'était le bug
  let allVentes=[...(STATE.VENTES||[]), ...STATE.OFFLINE_QUEUE.filter(q=>q.type==='vente').map(q=>q.data)];
  let vPeriode=allVentes.filter(v=>{ let d=new Date(v.date); return d>=du && d<=au; });
  
  let byArt={};
  vPeriode.forEach(v=>{
    (v.items||[]).forEach(i=>{
      if(!byArt[i.CODE]) byArt[i.CODE]={CODE:i.CODE,Designation:i.Designation||STATE.STOCK.find(s=>s.CODE===i.CODE)?.Designation||i.CODE,qty:0,ca:0};
      let q=parseFloat(i.qty||i.qte||0)||0;
      let p=parseFloat(i.prix||i.Prix||i['Prix Unit']||0)||0;
      byArt[i.CODE].qty+=q;
      byArt[i.CODE].ca+=q*p;
    });
  });
  
  let totalQte=Object.values(byArt).reduce((s,a)=>s+a.qty,0);
  let totalCA=Object.values(byArt).reduce((s,a)=>s+a.ca,0);
  // Si ca=0 (prix manquant), prend total des ventes
  if(totalCA===0) totalCA=vPeriode.reduce((s,v)=>s+(v.total||0),0);
  
  console.log("SYNTHESE", duInput, "->", auInput, "ventes trouvées:", vPeriode.length, "CA", totalCA);
  
  let html=`<h4>Synthèse ${STATE.SHOP} - ${du.toLocaleDateString()} au ${au.toLocaleDateString()} - Vendeur: ${STATE.CURRENT_VENDEUR?STATE.CURRENT_VENDEUR.nom:''}</h4>
  <p>Total: <b>${totalQte}</b> - CA: <b>${totalCA.toLocaleString()} FC</b> (${vPeriode.length} ventes)</p>
  <table><tr><th>CODE</th><th>Désignation</th><th>Qté</th><th>CA</th><th>Stock</th></tr>`+
  Object.values(byArt).sort((a,b)=>b.qty-a.qty).map(r=>`<tr><td>${esc(r.CODE)}</td><td>${esc(r.Designation)}</td><td>${r.qty}</td><td>${r.ca.toLocaleString()} FC</td><td>${STATE.STOCK.find(s=>s.CODE===r.CODE)?.Quantite??''}</td></tr>`).join('')+
  `</table>`;
  
  document.getElementById('syntheseC').innerHTML=html;
}
export function pdfSynthese(){
  let c=document.getElementById('syntheseC').innerHTML;
  let w=window.open('','','width=900,height=900');
  w.document.write('<html><head><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px}th{background:#111;color:#fff}</style></head><body>'+c+'</body></html>');
  w.document.close(); w.print();
}
window.genSyntheseVendeur=genSyntheseVendeur; window.pdfSynthese=pdfSynthese;
