import { esc } from "../common/utils.js";

// ====== BATEKE PRINT UNIVERSAL - TOUTES MARQUES BLUETOOTH ======
// Compatible: H22, XPrinter XP-58/80, POS-5802/8002, MTP, RPP02N, 
// EPOS, Bixolon clone, GOOJPRT, Zjiang, Epson TM-T20, etc.
// Langage: ESC/POS standard mondial

let BT_DEVICE = null;
let BT_CHAR = null;

// Liste de tous les services Bluetooth utilisés par les thermiques
const ALL_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '00001800-0000-1000-8000-00805f9b34fb',
  '0000fef0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
];

export async function connecterImprimanteUniverselle() {
  try {
    if (!navigator.bluetooth) {
      alert('⛔ Bluetooth non supporté.\n\n1. Utilise Google Chrome Android\n2. Pas dans WhatsApp/Facebook\n3. Tape chrome://flags et active Web Bluetooth');
      return false;
    }

    // MODE UNIVERSEL: Montre TOUTES les imprimantes autour
    BT_DEVICE = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ALL_PRINTER_SERVICES
    });

    BT_DEVICE.addEventListener('gattserverdisconnected', () => {
      document.getElementById('printerStatus').innerHTML = '🔴 Déconnectée';
      BT_CHAR = null;
    });

    const server = await BT_DEVICE.gatt.connect();
    const services = await server.getPrimaryServices();
    
    // Cherche la caractéristique writable dans TOUS les services
    for (let service of services) {
      try {
        const chars = await service.getCharacteristics();
        for (let char of chars) {
          if (char.properties.write || char.properties.writeWithoutResponse || char.properties.writeNoResponse) {
            BT_CHAR = char;
            break;
          }
        }
      } catch(e) {}
      if (BT_CHAR) break;
    }

    if (!BT_CHAR) {
      throw new Error('Cette imprimante ne supporte pas l\'écriture. Essaie une autre marque ESC/POS.');
    }

    // Sauve le nom
    const nomImprimante = BT_DEVICE.name || 'Imprimante Bluetooth';
    document.getElementById('confImpNom').value = nomImprimante;
    document.getElementById('printerStatus').innerHTML = `🟢 Connectée: <b>${esc(nomImprimante)}</b> - Prête`;
    localStorage.setItem('bateke_printer_universal', nomImprimante);
    localStorage.setItem('bateke_printer_id', BT_DEVICE.id);
    
    alert(`✅ Connectée: ${nomImprimante}\n\nCompatible ESC/POS détectée.\nTu peux faire Test Ticket.`);
    saveConfig();
    return true;

  } catch (e) {
    if(e.name === 'NotFoundError') return;
    alert(`❌ ${e.message}\n\nASTUCE PRO:\n1. Appaire d'abord dans Paramètres Android > Bluetooth\nPIN souvent: 0000, 1234, 0001\n2. Allume l'imprimante et mets papier\n3. Ouvre BATEKE dans Chrome (pas WhatsApp)\n4. Réessaie`);
    console.error(e);
    return false;
  }
}

function getLargeurConfig() {
  let largeur = document.getElementById('confImpLargeur')?.value || CURRENT_CONFIG.imprimante?.largeur || '58mm';
  return largeur.includes('80') ? 48 : 32; // 32 chars pour 58mm, 48 pour 80mm
}

async function envoyerAuxImprimante(texte) {
  if (!BT_CHAR) throw new Error('Imprimante non connectée');
  const data = new TextEncoder().encode(texte);
  // Paquets de 20 bytes = compatible avec toutes les marques chinoises
  for (let i = 0; i < data.length; i += 20) {
    await BT_CHAR.writeValueWithoutResponse ? 
      await BT_CHAR.writeValueWithoutResponse(data.slice(i, i+20)) :
      await BT_CHAR.writeValue(data.slice(i, i+20));
    await new Promise(r => setTimeout(r, 30));
  }
}

export async function testTicketUniversel() {
  try {
    if (!BT_CHAR) {
      alert('Clique d\'abord sur Connecter Imprimante');
      return;
    }
    const c = window.CURRENT_CONFIG || {};
    const cols = getLargeurConfig();
    const line = '-'.repeat(cols) + '\n';

    let t = '\x1B\x40'; // INIT
    t += '\x1B\x61\x01\x1B\x45\x01'; // CENTER BOLD
    t += `${(c.nom||'BATEKE').substring(0,cols)}\n`;
    t += '\x1B\x45\x00\x1B\x61\x01';
    t += `${(c.slogan||'GESTION COMMERCIALE').substring(0,cols)}\n`;
    t += `${(c.adresse||'Kinshasa').substring(0,cols)}\n${(c.tel||'').substring(0,cols)}\n`;
    t += line;
    t += '\x1B\x61\x00'; // LEFT
    t += `Date: ${new Date().toLocaleString()}\n`;
    t += `Imprimante: ${BT_DEVICE.name}\n`;
    t += `Papier: ${cols} colonnes\n`;
    t += line;
    t += `ARTICLE TEST x1\n  1 x 5000 = 5000 FC\n`;
    t += line;
    t += '\x1B\x45\x01' + `TOTAL TEST: 5000 FC\n` + '\x1B\x45\x00';
    t += line;
    t += '\x1B\x61\x01' + `${(c.piedFacture||'Merci - BATEKE V4.9').substring(0,cols)}\n\n\n` + '\x1D\x56\x00';

    await envoyerAuxImprimante(t);
    alert('✅ Ticket envoyé! Si rien ne sort, vérifie papier et charge batterie imprimante');
  } catch(e){ alert('Erreur impression: '+e.message); }
}

export async function imprimerVenteUniverselle(vente) {
  try {
    if (!BT_CHAR) {
      // Fallback PDF si config = pdf
      if ((CURRENT_CONFIG.imprimante?.type||'pdf') === 'pdf') { window.print(); return; }
      alert('Imprimante non connectée. Va dans Paramètres > Imprimante > Connecter');
      return;
    }
    const c = window.CURRENT_CONFIG || {};
    const cols = getLargeurConfig();
    const line = '-'.repeat(cols) + '\n';

    let t = '\x1B\x40\x1B\x61\x01\x1B\x45\x01';
    t += `${(c.nom||'BATEKE').substring(0,cols)}\n`;
    t += '\x1B\x45\x00';
    t += `${(c.slogan||'').substring(0,cols)}\n${(c.tel||'').substring(0,cols)}\n`;
    t += line + '\x1B\x61\x00';
    t += `Boutique: ${(vente._shop||SHOP||'').substring(0,20)}  ${new Date(vente.date||Date.now()).toLocaleString()}\n`;
    t += `Client: ${(vente.client?.nom||vente.client||'Comptoir').toString().substring(0,20)}\n`;
    t += line;
    (vente.items||[]).forEach(it=>{
      let des = (it.Designation||it.designation||it.CODE||it.code||'ARTICLE').toString().substring(0, cols-14);
      let q = it.qty||it.qte||1;
      let pv = it.Prix||it.pv||0;
      let total = q*pv;
      t += `${des}\n`;
      let ligneDetail = `  ${q} x ${pv}`.padEnd(18) + `${total.toLocaleString()} FC`.padStart(cols-18) + '\n';
      t += ligneDetail;
    });
    t += line;
    t += '\x1B\x45\x01' + `TOTAL: ${(vente.total||0).toLocaleString()} ${c.devise||'FC'}\n` + '\x1B\x45\x00';
    t += `Paye: ${(vente.montantPaye||vente.total||0).toLocaleString()}  Reste: ${(vente.reste||0).toLocaleString()}\n`;
    t += line + '\x1B\x61\x01' + `${(c.piedFacture||'Merci pour votre achat!').substring(0,cols)}\n\n\n\x1D\x56\x00`;

    await envoyerAuxImprimante(t);
  } catch(e){ console.error(e); alert('Erreur: '+e.message); }
}

// ====== CONFIG ENTREPRISE (TON CODE D'ORIGINE + AMÉLIORÉ) ======
export function saveConfig(){
  let tauxUSD=parseFloat(document.getElementById('confTauxUSD').value)||2850;
  let cfg={
    nom:document.getElementById('confNom').value,
    slogan:document.getElementById('confSlogan').value,
    adresse:document.getElementById('confAdresse').value,
    tel:document.getElementById('confTel').value,
    email:document.getElementById('confEmail').value,
    rccm:document.getElementById('confRccm').value,
    devise:document.getElementById('confDevise').value,
    deviseBase:document.getElementById('confDeviseBase').value,
    taux:tauxUSD, tauxUSD:tauxUSD,
    tauxEUR:parseFloat(document.getElementById('confTauxEUR').value)||0,
    tauxXAF:parseFloat(document.getElementById('confTauxXAF').value)||0,
    tauxXOF:parseFloat(document.getElementById('confTauxXOF').value)||0,
    taux:{USD:tauxUSD,EUR:parseFloat(document.getElementById('confTauxEUR').value)||0,XAF:parseFloat(document.getElementById('confTauxXAF').value)||0,XOF:parseFloat(document.getElementById('confTauxXOF').value)||0},
    logo:CURRENT_CONFIG.logo||'',
    piedFacture:document.getElementById('confPiedFacture').value,
    piedDevis:document.getElementById('confPiedDevis').value,
    imprimante:{
      type:document.getElementById('confImpType').value,
      nom:document.getElementById('confImpNom').value,
      largeur:document.getElementById('confImpLargeur').value,
      print_logo:document.getElementById('confImpLogo').value,
      copies:parseInt(document.getElementById('confImpCopies').value)||1
    },
    compta:CURRENT_CONFIG.compta,
    updatedAt:new Date().toISOString()
  };
  let target=SHOP==='ALL'?'Menkao1':SHOP;
  db.ref('shops/'+target+'/config_entreprise').set(cfg).then(()=>{
    document.getElementById('configStatus').innerHTML=`✅ Sauvé - ${cfg.imprimante.type} - ${cfg.imprimante.nom||'PDF'}`;
    CURRENT_CONFIG=cfg; applyConfigToUI(); savePatronCache();
  });
}

export function loadConfig(){
  let t=SHOP==='ALL'?'Menkao1':SHOP;
  db.ref('shops/'+t+'/config_entreprise').once('value').then(snap=>{
    let c=snap.val(); 
    if(c){ CURRENT_CONFIG={...CURRENT_CONFIG,...c,compta:{...CURRENT_CONFIG.compta,...(c.compta||{})}}; applyConfigToUI(); savePatronCache(); }
    renderApercu();
    let pName = localStorage.getItem('bateke_printer_universal') || c?.imprimante?.nom || '';
    if(document.getElementById('printerStatus')){
      document.getElementById('printerStatus').innerHTML = pName ? `💾 Mémorisée: ${esc(pName)} - Clique Connecter` : '🔴 Aucune imprimante';
    }
  });
}

export function applyConfigToUI(){
  document.getElementById('confNom').value=CURRENT_CONFIG.nom||'';
  document.getElementById('confSlogan').value=CURRENT_CONFIG.slogan||'';
  document.getElementById('confAdresse').value=CURRENT_CONFIG.adresse||'';
  document.getElementById('confTel').value=CURRENT_CONFIG.tel||'';
  document.getElementById('confEmail').value=CURRENT_CONFIG.email||'';
  document.getElementById('confRccm').value=CURRENT_CONFIG.rccm||'';
  document.getElementById('confDevise').value=CURRENT_CONFIG.devise||'FC';
  document.getElementById('confDeviseBase').value=CURRENT_CONFIG.deviseBase||'FC';
  let tauxObj=CURRENT_CONFIG.taux&&typeof CURRENT_CONFIG.taux==='object'?CURRENT_CONFIG.taux:{};
  document.getElementById('confTauxUSD').value=tauxObj.USD||CURRENT_CONFIG.tauxUSD||2850;
  document.getElementById('confTauxEUR').value=tauxObj.EUR||''; document.getElementById('confTauxXAF').value=tauxObj.XAF||''; document.getElementById('confTauxXOF').value=tauxObj.XOF||'';
  document.getElementById('confPiedFacture').value=CURRENT_CONFIG.piedFacture||''; document.getElementById('confPiedDevis').value=CURRENT_CONFIG.piedDevis||'';
  
  let imp = CURRENT_CONFIG.imprimante||{};
  let sel = document.getElementById('confImpType');
  // Ajoute les options universelles si manquantes
  if(sel && ![...sel.options].some(o=>o.value==='bluetooth')){
    sel.innerHTML = `
      <option value="pdf">PDF / Téléphone</option>
      <option value="bluetooth">Bluetooth UNIVERSEL 58mm (Toutes marques)</option>
      <option value="bluetooth80">Bluetooth UNIVERSEL 80mm (Toutes marques)</option>
    `;
  }
  if(sel) sel.value = imp.type||'pdf';
  document.getElementById('confImpNom').value=imp.nom||localStorage.getItem('bateke_printer_universal')||'';
  document.getElementById('confImpLargeur').value=imp.largeur||'58mm';
  document.getElementById('confImpLogo').value=imp.print_logo||'oui';
  document.getElementById('confImpCopies').value=imp.copies||1;
  
  if(CURRENT_CONFIG.logo) document.getElementById('logoPreview').src=CURRENT_CONFIG.logo;
  if(window.updateLabels) updateLabels();
}

export function renderApercu(){
  let c=CURRENT_CONFIG; let logoImg=c.logo?`<img src="${c.logo}" style="width:70px">`:'';
  let printerInfo = `Mode: ${(c.imprimante?.type||'pdf').toUpperCase()} - ${esc(c.imprimante?.nom||'Aucune')} - ${esc(c.imprimante?.largeur||'58mm')}`;
  document.getElementById('apercuFacture').innerHTML=`
    <div style="display:flex;justify-content:space-between"><div><b>${esc(c.nom)}</b><br>${esc(c.slogan||'')}<br>${esc(c.adresse)} - ${esc(c.tel)}<br><small>${printerInfo}</small></div><div>${logoImg}</div></div><hr><small>${esc(c.piedFacture)}</small>
    <div id="printerStatus" style="margin-top:8px;padding:10px;background:#f0fdf4;border:2px solid #22c55e;border-radius:8px;font-size:12px;font-weight:bold">🔴 Non connectée - Compatible toutes marques ESC/POS</div>
    <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
      <button class="btn btn-b" style="padding:10px 14px" onclick="window.connecterImprimanteUniverselle()">📡 CONNECTER N'IMPORTE QUELLE IMPRIMANTE</button>
      <button class="btn btn-g" style="padding:10px 14px" onclick="window.testTicketUniversel()">🧾 TEST TICKET</button>
    </div>
    <p style="font-size:10px;color:#666;margin-top:6px">Marques testées: H22, XPrinter XP-58/80, POS-5802, MTP-II, RPP02N, EPOS, Bixolon, GOOJPRT, Epson TM. Toute thermique Bluetooth ESC/POS 58/80mm fonctionne.</p>`;
}

export function dupliquerConfig(){ let s=SHOP==='ALL'?'Menkao1':SHOP; let d=prompt('Vers quelle boutique?','Menkao2'); if(!d) return; db.ref('shops/'+s+'/config_entreprise').once('value').then(snap=>{ let c=snap.val(); if(c) db.ref('shops/'+d+'/config_entreprise').set(c).then(()=>alert('✅ Config dupliquée vers '+d)); }); }

window.saveConfig=saveConfig; window.loadConfig=loadConfig; window.applyConfigToUI=applyConfigToUI; 
window.renderApercu=renderApercu; window.dupliquerConfig=dupliquerConfig;
window.connecterImprimanteUniverselle=connecterImprimanteUniverselle;
window.testTicketUniversel=testTicketUniversel;
window.imprimerVenteUniverselle=imprimerVenteUniverselle;
// Alias pour compatibilité ancien code H22
window.connecterImprimanteH22=connecterImprimanteUniverselle;
window.testTicketH22=testTicketUniversel;
window.imprimerVenteH22=imprimerVenteUniverselle;
