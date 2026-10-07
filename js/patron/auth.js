import { STATE } from '../core/state.js';
import { initShops, loadPatronCache, initShopsOffline } from './sync.js';
try{firebase.auth().signInAnonymously().catch(()=>{});}catch(e){}

export function hashVendeurPin(pin){
  let salt='BATEKE_ANTI_TRICHE_2024'; let str=String(pin)+salt; let h=5381;
  for(let i=0;i<str.length;i++){h=((h<<5)+h)+str.charCodeAt(i);h=h&h;}
  let b64=btoa(String(pin)).replace(/=/g,''); return 'HASH_'+Math.abs(h).toString(16).toUpperCase().slice(0,8)+'_'+b64.slice(0,4)+'🔒';
}
export function checkSuperPin(raw){return ["2009","BATEKE2024","SUPER9999"].includes(raw.trim());}

export function loginPat(){
  let raw=(document.getElementById('pinPat').value||'').trim();
  if(!raw){document.getElementById('msgPat').innerText='Tape 9999';return;}
  if(checkSuperPin(raw)){
    document.getElementById('loginPat').style.display='none'; localStorage.setItem('patron_logged','yes'); localStorage.setItem('bateke_isSuper','1');
    STATE.isSuperAdmin=true; window.isSuperAdmin=true; loadPatronCache(); initShopsOffline(); setTimeout(()=>initShops(),800); return;
  }
  let p=raw.replace(/\D/g,'').trim();
  if(p==='9999'||p.length>=3){
    document.getElementById('loginPat').style.display='none'; localStorage.setItem('patron_logged','yes');
    STATE.isSuperAdmin=false; localStorage.removeItem('bateke_isSuper'); loadPatronCache(); initShopsOffline(); setTimeout(()=>initShops(),800);
  }else{document.getElementById('msgPat').innerText='Tape 9999';}
}
window.loginPat=loginPat; window.hashVendeurPin=hashVendeurPin; window.checkSuperPin=checkSuperPin;
