// VERSION SAFE CORRIGÉE - V4.9.14 - CA UNIQUE = v.total + Période 1er -> Aujourd'hui locale + Fix Remise + Fix Loyer

// SAUVEGARDE CONFIG COMPTA
function IA_saveComptaConfig(cfg){
  try{ localStorage.setItem('menkao_compta_config', JSON.stringify(cfg)); }catch(e){}
}
function IA_loadComptaConfig(){
  try{
    let c = JSON.parse(localStorage.getItem('menkao_compta_config') || 'null');
    if(!c) return;
    Object.keys(c).forEach(function(id){
      let el = document.getElementById(id);
      if(el && c[id] !== undefined && c[id] !== '') el.value = c[id];
    });
  }catch(e){}
}
// CORRECTION V4.9.14 DG : Période par défaut 1er du mois en cours -> Aujourd'hui, en heure LOCALE, pas UTC
function IA_fmtLocal(d){
  let y = d.getFullYear();
  let m = String(d.getMonth()+1).padStart(2,'0');
  let j = String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+j;
}
function IA_setPeriodeDefaut(){
  let duEl=document.getElementById('cDu'), auEl=document.getElementById('cAu');
  if(!duEl||!auEl) return;
  let now = new Date();
  let premier = new Date(now.getFullYear(), now.getMonth(), 1);
  // Si champ vide OU si c'est une ancienne valeur qui traîne, on remet 1er -> Aujourd'hui au premier chargement
  // On ne force que si vide, pour respecter ton choix manuel après
  if(!duEl.value) duEl.value = IA_fmtLocal(premier);
  if(!auEl.value) auEl.value = IA_fmtLocal(now);
}
function IA_initCompta(){
  IA_loadComptaConfig();
  IA_setPeriodeDefaut();
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', IA_initCompta);
} else {
  IA_initCompta();
}
// Boutons période : toujours 1er -> Aujourd'hui pour "Ce mois"
window.setPeriode = function(type){
  let now = new Date();
  let duEl=document.getElementById('cDu'), auEl=document.getElementById('cAu');
  if(!duEl||!auEl) return;
  if(type==='mois'){
    duEl.value = IA_fmtLocal(new Date(now.getFullYear(), now.getMonth(), 1));
    auEl.value = IA_fmtLocal(now);
  } else if(type==='moisPasse'){
    let debut = new Date(now.getFullYear(), now.getMonth()-1, 1);
    let fin = new Date(now.getFullYear(), now.getMonth(), 0);
    duEl.value = IA_fmtLocal(debut);
    auEl.value = IA_fmtLocal(fin);
  } else if(type==='aujourdhui'){
    duEl.value = IA_fmtLocal(now);
    auEl.value = IA_fmtLocal(now);
  }
};

export function calcCompta(){
 try{
  let duEl=document.getElementById('cDu'), auEl=document.getElementById('cAu');
  if(!duEl||!auEl){ console.log("cDu/cAu manquant"); return; }
  // Si vide, on remet 1er -> Aujourd'hui en local
  if(!duEl.value || !auEl.value){
    let now = new Date();
    if(!duEl.value) duEl.value = IA_fmtLocal(new Date(now.getFullYear(), now.getMonth(), 1));
    if(!auEl.value) auEl.value = IA_fmtLocal(now);
  }
  // CORRECTION : On parse en heure locale, pas UTC. '2026-11-01T00:00:00'
  let du=new Date(duEl.value+'T00:00:00'), au=new Date(auEl.value+'T23:59:59');
  if(isNaN(du.getTime())||isNaN(au.getTime())){
    let r=document.getElementById('comptaResult');
    if(r) r.innerHTML='<p style="color:red">Choisis dates Du/Au valides</p>';
    return;
  }

  let data;
  try{ data = (typeof getFiltered==='function' ? getFiltered() : window.getFiltered?.()); }catch(e){ data=null; }
  if(!data) data = {ventes:[], dep:[], stock:[], shop: window.SHOP||'Menkao1'};
  if(!data.ventes) data.ventes=[];
  if(!data.dep) data.dep=[];
  if(!data.stock) data.stock=[];

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

  IA_saveComptaConfig({cBase:base, cCom:comPct, cLoyer:loyer, cAutresFixe:autreFixe, cEmprunt:emprunt, cPrime:primePct, cPatron:patronPct, cDev:devPct});

  let exclus = window.CURRENT_CONFIG?.compta?.exclus || [];

  let vPeriode=(data.ventes||[]).filter(v=>{ let d=new Date(v.date); return d>=du&&d<=au; });
  let depPeriode=(data.dep||[]).filter(d=>{ let dt=new Date(d.date); return dt>=du&&dt<=au; });

  let parVendeur={};
  let totalCAComptoir = 0;
  vPeriode.forEach(v=>{
    let nomRaw=(v.vendeurNom||v.vendeur||'Inconnu').trim();
    // CORRECTION V4.9.14 : Comptoir compté à part, pour que la somme Vendeurs + Comptoir = CA Firebase
    if(!nomRaw || nomRaw.toLowerCase()==='comptoir'){
      totalCAComptoir += (v.total||0);
      return;
    }
    let key=nomRaw.toLowerCase().replace(/\s+/g,'').replace(/[^a-z]/g,'');
    if(!key) key=nomRaw.toLowerCase();
    if(exclus.includes(key)) return;
    if(!parVendeur[key]) parVendeur[key]={key:key,nom:nomRaw,qty:0,ca:0,benefBrut:0,commission:0,salaire:0,countVentes:0};
    parVendeur[key].countVentes++;
    // CORRECTION CA UNIQUE : CA = v.total, pas somme articles
    let caVente = v.total || 0;
    let caItems = 0;
    let benefItems = 0;
    (v.items||[]).forEach(i=>{
      let pa=fullMap[i.CODE]?.['Prix Achat']||0;
      parVendeur[key].qty+=i.qty||0;
      caItems += (i.qty||0)*(i.Prix||0);
      benefItems += (i.qty||0)*((i.Prix||0)-pa);
    });
    // Si remise : caItems > v.total, on enlève la remise de la marge aussi, sinon la marge est gonflée
    let remise = (caVente>0 && caItems>0) ? (caItems - caVente) : 0;
    parVendeur[key].ca += caVente;
    parVendeur[key].benefBrut += (benefItems - remise);
  });

  let vals=Object.values(parVendeur);
  vals.forEach(v=>{ v.commission=v.benefBrut*(comPct/100); v.salaire=base+v.commission; });

  // CA UNIQUE : tout le monde doit afficher celui-ci
  let totalCA=vPeriode.reduce((s,v)=>s+(v.total||0),0);
  let totalCAVendeurs=vals.reduce((s,v)=>s+v.ca,0);
  // Marge = somme des marges corrigées des vendeurs. Si pas de vendeur, on prend v.benefice
  let totalBenefBrut=vals.reduce((s,v)=>s+v.benefBrut,0);
  if(vals.length===0) totalBenefBrut=vPeriode.reduce((s,v)=>s+(v.benefice||0),0);
  let coutMarchandise = totalCA - totalBenefBrut;
  // Note : coutMarchandise ici est sur tout le CA, y compris Comptoir. C'est voulu pour le Compte Résultat.
  // Pour le Seuil, on garde la marge des vendeurs, comme avant.
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

  let byDay={};
  vPeriode.forEach(v=>{ let day=new Date(v.date).toLocaleDateString('fr-FR'); if(!byDay[day]) byDay[day]={day,ca:0,benef:0,nb:0,dep:0}; byDay[day].ca+=v.total||0; byDay[day].benef+=v.benefice||0; byDay[day].nb++; });
  depPeriode.forEach(d=>{ let day=new Date(d.date).toLocaleDateString('fr-FR'); if(!byDay[day]) byDay[day]={day,ca:0,benef:0,nb:0,dep:0}; byDay[day].dep+=d.montant||0; });

  let pointJ=`<table><tr><th>Jour</th><th>Nb</th><th>CA</th><th>Bénéf</th><th>Dép</th><th>Net</th></tr>`+Object.values(byDay).sort((a,b)=> new Date(a.day.split('/').reverse().join('-')) - new Date(b.day.split('/').reverse().join('-'))).map(d=>`<tr><td>${d.day}</td><td>${d.nb}</td><td>${d.ca.toLocaleString()}</td><td>${d.benef.toLocaleString()}</td><td>${d.dep.toLocaleString()}</td><td>${(d.benef-d.dep).toLocaleString()}</td></tr>`).join('')+`</table>`;

  let htmlSeuil=`<div class="card" style="border:3px solid #f59e0b;background:#fffbeb"><h4>📍 Seuil CORRIGÉ V4.9.14 - Base ${vals.length} x ${base.toLocaleString()} + Emprunt ${emprunt.toLocaleString()} ✅</h4><table><tr><th>Charge</th><th>Montant</th></tr><tr><td>🛒 Coût d'achat marchandise (CA - Marge)</td><td><b>${coutMarchandise.toLocaleString()}</b></td></tr><tr><td>Loyer</td><td>${loyer.toLocaleString()}</td></tr><tr><td>Autres Fixes</td><td>${autreFixe.toLocaleString()}</td></tr><tr><td>🏦 Emprunt</td><td><b>${emprunt.toLocaleString()}</b></td></tr><tr><td>👥 Bases (${vals.length} x ${base.toLocaleString()}) ✅ CORRIGÉ</td><td><b>${totalBase.toLocaleString()}</b></td></tr><tr><td>Dépenses</td><td>${totalDep.toLocaleString()}</td></tr><tr><td>Commissions</td><td>${totalCom.toLocaleString()}</td></tr><tr style="background:#111;color:#fff"><td>TOTAL CHARGES (hors achat)</td><td><b>${chargesPourSeuil.toLocaleString()}</b></td></tr><tr style="background:#0b5e2f;color:#fff"><td>TOTAL COMPLET (avec achat marchandise)</td><td><b>${(chargesPourSeuil + coutMarchandise).toLocaleString()}</b></td></tr><tr><td>Marge</td><td>${margePct.toFixed(1)}%</td></tr><tr style="background:#dc2626;color:#fff"><td>🎯 OBJECTIF / JOUR</td><td><b style="font-size:20px">${seuilParJour.toLocaleString()} FC</b></td></tr></table></div>`;

  // CORRECTION : On affiche le contrôle CA pour que tu voies que ça colle
  let htmlSal=`<div class="card"><h4>👥 Salaires ${vals.length} vendeurs - Base totale ${totalBase.toLocaleString()} FC ✅</h4><div style="background:#dcfce7;padding:8px;border-radius:8px;margin-bottom:8px">CA Vendeurs: <b>${totalCAVendeurs.toLocaleString()}</b> + Comptoir: <b>${totalCAComptoir.toLocaleString()}</b> = CA Total: <b>${totalCA.toLocaleString()} FC</b> ✅ UNIQUE</div><table><tr><th>Vendeur</th><th>CA (v.total)</th><th>Bénéf</th><th>Salaire</th><th>Act</th></tr>${vals.map(v=>`<tr><td><b>${v.nom}</b></td><td>${v.ca.toLocaleString()}</td><td>${v.benefBrut.toLocaleString()}</td><td><b>${v.salaire.toLocaleString()}</b></td><td><button class="btn btn-r" style="width:auto;font-size:10px" onclick="toggleExclusCompta('${v.key}')">🚫 Exclure</button></td></tr>`).join('')||`<tr><td colspan=5>Aucun vendeur - CA Firebase: ${totalCA.toLocaleString()} FC - Vérifie dates</td></tr>`}</table></div>`;

  let htmlRep=`<div class="card"><h4>💰 Répartition - NET ${resultatNet.toLocaleString()} FC</h4><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><div style="background:#facc15;padding:12px;border-radius:12px;text-align:center">PRIME ${primePct}%<br><b>${(repart*(primePct/100)).toLocaleString()}</b><br>${meilleur?meilleur.nom:''}</div><div style="background:#0b5e2f;color:#fff;padding:12px;border-radius:12px;text-align:center">PATRON ${patronPct}%<br><b>${(repart*(patronPct/100)).toLocaleString()}</b></div><div style="background:#0ea5e9;color:#fff;padding:12px;border-radius:12px;text-align:center">DEV ${devPct}%<br><b>${(repart*(devPct/100)).toLocaleString()}</b></div></div></div>`;

  let totalEncaisse=vPeriode.reduce((s,v)=>s+(v.montantPaye!=null?v.montantPaye:v.total||0),0);
  let crHtml=`<table><tr><th>Poste</th><th>Montant</th></tr><tr><td>CA Firebase (v.total) - UNIQUE</td><td>${totalCA.toLocaleString()}</td></tr><tr><td>🛒 Coût d'achat marchandise</td><td>-${coutMarchandise.toLocaleString()}</td></tr><tr><td>Marge</td><td>${totalBenefBrut.toLocaleString()} (${margePct.toFixed(1)}%)</td></tr><tr><td>- Dép</td><td>-${totalDep.toLocaleString()}</td></tr><tr><td>- Loyer+Fixes+Emprunt</td><td>-${(loyer+autreFixe+emprunt).toLocaleString()}</td></tr><tr><td>- Bases ${totalBase.toLocaleString()} ✅</td><td>-${totalBase.toLocaleString()}</td></tr><tr><td>- Com</td><td>-${totalCom.toLocaleString()}</td></tr><tr style="background:#111;color:#fff"><td>= NET</td><td><b>${resultatNet.toLocaleString()}</b></td></tr></table>`;

  let resEl=document.getElementById('comptaResult');
  if(resEl) resEl.innerHTML=htmlSal+htmlRep+htmlSeuil;
  let pj=document.getElementById('pointJournalier'); if(pj) pj.innerHTML=pointJ;
  let cr=document.getElementById('compteResultat'); if(cr) cr.innerHTML=crHtml;
  let tb=document.getElementById('tresorerieBox'); if(tb) tb.innerHTML=`<div style="background:#dcfce7;padding:10px;border-radius:10px">Encaissé: <b>${totalEncaisse.toLocaleString()}</b> | Charges: <b>${chargesPourSeuil.toLocaleString()} FC</b> | NET: <b style="color:${resultatNet>=0?'#0b5e2f':'red'}">${resultatNet.toLocaleString()}</b></div>`;
  let sb=document.getElementById('seuilBox'); if(sb) sb.innerHTML=`<div style="background:#fffbeb;padding:10px;border-radius:10px">Objectif/jour: <b style="font-size:18px;color:#dc2626">${seuilParJour.toLocaleString()} FC</b><br>Marge ${margePct.toFixed(1)}%<br>Seuil ${seuilRentabilite.toLocaleString()} vs CA ${totalCA.toLocaleString()} ${totalCA>=seuilRentabilite?'✅':'❌'}</div>`;

  // CORRECTION V4.9.14 : On NE vide PLUS les champs. On recharge les valeurs sauvegardées pour que Loyer reste visible.
  IA_loadComptaConfig();

 }catch(e){
  console.error("calcCompta SAFE error", e);
  let r=document.getElementById('comptaResult');
  if(r) r.innerHTML=`<p style="color:red">Erreur Compta: ${e.message}</p>`;
 }
}
window.calcCompta = calcCompta;

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
<h2>💼 COMPTA V4.9.14 - ${shop} - Du ${du} au ${au} - CA UNIQUE v.total</h2>
<div style="background:#111;color:#22c55e;padding:8px;border-radius:8px">CA UNIQUE = v.total - Période 1er -> Aujourd'hui ✅</div>
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
  Généré le ${new Date().toLocaleString('fr-FR')} - ${shop} - V4.9.14
</div>
</body></html>`);
    w.document.close();
  }catch(e){
    console.error('pdfCompta SAFE error', e);
    alert('Erreur PDF: '+e.message);
  }
}
window.pdfCompta = pdfCompta;

window.saveComptaParams = function(){
  let old = {};
  try{ old = JSON.parse(localStorage.getItem('menkao_compta_config') || '{}'); }catch(e){ old = {}; }
  let get = function(id, def){
    let el = document.getElementById(id);
    if(el && el.value !== '' && el.value != null) return el.value;
    return old[id] !== undefined ? old[id] : def;
  };
  let cfg = {
    cBase: get('cBase', 50000),
    cCom: get('cCom', 10),
    cLoyer: get('cLoyer', 100000),
    cAutresFixe: get('cAutresFixe', 0),
    cEmprunt: get('cEmprunt', 0),
    cPrime: get('cPrime', 25),
    cPatron: get('cPatron', 45),
    cDev: get('cDev', 30)
  };
  IA_saveComptaConfig(cfg);
  IA_loadComptaConfig();
  let s = document.getElementById('comptaParamStatus');
  if(s) s.textContent = '✅ Sauvegardé - Loyer ' + Number(cfg.cLoyer).toLocaleString() + ' FC';
};
console.log('✅ COMPTA V4.9.14 CA UNIQUE chargé');
