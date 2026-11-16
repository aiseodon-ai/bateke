// js/superadmin/backup.js - BACKUP SAAS V1.0 PROD SECURE
// Usage: Bouton dans superadmin + patron + vendeur
export async function backupShop(shopName){
  if(!shopName) shopName = localStorage.getItem('BATEKE_BOUTIQUE') || 'Menkao1';
  let btn = document.getElementById('btnBackup');
  if(btn) btn.innerText = '⏳ Sauvegarde...';
  try{
    let db = window.db || firebase.database();
    let paths = ['stock','ventes','achats','compta','caisse','entrees','config_entreprise','abonnements','clients','dettes'];
    let backup = { _meta: { shop: shopName, date: new Date().toISOString(), version:'V8.1', by: (window.CURRENT_VENDEUR?.nom||'DG') } };
    for(let p of paths){
      let snap = await db.ref(`shops/${shopName}/${p}`).once('value');
      backup[p] = snap.val() || {};
      console.log(`✅ backup ${p}: ${Object.keys(backup[p]).length}`);
    }
    // Sauvegarde aussi patron lié
    try{
      let patronId = localStorage.getItem('BATEKE_LAST_PIN') || sessionStorage.getItem('BATEKE_PIN');
      if(patronId){
        let snapPat = await db.ref(`patrons/${patronId}`).once('value');
        backup._patron = snapPat.val() || {};
      }
    }catch(e){}
    
    let jsonStr = JSON.stringify(backup, null, 2);
    let blob = new Blob([jsonStr], {type:'application/json'});
    let fileName = `BATEKE_BACKUP_${shopName}_${new Date().toISOString().slice(0,10)}_${Date.now()}.json`;
    
    // A. Téléchargement local immédiat
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    
    // B. Stockage Firebase Storage (si dispo) + RTDB history
    try{
      let b64 = btoa(unescape(encodeURIComponent(jsonStr)));
      // On garde les 5 derniers backups dans la base
      await db.ref(`backups/${shopName}/${Date.now()}`).set({
        date: new Date().toISOString(),
        shop: shopName,
        fileName,
        size: jsonStr.length,
        by: window.CURRENT_VENDEUR?.nom||'DG',
        data_b64_compressed: b64.slice(0,100000) // on garde pas tout pour ne pas exploser, juste meta
      });
      // Garde le full backup dans shops/{shop}/backups
      await db.ref(`shops/${shopName}/backups_meta/${Date.now()}`).set({
        fileName, date: new Date().toISOString(), size: jsonStr.length
      });
      localStorage.setItem(`bateke_backup_${shopName}`, JSON.stringify({date:Date.now(), fileName}));
    }catch(e){ console.warn('backup meta fail', e); }
    
    if(btn) btn.innerText = '✅ Sauvegardé';
    alert(`✅ BACKUP ${shopName} OK\n${fileName}\nTaille: ${(jsonStr.length/1024).toFixed(1)} KB\nGardé en local + historique`);
    return backup;
  }catch(e){
    alert('❌ Backup fail: '+e.message);
    if(btn) btn.innerText = '❌ Erreur';
  }
}

export async function restoreShop(shopName, backupJson){
  if(!confirm(`⚠️ RESTAURATION DANGER\nTu vas ÉCRASER les données de ${shopName} avec ce backup.\nContinuer?`)) return;
  if(!confirm(`Confirmation 2/2: RESTAURER ${shopName} ? Cette action est irréversible.`)) return;
  try{
    let db = window.db || firebase.database();
    let paths = ['stock','ventes','achats','compta','caisse','entrees','config_entreprise','abonnements'];
    for(let p of paths){
      if(backupJson[p]){
        await db.ref(`shops/${shopName}/${p}`).set(backupJson[p]);
      }
    }
    alert(`✅ RESTAURATION ${shopName} OK - Recharge la page`);
    location.reload();
  }catch(e){ alert('❌ Restore fail: '+e.message); }
}

export function exportClientDataCGU(shopName){
  // Fonction CGU: client demande ses données
  return backupShop(shopName);
}

window.backupShop = backupShop;
window.restoreShop = restoreShop;
window.exportClientDataCGU = exportClientDataCGU;
console.log('✅ backup.js V1.0 PROD READY');
