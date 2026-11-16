// js/superadmin/backup.js - BACKUP SAAS V9.1 AUTO-CLOSE + ROTATION 5 + DRIVE
// COMPATIBLE SPARK - NE SATURE PAS - AUTO À LA FERMETURE
const DRIVE_CLIENT_ID_V91 = '321333206282-sle6iothet3v925p3pro2q991b6alnvp.apps.googleusercontent.com';
let DRIVE_TOKEN_V9 = localStorage.getItem('BATEKE_DRIVE_TOKEN')||'';
let DRIVE_FOLDER_ID_V9 = localStorage.getItem('BATEKE_DRIVE_FOLDER_ID')||'';

export async function backupShop(shopName){
  if(!shopName) shopName = localStorage.getItem('BATEKE_BOUTIQUE') || 'Menkao1';
  let btn = document.getElementById('btnBackup');
  if(btn) btn.innerText = '⏳ Sauvegarde...';
  try{
    let db = window.db || firebase.database();
    let paths = ['stock','ventes','achats','compta','caisse','entrees','config_entreprise','abonnements','clients','dettes','retours'];
    let backup = { _meta: { shop: shopName, date: new Date().toISOString(), version:'V9.1', by: (window.CURRENT_VENDEUR?.nom||'DG') } };
    for(let p of paths){
      let snap = await db.ref(`shops/${shopName}/${p}`).once('value');
      backup[p] = snap.val() || {};
    }
    try{
      let patronId = localStorage.getItem('BATEKE_LAST_PIN') || sessionStorage.getItem('BATEKE_PIN');
      if(patronId){
        let snapPat = await db.ref(`patrons/${patronId}`).once('value');
        backup._patron = snapPat.val() || {};
      }
    }catch(e){}
    
    let jsonStr = JSON.stringify(backup, null, 2);
    let blob = new Blob([jsonStr], {type:'application/json'});
    // V9.1: 1 SEUL PAR JOUR (sans Date.now) -> écrase pas de doublon
    let fileName = `BATEKE_BACKUP_${shopName}_${new Date().toISOString().slice(0,10)}.json`;
    
    // A. Téléchargement local
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    
    // B. Historique + ROTATION 5 MAX (ne sature pas)
    try{
      let now = Date.now();
      await db.ref(`backups/${shopName}/${now}`).set({
        date: new Date().toISOString(),
        shop: shopName,
        fileName,
        size: jsonStr.length,
        by: window.CURRENT_VENDEUR?.nom||'DG V9.1'
        // SUPPRIMÉ: data_b64_compressed qui saturait
      });
      // NETTOYAGE AUTO: garde 5 derniers
      let snapAll = await db.ref(`backups/${shopName}`).once('value');
      let all = snapAll.val()||{};
      let keys = Object.keys(all).sort().reverse();
      if(keys.length>5){
        for(let i=5;i<keys.length;i++){ await db.ref(`backups/${shopName}/${keys[i]}`).remove(); }
      }
      localStorage.setItem(`bateke_backup_${shopName}`, JSON.stringify({date:Date.now(), fileName}));
      localStorage.setItem('BATEKE_LAST_BACKUP', Date.now().toString());
    }catch(e){ console.warn('backup meta fail', e); }
    
    // C. DRIVE AUTO si connecté
    if(DRIVE_TOKEN_V9){
      try{ await uploadToDriveV9(fileName, jsonStr); }catch(e){ console.warn('Drive fail',e); }
    }

    if(btn) btn.innerText = '✅ Sauvegardé';
    console.log(`✅ BACKUP ${shopName} V9.1 OK ${(jsonStr.length/1024).toFixed(1)}KB`);
    return backup;
  }catch(e){
    alert('❌ Backup fail: '+e.message);
    if(btn) btn.innerText = '❌ Erreur';
  }
}

async function uploadToDriveV9(fileName, jsonStr){
 if(!DRIVE_TOKEN_V9) return;
 if(!DRIVE_FOLDER_ID_V9){
  let r=await fetch('https://www.googleapis.com/drive/v3/files',{method:'POST',headers:{'Authorization':'Bearer '+DRIVE_TOKEN_V9,'Content-Type':'application/json'},body:JSON.stringify({name:'BATEKE_SAAS_BACKUPS_V9',mimeType:'application/vnd.google-apps.folder'})});
  let d=await r.json(); DRIVE_FOLDER_ID_V9=d.id; localStorage.setItem('BATEKE_DRIVE_FOLDER_ID',d.id);
 }
 let metadata={name:fileName, parents:[DRIVE_FOLDER_ID_V9]};
 let form=new FormData(); form.append('metadata', new Blob([JSON.stringify(metadata)],{type:'application/json'})); form.append('file', new Blob([jsonStr],{type:'application/json'}));
 await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{'Authorization':'Bearer '+DRIVE_TOKEN_V9},body:form});
}

export async function restoreShop(shopName, backupJson){
  if(!confirm(`⚠️ RESTAURATION DANGER\nÉcraser ${shopName} ?`)) return;
  if(!confirm(`Confirmation 2/2: RESTAURER ${shopName} ? Irréversible.`)) return;
  try{
    let db = window.db || firebase.database();
    let paths = ['stock','ventes','achats','compta','caisse','entrees','config_entreprise','abonnements','clients','dettes','retours'];
    for(let p of paths){ if(backupJson[p]){ await db.ref(`shops/${shopName}/${p}`).set(backupJson[p]); } }
    alert(`✅ RESTAURATION ${shopName} OK`); location.reload();
  }catch(e){ alert('❌ Restore fail: '+e.message); }
}

export function exportClientDataCGU(shopName){ return backupShop(shopName); }

// --- AUTO CLOSE + AUTO 30MIN V9.1 ---
function silentBackupAllV9(){
  let shops = Object.keys(window.G_SHOPS||{}); if(!shops.length) shops=['Menkao1','Menkao2','Mbakana','Intendance','odoncel','Bateke','TestShop','Testsho2'];
  shops.forEach(s=> backupShop(s));
}

let AUTO_TIMER_V91 = null;
if(!AUTO_TIMER_V91){
  AUTO_TIMER_V91 = setInterval(()=>{ let last=parseInt(localStorage.getItem('BATEKE_LAST_BACKUP')||0); if(Date.now()-last > 30*60*1000) silentBackupAllV9(); }, 5*60*1000);
}
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden'){ let last=parseInt(localStorage.getItem('BATEKE_LAST_BACKUP')||0); if(Date.now()-last > 60*60*1000) silentBackupAllV9(); } });

// DRIVE CONNECT
export function connectDriveV9(){ let redirect=location.origin+location.pathname; let scope='https://www.googleapis.com/auth/drive.file'; let url=`https://accounts.google.com/o/oauth2/v2/auth?client_id=${DRIVE_CLIENT_ID_V91}&redirect_uri=${encodeURIComponent(redirect)}&response_type=token&scope=${encodeURIComponent(scope)}&prompt=consent`; window.location.href=url; }
(function(){ if(location.hash.includes('access_token')){ let p=new URLSearchParams(location.hash.substring(1)); let tok=p.get('access_token'); if(tok){ localStorage.setItem('BATEKE_DRIVE_TOKEN',tok); DRIVE_TOKEN_V9=tok; alert('✅ DRIVE V9.1 CONNECTÉ'); history.replaceState(null,'',location.pathname); } } })();

window.backupShop = backupShop;
window.restoreShop = restoreShop;
window.exportClientDataCGU = exportClientDataCGU;
window.connectDriveV9 = connectDriveV9;
window.silentBackupAllV9 = silentBackupAllV9;
console.log('✅ backup.js V9.1 AUTO-CLOSE + 5 MAX + DRIVE READY - Stable intact');
