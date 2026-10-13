// VERSION SAFE - ne bloque pas le SYNC - utilise window.db / window.STATE
export function calcCompta(){
 try{
 let duEl=document.getElementById('cDu'), auEl=document.getElementById('cAu');
 if(!duEl||!auEl){ console.log("cDu/cAu manquant"); return; }
 let du=new Date(duEl.value), au=new Date(auEl.value);
 au.setHours(23,59,59);
 if(isNaN(du)||isNaN(au)){
   let r=document.getElementById('comptaResult');
   if(r) r.innerHTML='<p style="color:red">Choisis dates Du/Au</p>';
   return;
 }
 let data=window.getFiltered?window.getFiltered():{ventes:[],dep:[],stock:[]};
 if(!data.ventes||data.ventes.length===0){
   console.log("⚠️ data.ventes vide, getFiltered pas prêt", data);
 }
 let fullMap={}; (data.stock||[]).forEach(p=>{let c=p.CODE||p.code; if(c) fullMap[c]=p;});

 let base=parseFloat(document.getElementById('cBase')?.value||50000);
 let comPct=parseFloat(document.getElementById('cCom')?.value||10);
 let loyer=parseFloat(document.getElementById('cLoyer')?.value||100000);
 let fixe=parseFloat(document.getElementById('cAutresFixe')?.value||0);
 let emprunt=parseFloat(document.getElementById('cEmprunt')?.value||0);
 let primePct=parseFloat(document.getElementById('cPrime')?.value||25);
 let patronPct=parseFloat(document.getElementById('cPatron')?.value||45);
 let devPct=parseFloat(document.getElementById('cDev')?.value||30);

 let CURRENT = window.CURRENT_CONFIG||{compta:{exclus:[]}};
 let exclus = CURRENT.compta?.exclus||[];
 let vPeriode=data.ventes.filter(v=>{let d=new Date(v.date);return d>=du&&d<=au;});
 let depPeriode=data.dep.filter(d=>{let dt=new Date(d.date);return dt>=du&&dt<=au;});

 let parVendeur={};
 vPeriode.forEach(v=>{
   let nomRaw=(v.vendeurNom||v.vendeur||'Inconnu').trim();
   if(!nomRaw||nomRaw.toLowerCase()==='comptoir') return;
   let key=nomRaw.toLowerCase().replace(/\s+/g,'').replace(/[^a-z]/g,'');
   if(!key) key=nomRaw.toLowerCase();
   if(exclus.includes(key)) return;
   if(!parVendeur[key]) parVendeur[key]={key,nom:nomRaw,qty:0,ca:0,benefBrut:0,commission:0,salaire:0};
   (v.items||[]).forEach(i=>{
     let pa=fullMap[i.CODE]?.['Prix Achat']||0;
     parVendeur[key].qty+=parseFloat(i.qty||0);
     parVendeur[key].ca+=parseFloat(i.qty||0)*parseFloat(i.Prix||0);
     parVendeur[key].benefBrut+=parseFloat(i.qty||0)*(parseFloat(i.Prix||0)-pa);
   });
 });

 let vals=Object.values(parVendeur);
 vals.forEach(v=>{v.commission=v.benefBrut*(comPct/100); v.salaire=base+v.commission;});

 let totalCA=vPeriode.reduce((s,v)=>s+(parseFloat(v.total||0)),0);
 let totalBenefBrut=vals.reduce((s,v)=>s+v.benefBrut,0)||vPeriode.reduce((s,v)=>s+(parseFloat(v.benefice||0)),0);
 let totalCom=vals.reduce((s,v)=>s+v.commission,0);
 let totalBase=vals.length*base;
 let totalDep=depPeriode.reduce((s,d)=>s+(parseFloat(d.montant||0)),0);
 let totalChargesFixes=loyer+autreFixe+emprunt+totalBase;
 let chargesPourSeuil=totalChargesFixes+totalDep+totalCom;
 let resultatNet=totalBenefBrut-totalDep-totalChargesFixes-totalCom;
 let repart=resultatNet>0?resultatNet:0;
 let margePct=totalCA? (totalBenefBrut/totalCA)*100 : 0;
 let seuilRentabilite=margePct? chargesPourSeuil/(margePct/100) : 0;
 let nbJours=Math.max(1,Math.ceil((au-du)/86400000)+1);
 let seuilParJour=seuilRentabilite/nbJours;

 // POINT JOURNALIER
 let byDay={};
 vPeriode.forEach(v=>{
   let day=new Date(v.date).toLocaleDateString('fr-FR');
   if(!byDay[day]) byDay[day]={day,ca:0,benef:0,nb:0,dep:0};
   byDay[day].ca+=parseFloat(v.total||0); byDay[day].benef+=parseFloat(v.benefice||0); byDay[day].nb++;
 });
 depPeriode.forEach(d=>{
   let day=new Date(d.date).toLocaleDateString('fr-FR');
   if(!byDay[day]) byDay[day]={day,ca:0,benef:0,nb:0,dep:0};
   byDay[day].dep+=parseFloat(d.montant||0);
 });
 let pointJ=`<h4>📅 Point Journalier</h4><table><tr><th>Jour</th><th>Nb</th><th>CA</th><th>Bénéf</th><th>Dép</th><th>Net</th></tr>`+
   Object.values(byDay).map(d=>`<tr><td>${d.day}</td><td>${d.nb}</td><td>${d.ca.toLocaleString()}</td><td>${d.benef.toLocaleString()}</td><td>${d.dep.toLocaleString()}</td><td>${(d.benef-d.dep).toLocaleString()}</td></tr>`).join('')+`</table>`;

 // RENDU
 let cr=document.getElementById('comptaResult');
 if(cr){
   cr.innerHTML=`<div class="card">CA: <b>${totalCA.toLocaleString()}</b> | Bénéf Brut: <b style="color:green">${totalBenefBrut.toLocaleString()}</b> | Dép: ${totalDep.toLocaleString()} | NET: <b style="color:${resultatNet>=0?'green':'red'}">${resultatNet.toLocaleString()}</b><br>Seuil Total: ${chargesPourSeuil.toLocaleString()} | Marge ${margePct.toFixed(1)}% | Objectif/jour: <b style="color:#dc2626">${seuilParJour.toLocaleString()} FC</b></div>`;
 }

 let pj=document.getElementById('pointJournalier'); if(pj) pj.innerHTML=pointJ;
 let tb=document.getElementById('tresorerieBox'); if(tb) tb.innerHTML=`<div style="background:#dcfce7;padding:10px">Encaissé: <b>${vPeriode.reduce((s,v)=>s+(parseFloat(v.montantPaye??v.total)||0),0).toLocaleString()}</b> | Charges: ${chargesPourSeuil.toLocaleString()} | NET: <b>${resultatNet.toLocaleString()}</b></div>`;
 let sb=document.getElementById('seuilBox'); if(sb) sb.innerHTML=`<div style="background:#fffbeb;padding:10px">Objectif/jour: <b style="font-size:18px;color:#dc2626">${seuilParJour.toLocaleString()} FC</b><br>Seuil ${seuilRentabilite.toLocaleString()} vs CA ${totalCA.toLocaleString()}</div>`;
 let comp=document.getElementById('compteResultat'); if(comp) comp.innerHTML=`<table><tr><th>Poste</th><th>Montant</th></tr><tr><td>CA</td><td>${totalCA.toLocaleString()}</td></tr><tr><td>NET</td><td><b>${resultatNet.toLocaleString()}</b></td></tr></table>`;

 }catch(e){
   console.error("calcCompta error", e);
   let r=document.getElementById('comptaResult');
   if(r) r.innerHTML='<p style="color:red">Erreur compta: '+e.message+'</p>';
 }
}

export function loadComptaParams(){
 try{
 let c=window.CURRENT_CONFIG?.compta||{base:50000,comPct:10,loyer:100000,autreFixe:0,emprunt:0,primePct:25,patronPct:45,devPct:30};
 if(document.getElementById('cBase')) document.getElementById('cBase').value=c.base;
 if(document.getElementById('cCom')) document.getElementById('cCom').value=c.comPct;
 if(document.getElementById('cLoyer')) document.getElementById('cLoyer').value=c.loyer;
 if(document.getElementById('cAutresFixe')) document.getElementById('cAutresFixe').value=c.autreFixe||0;
 if(document.getElementById('cEmprunt')) document.getElementById('cEmprunt').value=c.emprunt||0;
 if(document.getElementById('cPrime')) document.getElementById('cPrime').value=c.primePct;
 if(document.getElementById('cPatron')) document.getElementById('cPatron').value=c.patronPct;
 if(document.getElementById('cDev')) document.getElementById('cDev').value=c.devPct;
 }catch(e){console.log(e)}
}
export function saveComptaParams(){
 let old=window.CURRENT_CONFIG?.compta||{exclus:[]};
 let comp={base:parseFloat(document.getElementById('cBase').value)||50000,comPct:parseFloat(document.getElementById('cCom').value)||10,loyer:parseFloat(document.getElementById('cLoyer').value)||0,autreFixe:parseFloat(document.getElementById('cAutresFixe').value)||0,emprunt:parseFloat(document.getElementById('cEmprunt')?.value)||0,primePct:parseFloat(document.getElementById('cPrime').value)||25,patronPct:parseFloat(document.getElementById('cPatron').value)||45,devPct:parseFloat(document.getElementById('cDev').value)||30,exclus:old.exclus||[]};
 window.CURRENT_CONFIG.compta=comp;
 let target=(window.SHOP||'Menkao1'); if(target==='ALL') target='Menkao1';
 if(window.db) window.db.ref('shops/'+target+'/config_entreprise/compta').set(comp).then(()=>{
   let s=document.getElementById('comptaParamStatus'); if(s) s.innerText='✅ Sauvé';
 });
}
export function setPeriode(t){
 let n=new Date();
 if(t==='mois'){document.getElementById('cDu').valueAsDate=new Date(n.getFullYear(),n.getMonth(),1);document.getElementById('cAu').valueAsDate=n;}
 else if(t==='moisPasse'){document.getElementById('cDu').valueAsDate=new Date(n.getFullYear(),n.getMonth()-1,1);document.getElementById('cAu').valueAsDate=new Date(n.getFullYear(),n.getMonth(),0);}
 else if(t==='aujourdhui'){document.getElementById('cDu').valueAsDate=n;document.getElementById('cAu').valueAsDate=n;}
 calcCompta();
}
export function toggleExclusCompta(key){
 let comp=window.CURRENT_CONFIG.compta||{exclus:[]};
 if(!comp.exclus) comp.exclus=[];
 let idx=comp.exclus.indexOf(key);
 if(idx>=0) comp.exclus.splice(idx,1); else comp.exclus.push(key);
 window.CURRENT_CONFIG.compta=comp;
 let target=(window.SHOP||'Menkao1'); if(target==='ALL') target='Menkao1';
 if(window.db) window.db.ref('shops/'+target+'/config_entreprise/compta').set(comp).then(()=>calcCompta());
}

window.calcCompta=calcCompta;
window.loadComptaParams=loadComptaParams;
window.saveComptaParams=saveComptaParams;
window.setPeriode=setPeriode;
window.toggleExclusCompta=toggleExclusCompta;
console.log("✅ compta.js SAFE chargé - ne bloque plus SYNC");
