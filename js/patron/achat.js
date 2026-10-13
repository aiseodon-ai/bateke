import { STATE } from '../core/state.js';

function getArt(row){
  return {
    CODE: row.CODE || row.code || '',
    Designation: row.Designation || row.designation || '',
    Quantite: parseFloat(row.Quantite ?? row.qte ?? row.stock ?? 0),
    PA: parseFloat(row['Prix Achat'] ?? row.pa ?? 0),
    seuil: parseFloat(row.seuil ?? 3)
  };
}

export function renderAchatStock(){
  let tb=document.getElementById('achatStockT'); if(!tb) return;
  let data = window.getFiltered? window.getFiltered() : {stock:[]};
  let stock = data.stock || [];
  let q = (document.getElementById('searchAchat')?.value||'').toLowerCase();
  let filtreEl = document.getElementById('filtreAchat');
  let filtre = filtreEl?.value || 'tous';

  console.log("🔍 Filtre Achat:", filtre, "search:", q, "stock total:", stock.length);

  let filt = stock.filter(raw=>{
    let a = getArt(raw);
    if(q && !a.CODE.toLowerCase().includes(q) && !a.Designation.toLowerCase().includes(q)) return false;
    if(filtre==='rupture' && a.Quantite>0) return false;
    if(filtre==='manque' && a.Quantite > a.seuil) return false;
    return true;
  });

  console.log("✅ Après filtre:", filt.length);

  tb.innerHTML = filt.slice(0,300).map(raw=>{
    let a = getArt(raw);
    let manque = Math.max(0, (a.seuil*2) - a.Quantite);
    if(a.Quantite<=0) manque = a.seuil*2;
    return `<tr>
      <td><b>${window.esc(a.CODE)}</b></td>
      <td>${window.esc(a.Designation)}</td>
      <td style="color:${a.Quantite<=0?'red':''}">${a.Quantite}</td>
      <td>${a.seuil}</td>
      <td style="color:red;font-weight:bold">${manque}</td>
      <td>${a.PA.toLocaleString()}</td>
      <td><input type="number" id="qa_${a.CODE}" value="${manque}" min="0" style="width:70px"></td>
      <td id="tot_${a.CODE}">${(a.PA*manque).toLocaleString()}</td>
      <td><button class="btn btn-g" style="width:auto" onclick="window.addToPanier('${a.CODE}')">➕</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan=9>Aucun</td></tr>';

  filt.forEach(raw=>{
    let a=getArt(raw);
    let inp=document.getElementById('qa_'+a.CODE);
    if(inp){
      inp.oninput=()=>{
        let qte=parseFloat(inp.value||0);
        let totEl=document.getElementById('tot_'+a.CODE);
        if(totEl) totEl.innerText=(a.PA*qte).toLocaleString();
      };
    }
  });

  renderPanier();
}

function initAchatListeners(){
  let search = document.getElementById('searchAchat');
  let filtre = document.getElementById('filtreAchat');
  if(search && !search._bound){
    search.addEventListener('input', renderAchatStock);
    search._bound=true;
  }
  if(filtre && !filtre._bound){
    filtre.addEventListener('change', renderAchatStock);
    filtre._bound=true;
    console.log("✅ Listener filtre attaché:", filtre.id);
  }
}

export function addToPanier(code){
  let data = window.getFiltered? window.getFiltered() : {stock:[]};
  let raw = (data.stock||[]).find(r=> (r.CODE||r.code)===code); 
  if(!raw) return;
  let a = getArt(raw);
  let qte = parseFloat(document.getElementById('qa_'+a.CODE)?.value||1);
  if(qte<=0) qte=1;
  let ex = STATE.PANIER_ACHAT.find(p=>p.CODE===a.CODE);
  if(ex) ex.qte+=qte; else STATE.PANIER_ACHAT.push({CODE:a.CODE, Designation:a.Designation, PA:a.PA, qte:qte, Quantite:a.Quantite});
  window.PANIER_ACHAT = STATE.PANIER_ACHAT;
  localStorage.setItem('panier_achat_'+STATE.SHOP, JSON.stringify(STATE.PANIER_ACHAT)); 
  renderPanier();
}

export function renderPanier(){
  let tb=document.getElementById('panierAchatT'); if(!tb) return;
  tb.innerHTML = STATE.PANIER_ACHAT.map((p,i)=>`<tr>
    <td>${window.esc(p.CODE)}</td><td>${window.esc(p.Designation)}</td><td>${p.Quantite||0}</td><td>${p.qte}</td><td>${p.PA}</td><td>${(p.PA*p.qte).toLocaleString()}</td><td><button class="btn btn-r" onclick="window.removePanier(${i})">🗑️</button></td>
  </tr>`).join('') || '<tr><td colspan=7>Panier vide</td></tr>';
  let tot = STATE.PANIER_ACHAT.reduce((s,p)=>s+(p.PA*p.qte),0);
  if(document.getElementById('totalAchat')) document.getElementById('totalAchat').innerText=tot.toLocaleString()+' FC';
  if(document.getElementById('totalAchat2')) document.getElementById('totalAchat2').innerText=tot.toLocaleString()+' FC';
  if(document.getElementById('nbAchat')) document.getElementById('nbAchat').innerText=STATE.PANIER_ACHAT.length;
}

export function viderPanierAchat(){ STATE.PANIER_ACHAT=[]; window.PANIER_ACHAT=[]; localStorage.removeItem('panier_achat_'+STATE.SHOP); renderPanier(); }
export function removePanier(i){ STATE.PANIER_ACHAT.splice(i,1); localStorage.setItem('panier_achat_'+STATE.SHOP, JSON.stringify(STATE.PANIER_ACHAT)); renderPanier(); }

// Auto-bind au chargement
setTimeout(initAchatListeners, 800);
document.addEventListener('DOMContentLoaded', initAchatListeners);

window.renderAchatStock=renderAchatStock;
window.addToPanier=addToPanier;
window.renderPanier=renderPanier;
window.renderPanierAchat=renderPanier;
window.viderPanierAchat=viderPanierAchat;
window.removePanier=removePanier;
