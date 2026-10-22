// js/vendeur/modules/auth.js - V5.6.4 ETAPE 1 - FIX PIN ESPACES
import { STATE } from '../core/state.js';
import { setPresenceOnline } from '../core/presence.js';

function getLockedShop(vendeurData, currentShop){
  return vendeurData?.boutique || vendeurData?.shop || vendeurData?.boutique_assignee || vendeurData?.shopName || currentShop;
}

function lockShopUI(lockedShop){
  STATE.SHOP = lockedShop;
  STATE._lockedShop = lockedShop;
  localStorage.setItem('vendeur_shop', lockedShop);
  
  let sel = document.getElementById('shopSel');
  if(sel){
    sel.innerHTML = `<option value="${lockedShop}">${lockedShop}</option>`;
    sel.value = lockedShop;
    if(!STATE.CURRENT_VENDEUR?.isAdmin && !STATE.CURRENT_VENDEUR?.admin){
      sel.disabled = true;
      sel.style.display = 'none';
      let badge = document.getElementById('shopName');
      if(badge) badge.innerText = lockedShop;
    }else{
      sel.disabled = false;
      sel.style.display = 'block';
    }
  }
  let urlShop = new URLSearchParams(window.location.search).get('shop');
  if(urlShop !== lockedShop){
    history.replaceState(null,'','?shop='+encodeURIComponent(lockedShop));
  }
  console.log("🔒 SHOP VERROUILLE:", lockedShop, "pour", STATE.CURRENT_VENDEUR?.nom);
}

export function doLogin(){
  let pin = (document.getElementById('pinInput')?.value || '').toString().replace(/\D/g,'').trim();
  let msg = document.getElementById('loginMsg');
  if(!pin){ msg.innerText='PIN requis'; return; }
  
  let currentShop = new URLSearchParams(window.location.search).get('shop') || 'Menkao2';
  console.log("Tentative PIN", pin, "shop", currentShop, "db:", !!window.db, "AUTH_READY:", window.AUTH_READY);
  msg.innerText='Vérification '+pin+'...';

  // 1. Essaie cache local d'abord (comme ton téléphone)
  let cacheKey = 'bateke_vendeurs_'+currentShop;
  let cached = {};
  try{ cached = JSON.parse(localStorage.getItem(cacheKey)||'{}'); }catch(e){}
  if(cached[pin] && cached[pin].actif !== false){
    console.log("LOGIN OFFLINE CACHE OK", cached[pin]);
    let v = cached[pin];
    STATE.CURRENT_VENDEUR={pin, nom:v.nom||pin, boutique:currentShop, ...v};
    window.CURRENT_VENDEUR=STATE.CURRENT_VENDEUR;
    document.getElementById('loginOverlay').style.display='none';
    document.getElementById('vendeurName').innerText=v.nom;
    document.getElementById('shopName').innerText=currentShop;
    lockShopUI(currentShop);
    setPresenceOnline();
    return;
  }

  // 2. Si pas en cache, il faut Firebase
  if(!window.db){
    msg.innerText='Firebase pas prêt - attends 3 sec et réessaye. Si persiste, vérifie date/heure du téléphone';
    console.error("window.db undefined - App Check bloqué?");
    return;
  }

  window.db.ref('shops/'+currentShop+'/vendeurs/'+pin).once('value').then(snap=>{
    let v=snap.val();
    if(!v) throw new Error('PIN '+pin+' inexistant à '+currentShop);
    if(v.actif===false) throw new Error('PIN bloqué');
    // Sauve en cache pour la prochaine fois (comme ton tel)
    cached[pin]=v;
    localStorage.setItem(cacheKey, JSON.stringify(cached));
    STATE.CURRENT_VENDEUR={pin, nom:v.nom||pin, boutique:currentShop, ...v};
    window.CURRENT_VENDEUR=STATE.CURRENT_VENDEUR;
    localStorage.setItem('vendeur_session_'+currentShop, JSON.stringify({pin, ts:Date.now()}));
    document.getElementById('loginOverlay').style.display='none';
    document.getElementById('vendeurName').innerText=v.nom;
    document.getElementById('shopName').innerText=currentShop;
    lockShopUI(currentShop);
    setPresenceOnline();
  }).catch(e=>{
    msg.innerText='Erreur: '+e.message;
    console.error(e);
  });
}

export function logoutAll(){ 
  try{ if(STATE.PRESENCE_REF) STATE.PRESENCE_REF.update({online:false,lastSeen:Date.now()}); }catch(e){}
  let shop = STATE.SHOP || STATE._lockedShop;
  localStorage.removeItem('vendeur_session_'+shop); 
  location.href='?shop='+encodeURIComponent(shop || 'Menkao2');
}

export function switchShop(){ 
  if(STATE._lockedShop || (STATE.CURRENT_VENDEUR && !STATE.CURRENT_VENDEUR.isAdmin && !STATE.CURRENT_VENDEUR.admin)){
    let locked = STATE._lockedShop || STATE.SHOP;
    alert('🔒 Boutique verrouillée: '+locked+' - Vous ne pouvez voir que votre boutique');
    let sel=document.getElementById('shopSel');
    if(sel) sel.value=locked;
    return;
  }
  let sel=document.getElementById('shopSel')?.value; 
  if(sel){ localStorage.setItem('vendeur_shop', sel); location.href='?shop='+encodeURIComponent(sel); } 
}

window.doLogin=doLogin; window.logoutAll=logoutAll; window.switchShop=switchShop;
console.log("auth.js chargé - ETAPE 1 FIX PIN OK");
