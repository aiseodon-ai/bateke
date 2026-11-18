// IA LOCALE BATEKE V1.2 - CORRIGEE SUR VRAIS CHAMPS MENKAO2 - LECTURE SEULE
(function(){
  function IA_num(v){ if(v==null||v==='') return 0; let s=String(v).replace(/\s/g,'').replace(',','.'); let n=Number(s); return isNaN(n)?0:n; }
  function IA_esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function IA_fmt(n){ return Math.round(n).toLocaleString('fr-FR')+' FC'; }
  function IA_time(v){
    if(!v) return 0;
    if(typeof v==='number') return v>1000000000000?v:v*1000;
    if(typeof v==='string'){ let m=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); if(m){ return new Date(Number(m[3]),Number(m[2])-1,Number(m[1])).getTime(); } let t=new Date(v).getTime(); return isNaN(t)?0:t; }
    if(typeof v==='object' && v.seconds) return v.seconds*1000;
    let t=new Date(v).getTime(); return isNaN(t)?0:t;
  }
  // === VRAIS CHAMPS MENKAO2 - D'APRES TON SCREENSHOT + TON DEBUG ===
  // Clés exactes : CODE, Categorie, Designation, EAN, PA, Prix, Prix Achat, Prix Unit, Quantite, seuil
  // On lit DIRECT, sans flou. Priorité : PA exact, sinon "Prix Achat", sinon "Prix Unit" = NON.
  function IA_qty(p){ if(!p) return 0; if(p.Quantite!=null && String(p.Quantite).trim()!=='') return IA_num(p.Quantite); if(p['Qté']!=null) return IA_num(p['Qté']); if(p.QTE!=null) return IA_num(p.QTE); return 0; }
  function IA_pa(p){ if(!p) return 0; if(p.PA!=null && String(p.PA).trim()!=='' && IA_num(p.PA)!==0) return IA_num(p.PA); if(p['Prix Achat']!=null && IA_num(p['Prix Achat'])!==0) return IA_num(p['Prix Achat']); return IA_num(p.PA); }
  function IA_pv(p){ if(!p) return 0; if(p['Prix Unit']!=null && IA_num(p['Prix Unit'])!==0) return IA_num(p['Prix Unit']); if(p.Prix!=null && IA_num(p.Prix)!==0) return IA_num(p.Prix); if(p.PV!=null && IA_num(p.PV)!==0) return IA_num(p.PV); if(p['Prix Vente']!=null) return IA_num(p['Prix Vente']); return 0; }
  function IA_code(p){ if(!p) return ''; return String(p.CODE || p.Code || p.code || ''); }
  function IA_seuil(p){ if(!p) return 0; return IA_num(p.seuil ?? p.Seuil ?? p.SEUIL); }
  function IA_hasQty(p){ return p && (p.Quantite!=null || p['Qté']!=null || p.QTE!=null); }

  function IA_getData(){
    let d = {};
    try{ if(window.STATE) d = Object.assign({}, d, window.STATE); }catch(e){}
    try{ if(window.DATA) d = Object.assign({}, d, window.DATA); }catch(e){}
    try{ if(typeof window.getFiltered==='function'){ let f = window.getFiltered(); if(f) d = Object.assign({}, d, f); } }catch(e){}
    function toArr(x){ if(Array.isArray(x)) return x; if(x && typeof x==='object') return Object.values(x); return []; }
    return { stock: toArr(d.stock || d.STOCK || []), ventes: toArr(d.ventes || d.VENTES || d.sales || []), caisse: toArr(d.caisse || []), dettes: toArr(d.dettes || []), clients: toArr(d.clients || []), vendeurs: toArr(d.vendeurs || []) };
  }

  function IA_ventesLignes(ventes){
    let lignes = [];
    ventes.forEach(function(v){
      if(!v || typeof v!=='object') return;
      let items = v.items || v.lignes || v.produits || v.articles || null;
      let dateV = IA_time(v.date || v.Date || v.created || v.timestamp);
      let vendeurV = v.vendeur || v.Vendeur || ''; let clientV = v.client || v.Client || v.nomClient || '';
      if(Array.isArray(items)){
        items.forEach(function(it){ lignes.push({ CODE: String(it.CODE||it.code||''), QTE: IA_num(it.QTE||it.qte||it.Quantite||1), TOTAL: IA_num(it.Total||it.total||it.montant||0), DATE: dateV, VENDEUR: vendeurV, CLIENT: clientV, RESTE: IA_num(v.reste||v.Reste||0) }); });
      } else {
        lignes.push({ CODE: String(v.CODE||v.code||''), QTE: IA_num(v.QTE||v.qte||v.Quantite||1), TOTAL: IA_num(v.total||v.Total||v.montant||0), DATE: dateV, VENDEUR: vendeurV, CLIENT: clientV, RESTE: IA_num(v.reste||v.Reste||0) });
      }
    });
    return lignes;
  }

  window.IA_switch = function(module){
    let el = document.getElementById('iaContent'); if(!el) return;
    try{
      let d = IA_getData();
      let stock = d.stock, lignes = IA_ventesLignes(d.ventes);
      let now = Date.now();
      let ca = lignes.reduce(function(s,l){ return s+l.TOTAL; },0);
      let stockAvecQte = stock.filter(function(p){ return IA_hasQty(p); });
      let rupturesToutes = stockAvecQte.filter(function(p){ return IA_qty(p) <= 0; });
       // Vraie rupture = Qté 0 ET vendu dans les 30 derniers jours + proposition de réappro
      let limite30j = now - 30*86400000;
      let ventes30j = {}; lignes.forEach(function(l){ if(l.CODE && l.DATE>=limite30j){ if(!ventes30j[l.CODE]) ventes30j[l.CODE]=0; ventes30j[l.CODE]+=l.QTE; } });
      let ruptures = rupturesToutes.filter(function(p){ return ventes30j[IA_code(p)]>0; }).map(function(p){
        let code = IA_code(p); let q30 = ventes30j[code]||0; let vit = q30/30; let pa = IA_pa(p);
        let prop7 = Math.max(1, Math.ceil(vit*7)); let prop30 = Math.max(1, Math.ceil(vit*30));
        return { CODE: code, DES: p.Designation||p.designation||p.Nom||'', PA: pa, Q30: q30, VIT: vit, PROP7: prop7, PROP30: prop30, COUT7: prop7*pa, COUT30: prop30*pa };
      }).sort(function(a,b){ return b.Q30-a.Q30; });
      let totalCout7 = ruptures.reduce(function(s,r){ return s+r.COUT7; },0);
      let totalCout30 = ruptures.reduce(function(s,r){ return s+r.COUT30; },0);
      let dormants = stockAvecQte.filter(function(p){ return IA_qty(p) > 20; });
      // Cash bloqué = Somme(Qté x PA) - doit être proche de 3 135 245 FC sur Menkao2
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

      // DEBUG VERIFIABLE : on compare avec ton screenshot Stock
      let first = stockAvecQte[0] || {};
      let debug = '<div style="margin-top:12px;font-size:10px;color:#888;border-top:1px solid #eee;padding-top:6px">Vérif IA vs ton onglet Stock : Stock IA = '+stockAvecQte.length+' réf / '+totalPcs+' pcs | Valeur Achat IA = '+IA_fmt(cashBloque)+' (attendu ~3 135 245 FC) | Valeur Vente IA = '+IA_fmt(valVente)+' (attendu ~4 662 350 FC) | Ex. 1er : '+IA_esc(IA_code(first))+' Qté IA='+IA_qty(first)+' PA IA='+IA_pa(first)+' PV IA='+IA_pv(first)+' (attendu AD00 : Qté 4, PA 700, PV 1000)</div>';

      let html = '';
           if(module==='conseil'){
        let rowsR = ruptures.map(function(r){ return '<tr><td><b>'+IA_esc(r.CODE)+'</b><br><span style="font-size:11px;color:#555">'+IA_esc(r.DES)+'</span></td><td>'+IA_fmt(r.PA)+'</td><td>'+r.Q30+' pcs / 30j<br><span style="font-size:11px">'+r.VIT.toFixed(1)+' / jour</span></td><td><b>'+r.PROP7+' pcs</b><br><span style="font-size:11px">'+IA_fmt(r.COUT7)+'</span></td><td><b>'+r.PROP30+' pcs</b><br><span style="font-size:11px">'+IA_fmt(r.COUT30)+'</span></td></tr>'; }).join('') || '<tr><td colspan="5">Aucune vraie rupture. Bravo.</td></tr>';
        html = '<h4>⭐ CONSEIL DU JOUR</h4><p>🔴 <b>1. Ruptures :</b> '+ruptures.length+' vraies ruptures (sur '+rupturesToutes.length+' à 0).<br>🟡 <b>2. Cash bloqué :</b> '+IA_fmt(cashBloque)+' dont '+dormants.length+' articles à +20 pcs qui dorment.<br>❤️ <b>3. Clients :</b> '+aRelancer.length+' clients absents depuis 14j+ à relancer.</p><h4>🛒 COMMANDE URGENTE - RUPTURES RÉELLES</h4><div style="overflow:auto"><table><tr><th>Article</th><th>PA</th><th>Vitesse vente</th><th>Pour 7 jours</th><th>Pour 30 jours</th></tr>'+rowsR+'</table></div><p><b>Total à payer pour tenir 7 jours :</b> '+IA_fmt(totalCout7)+' | <b>Pour 30 jours :</b> '+IA_fmt(totalCout30)+'<br>🎯 <b>Action :</b> '+(ruptures[0] ? 'Commande d’abord <b>'+IA_esc(ruptures[0].CODE)+' - '+IA_esc(ruptures[0].DES)+'</b> : '+ruptures[0].PROP7+' pcs pour 7j ('+IA_fmt(ruptures[0].COUT7)+').' : 'Aucune rupture. Concentre-toi sur tes VIP.')+'</p>' + debug;
      } else if(module==='marketing'){
        html = '<h4>📣 MARKETING</h4><p>⭐ <b>Star :</b> '+IA_esc(topP.CODE)+' - '+topP.qte+' vendus.<br>💤 <b>Dormant :</b> Fais un pack : Star + 1 dormant à -10%.<br>🚫 Ruptures vraies : '+ruptures.length+' (ne fais pas de pub dessus).</p>' + debug;
      } else if(module==='tresorerie'){
        html = '<h4>💧 TRÉSORERIE</h4><p>💳 <b>Dettes :</b> '+IA_fmt(totalDettes)+' à récupérer.<br>💰 <b>Cash bloqué stock :</b> '+IA_fmt(cashBloque)+' (Valeur Achat).<br>Conseil : Récupère 2 dettes avant de commander.</p>' + debug;
      } else if(module==='compta'){
        let benefEst = lignes.reduce(function(s,l){ let p = stock.find(function(x){ return IA_code(x)===String(l.CODE); }); let pa = p ? IA_pa(p) : 0; return s + (l.TOTAL - l.QTE*pa); },0);
        html = '<h4>💼 COMPTA</h4><p>💰 <b>CA période :</b> '+IA_fmt(ca)+' sur '+lignes.length+' lignes.<br>📈 <b>Bénéf estimé :</b> '+IA_fmt(benefEst)+' (CA - PA x Qté).<br>⚠️ Garde marge > 20%.</p>' + debug;
      } else if(module==='rh'){
        let txt = vendeurs.map(function(v){ return IA_esc(v.nom)+' : '+IA_fmt(v.total)+' ('+v.nb+' lignes)'; }).join('<br>') || 'Aucune vente avec vendeur.';
        html = '<h4>👥 RH / VENDEURS</h4><p>'+txt+'<br><br>Conseil : Mets le meilleur avec le plus faible 2 jours pour formation.</p>' + debug;
      } else if(module==='clients'){
        let rows = clients.slice(0,20).map(function(c){ let j=c.dernier>0?Math.floor((now-c.dernier)/86400000):999; let statut=(j>=21?'⚠️ EN TRAIN DE PARTIR':j>=14?'📞 À RELANCER':c.nb>=10?'❤️ FIDÈLE':'NORMAL'); let msg='Bonjour '+c.nom+', ça fait '+j+' jours 🙂 On a gardé votre produit préféré pour vous. Passez nous voir, -5% pour vous cette semaine.'; return '<tr><td><b>'+IA_esc(c.nom)+'</b></td><td>'+statut+'</td><td>'+IA_fmt(c.total)+'<br>'+c.nb+' achats</td><td>'+(j===999?'-':j+'j')+'</td><td><a href="https://wa.me/?text='+encodeURIComponent(msg)+'" target="_blank" style="background:#25D366;color:#fff;padding:5px 10px;border-radius:8px;text-decoration:none">📱 WhatsApp</a></td></tr>'; }).join('');
        html = '<h4>❤️ CLIENTS / FIDÉLITÉ</h4><p>👑 VIP : '+vip.length+' | 📞 À relancer (14j+) : '+aRelancer.length+' | Total : '+clients.length+'</p><div style="overflow:auto"><table><tr><th>Client</th><th>Statut IA</th><th>Total / Nb</th><th>Dernier</th><th>Action</th></tr>'+rows+'</table></div>' + debug;
      } else if(module==='audit'){
        let eff = lignes.length>0 ? Math.min(100, Math.round(50 + lignes.length)) : 0;
        html = '<h4>📊 AUDIT EFFICACITÉ</h4><p>Efficacité : <b>'+eff+'%</b><br>🔴 Ruptures vraies : '+ruptures.length+'<br>🟡 Dormants : '+dormants.length+'<br>❤️ À relancer : '+aRelancer.length+'.</p>' + debug;
      }
      el.innerHTML = html;
      let badge = document.getElementById('iaBadge'); if(badge){ badge.innerText = String(aRelancer.length + ruptures.length); }
    }catch(err){ el.innerHTML = '<p style="color:red">IA indisponible : '+IA_esc(err.message)+'</p>'; }
  };
})();
