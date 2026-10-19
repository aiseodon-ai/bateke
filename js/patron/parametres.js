import { esc } from "../common/utils.js";
let BT_DEVICE = null; let BT_CHAR = null;

// Encode ESC/POS bytes en base64 correctement pour RawBT
function bytesToBase64(bytes){ let bin=''; bytes.forEach(b=>bin+=String.fromCharCode(b)); return btoa(bin); }

export async function connecterImprimanteUniverselle(){
  let isAndroid = /Android/i.test(navigator.userAgent);
  let isTecno = /Tecno|Spark|Infinix|HOT|NOTE|itel/i.test(navigator.userAgent);

  // SI ANDROID (TECNO) -> ON NE TENTE MEME PAS LE WEB BLUETOOTH, ON VA DIRECT RAWBT
  if(isAndroid){
    document.getElementById('printerStatus').innerHTML = `📱 Mode Android détecté (${isTecno?'Tecno Spark 10':''})<br>🟢 Utilise RawBT - Clique TEST TICKET directement`;
    document.getElementById('confImpType').value = 'rawbt';
    document.getElementById('confImpNom').value = localStorage.getItem('bateke_printer_universal') || 'T58_AFC6';
    alert(`📱 Android détecté\n\nSur Tecno Spark 10, le Bluetooth direct est bloqué par le système.\n\nNE CLIQUE PLUS sur CONNECTER.\n\nFais ceci:\n1. Ouvre l'app RawBT\n2. Choisis ton imprimante T58_AFC6\n3. Reviens ici et clique directement TEST TICKET\n\nLe ticket passera auto par RawBT.`);
    saveConfig();
    return false;
  }

  // SI PC -> Connexion directe Web Bluetooth normale
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
    document.getElementById('confImpNom').value=BT_DEVICE.name;
    document.getElementById('printerStatus').innerHTML=`🟢 PC Connectée: ${esc(BT_DEVICE.name)}`;
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
  const cols = (document.getElementById('confImpLargeur')?.value||'58mm').includes('80')?48:32;
  const line='-'.repeat(cols)+'\n';
  let str='\x1B\x40\x1B\x61\x01\x1B\x45\x01'+(c.nom||'BATEKE').substring(0,cols)+'\n\x1B\x45\x00';
  str+=(c.tel||'').substring(0,cols)+'\n'+line+'\x1B\x61\x00';
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

  // 1. PC avec BT connecté
  if(BT_CHAR && !isAndroid){
    try{
      for(let i=0;i<bytes.length;i+=20){
        let chunk=bytes.slice(i,i+20);
        if(BT_CHAR.writeValueWithoutResponse) await BT_CHAR.writeValueWithoutResponse(chunk);
        else await BT_CHAR.writeValue(chunk);
        await new Promise(r=>setTimeout(r,30));
      }
      alert('✅ Imprimé en direct PC'); return;
    }catch(e){}
  }

  // 2. ANDROID TECNO -> RAWBT 100%
  if(isAndroid){
    try{
      let b64 = bytesToBase64(bytes);
      // Lien RawBT qui marche sur Tecno Spark 10
      let link = `rawbt:base64,${b64}`;
      window.location.href = link;
      
      // Si après 2 sec RawBT ne s'ouvre pas, propose install
      setTimeout(()=>{
        if(!document.hidden){
          if(confirm('RawBT ne s\'est pas ouvert?\n\n1. Installe RawBT depuis Play Store\n2. Ouvre RawBT et choisis T58_AFC6\n3. Refais TEST\n\nInstaller RawBT?')){
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
    for(let i=0;i<bytes.length;i+=20){ await BT_CHAR.writeValue(bytes.slice(i,i+20)); await new Promise(r=>setTimeout(r,30)); }
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
  let tauxUSD=parseFloat(document.getElementById('confTauxUSD').value)||2850;
  let cfg={
    nom:document.getElementById('confNom').value, slogan:document.getElementById('confSlogan').value,
    adresse:document.getElementById('confAdresse').value, tel:document.getElementById('confTel').value,
    email:document.getElementById('confEmail').value, rccm:document.getElementById('confRccm').value,
    devise:document.getElementById('confDevise').value, deviseBase:document.getElementById('confDeviseBase').value,
    taux:tauxUSD, tauxUSD:tauxUSD, tauxEUR:parseFloat(document.getElementById('confTauxEUR').value)||0, tauxXAF:parseFloat(document.getElementById('confTauxXAF').value)||0, tauxXOF:parseFloat(document.getElementById('confTauxXOF').value)||0,
    taux:{USD:tauxUSD,EUR:parseFloat(document.getElementById('confTauxEUR').value)||0,XAF:parseFloat(document.getElementById('confTauxXAF').value)||0,XOF:parseFloat(document.getElementById('confTauxXOF').value)||0},
    logo:CURRENT_CONFIG.logo||'', piedFacture:document.getElementById('confPiedFacture').value, piedDevis:document.getElementById('confPiedDevis').value,
    imprimante:{type:document.getElementById('confImpType').value,nom:document.getElementById('confImpNom').value,largeur:document.getElementById('confImpLargeur').value,print_logo:document.getElementById('confImpLogo').value,copies:parseInt(document.getElementById('confImpCopies').value)||1},
    compta:CURRENT_CONFIG.compta, updatedAt:new Date().toISOString()
  };
  let target=SHOP==='ALL'?'Menkao1':SHOP;
  db.ref('shops/'+target+'/config_entreprise').set(cfg).then(()=>{ document.getElementById('configStatus').innerHTML='✅ Sauvé'; CURRENT_CONFIG=cfg; applyConfigToUI(); savePatronCache(); });
}
export function loadConfig(){ let t=SHOP==='ALL'?'Menkao1':SHOP; db.ref('shops/'+t+'/config_entreprise').once('value').then(snap=>{ let c=snap.val(); if(c){ CURRENT_CONFIG={...CURRENT_CONFIG,...c,compta:{...CURRENT_CONFIG.compta,...(c.compta||{})}}; applyConfigToUI(); savePatronCache(); } renderApercu(); }); }
export function applyConfigToUI(){
  document.getElementById('confNom').value=CURRENT_CONFIG.nom||''; document.getElementById('confSlogan').value=CURRENT_CONFIG.slogan||''; document.getElementById('confAdresse').value=CURRENT_CONFIG.adresse||''; document.getElementById('confTel').value=CURRENT_CONFIG.tel||'';
  document.getElementById('confEmail').value=CURRENT_CONFIG.email||''; document.getElementById('confRccm').value=CURRENT_CONFIG.rccm||''; document.getElementById('confDevise').value=CURRENT_CONFIG.devise||'FC'; document.getElementById('confDeviseBase').value=CURRENT_CONFIG.deviseBase||'FC';
  let tauxObj=CURRENT_CONFIG.taux&&typeof CURRENT_CONFIG.taux==='object'?CURRENT_CONFIG.taux:{}; document.getElementById('confTauxUSD').value=tauxObj.USD||CURRENT_CONFIG.tauxUSD||2850;
  document.getElementById('confTauxEUR').value=tauxObj.EUR||''; document.getElementById('confTauxXAF').value=tauxObj.XAF||''; document.getElementById('confTauxXOF').value=tauxObj.XOF||'';
  document.getElementById('confPiedFacture').value=CURRENT_CONFIG.piedFacture||''; document.getElementById('confPiedDevis').value=CURRENT_CONFIG.piedDevis||'';
  let imp=CURRENT_CONFIG.imprimante||{}; let sel=document.getElementById('confImpType');
  if(sel){ sel.innerHTML=`<option value="pdf">PDF</option><option value="bluetooth">PC - Bluetooth Direct</option><option value="rawbt">Android - RawBT (Tecno/Infinix)</option>`; sel.value=imp.type||(/Android/i.test(navigator.userAgent)?'rawbt':'bluetooth'); }
  document.getElementById('confImpNom').value=imp.nom||localStorage.getItem('bateke_printer_universal')||'T58_AFC6'; document.getElementById('confImpLargeur').value=imp.largeur||'58mm'; document.getElementById('confImpLogo').value=imp.print_logo||'oui'; document.getElementById('confImpCopies').value=imp.copies||1;
  if(CURRENT_CONFIG.logo) document.getElementById('logoPreview').src=CURRENT_CONFIG.logo;
}
export function renderApercu(){
  let isAndroid=/Android/i.test(navigator.userAgent);
  let c=CURRENT_CONFIG;
  document.getElementById('apercuFacture').innerHTML=`
  <div><b>${esc(c.nom)}</b> - ${isAndroid?'ANDROID MODE':'PC MODE'}</div><hr>
  <div id="printerStatus" style="padding:12px;background:${isAndroid?'#dcfce7':'#f0fdf4'};border-radius:8px;font-weight:bold">
  ${isAndroid?'📱 Tecno Spark 10 détecté<br>✅ Mode RawBT activé - Ne clique PAS sur CONNECTER<br>Clique direct TEST TICKET':'🖥️ PC - Mode Direct Bluetooth - Clique CONNECTER'}
  </div>
  <div style="margin-top:8px;display:flex;gap:6px">
  ${isAndroid?`<button class="btn" style="background:#22c55e;color:white;padding:14px" onclick="window.testTicketUniversel()">🧾 TEST TICKET VIA RawBT</button>`:`<button class="btn btn-b" onclick="window.connecterImprimanteUniverselle()">📡 CONNECTER</button><button class="btn btn-g" onclick="window.testTicketUniversel()">🧾 TEST PC</button>`}
  </div>`;
}
export function dupliquerConfig(){ let s=SHOP==='ALL'?'Menkao1':SHOP; let d=prompt('Vers?','Menkao2'); if(!d) return; db.ref('shops/'+s+'/config_entreprise').once('value').then(snap=>{ let c=snap.val(); if(c) db.ref('shops/'+d+'/config_entreprise').set(c); }); }
window.saveConfig=saveConfig; window.loadConfig=loadConfig; window.applyConfigToUI=applyConfigToUI; window.renderApercu=renderApercu; window.dupliquerConfig=dupliquerConfig;
window.connecterImprimanteUniverselle=connecterImprimanteUniverselle; window.testTicketUniversel=testTicketUniversel; window.imprimerVenteUniverselle=imprimerVenteUniverselle;
window.connecterImprimanteH22=connecterImprimanteUniverselle; window.testTicketH22=testTicketUniversel;
