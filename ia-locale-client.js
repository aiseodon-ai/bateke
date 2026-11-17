// ===== IA LOCALE V1 - MODULE 7 GESTION CLIENT + FIDELISATION - 0$ - 100% LOCAL =====
// Ne touche à rien d'autre. Lit seulement data.ventes + data.clients

function analyserClientsFidelisation(data){
  let ventes = data.ventes || [];
  let clientsBase = data.clients || [];
  let map = {};

  // 1. On construit l'historique par client depuis les ventes
  ventes.forEach(v=>{
    let nom = (v.client || v.nomClient || 'Client comptant').trim();
    if(nom.toLowerCase().includes('comptant') || nom==='') return;
    if(!map[nom]) map[nom] = { nom:nom, phone:v.phone||v.telephone||'', total:0, nb:0, dernier:0, premier:Date.now() };
    let d = new Date(v.date||v.created||Date.now()).getTime();
    map[nom].total += Number(v.total||v.montant||0);
    map[nom].nb += 1;
    if(d > map[nom].dernier) map[nom].dernier = d;
    if(d < map[nom].premier) map[nom].premier = d;
    if(v.phone) map[nom].phone = v.phone;
  });

  // 2. On enrichit avec la fiche client (téléphone, anniversaire si tu l'as)
  clientsBase.forEach(c=>{
    let nom = c.nom||c.name||'';
    if(map[nom]){
      if(c.phone||c.telephone) map[nom].phone = c.phone||c.telephone;
      map[nom].anniversaire = c.anniversaire||c.birthday||'';
      map[nom].dette = Number(c.dette||c.reste||0);
    }
  });

  let now = Date.now();
  let liste = Object.values(map).map(c=>{
    let joursDepuis = Math.floor((now - c.dernier)/86400000);
    let frequence = c.nb>1 ? Math.floor((c.dernier - c.premier)/86400000 / (c.nb-1)) : 999;
    let statut = 'NORMAL';
    let action = '';
    let msgWA = '';

    if(c.total >= 200000 && c.nb >= 5){ statut='VIP 👑'; action='Garde son produit préféré en stock. Ne le laisse jamais en rupture.'; msgWA=`Bonjour ${c.nom}, merci pour votre fidélité 👑 Vous êtes notre client VIP. -5% sur votre prochain achat cette semaine.`; }
    else if(joursDepuis >= 21){ statut='EN TRAIN DE PARTIR ⚠️'; action=`Absent depuis ${joursDepuis}j alors qu'il venait tous les ${frequence}j. Appelle-le aujourd'hui.`; msgWA=`Bonjour ${c.nom}, ça fait longtemps 😊 On a gardé votre produit préféré pour vous. Passez nous voir, -5% pour vous cette semaine.`; }
    else if(joursDepuis >= 14){ statut='À RELANCER 📞'; action=`Absent depuis ${joursDepuis}j. Relance douce par WhatsApp.`; msgWA=`Bonjour ${c.nom}, on pense à vous 🙂 Vous avez besoin de quelque chose cette semaine ? On est là.`; }
    else if(c.nb===1){ statut='NOUVEAU 🌱'; action='1er achat. Transforme-le en fidèle avec un petit cadeau.'; msgWA=`Bonjour ${c.nom}, merci pour votre 1er achat 🙏 Revenez nous voir, on vous réserve une petite surprise.`; }
    else if(c.nb>=10){ statut='FIDÈLE ❤️'; action='10+ achats. Offre 1 petit cadeau, il va rester 6 mois de plus.'; msgWA=`Bonjour ${c.nom}, merci pour vos ${c.nb} achats ❤️ Cadeau pour vous : 1 petit accessoire offert sur votre prochaine visite.`; }

    return {...c, joursDepuis, frequence, statut, action, msgWA};
  });

  liste.sort((a,b)=> b.total - a.total);
  return liste;
}

function ouvrirFidelisation(){
  let data = getFiltered ? getFiltered() : {ventes:[], clients:[]};
  let liste = analyserClientsFidelisation(data);
  let aRelancer = liste.filter(c=>c.statut.includes('PARTIR')||c.statut.includes('RELANCER'));
  let vip = liste.filter(c=>c.statut.includes('VIP'));
  let fideles = liste.filter(c=>c.statut.includes('FIDÈLE'));

  let html = `<h3>👥 IA FIDÉLISATION - ${liste.length} clients analysés</h3>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
    <div style="background:#fee;padding:10px;border-radius:10px"><b>${aRelancer.length}</b><br>À relancer ⚠️</div>
    <div style="background:#fef3c7;padding:10px;border-radius:10px"><b>${vip.length}</b><br>VIP 👑</div>
    <div style="background:#dcfce7;padding:10px;border-radius:10px"><b>${fideles.length}</b><br>Fidèles ❤️</div>
  </div>
  <table><tr><th>Client</th><th>Statut IA</th><th>Total / Nb</th><th>Dernier achat</th><th>Action IA</th><th>WhatsApp</th></tr>` +
  liste.slice(0,50).map(c=>{
    let wa = c.phone ? `https://wa.me/${String(c.phone).replace(/[^0-9]/g,'')}?text=${encodeURIComponent(c.msgWA)}` : '#';
    return `<tr><td><b>${c.nom}</b><br><small>${c.phone||''}</small></td><td>${c.statut}</td><td><b>${c.total.toLocaleString()} FC</b><br>${c.nb} achats</td><td>${c.joursDepuis}j<br><small>tous les ${c.frequence}j</small></td><td style="font-size:12px">${c.action}</td><td>${c.phone?`<a href="${wa}" target="_blank" style="background:#25D366;color:#fff;padding:6px 10px;border-radius:8px;text-decoration:none">📱 Envoyer</a>`:'—'}</td></tr>`;
  }).join('') + `</table>
  <p style="margin-top:10px"><b>Conseil IA du jour :</b> ${aRelancer.length>0 ? `Appelle d'abord ${aRelancer[0].nom}, il est en train de partir depuis ${aRelancer[0].joursDepuis} jours. 1 appel = 1 client sauvé.` : 'Aucun client en danger. Concentre-toi sur tes VIP.'}</p>`;

  // Affiche dans ton modal existant ou dans rapportC
  let zone = document.getElementById('rapportC') || document.getElementById('vue-table');
  if(zone) zone.innerHTML = html;
  else alert('Zone rapport introuvable');
}
