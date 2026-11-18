// IA LOCALE BATEKE V1 - 7 MODULES - 0$ - LECTURE SEULE - AUCUNE ECRITURE FIREBASE
(function(){
  function IA_num(v){ let n = Number(v); return isNaN(n)?0:n; }
  function IA_esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function IA_fmt(n){ return Math.round(n).toLocaleString('fr-FR')+' FC'; }
  function IA_time(v){
    if(!v) return 0;
    if(typeof v==='number') return v>1000000000000?v:v*1000;
    let t = new Date(v).getTime(); return isNaN(t)?0:t;
  }
  // Lecture défensive : essaie toutes les sources existantes sans les modifier
  function IA_getData(){
    let d = {};
    try{ if(window.STATE) d = window.STATE; }catch(e){}
    try{ if(window.DATA) d = window.DATA; }catch(e){}
    try{ if(typeof window.getFiltered==='function'){ let f = window.getFiltered(); if(f) d = Object.assign({}, d, f); } }catch(e){}
    // Normalisation : accepte tableau ou objet Firebase
    function toArr(x){ if(Array.isArray(x)) return x; if(x && typeof x==='object') return Object.values(x); return []; }
    return {
      stock: toArr(d.stock || d.STOCK || []),
      ventes: toArr(d.ventes || d.VENTES || d.sales || []),
      caisse: toArr(d.caisse || d.CAISSE || []),
      dettes: toArr(d.dettes || d.DETTES || []),
      clients: toArr(d.clients || d.CLIENTS || []),
      vendeurs: toArr(d.vendeurs || d.VENDEURS || [])
    };
  }
  // Ventes : dans ton app une vente peut être {items:[{CODE,QTE,Total}]} ou ligne plate {CODE,QTE,total}
  function IA_ventesLignes(ventes){
    let lignes = [];
    ventes.forEach(function(v){
      let items = v.items || v.lignes || v.produits || null;
      if(Array.isArray(items)){
        items.forEach(function(it){ lignes.push({ CODE: it.CODE||it.code||'', QTE: IA_num(it.QTE||it.qte||it.Quantite||1), TOTAL: IA_num(it.Total||it.total||it.montant||0), DATE: IA_time(v.date||v.Date||v.created||v.timestamp), VENDEUR: v.vendeur||v.Vendeur||'', CLIENT: v.client||v.Client||v.nomClient||'', PAYE: IA_num(v.paye||v.Paye||v.total||0), RESTE: IA_num(v.reste||v.Reste||0) }); });
      } else {
        lignes.push({ CODE: v.CODE||v.code||'', QTE: IA_num(v.QTE||v.qte||v.Quantite||1), TOTAL: IA_num(v.total||v.Total||v.montant||0), DATE: IA_time(v.date||v.Date||v.created||v.timestamp), VENDEUR: v.vendeur||v.Vendeur||'', CLIENT: v.client||v.Client||v.nomClient||'', PAYE: IA_num(v.paye||v.Paye||0), RESTE: IA_num(v.reste||v.Reste||0) });
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
      // Agrégats de base - mêmes champs que ton stable : CODE, Quantite, PV, PA, Categorie
      let ca = lignes.reduce(function(s,l){ return s+l.TOTAL; },0);
      let ruptures = stock.filter(function(p){ return IA_num(p.Quantite ?? p.QTE ?? p.qte) <= 0; });
      let dormants = stock.filter(function(p){ return IA_num(p.Quantite ?? p.QTE ?? p.qte) > 20; });
      let cashBloque = stock.reduce(function(s,p){ return s + IA_num(p.Quantite ?? p.QTE ?? p.qte) * IA_num(p['Prix Achat'] ?? p.PA ?? p.pa); },0);
      let totalDettes = d.dettes.reduce(function(s,x){ return s + IA_num(x.reste ?? x.Reste ?? x.RESTE ?? x.montant ?? 0); },0);
      // Clients : depuis lignes ventes + table clients
      let mapC = {};
      lignes.forEach(function(l){
        let nom = String(l.CLIENT||'').trim(); if(!nom || /comptant/i.test(nom)) return;
        if(!mapC[nom]) mapC[nom]={nom:nom,total:0,nb:0,dernier:0,phone:''};
        mapC[nom].total+=l.TOTAL; mapC[nom].nb+=1; if(l.DATE>mapC[nom].dernier) mapC[nom].dernier=l.DATE;
      });
      let clients = Object.values(mapC).sort(function(a,b){ return b.total-a.total; });
      let aRelancer = clients.filter(function(c){ return (now-c.dernier)/86400000 >= 14; });
      let vip = clients.filter(function(c){ return c.total>=200000 && c.nb>=5; });
      // Vendeurs
      let mapV = {};
      lignes.forEach(function(l){ let v = String(l.VENDEUR||'Inconnu'); if(!mapV[v]) mapV[v]={nom:v,total:0,nb:0}; mapV[v].total+=l.TOTAL; mapV[v].nb+=1; });
      let vendeurs = Object.values(mapV).sort(function(a,b){ return b.total-a.total; });
      // Top / dormant par QTE vendue
      let mapP = {};
      lignes.forEach(function(l){ if(!l.CODE) return; if(!mapP[l.CODE]) mapP[l.CODE]={CODE:l.CODE,qte:0,total:0}; mapP[l.CODE].qte+=l.QTE; mapP[l.CODE].total+=l.TOTAL; });
      let topP = Object.values(mapP).sort(function(a,b){ return b.qte-a.qte; })[0] || {CODE:'-',qte:0};

      let html = '';
      if(module==='conseil'){
        html = '<h4>⭐ CONSEIL DU JOUR</h4><p>🔴 <b>1. Ruptures :</b> '+ruptures.length+' articles à 0. Tu perds des ventes.<br>🟡 <b>2. Cash bloqué :</b> '+IA_fmt(cashBloque)+' dans le stock, dont '+dormants.length+' articles à +20 pcs qui dorment.<br>❤️ <b>3. Clients :</b> '+aRelancer.length+' clients absents depuis 14j+ à relancer.<br>🎯 <b>Action :</b> '+(aRelancer[0] ? 'Appelle d’abord <b>'+IA_esc(aRelancer[0].nom)+'</b> ('+Math.floor((now-aRelancer[0].dernier)/86400000)+'j absent).' : 'Aucun client en danger. Concentre-toi sur tes VIP.')+'</p>';
      } else if(module==='marketing'){
        html = '<h4>📣 MARKETING</h4><p>⭐ <b>Star :</b> '+IA_esc(topP.CODE)+' - '+topP.qte+' vendus. Mets-le en avant à l’entrée.<br>💤 <b>Dormant :</b> Fais un pack : Star + 1 dormant à -10% pour vider le dormant.<br>🚫 Ne fais pas de pub sur un produit en rupture ('+ruptures.length+' en rupture).</p>';
      } else if(module==='tresorerie'){
        html = '<h4>💧 TRÉSORERIE</h4><p>💳 <b>Dettes clients :</b> '+IA_fmt(totalDettes)+' à récupérer.<br>💰 <b>Cash bloqué stock :</b> '+IA_fmt(cashBloque)+'.<br>Conseil : Récupère 2 dettes avant de commander du nouveau stock. Si caisse rouge, déstocke d’abord, ne commande pas.</p>';
      } else if(module==='compta'){
        let benefEst = lignes.reduce(function(s,l){ let p = stock.find(function(x){ return String(x.CODE)===String(l.CODE); }); let pa = p ? IA_num(p['Prix Achat'] ?? p.PA) : 0; return s + (l.TOTAL - l.QTE*pa); },0);
        html = '<h4>💼 COMPTA</h4><p>💰 <b>CA période :</b> '+IA_fmt(ca)+' sur '+lignes.length+' lignes.<br>📈 <b>Bénéf estimé :</b> '+IA_fmt(benefEst)+' (CA - PA x Qté).<br>⚠️ Vérifie les ventes à perte : si PV < PA, tu travailles pour rien. Garde marge > 20%.</p>';
      } else if(module==='rh'){
        let txt = vendeurs.map(function(v){ return v.nom+' : '+IA_fmt(v.total)+' ('+v.nb+' lignes)'; }).join('<br>') || 'Aucune vente avec vendeur.';
        html = '<h4>👥 RH / VENDEURS</h4><p>'+txt+'<br><br>Conseil : Mets le meilleur avec le plus faible 2 jours pour formation. Félicite le meilleur chaque fin de semaine.</p>';
      } else if(module==='clients'){
        let rows = clients.slice(0,20).map(function(c){
          let j = Math.floor((now-c.dernier)/86400000);
          let statut = (j>=21?'⚠️ EN TRAIN DE PARTIR':j>=14?'📞 À RELANCER':c.nb>=10?'❤️ FIDÈLE':'NORMAL');
          let msg = 'Bonjour '+c.nom+', ça fait '+j+' jours 🙂 On a gardé votre produit préféré pour vous. Passez nous voir, -5% pour vous cette semaine.';
          return '<tr><td><b>'+IA_esc(c.nom)+'</b></td><td>'+statut+'</td><td>'+IA_fmt(c.total)+'<br>'+c.nb+' achats</td><td>'+j+'j</td><td><a href="https://wa.me/?text='+encodeURIComponent(msg)+'" target="_blank" style="background:#25D366;color:#fff;padding:5px 10px;border-radius:8px;text-decoration:none">📱 WhatsApp</a></td></tr>';
        }).join('');
        html = '<h4>❤️ CLIENTS / FIDÉLITÉ</h4><p>👑 VIP : '+vip.length+' | 📞 À relancer (14j+) : '+aRelancer.length+' | Total clients : '+clients.length+'</p><div style="overflow:auto"><table><tr><th>Client</th><th>Statut IA</th><th>Total / Nb</th><th>Dernier</th><th>Action</th></tr>'+rows+'</table></div><p>Un client qui revient coûte 0 FC. Un nouveau coûte du temps. Sauve d’abord ceux qui partent.</p>';
      } else if(module==='audit'){
        let eff = lignes.length>0 ? Math.min(100, Math.round(50 + lignes.length)) : 0;
        html = '<h4>📊 AUDIT EFFICACITÉ</h4><p>Efficacité estimée : <b>'+eff+'%</b><br>🔴 Ruptures : '+ruptures.length+' = ventes perdues.<br>🟡 Dormants : '+dormants.length+' = cash bloqué.<br>❤️ Clients à relancer : '+aRelancer.length+'.<br>Objectif : Ruptures &lt; 5, Dormants en baisse chaque semaine, 0 client perdu sans appel.</p>';
      }
      el.innerHTML = html;
      let badge = document.getElementById('iaBadge'); if(badge){ badge.innerText = String(aRelancer.length + ruptures.length); }
    }catch(err){ el.innerHTML = '<p style="color:red">IA indisponible : '+IA_esc(err.message)+'. Tes autres onglets ne sont pas touchés.</p>'; }
  };
})();
