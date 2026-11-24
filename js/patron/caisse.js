import { esc } from "../common/utils.js";

export function renderCaisse(){
 let data=getFiltered(); let all=[];

 // --- 1. VENTES : avec Réf + Client + Articles ---
 data.ventes.forEach(v=>all.push({date:v.date,type:'Vente',motif:`Vente ${v._id} - ${v.client?.nom||'Comptoir'} - ${(v.items||[]).map(i=>esc(i.CODE)+' x'+(i.qty||1)).join(', ')}`,montant:v.montantPaye??v.total,_id:v._id,_shop:v._shop}));

 // --- 2. PAIEMENTS DETTE, lus depuis les ventes ---
 data.ventes.forEach(v=>{
   let arr=[];
   if(v.paiementsDette){
     if(Array.isArray(v.paiementsDette)) arr=v.paiementsDette;
     else if(typeof v.paiementsDette==='object') arr=Object.values(v.paiementsDette);
   }
   arr.forEach(p=>all.push({date:p.date,type:'Paiement Dette',motif:'💰 '+(p.clientNom||v.client?.nom||'')+' - '+(p.motif||'')+(p.note ? ' - '+p.note : '')+' (Vente '+(p.venteId||v._id)+')',montant:Number(p.montant||0),_id:p.venteId||v._id,_shop:p.shop||v._shop,isPaiementDette:true}));
 });

 // --- 3. DEPENSES : affichage complet ---
 (data.dep||[]).forEach(d=>all.push({date:d.date,type:'Dépense',motif:`🧾 ${d.motif||d.description||d.libelle||'Dépense'}${(d.vendeurNom||d.vendeur||d.faitPar) ? ' - '+(d.vendeurNom||d.vendeur||d.faitPar) : ''}${(d._shop||SHOP) ? ' - '+(d._shop||SHOP) : ''}${d._id ? ' (Dép '+d._id+')' : ''}`,montant:-Math.abs(Number(d.montant||0)),_id:d._id,_shop:d._shop||SHOP,isDep:true}));

 // --- 4. VERSEMENTS ---
 (data.vers||[]).forEach(v=>all.push({date:v.date,type:'Versement',motif:`🏦 ${v.description||v.motif||v.libelle||'Versement'}${(v.vendeurNom||v.vendeur||v.faitPar) ? ' - '+(v.vendeurNom||v.vendeur||v.faitPar) : ''}${(v._shop||SHOP) ? ' - '+(v._shop||SHOP) : ''}`,montant:-Math.abs(Number(v.montant||0)),_id:v._id,_shop:v._shop||SHOP,isVers:true}));

 all.sort((a,b)=>new Date(b.date)-new Date(a.date));

 document.getElementById('caisseList').innerHTML=all.slice(0,200).map(a=>{
   let btn='';
   if(a.isDep) btn=`<button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" data-id="${esc(a._id)}" data-shop="${esc(a._shop||SHOP)}" onclick="annulerDepense(this.dataset.id,this.dataset.shop)">↩ Annuler</button>`;
   if(a.isVers) btn=`<button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" data-id="${esc(a._id)}" data-shop="${esc(a._shop||SHOP)}" onclick="annulerVersement(this.dataset.id,this.dataset.shop)">↩ Annuler</button>`;
   let typeStyle = a.type==='Paiement Dette' ? 'background:#dcfce7;color:#166534;padding:2px 6px;border-radius:10px;font-weight:bold' : '';
   if(a.type==='Dépense') typeStyle='background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:10px;font-weight:bold';
   if(a.type==='Versement') typeStyle='background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:10px;font-weight:bold';
   if(a.type==='Vente') typeStyle='background:#dbeafe;color:#1e40af;padding:2px 6px;border-radius:10px;font-weight:bold';
   return `<tr><td>${new Date(a.date).toLocaleString()}</td><td><span style="${typeStyle}">${esc(a.type)}</span></td><td>${esc(a.motif)}</td><td style="color:${a.montant<0?'red':'green'}">${a.montant.toLocaleString()}</td><td>${btn}</td></tr>`;
 }).join('')||'<tr><td colspan=5>Aucun</td></tr>';
}

export async function annulerDepense(id,shop){
  if(!id) return alert('ID vide');
  if(!confirm('Annuler dépense? '+id)) return;
  let s = shop || SHOP;
  if(!s || s==='ALL') return alert('Choisis boutique');
  // 1. Firebase
  await db.ref('shops/'+s+'/depenses/'+id).remove();
  // 2. Local : on enlève la ligne, sinon elle reste à l'écran
  try{
    let ALL = window.ALL_DATA || (window.STATE ? window.STATE.ALL_DATA : null);
    if(ALL && ALL[s] && ALL[s].dep){
      if(Array.isArray(ALL[s].dep)) ALL[s].dep = ALL[s].dep.filter(x=>String(x._id)!==String(id));
      else if(typeof ALL[s].dep==='object') delete ALL[s].dep[id];
    }
    if(ALL && ALL[s] && ALL[s].depenses){
      if(Array.isArray(ALL[s].depenses)) ALL[s].depenses = ALL[s].depenses.filter(x=>String(x._id)!==String(id));
      else if(typeof ALL[s].depenses==='object') delete ALL[s].depenses[id];
    }
    window.savePatronCache?.();
  }catch(e){ console.log('Sync local dépense:', e.message); }
  // 3. Ré-affichage : la ligne disparaît tout de suite, sans F5
  renderCaisse();
  window.updateKPIs?.();
  alert('✅ Dépense annulée, ligne supprimée');
}

export async function annulerVersement(id,shop){
  if(!id) return alert('ID vide');
  if(!confirm('Annuler versement? '+id)) return;
  let s = shop || SHOP;
  if(!s || s==='ALL') return alert('Choisis boutique');
  await db.ref('shops/'+s+'/versements/'+id).remove();
  try{
    let ALL = window.ALL_DATA || (window.STATE ? window.STATE.ALL_DATA : null);
    if(ALL && ALL[s] && ALL[s].vers){
      if(Array.isArray(ALL[s].vers)) ALL[s].vers = ALL[s].vers.filter(x=>String(x._id)!==String(id));
      else if(typeof ALL[s].vers==='object') delete ALL[s].vers[id];
    }
    if(ALL && ALL[s] && ALL[s].versements){
      if(Array.isArray(ALL[s].versements)) ALL[s].versements = ALL[s].versements.filter(x=>String(x._id)!==String(id));
      else if(typeof ALL[s].versements==='object') delete ALL[s].versements[id];
    }
    window.savePatronCache?.();
  }catch(e){ console.log('Sync local versement:', e.message); }
  renderCaisse();
  window.updateKPIs?.();
  alert('✅ Versement annulé, ligne supprimée');
}

window.renderCaisse=renderCaisse; window.annulerDepense=annulerDepense; window.annulerVersement=annulerVersement;
