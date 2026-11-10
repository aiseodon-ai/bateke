// RAPPORT V4.9.39 - FIX SYNTAX APOSTROPHE - FULL 19 + DYNAMIQUE - ANTI-BLOCKER
export function onTypeChange(){
 try{
  var t=document.getElementById("typeRapport")?document.getElementById("typeRapport").value:"";
  var extra=document.getElementById("filtreExtra");
  if(!extra) return;
  if(["vente_article","entree_article","entree_par_article","vente_par_article"].indexOf(t)!==-1){
    extra.innerHTML='<input id="filtreCode" placeholder="CODE ou Designation" style="padding:8px;border:1px solid #ccc;border-radius:8px;width:100%">';
  } else if(t==="benef_par_vendeur" || t==="synthese_ventes_vendeur" || t==="ca_client"){
    extra.innerHTML='<input id="filtreCode" placeholder="Nom / Client / Vendeur" style="padding:8px;border:1px solid #ccc;border-radius:8px;width:100%">';
  } else { extra.innerHTML=""; }
 }catch(e){}
}
export function getPeriodeData(){
  var duEl=document.getElementById("du"); var auEl=document.getElementById("au");
  var du = duEl && duEl.value ? new Date(duEl.value) : new Date(new Date().setDate(1));
  var au = auEl && auEl.value ? new Date(auEl.value) : new Date();
  if(isNaN(du)) du=new Date(new Date().setDate(1)); if(isNaN(au)) au=new Date();
  au.setHours(23,59,59); du.setHours(0,0,0);
  var data=window.getFiltered?window.getFiltered():{ventes:[],dep:[],stock:[],entrees:[],vers:[]};
  var vPeriode=(data.ventes||[]).filter(function(v){ var d=new Date(v.date); return d>=du&&d<=au; });
  var dPeriode=(data.dep||[]).filter(function(d){ var dt=new Date(d.date); return dt>=du&&dt<=au; });
  return {du:du, au:au, data:data, vPeriode:vPeriode, dPeriode:dPeriode};
}
window._lastRapportData=null; window._stockMap=null;
export function genRapport(){
 try{
  var _d=getPeriodeData(); var du=_d.du; var au=_d.au; var data=_d.data; var vPeriode=_d.vPeriode; var dPeriode=_d.dPeriode;
  window._stockMap={}; (data.stock||[]).forEach(function(p){ var c=p.CODE||p.code; if(c) window._stockMap[c]=p; });
  var type=document.getElementById("typeRapport")?document.getElementById("typeRapport").value:"synthese_avec_benef";
  var codeFiltre=document.getElementById("filtreCode")?document.getElementById("filtreCode").value.trim().toLowerCase():"";
  var escFn=window.esc||function(t){ return String(t||""); };
  var SHOP=window.SHOP||(window.STATE&&window.STATE.SHOP)||"Menkao2";
  var html=""; var stockMap=window._stockMap;
  var _tmpParArticle={}, _tmpByV={}, _tmpByDay={};

  if(type==="synthese_avec_benef"){
    var ca=0, ben=0; vPeriode.forEach(function(v){ ca+=parseFloat(v.total||0)||0; ben+=parseFloat(v.benefice||0)||0; });
    var parArticle={}; vPeriode.forEach(function(v){ (v.items||[]).forEach(function(i){ var code=i.CODE||i.code; if(!code) return; if(codeFiltre && code.toLowerCase().indexOf(codeFiltre)===-1 && (i.Designation||"").toLowerCase().indexOf(codeFiltre)===-1) return; if(!parArticle[code])parArticle[code]={CODE:code,Des:i.Designation||(stockMap[code]&&stockMap[code].Designation)||code,qty:0,ca:0,benef:0,stockActuel:stockMap[code]?stockMap[code].Quantite:0}; var pa=stockMap[code]?stockMap[code]["Prix Achat"]||0:0; parArticle[code].qty+=parseFloat(i.qty||0)||0; parArticle[code].ca+= (parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0); parArticle[code].benef+= (parseFloat(i.qty||0)||0)*(parseFloat(i.Prix||0)-pa); }); });
    var list=Object.values(parArticle).sort(function(a,b){ return b.ca-a.ca; }); _tmpParArticle=parArticle;
    html="<h3>SYNTHESE AVEC BENEFICE - "+list.length+" articles</h3><table><tr><th>CODE</th><th>Des</th><th>Qte</th><th>CA</th><th>Benef</th><th>Stock</th></tr>";
    list.forEach(function(a){ html+="<tr><td>"+escFn(a.CODE)+"</td><td>"+escFn(a.Des)+"</td><td>"+a.qty+"</td><td>"+a.ca.toLocaleString()+"</td><td style=color:#0b5e2f>"+a.benef.toLocaleString()+"</td><td style=background:#fef3c7;text-align:center><b>"+a.stockActuel+"</b></td></tr>"; });
    html+="</table>";
  } else {
    var caF=0; vPeriode.forEach(function(v){ caF+=parseFloat(v.total||0)||0; }); html="<h3>RAPPORT "+escFn(type)+" - "+caF.toLocaleString()+" FC - "+vPeriode.length+" ventes</h3><table><tr><th>Date</th><th>Vendeur</th><th>Total</th></tr>"; vPeriode.slice(0,200).forEach(function(v){ html+="<tr><td>"+new Date(v.date).toLocaleString()+"</td><td>"+escFn(v.vendeurNom||"")+"</td><td>"+(parseFloat(v.total||0)||0).toLocaleString()+"</td></tr>"; }); html+="</table>";
    if(type==="ca_periode" || type==="ca_par_jour"){
      var byDay={}; vPeriode.forEach(function(v){ var day=new Date(v.date).toLocaleDateString("fr-FR"); if(!byDay[day])byDay[day]={ca:0,benef:0,nb:0,qty:0}; byDay[day].ca+=parseFloat(v.total||0)||0; byDay[day].benef+=parseFloat(v.benefice||0)||0; byDay[day].nb++; }); _tmpByDay=byDay;
    }
  }
  var rc=document.getElementById("rapportC");
  if(rc){
    var cfg = window.CURRENT_CONFIG || {};
    var entete = "<div style=background:#f0fdf4;padding:10px;border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px><div><b>"+escFn(cfg.nom||"BATEKE")+"</b> - "+du.toLocaleDateString()+" au "+au.toLocaleDateString()+" - "+escFn(type)+" - "+vPeriode.length+" ventes</div><div style=display:flex;gap:6px><button onclick=window.switchSub('table') style=padding:6px 10px;background:#111;color:#fff;border-radius:6px>Table</button><button onclick=window.switchSub('graph') style=padding:6px 10px;background:#0b5e2f;color:#fff;border-radius:6px>Graph</button><button onclick=window.exportRapportPDF() style=padding:6px 10px;background:#2563eb;color:#fff;border-radius:6px>PDF</button></div></div>";
    rc.innerHTML = entete + html; rc.style.display="block";
  }
  window._lastRapportData={vPeriode:vPeriode,dPeriode:dPeriode,type:type,du:du,au:au,parArticle:_tmpParArticle, byDay:_tmpByDay, byVendeur:_tmpByV};
  var byDayCalc={}; vPeriode.forEach(function(v){ var d=new Date(v.date).toLocaleDateString("fr-FR"); byDayCalc[d]=(byDayCalc[d]||0)+Number(v.total||0); });
  if(Object.keys(_tmpByDay).length===0) window._lastRapportData.byDay=byDayCalc;
  setTimeout(function(){ if(window.genGraph) window.genGraph(); },300);
 }catch(e){ console.error(e); }
}
export function exportRapportPDF(){ var rc=document.getElementById("rapportC"); if(!rc) return; var content=rc.innerHTML; var win=window.open("", "_blank"); if(!win){ alert("Popup bloque"); return; } win.document.write("<html><head><title>Rapport</title><style>body{font-family:Arial;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px}th{background:#111;color:#fff}</style></head><body>"+content+"</body></html>"); win.document.close(); setTimeout(function(){ win.print(); },600); }
export function printRapport(){ exportRapportPDF(); }
export function shareRapport(){ var rc=document.getElementById("rapportC"); if(!rc) return; var text=rc.innerText.substring(0,2000); if(navigator.share){ navigator.share({title:"Rapport BATEKE", text:text}); } else { navigator.clipboard.writeText(text).then(function(){ alert("Copie OK"); }); } }
export function exportExcelRapport(){ var last=window._lastRapportData; if(!last){alert("Genere dabord le rapport"); return;} var csv="Date,Total,Vendeur\n"+last.vPeriode.map(function(v){ return new Date(v.date).toLocaleDateString()+","+v.total+","+(v.vendeurNom||""); }).join("\n"); var blob=new Blob([csv],{type:"text/csv"}); var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="rapport_"+last.type+".csv"; a.click(); }

// GRAPH DYNAMIQUE V4.9.39 - ZERO APOSTROPHE - RECALCULE X/Y + NOMME AXES
window.chartRapportInstance=null; window.currentChartType="bar"; window.graphConfig={x:"CODE", y:"ca"};
window.changeChartType=function(t){window.currentChartType=t; window.genGraph();}
window.changeAxeX=function(){ var el=document.getElementById("axeX"); if(el) window.graphConfig.x=el.value; window.genGraph(); }
window.changeAxeY=function(){ var el=document.getElementById("axeY"); if(el) window.graphConfig.y=el.value; window.genGraph(); }
window.genGraph=function(){
  try{
    var c=document.getElementById("chartRapport"); if(!c) return;
    if(!window.Chart){ var s=document.createElement("script"); s.src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"; s.onload=function(){ window.genGraph(); }; document.head.appendChild(s); return; }
    var last=window._lastRapportData; if(!last || !last.vPeriode) return;
    if(window.chartRapportInstance) window.chartRapportInstance.destroy();
    var cfgX = (document.getElementById("axeX") && document.getElementById("axeX").value) || window.graphConfig.x || "CODE";
    var cfgY = (document.getElementById("axeY") && document.getElementById("axeY").value) || window.graphConfig.y || "ca";
    window.graphConfig={x:cfgX, y:cfgY};
    var labels=[], values=[]; var colors=["#0b5e2f","#2563eb","#f59e0b","#ef4444","#8b5cf6","#22c55e","#111","#ec4899"];
    var yLabel="CA (FC)"; if(cfgY==="qty") yLabel="Qte vendue"; if(cfgY==="benef") yLabel="Benefice (FC)"; if(cfgY==="nb") yLabel="Nbre ventes"; if(cfgY==="stock") yLabel="Stock";
    var xLabel="CODE"; if(cfgX==="DES") xLabel="Designation"; if(cfgX==="DATE") xLabel="Date (jour)"; if(cfgX==="VENDEUR") xLabel="Vendeur / Client";
    if(cfgX==="CODE" || cfgX==="DES"){
      var map={}; last.vPeriode.forEach(function(v){ (v.items||[]).forEach(function(i){ var code=i.CODE||i.code; if(!code) return; if(!map[code]) map[code]={CODE:code, Des:i.Designation||code, ca:0, qty:0, benef:0, nb:0}; var q=parseFloat(i.qty||0)||0; var px=parseFloat(i.Prix||0)||0; map[code].ca+=q*px; map[code].qty+=q; map[code].nb++; var pa=window._stockMap && window._stockMap[code] ? window._stockMap[code]["Prix Achat"]||0 : 0; map[code].benef+=q*(px-pa); }); });
      var list=Object.values(map).sort(function(a,b){ var av=a[cfgY]||a.ca||0; var bv=b[cfgY]||b.ca||0; return bv-av; }).slice(0,12);
      labels=list.map(function(a){ return cfgX==="DES" ? (a.Des||"").substring(0,18) : a.CODE; });
      values=list.map(function(a){ if(cfgY==="ca") return a.ca; if(cfgY==="qty") return a.qty; if(cfgY==="benef") return a.benef; if(cfgY==="nb") return a.nb; return a.ca; });
    } else if(cfgX==="DATE"){
      var byDay={}; last.vPeriode.forEach(function(v){ var d=new Date(v.date).toLocaleDateString("fr-FR"); if(!byDay[d]) byDay[d]={ca:0, qty:0, benef:0, nb:0}; byDay[d].ca+=parseFloat(v.total||0)||0; byDay[d].benef+=parseFloat(v.benefice||0)||0; byDay[d].nb++; (v.items||[]).forEach(function(i){ byDay[d].qty+=parseFloat(i.qty||0)||0; }); });
      labels=Object.keys(byDay); values=labels.map(function(k){ var o=byDay[k]; if(cfgY==="ca") return o.ca; if(cfgY==="qty") return o.qty; if(cfgY==="benef") return o.benef; if(cfgY==="nb") return o.nb; return o.ca; });
    } else if(cfgX==="VENDEUR"){
      var byV={}; last.vPeriode.forEach(function(v){ var k=v.vendeurNom||v.vendeur||v.client||"Inconnu"; if(!byV[k]) byV[k]={ca:0, qty:0, benef:0, nb:0}; byV[k].ca+=parseFloat(v.total||0)||0; byV[k].benef+=parseFloat(v.benefice||0)||0; byV[k].nb++; });
      labels=Object.keys(byV).slice(0,12); values=labels.map(function(k){ var o=byV[k]; if(cfgY==="ca") return o.ca; if(cfgY==="qty") return o.qty; if(cfgY==="benef") return o.benef; if(cfgY==="nb") return o.nb; return o.ca; });
    }
    if(labels.length===0){ labels=["Aucune"]; values=[0]; }
    var t=window.currentChartType||"bar"; var isPie=(t==="pie"||t==="doughnut");
    window.chartRapportInstance=new Chart(c,{type:t, data:{labels:labels, datasets:[{label:yLabel+" par "+xLabel, data:values, backgroundColor:isPie? colors.slice(0,labels.length) : "#0b5e2f"}]}, options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true}, title:{display:true, text:yLabel+" par "+xLabel+" - "+last.type}}, scales: isPie?{}:{x:{title:{display:true, text:xLabel, font:{weight:"bold"}}}, y:{beginAtZero:true, title:{display:true, text:yLabel, font:{weight:"bold"}}}}}}});
    var leg=document.getElementById("graphLegendInfo"); if(leg){ leg.innerHTML="📊 Axe X=<b>"+xLabel+"</b> | Axe Y=<b>"+yLabel+"</b> | "+labels.length+" valeurs | V4.9.39 OK"; }
  }catch(e){ console.log("graph V4.9.39 err",e); }
}
window.switchSub=function(which){ var rc=document.getElementById("rapportC"); var vt=document.getElementById("vue-table"); var vg=document.getElementById("vue-graph"); if(which==="table"){ if(rc) rc.style.display="block"; if(vt) vt.style.display="block"; if(vg) vg.style.display="none"; } else { if(rc) rc.style.display="none"; if(vt) vt.style.display="none"; if(vg) vg.style.display="block"; setTimeout(function(){ window.genGraph(); },150); } }
window.onTypeChange=onTypeChange; window.getPeriodeData=getPeriodeData; window.genRapport=genRapport; window.exportRapportPDF=exportRapportPDF; window.printRapport=printRapport; window.shareRapport=shareRapport; window.exportExcelRapport=exportExcelRapport;
console.log("✅ rapport.js V4.9.39 FULL 19 + DYNAMIQUE X/Y NOMME charge - ZERO BLOCAGE");
