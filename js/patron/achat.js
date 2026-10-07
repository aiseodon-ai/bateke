import { STATE } from '../core/state.js';
export function renderAchatStock(){
  let tb=document.getElementById('achatStockT'); if(!tb) return;
  let data=window.getFiltered?window.getFiltered():{stock:[]};
  let stock=data.stock||[];
  let q=document.getElementById('searchAchat')?.value?.toLowerCase()||'';
  let filtre=document.getElementById('filtreAchat')?.value||'tous';
  let filt=stock.filter(a=>{
    if(q && !(a.code||'').toLowerCase().includes(q) && !(a.designation||'').toLowerCase().includes(q)) return false;
    if(filtre==='rupture' && parseFloat(a.qte||0)>0) return false;
    if(filtre==='manque' && parseFloat(a.qte||0)>parseFloat(a.seuil||3)) return false;
    return true;
  });
  tb.innerHTML=filt.map(a=>{
    let manque=Math.max(0,(parseFloat(a.seuil||3)*2)-parseFloat(a.qte||0));
    return `<tr>
      <td>${window.esc(a.code)}</td><td>${window.esc(a.designation)}</td>
      <td>${a.qte}</td><td>${a.seuil}</td><td style="color:red">${manque}</td>
      <td>${a.pa}</td>
      <td><input type="number" id="qa_${a.code}" value="${manque}" style="width:70px"></td>
      <td>${(parseFloat(a.pa||0)*(parseFloat(document.getElementById('qa_'+a.code)?.value||manque)||0)).toLocaleString()}</td>
      <td><button class="btn btn-g" onclick="window.addToPanier('${a.code}')">➕</button></td>
    </tr>`;
  }).join('');
  renderPanier();
}
export function addToPanier(code){
  let data=window.getFiltered?window.getFiltered():{stock:[]};
  let art=(data.stock||[]).find(a=>a.code===code); if(!art) return;
  let qte=parseFloat(document.getElementById('qa_'+code)?.value||1);
  let ex=STATE.PANIER_ACHAT.find(p=>p.code===code); if(ex) ex.qte+=qte; else STATE.PANIER_ACHAT.push({code:art.code,designation:art.designation,pa:art.pa,qte:qte,stock:art.qte});
  localStorage.setItem('panier_achat_'+STATE.SHOP, JSON.stringify(STATE.PANIER_ACHAT)); renderPanier();
}
export function renderPanier(){
  let tb=document.getElementById('panierAchatT'); if(!tb) return;
  tb.innerHTML=STATE.PANIER_ACHAT.map((p,i)=>`<tr><td>${p.code}</td><td>${p.designation}</td><td>${p.stock}</td><td>${p.qte}</td><td>${p.pa}</td><td>${(p.pa*p.qte).toLocaleString()}</td><td><button onclick="window.removePanier(${i})">🗑️</button></td></tr>`).join('');
  let tot=STATE.PANIER_ACHAT.reduce((s,p)=>s+p.pa*p.qte,0);
  document.getElementById('totalAchat').innerText=tot.toLocaleString()+' FC';
  document.getElementById('totalAchat2').innerText=tot.toLocaleString()+' FC';
  document.getElementById('nbAchat').innerText=STATE.PANIER_ACHAT.length;
}
export function viderPanierAchat(){STATE.PANIER_ACHAT=[]; localStorage.removeItem('panier_achat_'+STATE.SHOP); renderPanier();}
export function removePanier(i){STATE.PANIER_ACHAT.splice(i,1); localStorage.setItem('panier_achat_'+STATE.SHOP, JSON.stringify(STATE.PANIER_ACHAT)); renderPanier();}
window.renderAchatStock=renderAchatStock; window.addToPanier=addToPanier; window.viderPanierAchat=viderPanierAchat; window.removePanier=removePanier;
