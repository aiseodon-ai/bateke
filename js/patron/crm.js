import { esc } from "../common/utils.js";
export function renderCRM(){
  let data=getFiltered(); let q=(document.getElementById('searchCli')?.value||'').toLowerCase(); let map={};
  data.ventes.forEach(v=>{
    let nom=(v.client?.nom||'').trim(); let tel=(v.client?.tel||'').trim(); if(!nom&&!tel) return; if(nom==='Comptoir' && !tel) return;
    let key=tel?'tel_'+tel:'nom_'+nom.toLowerCase();
    if(!map[key]) map[key]={nom:nom||'Inconnu',tel:tel,nb:0,total:0,paye:0,dette:0,derniere:v.date,anniversaire:'',motifs:[]};
    let totalV=Number(v.total||0);
    let payeV=Number(v.paye ?? v.montantPaye ?? totalV);
    let resteV=Number(v.reste ?? v.Reste ?? Math.max(0, totalV - payeV));
    let annivV=v.client?.anniversaire || v.anniversaire || '';
    let motifV=v.remiseMotif || v.motif || '';
    map[key].nb++; map[key].total+=totalV; map[key].paye+=payeV; map[key].dette+=resteV; map[key].derniere=v.date;
    if(annivV) map[key].anniversaire=annivV;
    if(motifV && !map[key].motifs.includes(motifV)) map[key].motifs.push(motifV);
  });
  let list=Object.values(map).filter(c=>(c.nom||'').toLowerCase().includes(q)||(c.tel||'').includes(q)).sort((a,b)=>b.total-a.total);
  // Anniversaires du mois, en haut du CRM si tu as un div #annivMoisInfo, sinon ça ne plante pas
  let moisActuel=new Date().getMonth()+1;
  let annivMois=list.filter(c=> c.anniversaire && (new Date(c.anniversaire).getMonth()+1)===moisActuel);
  let infoEl=document.getElementById('annivMoisInfo');
  if(infoEl) infoEl.innerHTML= annivMois.length ? `🎂 ${annivMois.length} anniversaire(s) ce mois : ${annivMois.map(c=> esc(c.nom)+' ('+new Date(c.anniversaire).toLocaleDateString()+')').join(', ')}` : 'Aucun anniversaire ce mois';
  document.getElementById('crmList').innerHTML=list.map(c=>{
    let annivTxt=c.anniversaire ? `<br><small>🎂 ${new Date(c.anniversaire).toLocaleDateString()}</small>` : '';
    let motifTxt=c.motifs.length ? `<br><small>Motifs: ${esc(c.motifs.join(', '))}</small>` : '';
    return `<tr><td><b>${esc(c.nom)}</b>${annivTxt}</td><td>${esc(c.tel)}</td><td>${c.nb}</td><td>${c.total.toLocaleString()}<br><small>Payé: ${c.paye.toLocaleString()} FC</small></td><td>${c.dette.toLocaleString()}${motifTxt}</td><td>${new Date(c.derniere).toLocaleDateString()}</td></tr>`;
  }).join('')||'<tr><td colspan=6>Aucun</td></tr>';
}
window.renderCRM=renderCRM;
