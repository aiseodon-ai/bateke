// ia-marketing.js - V2.1 - Désignation + Vraies Ruptures (Conseil du Jour) + Vrais Dormants
(function(){
  function MK_getDates(){
    let duEl = document.getElementById('cDu'), auEl = document.getElementById('cAu');
    let now = new Date();
    let du, au;
    if(duEl && duEl.value && auEl && auEl.value){
      du = new Date(duEl.value); au = new Date(auEl.value); au.setHours(23,59,59,999);
    } else {
      du = new Date(now.getFullYear(), now.getMonth(), 1);
      au = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999);
    }
    return {du:du, au:au};
  }
  function MK_clientName(v){
    return String(v.clientNom || v.client || v.nomClient || v.customer || v.telephone || v.phone || 'Client inconnu').trim();
  }
  // CORRECTION V2.1 : On essaie TOUS les noms possibles de champs
  function MK_qteStock(p){
    if(!p) return 0;
    return IA_num(p['Qte Restante'] ?? p['Qté Restante'] ?? p.QTE ?? p.qte ?? p.Qte ?? p.Stock ?? p.stock ?? p['Quantité'] ?? p['Quantite'] ?? p.quantite ?? p['Qté'] ?? p.QTY ?? 0);
  }
  function MK_prixVente(p){
    if(!p) return 0;
    return IA_num(p['Prix Vente'] ?? p.PV ?? p['Prix'] ?? p.Prix ?? p.PRIX ?? p.prix ?? 0);
  }
  function MK_designation(p, code){
    if(!p) return code;
    let d = p['Désignation'] ?? p['Designation'] ?? p['Désignation '] ?? p.Designation ?? p.DESIGNATION ?? p.Nom ?? p.nom ?? p.Libelle ?? p.libelle ?? p['Produit'] ?? p.Produit ?? '';
    d = String(d||'').trim();
    if(!d || d===code) return code;
    return d;
  }
  function MK_nom(code, map){
    let p = map[String(code)];
    let des = MK_designation(p, String(code));
    if(des===String(code)) return String(code);
    return String(code)+' - '+des;
  }

  window.IA_render_marketing = function(c){
    let periode = MK_getDates();
    let du = periode.du, au = periode.au;
    let labelPeriode = du.toLocaleDateString('fr-FR')+' au '+au.toLocaleDateString('fr-FR');

    let gf = {};
    try{ gf = (typeof getFiltered==='function' ? getFiltered() : null) || {}; }catch(e){ gf={}; }
    let ventesBrutes = gf.ventes || [];
    let stockBrut = gf.stock || c.stock || [];
    let vPeriode = ventesBrutes.filter(function(v){ let d=new Date(v.date); return d>=du && d<=au; });

    let fullMap = {};
    stockBrut.forEach(function(p){ let code = p.CODE || p._id; if(code) fullMap[String(code)] = p; });

    let parProduit = {};
    let parClient = {};
    let caTotal = 0;
    vPeriode.forEach(function(v){
      let d = new Date(v.date).getTime();
      caTotal += IA_num(v.total);
      let cli = MK_clientName(v);
      if(!parClient[cli]) parClient[cli]={nom:cli, ca:0, nb:0, derniere:0};
      parClient[cli].ca += IA_num(v.total);
      parClient[cli].nb += 1;
      parClient[cli].derniere = Math.max(parClient[cli].derniere, d);
      (v.items||[]).forEach(function(i){
        let code = String(i.CODE);
        if(!parProduit[code]) parProduit[code]={CODE:code, qte:0, ca:0, benef:0, derniere:0};
        let qty = IA_num(i.qty ?? i.QTE ?? 0);
        let prix = IA_num(i.Prix ?? i.PV ?? 0);
        if(prix===0){ let p=fullMap[code]; if(p) prix=MK_prixVente(p); }
        let pa = fullMap[code] ? IA_pa(fullMap[code]) : 0;
        parProduit[code].qte += qty;
        parProduit[code].ca += qty*prix;
        parProduit[code].benef += qty*(prix-pa);
        parProduit[code].derniere = Math.max(parProduit[code].derniere, d);
      });
    });

    let produitsVendus = Object.values(parProduit).sort(function(a,b){ return b.benef-a.benef; });
    let star = produitsVendus[0];
    let star2 = produitsVendus[1];
    let star3 = produitsVendus[2];

    let nowTs = Date.now();
    // CORRECTION DORMANTS : comme Conseil du Jour - Qte >= 5 pcs, pas vendu depuis 14j, tri par cash bloqué
    // Avant, MK_qteStock lisait le mauvais champ, donc tout etait a 0, donc 0 dormant.
    let dormants = [];
    stockBrut.forEach(function(p){
      let code = String(p.CODE || p._id);
      let qteStock = MK_qteStock(p);
      if(qteStock < 5) return;
      let vendu = parProduit[code];
      let derniere = vendu ? vendu.derniere : 0;
      let joursSansVente = derniere ? Math.floor((nowTs-derniere)/86400000) : 999;
      if(!vendu || joursSansVente>=14){
        dormants.push({CODE:code, nom:MK_nom(code, fullMap), qteStock:qteStock, pv:MK_prixVente(p), pa:IA_pa(p), jours:joursSansVente, cashBloque:qteStock*IA_pa(p)});
      }
    });
    dormants.sort(function(a,b){ return b.cashBloque-a.cashBloque; });
    let dormant1 = dormants[0];
    let dormant2 = dormants[1];

    // CORRECTION RUPTURES VRAIES : comme Conseil du Jour - Qte=0 ET vendu sur la periode (il se vendait, il est tombe a 0)
    // Avant, je comptais les 644 fiches a 0, meme celles jamais vendues. Maintenant seulement les vraies.
    let rupturesVraies = [];
    let totalZero = 0;
    stockBrut.forEach(function(p){
      let code = String(p.CODE || p._id);
      let q = MK_qteStock(p);
      if(q<=0){
        totalZero++;
        if(parProduit[code]) rupturesVraies.push({CODE:code, nom:MK_nom(code, fullMap)});
      }
    });

    let prixBas = produitsVendus.filter(function(pr){ let p=fullMap[pr.CODE]; if(!p) return false; let pa=IA_pa(p); let pv=MK_prixVente(p); if(pv<=0) return false; let marge=(pv-pa)/pv*100; return marge<15 && pr.qte>0; }).slice(0,3);

    let clientsArr = Object.values(parClient).sort(function(a,b){ return b.ca-a.ca; });
    let vips = clientsArr.filter(function(cl){ return cl.ca>=50000; }).slice(0,5);
    let perdus = clientsArr.filter(function(cl){ let jours=Math.floor((nowTs-cl.derniere)/86400000); return jours>=15 && jours<999; }).sort(function(a,b){ return b.ca-a.ca; }).slice(0,5);

    let nbJours = Math.max(1, Math.ceil((au-du)/86400000)+1);
    let caJourMoyen = caTotal / nbJours;
    let objectifSemaine = Math.round(caJourMoyen*7*1.2);

    // Messages avec Désignation, pas juste CODE
    let nomStar = star ? MK_nom(star.CODE, fullMap) : 'Ton produit Star';
    let pvStar = star ? MK_prixVente(fullMap[star.CODE]) : 0;
    let nomDormant = dormant1 ? dormant1.nom : '';
    let msgStatut = star ? '🔥 MENKAO2 - STAR DE LA SEMAINE 🔥\n'+nomStar+' est le plus demandé à Menkao2 !\n'+star.qte+' vendus ce mois.\nPrix : '+IA_fmt(pvStar)+'\nStock limité, premier arrivé, premier servi.\nViens à Menkao2 ou commande sur WhatsApp.' : 'MENKAO2 - Nouveautés en boutique, viens découvrir !';
    let msgPromo = dormant1 ? '⚡ PROMO MENKAO2 - CETTE SEMAINE SEULEMENT ⚡\n'+nomDormant+' à -20% !\nAu lieu de '+IA_fmt(dormant1.pv)+', tu l\'as à '+IA_fmt(Math.round(dormant1.pv*0.8))+'\nOffre valable jusqu\'à dimanche.\nNe rate pas, stock : '+dormant1.qteStock+' pcs.' : '⚡ PROMO MENKAO2 - Pack Star + 1 produit à -10% cette semaine !';
    let msgRelance = perdus.length>0 ? '👋 Bonjour '+perdus[0].nom+', c\'est Menkao2 !\nÇa fait un moment qu\'on ne t\'a pas vu.\nOn a reçu de nouveaux produits, et ton produit préféré est de retour.\nPasse nous voir cette semaine, on te garde une petite réduction. 🙏' : '👋 Bonjour, c\'est Menkao2 ! On a des nouveautés pour toi cette semaine, passe nous voir.';
    let msgPack = (star && dormant1) ? '🎁 PACK MENKAO2\nAchète '+nomStar+' + '+nomDormant+' ensemble et tu as -10% sur le pack !\nTu économises '+IA_fmt(Math.round((pvStar+dormant1.pv)*0.10))+'\nOffre limitée.' : '🎁 PACK MENKAO2 - Star + 1 produit à -10%';

    let diagHtml = '<h4>📊 DIAGNOSTIC MARKETING - '+labelPeriode+'</h4>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<div style="background:#dcfce7;padding:12px;border-radius:12px"><b>⭐ STAR N°1</b><br>'+(star?'<b style="font-size:16px">'+IA_esc(MK_nom(star.CODE, fullMap))+'</b><br>'+star.qte+' vendus<br>'+IA_fmt(star.ca)+' de CA<br>'+IA_fmt(star.benef)+' de marge':'Aucune vente sur la période')+'<br><span style="font-size:11px">Action : Mets-le en vitrine + statut aujourd\'hui</span></div>'
      +'<div style="background:#fee2e2;padding:12px;border-radius:12px"><b>💤 DORMANT N°1</b><br>'+(dormant1?'<b style="font-size:16px">'+IA_esc(dormant1.nom)+'</b><br>'+dormant1.qteStock+' pcs en stock<br>'+IA_fmt(dormant1.cashBloque)+' bloqués<br>'+dormant1.jours+' jours sans vente':'Aucun dormant')+'<br><span style="font-size:11px">Action : Promo -20% ou Pack Star + Dormant</span></div>'
      +'<div style="background:#fef3c7;padding:12px;border-radius:12px"><b>🚫 RUPTURES VRAIES</b><br><b style="font-size:18px">'+rupturesVraies.length+' vraies ruptures</b><br>sur '+totalZero+' articles à 0<br><span style="font-size:11px">Les autres à 0 ne se vendaient pas, ce ne sont pas des ruptures. Commande les '+rupturesVraies.length+' en priorité. Ex : '+(rupturesVraies[0]?IA_esc(rupturesVraies[0].nom):'-')+'</span></div>'
      +'<div style="background:#dbeafe;padding:12px;border-radius:12px"><b>💰 CA / JOUR MOYEN</b><br><b style="font-size:18px">'+IA_fmt(Math.round(caJourMoyen))+'</b><br>Objectif semaine : '+IA_fmt(objectifSemaine)+'<br><span style="font-size:11px">+20% par rapport à ta moyenne</span></div>'
      +'</div>'
      +'<p style="font-size:11px;color:#555">Dormants détectés : '+dormants.length+' articles à +5 pcs qui dorment depuis 14j+. Top 3 : '+dormants.slice(0,3).map(function(d){ return IA_esc(d.nom)+' ('+d.qteStock+' pcs, '+IA_fmt(d.cashBloque)+')'; }).join(' | ')+'</p>';

    let top3Html = '<h4>🏆 TOP 3 PRODUITS À POUSSER</h4><div style="overflow:auto"><table><tr><th>#</th><th>Produit</th><th>Vendus</th><th>CA</th><th>Marge</th><th>Décision du Directeur</th></tr>'
      + [star, star2, star3].map(function(pr, idx){ if(!pr) return ''; let dec = idx===0 ? '⭐ STAR : Vitrine + Statut + Ne baisse pas le prix' : idx===1 ? '🔥 À POUSSER : Mets-le à côté du Star' : '✅ BON : Garde-le en stock, il se vend bien'; return '<tr><td><b>'+(idx+1)+'</b></td><td><b>'+IA_esc(MK_nom(pr.CODE, fullMap))+'</b></td><td>'+pr.qte+'</td><td>'+IA_fmt(pr.ca)+'</td><td>'+IA_fmt(pr.benef)+'</td><td>'+dec+'</td></tr>'; }).join('')
      + '</table></div>'
      + (prixBas.length>0 ? '<p style="background:#fee2e2;padding:8px;border-radius:8px">⚠️ <b>Prix trop bas :</b> '+prixBas.map(function(p){ return IA_esc(MK_nom(p.CODE, fullMap))+' (marge <15%)'; }).join(', ')+' - Tu perds de l\'argent à chaque vente. Augmente de 500 FC.</p>' : '');

    let planHtml = '<h4>🎯 PLAN D\'ACTION DU DIRECTEUR - CETTE SEMAINE</h4><div style="background:#fffbeb;border:2px solid #f59e0b;padding:12px;border-radius:12px">'
      +'<p><b>LUNDI :</b> Mets '+(star?IA_esc(MK_nom(star.CODE, fullMap)):'ton Star')+' en vitrine + Statut WhatsApp avec le message n°1 ci-dessous. Objectif : '+IA_fmt(Math.round(caJourMoyen))+'</p>'
      +'<p><b>MERCREDI :</b> Lance la promo '+(dormant1?IA_esc(dormant1.nom):'Dormant')+' à -20%. Message n°2. Objectif : débloquer '+IA_fmt(dormant1?dormant1.cashBloque:0)+'</p>'
      +'<p><b>VENDREDI :</b> Fais le Pack '+(star&&dormant1?IA_esc(MK_nom(star.CODE, fullMap))+' + '+IA_esc(dormant1.nom):'Star + Dormant')+' à -10%. Message n°3. Objectif : vider le dormant sans perdre de marge sur le Star.</p>'
      +'<p><b>DIMANCHE :</b> Relance tes VIP + tes perdus. Messages n°4. Objectif : '+IA_fmt(objectifSemaine)+' de CA sur la semaine.</p>'
      +'<p><b>⛔ NE FAIS PAS :</b> Ne fais pas de pub sur tes '+rupturesVraies.length+' vraies ruptures. Tu vas frustrer les clients. Commande-les d\'abord.</p>'
      +'</div>';

    let messagesHtml = '<h4>✉️ MESSAGES PRÊTS À COPIER - Tu copies, tu colles sur WhatsApp / Statut</h4>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<div style="background:#dcfce7;padding:12px;border-radius:12px"><b>1. STATUT - STAR</b><br><div style="background:#fff;padding:8px;border-radius:8px;white-space:pre-wrap;font-size:13px">'+IA_esc(msgStatut)+'</div><button onclick="navigator.clipboard.writeText(`'+msgStatut.replace(/`/g,'').replace(/\n/g,'\\n')+'`);alert(\'Copié ! Colle sur WhatsApp\')">📋 Copier</button></div>'
      +'<div style="background:#fee2e2;padding:12px;border-radius:12px"><b>2. PROMO - DORMANT -20%</b><br><div style="background:#fff;padding:8px;border-radius:8px;white-space:pre-wrap;font-size:13px">'+IA_esc(msgPromo)+'</div><button onclick="navigator.clipboard.writeText(`'+msgPromo.replace(/`/g,'').replace(/\n/g,'\\n')+'`);alert(\'Copié !\')">📋 Copier</button></div>'
      +'<div style="background:#dbeafe;padding:12px;border-radius:12px"><b>3. PACK - STAR + DORMANT</b><br><div style="background:#fff;padding:8px;border-radius:8px;white-space:pre-wrap;font-size:13px">'+IA_esc(msgPack)+'</div><button onclick="navigator.clipboard.writeText(`'+msgPack.replace(/`/g,'').replace(/\n/g,'\\n')+'`);alert(\'Copié !\')">📋 Copier</button></div>'
      +'<div style="background:#fef3c7;padding:12px;border-radius:12px"><b>4. RELANCE CLIENT PERDU</b><br><div style="background:#fff;padding:8px;border-radius:8px;white-space:pre-wrap;font-size:13px">'+IA_esc(msgRelance)+'</div><button onclick="navigator.clipboard.writeText(`'+msgRelance.replace(/`/g,'').replace(/\n/g,'\\n')+'`);alert(\'Copié !\')">📋 Copier</button></div>'
      +'</div>';

    let clientsHtml = '<h4>👥 CLIENTS - Qui chouchouter, qui récupérer</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<div style="background:#dcfce7;padding:12px;border-radius:12px"><b>👑 VIP - Ne les laisse pas partir</b><br>'+(vips.length? vips.map(function(cl){ return '• <b>'+IA_esc(cl.nom)+'</b> - '+IA_fmt(cl.ca)+' ('+cl.nb+' achats)<br>'; }).join('') : 'Aucun VIP à +50 000 FC ce mois')+'<br><span style="font-size:11px">Action : Appelle le 1er VIP, remercie-le, propose-lui la nouveauté en avant-première.</span></div>'
      +'<div style="background:#fee2e2;padding:12px;border-radius:12px"><b>😢 PERDUS - À récupérer</b><br>'+(perdus.length? perdus.map(function(cl){ let j=Math.floor((nowTs-cl.derniere)/86400000); return '• <b>'+IA_esc(cl.nom)+'</b> - '+IA_fmt(cl.ca)+' - absent depuis '+j+' jours<br>'; }).join('') : 'Aucun client perdu, bravo !')+'<br><span style="font-size:11px">Action : Envoie le message n°4 à chacun. Ne fais pas de promo à un client qui te doit encore de l\'argent.</span></div>'
      +'</div>';

    let avisHtml = '<h4>🧑‍💼 AVIS DU DIRECTEUR MARKETING</h4><div style="background:#f8fafc;padding:12px;border-radius:10px">'
      +(star ? '<p>🏆 Ton moteur, c\'est <b>'+IA_esc(MK_nom(star.CODE, fullMap))+'</b>. Tout ton marketing de cette semaine doit tourner autour de lui. Ne le brade pas.</p>' : '')
      +(dormant1 ? '<p>💤 Ton argent dort dans <b>'+IA_esc(dormant1.nom)+'</b> : '+IA_fmt(dormant1.cashBloque)+' bloqués depuis '+dormant1.jours+' jours. La promo -20% ou le Pack, c\'est mieux que de laisser dormir.</p>' : '')
      +(rupturesVraies.length>0 ? '<p>🚫 Tu as '+rupturesVraies.length+' vraies ruptures. Chaque jour de rupture, c\'est un client qui va chez le concurrent. Commande-les avant de faire une nouvelle pub.</p>' : '')
      +'<p><b>Priorité n°1 cette semaine :</b> '+(dormant1 ? 'Vider '+IA_esc(dormant1.nom)+' avec le Pack, et pousser '+IA_esc(MK_nom(star.CODE, fullMap))+' en vitrine.' : 'Pousser '+IA_esc(MK_nom(star.CODE, fullMap))+' et relancer tes VIP.')+'</p></div>';

    return diagHtml + top3Html + planHtml + messagesHtml + clientsHtml + avisHtml + c.debug;
  };
})();
