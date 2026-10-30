// js/patron/boutiques.js - V8.19 FIX VENDEUR PRÉSENCE - SANS ECRAN BLANC
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

// PATCH PRÉSENCE - on écrase renderPresenceKPI une seule fois au chargement
(function(){
  try{
    // Sauve l'ancienne si existe
    if(typeof window.renderPresenceKPI==='function' && !window._origRenderPresenceKPI){
      window._origRenderPresenceKPI = window.renderPresenceKPI;
    }
    // Nouvelle version qui lit TOUJOURS la boutique actuelle
    window.renderPresenceKPI = function(){
      try{
        var shop = localStorage.getItem('patron_shop') || window.SHOP || 'Menkao2';
        try{ if(typeof SHOP!=='undefined' && SHOP) shop = SHOP; }catch(e){}
        var dataShop = window.ALL_DATA && window.ALL_DATA[shop] ? window.ALL_DATA[shop] : null;
        if(!dataShop){
          console.log('Présence: ALL_DATA['+shop+'] vide');
          return;
        }
        var presence = dataShop.presence || {};
        var vendeurs = dataShop.vendeurs || {};
        
        // Si vendeurs vide, essaie de déduire depuis presence
        var list = Object.keys(vendeurs).length>0 ? vendeurs : presence;
        // Si encore vide, déduit depuis les ventes
        if(Object.keys(list).length===0){
          var ventes = dataShop.ventes || [];
          var uniq={};
          for(var i=0;i<ventes.length;i++){ if(ventes[i].vendeur) uniq[ventes[i].vendeur]=true; }
          for(var u in uniq) list[u]={};
        }

        console.log('🟢 Présence RENDER pour '+shop+':', Object.keys(list));

        // Trouve le conteneur présence SANS CASSER LA PAGE
        var container = document.getElementById('presenceList');
        if(!container) container = document.getElementById('presenceContainer');
        if(!container) container = document.getElementById('listPresence');
        if(!container){
          // Cherche le div juste sous le titre Présence - X
          var label = document.getElementById('presenceShopLab');
          if(label){
            // Le conteneur est généralement le parent qui contient les chips
            var parent = label.closest('div');
            if(parent){
              // Cherche le sibling qui contient les chips
              var card = parent.closest('div');
              if(card){
                var allDivs = card.querySelectorAll('div');
                for(var d=0;d<allDivs.length;d++){
                  if(allDivs[d].innerText && allDivs[d].innerText.indexOf('Hors ligne')>-1){
                    container = allDivs[d];
                    break;
                  }
                }
              }
            }
          }
        }

        if(!container){
          console.log('Conteneur présence non trouvé, on ne touche pas');
          // Appelle l'ancienne fonction en fallback pour ne pas avoir écran blanc
          if(window._origRenderPresenceKPI) try{ window._origRenderPresenceKPI(); }catch(e){}
          return;
        }

        // Construit HTML des vendeurs de CETTE boutique uniquement
        var html='';
        var keys = Object.keys(list);
        if(keys.length===0){
          html='<span style="padding:4px 8px;color:#888;font-size:11px">Aucun vendeur pour '+shop+'</span>';
        } else {
          for(var k=0;k<keys.length;k++){
            var nom = keys[k];
            var p = list[nom] || {};
            var isOnline = (p.online===true || p.enLigne===true || p.status==='online');
            var dot = isOnline ? '🟢' : '🔴';
            var bg = isOnline ? '#dcfce7' : '#fee2e2';
            var col = isOnline ? '#166534' : '#991b1b';
            var lastTxt='';
            try{
              var last = p.lastSeen || p.last || p.dernierePresence || p.timestamp;
              if(last && !isOnline){
                var diff = Date.now() - new Date(last).getTime();
                var h = Math.floor(diff/3600000);
                if(h<1) lastTxt=' • il y a '+Math.floor(diff/60000)+'m';
                else if(h<24) lastTxt=' • il y a '+h+'h';
                else lastTxt=' • il y a '+Math.floor(h/24)+'j';
              }
            }catch(e){}
            html+='<span style="display:inline-flex;align-items:center;gap:4px;background:'+bg+';color:'+col+';padding:4px 10px;border-radius:20px;font-size:11px;margin:3px">'
              +'<span style="width:8px;height:8px;border-radius:50%;background:'+(isOnline?'#22c55e':'#ef4444')+';display:inline-block"></span> <b>'+nom+'</b> <small>'+(isOnline?'En ligne':'Hors ligne'+lastTxt)+'</small></span>';
          }
        }

        // Si container est le chip lui-même, remplace parent
        if(container.innerText && container.innerText.indexOf('Hors ligne')>-1 && container.children.length<=2){
          var parentChips = container.parentElement;
          if(parentChips && parentChips.children.length<20){
            parentChips.innerHTML = html;
          } else {
            container.innerHTML = html;
          }
        } else {
          container.innerHTML = html;
        }

        // Met à jour le titre
        var lab = document.getElementById('presenceShopLab');
        if(lab) lab.innerText = shop;

      }catch(e){
        console.error('renderPresenceKPI patch err', e);
        if(window._origRenderPresenceKPI) try{ window._origRenderPresenceKPI(); }catch(e2){}
      }
    };
    console.log('✅ renderPresenceKPI patché pour multiboutique');
  }catch(e){ console.log('Patch présence fail', e); }
})();

function selectShop(shop){
  if(!shop) return;
  var oldShop = localStorage.getItem('patron_shop') || window.SHOP || 'Menkao2';
  if(shop===oldShop) return;
  console.log('🔥 V8.19: '+oldShop+' → '+shop);

  localStorage.setItem('patron_shop',shop); localStorage.setItem('BATEKE_SHOP',shop); sessionStorage.setItem('BATEKE_BOUTIQUE',shop);
  try{ window.SHOP=shop; }catch(e){} try{ SHOP=shop; }catch(e){} try{ eval('SHOP="'+shop+'"'); }catch(e){} try{ window.eval('SHOP="'+shop+'"'); }catch(e){}

  if(!window.SHOPS_LIST || window.SHOPS_LIST.length===0) return;
  try{ window.PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+shop)||'[]'); }catch(e){ window.PANIER_ACHAT=[]; }

  try{
    window.getFiltered = function(){
      var s = localStorage.getItem('patron_shop') || window.SHOP || 'Menkao2';
      var data = window.ALL_DATA ? window.ALL_DATA[s] : null;
      if(!data) return {stock:[], ventes:[], depenses:[], entrees:[], vendeurs:[], presence:[], dettes:[]};
      return data;
    };
  }catch(e){}

  try{ if(typeof updateLabels==='function') updateLabels(); }catch(e){}
  try{
    var hEl=document.getElementById('headerEntreprise');
    if(hEl){ var badge=document.getElementById('connBadge'); var badgeHtml=badge?badge.outerHTML:'<span id="connBadge">🟢 SYNC</span>'; hEl.innerHTML='👑 ETS BATEKE - '+shop+' - '+badgeHtml; }
    ['presenceShopLab','labVenteShop','paramShopName','labVendShop'].forEach(function(id){ var el=document.getElementById(id); if(el) el.innerText=shop; });
  }catch(e){}

  try{
    if(typeof refreshAll==='function') refreshAll();
    else {
      ['updateKPIs','renderVentes','renderStock','renderCaisse','renderCRM'].forEach(function(fn){ if(typeof window[fn]==='function'){ try{ window[fn](); }catch(e){} } });
    }
  }catch(e){}

  // FIX PRÉSENCE - appelle la version patchée
  try{
    if(typeof window.renderPresenceKPI==='function') window.renderPresenceKPI();
  }catch(e){ console.log('renderPresenceKPI call fail', e); }

  // Recharge présence depuis Firebase pour cette boutique
  try{
    if(typeof firebase !== 'undefined' && firebase.database){
      if(window._presenceRef && window._presenceRef.off) try{ window._presenceRef.off(); }catch(e){}
      var refP = firebase.database().ref('shops/'+shop+'/presence');
      var refV = firebase.database().ref('shops/'+shop+'/vendeurs');
      window._presenceRef = refP;
      refV.once('value').then(function(sV){
        var v = sV.val()||{};
        if(window.ALL_DATA && window.ALL_DATA[shop]) window.ALL_DATA[shop].vendeurs = v;
        return refP.once('value');
      }).then(function(sP){
        var p = sP.val()||{};
        if(window.ALL_DATA && window.ALL_DATA[shop]) window.ALL_DATA[shop].presence = p;
        if(typeof window.renderPresenceKPI==='function') window.renderPresenceKPI();
        // Listener live
        refP.on('value', function(s){ 
          var vv = s.val()||{}; 
          if(window.ALL_DATA && window.ALL_DATA[shop]) window.ALL_DATA[shop].presence = vv;
          if(typeof window.renderPresenceKPI==='function') window.renderPresenceKPI();
        });
      });
    }
  }catch(e){ console.log('Firebase présence err', e.message); }

  try{ renderBoutiques(); }catch(e){}

  var d=window.ALL_DATA&&window.ALL_DATA[shop]?window.ALL_DATA[shop]:null; var nb=d&&d.stock?d.stock.length:0;
  var toast=document.createElement('div'); toast.innerText='✅ '+shop+' • '+nb+' art.'; toast.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0b5e2f;color:#fff;padding:10px 20px;border-radius:20px;z-index:9999;font-size:12px;'; document.body.appendChild(toast); setTimeout(function(){ toast.remove(); },1500);
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
window.renderBoutiques=renderBoutiques; window.selectShop=selectShop; window.switchShop=switchShop; window.createShop=createShop; window.renommerBoutique=renommerBoutique; window.supprimerBoutique=supprimerBoutique; window.copyLienShop=copyLienShop; window.copyInput=copyInput; window.shareWhatsApp=shareWhatsApp; window.openQR=openQR; window.copyLien=copyLien;
console.log('✅ V8.19 FIX VENDEUR - sans écran blanc');
