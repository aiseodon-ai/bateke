// js/core/firebase.js - BATEKE V4 - CONFIG RÉELLE EXTRAITE DE pantron.txt
const firebaseConfig = {
  apiKey: "AIzaSyBOD42Ibg7tGVafz44cwCyI0CUjgAn5MNY",
  authDomain: "bateke-v4.firebaseapp.com",
  databaseURL: "https://bateke-v4-default-rtdb.firebaseio.com",
  projectId: "bateke-v4",
  storageBucket: "bateke-v4.firebasestorage.app",
  messagingSenderId: "321333206282",
  appId: "1:321333206282:web:6d1603446be3d195de6ef3"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const auth = firebase.auth();

// Expose global pour compatibilité avec tes anciens fichiers
window.db = db;
window.auth = auth;
window.firebaseConfig = firebaseConfig;

// Auth anonyme comme dans ton V4.9.25 original
try {
  firebase.auth().signInAnonymously().catch(()=>{});
} catch(e) {}

export { db, auth };
console.log("🔥 Firebase OK - bateke-v4 connecté:", firebaseConfig.projectId);
