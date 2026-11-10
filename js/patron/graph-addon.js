// GRAPH-ADDON V1.1 - DYNAMIQUE X/Y + AXES NOMMES - SAFE - NE TOUCHE PAS rapport.js
(function(){
  window.graphConfig={x:'CODE', y:'ca'};
  window.currentChartType='bar';

  window.changeAxeX=function(){ 
    var el=document.getElementById('axeX'); 
    if(el){ window.graphConfig.x=el.value; }
    if(window.genGraph) window.genGraph(); 
  };
  window.changeAxeY=function(){ 
    var el=document.getElementById('axeY'); 
    if(el){ window.graphConfig.y=el.value; }
    if(window.genGraph) window.genGraph(); 
  };
  window.changeChartTypeSafe=function(t){
    window.currentChartType=t;
    if(window.genGraph) window.genGraph();
  };

  // ON REMPLACE COMPLETEMENT genGraph par version dynamique
  window.genGraph=function(){
    try{
      var c=document.getElementById('chartRapport'); if(!c) return;
      if(!window.Chart){
        var s=document.createElement('script');
        s.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        s.onload=function(){ window.genGraph(); };
        document.head.appendChild(s); return;
      }
      var last=window._lastRapportData; if(!last) return;
      if(window.chartRapportInstance) window.chartRapportInstance.destroy();

      var cfgXEl=document.getElementById('axeX');
      var cfgYEl=document.getElementById('axeY');
      var cfgX = cfgXEl ? cfgXEl.value : window.graphConfig.x;
      var cfgY = cfgYEl ? cfgYEl.value : window.graphConfig.y;
      window.graphConfig={x:cfgX, y:cfgY};

      var labels=[], values=[], title='';
      var colors=['#0b5e2f','#2563eb','#f59e0b','#ef4444','#8b5cf6','#22c55e','#111','#ec4899','#06b6d4','#f97316'];

      var yLabel='CA (FC)'; if(cfgY==='qty') yLabel='Qté'; if(cfgY==='benef') yLabel='Bénéfice (FC)'; if(cfgY==='stock') yLabel='Stock'; if(cfgY==='marge') yLabel='Marge %'; if(cfgY==='nb') yLabel='Nbre';
      var xLabel=cfgX; if(cfgX==='CODE') xLabel='CODE Article'; if(cfgX==='DES') xLabel='Désignation'; if(cfgX==='DATE') xLabel='Date (jour)'; if(cfgX==='VENDEUR') xLabel='Vendeur / Client / Type';

      if(cfgX==='CODE' || cfgX==='DES'){
        var src=last.parArticle||{};
        if(Object.keys(src).length===0 && last.vPeriode){
          var map={}; last.vPeriode.forEach(function(v){ (v.items||[]).forEach(function(i){ var code=i.CODE||i.code; if(!code) return; if(!map[code]) map[code]={CODE:code, Des:i.Designation||code, ca:0, qty:0, benef:0, stock:0, stockActuel:0, nb:0}; map[code].ca+=(parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0); map[code].qty+=parseFloat(i.qty||0)||0; map[code].nb++; }); }); src=map;
        }
        var list=Object.values(src).sort(function(a,b){ var av=a[cfgY]||a.ca||0; var bv=b[cfgY]||b.ca||0; return bv-av; }).slice(0,15);
        labels=list.map(function(a){ return cfgX==='DES' ? (a.Des||a.CODE||'').toString().substring(0,20) : a.CODE; });
        values=list.map(function(a){ if(cfgY==='ca') return a.ca||0; if(cfgY==='qty') return a.qty||a.nb||0; if(cfgY==='benef') return a.benef||a.benefice||0; if(cfgY==='stock') return a.stockActuel||a.stock||0; if(cfgY==='marge') return a.ca ? ((a.benef/a.ca)*100) : 0; if(cfgY==='nb') return a.nb||0; return a[cfgY]||0; });
        title=yLabel+' par '+xLabel;
      } else if(cfgX==='DATE'){
        var byDay=last.byDay||{}; 
        // byDay peut être {date:{ca,qty,benef}} ou {date:number}
        labels=Object.keys(byDay);
        values=labels.map(function(k){ var v=byDay[k]; if(typeof v==='number') return v; if(cfgY==='ca') return v.ca||0; if(cfgY==='qty') return v.qty||0; if(cfgY==='benef') return v.benef||v.benefice||0; if(cfgY==='nb') return v.nb||0; return v.ca||0; });
        title=yLabel+' par '+xLabel;
      } else if(cfgX==='VENDEUR'){
        var byV=last.byVendeur||{};
        // byV peut être {nom:{ca,benef}} ou {nom:number}
        labels=Object.keys(byV).slice(0,15);
        values=labels.map(function(k){ var v=byV[k]; if(typeof v==='number') return v; if(cfgY==='ca') return v.ca||0; if(cfgY==='benef') return v.benef||0; if(cfgY==='qty') return v.qty||0; if(cfgY==='nb') return v.nb||0; return v.ca||0; });
        title=yLabel+' par '+xLabel;
      }

      if(labels.length===0){ labels=['Aucune']; values=[0]; }

      var t=window.currentChartType||'bar'; var isPie=(t==='pie'||t==='doughnut');
      window.chartRapportInstance=new Chart(c,{
        type:t, 
        data:{
          labels:labels, 
          datasets:[{label:title, data:values, backgroundColor:isPie? colors.slice(0,labels.length) : '#0b5e2f', borderWidth:isPie?2:1}]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{
            legend:{display:true, position: isPie?'right':'top'},
            tooltip:{enabled:true, callbacks:{label:function(ctx){ var v=ctx.raw; return ctx.label+': '+Number(v).toLocaleString()+(cfgY==='marge'?'%':''); }}},
            title:{display:true, text:title+' - '+(last.type||'')+' ('+labels.length+')'}
          },
          scales: isPie?{}:{
            x:{title:{display:true, text:xLabel}, ticks:{maxRotation:45}},
            y:{beginAtZero:true, title:{display:true, text:yLabel}}
          }
        }
      });

      var leg=document.getElementById('graphLegendInfo');
      if(leg){ leg.innerHTML='📊 <b>X='+xLabel+'</b> | <b>Y='+yLabel+'</b> | '+labels.length+' éléments | Type='+t+' - Axe X et Y nommés dynamiquement.'; }

    }catch(e){ console.log('graph-addon V1.1 err',e); }
  };

  console.log('✅ graph-addon V1.1 DYNAMIQUE chargé - X/Y change vraiment');
})();
