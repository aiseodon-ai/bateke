// js/patron/boutiques.js - V8.8 STABLE COMPLET - LISTE + LIEN + SUPPRIMER + RENOMMER + SELECTEUR QUI MARCHE
// Compatible monolithe - pas de export

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
    var basePath = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*|\/patron\.html.*/,'') + '';
    if(basePath.charAt(basePath.length-1) !== '/') basePath += '/';
    // Nettoie double patron
    basePath = basePath.replace(/patron\/$/,'');
    var baseVendeur = basePath + 'vendeur.html';

    if(shops.length === 0){
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
        + '<button class="btn" style="width:auto;padding:6px 8px;font-size:10px;background:#f59e0b;color:#000" onclick="renommerBoutique(\''+shop+'\')">✏️</button>'
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
          + '<div style="margin-top:8px">'
          + '<label style="font-size:10px;font-weight:bold;color:#64748b">LIEN VENDEUR À ENVOYER:</label>'
          + '<div style="display:flex;gap:4px;margin-top:4px"><input value="'+lien2+'" id="inputLien_'+s+'" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:8px;border-radius:8px"><button class="btn btn-b" style="width:auto" onclick="copyInput(\'inputLien_'+s+'\')">Copier</button></div>'
          + '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">'
          + '<button class="btn btn-y" style="width:auto;font-size:10px;padding:6px 10px" onclick="copyLienShop(\''+s+'\')">📋 Copier</button>'
          + '<button class="btn btn-g" style="width:auto;font-size:10px;padding:6px 10px" onclick="shareWhatsApp(\''+s+'\')">📲 WhatsApp</button>'
          + '<button class="btn" style="width:auto;font-size:10px;padding:6px 10px;background:#f59e0b" onclick="renommerBoutique(\''+s+'\')">✏️ Renommer</button>'
          + '<button class="btn" style="width:auto;font-size:10px;padding:6px 10px;background:#111;color:#fff" onclick="openQR(\''+s+'\')">📷 QR</button>'
          + '<button class="btn btn-r" style="width:auto;font-size:10px;padding:6px 10px" onclick="supprimerBoutique(\''+s+'\')">🗑️ Supprimer</button>'
          + '</div><div id="qr_'+s+'" style="display:none;margin-top:10px;text-align:center"></div>'
          + '</div></div>';
      }
      elLinks.innerHTML = htmlLinks;
    }

    if(elSel && shops.length > 0){
      var current = elSel.value || window.SHOP || localStorage.getItem('patron_shop') || shops[0];
      var opt = '';
      for(var k=0;k<shops.length;k++) opt += '<option value="'+shops[k]+'" '+(shops[k]==current?'selected':'')+'>'+shops[k]+'</option>';
      opt += '<option value="ALL" '+(current==='ALL'?'selected':'')+'>TOUTES</option>';
      elSel.innerHTML = opt;
    }
    console.log("✅ renderBoutiques V8.8 complet OK");
  }catch(e){ console.error('renderBoutiques err', e); }
}

// FIX SELECTEUR V8.8 - QUI MARCHE + QUI ACTUALISE
function selectShop(shop){
  if(!shop) return;
  console.log('🔄 Boutique -> '+shop);
  
  // Si on est sur écran login (SHOPS_LIST vide), on sauve seulement
  var isLogin = !window.SHOPS_LIST || window.SHOPS_LIST.length===0;
  
  window.SHOP = shop;
  localStorage.setItem('patron_shop', shop);
  localStorage.setItem('BATEKE_SHOP', shop);
  localStorage.setItem('BATEKE_BOUTIQUE', shop);
  sessionStorage.setItem('BATEKE_BOUTIQUE', shop);
  sessionStorage.setItem('SHOP', shop);
  
  // Badge abonnement (si déjà connecté)
  if(typeof checkAbonnement==='function' && !isLogin){
    try{ checkAbonnement(shop); }catch(e){}
  }

  // Si login, on ne recharge pas
  if(isLogin){
    return;
  }

  // Si déjà connecté: reload pour actualiser toutes les données (Ventes, Stock, Présence)
  // C'est la méthode monolithe V4.9 - 100% stable
  location.reload();
}

function switchShop(){
  var sel = document.getElementById('shopSel');
  if(sel) selectShop(sel.value);
}

function createShop(){
  var input = document.getElementById('newShop');
  if(!input){ alert('Champ #newShop introuvable'); return; }
  var n = input.value.trim();
  if(!n){ alert('Nom boutique requis'); return; }
  var shopId = n.trim();
  var pin = localStorage.getItem('BATEKE_PIN') || localStorage.getItem('pin') || '7832';
  var db = firebase.database();
  db.ref('shops/'+shopId).once('value').then(function(snap){
    if(snap.exists()){ alert('❌ Boutique "'+shopId+'" existe déjà'); return; }
    return db.ref('shops/'+shopId).set({
      config:{nom:n,id:shopId,created:new Date().toISOString(),owner:pin},
      stock:{}, ventes:{}, depenses:{}, entrees:{}, vendeurs:{}, presence:{},
      abonnement:{expire: Date.now()+30*24*60*60*1000}
    }).then(function(){
      return db.ref('patrons/'+pin+'/boutiques/'+shopId).set({created:Date.now()});
    }).then(function(){
      alert('✅ Boutique créée: '+n+'\n\nLien vendeur:\n'+location.origin+'/vendeur.html?shop='+shopId);
      input.value='';
      location.reload();
    });
  }).catch(function(e){ alert('Erreur: '+e.message); });
}

function renommerBoutique(oldShop){
  if(!oldShop) return;
  var allData = window.ALL_DATA || {};
  var nbArticles = (allData[oldShop] && allData[oldShop].stock) ? allData[oldShop].stock.length : 0;
  var nbVentes = (allData[oldShop] && allData[oldShop].ventes) ? allData[oldShop].ventes.length : 0;
  
  var newShop = prompt('✏️ RENOMMER BOUTIQUE "'+oldShop+'"\n\n📦 '+nbArticles+' articles et '+nbVentes+' ventes seront déplacés.\n\nNouveau nom:', oldShop);
  if(!newShop) return;
  newShop = newShop.trim();
  if(!newShop || newShop===oldShop){ alert('Annulé'); return; }

  var conf = prompt('Confirme renommage:\n"'+oldShop+'" → "'+newShop+'"\n\nTape OUI pour confirmer:');
  if(!conf || conf.toLowerCase()!=='oui') return;

  var db = firebase.database();
  db.ref('shops/'+newShop).once('value').then(function(ex){
    if(ex.exists()){ alert('❌ "'+newShop+'" existe déjà'); throw new Error('exists'); }
    return db.ref('shops/'+oldShop).once('value');
  }).then(function(snap){
    var data = snap.val();
    if(!data){ alert('Boutique source vide'); throw new Error('empty'); }
    data.config = data.config || {};
    data.config.nom = newShop;
    data.config.id = newShop;
    data.config.renamedFrom = oldShop;
    data.config.renamedAt = new Date().toISOString();
    return db.ref('shops/'+newShop).set(data);
  }).then(function(){
    return db.ref('patrons').once('value');
  }).then(function(pAll){
    var promises=[];
    pAll.forEach(function(child){
      var v = child.val()||{};
      if(v.boutiques && v.boutiques[oldShop]!==undefined){
        promises.push(firebase.database().ref('patrons/'+child.key+'/boutiques/'+newShop).set(v.boutiques[oldShop]));
        promises.push(firebase.database().ref('patrons/'+child.key+'/boutiques/'+oldShop).remove());
      }
      if(v.boutique===oldShop){
        promises.push(firebase.database().ref('patrons/'+child.key+'/boutique').set(newShop));
      }
    });
    return Promise.all(promises);
  }).then(function(){
    return db.ref('shops/'+oldShop).remove();
  }).then(function(){
    localStorage.removeItem('patron_cache_'+oldShop);
    localStorage.setItem('patron_shop', newShop);
    alert('✅ RENOMMÉ\n"'+oldShop+'" → "'+newShop+'"\n\n📦 '+nbArticles+' articles conservés');
    location.reload();
  }).catch(function(e){ if(e.message!=='exists' && e.message!=='empty') alert('Erreur: '+e.message); });
}

function supprimerBoutique(shop){
  if(!shop) return;
  var shops = window.SHOPS_LIST || [];
  var allData = window.ALL_DATA || {};
  var nb = (allData[shop] && allData[shop].stock) ? allData[shop].stock.length : 0;
  if(shops.length<=1){ alert('❌ Impossible de supprimer la dernière boutique.\nCrée d\'abord une nouvelle.'); return; }
  var conf1 = prompt('⚠️ SUPPRIMER "'+shop+'" ?\n'+nb+' articles seront perdus!\nTape OUI:');
  if(!conf1 || conf1.toLowerCase()!=='oui') return;
  var conf2 = prompt('🚨 DERNIERE CONFIRMATION\nTape le nom exact: '+shop);
  if(conf2!==shop){ alert('❌ Nom incorrect - annulé'); return; }
  var db = firebase.database();
  db.ref('shops/'+shop).remove().then(function(){
    return db.ref('patrons').once('value');
  }).then(function(pAll){
    var promises=[];
    pAll.forEach(function(child){
      promises.push(firebase.database().ref('patrons/'+child.key+'/boutiques/'+shop).remove());
      if(child.val() && child.val().boutique===shop) promises.push(firebase.database().ref('patrons/'+child.key+'/boutique').remove());
    });
    return Promise.all(promises);
  }).then(function(){
    localStorage.removeItem('patron_cache_'+shop);
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
  var el=document.getElementById(id);
  if(!el) return;
  el.select();
  try{ document.execCommand('copy'); alert('✅ Copié: '+el.value); }catch(e){ prompt('Copie:', el.value); }
}
function shareWhatsApp(shop){
  var origin = location.origin;
  if(origin.indexOf('file')===0) origin = 'https://aiseodon-ai.github.io/bateke';
  var base = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'') + '/';
  base = base.replace(/patron\/$/,'');
  var lien = base + 'vendeur.html?shop=' + encodeURIComponent(shop);
  var text = '🏪 Boutique: '+shop+'\n🔗 Lien vendeur: '+lien+'\n\nPIN vendeur: demande au patron';
  window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
}
function openQR(shop){
  var div=document.getElementById('qr_'+shop);
  if(!div) return;
  if(div.style.display!=='none'){ div.style.display='none'; return; }
  var origin = location.origin;
  if(origin.indexOf('file')===0) origin = 'https://aiseodon-ai.github.io/bateke';
  var base = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'') + '/';
  base = base.replace(/patron\/$/,'');
  var lien = base + 'vendeur.html?shop=' + encodeURIComponent(shop);
  div.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(lien)+'" style="border:8px solid #fff;border-radius:12px;box-shadow:0 4px 12px #0002"><br><small style="word-break:break-all">'+lien+'</small><br><button class="btn btn-b" style="margin-top:6px" onclick="document.getElementById(\'qr_'+shop+'\').style.display=\'none\'">Fermer</button>';
  div.style.display='block';
}
function copyLien(){
  var el=document.getElementById('lienVendeur');
  if(!el) return;
  if(navigator.clipboard) navigator.clipboard.writeText(el.innerText).then(function(){ alert('✅ Lien copié'); });
}

// Expose global - comme monolithe
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

console.log("✅ boutiques.js V8.8 COMPLET - login OK + liste + liens + renommer + supprimer");
