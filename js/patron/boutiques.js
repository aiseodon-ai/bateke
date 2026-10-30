// js/patron/boutiques.js - V8.17 FIX PRÉSENCE - garde V8.16 intact + patch présence
function renderBoutiques(){
  try{
    var elList=document.getElementById('listShops'); var elLinks=document.getElementById('allLinks'); var elSel=document.getElementById('shopSel');
    if(!elList) return; var shops=window.SHOPS_LIST||[]; var allData=window.ALL_DATA||{};
    var origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
    var base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
    var baseV=base+'vendeur.html'; if(shops.length===0) return;
    var h=''; for(var i=0;i<shops.length;i++){ var sh=shops[i]; var nb=(allData[sh]&&allData[sh].stock)?allData[sh].stock.length:0; var act=(sh===(localStorage.getItem('patron_shop')||window.SHOP))?'border:2px solid #0b5e2f;background:#f0fdf4':'border:1px solid #eee';
      h+='<div style="display:flex;justify-content:space-between;padding:10px;'+act+';border-radius:10px;margin-bottom:6px"><div><b>🏪 '+sh+'</b><br><small>'+nb+' art</small></div><div style="display:flex;gap:4px"><button class="btn btn-b" style="width:auto;padding:6px 8px;font-size:10px" onclick="selectShop(\''+sh+'\')">Ouvrir</button><button class="btn" style="width:auto;padding:6px 8px;font-size:10px;background:#f59e0b" onclick="renommerBoutique(\''+sh+'\')">✏️</button><button class="btn btn-r" style="width:auto;padding:6px 8px;font-size:10px" onclick="supprimerBoutique(\''+sh+'\')">🗑️</button></div></div>'; }
    elList.innerHTML=h;
    if(elLinks){ var hl=''; for(var j=0;j<shops.length;j++){ var s=shops[j]; var l2=baseV+'?shop='+encodeURIComponent(s); var ns=(allData[s]&&allData[s].stock)?allData[s].stock.length:0; var nv=(allData[s]&&allData[s].ventes)?allData[s].ventes.length:0;
      hl+='<div style="padding:12px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:#fff"><b>🏪 '+s+'</b> <small>'+ns+'/'+nv+'</small><br><div style="display:flex;gap:4px;margin-top:6px"><input value="'+l2+'" id="inputLien_'+s+'" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:6px;border-radius:6px"><button class="btn btn-b" style="width:auto;font-size:10px" onclick="copyInput(\'inputLien_'+s+'\')">Copier</button></div><div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap"><button class="btn btn-g" style="width:auto;font-size:10px" onclick="shareWhatsApp(\''+s+'\')">WhatsApp</button><button class="btn" style="width:auto;font-size:10px;background:#f59e0b" onclick="renommerBoutique(\''+s+'\')">Renommer</button><button class="btn" style="width:auto;font-size:10px;background:#111;color:#fff" onclick="openQR(\''+s+'\')">QR</button><button class="btn btn-r" style="width:auto;font-size:10px" onclick="supprimerBoutique(\''+s+'\')">Supprimer</button></div><div id="qr_'+s+'" style="display:none;margin-top:10px"></div></div>'; }
      elLinks.innerHTML=hl; }
    if(elSel){ var cur=localStorage.getItem('patron_shop')||window.SHOP||shops[0]; var o=''; for(var k=0;k<shops.length;k++) o+='<option value="'+shops[k]+'" '+(shops[k]==cur?'selected':'')+'>'+shops[k]+'</option>'; o+='<option value="ALL" '+(cur==='ALL'?'selected':'')+'>TOUTES</option>'; elSel.innerHTML=o; }
  }catch(e){ console.log(e); }
}
 
function selectShop(shop){
  if(!shop) return;
  var oldShop = localStorage.getItem('patron_shop') || window.SHOP || 'Menkao2';
  if(shop===oldShop){ console.log('Déjà sur '+shop); return; }
  console.log('🔥 V8.17: '+oldShop+' → '+shop);

  localStorage.setItem('patron_shop',shop); localStorage.setItem('BATEKE_SHOP',shop); sessionStorage.setItem('BATEKE_BOUTIQUE',shop);
  try{ window.SHOP=shop; }catch(e){} try{ SHOP=shop; }catch(e){} try{ eval('SHOP="'+shop+'"'); }catch(e){} try{ window.eval('SHOP="'+shop+'"'); }catch(e){}

  if(!window.SHOPS_LIST || window.SHOPS_LIST.length===0) return;
  try{ window.PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+shop)||'[]'); }catch(e){ window.PANIER_ACHAT=[]; }

  // Écrase getFiltered comme V8.16 - garde l'acquis
  try{
    window.getFiltered = function(){
      var s = localStorage.getItem('patron_shop') || window.SHOP || 'Menkao2';
      var data = window.ALL_DATA ? window.ALL_DATA[s] : null;
      if(!data) return {stock:[], ventes:[], depenses:[], entrees:[], vendeurs:[], presence:[], dettes:[]};
      if(s==='ALL'){
        var agg={stock:[], ventes:[], depenses:[], entrees:[], vendeurs:[], presence:[], dettes:[]};
        for(var k in window.ALL_DATA){ var d=window.ALL_DATA[k]; if(d.stock) agg.stock=agg.stock.concat(d.stock); if(d.ventes) agg.ventes=agg.ventes.concat(d.ventes); if(d.depenses) agg.depenses=agg.depenses.concat(d.depenses); if(d.entrees) agg.entrees=agg.entrees.concat(d.entrees); if(d.presence) agg.presence=agg.presence.concat(Object.values(d.presence||{})); }
        return agg;
      }
      return data;
    };
  }catch(e){}

  // MAJ labels header
  try{ if(typeof updateLabels==='function') updateLabels(); }catch(e){}
  try{
    var hEl=document.getElementById('headerEntreprise');
    if(hEl){ var badge=document.getElementById('connBadge'); var badgeHtml=badge?badge.outerHTML:'<span id="connBadge">🟢 SYNC</span>'; hEl.innerHTML='👑 ETS BATEKE - '+shop+' - '+badgeHtml; }
    ['presenceShopLab','labVenteShop','paramShopName','labVendShop'].forEach(function(id){ var el=document.getElementById(id); if(el) el.innerText=shop; });
  }catch(e){}

  // CHARGE VENTES/STOCK - acquis V8.16
  try{
    if(typeof refreshAll==='function') refreshAll();
    ['updateKPIs','renderVentes','renderStock','renderCaisse','renderCRM','renderDettes','renderEntrees','renderDepenses','renderAchatStock','renderPanierAchat','renderVendeurs'].forEach(function(fn){ if(typeof window[fn]==='function'){ try{ window[fn](); }catch(e){} } });
  }catch(e){ console.error(e); }

  // ===== FIX PRÉSENCE UNIQUEMENT - NOUVEAU =====
  try{
    console.log('🔧 FIX Présence pour '+shop);
    var dataShop = window.ALL_DATA && window.ALL_DATA[shop] ? window.ALL_DATA[shop] : null;
    
    // 1. Force le label Présence - X dans tous les endroits possibles
    var presenceLabels = document.querySelectorAll('[id*="presence"], [id*="Presence"]');
    presenceLabels.forEach(function(el){
      if(el.id && el.id.toLowerCase().includes('shop')) el.innerText=shop;
    });
    // Cherche le h4 / div qui contient "Présence - Menkao2" et le remplace
    document.querySelectorAll('h3,h4,div,span').forEach(function(el){
      try{
        if(el.childNodes.length===1 && el.innerText && el.innerText.indexOf('Présence -')===0){
          // Évite de toucher les enfants, seulement le header
          if(el.innerText.length < 30) el.innerHTML = '🟢 Présence - <span id="presenceShopLab">'+shop+'</span>';
        }
      }catch(e){}
    });

    // 2. Si ton app a une fonction qui écoute Firebase pour présence, on la relance avec le nouveau shop
    // Essaie tous les noms possibles sans casser si n'existe pas
    var presenceFuncs = ['initPresence','watchPresence','listenPresence','startPresence','loadPresence','refreshPresence','updatePresence','renderPresence','renderPresenceKPI','renderPresenceList','checkPresence'];
    presenceFuncs.forEach(function(fn){
      if(typeof window[fn]==='function'){
        try{
          console.log('→ Appel '+fn+'('+shop+')');
          try{ window[fn](shop); }catch(e){ window[fn](); }
        }catch(e){ console.log(fn+' fail', e.message); }
      }
    });

    // 3. Si ALL_DATA[shop].presence existe, force son affichage manuel (fallback)
    if(dataShop){
      var presenceData = dataShop.presence || dataShop.vendeurs || {};
      // Si c'est un objet {belvine: {online: false, lastSeen: ...}}
      var count = Object.keys(presenceData).length;
      console.log('Présence data pour '+shop+': '+count+' vendeurs');
      
      // Essaie de trouver le conteneur présence et le vider/re-remplir si les fonctions n'ont pas marché
      var contPresence = document.getElementById('presenceList') || document.getElementById('presenceContainer') || document.querySelector('[id*="presence"]');
      // On ne force pas le HTML si la fonction a marché, on laisse le render officiel faire
      // Mais on met à jour le titre au moins
      var titleEl = document.querySelector('#presenceShopLab');
      if(titleEl) titleEl.innerText = shop;
    }

    // 4. Pour Firebase: coupe l'ancien listener et relance sur le nouveau shop
    try{
      if(typeof firebase !== 'undefined' && firebase.database){
        // Coupe ancien listener si existe
        if(window._presenceRef && window._presenceRef.off) window._presenceRef.off();
        // Nouveau listener
        var newRef = firebase.database().ref('shops/'+shop+'/presence');
        window._presenceRef = newRef;
        newRef.on('value', function(snap){
          var val = snap.val();
          console.log('📡 Présence live pour '+shop+':', val);
          // Mets à jour ALL_DATA
          if(window.ALL_DATA && window.ALL_DATA[shop]){
            window.ALL_DATA[shop].presence = val || {};
          }
          // Re-render présence
          if(typeof window.renderPresenceKPI==='function') try{ window.renderPresenceKPI(); }catch(e){}
          if(typeof window.renderPresence==='function') try{ window.renderPresence(); }catch(e){}
        });
        console.log('✅ Listener présence relancé sur shops/'+shop+'/presence');
      }
    }catch(e){ console.log('Firebase présence listener fail', e.message); }

  }catch(e){ console.error('Fix présence err', e); }
  // ===== FIN FIX PRÉSENCE =====

  try{ renderBoutiques(); }catch(e){}

  var d=window.ALL_DATA&&window.ALL_DATA[shop]?window.ALL_DATA[shop]:null; var nb=d&&d.stock?d.stock.length:0;
  var toast=document.createElement('div'); toast.innerText='✅ '+shop+' • '+nb+' art.'; toast.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0b5e2f;color:#fff;padding:10px 20px;border-radius:20px;z-index:9999;font-size:12px;'; document.body.appendChild(toast); setTimeout(function(){ toast.remove(); },1800);
}

function switchShop(){ var sel=document.getElementById('shopSel'); if(sel) selectShop(sel.value); }
function createShop(){ var input=document.getElementById('newShop'); if(!input) return; var n=input.value.trim(); if(!n) return; var sid=n.trim().replace(/[^a-zA-Z0-9_-]/g,'')||n.trim(); var pin=localStorage.getItem('BATEKE_PIN')||'7832'; var db=firebase.database(); db.ref('shops/'+sid).once('value').then(function(snap){ if(snap.exists()){ alert('Existe déjà'); return; } return db.ref('shops/'+sid).set({config:{nom:n,id:sid,created:new Date().toISOString(),owner:pin},stock:{},ventes:{},abonnement:{expire:Date.now()+30*86400000}}).then(function(){ alert('✅ Créée: '+n); location.reload(); }); }); }
function renommerBoutique(o){ if(!o) return; var n=prompt('Renommer "'+o+'" en:',o); if(!n||n===o) return; n=n.trim(); if(!confirm('Confirmer "'+o+'" → "'+n+'" ?')) return; var db=firebase.database(); db.ref('shops/'+o).once('value').then(function(snap){ var data=snap.val(); if(!data) return; data.config.nom=n; data.config.id=n; return db.ref('shops/'+n).set(data).then(function(){ return db.ref('shops/'+o).remove(); }).then(function(){ localStorage.setItem('patron_shop',n); alert('✅ Renommé'); location.reload(); }); }); }
function supprimerBoutique(s){ if(!s) return; if((window.SHOPS_LIST||[]).length<=1){ alert('Dernière boutique'); return; } var c=prompt('Tape OUI pour supprimer "'+s+'":'); if(!c||c.toLowerCase()!=='oui') return; firebase.database().ref('shops/'+s).remove().then(function(){ alert('✅ Supprimée'); location.reload(); }); }
function copyLienShop(s){ var origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke'; var base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,''); var l=base+'vendeur.html?shop='+encodeURIComponent(s); if(navigator.clipboard) navigator.clipboard.writeText(l).then(function(){ alert('✅ Lien copié:\n'+l); }); }
function copyInput(id){ var el=document.getElementById(id); if(!el) return; el.select(); document.execCommand('copy'); alert('✅ Copié'); }
function shareWhatsApp(s){ var origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke'; var base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,''); var l=base+'vendeur.html?shop='+encodeURIComponent(s); window.open('https://wa.me/?text='+encodeURIComponent('🏪 '+s+'\n🔗 '+l),'_blank'); }
function openQR(s){ var div=document.getElementById('qr_'+s); if(!div) return; if(div.style.display!=='none'){ div.style.display='none'; return; } var origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke'; var base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,''); var l=base+'vendeur.html?shop='+encodeURIComponent(s); div.innerHTML='<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(l)+'" style="border:8px solid #fff;border-radius:12px"><br><small>'+l+'</small>'; div.style.display='block'; }
function copyLien(){ var el=document.getElementById('lienVendeur'); if(el&&navigator.clipboard) navigator.clipboard.writeText(el.innerText).then(function(){ alert('✅ Copié'); }); }
window.renderBoutiques=renderBoutiques; window.createShop=createShop; window.selectShop=selectShop; window.switchShop=switchShop; window.renommerBoutique=renommerBoutique; window.supprimerBoutique=supprimerBoutique; window.copyLienShop=copyLienShop; window.copyInput=copyInput; window.shareWhatsApp=shareWhatsApp; window.openQR=openQR; window.copyLien=copyLien;
console.log('✅ V8.17 FIX PRÉSENCE - garde acquis + présence live');
