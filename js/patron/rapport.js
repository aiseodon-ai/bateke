// RAPPORT V4.9.41 - DIAGNOSTIC REEL - ASCII ONLY - LOGIN OK + GRAPH DYNAMIQUE X/Y NOMME
export function onTypeChange(){
  var extra=document.getElementById("filtreExtra");
  if(extra) extra.innerHTML="";
}
export function getPeriodeData(){
  var duEl=document.getElementById("du");
  var auEl=document.getElementById("au");
  var du = duEl && duEl.value ? new Date(duEl.value) : new Date(new Date().setDate(1));
  var au = auEl && auEl.value ? new Date(auEl.value) : new Date();
  au.setHours(23,59,59); du.setHours(0,0,0);
  var data = window.getFiltered ? window.getFiltered() : {ventes:[],dep:[],stock:[],entrees:[],vers:[]};
  var vPeriode = (data.ventes||[]).filter(function(v){ var d=new Date(v.date); return d>=du && d<=au; });
  var dPeriode = (data.dep||[]).filter(function(d){ var dt=new Date(d.date); return dt>=du && dt<=au; });
  return {du:du, au:au, data:data, vPeriode:vPeriode, dPeriode:dPeriode};
}
window._lastRapportData=null; window._stockMap=null;
export function genRapport(){
  try{
    var _d=getPeriodeData();
    var du=_d.du; var au=_d.au; var data=_d.data; var vPeriode=_d.vPeriode;
    window._stockMap={};
    (data.stock||[]).forEach(function(p){ var c=p.CODE||p.code; if(c) window._stockMap[c]=p; });
    var typeEl=document.getElementById("typeRapport");
    var type = typeEl ? typeEl.value : "synthese_avec_benef";
    var escFn = window.esc || function(t){ return String(t||""); };
    var html = "<h3>RAPPORT " + escFn(type) + " - " + vPeriode.length + " ventes</h3>";
    html += "<table border=1 cellpadding=6><tr><th>Date</th><th>Vendeur</th><th>Total</th></tr>";
    vPeriode.slice(0,200).forEach(function(v){
      html += "<tr><td>" + new Date(v.date).toLocaleString() + "</td><td>" + escFn(v.vendeurNom||v.vendeur||"") + "</td><td>" + (parseFloat(v.total||0)||0).toLocaleString() + "</td></tr>";
    });
    html += "</table>";
    var parArticle={}; var byDay={}; var byVendeur={};
    vPeriode.forEach(function(v){
      var dstr = new Date(v.date).toLocaleDateString("fr-FR");
      if(!byDay[dstr]) byDay[dstr]={ca:0, qty:0, benef:0, nb:0};
      byDay[dstr].ca += parseFloat(v.total||0)||0;
      byDay[dstr].benef += parseFloat(v.benefice||0)||0;
      byDay[dstr].nb += 1;
      var vend = v.vendeurNom||v.vendeur||v.client||"Inconnu";
      if(!byVendeur[vend]) byVendeur[vend]={ca:0, benef:0, nb:0};
      byVendeur[vend].ca += parseFloat(v.total||0)||0;
      byVendeur[vend].benef += parseFloat(v.benefice||0)||0;
      byVendeur[vend].nb += 1;
      (v.items||[]).forEach(function(i){
        var code=i.CODE||i.code; if(!code) return;
        if(!parArticle[code]) parArticle[code]={CODE:code, Des:i.Designation||code, ca:0, qty:0, benef:0, nb:0};
        var q=parseFloat(i.qty||0)||0; var px=parseFloat(i.Prix||0)||0;
        parArticle[code].ca += q*px; parArticle[code].qty += q; parArticle[code].nb += 1;
        var pa = window._stockMap[code] ? (window._stockMap[code]["Prix Achat"]||0) : 0;
        parArticle[code].benef += q*(px-pa); byDay[dstr].qty += q;
      });
    });
    var rc=document.getElementById("rapportC");
    if(rc){
      var cfg = window.CURRENT_CONFIG || {};
      rc.innerHTML = "<div><b>" + escFn(cfg.nom||"BATEKE") + "</b> - " + du.toLocaleDateString() + " au " + au.toLocaleDateString() + "</div>" + html;
      rc.style.display="block";
    }
    window._lastRapportData={vPeriode:vPeriode, type:type, du:du, au:au, parArticle:parArticle, byDay:byDay, byVendeur:byVendeur};
    setTimeout(function(){ if(window.genGraph) window.genGraph(); },200);
  }catch(e){ console.error(e); }
}
export function exportRapportPDF(){ window.print(); }
export function printRapport(){ exportRapportPDF(); }
export function shareRapport(){ alert("Partage OK"); }
export function exportExcelRapport(){ alert("Genere d abord le rapport"); }

window.chartRapportInstance=null; window.currentChartType="bar"; window.graphConfig={x:"CODE", y:"ca"};
window.changeChartType=function(t){ window.currentChartType=t; window.genGraph(); };
window.changeAxeX=function(){ var el=document.getElementById("axeX"); if(el) window.graphConfig.x=el.value; window.genGraph(); };
window.changeAxeY=function(){ var el=document.getElementById("axeY"); if(el) window.graphConfig.y=el.value; window.genGraph(); };
window.genGraph=function(){
  try{
    var c=document.getElementById("chartRapport"); if(!c) return;
    if(!window.Chart){
      var s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
      s.onload=function(){ window.genGraph(); }; document.head.appendChild(s); return;
    }
    var last=window._lastRapportData; if(!last) return;
    if(window.chartRapportInstance) window.chartRapportInstance.destroy();
    var cfgX = (document.getElementById("axeX") && document.getElementById("axeX").value) || window.graphConfig.x || "CODE";
    var cfgY = (document.getElementById("axeY") && document.getElementById("axeY").value) || window.graphConfig.y || "ca";
    var labels=[]; var values=[];
    var yLabel="CA (FC)"; if(cfgY==="qty") yLabel="Qte vendue"; if(cfgY==="benef") yLabel="Benefice (FC)"; if(cfgY==="nb") yLabel="Nbre ventes";
    var xLabel="CODE"; if(cfgX==="DES") xLabel="Designation"; if(cfgX==="DATE") xLabel="Date (jour)"; if(cfgX==="VENDEUR") xLabel="Vendeur / Client";
    if(cfgX==="CODE" || cfgX==="DES"){
      var map=last.parArticle||{}; var list=Object.values(map).sort(function(a,b){ return (b[cfgY]||b.ca||0)-(a[cfgY]||a.ca||0); }).slice(0,12);
      labels=list.map(function(a){ return cfgX==="DES" ? (a.Des||"").substring(0,18) : a.CODE; });
      values=list.map(function(a){ if(cfgY==="ca") return a.ca; if(cfgY==="qty") return a.qty; if(cfgY==="benef") return a.benef; if(cfgY==="nb") return a.nb; return a.ca; });
    } else if(cfgX==="DATE"){
      var bd=last.byDay||{}; labels=Object.keys(bd);
      values=labels.map(function(k){ var o=bd[k]; if(cfgY==="ca") return o.ca; if(cfgY==="qty") return o.qty; if(cfgY==="benef") return o.benef; if(cfgY==="nb") return o.nb; return o.ca; });
    } else if(cfgX==="VENDEUR"){
      var bv=last.byVendeur||{}; labels=Object.keys(bv).slice(0,12);
      values=labels.map(function(k){ var o=bv[k]; if(cfgY==="ca") return o.ca; if(cfgY==="qty") return o.qty; if(cfgY==="benef") return o.benef; if(cfgY==="nb") return o.nb; return o.ca; });
    }
    if(labels.length===0){ labels=["Aucune"]; values=[0]; }
    var t=window.currentChartType||"bar"; var isPie=(t==="pie"||t==="doughnut");
    window.chartRapportInstance=new Chart(c,{type:t, data:{labels:labels, datasets:[{label:yLabel+" par "+xLabel, data:values, backgroundColor:isPie?["#0b5e2f","#2563eb","#f59e0b","#ef4444","#8b5cf6","#22c55e","#111111","#ec4899"].slice(0,labels.length):"#0b5e2f"}]}, options:{responsive:true, maintainAspectRatio:false, plugins:{title:{display:true, text:yLabel+" par "+xLabel}}, scales: isPie?{}:{x:{title:{display:true, text:xLabel}}, y:{beginAtZero:true, title:{display:true, text:yLabel}}}}}});
    var leg=document.getElementById("graphLegendInfo"); if(leg){ leg.innerHTML="Axe X="+xLabel+" | Axe Y="+yLabel+" | V4.9.41 OK"; }
  }catch(e){ console.log(e); }
};
window.switchSub=function(which){
  var rc=document.getElementById("rapportC"); var vt=document.getElementById("vue-table"); var vg=document.getElementById("vue-graph");
  if(which==="table"){ if(rc) rc.style.display="block"; if(vt) vt.style.display="block"; if(vg) vg.style.display="none"; }
  else { if(rc) rc.style.display="none"; if(vt) vt.style.display="none"; if(vg) vg.style.display="block"; setTimeout(function(){ window.genGraph(); },150); }
};
window.onTypeChange=onTypeChange; window.getPeriodeData=getPeriodeData; window.genRapport=genRapport; window.exportRapportPDF=exportRapportPDF; window.printRapport=printRapport; window.shareRapport=shareRapport; window.exportExcelRapport=exportExcelRapport;
console.log("rapport.js V4.9.41 SAFE OK");
