
/* Verdict® — moteur de préparation des commandes fournisseurs V1.
   Calcul déterministe uniquement : aucune disponibilité, aucun prix et aucun
   horaire ne sont inventés. L'interface doit faire confirmer chaque commande. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.VerdictOrdering=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  var DAY_MS=86400000;
  var DAYS=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

  function str(v){return String(v==null?'':v).trim();}
  function num(v){var s=String(v==null?'':v).trim();if(!s)return null;var n=Number(s.replace(',','.'));return Number.isFinite(n)?n:null;}
  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
  function pad(n){return String(n).padStart(2,'0');}
  function keyName(v){return str(v).toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
  function localDate(v){
    if(v instanceof Date)return isNaN(v.getTime())?null:new Date(v.getTime());
    var s=str(v);if(!s)return null;
    var m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if(m){var d=new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0),+(m[6]||0),0);return isNaN(d.getTime())?null:d;}
    var x=new Date(s);return isNaN(x.getTime())?null:x;
  }
  function dateKey(v){var d=localDate(v);return d?d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()):'';}
  function endOfDay(v){var d=localDate(v);if(!d)return null;d.setHours(23,59,59,999);return d;}
  /* Une date simple signifie « avant la fin de cette journée ». Un horodatage
     explicite (ex. demain 11 h 30) reste exact : un besoin avant le service ne
     doit jamais être traité comme s'il pouvait arriver à 23 h 59. */
  function needMoment(v){var s=str(v),d=localDate(v);if(!d)return null;return /[T ]\d{2}:\d{2}/.test(s)?d:endOfDay(d);}
  function addDays(v,n){var d=localDate(v);if(!d)return null;d.setDate(d.getDate()+Number(n||0));return d;}
  function withTime(v,hhmm){var d=localDate(v),m=str(hhmm).match(/^(\d{1,2}):(\d{2})$/);if(!d||!m)return null;d.setHours(clamp(+m[1],0,23),clamp(+m[2],0,59),0,0);return d;}
  function isoLocal(v){var d=localDate(v);return d?dateKey(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes()):'';}

  function ruleValid(rule,cutoffDate){
    var k=dateKey(cutoffDate),from=str(rule.validFrom).slice(0,10),to=str(rule.validTo).slice(0,10);
    return (!from||k>=from)&&(!to||k<=to)&&rule.active!==false;
  }
  function normalizedRule(rule){
    rule=rule||{};
    var od=num(rule.orderDay),dd=num(rule.deliveryDay);od=od==null?null:Math.round(od);dd=dd==null?null:Math.round(dd);
    return {id:str(rule.id),label:str(rule.label),orderDay:od>=0&&od<=6?od:null,cutoff:str(rule.cutoff),deliveryDay:dd>=0&&dd<=6?dd:null,deliveryStart:str(rule.deliveryStart),deliveryEnd:str(rule.deliveryEnd),validFrom:str(rule.validFrom).slice(0,10),validTo:str(rule.validTo).slice(0,10),active:rule.active!==false};
  }
  function closedDate(profile,v){
    var k=dateKey(v),a=profile&&Array.isArray(profile.closedDates)?profile.closedDates:[];
    for(var i=0;i<a.length;i++)if(str(a[i]).slice(0,10)===k)return true;
    return false;
  }
  function normalizedWeek(week){
    var source=Array.isArray(week)?week:[],out=[];
    for(var i=0;i<7;i++){var d=source[i]||{},state=/^(open|closed|no-access)$/.test(str(d.state))?str(d.state):(d.open===false?'closed':'open');out.push({state:state,openAt:str(d.openAt),closeAt:str(d.closeAt),services:Math.max(0,Math.round(num(d.services)==null?(state==='open'?2:0):num(d.services)))});}
    return out;
  }
  function calendarDay(calendar,v){
    var d=localDate(v),k=dateKey(d),base=normalizedWeek(calendar&&calendar.week)[d?d.getDay():0],source='habituel',label='';
    if(!d)return {state:'no-access',openAt:'',closeAt:'',services:0,source:'invalide',label:''};
    var seasons=calendar&&Array.isArray(calendar.seasons)?calendar.seasons:[],chosen=null;
    seasons.forEach(function(s){var from=str(s&&s.from).slice(0,10),to=str(s&&s.to).slice(0,10);if((!from||k>=from)&&(!to||k<=to))chosen=s;});
    if(chosen){base=normalizedWeek(chosen.week)[d.getDay()];source='saison';label=str(chosen.label);}
    var exceptions=calendar&&Array.isArray(calendar.exceptions)?calendar.exceptions:[],exact=null;
    exceptions.forEach(function(x){if(str(x&&x.date).slice(0,10)===k)exact=x;});
    if(exact){var state=/^(open|closed|no-access)$/.test(str(exact.state))?str(exact.state):base.state;base={state:state,openAt:str(exact.openAt)||base.openAt,closeAt:str(exact.closeAt)||base.closeAt,services:num(exact.services)==null?(state==='open'?base.services:0):Math.max(0,Math.round(num(exact.services)))};source='exception';label=str(exact.note);}
    return {state:base.state,openAt:base.openAt,closeAt:base.closeAt,services:base.state==='open'?base.services:0,source:source,label:label};
  }
  function deliveryAccess(profile,calendar,v){
    var day=calendarDay(calendar,v),access=profile&&profile.deliveryAccess||{},mode=/^(forbidden|staff|supplier)$/.test(str(access.closedDayMode))?str(access.closedDayMode):'forbidden';
    if(day.state==='open')return {allowed:true,mode:'open',receiptStatus:'controlled',day:day};
    if(day.state==='no-access')return {allowed:false,mode:'forbidden',receiptStatus:'blocked',day:day};
    if(mode==='staff')return {allowed:true,mode:'staff',receiptStatus:'controlled',day:day};
    if(mode==='supplier'&&access.supplierMayEnter===true)return {allowed:true,mode:'supplier',receiptStatus:'pending-check',day:day};
    return {allowed:false,mode:'forbidden',receiptStatus:'blocked',day:day};
  }
  function openCoverage(calendar,from,to){
    var a=localDate(from),b=localDate(to),days=0,services=0,details=[];if(!a||!b||a>b)return {days:0,services:0,details:[]};
    a=new Date(a.getFullYear(),a.getMonth(),a.getDate());b=new Date(b.getFullYear(),b.getMonth(),b.getDate());
    for(var i=0;a<=b&&i<370;i++,a=addDays(a,1)){var info=calendarDay(calendar,a);if(info.state==='open'){days++;services+=info.services;details.push({date:dateKey(a),services:info.services,source:info.source});}}
    return {days:days,services:services,details:details};
  }
  function nextWindows(profile,now,lookAhead,options){
    options=options||{};var calendar=options.calendar||profile&&profile.establishmentCalendar||null;
    now=localDate(now)||new Date();lookAhead=clamp(Math.round(num(lookAhead)||35),1,120);
    var out=[],rules=(profile&&Array.isArray(profile.rules)?profile.rules:[]).map(normalizedRule);
    for(var ri=0;ri<rules.length;ri++){
      var r=rules[ri];if(r.orderDay==null||r.deliveryDay==null||!/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(r.cutoff))continue;
      for(var i=0;i<=lookAhead;i++){
        var day=addDays(new Date(now.getFullYear(),now.getMonth(),now.getDate()),i);if(day.getDay()!==r.orderDay)continue;
        var cutoff=withTime(day,r.cutoff);if(!cutoff||cutoff<now||!ruleValid(r,cutoff))continue;
        var delta=(r.deliveryDay-r.orderDay+7)%7;
        var deliveryDay=addDays(day,delta),deliveryStart=withTime(deliveryDay,r.deliveryStart||'00:00'),deliveryEnd=withTime(deliveryDay,r.deliveryEnd||r.deliveryStart||'23:59');
        if(delta===0&&deliveryStart&&deliveryStart<=cutoff){deliveryDay=addDays(deliveryDay,7);deliveryStart=withTime(deliveryDay,r.deliveryStart||'00:00');deliveryEnd=withTime(deliveryDay,r.deliveryEnd||r.deliveryStart||'23:59');}
        if(closedDate(profile,day)||closedDate(profile,deliveryDay))continue;
        var access=deliveryAccess(profile,calendar,deliveryDay);if(calendar&&!access.allowed)continue;
        out.push({ruleId:r.id,label:r.label,cutoffAt:isoLocal(cutoff),deliveryAt:isoLocal(deliveryStart),deliveryEndAt:isoLocal(deliveryEnd),orderDay:r.orderDay,deliveryDay:r.deliveryDay,deliveryAccess:access.mode,receiptStatus:access.receiptStatus,calendarSource:access.day.source});
      }
    }
    out.sort(function(a,b){return localDate(a.cutoffAt)-localDate(b.cutoffAt);});
    return out;
  }
  function missedWindow(profile,now,requiredDate,options){
    options=options||{};var calendar=options.calendar||profile&&profile.establishmentCalendar||null;
    now=localDate(now)||new Date();var need=needMoment(requiredDate);if(!need)return null;
    var rules=(profile&&Array.isArray(profile.rules)?profile.rules:[]).map(normalizedRule),best=null;
    for(var ri=0;ri<rules.length;ri++){
      var r=rules[ri];if(r.orderDay==null||r.deliveryDay==null||!/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(r.cutoff))continue;
      for(var i=-14;i<=0;i++){
        var day=addDays(new Date(now.getFullYear(),now.getMonth(),now.getDate()),i);if(day.getDay()!==r.orderDay)continue;
        var cutoff=withTime(day,r.cutoff);if(!cutoff||cutoff>=now||!ruleValid(r,cutoff))continue;
        var delta=(r.deliveryDay-r.orderDay+7)%7,deliveryDay=addDays(day,delta),deliveryStart=withTime(deliveryDay,r.deliveryStart||'00:00'),deliveryEnd=withTime(deliveryDay,r.deliveryEnd||r.deliveryStart||'23:59');
        if(delta===0&&deliveryStart&&deliveryStart<=cutoff){deliveryDay=addDays(deliveryDay,7);deliveryStart=withTime(deliveryDay,r.deliveryStart||'00:00');deliveryEnd=withTime(deliveryDay,r.deliveryEnd||r.deliveryStart||'23:59');}
        var access=deliveryAccess(profile,calendar,deliveryDay);
        if(closedDate(profile,day)||closedDate(profile,deliveryDay)||(calendar&&!access.allowed)||!deliveryStart||deliveryStart>need||!deliveryEnd||deliveryEnd<now)continue;
        var win={ruleId:r.id,label:r.label,cutoffAt:isoLocal(cutoff),deliveryAt:isoLocal(deliveryStart),deliveryEndAt:isoLocal(deliveryEnd),orderDay:r.orderDay,deliveryDay:r.deliveryDay,deliveryAccess:access.mode,receiptStatus:access.receiptStatus,calendarSource:access.day.source};
        if(!best||localDate(win.cutoffAt)>localDate(best.cutoffAt))best=win;
      }
    }
    if(best)best.urgency=urgency(best,now);return best;
  }
  function urgency(win,now){
    if(!win)return {key:'unknown',label:'Horaire à renseigner',minutes:null};
    now=localDate(now)||new Date();var cut=localDate(win.cutoffAt),m=cut?Math.floor((cut-now)/60000):null;
    if(m==null)return {key:'unknown',label:'Horaire à vérifier',minutes:null};
    if(m<0)return {key:'missed',label:'Limite dépassée',minutes:m};
    if(m<=30)return {key:'critical',label:m+' min restantes',minutes:m};
    if(m<=180)return {key:'urgent',label:Math.floor(m/60)+' h '+pad(m%60)+' restantes',minutes:m};
    if(m<=1440)return {key:'soon',label:Math.floor(m/60)+' h '+pad(m%60)+' restantes',minutes:m};
    var d=Math.floor(m/1440),h=Math.floor((m%1440)/60);return {key:'planned',label:d+' j '+h+' h',minutes:m};
  }
  function selectWindow(profile,now,requiredDate,options){
    options=options||{};var urgent=options.mode==='urgent',wins=nextWindows(profile,now,42,options),need=needMoment(requiredDate),chosen=null,missed=missedWindow(profile,now,requiredDate,options);
    if(need){
      var feasible=wins.filter(function(x){var delivery=localDate(x.deliveryAt);return delivery&&delivery<=need;});
      /* Normal : garder le passage le plus proche du besoin pour éviter de
         surstocker. Urgence : retenir l'arrivée la plus rapide connue. */
      feasible.sort(function(a,b){var da=localDate(a.deliveryAt),db=localDate(b.deliveryAt);if(+da!==+db)return urgent?da-db:db-da;return localDate(a.cutoffAt)-localDate(b.cutoffAt);});
      chosen=feasible[0]||null;
    }
    if(!chosen)chosen=wins[0]||null;
    if(chosen){chosen=Object.assign({},chosen);chosen.feasible=!need||!!(localDate(chosen.deliveryAt)&&localDate(chosen.deliveryAt)<=need);chosen.urgency=urgency(chosen,now);chosen.missedForNeed=chosen.feasible?null:missed;}
    return chosen;
  }
  function profileFor(profiles,supplier){
    var k=keyName(supplier),p=null;
    if(Array.isArray(profiles)){for(var i=0;i<profiles.length;i++)if(keyName(profiles[i]&&profiles[i].name)===k){p=profiles[i];break;}}
    else if(profiles&&typeof profiles==='object'){p=profiles[k]||profiles[supplier]||null;if(!p){Object.keys(profiles).some(function(x){if(keyName((profiles[x]&&profiles[x].name)||x)===k){p=profiles[x];return true;}return false;});}}
    return p;
  }
  function offersOf(product){
    product=product||{};var out=[],seen={};
    function add(o,primary){o=o||{};var supplier=str(o.supplier||o.sup);if(!supplier)return;var k=keyName(supplier);if(seen[k])return;seen[k]=1;out.push({supplier:supplier,sku:str(o.sku),pack:Math.max(.0001,num(o.pack)||1),unit:str(o.unit||product.unit),price:Math.max(0,num(o.price)||0),priceDate:str(o.priceDate).slice(0,10),priority:primary?0:Math.max(1,Math.round(num(o.priority)||out.length)),primary:!!primary,note:str(o.note)});}
    add({supplier:product.sup,sku:product.sku,pack:product.pack,unit:product.unit,price:product.price,priceDate:product.priceDate},true);
    (Array.isArray(product.offers)?product.offers:[]).forEach(function(o){add(o,false);});return out;
  }
  function route(product,profiles,now,requiredDate,options){
    options=options||{};var mode=options.mode==='urgent'?'urgent':'normal',preferred=keyName(options.preferredSupplier),offers=offersOf(product),evaluated=offers.map(function(o){var p=profileFor(profiles,o.supplier),win=selectWindow(p,now,requiredDate,{mode:mode,calendar:options.calendar});return {offer:o,profile:p,window:win,knownSchedule:!!(p&&p.rules&&p.rules.length),feasible:!!(win&&win.feasible)};});
    var primary=evaluated.filter(function(x){return x.offer.primary;})[0]||evaluated[0]||null,chosen=null;
    if(preferred)chosen=evaluated.filter(function(x){return keyName(x.offer.supplier)===preferred;})[0]||null;
    if(!chosen&&mode==='urgent'){
      /* Une rupture réelle classe d'abord l'arrivée connue la plus rapide.
         Si aucun passage n'arrive avant le besoin, on montre tout de même la
         première livraison future, au lieu de retomber aveuglément sur le
         fournisseur principal. */
      var urgentPool=evaluated.filter(function(x){return x.feasible&&x.window;});
      if(!urgentPool.length)urgentPool=evaluated.filter(function(x){return !!x.window;});
      urgentPool.sort(function(a,b){var da=localDate(a.window.deliveryAt),db=localDate(b.window.deliveryAt);if(+da!==+db)return da-db;var va=a.profile&&a.profile.verified?0:1,vb=b.profile&&b.profile.verified?0:1;if(va!==vb)return va-vb;return a.offer.priority-b.offer.priority;});
      chosen=urgentPool[0]||null;
    }
    if(!chosen&&primary&&primary.feasible)chosen=primary;
    if(!chosen){var feasible=evaluated.filter(function(x){return x.feasible;});feasible.sort(function(a,b){var pa=a.offer.priority-b.offer.priority;if(pa)return pa;var da=localDate(a.window.deliveryAt),db=localDate(b.window.deliveryAt);return da-db;});chosen=feasible[0]||null;}
    if(!chosen&&primary)chosen=primary;
    if(!chosen&&evaluated.length)chosen=evaluated[0];
    var risks=[];if(!chosen)risks.push('supplier-missing');else{if(!chosen.knownSchedule)risks.push('schedule-unknown');if(chosen.window&&chosen.window.missedForNeed)risks.push('cutoff-missed');if(chosen.window&&!chosen.window.feasible)risks.push('delivery-after-need');if(!chosen.offer.price)risks.push('price-unknown');if(chosen!==primary)risks.push('alternative-selected');}
    return {chosen:chosen,primary:primary,offers:evaluated,risks:risks,mode:mode};
  }
  function roundOrder(raw,pack,minOrder){
    raw=Math.max(0,num(raw)||0);pack=Math.max(.0001,num(pack)||1);minOrder=Math.max(0,num(minOrder)||0);
    var qty=raw>0?Math.ceil((raw-1e-9)/pack)*pack:0;if(qty>0&&minOrder>qty)qty=Math.ceil((minOrder-1e-9)/pack)*pack;
    qty=Math.round(qty*1000)/1000;return {raw:raw,pack:pack,quantity:qty,packages:qty?Math.ceil((qty-1e-9)/pack):0,overage:Math.max(0,Math.round((qty-raw)*1000)/1000)};
  }
  function priceFreshness(priceDate,now){
    var d=localDate(priceDate),n=localDate(now)||new Date();if(!d)return {key:'unknown',days:null,label:'Prix non daté'};
    var days=Math.max(0,Math.floor((new Date(n.getFullYear(),n.getMonth(),n.getDate())-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/DAY_MS));
    if(days<=7)return {key:'fresh',days:days,label:'Prix observé il y a '+days+' j'};
    if(days<=30)return {key:'aging',days:days,label:'Prix observé il y a '+days+' j'};
    return {key:'stale',days:days,label:'Prix ancien · '+days+' j'};
  }
  /* Un besoin saisi est un total à couvrir pour une date, pas une quantité
     aveuglément ajoutée au manque de stock. Le premier besoin daté absorbe donc
     le plus élevé entre le manque calculé et le total saisi. Les dates suivantes
     restent des lignes indépendantes. Une quantité déjà commandée n'est imputée
     que si sa livraison connue arrive au plus tard le jour du besoin. */
  function allocateDemandBuckets(autoQty,manualNeeds,incoming){
    autoQty=Math.max(0,num(autoQty)||0);manualNeeds=Array.isArray(manualNeeds)?manualNeeds:[];incoming=Array.isArray(incoming)?incoming:[];
    var byDate={},dates=[];
    manualNeeds.forEach(function(x){
      x=x||{};var k=str(x.requiredDate).slice(0,10),q=Math.max(0,num(x.qtyBase)||0);if(!q)return;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(k))k='';
      if(!byDate[k]){byDate[k]={requiredDate:k,requiredAt:'',manualQty:0,sourceNeedIds:[],needs:[],routingMode:'normal',supplierPreference:''};dates.push(k);}
      /* Chaque saisie est un total pour la date. Deux saisies du même besoin
         ne doivent donc jamais être additionnées : on conserve le total le
         plus élevé et toutes les références de suivi associées. */
      byDate[k].manualQty=Math.round(Math.max(byDate[k].manualQty,q)*1000)/1000;byDate[k].needs.push(x);if(str(x.id))byDate[k].sourceNeedIds.push(str(x.id));
      var at=isoLocal(x.requiredAt);if(at&&(!byDate[k].requiredAt||localDate(at)<localDate(byDate[k].requiredAt)))byDate[k].requiredAt=at;
      if(x.routingMode==='urgent'||x.priority==='urgent')byDate[k].routingMode='urgent';
      if(str(x.supplierPreference))byDate[k].supplierPreference=str(x.supplierPreference);
    });
    dates.sort(function(a,b){if(!a)return 1;if(!b)return -1;return a.localeCompare(b);});
    var buckets=dates.map(function(k){return byDate[k];});
    if(!buckets.length&&autoQty>0)buckets.push({requiredDate:'',requiredAt:'',manualQty:0,sourceNeedIds:[],needs:[],routingMode:'normal',supplierPreference:''});
    if(buckets.length){buckets[0].autoQty=autoQty;buckets[0].gross=Math.max(autoQty,buckets[0].manualQty);}
    for(var bi=1;bi<buckets.length;bi++){buckets[bi].autoQty=0;buckets[bi].gross=buckets[bi].manualQty;}
    var arrivals=incoming.map(function(x,i){x=x||{};return {id:str(x.id)||'incoming-'+i,deliveryAt:str(x.deliveryAt),remaining:Math.max(0,num(x.quantity)||0)};}).filter(function(x){return x.remaining>0;}).sort(function(a,b){var da=localDate(a.deliveryAt),db=localDate(b.deliveryAt);if(da&&db)return da-db;if(da)return -1;if(db)return 1;return a.id.localeCompare(b.id);});
    buckets.forEach(function(b){
      var due=b.requiredAt?needMoment(b.requiredAt):(b.requiredDate?endOfDay(b.requiredDate):null),covered=0;
      arrivals.forEach(function(a){if(a.remaining<=0)return;var delivery=localDate(a.deliveryAt);if(due&&(!delivery||delivery>due))return;var take=Math.min(a.remaining,Math.max(0,b.gross-covered));if(take>0){a.remaining-=take;covered+=take;}});
      b.onOrder=Math.round(covered*1000)/1000;b.raw=Math.round(Math.max(0,b.gross-b.onOrder)*1000)/1000;
      b.source=b.autoQty>0&&b.manualQty>0?'Stock ou besoin total · le plus élevé':(b.manualQty>0?'Besoin total saisi':'Manque de stock');
    });
    return buckets;
  }
  function readiness(group,now){
    group=group||{};var blockers=[],rows=Array.isArray(group.rows)?group.rows:[],p=group.profile||null,win=group.window||null;
    function add(k){if(blockers.indexOf(k)<0)blockers.push(k);}
    if(!keyName(group.supplier)||keyName(group.supplier)==='sans fournisseur')add('supplier-missing');
    if(!p||!Array.isArray(p.rules)||!p.rules.length)add('schedule-unknown');
    if(!p||!p.verified||!/^\d{4}-\d{2}-\d{2}$/.test(str(p.verifiedAt)))add('schedule-unverified');
    if(!win)add('schedule-unknown');
    else{
      if(win.feasible===false)add('delivery-after-need');
      if(win.missedForNeed)add('cutoff-missed');
      var u=win.urgency||urgency(win,now);if(u&&u.key==='missed')add('cutoff-missed');
    }
    rows.forEach(function(r){
      r=r||{};if(!str(r.sku))add('reference-missing');if(!(num(r.price)>0))add('price-unknown');
      var fresh=priceFreshness(r.priceDate,now);if(fresh.key==='unknown')add('price-undated');else if(fresh.key==='stale')add('price-stale');
      (r.route&&Array.isArray(r.route.risks)?r.route.risks:[]).forEach(function(k){if(k!=='alternative-selected')add(k);});
      if((r.requiredAt||r.requiredDate)&&win){var delivery=localDate(win.deliveryAt),due=needMoment(r.requiredAt||r.requiredDate);if(!delivery||!due||delivery>due)add('delivery-after-need');}
    });
    var minimum=Math.max(0,num(p&&p.minValue)||0),total=Math.max(0,num(group.total)||0);if(minimum>0&&total<minimum)add('minimum-not-met');
    return {ready:blockers.length===0,blockers:blockers};
  }
  function formatDateTime(v){var d=localDate(v);if(!d)return '—';return DAYS[d.getDay()]+' '+pad(d.getDate())+'/'+pad(d.getMonth()+1)+' · '+pad(d.getHours())+':'+pad(d.getMinutes());}
  function formatDelivery(win){if(!win)return 'Livraison inconnue';var a=localDate(win.deliveryAt),b=localDate(win.deliveryEndAt);if(!a)return 'Livraison inconnue';return DAYS[a.getDay()]+' '+pad(a.getDate())+'/'+pad(a.getMonth()+1)+' · '+pad(a.getHours())+':'+pad(a.getMinutes())+(b?'–'+pad(b.getHours())+':'+pad(b.getMinutes()):'');}
  function safeUrl(v){try{var u=new URL(str(v),typeof location!=='undefined'?location.href:'https://verdict.invalid/');return /^https?:$/.test(u.protocol)?u.href:'';}catch(e){return '';}}

  /* Transition pure et traçable du dialogue d'urgence. Refuser la livraison
     trop tardive couvre seulement l'urgence locale ; le réapprovisionnement
     reste « à décider » jusqu'à une réponse explicite. */
  function applyEmergencyDecision(incident,action,details){
    var out=Object.assign({},incident||{}),d=details||{},at=str(d.at)||new Date().toISOString();out.history=Array.isArray(out.history)?out.history.slice():[];
    if(action==='prepare-supplier'){out.status='supplier-prepared';out.supplierDecision='prepared';}
    else if(action==='local-purchase'){out.status='local-purchase-planned';out.urgentCoverage='local-store';out.replenishmentStatus='pending-decision';}
    else if(action==='plan-replenishment'){out.status='local-and-replenishment-planned';out.replenishmentStatus='planned';out.replenishmentNeedId=str(d.needId);out.supplierPreference=str(d.supplierPreference);}
    else if(action==='skip-replenishment'){out.status='local-purchase-planned';out.replenishmentStatus='not-planned';}
    else if(action==='local-complete'){out.localPurchaseStatus='completed';}
    else if(action==='resolve'){out.status='resolved';out.resolvedAt=at;}
    else return out;
    out.updatedAt=at;out.history.push({action:action,at:at,note:str(d.note)});return out;
  }

  function cp1252Byte(ch){
    var code=ch.charCodeAt(0);if(code<=255)return code;
    var map={'€':128,'‚':130,'ƒ':131,'„':132,'…':133,'†':134,'‡':135,'ˆ':136,'‰':137,'Š':138,'‹':139,'Œ':140,'Ž':142,'‘':145,'’':146,'“':147,'”':148,'•':149,'–':150,'—':151,'˜':152,'™':153,'š':154,'›':155,'œ':156,'ž':158,'Ÿ':159};
    return map[ch]!=null?map[ch]:63;
  }
  function pdfLiteral(s){var out='';s=str(s).replace(/€/g,'EUR');for(var i=0;i<s.length;i++){var b=cp1252Byte(s.charAt(i));if(b===40||b===41||b===92)out+='\\'+String.fromCharCode(b);else if(b<32||b>126)out+='\\'+b.toString(8).padStart(3,'0');else out+=String.fromCharCode(b);}return out;}
  function wrap(text,max){text=str(text);max=max||92;if(!text)return [''];var words=text.split(/\s+/),lines=[],line='';words.forEach(function(w){if(w.length>max){if(line){lines.push(line);line='';}while(w.length>max){lines.push(w.slice(0,max));w=w.slice(max);}line=w;}else if(!line)line=w;else if((line+' '+w).length<=max)line+=' '+w;else{lines.push(line);line=w;}});if(line)lines.push(line);return lines;}
  function pdfBytes(title,lines){
    var flat=wrap(title,80).concat(['']);title='VERDICT - Commande et suivi';(lines||[]).forEach(function(x){wrap(x,80).forEach(function(y){flat.push(y);});});if(!flat.length)flat=['Aucune ligne'];
    var chunks=[];for(var i=0;i<flat.length;i+=49)chunks.push(flat.slice(i,i+49));
    var count=3+chunks.length*2,objs=new Array(count+1),kids=[];objs[1]='<< /Type /Catalog /Pages 2 0 R >>';objs[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>';
    chunks.forEach(function(page,pi){var pageId=4+pi*2,contentId=pageId+1,content='BT\n/F1 14 Tf\n40 805 Td\n('+pdfLiteral(title)+') Tj\n/F1 10 Tf\n0 -23 Td\n';kids.push(pageId+' 0 R');page.forEach(function(line,li){if(li)content+='0 -14 Td\n';content+='('+pdfLiteral(line)+') Tj\n';});content+='ET\n';objs[pageId]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents '+contentId+' 0 R >>';objs[contentId]='<< /Length '+content.length+' >>\nstream\n'+content+'endstream';});
    objs[2]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+chunks.length+' >>';
    var bin='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n',offsets=[0];for(i=1;i<=count;i++){offsets[i]=bin.length;bin+=i+' 0 obj\n'+objs[i]+'\nendobj\n';}var xref=bin.length;bin+='xref\n0 '+(count+1)+'\n0000000000 65535 f \n';for(i=1;i<=count;i++)bin+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';bin+='trailer\n<< /Size '+(count+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';var out=new Uint8Array(bin.length);for(i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i)&255;return out;
  }

  return {version:'1.4.0',days:DAYS,keyName:keyName,num:num,localDate:localDate,dateKey:dateKey,endOfDay:endOfDay,needMoment:needMoment,addDays:addDays,isoLocal:isoLocal,calendarDay:calendarDay,deliveryAccess:deliveryAccess,openCoverage:openCoverage,nextWindows:nextWindows,missedWindow:missedWindow,selectWindow:selectWindow,urgency:urgency,profileFor:profileFor,offersOf:offersOf,route:route,roundOrder:roundOrder,priceFreshness:priceFreshness,allocateDemandBuckets:allocateDemandBuckets,readiness:readiness,formatDateTime:formatDateTime,formatDelivery:formatDelivery,safeUrl:safeUrl,applyEmergencyDecision:applyEmergencyDecision,pdfBytes:pdfBytes};
});

