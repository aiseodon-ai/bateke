// js/vendeur/app.js - V5.6.3 SECURE - FIX FINAL - Menkao2 644 articles
import "./core/firebase.js";
import "./core/state.js";

function esc(t){ if(t==null) return ''; return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
window.esc=esc;

const CACHE_12H=12*60*60*1000;
function isCacheExpired(){ let ts=parseInt(localStorage.getItem('bateke_cache_ts_'+STATE.SHOP)||'0'); return !ts || (Date.now()-ts)>CACHE_12H; }
function saveStockCache(){ localStorage.setItem('bateke_stock_'+STATE.SHOP, JSON.stringify(STATE.STOCK)); localStorage.setItem('bateke_cache_ts_'+STATE.SHOP, Date.now().toString()); }
function saveQueue(){ localStorage.setItem('offline_queue_'+STATE.SHOP, JSON.stringify(STATE.OFFLINE_QUEUE)); }
function updateOfflineUI(){
  let q=STATE.OFFLINE_QUEUE.length; let badge=document.getElementById('offlineBadge'); let qInfo=document.getElementById('queueInfo');
  if(qInfo) qInfo.innerText= q ? `🔴 OFFLINE ${q} en attente` : `🟢 SYNC OK - ${STATE.STOCK.length} articles`;
  if(badge){ if(isCacheExpired()){ badge.style.background='#000'; badge.innerText='⚠️ CACHE EXPIRE'; } else if(!STATE.IS_ONLINE||!STATE.FIREBASE_CONNECTED){ badge.style.background='#ef4444'; badge.innerText= q?`🔴 OFFLINE ${q}`:'🔴 HORS LIGNE'; } else if(q>0){ badge.style.background='#facc15'; badge.innerText=`🟡 SYNC ${q}...`; } else { badge.style.background='#22c55e'; badge.innerText='🟢 SYNC OK'; } }
  let src=document.getElementById('stockSource'); if(src) src.innerText= (!STATE.IS_ONLINE||!STATE.FIREBASE_CONNECTED)?'LOCAL OFFLINE':'SERVEUR';
}
async function syncOfflineQueue(){
  if(!STATE.IS_ONLINE||!STATE.FIREBASE_CONNECTED||!STATE.OFFLINE_QUEUE.length) return;
  let rem=[]; for(let item of STATE.OFFLINE_QUEUE){ try{
    if(item.type==='vente'){ let snap=await db.ref('shops/'+item.shop+'/vendeurs/'+(item.data.vendeurPin||'')).once('value'); if(!snap.val()||snap.val().actif===false) continue; await db.ref('shops/'+item.shop+'/ventes/'+item.id).set(item.data); if(item.stockUpdates) for(let u of item.stockUpdates) await db.ref('shops/'+item.shop+'/stock/'+u.CODE).update({Quantite:u.newQte}); }
    else if(item.type==='depense') await db.ref('shops/'+item.shop+'/depenses/'+item.id).set(item.data);
    else if(item.type==='versement') await db.ref('shops/'+item.shop+'/versements/'+item.id).set(item.data);
  }catch(e){ rem.push(item); } }
  STATE.OFFLINE_QUEUE=rem; window.OFFLINE_QUEUE=rem; saveQueue(); updateOfflineUI();
}
window.updateOfflineUI=updateOfflineUI; window.syncOfflineQueue=syncOfflineQueue; window.saveStockCache=saveStockCache; window.isCacheExpired=isCacheExpired;

// --- FIX GLOBAL : switchTab doit être global ---
window.switchTab = function(id){
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  let btn=document.getElementById('btn-'+id); if(btn) btn.classList.add('active');
  let sec=document.getElementById(id); if(sec) sec.classList.add('active');
};

// --- AUTH ---
window.doLogin=function(){
  let pin=document.getElementById('pinInput')?.value?.trim(); if(!pin){ document.getElementById('loginMsg').innerText='PIN requis'; return; }
  db.ref('shops/'+STATE.SHOP+'/vendeurs/'+pin).once('value').then(snap=>{
    let v=snap.val(); if(!v||v.actif===false){ document.getElementById('loginMsg').innerText='PIN invalide ou bloqué'; return; }
    STATE.CURRENT_VENDEUR={pin, nom:v.nom||pin, ...v}; window.CURRENT_VENDEUR=STATE.CURRENT_VENDEUR;
    localStorage.setItem('vendeur_session_'+STATE.SHOP, JSON.stringify({pin, ts:Date.now()}));
    document.getElementById('loginOverlay').style.display='none';
    document.getElementById('authStatus').innerText='✅ '+v.nom;
    document.getElementById('vendeurName').innerText=v.nom;
    document.getElementById('shopName').innerText=STATE.SHOP;
    document.getElementById('shopStock').innerText=STATE.SHOP;
    let ref=db.ref('shops/'+STATE.SHOP+'/presence/'+pin); STATE.PRESENCE_REF=ref; ref.set({online:true,lastSeen:Date.now(),nom:v.nom,pin,shop:STATE.SHOP}); ref.onDisconnect().set({online:false,lastSeen:Date.now(),nom:v.nom,pin,shop:STATE.SHOP});
  }).catch(e=>{ document.getElementById('loginMsg').innerText='Erreur: '+e.message; });
};
window.logoutAll=function(){ try{ if(STATE.PRESENCE_REF) STATE.PRESENCE_REF.update({online:false,lastSeen:Date.now()}); }catch(e){} localStorage.removeItem('vendeur_session_'+STATE.SHOP); location.reload(); };
window.switchShop=function(){ let sel=document.getElementById('shopSel')?.value; if(sel){ localStorage.setItem('vendeur_shop', sel); location.href='?shop='+encodeURIComponent(sel); } };

// --- STOCK ---
window.renderStock=function(){
  let tb=document.getElementById('stockT'); if(!tb) return;
  let q=(document.getElementById('searchS')?.value||'').toLowerCase();
  let filt=STATE.STOCK.filter(s=>{ if(!q) return true; return (s.CODE||'').toLowerCase().includes(q) || (s.Designation||'').toLowerCase().includes(q); }).slice(0,200);
  tb.innerHTML=filt.map(s=>`<tr><td><b>${esc(s.CODE)}</b></td><td>${esc(s.Designation)}</td><td>${s.Quantite||0}</td><td>${(s.Prix||s.PV||0).toLocaleString()}</td><td>${(s.Quantite||0)<=0?'🔴 Rupture':(s.Quantite||0)<=3?'🟡 Faible':'🟢 OK'}</td><td><button class="btn btn-b" style="width:auto" onclick="selectArticle('${esc(s.CODE)}')">➕</button></td></tr>`).join('')||'<tr><td colspan=6>Aucun</td></tr>';
  updateOfflineUI();
};
window.selectArticle=function(code){ let art=STATE.STOCK.find(s=>s.CODE===code); if(!art) return; document.getElementById('codeArt').value=art.CODE; document.getElementById('pvArt').value=art.Prix||art.PV||0; document.getElementById('qteArt').value=1; };
window.searchArticle=function(){
  let q=(document.getElementById('searchArt')?.value||'').toLowerCase(); let sug=document.getElementById('suggest'); if(!sug) return;
  if(!q){ sug.style.display='none'; return; }
  let res=STATE.STOCK.filter(s=> (s.CODE||'').toLowerCase().includes(q) || (s.Designation||'').toLowerCase().includes(q)).slice(0,10);
  sug.innerHTML=res.map(s=>`<div onclick="selectArticle('${esc(s.CODE)}');document.getElementById('suggest').style.display='none'">${esc(s.CODE)} - ${esc(s.Designation)} (${s.Quantite||0})</div>`).join(''); sug.style.display=res.length?'block':'none';
};

// --- PANIER ---
window.addPanier=function(){
  let code=document.getElementById('codeArt')?.value?.trim(); if(!code) return alert('Choisis article');
  let pv=parseFloat(document.getElementById('pvArt')?.value||0); let qte=parseFloat(document.getElementById('qteArt')?.value||1); if(qte<=0) qte=1;
  let art=STATE.STOCK.find(s=>s.CODE===code); if(!art) return; if(qte>(art.Quantite||0)) return alert('Stock insuffisant: '+art.Quantite);
  let ex=STATE.PANIER.find(p=>p.CODE===code); if(ex) ex.qty+=qte; else STATE.PANIER.push({CODE:code, Designation:art.Designation, qty:qte, prix:pv});
  window.PANIER=STATE.PANIER; renderPanier();
};
window.renderPanier=function(){
  let list=document.getElementById('panierList'); if(!list) return;
  if(!STATE.PANIER.length){ list.innerHTML='Panier vide'; } else { list.innerHTML=STATE.PANIER.map((p,i)=>`<div class="panierItem"><span>${esc(p.CODE)} x${p.qty}</span><span>${(p.prix*p.qty).toLocaleString()} FC <button onclick="removePanier(${i})">🗑️</button></span></div>`).join(''); }
  let brut=STATE.PANIER.reduce((s,p)=>s+(p.prix*p.qty),0); let rem=parseFloat(document.getElementById('remise')?.value||0); if(rem>5) rem=5; let remVal=brut*rem/100; let final=brut-remVal;
  if(document.getElementById('totalPanier')) document.getElementById('totalPanier').innerText=brut.toLocaleString()+' FC';
  if(document.getElementById('totalFinal')) document.getElementById('totalFinal').innerText=final.toLocaleString()+' FC';
  if(document.getElementById('remiseInfo')) document.getElementById('remiseInfo').innerText= rem>0?`Remise ${rem}% = -${remVal.toLocaleString()} FC`:'';
};
window.removePanier=function(i){ STATE.PANIER.splice(i,1); renderPanier(); };
window.checkRemise=function(){ let r=parseFloat(document.getElementById('remise')?.value||0); if(r>5){ alert('Max 5%'); document.getElementById('remise').value=5; } };
window.validerVente=window.vendre=async function(){
  if(!STATE.PANIER.length) return alert('Panier vide'); if(!STATE.CURRENT_VENDEUR) return alert('Login requis');
  let brut=STATE.PANIER.reduce((s,p)=>s+(p.prix*p.qty),0); let rem=parseFloat(document.getElementById('remise')?.value||0)||0; let remVal=brut*rem/100; let final=brut-remVal;
  let id=Date.now(); let vente={date:new Date().toISOString(), boutique:STATE.SHOP, vendeur:STATE.CURRENT_VENDEUR.nom, vendeurNom:STATE.CURRENT_VENDEUR.nom, vendeurPin:STATE.CURRENT_VENDEUR.pin, items:STATE.PANIER, totalBrut:brut, remise:rem, remiseVal:remVal, total:final, client:{nom:document.getElementById('clientNom')?.value||'', tel:document.getElementById('clientTel')?.value||''}, payMode:document.getElementById('payMode')?.value||'cash', offline:!STATE.FIREBASE_CONNECTED};
  if(!STATE.IS_ONLINE||!STATE.FIREBASE_CONNECTED){
    let updates=STATE.PANIER.map(it=>{ let st=STATE.STOCK.find(s=>s.CODE===it.CODE); return {CODE:it.CODE, newQte:Math.max(0,(st?.Quantite||0)-it.qty)}; });
    STATE.OFFLINE_QUEUE.push({type:'vente', id, shop:STATE.SHOP, data:vente, stockUpdates:updates}); saveQueue();
    updates.forEach(u=>{ let st=STATE.STOCK.find(s=>s.CODE===u.CODE); if(st) st.Quantite=u.newQte; }); saveStockCache();
    alert('✅ Vente OFFLINE en attente: '+final.toLocaleString()+' FC');
  }else{
    try{ for(let it of STATE.PANIER){ let ref=db.ref('shops/'+STATE.SHOP+'/stock/'+it.CODE+'/Quantite'); let result=await ref.transaction(q=>{ if(q===null||q<it.qty) return; return q-it.qty; }); if(!result.committed){ alert('❌ Stock insuffisant '+it.CODE); return; } let st=STATE.STOCK.find(s=>s.CODE===it.CODE); if(st) st.Quantite=result.snapshot.val(); } await db.ref('shops/'+STATE.SHOP+'/ventes/'+id).set(vente); saveStockCache(); alert('✅ Vente SECURISEE: '+final.toLocaleString()+' FC'); }catch(e){ alert('❌ Erreur: '+e.message); return; }
  }
  STATE.PANIER=[]; renderPanier(); document.getElementById('codeArt').value=''; document.getElementById('qteArt').value='1'; document.getElementById('clientNom').value=''; document.getElementById('remise').value=0; renderVentesJour(); renderStock(); updateKPI(); updateOfflineUI();
};

// --- CAISSE / SYNTHÈSE ---
window.renderVentesJour=function(){
  let el=document.getElementById('ventesJour'); if(!el) return;
  let today=new Date().toDateString(); let vToday=(STATE.VENTES||[]).filter(v=> new Date(v.date).toDateString()===today).slice(0,20);
  let vQueue=STATE.OFFLINE_QUEUE.filter(q=>q.type==='vente').map(q=>q.data).filter(v=> new Date(v.date).toDateString()===today);
  let all=[...vToday,...vQueue].sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,20);
  el.innerHTML=all.map(v=>`<tr><td>${new Date(v.date).toLocaleTimeString()}</td><td>${esc(v.vendeurNom||'')}</td><td>${esc(v.client?.nom||'')}</td><td>${(v.items||[]).map(i=>i.CODE+' x'+i.qty).join(', ')}</td><td>${(v.total||0).toLocaleString()}</td><td>${v.offline?'🔴':'🟢'}</td></tr>`).join('')||'<tr><td colspan=6>Aucune</td></tr>';
};
window.addDepense=function(){ let type=document.getElementById('motifDep')?.value||'autre'; let montant=parseFloat(document.getElementById('montDep')?.value||0); if(!montant) return alert('Montant'); let desc=document.getElementById('descDep')?.value||''; let id=Date.now(); let data={date:new Date().toISOString(), boutique:STATE.SHOP, type, montant, desc, vendeur:STATE.CURRENT_VENDEUR?.nom||''}; if(!STATE.FIREBASE_CONNECTED){ STATE.OFFLINE_QUEUE.push({type:'depense', id, shop:STATE.SHOP, data}); saveQueue(); } else db.ref('shops/'+STATE.SHOP+'/depenses/'+id).set(data); document.getElementById('montDep').value=''; updateOfflineUI(); };
window.addVersement=function(){ let montant=parseFloat(document.getElementById('montVers')?.value||0); if(!montant) return alert('Montant'); let desc=document.getElementById('descVers')?.value||''; let id=Date.now(); let data={date:new Date().toISOString(), boutique:STATE.SHOP, montant, desc, vendeur:STATE.CURRENT_VENDEUR?.nom||''}; if(!STATE.FIREBASE_CONNECTED){ STATE.OFFLINE_QUEUE.push({type:'versement', id, shop:STATE.SHOP, data}); saveQueue(); } else db.ref('shops/'+STATE.SHOP+'/versements/'+id).set(data); document.getElementById('montVers').value=''; updateOfflineUI(); };
window.renderCaisse=function(){ let el=document.getElementById('caisseList'); if(!el) return; let all=[...(STATE.DEP||[]).map(d=>({...d,_type:'depense'})),...(STATE.VERS||[]).map(v=>({...v,_type:'versement'}))].sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,50); el.innerHTML=all.map(x=>`<tr><td>${new Date(x.date).toLocaleTimeString()}</td><td>${x._type}</td><td>${(x.montant||0).toLocaleString()}</td><td>${esc(x.desc||x.type||'')}</td></tr>`).join('')||'<tr><td colspan=4>Aucun</td></tr>'; };
window.updateKPI=function(){ let today=new Date().toDateString(); let ca=(STATE.VENTES||[]).filter(v=> new Date(v.date).toDateString()===today).reduce((s,v)=>s+(v.total||0),0); let dep=(STATE.DEP||[]).filter(d=> new Date(d.date).toDateString()===today).reduce((s,d)=>s+(d.montant||0),0); if(document.getElementById('caJour')) document.getElementById('caJour').innerText='CA Jour: '+ca.toLocaleString(); if(document.getElementById('caJour2')) document.getElementById('caJour2').innerText=ca.toLocaleString()+' FC'; if(document.getElementById('aVerser')) document.getElementById('aVerser').innerText=(ca-dep).toLocaleString()+' FC'; };
window.genSyntheseVendeur=function(){ let du=new Date(document.getElementById('du')?.value|| new Date().setDate(1)); let au=new Date(document.getElementById('au')?.value||Date.now()); let vFiltre=(STATE.VENTES||[]).filter(v=>{ let d=new Date(v.date); return d>=du && d<=au; }); let byArt={}; vFiltre.forEach(v=>{ (v.items||[]).forEach(it=>{ if(!byArt[it.CODE]) byArt[it.CODE]={CODE:it.CODE, Designation:it.Designation||'', qty:0, ca:0}; byArt[it.CODE].qty+=it.qty||0; byArt[it.CODE].ca+= (it.prix||0)*it.qty; }); }); let totalCA=Object.values(byArt).reduce((s,a)=>s+a.ca,0); let html=`<h4>Synthèse ${STATE.SHOP}</h4><p>CA: ${totalCA.toLocaleString()} FC</p><table><tr><th>CODE</th><th>Désignation</th><th>Qté</th><th>CA</th></tr>`+Object.values(byArt).map(r=>`<tr><td>${esc(r.CODE)}</td><td>${esc(r.Designation)}</td><td>${r.qty}</td><td>${r.ca.toLocaleString()}</td></tr>`).join('')+'</table>'; document.getElementById('syntheseC').innerHTML=html; };
window.pdfSynthese=function(){ let c=document.getElementById('syntheseC').innerHTML; let w=window.open('','','width=900'); w.document.write('<html><body>'+c+'</body></html>'); w.print(); };
window.searchArticleDevis=window.searchArticle; window.addPanierDevis=function(){}; window.validerDevis=function(){}; window.renderDevisList=function(){}; window.searchArticleFact=window.searchArticle; window.addPanierFact=function(){}; window.validerFacture=function(){}; window.openEntree=function(){ alert('Entrée Stock - à découper ensuite'); };
window.onDeviseDevisChange=function(){}; window.onDeviseFactChange=function(){}; window.renderPanierDevis=function(){}; window.renderPanierFact=function(){};

// --- INIT LISTENERS ---
console.log("✅ VENDEUR MODULAIRE 7 MODULES CHARGÉS - SHOP:", STATE.SHOP);
window.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('shopName').innerText=STATE.SHOP; document.getElementById('shopStock').innerText=STATE.SHOP; document.getElementById('loginShopName').innerText='Boutique: '+STATE.SHOP;
  let du=document.getElementById('du'); let au=document.getElementById('au'); if(du) du.valueAsDate=new Date(new Date().setDate(1)); if(au) au.valueAsDate=new Date();
  // CACHE OFFLINE D'ABORD
  let cached=JSON.parse(localStorage.getItem('bateke_stock_'+STATE.SHOP)||'[]'); if(cached.length){ STATE.STOCK=cached; window.STOCK=cached; renderStock(); console.log("Stock CACHE:", cached.length); }
  if(window.db){
    db.ref('.info/connected').on('value',snap=>{ STATE.FIREBASE_CONNECTED=snap.val()===true; window.FIREBASE_CONNECTED=STATE.FIREBASE_CONNECTED; STATE.IS_ONLINE=navigator.onLine; updateOfflineUI(); if(STATE.FIREBASE_CONNECTED) syncOfflineQueue(); });
    window.addEventListener('online',()=>{ STATE.IS_ONLINE=true; updateOfflineUI(); }); window.addEventListener('offline',()=>{ STATE.IS_ONLINE=false; STATE.FIREBASE_CONNECTED=false; updateOfflineUI(); });
    db.ref('shops/'+STATE.SHOP+'/stock').on('value',s=>{ if(s.val()){ STATE.STOCK=Object.values(s.val()); window.STOCK=STATE.STOCK; saveStockCache(); renderStock(); console.log("✅ SYNC "+STATE.SHOP+" stock:", STATE.STOCK.length); } });
    db.ref('shops/'+STATE.SHOP+'/ventes').on('value',s=>{ STATE.VENTES=Object.values(s.val()||{}); window.VENTES=STATE.VENTES; renderVentesJour(); updateKPI(); });
    db.ref('shops/'+STATE.SHOP+'/depenses').on('value',s=>{ STATE.DEP=Object.values(s.val()||{}); renderCaisse(); updateKPI(); });
    db.ref('shops/'+STATE.SHOP+'/versements').on('value',s=>{ STATE.VERS=Object.values(s.val()||{}); renderCaisse(); updateKPI(); });
    db.ref('shops').on('value',snap=>{ let data=snap.val()||{}; let list=Object.keys(data); let sel=document.getElementById('shopSel'); if(sel) sel.innerHTML=list.map(s=>`<option ${s===STATE.SHOP?'selected':''} value="${s}">${s}</option>`).join(''); });
  }
  let sess=JSON.parse(localStorage.getItem('vendeur_session_'+STATE.SHOP)||'null'); if(sess && (Date.now()-sess.ts)<12*60*60*1000){ document.getElementById('pinInput').value=sess.pin; }
  console.log("Vendeur prêt - Stock:", STATE.STOCK.length);
});
