import { esc } from "../common/utils.js";
export function renderCaisse(){
 let data=getFiltered(); let all=[];
 // --- CORRIGÉ 1 : Vente avec Réf + Client + Articles ---
 // AVANT : motif = juste CODE, ex: BAB06 -> on ne sait pas de quelle vente ça vient
 // APRÈS : motif = Vente 1795459759577 - makila - BAB06 x1
 data.ventes.forEach(v=>all.push({date:v.date,type:'Vente',motif:`Vente ${v._id} - ${v.client?.nom||'Comptoir'} - ${(v.items||[]).map(i=>esc(i.CODE)+' x'+(i.qty||1)).join(', ')}`,montant:v.montantPaye??v.total,_id:v._id,_shop:v._shop}));
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
 // --- CORRIGÉ 2 : Dépense avec affichage complet ---
 // AVANT : motif = d.motif || d.description -> si les 2 sont vides, ligne vide, on croit qu'il n'y a pas de dépense
 // APRÈS : motif = 🧾 Motif - Qui a fait la dépense - Boutique - Ref dépense
 // Et montant = -Math.abs() pour être sûr que c'est toujours en rouge, en négatif
 (data.dep||[]).forEach(d=>all.push({date:d.date,type:'Dépense',motif:`🧾 ${d.motif||d.description||d.libelle||'Dépense'}${(d.vendeurNom||d.vendeur||d.faitPar) ? ' - '+(d.vendeurNom||d.vendeur||d.faitPar) : ''}${(d._shop||SHOP) ? ' - '+(d._shop||SHOP) : ''}${d._id ? ' (Dép '+d._id+')' : ''}`,montant:-Math.abs(Number(d.montant||0)),_id:d._id,_shop:d._shop||SHOP,isDep:true}));
 (data.vers||[]).forEach(v=>all.push({date:v.date,type:'Versement',motif:`🏦 ${v.description||v.motif||v.libelle||'Versement'}${(v.vendeurNom||v.vendeur||v.faitPar) ? ' - '+(v.vendeurNom||v.vendeur||v.faitPar) : ''}${(v._shop||SHOP) ? ' - '+(v._shop||SHOP) : ''}`,montant:-Math.abs(Number(v.montant||0)),_id:v._id,_shop:v._shop||SHOP,isVers:true}));
 all.sort((a,b)=>new Date(b.date)-new Date(a.date));
 document.getElementById('caisseList').innerHTML=all.slice(0,200).map(a=>{
   let btn='';
   if(a.isDep) btn=`<button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" data-id="${esc(a._id)}" data-shop="${esc(a._shop||SHOP)}" onclick="annulerDepense(this.dataset.id,this.dataset.shop)">↩ Annuler</button>`;
   if(a.isVers) btn=`<button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" data-id="${esc(a._id)}" data-shop="${esc(a._shop||SHOP)}" onclick="annulerVersement(this.dataset.id,this.dataset.shop)">↩ Annuler</button>`;
   // --- CORRIGÉ 3 : Couleur pour tous les types, pas que Paiement Dette ---
   let typeStyle = a.type==='Paiement Dette' ? 'background:#dcfce7;color:#166534;padding:2px 6px;border-radius:10px;font-weight:bold' : '';
   if(a.type==='Dépense') typeStyle='background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:10px;font-weight:bold';
   if(a.type==='Versement') typeStyle='background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:10px;font-weight:bold';
   if(a.type==='Vente') typeStyle='background:#dbeafe;color:#1e40af;padding:2px 6px;border-radius:10px;font-weight:bold';
   return `<tr><td>${new Date(a.date).toLocaleString()}</td><td><span style="${typeStyle}">${esc(a.type)}</span></td><td>${esc(a.motif)}</td><td style="color:${a.montant<0?'red':'green'}">${a.montant.toLocaleString()}</td><td>${btn}</td></tr>`;
 }).join('')||'<tr><td colspan=5>Aucun</td></tr>';
}
export function annulerDepense(id,shop){ if(!confirm('Annuler dépense? '+id)) return; db.ref('shops/'+(shop||SHOP)+'/depenses/'+id).remove().then(()=>alert('✅ Dépense annulée')); }
export function annulerVersement(id,shop){ if(!confirm('Annuler versement? '+id)) return; db.ref('shops/'+(shop||SHOP)+'/versements/'+id).remove().then(()=>alert('✅ Versement annulé')); }
window.renderCaisse=renderCaisse; window.annulerDepense=annulerDepense; window.annulerVersement=annulerVersement;
