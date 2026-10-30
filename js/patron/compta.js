// VERSION SAFE CORRIGÉE - V4.9.10 EXACT + garde-fous V8.27 - ne bloque pas SYNC
export function calcCompta(){
 try{
  let duEl=document.getElementById('cDu'), auEl=document.getElementById('cAu');
  if(!duEl||!auEl){ console.log("cDu/cAu manquant"); return; }
  if(!duEl.value || !auEl.value){
    let r=document.getElementById('comptaResult');
    if(r) r.innerHTML='<p style="color:red">Choisis dates Du/Au</p>';
    return;
  }
  let du=new Date(duEl.value), au=new Date(auEl.value);
  au.setHours(23,59,59);
  if(isNaN(du.getTime())||isNaN(au.getTime())){
    let r=document.getElementById('comptaResult');
    if(r) r.innerHTML='<p style="color:red">Choisis dates Du/Au valides</p>';
    return;
  }

  // SAFE: getFiltered avec fallback
  let data;
  try{ data = (typeof getFiltered==='function' ? getFiltered() : window.getFiltered?.()); }catch(e){ data=null; }
  if(!data) data = {ventes:[], dep:[], stock:[], shop: window.SHOP||'Menkao1'};
  if(!data.ventes) data.ventes=[];
  if(!data.dep) data.dep=[];
  if(!data.stock) data.stock=[];

  if(data.ventes.length===0){
    console.log("⚠️ data.ventes vide, getFiltered pas prêt ou pas de ventes", data);
  }

  // fullMap par CODE unique (base exacte)
  let fullMap={}; 
  (data.stock||[]).forEach(p=>{ let c=p.CODE||p._id; if(c) fullMap[c]=p; });

  let base=parseFloat(document.getElementById('cBase')?.value||50000);
  let comPct=parseFloat(document.getElementById('cCom')?.value||10);
  let loyer=parseFloat(document.getElementById('cLoyer')?.value||100000);
  let autreFixe=parseFloat(document.getElementById('cAutresFixe')?.value||0);
  let emprunt=parseFloat(document.getElementById('cEmprunt')?.value||0);
  let primePct=parseFloat(document.getElementById('cPrime')?.value||25);
  let patronPct=parseFloat(document.getElementById('cPatron')?.value||45);
  let devPct=parseFloat(document.getElementById('cDev')?.value||30);

  let exclus = window.CURRENT_CONFIG?.compta?.exclus || [];

  let vPeriode=(data.ventes||[]).filter(v=>{ let d=new Date(v.date); return d>=du&&d<=au; });
  let depPeriode=(data.dep||[]).filter(d=>{ let dt=new Date(d.date); return dt>=du&&dt<=au; });

  let parVendeur={};
  vPeriode.forEach(v=>{
    let nomRaw=(v.vendeurNom||v.vendeur||'Inconnu').trim();
    if(!nomRaw || nomRaw.toLowerCase()==='comptoir') return;
    let key=nomRaw.toLowerCase().replace(/\s+/g,'').replace(/[^a-z]/g,'');
    if(!key) key=nomRaw.toLowerCase();
    if(exclus.includes(key)) return;
    if(!parVendeur[key]) parVendeur[key]={key:key,nom:nomRaw,qty:0,ca:0,benefBrut:0,commission:0,salaire:0,countVentes:0};
    parVendeur[key].countVentes++;
    (v.items||[]).forEach(i=>{
      let pa=fullMap[i.CODE]?.['Prix Achat']||fullMap[i.CODE]?.['Prix Achat']||0;
      parVendeur[key].qty+=i.qty||0;
      parVendeur[key].ca+= (i.qty||0)*(i.Prix||0);
      parVendeur[key].benefBrut+= (i.qty||0)*((i.Prix||0)-pa);
    });
  });

  let vals=Object.values(parVendeur);
  vals.forEach(v=>{ v.commission=v.benefBrut*(comPct/100); v.salaire=base+v.commission; });

  let totalCA=vPeriode.reduce((s,v)=>s+(v.total||0),0);
  let totalBenefBrut=vals.reduce((s,v)=>s+v.benefBrut,0) || vPeriode.reduce((s,v)=>s+(v.benefice||0),0);
  let totalCom=vals.reduce((s,v)=>s+v.commission,0);
  let totalBase=vals.length*base;
  let totalDep=depPeriode.reduce((s,d)=>s+(d.montant||0),0);

  let totalChargesFixes=loyer+autreFixe+emprunt+totalBase;
  let chargesPourSeuil=totalChargesFixes+totalDep+totalCom;
  let resultatNet=totalBenefBrut-totalDep-totalChargesFixes-totalCom;
  let repart=resultatNet>0?resultatNet:0;
  let meilleur=vals.sort((a,b)=>b.benefBrut-a.benefBrut)[0];
  let margePct=totalCA? (totalBenefBrut/totalCA)*100 : 0;
  let seuilRentabilite=margePct? chargesPourSeuil/(margePct/100) : 0;
  let nbJours=Math.max(1,Math.ceil((au-du)/86400000)+1);
  let seuilParJour=seuilRentabilite/nbJours;

  // Point journalier
  let byDay={};
  vPeriode.forEach(v=>{ let day=new Date(v.date).toLocaleDateString('fr-FR'); if(!byDay[day]) byDay[day]={day,ca:0,benef:0,nb:0,dep:0}; byDay[day].ca+=v.total||0; byDay[day].benef+=v.benefice||0; byDay[day].nb++; });
  depPeriode.forEach(d=>{ let day=new Date(d.date).toLocaleDateString('fr-FR'); if(!byDay[day]) byDay[day]={day,ca:0,benef:0,nb:0,dep:0}; byDay[day].dep+=d.montant||0; });

  let pointJ=`<table><tr><th>Jour</th><th>Nb</th><th>CA</th><th>Bénéf</th><th>Dép</th><th>Net</th></tr>`+Object.values(byDay).sort((a,b)=> new Date(a.day.split('/').reverse().join('-')) - new Date(b.day.split('/').reverse().join('-'))).map(d=>`<tr><td>${d.day}</td><td>${d.nb}</td><td>${d.ca.toLocaleString()}</td><td>${d.benef.toLocaleString()}</td><td>${d.dep.toLocaleString()}</td><td>${(d.benef-d.dep).toLocaleString()}</td></tr>`).join('')+`</table>`;

  let htmlSeuil=`<div class="card" style="border:3px solid #f59e0b;background:#fffbeb"><h4>📍 Seuil CORRIGÉ V4.9.10 - Base ${vals.length} x ${base.toLocaleString()} + Emprunt ${emprunt.toLocaleString()} ✅</h4><table><tr><th>Charge</th><th>Montant</th></tr><tr><td>Loyer</td><td>${loyer.toLocaleString()}</td></tr><tr><td>Autres Fixes</td><td>${autreFixe.toLocaleString()}</td></tr><tr><td>🏦 Emprunt</td><td><b>${emprunt.toLocaleString()}</b></td></tr><tr><td>👥 Bases (${vals.length} x ${base.toLocaleString()}) ✅ CORRIGÉ</td><td><b>${totalBase.toLocaleString()}</b></td></tr><tr><td>Dépenses</td><td>${totalDep.toLocaleString()}</td></tr><tr><td>Commissions</td><td>${totalCom.toLocaleString()}</td></tr><tr style="background:#111;color:#fff"><td>TOTAL</td><td><b>${chargesPourSeuil.toLocaleString()}</b></td></tr><tr><td>Marge</td><td>${margePct.toFixed(1)}%</td></tr><tr style="background:#dc2626;color:#fff"><td>🎯 OBJECTIF / JOUR</td><td><b style="font-size:20px">${seuilParJour.toLocaleString()} FC</b></td></tr></table></div>`;

  let htmlSal=`<div class="card"><h4>👥 Salaires ${vals.length} vendeurs - Base totale ${totalBase.toLocaleString()} FC ✅</h4><table><tr><th>Vendeur</th><th>CA</th><th>Bénéf</th><th>Salaire</th><th>Act</th></tr>${vals.map(v=>`<tr><td><b>${v.nom}</b></td><td>${v.ca.toLocaleString()}</td><td>${v.benefBrut.toLocaleString()}</td><td><b>${v.salaire.toLocaleString()}</b></td><td><button class="btn btn-r" style="width:auto;font-size:10px" onclick="toggleExclusCompta('${v.key}')">🚫 Exclure</button></td></tr>`).join('')||`<tr><td colspan=5>Aucun vendeur - CA Firebase: ${totalCA.toLocaleString()} FC - Vérifie dates</td></tr>`}</table></div>`;

  let htmlRep=`<div class="card"><h4>💰 Répartition - NET ${resultatNet.toLocaleString()} FC</h4><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><div style="background:#facc15;padding:12px;border-radius:12px;text-align:center">PRIME ${primePct}%<br><b>${(repart*(primePct/100)).toLocaleString()}</b><br>${meilleur?meilleur.nom:''}</div><div style="background:#0b5e2f;color:#fff;padding:12px;border-radius:12px;text-align:center">PATRON ${patronPct}%<br><b>${(repart*(patronPct/100)).toLocaleString()}</b></div><div style="background:#0ea5e9;color:#fff;padding:12px;border-radius:12px;text-align:center">DEV ${devPct}%<br><b>${(repart*(devPct/100)).toLocaleString()}</b></div></div></div>`;

  let totalEncaisse=vPeriode.reduce((s,v)=>s+(v.montantPaye!=null?v.montantPaye:v.total||0),0);
  let crHtml=`<table><tr><th>Poste</th><th>Montant</th></tr><tr><td>CA Firebase</td><td>${totalCA.toLocaleString()}</td></tr><tr><td>Marge</td><td>${totalBenefBrut.toLocaleString()} (${margePct.toFixed(1)}%)</td></tr><tr><td>- Dép</td><td>-${totalDep.toLocaleString()}</td></tr><tr><td>- Loyer+Fixes+Emprunt</td><td>-${(loyer+autreFixe+emprunt).toLocaleString()}</td></tr><tr><td>- Bases ${totalBase.toLocaleString()} ✅</td><td>-${totalBase.toLocaleString()}</td></tr><tr><td>- Com</td><td>-${totalCom.toLocaleString()}</td></tr><tr style="background:#111;color:#fff"><td>= NET</td><td><b>${resultatNet.toLocaleString()}</b></td></tr></table>`;

  let resEl=document.getElementById('comptaResult');
  if(resEl) resEl.innerHTML=htmlSal+htmlRep+htmlSeuil;
  let pj=document.getElementById('pointJournalier'); if(pj) pj.innerHTML=pointJ;
  let cr=document.getElementById('compteResultat'); if(cr) cr.innerHTML=crHtml;
  let tb=document.getElementById('tresorerieBox'); if(tb) tb.innerHTML=`<div style="background:#dcfce7;padding:10px;border-radius:10px">Encaissé: <b>${totalEncaisse.toLocaleString()}</b> | Charges: <b>${chargesPourSeuil.toLocaleString()} FC</b> | NET: <b style="color:${resultatNet>=0?'#0b5e2f':'red'}">${resultatNet.toLocaleString()}</b></div>`;
  let sb=document.getElementById('seuilBox'); if(sb) sb.innerHTML=`<div style="background:#fffbeb;padding:10px;border-radius:10px">Objectif/jour: <b style="font-size:18px;color:#dc2626">${seuilParJour.toLocaleString()} FC</b><br>Marge ${margePct.toFixed(1)}%<br>Seuil ${seuilRentabilite.toLocaleString()} vs CA ${totalCA.toLocaleString()} ${totalCA>=seuilRentabilite?'✅':'❌'}</div>`;

 }catch(e){
  console.error("calcCompta SAFE error", e);
  let r=document.getElementById('comptaResult');
  if(r) r.innerHTML=`<p style="color:red">Erreur Compta: ${e.message}</p>`;
 }
}

window.calcCompta = calcCompta;

// PDF COMPTA SAFE V8.27 - ne plante pas si comptaResult vide
export function pdfCompta(){
  try{
    let du = document.getElementById('cDu')?.value || '';
    let au = document.getElementById('cAu')?.value || '';
    let shop = (window.STATE?.SHOP || window.SHOP || localStorage.getItem('patron_shop') || 'Menkao1');
    
    let comptaHtml = document.getElementById('comptaResult')?.innerHTML || '<p>Aucun calcul - Clique CALCULER d\'abord</p>';
    let pointJ = document.getElementById('pointJournalier')?.innerHTML || '';
    let compteRes = document.getElementById('compteResultat')?.innerHTML || '';
    let tresor = document.getElementById('tresorerieBox')?.innerHTML || '';
    let seuil = document.getElementById('seuilBox')?.innerHTML || '';

    if(comptaHtml.includes('Choisis dates') || comptaHtml.includes('Aucun calcul')){
      alert('⚠️ Clique d\'abord sur 🔍 CALCULER avec Du/Au');
      return;
    }

    let w = window.open('','_blank','width=1100,height=800');
    if(!w){ alert('Pop-up bloqué - autorise les pop-ups'); return; }

    w.document.write(`
<html><head><meta charset="UTF-8"><title>COMPTA ${shop} ${du} au ${au}</title>
<style>
  body{font-family:Arial;font-size:12px;padding:20px}
  table{width:100%;border-collapse:collapse;margin:8px 0} 
  th,td{border:1px solid #000;padding:6px;font-size:11px;text-align:left} 
  th{background:#111;color:#fff}
  .card{border:1px solid #ddd;padding:10px;margin:10px 0;border-radius:8px}
  h2{border-bottom:3px solid #0b5e2f;padding-bottom:8px}
  @media print{.no-print{display:none}}
</style></head>
<body>
<h2>💼 COMPTA V4.9.10 EXACT - ${shop} - Du ${du} au ${au} - V8.27 SAFE</h2>
<div style="background:#111;color:#22c55e;padding:8px;border-radius:8px">Base totale + Emprunt inclus - Seuil corrigé ✅</div>

${comptaHtml}

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
  <div class="card"><h4>📅 Point Journalier</h4>${pointJ}</div>
  <div class="card"><h4>💧 Trésorerie</h4>${tresor}</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
  <div class="card"><h4>⚠️ Seuil</h4>${seuil}</div>
  <div class="card"><h4>📊 Compte Résultat</h4>${compteRes}</div>
</div>

<div class="no-print" style="text-align:center;margin-top:20px">
  <button onclick="window.print()" style="padding:12px 24px;background:#0b5e2f;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px">🖨️ IMPRIMER / PDF</button>
  <button onclick="window.close()" style="padding:12px 24px;background:#ef4444;color:#fff;border:none;border-radius:8px;margin-left:10px;cursor:pointer">Fermer</button>
</div>

<div style="text-align:center;font-size:10px;color:#888;margin-top:20px">
  Généré le ${new Date().toLocaleString('fr-FR')} - ${shop} - V8.27 SAFE
</div>
</body></html>`);
    w.document.close();
  }catch(e){
    console.error('pdfCompta SAFE error', e);
    alert('Erreur PDF: '+e.message);
  }
}

window.pdfCompta = pdfCompta;
console.log('✅ PDF COMPTA V8.27 SAFE chargé');
