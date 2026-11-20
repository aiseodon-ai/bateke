// ia-core.js - SOCLE BATEKE - NE PAS TOUCHER SAUF BUG
(function(){
  function IA_num(v){ if(v==null||v==='') return 0; let s=String(v).replace(/\s/g,'').replace(',','.'); let n=Number(s); return isNaN(n)?0:n; }
  function IA_esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function IA_fmt(n){ return Math.round(n).toLocaleString('fr-FR')+' FC'; }
  function IA_time(v){
    if(!v) return 0;
    if(typeof v==='number') return v>1000000000000?v:v*1000;
    if(typeof v==='string'){ let m=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); if(m){ return new Date(Number(m[3]),Number(m[2])-1,Number(m[1])).getTime(); } let t=new Date(v).getTime(); return isNaN(t)?0:t; }
    if(typeof v==='object' && v.seconds) return v.seconds*1000;
    let t=new Date(v).getTime(); return isNaN(t)?0:t;
  }
  function IA_qty(p){ if(!p) return 0; if(p.Quantite!=null && String(p.Quantite).trim()!=='') return IA_num(p.Quantite); if(p['Qté']!=null) return IA_num(p['Qté']); if(p.QTE!=null) return IA_num(p.QTE); return 0; }
  function IA_pa(p){ if(!p) return 0; if(p.PA!=null && String(p.PA).trim()!=='' && IA_num(p.PA)!==0) return IA_num(p.PA); if(p['Prix Achat']!=null && IA_num(p['Prix Achat'])!==0) return IA_num(p['Prix Achat']); return IA_num(p.PA); }
  function IA_pv(p){ if(!p) return 0; if(p['Prix Unit']!=null && IA_num(p['Prix Unit'])!==0) return IA_num(p['Prix Unit']); if(p.Prix!=null && IA_num(p.Prix)!==0) return IA_num(p.Prix); if(p.PV!=null && IA_num(p.PV)!==0) return IA_num(p.PV); if(p['Prix Vente']!=null) return IA_num(p['Prix Vente']); return 0; }
  function IA_code(p){ if(!p) return ''; return String(p.CODE || p.Code || p.code || ''); }
  function IA_seuil(p){ if(!p) return 0; return IA_num(p.seuil ?? p.Seuil ?? p.SEUIL); }
  function IA_hasQty(p){ return p && (p.Quantite!=null || p['Qté']!=null || p.QTE!=null); }
  window.IA_num=IA_num; window.IA_esc=IA_esc; window.IA_fmt=IA_fmt; window.IA_time=IA_time;
  window.IA_qty=IA_qty; window.IA_pa=IA_pa; window.IA_pv=IA_pv; window.IA_code=IA_code;
  window.IA_seuil=IA_seuil; window.IA_hasQty=IA_hasQty;
})();
