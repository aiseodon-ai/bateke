// GRAPH-ADDON V1.0 - SAFE - Ne touche pas au rapport.js stable
// Ce fichier enrichit seulement le graphique, s'il plante il ne bloque pas loginPat
(function(){
  window.graphConfig={x:'CODE', y:'ca'};
  window.currentChartType=window.currentChartType||'bar';

  window.changeAxeX=function(){ 
    var el=document.getElementById('axeX'); 
    if(el) window.graphConfig.x=el.value; 
    if(window.genGraph) window.genGraph(); 
  };
  window.changeAxeY=function(){ 
    var el=document.getElementById('axeY'); 
    if(el) window.graphConfig.y=el.value; 
    if(window.genGraph) window.genGraph(); 
  };
  window.changeChartTypeSafe=function(t){
    window.currentChartType=t;
    if(window.genGraph) window.genGraph();
  };

  var originalGenGraph = window.genGraph;
  window.genGraph=function(){
    try{
      var c=document.getElementById('chartRapport'); if(!c) return;
      if(!window.Chart){
        var s=document.createElement('script');
        s.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        s.onload=function(){ window.genGraph(); };
        document.head.appendChild(s); return;
      }
      var last=window._lastRapportData; if(!last) { if(originalGenGraph) return originalGenGraph(); return; }
      if(window.chartRapportInstance) window.chartRapportInstance.destroy();

      var cfgX = (document.getElementById('axeX') && document.getElementById('axeX').value) || window.graphConfig.x;
      var cfgY = (document.getElementById('axeY') && document.getElementById('axeY').value) || window.graphConfig.y;
      window.graphConfig={x:cfgX, y:cfgY};

      var labels=[], values=[], title=cfgY.toUpperCase()+' par '+cfgX;
      var colors=['#0b5e2f','#2563eb','#f59e0b','#ef4444','#8b5cf6','#22c55e','#111','#ec4899'];

      if(cfgX==='CODE' || cfgX==='DES'){
        var src=last.parArticle||{}; 
        var list=Object.values(src).sort(function(a,b){ return (b[cfgY]||b.ca||0)-(a[cfgY]||a.ca||0); }).slice(0,15);
        labels=list.map(function(a){ return cfgX==='DES' ? (a.Des||a.CODE||'').toString().substring(0,18) : a.CODE; });
        values=list.map(function(a){ if(cfgY==='ca') return a.ca||0; if(cfgY==='qty') return a.qty||0; if(cfgY==='benef') return a.benef||0; if(cfgY==='stock') return a.stockActuel||a.stock||0; return a[cfgY]||a.ca||0; });
      } else if(cfgX==='DATE'){
        var byDay=last.byDay||{}; labels=Object.keys(byDay); values=labels.map(function(k){ var v=byDay[k]; if(typeof v==='number') return v; return v.ca||0; });
      } else if(cfgX==='VENDEUR'){
        var byV=last.byVendeur||{}; labels=Object.keys(byV).slice(0,15); values=labels.map(function(k){ var v=byV[k]; if(typeof v==='number') return v; return v.ca||0; });
      }

      if(labels.length===0){ labels=['Aucune']; values=[0]; }
      var t=window.currentChartType||'bar'; var isPie=(t==='pie'||t==='doughnut');
      window.chartRapportInstance=new Chart(c,{
        type:t, 
        data:{labels:labels, datasets:[{label:title, data:values, backgroundColor:isPie? colors.slice(0,labels.length) : '#0b5e2f'}]},
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{
            legend:{display:true, position: isPie?'right':'top'},
            tooltip:{enabled:true},
            title:{display:true, text:title+' - '+(last.type||'')}
          },
          scales: isPie?{}:{x:{title:{display:true,text:cfgX}}, y:{beginAtZero:true, title:{display:true,text:cfgY}}}
        }
      });
    }catch(e){ console.log('graph-addon err',e); }
  };
  console.log('✅ graph-addon X/Y + legende chargé - stable non touché');
})();
