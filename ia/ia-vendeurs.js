// ia-rh.js - V1.0 - DIRECTEUR RH - Gestion personnel + Objectifs
// Règles : Même données que Trésorerie / Compta | CA = v.total | Encaissé = Payé
(function(){
  window.IA_render_rh = function(c){
    // === DONNÉES : On prend c.vendeurs si dispo, sinon on recalcule depuis getFiltered, comme Trésorerie ===
    let gf = {};
    try{ gf = (typeof getFiltered==='function' ? getFiltered() : null) || {}; }catch(e){ gf={}; }
    let ventesBrutes = gf.ventes || [];
    let stockBrut = gf.stock || c.stock || [];
    let fullMap = {};
    stockBrut.forEach(function(p){ let code = p.CODE || p._id; if(code) fullMap[String(code)] = p; });

    // Période 1er -> Aujourd'hui, comme Trésorerie
    let now = new Date();
    let duEl = document.getElementById('cDu'), auEl = document.getElementById('cAu');
    let du, au;
    if(duEl && duEl.value && auEl && auEl.value){
      du = new Date(duEl.value + 'T00:00:00'); au = new Date(auEl.value + 'T23:59:59');
    } else {
      du = new Date(now.getFullYear(), now.getMonth(), 1); du.setHours(0,0,0,0);
      au = new Date(now.getFullYear(), now.getMonth(), now.getDate()); au.setHours(23,59,59,999);
    }
    let nbJours = Math.max(1, Math.ceil((au-du)/86400000)+1);
    let labelPeriode = du.toLocaleDateString('fr-FR')+' au '+au.toLocaleDateString('fr-FR');

    // Paramètres RH depuis Compta - mêmes inputs que Trésorerie
    function TR_val(id, def){
      let el = document.getElementById(id);
      if(!el || el.value==null || el.value==='') return def;
      let n = parseFloat(String(el.value).replace(/\s/g,'').replace(',','.'));
      return isNaN(n)?def:n;
    }
    let base = TR_val('cBase', 50000);
    let comPct = TR_val('cCom', 10);
    let loyer = TR_val('cLoyer', 100000);

    // === 1. PERFORMANCE PAR VENDEUR - Le vrai travail du RH ===
    let vendeursMap = {};
    let exclus = window.CURRENT_CONFIG?.compta?.exclus || [];
    let vPeriode = ventesBrutes.filter(function(v){ let d=new Date(v.date); return d>=du && d<=au; });

    vPeriode.forEach(function(v){
      let nomRaw = String(v.vendeurNom || v.vendeur || 'Inconnu').trim();
      let keyExclus = nomRaw.toLowerCase().replace(/\s+/g,'').replace(/[^a-z]/g,'');
      let isExclus = exclus.includes(keyExclus);
      let isComptoir = !nomRaw || nomRaw.toLowerCase()==='comptoir';
      if(isComptoir || isExclus) return;

      let caVente = IA_num(v.total ?? v.TOTAL ?? 0);
      let resteV = IA_num(v.reste ?? v.Reste ?? 0);
      let payeV = IA_num(v.paye ?? v.Payé ?? v.paye ?? v.PAYE ?? 0);
      if(payeV===0) payeV = Math.max(0, caVente - resteV);
      if(payeV > caVente) payeV = caVente;

      // Bénéfice de la vente, comme Compta V2.5
      let benefV = IA_num(v.benefice || 0);
      if(!(v.items||[]).length){
        // déjà dans benefV
      } else {
        let caItems=0, benefItems=0;
        (v.items||[]).forEach(function(i){
          let qty = IA_num(i.qty ?? i.QTE ?? 0);
          let prix = IA_num(i.Prix ?? i.prix ?? i.PV ?? 0);
          if(prix===0){ let p=fullMap[String(i.CODE)]; if(p) prix=IA_num(p['Prix Vente'] ?? p.PV ?? 0); }
          let pa = fullMap[String(i.CODE)] ? IA_pa(fullMap[String(i.CODE)]) : 0;
          caItems += qty*prix; benefItems += qty*(prix-pa);
        });
        let remise = (caItems > caVente) ? (caItems - caVente) : 0;
        benefV = (benefItems - remise);
      }

      if(!vendeursMap[nomRaw]) vendeursMap[nomRaw]={nom:nomRaw, ca:0, benef:0, encaisse:0, dettes:0, nb:0, jours:{}, dernierTs:0, nbPerte:0};
      let o = vendeursMap[nomRaw];
      o.ca += caVente; o.benef += benefV; o.encaisse += payeV;
      o.dettes += Math.max(0, caVente - payeV);
      o.nb += 1;
      let jourKey = new Date(v.date).toLocaleDateString('fr-FR');
      o.jours[jourKey] = true;
      let ts = new Date(v.date).getTime();
      if(ts > o.dernierTs) o.dernierTs = ts;
      if(benefV < 0) o.nbPerte += 1;
    });

    // Si c.vendeurs existe et que notre calcul est vide, on utilise c.vendeurs comme secours
    let vendeursArr = Object.values(vendeursMap);
    if(!vendeursArr.length && c.vendeurs && c.vendeurs.length){
      vendeursArr = c.vendeurs.map(function(v){
        return {nom: v.nom, ca: IA_num(v.total||0), benef: IA_num(v.benef||v.benefice||0), encaisse: IA_num(v.total||0), dettes:0, nb: IA_num(v.nb||0), jours:{}, dernierTs: Date.now(), nbPerte:0};
      });
    }
    vendeursArr.sort(function(a,b){ return b.ca - a.ca; });
    let nbVendeurs = vendeursArr.length;

    // === 2. OBJECTIFS RH + PAIE ===
    // Objectif RH norme petite boutique : Chaque vendeur doit couvrir 3x sa base en CA
    // Ex : Base 50 000 FC -> Objectif CA = 150 000 FC minimum, sinon il coûte plus qu'il ne rapporte
    // On calcule aussi l'objectif idéal : (Base + Part Loyer) / Marge moyenne
    let caTotalRH = vendeursArr.reduce(function(s,v){ return s + v.ca; },0);
    let benefTotalRH = vendeursArr.reduce(function(s,v){ return s + v.benef; },0);
    let margeMoy = caTotalRH>0 ? (benefTotalRH/caTotalRH) : 0.3;
    if(margeMoy<=0) margeMoy = 0.3;
    let partLoyer = nbVendeurs>0 ? (loyer / nbVendeurs) : 0;

    vendeursArr.forEach(function(v){
      v.joursActifs = Object.keys(v.jours||{}).length || (v.nb>0 ? 1 : 0);
      v.panierMoyen = v.nb>0 ? (v.ca / v.nb) : 0;
      v.caJour = v.joursActifs>0 ? (v.ca / v.joursActifs) : 0;
      v.tauxEncaisse = v.ca>0 ? (v.encaisse / v.ca * 100) : 0;
      v.tauxDette = v.ca>0 ? (v.dettes / v.ca * 100) : 0;
      v.margePct = v.ca>0 ? (v.benef / v.ca * 100) : 0;
      // Objectif CA : (Base + Part Loyer) / Marge moyenne = CA pour être rentable
      v.objectifCA = Math.round((base + partLoyer) / Math.max(0.05, margeMoy));
      // Si objectif trop bas, plancher 3x Base
      if(v.objectifCA < base*3) v.objectifCA = base*3;
      v.tauxObjectif = v.objectifCA>0 ? (v.ca / v.objectifCA * 100) : 0;
      v.commission = Math.max(0, v.benef * (comPct/100));
      v.salaireTotal = base + v.commission;
      v.coutRH = v.salaireTotal;
      v.rentabilite = v.benef - v.salaireTotal; // Ce qu'il rapporte vraiment après son salaire
      v.joursSansVente = v.dernierTs>0 ? Math.floor((Date.now() - v.dernierTs)/86400000) : 99;
      // Note RH / 20 : CA 40%, Encaissement 20%, Marge 20%, Régularité 20%
      let noteCA = Math.min(10, v.tauxObjectif / 10); // 100% objectif = 10
      let noteEnc = v.tauxEncaisse / 10; // 100% = 10, mais capé
      if(noteEnc>10) noteEnc = 10;
      let noteMarge = Math.max(0, Math.min(10, v.margePct / 3)); // 30% marge = 10
      let noteReg = Math.min(10, (v.joursActifs / nbJours) * 10 * 2); // Présence
      if(noteReg>10) noteReg = 10;
      // Note sur 20 : (CA 8 pts + Encaisse 4 + Marge 4 + Régularité 4)
      v.note = Math.round(((noteCA/10)*8 + (noteEnc/10)*4 + (noteMarge/10)*4 + (noteReg/10)*4) * 10) / 10;
      v.statut = v.tauxObjectif>=100 ? '🟢 Star' : v.tauxObjectif>=70 ? '🟡 Correct' : v.tauxObjectif>=40 ? '🟠 À former' : '🔴 En danger';
    });

    let totalSalairesRH = vendeursArr.reduce(function(s,v){ return s + v.salaireTotal; },0);
    let totalComRH = vendeursArr.reduce(function(s,v){ return s + v.commission; },0);
    let coutRHsurCA = caTotalRH>0 ? (totalSalairesRH / caTotalRH * 100) : 0;

    // === 3. COACHING : Meilleur + Faible, comme ton idée, mais automatique ===
    let meilleur = vendeursArr[0] || null;
    let plusFaible = vendeursArr[vendeursArr.length-1] || null;
    let aFormer = vendeursArr.filter(function(v){ return v.tauxObjectif < 70; });
    let enDanger = vendeursArr.filter(function(v){ return v.tauxObjectif < 40 || v.joursSansVente>5; });
    let vendeursSansVente = vendeursArr.filter(function(v){ return v.joursSansVente>3; });

    // === 4. DÉCISIONS DU DIRECTEUR RH ===
    let decisionsRH = [];
    if(!vendeursArr.length) decisionsRH.push('Aucune vente avec vendeur sur la période. Vérifie que tes ventes ont un vendeur.');
    if(meilleur) decisionsRH.push('⭐ STAR DU MOIS : <b>'+IA_esc(meilleur.nom)+'</b> - '+IA_fmt(meilleur.ca)+' ('+meilleur.tauxObjectif.toFixed(0)+'% de son objectif) - Note '+meilleur.note+'/20. Félicite-le en public, ça motive toute l\'équipe.');
    if(plusFaible && nbVendeurs>1 && plusFaible.nom !== (meilleur?meilleur.nom:'')) decisionsRH.push('🎓 FORMATION : Mets <b>'+IA_esc(meilleur.nom)+'</b> avec <b>'+IA_esc(plusFaible.nom)+'</b> 2 jours. Le meilleur montre comment il accueille, comment il propose, comment il encaisse. Pas de punition, de la formation.');
    if(aFormer.length) decisionsRH.push('🟠 À FORMER : '+aFormer.map(function(v){ return IA_esc(v.nom)+' ('+v.tauxObjectif.toFixed(0)+'%)'; }).join(', ')+' - Ils sont en dessous de 70% de leur objectif. 1 semaine de suivi serré, sinon on revoit leur poste.');
    if(enDanger.length) decisionsRH.push('🔴 EN DANGER : '+enDanger.map(function(v){ return IA_esc(v.nom)+' ('+v.joursSansVente+'j sans vente)'; }).join(', ')+' - Entretien individuel cette semaine. Comprendre : problème personnel, manque de formation, ou manque de motivation ?');
    if(vendeursArr.some(function(v){ return v.nbPerte>0; })) decisionsRH.push('⚠️ VENTES À PERTE : '+vendeursArr.filter(function(v){ return v.nbPerte>0; }).map(function(v){ return IA_esc(v.nom)+' : '+v.nbPerte+' ventes à perte'; }).join(', ')+' - Il vend en dessous du Prix Achat. Formation urgente sur les prix, sinon il te fait perdre de l\'argent.');
    if(vendeursArr.some(function(v){ return v.tauxDette>20; })) decisionsRH.push('💳 TROP DE CRÉDIT : '+vendeursArr.filter(function(v){ return v.tauxDette>20; }).map(function(v){ return IA_esc(v.nom)+' : '+v.tauxDette.toFixed(0)+'% à crédit'; }).join(', ')+' - Il vend à crédit pour faire du CA. Interdis le crédit sans ton accord.');
    if(coutRHsurCA>20) decisionsRH.push('💰 COÛT RH TROP HAUT : Tes salaires = '+coutRHsurCA.toFixed(1)+'% de ton CA. Norme = moins de 15%. Soit tu augmentes le CA, soit tu revois les bases.');
    else if(vendeursArr.length) decisionsRH.push('🟢 COÛT RH SAIN : Tes salaires = '+coutRHsurCA.toFixed(1)+'% de ton CA (norme < 15%). Ton équipe est rentable.');
    if(decisionsRH.length===0) decisionsRH.push('✅ Équipe stable. Continue le suivi.');

    // === HTML ===
    let resumeHtml = '<div style="background:#f8fafc;padding:10px;border-radius:10px;margin-bottom:10px">📅 <b>Période :</b> '+labelPeriode+' | '+nbJours+' jours | '+nbVendeurs+' vendeur(s) actif(s)<br>CA Équipe = <b>'+IA_fmt(caTotalRH)+'</b> | Bénéfice Équipe = <b>'+IA_fmt(benefTotalRH)+'</b> | Coût Salaires = <b>'+IA_fmt(totalSalairesRH)+'</b> ('+coutRHsurCA.toFixed(1)+'% du CA)<br><span style="font-size:11px;color:#555">Un RH ne regarde pas que le CA. Il regarde : est-ce que ce vendeur rapporte plus qu\'il ne coûte ?</span></div>';

    let classementHtml = '<h4>🏆 CLASSEMENT + OBJECTIFS - Qui performe, qui doit progresser</h4><div style="overflow:auto"><table><tr><th>#</th><th>Vendeur</th><th>CA</th><th>Objectif CA</th><th>% Objectif</th><th>Bénéf</th><th>Encaissé</th><th>Panier Moyen</th><th>Note /20</th><th>Statut</th></tr>'
      + vendeursArr.map(function(v, i){
          let barre = Math.min(100, v.tauxObjectif);
          let coulBarre = v.tauxObjectif>=100 ? '#16a34a' : v.tauxObjectif>=70 ? '#f59e0b' : '#ef4444';
          return '<tr><td><b>'+(i+1)+'</b></td><td><b>'+IA_esc(v.nom)+'</b><br><small>'+v.nb+' ventes, '+v.joursActifs+'j actifs</small></td><td>'+IA_fmt(v.ca)+'</td><td>'+IA_fmt(v.objectifCA)+'</td><td><div style="background:#eee;border-radius:6px;height:10px;width:90px"><div style="background:'+coulBarre+';height:10px;width:'+barre+'%;border-radius:6px"></div></div>'+v.tauxObjectif.toFixed(0)+'%</td><td>'+IA_fmt(v.benef)+'<br><small>'+v.margePct.toFixed(1)+'% marge</small></td><td>'+v.tauxEncaisse.toFixed(0)+'%<br><small>Dettes '+v.tauxDette.toFixed(0)+'%</small></td><td>'+IA_fmt(v.panierMoyen)+'</td><td><b>'+v.note+'/20</b></td><td>'+v.statut+'</td></tr>';
        }).join('')
      + (vendeursArr.length===0 ? '<tr><td colspan="10">Aucune vente avec vendeur sur la période.</td></tr>' : '')
      + '</table></div>';

    let paieHtml = '<h4>💰 FICHE DE PAIE - Base + Commission, comme en Compta</h4><div style="overflow:auto"><table><tr><th>Vendeur</th><th>Base</th><th>Commission ('+comPct+'% sur bénéfice)</th><th>Total à Payer</th><th>Il te Rapporte (Bénéf - Salaire)</th><th>Décision Paie</th></tr>'
      + vendeursArr.map(function(v){
          let decPaie = v.rentabilite>=0 ? '🟢 Il gagne son salaire' : '🔴 Il te coûte '+IA_fmt(Math.abs(v.rentabilite))+' ce mois-ci';
          return '<tr><td><b>'+IA_esc(v.nom)+'</b></td><td>'+IA_fmt(base)+'</td><td>'+IA_fmt(v.commission)+'<br><small>sur '+IA_fmt(v.benef)+' bénéf</small></td><td><b>'+IA_fmt(v.salaireTotal)+'</b></td><td style="color:'+(v.rentabilite>=0?'#0b5e2f':'#ef4444')+'"><b>'+IA_fmt(v.rentabilite)+'</b></td><td>'+decPaie+'</td></tr>';
        }).join('')
      + '<tr style="background:#fef3c7"><td><b>TOTAL ÉQUIPE</b></td><td><b>'+IA_fmt(base*nbVendeurs)+'</b></td><td><b>'+IA_fmt(totalComRH)+'</b></td><td><b>'+IA_fmt(totalSalairesRH)+'</b></td><td><b>'+IA_fmt(benefTotalRH - totalSalairesRH)+'</b></td><td>Total à prévoir pour la paie</td></tr>'
      + '</table></div><p style="font-size:12px;color:#555">Règle RH : Un vendeur doit rapporter au moins 3x sa base en bénéfice, sinon il faut le former ou revoir son poste. Pas le punir, le former.</p>';

    let coachingHtml = '<h4>🎓 COACHING + SUIVI - Le RH forme, il ne punit pas</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<div style="background:#dcfce7;padding:12px;border-radius:12px"><b>⭐ BINÔME DE LA SEMAINE</b><br>'+(meilleur && plusFaible && nbVendeurs>1 ? '<b>'+IA_esc(meilleur.nom)+'</b> (Star, '+meilleur.note+'/20) + <b>'+IA_esc(plusFaible.nom)+'</b> (À former, '+plusFaible.note+'/20)<br><br><b>Mission 2 jours :</b><br>• Jour 1 : '+IA_esc(meilleur.nom)+' vend, '+IA_esc(plusFaible.nom)+' observe et note<br>• Jour 2 : '+IA_esc(plusFaible.nom)+' vend, '+IA_esc(meilleur.nom)+' corrige gentiment<br>• Objectif : '+IA_esc(plusFaible.nom)+' passe à 70% de son objectif' : 'Pas assez de vendeurs pour un binôme. Il faut au moins 2 vendeurs.')+'</div>'
      +'<div style="background:#fef3c7;padding:12px;border-radius:12px"><b>📋 ENTRETIENS À FAIRE CETTE SEMAINE</b><br>'+(enDanger.length ? enDanger.map(function(v){ return '• <b>'+IA_esc(v.nom)+'</b> : '+v.joursSansVente+'j sans vente, '+v.tauxObjectif.toFixed(0)+'% objectif - Entretien individuel, comprendre le blocage<br>'; }).join('') : 'Aucun entretien urgent. Ton équipe est stable.')+'<br>'+(vendeursSansVente.length ? '<b>Absents / Inactifs :</b> '+vendeursSansVente.map(function(v){ return IA_esc(v.nom)+' ('+v.joursSansVente+'j)'; }).join(', ') : '')+'</div>'
      +'</div>';

    let avisHtml = '<h4>🧑‍💼 AVIS DU DIRECTEUR RH</h4><div style="background:#f8fafc;padding:12px;border-radius:10px">'
      + decisionsRH.map(function(d){ return '<p>'+d+'</p>'; }).join('')
      + '<p><b>Priorité n°1 cette semaine :</b> '+(enDanger.length ? 'Faire l\'entretien avec '+IA_esc(enDanger[0].nom)+' et lancer le binôme '+IA_esc(meilleur.nom)+' + '+IA_esc(plusFaible.nom)+'.' : meilleur ? 'Féliciter '+IA_esc(meilleur.nom)+' et garder le rythme.' : 'Mettre un vendeur sur chaque vente pour suivre la performance.')+'</p></div>';

    return resumeHtml + classementHtml + paieHtml + coachingHtml + avisHtml + c.debug;
  };
})();
