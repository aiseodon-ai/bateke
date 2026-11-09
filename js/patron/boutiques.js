// js/vendeur/modules/auth.js - V5.6.7 FIX PAUSE PATRON V10.9 + DEVERROUILLE BELVINE
import { STATE } from "../core/state.js";

async function checkPausePatron(shop){
  try{
    if(!window.db) return {ok:true};
    // Lit exactement où ton patron V10.9 écrit
    let snap = await window.db.ref('shops/'+shop+'/config').once('value');
    let config = snap.val()||{};
    let bloque = config.bloqueParPatron===true;
    if(bloque){
      return {ok:false, msg: config.motifSuspend || '⏸️ Boutique en PAUSE par patron - Contacte ton patron'};
    }
    return {ok:true};
  }catch(e){ return {ok:true}; }
}

export async function doLogin(){
  let pinEl = document.getElementById('pinInput');
  let msgEl = document.getElementById('loginMsg');
  let pin = pinEl?.value?.trim();
  let shop = STATE.SHOP || new URLSearchParams(location.search).get('shop') || 'Menkao2';
  
  if(!pin){ msgEl.innerText='Entre PIN'; return; }
  console.log('Tentative PIN', pin, 'shop', shop);
  msgEl.innerText='Vérification...';

  try{
    // 1. VERIF BOUTON PAUSE DE PATRON V10.9
    let check = await checkPausePatron(shop);
    if(!check.ok){
      msgEl.innerHTML = `<div style="background:#fee;padding:12px;border-radius:10px;border:2px solid #111"><b style="color:#111">⏸️ ${check.msg}</b><br><small>${shop} est fermée temporairement par le patron</small></div>`;
      console.log('SHOP PAUSE PAR PATRON V10.9');
      return;
    }

    // 2. LOGIN STABLE D'ORIGINE - cherche vendeur
    let snapV = await window.db.ref('shops/'+shop+'/vendeurs').once('value');
    let vendeurs = snapV.val()||{};
    let trouve = null;
    Object.entries(vendeurs).forEach(([k,v])=>{
      if(String(v.pin||v.PIN||k)===String(pin) || String(v.code||'')===String(pin)) trouve={id:k, ...v};
    });

    if(!trouve){
      // Fallback si pas de vendeurs définis (ancienne boutique)
      console.log('Vendeurs existants:', Object.keys(vendeurs));
      if(Object.keys(vendeurs).length===0){
        trouve={id:'belvine', nom:'belvine'}; // permet belvine si aucun vendeur configuré
      }else{
        msgEl.innerText='PIN incorrect';
        return;
      }
    }

    // 3. DEBLOQUE L'ANCIEN VERROU QUI BLOQUAIT BELVINE
    // C'est ça qui affichait SHOP VERROUILLE ligne 32
    await window.db.ref('shops/'+shop+'/verrou').remove().catch(()=>{});
    await window.db.ref('shops/'+shop+'/locks').remove().catch(()=>{});
    await window.db.ref('shops/'+shop+'/presence').remove().catch(()=>{});

    console.log('✅ LOGIN OK pour', trouve.nom||trouve.id);
    localStorage.setItem('vendeur_session_'+shop, JSON.stringify({pin, ts:Date.now(), vendeur:trouve.nom||'belvine'}));
    localStorage.setItem('BATEKE_SHOP', shop);
    STATE.CURRENT_VENDEUR = trouve;
    window.CURRENT_VENDEUR = trouve;

    document.getElementById('loginOverlay').style.display='none';
    document.getElementById('vendeurName').innerText = trouve.nom||'belvine';
    document.getElementById('shopName').innerText = shop;
    let ls=document.getElementById('loginShopName'); if(ls) ls.innerText='Boutique: '+shop;
    msgEl.innerText='';

  }catch(e){
    console.error(e);
    msgEl.innerText='Erreur: '+e.message;
  }
}

export function logoutAll(){ 
  let shop = STATE.SHOP || new URLSearchParams(location.search).get('shop') || 'Menkao2';
  window.db?.ref('shops/'+shop+'/verrou').remove().catch(()=>{});
  localStorage.clear(); 
  location.reload(); 
}
export function switchShop(){ 
  let sel=document.getElementById('shopSel'); if(sel) location.href='?shop='+encodeURIComponent(sel.value); 
}
