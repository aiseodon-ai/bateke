// js/patron/boutiques.js - V8.7 STABLE - FIX SELECTEUR SANS CASSER LOGIN
// Version monolithe originale + lien vendeur + supprimer + renommer

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
    basePath = basePath.replace('//vendeur','/').replace('//','/').replace('https:/','https://');
    var baseVendeur = basePath + 'vendeur.html';
    if(baseVendeur.indexOf('patron')>-1) baseVendeur = baseVendeur.replace(/patron\/.*/, 'vendeur.html');

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
        + '<div style="flex:1"><b>🏪 '+shop+'</b><br><small>'+nb+' articles</small></div>'
        + '<div style="display:flex;gap:4px">'
        + '<button class="btn btn-b" style="width:auto;padding:6px 10px" onclick="selectShop(\''+shop+'\')">Ouvrir</button>'
        + '<button class="btn" style="width:auto;padding:6px 8px;background:#f59e0b" onclick="renommerBoutique(\''+shop+'\')">✏️</button>'
        + '<button class="btn btn-r" style="width:auto;padding:6px 8px" onclick="supprimerBoutique(\''+shop+'\')">🗑️</button>'
        + '</div></div>';
    }
    elList.innerHTML = html;

    if(elLinks){
      var htmlLinks = '';
      for(var j=0;j<shops.length;j++){
        var s = shops[j];
        var lien2 = baseVendeur + '?shop=' + encodeURIComponent(s);
        htmlLinks += '<div style="padding:10px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:#fff">'
          + '<b>🏪 '+s+'</b><br>'
          + '<div style="display:flex;gap:4px;margin-top:4px"><input value="'+lien2+'" id="inputLien_'+s+'" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:6px;border-radius:6px"><button class="btn btn-b" style="width:auto" onclick="copyInput(\'inputLien_'+s+'\')">Copier</button></div>'
          + '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">'
          + '<button class="btn btn-g" style="width:auto;font-size:10px" onclick="shareWhatsApp(\''+s+'\')">📲 WhatsApp</button>'
          + '<button class="btn btn-r" style="width:auto;font-size:10px" onclick="supprimerBoutique(\''+s+'\')">🗑️ Supprimer</button>'
          + '</div></div>';
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

  }catch(e){ console.log('renderBoutiques err', e); }
}

// FIX PRINCIPAL V8.7 - SELECTEUR QUI ACTUALISE SANS CASSER LOGIN
function selectShop(shop){
  if(!shop) return;
  console.log('🔄 Boutique -> '+shop);
  
  // Ne pas faire si on est sur l'écran de login (pas de SHOP_LIST encore)
  var isLogin = !window.SHOPS_LIST || window.SHOPS_LIST.length===0;
  
  window.SHOP = shop;
  localStorage.setItem('patron_shop', shop);
  localStorage.setItem('BATEKE_SHOP', shop);
  sessionStorage.setItem('BATEKE_BOUTIQUE', shop);
  
  // Si on est encore au login, on s'arrête là - ne pas appeler initShops
  if(isLogin && shop!=='ALL'){
    console.log('Login - on sauve seulement la boutique');
    return;
  }

  // Si on est déjà connecté, on recharge les données de la boutique
  // Méthode simple et qui ne casse rien: reload page - 100% stable comme ton monolithe
  if(shop !== 'ALL'){
    location.reload();
  } else {
    // Mode TOUTES - on reste et on refresh
    if(typeof refreshAll==='function'){
      try{ refreshAll(); }catch(e){ location.reload(); }
    } else {
      location.reload();
    }
  }
}

function switchShop(){
  var sel = document.getElementById('shopSel');
  if(sel) selectShop(sel.value);
}

function copyInput(id){
  var el=document.getElementById(id);
  if(!el) return;
  el.select();
  document.execCommand('copy');
  alert('✅ Copié: '+el.value);
}

function shareWhatsApp(shop){
  var origin = location.origin;
  if(origin.indexOf('file')===0) origin = 'https://aiseodon-ai.github.io/bateke';
  var basePath = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'') + '/';
  var lien = basePath + 'vendeur.html?shop=' + encodeURIComponent(shop);
  window.open('https://wa.me/?text='+encodeURIComponent('🏪 Boutique: '+shop+'\n🔗 Lien: '+lien),'_blank');
}

function createShop(){
  var input = document.getElementById('newShop');
  if(!input){ alert('Champ manquant'); return; }
  var n = input.value.trim();
  if(!n){ alert('Nom requis'); return; }
  var shopId = n.trim();
  var pin = localStorage.getItem('BATEKE_PIN') || '7832';
  var db = firebase.database();
  db.ref('shops/'+shopId).once('value').then(function(snap){
    if(snap.exists()){ alert('Existe déjà'); return; }
    return db.ref('shops/'+shopId).set({
      config:{nom:n,id:shopId,created:new Date().toISOString(),owner:pin},
      stock:{}, ventes:{}, depenses:{}, entrees:{}, vendeurs:{},
      abonnement:{expire: Date.now()+30*24*60*60*1000}
    }).then(function(){
      return db.ref('patrons/'+pin+'/boutiques/'+shopId).set({created:Date.now()});
    }).then(function(){
      alert('✅ Boutique créée: '+n);
      input.value='';
      location.reload();
    });
  }).catch(function(e){ alert(e.message); });
}

function renommerBoutique(oldShop){
  if(!oldShop) return;
  var newShop = prompt('✏️ Renommer "'+oldShop+'" en:', oldShop);
  if(!newShop || newShop.trim()==='' || newShop===oldShop) return;
  newShop = newShop.trim();
  if(!confirm('Confirmer renommage:\n"'+oldShop+'" → "'+newShop+'" ?\n\nTout le stock sera déplacé.')) return;
  
  var db = firebase.database();
  db.ref('shops/'+oldShop).once('value').then(function(snap){
    var data = snap.val();
    if(!data){ alert('Boutique vide'); return; }
    data.config = data.config || {};
    data.config.nom = newShop;
    data.config.id = newShop;
    return db.ref('shops/'+newShop).set(data);
  }).then(function(){
    return db.ref('shops/'+oldShop).remove();
  }).then(function(){
    return db.ref('patrons').once('value');
  }).then(function(pAll){
    var promises=[];
    pAll.forEach(function(child){
      if(child.val().boutiques && child.val().boutiques[oldShop]){
        promises.push(firebase.database().ref('patrons/'+child.key+'/boutiques/'+newShop).set(child.val().boutiques[oldShop]));
        promises.push(firebase.database().ref('patrons/'+child.key+'/boutiques/'+oldShop).remove());
      }
    });
    return Promise.all(promises);
  }).then(function(){
    alert('✅ Renommé: '+oldShop+' → '+newShop);
    localStorage.setItem('patron_shop', newShop);
    location.reload();
  }).catch(function(e){ alert('Erreur: '+e.message); });
}

function supprimerBoutique(shop){
  if(!shop) return;
  var shops = window.SHOPS_LIST || [];
  if(shops.length<=1){ alert('Impossible de supprimer la dernière boutique'); return; }
  var conf = prompt('⚠️ SUPPRIMER "'+shop+'" ? Tape OUI pour confirmer:');
  if(!conf || conf.toLowerCase()!=='oui') return;
  var conf2 = prompt('Dernière confirmation - Tape le nom exact: '+shop);
  if(conf2!==shop){ alert('Annulé'); return; }
  var db = firebase.database();
  db.ref('shops/'+shop).remove().then(function(){
    alert('✅ Boutique "'+shop+'" supprimée');
    location.reload();
  }).catch(function(e){ alert(e.message); });
}

function copyLien(){ var el=document.getElementById('lienVendeur'); if(el) { navigator.clipboard.writeText(el.innerText); alert('✅ Copié'); } }
function copyLienShop(shop){ var origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke'; var lien=origin+'/vendeur.html?shop='+encodeURIComponent(shop); navigator.clipboard.writeText(lien).then(function(){ alert('✅ Lien copié: '+lien); }); }
