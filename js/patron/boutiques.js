// js/patron/boutiques.js - V8.21 - FIX LISTE BOUTIQUES V6.2 + PRÉSENCE OK
// Basé sur pantron.txt monolithe - ne casse pas V8.20

function renderBoutiques(data){
  try{
    let shops = window.SHOPS_LIST || [];
    if(shops.length===0 && window.ALL_DATA) shops = Object.keys(window.ALL_DATA);
    let allData = window.ALL_DATA || {};

    // Trouve les conteneurs - V6.2 a changé les IDs
    let elList = document.getElementById('listShops') || document.getElementById('boutiquesList') || document.getElementById('shopsList');
    let elLinks = document.getElementById('allLinks') || document.getElementById('liensBoutiques') || document.getElementById('linksList');

    // Si listShops n'existe pas (V6.2), cherche le conteneur après l'input Ex: Limete
    if(!elList){
      let inputNew = document.getElementById('newShop');
      if(inputNew){
        // Le parent de l'input est le card Boutiques
        let card = inputNew.closest('.card') || inputNew.parentElement.parentElement;
        if(card){
          // Cherche ou crée un div pour la liste
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
      // Deuxième card dans l'onglet Boutiques
      let boutiquesSec = document.getElementById('boutiques');
      if(boutiquesSec){
        let cards = boutiquesSec.querySelectorAll('.card');
        if(cards.length>=2){
          let secondCard = cards[1];
          let existingLinks = secondCard.querySelector('#allLinks');
          if(!existingLinks){
            existingLinks = document.createElement('div');
            existingLinks.id = 'allLinks';
            existingLinks.style.marginTop = '10px';
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

    if(elList){
      if(shops.length===0){
        elList.innerHTML = '<div style="padding:12px;color:#888">Aucune boutique trouvée - SHOPS_LIST vide</div>';
      } else {
        let html = shops.map(shop=>{
          let nb = (allData[shop]?.stock?.length||0);
          let nbVend = allData[shop]?.vendeurs ? Object.keys(allData[shop].vendeurs).length : 0;
          let isActive = shop===SHOP ? 'border:2px solid #0b5e2f;background:#f0fdf4' : 'border:1px solid #e2e8f0;background:#fff';
          let lien = baseV + '?shop=' + encodeURIComponent(shop);
          return `<div style="display:flex;justify-content:space-between;padding:12px;${isActive};border-radius:12px;margin-bottom:8px;align-items:center">
            <div style="flex:1"><b>🏪 ${shop}</b> ${shop===SHOP?'<span style="background:#0b5e2f;color:#fff;padding:2px 8px;border-radius:10px;font-size:9px">ACTIF</span>':''}<br>
            <small>${nb} articles • ${nbVend} vendeurs</small><br>
            <small style="color:#0b5e2f;font-size:9px;word-break:break-all">${lien}</small></div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;max-width:180px;justify-content:flex-end">
              <button class="btn btn-b" style="width:auto;padding:6px 10px;font-size:11px" onclick="selectShop('${shop}')">Ouvrir</button>
              <button class="btn" style="width:auto;padding:6px 8px;font-size:10px;background:#f59e0b;color:#000" onclick="renommerBoutique('${shop}')">✏️</button>
              <button class="btn btn-r" style="width:auto;padding:6px 8px;font-size:10px" onclick="supprimerBoutique('${shop}')">🗑️</button>
            </div>
          </div>`;
        }).join('');
        elList.innerHTML = html;
      }
    }

    if(elLinks){
      if(shops.length===0){
        elLinks.innerHTML = '<small>Aucune boutique</small>';
      } else {
        let htmlLinks = shops.map(s=>{
          let lien2 = baseV + '?shop=' + encodeURIComponent(s);
          let ns = (allData[s]?.stock?.length||0);
          let nv = allData[s]?.vendeurs ? Object.keys(allData[s].vendeurs).length : 0;
          return `<div style="padding:12px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:#fff">
            <div style="display:flex;justify-content:space-between"><b>🏪 ${s}</b><span style="background:#f1f5f9;padding:2px 8px;border-radius:10px;font-size:10px">${ns} art / ${nv} vend</span></div>
            <div style="margin-top:8px"><div style="display:flex;gap:4px"><input value="${lien2}" id="inputLien_${s}" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:8px;border-radius:8px"><button class="btn btn-b" style="width:auto" onclick="copyInput('inputLien_${s}')">Copier</button></div>
            <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">
              <button class="btn btn-y" style="width:auto;font-size:10px" onclick="copyLienShop('${s}')">📋 Copier</button>
              <button class="btn btn-g" style="width:auto;font-size:10px" onclick="shareWhatsApp('${s}')">📲 WhatsApp</button>
              <button class="btn" style="width:auto;font-size:10px;background:#f59e0b" onclick="renommerBoutique('${s}')">✏️ Renommer</button>
              <button class="btn" style="width:auto;font-size:10px;background:#111;color:#fff" onclick="openQR('${s}')">📷 QR</button>
              <button class="btn btn-r" style="width:auto;font-size:10px" onclick="supprimerBoutique('${s}')">🗑️ Supprimer</button>
            </div>
            <div id="qr_${s}" style="display:none;margin-top:10px;text-align:center"></div></div>
          </div>`;
        }).join('');
        elLinks.innerHTML = htmlLinks;
      }
    }

    // Met à jour le selecteur si besoin
    let sel = document.getElementById('shopSel');
    if(sel && shops.length>0){
      let cur = SHOP || localStorage.getItem('patron_shop') || shops[0];
      if(sel.options.length !== shops.length+1){
        sel.innerHTML = shops.map(s=>`<option ${s===cur?'selected':''} value="${s}">${s}</option>`).join('') + '<option value="ALL">TOUTES</option>';
      } else {
        sel.value = cur;
      }
    }

    console.log('✅ renderBoutiques V8.21 - '+shops.length+' boutiques affichées');
  }catch(e){ console.error('renderBoutiques V8.21 err', e); }
}

// === COPIE EXACTE MONOLITHE - GARDE L'ACQUIS PRÉSENCE ===
function selectShop(shop){
  SHOP=shop;
  localStorage.setItem('patron_shop',SHOP);
  PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
  document.getElementById('shopSel').value=shop;
  updateLabels();
  refreshAll();
}

function switchShop(){
  SHOP=document.getElementById('shopSel').value;
  localStorage.setItem('patron_shop',SHOP);
  PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
  updateLabels();
  refreshAll();
  renderAchatStock();
  renderPanierAchat();
}
// === FIN COPIE MONOLITHE ===

function createShop(){
  let n=document.getElementById('newShop').value.trim();
  if(!n) return;
  let sid=n.replace(/[^a-zA-Z0-9_-]/g,'')||n;
  if(ALL_DATA[sid]){ alert('Existe déjà'); return; }
  db.ref('shops/'+sid+'/config').set({nom:n,id:sid,created:new Date().toISOString(),owner:localStorage.getItem('BATEKE_PIN')||'7832'})
    .then(()=> db.ref('shops/'+sid+'/abonnement').set({expire:Date.now()+30*86400000}))
    .then(()=>{ alert('✅ Créée: '+n); location.reload(); });
}

function renommerBoutique(oldShop){
  if(!oldShop) return;
  let newShop=prompt('Renommer "'+oldShop+'" en:', oldShop);
  if(!newShop||newShop.trim()===''||newShop===oldShop) return;
  newShop=newShop.trim();
  if(!confirm('Confirmer "'+oldShop+'" → "'+newShop+'" ?')) return;
  db.ref('shops/'+oldShop).once('value').then(snap=>{
    let data=snap.val(); if(!data){ alert('Vide'); return; }
    data.config.nom=newShop; data.config.id=newShop;
    return db.ref('shops/'+newShop).set(data).then(()=> db.ref('shops/'+oldShop).remove()).then(()=>{
      localStorage.setItem('patron_shop',newShop); alert('✅ Renommé'); location.reload();
    });
  });
}

function supprimerBoutique(shop){
  if(!shop) return;
  if(SHOPS_LIST.length<=1){ alert('Dernière boutique'); return; }
  let c=prompt('Tape OUI pour supprimer "'+shop+'":');
  if(!c||c.toLowerCase()!=='oui') return;
  db.ref('shops/'+shop).remove().then(()=>{ alert('✅ Supprimée'); location.reload(); });
}

function copyLienShop(shop){
  let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
  let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
  let lien=base+'vendeur.html?shop='+encodeURIComponent(shop);
  if(navigator.clipboard) navigator.clipboard.writeText(lien).then(()=> alert('✅ Lien copié:\n'+lien));
}
function copyInput(id){ let el=document.getElementById(id); if(!el) return; el.select(); document.execCommand('copy'); alert('✅ Copié'); }
function shareWhatsApp(shop){
  let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
  let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
  let lien=base+'vendeur.html?shop='+encodeURIComponent(shop);
  window.open('https://wa.me/?text='+encodeURIComponent('🏪 '+shop+'\n🔗 '+lien),'_blank');
}
function openQR(shop){
  let div=document.getElementById('qr_'+shop); if(!div) return;
  if(div.style.display!=='none'){ div.style.display='none'; return; }
  let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
  let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
  let lien=base+'vendeur.html?shop='+encodeURIComponent(shop);
  div.innerHTML='<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(lien)+'" style="border:8px solid #fff;border-radius:12px"><br><small>'+lien+'</small>';
  div.style.display='block';
}
function copyLien(){ let el=document.getElementById('lienVendeur')||document.getElementById('lienV'); if(el&&navigator.clipboard) navigator.clipboard.writeText(el.innerText).then(()=> alert('✅ Copié')); }

// Auto-render au chargement si SHOPS_LIST déjà là (cas V6.2)
setTimeout(()=>{
  try{
    if(typeof SHOPS_LIST!=='undefined' && SHOPS_LIST.length>0){
      renderBoutiques();
      console.log('✅ Auto renderBoutiques V6.2 au chargement');
    }
  }catch(e){}
}, 800);

window.renderBoutiques=renderBoutiques; window.createShop=createShop; window.selectShop=selectShop; window.switchShop=switchShop;
window.renommerBoutique=renommerBoutique; window.supprimerBoutique=supprimerBoutique; window.copyLienShop=copyLienShop;
window.copyInput=copyInput; window.shareWhatsApp=shareWhatsApp; window.openQR=openQR; window.copyLien=copyLien;
console.log('✅ V8.21 - Liste boutiques restaurée + présence OK - basé sur monolithe');
