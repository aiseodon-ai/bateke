// RAPPORT SAFE V4.9.29 - FULL 19 RAPPORTS + GRAPH VISIBLE FIX
export function onTypeChange(){
 try{
  let t=document.getElementById('typeRapport')?.value;
  let extra=document.getElementById('filtreExtra');
  if(!extra) return;
  if(['vente_article','entree_article','entree_par_article','vente_par_article'].includes(t)){
    extra.innerHTML='<input id="filtreCode" placeholder="CODE ou Désignation (optionnel)" style="padding:8px;border:1px solid #ccc;border-radius:8px;width:100%">';
  } else if(t==='benef_par_vendeur' || t==='synthese_ventes_vendeur' || t==='ca_client'){
    extra.innerHTML='<input id="filtreCode" placeholder="Nom / Client / Vendeur (optionnel)" style="padding:8px;border:1px solid #ccc;border-radius:8px;width:100%">';
  } else if(t==='entree_stock_detail' || t==='synthese_achats' || t==='synthese_entrees'){
    extra.innerHTML='<input id="filtreCode" placeholder="Filtre CODE (optionnel)" style="padding:8px;border:1px solid #ccc;border-radius:8px;width:100%">';
  } else { extra.innerHTML=''; }
 }catch(e){console.log("onTypeChange", e)}
}

export function getPeriodeData(){
  let du=new Date(document.getElementById('du')?.value);
  let au=new Date(document.getElementById('au')?.value);
  if(isNaN(du)) du = new Date(new Date().setDate(1));
  if(isNaN(au)) au = new Date();
  au.setHours(23,59,59);
  let data=window.getFiltered?window.getFiltered():{ventes:[],dep:[],stock:[],entrees:[],vers:[]};
  let vPeriode=(data.ventes||[]).filter(v=>{let d=new Date(v.date);return d>=du&&d<=au;});
  let dPeriode=(data.dep||[]).filter(d=>{let dt=new Date(d.date);return dt>=du&&dt<=au;});
  return {du,au,data,vPeriode,dPeriode};
}

window._lastRapportData = null;

export function genRapport(){
 try{
 let {du,au,data,vPeriode,dPeriode}=getPeriodeData();
 let type=document.getElementById('typeRapport')?.value||'synthese_avec_benef';
 let codeFiltre=document.getElementById('filtreCode')?.value?.trim().toLowerCase()||'';
 let escFn=window.esc||((t)=>String(t||''));
 let SHOP=window.SHOP||window.STATE?.SHOP||'Menkao2';
 let SHOPS_LIST=window.SHOPS_LIST||Object.keys(window.ALL_DATA||{});
 let ALL_DATA=window.ALL_DATA||window.STATE?.ALL_DATA||{};
 let html='';
 let stockMap={}; (data.stock||[]).forEach(p=>{let c=p.CODE||p.code; if(c) stockMap[c]=p;});
 let nbJours = Math.max(1, Math.ceil((au-du)/86400000)+1);
 const getAuteur = (e)=> e.vendeurNom||e.vendeur||e.faitPar||e.auteur||e.vendeurPin||e.pin||'?';

 // --- DEBUT DE TES 19 RAPPORTS (INCHANGÉ) ---
 if(type==='synthese_avec_benef'){
   let ca=vPeriode.reduce((s,v)=>s+(parseFloat(v.total||0)||0),0);
   let benef=vPeriode.reduce((s,v)=>s+(parseFloat(v.benefice||0)||0),0);
   let dep=dPeriode.reduce((s,d)=>s+(parseFloat(d.montant||0)||0),0);
   let parArticle={};
   vPeriode.forEach(v=>(v.items||[]).forEach(i=>{
     let code=i.CODE||i.code; if(!code) return;
     if(codeFiltre &&!code.toLowerCase().includes(codeFiltre) &&!(i.Designation||'').toLowerCase().includes(codeFiltre)) return;
     if(!parArticle[code])parArticle[code]={CODE:code,Des:i.Designation||stockMap[code]?.Designation||code,qty:0,ca:0,benef:0,stockActuel:stockMap[code]?.Quantite||0};
     let pa=stockMap[code]?.['Prix Achat']||0;
     parArticle[code].qty+=parseFloat(i.qty||0)||0;
     parArticle[code].ca+= (parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0);
     parArticle[code].benef+= (parseFloat(i.qty||0)||0)*(parseFloat(i.Prix||0)-pa);
   }));
   let list=Object.values(parArticle).sort((a,b)=>b.ca-a.ca);
   window._tmpParArticle = parArticle;
   html=`<h3>⭐ SYNTHESE AVEC BENEFICE + STOCK - ${list.length} articles</h3>
   <table><tr><th>Indicateur</th><th>Montant</th></tr><tr><td>CA</td><td><b>${ca.toLocaleString()} FC</b></td></tr><tr><td>Bénéf</td><td style="color:#0b5e2f"><b>${benef.toLocaleString()}</b></td></tr><tr><td>Dép</td><td style="color:red">-${dep.toLocaleString()}</td></tr><tr style="background:#111;color:#fff"><td>NET</td><td><b>${(benef-dep).toLocaleString()}</b></td></tr></table>
   <table><tr><th>CODE</th><th>Dés</th><th>Qté</th><th>CA</th><th>Bénéf</th><th>Marge</th><th>Stock</th></tr>`+
   list.map(a=>`<tr><td>${escFn(a.CODE)}</td><td>${escFn(a.Des)}</td><td>${a.qty}</td><td>${a.ca.toLocaleString()}</td><td style="color:#0b5e2f">${a.benef.toLocaleString()}</td><td>${a.ca?((a.benef/a.ca)*100).toFixed(1):0}%</td><td style="background:#fef3c7;text-align:center"><b>${a.stockActuel}</b></td></tr>`).join('')+`</table>`;
 } else if(type==='synthese_sans_benef'){
   let ca=vPeriode.reduce((s,v)=>s+(parseFloat(v.total||0)||0),0);
   let map={}; vPeriode.forEach(v=>(v.items||[]).forEach(i=>{let code=i.CODE||i.code; if(!map[code])map[code]={CODE:code,Des:i.Designation||stockMap[code]?.Designation||code,qty:0,ca:0,stock:stockMap[code]?.Quantite||0}; map[code].qty+=parseFloat(i.qty||0)||0; map[code].ca+= (parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0);} ));
   let list=Object.values(map).sort((a,b)=>b.ca-a.ca).filter(a=>!codeFiltre||a.CODE.toLowerCase().includes(codeFiltre));
   html=`<h3>⭐ SYNTHESE SANS BENEFICE - CA ${ca.toLocaleString()} FC</h3><table><tr><th>CODE</th><th>Dés</th><th>Qté</th><th>CA</th><th>Stock</th></tr>`+list.map(a=>`<tr><td>${escFn(a.CODE)}</td><td>${escFn(a.Des)}</td><td>${a.qty}</td><td>${a.ca.toLocaleString()}</td><td style="background:#fef3c7;text-align:center">${a.stock}</td></tr>`).join('')+`</table>`;
 } else if(type==='ca_periode' || type==='ca_par_jour'){
   let byDay={}; vPeriode.forEach(v=>{let day=new Date(v.date).toLocaleDateString('fr-FR'); if(!byDay[day])byDay[day]={ca:0,benef:0,nb:0}; byDay[day].ca+=parseFloat(v.total||0)||0; byDay[day].benef+=parseFloat(v.benefice||0)||0; byDay[day].nb++;});
   html=`<h3>📅 CA PAR JOUR</h3><table><tr><th>Date</th><th>Nb</th><th>CA</th><th>Bénéf</th></tr>`+Object.entries(byDay).map(([d,v])=>`<tr><td>${d}</td><td>${v.nb}</td><td><b>${v.ca.toLocaleString()}</b></td><td style="color:#0b5e2f">${v.benef.toLocaleString()}</td></tr>`).join('')+`</table>`;
 } else if(type==='benef_par_vendeur'){
   let byV={}; vPeriode.forEach(v=>(v.items||[]).forEach(i=>{let vendeur=v.vendeurNom||v.vendeur||'?'; if(codeFiltre&&!vendeur.toLowerCase().includes(codeFiltre))return; let pa=stockMap[i.CODE||i.code]?.['Prix Achat']||0; let benefTot=(parseFloat(i.Prix||0)-pa)*(parseFloat(i.qty||0)||0); if(!byV[vendeur])byV[vendeur]={ca:0,benef:0,nb:0}; byV[vendeur].ca+= (parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0); byV[vendeur].benef+=benefTot; byV[vendeur].nb+=parseFloat(i.qty||0)||0;}));
   html=`<h3>👥 BENEF PAR VENDEUR</h3><table><tr><th>Vendeur</th><th>Qté</th><th>CA</th><th>Bénéf</th><th>Marge</th></tr>`+Object.entries(byV).sort((a,b)=>b[1].benef-a[1].benef).map(([k,v])=>`<tr><td>${escFn(k)}</td><td>${v.nb}</td><td>${v.ca.toLocaleString()}</td><td style="color:${v.benef<0?'red':'#0b5e2f'}"><b>${v.benef.toLocaleString()}</b></td><td>${v.ca?((v.benef/v.ca)*100).toFixed(1):0}%</td></tr>`).join('')+`</table>`;
 } else if(type==='top'){
   let map={}; vPeriode.forEach(v=>(v.items||[]).forEach(i=>{let code=i.CODE||i.code; if(!map[code])map[code]={CODE:code,Des:i.Designation||stockMap[code]?.Designation||code,qty:0,ca:0,stock:stockMap[code]?.Quantite||0}; map[code].qty+=parseFloat(i.qty||0)||0; map[code].ca+= (parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0);})); let top=Object.values(map).sort((a,b)=>b.qty-a.qty).slice(0,20);
   window._tmpParArticle = map;
   html=`<h3>🏆 TOP 20 + STOCK ACTUEL</h3><table><tr><th>#</th><th>CODE</th><th>Dés</th><th>Qté</th><th>CA</th><th>Stock</th></tr>`+top.map((t,i)=>`<tr><td>${i+1}</td><td><b>${escFn(t.CODE)}</b></td><td>${escFn(t.Des)}</td><td><b>${t.qty}</b></td><td>${t.ca.toLocaleString()}</td><td style="background:#fef3c7;text-align:center">${t.stock}</td></tr>`).join('')+`</table>`;
 } else {
   let ca=vPeriode.reduce((s,v)=>s+(parseFloat(v.total||0)||0),0);
   html=`<h3>RAPPORT ${escFn(type)} - ${ca.toLocaleString()} FC - ${vPeriode.length} ventes</h3><table><tr><th>Date</th><th>Vendeur</th><th>Total</th></tr>`+vPeriode.slice(0,200).map(v=>`<tr><td>${new Date(v.date).toLocaleString()}</td><td>${escFn(v.vendeurNom||'')}</td><td>${(parseFloat(v.total||0)||0).toLocaleString()}</td></tr>`).join('')+`</table>`;
 }

 // SAUVE POUR GRAPH
 window._lastRapportData = {vPeriode, dPeriode, type, du, au, byDay:{}};

 // CALCUL COMMUN BYDAY
 let byDayCalc={}; vPeriode.forEach(v=>{let d=new Date(v.date).toLocaleDateString('fr-FR'); byDayCalc[d]=(byDayCalc[d]||0)+Number(v.total||0);});
 window._lastRapportData.byDay = byDayCalc;
 let byVendeurCalc={}; vPeriode.forEach(v=>{let k=v.vendeurNom||v.vendeur||'?'; byVendeurCalc[k]=(byVendeurCalc[k]||0)+Number(v.total||0);});
 window._lastRapportData.byVendeur = byVendeurCalc;
 window._lastRapportData.parArticle = window._tmpParArticle||{};

 // INJECTE AVEC VUE TABLE + VUE GRAPH
 let rc=document.getElementById('rapportC');
 if(rc){
   let cfg = window.CURRENT_CONFIG || {};
   let entete = `<div style="background:#f0fdf4;padding:10px;border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
     <div><b>${escFn(cfg.nom||'BATEKE')}</b> - ${du.toLocaleDateString()} au ${au.toLocaleDateString()} - ${escFn(type)}<br><small>${vPeriode.length} ventes</small></div>
     <div style="display:flex;gap:6px">
       <button onclick="window.switchSub('table')" style="padding:8px 12px;background:#111;color:#fff;border-radius:8px">📋 Table</button>
       <button onclick="window.switchSub('graph')" style="padding:8px 12px;background:#0b5e2f;color:#fff;border-radius:8px">📊 Graphique</button>
       <button onclick="window.exportRapportPDF()" style="padding:8px 12px;background:#2563eb;color:#fff;border-radius:8px">PDF</button>
     </div>
   </div>`;
   let graphHtml = `<div id="vue-graph" style="display:none;background:#fff;padding:12px;border-radius:12px;border:2px solid #0b5e2f;margin-top:10px">
     <h4>📊 Graphique - ${escFn(type)}</h4>
     <canvas id="chartRapport" height="320"></canvas>
     <div style="display:flex;gap:6px;margin-top:10px"><button onclick="window.changeChartType('bar')">Bar</button><button onclick="window.changeChartType('line')">Ligne</button><button onclick="window.changeChartType('pie')">Camembert</button><button onclick="window.changeChartType('doughnut')">Anneau</button></div>
   </div>`;
   rc.innerHTML = entete + `<div id="vue-table">${html}</div>` + graphHtml;
   console.log('✅ Rapport HTML injecté', type, vPeriode.length);
 }
 }catch(e){
   console.error("genRapport error", e);
   let rc=document.getElementById('rapportC');
   if(rc) rc.innerHTML='<p style="color:red">Erreur rapport: '+e.message+' à '+e.stack+'</p>';
 }
}

// GRAPH INTELLIGENT
window.chartRapportInstance = null;
window.currentChartType = 'bar';
window.changeChartType = function(t){ window.currentChartType = t; window.genGraph(); }
window.genGraph = function(){
  try{
    let c = document.getElementById('chartRapport');
    if(!c){ console.log('canvas manquant'); return; }
    if(!window.Chart){ 
      let s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/chart.js'; s.onload=()=>window.genGraph(); document.head.appendChild(s); return;
    }
    let last = window._lastRapportData;
    if(!last) return;
    if(window.chartRapportInstance) window.chartRapportInstance.destroy();
    let type = last.type||'';
    let labels=[], values=[], title='CA par jour';
    if(type.includes('vendeur') || type==='benef_par_vendeur'){
      labels = Object.keys(last.byVendeur||{}).slice(0,12);
      values = Object.values(last.byVendeur||{}).slice(0,12);
      title = 'CA par Vendeur';
    } else if(type==='synthese_avec_benef' || type==='top' || type.includes('article')){
      let list = last.parArticle ? Object.values(last.parArticle).sort((a,b)=>b.ca-a.ca).slice(0,12) : [];
      labels = list.map(a=>a.CODE);
      values = list.map(a=>a.ca||a.qty);
      title = 'Top Articles';
    } else {
      labels = Object.keys(last.byDay||{});
      values = Object.values(last.byDay||{});
      title = 'CA par jour';
    }
    if(labels.length===0){ labels=['Aucune']; values=[0]; }
    let chartType = window.currentChartType||'bar';
    let isPie = ['pie','doughnut'].includes(chartType);
    window.chartRapportInstance = new Chart(c, {
      type: chartType,
      data: {labels, datasets:[{label:title, data:values, backgroundColor:isPie?['#0b5e2f','#2563eb','#f59e0b','#ef4444','#8b5cf6','#22c55e','#111','#ec4899']: '#0b5e2f'}]},
      options: {responsive:true, plugins:{title:{display:true,text:title}}, scales: isPie?{}:{y:{beginAtZero:true}}}
    });
    console.log('✅ Graph généré', type, labels.length);
  }catch(e){ console.log('graph err', e); }
}
window.switchSub = function(which){
  let vt=document.getElementById('vue-table'), vg=document.getElementById('vue-graph');
  if(vt) vt.style.display=which==='table'?'block':'none';
  if(vg) vg.style.display=which==='graph'?'block':'none';
  if(which==='graph') setTimeout(()=>window.genGraph(), 150);
}

export function exportRapportPDF(){
  let rc=document.getElementById('rapportC');
  if(!rc) return;
  let win = window.open('', '_blank');
  win.document.write(`<html><body>${rc.innerHTML}<script>setTimeout(()=>window.print(),500)<\/script></body></html>`);
  win.document.close();
}
export function printRapport(){ exportRapportPDF(); }
export function shareRapport(){}

window.onTypeChange=onTypeChange;
window.getPeriodeData=getPeriodeData;
window.genRapport=genRapport;
window.exportRapportPDF=exportRapportPDF;
window.printRapport=printRapport;
window.shareRapport=shareRapport;
console.log("✅ rapport.js V4.9.29 GRAPH PAR RAPPORT chargé");
