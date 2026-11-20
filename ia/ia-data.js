// ia-data.js - LECTURE SEULE STATE / DATA / getFiltered
(function(){
  function IA_getData(){
    let d = {};
    try{ if(window.STATE) d = Object.assign({}, d, window.STATE); }catch(e){}
    try{ if(window.DATA) d = Object.assign({}, d, window.DATA); }catch(e){}
    try{ if(typeof window.getFiltered==='function'){ let f = window.getFiltered(); if(f) d = Object.assign({}, d, f); } }catch(e){}
    function toArr(x){ if(Array.isArray(x)) return x; if(x && typeof x==='object') return Object.values(x); return []; }
    return { stock: toArr(d.stock || d.STOCK || []), ventes: toArr(d.ventes || d.VENTES || d.sales || []), caisse: toArr(d.caisse || []), dettes: toArr(d.dettes || []), clients: toArr(d.clients || []), vendeurs: toArr(d.vendeurs || []) };
  }
  function IA_ventesLignes(ventes){
    let lignes = [];
    ventes.forEach(function(v){
      if(!v || typeof v!=='object') return;
      let items = v.items || v.lignes || v.produits || v.articles || null;
      let dateV = IA_time(v.date || v.Date || v.created || v.timestamp);
      let vendeurV = v.vendeur || v.Vendeur || ''; let clientV = v.client || v.Client || v.nomClient || '';
      if(Array.isArray(items)){
        items.forEach(function(it){ lignes.push({ CODE: String(it.CODE||it.code||''), QTE: IA_num(it.QTE||it.qte||it.Quantite||1), TOTAL: IA_num(it.Total||it.total||it.montant||0), DATE: dateV, VENDEUR: vendeurV, CLIENT: clientV, RESTE: IA_num(v.reste||v.Reste||0) }); });
      } else {
        lignes.push({ CODE: String(v.CODE||v.code||''), QTE: IA_num(v.QTE||v.qte||v.Quantite||1), TOTAL: IA_num(v.total||v.Total||v.montant||0), DATE: dateV, VENDEUR: vendeurV, CLIENT: clientV, RESTE: IA_num(v.reste||v.Reste||0) });
      }
    });
    return lignes;
  }
  window.IA_getData=IA_getData; window.IA_ventesLignes=IA_ventesLignes;
})();
