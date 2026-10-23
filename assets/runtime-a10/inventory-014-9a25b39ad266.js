
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
  var RESPONSIBILITIES=Object.freeze({scoreAuthority:'verdict-engine',inventoryRole:'observed-evidence-only',veraRole:'explain-and-route-only',supplierRole:'confirm-availability'});
  var STATUSES=['prepared','sent','confirmed','partial','received','cancelled'];
  var ACTIVE={prepared:1,sent:1,confirmed:1,partial:1};

  function txt(v,n){return String(v==null?'':v).trim().slice(0,n||240);}
  function finite(v){var n=Number(v);return Number.isFinite(n)?n:null;}
  function nonNegative(v,allowNull){var n=finite(v);if(n==null)return allowNull?null:0;return Math.max(0,n);}
  function iso(v){var d=v instanceof Date?v:new Date(v||0);return isNaN(d.getTime())?'':d.toISOString();}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return null;}}
  function hash(v){var s=String(v||''),h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return ('00000000'+(h>>>0).toString(16)).slice(-8);}
  function key(v){return txt(v,180).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
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
  /* C312 (V16-054) : comptage de l'équipe reçu (produits comptés par un autre prénom que celui du patron, dans les 36 h) : qui, quand, combien. */
  function comptageEquipe(db,sid,now){var patron=String(db&&db.profile&&db.profile.prenom||'').trim().toLowerCase(),par={};
    rows(db||{},sid).forEach(function(x){var p=x.p,by=String(p.countedBy||'').trim(),at=Date.parse(p.countedAt||'');if(!by||!isFinite(at)||by.toLowerCase()===patron||now.getTime()-at>36*3600000)return;
      if(!par[by])par[by]={by:txt(by,80),at:at,n:0};par[by].n++;if(at>par[by].at)par[by].at=at;});
    var l=Object.keys(par).map(function(k){return par[k];}).sort(function(a,b){return b.at-a.at;});return l.length?{by:l[0].by,at:new Date(l[0].at).toISOString(),products:l[0].n}:null;}
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
  function stockRows(db,sid){
    return rows(db,sid).map(function(x){
      var p=x.p,on=p.stock==null?null:finite(p.stock),minimum=Math.max(0,finite(p.min)||0),target=Math.max(0,finite(p.goal)||0),state='ok';
      if(on==null)state='unknown';else if(on===0)state='rupture';else if(minimum>0&&on<=minimum)state='critical';
      return {id:txt(p.id,100),space:txt(x.space,100),name:txt(p.name,160),unit:txt(p.unit,40),onHand:on==null?null:Math.max(0,on),minimum:minimum,target:target,supplier:txt(p.sup,160),state:state,observed:on!=null};
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
    /* C312 (V16-054) : « Comptage reçu de Camille · ven. 23/10 14:05 · 12 produits » (promis par « Accès du personnel »), avant les commandes. */
    var tc=snapshot.teamCount;if(tc&&!open.length){var quand=(function(v){try{var O=typeof globalThis!=='undefined'&&globalThis.VerdictOrdering;if(O&&typeof O.formatDateTime==='function')return O.formatDateTime(v);}catch(e){}return String(v).slice(0,16).replace('T',' ');})(tc.at);
      return {kind:'count',level:'info',title:'Comptage reçu de '+tc.by,detail:quand+' · '+tc.products+' produit'+(tc.products>1?'s':''),route:'inventory',sourceId:'count-'+tc.by+'-'+tc.at.slice(0,16),actorName:tc.by,reportedAt:tc.at};}
    if(open.length){var x=open[0];return {kind:'incident',level:'critical',title:'Rupture à décider',detail:x.productName+(x.requiredAt?' · nécessaire '+x.requiredAt:''),route:'inventory',sourceId:x.id,actorName:txt(x.actorName,100),reportedAt:txt(x.reportedAt,40)};}
    var prepared=(snapshot.orders||[]).filter(function(x){return x.status==='prepared';}).sort(function(a,b){return dateMs(a.cutoffAt)-dateMs(b.cutoffAt);});
    if(prepared.length){var p=prepared[0],ms=dateMs(p.cutoffAt)-now.getTime();return {kind:'order',level:ms<=3*3600000?'critical':'warning',title:'Commande préparée à valider',detail:p.supplier+(p.cutoffAt?' · limite '+(function(v){try{var O=typeof globalThis!=='undefined'&&globalThis.VerdictOrdering;if(O&&typeof O.formatDateTime==='function')return O.formatDateTime(v);}catch(e){}return String(v).replace('T',' ');})(p.cutoffAt):''),route:'inventory',sourceId:p.id};}
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
    opts=opts||{};var now=opts.now instanceof Date?opts.now:new Date(opts.now||Date.now()),sid=txt(opts.siteId||db&&db.site,100),map=productMap(db||{},sid),stock=stockRows(db||{},sid),orders=preparedOrders(opts.prepared,sid,map).concat(storedOrders(db||{},sid,map));
    var snapshot={schema:SCHEMA,version:VERSION,generatedAt:now.toISOString(),source:'verdict-inventory',responsibilities:RESPONSIBILITIES,server:{stored:!!opts.serverStored,revision:Math.max(0,Number(opts.serverRevision)||0)},account:{id:txt(opts.accountId,120),scope:txt(opts.accountScope,120),verified:!!opts.accountVerified},establishment:{id:sid,name:siteName(db||{},sid)},demo:!!opts.demo,stock:{items:stock},suppliers:supplierRows(db||{},sid,now,opts.ordering),incidents:incidentRows(db||{},sid,map),orders:orders,teamCount:comptageEquipe(db||{},sid,now),policy:{unknownIsNeverZero:true,preparedIsNotSent:true,sentIsNotConfirmed:true,confirmationIsNotAvailability:true,availabilityRequiresEvidence:true}};
    snapshot.summary=summarize(snapshot,now);snapshot.fingerprint=hash(JSON.stringify({account:snapshot.account,establishment:snapshot.establishment,stock:snapshot.stock,suppliers:snapshot.suppliers,incidents:snapshot.incidents,orders:snapshot.orders}));return snapshot;
  }
  function validate(snapshot){
    var errors=[];if(!snapshot||typeof snapshot!=='object')return {ok:false,errors:['snapshot-required']};
    if(snapshot.schema!==SCHEMA)errors.push('schema');if(snapshot.version!==VERSION)errors.push('version');
    if(!snapshot.establishment||!txt(snapshot.establishment.id))errors.push('establishment-id');if(!iso(snapshot.generatedAt))errors.push('generated-at');
    (snapshot.stock&&snapshot.stock.items||[]).forEach(function(x){if(x.onHand!==null&&(!Number.isFinite(Number(x.onHand))||Number(x.onHand)<0))errors.push('stock-value');});
    (snapshot.orders||[]).forEach(function(x){if(STATUSES.indexOf(x.status)<0)errors.push('order-status');if(x.status==='prepared'&&x.supplierConfirmation!=='unconfirmed')errors.push('prepared-confirmation');if(x.status==='sent'&&x.supplierConfirmation!=='unconfirmed')errors.push('sent-confirmation');if(x.availability==='confirmed'&&!txt(x.availabilityEvidence))errors.push('availability-evidence');});
    (snapshot.incidents||[]).forEach(function(x){if(x.availability==='confirmed'&&!txt(x.availabilityEvidence))errors.push('incident-availability-evidence');});
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
    return {schema:SCHEMA,generated_at:snapshot.generatedAt,server_stored:!!(snapshot.server&&snapshot.server.stored),establishment_id:snapshot.establishment.id,stock:{products:s.products,known:s.knownStock,unknown:s.unknownStock,critical:s.criticalStock},suppliers:s.suppliers,open_incidents:s.openIncidents,orders:s.orders,next_action:s.nextAction,doctrine:'inventory_observes_verdict_prioritizes_supplier_confirms'};
  }

  return {version:VERSION,schema:SCHEMA,responsibilities:RESPONSIBILITIES,statuses:STATUSES.slice(),activeStatuses:Object.assign({},ACTIVE),status:status,statusLabel:statusLabel,buildInventorySnapshot:buildInventorySnapshot,validate:validate,accept:accept,summarize:summarize,chooseAction:chooseAction,safeContext:safeContext,hash:hash};
});

