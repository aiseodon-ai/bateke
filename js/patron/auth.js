// js/vendeur/modules/auth.js - V5.6.4 SECURE PATRON + BOUTIQUE LOCK + APP CHECK
import { STATE } from '../core/state.js';
import { setPresenceOnline, setPresenceOffline } from '../core/presence.js';
import { saveStockCache } from '../core/offline.js';

const CACHE_VERSION = 'v5.6.4-appcheck-20261020';
const PATRON_CACHE_KEY = 'bateke_patrons_cache';

function getLockedShop(vendeurData, currentShop){
  return vendeurData?.boutique || vendeurData?.shop || vendeurData?.boutique_assignee || vendeurData?.shopName || currentShop;
}

function lockShopUI(lockedShop, isPatron){
  STATE.SHOP = lockedShop;
  STATE._lockedShop = isPatron ? null : lockedShop; // ✅ PATRON n'est pas verrouillé
  localStorage.setItem('vendeur_shop', lockedShop);
  if(!isPatron){
    localStorage.setItem('vendeur_shop_locked', lockedShop);
  } else {
    localStorage.removeItem('vendeur_shop_locked');
  }
  
  let sel = document.getElementById('shopSel');
  if(sel){
    if(isPatron){
      // PATRON: peut voir toutes les boutiques
      sel.disabled = false;
      sel.style.display = 'block';
      sel.style.opacity = '1';
      sel.innerHTML = (STATE.SHOPS_LIST||[lockedShop]).map(s=>`<option ${s===lockedShop?'selected':''} value="${s}">${s}</option>`).join('');
    } else {
      // VENDEUR NORMAL: verrouillé
      sel.innerHTML = `<option value="${lockedShop}">${lockedShop}</option>`;
      sel.value = lockedShop;
      sel.disabled = true;
      sel.style.display = 'none';
    }
  }
  let badge = document.getElementById('shopName');
  if(badge) badge.innerText = lockedShop;

  // Force URL ?shop= si vendeur normal
  if(!isPatron){
    let urlShop = new URLSearchParams(window.location.search).get('shop');
    if(urlShop !== lockedShop){
      history.replaceState(null,'','?shop='+encodeURIComponent(lockedShop));
    }
  }
  console.log(isPatron ? "🔓 PATRON ACCES LIBRE:" : "🔒 SHOP VERROUILLE:", lockedShop, "pour", STATE.CURRENT_VENDEUR?.nom);
}

function isPatronAccount(data){
  return data && (data.role==='patron' || data.role==='super_patron' || data.isAdmin || data.admin || data.role==='super_admin');
}

export async function doLogin(){
  let pinEl = document.getElementById('pinInput');
  let msgEl = document.getElementById('loginMsg');
  let pin = pinEl?.value?.trim();
  if(!pin){ if(msgEl) msgEl.innerText='PIN requis'; return; }
  if(msgEl) msgEl.innerText='Verification...';

  let currentShop = STATE.SHOP || new URLSearchParams(window.location.search).get('shop') || localStorage.getItem('vendeur_shop') || 'Menkao1';
  let fireConnected = STATE.FIREBASE_CONNECTED && STATE.IS_ONLINE;

  // ========== 1. CHECK PATRON SECURISE /patrons/{pin} ==========
  try{
    let patronData = null;
    if(fireConnected){
      let snap = await window.db.ref('patrons/'+pin).once('value');
      if(snap.exists()) patronData = snap.val();
    } else {
      let cached = JSON.parse(localStorage.getItem(PATRON_CACHE_KEY)||'{}');
      if(cached[pin] && cached[pin].actif!==false) patronData = cached[pin];
    }

    if(patronData && patronData.actif!==false){
      // Cache patron pour offline 12h
      let cache = JSON.parse(localStorage.getItem(PATRON_CACHE_KEY)||'{}');
      cache[pin]=patronData; localStorage.setItem(PATRON_CACHE_KEY, JSON.stringify(cache));

      if(patronData.mustChangePin){
        window.TEMP_OLD_PIN=pin; window.TEMP_OLD_DATA=patronData; STATE.CURRENT_VENDEUR=patronData;
        document.getElementById('oldPinDisplay').innerText=pin;
        document.getElementById('changePinOverlay').style.display='flex';
        if(msgEl) msgEl.innerText='';
        return;
      }

      STATE.CURRENT_VENDEUR={pin, nom:patronData.nom||'PATRON', ...patronData, isAdmin:true};
      window.CURRENT_VENDEUR=STATE.CURRENT_VENDEUR;
      localStorage.setItem('vendeur_session_'+currentShop, JSON.stringify({pin, ts:Date.now(), isPatron:true}));
      localStorage.setItem('vendeur_nom', patronData.nom||'PATRON');
      localStorage.setItem('vendeur_pin', pin);
      localStorage.setItem('bateke_last_auth_'+currentShop, Date.now().toString());

      document.getElementById('loginOverlay').style.display='none';
      document.getElementById('vendeurName').innerText= (patronData.nom||'PATRON')+' [PATRON]';
      
      lockShopUI(currentShop, true);
      setPresenceOnline();
      if(fireConnected) window.db.ref('patrons/'+pin).update({lastLogin:Date.now()});
      console.log("✅ PATRON SECURISE LOGIN:", patronData.nom, "->", currentShop);
      return;
    }
  }catch(e){ console.warn("Patron check err", e); }

  // ========== 2. CHECK VENDEUR NORMAL ==========
  try{
    let vendeur = null;
    let shopFound = currentShop;

    if(fireConnected){
      let snap = await window.db.ref('shops/'+currentShop+'/vendeurs/'+pin).once('value');
      vendeur = snap.val();
      if(!vendeur){
        // Cherche dans toutes les boutiques
        let allSnap = await window.db.ref('shops').once('value');
        let all = allSnap.val()||{};
        for(let shopName in all){
          if(all[shopName]?.vendeurs?.[pin]){
            vendeur = all[shopName].vendeurs[pin];
            shopFound = getLockedShop(vendeur, shopName);
            break;
          }
        }
      }
    } else {
      // OFFLINE
      let cachedV = JSON.parse(localStorage.getItem('bateke_vendeurs_'+currentShop)||'{}');
      if(cachedV[pin]){ vendeur = cachedV[pin]; }
    }

    if(!vendeur) throw new Error('PIN invalide');
    if(vendeur.actif===false) throw new Error('PIN bloque - Contacte DG');
    
    let lockedShop = getLockedShop(vendeur, shopFound);
    
    // Bloque boutique si shop différent
    let snapBlocked = null;
    if(fireConnected){
      snapBlocked = await window.db.ref('shops/'+lockedShop+'/config/blocked').once('value');
      if(snapBlocked.val()===true) throw new Error('Boutique bloquee');
    }

    if(vendeur.mustChangePin!==false){
      window.TEMP_OLD_PIN=pin; window.TEMP_OLD_DATA=vendeur; STATE.CURRENT_VENDEUR=vendeur;
      document.getElementById('oldPinDisplay').innerText=pin;
      document.getElementById('changePinOverlay').style.display='flex';
      if(msgEl) msgEl.innerText='';
      return;
    }

    STATE.CURRENT_VENDEUR={pin, nom:vendeur.nom||pin, boutique:lockedShop, ...vendeur};
    window.CURRENT_VENDEUR=STATE.CURRENT_VENDEUR;
    localStorage.setItem('vendeur_session_'+lockedShop, JSON.stringify({pin, ts:Date.now()}));
    localStorage.setItem('vendeur_nom', vendeur.nom||pin);
    localStorage.setItem('vendeur_pin', pin);
    localStorage.setItem('bateke_last_auth_'+lockedShop, Date.now().toString());

    // Cache vendeur pour offline
    let cacheV = JSON.parse(localStorage.getItem('bateke_vendeurs_'+lockedShop)||'{}');
    cacheV[pin]=vendeur; localStorage.setItem('bateke_vendeurs_'+lockedShop, JSON.stringify(cacheV));

    document.getElementById('loginOverlay').style.display='none';
    document.getElementById('vendeurName').innerText=vendeur.nom||pin;
    
    lockShopUI(lockedShop, isPatronAccount(vendeur));
    setPresenceOnline();
    if(fireConnected) window.db.ref('shops/'+lockedShop+'/vendeurs/'+pin).update({lastLogin:Date.now()});

  }catch(e){
    if(msgEl) msgEl.innerText='Erreur: '+e.message;
    console.error(e);
  }
}

export function logoutAll(){
  try{ setPresenceOffline(); }catch(e){}
  let shop = STATE.SHOP || STATE._lockedShop || localStorage.getItem('vendeur_shop') || 'Menkao1';
  localStorage.removeItem('vendeur_session_'+shop);
  // Si patron, on libère le lock
  if(STATE.CURRENT_VENDEUR && isPatronAccount(STATE.CURRENT_VENDEUR)){
    localStorage.removeItem('vendeur_shop_locked');
  }
  location.href='?shop='+encodeURIComponent(shop);
}

export function switchShop(){
  // 🔒 BLOQUE SI VENDEUR NORMAL
  let isPatron = STATE.CURRENT_VENDEUR && isPatronAccount(STATE.CURRENT_VENDEUR);
  if(!isPatron && (STATE._lockedShop || STATE.CURRENT_VENDEUR)){
    let locked = STATE._lockedShop || STATE.SHOP;
    alert('Boutique verrouillee: '+locked+' - Vous ne pouvez voir que votre boutique');
    let sel=document.getElementById('shopSel');
    if(sel) sel.value=locked;
    return;
  }
  let sel=document.getElementById('shopSel')?.value;
  if(sel){ localStorage.setItem('vendeur_shop', sel); location.href='?shop='+encodeURIComponent(sel); }
}

window.doLogin=doLogin; window.logoutAll=logoutAll; window.switchShop=switchShop;
console.log("auth.js V5.6.4 SECURE PATRON + LOCK OK -", CACHE_VERSION);
