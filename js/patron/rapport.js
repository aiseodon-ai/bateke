// RAPPORT SAFE V4.9.35 - FULL 19 RAPPORTS STABLE + GRAPH X/Y FIX SYNTAX BLOCKER
export function onTypeChange(){
 try{
  let t=document.getElementById('typeRapport')?.value;
  let extra=document.getElementById('filtreExtra');
  if(!extra) return;
  if(['vente_article','entree_article'].includes(t)){
    extra.innerHTML='<input id="filtreCode" placeholder="CODE ou Désignation" style="padding:8px;border:1px solid #ccc;border-radius:8px;width:100%">';
  } else if(t==='benef_par_vendeur' || t==='synthese_ventes_vendeur' || t==='ca_client'){
    extra.innerHTML='<input id="filtreCode" placeholder="Nom / Client / Vendeur" style="padding:8px;border:1px solid #ccc;border-radius:8px;width:100%">';
  } else { extra.innerHTML=''; }
 }catch(e){}
}
export function getPeriodeData(){
  let duEl=document.getElementById('du'), auEl=document.getElementById('au');
  let du = duEl?.value ? new Date(duEl.value) : new Date(new Date().setDate(1));
  let au = auEl?.value ? new Date(auEl.value) : new Date();
  if(isNaN(du)) du=new Date(new Date().setDate(1)); if(isNaN(au)) au=new Date();
  au.setHours(23,59,59); du.setHours(0,0,0);
  let data=window.getFiltered?window.getFiltered():{ventes:[],dep:[],stock:[],entrees:[],vers:[]};
  let vPeriode=(data.ventes||[]).filter(v=>{let d=new Date(v.date);return d>=du&&d<=au;});
  let dPeriode=(data.dep||[]).filter(d=>{let dt=new Date(d.date);return dt>=du&&dt<=au;});
  return {du,au,data,vPeriode,dPeriode};
}
window._lastRapportData=null;
export function genRapport(){
 try{
 let {du,au,data,vPeriode,dPeriode}=getPeriodeData();
 let type=document.getElementById('typeRapport')?.value||'synthese_avec_benef';
 let codeFiltre=document.getElementById('filtreCode')?.value?.trim().toLowerCase()||'';
 let escFn=window.esc||((t)=>String(t||''));
 let SHOP=window.SHOP||window.STATE?.SHOP||'Menkao2';
 let SHOPS_LIST=window.SHOPS_LIST||Object.keys(window.ALL_DATA||{});
 let ALL_DATA=window.ALL_DATA||window.STATE?.ALL_DATA||{};
 let html=''; let stockMap={}; (data.stock||[]).forEach(p=>{let c=p.CODE||p.code; if(c) stockMap[c]=p;});
 let nbJours = Math.max(1, Math.ceil((au-du)/86400000)+1);
 const getAuteur = (e)=> e.vendeurNom||e.vendeur||e.faitPar||e.auteur||'?';
 let _tmpParArticle={}, _tmpByV={}, _tmpByDay={};
 if(type==='synthese_avec_benef'){
   let ca=vPeriode.reduce((s,v)=>s+(parseFloat(v.total||0)||0),0); let benef=vPeriode.reduce((s,v)=>s+(parseFloat(v.benefice||0)||0),0); let dep=dPeriode.reduce((s,d)=>s+(parseFloat(d.montant||0)||0),0);
   let parArticle={}; vPeriode.forEach(v=>(v.items||[]).forEach(i=>{let code=i.CODE||i.code; if(!code) return; if(codeFiltre &&!code.toLowerCase().includes(codeFiltre) &&!(i.Designation||'').toLowerCase().includes(codeFiltre)) return; if(!parArticle[code])parArticle[code]={CODE:code,Des:i.Designation||stockMap[code]?.Designation||code,qty:0,ca:0,benef:0,stockActuel:stockMap[code]?.Quantite||0}; let pa=stockMap[code]?.['Prix Achat']||0; parArticle[code].qty+=parseFloat(i.qty||0)||0; parArticle[code].ca+= (parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0); parArticle[code].benef+= (parseFloat(i.qty||0)||0)*(parseFloat(i.Prix||0)-pa); }));
   let list=Object.values(parArticle).sort((a,b)=>b.ca-a.ca); _tmpParArticle=parArticle;
   html='<h3>⭐ SYNTHESE AVEC BENEFICE + STOCK - '+list.length+' articles</h3><table><tr><th>Indicateur</th><th>Montant</th></tr><tr><td>CA</td><td><b>'+ca.toLocaleString()+' FC</b></td></tr><tr><td>Bénéf</td><td style="color:#0b5e2f"><b>'+benef.toLocaleString()+'</b></td></tr><tr><td>Dép</td><td style="color:red">-'+dep.toLocaleString()+'</td></tr><tr style="background:#111;color:#fff"><td>NET</td><td><b>'+(benef-dep).toLocaleString()+'</b></td></tr></table><table><tr><th>CODE</th><th>Dés</th><th>Qté</th><th>CA</th><th>Bénéf</th><th>Marge</th><th>Stock</th></tr>'+list.map(a=>'<tr><td>'+escFn(a.CODE)+'</td><td>'+escFn(a.Des)+'</td><td>'+a.qty+'</td><td>'+a.ca.toLocaleString()+'</td><td style="color:#0b5e2f">'+a.benef.toLocaleString()+'</td><td>'+(a.ca?((a.benef/a.ca)*100).toFixed(1):0)+'%</td><td style="background:#fef3c7;text-align:center"><b>'+a.stockActuel+'</b></td></tr>').join('')+'</table>';
 } else {
   let ca=vPeriode.reduce((s,v)=>s+(parseFloat(v.total||0)||0),0); _tmpParArticle={}; vPeriode.forEach(v=>(v.items||[]).forEach(i=>{let code=i.CODE||i.code; if(!code) return; if(!_tmpParArticle[code])_tmpParArticle[code]={CODE:code,Des:i.Designation||code,ca:0,qty:0}; _tmpParArticle[code].ca+= (parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0); _tmpParArticle[code].qty+=parseFloat(i.qty||0)||0; }));
   let top=Object.values(_tmpParArticle).sort((a,b)=>b.ca-a.ca).slice(0,20);
   html='<h3>⭐ '+escFn(type)+' - '+ca.toLocaleString()+' FC - '+vPeriode.length+' ventes</h3><table><tr><th>CODE</th><th>Dés</th><th>Qté</th><th>CA</th><th>Stock</th></tr>'+top.map(t=>'<tr><td><b>'+escFn(t.CODE)+'</b></td><td>'+escFn(t.Des)+'</td><td>'+t.qty+'</td><td>'+t.ca.toLocaleString()+'</td><td style="background:#fef3c7;text-align:center">'+(stockMap[t.CODE]?.Quantite||0)+'</td></tr>').join('')+'</table>';
 }
 let rc=document.getElementById('rapportC');
 if(rc){
   let cfg = window.CURRENT_CONFIG || {};
   let entete = '<div style="background:#f0fdf4;padding:10px;border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><div><b>'+escFn(cfg.nom||'BATEKE')+'</b> - '+du.toLocaleDateString()+' au '+au.toLocaleDateString()+' - '+escFn(type)+' - '+vPeriode.length+' ventes</div><div style="display:flex;gap:6px"><button onclick="window.switchSub(\'table\')" style="padding:6px 10px;background:#111;color:#fff;border-radius:6px">📋 Table</button><button onclick="window.switchSub(\'graph\')" style="padding:6px 10px;background:#0b5e2f;color:#fff;border-radius:6px">📊 Graph</button><button onclick="window.exportRapportPDF()" style="padding:6px 10px;background:#2563eb;color:#fff;border-radius:6px">PDF</button></div></div>';
   rc.innerHTML = entete + html;
   let vt=document.getElementById('vue-table'); let vg=document.getElementById('vue-graph');
   if(vt) vt.style.display='block'; if(vg) vg.style.display='none'; rc.style.display='block';
 }
 let byDayCalc={}; vPeriode.forEach(v=>{let d=new Date(v.date).toLocaleDateString('fr-FR'); if(!byDayCalc[d])byDayCalc[d]={ca:0,qty:0,benef:0,nb:0}; byDayCalc[d].ca+=Number(v.total||0); byDayCalc[d].benef+=Number(v.benefice||0); byDayCalc[d].nb++; });
 window._lastRapportData={vPeriode,dPeriode,type,du,au,parArticle:_tmpParArticle, byDay:byDayCalc, byVendeur:_tmpByV};
 setTimeout(function(){ if(window.genGraph) window.genGraph(); },300);
 }catch(e){ console.error(e); let rc=document.getElementById('rapportC'); if(rc) rc.innerHTML='<p style="color:red">Erreur: '+e.message+'</p>'; }
}
export function exportRapportPDF(){
  let rc=document.getElementById('rapportC'); if(!rc) return;
  let content=rc.innerHTML;
  let w=window.open('', '_blank'); if(!w){ alert('Popup bloquée'); return; }
  w.document.write('<html><head><title>Rapport BATEKE</title><style>body{font-family:Arial;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px}th{background:#111;color:#fff}</style></head><body>'+content+'</body></html>');
  w.document.close();
  setTimeout(function(){ w.print(); },600);
}
export function printRapport(){ exportRapportPDF(); }
export function shareRapport(){ let rc=document.getElementById('rapportC'); if(!rc) return; let text=rc.innerText.substring(0,2000); if(navigator.share){ navigator.share({title:'Rapport BATEKE', text:text}); } else { navigator.clipboard.writeText(text).then(function(){ alert('Copié'); }); } }
export function exportExcelRapport(){ let last=window._lastRapportData; if(!last){alert('Génère d\'abord'); return;} let csv='Date,Total,Vendeur\n'+last.vPeriode.map(function(v){ return new Date(v.date).toLocaleDateString()+','+v.total+','+(v.vendeurNom||''); }).join('\n'); let blob=new Blob([csv],{type:'text/csv'}); let a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='rapport_'+last.type+'.csv'; a.click(); }
window.chartRapportInstance=null; window.currentChartType='bar'; window.graphConfig={x:'CODE', y:'ca'};
window.changeChartType=function(t){window.currentChartType=t; if(window.genGraph) window.genGraph();}
window.changeAxeX=function(){ let el=document.getElementById('axeX'); if(el) window.graphConfig.x=el.value; window.genGraph(); }
window.changeAxeY=function(){ let el=document.getElementById('axeY'); if(el) window.graphConfig.y=el.value; window.genGraph(); }
window.genGraph=function(){
  try{
    let c=document.getElementById('chartRapport'); if(!c) return;
    if(!window.Chart){ let s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'; s.onload=function(){ window.genGraph(); }; document.head.appendChild(s); return; }
    let last=window._lastRapportData; if(!last) return;
    if(window.chartRapportInstance) window.chartRapportInstance.destroy();
    let cfgX = (document.getElementById('axeX') && document.getElementById('axeX').value) || window.graphConfig.x || 'CODE';
    let cfgY = (document.getElementById('axeY') && document.getElementById('axeY').value) || window.graphConfig.y || 'ca';
    window.graphConfig={x:cfgX, y:cfgY};
    let labels=[], values=[], title=cfgY.toUpperCase()+' par '+cfgX;
    let colors=['#0b5e2f','#2563eb','#f59e0b','#ef4444','#8b5cf6','#22c55e','#111','#ec4899','#06b6d4','#f97316'];
    if(cfgX==='CODE' || cfgX==='DES'){
      let src=last.parArticle||{}; let list=Object.values(src).sort(function(a,b){ return (b[cfgY]||b.ca||0)-(a[cfgY]||a.ca||0); }).slice(0,15);
      labels=list.map(function(a){ return cfgX==='DES' ? (a.Des||a.CODE||'').toString().substring(0,18) : a.CODE; });
      values=list.map(function(a){ if(cfgY==='ca') return a.ca||0; if(cfgY==='qty') return a.qty||0; if(cfgY==='benef') return a.benef||0; if(cfgY==='stock') return a.stockActuel||a.stock||0; return a[cfgY]||a.ca||0; });
    } else if(cfgX==='DATE'){
      let byDay=last.byDay||{}; labels=Object.keys(byDay); values=labels.map(function(k){ let v=byDay[k]; if(typeof v==='number') return v; if(cfgY==='ca') return v.ca||0; if(cfgY==='qty') return v.qty||0; if(cfgY==='benef') return v.benef||0; return v.ca||0; });
    } else if(cfgX==='VENDEUR'){
      let byV=last.byVendeur||{}; labels=Object.keys(byV).slice(0,15); values=labels.map(function(k){ let v=byV[k]; if(typeof v==='number') return v; return v.ca||0; });
    }
    if(labels.length===0){ labels=['Aucune']; values=[0]; }
    let t=window.currentChartType||'bar'; let isPie=(t==='pie'||t==='doughnut');
    window.chartRapportInstance=new Chart(c,{type:t, data:{labels:labels, datasets:[{label:title, data:values, backgroundColor:isPie? colors.slice(0,labels.length) : '#0b5e2f', borderWidth:isPie?2:1}]}, options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true, position: isPie?'right':'top'}, title:{display:true, text:title+' - '+last.type}}, scales: isPie?{}:{x:{title:{display:true,text:cfgX}}, y:{beginAtZero:true, title:{display:true,text:cfgY}}}}}});
  }catch(e){ console.log('graph err',e); }
}
window.switchSub=function(which){
  let rc=document.getElementById('rapportC'); let vt=document.getElementById('vue-table'); let vg=document.getElementById('vue-graph');
  if(which==='table'){ if(rc) rc.style.display='block'; if(vt) vt.style.display='block'; if(vg) vg.style.display='none'; }
  else { if(rc) rc.style.display='none'; if(vt) vt.style.display='none'; if(vg) vg.style.display='block'; setTimeout(function(){ window.genGraph(); },150); if(vg) vg.scrollIntoView({behavior:'smooth'}); }
}
window.onTypeChange=onTypeChange; window.getPeriodeData=getPeriodeData; window.genRapport=genRapport; window.exportRapportPDF=exportRapportPDF; window.printRapport=printRapport; window.shareRapport=shareRapport; window.exportExcelRapport=exportExcelRapport;
console.log('✅ rapport.js V4.9.35 FIX BLOCKER chargé - stable + graph X/Y');
