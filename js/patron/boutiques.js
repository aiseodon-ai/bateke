// js/patron/boutiques.js - V8.20 CHIRURGICAL - COPIE EXACTE DU MONOLITHE pantron.txt + options boutique
// Garde tout l'acquis, corrige seulement le bug belvine bloqué

function renderBoutiques(data){
  try{
    // Version monolithe + affichage nombre articles + boutons sans toucher présence
    let html = SHOPS_LIST.map(shop=>`
      <div style="display:flex;justify-content:space-between;padding:10px;border:1px solid ${shop===SHOP?'#0b5e2f':'#eee'};background:${shop===SHOP?'#f0fdf4':'#fff'};border-radius:10px;margin-bottom:6px;align-items:center">
        <div><b>🏪 ${shop}</b><br><small>${(ALL_DATA[shop]?.stock?.length||0)} articles - ${(ALL_DATA[shop]?.vendeurs?Object.keys(ALL_DATA[shop].vendeurs).length:0)} vendeurs</small></div>
        <div style="display:flex;gap:4px">
          <button class="btn btn-b" style="width:auto;padding:6px 10px;font-size:11px" onclick="selectShop('${shop}')">Ouvrir</button>
          <button class="btn" style="width:auto;padding:6px 8px;font-size:10px;background:#f59e0b" onclick="renommerBoutique('${shop}')">✏️</button>
          <button class="btn btn-r" style="width:auto;padding:6px 8px;font-size:10px" onclick="supprimerBoutique('${shop}')">🗑️</button>
        </div>
      </div>`).join('');
    let el = document.getElementById('listShops');
    if(el) el.innerHTML = html;

    let el2 = document.getElementById('allLinks');
    if(el2){
      let origin = location.origin;
      if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
      let base = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'') + '/';
      base = base.replace(/patron\/$/,'');
      el2.innerHTML = SHOPS_LIST.map(s=>`
        <div style="padding:10px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:#fff">
          <b>🏪 ${s}</b> <small>${(ALL_DATA[s]?.stock?.length||0)} art / ${Object.keys(ALL_DATA[s]?.vendeurs||{}).length} vend</small><br>
          <div style="display:flex;gap:4px;margin-top:6px"><input value="${base}vendeur.html?shop=${encodeURIComponent(s)}" id="inputLien_${s}" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:6px;border-radius:6px"><button class="btn btn-b" style="width:auto;font-size:10px" onclick="copyInput('inputLien_${s}')">Copier</button></div>
          <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
            <button class="btn btn-g" style="width:auto;font-size:10px" onclick="shareWhatsApp('${s}')">WhatsApp</button>
            <button class="btn" style="width:auto;font-size:10px;background:#f59e0b" onclick="renommerBoutique('${s}')">Renommer</button>
            <button class="btn" style="width:auto;font-size:10px;background:#111;color:#fff" onclick="openQR('${s}')">QR</button>
            <button class="btn btn-r" style="width:auto;font-size:10px" onclick="supprimerBoutique('${s}')">Supprimer</button>
          </div>
          <div id="qr_${s}" style="display:none;margin-top:10px;text-align:center"></div>
        </div>`).join('');
    }

    // Met à jour le selecteur sans recréer si déjà bon (évite boucle)
    let sel = document.getElementById('shopSel');
    if(sel && sel.options.length !== SHOPS_LIST.length+1){
      sel.innerHTML = SHOPS_LIST.map(s=>`<option ${s===SHOP?'selected':''} value="${s}">${s}</option>`).join('') + '<option value="ALL">TOUTES</option>';
    }
  }catch(e){ console.log('renderBoutiques err', e); }
}

// === COPIE EXACTE DU MONOLITHE - NE PAS MODIFIER ===
function selectShop(shop){
  SHOP=shop;
  localStorage.setItem('patron_shop',SHOP);
  PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
  document.getElementById('shopSel').value=shop;
  updateLabels();
  refreshAll();
}

function switchShop(){
  SHOP=document.getElementById('shopSel').value;
  localStorage.setItem('patron_shop',SHOP);
  PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
  updateLabels();
  refreshAll();
  renderAchatStock();
  renderPanierAchat();
}
// === FIN COPIE MONOLITHE ===

function createShop(){
  let n=document.getElementById('newShop').value.trim();
  if(!n) return;
  let sid=n.replace(/[^a-zA-Z0-9_-]/g,'')||n;
  if(ALL_DATA[sid]){ alert('Existe déjà'); return; }
  db.ref('shops/'+sid+'/config').set({nom:n,id:sid,created:new Date().toISOString(),owner:localStorage.getItem('BATEKE_PIN')||'7832'})
    .then(()=> db.ref('shops/'+sid+'/abonnement').set({expire:Date.now()+30*86400000}))
    .then(()=>{ alert('✅ Créée: '+n); location.reload(); });
}

function renommerBoutique(oldShop){
  if(!oldShop) return;
  let newShop=prompt('Renommer "'+oldShop+'" en:', oldShop);
  if(!newShop||newShop.trim()===''||newShop===oldShop) return;
  newShop=newShop.trim();
  if(!confirm('Confirmer "'+oldShop+'" → "'+newShop+'" ?')) return;
  db.ref('shops/'+oldShop).once('value').then(snap=>{
    let data=snap.val(); if(!data){ alert('Vide'); return; }
    data.config.nom=newShop; data.config.id=newShop;
    return db.ref('shops/'+newShop).set(data).then(()=> db.ref('shops/'+oldShop).remove()).then(()=>{
      localStorage.setItem('patron_shop',newShop); alert('✅ Renommé'); location.reload();
    });
  });
}

function supprimerBoutique(shop){
  if(!shop) return;
  if(SHOPS_LIST.length<=1){ alert('Dernière boutique'); return; }
  let c=prompt('Tape OUI pour supprimer "'+shop+'":');
  if(!c||c.toLowerCase()!=='oui') return;
  db.ref('shops/'+shop).remove().then(()=>{ alert('✅ Supprimée'); location.reload(); });
}

function copyLienShop(shop){
  let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
  let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
  let lien=base+'vendeur.html?shop='+encodeURIComponent(shop);
  if(navigator.clipboard) navigator.clipboard.writeText(lien).then(()=> alert('✅ Lien copié:\n'+lien));
}
function copyInput(id){ let el=document.getElementById(id); if(!el) return; el.select(); document.execCommand('copy'); alert('✅ Copié'); }
function shareWhatsApp(shop){
  let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
  let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
  let lien=base+'vendeur.html?shop='+encodeURIComponent(shop);
  window.open('https://wa.me/?text='+encodeURIComponent('🏪 '+shop+'\n🔗 '+lien),'_blank');
}
function openQR(shop){
  let div=document.getElementById('qr_'+shop); if(!div) return;
  if(div.style.display!=='none'){ div.style.display='none'; return; }
  let origin=location.origin; if(origin.indexOf('file')===0) origin='https://aiseodon-ai.github.io/bateke';
  let base=origin+location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'')+'/'; base=base.replace(/patron\/$/,'');
  let lien=base+'vendeur.html?shop='+encodeURIComponent(shop);
  div.innerHTML='<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(lien)+'" style="border:8px solid #fff;border-radius:12px"><br><small>'+lien+'</small>';
  div.style.display='block';
}
function copyLien(){ let el=document.getElementById('lienVendeur')||document.getElementById('lienV'); if(el&&navigator.clipboard) navigator.clipboard.writeText(el.innerText).then(()=> alert('✅ Copié')); }

window.renderBoutiques=renderBoutiques; window.createShop=createShop; window.selectShop=selectShop; window.switchShop=switchShop;
window.renommerBoutique=renommerBoutique; window.supprimerBoutique=supprimerBoutique; window.copyLienShop=copyLienShop;
window.copyInput=copyInput; window.shareWhatsApp=shareWhatsApp; window.openQR=openQR; window.copyLien=copyLien;
console.log('✅ V8.20 CHIRURGICAL - copie exacte monolithe pantron.txt');
