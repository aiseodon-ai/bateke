// ia-clients.js - V2.1 - DIRECTEUR COMMERCIAL - Fidélité + Anniversaire + Dette + Produit Préféré + Doublons Nom
// Règles : Lit c.clients + getFiltered().ventes pour produit préféré + dette | Ne touche à rien d'autre
// Aligné CRM + Caisse + Trésorerie : Dette = total - payé - paiementsDette | Nom/Tél depuis v.client objet
(function(){
  window.IA_render_clients = function(c){
    // ✅ CORRIGÉ - BUG [Object Object] vu en capture : c.clients a nom = objet
    // Dans IA_buildContext, on a fait {nom: v.client} alors que v.client = {nom, tel}
    // Donc ici on normalise TOUT : nom, téléphone, total, nb, dernier, anniversaire
    let clients = (c?.clients || []).map(function(clRaw){
      let cl = clRaw || {};
      let nom = '';
      if(typeof cl.nom === 'string') nom = cl.nom;
      else if(cl.nom && typeof cl.nom === 'object') nom = cl.nom.nom || cl.nom.name || '';
      else if(typeof cl.client === 'string') nom = cl.client;
      else if(cl.client && typeof cl.client === 'object') nom = cl.client.nom || '';
      if(!nom) nom = cl.nomClient || cl.clientNom || 'Inconnu';
      let phone = cl.phone || cl.telephone || cl.tel || '';
      if(!phone && cl.nom && typeof cl.nom === 'object') phone = cl.nom.tel || cl.nom.telephone || cl.nom.phone || '';
      if(!phone && cl.client && typeof cl.client === 'object') phone = cl.client.tel || cl.client.telephone || cl.client.phone || '';
      let total = IA_num(cl.total ?? cl.ca ?? cl.CA ?? cl.montantTotal ?? cl.totalAchats ?? 0);
      let nb = IA_num(cl.nb ?? cl.nombre ?? cl.nbr ?? cl.achats ?? cl.count ?? 0);
      return {
        nom: String(nom).trim(),
        phone: phone, telephone: phone, tel: phone,
        total: total,
        nb: nb,
        dernier: cl.dernier ?? cl.last ?? cl.derniere ?? 0,
        anniversaire: cl.anniversaire || cl.birthday || cl.dateNaissance || '',
        dette: cl.dette ?? cl.reste ?? 0
      };
    });
    let nowTs = c?.now || Date.now();
    let now = new Date(nowTs);

    // === 0. DONNÉES VENTES pour Produit Préféré + Dette réelle ===
    let gf = {};
    try{ gf = (typeof getFiltered==='function' ? getFiltered() : null) || {}; }catch(e){ gf={}; }
    let ventesBrutes = gf.ventes || [];
    let stockBrut = gf.stock || c?.stock || [];
    let fullMap = {};
    stockBrut.forEach(function(p){ let code = p.CODE || p._id; if(code) fullMap[String(code)] = p; });

    // === CORRECTION 4 : MÊME NOM, 2 NUMÉROS = 2 CLIENTS DIFFÉRENTS ===
    function cleClient(cl){
      let phoneRaw = cl.phone || cl.telephone || cl.tel || '';
      let phoneClean = String(phoneRaw).replace(/[^0-9]/g,'');
      if(phoneClean.length===9 && phoneClean[0]==='0') phoneClean = '243' + phoneClean.slice(1);
      if(phoneClean.length===10 && phoneClean[0]==='0') phoneClean = '243' + phoneClean.slice(1);
      if(phoneClean) return 'TEL:' + phoneClean;
      return 'NOM:' + String(cl.nom||'').trim().toLowerCase();
    }
    let clientsUniques = [];
    let vuCle = {};
    clients.forEach(function(cl){
      let cle = cleClient(cl);
      if(vuCle[cle]) {
        let ex = vuCle[cle];
        ex.total = IA_num(ex.total||0) + IA_num(cl.total||0);
        ex.nb = IA_num(ex.nb||0) + IA_num(cl.nb||0);
        if((cl.dernier||0) > (ex.dernier||0)) ex.dernier = cl.dernier;
        if(!ex.anniversaire && cl.anniversaire) ex.anniversaire = cl.anniversaire;
      } else {
        vuCle[cle] = cl;
        clientsUniques.push(cl);
      }
    });
    clients = clientsUniques;

    // === CORRECTION 2 + 3 : DETTE + PRODUIT PRÉFÉRÉ par client ===
    let parCle = {};
    ventesBrutes.forEach(function(v){
      // ✅ CORRIGÉ - COMPAT CRM : v.client est un OBJET {nom, tel}, pas une string
      let clientObj = v.client;
      let nomV = '';
      let phoneV = '';
      if(typeof clientObj === 'object' && clientObj){
        nomV = String(clientObj.nom || '').trim();
        phoneV = String(clientObj.tel || clientObj.telephone || clientObj.phone || '').replace(/[^0-9]/g,'');
      } else if(typeof clientObj === 'string'){
        nomV = clientObj.trim();
      }
      if(!nomV) nomV = String(v.clientNom || v.nomClient || '').trim();
      if(!phoneV) phoneV = String(v.phone || v.telephone || v.tel || v.clientPhone || '').replace(/[^0-9]/g,'');
      if(!nomV || nomV.toLowerCase().includes('comptant')) return;
      if(phoneV.length===9 && phoneV[0]==='0') phoneV = '243' + phoneV.slice(1);
      if(phoneV.length===10 && phoneV[0]==='0') phoneV = '243' + phoneV.slice(1);
      let cleV = phoneV ? 'TEL:'+phoneV : 'NOM:'+nomV.toLowerCase();
      if(!parCle[cleV]) parCle[cleV] = {dette:0, totalVentes:0, nbVentes:0, produits:{}};
      // ✅ CORRIGÉ - Total 0 FC en capture : on recalcule le vrai total depuis les ventes
      parCle[cleV].totalVentes += IA_num(v.total ?? 0);
      parCle[cleV].nbVentes += 1;
      let reste = IA_num(v.reste ?? v.Reste ?? 0);
      if(reste===0){
        let totalV = IA_num(v.total ?? 0);
        let payeV = IA_num(v.paye ?? v.Payé ?? v.paye ?? 0);
        if(totalV>0 && payeV>0 && payeV<totalV) reste = totalV - payeV;
      }
      // ✅ CORRIGÉ - COMPAT CAISSE / TRÉSORERIE / CRM : Paiements Dette
      let arrDette=[];
      if(v.paiementsDette){
        if(Array.isArray(v.paiementsDette)) arrDette=v.paiementsDette;
        else if(typeof v.paiementsDette==='object') arrDette=Object.values(v.paiementsDette);
      }
      let payeDetteVente=0;
      arrDette.forEach(function(p){ payeDetteVente += IA_num(p.montant||0); });
      reste = Math.max(0, reste - payeDetteVente);
      parCle[cleV].dette += Math.max(0, reste);
      (v.items||[]).forEach(function(it){
        let code = String(it.CODE || it.code || '');
        if(!code) return;
        let qty = IA_num(it.qty ?? it.QTE ?? 0);
        let prix = IA_num(it.Prix ?? it.prix ?? 0);
        let des = it.Designation || it.designation || (fullMap[code] ? (fullMap[code].Designation||fullMap[code].designation||'') : '') || code;
        if(!parCle[cleV].produits[code]) parCle[cleV].produits[code] = {CODE:code, Des:des, qty:0, total:0};
        parCle[cleV].produits[code].qty += qty;
        parCle[cleV].produits[code].total += qty * prix;
      });
    });

    // === 1. CALCUL ANNIVERSAIRE ===
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

    // === 2. ENRICHISSEMENT + STATUT ===
    let enrichis = clients.map(function(cl){
      let j = cl.dernier>0 ? Math.floor((nowTs - cl.dernier)/86400000) : 999;
      let anniv = prochainAnniv(cl);
      let cle = cleClient(cl);
      let infoVentes = parCle[cle] || {dette:0, totalVentes:0, nbVentes:0, produits:{}};
      if(!parCle[cle]){
        let cleNom = 'NOM:'+String(cl.nom||'').trim().toLowerCase();
        infoVentes = parCle[cleNom] || {dette:0, totalVentes:0, nbVentes:0, produits:{}};
      }
      // ✅ CORRIGÉ - Si c.clients a total = 0 mais ventes existent, on prend le vrai total des ventes
      if(IA_num(cl.total||0)===0 && infoVentes.totalVentes>0) cl.total = infoVentes.totalVentes;
      if(IA_num(cl.nb||0)===0 && infoVentes.nbVentes>0) cl.nb = infoVentes.nbVentes;
      let detteClient = IA_num(cl.dette ?? cl.reste ?? 0);
      if(detteClient===0) detteClient = infoVentes.dette;
      let produitsArr = Object.values(infoVentes.produits || {});
      produitsArr.sort(function(a,b){ return (b.qty - a.qty) || (b.total - a.total); });
      let produitPref = produitsArr[0] || null;
      let nomProduitPref = produitPref ? produitPref.Des : '';
      let produitPrefTxt = produitPref ? produitPref.Des+' ('+produitPref.qty+'x)' : 'votre produit préféré';

      let statut = '', statutCode = '';
      if(cl.total>=200000 && cl.nb>=5 && j>=14){
        statut = '👑 VIP EN DANGER'; statutCode = 'vip_danger';
      } else if(cl.total>=200000 && cl.nb>=5){
        statut = '👑 VIP'; statutCode = 'vip';
      } else if(detteClient>0 && j>=14){
        statut = '💳 DETTE À RÉCUPÉRER'; statutCode = 'dette';
      } else if(anniv.jours===0){
        statut = '🎂 ANNIVERSAIRE AUJOURD\'HUI'; statutCode = 'anniv_jour';
      } else if(anniv.jours<=7){
        statut = '🎂 ANNIVERSAIRE DANS '+anniv.jours+'J'; statutCode = 'anniv_proche';
      } else if(j>=21){
        statut = '⚠️ EN TRAIN DE PARTIR'; statutCode = 'partir';
      } else if(j>=14){
        statut = '📞 À RELANCER'; statutCode = 'relancer';
      } else if(cl.nb===1){
        statut = '🌱 NOUVEAU'; statutCode = 'nouveau';
      } else if(cl.nb>=10){
        statut = '❤️ FIDÈLE'; statutCode = 'fidele';
      } else {
        statut = 'NORMAL'; statutCode = 'normal';
      }
      let msg = '';
      let prodTxt = produitPref ? produitPref.Des : 'votre produit préféré';
      if(detteClient>0){
        msg = 'Bonjour '+cl.nom+', j\'espère que vous allez bien 🙂 Petit rappel : il vous reste '+IA_fmt(detteClient)+' à régler chez nous. Passez nous voir cette semaine, on vous réserve '+prodTxt+' en stock.';
      } else if(statutCode==='vip_danger') msg = 'Bonjour '+cl.nom+', merci pour votre fidélité 👑 Vous nous manquez depuis '+j+' jours. On a gardé '+prodTxt+' pour vous. Passez nous voir, -10% VIP pour vous cette semaine.';
      else if(statutCode==='vip') msg = 'Bonjour '+cl.nom+', merci pour votre fidélité 👑 Vous êtes notre client VIP. -5% sur '+prodTxt+' cette semaine.';
      else if(statutCode==='anniv_jour') msg = '🎂 Joyeux Anniversaire '+cl.nom+' ! Toute l\'équipe Menkao vous souhaite une belle journée. Passez nous voir, un petit cadeau vous attend 🎁';
      else if(statutCode==='anniv_proche') msg = 'Bonjour '+cl.nom+' 🙂 Votre anniversaire arrive dans '+anniv.jours+' jours ! On vous prépare une petite surprise. Passez nous voir cette semaine.';
      else if(statutCode==='partir') msg = 'Bonjour '+cl.nom+', ça fait '+j+' jours 🙂 On a gardé '+prodTxt+' pour vous. Passez nous voir, -5% pour vous cette semaine.';
      else if(statutCode==='relancer') msg = 'Bonjour '+cl.nom+', on pense à vous 🙂 Vous avez besoin de '+prodTxt+' cette semaine ? On est là.';
      else if(statutCode==='nouveau') msg = 'Bonjour '+cl.nom+', merci pour votre 1er achat 🙏 Revenez nous voir, on vous réserve une petite surprise.';
      else if(statutCode==='fidele') msg = 'Bonjour '+cl.nom+', merci pour vos '+cl.nb+' achats ❤️ Cadeau pour vous : 1 petit accessoire offert sur votre prochaine visite.';
      else msg = 'Bonjour '+cl.nom+' 🙂 Merci pour votre fidélité. Passez nous voir cette semaine, '+prodTxt+' est en stock.';

      let phoneRaw = cl.phone || cl.telephone || cl.tel || '';
      let phoneClean = String(phoneRaw).replace(/[^0-9]/g,'');
      if(phoneClean.length===9 && phoneClean[0]==='0') phoneClean = '243' + phoneClean.slice(1);
      if(phoneClean.length===10 && phoneClean[0]==='0') phoneClean = '243' + phoneClean.slice(1);
      let waLink = phoneClean ? 'https://wa.me/'+phoneClean+'?text='+encodeURIComponent(msg) : 'https://wa.me/?text='+encodeURIComponent(msg);
      return {cl:cl, j:j, anniv:anniv, statut:statut, statutCode:statutCode, msg:msg, phoneClean:phoneClean, waLink:waLink, dette:detteClient, produitPref:produitPref, produitPrefTxt:produitPrefTxt, cle:cle};
    });

    let ordre = {vip_danger:0, dette:1, anniv_jour:2, anniv_proche:3, partir:4, relancer:5, vip:6, fidele:7, nouveau:8, normal:9};
    enrichis.sort(function(a,b){
      let oa = ordre[a.statutCode] ?? 9, ob = ordre[b.statutCode] ?? 9;
      if(oa!==ob) return oa - ob;
      return (b.cl.total||0) - (a.cl.total||0);
    });

    let vip = enrichis.filter(function(e){ return e.statutCode==='vip' || e.statutCode==='vip_danger'; });
    let aRelancer = enrichis.filter(function(e){ return e.statutCode==='partir' || e.statutCode==='relancer'; });
    let annivSemaine = enrichis.filter(function(e){ return e.anniv.jours<=7; });
    let annivMois = enrichis.filter(function(e){ return e.anniv.jours<=30; });
    let avecDette = enrichis.filter(function(e){ return e.dette>0; });
    let totalDettesClients = enrichis.reduce(function(s,e){ return s + e.dette; },0);
    let totalCAClients = enrichis.reduce(function(s,e){ return s + IA_num(e.cl.total||0); },0);

    let resumeHtml = '<div style="background:#f8fafc;padding:10px;border-radius:10px;margin-bottom:10px">❤️ <b>FIDÉLITÉ :</b> '+enrichis.length+' clients analysés | CA Clients = <b>'+IA_fmt(totalCAClients)+'</b><br>👑 VIP : <b>'+vip.length+'</b> | 📞 À relancer (14j+) : <b>'+aRelancer.length+'</b> | 💳 Dettes clients : <b style="color:#ef4444">'+IA_fmt(totalDettesClients)+'</b> ('+avecDette.length+' clients) | 🎂 Anniversaires cette semaine : <b>'+annivSemaine.length+'</b><br><span style="font-size:11px;color:#555">Un Directeur Commercial ne confond jamais 2 clients qui ont le même nom, il connaît le produit préféré de chacun, et il récupère les dettes avant de faire des promos.</span></div>';

    let alerteAnnivHtml = '';
    if(annivSemaine.length){
      alerteAnnivHtml = '<div style="background:#fef3c7;padding:12px;border-radius:12px;margin-bottom:10px"><b>🎂 ANNIVERSAIRES À SOUHAITER CETTE SEMAINE :</b><br>'
        + annivSemaine.map(function(e){ return '• <b>'+IA_esc(e.cl.nom)+'</b> ('+IA_esc(e.phoneClean||'')+') : '+e.anniv.jourMois+' (dans '+e.anniv.jours+'j) - Produit préféré : '+IA_esc(e.produitPrefTxt)+' - <a href="'+e.waLink+'" target="_blank" style="color:#0b5e2f"><b>Envoyer 🎂</b></a>'; }).join('<br>')
        + '</div>';
    }

    let rows = enrichis.slice(0,50).map(function(e){
      let cl = e.cl;
      let annivCell = '';
      if(e.anniv.jours===999) annivCell = '<span style="color:#999">- <br><small>+ Ajouter</small></span>';
      else if(e.anniv.jours===0) annivCell = '<b style="background:#fef3c7;padding:3px 8px;border-radius:8px">🎂 AUJOURD\'HUI<br>'+e.anniv.jourMois+'</b><br><small>'+e.anniv.txt+'</small>';
      else if(e.anniv.jours<=7) annivCell = '<b style="color:#d97706">🎂 Dans '+e.anniv.jours+'j<br>'+e.anniv.jourMois+'</b><br><small>'+e.anniv.txt+'</small>';
      else if(e.anniv.jours<=30) annivCell = 'Dans '+e.anniv.jours+'j<br><small>'+e.anniv.jourMois+' ('+e.anniv.txt+')</small>';
      else annivCell = e.anniv.jourMois+'<br><small>'+e.anniv.txt+'</small>';

      let nomAffiche = '<b>'+IA_esc(cl.nom)+'</b><br><small>'+IA_esc(e.phoneClean || cl.phone || cl.telephone || '')+'</small>';
      if(enrichis.filter(function(x){ return String(x.cl.nom||'').toLowerCase()===String(cl.nom||'').toLowerCase(); }).length>1){
        nomAffiche = '<b>'+IA_esc(cl.nom)+'</b> <span style="background:#fee2e2;padding:2px 6px;border-radius:6px;font-size:10px">⚠️ Homonyme</span><br><small>'+IA_esc(e.phoneClean || cl.phone || cl.telephone || '')+'</small>';
      }

      return '<tr><td>'+nomAffiche+'</td>'
        +'<td>'+annivCell+'</td>'
        +'<td>'+e.statut+'</td>'
        +'<td>'+IA_fmt(cl.total)+'<br>'+cl.nb+' achats</td>'
        +'<td style="color:'+(e.dette>0?'#ef4444':'#111')+'"><b>'+(e.dette>0?IA_fmt(e.dette):'0')+'</b><br><small>Dette</small></td>'
        +'<td><b>'+IA_esc(e.produitPrefTxt)+'</b></td>'
        +'<td>'+(e.j===999 ? '-' : e.j+'j')+'</td>'
        +'<td><a href="'+e.waLink+'" target="_blank" style="background:#25D366;color:#fff;padding:5px 10px;border-radius:8px;text-decoration:none">📱 WhatsApp</a><br><small style="font-size:11px;color:#555">'+IA_esc(e.msg.substring(0,70))+'...</small></td></tr>';
    }).join('');

    let tableauHtml = '<h4>❤️ CLIENTS / FIDÉLITÉ</h4>'
      + alerteAnnivHtml
      + '<div style="overflow:auto"><table><tr><th>Client</th><th>🎂 Anniversaire</th><th>Statut IA</th><th>Total / Nb</th><th>💳 Dette</th><th>⭐ Produit Préféré</th><th>Dernier</th><th>Action</th></tr>'
      + rows
      + (enrichis.length===0 ? '<tr><td colspan="8">Aucun client avec nom. Tes ventes sont en "Client comptant" ? Mets le nom du client dans la vente pour suivre sa fidélité.</td></tr>' : '')
      + '</table></div>'
      + '<p style="font-size:12px;color:#555"><b>Conseil du jour :</b> '+(avecDette.length>0 ? 'Récupère d\'abord <b>'+IA_fmt(totalDettesClients)+'</b> de dettes chez '+avecDette.length+' clients avant de faire des promos.' : aRelancer.length>0 ? 'Appelle d\'abord <b>'+IA_esc(aRelancer[0].cl.nom)+'</b>, il est en train de partir depuis '+aRelancer[0].j+' jours.' : annivSemaine.length>0 ? 'Souhaite l\'anniversaire de <b>'+IA_esc(annivSemaine[0].cl.nom)+'</b> aujourd\'hui.' : 'Aucun client en danger. Concentre-toi sur tes VIP.')+'</p>';

    return resumeHtml + tableauHtml + (c?.debug || '');
  };
})();
