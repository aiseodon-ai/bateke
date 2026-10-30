// js/patron/boutiques.js - V8.18 FIX VENDEUR PRÉSENCE - lit shops/Menkao1/presence
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

// Fonction qui rend la présence avec les vrais vendeurs de la boutique
function renderPresenceForShop(shop){
  try{
    var dataShop = window.ALL_DATA && window.ALL_DATA[shop] ? window.ALL_DATA[shop] : null;
    var presence = (dataShop && dataShop.presence) ? dataShop.presence : {};
    var vendeurs = (dataShop && dataShop.vendeurs) ? dataShop.vendeurs : {};

    // Si presence vide, essaie vendeurs
    var vendeursList = Object.keys(vendeurs).length > 0 ? vendeurs : presence;
    if(Object.keys(vendeursList).length===0 && dataShop && dataShop.stock){
      // Dernier fallback: vendeurs depuis les ventes
      var ventes = dataShop.ventes || [];
      var uniq = {};
      for(var i=0;i<ventes.length;i++){ if(ventes[i].vendeur) uniq[ventes[i].vendeur]=true; }
      vendeursList = {};
      for(var v in uniq) vendeursList[v]={};
    }

    console.log('👥 Présence pour '+shop+':', Object.keys(vendeursList));

    // Trouve le conteneur présence (le div qui contient belvine)
    var container = null;
    // Essaie IDs connus
    var candidates = ['presenceList','presenceContainer','listPresence','presenceBody','presenceContent','presenceDiv'];
    for(var c=0;c<candidates.length;c++){
      var el = document.getElementById(candidates[c]);
      if(el){ container=el; break; }
    }
    // Fallback: cherche le div qui contient "Hors ligne" ou "En ligne" près du titre Présence
    if(!container){
      var allDivs = document.querySelectorAll('div');
      for(var d=0;d<allDivs.length;d++){
        var txt = allDivs[d].innerText || '';
        if(txt.indexOf('Hors ligne')>-1 || txt.indexOf('En ligne')>-1){
          // Vérifie que c'est dans la section Présence
          if(allDivs[d].closest && allDivs[d].closest('div')){
            var parent = allDivs[d].parentElement;
            if(parent && parent.innerHTML.indexOf('Présence')>-1) { container = allDivs[d]; break; }
            // Sinon le parent direct qui contient les chips
            if(allDivs[d].parentElement && allDivs[d].parentElement.children.length<10){
              container = allDivs[d].parentElement;
            }
          }
        }
      }
    }
    // Dernier fallback: le div juste après le titre Présence - X
    if(!container){
      var label = document.getElementById('presenceShopLab');
      if(label && label.parentElement && label.parentElement.parentElement){
        var next = label.parentElement.parentElement.nextElementSibling;
        if(next) container = next;
        else container = label.parentElement.nextElementSibling;
      }
    }

    if(!container){
      console.log('Conteneur présence non trouvé, on cherche par texte');
      // Cherche tous les éléments qui contiennent belvine
      var all = document.querySelectorAll('*');
      for(var a=0;a<all.length;a++){
        if(all[a].innerText && all[a].innerText.indexOf('belvine')>-1 && all[a].children.length<=3){
          container = all[a].parentElement;
          break;
        }
      }
    }

    if(container){
      // Construit le HTML des vendeurs de cette boutique
      var html = '';
      var vendeursKeys = Object.keys(vendeursList);
      if(vendeursKeys.length===0){
        html = '<div style="padding:10px;color:#888"><small>Aucun vendeur pour '+shop+'</small></div>';
      } else {
        for(var k=0;k<vendeursKeys.length;k++){
          var nom = vendeursKeys[k];
          var p = vendeursList[nom] || {};
          // Détermine en ligne / hors ligne
          var isOnline = false;
          var lastSeen = '';
          if(p.online===true || p.enLigne===true) isOnline=true;
          if(p.lastSeen) lastSeen = p.lastSeen;
          else if(p.last) lastSeen = p.last;
          else if(p.dernierePresence) lastSeen = p.dernierePresence;
          
          var dot = isOnline ? '🟢' : '🔴';
          var status = isOnline ? 'En ligne' : 'Hors ligne';
          var timeText = '';
          if(!isOnline && lastSeen){
            try{
              var diff = Date.now() - new Date(lastSeen).getTime();
              var hours = Math.floor(diff/3600000);
              if(hours<1) timeText = ' • il y a '+Math.floor(diff/60000)+'m';
              else if(hours<24) timeText = ' • il y a '+hours+'h';
              else timeText = ' • il y a '+Math.floor(hours/24)+'j';
            }catch(e){ timeText = ''; }
          }
          var bg = isOnline ? '#dcfce7' : '#fee2e2';
          var color = isOnline ? '#166534' : '#991b1b';
          html += '<span style="display:inline-flex;align-items:center;gap:4px;background:'+bg+';color:'+color+';padding:4px 10px;border-radius:20px;font-size:11px;margin:3px">'
                        + dot+' <b>'+nom+'</b> <small>'+status+timeText+'</small></span>';
        }
      }
      // Garde le wrapper si existe
      if(container.id && container.id.toLowerCase().includes('presence')){
        container.innerHTML = html;
      } else {
        // Si container est le chip lui-même, remplace son parent
        if(container.innerText && container.innerText.indexOf('belvine')>-1){
          // Le parent contient tous les chips
          var parentChips = container.parentElement;
          if(parentChips) parentChips.innerHTML = html;
          else container.innerHTML = html;
        } else {
          container.innerHTML = html;
        }
      }
      console.log('✅ Présence rendue pour '+shop+': '+vendeursKeys.length+' vendeurs');
    } else {
      console.log('❌ Conteneur présence introuvable pour '+shop);
    }
  }catch(e){ console.error('renderPresenceForShop err', e); }
}

function selectShop(shop){
  if(!shop) return;
  var oldShop = localStorage.getItem('patron_shop') || window.SHOP || 'Menkao2';
  if(shop===oldShop){ console.log('Déjà sur '+shop); return; }
  console.log('🔥 V8.18: '+oldShop+' → '+shop);

  localStorage.setItem('patron_shop',shop); localStorage.setItem('BATEKE_SHOP',shop); sessionStorage.setItem('BATEKE_BOUTIQUE',shop);
  try{ window.SHOP=shop; }catch(e){} try{ SHOP=shop; }catch(e){} try{ eval('SHOP="'+shop+'"'); }catch(e){} try{ window.eval('SHOP="'+shop+'"'); }catch(e){}

  if(!window.SHOPS_LIST || window.SHOPS_LIST.length===0) return;
  try{ window.PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+shop)||'[]'); }catch(e){ window.PANIER_ACHAT=[]; }

  // Garde acquis V8.16
  try{
    window.getFiltered = function(){
      var s = localStorage.getItem('patron_shop') || window.SHOP || 'Menkao2';
      var data = window.ALL_DATA ? window.ALL_DATA[s] : null;
      if(!data) return {stock:[], ventes:[], depenses:[], entrees:[], vendeurs:[], presence:[], dettes:[]};
      if(s==='ALL'){
        var agg={stock:[], ventes:[], depenses:[], entrees:[], vendeurs:[], presence:[], dettes:[]};
        for(var k in window.ALL_DATA){ var d=window.ALL_DATA[k]; if(d.stock) agg.stock=agg.stock.concat(d.stock); if(d.ventes) agg.ventes=agg.ventes.concat(d.ventes); }
        return agg;
      }
      return data;
    };
  }catch(e){}

  try{ if(typeof updateLabels==='function') updateLabels(); }catch(e){}
  try{
    var hEl=document.getElementById('headerEntreprise');
    if(hEl){ var badge=document.getElementById('connBadge'); var badgeHtml=badge?badge.outerHTML:'<span id="connBadge">🟢 SYNC</span>'; hEl.innerHTML='👑 ETS BATEKE - '+shop+' - '+badgeHtml; }
    ['presenceShopLab','labVenteShop','paramShopName','labVendShop'].forEach(function(id){ var el=document.getElementById(id); if(el) el.innerText=shop; });
    // Force aussi le titre Présence - X
    document.querySelectorAll('h3,h4,div').forEach(function(el){
      try{ if(el.innerText && el.innerText.indexOf('Présence -')===0 && el.innerText.length<30) el.innerHTML='🟢 Présence - <span id="presenceShopLab">'+shop+'</span>'; }catch(e){}
    });
  }catch(e){}

  try{
    if(typeof refreshAll==='function') refreshAll();
    ['updateKPIs','renderVentes','renderStock','renderCaisse','renderCRM','renderDettes','renderEntrees','renderDepenses','renderAchatStock','renderPanierAchat','renderVendeurs'].forEach(function(fn){ if(typeof window[fn]==='function'){ try{ window[fn](); }catch(e){} } });
  }catch(e){}

  // FIX PRÉSENCE VENDEUR - NOUVEAU V8.18
  try{
    renderPresenceForShop(shop); // Affiche immédiatement depuis ALL_DATA

    // Puis recharge depuis Firebase pour avoir le vrai statut en ligne/hors ligne
    if(typeof firebase !== 'undefined' && firebase.database){
      if(window._presenceRef && window._presenceRef.off) try{ window._presenceRef.off(); }catch(e){}
      if(window._vendeursRef && window._vendeursRef.off) try{ window._vendeursRef.off(); }catch(e){}

      var presenceRef = firebase.database().ref('shops/'+shop+'/presence');
      var vendeursRef = firebase.database().ref('shops/'+shop+'/vendeurs');
      window._presenceRef = presenceRef;
      window._vendeursRef = vendeursRef;

      // Charge vendeurs d'abord
      vendeursRef.once('value').then(function(snapV){
        var vend = snapV.val() || {};
        if(window.ALL_DATA && window.ALL_DATA[shop]) window.ALL_DATA[shop].vendeurs = vend;
        console.log('👥 Vendeurs Firebase pour '+shop+':', Object.keys(vend));
        return presenceRef.once('value');
      }).then(function(snapP){
        var pres = snapP.val() || {};
        if(window.ALL_DATA && window.ALL_DATA[shop]) window.ALL_DATA[shop].presence = pres;
        console.log('📡 Présence Firebase pour '+shop+':', pres);
        renderPresenceForShop(shop); // Re-render avec données Firebase fraîches

        // Écoute live
        presenceRef.on('value', function(s){
          var v = s.val() || {};
          if(window.ALL_DATA && window.ALL_DATA[shop]) window.ALL_DATA[shop].presence = v;
          renderPresenceForShop(shop);
        });
      }).catch(function(e){ console.log('Firebase présence err', e.message); renderPresenceForShop(shop); });

      console.log('✅ Listeners présence relancés sur shops/'+shop);
    }
  }catch(e){ console.error('Fix présence vendeur err', e); }

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
window.renderBoutiques=renderBoutiques; window.renderPresenceForShop=renderPresenceForShop; window.createShop=createShop; window.selectShop=selectShop; window.switchShop=switchShop; window.renommerBoutique=renommerBoutique; window.supprimerBoutique=supprimerBoutique; window.copyLienShop=copyLienShop; window.copyInput=copyInput; window.shareWhatsApp=shareWhatsApp; window.openQR=openQR; window.copyLien=copyLien;
console.log('✅ V8.18 FIX VENDEUR PRÉSENCE - lit shops/[boutique]/vendeurs et presence');
