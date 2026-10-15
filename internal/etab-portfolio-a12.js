/* Verdict® — portefeuille d'établissements (C37, 15/10/2026).
   1. Masquer de l'accueil : un établissement peut quitter la barre de l'accueil tout en restant dans « Comparer ».
   2. Nouvel établissement : Verdict demande d'abord s'il s'agit du MÊME CONCEPT qu'un établissement existant (chaîne,
      franchise, deuxième adresse) ou d'un NOUVEAU concept.
   3. Même concept = duplication : la carte, les recettes, les ingrédients, les préparations, les suppléments, les réglages
      de carte, le type et le profil sont repris ; l'inventaire (zones, produits, fournisseurs) est repris à la première
      ouverture du module Inventaire. AUCUN chiffre n'est copié (CA, charges, salaires, journées, achats, stocks comptés,
      volumes vendus) : le score de l'établissement reste bloqué tant que ses propres chiffres ne sont pas fournis
      (FEC, exercice clos ou saisie). Une copie ne peut jamais produire une note.
   4. Nouveau concept : le parcours d'origine (dossier vide, mise en route complète).
   Aucune nouvelle formule financière ; aucun réseau. */
(function(root){
'use strict';
var doc=root.document;if(!doc)return;
var DUP_KEY='verdict:inventory:duplicate-requests:v1';
var CONCEPT_KEYS=['ing','plats','preparations','supp','reg','etabType','establishmentProfile','businessDayEndHour'];
var TXT={
  fr:{more:'masqué(s)',moreTitle:'Établissements masqués de l’accueil : toucher pour les afficher',less:'Replier',
      title:'Ajouter un établissement',lead:'Verdict prépare le nouvel établissement selon votre situation.',
      same:'Même concept qu’un établissement existant',sameSub:'Chaîne, franchise, deuxième adresse : la carte, les recettes, les ingrédients et l’inventaire sont repris. Il ne reste que ses chiffres à fournir.',
      model:'Modèle fictif de démonstration',modelSub:'Un des cas sectoriels de Verdict, pour tester (aucune donnée réelle).',createBlank:'Créer l\u2019établissement',
      fresh:'Nouveau concept',freshSub:'Un établissement différent : on part d’un dossier vide, avec la mise en route complète.',
      from:'Établissement de référence',network:'Lien avec la référence',netChain:'Même enseigne (succursale)',netFranchise:'Franchise',netOther:'Autre adresse, même concept',
      name:'Nom du nouvel établissement',city:'Ville',district:'Arrondissement / quartier',districtPh:'ex. 3e arrondissement, Part-Dieu, Vieux-Port\u2026',optional:'(facultatif)',districtHelp:'Affiché à l\u2019accueil avec la ville, tel que vous l\u2019écrivez : utile quand plusieurs établissements sont dans la même ville.',
      copied:'Repris : carte, recettes, ingrédients, préparations, suppléments, réglages de carte, type et profil, inventaire (produits, zones, fournisseurs).',
      notCopied:'Jamais repris : CA, charges, salaires, journées, achats, stocks comptés, volumes vendus.',
      scoreRule:'Le score de cet établissement reste bloqué tant que ses propres chiffres ne sont pas fournis.',
      create:'Créer à partir de la référence',back:'Retour',cancel:'Annuler',
      bannerK:'Établissement dupliqué',bannerT:'Score bloqué : il manque les chiffres de cet établissement',
      bannerB:'Repris de {src} : carte, recettes, ingrédients et inventaire. Pour obtenir sa note, fournissez ses propres chiffres — le FEC suffit, ou l’exercice clos, ou la saisie.',
      fec:'Importer le FEC',entry:'Saisir ses chiffres',done:'{name} créé à partir de {src} · score bloqué jusqu’à ses chiffres',noName:'Indiquez un nom.'},
  en:{more:'hidden',moreTitle:'Establishments hidden from home: tap to show them',less:'Collapse',
      title:'Add an establishment',lead:'Verdict prepares the new establishment for your situation.',
      same:'Same concept as an existing establishment',sameSub:'Chain, franchise, second address: menu, recipes, ingredients and inventory are reused. Only its figures remain to provide.',
      model:'Fictitious demo model',modelSub:'One of Verdict\u2019s sector cases, for testing (no real data).',createBlank:'Create the establishment',
      fresh:'New concept',freshSub:'A different establishment: start from an empty file with the full setup.',
      from:'Reference establishment',network:'Link with the reference',netChain:'Same brand (branch)',netFranchise:'Franchise',netOther:'Other address, same concept',
      name:'Name of the new establishment',city:'City',district:'District / neighbourhood',districtPh:'e.g. 3rd district, Part-Dieu, Old Port\u2026',optional:'(optional)',districtHelp:'Shown on the home screen with the city, exactly as you type it: useful when several establishments are in the same city.',
      copied:'Reused: menu, recipes, ingredients, preparations, extras, menu settings, type and profile, inventory (products, zones, suppliers).',
      notCopied:'Never reused: sales, costs, wages, days, purchases, counted stock, volumes sold.',
      scoreRule:'This establishment’s score stays locked until its own figures are provided.',
      create:'Create from the reference',back:'Back',cancel:'Cancel',
      bannerK:'Duplicated establishment',bannerT:'Score locked: this establishment’s figures are missing',
      bannerB:'Reused from {src}: menu, recipes, ingredients and inventory. To get its score, provide its own figures — the FEC is enough, or the closed year, or manual entry.',
      fec:'Import the FEC',entry:'Enter its figures',done:'{name} created from {src} · score locked until its figures',noName:'Enter a name.'}
};
function T(){var l=String(root.LOCALE||doc.documentElement.lang||'fr').slice(0,2);return TXT[l]||TXT.fr;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function S(){return root.STORE;}
function placeOf(d){d=d||{};return [d.etabVille,d.etabQuartier].map(function(x){return String(x==null?'':x).trim();}).filter(Boolean).join(' \u00b7 ');}
function nameOf(id){var d=S()&&S().etabs[id];if(!d)return '';try{return root.verdictEtabIdentity(d).name;}catch(e){return d.etab||id;}}

/* ── 1. Masquer de l'accueil ───────────────────────────────────────────────── */
var showAll=false;
function decorateBar(){
  var bar=doc.getElementById('etabBar');if(!bar||!S())return;
  var hiddenIds=[];
  bar.querySelectorAll('button[onclick^="switchEtab("]').forEach(function(b){
    var m=(b.getAttribute('onclick')||'').match(/switchEtab\('([^']+)'\)/);if(!m)return;var id=m[1],d=S().etabs[id];
    if(d&&d._barHidden&&id!==S().actif){hiddenIds.push(id);b.hidden=!showAll;b.classList.toggle('etab-bar-hidden',true);}
    var pl=placeOf(d),nm=b.querySelector('.enm'),old=b.querySelector('.etab-place');if(old)old.remove();
    if(pl&&nm){var sm=doc.createElement('small');sm.className='etab-place';sm.textContent=pl;nm.appendChild(sm);}
  });
  var old=bar.querySelector('button.etab-more');if(old)old.remove();
  if(hiddenIds.length){
    var t=T(),btn=doc.createElement('button');btn.type='button';btn.className='etab-more';btn.title=t.moreTitle;
    btn.textContent=showAll?t.less:'+'+hiddenIds.length+' '+t.more;
    btn.onclick=function(){showAll=!showAll;decorateBar();};
    var gear=bar.querySelector('button.gear');if(gear)bar.insertBefore(btn,gear);else bar.appendChild(btn);
  }
}

/* ── 2-4. Nouvel établissement ─────────────────────────────────────────────── */
var originalOpenNew=null;
function closeSheet(){var m=doc.getElementById('mNewEtab12');if(m&&m.parentNode)m.parentNode.removeChild(m);}
function sheet(inner){
  closeSheet();ensureStyle();
  var m=doc.createElement('div');m.className='modal on';m.id='mNewEtab12';m.innerHTML='<div class="sheet ne12">'+inner+'</div>';
  m.addEventListener('click',function(e){if(e.target===m)closeSheet();});doc.body.appendChild(m);
  try{root.a11yDialogPrepare&&root.a11yDialogPrepare(m);}catch(e){}
  return m;
}
function openChooser(){
  var t=T(),ids=typeof root.etabList==='function'?root.etabList():[];
  if(!ids.length){closeSheet();return originalOpenNew&&originalOpenNew();}
  sheet('<div class="grab"></div><h3>'+esc(t.title)+'</h3><p class="sub" style="margin:-6px 0 14px">'+esc(t.lead)+'</p>'+
    '<button type="button" class="ne12-choice" onclick="verdictNewEtabSame()"><b>🔁 '+esc(t.same)+'</b><span>'+esc(t.sameSub)+'</span></button>'+
    '<button type="button" class="ne12-choice" onclick="verdictNewEtabFresh()"><b>✨ '+esc(t.fresh)+'</b><span>'+esc(t.freshSub)+'</span></button>'+
    (isTestSession()?'<button type="button" class="ne12-choice" onclick="verdictNewEtabModel()"><b>\ud83e\uddea '+esc(t.model)+'</b><span>'+esc(t.modelSub)+'</span></button>':'')+
    '<button type="button" class="btn ghost" style="margin-top:8px;width:100%" onclick="verdictNewEtabClose()">'+esc(t.cancel)+'</button>');
}
function openSame(){
  var t=T(),ids=typeof root.etabList==='function'?root.etabList():[];
  /* Les établissements réels d'abord, puis les modèles fictifs. */
  var real=ids.filter(function(id){var d=S().etabs[id];return !(d._multiSiteModel||d._testFiction||d.exempleCharge);}),others=ids.filter(function(id){return real.indexOf(id)<0;});
  var opt=function(id){return '<option value="'+esc(id)+'"'+(id===S().actif?' selected':'')+'>'+esc(nameOf(id))+'</option>';};
  sheet('<div class="grab"></div><h3>'+esc(t.same)+'</h3>'+
    '<label class="f"><span>'+esc(t.from)+'</span><select id="ne12-src">'+real.map(opt).join('')+(others.length?'<optgroup label="—">'+others.map(opt).join('')+'</optgroup>':'')+'</select></label>'+
    '<label class="f"><span>'+esc(t.network)+'</span><select id="ne12-net"><option value="chain">'+esc(t.netChain)+'</option><option value="franchise">'+esc(t.netFranchise)+'</option><option value="other">'+esc(t.netOther)+'</option></select></label>'+
    '<label class="f"><span>'+esc(t.name)+'</span><input id="ne12-nom" type="text" autocomplete="off"></label>'+
    '<label class="f"><span>'+esc(t.city)+' <span style="opacity:.6">'+esc(t.optional)+'</span></span><input id="ne12-ville" type="text" autocomplete="off"></label>'+
    '<label class="f"><span>'+esc(t.district)+' <span style="opacity:.6">'+esc(t.optional)+'</span></span><input id="ne12-quartier" type="text" autocomplete="off" placeholder="'+esc(t.districtPh)+'"></label>'+
    '<div class="ne12-rules"><p>✅ '+esc(t.copied)+'</p><p>⛔ '+esc(t.notCopied)+'</p><p><b>🔒 '+esc(t.scoreRule)+'</b></p></div>'+
    '<p class="ne12-err" id="ne12-err" hidden></p>'+
    '<button type="button" class="btn" style="width:100%" onclick="verdictNewEtabCreateSame()">'+esc(t.create)+'</button>'+
    '<button type="button" class="btn ghost" style="margin-top:8px;width:100%" onclick="verdictNewEtabChooser()">'+esc(t.back)+'</button>');
  try{doc.getElementById('ne12-nom').focus({preventScroll:true});}catch(e){}
}
function isTestSession(){return root.VERDICT_TEST_SESSION===true||(typeof VERDICT_TEST_SESSION!=='undefined'&&VERDICT_TEST_SESSION===true);}
/* Nouveau concept : dossier vide. Dans le Perso (session Test), le parcours d'origine ouvre le catalogue des modèles ; on propose donc ici le formulaire vide, qui crée par createEtab(''). */
function openFresh(){
  if(!isTestSession()||typeof root.createEtab!=='function'){closeSheet();if(originalOpenNew)originalOpenNew();return;}
  var t=T();sheet('<div class="grab"></div><h3>'+esc(t.fresh)+'</h3><p class="sub" style="margin:-6px 0 12px">'+esc(t.freshSub)+'</p>'+
    '<label class="f"><span>'+esc(t.name)+'</span><input id="ne-nom" type="text" autocomplete="off"></label>'+
    '<label class="f"><span>'+esc(t.city)+' <span style="opacity:.6">'+esc(t.optional)+'</span></span><input id="ne-ville" type="text" autocomplete="off"></label>'+
    '<label class="f"><span>'+esc(t.district)+' <span style="opacity:.6">'+esc(t.optional)+'</span></span><input id="ne-quartier" type="text" autocomplete="off" placeholder="'+esc(t.districtPh)+'"></label>'+
    '<button type="button" class="btn" style="width:100%" onclick="verdictNewEtabCreateBlank()">'+esc(t.createBlank)+'</button>'+
    '<button type="button" class="btn ghost" style="margin-top:8px;width:100%" onclick="verdictNewEtabChooser()">'+esc(t.back)+'</button>');
}
function openModel(){closeSheet();if(originalOpenNew)originalOpenNew();}

/* Duplication : ne reprend que le concept, jamais les chiffres. Exposée pour les tests et la mémoire du Perso. */
function duplicate(srcId,nom,ville,network,opts){
  var quartier=opts&&opts.quartier||'';
  opts=opts||{};var src=S()&&S().etabs[srcId];if(!src||typeof root.freshDB!=='function')return null;
  if(!opts.silent&&typeof root.verdictEtabCapacityAvailable==='function'&&typeof root.etabBillableList==='function'&&!root.verdictEtabCapacityAvailable(root.etabBillableList().length+1)){
    if(typeof root.verdictRequestEtabCapacity==='function')root.verdictRequestEtabCapacity(root.etabBillableList().length+1);return null;}
  var d=root.freshDB(false);
  CONCEPT_KEYS.forEach(function(k){if(src[k]!==undefined)d[k]=clone(src[k]);});
  /* Les volumes vendus appartiennent à chaque établissement : remis à zéro. */
  (d.plats||[]).forEach(function(p){p.vol=0;delete p.ventes;delete p.realVolumes;});
  d.establishmentProfile=Object.assign({},d.establishmentProfile||{},{sites:'several',network:network==='franchise'?'franchise':'chain'});
  d.etab=String(nom||'').trim().slice(0,100)||(nameOf(srcId)+' (2)');if(ville)d.etabVille=String(ville).trim().slice(0,80);
  d.etabQuartier=String(quartier||'').trim().slice(0,80);
  d._duplicatedFrom={id:srcId,name:nameOf(srcId),network:network||'chain',at:new Date().toISOString()};
  d._billing={active:true,archivedAt:''};
  var id;
  if(opts.id&&!S().etabs[opts.id]){id=opts.id;S().etabs[id]=typeof root.fixDB==='function'?root.fixDB(d):d;S().ordre.push(id);}
  else{id=root.addEtab(d,null,!opts.silent);if(!id)return null;}
  try{var req=JSON.parse(root.localStorage.getItem(DUP_KEY)||'{}');req[id]=srcId;root.localStorage.setItem(DUP_KEY,JSON.stringify(req));}catch(e){}
  if(!opts.silent){
    try{root.save&&root.save('duplicate-establishment');}catch(e){}
    try{root.fillInputs();root.readInputs();root.drawEtabs();root.refreshAll();root.go('pil');}catch(e){}
    try{root.toast&&root.toast(T().done.replace('{name}',d.etab).replace('{src}',nameOf(srcId)));}catch(e){}
  }
  return id;
}
function createSame(){
  var t=T(),src=(doc.getElementById('ne12-src')||{}).value,net=(doc.getElementById('ne12-net')||{}).value,nom=((doc.getElementById('ne12-nom')||{}).value||'').trim(),ville=((doc.getElementById('ne12-ville')||{}).value||'').trim(),quartier=((doc.getElementById('ne12-quartier')||{}).value||'').trim();
  if(!nom){var e=doc.getElementById('ne12-err');if(e){e.textContent=t.noName;e.hidden=false;}return;}
  closeSheet();duplicate(src,nom,ville,net,{quartier:quartier});
}

/* Fiche « Mon établissement » : champ Arrondissement / quartier juste après la ville. */
function districtField(){
  var ville=doc.getElementById('i-etabville');if(!ville)return;var lab=ville.closest('label');if(!lab||!lab.parentNode)return;var t=T(),inp=doc.getElementById('i-etabquartier');
  if(!inp){var l=doc.createElement('label');l.className='f';l.innerHTML='<span>'+esc(t.district)+'</span><input id="i-etabquartier" type="text" autocomplete="off" placeholder="'+esc(t.districtPh)+'"><small style="display:block;opacity:.7;font-size:12px;margin-top:4px">'+esc(t.districtHelp)+'</small>';lab.parentNode.insertBefore(l,lab.nextSibling);inp=l.querySelector('input');
    inp.addEventListener('change',function(){if(!root.DB)return;root.DB.etabQuartier=inp.value.trim().slice(0,80);try{root.save&&root.save('etab-place');}catch(e){}try{root.drawEtabs&&root.drawEtabs();root.refreshAll&&root.refreshAll();}catch(e){}});}
  if(doc.activeElement!==inp)inp.value=(root.DB&&root.DB.etabQuartier)||'';
}
function createBlank(){var q=((doc.getElementById('ne-quartier')||{}).value||'').trim();var before=S()&&S().actif;try{root.createEtab('');}catch(e){}closeSheet();if(q&&S()&&S().actif!==before&&root.DB){root.DB.etabQuartier=q.slice(0,80);try{root.save&&root.save('etab-place');root.drawEtabs&&root.drawEtabs();root.refreshAll&&root.refreshAll();}catch(e){}}}
/* Bandeau d'accueil d'un établissement dupliqué tant que son score est bloqué. */
function banner(){
  var host=doc.getElementById('v-pil');if(!host)return;var old=doc.getElementById('dup12-banner');
  var d=root.DB,R=null;if(d&&d._duplicatedFrom){try{R=root.moteur();}catch(e){R=null;}}
  if(!d||!d._duplicatedFrom||(R&&R.ready)){if(old)old.remove();return;}
  var t=T(),html='<div class="dup12-k">🔒 '+esc(t.bannerK)+'</div><b>'+esc(t.bannerT)+'</b><p>'+esc(t.bannerB.replace('{src}',d._duplicatedFrom.name||''))+'</p>'+
    '<div class="dup12-actions"><button type="button" class="btn" onclick="verdictDupFec()">'+esc(t.fec)+'</button><button type="button" class="btn sec" onclick="verdictDupEntry()">'+esc(t.entry)+'</button></div>';
  if(!old){old=doc.createElement('section');old.id='dup12-banner';old.className='dup12';host.insertBefore(old,host.firstChild);}
  if(old.innerHTML!==html)old.innerHTML=html;
}
/* Accueil sans lecture premium (dossier sans chiffres) : la ville et le quartier, tels que saisis, sous le titre de l'établissement. */
function placeUnderTitle(){
  var host=doc.getElementById('v-pil');if(!host||!root.DB)return;var pl=placeOf(root.DB),nm=String(root.DB.etab||'').trim(),old=doc.getElementById('etab12-place');
  var title=nm?[].slice.call(host.querySelectorAll('h1,h2')).filter(function(h){return h.offsetParent!==null&&!h.closest('.p41-cadre')&&h.textContent.trim()===nm;})[0]:null;
  if(!pl||!title){if(old)old.remove();return;}
  if(!old||old.previousElementSibling!==title){if(old)old.remove();old=doc.createElement('p');old.id='etab12-place';old.className='etab12-place';title.parentNode.insertBefore(old,title.nextSibling);}
  var txt='\ud83d\udccd '+pl;if(old.textContent!==txt)old.textContent=txt;
}
function goFec(){try{root.go('in');}catch(e){}root.setTimeout(function(){var n=doc.getElementById('v44-fec')||doc.querySelector('#v-in .card');if(n)try{n.scrollIntoView({block:'start'});}catch(e){}},300);}
function goEntry(){try{root.go('in');}catch(e){}root.setTimeout(function(){var n=doc.getElementById('i-passport');n=n?(n.closest('.card')||n):doc.querySelector('#v-in .card');if(n)try{n.scrollIntoView({block:'start'});root.scrollBy(0,-72);}catch(e){}},300);}

var styled=false;
function ensureStyle(){
  if(styled||doc.getElementById('etab12-style'))return;styled=true;
  var st=doc.createElement('style');st.id='etab12-style';st.textContent=
  '.etab12-place{margin:2px 0 8px;font-size:13.5px;font-weight:600;opacity:.8}'+
  '#etabBar .etab-place{display:block;font-size:10.5px;font-weight:600;opacity:.65;line-height:1.1;margin-top:1px;white-space:nowrap}'+
  '#etabBar button.etab-more{font-weight:700;border-style:dashed!important;opacity:.85}'+
  '.ne12 .ne12-choice{display:block;width:100%;text-align:left;padding:14px 15px;margin:0 0 10px;border-radius:14px;border:1px solid rgba(128,128,128,.3);background:rgba(128,128,128,.05);color:inherit;cursor:pointer}.ne12 .ne12-choice:hover{border-color:#2563eb}.ne12 .ne12-choice b{display:block;font-size:15px;margin-bottom:4px}.ne12 .ne12-choice span{display:block;font-size:12.5px;line-height:1.45;opacity:.78}'+
  '.ne12 select{width:100%}.ne12-rules{margin:6px 0 12px;padding:10px 12px;border-radius:12px;background:rgba(37,99,235,.06);border:1px solid rgba(37,99,235,.25);font-size:12.5px;line-height:1.45}.ne12-rules p{margin:3px 0}.ne12-err{color:#ef4444;font-size:12.5px;margin:0 0 8px}'+
  '.dup12{margin:0 0 14px;padding:14px 15px;border-radius:16px;border:1px solid rgba(234,179,8,.6);background:rgba(234,179,8,.08)}.dup12-k{font:800 11px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:#a16207;margin-bottom:6px}.dup12 b{display:block;font-size:15.5px;margin-bottom:4px}.dup12 p{margin:0 0 10px;font-size:13px;line-height:1.5;opacity:.85}.dup12-actions{display:flex;flex-wrap:wrap;gap:8px}';
  doc.head.appendChild(st);
}

root.verdictNewEtabChooser=openChooser;root.verdictNewEtabModel=openModel;root.verdictNewEtabSame=openSame;root.verdictNewEtabFresh=openFresh;root.verdictNewEtabClose=closeSheet;
root.verdictNewEtabCreateSame=createSame;root.verdictNewEtabCreateBlank=createBlank;root.verdictEtabDuplicate=duplicate;root.verdictDupFec=goFec;root.verdictDupEntry=goEntry;
root.VerdictEtabPortfolio={conceptKeys:CONCEPT_KEYS.slice(),duplicate:duplicate,duplicateRequestsKey:DUP_KEY,placeOf:placeOf};

function hook(){
  if(typeof root.drawEtabs!=='function'||typeof root.openNewEtab!=='function'||typeof root.refreshAll!=='function')return false;
  if(!root.drawEtabs.__etab12){var od=root.drawEtabs,wd=function(){var r=od.apply(this,arguments);try{ensureStyle();decorateBar();}catch(e){}return r;};wd.__etab12=true;root.drawEtabs=wd;}
  if(!root.openNewEtab.__etab12){originalOpenNew=root.openNewEtab;var wn=function(){
    /* Démonstration et quotas : le parcours d'origine garde la main. */
    if(!isTestSession()&&typeof root.modeleDansDemonstration==='function'&&root.modeleDansDemonstration())return originalOpenNew.apply(this,arguments);
    if(typeof root.verdictEtabCapacityAvailable==='function'&&typeof root.etabBillableList==='function'&&!root.verdictEtabCapacityAvailable(root.etabBillableList().length+1))return originalOpenNew.apply(this,arguments);
    return openChooser();};wn.__etab12=true;root.openNewEtab=wn;}
  if(!root.refreshAll.__etab12){var orf=root.refreshAll,wr=function(){var r=orf.apply(this,arguments);try{ensureStyle();banner();districtField();placeUnderTitle();}catch(e){}return r;};wr.__etab12=true;root.refreshAll=wr;}
  try{ensureStyle();decorateBar();banner();districtField();placeUnderTitle();}catch(e){}
  /* Le titre de l'accueil est redessiné après un changement d'établissement : la ligne ville · quartier suit chaque rendu. */
  try{var vp=doc.getElementById('v-pil');if(vp&&root.MutationObserver&&!vp.__etab12Obs){var pend=0;vp.__etab12Obs=new root.MutationObserver(function(){if(pend)return;pend=1;root.setTimeout(function(){pend=0;try{placeUnderTitle();}catch(e){}},60);});vp.__etab12Obs.observe(vp,{childList:true,subtree:true,characterData:true});}}catch(e){}
  return true;
}
if(!hook()){var tries=0,iv=root.setInterval(function(){if(hook()||++tries>40)root.clearInterval(iv);},250);}
})(window);
