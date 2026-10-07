import { STATE } from '../core/state.js';
import { initShops } from './sync.js';
try{firebase.auth().signInAnonymously().catch(()=>{});}catch(e){}

export function loginPat(){
  let raw=(document.getElementById('pinPat').value||'').trim();
  if(!raw){document.getElementById('msgPat').innerText='Tape ton PIN';return;}
  let p=raw.replace(/\D/g,'').trim();
  if(p==='9999'){
    document.getElementById('loginPat').style.display='none';
    localStorage.setItem('patron_logged','yes');
    initShops(); // <- lance listenShop qui charge 446
  }else{
    document.getElementById('msgPat').innerText='❌ PIN incorrect';
  }
}
window.loginPat=loginPat;
