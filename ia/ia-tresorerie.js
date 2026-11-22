// ia-tresorerie.js - V1.0 - DIRECTEUR FINANCIER - Cash réel, pas CA
// Règles : CA UNIQUE = v.total | Encaissé = Payé (total - reste) | Période 1er -> Aujourd'hui LOCALE
(function(){
  function TR_getDates(){
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
  function TR_val(id, def){
    let el = document.getElementById(id);
    if(!el || el.value==null || el.value==='') return def;
    let n = parseFloat(String(el.value).replace(/\s/g,'').replace(',','.'));
    return isNaN(n)?def:n;
  }
  // Montant robuste : tous les noms possibles
  function TR_montant(x){
    if(!x) return 0;
    return IA_num(x.montant ?? x.Montant ?? x.MONTANT ?? x.total ?? x.Total ?? x.TOTAL ?? x.somme ?? 0);
  }
  // Date robuste
  function TR_date(x){
    let d = new Date(x.date ?? x.Date ?? x.created ?? x.timestamp ?? x.jour ?? 0);
    return isNaN(d.getTime()) ? null : d;
  }
  // Sens caisse : entree / sortie. On teste type, sens, motif, montant négatif
  function TR_sensCaisse(x){
    let t = String(x.type ?? x.Type ?? x.sens ?? x.Sens ?? x.motif ?? x.Motif ?? '').toLowerCase();
    let m = TR_montant(x);
    if(/sortie|depense|dépense|retrait|versement|paye|payé|achat/.test(t)) return 'sortie';
    if(/entree|entrée|encaiss|vente|recette|depot|dépôt|vers/.test(t)) return 'entree';
    if(m < 0) return 'sortie';
    return 'entree';
  }

  window.IA_render_tresorerie = function(c){
    let periode = TR_getDates();
    let du = periode.du, au = periode.au;
    let labelPeriode = du.toLocaleDateString('fr-FR')+' au '+au.toLocaleDateString('fr-FR');
    let nbJours = Math.max(1, Math.ceil((au-du)/86400000)+1);
    let nowTs = Date.now();

    // Charges fixes depuis Compta, comme ia-compta.js V2.5
    let base = TR_val('cBase', 50000);
    let comPct = TR_val('cCom', 10);
    let loyer = TR_val('cLoyer', 100000);
    let autreFixe = TR_val('cAutresFixe', 0);
    let emprunt = TR_val('cEmprunt', 0);

    // Données brutes depuis getFiltered, comme ia-compta.js
    let gf = {};
    try{ gf = (typeof getFiltered==='function' ? getFiltered() : null) || {}; }catch(e){ gf={}; }
    let ventesBrutes = gf.ventes || [];
    let depBrutes = gf.dep || [];
    let caisseBrutes = gf.caisse || [];
    let versBrutes = gf.vers || [];
    // ✅ CORRECTION 1 - SANS TOUCHER AU STABLE : Achats = entrees (Rapport V8.30)
    // getFiltered() ne renvoie pas achats, il renvoie entrees : { CODE, qty, date }
    // On garde gf.achats en 1er au cas où, sinon on prend entrees, sinon ALL_DATA
    let achatsBruts = gf.achats || gf.entrees || [];
    if(!achatsBruts.length){
      try{
        let SHOP = window.SHOP || window.STATE?.SHOP || 'Menkao2';
        let ALL_DATA = window.ALL_DATA || window.STATE?.ALL_DATA || {};
        if(ALL_DATA[SHOP] && ALL_DATA[SHOP].entrees) achatsBruts = ALL_DATA[SHOP].entrees;
      }catch(e){}
    }
    let stockBrut = gf.stock || c.stock || [];
    let dettesBrutes = gf.dettes || [];

    // Fallback : si getFiltered ne donne pas caisse/vers, on prend IA_getData
    if(!caisseBrutes.length && typeof IA_getData==='function'){
      try{ let dd = IA_getData(); if(dd.caisse && dd.caisse.length) caisseBrutes = dd.caisse; if(dd.dettes && dd.dettes.length && !dettesBrutes.length) dettesBrutes = dd.dettes; }catch(e){}
    }

    let fullMap = {};
    stockBrut.forEach(function(p){ let code = p.CODE || p._id; if(code) fullMap[String(code)] = p; });

    let vPeriode = ventesBrutes.filter(function(v){ let d=new Date(v.date); return d>=du && d<=au; });
    let depPeriode = depBrutes.filter(function(d){ let dt=TR_date(d); return dt && dt>=du && dt<=au; });
    let caissePeriode = caisseBrutes.filter(function(x){ let dt=TR_date(x); return dt && dt>=du && dt<=au; });
    let versPeriode = versBrutes.filter(function(x){ let dt=TR_date(x); return dt && dt>=du && dt<=au; });
    let achatsPeriode = achatsBruts.filter(function(x){ let dt=TR_date(x); return dt && dt>=du && dt<=au; });

    // === 1. VENTES : CA vs ENCAISSÉ vs DETTES CRÉÉES ===
    // CORRECTION : CA = v.total, jamais qty*prix, jamais IA_ventesLignes
    let caPer = 0, encaisseVentes = 0, dettesCreeesPer = 0, benefBrut = 0, coutMarch = 0;
    let vendeursPer = {};
    let nbVendeurs = 0;
    vPeriode.forEach(function(v){
      let caVente = IA_num(v.total ?? v.TOTAL ?? 0);
      // Payé : champ paye / payé / Payé, sinon total - reste
      let resteV = IA_num(v.reste ?? v.Reste ?? v.RESTE ?? 0);
      let payeV = IA_num(v.paye ?? v.Payé ?? v.paye ?? v.PAYE ?? v.paiement ?? 0);
      if(payeV===0 && (resteV>0 || caVente>0)){
        // Si pas de champ payé, on déduit : payé = total - reste
        // Si reste = 0, c'est payé comptant
        payeV = Math.max(0, caVente - resteV);
      }
      if(payeV > caVente) payeV = caVente; // Sécurité
      caPer += caVente;
      encaisseVentes += payeV;
      dettesCreeesPer += Math.max(0, caVente - payeV);

      // Marge corrigée remise, comme Compta V2.5
      let nomRaw = String(v.vendeurNom || v.vendeur || 'Inconnu').trim();
      let exclus = window.CURRENT_CONFIG?.compta?.exclus || [];
      let keyExclus = nomRaw.toLowerCase().replace(/\s+/g,'').replace(/[^a-z]/g,'');
      let isExclus = exclus.includes(keyExclus);
      let isComptoir = !nomRaw || nomRaw.toLowerCase()==='comptoir';
      if(!(v.items||[]).length){
        let b = IA_num(v.benefice || 0);
        benefBrut += b; coutMarch += (caVente - b);
      } else {
        let caItems=0, benefItems=0;
        (v.items||[]).forEach(function(i){
          let qty = IA_num(i.qty ?? i.QTE ?? 0);
          let prix = IA_num(i.Prix ?? i.prix ?? i.PV ?? i.PRIX ?? 0);
          if(prix===0){ let p=fullMap[String(i.CODE)]; if(p) prix=IA_num(p['Prix Vente'] ?? p.PV ?? p['Prix'] ?? 0); }
          let pa = fullMap[String(i.CODE)] ? IA_pa(fullMap[String(i.CODE)]) : 0;
          caItems += qty*prix; benefItems += qty*(prix-pa);
        });
        if(caVente===0 && caItems>0) caVente = caItems;
        let remise = (caItems > caVente) ? (caItems - caVente) : 0;
        benefBrut += (benefItems - remise);
        coutMarch += (caVente - (benefItems - remise));
      }
      if(!isComptoir && !isExclus){
        if(!vendeursPer[nomRaw]) vendeursPer[nomRaw]={nom:nomRaw,ca:0,benef:0,encaisse:0};
        vendeursPer[nomRaw].ca += caVente;
        vendeursPer[nomRaw].encaisse += payeV;
      }
    });
    nbVendeurs = Object.keys(vendeursPer).length;
    let margePct = caPer>0 ? (benefBrut/caPer*100) : 0;

    // === 2. DÉPENSES / CAISSE / VERSEMENTS / ACHATS ===
    let totalDep = depPeriode.reduce(function(s,d){ return s + TR_montant(d); },0);
    // ✅ CORRECTION 2 - SANS TOUCHER AU STABLE : Montant Achat = Qté x Prix Achat
    // Une entree n'a pas de montant. On fait comme Rapport synthese_achats.
    // Si c'est un vrai achat avec montant, on prend le montant. Sinon Qté x PA.
    let totalAchats = 0;
    achatsPeriode.forEach(function(a){
      let mDirect = TR_montant(a);
      if(mDirect > 0){ totalAchats += mDirect; return; }
      let code = String(a.CODE || a.code || '');
      let q = IA_num(a.qty ?? a.qte ?? a.QTE ?? a.Quantite ?? 0);
      let p = fullMap[code];
      let pa = 0;
      if(p){
        pa = IA_num(p['Prix Achat'] ?? p.PA ?? p.pa ?? p['PrixAchat'] ?? 0);
        if(pa===0 && typeof IA_pa==='function'){ try{ pa = IA_pa(p); }catch(e){} }
      }
      totalAchats += (q * pa);
    });

    let caisseEntrees = 0, caisseSorties = 0;
    caissePeriode.forEach(function(x){
      let m = Math.abs(TR_montant(x));
      if(TR_sensCaisse(x)==='sortie') caisseSorties += m; else caisseEntrees += m;
    });
    let totalVers = versPeriode.reduce(function(s,x){ return s + Math.abs(TR_montant(x)); },0);

    // Dépenses par type, pour le Directeur Financier
    let depParType = {};
    depPeriode.forEach(function(d){
      let t = String(d.type ?? d.Type ?? d.motif ?? d.Motif ?? d.categorie ?? 'Autre').trim() || 'Autre';
      if(!depParType[t]) depParType[t]=0;
      depParType[t] += TR_montant(d);
    });
    let depParTypeArr = Object.keys(depParType).map(function(k){ return {type:k, montant:depParType[k]}; }).sort(function(a,b){ return b.montant-a.montant; });

    // === 3. DETTES CLIENTS À RÉCUPÉRER - Par ancienneté ===
    // On prend c.totalDettes (IA_buildContext) comme stock total, et on détaille par vente / dette
    let totalDettesStock = IA_num(c.totalDettes || 0);
    // Détail depuis dettesBrutes si dispo, sinon depuis ventes avec reste
    let dettesDetail = [];
    if(dettesBrutes.length){
      dettesBrutes.forEach(function(dd){
        let reste = IA_num(dd.reste ?? dd.Reste ?? dd.montant ?? dd.Montant ?? 0);
        if(reste<=0) return;
        let dt = TR_date(dd);
        let jours = dt ? Math.floor((nowTs-dt.getTime())/86400000) : 999;
        let nom = String(dd.clientNom || dd.client || dd.nomClient || dd.nom || dd.customer || 'Client inconnu');
        dettesDetail.push({nom:nom, reste:reste, jours:jours, date: dt ? dt.getTime() : 0});
      });
    } else {
      // Fallback : on reconstruit depuis les ventes (toutes, pas seulement période)
      ventesBrutes.forEach(function(v){
        let reste = IA_num(v.reste ?? v.Reste ?? 0);
        if(reste<=0) return;
        let dt = new Date(v.date);
        let jours = Math.floor((nowTs-dt.getTime())/86400000);
        let nom = String(v.clientNom || v.client || v.nomClient || 'Client inconnu');
        dettesDetail.push({nom:nom, reste:reste, jours:jours, date: dt.getTime()});
      });
    }
    // On regroupe par client
    let dettesParClient = {};
    dettesDetail.forEach(function(d){
      if(!dettesParClient[d.nom]) dettesParClient[d.nom]={nom:d.nom, reste:0, jours:0, nb:0};
      dettesParClient[d.nom].reste += d.reste;
      dettesParClient[d.nom].jours = Math.max(dettesParClient[d.nom].jours, d.jours);
      dettesParClient[d.nom].nb += 1;
    });
    let dettesClientsArr = Object.values(dettesParClient).sort(function(a,b){ return b.reste-a.reste; });
    let dettes0_7 = dettesClientsArr.filter(function(d){ return d.jours<=7; }).reduce(function(s,d){ return s+d.reste; },0);
    let dettes8_15 = dettesClientsArr.filter(function(d){ return d.jours>7 && d.jours<=15; }).reduce(function(s,d){ return s+d.reste; },0);
    let dettes15plus = dettesClientsArr.filter(function(d){ return d.jours>15; }).reduce(function(s,d){ return s+d.reste; },0);
    // Si le total détaillé ne colle pas avec c.totalDettes, on prend le plus grand comme référence
    let totalDettesCalcule = dettesClientsArr.reduce(function(s,d){ return s+d.reste; },0);
    let totalDettes = Math.max(totalDettesStock, totalDettesCalcule);
    // Si on n'a pas de détail mais on a un total, on l'utilise pour les ratios
    if(dettesClientsArr.length===0 && totalDettes>0){
      dettes15plus = totalDettes;
    }

    // === 4. SOLDE CAISSE - LE VRAI CHIFFRE DU DIRECTEUR FINANCIER ===
    // ATTENTION : Versements = transfert Boutique -> Patron, ce n'est PAS un nouveau revenu.
    // On ne l'ajoute pas à l'encaissé, sinon on compte 2 fois.
    // Solde Boutique = Encaissé ventes + Entrées caisse - Dépenses - Caisse sorties - Versements déjà faits
    let soldeBoutique = encaisseVentes + caisseEntrees - totalDep - caisseSorties - totalVers;
    // Ce que les vendeurs doivent encore verser = Encaissé - Déjà versé - Dépenses payées depuis caisse ?
    // Simplifié et vrai : À verser = Encaissé ventes + Entrées - Dépenses - Sorties - Déjà versé = soldeBoutique
    let aVerser = Math.max(0, soldeBoutique);
    // Si solde négatif, c'est un manque / trou de caisse à expliquer
    let trouCaisse = soldeBoutique < 0 ? Math.abs(soldeBoutique) : 0;

    // === 5. CHARGES À PAYER CE MOIS ===
    let totalCom = benefBrut * (comPct/100);
    let totalBase = nbVendeurs * base;
    let totalSalaires = totalBase + totalCom;
    let chargesFixesMois = loyer + autreFixe + emprunt + totalBase;
    let chargesTotalesMois = chargesFixesMois + totalDep + totalCom;
    // On suppose que les dépenses déjà enregistrées sont déjà payées. Reste à payer = Fixes + Salaires
    let resteAPayerFixes = loyer + autreFixe + emprunt + totalSalaires;
    // Réserve obligatoire : loyer + bases, à ne pas toucher
    let reserveObligatoire = loyer + totalBase;

    // === 6. PRÉVISIONS ===
    let caJourMoyen = caPer / nbJours;
    let encaisseJourMoyen = encaisseVentes / nbJours;
    let depJourMoyen = totalDep / nbJours;
    let joursRestantsMois = Math.max(0, Math.ceil((new Date(au.getFullYear(), au.getMonth()+1, 1).getTime() - nowTs)/86400000));
    let prevCA7j = Math.round(caJourMoyen*7);
    let prevEncaisse7j = Math.round(encaisseJourMoyen*7);
    let prevDep7j = Math.round(depJourMoyen*7);
    // Cash prévu dans 7j = Solde aujourd'hui + Encaissé prévu - Dépenses prévues - 50% des dettes 0-7j récupérées (prudent)
    let prevCash7j = Math.round(soldeBoutique + prevEncaisse7j - prevDep7j + (dettes0_7*0.5));
    // Cash prévu fin de mois = Solde + Encaissé restant du mois - Dépenses restantes - Charges fixes restantes
    let prevCashFinMois = Math.round(soldeBoutique + (encaisseJourMoyen*joursRestantsMois) - (depJourMoyen*joursRestantsMois) - resteAPayerFixes + (dettes0_7*0.5 + dettes8_15*0.3));

    // Capacité de commande : ce que tu peux commander sans toucher à la réserve loyer + salaires
    let capaciteCommande = Math.max(0, soldeBoutique - reserveObligatoire);
    // Si tu récupères les dettes urgentes, capacité augmentée
    let capaciteAvecDettes = capaciteCommande + Math.round(dettes15plus*0.5);

    // === 7. DÉCISIONS DU DIRECTEUR FINANCIER ===
    let statutCash = 'vert';
    if(soldeBoutique < reserveObligatoire) statutCash = 'rouge';
    else if(soldeBoutique < reserveObligatoire*1.5) statutCash = 'orange';
    let decisions = [];
    if(trouCaisse>0) decisions.push('🔴 TROU DE CAISSE de '+IA_fmt(trouCaisse)+' : Tu as versé / dépensé plus que tu as encaissé. Vérifie les versements et les dépenses du mois avant tout.');
    if(soldeBoutique < reserveObligatoire) decisions.push('🔴 DANGER : Solde '+IA_fmt(soldeBoutique)+' < Réserve loyer + bases '+IA_fmt(reserveObligatoire)+'. Ne commande rien tant que tu n\'as pas récupéré tes dettes.');
    else if(soldeBoutique < reserveObligatoire*1.5) decisions.push('🟠 ATTENTION : Solde '+IA_fmt(soldeBoutique)+' juste au-dessus de ta réserve '+IA_fmt(reserveObligatoire)+'. Commande max '+IA_fmt(capaciteCommande)+' cette semaine.');
    else decisions.push('🟢 CASH SAIN : Solde '+IA_fmt(soldeBoutique)+' > Réserve '+IA_fmt(reserveObligatoire)+'. Tu peux commander jusqu\'à '+IA_fmt(capaciteCommande)+' sans risque.');
    if(dettes15plus>0) decisions.push('💳 RÉCUPÈRE D\'ABORD : '+IA_fmt(dettes15plus)+' chez des clients depuis +15j. Si tu récupères la moitié, ta capacité de commande passe à '+IA_fmt(capaciteAvecDettes)+'.');
    if(totalDep > encaisseVentes*0.3) decisions.push('⚠️ DÉPENSES TROP HAUTES : '+IA_fmt(totalDep)+' = '+(encaisseVentes>0?(totalDep/encaisseVentes*100).toFixed(0):0)+'% de ton encaissé. Un directeur financier ne laisse pas passer ça.');
    if(aVerser>0) decisions.push('💰 À VERSER : '+IA_fmt(aVerser)+' doivent encore remonter de la boutique vers toi. Vérifie avec tes vendeurs aujourd\'hui.');
    if(prevCashFinMois < 0) decisions.push('🔴 PRÉVISION FIN DE MOIS NÉGATIVE : '+IA_fmt(prevCashFinMois)+'. Tu vas manquer de cash pour payer loyer + salaires. Réduis les dépenses et relance les dettes 0-7j en priorité.');
    if(decisions.length===0) decisions.push('✅ Trésorerie saine. Continue à ce rythme, et garde ta réserve loyer + salaires intacte.');

    
    // === HTML ===
    let filtreHtml = '<div style="background:#f8fafc;padding:10px;border-radius:10px;margin-bottom:10px">📅 <b>Période :</b> '+labelPeriode+' | '+nbJours+' jours<br>CA = <b>'+IA_fmt(caPer)+'</b> (v.total) | Encaissé = <b>'+IA_fmt(encaisseVentes)+'</b> (Payé) | Dettes créées = <b>'+IA_fmt(dettesCreeesPer)+'</b><br><span style="font-size:11px;color:#555">Le CA n\'est pas du cash. Le cash, c\'est ce qui est vraiment entré. Différence CA - Encaissé = Dettes clients.</span></div>';

    let soldeHtml = '<h4>💰 SOLDE CAISSE RÉELLE - Au '+new Date().toLocaleDateString('fr-FR')+'</h4>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">'
      +'<div style="background:'+(statutCash==='vert'?'#dcfce7':statutCash==='orange'?'#fef3c7':'#fee2e2')+';padding:12px;border-radius:12px;text-align:center"><div style="font-size:11px">SOLDE BOUTIQUE</div><b style="font-size:20px">'+IA_fmt(soldeBoutique)+'</b><br><small>'+(statutCash==='vert'?'🟢 Sain':statutCash==='orange'?'🟠 Juste':'🔴 Danger')+'</small></div>'
      +'<div style="background:#dbeafe;padding:12px;border-radius:12px;text-align:center"><div style="font-size:11px">À VERSER / À RÉCUPÉRER</div><b style="font-size:20px">'+IA_fmt(aVerser)+'</b><br><small>Encaissé - Déjà versé - Dépenses</small></div>'
      +'<div style="background:#fef3c7;padding:12px;border-radius:12px;text-align:center"><div style="font-size:11px">RÉSERVE OBLIGATOIRE</div><b style="font-size:20px">'+IA_fmt(reserveObligatoire)+'</b><br><small>Loyer '+IA_fmt(loyer)+' + Bases '+IA_fmt(totalBase)+'</small></div>'
      +'</div>'
      +'<div style="margin-top:8px;background:#fff;padding:10px;border-radius:10px;font-size:12px">Calcul : Encaissé ventes '+IA_fmt(encaisseVentes)+' + Entrées caisse '+IA_fmt(caisseEntrees)+' - Dépenses '+IA_fmt(totalDep)+' - Sorties caisse '+IA_fmt(caisseSorties)+' - Versements déjà faits '+IA_fmt(totalVers)+' = <b>'+IA_fmt(soldeBoutique)+'</b></div>';

    let fluxHtml = '<h4>💧 FLUX DE TRÉSORERIE - '+labelPeriode+'</h4><div style="overflow:auto"><table><tr><th>Flux</th><th>Montant</th><th>Lecture Directeur Financier</th></tr>'
      +'<tr><td>✅ Encaissé ventes (Payé)</td><td><b>'+IA_fmt(encaisseVentes)+'</b></td><td>'+vPeriode.length+' ventes, payé comptant + acomptes</td></tr>'
      +'<tr><td>📥 Entrées caisse (hors ventes)</td><td>'+IA_fmt(caisseEntrees)+'</td><td>'+caissePeriode.length+' mouvements caisse</td></tr>'
      +'<tr><td>💳 Dettes créées ce mois (CA - Encaissé)</td><td>'+IA_fmt(dettesCreeesPer)+'</td><td>À récupérer, sinon ce n\'est pas du cash</td></tr>'
      +'<tr><td>❌ Dépenses (dep)</td><td>- '+IA_fmt(totalDep)+'</td><td>'+depPeriode.length+' dépenses</td></tr>'
      +'<tr><td>❌ Sorties caisse</td><td>- '+IA_fmt(caisseSorties)+'</td><td>Hors dep, si tu utilises caisse</td></tr>'
      +'<tr><td>🏦 Versements déjà faits (Boutique -> Patron)</td><td>- '+IA_fmt(totalVers)+'</td><td>Transfert, pas une dépense. Ne compte pas 2 fois.</td></tr>'
      +'<tr><td>🛒 Achats / Entrées stock payés</td><td>'+IA_fmt(totalAchats)+'</td><td>'+achatsPeriode.length+' achats sur la période</td></tr>'
      +'<tr style="background:#f8fafc"><td><b>= SOLDE BOUTIQUE</b></td><td><b>'+IA_fmt(soldeBoutique)+'</b></td><td>'+(trouCaisse>0?'⚠️ Trou de '+IA_fmt(trouCaisse)+' à expliquer':'Cash disponible en boutique')+'</td></tr>'
      +'</table></div>';

    let dettesHtml = '<h4>💳 CE QUI DOIT RENTRER - DETTES CLIENTS</h4>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">'
      +'<div style="background:#dcfce7;padding:12px;border-radius:12px;text-align:center">0 - 7 JOURS<br><b>'+IA_fmt(dettes0_7)+'</b><br><small>Facile à récupérer</small></div>'
      +'<div style="background:#fef3c7;padding:12px;border-radius:12px;text-align:center">8 - 15 JOURS<br><b>'+IA_fmt(dettes8_15)+'</b><br><small>Relance cette semaine</small></div>'
      +'<div style="background:#fee2e2;padding:12px;border-radius:12px;text-align:center">+ 15 JOURS<br><b>'+IA_fmt(dettes15plus)+'</b><br><small>URGENT, risque de perte</small></div>'
      +'</div>'
      +'<p>Total dettes à récupérer : <b>'+IA_fmt(totalDettes)+'</b> | Dettes créées ce mois : '+IA_fmt(dettesCreeesPer)+'</p>'
      +'<div style="overflow:auto"><table><tr><th>Client</th><th>Reste</th><th>Depuis</th><th>Action</th></tr>'
      + dettesClientsArr.slice(0,5).map(function(d){ let act = d.jours>15 ? '🔴 Appelle aujourd\'hui, ne vends plus à crédit' : d.jours>7 ? '🟠 Relance WhatsApp cette semaine' : '🟢 Petit rappel gentil'; return '<tr><td><b>'+IA_esc(d.nom)+'</b></td><td>'+IA_fmt(d.reste)+'</td><td>'+d.jours+' jours</td><td>'+act+'</td></tr>'; }).join('')
      + (dettesClientsArr.length===0 ? '<tr><td colspan="4">Aucune dette détaillée. Bravo, tout est encaissé.</td></tr>' : '')
      + '</table></div>';

    let chargesHtml = '<h4>🧾 CE QUI DOIT SORTIR - CHARGES À PAYER</h4><div style="overflow:auto"><table><tr><th>Charge</th><th>Montant</th><th>Statut</th></tr>'
      +'<tr><td>Loyer</td><td>'+IA_fmt(loyer)+'</td><td>À payer, ne touche pas à cette réserve</td></tr>'
      +'<tr><td>Autres fixes</td><td>'+IA_fmt(autreFixe)+'</td><td>Fixe</td></tr>'
      +'<tr><td>Emprunt</td><td>'+IA_fmt(emprunt)+'</td><td>À rembourser</td></tr>'
      +'<tr><td>Salaires - Bases ('+nbVendeurs+' x '+IA_fmt(base)+')</td><td>'+IA_fmt(totalBase)+'</td><td>À payer</td></tr>'
      +'<tr><td>Commissions ('+comPct+'% sur marge '+IA_fmt(benefBrut)+')</td><td>'+IA_fmt(totalCom)+'</td><td>Variable</td></tr>'
      +'<tr><td>Dépenses déjà faites (dep)</td><td>'+IA_fmt(totalDep)+'</td><td>'+depParTypeArr.slice(0,3).map(function(d){ return d.type+' : '+IA_fmt(d.montant); }).join(' | ')+'</td></tr>'
      +'<tr><td>🛒 Achats stock payés ce mois</td><td>'+IA_fmt(totalAchats)+'</td><td>Déjà payé aux fournisseurs, '+achatsPeriode.length+' achats</td></tr>'
      +'<tr style="background:#fef3c7"><td><b>Total à payer fixes + salaires</b></td><td><b>'+IA_fmt(resteAPayerFixes)+'</b></td><td>Si ton solde est inférieur, tu es en danger</td></tr>'
      +'</table></div>';

    let prevHtml = '<h4>🔮 PRÉVISION DU DIRECTEUR FINANCIER</h4><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<div style="background:#dbeafe;padding:12px;border-radius:12px"><b>DANS 7 JOURS</b><br>CA prévu : '+IA_fmt(prevCA7j)+'<br>Encaissé prévu : '+IA_fmt(prevEncaisse7j)+'<br>Dépenses prévues : - '+IA_fmt(prevDep7j)+'<br><b>Cash prévu : '+IA_fmt(prevCash7j)+'</b></div>'
      +'<div style="background:#dcfce7;padding:12px;border-radius:12px"><b>FIN DE MOIS</b><br>Jours restants : '+joursRestantsMois+' jours<br>Charges restantes : '+IA_fmt(resteAPayerFixes)+'<br><b>Cash prévu fin de mois : '+IA_fmt(prevCashFinMois)+'</b><br><small>Avec 50% dettes 0-7j + 30% dettes 8-15j récupérées</small></div>'
      +'</div>'
      +'<div style="margin-top:8px;background:#111;color:#fff;padding:12px;border-radius:12px"><b>💡 CAPACITÉ DE COMMANDE CETTE SEMAINE : '+IA_fmt(capaciteCommande)+'</b><br>Solde '+IA_fmt(soldeBoutique)+' - Réserve loyer + bases '+IA_fmt(reserveObligatoire)+' = '+IA_fmt(capaciteCommande)+'<br>Si tu récupères la moitié de tes dettes +15j, tu peux monter à '+IA_fmt(capaciteAvecDettes)+'. Ne commande jamais plus que ça.</div>';

    let avisHtml = '<h4>🧑‍💼 AVIS DU DIRECTEUR FINANCIER</h4><div style="background:#f8fafc;padding:12px;border-radius:10px">'
      + decisions.map(function(d){ return '<p>'+d+'</p>'; }).join('')
      + '<p><b>Priorité n°1 cette semaine :</b> '+(dettes15plus>0 ? 'Récupérer '+IA_fmt(dettes15plus)+' chez les clients +15j avant de commander.' : soldeBoutique < reserveObligatoire ? 'Ne pas toucher à la réserve loyer + salaires.' : 'Garder ta réserve intacte et commander max '+IA_fmt(capaciteCommande)+'.')+'</p></div>';

        // === OBJECTIFS FINANCIERS - NORME DIRECTEUR FINANCIER ===
    let objectifReserve = loyer + autreFixe + totalBase;
    let tauxEncaissement = caPer>0 ? (encaisseVentes/caPer*100) : 0;
    let tauxDettes = caPer>0 ? (totalDettes/caPer*100) : 0;
    let depJour = totalDep>0 ? (totalDep/nbJours) : 1;
    let joursCash = Math.floor(soldeBoutique / Math.max(1, depJour + (chargesFixesMois/nbJours)));
    
    let objectifsHtml = '<h4>🎯 OBJECTIFS FINANCIERS - Où tu dois être</h4><div style="overflow:auto"><table><tr><th>Objectif</th><th>Cible</th><th>Tu es à</th><th>Statut</th></tr>'
    +'<tr><td>1. Réserve de sécurité</td><td>'+IA_fmt(objectifReserve)+'</td><td>'+IA_fmt(soldeBoutique)+'</td><td>'+(soldeBoutique>=objectifReserve ? '🟢 Atteint' : '🔴 En dessous, ne commande pas')+'</td></tr>'
    +'<tr><td>2. Taux d\'encaissement</td><td>≥ 90%</td><td>'+tauxEncaissement.toFixed(0)+'%</td><td>'+(tauxEncaissement>=90 ? '🟢 Bon, tu encaisses' : '🟠 Trop de crédit, récupère')+'</td></tr>'
    +'<tr><td>3. Dettes clients / CA</td><td>≤ 10%</td><td>'+tauxDettes.toFixed(0)+'%</td><td>'+(tauxDettes<=10 ? '🟢 Sain' : '🔴 Trop de dettes, stop crédit')+'</td></tr>'
    +'<tr><td>4. Jours de cash devant toi</td><td>≥ 15 jours</td><td>'+joursCash+' jours</td><td>'+(joursCash>=15 ? '🟢 Tu peux tenir' : '🔴 Tu es à '+joursCash+' jours, danger')+'</td></tr>'
    +'<tr><td>5. Capacité de commande</td><td>Solde - Réserve</td><td>'+IA_fmt(capaciteCommande)+'</td><td>'+(capaciteCommande>0 ? '🟢 Tu peux commander' : '🔴 Commande 0 FC')+'</td></tr>'
    +'</table></div>'
    +'<p style="font-size:12px;color:#555">Un Directeur Financier ne regarde pas que le passé. Il te dit si tu vas tenir le mois prochain. Si tu rates 2 objectifs sur 5, ton entreprise est en danger, même si ton CA est beau.</p>';
      
    return filtreHtml + soldeHtml + fluxHtml + dettesHtml + chargesHtml + objectifsHtml + prevHtml + avisHtml + c.debug;
  };
})();
