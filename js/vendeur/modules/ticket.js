// js/vendeur/modules/ticket.js - VENDEUR 58MM - V5.6.5 QR SUPERMARCHE V1 - V5.6.4 INTACTE + QR
import { STATE } from '../core/state.js';

let BT_DEVICE = null; let BT_CHAR = null;
function bytesToBase64(bytes){ let bin=''; bytes.forEach(b=>bin+=String.fromCharCode(b)); return btoa(bin); }

function getTicketConfig(){
  let c = {};
  if(window.CURRENT_CONFIG) c = {...c, ...window.CURRENT_CONFIG};
  if(STATE.CONFIG_ENTREPRISE) c = {...c, ...STATE.CONFIG_ENTREPRISE};
  if(STATE.TICKET_CONFIG) c = {...c, ...STATE.TICKET_CONFIG};
  try{
    let saved = JSON.parse(localStorage.getItem('bateke_printer_cfg_'+STATE.SHOP)||'{}');
    c = {...saved, ...c};
    let cfgEnt = JSON.parse(localStorage.getItem('bateke_cfg_'+STATE.SHOP)||'{}');
    if(cfgEnt.nom) c.nom = cfgEnt.nom;
    if(cfgEnt.tel) c.tel = cfgEnt.tel;
    if(cfgEnt.adresse) c.adresse = cfgEnt.adresse;
    if(cfgEnt.piedFacture) c.piedFacture = cfgEnt.piedFacture;
  }catch(e){}
  return c;
}
function formatPrix(n){ n = Math.round(parseFloat(n)||0); return String(n); }
function cleanASCII(str){
  if(!str) return '';
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
}

// --- AJOUT V5.6.5 QR - 0 MODIF DE V5.6.4 ---
function buildQRBytes(data){
  data = String(data||'').substring(0,180);
  let len = data.length + 3;
  let pL = len % 256, pH = Math.floor(len/256);
  let qr = '';
  qr += '\x1D\x28\x6B\x04\x00\x31\x41\x32\x00';
  qr += '\x1D\x28\x6B\x03\x00\x31\x43\x06';
  qr += '\x1D\x28\x6B\x03\x00\x31\x45\x30';
  qr += '\x1D\x28\x6B' + String.fromCharCode(pL) + String.fromCharCode(pH) + '\x31\x50\x30' + data;
  qr += '\x1D\x28\x6B\x03\x00\x31\x51\x30';
  return qr;
}
function getTicketQRData(vente, c){
  let d = new Date();
  let date = d.toLocaleDateString('fr-CD')+' '+d.toLocaleTimeString('fr-CD').slice(0,5);
  let total = formatPrix(vente.total||0);
  let nb = (vente.items||vente.panier||[]).length;
  let shop = cleanASCII(STATE.SHOP||'BATEKE');
  let ticketId = cleanASCII(String(vente.id||Date.now()).slice(-8));
  return `BATEKE ${shop}|T:${ticketId}|${date}|TOTAL:${total}FC|${nb}ART`;
}

function buildTicketBytes(vente){
  const c = getTicketConfig();
  const cols = (c.imprimante?.largeur||'58mm').includes('80')?48:32;
  const line='-'.repeat(cols)+'\n';
  
  let str='\x1B\x40\x1B\x61\x01\x1B\x45\x01'+cleanASCII(c.nom||STATE.SHOP||'BATEKE').substring(0,cols)+'\n\x1B\x45\x00';
  str+=cleanASCII(c.slogan||'')+'\n';
  str+=cleanASCII(c.adresse||'364, rue, massano...').substring(0,cols)+'\n';
  str+=cleanASCII(c.tel||'+243...').substring(0,cols)+'\n'+line+'\x1B\x61\x00';
  
  str+=`Shop: ${cleanASCII(STATE.SHOP)} - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
  str+=`Vend: ${cleanASCII(STATE.CURRENT_VENDEUR?.nom||'')}\n`;
  str+=`Ticket: ${vente.id||Date.now()}\n`+line;
  
  (vente.items||vente.panier||[]).forEach(it=>{
    let des=cleanASCII(it.Designation||it.CODE||'ARTICLE').toString().substring(0,cols-2);
    let q=it.qty||it.qte||1;
    let pu=formatPrix(it.Prix||it.pv||it['Prix Unit']||it.prix||0);
    let tot=formatPrix(q * (it.Prix||it.pv||it['Prix Unit']||it.prix||0));
    str+=des+'\n';
    str+=`  ${q} x ${pu} = ${tot} FC\n`;
  });
  
  str+=line+'\x1B\x45\x01TOTAL: '+formatPrix(vente.total||0)+' FC\n\x1B\x45\x00'+line;
  // --- AJOUT QR SUPERMARCHE V1 ICI - AVANT PIED ---
  let qrData = getTicketQRData(vente, c);
  str+='\x1B\x61\x01Scannez pour verifier\n';
  str+=buildQRBytes(qrData);
  str+='\n'+cleanASCII(String(vente.id||'').slice(-8))+'\n\x1B\x61\x00';
  str+=cleanASCII(c.piedFacture||c.pied||'Marchandise vendue non retournable. Merci.')+'\n\n\n\x1D\x56\x00';
  return new TextEncoder().encode(str);
}

export async function imprimerVenteUniverselle(vente){
  if(!vente) return;
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
      console.log("✅ Ticket imprimé PC direct"); return true;
    }catch(e){ console.warn("PC print fail", e); }
  }
  if(isAndroid){
    let b64=bytesToBase64(bytes);
    window.location.href=`rawbt:base64,${b64}`;
    console.log("📱 Envoi RawBT Android"); return true;
  }
  window.printTicketFallback?.(vente);
  return false;
}

export async function testTicketUniversel(){
  let vente={ id:'TEST'+Date.now().toString().slice(-4), total:5000, items:[{CODE:'TEST',Designation:'BATEKE TEST '+STATE.SHOP+' OK',qty:1,Prix:5000}] };
  return imprimerVenteUniverselle(vente);
}

export async function connecterImprimanteUniverselle(){
  let isAndroid=/Android/i.test(navigator.userAgent);
  if(isAndroid){
    alert(`📱 Android détecté\n\nSur Tecno, utilise directement:\n1. Ouvre RawBT\n2. Choisis ${localStorage.getItem('bateke_printer_universal')||'T58_AFC6'}\n3. Clique TEST TICKET`);
    return false;
  }
  try{
    BT_DEVICE = await navigator.bluetooth.requestDevice({
      acceptAllDevices:true,
      optionalServices:['000018f0-0000-1000-8000-00805f9b34fb','0000ff00-0000-1000-8000-00805f9b34fb']
    });
    const server = await BT_DEVICE.gatt.connect();
    const services = await server.getPrimaryServices();
    for(let s of services){
      let chars=await s.getCharacteristics().catch(()=>[]);
      for(let c of chars){ if(c.properties.write||c.properties.writeWithoutResponse){ BT_CHAR=c; break; } }
      if(BT_CHAR) break;
    }
    alert(`🟢 Connectée: ${BT_DEVICE.name}`);
    return true;
  }catch(e){ alert('Erreur: '+e.message); return false; }
}

window.imprimerVenteUniverselle=imprimerVenteUniverselle;
window.testTicketUniversel=testTicketUniversel;
window.connecterImprimanteUniverselle=connecterImprimanteUniverselle;
console.log("🎫 ticket.js VENDEUR 58mm V5.6.5 QR SUPERMARCHE OK");
