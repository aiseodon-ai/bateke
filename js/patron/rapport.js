// RAPPORT SAFE V4.9.25 - ne bloque pas SYNC - FIDÈLE
export function onTypeChange(){
 try{
  let t=document.getElementById('typeRapport')?.value;
  let extra=document.getElementById('filtreExtra');
  if(!extra) return;
  if(['vente_article','entree_article','entree_par_article','entree_stock_detail'].includes(t)){
    extra.innerHTML='<input id="filtreCode" placeholder="CODE article (optionnel)" style="padding:8px;border:1px solid #ccc;border-radius:8px;width:100%">';
  } else if(t==='benef_par_vendeur'){
    extra.innerHTML='<input id="filtreCode" placeholder="Nom vendeur (optionnel)" style="padding:8px;border:1px solid #ccc;border-radius:8px;width:100%">';
  } else { extra.innerHTML=''; }
 }catch(e){console.log("onTypeChange", e)}
}

export function getPeriodeData(){
  let du=new Date(document.getElementById('du')?.value);
  let au=new Date(document.getElementById('au')?.value);
  au.setHours(23,59,59);
  let data=window.getFiltered?window.getFiltered():{ventes:[],dep:[],stock:[],entrees:[]};
  let vPeriode=(data.ventes||[]).filter(v=>{let d=new Date(v.date);return d>=du&&d<=au;});
  let dPeriode=(data.dep||[]).filter(d=>{let dt=new Date(d.date);return dt>=du&&dt<=au;});
  return {du,au,data,vPeriode,dPeriode};
}

export function genRapport(){
 try{
 let {du,au,data,vPeriode,dPeriode}=getPeriodeData();
 if(isNaN(du)||isNaN(au)){
   let rc=document.getElementById('rapportC');
   if(rc) rc.innerHTML='<p style="color:red">Choisis dates Du/Au</p>';
   return;
 }
 let type=document.getElementById('typeRapport')?.value||'synthese_avec_benef';
 let codeFiltre=document.getElementById('filtreCode')?.value?.trim().toLowerCase()||'';
 let escFn=window.esc||((t)=>String(t||''));
 let SHOP=window.SHOP||window.STATE?.SHOP||'Menkao2';
 let SHOPS_LIST=window.SHOPS_LIST||Object.keys(window.ALL_DATA||{});
 let ALL_DATA=window.ALL_DATA||window.STATE?.ALL_DATA||{};

 let html='';
 let stockMap={}; (data.stock||[]).forEach(p=>{let c=p.CODE||p.code; if(c) stockMap[c]=p;});
 let nbJours = Math.max(1, Math.ceil((au-du)/86400000)+1);

 if(type==='synthese_avec_benef'){
   let ca=vPeriode.reduce((s,v)=>s+(parseFloat(v.total||0)),0);
   let benef=vPeriode.reduce((s,v)=>s+(parseFloat(v.benefice||0)),0);
   let dep=dPeriode.reduce((s,d)=>s+(parseFloat(d.montant||0)),0);
   let parArticle={};
   vPeriode.forEach(v=>(v.items||[]).forEach(i=>{
     if(codeFiltre &&!(i.CODE||'').toLowerCase().includes(codeFiltre)) return;
     let code=i.CODE||i.code;
     if(!parArticle[code])parArticle[code]={CODE:code,Des:i.Designation||stockMap[code]?.Designation||code,qty:0,ca:0,benef:0,stockActuel:stockMap[code]?.Quantite||0};
     let pa=stockMap[code]?.['Prix Achat']||0;
     parArticle[code].qty+=parseFloat(i.qty||0);
     parArticle[code].ca+=parseFloat(i.qty||0)*parseFloat(i.Prix||0);
     parArticle[code].benef+=parseFloat(i.qty||0)*(parseFloat(i.Prix||0)-pa);
   }));
   let list=Object.values(parArticle).sort((a,b)=>b.ca-a.ca);
   html=`<h3>⭐ SYNTHESE AVEC BENEFICE + STOCK + ROTATION - ${list.length} articles</h3>
   <table><tr><th>Indicateur</th><th>Montant</th></tr>
   <tr><td>CA</td><td><b>${ca.toLocaleString()} FC</b></td></tr>
   <tr><td>Bénéf Brut</td><td style="color:#0b5e2f"><b>${benef.toLocaleString()}</b></td></tr>
   <tr><td>Dépenses</td><td style="color:red">-${dep.toLocaleString()}</td></tr>
   <tr style="background:#111;color:#fff"><td>NET</td><td><b>${(benef-dep).toLocaleString()}</b></td></tr></table>
   <table><tr><th>CODE</th><th>Dés</th><th>Qté</th><th>CA</th><th>Bénéf</th><th>Marge</th><th>Stock</th><th>Rotation</th><th>Jours</th></tr>`+
   list.map(a=>{
     let rotation = a.stockActuel>0? (a.qty / ((a.stockActuel + a.qty)/2 ||1))*100 : 0;
     let couv = nbJours>0 && a.qty>0? (a.stockActuel / (a.qty/nbJours)) : 999;
     return `<tr><td>${escFn(a.CODE)}</td><td>${escFn(a.Des)}</td><td>${a.qty}</td><td>${a.ca.toLocaleString()}</td><td style="color:#0b5e2f">${a.benef.toLocaleString()}</td><td>${a.ca?((a.benef/a.ca)*100).toFixed(1):0}%</td><td style="background:#fef3c7;text-align:center"><b>${a.stockActuel}</b></td><td style="text-align:center">${rotation.toFixed(1)}%</td><td style="text-align:center">${couv>365?'∞':couv.toFixed(0)+'j'}</td></tr>`;
   }).join('')+`</table>`;

 } else if(type==='synthese_entrees'){
   let all=[];
   let sourceShops=(SHOP==='ALL')?SHOPS_LIST:[SHOP];
   sourceShops.forEach(s=>{
     (ALL_DATA[s]?.entrees||[]).forEach(e=>{
       let d=new Date(e.date); if(d>=du&&d<=au) all.push({...e,_shopReel:s});
     });
   });
   all.sort((a,b)=> new Date(b.date)-new Date(a.date));
   html=`<h3>📥 ENTREES - ${escFn(SHOP)} - ${all.length} mouv.</h3>
   <table><tr><th>Date</th><th>Boutique</th><th>CODE</th><th>Qté</th><th>Auteur</th><th>Stock</th></tr>`+
   all.slice(0,500).map(e=>{
     let st=stockMap[e.CODE];
     let rawAuteur = e.vendeurNom||e.vendeur||e.faitPar||e.auteur||e.vendeurPin||e.pin||'';
     let nomAffiche=rawAuteur;
     if(/^\d{2,6}$/.test(String(rawAuteur))){
       let vd=ALL_DATA[e._shopReel]?.vendeurs?.[rawAuteur]||ALL_DATA[SHOP]?.vendeurs?.[rawAuteur];
       if(vd?.nom) nomAffiche=vd.nom+' ('+rawAuteur+')';
     }
     return `<tr>
       <td>${new Date(e.date).toLocaleString('fr-FR')}</td>
       <td style="background:#fef3c7"><b>${escFn(e._shopReel||SHOP)}</b></td>
       <td><b>${escFn(e.CODE||'')}</b><br><small>${escFn(e.Designation||st?.Designation||'')}</small></td>
       <td style="background:#dcfce7;text-align:center"><b>${Number(e.qty??e.qte??e.Quantite??0)}</b></td>
       <td style="background:#f0fdf4"><b style="color:#0b5e2f">${escFn(nomAffiche||'?')}</b></td>
       <td style="text-align:center">${st?.Quantite??''}</td>
     </tr>`;
   }).join('')+`</table>`;

 } else {
   let ca=vPeriode.reduce((s,v)=>s+(parseFloat(v.total||0)),0);
   let benef=vPeriode.reduce((s,v)=>s+(parseFloat(v.benefice||0)),0);
   html=`<h3>RAPPORT ${escFn(type)} - ${ca.toLocaleString()} FC - Bénéf ${benef.toLocaleString()} FC - ${vPeriode.length} ventes</h3>
   <table><tr><th>Date</th><th>Vendeur</th><th>CODE</th><th>Qté</th><th>Total</th></tr>`+
   vPeriode.slice(0,200).map(v=>(v.items||[]).map(i=>`<tr><td>${new Date(v.date).toLocaleString()}</td><td>${escFn(v.vendeurNom||'')}</td><td>${escFn(i.CODE||i.code)}</td><td>${i.qty}</td><td>${(parseFloat(i.qty||0)*parseFloat(i.Prix||0)).toLocaleString()}</td></tr>`).join('')).join('')+`</table>`;
 }

 let rc=document.getElementById('rapportC');
 if(rc) rc.innerHTML=html;

 // Graph si existe
 if(window.genGraph) window.genGraph(vPeriode, dPeriode);

 }catch(e){
   console.error("genRapport error", e);
   let rc=document.getElementById('rapportC');
   if(rc) rc.innerHTML='<p style="color:red">Erreur rapport: '+e.message+'</p>';
 }
}

window.onTypeChange=onTypeChange;
window.getPeriodeData=getPeriodeData;
window.genRapport=genRapport;
console.log("✅ rapport.js SAFE FIDÈLE chargé");
