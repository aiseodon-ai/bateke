import { esc } from "../common/utils.js";

let BT_DEVICE = null;
let BT_CHAR = null;

export async function connecterImprimanteUniverselle() {
  try {
    if (!navigator.bluetooth) {
      alert('⛔ Bluetooth non supporté par ce navigateur.\nSur PC utilise Chrome/Edge.\nSur Tecno utilise RawBT.');
      return false;
    }
    BT_DEVICE = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb','0000ff00-0000-1000-8000-00805f9b34fb','49535343-fe7d-4ae5-8fa9-9fafd205e455','0000ae30-0000-1000-8000-00805f9b34fb']
    });
    const server = await BT_DEVICE.gatt.connect();
    const services = await server.getPrimaryServices();
    for (let s of services) {
      try {
        let chars = await s.getCharacteristics();
        for (let c of chars) { if (c.properties.write || c.properties.writeWithoutResponse) { BT_CHAR = c; break; } }
      } catch(e){}
      if(BT_CHAR) break;
    }
    if (!BT_CHAR) throw new Error('Caractéristique non trouvée');
    
    document.getElementById('confImpNom').value = BT_DEVICE.name;
    document.getElementById('printerStatus').innerHTML = `🟢 Connectée: ${esc(BT_DEVICE.name)} (Direct PC OK)`;
    localStorage.setItem('bateke_printer_universal', BT_DEVICE.name);
    saveConfig();
    alert('✅ Connectée: '+BT_DEVICE.name+' - Test maintenant!');
    return true;
  } catch (e) {
    if(e.name === 'NotFoundError') return;
    // ICI ON FAIT LA DIFFERENCE PC vs TECNO
    let isTecnoPhone = /Tecno|Spark|Infinix|HOT|NOTE/i.test(navigator.userAgent) && /Android/i.test(navigator.userAgent);
    
    if(isTecnoPhone){
      document.getElementById('printerStatus').innerHTML = `⚠️ Tecno détecté: Utilise RawBT. Installe RawBT, connecte H22 dedans, puis clique TEST.`;
      alert('ℹ️ Tecno Spark 10: Chrome bloque le direct.\n\nSolution:\n1. Installe RawBT\n2. Connecte H22 dans RawBT\n3. Clique TEST TICKET');
    } else {
      // VRAI PC - on montre le vrai erreur
      document.getElementById('printerStatus').innerHTML = `🔴 Erreur PC: ${esc(e.message)} - Déconnecte H22 dans Bluetooth Windows et réessaie`;
      alert(`❌ Erreur PC: ${e.message}\n\nASTUCE PC:\n1. Paramètres Windows > Bluetooth > Supprimer T58_AFC6\n2. Éteins/Rallume H22\n3. Reconnecte dans Chrome (pas dans Windows)\n4. Réessaie`);
    }
    return false;
  }
}

function buildTicket(vente){
  const c = window.CURRENT_CONFIG || {};
  const cols = (document.getElementById('confImpLargeur')?.value||'58mm').includes('80') ? 48 : 32;
  const line='-'.repeat(cols)+'\n';
  let t='\x1B\x40\x1B\x61\x01\x1B\x45\x01'+(c.nom||'BATEKE').substring(0,cols)+'\n\x1B\x45\x00';
  t+= (c.adresse||'').substring(0,cols)+'\n'+(c.tel||'').substring(0,cols)+'\n'+line+'\x1B\x61\x00';
  t+= `Shop: ${SHOP} - ${new Date().toLocaleString()}\n`+line;
  (vente.items||[{CODE:'TEST',Designation:'Test Ticket',qty:1,Prix:5000}]).forEach(it=>{
    t+=(it.Designation||it.CODE||'ARTICLE').toString().substring(0,cols-12)+'\n';
    t+=`  ${it.qty||1} x ${it.Prix||it.pv||0} = ${((it.qty||1)*(it.Prix||it.pv||0)).toLocaleString()} FC\n`;
  });
  t+=line+'\x1B\x45\x01TOTAL: '+(vente.total||5000).toString()+' FC\n\x1B\x45\x00';
  t+= (c.piedFacture||'Merci!')+'\n\n\n\x1D\x56\x00';
  return t;
}

export async function testTicketUniversel(){
  let vente={ total:5000, _shop:SHOP, items:[{CODE:'TEST',Designation:'BATEKE TEST OK',qty:1,Prix:5000}] };
  let ticket=buildTicket(vente);
  
  // 1. SI DIRECT CONNECTÉ (PC) -> Imprime direct
  if(BT_CHAR){
    try{
      let data=new TextEncoder().encode(ticket);
      for(let i=0;i<data.length;i+=20){ 
        if(BT_CHAR.writeValueWithoutResponse) await BT_CHAR.writeValueWithoutResponse(data.slice(i,i+20));
        else await BT_CHAR.writeValue(data.slice(i,i+20));
        await new Promise(r=>setTimeout(r,30));
      }
      alert('✅ Ticket imprimé en DIRECT (PC)'); return;
    }catch(e){ console.error(e); }
  }
  
  // 2. SINON -> TENTE RawBT (Pour Tecno Spark 10)
  let isAndroid = /Android/i.test(navigator.userAgent);
  if(isAndroid){
    try{
      let b64=btoa(unescape(encodeURIComponent(ticket)));
      window.location.href=`intent:base64,${b64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
      setTimeout(()=>{ 
        if(!document.hidden && !confirm('Si RawBT ne s\'est pas ouvert, installe-le?')) return;
        window.open('https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter','_blank');
      },1500);
      return;
    }catch(e){}
  }
  
  // 3. DERNIER FALLBACK PDF
  alert('Aucune imprimante Bluetooth connectée. Connexion directe PC requise, ou RawBT sur Android. Impression PDF fallback.');
  window.print();
}

export async function imprimerVenteUniverselle(v){ 
  let t=buildTicket(v); 
  if(BT_CHAR){
    let d=new TextEncoder().encode(t);
    for(let i=0;i<d.length;i+=20){ await BT_CHAR.writeValue(d.slice(i,i+20)); await new Promise(r=>setTimeout(r,30)); }
    return;
  }
  return testTicketUniversel();
}

// ===== CONFIG ENTREPRISE - INTACT =====
export function saveConfig(){
  let tauxUSD=parseFloat(document.getElementById('confTauxUSD').value)||2850;
  let cfg={
    nom:document.getElementById('confNom').value, slogan:document.getElementById('confSlogan').value,
    adresse:document.getElementById('confAdresse').value, tel:document.getElementById('confTel').value,
    email:document.getElementById('confEmail').value, rccm:document.getElementById('confRccm').value,
    devise:document.getElementById('confDevise').value, deviseBase:document.getElementById('confDeviseBase').value,
    taux:tauxUSD, tauxUSD:tauxUSD,
    tauxEUR:parseFloat(document.getElementById('confTauxEUR').value)||0, tauxXAF:parseFloat(document.getElementById('confTauxXAF').value)||0, tauxXOF:parseFloat(document.getElementById('confTauxXOF').value)||0,
    taux:{USD:tauxUSD,EUR:parseFloat(document.getElementById('confTauxEUR').value)||0,XAF:parseFloat(document.getElementById('confTauxXAF').value)||0,XOF:parseFloat(document.getElementById('confTauxXOF').value)||0},
    logo:CURRENT_CONFIG.logo||'', piedFacture:document.getElementById('confPiedFacture').value, piedDevis:document.getElementById('confPiedDevis').value,
    imprimante:{type:document.getElementById('confImpType').value,nom:document.getElementById('confImpNom').value,largeur:document.getElementById('confImpLargeur').value,print_logo:document.getElementById('confImpLogo').value,copies:parseInt(document.getElementById('confImpCopies').value)||1},
    compta:CURRENT_CONFIG.compta, updatedAt:new Date().toISOString()
  };
  let target=SHOP==='ALL'?'Menkao1':SHOP;
  db.ref('shops/'+target+'/config_entreprise').set(cfg).then(()=>{
    document.getElementById('configStatus').innerHTML='✅ Sauvé - '+cfg.imprimante.nom;
    CURRENT_CONFIG=cfg; applyConfigToUI(); savePatronCache();
  });
}
export function loadConfig(){
  let t=SHOP==='ALL'?'Menkao1':SHOP;
  db.ref('shops/'+t+'/config_entreprise').once('value').then(snap=>{
    let c=snap.val(); if(c){ CURRENT_CONFIG={...CURRENT_CONFIG,...c,compta:{...CURRENT_CONFIG.compta,...(c.compta||{})}}; applyConfigToUI(); savePatronCache(); }
    renderApercu();
  });
}
export function applyConfigToUI(){
  document.getElementById('confNom').value=CURRENT_CONFIG.nom||''; document.getElementById('confSlogan').value=CURRENT_CONFIG.slogan||''; document.getElementById('confAdresse').value=CURRENT_CONFIG.adresse||''; document.getElementById('confTel').value=CURRENT_CONFIG.tel||'';
  document.getElementById('confEmail').value=CURRENT_CONFIG.email||''; document.getElementById('confRccm').value=CURRENT_CONFIG.rccm||''; document.getElementById('confDevise').value=CURRENT_CONFIG.devise||'FC'; document.getElementById('confDeviseBase').value=CURRENT_CONFIG.deviseBase||'FC';
  let tauxObj=CURRENT_CONFIG.taux&&typeof CURRENT_CONFIG.taux==='object'?CURRENT_CONFIG.taux:{}; document.getElementById('confTauxUSD').value=tauxObj.USD||CURRENT_CONFIG.tauxUSD||2850;
  document.getElementById('confTauxEUR').value=tauxObj.EUR||''; document.getElementById('confTauxXAF').value=tauxObj.XAF||''; document.getElementById('confTauxXOF').value=tauxObj.XOF||'';
  document.getElementById('confPiedFacture').value=CURRENT_CONFIG.piedFacture||''; document.getElementById('confPiedDevis').value=CURRENT_CONFIG.piedDevis||'';
  let imp=CURRENT_CONFIG.imprimante||{}; let sel=document.getElementById('confImpType');
  if(sel){ sel.innerHTML=`<option value="pdf">PDF / Téléphone</option><option value="bluetooth">Bluetooth Direct (PC + Android BLE)</option><option value="rawbt">RawBT - Tecno/Infinix/Samsung (RECOMMANDÉ ANDROID)</option><option value="bluetooth80">Bluetooth 80mm</option>`; sel.value=imp.type||'bluetooth'; }
  document.getElementById('confImpNom').value=imp.nom||localStorage.getItem('bateke_printer_universal')||'T58_AFC6'; document.getElementById('confImpLargeur').value=imp.largeur||'58mm'; document.getElementById('confImpLogo').value=imp.print_logo||'oui'; document.getElementById('confImpCopies').value=imp.copies||1;
  if(CURRENT_CONFIG.logo) document.getElementById('logoPreview').src=CURRENT_CONFIG.logo;
  if(window.updateLabels) updateLabels();
}
export function renderApercu(){
  let c=CURRENT_CONFIG; let isAndroid=/Android/i.test(navigator.userAgent);
  document.getElementById('apercuFacture').innerHTML=`
  <div><b>${esc(c.nom)}</b> - ${isAndroid?'MOBILE':'PC'} MODE<br><small>${esc(c.tel)} - ${esc(c.imprimante?.type||'pdf')} - ${esc(c.imprimante?.nom||'')}</small></div><hr>
  <div id="printerStatus" style="padding:10px;background:${isAndroid?'#fef9c3':'#f0fdf4'};border:2px solid #22c55e;border-radius:8px">${isAndroid?'📱 Android: Utilise RawBT pour Tecno Spark 10':'🖥️ PC: Connexion directe Bluetooth'} - Prêt</div>
  <div style="margin-top:8px;display:flex;gap:6px"><button class="btn btn-b" onclick="window.connecterImprimanteUniverselle()">📡 CONNECTER H22/T58</button><button class="btn btn-g" onclick="window.testTicketUniversel()">🧾 TEST TICKET</button></div>
  <p style="font-size:10px;margin-top:6px">PC: Direct OK | Tecno Spark 10: Installe RawBT > Connecte T58_AFC6 dans RawBT > TEST</p>`;
}
export function dupliquerConfig(){ let s=SHOP==='ALL'?'Menkao1':SHOP; let d=prompt('Vers?','Menkao2'); if(!d) return; db.ref('shops/'+s+'/config_entreprise').once('value').then(snap=>{ let c=snap.val(); if(c) db.ref('shops/'+d+'/config_entreprise').set(c); }); }

window.saveConfig=saveConfig; window.loadConfig=loadConfig; window.applyConfigToUI=applyConfigToUI; window.renderApercu=renderApercu; window.dupliquerConfig=dupliquerConfig;
window.connecterImprimanteUniverselle=connecterImprimanteUniverselle; window.testTicketUniversel=testTicketUniversel; window.imprimerVenteUniverselle=imprimerVenteUniverselle;
window.connecterImprimanteH22=connecterImprimanteUniverselle; window.testTicketH22=testTicketUniversel;
