
/* Verdict® Inventaire — assistant de rupture urgente V1.
   Vera orchestre le moteur déterministe : elle ne confirme jamais un stock,
   un prix, un horaire ou une commande à la place du fournisseur. */
(function(w){
  'use strict';
  var O=w.VerdictOrdering,ACTIVE=null;
  if(!O||!w.document)return;

  function txt(v,n){return String(v==null?'':v).trim().slice(0,n||240);}
  function esc(v){return typeof w.esc==='function'?w.esc(v):txt(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
  function makeId(p){return (p||'inc')+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
  function nowIso(){return new Date().toISOString();}
  function reporter(){var u=w.ACCOUNT_USER||{},profile=w.DB&&w.DB.profile||{},name=txt(u.first_name||u.firstName||u.display_name||u.displayName||u.name||profile.prenom,80),role=txt(w.STAFF_ROLE||u.role_name||u.roleLabel||u.role,60);if(/@/.test(name))name=txt(profile.prenom,80);return {name:name,role:role};}
  function save(){if(typeof w.save==='function')w.save();if(typeof w.badge==='function')w.badge();if(w.VIEW==='order'&&typeof w.drawOrder==='function')w.drawOrder();}
  function rows(){var out=[];try{out=w.siteRows(w.DB.site)||[];}catch(e){}return out;}
  function product(incident){var a=rows();for(var i=0;i<a.length;i++)if(a[i].space===incident.space&&a[i].p.id===incident.productId)return a[i].p;return null;}
  function incident(id){return (w.DB.supplyIncidents||[]).find(function(x){return x.id===id;})||null;}
  function replaceIncident(next){var a=w.DB.supplyIncidents||[],i=a.findIndex(function(x){return x.id===next.id;});if(i>=0)a[i]=next;else a.push(next);w.DB.supplyIncidents=a;return next;}
  function profiles(){return w.DB.suppliersBySite&&w.DB.suppliersBySite[w.DB.site]||{};}
  function answer(){var el=document.getElementById('ordUrgentFlow');if(!el)el=document.getElementById('vInvAnswer');return el;}
  function show(html){var el=answer();if(!el)return;el.innerHTML=html;el.classList.add('on');}
  function dateLabel(v){var d=O.localDate(v);return d?d.toLocaleString('fr-FR',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'à renseigner';}
  function singular(s){return s.length>3&&/s$/.test(s)?s.slice(0,-1):s;}
  function tokens(v){return O.keyName(v).split(' ').filter(function(x){return x.length>2;}).map(singular);}
  function oneEdit(a,b){
    if(a===b)return true;if(Math.min(a.length,b.length)<4||Math.abs(a.length-b.length)>1)return false;
    var i=0,j=0,d=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++d>1)return false;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++;}}
    return d+(i<a.length||j<b.length?1:0)<=1;
  }
  function matches(message){
    var q=tokens(message);if(!q.length)return [];
    return rows().filter(function(x){var name=tokens(x.p.name),sku=tokens(x.p.sku),all=name.concat(sku);return all.some(function(t){return q.some(function(v){return oneEdit(t,v);});});}).slice(0,10);
  }
  function start(){
    var input=document.getElementById('ordUrgentText'),message=txt(input&&input.value,240),found=matches(message);
    if(!message){show('<strong>Décrivez la rupture.</strong>Exemple : « On n’a plus de frites » ou « plus de vodka ».');return;}
    if(!found.length){show('<strong>Aucun produit connu ne correspond.</strong>Ajoutez d’abord cette référence dans Mes produits. Vera ne crée ni produit ni fournisseur fictif.');return;}
    if(found.length===1){select(found[0].space,found[0].p.id,message);return;}
    show('<strong>Quel produit est réellement en rupture&nbsp;?</strong><div class="ord-emergency-choices">'+found.map(function(x){return '<button data-space="'+esc(x.space)+'" data-id="'+esc(x.p.id)+'" data-msg="'+esc(message)+'" onclick="orderingEmergencySelect(this.dataset.space,this.dataset.id,this.dataset.msg)">'+esc(x.p.name)+' <small>'+esc(typeof w.spName==='function'?w.spName(x.space):x.space)+'</small></button>';}).join('')+'</div>');
  }
  function select(space,pid,message){
    var row=rows().find(function(x){return x.space===space&&x.p.id===pid;});if(!row)return;ACTIVE={space:space,productId:pid,message:message};
    var target=Number(row.p.goal)>0?Number(row.p.goal):'',targetNote=target!==''?'Quantité proposée depuis votre stock cible, modifiable.':'Aucune quantité inventée : saisie obligatoire.';
    show('<strong>'+esc(row.p.name)+' · rupture à confirmer</strong><p>Pour quand faut-il absolument le produit&nbsp;? La date, l’heure et la quantité sont obligatoires avant tout calcul.</p><div class="ord-emergency-form"><label>Quantité nécessaire<input id="ordEmergencyQty" type="number" min="0.001" step="0.001" inputmode="decimal" value="'+esc(target)+'"><small>'+esc(targetNote)+' · '+esc(row.p.unit||'unité')+'</small></label><div><label>Date nécessaire<input id="ordEmergencyDate" type="date"></label><label>Heure nécessaire<input id="ordEmergencyTime" type="time"></label></div><button class="ord-emergency-primary" onclick="orderingEmergencyAnalyze()">Confirmer la rupture et analyser</button></div><p class="ord-emergency-proof">Cette confirmation inscrira un stock observé à 0. Une case vide ne serait jamais transformée en zéro.</p>');
  }
  function analyze(){
    if(!ACTIVE)return;var p=product(ACTIVE),q=O.num((document.getElementById('ordEmergencyQty')||{}).value),day=(document.getElementById('ordEmergencyDate')||{}).value,time=(document.getElementById('ordEmergencyTime')||{}).value;
    if(!(q>0)||!day||!time){if(typeof w.toast==='function')w.toast('Quantité, date et heure sont obligatoires');return;}
    var requiredAt=day+'T'+time,pRoute=O.route(p,profiles(),new Date(),requiredAt,{mode:'urgent'}),chosen=pRoute.chosen,win=chosen&&chosen.window||null;
    p.stock=0;
    var who=reporter(),inc={id:makeId('inc'),site:w.DB.site,space:ACTIVE.space,productId:ACTIVE.productId,productName:p.name,reportedText:txt(ACTIVE.message,240),reportedAt:nowIso(),reportedByName:who.name,reportedByRole:who.role,requiredDate:day,requiredAt:requiredAt,qtyBase:q,unit:p.unit||'',status:'awaiting-decision',urgentCoverage:'none',replenishmentStatus:'not-decided',supplier:chosen&&chosen.offer.supplier||'',cutoffAt:win&&win.cutoffAt||'',deliveryAt:win&&win.deliveryAt||'',deliveryEndAt:win&&win.deliveryEndAt||'',windowFeasible:!!(win&&win.feasible),scheduleVerified:!!(chosen&&chosen.profile&&chosen.profile.verified),availability:'unconfirmed',history:[{action:'rupture-confirmed',at:nowIso(),note:'Stock observé à zéro'}]};
    replaceIncident(inc);ACTIVE={incidentId:inc.id};save();renderProposal(inc,pRoute);
  }
  function renderProposal(inc,route){
    var chosen=route&&route.chosen,win=chosen&&chosen.window,supplier=chosen&&chosen.offer.supplier||'',late=win&&!win.feasible;
    var routeHtml=chosen&&win?'<div class="ord-emergency-route '+(late?'late':'')+'"><b>'+esc(supplier)+'</b><span>Commander avant '+esc(dateLabel(win.cutoffAt))+'</span><span>Livraison connue : '+esc(dateLabel(win.deliveryAt))+(win.deliveryEndAt?' à '+esc(dateLabel(win.deliveryEndAt)):'')+'</span><em>'+(chosen.profile&&chosen.profile.verified?'Horaire fournisseur marqué comme vérifié.':'Horaire non vérifié : à confirmer.')+'</em></div>':'<div class="ord-emergency-route late"><b>Aucun passage calculable</b><span>Renseignez le fournisseur, sa référence, son jour limite et sa livraison.</span></div>';
    var reported=inc.reportedByName?('Signalée par '+esc(inc.reportedByName)+(inc.reportedByRole?' · '+esc(inc.reportedByRole):'')):'Signalée dans Inventaire';
    show('<strong>Rupture enregistrée · '+esc(inc.productName)+'</strong><p class="ord-emergency-reporter">'+reported+(inc.reportedAt?' · '+esc(dateLabel(inc.reportedAt)):'')+'</p><p>Besoin le '+esc(dateLabel(inc.requiredAt))+' · '+esc(inc.qtyBase)+' '+esc(inc.unit)+'.</p>'+routeHtml+(late?'<div class="ord-emergency-alert"><b>Cette livraison arrive après votre besoin.</b>Elle ne couvre pas l’urgence. Un achat magasin peut couvrir demain sans supprimer le réapprovisionnement fournisseur.</div>':'')+'<div class="ord-emergency-alert neutral"><b>Disponibilité produit non confirmée.</b>Verdict prépare une décision ; seul le fournisseur confirme le stock et la commande.</div><div class="ord-emergency-actions">'+(chosen?'<button class="ord-emergency-primary" data-id="'+esc(inc.id)+'" onclick="orderingEmergencySupplier(this.dataset.id)">Préparer chez '+esc(supplier)+'</button>':'')+'<button data-id="'+esc(inc.id)+'" onclick="orderingEmergencyLocal(this.dataset.id)">Refuser pour l’urgence · achat magasin</button>'+(chosen?'':'<button onclick="orderingEmergencyOpenSuppliers()">Renseigner les fournisseurs</button>')+'</div>');
  }
  function addNeed(inc,kind,requiredAt,mode,supplierPreference){
    var existing=(w.DB.needs||[]).find(function(x){return x.incidentId===inc.id&&x.incidentKind===kind&&x.status==='open';});if(existing)return existing;
    var need={id:makeId('need'),site:inc.site,space:inc.space,productId:inc.productId,qtyBase:inc.qtyBase,inputQty:inc.qtyBase,inputMode:'base',requiredDate:O.dateKey(requiredAt),requiredAt:O.isoLocal(requiredAt),routingMode:mode||'normal',supplierPreference:txt(supplierPreference,160),priority:mode==='urgent'?'urgent':'normal',note:kind==='urgent'?'Rupture urgente signalée à Vera':'Réapprovisionnement après dépannage magasin',incidentId:inc.id,incidentKind:kind,status:'open',createdAt:nowIso()};
    w.DB.needs.push(need);return need;
  }
  function supplierDecision(id){
    var inc=incident(id);if(!inc)return;var need=addNeed(inc,'urgent',inc.requiredAt,'urgent',inc.supplier),next=O.applyEmergencyDecision(inc,'prepare-supplier',{at:nowIso(),needId:need.id,supplierPreference:inc.supplier,note:'Préparation uniquement ; commande non envoyée'});next.urgentNeedId=need.id;replaceIncident(next);save();
    show('<strong>Commande préparée, jamais envoyée automatiquement.</strong><p>'+esc(inc.productName)+' apparaît dans Commandes avec son heure limite, ses contrôles et le bouton « J’ai passé la commande ».</p><button class="ord-emergency-primary" onclick="orderingEmergencyOpenOrders()">Ouvrir les commandes</button>');
  }
  function localDecision(id){var inc=incident(id);if(!inc)return;replaceIncident(O.applyEmergencyDecision(inc,'local-purchase',{at:nowIso(),note:'Urgence à couvrir par achat local'}));save();renderReplenishment(id);}
  function renderReplenishment(id){
    var inc=incident(id);if(!inc)return;var delivery=inc.deliveryAt,supplier=inc.supplier;
    show('<strong>Dépannage magasin retenu pour l’urgence.</strong><p>Cette décision est mémorisée. Elle ne signifie pas que le besoin fournisseur est annulé.</p>'+(delivery?'<div class="ord-emergency-route"><b>Prochaine arrivée connue · '+esc(supplier)+'</b><span>'+esc(dateLabel(delivery))+'</span><em>Disponibilité et commande toujours non confirmées.</em></div>':'<div class="ord-emergency-alert"><b>Prochaine livraison inconnue.</b>Complétez les horaires avant de planifier le réapprovisionnement.</div>')+'<strong>Prévoir aussi le réapprovisionnement fournisseur&nbsp;?</strong><div class="ord-emergency-actions">'+(delivery?'<button class="ord-emergency-primary" data-id="'+esc(id)+'" onclick="orderingEmergencyReplenish(this.dataset.id)">Oui · préparer pour cette livraison</button>':'<button onclick="orderingEmergencyOpenSuppliers()">Renseigner les horaires</button>')+'<button data-id="'+esc(id)+'" onclick="orderingEmergencySkipReplenishment(this.dataset.id)">Non · laisser non planifié</button></div>');
  }
  function replenish(id){
    var inc=incident(id);if(!inc||!inc.deliveryAt)return;var need=addNeed(inc,'replenishment',inc.deliveryAt,'normal',inc.supplier),next=O.applyEmergencyDecision(inc,'plan-replenishment',{at:nowIso(),needId:need.id,supplierPreference:inc.supplier,note:'Réapprovisionnement conservé après achat local'});replaceIncident(next);save();
    show('<strong>Les deux décisions sont séparées et enregistrées.</strong><p>1. Achat magasin pour couvrir l’urgence.<br>2. Réapprovisionnement préparé pour '+esc(dateLabel(inc.deliveryAt))+' chez '+esc(inc.supplier)+'.</p><div class="ord-emergency-alert neutral">La commande fournisseur reste à valider puis à marquer « passée ». Aucune acceptation n’est inventée.</div><button class="ord-emergency-primary" onclick="orderingEmergencyOpenOrders()">Voir la préparation fournisseur</button>');
  }
  function skipReplenishment(id){var inc=incident(id);if(!inc)return;replaceIncident(O.applyEmergencyDecision(inc,'skip-replenishment',{at:nowIso(),note:'Refus explicite du réapprovisionnement'}));save();show('<strong>Dépannage magasin conservé · réapprovisionnement non planifié.</strong><p>Verdict garde l’alerte dans Vera. Vous pourrez le planifier plus tard ; le refus n’est ni oublié ni interprété comme un besoin résolu.</p>');}
  function localComplete(id){var inc=incident(id);if(!inc)return;replaceIncident(O.applyEmergencyDecision(inc,'local-complete',{at:nowIso(),note:'Achat local déclaré effectué'}));save();refresh();}
  function resolve(id){var inc=incident(id);if(!inc)return;replaceIncident(O.applyEmergencyDecision(inc,'resolve',{at:nowIso(),note:'Incident clôturé par l’utilisateur'}));save();refresh();}
  function statusLabel(x){if(x.status==='supplier-prepared')return 'Commande fournisseur préparée';if(x.status==='local-and-replenishment-planned')return 'Achat local + réapprovisionnement préparé';if(x.status==='local-purchase-planned'&&x.replenishmentStatus==='pending-decision')return 'Achat local · réapprovisionnement à décider';if(x.status==='local-purchase-planned')return 'Achat local · réapprovisionnement non planifié';return 'Décision attendue';}
  function allIncidents(){return (w.DB.supplyIncidents||[]).filter(function(x){return x.site===w.DB.site;}).slice().sort(function(a,b){return String(b.reportedAt).localeCompare(String(a.reportedAt));});}
  function incidentList(){return allIncidents().filter(function(x){return x.status!=='resolved';});}
  function focus(id){id=txt(id,100);var inc=incident(id);if(!inc||inc.status==='resolved')return false;if(typeof w.vInvOpen==='function')w.vInvOpen();setTimeout(function(){var p=product(inc),route=null;try{if(p)route=O.route(p,profiles(),new Date(),inc.requiredAt||null,{mode:'urgent'});}catch(e){}renderProposal(inc,route);refresh();var target=answer();if(target)try{target.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){target.scrollIntoView();}},40);return true;}
  function focusRequested(id,attempt){id=txt(id,100);if(!id)return;if(focus(id))return;if((attempt||0)<30)setTimeout(function(){focusRequested(id,(attempt||0)+1);},200);}
  function refresh(){
    var host=document.getElementById('ordEmergencyHistory');if(!host)return;var list=incidentList(),closed=allIncidents().filter(function(x){return x.status==='resolved';}).slice(0,30),active=list.length?'<h4>Ruptures suivies</h4>'+list.map(function(x){var reporter=x.reportedByName?('Signalée par '+esc(x.reportedByName)+(x.reportedByRole?' · '+esc(x.reportedByRole):'')):'Signalée dans Inventaire';return '<div class="ord-emergency-history" data-incident-id="'+esc(x.id)+'"><b>'+esc(x.productName)+'</b><span>'+esc(statusLabel(x))+' · besoin '+esc(dateLabel(x.requiredAt))+'</span><span>'+reporter+(x.reportedAt?' · '+esc(dateLabel(x.reportedAt)):'')+'</span><div>'+(x.status==='awaiting-decision'?'<button class="ord-emergency-primary" data-id="'+esc(x.id)+'" onclick="orderingEmergencyFocus(this.dataset.id)">Décider</button>':'')+(x.status==='local-purchase-planned'&&x.replenishmentStatus!=='planned'?'<button data-id="'+esc(x.id)+'" onclick="orderingEmergencyReconsider(this.dataset.id)">Décider le réapprovisionnement</button>':'')+(x.urgentCoverage==='local-store'&&x.localPurchaseStatus!=='completed'?'<button data-id="'+esc(x.id)+'" onclick="orderingEmergencyLocalComplete(this.dataset.id)">Achat magasin effectué</button>':'')+'<button data-id="'+esc(x.id)+'" onclick="orderingEmergencyResolve(this.dataset.id)">Clôturer</button></div></div>';}).join(''):'<p class="ord-emergency-empty">Aucune rupture ouverte.</p>',history=closed.length?'<details class="ord-emergency-archive"><summary>Historique des ruptures résolues · '+closed.length+'</summary>'+closed.map(function(x){return '<div class="ord-emergency-history is-resolved"><b>'+esc(x.productName)+'</b><span>Clôturée · signalée '+esc(dateLabel(x.reportedAt))+(x.reportedByName?' par '+esc(x.reportedByName):'')+'</span></div>';}).join('')+'</details>':'';host.innerHTML=active+history;
  }
  function inject(){
    if(document.getElementById('ordUrgentText')){refresh();return;}var q=document.querySelector('#vInvSheet .vinv-q');if(!q)return;
    q.insertAdjacentHTML('beforebegin','<section class="ord-vera-emergency"><div class="ord-emergency-kicker">URGENCE FOURNISSEUR · MAINTENANT</div><h3>Écrivez la rupture à Vera</h3><p>Exemple : « On n’a plus de frites » ou « plus de vodka ». Vera demandera l’heure et la quantité avant de proposer quoi que ce soit.</p><div class="ord-emergency-input"><input id="ordUrgentText" maxlength="240" autocomplete="off" placeholder="On n’a plus de…" onkeydown="if(event.key===\'Enter\'){event.preventDefault();orderingEmergencyStart()}"><button onclick="orderingEmergencyStart()">Analyser</button></div><div class="vinv-answer ord-urgent-flow" id="ordUrgentFlow" aria-live="polite"></div><div id="ordEmergencyHistory"></div></section>');
    refresh();var requested='';try{requested=new URLSearchParams(location.search+(self.__vdq||"")).get('incident')||'';}catch(e){}if(requested)focusRequested(requested,0);
    if(typeof w.vInvOpen==='function'&&!w.__verdictEmergencyOpenWrapped){var old=w.vInvOpen;w.vInvOpen=function(){var r=old.apply(this,arguments);refresh();setTimeout(function(){var i=document.getElementById('ordUrgentText');if(i)i.focus();},40);return r;};w.__verdictEmergencyOpenWrapped=true;}
  }
  function openOrders(){if(typeof w.vInvClose==='function')w.vInvClose();if(typeof w.go==='function')w.go('order');else if(typeof w.drawOrder==='function')w.drawOrder();}
  function openSuppliers(){if(typeof w.openSupplierManager==='function')w.openSupplierManager();}

  w.orderingEmergencyStart=start;w.orderingEmergencySelect=select;w.orderingEmergencyAnalyze=analyze;w.orderingEmergencySupplier=supplierDecision;w.orderingEmergencyLocal=localDecision;w.orderingEmergencyReplenish=replenish;w.orderingEmergencySkipReplenishment=skipReplenishment;w.orderingEmergencyReconsider=renderReplenishment;w.orderingEmergencyLocalComplete=localComplete;w.orderingEmergencyResolve=resolve;w.orderingEmergencyFocus=focus;w.orderingEmergencyOpenOrders=openOrders;w.orderingEmergencyOpenSuppliers=openSuppliers;w.orderingEmergencyRefresh=refresh;
  if(typeof w.addEventListener==='function')w.addEventListener('message',function(event){if(event.source!==w.parent||(location.origin!=="null"&&location.protocol!=='file:')&&(location.origin!=="null"&&event.origin!==location.origin)||!event.data||event.data.type!=='verdict-inventory-focus')return;focusRequested(event.data.incidentId,0);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else setTimeout(inject,0);
})(window);

