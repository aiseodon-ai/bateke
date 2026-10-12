export function hashVendeurPin(pin){
  let salt='BATEKE_ANTI_TRICHE_2024'; let str=String(pin)+salt; let h=5381;
  for(let i=0;i<str.length;i++){h=((h<<5)+h)+str.charCodeAt(i);h=h&h;}
  let b64=btoa(String(pin)).replace(/=/g,''); return 'HASH_'+Math.abs(h).toString(16).toUpperCase().slice(0,8)+'_'+b64.slice(0,4)+'🔒';
}
export function renderVendeurs(){
  let s=SHOP; let vends=ALL_DATA[s]?.vendeurs||{}; let pres=ALL_DATA[s]?.presence||{}; let logs=ALL_DATA[s]?.logs||{};
  let rows=Object.entries(vends).map(([key,v])=>{
    let pinAffiche=v.pinHash||hashVendeurPin(key); let p=pres[key]||{}; let online=p.online===true&&Date.now()-(p.lastSeen||0)<180000;
    let vToday=Object.values(logs).filter(l=>l.pin==key&&new Date(l.date).toDateString()===new Date().toDateString()).length;
    return `<tr><td><b style="font-family:monospace;background:#111;color:#22c55e;padding:4px 8px;border-radius:6px">${pinAffiche}</b></td><td><b>${v.nom||''}</b></td><td>${v.actif!==false?'✅':'🚫'}</td><td><span class="presence-dot ${online?'online':'offline'}"></span>${online?'En ligne':'Hors ligne'}<br><small>${window.fmtVu?.(p.lastSeen)||''}</small></td><td>${vToday}</td><td><button class="btn btn-y" style="width:auto;font-size:9px" onclick="voirLogsVendeur('${key}')">Logs</button></td><td style="background:#dcfce7;text-align:center">🔒</td><td><button class="btn btn-y" style="width:auto;font-size:10px" onclick="toggleVendeur('${key}',${v.actif!==false})">${v.actif!==false?'Bloquer':'Activer'}</button> <button class="btn btn-r" style="width:auto;font-size:10px" onclick="suppVendeur('${key}')">X</button></td></tr>`;
  }).join('');
  document.getElementById('vendeursT').innerHTML=rows||'<tr><td colspan=8>Aucun</td></tr>';
}
export function createVendeur(){
  let pin=document.getElementById('newVPin')?.value.trim(); let nom=document.getElementById('newVNom')?.value.trim();
  if(!pin||!nom){alert('PIN et Nom requis'); return;}
  let h=hashVendeurPin(pin);
  db.ref('shops/'+SHOP+'/vendeurs/'+pin).set({nom:nom,pinHash:h,actif:true,created:new Date().toISOString()}).then(()=>{alert('✅ Vendeur créé: '+nom+' -> '+h); renderVendeurs();});
}
export function toggleVendeur(pin,cur){ db.ref('shops/'+SHOP+'/vendeurs/'+pin).update({actif:!cur}); }
export function suppVendeur(pin){ if(!confirm('Supprimer '+pin+'?')) return; db.ref('shops/'+SHOP+'/vendeurs/'+pin).remove(); }
window.renderVendeurs=renderVendeurs; window.createVendeur=createVendeur; window.toggleVendeur=toggleVendeur; window.suppVendeur=suppVendeur; window.hashVendeurPin=hashVendeurPin;
