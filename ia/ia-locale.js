// ia-locale.js - CHEF D'ORCHESTRE - Il appelle les modules, il ne calcule plus
(function(){
  window.IA_switch = function(module){
    let el = document.getElementById('iaContent'); if(!el) return;
    try{
      let c = IA_buildContext();
      let html = '';
      if(module==='conseil'){ html = IA_render_conseil(c); }
      else if(module==='marketing'){ html = IA_render_marketing(c); }
      else if(module==='tresorerie'){ html = IA_render_tresorerie(c); }
      else if(module==='compta'){ html = IA_render_compta(c); }
      else if(module==='rh'){ html = IA_render_rh(c); }
      else if(module==='clients'){ html = IA_render_clients(c); }
      else if(module==='audit'){ html = IA_render_audit(c); }
      el.innerHTML = html;
      let badge = document.getElementById('iaBadge'); if(badge){ badge.innerText = String(c.aRelancer.length + c.ruptures.length); }
    }catch(err){ el.innerHTML = '<p style="color:red">IA indisponible : '+IA_esc(err.message)+'</p>'; }
  };
})();
