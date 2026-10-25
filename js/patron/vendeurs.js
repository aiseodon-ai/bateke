// vendeurs.js - MODULE PATRON VENDEURS COMPLET V4.9.25
export function hashVendeurPin(pin){
  let salt='BATEKE_ANTI_TRICHE_2024'; 
  let str=String(pin)+salt; 
  let h=5381;
  for(let i=0;i<str.length;i++){h=((h<<5)+h)+str.charCodeAt(i);h=h&h;}
  return 'HASH_'+Math.abs(h).toString(16).toUpperCase().slice(0,8);
}

export function renderVendeurs(){
  let s=SHOP; let vends=ALL_DATA[s]?.vendeurs||{}; 
  let pres=ALL_DATA[s]?.presence||{}; let logs=ALL_DATA[s]?.logs||{};
  let rows=Object.entries(vends).map(([key,v])=>{
    let pinAffiche=v.pinHash||hashVendeurPin(key);
    let p=pres[key]||{}; 
    let online=p.online===true&&Date.now()-(p.lastSeen||0)<180000;
    let vToday=Object.values(ALL_DATA[s]?.ventes||{}).filter(l=>String(l.vendeur||l.pin)===String(key)).length;
    return `<tr><td><b style="font-family:monospace;background:#111;color:#22c55e;padding:4px 8px;border-radius:6px">${pinAffiche}</b></td>
    <td><b>${v.nom||''}</b></td><td>${v.actif!==false?'✅':'🚫'}</td>
    <td><span class="presence-dot ${online?'online':'offline'}"></span>${online?'En ligne':'Hors ligne'}<br><small>${window.fmtVu?.(p.lastSeen)||''}</small></td>
    <td>${vToday}</td>
    <td><button class="btn btn-y" style="width:auto;font-size:9px" onclick="voirLogsVendeur('${key}')">Logs</button></td>
    <td style="background:#dcfce7;text-align:center">🔒</td>
    <td><button class="btn btn-y" style="width:auto;font-size:10px" onclick="toggleVendeur('${key}',${v.actif!==false})">${v.actif!==false?'Bloquer':'Activer'}</button> <button class="btn btn-r" style="width:auto;font-size:10px" onclick="suppVendeur('${key}')">X</button></td></tr>`;
  }).join('');
  document.getElementById('vendeursT').innerHTML=rows||'<tr><td colspan=8>Aucun</td></tr>';
}

export function createVendeur(){
  let pin=document.getElementById('vPin')?.value.trim(); 
  let nom=document.getElementById('vNom')?.value.trim();
  if(!pin||!nom){alert('PIN et Nom requis'); return;}
  let h=hashVendeurPin(pin);
  db.ref('shops/'+SHOP+'/vendeurs/'+pin).set({nom:nom,pinHash:h,actif:true,created:new Date().toISOString()}).then(()=>{
    alert('✅ Vendeur créé: '+nom+' -> '+h); 
    renderVendeurs();
    document.getElementById('vPin').value=''; document.getElementById('vNom').value='';
  });
}

export function toggleVendeur(pin,cur){ db.ref('shops/'+SHOP+'/vendeurs/'+pin).update({actif:!cur}).then(()=>renderVendeurs()); }
export function suppVendeur(pin){ if(!confirm('Supprimer '+pin+'?')) return; db.ref('shops/'+SHOP+'/vendeurs/'+pin).remove().then(()=>renderVendeurs()); }

// MANQUANTS - À AJOUTER OBLIGATOIRE
export function migrerAnciensPins(){
  let s=SHOP; let vends=ALL_DATA[s]?.vendeurs||{};
  Object.entries(vends).forEach(([pin,v])=>{
    if(!v.pinHash){ let h=hashVendeurPin(pin); db.ref('shops/'+s+'/vendeurs/'+pin+'/pinHash').set(h); }
  });
  alert('Migration faite');
}

export function auditSecurite(){
  let s=SHOP; let vends=ALL_DATA[s]?.vendeurs||{};
  let faibles = Object.keys(vends).filter(p=>['0000','1111','1234','9999'].includes(p));
  alert(faibles.length ? 'PIN faibles: '+faibles.join(', ') : '✅ Aucun PIN faible');
}

export function voirLogsVendeur(pin){
  let s=SHOP; let ventes=Object.values(ALL_DATA[s]?.ventes||{}).filter(v=>String(v.vendeur||v.pin)===String(pin));
  alert(`Vendeur ${pin}: ${ventes.length} ventes`);
}

export function copyLien(){
  let l=document.getElementById('lienV')?.innerText||`vendeur.html?shop=${SHOP}`;
  navigator.clipboard.writeText(l).then(()=>alert('Lien copié: '+l));
}

window.renderVendeurs=renderVendeurs; 
window.createVendeur=createVendeur; 
window.toggleVendeur=toggleVendeur; 
window.suppVendeur=suppVendeur; 
window.hashVendeurPin=hashVendeurPin;
window.migrerAnciensPins=migrerAnciensPins;
window.auditSecurite=auditSecurite;
window.voirLogsVendeur=voirLogsVendeur;
window.copyLien=copyLien;
