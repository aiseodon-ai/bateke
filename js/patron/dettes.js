export function renderDettes(){
  let data=getFiltered(); let dettes=data.ventes.filter(v=> Number(v.reste ?? v.Reste ?? 0) > 0);
  document.getElementById('dettesList').innerHTML=dettes.slice(0,200).map(v=>{
    let total = Number(v.total || 0);
    let paye = Number(v.paye ?? v.montantPaye ?? total);
    let reste = Number(v.reste ?? v.Reste ?? Math.max(0, total - paye));
    // Historique : Firebase push() = objet, pas tableau
    let histoArr = [];
    if(v.paiementsDette){
      if(Array.isArray(v.paiementsDette)) histoArr = v.paiementsDette;
      else if(typeof v.paiementsDette === 'object') histoArr = Object.values(v.paiementsDette);
    }
    let histo = histoArr.map(p=> `${new Date(p.date).toLocaleDateString()} : +${Number(p.montant||0).toLocaleString()} FC (${p.motif||''})`).join('<br>');
    // Bouton Payer DANS la colonne Reste, pour garder 8 colonnes
    return `<tr><td>${new Date(v.date).toLocaleString()}</td><td><b>${v.client?.nom||''}</b></td><td>${v.client?.tel||''}</td><td>${v._shop}</td><td>${v.vendeurNom}</td><td>${total.toLocaleString()}</td><td>${paye.toLocaleString()}<br><small style="color:#666">${histo}</small></td><td style="color:red"><b>${reste.toLocaleString()}</b><br><button class="btn btn-g" style="width:auto;padding:4px 8px;font-size:10px;margin-top:4px" onclick="ouvrirPayerDette('${v._id}','${v._shop}')">💰 Payer</button></td></tr>`;
  }).join('')||'<tr><td colspan=8>Aucune</td></tr>';
  let el=document.getElementById('totalDettes'); if(el) el.innerText=dettes.reduce((s,v)=>s+Number(v.reste ?? v.Reste ?? 0),0).toLocaleString()+' FC';
}

function ouvrirPayerDette(id, shop){
  let data=getFiltered();
  let v=(data.ventes||[]).find(x=> String(x._id)===String(id));
  if(!v) return alert('Vente introuvable');
  let reste = Number(v.reste ?? v.Reste ?? 0);
  if(reste <= 0) return alert('Déjà réglée');
  let old=document.getElementById('overlayPayerDette'); if(old) old.remove();
  let o=document.createElement('div'); o.id='overlayPayerDette';
  o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  o.innerHTML=`<div style="background:#fff;border-radius:16px;padding:20px;max-width:360px;width:100%">
    <h3 style="margin:0">💰 Règlement Dette</h3>
    <p style="font-size:13px"><b>${v.client?.nom||''}</b> - ${v.client?.tel||''}<br>Boutique: ${v._shop||shop||''} | Vente du ${new Date(v.date).toLocaleDateString()}<br>Total: ${Number(v.total||0).toLocaleString()} FC | Déjà payé: ${Number(v.paye ?? v.montantPaye ?? 0).toLocaleString()} FC<br><b style="color:red">Reste: ${reste.toLocaleString()} FC</b></p>
    <label style="font-size:12px">Montant payé *</label>
    <input id="inputMontantDette" type="number" value="${reste}" min="1" max="${reste}" style="text-align:center;font-size:18px;font-weight:bold">
    <label style="font-size:12px">Motif / Justification *</label>
    <select id="selectMotifDette"><option value="">-- Choisis --</option><option value="Solde total dette">✅ Solde total dette</option><option value="Acompte dette">💰 Acompte dette</option><option value="Règlement cash">💵 Règlement cash</option><option value="Règlement Mobile Money">📱 Règlement Mobile Money</option><option value="Règlement virement">🏦 Règlement virement</option><option value="Autre">Autre</option></select>
    <input id="inputNoteDette" placeholder="Note - ex: payé en 2 fois...">
    <div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-g" onclick="validerPayerDette('${v._id}','${v._shop||shop||''}')">✅ Valider - En Caisse</button><button class="btn btn-r" onclick="document.getElementById('overlayPayerDette').remove()">✖ Annuler</button></div>
    <p style="font-size:11px;color:#666;margin-top:8px">⚠️ Vente NON annulée. Stock NON remis. On réduit juste la dette et on envoie en Caisse.</p></div>`;
  document.body.appendChild(o);
}

async function validerPayerDette(id, shop){
  let montant = parseFloat(document.getElementById('inputMontantDette')?.value || 0) || 0;
  let motif = document.getElementById('selectMotifDette')?.value || '';
  let note = (document.getElementById('inputNoteDette')?.value || '').trim();
  if(!motif) return alert('Choisis un motif - Obligatoire');
  if(montant <= 0) return alert('Montant invalide');
  // db est en global dans ta version modulaire, comme dans caisse.js
  let DB = (typeof db !== 'undefined' ? db : window.db);
  if(!DB) return alert('db introuvable');
  let s = (shop && shop !== 'ALL') ? shop : (typeof SHOP !== 'undefined' ? SHOP : window.SHOP);
  if(!s || s === 'ALL') return alert('Choisis boutique');
  let path = 'shops/'+s+'/ventes/'+id;
  let snap = await DB.ref(path).once('value');
  if(!snap.exists()) return alert('Vente introuvable: '+path);
  let v = snap.val();
  let total = Number(v.total || 0);
  let payeActuel = Number(v.paye ?? v.montantPaye ?? total);
  let resteActuel = Number(v.reste ?? v.Reste ?? Math.max(0, total - payeActuel));
  if(montant > resteActuel){ if(!confirm('Il ne doit que '+resteActuel.toLocaleString()+' FC. On plafonne à '+resteActuel.toLocaleString()+' FC ?')) return; montant = resteActuel; }
  let nouveauPaye = payeActuel + montant;
  let nouveauReste = Math.max(0, resteActuel - montant);
  let nouveauPayMode = nouveauReste === 0 ? 'cash' : (nouveauPaye > 0 ? 'mixte' : 'credit');
  let paiement = { date: new Date().toISOString(), montant: montant, motif: motif, note: note, venteId: id, clientNom: v.client?.nom || '', clientTel: v.client?.tel || '', shop: s };
  try{
    await DB.ref(path).update({ paye: nouveauPaye, montantPaye: nouveauPaye, reste: nouveauReste, Reste: nouveauReste, payMode: nouveauPayMode, payement: nouveauPayMode });
    await DB.ref(path + '/paiementsDette').push(paiement);
    await DB.ref('shops/'+s+'/paiementsDette').push(paiement);
    document.getElementById('overlayPayerDette')?.remove();
    renderDettes(); if(window.renderCaisse) window.renderCaisse(); if(window.renderVentes) window.renderVentes(); if(window.renderCRM) window.renderCRM(); if(window.updateKPIs) window.updateKPIs();
    alert('✅ Paiement enregistré : '+montant.toLocaleString()+' FC\nClient: '+(v.client?.nom||'')+'\nMotif: '+motif+'\nNouveau reste: '+nouveauReste.toLocaleString()+' FC\nLa somme est envoyée en Caisse.');
  }catch(e){ alert('❌ Erreur: '+e.message); }
}

window.renderDettes=renderDettes;
window.ouvrirPayerDette=ouvrirPayerDette;
window.validerPayerDette=validerPayerDette;
