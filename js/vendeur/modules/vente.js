// js/vendeur/modules/vente.js - V5.7.0 COMPLET - SAAS BLOQUANT 15K + REMISE FC MAX 30% + DETTE + ANNIVERSAIRE
// À coller en entier, remplace l'ancien fichier. Ne touche à rien d'autre.
import { STATE } from '../core/state.js';
import { saveStockCache, saveQueue, updateOfflineUI } from '../core/offline.js';

const CACHE_VERSION = 'v5.7.0-complet-remiseFC-dette-anniv-20261123';

function formatPrix(n){
  return String(Math.round(parseFloat(n)||0));
}

// 🔒 SAAS CHECK COMMUN - UTILISÉ PARTOUT - GARDÉ DU STABLE
function isAboExpired(){
  const shop = STATE.SHOP;
  const finStr = localStorage.getItem('BATEKE_ABO_FIN_'+shop);
  if(!finStr) return false;
  const fin = new Date(finStr);
  const grace = new Date(fin); grace.setDate(grace.getDate()+3);
  return new Date() > grace;
}
function getFinDate(){
  const shop = STATE.SHOP;
  const finStr = localStorage.getItem('BATEKE_ABO_FIN_'+shop);
  return finStr ? new Date(finStr).toLocaleDateString() : '';
}

// === NOUVEAU : REMISE EN FC - MAX 30% ===
function getRemise(brut){
  let brutVal = Number(brut) || 0;
  let remiseFC = parseFloat(document.getElementById('remise')?.value || 0) || 0;
  if(remiseFC < 0) remiseFC = 0;
  let maxRemise = Math.round(brutVal * 0.30);
  if(remiseFC > maxRemise) remiseFC = maxRemise;
  let remisePct = brutVal > 0 ? (remiseFC / brutVal * 100) : 0;
  return { remiseFC, remisePct, maxRemise, final: brutVal - remiseFC };
}

export function addPanier(){
  if(isAboExpired()){
    alert("🔒 Vente bloquée - Boutique "+STATE.SHOP+" abonnement expiré depuis "+getFinDate()+"\nContacte ton patron: 15.000 FC - Airtel 0998111387");
    return;
  }
  let code=document.getElementById('codeArt')?.value?.trim(); 
  if(!code) return alert('Choisis article');
  let art=STATE.STOCK.find(s=>s.CODE===code); 
  if(!art) return alert('CODE introuvable');
  let prixUnit = art['Prix Unit'] || art.Prix || parseFloat(document.getElementById('pvArt')?.value||0) || 0;
  if(!prixUnit) return alert('Prix 0 pour '+code);
  let qte=parseFloat(document.getElementById('qteArt')?.value||1); 
  if(qte<=0) qte=1;
  if(qte>(art.Quantite||0)) return alert('Stock insuffisant: '+art.Quantite);
  let ex=STATE.PANIER.find(p=>p.CODE===code); 
  if(ex){ ex.qty+=qte; ex.prix=prixUnit; ex.Prix=prixUnit; }
  else {
    STATE.PANIER.push({
      CODE:code, 
      Designation:art.Designation, 
      Prix:prixUnit, 
      prix:prixUnit,
      PA:art['Prix Achat']||Math.round(prixUnit*0.7), 
      qty:qte
    });
  }
  window.PANIER=STATE.PANIER; 
  renderPanier();
  let searchEl=document.getElementById('searchArt');
  if(searchEl) searchEl.value='';
  let suggestEl=document.getElementById('suggest');
  if(suggestEl) suggestEl.innerHTML='';
  document.getElementById('codeArt').value='';
  document.getElementById('pvArt').value='';
  document.getElementById('qteArt').value='1';
  if(searchEl) searchEl.focus();
}

export function searchArticle(){
  let q=(document.getElementById('searchArt')?.value||'').trim().toLowerCase();
  let suggest=document.getElementById('suggest');
  if(!suggest) return;
  if(q.length<2){ suggest.innerHTML=''; return; }
  let res=STATE.STOCK.filter(s=> s.actif!==false).filter(s=> (s.CODE?.toLowerCase().includes(q) || s.Designation?.toLowerCase().includes(q))).slice(0,8);
  suggest.innerHTML=res.map(s=>`
    <div onclick="selectArtVente('${s.CODE}')" style="padding:6px;border-bottom:1px solid #eee;cursor:pointer">
      <b>${s.CODE}</b> - ${s.Designation.substring(0,35)} <small style="float:right">${(s.Quantite||0)} | ${formatPrix(s['Prix Unit']||s.Prix||0)} FC</small>
    </div>`).join('');
}

export function selectArtVente(code){
  let art=STATE.STOCK.find(s=>s.CODE===code);
  if(!art) return;
  document.getElementById('codeArt').value=art.CODE;
  document.getElementById('pvArt').value=art['Prix Unit']||art.Prix||0;
  document.getElementById('qteArt').value=1;
  document.getElementById('searchArt').value='';
  document.getElementById('suggest').innerHTML='';
  document.getElementById('qteArt').focus();
}

export function renderPanier(){
  let list=document.getElementById('panierList'); if(!list) return;
  if(!STATE.PANIER.length){
    list.innerHTML='Panier vide';
  } else {
    list.innerHTML=STATE.PANIER.map((p,i)=>{
      let pr=p.prix||p.Prix||0;
      let desig = (p.Designation||'').substring(0,22);
      return `<div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid #eee">
        <span><b>${p.CODE}</b> ${desig} x${p.qty}</span> 
        <span>${formatPrix(pr*p.qty)} FC <button onclick="removePanier(${i})" style="background:red;color:#fff;border:none;border-radius:4px">X</button></span>
      </div>`;
    }).join('');
  }
  let brut=STATE.PANIER.reduce((s,p)=>s+((p.prix||p.Prix||0)*p.qty),0); 
  let { remiseFC, remisePct, maxRemise, final } = getRemise(brut);
  if(document.getElementById('totalPanier')) document.getElementById('totalPanier').innerText=formatPrix(brut)+' FC';
  if(document.getElementById('totalFinal')) document.getElementById('totalFinal').innerText=formatPrix(final)+' FC';
  if(document.getElementById('remiseInfo')) document.getElementById('remiseInfo').innerText = remiseFC>0 ? `Réduction -${formatPrix(remiseFC)} FC (${remisePct.toFixed(1)}%) - Max 30% = ${formatPrix(maxRemise)} FC` : '';
  if(document.getElementById('remiseInfoFC')) document.getElementById('remiseInfoFC').innerText = remiseFC>0 ? `- ${formatPrix(remiseFC)} FC` : '';
}

export function removePanier(i){ STATE.PANIER.splice(i,1); renderPanier(); }

export function checkRemise(){
  let brut = STATE.PANIER.reduce((s,p)=>s+((p.prix||p.Prix||0)*p.qty),0);
  let maxRemise = Math.round(brut * 0.30);
  let r = parseFloat(document.getElementById('remise')?.value || 0) || 0;
  if(r < 0){ document.getElementById('remise').value = 0; r = 0; }
  if(r > maxRemise){
    alert(`Max 30% pour solde\nBrut : ${formatPrix(brut)} FC\nMax autorisé : ${formatPrix(maxRemise)} FC\nTu as mis : ${formatPrix(r)} FC\nOn plafonne à ${formatPrix(maxRemise)} FC.`);
    document.getElementById('remise').value = maxRemise;
    r = maxRemise;
  }
  renderPanier();
}

export async function validerVente(){
  if(isAboExpired()){
    alert("🔒 VENTE BLOQUÉE - Boutique "+STATE.SHOP+" abonnement expiré depuis "+getFinDate()+"\nImpossible de vendre - Contacte patron 15.000 FC");
    return;
  }
  if(!STATE.PANIER.length) return alert('Panier vide'); 
  if(!STATE.CURRENT_VENDEUR) return alert('Login requis');

  // RESTAURÉ BASE : PIN BLOQUÉ
  if(window.BLOCKED_PINS_CACHE && window.BLOCKED_PINS_CACHE.includes(STATE.CURRENT_VENDEUR?.pin)){
    alert('🚫 Compte bloqué');
    if(window.logoutAll) window.logoutAll();
    return;
  }

  let brut=STATE.PANIER.reduce((s,p)=>s+((p.prix||p.Prix||0)*p.qty),0); 

  // NOUVEAU : REMISE EN FC - MAX 30%
  let { remiseFC, remisePct, final } = getRemise(brut);
  let remiseVal = remiseFC;
  let remiseMotifVal = document.getElementById('remiseMotif')?.value || '';
  if(remiseFC > 0 && !remiseMotifVal) remiseMotifVal = 'Solde';

  // RESTAURÉ BASE : BÉNÉFICE
  let benef = STATE.PANIER.reduce((s,i)=> s + i.qty*((i.Prix||i.prix||0)-(i.PA||0)), 0) - remiseVal;

  // RESTAURÉ BASE : CLIENT + PAIEMENT + DETTE + NOUVEAU ANNIVERSAIRE
  let nomCli = (document.getElementById('clientNom')?.value || '').trim() || 'Comptoir';
  let telCli = (document.getElementById('clientTel')?.value || '').trim();
  let payModeVal = document.getElementById('payMode')?.value || 'cash';
  let montantPayeRaw = document.getElementById('montantPaye')?.value ?? document.getElementById('payeInput')?.value ?? '';
  let montantPayeVal = parseFloat(montantPayeRaw);
  if(isNaN(montantPayeVal)) montantPayeVal = final;
  if(montantPayeVal < 0) montantPayeVal = 0;
  if(montantPayeVal > final) montantPayeVal = final;
  let resteVal = Math.max(0, Math.round(final - montantPayeVal));
  if(resteVal > 0 && payModeVal === 'cash') payModeVal = (montantPayeVal > 0 ? 'mixte' : 'credit');

  let annivRaw = document.getElementById('clientAnniv')?.value || '';
  let annivVal = (nomCli !== 'Comptoir' || telCli) ? annivRaw : '';
  if(annivVal && isNaN(new Date(annivVal).getTime())) annivVal = '';

  let id=Date.now(); 
  let vente={
    id:id, date:new Date().toISOString(), boutique:STATE.SHOP, 
    vendeur:STATE.CURRENT_VENDEUR.nom, vendeurNom:STATE.CURRENT_VENDEUR.nom, vendeurPin:STATE.CURRENT_VENDEUR.pin, 
    items:STATE.PANIER.map(p=>({CODE:p.CODE, Designation:p.Designation, Prix:p.Prix||p.prix, prix:p.prix||p.Prix, qty:p.qty, qte:p.qty})), 
    totalBrut:brut, remise:remiseFC, remisePct:remisePct, remiseVal:remiseVal, remiseMotif:remiseMotifVal, total:final, 
    client:{nom:nomCli, tel:telCli, anniversaire:annivVal}, 
    payMode:payModeVal, payement:payModeVal,
    montantPaye:montantPayeVal, paye:montantPayeVal,
    reste:resteVal, Reste:resteVal,
    benefice:benef, benef:benef,
    offline:!STATE.FIREBASE_CONNECTED
  };

  // Sauvegarde anniversaire dans CRM si présent
  if(annivVal && (telCli || nomCli !== 'Comptoir')){
    try{
      let cleClient = telCli ? 'tel_' + telCli.replace(/[^0-9]/g,'') : 'nom_' + nomCli.toLowerCase().replace(/\s+/g,'_');
      if(STATE.IS_ONLINE && STATE.FIREBASE_CONNECTED && window.db){
        window.db.ref('shops/'+STATE.SHOP+'/clients/'+cleClient).update({
          nom: nomCli, tel: telCli, anniversaire: annivVal, derniereVente: vente.date
        });
      }
    }catch(e){ console.log('Anniv non sauvé en CRM, mais vente OK :', e.message); }
  }

  if(!STATE.IS_ONLINE||!STATE.FIREBASE_CONNECTED){
    let updates=STATE.PANIER.map(it=>{ let st=STATE.STOCK.find(s=>s.CODE===it.CODE); return {CODE:it.CODE, newQte:Math.max(0,(st?.Quantite||0)-it.qty)}; });
    STATE.OFFLINE_QUEUE.push({type:'vente', id, shop:STATE.SHOP, data:vente, stockUpdates:updates}); saveQueue();
    updates.forEach(u=>{ let st=STATE.STOCK.find(s=>s.CODE===u.CODE); if(st) st.Quantite=u.newQte; }); saveStockCache();
  }else{
    try{ 
      // Vérification stock avant, comme la base
      for(let it of STATE.PANIER){
        let snap = await window.db.ref('shops/'+STATE.SHOP+'/stock/'+it.CODE+'/Quantite').once('value');
        if(snap.val()===null){ alert(`❌ Article ${it.CODE} n'existe plus`); return; }
        if((snap.val()||0) < it.qty){ alert(`❌ STOCK INSUFFISANT pour ${it.CODE}\nStock: ${snap.val()} | Demandé: ${it.qty}`); return; }
      }
      for(let it of STATE.PANIER){ 
        let ref=window.db.ref('shops/'+STATE.SHOP+'/stock/'+it.CODE+'/Quantite'); 
        let res=await ref.transaction(q=>{ if(q===null||q<it.qty) return; return q-it.qty; }); 
        if(!res.committed){ 
          alert('Stock insuffisant '+it.CODE); 
          // RESTAURÉ BASE : ROLLBACK - On remet le stock des articles déjà déduits
          for(let prev of STATE.PANIER){ if(prev===it) break; await window.db.ref('shops/'+STATE.SHOP+'/stock/'+prev.CODE+'/Quantite').transaction(q=>{ return (q||0)+prev.qty; }); }
          return; 
        } 
        let st=STATE.STOCK.find(s=>s.CODE===it.CODE); if(st) st.Quantite=res.snapshot.val(); 
      } 
      await window.db.ref('shops/'+STATE.SHOP+'/ventes/'+id).set(vente); saveStockCache(); 
      if(window.logPresence) window.logPresence('VENTE', vente.total+' FC');
    }catch(e){ alert('Erreur '+e.message); return; }
  }
  STATE.PANIER=[]; STATE.LAST_VENTE=vente; window.LAST_VENTE=vente;
  localStorage.setItem('last_vente_'+STATE.SHOP, JSON.stringify(vente));
  renderPanier(); 
  document.getElementById('codeArt').value=''; document.getElementById('searchArt').value=''; document.getElementById('suggest').innerHTML='';
  document.getElementById('qteArt').value='1'; document.getElementById('remise').value=0; 
  if(document.getElementById('remiseMotif')) document.getElementById('remiseMotif').value='';
  if(document.getElementById('montantPaye')) document.getElementById('montantPaye').value='';
  if(document.getElementById('payeInput')) document.getElementById('payeInput').value='';
  if(document.getElementById('clientNom')) document.getElementById('clientNom').value='';
  if(document.getElementById('clientTel')) document.getElementById('clientTel').value='';
  if(document.getElementById('clientAnniv')) document.getElementById('clientAnniv').value='';
  if(document.getElementById('payMode')) document.getElementById('payMode').value='cash';
  window.renderVentesJour?.(); window.renderStock?.(); window.updateKPI?.(); updateOfflineUI(); 
  let cfg = STATE.TICKET_CONFIG || window.CURRENT_CONFIG || {};
  let autoPrint = cfg.imprimante?.autoPrint || cfg.autoPrint || false;
  if(autoPrint){
    window.imprimerVenteUniverselle?.(vente);
  } else {
    if(confirm(`Vente: ${formatPrix(final)} FC\nBrut: ${formatPrix(brut)} FC${remiseFC>0 ? `\nRéduction: -${formatPrix(remiseFC)} FC (${remiseMotifVal})` : ''}\nPayé: ${formatPrix(montantPayeVal)} FC${resteVal>0 ? `\nReste / Dette: ${formatPrix(resteVal)} FC` : ''}\nImprimer ticket 58mm ?`)){
      window.imprimerVenteUniverselle?.(vente);
    }
  }
}

export function renderVentesJour(){
  let el=document.getElementById('ventesJour'); if(!el) return;
  let today=new Date().toDateString(); 
  let vToday=(STATE.VENTES||[]).filter(v=> new Date(v.date).toDateString()===today).slice(0,20);
  let vQueue=STATE.OFFLINE_QUEUE.filter(q=>q.type==='vente').map(q=>q.data).filter(v=> new Date(v.date).toDateString()===today);
  let all=[...vToday,...vQueue].sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,20);
  el.innerHTML=all.map(v=>`<tr><td>${new Date(v.date).toLocaleTimeString()}</td><td>${v.vendeurNom||''}</td><td>${v.client?.nom||''}</td><td>${(v.items||[]).map(i=>i.CODE+' x'+(i.qty||i.qte||0)).join(', ')}</td><td>${formatPrix(v.total||0)}</td><td>${v.offline?'OFFLINE':'OK'}</td></tr>`).join('')||'<tr><td colspan=6>Aucune</td></tr>';
}

window.addPanier=addPanier; window.searchArticle=searchArticle; window.selectArtVente=selectArtVente; window.selectArt=selectArtVente;
window.renderPanier=renderPanier; window.removePanier=removePanier; window.checkRemise=checkRemise; window.validerVente=validerVente; window.vendre=validerVente; window.renderVentesJour=renderVentesJour;
console.log("vente.js V5.7.0 COMPLET OK -", CACHE_VERSION);
