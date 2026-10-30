// js/patron/boutiques.js - V8.5 SAAS RENOMMAGE + SUPPRESSION + LIEN VENDEUR
export function renderBoutiques(){
  try{
    let elList = document.getElementById('listShops');
    let elLinks = document.getElementById('allLinks');
    let elSel = document.getElementById('shopSel');
    
    if(!elList) return;
    let shops = window.SHOPS_LIST || [];
    let allData = window.ALL_DATA || {};
    let origin = location.origin;
    if(origin.startsWith('file')) origin = 'https://aiseodon-ai.github.io/bateke';
    let basePath = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*|\/patron\.html.*/,'') + '';
    if(!basePath.endsWith('/')) basePath += '/';
    let baseVendeur = basePath + 'vendeur.html';

    if(shops.length === 0){
      elList.innerHTML = `<div style="padding:20px;text-align:center;color:#64748b"><b>Aucune boutique</b></div>`;
      if(elLinks) elLinks.innerHTML = `<div style="padding:10px;color:#888">Pas de boutiques</div>`;
      return;
    }

    let html = shops.map(shop=>{
      let nb = allData[shop]?.stock?.length || 0;
      let lien = `${baseVendeur}?shop=${encodeURIComponent(shop)}`;
      let isActive = shop === (window.SHOP || localStorage.getItem('patron_shop')) ? 'border:2px solid #0b5e2f;background:#f0fdf4' : 'border:1px solid #eee';
      return `<div style="display:flex;justify-content:space-between;padding:10px;${isActive};border-radius:10px;margin-bottom:6px;align-items:center">
        <div style="flex:1"><b>🏪 ${shop}</b><br><small>${nb} articles</small><br><small style="color:#0b5e2f;font-size:10px;word-break:break-all">${lien}</small></div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;max-width:160px">
          <button class="btn btn-b" style="width:auto;padding:6px 8px;font-size:10px" onclick="selectShop('${shop}')">Ouvrir</button>
          <button class="btn" style="width:auto;padding:6px 8px;font-size:10px;background:#f59e0b;color:#000" onclick="renommerBoutique('${shop}')">✏️</button>
          <button class="btn btn-r" style="width:auto;padding:6px 8px;font-size:10px" onclick="supprimerBoutique('${shop}')">🗑️</button>
        </div>
      </div>`;
    }).join('');
    elList.innerHTML = html;

    if(elLinks){
      elLinks.innerHTML = shops.map(s=>{
        let lien = `${baseVendeur}?shop=${encodeURIComponent(s)}`;
        let nbStock = allData[s]?.stock?.length || 0;
        let nbVentes = allData[s]?.ventes?.length || 0;
        return `<div style="padding:12px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:#fff">
          <div style="display:flex;justify-content:space-between"><b>🏪 ${s}</b><span style="background:#f1f5f9;padding:2px 8px;border-radius:10px;font-size:10px">${nbStock} art. / ${nbVentes} ventes</span></div>
          <div style="margin-top:8px">
            <div style="display:flex;gap:4px"><input value="${lien}" id="inputLien_${s}" readonly style="flex:1;background:#f1f5f9;font-size:11px;padding:8px;border-radius:8px"><button class="btn btn-b" style="width:auto" onclick="copyInput('inputLien_${s}')">Copier</button></div>
            <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
              <button class="btn btn-y" style="width:auto;font-size:10px" onclick="copyLienShop('${s}')">📋 Copier</button>
              <button class="btn btn-g" style="width:auto;font-size:10px" onclick="shareWhatsApp('${s}')">📲 WhatsApp</button>
              <button class="btn" style="width:auto;font-size:10px;background:#f59e0b" onclick="renommerBoutique('${s}')">✏️ Renommer</button>
              <button class="btn" style="width:auto;font-size:10px;background:#111;color:#fff" onclick="openQR('${s}')">📷 QR</button>
              <button class="btn btn-r" style="width:auto;font-size:10px" onclick="supprimerBoutique('${s}')">🗑️ Supprimer</button>
            </div>
            <div id="qr_${s}" style="display:none;margin-top:10px;text-align:center"></div>
          </div>
        </div>`;
      }).join('');
    }

    if(elSel && shops.length > 0){
      let current = elSel.value || window.SHOP || localStorage.getItem('patron_shop') || shops[0];
      elSel.innerHTML = shops.map(s=>`<option value="${s}" ${s==current?'selected':''}>${s}</option>`).join('') + `<option value="ALL" ${current==='ALL'?'selected':''}>TOUTES</option>`;
    }
    console.log("✅ renderBoutiques V8.5 avec renommage OK");
  }catch(e){ console.error(e); }
}

export async function createShop(){
  try{
    let input = document.getElementById('newShop');
    let n = input.value.trim(); if(!n){ alert("Nom requis"); return; }
    let shopId = n.trim();
    let pin = localStorage.getItem('BATEKE_PIN') || sessionStorage.getItem('BATEKE_PIN') || '7832';
    let db = window.db || firebase.database();
    let exists = await db.ref('shops/'+shopId).once('value');
    if(exists.exists()){ alert('❌ Existe déjà'); return; }
    if(pin!=='7832') await db.ref('patrons/'+pin+'/boutiques/'+shopId).set({created: Date.now()});
    await db.ref('shops/'+shopId).set({
      config: {nom: n, id: shopId, created: new Date().toISOString(), owner: pin},
      stock: {}, ventes: {}, depenses: {}, entrees: {}, vendeurs: {},
      abonnement: {expire: Date.now()+30*24*60*60*1000}
    });
    alert('✅ Boutique créée: '+n);
    input.value=''; if(typeof window.initShops==='function') window.initShops(); else location.reload();
  }catch(e){ alert(e.message); }
}

export async function renommerBoutique(oldShop){
  try{
    if(!oldShop){ alert("Nom manquant"); return; }
    let allData = window.ALL_DATA || {};
    let nbArticles = allData[oldShop]?.stock?.length || 0;
    let nbVentes = allData[oldShop]?.ventes?.length || 0;

    let newShop = prompt(`✏️ RENOMMER BOUTIQUE "${oldShop}"\n\n📦 ${nbArticles} articles et ${nbVentes} ventes seront déplacés.\n\nNouveau nom (ID boutique, sans espace spécial):`, oldShop);
    if(!newShop) return;
    newShop = newShop.trim();
    if(!newShop || newShop===oldShop){ alert("Annulé ou même nom"); return; }
    if(/[^a-zA-Z0-9_-]/.test(newShop)){
      if(!confirm(`⚠️ Le nom "${newShop}" contient des espaces ou accents.\n\nID Firebase conseillé: ${newShop.replace(/[^a-zA-Z0-9]/g,'')}\n\nContinuer avec "${newShop}" quand même ?`)) return;
    }

    let db = window.db || firebase.database();
    let exists = await db.ref('shops/'+newShop).once('value');
    if(exists.exists()){
      alert(`❌ La boutique "${newShop}" existe déjà. Choisis un autre nom.`);
      return;
    }

    let conf2 = prompt(`Confirme le renommage:\n\n"${oldShop}" → "${newShop}"\n\nTape OUI pour confirmer le déplacement de ${nbArticles} articles:`);
    if(!conf2 || conf2.toLowerCase()!=='oui') return;

    console.log(`🔄 Renommage ${oldShop} → ${newShop}...`);
    
    // 1. Copie complète shops/old → shops/new
    let snap = await db.ref('shops/'+oldShop).once('value');
    let data = snap.val();
    if(!data){ alert("❌ Boutique source vide - annulé"); return; }
    
    // Met à jour le nom dans config
    if(!data.config) data.config={};
    data.config.nom = newShop;
    data.config.id = newShop;
    data.config.renamedFrom = oldShop;
    data.config.renamedAt = new Date().toISOString();

    await db.ref('shops/'+newShop).set(data);
    console.log(`✅ shops/${newShop} créé avec ${nbArticles} articles`);

    // 2. Copie dans patrons
    try{
      let pAll = await db.ref('patrons').once('value');
      let promises=[];
      pAll.forEach(child=>{
        let v=child.val()||{};
        if(v.boutiques && v.boutiques[oldShop]!==undefined){
          promises.push(db.ref('patrons/'+child.key+'/boutiques/'+newShop).set(v.boutiques[oldShop]));
          promises.push(db.ref('patrons/'+child.key+'/boutiques/'+oldShop).remove());
        }
        if(v.boutique===oldShop){
          promises.push(db.ref('patrons/'+child.key+'/boutique').set(newShop));
        }
      });
      await Promise.all(promises);
      console.log("✅ patrons mis à jour");
    }catch(e){ console.warn("Patrons rename fail:", e.message); }

    // 3. Nettoie ancien + cache
    await db.ref('shops/'+oldShop).remove();
    localStorage.removeItem('patron_cache_'+oldShop);
    localStorage.removeItem('panier_achat_'+oldShop);
    
    if((window.SHOP||'')===oldShop || localStorage.getItem('patron_shop')===oldShop){
      localStorage.setItem('patron_shop', newShop);
      window.SHOP=newShop;
    }

    alert(`✅ RENOMMÉ AVEC SUCCÈS\n\n"${oldShop}" → "${newShop}"\n\n📦 ${nbArticles} articles conservés\n💰 ${nbVentes} ventes conservées\n\nNouveau lien vendeur:\n${location.origin}/vendeur.html?shop=${newShop}`);
    
    setTimeout(()=>location.reload(), 1000);

  }catch(e){ alert('❌ Erreur renommage: '+e.message); console.error(e); }
}

export async function supprimerBoutique(shop){
  try{
    if(!shop) return;
    let allData = window.ALL_DATA || {};
    let nbArticles = allData[shop]?.stock?.length || 0;
    let shops = window.SHOPS_LIST || [];
    if(shops.length <= 1){ alert('❌ Impossible de supprimer la dernière boutique.'); return; }
    let conf1 = prompt(`⚠️ SUPPRIMER "${shop}" ?\n${nbArticles} articles seront perdus!\nTape OUI pour confirmer:`);
    if(!conf1 || conf1.toLowerCase()!=='oui') return;
    let conf2 = prompt(`🚨 DERNIERE CONFIRMATION\nTape le nom exact: ${shop}`);
    if(conf2!==shop){ alert('❌ Nom incorrect - annulé'); return; }
    let db = window.db || firebase.database();
    await db.ref('shops/'+shop).remove();
    try{
      let pAll = await db.ref('patrons').once('value');
      let promises=[]; pAll.forEach(child=>{
        promises.push(db.ref('patrons/'+child.key+'/boutiques/'+shop).remove());
        if(child.val()?.boutique===shop) promises.push(db.ref('patrons/'+child.key+'/boutique').remove());
      }); await Promise.all(promises);
    }catch(e){}
    localStorage.removeItem('patron_cache_'+shop);
    if((window.SHOP||'')===shop){ localStorage.setItem('patron_shop', shops.find(s=>s!==shop)); }
    alert(`✅ Boutique "${shop}" supprimée`);
    setTimeout(()=>location.reload(), 800);
  }catch(e){ alert(e.message); }
}

export function selectShop(shop){
  window.SHOP=shop;
  localStorage.setItem('patron_shop', shop);
  localStorage.setItem('BATEKE_SHOP', shop);
  sessionStorage.setItem('BATEKE_BOUTIQUE', shop);
  window.PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+shop)||'[]');
  let elSel=document.getElementById('shopSel'); if(elSel) elSel.value=shop;
  if(typeof window.updateLabels==='function') window.updateLabels();
  if(typeof window.refreshAll==='function') window.refreshAll();
  if(typeof window.checkAbonnement==='function') window.checkAbonnement(shop);
}

// Garde les autres fonctions de V8.5
window.selectShop = selectShop;
window.switchShop = switchShop;
export function copyLienShop(shop){
  let origin = location.origin.startsWith('file') ? 'https://aiseodon-ai.github.io/bateke' : location.origin;
  let base = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'') + '/';
  let lien = base + 'vendeur.html?shop=' + encodeURIComponent(shop);
  navigator.clipboard.writeText(lien).then(()=>alert('✅ Lien copié:\n'+lien));
}
export function copyInput(id){ let el=document.getElementById(id); if(!el) return; el.select(); document.execCommand('copy'); alert('✅ Copié'); }
export function shareWhatsApp(shop){
  let origin = location.origin.startsWith('file') ? 'https://aiseodon-ai.github.io/bateke' : location.origin;
  let base = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'') + '/';
  let lien = base + 'vendeur.html?shop=' + encodeURIComponent(shop);
  window.open(`https://wa.me/?text=${encodeURIComponent(`🏪 Boutique: ${shop}\n🔗 Lien vendeur: ${lien}`)}`,'_blank');
}
export function openQR(shop){
  let div=document.getElementById('qr_'+shop); if(!div) return;
  if(div.style.display!=='none'){ div.style.display='none'; return; }
  let origin = location.origin.startsWith('file') ? 'https://aiseodon-ai.github.io/bateke' : location.origin;
  let base = origin + location.pathname.replace(/\/patron\/.*|\/index\.html.*/,'') + '/';
  let lien = base + 'vendeur.html?shop=' + encodeURIComponent(shop);
  div.innerHTML=`<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(lien)}" style="border:8px solid #fff;border-radius:12px"><br><small>${lien}</small>`;
  div.style.display='block';
}
export function copyLien(){ let el=document.getElementById('lienVendeur'); if(el) navigator.clipboard.writeText(el.innerText).then(()=>alert('✅ Copié')); }
export function switchShop(){ let sel=document.getElementById('shopSel'); if(sel) selectShop(sel.value); }

window.renderBoutiques=renderBoutiques; window.createShop=createShop;
window.renommerBoutique=renommerBoutique; window.supprimerBoutique=supprimerBoutique;
window.selectShop=selectShop; window.switchShop=switchShop;
window.copyLienShop=copyLienShop; window.copyInput=copyInput;
window.shareWhatsApp=shareWhatsApp; window.openQR=openQR; window.copyLien=copyLien;

console.log("✅ boutiques.js V8.5 AVEC RENOMMAGE OK");
