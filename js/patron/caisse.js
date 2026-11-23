import { esc } from "../common/utils.js";
export function renderCaisse(){
 let data=getFiltered(); let all=[];
 data.ventes.forEach(v=>all.push({date:v.date,type:'Vente',motif:(v.items||[]).map(i=>esc(i.CODE)).join(','),montant:v.montantPaye??v.total,_id:v._id,_shop:v._shop}));
 // --- AJOUT : Paiements Dette, lus depuis les ventes ---
 data.ventes.forEach(v=>{
   let arr=[];
   if(v.paiementsDette){
     if(Array.isArray(v.paiementsDette)) arr=v.paiementsDette;
     else if(typeof v.paiementsDette==='object') arr=Object.values(v.paiementsDette);
   }
   arr.forEach(p=>all.push({date:p.date,type:'Paiement Dette',motif:'💰 '+(p.clientNom||v.client?.nom||'')+' - '+(p.motif||'')+(p.note ? ' - '+p.note : '')+' (Vente '+(p.venteId||v._id)+')',montant:Number(p.montant||0),_id:p.venteId||v._id,_shop:p.shop||v._shop,isPaiementDette:true}));
 });
 // --- FIN AJOUT ---
 (data.dep||[]).forEach(d=>all.push({date:d.date,type:'Dépense',motif:d.motif||d.description||'',montant:-d.montant,_id:d._id,_shop:d._shop||SHOP,isDep:true}));
 (data.vers||[]).forEach(v=>all.push({date:v.date,type:'Versement',motif:v.description||v.motif||'',montant:-v.montant,_id:v._id,_shop:v._shop||SHOP,isVers:true}));
 all.sort((a,b)=>new Date(b.date)-new Date(a.date));
 document.getElementById('caisseList').innerHTML=all.slice(0,200).map(a=>{
   let btn='';
   if(a.isDep) btn=`<button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" data-id="${esc(a._id)}" data-shop="${esc(a._shop||SHOP)}" onclick="annulerDepense(this.dataset.id,this.dataset.shop)">↩ Annuler</button>`;
   if(a.isVers) btn=`<button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" data-id="${esc(a._id)}" data-shop="${esc(a._shop||SHOP)}" onclick="annulerVersement(this.dataset.id,this.dataset.shop)">↩ Annuler</button>`;
   let typeStyle = a.type==='Paiement Dette' ? 'background:#dcfce7;color:#166534;padding:2px 6px;border-radius:10px;font-weight:bold' : '';
   return `<tr><td>${new Date(a.date).toLocaleString()}</td><td><span style="${typeStyle}">${esc(a.type)}</span></td><td>${esc(a.motif)}</td><td style="color:${a.montant<0?'red':'green'}">${a.montant.toLocaleString()}</td><td>${btn}</td></tr>`;
 }).join('')||'<tr><td colspan=5>Aucun</td></tr>';
}
export function annulerDepense(id,shop){ if(!confirm('Annuler dépense? '+id)) return; db.ref('shops/'+(shop||SHOP)+'/depenses/'+id).remove().then(()=>alert('✅ Dépense annulée')); }
export function annulerVersement(id,shop){ if(!confirm('Annuler versement? '+id)) return; db.ref('shops/'+(shop||SHOP)+'/versements/'+id).remove().then(()=>alert('✅ Versement annulé')); }
window.renderCaisse=renderCaisse; window.annulerDepense=annulerDepense; window.annulerVersement=annulerVersement;
