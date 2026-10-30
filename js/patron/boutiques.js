// js/patron/boutiques.js - V8.14 FIX FINAL - CHANGE NOM + VRAIES DONNÉES - SANS ECRAN BLANC
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
    if(shops.length===0) return;

    var html = '';
    for(var i=0;i<shops.length;i++){
      var shop = shops[i];
      var nb = (allData[shop] && allData[shop].stock) ? allData[shop].stock.length : 0;
      var isActive = (shop === (window.SHOP || window.SHOP_GLOBAL || localStorage.getItem('patron_shop'))) ? 'border:2px solid #0b5e2f;background:#f0fdf4' : 'border:1px solid #eee';
      html += '<div style="display:flex;justify-content:space-between;padding:10px;'+isActive+';border-radius:10px;margin-bottom:6px;align-items:center">'
        + '<div style="flex:1"><b>🏪 '+shop+'</b><br><small>'+nb+' articles</small></div>'
        + '<div style="display:flex;gap:4px"><button class="btn btn-b" style="width:auto;padding:6px 8px;font-size:10px" onclick="selectShop(\''+shop+'\')">Ouvrir</button>'
        + '<button class="btn" style="width:auto;padding:6px 8px;font-size:10px;background:#f59e0b" onclick="renommerBoutique(\''+shop+'\')">✏️</button>'
        + '<button class="btn btn-r" style="width:auto;padding:6px 8px;font-size:10px" onclick="supprimerBoutique(\''+shop+'\')">🗑️</button></div></div>';
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
          + '<b>🏪 '+s+'</b> <small>'+nbStock+'/'+nbVentes+'</small><br>'
          + '<div style="display:flex;gap:4px;margin-top:6px"><input value="'+lien2+'" id="inputLien_'+s+'" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:6px;border-radius:6px"><button class="btn btn-b" style="width:auto;font-size:10px" onclick="copyInput(\'inputLien_'+s+'\')">Copier</button></div>'
          + '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap"><button class="btn btn-g" style="width:auto;font-size:10px" onclick="shareWhatsApp(\''+s+'\')">WhatsApp</button><button class="btn" style="width:auto;font-size:10px;background:#f59e0b" onclick="renommerBoutique(\''+s+'\')">Renommer</button><button class="btn" style="width:auto;font-size:10px;background:#111;color:#fff" onclick="openQR(\''+s+'\')">QR</button><button class="btn btn-r" style="width:auto;font-size:10px" onclick="supprimerBoutique(\''+s+'\')">Supprimer</button></div><div id="qr_'+s+'" style="display:none;margin-top:10px;text-align:center"></div></div>';
      }
      elLinks.innerHTML = htmlLinks;
    }

    if(elSel){
      var current = window.SHOP || localStorage.getItem('patron_shop') || shops[0];
      try{ current = (typeof SHOP !== 'undefined' ? SHOP : current); }catch(e){}
      var opt = '';
      for(var k=0;k<shops.length;k++) opt += '<option value="'+shops[k]+'" '+(shops[k]==current?'selected':'')+'>'+shops[k]+'</option>';
      opt += '<option value="ALL" '+(current==='ALL'?'selected':'')+'>TOUTES</option>';
      elSel.innerHTML = opt;
    }
  }catch(e){ console.log(e); }
}

// V8.14 - LE VRAI FIX: ON MET À JOUR LES 2 VARIABLES SHOP
function selectShop(shop){
  if(!shop) return;
  console.log('🔄 V8.14 FIX: '+ (typeof SHOP !== 'undefined' ? SHOP : window.SHOP) +' → '+shop);

  // 1. CE QUI MANQUAIT AVANT: mettre à jour SHOP (sans window) ET window.SHOP
  // Ton getFiltered() lit SHOP, pas window.SHOP
  try{ SHOP = shop; }catch(e){} // Si SHOP existe en global var
  try{ window.SHOP = shop; }catch(e){}
  try{ window.SHOP_GLOBAL = shop; }catch(e){}
  
  // Force même si SHOP est en let dans un autre fichier, on le force via window
  // On écrase aussi la variable globale via eval dans le contexte window
  try{ eval('var SHOP = "'+shop+'";'); }catch(e){}
  try{ window.eval('SHOP = "'+shop+'";'); }catch(e){}

  localStorage.setItem('patron_shop', shop);
  localStorage.setItem('BATEKE_SHOP', shop);
  sessionStorage.setItem('BATEKE_BOUTIQUE', shop);

  if(!window.SHOPS_LIST || window.SHOPS_LIST.length===0) return;

  // 2. Panier spécifique boutique (comme ton code original)
  try{
    window.PANIER_ACHAT = JSON.parse(localStorage.getItem('panier_achat_'+shop)||'[]');
    if(typeof PANIER_ACHAT !== 'undefined') PANIER_ACHAT = window.PANIER_ACHAT;
  }catch(e){ window.PANIER_ACHAT = []; }

  // 3. Labels instantanés
  try{
    if(typeof updateLabels==='function'){
      updateLabels(); // Cette fonction lit SHOP et met à jour labVenteShop, presenceShopLab, etc.
    }
  }catch(e){ console.log('updateLabels err', e); }

  // 4. CHARGEMENT RÉEL DES DONNÉES - C'EST ICI LE FIX
  // Maintenant que SHOP = Mbakana, getFiltered() va retourner ALL_DATA['Mbakana']
  try{
    console.log('ALL_DATA['+shop+'] stock:', (window.ALL_DATA && window.ALL_DATA[shop] && window.ALL_DATA[shop].stock) ? window.ALL_DATA[shop].stock.length : 'vide');
    
    if(typeof refreshAll==='function'){
      refreshAll(); // Ton refreshAll() fait: updateKPIs() + renderVentes() + renderStock() + renderPresenceKPI() + etc.
      console.log('✅ refreshAll() avec SHOP='+shop+' - données réelles chargées');
    } else {
      // Fallback si refreshAll n'existe pas sous ce nom
      var funcs = ['updateKPIs','renderVentes','renderStock','renderPresenceKPI','renderCaisse','renderCRM','renderDettes','renderEntrees','renderDepenses','renderAchatStock','renderPanierAchat'];
      for(var i=0;i<funcs.length;i++){
        if(typeof window[funcs[i]]==='function'){
          try{ window[funcs[i]](); console.log('→ '+funcs[i]+'() OK'); }catch(e){}
        }
      }
    }
  }catch(e){ console.error('refresh err', e); }

  // 5. Re-render liste boutiques (bordure verte)
  try{ renderBoutiques(); }catch(e){}

  // Toast
  var d = window.ALL_DATA && window.ALL_DATA[shop] ? window.ALL_DATA[shop] : null;
  var nb = d && d.stock ? d.stock.length : 0;
  var toast = document.createElement('div');
  toast.innerText = '✅ '+shop+' • '+nb+' art. chargés';
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0b5e2f;color:#fff;padding:10px 20px;border-radius:20px;z-index:9999;font-size:12px;';
  document.body.appendChild(toast);
  setTimeout(function(){ toast.remove(); }, 1800);
}

function switchShop(){ var sel=document.getElementById('shopSel'); if(sel) selectShop(sel.value); }

// Annexes
function createShop(){
  var input=document.getElementById('newShop'); if(!input) return;
  var n=input.value.trim(); if(!n) return;
  var shopId=n.trim().replace(/[^a-zA-Z0-9_-]/g,'') || n.trim();
  var pin=localStorage.getItem('BATEKE_PIN')||'7832';
  var db=firebase.database();
  db.ref('shops/'+shopId).once('value').then(function(snap){
    if(snap.exists()){ alert('Existe déjà'); return; }
    return db.ref('shops/'+shopId).set({config:{nom:n,id:shopId,created:new Date().toISOString(),owner:pin},stock:{},ventes:{},abonnement:{expire:Date.now()+30*86400000}}).then(function(){ alert('✅ Créée: '+n); location.reload(); });
  });
}
function renommerBoutique(oldShop){
  if(!oldShop) return;
  var newShop=prompt('Renommer "'+oldShop+'" en:', oldShop);
  if(!newShop||newShop===oldShop) return;
  newShop=newShop.trim();
  if(!confirm('Confirmer "'+oldShop+'" → "'+newShop+'" ?')) return;
  var db=firebase.database();
  db.ref('shops/'+oldShop).once('value').then(function(snap){
    var data=snap.val(); if(!data) return;
    data.config.nom=newShop; data.config.id=newShop;
    return db.ref('shops/'+newShop).set(data).then(function(){ return db.ref('shops/'+oldShop).remove(); }).then(function(){ localStorage.setItem('patron_shop', newShop); alert('✅ Renommé'); location.reload(); });
  });
}
function supprimerBoutique(shop){
  if(!shop) return;
  if((window.SHOPS_LIST||[]).length<=1){ alert('Dernière boutique'); return; }
  var c=prompt('Tape OUI pour supprimer "'+shop+'":');
  if(!c||c.toLowerCase()!=='oui') return;
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
console.log('✅ V8.14 FIX - SHOP + window.SHOP mis à jour - données réelles chargées sans écran blanc');
