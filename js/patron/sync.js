// js/patron/sync.js - V6.8 FIX SÉCURISÉ ORDI COMMUN - sessionStorage + garde app ouverte
import { STATE } from "../core/state.js";
import { db } from "../core/firebase.js";

window.SHOPS_LIST = STATE.SHOPS_LIST;
window.SHOP = STATE.SHOP;
window.ALL_DATA = STATE.ALL_DATA;
window.CURRENT_CONFIG = STATE.CURRENT_CONFIG;
window.DATA_MAP = STATE.DATA_MAP;

function savePatronCache(){
  try{ localStorage.setItem('patron_cache', JSON.stringify(STATE.ALL_DATA)); }catch(e){}
}
window.savePatronCache = savePatronCache;

export function initShopsOffline(){
  let cg=JSON.parse(localStorage.getItem('patron_cache_global')||'null');
  if(cg&&cg.shops) STATE.SHOPS_LIST=cg.shops;
  if(!STATE.SHOPS_LIST.length){
    STATE.SHOPS_LIST=[];
  }
  window.SHOPS_LIST = STATE.SHOPS_LIST;
  STATE.SHOPS_LIST.forEach(s=>{
    if(!STATE.ALL_DATA[s]) STATE.ALL_DATA[s]={ventes:[],dep:[],vers:[],stock:[],entrees:[],clients:{},vendeurs:{},presence:{},logs:{}};
  });
  window.ALL_DATA = STATE.ALL_DATA;
  let sel=document.getElementById('shopSel');
  if(sel) sel.innerHTML=STATE.SHOPS_LIST.map(s=>`<option ${s===STATE.SHOP?'selected':''} value="${s}">${s}</option>`).join('')+'<option value="ALL">TOUTES</option>';
  if(window.updateLabels) updateLabels();
  if(window.refreshAll) refreshAll();
  STATE.PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+STATE.SHOP)||'[]');
  window.PANIER_ACHAT = STATE.PANIER_ACHAT;
  if(window.renderAchatStock) window.renderAchatStock();
  if(window.renderPanierAchat) window.renderPanierAchat();
}

export async function initShops(){
  console.log("🔄 initShops V6.8 SÉCURISÉ ORDI COMMUN");
  
  // FIX CRITIQUE: lit sessionStorage d'abord
  let pin = sessionStorage.getItem('BATEKE_PIN') 
         || sessionStorage.getItem('pin')
         || localStorage.getItem('BATEKE_PIN') 
         || localStorage.getItem('pin');
         
  let role = sessionStorage.getItem('BATEKE_ROLE') 
          || localStorage.getItem('BATEKE_ROLE');
          
  if(!pin && role!=='superadmin'){
    console.log("🛑 initShops bloqué: pas de PIN ni session - login requis");
    let loginDiv = document.getElementById('loginPat');
    if(loginDiv) loginDiv.style.display='flex';
    let loader = document.getElementById('appLoader');
    if(loader) loader.style.display='none';
    return;
  }
  
  if(pin==='SUPERADMIN' || role==='superadmin'){
    pin='SUPERADMIN';
  }
  
  let mesBoutiques = [];
  try{
    if(!firebase.auth().currentUser) await firebase.auth().signInAnonymously();
    if(pin!=='SUPERADMIN'){
      let pSnap = await db.ref('patrons/'+pin).once('value');
      if(pSnap.exists()){
        let patron = pSnap.val();
        if(patron.boutiques) mesBoutiques = Object.keys(patron.boutiques);
        else if(patron.boutique) mesBoutiques = [patron.boutique];
        mesBoutiques = mesBoutiques.map(b=> b==="Itendance"?"Intendance":b.trim());
        mesBoutiques = [...new Set(mesBoutiques)];
        console.log(`✅ Patron ${pin} autorisé:`, mesBoutiques);
      } else {
        if(role==='superadmin'){
          console.log("👑 SUPERADMIN - chargement tous shops");
          db.ref('shops').once('value').then(snap=>{
            let data=snap.val()||{};
            mesBoutiques=Object.keys(data);
            lancerEcoute(mesBoutiques);
          });
          return;
        } else {
          console.log(`🛑 PIN ${pin} introuvable en DB`);
          sessionStorage.clear();
          localStorage.removeItem('BATEKE_PIN');
          document.getElementById('loginPat').style.display='flex';
          let msg=document.getElementById('msgPat');
          if(msg){ msg.innerText=`❌ PIN ${pin} INTROUVABLE`; msg.style.color='red'; }
          return;
        }
      }
    } else {
      db.ref('shops').once('value').then(snap=>{
        let data=snap.val()||{};
        mesBoutiques=Object.keys(data);
        console.log("👑 SUPERADMIN boutiques:", mesBoutiques);
        lancerEcoute(mesBoutiques);
      });
      return;
    }
  }catch(e){
    console.error("Erreur get patron, on garde app ouverte avec cache:", e);
    let cached = JSON.parse(localStorage.getItem('patron_cache')||'{}');
    mesBoutiques = Object.keys(cached);
    if(mesBoutiques.length===0){
      let lastShop = sessionStorage.getItem('BATEKE_BOUTIQUE') || localStorage.getItem('BATEKE_SHOP') || 'BOUTIQUE1';
      mesBoutiques = [lastShop];
    }
  }
  
  if(mesBoutiques.length===0){
    console.log("🛑 Aucune boutique pour ce patron - affiche message mais reste connecté");
    let listEl = document.getElementById('listShops');
    if(listEl) listEl.innerHTML='<p style="color:red">Aucune boutique assignée. Contact DG au +243.</p>';
    return;
  }
  
  lancerEcoute(mesBoutiques);
  
  function lancerEcoute(list){
    STATE.SHOPS_LIST = list;
    window.SHOPS_LIST = list;
    let savedShop = sessionStorage.getItem('BATEKE_BOUTIQUE') || localStorage.getItem('patron_shop') || localStorage.getItem('BATEKE_SHOP');
    if(!savedShop || !list.includes(savedShop)){
      STATE.SHOP = list[0];
      window.SHOP = list[0];
      sessionStorage.setItem('BATEKE_BOUTIQUE', list[0]);
      localStorage.setItem('patron_shop', list[0]);
      localStorage.setItem('BATEKE_SHOP', list[0]);
    } else {
      STATE.SHOP = savedShop;
      window.SHOP = savedShop;
      sessionStorage.setItem('BATEKE_BOUTIQUE', savedShop);
    }
    
    list.forEach(s=>{
      if(!STATE.ALL_DATA[s]) STATE.ALL_DATA[s]={ventes:[],dep:[],vers:[],stock:[],entrees:[],clients:{},vendeurs:{},presence:{},logs:{}};
      listenShop(s);
    });
    window.ALL_DATA = STATE.ALL_DATA;
    let sel=document.getElementById('shopSel');
    if(sel){
      sel.innerHTML=list.map(s=>`<option ${s===STATE.SHOP?'selected':''} value="${s}">${s}</option>`).join('');
      if(list.length>1) sel.innerHTML+='<option value="ALL">TOUTES</option>';
    }
    
    if(window.renderBoutiques) {
      db.ref('shops').once('value').then(snap=>{
        let allData=snap.val()||{};
        let filtered={};
        list.forEach(b=>{ if(allData[b]) filtered[b]=allData[b]; });
        window.renderBoutiques(filtered);
      });
    }
    if(window.updateLabels) updateLabels();
    if(window.refreshAll) refreshAll();
    if(window.loadConfig) window.loadConfig();
    savePatronCache();
  }
}

export function switchShop(){
  let sel=document.getElementById('shopSel');
  STATE.SHOP = sel.value;
  window.SHOP = STATE.SHOP;
  sessionStorage.setItem('BATEKE_BOUTIQUE', STATE.SHOP);
  localStorage.setItem('patron_shop', STATE.SHOP);
  STATE.PANIER_ACHAT=JSON.parse(localStorage.getItem('panier_achat_'+STATE.SHOP)||'[]');
  window.PANIER_ACHAT = STATE.PANIER_ACHAT;
  if(window.updateLabels) window.updateLabels();
  if(window.refreshAll) window.refreshAll();
  if(window.renderAchatStock) window.renderAchatStock();
  if(window.renderPanierAchat) window.renderPanierAchat();
}

function listenShop(s){
  db.ref('shops/'+s+'/stock').on('value',snap=>{
    STATE.ALL_DATA[s].stock=Object.values(snap.val()||{});
    savePatronCache();
    if(STATE.SHOP===s||STATE.SHOP==='ALL'){
      if(window.renderStock) window.renderStock();
      if(window.renderAchatStock) window.renderAchatStock();
      if(window.updateKPIs) window.updateKPIs();
    }
  });
  db.ref('shops/'+s+'/ventes').on('value',snap=>{
    let raw=snap.val()||{};
    STATE.ALL_DATA[s].ventes=Object.entries(raw).map(([k,v])=>({...v,_id:k,_shop:s}));
    savePatronCache();
    if(STATE.SHOP===s||STATE.SHOP==='ALL'){
      if(window.renderVentes) window.renderVentes();
      if(window.updateKPIs) window.updateKPIs();
      if(window.renderCaisse) window.renderCaisse();
      if(window.renderCRM) window.renderCRM();
      if(window.renderDettes) window.renderDettes();
    }
  });
  db.ref('shops/'+s+'/depenses').on('value',snap=>{
    let raw=snap.val()||{};
    STATE.ALL_DATA[s].dep=Object.entries(raw).map(([k,v])=>({...v,_id:k}));
    savePatronCache();
  });
  db.ref('shops/'+s+'/entrees').on('value',snap=>{
    let raw=snap.val()||{};
    STATE.ALL_DATA[s].entrees=Object.entries(raw).map(([k,v])=>({...v,_id:k,_shop:s}));
    savePatronCache();
  });
  db.ref('shops/'+s+'/vendeurs').on('value',snap=>{
    STATE.ALL_DATA[s].vendeurs=snap.val()||{};
    savePatronCache();
    if(STATE.SHOP===s && window.renderVendeurs) window.renderVendeurs();
    if(window.renderPresenceKPI) renderPresenceKPI();
  });
  db.ref('shops/'+s+'/config_entreprise').on('value',snap=>{
    if(snap.val()){
      let c=snap.val();
      STATE.CURRENT_CONFIG={...STATE.CURRENT_CONFIG,...c,compta:{...STATE.CURRENT_CONFIG.compta,...(c.compta||{})}};
      window.CURRENT_CONFIG = STATE.CURRENT_CONFIG;
      if(window.applyConfigToUI) window.applyConfigToUI();
      savePatronCache();
    }
  });
  db.ref('shops/'+s+'/presence').on('value',snap=>{
    STATE.ALL_DATA[s].presence=snap.val()||{};
    savePatronCache();
    if(window.renderPresenceKPI) renderPresenceKPI();
  });
  db.ref('shops/'+s+'/versements').on('value',snap=>{
    let raw=snap.val()||{};
    STATE.ALL_DATA[s].vers=Object.entries(raw).map(([k,v])=>({...v,_id:k}));
    savePatronCache();
  });
  db.ref('shops/'+s+'/logs').on('value',snap=>{
    STATE.ALL_DATA[s].logs=snap.val()||{};
    savePatronCache();
  });
}

export function updateLabels(){
  if(document.getElementById('labVenteShop')) document.getElementById('labVenteShop').innerText=STATE.SHOP;
  if(document.getElementById('labVendShop')) document.getElementById('labVendShop').innerText=STATE.SHOP;
  if(document.getElementById('presenceShopLab')) document.getElementById('presenceShopLab').innerText=STATE.SHOP;
  if(document.getElementById('lienV')) document.getElementById('lienV').innerText='https://aiseodon-ai.github.io/bateke/vendeur.html?shop='+STATE.SHOP;
  if(document.getElementById('paramShopName')) document.getElementById('paramShopName').innerText=STATE.SHOP;
  if(document.getElementById('headerEntreprise')) document.getElementById('headerEntreprise').innerHTML=(window.isSuperAdmin?'👑 SUPER - ':'👑 ')+(STATE.CURRENT_CONFIG.nom||'ETS BATEKE')+' - '+STATE.SHOP+' - 🟢 SYNC';
}

export function getFiltered(){
  if(STATE.SHOP==='ALL'){
    let agg={ventes:[],dep:[],vers:[],stock:[],entrees:[]};
    STATE.SHOPS_LIST.forEach(s=>{
      let d=STATE.ALL_DATA[s]||{};
      agg.ventes=[...agg.ventes,...(d.ventes||[])];
      agg.dep=[...agg.dep,...(d.dep||[])];
      agg.stock=[...agg.stock,...(d.stock||[])];
      agg.entrees=[...agg.entrees,...(d.entrees||[]).map(e=>({...e,_shop:s}))];
    });
    return agg;
  }else{
    let d=STATE.ALL_DATA[STATE.SHOP]||{ventes:[],dep:[],vers:[],stock:[],entrees:[]};
    let versRaw=STATE.ALL_DATA[STATE.SHOP]?.vers||[];
    return {...d,vers:versRaw.map(v=>({...v,_shop:STATE.SHOP})),entrees:(d.entrees||[]).map(e=>({...e,_shop:STATE.SHOP}))};
  }
}

export function updateKPIs(){
  let data=getFiltered();
  let today=new Date().toDateString();
  let vToday=data.ventes.filter(v=>new Date(v.date).toDateString()===today);
  let caJ=vToday.reduce((s,v)=>s+(v.total||0),0);
  if(document.getElementById('caJour')) document.getElementById('caJour').innerText=caJ.toLocaleString()+' FC';
  if(document.getElementById('caJourDetail')) document.getElementById('caJourDetail').innerText='Encaissé: '+vToday.reduce((s,v)=>s+(v.montantPaye??v.total),0).toLocaleString();
  if(document.getElementById('benefJour')) document.getElementById('benefJour').innerText=(vToday.reduce((s,v)=>s+(v.benefice||0),0)-data.dep.filter(d=>new Date(d.date).toDateString()===today).reduce((s,d)=>s+d.montant,0)).toLocaleString()+' FC';
  if(document.getElementById('aVerser')) document.getElementById('aVerser').innerText=document.getElementById('caJourDetail')?.innerText||'0';
  if(document.getElementById('detteJour')) document.getElementById('detteJour').innerText=vToday.reduce((s,v)=>s+(v.reste||0),0).toLocaleString()+' FC';
}
export function fmtVu(ts){if(!ts)return'jamais';let diff=Date.now()-ts;let m=Math.floor(diff/60000);if(m<1)return"à l'instant";if(m<60)return'il y a '+m+'m';let h=Math.floor(m/60);if(h<24)return'il y a '+h+'h';return new Date(ts).toLocaleDateString();}
export function renderPresenceKPI(){
  let s=STATE.SHOP; if(s==='ALL') s=STATE.SHOPS_LIST[0];
  let vends=STATE.ALL_DATA[s]?.vendeurs||{}; let pres=STATE.ALL_DATA[s]?.presence||{};
  let html=Object.entries(vends).map(([pin,v])=>{
    let p=pres[pin]||{}; let online=p.online===true&&Date.now()-(p.lastSeen||0)<300000;
    return `<div style="background:${online?'#dcfce7':'#fee2e2'};padding:6px 12px;border-radius:20px;font-size:12px"><span class="presence-dot ${online?'online':'offline'}"></span><b>${window.esc?window.esc(v.nom||pin):v.nom||pin}</b> ${online?'🟢 En ligne':'🔴 Hors ligne'} • ${fmtVu(p.lastSeen)}</div>`;
  }).join('');
  let box=document.getElementById('presenceKPIList'); if(box) box.innerHTML=html||'<small>Aucun vendeur</small>';
}
export function refreshAll(){
  updateLabels(); updateKPIs(); renderPresenceKPI();
  if(window.renderVentes) window.renderVentes();
  if(window.renderStock) window.renderStock();
  if(window.renderAchatStock) window.renderAchatStock();
  if(window.renderPanierAchat) window.renderPanierAchat();
  if(window.renderCaisse) window.renderCaisse();
  if(window.renderCRM) window.renderCRM();
  if(window.renderDettes) window.renderDettes();
  if(window.renderVendeurs) window.renderVendeurs();
  if(window.renderBoutiques) window.renderBoutiques(STATE.ALL_DATA);
}

window.initShops=initShops;
window.initShopsOffline=initShopsOffline;
window.switchShop=switchShop;
window.updateLabels=updateLabels;
window.getFiltered=getFiltered;
window.updateKPIs=updateKPIs;
window.renderPresenceKPI=renderPresenceKPI;
window.refreshAll=refreshAll;
window.fmtVu=fmtVu;

console.log("✅ SYNC.JS V6.8 ORDI COMMUN FIXÉ");
