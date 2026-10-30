// js/patron/boutiques.js - V8.15 ULTIME - FORCE LE CHARGEMENT RÉEL DES DONNÉES
function renderBoutiques(){
  try{
    var elList=document.getElementById('listShops'); var elLinks=document.getElementById('allLinks'); var elSel=document.getElementById('shopSel');
    if(!elList) return; var shops=window.SHOPS_LIST||[]; var allData=window.ALL_DATA||{};
    var origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
    var base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
    var baseV=base+'vendeur.html'; if(shops.length===0) return;
    var h=''; for(var i=0;i<shops.length;i++){ var sh=shops[i]; var nb=(allData[sh]&&allData[sh].stock)?allData[sh].stock.length:0; var act=(sh===(window.SHOP||localStorage.getItem('patron_shop')))?'border:2px solid #0b5e2f;background:#f0fdf4':'border:1px solid #eee';
      h+='<div style="display:flex;justify-content:space-between;padding:10px;'+act+';border-radius:10px;margin-bottom:6px"><div><b>🏪 '+sh+'</b><br><small>'+nb+' art</small></div><div style="display:flex;gap:4px"><button class="btn btn-b" style="width:auto;padding:6px 8px;font-size:10px" onclick="selectShop(\''+sh+'\')">Ouvrir</button><button class="btn" style="width:auto;padding:6px 8px;font-size:10px;background:#f59e0b" onclick="renommerBoutique(\''+sh+'\')">✏️</button><button class="btn btn-r" style="width:auto;padding:6px 8px;font-size:10px" onclick="supprimerBoutique(\''+sh+'\')">🗑️</button></div></div>'; }
    elList.innerHTML=h;
    if(elLinks){ var hl=''; for(var j=0;j<shops.length;j++){ var s=shops[j]; var l2=baseV+'?shop='+encodeURIComponent(s); var ns=(allData[s]&&allData[s].stock)?allData[s].stock.length:0; var nv=(allData[s]&&allData[s].ventes)?allData[s].ventes.length:0;
      hl+='<div style="padding:12px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:#fff"><b>🏪 '+s+'</b> <small>'+ns+'/'+nv+'</small><br><div style="display:flex;gap:4px;margin-top:6px"><input value="'+l2+'" id="inputLien_'+s+'" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:6px;border-radius:6px"><button class="btn btn-b" style="width:auto;font-size:10px" onclick="copyInput(\'inputLien_'+s+'\')">Copier</button></div><div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap"><button class="btn btn-g" style="width:auto;font-size:10px" onclick="shareWhatsApp(\''+s+'\')">WhatsApp</button><button class="btn" style="width:auto;font-size:10px;background:#f59e0b" onclick="renommerBoutique(\''+s+'\')">Renommer</button><button class="btn" style="width:auto;font-size:10px;background:#111;color:#fff" onclick="openQR(\''+s+'\')">QR</button><button class="btn btn-r" style="width:auto;font-size:10px" onclick="supprimerBoutique(\''+s+'\')">Supprimer</button></div><div id="qr_'+s+'" style="display:none;margin-top:10px"></div></div>'; }
      elLinks.innerHTML=hl; }
    if(elSel){ var cur=window.SHOP||localStorage.getItem('patron_shop')||shops[0]; try{ cur=(typeof SHOP!=='undefined'?SHOP:cur); }catch(e){} var o=''; for(var k=0;k<shops.length;k++) o+='<option value="'+shops[k]+'" '+(shops[k]==cur?'selected':'')+'>'+shops[k]+'</option>'; o+='<option value="ALL" '+(cur==='ALL'?'selected':'')+'>TOUTES</option>'; elSel.innerHTML=o; }
  }catch(e){ console.log(e); }
}

function selectShop(shop){
  if(!shop) return;
  console.log('🔥 V8.15 ULTIME: FORCAGE DONNÉES '+shop);

  // 1. Force TOUTES les variables SHOP possibles
  try{ SHOP=shop; }catch(e){}
  try{ window.SHOP=shop; }catch(e){}
  try{ window.SHOP_GLOBAL=shop; }catch(e){}
  try{ window.BATEKE_SHOP=shop; }catch(e){}
  try{ eval('SHOP="'+shop+'"'); }catch(e){}
  try{ window.eval('SHOP="'+shop+'"'); }catch(e){}

  localStorage.setItem('patron_shop',shop); localStorage.setItem('BATEKE_SHOP',shop); sessionStorage.setItem('BATEKE_BOUTIQUE',shop);
  if(!window.SHOPS_LIST||window.SHOPS_LIST.length===0) return;

  try{ window.PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+shop)||'[]'); if(typeof PANIER_ACHAT!=='undefined') PANIER_ACHAT=window.PANIER_ACHAT; }catch(e){ window.PANIER_ACHAT=[]; }

  // 2. MAJ labels
  try{ if(typeof updateLabels==='function') updateLabels(); }catch(e){}
  try{
    var h=document.getElementById('headerEntreprise'); if(h){ var b=document.getElementById('connBadge'); h.innerHTML='👑 ETS BATEKE - '+shop+' - '+(b?b.outerHTML:''); }
    ['presenceShopLab','labVenteShop','paramShopName','labVendShop'].forEach(function(id){ var el=document.getElementById(id); if(el) el.innerText=shop; });
  }catch(e){}

  // 3. LE FIX QUI MANQUAIT: ON FORCE LA SOURCE DE DONNÉES
  // Au lieu d'espérer que refreshAll() le fasse, on écrase directement la variable qui contient les données filtrées
  try{
    var dataShop = window.ALL_DATA && window.ALL_DATA[shop] ? window.ALL_DATA[shop] : null;
    console.log('Données trouvées pour '+shop+':', dataShop ? (dataShop.stock?.length||0)+' stock, '+(dataShop.ventes?.length||0)+' ventes' : 'VIDE');

    // Si ton app utilise une variable globale comme CURRENT_DATA, DATA, FILTRED_DATA, etc., on l'écrase
    if(dataShop){
      try{ window.CURRENT_DATA = dataShop; }catch(e){}
      try{ window.DATA = dataShop; }catch(e){}
      try{ window.FILTERED_DATA = dataShop; }catch(e){}
      try{ window.CURRENT_SHOP_DATA = dataShop; }catch(e){}
      // Pour getFiltered qui fait return ALL_DATA[SHOP], on s'assure que ALL_DATA[SHOP] existe
      // déjà OK car ALL_DATA contient tout
    }

    // Appelle refreshAll avec force
    if(typeof refreshAll==='function'){ refreshAll(); }
    // Appelle tout ce qui peut rafraîchir
    ['updateKPIs','renderVentes','renderStock','renderCaisse','renderPresenceKPI','renderCRM','renderDettes','renderEntrees','renderDepenses','renderAchatStock','renderPanierAchat','updateLabels'].forEach(function(fn){
      if(typeof window[fn]==='function'){ try{ window[fn](); }catch(e){} }
    });

  }catch(e){ console.error(e); }

  try{ renderBoutiques(); }catch(e){}

  var d=window.ALL_DATA&&window.ALL_DATA[shop]?window.ALL_DATA[shop]:null; var nb=d&&d.stock?d.stock.length:0;
  var toast=document.createElement('div'); toast.innerText='✅ '+shop+' • '+nb+' articles'; toast.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0b5e2f;color:#fff;padding:10px 20px;border-radius:20px;z-index:9999;font-size:12px;'; document.body.appendChild(toast); setTimeout(function(){ toast.remove(); },1800);
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
console.log('✅ V8.15 ULTIME - FORCAGE DONNÉES');
