// js/vendeur/modules/auth.js - V5.6.5 - PATRON 7832 ACCES TOTAL
import { STATE } from '../core/state.js';
import { setPresenceOnline } from '../core/presence.js';

const PATRON_PIN = "7832";

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
    if(!STATE.CURRENT_VENDEUR?.isAdmin && !STATE.CURRENT_VENDEUR?.isPatron){
      sel.disabled = true;
      sel.style.display = 'none';
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

function unlockShopForPatron(currentShop){
  STATE._lockedShop = false;
  localStorage.setItem('vendeur_shop', currentShop);
  
  let sel = document.getElementById('shopSel');
  if(sel){
    sel.disabled = false;
    sel.style.display = 'block';
  }
  
  // LISTE FALLBACK si shops/.read bloqué
  let fallbackList = ["Menkao1","Menkao2","Menkao3","Kenge","Kisantu"]; // Mets tes vraies boutiques ici
  
  if(window.db){
    window.db.ref('shops').once('value').then(snap=>{
      let data = snap.val()||{};
      let list = Object.keys(data);
      if(list.length === 0) list = fallbackList;
      if(sel){
        sel.innerHTML = list.map(s=>`<option ${s===currentShop?'selected':''} value="${s}">${s}</option>`).join('');
      }
    }).catch(()=>{
      // Si permission denied, utilise fallback
      if(sel){
        sel.innerHTML = fallbackList.map(s=>`<option ${s===currentShop?'selected':''} value="${s}">${s}</option>`).join('');
      }
    });
  }
  console.log("🔓 PATRON MODE - Sélecteur débloqué");
}

export function doLogin(){
  let pin = (document.getElementById('pinInput')?.value || '').toString().replace(/\D/g,'').trim();
  let msg = document.getElementById('loginMsg');
  if(!pin){ msg.innerText='PIN requis'; return; }
  
  let currentShop = new URLSearchParams(window.location.search).get('shop') || 'Menkao2';
  console.log("Tentative PIN", pin, "shop", currentShop);
  msg.innerText='Vérification '+pin+'...';

  // === 1. SI C'EST LE PATRON 7832 - ACCES TOTAL ===
  if(pin === PATRON_PIN){
    if(!window.db){
      msg.innerText='Firebase pas prêt...';
      return;
    }
    // Vérifie patrons/7832 mais même si offline on laisse passer 7832
    window.db.ref('patrons/7832').once('value').then(snap=>{
      let patronData = snap.val() || { nom: "DG PATRON", code: "7832" };
      
      STATE.CURRENT_VENDEUR = {
        pin: pin,
        nom: patronData.nom || "DG PATRON",
        boutique: "ALL",
        shop: "ALL",
        isAdmin: true,
        admin: true,
        isPatron: true,
        code: patronData.code || "7832"
      };
      window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
      
      localStorage.setItem('vendeur_session_'+currentShop, JSON.stringify({pin, ts:Date.now(), isPatron: true}));
      
      document.getElementById('loginOverlay').style.display='none';
      document.getElementById('vendeurName').innerText = STATE.CURRENT_VENDEUR.nom + " (PATRON)";
      document.getElementById('shopName').innerText = currentShop + " [PATRON]";
      
      unlockShopForPatron(currentShop);
      setPresenceOnline();
      console.log("✅ PATRON 7832 CONNECTE - ACCES TOTAL");
    }).catch(e=>{
      // Même si patrons/7832 non lisible, on autorise 7832 en mode offline patron
      console.warn("Patron node non lisible, mais on autorise 7832:", e.message);
      STATE.CURRENT_VENDEUR = { pin, nom:"DG PATRON", boutique:"ALL", isAdmin:true, admin:true, isPatron:true };
      window.CURRENT_VENDEUR = STATE.CURRENT_VENDEUR;
      document.getElementById('loginOverlay').style.display='none';
      unlockShopForPatron(currentShop);
      setPresenceOnline();
    });
    return;
  }

  // === 2. VENDEUSE NORMALE - LOGIQUE EXISTANTE ===
  let cacheKey = 'bateke_vendeurs_'+currentShop;
  let cached = {};
  try{ cached = JSON.parse(localStorage.getItem(cacheKey)||'{}'); }catch(e){}
  if(cached[pin] && cached[pin].actif !== false){
    let v = cached[pin];
    STATE.CURRENT_VENDEUR={pin, nom:v.nom||pin, boutique:currentShop, ...v, isPatron:false};
    window.CURRENT_VENDEUR=STATE.CURRENT_VENDEUR;
    document.getElementById('loginOverlay').style.display='none';
    document.getElementById('vendeurName').innerText=v.nom;
    document.getElementById('shopName').innerText=currentShop;
    lockShopUI(currentShop);
    setPresenceOnline();
    return;
  }

  if(!window.db){
    msg.innerText='Firebase pas prêt';
    return;
  }

  window.db.ref('shops/'+currentShop+'/vendeurs/'+pin).once('value').then(snap=>{
    let v=snap.val();
    if(!v) throw new Error('PIN '+pin+' inexistant à '+currentShop);
    if(v.actif===false) throw new Error('PIN bloqué');
    cached[pin]=v;
    localStorage.setItem(cacheKey, JSON.stringify(cached));
    STATE.CURRENT_VENDEUR={pin, nom:v.nom||pin, boutique:currentShop, ...v, isPatron:false};
    window.CURRENT_VENDEUR=STATE.CURRENT_VENDEUR;
    localStorage.setItem('vendeur_session_'+currentShop, JSON.stringify({pin, ts:Date.now()}));
    document.getElementById('loginOverlay').style.display='none';
    document.getElementById('vendeurName').innerText=v.nom;
    document.getElementById('shopName').innerText=currentShop;
    lockShopUI(currentShop);
    setPresenceOnline();
  }).catch(e=>{
    msg.innerText='Erreur: '+e.message;
  });
}

export function logoutAll(){ 
  try{ if(STATE.PRESENCE_REF) STATE.PRESENCE_REF.update({online:false,lastSeen:Date.now()}); }catch(e){}
  let shop = STATE.SHOP || STATE._lockedShop || 'Menkao2';
  localStorage.removeItem('vendeur_session_'+shop); 
  location.href='?shop='+encodeURIComponent(shop);
}

export function switchShop(){ 
  // PATRON PEUT SWITCHER, VENDEUSE NON
  if(STATE.CURRENT_VENDEUR?.isPatron || STATE.CURRENT_VENDEUR?.isAdmin){
    let sel=document.getElementById('shopSel')?.value; 
    if(sel){ 
      localStorage.setItem('vendeur_shop', sel); 
      localStorage.setItem('vendeur_session_'+sel, JSON.stringify({pin: PATRON_PIN, ts:Date.now(), isPatron:true}));
      location.href='?shop='+encodeURIComponent(sel); 
    }
    return;
  }
  
  if(STATE._lockedShop){
    let locked = STATE._lockedShop || STATE.SHOP;
    alert('🔒 Boutique verrouillée: '+locked);
    let sel=document.getElementById('shopSel');
    if(sel) sel.value=locked;
    return;
  }
}

window.doLogin=doLogin; window.logoutAll=logoutAll; window.switchShop=switchShop;
console.log("auth.js V5.6.5 PATRON 7832 OK");
