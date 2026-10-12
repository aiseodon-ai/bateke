export function renderBoutiques(){
  let html=SHOPS_LIST.map(shop=>`<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #eee"><div><b>${shop}</b><br><small>${(ALL_DATA[shop]?.stock?.length||0)} articles</small></div><div><button class="btn btn-b" style="width:auto" onclick="selectShop('${shop}')">Ouvrir</button></div></div>`).join('');
  document.getElementById('listShops').innerHTML=html;
  document.getElementById('allLinks').innerHTML=SHOPS_LIST.map(s=>`<div style="padding:6px;border-bottom:1px solid #eee"><b>${s}</b><br><small>vendeur.html?shop=${s}</small></div>`).join('');
}
export function createShop(){
  let n=document.getElementById('newShop').value.trim(); if(!n) return;
  db.ref('shops/'+n.replace(/[^a-zA-Z0-9]/g,'')+'/config').set({created:new Date().toISOString()});
  alert('Boutique créée: '+n);
}
export function selectShop(shop){
  SHOP=shop; localStorage.setItem('patron_shop',SHOP);
  PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
  document.getElementById('shopSel').value=shop;
  updateLabels(); refreshAll();
}
window.renderBoutiques=renderBoutiques; window.createShop=createShop; window.selectShop=selectShop;
