import { esc } from "../common/utils.js";

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
    imprimante:{type:document.getElementById('confImpType').value,nom:document.getElementById('confImpNom').value,largeur:document.getElementById('confImpLargeur').value,print_logo:document.getElementById('confImpLogo').value,copies:parseInt(document.getElementById('confImpCopies').value)||1},
    compta:CURRENT_CONFIG.compta,
    updatedAt:new Date().toISOString()
  };
  let target=SHOP==='ALL'?'Menkao1':SHOP;
  db.ref('shops/'+target+'/config_entreprise').set(cfg).then(()=>{
    document.getElementById('configStatus').innerHTML='✅ Sauvé';
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
  document.getElementById('confImpType').value=CURRENT_CONFIG.imprimante?.type||'pdf'; document.getElementById('confImpNom').value=CURRENT_CONFIG.imprimante?.nom||''; document.getElementById('confImpLargeur').value=CURRENT_CONFIG.imprimante?.largeur||'58mm'; document.getElementById('confImpLogo').value=CURRENT_CONFIG.imprimante?.print_logo||'oui'; document.getElementById('confImpCopies').value=CURRENT_CONFIG.imprimante?.copies||1;
  if(CURRENT_CONFIG.logo) document.getElementById('logoPreview').src=CURRENT_CONFIG.logo;
  updateLabels();
}
export function renderApercu(){
  let c=CURRENT_CONFIG; let logoImg=c.logo?`<img src="${c.logo}" style="width:70px">`:'';
  document.getElementById('apercuFacture').innerHTML=`<div style="display:flex;justify-content:space-between"><div><b>${esc(c.nom)}</b><br>${esc(c.slogan||'')}<br>${esc(c.adresse)} - ${esc(c.tel)}</div><div>${logoImg}</div></div><hr><small>${esc(c.piedFacture)}</small>`;
}
export function dupliquerConfig(){ let s=SHOP==='ALL'?'Menkao1':SHOP; let d=prompt('Vers?','Menkao2'); if(!d) return; db.ref('shops/'+s+'/config_entreprise').once('value').then(snap=>{ let c=snap.val(); if(c) db.ref('shops/'+d+'/config_entreprise').set(c); }); }
window.saveConfig=saveConfig; window.loadConfig=loadConfig; window.applyConfigToUI=applyConfigToUI; window.renderApercu=renderApercu; window.dupliquerConfig=dupliquerConfig;
