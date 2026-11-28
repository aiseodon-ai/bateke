import { STATE } from '../core/state.js';
import { db } from '../core/firebase.js';
import { esc } from "../common/utils.js";

export function renderDettes(){
  let data=getFiltered();
  // Compat ancien + nouveau : reste / Reste, paye / montantPaye
  let dettes=data.ventes.filter(v=>{
    let reste = Number(v.reste ?? v.Reste ?? 0);
    return reste > 0;
  });
  document.getElementById('dettesList').innerHTML=dettes.slice(0,200).map(v=>{
    let total = Number(v.total ?? 0);
    let paye = Number(v.paye ?? v.montantPaye ?? total);
    let reste = Number(v.reste ?? v.Reste ?? Math.max(0, total - paye));
    let anniv = v.client?.anniversaire || v.anniversaire || '';
    let annivTxt = anniv ? `<br><small>🎂 ${new Date(anniv).toLocaleDateString()}</small>` : '';
    let histo = (v.paiementsDette || []).map(p=> `${new Date(p.date).toLocaleDateString()} : +${Number(p.montant||0).toLocaleString()} FC (${esc(p.motif||'')})`).join('<br>');
    return `<tr>
      <td>${new Date(v.date).toLocaleString()}</td>
      <td><b>${esc(v.client?.nom||'')}</b>${annivTxt}</td>
      <td>${esc(v.client?.tel||'')}</td>
      <td>${esc(v._shop||'')}</td>
      <td>${esc(v.vendeurNom||'')}</td>
      <td>${total.toLocaleString()}</td>
      <td>${paye.toLocaleString()}<br><small style="color:#666">${histo}</small></td>
      <td style="color:red"><b>${reste.toLocaleString()}</b></td>
      <td>
        <button class="btn btn-g" style="width:auto;padding:6px 10px;font-size:11px" onclick="ouvrirPayerDette('${esc(v._id)}','${esc(v._shop)}')">💰 Payer</button><br>
        <small style="color:#999">${esc(v.remiseMotif||'')}</small>
      </td>
    </tr>`;
  }).join('')||'<tr><td colspan=9>Aucune</td></tr>';
  let el=document.getElementById('totalDettes'); if(el) el.innerText=dettes.reduce((s,v)=>s+Number(v.reste ?? v.Reste ?? 0),0).toLocaleString()+' FC';
}

// === PAYER UNE DETTE - SANS ANNULER LA VENTE, SANS TOUCHER AU STOCK ===
export function ouvrirPayerDette(id, shop){
  let data = getFiltered();
  let v = (data.ventes||[]).find(x=> String(x._id) === String(id));
  if(!v) return alert('Vente introuvable');
  let reste = Number(v.reste ?? v.Reste ?? 0);
  if(reste <= 0) return alert('Cette dette est déjà réglée');
  // On ouvre un petit formulaire en popup, pas un simple prompt, pour forcer le motif
  let overlay = document.createElement('div');
  overlay.id = 'overlayPayerDette';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:20px;max-width:360px;width:100%">
      <h3 style="margin:0">💰 Règlement Dette</h3>
      <p style="font-size:13px"><b>${esc(v.client?.nom||'')}</b> - ${esc(v.client?.tel||'')}<br>Boutique: ${esc(v._shop||shop||'')} | Vente du ${new Date(v.date).toLocaleDateString()}<br>Total: ${Number(v.total||0).toLocaleString()} FC | Déjà payé: ${Number(v.paye ?? v.montantPaye ?? 0).toLocaleString()} FC<br><b style="color:red">Reste à payer: ${reste.toLocaleString()} FC</b></p>
      <label style="font-size:12px">Montant payé par le client *</label>
      <input id="inputMontantDette" type="number" value="${reste}" min="1" max="${reste}" style="text-align:center;font-size:18px;font-weight:bold">
      <label style="font-size:12px">Motif / Justification *</label>
      <select id="selectMotifDette">
        <option value="">-- Choisis le motif --</option>
        <option value="Solde total dette">✅ Solde total dette</option>
        <option value="Acompte dette">💰 Acompte dette</option>
        <option value="Règlement cash">💵 Règlement cash</option>
        <option value="Règlement Mobile Money">📱 Règlement Mobile Money</option>
        <option value="Règlement virement">🏦 Règlement virement</option>
        <option value="Autre">Autre</option>
      </select>
      <input id="inputNoteDette" placeholder="Note - ex: payé par la femme, en 2 fois...">
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-g" onclick="validerPayerDette('${esc(v._id)}','${esc(v._shop||shop||'')}')">✅ Valider - Envoyer en Caisse</button>
        <button class="btn btn-r" onclick="document.getElementById('overlayPayerDette').remove()">✖ Annuler</button>
      </div>
      <p style="font-size:11px;color:#666;margin-top:8px">⚠️ La vente n'est PAS annulée. Le stock n'est PAS remis. On ajoute juste le paiement en Caisse et on réduit la dette.</p>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('inputMontantDette').focus();
}

export async function validerPayerDette(id, shop){
  let montant = parseFloat(document.getElementById('inputMontantDette')?.value || 0) || 0;
  let motif = document.getElementById('selectMotifDette')?.value || '';
  let note = (document.getElementById('inputNoteDette')?.value || '').trim();
  if(!motif) return alert('Choisis un motif / justification - Obligatoire');
  if(montant <= 0) return alert('Montant invalide');

  let s = shop || STATE.SHOP;
  if(!s || s === 'ALL') return alert('Choisis boutique');

  let path = 'shops/'+s+'/ventes/'+id;
  let snap = await db.ref(path).once('value');
  if(!snap.exists()){
    for(let sh of (STATE.SHOPS_LIST||[])){
      let snap2 = await db.ref('shops/'+sh+'/ventes/'+id).once('value');
      if(snap2.exists()){ snap = snap2; s = sh; path = 'shops/'+s+'/ventes/'+id; break; }
    }
  }
  if(!snap.exists()) return alert('Vente introuvable: '+id);
  let v = snap.val();
  let total = Number(v.total || 0);
  let payeActuel = Number(v.paye ?? v.montantPaye ?? total);
  let resteActuel = Number(v.reste ?? v.Reste ?? Math.max(0, total - payeActuel));
  if(montant > resteActuel){
    if(!confirm(`Le client paie ${montant.toLocaleString()} FC alors qu'il ne doit que ${resteActuel.toLocaleString()} FC.\nOn plafonne à ${resteActuel.toLocaleString()} FC ?`)) return;
    montant = resteActuel;
  }
  let nouveauPaye = payeActuel + montant;
  let nouveauReste = Math.max(0, resteActuel - montant);
  let nouveauPayMode = nouveauReste === 0 ? 'cash' : (nouveauPaye > 0 ? 'mixte' : 'credit');

  let paiement = {
    date: new Date().toISOString(),
    montant: montant,
    motif: motif,
    note: note,
    vendeur: STATE.CURRENT_USER?.nom || 'Patron',
    venteId: id,
    clientNom: v.client?.nom || '',
    clientTel: v.client?.tel || '',
    shop: s
  };

  try{
    // 1. On met à jour la vente : Payé augmente, Reste diminue. On NE touche PAS au stock, on NE supprime PAS la vente.
    await db.ref(path).update({
      paye: nouveauPaye,
      montantPaye: nouveauPaye,
      reste: nouveauReste,
      Reste: nouveauReste,
      payMode: nouveauPayMode,
      payement: nouveauPayMode,
      dernierePaiementDette: paiement.date
    });
    // On ajoute dans l'historique de la vente
    await db.ref(path + '/paiementsDette').push(paiement);

    // 2. On renvoie la somme dans la CAISSE, avec justification
    // C'est une ENTRÉE caisse, pas une dépense. C'est ça qui fait que ton CA Jour augmente.
    await db.ref('shops/'+s+'/paiementsDette').push(paiement);

    // 3. Sync local
    if(STATE.ALL_DATA[s]?.ventes){
      let local = STATE.ALL_DATA[s].ventes.find(x=> String(x._id) === String(id));
      if(local){
        local.paye = nouveauPaye; local.montantPaye = nouveauPaye;
        local.reste = nouveauReste; local.Reste = nouveauReste;
        local.payMode = nouveauPayMode; local.payement = nouveauPayMode;
        if(!local.paiementsDette) local.paiementsDette = [];
        local.paiementsDette.push(paiement);
      }
    }
    window.savePatronCache?.();
    document.getElementById('overlayPayerDette')?.remove();
    renderDettes();
    window.renderCaisse?.();
    window.renderVentes?.();
    window.renderCRM?.();
    window.updateKPIs?.();
    alert(`✅ Paiement enregistré : ${montant.toLocaleString()} FC\nClient: ${v.client?.nom||''}\nMotif: ${motif}\nNouveau reste: ${nouveauReste.toLocaleString()} FC\nLa somme est envoyée en Caisse.`);
  }catch(e){
    alert('❌ Erreur paiement dette: ' + e.message);
  }
}

window.renderDettes=renderDettes;
window.ouvrirPayerDette=ouvrirPayerDette;
window.validerPayerDette=validerPayerDette;
