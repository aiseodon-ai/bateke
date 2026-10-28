// app.js - ORCHESTRATEUR V6.4 FIX LOGIN SÉCURISÉ
import "../core/firebase.js";
import "../core/state.js";
import "./sync.js";
import "./auth.js";
import "./tabs.js";
import "./stock.js";
import "./achat.js";
import "./ventes.js";
import "./caisse.js";
import "./vendeurs.js";
import "./crm.js";
import "./dettes.js";
import "./boutiques.js";
import "./rapport.js";
import "./compta.js";
import "./parametres.js";

console.log("✅ BATEKE V6.4 - SHOP:", window.SHOP);

let _initDone = false;

async function secureInit(){
  if(_initDone) return;
  
  let pin = localStorage.getItem('BATEKE_PIN') || localStorage.getItem('pin');
  let role = localStorage.getItem('BATEKE_ROLE');
  const loginDiv = document.getElementById('loginPat');
  
  // 1. Pas de PIN -> montre login et STOP
  if(!pin){
    console.log("🛑 PAS DE PIN - Login requis");
    if(loginDiv) loginDiv.style.display='flex';
    return;
  }
  
  // 2. Superadmin -> OK
  if(role==='superadmin' || pin==='SUPERADMIN'){
    _initDone=true;
    console.log("✅ SUPERADMIN - initShops");
    if(typeof window.initShops === 'function') window.initShops();
    return;
  }
  
  // 3. Vérifie PIN existe VRAIMENT dans Firebase
  try{
    if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously();
    let snap = await firebase.database().ref('patrons/'+pin).once('value');
    if(!snap.exists()){
      // Vérifie si c'est un vendeur
      let shopsSnap = await firebase.database().ref('shops').once('value');
      let shops = shopsSnap.val()||{};
      let isVendeur = false;
      for(let sn in shops){
        let vends = shops[sn].vendeurs||{};
        for(let vk in vends){
          if(String(vends[vk].pin||vk)===pin) isVendeur=true;
        }
      }
      if(!isVendeur){
        console.log(`🛑 PIN ${pin} INTROUVABLE dans patrons ni vendeurs - BLOQUÉ`);
        localStorage.clear();
        sessionStorage.clear();
        if(loginDiv) loginDiv.style.display='flex';
        document.getElementById('msgPat').innerText = `❌ PIN ${pin} INTROUVABLE`;
        document.getElementById('msgPat').style.color='red';
        return;
      }
    }
    // PIN valide -> lance
    _initDone=true;
    console.log(`✅ PIN ${pin} VALIDE - initShops`);
    if(loginDiv) loginDiv.style.display='none';
    if(typeof window.initShops === 'function') window.initShops();
  }catch(e){
    console.error("Erreur secureInit:", e);
    // Si erreur réseau, on laisse login s'afficher mais on ne lance pas les shops
    if(loginDiv) loginDiv.style.display='flex';
  }
}

window.addEventListener('DOMContentLoaded', secureInit);

// Empêche aussi les anciens appels directs
window.secureInit = secureInit;
