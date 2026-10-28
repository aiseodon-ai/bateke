// ==== BOUTIQUES V8.0 - SAAS MULTI-PATRON + MONOLITHE V4.9.25 COMPAT ====
function initShops(){
  // V8.0: Si superadmin 7832 ou patron normal, on charge différemment
  let pin = localStorage.getItem('BATEKE_PIN') || sessionStorage.getItem('BATEKE_PIN') || '7832';
  let isSuper = localStorage.getItem('bateke_isSuper')==='1' || pin==='7832';
  
  if(isSuper){
    // Superadmin DG: voit TOUT
    db.ref('shops').on('value', snap=>{
      let data=snap.val()||{};
      SHOPS_LIST=Object.keys(data);
      if(!SHOPS_LIST.length) SHOPS_LIST=['Menkao1','Menkao2','Mbakana','Itendance'];
      SHOPS_LIST.forEach(s=>{if(!ALL_DATA[s]) ALL_DATA[s]={stock:[],ventes:[],dep:[],entrees:[],vendeurs:{}}});
      document.getElementById('shopSel').innerHTML = SHOPS_LIST.map(s=>`<option ${s===SHOP?'selected':''} value="${s}">${s}</option>`).join('')+'<option value="ALL">TOUTES</option>';
      renderBoutiques(data);
      updateLabels();
      refreshAll();
      loadConfig();
      savePatronCache();
    });
  }else{
    // Patron normal: seulement ses boutiques depuis patrons/PIN/boutiques
    db.ref('patrons/'+pin+'/boutiques').on('value', snap=>{
      let myBouts = snap.val()||{};
      SHOPS_LIST=Object.keys(myBouts);
      if(!SHOPS_LIST.length){
        // fallback ancien champ
        db.ref('patrons/'+pin+'/boutique').once('value').then(s=>{
          if(s.val()) SHOPS_LIST=[s.val()];
          renderBoutiques({});
        });
        return;
      }
      SHOPS_LIST.forEach(s=>{if(!ALL_DATA[s]) ALL_DATA[s]={stock:[],ventes:[],dep:[],entrees:[],vendeurs:{}}});
      document.getElementById('shopSel').innerHTML = SHOPS_LIST.map(s=>`<option ${s===SHOP?'selected':''} value="${s}">${s}</option>`).join('');
      renderBoutiques({});
      updateLabels();
      refreshAll();
    });
  }
}

function renderBoutiques(data){
  // Compatible monolithe V4.9.25 + V7.4 DG
  let d = data || ALL_DATA;
  let html=SHOPS_LIST.map(shop=>{
    let nb = (ALL_DATA[shop]?.stock?.length||0);
    let isActive = shop===SHOP ? 'border:2px solid #0b5e2f;background:#f0fdf4' : '';
    return `<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #eee;${isActive}"><div><b>🏪 ${shop}</b><br><small>${nb} articles</small></div><div><button class="btn btn-b" style="width:auto" onclick="selectShop('${shop}')">Ouvrir</button></div></div>`;
  }).join('');
  if(!html) html=`<div style="padding:20px;text-align:center;color:#64748b">Aucune boutique<br><small>Crée ta première ci-dessus</small></div>`;
  document.getElementById('listShops').innerHTML=html;
  document.getElementById('allLinks').innerHTML=SHOPS_LIST.map(s=>`<div style="padding:6px;border-bottom:1px solid #eee;display:flex;justify-content:space-between"><div><b>${s}</b><br><small style="color:#0b5e2f">vendeur.html?shop=${s}</small></div><button class="btn btn-y" style="width:auto;padding:4px 8px;font-size:10px" onclick="navigator.clipboard.writeText(location.origin+'/vendeur.html?shop=${s}')">Copier</button></div>`).join('');
  console.log("✅ renderBoutiques V8.0:", SHOPS_LIST.length);
}

async function createShop(){
  let el = document.getElementById('newShop');
  let n = el.value.trim();
  if(!n){ alert("Nom requis"); return; }
  let shopId = n.trim(); // FIX V8.0: ne pas replace(/[^a-zA-Z0-9]/g,'') qui casse
  if(!shopId) return;

  let pin = localStorage.getItem('BATEKE_PIN') || sessionStorage.getItem('BATEKE_PIN') || '7832';
  if(pin==='SUPERADMIN') pin='7832';

  // check existe
  let snap = await db.ref('shops/'+shopId).once('value');
  if(snap.exists()){ alert('Boutique existe déjà'); return; }

  try{
    // 1. Pour SAAS: ajoute dans patrons/PIN
    if(pin!=='7832' || confirm('Créer pour patron '+pin+' ? OK = oui')){
      await db.ref('patrons/'+pin+'/boutiques/'+shopId).set(true);
    }
    // 2. Crée shop avec structure que listenShop attend (pas seulement /config)
    await db.ref('shops/'+shopId).set({
      config: {nom: n, id: shopId, created: new Date().toISOString(), owner: pin},
      stock: {}, ventes: {}, depenses: {}, entrees: {}, vendeurs: {}, presence: {}
    });
    // 3. Pour compat monolithe: ajoute aussi en config
    await db.ref('shops/'+shopId+'/config').set({created: new Date().toISOString()});

    alert('✅ Boutique créée: '+n);
    el.value='';
    if(!SHOPS_LIST.includes(shopId)) SHOPS_LIST.push(shopId);
    renderBoutiques();
    // re-listen la nouvelle boutique
    if(typeof listenShop==='function') listenShop(shopId);
  }catch(e){
    alert('Erreur: '+e.message);
    console.error(e);
  }
}

function selectShop(shop){
  SHOP=shop;
  localStorage.setItem('patron_shop',SHOP);
  sessionStorage.setItem('BATEKE_BOUTIQUE',SHOP);
  PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
  let el = document.getElementById('shopSel');
  if(el) el.value=shop;
  if(typeof updateLabels==='function') updateLabels();
  if(typeof refreshAll==='function') refreshAll();
  if(typeof renderAchatStock==='function') renderAchatStock();
  if(typeof renderPanierAchat==='function') renderPanierAchat();
}

function switchShop(){
  SHOP=document.getElementById('shopSel').value;
  selectShop(SHOP);
}
