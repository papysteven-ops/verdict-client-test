/* C39 — Modifications non enregistrées : Verdict détecte un changement (saisie, import, carte, inventaire),
   l'affiche en aperçu et demande « Enregistrer ? Oui / Non » avant de quitter la page, de changer
   d'établissement ou de module. « Non » remet le dossier exactement comme avant la modification.

   Même fichier dans le module Verdict, le module Inventaire et le shell (onglets Pilotage / Carte / Inventaire).
   Aucune donnée n'est envoyée : la photo de référence reste dans la page (et, hors Perso, dans IndexedDB
   le temps qu'une modification attende une réponse, pour la retrouver après une fermeture brutale). */
(function(root){
'use strict';
var doc=root.document;
if(!doc||root.VerdictSaveGuard)return;

var GESTURE_MS=1500;
var IGNORE_FIELDS='[type=search],[data-guard-ignore],#sg13-ask *,#sg13-bar *,.cmp12-sheet *,[id*=search],[id*=Search],[id*=filtre],[id*=Filtre],[id*=recherche],[id*=query],#ntfCenter *,.ntf-center *';
var COMMIT_BUTTON=/enregistr|valider|confirmer|appliquer|terminer|importer ces|ajouter au/i;
var EXPLICIT_REASON=/^(etab-lien|fec-import|recent-apply|ref-valider|create-establishment|archive-establishment|restore-establishment|delete-archived-establishment|duplicate-establishment|bar-visibility|restore|file-restore|load-demo|reset-establishment|demo-|sg13-|switch)/;
var LABELS_VERDICT={etab:'Nom de l’établissement',etabVille:'Ville',etabQuartier:'Arrondissement / quartier',etabType:'Type d’établissement',
  plats:'Carte et recettes',ing:'Ingrédients',preparations:'Préparations',supp:'Suppléments',reg:'Réglages de la carte',histJour:'Saisies du jour',
  achats:'Achats',suivi:'Suivi mensuel',monthlyHistory:'Historique mensuel',establishmentProfile:'Profil de l’établissement',services:'Services',
  inv:'Inventaire',salaries:'Équipe',equipe:'Équipe',objectifs:'Objectifs',obj:'Objectifs',planning:'Planning',businessDayEndHour:'Heure de fin de journée'};
var LABELS_INVENTORY={spaces:'Produits et comptages',meta:'Zones',sites:'Sites',siteList:'Sites',profile:'Profil',snapshots:'Inventaires enregistrés',
  priceHistory:'Prix',purchaseOrders:'Commandes',needs:'Besoins',orderingSettings:'Réglages des commandes',suppliersBySite:'Fournisseurs',
  supplyIncidents:'Incidents fournisseurs',countAudit:'Produits et comptages',level:'Niveau d’activité',space:'Zone affichée',site:'Site affiché'};

var DERIVED={cpCostWatch:1,cpCostLog:1,cpDishHistory:1,cpMemoryDishes:1,operationsBySite:1,performancePlans:1,performanceYearPlans:1,performanceAccountingAnchors:1,performanceTrackingStartedAt:1,businessTimezone:1,veraUpdatedAt:1,_safety:1,generatedAt:1,fingerprint:1};
var S={mode:'',editAt:0,base:null,baseFull:null,baseId:null,stale:true,touched:false,busy:0,bypass:0,gestureAt:0,commitClickAt:0,asking:null,barTimer:0};

/* ───────── Adaptateurs : où sont les données, comment les remettre ───────── */
function detect(){
  if(typeof root.setActif==='function'&&typeof root.fillInputs==='function'&&root.STORE&&root.STORE.etabs)return 'verdict';
  if(typeof root.setSpace==='function'&&typeof root.setSite==='function'&&root.DB&&root.DB.spaces)return 'inventory';
  if(doc.querySelector('[data-module][role=tab]'))return 'shell';
  return '';
}
function data(){
  if(S.mode==='verdict'){var st=root.STORE;return st&&st.actif?st.etabs[st.actif]:null;}
  if(S.mode==='inventory')return root.DB||null;
  return null;
}
function activeId(){return S.mode==='verdict'?(root.STORE&&root.STORE.actif)||null:'inventory';}
/* Signature métier : ignore les preuves de sauvegarde et les valeurs vides créées à l'affichage
   ({} / [] / null), pour qu'aucune alerte n'apparaisse sans vraie modification. */
/* Vide « en profondeur » : {}, [], null, '' et tout objet ou tableau ne contenant que du vide. */
function isEmpty(v,d){d=d||0;if(v==null||v==='')return true;if(d>8||typeof v!=='object')return false;
  if(Array.isArray(v)){for(var i=0;i<v.length;i++)if(!isEmpty(v[i],d+1))return false;return true;}
  for(var k in v)if(Object.prototype.hasOwnProperty.call(v,k)&&!DERIVED[k]&&!isEmpty(v[k],d+1))return false;return true;}
function sigOf(o){
  if(!o)return '';
  try{return JSON.stringify(o,function(key,value){
    if(DERIVED[key]===1||key==='updatedAt'&&this&&this.localRev!=null)return undefined;
    if(key!==''&&isEmpty(value))return undefined;
    return value;
  });}catch(e){return '';}
}
function rebase(){
  var o=data();
  S.base=sigOf(o);try{S.baseFull=o?JSON.stringify(o):null;}catch(e){S.baseFull=null;}
  S.baseId=activeId();S.stale=false;S.touched=false;
  hideBar();forgetRecovery();
}
function ensureBase(){if(S.stale&&!S.touched)rebase();}
function pending(){
  if(!S.touched)return false;
  if(activeId()!==S.baseId){S.touched=false;S.stale=true;hideBar();return false;}
  if(sigOf(data())===S.base){S.touched=false;hideBar();forgetRecovery();return false;}
  return true;
}

/* ───────── Ce qui a changé, en clair ───────── */
function fieldLabel(k){
  if(k==='amort')return 'Amortissements';
  try{if(root.FIX_LABELS&&root.FIX_LABELS[k])return String(root.FIX_LABELS[k]).replace(/&amp;/g,'&').replace(/&nbsp;/g,'\u00a0').replace(/&rsquo;/g,'’');}catch(e){}
  var el=doc.getElementById('i-'+k),lab=el&&(el.closest('label')||doc.querySelector('label[for="i-'+k+'"]'));
  if(lab){var t='';for(var n=lab.firstChild;n;n=n.nextSibling){if(n.nodeType===3)t+=n.nodeValue;else if(n.nodeType===1&&!/INPUT|SELECT|TEXTAREA/.test(n.tagName))t+=n.textContent;if(t.trim().length>2&&n.nodeType===1)break;}
    t=t.replace(/\s+/g,' ').trim();if(t)return t.length>48?t.slice(0,46)+'…':t;}
  return k;
}
function changedLabels(){
  var out=[],seen={};function add(t){if(t&&!seen[t]){seen[t]=1;out.push(t);}}
  var before;try{before=JSON.parse(S.baseFull||'null')||{};}catch(e){before={};}
  var now=data()||{},keys={};Object.keys(before).forEach(function(k){keys[k]=1;});Object.keys(now).forEach(function(k){keys[k]=1;});
  Object.keys(keys).forEach(function(k){
    if(DERIVED[k]===1||k==='maj'||sigOf({v:before[k]})===sigOf({v:now[k]}))return;
    if(S.mode==='verdict'&&k==='in'&&before.in&&now.in){
      var sub={};Object.keys(before.in).concat(Object.keys(now.in)).forEach(function(x){sub[x]=1;});
      Object.keys(sub).forEach(function(x){if(sigOf({v:before.in[x]})!==sigOf({v:now.in[x]}))add(fieldLabel(x));});return;
    }
    var L=S.mode==='verdict'?LABELS_VERDICT:LABELS_INVENTORY;add(L[k]||(S.mode==='inventory'?'Inventaire':'Autres informations'));
  });
  return out;
}
function summary(list){if(!list.length)return '';return list.length<=3?list.join(', '):list.slice(0,3).join(', ')+' et '+(list.length-3)+' autre'+(list.length-3>1?'s':'');}

/* ───────── Formulaires en fiche (plat, ingrédient, achat…) : la saisie n'entre dans le dossier
   qu'avec le bouton « Enregistrer » de la fiche. Verdict retient la valeur de chaque champ à son
   ouverture ; fermer ou quitter avec une valeur changée déclenche la même demande. ───────── */
var F={sheet:null,modal:false,fields:[],structural:false,obs:null};
function visible(e){try{if(!e||!e.isConnected)return false;var cs=root.getComputedStyle(e);return cs.display!=='none'&&cs.visibility!=='hidden'&&e.getClientRects().length>0;}catch(x){return false;}}
function sheetOf(t){var s=t&&t.closest&&t.closest('.sheet,[role=dialog]');if(!s||s.id==='sg13-ask'||s.closest('#sg13-ask'))return null;return s;}
function saveBtnOf(sheet){
  var bs=[].slice.call(sheet.querySelectorAll('button')).filter(visible),txt=function(b){return (b.textContent||'').replace(/\s+/g,' ').trim();};
  var exact=bs.filter(function(b){return /^enregistrer\b/i.test(txt(b));});
  if(exact.length)return exact[exact.length-1];
  var other=bs.filter(function(b){return /^(valider|confirmer|cr\u00e9er|enregistrer|ajouter (\u00e0|a|au|aux|ce|cette|cet|l|le|la|les)(\s|$|'))/i.test(txt(b));});
  return other.length?other[other.length-1]:null;
}
function valueOf(e){if(e.type==='checkbox'||e.type==='radio')return String(e.checked);var v=String(e.value==null?'':e.value).replace(/[\s\u00a0\u202f]+/g,' ').trim();
  if(/^-?[\d ]+([.,]\d+)?$/.test(v)){var n=Number(v.replace(/ /g,'').replace(',','.'));if(isFinite(n))return 'n:'+n;}return v;}
function formReset(){if(F.obs){try{F.obs.disconnect();}catch(e){}F.obs=null;}F.sheet=null;F.modal=false;F.fields=[];F.structural=false;}
/* Formulaire d'un champ : la fiche (modale) qui le contient, ou le bloc de page qui porte son bouton
   « Enregistrer / Créer / Ajouter à… ». Les champs « Mes informations » (i-…) s'enregistrent déjà
   dans le dossier : la comparaison du dossier les suit. */
function formHostOf(t){
  var sh=sheetOf(t);if(sh)return saveBtnOf(sh)?{el:sh,modal:true}:null;
  if(!t||/^i-/.test(t.id||''))return null;
  /* Réglage d'affichage (année, filtre, tri, période) : jamais une saisie. */
  var h=(t.getAttribute&&((t.getAttribute('onchange')||'')+(t.getAttribute('oninput')||'')))||'';
  if(/draw|render|filtr|filter|YEAR|sort|tri\(|periode|period/i.test(h))return null;
  for(var a=t.parentElement,i=0;a&&i<8;a=a.parentElement,i++){
    if(a===doc.body||(a.classList&&a.classList.contains('view')))break;
    if(saveBtnOf(a))return {el:a,modal:false};
  }
  return null;
}
/* La fiche est oubliée dès qu'elle se ferme (y compris après son animation) ou qu'elle est redessinée. */
function formWatch(sh){
  if(!root.MutationObserver||!sh)return;var host=sh.parentNode||sh,check=function(){if(F.sheet===sh&&!visible(sh))formReset();};
  F.obs=new root.MutationObserver(function(){check();setTimeout(check,450);});
  try{F.obs.observe(host,{attributes:true,attributeFilter:['class','style','hidden','open']});if(host.parentNode)F.obs.observe(host.parentNode,{childList:true});F.obs.observe(sh,{attributes:true,attributeFilter:['class','style','hidden']});}catch(e){}
}
function formDirty(){
  if(!F.sheet)return false;
  if(!visible(F.sheet)){formReset();return false;}
  if(F.structural)return true;
  return F.fields.some(function(x){return x.el.isConnected&&F.sheet.contains(x.el)&&valueOf(x.el)!==x.v;});
}
function formTitle(){var h=F.sheet&&F.sheet.querySelector('h2,h3,h4');var t=h?h.textContent.replace(/\s+/g,' ').trim().replace(/^(modifier|nouveau|nouvelle|ajouter|\u00e9diter)\s*[\u2014\u2013:-]\s*/i,''):'';var kind=F.modal?'Fiche':'Formulaire';return t?kind+' « '+(t.length>60?t.slice(0,58)+'\u2026':t)+' »':kind+' en cours de saisie';}
function trackField(t){
  var h=formHostOf(t);if(!h)return;var sh=h.el;
  if(F.sheet!==sh){formReset();F.sheet=sh;F.modal=h.modal;formWatch(sh);}
  for(var i=0;i<F.fields.length;i++)if(F.fields[i].el===t)return;
  F.fields.push({el:t,v:valueOf(t)});
}
function isCloseBtn(b){
  var t=(b.textContent||'').replace(/\s+/g,' ').trim(),a=(b.getAttribute('aria-label')||'')+' '+(b.getAttribute('title')||''),oc=b.getAttribute('onclick')||'';
  if(/removeChild|del|suppr|retir/i.test(oc))return false;
  return /^(\u2715|\u00d7|x|annuler|fermer|retour)$/i.test(t)||/fermer|close/i.test(a)||/closeM\(|close[A-Z]\w*\(/.test(oc);
}
function structuralBtn(b){
  var oc=b.getAttribute('onclick')||'',t=(b.textContent||'').trim();
  if(/setDishMode|Mode\(/.test(oc))return false;
  return b.hasAttribute('aria-checked')||b.hasAttribute('aria-pressed')||/removeChild|add[A-Z]\w*\(|del[A-Z]?\w*\(|suppr|retir/i.test(oc)||/^\+/.test(t);
}
/* « Oui » sur une fiche : son propre bouton Enregistrer fait foi (contrôles de saisie compris). Les valeurs
   deviennent la nouvelle référence ; si la fiche reste ouverte (champ refusé), la saisie reste suivie. */
/* La réussite se constate : la fiche s'est fermée, ou le dossier a changé. Sinon (champ obligatoire
   manquant, valeur refusée), la saisie reste en place et la navigation demandée n'a pas lieu. */
function formSave(done){
  var sh=F.sheet,b=sh&&saveBtnOf(sh);if(!b){if(done)done(false);return false;}
  var before=sigOf(data()),keep=F.fields.map(function(x){return x.v;}),structural=F.structural;
  S.commitClickAt=Date.now();S.bypass++;try{b.click();}finally{S.bypass--;}
  F.fields.forEach(function(x){if(x.el.isConnected)x.v=valueOf(x.el);});F.structural=false;
  setTimeout(function(){
    var ok=!visible(sh)||sigOf(data())!==before;
    if(ok){if(F.sheet===sh&&!visible(sh))formReset();if(!pending())rebase();}
    else{if(F.sheet===sh){F.fields.forEach(function(x,i){x.v=keep[i];});F.structural=structural;}toast('Pas encore enregistr\u00e9 : compl\u00e9tez les champs demand\u00e9s, puis enregistrez.');}
    if(done)done(ok);
  },450);
  return true;
}
function formClose(){
  var sh=F.sheet;formReset();if(!sh||!visible(sh))return;
  var c=[].slice.call(sh.querySelectorAll('button')).filter(function(b){return visible(b)&&isCloseBtn(b);})[0];
  S.bypass++;try{if(c)c.click();else if(sh.parentNode&&sh.parentNode.click)sh.parentNode.click();}finally{S.bypass--;}
}
function onFormClick(e){
  if(!trusted(e)||S.bypass||S.asking)return;
  var t=e.target;if(!t||!t.closest)return;
  var b=t.closest('button,[role=button]'),sh=sheetOf(t);
  if(F.sheet&&!F.modal&&F.sheet.contains(t))sh=F.sheet;
  if(F.sheet&&b&&sh===F.sheet&&!isCloseBtn(b)&&structuralBtn(b)){F.structural=true;return;}
  if(!F.sheet&&b&&sh&&saveBtnOf(sh)&&structuralBtn(b)){F.sheet=sh;F.modal=true;F.fields=[];F.structural=true;formWatch(sh);return;}
  /* Formulaire intégré à une page : tout bouton hors du formulaire (Retour, onglets, autre écran) le quitte. */
  if(F.sheet&&!F.modal&&b&&!F.sheet.contains(b)&&formDirty()){
    e.preventDefault();e.stopImmediatePropagation();
    ask(function(){},{form:true,onYes:function(){formSave(function(ok){if(ok&&b.isConnected&&visible(b)){S.bypass++;try{b.click();}finally{S.bypass--;}}});},onDiscard:function(){formReset();S.bypass++;try{b.click();}finally{S.bypass--;}}});
    return;
  }
  var closing=(b&&sh&&sh===F.sheet&&isCloseBtn(b))||(F.sheet&&F.modal&&t===F.sheet.parentNode);
  if(!closing||!formDirty())return;
  e.preventDefault();e.stopImmediatePropagation();
  var target=b||t;
  ask(function(){},{form:true,onYes:function(){formSave();},onDiscard:function(){formReset();S.bypass++;try{target.click();}finally{S.bypass--;}}});
}
function anyPending(){return formDirty()||pending();}

/* ───────── Enregistrer / ne pas enregistrer ───────── */
function appSave(reason){S.busy++;try{if(typeof root.save==='function')root.save(reason);}catch(e){}finally{S.busy--;}}
function commit(silent){
  if(!S.mode||S.mode==='shell')return;
  appSave('sg13-confirm-changes');
  S.busy++;try{if(S.mode==='verdict'&&typeof root.refreshAll==='function')root.refreshAll();}catch(e){}finally{S.busy--;}
  rebase();
  if(!silent)toast(S.mode==='inventory'?'Modifications enregistrées':'Modifications enregistrées · Verdict a recalculé');
}
function discard(silent){
  if(!S.mode||S.mode==='shell'||!S.baseFull)return;
  var copy;try{copy=JSON.parse(S.baseFull);}catch(e){return;}
  S.busy++;S.bypass++;
  try{
    if(S.mode==='verdict'){
      var id=S.baseId;if(!root.STORE.etabs[id])return;
      root.STORE.etabs[id]=copy;root.setActif(id);
      if(typeof root.verdictInvalidateViews==='function')try{root.verdictInvalidateViews();}catch(e){}
      appSave('sg13-discard-changes');
      try{root.fillInputs();}catch(e){}try{if(typeof root.readInputs==='function')root.readInputs();}catch(e){}
      try{if(typeof root.drawEtabs==='function')root.drawEtabs();}catch(e){}try{if(typeof root.refreshAll==='function')root.refreshAll();}catch(e){}
    }else{
      root.DB=copy;appSave(false);
      try{if(typeof root.inventoryInvalidateViews==='function')root.inventoryInvalidateViews();}catch(e){}
      try{if(typeof root.go==='function'&&root.VIEW)root.go(root.VIEW);}catch(e){}
    }
  }finally{S.busy--;S.bypass--;}
  rebase();
  if(!silent)toast('Modifications annulées · le dossier est revenu à son état enregistré');
}
function toast(m){try{if(typeof root.toast==='function')root.toast(m);}catch(e){}}

/* ───────── Interface : barre d'aperçu + demande Oui / Non ───────── */
function css(){
  if(doc.getElementById('sg13-css'))return;
  var st=doc.createElement('style');st.id='sg13-css';
  st.textContent=
  '#sg13-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 104px);z-index:2147482000;width:min(560px,calc(100% - 24px));box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:10px 10px 10px 14px;border-radius:18px;background:#fff8e6;color:#3d2c00;border:1.5px solid #e5b53b;box-shadow:0 10px 30px rgba(0,0,0,.18);font:600 13.5px/1.3 -apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif}'+
  '#sg13-bar .sg13-t{flex:1;min-width:0}#sg13-bar .sg13-t b{display:block;font-size:14px}#sg13-bar .sg13-t span{display:block;font-weight:500;font-size:12.5px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
  '#sg13-bar button,#sg13-ask button{font:700 14px/1 -apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif;border-radius:12px;padding:11px 14px;cursor:pointer;border:1.5px solid transparent;min-height:44px}'+
  '#sg13-bar .sg13-yes,#sg13-ask .sg13-yes{background:#16a34a!important;color:#fff!important;border-color:#16a34a!important;box-shadow:none!important}#sg13-bar .sg13-no,#sg13-ask .sg13-no{background:#fff!important;color:#b42318!important;border-color:#f1b3ad!important;box-shadow:none!important}#sg13-ask .sg13-stay{background:transparent!important;color:inherit!important;border-color:transparent!important;opacity:.75;text-decoration:underline;box-shadow:none!important}'+
  '#sg13-ask{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,14,20,.45);padding:12px;box-sizing:border-box}'+
  '@media(min-width:700px){#sg13-ask{align-items:center}}'+
  '#sg13-ask .sg13-card{width:min(480px,100%);background:#fff;color:#111827;border-radius:22px;padding:20px 18px calc(16px + env(safe-area-inset-bottom,0px));box-shadow:0 20px 60px rgba(0,0,0,.3);font:500 15px/1.45 -apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif;animation:sg13in .22s ease-out}'+
  '#sg13-ask h3{margin:0 0 6px;font-size:19px;font-weight:800}#sg13-ask p{margin:0 0 6px}#sg13-ask .sg13-list{margin:8px 0 14px;padding:10px 12px;border-radius:12px;background:#fff8e6;border:1px solid #f3d27a;color:#3d2c00;font-weight:600;font-size:14px}'+
  '#sg13-ask .sg13-btns{display:flex;flex-direction:column;gap:8px}#sg13-ask .sg13-btns button{width:100%}'+
  '@keyframes sg13in{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}'+
  /* Certains écrans (démarrage verrouillé) masquent le reste de la page : la demande reste toujours lisible et cliquable. */
  '#sg13-ask#sg13-ask,#sg13-ask#sg13-ask *,#sg13-bar#sg13-bar,#sg13-bar#sg13-bar *{visibility:visible!important;pointer-events:auto!important}'+
  'html.vd-workspace-dark #sg13-ask .sg13-card,html[data-theme=dark] #sg13-ask .sg13-card{background:#161b22;color:#e6edf3}'+
  'html.vd-workspace-dark #sg13-bar,html[data-theme=dark] #sg13-bar,html.vd-workspace-dark #sg13-ask .sg13-list,html[data-theme=dark] #sg13-ask .sg13-list{background:#2b2108;color:#ffe2a1;border-color:#8a6a1c}'+
  'html.vd-workspace-dark #sg13-ask .sg13-no,html[data-theme=dark] #sg13-ask .sg13-no,html.vd-workspace-dark #sg13-bar .sg13-no,html[data-theme=dark] #sg13-bar .sg13-no{background:#1f1214!important;color:#ff8f86!important}';
  (doc.head||doc.documentElement).appendChild(st);
}
function el(tag,cls,txt){var e=doc.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function showBar(){
  if(!doc.body)return;css();
  var list=changedLabels();if(!list.length){hideBar();return;}
  var bar=doc.getElementById('sg13-bar');
  if(!bar){
    bar=el('div');bar.id='sg13-bar';bar.setAttribute('role','status');bar.setAttribute('data-guard-ignore','1');
    var t=el('div','sg13-t');t.appendChild(el('b',null,'Modifications non enregistrées'));t.appendChild(el('span'));
    var no=el('button','sg13-no','Annuler'),yes=el('button','sg13-yes','Enregistrer');no.type=yes.type='button';
    no.addEventListener('click',function(){discard(false);});yes.addEventListener('click',function(){commit(false);});
    bar.appendChild(t);bar.appendChild(no);bar.appendChild(yes);doc.body.appendChild(bar);
  }
  var span=bar.querySelector('.sg13-t span'),txt=(S.mode==='inventory'?'':'Calculs en aperçu · ')+summary(list);
  if(span.textContent!==txt)span.textContent=txt;
}
function hideBar(){var b=doc.getElementById('sg13-bar');if(b)b.remove();}
function scheduleBar(){clearTimeout(S.barTimer);S.barTimer=setTimeout(function(){if(pending()){showBar();rememberRecovery();}else hideBar();},220);}

/* Demande « Enregistrer ? » ; then() poursuit l'action interrompue après la réponse. */
function ask(then,opts){
  opts=opts||{};
  if(S.asking)return false;
  var list=opts.labels||(pending()?changedLabels():[]);if(!opts.labels&&formDirty())list=[formTitle()].concat(list);
  if(!list.length&&!opts.recovery&&!opts.form){S.touched=false;hideBar();if(then)then();return true;}
  css();var wrap=el('div');wrap.id='sg13-ask';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('data-guard-ignore','1');
  var card=el('div','sg13-card');
  card.appendChild(el('h3',null,opts.recovery?'Modifications retrouvées':'Enregistrer vos modifications ?'));
  card.appendChild(el('p',null,opts.recovery?'Lors de votre dernière visite, ces modifications n’avaient pas été enregistrées :':'Vous avez modifié :'));
  card.appendChild(el('div','sg13-list',list.length?list.join(' · '):'des informations de ce dossier'));
  card.appendChild(el('p',null,S.mode==='inventory'?'Elles ne seront gardées qu’une fois enregistrées.':'Verdict ne les prend en compte dans ses calculs qu’une fois enregistrées.'));
  var btns=el('div','sg13-btns'),yes=el('button','sg13-yes','Oui, enregistrer'),no=el('button','sg13-no','Non, annuler les modifications');
  yes.type=no.type='button';btns.appendChild(yes);btns.appendChild(no);
  var stay=null;if(!opts.recovery){stay=el('button','sg13-stay','Rester sur la page');stay.type='button';btns.appendChild(stay);}
  card.appendChild(btns);wrap.appendChild(card);
  function close(){S.asking=null;wrap.remove();}
  function go(fn){close();try{fn();}catch(e){}if(then){S.bypass++;try{then();}finally{S.bypass--;}}}
  yes.addEventListener('click',function(){if(opts.onYes){close();opts.onYes();return;}if(formDirty()){close();formSave(function(ok){if(!ok)return;if(pending())commit(true);if(then){S.bypass++;try{then();}finally{S.bypass--;}}});return;}go(function(){commit(false);});});
  no.addEventListener('click',function(){if(opts.onDiscard){close();opts.onDiscard();return;}go(function(){if(formDirty())formClose();if(pending())discard(false);else{S.touched=false;hideBar();}});});
  if(stay)stay.addEventListener('click',function(){close();});
  wrap.addEventListener('click',function(e){if(e.target===wrap&&stay)close();});
  doc.body.appendChild(wrap);S.asking=wrap;setTimeout(function(){try{yes.focus();}catch(e){}},30);
  return false;
}

/* ───────── Détection des gestes et des saisies ───────── */
function trusted(e){return e&&e.isTrusted!==false;}
function ignoredTarget(t){try{return !t||!t.closest||!!t.closest(IGNORE_FIELDS)||!!(t.closest('#sg13-ask')||t.closest('#sg13-bar'));}catch(e){return true;}}
function isField(t){return t&&(/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)||t.isContentEditable);}
function onGesture(e){
  if(!trusted(e))return;
  var t=e.target;if(t&&t.closest&&(t.closest('#sg13-ask')||t.closest('#sg13-bar')))return;
  S.gestureAt=Date.now();ensureBase();if(e.type==='pointerdown')wrapAll();
  if(e.type==='pointerdown'||e.type==='click'){var ch=t&&t.closest&&t.closest('[aria-checked],[role=radio],[role=option],[role=switch],[role=checkbox],[role=menuitemradio]');if(ch&&!ignoredTarget(ch))S.editAt=Date.now();}
  if(e.type==='click'){var b=t&&t.closest&&t.closest('button,[role=button],a');if(b&&(COMMIT_BUTTON.test((b.textContent||'')+' '+(b.getAttribute('aria-label')||''))||(b.closest&&b.closest('#welcome'))))S.commitClickAt=Date.now(); /* C116 : l'accueil de l'Inventaire (Continuer, Entrer) enregistre */}
}
function onFocus(e){if(!trusted(e)||!S.mode||S.mode==='shell')return;var t=e.target;if(isField(t)&&!ignoredTarget(t))trackField(t);}
function onEdit(e){
  if(!trusted(e)||!S.mode||S.mode==='shell')return;
  var t=e.target;if(!isField(t)||ignoredTarget(t))return;
  if(t.type==='file'&&e.type==='input')return;
  trackField(t);
  ensureBase();S.gestureAt=S.editAt=Date.now();
  if(t.type==='file'&&t.files&&t.files.length)S.importUntil=Date.now()+60000;
  if(!S.touched){S.touched=true;S.baseId=S.baseId||activeId();}
  scheduleBar();
}
function gestureRecent(){return Date.now()-S.gestureAt<GESTURE_MS;}
function editRecent(){return Date.now()-S.editAt<GESTURE_MS||Date.now()<(S.importUntil||0);}

/* Chaque save() de l'application : modification utilisateur (aperçu en attente) ou opération du programme
   (la photo de référence suit). Un bouton « Enregistrer / Valider… » vaut confirmation. */
function wrapSave(){
  var orig=root.save;if(typeof orig!=='function'||orig.__sg13)return;
  var w=function(reason){
    var r=orig.apply(this,arguments);
    if(S.busy)return r;
    var why=typeof reason==='string'?reason:'';
    if(EXPLICIT_REASON.test(why)){S.touched=false;S.stale=true;hideBar();forgetRecovery();return r;}
    if(gestureRecent()||Date.now()<(S.importUntil||0)){
      if(Date.now()-S.commitClickAt<GESTURE_MS){setTimeout(function(){if(!formDirty())rebase();},0);return r;}
      if(!editRecent()){if(!S.touched)S.stale=true;return r;}
      if(!S.touched){S.touched=true;}
      scheduleBar();
    }else if(!S.touched)S.stale=true;
    return r;
  };
  w.__sg13=true;w.__orig=orig;root.save=w;
}
/* Navigation : la demande s'intercale avant de quitter la page en cours. */
function guardFn(name,shouldAsk){
  var orig=root[name];if(typeof orig!=='function'||orig.__sg13)return;
  var w=function(){
    var self=this,args=arguments;
    if(!S.bypass&&!S.asking&&shouldAsk.apply(null,args)&&anyPending()){
      ask(function(){orig.apply(self,args);});
      return false;
    }
    if(S.asking&&!S.bypass&&shouldAsk.apply(null,args))return false;
    S.bypass++;try{return orig.apply(self,args);}finally{S.bypass--;}
  };
  w.__sg13=true;w.__orig=orig;root[name]=w;
}

/* ───────── Fermeture brutale : retrouver la modification au prochain lancement ───────── */
var IDB_NAME='verdict-save-guard-a13',IDB_STORE='pending';
/* Démonstration : rien à retrouver (Verdict : VERDICT_DEMO_SESSION ; Inventaire : DEMO === true). */
function recoveryEnabled(){if(!S.mode||S.mode==='shell'||!root.indexedDB||root.VERDICT_PERSO===true)return false;return S.mode==='verdict'?!root.VERDICT_DEMO_SESSION:root.DEMO!==true;}
function idb(fn){try{var rq=root.indexedDB.open(IDB_NAME,1);rq.onupgradeneeded=function(){rq.result.createObjectStore(IDB_STORE);};rq.onsuccess=function(){try{fn(rq.result);}catch(e){}};}catch(e){}}
function rememberRecovery(){
  if(!recoveryEnabled()||!S.baseFull)return;
  var rec={mode:S.mode,id:S.baseId,base:S.baseFull,sig:S.base,labels:changedLabels(),at:new Date().toISOString(),v:1};
  idb(function(db){var tx=db.transaction(IDB_STORE,'readwrite');tx.objectStore(IDB_STORE).put(rec,S.mode);});
}
/* Tant que la reprise n'a pas été proposée, la copie de secours du lancement précédent est conservée. */
function forgetRecovery(){if(!recoveryEnabled()||!S.recoveryChecked)return;idb(function(db){var tx=db.transaction(IDB_STORE,'readwrite');tx.objectStore(IDB_STORE).delete(S.mode);});}
function checkRecovery(tries){
  tries=tries==null?24:tries;
  if(!recoveryEnabled()){S.recoveryChecked=true;return;}
  idb(function(db){
    var rq=db.transaction(IDB_STORE,'readonly').objectStore(IDB_STORE).get(S.mode);
    rq.onerror=function(){S.recoveryChecked=true;};
    rq.onsuccess=function(){
      var rec=rq.result;if(!rec||rec.mode!==S.mode){S.recoveryChecked=true;return;}
      /* Le dossier se charge parfois après ce module : on patiente avant de conclure. */
      if(S.mode==='verdict'&&(!root.STORE||!root.STORE.etabs[rec.id]||root.STORE.actif!==rec.id)){if(tries>0){setTimeout(function(){checkRecovery(tries-1);},500);return;}S.recoveryChecked=true;return forgetRecovery();}
      S.recoveryChecked=true;
      if(sigOf(data())===rec.sig)return forgetRecovery();
      S.baseFull=rec.base;S.base=rec.sig;S.baseId=rec.id;S.touched=true;S.stale=false;
      ask(null,{recovery:true,labels:rec.labels||[]});
    };
  });
}

/* ───────── Shell : onglets Pilotage / Carte / Inventaire ───────── */
function frameGuards(){
  var out=[];[].forEach.call(doc.querySelectorAll('iframe'),function(f){try{var g=f.contentWindow&&f.contentWindow.VerdictSaveGuard;if(g&&g.mode()!=='shell')out.push({frame:f,guard:g});}catch(e){}});
  return out;
}
function installShell(){
  doc.addEventListener('click',function(e){
    if(!trusted(e)||S.bypass)return;
    var b=e.target&&e.target.closest&&e.target.closest('[data-module][role=tab]');if(!b||b.getAttribute('aria-selected')==='true')return;
    var hit=frameGuards().filter(function(x){return x.frame.offsetParent!==null&&x.guard.pending();})[0];
    if(!hit)return;
    e.preventDefault();e.stopImmediatePropagation();
    hit.guard.ask(function(){S.bypass++;try{b.click();}finally{S.bypass--;}});
  },true);
  root.addEventListener('beforeunload',function(e){if(frameGuards().some(function(x){return x.guard.pending();})){e.preventDefault();e.returnValue='';return '';}});
}

/* ───────── Installation ───────── */
/* Certains scripts remplacent go() ou save() après le démarrage : la protection est reposée au besoin. */
function wrapAll(){
  wrapSave();
  guardFn('go',function(v){return gestureRecent()&&v!==root.VIEW;});
  if(S.mode==='verdict'){
    guardFn('switchEtab',function(id){return id!==(root.STORE&&root.STORE.actif);});
    guardFn('openNewEtab',function(){return true;});
    guardFn('verdictNewEtabChooser',function(){return true;});
  }else guardFn('setSite',function(s){return root.DB&&s!==root.DB.site;});
}
function install(){
  S.mode=detect();
  if(!S.mode)return false;
  if(S.mode==='shell'){installShell();return true;}
  wrapAll();setTimeout(wrapAll,1500);setTimeout(wrapAll,5000);
  ['pointerdown','click','keydown'].forEach(function(t){doc.addEventListener(t,onGesture,true);});
  ['input','change'].forEach(function(t){doc.addEventListener(t,onEdit,true);});
  doc.addEventListener('focusin',onFocus,true);doc.addEventListener('click',onFormClick,true);
  root.addEventListener('beforeunload',function(e){if(anyPending()){if(pending())rememberRecovery();e.preventDefault();e.returnValue='';return '';}});
  root.addEventListener('pagehide',function(){if(pending())rememberRecovery();});
  doc.addEventListener('visibilitychange',function(){if(doc.visibilityState==='hidden'&&pending())rememberRecovery();});
  rebase();
  setTimeout(checkRecovery,1200);
  return true;
}

root.VerdictSaveGuard={
  mode:function(){return S.mode;},
  pending:function(){return anyPending();},
  changes:function(){var l=pending()?changedLabels():[];return formDirty()?[formTitle()].concat(l):l;},
  ask:function(then){if(!anyPending()){if(then)then();return true;}return ask(then);},
  commit:function(){commit(false);},
  discard:function(){discard(false);},
  rebase:rebase,
  _state:S,_sig:sigOf,_value:valueOf,_install:install
};
function boot(tries){if(install())return;if(tries>0)setTimeout(function(){boot(tries-1);},250);}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',function(){boot(40);});else boot(40);
})(window);
