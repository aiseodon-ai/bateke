// ia-clients.js - V2.4 - DIRECTEUR COMMERCIAL
// Règles : On reconstruit depuis ventes, Comptoir exclu, Fusion même nom
// V2.4 - DETTE : v.reste est déjà le vrai reste, comme dans le tableau Dettes. On ne soustrait PLUS paiementsDette, sinon on compte 2 fois.
(function(){
  window.IA_render_clients = function(c){
    let nowTs = c?.now || Date.now();
    let now = new Date(nowTs);
    let gf = {};
    try{ gf = (typeof getFiltered==='function' ? getFiltered() : null) || {}; }catch(e){ gf={}; }
    let ventesBrutes = gf.ventes || [];
    let stockBrut = gf.stock || c?.stock || [];
    let fullMap = {};
    stockBrut.forEach(function(p){ let code = p.CODE || p._id; if(code) fullMap[String(code)] = p; });
    function normPhone(raw){
      let s = String(raw||'').replace(/[^0-9]/g,'');
      if(s.length===9 && s[0]==='0') s = '243' + s.slice(1);
      if(s.length===10 && s[0]==='0') s = '243' + s.slice(1);
      return s;
    }
    function cleVente(v){
      let co = v.client;
      let nom = '';
      let phone = '';
      if(co && typeof co === 'object'){
        nom = String(co.nom || '').trim();
        phone = normPhone(co.tel || co.telephone || co.phone || '');
      } else if(typeof co === 'string' && co !== '[Object Object]'){
        nom = co.trim();
      }
      if(!nom) nom = String(v.clientNom || v.nomClient || '').trim();
      if(!phone) phone = normPhone(v.phone || v.telephone || v.tel || v.clientPhone || '');
      if(!nom) return null;
      let nLow = nom.toLowerCase();
      if(nLow.includes('comptant') || nLow.includes('comptoir') || nom === '[object object]') return null;
      let cle = phone ? 'TEL:'+phone : 'NOM:'+nLow;
      return {cle:cle, nom:nom, phone:phone};
    }
    let mapClients = {};
    ventesBrutes.forEach(function(v){
      let info = cleVente(v);
      if(!info) return;
      if(!mapClients[info.cle]) mapClients[info.cle] = {
        nom: info.nom, phone: info.phone, telephone: info.phone, tel: info.phone,
        total: 0, nb: 0, dernier: 0, anniversaire: '', dette: 0, produits: {}
      };
      let cl = mapClients[info.cle];
      let totalV = IA_num(v.total ?? v.montant ?? v.montantTotal ?? 0);
      if(totalV===0 && v.items){
        v.items.forEach(function(it){ totalV += IA_num(it.qty ?? it.QTE ?? 0) * IA_num(it.Prix ?? it.prix ?? 0); });
      }
      cl.total += totalV;
      cl.nb += 1;
      let dV = new Date(v.date ?? v.dateVente ?? v.createdAt ?? v.timestamp ?? 0).getTime();
      if(!isNaN(dV) && dV > cl.dernier) cl.dernier = dV;
      let annivV = '';
      if(v.client && typeof v.client === 'object') annivV = v.client.anniversaire || v.client.birthday || '';
      if(!annivV) annivV = v.anniversaire || '';
      if(annivV && !cl.anniversaire) cl.anniversaire = annivV;
      // ✅ V2.4 - DETTE = v.reste, POINT. C'est exactement ce que fait le tableau Dettes.
      // Ex makila : v.reste = 200, donc dette = 200. On ne soustrait rien d'autre.
      // Ex Monsantu : v.reste = 0, donc dette = 0. On n'invente pas de dette.
      // Avant V2.3 : on faisait reste - paiementsDette, donc makila 200 - 800 = 0, faux.
      // Avant V2.3 bis : on faisait si payé=0 alors dette=total, donc Monsantu 10 000, faux.
      // Après : on lit v.reste, et si v.reste n'existe pas du tout, on calcule total - payé - paiementsDette, une seule fois.
      let aReste = (v.reste !== undefined && v.reste !== null) || (v.Reste !== undefined && v.Reste !== null);
      let reste = 0;
      if(aReste){
        reste = IA_num(v.reste ?? v.Reste ?? 0);
      } else {
        let payeV = IA_num(v.paye ?? v.Payé ?? v.montantPaye ?? 0);
        let arrDette=[];
        if(v.paiementsDette){
          if(Array.isArray(v.paiementsDette)) arrDette=v.paiementsDette;
          else if(typeof v.paiementsDette==='object') arrDette=Object.values(v.paiementsDette);
        }
        let payeDetteVente=0;
        arrDette.forEach(function(p){ payeDetteVente += IA_num(p.montant||0); });
        reste = Math.max(0, totalV - payeV - payeDetteVente);
      }
      cl.dette += Math.max(0, reste);
      (v.items||[]).forEach(function(it){
        let code = String(it.CODE || it.code || '');
        if(!code) return;
        let qty = IA_num(it.qty ?? it.QTE ?? 0);
        let prix = IA_num(it.Prix ?? it.prix ?? 0);
        let des = it.Designation || it.designation || (fullMap[code] ? (fullMap[code].Designation||fullMap[code].designation||'') : '') || code;
        if(!cl.produits[code]) cl.produits[code] = {CODE:code, Des:des, qty:0, total:0};
        cl.produits[code].qty += qty;
        cl.produits[code].total += qty * prix;
      });
    });
    // Fusion même nom avec / sans téléphone = 1 seul makila
    let fusion = {};
    Object.values(mapClients).forEach(function(cl){
      let cleNom = 'NOM:' + String(cl.nom||'').trim().toLowerCase();
      let deja = fusion[cleNom];
      if(deja){
        deja.total += IA_num(cl.total||0);
        deja.nb += IA_num(cl.nb||0);
        deja.dette += IA_num(cl.dette||0);
        if((cl.dernier||0) > (deja.dernier||0)) deja.dernier = cl.dernier;
        if(!deja.phone && cl.phone) { deja.phone = cl.phone; deja.telephone = cl.phone; deja.tel = cl.phone; }
        for(let code in (cl.produits||{})){
          if(!deja.produits[code]) deja.produits[code] = cl.produits[code];
          else { deja.produits[code].qty += cl.produits[code].qty; deja.produits[code].total += cl.produits[code].total; }
        }
        if(!deja.anniversaire && cl.anniversaire) deja.anniversaire = cl.anniversaire;
      } else {
        fusion[cleNom] = cl;
      }
    });
    let clients = Object.values(fusion);
    function cleClient(cl){
      let phoneClean = normPhone(cl.phone || cl.telephone || cl.tel || '');
      if(phoneClean) return 'TEL:' + phoneClean;
      return 'NOM:' + String(cl.nom||'').trim().toLowerCase();
    }
    function prochainAnniv(cl){
      let raw = cl.anniversaire || cl.birthday || cl.dateNaissance || cl.naissance || cl.anniv || '';
      if(!raw) return {txt:'-', jours:999, date:null, jourMois:''};
      let d = new Date(raw);
      if(isNaN(d.getTime()) && typeof raw==='string' && raw.includes('/')){
        let parts = raw.split('/');
        if(parts.length>=2){
          let jj = parseInt(parts[0],10), mm = parseInt(parts[1],10)-1;
          d = new Date(now.getFullYear(), mm, jj);
        }
      }
      if(!d || isNaN(d.getTime())) return {txt:'-', jours:999, date:null, jourMois:''};
      let jourMois = d.toLocaleDateString('fr-FR', {day:'2-digit', month:'long'});
      let prochain = new Date(now.getFullYear(), d.getMonth(), d.getDate());
      prochain.setHours(0,0,0,0);
      let today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if(prochain < today0) prochain = new Date(now.getFullYear()+1, d.getMonth(), d.getDate());
      let jours = Math.floor((prochain - today0)/86400000);
      let txt = d.toLocaleDateString('fr-FR');
      return {txt:txt, jours:jours, date:prochain, jourMois:jourMois};
    }
    let enrichis = clients.map(function(cl){
      let j = cl.dernier>0 ? Math.floor((nowTs - cl.dernier)/86400000) : 999;
      let anniv = prochainAnniv(cl);
      let detteClient = IA_num(cl.dette||0);
      let produitsArr = Object.values(cl.produits || {});
      produitsArr.sort(function(a,b){ return (b.qty - a.qty) || (b.total - a.total); });
      let produitPref = produitsArr[0] || null;
      let produitPrefTxt = produitPref ? produitPref.Des+' ('+produitPref.qty+'x)' : 'votre produit préféré';
      let statut = '', statutCode = '';
      if(cl.total>=200000 && cl.nb>=5 && j>=14){ statut = '👑 VIP EN DANGER'; statutCode = 'vip_danger'; }
      else if(cl.total>=200000 && cl.nb>=5){ statut = '👑 VIP'; statutCode = 'vip'; }
      else if(detteClient>0 && j>=14){ statut = '💳 DETTE À RÉCUPÉRER'; statutCode = 'dette'; }
      else if(anniv.jours===0){ statut = '🎂 ANNIVERSAIRE AUJOURD\'HUI'; statutCode = 'anniv_jour'; }
      else if(anniv.jours<=7){ statut = '🎂 ANNIVERSAIRE DANS '+anniv.jours+'J'; statutCode = 'anniv_proche'; }
      else if(j>=21){ statut = '⚠️ EN TRAIN DE PARTIR'; statutCode = 'partir'; }
      else if(j>=14){ statut = '📞 À RELANCER'; statutCode = 'relancer'; }
      else if(cl.nb===1){ statut = '🌱 NOUVEAU'; statutCode = 'nouveau'; }
      else if(cl.nb>=10){ statut = '❤️ FIDÈLE'; statutCode = 'fidele'; }
      else { statut = 'NORMAL'; statutCode = 'normal'; }
      let msg = '';
      let prodTxt = produitPref ? produitPref.Des : 'votre produit préféré';
      if(detteClient>0) msg = 'Bonjour '+cl.nom+', j\'espère que vous allez bien 🙂 Petit rappel : il vous reste '+IA_fmt(detteClient)+' à régler chez nous. Passez nous voir cette semaine, on vous réserve '+prodTxt+' en stock.';
      else if(statutCode==='vip_danger') msg = 'Bonjour '+cl.nom+', merci pour votre fidélité 👑 Vous nous manquez depuis '+j+' jours. On a gardé '+prodTxt+' pour vous. Passez nous voir, -10% VIP pour vous cette semaine.';
      else if(statutCode==='vip') msg = 'Bonjour '+cl.nom+', merci pour votre fidélité 👑 Vous êtes notre client VIP. -5% sur '+prodTxt+' cette semaine.';
      else if(statutCode==='anniv_jour') msg = '🎂 Joyeux Anniversaire '+cl.nom+' ! Toute l\'équipe Menkao vous souhaite une belle journée. Passez nous voir, un petit cadeau vous attend 🎁';
      else if(statutCode==='anniv_proche') msg = 'Bonjour '+cl.nom+' 🙂 Votre anniversaire arrive dans '+anniv.jours+' jours ! On vous prépare une petite surprise. Passez nous voir cette semaine.';
      else if(statutCode==='partir') msg = 'Bonjour '+cl.nom+', ça fait '+j+' jours 🙂 On a gardé '+prodTxt+' pour vous. Passez nous voir, -5% pour vous cette semaine.';
      else if(statutCode==='relancer') msg = 'Bonjour '+cl.nom+', on pense à vous 🙂 Vous avez besoin de '+prodTxt+' cette semaine ? On est là.';
      else if(statutCode==='nouveau') msg = 'Bonjour '+cl.nom+', merci pour votre 1er achat 🙏 Revenez nous voir, on vous réserve une petite surprise.';
      else if(statutCode==='fidele') msg = 'Bonjour '+cl.nom+', merci pour vos '+cl.nb+' achats ❤️ Cadeau pour vous : 1 petit accessoire offert sur votre prochaine visite.';
      else msg = 'Bonjour '+cl.nom+' 🙂 Merci pour votre fidélité. Passez nous voir cette semaine, '+prodTxt+' est en stock.';
      let phoneClean = normPhone(cl.phone || cl.telephone || cl.tel || '');
      let waLink = phoneClean ? 'https://wa.me/'+phoneClean+'?text='+encodeURIComponent(msg) : 'https://wa.me/?text='+encodeURIComponent(msg);
      return {cl:cl, j:j, anniv:anniv, statut:statut, statutCode:statutCode, msg:msg, phoneClean:phoneClean, waLink:waLink, dette:detteClient, produitPref:produitPref, produitPrefTxt:produitPrefTxt, cle:cleClient(cl)};
    });
    let ordre = {vip_danger:0, dette:1, anniv_jour:2, anniv_proche:3, partir:4, relancer:5, vip:6, fidele:7, nouveau:8, normal:9};
    enrichis.sort(function(a,b){ let oa = ordre[a.statutCode] ?? 9, ob = ordre[b.statutCode] ?? 9; if(oa!==ob) return oa - ob; return (b.cl.total||0) - (a.cl.total||0); });
    let vip = enrichis.filter(function(e){ return e.statutCode==='vip' || e.statutCode==='vip_danger'; });
    let aRelancer = enrichis.filter(function(e){ return e.statutCode==='partir' || e.statutCode==='relancer'; });
    let annivSemaine = enrichis.filter(function(e){ return e.anniv.jours<=7; });
    let avecDette = enrichis.filter(function(e){ return e.dette>0; });
    let totalDettesClients = enrichis.reduce(function(s,e){ return s + e.dette; },0);
    let totalCAClients = enrichis.reduce(function(s,e){ return s + IA_num(e.cl.total||0); },0);
    let resumeHtml = '<div style="background:#f8fafc;padding:10px;border-radius:10px;margin-bottom:10px">❤️ <b>FIDÉLITÉ :</b> '+enrichis.length+' clients analysés | CA Clients = <b>'+IA_fmt(totalCAClients)+'</b><br>👑 VIP : <b>'+vip.length+'</b> | 📞 À relancer (14j+) : <b>'+aRelancer.length+'</b> | 💳 Dettes clients : <b style="color:#ef4444">'+IA_fmt(totalDettesClients)+'</b> ('+avecDette.length+' clients) | 🎂 Anniversaires cette semaine : <b>'+annivSemaine.length+'</b><br><span style="font-size:11px;color:#555">Un Directeur Commercial ne confond jamais 2 clients qui ont le même nom, il connaît le produit préféré de chacun, et il récupère les dettes avant de faire des promos.</span></div>';
    let alerteAnnivHtml = '';
    if(annivSemaine.length){ alerteAnnivHtml = '<div style="background:#fef3c7;padding:12px;border-radius:12px;margin-bottom:10px"><b>🎂 ANNIVERSAIRES À SOUHAITER CETTE SEMAINE :</b><br>' + annivSemaine.map(function(e){ return '• <b>'+IA_esc(e.cl.nom)+'</b> ('+IA_esc(e.phoneClean||'')+') : '+e.anniv.jourMois+' (dans '+e.anniv.jours+'j) - Produit préféré : '+IA_esc(e.produitPrefTxt)+' - <a href="'+e.waLink+'" target="_blank" style="color:#0b5e2f"><b>Envoyer 🎂</b></a>'; }).join('<br>') + '</div>'; }
    let rows = enrichis.slice(0,50).map(function(e){
      let cl = e.cl;
      let annivCell = '';
      if(e.anniv.jours===999) annivCell = '<span style="color:#999">- <br><small>+ Ajouter</small></span>';
      else if(e.anniv.jours===0) annivCell = '<b style="background:#fef3c7;padding:3px 8px;border-radius:8px">🎂 AUJOURD\'HUI<br>'+e.anniv.jourMois+'</b><br><small>'+e.anniv.txt+'</small>';
      else if(e.anniv.jours<=7) annivCell = '<b style="color:#d97706">🎂 Dans '+e.anniv.jours+'j<br>'+e.anniv.jourMois+'</b><br><small>'+e.anniv.txt+'</small>';
      else if(e.anniv.jours<=30) annivCell = 'Dans '+e.anniv.jours+'j<br><small>'+e.anniv.jourMois+' ('+e.anniv.txt+')</small>';
      else annivCell = e.anniv.jourMois+'<br><small>'+e.anniv.txt+'</small>';
      let nomAffiche = '<b>'+IA_esc(cl.nom)+'</b><br><small>'+IA_esc(e.phoneClean || cl.phone || cl.telephone || '')+'</small>';
      if(enrichis.filter(function(x){ return String(x.cl.nom||'').toLowerCase()===String(cl.nom||'').toLowerCase(); }).length>1){ nomAffiche = '<b>'+IA_esc(cl.nom)+'</b> <span style="background:#fee2e2;padding:2px 6px;border-radius:6px;font-size:10px">⚠️ Homonyme</span><br><small>'+IA_esc(e.phoneClean || cl.phone || cl.telephone || '')+'</small>'; }
      return '<tr><td>'+nomAffiche+'</td><td>'+annivCell+'</td><td>'+e.statut+'</td><td>'+IA_fmt(cl.total)+'<br>'+cl.nb+' achats</td><td style="color:'+(e.dette>0?'#ef4444':'#111')+'"><b>'+(e.dette>0?IA_fmt(e.dette):'0')+'</b><br><small>Dette</small></td><td><b>'+IA_esc(e.produitPrefTxt)+'</b></td><td>'+(e.j===999 ? '-' : e.j+'j')+'</td><td><a href="'+e.waLink+'" target="_blank" style="background:#25D366;color:#fff;padding:5px 10px;border-radius:8px;text-decoration:none">📱 WhatsApp</a><br><small style="font-size:11px;color:#555">'+IA_esc(e.msg.substring(0,70))+'...</small></td></tr>';
    }).join('');
    let tableauHtml = '<h4>❤️ CLIENTS / FIDÉLITÉ</h4>' + alerteAnnivHtml + '<div style="overflow:auto"><table><tr><th>Client</th><th>🎂 Anniversaire</th><th>Statut IA</th><th>Total / Nb</th><th>💳 Dette</th><th>⭐ Produit Préféré</th><th>Dernier</th><th>Action</th></tr>' + rows + (enrichis.length===0 ? '<tr><td colspan="8">Aucun client avec nom.</td></tr>' : '') + '</table></div>' + '<p style="font-size:12px;color:#555"><b>Conseil du jour :</b> '+(avecDette.length>0 ? 'Récupère d\'abord <b>'+IA_fmt(totalDettesClients)+'</b> de dettes chez '+avecDette.length+' clients avant de faire des promos.' : aRelancer.length>0 ? 'Appelle d\'abord <b>'+IA_esc(aRelancer[0].cl.nom)+'</b>, il est en train de partir depuis '+aRelancer[0].j+' jours.' : annivSemaine.length>0 ? 'Souhaite l\'anniversaire de <b>'+IA_esc(annivSemaine[0].cl.nom)+'</b> aujourd\'hui.' : 'Aucun client en danger. Concentre-toi sur tes VIP.')+'</p>';
    return resumeHtml + tableauHtml + (c?.debug || '');
  };
})();
