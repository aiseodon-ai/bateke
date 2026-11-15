// STOCK V8.35 - V8.30 INTACTE + BATCH x10 + xN POPUP - 0 PERTE
import { esc } from "../common/utils.js";
let DATA_MAP = {};
function getShop(){ try{ if(window.STATE && window.STATE.SHOP) return window.STATE.SHOP; }catch(e){} try{ if(window.SHOP) return window.SHOP; }catch(e){} try{ if(typeof SHOP!=='undefined' && SHOP) return SHOP; }catch(e){} return localStorage.getItem('patron_shop')||'Menkao1'; }
function getFilteredSafe(){ try{ if(typeof getFiltered==='function') return getFiltered(); }catch(e){} try{ if(window.getFiltered) return window.getFiltered(); }catch(e){} let shop = getShop(); let all = (window.ALL_DATA||{})[shop]||{stock:[]}; return {stock: all.stock||[], shop}; }
function buildDataMap(stock){ DATA_MAP={}; stock.forEach(p=>{ let uid = p._id || p.CODE; if(uid) DATA_MAP[uid]=p; }); window.DATA_MAP=DATA_MAP; }
function formatPrix(n){ return String(Math.round(parseFloat(n)||0)); }
function cleanASCII(str){ if(!str) return ''; return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E\n\r]/g,' ').replace(/\s+/g,' ').trim().toUpperCase(); }
function bytesToBase64(bytes){ let bin=''; bytes.forEach(b=>bin+=String.fromCharCode(b)); return btoa(bin); }
function smartTruncate(str, max){ if(!str) return ''; str=String(str).trim(); if(str.length<=max) return str; return str.substring(0,max-3).trim()+'...'; }
function wrapDesignation(des){ des=String(des||'').trim(); if(des.length<=32) return [des]; let l1=des.substring(0,32).trim(); let l2=smartTruncate(des.substring(32),24); return [l1,l2]; }
function codeToEAN13(code){ code=cleanASCII(code||'ADOO'); let hash=0; for(let i=0;i<code.length;i++){ hash=(hash*31+code.charCodeAt(i))>>>0; } let base='200'+String(hash).padStart(9,'0').slice(-9); base=base.substring(0,12); let sum=0; for(let i=0;i<12;i++){ sum+=parseInt(base[i])*(i%2===0?1:3); } let check=(10-(sum%10))%10; return base+check; }
function buildEtiquetteBytes(p){
  let code=cleanASCII(p.CODE||''); let desLines=wrapDesignation(p.Designation||''); let prix=formatPrix(p['Prix Unit']||p.Prix||0); let ean13=codeToEAN13(code);
  let str='\x1B\x40\x1B\x61\x01\x1B\x45\x01'+cleanASCII(window.CURRENT_CONFIG?.nom||'ETS BATEKE').substring(0,32)+'\n\x1B\x45\x00';
  str+='CODE: '+code+'\n'; desLines.forEach(l=>{ str+=cleanASCII(l)+'\n'; });
  str+='\x1D\x21\x11'+prix+' FC\n\x1D\x21\x00';
  str+='\x1D\x48\x02\x1D\x77\x02\x1D\x6B\x02'+ean13.substring(0,12)+'\x00\n\n\n\x1D\x56\x00';
  return {bytes:new TextEncoder().encode(str), ean13, rawStr:str};
}
window.printEtiquette = async function(uid){
  let p=DATA_MAP[uid]||window.DATA_MAP?.[uid]; if(!p){ let data=getFilteredSafe(); p=(data.stock||[]).find(x=>(x._id||x.CODE)===uid); }
  if(!p){ alert('Article non trouvé: '+uid); return; }
  try{
    let res=buildEtiquetteBytes(p); let ean13=res.ean13;
    try{ let s=getShop(); let dbRef=window.db||firebase.database(); dbRef.ref('shops/'+s+'/stock/'+(p._id||p.CODE)+'/EAN').set(ean13); }catch(e){}
    let isAndroid=/Android/i.test(navigator.userAgent);
    if(isAndroid){ window.location.href=`rawbt:base64,${bytesToBase64(res.bytes)}`; return; }
    let char=window.BT_CHAR||null;
    if(char){ for(let i=0;i<res.bytes.length;i+=20){ let ch=res.bytes.slice(i,i+20); try{ if(char.writeValueWithoutResponse) await char.writeValueWithoutResponse(ch); else await char.writeValue(ch); }catch(e){} await new Promise(r=>setTimeout(r,30)); } alert('✅ Étiquette EAN '+ean13+' pour '+p.CODE); return; }
    let device=await navigator.bluetooth.requestDevice({acceptAllDevices:true, optionalServices:['000018f0-0000-1000-8000-00805f9b34fb','0000ff00-0000-1000-8000-00805f9b34fb']});
    let server=await device.gatt.connect(); let services=await server.getPrimaryServices(); let BT_CHAR=null;
    for(let s of services){ let chars=await s.getCharacteristics().catch(()=>[]); for(let c of chars){ if(c.properties.write||c.properties.writeWithoutResponse){ BT_CHAR=c; break; } } if(BT_CHAR) break; }
    window.BT_CHAR=BT_CHAR; for(let i=0;i<res.bytes.length;i+=20){ await BT_CHAR.writeValue(res.bytes.slice(i,i+20)); await new Promise(r=>setTimeout(r,30)); }
    alert('✅ Étiquette EAN '+ean13+' pour '+p.CODE);
  }catch(e){ alert('Erreur: '+e.message); }
};
window.printEtiquetteMultiple = async function(uid, count){
  count=parseInt(count)||10; if(count>50){ alert('Max 50'); count=50; } if(count<1) count=1;
  let p=DATA_MAP[uid]||window.DATA_MAP?.[uid]; if(!p){ let data=getFilteredSafe(); p=(data.stock||[]).find(x=>(x._id||x.CODE)===uid); }
  if(!p){ alert('Article non trouvé'); return; }
  try{
    let res=buildEtiquetteBytes(p);
    let batchStr=''; for(let i=0;i<count;i++) batchStr+=res.rawStr;
    let batchBytes=new TextEncoder().encode(batchStr);
    try{ let s=getShop(); let dbRef=window.db||firebase.database(); dbRef.ref('shops/'+s+'/stock/'+(p._id||p.CODE)+'/EAN').set(res.ean13); }catch(e){}
    let isAndroid=/Android/i.test(navigator.userAgent);
    if(isAndroid){ window.location.href=`rawbt:base64,${bytesToBase64(batchBytes)}`; return; }
    let char=window.BT_CHAR; if(!char){ alert('Connecte imprimante d abord'); return; }
    for(let i=0;i<batchBytes.length;i+=20){ let ch=batchBytes.slice(i,i+20); try{ if(char.writeValueWithoutResponse) await char.writeValueWithoutResponse(ch); else await char.writeValue(ch); }catch(e){} await new Promise(r=>setTimeout(r,20)); }
    alert(`✅ ${count} étiquettes ${p.CODE}`);
  }catch(e){ alert('Erreur batch: '+e.message); }
}
window.printEtiquette10 = function(uid){ return window.printEtiquetteMultiple(uid,10); }
window.printEtiquetteAsk = function(uid){
  let p=DATA_MAP[uid]; let code=p?.CODE||uid;
  let q=prompt(`Combien d'étiquettes pour ${code} ?\n1 à 50`,'10');
  if(!q) return; let n=parseInt(q)||10; window.printEtiquetteMultiple(uid,n);
}
function generateCode(cat){ try{ let c=(cat||'AUTRE').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').substring(0,10)||'AUTRE'; if(!c) c='AUTRE'; let data=getFilteredSafe(); let stock=data.stock||[]; let max=0; let prefix=c+'-'; stock.forEach(p=>{ let code=(p.CODE||'').toUpperCase().trim(); if(code.startsWith(prefix)){ let numPart=code.substring(prefix.length).replace(/[^0-9]/g,''); let n=parseInt(numPart)||0; if(n>max) max=n; } }); return prefix+String(max+1).padStart(4,'0'); }catch(e){ return 'AUTRE-0001'; } }
window.generateCode=generateCode;
window.autoCodeForce=function(){ let catEl=document.getElementById('newCatForce'); let codeEl=document.getElementById('newCodeForce'); if(!codeEl) return; let cat=catEl?.value?.trim()||'AUTRE'; let newCode=generateCode(cat); codeEl.value=newCode; codeEl.style.background='#e8f5e9'; setTimeout(()=>{ codeEl.style.background=''; },800); };
export function renderStock(){
  let data=getFilteredSafe(); let q=(document.getElementById('searchS')?.value||'').toLowerCase();
  let list=(data.stock||[]).filter(p=>{ let txt=((p.CODE||'')+' '+(p.Designation||'')+' '+(p.Categorie||'')).toLowerCase(); return txt.includes(q); }).sort((a,b)=>(a.CODE||'').localeCompare(b.CODE||''));
  let totalFC=0,totalPA=0,totalQte=0,totalRef=0; (data.stock||[]).filter(p=>p.actif!==false).forEach(p=>{ let pv=p['Prix Unit']||p.Prix||p.PV||0; let pa=p['Prix Achat']||p.PA||0; totalFC+=(p.Quantite||0)*pv; totalPA+=(p.Quantite||0)*pa; totalQte+=(p.Quantite||0); totalRef++; });
  let tauxUSD=(window.CURRENT_CONFIG?.taux&&typeof window.CURRENT_CONFIG.taux==='object'?window.CURRENT_CONFIG.taux.USD:window.CURRENT_CONFIG?.tauxUSD)||2850;
  if(document.getElementById('valStockFC')) document.getElementById('valStockFC').innerText=totalFC.toLocaleString()+' FC';
  if(document.getElementById('valStockFCDetail')) document.getElementById('valStockFCDetail').innerText=totalQte.toLocaleString()+' pcs - '+totalRef+' réf';
  if(document.getElementById('valStockUSD')) document.getElementById('valStockUSD').innerText=(tauxUSD?totalFC/tauxUSD:0).toLocaleString(undefined,{maximumFractionDigits:2})+' $';
  if(document.getElementById('valStockPA')) document.getElementById('valStockPA').innerText=totalPA.toLocaleString()+' FC';
  if(document.getElementById('valStockBenef')) document.getElementById('valStockBenef').innerText=(totalFC-totalPA).toLocaleString()+' FC';
  buildDataMap(list);
  let tbody=document.getElementById('stockT'); if(!tbody) return;
  tbody.innerHTML=list.map(p=>{
    let uid=p._id||p.CODE; let uidSafe=(uid+'').replace(/'/g,"\\'");
    return `<tr style="${p.actif===false?'opacity:.5;background:#fee':''}"><td><b>${esc(p.CODE||'')}</b></td><td class="editable" style="background:#e8f5e9;cursor:pointer" onclick="window.editField('${uidSafe}','Categorie')">${esc(p.Categorie||'AUTRE')} ✏️</td><td class="editable" style="background:#fffde7;cursor:pointer" onclick="window.editField('${uidSafe}','Designation')">${esc(p.Designation||'')} ✏️</td><td class="editable" style="background:#fffde7;cursor:pointer" onclick="window.editField('${uidSafe}','Quantite')">${p.Quantite??0} ✏️</td><td class="editable" style="cursor:pointer" onclick="window.editField('${uidSafe}','seuil')">${p.seuil??3} ✏️</td><td class="editable" style="cursor:pointer" onclick="window.editField('${uidSafe}','Prix Unit')">${Number(p['Prix Unit']||p.Prix||0).toLocaleString()} ✏️</td><td class="editable" style="cursor:pointer" onclick="window.editField('${uidSafe}','Prix Achat')">${Number(p['Prix Achat']||0).toLocaleString()} ✏️</td><td>${(Number(p['Prix Unit']||0)-Number(p['Prix Achat']||0)).toLocaleString()}</td><td>${p.actif!==false?'✅ Actif':'🚫'}</td><td><button class="btn" style="width:auto;padding:4px 6px;font-size:11px;background:#111;color:#fff" onclick="window.printEtiquette('${uidSafe}')">🏷️</button> <button class="btn" style="width:auto;padding:4px 6px;font-size:11px;background:#ff9800;color:#fff" onclick="window.printEtiquette10('${uidSafe}')">x10</button> <button class="btn" style="width:auto;padding:4px 6px;font-size:11px;background:#0b5e2f;color:#fff" onclick="window.printEtiquetteAsk('${uidSafe}')">xN</button> <button class="btn ${p.actif!==false?'btn-r':'btn-g'}" style="width:auto;padding:4px 8px;font-size:11px" onclick="window.toggleActif('${uidSafe}')">${p.actif!==false?'Désactiver':'Activer'}</button> <button class="btn btn-g" style="width:auto;padding:4px 8px;font-size:11px" onclick="window.entree('${uidSafe}')">+Entrée</button> <button class="btn btn-r" style="width:auto;padding:4px 6px;font-size:11px" onclick="window.supp('${uidSafe}')">X</button></td></tr>`;
  }).join('');
}
export function toggleActif(uid){ let s=getShop(); let p=DATA_MAP[uid]; let cur=p?.actif!==false; if(confirm(cur?'Désactiver '+(p?.CODE||uid)+'?':'Activer '+(p?.CODE||uid)+'?')){ let dbRef=window.db||firebase.database(); dbRef.ref('shops/'+s+'/stock/'+uid).update({actif:!cur}); } }
export function editField(uid, field){ let p=DATA_MAP[uid]; if(!p){ alert('Article non trouvé: '+uid); return; } let oldVal=p[field]??''; if(field==='Designation') oldVal=p.Designation||''; if(field==='Categorie') oldVal=p.Categorie||'AUTRE'; if(field==='Quantite') oldVal=p.Quantite??0; if(field==='seuil') oldVal=p.seuil??3; if(field==='Prix Unit') oldVal=p['Prix Unit']||p.Prix||0; if(field==='Prix Achat') oldVal=p['Prix Achat']||0; let nv=prompt(`Modifier ${field} pour ${p.CODE||uid}\nAncien: ${oldVal}\nNouveau:`, oldVal); if(nv===null||nv==='') return; let val=nv; if(field!=='Designation'&&field!=='Categorie'){ val=Number(nv.replace(',','.'))||0; }else{ if(/[<>]/.test(nv)){ alert('⛔ < > interdits'); return; } val=nv.trim().toUpperCase(); if(field==='Designation') val=nv.trim(); } let s=getShop(); let dbRef=window.db||firebase.database(); if(field==='Quantite'){ dbRef.ref('shops/'+s+'/stock/'+uid+'/Quantite').transaction(()=>val).then(r=>{ if(r.committed){ p.Quantite=val; renderStock(); } }); }else{ dbRef.ref('shops/'+s+'/stock/'+uid).update({[field]:val}).then(()=>{ p[field]=val; if(field==='Designation') p.Designation=val; if(field==='Categorie') p.Categorie=val; renderStock(); }); } }
export function entree(uid){ let qty=parseInt(prompt('Qté entrée ?')); if(!qty) return; let s=getShop(); let qui=prompt('Qui?','PATRON'); let dbRef=window.db||firebase.database(); dbRef.ref('shops/'+s+'/stock/'+uid+'/Quantite').transaction(cur=>(cur||0)+qty).then(r=>{ if(r.committed){ dbRef.ref('shops/'+s+'/stock/'+uid).once('value').then(snap=>{ let p=snap.val(); dbRef.ref('shops/'+s+'/entrees/'+Date.now()).set({date:new Date().toISOString(),CODE:p?.CODE||uid,Designation:p?.Designation||uid,boutique:s,qty:qty,vendeur:qui}); }); alert(`✅ +${qty} => ${r.snapshot.val()}`); renderStock(); } }); }
export function supp(uid){ let p=DATA_MAP[uid]; if(!confirm('Supprimer '+(p?.CODE||uid)+' - '+(p?.Designation||'')+' ?\nCette action est définitive.')) return; let s=getShop(); let dbRef=window.db||firebase.database(); dbRef.ref('shops/'+s+'/stock/'+uid).remove().then(()=>{ renderStock(); }); }
export function saveNewArt(){ let codeEl=document.getElementById('newCodeForce')||document.getElementById('newCode'); let desEl=document.getElementById('newDesForce')||document.getElementById('newDes'); let catEl=document.getElementById('newCatForce'); let pvEl=document.getElementById('newPVForce')||document.getElementById('newPV'); let paEl=document.getElementById('newPAForce')||document.getElementById('newPA'); let qteEl=document.getElementById('newQteForce')||document.getElementById('newQte'); let seuilEl=document.getElementById('newSeuilForce')||document.getElementById('newSeuil'); let actifEl=document.getElementById('newActif'); let code=codeEl?.value.trim().toUpperCase(); if(!code){ alert('CODE vide'); return; } let des=desEl?.value.trim(); if(!des){ alert('Désignation vide'); return; } let data={ CODE:code, Categorie:(catEl?.value.trim().toUpperCase()||'AUTRE'), Designation:des, 'Prix Unit':Number(pvEl?.value)||0, 'Prix Achat':Number(paEl?.value)||0, Quantite:Number(qteEl?.value)||0, seuil:Number(seuilEl?.value)||3, actif:actifEl?.checked!==false }; let s=getShop(); let dbRef=window.db||firebase.database(); dbRef.ref('shops/'+s+'/stock/'+code).set(data).then(()=>{ if(codeEl) codeEl.value=''; if(desEl) desEl.value=''; if(catEl) catEl.value=''; if(pvEl) pvEl.value=''; if(paEl) paEl.value=''; if(qteEl) qteEl.value=''; if(seuilEl) seuilEl.value='3'; if(actifEl) actifEl.checked=true; try{ window.closeModal('modalForce'); window.closeModal('modalArt'); }catch(e){} renderStock(); }); }
window.renderStock=renderStock; window.toggleActif=toggleActif; window.editField=editField; window.entree=entree; window.supp=supp; window.saveNewArt=saveNewArt; window.buildDataMap=buildDataMap;
window.openNewArtForce=function(){ let old=document.getElementById('modalForce'); if(old) old.remove(); let m=document.createElement('div'); m.id='modalForce'; m.innerHTML=`<div style="background:#fff;padding:16px;border-radius:12px;width:95%;max-width:440px"><h3>+ Nouvel Article</h3><div style="display:flex;gap:6px"><input id="newCodeForce" placeholder="CODE" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"><button onclick="window.autoCodeForce()" style="padding:8px 10px;background:#1b5e20;color:#fff;border-radius:8px;border:none;font-weight:bold">⚡ AUTO</button></div><input id="newCatForce" list="listCatsForce" placeholder="CATEGORIE" style="width:100%;padding:8px;margin:4px 0;border:1px solid #a5d6a7;background:#e8f5e9;border-radius:8px"><datalist id="listCatsForce"><option value="CABLE"><option value="CHARGEUR"><option value="FICHE"><option value="AMPOULE"><option value="SOCKET"><option value="AUTRE"></datalist><input id="newDesForce" placeholder="Désignation" style="width:100%;padding:8px;margin:4px 0;border:1px solid #ccc;border-radius:8px"><div style="display:flex;gap:6px"><input id="newPVForce" type="number" placeholder="PV" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"><input id="newPAForce" type="number" placeholder="PA" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"></div><div style="display:flex;gap:6px;margin-top:4px"><input id="newQteForce" type="number" placeholder="Qté" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"><input id="newSeuilForce" type="number" value="3" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px"></div><div style="display:flex;gap:6px;justify-content:end;margin-top:10px"><button class="btn" onclick="window.closeModal('modalForce')" style="background:#ccc;padding:8px 12px;border-radius:8px">Annuler</button><button class="btn btn-g" onclick="window.saveNewArt()" style="background:#0b5e2f;color:#fff;padding:8px 12px;border-radius:8px">Créer</button></div></div>`; m.style.cssText='display:flex !important;position:fixed !important;inset:0 !important;background:rgba(0,0,0,.75) !important;z-index:99999999 !important;align-items:center !important;justify-content:center !important;'; document.body.appendChild(m); };
window.openNewArt=window.openNewArtForce; window.closeModal=function(id){ let m=document.getElementById(id)||document.getElementById('modalForce')||document.getElementById('modalArt'); if(m) m.remove(); };
console.log('✅ STOCK V8.35 xN OK');
