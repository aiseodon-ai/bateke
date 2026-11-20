// ia-calcul.js - CALCULS SEULS - Ruptures, Dormants, Sur-stock, Clients, Vendeurs
(function(){
  function IA_buildContext(){
    let d = IA_getData();
    let stock = d.stock, lignes = IA_ventesLignes(d.ventes);
    let now = Date.now();
    let ca = lignes.reduce(function(s,l){ return s+l.TOTAL; },0);
    let stockAvecQte = stock.filter(function(p){ return IA_hasQty(p); });
    let rupturesToutes = stockAvecQte.filter(function(p){ return IA_qty(p) <= 0; });
    let limite30j = now - 30*86400000; let limite90j = now - 90*86400000;
    let ventes30j = {}; let ventes90j = {}; let derniereVente = {};
    lignes.forEach(function(l){ if(!l.CODE || !l.DATE) return;
      if(l.DATE>=limite90j){ if(!ventes90j[l.CODE]) ventes90j[l.CODE]=0; ventes90j[l.CODE]+=l.QTE; }
      if(l.DATE>=limite30j){ if(!ventes30j[l.CODE]) ventes30j[l.CODE]=0; ventes30j[l.CODE]+=l.QTE; }
      if(!derniereVente[l.CODE] || l.DATE>derniereVente[l.CODE]) derniereVente[l.CODE]=l.DATE;
    });
    let ruptures = rupturesToutes.filter(function(p){ return ventes30j[IA_code(p)]>0; }).map(function(p){
      let code = IA_code(p); let q30 = ventes30j[code]||0; let q90 = ventes90j[code]||0; let vit90 = q90/90; let pa = IA_pa(p);
      let prop7 = Math.max(1, Math.ceil(vit90*7)); let prop30 = Math.max(1, Math.ceil(vit90*30));
      let jDepuis = derniereVente[code] ? Math.floor((now-derniereVente[code])/86400000) : 999;
      return { CODE: code, DES: p.Designation||p.designation||p.Nom||'', PA: pa, Q30: q30, Q90: q90, VIT90: vit90, JDEPUIS: jDepuis, PROP7: prop7, PROP30: prop30, COUT7: prop7*pa, COUT30: prop30*pa };
    }).sort(function(a,b){ return a.JDEPUIS-b.JDEPUIS; });
    let totalCout7 = ruptures.reduce(function(s,r){ return s+r.COUT7; },0);
    let totalCout30 = ruptures.reduce(function(s,r){ return s+r.COUT30; },0);
    let dormantsDetail = stock.filter(function(p){ let qq = (p.QTE!=null ? p.QTE : (p.Qte!=null ? p.Qte : (p.Quantite!=null ? p.Quantite : (p.STOCK!=null ? p.STOCK : 0)))); return qq>=20; }).map(function(p){
      let code = IA_code(p); let q = (p.QTE!=null ? p.QTE : (p.Qte!=null ? p.Qte : (p.Quantite!=null ? p.Quantite : (p.STOCK!=null ? p.STOCK : 0)))); let pa = IA_pa(p);
      let jDepuis = derniereVente[code] ? Math.floor((now-derniereVente[code])/86400000) : 999;
      return { CODE: code, DES: p.Designation||p.designation||p.Nom||'', QTE: q, PA: pa, VALEUR: q*pa, JDEPUIS: jDepuis };
    }).sort(function(a,b){ return b.VALEUR-a.VALEUR; }).slice(0,10);
    let vraisDormantsTous = stockAvecQte.filter(function(p){ return IA_qty(p)>=20; }).map(function(p){
      let code = IA_code(p); let jDepuis = derniereVente[code] ? Math.floor((now-derniereVente[code])/86400000) : 999;
      return { CODE: code, DES: p.Designation||p.designation||p.Nom||'', QTE: IA_qty(p), PA: IA_pa(p), VALEUR: IA_qty(p)*IA_pa(p), JDEPUIS: jDepuis };
    }).filter(function(dd){ return dd.JDEPUIS>=14; }).sort(function(a,b){ return b.JDEPUIS-a.JDEPUIS; });
    let vraisDormantsTop = vraisDormantsTous.slice(0,10);
    let vraisDormantsReste = vraisDormantsTous.slice(10);
    let surStockTous = stockAvecQte.filter(function(p){ return IA_qty(p)>=20; }).map(function(p){
      let code = IA_code(p); let jDepuis = derniereVente[code] ? Math.floor((now-derniereVente[code])/86400000) : 999;
      return { CODE: code, DES: p.Designation||p.designation||p.Nom||'', QTE: IA_qty(p), PA: IA_pa(p), VALEUR: IA_qty(p)*IA_pa(p), JDEPUIS: jDepuis };
    }).filter(function(dd){ return dd.JDEPUIS<14; }).sort(function(a,b){ return b.VALEUR-a.VALEUR; });
    let surStockTop = surStockTous.slice(0,10);
    let surStockReste = surStockTous.slice(10);
    let dormants = stockAvecQte.filter(function(p){ return IA_qty(p) > 20; });
    let cashBloque = stockAvecQte.reduce(function(s,p){ return s + IA_qty(p) * IA_pa(p); },0);
    let valVente = stockAvecQte.reduce(function(s,p){ return s + IA_qty(p) * IA_pv(p); },0);
    let totalPcs = stockAvecQte.reduce(function(s,p){ return s + IA_qty(p); },0);
    let totalDettes = d.dettes.reduce(function(s,x){ return s + IA_num(x.reste ?? x.Reste ?? x.montant ?? 0); },0);
    if(totalDettes===0){ totalDettes = lignes.reduce(function(s,l){ return s+l.RESTE; },0); }
    let mapC = {};
    lignes.forEach(function(l){ let nom=String(l.CLIENT||'').trim(); if(!nom || /comptant/i.test(nom)) return; if(!mapC[nom]) mapC[nom]={nom:nom,total:0,nb:0,dernier:0}; mapC[nom].total+=l.TOTAL; mapC[nom].nb+=1; if(l.DATE>mapC[nom].dernier) mapC[nom].dernier=l.DATE; });
    let clients = Object.values(mapC).sort(function(a,b){ return b.total-a.total; });
    let aRelancer = clients.filter(function(c){ return c.dernier>0 && (now-c.dernier)/86400000 >= 14; });
    let vip = clients.filter(function(c){ return c.total>=200000 && c.nb>=5; });
    let mapV = {}; lignes.forEach(function(l){ let v=String(l.VENDEUR||'Inconnu'); if(!mapV[v]) mapV[v]={nom:v,total:0,nb:0}; mapV[v].total+=l.TOTAL; mapV[v].nb+=1; });
    let vendeurs = Object.values(mapV).sort(function(a,b){ return b.total-a.total; });
    let mapP = {}; lignes.forEach(function(l){ if(!l.CODE) return; if(!mapP[l.CODE]) mapP[l.CODE]={CODE:l.CODE,qte:0,total:0}; mapP[l.CODE].qte+=l.QTE; mapP[l.CODE].total+=l.TOTAL; });
    let topP = Object.values(mapP).sort(function(a,b){ return b.qte-a.qte; })[0] || {CODE:'-',qte:0};
    let first = stockAvecQte[0] || {};
    let debug = '<div style="margin-top:12px;font-size:10px;color:#888;border-top:1px solid #eee;padding-top:6px">Vérif IA vs ton onglet Stock : Stock IA = '+stockAvecQte.length+' réf / '+totalPcs+' pcs | Valeur Achat IA = '+IA_fmt(cashBloque)+' (attendu ~3 135 245 FC) | Valeur Vente IA = '+IA_fmt(valVente)+' (attendu ~4 662 350 FC) | Ex. 1er : '+IA_esc(IA_code(first))+' Qté IA='+IA_qty(first)+' PA IA='+IA_pa(first)+' PV IA='+IA_pv(first)+' (attendu AD00 : Qté 4, PA 700, PV 1000)</div>';
    return { d:d, stock:stock, lignes:lignes, now:now, ca:ca, stockAvecQte:stockAvecQte, rupturesToutes:rupturesToutes, ruptures:ruptures, totalCout7:totalCout7, totalCout30:totalCout30, dormantsDetail:dormantsDetail, vraisDormantsTous:vraisDormantsTous, vraisDormantsTop:vraisDormantsTop, vraisDormantsReste:vraisDormantsReste, surStockTous:surStockTous, surStockTop:surStockTop, surStockReste:surStockReste, dormants:dormants, cashBloque:cashBloque, valVente:valVente, totalPcs:totalPcs, totalDettes:totalDettes, clients:clients, aRelancer:aRelancer, vip:vip, vendeurs:vendeurs, topP:topP, debug:debug };
  }
  window.IA_buildContext=IA_buildContext;
})();
