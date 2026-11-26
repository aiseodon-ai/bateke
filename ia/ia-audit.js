// ia-audit.js - V2.1 - INSPECTEUR - PV réel depuis les ventes, pas depuis le stock
// V2.0 bug : stock PV = 0 FC partout, donc marges 0%. V2.1 : PV = CA produit / Qté vendue = vrai prix payé par le client.
// Ex : SU002 SUPPORT TV : CA 42 000 / 6 = 7 000 FC, PA 4 900 FC, marge = (7000-4900)/7000 = 30% = SAINE
// SMIG officiel : 21 000 FC / jour = 630 000 FC / mois | SMIG réel : 11 500 FC / jour = 345 000 FC / mois
(function(){
  window.IA_render_audit = function(c){
    c = c || {};
    let gf = {};
    try{ gf = (typeof getFiltered==='function' ? getFiltered() : null) || {}; }catch(e){ gf={}; }
    let ventesBrutes = gf.ventes || c.ventes || [];
    let stockBrut = gf.stock || c.stock || [];
    let now = new Date();
    now.setHours(0,0,0,0);
    let nowTs = now.getTime();
    function qteStock(p){
      if(!p) return 0;
      return IA_num(p['Qte Restante'] ?? p['Qté Restante'] ?? p.QTE ?? p.qte ?? p.Qte ?? p.Stock ?? p.stock ?? p['Quantité'] ?? p['Quantite'] ?? p.quantite ?? p['Qté'] ?? p.QTY ?? 0);
    }
    function prixVenteStock(p){
      if(!p) return 0;
      // On essaie TOUTES les formes possibles du champ PV dans le stock
      return IA_num(p['Prix Vente'] ?? p['Prix Vente '] ?? p['Prix de Vente'] ?? p.PV ?? p.pv ?? p['Prix'] ?? p.Prix ?? p.PRIX ?? p.prix ?? p.PrixVente ?? p.Prix_Vente ?? p['Prix Unitaire'] ?? p['Prix unitaire'] ?? 0);
    }
    function designation(p, code){
      if(!p) return String(code);
      let d = p['Désignation'] ?? p['Designation'] ?? p.Designation ?? p.Nom ?? p.nom ?? p.Libelle ?? p.libelle ?? p['Produit'] ?? p.Produit ?? '';
      d = String(d||'').trim();
      if(!d || d===String(code)) return String(code);
      return d;
    }
    function nomProd(code, map){
      let p = map[String(code)];
      let des = designation(p, String(code));
      if(des===String(code)) return String(code);
      return String(code)+' - '+des;
    }
    let fullMap = {};
    stockBrut.forEach(function(p){ let code = p.CODE || p._id; if(code) fullMap[String(code)] = p; });

    let parProduit = {};
    let caTotal = 0, benefTotal = 0;
    let debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    let debutMoisDernier = new Date(now.getFullYear(), now.getMonth()-1, 1);
    let finMoisDernier = new Date(now.getFullYear(), now.getMonth(), 0);
    finMoisDernier.setHours(23,59,59,999);
    let debutSemaine = new Date(now); let j = now.getDay(); let dec = (j===0)?-6:(1-j); debutSemaine.setDate(now.getDate()+dec);
    let debutSemaineDerniere = new Date(debutSemaine); debutSemaineDerniere.setDate(debutSemaine.getDate()-7);
    let finSemaineDerniere = new Date(debutSemaine); finSemaineDerniere.setDate(debutSemaine.getDate()-1); finSemaineDerniere.setHours(23,59,59,999);
    let caMois = 0, caMoisDernier = 0, caSemaine = 0, caSemaineDerniere = 0;
    let benefMois = 0;
    let nbVentesMois = 0;
    ventesBrutes.forEach(function(v){
      let d = new Date(v.date ?? v.dateVente ?? v.createdAt ?? 0);
      if(isNaN(d.getTime())) return;
      let dTs = d.getTime();
      let caVente = IA_num(v.total ?? v.montant ?? v.montantTotal ?? 0);
      let items = v.items || [];
      let caItems = 0;
      let lignes = items.map(function(it){
        let qty = IA_num(it.qty ?? it.QTE ?? 0);
        let prix = IA_num(it.Prix ?? it.prix ?? it.PV ?? 0);
        if(prix===0){ let pp = fullMap[String(it.CODE || it.code)]; if(pp) prix = prixVenteStock(pp); }
        let pa = fullMap[String(it.CODE || it.code)] ? IA_pa(fullMap[String(it.CODE || it.code)]) : 0;
        let caBrut = qty * prix;
        caItems += caBrut;
        return {CODE:String(it.CODE || it.code || ''), qty:qty, prix:prix, pa:pa, caBrut:caBrut};
      });
      if(caVente===0 && caItems>0) caVente = caItems;
      let ratio = (caVente>0 && caItems>0) ? (caVente / caItems) : 1;
      if(dTs >= debutMois.getTime()){ caMois += caVente; nbVentesMois++; }
      if(dTs >= debutMoisDernier.getTime() && dTs <= finMoisDernier.getTime()) caMoisDernier += caVente;
      if(dTs >= debutSemaine.getTime()) caSemaine += caVente;
      if(dTs >= debutSemaineDerniere.getTime() && dTs <= finSemaineDerniere.getTime()) caSemaineDerniere += caVente;
      lignes.forEach(function(l){
        if(!l.CODE) return;
        let caCorr = l.caBrut * ratio;
        let benefCorr = caCorr - (l.qty * l.pa);
        if(!parProduit[l.CODE]) parProduit[l.CODE] = {CODE:l.CODE, qte:0, ca:0, benef:0, cout:0};
        parProduit[l.CODE].qte += l.qty;
        parProduit[l.CODE].ca += caCorr;
        parProduit[l.CODE].benef += benefCorr;
        parProduit[l.CODE].cout += (l.qty * l.pa);
        if(dTs >= debutMois.getTime()) benefMois += benefCorr;
      });
      caTotal += caVente;
    });
    benefTotal = Object.values(parProduit).reduce(function(s,p){ return s + p.benef; }, 0);
    let joursEcoules = Math.max(1, now.getDate());
    let nbJoursMois = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    let benefMoisEstime = Math.round(benefMois / joursEcoules * nbJoursMois);
    let caMoisEstime = Math.round(caMois / joursEcoules * nbJoursMois);
    let caJourMoyen = caMois / joursEcoules;

    // ✅ V2.1 - MARGES AVEC PV RÉEL = CA / QTÉ
    let margeList = Object.values(parProduit).map(function(p){
      let prod = fullMap[p.CODE];
      let pa = prod ? IA_pa(prod) : 0;
      let pvStock = prixVenteStock(prod);
      // PV réel : d'abord stock si >0, sinon CA / Qté = prix vraiment payé
      let pv = pvStock > 0 ? pvStock : (p.qte>0 ? (p.ca / p.qte) : 0);
      // Si le stock dit 0 mais les ventes disent autre chose, on croit les ventes
      if(pvStock===0 && p.qte>0) pv = p.ca / p.qte;
      let margePct = (pv>0) ? ((pv-pa)/pv*100) : 0;
      let cat = '', catTxt = '';
      if(pv<=0 || pa<=0){ cat='inconnu'; catTxt='⚪ Prix / PA manquant'; }
      else if(margePct<0){ cat='perte'; catTxt='⚫ PERTE'; }
      else if(margePct<15){ cat='dangereuse'; catTxt='🔴 DANGEREUSE'; }
      else if(margePct<30){ cat='juste'; catTxt='🟡 JUSTE'; }
      else { cat='saine'; catTxt='🟢 SAINE'; }
      return {CODE:p.CODE, nom:nomProd(p.CODE, fullMap), qte:p.qte, ca:p.ca, benef:p.benef, pv:pv, pa:pa, marge:margePct, cat:cat, catTxt:catTxt};
    }).sort(function(a,b){ return a.marge - b.marge; });
    let nbPerte = margeList.filter(function(x){ return x.cat==='perte'; }).length;
    let nbDangereuse = margeList.filter(function(x){ return x.cat==='dangereuse'; }).length;
    let nbJuste = margeList.filter(function(x){ return x.cat==='juste'; }).length;
    let nbSaine = margeList.filter(function(x){ return x.cat==='saine'; }).length;
    let nbInconnu = margeList.filter(function(x){ return x.cat==='inconnu'; }).length;
    let perteParMois = margeList.filter(function(x){ return x.cat==='perte' || x.cat==='dangereuse'; }).reduce(function(s,x){ return s + Math.min(0, x.benef); }, 0);
    let benefSiCorrige = benefMoisEstime - perteParMois;

    let dormants = c.dormants || [];
    let ruptures = c.ruptures || [];
    if(!dormants.length && stockBrut.length){
      stockBrut.forEach(function(p){
        let code = String(p.CODE || p._id);
        let q = qteStock(p);
        if(q<5) return;
        let vendu = parProduit[code];
        if(!vendu) dormants.push({CODE:code, nom:nomProd(code, fullMap), qteStock:q, cashBloque:q*IA_pa(p)});
      });
    }
    let cashBloque = dormants.reduce(function(s,d){ return s + IA_num(d.cashBloque ?? (IA_num(d.qteStock||d.qte||0) * IA_num(d.pa||0)) ?? 0); }, 0);
    if(cashBloque===0 && dormants.length){
      cashBloque = dormants.reduce(function(s,d){ let pp = fullMap[String(d.CODE)]; return s + (IA_num(d.qteStock||d.qte||0) * (pp?IA_pa(pp):0)); }, 0);
    }
    let aRelancer = c.aRelancer || [];
    let dettesTotal = 0;
    ventesBrutes.forEach(function(v){
      let paye = IA_num(v.paye ?? v.montantPaye ?? IA_num(v.total ?? 0));
      let reste = IA_num(v.reste ?? v.Reste ?? Math.max(0, IA_num(v.total ?? 0) - paye));
      if(reste>0) dettesTotal += reste;
    });
    function evol(actuel, precedent){
      if(precedent===0) return {txt:'Pas de référence', pct:0, sens:'-'};
      let pct = ((actuel - precedent)/precedent*100);
      let sens = pct>5 ? '📈 EN MONTÉE' : (pct<-5 ? '📉 EN CHUTE' : '➡️ STABLE');
      let txt = (pct>=0?'+':'')+Math.round(pct)+'%';
      return {txt:txt, pct:pct, sens:sens};
    }
    let evolSemaine = evol(caSemaine, caSemaineDerniere);
    let evolMois = evol(caMois, caMoisDernier);
    let panierMoyen = nbVentesMois>0 ? (caMois / nbVentesMois) : 0;
    let tauxDette = caMois>0 ? (dettesTotal / Math.max(1, caMois) * 100) : 0;
    let produitsTriCA = Object.values(parProduit).sort(function(a,b){ return b.ca-a.ca; });
    let starCA = produitsTriCA[0] ? produitsTriCA[0].ca : 0;
    let dependanceStar = caTotal>0 ? (starCA / caTotal * 100) : 0;
    let nomStar = produitsTriCA[0] ? nomProd(produitsTriCA[0].CODE, fullMap) : '-';
    let SMIG_OFFICIEL_JOUR = 21000, SMIG_REEL_JOUR = 11500;
    let SMIG_OFFICIEL_MOIS = SMIG_OFFICIEL_JOUR * 30;
    let SMIG_REEL_MOIS = SMIG_REEL_JOUR * 30;
    let nbSalairesReel = Math.floor(benefMoisEstime / SMIG_REEL_MOIS);
    let nbSalairesOfficiel = Math.floor(benefMoisEstime / SMIG_OFFICIEL_MOIS);
    let restePourPatronApres1Reel = benefMoisEstime - SMIG_REEL_MOIS;
    let restePourPatronApres1Officiel = benefMoisEstime - SMIG_OFFICIEL_MOIS;
    let verdictVie = '';
    if(benefMoisEstime<=0) verdictVie = '🔴 Tu manges ton capital. Le bénéfice ne couvre même pas 1 salaire. Il faut corriger les prix tout de suite.';
    else if(benefMoisEstime < SMIG_REEL_MOIS) verdictVie = '🔴 Ton bénéfice du mois ne paie même pas 1 travailleur au SMIG réel (345 000 FC). Tu travailles pour rien.';
    else if(benefMoisEstime < SMIG_REEL_MOIS*2) verdictVie = '🟡 Tu paies 1 travailleur au SMIG réel, il te reste '+IA_fmt(restePourPatronApres1Reel)+' pour toi + loyer + charges. C\'est juste, tu survis.';
    else if(benefMoisEstime < SMIG_OFFICIEL_MOIS*2) verdictVie = '🟢 Tu paies 1 à 2 travailleurs au SMIG réel, et il te reste quelque chose. Tu avances, mais doucement.';
    else verdictVie = '🟢 Tu paies tes travailleurs au SMIG officiel et il te reste pour toi. La boutique fait vivre la maison.';
    function proj(mois, benefMensuel){ return {m6: Math.round(benefMensuel*6), m12: Math.round(benefMensuel*12), m36: Math.round(benefMensuel*36), m60: Math.round(benefMensuel*60)}; }
    let pGarde = {m6:benefMoisEstime*6, m12:benefMoisEstime*12, m36:benefMoisEstime*36, m60:benefMoisEstime*60};
    let benefAccelere = Math.round(benefMoisEstime*1.2);
    let pAccelere = {m6:benefAccelere*6, m12:benefAccelere*12, m36:benefAccelere*36, m60:benefAccelere*60};
    let benefCorrige = Math.max(benefMoisEstime, benefSiCorrige);
    let benefCorrigeAccelere = Math.round(benefCorrige*1.2);
    let pCorrige = {m6:benefCorrigeAccelere*6, m12:benefCorrigeAccelere*12, m36:benefCorrigeAccelere*36, m60:benefCorrigeAccelere*60};
    function fmtProj(v){ return IA_fmt(Math.round(v)); }
    function salairesPour(montantCumul, mois){ return Math.floor(montantCumul / SMIG_REEL_MOIS); }
    let note = 10;
    if(nbPerte>0) note -= 4;
    if(nbDangereuse>0) note -= 2;
    if(evolMois.pct>5) note += 3; else if(evolMois.pct<-5) note -= 3;
    if(ruptures.length>0) note -= 2;
    if(dormants.length>5) note -= 2;
    if(tauxDette>10) note -= 2;
    if(dependanceStar>50) note -= 1;
    if(benefMoisEstime >= SMIG_REEL_MOIS*2) note += 2;
    note = Math.max(0, Math.min(20, note));
    let mention = note>=16 ? '🟢 BON - Continue' : note>=10 ? '🟡 MOYEN - À corriger vite' : '🔴 DANGER - Il faut changer de rythme';
    let html = '<h4>🧑‍✈️ AUDIT INSPECTEUR - VÉRITÉ DU TERRAIN</h4>'
      +'<div style="background:#0f172a;color:#fff;padding:12px;border-radius:12px"><b>NOTE DE L\'INSPECTEUR : '+note+' / 20 - '+mention+'</b><br><span style="font-size:12px">Bénéfice brut estimé ce mois : '+IA_fmt(benefMoisEstime)+' (sur '+joursEcoules+' jours, estimé sur '+nbJoursMois+' jours) | CA mois : '+IA_fmt(caMois)+' (estimé '+IA_fmt(caMoisEstime)+')</span></div>';
    html += '<h4>1️⃣ MARGES - Tu avances ou tu recules ?</h4>'
      +'<p>🟢 Saine (+30%) : <b>'+nbSaine+'</b> produits | 🟡 Juste (15-30%) : <b>'+nbJuste+'</b> | 🔴 Dangereuse (&lt;15%) : <b>'+nbDangereuse+'</b> | ⚫ Perte : <b>'+nbPerte+'</b>'+(nbInconnu>0?' | ⚪ Inconnu : <b>'+nbInconnu+'</b>':'')+'</p>'
      +'<div style="overflow:auto"><table><tr><th>Produit</th><th>PV réel</th><th>PA</th><th>Marge</th><th>Vendus</th><th>Bénéfice</th><th>Verdict</th></tr>'
      + margeList.slice(0,15).map(function(x){
          return '<tr><td><b>'+IA_esc(x.nom)+'</b></td><td>'+IA_fmt(x.pv)+'</td><td>'+IA_fmt(x.pa)+'</td><td style="color:'+(x.marge<0?'#000':x.marge<15?'#ef4444':x.marge<30?'#d97706':'#16a34a')+'"><b>'+Math.round(x.marge)+'%</b></td><td>'+x.qte+'</td><td>'+IA_fmt(x.benef)+'</td><td>'+x.catTxt+'</td></tr>';
        }).join('')
      + (margeList.length===0 ? '<tr><td colspan="7">Aucune vente analysée pour les marges.</td></tr>' : '')
      + '</table></div>'
      + (nbPerte+nbDangereuse>0 ? '<p style="background:#fee2e2;padding:8px;border-radius:8px">⚠️ <b>Action urgente :</b> '+(nbPerte+nbDangereuse)+' produits te font perdre ou presque rien gagner. Augmente leur prix de 500 FC ou arrête de les vendre. Tu perds environ '+IA_fmt(Math.abs(perteParMois))+' / mois avec eux.</p>' : '<p style="background:#dcfce7;padding:8px;border-radius:8px">✅ Aucun produit en perte. Tes marges sont saines.</p>');
    html += '<h4>2️⃣ ÉVOLUTION DU CA - Tu progresses ?</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<div style="background:#f8fafc;padding:12px;border-radius:12px"><b>📅 CETTE SEMAINE vs SEMAINE DERNIÈRE</b><br>CA semaine : <b>'+IA_fmt(caSemaine)+'</b><br>CA semaine dernière : '+IA_fmt(caSemaineDerniere)+'<br><b>'+evolSemaine.sens+' '+evolSemaine.txt+'</b></div>'
      +'<div style="background:#f8fafc;padding:12px;border-radius:12px"><b>📅 CE MOIS vs MOIS DERNIER</b><br>CA mois : <b>'+IA_fmt(caMois)+'</b><br>CA mois dernier : '+IA_fmt(caMoisDernier)+'<br><b>'+evolMois.sens+' '+evolMois.txt+'</b></div>'
      +'</div>'
      +'<p>CA / jour moyen : <b>'+IA_fmt(Math.round(caJourMoyen))+'</b> | Panier moyen : <b>'+IA_fmt(Math.round(panierMoyen))+'</b> ('+nbVentesMois+' ventes ce mois) | Star : <b>'+IA_esc(nomStar)+'</b> = '+Math.round(dependanceStar)+'% du CA '+(dependanceStar>50?'⚠️ Tu dépends trop d\'un seul produit, c\'est fragile.':'✅ Pas trop dépendant.')+'</p>';
    html += '<h4>3️⃣ LE BÉNÉFICE FAIT-IL VIVRE LA MAISON ?</h4><div style="background:#fffbeb;border:2px solid #f59e0b;padding:12px;border-radius:12px">'
      +'<p><b>Bénéfice brut estimé ce mois : '+IA_fmt(benefMoisEstime)+'</b> (avant loyer, électricité, transport - c\'est le brut, pas le net)</p>'
      +'<p>SMIG réel beaucoup appliqué : <b>11 500 FC / jour = 345 000 FC / mois</b> par travailleur<br>SMIG officiel : <b>21 000 FC / jour = 630 000 FC / mois</b> par travailleur</p>'
      +'<p>Avec ce bénéfice, tu peux payer : <b>'+nbSalairesReel+' salaire(s) au SMIG réel</b> | <b>'+nbSalairesOfficiel+' salaire(s) au SMIG officiel</b></p>'
      +'<p>Si tu paies 1 travailleur au SMIG réel (345 000 FC), il te reste : <b>'+IA_fmt(restePourPatronApres1Reel)+'</b> pour toi + loyer + charges.<br>Si tu paies 1 travailleur au SMIG officiel (630 000 FC), il te reste : <b>'+IA_fmt(restePourPatronApres1Officiel)+'</b></p>'
      +'<p><b>'+verdictVie+'</b></p>'
      +'</div>'
      +'<p>💤 Cash bloqué dans dormants : <b>'+IA_fmt(cashBloque)+'</b> ('+dormants.length+' dormants) | 🚫 Ruptures vraies : <b>'+ruptures.length+'</b> | 💳 Dettes : <b>'+IA_fmt(dettesTotal)+'</b> = '+Math.round(tauxDette)+'% du CA mois '+(tauxDette>10?'🔴 Trop de dettes, récupère d\'abord.':'✅ Dettes sous contrôle.')+' | 📞 À relancer : <b>'+aRelancer.length+'</b></p>';
    html += '<h4>4️⃣ PROJECTIONS - Où tu seras si tu gardes ou changes le rythme ?</h4>'
      +'<p style="font-size:12px;color:#555">Projection sur le bénéfice brut mensuel estimé : '+IA_fmt(benefMoisEstime)+' / mois. Ce n\'est pas une promesse, c\'est : si tu continues comme ça, voilà où tu arrives.</p>'
      +'<div style="overflow:auto"><table><tr><th>Scénario</th><th>Bénéfice / mois</th><th>6 mois</th><th>1 an</th><th>3 ans</th><th>5 ans</th><th>Ça paie combien de salaires réels ? (1 an)</th></tr>'
      +'<tr><td><b>1. Tu gardes le rythme</b><br><small>Tu ne changes rien</small></td><td>'+IA_fmt(benefMoisEstime)+'</td><td>'+fmtProj(pGarde.m6)+'</td><td><b>'+fmtProj(pGarde.m12)+'</b></td><td>'+fmtProj(pGarde.m36)+'</td><td>'+fmtProj(pGarde.m60)+'</td><td>'+salairesPour(pGarde.m12,12)+' mois de salaire</td></tr>'
      +'<tr><td><b>2. Tu accélères +20%</b><br><small>Plan Marketing appliqué</small></td><td>'+IA_fmt(benefAccelere)+'</td><td>'+fmtProj(pAccelere.m6)+'</td><td><b>'+fmtProj(pAccelere.m12)+'</b></td><td>'+fmtProj(pAccelere.m36)+'</td><td>'+fmtProj(pAccelere.m60)+'</td><td>'+salairesPour(pAccelere.m12,12)+' mois de salaire</td></tr>'
      +'<tr style="background:#dcfce7"><td><b>3. Tu corriges + tu accélères</b><br><small>Tu enlèves les marges dangereuses + tu accélères</small></td><td><b>'+IA_fmt(benefCorrigeAccelere)+'</b></td><td>'+fmtProj(pCorrige.m6)+'</td><td><b>'+fmtProj(pCorrige.m12)+'</b></td><td>'+fmtProj(pCorrige.m36)+'</td><td>'+fmtProj(pCorrige.m60)+'</td><td>'+salairesPour(pCorrige.m12,12)+' mois de salaire</td></tr>'
      +'</table></div>'
      +'<p><b>Lecture du Directeur :</b> '
      + (benefMoisEstime<=0 ? 'À ce rythme, dans 5 ans tu auras mangé ton capital. Il faut changer de rythme maintenant, pas dans 6 mois.' : 'Si tu gardes le rythme, en 5 ans tu cumules '+fmtProj(pGarde.m60)+'. Si tu corriges + accélères, tu cumules '+fmtProj(pCorrige.m60)+'. La différence = '+fmtProj(pCorrige.m60 - pGarde.m60)+'. C\'est le prix de ne pas corriger.')
      +'</p>'
      +'<p><b>Priorité n°1 de l\'Inspecteur :</b> '+(nbPerte+nbDangereuse>0 ? 'Corrige les '+(nbPerte+nbDangereuse)+' produits à marge dangereuse / perte, avant de chercher plus de clients.' : (dormants.length>0 ? 'Vide les dormants, '+IA_fmt(cashBloque)+' dort en stock.' : 'Pousse ton Star '+IA_esc(nomStar)+' et relance tes VIP.'))+'</p>';
    return html + (c.debug || '');
  };
})();
