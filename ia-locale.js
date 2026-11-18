// IA LOCALE BATEKE V1.1 CORRIGEE - 7 MODULES - 0$ - LECTURE SEULE - AUCUNE ECRITURE FIREBASE
(function(){
  function IA_num(v){ if(v==null||v==='') return 0; let s=String(v).replace(/\s/g,'').replace(',','.'); let n=Number(s); return isNaN(n)?0:n; }
  function IA_esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function IA_fmt(n){ return Math.round(n).toLocaleString('fr-FR')+' FC'; }
  function IA_time(v){
    if(!v) return 0;
    if(typeof v==='number') return v>1000000000000?v:v*1000;
    if(typeof v==='string'){
      // Format FR 18/11/2026 ou 18/11/2026 14:52
      let m=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if(m){ return new Date(Number(m[3]),Number(m[2])-1,Number(m[1])).getTime(); }
      let t=new Date(v).getTime(); return isNaN(t)?0:t;
    }
    if(typeof v==='object' && v.seconds) return v.seconds*1000;
    let t=new Date(v).getTime(); return isNaN(t)?0:t;
  }
  // FIX CLE : ignore accents, casse, espaces, _ , -
  function IA_normKey(k){ return String(k||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,''); }
  function IA_pick(obj, mots){
    if(!obj || typeof obj!=='object') return undefined;
    for(let k of Object.keys(obj)){
      let nk = IA_normKey(k);
      for(let m of mots){ if(nk===m || nk.indexOf(m)===0 || nk.indexOf(m)>-1) return obj[k]; }
    }
    return undefined;
  }
  function IA_qty(p){ return IA_num(IA_pick(p, ['quantite','qte','qty','quant','stock','restant','dispo','solde'])); }
  function IA_hasQty(p){ return IA_pick(p, ['quantite','qte','qty','quant','stock','restant','dispo','solde']) !== undefined; }
  function IA_pa(p){ return IA_num(IA_pick(p, ['prixachat','pa','achat','cout','cost','prixa'])); }
  function IA_pv(p){ return IA_num(IA_pick(p, ['prixvente','pv','vente','prixv'])); }
  function IA_code(p){ let v = IA_pick(p, ['code','ref','reference','sku']); return v==null?'':String(v); }

  function IA_getData(){
    let d = {};
    try{ if(window.STATE) d = Object.assign({}, d, window.STATE); }catch(e){}
    try{ if(window.DATA) d = Object.assign({}, d, window.DATA); }catch(e){}
    try{ if(typeof window.getFiltered==='function'){ let f = window.getFiltered(); if(f) d = Object.assign({}, d, f); } }catch(e){}
    try{ if(window.STOCK) d.stock = window.STOCK; }catch(e){}
    try{ if(window.VENTES) d.ventes = window.VENTES; }catch(e){}
    function toArr(x){ if(Array.isArray(x)) return x; if(x && typeof x==='object') return Object.values(x); return []; }
    return {
      stock: toArr(d.stock || d.STOCK || d.Stock || []),
      ventes: toArr(d.ventes || d.VENTES || d.sales || []),
      caisse: toArr(d.caisse || d.CAISSE || []),
      dettes: toArr(d.dettes || d.DETTES || []),
      clients: toArr(d.clients || d.CLIENTS || []),
      vendeurs: toArr(d.vendeurs || d.VENDEURS || [])
    };
  }

  function IA_ventesLignes(ventes){
    let lignes = [];
    ventes.forEach(function(v){
      if(!v || typeof v!=='object') return;
      let items = v.items || v.lignes || v.produits || v.articles || null;
      let dateV = IA_time(IA_pick(v, ['date','created','timestamp','jour']) || v.date || v.Date);
      let vendeurV = IA_pick(v, ['vendeur','vendeuse','nomvendeur']) || v.vendeur || v.Vendeur || '';
      let clientV = IA_pick(v, ['client','nomclient','nom','customer']) || v.client || v.Client || '';
      if(Array.isArray(items)){
        items.forEach(function(it){
          lignes.push({ CODE: IA_code(it), QTE: IA_num(IA_pick(it, ['qte','quantite','qty','quant']) || 1), TOTAL: IA_num(IA_pick(it, ['total','montant','prix','soustotal']) || 0), DATE: dateV, VENDEUR: vendeurV, CLIENT: clientV, RESTE: IA_num(IA_pick(v, ['reste','restant','dette']) || 0) });
        });
      } else {
        lignes.push({ CODE: IA_code(v), QTE: IA_num(IA_pick(v, ['qte','quantite','qty','quant']) || 1), TOTAL: IA_num(IA_pick(v, ['total','montant','prix']) || 0), DATE: dateV, VENDEUR: vendeurV, CLIENT: clientV, RESTE: IA_num(IA_pick(v, ['reste','restant','dette']) || 0) });
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
      // CORRIGE : on ne compte en rupture que les articles qui ONT une quantité lisible
      let stockAvecQte = stock.filter(function(p){ return IA_hasQty(p); });
      let ruptures = stockAvecQte.filter(function(p){ return IA_qty(p) <= 0; });
      let dormants = stockAvecQte.filter(function(p){ return IA_qty(p) > 20; });
      let cashBloque = stockAvecQte.reduce(function(s,p){ return s + IA_qty(p) * IA_pa(p); },0);
      let totalDettes = d.dettes.reduce(function(s,x){ return s + IA_num(IA_pick(x, ['reste','restant','dette','montant']) || 0); },0);
      // Si dettes vides, on prend aussi le Reste des ventes
      if(totalDettes===0){ totalDettes = lignes.reduce(function(s,l){ return s+l.RESTE; },0); }

      let mapC = {};
      lignes.forEach(function(l){
        let nom = String(l.CLIENT||'').trim(); if(!nom || /comptant/i.test(nom)) return;
        if(!mapC[nom]) mapC[nom]={nom:nom,total:0,nb:0,dernier:0,phone:''};
        mapC[nom].total+=l.TOTAL; mapC[nom].nb+=1; if(l.DATE>mapC[nom].dernier) mapC[nom].dernier=l.DATE;
      });
      let clients = Object.values(mapC).sort(function(a,b){ return b.total-a.total; });
      let aRelancer = clients.filter(function(c){ return c.dernier>0 && (now-c.dernier)/86400000 >= 14; });
      let vip = clients.filter(function(c){ return c.total>=200000 && c.nb>=5; });

      let mapV = {};
      lignes.forEach(function(l){ let v = String(l.VENDEUR||'Inconnu'); if(!mapV[v]) mapV[v]={nom:v,total:0,nb:0}; mapV[v].total+=l.TOTAL; mapV[v].nb+=1; });
      let vendeurs = Object.values(mapV).sort(function(a,b){ return b.total-a.total; });

      let mapP = {};
      lignes.forEach(function(l){ if(!l.CODE) return; if(!mapP[l.CODE]) mapP[l.CODE]={CODE:l.CODE,qte:0,total:0}; mapP[l.CODE].qte+=l.QTE; mapP[l.CODE].total+=l.TOTAL; });
      let topP = Object.values(mapP).sort(function(a,b){ return b.qte-a.qte; })[0] || {CODE:'-',qte:0};

      // Petit debug en bas pour vérifier : si stock lu = 0, on le voit tout de suite
      let debug = '<div style="margin-top:12px;font-size:10px;color:#888;border-top:1px solid #eee;padding-top:6px">Debug IA : Stock lu = '+stock.length+' (avec Qté lisible = '+stockAvecQte.length+') | Ventes lues = '+lignes.length+' lignes | Ex. 1er article : '+(stock[0] ? IA_esc(Object.keys(stock[0]).join(', ')) : 'aucun')+'</div>';

      let html = '';
      if(module==='conseil'){
        html = '<h4>⭐ CONSEIL DU JOUR</h4><p>🔴 <b>1. Ruptures :</b> '+ruptures.length+' articles à 0. Tu perds des ventes.<br>🟡 <b>2. Cash bloqué :</b> '+IA_fmt(cashBloque)+' dans le stock, dont '+dormants.length+' articles à +20 pcs qui dorment.<br>❤️ <b>3. Clients :</b> '+aRelancer.length+' clients absents depuis 14j+ à relancer.<br>🎯 <b>Action :</b> '+(aRelancer[0] ? 'Appelle d’abord <b>'+IA_esc(aRelancer[0].nom)+'</b> ('+Math.floor((now-aRelancer[0].dernier)/86400000)+'j absent).' : 'Aucun client en danger. Concentre-toi sur tes VIP.')+'</p>' + debug;
      } else if(module==='marketing'){
        html = '<h4>📣 MARKETING</h4><p>⭐ <b>Star :</b> '+IA_esc(topP.CODE)+' - '+topP.qte+' vendus. Mets-le en avant à l’entrée.<br>💤 <b>Dormant :</b> Fais un pack : Star + 1 dormant à -10% pour vider le dormant.<br>🚫 Ne fais pas de pub sur un produit en rupture ('+ruptures.length+' en rupture).</p>' + debug;
      } else if(module==='tresorerie'){
        html = '<h4>💧 TRÉSORERIE</h4><p>💳 <b>Dettes clients :</b> '+IA_fmt(totalDettes)+' à récupérer.<br>💰 <b>Cash bloqué stock :</b> '+IA_fmt(cashBloque)+'.<br>Conseil : Récupère 2 dettes avant de commander du nouveau stock. Si caisse rouge, déstocke d’abord, ne commande pas.</p>' + debug;
      } else if(module==='compta'){
        let benefEst = lignes.reduce(function(s,l){ let p = stock.find(function(x){ return IA_code(x)===String(l.CODE); }); let pa = p ? IA_pa(p) : 0; return s + (l.TOTAL - l.QTE*pa); },0);
        html = '<h4>💼 COMPTA</h4><p>💰 <b>CA période :</b> '+IA_fmt(ca)+' sur '+lignes.length+' lignes.<br>📈 <b>Bénéf estimé :</b> '+IA_fmt(benefEst)+' (CA - PA x Qté).<br>⚠️ Vérifie les ventes à perte : si PV < PA, tu travailles pour rien. Garde marge > 20%.</p>' + debug;
      } else if(module==='rh'){
        let txt = vendeurs.map(function(v){ return IA_esc(v.nom)+' : '+IA_fmt(v.total)+' ('+v.nb+' lignes)'; }).join('<br>') || 'Aucune vente avec vendeur.';
        html = '<h4>👥 RH / VENDEURS</h4><p>'+txt+'<br><br>Conseil : Mets le meilleur avec le plus faible 2 jours pour formation. Félicite le meilleur chaque fin de semaine.</p>' + debug;
      } else if(module==='clients'){
        let rows = clients.slice(0,20).map(function(c){
          let j = c.dernier>0 ? Math.floor((now-c.dernier)/86400000) : 999;
          let statut = (j>=21?'⚠️ EN TRAIN DE PARTIR':j>=14?'📞 À RELANCER':c.nb>=10?'❤️ FIDÈLE':'NORMAL');
          let msg = 'Bonjour '+c.nom+', ça fait '+j+' jours 🙂 On a gardé votre produit préféré pour vous. Passez nous voir, -5% pour vous cette semaine.';
          return '<tr><td><b>'+IA_esc(c.nom)+'</b></td><td>'+statut+'</td><td>'+IA_fmt(c.total)+'<br>'+c.nb+' achats</td><td>'+(j===999?'-':j+'j')+'</td><td><a href="https://wa.me/?text='+encodeURIComponent(msg)+'" target="_blank" style="background:#25D366;color:#fff;padding:5px 10px;border-radius:8px;text-decoration:none">📱 WhatsApp</a></td></tr>';
        }).join('');
        html = '<h4>❤️ CLIENTS / FIDÉLITÉ</h4><p>👑 VIP : '+vip.length+' | 📞 À relancer (14j+) : '+aRelancer.length+' | Total clients : '+clients.length+'</p><div style="overflow:auto"><table><tr><th>Client</th><th>Statut IA</th><th>Total / Nb</th><th>Dernier</th><th>Action</th></tr>'+rows+'</table></div><p>Un client qui revient coûte 0 FC. Un nouveau coûte du temps. Sauve d’abord ceux qui partent.</p>' + debug;
      } else if(module==='audit'){
        let eff = lignes.length>0 ? Math.min(100, Math.round(50 + lignes.length)) : 0;
        html = '<h4>📊 AUDIT EFFICACITÉ</h4><p>Efficacité estimée : <b>'+eff+'%</b><br>🔴 Ruptures : '+ruptures.length+' = ventes perdues.<br>🟡 Dormants : '+dormants.length+' = cash bloqué.<br>❤️ Clients à relancer : '+aRelancer.length+'.<br>Objectif : Ruptures &lt; 5, Dormants en baisse chaque semaine, 0 client perdu sans appel.</p>' + debug;
      }
      el.innerHTML = html;
      let badge = document.getElementById('iaBadge'); if(badge){ badge.innerText = String(aRelancer.length + ruptures.length); }
    }catch(err){ el.innerHTML = '<p style="color:red">IA indisponible : '+IA_esc(err.message)+'. Tes autres onglets ne sont pas touchés.</p>'; }
  };
})();
