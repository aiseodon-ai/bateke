import { esc } from "../common/utils.js";
export function renderCRM(){
  let data=getFiltered(); let q=(document.getElementById('searchCli')?.value||'').toLowerCase(); let map={};
  data.ventes.forEach(v=>{ let nom=(v.client?.nom||'').trim(); let tel=(v.client?.tel||'').trim(); if(!nom&&!tel) return; let key=tel?'tel_'+tel:'nom_'+nom.toLowerCase(); if(!map[key]) map[key]={nom:nom||'Inconnu',tel:tel,nb:0,total:0,dette:0,derniere:v.date}; map[key].nb++; map[key].total+=v.total; map[key].dette+=v.reste||0; map[key].derniere=v.date; });
  let list=Object.values(map).filter(c=>(c.nom||'').toLowerCase().includes(q)||(c.tel||'').includes(q)).sort((a,b)=>b.total-a.total);
  document.getElementById('crmList').innerHTML=list.map(c=>`<tr><td><b>${esc(c.nom)}</b></td><td>${esc(c.tel)}</td><td>${c.nb}</td><td>${c.total.toLocaleString()}</td><td>${c.dette.toLocaleString()}</td><td>${new Date(c.derniere).toLocaleDateString()}</td></tr>`).join('')||'<tr><td colspan=6>Aucun</td></tr>';
}
window.renderCRM=renderCRM;
