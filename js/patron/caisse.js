import { esc } from "../common/utils.js";
import { STATE } from '../core/state.js';
import { db } from '../core/firebase.js';

export function renderCaisse(){
 let data=getFiltered(); let all=[];
 // Ventes : On compte ce que le vendeur a encaissé au moment de la vente
 data.ventes.forEach(v=>all.push({date:v.date,type:'Vente',motif:(v.items||[]).map(i=>esc(i.CODE)).join(','),montant:Number(v.paye ?? v.montantPaye ?? v.total ?? 0),_id:v._id,_shop:v._shop}));
 // NOUVEAU : Paiements Dette - Ce que le client paie PLUS TARD. C'est une ENTRÉE caisse.
 // On les prend dans data.paiementsDette si ton getFiltered les ramène, sinon on les prend dans les ventes
 let paiements = data.paiementsDette || [];
 if(!paiements.length){
   // Fallback : On reconstruit à partir de l'historique dans chaque vente
   data.ventes.forEach(v=>{
     (v.paiementsDette||[]).forEach(p=>{
       paiements.push({...p, _shop: v._shop, _id: v._id, clientNom: v.client?.nom});
     });
   });
 }
 paiements.forEach(p=>all.push({
   date: p.date,
   type: 'Paiement Dette',
   motif: `💰 ${esc(p.clientNom||p.client?.nom||'')} - ${esc(p.motif||'')} ${p.note ? ' - ' + esc(p.note) : ''} (Vente ${esc(p.venteId||'')})`,
   montant: Number(p.montant||0),
   _id: p.venteId,
   _shop: p.shop || p._shop,
   isPaiementDette: true
 }));
 (data.dep||[]).forEach(d=>all.push({date:d.date,type:'Dépense',motif:d.motif||d.description||'',montant:-d.montant,_id:d._id,_shop:d._shop||STATE.SHOP,isDep:true}));
 (data.vers||[]).forEach(v=>all.push({date:v.date,type:'Versement',motif:v.description||v.motif||'',montant:-v.montant,_id:v._id,_shop:v._shop||STATE.SHOP,isVers:true}));
 all.sort((a,b)=>new Date(b.date)-new Date(a.date));
 document.getElementById('caisseList').innerHTML=all.slice(0,200).map(a=>{
   let btn='';
   if(a.isDep) btn=`<button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" data-id="${esc(a._id)}" data-shop="${esc(a._shop||STATE.SHOP)}" onclick="annulerDepense(this.dataset.id,this.dataset.shop)">↩ Annuler</button>`;
   if(a.isVers) btn=`<button class="btn btn-r" style="width:auto;padding:4px 8px;font-size:10px" data-id="${esc(a._id)}" data-shop="${esc(a._shop||STATE.SHOP)}" onclick="annulerVersement(this.dataset.id,this.dataset.shop)">↩ Annuler</button>`;
   // Un paiement dette ne s'annule PAS comme une dépense, il se corrige dans Dettes, donc pas de bouton Annuler
   let typeStyle = a.type === 'Paiement Dette' ? 'background:#dcfce7;color:#166534;padding:2px 6px;border-radius:10px;font-weight:bold' : '';
   return `<tr><td>${new Date(a.date).toLocaleString()}</td><td><span style="${typeStyle}">${esc(a.type)}</span></td><td>${esc(a.motif)}</td><td style="color:${a.montant<0?'red':'green'}">${a.montant.toLocaleString()}</td><td>${btn}</td></tr>`;
 }).join('')||'<tr><td colspan=5>Aucun</td></tr>';
}
export function annulerDepense(id,shop){ if(!confirm('Annuler dépense? '+id)) return; db.ref('shops/'+(shop||STATE.SHOP)+'/depenses/'+id).remove().then(()=>alert('✅ Dépense annulée')); }
export function annulerVersement(id,shop){ if(!confirm('Annuler versement? '+id)) return; db.ref('shops/'+(shop||STATE.SHOP)+'/versements/'+id).remove().then(()=>alert('✅ Versement annulé')); }
window.renderCaisse=renderCaisse; window.annulerDepense=annulerDepense; window.annulerVersement=annulerVersement;
