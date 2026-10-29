// js/patron/boutiques.js - V8.9 FAST INSTANTANÉ - SANS RELOAD
// Même fonctions que V8.8 + selectShop ultra rapide

function renderBoutiques(){
  try{
    var elList = document.getElementById('listShops');
    var elLinks = document.getElementById('allLinks');
    var elSel = document.getElementById('shopSel');
    if(!elList) return;
    var shops = window.SHOPS_LIST || [];
    var allData = window.ALL_DATA || {};
    var origin = location.origin;
    if(origin.indexOf('file')===0) origin = 'https://aiseodon-ai.github.io/bateke';
    var basePath = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'') + '/';
    basePath = basePath.replace(/patron\/$/,'');
    var baseVendeur = basePath + 'vendeur.html';

    if(shops.length===0){
      elList.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b"><b>Aucune boutique</b></div>';
      if(elLinks) elLinks.innerHTML = '<div style="padding:10px;color:#888">Pas de boutiques</div>';
      return;
    }

    var html = '';
    for(var i=0;i<shops.length;i++){
      var shop = shops[i];
      var nb = (allData[shop] && allData[shop].stock) ? allData[shop].stock.length : 0;
      var lien = baseVendeur + '?shop=' + encodeURIComponent(shop);
      var isActive = (shop === (window.SHOP || localStorage.getItem('patron_shop'))) ? 'border:2px solid #0b5e2f;background:#f0fdf4' : 'border:1px solid #eee';
      html += '<div style="display:flex;justify-content:space-between;padding:10px;'+isActive+';border-radius:10px;margin-bottom:6px;align-items:center">'
        + '<div style="flex:1"><b>🏪 '+shop+'</b><br><small>'+nb+' articles</small><br><small style="color:#0b5e2f;font-size:10px;word-break:break-all">'+lien+'</small></div>'
        + '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;max-width:160px">'
        + '<button class="btn btn-b" style="width:auto;padding:6px 8px;font-size:10px" onclick="selectShop(\''+shop+'\')">Ouvrir</button>'
        + '<button class="btn" style="width:auto;padding:6px 8px;font-size:10px;background:#f59e0b" onclick="renommerBoutique(\''+shop+'\')">✏️</button>'
        + '<button class="btn btn-r" style="width:auto;padding:6px 8px;font-size:10px" onclick="supprimerBoutique(\''+shop+'\')">🗑️</button>'
        + '</div></div>';
    }
    elList.innerHTML = html;

    if(elLinks){
      var htmlLinks = '';
      for(var j=0;j<shops.length;j++){
        var s = shops[j];
        var lien2 = baseVendeur + '?shop=' + encodeURIComponent(s);
        var nbStock = (allData[s] && allData[s].stock) ? allData[s].stock.length : 0;
        var nbVentes = (allData[s] && allData[s].ventes) ? allData[s].ventes.length : 0;
        htmlLinks += '<div style="padding:12px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:#fff">'
          + '<div style="display:flex;justify-content:space-between"><b>🏪 '+s+'</b><span style="background:#f1f5f9;padding:2px 8px;border-radius:10px;font-size:10px">'+nbStock+' art. / '+nbVentes+' ventes</span></div>'
          + '<div style="margin-top:8px"><div style="display:flex;gap:4px"><input value="'+lien2+'" id="inputLien_'+s+'" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:8px;border-radius:8px"><button class="btn btn-b" style="width:auto" onclick="copyInput(\'inputLien_'+s+'\')">Copier</button></div>'
          + '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">'
          + '<button class="btn btn-y" style="width:auto;font-size:10px" onclick="copyLienShop(\''+s+'\')">📋 Copier</button>'
          + '<button class="btn btn-g" style="width:auto;font-size:10px" onclick="shareWhatsApp(\''+s+'\')">📲 WhatsApp</button>'
          + '<button class="btn" style="width:auto;font-size:10px;background:#f59e0b" onclick="renommerBoutique(\''+s+'\')">✏️ Renommer</button>'
          + '<button class="btn" style="width:auto;font-size:10px;background:#111;color:#fff" onclick="openQR(\''+s+'\')">📷 QR</button>'
          + '<button class="btn btn-r" style="width:auto;font-size:10px" onclick="supprimerBoutique(\''+s+'\')">🗑️ Supprimer</button>'
          + '</div><div id="qr_'+s+'" style="display:none;margin-top:10px;text-align:center"></div></div></div>';
      }
      elLinks.innerHTML = htmlLinks;
    }

    if(elSel){
      var current = window.SHOP || localStorage.getItem('patron_shop') || shops[0];
      var opt = '';
      for(var k=0;k<shops.length;k++) opt += '<option value="'+shops[k]+'" '+(shops[k]==current?'selected':'')+'>'+shops[k]+'</option>';
      opt += '<option value="ALL" '+(current==='ALL'?'selected':'')+'>TOUTES</option>';
      elSel.innerHTML = opt;
    }
  }catch(e){ console.log(e); }
}

// V8.9 FAST - CHANGEMENT INSTANTANÉ SANS RELOAD
function selectShop(shop){
  if(!shop) return;
  if(shop === window.SHOP){
    console.log('Déjà sur '+shop);
    return;
  }
  console.log('⚡ FAST switch: '+window.SHOP+' → '+shop);

  var isLogin = !window.SHOPS_LIST || window.SHOPS_LIST.length===0;

  window.SHOP = shop;
  localStorage.setItem('patron_shop', shop);
  localStorage.setItem('BATEKE_SHOP', shop);
  sessionStorage.setItem('BATEKE_BOUTIQUE', shop);

  if(isLogin) return;

  // 1. MAJ immédiate du header et labels - 0ms
  try{
    var h = document.getElementById('headerEntreprise');
    if(h) h.innerHTML = '👑 ETS BATEKE - '+shop+' - <span id="connBadge">⚡ '+shop+'</span>';
    
    var ids = ['presenceShopLab','labVenteShop','paramShopName','labVendShop','badgeShopName'];
    for(var i=0;i<ids.length;i++){
      var el = document.getElementById(ids[i]);
      if(el) el.innerText = shop;
    }
    
    // Titre Présence
    var cards = document.querySelectorAll('.card h4');
    for(var c=0;c<cards.length;c++){
      if(cards[c].innerText.indexOf('Présence')>-1){
        cards[c].innerHTML = '🟢 Présence - <span id="presenceShopLab">'+shop+'</span>';
      }
      if(cards[c].innerText.indexOf('Ventes')>-1 && cards[c].innerText.indexOf('Boutique')>-1){
        cards[c].innerHTML = '📊 Ventes - Boutique <span id="labVenteShop">'+shop+'</span>';
      }
    }
  }catch(e){}

  // 2. Panier spécifique boutique
  try{
    window.PANIER_ACHAT = JSON.parse(localStorage.getItem('panier_achat_'+shop)||'[]');
    if(typeof renderPanierAchat==='function') renderPanierAchat();
  }catch(e){}

  // 3. Badge abonnement - instantané
  try{ if(typeof checkAbonnement==='function') checkAbonnement(shop); }catch(e){}

  // 4. RENDER ULTRA RAPIDE - utilise ALL_DATA déjà en mémoire
  // Pas besoin de Firebase, tout est déjà chargé
  try{
    // Ces fonctions existent dans ton monolithe
    if(typeof window.updateLabels==='function') window.updateLabels();
    
    if(typeof window.renderVentes==='function') window.renderVentes();
    if(typeof window.renderStock==='function') window.renderStock();
    if(typeof window.renderPresence==='function') window.renderPresence();
    if(typeof window.renderDepenses==='function') window.renderDepenses();
    if(typeof window.renderEntrees==='function') window.renderEntrees();
    if(typeof window.renderCRM==='function') window.renderCRM();
    if(typeof window.updateKPI==='function') window.updateKPI();
    if(typeof window.refreshAll==='function') window.refreshAll();
    
    console.log('⚡ Switch instantané OK pour '+shop+' - pas de reload');
  }catch(e){
    console.warn('Fast render fail, fallback reload', e);
    // Si une fonction manque, on fait un petit reload seulement en dernier recours
    setTimeout(function(){ location.reload(); }, 300);
  }

  // 5. MAJ visuelle de la liste boutiques (bordure verte)
  try{ renderBoutiques(); }catch(e){}
}

function switchShop(){ var sel=document.getElementById('shopSel'); if(sel) selectShop(sel.value); }

// --- Reste des fonctions identiques V8.8 ---
function createShop(){
  var input=document.getElementById('newShop');
  if(!input) return;
  var n=input.value.trim(); if(!n) return;
  var shopId=n.trim();
  var pin=localStorage.getItem('BATEKE_PIN')||'7832';
  var db=firebase.database();
  db.ref('shops/'+shopId).once('value').then(function(snap){
    if(snap.exists()){ alert('Existe déjà'); return; }
    return db.ref('shops/'+shopId).set({config:{nom:n,id:shopId,created:new Date().toISOString(),owner:pin},stock:{},ventes:{},depenses:{},entrees:{},vendeurs:{},abonnement:{expire:Date.now()+30*86400000}}).then(function(){
      return db.ref('patrons/'+pin+'/boutiques/'+shopId).set({created:Date.now()});
    }).then(function(){ alert('✅ Créée: '+n); input.value=''; location.reload(); });
  });
}
function renommerBoutique(oldShop){
  if(!oldShop) return;
  var allData=window.ALL_DATA||{};
  var nb=(allData[oldShop]&&allData[oldShop].stock)?allData[oldShop].stock.length:0;
  var newShop=prompt('✏️ Renommer "'+oldShop+'" en:', oldShop);
  if(!newShop||newShop.trim()===''||newShop===oldShop) return;
  newShop=newShop.trim();
  var conf=prompt('Tape OUI pour confirmer "'+oldShop+'" → "'+newShop+'" ('+nb+' articles):');
  if(!conf||conf.toLowerCase()!=='oui') return;
  var db=firebase.database();
  db.ref('shops/'+newShop).once('value').then(function(ex){
    if(ex.exists()){ alert('Existe déjà'); throw new Error('exists'); }
    return db.ref('shops/'+oldShop).once('value');
  }).then(function(snap){
    var data=snap.val(); data.config.nom=newShop; data.config.id=newShop;
    return db.ref('shops/'+newShop).set(data);
  }).then(function(){ return db.ref('shops/'+oldShop).remove(); }).then(function(){
    localStorage.setItem('patron_shop', newShop); alert('✅ Renommé'); location.reload();
  }).catch(function(e){ if(e.message!=='exists') alert(e.message); });
}
function supprimerBoutique(shop){
  if(!shop) return;
  var shops=window.SHOPS_LIST||[];
  if(shops.length<=1){ alert('Dernière boutique - impossible'); return; }
  var conf=prompt('⚠️ SUPPRIMER "'+shop+'" ? Tape OUI:');
  if(!conf||conf.toLowerCase()!=='oui') return;
  var conf2=prompt('Tape le nom exact: '+shop);
  if(conf2!==shop) return;
  firebase.database().ref('shops/'+shop).remove().then(function(){ alert('✅ Supprimée'); location.reload(); });
}
function copyLienShop(shop){
  var origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
  var base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
  var lien=base+'vendeur.html?shop='+encodeURIComponent(shop);
  if(navigator.clipboard) navigator.clipboard.writeText(lien).then(function(){ alert('✅ Lien copié:\n'+lien); });
}
function copyInput(id){ var el=document.getElementById(id); if(!el) return; el.select(); document.execCommand('copy'); alert('✅ Copié'); }
function shareWhatsApp(shop){
  var origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
  var base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
  var lien=base+'vendeur.html?shop='+encodeURIComponent(shop);
  window.open('https://wa.me/?text='+encodeURIComponent('🏪 '+shop+'\n🔗 '+lien),'_blank');
}
function openQR(shop){
  var div=document.getElementById('qr_'+shop); if(!div) return;
  if(div.style.display!=='none'){ div.style.display='none'; return; }
  var origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
  var base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
  var lien=base+'vendeur.html?shop='+encodeURIComponent(shop);
  div.innerHTML='<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(lien)+'" style="border:8px solid #fff;border-radius:12px"><br><small>'+lien+'</small>';
  div.style.display='block';
}
function copyLien(){ var el=document.getElementById('lienVendeur'); if(el&&navigator.clipboard) navigator.clipboard.writeText(el.innerText).then(function(){ alert('✅ Copié'); }); }

window.renderBoutiques=renderBoutiques; window.createShop=createShop; window.selectShop=selectShop; window.switchShop=switchShop;
window.renommerBoutique=renommerBoutique; window.supprimerBoutique=supprimerBoutique; window.copyLienShop=copyLienShop;
window.copyInput=copyInput; window.shareWhatsApp=shareWhatsApp; window.openQR=openQR; window.copyLien=copyLien;
console.log("✅ boutiques.js V8.9 FAST INSTANTANÉ");
