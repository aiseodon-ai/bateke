// js/vendeur/core/firebase.js - V4.9.27 - App Check PROD
console.log("App Check PROD V2 OK");
const firebaseConfig = {
  apiKey: "AIzaSyDUMMY-REPLACE-WITH-YOURS",
  authDomain: "bateke-XXXX.firebaseapp.com",
  databaseURL: "https://bateke-XXXX-default-rtdb.firebaseio.com",
  projectId: "bateke-XXXX",
  appId: "1:XXXX:web:XXXX"
};
if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
window.db = firebase.database();
window.auth = firebase.auth();
window.SHOP = new URLSearchParams(location.search).get('shop') || localStorage.getItem('vendeur_shop') || 'Menkao2';
console.log("BATEKE V4 FINAL - PROD - SHOP:", window.SHOP);
