import { STATE } from '../core/state.js';

function getArt(row){
  // Compat majuscule fidèle + minuscule modulaire
  return {
    CODE: row.CODE || row.code || '',
    Designation: row.Designation || row.designation || '',
    Quantite: parseFloat(row.Quantite ?? row.qte ?? row.stock ?? 0),
    PA: parseFloat(row['Prix Achat'] ?? row.pa ?? row.PA ?? 0),
    PV: parseFloat(row['Prix Unit'] ?? row.pv ?? 0),
    seuil: parseFloat(row.seuil ?? 3)
  };
}

export function renderAchatStock(){
  let tb=document.getElementById('achatStockT'); if(!tb) return;
  let data = window.getFiltered? window.getFiltered() : {stock:[]};
  let stock = data.stock || [];
  let q = (document.getElementById('searchAchat')?.value||'').toLowerCase();
  let filtre = document.getElementById('filtreAchat')?.value||'tous';

  let filt = stock.filter(raw=>{
    let a = getArt(raw);
    if(q && !a.CODE.toLowerCase().includes(q) && !a.Designation.toLowerCase().includes(q)) return false;
    if(filtre==='rupture' && a.Quantite>0) return false;
    if(filtre==='manque' && a.Quantite > a.seuil) return false;
    return true;
  });

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
      <td><input type="number" id="qa_${a.CODE}" value="${manque}" min="1" style="width:70px;padding:4px;border:1px solid #ccc;border-radius:6px"></td>
      <td id="tot_${a.CODE}">${(a.PA*manque).toLocaleString()}</td>
      <td><button class="btn btn-g" style="width:auto;padding:6px 12px" onclick="window.addToPanier('${a.CODE.replace(/'/g,"\\'")}')">➕</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan=9>Aucun article</td></tr>';

  // maj auto du total ligne quand on tape qté
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

export function addToPanier(code){
  let data = window.getFiltered? window.getFiltered() : {stock:[]};
  let raw = (data.stock||[]).find(r=> (r.CODE||r.code)===code); 
  if(!raw){ alert('Article introuvable: '+code); return; }
  let a = getArt(raw);
  let qte = parseFloat(document.getElementById('qa_'+a.CODE)?.value||1);
  if(qte<=0) qte=1;

  let ex = STATE.PANIER_ACHAT.find(p=>p.CODE===a.CODE);
  if(ex) ex.qte+=qte; 
  else STATE.PANIER_ACHAT.push({CODE:a.CODE, Designation:a.Designation, PA:a.PA, qte:qte, Quantite:a.Quantite});

  window.PANIER_ACHAT = STATE.PANIER_ACHAT;
  localStorage.setItem('panier_achat_'+STATE.SHOP, JSON.stringify(STATE.PANIER_ACHAT)); 
  renderPanier();
}

export function renderPanier(){
  let tb=document.getElementById('panierAchatT'); if(!tb) return;
  tb.innerHTML = STATE.PANIER_ACHAT.map((p,i)=>`<tr>
    <td><b>${window.esc(p.CODE||p.code)}</b></td>
    <td>${window.esc(p.Designation||p.designation)}</td>
    <td>${p.Quantite??p.stock??0}</td>
    <td>${p.qte}</td>
    <td>${(p.PA||0).toLocaleString()}</td>
    <td><b>${((p.PA||0)*(p.qte||0)).toLocaleString()}</b></td>
    <td><button class="btn btn-r" style="width:auto;padding:4px 8px" onclick="window.removePanier(${i})">🗑️</button></td>
  </tr>`).join('') || '<tr><td colspan=7>Panier vide</td></tr>';

  let tot = STATE.PANIER_ACHAT.reduce((s,p)=>s+(parseFloat(p.PA||0)*parseFloat(p.qte||0)),0);
  if(document.getElementById('totalAchat')) document.getElementById('totalAchat').innerText=tot.toLocaleString()+' FC';
  if(document.getElementById('totalAchat2')) document.getElementById('totalAchat2').innerText=tot.toLocaleString()+' FC';
  if(document.getElementById('nbAchat')) document.getElementById('nbAchat').innerText=STATE.PANIER_ACHAT.length;
  if(document.getElementById('panierCount')) document.getElementById('panierCount').innerText=STATE.PANIER_ACHAT.length;
}

export function viderPanierAchat(){
  if(!confirm('Vider le panier achat?')) return;
  STATE.PANIER_ACHAT=[]; window.PANIER_ACHAT=[];
  localStorage.removeItem('panier_achat_'+STATE.SHOP); 
  renderPanier();
}
export function removePanier(i){
  STATE.PANIER_ACHAT.splice(i,1);
  window.PANIER_ACHAT = STATE.PANIER_ACHAT;
  localStorage.setItem('panier_achat_'+STATE.SHOP, JSON.stringify(STATE.PANIER_ACHAT)); 
  renderPanier();
}

window.renderAchatStock=renderAchatStock;
window.addToPanier=addToPanier;
window.renderPanier=renderPanier;
window.renderPanierAchat=renderPanier;
window.viderPanierAchat=viderPanierAchat;
window.removePanier=removePanier;

console.log("✅ achat.js FIDÈLE corrigé CODE/Quantite/PA");
