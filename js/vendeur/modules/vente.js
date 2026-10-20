// js/vendeur/modules/vente.js - V5.6.3 FIX SEARCH VIDE + TICKET 58MM
import { STATE } from '../core/state.js';
import { saveStockCache, saveQueue, updateOfflineUI } from '../core/offline.js';

export function addPanier(){
  let code=document.getElementById('codeArt')?.value?.trim(); 
  if(!code) return alert('Choisis article');
  let art=STATE.STOCK.find(s=>s.CODE===code); 
  if(!art) return alert('CODE introuvable');
  let prixUnit = art['Prix Unit'] || art.Prix || parseFloat(document.getElementById('pvArt')?.value||0) || 0;
  if(!prixUnit) return alert('Prix 0 pour '+code);
  let qte=parseFloat(document.getElementById('qteArt')?.value||1); 
  if(qte<=0) qte=1;
  if(qte>(art.Quantite||0)) return alert('Stock insuffisant: '+art.Quantite);
  let ex=STATE.PANIER.find(p=>p.CODE===code); 
  if(ex){ ex.qty+=qte; ex.prix=prixUnit; ex.Prix=prixUnit; }
  else {
    STATE.PANIER.push({
      CODE:code, 
      Designation:art.Designation, 
      Prix:prixUnit, 
      prix:prixUnit,
      PA:art['Prix Achat']||Math.round(prixUnit*0.7), 
      qty:qte
    });
  }
  window.PANIER=STATE.PANIER; 
  renderPanier();

  // ✅ FIX: vide TOUS les champs après ajout
  let searchEl=document.getElementById('searchArt');
  if(searchEl) searchEl.value='';
  let suggestEl=document.getElementById('suggest');
  if(suggestEl) suggestEl.innerHTML='';
  document.getElementById('codeArt').value='';
  document.getElementById('pvArt').value='';
  document.getElementById('qteArt').value='1';
  if(searchEl) searchEl.focus();
}

// ✅ FIX SEARCH ARTICLE VENTE - vide après sélection
export function searchArticle(){
  let q=(document.getElementById('searchArt')?.value||'').trim().toLowerCase();
  let suggest=document.getElementById('suggest');
  if(!suggest) return;
  if(q.length<2){ suggest.innerHTML=''; return; }
  let res=STATE.STOCK.filter(s=> (s.CODE?.toLowerCase().includes(q) || s.Designation?.toLowerCase().includes(q))).slice(0,8);
  suggest.innerHTML=res.map(s=>`
    <div onclick="selectArtVente('${s.CODE}')" style="padding:6px;border-bottom:1px solid #eee;cursor:pointer">
      <b>${s.CODE}</b> - ${s.Designation.substring(0,35)} <small style="float:right">${(s.Quantite||0)} | ${s['Prix Unit']||s.Prix||0} FC</small>
    </div>`).join('');
}

export function selectArtVente(code){
  let art=STATE.STOCK.find(s=>s.CODE===code);
  if(!art) return;
  document.getElementById('codeArt').value=art.CODE;
  document.getElementById('pvArt').value=art['Prix Unit']||art.Prix||0;
  document.getElementById('qteArt').value=1;
  // vide recherche direct
  document.getElementById('searchArt').value='';
  document.getElementById('suggest').innerHTML='';
  document.getElementById('qteArt').focus();
}

export function renderPanier(){
  let list=document.getElementById('panierList'); if(!list) return;
  if(!STATE.PANIER.length) list.innerHTML='Panier vide'; 
  else list.innerHTML=STATE.PANIER.map((p,i)=>{
    let pr=p.prix||p.Prix||0;
    return `<div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid #eee"><span><b>${p.CODE}</b> x${p.qty}</span> <span>${(pr*p.qty).toLocaleString()} FC <button onclick="removePanier(${i})" style="background:red;color:#fff;border:none;border-radius:4px">🗑️</button></span></div>`;
  }).join('');
  let brut=STATE.PANIER.reduce((s,p)=>s+((p.prix||p.Prix||0)*p.qty),0); 
  let rem=parseFloat(document.getElementById('remise')?.value||0); if(rem>5) rem=5; 
  let remVal=brut*rem/100; let final=brut-remVal;
  if(document.getElementById('totalPanier')) document.getElementById('totalPanier').innerText=brut.toLocaleString()+' FC';
  if(document.getElementById('totalFinal')) document.getElementById('totalFinal').innerText=final.toLocaleString()+' FC';
  if(document.getElementById('remiseInfo')) document.getElementById('remiseInfo').innerText= rem>0?`Remise ${rem}% = -${remVal.toLocaleString()} FC`:'';
  window.printLastSale = ()=>{ 
    let v=STATE.LAST_VENTE || JSON.parse(localStorage.getItem('last_vente_'+STATE.SHOP)||'null'); 
    if(!v) return alert('Aucune vente'); 
    window.imprimerVenteUniverselle(v); 
  };
}

export function removePanier(i){ STATE.PANIER.splice(i,1); renderPanier(); }
export function checkRemise(){ let r=parseFloat(document.getElementById('remise')?.value||0); if(r>5){ alert('Max 5%'); document.getElementById('remise').value=5; renderPanier(); } }

export async function validerVente(){
  if(!STATE.PANIER.length) return alert('Panier vide'); 
  if(!STATE.CURRENT_VENDEUR) return alert('Login requis');
  let brut=STATE.PANIER.reduce((s,p)=>s+((p.prix||p.Prix||0)*p.qty),0); 
  let rem=parseFloat(document.getElementById('remise')?.value||0)||0; 
  let final=brut-brut*rem/100;
  let id=Date.now(); 
  let vente={
    id:id, date:new Date().toISOString(), boutique:STATE.SHOP, 
    vendeur:STATE.CURRENT_VENDEUR.nom, vendeurNom:STATE.CURRENT_VENDEUR.nom, vendeurPin:STATE.CURRENT_VENDEUR.pin, 
    items:STATE.PANIER.map(p=>({CODE:p.CODE, Designation:p.Designation, Prix:p.Prix||p.prix, prix:p.prix||p.Prix, qty:p.qty, qte:p.qty})), 
    totalBrut:brut, remise:rem, total:final, 
    client:{nom:document.getElementById('clientNom')?.value||'', tel:document.getElementById('clientTel')?.value||''}, 
    payMode:document.getElementById('payMode')?.value||'cash', offline:!STATE.FIREBASE_CONNECTED
  };
  if(!STATE.IS_ONLINE||!STATE.FIREBASE_CONNECTED){
    let updates=STATE.PANIER.map(it=>{ let st=STATE.STOCK.find(s=>s.CODE===it.CODE); return {CODE:it.CODE, newQte:Math.max(0,(st?.Quantite||0)-it.qty)}; });
    STATE.OFFLINE_QUEUE.push({type:'vente', id, shop:STATE.SHOP, data:vente, stockUpdates:updates}); saveQueue();
    updates.forEach(u=>{ let st=STATE.STOCK.find(s=>s.CODE===u.CODE); if(st) st.Quantite=u.newQte; }); saveStockCache();
  }else{
    try{ 
      for(let it of STATE.PANIER){ 
        let ref=window.db.ref('shops/'+STATE.SHOP+'/stock/'+it.CODE+'/Quantite'); 
        let res=await ref.transaction(q=>{ if(q===null||q<it.qty) return; return q-it.qty; }); 
        if(!res.committed){ alert('❌ Stock insuffisant '+it.CODE); return; } 
        let st=STATE.STOCK.find(s=>s.CODE===it.CODE); if(st) st.Quantite=res.snapshot.val(); 
      } 
      await window.db.ref('shops/'+STATE.SHOP+'/ventes/'+id).set(vente); saveStockCache(); 
    }catch(e){ alert('❌ '+e.message); return; }
  }
  STATE.PANIER=[]; STATE.LAST_VENTE=vente; window.LAST_VENTE=vente;
  localStorage.setItem('last_vente_'+STATE.SHOP, JSON.stringify(vente));
  renderPanier(); 
  document.getElementById('codeArt').value=''; document.getElementById('searchArt').value=''; document.getElementById('suggest').innerHTML='';
  document.getElementById('qteArt').value='1'; document.getElementById('remise').value=0; 
  window.renderVentesJour?.(); window.renderStock?.(); window.updateKPI?.(); updateOfflineUI(); 
  let cfg = STATE.TICKET_CONFIG || window.CURRENT_CONFIG || {};
  let autoPrint = cfg.imprimante?.autoPrint || cfg.autoPrint || false;
  if(autoPrint){
    window.imprimerVenteUniverselle?.(vente);
    alert(`✅ Vente: ${final.toLocaleString()} FC\n🖨️ Ticket envoyé`);
  } else {
    if(confirm(`✅ Vente: ${final.toLocaleString()} FC\n\n🖨️ Imprimer ticket 58mm ?`)){
      window.imprimerVenteUniverselle?.(vente);
    }
  }
}
export function renderVentesJour(){
  let el=document.getElementById('ventesJour'); if(!el) return;
  let today=new Date().toDateString(); 
  let vToday=(STATE.VENTES||[]).filter(v=> new Date(v.date).toDateString()===today).slice(0,20);
  let vQueue=STATE.OFFLINE_QUEUE.filter(q=>q.type==='vente').map(q=>q.data).filter(v=> new Date(v.date).toDateString()===today);
  let all=[...vToday,...vQueue].sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,20);
  el.innerHTML=all.map(v=>`<tr><td>${new Date(v.date).toLocaleTimeString()}</td><td>${v.vendeurNom||''}</td><td>${v.client?.nom||''}</td><td>${(v.items||[]).map(i=>i.CODE+' x'+(i.qty||i.qte||0)).join(', ')}</td><td>${(v.total||0).toLocaleString()}</td><td>${v.offline?'🔴':'🟢'}</td></tr>`).join('')||'<tr><td colspan=6>Aucune</td></tr>';
}

window.addPanier=addPanier; window.searchArticle=searchArticle; window.selectArtVente=selectArtVente; window.selectArt=selectArtVente;
window.renderPanier=renderPanier; window.removePanier=removePanier; window.checkRemise=checkRemise; window.validerVente=validerVente; window.vendre=validerVente; window.renderVentesJour=renderVentesJour;
