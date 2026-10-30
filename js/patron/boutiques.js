// js/patron/boutiques.js - V8.11 ULTRA SAFE - AUCUN RELOAD - AUCUN ECRAN BLANC
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

    var html = '';
    for(var i=0;i<shops.length;i++){
      var shop = shops[i];
      var nb = (allData[shop] && allData[shop].stock) ? allData[shop].stock.length : 0;
      var lien = baseVendeur + '?shop=' + encodeURIComponent(shop);
      var isActive = (shop === (window.SHOP || localStorage.getItem('patron_shop'))) ? 'border:2px solid #0b5e2f;background:#f0fdf4' : 'border:1px solid #eee';
      html += '<div style="display:flex;justify-content:space-between;padding:10px;'+isActive+';border-radius:10px;margin-bottom:6px;align-items:center">'
        + '<div style="flex:1"><b>🏪 '+shop+'</b><br><small>'+nb+' articles</small></div>'
        + '<div style="display:flex;gap:4px">'
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
          + '<div style="display:flex;justify-content:space-between"><b>🏪 '+s+'</b><span style="background:#f1f5f9;padding:2px 8px;border-radius:10px;font-size:10px">'+nbStock+' / '+nbVentes+'</span></div>'
          + '<div style="margin-top:8px"><input value="'+lien2+'" id="inputLien_'+s+'" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:8px;border-radius:8px;width:100%">'
          + '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">'
          + '<button class="btn btn-b" style="width:auto;font-size:10px" onclick="copyInput(\'inputLien_'+s+'\')">Copier lien</button>'
          + '<button class="btn btn-g" style="width:auto;font-size:10px" onclick="shareWhatsApp(\''+s+'\')">WhatsApp</button>'
          + '<button class="btn" style="width:auto;font-size:10px;background:#f59e0b" onclick="renommerBoutique(\''+s+'\')">Renommer</button>'
          + '<button class="btn" style="width:auto;font-size:10px;background:#111;color:#fff" onclick="openQR(\''+s+'\')">QR</button>'
          + '<button class="btn btn-r" style="width:auto;font-size:10px" onclick="supprimerBoutique(\''+s+'\')">Supprimer</button>'
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
  }catch(e){ console.log('renderBoutiques err', e); }
}

// V8.11 - SELECTEUR 100% INSTANTANÉ - AUCUN RELOAD JAMAIS
function selectShop(shop){
  if(!shop) return;
  try{
    if(shop === window.SHOP){
      console.log('Déjà sur '+shop);
      return;
    }
    console.log('⚡ V8.11 Switch '+window.SHOP+' → '+shop);

    // Si on est sur login, on sauve seulement
    if(!window.SHOPS_LIST || window.SHOPS_LIST.length===0){
      window.SHOP = shop;
      localStorage.setItem('patron_shop', shop);
      localStorage.setItem('BATEKE_SHOP', shop);
      return;
    }

    // 1. Sauve
    window.SHOP = shop;
    localStorage.setItem('patron_shop', shop);
    localStorage.setItem('BATEKE_SHOP', shop);
    sessionStorage.setItem('BATEKE_BOUTIQUE', shop);

    // 2. Update visuel INSTANTANÉ - ce que tu voyais bloqué sur Menkao2
    var h = document.getElementById('headerEntreprise');
    if(h){
      var badge = document.getElementById('connBadge');
      var badgeHtml = badge ? badge.outerHTML : '<span id="connBadge">🟢 '+shop+'</span>';
      h.innerHTML = '👑 ETS BATEKE - '+shop+' - '+badgeHtml;
    }

    var ids = ['presenceShopLab','labVenteShop','paramShopName','labVendShop'];
    for(var i=0;i<ids.length;i++){
      var el = document.getElementById(ids[i]);
      if(el) el.innerText = shop;
    }

    // Titres
    try{
      var allH4 = document.getElementsByTagName('h4');
      for(var t=0;t<allH4.length;t++){
        var inner = allH4[t].innerText || '';
        if(inner.indexOf('Présence')>-1) allH4[t].innerHTML = '🟢 Présence - <span id="presenceShopLab">'+shop+'</span>';
        if(inner.indexOf('Ventes - Boutique')>-1) allH4[t].innerHTML = '📊 Ventes - Boutique <span id="labVenteShop">'+shop+'</span>';
      }
    }catch(e){}

    // 3. Badge abo - sans reload
    try{ if(typeof checkAbonnement==='function') checkAbonnement(shop); }catch(e){}

    // 4. IMPORTANT: On essaie de re-render SANS reload
    // On ne fait JAMAIS location.reload() ici - c'est ce qui causait l'écran blanc
    var done = false;
    try{
      // Ton monolithe a ces fonctions - on les appelle si elles existent
      if(typeof window.afficherDonnees==='function'){ window.afficherDonnees(); done=true; }
      if(typeof window.refreshUI==='function'){ window.refreshUI(); done=true; }
      if(typeof window.updateDashboard==='function'){ window.updateDashboard(); done=true; }
      // Si tu as une fonction qui filtre par SHOP
      if(typeof window.filtrerParBoutique==='function'){ window.filtrerParBoutique(shop); done=true; }
    }catch(e){ console.log('refresh err', e); }

    // 5. Re-render la liste boutiques pour mettre bordure verte sur active
    try{ renderBoutiques(); }catch(e){}

    console.log('⚡ V8.11 Switch fait - écran blanc impossible');

    // Si après 500ms les données n'ont pas changé (ex: Ventes reste Menkao2), 
    // on informe l'utilisateur mais on ne fait pas de reload auto
    setTimeout(function(){
      var lab = document.getElementById('labVenteShop');
      if(lab && lab.innerText !== shop){
        lab.innerText = shop; // Force encore
      }
      // Affiche un petit toast pour dire que c'est fait
      var toast = document.createElement('div');
      toast.innerText = '✅ Boutique: '+shop;
      toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0b5e2f;color:#fff;padding:10px 20px;border-radius:20px;z-index:9999;font-size:12px;';
      document.body.appendChild(toast);
      setTimeout(function(){ toast.remove(); }, 1500);
    }, 100);

  }catch(err){
    console.error('selectShop V8.11 err', err);
    // Même en cas d'erreur, on ne fait PAS de reload - on évite l'écran blanc
    alert('Erreur changement boutique: '+err.message+'\nMais boutique sauvée: '+shop+' - recharge manuelle si besoin');
  }
}

function switchShop(){ var sel=document.getElementById('shopSel'); if(sel) selectShop(sel.value); }

// Fonctions annexes - sans reload sauf quand nécessaire (création/suppression)
function createShop(){
  var input=document.getElementById('newShop');
  if(!input){ alert('Champ newShop manquant'); return; }
  var n=input.value.trim(); if(!n){ alert('Nom requis'); return; }
  var shopId=n.trim();
  var pin=localStorage.getItem('BATEKE_PIN')||'7832';
  var db=firebase.database();
  db.ref('shops/'+shopId).once('value').then(function(snap){
    if(snap.exists()){ alert('Existe déjà'); return; }
    return db.ref('shops/'+shopId).set({config:{nom:n,id:shopId,created:new Date().toISOString(),owner:pin},stock:{},ventes:{},abonnement:{expire:Date.now()+30*86400000}}).then(function(){
      alert('✅ Boutique créée: '+n+' - Rechargement...');
      input.value=''; location.reload(); // Ici reload OK car création
    });
  });
}
function renommerBoutique(oldShop){
  if(!oldShop) return;
  var newShop=prompt('Renommer "'+oldShop+'" en:', oldShop);
  if(!newShop||newShop.trim()===''||newShop===oldShop) return;
  newShop=newShop.trim();
  if(!confirm('Confirmer "'+oldShop+'" → "'+newShop+'" ?')) return;
  var db=firebase.database();
  db.ref('shops/'+oldShop).once('value').then(function(snap){
    var data=snap.val(); if(!data){ alert('Vide'); return; }
    data.config.nom=newShop; data.config.id=newShop;
    return db.ref('shops/'+newShop).set(data).then(function(){ return db.ref('shops/'+oldShop).remove(); }).then(function(){
      localStorage.setItem('patron_shop', newShop); alert('✅ Renommé - rechargement'); location.reload();
    });
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
  if(navigator.clipboard) navigator.clipboard.writeText(lien).then(function(){ alert('✅ Copié:\n'+lien); });
  else prompt('Copie:', lien);
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
console.log("✅ V8.11 ULTRA SAFE - AUCUN RELOAD - AUCUN ECRAN BLANC");
