// js/vendeur/modules/vente.js - SECURE OFFLINE
import { STATE } from '../core/state.js';
import { saveQueue, saveStockCache, updateOfflineUI } from '../core/offline.js';
import { logPresence } from '../core/presence.js';

export function addPanier(){
  let code=document.getElementById('codeArt')?.value?.trim(); if(!code) return alert('Choisis article');
  let pv=parseFloat(document.getElementById('pvArt')?.value||0);
  let qte=parseFloat(document.getElementById('qteArt')?.value||1); if(qte<=0) qte=1;
  let art=STATE.STOCK.find(s=>s.CODE===code); if(!art) return;
  if(qte > (art.Quantite||0)) return alert('Stock insuffisant: '+art.Quantite);
  let ex=STATE.PANIER.find(p=>p.CODE===code); if(ex) ex.qty+=qte; else STATE.PANIER.push({CODE:code, Designation:art.Designation, qty:qte, prix:pv, PV:pv});
  window.PANIER=STATE.PANIER; renderPanier();
}
export function renderPanier(){
  let list=document.getElementById('panierList'); if(!list) return;
  if(!STATE.PANIER.length){ list.innerHTML='Panier vide'; }
  else{
    list.innerHTML=STATE.PANIER.map((p,i)=>`<div class="panierItem"><span>${p.CODE} x${p.qty}</span><span>${(p.prix*p.qty).toLocaleString()} FC <button onclick="removePanier(${i})">🗑️</button></span></div>`).join('');
  }
  let brut=STATE.PANIER.reduce((s,p)=>s+(p.prix*p.qty),0);
  let rem=parseFloat(document.getElementById('remise')?.value||0); if(rem>5) rem=5;
  let remVal=brut*rem/100; let final=brut-remVal;
  if(document.getElementById('totalPanier')) document.getElementById('totalPanier').innerText=brut.toLocaleString()+' FC';
  if(document.getElementById('totalFinal')) document.getElementById('totalFinal').innerText=final.toLocaleString()+' FC';
  if(document.getElementById('remiseInfo')) document.getElementById('remiseInfo').innerText= rem>0 ? `Remise ${rem}% = -${remVal.toLocaleString()} FC` : '';
}
export function removePanier(i){ STATE.PANIER.splice(i,1); renderPanier(); }
export function clearArticleFields(){ ['codeArt','pvArt','qteArt','designArt','stockArt'].forEach(id=>{ let el=document.getElementById(id); if(el) el.value=id==='qteArt'?'1':''; }); }
export function checkRemise(){ let r=parseFloat(document.getElementById('remise')?.value||0); if(r>5){ alert('Max 5%'); document.getElementById('remise').value=5; } }

export async function vendre(){
  if(!STATE.PANIER.length) return alert('Panier vide');
  if(!STATE.CURRENT_VENDEUR) return alert('Login requis');
  let brut=STATE.PANIER.reduce((s,p)=>s+(p.prix*p.qty),0);
  let rem=parseFloat(document.getElementById('remise')?.value||0)||0; let remVal=brut*rem/100; let final=brut-remVal;
  let client={nom:document.getElementById('clientNom')?.value||'', tel:document.getElementById('clientTel')?.value||''};
  let payMode=document.getElementById('payMode')?.value||'cash';
  let paye=parseFloat(document.getElementById('montantPaye')?.value||final);
  let id=Date.now();
  let vente={date:new Date().toISOString(), boutique:STATE.SHOP, vendeur:STATE.CURRENT_VENDEUR.nom, vendeurNom:STATE.CURRENT_VENDEUR.nom, vendeurPin:STATE.CURRENT_VENDEUR.pin, items:STATE.PANIER, totalBrut:brut, remise:rem, remiseVal:remVal, total:final, client, payMode, montantPaye:paye, offline:!STATE.FIREBASE_CONNECTED};

  if(!STATE.IS_ONLINE || !STATE.FIREBASE_CONNECTED){
    // OFFLINE - queue
    let updates=STATE.PANIER.map(it=>{ let st=STATE.STOCK.find(s=>s.CODE===it.CODE); return {CODE:it.CODE, newQte: Math.max(0,(st?.Quantite||0)-it.qty)}; });
    STATE.OFFLINE_QUEUE.push({type:'vente', id, shop:STATE.SHOP, data:vente, stockUpdates:updates});
    saveQueue();
    updates.forEach(u=>{ let st=STATE.STOCK.find(s=>s.CODE===u.CODE); if(st) st.Quantite=u.newQte; });
    saveStockCache(); logPresence('VENTE OFFLINE', final+' FC');
    alert('✅ Vente OFFLINE mise en attente: '+final.toLocaleString()+' FC');
  }else{
    try{
      // SECURE transaction stock
      for(let it of STATE.PANIER){
        let ref=window.db.ref('shops/'+STATE.SHOP+'/stock/'+it.CODE+'/Quantite');
        let result=await ref.transaction(q=>{ if(q===null||q<it.qty) return; return q-it.qty; });
        if(!result.committed){ alert('❌ Stock insuffisant '+it.CODE); return; }
        let st=STATE.STOCK.find(s=>s.CODE===it.CODE); if(st) st.Quantite=result.snapshot.val();
      }
      await window.db.ref('shops/'+STATE.SHOP+'/ventes/'+id).set(vente);
      saveStockCache(); logPresence('VENTE', final+' FC');
      alert('✅ Vente SECURISEE: '+final.toLocaleString()+' FC');
    }catch(e){ alert('❌ Erreur vente: '+e.message); return; }
  }
  STATE.PANIER=[]; window.PANIER=[]; renderPanier(); clearArticleFields();
  document.getElementById('clientNom').value=''; document.getElementById('clientTel').value=''; document.getElementById('montantPaye').value=''; document.getElementById('remise').value=0;
  if(window.renderVentesJour) window.renderVentesJour(); if(window.renderStock) window.renderStock(); if(window.updateKPI) window.updateKPI(); updateOfflineUI();
}

export function renderVentesJour(){
  let el=document.getElementById('ventesJour'); if(!el) return;
  let today=new Date().toDateString();
  let vToday=(STATE.VENTES||[]).filter(v=> new Date(v.date).toDateString()===today).slice(0,20);
  let vQueue=STATE.OFFLINE_QUEUE.filter(q=>q.type==='vente').map(q=>q.data).filter(v=> new Date(v.date).toDateString()===today);
  let all=[...vToday,...vQueue].sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,20);
  el.innerHTML=all.map(v=>{ let syncLabel=v.offline?'<span style="background:#ef4444;color:#fff;padding:2px 6px;border-radius:10px">OFFLINE</span>':'<span style="background:#22c55e;padding:2px 6px;border-radius:10px">SYNC</span>'; return `<tr><td>${new Date(v.date).toLocaleTimeString()}</td><td>${v.vendeurNom||''}</td><td>${v.client?.nom||''}</td><td>${(v.items||[]).map(i=>i.CODE+' x'+i.qty).join(', ')}</td><td>${(v.total||0).toLocaleString()}</td><td>${syncLabel}</td></tr>`; }).join('')||'<tr><td colspan=6>Aucune vente</td></tr>';
}
window.addPanier=addPanier; window.renderPanier=renderPanier; window.removePanier=removePanier; window.vendre=vendre; window.renderVentesJour=renderVentesJour; window.checkRemise=checkRemise;
