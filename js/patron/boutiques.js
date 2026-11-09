// js/patron/boutiques.js - V10.9 BOUTON BLOQUER TEMPORAIRE PAR PATRON
import { STATE } from "../core/state.js";

function toTime(v){ if(!v) return 0; if(typeof v==='number') return v; if(typeof v==='string' && /^\d{12,}$/.test(v)) return parseInt(v,10); let d=new Date(v).getTime(); return isNaN(d)?0:d; }
let CACHE_EXPIRE = {};
let CACHE_PAUSE = {};

function fetchExpire(shop){
  if(CACHE_EXPIRE[shop] !== undefined) return Promise.resolve();
  return firebase.database().ref('shops/'+shop).once('value').then(s=>{
    let data = s.val()||{};
    CACHE_EXPIRE[shop] = toTime(data.abonnements?.expire || data.abonnement?.expire);
    CACHE_PAUSE[shop] = data.config?.bloqueParPatron || data.abonnements?.bloqueParPatron || false;
  }).catch(()=>{});
}

function renderBoutiques(){
  try{
    let shops = (window.STATE?.SHOPS_LIST || window.SHOPS_LIST || STATE.SHOPS_LIST || []);
    if(shops.length===0 && window.ALL_DATA) shops = Object.keys(window.ALL_DATA);
    let allData = window.ALL_DATA || STATE.ALL_DATA || {};

    let elList = document.getElementById('listShops');
    if(!elList){
      let inputNew = document.getElementById('newShop');
      if(inputNew){
        let card = inputNew.closest('.card') || inputNew.parentElement.parentElement;
        if(card){
          let existing = card.querySelector('#listShops');
          if(!existing){ existing = document.createElement('div'); existing.id='listShops'; existing.style.marginTop='12px'; card.appendChild(existing); }
          elList = existing;
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
        let exp = CACHE_EXPIRE[shop];
        let isPaused = CACHE_PAUSE[shop]===true;

        if(exp===undefined){
          fetchExpire(shop).then(()=> renderBoutiques());
          return `<div style="padding:12px;border:1px solid #e2e8f0;background:#fff;border-radius:12px;margin-bottom:8px">🏪 ${shop} - ⏳ Vérif...</div>`;
        }

        let jours = exp ? Math.ceil((exp-Date.now())/86400000) : -999;
        let isExpired = exp!==0 && exp < Date.now();
        let statusHtml = '';
        let border = '1px solid #e2e8f0', bg='#fff';

        if(isPaused){
          statusHtml = `<span style="background:#111;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">⏸️ PAUSE par toi</span>`;
          border='2px solid #111'; bg='#f1f5f9';
        } else if(isExpired){
          statusHtml = `<span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">🔴 Expirée ${jours}j</span>`;
          border='2px solid #ef4444'; bg='#fef2f2';
        } else if(exp===0){
          statusHtml = `<span style="background:#f59e0b;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">🆕 À payer</span>`;
          border='2px solid #f59e0b'; bg='#fffbeb';
        } else if(jours<=3){
          statusHtml = `<span style="background:#f59e0b;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">🟠 ${jours}j</span>`;
        } else {
          statusHtml = `<span style="background:#22c55e;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">🟢 ${jours}j</span>`;
        }

        if(isActive) { border='2px solid #0b5e2f'; bg=isPaused?'#f1f5f9':'#f0fdf4'; }

        // BOUTON PRINCIPAL = BLOQUER / REOUVRIR
        let btnBlock = '';
        if(isPaused){
          btnBlock = `<button class="btn" style="width:auto;padding:6px 12px;font-size:11px;background:#22c55e;color:#fff" onclick="window.toggleBlockShop('${shop}', false)">▶️ Réouvrir boutique</button>`;
        } else {
          btnBlock = `<button class="btn" style="width:auto;padding:6px 12px;font-size:11px;background:#111;color:#fff" onclick="window.toggleBlockShop('${shop}', true)">⏸️ Bloquer boutique</button>`;
        }

        return `<div style="display:flex;justify-content:space-between;padding:12px;border:${border};background:${bg};border-radius:12px;margin-bottom:8px;align-items:center">
          <div style="flex:1"><b>🏪 ${shop}</b> ${statusHtml} ${isActive?'<span style="background:#0b5e2f;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">ACTIF</span>':''}<br>
          <small>${nb} articles • ${nbVend} vendeurs</small>${exp?`<br><small style="font-size:10px;color:#666">Expire: ${new Date(exp).toLocaleDateString()}</small>`:''}<br>
          <small style="color:#0b5e2f;font-size:9px;word-break:break-all">${baseV}?shop=${encodeURIComponent(shop)}</small></div>
          <div style="display:flex;gap:4px;flex-direction:column;align-items:flex-end">
            ${isExpired?`<button class="btn" style="width:auto;padding:6px 10px;font-size:11px;background:#ef4444;color:#fff" onclick="window.payerBoutique('${shop}')">💳 Payer</button>`:btnBlock}
            <div style="display:flex;gap:4px">
              <button class="btn" style="width:auto;padding:4px 8px;font-size:10px;background:#f59e0b" onclick="window.renommerBoutique('${shop}')">✏️</button>
              <button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" onclick="window.supprimerBoutique('${shop}')">🗑️</button>
            </div>
          </div>
        </div>`;
      }).join('');
    }
    // ... reste identique pour elLinks
    let elLinks = document.getElementById('allLinks');
    if(elLinks && shops.length>0){
      let baseV = base + 'vendeur.html';
      elLinks.innerHTML = shops.map(s=>{
        let lien2 = baseV + '?shop=' + encodeURIComponent(s);
        let ns = (allData[s]?.stock?.length||0);
        let isPaused = CACHE_PAUSE[s];
        return `<div style="padding:10px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:${isPaused?'#f1f5f9':'#fff'}">
          <b>🏪 ${s}</b> <small>${ns} art</small> ${isPaused?'<span style="background:#111;color:#fff;padding:2px 6px;border-radius:8px;font-size:8px">PAUSE</span>':''}
          <div style="display:flex;gap:4px;margin-top:6px"><input value="${lien2}" id="inputLien_${s}" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:6px;border-radius:6px"><button class="btn btn-b" style="width:auto;font-size:10px" onclick="window.copyInput('inputLien_${s}')">Copier</button></div>
          <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
            <button class="btn btn-g" style="width:auto;font-size:10px" onclick="window.shareWhatsApp('${s}')">WhatsApp</button>
            <button class="btn" style="width:auto;font-size:10px;background:#111;color:#fff" onclick="window.openQR('${s}')">QR</button>
          </div>
          <div id="qr_${s}" style="display:none;margin-top:10px;text-align:center"></div>
        </div>`;
      }).join('');
    }
  }catch(e){ console.error('V10.9', e); }
}

export function toggleBlockShop(shop, shouldBlock){
  let msg = shouldBlock ? `Bloquer ${shop}?\n\nLes vendeurs ne pourront plus accéder. Tu pourras la réouvrir quand tu veux.` : `Réouvrir ${shop}?\n\nLes vendeurs pourront de nouveau vendre.`;
  if(!confirm(msg)) return;
  firebase.database().ref('shops/'+shop+'/config/bloqueParPatron').set(shouldBlock).then(()=>{
    firebase.database().ref('shops/'+shop+'/config/bloqueParPatronDate').set(Date.now());
    CACHE_PAUSE[shop]=shouldBlock;
    alert(shouldBlock ? `⏸️ ${shop} bloquée. Vendeurs bloqués.` : `▶️ ${shop} réouverte.`);
    renderBoutiques();
  });
}

export function selectShop(shop){
  if(CACHE_PAUSE[shop]){ if(!confirm(`⏸️ ${shop} est en PAUSE (bloquée par toi).\nTu veux quand même l'ouvrir pour gérer?`)) return; }
  if(window.STATE && window.STATE.setShop) window.STATE.setShop(shop);
  else if(STATE && STATE.setShop) STATE.setShop(shop);
  else { window.SHOP = shop; localStorage.setItem('patron_shop', shop); }
  window.SHOP = shop; localStorage.setItem('patron_shop', shop);
  let sel = document.getElementById('shopSel'); if(sel) sel.value = shop;
  try{ if(window.updateLabels) window.updateLabels(); }catch(e){}
  try{ if(window.refreshAll) window.refreshAll(); }catch(e){}
  try{ renderBoutiques(); }catch(e){}
}
export function switchShop(){ let sel=document.getElementById('shopSel'); if(!sel) return; selectShop(sel.value); }
export function createShop(){ let n=document.getElementById('newShop').value.trim(); if(!n) return; let sid=n.replace(/[^a-zA-Z0-9_-]/g,'')||n; if(window.ALL_DATA && window.ALL_DATA[sid]){ alert('Existe déjà'); return; } firebase.database().ref('shops/'+sid+'/config').set({nom:n,id:sid,created:new Date().toISOString(),owner:localStorage.getItem('BATEKE_PIN')||''}).then(()=> firebase.database().ref('shops/'+sid+'/abonnements').set({expire:0, statut:'bloqué'})).then(()=>{ alert('✅ Créée: '+n+' (à payer)'); location.reload(); }); }
export function payerBoutique(shop){ let tx=prompt(`Payer pour ${shop} - TX ID:`); if(!tx) return; let phone=prompt('Numéro payeur:'); firebase.database().ref('paiements_abonnements').push({boutique:shop, transactionId:tx.trim(), phonePayer:phone||'', patronId:localStorage.getItem('BATEKE_PIN')||'', montant:10000, reseau:'à vérifier', statut:'en_attente', date:Date.now()}).then(()=> alert(`✅ Demande envoyée pour ${shop}.`)); }
export function renommerBoutique(oldShop){ if(!oldShop) return; let newShop=prompt('Renommer "'+oldShop+'" en:', oldShop); if(!newShop||newShop.trim()===''||newShop===oldShop) return; newShop=newShop.trim(); if(!confirm('Confirmer "'+oldShop+'" → "'+newShop+'" ?')) return; firebase.database().ref('shops/'+oldShop).once('value').then(snap=>{ let data=snap.val(); if(!data){ alert('Vide'); return; } data.config.nom=newShop; data.config.id=newShop; return firebase.database().ref('shops/'+newShop).set(data).then(()=> firebase.database().ref('shops/'+oldShop).remove()).then(()=>{ selectShop(newShop); alert('✅ Renommé'); location.reload(); }); }); }
export function supprimerBoutique(shop){ if(!shop) return; let list = window.SHOPS_LIST || STATE.SHOPS_LIST || []; if(list.length<=1){ alert('Dernière boutique'); return; } let c=prompt('Tape OUI pour supprimer "'+shop+'":'); if(!c||c.toLowerCase()!=='oui') return; firebase.database().ref('shops/'+shop).remove().then(()=>{ alert('✅ Supprimée'); location.reload(); }); }
export function copyInput(id){ let el=document.getElementById(id); if(!el) return; el.select(); document.execCommand('copy'); alert('✅ Copié'); }
export function shareWhatsApp(shop){ let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke'; let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,''); let lien=base+'vendeur.html?shop='+encodeURIComponent(shop); window.open('https://wa.me/?text='+encodeURIComponent('🏪 '+shop+'\n🔗 '+lien),'_blank'); }
export function openQR(shop){ let div=document.getElementById('qr_'+shop); if(!div) return; if(div.style.display!=='none'){ div.style.display='none'; return; } let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke'; let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,''); let lien=base+'vendeur.html?shop='+encodeURIComponent(shop); div.innerHTML='<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(lien)+'" style="border:8px solid #fff;border-radius:12px"><br><small>'+lien+'</small>'; div.style.display='block'; }

window.selectShop = selectShop; window.switchShop = switchShop; window.renderBoutiques = renderBoutiques; window.toggleBlockShop = toggleBlockShop; window.createShop = createShop; window.payerBoutique = payerBoutique; window.renommerBoutique = renommerBoutique; window.supprimerBoutique = supprimerBoutique; window.copyInput = copyInput; window.shareWhatsApp = shareWhatsApp; window.openQR = openQR;
console.log('✅ V10.9 BOUTON BLOQUER PAR PATRON');
