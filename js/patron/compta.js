import { STATE } from '../core/state.js';
import { db } from '../core/firebase.js';

// --- FIDÈLE V4.9.10 EXACT EXTRAIT DE PANTRON.TXT ---
export function calcCompta(){
 let duEl=document.getElementById('cDu'), auEl=document.getElementById('cAu');
 let du=new Date(duEl.value), au=new Date(auEl.value);
 au.setHours(23,59,59);
 if(isNaN(du)||isNaN(au)){
   document.getElementById('comptaResult').innerHTML='<p style="color:red">Choisis dates Du/Au</p>';
   return;
 }
 let data=window.getFiltered?window.getFiltered():{ventes:[],dep:[],stock:[]};
 let fullMap={}; (data.stock||[]).forEach(p=>{fullMap[p.CODE||p.code]=p;});

 let base=parseFloat(document.getElementById('cBase').value)||0,
     comPct=parseFloat(document.getElementById('cCom').value)||0,
     loyer=parseFloat(document.getElementById('cLoyer').value)||0,
     autreFixe=parseFloat(document.getElementById('cAutresFixe').value)||0,
     emprunt=parseFloat(document.getElementById('cEmprunt')?.value)||0,
     primePct=parseFloat(document.getElementById('cPrime').value)||25,
     patronPct=parseFloat(document.getElementById('cPatron').value)||45,
     devPct=parseFloat(document.getElementById('cDev').value)||30;

 let exclus = window.CURRENT_CONFIG?.compta?.exclus || STATE.CURRENT_CONFIG?.compta?.exclus || [];
 let vPeriode=data.ventes.filter(v=>{let d=new Date(v.date);return d>=du&&d<=au;});
 let depPeriode=data.dep.filter(d=>{let dt=new Date(d.date);return dt>=du&&dt<=au;});

 let parVendeur={};
 vPeriode.forEach(v=>{
   let nomRaw=(v.vendeurNom||v.vendeur||'Inconnu').trim();
   if(!nomRaw||nomRaw.toLowerCase()==='comptoir') return;
   let key=nomRaw.toLowerCase().replace(/\s+/g,'').replace(/[^a-z]/g,'');
   if(!key) key=nomRaw.toLowerCase();
   if(exclus.includes(key)) return;
   if(!parVendeur[key]) parVendeur[key]={key,nom:nomRaw,qty:0,ca:0,benefBrut:0,commission:0,salaire:0,countVentes:0};
   parVendeur[key].countVentes++;
   (v.items||[]).forEach(i=>{
     let pa=fullMap[i.CODE||i.code]?.['Prix Achat']||fullMap[i.CODE||i.code]?.pa||0;
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
 let meilleur=vals.sort((a,b)=>b.benefBrut-a.benefBrut)[0];
 let margePct=totalCA? (totalBenefBrut/totalCA)*100 : 0;
 let seuilRentabilite=margePct? chargesPourSeuil/(margePct/100) : 0;
 let nbJours=Math.max(1,Math.ceil((au-du)/86400000)+1);
 let seuilParJour=seuilRentabilite/nbJours;

 // --- POINT JOURNALIER ---
 let byDay={};
 vPeriode.forEach(v=>{
   let day=new Date(v.date).toLocaleDateString('fr-FR');
   if(!byDay[day]) byDay[day]={day,ca:0,benef:0,nb:0,dep:0};
   byDay[day].ca+=parseFloat(v.total||0);
   byDay[day].benef+=parseFloat(v.benefice||0);
   byDay[day].nb++;
 });
 depPeriode.forEach(d=>{
   let day=new Date(d.date).toLocaleDateString('fr-FR');
   if(!byDay[day]) byDay[day]={day,ca:0,benef:0,nb:0,dep:0};
   byDay[day].dep+=parseFloat(d.montant||0);
 });
 let pointJ=`<h4>📅 Point Journalier</h4><table><tr><th>Jour</th><th>Nb</th><th>CA</th><th>Bénéf</th><th>Dép</th><th>Net</th></tr>`+
   Object.values(byDay).sort((a,b)=>new Date(a.day.split('/').reverse().join('-'))-new Date(b.day.split('/').reverse().join('-')))
  .map(d=>`<tr><td>${d.day}</td><td>${d.nb}</td><td>${d.ca.toLocaleString()}</td><td>${d.benef.toLocaleString()}</td><td>${d.dep.toLocaleString()}</td><td style="color:${(d.benef-d.dep)>=0?'green':'red'}">${(d.benef-d.dep).toLocaleString()}</td></tr>`).join('')+`</table>`;

 let htmlSeuil=`<div class="card" style="border:3px solid #f59e0b;background:#fffbeb;padding:10px"><h4>📍 Seuil CORRIGÉ V4.9.10 - Base ${vals.length} x ${base.toLocaleString()} + Emprunt ${emprunt.toLocaleString()}</h4>
   <table><tr><th>Charge</th><th>Montant</th></tr>
   <tr><td>Loyer</td><td>${loyer.toLocaleString()}</td></tr>
   <tr><td>Autres Fixes</td><td>${autreFixe.toLocaleString()}</td></tr>
   <tr><td>🏦 Emprunt</td><td><b>${emprunt.toLocaleString()}</b></td></tr>
   <tr><td>👥 Bases (${vals.length} x ${base.toLocaleString()})</td><td><b>${totalBase.toLocaleString()}</b></td></tr>
   <tr><td>Dépenses</td><td>${totalDep.toLocaleString()}</td></tr>
   <tr><td>Commissions</td><td>${totalCom.toLocaleString()}</td></tr>
   <tr style="background:#111;color:#fff"><td>TOTAL</td><td><b>${chargesPourSeuil.toLocaleString()}</b></td></tr>
   <tr><td>Marge</td><td>${margePct.toFixed(1)}%</td></tr>
   <tr style="background:#dc2626;color:#fff"><td>🎯 OBJECTIF / JOUR</td><td><b style="font-size:20px">${seuilParJour.toLocaleString()} FC</b></td></tr>
   </table><p>Seuil ${seuilRentabilite.toLocaleString()} vs CA ${totalCA.toLocaleString()} ${totalCA>=seuilRentabilite?'✅ Rentable':'❌ Perte'}</p></div>`;

 let htmlSal=`<div class="card"><h4>👥 Salaires ${vals.length} vendeurs - Base totale ${totalBase.toLocaleString()} FC</h4><table><tr><th>Vendeur</th><th>CA</th><th>Bénéf</th><th>Salaire</th><th>Action</th></tr>${
   vals.map(v=>`<tr><td><b>${window.esc(v.nom)}</b></td><td>${v.ca.toLocaleString()}</td><td>${v.benefBrut.toLocaleString()}</td><td><b>${v.salaire.toLocaleString()}</b></td><td><button class="btn btn-r" style="width:auto;font-size:10px" onclick="window.toggleExclusCompta('${v.key}')">🚫 Exclure</button></td></tr>`).join('')||'<tr><td colspan=5>Aucun</td></tr>'}</table></div>`;

 let htmlRep=`<div class="card"><h4>💰 Répartition NET ${resultatNet.toLocaleString()} FC</h4><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><div style="background:#facc15;padding:12px;border-radius:12px;text-align:center">PRIME ${primePct}%<br><b>${(repart*(primePct/100)).toLocaleString()}</b><br>${meilleur?meilleur.nom:''}</div><div style="background:#0b5e2f;color:#fff;padding:12px;border-radius:12px;text-align:center">PATRON ${patronPct}%<br><b>${(repart*(patronPct/100)).toLocaleString()}</b></div><div style="background:#0ea5e9;color:#fff;padding:12px;border-radius:12px;text-align:center">DEV ${devPct}%<br><b>${(repart*(devPct/100)).toLocaleString()}</b></div></div></div>`;

 let totalEncaisse=vPeriode.reduce((s,v)=>s+(v.montantPaye!=null?parseFloat(v.montantPaye):parseFloat(v.total||0)),0);
 let crHtml=`<h4>📊 Compte Résultat</h4><table><tr><th>Poste</th><th>Montant</th></tr><tr><td>CA Firebase</td><td>${totalCA.toLocaleString()}</td></tr><tr><td>Marge</td><td>${totalBenefBrut.toLocaleString()} (${margePct.toFixed(1)}%)</td></tr><tr><td>- Dép</td><td>-${totalDep.toLocaleString()}</td></tr><tr><td>- Loyer+Fixes+Emprunt</td><td>-${(loyer+autreFixe+emprunt).toLocaleString()}</td></tr><tr><td>- Bases ${totalBase.toLocaleString()}</td><td>-${totalBase.toLocaleString()}</td></tr><tr><td>- Com</td><td>-${totalCom.toLocaleString()}</td></tr><tr style="background:#111;color:#fff"><td>= NET</td><td><b>${resultatNet.toLocaleString()}</b></td></tr></table>`;

 document.getElementById('comptaResult').innerHTML=htmlSal+htmlRep+htmlSeuil;
 let pj=document.getElementById('pointJournalier'); if(pj) pj.innerHTML=pointJ;
 let cr=document.getElementById('compteResultat'); if(cr) cr.innerHTML=crHtml;
 let tb=document.getElementById('tresorerieBox'); if(tb) tb.innerHTML=`<div style="background:#dcfce7;padding:10px;border-radius:10px">Encaissé: <b>${totalEncaisse.toLocaleString()}</b> | Charges: <b>${chargesPourSeuil.toLocaleString()}</b> | NET: <b style="color:${resultatNet>=0?'#0b5e2f':'red'}">${resultatNet.toLocaleString()}</b></div>`;
 let sb=document.getElementById('seuilBox'); if(sb) sb.innerHTML=`<div style="background:#fffbeb;padding:10px;border-radius:10px">Objectif/jour: <b style="font-size:18px;color:#dc2626">${seuilParJour.toLocaleString()} FC</b><br>Marge ${margePct.toFixed(1)}%<br>Seuil ${seuilRentabilite.toLocaleString()} vs CA ${totalCA.toLocaleString()} ${totalCA>=seuilRentabilite?'✅':'❌'}</div>`;
}

export function loadComptaParams(){
 let c=window.CURRENT_CONFIG?.compta||STATE.CURRENT_CONFIG?.compta||{base:50000,comPct:10,loyer:100000,autreFixe:0,emprunt:0,primePct:25,patronPct:45,devPct:30,exclus:[]};
 if(document.getElementById('cBase')) document.getElementById('cBase').value=c.base;
 if(document.getElementById('cCom')) document.getElementById('cCom').value=c.comPct;
 if(document.getElementById('cLoyer')) document.getElementById('cLoyer').value=c.loyer;
 if(document.getElementById('cAutresFixe')) document.getElementById('cAutresFixe').value=c.autreFixe||0;
 if(document.getElementById('cEmprunt')) document.getElementById('cEmprunt').value=c.emprunt||0;
 if(document.getElementById('cPrime')) document.getElementById('cPrime').value=c.primePct;
 if(document.getElementById('cPatron')) document.getElementById('cPatron').value=c.patronPct;
 if(document.getElementById('cDev')) document.getElementById('cDev').value=c.devPct;
}
export function saveComptaParams(){
 let old=window.CURRENT_CONFIG?.compta||STATE.CURRENT_CONFIG?.compta||{exclus:[]};
 let comp={base:parseFloat(document.getElementById('cBase').value)||50000,comPct:parseFloat(document.getElementById('cCom').value)||10,loyer:parseFloat(document.getElementById('cLoyer').value)||0,autreFixe:parseFloat(document.getElementById('cAutresFixe').value)||0,emprunt:parseFloat(document.getElementById('cEmprunt')?.value)||0,primePct:parseFloat(document.getElementById('cPrime').value)||25,patronPct:parseFloat(document.getElementById('cPatron').value)||45,devPct:parseFloat(document.getElementById('cDev').value)||30,exclus:old.exclus||[]};
 window.CURRENT_CONFIG.compta=comp; STATE.CURRENT_CONFIG.compta=comp;
 let target=STATE.SHOP==='ALL'?'Menkao1':STATE.SHOP;
 db.ref('shops/'+target+'/config_entreprise/compta').set(comp).then(()=>{
   document.getElementById('comptaParamStatus').innerText='✅ Sauvé V4.9.10 Firebase shops/'+target+'/config_entreprise/compta';
   window.savePatronCache?.();
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
 window.CURRENT_CONFIG.compta=comp; STATE.CURRENT_CONFIG.compta=comp;
 let target=STATE.SHOP==='ALL'?'Menkao1':STATE.SHOP;
 db.ref('shops/'+target+'/config_entreprise/compta').set(comp).then(()=>calcCompta());
}

window.calcCompta=calcCompta;
window.loadComptaParams=loadComptaParams;
window.saveComptaParams=saveComptaParams;
window.setPeriode=setPeriode;
window.toggleExclusCompta=toggleExclusCompta;
