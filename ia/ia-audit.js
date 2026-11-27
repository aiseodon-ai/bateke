// ia-audit.js - V2.6 - INSPECTEUR - Dettes comme dette.js + Standard SMIG uniquement, plus de Coût de vie 900 000 FC
// V2.5 bug Dette = 0 : Audit calculait dettes sur ventes filtrées du mois, alors que dette.js les calcule sur TOUTES les ventes + lit v.reste direct.
// V2.6 : Dettes = exactement comme dette.js : getFiltered().ventes.filter(v => Number(v.reste ?? v.Reste ?? 0) > 0) + lecture du DOM #totalDettes déjà calculé par l'onglet Dettes.
// V2.6 : On enlève Coût de vie Kinshasa 900 000 FC. On reste standard barème national : SMIG officiel 21 000 FC/jour = 630 000 FC/mois.
// Patron = au moins 1 SMIG officiel. Vendeur = au moins 1 SMIG officiel. Base 50 000 FC = très en dessous du SMIG, c'est illégal au barème national.
(function(){
  function IA_getValAudit(id, def){
    let el = document.getElementById(id);
    if(!el || el.value==null || el.value==='') return def;
    let n = parseFloat(String(el.value).replace(/\s/g,'').replace(',','.'));
    return isNaN(n)?def:n;
  }
  window.IA_render_audit = function(c){
    c = c || {};
    let gf = {};
    try{ gf = (typeof getFiltered==='function' ? getFiltered() : null) || {}; }catch(e){ gf={}; }
    let ventesBrutes = gf.ventes || c.ventes || [];
    let stockBrut = gf.stock || c.stock || [];
    let depBrutes = gf.dep || c.dep || [];
    let now = new Date();
    now.setHours(0,0,0,0);
    let base = IA_getValAudit('cBase', 50000);
    let comPct = IA_getValAudit('cCom', 10);
    let loyer = IA_getValAudit('cLoyer', 100000);
    let autreFixe = IA_getValAudit('cAutresFixe', 0);
    let emprunt = IA_getValAudit('cEmprunt', 0);
    let primePct = IA_getValAudit('cPrime', 25);
    let patronPct = IA_getValAudit('cPatron', 45);
    let devPct = IA_getValAudit('cDev', 30);
    function qteStock(p){
      if(!p) return 0;
      return IA_num(p['Qte Restante'] ?? p['Qté Restante'] ?? p.QTE ?? p.qte ?? p.Qte ?? p.Stock ?? p.stock ?? p['Quantité'] ?? p['Quantite'] ?? p.quantite ?? p['Qté'] ?? p.QTY ?? 0);
    }
    function prixVenteStock(p){
      if(!p) return 0;
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
    let caTotal = 0;
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
    let totalDepMois = 0;
    depBrutes.forEach(function(d){
      let dt = new Date(d.date);
      if(!isNaN(dt.getTime()) && dt>=debutMois) totalDepMois += IA_num(d.montant ?? d.Montant ?? 0);
    });
    let exclus = window.CURRENT_CONFIG?.compta?.exclus || [];
    let nomsVendeursMois = {};
    ventesBrutes.forEach(function(v){
      let d = new Date(v.date ?? v.dateVente ?? v.createdAt ?? 0);
      if(isNaN(d.getTime()) || d < debutMois) return;
      let nomRaw = String(v.vendeurNom || v.vendeur || 'Inconnu').trim();
      let low = nomRaw.toLowerCase();
      if(!nomRaw || low==='comptoir' || low==='inconnu' || low==='patron' || low==='bâteau' || low==='bateke') return;
      let keyExclus = low.replace(/\s+/g,'').replace(/[^a-z]/g,'');
      if(exclus.includes(keyExclus)) return;
      nomsVendeursMois[nomRaw]=1;
    });
    let nbVendeurs = Math.max(1, Object.keys(nomsVendeursMois).length);
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
    let joursEcoules = Math.max(1, now.getDate());
    let nbJoursMois = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    let benefMoisEstime = Math.round(benefMois / joursEcoules * nbJoursMois);
    let caMoisEstime = Math.round(caMois / joursEcoules * nbJoursMois);
    let caJourMoyen = caMois / joursEcoules;
    let margeList = Object.values(parProduit).map(function(p){
      let prod = fullMap[p.CODE];
      let pa = prod ? IA_pa(prod) : 0;
      let pvStock = prixVenteStock(prod);
      let pv = pvStock > 0 ? pvStock : (p.qte>0 ? (p.ca / p.qte) : 0);
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
    let dormants = c.dormants || [];
    let ruptures = c.ruptures || [];
    if(!dormants.length && stockBrut.length){
      stockBrut.forEach(function(p){
        let code = String(p.CODE || p._id);
        let q = qteStock(p);
        if(q<5) return;
        let vendu = parProduit[code];
        if(!vendu) dormants.push({CODE:code, nom:nomProd(code, fullMap)});
      });
    }
    let cashBloque = 0;
    let dormantsDetail = dormants.map(function(d){
      let code = String(d.CODE || d.code || d._id || '');
      let prod = fullMap[code];
      let q = 0;
      if(prod) q = qteStock(prod);
      if(q===0) q = IA_num(d.qteStock ?? d.qte ?? d.QTE ?? d.Stock ?? d.stock ?? d.quantite ?? 0);
      let pa = prod ? IA_pa(prod) : IA_num(d.pa ?? d.PA ?? 0);
      let cash = q * pa;
      cashBloque += cash;
      return {CODE:code, nom:nomProd(code, fullMap), qte:q, pa:pa, cash:cash};
    });
    dormantsDetail.sort(function(a,b){ return b.cash - a.cash; });
    let aRelancer = c.aRelancer || [];
    // ✅ V2.6 - DETTES EXACTEMENT COMME dette.js : v.reste direct, sans passer par paye, + lecture DOM #totalDettes
    let dettesVentes = 0;
    let nbDettes = 0;
    // On essaie toutes les sources de ventes possibles, comme dette.js fait avec getFiltered(), mais sans filtre mois
    let toutesVentes = ventesBrutes;
    // Si getFiltered() filtre par mois, on essaie aussi les globales que l'app garde en mémoire
    try{
      if(window.ventes && Array.isArray(window.ventes) && window.ventes.length > toutesVentes.length) toutesVentes = window.ventes;
      if(window.allVentes && Array.isArray(window.allVentes) && window.allVentes.length > toutesVentes.length) toutesVentes = window.allVentes;
      if(window.VENTES && Array.isArray(window.VENTES) && window.VENTES.length > toutesVentes.length) toutesVentes = window.VENTES;
    }catch(e){}
    toutesVentes.forEach(function(v){
      let reste = Number(v.reste ?? v.Reste ?? 0);
      if(reste > 0){ dettesVentes += reste; nbDettes++; }
    });
    // Lecture du total déjà calculé par l'onglet Dettes (dette.js : el.innerText = total + ' FC')
    let dettesDOM = 0;
    try{
      let elDettes = document.getElementById('totalDettes');
      if(elDettes && elDettes.innerText){
        let txt = String(elDettes.innerText).replace(/[^\d]/g,'');
        if(txt) dettesDOM = parseInt(txt, 10) || 0;
      }
    }catch(e){}
    let dettesFallback = 0;
    if(c.totalDettes!==undefined) dettesFallback = IA_num(c.totalDettes);
    else if(c.totalDettesClients!==undefined) dettesFallback = IA_num(c.totalDettesClients);
    else if(c.dettesTotal!==undefined) dettesFallback = IA_num(c.dettesTotal);
    else if(Array.isArray(c.dettes)) dettesFallback = c.dettes.reduce(function(s,x){ return s + Number(x.reste ?? x.Reste ?? 0); }, 0);
    let dettesTotal = Math.max(dettesVentes, dettesDOM, dettesFallback);
    let dettesSource = dettesDOM>0 ? 'onglet Dettes (#totalDettes)' : (dettesVentes>0 ? 'ventes (v.reste comme dette.js)' : (dettesFallback>0 ? 'c.totalDettes' : 'NON TRANSMISES - voir onglet Dettes'));
    let dettesFiable = dettesTotal>0;
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
    // ✅ V2.6 - STANDARD SMIG UNIQUEMENT, BARÈME NATIONAL, PLUS DE COÛT DE VIE 900 000 FC
    let SMIG_OFFICIEL_JOUR = 21000, SMIG_REEL_JOUR = 11500;
    let SMIG_OFFICIEL_MOIS = SMIG_OFFICIEL_JOUR * 30; // 630 000 FC - barème national officiel
    let SMIG_REEL_MOIS = SMIG_REEL_JOUR * 30; // 345 000 FC - ce que beaucoup appliquent en pratique
    // Le Patron, comme tout travailleur, doit gagner au moins 1 SMIG officiel. C'est la référence légale, pas une estimation.
    let besoinPatron = SMIG_OFFICIEL_MOIS; // 630 000 FC
    // Ce que touche le vendeur aujourd'hui : Base + Com. On le compare au SMIG, c'est le barème qui juge.
    let salaireVendeurActuel = Math.round(base + (benefMoisEstime/Math.max(1,nbVendeurs))*(comPct/100));
    let deficitVendeurVsSmig = SMIG_OFFICIEL_MOIS - salaireVendeurActuel;
    // Répartition Compta
    let totalBaseEstime = nbVendeurs * base;
    let totalComEstime = benefMoisEstime * (comPct/100);
    let totalChargesFixesEstime = loyer + autreFixe + emprunt + totalBaseEstime;
    let totalDepEstime = totalDepMois / Math.max(1,joursEcoules) * nbJoursMois;
    let resultatNetEstime = benefMoisEstime - totalDepEstime - totalChargesFixesEstime - totalComEstime;
    let repartPatron = resultatNetEstime>0 ? Math.round(resultatNetEstime * (patronPct/100)) : 0;
    let repartPrime = resultatNetEstime>0 ? Math.round(resultatNetEstime * (primePct/100)) : 0;
    let repartDev = resultatNetEstime>0 ? Math.round(resultatNetEstime * (devPct/100)) : 0;
    let deficitPatron = besoinPatron - repartPatron;
    let verdictVie = '';
    let strategie = '';
    if(resultatNetEstime<=0){
      verdictVie = '🔴 CRITIQUE (Barème SMIG) : Résultat Net estimé '+IA_fmt(resultatNetEstime)+' (négatif). Tu ne gagnes même pas 1 SMIG officiel ('+IA_fmt(SMIG_OFFICIEL_MOIS)+').';
      strategie = 'ARRÊTE les produits à marge <15%. Augmente les prix de 500 à 1 000 FC. Ne commande rien tant que tu n\'as pas vendu les dormants ('+IA_fmt(cashBloque)+'). Inventaire chaque dimanche, caisse chaque soir.';
    } else if(repartPatron < besoinPatron * 0.5){
      verdictVie = '🔴 SURVIE DANGEREUSE (Barème SMIG) : Ta part Patron = '+IA_fmt(repartPatron)+' (45% du Net '+IA_fmt(resultatNetEstime)+'), alors que le barème exige au moins 1 SMIG officiel = '+IA_fmt(besoinPatron)+' pour toi. Il te manque '+IA_fmt(deficitPatron)+' / mois. Tu perds ton temps, et tu fabriques le vol.';
      strategie = '3 leviers en 30 jours : 1) +500 FC sur tous les produits à marge <30%. 2) Vide les dormants ('+IA_fmt(cashBloque)+') avec Pack Star + Dormant. 3) Contrôle : inventaire chaque dimanche, caisse comptée chaque soir, 1 seul vendeur à la caisse, chaque vente = reçu.';
    } else if(repartPatron < besoinPatron){
      verdictVie = '🟡 SURVIE (Barème SMIG) : Ta part Patron = '+IA_fmt(repartPatron)+', il te faut au moins 1 SMIG officiel = '+IA_fmt(besoinPatron)+'. Il te manque '+IA_fmt(deficitPatron)+' / mois.';
      strategie = 'Tu es à '+Math.round(repartPatron/besoinPatron*100)+'% du SMIG officiel. Il te faut '+IA_fmt(deficitPatron)+' de plus en part Patron, soit environ '+IA_fmt(Math.round(deficitPatron/(patronPct/100)))+' de plus en Résultat Net.';
    } else {
      verdictVie = '🟢 CONFORME SMIG : Ta part Patron = '+IA_fmt(repartPatron)+', tu atteins au moins 1 SMIG officiel = '+IA_fmt(besoinPatron)+'. Tu n\'es plus en survie au barème national.';
      strategie = 'Sécurise : mets 10% de ta part de côté chaque mois. Tu peux passer ton vendeur au SMIG officiel pour le fidéliser.';
    }
    let pGarde = {m6:repartPatron*6, m12:repartPatron*12, m36:repartPatron*36, m60:repartPatron*60};
    let repartAccelere = Math.round(repartPatron*1.2);
    let pAccelere = {m6:repartAccelere*6, m12:repartAccelere*12, m36:repartAccelere*36, m60:repartAccelere*60};
    let repartCorrige = Math.round(Math.max(repartPatron, repartPatron - (perteParMois*(patronPct/100)))*1.2);
    let pCorrige = {m6:repartCorrige*6, m12:repartCorrige*12, m36:repartCorrige*36, m60:repartCorrige*60};
    function fmtProj(v){ return IA_fmt(Math.round(v)); }
    let note = 10;
    if(nbPerte>0) note -= 4;
    if(nbDangereuse>0) note -= 2;
    if(evolMois.pct>5) note += 3; else if(evolMois.pct<-5) note -= 3;
    if(ruptures.length>0) note -= 2;
    if(dormants.length>5) note -= 2;
    if(dettesTotal>0 && tauxDette>10) note -= 2;
    if(dependanceStar>50) note -= 1;
    if(repartPatron >= besoinPatron) note += 4;
    else if(repartPatron >= besoinPatron*0.5) note += 1;
    else note -= 2;
    // Pénalité si vendeur en dessous du SMIG : c'est un risque légal et un risque de vol
    if(salaireVendeurActuel < SMIG_OFFICIEL_MOIS) note -= 1;
    note = Math.max(0, Math.min(20, note));
    let mention = note>=16 ? '🟢 BON - Continue' : note>=10 ? '🟡 MOYEN - À corriger vite' : '🔴 DANGER - Survie, il faut changer de rythme';
    let html = '<h4>🧑‍✈️ AUDIT INSPECTEUR - VÉRITÉ DU TERRAIN - BARÈME NATIONAL SMIG</h4>'
      +'<div style="background:#0f172a;color:#fff;padding:12px;border-radius:12px"><b>NOTE DE L\'INSPECTEUR : '+note+' / 20 - '+mention+'</b><br><span style="font-size:12px">Marge brute estimée ce mois : '+IA_fmt(benefMoisEstime)+' | Résultat Net estimé : '+IA_fmt(resultatNetEstime)+' | Ta part Patron ('+patronPct+'%) : <b>'+IA_fmt(repartPatron)+'</b> | Référence : 1 SMIG officiel = '+IA_fmt(besoinPatron)+' | Vendeurs comptés ce mois : '+nbVendeurs+' ('+Object.keys(nomsVendeursMois).join(', ')+')</span></div>';
    html += '<h4>1️⃣ MARGES - Tu avances ou tu recules ? ('+margeList.length+' produits, tous affichés)</h4>'
      +'<p>🟢 Saine (+30%) : <b>'+nbSaine+'</b> | 🟡 Juste (15-30%) : <b>'+nbJuste+'</b> | 🔴 Dangereuse (&lt;15%) : <b>'+nbDangereuse+'</b> | ⚫ Perte : <b>'+nbPerte+'</b>'+(nbInconnu>0?' | ⚪ Inconnu : <b>'+nbInconnu+'</b>':'')+'</p>'
      +'<div style="overflow:auto;max-height:400px;border:1px solid #ddd;border-radius:8px"><table><tr><th>Produit</th><th>PV réel</th><th>PA</th><th>Marge</th><th>Vendus</th><th>Bénéfice</th><th>Verdict</th></tr>'
      + margeList.map(function(x){
          return '<tr><td><b>'+IA_esc(x.nom)+'</b></td><td>'+IA_fmt(x.pv)+'</td><td>'+IA_fmt(x.pa)+'</td><td style="color:'+(x.marge<0?'#000':x.marge<15?'#ef4444':x.marge<30?'#d97706':'#16a34a')+'"><b>'+Math.round(x.marge)+'%</b></td><td>'+x.qte+'</td><td>'+IA_fmt(x.benef)+'</td><td>'+x.catTxt+'</td></tr>';
        }).join('')
      + (margeList.length===0 ? '<tr><td colspan="7">Aucune vente analysée pour les marges.</td></tr>' : '')
      + '</table></div>'
      + '<p style="font-size:11px;color:#555">Fais défiler vers le bas pour voir tous les '+margeList.length+' produits. Les plus dangereux sont en haut.</p>'
      + (nbPerte+nbDangereuse>0 ? '<p style="background:#fee2e2;padding:8px;border-radius:8px">⚠️ <b>Action urgente :</b> '+(nbPerte+nbDangereuse)+' produits te font perdre ou presque rien gagner. Augmente leur prix de 500 FC ou arrête de les vendre.</p>' : '<p style="background:#dcfce7;padding:8px;border-radius:8px">✅ Aucun produit en perte. Tes marges sont saines.</p>');
    html += '<h4>2️⃣ ÉVOLUTION DU CA - Tu progresses ?</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<div style="background:#f8fafc;padding:12px;border-radius:12px"><b>📅 CETTE SEMAINE vs SEMAINE DERNIÈRE</b><br>CA semaine : <b>'+IA_fmt(caSemaine)+'</b><br>CA semaine dernière : '+IA_fmt(caSemaineDerniere)+'<br><b>'+evolSemaine.sens+' '+evolSemaine.txt+'</b></div>'
      +'<div style="background:#f8fafc;padding:12px;border-radius:12px"><b>📅 CE MOIS vs MOIS DERNIER</b><br>CA mois : <b>'+IA_fmt(caMois)+'</b><br>CA mois dernier : '+IA_fmt(caMoisDernier)+'<br><b>'+evolMois.sens+' '+evolMois.txt+'</b></div>'
      +'</div>'
      +'<p>CA / jour moyen : <b>'+IA_fmt(Math.round(caJourMoyen))+'</b> | Panier moyen : <b>'+IA_fmt(Math.round(panierMoyen))+'</b> ('+nbVentesMois+' ventes ce mois) | Star : <b>'+IA_esc(nomStar)+'</b> = '+Math.round(dependanceStar)+'% du CA '+(dependanceStar>50?'⚠️ Tu dépends trop d\'un seul produit, c\'est fragile.':'✅ Pas trop dépendant.')+'</p>';
    html += '<h4>3️⃣ LE BÉNÉFICE FAIT-IL VIVRE LA MAISON ? - BARÈME NATIONAL SMIG</h4><div style="background:#fffbeb;border:2px solid #f59e0b;padding:12px;border-radius:12px">'
      +'<p><b>Calcul Compta réel :</b><br>'
      +'Marge brute estimée : <b>'+IA_fmt(benefMoisEstime)+'</b><br>'
      +'- Dépenses : '+IA_fmt(Math.round(totalDepEstime))+' | - Loyer '+IA_fmt(loyer)+' | - Autres fixes '+IA_fmt(autreFixe)+' | - Emprunt '+IA_fmt(emprunt)+' | - Bases salaires ('+nbVendeurs+' x '+IA_fmt(base)+') = '+IA_fmt(totalBaseEstime)+' | - Commissions '+comPct+'% = '+IA_fmt(Math.round(totalComEstime))+'<br>'
      +'=> <b>Résultat Net estimé : '+IA_fmt(resultatNetEstime)+'</b><br>'
      +'=> Répartition : Prime '+primePct+'% = '+IA_fmt(repartPrime)+' | <b>Patron '+patronPct+'% = '+IA_fmt(repartPatron)+'</b> | Dev '+devPct+'% = '+IA_fmt(repartDev)+'</p>'
      +'<p><b>Barème national - SMIG :</b><br>'
      +'SMIG officiel : <b>21 000 FC / jour = 630 000 FC / mois</b> (barème légal)<br>'
      +'SMIG réel beaucoup appliqué : <b>11 500 FC / jour = 345 000 FC / mois</b> (pratique courante, en dessous du barème)<br>'
      +'Ta part Patron doit être au moins <b>1 SMIG officiel = '+IA_fmt(besoinPatron)+'</b>. C\'est la référence standard, pas une estimation de coût de vie.</p>'
      +'<p>Ta part Patron : <b>'+IA_fmt(repartPatron)+'</b> | Référence SMIG officiel : <b>'+IA_fmt(besoinPatron)+'</b> | <b>Il te manque : '+IA_fmt(Math.max(0,deficitPatron))+' / mois</b> '+(deficitPatron>0 ? 'soit '+Math.round(deficitPatron/Math.max(1,repartPatron)*100)+'% de plus à gagner.' : '✅ Tu atteins le SMIG officiel.')+'</p>'
      +'<p><b>Vendeur au barème :</b> Ton vendeur touche aujourd\'hui Base '+IA_fmt(base)+' + Com '+comPct+'% = environ <b>'+IA_fmt(salaireVendeurActuel)+' / mois</b>. Barème SMIG officiel = <b>'+IA_fmt(SMIG_OFFICIEL_MOIS)+'</b>. Il lui manque <b>'+IA_fmt(Math.max(0,deficitVendeurVsSmig))+' / mois</b> pour atteindre le SMIG. C\'est en dessous du barème national. Pour payer au SMIG, il faut monter le bénéfice, pas baisser les salaires. Un vendeur payé en dessous du SMIG est un risque de départ et un risque de vol.</p>'
      +'<p style="background:#fee2e2;padding:8px;border-radius:8px"><b>'+verdictVie+'</b></p>'
      +'<p><b>🎯 STRATÉGIE ANTI-SURVIE :</b><br>'+strategie+'</p>'
      +'<p><b>🔒 ANTI-VOL :</b><br>1) Inventaire chaque dimanche soir, tu comptes toi-même. 2) Caisse comptée chaque soir, écart = 0 toléré. 3) 1 seul vendeur à la caisse. 4) Chaque vente = reçu, même 500 FC. 5) Si le bénéfice monte, paie ton vendeur au SMIG, un vendeur payé au SMIG vole moins qu\'un vendeur payé 50 000 FC. 6) Si l\'écart inventaire dépasse 2% du CA, tu changes de vendeur.</p>'
      +'</div>'
      +'<p>💤 Cash bloqué dans dormants : <b>'+IA_fmt(cashBloque)+'</b> ('+dormants.length+' dormants) - Top : '+(dormantsDetail[0]?IA_esc(dormantsDetail[0].nom)+' ('+IA_fmt(dormantsDetail[0].cash)+')':'-')+' | 🚫 Ruptures vraies : <b>'+ruptures.length+'</b> | 💳 Dettes : <b>'+IA_fmt(dettesTotal)+'</b> '+(dettesFiable ? ('= '+Math.round(tauxDette)+'% du CA mois ('+nbDettes+' dettes) '+(tauxDette>10?'🔴 Trop de dettes, récupère d\'abord.':'✅ Dettes sous contrôle.')) : '⚠️ NON TRANSMISES - va voir l\'onglet Dettes.')+' <small>(source : '+dettesSource+')</small> | 📞 À relancer : <b>'+aRelancer.length+'</b></p>';
    html += '<h4>4️⃣ PROJECTIONS - Sur TA part Patron, barème SMIG</h4>'
      +'<p style="font-size:12px;color:#555">Projection sur ta part Patron : '+IA_fmt(repartPatron)+' / mois. Référence : 1 SMIG officiel = '+IA_fmt(besoinPatron)+' / mois.</p>'
      +'<div style="overflow:auto"><table><tr><th>Scénario</th><th>Ta part / mois</th><th>6 mois</th><th>1 an</th><th>3 ans</th><th>5 ans</th></tr>'
      +'<tr><td><b>1. Tu gardes le rythme</b></td><td>'+IA_fmt(repartPatron)+'</td><td>'+fmtProj(pGarde.m6)+'</td><td><b>'+fmtProj(pGarde.m12)+'</b></td><td>'+fmtProj(pGarde.m36)+'</td><td>'+fmtProj(pGarde.m60)+'</td></tr>'
      +'<tr><td><b>2. Tu accélères +20%</b></td><td>'+IA_fmt(repartAccelere)+'</td><td>'+fmtProj(pAccelere.m6)+'</td><td><b>'+fmtProj(pAccelere.m12)+'</b></td><td>'+fmtProj(pAccelere.m36)+'</td><td>'+fmtProj(pAccelere.m60)+'</td></tr>'
      +'<tr style="background:#dcfce7"><td><b>3. Tu corriges + tu accélères</b></td><td><b>'+IA_fmt(repartCorrige)+'</b></td><td>'+fmtProj(pCorrige.m6)+'</td><td><b>'+fmtProj(pCorrige.m12)+'</b></td><td>'+fmtProj(pCorrige.m36)+'</td><td>'+fmtProj(pCorrige.m60)+'</td></tr>'
      +'</table></div>'
      +'<p><b>Lecture du Directeur :</b> Si tu gardes le rythme, en 1 an ta part Patron cumule '+fmtProj(pGarde.m12)+', il te faut '+IA_fmt(besoinPatron*12)+' pour atteindre 1 SMIG officiel par mois pendant 1 an. Il te manque '+IA_fmt(Math.max(0, besoinPatron*12 - pGarde.m12))+' sur l\'année.</p>';
    html += '<h4>5️⃣ DÉCISION : FERMER OU THÉRAPIE DE CHOC ? - 90 JOURS POUR VALIDER OU INVALIDER</h4><div style="background:#0f172a;color:#fff;padding:14px;border-radius:12px">'
      +'<p><b>Verdict de l\'Inspecteur aujourd\'hui : NE FERME PAS TOUT DE SUITE, MAIS NE CONTINUE PAS COMME ÇA.</b><br>Avec '+IA_fmt(repartPatron)+' / mois de part Patron, tu es en dessous du SMIG officiel. Mais fermer maintenant, c\'est jeter ton stock ('+IA_fmt(cashBloque)+' de dormants + stock actif), tes clients, et ta place à Menkao2, sans savoir si c\'est le produit, le prix, la concurrence ou l\'environnement qui te tue.</p>'
      +'<p><b>🧪 THÉRAPIE DE CHOC - 90 JOURS, 3 HYPOTHÈSES À TESTER, 1 PAR MOIS :</b></p>'
      +'<p><b>Mois 1 (Jour 1-30) - Hypothèse PRIX :</b> Tes prix sont trop bas. Test : +500 FC sur tous les produits à marge &lt;30%, +1 000 FC sur les Stars. Si le CA ne chute pas de plus de 15%, l\'hypothèse est VALIDÉE.<br><b>Critère J30 :</b> Marge brute &gt; '+IA_fmt(Math.round(benefMoisEstime*1.3))+' OU on invalide l\'hypothèse prix.</p>'
      +'<p><b>Mois 2 (Jour 31-60) - Hypothèse GAMME / ENVIRONNEMENT :</b> Tes produits ne sont pas adaptés à Menkao2. Test : tu arrêtes les 5 dormants qui ne se vendent jamais, tu mets à la place 5 produits que les gens de Menkao2 achètent tous les jours (demande à 20 clients : "Qu\'est-ce que tu achètes ailleurs parce que je n\'ai pas ?").<br><b>Critère J60 :</b> Cash dormants divisé par 2 (de '+IA_fmt(cashBloque)+' à '+IA_fmt(Math.round(cashBloque/2))+') OU on invalide l\'hypothèse gamme.</p>'
      +'<p><b>Mois 3 (Jour 61-90) - Hypothèse CONCURRENCE / VISIBILITÉ :</b> Les clients ne savent pas que tu existes, ou ils vont chez le concurrent moins cher. Test : tour de 5 concurrents à Menkao2, tu notes leurs prix sur tes 10 Stars, tu t\'alignes ou tu expliques pourquoi tu es plus cher. Tu relances tes 20 meilleurs clients par WhatsApp.<br><b>Critère J90 :</b> CA mois &gt; '+IA_fmt(Math.round(caMoisEstime*1.5))+' ET Part Patron &gt; 300 000 FC.</p>'
      +'<p><b>🚦 DÉCISION J90 :</b><br>'
      +'✅ <b>SI Part Patron &gt; 300 000 FC ET Marge &gt; 30% :</b> ON CONTINUE.<br>'
      +'🟡 <b>SI Part Patron entre 150 000 et 300 000 FC :</b> ON TRANSFORME. Boutique plus petite, loyer moins cher, sans vendeur fixe.<br>'
      +'🔴 <b>SI Part Patron &lt; 150 000 FC après 90 jours de choc :</b> ON FERME OU ON VEND LE STOCK. Tu as prouvé que ni le prix, ni la gamme, ni la visibilité ne suffisent à Menkao2. Fermer à ce moment-là, ce n\'est pas un échec, c\'est une décision de chef.</p>'
      +'<p><b>⏱️ Combien de temps pour valider / invalider ?</b><br>• Un prix : <b>30 jours</b>.<br>• Une gamme : <b>60 jours</b>.<br>• Une visibilité / concurrence : <b>90 jours</b>.<br>Au-delà de 90 jours sans amélioration, tu ne testes plus, tu t\'entêtes.</p>'
      +'</div>';
    return html + (c.debug || '');
  };
})();
