export function renderDettes(){
  let data=getFiltered(); let dettes=data.ventes.filter(v=>(v.reste||0)>0);
  document.getElementById('dettesList').innerHTML=dettes.slice(0,200).map(v=>`<tr><td>${new Date(v.date).toLocaleString()}</td><td><b>${v.client?.nom||''}</b></td><td>${v.client?.tel||''}</td><td>${v._shop}</td><td>${v.vendeurNom}</td><td>${v.total.toLocaleString()}</td><td>${(v.montantPaye||0).toLocaleString()}</td><td style="color:red">${(v.reste||0).toLocaleString()}</td></tr>`).join('')||'<tr><td colspan=8>Aucune</td></tr>';
  let el=document.getElementById('totalDettes'); if(el) el.innerText=dettes.reduce((s,v)=>s+(v.reste||0),0).toLocaleString()+' FC';
}
window.renderDettes=renderDettes;
