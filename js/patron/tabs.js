export function switchTab(id){
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
  document.getElementById('btn-'+id)?.classList.add('active');
  if(id==='achat'){if(window.renderAchatStock)window.renderAchatStock();}
  if(id==='rapport'&&window.genRapport)window.genRapport();
}
export function switchSub(id){
  document.getElementById('vue-table').style.display=id==='table'?'block':'none';
  document.getElementById('vue-graph').style.display=id==='graph'?'block':'none';
  document.getElementById('sub-table').classList.toggle('active',id==='table');
  document.getElementById('sub-graph').classList.toggle('active',id==='graph');
  if(id==='graph'&&window.genGraph)window.genGraph();
}
export function openNewArt(){document.getElementById('modalArt').classList.add('active');}
export function closeModal(id){document.getElementById(id).classList.remove('active');}
window.switchTab=switchTab; window.switchSub=switchSub; window.openNewArt=openNewArt; window.closeModal=closeModal;
