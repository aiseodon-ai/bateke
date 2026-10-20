// js/vendeur/modules/ticket.js - VENDEUR 58MM - UTILISE MEME MOTEUR QUE PATRON
import { STATE } from '../core/state.js';

let BT_DEVICE = null; let BT_CHAR = null;
function bytesToBase64(bytes){ let bin=''; bytes.forEach(b=>bin+=String.fromCharCode(b)); return btoa(bin); }

function getTicketConfig(){
  let c = STATE.TICKET_CONFIG || STATE.CONFIG_ENTREPRISE || JSON.parse(localStorage.getItem('bateke_printer_cfg_'+STATE.SHOP)||'{}') || {};
  // Si config_entreprise du patron existe, on l'utilise
  if(window.CURRENT_CONFIG) c = {...c, ...window.CURRENT_CONFIG};
  return c;
}

function buildTicketBytes(vente){
  const c = getTicketConfig();
  const cols = (c.imprimante?.largeur||'58mm').includes('80')?48:32;
  const line='-'.repeat(cols)+'\n';
  let str='\x1B\x40\x1B\x61\x01\x1B\x45\x01'+(c.nom||STATE.SHOP||'BATEKE').substring(0,cols)+'\n\x1B\x45\x00';
  str+=(c.slogan||'').substring(0,cols)+'\n';
  str+=(c.adresse||'').substring(0,cols)+'\n';
  str+=(c.tel||'').substring(0,cols)+'\n'+line+'\x1B\x61\x00';
  str+=`Shop: ${STATE.SHOP} - ${new Date().toLocaleString()}\n`;
  str+=`Vend: ${(STATE.CURRENT_VENDEUR?.nom||'')}\n`;
  str+=`Ticket: ${vente.id||Date.now()}\n`+line;
  (vente.items||vente.panier||[]).forEach(it=>{
    let des=(it.Designation||it.CODE||'ARTICLE').toString().substring(0,cols-2);
    let q=it.qty||it.qte||1;
    let pu=it.Prix||it.pv||it['Prix Unit']||0;
    let tot=q*pu;
    str+=des+'\n';
    str+=`  ${q} x ${pu.toLocaleString()} = ${tot.toLocaleString()} FC\n`;
  });
  str+=line+'\x1B\x45\x01TOTAL: '+(vente.total||0).toLocaleString()+' FC\n\x1B\x45\x00'+line;
  str+=(c.piedFacture||c.pied||'Merci pour votre achat!')+'\n\n\n\x1D\x56\x00';
  return new TextEncoder().encode(str);
}

export async function imprimerVenteUniverselle(vente){
  if(!vente) return;
  let bytes = buildTicketBytes(vente);
  let isAndroid = /Android/i.test(navigator.userAgent);
  
  // 1. PC avec BT déjà connecté
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
  // 2. ANDROID TECNO -> RAWBT
  if(isAndroid){
    let b64=bytesToBase64(bytes);
    window.location.href=`rawbt:base64,${b64}`;
    console.log("📱 Envoi RawBT Android"); return true;
  }
  // 3. Fallback navigateur
  window.printTicketFallback?.(vente);
  return false;
}

export async function testTicketUniversel(){
  let vente={ id:'TEST', total:5000, items:[{CODE:'TEST',Designation:'BATEKE TEST '+STATE.SHOP+' OK',qty:1,Prix:5000}] };
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
console.log("🎫 ticket.js VENDEUR 58mm + RawBT chargé");
