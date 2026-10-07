import { STATE } from '../core/state.js';
export function calcCompta(){
  let du=document.getElementById('cDu').value, au=document.getElementById('cAu').value;
  if(!du||!au){alert('Choisis dates'); return;}
  let data=window.getFiltered?window.getFiltered():{ventes:[],dep:[]};
  let ventes=(data.ventes||[]).filter(v=>{let d=(v.date||'').slice(0,10); return d>=du && d<=au;});
  let dep=(data.dep||[]).filter(d=>{let dt=(d.date||'').slice(0,10); return dt>=du && dt<=au;});
  let base=parseFloat(document.getElementById('cBase').value||50000);
  let comPct=parseFloat(document.getElementById('cCom').value||10);
  let loyer=parseFloat(document.getElementById('cLoyer').value||100000);
  let fixe=parseFloat(document.getElementById('cAutresFixe').value||0);
  let emprunt=parseFloat(document.getElementById('cEmprunt').value||0);
  let primePct=parseFloat(document.getElementById('cPrime').value||25);
  let patronPct=parseFloat(document.getElementById('cPatron').value||45);
  let devPct=parseFloat(document.getElementById('cDev').value||30);
  
  let ca=ventes.reduce((s,v)=>s+(parseFloat(v.total)||0),0);
  let benefBrut=ventes.reduce((s,v)=>{let st=(STATE.ALL_DATA[STATE.SHOP]?.stock||[]).find(a=>a.code===v.code); let pa=st?parseFloat(st.pa||0):0; return s+((parseFloat(v.total)||0)-pa*(parseFloat(v.qte)||0));},0);
  let depTot=dep.reduce((s,d)=>s+(parseFloat(d.montant)||0),0);
  let com=ca*comPct/100;
  let benefNet=benefBrut-com-depTot-loyer-fixe;
  let seuil=loyer+fixe+base+emprunt;
  let prime=benefNet>0?benefNet*primePct/100:0;
  let patron=benefNet>0?benefNet*patronPct/100:0;
  let dev=benefNet>0?benefNet*devPct/100:0;
  
  document.getElementById('comptaResult').innerHTML=`
    <div class="card"><b>CA:</b> ${ca.toLocaleString()} FC | <b>Bénéf Brut:</b> ${benefBrut.toLocaleString()} FC | <b>Dép:</b> ${depTot.toLocaleString()} FC<br>
    <b>Com ${comPct}%:</b> ${com.toLocaleString()} | <b>Bénéf Net:</b> <span style="color:${benefNet>=0?'green':'red'}">${benefNet.toLocaleString()} FC</span><br>
    <b>Prime ${primePct}%:</b> ${prime.toLocaleString()} | <b>Patron ${patronPct}%:</b> ${patron.toLocaleString()} | <b>Dev ${devPct}%:</b> ${dev.toLocaleString()}</div>`;
  document.getElementById('seuilBox').innerHTML=`Seuil: ${seuil.toLocaleString()} FC<br>${ca>=seuil?'✅ Rentable':'❌ Pas rentable'}`;
}
window.calcCompta=calcCompta;
