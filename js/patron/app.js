// app.js - ORCHESTRATEUR V6.7 SECURE SAAS - ORDI COMMUN - sessionStorage + auto-lock 10min
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

console.log("✅ BATEKE V6.7 SECURE - SHOP:", window.SHOP);

let _initDone = false;
let inactivityTimer = null;
const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 min - change à 5 min si tu veux plus strict

function resetInactivityTimer(){
  if(inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(()=>{
    console.log("🔒 Auto-lock 10min inactivité");
    if(window.lockApp) window.lockApp();
  }, INACTIVITY_LIMIT);
}

function startInactivityWatch(){
  ['click','keydown','mousemove','touchstart','scroll'].forEach(ev=>{
    document.addEventListener(ev, resetInactivityTimer, {passive:true});
  });
  resetInactivityTimer();
}

function stopInactivityWatch(){
  if(inactivityTimer) clearTimeout(inactivityTimer);
  ['click','keydown','mousemove','touchstart','scroll'].forEach(ev=>{
    document.removeEventListener(ev, resetInactivityTimer);
  });
}

async function secureInit(){
  if(_initDone) return;
  
  const loginDiv = document.getElementById('loginPat');
  const loader = document.getElementById('appLoader');
  
  // 🔒 SÉCURITÉ ORDI COMMUN: On lit sessionStorage, pas localStorage
  // sessionStorage se vide quand on ferme l'onglet
  let pin = sessionStorage.getItem('BATEKE_PIN') || sessionStorage.getItem('pin');
  let role = sessionStorage.getItem('BATEKE_ROLE') || localStorage.getItem('BATEKE_ROLE');
  
  // 1. Pas de PIN en session -> montre login et STOP
  if(!pin){
    console.log("🛑 PAS DE PIN SESSION - Login requis (ordi commun)");
    if(loader) loader.style.display='none';
    if(loginDiv) loginDiv.style.display='flex';
    stopInactivityWatch();
    return;
  }
  
  // 2. Superadmin -> OK (toi, tu peux rester en localStorage)
  if(role==='superadmin' || pin==='SUPERADMIN'){
    _initDone=true;
    console.log("✅ SUPERADMIN - initShops");
    if(loader) loader.style.display='none';
    if(loginDiv) loginDiv.style.display='none';
    if(typeof window.initShops === 'function') window.initShops();
    startInactivityWatch();
    return;
  }
  
  // 3. Vérifie PIN client SAAS existe VRAIMENT et actif
  try{
    if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously();
    let snap = await firebase.database().ref('patrons/'+pin).once('value');
    if(!snap.exists()){
      console.log(`🛑 PIN ${pin} INTROUVABLE - BLOQUÉ`);
      sessionStorage.clear();
      localStorage.removeItem('BATEKE_PIN');
      if(loader) loader.style.display='none';
      if(loginDiv) loginDiv.style.display='flex';
      const msg = document.getElementById('msgPat');
      if(msg){ msg.innerText = `❌ PIN ${pin} INTROUVABLE`; msg.style.color='red'; }
      stopInactivityWatch();
      return;
    }
    let patron = snap.val();
    if(patron.actif===false){
      console.log(`🛑 PIN ${pin} BLOQUÉ - Abonnement expiré`);
      sessionStorage.clear();
      localStorage.clear();
      if(loader) loader.style.display='none';
      if(loginDiv) loginDiv.style.display='flex';
      const msg = document.getElementById('msgPat');
      if(msg){ msg.innerText = `❌ Abonnement ${pin} expiré`; msg.style.color='red'; }
      stopInactivityWatch();
      return;
    }
    // PIN valide -> lance
    _initDone=true;
    console.log(`✅ CLIENT SAAS ${pin} VALIDE - ${patron.nom} - initShops`);
    if(loader) loader.style.display='none';
    if(loginDiv) loginDiv.style.display='none';
    if(typeof window.initShops === 'function') window.initShops();
    startInactivityWatch();
  }catch(e){
    console.error("Erreur secureInit:", e);
    if(loader) loader.style.display='none';
    if(loginDiv) loginDiv.style.display='flex';
    stopInactivityWatch();
  }
}

// Lock manuel
if(!window.lockApp){
  window.lockApp = function(){
    console.log("🔒 Verrouillage manuel");
    sessionStorage.clear();
    stopInactivityWatch();
    const loginDiv = document.getElementById('loginPat');
    const msg = document.getElementById('msgPat');
    if(loginDiv) loginDiv.style.display='flex';
    if(msg){ msg.innerText='🔒 Verrouillé - Entrez votre PIN'; msg.style.color='#f59e0b'; }
    if(window.db) try{ firebase.database().ref().off(); }catch(e){}
  }
}

window.addEventListener('DOMContentLoaded', secureInit);
window.secureInit = secureInit;
window.resetInactivityTimer = resetInactivityTimer;

console.log("✅ APP.JS V6.7 SECURE ORDI COMMUN CHARGÉ");
