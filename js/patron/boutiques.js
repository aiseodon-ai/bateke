// js/patron/boutiques.js - V10.8 FIX VERIF BADGE + RESTORE BOUTONS
import { STATE } from "../core/state.js";

function toTime(v){ if(!v) return 0; if(typeof v==='number') return v; if(typeof v==='string' && /^\d{12,}$/.test(v)) return parseInt(v,10); let d=new Date(v).getTime(); return isNaN(d)?0:d; }

// Cache des expires récupérés directement depuis shops/
let CACHE_EXPIRE = {};

function fetchExpire(shop){
  if(CACHE_EXPIRE[shop] !== undefined) return Promise.resolve(CACHE_EXPIRE[shop]);
  return firebase.database().ref('shops/'+shop+'/abonnements/expire').once('value').then(s=>{
    let v = s.val();
    if(!v){
      return firebase.database().ref('shops/'+shop+'/abonnement/expire').once('value').then(s2=>{
        CACHE_EXPIRE[shop] = toTime(s2.val());
        return CACHE_EXPIRE[shop];
      });
    }
    CACHE_EXPIRE[shop] = toTime(v);
    return CACHE_EXPIRE[shop];
  }).catch(()=>0);
}

function renderBoutiques(){
  try{
    let shops = (window.STATE?.SHOPS_LIST || window.SHOPS_LIST || STATE.SHOPS_LIST || []);
    if(shops.length===0 && window.ALL_DATA) shops = Object.keys(window.ALL_DATA);
    let allData = window.ALL_DATA || STATE.ALL_DATA || {};

    let elList = document.getElementById('listShops');
    let elLinks = document.getElementById('allLinks');

    if(!elList){
      let inputNew = document.getElementById('newShop');
      if(inputNew){
        let card = inputNew.closest('.card') || inputNew.parentElement.parentElement;
        if(card){
          let existing = card.querySelector('#listShops');
          if(!existing){
            existing = document.createElement('div');
            existing.id = 'listShops';
            existing.style.marginTop = '12px';
            card.appendChild(existing);
          }
          elList = existing;
        }
      }
    }

    if(!elLinks){
      let boutiquesSec = document.getElementById('boutiques');
      if(boutiquesSec){
        let cards = boutiquesSec.querySelectorAll('.card');
        if(cards.length>=2){
          let secondCard = cards[1];
          let existingLinks = secondCard.querySelector('#allLinks');
          if(!existingLinks){
            existingLinks = document.createElement('div');
            existingLinks.id = 'allLinks';
            secondCard.appendChild(existingLinks);
          }
          elLinks = existingLinks;
        }
      }
    }

    let origin = location.origin;
    if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
    let base = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'') + '/';
    base = base.replace(/patron\/$/,'');
    let baseV = base + 'vendeur.html';
    let realShop = STATE.SHOP || window.SHOP || localStorage.getItem('patron_shop') || shops[0];

    if(elList && shops.length>0){
      elList.innerHTML = shops.map(shop=>{
        let nb = (allData[shop]?.stock?.length||0);
        let nbVend = allData[shop]?.vendeurs ? Object.keys(allData[shop].vendeurs).length : 0;
        let isActive = shop===realShop;
        
        // VERIF CACHE, pas ALL_DATA seulement
        let exp = CACHE_EXPIRE[shop];
        let statusHtml = '';
        let border = isActive ? '2px solid #0b5e2f' : '1px solid #e2e8f0';
        let bg = isActive ? '#f0fdf4' : '#fff';
        
        if(exp === undefined){
          statusHtml = '<span style="background:#888;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">⏳ Vérif...</span>';
          fetchExpire(shop).then(()=> renderBoutiques());
        } else if(exp === 0){
          statusHtml = '<span style="background:#f59e0b;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">🆕 Nouvelle - à payer</span>';
          border = '2px solid #f59e0b'; bg = '#fffbeb';
        } else {
          let jours = Math.ceil((exp-Date.now())/86400000);
          if(jours < 0){
            statusHtml = `<span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">🔴 Bloquée ${jours}j</span>`;
            border = '2px solid #ef4444'; bg = '#fef2f2';
          } else if(jours <=3){
            statusHtml = `<span style="background:#f59e0b;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">🟠 ${jours}j restants</span>`;
          } else {
            statusHtml = `<span style="background:#22c55e;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">🟢 ${jours}j - Active</span>`;
          }
        }

        return `<div style="display:flex;justify-content:space-between;padding:12px;border:${border};background:${bg};border-radius:12px;margin-bottom:8px;align-items:center">
          <div style="flex:1"><b>🏪 ${shop}</b> ${statusHtml} ${isActive?'<span style="background:#0b5e2f;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">ACTIF</span>':''}<br>
          <small>${nb} articles • ${nbVend} vendeurs</small>${exp?`<br><small style="font-size:10px;color:#666">Expire: ${new Date(exp).toLocaleDateString()}</small>`:''}<br>
          <small style="color:#0b5e2f;font-size:9px;word-break:break-all">${baseV}?shop=${encodeURIComponent(shop)}</small></div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;max-width:160px">
            <button class="btn btn-b" style="width:auto;padding:6px 10px;font-size:11px" onclick="window.selectShop('${shop}')">Ouvrir</button>
            ${exp!==undefined && exp!==0 && exp < Date.now() ? `<button class="btn" style="width:auto;padding:6px 10px;font-size:11px;background:#ef4444;color:#fff" onclick="window.payerBoutique('${shop}')">💳 Payer</button>` : ''}
            <button class="btn" style="width:auto;padding:6px 8px;font-size:10px;background:#f59e0b" onclick="window.renommerBoutique('${shop}')">✏️</button>
            <button class="btn btn-r" style="width:auto;padding:6px 8px;font-size:10px" onclick="window.supprimerBoutique('${shop}')">🗑️</button>
          </div>
        </div>`;
      }).join('');
    }

    if(elLinks && shops.length>0){
      elLinks.innerHTML = shops.map(s=>{
        let lien2 = baseV + '?shop=' + encodeURIComponent(s);
        let ns = (allData[s]?.stock?.length||0);
        return `<div style="padding:10px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:#fff">
          <b>🏪 ${s}</b> <small>${ns} art</small>
          <div style="display:flex;gap:4px;margin-top:6px"><input value="${lien2}" id="inputLien_${s}" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:6px;border-radius:6px"><button class="btn btn-b" style="width:auto;font-size:10px" onclick="window.copyInput('inputLien_${s}')">Copier</button></div>
          <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
            <button class="btn btn-g" style="width:auto;font-size:10px" onclick="window.shareWhatsApp('${s}')">WhatsApp</button>
            <button class="btn" style="width:auto;font-size:10px;background:#f59e0b" onclick="window.renommerBoutique('${s}')">Renommer</button>
            <button class="btn" style="width:auto;font-size:10px;background:#111;color:#fff" onclick="window.openQR('${s}')">QR</button>
            <button class="btn btn-r" style="width:auto;font-size:10px" onclick="window.supprimerBoutique('${s}')">Supprimer</button>
          </div>
          <div id="qr_${s}" style="display:none;margin-top:10px;text-align:center"></div>
        </div>`;
      }).join('');
    }

    let sel = document.getElementById('shopSel');
    if(sel){
      if(sel.options.length===0 && shops.length>0){
        sel.innerHTML = shops.map(s=>`<option value="${s}">${s}</option>`).join('') + '<option value="ALL">TOUTES</option>';
      }
      if(shops.includes(realShop)) sel.value = realShop;
    }
  }catch(e){ console.error('renderBoutiques V10.8', e); }
}

function setRealShop(shop){
  let exp = CACHE_EXPIRE[shop];
  if(exp !== undefined && exp !== 0 && exp < Date.now()){
    if(!confirm(`⛔ ${shop} est BLOQUÉE.\nExpire: ${new Date(exp).toLocaleDateString()}\n\nPayer 10.000 FC pour réactiver?`)){
      return false;
    } else {
      window.payerBoutique(shop);
      return false;
    }
  }
  console.log('🔥 V10.8 setRealShop: '+shop);
  if(window.STATE && window.STATE.setShop) window.STATE.setShop(shop);
  else if(STATE && STATE.setShop) STATE.setShop(shop);
  else { window.SHOP = shop; localStorage.setItem('patron_shop', shop); }
  window.SHOP = shop;
  localStorage.setItem('patron_shop', shop);
  return true;
}

export function selectShop(shop){
  let ok = setRealShop(shop);
  if(ok===false) return;
  let sel = document.getElementById('shopSel'); if(sel) sel.value = shop;
  try{ if(window.updateLabels) window.updateLabels(); }catch(e){}
  try{ if(window.refreshAll) window.refreshAll(); }catch(e){}
  try{ renderBoutiques(); }catch(e){}
}
export function switchShop(){
  let sel = document.getElementById('shopSel'); if(!sel) return;
  let shop = sel.value;
  let ok = setRealShop(shop);
  if(ok===false){ if(sel) sel.value = window.SHOP; return; }
  try{ if(window.updateLabels) window.updateLabels(); }catch(e){}
  try{ if(window.refreshAll) window.refreshAll(); }catch(e){}
  try{ renderBoutiques(); }catch(e){}
}
export function createShop(){
  let n=document.getElementById('newShop').value.trim(); if(!n) return;
  let sid=n.replace(/[^a-zA-Z0-9_-]/g,'')||n;
  if(window.ALL_DATA && window.ALL_DATA[sid]){ alert('Existe déjà'); return; }
  firebase.database().ref('shops/'+sid+'/config').set({nom:n,id:sid,created:new Date().toISOString(),owner:localStorage.getItem('BATEKE_PIN')||''})
    .then(()=> firebase.database().ref('shops/'+sid+'/abonnements').set({expire:0, statut:'bloqué'}))
    .then(()=>{ alert('✅ Créée: '+n+' (à payer pour activer)'); location.reload(); });
}
export function payerBoutique(shop){
  let tx = prompt(`Payer pour ${shop} - TX ID Airtel/Mpesa:`); if(!tx) return;
  let phone = prompt('Numéro payeur:');
  firebase.database().ref('paiements_abonnements').push({
    boutique: shop, transactionId: tx.trim(), phonePayer: phone||'',
    patronId: localStorage.getItem('BATEKE_PIN')||'', montant: 10000,
    reseau: 'à vérifier', statut: 'en_attente', date: Date.now()
  }).then(()=> alert(`✅ Demande envoyée pour ${shop}. DG va valider.`));
}
export function renommerBoutique(oldShop){ if(!oldShop) return; let newShop=prompt('Renommer "'+oldShop+'" en:', oldShop); if(!newShop||newShop.trim()===''||newShop===oldShop) return; newShop=newShop.trim(); if(!confirm('Confirmer "'+oldShop+'" → "'+newShop+'" ?')) return; firebase.database().ref('shops/'+oldShop).once('value').then(snap=>{ let data=snap.val(); if(!data){ alert('Vide'); return; } data.config.nom=newShop; data.config.id=newShop; return firebase.database().ref('shops/'+newShop).set(data).then(()=> firebase.database().ref('shops/'+oldShop).remove()).then(()=>{ setRealShop(newShop); alert('✅ Renommé'); location.reload(); }); }); }
export function supprimerBoutique(shop){ if(!shop) return; let list = window.SHOPS_LIST || STATE.SHOPS_LIST || []; if(list.length<=1){ alert('Dernière boutique'); return; } let c=prompt('Tape OUI pour supprimer "'+shop+'":'); if(!c||c.toLowerCase()!=='oui') return; firebase.database().ref('shops/'+shop).remove().then(()=>{ alert('✅ Supprimée'); location.reload(); }); }
export function copyLienShop(shop){ let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke'; let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,''); let lien=base+'vendeur.html?shop='+encodeURIComponent(shop); if(navigator.clipboard) navigator.clipboard.writeText(lien).then(()=> alert('✅ Lien copié:\n'+lien)); }
export function copyInput(id){ let el=document.getElementById(id); if(!el) return; el.select(); document.execCommand('copy'); alert('✅ Copié'); }
export function shareWhatsApp(shop){ let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke'; let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,''); let lien=base+'vendeur.html?shop='+encodeURIComponent(shop); window.open('https://wa.me/?text='+encodeURIComponent('🏪 '+shop+'\n🔗 '+lien),'_blank'); }
export function openQR(shop){ let div=document.getElementById('qr_'+shop); if(!div) return; if(div.style.display!=='none'){ div.style.display='none'; return; } let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke'; let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,''); let lien=base+'vendeur.html?shop='+encodeURIComponent(shop); div.innerHTML='<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(lien)+'" style="border:8px solid #fff;border-radius:12px"><br><small>'+lien+'</small>'; div.style.display='block'; }
export function copyLien(){ let el=document.getElementById('lienVendeur')||document.getElementById('lienV'); if(el&&navigator.clipboard) navigator.clipboard.writeText(el.innerText).then(()=> alert('✅ Copié')); }

window.selectShop = selectShop; window.switchShop = switchShop; window.renderBoutiques = renderBoutiques; window.createShop = createShop; window.payerBoutique = payerBoutique; window.renommerBoutique = renommerBoutique; window.supprimerBoutique = supprimerBoutique; window.copyLienShop = copyLienShop; window.copyInput = copyInput; window.shareWhatsApp = shareWhatsApp; window.openQR = openQR; window.copyLien = copyLien; window.setRealShop = setRealShop;
console.log('✅ V10.8 FIX VERIF BADGE');
