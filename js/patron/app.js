
function switchShop(){SHOP=document.getElementById('shopSel').value;localStorage.setItem('patron_shop',SHOP);PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');updateLabels();refreshAll();renderAchatStock();renderPanierAchat();}
function updateLabels(){document.getElementById('labVenteShop').innerText=SHOP;document.getElementById('labVendShop').innerText=SHOP;document.getElementById('presenceShopLab').innerText=SHOP;document.getElementById('lienV').innerText='https://aiseodon-ai.github.io/bateke/vendeur.html?shop='+SHOP;document.getElementById('paramShopName').innerText=SHOP;document.getElementById('headerEntreprise').innerHTML=(isSuperAdmin?'👑 SUPER - ':'👑 ')+(CURRENT_CONFIG.nom||'ETS BATEKE')+' - '+SHOP;}
function switchTab(id){document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));document.getElementById('btn-'+id)?.classList.add('active');if(id==='achat'){renderAchatStock();renderPanierAchat();}if(id==='parametres')renderApercu();if(id==='rapport')genRapport();if(id==='crm')renderCRM();if(id==='dettes')renderDettes();if(id==='compta')calcCompta();}
function switchSub(id){document.getElementById('vue-table').style.display=id==='table'?'block':'none';document.getElementById('vue-graph').style.display=id==='graph'?'block':'none';document.getElementById('sub-table').classList.toggle('active',id==='table');document.getElementById('sub-graph').classList.toggle('active',id==='graph');if(id==='graph')genGraph();}
function openNewArt(){document.getElementById('modalArt').classList.add('active')}function closeModal(id){document.getElementById(id).classList.remove('active')}
function previewLogo(inp){if(inp.files&&inp.files[0]){let r=new FileReader();r.onload=e=>{document.getElementById('logoPreview').src=e.target.result;CURRENT_CONFIG.logo=e.target.result;renderApercu();};r.readAsDataURL(inp.files[0]);}}
function saveConfig(){let tauxUSD=parseFloat(document.getElementById('confTauxUSD').value)||2850;let cfg={nom:document.getElementById('confNom').value,slogan:document.getElementById('confSlogan').value,adresse:document.getElementById('confAdresse').value,tel:document.getElementById('confTel').value,email:document.getElementById('confEmail').value,rccm:document.getElementById('confRccm').value,devise:document.getElementById('confDevise').value,deviseBase:document.getElementById('confDeviseBase').value,taux:tauxUSD,tauxUSD:tauxUSD,tauxEUR:parseFloat(document.getElementById('confTauxEUR').value)||0,tauxXAF:parseFloat(document.getElementById('confTauxXAF').value)||0,tauxXOF:parseFloat(document.getElementById('confTauxXOF').value)||0,taux:{USD:tauxUSD,EUR:parseFloat(document.getElementById('confTauxEUR').value)||0,XAF:parseFloat(document.getElementById('confTauxXAF').value)||0,XOF:parseFloat(document.getElementById('confTauxXOF').value)||0},logo:CURRENT_CONFIG.logo||'',piedFacture:document.getElementById('confPiedFacture').value,piedDevis:document.getElementById('confPiedDevis').value,imprimante:{type:document.getElementById('confImpType').value,nom:document.getElementById('confImpNom').value,largeur:document.getElementById('confImpLargeur').value,print_logo:document.getElementById('confImpLogo').value,copies:parseInt(document.getElementById('confImpCopies').value)||1},compta:CURRENT_CONFIG.compta,updatedAt:new Date().toISOString()};let target=SHOP==='ALL'?'Menkao1':SHOP;db.ref('shops/'+target+'/config_entreprise').set(cfg).then(()=>{document.getElementById('configStatus').innerHTML='✅ Sauvé';CURRENT_CONFIG=cfg;applyConfigToUI();savePatronCache();});}
function loadConfig(){let t=SHOP==='ALL'?'Menkao1':SHOP;db.ref('shops/'+t+'/config_entreprise').once('value').then(snap=>{let c=snap.val();if(c){CURRENT_CONFIG={...CURRENT_CONFIG,...c,compta:{...CURRENT_CONFIG.compta,...(c.compta||{})}};applyConfigToUI();savePatronCache();}renderApercu();});}
function applyConfigToUI(){document.getElementById('confNom').value=CURRENT_CONFIG.nom||'';document.getElementById('confSlogan').value=CURRENT_CONFIG.slogan||'';document.getElementById('confAdresse').value=CURRENT_CONFIG.adresse||'';document.getElementById('confTel').value=CURRENT_CONFIG.tel||'';document.getElementById('confEmail').value=CURRENT_CONFIG.email||'';document.getElementById('confRccm').value=CURRENT_CONFIG.rccm||'';document.getElementById('confDevise').value=CURRENT_CONFIG.devise||'FC';document.getElementById('confDeviseBase').value=CURRENT_CONFIG.deviseBase||'FC';let tauxObj=CURRENT_CONFIG.taux&&typeof CURRENT_CONFIG.taux==='object'?CURRENT_CONFIG.taux:{};document.getElementById('confTauxUSD').value=tauxObj.USD||CURRENT_CONFIG.tauxUSD||2850;document.getElementById('confTauxEUR').value=tauxObj.EUR||'';document.getElementById('confTauxXAF').value=tauxObj.XAF||'';document.getElementById('confTauxXOF').value=tauxObj.XOF||'';document.getElementById('confTaux').value=typeof CURRENT_CONFIG.taux==='number'?CURRENT_CONFIG.taux:(CURRENT_CONFIG.tauxUSD||2850);document.getElementById('confPiedFacture').value=CURRENT_CONFIG.piedFacture||'';document.getElementById('confPiedDevis').value=CURRENT_CONFIG.piedDevis||'';document.getElementById('confImpType').value=CURRENT_CONFIG.imprimante?.type||'pdf';document.getElementById('confImpNom').value=CURRENT_CONFIG.imprimante?.nom||'';document.getElementById('confImpLargeur').value=CURRENT_CONFIG.imprimante?.largeur||'58mm';document.getElementById('confImpLogo').value=CURRENT_CONFIG.imprimante?.print_logo||'oui';document.getElementById('confImpCopies').value=CURRENT_CONFIG.imprimante?.copies||1;if(CURRENT_CONFIG.logo)document.getElementById('logoPreview').src=CURRENT_CONFIG.logo;updateLabels();}
function dupliquerConfig(){let s=SHOP==='ALL'?'Menkao1':SHOP;let d=prompt('Vers?','Menkao2');if(!d)return;db.ref('shops/'+s+'/config_entreprise').once('value').then(snap=>{let c=snap.val();if(c)db.ref('shops/'+d+'/config_entreprise').set(c);});}
function renderApercu(){let c=CURRENT_CONFIG;let logoImg=c.logo?`<img src="${c.logo}" style="width:70px">`:'';document.getElementById('apercuFacture').innerHTML=`<div style="display:flex;justify-content:space-between"><div><b>${c.nom}</b><br>${c.slogan||''}<br>${c.adresse} - ${c.tel}</div><div>${logoImg}</div></div><hr><small>${c.piedFacture}</small>`;}
function testImpression(){let w=window.open('','','width=400');w.document.write(document.getElementById('apercuFacture').innerHTML);w.print();}
function rechercherBT(){}
function listenShop(s){
db.ref('shops/'+s+'/stock').on('value',snap=>{ALL_DATA[s].stock=Object.values(snap.val()||{});savePatronCache();if(SHOP===s||SHOP==='ALL'){renderStock();renderAchatStock();updateKPIs();}});
db.ref('shops/'+s+'/ventes').on('value',snap=>{let raw=snap.val()||{};ALL_DATA[s].ventes=Object.entries(raw).map(([k,v])=>({...v,_id:k,_shop:s}));savePatronCache();if(SHOP===s||SHOP==='ALL'){renderVentes();updateKPIs();renderCaisse();renderCRM();renderDettes();if(document.getElementById('rapport')?.classList.contains('active'))genRapport();}});
db.ref('shops/'+s+'/depenses').on('value',snap=>{let raw=snap.val()||{};ALL_DATA[s].dep=Object.entries(raw).map(([k,v])=>({...v,_id:k}));savePatronCache();});
//db.ref('shops/'+s+'/entrees').on('value',snap=>{ALL_DATA[s].entrees=Object.values(snap.val()||{});savePatronCache();});
db.ref('shops/'+s+'/entrees').on('value',snap=>{let raw=snap.val()||{};ALL_DATA[s].entrees=Object.entries(raw).map(([k,v])=>({...v,_id:k,_shop:s}));savePatronCache();});
db.ref('shops/'+s+'/vendeurs').on('value',snap=>{ALL_DATA[s].vendeurs=snap.val()||{};savePatronCache();if(SHOP===s)renderVendeurs();renderPresenceKPI();});
db.ref('shops/'+s+'/config_entreprise').on('value',snap=>{if(snap.val()&&(SHOP===s||SHOP==='ALL')){let c=snap.val();CURRENT_CONFIG={...CURRENT_CONFIG,...c,compta:{...CURRENT_CONFIG.compta,...(c.compta||{})}};applyConfigToUI();savePatronCache();}});
db.ref('shops/'+s+'/presence').on('value',snap=>{ALL_DATA[s].presence=snap.val()||{};savePatronCache();renderPresenceKPI();if(SHOP===s)renderVendeurs();});
db.ref('shops/'+s+'/vendeur_logs').on('value',snap=>{ALL_DATA[s].logs=snap.val()||{};savePatronCache();if(SHOP===s)renderVendeurs();});
db.ref('shops/'+s+'/versements').on('value',snap=>{let raw=snap.val()||{};ALL_DATA[s].vers=Object.entries(raw).map(([k,v])=>({...v,_id:k}));savePatronCache();if(SHOP===s||SHOP==='ALL')renderCaisse();});
}
function getFiltered(){if(SHOP==='ALL'){let agg={ventes:[],dep:[],vers:[],stock:[],entrees:[]};SHOPS_LIST.forEach(s=>{let d=ALL_DATA[s]||{};agg.ventes=[...agg.ventes,...(d.ventes||[])];agg.dep=[...agg.dep,...(d.dep||[])];agg.stock=[...agg.stock,...(d.stock||[])];agg.entrees=[...agg.entrees,...(d.entrees||[]).map(e=>({...e,_shop:s}))];});return agg;}else{let d=ALL_DATA[SHOP]||{ventes:[],dep:[],vers:[],stock:[],entrees:[]};let versRaw=ALL_DATA[SHOP]?.vers||[];return {...d,vers:versRaw.map(v=>({...v,_shop:SHOP})),entrees:(d.entrees||[]).map(e=>({...e,_shop:SHOP}))};}} //return {...d,entrees:(d.entrees||[]).map(e=>({...e,_shop:SHOP}))};}}
function updateKPIs(){let data=getFiltered();let today=new Date().toDateString();let vToday=data.ventes.filter(v=>new Date(v.date).toDateString()===today);let caJ=vToday.reduce((s,v)=>s+(v.total||0),0);document.getElementById('caJour').innerText=caJ.toLocaleString()+' FC';document.getElementById('caJourDetail').innerText='Encaissé: '+vToday.reduce((s,v)=>s+(v.montantPaye??v.total),0).toLocaleString();document.getElementById('benefJour').innerText=(vToday.reduce((s,v)=>s+(v.benefice||0),0)-data.dep.filter(d=>new Date(d.date).toDateString()===today).reduce((s,d)=>s+d.montant,0)).toLocaleString()+' FC';document.getElementById('aVerser').innerText=document.getElementById('caJourDetail').innerText;document.getElementById('detteJour').innerText=vToday.reduce((s,v)=>s+(v.reste||0),0).toLocaleString()+' FC';}
function fmtVu(ts){if(!ts)return'jamais';let diff=Date.now()-ts;let m=Math.floor(diff/60000);if(m<1)return'à l’instant';if(m<60)return'il y a '+m+' min';let h=Math.floor(m/60);if(h<24)return'il y a '+h+'h';return'il y a '+Math.floor(h/24)+'j';}
function renderPresenceKPI(){let s=SHOP==='ALL'?SHOPS_LIST[0]:SHOP;let pres=ALL_DATA[s]?.presence||{};let vends=ALL_DATA[s]?.vendeurs||{};let html='';Object.keys(vends).forEach(pin=>{let v=vends[pin];let p=pres[pin]||{};let online=p.online===true&&Date.now()-(p.lastSeen||0)<180000;html+=`<div style="background:#fff;border:1px solid ${online?'#22c55e':'#ef4444'};border-radius:20px;padding:6px 12px"><span class="presence-dot ${online?'online':'offline'}"></span><b>${v.nom}</b> ${online?'En ligne':'Hors ligne'} • ${fmtVu(p.lastSeen)}</div>`;});document.getElementById('presenceKPIList').innerHTML=html||'<small>Aucun</small>';}

function renderVentes(){let data=getFiltered();let rows=[];data.ventes.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,200).forEach(v=>{(v.items||[]).forEach(i=>{rows.push(`<tr><td>${new Date(v.date).toLocaleString()}</td><td>${esc(v.vendeurNom||v.vendeur)}</td><td>${esc(i.CODE)}</td><td>${esc(i.Designation)}</td><td>${i.qty}</td><td>${(i.qty*i.Prix).toLocaleString()}</td><td>${(v.montantPaye??v.total).toLocaleString()}</td><td>${(v.reste||0).toLocaleString()}</td><td>${esc(v.client?.nom||'Comptoir')}</td><td>${esc(v.payement||'cash')}</td><td><button class="btn btn-r" style="width:auto;font-size:10px" data-id="${v._id}" data-shop="${v._shop}" onclick="annulerVente(this.dataset.id,this.dataset.shop)">↩</button></td></tr>`);});});document.getElementById('ventesList').innerHTML=rows.join('')||'<tr><td colspan=11>Aucune</td></tr>';}
//function renderCaisse(){let data=getFiltered();let all=[];data.ventes.forEach(v=>all.push({date:v.date,type:'Vente',motif:(v.items||[]).map(i=>i.CODE).join(','),montant:v.montantPaye??v.total}));data.dep.forEach(d=>all.push({date:d.date,type:'Dépense',motif:d.motif||'',montant:-d.montant}));all.sort((a,b)=>new Date(b.date)-new Date(a.date));document.getElementById('caisseList').innerHTML=all.slice(0,150).map(a=>`<tr><td>${new Date(a.date).toLocaleString()}</td><td>${a.type}</td><td>${a.motif}</td><td style="color:${a.montant<0?'red':'green'}">${a.montant.toLocaleString()}</td></tr>`).join('');}
function renderCaisse(){
 let data=getFiltered();
 let all=[];
 data.ventes.forEach(v=>all.push({date:v.date,type:'Vente',motif:(v.items||[]).map(i=>esc(i.CODE)).join(','),montant:v.montantPaye??v.total,_id:v._id,_shop:v._shop,noDelete:true}));
 (data.dep||[]).forEach(d=>all.push({date:d.date,type:'Dépense',motif:d.motif||d.description||'',montant:-d.montant,_id:d._id,_shop:d._shop||SHOP,isDep:true}));
 (data.vers||[]).forEach(v=>all.push({date:v.date,type:'Versement',motif:v.description||v.motif||'',montant:-v.montant,_id:v._id,_shop:v._shop||SHOP,isVers:true}));
 all.sort((a,b)=>new Date(b.date)-new Date(a.date));
 document.getElementById('caisseList').innerHTML=all.slice(0,200).map(a=>{
   let btn='';
   if(a.isDep) btn=`<button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" data-id="${esc(a._id)}" data-shop="${esc(a._shop||SHOP)}" onclick="annulerDepense(this.dataset.id,this.dataset.shop)">↩ Annuler</button>`;
   if(a.isVers) btn=`<button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" data-id="${esc(a._id)}" data-shop="${esc(a._shop||SHOP)}" onclick="annulerVersement(this.dataset.id,this.dataset.shop)">↩ Annuler</button>`;
   return `<tr><td>${new Date(a.date).toLocaleString()}</td><td>${esc(a.type)}</td><td>${esc(a.motif)}</td><td style="color:${a.montant<0?'red':'green'}">${a.montant.toLocaleString()}</td><td>${btn}</td></tr>`;
 }).join('')||'<tr><td colspan=5>Aucun</td></tr>';
}
function annulerDepense(id,shop){
 if(!confirm('Annuler cette dépense? '+id)) return;
 db.ref('shops/'+(shop||SHOP)+'/depenses/'+id).remove().then(()=>alert('✅ Dépense annulée'));
}
function annulerVersement(id,shop){
 if(!confirm('Annuler ce versement? '+id)) return;
 db.ref('shops/'+(shop||SHOP)+'/versements/'+id).remove().then(()=>alert('✅ Versement annulé'));
}
let DATA_MAP={};
function buildDataMap(stock){ DATA_MAP={}; stock.forEach(p=>{DATA_MAP[p.CODE]=p;}); }
  
function renderStock(){
 let data=getFiltered();let q=(document.getElementById('searchS').value||'').toLowerCase();
 let f=data.stock.filter(p=>(p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q)).sort((a,b)=>(a.CODE||'').localeCompare(b.CODE||''));
 let totalFC=0,totalPA=0,totalQte=0,totalRef=0;
 data.stock.filter(p=>p.actif!==false).forEach(p=>{totalFC+=(p.Quantite||0)*(p['Prix Unit']||0);totalPA+=(p.Quantite||0)*(p['Prix Achat']||0);totalQte+=(p.Quantite||0);totalRef++;});
 let tauxUSD=(CURRENT_CONFIG.taux&&typeof CURRENT_CONFIG.taux==='object'?CURRENT_CONFIG.taux.USD:CURRENT_CONFIG.tauxUSD)||2850;
 let benefLatent=totalFC-totalPA;
 document.getElementById('valStockFC').innerText=totalFC.toLocaleString()+' FC';
 document.getElementById('valStockFCDetail').innerText=totalQte.toLocaleString()+' pcs - '+totalRef+' réf - PV x Qté';
 document.getElementById('valStockUSD').innerText=(tauxUSD?totalFC/tauxUSD:0).toLocaleString(undefined,{maximumFractionDigits:2})+' $';
 document.getElementById('valStockUSDDetail').innerText='Taux 1$='+tauxUSD.toLocaleString()+' FC - Conversion PV total';
 document.getElementById('valStockPA').innerText=totalPA.toLocaleString()+' FC';
 document.getElementById('valStockBenef').innerText=benefLatent.toLocaleString()+' FC';
 document.getElementById('stockT').innerHTML=f.map(p=>`<tr style="${p.actif===false?'opacity:.5;background:#fee':''}"><td>${esc(p.CODE)}</td><td class="editable" data-code="${esc(p.CODE)}" data-field="Designation" onclick="editField(this.dataset.code,this.dataset.field,DATA_MAP[this.dataset.code]?.Designation||'')">${esc(p.Designation)} ✏</td><td class="editable" data-code="${esc(p.CODE)}" data-field="Quantite" onclick="editField(this.dataset.code,this.dataset.field,DATA_MAP[this.dataset.code]?.Quantite||0)">${p.Quantite} ✏</td><td class="editable" data-code="${esc(p.CODE)}" data-field="seuil" onclick="editField(this.dataset.code,this.dataset.field,DATA_MAP[this.dataset.code]?.seuil||3)">${p.seuil||3} ✏</td><td class="editable" data-code="${esc(p.CODE)}" data-field="Prix Unit" onclick="editField(this.dataset.code,this.dataset.field,DATA_MAP[this.dataset.code]?.['Prix Unit']||0)">${(p['Prix Unit']||0).toLocaleString()} ✏</td><td class="editable" data-code="${esc(p.CODE)}" data-field="Prix Achat" onclick="editField(this.dataset.code,this.dataset.field,DATA_MAP[this.dataset.code]?.['Prix Achat']||0)">${(p['Prix Achat']||0).toLocaleString()} ✏</td><td>${((p['Prix Unit']||0)-(p['Prix Achat']||0)).toLocaleString()}</td><td>${p.actif!==false?'✅ Actif':'🚫'}</td><td><button class="btn ${p.actif!==false?'btn-r':'btn-g'}" style="width:auto" onclick="toggleActif('${esc(p.CODE)}')">${p.actif!==false?'Désactiver':'Activer'}</button> <button class="btn btn-g" style="width:auto" onclick="entree('${esc(p.CODE)}')">+Entrée</button> <button class="btn btn-r" style="width:auto" onclick="supp('${esc(p.CODE)}')">X</button></td></tr>`).join('');
}
function toggleActif(code){let t=SHOP==='ALL'?prompt('Boutique? '+SHOPS_LIST.join('/')):SHOP;let p=ALL_DATA[t]?.stock?.find(x=>x.CODE===code);let cur=p?.actif!==false;if(confirm(cur?'Désactiver '+code+'?':'Activer '+code+'?')){db.ref('shops/'+t+'/stock/'+code).update({actif:!cur});}}
//function editField(code,field,oldVal){let nv=prompt(`Modifier ${field} pour ${code}\nAncien: ${oldVal}\nNouveau:`,oldVal);if(nv===null||nv==='')return;let val=field==='Designation'?nv.trim():Number(nv);let t=SHOP==='ALL'?prompt('Boutique cible? '+SHOPS_LIST.join('/')):SHOP;if(!t)return;db.ref('shops/'+t+'/stock/'+code).update({[field]:val});}
async function editField(code,field,oldVal){
  let safeOld = esc(oldVal);
  let safeCode = esc(code);
  let nv=prompt(`Modifier ${field} pour ${safeCode}\nAncien: ${safeOld}\nNouveau:`, oldVal);
  if(nv===null||nv==='') return;

  // Anti-XSS à l'entrée : on refuse < > dans Designation
  let val;
  if(field==='Designation'){
    if(/[<>]/.test(nv)){
      alert('⛔ Caractères < > interdits dans la désignation');
      return;
    }
    val = nv.trim();
  } else {
    val = Number(nv);
  }

  let t=SHOP==='ALL'?prompt('Boutique cible? '+SHOPS_LIST.join('/')):SHOP;
  if(!t) return;
  if(field==='Quantite'){
    let ref=db.ref('shops/'+t+'/stock/'+code+'/Quantite');
    let res=await ref.transaction(current=>{ return val; });
    if(res.committed) alert('✅ Quantité mise à jour');
    else alert('❌ Conflit, réessaie');
  }else{
    db.ref('shops/'+t+'/stock/'+code).update({[field]:val});
  }
}
//function entree(code){let qty=parseInt(prompt('Qté entrée '+code+'?'));if(!qty)return;let s=SHOP==='ALL'?prompt('Boutique? '+SHOPS_LIST.join('/')):SHOP;let qui=prompt('Qui?','PATRON');db.ref('shops/'+s+'/stock/'+code).once('value').then(snap=>{let p=snap.val();if(p){db.ref('shops/'+s+'/stock/'+code).update({Quantite:(p.Quantite||0)+qty});db.ref('shops/'+s+'/entrees/'+Date.now()).set({date:new Date().toISOString(),CODE:code,Designation:p.Designation,boutique:s,qty:qty,vendeur:qui});}});}
async function entree(code){
  let qty=parseInt(prompt('Qté entrée '+code+'?'));
  if(!qty) return;
  let s=SHOP==='ALL'?prompt('Boutique? '+SHOPS_LIST.join('/')):SHOP;
  if(!s) return;
  let qui=prompt('Qui?','PATRON');
  try{
    let ref=db.ref('shops/'+s+'/stock/'+code+'/Quantite');
    let result=await ref.transaction(currentQte=>{
      if(currentQte===null) return qty;
      return currentQte + qty;
    });
    if(result.committed){
      db.ref('shops/'+s+'/stock/'+code).once('value').then(snap=>{
        let p=snap.val();
        db.ref('shops/'+s+'/entrees/'+Date.now()).set({date:new Date().toISOString(),CODE:code,Designation:p?.Designation||code,boutique:s,qty:qty,vendeur:qui});
      });
      alert(`✅ Entrée OK: +${qty}. Nouveau stock: ${result.snapshot.val()}`);
    }else{
      alert('❌ Entrée annulée');
    }
  }catch(e){
    alert('Erreur: '+e.message);
  }
}
function supp(code){if(!confirm('Supprimer '+code+'?'))return;let s=SHOP==='ALL'?prompt('Boutique?'):SHOP;db.ref('shops/'+s+'/stock/'+code).remove();}
function saveNewArt(){let code=document.getElementById('newCode').value.trim();if(!code)return;let data={CODE:code,Designation:document.getElementById('newDes').value,'Prix Unit':Number(document.getElementById('newPV').value)||0,'Prix Achat':Number(document.getElementById('newPA').value)||0,Quantite:Number(document.getElementById('newQte').value)||0,seuil:Number(document.getElementById('newSeuil').value)||3,actif:document.getElementById('newActif').checked};let s=SHOP==='ALL'?prompt('Boutique?'):SHOP;db.ref('shops/'+s+'/stock/'+code).set(data);closeModal('modalArt');}

// ACHAT - INTACT V4.9.14
function savePanierAchat(){localStorage.setItem('panier_achat_'+SHOP, JSON.stringify(PANIER_ACHAT));}
function renderAchatStock(){let data=getFiltered();let q=(document.getElementById('searchAchat')?.value||'').toLowerCase();let filtre=document.getElementById('filtreAchat')?.value||'tous';let f=data.stock.filter(p=>{if(p.actif===false)return false;if(q&&!((p.CODE||'').toLowerCase().includes(q)||(p.Designation||'').toLowerCase().includes(q)))return false;if(filtre==='manque'&&(p.Quantite||0)>(p.seuil||3))return false;if(filtre==='rupture'&&(p.Quantite||0)>0)return false;return true;}).slice(0,400);document.getElementById('achatStockT').innerHTML=f.map(p=>{let manque=Math.max(0,(p.seuil||3)-(p.Quantite||0));let deja=PANIER_ACHAT.find(x=>x.CODE===p.CODE);let qteAchat=deja?deja.qteAchat:manque||1;return `<tr><td><b>${esc(p.CODE)}</b></td><td>${esc(p.Designation)}</td><td style="text-align:center;color:${(p.Quantite||0)<= (p.seuil||3)?'red':''};font-weight:bold">${p.Quantite||0}</td><td>${p.seuil||3}</td><td style="color:#ef4444;font-weight:bold">${manque}</td><td style="background:#fffde7;font-weight:bold">${(p['Prix Achat']||0).toLocaleString()}</td><td><input type="number" id="qa_${p.CODE}" value="${qteAchat}" min="1" style="width:70px" onchange="updateQteAchat('${p.CODE}',this.value)"></td><td>${((p['Prix Achat']||0)*qteAchat).toLocaleString()}</td><td><button class="btn btn-g" style="width:auto" onclick="ajouterAchat('${p.CODE}')">➕</button></td></tr>`;}).join('')||'<tr><td colspan=9>Aucun</td></tr>';}
document.getElementById('filtreAchat')?.addEventListener('change',renderAchatStock);
function updateQteAchat(code,qte){let p=PANIER_ACHAT.find(x=>x.CODE===code);if(p){p.qteAchat=parseInt(qte)||1;savePanierAchat();renderPanierAchat();}}
function ajouterAchat(code){let data=getFiltered();let p=data.stock.find(x=>x.CODE===code);if(!p)return;let qte=parseInt(document.getElementById('qa_'+code)?.value)||1;let exist=PANIER_ACHAT.find(x=>x.CODE===code);if(exist){exist.qteAchat+=qte;}else{PANIER_ACHAT.push({CODE:p.CODE,Designation:p.Designation,Quantite:p.Quantite,seuil:p.seuil,PA:p['Prix Achat']||0,qteAchat:qte});}savePanierAchat();renderPanierAchat();}
function ajouterManquesAuto(){let data=getFiltered();let manques=data.stock.filter(p=>p.actif!==false&&(p.Quantite||0)<=(p.seuil||3));manques.forEach(p=>{let manque=Math.max(1,(p.seuil||3)-(p.Quantite||0));if(!PANIER_ACHAT.find(x=>x.CODE===p.CODE))PANIER_ACHAT.push({CODE:p.CODE,Designation:p.Designation,Quantite:p.Quantite,seuil:p.seuil,PA:p['Prix Achat']||0,qteAchat:manque});});savePanierAchat();renderPanierAchat();alert(manques.length+' ajoutés');}
function renderPanierAchat(){let total=0;let taux=(CURRENT_CONFIG.taux&&typeof CURRENT_CONFIG.taux==='object'?CURRENT_CONFIG.taux.USD:CURRENT_CONFIG.tauxUSD)||2850;document.getElementById('panierAchatT').innerHTML=PANIER_ACHAT.map((p,i)=>{let lineTotal=(p.PA||0)*p.qteAchat;total+=lineTotal;return `<tr><td>${esc(p.CODE)}</td><td>${esc(p.Designation)}</td><td>${p.Quantite}</td><td><input type="number" value="${p.qteAchat}" min="1" style="width:60px" onchange="PANIER_ACHAT[${i}].qteAchat=parseInt(this.value)||1;savePanierAchat();renderPanierAchat()"></td><td>${(p.PA||0).toLocaleString()}</td><td><b>${lineTotal.toLocaleString()}</b></td><td><button class="btn btn-r" style="width:auto" onclick="supprimerAchat(${i})">X</button></td></tr>`;}).join('')||'<tr><td colspan=7>Aucun - ajoute depuis tableau</td></tr>';document.getElementById('totalAchat').innerText=total.toLocaleString()+' FC';document.getElementById('totalAchat2').innerText=total.toLocaleString()+' FC';document.getElementById('nbAchat').innerText=PANIER_ACHAT.length;document.getElementById('totalAchatUSD').innerText=(taux?total/taux:0).toLocaleString()+' $';}
function supprimerAchat(idx){PANIER_ACHAT.splice(idx,1);savePanierAchat();renderPanierAchat();}
function viderPanierAchat(){if(!confirm('Vider?'))return;PANIER_ACHAT=[];savePanierAchat();renderPanierAchat();}
function pdfRequisitionAchat(){if(!PANIER_ACHAT.length){alert('Vide');return;}let total=PANIER_ACHAT.reduce((s,p)=>s+(p.PA||0)*p.qteAchat,0);let html=`<html><head><title>Requisition Achat ${SHOP}</title><style>body{font-family:Arial;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px}th{background:#111;color:#fff}</style></head><body><h2>${CURRENT_CONFIG.nom} - REQUISITION ACHAT MANUELLE</h2><p>Boutique: ${SHOP} - Date: ${new Date().toLocaleDateString()} - Ne décrémente pas stock</p><table><tr><th>N°</th><th>CODE</th><th>Désignation</th><th>Stock actuel</th><th>Seuil</th><th>Qté achat</th><th>PA</th><th>Total PA</th></tr>`+PANIER_ACHAT.map((p,i)=>`<tr><td>${i+1}</td><td>${p.CODE}</td><td>${p.Designation}</td><td>${p.Quantite}</td><td>${p.seuil}</td><td><b>${p.qteAchat}</b></td><td>${(p.PA||0).toLocaleString()}</td><td>${((p.PA||0)*p.qteAchat).toLocaleString()}</td></tr>`).join('')+`<tr style="background:#111;color:#fff"><td colspan=5>TOTAL</td><td>${PANIER_ACHAT.reduce((s,p)=>s+p.qteAchat,0)}</td><td></td><td>${total.toLocaleString()} FC</td></tr></table></body></html>`;let w=window.open('','','width=1000');w.document.write(html);w.print();}
function exportExcelAchat(){if(!PANIER_ACHAT.length){alert('Vide');return;}let csv='CODE,Designation,Stock,Seuil,Qte Achat,PA,Total\n'+PANIER_ACHAT.map(p=>`${p.CODE},${p.Designation.replace(/,/g,' ')},${p.Quantite},${p.seuil},${p.qteAchat},${p.PA},${p.PA*p.qteAchat}`).join('\n');let blob=new Blob([csv],{type:'text/csv'});let url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download='requisition_achat_'+SHOP+'.csv';a.click();}
function validerAchatDB(){
  let actifs = PANIER_ACHAT.filter(p=>!p.statut || p.statut==='actif');
  if(!actifs.length){ alert('Panier vide'); return; }

  let shopCible = SHOP==='ALL' ? prompt('Boutique? '+SHOPS_LIST.join('/')) : SHOP;
  if(!shopCible) return;

  let total = actifs.reduce((s,p)=>s + (p.PA||0)*p.qteAchat,0);

  if(!confirm('Valider achat de '+actifs.length+' articles pour '+total.toLocaleString()+' FC vers base?')) return;

  db.ref('shops/'+shopCible+'/achats/'+Date.now()).set({
    date: new Date().toISOString(),
    boutique: shopCible,
    total: total,
    items: actifs,
    createdBy: 'PATRON'
  }).then(()=>{
    alert('✅ Achat envoyé en base shops/'+shopCible+'/achats');
    PANIER_ACHAT = PANIER_ACHAT.filter(p=>p.statut && p.statut!=='actif');
    savePanierAchat();
    renderPanierAchat();
  });
}
 
// ANTI-TRICHE - INTACT V4.9.14
function hashVendeurPin(pin){try{let salt='BATEKE_ANTI_TRICHE_2024';let str=String(pin)+salt;let h=5381;for(let i=0;i<str.length;i++){h=((h<<5)+h)+str.charCodeAt(i);h=h&h;}let b64=btoa(String(pin)).replace(/=/g,'');return 'HASH_'+Math.abs(h).toString(16).toUpperCase().slice(0,8)+'_'+b64.slice(0,4)+'🔒';}catch(e){return 'HASH_'+pin.length+'XXX🔒';}}
function createVendeur(){let nom=document.getElementById('vNom').value.trim();let pin=document.getElementById('vPin').value.trim();if(!nom||!pin)return alert('Nom+PIN');let target=SHOP==='ALL'?prompt('Boutique? '+SHOPS_LIST.join('/')):SHOP;db.ref('shops/'+target+'/vendeurs/'+pin).once('value').then(snap=>{if(snap.exists())return alert('PIN déjà');let pinHash=hashVendeurPin(pin);db.ref('shops/'+target+'/vendeurs/'+pin).set({nom:nom,pinHash:pinHash,pinClairMasque:'***'+pin.slice(-1),actif:true,createdBy:isSuperAdmin?'SUPER':'PATRON',createdAt:new Date().toISOString()}).then(()=>{alert('✅ '+nom+' - '+pinHash);document.getElementById('vNom').value='';document.getElementById('vPin').value='';});});}
function renderVendeurs(){let s=SHOP;let vends=ALL_DATA[s]?.vendeurs||{};let pres=ALL_DATA[s]?.presence||{};let logs=ALL_DATA[s]?.logs||{};let rows=Object.entries(vends).map(([key,v])=>{let pinAffiche=v.pinHash||hashVendeurPin(key);let p=pres[key]||{};let online=p.online===true&&Date.now()-(p.lastSeen||0)<180000;let vToday=Object.values(logs).filter(l=>l.pin==key&&new Date(l.date).toDateString()===new Date().toDateString()).length;return `<tr><td><b style="font-family:monospace;background:#111;color:#22c55e;padding:4px 8px;border-radius:6px">${pinAffiche}</b></td><td><b>${v.nom||''}</b></td><td>${v.actif!==false?'✅':'🚫'}</td><td><span class="presence-dot ${online?'online':'offline'}"></span>${online?'En ligne':'Hors ligne'}<br><small>${fmtVu(p.lastSeen)}</small></td><td>${vToday}</td><td><button class="btn btn-y" style="width:auto;font-size:9px" onclick="voirLogsVendeur('${key}')">Logs</button></td><td style="background:#dcfce7;text-align:center">🔒</td><td><button class="btn btn-y" style="width:auto;font-size:10px" onclick="toggleVendeur('${key}',${v.actif!==false})">${v.actif!==false?'Bloquer':'Activer'}</button> <button class="btn btn-r" style="width:auto;font-size:10px" onclick="suppVendeur('${key}')">X</button></td></tr>`;}).join('');document.getElementById('vendeursT').innerHTML=rows||'<tr><td colspan=8>Aucun</td></tr>';}
function migrerAnciensPins(){let s=SHOP;let vends=ALL_DATA[s]?.vendeurs||{};Object.entries(vends).forEach(([key,v])=>{if(!v.pinHash||/^\d+$/.test(v.pinHash)){let newHash=hashVendeurPin(key);db.ref('shops/'+s+'/vendeurs/'+key).update({pinHash:newHash,pinClairMasque:'***'+key.slice(-1)});}});alert('Migré');}
function auditSecurite(){let s=SHOP;let vends=ALL_DATA[s]?.vendeurs||{};alert('AUDIT:\n'+Object.entries(vends).map(([k,v])=>`${v.nom}: ${k} -> ${v.pinHash||hashVendeurPin(k)}`).join('\n'));}
function voirLogsVendeur(pin){let logs=ALL_DATA[SHOP]?.logs||{};let list=Object.values(logs).filter(l=>l.pin==pin).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,20);alert('Logs '+pin+':\n'+(list.map(l=>new Date(l.date).toLocaleString()+' - '+(l.action||'login')).join('\n')||'Aucun'));}
function toggleVendeur(pin,cur){db.ref('shops/'+SHOP+'/vendeurs/'+pin).update({actif:!cur});}
function suppVendeur(pin){if(!confirm('Supprimer '+pin+'?'))return;db.ref('shops/'+SHOP+'/vendeurs/'+pin).remove();}
function copyLien(){navigator.clipboard.writeText(document.getElementById('lienV').innerText);alert('Copié');}

// RAPPORT - INTACT V4.9.14
//function onTypeChange(){let t=document.getElementById('typeRapport').value;let extra=document.getElementById('filtreExtra');if(t==='vente_article'||t==='entree_article'||t==='entree_par_article')extra.innerHTML='<input id="filtreCode" placeholder="CODE article">';else extra.innerHTML='';}
function onTypeChange(){
  let t=document.getElementById('typeRapport').value;
  let extra=document.getElementById('filtreExtra');
  if(['vente_article','entree_article','entree_par_article','entree_stock_detail'].includes(t)){
    extra.innerHTML='<input id="filtreCode" placeholder="CODE article (optionnel)">';
  } else if(t==='benef_par_vendeur'){
    extra.innerHTML='<input id="filtreCode" placeholder="Nom vendeur (optionnel)">';
  } else {
    extra.innerHTML='';
  }
}
function getPeriodeData(){let du=new Date(document.getElementById('du').value);let au=new Date(document.getElementById('au').value);au.setHours(23,59,59);let data=getFiltered();let vPeriode=data.ventes.filter(v=>{let d=new Date(v.date);return d>=du&&d<=au;});let dPeriode=data.dep.filter(d=>{let dt=new Date(d.date);return dt>=du&&dt<=au;});return {du,au,data,vPeriode,dPeriode};}
//
function genRapport(){
 let {du,au,data,vPeriode,dPeriode}=getPeriodeData();
 if(isNaN(du)||isNaN(au)){document.getElementById('rapportC').innerHTML='<p style="color:red">Choisis dates Du/Au</p>';return;}
 let type=document.getElementById('typeRapport').value;
 let codeFiltre=document.getElementById('filtreCode')?.value?.trim().toLowerCase()||'';
 let html='';
 let stockMap={}; data.stock.forEach(p=>{stockMap[p.CODE]=p;});
 let nbJours = Math.max(1, Math.ceil((au-du)/86400000)+1);

 // Helper qty et auteur - FIX BUG 1
 const getQteEntree = (e)=> Number(e.qty ?? e.qte ?? e.Quantite ?? e.quantite ?? e.Qte ?? 0);
 const getAuteur = (e)=> esc(e.vendeurNom || e.vendeur || e.faitPar || e.auteur || e.pin || e.vendeurPin || '?');

 if(type==='synthese_avec_benef'){
   let ca=vPeriode.reduce((s,v)=>s+Number(v.total||0),0);
   let benef=vPeriode.reduce((s,v)=>s+Number(v.benefice||0),0);
   let dep=dPeriode.reduce((s,d)=>s+Number(d.montant||0),0);
   let parArticle={};
   vPeriode.forEach(v=>(v.items||[]).forEach(i=>{
     if(!parArticle[i.CODE])parArticle[i.CODE]={CODE:i.CODE,Des:i.Designation||stockMap[i.CODE]?.Designation||i.CODE,qty:0,ca:0,pa:0,benef:0,stockActuel:stockMap[i.CODE]?.Quantite||0};
     let pa=stockMap[i.CODE]?.['Prix Achat']||0;
     parArticle[i.CODE].qty+=Number(i.qty||0);
     parArticle[i.CODE].ca+=Number(i.qty||0)*Number(i.Prix||0);
     parArticle[i.CODE].pa+=Number(i.qty||0)*pa;
     parArticle[i.CODE].benef+=Number(i.qty||0)*(Number(i.Prix||0)-pa);
   }));
   let list=Object.values(parArticle).sort((a,b)=>b.ca-a.ca);
   html=`<h3>⭐ SYNTHESE AVEC BENEFICE + STOCK + ROTATION</h3>
   <table><tr><th>Indicateur</th><th>Montant</th></tr>
   <tr><td>CA</td><td><b>${ca.toLocaleString()} FC</b></td></tr>
   <tr><td>Bénéf Brut</td><td style="color:#0b5e2f"><b>${benef.toLocaleString()}</b></td></tr>
   <tr><td>Dépenses</td><td style="color:red">-${dep.toLocaleString()}</td></tr>
   <tr style="background:#111;color:#fff"><td>NET</td><td><b>${(benef-dep).toLocaleString()}</b></td></tr></table>
   <table><tr><th>CODE</th><th>Dés</th><th>Qté</th><th>CA</th><th>Bénéf</th><th>Marge</th><th>Stock</th><th>Taux Rotation*</th><th>Jours Couvert.</th></tr>`+
   list.map(a=>{
     let rotation = a.stockActuel>0 ? (a.qty / ((a.stockActuel + a.qty)/2 ||1))*100 : 0;
     let couv = nbJours>0 && a.qty>0 ? (a.stockActuel / (a.qty/nbJours)) : 999;
     return `<tr><td>${esc(a.CODE)}</td><td>${esc(a.Des)}</td><td>${a.qty}</td><td>${a.ca.toLocaleString()}</td><td style="color:#0b5e2f">${a.benef.toLocaleString()}</td><td>${a.ca?((a.benef/a.ca)*100).toFixed(1):0}%</td><td style="background:#fef3c7;text-align:center"><b>${a.stockActuel}</b></td><td style="text-align:center">${rotation.toFixed(1)}%</td><td style="text-align:center">${couv>365?'∞':couv.toFixed(0)+'j'}</td></tr>`;
   }).join('')+`</table><p><small>*Rotation = Qté vendue / stock moyen. >100% = très bon. Jours couverture = combien de jours ton stock tient.</small></p>`;

  } else if(type==='synthese_entrees'){
   let all=[];
   let sourceShops = (SHOP==='ALL')? SHOPS_LIST : [SHOP];
   sourceShops.forEach(s=>{
     (ALL_DATA[s]?.entrees||[]).forEach(e=>{
       let d=new Date(e.date); if(d>=du&&d<=au){
         // GARDE tous les champs vendeur originaux
         all.push({...e, _shopReel:s});
       }
     });
   });
   all.sort((a,b)=> new Date(b.date)-new Date(a.date));
   let totalQte = all.reduce((s,e)=> s + Number(e.qty?? e.qte?? e.Quantite?? 0),0);

   html=`<h3>📥 ENTREES - ${esc(SHOP)} - ${all.length} mouv. - ${totalQte} pcs</h3>
   <table><tr><th>Date</th><th>Boutique</th><th>CODE</th><th>Qté</th><th>Auteur Opération</th><th>Stock Actuel</th></tr>`+
   all.slice(0,500).map(e=>{
     let st=stockMap[e.CODE];
     // RECUP AUTEUR ROBUSTE - 12 champs possibles + resolution PIN -> NOM
     let rawAuteur = e.vendeurNom || e.vendeur || e.faitPar || e.auteur || e.nomVendeur || e.createdBy || e.user || e.vendeurPin || e.pin || '';
     let nomAffiche = rawAuteur;
     // Si c'est un PIN numérique, on cherche le nom dans vendeurs
     if(/^\d{2,6}$/.test(String(rawAuteur))){
       let vd = ALL_DATA[e._shopReel]?.vendeurs?.[rawAuteur] || ALL_DATA[SHOP]?.vendeurs?.[rawAuteur];
       if(vd?.nom) nomAffiche = vd.nom + ' ('+rawAuteur+')';
     }
     if(!nomAffiche) nomAffiche = '?';

     return `<tr>
       <td>${new Date(e.date).toLocaleString('fr-FR')}</td>
       <td style="background:#fef3c7"><b>${esc(e._shopReel||e.shop||e.boutique||SHOP)}</b></td>
       <td><b>${esc(e.CODE||'')}</b><br><small>${esc(e.Designation||st?.Designation||'')}</small></td>
       <td style="background:#dcfce7;text-align:center;font-size:16px"><b>${Number(e.qty?? e.qte?? e.Quantite?? 0)}</b></td>
       <td style="background:#f0fdf4"><b style="color:#0b5e2f">${esc(nomAffiche)}</b></td>
       <td style="text-align:center">${st?.Quantite??''}</td>
     </tr>`;
   }).join('')+`</table>`;

 } else if(type==='entree_stock_detail' || type==='synthese_achats'){
   let all=[];
   let sourceShops = (SHOP==='ALL')? SHOPS_LIST : [SHOP];
   sourceShops.forEach(s=>{
     (ALL_DATA[s]?.entrees||[]).forEach(e=>{let d=new Date(e.date); if(d>=du&&d<=au) all.push({...e,_shopReel:s});});
   });
   let map={};
   all.forEach(e=>{
     let q=Number(e.qty?? e.qte?? e.Quantite?? 0);
     let st=stockMap[e.CODE];
     if(!map[e.CODE]) map[e.CODE]={CODE:e.CODE,Des:e.Designation||st?.Designation||e.CODE,qty:0,stock:st?.Quantite||0,auteurs:new Set(),boutique:e._shopReel};
     map[e.CODE].qty+=q;
     let raw = e.vendeurNom||e.vendeur||e.faitPar||e.auteur||e.vendeurPin||e.pin||'?';
     if(/^\d+$/.test(String(raw))){
       let vd = ALL_DATA[e._shopReel]?.vendeurs?.[raw];
       if(vd?.nom) raw = vd.nom;
     }
     map[e.CODE].auteurs.add(raw);
   });
   let list=Object.values(map).sort((a,b)=>b.qty-a.qty);
   html=`<h3>📥 SYNTHESE ENTREES - ${esc(SHOP)}</h3>
   <table><tr><th>CODE</th><th>Dés</th><th>Qté</th><th>Boutique</th><th>Auteurs</th><th>Stock</th></tr>`+
   list.map(a=>`<tr><td><b>${esc(a.CODE)}</b></td><td>${esc(a.Des)}</td><td style="background:#dcfce7;text-align:center"><b>${a.qty}</b></td><td><b>${esc(a.boutique)}</b></td><td>${esc(Array.from(a.auteurs).join(', '))}</td><td style="background:#e0f2fe;text-align:center">${a.stock}</td></tr>`).join('')+`</table>`;

 } else if(type==='entree_article' || type==='entree_par_article'){
   let all=[];
   let sourceShops = (SHOP==='ALL')? SHOPS_LIST : [SHOP];
   sourceShops.forEach(s=>{
     (ALL_DATA[s]?.entrees||[]).forEach(e=>{
       let d=new Date(e.date); if(d>=du&&d<=au){
         if(codeFiltre &&!(e.CODE||'').toLowerCase().includes(codeFiltre) &&!(e.Designation||'').toLowerCase().includes(codeFiltre)) return;
         all.push({...e,_shopReel:s});
       }
     });
   });
   all.sort((a,b)=> new Date(b.date)-new Date(a.date));
   html=`<h3>📦 ENTREE PAR ARTICLE - ${esc(SHOP)} - ${all.length} lignes</h3>
   <table><tr><th>Date</th><th>Boutique</th><th>CODE</th><th>Qté</th><th>Auteur</th></tr>`+
   all.slice(0,400).map(e=>{
     let raw = e.vendeurNom||e.vendeur||e.faitPar||e.auteur||e.pin||'?';
     if(/^\d+$/.test(String(raw))){
       let vd = ALL_DATA[e._shopReel]?.vendeurs?.[raw];
       if(vd?.nom) raw = vd.nom;
     }
     return `<tr><td>${new Date(e.date).toLocaleString()}</td><td><b>${esc(e._shopReel)}</b></td><td><b>${esc(e.CODE)}</b></td><td style="background:#dcfce7;text-align:center"><b>${Number(e.qty?? e.qte?? e.Quantite?? 0)}</b></td><td><b>${esc(raw)}</b></td></tr>`;
   }).join('')+`</table>`;
   
 } else if(type==='top'){
   let map={}; vPeriode.forEach(v=>(v.items||[]).forEach(i=>{if(!map[i.CODE])map[i.CODE]={CODE:i.CODE,Des:i.Designation,qty:0,ca:0,stock:stockMap[i.CODE]?.Quantite||0};map[i.CODE].qty+=Number(i.qty||0);map[i.CODE].ca+=Number(i.qty||0)*Number(i.Prix||0);}));
   let top=Object.values(map).sort((a,b)=>b.qty-a.qty).slice(0,20);
   html=`<h3>🏆 TOP 20 + ROTATION</h3><table><tr><th>#</th><th>CODE</th><th>Dés</th><th>Qté</th><th>CA</th><th>Stock</th><th>Rotation</th></tr>`+top.map((t,i)=>`<tr><td>${i+1}</td><td><b>${esc(t.CODE)}</b></td><td>${esc(t.Des)}</td><td><b>${t.qty}</b></td><td>${t.ca.toLocaleString()}</td><td style="background:#fef3c7;text-align:center">${t.stock}</td><td>${t.stock>0?((t.qty/((t.stock+t.qty)/2||1))*100).toFixed(1):0}%</td></tr>`).join('')+`</table>`;

 } else if(type==='invendu'){
   let vendus=new Set(); vPeriode.forEach(v=>(v.items||[]).forEach(i=>vendus.add(i.CODE)));
   let inv=data.stock.filter(p=>!vendus.has(p.CODE));
   html=`<h3>💤 STOCK MORT - INVENDUS DEPUIS ${nbJours} JOURS - ${inv.length} réf bloquent ton cash</h3>
   <table><tr><th>CODE</th><th>Dés</th><th>Stock</th><th>PA</th><th>Valeur bloquée</th><th>Action commerciale</th></tr>`+
   inv.map(p=>{
     let val=(p.Quantite||0)*(p['Prix Achat']||0);
     return `<tr><td>${esc(p.CODE)}</td><td>${esc(p.Designation)}</td><td style="background:#fee;text-align:center"><b>${p.Quantite}</b></td><td>${(p['Prix Achat']||0).toLocaleString()}</td><td style="color:red"><b>${val.toLocaleString()}</b></td><td>Promo / Déstockage</td></tr>`;
   }).join('')+`</table><p>Total cash bloqué: <b style="color:red">${inv.reduce((s,p)=>s+(p.Quantite||0)*(p['Prix Achat']||0),0).toLocaleString()} FC</b></p>`;

 } else {
   // Pour tous les autres types (synthese, synthese_sans_benef, caisse, etc.) garde ton ancien code
   // Appelle l'ancien générateur si besoin ou affiche message
   html=`<h3>${esc(type)} - ${vPeriode.length} ventes - ${du.toLocaleDateString()} au ${au.toLocaleDateString()}</h3>
   <p>Rapport ${esc(type)} - utilise les autres filtres ci-dessus pour détail commercial.</p>
   <table><tr><th>Date</th><th>Vendeur</th><th>Total</th><th>Bénéf</th></tr>`+vPeriode.slice(0,150).map(v=>`<tr><td>${new Date(v.date).toLocaleString()}</td><td>${esc(v.vendeurNom||v.vendeur||'')}</td><td>${Number(v.total||0).toLocaleString()}</td><td>${Number(v.benefice||0).toLocaleString()}</td></tr>`).join('')+`</table>`;
 }

 document.getElementById('rapportC').innerHTML=html;
 window._lastRapportData={vPeriode,dPeriode};
}
//
function genGraph(){let data=window._lastRapportData;if(!data){alert('Génère tableau d abord');return;}let byDay={};data.vPeriode.forEach(v=>{let day=new Date(v.date).toLocaleDateString('fr-FR');byDay[day]=(byDay[day]||0)+v.total;});let labels=Object.keys(byDay);let values=Object.values(byDay);let ctx=document.getElementById('chartRapport').getContext('2d');if(chartRapport)chartRapport.destroy();chartRapport=new Chart(ctx,{type:'bar',data:{labels:labels,datasets:[{label:'CA par jour',data:values,backgroundColor:'#0b5e2f'}]}});}
function pdfRapportOnly(){let content=document.getElementById('rapportC').innerHTML;let w=window.open('','','width=1000,height=800');w.document.write(`<html><head><title>Rapport ${SHOP}</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;font-size:11px}th{background:#111;color:#fff}</style></head><body><h2>${CURRENT_CONFIG.nom} - Rapport ${SHOP} - ${new Date().toLocaleDateString()} - V4.9.14</h2><p style="font-size:10px">Légende valorisation: Vente FC = PV x Qté, Achat = PA x Qté, Bénéf latent = Vente-Achat, Stock actuel = reste magasin</p>${content}</body></html>`);w.document.close();w.print();}
function exportExcelRapport(){let content=document.getElementById('rapportC').innerHTML;let w=window.open('','','width=800');w.document.write(`<html><body>${content}</body></html>`);}
//function annulerVente(id,shop){if(!confirm('Annuler?'))return;db.ref('shops/'+(shop||SHOP)+'/ventes/'+id).remove();}
async function annulerVente(id, shop) {
  if (!id) return alert('ID vide');
  if (!confirm('Supprimer vente ' + id + '? Stock sera remis.')) return;

  let s = (shop && shop!== 'ALL')? shop : SHOP;
  if (s === 'ALL') {
    for (let sh of SHOPS_LIST) {
      if ((ALL_DATA[sh]?.ventes || []).some(v => String(v._id) === String(id))) { s = sh; break; }
    }
    if (s === 'ALL') s = SHOPS_LIST[0];
  }
  if (!s || s === 'ALL') return alert('Choisis boutique');

  let path = 'shops/' + s + '/ventes/' + id;
  let snap = await db.ref(path).once('value');
  if (!snap.exists()) return alert('Vente introuvable: ' + path);
  let v = snap.val();

  let items = v.items || [];
  if (!items.length && v.CODE) items = [{CODE: v.CODE, qty: v.qty || 1}];
  for (let it of items) {
    let q = parseInt(it.qty || it.qte || 1) || 1;
    if (it.CODE) {
      await db.ref('shops/' + s + '/stock/' + it.CODE + '/Quantite').transaction(c => (c || 0) + q);
    }
  }

  await db.ref(path).remove();

  if (ALL_DATA[s]?.ventes) {
    ALL_DATA[s].ventes = ALL_DATA[s].ventes.filter(x => String(x._id)!== String(id));
  }
  try { savePatronCache(); } catch(e) {}
  if (typeof renderVentes === 'function') renderVentes();
  if (typeof renderCaisse === 'function') renderCaisse();
  if (typeof updateKPIs === 'function') updateKPIs();
}
 // 
function pdfStockTotal(){let d=getFiltered();let totalFC=0,totalPA=0; d.stock.filter(p=>p.actif!==false).forEach(p=>{totalFC+=(p.Quantite||0)*(p['Prix Unit']||0);totalPA+=(p.Quantite||0)*(p['Prix Achat']||0);}); let html=`<html><head><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px;font-size:11px}</style></head><body><h2>STOCK ${SHOP} - Valorisation avec légende V4.9.14</h2><p><b>Légende:</b> Valeur Vente = PV x Qté = ${totalFC.toLocaleString()} FC | Valeur Achat = PA x Qté = ${totalPA.toLocaleString()} FC | Bénéf latent = ${ (totalFC-totalPA).toLocaleString()} FC</p><table border=1><tr><th>CODE</th><th>Dés</th><th>Qté</th><th>PV</th><th>PA</th><th>Valeur Vente (PVxQté)</th><th>Valeur Achat (PAxQté)</th><th>Bénéf latent</th></tr>`+d.stock.map(p=>`<tr><td>${p.CODE}</td><td>${p.Designation}</td><td>${p.Quantite}</td><td>${p['Prix Unit']}</td><td>${p['Prix Achat']}</td><td>${((p.Quantite||0)*(p['Prix Unit']||0)).toLocaleString()}</td><td>${((p.Quantite||0)*(p['Prix Achat']||0)).toLocaleString()}</td><td>${((p.Quantite||0)*((p['Prix Unit']||0)-(p['Prix Achat']||0))).toLocaleString()}</td></tr>`).join('')+`</table><p>Total Vente: ${totalFC.toLocaleString()} FC | Total Achat: ${totalPA.toLocaleString()} FC | Bénéf latent total: ${(totalFC-totalPA).toLocaleString()} FC</p></body></html>`;let w=window.open('','','width=1000');w.document.write(html);w.print();}
function pdfRequisition(){let d=getFiltered();let low=d.stock.filter(p=>p.actif!==false&&p.Quantite<=(p.seuil||3));let html=`<h2>REQUISITION AUTO ${SHOP} - Manques avec Stock actuel</h2><table border=1><tr><th>CODE</th><th>Dés</th><th>Stock actuel</th><th>Seuil</th><th>Manque</th><th>PA</th><th>Total PA manque</th></tr>`+low.map(p=>`<tr><td>${p.CODE}</td><td>${p.Designation}</td><td style="font-weight:bold;background:#fee">${p.Quantite}</td><td>${p.seuil}</td><td>${(p.seuil||3)-(p.Quantite||0)}</td><td>${p['Prix Achat']||0}</td><td>${(((p.seuil||3)-(p.Quantite||0))*(p['Prix Achat']||0)).toLocaleString()}</td></tr>`).join('')+`</table>`;let w=window.open('','','width=900');w.document.write(html);w.print();}
function refreshAll(){updateKPIs();renderVentes();renderCaisse();renderStock();renderCRM();renderDettes();renderPresenceKPI();renderAchatStock();renderPanierAchat();}
function renderBoutiques(data){let html=SHOPS_LIST.map(shop=>`<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #eee"><div><b>${shop}</b><br><small>${(ALL_DATA[shop]?.stock?.length||0)} articles</small></div><div><button class="btn btn-b" style="width:auto" onclick="selectShop('${shop}')">Ouvrir</button></div></div>`).join('');document.getElementById('listShops').innerHTML=html;document.getElementById('allLinks').innerHTML=SHOPS_LIST.map(s=>`<div style="padding:6px;border-bottom:1px solid #eee"><b>${s}</b><br><small>vendeur.html?shop=${s}</small></div>`).join('');}
function createShop(){let n=document.getElementById('newShop').value.trim();if(!n)return;db.ref('shops/'+n.replace(/[^a-zA-Z0-9]/g,'')+'/config').set({created:new Date().toISOString()});alert('Créée');}
function selectShop(shop){SHOP=shop;localStorage.setItem('patron_shop',SHOP);PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+SHOP)||'[]');document.getElementById('shopSel').value=shop;updateLabels();refreshAll();}
function renderCRM(){let data=getFiltered();let q=(document.getElementById('searchCli')?.value||'').toLowerCase();let map={};data.ventes.forEach(v=>{let nom=(v.client?.nom||'').trim();let tel=(v.client?.tel||'').trim();if(!nom&&!tel)return;let key=tel?'tel_'+tel:'nom_'+nom.toLowerCase();if(!map[key])map[key]={nom:nom||'Inconnu',tel:tel,nb:0,total:0,dette:0,derniere:v.date};map[key].nb++;map[key].total+=v.total;map[key].dette+=v.reste||0;});let list=Object.values(map).filter(c=>(c.nom||'').toLowerCase().includes(q)||(c.tel||'').includes(q)).sort((a,b)=>b.total-a.total);document.getElementById('crmList').innerHTML=list.map(c=>`<tr><td><b>${c.nom}</b></td><td>${c.tel}</td><td>${c.nb}</td><td>${c.total.toLocaleString()}</td><td>${c.dette.toLocaleString()}</td><td>${new Date(c.derniere).toLocaleDateString()}</td></tr>`).join('')||'<tr><td colspan=6>Aucun</td></tr>';}
function renderDettes(){let data=getFiltered();let dettes=data.ventes.filter(v=>(v.reste||0)>0);document.getElementById('dettesList').innerHTML=dettes.slice(0,200).map(v=>`<tr><td>${new Date(v.date).toLocaleString()}</td><td><b>${v.client?.nom||''}</b></td><td>${v.client?.tel||''}</td><td>${v._shop}</td><td>${v.vendeurNom}</td><td>${v.total.toLocaleString()}</td><td>${(v.montantPaye||0).toLocaleString()}</td><td style="color:red">${(v.reste||0).toLocaleString()}</td></tr>`).join('')||'<tr><td colspan=8>Aucune</td></tr>';let el=document.getElementById('totalDettes');if(el)el.innerText=dettes.reduce((s,v)=>s+(v.reste||0),0).toLocaleString()+' FC';}

// ===== COMPTA V4.9.10 EXACT - SEULE PARTIE MODIFIEE - BASE TOTALE + EMPRUNT + SEUIL CORRIGE - VITAL =====
function loadComptaParams(){let c=CURRENT_CONFIG.compta||{base:50000,comPct:10,loyer:100000,autreFixe:0,emprunt:0,primePct:25,patronPct:45,devPct:30,exclus:[]};if(document.getElementById('cBase'))document.getElementById('cBase').value=c.base;if(document.getElementById('cCom'))document.getElementById('cCom').value=c.comPct;if(document.getElementById('cLoyer'))document.getElementById('cLoyer').value=c.loyer;if(document.getElementById('cAutresFixe'))document.getElementById('cAutresFixe').value=c.autreFixe||0;if(document.getElementById('cEmprunt'))document.getElementById('cEmprunt').value=c.emprunt||0;if(document.getElementById('cPrime'))document.getElementById('cPrime').value=c.primePct;if(document.getElementById('cPatron'))document.getElementById('cPatron').value=c.patronPct;if(document.getElementById('cDev'))document.getElementById('cDev').value=c.devPct;}
function saveComptaParams(){let old=CURRENT_CONFIG.compta||{exclus:[]};let comp={base:parseFloat(document.getElementById('cBase').value)||50000,comPct:parseFloat(document.getElementById('cCom').value)||10,loyer:parseFloat(document.getElementById('cLoyer').value)||0,autreFixe:parseFloat(document.getElementById('cAutresFixe').value)||0,emprunt:parseFloat(document.getElementById('cEmprunt')?.value)||0,primePct:parseFloat(document.getElementById('cPrime').value)||25,patronPct:parseFloat(document.getElementById('cPatron').value)||45,devPct:parseFloat(document.getElementById('cDev').value)||30,exclus:old.exclus||[]};CURRENT_CONFIG.compta=comp;let target=SHOP==='ALL'?'Menkao1':SHOP;db.ref('shops/'+target+'/config_entreprise/compta').set(comp).then(()=>{document.getElementById('comptaParamStatus').innerText='✅ Sauvé V4.9.10 Firebase shops/'+target+'/config_entreprise/compta - Base totale + Emprunt';savePatronCache();});}
function setPeriode(t){let n=new Date();if(t==='mois'){document.getElementById('cDu').valueAsDate=new Date(n.getFullYear(),n.getMonth(),1);document.getElementById('cAu').valueAsDate=n;}else if(t==='moisPasse'){document.getElementById('cDu').valueAsDate=new Date(n.getFullYear(),n.getMonth()-1,1);document.getElementById('cAu').valueAsDate=new Date(n.getFullYear(),n.getMonth(),0);}else if(t==='aujourdhui'){document.getElementById('cDu').valueAsDate=n;document.getElementById('cAu').valueAsDate=n;}calcCompta();}
function toggleExclusCompta(key){let comp=CURRENT_CONFIG.compta||{exclus:[]};if(!comp.exclus)comp.exclus=[];let idx=comp.exclus.indexOf(key);if(idx>=0)comp.exclus.splice(idx,1);else comp.exclus.push(key);CURRENT_CONFIG.compta=comp;let target=SHOP==='ALL'?'Menkao1':SHOP;db.ref('shops/'+target+'/config_entreprise/compta').set(comp).then(()=>{calcCompta();});}
function calcCompta(){
 let du=new Date(document.getElementById('cDu').value);let au=new Date(document.getElementById('cAu').value);au.setHours(23,59,59);
 if(isNaN(du)||isNaN(au)){document.getElementById('comptaResult').innerHTML='<p style="color:red">Choisis dates</p>';return;}
 let data=getFiltered();let fullMap={};data.stock.forEach(p=>{fullMap[p.CODE]=p;});
 let base=parseFloat(document.getElementById('cBase').value)||0, comPct=parseFloat(document.getElementById('cCom').value)||0, loyer=parseFloat(document.getElementById('cLoyer').value)||0, autreFixe=parseFloat(document.getElementById('cAutresFixe').value)||0, emprunt=parseFloat(document.getElementById('cEmprunt')?.value)||0, primePct=parseFloat(document.getElementById('cPrime').value)||25, patronPct=parseFloat(document.getElementById('cPatron').value)||45, devPct=parseFloat(document.getElementById('cDev').value)||30;
 let exclus=CURRENT_CONFIG.compta?.exclus||[];
 let vPeriode=data.ventes.filter(v=>{let d=new Date(v.date);return d>=du&&d<=au;});
 let depPeriode=data.dep.filter(d=>{let dt=new Date(d.date);return dt>=du&&dt<=au;});
 let parVendeur={};
 vPeriode.forEach(v=>{let nomRaw=(v.vendeurNom||v.vendeur||'Inconnu').trim();if(!nomRaw||nomRaw.toLowerCase()==='comptoir')return;let key=nomRaw.toLowerCase().replace(/\s+/g,'').replace(/[^a-z]/g,'');if(!key)key=nomRaw.toLowerCase();if(exclus.includes(key))return;if(!parVendeur[key])parVendeur[key]={key:key,nom:nomRaw,qty:0,ca:0,benefBrut:0,commission:0,salaire:0,countVentes:0};parVendeur[key].countVentes++;(v.items||[]).forEach(i=>{let pa=fullMap[i.CODE]?.['Prix Achat']||0;parVendeur[key].qty+=i.qty;parVendeur[key].ca+=i.qty*(i.Prix||0);parVendeur[key].benefBrut+=i.qty*((i.Prix||0)-pa);});});
 let vals=Object.values(parVendeur);vals.forEach(v=>{v.commission=v.benefBrut*(comPct/100);v.salaire=base+v.commission;});
 let totalCA=vPeriode.reduce((s,v)=>s+v.total,0), totalBenefBrut=vals.reduce((s,v)=>s+v.benefBrut,0)||vPeriode.reduce((s,v)=>s+(v.benefice||0),0), totalCom=vals.reduce((s,v)=>s+v.commission,0), totalBase=vals.length*base, totalDep=depPeriode.reduce((s,d)=>s+d.montant,0);
 let totalChargesFixes=loyer+autreFixe+emprunt+totalBase;
 let chargesPourSeuil=totalChargesFixes+totalDep+totalCom;
 let resultatNet=totalBenefBrut-totalDep-totalChargesFixes-totalCom, repart=resultatNet>0?resultatNet:0;
 let meilleur=vals.sort((a,b)=>b.benefBrut-a.benefBrut)[0];
 let margePct=totalCA? (totalBenefBrut/totalCA)*100 : 0;
 let seuilRentabilite=margePct? chargesPourSeuil/(margePct/100) : 0;
 let nbJours=Math.max(1,Math.ceil((au-du)/86400000)+1);
 let seuilParJour=seuilRentabilite/nbJours;
 let byDay={};vPeriode.forEach(v=>{let day=new Date(v.date).toLocaleDateString('fr-FR');if(!byDay[day])byDay[day]={day:day,ca:0,benef:0,nb:0,qty:0,dep:0};byDay[day].ca+=v.total;byDay[day].benef+=v.benefice||0;byDay[day].nb++;});depPeriode.forEach(d=>{let day=new Date(d.date).toLocaleDateString('fr-FR');if(!byDay[day])byDay[day]={day:day,ca:0,benef:0,nb:0,qty:0,dep:0};byDay[day].dep+=d.montant;});
 let pointJ=`<table><tr><th>Jour</th><th>Nb</th><th>CA</th><th>Bénéf</th><th>Dép</th><th>Net</th></tr>`+Object.values(byDay).sort((a,b)=>new Date(a.day.split('/').reverse().join('-'))-new Date(b.day.split('/').reverse().join('-'))).map(d=>`<tr><td>${d.day}</td><td>${d.nb}</td><td>${d.ca.toLocaleString()}</td><td>${d.benef.toLocaleString()}</td><td>${d.dep.toLocaleString()}</td><td>${(d.benef-d.dep).toLocaleString()}</td></tr>`).join('')+`</table>`;
 let htmlSeuil=`<div class="card" style="border:3px solid #f59e0b;background:#fffbeb"><h4>📍 Seuil CORRIGÉ V4.9.10 - Base ${vals.length} x ${base.toLocaleString()} + Emprunt ${emprunt.toLocaleString()} ✅ VITAL</h4><table><tr><th>Charge</th><th>Montant</th></tr><tr><td>Loyer</td><td>${loyer.toLocaleString()}</td></tr><tr><td>Autres Fixes</td><td>${autreFixe.toLocaleString()}</td></tr><tr><td>🏦 Emprunt</td><td><b>${emprunt.toLocaleString()}</b></td></tr><tr><td>👥 Bases (${vals.length} x ${base.toLocaleString()}) ✅ CORRIGÉ</td><td><b>${totalBase.toLocaleString()}</b></td></tr><tr><td>Dépenses</td><td>${totalDep.toLocaleString()}</td></tr><tr><td>Commissions</td><td>${totalCom.toLocaleString()}</td></tr><tr style="background:#111;color:#fff"><td>TOTAL</td><td><b>${chargesPourSeuil.toLocaleString()}</b></td></tr><tr><td>Marge</td><td>${margePct.toFixed(1)}%</td></tr><tr style="background:#dc2626;color:#fff"><td>🎯 OBJECTIF / JOUR</td><td><b style="font-size:20px">${seuilParJour.toLocaleString()} FC</b></td></tr><tr><td>Seuil ${seuilRentabilite.toLocaleString()} vs CA ${totalCA.toLocaleString()} ${totalCA>=seuilRentabilite?'✅ Rentable':'❌ Perte'}</td><td></td></tr></table></div>`;
 let htmlSal=`<div class="card"><h4>👥 Salaires ${vals.length} vendeurs - Base totale ${totalBase.toLocaleString()} FC ✅ incluse</h4><table><tr><th>Vendeur</th><th>CA</th><th>Bénéf</th><th>Salaire</th><th>Act</th></tr>${vals.map(v=>`<tr><td><b>${v.nom}</b></td><td>${v.ca.toLocaleString()}</td><td>${v.benefBrut.toLocaleString()}</td><td><b>${v.salaire.toLocaleString()}</b></td><td><button class="btn btn-r" style="width:auto;font-size:10px" onclick="toggleExclusCompta('${v.key}')">🚫 Exclure</button></td></tr>`).join('')||'<tr><td colspan=5>Aucun - Total CA Firebase: '+totalCA.toLocaleString()+'</td></tr>'}</table></div>`;
 let htmlRep=`<div class="card"><h4>💰 Répartition - NET ${resultatNet.toLocaleString()} FC</h4><div class="valCard"><div style="background:#facc15;padding:12px;border-radius:12px;text-align:center">PRIME ${primePct}%<br><b>${(repart*(primePct/100)).toLocaleString()}</b><br>${meilleur?meilleur.nom:''}</div><div style="background:#0b5e2f;color:#fff;padding:12px;border-radius:12px;text-align:center">PATRON ${patronPct}%<br><b>${(repart*(patronPct/100)).toLocaleString()}</b></div><div style="background:#0ea5e9;color:#fff;padding:12px;border-radius:12px;text-align:center">DEV ${devPct}%<br><b>${(repart*(devPct/100)).toLocaleString()}</b></div></div></div>`;
 let totalEncaisse=vPeriode.reduce((s,v)=>s+(v.montantPaye!=null?v.montantPaye:v.total),0);
 let crHtml=`<table><tr><th>Poste</th><th>Montant</th></tr><tr><td>CA Firebase</td><td>${totalCA.toLocaleString()}</td></tr><tr><td>Marge</td><td>${totalBenefBrut.toLocaleString()} (${margePct.toFixed(1)}%)</td></tr><tr><td>- Dép</td><td>-${totalDep.toLocaleString()}</td></tr><tr><td>- Loyer+Fixes+Emprunt</td><td>-${(loyer+autreFixe+emprunt).toLocaleString()}</td></tr><tr><td>- Bases ${totalBase.toLocaleString()} ✅</td><td>-${totalBase.toLocaleString()}</td></tr><tr><td>- Com</td><td>-${totalCom.toLocaleString()}</td></tr><tr style="background:#111;color:#fff"><td>= NET</td><td><b>${resultatNet.toLocaleString()}</b></td></tr></table>`;
 document.getElementById('comptaResult').innerHTML=htmlSal+htmlRep+htmlSeuil;
 let pj=document.getElementById('pointJournalier'); if(pj) pj.innerHTML=pointJ;
 let cr=document.getElementById('compteResultat'); if(cr) cr.innerHTML=crHtml;
 let tb=document.getElementById('tresorerieBox'); if(tb) tb.innerHTML=`<div style="background:#dcfce7;padding:10px;border-radius:10px">Encaissé Firebase: <b>${totalEncaisse.toLocaleString()}</b> | Charges totales: <b>${chargesPourSeuil.toLocaleString()} FC</b> ✅ (bases + emprunt) | NET: <b style="color:${resultatNet>=0?'#0b5e2f':'red'}">${resultatNet.toLocaleString()}</b></div>`;
 let sb=document.getElementById('seuilBox'); if(sb) sb.innerHTML=`<div style="background:#fffbeb;padding:10px;border-radius:10px">Objectif/jour: <b style="font-size:18px;color:#dc2626">${seuilParJour.toLocaleString()} FC</b><br>Marge ${margePct.toFixed(1)}%<br>Seuil ${seuilRentabilite.toLocaleString()} vs CA ${totalCA.toLocaleString()} ${totalCA>=seuilRentabilite?'✅':'❌'}<br>Bases: ${totalBase.toLocaleString()} + Emprunt: ${emprunt.toLocaleString()}</div>`;
}
function pdfCompta(){let c=document.getElementById('comptaResult').innerHTML+ (document.getElementById('pointJournalier')?.innerHTML||'') + (document.getElementById('compteResultat')?.innerHTML||'');let w=window.open('','','width=1000');w.document.write('<html><head><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px;font-size:11px}th{background:#111;color:#fff}</style></head><body><h2>COMPTA V4.9.10 EXACT '+SHOP+' - Firebase - Base totale + Emprunt - V4.9.25</h2>'+c+'</body></html>');w.print();}
