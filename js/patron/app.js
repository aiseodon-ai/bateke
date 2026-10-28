// app.js - ORCHESTRATEUR V6.8 FIX BOUCLE LOGIN
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

console.log("✅ BATEKE V6.8 - SHOP:", window.SHOP);

let _initDone = false;
let inactivityTimer = null;
const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 min

// FIX: garder même référence pour removeEventListener
function resetInactivityTimer(){
  if(inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(()=>{
    console.log("🔒 Auto-lock 10min");
    if(window.lockApp) window.lockApp();
  }, INACTIVITY_LIMIT);
}

function startInactivityWatch(){
  ['click','keydown','mousemove','touchstart'].forEach(ev=>{
    document.addEventListener(ev, resetInactivityTimer, {passive:true});
  });
  resetInactivityTimer();
  console.log("👀 Watch inactivité démarrée");
}

function stopInactivityWatch(){
  if(inactivityTimer) clearTimeout(inactivityTimer);
  ['click','keydown','mousemove','touchstart'].forEach(ev=>{
    document.removeEventListener(ev, resetInactivityTimer);
  });
}

// Tue les vieux PIN localStorage une fois pour toutes
localStorage.removeItem('BATEKE_PIN');
localStorage.removeItem('pin');
localStorage.removeItem('patron_pin');

async function secureInit(){
  if(_initDone) return;
  
  const loginDiv = document.getElementById('loginPat');
  const loader = document.getElementById('appLoader');
  const pinInput = document.getElementById('pinPat');
  
  let pin = sessionStorage.getItem('BATEKE_PIN');
  let role = sessionStorage.getItem('BATEKE_ROLE') || localStorage.getItem('BATEKE_ROLE');
  
  console.log("🔍 secureInit - PIN session:", pin, "ROLE:", role);

  if(!pin){
    console.log("🛑 PAS DE PIN SESSION - Login reste ouvert");
    if(loader) loader.style.display='none';
    if(loginDiv) loginDiv.style.display='flex';
    if(pinInput) pinInput.value='';
    stopInactivityWatch();
    _initDone = false;
    return;
  }
  
  if(role==='superadmin' || pin==='SUPERADMIN'){
    _initDone=true;
    if(loader) loader.style.display='none';
    if(loginDiv) loginDiv.style.display='none';
    if(typeof window._realInitShops === 'function') window._realInitShops();
    else if(typeof window.initShops === 'function') window.initShops();
    startInactivityWatch();
    return;
  }
  
  // Session fraîche < 2 min = on ne revérifie pas Firebase (évite déco après 2 sec)
  try{
    let raw = localStorage.getItem('patron_session');
    let sess = raw ? JSON.parse(raw) : null;
    if(sess && sess.ts && (Date.now() - sess.ts < 120000)){
      console.log(`✅ Session fraîche ${pin} - OK sans Firebase`);
      _initDone=true;
      if(loader) loader.style.display='none';
      if(loginDiv) loginDiv.style.display='none';
      if(typeof window._realInitShops === 'function') window._realInitShops();
      else if(typeof window.initShops === 'function') window.initShops();
      startInactivityWatch();
      return;
    }
  }catch(e){}

  try{
    if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously();
    let snap = await firebase.database().ref('patrons/'+pin).once('value');
    if(!snap.exists()){
      console.log(`🛑 PIN ${pin} INTROUVABLE`);
      sessionStorage.clear();
      if(loader) loader.style.display='none';
      if(loginDiv) loginDiv.style.display='flex';
      const msg = document.getElementById('msgPat');
      if(msg){ msg.innerText=`❌ PIN ${pin} INTROUVABLE`; msg.style.color='red'; }
      stopInactivityWatch();
      return;
    }
    let patron = snap.val();
    if(patron.actif===false){
      sessionStorage.clear();
      localStorage.clear();
      if(loader) loader.style.display='none';
      if(loginDiv) loginDiv.style.display='flex';
      const msg = document.getElementById('msgPat');
      if(msg){ msg.innerText=`❌ Abonnement expiré`; msg.style.color='red'; }
      return;
    }
    _initDone=true;
    console.log(`✅ CLIENT ${pin} VALIDE`);
    if(loader) loader.style.display='none';
    if(loginDiv) loginDiv.style.display='none';
    if(typeof window._realInitShops === 'function') window._realInitShops();
    else if(typeof window.initShops === 'function') window.initShops();
    startInactivityWatch();
  }catch(e){
    // FIX CRITIQUE: en cas d'erreur réseau, on NE déconnecte PAS, on laisse l'app ouverte
    console.error("Erreur Firebase mais on garde session:", e);
    _initDone=true;
    if(loader) loader.style.display='none';
    if(loginDiv) loginDiv.style.display='none';
    if(typeof window._realInitShops === 'function') window._realInitShops();
    else if(typeof window.initShops === 'function') window.initShops();
    startInactivityWatch();
  }
}

// Lock manuel + changer PIN
window.lockApp = function(){
  console.log("🔒 Verrouillage");
  sessionStorage.clear();
  let pinInput = document.getElementById('pinPat');
  if(pinInput) pinInput.value='';
  stopInactivityWatch();
  _initDone=false;
  const loginDiv = document.getElementById('loginPat');
  const msg = document.getElementById('msgPat');
  if(loginDiv) loginDiv.style.display='flex';
  if(msg){ msg.innerText='🔒 Entrez votre PIN'; msg.style.color='#f59e0b'; }
  try{ firebase.database().ref().off(); }catch(e){}
}

window.logoutPat = window.lockApp;

// Protège initShops contre appels sauvages
if(!window._realInitShops && window.initShops){
  window._realInitShops = window.initShops;
}
window.initShops = function(){
  let pin = sessionStorage.getItem('BATEKE_PIN');
  let role = sessionStorage.getItem('BATEKE_ROLE') || localStorage.getItem('BATEKE_ROLE');
  if(!pin && role!=='superadmin'){
    console.log("🛑 initShops bloqué - pas de PIN");
    document.getElementById('loginPat').style.display='flex';
    return;
  }
  if(window._realInitShops) return window._realInitShops();
}

window.addEventListener('DOMContentLoaded', secureInit);
window.secureInit = secureInit;
window.resetInactivityTimer = resetInactivityTimer;

console.log("✅ APP.JS V6.8 FIX BOUCLE CHARGÉ");
