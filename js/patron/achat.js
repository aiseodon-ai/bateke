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
  let filtre = document.getElementById('filtreAchat')?.value || 'tous';

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
      <td><input type="number" id="qa_${window.esc(a.CODE)}" value="${manque}" min="0" style="width:70px"></td>
      <td id="tot_${window.esc(a.CODE)}">${(a.PA*manque).toLocaleString()}</td>
      <td><button class="btn btn-g" style="width:auto" onclick="window.addToPanier('${window.esc(a.CODE).replace(/'/g,"\\'")}')">➕</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan=9>Aucun</td></tr>';

  filt.forEach(raw=>{
    let a=getArt(raw);
    let safeCode = window.esc(a.CODE);
    let inp=document.getElementById('qa_'+safeCode);
    if(inp){
      inp.oninput=()=>{
        let qte=parseFloat(inp.value||0);
        let totEl=document.getElementById('tot_'+safeCode);
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
  }
}

export function addToPanier(code){
  let data = window.getFiltered? window.getFiltered() : {stock:[]};
  let raw = (data.stock||[]).find(r=> (r.CODE||r.code)===code); 
  if(!raw) return;
  let a = getArt(raw);
  let qte = parseFloat(document.getElementById('qa_'+window.esc(a.CODE))?.value||1);
  if(qte<=0) qte=1;
  let ex = STATE.PANIER_ACHAT.find(p=>p.CODE===a.CODE);
  if(ex) ex.qte+=qte; else STATE.PANIER_ACHAT.push({CODE:a.CODE, Designation:a.Designation, PA:a.PA, qte:qte, Quantite:a.Quantite, seuil:a.seuil});
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
  if(document.getElementById('totalAchatUSD')){
    let taux = window.CURRENT_CONFIG?.tauxUSD || 2850;
    document.getElementById('totalAchatUSD').innerText = (tot/taux).toFixed(2)+' $';
  }
}

// --- LES 4 BOUTONS QUI MANQUAIENT ---

export function ajouterManquesAuto(){
  let data = window.getFiltered? window.getFiltered() : {stock:[]};
  let stock = data.stock || [];
  let c=0;
  stock.forEach(raw=>{
    let a=getArt(raw);
    if(a.Quantite <= a.seuil){
      if(!STATE.PANIER_ACHAT.find(x=>x.CODE===a.CODE)){
        let manque = Math.max(1, (a.seuil*2) - a.Quantite);
        if(a.Quantite<=0) manque = a.seuil*2;
        STATE.PANIER_ACHAT.push({CODE:a.CODE, Designation:a.Designation, PA:a.PA, qte:manque, Quantite:a.Quantite, seuil:a.seuil});
        c++;
      }
    }
  });
  window.PANIER_ACHAT=STATE.PANIER_ACHAT;
  localStorage.setItem('panier_achat_'+STATE.SHOP, JSON.stringify(STATE.PANIER_ACHAT));
  renderPanier();
  alert(c+' articles en manque ajoutés au panier');
}

export function pdfRequisitionAchat(){
  if(!STATE.PANIER_ACHAT.length){ alert('Panier vide'); return; }
  let total = STATE.PANIER_ACHAT.reduce((s,p)=>s+(p.PA*p.qte),0);
  let shop = STATE.SHOP || 'Boutique';
  let html = `<html><head><title>Requisition ${shop}</title><style>body{font-family:Arial;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px}th{background:#111;color:#fff}</style></head><body>
  <h2>${window.CURRENT_CONFIG?.nom||'ETS BATEKE'} - REQUISITION ACHAT</h2>
  <p>Boutique: ${shop} - Date: ${new Date().toLocaleDateString()} - Total: ${total.toLocaleString()} FC</p>
  <table><tr><th>N°</th><th>CODE</th><th>Désignation</th><th>Stock</th><th>Qté Achat</th><th>PA</th><th>Total</th></tr>
  ${STATE.PANIER_ACHAT.map((p,i)=>`<tr><td>${i+1}</td><td>${p.CODE}</td><td>${p.Designation}</td><td>${p.Quantite}</td><td><b>${p.qte}</b></td><td>${p.PA.toLocaleString()}</td><td>${(p.PA*p.qte).toLocaleString()}</td></tr>`).join('')}
  <tr style="background:#111;color:#fff"><td colspan=4>TOTAL</td><td>${STATE.PANIER_ACHAT.reduce((s,p)=>s+p.qte,0)}</td><td></td><td>${total.toLocaleString()} FC</td></tr></table></body></html>`;
  let w=window.open('','','width=1000'); w.document.write(html); w.print();
}

export function exportExcelAchat(){
  if(!STATE.PANIER_ACHAT.length){ alert('Panier vide'); return; }
  let csv='CODE,Designation,Stock,Qte Achat,PA,Total\n'+STATE.PANIER_ACHAT.map(p=>`${p.CODE},${p.Designation.replace(/,/g,' ')},${p.Quantite},${p.qte},${p.PA},${p.PA*p.qte}`).join('\n');
  let blob=new Blob([csv],{type:'text/csv'}); let url=URL.createObjectURL(blob);
  let a=document.createElement('a'); a.href=url; a.download='requisition_achat_'+STATE.SHOP+'.csv'; a.click();
}

export function validerAchatDB(){
  if(!STATE.PANIER_ACHAT.length){ alert('Panier vide'); return; }
  let shopCible = STATE.SHOP==='ALL' ? prompt('Boutique cible ? '+ (STATE.SHOPS_LIST||[]).join('/')) : STATE.SHOP;
  if(!shopCible) return;
  let total = STATE.PANIER_ACHAT.reduce((s,p)=>s + (p.PA*p.qte),0);
  if(!confirm('Valider achat de '+STATE.PANIER_ACHAT.length+' articles pour '+total.toLocaleString()+' FC vers '+shopCible+' ?')) return;
  
  let db = window.db;
  if(!db){ alert('Base non connectée'); return; }
  
  db.ref('shops/'+shopCible+'/achats/'+Date.now()).set({
    date: new Date().toISOString(),
    boutique: shopCible,
    total: total,
    items: STATE.PANIER_ACHAT,
    createdBy: 'PATRON'
  }).then(()=>{
    alert('✅ Achat validé - '+total.toLocaleString()+' FC dans shops/'+shopCible+'/achats');
    STATE.PANIER_ACHAT=[]; window.PANIER_ACHAT=[];
    localStorage.setItem('panier_achat_'+STATE.SHOP, JSON.stringify([]));
    renderPanier();
  }).catch(e=>alert('Erreur: '+e.message));
}

export function viderPanierAchat(){ STATE.PANIER_ACHAT=[]; window.PANIER_ACHAT=[]; localStorage.removeItem('panier_achat_'+STATE.SHOP); renderPanier(); }
export function removePanier(i){ STATE.PANIER_ACHAT.splice(i,1); localStorage.setItem('panier_achat_'+STATE.SHOP, JSON.stringify(STATE.PANIER_ACHAT)); renderPanier(); }

// Bind
setTimeout(initAchatListeners, 800);
document.addEventListener('DOMContentLoaded', initAchatListeners);

// Expose global pour HTML onclick=""
window.renderAchatStock=renderAchatStock;
window.addToPanier=addToPanier;
window.renderPanier=renderPanier;
window.renderPanierAchat=renderPanier;
window.viderPanierAchat=viderPanierAchat;
window.removePanier=removePanier;
window.ajouterManquesAuto=ajouterManquesAuto;
window.pdfRequisitionAchat=pdfRequisitionAchat;
window.exportExcelAchat=exportExcelAchat;
window.validerAchatDB=validerAchatDB;
