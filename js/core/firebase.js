// firebase.js - INIT UNIQUE - COLLE TA VRAIE CONFIG ICI
// ==== TA VRAIE CONFIG FIREBASE - BATEKE-V4 ====
export const FIREBASE_CONFIG = {
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
export const db = firebase.database();
export const auth = firebase.auth();
window.db = db;
window.auth = auth;
