// js/vendeur/modules/auth.js - V5.6.3 SECURE BOUTIQUE LOCK
import { STATE } from '../core/state.js';
import { setPresenceOnline } from '../core/presence.js';

function getLockedShop(vendeurData, currentShop){
  // Original: vendeur peut avoir boutique dans son profil
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
    // 🔒 VERROUILLE - vendeur ne peut pas changer
    if(!STATE.CURRENT_VENDEUR?.isAdmin && !STATE.CURRENT_VENDEUR?.admin){
      sel.disabled = true;
      sel.style.display = 'none'; // cache total pour vendeur normal
      let badge = document.getElementById('shopName');
      if(badge) badge.innerText = lockedShop;
    }else{
      sel.disabled = false;
      sel.style.display = 'block';
    }
  }
  // Force URL ?shop=lockedShop
  let urlShop = new URLSearchParams(window.location.search).get('shop');
  if(urlShop !== lockedShop){
    history.replaceState(null,'','?shop='+encodeURIComponent(lockedShop));
  }
  console.log("🔒 SHOP VERROUILLE:", lockedShop, "pour", STATE.CURRENT_VENDEUR?.nom);
}

export function doLogin(){
  let pin=document.getElementById('pinInput')?.value?.trim(); 
  if(!pin){ document.getElementById('loginMsg').innerText='PIN requis'; return; }
  
  let currentShop = STATE.SHOP || new URLSearchParams(window.location.search).get('shop') || localStorage.getItem('vendeur_shop') || 'Menkao2';
  
  // On cherche le vendeur dans SA boutique actuelle OU dans toutes si pas trouvé
  window.db.ref('shops/'+currentShop+'/vendeurs/'+pin).once('value').then(snap=>{
    let v=snap.val(); 
    if(!v){
      // Essaye de trouver dans les autres boutiques si vendeur a une boutique assignée
      return window.db.ref('shops').once('value').then(allShopsSnap=>{
        let all = allShopsSnap.val()||{};
        for(let shopName in all){
          if(all[shopName]?.vendeurs?.[pin]){
            let found = all[shopName].vendeurs[pin];
            if(found.actif===false) throw new Error('PIN bloqué');
            let locked = getLockedShop(found, shopName);
            // Si vendeur appartient à une autre boutique que celle de l'URL, on le redirige
            if(locked !== currentShop){
              console.log(`Vendeur ${found.nom} appartient à ${locked}, pas ${currentShop} -> redirection`);
            }
            return {vendeur:found, shop:locked};
          }
        }
        throw new Error('PIN invalide');
      });
    }
    if(v.actif===false) throw new Error('PIN invalide ou bloqué');
    return {vendeur:v, shop:getLockedShop(v, currentShop)};
  }).then(res=>{
    let v = res.vendeur || res;
    let lockedShop = res.shop || getLockedShop(v, currentShop);
    
    // 🔒 VERROUILLE ICI
    STATE.CURRENT_VENDEUR={pin, nom:v.nom||pin, boutique:lockedShop, ...v}; 
    window.CURRENT_VENDEUR=STATE.CURRENT_VENDEUR;
    localStorage.setItem('vendeur_session_'+lockedShop, JSON.stringify({pin, ts:Date.now()}));
    localStorage.setItem('vendeur_nom', v.nom);
    localStorage.setItem('vendeur_pin', pin);
    
    document.getElementById('loginOverlay').style.display='none';
    document.getElementById('vendeurName').innerText=v.nom; 
    document.getElementById('shopName').innerText=lockedShop;
    
    lockShopUI(lockedShop);
    setPresenceOnline();
  }).catch(e=>{ 
    document.getElementById('loginMsg').innerText='Erreur: '+e.message; 
    console.error(e);
  });
}

export function logoutAll(){ 
  try{ if(STATE.PRESENCE_REF) STATE.PRESENCE_REF.update({online:false,lastSeen:Date.now()}); }catch(e){}
  let shop = STATE.SHOP || STATE._lockedShop;
  localStorage.removeItem('vendeur_session_'+shop); 
  // On garde vendeur_shop verrouillé pour éviter switch
  location.href='?shop='+encodeURIComponent(shop || 'Menkao2');
}

export function switchShop(){ 
  // 🔒 BLOQUE SI VENDEUR NORMAL
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
console.log("auth.js chargé - BOUTIQUE LOCK ACTIF");
