// RAPPORT SAFE V4.9.25 - FULL 19 RAPPORTS - FIX SYNTAX 48-50 - FIDÈLE
export function onTypeChange(){
 try{
  let t=document.getElementById('typeRapport')?.value;
  let extra=document.getElementById('filtreExtra');
  if(!extra) return;
  if(['vente_article','entree_article','entree_par_article','vente_par_article'].includes(t)){
    extra.innerHTML='<input id="filtreCode" placeholder="CODE ou Désignation (optionnel)" style="padding:8px;border:1px solid #ccc;border-radius:8px;width:100%">';
  } else if(t==='benef_par_vendeur' || t==='synthese_ventes_vendeur' || t==='ca_client'){
    extra.innerHTML='<input id="filtreCode" placeholder="Nom / Client / Vendeur (optionnel)" style="padding:8px;border:1px solid #ccc;border-radius:8px;width:100%">';
  } else if(t==='entree_stock_detail' || t==='synthese_achats' || t==='synthese_entrees'){
    extra.innerHTML='<input id="filtreCode" placeholder="Filtre CODE (optionnel)" style="padding:8px;border:1px solid #ccc;border-radius:8px;width:100%">';
  } else { extra.innerHTML=''; }
 }catch(e){console.log("onTypeChange", e)}
}

export function getPeriodeData(){
  let du=new Date(document.getElementById('du')?.value);
  let au=new Date(document.getElementById('au')?.value);
  au.setHours(23,59,59);
  let data=window.getFiltered?window.getFiltered():{ventes:[],dep:[],stock:[],entrees:[],vers:[]};
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
 const getAuteur = (e)=> e.vendeurNom||e.vendeur||e.faitPar||e.auteur||e.vendeurPin||e.pin||'?';

 if(type==='synthese_avec_benef'){
   let ca=vPeriode.reduce((s,v)=>s+(parseFloat(v.total||0)||0),0);
   let benef=vPeriode.reduce((s,v)=>s+(parseFloat(v.benefice||0)||0),0);
   let dep=dPeriode.reduce((s,d)=>s+(parseFloat(d.montant||0)||0),0);
   let parArticle={};
   vPeriode.forEach(v=>(v.items||[]).forEach(i=>{
     let code=i.CODE||i.code; if(!code) return;
     if(codeFiltre &&!code.toLowerCase().includes(codeFiltre) &&!(i.Designation||'').toLowerCase().includes(codeFiltre)) return;
     if(!parArticle[code])parArticle[code]={CODE:code,Des:i.Designation||stockMap[code]?.Designation||code,qty:0,ca:0,benef:0,stockActuel:stockMap[code]?.Quantite||0};
     let pa=stockMap[code]?.['Prix Achat']||0;
     parArticle[code].qty+=parseFloat(i.qty||0)||0;
     parArticle[code].ca+= (parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0);
     parArticle[code].benef+= (parseFloat(i.qty||0)||0)*(parseFloat(i.Prix||0)-pa);
   }));
   let list=Object.values(parArticle).sort((a,b)=>b.ca-a.ca);
   html=`<h3>⭐ SYNTHESE AVEC BENEFICE + STOCK - ${list.length} articles</h3>
   <table><tr><th>Indicateur</th><th>Montant</th></tr><tr><td>CA</td><td><b>${ca.toLocaleString()} FC</b></td></tr><tr><td>Bénéf</td><td style="color:#0b5e2f"><b>${benef.toLocaleString()}</b></td></tr><tr><td>Dép</td><td style="color:red">-${dep.toLocaleString()}</td></tr><tr style="background:#111;color:#fff"><td>NET</td><td><b>${(benef-dep).toLocaleString()}</b></td></tr></table>
   <table><tr><th>CODE</th><th>Dés</th><th>Qté</th><th>CA</th><th>Bénéf</th><th>Marge</th><th>Stock</th><th>Rot</th><th>Jours</th></tr>`+
   list.map(a=>{let rot=a.stockActuel>0?(a.qty/((a.stockActuel+a.qty)/2||1))*100:0; let couv=a.qty>0?(a.stockActuel/(a.qty/nbJours)):999; return `<tr><td>${escFn(a.CODE)}</td><td>${escFn(a.Des)}</td><td>${a.qty}</td><td>${a.ca.toLocaleString()}</td><td style="color:#0b5e2f">${a.benef.toLocaleString()}</td><td>${a.ca?((a.benef/a.ca)*100).toFixed(1):0}%</td><td style="background:#fef3c7;text-align:center"><b>${a.stockActuel}</b></td><td>${rot.toFixed(1)}%</td><td>${couv>365?'∞':couv.toFixed(0)+'j'}</td></tr>`;}).join('')+`</table>`;

 } else if(type==='synthese_sans_benef'){
   let ca=vPeriode.reduce((s,v)=>s+(parseFloat(v.total||0)||0),0);
   let map={}; vPeriode.forEach(v=>(v.items||[]).forEach(i=>{let code=i.CODE||i.code; if(!map[code])map[code]={CODE:code,Des:i.Designation||stockMap[code]?.Designation||code,qty:0,ca:0,stock:stockMap[code]?.Quantite||0}; map[code].qty+=parseFloat(i.qty||0)||0; map[code].ca+= (parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0);} ));
   let list=Object.values(map).sort((a,b)=>b.ca-a.ca).filter(a=>!codeFiltre||a.CODE.toLowerCase().includes(codeFiltre));
   html=`<h3>⭐ SYNTHESE SANS BENEFICE - CA ${ca.toLocaleString()} FC</h3><table><tr><th>CODE</th><th>Dés</th><th>Qté</th><th>CA</th><th>Stock</th></tr>`+list.map(a=>`<tr><td>${escFn(a.CODE)}</td><td>${escFn(a.Des)}</td><td>${a.qty}</td><td>${a.ca.toLocaleString()}</td><td style="background:#fef3c7;text-align:center">${a.stock}</td></tr>`).join('')+`</table>`;

 } else if(type==='synthese_achats' || type==='synthese_des_achats'){
   let all=[]; let src=(SHOP==='ALL')?SHOPS_LIST:[SHOP]; src.forEach(s=>{(ALL_DATA[s]?.entrees||[]).forEach(e=>{let d=new Date(e.date); if(d>=du&&d<=au){if(codeFiltre&&!(e.CODE||'').toLowerCase().includes(codeFiltre))return; all.push({...e,_shopReel:s});}});});
   let map={}; all.forEach(e=>{let q=Number(e.qty??e.qte??e.Quantite??0); let st=stockMap[e.CODE]; if(!map[e.CODE])map[e.CODE]={CODE:e.CODE,Des:e.Designation||st?.Designation||e.CODE,qty:0,stock:st?.Quantite||0,auteurs:new Set()}; map[e.CODE].qty+=q; map[e.CODE].auteurs.add(getAuteur(e));});
   let list=Object.values(map).sort((a,b)=>b.qty-a.qty);
   html=`<h3>🛒 SYNTHESE ACHATS / ENTREES + STOCK ACTUEL - ${list.length} refs</h3><table><tr><th>CODE</th><th>Dés</th><th>Qté entrée</th><th>Stock</th><th>Auteurs</th></tr>`+list.map(a=>`<tr><td><b>${escFn(a.CODE)}</b></td><td>${escFn(a.Des)}</td><td style="background:#dcfce7;text-align:center"><b>${a.qty}</b></td><td style="background:#fef3c7;text-align:center">${a.stock}</td><td>${escFn(Array.from(a.auteurs).join(', '))}</td></tr>`).join('')+`</table>`;

 } else if(type==='synthese' || type==='synthese_generale'){
   let ca=vPeriode.reduce((s,v)=>s+(parseFloat(v.total||0)||0),0); let benef=vPeriode.reduce((s,v)=>s+(parseFloat(v.benefice||0)||0),0); let dep=dPeriode.reduce((s,d)=>s+(parseFloat(d.montant||0)||0),0);
   let byShop={}; vPeriode.forEach(v=>{let sh=v._shop||v._shopReel||SHOP; byShop[sh]=(byShop[sh]||0)+ (parseFloat(v.total||0)||0);});
   html=`<h3>⭐ SYNTHESE GENERALE - ${du.toLocaleDateString()} au ${au.toLocaleDateString()}</h3><table><tr><th>Indicateur</th><th>Montant</th></tr><tr><td>CA</td><td>${ca.toLocaleString()}</td></tr><tr><td>Bénéf Brut</td><td>${benef.toLocaleString()}</td></tr><tr><td>Dép</td><td>-${dep.toLocaleString()}</td></tr><tr style="background:#111;color:#fff"><td>NET</td><td>${(benef-dep).toLocaleString()}</td></tr></table><h4>Par Boutique</h4><table><tr><th>Boutique</th><th>CA</th></tr>`+Object.entries(byShop).map(([s,c])=>`<tr><td>${escFn(s)}</td><td>${c.toLocaleString()}</td></tr>`).join('')+`</table>`;

 } else if(type==='synthese_ventes_vendeur' || type==='ventes_vendeur_detail'){
   let byV={}; vPeriode.forEach(v=>{let k=v.vendeurNom||v.vendeur||'?'; if(codeFiltre&&!k.toLowerCase().includes(codeFiltre))return; if(!byV[k])byV[k]={ca:0,benef:0,nb:0}; byV[k].ca+=parseFloat(v.total||0)||0; byV[k].benef+=parseFloat(v.benefice||0)||0; byV[k].nb++;});
   html=`<h3>⭐ VENTES VENDEUR DETAIL + STOCK</h3><table><tr><th>Vendeur</th><th>Nb</th><th>CA</th><th>Bénéf</th></tr>`+Object.entries(byV).sort((a,b)=>b[1].ca-a[1].ca).map(([k,v])=>`<tr><td>${escFn(k)}</td><td>${v.nb}</td><td>${v.ca.toLocaleString()}</td><td style="color:#0b5e2f">${v.benef.toLocaleString()}</td></tr>`).join('')+`</table>`;

 } else if(type==='synthese_ventes_patron' || type==='ventes_patron_toutes'){
   html=`<h3>⭐ VENTES PATRON TOUTES BOUTIQUES</h3>`; SHOPS_LIST.forEach(s=>{let vs=(ALL_DATA[s]?.ventes||[]).filter(v=>{let d=new Date(v.date);return d>=du&&d<=au;}); let ca=vs.reduce((a,b)=>a+(parseFloat(b.total||0)||0),0); html+=`<p><b>${escFn(s)}</b>: ${vs.length} ventes - ${ca.toLocaleString()} FC</p>`;}); html+=`<table><tr><th>Date</th><th>Boutique</th><th>Vendeur</th><th>Total</th></tr>`+vPeriode.slice(0,300).map(v=>`<tr><td>${new Date(v.date).toLocaleString()}</td><td>${escFn(v._shop||SHOP)}</td><td>${escFn(v.vendeurNom||'')}</td><td>${(parseFloat(v.total||0)||0).toLocaleString()}</td></tr>`).join('')+`</table>`;

 } else if(type==='synthese_entrees' || type==='entrees_stock_detail'){
   let all=[]; let src=(SHOP==='ALL')?SHOPS_LIST:[SHOP]; src.forEach(s=>{(ALL_DATA[s]?.entrees||[]).forEach(e=>{let d=new Date(e.date); if(d>=du&&d<=au) all.push({...e,_shopReel:s});});}); all.sort((a,b)=>new Date(b.date)-new Date(a.date)); if(codeFiltre) all=all.filter(e=>e.CODE?.toLowerCase().includes(codeFiltre));
   html=`<h3>📥 ENTREES STOCK DETAIL - ${all.length} mouv.</h3><table><tr><th>Date</th><th>Boutique</th><th>CODE</th><th>Qté</th><th>Auteur</th><th>Stock</th></tr>`+all.slice(0,500).map(e=>{let st=stockMap[e.CODE]; let raw=getAuteur(e); let nom=raw; if(/^\d{2,6}$/.test(String(raw))){let vd=ALL_DATA[e._shopReel]?.vendeurs?.[raw]||ALL_DATA[SHOP]?.vendeurs?.[raw]; if(vd?.nom) nom=vd.nom+' ('+raw+')';} return `<tr><td>${new Date(e.date).toLocaleString('fr-FR')}</td><td style="background:#fef3c7"><b>${escFn(e._shopReel)}</b></td><td><b>${escFn(e.CODE||'')}</b></td><td style="background:#dcfce7;text-align:center"><b>${Number(e.qty??e.qte??e.Quantite??0)}</b></td><td style="background:#f0fdf4"><b style="color:#0b5e2f">${escFn(nom||'?')}</b></td><td>${st?.Quantite??''}</td></tr>`;}).join('')+`</table>`;

 } else if(type==='synthese_depenses' || type==='depense_type' || type==='depenses'){
   let map={}; dPeriode.forEach(d=>{let k=d.type||d.categorie||d.motif||'Autre'; if(!map[k])map[k]=0; map[k]+=parseFloat(d.montant||0)||0;}); let total=dPeriode.reduce((s,d)=>s+(parseFloat(d.montant||0)||0),0);
   html=`<h3>💸 DEPENSES - ${total.toLocaleString()} FC</h3><table><tr><th>Type</th><th>Montant</th><th>%</th></tr>`+Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td>${escFn(k)}</td><td>${v.toLocaleString()}</td><td>${total?((v/total)*100).toFixed(1):0}%</td></tr>`).join('')+`</table>`;

 } else if(type==='synthese_caisse' || type==='caisse_detail' || type==='caisse_journaliere'){
   let caisse=data.vers||[]; let filt=caisse.filter(c=>{let d=new Date(c.date);return d>=du&&d<=au;}); let encaisse=vPeriode.reduce((s,v)=>s+(parseFloat(v.payé||v.paye||v.total||0)||0),0); let dep=dPeriode.reduce((s,d)=>s+(parseFloat(d.montant||0)||0),0); let verse=filt.filter(c=>(c.type||'').toLowerCase().includes('vers')).reduce((s,c)=>s+(parseFloat(c.montant||0)||0),0);
   html=`<h3>💰 CAISSE JOURNALIERE - ENCAISSE / DEP / VERSE / ECART</h3><table><tr><th>Indicateur</th><th>Montant</th></tr><tr><td>Encaissé</td><td style="background:#dcfce7">${encaisse.toLocaleString()}</td></tr><tr><td>Dépenses</td><td style="background:#fee">${dep.toLocaleString()}</td></tr><tr><td>Versé Banque</td><td>${verse.toLocaleString()}</td></tr><tr style="background:#111;color:#fff"><td>ECART</td><td><b>${(encaisse-dep-verse).toLocaleString()}</b></td></tr></table>`;

 } else if(type==='ca_periode' || type==='ca_par_jour'){
   let byDay={}; vPeriode.forEach(v=>{let day=new Date(v.date).toLocaleDateString('fr-FR'); if(!byDay[day])byDay[day]={ca:0,benef:0,nb:0}; byDay[day].ca+=parseFloat(v.total||0)||0; byDay[day].benef+=parseFloat(v.benefice||0)||0; byDay[day].nb++;});
   html=`<h3>📅 CA PAR JOUR</h3><table><tr><th>Date</th><th>Nb</th><th>CA</th><th>Bénéf</th></tr>`+Object.entries(byDay).map(([d,v])=>`<tr><td>${d}</td><td>${v.nb}</td><td><b>${v.ca.toLocaleString()}</b></td><td style="color:#0b5e2f">${v.benef.toLocaleString()}</td></tr>`).join('')+`</table>`;

 } else if(type==='vente_article' || type==='vente_par_article'){
   let all=[]; vPeriode.forEach(v=>(v.items||[]).forEach(i=>{let code=i.CODE||i.code; if(!code) return; if(codeFiltre&&!code.toLowerCase().includes(codeFiltre)&&!(i.Designation||'').toLowerCase().includes(codeFiltre))return; all.push({date:v.date,vendeur:v.vendeurNom||v.vendeur,CODE:code,Des:i.Designation||stockMap[code]?.Designation||code,qty:i.qty,Prix:i.Prix,Total:(parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0),Benef:(parseFloat(i.qty||0)||0)*(parseFloat(i.Prix||0)-(stockMap[code]?.['Prix Achat']||0)),stock:stockMap[code]?.Quantite||0});}));
   html=`<h3>📦 VENTE PAR ARTICLE + STOCK - ${all.length} lignes</h3><table><tr><th>Date</th><th>Vendeur</th><th>CODE</th><th>Qté</th><th>Total</th><th>Bénéf</th><th>Stock</th></tr>`+all.slice(0,400).map(r=>`<tr><td>${new Date(r.date).toLocaleString()}</td><td>${escFn(r.vendeur)}</td><td><b>${escFn(r.CODE)}</b></td><td>${r.qty}</td><td>${r.Total.toLocaleString()}</td><td style="color:${r.Benef<0?'red':'#0b5e2f'}">${r.Benef.toLocaleString()}</td><td style="background:#fef3c7;text-align:center">${r.stock}</td></tr>`).join('')+`</table>`;

 } else if(type==='entree_article' || type==='entree_par_article'){
   let all=[]; let src=(SHOP==='ALL')?SHOPS_LIST:[SHOP]; src.forEach(s=>{(ALL_DATA[s]?.entrees||[]).forEach(e=>{let d=new Date(e.date); if(d>=du&&d<=au){if(codeFiltre&&!(e.CODE||'').toLowerCase().includes(codeFiltre))return; all.push({...e,_shopReel:s});}});}); all.sort((a,b)=>new Date(b.date)-new Date(a.date));
   html=`<h3>📦 ENTREE PAR ARTICLE + STOCK - ${all.length} lignes</h3><table><tr><th>Date</th><th>Boutique</th><th>CODE</th><th>Qté</th><th>Auteur</th><th>Stock</th></tr>`+all.slice(0,400).map(e=>`<tr><td>${new Date(e.date).toLocaleString()}</td><td>${escFn(e._shopReel)}</td><td><b>${escFn(e.CODE)}</b></td><td style="background:#dcfce7;text-align:center"><b>${Number(e.qty??e.qte??0)}</b></td><td>${escFn(getAuteur(e))}</td><td>${stockMap[e.CODE]?.Quantite||''}</td></tr>`).join('')+`</table>`;

 } else if(type==='top'){
   let map={}; vPeriode.forEach(v=>(v.items||[]).forEach(i=>{let code=i.CODE||i.code; if(!map[code])map[code]={CODE:code,Des:i.Designation||stockMap[code]?.Designation||code,qty:0,ca:0,stock:stockMap[code]?.Quantite||0}; map[code].qty+=parseFloat(i.qty||0)||0; map[code].ca+= (parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0);})); let top=Object.values(map).sort((a,b)=>b.qty-a.qty).slice(0,20);
   html=`<h3>🏆 TOP 20 + STOCK ACTUEL</h3><table><tr><th>#</th><th>CODE</th><th>Dés</th><th>Qté</th><th>CA</th><th>Stock</th></tr>`+top.map((t,i)=>`<tr><td>${i+1}</td><td><b>${escFn(t.CODE)}</b></td><td>${escFn(t.Des)}</td><td><b>${t.qty}</b></td><td>${t.ca.toLocaleString()}</td><td style="background:#fef3c7;text-align:center">${t.stock}</td></tr>`).join('')+`</table>`;

 } else if(type==='invendu' || type==='invendus'){
   let vendus=new Set(); vPeriode.forEach(v=>(v.items||[]).forEach(i=>vendus.add(i.CODE||i.code))); let inv=data.stock.filter(p=>!vendus.has(p.CODE));
   html=`<h3>💤 INVENDUS + STOCK - ${inv.length} refs</h3><table><tr><th>CODE</th><th>Dés</th><th>Stock</th><th>PA</th><th>Valeur bloquée</th></tr>`+inv.slice(0,300).map(p=>{let val=(p.Quantite||0)*(p['Prix Achat']||0); return `<tr><td>${escFn(p.CODE)}</td><td>${escFn(p.Designation)}</td><td style="background:#fee;text-align:center"><b>${p.Quantite}</b></td><td>${(p['Prix Achat']||0).toLocaleString()}</td><td style="color:red"><b>${val.toLocaleString()}</b></td></tr>`;}).join('')+`</table>`;

 } else if(type==='ca_client'){
   let byC={}; vPeriode.forEach(v=>{let k=v.client||v.clientNom||'Inconnu'; if(codeFiltre&&!k.toLowerCase().includes(codeFiltre))return; if(!byC[k])byC[k]={ca:0,nb:0}; byC[k].ca+=parseFloat(v.total||0)||0; byC[k].nb++;});
   html=`<h3>👤 CA PAR CLIENT</h3><table><tr><th>Client</th><th>Nb</th><th>CA</th></tr>`+Object.entries(byC).sort((a,b)=>b[1].ca-a[1].ca).slice(0,200).map(([k,v])=>`<tr><td>${escFn(k)}</td><td>${v.nb}</td><td>${v.ca.toLocaleString()}</td></tr>`).join('')+`</table>`;

 } else if(type==='dettes'){
   let dettes=vPeriode.filter(v=>parseFloat(v.reste||0)>0); let total=dettes.reduce((s,v)=>s+(parseFloat(v.reste||0)||0),0);
   html=`<h3>💳 DETTES - ${total.toLocaleString()} FC - ${dettes.length} clients</h3><table><tr><th>Date</th><th>Client</th><th>Tél</th><th>Total</th><th>Payé</th><th>Reste</th></tr>`+dettes.slice(0,300).map(v=>`<tr><td>${new Date(v.date).toLocaleString()}</td><td>${escFn(v.client||'')}</td><td>${escFn(v.tel||'')}</td><td>${(parseFloat(v.total||0)||0).toLocaleString()}</td><td>${(parseFloat(v.payé||v.paye||0)||0).toLocaleString()}</td><td style="color:red"><b>${(parseFloat(v.reste||0)||0).toLocaleString()}</b></td></tr>`).join('')+`</table>`;

 } else if(type==='benef_par_vendeur'){
   let byV={}; let pertes=[]; vPeriode.forEach(v=>(v.items||[]).forEach(i=>{let vendeur=v.vendeurNom||v.vendeur||'?'; if(codeFiltre&&!vendeur.toLowerCase().includes(codeFiltre))return; let pa=stockMap[i.CODE||i.code]?.['Prix Achat']||0; let benefUnit=parseFloat(i.Prix||0)-pa; let benefTot=benefUnit*(parseFloat(i.qty||0)||0); if(!byV[vendeur])byV[vendeur]={ca:0,benef:0,nb:0}; byV[vendeur].ca+= (parseFloat(i.qty||0)||0)*parseFloat(i.Prix||0); byV[vendeur].benef+=benefTot; byV[vendeur].nb+=parseFloat(i.qty||0)||0; if(benefUnit<0) pertes.push({date:v.date,vendeur,CODE:i.CODE||i.code,Prix:i.Prix,PA:pa,Perte:benefUnit}); }));
   html=`<h3>👥 BENEF PAR VENDEUR + VENTES A PERTE</h3><table><tr><th>Vendeur</th><th>Qté</th><th>CA</th><th>Bénéf</th><th>Marge</th></tr>`+Object.entries(byV).sort((a,b)=>b[1].benef-a[1].benef).map(([k,v])=>`<tr><td>${escFn(k)}</td><td>${v.nb}</td><td>${v.ca.toLocaleString()}</td><td style="color:${v.benef<0?'red':'#0b5e2f'}"><b>${v.benef.toLocaleString()}</b></td><td>${v.ca?((v.benef/v.ca)*100).toFixed(1):0}%</td></tr>`).join('')+`</table><h4 style="color:red">⚠️ Ventes à perte (${pertes.length})</h4><table><tr><th>Date</th><th>Vendeur</th><th>CODE</th><th>Prix</th><th>PA</th><th>Perte</th></tr>`+pertes.slice(0,100).map(p=>`<tr><td>${new Date(p.date).toLocaleString()}</td><td>${escFn(p.vendeur)}</td><td><b>${escFn(p.CODE)}</b></td><td>${(parseFloat(p.Prix)||0).toLocaleString()}</td><td>${(parseFloat(p.PA)||0).toLocaleString()}</td><td style="color:red"><b>${p.Perte.toLocaleString()}</b></td></tr>`).join('')+`</table>`;

 } else {
   let ca=vPeriode.reduce((s,v)=>s+(parseFloat(v.total||0)||0),0); let benef=vPeriode.reduce((s,v)=>s+(parseFloat(v.benefice||0)||0),0);
   html=`<h3>RAPPORT ${escFn(type)} - ${ca.toLocaleString()} FC - Bénéf ${benef.toLocaleString()} FC - ${vPeriode.length} ventes</h3><table><tr><th>Date</th><th>Vendeur</th><th>Total</th></tr>`+vPeriode.slice(0,200).map(v=>`<tr><td>${new Date(v.date).toLocaleString()}</td><td>${escFn(v.vendeurNom||'')}</td><td>${(parseFloat(v.total||0)||0).toLocaleString()}</td></tr>`).join('')+`</table>`;
 }

 let rc=document.getElementById('rapportC');
 if(rc) rc.innerHTML=html;
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
console.log("✅ rapport.js FULL 19 RAPPORTS SAFE FIX 48-50 chargé");
