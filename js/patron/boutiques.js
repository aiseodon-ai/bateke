// js/patron/boutiques.js - V8.23 V6.8 FIX - respecte state.js + window.SHOP
// Ne touche plus au selecteur, ne casse plus la présence

function renderBoutiques(data){
  try{
    let shops = window.SHOPS_LIST || [];
    if(shops.length===0 && window.ALL_DATA) shops = Object.keys(window.ALL_DATA);
    let allData = window.ALL_DATA || {};

    let elList = document.getElementById('listShops');
    let elLinks = document.getElementById('allLinks');

    // V6.2 / V6.8: si les IDs n'existent pas, on les crée après l'input Ex: Limete
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

    // Vrai shop actuel depuis state.js / window.SHOP
    let realShop = window.SHOP || localStorage.getItem('patron_shop') || shops[0] || 'Menkao1';

    if(elList && shops.length>0){
      elList.innerHTML = shops.map(shop=>{
        let nb = (allData[shop]?.stock?.length||0);
        let nbVend = allData[shop]?.vendeurs ? Object.keys(allData[shop].vendeurs).length : 0;
        let isActive = shop===realShop;
        return `<div style="display:flex;justify-content:space-between;padding:12px;border:${isActive?'2px solid #0b5e2f':'1px solid #e2e8f0'};background:${isActive?'#f0fdf4':'#fff'};border-radius:12px;margin-bottom:8px;align-items:center">
          <div style="flex:1"><b>🏪 ${shop}</b> ${isActive?'<span style="background:#0b5e2f;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">ACTIF</span>':''}<br>
          <small>${nb} articles • ${nbVend} vendeurs</small><br>
          <small style="color:#0b5e2f;font-size:9px;word-break:break-all">${baseV}?shop=${encodeURIComponent(shop)}</small></div>
          <div style="display:flex;gap:4px">
            <button class="btn btn-b" style="width:auto;padding:6px 10px;font-size:11px" onclick="selectShop('${shop}')">Ouvrir</button>
            <button class="btn" style="width:auto;padding:6px 8px;font-size:10px;background:#f59e0b" onclick="renommerBoutique('${shop}')">✏️</button>
            <button class="btn btn-r" style="width:auto;padding:6px 8px;font-size:10px" onclick="supprimerBoutique('${shop}')">🗑️</button>
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
          <div style="display:flex;gap:4px;margin-top:6px"><input value="${lien2}" id="inputLien_${s}" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:6px;border-radius:6px"><button class="btn btn-b" style="width:auto;font-size:10px" onclick="copyInput('inputLien_${s}')">Copier</button></div>
          <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
            <button class="btn btn-g" style="width:auto;font-size:10px" onclick="shareWhatsApp('${s}')">WhatsApp</button>
            <button class="btn" style="width:auto;font-size:10px;background:#f59e0b" onclick="renommerBoutique('${s}')">Renommer</button>
            <button class="btn" style="width:auto;font-size:10px;background:#111;color:#fff" onclick="openQR('${s}')">QR</button>
            <button class="btn btn-r" style="width:auto;font-size:10px" onclick="supprimerBoutique('${s}')">Supprimer</button>
          </div>
          <div id="qr_${s}" style="display:none;margin-top:10px;text-align:center"></div>
        </div>`;
      }).join('');
    }

    // FIX CRITIQUE V6.8: NE PAS reconstruire le selecteur, ça cassait le onchange
    let sel = document.getElementById('shopSel');
    if(sel && shops.length>0){
      // Si vide, on le remplit une seule fois
      if(sel.options.length===0){
        sel.innerHTML = shops.map(s=>`<option value="${s}">${s}</option>`).join('') + '<option value="ALL">TOUTES</option>';
      }
      sel.value = realShop;
    }
  }catch(e){ console.error('renderBoutiques V8.23', e); }
}

// FIX CENTRAL V6.8: met à jour le vrai SHOP dans state.js + window.SHOP
function setRealShop(shop){
  console.log('🔥 setRealShop V6.8: '+shop);
  
  try{ localStorage.setItem('patron_shop', shop); }catch(e){}
  try{ localStorage.setItem('BATEKE_SHOP', shop); }catch(e){}
  
  // 1. window.SHOP - utilisé par app.js et tout le monolithe
  window.SHOP = shop;
  
  // 2. Essaie de mettre à jour le let SHOP de core/state.js via window et via eval global
  try{
    // Si state.js a exposé un setter
    if(window.setShop) window.setShop(shop);
    if(window.setCurrentShop) window.setCurrentShop(shop);
    if(window.STATE && window.STATE.setShop) window.STATE.setShop(shop);
  }catch(e){}

  // 3. Force via eval dans le contexte global (pour le let SHOP de state.js)
  try{ window.eval('if(typeof SHOP!=="undefined"){SHOP="'+shop+'"}'); }catch(e){}
  try{ eval('if(typeof SHOP!=="undefined"){SHOP="'+shop+'"}'); }catch(e){}
  
  // 4. Si tu as un export state.js avec fonction update
  try{
    // Pour ES modules, on ne peut pas assigner direct, mais on peut stocker dans un global que state.js lit
    window._BATEKE_FORCED_SHOP = shop;
  }catch(e){}
}

export function selectShop(shop){
  console.log('👉 selectShop '+shop);
  setRealShop(shop);
  
  try{ 
    let pan = localStorage.getItem('panier_achat_'+shop);
    if(window.PANIER_ACHAT!==undefined) window.PANIER_ACHAT = pan?JSON.parse(pan):[];
    if(typeof PANIER_ACHAT!=='undefined') PANIER_ACHAT = pan?JSON.parse(pan):[];
  }catch(e){}

  let sel = document.getElementById('shopSel');
  if(sel) sel.value = shop;

  try{ if(typeof window.updateLabels==='function') window.updateLabels(); else if(typeof updateLabels==='function') updateLabels(); }catch(e){}
  try{ if(typeof window.refreshAll==='function') window.refreshAll(); else if(typeof refreshAll==='function') refreshAll(); }catch(e){}
}

export function switchShop(){
  let sel = document.getElementById('shopSel');
  if(!sel) return;
  let shop = sel.value;
  console.log('👉 switchShop '+shop);
  setRealShop(shop);
  
  try{ 
    let pan = localStorage.getItem('panier_achat_'+shop);
    if(window.PANIER_ACHAT!==undefined) window.PANIER_ACHAT = pan?JSON.parse(pan):[];
  }catch(e){}

  try{ if(typeof window.updateLabels==='function') window.updateLabels(); else if(typeof updateLabels==='function') updateLabels(); }catch(e){}
  try{ if(typeof window.refreshAll==='function') window.refreshAll(); else if(typeof refreshAll==='function') refreshAll(); }catch(e){}
  try{ if(typeof window.renderAchatStock==='function') window.renderAchatStock(); }catch(e){}
  try{ if(typeof window.renderPanierAchat==='function') window.renderPanierAchat(); }catch(e){}
}

// Expose aussi en window pour les onclick HTML
window.selectShop = selectShop;
window.switchShop = switchShop;
window.renderBoutiques = renderBoutiques;
window.setRealShop = setRealShop;

export function createShop(){
  let n=document.getElementById('newShop').value.trim();
  if(!n) return;
  let sid=n.replace(/[^a-zA-Z0-9_-]/g,'')||n;
  if(window.ALL_DATA && window.ALL_DATA[sid]){ alert('Existe déjà'); return; }
  firebase.database().ref('shops/'+sid+'/config').set({nom:n,id:sid,created:new Date().toISOString(),owner:localStorage.getItem('BATEKE_PIN')||'7832'})
    .then(()=> firebase.database().ref('shops/'+sid+'/abonnement').set({expire:Date.now()+30*86400000}))
    .then(()=>{ alert('✅ Créée: '+n); location.reload(); });
}
export function renommerBoutique(oldShop){
  if(!oldShop) return;
  let newShop=prompt('Renommer "'+oldShop+'" en:', oldShop);
  if(!newShop||newShop.trim()===''||newShop===oldShop) return;
  newShop=newShop.trim();
  if(!confirm('Confirmer "'+oldShop+'" → "'+newShop+'" ?')) return;
  firebase.database().ref('shops/'+oldShop).once('value').then(snap=>{
    let data=snap.val(); if(!data){ alert('Vide'); return; }
    data.config.nom=newShop; data.config.id=newShop;
    return firebase.database().ref('shops/'+newShop).set(data).then(()=> firebase.database().ref('shops/'+oldShop).remove()).then(()=>{
      setRealShop(newShop); alert('✅ Renommé'); location.reload();
    });
  });
}
export function supprimerBoutique(shop){
  if(!shop) return;
  if(window.SHOPS_LIST && window.SHOPS_LIST.length<=1){ alert('Dernière boutique'); return; }
  let c=prompt('Tape OUI pour supprimer "'+shop+'":');
  if(!c||c.toLowerCase()!=='oui') return;
  firebase.database().ref('shops/'+shop).remove().then(()=>{ alert('✅ Supprimée'); location.reload(); });
}
export function copyLienShop(shop){
  let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
  let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
  let lien=base+'vendeur.html?shop='+encodeURIComponent(shop);
  if(navigator.clipboard) navigator.clipboard.writeText(lien).then(()=> alert('✅ Lien copié:\n'+lien));
}
export function copyInput(id){ let el=document.getElementById(id); if(!el) return; el.select(); document.execCommand('copy'); alert('✅ Copié'); }
export function shareWhatsApp(shop){
  let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
  let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
  let lien=base+'vendeur.html?shop='+encodeURIComponent(shop);
  window.open('https://wa.me/?text='+encodeURIComponent('🏪 '+shop+'\n🔗 '+lien),'_blank');
}
export function openQR(shop){
  let div=document.getElementById('qr_'+shop); if(!div) return;
  if(div.style.display!=='none'){ div.style.display='none'; return; }
  let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
  let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
  let lien=base+'vendeur.html?shop='+encodeURIComponent(shop);
  div.innerHTML='<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(lien)+'" style="border:8px solid #fff;border-radius:12px"><br><small>'+lien+'</small>';
  div.style.display='block';
}
export function copyLien(){ let el=document.getElementById('lienVendeur')||document.getElementById('lienV'); if(el&&navigator.clipboard) navigator.clipboard.writeText(el.innerText).then(()=> alert('✅ Copié')); }

window.createShop=createShop; window.renommerBoutique=renommerBoutique; window.supprimerBoutique=supprimerBoutique;
window.copyLienShop=copyLienShop; window.copyInput=copyInput; window.shareWhatsApp=shareWhatsApp; window.openQR=openQR; window.copyLien=copyLien;

console.log('✅ V8.23 V6.8 - SHOP dans state.js + window.SHOP - fix 3 jours');
