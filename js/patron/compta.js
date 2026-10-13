import { STATE } from '../core/state.js';

function getStockMap(){
  let map={};
  let stock = (window.getFiltered?window.getFiltered():{stock:[]}).stock || [];
  stock.forEach(r=>{
    let code = r.CODE || r.code;
    if(code) map[code] = {
      PA: parseFloat(r['Prix Achat']?? r.pa?? 0),
      PV: parseFloat(r['Prix Unit']?? r.pv?? 0)
    };
  });
  return map;
}

export function calcCompta(){
  let duEl=document.getElementById('cDu');
  let auEl=document.getElementById('cAu');
  let du=duEl?.value, au=auEl?.value;
  if(!du||!au){alert('Choisis dates Du/Au'); return;}

  let data=window.getFiltered?window.getFiltered():{ventes:[],dep:[]};
  let ventes=(data.ventes||[]).filter(v=>{
    let d=(v.date||'').slice(0,10);
    return d>=du && d<=au;
  });
  let dep=(data.dep||[]).filter(d=>{
    let dt=(d.date||'').slice(0,10);
    return dt>=du && dt<=au;
  });

  let base=parseFloat(document.getElementById('cBase')?.value||50000);
  let comPct=parseFloat(document.getElementById('cCom')?.value||10);
  let loyer=parseFloat(document.getElementById('cLoyer')?.value||100000);
  let fixe=parseFloat(document.getElementById('cAutresFixe')?.value||0);
  let emprunt=parseFloat(document.getElementById('cEmprunt')?.value||0);
  let primePct=parseFloat(document.getElementById('cPrime')?.value||25);
  let patronPct=parseFloat(document.getElementById('cPatron')?.value||45);
  let devPct=parseFloat(document.getElementById('cDev')?.value||30);

  let mapStock = getStockMap();

  // CA fidèle
  let ca=ventes.reduce((s,v)=>s+(parseFloat(v.total||0)),0);

  // Bénéfice Brut fidèle V4.9.10 : somme sur items (Prix - PA)*qty
  let benefBrut=0;
  ventes.forEach(v=>{
    let items = v.items || [];
    if(!items.length && (v.CODE||v.code)){
      // compat ancienne vente plate
      items=[{CODE:v.CODE||v.code, qty:v.qty||v.qte||0, Prix: v.Prix||v.pv||0}];
    }
    items.forEach(i=>{
      let code = i.CODE || i.code;
      let qty = parseFloat(i.qty||0);
      let pv = parseFloat(i.Prix||0);
      let pa = mapStock[code]?.PA || parseFloat(i.PA||0) || 0;
      benefBrut += (pv - pa) * qty;
    });
  });

  let depTot=dep.reduce((s,d)=>s+(parseFloat(d.montant||0)),0);
  let com=ca*comPct/100;
  let benefNet=benefBrut - com - depTot - loyer - fixe;
  let seuil=loyer+fixe+base+emprunt;

  // Répartition fidèle V4.9.10
  let prime=benefNet>0?benefNet*primePct/100:0;
  let patron=benefNet>0?benefNet*patronPct/100:0;
  let dev=benefNet>0?benefNet*devPct/100:0;
  let resteApresRepart = benefNet>0? benefNet - prime - patron - dev : benefNet;

  let resEl=document.getElementById('comptaResult');
  if(resEl){
    resEl.innerHTML=`
      <div class="card" style="padding:12px;background:#fff;border:1px solid #ddd;border-radius:12px;line-height:1.8">
        <b>Période:</b> ${du} → ${au} | <b>Ventes:</b> ${ventes.length} | <b>Dépenses:</b> ${dep.length}<br>
        <b>CA:</b> ${ca.toLocaleString()} FC | <b>Bénéf Brut (PV-PA):</b> <b style="color:green">${benefBrut.toLocaleString()} FC</b> | <b>Dép:</b> ${depTot.toLocaleString()} FC<br>
        <b>Com Vendeur ${comPct}%:</b> ${com.toLocaleString()} FC | <b>Loyer:</b> ${loyer.toLocaleString()} | <b>Fixe:</b> ${fixe.toLocaleString()} | <b>Emprunt:</b> ${emprunt.toLocaleString()}<br>
        <hr>
        <b>Bénéf Net:</b> <span style="color:${benefNet>=0?'green':'red'};font-size:18px">${benefNet.toLocaleString()} FC</span><br>
        <b>Prime ${primePct}%:</b> ${prime.toLocaleString()} FC | <b>Patron ${patronPct}%:</b> ${patron.toLocaleString()} FC | <b>Dev ${devPct}%:</b> ${dev.toLocaleString()} FC | <b>Reste:</b> ${resteApresRepart.toLocaleString()} FC
      </div>`;
  }
  let seuilBox=document.getElementById('seuilBox');
  if(seuilBox){
    seuilBox.innerHTML=`
      <div style="padding:10px;border-radius:10px;background:${ca>=seuil?'#dcfce7':'#fee2e2'}">
        <b>Seuil Rentabilité:</b> ${seuil.toLocaleString()} FC (Loyer ${loyer.toLocaleString()} + Fixe ${fixe.toLocaleString()} + Base ${base.toLocaleString()} + Emprunt ${emprunt.toLocaleString()})<br>
        <b>CA ${ca.toLocaleString()} FC</b> vs Seuil ${seuil.toLocaleString()} FC = <b>${ca>=seuil?'✅ Rentable':'❌ Pas rentable (manque '+(seuil-ca).toLocaleString()+' FC)'}</b><br>
        <small>V4.9.10 EXACT Base+Emprunt</small>
      </div>`;
  }
  console.log("✅ Compta calculé", {ca, benefBrut, depTot, benefNet});
}

export function loadComptaParams(){
  let c = window.CURRENT_CONFIG?.compta || STATE.CURRENT_CONFIG?.compta || {base:50000,comPct:10,loyer:100000,autreFixe:0,emprunt:0,primePct:25,patronPct:45,devPct:30};
  if(document.getElementById('cBase')) document.getElementById('cBase').value=c.base;
  if(document.getElementById('cCom')) document.getElementById('cCom').value=c.comPct;
  if(document.getElementById('cLoyer')) document.getElementById('cLoyer').value=c.loyer;
  if(document.getElementById('cAutresFixe')) document.getElementById('cAutresFixe').value=c.autreFixe||0;
  if(document.getElementById('cEmprunt')) document.getElementById('cEmprunt').value=c.emprunt||0;
  if(document.getElementById('cPrime')) document.getElementById('cPrime').value=c.primePct;
  if(document.getElementById('cPatron')) document.getElementById('cPatron').value=c.patronPct;
  if(document.getElementById('cDev')) document.getElementById('cDev').value=c.devPct;
}

window.calcCompta=calcCompta;
window.loadComptaParams=loadComptaParams;

console.log("✅ compta.js V4.9.10 FIDÈLE chargé");
