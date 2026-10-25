// js/patron/boutiques.js - V6.0 SAAS FIX NULL + SUPERADMIN
export function renderBoutiques(){
  try{
    let elList = document.getElementById('listShops');
    let elLinks = document.getElementById('allLinks');
    let elSel = document.getElementById('shopSel');
    
    if(!elList){
      console.warn("⚠️ renderBoutiques: #listShops introuvable, skip");
      return;
    }

    // Sécurise les variables globales
    let shops = window.SHOPS_LIST || [];
    let allData = window.ALL_DATA || {};

    if(shops.length === 0){
      elList.innerHTML = `<div style="padding:20px;text-align:center;color:#64748b">
        <b>Aucune boutique</b><br><small>Crée ta première boutique ci-dessus</small>
        <br><br><small style="color:#7c3aed">Mode: ${window.CURRENT_VENDEUR?.isSuperAdmin ? 'SUPERADMIN DG SUPRÊME 👑' : 'PATRON'}</small>
      </div>`;
      if(elLinks) elLinks.innerHTML = `<div style="padding:10px;color:#888">Pas de boutiques</div>`;
      return;
    }

    let html = shops.map(shop=>{
      let nb = allData[shop]?.stock?.length || allData[shop]?.articles?.length || 0;
      return `<div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee;align-items:center">
        <div><b>🏪 ${shop}</b><br><small style="color:#64748b">${nb} articles</small></div>
        <div><button class="btn btn-b" style="width:auto;padding:6px 12px" onclick="selectShop('${shop}')">Ouvrir</button></div>
      </div>`;
    }).join('');

    elList.innerHTML = html;

    if(elLinks){
      elLinks.innerHTML = shops.map(s=>`<div style="padding:8px;border-bottom:1px solid #eee;display:flex;justify-content:space-between">
        <div><b>${s}</b><br><small style="color:#0b5e2f">vendeur.html?shop=${s}</small></div>
        <button class="btn btn-y" style="width:auto;padding:4px 8px;font-size:10px" onclick="navigator.clipboard.writeText(location.origin+'/vendeur.html?shop=${s}')">Copier lien</button>
      </div>`).join('');
    }

    // Met à jour le select si existe
    if(elSel && shops.length > 0){
      // Garde la valeur actuelle
      let current = elSel.value || window.SHOP || localStorage.getItem('patron_shop') || shops[0];
      elSel.innerHTML = shops.map(s=>`<option value="${s}" ${s==current?'selected':''}>${s}</option>`).join('');
    }

    console.log("✅ renderBoutiques OK:", shops.length, "shops");

  }catch(e){
    console.error("renderBoutiques error:", e);
  }
}

export function createShop(){
  try{
    let input = document.getElementById('newShop');
    if(!input){ alert("Champ #newShop introuvable"); return; }
    let n = input.value.trim();
    if(!n) { alert("Nom boutique requis"); return; }
    
    let shopId = n.replace(/[^a-zA-Z0-9]/g,'');
    if(!shopId) shopId = 'shop_'+Date.now();
    
    let db = window.db || firebase.database();
    db.ref('shops/'+shopId+'/config').set({
      nom: n,
      id: shopId,
      created: new Date().toISOString(),
      createdBy: window.CURRENT_VENDEUR?.email || window.CURRENT_VENDEUR?.pin || 'unknown',
      isSuperAdmin: window.CURRENT_VENDEUR?.isSuperAdmin || false
    }).then(()=>{
      alert('✅ Boutique créée: '+n+' ('+shopId+')');
      input.value = '';
      // Force reload shops list
      if(typeof window.initShops === 'function') window.initShops();
      else if(typeof window.loadShops === 'function') window.loadShops();
      else location.reload();
    }).catch(err=>{
      alert("Erreur Firebase: "+err.message);
      console.error(err);
    });
  }catch(e){
    alert("createShop error: "+e.message);
  }
}

export function selectShop(shop){
  try{
    window.SHOP = shop;
    localStorage.setItem('patron_shop', shop);
    let panierKey = 'panier_achat_'+shop;
    window.PANIER_ACHAT = JSON.parse(localStorage.getItem(panierKey)||'[]');
    
    let elSel = document.getElementById('shopSel');
    if(elSel) elSel.value = shop;
    
    if(typeof window.updateLabels === 'function') window.updateLabels();
    if(typeof window.refreshAll === 'function') window.refreshAll();
    
    console.log("✅ Shop sélectionné:", shop);
  }catch(e){
    console.error("selectShop error:", e);
  }
}

window.renderBoutiques = renderBoutiques;
window.createShop = createShop;
window.selectShop = selectShop;

console.log("boutiques.js V6.0 SAAS FIX NULL OK");
