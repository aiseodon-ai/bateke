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
    window.BT_DEVICE = BT_DEVICE;
    const server = await BT_DEVICE.gatt.connect();
    const services = await server.getPrimaryServices();
    for (let s of services) {
      try {
        let chars = await s.getCharacteristics();
        for (let c of chars) { if (c.properties.write || c.properties.writeWithoutResponse) { BT_CHAR = c; break; } }
      } catch(e){}
      if(BT_CHAR) break;
    }
    window.BT_CHAR = BT_CHAR;
    if (!BT_CHAR) throw new Error('Caractéristique non trouvée');
    
    const elNom = document.getElementById('confImpNom');
    if(elNom) elNom.value = BT_DEVICE.name || 'T58_AFC6';
    const elStatus = document.getElementById('printerStatus');
    if(elStatus) elStatus.innerHTML = `🟢 Connectée: ${esc(BT_DEVICE.name || 'Imprimante')} (Direct PC OK)`;
    
    if(BT_DEVICE?.name) localStorage.setItem('bateke_printer_universal', BT_DEVICE.name);
    if(typeof saveConfig === 'function') saveConfig();
    alert('✅ Connectée: '+(BT_DEVICE.name||'Imprimante')+' - Test maintenant!');
    return true;
  } catch (e) {
    if(e.name === 'NotFoundError') return false;
    let isTecnoPhone = /Tecno|Spark|Infinix|HOT|NOTE/i.test(navigator.userAgent) && /Android/i.test(navigator.userAgent);
    const elStatus = document.getElementById('printerStatus');
    if(isTecnoPhone){
      if(elStatus) elStatus.innerHTML = `⚠️ Tecno détecté: Utilise RawBT. Installe RawBT, connecte H22 dedans, puis clique TEST.`;
      alert('ℹ️ Tecno Spark 10: Chrome bloque le direct.\n\nSolution:\n1. Installe RawBT\n2. Connecte H22 dans RawBT\n3. Clique TEST TICKET');
    } else {
      if(elStatus) elStatus.innerHTML = `🔴 Erreur PC: ${esc(e.message)} - Déconnecte H22 dans Bluetooth Windows et réessaie`;
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
  t+= `Shop: ${window.SHOP||'Menkao1'} - ${new Date().toLocaleString()}\n`+line;
  (vente.items||[{CODE:'TEST',Designation:'Test Ticket',qty:1,Prix:5000}]).forEach(it=>{
    t+=(it.Designation||it.CODE||'ARTICLE').toString().substring(0,cols-12)+'\n';
    t+=`  ${it.qty||1} x ${it.Prix||it.pv||0} = ${((it.qty||1)*(it.Prix||it.pv||0)).toLocaleString()} FC\n`;
  });
  t+=line+'\x1B\x45\x01TOTAL: '+(vente.total||5000).toString()+' FC\n\x1B\x45\x00';
  t+= (c.piedFacture||'Merci!')+'\n\n\n\x1D\x56\x00';
  return t;
}

export async function testTicketUniversel(){
  let vente={ total:5000, _shop:window.SHOP||'Menkao1', items:[{CODE:'TEST',Designation:'BATEKE TEST OK',qty:1,Prix:5000}] };
  let ticket=buildTicket(vente);
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
  let isAndroid = /Android/i.test(navigator.userAgent);
  if(isAndroid){
    try{
      let b64=btoa(unescape(encodeURIComponent(ticket)));
      window.location.href=`intent:base64,${b64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
      setTimeout(()=>{ 
        if(!document.hidden && confirm('Si RawBT ne s\'est pas ouvert, installe-le?')){
          window.open('https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter','_blank');
        }
      },1500);
      return;
    }catch(e){}
  }
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
