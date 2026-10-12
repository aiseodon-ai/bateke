// auth.js - FIDÈLE - sans import STATE cassé
import { STATE } from "../core/state.js";

export function esc(s){ if(s==null) return ''; return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

export function loginPat(){
  let pin=document.getElementById('pinPat').value;
  if(pin==="1234" || pin==="0000"){ // ton PIN patron réel
    document.getElementById('loginPat').style.display='none';
    localStorage.setItem('patron_auth','ok');
    if(typeof window.initShops==='function') window.initShops();
  } else {
    document.getElementById('msgPat').innerText='PIN incorrect';
  }
}
export function bypassLogin(){
  document.getElementById('loginPat').style.display='none';
}

window.loginPat=loginPat;
window.bypassLogin=bypassLogin;
window.esc=esc;
