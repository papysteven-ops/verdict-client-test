
/* ═══ VERA CONTEXT INTELLIGENCE 1.0 ═══
   Le passeport appartient exclusivement à l'établissement actif. Les états
   yes/no/unknown empêchent Vera de transformer une absence d'information en
   hypothèse. Les calculs restent ceux du moteur Verdict. */
(function(global){
  'use strict';
  var RULES={
    "Restaurant traditionnel":{dine_in:"yes",dining_room:"yes",table_service:"yes",takeaway:"unknown",delivery:"unknown",bar:"unknown",kitchen:"yes",mobile_service:"no",events:"no",production:"no"},
    "Brasserie":{dine_in:"yes",dining_room:"yes",table_service:"yes",takeaway:"unknown",delivery:"unknown",bar:"yes",kitchen:"yes",mobile_service:"no",events:"no",production:"no"},
    "Restaurant gastronomique":{dine_in:"yes",dining_room:"yes",table_service:"yes",takeaway:"no",delivery:"no",bar:"unknown",kitchen:"yes",mobile_service:"no",events:"unknown",production:"no"},
    "Table gastronomique d’exception":{dine_in:"yes",dining_room:"yes",table_service:"yes",takeaway:"no",delivery:"no",bar:"unknown",kitchen:"yes",mobile_service:"no",events:"unknown",production:"no"},
    "Restaurant italien":{dine_in:"yes",dining_room:"yes",table_service:"yes",takeaway:"unknown",delivery:"unknown",bar:"unknown",kitchen:"yes",mobile_service:"no",events:"no",production:"no"},
    "Restaurant asiatique":{dine_in:"yes",dining_room:"yes",table_service:"unknown",takeaway:"yes",delivery:"unknown",bar:"unknown",kitchen:"yes",mobile_service:"no",events:"no",production:"no"},
    "Bar à tapas":{dine_in:"yes",dining_room:"yes",table_service:"unknown",takeaway:"unknown",delivery:"unknown",bar:"yes",kitchen:"yes",mobile_service:"no",events:"unknown",production:"no"},
    "Restaurant à burgers":{dine_in:"unknown",dining_room:"unknown",table_service:"unknown",takeaway:"yes",delivery:"unknown",bar:"unknown",kitchen:"yes",mobile_service:"no",events:"no",production:"no"},
    "Pizzeria":{dine_in:"unknown",dining_room:"unknown",table_service:"unknown",takeaway:"yes",delivery:"unknown",bar:"unknown",kitchen:"yes",mobile_service:"no",events:"no",production:"no"},
    "Kebab":{dine_in:"unknown",dining_room:"unknown",table_service:"no",takeaway:"yes",delivery:"unknown",bar:"unknown",kitchen:"yes",mobile_service:"no",events:"no",production:"no"},
    "Food truck":{dine_in:"no",dining_room:"no",table_service:"no",takeaway:"yes",delivery:"unknown",bar:"unknown",kitchen:"yes",mobile_service:"yes",events:"unknown",production:"no"},
    "Dark kitchen":{dine_in:"no",dining_room:"no",table_service:"no",takeaway:"unknown",delivery:"yes",bar:"unknown",kitchen:"yes",mobile_service:"no",events:"no",production:"no"},
    "Coffee shop":{dine_in:"yes",dining_room:"yes",table_service:"unknown",takeaway:"yes",delivery:"unknown",bar:"yes",kitchen:"unknown",mobile_service:"no",events:"unknown",production:"unknown"},
    "Traiteur":{dine_in:"no",dining_room:"no",table_service:"no",takeaway:"unknown",delivery:"unknown",bar:"unknown",kitchen:"yes",mobile_service:"unknown",events:"yes",production:"yes"},
    "Boulangerie":{dine_in:"unknown",dining_room:"unknown",table_service:"no",takeaway:"yes",delivery:"unknown",bar:"unknown",kitchen:"yes",mobile_service:"no",events:"unknown",production:"yes"}
  };
  var TOPIC_RULES={
    dining_room:/\b(salle|service en salle|table|couvert en salle)\b/i,
    delivery:/\b(livraison|plateforme|uber|deliveroo|just eat|livré)\b/i,
    bar:/\b(bar|boisson|bière|vin|cocktail|spiritueux)\b/i,
    events:/\b(traiteur|banquet|événement|réception)\b/i,
    staff_team:/\b(salari|équipe|licenci|planning|heures creuses|polyvalence)\b/i
  };
  var LABELS={fr:{seen:'Vera · détecté sur cet écran',proof:'Pourquoi',see:'Voir la preuve',explain:'Me l’expliquer',hide:'Masquer aujourd’hui',profile:'Confirmez votre modèle d’établissement',profileD:'Sans ce profil, Vera ne peut pas exclure les conseils qui ne correspondent pas à votre activité.',missing:'Votre analyse attend encore des données',missingD:'Vera a repéré {n} élément(s) manquant(s). Elle vous conduit uniquement vers les champs concernés.',bad:'Une incohérence mérite votre confirmation',badD:'Verdict a nommé {n} valeur(s) à vérifier. Rien n’est corrigé silencieusement.',baseline:'La carte a besoin d’une période commune',baselineD:'Les volumes doivent venir du même mois et de la même source avant de comparer les plats.',firstStock:'Un premier comptage créera votre référence',firstStockD:'Verdict ne parlera de consommation réelle qu’après deux inventaires comparables et les achats de la période.'},
    en:{seen:'Vera · detected on this screen',proof:'Why',see:'See evidence',explain:'Explain it',hide:'Hide today',profile:'Confirm your business model',profileD:'Without it, Vera cannot exclude advice that does not fit your activity.',missing:'Your analysis still needs data',missingD:'Vera found {n} missing item(s) and will take you only to the relevant fields.',bad:'An inconsistency needs confirmation',badD:'Verdict named {n} value(s) to check. Nothing is silently corrected.',baseline:'Your menu needs one shared period',baselineD:'Volumes must use the same month and source before dishes are compared.',firstStock:'A first count will create your baseline',firstStockD:'Verdict will only describe measured consumption after two comparable counts and the period purchases.'},
    es:{seen:'Vera · detectado en esta pantalla',proof:'Por qué',see:'Ver la prueba',explain:'Explícamelo',hide:'Ocultar hoy',profile:'Confirme su modelo de establecimiento',profileD:'Sin este perfil, Vera no puede excluir consejos que no corresponden a su actividad.',missing:'A su análisis aún le faltan datos',missingD:'Vera encontró {n} dato(s) pendiente(s) y le lleva solo a los campos afectados.',bad:'Una incoherencia necesita confirmación',badD:'Verdict ha nombrado {n} valor(es) a comprobar. Nada se corrige en silencio.',baseline:'La carta necesita un período común',baselineD:'Los volúmenes deben proceder del mismo mes y fuente antes de comparar platos.',firstStock:'Un primer recuento creará su referencia',firstStockD:'Verdict solo hablará de consumo medido tras dos inventarios comparables y las compras del período.'},
    it:{seen:'Vera · rilevato in questa schermata',proof:'Perché',see:'Vedi la prova',explain:'Spiegamelo',hide:'Nascondi oggi',profile:'Conferma il modello del locale',profileD:'Senza il profilo Vera non può escludere consigli estranei alla tua attività.',missing:'Mancano ancora alcuni dati',missingD:'Vera ha trovato {n} dato/i mancanti e ti porta solo ai campi interessati.',bad:'Un’incoerenza richiede conferma',badD:'Verdict ha indicato {n} valore/i da verificare. Nulla viene corretto in silenzio.',baseline:'Il menu richiede un periodo comune',baselineD:'I volumi devono provenire dallo stesso mese e fonte prima del confronto.',firstStock:'Un primo conteggio creerà il riferimento',firstStockD:'Verdict parlerà di consumo misurato solo dopo due inventari comparabili e gli acquisti del periodo.'},
    de:{seen:'Vera · auf diesem Bildschirm erkannt',proof:'Warum',see:'Nachweis sehen',explain:'Erklären',hide:'Heute ausblenden',profile:'Betriebsmodell bestätigen',profileD:'Ohne Profil kann Vera unpassende Ratschläge nicht sicher ausschließen.',missing:'Für die Analyse fehlen noch Daten',missingD:'Vera fand {n} fehlende Angabe(n) und führt nur zu den betroffenen Feldern.',bad:'Eine Unstimmigkeit braucht Bestätigung',badD:'Verdict nennt {n} zu prüfende Werte. Nichts wird still korrigiert.',baseline:'Die Karte braucht einen gemeinsamen Zeitraum',baselineD:'Mengen müssen aus demselben Monat und derselben Quelle stammen.',firstStock:'Eine erste Zählung schafft die Referenz',firstStockD:'Gemessener Verbrauch wird erst nach zwei vergleichbaren Inventuren und den Einkäufen ausgewiesen.'},
    nl:{seen:'Vera · op dit scherm gedetecteerd',proof:'Waarom',see:'Bewijs bekijken',explain:'Leg uit',hide:'Vandaag verbergen',profile:'Bevestig uw bedrijfsmodel',profileD:'Zonder profiel kan Vera ongeschikt advies niet veilig uitsluiten.',missing:'Uw analyse mist nog gegevens',missingD:'Vera vond {n} ontbrekend(e) gegeven(s) en brengt u alleen naar de juiste velden.',bad:'Een inconsistentie vraagt bevestiging',badD:'Verdict noemt {n} te controleren waarde(n). Niets wordt stil gecorrigeerd.',baseline:'De kaart heeft één gedeelde periode nodig',baselineD:'Volumes moeten uit dezelfde maand en bron komen.',firstStock:'Een eerste telling maakt uw referentie',firstStockD:'Verdict spreekt pas over gemeten verbruik na twee vergelijkbare tellingen en de aankopen.'},
    pt:{seen:'Vera · detetado neste ecrã',proof:'Porquê',see:'Ver a prova',explain:'Explicar',hide:'Ocultar hoje',profile:'Confirme o modelo do estabelecimento',profileD:'Sem perfil, Vera não pode excluir conselhos inadequados à sua atividade.',missing:'Ainda faltam dados na análise',missingD:'Vera encontrou {n} dado(s) em falta e leva-o apenas aos campos em causa.',bad:'Uma incoerência precisa de confirmação',badD:'Verdict indicou {n} valor(es) a verificar. Nada é corrigido silenciosamente.',baseline:'O menu precisa de um período comum',baselineD:'Os volumes devem vir do mesmo mês e fonte antes da comparação.',firstStock:'Uma primeira contagem cria a referência',firstStockD:'Verdict só falará de consumo medido após dois inventários comparáveis e as compras do período.'}}
  function L(k,n){var d=LABELS[(global.veraAppLocale&&veraAppLocale())||'fr']||LABELS.fr,s=d[k]||LABELS.fr[k]||k;return String(s).replace('{n}',String(n==null?'':n));}
  function cloneCaps(type){var src=RULES[type]||{},keys=['dine_in','dining_room','table_service','takeaway','delivery','bar','kitchen','mobile_service','events','production'],o={};keys.forEach(function(k){o[k]=src[k]||'unknown';});return o;}
  function latest(list,key){var a=(list||[]).slice().filter(Boolean);a.sort(function(x,y){return String(y[key]||y.at||'').localeCompare(String(x[key]||x.at||''));});return a[0]||null;}
  function ageDays(iso){if(!iso)return null;var d=new Date(iso),n=new Date();if(isNaN(d.getTime()))return null;return Math.max(0,Math.floor((n-d)/86400000));}
  function hash(s){var h=2166136261,i;for(i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return ('00000000'+(h>>>0).toString(16)).slice(-8);}
  function setYes(caps,key,evidence,proof){if(caps[key]!=='no'){caps[key]='yes';evidence.push(key+':'+proof);}}
  function passport(r){
    var type=String(DB&&DB.etabType||''),caps=cloneCaps(type),evidence=[],plats=(DB&&DB.plats)||[],rin=DB&&DB.in||{},rec=latest(DB&&DB.reconciliations,'period');
    var explicit=typeof normalizedEstablishmentProfile==='function'?normalizedEstablishmentProfile(DB&&DB.establishmentProfile):{},deliveryFacts=Number(rin.com)>0||plats.some(function(p){return !!p.pf;})||(rec&&Array.isArray(rec.platforms)&&rec.platforms.length);
    if(deliveryFacts)setYes(caps,'delivery',evidence,'commissions_or_channel_data');
    else if(explicit.delivery==='none')caps.delivery='no';
    else if(explicit.delivery==='secondary'||explicit.delivery==='major')setYes(caps,'delivery',evidence,'establishment_passport');
    if(explicit.delivery==='none'&&deliveryFacts)evidence.push('delivery:passport_conflict_with_financial_or_channel_data');
    ['seasonality','network','hotel','sites','mix'].forEach(function(k){if(explicit[k])evidence.push(k+':establishment_passport='+explicit[k]);});
    if(rec&&Number(rec.onSite)>0)setYes(caps,'dine_in',evidence,'pos_channel_onsite');
    if(rec&&Number(rec.takeaway)>0)setYes(caps,'takeaway',evidence,'pos_channel_takeaway');
    if(Number(rin.boi)>0||plats.some(function(p){return p&&p.esp==='bar';}))setYes(caps,'bar',evidence,'beverage_data');
    var staff='unknown';if(rin.saln!=null||rin.salb!=null)staff=(Number(rin.saln)>0||Number(rin.salb)>0)?'yes':'no';caps.staff_team=staff;if(staff==='yes')evidence.push('staff_team:payroll_or_fte');
    var exclusions=[],unknown=[];Object.keys(caps).forEach(function(k){if(caps[k]==='no')exclusions.push(k);else if(caps[k]==='unknown')unknown.push(k);});
    var pos=latest(DB&&DB.carteImports,'at')||latest(DB&&DB.platformImports,'at'),inv=latest(DB&&DB.inv,'at'),svc=latest(DB&&DB.serviceImports,'at'),updated=DB&&DB.veraUpdatedAt||'';
    var family=(typeof FORMATS!=='undefined'&&FORMATS[type])?FORMATS[type].f:'';
    var freshness={local:{updated_at:updated,age_days:ageDays(updated),meaning:'last_local_change'},annual:{period:String(rin.annee||DB&&DB.exerciseYear||''),meaning:'accounting_period'},sales:{period:String(DB&&DB.carteRef&&DB.carteRef.periode||''),source:String(DB&&DB.carteRef&&DB.carteRef.source||''),confirmed:!!(DB&&DB.carteRef&&DB.carteRef.confirmed),updated_at:String(pos&&pos.at||'')},platforms:{period:String(rec&&rec.period||''),updated_at:String(rec&&rec.at||'')},inventory:{period:String(inv&&(inv.m||inv.period)||''),updated_at:String(inv&&inv.at||'')},services:{period:String(svc&&(svc.period||svc.date)||''),updated_at:String(svc&&svc.at||'')}};
    var id=String(STORE&&STORE.actif||''),fp=hash(JSON.stringify({id:id,type:type,context:explicit,caps:caps,period:freshness.annual.period,sales:freshness.sales.period,platforms:freshness.platforms.period}));
    return {schema_version:'1.1',establishment_id:id,fingerprint:fp,profile:{type:type||'unknown',model:String(DB&&DB.modele||''),family:family||'unknown',context:explicit},capabilities:caps,exclusions:exclusions,assumptions_required:unknown,evidence:evidence.slice(0,20),freshness:freshness,confidence:type&&typeof passportComplete==='function'&&passportComplete(explicit)?(r&&r.ready?'high':'medium'):'low'};
  }
  global.veraOperatingPassport=passport;
  function allowed(text,p){text=String(text||'');for(var k in TOPIC_RULES){if(TOPIC_RULES[k].test(text)&&p.capabilities[k]!=='yes')return false;}return true;}
  function pulseSignal(){
    var r=null;try{r=moteur();}catch(e){}var p=passport(r),view=String(global.VIEW||'pil'),man=r&&r.manquants||[],inc=r&&r.incoherences||[];
    var operational=typeof invOperationsCurrent==='function'?invOperationsCurrent():null,opAction=operational&&operational.summary&&operational.summary.nextAction;
    if(opAction){var ru=null;try{if(opAction.kind==='incident'&&typeof verdictUrgenceRupture==='function'){var ix=(operational.incidents||[]).filter(function(x){return x&&x.id===opAction.sourceId;})[0];if(ix){var inf={besoin:ix.requiredAt,livraison:ix.deliveryAt,limite:ix.cutoffAt,verifie:!!ix.scheduleVerified,etatCommande:ix.replenishmentStatus},uu=verdictUrgenceRupture(inf,new Date());ru={level:{rouge:'red',orange:'orange',jaune:'yellow',vert:'green'}[uu.etat]||'orange',text:String(ix.productName||'')+' · '+verdictUrgenceRuptureTexte(uu,inf).phrase};
        /* R131 : la cloche resonne quand la rupture s'aggrave jusqu'au rouge, même si l'ancienne alerte était lue. */
        try{var kN='verdict-rupture-niveau:'+String(ix.id||''),prevN=localStorage.getItem(kN);if(ru.level==='red'&&prevN&&prevN!=='red')ru.force=true;localStorage.setItem(kN,ru.level);}catch(e){}}}}catch(e){ru=null;}
      return {level:ru?ru.level:(opAction.level==='critical'?'orange':'yellow'),title:String(opAction.title||'Une opération attend votre décision'),text:ru?ru.text:String(opAction.detail||'Ouvrez Inventaire pour vérifier la prochaine étape.'),proof:'État transmis par Inventaire pour le même établissement. Une disponibilité fournisseur reste non confirmée sans preuve explicite.',module:'inventory',actorName:String(opAction.actorName||''),establishmentName:String(operational&&operational.establishment&&operational.establishment.name||DB&&DB.etab||''),createdAt:String(opAction.reportedAt||operational&&operational.generatedAt||new Date().toISOString()),key:'inventory:'+String(opAction.sourceId||opAction.kind||'action'),forceUnread:!!(ru&&ru.force)};}
    if(!DB||typeof passportComplete!=='function'||!passportComplete(DB.establishmentProfile))return {level:'yellow',title:L('profile'),text:'Confirmez livraison, saisonnalité, organisation, hôtel, nombre de sites et multi-activité. Aucun chiffre ne sera déduit.',proof:'Six choix manquent au passeport établissement ; Vera refuse de les deviner.',route:'in',key:'profile-context'};
    if(typeof estModeRecent==='function'&&estModeRecent()){
      var rq=recentReliability(),age=recentAgeDays(),route=rq.days<3?'pil':(age>31?'data':'stock'),body=rq.days<3?recentT('actionDays'):(age>31?recentT('actionUpdate'):recentT('actionInventory'));
      return {level:rq.days<3?'yellow':'green',title:recentT('actionTitle'),text:body,proof:recentT('limit'),route:route,key:'recent:'+rq.days+':'+age};
    }
    if(!DB||!DB.etabType||DB.etabType==='Autre')return {level:'yellow',title:L('profile'),text:L('profileD'),proof:'Vera attend un type d’activité explicite au lieu de le deviner.',route:'in',key:'profile'};
    if(inc.length)return {level:'orange',title:L('bad'),text:L('badD',inc.length),proof:String(inc[0].lb||inc[0].label||inc[0].message||inc[0]),route:'in',key:'inc:'+inc.length};
    if(man.length||!r||!r.ready)return {level:'yellow',title:L('missing'),text:L('missingD',man.length||1),proof:String(man[0]&&((man[0].lb||man[0].label||man[0].message))||'La donnée indispensable n’est pas encore disponible.'),route:'in',key:'miss:'+man.length};
    if(view==='carte'&&!(DB.carteRef&&DB.carteRef.confirmed))return {level:'yellow',title:L('baseline'),text:L('baselineD'),proof:'Aucune période de ventes commune n’est confirmée.',route:'carte',key:'carte-ref'};
    if((view==='stock'||view==='achats'||view==='x')&&!(DB.inv&&DB.inv.length))return {level:'yellow',title:L('firstStock'),text:L('firstStockD'),proof:'Stock initial + achats − stock final = consommation mesurée.',route:'stock',key:'stock-first'};
    if(view==='hist'&&typeof point12ActiveDecision==='function'){
      var a=point12ActiveDecision(),e=a&&typeof point12Evaluation==='function'?point12Evaluation(a):null;
      if(a&&e&&e.due){
        var why=(a.lastCheck&&a.lastCheck.reasons&&a.lastCheck.reasons[0])||('La date de contrôle du '+String(a.reviewDate||'').split('-').reverse().join('/')+' est atteinte.');
        return {level:a.lastCheck?'yellow':'orange',title:a.lastCheck?'La mesure attend encore une donnée comparable':'Votre action est prête à être mesurée',text:a.lastCheck?'Actualisez la source nommée, puis relancez la mesure.':'Verdict va relire le même indicateur avec une donnée nouvelle et conserver ses limites.',proof:why,route:'hist',key:'p12:'+String(a.trackingId||a.id)+':'+String(a.lastCheck&&a.lastCheck.status||'due')};
      }
    }
    if(view==='audit'&&typeof au90Etat==='function'){
      var ap=au90Store(),ae=au90Etat();
      if(!ap.baseline)return {level:'yellow',title:'Votre plan attend son point de départ',text:'Vera peut figer la photo actuelle avant la première action.',proof:'Score, résultat, point mort, modèle, date et empreinte seront conservés sans modifier le calcul.',route:'audit',key:'audit-baseline'};
      if(ae.fait<ae.total)return {level:ae.encours?'orange':'yellow',title:ae.encours?'Une action du plan attend sa mesure':'Votre prochaine étape du plan est prête',text:ae.encours?'Ouvrez Trajectoire : seule une donnée nouvelle et comparable peut valider le résultat.':'Le plan reste limité à trois décisions et une seule action suivie à la fois.',proof:ae.fait+' étape(s) mesurée(s) sur '+ae.total+'.',route:ae.encours?'hist':'audit',key:'audit-plan:'+ae.fait+':'+ae.encours};
    }
    var q=null;try{var R=typeof v5recos==='function'?v5recos():null;if(R&&R.ready){q=(R.list||[]).filter(function(x){return allowed((x.t||'')+' '+(x.p||'')+' '+(x.why||''),p);})[0]||null;}}catch(e){}
    if(q&&(view==='pil'||view==='priorities'||view==='data'||view==='alertes'||view==='audit'))return {level:q.rank<=2?'orange':(q.rank<=3?'yellow':'green'),title:String(q.t||'Une priorité a été calculée'),text:String(q.p||'Verdict a classé ce point à partir des données actives.'),proof:String(q.why||'Priorité calculée par le moteur Verdict.'),route:'priorities',key:'prio:'+String(q.id||q.t)};
    return null;
  }
  function render(){
    var old=document.getElementById('veraPulse');if(old)old.remove();
    var signal=pulseSignal();if(!signal||signal.module!=='inventory'||String(signal.key||'').indexOf('inventory:')!==0)return;
    var detail=String(signal.text||'').replace(/ · nécessaire (\d{4})-(\d{2})-(\d{2})(?:T[^ ]*)?$/,function(_,year,month,day){var date=year+'-'+month+'-'+day;return date===new Date().toISOString().slice(0,10)?' · nécessaire aujourd’hui':' · nécessaire le '+day+'/'+month+'/'+year;});
    var p=passport(null),notification={id:'operation:'+p.establishment_id+':'+signal.key,source:'Inventaire',module:'inventory',level:signal.level,actorName:signal.actorName||'',establishmentId:p.establishment_id,establishmentName:signal.establishmentName||DB&&DB.etab||'',title:signal.title,detail:detail,proof:signal.proof,createdAt:signal.createdAt,demo:typeof invDemoIsole==='function'&&invDemoIsole(),actionLabel:'Ouvrir Inventaire',forceUnread:!!signal.forceUnread};
    if(global.parent&&global.parent!==global){try{global.parent.postMessage({type:'verdict-manager-notification',notification:notification},(location.protocol==='file:'||location.origin==="null")?'*':location.origin);}catch(e){}}
  }
  global.veraProactiveRender=render;
  /* Une alerte opérationnelle est transmise au centre du gérant. Elle ne
     modifie jamais le DOM, la hauteur ou l'ordre d'une analyse Verdict. */
  var oldGo=global.go;if(typeof oldGo==='function')global.go=function(v){var z=oldGo.apply(this,arguments);render();return z;};
  var oldRefresh=global.refreshAll;if(typeof oldRefresh==='function')global.refreshAll=function(){var z=oldRefresh.apply(this,arguments);render();return z;};
  var oldSet=global.setActif;if(typeof oldSet==='function')global.setActif=function(){var z=oldSet.apply(this,arguments);render();return z;};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
  /* R130 : la couleur d'une rupture évolue avec l'heure (minuit, heure limite) sans attendre une navigation. */
  document.addEventListener('visibilitychange',function(){if(!document.hidden){try{render();}catch(e){}}});
  setInterval(function(){try{render();}catch(e){}},300000);
})(window);
