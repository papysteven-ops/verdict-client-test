
"use strict";

/* ---------- donn&eacute;es ---------- */
var KEY_PREFIX="verdict:inv:compte:v2:", SAVE=true;
var DEMO=false, OPEN_ACCESS=false;
var SHARED=new URLSearchParams(location.search+(self.__vdq||"")).get("shared")==="1";
var STAFF=false, STAFF_ROLE="", STAFF_ZONES=[], STAFF_PERMISSIONS=[], STAFF_ESTABLISHMENT="", STAFF_PROFILE_INCOMPLETE=false, OWNER_TEAM=false, OWNER_TEAM_EST="";
try{ DEMO=new URLSearchParams(location.search+(self.__vdq||"")).get("demo")==="1"; }catch(e){}
try{
  var staffParams=new URLSearchParams(location.search+(self.__vdq||"")),allowedZones={kitchen:1,bar:1,cellar:1},allowedPermissions={count_stock:1,edit_catalog:1,view_prices:1,edit_prices:1,view_suppliers:1,edit_suppliers:1,view_orders:1,edit_orders:1,view_analysis:1};
  STAFF=staffParams.get("staff")==="1";STAFF_ROLE=(staffParams.get("role")||"").slice(0,32);
  STAFF_ZONES=(staffParams.get("zones")||"").split(",").filter(function(value){return !!allowedZones[value];});
  STAFF_PERMISSIONS=(staffParams.get("permissions")||"").split(",").filter(function(value){return !!allowedPermissions[value];});
  STAFF_ESTABLISHMENT=(staffParams.get("establishment")||"").replace(/[^A-Za-z0-9._:-]/g,"").slice(0,96);
  OWNER_TEAM=staffParams.get("ownerTeam")==="1";OWNER_TEAM_EST=(staffParams.get("teamEstablishment")||"").replace(/[^A-Za-z0-9._:-]/g,"").slice(0,96);
  OPEN_ACCESS=staffParams.get("openAccess")==="1";
  STAFF_PROFILE_INCOMPLETE=!!(STAFF&&(!STAFF_ROLE||!STAFF_ZONES.length||!STAFF_PERMISSIONS.length||(!DEMO&&!STAFF_ESTABLISHMENT)));
}catch(e){STAFF_PROFILE_INCOMPLETE=STAFF;}
/* C229 (X36) : lien de l'équipe (?equipe=<établissement>, posé par la coque). Mode personnel, tout refusé par défaut ; les droits
   viennent du serveur (rôle donné par le patron dans Compte › Équipe) ; jamais l'inventaire ouvert de cet appareil. */
var EQUIPE_ETAB="",EQUIPE_ORG="",EQUIPE_CSRF="";
try{EQUIPE_ETAB=String(new URLSearchParams(location.search+(self.__vdq||"")).get("equipe")||"").replace(/[^A-Za-z0-9._:-]/g,"").slice(0,96);}catch(e){EQUIPE_ETAB="";}
if(EQUIPE_ETAB){STAFF=true;STAFF_ESTABLISHMENT=EQUIPE_ETAB;STAFF_ROLE="equipe";STAFF_ZONES=["kitchen","bar"];STAFF_PERMISSIONS=["count_stock"];OPEN_ACCESS=false;OWNER_TEAM=false;STAFF_PROFILE_INCOMPLETE=false;}
try{ localStorage.setItem("t","1"); localStorage.removeItem("t"); }catch(e){ SAVE=false; }

function staffCan(permission){return !STAFF||STAFF_PERMISSIONS.indexOf(permission)>=0;}
function staffCanProducts(){return !STAFF||staffCan("edit_catalog")||staffCan("view_prices")||staffCan("edit_prices")||staffCan("view_suppliers")||staffCan("edit_suppliers")||staffCan("view_orders")||staffCan("edit_orders");}
function staffSetVisible(selector,visible){var nodes=document.querySelectorAll(selector);Array.prototype.forEach.call(nodes,function(node){node.style.display=visible?"":"none";});}
function staffRejectIncompleteProfile(){
  var splash=document.getElementById("splash");if(splash)splash.style.display="none";
  staffSetVisible(".top,.seg,.demo-banner,.lvl,.view,nav,#welcome,.modal",false);
  var gate=document.getElementById("authGate");if(!gate)return;
  gate.style.display="flex";gate.setAttribute("role","alert");gate.setAttribute("aria-live","assertive");
  gate.innerHTML='<div style="max-width:420px;width:100%;padding:24px;border:1px solid #7f1d1d;border-radius:18px;background:#151012;box-shadow:0 24px 70px rgba(0,0,0,.45)"><div style="color:#fca5a5;font:800 11px/1.2 var(--mono);letter-spacing:.12em;text-transform:uppercase">Accès personnel refusé</div><h1 style="margin:12px 0 8px;font-size:24px">Ce lien n’est plus assez précis</h1><p style="color:#c7cbd1;line-height:1.55">Par sécurité, aucun droit implicite n’est accordé. Demandez au gérant un nouveau lien indiquant l’établissement, la zone et les fonctions autorisées.</p><button type="button" onclick="if(history.length>1)history.back();else location.replace(location.pathname)" style="width:100%;min-height:48px;margin-top:18px;border:1px solid #4b5563;border-radius:12px;background:#1a1e24;color:#fff;font-weight:800">Fermer cet accès</button></div>';
  try{window.parent.postMessage({type:"verdict-stock-submission-result",ok:false,error:"Accès ancien ou incomplet refusé. Demandez un nouveau lien au gérant."},(location.origin==="null"?"*":location.origin));}catch(e){}
}
function staffAllowedInventoryZones(){
  var allowed=[];
  if(STAFF_ZONES.indexOf("kitchen")>=0)allowed.push("cuisine");
  if(STAFF_ZONES.indexOf("bar")>=0||STAFF_ZONES.indexOf("cellar")>=0)allowed.push("bar");
  return allowed;
}
function applyStaffZoneScope(){
  /* C229 (X36) : en équipe, les zones viennent du serveur ; rien n'est retiré du document (il repart au compte du patron). */
  if(!STAFF||!DB||!DB.spaces||EQUIPE_ETAB)return;
  var allowed=staffAllowedInventoryZones();if(!allowed.length)allowed=["cuisine"];
  Object.keys(DB.spaces).forEach(function(key){
    var kind=DB.meta&&DB.meta[key]&&DB.meta[key].kind;
    var canonical=kind==="bar"?"bar":kind==="cuisine"?"cuisine":key;
    if((canonical==="cuisine"||canonical==="bar")&&allowed.indexOf(canonical)<0){delete DB.spaces[key];if(DB.meta)delete DB.meta[key];}
  });
  if(DB.sites)Object.keys(DB.sites).forEach(function(siteId){var site=DB.sites[siteId];if(site&&Array.isArray(site.zones))site.zones=site.zones.filter(function(key){return !!DB.spaces[key];});});
  if(Array.isArray(DB.list))DB.list=DB.list.filter(function(key){return !!DB.spaces[key];});
  var visible=spList(DB.site);if(visible.indexOf(DB.space)<0)DB.space=visible[0]||Object.keys(DB.spaces)[0]||"cuisine";
}
function applyStaffPermissions(){
  if(!STAFF)return;
  applyStaffZoneScope();
  var canCatalog=staffCan("edit_catalog"),canViewPrices=staffCan("view_prices"),canEditPrices=staffCan("edit_prices"),canViewSuppliers=staffCan("view_suppliers"),canEditSuppliers=staffCan("edit_suppliers"),canViewOrders=staffCan("view_orders"),canEditOrders=staffCan("edit_orders"),canAnalysis=staffCan("view_analysis");
  staffSetVisible('[data-v="order"]',canViewOrders);staffSetVisible('[data-v="stats"]',canAnalysis);staffSetVisible('#verdictTransferBlock',false);
  staffSetVisible('.lvl',canEditOrders);
  staffSetVisible('#staffOrderReadOnly',canViewOrders&&!canEditOrders);
  staffSetVisible('#staffOwnerTools,#staffBackupTools,#staffAccountTools',false);
  staffSetVisible('#staffCatalogAdd',canCatalog);staffSetVisible('#staffManageProducts',canCatalog||canViewPrices||canViewSuppliers||canViewOrders||canEditPrices||canEditSuppliers||canEditOrders);
  staffSetVisible('.staff-price-field',canViewPrices);staffSetVisible('.staff-supplier-field',canViewSuppliers);staffSetVisible('.staff-order-field',canViewOrders);
  Array.prototype.forEach.call(document.querySelectorAll('.staff-catalog-field input'),function(input){input.disabled=!canCatalog;});
  var price=document.getElementById('pPrice'),supplier=document.getElementById('pSup');if(price)price.disabled=!canEditPrices;if(supplier)supplier.disabled=!canEditSuppliers;
  Array.prototype.forEach.call(document.querySelectorAll('.staff-order-field input'),function(input){input.disabled=!canEditOrders;});
  Array.prototype.forEach.call(document.querySelectorAll('#v-order button,#v-order input,#v-order select,#v-order textarea'),function(control){if(!canEditOrders){control.disabled=true;control.setAttribute('aria-disabled','true');}});
  Array.prototype.forEach.call(document.querySelectorAll('#v-stats button,#v-stats input,#v-stats select,#v-stats textarea'),function(control){control.disabled=true;control.setAttribute('aria-disabled','true');});
  staffSetVisible('#pOrderingExtra',false);staffSetVisible('#pBarExtra',canCatalog);
  Array.prototype.forEach.call(document.querySelectorAll('#mSuppliers input,#mSuppliers select,#mSuppliers textarea,#mSupplier input,#mSupplier select,#mSupplier textarea,#mRule input,#mRule select,#mRule textarea'),function(control){control.disabled=!canEditSuppliers;});
  Array.prototype.forEach.call(document.querySelectorAll('#mSuppliers button,#mSupplier button,#mRule button'),function(control){var label=(control.textContent||'').trim().toLowerCase();if(!canEditSuppliers&&label!=="fermer"&&label!=="annuler"){control.disabled=true;control.setAttribute('aria-disabled','true');}});
  var saveButton=document.getElementById('staffProductSave'),deleteButton=document.getElementById('pDel');if(saveButton)saveButton.style.display=(canCatalog||canEditPrices||canEditSuppliers||canEditOrders)?'':'none';if(deleteButton&&!canCatalog)deleteButton.style.display='none';
  if((VIEW==='order'&&!canViewOrders)||(VIEW==='stats'&&!canAnalysis)||(VIEW==='prod'&&!(canCatalog||canViewPrices||canViewSuppliers||canViewOrders||canEditPrices||canEditSuppliers||canEditOrders)))VIEW='count';
}

var DB={space:"cuisine",site:"site1",spaces:{},meta:{},list:[],sites:{},siteList:[]};
var EMOJIS=["\ud83c\udf73","\ud83c\udf78","\ud83c\udf55","\ud83e\udd50","\ud83c\udf54","\ud83c\udf5c","\ud83c\udf70","\ud83d\udce6"];
var VIEW="count";

var SEED={
  cuisine:[["Guacamole","Metro","seau",8,3,8.98],["Pain burger","Boulangerie","paquet",6,2,4.20],
    ["Steak haché","Boucher","kg",12,4,11.90],["Frites","Metro","sac",10,3,7.45],
    ["Salade","Primeur","kg",4,1,3.10],["Tomates","Primeur","kg",5,2,2.40],
    ["Cheddar","Metro","kg",4,1,9.60],["Sauce burger","Metro","bidon",3,1,15.50]],
  bar:[["Gin","Cave","btl",5,2,18],["Vodka","Cave","btl",5,2,14],["Whisky","Cave","btl",4,2,20],
    ["Vin rouge","Cave","btl",14,6,5],["Bière fût","Brasseur","fût",3,1,90],
    ["Coca","Boissons","casier",5,2,12],["Jus d'orange","Boissons","btl",8,3,4],["Citrons","Primeur","kg",3,1,2.50]]
};

function newSpace(kind,withExample){
  var src=SEED[kind]||SEED.cuisine;
  if(!withExample) return {products:[]};
  return {products:src.map(function(x){
    return {id:uid(),name:x[0],sup:x[1],unit:x[2],goal:x[3],min:x[4],price:x[5],stock:null,pack:1,minOrder:0,leadDays:0,shelfLifeDays:0};
  })};
}
function blankDB(withExample){
  var contract=window.VERDICT_BRASSERIE_INVENTORY_DEMO;
  if(withExample&&DEMO){
    if(!contract||typeof contract.createDatabase!=='function')throw new Error('Contrat Brasserie fictive indisponible');
    // R239 : la démonstration montre un comptage FICTIF COMPLET (51/51, valeurs, fournisseurs),
    // comme avant R235. Un vrai client (hors DEMO) démarre toujours sans quantité (règle R235 conservée).
    var counting=contract.createDatabase(new Date()),demoCountedAt=new Date().toISOString();
    Object.keys(counting.spaces).forEach(function(k){counting.spaces[k].products.forEach(function(p){
      var unitCount=/^(unite|unit|pi[eè]ce|btl|bouteille)$/i.test(String(p.unit||''));
      p.stock=(typeof p.stock==='number'&&isFinite(p.stock))?(unitCount?Math.round(p.stock):Math.round(p.stock*100)/100):null;
      p.countedAt=p.stock===null?null:demoCountedAt;p.countedBy=null;
      p.goal=Math.round(p.goal);p.min=Math.round(p.min);
    });});
    return counting;
  }
  var sid=withExample?"demo-brasserie":"site1";
  var o={schema:2,site:sid,space:"cuisine",spaces:{},meta:{},list:["cuisine","bar"],sites:{},siteList:[sid],
    level:"normale",profile:{done:!!withExample,prenom:""},snapshots:[],priceHistory:[],vdPrecBySite:{},demandBridge:null,operationsBySite:{}};
  o.sites[sid]={name:withExample?"Brasserie Collet":"Mon &eacute;tablissement",emo:"\ud83c\udfea",zones:["cuisine","bar"],establishmentId:sid};
  o.spaces.cuisine=newSpace("cuisine",withExample); o.spaces.bar=newSpace("bar",withExample);
  o.meta.cuisine={name:"Cuisine",emo:"\ud83c\udf73",site:sid,kind:"cuisine"};
  o.meta.bar={name:"Bar",emo:"\ud83c\udf78",site:sid,kind:"bar"};
  if(withExample){
    Object.keys(o.spaces).forEach(function(k){ o.spaces[k].products.forEach(function(p,i){ p.stock=null; }); });
  }
  return o;
}
function siteRowsForDemo(o,sid){var out=[];((o.sites[sid]||{}).zones||[]).forEach(function(k){((o.spaces[k]||{}).products||[]).forEach(function(p){out.push({p:p,space:k,site:sid});});});return out;}
function migrate(o){
  if(!o||typeof o!=="object"||!o.spaces||typeof o.spaces!=="object"||Array.isArray(o.spaces)) return blankDB(false);
  if(o.schema>=2&&o.sites&&typeof o.sites==="object"&&Array.isArray(o.siteList)){
    o.siteList=o.siteList.filter(function(k){ return typeof k==="string"&&o.sites[k]&&Array.isArray(o.sites[k].zones); });
    if(!o.siteList.length)return blankDB(false);
    if(!Array.isArray(o.snapshots))o.snapshots=[]; else o.snapshots=o.snapshots.slice(-120);
    if(!Array.isArray(o.priceHistory))o.priceHistory=[]; else o.priceHistory=o.priceHistory.slice(-200);
    if(!o.vdPrecBySite||typeof o.vdPrecBySite!=="object")o.vdPrecBySite={};
    if(o.demandBridge===undefined)o.demandBridge=null;
    if(!o.operationsBySite||typeof o.operationsBySite!=="object"||Array.isArray(o.operationsBySite))o.operationsBySite={};
    if(!o.site||!o.sites[o.site])o.site=o.siteList[0];
    var zs=(o.sites[o.site]&&o.sites[o.site].zones)||[]; if(zs.indexOf(o.space)<0)o.space=zs[0]||Object.keys(o.spaces)[0];
    return o;
  }
  /* migration V1 : Cuisine/Bar deviennent les zones du premier &eacute;tablissement ;
     les anciens espaces ajout&eacute;s sont conserv&eacute;s comme &eacute;tablissements s&eacute;par&eacute;s. */
  if(!o.meta||typeof o.meta!=="object")o.meta={}; if(!Array.isArray(o.list)||!o.list.length)o.list=Object.keys(o.spaces);
  var site1="site1", zones=[], nm="Mon &eacute;tablissement";
  if(o.spaces.cuisine){ zones.push("cuisine"); if(o.meta.cuisine&&o.meta.cuisine.name&&o.meta.cuisine.name!=="Cuisine")nm=o.meta.cuisine.name; o.meta.cuisine={name:"Cuisine",emo:"\ud83c\udf73",site:site1,kind:"cuisine"}; }
  if(o.spaces.bar){ zones.push("bar"); o.meta.bar={name:"Bar",emo:"\ud83c\udf78",site:site1,kind:"bar"}; }
  if(!zones.length){ var first=o.list[0]||"cuisine"; if(!o.spaces[first])o.spaces[first]={products:[]}; zones=[first]; }
  o.sites={}; o.siteList=[]; o.sites[site1]={name:nm,emo:"\ud83c\udfea",zones:zones}; o.siteList.push(site1);
  o.list.forEach(function(k){
    if(zones.indexOf(k)>=0||!o.spaces[k])return;
    var sid="m_"+k, old=o.meta[k]||{};
    o.sites[sid]={name:old.name||"&Eacute;tablissement",emo:old.emo||"\ud83c\udfea",zones:[k]}; o.siteList.push(sid);
    o.meta[k]={name:"Cuisine",emo:"\ud83c\udf73",site:sid,kind:"cuisine"};
  });
  var current=o.space, found=site1;
  o.siteList.forEach(function(s){ if((o.sites[s].zones||[]).indexOf(current)>=0)found=s; });
  o.site=found; o.list=Object.keys(o.spaces); o.schema=2;
  if(!o.snapshots)o.snapshots=[]; if(!o.priceHistory)o.priceHistory=[]; if(!o.vdPrecBySite)o.vdPrecBySite={}; if(!o.operationsBySite)o.operationsBySite={};
  return o;
}
function SP(){ if(!DB.spaces[DB.space]) DB.spaces[DB.space]={products:[]}; return DB.spaces[DB.space]; }
function spName(k){ return (DB.meta[k]&&DB.meta[k].name)||k; }
function spEmo(k){ return (DB.meta[k]&&DB.meta[k].emo)||"\ud83d\udce6"; }
function siteList(){ return (DB.siteList&&DB.siteList.length)?DB.siteList:Object.keys(DB.sites||{}); }
function siteName(k){ return (DB.sites&&DB.sites[k]&&clean(DB.sites[k].name))||"Mon &eacute;tablissement"; }
function siteEmo(k){ return (DB.sites&&DB.sites[k]&&DB.sites[k].emo)||"\ud83c\udfea"; }
function spList(sid){ var s=(DB.sites&&DB.sites[sid||DB.site]); return s&&s.zones?s.zones.filter(function(k){return !!DB.spaces[k];}):[]; }
function siteRows(sid){ var out=[]; spList(sid).forEach(function(k){ (DB.spaces[k].products||[]).forEach(function(p){ out.push({p:p,space:k,site:sid||DB.site}); }); }); return out; }
function drawSpaces(){
  var se=document.getElementById("siteSeg"), el=document.getElementById("zoneSeg"); if(!se||!el)return;
  if(STAFF)applyStaffZoneScope();
  se.innerHTML=siteList().map(function(k){
    return '<button data-site="'+esc(k)+'" class="'+(k===DB.site?"on":"")+'" onclick="setSite(this.dataset.site)">'+
      '<span class="e">'+siteEmo(k)+'</span>'+esc(siteName(k))+'</button>';
  }).join("")+((DEMO||STAFF||OWNER_TEAM)?'':'<button class="add" onclick="openSpace()" title="Ajouter un &eacute;tablissement">+</button>');
  el.innerHTML=spList().map(function(k){
    return '<button data-sp="'+esc(k)+'" class="'+(k===DB.space?"on":"")+'" onclick="setSpace(this.dataset.sp)">'+
      '<span class="e">'+spEmo(k)+'</span>'+esc(spName(k))+'</button>';
  }).join("");
}
function uid(){ return "p"+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
function clean(s){ if(typeof s!=="string"||s.indexOf("&")<0)return s;
  var d=document.createElement("textarea"); d.innerHTML=s; return d.value; }
function accountKey(){ return STAFF?null:(ACCOUNT_ID?KEY_PREFIX+ACCOUNT_ID:null); }
function syncMetaKey(){ return STAFF?null:(ACCOUNT_ID?KEY_PREFIX+ACCOUNT_ID+":sync":null); }
function cleanDB(){
  var txt=function(v,n){ return clean(String(v==null?"":v)).slice(0,n); };
  var number=function(v,allowNull){ var n=num(v); return n==null?(allowNull?null:0):n; };
  Object.keys(DB.spaces||{}).forEach(function(k){
    var sp=DB.spaces[k]; if(!sp||!Array.isArray(sp.products)){ DB.spaces[k]={products:[]}; return; }
    sp.products=sp.products.slice(0,5000).filter(function(p){return p&&typeof p==="object";});
    sp.products.forEach(function(p){
      p.id=txt(p.id||uid(),96); p.name=txt(p.name,160); p.sup=txt(p.sup,160); p.unit=txt(p.unit,40);
      p.goal=number(p.goal,false); p.min=number(p.min,false); /* C217 W60 : un prix vide reste vide (facultatif), jamais 0 € ; un ancien « 0 » redevient « inconnu » */p.price=number(p.price,true);if(p.price===0)p.price=null;
      p.pack=Math.max(.0001,number(p.pack,false)||1);p.minOrder=number(p.minOrder,false);p.leadDays=Math.min(60,number(p.leadDays,false));p.shelfLifeDays=Math.min(365,number(p.shelfLifeDays,false));
      p.stock=(p.stock==null)?null:number(p.stock,true);
      var ov=p.over&&typeof p.over==="object"?p.over:{}; p.over={};
      ["calme","normale","forte","rush"].forEach(function(l){ var n=num(ov[l]); if(n!=null)p.over[l]=n; });
    });
  });
  Object.keys(DB.sites||{}).forEach(function(k){ var s=DB.sites[k]; if(!s)return;
    s.name=txt(s.name||"Mon établissement",120); if(EMOJIS.indexOf(s.emo)<0)s.emo="🏪";
  });
  Object.keys(DB.meta||{}).forEach(function(k){ var m=DB.meta[k]; if(!m)return;
    m.name=txt(m.name||"Espace",80); if(EMOJIS.indexOf(m.emo)<0)m.emo="📦";
  });
  if(DB.profile){ DB.profile.prenom=txt(DB.profile.prenom,80); }
  if(["calme","normale","forte","rush"].indexOf(DB.level)<0)DB.level="normale";
}
function inventoryPayloadIsDemo(o){
  if(!o||typeof o!=="object")return false;
  if(o.demo===true||(o._demo&&o._demo.fictional===true))return true;
  if(o.demoContract&&String(o.demoContract.establishmentId||"")==="demo-brasserie")return true;
  if(String(o.site||"")==="demo-brasserie")return true;
  if(Array.isArray(o.siteList)&&o.siteList.indexOf("demo-brasserie")>=0)return true;
  return Object.keys(o.sites||{}).some(function(k){return k==="demo-brasserie"||String((o.sites[k]||{}).establishmentId||"")==="demo-brasserie";});
}
function loadAccount(id){ if(STAFF)return false;try{ var v=localStorage.getItem(KEY_PREFIX+id); if(v){ var parsed=JSON.parse(v);if(!DEMO&&inventoryPayloadIsDemo(parsed))return false;DB=migrate(parsed); cleanDB(); return true; } }catch(e){} return false; }
var INVENTORY_LAST_SAVE_PAYLOAD="",INVENTORY_LAST_SAVE_SIGNATURE="",INVENTORY_VIEW_REVISION=1,INVENTORY_FAST_SAVE_TIMER=0;
function inventoryInvalidateViews(){INVENTORY_VIEW_REVISION++;return INVENTORY_VIEW_REVISION;}
function inventoryMarkRendered(view){var host=document.getElementById('v-'+view);if(host)host.setAttribute('data-inventory-render-revision',String(INVENTORY_VIEW_REVISION));}
function saveLocal(){
  var k=accountKey();if(!SAVE||!k||DEMO)return "disabled";
  var payload="",signature="";try{payload=JSON.stringify(DB);signature=JSON.stringify(DB,function(key,value){return key==="generatedAt"||key==="fingerprint"||(this===DB._safety&&(key==="localRev"||key==="updatedAt"))?undefined:value;});}catch(e){return "failed";}
  if(!DB._safety)DB._safety={localRev:0};
  var previousRevision=Number(DB._safety.localRev)||0,previousUpdatedAt=DB._safety.updatedAt;
  if(!navigator.locks||typeof navigator.locks.request!=='function')return "failed";
  VerdictPersistence.assertNoNewer(localStorage,k,previousRevision);
  if(signature&&signature===INVENTORY_LAST_SAVE_SIGNATURE)return "same";
  try{DB._safety.localRev=(Number(DB._safety.localRev)||0)+1;DB._safety.updatedAt=new Date().toISOString();payload=JSON.stringify(DB);localStorage.setItem(k,payload);INVENTORY_LAST_SAVE_PAYLOAD=payload;INVENTORY_LAST_SAVE_SIGNATURE=signature;return "changed";}
  catch(e){
    DB._safety.localRev=previousRevision;DB._safety.updatedAt=previousUpdatedAt;
    /* Une copie de session protège la saisie courante. save() continue ensuite
       vers le serveur au lieu d'avaler silencieusement l'erreur de quota. */
    try{sessionStorage.setItem(k+":quota-recovery",payload);if(typeof toast==="function")toast("Copie de sécurité conservée pour cette session");}
    catch(x){try{if(typeof toast==="function")toast("Stockage local saturé : téléchargez une sauvegarde");}catch(y){}}
    return "failed";
  }
}
function readSyncMeta(legacyLocal){ var k=syncMetaKey(),m=null;try{if(k)m=JSON.parse(localStorage.getItem(k)||"null");}catch(e){}m=VerdictInventorySync.normalizeMeta(m);if(legacyLocal&&!m.baseData&&!m.dirty)m.dirty=true;return m; }
function writeSyncMeta(m){ var k=syncMetaKey();if(!SAVE||!k||DEMO)return;try{localStorage.setItem(k,JSON.stringify(VerdictInventorySync.normalizeMeta(m)));}catch(e){} }
function markSyncDirty(){ if(!ACCOUNT_ID||DEMO||OPEN_ACCESS)return;var m=readSyncMeta(false);if(!m.dirty){m.dirty=true;m.changedAt=new Date().toISOString();if(!m.baseData)m.baseRev=CLOUD_REV;}writeSyncMeta(m); }
function markSyncClean(data,rev){ if(!ACCOUNT_ID||DEMO)return;writeSyncMeta({dirty:false,baseRev:Math.max(0,Number(rev)||0),baseData:VerdictInventorySync.clone(data),changedAt:""}); }
function save(alreadyInvalidated){
  if(INVENTORY_FAST_SAVE_TIMER){clearTimeout(INVENTORY_FAST_SAVE_TIMER);INVENTORY_FAST_SAVE_TIMER=0;}
  if(!alreadyInvalidated)inventoryInvalidateViews();
  if(DEMO)return {status:"temporary",committed:false};
  if(EQUIPE_ETAB)return {status:"same",committed:true};/* C238 : équipe — comptage gardé sur l'onglet, envoyé au « Terminer » */
  var state=saveLocal();if(state==="same"||state==="disabled")return {status:state,committed:state==="same"};cloudSave();return {status:state,committed:state==="changed"};
}
function scheduleInventoryFastSave(){
  clearTimeout(INVENTORY_FAST_SAVE_TIMER);
  INVENTORY_FAST_SAVE_TIMER=setTimeout(function(){INVENTORY_FAST_SAVE_TIMER=0;save(true);},140);
}
function flushInventoryFastSave(){
  if(!INVENTORY_FAST_SAVE_TIMER)return;
  clearTimeout(INVENTORY_FAST_SAVE_TIMER);INVENTORY_FAST_SAVE_TIMER=0;save(true);
}
window.addEventListener('pagehide',flushInventoryFastSave,{passive:true});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flushInventoryFastSave();});
var API=STAFF?"/api/team/inventory":(OWNER_TEAM?"/api/team/owner-inventory":(typeof window.VERDICT_INVENTORY_API==='string'&&window.VERDICT_INVENTORY_API.trim()?window.VERDICT_INVENTORY_API.trim():"/inventaire/api.php")), AUTHED=false, ACCOUNT_ID=null, ACCOUNT_USER=null, ACCOUNT_CSRF="", CLOUD_REV=0, saveT=null, syncRetryT=null, syncRetryDelay=1200, SYNCING=false, SYNC_DIRTY=false;
/* C229 (X36) : en équipe, l'Inventaire de l'établissement passe par le compte (/api/workspace), selon les droits du serveur. */
function equipePost(p,body,avecJeton){var h={'Content-Type':'application/json'};if(avecJeton&&EQUIPE_CSRF)h['X-CSRF-Token']=EQUIPE_CSRF;return fetch(new URL('../../api/'+p,location.href).pathname,{method:'POST',credentials:'same-origin',cache:'no-store',headers:h,body:JSON.stringify(body||{})}).then(function(r){return r.json().catch(function(){return {};}).then(function(j){j=j||{};j._status=r.status;return j;});});}
function equipeDroits(perms){var P=Array.isArray(perms)?perms:[],has=function(x){return P.indexOf('*')>=0||P.indexOf(x)>=0;},out=['count_stock'];if(has('inventory.edit'))out.push('edit_catalog');if(has('inventory.prices')||has('suppliers.view'))out.push('view_prices');if(has('suppliers.view'))out.push('view_suppliers');if(has('inventory.order')){out.push('view_orders');out.push('edit_orders');}return out;}
/* Ce qui n'est pas utile pour compter ne reste pas dans la page : factures du patron (montants, fournisseurs) et lignes de valeur envoyées à Verdict. */
function equipeNettoyer(d){if(!d||typeof d!=='object')return d;/* un rôle qui enregistre renvoie le document entier : rien n'y est retiré (sinon le serveur l'effacerait) */if(!staffCan('edit_catalog'))['facturesInventaire','vdLignesBySite'].forEach(function(k){delete d[k];});if(!staffCan('view_prices'))delete d.priceHistory;
  /* Un rôle qui ne modifie rien (il n'envoie jamais le document) ne garde ni fournisseurs, ni commandes, ni consommation tirée des ventes. */
  if(!staffCan('edit_catalog')){if(!staffCan('view_suppliers')){delete d.suppliersBySite;delete d.lastSup;Object.keys(d.spaces||{}).forEach(function(k){((d.spaces[k]||{}).products||[]).forEach(function(p){if(p){p.sup='';delete p.offers;delete p.sku;}});});}if(!staffCan('view_orders')){['demandBridge','needs','purchaseOrders','orderingSettings','supplyIncidents','operationsBySite'].forEach(function(k){delete d[k];});}}
  /* C238 : le nom affiché dans « Inventaire réalisé par » est celui de l'employé, pour tous les rôles de l'équipe. */
  d.profile=Object.assign({},(d.profile&&typeof d.profile==='object')?d.profile:{},{prenom:equipeNom(),done:true});/* jamais l'accueil du patron pour l'équipe (profil local, jamais renvoyé) */
  return d;}
var equipeBrut=(function(){var b=null;return function(x){if(arguments.length)b=x;return b;};})();
var EQUIPE_MONTANTS=['price','priceDate','unitPrice','purchasePrice','priceHistory','estimatedTotal','deliveryFee','minValue','freeShippingFrom','eur','previousEur','stockFinalHT','previousStockHT','amountHT','amountCents','unitPriceCents','totalHT','prix','pu','cost','costHT','materialCost','valuation','netCents','ttc','ht','facturesInventaire','factureMemoireInv','demandBridge','vdLignesBySite'];
function equipeSansMontant(x){if(Array.isArray(x))return x.map(equipeSansMontant);if(!x||typeof x!=='object')return x;var o={};Object.keys(x).forEach(function(k){if(EQUIPE_MONTANTS.indexOf(k)<0)o[k]=equipeSansMontant(x[k]);});return o;}
function equipeNom(v){var k='verdict:equipe:nom:'+(typeof EQUIPE_ETAB!=='undefined'?EQUIPE_ETAB:'');try{if(arguments.length)sessionStorage.setItem(k,String(v||'').slice(0,80));return sessionStorage.getItem(k)||'';}catch(e){return '';}}
if(typeof document!=='undefined')document.addEventListener('change',function(e){if(typeof EQUIPE_ETAB!=='undefined'&&EQUIPE_ETAB&&e.target&&e.target.id==='countActor')equipeNom(e.target.value.trim());},true);
function equipeEnvoi(d){var b=equipeBrut();if(!b||!d)return d;if(staffCan('edit_catalog')){var o=JSON.parse(JSON.stringify(d));if(b.profile!==undefined)o.profile=JSON.parse(JSON.stringify(b.profile));else delete o.profile;return o;}var out=JSON.parse(JSON.stringify(b)),compte={};
  Object.keys(d.spaces||{}).forEach(function(z){((d.spaces[z]||{}).products||[]).forEach(function(p){if(p&&p.id)compte[z+'|'+p.id]=p;});});
  Object.keys(out.spaces||{}).forEach(function(z){((out.spaces[z]||{}).products||[]).forEach(function(p){var c=p&&compte[z+'|'+p.id];if(!c)return;['stock','countedAt','countedBy'].forEach(function(k){if(c[k]!==undefined)p[k]=c[k];});});});
  var vus={};(b.snapshots||[]).forEach(function(s){if(s&&s.id)vus[s.id]=1;});out.snapshots=(b.snapshots||[]).concat((d.snapshots||[]).filter(function(s){return s&&s.id&&!vus[s.id];}).map(equipeSansMontant));
  return out;}
function apiEquipe(a,body){
  if(a==='me')return equipePost('account',{action:'me'}).then(function(j){if(!j.authenticated||!j.user)return {ok:true,auth:false,equipe:'connexion'};EQUIPE_CSRF=String(j.csrf||'');
    return equipePost('workspace',{action:'bootstrap'}).then(function(w){var orgs=(w.workspace&&w.workspace.organisations)||[],site=null,org=null;orgs.forEach(function(o){(o.sites||[]).forEach(function(x){if(!site&&x&&x.id===STAFF_ESTABLISHMENT){site=x;org=o;}});});
      if(!site)return {ok:true,auth:false,equipe:'acces'};if(org.owner)return {ok:true,auth:false,equipe:'patron'};
      if(!(site.modules&&site.modules.inventory&&site.modules.inventory.view))return {ok:true,auth:false,equipe:'acces'};
      EQUIPE_ORG=String(org.id);STAFF_ROLE=String(site.role||'equipe').slice(0,32);STAFF_PERMISSIONS=equipeDroits(site.permissions);try{applyStaffPermissions();}catch(e){}
      return {ok:true,auth:true,account_id:'equipe:'+STAFF_ESTABLISHMENT,email:j.user.email||'',user:{email:j.user.email||''}};});});
  if(a==='load')return equipePost('workspace',{action:'sync_pull',organisationId:EQUIPE_ORG,etabId:STAFF_ESTABLISHMENT,module:'inventory'}).then(function(j){if(j._status!==200||!j.data||!j.data.spaces)return {ok:false,error:j.code||'vide'};equipeBrut(JSON.parse(JSON.stringify(j.data)));return {ok:true,data:equipeNettoyer(j.data),rev:Number(j.rev)||0};});
  if(a==='save'||a==='submit'){
    /* C253 : un compteur relit d'abord le document tel que le serveur le lui donne maintenant (et sa révision) : après un premier envoi,
       le document envoyé n'est plus celui que le serveur lui montre, et le serveur refusait le suivant (comptage seul). */
    var relire=staffCan('edit_catalog')?Promise.resolve(null):equipePost('workspace',{action:'sync_pull',organisationId:EQUIPE_ORG,etabId:STAFF_ESTABLISHMENT,module:'inventory'}).then(function(p){if(p._status===200&&p.data&&p.data.spaces){equipeBrut(JSON.parse(JSON.stringify(p.data)));return Number(p.rev)||0;}return null;},function(){return null;});
    return relire.then(function(revServeur){var envoi=equipeEnvoi(body&&body.data);return equipePost('workspace',{action:'sync_push',organisationId:EQUIPE_ORG,etabId:STAFF_ESTABLISHMENT,module:'inventory',mutationId:'equipe-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),rev:revServeur!=null?revServeur:(Number(body&&body.rev)||0),data:envoi},true);}).then(function(j){if(j.ok){return {ok:true,rev:j.rev,submission:{at:new Date().toISOString()}};}if(j._status===409)return {ok:false,conflict:true};if(j._status===403){if(!window.__equipeAvis){window.__equipeAvis=1;try{toast('Comptage noté sur cet appareil, pas encore envoyé : demandez à votre responsable de vérifier votre accès à l’Inventaire (Compte › Équipe).');}catch(e){}}return {ok:false,error:'envoi_refuse'};}return {ok:false,error:j.code||'refuse'};});}
  return Promise.resolve({ok:false,error:'non_pris_en_charge'});
}
function equipeRefus(cas){
  var top=window.top||window;if(cas==='patron'){try{top.sessionStorage.removeItem('verdict:equipe:v1');var u=new URL(top.location.href);u.searchParams.delete('equipe');top.location.replace(u.href);}catch(e){}return;}
  var splash=document.getElementById('splash');if(splash)splash.style.display='none';staffSetVisible('.top,.seg,.demo-banner,.lvl,.view,nav,#welcome,.modal,#shared-r32',false);
  var gate=document.getElementById('authGate');if(!gate)return;gate.style.display='flex';gate.setAttribute('role','alert');
  var t={connexion:['Connectez-vous à votre compte Verdict','Ce lien ouvre l’inventaire de votre établissement. Connectez-vous avec le compte que votre responsable a ajouté à son équipe.','Me connecter'],acces:['Accès pas encore ouvert','Votre responsable doit ajouter votre compte dans Compte › Équipe et établissements, avec un rôle pour l’Inventaire.',''],vide:['Inventaire pas encore partagé','Votre responsable doit d’abord ouvrir son Inventaire avec son compte : il sera alors disponible ici.','']}[cas]||['Accès indisponible','Réessayez dans un instant.',''];
  gate.innerHTML='<div style="max-width:420px;width:100%;padding:24px;border:1px solid #262c34;border-radius:18px;background:#111418;color:#eef1f4"><div style="color:#a7c7b6;font:800 11px/1.2 var(--mono);letter-spacing:.12em;text-transform:uppercase">Inventaire de l’équipe</div><h1 style="margin:12px 0 8px;font-size:22px">'+t[0]+'</h1><p style="color:#c7cbd1;line-height:1.55">'+t[1]+'</p>'+(t[2]?'<button type="button" id="equipeLogin" style="width:100%;margin-top:10px;background:#22c55e;color:#04120a;border:0;border-radius:12px;padding:14px;font-weight:800;font-size:15px;cursor:pointer">'+t[2]+'</button>':'')+'</div>';
  var b=document.getElementById('equipeLogin');if(b)b.onclick=function(){try{top.location.href=new URL('../../account.html?mode=login&return=app',location.href).href;}catch(e){}};
}
function api(a,body){ if(EQUIPE_ETAB)return apiEquipe(a,body); var payload=Object.assign({},body||{});if(OWNER_TEAM&&OWNER_TEAM_EST)payload.establishmentId=OWNER_TEAM_EST;if(ACCOUNT_CSRF&&!payload.csrf)payload.csrf=ACCOUNT_CSRF;return fetch(API+"?a="+a,{method:"POST",credentials:"same-origin",
  headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).then(function(r){ return r.json().then(function(j){j._status=r.status;if(j.csrf)ACCOUNT_CSRF=j.csrf;return j;}); }); }
function syncBadge(t,ok){ var e=document.getElementById("whoami"); if(e&&t){ e.textContent=t; e.style.color=ok?"#4ade80":"#f97316"; } }
function scheduleCloudRetry(){ if(!AUTHED||DEMO||!ACCOUNT_ID||syncRetryT)return;syncRetryT=setTimeout(function(){syncRetryT=null;flushCloud();},syncRetryDelay);syncRetryDelay=Math.min(60000,Math.round(syncRetryDelay*1.8)); }
function resetCloudRetry(){ clearTimeout(syncRetryT);syncRetryT=null;syncRetryDelay=1200; }
function cloudSave(){ if(SHARED){VerdictSharedInventory.changed();return;}if(!AUTHED||DEMO||!ACCOUNT_ID)return; markSyncDirty();SYNC_DIRTY=true; clearTimeout(saveT); saveT=setTimeout(flushCloud,550); }
function flushCloud(){
  if(SHARED){VerdictSharedInventory.refresh();return;}
  if(!AUTHED||DEMO||SYNCING||!SYNC_DIRTY)return;
  var sentData=VerdictInventorySync.clone(DB),sentRev=CLOUD_REV;SYNC_DIRTY=false; SYNCING=true;
  api("save",{data:sentData,rev:sentRev}).then(function(r){
    SYNCING=false;
    if(r.ok){ CLOUD_REV=+r.rev||CLOUD_REV;resetCloudRetry();if(!SYNC_DIRTY&&VerdictInventorySync.equal(DB,sentData)){markSyncClean(sentData,CLOUD_REV);syncBadge("\u2713 sync",true);}else{writeSyncMeta({dirty:true,baseRev:CLOUD_REV,baseData:sentData,changedAt:new Date().toISOString()});SYNC_DIRTY=true;flushCloud();}return; }
    if(r.conflict){syncBadge("\u21c4 fusion",false);SYNC_DIRTY=true;api("load").then(function(l){if(!applyCloud(l,ACCOUNT_ID,true))scheduleCloudRetry();}).catch(scheduleCloudRetry);}
    else{ SYNC_DIRTY=true;syncBadge("\u26a0 hors ligne",false);scheduleCloudRetry(); }
  }).catch(function(){ SYNCING=false; SYNC_DIRTY=true; syncBadge("\u26a0 hors ligne",false);scheduleCloudRetry(); });
}
window.addEventListener("online",function(){if(SYNC_DIRTY){resetCloudRetry();flushCloud();}});
var STAFF_SUBMIT_KEY="verdict:staff:submission:pending:v1";
function staffSubmissionId(){
  var id="";try{id=sessionStorage.getItem(STAFF_SUBMIT_KEY)||"";}catch(e){}
  if(!/^[a-zA-Z0-9_-]{16,80}$/.test(id)){
    id=(crypto&&typeof crypto.randomUUID==="function")?crypto.randomUUID():(Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2));
    try{sessionStorage.setItem(STAFF_SUBMIT_KEY,id);}catch(e){}
  }
  return id;
}
function staffSubmissionResult(result){
  try{window.parent.postMessage(Object.assign({type:"verdict-stock-submission-result"},result||{}),(location.origin==="null"?"*":location.origin));}catch(e){}
}
function staffSubmitForReview(waited){
  if(!STAFF||DEMO){staffSubmissionResult({ok:false,error:"Envoi réservé à votre Inventaire personnel."});return;}
  waited=waited||0;
  if(SYNCING&&waited<50){setTimeout(function(){staffSubmitForReview(waited+1);},100);return;}
  if(SYNCING){staffSubmissionResult({ok:false,error:"Synchronisation encore en cours. Réessayez dans un instant."});return;}
  clearTimeout(saveT);var sentData=VerdictInventorySync.clone(DB),sentRev=CLOUD_REV;SYNC_DIRTY=false;SYNCING=true;
  api("submit",{data:sentData,rev:sentRev,clientActionId:staffSubmissionId()}).then(function(r){
    SYNCING=false;
    if(r.ok){CLOUD_REV=+r.rev||CLOUD_REV;resetCloudRetry();markSyncClean(sentData,CLOUD_REV);syncBadge("\u2713 envoyé",true);try{sessionStorage.removeItem(STAFF_SUBMIT_KEY);}catch(e){}staffSubmissionResult({ok:true,submission:r.submission});return;}
    if(r.conflict){SYNC_DIRTY=true;syncBadge("\u21c4 rechargez",false);staffSubmissionResult({ok:false,conflict:true,error:"Inventaire modifié sur un autre appareil."});return;}
    SYNC_DIRTY=true;syncBadge("\u26a0 non envoyé",false);staffSubmissionResult({ok:false,error:r.error==="AUCUNE_REFERENCE_A_ENVOYER"?"Aucune référence à envoyer.":r.error==="INVENTAIRE_A_PREPARER_PAR_GERANT"?"Le gérant doit d’abord préparer les références de cet établissement.":"Envoi impossible. Vos comptages restent enregistrés."});
  }).catch(function(){SYNCING=false;SYNC_DIRTY=true;syncBadge("\u26a0 hors ligne",false);staffSubmissionResult({ok:false,error:"Réseau indisponible. Vos comptages restent enregistrés."});});
}
window.addEventListener("message",function(event){
  if(!STAFF||event.source!==window.parent||(location.origin!=="null"&&event.origin!==location.origin)||!event.data||event.data.type!=="verdict-stock-submit-request")return;
  staffSubmitForReview(0);
});
function authShow(msg,ok){ var g=document.getElementById("authGate"); if(g)g.style.display="flex";
  if(msg){ var m=document.getElementById("authMsg"); m.textContent=msg; m.style.display="block"; m.style.background=ok?"#0c2d1a":"#3a1212";m.style.color=ok?"#86efac":"#fca5a5";m.style.borderColor=ok?"#166534":"#7f1d1d"; } }
function authHide(){ var g=document.getElementById("authGate"); if(g)g.style.display="none"; }
function startOpenAccess(){
  ACCOUNT_ID="client-open-local";AUTHED=false;ACCOUNT_USER=null;ACCOUNT_CSRF="";CLOUD_REV=0;
  var hadLocal=loadAccount(ACCOUNT_ID);if(!hadLocal)DB=blankDB(false);cleanDB();saveLocal();authHide();
  var who=document.getElementById("whoami");if(who)who.style.display="none";
  var accountTools=document.getElementById("staffAccountTools");if(accountTools)accountTools.style.display="none";
  var storageNote=document.getElementById("storageNote");if(storageNote)storageNote.innerHTML="Acc&egrave;s ouvert &middot; donn&eacute;es enregistr&eacute;es sur cet appareil &middot; sauvegarde recommand&eacute;e";
  firstRun();
}
function applyCloud(l,id,localExisted){
  if(!DEMO&&l&&l.data&&inventoryPayloadIsDemo(l.data)){syncBadge("⚠ démo refusée",false);return false;}
  if(id)ACCOUNT_ID=String(id);
  if(l&&l.ok&&l.data&&l.data.spaces){
    var cloudRev=l.rev!=null?Math.max(0,+l.rev||0):0,decision=VerdictInventorySync.reconcile(DB,readSyncMeta(!!localExisted),l.data,cloudRev);CLOUD_REV=cloudRev;
    DB=migrate(decision.data);cleanDB();saveLocal();
    if(decision.needsUpload){writeSyncMeta({dirty:true,baseRev:decision.baseRev,baseData:decision.baseData,changedAt:new Date().toISOString()});SYNC_DIRTY=true;setTimeout(flushCloud,0);if(decision.conflicts.length){syncBadge("\u21c4 local conserv&eacute;",false);toast("Fusion effectu&eacute;e : les conflits ont gard&eacute; vos modifications locales");}}
    else{markSyncClean(DB,CLOUD_REV);SYNC_DIRTY=false;syncBadge("\u2713 sync",true);}
    drawSpaces(); setLevel(DB.level||"normale",true); go(VIEW); return true;
  }
  return false;
}
function startAccount(r){
  ACCOUNT_ID=String(r.account_id||""); if(!ACCOUNT_ID){ authShow("Compte invalide. R&eacute;essayez."); return; }
  ACCOUNT_USER=r.user||null;
  var hadLocal=loadAccount(ACCOUNT_ID);AUTHED=true; authHide(); syncBadge(r.email||"\u2713 sync",true);
  api("load").then(function(l){
    if(!applyCloud(l,ACCOUNT_ID,hadLocal)){
      /* C229 (X36) : en équipe, jamais d'inventaire vide renvoyé à la place de celui du patron. */
      if(EQUIPE_ETAB){AUTHED=false;equipeRefus(l&&l.error==='forbidden'?'acces':'vide');return;}
      /* Un serveur vide ne remplace jamais une base locale existante. */
      CLOUD_REV=(l&&l.rev!=null)?Math.max(0,+l.rev||0):0;if(!hadLocal)DB=blankDB(false);cleanDB();saveLocal();writeSyncMeta({dirty:true,baseRev:CLOUD_REV,baseData:null,changedAt:new Date().toISOString()});drawSpaces();setLevel(DB.level||"normale",true);setSite(DB.site,true);cloudSave();firstRun();
    }else firstRun();
  }).catch(function(){if(hadLocal){var offlineMeta=readSyncMeta(true);writeSyncMeta(offlineMeta);SYNC_DIRTY=offlineMeta.dirty;drawSpaces();setLevel(DB.level||"normale",true);setSite(DB.site,true);firstRun();syncBadge("\u26a0 hors ligne \u00b7 local",false);scheduleCloudRetry();}else authShow("Impossible de charger votre inventaire. Aucun inventaire local n’est disponible sur cet appareil.");});
}
function authGo(mode){
  var e=document.getElementById("authEmail").value.trim(), p=document.getElementById("authPass").value;
  api(mode,{email:e,password:p}).then(function(r){
    if(!r.ok){ authShow(r.error||"Erreur."); return; }
    startAccount(r);
  }).catch(function(){ authShow("Serveur injoignable \u2014 v\u00e9rifiez votre connexion."); });
}
function authForgot(){
  var e=document.getElementById("authEmail").value.trim();
  if(!e){ authShow("Saisissez d'abord l'e-mail de votre compte."); return; }
  api("request_reset",{email:e}).then(function(r){ authShow(r.message||"Si ce compte existe, un lien vient d'\u00eatre envoy\u00e9.",!!r.ok); })
    .catch(function(){ authShow("Serveur injoignable \u2014 r\u00e9essayez avec du r\u00e9seau."); });
}
function authResetApply(){
  var q=new URLSearchParams(location.search+(self.__vdq||"")), e=q.get("email")||"", tok=q.get("reset")||"", p=document.getElementById("authPass").value;
  api("reset_password",{email:e,token:tok,password:p}).then(function(r){
    if(!r.ok){ authShow(r.error||"Lien invalide."); return; }
    location.href="./";
  }).catch(function(){ authShow("Serveur injoignable \u2014 r\u00e9essayez avec du r\u00e9seau."); });
}
function authLogout(){ if(!AUTHED||DEMO)return;if(STAFF){fetch('/api/team/session',{method:'DELETE'}).finally(function(){window.parent.location.href='/stock';});return;} ask("Se d\u00e9connecter ?","Vos donn\u00e9es restent sur votre compte.","Se d\u00e9connecter",function(){
  clearTimeout(saveT); api("logout").then(function(){ AUTHED=false; ACCOUNT_ID=null; ACCOUNT_USER=null; DB=blankDB(false); location.reload(); }); },true); }
function authDelete(){
  if(!AUTHED||STAFF||OWNER_TEAM)return;
  var m=document.getElementById("mAsk"), msg=document.getElementById("aMsg"), ok=document.getElementById("aOk");
  document.getElementById("aTitle").textContent="Supprimer votre compte ?";
  msg.innerHTML='<span style="display:block;margin-bottom:10px">Votre compte et votre inventaire synchronis\u00e9 seront supprim\u00e9s d\u00e9finitivement. Confirmez avec votre mot de passe.</span>'+ 
    '<input id="deletePass" type="password" autocomplete="current-password" placeholder="Votre mot de passe" style="width:100%;background:#0b0d10;border:1px solid #343b45;border-radius:10px;color:#fff;padding:12px;font-size:16px">'+
    '<span id="deleteErr" style="display:none;color:#fca5a5;font-size:12px;margin-top:8px"></span>';
  ok.textContent="Supprimer d\u00e9finitivement"; ok.style.background="var(--red)"; ok.style.color="#fff";
  ok.onclick=function(){
    var p=(document.getElementById("deletePass")||{}).value||"", er=document.getElementById("deleteErr");
    if(!p){ er.textContent="Saisissez votre mot de passe."; er.style.display="block"; return; }
    ok.disabled=true; ok.textContent="Suppression\u2026";
    api("delete_account",{password:p}).then(function(r){
      if(!r.ok){ er.textContent=r.error||"Suppression impossible."; er.style.display="block"; ok.disabled=false; ok.textContent="Supprimer d\u00e9finitivement"; return; }
      try{ var k=accountKey(); if(k)localStorage.removeItem(k); }catch(e){}
      location.reload();
    }).catch(function(){ er.textContent="Serveur injoignable. R\u00e9essayez avec une connexion r\u00e9seau."; er.style.display="block"; ok.disabled=false; ok.textContent="Supprimer d\u00e9finitivement"; });
  };
  m.classList.add("on");
  setTimeout(function(){ var p=document.getElementById("deletePass"); if(p)p.focus(); },80);
}
function ownerTeamAuthRequired(){
  authShow("Connectez-vous comme gérant pour partager cet inventaire avec votre équipe.");
  ["authEmail","authPass","authRegisterBtn","authForgotBtn","authResetBtn"].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display="none";});
  var b=document.getElementById("authLoginBtn");if(b){b.style.display="block";b.textContent="Se connecter comme gérant";b.onclick=function(){window.top.location.href="/acces-equipe";};}
}
function authBoot(){
  if(SHARED){VerdictSharedInventory.boot();return;}
  if(OPEN_ACCESS){startOpenAccess();return;}
  try{
    var q=new URLSearchParams(location.search+(self.__vdq||"")), tok=q.get("reset"), em=q.get("email");
    if(tok&&em){
      document.getElementById("authEmail").value=em; document.getElementById("authEmail").readOnly=true;
      document.getElementById("authPass").value=""; document.getElementById("authPass").placeholder="Nouveau mot de passe (10 caract\u00e8res min.)"; document.getElementById("authPass").autocomplete="new-password";
      ["authLoginBtn","authRegisterBtn","authForgotBtn"].forEach(function(id){document.getElementById(id).style.display="none";});
      document.getElementById("authResetBtn").style.display="block"; authShow("Choisissez votre nouveau mot de passe.",true); return;
    }
  }catch(e){}
  api("me").then(function(r){
    if(r.ok&&r.auth){ startAccount(r); }
    else if(EQUIPE_ETAB)equipeRefus(r.equipe||"connexion");/* C229 (X36) */
    else if(OWNER_TEAM)ownerTeamAuthRequired();else authShow();
  }).catch(function(){ if(OWNER_TEAM)ownerTeamAuthRequired();else authShow("Serveur injoignable \u2014 connexion au compte indisponible. R\u00e9essayez avec du r\u00e9seau."); });
}

/* ---------- utilitaires ---------- */
function esc(s){ return (s==null?"":String(s)).replace(/[&<>"]/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function eur(n){ if(n==null||isNaN(n))return "\u2014";
  var v=Math.round(n*100)/100;
  return v.toLocaleString("fr-FR",{minimumFractionDigits:(v%1?2:0),maximumFractionDigits:2}).replace(/\u202f/g," ")+" \u20ac"; }
function px(p){ var read=VerdictFinance.parseInput(p.price,{nonnegative:true});/* C217 W60 : 0 € = prix non renseigné (anciennes sauvegardes), jamais un prix connu */return read.state==='known'&&read.value>0?read.value:null; }
function anyPrice(){ var a=siteRows(DB.site),i; for(i=0;i<a.length;i++) if(px(a[i].p)!==null) return true; return false; }
function nb(n){ if(n==null||isNaN(n))return "\u2014"; return (Math.round(n*10)/10).toString().replace(".",","); }
function num(v){
  if(v===""||v==null)return null;
  /* R128 : même lecture que Verdict — « 1.234,5 » = 1 234,5 (jamais 1,23) ; « 12abc » est illisible, pas 12. */
  var s=String(v).trim().replace(/[\s\u00a0\u202f']/g,"").replace(/^€|€$/g,"");
  if(s==="")return null;
  var c=s.indexOf(",")>=0,d=s.indexOf(".")>=0;
  if(c&&d){ if(s.lastIndexOf(",")>s.lastIndexOf("."))s=s.replace(/\./g,"").replace(",","."); else s=s.replace(/,/g,""); }
  else if(c){ s=s.split(",").length>2?s.replace(/,/g,""):s.replace(",","."); }
  else if(d&&s.split(".").length>2){ s=s.replace(/\./g,""); }
  if(!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s))return null;
  var n=Number(s);
  /* Garde-fou : une valeur non finie ou démesurée ne doit jamais
     contaminer une valorisation, une commande ou une synchronisation. */
  if(!Number.isFinite(n)||n<0||n>1e12)return null;
  return n;
}
function find(id){ var a=SP().products,i; for(i=0;i<a.length;i++) if(a[i].id===id) return a[i]; return null; }
var VERDICT_LAST_TRUSTED_GESTURE=0;
["pointerdown","keydown"].forEach(function(type){document.addEventListener(type,function(event){if(event.isTrusted)VERDICT_LAST_TRUSTED_GESTURE=Date.now();},true);});
function toast(m){ try{ if(navigator.vibrate&&Date.now()-VERDICT_LAST_TRUSTED_GESTURE<1200)navigator.vibrate(8); }catch(e){}
  var t=document.getElementById("toast"); t.textContent=m; t.classList.add("on");
  clearTimeout(t._t); t._t=setTimeout(function(){ t.classList.remove("on"); },1900); }
/* Les fenêtres natives peuvent être bloquées dans certains lecteurs iOS. */
function info(title,msg,label){
  document.getElementById("aTitle").textContent=title;
  document.getElementById("aMsg").textContent=msg||"";
  var ok=document.getElementById("aOk");
  ok.textContent=label||"Compris";
  ok.style.background="var(--green)";ok.style.color="#04120a";
  ok.onclick=function(){document.getElementById("mAsk").classList.remove("on");};
  document.getElementById("aCancel").style.display="none";
  document.getElementById("mAsk").classList.add("on");
}
function ask(title,msg,label,cb,danger){
  document.getElementById("aCancel").style.display="";
  document.getElementById("aTitle").textContent=title;
  document.getElementById("aMsg").textContent=msg||"";
  var ok=document.getElementById("aOk");
  ok.textContent=label||"Confirmer";
  ok.style.background=danger?"var(--red)":"var(--green)";
  ok.style.color=danger?"#fff":"#04120a";
  ok.onclick=function(){ document.getElementById("mAsk").classList.remove("on"); cb(); };
  document.getElementById("mAsk").classList.add("on");
}

/* ---------- statut ---------- */
var COEF={calme:.7,normale:1,forte:1.5,rush:2};
var LVLS=[["calme","Calme"],["normale","Normale"],["forte","Chargée"],["rush","Très chargée"]];
function level(){ return DB.level||"normale"; }
function lvlName(l){ for(var i=0;i<LVLS.length;i++) if(LVLS[i][0]===(l||level())) return LVLS[i][1]; return ""; }
/* cible d'un produit pour un niveau : la valeur r&eacute;gl&eacute;e par le chef, sinon calcul&eacute;e */
function goalAt(p,l){
  return VerdictFinance.inventoryGoal(p,l,COEF);
}
function goalOf(p){ return goalAt(p,level()); }
function isOver(p,l){ return !!(p.over&&p.over[l]!=null&&p.over[l]!==""); }
function setLevel(l,quiet){
  if(STAFF&&!staffCan("edit_orders")){if(!quiet)toast("Le niveau d’activité est réservé aux commandes autorisées");return;}
  DB.level=l;inventoryInvalidateViews();
  var bs=document.querySelectorAll("#lvlSeg button"),i;
  for(i=0;i<bs.length;i++) bs[i].classList.toggle("on",bs[i].getAttribute("data-l")===l);
  if(VIEW==="count")drawCount(); if(VIEW==="order")drawOrder(); if(VIEW==="prod")drawProd();
  inventoryMarkRendered(VIEW);scheduleInventoryFastSave();
  badge();
  if(!quiet){
    var its=document.querySelectorAll("#countList .item,#prodList .item");
    for(i=0;i<its.length;i++) its[i].classList.add("pulse");
    setTimeout(function(){ var a=document.querySelectorAll(".pulse"),j;
      for(j=0;j<a.length;j++) a[j].classList.remove("pulse"); },460);
    var t=ordersForSite(DB.site).length;
    var unknownGoals=SP().products.some(function(p){return goalOf(p)===null||p.min===null||p.min===undefined;});
    toast(lvlName(l)+" \u2014 "+(unknownGoals?VerdictInventoryFields.text(3):t?("les quantit\u00e9s s\u2019adaptent : "+t+" produit"+(t>1?"s":"")+" \u00e0 commander"):"tous vos stocks sont au niveau"));
  }
}
function state(p){
  var result=VerdictFinance.inventoryAssessment(p,goalOf(p),unitStep(p)),need=result.need;
  if(result.state==='uncounted')return {k:'non',lb:'&#9711; &agrave; compter',t:'t-non',z:'z-non',need:need};
  if(result.state==='out')return {k:'rup',lb:'&#128308; rupture',t:'t-rup',z:'z-rup',need:need};
  if(result.state==='minimum')return {k:'min',lb:'&#128992; sous le stock minimum',t:'t-min',z:'z-min',need:need};
  if(result.state==='order')return {k:'cmd',lb:'&#128993; &agrave; commander',t:'t-cmd',z:'z-cmd',need:need};
  if(result.state==='unknown')return {k:'unknown',lb:VerdictInventoryFields.text(3),t:'t-non',z:'z-non',need:need};
  return {k:'ok',lb:'&#128994; OK',t:'t-ok',z:'z-ok',need:0};
}
function unitStep(p){
  var u=(p.unit||"").toLowerCase().replace(/\s+/g,"");
  return /^(kg|g|l|lt|litre|litres|cl|ml)$/.test(u)?0.1:1;
}
function toOrder(){
  var out=[],a=SP().products,i,st;
  for(i=0;i<a.length;i++){ st=state(a[i]); if(st.need>0) out.push({p:a[i],st:st}); }
  return out;
}
function bySup(list){
  var g={},i,k,keys=[],out=[];
  /* C229 (X36) : sans le droit de voir les fournisseurs, l'équipe compte par zone, sans nom de fournisseur. */
  var cacheSup=STAFF&&!staffCan("view_suppliers");
  for(i=0;i<list.length;i++){ k=cacheSup?"\u00c0 compter":(((list[i].sup||"").trim())||"Sans fournisseur"); if(!g[k]){g[k]=[];keys.push(k);} g[k].push(list[i]); }
  keys.sort(function(a,b){return a.localeCompare(b);});
  for(i=0;i<keys.length;i++) out.push([keys[i],g[keys[i]]]);
  return out;
}

/* ---------- navigation ---------- */
function go(v){
  if(STAFF&&((v==="order"&&!staffCan("view_orders"))||(v==="stats"&&!staffCan("view_analysis"))||(v==="prod"&&!staffCanProducts()))){toast("Cette fonction n’est pas autorisée par votre gérant");v="count";}
  VIEW=v;
  var i,vs=document.querySelectorAll(".view");
  for(i=0;i<vs.length;i++) vs[i].classList.remove("on");
  var target=document.getElementById("v-"+v);target.classList.add("on");
  var bs=document.querySelectorAll("nav button");
  for(i=0;i<bs.length;i++) bs[i].classList.toggle("on",bs[i].getAttribute("data-v")===v);
  window.scrollTo(0,0);
  var revision=String(INVENTORY_VIEW_REVISION),reuse=target.getAttribute('data-inventory-render-revision')===revision;
  if(!reuse){
    if(v==="count")drawCount(); if(v==="order")drawOrder(); if(v==="prod")drawProd(); if(v==="stats")drawStats();
    inventoryMarkRendered(v);
  }
  if(v==="count")renderGreet();
  if(STAFF)applyStaffPermissions();
}
function setSite(s,quiet){
  if(!DB.sites||!DB.sites[s])return; DB.site=s;
  var z=spList(s); if(z.indexOf(DB.space)<0)DB.space=z[0];
  if(!quiet){inventoryInvalidateViews();scheduleInventoryFastSave();} drawSpaces(); brandSub(); go(VIEW);
}
function setSpace(s){ if(spList().indexOf(s)<0)return; DB.space=s;inventoryInvalidateViews();scheduleInventoryFastSave();drawSpaces();brandSub();go(VIEW); }
function brandSub(){ var e=document.getElementById("brandSub"); if(e) e.textContent=siteName(DB.site)+" \u00b7 "+spName(DB.space); }

/* ---------- compter ---------- */
function drawCount(){
  // Do not replace the keyboard's input node during a count (including sync/render callbacks).
  var active=document.activeElement;
  if(active&&active.matches&&active.matches('#countList input[data-id]'))return;
  var actorField=document.getElementById("countActor");if(actorField&&document.activeElement!==actorField)actorField.value=(DB.profile||{}).prenom||"";
  var q=(document.getElementById("q").value||"").toLowerCase().trim();
  var list=SP().products.slice(),i;
  if(q) list=list.filter(function(p){
    return (p.name||"").toLowerCase().indexOf(q)>=0 || (p.sup||"").toLowerCase().indexOf(q)>=0; });
  var el=document.getElementById("countList");
  if(!SP().products.length){
    el.innerHTML=STAFF?'<div class="empty"><div class="b">&#128230;</div>Aucune référence n’est encore disponible dans cette zone.<br>Votre gérant doit préparer cet Inventaire.</div>':'<div class="empty"><div class="b">&#128230;</div>Aucun produit.<br>Touchez <b>Gérer mes produits</b> ci-dessous pour en ajouter.</div>';
    badge(); return;
  }
  if(!list.length){ el.innerHTML='<div class="empty">Rien ne correspond.</div>'; return; }
  var groups=bySup(list),h="";
  for(i=0;i<groups.length;i++){
    h+='<div class="suph">'+esc(groups[i][0])+'<span class="n">'+groups[i][1].length+'</span></div>';
    h+=groups[i][1].map(function(p){
      var st=state(p);
      return '<div class="item '+st.z+'" data-count-id="'+esc(p.id)+'">'+
        '<div class="l1"><div style="flex:1;min-width:0"><div class="nm">'+esc(p.name)+'</div>'+
          (p.unit?'<div class="u">'+esc(p.unit)+'</div>':'')+'</div>'+
          '<span class="tag '+st.t+'">'+st.lb+'</span></div>'+
        '<div class="l2"><div class="step">'+
          '<button data-id="'+esc(p.id)+'" onclick="bump(this.dataset.id,-1)">&minus;</button>'+
          '<input data-id="'+esc(p.id)+'" data-guard-ignore="comptage-auto" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" aria-label="Quantité restante : '+esc(p.name)+' ('+esc(p.unit||'unité')+')" value="'+stockText(p.stock)+'" placeholder="&mdash;" onfocus="beginStockEdit(this)" oninput="setStock(this.dataset.id,this.value,true)" onblur="commitStockEdit(this)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();this.blur()}">'+
          '<button data-id="'+esc(p.id)+'" onclick="bump(this.dataset.id,1)">+</button></div>'+
          '<button type="button" class="count-clear" data-id="'+esc(p.id)+'" onclick="clearStock(this.dataset.id)" aria-label="Effacer la quantité : '+esc(p.name)+'" title="Effacer la quantité">×</button>'+
          '<div class="need">'+(st.need?('&agrave; commander<b>'+nb(st.need)+'</b>'):(st.k==="ok"?'<b style="color:var(--green)">&#10003;</b>':''))+'</div>'+
        '</div></div>';
    }).join("");
  }
  el.innerHTML=h; badge();refreshCountProgress();
}
function countRow(id){
  var rows=document.querySelectorAll('#countList [data-count-id]');
  for(var i=0;i<rows.length;i++)if(rows[i].getAttribute('data-count-id')===String(id))return rows[i];
  return null;
}
function refreshCountRow(id){
  var p=find(id),row=countRow(id);if(!p||!row)return false;
  var st=state(p),pulse=row.classList.contains('pulse');row.className='item '+st.z+(pulse?' pulse':'');
  var tag=row.querySelector('.tag'),input=row.querySelector('input[data-id]'),need=row.querySelector('.need');
  if(tag){tag.className='tag '+st.t;tag.innerHTML=st.lb;}
  if(input&&document.activeElement!==input)input.value=stockText(p.stock);
  if(need)need.innerHTML=st.need?('&agrave; commander<b>'+nb(st.need)+'</b>'):(st.k==='ok'?'<b style="color:var(--green)">&#10003;</b>':'');
  badge();refreshCountProgress();inventoryMarkRendered('count');return true;
}
function recordCount(p,before){if(before===p.stock)return;var actor=String((DB.profile||{}).prenom||"").trim();p.countedBy=actor;var at=new Date().toISOString();(DB.countAudit=DB.countAudit||[]).push({id:uid(),productId:p.id,site:DB.site,space:DB.space,before:before,after:p.stock,at:at,declaredBy:actor||null,accountId:ACCOUNT_ID||null});}
/* R235: a decimal keyboard without the native number-input rewrites on iOS.
   The raw text stays untouched while typing. An empty quantity is always null. */
/* R321 : les quantités de démonstration sont calculées (38,82152479644708) : affichage arrondi au millième, comme une saisie. */
function stockText(value){if(value==null||value==='')return '';var n=Number(value);if(!isFinite(n))return String(value).replace('.',',');return String(Math.round(n*1000)/1000).replace('.',',');}
function refreshCountProgress(){
  var rows=siteRows(DB.site),done=rows.filter(function(r){return r.p.stock!=null;}).length;
  var el=document.getElementById('countProgress'),button=document.getElementById('finishCountButton');
  /* C209 (V40) : la liste Compter ne montre que l'espace choisi (Cuisine : 44 produits) alors que le compteur
     additionnait tout l'établissement (Cuisine + Bar : « 51 / 51 »). Le compteur suit d'abord l'espace affiché,
     puis rappelle le total de l'établissement quand il a d'autres espaces (« Terminer » clôt tout l'établissement). */
  var zone=rows.filter(function(r){return r.space===DB.space;}),zoneDone=zone.filter(function(r){return r.p.stock!=null;}).length;
  var autres=spList().filter(function(k){return k!==DB.space&&((DB.spaces[k]||{}).products||[]).length;}).map(spName);
  if(el)el.textContent=autres.length&&zone.length?zoneDone+' / '+zone.length+' · '+spName(DB.space)+' · '+done+' / '+rows.length+' avec '+autres.join(', '):done+' / '+rows.length;
  if(button)button.disabled=!done;
  /* C229 (X29) : la carte « Bonjour » suivait le comptage seulement au changement d'écran (« 2/5 comptés » figé). */
  try{renderGreet();}catch(e){}
}
function beginStockEdit(input){
  var p=find(input.dataset.id);if(p&&!Object.prototype.hasOwnProperty.call(input,'__stockBefore'))input.__stockBefore=p.stock;
}
function setStock(id,v,typing){
  var p=find(id);if(!p)return false;
  var row=countRow(id),input=row&&row.querySelector('input[data-id]'),value=num(v);
  var invalid=(String(v).trim()!==''&&value===null)||(value!=null&&(!Number.isFinite(value)||value<0));
  if(input)input.setAttribute('aria-invalid',invalid?'true':'false');
  if(invalid){if(!typing)toast('Stock invalide');return false;}
  var before=p.stock;p.stock=value;
  if(!typing){recordCount(p,before);}
  p.countedAt=value===null?null:new Date().toISOString();
  if(value===null)p.countedBy=null;
  inventoryInvalidateViews();refreshCountRow(id);scheduleInventoryFastSave();return true;
}
function commitStockEdit(input){
  if(!input)return;var p=find(input.dataset.id);if(!p)return;
  var before=Object.prototype.hasOwnProperty.call(input,'__stockBefore')?input.__stockBefore:p.stock;
  /* R321 : toucher un champ sans rien changer n’est pas un comptage (ni nouvelle valeur, ni nouvelle heure de comptage). */
  if(input.value===stockText(before)&&p.stock===before){delete input.__stockBefore;return;}
  if(!setStock(p.id,input.value,true)){
    p.stock=before;p.countedAt=before==null?null:p.countedAt;toast('Stock invalide');
    inventoryInvalidateViews();scheduleInventoryFastSave();
  }
  recordCount(p,before);if(p.stock==null){p.countedBy=null;p.countedAt=null;}
  delete input.__stockBefore;input.setAttribute('aria-invalid','false');input.value=stockText(p.stock);
  refreshCountRow(p.id);
}
function clearStock(id){
  var row=countRow(id),input=row&&row.querySelector('input[data-id]');
  if(input){input.blur();delete input.__stockBefore;}
  if(setStock(id,'')){if(input)input.value='';refreshCountRow(id);}
}
function bump(id,d){
  var p=find(id);if(!p)return;
  var row=countRow(id),input=row&&row.querySelector('input[data-id]');
  if(input&&document.activeElement===input){input.blur();}
  // Whole units by default; customer-entered decimals are retained exactly.
  var value=Math.max(0,Number(((p.stock==null?0:+p.stock)+(d<0?-1:1)).toFixed(9)));
  if(setStock(id,value)&&input)input.value=stockText(value);
}
document.addEventListener('visibilitychange',function(){
  var input=document.activeElement;
  if(document.hidden&&input&&input.matches&&input.matches('#countList input[data-id]'))commitStockEdit(input);
});
function badge(){
  var n=ordersForSite(DB.site).length,b=document.getElementById("bdg");
  b.className=n?"bdg":""; b.textContent=n?n:"";
}

/* ---------- commande ---------- */
var ORDALL=false;
function setOrdScope(v){ ORDALL=v; drawOrder(); }
function drawOrder(){
  var sc=document.getElementById("orderScope");
  if(sc) sc.innerHTML= siteList().length<2 ? "" :
    ('<button class="'+(ORDALL?"":"on")+'" onclick="setOrdScope(false)">'+siteEmo(DB.site)+" "+esc(siteName(DB.site))+'</button>'+
     '<button class="'+(ORDALL?"on":"")+'" onclick="setOrdScope(true)">Tous mes &eacute;tablissements</button>');
  var rows=ORDALL?allOrders():ordersForSite(DB.site);
  var el=document.getElementById("orderList");
  if(!rows.length){
    el.innerHTML='<div class="empty"><div class="b">&#10003;</div>Rien &agrave; commander.<br>'+
      '<span style="font-size:13px">Comptez vos produits dans <b>Compter</b>&nbsp;:<br>ce qui manque arrive ici tout seul.</span></div>';
    return;
  }
  var g={},keys=[],i,k;
  for(i=0;i<rows.length;i++){ k=((rows[i].p.sup||"").trim())||"Sans fournisseur"; if(!g[k]){g[k]=[];keys.push(k);} g[k].push(rows[i]); }
  keys.sort(function(a,b){return a.localeCompare(b);});
  el.innerHTML=keys.map(function(sup){
    var items=g[sup];
    /* m&ecirc;me produit dans plusieurs &eacute;tablissements = une seule ligne, quantit&eacute; cumul&eacute;e */
    var byName={},order=[];
    items.forEach(function(x){
      var key=(x.p.name||"").toLowerCase()+"|"+(x.p.unit||"").toLowerCase();
      if(!byName[key]){ byName[key]={name:x.p.name,unit:x.p.unit,need:0,eur:0,parts:[]}; order.push(key); }
      byName[key].need+=x.st.need; byName[key].eur=byName[key].eur===null||px(x.p)===null?null:VerdictFinance.fraction(byName[key].eur).add(VerdictFinance.fraction(x.st.need).mul(px(x.p))).number(2);
      byName[key].parts.push((ORDALL?siteEmo(x.site)+" "+esc(siteName(x.site))+" / ":"")+spEmo(x.space)+" "+esc(spName(x.space))+" "+nb(x.st.need));
    });
    var nb_prod=order.length;
    return '<div class="card"><h3>'+esc(sup)+'<span class="n">'+nb_prod+' produit'+(nb_prod>1?"s":"")+'</span></h3>'+
      order.map(function(key){
        var x=byName[key];
        return '<div class="line"><span>'+esc(x.name)+
          (ORDALL&&x.parts.length>1?'<span class="sp">'+x.parts.join(" &middot; ")+'</span>':'')+
          '</span><span class="q">'+nb(x.need)+' '+esc(x.unit||"")+
          ('<em>'+eur(x.eur)+'</em>')+'</span></div>';
      }).join("")+
      (function(){ var t=items.reduce(function(s,x){ return s===null||px(x.p)===null?null:VerdictFinance.fraction(s).add(VerdictFinance.fraction(x.st.need).mul(px(x.p))).number(2); },0);
        return '<div class="line tot"><span>Total</span><span class="q">'+eur(t)+'</span></div>'; })()+
      '<button class="btn" data-sup="'+esc(sup)+'" style="margin-top:12px" onclick="copyOrder(this.dataset.sup)">Copier cette commande</button>'+
    '</div>';
  }).join("");
}
function copyOrder(sup){
  var src=ORDALL?allOrders():ordersForSite(DB.site);
  var rows=src.filter(function(x){ return (((x.p.sup||"").trim())||"Sans fournisseur")===sup; });
  var byName={},order=[];
  rows.forEach(function(x){ var k=(x.p.name||"").toLowerCase();
    if(!byName[k]){ byName[k]={name:x.p.name,unit:x.p.unit,need:0,parts:[]}; order.push(k); }
    byName[k].need+=x.st.need; byName[k].parts.push((ORDALL?siteName(x.site)+" / ":"")+spName(x.space)+" "+nb(x.st.need)); });
  var txt="Commande "+sup+" \u2014 "+new Date().toLocaleDateString("fr-FR")+
    (ORDALL?" (tous \u00e9tablissements)":" ("+siteName(DB.site)+")")+"\n"+
    order.map(function(k){ var x=byName[k];
      return "\u2022 "+x.name+" : "+nb(x.need)+" "+(x.unit||"")+
        (ORDALL&&x.parts.length>1?"  ["+x.parts.join(" + ")+"]":""); }).join("\n");
  var done=function(){ toast("Commande copi\u00e9e \u2014 collez-la \u00e0 votre fournisseur"); };
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(done,function(){ fallback(txt,done); });
  } else fallback(txt,done);
}
function fallback(txt,done){
  var ta=document.createElement("textarea");
  ta.value=txt; ta.style.position="fixed"; ta.style.opacity="0";
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand("copy"); }catch(e){}
  document.body.removeChild(ta); done();
}

/* ---------- d&eacute;ballage ---------- */
var WEMO="\ud83c\udf73";
function hourGreet(){ var h=new Date().getHours(); return (h>=18||h<5)?"Bonsoir":"Bonjour"; }
function wShow(){ document.getElementById("welcome").classList.add("on"); wStep(0); }
function wStep(i){
  ["w0","w1","w2"].forEach(function(id,k){ document.getElementById(id).style.display=(k===i?"block":"none"); });
  if(i===1){ drawWEmo();
    document.getElementById("wPrenom").value=(DB.profile&&DB.profile.prenom)||"";
    var sn=siteName(DB.site); document.getElementById("wResto").value=/^Mon \u00e9tablissement$/i.test(sn)?"":sn; }
  window.scrollTo(0,0);
}
function drawWEmo(){
  document.getElementById("wEmo").innerHTML=EMOJIS.map(function(e){
    return '<button class="'+(e===WEMO?"on":"")+'" onclick="wPick(\''+e+'\')">'+e+'</button>'; }).join("");
}
/* C41 : choisir l’icône la colore une seconde, puis valide la fiche (effet clic). */
function wPick(e){ WEMO=e; drawWEmo(); var b=document.querySelector("#wEmo button.on"); if(b)b.classList.add("pick"); try{if(navigator.vibrate)navigator.vibrate(12);}catch(x){} clearTimeout(window.__wPickT); window.__wPickT=setTimeout(function(){ if(document.getElementById("welcome").classList.contains("on"))wSave(); },1000); }
function wSave(){
  var pre=document.getElementById("wPrenom").value.trim();
  var res=document.getElementById("wResto").value.trim();
  /* C41 : on ne passe pas sans prénom ni établissement. */
  ["wPrenom","wResto"].forEach(function(id){var el=document.getElementById(id);el.classList.toggle("miss",!el.value.trim());});
  if(!pre||!res){ document.getElementById(!pre?"wPrenom":"wResto").focus(); toast("Votre pr\u00e9nom et votre \u00e9tablissement : les deux sont n\u00e9cessaires"); return; }
  DB.profile={prenom:pre,done:true};
  if(DB.sites&&DB.sites[DB.site]){ if(res)DB.sites[DB.site].name=res; DB.sites[DB.site].emo=WEMO; }
  save(); drawSpaces(); brandSub(); renderGreet();
  document.getElementById("w2t").innerHTML=(res?esc(res):"C\u2019est pr\u00eat")+"<br>est pr&ecirc;t.";
  document.getElementById("w2s").textContent=hourGreet()+(pre?" "+pre:"")+", vous pouvez compter d\u00e8s maintenant. Trois choses valent le d\u00e9tour :";
  wStep(2);
}
function wClose(after){
  var w=document.getElementById("welcome");
  w.classList.add("out");
  setTimeout(function(){ w.classList.remove("on","out","anim"); if(after)after(); },330);
}
function wDone(){ if(!DB.profile)DB.profile={done:true}; DB.profile.done=true; save();
  wClose(function(){ renderGreet(); go("prod"); toast("Bienvenue \u2014 commencez par vos produits"); }); }
function wSkip(){ if(!DB.profile)DB.profile={}; DB.profile.done=true; save();
  wClose(renderGreet); }
function renderGreet(){
  var w=document.getElementById("greetWrap"); if(!w)return;
  var pre=(DB.profile&&DB.profile.prenom)||"";
  var rows=siteRows(DB.site),n=ordersForSite(DB.site).length,tot=rows.length;
  var cnt=rows.filter(function(x){ return x.p.stock!=null; }).length;
  var st = STAFF&&!staffCan("view_orders")
           ? (cnt?"Comptage en cours \u2014 "+cnt+"/"+tot+" r\u00e9f\u00e9rences observ\u00e9es.":"Commencez par compter votre r\u00e9serve, produit par produit.")
           : n? ("<b>"+n+" produit"+(n>1?"s":"")+"</b> \u00e0 commander \u2014 votre liste est pr\u00eate dans l\u2019écran Commande.")
           : (cnt? "Tous vos stocks compt\u00e9s sont au niveau \u2713" : "Commencez par compter votre r\u00e9serve, produit par produit.");
  if(tot&&cnt&&cnt<tot) st+=" <span style=\"color:var(--mut2)\">&middot; "+cnt+"/"+tot+" compt\u00e9s</span>";
  /* C248 : la carte reste en place (son animation d'entrée ne repart pas) ; seul le texte qui a changé est réécrit. */
  var hi=hourGreet()+(pre?" "+esc(pre):"")+' \ud83d\udc4b',g=w.querySelector('.greet'),gh=g&&g.querySelector('.hi'),gs=g&&g.querySelector('.st');
  if(gh&&gs){if(g.__c248!==hi+'|'+st){g.__c248=hi+'|'+st;gh.innerHTML=hi;gs.innerHTML=st;}return;}
  w.innerHTML='<div class="greet"><div class="hi">'+hi+'</div><div class="st">'+st+'</div></div>';var g2=w.querySelector('.greet');if(g2)g2.__c248=hi+'|'+st;
}

/* ---------- &eacute;tablissements : un site contient toujours Cuisine + Bar ---------- */
var SEMO="\ud83d\udce6";
function openSpace(k){
  if(DEMO){toast("La démonstration conserve une seule Brasserie fictive");return;}
  if(STAFF){toast("L’établissement est attribué par votre gérant");return;}
  var del=document.getElementById("sDel");
  if(k){ document.getElementById("sTitle").textContent="Modifier l\u2019\u00e9tablissement";
    document.getElementById("sName").value=siteName(k); SEMO=siteEmo(k);
    document.getElementById("sKey").value=k; del.style.display=siteList().length>1?"block":"none";
  }else{ document.getElementById("sTitle").textContent="Nouvel \u00e9tablissement";
    document.getElementById("sName").value=""; SEMO=EMOJIS[0];
    document.getElementById("sKey").value=""; del.style.display="none"; }
  drawEmo(); document.getElementById("mSpace").classList.add("on");
}
function drawEmo(){
  document.getElementById("sEmo").innerHTML=EMOJIS.map(function(e){
    return '<button class="'+(e===SEMO?"on":"")+'" onclick="pickEmo(\''+e+'\')">'+e+'</button>'; }).join("");
}
function pickEmo(e){ SEMO=e; drawEmo(); }
function closeSpace(){ document.getElementById("mSpace").classList.remove("on"); }
function saveSpace(){
  if(DEMO){toast("Établissement verrouillé dans la démonstration fictive");return;}
  var name=document.getElementById("sName").value.trim();
  if(!name){ toast("Donnez un nom \u00e0 votre \u00e9tablissement"); return; }
  var k=document.getElementById("sKey").value;
  if(!k){
    k="s"+Date.now().toString(36); var kc=k+"_cuisine", kb=k+"_bar";
    DB.sites[k]={name:name,emo:SEMO,zones:[kc,kb]}; DB.siteList.push(k);
    DB.spaces[kc]=newSpace("cuisine",false); DB.spaces[kb]=newSpace("bar",false);
    DB.meta[kc]={name:"Cuisine",emo:"\ud83c\udf73",site:k,kind:"cuisine"};
    DB.meta[kb]={name:"Bar",emo:"\ud83c\udf78",site:k,kind:"bar"};
    DB.list.push(kc,kb); DB.site=k; DB.space=kc;
  }else{ DB.sites[k].name=name; DB.sites[k].emo=SEMO; DB.site=k; }
  /* Multi-établissements : ajouter ou modifier un site conserve la page active. */
  save(); closeSpace(); drawSpaces(); brandSub(); go(VIEW);
  toast(name+" \u2014 pr\u00eat");
}
function askDelSpace(){
  var k=document.getElementById("sKey").value; if(!k)return;
  ask("Supprimer "+siteName(k)+" ?","Sa Cuisine, son Bar, ses produits et ses comptages seront effac\u00e9s.","Supprimer",function(){
    var zones=(DB.sites[k]&&DB.sites[k].zones)||[];
    zones.forEach(function(z){ delete DB.spaces[z]; delete DB.meta[z]; });
    DB.list=DB.list.filter(function(x){ return zones.indexOf(x)<0; });
    delete DB.sites[k]; DB.siteList=DB.siteList.filter(function(x){return x!==k;});
    DB.site=DB.siteList[0]; DB.space=spList(DB.site)[0]; save(); closeSpace(); drawSpaces(); brandSub(); go(VIEW); toast("\u00c9tablissement supprim\u00e9");
  },true);
}
/* commande group\u00e9e : tous les \u00e9tablissements, m\u00eame fournisseur */
function ordersForSite(sid){
  var out=[]; siteRows(sid).forEach(function(x){ var st=state(x.p); if(st.need>0)out.push({p:x.p,st:st,space:x.space,site:sid}); }); return out;
}
function allOrders(){
  var out=[]; siteList().forEach(function(s){ out=out.concat(ordersForSite(s)); });
  return out;
}
function stateIn(p,k){ return state(p); }

/* ---------- analyse ---------- */
function valuationForSite(sid){
  /* C217 W60 : la valorisation ne lit que les prix réellement connus (px) ; un prix à 0 ou vide reste « inconnu ». */
  return VerdictFinance.inventoryValuation(siteRows(sid).map(function(x){return px(x.p)===null&&x.p.price!=null&&x.p.price!==''?{p:Object.assign({},x.p,{price:null}),space:x.space}:x;}));
}
/* C238 (Y01) : l'empreinte d'un comptage = les quantités, jamais les prix (elle part avec le comptage, vue par l'équipe). */
function countFingerprint(sid){ return siteRows(sid).map(function(x){return x.space+":"+x.p.id+":"+(x.p.stock==null?"?":x.p.stock);}).join("|"); }
function finishCount(){
  var active=document.activeElement;if(active&&active.matches&&active.matches('#countList input[data-id]'))active.blur();
  var v=valuationForSite(DB.site); if(!v.total){toast("Ajoutez d'abord vos produits");return;}
  if(!v.counted){toast("Comptez au moins un produit");return;}
  var doIt=function(){
    if(!DB.snapshots)DB.snapshots=[];
    var fp=countFingerprint(DB.site), last=null;
    for(var i=DB.snapshots.length-1;i>=0;i--){if(DB.snapshots[i].site===DB.site){last=DB.snapshots[i];break;}}
    if(last&&last.fingerprint===fp){toast("Ce comptage est d\u00e9j\u00e0 enregistr\u00e9");return;}
    DB.snapshots.push({id:"i"+Date.now().toString(36),site:DB.site,date:new Date().toISOString(),eur:Math.round(v.eur*100)/100,
      counted:v.counted,total:v.total,coverage:v.coverage,exact:v.exact,fingerprint:fp,/* R133 · point 11 : chaque comptage garde la quantité de CHAQUE produit (non compté = null, jamais 0) — base du calcul réel/théorique */schema:"count-lines.v1",lines:(v.rows||[]).map(function(r){var p=r&&r.p||{},q=(p.stock===null||p.stock===undefined||p.stock===""||!isFinite(+p.stock))?null:+p.stock,pr=px(p);return {id:p.id,name:p.name,unit:p.unit||null,qty:q,price:(pr!==null&&isFinite(pr)&&pr>=0)?pr:null};})});
    if(DB.snapshots.length>120)DB.snapshots=DB.snapshots.slice(-120);
    save(); drawStats(); toast(v.counted<v.total?"Comptage partiel enregistr\u00e9":(v.priced<v.counted&&!(STAFF&&!staffCan("view_prices"))?"Comptage complet enregistr\u00e9 \u2713 \u00b7 prix connus : "+v.priced+"/"+v.total:"Comptage enregistr\u00e9 \u2713"));
  };
  /* C217 W60 : compter et valoriser sont deux choses. Tout compté = comptage complet, même sans prix (le prix est facultatif). */
  if(v.counted<v.total){
    ask("Enregistrer ce comptage ?","Comptage partiel : "+v.counted+"/"+v.total+" produits compt\u00e9s. Verdict le conservera comme partiel, jamais comme un inventaire complet.","Enregistrer",doIt);
  }else doIt();
}
function historyHtml(){
  var a=(DB.snapshots||[]).filter(function(x){return x.site===DB.site;}).slice(-5).reverse();
  if(!a.length)return '<div class="card"><h3>Historique des comptages</h3><p class="sub" style="margin:0">Enregistrez un comptage termin&eacute; : sa date, sa couverture et sa valeur seront conserv&eacute;es ici.</p></div>';
  return '<div class="card"><h3>Historique des comptages<span class="n">'+a.length+' r&eacute;cents</span></h3>'+a.map(function(x){
    /* C217 W60 : comptage (tout compté ?) et valorisation (prix connus) sont dits séparément ; un ancien comptage « complet » à 0 € sans aucun prix est relu comme « sans prix ». */
    var d=new Date(x.date).toLocaleDateString("fr-FR"), connus=x.lines&&x.lines.length?x.lines.filter(function(l){return l&&l.price>0;}).length:(x.eur>0?(x.counted||0):0), tout=x.total>0&&x.counted===x.total;
    var q=tout?(connus>=x.total?"complet":("comptage complet \u00b7 "+(connus?connus+"/"+x.total+" prix connus":"sans prix"))):("partiel \u00b7 "+(x.counted||0)+"/"+(x.total||0)+" compt\u00e9s");
    return '<div class="line"><span>'+d+'<span class="sp">'+q+'</span></span><span class="q">'+(connus?eur(x.eur):"\u2014")+'</span></div>';
  }).join("")+'</div>';
}
/* R134 · point 11 — consommation RÉELLE par produit entre deux comptages détaillés (11.3, 11.12–11.17, 11.95).
   Réel = stock compté au début + quantités reçues entre les deux comptages − stock compté à la fin.
   Non compté à l'une des deux dates = non calculable (jamais 0). Unité de réception différente = bloqué (jamais converti au hasard).
   Réel négatif = incohérence à vérifier (réception ou comptage manquant), jamais affiché comme une consommation.
   Le théorique (fiches × ventes) appartient à Verdict : sans lui, aucun écart n'est affirmé ici. */
var MATR_TX={
 titre:['Consommation réelle par produit','Actual consumption per product','Consumo real por producto','Consumo reale per prodotto','Tatsächlicher Verbrauch pro Produkt','Werkelijk verbruik per product','Consumo real por produto'],
 aucun:['Aucun comptage détaillé enregistré. Comptez puis touchez « Enregistrer le comptage » : Verdict gardera la quantité de chaque produit.','No detailed count saved yet. Count, then tap “Save count”: Verdict will keep each product’s quantity.','Aún no hay un conteo detallado guardado. Cuente y toque «Guardar el conteo»: Verdict conservará la cantidad de cada producto.','Nessun conteggio dettagliato salvato. Contate e toccate «Salva il conteggio»: Verdict conserverà la quantità di ogni prodotto.','Noch keine detaillierte Zählung gespeichert. Zählen Sie und tippen Sie auf „Zählung speichern“: Verdict behält die Menge jedes Produkts.','Nog geen gedetailleerde telling opgeslagen. Tel en tik op „Telling opslaan”: Verdict bewaart de hoeveelheid van elk product.','Ainda não há contagem detalhada guardada. Conte e toque em «Guardar a contagem»: o Verdict guardará a quantidade de cada produto.'],
 un:['Premier comptage détaillé enregistré le {d}. Au prochain comptage, Verdict calculera la consommation réelle de chaque produit.','First detailed count saved on {d}. At the next count, Verdict will calculate each product’s actual consumption.','Primer conteo detallado guardado el {d}. En el próximo conteo, Verdict calculará el consumo real de cada producto.','Primo conteggio dettagliato salvato il {d}. Al prossimo conteggio, Verdict calcolerà il consumo reale di ogni prodotto.','Erste detaillierte Zählung am {d} gespeichert. Bei der nächsten Zählung berechnet Verdict den tatsächlichen Verbrauch jedes Produkts.','Eerste gedetailleerde telling opgeslagen op {d}. Bij de volgende telling berekent Verdict het werkelijke verbruik van elk product.','Primeira contagem detalhada guardada a {d}. Na próxima contagem, o Verdict calculará o consumo real de cada produto.'],
 periode:['Du {a} au {b} · {n}/{t} produits comptés aux deux dates.','From {a} to {b} · {n}/{t} products counted on both dates.','Del {a} al {b} · {n}/{t} productos contados en ambas fechas.','Dal {a} al {b} · {n}/{t} prodotti contati in entrambe le date.','Vom {a} bis {b} · {n}/{t} Produkte an beiden Tagen gezählt.','Van {a} tot {b} · {n}/{t} producten op beide data geteld.','De {a} a {b} · {n}/{t} produtos contados nas duas datas.'],
 formule:['Réel = stock du début + réceptions − stock de fin. Le théorique (fiches × ventes) vient de Verdict : sans lui, aucun écart n’est affirmé.','Actual = opening stock + deliveries − closing stock. The theoretical (recipes × sales) comes from Verdict: without it, no variance is claimed.','Real = stock inicial + recepciones − stock final. El teórico (fichas × ventas) viene de Verdict: sin él, no se afirma ninguna desviación.','Reale = stock iniziale + ricevimenti − stock finale. Il teorico (schede × vendite) viene da Verdict: senza di esso, nessuno scostamento è affermato.','Ist = Anfangsbestand + Lieferungen − Endbestand. Der Sollwert (Rezepturen × Verkäufe) kommt von Verdict: ohne ihn wird keine Abweichung behauptet.','Werkelijk = beginvoorraad + leveringen − eindvoorraad. Het theoretische (recepten × verkopen) komt van Verdict: zonder dat wordt geen afwijking beweerd.','Real = stock inicial + receções − stock final. O teórico (fichas × vendas) vem do Verdict: sem ele, nenhum desvio é afirmado.'],
 ligne:['{a} + {r} reçus − {b} = {c} consommés','{a} + {r} received − {b} = {c} used','{a} + {r} recibidos − {b} = {c} consumidos','{a} + {r} ricevuti − {b} = {c} consumati','{a} + {r} erhalten − {b} = {c} verbraucht','{a} + {r} ontvangen − {b} = {c} verbruikt','{a} + {r} recebidos − {b} = {c} consumidos'],
 valeur:['{v} au prix enregistré','{v} at the recorded price','{v} al precio registrado','{v} al prezzo registrato','{v} zum erfassten Preis','{v} tegen de geregistreerde prijs','{v} ao preço registado'],
 absent:['Non calculable : pas compté aux deux dates.','Not computable: not counted on both dates.','No calculable: no contado en ambas fechas.','Non calcolabile: non contato in entrambe le date.','Nicht berechenbar: nicht an beiden Tagen gezählt.','Niet berekenbaar: niet op beide data geteld.','Não calculável: não contado nas duas datas.'],
 unite:['Bloqué : réception dans une autre unité ({u}), conversion à confirmer.','Blocked: delivery in another unit ({u}), conversion to confirm.','Bloqueado: recepción en otra unidad ({u}), conversión por confirmar.','Bloccato: ricevimento in un’altra unità ({u}), conversione da confermare.','Blockiert: Lieferung in anderer Einheit ({u}), Umrechnung bestätigen.','Geblokkeerd: levering in een andere eenheid ({u}), omrekening te bevestigen.','Bloqueado: receção noutra unidade ({u}), conversão a confirmar.'],
 negatif:['À vérifier : le stock de fin dépasse début + réceptions ({c}). Une réception ou un comptage manque.','To check: closing stock exceeds opening + deliveries ({c}). A delivery or a count is missing.','Por verificar: el stock final supera inicial + recepciones ({c}). Falta una recepción o un conteo.','Da verificare: lo stock finale supera iniziale + ricevimenti ({c}). Manca un ricevimento o un conteggio.','Zu prüfen: Endbestand übersteigt Anfang + Lieferungen ({c}). Eine Lieferung oder Zählung fehlt.','Te controleren: eindvoorraad hoger dan begin + leveringen ({c}). Er ontbreekt een levering of telling.','A verificar: o stock final excede inicial + receções ({c}). Falta uma receção ou uma contagem.'],
 recDate:['Date de réception = date de validation de la commande reçue.','Delivery date = date the received order was validated.','Fecha de recepción = fecha de validación del pedido recibido.','Data di ricevimento = data di convalida dell’ordine ricevuto.','Lieferdatum = Datum der Bestätigung der erhaltenen Bestellung.','Leverdatum = datum waarop de ontvangen bestelling is gevalideerd.','Data de receção = data de validação da encomenda recebida.'],
 tous:['Voir tous les produits ({n})','See all products ({n})','Ver todos los productos ({n})','Vedi tutti i prodotti ({n})','Alle Produkte ansehen ({n})','Alle producten bekijken ({n})','Ver todos os produtos ({n})']
};
function matrLang(){var l='fr';try{l=String(document.documentElement.lang||(window.parent&&window.parent.LOCALE)||'fr').slice(0,2).toLowerCase();}catch(e){}var i=['fr','en','es','it','de','nl','pt'].indexOf(l);return i<0?0:i;}
function matrT(k,v){var a=MATR_TX[k]||[k],s=a[matrLang()]||a[0];v=v||{};return String(s).replace(/\{(\w+)\}/g,function(_,n){return v[n]!=null?v[n]:'';});}
function matrTag(){return ['fr-FR','en-GB','es-ES','it-IT','de-DE','nl-NL','pt-PT'][matrLang()];}
function matrDate(iso){try{return new Date(iso).toLocaleDateString(matrTag(),{day:'numeric',month:'long'});}catch(e){return String(iso).slice(0,10);}}
function matrQ(x,u){if(x==null||!isFinite(x))return '—';return (Math.round(x*100)/100).toLocaleString(matrTag())+(u?'\u00a0'+u:'');}
function matiereReel(site){
  var snaps=(DB.snapshots||[]).filter(function(s){return s&&s.site===site&&s.schema==='count-lines.v1'&&Array.isArray(s.lines);}).sort(function(a,b){return String(a.date)<String(b.date)?-1:1;});
  var out={snaps:snaps.length,lignes:[]};if(snaps.length<2){out.dernier=snaps.length?snaps[snaps.length-1].date:null;return out;}
  var A=snaps[snaps.length-2],B=snaps[snaps.length-1],byA={};A.lines.forEach(function(l){byA[l.id]=l;});out.debut=A.date;out.fin=B.date;
  var rec={},recUnit={};(DB.purchaseOrders||[]).forEach(function(o){if(!o||o.site!==site||!/^(received|partial)$/.test(String(o.status||'')))return;var d=String(o.receivedAt||o.updatedAt||'');
    (o.lines||[]).forEach(function(l){var id=l.productId||(l.p&&l.p.id);var q=invQteDansPeriode(o,l,A.date,B.date);if(!id||!isFinite(q)||q===0)return;rec[id]=(rec[id]||0)+q;if(l.unit)recUnit[id]=(recUnit[id]&&recUnit[id]!==l.unit)?'*':l.unit;});});
  var nOk=0;B.lines.forEach(function(lb){var la=byA[lb.id],r={id:lb.id,nom:lb.name,unite:lb.unit,prix:lb.price,debut:la?la.qty:null,fin:lb.qty,recu:rec[lb.id]||0};
    if(r.debut==null||r.fin==null){r.statut='absent';}
    else if(recUnit[lb.id]&&lb.unit&&recUnit[lb.id]!==lb.unit){r.statut='unite';r.uniteRecue=recUnit[lb.id];}
    else{r.conso=r.debut+r.recu-r.fin;if(r.conso<-1e-9){r.statut='negatif';}else{r.statut='ok';nOk++;r.valeur=r.prix!=null?r.conso*r.prix:null;}}
    out.lignes.push(r);});
  out.calcules=nOk;out.total=B.lines.length;return out;
}
function matiereReelHtml(){
  var R=matiereReel(DB.site),h='<div class="card" id="matiereReel" style="margin-top:14px"><h3 style="margin:0 0 6px">'+matrT('titre')+'</h3>';
  if(R.snaps===0)return h+'<p class="note">'+matrT('aucun')+'</p></div>';
  if(R.snaps===1)return h+'<p class="note">'+matrT('un',{d:matrDate(R.dernier)})+'</p></div>';
  h+='<p class="note" style="margin:0 0 4px">'+matrT('periode',{a:matrDate(R.debut),b:matrDate(R.fin),n:R.calcules,t:R.total})+'</p><p class="note" style="margin:0 0 8px">'+matrT('formule')+'</p>';
  function bloc(r){var s='<div class="matr-l" data-prod="'+String(r.id).replace(/"/g,'')+'" style="padding:8px 0;border-top:1px solid rgba(255,255,255,.07)"><b>'+String(r.nom||'').replace(/</g,'&lt;')+'</b><br><span class="note">';
    if(r.statut==='ok')s+=matrT('ligne',{a:matrQ(r.debut,r.unite),r:matrQ(r.recu,r.unite),b:matrQ(r.fin,r.unite),c:matrQ(r.conso,r.unite)})+(r.valeur!=null?' · '+matrT('valeur',{v:eur(r.valeur)}):'');
    else if(r.statut==='negatif')s+=matrT('negatif',{c:matrQ(r.debut+r.recu-r.fin,r.unite)});
    else if(r.statut==='unite')s+=matrT('unite',{u:r.uniteRecue});
    else s+=matrT('absent');
    return s+'</span></div>';}
  var ok=R.lignes.filter(function(r){return r.statut==='ok';}).sort(function(a,b){return (b.valeur||0)-(a.valeur||0);}),alerte=R.lignes.filter(function(r){return r.statut==='negatif'||r.statut==='unite';});
  var top=alerte.slice(0,3);ok.slice(0,Math.max(0,3-top.length)).forEach(function(r){top.push(r);});
  top.forEach(function(r){h+=bloc(r);});
  var reste=R.lignes.filter(function(r){return top.indexOf(r)<0;});
  if(reste.length)h+='<details style="margin-top:6px"><summary class="note" style="cursor:pointer">'+matrT('tous',{n:R.lignes.length})+'</summary>'+reste.map(bloc).join('')+'</details>';
  if(Object.keys(R.lignes).length)h+='<p class="note" style="margin:8px 0 0">'+matrT('recDate')+'</p>';
  return h+'</div>';
}

/* R135 · point 11 — données matière exposées à Verdict (lecture seule) et carte d'écart dans l'Analyse.
   Le calcul est fait par Verdict (fiches + ventes) : l'Inventaire fournit ses deux derniers comptages détaillés et ses réceptions. */
function inventaireDonneesMatiere(){
  var site=DB.site,demo=!!(window.VERDICT_BRASSERIE_INVENTORY_DEMO&&String(site).indexOf('demo')>=0)||String(site)==='demo-brasserie';
  var produits=(typeof siteRows==='function'?siteRows(site):[]).map(function(x){var p=x.p||{},pr=px(p);return {id:p.id,name:p.name,unit:p.unit||null,price:(pr!==null&&isFinite(pr)&&pr>=0)?pr:null};});
  var R=matiereReel(site);
  if(R.snaps<2)return {statut:R.snaps?'un':'aucun',snaps:R.snaps,site:site,demo:demo,produits:produits};
  var snaps=(DB.snapshots||[]).filter(function(s){return s&&s.site===site&&s.schema==='count-lines.v1'&&Array.isArray(s.lines);}).sort(function(a,b){return String(a.date)<String(b.date)?-1:1;});
  var A=snaps[snaps.length-2],B=snaps[snaps.length-1],rec=[];
  (DB.purchaseOrders||[]).forEach(function(o){if(!o||o.site!==site||!/^(received|partial)$/.test(String(o.status||'')))return;var d=String(o.receivedAt||o.updatedAt||'');
    (o.lines||[]).forEach(function(l,li){var id=l.productId||(l.p&&l.p.id),q=invQteDansPeriode(o,l,A.date,B.date);if(id&&isFinite(q)&&q!==0)rec.push({productId:id,qty:q,unit:l.unit||null,date:d.slice(0,10),ref:String(o.id||'')+'#'+String(li),supplier:o.supplier||o.supplierName||null,doc:o.deliveryNote||o.bl||o.number||null});});});
  return {statut:'ok',site:site,demo:demo,debut:A.date,fin:B.date,produits:produits,lignesA:A.lines,lignesB:B.lines,receptions:rec};
}
function matiereVerdictFrame(){try{var P=window.parent;if(!P)return null;for(var i=0;i<P.frames.length;i++){try{var f=P.frames[i];if(f!==window&&typeof f.verdictMatiereDepuisInventaire==='function')return f;}catch(e){}}}catch(e){}return null;}
/* R207 (option B) : Inventaire n'est disponible qu'en français pour le moment. Les cartes fabriquées par Verdict s'affichaient dans la langue de Verdict (franglais au milieu d'un écran français). On les demande en français : LOCALE, LOCALE_TAG et _nfMoney de Verdict sont posés le temps de l'appel (synchrone, aucun DOM touché) puis TOUJOURS restitués. Quand Inventaire sera traduit, retirer verdictEnFrancais. */ /* R216 — PORTÉ depuis la lignée GPT (inventory-i18n-r200.js, R200.1) : dictionnaire Inventaire 538 entrées × 6 langues + moteur de traduction au rendu. Textes d’interface seulement : données, noms, saisies et quantités ne sont jamais réécrits. */
(function(w){'use strict';if(w.VerdictInventoryI18n)return;
 var D={"Langue":["Language","Idioma","Lingua","Sprache","Taal","Idioma"],"Inventaire réalisé par":["Count done by","Inventario realizado por","Inventario eseguito da","Inventur durchgeführt von","Inventaris uitgevoerd door","Inventário feito por"],"Ouvrir les établissements":["Open businesses","Abrir los establecimientos","Apri le attività","Betriebe öffnen","Zaken openen","Abrir os estabelecimentos"],"Nom du responsable":["Manager’s name","Nombre del responsable","Nome del responsabile","Name der verantwortlichen Person","Naam van de verantwoordelijke","Nome do responsável"],"Bonjour {p} 👋":["Hello {p} 👋","Buenos días, {p} 👋","Buongiorno {p} 👋","Guten Tag, {p} 👋","Goedendag {p} 👋","Bom dia, {p} 👋"],"Bonsoir {p} 👋":["Good evening {p} 👋","Buenas noches, {p} 👋","Buonasera {p} 👋","Guten Abend, {p} 👋","Goedenavond {p} 👋","Boa noite, {p} 👋"],"Sans fournisseur":["No supplier","Sin proveedor","Senza fornitore","Ohne Lieferant","Zonder leverancier","Sem fornecedor"],"SANS FOURNISSEUR":["NO SUPPLIER","SIN PROVEEDOR","SENZA FORNITORE","OHNE LIEFERANT","ZONDER LEVERANCIER","SEM FORNECEDOR"],"{n}/{t} comptés":["{n}/{t} counted","{n}/{t} contados","{n}/{t} contati","{n}/{t} gezählt","{n}/{t} geteld","{n}/{t} contados"],"· {n}/{t} comptés":["· {n}/{t} counted","· {n}/{t} contados","· {n}/{t} contati","· {n}/{t} gezählt","· {n}/{t} geteld","· {n}/{t} contados"],"pièce":["piece","unidad","pezzo","Stück","stuk","unidade"],"pièces":["pieces","unidades","pezzi","Stück","stuks","unidades"],"Moteur {a} · empreinte {b} · décision {c}.":["Engine {a} · fingerprint {b} · decision {c}.", "Motor {a} · huella {b} · decisión {c}.", "Motore {a} · impronta {b} · decisione {c}.", "Engine {a} · Fingerabdruck {b} · Entscheidung {c}.", "Engine {a} · vingerafdruk {b} · beslissing {c}.", "Motor {a} · impressão {b} · decisão {c}."],"Théorique {q} : volumes déclarés × fiches, au prorata de {d} jours.":["Theoretical {q}: declared volumes × recipes, pro rata over {d} days.", "Teórico {q}: volúmenes declarados × fichas, prorrateado sobre {d} días.", "Teorico {q}: volumi dichiarati × schede, in proporzione su {d} giorni.", "Theoretisch {q}: gemeldete Mengen × Rezepturen, anteilig auf {d} Tage.", "Theoretisch {q}: opgegeven volumes × recepten, naar rato over {d} dagen.", "Teórico {q}: volumes declarados × fichas, proporcionalmente a {d} dias."],"Stock compté au début {a} · réceptions {b} · stock compté à la fin {c} → réel {d}.":["Stock counted at start {a} · deliveries {b} · stock counted at end {c} → actual {d}.", "Stock contado al inicio {a} · recepciones {b} · stock contado al final {c} → real {d}.", "Giacenza contata all’inizio {a} · ricezioni {b} · giacenza contata alla fine {c} → reale {d}.", "Anfangsbestand gezählt {a} · Lieferungen {b} · Endbestand gezählt {c} → real {d}.", "Begintelling {a} · ontvangsten {b} · eindtelling {c} → werkelijk {d}.", "Stock contado no início {a} · receções {b} · stock contado no fim {c} → real {d}."],"{m} selon le dernier prix d’achat — une valeur d’écart, pas une perte certaine.":["{m} at the last purchase price — a variance value, not a certain loss.", "{m} según el último precio de compra — un valor de desviación, no una pérdida segura.", "{m} all’ultimo prezzo d’acquisto — un valore di scostamento, non una perdita certa.", "{m} zum letzten Einkaufspreis — ein Abweichungswert, kein sicherer Verlust.", "{m} tegen de laatste inkoopprijs — een afwijkingswaarde, geen zeker verlies.", "{m} ao último preço de compra — um valor de desvio, não uma perda certa."],"Réel {a} · théorique {b} · écart {c}.":["Actual {a} · theoretical {b} · variance {c}.", "Real {a} · teórico {b} · desviación {c}.", "Reale {a} · teorico {b} · scostamento {c}.", "Real {a} · theoretisch {b} · Abweichung {c}.", "Werkelijk {a} · theoretisch {b} · afwijking {c}.", "Real {a} · teórico {b} · desvio {c}."],"Exposition : {a} par mois au volume acheté ({b}/mois).":["Exposure: {a} per month at the purchased volume ({b}/month).", "Exposición: {a} al mes al volumen comprado ({b}/mes).", "Esposizione: {a} al mese al volume acquistato ({b}/mese).", "Exposition: {a} pro Monat beim gekauften Volumen ({b}/Monat).", "Blootstelling: {a} per maand bij het gekochte volume ({b}/maand).", "Exposição: {a} por mês ao volume comprado ({b}/mês)."],"à commander — votre liste est prête dans l’écran Commande.":["to order — your list is ready in the Order screen.", "por pedir — su lista está lista en la pantalla Pedido.", "da ordinare — la lista è pronta nella schermata Ordine.", "zu bestellen — Ihre Liste ist im Bildschirm Bestellung bereit.", "te bestellen — uw lijst staat klaar in het scherm Bestelling.", "a encomendar — a sua lista está pronta no ecrã Encomenda."],"Commencer":["Start","Empezar","Inizia","Starten","Beginnen","Começar"],"Passer":["Skip","Omitir","Salta","Überspringen","Overslaan","Ignorar"],"Plus":["More","Más","Altro","Mehr","Meer","Mais"],"Autre":["Other","Otro","Altro","Andere","Andere","Outro"],"Activité":["Activity","Actividad","Attività","Geschäft","Activiteit","Atividade"],"Sauvegarder":["Back up","Guardar","Salva","Sichern","Back-up","Salvar"],"Restaurer":["Restore","Restaurar","Ripristina","Wiederherstellen","Herstellen","Restaurar"],"Analyse":["Analysis","Análisis","Analisi","Analyse","Analyse","Análise"],"Catégorie":["Category","Categoría","Categoria","Kategorie","Categorie","Categoria"],"Annuler":["Cancel","Cancelar","Annulla","Abbrechen","Annuleren","Cancelar"],"Enregistrer":["Save","Guardar","Salva","Speichern","Opslaan","Salvar"],"Unité":["Unit","Unidad","Unità","Einheit","Eenheid","Unidade"],"Jour":["Day","Día","Giorno","Tag","Dag","Dia"],"Carte":["Menu","Carta","Menu","Karte","Kaart","Cardápio"],"Nom":["Name","Nombre","Nome","Name","Naam","Nome"],"Modifier":["Edit","Modificar","Modifica","Bearbeiten","Bewerken","Editar"],"Fermer":["Close","Cerrar","Chiudi","Schließen","Sluiten","Fechar"],"Nouvel établissement":["New business","Nuevo establecimiento","Nuovo locale","Neuer Betrieb","Nieuwe zaak","Novo estabelecimento"],"(facultatif)":["(optional)","(opcional)","(facoltativo)","(optional)","(optioneel)","(opcional)"],"Continuer":["Continue","Continuar","Continua","Weiter","Doorgaan","Continuar"],"Alertes":["Alerts","Alertas","Avvisi","Warnungen","Meldingen","Alertas"],"Retour":["Return","Devolución","Reso","Rückgabe","Retour","Devolução"],"Choisir…":["Choose…","Elegir…","Scegli…","Auswählen…","Kiezen…","Escolher…"],"Votre établissement":["Your business","Su establecimiento","Il tuo locale","Ihr Betrieb","Uw zaak","O seu estabelecimento"],"Préparer le résultat pour Verdict®":["Prepare the result for Verdict®","Preparar el resultado para Verdict®","Preparare il risultato per Verdict®","Ergebnis für Verdict® vorbereiten","Resultaat voorbereiden voor Verdict®","Preparar o resultado para o Verdict®"],"À traiter en premier":["Handle first","Tratar primero","Da trattare per primo","Zuerst angehen","Eerst aanpakken","Tratar primeiro"],"Fournisseur":["Supplier","Proveedor","Fornitore","Lieferant","Leverancier","Fornecedor"],"Cuisine":["Kitchen","Cocina","Cucina","Küche","Keuken","Cozinha"],"Bar":["Bar","Bar","Bar","Bar","Bar","Bar"],"Ce que votre stock représente, et ce que votre commande va coûter.":["What your stock is worth and what your order will cost.","El valor de sus existencias y el coste de su pedido.","Il valore delle scorte e il costo dell’ordine.","Der Wert Ihres Bestands und die Kosten Ihrer Bestellung.","De waarde van uw voorraad en de kosten van uw bestelling.","O valor do seu stock e o custo da sua encomenda."],"Valeur du stock par fournisseur":["Stock value by supplier","Valor del stock por proveedor","Valore delle scorte per fornitore","Bestandswert je Lieferant","Voorraadwaarde per leverancier","Valor do stock por fornecedor"],"À commander par fournisseur":["To order by supplier","A pedir por proveedor","Da ordinare per fornitore","Zu bestellen je Lieferant","Te bestellen per leverancier","A encomendar por fornecedor"],"Inventaire transmet cette preuve et les opérations. Verdict rapproche ensuite ventes, achats, charges et équipes, puis calcule seul le score de structure.":["Inventory sends this evidence and the transactions. Verdict then reconciles sales, purchases, expenses and staffing and calculates the structure score.","Inventario transmite esta evidencia y las operaciones. Verdict concilia ventas, compras, gastos y personal y calcula la puntuación de estructura.","Inventario trasmette queste evidenze e le operazioni. Verdict riconcilia vendite, acquisti, spese e personale e calcola il punteggio di struttura.","Inventar übermittelt diese Belege und Vorgänge. Verdict gleicht Verkäufe, Einkäufe, Kosten und Personal ab und berechnet den Strukturwert.","Voorraad verstuurt dit bewijs en de transacties. Verdict vergelijkt verkopen, inkopen, kosten en personeel en berekent de structuurscore.","Inventário transmite estas provas e operações. O Verdict cruza vendas, compras, despesas e pessoal e calcula a pontuação de estrutura."],"Votre inventaire répond à":["Your inventory answers","Su inventario responde a","L’inventario risponde a","Ihr Inventar beantwortet","Uw voorraad beantwoordt","O seu inventário responde a"],"« qu’est-ce que j’ai ? »":["“What do I have?”","«¿Qué tengo?»","«Che cosa ho?»","„Was habe ich?“","‘Wat heb ik?’","«O que tenho?»"],"Verdict répond à":["Verdict answers","Verdict responde a","Verdict risponde a","Verdict beantwortet","Verdict beantwoordt","O Verdict responde a"],"« est-ce que mon restaurant me rapporte vraiment ? »":["“Is my restaurant actually profitable?”","«¿Mi restaurante es realmente rentable?»","«Il mio ristorante è davvero redditizio?»","„Ist mein Restaurant tatsächlich rentabel?“","‘Is mijn restaurant echt winstgevend?’","«O meu restaurante é realmente rentável?»"],"Ouvrir le même établissement dans Verdict →":["Open the same establishment in Verdict →","Abrir el mismo establecimiento en Verdict →","Aprire lo stesso locale in Verdict →","Denselben Betrieb in Verdict öffnen →","Dezelfde vestiging openen in Verdict →","Abrir o mesmo estabelecimento no Verdict →"],"Le premier comptage fixe le point de départ. Ensuite, chaque nouveau comptage ferme la période précédente : un comptage par mois suffit.":["The first count sets the starting point. Each new count then closes the previous period: one count per month is enough.","El primer conteo fija el inicio. Cada nuevo conteo cierra el periodo anterior: basta con uno al mes.","Il primo conteggio fissa il punto di partenza. Ogni nuovo conteggio chiude il periodo precedente: ne basta uno al mese.","Die erste Zählung legt den Ausgangspunkt fest. Jede weitere schließt den vorherigen Zeitraum ab: Eine Zählung pro Monat genügt.","De eerste telling bepaalt het beginpunt. Elke nieuwe telling sluit de vorige periode af: één telling per maand volstaat.","A primeira contagem define o início. Cada nova contagem fecha o período anterior: uma contagem por mês basta."],"Envoyer aussi mes prix (catalogue)":["Also send my prices (catalogue)","Enviar también mis precios (catálogo)","Inviare anche i prezzi (catalogo)","Auch meine Preise senden (Katalog)","Ook mijn prijzen versturen (catalogus)","Enviar também os meus preços (catálogo)"],"À faire une fois, puis quand vos prix changent. Verdict s’en sert pour votre carte et votre coût matière : vous ne les ressaisissez jamais.":["Do this once, then when your prices change. Verdict uses them for your menu and ingredient costs: no re-entry needed.","Hágalo una vez y cuando cambien sus precios. Verdict los utiliza para su carta y costes de ingredientes: no hace falta volver a introducirlos.","Da fare una volta e quando cambiano i prezzi. Verdict li usa per il menu e i costi degli ingredienti: non serve reinserirli.","Einmal durchführen und wenn sich Ihre Preise ändern. Verdict nutzt sie für Karte und Wareneinsatz: keine erneute Eingabe nötig.","Doe dit één keer en wanneer uw prijzen veranderen. Verdict gebruikt ze voor uw kaart en ingrediëntenkosten: opnieuw invoeren is niet nodig.","Faça-o uma vez e quando os preços mudarem. O Verdict usa-os para a ementa e custos de ingredientes: não precisa de os voltar a introduzir."],"Suggestion fondée sur les jours comparables, le stock, les commandes en cours, le colis, le délai et la durée utilisable. Rien ne remplace votre cible sans confirmation.":["Suggestion based on comparable days, stock, open orders, pack size, lead time and usable life. Your target is never replaced without confirmation.","Sugerencia basada en días comparables, existencias, pedidos pendientes, embalaje, plazo y vida útil. Su objetivo nunca cambia sin confirmación.","Suggerimento basato su giorni comparabili, scorte, ordini aperti, confezioni, tempi e durata utile. L’obiettivo non cambia senza conferma.","Vorschlag anhand vergleichbarer Tage, Bestand, offener Bestellungen, Packgröße, Lieferzeit und Haltbarkeit. Ihr Ziel wird nie ohne Bestätigung ersetzt.","Voorstel op basis van vergelijkbare dagen, voorraad, open bestellingen, verpakkingen, levertijd en houdbaarheid. Uw doel wordt nooit zonder bevestiging vervangen.","Sugestão baseada em dias comparáveis, stock, encomendas abertas, embalagem, prazo e vida útil. O seu objetivo nunca muda sem confirmação."],"même compte · aucune recopie · essai Pro de 14 jours prévu après activation du serveur · puis choix explicite à 69 € HT/mois ou 690 € HT/an en Pilotage, 129 € HT/mois ou 1 290 € HT/an en Pro pour un établissement actif, +39 € HT/mois en Pilotage ou +69 € HT/mois en Pro par établissement actif supplémentaire":["same account · no re-entry · 14-day Pro trial planned after server activation · then an explicit choice: €69/month (Pilotage) or €129/month (Pro) excluding tax for one active establishment, +€39/month (Pilotage) or +€69/month (Pro) for each additional active establishment","misma cuenta · sin volver a introducir datos · prueba Pro de 14 días prevista tras activar el servidor · después, elección expresa: 69 €/mes (Pilotage) o 129 €/mes (Pro) sin impuestos para un local activo, +39 €/mes (Pilotage) o +69 €/mes (Pro) por cada local activo adicional","stesso account · nessun reinserimento · prova Pro di 14 giorni prevista dopo l’attivazione del server · poi scelta esplicita: 69 €/mese (Pilotage) o 129 €/mese (Pro) IVA esclusa per un locale attivo, +39 €/mese (Pilotage) o +69 €/mese (Pro) per ogni locale attivo aggiuntivo","gleiches Konto · keine erneute Eingabe · 14 Tage Pro-Test nach Serveraktivierung vorgesehen · danach ausdrückliche Wahl: 69 €/Monat (Pilotage) oder 129 €/Monat (Pro) zzgl. MwSt. für einen aktiven Betrieb, +39 €/Monat (Pilotage) oder +69 €/Monat (Pro) je weiterem aktiven Betrieb","zelfde account · geen dubbele invoer · Pro-proefperiode van 14 dagen voorzien na serveractivering · daarna expliciete keuze: €69/maand (Pilotage) of €129/maand (Pro) excl. btw voor één actieve vestiging, +€39/maand (Pilotage) of +€69/maand (Pro) per extra actieve vestiging","mesma conta · sem repetir dados · teste Pro de 14 dias previsto após ativar o servidor · depois, escolha explícita: 69 €/mês (Pilotage) ou 129 €/mês (Pro) sem impostos para um estabelecimento ativo, +39 €/mês (Pilotage) ou +69 €/mês (Pro) por estabelecimento ativo adicional"],"Consommation réelle par produit":["Actual consumption per product","Consumo real por producto","Consumo reale per prodotto","Tatsächlicher Verbrauch pro Produkt","Werkelijk verbruik per product","Consumo real por produto"],"Aucun comptage détaillé enregistré. Comptez puis touchez « Enregistrer le comptage » : Verdict gardera la quantité de chaque produit.":["No detailed count saved yet. Count, then tap “Save count”: Verdict will keep each product’s quantity.","Aún no hay un conteo detallado guardado. Cuente y toque «Guardar el conteo»: Verdict conservará la cantidad de cada producto.","Nessun conteggio dettagliato salvato. Contate e toccate «Salva il conteggio»: Verdict conserverà la quantità di ogni prodotto.","Noch keine detaillierte Zählung gespeichert. Zählen Sie und tippen Sie auf „Zählung speichern“: Verdict behält die Menge jedes Produkts.","Nog geen gedetailleerde telling opgeslagen. Tel en tik op „Telling opslaan”: Verdict bewaart de hoeveelheid van elk product.","Ainda não há contagem detalhada guardada. Conte e toque em «Guardar a contagem»: o Verdict guardará a quantidade de cada produto."],"Inventaire":["Inventory","Inventario","Inventario","Inventar","Voorraad","Inventário"],"Compter":["Count","Contar","Contare","Zählen","Tellen","Contar"],"Commande":["Order","Pedido","Ordine","Bestellung","Bestelling","Encomenda"],"Commandes":["Orders","Pedidos","Ordini","Bestellungen","Bestellingen","Encomendas"],"Ma commande":["My order","Mi pedido","Il mio ordine","Meine Bestellung","Mijn bestelling","A minha encomenda"],"Commander":["Order","Pedir","Ordinare","Bestellen","Bestellen","Encomendar"],"Comptés":["Counted","Contados","Contati","Gezählt","Geteld","Contados"],"Confirmer":["Confirm","Confirmar","Confermare","Bestätigen","Bevestigen","Confirmar"],"Ajouter":["Add","Añadir","Aggiungere","Hinzufügen","Toevoegen","Adicionar"],"Référence":["Reference","Referencia","Riferimento","Artikelnummer","Referentie","Referência"],"Réception":["Receipt","Recepción","Ricezione","Wareneingang","Ontvangst","Receção"],"Réceptionnée":["Received","Recibida","Ricevuto","Eingegangen","Ontvangen","Recebida"],"Décider":["Decide","Decidir","Decidere","Entscheiden","Beslissen","Decidir"],"Clôturer":["Close","Cerrar","Chiudere","Abschließen","Afsluiten","Fechar"],"Horaires":["Schedule","Horarios","Orari","Zeiten","Tijden","Horários"],"Canal":["Channel","Canal","Canale","Kanal","Kanaal","Canal"],"Commercial":["Sales representative","Comercial","Referente commerciale","Vertriebskontakt","Verkoopcontact","Comercial"],"Téléphone":["Phone","Teléfono","Telefono","Telefon","Telefoon","Telefone"],"Contact":["Contact","Contacto","Contatto","Kontakt","Contact","Contacto"],"E-mail":["Email","Correo electrónico","E-mail","E-Mail","E-mail","E-mail"],"Portail":["Portal","Portal","Portale","Portal","Portaal","Portal"],"Fournisseurs":["Suppliers","Proveedores","Fornitori","Lieferanten","Leveranciers","Fornecedores"],"Fournisseurs & horaires":["Suppliers & schedules","Proveedores y horarios","Fornitori e orari","Lieferanten und Zeiten","Leveranciers en tijden","Fornecedores e horários"],"+ Fournisseur":["+ Supplier","+ Proveedor","+ Fornitore","+ Lieferant","+ Leverancier","+ Fornecedor"],"+ Ajouter un produit":["+ Add a product","+ Añadir un producto","+ Aggiungere un prodotto","+ Produkt hinzufügen","+ Product toevoegen","+ Adicionar produto"],"Nouveau produit":["New product","Nuevo producto","Nuovo prodotto","Neues Produkt","Nieuw product","Novo produto"],"Vos produits":["Your products","Sus productos","I suoi prodotti","Ihre Produkte","Uw producten","Os seus produtos"],"Voir ou gérer mes produits":["View or manage my products","Ver o gestionar mis productos","Visualizzare o gestire i prodotti","Produkte ansehen oder verwalten","Producten bekijken of beheren","Ver ou gerir os meus produtos"],"Chercher un produit":["Find a product","Buscar un producto","Cercare un prodotto","Produkt suchen","Product zoeken","Procurar produto"],"Chercher un produit…":["Find a product…","Buscar un producto…","Cercare un prodotto…","Produkt suchen…","Product zoeken…","Procurar produto…"],"Rechercher dans les produits":["Search products","Buscar productos","Cercare prodotti","Produkte durchsuchen","Producten doorzoeken","Pesquisar produtos"],"Rechercher un produit, fournisseur ou unité…":["Search for a product, supplier or unit…","Buscar producto, proveedor o unidad…","Cercare prodotto, fornitore o unità…","Produkt, Lieferant oder Einheit suchen…","Product, leverancier of eenheid zoeken…","Pesquisar produto, fornecedor ou unidade…"],"Stock idéal":["Target stock","Stock objetivo","Scorta obiettivo","Zielbestand","Doelvoorraad","Stock ideal"],"Alerte si moins de":["Alert below","Alerta por debajo de","Avviso sotto","Warnung unter","Waarschuwing onder","Alerta abaixo de"],"Prix d’achat HT":["Purchase price excluding tax","Precio de compra sin impuestos","Prezzo d’acquisto IVA esclusa","Einkaufspreis netto","Inkoopprijs excl. btw","Preço de compra sem impostos"],"(activité normale)":["(normal activity)","(actividad normal)","(attività normale)","(normaler Betrieb)","(normale activiteit)","(atividade normal)"],"(facultatif — débloque la valeur de votre stock)":["(optional — enables stock valuation)","(opcional — permite valorar el stock)","(facoltativo — consente di valorizzare le scorte)","(optional — ermöglicht die Bestandsbewertung)","(optioneel — maakt voorraadwaardering mogelijk)","(opcional — permite calcular o valor do stock)"],"Commande intelligente":["Smart ordering","Pedido inteligente","Ordine intelligente","Intelligente Bestellung","Slim bestellen","Encomenda inteligente"],"Quantité par colis":["Quantity per pack","Cantidad por bulto","Quantità per confezione","Menge pro Packung","Aantal per verpakking","Quantidade por embalagem"],"Minimum fournisseur":["Supplier minimum","Mínimo del proveedor","Minimo del fornitore","Mindestmenge des Lieferanten","Minimum leverancier","Mínimo do fornecedor"],"Délai fournisseur (jours)":["Supplier lead time (days)","Plazo del proveedor (días)","Tempo di consegna (giorni)","Lieferzeit (Tage)","Levertijd (dagen)","Prazo do fornecedor (dias)"],"Durée utilisable (jours)":["Usable life (days)","Vida útil (días)","Durata utile (giorni)","Nutzungsdauer (Tage)","Bruikbare levensduur (dagen)","Vida útil (dias)"],"Selon l’activité":["Depending on activity","Según la actividad","Secondo l’attività","Je nach Auslastung","Afhankelijk van activiteit","Segundo a atividade"],"calculé tout seul — touche un chiffre pour l’ajuster":["calculated automatically — tap a number to adjust it","calculado automáticamente — toque una cifra para ajustarla","calcolato automaticamente — tocchi un numero per modificarlo","automatisch berechnet — zum Anpassen auf eine Zahl tippen","automatisch berekend — tik op een getal om het aan te passen","calculado automaticamente — toque num número para o ajustar"],"Calme":["Quiet","Tranquila","Calma","Ruhig","Rustig","Calma"],"Normale":["Normal","Normal","Normale","Normal","Normaal","Normal"],"Chargée":["Busy","Alta","Intensa","Stark","Druk","Intensa"],"Très chargée":["Peak","Pico","Picco","Spitze","Piek","Pico"],"Supprimer ce produit":["Delete this product","Eliminar este producto","Eliminare questo prodotto","Dieses Produkt löschen","Dit product verwijderen","Eliminar este produto"],"Supprimer cet établissement":["Delete this establishment","Eliminar este local","Eliminare questo locale","Diesen Betrieb löschen","Deze vestiging verwijderen","Eliminar este estabelecimento"],"Icône":["Icon","Icono","Icona","Symbol","Pictogram","Ícone"],"Son icône":["Its icon","Su icono","La sua icona","Sein Symbol","Het pictogram","O seu ícone"],"Vider mes comptages":["Clear my counts","Vaciar mis conteos","Cancellare i conteggi","Meine Zählungen leeren","Mijn tellingen wissen","Limpar as minhas contagens"],"Charger un exemple":["Load an example","Cargar un ejemplo","Caricare un esempio","Beispiel laden","Voorbeeld laden","Carregar exemplo"],"Choisir une sauvegarde d’inventaire à restaurer":["Choose an inventory backup to restore","Elegir una copia del inventario para restaurar","Scegliere un backup dell’inventario da ripristinare","Inventarsicherung zum Wiederherstellen auswählen","Voorraadback-up kiezen om te herstellen","Escolher cópia do inventário para restaurar"],"Se déconnecter":["Sign out","Cerrar sesión","Disconnettersi","Abmelden","Uitloggen","Terminar sessão"],"Supprimer mon compte":["Delete my account","Eliminar mi cuenta","Eliminare il mio account","Mein Konto löschen","Mijn account verwijderen","Eliminar a minha conta"],"Compte gratuit · vos données sont synchronisées sur vos appareils":["Free account · your data is synced across your devices","Cuenta gratuita · datos sincronizados en sus dispositivos","Account gratuito · dati sincronizzati sui suoi dispositivi","Kostenloses Konto · Daten auf Ihren Geräten synchronisiert","Gratis account · gegevens gesynchroniseerd op uw apparaten","Conta gratuita · dados sincronizados nos seus dispositivos"],"Combien il vous en reste. C’est tout.":["How much you have left. That is all.","Cuánto le queda. Eso es todo.","Quanto ne rimane. Tutto qui.","Wie viel noch da ist. Das ist alles.","Hoeveel u nog heeft. Dat is alles.","Quanto lhe resta. É tudo."],"Combien il vous en reste. C’est tout ce que l’appli vous demande.":["How much you have left. That is all the app needs.","Cuánto le queda. Es todo lo que pide la aplicación.","Quanto ne rimane. È tutto ciò che chiede l’app.","Wie viel noch da ist. Mehr braucht die App nicht.","Hoeveel u nog heeft. Meer vraagt de app niet.","Quanto lhe resta. É tudo o que a aplicação pede."],"Ce qui manque, qui appeler et avant quelle heure — sans inventer prix ni disponibilité.":["What is missing, who to call and by when — without inventing prices or availability.","Qué falta, a quién llamar y antes de qué hora — sin inventar precios ni disponibilidad.","Cosa manca, chi chiamare ed entro quando — senza inventare prezzi o disponibilità.","Was fehlt, wen Sie anrufen und bis wann — ohne erfundene Preise oder Verfügbarkeiten.","Wat ontbreekt, wie u belt en vóór hoe laat — zonder prijzen of beschikbaarheid te verzinnen.","O que falta, a quem ligar e até quando — sem inventar preços ou disponibilidade."],"Consultation uniquement":["View only","Solo consulta","Sola lettura","Nur Ansicht","Alleen bekijken","Só consulta"],"Votre gérant vous autorise à voir les commandes, sans les modifier ni changer leur statut.":["Your manager allows you to view orders, without editing them or changing their status.","Su gerente le permite ver pedidos, sin modificarlos ni cambiar su estado.","Il responsabile consente di vedere gli ordini, senza modificarli o cambiarne lo stato.","Sie dürfen Bestellungen ansehen, aber weder bearbeiten noch ihren Status ändern.","Uw beheerder laat u bestellingen bekijken, zonder deze of hun status te wijzigen.","O gerente permite consultar encomendas, sem as editar ou alterar o estado."],"Ces contraintes empêchent Verdict de proposer un colis impossible ou un stock qui périme.":["These constraints prevent impossible pack sizes or stock that expires.","Estas restricciones evitan bultos imposibles o stock que caduca.","Questi vincoli evitano confezioni impossibili o scorte che scadono.","Diese Vorgaben verhindern unmögliche Packmengen und ablaufende Bestände.","Deze voorwaarden voorkomen onmogelijke verpakkingen of voorraad die vervalt.","Estas restrições evitam embalagens impossíveis ou stock que expira."],"Envoyer à Verdict®":["Send to Verdict®","Enviar a Verdict®","Inviare a Verdict®","An Verdict® senden","Naar Verdict® sturen","Enviar para Verdict®"],"Enregistrer ce comptage":["Save this count","Guardar este conteo","Salvare questo conteggio","Diese Zählung speichern","Deze telling opslaan","Guardar esta contagem"],"Historique des comptages":["Count history","Historial de conteos","Cronologia dei conteggi","Zählungsverlauf","Telgeschiedenis","Histórico de contagens"],"Copier la valeur connue":["Copy the known value","Copiar el valor conocido","Copiare il valore noto","Bekannten Wert kopieren","Bekende waarde kopiëren","Copiar o valor conhecido"],"Valeur du stock":["Stock value","Valor del stock","Valore delle scorte","Bestandswert","Voorraadwaarde","Valor do stock"],"Inventaire valorisé complet.":["Fully valued inventory.","Inventario totalmente valorado.","Inventario interamente valorizzato.","Vollständig bewertetes Inventar.","Volledig gewaardeerde voorraad.","Inventário totalmente valorizado."],"complet":["complete","completo","completo","vollständig","volledig","completo"],"comptage + prix complets":["count and prices complete","conteo y precios completos","conteggio e prezzi completi","Zählung und Preise vollständig","telling en prijzen volledig","contagem e preços completos"],"références valorisées":["valued items","referencias valoradas","articoli valorizzati","bewertete Artikel","gewaardeerde artikelen","referências valorizadas"],"à commander":["to order","por pedir","da ordinare","zu bestellen","te bestellen","a encomendar"],"🔴 rupture":["🔴 out of stock","🔴 agotado","🔴 esaurito","🔴 nicht vorrätig","🔴 uitverkocht","🔴 rutura"],"🟡 à commander":["🟡 to order","🟡 por pedir","🟡 da ordinare","🟡 zu bestellen","🟡 te bestellen","🟡 a encomendar"],"Référence fournisseur":["Supplier reference","Referencia del proveedor","Riferimento fornitore","Lieferantenartikelnummer","Leveranciersreferentie","Referência do fornecedor"],"Référence et alternatives fournisseur":["Supplier reference and alternatives","Referencia y alternativas del proveedor","Riferimento e alternative del fornitore","Lieferantenartikelnummer und Alternativen","Leveranciersreferentie en alternatieven","Referência e alternativas do fornecedor"],"+ Ajouter un autre fournisseur":["+ Add another supplier","+ Añadir otro proveedor","+ Aggiungere un altro fornitore","+ Weiteren Lieferanten hinzufügen","+ Andere leverancier toevoegen","+ Adicionar outro fornecedor"],"Date du prix observé":["Observed price date","Fecha del precio observado","Data del prezzo osservato","Datum des beobachteten Preises","Datum waargenomen prijs","Data do preço observado"],"Date du prix":["Price date","Fecha del precio","Data del prezzo","Preisdatum","Prijsdatum","Data do preço"],"Priorité":["Priority","Prioridad","Priorità","Priorität","Prioriteit","Prioridade"],"Prix HT / unité":["Price excl. tax / unit","Precio sin impuestos / unidad","Prezzo IVA esclusa / unità","Nettopreis / Einheit","Prijs excl. btw / eenheid","Preço sem impostos / unidade"],"Ajouter une alternative":["Add an alternative","Añadir una alternativa","Aggiungere un’alternativa","Alternative hinzufügen","Alternatief toevoegen","Adicionar alternativa"],"Supprimer cette alternative":["Delete this alternative","Eliminar esta alternativa","Eliminare questa alternativa","Diese Alternative löschen","Dit alternatief verwijderen","Eliminar esta alternativa"],"Aucune alternative. Verdict gardera le fournisseur principal même si son passage est trop tardif.":["No alternative. Verdict keeps the main supplier even if its delivery is too late.","Sin alternativa. Verdict mantiene el proveedor principal aunque entregue demasiado tarde.","Nessuna alternativa. Verdict mantiene il fornitore principale anche se la consegna è tardiva.","Keine Alternative. Verdict behält den Hauptlieferanten, auch bei zu später Lieferung.","Geen alternatief. Verdict houdt de hoofdleverancier aan, ook bij een te late levering.","Sem alternativa. O Verdict mantém o fornecedor principal mesmo com entrega tardia."],"Le prix reste « non daté » si vous ne connaissez pas sa date. Les alternatives ne sont utilisées que si leur livraison renseignée répond mieux au besoin.":["The price remains “undated” if its date is unknown. Alternatives are used only if their recorded delivery better meets the need.","El precio queda «sin fecha» si se desconoce. Solo se usan alternativas si su entrega registrada responde mejor a la necesidad.","Il prezzo resta «senza data» se non nota. Le alternative si usano solo se la consegna indicata risponde meglio al bisogno.","Ohne bekanntes Datum bleibt der Preis undatiert. Alternativen werden nur genutzt, wenn ihre angegebene Lieferung den Bedarf besser deckt.","Een onbekende prijsdatum blijft ongedateerd. Alternatieven worden alleen gebruikt als de opgegeven levering beter aansluit bij de behoefte.","Sem data conhecida, o preço fica «sem data». As alternativas só são usadas se a entrega indicada responder melhor à necessidade."],"Le prix renseigné date de plus de 30 jours et doit être revérifié.":["The recorded price is over 30 days old and needs checking.","El precio registrado tiene más de 30 días y debe comprobarse.","Il prezzo registrato risale a oltre 30 giorni fa e va verificato.","Der Preis ist über 30 Tage alt und muss geprüft werden.","De prijs is ouder dan 30 dagen en moet worden gecontroleerd.","O preço registado tem mais de 30 dias e deve ser verificado."],"Prix ancien":["Old price","Precio antiguo","Prezzo datato","Veralteter Preis","Oude prijs","Preço antigo"],"Prix de plus de 30 jours":["Price over 30 days old","Precio de más de 30 días","Prezzo più vecchio di 30 giorni","Preis älter als 30 Tage","Prijs ouder dan 30 dagen","Preço com mais de 30 dias"],"Actualiser le prix":["Update price","Actualizar precio","Aggiornare prezzo","Preis aktualisieren","Prijs bijwerken","Atualizar preço"],"Enregistrer et recalculer":["Save and recalculate","Guardar y recalcular","Salvare e ricalcolare","Speichern und neu berechnen","Opslaan en herberekenen","Guardar e recalcular"],"Ce qu’il faut vérifier":["What needs checking","Qué hay que comprobar","Cosa verificare","Was zu prüfen ist","Wat te controleren","O que verificar"],"Touchez le badge pour voir chaque contrôle et le corriger.":["Tap the badge to view and resolve each check.","Toque la insignia para ver y resolver cada comprobación.","Tocchi il badge per vedere e risolvere ogni controllo.","Tippen Sie auf das Symbol, um jede Prüfung zu sehen und zu korrigieren.","Tik op de badge om elke controle te bekijken en op te lossen.","Toque no indicador para ver e resolver cada verificação."],"Confirmer les horaires":["Confirm schedule","Confirmar horarios","Confermare orari","Zeiten bestätigen","Tijden bevestigen","Confirmar horários"],"Modifier la date du besoin":["Change required date","Cambiar fecha de necesidad","Modificare data del fabbisogno","Bedarfsdatum ändern","Benodigde datum wijzigen","Alterar data da necessidade"],"Modifier le fournisseur":["Edit supplier","Modificar proveedor","Modificare fornitore","Lieferant bearbeiten","Leverancier bewerken","Editar fornecedor"],"Passages de commande et livraison":["Order and delivery slots","Horarios de pedido y entrega","Orari di ordine e consegna","Bestell- und Liefertermine","Bestel- en levermomenten","Horários de encomenda e entrega"],"+ Ajouter un passage":["+ Add a slot","+ Añadir un horario","+ Aggiungere un orario","+ Termin hinzufügen","+ Moment toevoegen","+ Adicionar horário"],"Ajouter un passage":["Add a slot","Añadir un horario","Aggiungere un orario","Termin hinzufügen","Moment toevoegen","Adicionar horário"],"Passage":["Slot","Horario","Orario","Termin","Moment","Horário"],"Nom du passage":["Slot name","Nombre del horario","Nome dell’orario","Terminname","Naam van moment","Nome do horário"],"Jour limite":["Deadline day","Día límite","Giorno limite","Stichtag","Uiterste dag","Dia limite"],"Heure limite":["Deadline time","Hora límite","Ora limite","Fristzeit","Uiterste tijd","Hora limite"],"Jour de livraison":["Delivery day","Día de entrega","Giorno di consegna","Liefertag","Leverdag","Dia de entrega"],"Début livraison":["Delivery start","Inicio de entrega","Inizio consegna","Lieferbeginn","Begin levering","Início da entrega"],"Fin livraison":["Delivery end","Fin de entrega","Fine consegna","Lieferende","Einde levering","Fim da entrega"],"Passage actif":["Active slot","Horario activo","Orario attivo","Aktiver Termin","Actief moment","Horário ativo"],"Valable à partir du":["Valid from","Válido desde","Valido dal","Gültig ab","Geldig vanaf","Válido a partir de"],"Jusqu’au":["Until","Hasta","Fino al","Bis","Tot en met","Até"],"Supprimer ce passage":["Delete this slot","Eliminar este horario","Eliminare questo orario","Diesen Termin löschen","Dit moment verwijderen","Eliminar este horário"],"Aucun passage : Verdict ne peut pas calculer de compte à rebours.":["No slot: Verdict cannot calculate a countdown.","Sin horario: Verdict no puede calcular una cuenta atrás.","Nessun orario: Verdict non può calcolare un conto alla rovescia.","Kein Termin: Verdict kann keinen Countdown berechnen.","Geen moment: Verdict kan geen aftelling berekenen.","Sem horário: o Verdict não pode calcular uma contagem decrescente."],"N° client":["Customer number","N.º de cliente","N. cliente","Kundennummer","Klantnummer","N.º de cliente"],"Adresse du portail":["Portal address","Dirección del portal","Indirizzo portale","Portaladresse","Portaaladres","Endereço do portal"],"Minimum de commande HT (€)":["Minimum order excl. tax (€)","Pedido mínimo sin impuestos (€)","Ordine minimo IVA esclusa (€)","Mindestbestellwert netto (€)","Minimumbestelling excl. btw (€)","Encomenda mínima sem impostos (€)"],"Franco de livraison HT (€)":["Free delivery threshold excl. tax (€)","Umbral de envío gratis sin impuestos (€)","Soglia consegna gratuita IVA esclusa (€)","Frei-Haus-Grenze netto (€)","Franco leveringsgrens excl. btw (€)","Limite de entrega gratuita sem impostos (€)"],"Frais de livraison connus sous franco (€)":["Known delivery fee below threshold (€)","Gastos de envío conocidos bajo el umbral (€)","Spese note sotto la soglia (€)","Bekannte Lieferkosten unter der Grenze (€)","Bekende bezorgkosten onder grens (€)","Portes conhecidos abaixo do limite (€)"],"Date de vérification":["Verification date","Fecha de comprobación","Data di verifica","Prüfdatum","Controledatum","Data de verificação"],"Horaires confirmés avec le fournisseur":["Schedule confirmed with the supplier","Horarios confirmados con el proveedor","Orari confermati con il fornitore","Mit dem Lieferanten bestätigte Zeiten","Tijden bevestigd met leverancier","Horários confirmados com o fornecedor"],"Renseignez uniquement vos accords réels. Un horaire non confirmé reste signalé.":["Enter only actual agreements. Unconfirmed times remain flagged.","Indique solo acuerdos reales. Los horarios no confirmados siguen señalados.","Inserire solo accordi reali. Gli orari non confermati restano segnalati.","Tragen Sie nur tatsächliche Vereinbarungen ein. Unbestätigte Zeiten bleiben markiert.","Voer alleen werkelijke afspraken in. Onbevestigde tijden blijven gemarkeerd.","Indique apenas acordos reais. Horários não confirmados continuam assinalados."],"Livraison non confirmée par le fournisseur":["Delivery not confirmed by supplier","Entrega no confirmada por el proveedor","Consegna non confermata dal fornitore","Lieferung vom Lieferanten nicht bestätigt","Levering niet bevestigd door leverancier","Entrega não confirmada pelo fornecedor"],"Livraison impossible":["Delivery impossible","Entrega imposible","Consegna impossibile","Lieferung unmöglich","Levering onmogelijk","Entrega impossível"],"Livraison après le besoin":["Delivery after required date","Entrega después de la necesidad","Consegna dopo il fabbisogno","Lieferung nach dem Bedarf","Levering na benodigde datum","Entrega após a necessidade"],"Prochains passages réels":["Next actual slots","Próximos horarios reales","Prossimi orari effettivi","Nächste tatsächliche Termine","Volgende werkelijke momenten","Próximos horários reais"],"Prochaines commandes":["Upcoming orders","Próximos pedidos","Prossimi ordini","Nächste Bestellungen","Komende bestellingen","Próximas encomendas"],"Absence exceptionnelle du fournisseur":["Exceptional supplier absence","Ausencia excepcional del proveedor","Assenza eccezionale del fornitore","Außerplanmäßige Abwesenheit des Lieferanten","Uitzonderlijke afwezigheid leverancier","Ausência excecional do fornecedor"],"Aucune absence exceptionnelle renseignée.":["No exceptional absence entered.","Sin ausencia excepcional registrada.","Nessuna assenza eccezionale inserita.","Keine außerplanmäßige Abwesenheit eingetragen.","Geen uitzonderlijke afwezigheid ingevoerd.","Nenhuma ausência excecional registada."],"Retirer":["Remove","Retirar","Rimuovere","Entfernen","Verwijderen","Remover"],"Ouverture exceptionnelle":["Exceptional opening","Apertura excepcional","Apertura straordinaria","Sonderöffnung","Uitzonderlijke opening","Abertura excecional"],"Note facultative":["Optional note","Nota opcional","Nota facoltativa","Optionale Notiz","Optionele notitie","Nota opcional"],"Une absence supprime uniquement ce passage. Aucun report au lendemain n’est inventé.":["An absence removes only that slot. No next-day rescheduling is assumed.","Una ausencia elimina solo ese horario. No se supone un traslado al día siguiente.","Un’assenza elimina solo quell’orario. Non si presume uno spostamento al giorno dopo.","Eine Abwesenheit entfernt nur diesen Termin. Eine Verschiebung auf morgen wird nicht angenommen.","Een afwezigheid verwijdert alleen dat moment. Verschuiving naar morgen wordt niet aangenomen.","Uma ausência elimina apenas esse horário. Não se pressupõe adiamento para o dia seguinte."],"Calendrier de l’établissement":["Establishment calendar","Calendario del local","Calendario del locale","Betriebskalender","Vestigingskalender","Calendário do estabelecimento"],"Semaine habituelle":["Usual week","Semana habitual","Settimana abituale","Übliche Woche","Gebruikelijke week","Semana habitual"],"Saisons":["Seasons","Temporadas","Stagioni","Saisons","Seizoenen","Épocas"],"Saison":["Season","Temporada","Stagione","Saison","Seizoen","Época"],"Saisonnalité facultative":["Optional seasonality","Estacionalidad opcional","Stagionalità facoltativa","Optionale Saisonabhängigkeit","Optionele seizoensinvloed","Sazonalidade opcional"],"+ Ajouter une saison":["+ Add a season","+ Añadir temporada","+ Aggiungere stagione","+ Saison hinzufügen","+ Seizoen toevoegen","+ Adicionar época"],"Ajouter une saison":["Add a season","Añadir temporada","Aggiungere stagione","Saison hinzufügen","Seizoen toevoegen","Adicionar época"],"Supprimer la saison":["Delete season","Eliminar temporada","Eliminare stagione","Saison löschen","Seizoen verwijderen","Eliminar época"],"Aucune saison : la semaine habituelle s’applique toute l’année.":["No season: the usual week applies all year.","Sin temporada: la semana habitual se aplica todo el año.","Nessuna stagione: la settimana abituale vale tutto l’anno.","Keine Saison: Die übliche Woche gilt ganzjährig.","Geen seizoen: de gebruikelijke week geldt het hele jaar.","Sem época: a semana habitual aplica-se todo o ano."],"Ouvertures et fermetures exceptionnelles":["Exceptional openings and closures","Aperturas y cierres excepcionales","Aperture e chiusure straordinarie","Sonderöffnungen und Schließungen","Uitzonderlijke openingen en sluitingen","Aberturas e encerramentos excecionais"],"+ Ajouter une exception":["+ Add an exception","+ Añadir excepción","+ Aggiungere eccezione","+ Ausnahme hinzufügen","+ Uitzondering toevoegen","+ Adicionar exceção"],"Ajouter une exception":["Add an exception","Añadir excepción","Aggiungere eccezione","Ausnahme hinzufügen","Uitzondering toevoegen","Adicionar exceção"],"Supprimer l’exception":["Delete exception","Eliminar excepción","Eliminare eccezione","Ausnahme löschen","Uitzondering verwijderen","Eliminar exceção"],"Exception":["Exception","Excepción","Eccezione","Ausnahme","Uitzondering","Exceção"],"Aucune exception datée.":["No dated exception.","Sin excepción fechada.","Nessuna eccezione datata.","Keine datierte Ausnahme.","Geen gedateerde uitzondering.","Nenhuma exceção datada."],"Début":["Start","Inicio","Inizio","Beginn","Begin","Início"],"Fin":["End","Fin","Fine","Ende","Einde","Fim"],"Du":["From","Desde","Dal","Vom","Van","De"],"Au":["To","Hasta","Al","Bis","Tot","Até"],"Ouvert":["Open","Abierto","Aperto","Geöffnet","Open","Aberto"],"Fermé sans accès":["Closed, no access","Cerrado sin acceso","Chiuso senza accesso","Geschlossen, kein Zugang","Gesloten zonder toegang","Fechado sem acesso"],"Fermé sans aucun accès":["Closed, no access at all","Cerrado sin ningún acceso","Chiuso senza alcun accesso","Geschlossen, keinerlei Zugang","Gesloten zonder enige toegang","Fechado sem qualquer acesso"],"Fermé au public":["Closed to the public","Cerrado al público","Chiuso al pubblico","Für Gäste geschlossen","Gesloten voor publiek","Fechado ao público"],"Fermé au public — accès fournisseur selon accord":["Closed to public — supplier access by agreement","Cerrado al público — acceso del proveedor según acuerdo","Chiuso al pubblico — accesso fornitore secondo accordi","Für Gäste geschlossen — Lieferantenzugang nach Vereinbarung","Gesloten voor publiek — leverancierstoegang volgens afspraak","Fechado ao público — acesso do fornecedor por acordo"],"État":["Status","Estado","Stato","Status","Status","Estado"],"Motif / note":["Reason / note","Motivo / nota","Motivo / nota","Grund / Notiz","Reden / notitie","Motivo / nota"],"Prévisualisation des 14 prochains jours":["Preview of the next 14 days","Vista previa de los próximos 14 días","Anteprima dei prossimi 14 giorni","Vorschau der nächsten 14 Tage","Voorbeeld van de volgende 14 dagen","Pré-visualização dos próximos 14 dias"],"Livraison lorsque l’établissement est fermé":["Delivery while the establishment is closed","Entrega con el local cerrado","Consegna a locale chiuso","Lieferung bei geschlossenem Betrieb","Levering bij gesloten vestiging","Entrega com o estabelecimento fechado"],"Accès convenu":["Agreed access","Acceso acordado","Accesso concordato","Vereinbarter Zugang","Afgesproken toegang","Acesso acordado"],"Oui, équipe présente":["Yes, staff present","Sí, equipo presente","Sì, personale presente","Ja, Team anwesend","Ja, team aanwezig","Sim, equipa presente"],"Oui, fournisseur autorisé à entrer":["Yes, supplier authorised to enter","Sí, proveedor autorizado a entrar","Sì, fornitore autorizzato a entrare","Ja, Lieferant darf eintreten","Ja, leverancier mag binnenkomen","Sim, fornecedor autorizado a entrar"],"Consignes d’accès et de rangement":["Access and storage instructions","Instrucciones de acceso y almacenamiento","Istruzioni di accesso e sistemazione","Zugangs- und Lageranweisungen","Toegangs- en opslaginstructies","Instruções de acesso e arrumação"],"Accès autonome explicitement autorisé":["Unattended access explicitly authorised","Acceso autónomo expresamente autorizado","Accesso autonomo esplicitamente autorizzato","Unbegleiteter Zugang ausdrücklich erlaubt","Zelfstandige toegang uitdrukkelijk toegestaan","Acesso autónomo explicitamente autorizado"],"Le fournisseur peut ranger la marchandise":["Supplier may put goods away","El proveedor puede guardar la mercancía","Il fornitore può sistemare la merce","Lieferant darf Ware einlagern","Leverancier mag goederen opbergen","O fornecedor pode arrumar a mercadoria"],"Contrôle obligatoire à la prochaine présence":["Mandatory check at next attendance","Control obligatorio en la próxima presencia","Controllo obbligatorio alla prossima presenza","Prüfung bei nächster Anwesenheit erforderlich","Verplichte controle bij volgende aanwezigheid","Controlo obrigatório na próxima presença"],"Traces demandées":["Required evidence","Pruebas requeridas","Prove richieste","Erforderliche Nachweise","Gevraagd bewijs","Provas exigidas"],"Bon de livraison":["Delivery note","Albarán","Bolla di consegna","Lieferschein","Pakbon","Guia de remessa"],"Photo facultative":["Optional photo","Foto opcional","Foto facoltativa","Optionales Foto","Optionele foto","Fotografia opcional"],"Température":["Temperature","Temperatura","Temperatura","Temperatur","Temperatuur","Temperatura"],"Scellé / journal d’accès":["Seal / access log","Precinto / registro de acceso","Sigillo / registro accessi","Siegel / Zugangsprotokoll","Verzegeling / toegangslog","Selo / registo de acesso"],"Réception différée :":["Deferred receipt:","Recepción diferida:","Ricezione differita:","Verzögerte Annahme:","Uitgestelde ontvangst:","Receção diferida:"],"Mode de comptage":["Counting mode","Modo de conteo","Modalità di conteggio","Zählmodus","Telmethode","Modo de contagem"],"Unité entière":["Whole unit","Unidad entera","Unità intera","Ganze Einheit","Hele eenheid","Unidade inteira"],"Bouteille ouverte":["Open bottle","Botella abierta","Bottiglia aperta","Offene Flasche","Open fles","Garrafa aberta"],"Fût / volume restant":["Keg / remaining volume","Barril / volumen restante","Fusto / volume residuo","Fass / Restvolumen","Vat / resterend volume","Barril / volume restante"],"Poids":["Weight","Peso","Peso","Gewicht","Gewicht","Peso"],"Contenance (si bouteille, en cl)":["Capacity (bottle, in cl)","Capacidad (botella, en cl)","Capacità (bottiglia, in cl)","Füllmenge (Flasche, in cl)","Inhoud (fles, in cl)","Capacidade (garrafa, em cl)"],"Portion / dose dans l’unité du stock":["Portion / measure in the stock unit","Porción / dosis en unidad de stock","Porzione / dose nell’unità di stock","Portion / Maß in Bestandseinheit","Portie / maat in voorraadeenheid","Porção / dose na unidade de stock"],"Nom de la portion":["Portion name","Nombre de la porción","Nome della porzione","Portionsname","Portienaam","Nome da porção"],"Consigne récupérable / contenant (€)":["Refundable deposit / container (€)","Depósito recuperable / envase (€)","Cauzione rimborsabile / contenitore (€)","Rückerstattbares Pfand / Behälter (€)","Terugbetaalbaar statiegeld / verpakking (€)","Caução recuperável / recipiente (€)"],"Stratégie Bar":["Bar strategy","Estrategia Bar","Strategia Bar","Bar-Strategie","Barstrategie","Estratégia Bar"],"Bar · Spiritueux · unités de service":["Bar · Spirits · serving units","Bar · Licores · unidades de servicio","Bar · Distillati · unità di servizio","Bar · Spirituosen · Ausschankeinheiten","Bar · Gedistilleerd · serveereenheden","Bar · Espirituosas · unidades de serviço"],"La consigne reste séparée du coût matière. Une bouteille ouverte peut être saisie en décimal : 8,4 = 8 bouteilles pleines + environ 40 % d’une bouteille.":["Deposits stay separate from ingredient cost. Open bottles may be entered as decimals: 8.4 = 8 full bottles + about 40% of a bottle.","El depósito se separa del coste de materia prima. Botellas abiertas en decimal: 8,4 = 8 llenas + cerca del 40 % de una botella.","La cauzione resta separata dal costo materia. Bottiglie aperte in decimali: 8,4 = 8 piene + circa il 40% di una bottiglia.","Pfand bleibt vom Wareneinsatz getrennt. Offene Flaschen als Dezimalzahl: 8,4 = 8 volle Flaschen + etwa 40 % einer Flasche.","Statiegeld blijft apart van materiaalkosten. Open flessen als decimaal: 8,4 = 8 volle flessen + circa 40% van een fles.","A caução fica separada do custo de matéria-prima. Garrafas abertas em decimal: 8,4 = 8 cheias + cerca de 40% de uma garrafa."],"Plus Inventaire":["More Inventory","Más Inventario","Altro Inventario","Mehr Inventar","Meer Voorraad","Mais Inventário"],"INVENTAIRE · OUTILS":["INVENTORY · TOOLS","INVENTARIO · HERRAMIENTAS","INVENTARIO · STRUMENTI","INVENTAR · WERKZEUGE","VOORRAAD · HULPMIDDELEN","INVENTÁRIO · FERRAMENTAS"],"Chaque outil reste ici, relié au même établissement.":["Every tool stays here, linked to the same establishment.","Cada herramienta sigue aquí, vinculada al mismo local.","Ogni strumento resta qui, collegato allo stesso locale.","Alle Werkzeuge bleiben hier mit demselben Betrieb verbunden.","Elke functie blijft hier, gekoppeld aan dezelfde vestiging.","Cada ferramenta fica aqui, ligada ao mesmo estabelecimento."],"Tout ce qui concerne les achats et les stocks":["Everything about purchasing and stock","Todo sobre compras y stock","Tutto su acquisti e scorte","Alles zu Einkauf und Bestand","Alles over inkoop en voorraad","Tudo sobre compras e stock"],"Produits, fournisseurs, seuils de comptage, sauvegarde et accès Inventaire.":["Products, suppliers, counting thresholds, backup and Inventory access.","Productos, proveedores, umbrales, copias y acceso al Inventario.","Prodotti, fornitori, soglie, backup e accesso all’Inventario.","Produkte, Lieferanten, Zählschwellen, Sicherung und Inventarzugang.","Producten, leveranciers, teldrempels, back-up en voorraadtoegang.","Produtos, fornecedores, limites, cópias e acesso ao Inventário."],"Produits, zones, unités, seuils et stock idéal":["Products, areas, units, thresholds and target stock","Productos, zonas, unidades, umbrales y stock objetivo","Prodotti, zone, unità, soglie e scorta obiettivo","Produkte, Bereiche, Einheiten, Schwellen und Zielbestand","Producten, zones, eenheden, drempels en doelvoorraad","Produtos, zonas, unidades, limites e stock ideal"],"Coordonnées, délais, tarifs et alternatives":["Contacts, lead times, prices and alternatives","Contactos, plazos, tarifas y alternativas","Contatti, tempi, prezzi e alternative","Kontakte, Lieferzeiten, Preise und Alternativen","Contacten, levertijden, prijzen en alternatieven","Contactos, prazos, preços e alternativas"],"Préparer, envoyer, confirmer et réceptionner":["Prepare, send, confirm and receive","Preparar, enviar, confirmar y recibir","Preparare, inviare, confermare e ricevere","Vorbereiten, senden, bestätigen und annehmen","Voorbereiden, versturen, bevestigen en ontvangen","Preparar, enviar, confirmar e receber"],"Achats et factures":["Purchases and invoices","Compras y facturas","Acquisti e fatture","Einkäufe und Rechnungen","Inkopen en facturen","Compras e faturas"],"Factures structurées, prix et coût matière réel":["Structured invoices, prices and actual ingredient cost","Facturas estructuradas, precios y coste real de materia prima","Fatture strutturate, prezzi e costo materia effettivo","Strukturierte Rechnungen, Preise und tatsächlicher Wareneinsatz","Gestructureerde facturen, prijzen en werkelijke materiaalkosten","Faturas estruturadas, preços e custo real de matéria-prima"],"Suivi des commandes":["Order tracking","Seguimiento de pedidos","Monitoraggio ordini","Bestellverfolgung","Bestellingen volgen","Acompanhamento de encomendas"],"Paramètres de comptage":["Counting settings","Ajustes de conteo","Impostazioni conteggio","Zähleinstellungen","Telinstellingen","Definições de contagem"],"Ruptures":["Out of stock","Agotados","Esauriti","Fehlbestände","Uitverkocht","Ruturas"],"Ruptures suivies":["Tracked shortages","Roturas seguidas","Carenze monitorate","Verfolgte Fehlbestände","Gevolgde tekorten","Ruturas acompanhadas"],"Manque de stock":["Stock shortage","Falta de stock","Carenza di scorte","Bestandsmangel","Voorraadtekort","Falta de stock"],"Besoin total":["Total requirement","Necesidad total","Fabbisogno totale","Gesamtbedarf","Totale behoefte","Necessidade total"],"Besoin brut":["Gross requirement","Necesidad bruta","Fabbisogno lordo","Bruttobedarf","Brutobehoefte","Necessidade bruta"],"Nécessaire pour le":["Required by","Necesario para el","Necessario per il","Benötigt bis","Nodig op","Necessário para"],"+ Saisir un besoin":["+ Enter a requirement","+ Introducir necesidad","+ Inserire fabbisogno","+ Bedarf eingeben","+ Behoefte invoeren","+ Inserir necessidade"],"Ajouter ce besoin daté":["Add this dated requirement","Añadir esta necesidad fechada","Aggiungere questo fabbisogno datato","Diesen datierten Bedarf hinzufügen","Deze gedateerde behoefte toevoegen","Adicionar esta necessidade datada"],"Enregistrer la réception":["Save receipt","Guardar recepción","Salvare ricezione","Wareneingang speichern","Ontvangst opslaan","Guardar receção"],"Total estimé":["Estimated total","Total estimado","Totale stimato","Geschätzte Summe","Geschat totaal","Total estimado"],"Copier la simulation":["Copy simulation","Copiar simulación","Copiare simulazione","Simulation kopieren","Simulatie kopiëren","Copiar simulação"],"Simuler la commande passée":["Simulate order placed","Simular pedido realizado","Simulare ordine effettuato","Aufgegebene Bestellung simulieren","Geplaatste bestelling simuleren","Simular encomenda feita"],"Démonstration fictive":["Fictional demonstration","Demostración ficticia","Dimostrazione fittizia","Fiktive Demonstration","Fictieve demonstratie","Demonstração fictícia"],"Démonstration fictive :":["Fictional demonstration:","Demostración ficticia:","Dimostrazione fittizia:","Fiktive Demonstration:","Fictieve demonstratie:","Demonstração fictícia:"],"aucun partage, portail ou contact fournisseur n’est possible. Les états ci-dessous sont seulement simulés.":["no sharing, portal or supplier contact is possible. The statuses below are simulated only.","no se puede compartir ni acceder a portales o proveedores. Los estados siguientes son simulados.","nessuna condivisione, portale o contatto fornitore è possibile. Gli stati seguenti sono solo simulati.","Teilen, Portale und Lieferantenkontakt sind nicht möglich. Die folgenden Status sind nur simuliert.","delen, portaal of leverancierscontact is niet mogelijk. Onderstaande statussen zijn alleen gesimuleerd.","não é possível partilhar nem aceder a portais ou fornecedores. Os estados abaixo são apenas simulados."],"Besoins, références, horaires limites et alternatives sont rangés par fournisseur.":["Requirements, references, deadlines and alternatives are grouped by supplier.","Necesidades, referencias, plazos y alternativas se agrupan por proveedor.","Fabbisogni, riferimenti, scadenze e alternative sono raggruppati per fornitore.","Bedarf, Artikelnummern, Fristen und Alternativen sind nach Lieferant geordnet.","Behoeften, referenties, termijnen en alternatieven zijn per leverancier gegroepeerd.","Necessidades, referências, prazos e alternativas agrupam-se por fornecedor."],"Saisissez ce qui est réellement reçu. Si le stock actuel est inconnu, Verdict garde la case inconnue : une livraison ne transforme pas le vide en zéro.":["Enter what was actually received. Unknown current stock remains unknown: a delivery does not turn a blank into zero.","Introduzca lo realmente recibido. El stock desconocido sigue desconocido: una entrega no convierte un vacío en cero.","Inserire quanto realmente ricevuto. Le scorte sconosciute restano tali: una consegna non trasforma il vuoto in zero.","Tragen Sie die tatsächlich erhaltene Menge ein. Unbekannter Bestand bleibt unbekannt: Lieferung macht aus leer nicht null.","Voer in wat werkelijk is ontvangen. Onbekende voorraad blijft onbekend: een levering maakt van leeg geen nul.","Insira o que foi realmente recebido. Stock desconhecido continua desconhecido: uma entrega não transforma vazio em zero."],"Votre guide de comptage":["Your counting guide","Su guía de conteo","La guida al conteggio","Ihre Zählhilfe","Uw telgids","O seu guia de contagem"],"Que dois-je compter maintenant ?":["What should I count now?","¿Qué debo contar ahora?","Cosa devo contare ora?","Was soll ich jetzt zählen?","Wat moet ik nu tellen?","O que devo contar agora?"],"Vera voit-elle une incohérence ?":["Does Vera see an inconsistency?","¿Vera detecta una incoherencia?","Vera rileva un’incoerenza?","Erkennt Vera eine Unstimmigkeit?","Ziet Vera een inconsistentie?","A Vera deteta uma incoerência?"],"Mon stock est-il entièrement valorisé ?":["Is my stock fully valued?","¿Mi stock está totalmente valorado?","Le scorte sono interamente valorizzate?","Ist mein Bestand vollständig bewertet?","Is mijn voorraad volledig gewaardeerd?","O meu stock está totalmente valorizado?"],"Comment l’envoyer à Verdict ?":["How do I send it to Verdict?","¿Cómo lo envío a Verdict?","Come inviarlo a Verdict?","Wie sende ich es an Verdict?","Hoe stuur ik het naar Verdict?","Como enviar para o Verdict?"],"Vera — Inventaire":["Vera — Inventory","Vera — Inventario","Vera — Inventario","Vera — Inventar","Vera — Voorraad","Vera — Inventário"],"Ouvrir Vera — Inventaire":["Open Vera — Inventory","Abrir Vera — Inventario","Aprire Vera — Inventario","Vera — Inventar öffnen","Vera — Voorraad openen","Abrir Vera — Inventário"],"Demander à Vera — Inventaire":["Ask Vera — Inventory","Preguntar a Vera — Inventario","Chiedere a Vera — Inventario","Vera fragen — Inventar","Vraag Vera — Voorraad","Perguntar à Vera — Inventário"],"Conseil local sécurisé · Vera utilise uniquement l’établissement et la zone actifs · aucune donnée envoyée à un service externe.":["Secure local advice · Vera uses only the active establishment and area · no data sent to an external service.","Consejo local seguro · Vera usa solo el local y la zona activos · ningún dato se envía a un servicio externo.","Consiglio locale sicuro · Vera usa solo locale e zona attivi · nessun dato inviato a servizi esterni.","Sichere lokale Beratung · Vera nutzt nur aktiven Betrieb und Bereich · keine Daten an externe Dienste.","Veilig lokaal advies · Vera gebruikt alleen actieve vestiging en zone · geen gegevens naar externe diensten.","Conselho local seguro · a Vera usa apenas o estabelecimento e zona ativos · nenhum dado enviado a serviços externos."],"Le comptage actif est complet.":["The active count is complete.","El conteo activo está completo.","Il conteggio attivo è completo.","Die aktive Zählung ist vollständig.","De actieve telling is volledig.","A contagem ativa está completa."],"Vérifiez maintenant les lignes à commander, puis enregistrez l’inventaire.":["Now check the items to order, then save the inventory.","Revise ahora las líneas por pedir y guarde el inventario.","Verificare gli articoli da ordinare, poi salvare l’inventario.","Prüfen Sie nun die Bestellzeilen und speichern Sie das Inventar.","Controleer nu de bestelregels en sla de voorraad op.","Verifique agora as linhas a encomendar e guarde o inventário."],"Aucune incohérence de complétude sur le site actif.":["No completeness inconsistency at the active location.","No hay incoherencias de integridad en el local activo.","Nessuna incoerenza di completezza nel locale attivo.","Keine Vollständigkeitsprobleme am aktiven Standort.","Geen onvolledigheid bij de actieve vestiging.","Nenhuma incoerência de completude no local ativo."],"Toutes les quantités et tous les prix sont renseignés. Contrôlez encore visuellement les unités avant d’enregistrer.":["All quantities and prices are entered. Visually check units before saving.","Todas las cantidades y precios están introducidos. Revise visualmente las unidades antes de guardar.","Quantità e prezzi sono tutti inseriti. Controllare visivamente le unità prima di salvare.","Alle Mengen und Preise sind eingetragen. Prüfen Sie die Einheiten vor dem Speichern visuell.","Alle hoeveelheden en prijzen zijn ingevuld. Controleer de eenheden visueel vóór opslaan.","Todas as quantidades e preços estão preenchidos. Verifique visualmente as unidades antes de guardar."],"La valeur affichée peut être complète si toutes les quantités sont comptées.":["The displayed value can be complete if all quantities are counted.","El valor mostrado puede estar completo si todas las cantidades están contadas.","Il valore mostrato può essere completo se tutte le quantità sono contate.","Der angezeigte Wert kann vollständig sein, wenn alle Mengen gezählt wurden.","De getoonde waarde kan volledig zijn als alle hoeveelheden zijn geteld.","O valor apresentado pode estar completo se todas as quantidades estiverem contadas."],"Le transfert garde le bon établissement.":["The transfer keeps the correct establishment.","La transferencia conserva el local correcto.","Il trasferimento mantiene il locale corretto.","Die Übertragung behält den richtigen Betrieb bei.","De overdracht behoudt de juiste vestiging.","A transferência mantém o estabelecimento correto."],"Ouvrez Statistiques, enregistrez l’inventaire puis choisissez « Envoyer à Verdict ». Le premier comptage reste une base, pas une consommation inventée.":["Open Analysis, save the inventory, then choose “Send to Verdict”. The first count remains a baseline, never invented consumption.","Abra Análisis, guarde el inventario y elija «Enviar a Verdict». El primer conteo sigue siendo una base, no un consumo inventado.","Aprire Analisi, salvare l’inventario e scegliere «Inviare a Verdict». Il primo conteggio resta una base, non un consumo inventato.","Öffnen Sie Analyse, speichern Sie das Inventar und wählen Sie „An Verdict senden“. Die erste Zählung bleibt eine Basis, kein erfundener Verbrauch.","Open Analyse, sla de voorraad op en kies ‘Naar Verdict sturen’. De eerste telling blijft een basis, geen verzonnen verbruik.","Abra Análise, guarde o inventário e escolha «Enviar para Verdict». A primeira contagem continua a ser uma base, não um consumo inventado."],"Revenir en haut de la page":["Back to top","Volver arriba","Tornare in alto","Zum Seitenanfang","Terug naar boven","Voltar ao topo"],"Vue agrandie":["Magnified view","Vista ampliada","Vista ingrandita","Vergrößerte Ansicht","Vergrote weergave","Vista ampliada"],"Recentrer ici":["Recenter here","Centrar aquí","Ricentrare qui","Hier neu zentrieren","Hier centreren","Centrar aqui"],"Vue agrandie. Recentrer le contenu actif sans modifier le zoom.":["Magnified view. Recenter active content without changing zoom.","Vista ampliada. Centre el contenido activo sin cambiar el zoom.","Vista ingrandita. Ricentrare il contenuto attivo senza cambiare zoom.","Vergrößerte Ansicht. Aktiven Inhalt ohne Zoomänderung zentrieren.","Vergrote weergave. Centreer actieve inhoud zonder zoom te wijzigen.","Vista ampliada. Centre o conteúdo ativo sem alterar o zoom."],"Parcours":["Tour","Recorrido","Percorso","Rundgang","Rondleiding","Percurso"],"Rejouer":["Replay","Repetir","Ripetere","Erneut abspielen","Opnieuw afspelen","Repetir"],"Quitter":["Exit","Salir","Uscire","Beenden","Afsluiten","Sair"],"J’ai besoin de…":["I need…","Necesito…","Mi serve…","Ich brauche…","Ik heb nodig…","Preciso de…"],"besoin total à couvrir pour cette date":["total requirement to cover for that date","necesidad total para esa fecha","fabbisogno totale per quella data","gesamter Bedarf für dieses Datum","totale behoefte voor die datum","necessidade total para essa data"],"Tapez un produit, une référence ou un fournisseur. La quantité saisie est le":["Enter a product, reference or supplier. The quantity entered is the","Introduzca un producto, referencia o proveedor. La cantidad introducida es la","Inserire prodotto, riferimento o fornitore. La quantità inserita è il","Geben Sie Produkt, Artikelnummer oder Lieferant ein. Die eingegebene Menge ist der","Voer een product, referentie of leverancier in. De ingevoerde hoeveelheid is de","Insira produto, referência ou fornecedor. A quantidade inserida é a"],". Si le stock signale déjà un manque, Verdict retient le plus élevé des deux : il ne les additionne jamais.":[". If stock already shows a shortage, Verdict uses the higher of the two: it never adds them together.",". Si el stock ya muestra una falta, Verdict toma el mayor de ambos: nunca los suma.",". Se le scorte mostrano già una carenza, Verdict usa il maggiore dei due: non li somma mai.",". Wenn der Bestand bereits einen Mangel zeigt, nimmt Verdict den höheren Wert: Die beiden werden nie addiert.",". Als de voorraad al een tekort toont, neemt Verdict de hoogste waarde: ze worden nooit opgeteld.",". Se o stock já indicar falta, o Verdict usa o maior dos dois: nunca os soma."],"Verdict classe les besoins Cuisine et Bar par fournisseur, passage et heure limite. Deux livraisons différentes du même fournisseur restent deux commandes distinctes. Chaque carte reste « à compléter » ou « prête à vérifier » jusqu’à votre validation, puis passe au suivi : passée, confirmée, partielle ou réceptionnée. Le Bar conserve ses bouteilles ouvertes, fûts, doses et consignes.":["Verdict groups Kitchen and Bar requirements by supplier, delivery slot and deadline. Different deliveries from one supplier remain separate orders. Each card stays “incomplete” or “ready to check” until you confirm it, then is tracked as placed, confirmed, partial or received. The Bar keeps its open bottles, kegs, measures and deposits.","Verdict agrupa las necesidades de Cocina y Bar por proveedor, horario y límite. Entregas distintas del mismo proveedor siguen siendo pedidos separados. Cada tarjeta queda «por completar» o «lista para verificar» hasta su validación, y luego se sigue como realizada, confirmada, parcial o recibida. El Bar conserva botellas abiertas, barriles, dosis y depósitos.","Verdict raggruppa i fabbisogni di Cucina e Bar per fornitore, orario e scadenza. Consegne diverse dello stesso fornitore restano ordini separati. Ogni scheda resta «da completare» o «pronta da verificare» fino alla conferma, poi è seguita come effettuata, confermata, parziale o ricevuta. Il Bar mantiene bottiglie aperte, fusti, dosi e cauzioni.","Verdict ordnet Küchen- und Barbedarf nach Lieferant, Termin und Frist. Verschiedene Lieferungen desselben Lieferanten bleiben getrennte Bestellungen. Jede Karte bleibt bis zur Bestätigung „unvollständig“ oder „prüfbereit“; danach wird sie als aufgegeben, bestätigt, teilweise oder eingegangen verfolgt. Die Bar behält offene Flaschen, Fässer, Maße und Pfand.","Verdict groepeert Keuken- en Barbehoeften per leverancier, levermoment en deadline. Verschillende leveringen van één leverancier blijven aparte bestellingen. Elke kaart blijft ‘onvolledig’ of ‘klaar voor controle’ tot bevestiging, daarna gevolgd als geplaatst, bevestigd, gedeeltelijk of ontvangen. De Bar behoudt open flessen, vaten, maten en statiegeld.","O Verdict agrupa necessidades de Cozinha e Bar por fornecedor, horário e limite. Entregas diferentes do mesmo fornecedor continuam encomendas separadas. Cada cartão fica «por completar» ou «pronto a verificar» até confirmação, passando depois a feita, confirmada, parcial ou recebida. O Bar mantém garrafas abertas, barris, doses e cauções."],"rupture ou sous le minimum":["out of stock + below minimum","agotado + bajo mínimo","esaurito + sotto minimo","Fehlbestand + unter Minimum","uitverkocht + onder minimum","rutura + abaixo do mínimo"],"Votre stock est transmis à Verdict":["Shared evidence Inventory → Verdict","Prueba compartida Inventario → Verdict","Prova condivisa Inventario → Verdict","Gemeinsamer Nachweis Inventar → Verdict","Gedeeld bewijs Voorraad → Verdict","Prova partilhada Inventário → Verdict"],"même établissement":["same establishment","mismo local","stesso locale","derselbe Betrieb","dezelfde vestiging","mesmo estabelecimento"],"identifiant stable":["stable identifier","identificador estable","identificativo stabile","stabile Kennung","vaste identificatie","identificador estável"],"stock final observé":["observed closing stock","stock final observado","scorte finali osservate","beobachteter Endbestand","waargenomen eindvoorraad","stock final observado"],"Lun":["Mon","Lun","Lun","Mo","Ma","Seg"],"Mar":["Tue","Mar","Mar","Di","Di","Ter"],"Mer":["Wed","Mié","Mer","Mi","Wo","Qua"],"Jeu":["Thu","Jue","Gio","Do","Do","Qui"],"Ven":["Fri","Vie","Ven","Fr","Vr","Sex"],"Sam":["Sat","Sáb","Sab","Sa","Za","Sáb"],"Dim":["Sun","Dom","Dom","So","Zo","Dom"],"Jours fériés proposés":["Suggested public holidays","Festivos propuestos","Festività proposte","Vorgeschlagene Feiertage","Voorgestelde feestdagen","Feriados propostos"],"Ils restent ouverts par défaut. Touchez une date seulement si sa fermeture est réellement confirmée.":["They remain open by default. Tap a date only if closure is actually confirmed.","Permanecen abiertos por defecto. Toque una fecha solo si el cierre está confirmado.","Restano aperti per impostazione predefinita. Toccare una data solo se la chiusura è confermata.","Standardmäßig bleiben sie geöffnet. Datum nur bei tatsächlich bestätigter Schließung antippen.","Ze blijven standaard open. Tik alleen op een datum als sluiting werkelijk is bevestigd.","Continuam abertos por predefinição. Toque numa data apenas se o encerramento estiver confirmado."],"Fermé au public ne signifie pas forcément inaccessible aux fournisseurs. L’exception datée est prioritaire sur la saison, puis sur la semaine habituelle.":["Closed to the public does not always mean inaccessible to suppliers. A dated exception overrides the season, then the usual week.","Cerrado al público no siempre significa inaccesible para proveedores. La excepción fechada prevalece sobre la temporada y la semana habitual.","Chiuso al pubblico non significa sempre inaccessibile ai fornitori. L’eccezione datata prevale su stagione e settimana abituale.","Für Gäste geschlossen heißt nicht immer für Lieferanten unzugänglich. Eine datierte Ausnahme hat Vorrang vor Saison und üblicher Woche.","Gesloten voor publiek betekent niet altijd ontoegankelijk voor leveranciers. Een gedateerde uitzondering gaat vóór seizoen en gebruikelijke week.","Fechado ao público não significa sempre inacessível aos fornecedores. A exceção datada prevalece sobre a época e a semana habitual."],"les marchandises resteront « à contrôler ». Une caméra peut compléter les preuves, mais ne remplace pas le contrôle des quantités, températures et anomalies.":["goods remain “to check”. A camera can supplement evidence but cannot replace quantity, temperature and anomaly checks.","la mercancía queda «por controlar». Una cámara puede complementar pruebas, pero no sustituye el control de cantidades, temperaturas y anomalías.","la merce resta «da controllare». Una telecamera integra le prove, ma non sostituisce il controllo di quantità, temperature e anomalie.","Ware bleibt „zu prüfen“. Eine Kamera kann Nachweise ergänzen, ersetzt aber keine Mengen-, Temperatur- und Auffälligkeitsprüfung.","goederen blijven ‘te controleren’. Een camera kan bewijs aanvullen, maar geen controle van hoeveelheden, temperaturen en afwijkingen vervangen.","a mercadoria fica «por controlar». Uma câmara pode complementar provas, mas não substitui o controlo de quantidades, temperaturas e anomalias."],"Aucun passage possible dans les 60 prochains jours. Vérifiez le calendrier, les saisons, les exceptions et les horaires fournisseur.":["No possible slot in the next 60 days. Check the calendar, seasons, exceptions and supplier times.","Sin horario posible en los próximos 60 días. Revise calendario, temporadas, excepciones y horarios del proveedor.","Nessun orario possibile nei prossimi 60 giorni. Verificare calendario, stagioni, eccezioni e orari del fornitore.","Kein Termin in den nächsten 60 Tagen möglich. Kalender, Saisons, Ausnahmen und Lieferantenzeiten prüfen.","Geen moment mogelijk in de komende 60 dagen. Controleer kalender, seizoenen, uitzonderingen en leverancierstijden.","Nenhum horário possível nos próximos 60 dias. Verifique calendário, épocas, exceções e horários do fornecedor."],"modifier":["edit","editar","modificare","bearbeiten","bewerken","editar"],"Votre inventaire,":["Your inventory,","Su inventario,","Il suo inventario,","Ihr Inventar,","Uw voorraad,","O seu inventário,"],"enfin simple.":["finally simple.","por fin sencillo.","finalmente semplice.","endlich einfach.","eindelijk eenvoudig.","finalmente simples."],"Votre inventaire. Gratuit, sur tous vos appareils.":["Your inventory. Free, on all your devices.","Su inventario. Gratis, en todos sus dispositivos.","Il suo inventario. Gratuito, su tutti i dispositivi.","Ihr Inventar. Kostenlos auf allen Geräten.","Uw voorraad. Gratis op al uw apparaten.","O seu inventário. Gratuito, em todos os seus dispositivos."],"Un compte = vos données retrouvées partout.":["One account = your data available everywhere.","Una cuenta = sus datos disponibles en todas partes.","Un account = dati disponibili ovunque.","Ein Konto = Ihre Daten überall verfügbar.","Eén account = uw gegevens overal beschikbaar.","Uma conta = os seus dados disponíveis em todo o lado."],"Votre e-mail":["Your email","Su correo electrónico","La sua e-mail","Ihre E-Mail","Uw e-mail","O seu e-mail"],"Adresse e-mail":["Email address","Dirección de correo electrónico","Indirizzo e-mail","E-Mail-Adresse","E-mailadres","Endereço de e-mail"],"Mot de passe":["Password","Contraseña","Password","Passwort","Wachtwoord","Palavra-passe"],"Mot de passe (10 caractères min.)":["Password (10 characters minimum)","Contraseña (10 caracteres mínimo)","Password (minimo 10 caratteri)","Passwort (mindestens 10 Zeichen)","Wachtwoord (minimaal 10 tekens)","Palavra-passe (mínimo 10 caracteres)"],"Mot de passe oublié ?":["Forgot password?","¿Olvidó su contraseña?","Password dimenticata?","Passwort vergessen?","Wachtwoord vergeten?","Esqueceu a palavra-passe?"],"Me connecter":["Sign in","Iniciar sesión","Accedere","Anmelden","Inloggen","Iniciar sessão"],"Créer mon compte gratuit":["Create my free account","Crear mi cuenta gratuita","Creare il mio account gratuito","Mein kostenloses Konto erstellen","Mijn gratis account maken","Criar a minha conta gratuita"],"Enregistrer le nouveau mot de passe":["Save new password","Guardar nueva contraseña","Salvare nuova password","Neues Passwort speichern","Nieuw wachtwoord opslaan","Guardar nova palavra-passe"],"Gratuit, sans carte, sans engagement.":["Free, no card, no commitment.","Gratis, sin tarjeta ni compromiso.","Gratuito, senza carta né impegno.","Kostenlos, ohne Karte und Verpflichtung.","Gratis, zonder kaart of verplichting.","Gratuito, sem cartão nem compromisso."],"Votre prénom":["Your first name","Su nombre","Il suo nome","Ihr Vorname","Uw voornaam","O seu nome"],"Deux champs suffisent pour personnaliser l’application. Modifiable à tout moment.":["Two fields personalise the app. Editable at any time.","Dos campos personalizan la aplicación. Modificables en cualquier momento.","Due campi personalizzano l’app. Modificabili in ogni momento.","Zwei Felder personalisieren die App. Jederzeit änderbar.","Twee velden personaliseren de app. Altijd aanpasbaar.","Dois campos personalizam a aplicação. Alteráveis a qualquer momento."],"Un stock idéal, et l’appli en déduit vos quantités selon votre activité.":["Set target stock, and the app derives quantities for your activity.","Defina el stock objetivo y la aplicación deduce cantidades según actividad.","Impostare scorte obiettivo: l’app calcola quantità secondo l’attività.","Zielbestand festlegen: Die App berechnet Mengen nach Auslastung.","Stel doelvoorraad in: de app berekent hoeveelheden volgens activiteit.","Defina stock ideal: a aplicação calcula quantidades conforme a atividade."],"Le prix d’achat est facultatif":["The purchase price is optional","El precio de compra es opcional","Il prezzo d’acquisto è facoltativo","Der Einkaufspreis ist optional","De inkoopprijs is optioneel","O preço de compra é opcional"],"Ajoutez-le quand vous le souhaitez : l’appli chiffre alors la valeur de votre stock.":["Add it whenever you want: the app then values your stock.","Añádalo cuando quiera: la aplicación valorará entonces el stock.","Aggiungerlo quando desidera: l’app valorizzerà le scorte.","Fügen Sie ihn jederzeit hinzu: Die App bewertet dann Ihren Bestand.","Voeg deze toe wanneer u wilt: de app berekent dan de voorraadwaarde.","Adicione quando quiser: a aplicação calcula então o valor do stock."],"Entrer":["Enter","Entrar","Entrare","Öffnen","Openen","Entrar"],"C’est prêt.":["Ready.","Listo.","Pronto.","Bereit.","Klaar.","Pronto."],"Vous comptez":["You count","Usted cuenta","Conta lei","Sie zählen","U telt","Conta você"],"Faisons":["Let us get","Vamos a","Facciamo","Lernen wir uns","Laten we","Vamos"],"connaissance.":["acquainted.","conocernos.","conoscenza.","kennen.","kennismaken.","conhecer-nos."],"Trois gestes au quotidien. L’analyse reste disponible quand vous en avez besoin.":["Three daily actions. Analysis remains available when needed.","Tres acciones diarias. El análisis sigue disponible cuando lo necesite.","Tre azioni quotidiane. L’analisi resta disponibile quando serve.","Drei tägliche Schritte. Die Analyse bleibt bei Bedarf verfügbar.","Drie dagelijkse handelingen. Analyse blijft beschikbaar wanneer nodig.","Três ações diárias. A análise continua disponível quando precisar."],"Verdict Pro, c’est pour le patron":["Verdict Pro is for the owner","Verdict Pro es para el propietario","Verdict Pro è per il titolare","Verdict Pro ist für den Inhaber","Verdict Pro is voor de eigenaar","Verdict Pro é para o proprietário"],"Pilotage et Carte sont réservés au propriétaire de l’établissement. Un cuisinier ou un membre de l’équipe qui télécharge l’appli garde l’Inventaire, gratuit, mais n’a pas accès aux chiffres, à la carte ni au score.":["Pilotage and Carte are reserved for the establishment’s owner. A cook or team member who downloads the app keeps the free Inventory, but has no access to the figures, the menu or the score.","Pilotage y Carte están reservados al propietario del local. Un cocinero o un miembro del equipo que descargue la app conserva el Inventario gratuito, pero no accede a las cifras, la carta ni la puntuación.","Pilotage e Carte sono riservati al titolare del locale. Un cuoco o un membro del team che scarica l’app mantiene l’Inventario gratuito, ma non accede a cifre, menu e punteggio.","Pilotage und Carte sind dem Inhaber des Betriebs vorbehalten. Ein Koch oder Teammitglied, das die App lädt, behält das kostenlose Inventar, hat aber keinen Zugriff auf Zahlen, Karte und Score.","Pilotage en Carte zijn voorbehouden aan de eigenaar van de zaak. Een kok of teamlid dat de app downloadt, houdt de gratis Inventaris, maar heeft geen toegang tot cijfers, kaart of score.","Pilotage e Carte são reservados ao proprietário do estabelecimento. Um cozinheiro ou membro da equipa que descarregue a app mantém o Inventário gratuito, mas não acede aos números, à carta nem à pontuação."],"Plusieurs établissements ?":["Multiple establishments?","¿Varios locales?","Più locali?","Mehrere Betriebe?","Meerdere vestigingen?","Vários estabelecimentos?"],"Le bouton":["The button","El botón","Il pulsante","Die Schaltfläche","De knop","O botão"],"en haut en ajoute autant que vous le souhaitez — et vos commandes peuvent se grouper par fournisseur.":["at the top adds as many as you need — and orders can be grouped by supplier.","de arriba añade tantos como necesite — y los pedidos pueden agruparse por proveedor.","in alto ne aggiunge quanti serve — e gli ordini possono raggrupparsi per fornitore.","oben fügt beliebig viele hinzu — Bestellungen lassen sich nach Lieferant gruppieren.","bovenaan voegt er zoveel toe als nodig — bestellingen kunnen per leverancier worden gegroepeerd.","no topo adiciona quantos precisar — as encomendas podem agrupar-se por fornecedor."],"Date":["Date","Fecha","Data","Datum","Datum","Data"],"Note":["Note","Nota","Nota","Notiz","Notitie","Nota"],"Services":["Services","Servicios","Servizi","Services","Diensten","Serviços"],"Volume":["Volume","Volumen","Volume","Volumen","Volume","Volume"],"Analyser":["Analyse","Analizar","Analizzare","Analysieren","Analyseren","Analisar"],"Votre commande est prête à temps":["Your order is ready on time","Su pedido está listo a tiempo","L’ordine è pronto in tempo","Ihre Bestellung ist rechtzeitig fertig","Uw bestelling is op tijd klaar","A sua encomenda está pronta a tempo"],"Bonsoir 👋":["Good evening 👋","Buenas tardes 👋","Buonasera 👋","Guten Abend 👋","Goedenavond 👋","Boa noite 👋"],"(ouverte, fût, dose)":["(open, keg, measure)","(abierta, barril, dosis)","(aperta, fusto, dose)","(offen, Fass, Maß)","(open, vat, maat)","(aberta, barril, dose)"],"Le bar se compte selon sa réalité : bouteilles entières et ouvertes, litres restants dans les fûts, doses et consignes. Verdict n’invente jamais le rendement.":["Count the bar as it is: full and open bottles, litres left in kegs, measures and deposits. Verdict never invents yield.","Cuente el bar tal como es: botellas llenas y abiertas, litros en barriles, dosis y depósitos. Verdict nunca inventa el rendimiento.","Contare il bar per com’è: bottiglie piene e aperte, litri nei fusti, dosi e cauzioni. Verdict non inventa mai la resa.","Die Bar wird real gezählt: volle und offene Flaschen, Restliter im Fass, Maße und Pfand. Verdict erfindet niemals die Ausbeute.","Tel de bar zoals die is: volle en open flessen, liters in vaten, maten en statiegeld. Verdict verzint nooit rendement.","Conte o bar tal como está: garrafas cheias e abertas, litros nos barris, doses e cauções. O Verdict nunca inventa o rendimento."],"Zones autorisées":["Allowed areas","Zonas autorizadas","Zone autorizzate","Erlaubte Bereiche","Toegestane zones","Zonas autorizadas"],"Réserve sèche":["Dry storage","Almacén seco","Dispensa secca","Trockenlager","Droge opslag","Armazém seco"],"Chambre froide":["Cold room","Cámara frigorífica","Cella frigorifera","Kühlraum","Koelcel","Câmara frigorífica"],"Congélateur":["Freezer","Congelador","Congelatore","Gefrierschrank","Vriezer","Congelador"],"Dimanche fermé":["Closed Sunday","Domingo cerrado","Domenica chiuso","Sonntag geschlossen","Zondag gesloten","Domingo fechado"],"Dimanche–lundi fermés":["Closed Sunday–Monday","Domingo–lunes cerrados","Domenica–lunedì chiuso","Sonntag–Montag geschlossen","Zondag–maandag gesloten","Domingo–segunda fechados"],"Personnalisé":["Custom","Personalizado","Personalizzato","Benutzerdefiniert","Aangepast","Personalizado"],"Toussaint · proposer comme fermeture":["All Saints’ Day · suggest closure","Todos los Santos · proponer cierre","Ognissanti · proporre chiusura","Allerheiligen · Schließung vorschlagen","Allerheiligen · sluiting voorstellen","Todos os Santos · propor encerramento"],"Armistice · proposer comme fermeture":["Armistice Day · suggest closure","Armisticio · proponer cierre","Armistizio · proporre chiusura","Waffenstillstandstag · Schließung vorschlagen","Wapenstilstand · sluiting voorstellen","Armistício · propor encerramento"],"Noël · proposer comme fermeture":["Christmas · suggest closure","Navidad · proponer cierre","Natale · proporre chiusura","Weihnachten · Schließung vorschlagen","Kerstmis · sluiting voorstellen","Natal · propor encerramento"],"Jour de l’An · proposer comme fermeture":["New Year’s Day · suggest closure","Año Nuevo · proponer cierre","Capodanno · proporre chiusura","Neujahr · Schließung vorschlagen","Nieuwjaarsdag · sluiting voorstellen","Ano Novo · propor encerramento"],"Lundi de Pâques · proposer comme fermeture":["Easter Monday · suggest closure","Lunes de Pascua · proponer cierre","Lunedì di Pasqua · proporre chiusura","Ostermontag · Schließung vorschlagen","Tweede paasdag · sluiting voorstellen","Segunda-feira de Páscoa · propor encerramento"],"Fête du Travail · proposer comme fermeture":["Labour Day · suggest closure","Día del Trabajo · proponer cierre","Festa del Lavoro · proporre chiusura","Tag der Arbeit · Schließung vorschlagen","Dag van de Arbeid · sluiting voorstellen","Dia do Trabalhador · propor encerramento"],"Ascension · proposer comme fermeture":["Ascension Day · suggest closure","Ascensión · proponer cierre","Ascensione · proporre chiusura","Christi Himmelfahrt · Schließung vorschlagen","Hemelvaart · sluiting voorstellen","Ascensão · propor encerramento"],"Victoire 1945 · proposer comme fermeture":["VE Day · suggest closure","Victoria de 1945 · proponer cierre","Vittoria 1945 · proporre chiusura","Tag des Sieges 1945 · Schließung vorschlagen","Overwinning 1945 · sluiting voorstellen","Vitória de 1945 · propor encerramento"],"Lundi de Pentecôte · proposer comme fermeture":["Whit Monday · suggest closure","Lunes de Pentecostés · proponer cierre","Lunedì di Pentecoste · proporre chiusura","Pfingstmontag · Schließung vorschlagen","Tweede pinksterdag · sluiting voorstellen","Segunda-feira de Pentecostes · propor encerramento"],"Fête nationale · proposer comme fermeture":["French National Day · suggest closure","Fiesta nacional francesa · proponer cierre","Festa nazionale francese · proporre chiusura","Französischer Nationalfeiertag · Schließung vorschlagen","Franse nationale feestdag · sluiting voorstellen","Dia nacional francês · propor encerramento"],"Assomption · proposer comme fermeture":["Assumption Day · suggest closure","Asunción · proponer cierre","Assunzione · proporre chiusura","Mariä Himmelfahrt · Schließung vorschlagen","Maria-Tenhemelopneming · sluiting voorstellen","Assunção · propor encerramento"],"Résultat prêt pour Verdict®":["Result ready for Verdict®","Resultado listo para Verdict®","Risultato pronto per Verdict®","Ergebnis bereit für Verdict®","Resultaat klaar voor Verdict®","Resultado pronto para Verdict®"],"Ce transfert contient la valeur connue, la couverture du comptage et l’établissement. Au premier comptage, le stock initial reste volontairement inconnu : Verdict ne l’invente jamais.":["This transfer contains the known value, count coverage and establishment. On the first count, opening stock remains unknown: Verdict never invents it.","La transferencia contiene el valor conocido, la cobertura y el local. En el primer conteo, el stock inicial sigue desconocido: Verdict nunca lo inventa.","Il trasferimento contiene valore noto, copertura e locale. Al primo conteggio, le scorte iniziali restano sconosciute: Verdict non le inventa.","Diese Übertragung enthält bekannten Wert, Zählabdeckung und Betrieb. Bei der ersten Zählung bleibt der Anfangsbestand unbekannt: Verdict erfindet ihn nie.","De overdracht bevat bekende waarde, teldekking en vestiging. Bij de eerste telling blijft beginvoorraad onbekend: Verdict verzint deze nooit.","A transferência contém o valor conhecido, cobertura e estabelecimento. Na primeira contagem, o stock inicial continua desconhecido: o Verdict nunca o inventa."],"Même compte, même établissement, aucun code à recopier. Verdict recevra le dernier comptage enregistré.":["Same account, same establishment, no code to copy. Verdict receives the latest saved count.","Misma cuenta, mismo local, sin copiar códigos. Verdict recibe el último conteo guardado.","Stesso account, stesso locale, nessun codice da copiare. Verdict riceve l’ultimo conteggio salvato.","Gleiches Konto, gleicher Betrieb, kein Code zum Kopieren. Verdict erhält die letzte gespeicherte Zählung.","Zelfde account, zelfde vestiging, geen code overtypen. Verdict ontvangt de laatst opgeslagen telling.","Mesma conta, mesmo estabelecimento, sem copiar códigos. O Verdict recebe a última contagem guardada."],"Ouvrir cet établissement dans Verdict →":["Open this establishment in Verdict →","Abrir este local en Verdict →","Aprire questo locale in Verdict →","Diesen Betrieb in Verdict öffnen →","Deze vestiging openen in Verdict →","Abrir este estabelecimento no Verdict →"],"Rester dans l’inventaire":["Stay in Inventory","Permanecer en Inventario","Restare nell’Inventario","Im Inventar bleiben","In Voorraad blijven","Ficar no Inventário"],"URGENCE FOURNISSEUR · MAINTENANT":["SUPPLIER EMERGENCY · NOW","URGENCIA PROVEEDOR · AHORA","URGENZA FORNITORE · ORA","LIEFERANTENNOTFALL · JETZT","LEVERANCIERSNOODGEVAL · NU","URGÊNCIA FORNECEDOR · AGORA"],"Écrivez la rupture à Vera":["Tell Vera what is out of stock","Diga a Vera qué se ha agotado","Scriva a Vera cosa è esaurito","Schreiben Sie Vera, was fehlt","Vertel Vera wat op is","Diga à Vera o que esgotou"],"On n’a plus de…":["We are out of…","Se nos ha acabado…","Abbiamo finito…","Uns fehlt…","We hebben geen… meer","Ficámos sem…"],"Exemple : « On n’a plus de frites » ou « plus de vodka ». Vera demandera l’heure et la quantité avant de proposer quoi que ce soit.":["Example: “We are out of fries” or “out of vodka”. Vera asks for time and quantity before suggesting anything.","Ejemplo: «No quedan patatas fritas» o «no queda vodka». Vera pedirá hora y cantidad antes de proponer nada.","Esempio: «Abbiamo finito le patatine» o «la vodka». Vera chiederà ora e quantità prima di proporre qualcosa.","Beispiel: „Pommes sind aus“ oder „Wodka ist aus“. Vera fragt zuerst nach Zeit und Menge, bevor sie etwas vorschlägt.","Voorbeeld: ‘De friet is op’ of ‘de wodka is op’. Vera vraagt eerst tijd en hoeveelheid voordat ze iets voorstelt.","Exemplo: «Acabaram as batatas fritas» ou «acabou a vodka». A Vera pede hora e quantidade antes de sugerir algo."],"Synchronisé":["Synced","Sincronizado","Sincronizzato","Synchronisiert","Gesynchroniseerd","Sincronizado"],"En attente":["Pending","Pendiente","In attesa","Ausstehend","In afwachting","Pendente"],"Hors ligne":["Offline","Sin conexión","Offline","Offline","Offline","Sem ligação"],"Choix nécessaire":["Choose a version","Elija una versión","Scegliere una versione","Version auswählen","Kies een versie","Escolha uma versão"],"Stockage saturé":["Storage full","Almacenamiento lleno","Spazio esaurito","Speicher voll","Opslag vol","Armazenamento cheio"],"Premier comptage détaillé enregistré le {d}. Au prochain comptage, Verdict calculera la consommation réelle de chaque produit.":["First detailed count saved on {d}. At the next count, Verdict will calculate each product’s actual consumption.","Primer conteo detallado guardado el {d}. En el próximo conteo, Verdict calculará el consumo real de cada producto.","Primo conteggio dettagliato salvato il {d}. Al prossimo conteggio, Verdict calcolerà il consumo reale di ogni prodotto.","Erste detaillierte Zählung am {d} gespeichert. Bei der nächsten Zählung berechnet Verdict den tatsächlichen Verbrauch jedes Produkts.","Eerste gedetailleerde telling opgeslagen op {d}. Bij de volgende telling berekent Verdict het werkelijke verbruik van elk product.","Primeira contagem detalhada guardada a {d}. Na próxima contagem, o Verdict calculará o consumo real de cada produto."],"Du {a} au {b} · {n}/{t} produits comptés aux deux dates.":["From {a} to {b} · {n}/{t} products counted on both dates.","Del {a} al {b} · {n}/{t} productos contados en ambas fechas.","Dal {a} al {b} · {n}/{t} prodotti contati in entrambe le date.","Vom {a} bis {b} · {n}/{t} Produkte an beiden Tagen gezählt.","Van {a} tot {b} · {n}/{t} producten op beide data geteld.","De {a} a {b} · {n}/{t} produtos contados nas duas datas."],"Réel = stock du début + réceptions − stock de fin. Le théorique (fiches × ventes) vient de Verdict : sans lui, aucun écart n’est affirmé.":["Actual = opening stock + deliveries − closing stock. The theoretical (recipes × sales) comes from Verdict: without it, no variance is claimed.","Real = stock inicial + recepciones − stock final. El teórico (fichas × ventas) viene de Verdict: sin él, no se afirma ninguna desviación.","Reale = stock iniziale + ricevimenti − stock finale. Il teorico (schede × vendite) viene da Verdict: senza di esso, nessuno scostamento è affermato.","Ist = Anfangsbestand + Lieferungen − Endbestand. Der Sollwert (Rezepturen × Verkäufe) kommt von Verdict: ohne ihn wird keine Abweichung behauptet.","Werkelijk = beginvoorraad + leveringen − eindvoorraad. Het theoretische (recepten × verkopen) komt van Verdict: zonder dat wordt geen afwijking beweerd.","Real = stock inicial + receções − stock final. O teórico (fichas × vendas) vem do Verdict: sem ele, nenhum desvio é afirmado."],"{a} + {r} reçus − {b} = {c} consommés":["{a} + {r} received − {b} = {c} used","{a} + {r} recibidos − {b} = {c} consumidos","{a} + {r} ricevuti − {b} = {c} consumati","{a} + {r} erhalten − {b} = {c} verbraucht","{a} + {r} ontvangen − {b} = {c} verbruikt","{a} + {r} recebidos − {b} = {c} consumidos"],"{v} au prix enregistré":["{v} at the recorded price","{v} al precio registrado","{v} al prezzo registrato","{v} zum erfassten Preis","{v} tegen de geregistreerde prijs","{v} ao preço registado"],"Non calculable : pas compté aux deux dates.":["Not computable: not counted on both dates.","No calculable: no contado en ambas fechas.","Non calcolabile: non contato in entrambe le date.","Nicht berechenbar: nicht an beiden Tagen gezählt.","Niet berekenbaar: niet op beide data geteld.","Não calculável: não contado nas duas datas."],"Bloqué : réception dans une autre unité ({u}), conversion à confirmer.":["Blocked: delivery in another unit ({u}), conversion to confirm.","Bloqueado: recepción en otra unidad ({u}), conversión por confirmar.","Bloccato: ricevimento in un’altra unità ({u}), conversione da confermare.","Blockiert: Lieferung in anderer Einheit ({u}), Umrechnung bestätigen.","Geblokkeerd: levering in een andere eenheid ({u}), omrekening te bevestigen.","Bloqueado: receção noutra unidade ({u}), conversão a confirmar."],"À vérifier : le stock de fin dépasse début + réceptions ({c}). Une réception ou un comptage manque.":["To check: closing stock exceeds opening + deliveries ({c}). A delivery or a count is missing.","Por verificar: el stock final supera inicial + recepciones ({c}). Falta una recepción o un conteo.","Da verificare: lo stock finale supera iniziale + ricevimenti ({c}). Manca un ricevimento o un conteggio.","Zu prüfen: Endbestand übersteigt Anfang + Lieferungen ({c}). Eine Lieferung oder Zählung fehlt.","Te controleren: eindvoorraad hoger dan begin + leveringen ({c}). Er ontbreekt een levering of telling.","A verificar: o stock final excede inicial + receções ({c}). Falta uma receção ou uma contagem."],"Date de réception = date de validation de la commande reçue.":["Delivery date = date the received order was validated.","Fecha de recepción = fecha de validación del pedido recibido.","Data di ricevimento = data di convalida dell’ordine ricevuto.","Lieferdatum = Datum der Bestätigung der erhaltenen Bestellung.","Leverdatum = datum waarop de ontvangen bestelling is gevalideerd.","Data de receção = data de validação da encomenda recebida."],"Voir tous les produits ({n})":["See all products ({n})","Ver todos los productos ({n})","Vedi tutti i prodotti ({n})","Alle Produkte ansehen ({n})","Alle producten bekijken ({n})","Ver todos os produtos ({n})"],"✓ Tout conforme":["✓ All as ordered","✓ Todo conforme","✓ Tutto conforme","✓ Alles in Ordnung","✓ Alles conform","✓ Tudo conforme"],"Chaque ligne est pré-remplie avec le restant : touchez « Tout conforme », ou corrigez seulement les lignes qui diffèrent.":["Each line is prefilled with what remains: tap “All as ordered”, or correct only the lines that differ.","Cada línea viene rellenada con lo pendiente: pulse «Todo conforme» o corrija solo las líneas que difieren.","Ogni riga è precompilata con il residuo: toccate «Tutto conforme» o correggete solo le righe diverse.","Jede Zeile ist mit dem Rest vorausgefüllt: „Alles in Ordnung“ tippen oder nur abweichende Zeilen korrigieren.","Elke lijn is vooraf ingevuld met het restant: tik op „Alles conform” of corrigeer alleen de afwijkende lijnen.","Cada linha vem preenchida com o restante: toque em «Tudo conforme» ou corrija só as linhas diferentes."],"dont refusé à la livraison":["of which refused on delivery","de lo cual rechazado en la entrega","di cui rifiutato alla consegna","davon bei Lieferung abgelehnt","waarvan geweigerd bij levering","do qual recusado na entrega"],"Motif":["Reason","Motivo","Motivo","Grund","Reden","Motivo"],"manquant":["missing","faltante","mancante","fehlend","ontbrekend","em falta"],"abîmé / non conforme":["damaged / non-compliant","dañado / no conforme","danneggiato / non conforme","beschädigt / nicht konform","beschadigd / niet conform","danificado / não conforme"],"erreur de référence":["wrong item","referencia errónea","articolo errato","falscher Artikel","verkeerd artikel","referência errada"],"autre":["other","otro","altro","sonstiges","ander","outro"],"Retour ·":["Return · ","Devolución · ","Reso · ","Rückgabe · ","Retour · ","Devolução · "],"Indiquez seulement les quantités renvoyées au fournisseur : le stock est diminué d’autant.":["Enter only the quantities sent back to the supplier: stock is reduced accordingly.","Indique solo las cantidades devueltas al proveedor: el stock se reduce en la misma medida.","Indicate solo le quantità rese al fornitore: lo stock diminuisce di conseguenza.","Nur die an den Lieferanten zurückgeschickten Mengen angeben: der Bestand sinkt entsprechend.","Vul alleen de naar de leverancier teruggestuurde hoeveelheden in: de voorraad daalt evenveel.","Indique só as quantidades devolvidas ao fornecedor: o stock diminui na mesma medida."],"reçu":["received","recibido","ricevuto","erhalten","ontvangen","recebido"],"déjà retourné":["already returned","ya devuelto","già reso","bereits zurück","al teruggestuurd","já devolvido"],"Quantité retournée":["Quantity returned","Cantidad devuelta","Quantità resa","Zurückgegebene Menge","Teruggestuurde hoeveelheid","Quantidade devolvida"],"Enregistrer le retour":["Save the return","Guardar la devolución","Salva il reso","Rückgabe speichern","Retour opslaan","Guardar a devolução"],"Retour enregistré · stock ajusté":["Return saved · stock adjusted","Devolución guardada · stock ajustado","Reso salvato · stock aggiornato","Rückgabe gespeichert · Bestand angepasst","Retour opgeslagen · voorraad aangepast","Devolução guardada · stock ajustado"],"Rien à enregistrer":["Nothing to save","Nada que guardar","Nulla da salvare","Nichts zu speichern","Niets op te slaan","Nada a guardar"],"{n} réceptions datées · {r} retour(s)":["{n} dated deliveries · {r} return(s)","{n} recepciones fechadas · {r} devolución(es)","{n} ricevimenti datati · {r} reso/i","{n} datierte Lieferungen · {r} Rückgabe(n)","{n} gedateerde leveringen · {r} retour(s)","{n} receções datadas · {r} devolução(ões)"],"réf. {x}":["ref. {x}","ref. {x}","rif. {x}","Art. {x}","ref. {x}","ref. {x}"],"alerte si moins de {x}":["alert below {x}","alerta por debajo de {x}","avviso sotto {x}","Warnung unter {x}","waarschuwing onder {x}","alerta abaixo de {x}"],"{n} produit":["{n} product","{n} producto","{n} prodotto","{n} Produkt","{n} product","{n} produto"],"{n} produits":["{n} products","{n} productos","{n} prodotti","{n} Produkte","{n} producten","{n} produtos"],"{n} ligne":["{n} line","{n} línea","{n} riga","{n} Zeile","{n} regel","{n} linha"],"{n} lignes":["{n} lines","{n} líneas","{n} righe","{n} Zeilen","{n} regels","{n} linhas"],"{n} référence":["{n} item","{n} referencia","{n} articolo","{n} Artikel","{n} artikel","{n} referência"],"{n} références":["{n} items","{n} referencias","{n} articoli","{n} Artikel","{n} artikelen","{n} referências"],"{x} / {y} · {z} · {a} / {b} avec {c}":["{x} / {y} · {z} · {a} / {b} with {c}","{x} / {y} · {z} · {a} / {b} con {c}","{x} / {y} · {z} · {a} / {b} con {c}","{x} / {y} · {z} · {a} / {b} mit {c}","{x} / {y} · {z} · {a} / {b} met {c}","{x} / {y} · {z} · {a} / {b} com {c}"],"{n} vérifications nécessaires":["{n} checks required","{n} comprobaciones necesarias","{n} verifiche necessarie","{n} Prüfungen erforderlich","{n} controles nodig","{n} verificações necessárias"],"{n} vérifications nécessaires.":["{n} checks required.","{n} comprobaciones necesarias.","{n} verifiche necessarie.","{n} Prüfungen erforderlich.","{n} controles nodig.","{n} verificações necessárias."],"{n} colis de {x}":["{n} packs of {x}","{n} bultos de {x}","{n} confezioni da {x}","{n} Packungen zu {x}","{n} verpakkingen van {x}","{n} embalagens de {x}"],"{x} € estimés":["{x} € estimated","{x} € estimados","{x} € stimati","{x} € geschätzt","{x} € geschat","{x} € estimados"],"Confirmer la cible {n}":["Confirm target {n}","Confirmar objetivo {n}","Confermare obiettivo {n}","Ziel {n} bestätigen","Doel {n} bevestigen","Confirmar objetivo {n}"],"Pilotage":["Management","Gestión","Gestione","Steuerung","Bedrijfsvoering","Gestão"],"Client · application unique":["Client · single app","Cliente · aplicación única","Cliente · unica app","Client · eine App","Klant · één app","Cliente · aplicação única"],"Même établissement":["Same establishment","Mismo local","Stesso locale","Derselbe Betrieb","Dezelfde vestiging","Mesmo estabelecimento"],"Même établissement · {x}":["Same establishment · {x}","Mismo local · {x}","Stesso locale · {x}","Derselbe Betrieb · {x}","Dezelfde vestiging · {x}","Mesmo estabelecimento · {x}"],"Démonstration fictive · {x}":["Fictional demonstration · {x}","Demostración ficticia · {x}","Dimostrazione fittizia · {x}","Fiktive Demonstration · {x}","Fictieve demonstratie · {x}","Demonstração fictícia · {x}"],"Navigation entre les modules Verdict":["Navigation between Verdict modules","Navegación entre módulos Verdict","Navigazione tra moduli Verdict","Navigation zwischen Verdict-Modulen","Navigatie tussen Verdict-modules","Navegação entre módulos Verdict"],"Trois modules métier Verdict":["Three Verdict business modules","Tres módulos de gestión Verdict","Tre moduli gestionali Verdict","Drei Verdict-Fachmodule","Drie Verdict-bedrijfsmodules","Três módulos de gestão Verdict"],"Modules Pilotage et Carte — même établissement":["Management and Menu modules — same establishment","Módulos Gestión y Carta — mismo local","Moduli Gestione e Menu — stesso locale","Steuerung und Speisekarte — derselbe Betrieb","Bedrijfsvoering en Menukaart — dezelfde vestiging","Gestão e Ementa — mesmo estabelecimento"],"Module Inventaire — stocks, fournisseurs et commandes":["Inventory module — stock, suppliers and orders","Módulo Inventario — stock, proveedores y pedidos","Modulo Inventario — scorte, fornitori e ordini","Inventar — Bestände, Lieferanten und Bestellungen","Voorraad — voorraad, leveranciers en bestellingen","Inventário — stock, fornecedores e encomendas"],"En ligne":["Online","En línea","Online","Online","Online","Online"],"Ouverture du module…":["Opening module…","Abriendo módulo…","Apertura modulo…","Modul wird geöffnet…","Module openen…","A abrir módulo…"],"Ouverture de votre espace…":["Opening your workspace…","Abriendo su espacio…","Apertura del suo spazio…","Ihr Bereich wird geöffnet…","Uw werkruimte openen…","A abrir o seu espaço…"],"CENTRE DU GÉRANT":["MANAGER CENTRE","CENTRO DEL GERENTE","CENTRO DEL RESPONSABILE","LEITUNGSZENTRALE","BEHEERCENTRUM","CENTRO DO GERENTE"],"Notifications":["Notifications","Notificaciones","Notifiche","Benachrichtigungen","Meldingen","Notificações"],"Notifications : aucune en attente":["Notifications: none pending","Notificaciones: ninguna pendiente","Notifiche: nessuna in attesa","Benachrichtigungen: keine ausstehend","Meldingen: geen in behandeling","Notificações: nenhuma pendente"],"Notifications : {n} non lue":["Notifications: {n} unread","Notificaciones: {n} sin leer","Notifiche: {n} non letta","Benachrichtigungen: {n} ungelesen","Meldingen: {n} ongelezen","Notificações: {n} não lida"],"Notifications : {n} non lues":["Notifications: {n} unread","Notificaciones: {n} sin leer","Notifiche: {n} non lette","Benachrichtigungen: {n} ungelesen","Meldingen: {n} ongelezen","Notificações: {n} não lidas"],"{n} notification à traiter":["{n} notification to handle","{n} notificación pendiente","{n} notifica da gestire","{n} Benachrichtigung zu bearbeiten","{n} melding te behandelen","{n} notificação a tratar"],"{n} notifications à traiter":["{n} notifications to handle","{n} notificaciones pendientes","{n} notifiche da gestire","{n} Benachrichtigungen zu bearbeiten","{n} meldingen te behandelen","{n} notificações a tratar"],"Nouvelle notification. {n} à traiter.":["New notification. {n} to handle.","Nueva notificación. {n} pendientes.","Nuova notifica. {n} da gestire.","Neue Benachrichtigung. {n} zu bearbeiten.","Nieuwe melding. {n} te behandelen.","Nova notificação. {n} a tratar."],"Tout est lu":["All read","Todo leído","Tutto letto","Alles gelesen","Alles gelezen","Tudo lido"],"Lue":["Read","Leída","Letta","Gelesen","Gelezen","Lida"],"Marquer comme lue":["Mark as read","Marcar como leída","Segnare come letta","Als gelesen markieren","Markeren als gelezen","Marcar como lida"],"Tout marquer comme lu":["Mark all as read","Marcar todo como leído","Segnare tutto come letto","Alles als gelesen markieren","Alles markeren als gelezen","Marcar tudo como lido"],"Fermer les notifications":["Close notifications","Cerrar notificaciones","Chiudere notifiche","Benachrichtigungen schließen","Meldingen sluiten","Fechar notificações"],"Aucune notification à traiter":["No notifications to handle","Ninguna notificación pendiente","Nessuna notifica da gestire","Keine Benachrichtigungen zu bearbeiten","Geen meldingen te behandelen","Nenhuma notificação a tratar"],"Les analyses restent consacrées au pilotage. Les messages de l’équipe apparaîtront uniquement ici.":["Analysis stays focused on management. Team messages appear only here.","Los análisis se dedican a la gestión. Los mensajes del equipo aparecen solo aquí.","Le analisi restano dedicate alla gestione. I messaggi del team appaiono solo qui.","Analysen bleiben auf die Steuerung konzentriert. Teamnachrichten erscheinen nur hier.","Analyses blijven gericht op bedrijfsvoering. Teamberichten verschijnen alleen hier.","As análises continuam focadas na gestão. As mensagens da equipa aparecem apenas aqui."],"Pourquoi cette notification ?":["Why this notification?","¿Por qué esta notificación?","Perché questa notifica?","Warum diese Benachrichtigung?","Waarom deze melding?","Porquê esta notificação?"],"Ouvrir Inventaire":["Open Inventory","Abrir Inventario","Aprire Inventario","Inventar öffnen","Voorraad openen","Abrir Inventário"],"Ouvrir Verdict":["Open Verdict","Abrir Verdict","Aprire Verdict","Verdict öffnen","Verdict openen","Abrir Verdict"],"démonstration fictive":["fictional demonstration","demostración ficticia","dimostrazione fittizia","fiktive Demonstration","fictieve demonstratie","demonstração fictícia"],"{x} · signalé par {y}":["{x} · reported by {y}","{x} · comunicado por {y}","{x} · segnalato da {y}","{x} · gemeldet von {y}","{x} · gemeld door {y}","{x} · comunicado por {y}"],"Une action attend votre décision":["An action needs your decision","Una acción espera su decisión","Un’azione attende la sua decisione","Eine Aktion erfordert Ihre Entscheidung","Een actie wacht op uw beslissing","Uma ação aguarda a sua decisão"],"{x}/{y} références comptées · {n} à commander.":["{x}/{y} items counted · {n} to order.","{x}/{y} referencias contadas · {n} por pedir.","{x}/{y} articoli contati · {n} da ordinare.","{x}/{y} Artikel gezählt · {n} zu bestellen.","{x}/{y} artikelen geteld · {n} te bestellen.","{x}/{y} referências contadas · {n} a encomendar."],"{x}/{y} références ont un prix d’achat.":["{x}/{y} items have a purchase price.","{x}/{y} referencias tienen precio de compra.","{x}/{y} articoli hanno un prezzo d’acquisto.","{x}/{y} Artikel haben einen Einkaufspreis.","{x}/{y} artikelen hebben een inkoopprijs.","{x}/{y} referências têm preço de compra."],"Adresse du portail invalide":["Invalid portal address","Dirección del portal no válida","Indirizzo portale non valido","Ungültige Portaladresse","Ongeldig portaaladres","Endereço do portal inválido"],"Adresse du portail à vérifier":["Check portal address","Compruebe la dirección del portal","Verificare indirizzo portale","Portaladresse prüfen","Portaaladres controleren","Verificar endereço do portal"],"Cette fonction n’est pas autorisée par votre gérant":["Your manager has not authorised this feature","Su gerente no autoriza esta función","Il responsabile non autorizza questa funzione","Diese Funktion ist nicht von Ihrer Leitung freigegeben","Uw beheerder staat deze functie niet toe","O gerente não autorizou esta função"],"Choisissez la date de l’exception":["Choose the exception date","Elija la fecha de la excepción","Scegliere la data dell’eccezione","Datum der Ausnahme wählen","Datum van uitzondering kiezen","Escolha a data da exceção"],"Choisissez le jour limite et le jour de livraison":["Choose the deadline and delivery days","Elija los días límite y de entrega","Scegliere giorno limite e di consegna","Frist- und Liefertag wählen","Uiterste dag en leverdag kiezen","Escolha o dia limite e o dia de entrega"],"Indiquez la limite et le début de livraison":["Enter the deadline and delivery start","Indique el límite y el inicio de entrega","Indicare scadenza e inizio consegna","Frist und Lieferbeginn eingeben","Deadline en begin levering invullen","Indique o limite e o início da entrega"],"Indiquez le fournisseur alternatif":["Enter the alternative supplier","Indique el proveedor alternativo","Indicare il fornitore alternativo","Alternativen Lieferanten eingeben","Alternatieve leverancier invullen","Indique o fornecedor alternativo"],"Indiquez le nom du fournisseur":["Enter the supplier name","Indique el nombre del proveedor","Indicare il nome del fornitore","Lieferantennamen eingeben","Leveranciersnaam invullen","Indique o nome do fornecedor"],"Indiquez une période saisonnière valide":["Enter a valid seasonal period","Indique un periodo estacional válido","Indicare un periodo stagionale valido","Gültigen Saisonzeitraum eingeben","Geldige seizoensperiode invullen","Indique um período sazonal válido"],"La fin de période précède le début":["The end date precedes the start","El fin del periodo precede al inicio","La fine precede l’inizio","Das Ende liegt vor dem Beginn","Einddatum ligt vóór begindatum","O fim do período precede o início"],"Les jours du passage sont invalides":["The slot days are invalid","Los días del horario no son válidos","I giorni dell’orario non sono validi","Die Termintage sind ungültig","De dagen van het moment zijn ongeldig","Os dias do horário são inválidos"],"Modification non autorisée":["Editing not authorised","Modificación no autorizada","Modifica non autorizzata","Bearbeitung nicht erlaubt","Bewerken niet toegestaan","Edição não autorizada"],"Suppression non autorisée":["Deletion not authorised","Eliminación no autorizada","Eliminazione non autorizzata","Löschen nicht erlaubt","Verwijderen niet toegestaan","Eliminação não autorizada"],"Fichier illisible":["Unreadable file","Archivo ilegible","File illeggibile","Datei unlesbar","Onleesbaar bestand","Ficheiro ilegível"],"Fichier non reconnu":["Unrecognised file","Archivo no reconocido","File non riconosciuto","Datei nicht erkannt","Bestand niet herkend","Ficheiro não reconhecido"],"Donne un nom au produit":["Enter a product name","Indique un nombre para el producto","Inserire un nome prodotto","Produktnamen eingeben","Productnaam invullen","Indique um nome para o produto"],"Donnez un nom à votre établissement":["Enter your establishment name","Indique el nombre de su local","Inserire il nome del locale","Betriebsnamen eingeben","Vestigingsnaam invullen","Indique o nome do estabelecimento"],"Comptez au moins un produit":["Count at least one product","Cuente al menos un producto","Contare almeno un prodotto","Mindestens ein Produkt zählen","Tel minstens één product","Conte pelo menos um produto"],"Ce comptage est déjà enregistré":["This count is already saved","Este conteo ya está guardado","Questo conteggio è già salvato","Diese Zählung ist bereits gespeichert","Deze telling is al opgeslagen","Esta contagem já está guardada"],"Comptage enregistré ✓":["Count saved ✓","Conteo guardado ✓","Conteggio salvato ✓","Zählung gespeichert ✓","Telling opgeslagen ✓","Contagem guardada ✓"],"Comptages vidés":["Counts cleared","Conteos vaciados","Conteggi cancellati","Zählungen geleert","Tellingen gewist","Contagens limpas"],"Produit supprimé":["Product deleted","Producto eliminado","Prodotto eliminato","Produkt gelöscht","Product verwijderd","Produto eliminado"],"Établissement supprimé":["Establishment deleted","Local eliminado","Locale eliminato","Betrieb gelöscht","Vestiging verwijderd","Estabelecimento eliminado"],"Données restaurées":["Data restored","Datos restaurados","Dati ripristinati","Daten wiederhergestellt","Gegevens hersteld","Dados restaurados"],"Sauvegarde téléchargée":["Backup downloaded","Copia descargada","Backup scaricato","Sicherung heruntergeladen","Back-up gedownload","Cópia descarregada"],"Sauvegarde impossible ici":["Backup unavailable here","Copia no disponible aquí","Backup non disponibile qui","Sicherung hier nicht möglich","Back-up hier niet mogelijk","Cópia indisponível aqui"],"Stockage local saturé : téléchargez une sauvegarde":["Local storage full: download a backup","Almacenamiento local lleno: descargue una copia","Memoria locale piena: scaricare un backup","Lokaler Speicher voll: Sicherung herunterladen","Lokale opslag vol: download een back-up","Armazenamento local cheio: descarregue uma cópia"],"Copie de sécurité conservée pour cette session":["Safety copy retained for this session","Copia de seguridad conservada para esta sesión","Copia di sicurezza conservata per questa sessione","Sicherheitskopie für diese Sitzung aufbewahrt","Veiligheidskopie bewaard voor deze sessie","Cópia de segurança guardada para esta sessão"],"Texte copié":["Text copied","Texto copiado","Testo copiato","Text kopiert","Tekst gekopieerd","Texto copiado"],"Valeur du stock copiée":["Stock value copied","Valor del stock copiado","Valore delle scorte copiato","Bestandswert kopiert","Voorraadwaarde gekopieerd","Valor do stock copiado"],"Commande confirmée":["Order confirmed","Pedido confirmado","Ordine confermato","Bestellung bestätigt","Bestelling bevestigd","Encomenda confirmada"],"Cible confirmée":["Target confirmed","Objetivo confirmado","Obiettivo confermato","Ziel bestätigt","Doel bevestigd","Objetivo confirmado"],"Fournisseur et passages recalculés":["Supplier and slots recalculated","Proveedor y horarios recalculados","Fornitore e orari ricalcolati","Lieferant und Termine neu berechnet","Leverancier en momenten herberekend","Fornecedor e horários recalculados"],"Calendrier enregistré · passages et couverture recalculés":["Calendar saved · slots and coverage recalculated","Calendario guardado · horarios y cobertura recalculados","Calendario salvato · orari e copertura ricalcolati","Kalender gespeichert · Termine und Deckung neu berechnet","Kalender opgeslagen · momenten en dekking herberekend","Calendário guardado · horários e cobertura recalculados"],"Besoin retiré · commandes et alertes recalculées":["Requirement removed · orders and alerts recalculated","Necesidad retirada · pedidos y alertas recalculados","Fabbisogno rimosso · ordini e avvisi ricalcolati","Bedarf entfernt · Bestellungen und Warnungen neu berechnet","Behoefte verwijderd · bestellingen en meldingen herberekend","Necessidade removida · encomendas e alertas recalculados"],"Indiquez la date du besoin":["Enter the required date","Indique la fecha de necesidad","Indicare la data del fabbisogno","Bedarfsdatum eingeben","Benodigde datum invullen","Indique a data da necessidade"],"Choisissez une date":["Choose a date","Elija una fecha","Scegliere una data","Datum wählen","Datum kiezen","Escolha uma data"],"Quantité, date et heure sont obligatoires":["Quantity, date and time are required","Cantidad, fecha y hora obligatorias","Quantità, data e ora obbligatorie","Menge, Datum und Uhrzeit erforderlich","Hoeveelheid, datum en tijd zijn verplicht","Quantidade, data e hora obrigatórias"],"Saisissez une quantité supérieure à zéro":["Enter a quantity greater than zero","Introduzca una cantidad mayor que cero","Inserire una quantità maggiore di zero","Menge größer als null eingeben","Hoeveelheid groter dan nul invullen","Insira quantidade superior a zero"],"Renseignez le fournisseur avant de confirmer":["Enter the supplier before confirming","Indique el proveedor antes de confirmar","Indicare il fornitore prima di confermare","Vor Bestätigung den Lieferanten eingeben","Vul leverancier in vóór bevestiging","Indique o fornecedor antes de confirmar"],"Un contrôle de réception est nécessaire":["A receipt check is required","Se requiere control de recepción","È necessario un controllo alla ricezione","Wareneingangsprüfung erforderlich","Ontvangstcontrole nodig","É necessário controlo de receção"],"Partage indisponible · texte copié":["Sharing unavailable · text copied","Compartir no disponible · texto copiado","Condivisione non disponibile · testo copiato","Teilen nicht verfügbar · Text kopiert","Delen niet beschikbaar · tekst gekopieerd","Partilha indisponível · texto copiado"],"Partage ouvert · commande non marquée comme passée":["Share opened · order not marked as placed","Compartir abierto · pedido no marcado como realizado","Condivisione aperta · ordine non segnato come effettuato","Teilen geöffnet · Bestellung nicht als aufgegeben markiert","Delen geopend · bestelling niet als geplaatst gemarkeerd","Partilha aberta · encomenda não marcada como feita"],"Commande copiée · elle n’est pas marquée comme passée":["Order copied · not marked as placed","Pedido copiado · no marcado como realizado","Ordine copiato · non segnato come effettuato","Bestellung kopiert · nicht als aufgegeben markiert","Bestelling gekopieerd · niet als geplaatst gemarkeerd","Encomenda copiada · não marcada como feita"],"PDF créé · commande non marquée comme passée":["PDF created · order not marked as placed","PDF creado · pedido no marcado como realizado","PDF creato · ordine non segnato come effettuato","PDF erstellt · Bestellung nicht als aufgegeben markiert","PDF gemaakt · bestelling niet als geplaatst gemarkeerd","PDF criado · encomenda não marcada como feita"],"Import désactivé dans la démonstration fictive":["Import disabled in the fictional demonstration","Importación desactivada en demostración ficticia","Importazione disattivata nella dimostrazione fittizia","Import in der fiktiven Demonstration deaktiviert","Import uitgeschakeld in fictieve demonstratie","Importação desativada na demonstração fictícia"],"Sauvegarde désactivée dans la démonstration fictive":["Backup disabled in the fictional demonstration","Copia desactivada en demostración ficticia","Backup disattivato nella dimostrazione fittizia","Sicherung in der fiktiven Demonstration deaktiviert","Back-up uitgeschakeld in fictieve demonstratie","Cópia desativada na demonstração fictícia"],"Une sauvegarde fictive ne peut pas remplacer un inventaire réel":["A fictional backup cannot replace real inventory","Una copia ficticia no puede sustituir un inventario real","Un backup fittizio non può sostituire un inventario reale","Fiktive Sicherung kann kein echtes Inventar ersetzen","Fictieve back-up kan geen echte voorraad vervangen","Uma cópia fictícia não pode substituir inventário real"],"Démonstration fictive · aucun fournisseur contacté":["Fictional demonstration · no supplier contacted","Demostración ficticia · ningún proveedor contactado","Dimostrazione fittizia · nessun fornitore contattato","Fiktive Demonstration · kein Lieferant kontaktiert","Fictieve demonstratie · geen leverancier benaderd","Demonstração fictícia · nenhum fornecedor contactado"],"Établissement verrouillé dans la démonstration fictive":["Establishment locked in fictional demonstration","Local bloqueado en demostración ficticia","Locale bloccato nella dimostrazione fittizia","Betrieb in der fiktiven Demonstration gesperrt","Vestiging vergrendeld in fictieve demonstratie","Estabelecimento bloqueado na demonstração fictícia"],"La démonstration conserve une seule Brasserie fictive":["The demonstration keeps one fictional brasserie","La demostración conserva una brasserie ficticia","La dimostrazione mantiene una sola brasserie fittizia","Die Demonstration enthält eine fiktive Brasserie","De demonstratie behoudt één fictieve brasserie","A demonstração mantém uma única brasserie fictícia"],"L’établissement est attribué par votre gérant":["The establishment is assigned by your manager","Su gerente asigna el local","Il locale è assegnato dal responsabile","Der Betrieb wird von Ihrer Leitung zugewiesen","De vestiging wordt door uw beheerder toegewezen","O estabelecimento é atribuído pelo gerente"],"Le niveau d’activité est réservé aux commandes autorisées":["Activity level requires order permission","El nivel de actividad requiere permiso de pedidos","Il livello di attività richiede permesso ordini","Auslastung erfordert Bestellberechtigung","Activiteitsniveau vereist bestelrechten","O nível de atividade exige permissão de encomendas"],"Fusion effectuée : les conflits ont gardé vos modifications locales":["Merge complete: conflicts kept your local changes","Fusión completada: los conflictos conservaron sus cambios locales","Unione completata: i conflitti hanno mantenuto le modifiche locali","Zusammenführung abgeschlossen: Konflikte behielten Ihre lokalen Änderungen","Samenvoeging voltooid: conflicten behielden uw lokale wijzigingen","Fusão concluída: os conflitos mantiveram as suas alterações locais"],"{x} · aucune donnée réelle":["{x} · no real data","{x} · sin datos reales","{x} · nessun dato reale","{x} · keine echten Daten","{x} · geen echte gegevens","{x} · sem dados reais"],"Stock ou besoin total · le plus élevé · besoin {x}":["Stock or total requirement · higher value · needed {x}","Stock o necesidad total · valor mayor · necesario {x}","Scorte o fabbisogno totale · valore maggiore · necessario {x}","Bestand oder Gesamtbedarf · höherer Wert · Bedarf {x}","Voorraad of totale behoefte · hoogste waarde · nodig {x}","Stock ou necessidade total · valor maior · necessário {x}"],"{x} · besoin total pour le {y} · {z}":["{x} · total requirement for {y} · {z}","{x} · necesidad total para {y} · {z}","{x} · fabbisogno totale per {y} · {z}","{x} · Gesamtbedarf für {y} · {z}","{x} · totale behoefte voor {y} · {z}","{x} · necessidade total para {y} · {z}"],"Commander avant {x} · {y}":["Order before {x} · {y}","Pedir antes de {x} · {y}","Ordinare entro {x} · {y}","Bestellen bis {x} · {y}","Bestellen vóór {x} · {y}","Encomendar antes de {x} · {y}"],"{x} · couverture {n} jours ouverts, {m} services · à confirmer avec le fournisseur":["{x} · covers {n} open days, {m} services · confirm with supplier","{x} · cubre {n} días abiertos, {m} servicios · confirmar con proveedor","{x} · copre {n} giorni aperti, {m} servizi · confermare col fornitore","{x} · deckt {n} Öffnungstage, {m} Services · mit Lieferant bestätigen","{x} · dekt {n} openingsdagen, {m} diensten · bevestig met leverancier","{x} · cobre {n} dias abertos, {m} serviços · confirmar com fornecedor"],"Le passage est renseigné, mais ces horaires n’ont pas encore été confirmés avec {x}.":["The slot is entered, but these times have not yet been confirmed with {x}.","El horario está registrado, pero aún no se ha confirmado con {x}.","L’orario è registrato, ma non è ancora stato confermato con {x}.","Der Termin ist eingetragen, die Zeiten wurden aber noch nicht mit {x} bestätigt.","Het moment is ingevuld, maar de tijden zijn nog niet bevestigd met {x}.","O horário está registado, mas ainda não foi confirmado com {x}."],"Livraison prévue après le besoin du {x}":["Delivery expected after the requirement of {x}","Entrega prevista después de la necesidad del {x}","Consegna prevista dopo il fabbisogno del {x}","Lieferung nach dem Bedarf vom {x} geplant","Levering verwacht na de behoefte op {x}","Entrega prevista após a necessidade de {x}"],"Livraison prévue le {x} : le produit peut manquer avant sa réception.":["Delivery expected on {x}: the product may run out before arrival.","Entrega prevista el {x}: el producto puede agotarse antes de llegar.","Consegna prevista il {x}: il prodotto potrebbe esaurirsi prima.","Lieferung am {x} geplant: Das Produkt könnte vorher ausgehen.","Levering verwacht op {x}: het product kan vóór aankomst opraken.","Entrega prevista para {x}: o produto pode esgotar antes de chegar."],"{n} produits à commander · montant estimé":["{n} products to order · before pack rounding","{n} productos por pedir · antes del redondeo por bultos","{n} prodotti da ordinare · prima dell’arrotondamento a confezioni","{n} Produkte zu bestellen · vor Packungsrundung","{n} producten te bestellen · geschat bedrag","{n} produtos a encomendar · antes de arredondar por embalagens"],"{n} récents":["{n} recent","{n} recientes","{n} recenti","{n} aktuelle","{n} recente","{n} recentes"],"medium · {n} jours":["medium · {n} days","medio · {n} días","medio · {n} giorni","mittel · {n} Tage","gemiddeld · {n} dagen","médio · {n} dias"],"{n} services":["{n} services","{n} servicios","{n} servizi","{n} Services","{n} diensten","{n} serviços"],"Services {x}":["Services {x}","Servicios {x}","Servizi {x}","Services {x}","Diensten {x}","Serviços {x}"],"Ouverture {x}":["Opening {x}","Apertura {x}","Apertura {x}","Öffnung {x}","Opening {x}","Abertura {x}"],"Fermeture {x}":["Closing {x}","Cierre {x}","Chiusura {x}","Schließung {x}","Sluiting {x}","Encerramento {x}"],"SIMULATION — NE PAS ENVOYER — {x}":["SIMULATION — DO NOT SEND — {x}","SIMULACIÓN — NO ENVIAR — {x}","SIMULAZIONE — NON INVIARE — {x}","SIMULATION — NICHT SENDEN — {x}","SIMULATIE — NIET VERSTUREN — {x}","SIMULAÇÃO — NÃO ENVIAR — {x}"],"COMMANDE À PASSER — {x}":["ORDER TO PLACE — {x}","PEDIDO POR REALIZAR — {x}","ORDINE DA EFFETTUARE — {x}","AUFZUGEBENDE BESTELLUNG — {x}","TE PLAATSEN BESTELLING — {x}","ENCOMENDA A FAZER — {x}"],"Commande {x}":["Order {x}","Pedido {x}","Ordine {x}","Bestellung {x}","Bestelling {x}","Encomenda {x}"],"Établissement : {x}":["Establishment: {x}","Local: {x}","Locale: {x}","Betrieb: {x}","Vestiging: {x}","Estabelecimento: {x}"],"Préparée le : {x}":["Prepared on: {x}","Preparado el: {x}","Preparato il: {x}","Vorbereitet am: {x}","Voorbereid op: {x}","Preparada em: {x}"],"Démonstration fictive : aucun fournisseur n’a été contacté.":["Fictional demonstration: no supplier has been contacted.","Demostración ficticia: no se ha contactado a ningún proveedor.","Dimostrazione fittizia: nessun fornitore è stato contattato.","Fiktive Demonstration: Kein Lieferant wurde kontaktiert.","Fictieve demonstratie: geen leverancier is benaderd.","Demonstração fictícia: nenhum fornecedor foi contactado."],"Commander avant : {x}":["Order before: {x}","Pedir antes de: {x}","Ordinare entro: {x}","Bestellen bis: {x}","Bestellen vóór: {x}","Encomendar antes de: {x}"],"Livraison prévue : {x}":["Expected delivery: {x}","Entrega prevista: {x}","Consegna prevista: {x}","Geplante Lieferung: {x}","Verwachte levering: {x}","Entrega prevista: {x}"],"Horaire et livraison : à confirmer":["Schedule and delivery: to confirm","Horario y entrega: por confirmar","Orario e consegna: da confermare","Zeit und Lieferung: zu bestätigen","Tijd en levering: te bevestigen","Horário e entrega: por confirmar"],"N° client : {x}":["Customer number: {x}","N.º de cliente: {x}","N. cliente: {x}","Kundennummer: {x}","Klantnummer: {x}","N.º de cliente: {x}"],"Total non calculable : un ou plusieurs prix sont inconnus.":["Total cannot be calculated: one or more prices are unknown.","Total no calculable: uno o más precios son desconocidos.","Totale non calcolabile: uno o più prezzi sono sconosciuti.","Summe nicht berechenbar: Mindestens ein Preis ist unbekannt.","Totaal niet berekenbaar: een of meer prijzen zijn onbekend.","Total não calculável: um ou mais preços são desconhecidos."],"Total produits estimé HT : {x}":["Estimated product total excl. tax: {x}","Total estimado de productos sin impuestos: {x}","Totale prodotti stimato IVA esclusa: {x}","Geschätzte Produktsumme netto: {x}","Geschat producttotaal excl. btw: {x}","Total estimado de produtos sem impostos: {x}"],"Frais de livraison estimés saisis : {x} · total avec frais : {y}":["Entered estimated delivery fee: {x} · total with fees: {y}","Gastos de envío estimados introducidos: {x} · total con gastos: {y}","Spese di consegna stimate inserite: {x} · totale con spese: {y}","Eingegebene geschätzte Lieferkosten: {x} · Summe mit Kosten: {y}","Ingevoerde geschatte bezorgkosten: {x} · totaal met kosten: {y}","Portes estimados inseridos: {x} · total com portes: {y}"],"Franco renseigné : {x}":["Entered free delivery threshold: {x}","Umbral de envío gratis indicado: {x}","Soglia consegna gratuita inserita: {x}","Eingegebene Frei-Haus-Grenze: {x}","Ingevulde franco leveringsgrens: {x}","Limite de entrega gratuita indicado: {x}"],"Disponibilité, substitutions, frais et prix à confirmer par le fournisseur.":["Availability, substitutions, fees and prices require supplier confirmation.","Disponibilidad, sustituciones, gastos y precios a confirmar por el proveedor.","Disponibilità, sostituzioni, spese e prezzi da confermare dal fornitore.","Verfügbarkeit, Ersatzartikel, Kosten und Preise vom Lieferanten bestätigen lassen.","Beschikbaarheid, vervangingen, kosten en prijzen door leverancier te bevestigen.","Disponibilidade, substituições, custos e preços a confirmar pelo fornecedor."],"Aucun produit.":["No products.","Ningún producto.","Nessun prodotto.","Keine Produkte.","Geen producten.","Nenhum produto."],"Aucun produit ne correspond.":["No matching products.","Ningún producto coincide.","Nessun prodotto corrisponde.","Keine passenden Produkte.","Geen overeenkomende producten.","Nenhum produto corresponde."],"Effacer la recherche":["Clear search","Borrar búsqueda","Cancellare ricerca","Suche löschen","Zoekopdracht wissen","Limpar pesquisa"],"{n} résultat sur {m}":["{n} result of {m}","{n} resultado de {m}","{n} risultato su {m}","{n} Ergebnis von {m}","{n} resultaat van {m}","{n} resultado de {m}"],"{n} résultats sur {m}":["{n} results of {m}","{n} resultados de {m}","{n} risultati su {m}","{n} Ergebnisse von {m}","{n} resultaten van {m}","{n} resultados de {m}"],"consulter":["view","consultar","consultare","ansehen","bekijken","consultar"],"◯ à compter":["◯ to count","◯ por contar","◯ da contare","◯ zu zählen","◯ te tellen","◯ a contar"],"🟠 sous le stock minimum":["🟠 at / below minimum","🟠 en / bajo mínimo","🟠 al / sotto minimo","🟠 am / unter Minimum","🟠 op / onder minimum","🟠 no / abaixo do mínimo"],"VALEUR DU STOCK — {x}":["STOCK VALUE — {x}","VALOR DEL STOCK — {x}","VALORE DELLE SCORTE — {x}","BESTANDSWERT — {x}","VOORRAADWAARDE — {x}","VALOR DO STOCK — {x}"],"VALEUR CONNUE — INVENTAIRE PARTIEL — {x}":["KNOWN VALUE — PARTIAL INVENTORY — {x}","VALOR CONOCIDO — INVENTARIO PARCIAL — {x}","VALORE NOTO — INVENTARIO PARZIALE — {x}","BEKANNTER WERT — TEILINVENTAR — {x}","BEKENDE WAARDE — GEDEELTELIJKE VOORRAAD — {x}","VALOR CONHECIDO — INVENTÁRIO PARCIAL — {x}"],"TOTAL CONNU : {x} HT":["KNOWN TOTAL: {x} excl. tax","TOTAL CONOCIDO: {x} sin impuestos","TOTALE NOTO: {x} IVA esclusa","BEKANNTE SUMME: {x} netto","BEKEND TOTAAL: {x} excl. btw","TOTAL CONHECIDO: {x} sem impostos"],"Couverture : {x}/{y} références ({n} %)":["Coverage: {x}/{y} items ({n} %)","Cobertura: {x}/{y} referencias ({n} %)","Copertura: {x}/{y} articoli ({n} %)","Abdeckung: {x}/{y} Artikel ({n} %)","Dekking: {x}/{y} artikelen ({n} %)","Cobertura: {x}/{y} referências ({n} %)"],"Comptage et prix complets.":["Count and prices complete.","Conteo y precios completos.","Conteggio e prezzi completi.","Zählung und Preise vollständig.","Telling en prijzen volledig.","Contagem e preços completos."],"ATTENTION : ce total est partiel. Les lignes manquantes ne valent pas zéro.":["CAUTION: this total is partial. Missing lines are not zero.","ATENCIÓN: este total es parcial. Las líneas ausentes no valen cero.","ATTENZIONE: questo totale è parziale. Le righe mancanti non valgono zero.","ACHTUNG: Diese Summe ist unvollständig. Fehlende Zeilen sind nicht null.","LET OP: dit totaal is gedeeltelijk. Ontbrekende regels zijn geen nul.","ATENÇÃO: este total é parcial. As linhas em falta não valem zero."],"Food cost réel sur une période = (stock initial + achats − stock final) ÷ CA HT. Il faut deux points de stock successifs et les achats de la période ; après le premier point, un seul nouveau comptage par mois suffit.":["Actual food cost for a period = (opening stock + purchases − closing stock) ÷ revenue excluding tax. Two consecutive stock counts and the period’s purchases are required; after the first count, one new count per month is enough.","Coste real de alimentos del periodo = (stock inicial + compras − stock final) ÷ ingresos sin impuestos. Requiere dos conteos consecutivos y las compras del periodo; tras el primero, basta un nuevo conteo al mes.","Costo alimentare reale del periodo = (scorte iniziali + acquisti − scorte finali) ÷ ricavi IVA esclusa. Servono due conteggi successivi e gli acquisti del periodo; dopo il primo basta un nuovo conteggio al mese.","Tatsächlicher Wareneinsatz im Zeitraum = (Anfangsbestand + Einkäufe − Endbestand) ÷ Nettoumsatz. Zwei aufeinanderfolgende Zählungen und die Einkäufe des Zeitraums sind erforderlich; danach genügt eine neue Zählung pro Monat.","Werkelijke voedselkosten over een periode = (beginvoorraad + inkopen − eindvoorraad) ÷ omzet excl. btw. Twee opeenvolgende tellingen en de inkopen zijn nodig; na de eerste volstaat één nieuwe telling per maand.","Custo alimentar real do período = (stock inicial + compras − stock final) ÷ receita sem impostos. São necessárias duas contagens seguidas e as compras do período; após a primeira basta uma nova contagem por mês."],"{x} : {y} HT ({n}/{m} réf. valorisées)":["{x}: {y} excl. tax ({n}/{m} items valued)","{x}: {y} sin impuestos ({n}/{m} referencias valoradas)","{x}: {y} IVA esclusa ({n}/{m} articoli valorizzati)","{x}: {y} netto ({n}/{m} Artikel bewertet)","{x}: {y} excl. btw ({n}/{m} artikelen gewaardeerd)","{x}: {y} sem impostos ({n}/{m} referências valorizadas)"],"Choisissez votre nouveau mot de passe.":["Choose your new password.","Elija su nueva contraseña.","Scegliere la nuova password.","Wählen Sie Ihr neues Passwort.","Kies uw nieuwe wachtwoord.","Escolha a nova palavra-passe."],"Bonjour 👋":["Hello 👋","Hola 👋","Buongiorno 👋","Guten Tag 👋","Hallo 👋","Olá 👋"],"{n} stock(s) à zéro — vérifiez les besoins avant de commander.":["{n} stocks at zero — check requirements before ordering.","{n} stocks a cero — compruebe necesidades antes de pedir.","{n} scorte a zero — verificare i fabbisogni prima di ordinare.","{n} Bestände bei null — Bedarf vor Bestellung prüfen.","{n} voorraden op nul — controleer behoeften vóór bestellen.","{n} stocks a zero — verifique necessidades antes de encomendar."],"{n} passage · prochaine limite {x} · à confirmer":["{n} slot · next deadline {x} · to confirm","{n} horario · próximo límite {x} · por confirmar","{n} orario · prossima scadenza {x} · da confermare","{n} Termin · nächste Frist {x} · zu bestätigen","{n} moment · volgende deadline {x} · te bevestigen","{n} horário · próximo limite {x} · por confirmar"],"{n} passages · prochaine limite {x} · à confirmer":["{n} slots · next deadline {x} · to confirm","{n} horarios · próximo límite {x} · por confirmar","{n} orari · prossima scadenza {x} · da confermare","{n} Termine · nächste Frist {x} · zu bestätigen","{n} momenten · volgende deadline {x} · te bevestigen","{n} horários · próximo limite {x} · por confirmar"],"Décision attendue · besoin {x}":["Decision needed · required {x}","Decisión pendiente · necesario {x}","Decisione richiesta · necessario {x}","Entscheidung ausstehend · Bedarf {x}","Beslissing nodig · nodig {x}","Decisão pendente · necessário {x}"],"Signalée dans Inventaire · {x}":["Reported in Inventory · {x}","Comunicado en Inventario · {x}","Segnalato in Inventario · {x}","Im Inventar gemeldet · {x}","Gemeld in Voorraad · {x}","Comunicado no Inventário · {x}"],"réf.":["ref.","ref.","rif.","Art.","ref.","ref."],"besoin le":["required on","necesario el","necessario il","benötigt am","nodig op","necessário em"],"ex. {x}":["e.g. {x}","p. ej. {x}","es. {x}","z. B. {x}","bijv. {x}","ex. {x}"],"{n} h {m} restantes":["{n} h {m} remaining","Quedan {n} h {m}","Restano {n} h {m}","Noch {n} Std. {m}","Nog {n} u {m}","Restam {n} h {m}"],"{n} j {m} h":["{n} d {m} h","{n} d {m} h","{n} g {m} h","{n} T. {m} Std.","{n} d {m} u","{n} d {m} h"],"{n} min restantes":["{n} min remaining","Quedan {n} min","Restano {n} min","Noch {n} Min.","Nog {n} min","Restam {n} min"]},langs=['fr','en','es','it','de','nl','pt'],tags=['fr-FR','en-GB','es-ES','it-IT','de-DE','nl-NL','pt-PT'],original=new WeakMap(),attrs=new WeakMap(),scheduled=false;
 Object.assign(D,{"Terminer le comptage": ["Finish count", "Terminar el recuento", "Termina il conteggio", "Zählung abschließen", "Telling afronden", "Terminar a contagem"], "Effacer la quantité": ["Clear quantity", "Borrar cantidad", "Cancella quantità", "Menge löschen", "Hoeveelheid wissen", "Apagar quantidade"], "Effacer la quantité : {x}": ["Clear quantity: {x}", "Borrar cantidad: {x}", "Cancella quantità: {x}", "Menge löschen: {x}", "Hoeveelheid wissen: {x}", "Apagar quantidade: {x}"], "Quantité restante : {x}": ["Remaining quantity: {x}", "Cantidad restante: {x}", "Quantità restante: {x}", "Restmenge: {x}", "Resterende hoeveelheid: {x}", "Quantidade restante: {x}"], "Touchez un produit et indiquez la quantité restante. Une case vide reste à compter. Saisissez 0 uniquement si le stock est nul.": ["Tap a product and enter the quantity left. A blank still needs counting. Enter 0 only if there is no stock.", "Toque un producto e indique la cantidad restante. Una casilla vacía queda por contar. Introduzca 0 solo si no hay existencias.", "Tocca un prodotto e inserisci la quantità rimasta. Una casella vuota resta da contare. Inserisci 0 solo se non ci sono scorte.", "Tippen Sie auf ein Produkt und geben Sie die Restmenge ein. Ein leeres Feld bleibt ungezählt. Geben Sie 0 nur bei leerem Bestand ein.", "Tik op een product en vul de resterende hoeveelheid in. Een leeg veld moet nog geteld worden. Vul alleen 0 in als er geen voorraad is.", "Toque num produto e indique a quantidade restante. Um campo vazio fica por contar. Introduza 0 apenas se não houver stock."]});
 Object.assign(D,{/* C217 */"Les chiffres restent au patron":["The figures stay with the owner","Las cifras quedan para el propietario","I numeri restano al titolare","Die Zahlen bleiben beim Inhaber","De cijfers blijven bij de eigenaar","Os números ficam com o proprietário"],"Pilotage et la Carte s’ouvrent au propriétaire de l’établissement, avec les formules Pilotage ou Pro. Un cuisinier ou un membre de l’équipe qui télécharge l’appli garde l’Inventaire, gratuit, sans accès aux chiffres, à la carte ni au score.":["Pilotage and the Menu open for the establishment’s owner, with the Pilotage or Pro plans. A cook or team member who downloads the app keeps the free Inventory, with no access to the figures, the menu or the score.","Pilotage y la Carta se abren al propietario del local, con las fórmulas Pilotage o Pro. Un cocinero o un miembro del equipo que descargue la app conserva el Inventario gratuito, sin acceso a las cifras, la carta ni la puntuación.","Pilotage e la Carta si aprono al titolare del locale, con le formule Pilotage o Pro. Un cuoco o un membro del team che scarica l’app mantiene l’Inventario gratuito, senza accesso a cifre, menu e punteggio.","Pilotage und die Karte öffnen sich für den Inhaber des Betriebs, mit den Tarifen Pilotage oder Pro. Ein Koch oder Teammitglied, das die App lädt, behält das kostenlose Inventar, ohne Zugriff auf Zahlen, Karte oder Punktzahl.","Pilotage en de Kaart openen voor de eigenaar van de zaak, met de formules Pilotage of Pro. Een kok of teamlid die de app downloadt, houdt de gratis Voorraad, zonder toegang tot cijfers, kaart of score.","O Pilotage e a Carta abrem-se ao proprietário do estabelecimento, com as fórmulas Pilotage ou Pro. Um cozinheiro ou membro da equipa que descarrega a app mantém o Inventário gratuito, sem acesso aos números, à carta nem à pontuação."],"Le bouton « + » en haut en ajoute autant que vous le souhaitez — et vos commandes peuvent se grouper par fournisseur.":["The « + » button at the top adds as many as you need — and orders can be grouped by supplier.","El botón « + » de arriba añade tantos como necesite — y los pedidos pueden agruparse por proveedor.","Il pulsante « + » in alto ne aggiunge quanti serve — e gli ordini possono raggrupparsi per fornitore.","Die Schaltfläche « + » oben fügt beliebig viele hinzu — Bestellungen lassen sich nach Lieferant gruppieren.","De knop « + » bovenaan voegt er zoveel toe als nodig — bestellingen kunnen per leverancier worden gegroepeerd.","O botão « + » no topo adiciona quantos precisar — as encomendas podem agrupar-se por fornecedor."],"ex. Camille":["e.g. Camille","p. ej. Camille","es. Camille","z. B. Camille","bv. Camille","ex. Camille"]});
 function normalize(s){return String(s).replace(/[\u00a0\u202f\u2009]/g,' ').replace(/\s+/g,' ').trim();}
 function locale(){var l=String(document.documentElement.lang||'fr').slice(0,2).toLowerCase();return langs.indexOf(l)>=0?l:'fr';}
 function tag(){return tags[langs.indexOf(locale())];}
 var templates=Object.keys(D).filter(function(k){return /\{\w+\}/.test(k);}).map(function(k){var parts=k.split(/(\{\w+\})/),names=[];return {key:k,names:names,re:new RegExp('^'+parts.map(function(p){if(/^\{\w+\}$/.test(p)){names.push(p.slice(1,-1));return p==='{n}'?'([+−-]?\\d[\\d\\s,.]*)':'(.+?)';}return p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('')+'$')};}).sort(function(a,b){return b.key.length-a.key.length;});
 /* C261 : gabarits généraux bornés (jamais une phrase coupée en deux langues). */
function sansMots(x){return !/(^|[^A-Za-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff\u0152\u0153])[a-z\u00e0-\u00f6\u00f8-\u00ff\u0153]{3,}/.test(String(x||''));}
var GARDE={'Commande {x}':function(x){return /\d|^[A-Z0-9#\/-]+$/.test(x)&&sansMots(x);},'ex. {x}':sansMots};
function tr(text,language){var raw=String(text==null?'':text),k=normalize(raw),i=langs.indexOf(language||locale())-1;if(i<0)return raw;var row=D[k],value=row&&row[i];if(!value){for(var a=0;a<templates.length;a++){var t=templates[a],m=t.re.exec(k);if(m&&GARDE.hasOwnProperty(t.key)&&!GARDE[t.key](m[1]))m=null;if(m){value=D[t.key][i].replace(/\{(\w+)\}/g,function(_,name){var v=m[t.names.indexOf(name)+1];return t.key==='Commander avant {x} · {y}'&&name==='y'?tr(v,language):v;});break;}}}if(!value)return raw;return raw.match(/^\s*/)[0]+value+raw.match(/\s*$/)[0];}
 function userValues(){var set=new Set();function walk(o,depth){if(!o||typeof o!=='object'||depth>8)return;Object.keys(o).forEach(function(k){var v=o[k];if(typeof v==='string'&&/^(name|nom|sup|supplier|actorName|establishmentName|note|notes|label|sku|email|phone|customerNo|portionLabel|unit)$/.test(k)&&v)set.add(normalize(v));else if(v&&typeof v==='object')walk(v,depth+1);});}walk(w.DB,0);return set;}
 function excluded(el){return !el||el.closest('script,style,textarea,[contenteditable="true"],[data-i18n-preserve],.notification-item h3,.notification-detail,.notification-proof p,.notification-meta,.item .name,.item .nm,.item .n,#prodList .name,.ord-match b,.pinv-i .n');}
 function render(root){root=root||document.body;if(!root)return;var protectedText=userValues(),walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n;while((n=walker.nextNode())){if(excluded(n.parentElement))continue;var p=original.get(n),raw=p&&n.nodeValue===p.last?p.source:n.nodeValue;if(protectedText.has(normalize(raw))&&!n.parentElement.closest('#countList .u,label,h1,h2,nav,button[onclick="saveProd()"],button[onclick="saveSpace()"],button[onclick="closeProd()"],button[onclick="closeSpace()"]'))continue;var next=tr(raw);original.set(n,{source:raw,last:next});if(n.nodeValue!==next)n.nodeValue=next;}
  var nodes=root.querySelectorAll?root.querySelectorAll('[aria-label],[placeholder],[title]'):[];Array.prototype.forEach.call(nodes,function(el){if(el.closest('[data-i18n-preserve]'))return;var cache=attrs.get(el)||{};['aria-label','placeholder','title'].forEach(function(a){if(!el.hasAttribute(a))return;var val=el.getAttribute(a),old=cache[a],raw=old&&old.last===val?old.source:val;if(protectedText.has(normalize(raw)))return;var next=tr(raw);cache[a]={source:raw,last:next};if(val!==next)el.setAttribute(a,next);});attrs.set(el,cache);});
 }
 function schedule(){if(scheduled)return;scheduled=true;(w.requestAnimationFrame||w.setTimeout)(function(){scheduled=false;render();});}
 function calendarLocale(){if(w.VerdictOrdering&&Array.isArray(w.VerdictOrdering.days)){var ds=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];var lj=locale();ds.forEach(function(x,i){var v=x;if(lj!=='fr'){try{v=new Intl.DateTimeFormat(lj,{weekday:'short'}).format(new Date(2026,0,4+i));v=v.charAt(0).toUpperCase()+v.slice(1);}catch(e){v=tr(x);}}w.VerdictOrdering.days[i]=v;});/* C266 : 4 janvier 2026 = dimanche */}var td=document.getElementById('today');if(td)td.textContent=new Date().toLocaleDateString(tag(),{weekday:'short',day:'numeric',month:'short'});}
 function setLocale(l){l=String(l||'').slice(0,2).toLowerCase();if(langs.indexOf(l)<0)return false;if(document.documentElement.lang!==l)document.documentElement.lang=l;calendarLocale();render();if(w.VerdictInventairePremium){var el=document.getElementById('pinv');if(el)el.removeAttribute('data-sig');w.VerdictInventairePremium.rendre();}return true;}
 function exportText(s){var protectedText=userValues();return String(s).split('\n').map(function(line){return protectedText.has(normalize(line))?line:tr(line);}).join('\n');}
 w.VerdictInventoryI18n={version:'R200.1',t:tr,locale:locale,tag:tag,render:render,setLocale:setLocale,exportText:exportText,keys:function(){return Object.keys(D);}};
 try{var q=new URLSearchParams(location.search),l=q.get('lang');if(l)setLocale(l);}catch(e){}
 w.addEventListener('message',function(event){if(event.origin!==location.origin&&!(location.protocol==='file:'&&event.origin==='null'))return;var d=event.data;if(!d||w.parent===w||event.source!==w.parent)return;if(d.type==='verdict-unified-locale')setLocale(d.locale);else if((d.type==='verdict-unified-apply-context'||d.type==='verdict-unified-shell-ready')&&d.context)setLocale(d.context.locale);});
 new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var m=ms[i];if(m.type==='characterData'){var p=original.get(m.target);if(p&&m.target.nodeValue===p.last)continue;}schedule();break;}}).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['lang','aria-label','placeholder','title']});
 if(w.VerdictOrdering&&w.VerdictOrdering.pdfBytes){var pdf=w.VerdictOrdering.pdfBytes;w.VerdictOrdering.pdfBytes=function(title,lines){return pdf.call(this,tr(title),(lines||[]).map(exportText));};}
 w.addEventListener('load',schedule);render();
})(window);
/* R216 : prise de langue de Verdict. Le pont lit verdict_locale dans localStorage ; on l’applique au démarrage, à chaque changement (événement storage), et par sondage borné chaîné (pas de setInterval permanent). */
(function(w){function lire(){try{var l=String(localStorage.getItem('verdict_locale')||'').replace(/"/g,'').slice(0,2).toLowerCase();return /^(fr|en|es|it|de|nl|pt)$/.test(l)?l:'';}catch(e){return '';}}
 var cur='';function applique(){var l=lire();if(l&&l!==cur&&w.VerdictInventoryI18n){var avant=cur;cur=l;
 /* C266 : la page est déjà traduite dans une autre langue que le français : chaque traducteur ne reconnaît que le texte français
    d'origine, on recharge donc l'Inventaire (comptages enregistrés avant) au lieu de traduire par-dessus. */
 if(avant&&avant!=='fr'){try{if(typeof w.flushInventoryFastSave==='function')w.flushInventoryFastSave();}catch(e){}try{w.location.reload();return;}catch(e){}}
 w.VerdictInventoryI18n.setLocale(l);}}
 applique();try{w.addEventListener('storage',applique);}catch(e){}var n=0;(function tick(){applique();if(n++<3600)setTimeout(tick,1500);})();
 /* C266 : choix de la langue depuis Plus. La langue passe par Pilotage quand il est là (même réglage partout), sinon par la coque ;
    l'Inventaire se recharge ensuite proprement (ci-dessus). */
 w.inventaireChoisirLangue=function(l){l=String(l||'').slice(0,2).toLowerCase();if(!/^(fr|en|es|it|de|nl|pt)$/.test(l)||l===(lire()||'fr'))return;
  try{localStorage.setItem('verdict_locale',l);localStorage.setItem('verdict_lang_asked','1');}catch(e){}
  var fait=false;try{var P=w.parent&&w.parent!==w?w.parent:null,f=P&&P.document.getElementById('frame-verdict'),V=f&&f.contentWindow;if(V&&typeof V.setLocale==='function'){V.setLocale(l);fait=true;}}catch(e){}
  if(!fait){try{if(w.parent&&w.parent!==w)w.parent.document.documentElement.lang=l;}catch(e){}}
  applique();};
 function choixLangue(){var s=document.getElementById('inventaireLangueChoix');if(s&&s.value!==(lire()||'fr'))s.value=lire()||'fr';}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',choixLangue);else choixLangue();
 w.addEventListener('load',function(){try{var l=lire();if(l&&l!=='fr'&&w.VerdictInventoryI18n)w.VerdictInventoryI18n.setLocale(l);}catch(e){}});/* C266 : jours des créneaux (VerdictOrdering chargé après) */
})(window);
/* C248 : fin de R207. L'Inventaire est traduit (R216) : les cartes de Verdict suivent la langue choisie, sans bandeau « en français seulement ». */ function matiereEcartHtml(){var F=matiereVerdictFrame();if(!F)return '';try{return F.verdictMatiereCarteHTML(F.verdictMatiereDepuisInventaire(inventaireDonneesMatiere()))||'';}catch(e){return '';}}

function fournisseursHtml(){var F=typeof matiereVerdictFrame==='function'?matiereVerdictFrame():null;if(!F||typeof F.verdictFournisseursCarteHTML!=='function')return '';try{return F.verdictFournisseursCarteHTML()||'';}catch(e){return '';}}
function inventaireDonneesFournisseurs(){var rows={};(typeof siteRows==='function'?siteRows(DB.site):[]).forEach(function(x){if(x&&x.p)rows[x.p.id]=x.p;});
  return {site:DB.site,historique:(DB.priceHistory||[]).filter(function(x){return x&&x.site===DB.site;}).map(function(x){var q=rows[x.product]||{};return {date:String(x.date||'').slice(0,10),produitNom:x.name||q.name,unite:q.unit||null,fournisseur:q.sup||null,avant:x.from,apres:x.to};})};}

function facturesHtml(){var F=typeof matiereVerdictFrame==='function'?matiereVerdictFrame():null;if(!F||typeof F.verdictFacturesCarteHTML!=='function')return '';try{return F.verdictFacturesCarteHTML()||'';}catch(e){return '';}}
function facLire(inp){var F=matiereVerdictFrame(),fi=inp&&inp.files&&inp.files[0];if(!F||!fi)return;var r=new FileReader(),pdf=/\.pdf$/i.test(fi.name)||fi.type==='application/pdf';
  r.onload=function(){try{if(pdf){F.verdictFactureAnalyserPDF(r.result,fi.name).then(function(){drawStats();},function(){drawStats();});return;}F.verdictFactureAnalyser(String(r.result||''),fi.name);}catch(e){}drawStats();};if(pdf)r.readAsArrayBuffer(fi);else r.readAsText(fi);}
function facValider(){var F=matiereVerdictFrame();if(!F)return;var v={};[].forEach.call(document.querySelectorAll('#facturesCarte .fac-l'),function(row){var id=row.getAttribute('data-ligne'),ck=row.querySelector('.fac-ok'),sel=row.querySelector('.fac-prod'),cq=row.querySelector('.fac-cq'),cu=row.querySelector('.fac-cu');
  var o={valide:!!(ck&&ck.checked),produitId:sel&&sel.value?sel.value:null};if(cq&&cq.value!==''&&isFinite(+cq.value)&&+cq.value>0)o.conditionnement={qte:+cq.value,unite:cu?cu.value:'kg'};v[id]=o;});
  try{F.verdictFactureValider(v);}catch(e){}drawStats();}
function facAnnuler(){var F=matiereVerdictFrame();if(F)try{F.verdictFactureAnnuler();}catch(e){}drawStats();}

function invQteDansPeriode(o,l,a,b){a=String(a);b=String(b);var mv=[];if(Array.isArray(l.receptions)&&l.receptions.length)l.receptions.forEach(function(r){mv.push([String(r.at),+r.qty]);});else if(+l.receivedQty>0)mv.push([String(o.receivedAt||o.updatedAt||''),+l.receivedQty]);(l.returns||[]).forEach(function(r){mv.push([String(r.at),-(+r.qty)]);});var q=0;mv.forEach(function(m){if(m[0]>a&&m[0]<=b&&isFinite(m[1]))q+=m[1];});return Math.round(q*1000)/1000;}
function inventaireDonneesCommandes(){return {site:DB.site,commandes:(DB.purchaseOrders||[]).filter(function(o){return o&&o.site===DB.site;}).map(function(o){return {id:o.id,supplier:o.supplier,status:o.status,createdAt:o.createdAt,updatedAt:o.updatedAt,receivedAt:o.receivedAt||null,deliveryAt:o.deliveryAt||null,receipts:(o.receipts||[]).map(function(r){return {at:r.at,mode:r.mode};}),lines:(o.lines||[]).map(function(l){return {name:l.name,sku:l.sku||null,unit:l.unit,quantity:l.quantity,receivedQty:l.receivedQty,price:l.price,refusedQty:l.refusedQty||0,returnedQty:l.returnedQty||0,receptions:l.receptions||null,returns:l.returns||null,refusals:l.refusals||null};})};})};}
function cyclesHtml(){var F=typeof matiereVerdictFrame==='function'?matiereVerdictFrame():null;if(!F||typeof F.verdictCyclesCarteHTML!=='function')return '';try{return F.verdictCyclesCarteHTML()||'';}catch(e){return '';}}

function drawStats(){
  var val=valuationForSite(DB.site), a=val.rows,i,st;
  var demoContract=window.VERDICT_BRASSERIE_INVENTORY_DEMO||{};
  var stockV=val.eur, ordV=0, alerts=0, counted=val.counted, ord=0,ordPriced=0;
  var sv={}, ov={}, keys=[];
  for(i=0;i<a.length;i++){
    var p=a[i].p; st=state(p);
    var k=((p.sup||"").trim())||"Sans fournisseur";
    if(!sv.hasOwnProperty(k)){ sv[k]=0; ov[k]=0; keys.push(k); }
    if(p.stock!=null&&px(p)!==null){ sv[k]+=(+p.stock||0)*px(p); }
    if(st.need>0){ ord++; if(px(p)!==null){ordPriced++;ordV+=st.need*px(p);ov[k]+=st.need*px(p);} }
    if(st.k==="rup"||st.k==="min") alerts++;
  }
  var money=val.priced>0;
  var valueLabel=val.exact?"Valeur du stock":"Valeur connue";
  /* C229 (X26) : « 0/42 réf. chiffrées » alors que 33 prix sont connus : la valeur attend un comptage, les prix sont dits à part. */
  var valueDetail=val.exact?"comptage + prix complets":(val.total?(val.counted?(val.priced+"/"+val.total+" r\u00e9f. chiffr\u00e9es \u00b7 valeur partielle"+(val.pricedRefs>val.priced?" \u00b7 prix connus "+val.pricedRefs+"/"+val.total:"")):("prix connus "+val.pricedRefs+"/"+val.total+" \u00b7 valeur apr\u00e8s votre premier comptage")):"ajoutez vos produits");
  var h='<div class="kpis">'+
    '<div class="kpi"><div class="k">'+valueLabel+'</div><div class="v" style="color:#60a5fa">'+(money?eur(stockV):"\u2014")+'</div><div class="d">'+valueDetail+'</div></div>'+
    '<div class="kpi"><div class="k">Besoin brut</div><div class="v" style="color:var(--green)">'+(ordPriced?eur(ordV):nb(ord))+'</div><div class="d">'+ord+' produit'+(ord>1?"s":"")+' \u00e0 commander · montant estimé'+(ordPriced&&ordPriced<ord?" \u00b7 valeur partielle":"")+'</div></div>'+
    '<div class="kpi"><div class="k">Alertes</div><div class="v" style="color:'+(alerts?"var(--orange)":"var(--green)")+'">'+alerts+'</div><div class="d">rupture ou sous le minimum</div></div>'+
    '<div class="kpi"><div class="k">Compt&eacute;s</div><div class="v">'+counted+'<span style="font-size:15px;color:var(--mut)">/'+a.length+'</span></div><div class="d">Cuisine + Bar de '+esc(siteName(DB.site))+'</div></div>'+
  '</div>';
  if(money){
    keys.sort(function(x,y){ return sv[y]-sv[x]; });
    h+='<div class="card"><h3>Valeur du stock par fournisseur</h3>'+bars(keys,sv,"#60a5fa")+'</div>';
    var ko=keys.slice().sort(function(x,y){ return ov[y]-ov[x]; });
    h+='<div class="card"><h3>&Agrave; commander par fournisseur</h3>'+bars(ko,ov,"var(--green)")+'</div>';
  }else if(val.pricedRefs){
    /* C229 (X26) : des prix sont connus : on ne demande pas de les ajouter, la valeur arrive avec le comptage. */
    h+='<div class="card"><h3>Prix connus : '+val.pricedRefs+'/'+val.total+' produits</h3><p class="sub" style="margin:0">La valeur de votre stock appara&icirc;t d&egrave;s votre premier comptage'+(val.pricedRefs<val.total?' ; un produit sans prix reste hors du total, jamais compt&eacute; &agrave; 0':'')+'.</p></div>';
  }else{
    h+='<div class="card"><h3>D&eacute;bloquez la valeur de votre stock</h3>'+
      '<p class="sub" style="margin:0">Ajoutez le <b>prix d&rsquo;achat</b> de vos produits (fiche produit, champ facultatif) : '+
      'l&rsquo;appli calcule aussit&ocirc;t ce que votre stock repr&eacute;sente et ce que chaque commande va vous co&ucirc;ter.</p></div>';
  }
  if(counted)h+='<button class="btn" style="margin:4px 0 10px" onclick="finishCount()">Enregistrer ce comptage</button>';
  if(money) h+='<button class="btn ghost" style="margin:0 0 14px" onclick="copyStock()">Copier la valeur connue</button>'+
    '<p class="sub" style="margin:-8px 0 16px;text-align:center;font-size:11.5px;color:var(--mut2)">'+(val.exact?"Inventaire valoris\u00e9 complet.":"Valeur partielle : les r\u00e9f\u00e9rences non compt\u00e9es ou sans prix ne sont jamais assimil\u00e9es \u00e0 0.")+'</p>';
  h+=historyHtml();
  var dp=inventoryDemand(),ready=dp.products.filter(function(x){return x.status==='ready';}),pending=dp.products.filter(function(x){return x.pendingExceptions.length;});
  h+='<div class="card"><h3>Commande intelligente</h3>';
  if(!ready.length){h+='<p class="sub" style="margin:0">En attente d&rsquo;au moins 7 jours de ventes reli&eacute;es aux fiches techniques. Verdict ne transforme jamais une seule grosse journ&eacute;e en nouvelle norme.</p>';}
  else {var dbP=DB.demandBridge&&DB.demandBridge.periode,jjP=function(s){return String(s||'').slice(0,10).split('-').reverse().join('/');};/* C217 W58 : la source des ventes est dite */h+='<p class="sub" style="margin:0 0 10px">Suggestion fond&eacute;e sur les jours comparables, le stock, les commandes en cours, le colis, le d&eacute;lai et la dur&eacute;e utilisable. Rien ne remplace votre cible sans confirmation.'+(dbP?' Ventes de votre caisse &times; vos fiches, du '+jjP(dbP.de)+' au '+jjP(dbP.a)+(dbP.nature==='mêmes semaines l’an passé'?' (mêmes semaines l&rsquo;an pass&eacute;)':'')+'.':'')+'</p>'+ready.slice(0,8).map(function(x){return '<div class="bar"><div class="bt"><span><b>'+esc(x.name)+'</b><br><small>'+({high:'fiable',medium:'assez fiable',low:'à confirmer'}[x.confidence]||x.confidence)+' · '+x.normalObservations+' jours de ventes</small></span><span class="mono">'+nb(x.recommended)+' '+esc(x.unit)+'</span></div><button class="btn ghost" style="margin-top:7px" onclick="applyDemandGoal(\''+esc(x.id)+'\','+x.target+')">Confirmer la cible '+nb(x.target)+'</button></div>';}).join('');}
  if(pending.length)h+='<p class="sub" style="color:var(--orange);margin:10px 0 0">'+pending.length+' produit(s) comportent une journ&eacute;e inhabituelle &agrave; classer : &eacute;v&eacute;nement, erreur, nouvelle tendance ou raison inconnue.</p>';
  h+='</div>';
  if(DEMO&&DB.site==='demo-brasserie')h+='<div class="card inventory-verdict-proof" id="inventoryVerdictProof" data-reframe-anchor="true"><h3>Votre stock est transmis à Verdict<span class="n">même établissement</span></h3>'+
    '<div class="inventory-proof-grid"><div><b>'+esc(demoContract.establishmentId||DB.site)+'</b><span>identifiant stable</span></div><div><b>'+eur(val.eur)+'</b><span>stock final observé</span></div><div><b>'+val.priced+'/'+val.total+'</b><span>références valorisées</span></div></div>'+
    '<p class="inventory-proof-rule">Inventaire transmet cette preuve et les opérations. Verdict rapproche ensuite ventes, achats, charges et équipes, puis calcule seul le score de structure.</p></div>';
  var verdictHref=DEMO?'../verdict/verdict-app.html?presentation=brasserie&amp;bridge=inventory&amp;inventory=demo-brasserie':'../verdict/verdict-app.html?bridge=inventory';
  h+='<div class="bridge" id="inventoryVerdictBridge">Votre inventaire r&eacute;pond &agrave; <b>&laquo;&nbsp;qu&rsquo;est-ce que j&rsquo;ai&nbsp;?&nbsp;&raquo;</b><br>Verdict r&eacute;pond &agrave; <b>&laquo;&nbsp;est-ce que mon restaurant me rapporte vraiment&nbsp;?&nbsp;&raquo;</b>'+
    '<span class="s"><a href="'+verdictHref+'">Ouvrir le m&ecirc;me &eacute;tablissement dans Verdict &rarr;</a><br>m&ecirc;me compte &middot; aucune recopie'+offreInventaireTexte()+'</span></div>';
  try{h+=matiereReelHtml();}catch(e){}
  try{h+=matiereEcartHtml();}catch(e){}
  try{h+=fournisseursHtml();}catch(e){}
  try{h+=facturesHtml();}catch(e){}
  try{h+=cyclesHtml();}catch(e){}
  document.getElementById("statsBody").innerHTML=h;
}
/* C217 W62 : même offre que la grille validée (05-BACKEND-API/src/offre.js) et la décision W38 (un seul essai, porté par le compte).
   Pendant l'essai, on dit l'essai en cours ; sans formule locale (Perso, atelier, démo), aucun discours d'offre. */
function offreInventaireTexte(){
  var plan=null,e=null;try{plan=window.top&&window.top.VerdictPlan;}catch(x){plan=null;}
  /* C217 W62 : contrat L4 (C215) — quand le serveur de comptes répond, l'essai est celui du compte (top.VERDICT_COMPTE). */
  var T=null;try{T=window.top;}catch(x){T=null;}
  if(!DEMO&&T&&T.VERDICT_ESSAI_PAR_COMPTE===true){
    var C=T.VERDICT_COMPTE,px2=' &middot; Pilotage 69&nbsp;€&nbsp;HT/mois (690&nbsp;€&nbsp;HT/an) ou Pro 129&nbsp;€&nbsp;HT/mois (1&nbsp;290&nbsp;€&nbsp;HT/an) pour un &eacute;tablissement, +39&nbsp;€&nbsp;HT/mois en Pilotage ou +69&nbsp;€&nbsp;HT/mois en Pro par &eacute;tablissement en plus';
    if(!C)return ' &middot; cr&eacute;ez votre compte&nbsp;: 14 jours de Pro complet offerts, sans carte bancaire'+px2.replace(' &middot; ',' &middot; ensuite, &agrave; vous de choisir&nbsp;: ');
    if(C.formule==='essai'){var j=Math.max(0,Number(C.joursRestants)||0);return ' &middot; essai en cours'+(j?'&nbsp;: encore '+j+' jour'+(j>1?'s':''):'')+' de Pro complet'+px2.replace(' &middot; ',' &middot; ensuite, &agrave; vous de choisir&nbsp;: ');}
    if(C.formule==='pilotage')return ' &middot; votre formule&nbsp;: Pilotage';
    if(C.formule==='pro')return ' &middot; votre formule&nbsp;: Pro';
    if(C.formule==='activation')return ' &middot; confirmez l&rsquo;adresse de votre compte pour ouvrir vos 14 jours de Pro complet';
    return ' &middot; votre essai est termin&eacute;, l&rsquo;Inventaire reste gratuit'+px2;
  }
  if(DEMO||!plan||typeof plan.etat!=='function')return '';
  try{e=plan.etat();}catch(x){e=null;}
  var prix=' &middot; ensuite, &agrave; vous de choisir&nbsp;: Pilotage 69&nbsp;€&nbsp;HT/mois (690&nbsp;€&nbsp;HT/an) ou Pro 129&nbsp;€&nbsp;HT/mois (1&nbsp;290&nbsp;€&nbsp;HT/an) pour un &eacute;tablissement, +39&nbsp;€&nbsp;HT/mois en Pilotage ou +69&nbsp;€&nbsp;HT/mois en Pro par &eacute;tablissement en plus';
  if(e&&e.niveau==='essai'&&e.jours>0)return ' &middot; essai en cours&nbsp;: encore '+e.jours+' jour'+(e.jours>1?'s':'')+' de Pro complet'+prix;
  if(e&&e.niveau==='complet')return '';
  return ' &middot; 14 jours de Pro complet offerts avec votre compte, sans carte bancaire'+prix;
}
function copyStock(){
  var d=new Date().toLocaleDateString("fr-FR"), tot=0, lines=[], val=valuationForSite(DB.site);
  spList(DB.site).forEach(function(k){
    var v=0,n=0,t=(DB.spaces[k].products||[]).length;
    (DB.spaces[k].products||[]).forEach(function(p){if(p.stock!=null&&px(p)!==null){v+=(+p.stock||0)*px(p);n++;}});
    tot+=v; lines.push(spName(k)+" : "+eur(v)+" HT ("+n+"/"+t+" r\u00e9f. valoris\u00e9es)");
  });
  if(!val.priced){ toast("Comptez vos produits et ajoutez leurs prix d\u2019achat"); return; }
  var txt=(val.exact?"VALEUR DU STOCK":"VALEUR CONNUE \u2014 INVENTAIRE PARTIEL")+" \u2014 "+siteName(DB.site)+" \u2014 "+d+"\n"+lines.join("\n")+
    "\nTOTAL CONNU : "+eur(tot)+" HT\nCouverture : "+val.priced+"/"+val.total+" r\u00e9f\u00e9rences ("+val.coverage+" %)"+
    (val.exact?"\nComptage et prix complets.":"\nATTENTION : ce total est partiel. Les lignes manquantes ne valent pas z\u00e9ro.")+
    "\n\nFood cost r\u00e9el sur une p\u00e9riode = (stock initial + achats \u2212 stock final) \u00f7 CA HT. Il faut deux points de stock successifs et les achats de la p\u00e9riode ; apr\u00e8s le premier point, un seul nouveau comptage par mois suffit.";
  var done=function(){ toast("Valeur du stock copi\u00e9e"); };
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(done,function(){ fallback(txt,done); });
  } else fallback(txt,done);
}
function bars(keys,vals,color){
  var max=0,i; for(i=0;i<keys.length;i++) if(vals[keys[i]]>max) max=vals[keys[i]];
  if(!max) return '<p class="sub" style="margin:0">Rien &agrave; afficher pour l&rsquo;instant.</p>';
  return keys.filter(function(k){ return vals[k]>0; }).map(function(k){
    return '<div class="bar"><div class="bt"><span>'+esc(k)+'</span><span class="mono">'+eur(vals[k])+'</span></div>'+
      '<div class="tr"><i style="width:'+(vals[k]/max*100).toFixed(1)+'%;background:'+color+'"></i></div></div>';
  }).join("");
}

/* ---------- produits ---------- */
function catalogSearchKey(value){
  var text=String(value==null?"":value).toLowerCase();
  try{text=text.normalize("NFD").replace(/[\u0300-\u036f]/g,"");}catch(e){}
  text=text.replace(/\u0153/g,"oe").replace(/\u00e6/g,"ae");
  return text.replace(/[^a-z0-9]+/g," ").trim();
}
function catalogMatches(p,query){
  var terms=catalogSearchKey(query).split(" ").filter(Boolean);
  if(!terms.length)return true;
  var haystack=catalogSearchKey([p.name,p.sup,p.unit].join(" "));
  return terms.every(function(term){return haystack.indexOf(term)>=0;});
}
function drawProd(){
  fillLists();
  var el=document.getElementById("prodList"),status=document.getElementById("prodSearchStatus");
  var all=SP().products,query=(document.getElementById("prodQ")||{}).value||"";
  if(!all.length){ el.innerHTML='<div class="empty">Aucun produit.</div>'; if(status)status.textContent=""; return; }
  var list=all.filter(function(p){return catalogMatches(p,query);});
  if(status)status.textContent=(query.trim()?(list.length+" r\u00e9sultat"+(list.length>1?"s":"")+" sur "+all.length):(all.length+" produit"+(all.length>1?"s":"")))+" \u00b7 espace "+spName(DB.space);
  if(!list.length){el.innerHTML='<div class="empty">Aucun produit ne correspond.<br><button class="btn ghost" style="margin-top:12px" onclick="document.getElementById(\'prodQ\').value=\'\';drawProd();document.getElementById(\'prodQ\').focus()">Effacer la recherche</button></div>';return;}
  var groups=bySup(list),i,h="";
  for(i=0;i<groups.length;i++){
    h+='<div class="suph">'+esc(groups[i][0])+'<span class="n">'+groups[i][1].length+'</span></div>';
    h+=groups[i][1].map(function(p){
      return '<div class="item z-non" data-id="'+esc(p.id)+'" role="button" tabindex="0" onclick="openProd(this.dataset.id)" onkeydown="if(/^(Enter| )$/.test(event.key)){event.preventDefault();openProd(this.dataset.id)}">'+
        '<div class="l1"><div style="flex:1;min-width:0"><div class="nm">'+esc(p.name)+'</div>'+
        '<div class="u">alerte si moins de '+nb(p.min)+(p.unit?' '+esc(p.unit):'')+'</div></div>'+
        '<span class="tag t-non">'+(STAFF&&!staffCan("edit_catalog")&&!staffCan("edit_prices")&&!staffCan("edit_suppliers")&&!staffCan("edit_orders")?'consulter':'modifier')+'</span></div>'+
        '<div class="mini">'+LVLS.map(function(x){
          return '<div class="mc'+(x[0]===level()?" on":"")+'"><i>'+x[1]+'</i><b>'+nb(goalAt(p,x[0]))+'</b>'+(isOver(p,x[0])?'<u></u>':'')+'</div>';
        }).join("")+'</div></div>';
    }).join("");
  }
  el.innerHTML=h;
}
function fillLists(){
  var sups={},units={},i,a=SP().products;
  for(i=0;i<a.length;i++){ if(a[i].sup)sups[a[i].sup]=1; if(a[i].unit)units[a[i].unit]=1; }
  document.getElementById("sups").innerHTML=Object.keys(sups).sort().map(function(s){
    return '<option value="'+esc(s)+'">'; }).join("");
  document.getElementById("units").innerHTML=Object.keys(units).sort().map(function(u){
    return '<option value="'+esc(u)+'">'; }).join("");
}
var POVER={};
function openProd(id){
  if(STAFF&&(!staffCanProducts()||(!id&&!staffCan("edit_catalog")))){toast("Cette fonction n’est pas autorisée par votre gérant");return;}
  fillLists();
  POVER={};
  var del=document.getElementById("pDel");
  if(id){
    var p=find(id); if(!p)return;
    document.getElementById("pTitle").textContent="Modifier";
    document.getElementById("pName").value=p.name||"";
    document.getElementById("pSup").value=p.sup||"";
    document.getElementById("pUnit").value=p.unit||"";
    document.getElementById("pGoal").value=p.goal==null?"":p.goal;
    document.getElementById("pMin").value=p.min==null?"":p.min;
    document.getElementById("pPrice").value=p.price==null?"":p.price;
    document.getElementById("pPack").value=p.pack&&p.pack!==1?p.pack:"";
    document.getElementById("pMinOrder").value=p.minOrder==null?"":p.minOrder;
    document.getElementById("pLead").value=p.leadDays==null?"":p.leadDays;
    document.getElementById("pShelf").value=p.shelfLifeDays==null?"":p.shelfLifeDays;
    document.getElementById("pId").value=p.id;
    POVER=Object.assign({},p.over||{});
    del.style.display="block";
  }else{
    document.getElementById("pTitle").textContent="Nouveau produit";
    ["pName","pGoal","pMin","pPrice","pPack","pMinOrder","pLead","pShelf","pId"].forEach(function(k){ document.getElementById(k).value=""; });
    document.getElementById("pSup").value=DB.lastSup||"";
    document.getElementById("pUnit").value=DB.lastUnit||"";
    del.style.display="none";
  }
  drawGoals();
  applyStaffPermissions();
  document.getElementById("mProd").classList.add("on");
}
function drawGoals(){
  var base=num(document.getElementById("pGoal").value)||0;
  var el=document.getElementById("pSeasons"); if(!el)return;
  el.innerHTML=LVLS.map(function(x){
    var l=x[0], v=(POVER[l]!=null&&POVER[l]!=="")?POVER[l]:Math.round(base*COEF[l]*10)/10;
    return '<div class="scell'+(l===level()?" on":"")+'">'+
      '<div class="k">'+x[1]+'</div>'+
      '<input type="number" inputmode="decimal" value="'+(v||v===0?nb(v).replace(",","."):"")+'" onchange="setOver(\''+l+'\',this.value)">'+
      '<div class="d">'+(POVER[l]!=null&&POVER[l]!==""?"r&eacute;gl&eacute;":"")+'</div></div>';
  }).join("");
}
function setOver(l,v){
  var base=num(document.getElementById("pGoal").value)||0;
  var val=num(v);
  if(l==="normale"){ document.getElementById("pGoal").value=(val==null?"":val); POVER.normale=null; drawGoals(); return; }
  if(val==null||val===Math.round(base*COEF[l]*10)/10) POVER[l]=null; else POVER[l]=val;
  drawGoals();
}
function closeProd(){ document.getElementById("mProd").classList.remove("on"); }
function saveProd(){
  if(window.VerdictSaveStateA10&&window.VerdictSaveStateA10.pending>0)return false;
  if(STAFF&&!staffCan("edit_catalog")&&!staffCan("edit_prices")&&!staffCan("edit_suppliers")&&!staffCan("edit_orders")){toast("Modification non autorisée");return;}
  var name=document.getElementById("pName").value.trim();
  if(!name){ toast("Donne un nom au produit"); return; }
  name=name.charAt(0).toUpperCase()+name.slice(1);
  var parsed=VerdictInventoryFields.parse(function(id){return document.getElementById(id).value;});
  if(!parsed.ok){var bad=parsed.errors[0],field=document.getElementById(bad.field);toast(VerdictInventoryFields.text(0)+(field&&field.getAttribute('aria-label')||bad.field));if(field&&field.focus)field.focus();return false;}
  var o={ name:name,
    sup:document.getElementById("pSup").value.trim(),
    unit:document.getElementById("pUnit").value.trim(),
    goal:parsed.fields.goal,
    min:parsed.fields.min,
    price:parsed.fields.price,
    pack:parsed.fields.pack,
    minOrder:parsed.fields.minOrder,
    leadDays:parsed.fields.leadDays,
    shelfLifeDays:parsed.fields.shelfLifeDays,
    over:{} };
  LVLS.forEach(function(x){ if(POVER[x[0]]!=null&&POVER[x[0]]!=="") o.over[x[0]]=POVER[x[0]]; });
  var id=document.getElementById("pId").value;
  if(!id){
    var dup=null,a=SP().products,i;
    for(i=0;i<a.length;i++) if((a[i].name||"").toLowerCase()===name.toLowerCase()) dup=a[i];
    if(dup){ toast("\u00ab "+dup.name+" \u00bb existe d\u00e9j\u00e0"); closeProd(); openProd(dup.id); return; }
  }
  if(o.sup) DB.lastSup=o.sup; if(o.unit) DB.lastUnit=o.unit;
  if(id){ var p=find(id), oldPrice=px(p); p.name=o.name; p.sup=o.sup; p.unit=o.unit; p.goal=o.goal; p.min=o.min; p.price=o.price;p.pack=o.pack;p.minOrder=o.minOrder;p.leadDays=o.leadDays;p.shelfLifeDays=o.shelfLifeDays;p.over=o.over;
    if(oldPrice!==o.price){ if(!DB.priceHistory)DB.priceHistory=[]; DB.priceHistory.push({date:new Date().toISOString(),site:DB.site,space:DB.space,product:id,name:o.name,from:oldPrice,to:o.price}); if(DB.priceHistory.length>200)DB.priceHistory=DB.priceHistory.slice(-200); }
  }
  else { o.id=uid(); o.stock=null; SP().products.push(o); }
  var saved=save();if(saved&&saved.status==="failed"){toast(VerdictInventoryFields.text(1));return false;}closeProd(); drawProd(); badge(); toast(id?"Produit modifi\u00e9":"Produit ajout\u00e9");
}
function askDelProd(){
  if(STAFF&&!staffCan("edit_catalog")){toast("Suppression non autorisée");return;}
  var id=document.getElementById("pId").value,p=find(id); if(!p)return;
  ask("Supprimer "+p.name+" ?","Le produit dispara\u00eet de votre inventaire.","Supprimer",function(){
    SP().products=SP().products.filter(function(x){ return x.id!==id; });
    save(); closeProd(); drawProd(); badge(); toast("Produit supprim\u00e9");
  },true);
}
function askReset(){
  ask("Vider les comptages ?","Vos produits restent, seuls les chiffres compt\u00e9s sont effac\u00e9s.","Vider",function(){
    SP().products.forEach(function(p){var before=p.stock;p.stock=null;recordCount(p,before);p.countedAt=null;p.countedBy=null;});
    save(); drawProd();drawCount();refreshCountProgress(); badge(); toast("Comptages vid\u00e9s");
  },true);
}
function askExample(){
  if(DEMO){ toast("La Brasserie fictive compl\u00e8te est d\u00e9j\u00e0 charg\u00e9e"); return; }
  ask("Charger l'exemple ?","Il remplace les produits de cet espace.","Charger",function(){
    var kind=(DB.meta[DB.space]&&DB.meta[DB.space].kind)||(/bar/i.test(spName(DB.space))?"bar":"cuisine");
    DB.spaces[DB.space]=newSpace(kind,true); save(); drawProd(); badge(); toast("Exemple charg\u00e9");
  },true);
}

function backup(){
  if(DEMO){toast("Sauvegarde désactivée dans la démonstration fictive");return;}
  try{
    var blob=new Blob([JSON.stringify(DB)],{type:"application/json"});
    var a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download="inventaire-"+new Date().toISOString().slice(0,10)+".json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(a.href); },1500);
    toast("Sauvegarde t\u00e9l\u00e9charg\u00e9e");
  }catch(e){ toast("Sauvegarde impossible ici"); }
}
/* R235: validate before changing state, confirm, and keep one reversible local copy. */
var INVENTORY_RESTORE_COPY={
fr:['Restaurer cet inventaire ?','Le fichier remplacera cet inventaire. Une copie précédente sera conservée sur cet appareil.','Restaurer','Fichier non reconnu ou quantités invalides. Aucune donnée modifiée.','L’établissement ou les données ont changé. Recommencez la restauration.','La copie de sécurité ne peut pas être enregistrée. Aucune donnée modifiée.','Inventaire restauré','Restaurer la copie précédente','Aucune copie précédente disponible','Fichier trop volumineux (10 Mo maximum).','Sauvegarde de l’Inventaire uniquement. Pilotage et Carte disposent de leur propre sauvegarde.'],
en:['Restore this inventory?','The file will replace this inventory. A previous copy will be kept on this device.','Restore','Unrecognized file or invalid quantities. No data changed.','The establishment or data changed. Start the restore again.','The safety copy cannot be saved. No data changed.','Inventory restored','Restore the previous copy','No previous copy available','File too large (10 MB maximum).','Inventory backup only. Pilotage and Carte have their own backup.'],
es:['¿Restaurar este inventario?','El archivo sustituirá este inventario. Se guardará una copia anterior en este dispositivo.','Restaurar','Archivo no reconocido o cantidades inválidas. No se ha modificado ningún dato.','El establecimiento o los datos han cambiado. Reinicie la restauración.','No se puede guardar la copia de seguridad. No se ha modificado ningún dato.','Inventario restaurado','Restaurar la copia anterior','No hay copia anterior disponible','Archivo demasiado grande (máximo 10 MB).','Copia solo del Inventario. Pilotage y Carte tienen su propia copia.'],
it:['Ripristinare questo inventario?','Il file sostituirà questo inventario. Una copia precedente sarà conservata su questo dispositivo.','Ripristina','File non riconosciuto o quantità non valide. Nessun dato modificato.','La struttura o i dati sono cambiati. Riavvii il ripristino.','Impossibile salvare la copia di sicurezza. Nessun dato modificato.','Inventario ripristinato','Ripristina la copia precedente','Nessuna copia precedente disponibile','File troppo grande (massimo 10 MB).','Copia del solo Inventario. Pilotage e Carte hanno una propria copia.'],
de:['Dieses Inventar wiederherstellen?','Die Datei ersetzt dieses Inventar. Eine vorherige Kopie bleibt auf diesem Gerät erhalten.','Wiederherstellen','Unbekannte Datei oder ungültige Mengen. Keine Daten geändert.','Betrieb oder Daten wurden geändert. Starten Sie erneut.','Die Sicherheitskopie kann nicht gespeichert werden. Keine Daten geändert.','Inventar wiederhergestellt','Vorherige Kopie wiederherstellen','Keine vorherige Kopie verfügbar','Datei zu groß (höchstens 10 MB).','Nur Inventarsicherung. Pilotage und Carte haben eine eigene Sicherung.'],
nl:['Deze inventaris herstellen?','Het bestand vervangt deze inventaris. Een vorige kopie blijft op dit apparaat bewaard.','Herstellen','Onbekend bestand of ongeldige aantallen. Geen gegevens gewijzigd.','Het bedrijf of de gegevens zijn gewijzigd. Start het herstel opnieuw.','De veiligheidskopie kan niet worden opgeslagen. Geen gegevens gewijzigd.','Inventaris hersteld','Vorige kopie herstellen','Geen vorige kopie beschikbaar','Bestand te groot (maximaal 10 MB).','Alleen inventarisback-up. Pilotage en Carte hebben hun eigen back-up.'],
pt:['Restaurar este inventário?','O ficheiro substituirá este inventário. Será guardada uma cópia anterior neste dispositivo.','Restaurar','Ficheiro não reconhecido ou quantidades inválidas. Nenhum dado alterado.','O estabelecimento ou os dados mudaram. Reinicie o restauro.','Não é possível guardar a cópia de segurança. Nenhum dado alterado.','Inventário restaurado','Restaurar a cópia anterior','Nenhuma cópia anterior disponível','Ficheiro demasiado grande (máximo 10 MB).','Cópia apenas do Inventário. Pilotage e Carte têm a sua própria cópia.']};
function inventoryRestoreText(i){return (INVENTORY_RESTORE_COPY[document.documentElement.lang]||INVENTORY_RESTORE_COPY.fr)[i];}
function inventoryRestoreValid(o){
  if(!o||typeof o!=='object'||Array.isArray(o)||!o.spaces||typeof o.spaces!=='object'||Array.isArray(o.spaces)||inventoryPayloadIsDemo(o))return false;
  var safe=true;
  function walk(v,depth){if(depth>40){safe=false;return;}if(!v||typeof v!=='object')return;Object.keys(v).forEach(function(k){if(k==='__proto__'||k==='prototype'||k==='constructor'){safe=false;return;}walk(v[k],depth+1);});}
  walk(o,0);if(!safe)return false;
  if(o.schema!=null&&o.schema!==1&&o.schema!==2)return false;
  if(o.schema===2){
    if(!o.sites||!o.meta||!Array.isArray(o.siteList)||!o.siteList.length||new Set(o.siteList).size!==o.siteList.length)return false;
    var assigned=[];
    if(!o.siteList.every(function(k){var st=o.sites[k];return typeof k==='string'&&st&&Array.isArray(st.zones)&&st.zones.length&&st.zones.every(function(z){if(typeof z!=='string'||!o.spaces[z]||!o.meta[z]||o.meta[z].site!==k||assigned.indexOf(z)>=0)return false;assigned.push(z);return true;});}))return false;
    if(Object.keys(o.spaces).some(function(k){return assigned.indexOf(k)<0;}))return false;
  }
  if(['snapshots','priceHistory'].some(function(k){return o[k]!=null&&!Array.isArray(o[k]);}))return false;
  return Object.keys(o.spaces).length>0&&Object.keys(o.spaces).every(function(k){
    var sp=o.spaces[k];if(!sp||!Array.isArray(sp.products)||sp.products.length>5000)return false;var ids=Object.create(null);
    return sp.products.every(function(p){if(!p||typeof p!=='object'||typeof p.id!=='string'||!p.id||p.id.length>96||p.id!==clean(p.id).slice(0,96)||ids[String(p.id)]||typeof p.name!=='string')return false;ids[String(p.id)]=true;
      return ['stock','min','price'].every(function(field){var v=p[field];return v==null||typeof v==='number'&&Number.isFinite(v)&&v>=0;});});
  });
}
function inventoryRestoreScope(){return {key:accountKey(),data:JSON.stringify(DB)};}
function inventoryCommitRestore(candidate,scope){
  if(DEMO||STAFF||!SAVE||!scope||!scope.key||accountKey()!==scope.key||JSON.stringify(DB)!==scope.data){toast(inventoryRestoreText(4));return false;}
  if(!inventoryRestoreValid(candidate)){toast(inventoryRestoreText(3));return false;}
  var old=DB,oldKey=scope.key,copyKey=oldKey+':before-restore-r235',oldCopy,next,copyRead=false;
  try{
    oldCopy=localStorage.getItem(copyKey);copyRead=true;
    /* Migrate a detached object; cleanDB uses DB, restored in finally until the commit succeeds. */
    try{DB=migrate(JSON.parse(JSON.stringify(candidate)));cleanDB();next=DB;['snapshots','priceHistory'].forEach(function(k){if(Array.isArray(candidate[k]))next[k]=JSON.parse(JSON.stringify(candidate[k]));});if(!inventoryRestoreValid(next)||Object.keys(candidate.spaces).some(function(k){return !next.spaces[k]||next.spaces[k].products.length!==candidate.spaces[k].products.length;}))throw new Error('Invalid normalized inventory');}finally{DB=old;}
    localStorage.setItem(copyKey,JSON.stringify({schema:'verdict.inventory.restore.v1',at:new Date().toISOString(),data:old}));
    localStorage.setItem(oldKey,JSON.stringify(next));
  }catch(e){
    try{if(copyRead){if(oldCopy==null)localStorage.removeItem(copyKey);else localStorage.setItem(copyKey,oldCopy);}}catch(ignore){}
    DB=old;toast(inventoryRestoreText(5));return false;
  }
  DB=next;INVENTORY_LAST_SAVE_SIGNATURE='';INVENTORY_LAST_SAVE_PAYLOAD='';save();drawSpaces();setLevel(DB.level||'normale');setSite(DB.site||siteList()[0]);drawProd();drawCount();badge();toast(inventoryRestoreText(6));return true;
}
function inventoryConfirmRestore(candidate,scope){
  if(!inventoryRestoreValid(candidate)){toast(inventoryRestoreText(3));return false;}
  ask(inventoryRestoreText(0),inventoryRestoreText(1),inventoryRestoreText(2),function(){inventoryCommitRestore(candidate,scope);},true);return true;
}
function restore(input){
  var f=input&&input.files&&input.files[0];if(input)input.value='';if(!f||DEMO||STAFF)return;
  if(f.size>10*1024*1024){toast(inventoryRestoreText(9));return;}
  var scope=inventoryRestoreScope(),reader=new FileReader();
  reader.onerror=function(){toast(inventoryRestoreText(3));};
  reader.onload=function(){try{inventoryConfirmRestore(JSON.parse(reader.result),scope);}catch(e){toast(inventoryRestoreText(3));}};
  reader.readAsText(f);
}
function inventoryRestorePrevious(){
  if(DEMO||STAFF)return;try{var scope=inventoryRestoreScope(),copy=JSON.parse(localStorage.getItem(scope.key+':before-restore-r235')||'null');if(!copy||copy.schema!=='verdict.inventory.restore.v1'){toast(inventoryRestoreText(8));return;}inventoryConfirmRestore(copy.data,scope);}catch(e){toast(inventoryRestoreText(3));}
}
function inventoryRestoreControls(){
  var original=document.getElementById('restoreButton');if(!original)return;
  var host=original.parentNode,button=document.getElementById('restorePreviousButton'),note=document.getElementById('inventoryBackupScope');
  if(!button){button=document.createElement('button');button.id='restorePreviousButton';button.className='btn ghost';button.type='button';button.style.cssText='width:100%;margin-top:8px;min-height:44px';button.onclick=inventoryRestorePrevious;host.parentNode.insertBefore(button,host.nextSibling);}
  if(!note){note=document.createElement('p');note.id='inventoryBackupScope';note.className='note';button.parentNode.insertBefore(note,button.nextSibling);}
  button.textContent=inventoryRestoreText(7);note.textContent=inventoryRestoreText(10);button.hidden=note.hidden=DEMO||STAFF;
}
setTimeout(inventoryRestoreControls,0);
new MutationObserver(inventoryRestoreControls).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

/* Le filet tactile commun R10 utilise Pointer Events et ne diffère plus un
   clic de 320 ms. Il est chargé en fin de document. */

/* ---------- d&eacute;marrage ---------- */
setTimeout(function(){ var s=document.getElementById("splash"); if(s&&s.parentNode)s.parentNode.removeChild(s); },1700);
function firstRun(){
  drawSpaces(); setLevel(DB.level||"normale",true); setSite(DB.site||siteList()[0],true); brandSub(); renderGreet();
  if(!(DB.profile&&DB.profile.done)){
    wShow();
    setTimeout(function(){ var w=document.getElementById("welcome"); if(w)w.classList.add("anim"); },180);
    return;
  }
  var total=siteRows(DB.site).length, jamais=true;
  siteRows(DB.site).forEach(function(x){if(x.p.stock!=null)jamais=false;});
  if(!total)go("prod"); else if(jamais&&!DEMO)go("count"); else go("count");
}
DB=blankDB(DEMO);
document.getElementById("today").textContent=new Date().toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
if(STAFF_PROFILE_INCOMPLETE){
  staffRejectIncompleteProfile();
}else if(DEMO){
  authHide(); document.getElementById("whoami").style.display="none"; document.getElementById("demoBanner").classList.add("on");
  document.getElementById("exampleButton").hidden=true; document.getElementById("backupButton").hidden=true; document.getElementById("restoreButton").hidden=true;
  if(STAFF){document.documentElement.classList.add('staff-mode');applyStaffZoneScope();applyStaffPermissions();}
  firstRun();
}else{ drawSpaces(); brandSub(); if(STAFF){document.documentElement.classList.add('staff-mode');document.getElementById('authGate').style.display='none';document.getElementById('whoami').style.display='none';applyStaffPermissions();}authBoot(); }
setTimeout(function(){ var w=document.getElementById("welcome");
  if(w&&w.classList.contains("on")&&DB.profile&&DB.profile.done) w.classList.remove("on"); },45000);
if(!SAVE) toast("Aper\u00e7u : ouvrez la page dans Safari pour garder vos chiffres");
/* C118 : dans un cadre (coquille ou appli Inventaire seule), la page hôte installe le service worker ; seule, l'Inventaire utilise celui de l'appli (../../sw.js), il n'en existe pas dans modules/inventaire/. */
if(navigator.serviceWorker&&!DEMO&&window.parent===window){ window.addEventListener("load",function(){ navigator.serviceWorker.register("../../sw.js").catch(function(){}); }); }

/* ═══════════════════════════════════════════════════════════════════
   ENVOI VERS VERDICT® (V4.78) — on ne transmet QUE le résultat.
   Neuf champs, jamais les références ni les mouvements : l'inventaire reste
   spécialisé, Verdict reste l'analyse. Contrat arrêté avec Steven le 03/08.
   ═══════════════════════════════════════════════════════════════════ */
function vdMois(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function vdValeur(){
  var t=0, n=0, tot=0;
  spList().forEach(function(k){
    ((DB.spaces[k]||{}).products||[]).forEach(function(p){
      tot++;
      var q=num(p.stock), pr=num(p.price);
      if(q!=null&&pr>0){ t+=q*pr; n++; }
    });
  });
  return {eur:Math.round(t*100)/100, n:n, tot:tot};
}
function demandMedian(a){a=(a||[]).filter(function(n){return Number.isFinite(n);}).slice().sort(function(x,y){return x-y;});if(!a.length)return null;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function demandRound(n,d){var p=Math.pow(10,d==null?2:d);return Math.round(n*p)/p;}
function demandDate(s){var d=new Date(String(s||'').slice(0,10)+'T12:00:00');return isNaN(d.getTime())?null:d;}
function demandAddDays(s,n){var d=demandDate(s);if(!d)return'';d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
function demandPlan(payload){
  payload=payload||{};var asOf=String(payload.asOf||new Date().toISOString().slice(0,10)).slice(0,10),defaultH=Math.max(1,Math.min(60,Math.round(Number(payload.horizonDays)||7))),out={version:1,asOf:asOf,generatedAt:new Date().toISOString(),products:[],alerts:[],source:payload.source||'sales-recipes-inventory'};
  (payload.products||[]).forEach(function(p){var obs=(p.observations||[]).map(function(o){return {date:String(o.date||'').slice(0,10),qty:Number(o.qty),exceptional:o.exceptional||'normal',note:o.note||'',source:o.source||''};}).filter(function(o){return demandDate(o.date)&&Number.isFinite(o.qty)&&o.qty>=0&&o.date<=asOf;}),normal=obs.filter(function(o){return o.exceptional!=='event'&&o.exceptional!=='error';}),values=normal.map(function(o){return o.qty;}),med=demandMedian(values),mad=med==null?null:demandMedian(values.map(function(x){return Math.abs(x-med);})),threshold=med==null?Infinity:med+Math.max(2,med*1.5,(mad||0)*4.45),pending=[];
    normal=normal.filter(function(o){if(o.exceptional==='trend')return true;if(o.qty>threshold&&values.length>=7){pending.push({date:o.date,qty:o.qty,question:'event-trend-error-unknown'});return false;}return true;});
    var coverage=Math.max(0,Math.min(1,Number(p.recipeCoverage==null?1:p.recipeCoverage))),lead=Math.max(0,Math.min(60,Math.round(Number(p.leadDays)||0))),review=Math.max(1,Math.min(30,Math.round(Number(p.reviewDays)||defaultH))),horizon=Math.max(defaultH,lead+review),byDay={};normal.forEach(function(o){var d=demandDate(o.date),k=d.getDay();(byDay[k]=byDay[k]||[]).push(o.qty);});var baseAll=demandMedian(normal.map(function(o){return o.qty;})),forecast=0,used=0,openSteps=0;
    for(var i=1;i<=horizon;i++){var dt=demandDate(demandAddDays(asOf,i)),dayInfo=window.VerdictOrdering&&typeof window.VerdictOrdering.calendarDay==='function'?window.VerdictOrdering.calendarDay(payload.calendar||null,dt):{state:'open'},same=byDay[dt.getDay()]||[],v=same.length>=2?demandMedian(same):baseAll;if(dayInfo.state!=='open')continue;openSteps++;if(v!=null){forecast+=v;used++;}}
    var confidence=normal.length>=28&&coverage>=.9?'high':(normal.length>=14&&coverage>=.75?'medium':'low'),ready=normal.length>=7&&coverage>=.5&&used===openSteps,onHand=Math.max(0,Number(p.onHand)||0),onOrder=Math.max(0,Number(p.onOrder)||0),pack=Math.max(.0001,Number(p.packSize)||1),safetyDays=Math.max(0,Math.min(7,Number(p.safetyDays==null?(confidence==='low'?0:1):p.safetyDays))),daily=baseAll||0,safety=daily*safetyDays,raw=Math.max(0,forecast+safety-onHand-onOrder),shelf=Math.max(0,Math.round(Number(p.shelfLifeDays)||0)),maxOrder=null,flags=[];
    if(shelf>0){maxOrder=Math.max(0,daily*shelf+safety-onHand-onOrder);if(raw>maxOrder){raw=maxOrder;flags.push('shelf-life-cap');}}
    var recommended=ready?Math.ceil((raw-1e-9)/pack)*pack:null,minOrder=Math.max(0,Number(p.minOrder)||0);if(recommended!=null&&recommended>0&&minOrder>recommended){if(maxOrder==null||minOrder<=maxOrder)recommended=minOrder;else flags.push('minimum-order-exceeds-usable-need');}
    if(pending.length)flags.push('exception-needs-confirmation');if(!ready)flags.push('insufficient-history-or-recipe-coverage');
    var x={id:p.id||p.name,name:p.name||p.id,unit:p.unit||'',status:ready?'ready':'insufficient',confidence:confidence,observations:obs.length,normalObservations:normal.length,recipeCoverage:demandRound(coverage*100,0),horizonDays:horizon,forecast:demandRound(forecast,3),safety:demandRound(safety,3),target:demandRound(forecast+safety,3),onHand:onHand,onOrder:onOrder,packSize:pack,recommended:recommended==null?null:demandRound(recommended,3),pendingExceptions:pending,flags:flags};out.products.push(x);flags.forEach(function(f){out.alerts.push({product:x.id,kind:f});});
  });return out;
}
function inventoryDemandPayload(){var src=DB.demandBridge&&DB.demandBridge.products||[],by={};src.forEach(function(x){by[x.id]=x;});var products=[],calendar=DB.orderingSettings&&DB.orderingSettings.calendarsBySite&&DB.orderingSettings.calendarsBySite[DB.site]||null;siteRows(DB.site).forEach(function(x){var p=x.p,s=by[p.id]||{},review=s.reviewDays||7;if(window.VerdictOrdering&&p.sup){var ps=DB.suppliersBySite&&DB.suppliersBySite[DB.site]||{},profile=window.VerdictOrdering.profileFor(ps,p.sup),wins=window.VerdictOrdering.nextWindows(profile,new Date(),60,{calendar:calendar});if(wins[0])review=Math.max(1,Math.ceil((window.VerdictOrdering.localDate(wins[0].deliveryAt)-new Date())/86400000));}products.push({id:p.id,name:p.name,unit:p.unit,onHand:p.stock,onOrder:s.onOrder||0,packSize:p.pack||1,minOrder:p.minOrder||0,leadDays:p.leadDays||0,shelfLifeDays:p.shelfLifeDays||0,reviewDays:review,safetyDays:s.safetyDays,recipeCoverage:s.recipeCoverage==null?0:s.recipeCoverage,observations:s.observations||[]});});return {asOf:new Date().toISOString().slice(0,10),horizonDays:7,calendar:calendar,source:'verdict-sales-recipes-open-days',products:products};}
function inventoryDemand(){return demandPlan(inventoryDemandPayload());}
function applyDemandGoal(id,target){var found=null;siteRows(DB.site).some(function(x){if(x.p.id===id){found=x.p;return true;}return false;});if(!found||!(target>=0))return;ask('Remplacer la cible de '+found.name+' ?','Verdict propose '+nb(target)+' '+(found.unit||'')+' à partir de l’historique comparable. La cible ne changera qu’après votre confirmation.','Confirmer la nouvelle cible',function(){found.goal=demandRound(target,2);save();drawStats();toast('Cible confirmée');});}
function vdQualite(v){
  if(!v.tot)return 'rapide';
  var part=v.n/v.tot;
  return part>=1?'complet':(part>=0.8?'standard':'rapide');
}
function vdOperations(){
  try{
    if(typeof window.inventoryOperationsSnapshot==='function')return window.inventoryOperationsSnapshot(DB.site);
    return DB.operationsBySite&&DB.operationsBySite[DB.site]||null;
  }catch(e){return null;}
}
function vdMemoriserOperations(operations){
  if(DEMO||!operations)return;
  try{localStorage.setItem('verdict_inv_operations',JSON.stringify(operations));}catch(e){}
}
function vdResultat(){
  var v=vdValeur();
  if(!v.n)return null;
  var prev=(DB.vdPrecBySite&&DB.vdPrecBySite[DB.site])||null;
  var fp=countFingerprint(DB.site), same=!!(prev&&prev.fingerprint===fp);
  /* Renvoyer deux fois le même comptage ne doit JAMAIS le transformer
     artificiellement en stock initial. On conserve le vrai point précédent. */
  var prec=prev ? (same ? (prev.previousEur!=null?prev.previousEur:null) : (prev.eur!=null?prev.eur:null)) : null;
  var precDate=prev ? (same ? (prev.previousDate||null) : (prev.countedAt||prev.date||null)) : null;
  return {
    version:3,
    demo:!!DEMO,
    siteId:DB.site,
    etablissement:siteName(DB.site),
    date:vdMois(),
    countedAt:new Date().toISOString().slice(0,10),
    stockInitial:prec,
    stockInitialDate:precDate,
    stockFinal:v.eur,
    achats:null,                            /* Verdict conna\u00eet ses achats : il compl\u00e8te */
    consommation:null,
    premierComptage:prec==null,
    qualite:vdQualite(v),
    references:v.n,
    referencesTotal:v.tot,
    couverture:(v.tot?Math.round(v.n/v.tot*100):null),
    fingerprint:fp,
    scopeHash:'INVAPP:'+fp,
    scopedPurchases:false,
    operations:vdOperations()
  };
}
function vdEnvoyer(){
  if(DEMO){vdOuvrirVerdict();return;}
  var operations=vdOperations();vdMemoriserOperations(operations);
  var r=vdResultat();
  if(!r){ info('Liaison opérationnelle prête','Les stocks, fournisseurs, incidents et commandes sont prêts pour Verdict. La valorisation du comptage restera vide tant qu’aucune référence avec prix n’est comptée.'); return; }
  r.operations=operations;
  var j=JSON.stringify(r);
  /* La démo est strictement isolée : ses chiffres fictifs ne doivent jamais
     être repris automatiquement par le vrai Verdict du navigateur. */
  if(!DEMO){ try{ localStorage.setItem('verdict_inv_transfert', j); }catch(e){} }
  try{ var _c=navigator.clipboard&&navigator.clipboard.writeText(j); if(_c&&_c.catch)_c.catch(function(){}); }catch(e){}   /* refus de permission : le texte reste affiché, à copier à la main */
  if(!DB.vdPrecBySite)DB.vdPrecBySite={};
  var old=DB.vdPrecBySite[DB.site];
  if(!old||old.fingerprint!==r.fingerprint){
    DB.vdPrecBySite[DB.site]={eur:r.stockFinal,date:r.date,countedAt:r.countedAt,fingerprint:r.fingerprint,
      previousEur:r.stockInitial,previousDate:r.stockInitialDate};
    save();
  }
  var m=document.getElementById('vdSheet');
  if(m){
    m.querySelector('.vd-val').textContent=r.stockFinal.toLocaleString('fr-FR')+' \u20ac';
    m.querySelector('.vd-ref').textContent=r.references+'/'+r.referencesTotal+' r\u00e9f\u00e9rence'+(r.referencesTotal>1?'s':'')+' valoris\u00e9es \u00b7 '+
      (r.premierComptage?'premier comptage : stock initial encore inconnu':'stock initial = comptage pr\u00e9c\u00e9dent');
    m.querySelector('.vd-json').value=j;
    m.classList.add('on');
  }
}
function vdFermer(){ var m=document.getElementById('vdSheet'); if(m)m.classList.remove('on'); }
function inventoryIsBundled(){var path=String(location.pathname||'');return location.protocol==='file:'||/\/modules\/inventaire(?:\/|$)/.test(path);}
function inventoryVerdictRoutes(){var app=inventoryIsBundled()?'../verdict/verdict-app.html?bridge=inventory':'https://app.verdictchr.fr/?module=verdict&bridge=inventory';return {app:app,account:inventoryIsBundled()?app+'&mode=login':'https://app.verdictchr.fr/account.html?mode=login&return='+encodeURIComponent(app)};}
function vdOuvrirVerdict(tries){
  tries=tries||0;var routes=inventoryVerdictRoutes(),url=routes.app,accountUrl=routes.account;
  if(window.VerdictUnified&&window.VerdictUnified.embedded){try{if(!DEMO)vdMemoriserOperations(vdOperations());}catch(e){}window.VerdictUnified.requestSwitch('verdict',{demo:DEMO,bridge:true,siteId:DB.site||''});return;}
  if(DEMO){location.href='../verdict/verdict-app.html?presentation=brasserie&bridge=inventory&inventory=demo-brasserie';return;}
  vdMemoriserOperations(vdOperations());
  if(!AUTHED||!ACCOUNT_ID){location.href=window.VERDICT_ACCOUNT_PORTAL_READY===true?accountUrl:url;return;}
  if(SYNCING&&tries<12){setTimeout(function(){vdOuvrirVerdict(tries+1);},180);return;}
  clearTimeout(saveT);SYNC_DIRTY=false;SYNCING=true;
  function next(){
    /* Les abonnés et essais actifs passent directement dans Verdict. Un
       compte Inventaire gratuit voit d'abord le choix explicite qui démarre
       ses 14 jours : aucune activation cachée, aucune boucle. */
    var active=ACCOUNT_USER&&ACCOUNT_USER.tier==='pro'&&ACCOUNT_USER.access_state!=='trial_eligible';
    location.href=active||window.VERDICT_ACCOUNT_PORTAL_READY!==true?url:accountUrl;
  }
  api('save',{data:DB,rev:CLOUD_REV}).then(function(r){SYNCING=false;if(r.ok){CLOUD_REV=+r.rev||CLOUD_REV;next();return;}if(r.conflict){syncBadge('⚠ autre appareil',false);info('Inventaire modifié ailleurs','Un autre appareil a modifié cet inventaire. Rechargez-le avant de l’envoyer à Verdict.');return;}next();}).catch(function(){SYNCING=false;/* Le transfert local reste disponible sur le même navigateur. */next();});
}


/* ═══ LE RÉFÉRENTIEL DE PRIX PART AUSSI (V4.79) ═══
   Steven : « pourquoi ressaisir mes prix ? » Exact. Le catalogue produits vit
   ici, parce que c'est ici qu'il est tenu à jour chaque mois. Verdict le
   consomme au lieu de le redemander. Ce n'est pas « les mouvements » : c'est
   le catalogue — nom, unité, fournisseur, prix. */
function vdReferentiel(){
  var out=[];
  spList().forEach(function(k){
    ((DB.spaces[k]||{}).products||[]).forEach(function(p){
      var pr=num(p.price);
      if(!(pr>0))return;
      out.push({nom:p.name, unite:p.unit||'', four:p.sup||'', prix:Math.round(pr*100)/100, espace:spName(k), etablissement:siteName(DB.site)});
    });
  });
  return {version:1, type:'referentiel', demo:!!DEMO, siteId:DB.site, date:vdMois(), n:out.length, produits:out};
}
function vdEnvoyerPrix(){
  if(DEMO){info('Catalogue fictif isolé','Les 51 références sont déjà reliées à la Brasserie fictive dans Verdict. Aucun prix n’est copié vers un dossier réel.');return;}
  var R=vdReferentiel();
  if(!R.n){ info('Aucun prix renseign\u00e9','Renseignez au moins un prix d\u2019achat avant d\u2019envoyer.'); return; }
  var j=JSON.stringify(R);
  if(!DEMO){ try{ localStorage.setItem('verdict_prix_transfert', j); }catch(e){} }
  try{ var _c=navigator.clipboard&&navigator.clipboard.writeText(j); if(_c&&_c.catch)_c.catch(function(){}); }catch(e){}
  var m=document.getElementById('vdSheet');
  if(m){
    m.querySelector('.vd-val').textContent=R.n+' prix';
    m.querySelector('.vd-ref').textContent='catalogue \u00e0 jour \u00b7 ' + R.date;
    m.querySelector('.vd-json').value=j;
    m.classList.add('on');
  }
}

