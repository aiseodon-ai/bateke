import { esc } from "../common/utils.js";
let BT_DEVICE = null; let BT_CHAR = null;

function bytesToBase64(bytes){ let bin=''; bytes.forEach(b=>bin+=String.fromCharCode(b)); return btoa(bin); }
function getEl(id){ return document.getElementById(id); }
function safeSetHTML(id, html){
  let el = getEl(id);
  if(el) el.innerHTML = html;
  else console.warn(`⚠️ #${id} introuvable - skip`);
  return el;
}

export async function connecterImprimanteUniverselle(){
  let isAndroid = /Android/i.test(navigator.userAgent);
  let isTecno = /Tecno|Spark|Infinix|HOT|NOTE|itel/i.test(navigator.userAgent);

  if(isAndroid){
    safeSetHTML('printerStatus', `📱 Mode Android détecté (${isTecno?'Tecno Spark 10':'Android'})<br>🟢 Utilise RawBT - Clique TEST TICKET directement`);
    let sel = getEl('confImpType'); if(sel) sel.value = 'rawbt';
    let nomEl = getEl('confImpNom'); if(nomEl) nomEl.value = localStorage.getItem('bateke_printer_universal') || 'T58_AFC6';
    alert(`📱 Android détecté\n\nSur Tecno, le Bluetooth direct est bloqué.\n\nNE CLIQUE PLUS sur CONNECTER.\n\n1. Ouvre l'app RawBT\n2. Choisis ton imprimante T58_AFC6\n3. Reviens ici et clique TEST TICKET`);
    saveConfig();
    return false;
  }

  try{
    BT_DEVICE = await navigator.bluetooth.requestDevice({
      acceptAllDevices:true,
      optionalServices:['000018f0-0000-1000-8000-00805f9b34fb','0000ff00-0000-1000-8000-00805f9b34fb','49535343-fe7d-4ae5-8fa9-9fafd205e455']
    });
    const server = await BT_DEVICE.gatt.connect();
    const services = await server.getPrimaryServices();
    for(let s of services){
      try{ let chars=await s.getCharacteristics(); for(let c of chars){ if(c.properties.write||c.properties.writeWithoutResponse){ BT_CHAR=c; break; } } }catch(e){}
      if(BT_CHAR) break;
    }
    let nomEl = getEl('confImpNom'); if(nomEl) nomEl.value = BT_DEVICE.name;
    safeSetHTML('printerStatus', `🟢 PC Connectée: ${esc(BT_DEVICE.name)}`);
    localStorage.setItem('bateke_printer_universal', BT_DEVICE.name);
    saveConfig();
    return true;
  }catch(e){
    if(e.name==='NotFoundError') return;
    alert(`Erreur PC: ${e.message}\n\n1. Windows > Bluetooth > Supprimer T58_AFC6\n2. Éteins/Rallume H22\n3. Reconnecte DANS Chrome uniquement`);
    return false;
  }
}

function buildTicketBytes(vente){
  const c = window.CURRENT_CONFIG || {};
  const cols = (getEl('confImpLargeur')?.value||'58mm').includes('80')?48:32;
  const line='-'.repeat(cols)+'\n';
  let str='\x1B\x40\x1B\x61\x01\x1B\x45\x01'+(c.nom||'BATEKE').substring(0,cols)+'\n\x1B\x45\x00';
  str+=(c.tel||'').substring(0,cols)+'\n'+line+'\x1B\x61\x00';
  let SHOP = window.SHOP || localStorage.getItem('patron_shop') || 'N/A';
  str+=`Shop: ${SHOP} - ${new Date().toLocaleString()}\n`+line;
  (vente.items||[]).forEach(it=>{
    str+=(it.Designation||it.CODE||'ARTICLE').toString().substring(0,cols-12)+'\n';
    str+=`  ${it.qty||1} x ${it.Prix||it.pv||0} = ${((it.qty||1)*(it.Prix||it.pv||0)).toLocaleString()}\n`;
  });
  str+=line+'\x1B\x45\x01TOTAL: '+(vente.total||0)+' FC\n\x1B\x45\x00';
  str+=(c.piedFacture||'Merci!')+'\n\n\n\x1D\x56\x00';
  return new TextEncoder().encode(str);
}

export async function testTicketUniversel(){
  let vente={ total:5000, items:[{CODE:'TEST',Designation:'BATEKE TEST TECNO OK',qty:1,Prix:5000}] };
  let bytes = buildTicketBytes(vente);
  let isAndroid = /Android/i.test(navigator.userAgent);

  if(BT_CHAR && !isAndroid){
    try{
      for(let i=0;i<bytes.length;i+=20){
        let chunk=bytes.slice(i,i+20);
        if(BT_CHAR.writeValueWithoutResponse) await BT_CHAR.writeValueWithoutResponse(chunk);
        else await BT_CHAR.writeValue(chunk);
        await new Promise(r=>setTimeout(r,30));
      }
      alert('✅ Imprimé en direct PC'); return;
    }catch(e){ console.warn(e); }
  }

  if(isAndroid){
    try{
      let b64 = bytesToBase64(bytes);
      window.location.href = `rawbt:base64,${b64}`;
      setTimeout(()=>{
        if(!document.hidden){
          if(confirm('RawBT ne s\'est pas ouvert?\nInstaller RawBT?')){
            window.open('https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter','_blank');
          }
        }
      },2000);
      return;
    }catch(e){ alert('Erreur RawBT: '+e.message); }
  }
  alert('Connecte l\'imprimante d\'abord sur PC');
  window.print();
}

export async function imprimerVenteUniverselle(v){ 
  let bytes=buildTicketBytes(v);
  let isAndroid=/Android/i.test(navigator.userAgent);
  if(BT_CHAR && !isAndroid){
    for(let i=0;i<bytes.length;i+=20){ 
      try{ await BT_CHAR.writeValue(bytes.slice(i,i+20)); }catch(e){ try{ await BT_CHAR.writeValueWithoutResponse(bytes.slice(i,i+20)); }catch(e2){} }
      await new Promise(r=>setTimeout(r,30)); 
    }
    return;
  }
  if(isAndroid){
    let b64=bytesToBase64(bytes);
    window.location.href=`rawbt:base64,${b64}`;
    return;
  }
  window.print();
}

export function saveConfig(){
  try{
    let tauxUSD=parseFloat(getEl('confTauxUSD')?.value)||2850;
    let cfg={
      nom:getEl('confNom')?.value||'', slogan:getEl('confSlogan')?.value||'',
      adresse:getEl('confAdresse')?.value||'', tel:getEl('confTel')?.value||'',
      email:getEl('confEmail')?.value||'', rccm:getEl('confRccm')?.value||'',
      devise:getEl('confDevise')?.value||'FC', deviseBase:getEl('confDeviseBase')?.value||'FC',
      taux:tauxUSD, tauxUSD:tauxUSD, tauxEUR:parseFloat(getEl('confTauxEUR')?.value)||0, tauxXAF:parseFloat(getEl('confTauxXAF')?.value)||0, tauxXOF:parseFloat(getEl('confTauxXOF')?.value)||0,
      tauxObj:{USD:tauxUSD,EUR:parseFloat(getEl('confTauxEUR')?.value)||0,XAF:parseFloat(getEl('confTauxXAF')?.value)||0,XOF:parseFloat(getEl('confTauxXOF')?.value)||0},
      logo:window.CURRENT_CONFIG?.logo||'', 
      piedFacture:getEl('confPiedFacture')?.value||'', piedDevis:getEl('confPiedDevis')?.value||'',
      imprimante:{type:getEl('confImpType')?.value||'rawbt',nom:getEl('confImpNom')?.value||'T58_AFC6',largeur:getEl('confImpLargeur')?.value||'58mm',print_logo:getEl('confImpLogo')?.value||'oui',copies:parseInt(getEl('confImpCopies')?.value)||1},
      updatedAt:new Date().toISOString()
    };
    let target = (window.SHOP==='ALL'?'Menkao1':window.SHOP) || 'Menkao1';
    let db = window.db || firebase.database();
    db.ref('shops/'+target+'/config_entreprise').set(cfg).then(()=>{
      safeSetHTML('configStatus','✅ Sauvé - '+new Date().toLocaleTimeString());
      window.CURRENT_CONFIG=cfg;
      applyConfigToUI();
      if(typeof window.savePatronCache === 'function') window.savePatronCache();
    });
  }catch(e){ console.error("saveConfig error", e); }
}

export function loadConfig(){
  try{
    let t = (window.SHOP==='ALL'?'Menkao1':window.SHOP) || 'Menkao1';
    let db = window.db || firebase.database();
    db.ref('shops/'+t+'/config_entreprise').once('value').then(snap=>{
      let c=snap.val();
      if(c){
        window.CURRENT_CONFIG = {...(window.CURRENT_CONFIG||{}), ...c};
        applyConfigToUI();
        if(typeof window.savePatronCache === 'function') window.savePatronCache();
      }
      renderApercu();
    });
  }catch(e){ console.error(e); renderApercu(); }
}

export function applyConfigToUI(){
  try{
    let c = window.CURRENT_CONFIG || {};
    if(getEl('confNom')) getEl('confNom').value=c.nom||'';
    if(getEl('confSlogan')) getEl('confSlogan').value=c.slogan||'';
    if(getEl('confAdresse')) getEl('confAdresse').value=c.adresse||'';
    if(getEl('confTel')) getEl('confTel').value=c.tel||'';
    if(getEl('confEmail')) getEl('confEmail').value=c.email||'';
    if(getEl('confRccm')) getEl('confRccm').value=c.rccm||'';
    if(getEl('confDevise')) getEl('confDevise').value=c.devise||'FC';
    if(getEl('confDeviseBase')) getEl('confDeviseBase').value=c.deviseBase||'FC';
    let tauxObj=c.tauxObj||c.taux||{};
    if(typeof tauxObj === 'object'){
      if(getEl('confTauxUSD')) getEl('confTauxUSD').value=tauxObj.USD||c.tauxUSD||2850;
      if(getEl('confTauxEUR')) getEl('confTauxEUR').value=tauxObj.EUR||'';
      if(getEl('confTauxXAF')) getEl('confTauxXAF').value=tauxObj.XAF||'';
      if(getEl('confTauxXOF')) getEl('confTauxXOF').value=tauxObj.XOF||'';
    }
    if(getEl('confPiedFacture')) getEl('confPiedFacture').value=c.piedFacture||'';
    if(getEl('confPiedDevis')) getEl('confPiedDevis').value=c.piedDevis||'';
    let imp=c.imprimante||{};
    let sel=getEl('confImpType');
    if(sel){
      sel.innerHTML=`<option value="pdf">PDF</option><option value="bluetooth">PC - Bluetooth Direct</option><option value="rawbt">Android - RawBT (Tecno/Infinix)</option>`;
      sel.value=imp.type||(/Android/i.test(navigator.userAgent)?'rawbt':'bluetooth');
    }
    if(getEl('confImpNom')) getEl('confImpNom').value=imp.nom||localStorage.getItem('bateke_printer_universal')||'T58_AFC6';
    if(getEl('confImpLargeur')) getEl('confImpLargeur').value=imp.largeur||'58mm';
    if(getEl('confImpLogo')) getEl('confImpLogo').value=imp.print_logo||'oui';
    if(getEl('confImpCopies')) getEl('confImpCopies').value=imp.copies||1;
    if(c.logo && getEl('logoPreview')) getEl('logoPreview').src=c.logo;
  }catch(e){ console.error("applyConfigToUI", e); }
}

export function renderApercu(){
  try{
    let apercuEl = getEl('apercuFacture');
    if(!apercuEl){
      console.warn("⚠️ #apercuFacture manquant - skip");
      return;
    }
    let isAndroid=/Android/i.test(navigator.userAgent);
    let c=window.CURRENT_CONFIG||{};
    apercuEl.innerHTML=`
    <div style="padding:10px;background:#fff;border:1px solid #ddd;border-radius:8px">
      <div><b>${esc(c.nom||'BATEKE')}</b> - ${isAndroid?'ANDROID MODE':'PC MODE'}</div><hr>
      <div id="printerStatus" style="padding:12px;background:${isAndroid?'#dcfce7':'#f0fdf4'};border-radius:8px;font-weight:bold;border:1px solid ${isAndroid?'#22c55e':'#0b5e2f'}">
        ${isAndroid?'📱 Tecno Spark 10 détecté<br>✅ Mode RawBT activé - Ne clique PAS sur CONNECTER<br>Clique direct TEST TICKET':'🖥️ PC - Mode Direct Bluetooth - Clique CONNECTER'}
      </div>
      <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        ${isAndroid?`<button class="btn" style="background:#22c55e;color:white;padding:14px 20px;border-radius:10px;border:0;font-weight:bold;cursor:pointer" onclick="window.testTicketUniversel()">🧾 TEST TICKET VIA RawBT</button>`:`<button class="btn btn-b" style="padding:10px 16px" onclick="window.connecterImprimanteUniverselle()">📡 CONNECTER</button><button class="btn btn-g" style="padding:10px 16px" onclick="window.testTicketUniversel()">🧾 TEST PC</button>`}
      </div>
      <small style="display:block;margin-top:8px;color:#64748b">Shop: ${window.SHOP||'N/A'} | SuperAdmin: ${window.CURRENT_VENDEUR?.isSuperAdmin?'OUI 👑':'NON'}</small>
    </div>`;
  }catch(e){
    console.error("renderApercu error", e);
  }
}

export function dupliquerConfig(){ let s=(window.SHOP==='ALL'?'Menkao1':window.SHOP)||'Menkao1'; let d=prompt('Dupliquer vers quelle boutique?','Menkao2'); if(!d) return; let db=window.db||firebase.database(); db.ref('shops/'+s+'/config_entreprise').once('value').then(snap=>{ let c=snap.val(); if(c) db.ref('shops/'+d+'/config_entreprise').set(c).then(()=>alert('✅ Config dupliquée vers '+d)); }); }

window.saveConfig=saveConfig; window.loadConfig=loadConfig; window.applyConfigToUI=applyConfigToUI; window.renderApercu=renderApercu; window.dupliquerConfig=dupliquerConfig;
window.connecterImprimanteUniverselle=connecterImprimanteUniverselle; window.testTicketUniversel=testTicketUniversel; window.imprimerVenteUniverselle=imprimerVenteUniverselle;
window.connecterImprimanteH22=connecterImprimanteUniverselle; window.testTicketH22=testTicketUniversel;

console.log("parametres.js V6.0 SUPERADMIN FIX NULL + RAWBT OK");
