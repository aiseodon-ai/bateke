let SHOP = localStorage.getItem('patron_shop')||'Menkao1';

function getFiltered(){
  if(SHOP==='ALL'){ /* agrège */ }
  else { return ALL_DATA[SHOP]; }
}

function renderPresenceKPI(){
  let s=SHOP==='ALL'?SHOPS_LIST[0]:SHOP;
  let pres=ALL_DATA[s]?.presence||{};
  let vends=ALL_DATA[s]?.vendeurs||{};
  // affiche v.nom depuis ALL_DATA[Menkao1].vendeurs
}

function selectShop(shop){
  SHOP=shop; // <--- c'est un let global, pas window.SHOP
  localStorage.setItem('patron_shop',SHOP);
  PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
  document.getElementById('shopSel').value=shop;
  updateLabels(); // change Présence - Menkao1
  refreshAll(); // appelle renderPresenceKPI() qui lit ALL_DATA[Menkao1]
}

function switchShop(){
  SHOP=document.getElementById('shopSel').value;
  localStorage.setItem('patron_shop',SHOP);
  PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');
  updateLabels(); refreshAll(); renderAchatStock(); renderPanierAchat();
}
