// ia-marketing.js - V2.4 - CA UNIQUE = v.total + CA Produit corrigé remise + Période 1er -> Aujourd'hui LOCALE
// V2.4 - PLAN D'ACTION : dates réelles de la semaine en cours, dynamiques. Lundi = début, Dimanche = fin.
// Ex cette semaine : Lundi 23/11, Mercredi 25/11, Vendredi 27/11, Dimanche 29/11/2026. La semaine prochaine ça change tout seul.
(function(){
  function MK_getDates(){
    let duEl = document.getElementById('cDu'), auEl = document.getElementById('cAu');
    let now = new Date();
    let du, au;
    if(duEl && duEl.value && auEl && auEl.value){
      du = new Date(duEl.value + 'T00:00:00');
      au = new Date(auEl.value + 'T23:59:59');
    } else {
      du = new Date(now.getFullYear(), now.getMonth(), 1);
      du.setHours(0,0,0,0);
      au = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      au.setHours(23,59,59,999);
    }
    return {du:du, au:au};
  }
  // ✅ V2.4 - SEMAINE EN COURS, DYNAMIQUE
  function MK_semaineEnCours(){
    let now = new Date();
    now.setHours(0,0,0,0);
    let jour = now.getDay(); // 0=Dimanche, 1=Lundi ... 6=Samedi
    let decalageLundi = (jour === 0) ? -6 : (1 - jour); // On ramène toujours au Lundi de cette semaine
    let lundi = new Date(now);
    lundi.setDate(now.getDate() + decalageLundi);
    function plus(j){ let d = new Date(lundi); d.setDate(lundi.getDate() + j); return d; }
    let fmtCourt = function(d){ return d.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'}); }; // 23/11
    let fmtLong = function(d){ return d.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit', year:'numeric'}); }; // 23/11/2026
    return {
      lundi: plus(0), mardi: plus(1), mercredi: plus(2), jeudi: plus(3), vendredi: plus(4), samedi: plus(5), dimanche: plus(6),
      fmtCourt: fmtCourt, fmtLong: fmtLong,
      label: 'SEMAINE DU LUNDI ' + fmtCourt(plus(0)) + ' AU DIMANCHE ' + fmtLong(plus(6))
    };
  }
  function MK_clientName(v){
    return String(v.clientNom || v.client || v.nomClient || v.customer || v.telephone || v.phone || 'Client inconnu').trim();
  }
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
    let sem = MK_semaineEnCours(); // ✅ V2.4

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
    let caProduitsControle = 0;
    vPeriode.forEach(function(v){
      let d = new Date(v.date).getTime();
      let caVente = IA_num(v.total);
      caTotal += caVente;
      let cli = MK_clientName(v);
      if(!parClient[cli]) parClient[cli]={nom:cli, ca:0, nb:0, derniere:0};
      parClient[cli].ca += caVente;
      parClient[cli].nb += 1;
      parClient[cli].derniere = Math.max(parClient[cli].derniere, d);
      let items = v.items || [];
      if(!items.length) return;
      let caItems = 0;
      let lignes = items.map(function(i){
        let qty = IA_num(i.qty ?? i.QTE ?? 0);
        let prix = IA_num(i.Prix ?? i.PV ?? 0);
        if(prix===0){ let p=fullMap[String(i.CODE)]; if(p) prix=MK_prixVente(p); }
        let pa = fullMap[String(i.CODE)] ? IA_pa(fullMap[String(i.CODE)]) : 0;
        let caLigneBrut = qty * prix;
        caItems += caLigneBrut;
        return {CODE:String(i.CODE), qty:qty, prix:prix, pa:pa, caBrut:caLigneBrut};
      });
      let ratio = (caVente>0 && caItems>0) ? (caVente / caItems) : 1;
      if(caVente===0 && caItems>0) caVente = caItems;
      if(IA_num(v.total)===0 && caItems>0){
        caTotal += caItems;
        parClient[cli].ca += caItems;
        caVente = caItems;
        ratio = 1;
      }
      lignes.forEach(function(l){
        if(!parProduit[l.CODE]) parProduit[l.CODE]={CODE:l.CODE, qte:0, ca:0, benef:0, derniere:0};
        let caCorr = l.caBrut * ratio;
        let benefCorr = caCorr - (l.qty * l.pa);
        parProduit[l.CODE].qte += l.qty;
        parProduit[l.CODE].ca += caCorr;
        parProduit[l.CODE].benef += benefCorr;
        parProduit[l.CODE].derniere = Math.max(parProduit[l.CODE].derniere, d);
        caProduitsControle += caCorr;
      });
    });

    let produitsVendus = Object.values(parProduit).sort(function(a,b){ return b.benef-a.benef; });
    let star = produitsVendus[0];
    let star2 = produitsVendus[1];
    let star3 = produitsVendus[2];

    let nowTs = Date.now();
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

    let nomStar = star ? MK_nom(star.CODE, fullMap) : 'Ton produit Star';
    let pvStar = star ? MK_prixVente(fullMap[star.CODE]) : 0;
    let nomDormant = dormant1 ? dormant1.nom : '';
    // ✅ V2.4 - Messages avec la vraie date du dimanche de cette semaine
    let msgStatut = star ? '🔥 MENKAO2 - STAR DE LA SEMAINE 🔥\n'+nomStar+' est le plus demandé à Menkao2 !\n'+star.qte+' vendus ce mois.\nPrix : '+IA_fmt(pvStar)+'\nStock limité, premier arrivé, premier servi.\nViens à Menkao2 ou commande sur WhatsApp.' : 'MENKAO2 - Nouveautés en boutique, viens découvrir !';
    let msgPromo = dormant1 ? '⚡ PROMO MENKAO2 - CETTE SEMAINE SEULEMENT ⚡\n'+nomDormant+' à -20% !\nAu lieu de '+IA_fmt(dormant1.pv)+', tu l\'as à '+IA_fmt(Math.round(dormant1.pv*0.8))+'\nOffre valable jusqu\'à dimanche '+sem.fmtCourt(sem.dimanche)+'.\nNe rate pas, stock : '+dormant1.qteStock+' pcs.' : '⚡ PROMO MENKAO2 - Pack Star + 1 produit à -10% cette semaine !';
    let msgRelance = perdus.length>0 ? '👋 Bonjour '+perdus[0].nom+', c\'est Menkao2 !\nÇa fait un moment qu\'on ne t\'a pas vu.\nOn a reçu de nouveaux produits, et ton produit préféré est de retour.\nPasse nous voir cette semaine, on te garde une petite réduction. 🙏' : '👋 Bonjour, c\'est Menkao2 ! On a des nouveautés pour toi cette semaine, passe nous voir.';
    let msgPack = (star && dormant1) ? '🎁 PACK MENKAO2\nAchète '+nomStar+' + '+nomDormant+' ensemble et tu as -10% sur le pack !\nTu économises '+IA_fmt(Math.round((pvStar+dormant1.pv)*0.10))+'\nOffre limitée jusqu\'à dimanche '+sem.fmtCourt(sem.dimanche)+'.' : '🎁 PACK MENKAO2 - Star + 1 produit à -10%';

    let diagHtml = '<h4>📊 DIAGNOSTIC MARKETING - '+labelPeriode+'</h4>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<div style="background:#dcfce7;padding:12px;border-radius:12px"><b>⭐ STAR N°1</b><br>'+(star?'<b style="font-size:16px">'+IA_esc(MK_nom(star.CODE, fullMap))+'</b><br>'+star.qte+' vendus<br>'+IA_fmt(star.ca)+' de CA<br>'+IA_fmt(star.benef)+' de marge':'Aucune vente sur la période')+'<br><span style="font-size:11px">Action : Mets-le en vitrine + statut aujourd\'hui</span></div>'
      +'<div style="background:#fee2e2;padding:12px;border-radius:12px"><b>💤 DORMANT N°1</b><br>'+(dormant1?'<b style="font-size:16px">'+IA_esc(dormant1.nom)+'</b><br>'+dormant1.qteStock+' pcs en stock<br>'+IA_fmt(dormant1.cashBloque)+' bloqués<br>'+dormant1.jours+' jours sans vente':'Aucun dormant')+'<br><span style="font-size:11px">Action : Promo -20% ou Pack Star + Dormant</span></div>'
      +'<div style="background:#fef3c7;padding:12px;border-radius:12px"><b>🚫 RUPTURES VRAIES</b><br><b style="font-size:18px">'+rupturesVraies.length+' vraies ruptures</b><br>sur '+totalZero+' articles à 0<br><span style="font-size:11px">Les autres à 0 ne se vendaient pas, ce ne sont pas des ruptures. Commande les '+rupturesVraies.length+' en priorité. Ex : '+(rupturesVraies[0]?IA_esc(rupturesVraies[0].nom):'-')+'</span></div>'
      +'<div style="background:#dbeafe;padding:12px;border-radius:12px"><b>💰 CA / JOUR MOYEN</b><br><b style="font-size:18px">'+IA_fmt(Math.round(caJourMoyen))+'</b><br><span style="font-size:11px;color:#333">'+IA_fmt(Math.round(caTotal))+' / '+nbJours+' jours = '+IA_fmt(Math.round(caJourMoyen))+' / jour</span><br><b>Objectif semaine : '+IA_fmt(objectifSemaine)+'</b><br><span style="font-size:11px;color:#333">'+IA_fmt(Math.round(caJourMoyen))+' x 7 jours x 1,20 (+20%) = '+IA_fmt(objectifSemaine)+'</span></div>'
      +'</div>'
      +'<p style="font-size:11px;color:#555">CA Total: '+IA_fmt(caTotal)+' | Somme CA produits: '+IA_fmt(caProduitsControle)+' ✅ Doivent être égaux | Dormants détectés : '+dormants.length+' articles à +5 pcs qui dorment depuis 14j+. Top 3 : '+dormants.slice(0,3).map(function(d){ return IA_esc(d.nom)+' ('+d.qteStock+' pcs, '+IA_fmt(d.cashBloque)+')'; }).join(' | ')+'</p>';

    let top3Html = '<h4>🏆 TOP 3 PRODUITS À POUSSER</h4><div style="overflow:auto"><table><tr><th>#</th><th>Produit</th><th>Vendus</th><th>CA</th><th>Marge</th><th>Décision du Directeur</th></tr>'
      + [star, star2, star3].map(function(pr, idx){ if(!pr) return ''; let dec = idx===0 ? '⭐ STAR : Vitrine + Statut + Ne baisse pas le prix' : idx===1 ? '🔥 À POUSSER : Mets-le à côté du Star' : '✅ BON : Garde-le en stock, il se vend bien'; return '<tr><td><b>'+(idx+1)+'</b></td><td><b>'+IA_esc(MK_nom(pr.CODE, fullMap))+'</b></td><td>'+pr.qte+'</td><td>'+IA_fmt(pr.ca)+'</td><td>'+IA_fmt(pr.benef)+'</td><td>'+dec+'</td></tr>'; }).join('')
      + '</table></div>'
      + (prixBas.length>0 ? '<p style="background:#fee2e2;padding:8px;border-radius:8px">⚠️ <b>Prix trop bas :</b> '+prixBas.map(function(p){ return IA_esc(MK_nom(p.CODE, fullMap))+' (marge <15%)'; }).join(', ')+' - Tu perds de l\'argent à chaque vente. Augmente de 500 FC.</p>' : '');

    // ✅ V2.4 - PLAN AVEC DATES RÉELLES, CONCRET, PRAGMATIQUE
    let planHtml = '<h4>🎯 PLAN D\'ACTION DU DIRECTEUR - '+sem.label+'</h4><div style="background:#fffbeb;border:2px solid #f59e0b;padding:12px;border-radius:12px">'
      +'<p><b>LUNDI '+sem.fmtCourt(sem.lundi)+' :</b> Mets '+(star?IA_esc(MK_nom(star.CODE, fullMap)):'ton Star')+' en vitrine + Statut WhatsApp avec le message n°1 ci-dessous. Objectif du jour : '+IA_fmt(Math.round(caJourMoyen))+'</p>'
      +'<p><b>MERCREDI '+sem.fmtCourt(sem.mercredi)+' :</b> Lance la promo '+(dormant1?IA_esc(dormant1.nom):'Dormant')+' à -20%. Message n°2. Objectif : débloquer '+IA_fmt(dormant1?dormant1.cashBloque:0)+'</p>'
      +'<p><b>VENDREDI '+sem.fmtCourt(sem.vendredi)+' :</b> Fais le Pack '+(star&&dormant1?IA_esc(MK_nom(star.CODE, fullMap))+' + '+IA_esc(dormant1.nom):'Star + Dormant')+' à -10%. Message n°3. Objectif : vider le dormant sans perdre de marge sur le Star.</p>'
      +'<p><b>DIMANCHE '+sem.fmtCourt(sem.dimanche)+' :</b> Relance tes VIP + tes perdus. Message n°4. Objectif : '+IA_fmt(objectifSemaine)+' de CA sur la semaine du '+sem.fmtCourt(sem.lundi)+' au '+sem.fmtCourt(sem.dimanche)+'. Fais le bilan le soir même.</p>'
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
