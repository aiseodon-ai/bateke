import { esc } from "../common/utils.js";

export function renderCRM(){
  let data=getFiltered(); let q=(document.getElementById('searchCli')?.value||'').toLowerCase(); let map={};
  data.ventes.forEach(v=>{
    let nom=(v.client?.nom || (typeof v.client === 'string' ? v.client : '') || v.clientNom || '').trim();
    let tel=(v.client?.tel || v.clientTel || '').trim();
    if(!nom&&!tel) return;
    // On ne met pas Comptoir dans le CRM
    if(nom === 'Comptoir' && !tel) return;
    let key=tel?'tel_'+tel:'nom_'+nom.toLowerCase();
    if(!map[key]) map[key]={nom:nom||'Inconnu',tel:tel,nb:0,total:0,paye:0,dette:0,derniere:v.date,anniversaire:'',motifs:[]};
    // Compat ancien + nouveau : paye / montantPaye, reste / Reste, total
    let totalV = Number(v.total ?? 0);
    let payeV = Number(v.paye ?? v.montantPaye ?? totalV);
    let resteV = Number(v.reste ?? v.Reste ?? Math.max(0, totalV - payeV));
    let annivV = v.client?.anniversaire || v.anniversaire || v.clientAnniv || '';
    let motifV = v.remiseMotif || v.motif || '';
    map[key].nb++; map[key].total+=totalV; map[key].paye+=payeV; map[key].dette+=resteV; map[key].derniere=v.date;
    if(annivV) map[key].anniversaire = annivV;
    if(motifV && !map[key].motifs.includes(motifV)) map[key].motifs.push(motifV);
  });
  let list=Object.values(map).filter(c=>(c.nom||'').toLowerCase().includes(q)||(c.tel||'').includes(q)).sort((a,b)=>b.total-a.total);

  // Anniversaires du mois - Pour ton IA Clients
  let moisActuel = new Date().getMonth() + 1;
  let annivMois = list.filter(c=> c.anniversaire && (new Date(c.anniversaire).getMonth()+1) === moisActuel);
  let infoEl = document.getElementById('annivMoisInfo');
  if(infoEl){
    infoEl.innerHTML = annivMois.length ? `🎂 ${annivMois.length} anniversaire(s) ce mois : ${annivMois.map(c=> esc(c.nom) + ' (' + new Date(c.anniversaire).toLocaleDateString() + ')').join(', ')}` : 'Aucun anniversaire ce mois';
  }

  document.getElementById('crmList').innerHTML=list.map(c=>{
    let annivTxt = c.anniversaire ? `<br><small>🎂 ${new Date(c.anniversaire).toLocaleDateString()}</small>` : '';
    let detteTxt = c.dette > 0 ? `<b style="color:red">${c.dette.toLocaleString()} FC</b>` : `<span style="color:green">À jour</span>`;
    let motifTxt = c.motifs.length ? `<br><small>Motifs: ${esc(c.motifs.join(', '))}</small>` : '';
    let btnRelance = c.dette > 0 ? `<br><button onclick="rappelerDetteCRM('${esc(c.tel)}','${esc(c.nom)}',${c.dette})" style="background:#facc15;padding:4px 8px;border-radius:6px;font-size:11px;margin-top:4px">📞 Relancer</button>` : '';
    return `<tr><td><b>${esc(c.nom)}</b>${annivTxt}</td><td>${esc(c.tel)}</td><td>${c.nb}</td><td>${c.total.toLocaleString()}<br><small>Payé: ${c.paye.toLocaleString()} FC</small></td><td>${detteTxt}${motifTxt}${btnRelance}</td><td>${new Date(c.derniere).toLocaleDateString()}</td></tr>`;
  }).join('')||'<tr><td colspan=6>Aucun</td></tr>';
}

function rappelerDetteCRM(tel, nom, dette){
  if(!dette || dette <= 0) return alert(nom + ' n\'a pas de dette');
  let msg = `Bonjour ${nom}, c'est BATEKE. Il te reste ${dette.toLocaleString()} FC à régler. Merci de passer à la boutique.`;
  if(tel) window.open('https://wa.me/243' + String(tel).replace(/^0/,'').replace(/[^0-9]/g,'') + '?text=' + encodeURIComponent(msg), '_blank');
  else alert(msg);
}

window.renderCRM=renderCRM;
window.rappelerDetteCRM=rappelerDetteCRM;
