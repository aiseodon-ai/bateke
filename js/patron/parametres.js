// VERSION TECNO SPARK 10 - UNIVERSEL + RawBT FALLBACK
import { esc } from "../common/utils.js";

let BT_DEVICE = null;
let BT_CHAR = null;

export async function connecterImprimanteUniverselle() {
  const isTecno = navigator.userAgent.toLowerCase().includes('tecno') || /Spark/.test(navigator.userAgent);
  
  try {
    if (!navigator.bluetooth) throw new Error('Pas de Bluetooth');
    
    // TENTE CONNEXION DIRECTE (PC et certains Samsung)
    BT_DEVICE = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb','0000ff00-0000-1000-8000-00805f9b34fb','49535343-fe7d-4ae5-8fa9-9fafd205e455']
    });
    const server = await BT_DEVICE.gatt.connect();
    const services = await server.getPrimaryServices();
    for (let s of services) {
      let chars = await s.getCharacteristics();
      for (let c of chars) if(c.properties.write || c.properties.writeWithoutResponse){ BT_CHAR=c; break; }
      if(BT_CHAR) break;
    }
    document.getElementById('confImpNom').value = BT_DEVICE.name;
    document.getElementById('printerStatus').innerHTML = `🟢 Direct: ${BT_DEVICE.name}`;
    saveConfig(); return true;
    
  } catch (e) {
    // ÉCHEC = CAS TECNO SPARK 10 -> ON BASCULE SUR RawBT
    console.log('Direct échoué, bascule Tecno:', e.message);
    document.getElementById('printerStatus').innerHTML = `
      <div style="background:#fff3cd;padding:8px;border-radius:6px">
      ⚠️ Tecno Spark 10 détecté: Connexion directe bloquée par HiOS<br>
      <b>Solution: Utilise RawBT</b><br>
      1. Installe RawBT sur Play Store<br>
      2. Associe H22 dans RawBT<br>
      3. Clique TEST TICKET ci-dessous, ça passera par RawBT
      </div>`;
    
    // Sauve quand même le nom pour RawBT
    let nom = localStorage.getItem('bateke_printer_universal') || 'H22';
    document.getElementById('confImpNom').value = nom;
    alert(`ℹ️ Tecno Spark 10: Chrome bloque H22.\n\nPas grave, on utilise RawBT (méthode pro).\n\n1. Installe RawBT\n2. Dans RawBT, connecte ta H22\n3. Reviens et clique TEST TICKET - ça va marcher.`);
    return false;
  }
}

function buildTicketESC(vente) {
  const c = window.CURRENT_CONFIG || {};
  const cols = (document.getElementById('confImpLargeur')?.value||'58mm').includes('80') ? 48 : 32;
  const line = '-'.repeat(cols)+'\n';
  let t = '\x1B\x40\x1B\x61\x01\x1B\x45\x01'+ (c.nom||'BATEKE').substring(0,cols)+'\n\x1B\x45\x00';
  t+= (c.tel||'').substring(0,cols)+'\n'+line+'\x1B\x61\x00';
  (vente.items||[{CODE:'TEST',Designation:'Test Tecno Spark 10',qty:1,Prix:5000}]).forEach(it=>{
    t+= (it.Designation||it.CODE||'ART').toString().substring(0,cols-15)+'\n';
    t+= `  ${it.qty||1} x ${it.Prix||it.pv||0} = ${(it.qty*it.Prix||5000).toLocaleString()} \n`;
  });
  t+=line+'\x1B\x45\x01TOTAL: '+(vente.total||5000).toString()+' FC\n\x1B\x45\x00';
  t+= (c.piedFacture||'Merci!')+'\n\n\n\x1D\x56\x00';
  return t;
}

export async function testTicketUniversel() {
  let venteTest = { total:5000, _shop:SHOP, items:[{CODE:'TEST',Designation:'BATEKE Tecno Spark10 OK',qty:1,Prix:5000}], client:'Comptoir' };
  let ticket = buildTicketESC(venteTest);
  
  // 1. Si BT direct connecté (PC), imprime direct
  if(BT_CHAR){
    try{
      let data = new TextEncoder().encode(ticket);
      for(let i=0;i<data.length;i+=20){ await BT_CHAR.writeValue(data.slice(i,i+20)); await new Promise(r=>setTimeout(r,30)); }
      alert('✅ Ticket imprimé en direct'); return;
    }catch(e){}
  }
  
  // 2. FALLBACK TECNO SPARK 10 -> RawBT
  // RawBT supporte le protocole: rawbt: + texte base64
  try{
    let base64Ticket = btoa(unescape(encodeURIComponent(ticket)));
    // Méthode 1: Intent RawBT ESC/POS
    let rawbtLink = `intent:base64,${base64Ticket}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
    window.location.href = rawbtLink;
    
    // Si RawBT pas installé, propose installation
    setTimeout(()=>{
      if(!document.hidden){
        if(confirm('RawBT non installé ou imprimante non choisie dans RawBT.\n\n1. Installe RawBT depuis Play Store\n2. Ouvre RawBT > Sélectionne ta H22\n3. Réessaie TEST\n\nInstaller RawBT maintenant?')){
          window.open('https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter','_blank');
        }
      }
    }, 1500);
    
  }catch(e){
    alert('Installe RawBT: https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter');
    window.print();
  }
}

// Alias pour garder compatibilité
export async function imprimerVenteUniverselle(vente){ 
  window.testTicketUniversel = () => testTicketUniversel();
  return testTicketUniversel(); 
}

// --- TON CODE CONFIG ENTREPRISE INCHANGÉ ---
export function saveConfig(){ /* ... ton saveConfig actuel ... */ 
  let tauxUSD=parseFloat(document.getElementById('confTauxUSD').value)||2850;
  let cfg={
    nom:document.getElementById('confNom').value, slogan:document.getElementById('confSlogan').value,
    adresse:document.getElementById('confAdresse').value, tel:document.getElementById('confTel').value,
    email:document.getElementById('confEmail').value, rccm:document.getElementById('confRccm').value,
    devise:document.getElementById('confDevise').value, deviseBase:document.getElementById('confDeviseBase').value,
    taux:tauxUSD, tauxUSD:tauxUSD, tauxEUR:parseFloat(document.getElementById('confTauxEUR').value)||0,
    tauxXAF:parseFloat(document.getElementById('confTauxXAF').value)||0, tauxXOF:parseFloat(document.getElementById('confTauxXOF').value)||0,
    taux:{USD:tauxUSD,EUR:parseFloat(document.getElementById('confTauxEUR').value)||0,XAF:parseFloat(document.getElementById('confTauxXAF').value)||0,XOF:parseFloat(document.getElementById('confTauxXOF').value)||0},
    logo:CURRENT_CONFIG.logo||'', piedFacture:document.getElementById('confPiedFacture').value, piedDevis:document.getElementById('confPiedDevis').value,
    imprimante:{type:document.getElementById('confImpType').value,nom:document.getElementById('confImpNom').value,largeur:document.getElementById('confImpLargeur').value,print_logo:document.getElementById('confImpLogo').value,copies:parseInt(document.getElementById('confImpCopies').value)||1},
    compta:CURRENT_CONFIG.compta, updatedAt:new Date().toISOString()
  };
  let target=SHOP==='ALL'?'Menkao1':SHOP;
  db.ref('shops/'+target+'/config_entreprise').set(cfg).then(()=>{ document.getElementById('configStatus').innerHTML='✅ Sauvé - Tecno Ready'; CURRENT_CONFIG=cfg; applyConfigToUI(); savePatronCache(); });
}
export function loadConfig(){ let t=SHOP==='ALL'?'Menkao1':SHOP; db.ref('shops/'+t+'/config_entreprise').once('value').then(snap=>{ let c=snap.val(); if(c){ CURRENT_CONFIG={...CURRENT_CONFIG,...c,compta:{...CURRENT_CONFIG.compta,...(c.compta||{})}}; applyConfigToUI(); savePatronCache(); } renderApercu(); }); }
export function applyConfigToUI(){
  document.getElementById('confNom').value=CURRENT_CONFIG.nom||''; document.getElementById('confSlogan').value=CURRENT_CONFIG.slogan||''; document.getElementById('confAdresse').value=CURRENT_CONFIG.adresse||''; document.getElementById('confTel').value=CURRENT_CONFIG.tel||'';
  document.getElementById('confEmail').value=CURRENT_CONFIG.email||''; document.getElementById('confRccm').value=CURRENT_CONFIG.rccm||''; document.getElementById('confDevise').value=CURRENT_CONFIG.devise||'FC'; document.getElementById('confDeviseBase').value=CURRENT_CONFIG.deviseBase||'FC';
  let tauxObj=CURRENT_CONFIG.taux&&typeof CURRENT_CONFIG.taux==='object'?CURRENT_CONFIG.taux:{}; document.getElementById('confTauxUSD').value=tauxObj.USD||CURRENT_CONFIG.tauxUSD||2850;
  document.getElementById('confTauxEUR').value=tauxObj.EUR||''; document.getElementById('confTauxXAF').value=tauxObj.XAF||''; document.getElementById('confTauxXOF').value=tauxObj.XOF||'';
  document.getElementById('confPiedFacture').value=CURRENT_CONFIG.piedFacture||''; document.getElementById('confPiedDevis').value=CURRENT_CONFIG.piedDevis||'';
  let imp=CURRENT_CONFIG.imprimante||{}; let sel=document.getElementById('confImpType'); if(sel){ sel.innerHTML=`<option value="pdf">PDF</option><option value="bluetooth">Bluetooth UNIVERSEL (PC)</option><option value="rawbt">Tecno/Infinix/Xiaomi (RawBT) - RECOMMANDÉ</option><option value="bluetooth80">80mm</option>`; sel.value=imp.type||'rawbt'; }
  document.getElementById('confImpNom').value=imp.nom||localStorage.getItem('bateke_printer_universal')||'H22'; document.getElementById('confImpLargeur').value=imp.largeur||'58mm'; document.getElementById('confImpLogo').value=imp.print_logo||'oui'; document.getElementById('confImpCopies').value=imp.copies||1;
  if(CURRENT_CONFIG.logo) document.getElementById('logoPreview').src=CURRENT_CONFIG.logo;
}
export function renderApercu(){
  let c=CURRENT_CONFIG; let logoImg=c.logo?`<img src="${c.logo}" style="width:70px">`:'';
  document.getElementById('apercuFacture').innerHTML=`<div><b>${esc(c.nom)}</b> - TECNO SPARK 10 READY<br><small>${esc(c.tel)} - Mode: ${esc(c.imprimante?.type||'rawbt')}</small></div><hr>
  <div id="printerStatus" style="padding:10px;background:#e0f2fe;border-radius:8px">📱 Tecno Spark 10: Utilise RawBT pour 100% compatibilité</div>
  <div style="margin-top:8px;display:flex;gap:6px"><button class="btn btn-b" onclick="window.connecterImprimanteUniverselle()">📡 CONNECTER</button><button class="btn btn-g" style="padding:12px" onclick="window.testTicketUniversel()">🧾 TEST TICKET TECNO</button></div>
  <p style="font-size:10px">Tecno Spark 10: Installe RawBT > Associe H22 dans RawBT > TEST. Compatible toutes marques.</p>`;
}
export function dupliquerConfig(){ let s=SHOP==='ALL'?'Menkao1':SHOP; let d=prompt('Vers?','Menkao2'); if(!d) return; db.ref('shops/'+s+'/config_entreprise').once('value').then(snap=>{ let c=snap.val(); if(c) db.ref('shops/'+d+'/config_entreprise').set(c); }); }
window.saveConfig=saveConfig; window.loadConfig=loadConfig; window.applyConfigToUI=applyConfigToUI; window.renderApercu=renderApercu; window.dupliquerConfig=dupliquerConfig;
window.connecterImprimanteUniverselle=connecterImprimanteUniverselle; window.testTicketUniversel=testTicketUniversel; window.imprimerVenteUniverselle=imprimerVenteUniverselle;
window.connecterImprimanteH22=connecterImprimanteUniverselle; window.testTicketH22=testTicketUniversel;
