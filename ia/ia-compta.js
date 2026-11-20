// ia-compta.js - V2.1 CORRIGE CA - Lit PV/Prix si TOTAL=0
(function(){
  function IA_getVal(id, def){
    let el = document.getElementById(id);
    if(!el || el.value==null || el.value==='') return def;
    let n = parseFloat(String(el.value).replace(/\s/g,'').replace(',','.'));
    return isNaN(n)?def:n;
  }
  // CORRECTION V2.1 : TOTAL fiable = TOTAL si >0, sinon QTE x PV/Prix
  function IA_totalLigne(l){
    if(l.TOTAL && l.TOTAL>0) return l.TOTAL;
    let prix = l.PV ?? l.Prix ?? l.PRIX ?? l.prix ?? 0;
    return (l.QTE||0) * IA_num(prix);
  }
  function IA_getDates(){
    let duEl = document.getElementById('cDu'), auEl = document.getElementById('cAu');
    let now = new Date();
    let du, au;
    if(duEl && duEl.value && auEl && auEl.value){
      du = new Date(duEl.value); au = new Date(auEl.value); au.setHours(23,59,59,999);
    } else {
      du = new Date(now.getFullYear(), now.getMonth(), 1);
      au = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999);
    }
    return {du:du, au:au, isFiltre: !!(duEl && duEl.value)};
  }
  function IA_filtrePeriode(lignes, du, au){
    return lignes.filter(function(l){ return l.DATE && l.DATE>=du.getTime() && l.DATE<=au.getTime(); });
  }

  window.IA_render_compta = function(c){
    let periode = IA_getDates();
    let du = periode.du, au = periode.au;
    let nbJours = Math.max(1, Math.ceil((au-du)/86400000)+1);
    let labelPeriode = du.toLocaleDateString('fr-FR')+' au '+au.toLocaleDateString('fr-FR') + (periode.isFiltre?'':' (mois en cours auto)');

    let base = IA_getVal('cBase', 50000);
    let comPct = IA_getVal('cCom', 10);
    let loyer = IA_getVal('cLoyer', 100000);
    let autreFixe = IA_getVal('cAutresFixe', 0);
    let emprunt = IA_getVal('cEmprunt', 0);
    let primePct = IA_getVal('cPrime', 25);
    let patronPct = IA_getVal('cPatron', 45);
    let devPct = IA_getVal('cDev', 30);

    let lignesPer = IA_filtrePeriode(c.lignes, du, au);
    // CORRECTION : on utilise IA_totalLigne partout, plus l.TOTAL seul
    let caPer = lignesPer.reduce(function(s,l){ return s+IA_totalLigne(l); },0);
    let qtePer = lignesPer.reduce(function(s,l){ return s+l.QTE; },0);

    let coutMarch = 0; let benefBrut = 0;
    let mapStock = {};
    c.stock.forEach(function(p){ mapStock[IA_code(p)] = p; });
    lignesPer.forEach(function(l){
      let p = mapStock[String(l.CODE)];
      let pa = p ? IA_pa(p) : 0;
      let tot = IA_totalLigne(l);
      coutMarch += l.QTE * pa;
      benefBrut += (tot - l.QTE*pa);
    });
    let margePct = caPer>0 ? (benefBrut/caPer*100) : 0;

    let depPer = [];
    try{
      let gf = (typeof getFiltered==='function' ? getFiltered() : null) || {};
      (gf.dep||[]).forEach(function(d){
        let dt = IA_time(d.date || d.Date || d.created);
        if(dt>=du.getTime() && dt<=au.getTime()) depPer.push(d);
      });
    }catch(e){}
    let totalDep = depPer.reduce(function(s,d){ return s + IA_num(d.montant ?? d.Montant ?? 0); },0);

    let vendeursPer = {};
    lignesPer.forEach(function(l){
      let v=String(l.VENDEUR||'Inconnu'); if(v.toLowerCase()==='comptoir') return;
      if(!vendeursPer[v]) vendeursPer[v]={nom:v,ca:0,benef:0};
      let tot = IA_totalLigne(l);
      vendeursPer[v].ca+=tot;
      let p=mapStock[String(l.CODE)]; let pa=p?IA_pa(p):0;
      vendeursPer[v].benef += (tot - l.QTE*pa);
    });
    let nbVendeurs = Object.keys(vendeursPer).length;
    let totalBase = nbVendeurs * base;
    let totalCom = benefBrut * (comPct/100);
    let totalSalaires = totalBase + totalCom;

    let totalChargesFixes = loyer + autreFixe + emprunt + totalBase;
    let chargesTotales = totalChargesFixes + totalDep + totalCom;
    let resultatNet = benefBrut - totalDep - totalChargesFixes - totalCom;
    let repart = resultatNet>0 ? resultatNet : 0;

    let seuilCA = margePct>0 ? chargesTotales/(margePct/100) : 0;
    let seuilJour = seuilCA / nbJours;
    let resteAfaire = Math.max(0, seuilCA - caPer);
    let joursRestants = Math.max(0, Math.ceil((au.getTime()-Date.now())/86400000));

    let stockAchat = c.cashBloque;
    let stockVente = c.valVente;
    let dettesClients = c.totalDettes;
    let actifTotal = stockAchat + dettesClients;
    let fondsPropresEst = actifTotal - chargesTotales + resultatNet;

    let vendeursArr = Object.values(vendeursPer).sort(function(a,b){ return b.benef-a.benef; });
    let meilleur = vendeursArr[0] || null;
    let plusFaible = vendeursArr[vendeursArr.length-1] || null;

    let alertes = [];
    if(margePct < 20) alertes.push('⚠️ Marge à '+margePct.toFixed(1)+'% : en dessous de 20%. Tu vends trop pas cher ou tu achètes trop cher. Vérifie tes PA.');
    if(resultatNet < 0) alertes.push('🔴 PERTE de '+IA_fmt(Math.abs(resultatNet))+' sur la période. Tu dois vendre '+IA_fmt(resteAfaire)+' avant le '+au.toLocaleDateString('fr-FR')+' pour être à zéro.');
    if(caPer < seuilCA) alertes.push('🎯 Tu es à '+IA_fmt(caPer)+' / objectif '+IA_fmt(seuilCA)+'. Il te manque '+IA_fmt(resteAfaire)+' de CA.');
    if(dettesClients > caPer*0.2) alertes.push('💳 Dettes clients '+IA_fmt(dettesClients)+' : trop élevées, plus de 20% de ton CA. Récupère avant de commander.');
    if(c.cashBloque > 3000000) alertes.push('💰 Cash bloqué en stock '+IA_fmt(c.cashBloque)+' : ne commande plus de dormants, vends d\'abord.');
    if(alertes.length===0) alertes.push('✅ Compta saine sur la période. Marge, résultat et dettes sous contrôle.');

    let filtreHtml = '<div style="background:#f8fafc;padding:10px;border-radius:10px;margin-bottom:10px">📅 <b>Période analysée :</b> '+labelPeriode+' | '+nbJours+' jours<br><span style="font-size:11px;color:#555">L\'IA lit les mêmes champs que ton onglet Compta principal : Loyer, Base, Commission, Emprunt, Autres Fixes. Change les dates dans Compta principal (Du/Au) et re-clique sur Compta IA, elle recalcule.</span></div>';
    let compteResHtml = '<h4>📊 COMPTE DE RÉSULTAT - '+labelPeriode+'</h4><div style="overflow:auto"><table><tr><th>Poste</th><th>Montant</th><th>Lecture comptable</th></tr>'
      +'<tr><td>CA - Chiffre d\'affaires</td><td><b>'+IA_fmt(caPer)+'</b></td><td>'+qtePer+' pcs vendus</td></tr>'
      +'<tr><td>- Coût des marchandises vendues (PA x Qté)</td><td>- '+IA_fmt(coutMarch)+'</td><td>Ce que tes produits t\'ont coûté</td></tr>'
      +'<tr style="background:#dcfce7"><td><b>= MARGE BRUTE</b></td><td><b>'+IA_fmt(benefBrut)+' ('+margePct.toFixed(1)+'%)</b></td><td>'+(margePct>=30?'Bonne marge':'Marge faible')+'</td></tr>'
      +'<tr><td>- Dépenses (dep)</td><td>- '+IA_fmt(totalDep)+'</td><td>'+depPer.length+' dépenses sur la période</td></tr>'
      +'<tr><td>- Loyer</td><td>- '+IA_fmt(loyer)+'</td><td>Fixe</td></tr>'
      +'<tr><td>- Autres fixes</td><td>- '+IA_fmt(autreFixe)+'</td><td>Fixe</td></tr>'
      +'<tr><td>- Emprunt</td><td>- '+IA_fmt(emprunt)+'</td><td>À rembourser</td></tr>'
      +'<tr><td>- Bases salaires ('+nbVendeurs+' x '+IA_fmt(base)+')</td><td>- '+IA_fmt(totalBase)+'</td><td>Fixe</td></tr>'
      +'<tr><td>- Commissions ('+comPct+'% sur marge)</td><td>- '+IA_fmt(totalCom)+'</td><td>Variable</td></tr>'
      +'<tr style="background:#111;color:#fff"><td><b>= RÉSULTAT NET</b></td><td><b style="color:'+(resultatNet>=0?'#22c55e':'#ef4444')+'">'+IA_fmt(resultatNet)+'</b></td><td>'+(resultatNet>=0?'Bénéfice':'Perte')+' sur la période</td></tr>'
      +'</table></div>';

    let bilanHtml = '<h4>⚖️ BILAN À MI-PARCOURS - au '+au.toLocaleDateString('fr-FR')+'</h4><div style="overflow:auto"><table><tr><th>Ce que tu AS (Actif)</th><th>Montant</th><th>Ce que tu DOIS / Charges (Passif)</th><th>Montant</th></tr>'
      +'<tr><td>Stock à l\'achat (Qté x PA)</td><td>'+IA_fmt(stockAchat)+'</td><td>Charges totales période</td><td>'+IA_fmt(chargesTotales)+'</td></tr>'
      +'<tr><td>Dettes clients à récupérer</td><td>'+IA_fmt(dettesClients)+'</td><td>Emprunt à rembourser</td><td>'+IA_fmt(emprunt)+'</td></tr>'
      +'<tr><td>Stock à la vente (si tout vendu)</td><td>'+IA_fmt(stockVente)+'</td><td>Salaires + Com à payer</td><td>'+IA_fmt(totalSalaires)+'</td></tr>'
      +'<tr style="background:#f8fafc"><td><b>Total Actif</b></td><td><b>'+IA_fmt(actifTotal)+'</b></td><td><b>Résultat net période</b></td><td><b>'+IA_fmt(resultatNet)+'</b></td></tr>'
      +'</table></div><p style="font-size:11px;color:#555">Lecture : Si tu vendais tout ton stock aujourd\'hui à prix de vente, tu aurais '+IA_fmt(stockVente)+'. Aujourd\'hui il vaut '+IA_fmt(stockAchat)+' à l\'achat. La différence, c\'est ta marge potentielle : '+IA_fmt(stockVente-stockAchat)+'. Fonds propres estimés : '+IA_fmt(fondsPropresEst)+'</p>';

    let seuilHtml = '<h4>🎯 SEUIL DE RENTABILITÉ</h4><div style="background:#fffbeb;border:2px solid #f59e0b;padding:12px;border-radius:10px">'
      +'Pour ne pas perdre, tu dois faire <b style="font-size:18px;color:#dc2626">'+IA_fmt(seuilCA)+' de CA</b> sur la période, soit <b>'+IA_fmt(seuilJour)+' / jour</b>.<br>'
      +'Tu as fait '+IA_fmt(caPer)+'. Il te reste '+IA_fmt(resteAfaire)+' à faire'+(joursRestants>0?' en '+joursRestants+' jours':'')+'.<br>'
      +(caPer>=seuilCA ? '✅ Tu as dépassé ton seuil, tout ce que tu vends maintenant, c\'est du bénéfice.' : '❌ Tu es encore sous le seuil. Ne commande pas de nouveau stock tant que tu n\'as pas atteint ce seuil.')
      +'</div>';

    let repartHtml = '<h4>💰 RÉPARTITION DU RÉSULTAT NET - '+IA_fmt(repart)+'</h4><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">'
      +'<div style="background:#facc15;padding:12px;border-radius:12px;text-align:center">PRIME '+primePct+'%<br><b>'+IA_fmt(repart*(primePct/100))+'</b><br>'+(meilleur?meilleur.nom:'')+'</div>'
      +'<div style="background:#0b5e2f;color:#fff;padding:12px;border-radius:12px;text-align:center">PATRON '+patronPct+'%<br><b>'+IA_fmt(repart*(patronPct/100))+'</b></div>'
      +'<div style="background:#0ea5e9;color:#fff;padding:12px;border-radius:12px;text-align:center">DEV '+devPct+'%<br><b>'+IA_fmt(repart*(devPct/100))+'</b></div></div>';

    let salairesHtml = '<h4>👥 SALAIRES - '+nbVendeurs+' vendeurs actifs</h4><div style="overflow:auto"><table><tr><th>Vendeur</th><th>CA période</th><th>Marge générée</th><th>Base + Com</th><th>Salaire à payer</th></tr>'
      + vendeursArr.map(function(v){ let com = v.benef*(comPct/100); let sal = base+com; return '<tr><td><b>'+IA_esc(v.nom)+'</b></td><td>'+IA_fmt(v.ca)+'</td><td>'+IA_fmt(v.benef)+'</td><td>'+IA_fmt(base)+' + '+IA_fmt(com)+'</td><td><b>'+IA_fmt(sal)+'</b></td></tr>'; }).join('') + '</table></div>'
      + (meilleur ? '<p>🏆 Meilleur vendeur : <b>'+IA_esc(meilleur.nom)+'</b> avec '+IA_fmt(meilleur.benef)+' de marge.</p>' : '')
      + (plusFaible && vendeursArr.length>1 ? '<p>📉 À coacher : <b>'+IA_esc(plusFaible.nom)+'</b> avec '+IA_fmt(plusFaible.benef)+' de marge. Mets-le 2 jours avec '+IA_esc(meilleur.nom)+'.</p>' : '');

    let alertesHtml = '<h4>🧑‍💼 AVIS DU COMPTABLE</h4><div style="background:#f8fafc;padding:12px;border-radius:10px">'+alertes.map(function(a){ return '<p>'+a+'</p>'; }).join('')+'<p><b>Action prioritaire :</b> '+(resultatNet<0 ? 'Ne commande rien cette semaine, récupère '+IA_fmt(dettesClients)+' de dettes et vends tes dormants.' : 'Tu peux commander, mais seulement les ruptures. Garde '+IA_fmt(repart*(patronPct/100))+' pour toi, '+IA_fmt(repart*(devPct/100))+' pour le développement.')+'</p></div>';

    return filtreHtml + compteResHtml + bilanHtml + seuilHtml + repartHtml + salairesHtml + alertesHtml + c.debug;
  };
})();
