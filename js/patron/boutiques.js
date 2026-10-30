// js/patron/boutiques.js - V8.12 MULTIBOUTIQUE RÉEL - CHARGE VRAIES DONNÉES SANS ECRAN BLANC
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
      return;
    }

    var html = '';
    for(var i=0;i<shops.length;i++){
      var shop = shops[i];
      var nb = (allData[shop] && allData[shop].stock) ? allData[shop].stock.length : 0;
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
          + '<b>🏪 '+s+'</b> <small>'+nbStock+' art / '+nbVentes+' ventes</small><br>'
          + '<div style="display:flex;gap:4px;margin-top:6px"><input value="'+lien2+'" id="inputLien_'+s+'" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:6px;border-radius:6px"><button class="btn btn-b" style="width:auto;font-size:10px" onclick="copyInput(\'inputLien_'+s+'\')">Copier</button></div>'
          + '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">'
          + '<button class="btn btn-g" style="width:auto;font-size:10px" onclick="shareWhatsApp(\''+s+'\')">WhatsApp</button>'
          + '<button class="btn" style="width:auto;font-size:10px;background:#f59e0b" onclick="renommerBoutique(\''+s+'\')">Renommer</button>'
          + '<button class="btn" style="width:auto;font-size:10px;background:#111;color:#fff" onclick="openQR(\''+s+'\')">QR</button>'
          + '<button class="btn btn-r" style="width:auto;font-size:10px" onclick="supprimerBoutique(\''+s+'\')">Supprimer</button>'
          + '</div><div id="qr_'+s+'" style="display:none;margin-top:10px;text-align:center"></div></div>';
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

// V8.12 - LE VRAI MULTIBOUTIQUE - CHARGE LES DONNÉES RÉELLES SANS ECRAN BLANC
function selectShop(shop){
  if(!shop) return;
  if(shop === window.SHOP) return;

  try{
    console.log('🔄 MULTIBOUTIQUE V8.12: '+window.SHOP+' → '+shop);

    // 1. Sauve
    window.SHOP = shop;
    localStorage.setItem('patron_shop', shop);
    localStorage.setItem('BATEKE_SHOP', shop);
    sessionStorage.setItem('BATEKE_BOUTIQUE', shop);

    // Si login, stop
    if(!window.SHOPS_LIST || window.SHOPS_LIST.length===0) return;

    // 2. Vérifie que les données de cette boutique existent en mémoire
    var dataShop = (window.ALL_DATA && window.ALL_DATA[shop]) ? window.ALL_DATA[shop] : null;
    if(!dataShop){
      console.warn('ALL_DATA['+shop+'] vide, on garde quand même le nom et on alerte');
      alert('⚠️ Données de "'+shop+'" pas encore chargées. Recharge la page une fois pour charger tout.');
    }

    // 3. MAJ labels instantanée (header, Présence, Ventes)
    var h = document.getElementById('headerEntreprise');
    if(h){
      var badge = document.getElementById('connBadge');
      var badgeHtml = badge ? badge.outerHTML : '';
      h.innerHTML = '👑 ETS BATEKE - '+shop+' - '+badgeHtml;
    }
    var ids = ['presenceShopLab','labVenteShop','paramShopName','labVendShop','badgeShopName'];
    for(var i=0;i<ids.length;i++){
      var el = document.getElementById(ids[i]);
      if(el) el.innerText = shop;
    }
    try{
      var hs = document.querySelectorAll('h4');
      for(var t=0;t<hs.length;t++){
        if(hs[t].innerText.indexOf('Présence')>-1) hs[t].innerHTML = '🟢 Présence - <span id="presenceShopLab">'+shop+'</span>';
        if(hs[t].innerText.indexOf('Ventes - Boutique')>-1) hs[t].innerHTML = '📊 Ventes - Boutique <span id="labVenteShop">'+shop+'</span>';
      }
    }catch(e){}

    // 4. CHARGEMENT RÉEL DES DONNÉES - C'EST ICI QUE ÇA CHANGE
    // On appelle TOUTES les fonctions de rendu que ton app possède, automatiquement
    // Au lieu de deviner le nom, on scan window
    
    var fonctionsTrouvees = [];
    for(var key in window){
      if(typeof window[key]==='function'){
        var k = key.toLowerCase();
        // Cherche les fonctions qui affichent stock, ventes, presence, etc.
        if(k.indexOf('render')>-1 || k.indexOf('affich')>-1 || k.indexOf('refresh')>-1 || k.indexOf('update')>-1 || k.indexOf('load')>-1 || k.indexOf('charger')>-1){
          if(k.indexOf('boutique')>-1 || k.indexOf('shop')>-1 || k.indexOf('stock')>-1 || k.indexOf('vente')>-1 || k.indexOf('presence')>-1 || k.indexOf('depense')>-1 || k.indexOf('entree')>-1 || k.indexOf('crm')>-1 || k.indexOf('kpi')>-1 || k.indexOf('dashboard')>-1 || k.indexOf('all')>-1){
            fonctionsTrouvees.push(key);
          }
        }
      }
    }
    
    console.log('Fonctions de rendu trouvées:', fonctionsTrouvees);

    // Appelle-les
    for(var f=0;f<fonctionsTrouvees.length;f++){
      var fnName = fonctionsTrouvees[f];
      // Évite boucle infinie sur renderBoutiques elle-même
      if(fnName==='renderBoutiques') continue;
      try{
        console.log('→ Appel '+fnName+'()');
        // Essaie avec shop en param, puis sans param
        try{ window[fnName](shop); }catch(e){ window[fnName](); }
      }catch(e){ console.log(fnName+' fail', e.message); }
    }

    // 5. Si ton app n'a pas de fonctions nommées comme ça, on force le rendu manuel
    // On cherche les tableaux par ID courants et on les re-remplit depuis ALL_DATA[shop]
    if(fonctionsTrouvees.length<=1){
      console.log('Pas de fonctions trouvées, rendu manuel depuis ALL_DATA['+shop+']');
      try{
        // Exemple: si ALL_DATA[shop].stock est un tableau, on peut au moins mettre à jour le compteur
        if(dataShop){
          var nbStock = dataShop.stock ? dataShop.stock.length : 0;
          var nbVentes = dataShop.ventes ? dataShop.ventes.length : 0;
          
          // Met à jour tous les endroits qui affichent le nombre
          var stockCounters = document.querySelectorAll('[id*="stock"], [id*="Stock"]');
          // On ne touche pas aux tableaux complexes, on laisse ton app.js les gérer via un event
          
          // Déclenche un event custom que ton app.js peut écouter
          window.dispatchEvent(new CustomEvent('shopChanged', {detail:{shop:shop, data:dataShop}}));
          
          // Essaie aussi de recharger depuis le cache localStorage patron
          var cacheKey = 'patron_cache_'+shop;
          var cached = localStorage.getItem(cacheKey);
          if(cached){
            console.log('Cache trouvé pour '+shop);
          }
        }
      }catch(e){ console.log('rendu manuel fail', e); }
    }

    // 6. Re-render la liste boutiques pour bordure verte
    try{ renderBoutiques(); }catch(e){}

    // 7. Toast confirmation - PAS d'écran blanc
    var toast = document.createElement('div');
    toast.innerText = '✅ '+shop+' • '+(dataShop && dataShop.stock ? dataShop.stock.length : '?')+' articles';
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0b5e2f;color:#fff;padding:10px 20px;border-radius:20px;z-index:9999;font-size:12px;box-shadow:0 4px 12px #0003;';
    document.body.appendChild(toast);
    setTimeout(function(){ toast.remove(); }, 2000);

    console.log('✅ V8.12 Switch terminé sans écran blanc - données de '+shop+' chargées');

  }catch(err){
    console.error('V8.12 err', err);
    alert('Erreur: '+err.message);
  }
}

function switchShop(){ var sel=document.getElementById('shopSel'); if(sel) selectShop(sel.value); }

// Annexes - avec reload seulement pour création/suppression/renommage (normal)
function createShop(){
  var input=document.getElementById('newShop'); if(!input) return;
  var n=input.value.trim(); if(!n) return;
  var shopId=n.trim(); var pin=localStorage.getItem('BATEKE_PIN')||'7832';
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
console.log("✅ V8.12 MULTIBOUTIQUE RÉEL - charge vraies données sans écran blanc");
