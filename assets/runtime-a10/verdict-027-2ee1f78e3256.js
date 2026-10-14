
/* Verdict® — contrat opérationnel partagé Inventaire / Vera / Verdict.
   Les quantités inconnues restent null. Une préparation ou un envoi ne vaut
   jamais confirmation fournisseur, et une confirmation ne vaut jamais preuve
   de disponibilité future sans élément explicite. */
(function(root,factory){
  'use strict';
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.VerdictOperations=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';

  var VERSION='1.0.0';
  var SCHEMA='verdict.operations.v1';
  /* V12 garde le contrat opérations V1 lisible par les anciens instantanés,
     puis ajoute deux extensions scellées et directionnelles. Inventaire reste
     l'autorité des références/prix/stock ; Verdict reste l'autorité des
     recettes/ventes/besoins calculés. */
  var BRIDGE_VERSION='2.0.0';
  var CATALOG_SCHEMA='verdict.inventory-catalog.v1';
  var DEMAND_SCHEMA='verdict.inventory-demand.v1';
  var RESPONSIBILITIES=Object.freeze({scoreAuthority:'verdict-engine',inventoryRole:'observed-evidence-only',veraRole:'explain-and-route-only',supplierRole:'confirm-availability'});
  var STATUSES=['prepared','sent','confirmed','partial','received','cancelled'];
  var ACTIVE={prepared:1,sent:1,confirmed:1,partial:1};

  function txt(v,n){return String(v==null?'':v).trim().slice(0,n||240);}
  function finite(v){if(v==null||v==='')return null;var n=Number(v);return Number.isFinite(n)?n:null;}
  function nonNegative(v,allowNull){var n=finite(v);if(n==null)return allowNull?null:0;return Math.max(0,n);}
  function iso(v){var d=v instanceof Date?v:new Date(v||0);return isNaN(d.getTime())?'':d.toISOString();}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return null;}}
  function hash(v){var s=String(v||''),h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return ('00000000'+(h>>>0).toString(16)).slice(-8);}
  function key(v){return txt(v,180).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function arr(v){return Array.isArray(v)?v:[];}
  function own(o,k){return Object.prototype.hasOwnProperty.call(o||{},k);}
  function audience(v){v=txt(v,20).toLowerCase();return v==='perso'?'perso':'client';}
  function audienceFor(db,sid,opts){opts=opts||{};var raw=txt(opts.audience,20).toLowerCase(),account=txt(opts.accountScope||opts.accountId,120).toLowerCase();if(raw==='client'||raw==='perso')return raw;if(/^perso-/i.test(String(sid||''))||account==='steven-local'||db&&db.personalModelLinks&&db.personalModelLinks[sid])return 'perso';return 'client';}
  function scopeOf(opts){opts=opts||{};return txt(opts.accountScope||opts.accountId,120);}
  function dateOnly(v){var d=iso(v);return d?d.slice(0,10):'';}
  function round(v,d){var p=Math.pow(10,d==null?4:d);return Math.round(Number(v)*p)/p;}
  function unique(values){var seen={},out=[];arr(values).forEach(function(v){v=txt(v,160);var k=key(v);if(v&&k&&!seen[k]){seen[k]=1;out.push(v);}});return out;}
  function explicitNumber(v){if(v==null||v==='')return null;var n=Number(v);return Number.isFinite(n)?n:null;}
  function catalogItemId(aud,accountScope,establishmentId,product){
    product=product||{};aud=audience(aud);accountScope=txt(accountScope,120)||'local';establishmentId=txt(establishmentId,100)||'unknown';
    var source=txt(product.catalogSourceId||product.sourceProductId||product.id,120)||[key(product.name||product.nom),key(product.unit||product.unite),key(product.sup||product.supplier)].join('|');
    return 'vci1-'+hash(aud+'|'+accountScope+'|'+establishmentId)+'-'+hash(source);
  }
  function latestPrice(db,sid,p){
    var value=explicitNumber(p&&p.price),at=txt(p&&p.priceDate,40),provenance=txt(p&&p.priceSource,80)||txt(p&&p.source,80)||'inventory-declared',history=arr(db&&db.priceHistory),best=null;
    history.forEach(function(x){if(!x||String(x.site||sid)!==String(sid)||String(x.product||x.productId||'')!==String(p&&p.id||''))return;var t=Date.parse(x.date||'');if(!best||Number.isFinite(t)&&t>best.t)best={t:Number.isFinite(t)?t:0,value:explicitNumber(own(x,'to')?x.to:x.price),date:txt(x.date,40),source:txt(x.source,80)};});
    if(best&&best.value!=null){value=best.value;at=best.date||at;provenance=best.source||'inventory-price-history';}
    /* Dans les anciennes bases, le formulaire stockait 0 pour « vide ».
       Aucun prix nul n'est donc publié comme une observation certaine. */
    if(!(value>0))value=null;
    return {amount:value,currency:'EUR',asOf:at?dateOnly(at):'',provenance:provenance,authority:'inventory',observed:value!=null};
  }
  function productAliases(p){return unique([p&&p.name,p&&p.nom].concat(arr(p&&p.aliases)));}
  function catalogRows(db,sid,opts){
    opts=opts||{};var aud=audienceFor(db,sid,opts),account=scopeOf(opts),out=[];
    rows(db||{},sid).forEach(function(x){var p=x.p||{},on=p.stock==null?null:nonNegative(p.stock,true),pack=explicitNumber(p.pack),aliases=productAliases(p),price=latestPrice(db,sid,p);
      out.push({catalogItemId:catalogItemId(aud,account,sid,p),sourceProductId:txt(p.id,100),name:txt(p.name,160),aliases:aliases,normalizedAliases:aliases.map(key),space:txt(x.space,100),unit:txt(p.unit,40),packaging:{quantity:pack&&pack>0?pack:1,unit:txt(p.packUnit||p.unit,40)},minimumOrder:nonNegative(p.minOrder,true),leadDays:nonNegative(p.leadDays,true),shelfLifeDays:nonNegative(p.shelfLifeDays,true),purchasePrice:price,stock:{onHand:on,observed:on!==null},supplier:{name:txt(p.sup,160),relationship:'declared',availability:'unconfirmed'},source:'verdict-inventory'});
    });
    return out.sort(function(a,b){return a.catalogItemId.localeCompare(b.catalogItemId);});
  }
  function buildCatalog(db,opts){
    opts=opts||{};var now=opts.now instanceof Date?opts.now:new Date(opts.now||Date.now()),sid=txt(opts.siteId||db&&db.site,100),aud=audienceFor(db,sid,opts),account=scopeOf(opts),items=catalogRows(db||{},sid,Object.assign({},opts,{audience:aud})),catalog={schema:CATALOG_SCHEMA,version:'1.0.0',bridgeVersion:BRIDGE_VERSION,direction:'inventory-to-verdict',authority:{identity:'inventory',price:'inventory',stock:'inventory',recipes:'verdict',sales:'verdict'},generatedAt:now.toISOString(),audience:aud,account:{id:txt(opts.accountId,120),scope:account,verified:!!opts.accountVerified},establishment:{id:sid,name:siteName(db||{},sid)},demo:!!opts.demo,items:items};
    catalog.fingerprint=hash(JSON.stringify({audience:aud,scope:account,site:sid,items:items}));return catalog;
  }
  function catalogFingerprint(catalog){return hash(JSON.stringify({audience:txt(catalog&&catalog.audience,20).toLowerCase(),scope:txt(catalog&&catalog.account&&(catalog.account.scope||catalog.account.id),120),site:txt(catalog&&catalog.establishment&&catalog.establishment.id,100),items:arr(catalog&&catalog.items)}));}
  function validateCatalog(catalog){
    var errors=[],ids={};if(!catalog||typeof catalog!=='object')return {ok:false,errors:['catalog-required']};
    if(catalog.schema!==CATALOG_SCHEMA)errors.push('catalog-schema');if(catalog.direction!=='inventory-to-verdict')errors.push('catalog-direction');if(['client','perso'].indexOf(txt(catalog.audience,20).toLowerCase())<0)errors.push('catalog-audience');if(!catalog.establishment||!txt(catalog.establishment.id,100))errors.push('catalog-establishment');if(!iso(catalog.generatedAt))errors.push('catalog-generated-at');if(!catalog.demo&&!txt(catalog.account&&(catalog.account.scope||catalog.account.id),120))errors.push('catalog-account');if(!txt(catalog.fingerprint,40)||catalog.fingerprint!==catalogFingerprint(catalog))errors.push('catalog-fingerprint');
    arr(catalog.items).forEach(function(x){var id=txt(x&&x.catalogItemId,100),price=x&&x.purchasePrice&&x.purchasePrice.amount,on=x&&x.stock&&x.stock.onHand;if(!id||ids[id])errors.push(!id?'catalog-id':'catalog-duplicate');ids[id]=1;if(!txt(x&&x.name,160))errors.push('catalog-name');if(price!==null&&price!==undefined&&(!Number.isFinite(Number(price))||Number(price)<0))errors.push('catalog-price');if(on!==null&&on!==undefined&&(!Number.isFinite(Number(on))||Number(on)<0))errors.push('catalog-stock');if(x&&x.purchasePrice&&x.purchasePrice.authority!=='inventory')errors.push('catalog-price-authority');if(x&&x.supplier&&x.supplier.availability==='confirmed'&&!txt(x.supplier.availabilityEvidence,160))errors.push('catalog-supplier-availability');});
    return {ok:errors.length===0,errors:unique(errors)};
  }
  function scopeMatch(payload,opts){
    opts=opts||{};var expectedRaw=txt(opts.audience,20).toLowerCase(),expectedAudience=expectedRaw==='client'||expectedRaw==='perso'?expectedRaw:'',actualAudience=txt(payload&&payload.audience,20).toLowerCase(),expectedAccount=txt(opts.accountScope||opts.accountId,120),expectedSite=txt(opts.establishmentId||opts.siteId||opts.linkedSiteId,100);
    if(expectedAudience&&actualAudience!==expectedAudience)return 'audience-mismatch';if(expectedAccount&&txt(payload&&payload.account&&(payload.account.scope||payload.account.id),120)!==expectedAccount)return 'account-mismatch';if(expectedSite&&txt(payload&&payload.establishment&&payload.establishment.id,100)!==expectedSite)return 'establishment-mismatch';if(payload&&payload.demo&&!opts.allowDemo)return 'demo-isolated';return '';
  }
  function itemSemantic(x){return JSON.stringify({name:x.name,aliases:x.normalizedAliases||x.aliases,unit:x.unit,packaging:x.packaging,purchasePrice:x.purchasePrice,stock:x.stock,supplier:x.supplier});}
  function previewCatalogImport(current,incoming,opts){
    var valid=validateCatalog(incoming),scope=valid.ok?scopeMatch(incoming,opts):'';if(!valid.ok)return {ok:false,reason:'invalid',errors:valid.errors,additions:[],updates:[],unchanged:[],conflicts:[]};if(scope)return {ok:false,reason:scope,errors:[],additions:[],updates:[],unchanged:[],conflicts:[]};
    current=current&&current.schema===CATALOG_SCHEMA?current:{items:[]};if(current.fingerprint&&current.fingerprint===incoming.fingerprint)return {ok:true,reason:'unchanged',fingerprint:incoming.fingerprint,additions:[],updates:[],unchanged:arr(incoming.items).map(function(x){return x.catalogItemId;}),conflicts:[],changed:false,idempotent:true};var by={},alias={};arr(current.items).forEach(function(x){by[x.catalogItemId]=x;arr(x.normalizedAliases||x.aliases).forEach(function(a){a=key(a);if(a)(alias[a]=alias[a]||[]).push(x.catalogItemId);});});var result={ok:true,reason:'preview',fingerprint:incoming.fingerprint,additions:[],updates:[],unchanged:[],conflicts:[]};
    arr(incoming.items).forEach(function(x){var old=by[x.catalogItemId];if(old){if(itemSemantic(old)===itemSemantic(x))result.unchanged.push(x.catalogItemId);else result.updates.push({catalogItemId:x.catalogItemId,before:clone(old),after:clone(x)});return;}var hits={};arr(x.normalizedAliases||x.aliases).forEach(function(a){arr(alias[key(a)]).forEach(function(id){hits[id]=1;});});var ids=Object.keys(hits);if(ids.length)result.conflicts.push({kind:ids.length>1?'ambiguous-alias':'identity-alias',catalogItemId:x.catalogItemId,matches:ids});else result.additions.push(clone(x));});
    result.changed=!!(result.additions.length||result.updates.length);result.idempotent=!result.changed&&!result.conflicts.length;return result;
  }
  function ingredientUnitType(v){v=key(v);if(/^(kg|kilogramme|kilogrammes)$/.test(v))return 'kg';if(/^(g|gramme|grammes)$/.test(v))return 'g';if(/^(l|litre|litres)$/.test(v))return 'l';if(/^(ml|millilitre|millilitres)$/.test(v))return 'ml';if(/^(unite|unites|piece|pieces|btl|bouteille|bouteilles)$/.test(v))return 'unit';return v;}
  function unitPriceForIngredient(item,ingredient){
    var amount=item&&item.purchasePrice&&item.purchasePrice.amount;if(amount==null)return {ok:false,reason:'price-unknown'};var from=ingredientUnitType(item.unit),to=ingredientUnitType(ingredient&&ingredient.type||ingredient&&ingredient.unit);
    if(to==='kg'&&from==='kg'||to==='l'&&from==='l'||to==='unit'&&from==='unit')return {ok:true,price:Number(amount)};
    if(to==='kg'&&from==='g'||to==='l'&&from==='ml')return {ok:true,price:Number(amount)*1000};if(to==='g'&&from==='kg'||to==='ml'&&from==='l')return {ok:true,price:Number(amount)/1000};return {ok:false,reason:'unit-mismatch',from:from,to:to};
  }
  function applyCatalogToIngredients(ingredients,catalog,opts){
    opts=opts||{};var valid=validateCatalog(catalog);if(!valid.ok)return {ok:false,reason:'invalid',errors:valid.errors,ingredients:ingredients,updated:[],conflicts:[]};var by={},alias={};arr(catalog.items).forEach(function(x){by[x.catalogItemId]=x;arr(x.normalizedAliases||x.aliases).forEach(function(a){a=key(a);if(a)(alias[a]=alias[a]||[]).push(x);});});var copy=clone(arr(ingredients)),updated=[],conflicts=[];
    copy.forEach(function(g){var item=g.catalogItemId&&by[g.catalogItemId],hits=item?[item]:arr(alias[key(g.nom||g.name)]);if(!item&&hits.length===1)item=hits[0];if(!item){if(hits.length>1)conflicts.push({kind:'ambiguous-alias',ingredient:txt(g.nom||g.name,160),matches:hits.map(function(x){return x.catalogItemId;})});return;}var converted=unitPriceForIngredient(item,g);if(!converted.ok){if(converted.reason!=='price-unknown')conflicts.push({kind:converted.reason,ingredient:txt(g.nom||g.name,160),catalogItemId:item.catalogItemId,from:converted.from,to:converted.to});g.catalogItemId=item.catalogItemId;return;}var before=g.prix;g.catalogItemId=item.catalogItemId;g.prix=round(converted.price,6);g.catalogPriceAsOf=item.purchasePrice.asOf||'';g.catalogPriceProvenance=item.purchasePrice.provenance||'inventory';if(Number(before)!==Number(g.prix))updated.push({ingredient:txt(g.nom||g.name,160),catalogItemId:item.catalogItemId,before:before,after:g.prix});});
    return {ok:!conflicts.length||!!opts.allowConflicts,reason:conflicts.length?'conflicts':'applied',ingredients:copy,updated:updated,conflicts:conflicts,idempotent:updated.length===0};
  }
  function applyCatalogImport(target,incoming,opts){
    opts=opts||{};var current=target&&target.inventoryCatalog,preview=previewCatalogImport(current,incoming,opts);if(!preview.ok||preview.conflicts.length&&!opts.allowConflicts)return {ok:false,reason:preview.reason||'conflicts',preview:preview,target:target};var next=clone(target||{});next.inventoryCatalog=clone(incoming);if(Array.isArray(next.ing)){var applied=applyCatalogToIngredients(next.ing,incoming,opts);if(!applied.ok)return {ok:false,reason:'ingredient-conflicts',preview:preview,ingredientPreview:applied,target:target};next.ing=applied.ingredients;preview.ingredientChanges=applied.updated;preview.ingredientConflicts=applied.conflicts;}
    return {ok:true,changed:!current||current.fingerprint!==incoming.fingerprint,target:next,preview:preview};
  }
  function recipeQuantityUnit(ingredient){var t=ingredientUnitType(ingredient&&ingredient.type||ingredient&&ingredient.unit);return t==='kg'?'g':(t==='l'?'ml':t);}
  function demandLine(line,ingredientByName){
    if(Array.isArray(line)){var arrayName=txt(line[0],160),arrayIngredient=ingredientByName[key(arrayName)]||{};return {name:arrayName,quantity:nonNegative(line[1],true),unit:txt(recipeQuantityUnit(arrayIngredient),40),catalogItemId:txt(arrayIngredient.catalogItemId,100),preparationId:''};}
    line=line||{};var name=txt(line.name||line.nom||line.ingredient,160),ingredient=ingredientByName[key(name)]||{};
    return {name:name,quantity:nonNegative(line.quantity==null?line.qty==null?line.qte:line.qty:line.quantity,true),unit:txt(line.unit||line.unite||recipeQuantityUnit(ingredient),40),catalogItemId:txt(line.catalogItemId||ingredient.catalogItemId,100),preparationId:txt(line.preparationId||line.prepId,100)};
  }
  function demandQuantity(q,from,to){
    q=nonNegative(q,true);if(q==null)return null;from=ingredientUnitType(from);to=ingredientUnitType(to);
    if(!from||from===to)return q;if((from==='g'&&to==='kg')||(from==='ml'&&to==='l'))return q/1000;if((from==='kg'&&to==='g')||(from==='l'&&to==='ml'))return q*1000;return null;
  }
  function catalogLookup(catalog){
    var by={},alias={};arr(catalog&&catalog.items).forEach(function(x){by[x.catalogItemId]=x;if(x.sourceProductId)by[x.sourceProductId]=x;arr(x.normalizedAliases||x.aliases).concat([x.name]).forEach(function(a){a=key(a);if(!a)return;alias[a]=alias[a]||[];if(!alias[a].some(function(v){return v.catalogItemId===x.catalogItemId;}))alias[a].push(x);});});return {by:by,alias:alias};
  }
  function resolveDemandItem(line,lookup){
    var item=line.catalogItemId&&lookup.by[line.catalogItemId],hits=item?[item]:arr(lookup.alias[key(line.name)]);return {item:item||(hits.length===1?hits[0]:null),ambiguous:!item&&hits.length>1?hits:[]};
  }
  function demandSales(payload,recipes,asOf){
    var by={},rows=arr(payload.sales||payload.ventes);rows.forEach(function(x){var id=txt(x.recipeId||x.dishId||x.platId||x.id,100),qty=nonNegative(x.quantity==null?x.qty==null?x.volume:x.qty:x.quantity,true),date=dateOnly(x.date||x.d||asOf);if(!id||qty==null||!date)return;var k=id+'|'+date;(by[k]=by[k]||{recipeId:id,date:date,quantity:0,source:txt(x.source,80)||'verdict-sales'}).quantity+=qty;});
    if(!rows.length)arr(recipes).forEach(function(r){var qty=nonNegative(r.volume==null?r.vol:r.volume,true),id=txt(r.id,100);if(id&&qty!=null&&qty>0){var k=id+'|'+asOf;by[k]={recipeId:id,date:asOf,quantity:qty,source:'verdict-declared-period-volume'};}});return Object.keys(by).map(function(k){return by[k];});
  }
  function buildDemandSnapshot(payload,opts){
    payload=payload||{};opts=opts||{};var now=opts.now instanceof Date?opts.now:new Date(opts.now||Date.now()),asOf=dateOnly(opts.asOf||payload.asOf||now),catalog=opts.catalog||payload.catalog||{items:[]},lookup=catalogLookup(catalog),recipes=arr(payload.recipes||payload.plats),preps=arr(payload.preparations),ingredientByName={},prepBy={},recipeBy={},groups={},issues=[],totalLines=0,resolvedLines=0;
    arr(payload.ingredients||payload.ing).forEach(function(g){ingredientByName[key(g.nom||g.name)]=g;});preps.forEach(function(p){if(p&&p.id)prepBy[p.id]=p;});recipes.forEach(function(r){if(r&&r.id)recipeBy[r.id]=r;});
    function add(item,qty,date,source,recipeId){if(!item||qty==null)return;var k=item.catalogItemId+'|'+item.unit+'|'+date,g=groups[k]||(groups[k]={catalogItemId:item.catalogItemId,sourceProductId:item.sourceProductId||'',name:item.name,unit:item.unit,date:date,quantity:0,sources:{}});g.quantity+=qty;g.sources[source||'verdict-recipes']=1;if(recipeId)g.sources['recipe:'+recipeId]=1;}
    function expand(lines,mult,date,source,recipeId,stack){arr(lines).forEach(function(raw){var line=demandLine(raw,ingredientByName);totalLines++;if(line.quantity==null){issues.push({kind:'missing-quantity',recipeId:recipeId,name:line.name,preparationId:line.preparationId||''});return;}if(line.preparationId){expandPrep(line.preparationId,line.quantity*mult,date,source,recipeId,stack);return;}var resolved=resolveDemandItem(line,lookup);if(!resolved.item){issues.push({kind:resolved.ambiguous.length?'ambiguous-catalog-item':'missing-catalog-item',recipeId:recipeId,name:line.name});return;}var qty=demandQuantity(line.quantity*mult,line.unit||((ingredientByName[key(line.name)]||{}).type),resolved.item.unit);if(qty==null){issues.push({kind:'unit-mismatch',recipeId:recipeId,name:line.name,from:line.unit||((ingredientByName[key(line.name)]||{}).type),to:resolved.item.unit});return;}resolvedLines++;add(resolved.item,qty,date,source,recipeId);});}
    function expandPrep(id,used,date,source,recipeId,stack){id=txt(id,100);var p=prepBy[id];if(!p||!(used>0)){issues.push({kind:'missing-preparation',recipeId:recipeId,preparationId:id});return;}stack=arr(stack);if(stack.indexOf(id)>=0){issues.push({kind:'preparation-cycle',recipeId:recipeId,preparationId:id});return;}var yieldQty=nonNegative(p.yieldQty==null?p.rendement:p.yieldQty,true);if(!(yieldQty>0)){issues.push({kind:'preparation-yield-missing',recipeId:recipeId,preparationId:id});return;}expand(p.ingredients||p.rec,used/yieldQty,date,source,recipeId,stack.concat([id]));}
    demandSales(payload,recipes,asOf).forEach(function(s){var r=recipeBy[s.recipeId];if(!r){issues.push({kind:'missing-recipe',recipeId:s.recipeId,date:s.date});return;}expand(r.ingredients||r.rec,s.quantity,s.date,s.source,r.id,[]);var grouped={};arr(r.preparations||r.preps).forEach(function(x){var id=txt(Array.isArray(x)?x[0]:x.preparationId||x.id,100),q=nonNegative(Array.isArray(x)?x[1]:x.quantity==null?x.qty:x.quantity,true);if(!id)return;if(q==null){issues.push({kind:'missing-quantity',recipeId:r.id,preparationId:id});return;}grouped[id]=(grouped[id]||0)+q;});Object.keys(grouped).forEach(function(id){expandPrep(id,grouped[id]*s.quantity,s.date,s.source,r.id,[]);});});
    /* Les anciens producteurs peuvent déjà fournir des besoins agrégés. Ils
       sont normalisés sans être additionnés une seconde fois aux recettes. */
    if(!recipes.length)arr(payload.products).forEach(function(p){var item=lookup.by[p.catalogItemId||p.sourceProductId||p.id],name=txt(p.name,160),unit=txt(p.unit||item&&item.unit,40),cid=txt(p.catalogItemId||item&&item.catalogItemId,100),observations=arr(p.observations),required=nonNegative(p.requiredQuantity==null?p.required:p.requiredQuantity,true);if(!cid){issues.push({kind:'missing-catalog-item',name:name});return;}if(required==null&&!observations.length){issues.push({kind:'missing-quantity',catalogItemId:cid,name:name});return;}var g={catalogItemId:cid,sourceProductId:txt(p.sourceProductId||item&&item.sourceProductId||p.id,100),name:name||item&&item.name||cid,unit:unit,date:asOf,quantity:required,sources:{'verdict-aggregated-demand':1},observations:observations,recipeCoverage:p.recipeCoverage,onOrder:p.onOrder,reviewDays:p.reviewDays,safetyDays:p.safetyDays};groups[cid+'|'+unit+'|'+asOf]=g;});
    var groupedProducts={},coverage=totalLines?resolvedLines/totalLines:0;Object.keys(groups).forEach(function(k){var g=groups[k],id=g.catalogItemId,p=groupedProducts[id]||(groupedProducts[id]={catalogItemId:id,sourceProductId:g.sourceProductId,name:g.name,unit:g.unit,requiredQuantity:null,observations:[],recipeCoverage:coverage,onOrder:g.onOrder==null?0:g.onOrder,reviewDays:g.reviewDays||7,safetyDays:g.safetyDays,sources:{}});if(g.quantity!=null)p.requiredQuantity=(p.requiredQuantity==null?0:p.requiredQuantity)+g.quantity;arr(g.observations).forEach(function(o){p.observations.push(clone(o));});if(!g.observations&&g.quantity!=null)p.observations.push({date:g.date,qty:round(g.quantity,4),exceptional:'normal',source:Object.keys(g.sources)[0]||'verdict-recipes'});Object.keys(g.sources).forEach(function(s){p.sources[s]=1;});});
    var products=Object.keys(groupedProducts).sort().map(function(id){var p=groupedProducts[id];p.requiredQuantity=p.requiredQuantity==null?null:round(p.requiredQuantity,4);p.recipeCoverage=round(p.recipeCoverage,4);p.sources=Object.keys(p.sources).sort();p.observations=p.observations.filter(function(o){return o&&dateOnly(o.date)&&nonNegative(o.qty,true)!=null;}).map(function(o){return {date:dateOnly(o.date),qty:round(nonNegative(o.qty,true),4),exceptional:txt(o.exceptional,30)||'normal',source:txt(o.source,80)||'verdict-recipes'};});return p;});
    var aud=audience(opts.audience||payload.audience),account=txt(opts.accountScope||opts.accountId||payload.account&&payload.account.scope,120),sid=txt(opts.siteId||opts.establishmentId||payload.establishment&&payload.establishment.id,100),snapshot={schema:DEMAND_SCHEMA,version:'1.0.0',bridgeVersion:BRIDGE_VERSION,direction:'verdict-to-inventory',authority:{demand:'verdict',stock:'inventory',price:'inventory',target:'user-confirmation'},generatedAt:now.toISOString(),asOf:asOf,audience:aud,account:{id:txt(opts.accountId||payload.account&&payload.account.id,120),scope:account,verified:!!opts.accountVerified},establishment:{id:sid,name:txt(opts.establishmentName||payload.establishment&&payload.establishment.name,160)},demo:!!(opts.demo||payload.demo),products:products,coverage:{resolvedLines:resolvedLines,totalLines:totalLines,ratio:round(coverage,4)},issues:issues};snapshot.fingerprint=hash(JSON.stringify({audience:aud,scope:account,site:sid,asOf:asOf,products:products,issues:issues}));return snapshot;
  }
  function validateDemand(demand){
    var errors=[],ids={};if(!demand||typeof demand!=='object')return {ok:false,errors:['demand-required']};if(demand.schema!==DEMAND_SCHEMA)errors.push('demand-schema');if(demand.direction!=='verdict-to-inventory')errors.push('demand-direction');if(['client','perso'].indexOf(txt(demand.audience,20).toLowerCase())<0)errors.push('demand-audience');if(!demand.establishment||!txt(demand.establishment.id,100))errors.push('demand-establishment');if(!iso(demand.generatedAt))errors.push('demand-generated-at');if(!demand.demo&&!txt(demand.account&&(demand.account.scope||demand.account.id),120))errors.push('demand-account');
    arr(demand.products).forEach(function(p){var id=txt(p&&p.catalogItemId,100),q=p&&p.requiredQuantity;if(!id||ids[id])errors.push(!id?'demand-id':'demand-duplicate');ids[id]=1;if(q!==null&&q!==undefined&&(!Number.isFinite(Number(q))||Number(q)<0))errors.push('demand-quantity');arr(p&&p.observations).forEach(function(o){if(!dateOnly(o&&o.date)||!Number.isFinite(Number(o&&o.qty))||Number(o.qty)<0)errors.push('demand-observation');});});if(!txt(demand.fingerprint,40)||demand.fingerprint!==demandFingerprint(demand))errors.push('demand-fingerprint');return {ok:errors.length===0,errors:unique(errors)};
  }
  function demandFingerprint(demand){return hash(JSON.stringify({audience:txt(demand&&demand.audience,20).toLowerCase(),scope:txt(demand&&demand.account&&(demand.account.scope||demand.account.id),120),site:txt(demand&&demand.establishment&&demand.establishment.id,100),asOf:txt(demand&&demand.asOf,10),products:arr(demand&&demand.products),issues:arr(demand&&demand.issues)}));}
  function aggregateDemand(snapshot){var valid=validateDemand(snapshot);if(!valid.ok)return {ok:false,errors:valid.errors,products:[]};return {ok:true,asOf:snapshot.asOf,products:arr(snapshot.products).map(function(p){var q=nonNegative(p.requiredQuantity,true);return {catalogItemId:p.catalogItemId,name:p.name,unit:p.unit,requiredQuantity:q==null?null:round(q,4),observations:arr(p.observations).length,recipeCoverage:p.recipeCoverage};})};}
  function previewDemandImport(current,incoming,opts){
    var valid=validateDemand(incoming),scope=valid.ok?scopeMatch(incoming,opts):'';if(!valid.ok)return {ok:false,reason:'invalid',errors:valid.errors,additions:[],updates:[],unchanged:[],conflicts:[]};if(scope)return {ok:false,reason:scope,errors:[],additions:[],updates:[],unchanged:[],conflicts:[]};if(current&&(current.fingerprint===incoming.fingerprint||current.sourceFingerprint===incoming.fingerprint))return {ok:true,reason:'unchanged',fingerprint:incoming.fingerprint,additions:[],updates:[],unchanged:arr(incoming.products).map(function(x){return x.catalogItemId;}),warnings:clone(arr(incoming.issues)),conflicts:[],changed:false,idempotent:true};var old={};arr(current&&current.products).forEach(function(x){old[x.catalogItemId||x.id]=x;});var issues=arr(incoming.issues),result={ok:true,reason:'preview',fingerprint:incoming.fingerprint,additions:[],updates:[],unchanged:[],warnings:clone(issues),conflicts:issues.filter(function(x){return /^(ambiguous-catalog-item|missing-catalog-item|unit-mismatch|preparation-cycle)$/.test(x.kind||'');})};arr(incoming.products).forEach(function(x){var p=old[x.catalogItemId];if(!p)result.additions.push(clone(x));else if(JSON.stringify(p)===JSON.stringify(x))result.unchanged.push(x.catalogItemId);else result.updates.push({catalogItemId:x.catalogItemId,before:clone(p),after:clone(x)});});result.changed=!!(result.additions.length||result.updates.length);result.idempotent=!result.changed&&!result.conflicts.length;return result;
  }
  function applyDemandImport(db,incoming,opts){
    opts=opts||{};var preview=previewDemandImport(db&&db.demandBridge,incoming,opts);if(!preview.ok||preview.conflicts.length&&!opts.allowConflicts)return {ok:false,reason:preview.reason||'conflicts',preview:preview,data:db};if(preview.idempotent)return {ok:true,changed:false,idempotent:true,data:db,preview:preview};var next=clone(db||{}),catalog=buildCatalog(next,opts),lookup=catalogLookup(catalog);arr(incoming.products).forEach(function(p){if(!lookup.by[p.catalogItemId])preview.conflicts.push({kind:'catalog-item-not-in-inventory',catalogItemId:p.catalogItemId});});if(preview.conflicts.length&&!opts.allowConflicts)return {ok:false,reason:'conflicts',preview:preview,data:db};next.demandBridge=clone(incoming);return {ok:true,changed:true,idempotent:false,data:next,preview:preview};
  }
  function status(v){v=txt(v,30).toLowerCase();var map={passed:'sent',ordered:'sent',prepared:'prepared',sent:'sent',confirmed:'confirmed',partial:'partial',received:'received',cancelled:'cancelled'};return map[v]||'';}
  function statusLabel(v,lang){
    var labels={
      fr:{prepared:'Préparée',sent:'Envoyée',confirmed:'Confirmée',partial:'Partielle',received:'Réceptionnée',cancelled:'Annulée'},
      en:{prepared:'Prepared',sent:'Sent',confirmed:'Confirmed',partial:'Partial',received:'Received',cancelled:'Cancelled'},
      es:{prepared:'Preparada',sent:'Enviada',confirmed:'Confirmada',partial:'Parcial',received:'Recibida',cancelled:'Cancelada'},
      it:{prepared:'Preparata',sent:'Inviata',confirmed:'Confermata',partial:'Parziale',received:'Ricevuta',cancelled:'Annullata'},
      de:{prepared:'Vorbereitet',sent:'Gesendet',confirmed:'Bestätigt',partial:'Teilweise',received:'Erhalten',cancelled:'Storniert'},
      nl:{prepared:'Voorbereid',sent:'Verzonden',confirmed:'Bevestigd',partial:'Gedeeltelijk',received:'Ontvangen',cancelled:'Geannuleerd'},
      pt:{prepared:'Preparada',sent:'Enviada',confirmed:'Confirmada',partial:'Parcial',received:'Recebida',cancelled:'Cancelada'}
    },l=labels[lang]||labels.fr;
    return l[status(v)]||txt(v,30);
  }
  function dateMs(v){var n=Date.parse(v||'');return Number.isFinite(n)?n:Infinity;}
  function siteZones(db,sid){var s=db&&db.sites&&db.sites[sid];return s&&Array.isArray(s.zones)?s.zones.filter(function(z){return db.spaces&&db.spaces[z];}):[];}
  function siteName(db,sid){return txt(db&&db.sites&&db.sites[sid]&&db.sites[sid].name,120)||'Mon établissement';}
  function rows(db,sid){var out=[];siteZones(db,sid).forEach(function(z){var sp=db.spaces[z]||{};(sp.products||[]).forEach(function(p){if(p&&p.id)out.push({space:z,p:p});});});return out;}
  function productMap(db,sid){var out={};rows(db,sid).forEach(function(x){out[x.p.id]={space:x.space,p:x.p};});return out;}
  function profileList(db,sid){var p=db&&db.suppliersBySite&&db.suppliersBySite[sid]||{};return Object.keys(p).map(function(k){return p[k];}).filter(function(x){return x&&x.name;});}
  function nextWindow(profile,now,ordering){
    if(!profile)return null;
    try{
      if(ordering&&typeof ordering.nextWindows==='function'){
        var w=ordering.nextWindows(profile,now,35)[0];
        if(w)return {cutoffAt:txt(w.cutoffAt,40),deliveryAt:txt(w.deliveryAt,40),deliveryEndAt:txt(w.deliveryEndAt,40)};
      }
    }catch(e){}
    return null;
  }
  function stockRows(db,sid,catalog){
    var catalogBySource={};arr(catalog&&catalog.items).forEach(function(x){catalogBySource[x.sourceProductId]=x.catalogItemId;});
    return rows(db,sid).map(function(x){
      var p=x.p,on=p.stock==null?null:finite(p.stock),minimum=Math.max(0,finite(p.min)||0),target=Math.max(0,finite(p.goal)||0),state='ok';
      if(on==null)state='unknown';else if(on===0)state='rupture';else if(minimum>0&&on<=minimum)state='critical';
      return {id:txt(p.id,100),catalogItemId:catalogBySource[p.id]||'',space:txt(x.space,100),name:txt(p.name,160),unit:txt(p.unit,40),onHand:on==null?null:Math.max(0,on),minimum:minimum,target:target,supplier:txt(p.sup,160),state:state,observed:on!=null};
    });
  }
  function supplierRows(db,sid,now,ordering){
    return profileList(db,sid).map(function(p){
      var w=nextWindow(p,now,ordering);
      return {id:txt(p.id,100)||('supplier-'+hash(key(p.name))),name:txt(p.name,160),channel:txt(p.channel,30),scheduleVerified:!!p.verified,scheduleVerifiedAt:txt(p.verifiedAt,10),nextCutoffAt:w&&w.cutoffAt||'',nextDeliveryAt:w&&w.deliveryAt||'',nextDeliveryEndAt:w&&w.deliveryEndAt||'',availability:'unconfirmed'};
    }).sort(function(a,b){return a.name.localeCompare(b.name);});
  }
  function incidentRows(db,sid,map){
    return (db&&db.supplyIncidents||[]).filter(function(x){return x&&x.site===sid;}).slice(-250).map(function(x){
      var p=map[x.productId]&&map[x.productId].p||{},availability=x.availability==='confirmed'&&x.availabilityEvidence?'confirmed':'unconfirmed';
      return {id:txt(x.id,100),productId:txt(x.productId,100),productName:txt(x.productName||p.name,160),space:txt(x.space||(map[x.productId]&&map[x.productId].space),100),status:txt(x.status,60),open:x.status!=='resolved',actorName:txt(x.actorName||x.actor_name||x.reportedByName||x.reporterName||x.reportedBy&&x.reportedBy.name||x.reportedBy||x.reported_by,100),reportedAt:txt(x.reportedAt,40),reportedByName:txt(x.reportedByName||x.reporterName||x.reportedBy&&x.reportedBy.name,80),reportedByRole:txt(x.reportedByRole||x.reporterRole||x.reportedBy&&x.reportedBy.role,60),requiredAt:txt(x.requiredAt||x.requiredDate,40),quantity:nonNegative(x.qtyBase,true),unit:txt(x.unit||p.unit,40),supplier:txt(x.supplier,160),cutoffAt:txt(x.cutoffAt,40),deliveryAt:txt(x.deliveryAt,40),scheduleVerified:!!x.scheduleVerified,availability:availability,availabilityEvidence:availability==='confirmed'?txt(x.availabilityEvidence,160):'',urgentCoverage:txt(x.urgentCoverage,40),replenishmentStatus:txt(x.replenishmentStatus,60)};
    }).sort(function(a,b){return dateMs(a.requiredAt)-dateMs(b.requiredAt);});
  }
  function lineRows(lines,map){
    return (lines||[]).slice(0,500).map(function(l){var p=map[l.productId]&&map[l.productId].p||{};return {productId:txt(l.productId,100),name:txt(l.name||p.name,160),space:txt(l.space||(map[l.productId]&&map[l.productId].space),100),sku:txt(l.sku,100),unit:txt(l.unit||p.unit,40),quantity:nonNegative(l.quantity,true),receivedQuantity:nonNegative(l.receivedQty,true),packages:nonNegative(l.packages,true),requiredAt:txt(l.requiredAt||l.requiredDate,40)};});
  }
  function storedOrders(db,sid,map){
    return (db&&db.purchaseOrders||[]).filter(function(x){return x&&x.site===sid&&status(x.status);}).slice(-250).map(function(x){
      var st=status(x.status),availability=x.availability==='confirmed'&&x.availabilityEvidence?'confirmed':(st==='received'?'observed-at-receipt':'unconfirmed');
      return {id:txt(x.id,120),status:st,supplier:txt(x.supplier,160),createdAt:txt(x.createdAt,40),updatedAt:txt(x.updatedAt,40),cutoffAt:txt(x.cutoffAt,40),deliveryAt:txt(x.deliveryAt,40),deliveryEndAt:txt(x.deliveryEndAt,40),requiredAt:txt(x.requiredAt||x.requiredDate,40),estimatedTotal:nonNegative(x.estimatedTotal,true),lines:lineRows(x.lines,map),scheduleVerified:!!x.profileVerified,supplierConfirmation:(st==='confirmed'||st==='partial'||st==='received')?'declared-confirmed':'unconfirmed',statusEvidence:'user-declared',availability:availability,availabilityEvidence:availability==='confirmed'?txt(x.availabilityEvidence,160):''};
    });
  }
  function preparedOrders(prepared,sid,map){
    return (prepared||[]).filter(function(g){return g&&g.site===sid;}).slice(0,250).map(function(g){
      var lines=(g.lines||g.rows||[]).map(function(l){var p=l.p||{},raw={productId:l.productId||p.id,name:l.name||p.name,space:l.space,sku:l.sku,unit:l.unit||p.unit,quantity:l.quantity,receivedQty:0,packages:l.packages,requiredAt:l.requiredAt||l.requiredDate};return raw;});
      return {id:'prepared-'+hash(g.key||sid+'|'+g.supplier+'|'+g.cutoffAt+'|'+JSON.stringify(lines)),status:'prepared',supplier:txt(g.supplier,160),createdAt:txt(g.createdAt,40),updatedAt:txt(g.updatedAt,40),cutoffAt:txt(g.cutoffAt||(g.window&&g.window.cutoffAt),40),deliveryAt:txt(g.deliveryAt||(g.window&&g.window.deliveryAt),40),deliveryEndAt:txt(g.deliveryEndAt||(g.window&&g.window.deliveryEndAt),40),requiredAt:txt(g.requiredAt||g.requiredDate,40),estimatedTotal:nonNegative(g.estimatedTotal==null?g.total:g.estimatedTotal,true),lines:lineRows(lines,map),scheduleVerified:!!(g.scheduleVerified||(g.profile&&g.profile.verified)),supplierConfirmation:'unconfirmed',statusEvidence:'computed-plan',availability:'unconfirmed',availabilityEvidence:''};
    });
  }
  function orderCounts(orders){var out={prepared:0,sent:0,confirmed:0,partial:0,received:0,cancelled:0};(orders||[]).forEach(function(x){if(out[x.status]!=null)out[x.status]++;});return out;}
  function chooseAction(snapshot,now){
    now=now instanceof Date?now:new Date(now||Date.now());var open=(snapshot.incidents||[]).filter(function(x){return x.open;});
    if(open.length){var x=open[0];return {kind:'incident',level:'critical',title:'Rupture à décider',detail:x.productName+(x.requiredAt?' · nécessaire '+x.requiredAt:''),route:'inventory',sourceId:x.id,actorName:txt(x.actorName,100),reportedAt:txt(x.reportedAt,40)};}
    var prepared=(snapshot.orders||[]).filter(function(x){return x.status==='prepared';}).sort(function(a,b){return dateMs(a.cutoffAt)-dateMs(b.cutoffAt);});
    if(prepared.length){var p=prepared[0],ms=dateMs(p.cutoffAt)-now.getTime();return {kind:'order',level:ms<=3*3600000?'critical':'warning',title:'Commande préparée à valider',detail:p.supplier+(p.cutoffAt?' · limite '+p.cutoffAt:''),route:'inventory',sourceId:p.id};}
    var sent=(snapshot.orders||[]).filter(function(x){return x.status==='sent';});
    if(sent.length)return {kind:'order',level:'warning',title:'Commande envoyée · confirmation attendue',detail:sent[0].supplier,route:'inventory',sourceId:sent[0].id};
    var partial=(snapshot.orders||[]).filter(function(x){return x.status==='partial';});
    if(partial.length)return {kind:'order',level:'warning',title:'Réception partielle à contrôler',detail:partial[0].supplier,route:'inventory',sourceId:partial[0].id};
    var critical=(snapshot.stock&&snapshot.stock.items||[]).filter(function(x){return x.state==='rupture'||x.state==='critical';});
    if(critical.length)return {kind:'stock',level:'warning',title:'Stock à contrôler',detail:critical[0].name,route:'inventory',sourceId:critical[0].id};
    return null;
  }
  function summarize(snapshot,now){
    var items=snapshot.stock&&snapshot.stock.items||[],counts=orderCounts(snapshot.orders),open=(snapshot.incidents||[]).filter(function(x){return x.open;}).length;
    return {products:items.length,knownStock:items.filter(function(x){return x.onHand!=null;}).length,unknownStock:items.filter(function(x){return x.onHand==null;}).length,criticalStock:items.filter(function(x){return x.state==='critical'||x.state==='rupture';}).length,suppliers:(snapshot.suppliers||[]).length,openIncidents:open,orders:counts,activeOrders:(snapshot.orders||[]).filter(function(x){return ACTIVE[x.status];}).length,nextAction:chooseAction(snapshot,now)};
  }
  function buildInventorySnapshot(db,opts){
    opts=opts||{};var now=opts.now instanceof Date?opts.now:new Date(opts.now||Date.now()),sid=txt(opts.siteId||db&&db.site,100),map=productMap(db||{},sid),catalog=buildCatalog(db||{},Object.assign({},opts,{siteId:sid,now:now})),stock=stockRows(db||{},sid,catalog),orders=preparedOrders(opts.prepared,sid,map).concat(storedOrders(db||{},sid,map)),demand=db&&db.demandBridge&&db.demandBridge.schema===DEMAND_SCHEMA?clone(db.demandBridge):null;
    var snapshot={schema:SCHEMA,version:VERSION,bridgeVersion:BRIDGE_VERSION,generatedAt:now.toISOString(),source:'verdict-inventory',responsibilities:RESPONSIBILITIES,server:{stored:!!opts.serverStored,revision:Math.max(0,Number(opts.serverRevision)||0)},account:{id:txt(opts.accountId,120),scope:txt(opts.accountScope,120),verified:!!opts.accountVerified},establishment:{id:sid,name:siteName(db||{},sid)},demo:!!opts.demo,stock:{items:stock},catalog:catalog,demand:demand,suppliers:supplierRows(db||{},sid,now,opts.ordering),incidents:incidentRows(db||{},sid,map),orders:orders,policy:{unknownIsNeverZero:true,preparedIsNotSent:true,sentIsNotConfirmed:true,confirmationIsNotAvailability:true,availabilityRequiresEvidence:true,inventoryOwnsPriceAndStock:true,verdictOwnsRecipesAndDemand:true,targetRequiresUserConfirmation:true}};
    snapshot.summary=summarize(snapshot,now);snapshot.fingerprint=hash(JSON.stringify({account:snapshot.account,establishment:snapshot.establishment,stock:snapshot.stock,catalog:snapshot.catalog,demand:snapshot.demand,suppliers:snapshot.suppliers,incidents:snapshot.incidents,orders:snapshot.orders}));return snapshot;
  }
  function validate(snapshot){
    var errors=[];if(!snapshot||typeof snapshot!=='object')return {ok:false,errors:['snapshot-required']};
    if(snapshot.schema!==SCHEMA)errors.push('schema');if(snapshot.version!==VERSION)errors.push('version');
    if(!snapshot.establishment||!txt(snapshot.establishment.id))errors.push('establishment-id');if(!iso(snapshot.generatedAt))errors.push('generated-at');
    (snapshot.stock&&snapshot.stock.items||[]).forEach(function(x){if(x.onHand!==null&&(!Number.isFinite(Number(x.onHand))||Number(x.onHand)<0))errors.push('stock-value');});
    (snapshot.orders||[]).forEach(function(x){if(STATUSES.indexOf(x.status)<0)errors.push('order-status');if(x.status==='prepared'&&x.supplierConfirmation!=='unconfirmed')errors.push('prepared-confirmation');if(x.status==='sent'&&x.supplierConfirmation!=='unconfirmed')errors.push('sent-confirmation');if(x.availability==='confirmed'&&!txt(x.availabilityEvidence))errors.push('availability-evidence');});
    (snapshot.incidents||[]).forEach(function(x){if(x.availability==='confirmed'&&!txt(x.availabilityEvidence))errors.push('incident-availability-evidence');});
    if(snapshot.catalog){var cv=validateCatalog(snapshot.catalog);if(!cv.ok)errors=errors.concat(cv.errors);if(txt(snapshot.catalog.establishment&&snapshot.catalog.establishment.id,100)!==txt(snapshot.establishment&&snapshot.establishment.id,100))errors.push('catalog-establishment-mismatch');}
    if(snapshot.demand){var dv=validateDemand(snapshot.demand);if(!dv.ok)errors=errors.concat(dv.errors);if(txt(snapshot.demand.establishment&&snapshot.demand.establishment.id,100)!==txt(snapshot.establishment&&snapshot.establishment.id,100))errors.push('demand-establishment-mismatch');}
    return {ok:errors.length===0,errors:errors.filter(function(x,i,a){return a.indexOf(x)===i;})};
  }
  function accept(current,incoming,opts){
    opts=opts||{};var next=clone(incoming),v=validate(next);if(!v.ok)return {ok:false,reason:'invalid',errors:v.errors,snapshot:current||null};
    if(next.demo&&!opts.allowDemo)return {ok:false,reason:'demo-isolated',snapshot:current||null};
    var expectedId=txt(opts.expectedAccountId||opts.accountId,120),expectedScope=txt(opts.expectedAccountScope||opts.accountScope,120),expectedEstablishmentId=txt(opts.expectedEstablishmentId||opts.siteId||opts.linkedSiteId,100);
    if(expectedId&&expectedId!==txt(next.account&&next.account.id,120))return {ok:false,reason:'account-mismatch',snapshot:current||null};
    if(expectedScope&&expectedScope!==txt(next.account&&next.account.scope,120))return {ok:false,reason:'account-mismatch',snapshot:current||null};
    if(expectedEstablishmentId&&expectedEstablishmentId!==txt(next.establishment&&next.establishment.id,100))return {ok:false,reason:'establishment-mismatch',snapshot:current||null};
    if(current&&validate(current).ok&&txt(current.establishment.id,100)===txt(next.establishment.id,100)){
      var cr=Number(current.server&&current.server.revision)||0,nr=Number(next.server&&next.server.revision)||0,ct=Date.parse(current.generatedAt)||0,nt=Date.parse(next.generatedAt)||0;
      if((cr&&nr&&nr<cr)||(!nr&&nt<ct))return {ok:false,reason:'stale',snapshot:current};
      if(current.fingerprint===next.fingerprint){
        var provenanceUpgrade=!!(next.server&&next.server.stored)&&!(current.server&&current.server.stored),accountUpgrade=!!(next.account&&next.account.verified)&&!(current.account&&current.account.verified);
        if(!provenanceUpgrade&&!accountUpgrade)return {ok:true,changed:false,reason:'unchanged',snapshot:current};
      }
    }
    next.summary=summarize(next,opts.now);return {ok:true,changed:true,reason:'accepted',snapshot:next};
  }
  function safeContext(snapshot){
    if(!snapshot||!validate(snapshot).ok)return null;var s=snapshot.summary||summarize(snapshot);
    return {schema:SCHEMA,generated_at:snapshot.generatedAt,server_stored:!!(snapshot.server&&snapshot.server.stored),establishment_id:snapshot.establishment.id,stock:{products:s.products,known:s.knownStock,unknown:s.unknownStock,critical:s.criticalStock},catalog:{items:snapshot.catalog&&snapshot.catalog.items?snapshot.catalog.items.length:0,priced:snapshot.catalog&&snapshot.catalog.items?snapshot.catalog.items.filter(function(x){return x.purchasePrice&&x.purchasePrice.amount!=null;}).length:0,fingerprint:snapshot.catalog&&snapshot.catalog.fingerprint||''},demand:{linked:!!snapshot.demand,products:snapshot.demand&&snapshot.demand.products?snapshot.demand.products.length:0,as_of:snapshot.demand&&snapshot.demand.asOf||''},suppliers:s.suppliers,open_incidents:s.openIncidents,orders:s.orders,next_action:s.nextAction,doctrine:'inventory_observes_and_prices_verdict_calculates_demand_supplier_confirms'};
  }

  return {version:VERSION,schema:SCHEMA,bridgeVersion:BRIDGE_VERSION,catalogSchema:CATALOG_SCHEMA,demandSchema:DEMAND_SCHEMA,responsibilities:RESPONSIBILITIES,statuses:STATUSES.slice(),activeStatuses:Object.assign({},ACTIVE),status:status,statusLabel:statusLabel,catalogItemId:catalogItemId,buildCatalog:buildCatalog,validateCatalog:validateCatalog,previewCatalogImport:previewCatalogImport,applyCatalogImport:applyCatalogImport,applyCatalogToIngredients:applyCatalogToIngredients,buildDemandSnapshot:buildDemandSnapshot,validateDemand:validateDemand,aggregateDemand:aggregateDemand,previewDemandImport:previewDemandImport,applyDemandImport:applyDemandImport,buildInventorySnapshot:buildInventorySnapshot,validate:validate,accept:accept,summarize:summarize,chooseAction:chooseAction,safeContext:safeContext,hash:hash};
});

