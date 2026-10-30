// js/patron/boutiques.js - V8.13 FINAL - MULTIBOUTIQUE RÉEL INSTANTANÉ SANS ECRAN BLANC
// Basé sur ton pantron.txt original + toutes les options

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
      elList.innerHTML = '<div style="padding:20px;text-align:center">Aucune boutique</div>';
      if(elLinks) elLinks.innerHTML = '<div style="padding:10px;color:#888">Pas de boutiques</div>';
      return;
    }

    // Liste avec boutons Ouvrir + Renommer + Supprimer
    var html = '';
    for(var i=0;i<shops.length;i++){
      var shop = shops[i];
      var nb = (allData[shop] && allData[shop].stock) ? allData[shop].stock.length : 0;
      var lien = baseVendeur + '?shop=' + encodeURIComponent(shop);
      var isActive = (shop === (window.SHOP || localStorage.getItem('patron_shop'))) ? 'border:2px solid #0b5e2f;background:#f0fdf4' : 'border:1px solid #eee';
      html += '<div style="display:flex;justify-content:space-between;padding:10px;'+isActive+';border-radius:10px;margin-bottom:6px;align-items:center">'
        + '<div style="flex:1"><b>🏪 '+shop+'</b><br><small>'+nb+' articles</small><br><small style="color:#0b5e2f;font-size:10px;word-break:break-all">'+lien+'</small></div>'
        + '<div style="display:flex;gap:4px;flex-wrap:wrap;max-width:170px;justify-content:flex-end">'
        + '<button class="btn btn-b" style="width:auto;padding:6px 8px;font-size:10px" onclick="selectShop(\''+shop+'\')">Ouvrir</button>'
        + '<button class="btn" style="width:auto;padding:6px 8px;font-size:10px;background:#f59e0b;color:#000" onclick="renommerBoutique(\''+shop+'\')">✏️</button>'
        + '<button class="btn btn-r" style="width:auto;padding:6px 8px;font-size:10px" onclick="supprimerBoutique(\''+shop+'\')">🗑️</button>'
        + '</div></div>';
    }
    elList.innerHTML = html;

    // Liens vendeur
    if(elLinks){
      var htmlLinks = '';
      for(var j=0;j<shops.length;j++){
        var s = shops[j];
        var lien2 = baseVendeur + '?shop=' + encodeURIComponent(s);
        var nbStock = (allData[s] && allData[s].stock) ? allData[s].stock.length : 0;
        var nbVentes = (allData[s] && allData[s].ventes) ? allData[s].ventes.length : 0;
        htmlLinks += '<div style="padding:12px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:#fff">'
          + '<div style="display:flex;justify-content:space-between"><b>🏪 '+s+'</b><span style="background:#f1f5f9;padding:2px 8px;border-radius:10px;font-size:10px">'+nbStock+' art / '+nbVentes+' ventes</span></div>'
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

    // Selecteur du header
    if(elSel){
      var current = window.SHOP || localStorage.getItem('patron_shop') || shops[0];
      var opt = '';
      for(var k=0;k<shops.length;k++) opt += '<option value="'+shops[k]+'" '+(shops[k]==current?'selected':'')+'>'+shops[k]+'</option>';
      opt += '<option value="ALL" '+(current==='ALL'?'selected':'')+'>TOUTES</option>';
      elSel.innerHTML = opt;
    }
    console.log('✅ renderBoutiques V8.13 OK - '+shops.length+' boutiques');
  }catch(e){ console.error('renderBoutiques err', e); }
}

// V8.13 - MULTIBOUTIQUE RÉEL - C'EST TON CODE ORIGINAL QUI MARCHE SANS ECRAN BLANC
function selectShop(shop){
  if(!shop) return;
  try{
    console.log('⚡ V8.13 MULTIBOUTIQUE RÉEL: '+window.SHOP+' → '+shop);

    // 1. Ton code original exact de pantron.txt
    window.SHOP = shop;
    localStorage.setItem('patron_shop', shop);
    localStorage.setItem('BATEKE_SHOP', shop);
    sessionStorage.setItem('BATEKE_BOUTIQUE', shop);
    
    // Panier spécifique boutique - important pour Achat
    try{
      window.PANIER_ACHAT = JSON.parse(localStorage.getItem('panier_achat_'+shop)||'[]');
    }catch(e){ window.PANIER_ACHAT = []; }

    // 2. Met le selecteur à jour (ton code original)
    var elSel = document.getElementById('shopSel');
    if(elSel) elSel.value = shop;

    // 3. Labels - ton updateLabels() original existe déjà dans pantron.txt
    // Il fait: labVenteShop, labVendShop, presenceShopLab, lienV, paramShopName, headerEntreprise
    if(typeof updateLabels==='function'){
      updateLabels();
    } else {
      // Fallback si updateLabels pas encore chargé
      var ids = ['labVenteShop','labVendShop','presenceShopLab','paramShopName'];
      for(var i=0;i<ids.length;i++){
        var el = document.getElementById(ids[i]);
        if(el) el.innerText = shop;
      }
    }

    // 4. CHARGEMENT RÉEL DES DONNÉES - C'EST refreshAll() qui fait tout
    // refreshAll() appelle getFiltered() qui fait return ALL_DATA[SHOP]
    // Donc il charge VRAIMENT le stock, ventes, présence de Mbakana/Menkao2
    // Et c'est INSTANTANÉ car ALL_DATA est déjà en mémoire (pas de Firebase, pas de reload)
    if(typeof refreshAll==='function'){
      refreshAll();
      console.log('✅ refreshAll() appelé - données de '+shop+' chargées depuis ALL_DATA['+shop+']');
    }

    // 5. Panier achat spécifique boutique (ton code original de switchShop)
    if(typeof renderAchatStock==='function') renderAchatStock();
    if(typeof renderPanierAchat==='function') renderPanierAchat();

    // 6. Badge abonnement
    if(typeof checkAbonnement==='function'){
      try{ checkAbonnement(shop); }catch(e){}
    }

    // 7. Re-render la liste pour mettre bordure verte sur boutique active
    try{ renderBoutiques(); }catch(e){}

    // Toast confirmation - sans écran blanc
    var dataShop = (window.ALL_DATA && window.ALL_DATA[shop]) ? window.ALL_DATA[shop] : null;
    var nbArt = dataShop && dataShop.stock ? dataShop.stock.length : 0;
    var toast = document.createElement('div');
    toast.innerText = '✅ '+shop+' • '+nbArt+' articles chargés';
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0b5e2f;color:#fff;padding:10px 20px;border-radius:20px;z-index:9999;font-size:12px;box-shadow:0 4px 12px #0003;';
    document.body.appendChild(toast);
    setTimeout(function(){ toast.remove(); }, 1800);

  }catch(err){
    console.error('selectShop V8.13 err', err);
  }
}

function switchShop(){
  var sel = document.getElementById('shopSel');
  if(sel){
    selectShop(sel.value);
  }
}

// --- Fonctions complètes: Renommer, Supprimer, Liens, QR ---

function createShop(){
  var input = document.getElementById('newShop');
  if(!input){ alert('Champ newShop manquant'); return; }
  var n = input.value.trim();
  if(!n){ alert('Nom boutique requis'); return; }
  var shopId = n.trim().replace(/[^a-zA-Z0-9_-]/g,'') || n.trim();
  var pin = localStorage.getItem('BATEKE_PIN') || '7832';
  var db = firebase.database();
  db.ref('shops/'+shopId).once('value').then(function(snap){
    if(snap.exists()){ alert('❌ Boutique "'+shopId+'" existe déjà'); return; }
    return db.ref('shops/'+shopId).set({
      config:{nom:n,id:shopId,created:new Date().toISOString(),owner:pin},
      stock:{}, ventes:{}, depenses:{}, entrees:{}, vendeurs:{}, presence:{},
      abonnement:{expire:Date.now()+30*24*60*60*1000}
    }).then(function(){
      return db.ref('patrons/'+pin+'/boutiques/'+shopId).set({created:Date.now()});
    }).then(function(){
      alert('✅ Boutique créée: '+n+'\nLien vendeur: vendeur.html?shop='+shopId);
      input.value=''; location.reload();
    });
  }).catch(function(e){ alert('Erreur: '+e.message); });
}

function renommerBoutique(oldShop){
  if(!oldShop) return;
  var allData = window.ALL_DATA || {};
  var nbArticles = (allData[oldShop] && allData[oldShop].stock) ? allData[oldShop].stock.length : 0;
  var newShop = prompt('✏️ Renommer "'+oldShop+'" ('+nbArticles+' articles) en:', oldShop);
  if(!newShop || newShop.trim()==='' || newShop===oldShop) return;
  newShop = newShop.trim();
  var conf = prompt('Tape OUI pour confirmer "'+oldShop+'" → "'+newShop+'" ?');
  if(!conf || conf.toLowerCase()!=='oui') return;
  
  var db = firebase.database();
  db.ref('shops/'+newShop).once('value').then(function(ex){
    if(ex.exists()){ alert('❌ "'+newShop+'" existe déjà'); throw new Error('exists'); }
    return db.ref('shops/'+oldShop).once('value');
  }).then(function(snap){
    var data = snap.val();
    if(!data){ alert('Boutique vide'); throw new Error('empty'); }
    data.config = data.config || {};
    data.config.nom = newShop;
    data.config.id = newShop;
    data.config.renamedFrom = oldShop;
    return db.ref('shops/'+newShop).set(data);
  }).then(function(){
    return db.ref('shops/'+oldShop).remove();
  }).then(function(){
    localStorage.setItem('patron_shop', newShop);
    alert('✅ Renommé "'+oldShop+'" → "'+newShop+'" ('+nbArticles+' articles conservés)');
    location.reload();
  }).catch(function(e){ if(e.message!=='exists' && e.message!=='empty') alert('Erreur: '+e.message); });
}

function supprimerBoutique(shop){
  if(!shop) return;
  var shops = window.SHOPS_LIST || [];
  var allData = window.ALL_DATA || {};
  var nb = (allData[shop] && allData[shop].stock) ? allData[shop].stock.length : 0;
  if(shops.length<=1){ alert('❌ Impossible de supprimer la dernière boutique'); return; }
  var conf1 = prompt('⚠️ SUPPRIMER "'+shop+'" ? '+nb+' articles perdus!\nTape OUI:');
  if(!conf1 || conf1.toLowerCase()!=='oui') return;
  var conf2 = prompt('Tape le nom exact: '+shop);
  if(conf2!==shop){ alert('Annulé'); return; }
  firebase.database().ref('shops/'+shop).remove().then(function(){
    alert('✅ Boutique "'+shop+'" supprimée');
    var next = shops.find(function(s){ return s!==shop; }) || shops[0];
    localStorage.setItem('patron_shop', next);
    location.reload();
  }).catch(function(e){ alert('Erreur: '+e.message); });
}

function copyLienShop(shop){
  var origin = location.origin;
  if(origin.indexOf('file')===0) origin = 'https://aiseodon-ai.github.io/bateke';
  var base = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'') + '/';
  base = base.replace(/patron\/$/,'');
  var lien = base + 'vendeur.html?shop=' + encodeURIComponent(shop);
  if(navigator.clipboard){
    navigator.clipboard.writeText(lien).then(function(){ alert('✅ Lien copié:\n'+lien); });
  } else {
    prompt('Copie ce lien:', lien);
  }
}
function copyInput(id){
  var el = document.getElementById(id);
  if(!el) return;
  el.select();
  try{ document.execCommand('copy'); alert('✅ Copié'); }catch(e){ prompt('Copie:', el.value); }
}
function shareWhatsApp(shop){
  var origin = location.origin;
  if(origin.indexOf('file')===0) origin = 'https://aiseodon-ai.github.io/bateke';
  var base = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'') + '/';
  base = base.replace(/patron\/$/,'');
  var lien = base + 'vendeur.html?shop=' + encodeURIComponent(shop);
  window.open('https://wa.me/?text='+encodeURIComponent('🏪 Boutique: '+shop+'\n🔗 Lien vendeur: '+lien),'_blank');
}
function openQR(shop){
  var div = document.getElementById('qr_'+shop);
  if(!div) return;
  if(div.style.display!=='none'){ div.style.display='none'; return; }
  var origin = location.origin;
  if(origin.indexOf('file')===0) origin = 'https://aiseodon-ai.github.io/bateke';
  var base = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'') + '/';
  base = base.replace(/patron\/$/,'');
  var lien = base + 'vendeur.html?shop=' + encodeURIComponent(shop);
  div.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(lien)+'" style="border:8px solid #fff;border-radius:12px"><br><small style="word-break:break-all">'+lien+'</small><br><button class="btn btn-b" style="margin-top:6px" onclick="document.getElementById(\'qr_'+shop+'\').style.display=\'none\'">Fermer</button>';
  div.style.display='block';
}
function copyLien(){
  var el = document.getElementById('lienVendeur') || document.getElementById('lienV');
  if(el){
    if(navigator.clipboard) navigator.clipboard.writeText(el.innerText).then(function(){ alert('✅ Lien copié'); });
    else prompt('Copie:', el.innerText);
  }
}

// Expose global
window.renderBoutiques = renderBoutiques;
window.createShop = createShop;
window.selectShop = selectShop;
window.switchShop = switchShop;
window.renommerBoutique = renommerBoutique;
window.supprimerBoutique = supprimerBoutique;
window.copyLienShop = copyLienShop;
window.copyInput = copyInput;
window.shareWhatsApp = shareWhatsApp;
window.openQR = openQR;
window.copyLien = copyLien;

console.log('✅ boutiques.js V8.13 FINAL - MULTIBOUTIQUE RÉEL INSTANTANÉ SANS ECRAN BLANC - basé sur pantron.txt');
