
(function(){
  'use strict';
  try{performance.mark('verdict-shell-start');}catch(e){}

  var cfg=window.VERDICT_UNIFIED_CONFIG||{};
  var modules={verdict:true,inventory:true};
  /* R17.2 — contrat métier explicite. Pilotage et Carte possèdent leurs
     propres identités, routes et futures permissions, tout en partageant
     encore volontairement le runtime Verdict résident. Cette frontière
     évite aujourd'hui une seconde iframe de 2,8 Mo et prépare l'extraction
     progressive sans casser les calculs ni la démonstration. */
  var moduleContracts=Object.freeze({
    pilotage:Object.freeze({id:'pilotage',runtime:'verdict',profile:'pilotage',landing:'pil'}),
    carte:Object.freeze({id:'carte',runtime:'verdict',profile:'carte',landing:'carte'}),
    inventory:Object.freeze({id:'inventory',runtime:'inventory',profile:'',landing:'home'})
  });
  function cleanCapability(value){value=String(value||'');return moduleContracts[value]?value:'';}
  function capabilityFor(runtime,profile){return runtime==='inventory'?'inventory':(cleanProfile(profile)==='carte'?'carte':'pilotage');}
  function activateCapability(capability,options,historyMode){
    var contract=moduleContracts[cleanCapability(capability)]||moduleContracts.pilotage;
    options=Object.assign({},options||{},contract.profile?{profile:contract.profile}:{},{capability:contract.id});
    return activate(contract.runtime,options,historyMode);
  }
  var params=new URLSearchParams(location.search);
  /* C217 W61 : le site écrit ?module=inventaire (français) ; c'est le même module que ?module=inventory. L'adresse est
     corrigée avant toute lecture (démarrage, historique, rechargement). */
  (function(){var m=String(params.get('module')||'').toLowerCase();if(m!=='inventory'&&/^(inventaire|inventario|inventar|stocks?|voorraad)$/.test(m)){params.set('module','inventory');try{var u=new URL(location.href);u.searchParams.set('module','inventory');history.replaceState(history.state,'',u.pathname+u.search+u.hash);}catch(e){}}})();
  /* C229 (X36) : lien donné par le patron à son équipe (?equipe=<établissement>). Inventaire seul : les onglets Pilotage et Carte
     n'existent pas, leur cadre n'est jamais chargé (aucune donnée du patron dans la page), l'Inventaire est celui du compte
     de l'établissement, lu selon les droits donnés par le patron (serveur). Gardé pour l'onglet (sessionStorage). */
  var EQUIPE=(function(){var e=String(params.get('equipe')||'').replace(/[^A-Za-z0-9._:-]/g,'').slice(0,96);try{if(e)sessionStorage.setItem('verdict:equipe:v1',e);else e=String(sessionStorage.getItem('verdict:equipe:v1')||'');}catch(x){}return e;})();
  if(EQUIPE){params.set('module','inventory');document.documentElement.classList.add('vd-equipe');(function(){var st=document.createElement('style');st.id='equipe-c229';st.textContent='html.vd-equipe .module-tabs,html.vd-equipe #tab-verdict,html.vd-equipe #tab-carte,html.vd-equipe #panel-verdict,html.vd-equipe #frame-verdict,html.vd-equipe #vdDock,html.vd-equipe #vdPlanBadge,html.vd-equipe #vdOffre,html.vd-equipe [data-module="verdict"],html.vd-equipe [data-module="carte"],html.vd-equipe [data-capability="pilotage"],html.vd-equipe [data-capability="carte"]{display:none!important}html.vd-equipe #panel-inventory{display:block!important}';(document.head||document.documentElement).appendChild(st);})();}
  window.VERDICT_EQUIPE=EQUIPE||'';
  var stored={};
  try{stored=JSON.parse(localStorage.getItem(cfg.storageKey)||'{}')||{};}catch(e){stored={};}
  var startupUnlocked=false,startupVisualReady=false;
  var inventoryPreloadQueued=false,workerRegistrationQueued=false,workerRegistrationStarted=false;
  var demoProgressStep=0,demoProgressUpdatedAt=0,demoInventoryQuietTimer=0,demoTourActive=false,workerRegistrationTimer=0;
  var pendingWorkerUpdate=null,workerReloadRequested=false;
  var persistQueued=false,persistHandle=0,persistUsesIdle=false;
  var startupVisualFallbackTimer=null;
  window.__verdictResumed=(function(){try{var s=sessionStorage.getItem('verdict:shell-session');sessionStorage.setItem('verdict:shell-session','1');return !!s;}catch(e){return true;}})();
  var state={
    /* V45 : la langue reste obligatoire, puis les trois métiers deviennent
       immédiatement accessibles dans une seule coque.
       Consolidation 14/10/2026 : le module demandé dans l'adresse, sinon le dernier module enregistré,
       est repris au démarrage (un rechargement ne ramène plus Inventaire vers Pilotage). */
    /* C51 : chaque nouvelle ouverture démarre sur Pilotage › Accueil ; un rechargement pendant l'utilisation reprend l'écran en cours. */
    module:params.get('module')==='inventory'?'inventory':(params.get('module')||params.get('profile'))?'verdict':(window.__verdictResumed&&stored.module==='inventory'?'inventory':'verdict'),
    profile:cleanProfile(params.get('profile')||(window.__verdictResumed?stored.profile:'pilotage')),
    renderedProfile:'',
    pendingProfile:null,
    pendingModuleSwitch:null,
    profileRequestSequence:0,
    lastChildProfileSequence:0,
    context:null,
    contextSignature:'',
    frames:{verdict:false,inventory:false},
    ready:{verdict:false,inventory:false},
    modes:{verdict:'',inventory:''},
    operations:null,
    pendingInventoryIntent:null,
    pendingVerdictResume:null,
    demoResumeSequence:0
  };

  var els={
    header:document.querySelector('.app-shell-header'),
    loading:document.getElementById('unified-loading'),
    context:document.getElementById('unified-context'),
    network:document.getElementById('unified-network'),
    managerAlert:document.getElementById('manager-alert'),
    managerAlertLink:document.getElementById('manager-alert-link'),
    managerAlertTitle:document.getElementById('manager-alert-title'),
    managerAlertDetail:document.getElementById('manager-alert-detail'),
    managerAlertClose:document.getElementById('manager-alert-close'),
    verdict:document.getElementById('frame-verdict'),
    inventory:document.getElementById('frame-inventory')
  };

  var notificationCenter=window.VerdictManagerNotifications&&window.VerdictManagerNotifications.create({
    storageKey:'verdict:manager-notifications:v1',
    visible:false,
    onAction:function(item){
      var target=item&&item.module==='verdict'?'verdict':'inventory';
      activate(target,{demo:!!(item&&item.demo)||!!(state.context&&state.context.demo),siteId:item&&item.establishmentId||state.context&&state.context.siteId||''});
    }
  });

  function setStartupUnlocked(value){
    if(!value||startupUnlocked)return false;
    startupUnlocked=true;
    document.body.classList.remove('shell-startup-locked');
    if(els.header){els.header.removeAttribute('aria-hidden');els.header.removeAttribute('inert');}
    document.querySelectorAll('[data-module]').forEach(function(button){if(!button.hidden&&button.getAttribute('aria-hidden')!=='true')button.disabled=false;});
    var notificationButton=document.getElementById('notification-button');if(notificationButton)notificationButton.disabled=false;
    if(notificationCenter&&notificationCenter.setVisible)notificationCenter.setVisible(true);
    /* R9 — le déverrouillage métier peut arriver avant la dernière image de
       l'ouverture. Aucun module caché ni mise à jour hors ligne ne doit alors
       concurrencer le score visible. Le vrai handoff de Verdict déclenche le
       travail différé ; ce filet ne sert qu'en cas de message enfant perdu. */
    if(!startupVisualReady&&!startupVisualFallbackTimer)startupVisualFallbackTimer=setTimeout(function(){
      startupVisualFallbackTimer=null;
      if(startupUnlocked&&!startupVisualReady)markStartupVisualReady('fallback');
    },9000);
    return true;
  }

  function afterStartupPaint(callback,delay){
    var launch=function(){
      var run=function(){
        if(document.visibilityState==='hidden'){
          var resume=function(){if(document.visibilityState==='hidden')return;document.removeEventListener('visibilitychange',resume);run();};
          document.addEventListener('visibilitychange',resume);return;
        }
        callback();
      };
      if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:2400});
      else setTimeout(run,Math.max(240,Number(delay)||0));
    };
    var raf=window.requestAnimationFrame;
    if(typeof raf==='function')raf(function(){raf(launch);});else setTimeout(launch,48);
  }

  function queueDemoInventoryPreload(){
    if(!startupVisualReady||!state.context||!bool(state.context.demo)||state.frames.inventory||demoProgressStep<12)return false;
    if(demoInventoryQuietTimer)clearTimeout(demoInventoryQuietTimer);
    inventoryPreloadQueued=true;
    var quietSince=demoProgressUpdatedAt;
    /* Inventaire est utile six étapes plus tard, mais son gros document ne
       doit jamais se parser pendant une rafale de clics. Chaque nouvelle
       étape repousse ce travail avant une vraie pause de lecture. */
    demoInventoryQuietTimer=setTimeout(function(){
      demoInventoryQuietTimer=0;
      afterStartupPaint(function(){
        if(quietSince!==demoProgressUpdatedAt){inventoryPreloadQueued=false;queueDemoInventoryPreload();return;}
        inventoryPreloadQueued=false;
        try{performance.mark('verdict-inventory-preload-start');}catch(e){}
        preloadDemoInventory();
      },700);
    },900);
    return true;
  }

  function markStartupVisualReady(source){
    if(startupVisualReady)return false;
    startupVisualReady=true;
    if(startupVisualFallbackTimer){clearTimeout(startupVisualFallbackTimer);startupVisualFallbackTimer=null;}
    try{performance.mark('verdict-shell-intro-complete');}catch(e){}
    /* En démonstration, le cache hors ligne et Inventaire attendent désormais
       le progrès réel du visiteur. Le premier écran et ses clics gardent le
       fil principal pour eux seuls. */
    if(state.context&&!bool(state.context.demo))queueWorkerRegistration(source==='fallback'?1200:700);
    queueInventoryAtRest();
    return true;
  }
  /* C397 (audit A06) : la première ouverture de l'Inventaire était à froid pour un vrai client (préchargement seulement en démo, à l'étape 12
     du parcours) : 0,7 à 1,1 s sans rien, puis un écran noir et l'en-tête qui disparaissait. Le cadre Inventaire est préparé, caché, une fois
     l'Accueil affiché et la page au repos (1,2 s sans toucher : fini avant la fenêtre de repos de C333), en démo comme hors démo ; au plus tard quand le doigt se pose sur l'onglet. */
  var inventoryRestTimer=0,lastShellInput=0;
  ['pointerdown','keydown','wheel','touchstart'].forEach(function(t){document.addEventListener(t,function(){lastShellInput=Date.now();},{capture:true,passive:true});});
  function preloadInventoryNow(){
    if(EQUIPE||!startupUnlocked||state.frames.inventory)return false;
    if(state.context&&bool(state.context.demo))return preloadDemoInventory();
    return ensureFrame('inventory',{preload:true});
  }
  /* C397 b (c333 rouge, 27/10) : attendre un moment libre (requestIdleCallback, jusqu'à 2,4 s) faisait glisser le chargement vers 5 s, pendant
     que Pilotage finit son démarrage : tâches de 200 à 300 ms en pleine fenêtre de repos. Le cadre part à heure fixe (1,2 s après l'Accueil,
     sans toucher depuis 0,8 s) ; passé 2,8 s sans y parvenir, il ne part plus qu'au toucher de l'onglet, jamais pendant le repos. */
  var inventoryRestDeadline=0;
  function queueInventoryAtRest(){
    if(EQUIPE||state.frames.inventory||inventoryRestTimer)return;
    if(!inventoryRestDeadline)inventoryRestDeadline=Date.now()+2800;
    inventoryRestTimer=setTimeout(function(){inventoryRestTimer=0;
      if(state.frames.inventory||Date.now()>inventoryRestDeadline)return;
      if(Date.now()-lastShellInput<800||document.visibilityState==='hidden'){queueInventoryAtRest();return;}
      try{performance.mark('verdict-inventory-rest-preload');}catch(e){}preloadInventoryNow();
    },inventoryRestDeadline-Date.now()>2000?1200:400);
  }
  document.addEventListener('pointerdown',function(e){var t=e.target&&e.target.closest&&e.target.closest('#tab-inventory');if(t&&!t.disabled)preloadInventoryNow();},true);

  function passSafeBottom(frame){
    if(window.VerdictViewportLayout)window.VerdictViewportLayout.send(frame);
  }
  function syncSafeBottom(){
    if(window.VerdictViewportLayout)window.VerdictViewportLayout.refresh();
  }

  function bool(v){return v===true||v==='1';}
  function cleanId(v){return String(v||'').replace(/[^a-zA-Z0-9_.:-]/g,'').slice(0,100);}
  function cleanText(v){return String(v||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,100);}
  /* C323 (décision 15) : la pastille « Démonstration fictive · … » montre le nom d'un modèle en casse normale, sans « (démonstration estimative) ». */
  var nomDemoC323=function(s){s=String(s||'').replace(/\s*\(d[ée]monstration estimative\)\s*$/i,'').trim();if(s.length>3&&s===s.toUpperCase()&&/[A-ZÀ-Ý]{3}/.test(s)){s=s.toLowerCase().replace(/\b(i{1,3}|iv|v|vi{1,3}|ix|x)\b/g,function(m){return m.toUpperCase();});s=s.charAt(0).toUpperCase()+s.slice(1);}return s;};
  function cleanLocale(v){v=String(v||'').toLowerCase().slice(0,2);return /^(fr|en|es|it|de|nl|pt)$/.test(v)?v:'';}
  function cleanProfile(v){return v==='carte'?'carte':'pilotage';}
  function localeKey(){return cfg.storageKey+':session-locale';}
  function rememberedLocale(){try{return cleanLocale(sessionStorage.getItem(localeKey())||'');}catch(e){return '';}}
  function rememberLocale(value){value=cleanLocale(value);if(!value)return;try{sessionStorage.setItem(localeKey(),value);}catch(e){}}
  function demoResumeKey(){return String(cfg.demoResumeKey||'verdict:demo:resume:client:v1');}
  function demoResumeActive(){
    if(cfg.edition!=='client')return false;
    try{return localStorage.getItem(demoResumeKey())==='1';}catch(e){return false;}
  }
  function demoRequested(options){
    options=options||{};
    return bool(options.demo)||params.get('demo')==='1'||!!params.get('presentation')||demoResumeActive();
  }
  function canonicalDemoContext(){
    return {siteId:cleanId(cfg.demoSiteId||'demo-brasserie'),name:cleanText(cfg.demoSiteName||'Brasserie Collet'),accountScope:'',demo:true,source:'verdict'};
  }
  function sameOriginMessage(event){
    if(event.source!==els.verdict.contentWindow&&event.source!==els.inventory.contentWindow)return false;
    return location.protocol==='file:'||event.origin===location.origin;
  }
  function moduleForSource(source){
    if(source===els.verdict.contentWindow)return 'verdict';
    if(source===els.inventory.contentWindow)return 'inventory';
    return '';
  }
  function targetOrigin(){return location.protocol==='file:'?'*':location.origin;}
  function persistNow(){
    if(persistHandle){
      if(persistUsesIdle&&typeof cancelIdleCallback==='function')cancelIdleCallback(persistHandle);
      else clearTimeout(persistHandle);
    }
    persistHandle=0;persistUsesIdle=false;persistQueued=false;
    try{localStorage.setItem(cfg.storageKey,JSON.stringify({module:state.module,profile:state.profile,updatedAt:new Date().toISOString()}));}catch(e){}
  }
  function persist(){
    if(persistQueued)return;
    persistQueued=true;
    var run=function(){persistHandle=0;persistUsesIdle=false;persistNow();};
    /* Le choix d'onglet est déjà conservé dans state. L'écriture synchrone
       localStorage attend donc le prochain temps calme au lieu de retenir la
       peinture du bouton sous le doigt. pagehide/hidden force le dernier
       état avant toute suspension iOS ou fermeture de l'application. */
    if(typeof requestIdleCallback==='function'){
      persistUsesIdle=true;persistHandle=requestIdleCallback(run,{timeout:900});
    }else persistHandle=setTimeout(run,32);
  }
  function incomingParams(module,options){
    options=options||{};
    var q=new URLSearchParams();q.set('embed','1');
    var locale=cleanLocale(options.locale||params.get('lang')||rememberedLocale());
    if(locale)q.set('lang',locale);
    var demo=demoRequested(options);
    if(module==='inventory'){
      if(options.route||params.get('route'))q.set('route',cleanText(options.route||params.get('route')));
      if(demo)q.set('demo','1');
      if(demo&&(bool(options.guide)||params.get('guide')==='1'))q.set('guide','1');
      if(options.incidentId)q.set('incident',cleanId(options.incidentId));
      /* C229 (X36) : en équipe, jamais l'inventaire ouvert de cet appareil ni un lien partagé : celui de l'établissement, selon les droits. */
      if(!demo&&EQUIPE)q.set('equipe',EQUIPE);else if(!demo&&cfg.openAccess)q.set('openAccess','1');
      if(!demo&&!EQUIPE){try{var sharedLink=JSON.parse(localStorage.getItem('verdict:inventory:link:'+cleanId(options.siteId||state.context&&state.context.siteId))||'null');if(sharedLink&&sharedLink.id){q.delete('openAccess');q.set('shared','1');q.set('sharedId',sharedLink.id);}}catch(e){}}
      if(!demo&&!EQUIPE&&cfg.edition==='client'&&!cfg.openAccess)q.set('ownerTeam','1');
      var teamEstablishment=cleanId(options.teamEstablishment||params.get('teamEstablishment'));
      if(!demo&&teamEstablishment)q.set('teamEstablishment',teamEstablishment);
    }else{
      ['presentation','trial','bridge','inventory','mode','validation','source','intent','question','resume','resume_multisite','performance','route'].forEach(function(k){var value=options[k]||params.get(k);if(value)q.set(k,cleanText(value));});
      if(demo)q.set('demo','1');
      if(demo&&!q.get('presentation'))q.set('presentation','brasserie');
      if(options.siteId)q.set('inventory',cleanId(options.siteId));
      if(options.bridge)q.set('bridge','inventory');
    }
    return q;
  }
  function modeKey(module,options){
    var q=incomingParams(module,options),mode=(q.get('demo')||q.get('presentation'))?'demo':'real';
    /* Pilotage et Carte partagent strictement la même iframe. Changer de
       profil ou republier l'établissement actif ne doit jamais recharger
       l'application : le contexte et la destination passent par message. */
    if(module==='verdict')return module+':'+mode+':'+(q.get('lang')||'')+':'+(q.get('trial')||'')+':'+(q.get('mode')||'');
    /* La route est un état de navigation, pas un mode d'exécution. La mettre
       dans cette clé rechargeait toute l'iframe à chaque entrée différente. */
    return module+':'+mode+':'+(q.get('sharedId')||'')+':'+(q.get('teamEstablishment')||'')+':'+(q.get('inventory')||'')+':'+(q.get('lang')||'');
  }
  function syncResidentVerdictMode(context,sourceModule){
    /* Verdict peut entrer dans la démonstration depuis son écran déjà chargé.
       Dans ce cas, son URL initiale dit encore « réel », alors que la frame
       résidente contient déjà le bac à sable fictif. Conserver cette ancienne
       identité rechargeait tout le module au retour depuis Inventaire et
       rejouait son ouverture. Seul Verdict confirme son mode réel ; la clé
       résidente est donc alignée sur le contexte publié par celui-ci. */
    if(sourceModule!=='verdict'||!context||!state.frames.verdict||!state.modes.verdict)return false;
    var parts=String(state.modes.verdict).split(':');
    if(parts[0]!=='verdict'||parts.length<5)return false;
    parts[1]=bool(context.demo)?'demo':'real';
    var residentLocale=cleanLocale(context.locale);if(residentLocale)parts[2]=residentLocale;
    state.modes.verdict=parts.join(':');
    return true;
  }
  function moduleUrl(module,options){
    var base=module==='inventory'?cfg.inventoryUrl:cfg.verdictUrl;
    var q=incomingParams(module,options);
    if(module==='verdict')q.set('profile',cleanProfile(options&&options.profile||state.profile));
    return base+'?'+q.toString();
  }
  var transitionToken=null,startupCover=true,startupCoverTimer=0;
  function setLoading(on,label){
    if(startupCover){
      if(els.loading){els.loading.classList.add('on','startup');var startupText=els.loading.querySelector('span');if(startupText&&label)startupText.textContent='Ouverture de Verdict…';}
      return;
    }
    if(window.VerdictTransition){if(on&&!transitionToken)transitionToken=window.VerdictTransition.begin(label);else if(!on&&transitionToken){var done=transitionToken;transitionToken=null;window.VerdictTransition.paint().then(function(){window.VerdictTransition.end(done);});}}
    if(!els.loading)return;els.loading.classList.toggle('on',!!on&&!window.VerdictTransition);
    var text=els.loading.querySelector('span');if(text&&label)text.textContent=label;
  }
  function finishStartupCover(){
    if(!startupCover)return;startupCover=false;if(startupCoverTimer){clearTimeout(startupCoverTimer);startupCoverTimer=0;}
    if(els.loading){els.loading.classList.remove('on','startup','failed');var retry=els.loading.querySelector('.startup-retry');if(retry)retry.hidden=true;}
  }
  if(els.loading){
    var startupRetry=els.loading.querySelector('.startup-retry');if(startupRetry)startupRetry.addEventListener('click',function(){location.reload();});
    /* R321 : le voile se retire dès que le module affiche quelque chose de vrai — l’animation d’ouverture Verdict
       (règle de Steven : elle prend tout l’écran, première ouverture comme réouverture), l’écran d’entrée ou l’accueil —
       sans attendre la fin du chargement de la page. */
    (function watchStartupScreen(){if(!startupCover)return;try{/* C217 W68 : ouverture directe sur l'Inventaire — le voile ne regardait que le cadre Pilotage (vide ici) et attendait un message envoyé en fin de chargement (jusqu'à 10 à 20 s). Il se retire dès que l'Inventaire affiche son ouverture, son accueil ou un écran. */var invDoc=state.module==='inventory'&&els.inventory&&els.inventory.contentDocument;if(invDoc&&invDoc.body&&/inventaire/.test(String(invDoc.URL||''))){var iv=invDoc.defaultView,vis=function(e){if(!e)return false;var st=iv.getComputedStyle(e);return e.getClientRects().length>0&&st.display!=='none'&&st.visibility!=='hidden'&&st.opacity!=='0';};if(vis(invDoc.getElementById('splash'))||vis(invDoc.querySelector('section.view.on'))||vis(invDoc.querySelector('.wc'))){finishStartupCover();return;}}var child=els.verdict&&els.verdict.contentDocument;if(child&&child.body){var shown=function(e){if(!e)return false;var st=child.defaultView.getComputedStyle(e);return e.getClientRects().length>0&&st.display!=='none'&&st.visibility!=='hidden'&&st.opacity!=='0';};var splash=child.getElementById('splash');if(shown(splash)){finishStartupCover();return;}{var entry=child.querySelector('#mLang.on,#refSh.on,#mDemoIntent.on'),view=child.querySelector('section.view.on');if(shown(entry)||(!entry&&shown(view)&&child.readyState!=='loading')){finishStartupCover();return;}}}}catch(e){}setTimeout(watchStartupScreen,60);})();
    startupCoverTimer=setTimeout(function(){if(!startupCover)return;els.loading.classList.add('on','startup','failed');var text=els.loading.querySelector('span'),retry=els.loading.querySelector('.startup-retry');if(text)text.textContent='Le chargement prend plus de temps que prévu. Vérifiez votre connexion.';if(retry)retry.hidden=false;},20000);
  }
  window.addEventListener('message',function(event){
    if(event.origin!==location.origin||!event.data)return;
    if(event.source!==els.verdict.contentWindow&&event.source!==els.inventory.contentWindow)return;
    if(event.data.p41==='gate'&&event.data.open===true){finishStartupCover();return;}
    if(event.data.type==='verdict-inventory-needs-verdict'&&event.source===els.inventory.contentWindow){prepareVerdictForInventory();return;}
    if(event.data.type==='verdict-unified-ready'){
      try{var frame=event.source===els.verdict.contentWindow?els.verdict:els.inventory,child=frame.contentDocument,entry=child&&child.querySelector('#mLang.on,#refSh.on,#mDemoIntent.on'),splash=child&&child.getElementById('splash'),view=child&&child.querySelector('.view.on');if(splash){var splashStyle=child.defaultView.getComputedStyle(splash);entry=entry||(splash.getClientRects().length>0&&splashStyle.display!=='none'&&splashStyle.visibility!=='hidden');}if(view&&!entry)finishStartupCover();}catch(e){}
    }
  });
  /* C217 W63 : ouvert directement sur l'Inventaire (essai, Pilotage, Pro), Analyse a besoin de Pilotage (factures, pertes,
     clôture, écart matière). Le cadre Pilotage est préparé caché, une seule fois, sans changer d'écran ; jamais sous la
     formule Inventaire gratuite. L'Inventaire est prévenu quand Pilotage est prêt. */
  var verdictForInventoryAsked=false;
  function prepareVerdictForInventory(){
    if(verdictForInventoryAsked||demoRequested()||EQUIPE)return false;
    try{var P=window.VerdictPlan;if(P&&typeof P.actif==='function'&&P.actif()&&P.etat().niveau==='inventaire')return false;}catch(e){}
    try{var A=window.VerdictWorkspaceAccess,R=A&&A.getPreferredTarget?A.getPreferredTarget():null;/* le serveur décide (espace connecté) : Pilotage seulement s'il l'ouvre */if(window.VERDICT_WORKSPACE_CONNECTED===true&&window.VERDICT_OPEN_ACCESS!==true&&!(R&&R.modules&&R.modules.pilotage&&R.modules.pilotage.view))return false;}catch(e){}
    verdictForInventoryAsked=true;
    var notify=function(){var n=0;(function poll(){try{var cw=els.verdict.contentWindow;if(cw&&typeof cw.verdictMatiereDepuisInventaire==='function'){send(els.inventory,{type:'verdict-frame-ready'});return;}}catch(e){}if(n++<80)setTimeout(poll,250);})();};
    if(state.frames.verdict){notify();return true;}
    ensureFrame('verdict',{profile:state.profile||'pilotage',preload:true});notify();return true;
  }
  function ensureFrame(module,options){
    if(EQUIPE&&module!=='inventory')return false;/* C229 (X36) */
    var frame=els[module],key=modeKey(module,options);
    if(!frame)return false;
    /* Pilotage et Carte vivent dans une frame résidente qui sait elle-même
       entrer dans la démonstration, en sortir et changer d'établissement.
       Son URL de démarrage peut donc encore dire « réel » alors que son état
       courant est déjà la Brasserie fictive. Recharger cette frame au retour
       d'Inventaire rejouait toute l'ouverture (0 → score → logo), détruisait
       la position du film et bloquait plusieurs secondes les touchers iOS.

       Une frame Verdict déjà créée ne se recharge jamais pendant une session :
       le contexte, le profil et la reprise du guide passent par postMessage.
       La nouvelle clé est seulement mémorisée pour refléter l'état confirmé. */
    if(module==='verdict'&&state.frames.verdict){
      state.modes.verdict=key;
      return false;
    }
    if(!state.frames[module]||state.modes[module]!==key){
      state.frames[module]=true;state.ready[module]=false;state.modes[module]=key;
      if(module==='verdict')state.lastChildProfileSequence=0;
      if(!options.preload)setLoading(true,module==='inventory'?'Ouverture d’Inventaire…':(state.profile==='carte'?'Ouverture de Carte…':'Ouverture de Pilotage…'));
      frame.src=moduleUrl(module,options);
      return true;
    }
    return false;
  }
  /* Inventaire est préparé une seule fois, caché, après l'entrée dans Carte
     et une pause réelle. Son animation initiale n'est donc jamais rejouée
     devant le client, sans concurrencer les premiers clics de Pilotage. */
  function preloadDemoInventory(){
    if(!startupUnlocked||!state.context||!bool(state.context.demo)||state.frames.inventory)return false;
    return ensureFrame('inventory',{
      demo:true,
      siteId:state.context.siteId||cfg.demoSiteId||'demo-brasserie',
      locale:state.context.locale||rememberedLocale(),
      preload:true
    });
  }
  function send(frame,message){
    try{if(frame&&frame.contentWindow)frame.contentWindow.postMessage(message,targetOrigin());}catch(e){}
  }
  function forwardContext(except){
    if(!state.context)return;
    /* R93 : coupe-circuit. En démonstration, Pilotage et Inventaire se renvoyaient leur contexte sans fin (refreshAll dix fois par seconde, guide figé). La même fiche qui revient une fois sur deux, ou plus de trois diffusions en quatre secondes, n'est plus rediffusée. */(function(){var now=Date.now(),sig=String(state.contextSignature||''),h=window.__vdSigs=window.__vdSigs||[];h.push({s:sig,t:now});while(h.length>6)h.shift();var n=h.length;var flip=n>=3&&h[n-1].s===h[n-3].s&&h[n-2].s!==h[n-1].s&&(now-h[n-3].t)<10000;if(flip)return;var win=h.filter(function(x){return now-x.t<4000;}).length;if(win>3)return;(function(){var now=Date.now(),sig=String(state.contextSignature||''),h=window.__vdSigs=window.__vdSigs||[];h.push({s:sig,t:now});while(h.length>6)h.shift();var n=h.length;var flip=n>=3&&h[n-1].s===h[n-3].s&&h[n-2].s!==h[n-1].s&&(now-h[n-3].t)<10000;if(flip)return;var win=h.filter(function(x){return now-x.t<4000;}).length;if(win>3)return;['verdict','inventory'].forEach(function(module){if(module!==except&&state.frames[module])send(els[module],{type:'verdict-unified-apply-context',context:state.context});});})();})();
  }
  function operationsMatch(data){
    var snapshot=data&&data.snapshot,site=cleanId(data&&data.siteId||snapshot&&snapshot.establishment&&snapshot.establishment.id);if(!snapshot||snapshot.schema!=='verdict.operations.v1'||!site||!state.context)return false;
    return site===cleanId(state.context.siteId)&&bool(data.demo)===bool(state.context.demo);
  }
  function forwardOperations(){if(state.operations&&state.frames.verdict)send(els.verdict,{type:'verdict-unified-apply-operations',snapshot:state.operations});}
  function contextSignature(context){
    if(!context)return '';
    return JSON.stringify({siteId:cleanId(context.siteId),name:cleanText(context.name),accountScope:cleanId(context.accountScope),demo:bool(context.demo),locale:cleanLocale(context.locale)});
  }
  function updateContext(context,sourceModule){
    if(!context||typeof context!=='object')return;
    sourceModule=modules[sourceModule]?sourceModule:(context.source==='inventory'?'inventory':'verdict');
    var next={
      siteId:cleanId(context.siteId),
      name:cleanText(context.name),
      accountScope:cleanId(context.accountScope),
      demo:bool(context.demo),
      source:sourceModule,
      demoData:bool(context.demo)?(context.demoData||(state.context&&state.context.siteId===cleanId(context.siteId)?state.context.demoData:null)||null):null,
      locale:cleanLocale(context.locale||rememberedLocale())
    };
    if(!next.siteId&&!next.name)return;
    syncResidentVerdictMode(next,sourceModule);
    var signature=contextSignature(next);
    if(signature&&signature===state.contextSignature){
      rememberLocale(next.locale);
      if(els.context)els.context.textContent=next.demo?'Démonstration fictive · '+nomDemoC323(next.name||next.siteId):(next.name||next.siteId);
      if(startupVisualReady){if(next.demo)queueDemoInventoryPreload();else queueWorkerRegistration(900);}
      return;
    }
    if(state.operations&&(cleanId(state.operations.establishment&&state.operations.establishment.id)!==next.siteId||bool(state.operations.demo)!==next.demo))state.operations=null;
    state.context=next;state.contextSignature=signature;
    rememberLocale(next.locale);
    if(els.context)els.context.textContent=next.demo?'Démonstration fictive · '+nomDemoC323(next.name||next.siteId):(next.name||next.siteId);
    try{
      var key=cfg.storageKey+':context';
      if(next.demo)sessionStorage.setItem(key,JSON.stringify(next));
      else{var durable=Object.assign({},next);delete durable.locale;localStorage.setItem(key,JSON.stringify(durable));sessionStorage.removeItem(key);}
    }catch(e){}
    forwardContext(sourceModule);
    if(!next.demo){
      demoTourActive=false;demoProgressStep=0;demoProgressUpdatedAt=0;
      if(demoInventoryQuietTimer){clearTimeout(demoInventoryQuietTimer);demoInventoryQuietTimer=0;inventoryPreloadQueued=false;}
    }
    if(startupVisualReady){if(next.demo)queueDemoInventoryPreload();else queueWorkerRegistration(900);}
  }
  function syncModuleTabs(){
    var activeId=state.module==='inventory'?'tab-inventory':(state.profile==='carte'?'tab-carte':'tab-verdict');
    var pendingId=state.pendingModuleSwitch&&state.pendingModuleSwitch.module==='inventory'?'tab-inventory':'';
    ['tab-verdict','tab-carte','tab-inventory'].forEach(function(id){
      var tab=document.getElementById(id),active=id===activeId;if(!tab)return;
      tab.setAttribute('aria-selected',active?'true':'false');tab.tabIndex=active?0:-1;
      if((active&&state.pendingProfile)||id===pendingId)tab.setAttribute('aria-busy','true');else tab.removeAttribute('aria-busy');
    });
    var verdictPanel=document.getElementById('panel-verdict');
    if(verdictPanel)verdictPanel.setAttribute('aria-labelledby',state.profile==='carte'?'tab-carte':'tab-verdict');
  }
  function cancelProfileSwitch(restore){
    if(!state.pendingProfile)return;
    var fallback=cleanProfile(state.renderedProfile||state.profile);
    state.pendingProfile=null;
    /* L’iframe peut encore terminer l’ancienne navigation pendant qu’elle
       est masquée par Inventaire. Son profil réel devient donc volontairement
       inconnu jusqu’à la prochaine activation acquittée. */
    state.renderedProfile='';
    if(restore!==false)state.profile=fallback;
    syncModuleTabs();if(state.module==='verdict')setLoading(false);persist();
  }
  function beginProfileSwitch(profile){
    var request={id:'profile-'+(++state.profileRequestSequence),profile:cleanProfile(profile)};
    state.pendingProfile=request;
    setLoading(true,'Ouverture de '+(request.profile==='carte'?'Carte':'Pilotage')+'…');
    return request.id;
  }
  function finishProfileSwitch(data){
    var requestId=String(data&&data.requestId||''),rendered=cleanProfile(data&&data.profile),sequence=Math.max(0,Math.floor(Number(data&&data.sequence)||0));
    if(sequence&&sequence<state.lastChildProfileSequence)return false;
    /* Une réponse appartenant à une demande remplacée peut malgré tout avoir
       changé la vue dans l’iframe. Elle ne doit pas gagner, mais la coque ne
       doit plus supposer que son dernier profil confirmé est encore visible :
       le prochain retour vers Verdict forcera une resynchronisation. */
    if(requestId&&(!state.pendingProfile||requestId!==state.pendingProfile.id)){state.renderedProfile='';return false;}
    if(state.pendingProfile&&!requestId)return false;
    if(sequence)state.lastChildProfileSequence=sequence;
    state.pendingProfile=null;
    if(data&&data.rendered===false){
      state.profile=cleanProfile(state.renderedProfile||'pilotage');
      syncModuleTabs();persist();setLoading(false);
      return false;
    }
    state.renderedProfile=rendered;state.profile=rendered;
    syncModuleTabs();persist();if(state.module==='verdict')setLoading(false);
    flushVerdictResume();
    return data&&data.rendered!==false;
  }
  function rememberInventoryIntent(options){
    options=options||{};
    if(!options.route&&!options.incidentId&&!bool(options.guide))return;
    state.pendingInventoryIntent={
      route:cleanText(options.route),
      incidentId:cleanId(options.incidentId),
      guide:bool(options.guide),
      resumeDemoStep:Number.isFinite(Number(options.resumeDemoStep))?Math.max(0,Math.floor(Number(options.resumeDemoStep))):null,
      backDemoStep:Number.isFinite(Number(options.backDemoStep))?Math.max(0,Math.floor(Number(options.backDemoStep))):null,
      globalDemoStep:Number.isFinite(Number(options.globalDemoStep))?Math.max(1,Math.floor(Number(options.globalDemoStep))):null,
      globalDemoTotal:Number.isFinite(Number(options.globalDemoTotal))?Math.max(1,Math.floor(Number(options.globalDemoTotal))):null
    };
  }
  function flushInventoryIntent(){
    var intent=state.pendingInventoryIntent;
    if(!intent||!state.ready.inventory)return;
    if(intent.route){send(els.inventory,{type:'verdict-deep-link',route:intent.route});intent.route='';}
    if(intent.incidentId){send(els.inventory,{type:'verdict-inventory-focus',incidentId:intent.incidentId});intent.incidentId='';}
    if(intent.guide)send(els.inventory,{type:'verdict-inventory-guide-open',resumeDemoStep:intent.resumeDemoStep,backDemoStep:intent.backDemoStep,globalDemoStep:intent.globalDemoStep,globalDemoTotal:intent.globalDemoTotal});
    if(!intent.guide&&!intent.route&&!intent.incidentId)state.pendingInventoryIntent=null;
  }
  function rememberVerdictResume(options){
    options=options||{};
    if(!Number.isFinite(Number(options.resumeDemoStep)))return;
    state.pendingVerdictResume={
      requestId:'demo-resume-'+(++state.demoResumeSequence),
      step:Math.max(0,Math.floor(Number(options.resumeDemoStep))),
      profile:cleanProfile(options.profile||'pilotage'),
      sent:false
    };
  }
  function flushVerdictResume(){
    if(!state.pendingVerdictResume||!state.ready.verdict||state.pendingProfile||state.pendingVerdictResume.sent)return false;
    var intent=state.pendingVerdictResume;intent.sent=true;
    send(els.verdict,{type:'verdict-unified-demo-resume',requestId:intent.requestId,step:intent.step,profile:intent.profile});
    return true;
  }
  function finishVerdictResume(data){
    var intent=state.pendingVerdictResume,requestId=String(data&&data.requestId||'');
    if(!intent||!requestId||requestId!==intent.requestId)return false;
    if(data.resumed===true){state.pendingVerdictResume=null;return true;}
    intent.sent=false;return false;
  }
  function flushPendingModuleSwitch(module){
    var pending=state.pendingModuleSwitch;
    if(!pending||pending.module!==module||!state.ready[module])return false;
    state.pendingModuleSwitch=null;
    return activate(module,pending.options,pending.historyMode);
  }
  function activate(module,options,historyMode){
    options=options||{};
    if(!modules[module])module='verdict';
    if(EQUIPE&&module!=='inventory')return false;/* C229 (X36) : jamais Pilotage ni Carte par le lien de l'équipe */
    if(!startupUnlocked&&module!=='verdict'&&!options.authorizedStartup)return false;
    var currentModule=state.module;
    if(state.pendingModuleSwitch&&state.pendingModuleSwitch.module!==module)state.pendingModuleSwitch=null;
    if(module==='verdict'){state.profile=cleanProfile(options.profile||state.profile);rememberVerdictResume(options);}
    else{cancelProfileSwitch(true);rememberInventoryIntent(options);}
    var waitForReady=module!==currentModule&&!state.ready[module];
    var frameReloaded=ensureFrame(module,Object.assign({},options,{profile:state.profile,preload:waitForReady||bool(options.preload)}));
    /* Une destination non prête reste cachée. Le client conserve son écran
       actuel jusqu’au vrai signal load/ready : aucun panneau vide, aucune
       minuterie et aucune animation de démarrage rejouée. */
    if(waitForReady){
      state.pendingModuleSwitch={module:module,options:Object.assign({},options),historyMode:historyMode};
      /* C302 (V15-066) : le libellé suit la destination (il disait « Inventaire » en allant vers Pilotage). */
      setLoading(true,module==='inventory'?'Ouverture d’Inventaire…':(state.profile==='carte'?'Ouverture de Carte…':'Ouverture de Pilotage…'));syncModuleTabs();return true;
    }
    state.pendingModuleSwitch=null;
    state.module=module;
    var profileRequestId='';
    /* Cas critique : Carte est demandée puis Pilotage est retouché avant la
       confirmation. Même si Pilotage était le dernier rendu connu, cette
       seconde intention doit remplacer la transaction Carte en cours. */
    if(module==='verdict'&&!frameReloaded&&options.navigate!==false&&(state.pendingProfile||state.renderedProfile!==state.profile))profileRequestId=beginProfileSwitch(state.profile);
    ['verdict','inventory'].forEach(function(name){
      var active=name===module;
      var panel=document.getElementById('panel-'+name);
      if(panel){panel.classList.toggle('active',active);panel.hidden=!active;if(active)panel.removeAttribute('inert');else panel.setAttribute('inert','');}
      if(els[name])els[name].setAttribute('aria-hidden',active?'false':'true');
      if(!active)send(els[name],{type:'verdict-unified-module-hidden',module:name});
    });
    syncModuleTabs();
    persist();
    if(historyMode!==false){
      var url=new URL(location.href);url.searchParams.set('module',module);url.searchParams.set('profile',state.profile);
      try{history.replaceState({module:module,profile:state.profile},'',url.pathname+url.search+url.hash);}catch(e){}
    }
    if(module==='verdict'){
      if(!frameReloaded&&(profileRequestId||state.renderedProfile!==state.profile))send(els.verdict,{type:'verdict-unified-profile',profile:state.profile,navigate:options.navigate!==false,requestId:profileRequestId});
      forwardOperations();
      flushVerdictResume();
    }else flushInventoryIntent();
    send(els[module],{type:'verdict-unified-module-visible',module:module});
    if(state.ready[module]&&!state.pendingProfile)setLoading(false);
    return true;
  }
  function routeFromChild(data,sourceModule){
    var target=modules[data.module]?data.module:null;if(!target)return;
    var options=data.options&&typeof data.options==='object'?data.options:{};
    if(data.context)updateContext(data.context,sourceModule);
    activate(target,options);
  }
  function loadRememberedContext(){
    var key=cfg.storageKey+':context',value=null;
    var wantsDemo=demoRequested();
    var requestedSite=cleanId(params.get('inventory'));
    if(requestedSite){state.context=null;if(els.context)els.context.textContent='Ouverture de l’établissement…';return;}
    try{
      if(wantsDemo)value=JSON.parse(sessionStorage.getItem(key)||'null');
      else{sessionStorage.removeItem(key);value=JSON.parse(localStorage.getItem(key)||'null');}
    }catch(e){value=null;}
    if(value&&bool(value.demo)===wantsDemo)updateContext(value,value.source);
    else if(wantsDemo&&cfg.edition==='client')updateContext(canonicalDemoContext(),'verdict');
  }
  function restoreRealContext(){
    var key=cfg.storageKey+':context',value=null;
    try{sessionStorage.removeItem(key);value=JSON.parse(localStorage.getItem(key)||'null');}catch(e){value=null;}
    state.context=null;
    if(value&&!bool(value.demo))updateContext(value,value.source);
    else if(els.context)els.context.textContent='Même établissement';
  }
  var networkCheckSerial=0,networkSlowCount=0;
  function networkState(label,state,title){
    if(!els.network)return;
    /* C194 : la vérification périodique du réseau ne réécrit que ce qui change (0 changement au repos) */
    if(els.network.textContent!==label)els.network.textContent=label;
    els.network.classList.toggle('offline',state==='offline');
    els.network.classList.toggle('weak',state==='weak');
    els.network.classList.toggle('checking',state==='checking');
    if(els.network.title!==title)els.network.title=title;
  }
  function updateNetwork(){
    var serial=++networkCheckSerial;
    if(navigator.onLine===false){networkState('Hors ligne','offline','Aucun réseau détecté sur cet appareil');return;}
    var connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    /* C229 (X30) : l'estimation du navigateur (3g, rtt) se trompe en local et après un gros chargement : seule une connexion
       déclarée 2G reste « faible » d'emblée ; le reste se mesure. */
    var declaredWeak=!!connection&&/^(slow-2g|2g)$/.test(connection.effectiveType||'');/* C217 W69 : le débit estimé par le navigateur (downlink) est faux en local et sur les petits échanges : seule la mesure réelle compte */
    if(!window.fetch){networkState(declaredWeak?'Réseau faible':'En ligne',declaredWeak?'weak':'online','État estimé par le navigateur');return;}
    var controller=typeof AbortController==='function'?new AbortController():null;
    var timeout=setTimeout(function(){if(controller)controller.abort();},5000);
    var started=Date.now();
    fetch('./manifest.webmanifest?network-check='+started,{cache:'no-store',signal:controller?controller.signal:undefined}).then(function(response){
      if(serial!==networkCheckSerial)return;
      if(!response.ok)throw new Error('network_check_failed');
      /* C217 W69 : durée réseau réelle (Resource Timing), pas le temps d'attente d'une page encore occupée à démarrer ; deux mesures lentes de suite avant de dire « Réseau faible ». */
      var duree=Date.now()-started;try{var ent=performance.getEntriesByName(response.url||'');if(ent&&ent.length){var en=ent[ent.length-1];if(en.responseEnd>0)duree=Math.min(duree,en.responseEnd-(en.requestStart||en.fetchStart||en.startTime));}}catch(e){}
      /* C229 (X30) : l'attente dans la file du navigateur (chargement de Pilotage, ajout d'un établissement) n'est pas le réseau ;
         les 20 premières secondes, la page charge : aucune mesure lente n'y compte. */
      networkSlowCount=(duree>=1200&&performance.now()>20000)?networkSlowCount+1:0;
      var weak=declaredWeak||networkSlowCount>=2;
      networkState(weak?'Réseau faible':'En ligne',weak?'weak':'online',weak?'Connexion lente vers Verdict':'Connexion à Verdict disponible');
    }).catch(function(){
      if(serial===networkCheckSerial)networkState('Hors ligne','offline','Verdict inaccessible depuis cet appareil');
    }).finally(function(){clearTimeout(timeout);});
  }
  function loadManagerAlert(){
    if(!notificationCenter||demoRequested()||window.VERDICT_TEAM_API_READY!==true)return;
    fetch('/api/team/manager?scope=alerts',{credentials:'same-origin',cache:'no-store'}).then(function(response){
      if(!response.ok)throw new Error('unavailable');return response.json();
    }).then(function(result){
      var rows=[];
      (result&&result.alerts||[]).forEach(function(item){rows.push(item);});
      (result&&result.submissions||[]).forEach(function(item){rows.push(item);});
      var alertTitles={inventory_stockout:'Rupture constatée',inventory_low:'Stock sous le minimum',inventory_order:'Commande à préparer',inventory_submission:'Nouveau comptage reçu',access_security:'Accès Inventaire modifié'};
      var securityLabels={'invitation.created':'Lien personnel créé','invitation.revoked':'Lien annulé','invitation.redeemed':'Nouvel appareil lié','membership.access_updated':'Droits modifiés','membership.suspended':'Accès suspendu','membership.reactivation_link_created':'Nouveau lien de réactivation','membership.reactivated':'Accès réactivé','membership.deleted':'Accès supprimé'};
      var notifications=rows.map(function(item,index){
        var summary={};try{summary=typeof item.summary==='string'?JSON.parse(item.summary||'{}'):(item.summary||{});}catch(e){summary={};}
        var type=cleanText(item.type||'inventory_submission'),place=cleanText(item.establishmentName||item.establishment_name||summary.establishmentName||'Établissement'),detail='';
        if(type==='access_security')detail=securityLabels[summary.action]||'Contrôle de sécurité enregistré';
        else if(summary.message)detail=cleanText(summary.message);
        else detail=Number(summary.observed||0)+' / '+Number(summary.total||0)+' références comptées · '+Number(summary.orderLines||0)+' à commander';
        return {id:'server:'+cleanText(item.id||type+':'+index),source:'Inventaire',module:'inventory',level:type==='inventory_stockout'||type==='access_security'?'critical':'warning',actorName:cleanText(item.actorName||item.actor_name||''),establishmentId:cleanId(item.establishmentId||item.establishment_id||summary.establishmentId||''),establishmentName:place,title:alertTitles[type]||'Information de l’équipe',detail:detail,proof:'Événement enregistré par Inventaire pour cet établissement.',createdAt:item.createdAt||item.created_at||item.reportedAt||new Date().toISOString()};
      });
      notificationCenter.ingestMany(notifications);
    }).catch(function(){});
  }
  function dismissWorkerUpdate(){
    var alert=document.getElementById('verdict-update-alert');
    if(alert&&alert.parentNode)alert.parentNode.removeChild(alert);
  }
  function updateText(index){var texts={fr:['Mise à jour prête','Enregistrez ou exportez vos modifications avant de l’appliquer.','Plus tard','Mettre à jour','Vérification de la sauvegarde…','Réessayer après sauvegarde','Sauvegarde non confirmée : conserve ou exporte ton brouillon avant la mise à jour.','Mise à jour…'],en:['Update ready','Save or export your changes before applying it.','Later','Update','Checking saved changes…','Retry after saving','Saving was not confirmed: keep or export your draft before updating.','Updating…'],es:['Actualización lista','Guarda o exporta tus cambios antes de aplicarla.','Más tarde','Actualizar','Verificando el guardado…','Reintentar después de guardar','Guardado sin confirmar: conserva o exporta tu borrador antes de actualizar.','Actualizando…'],it:['Aggiornamento pronto','Salva o esporta le modifiche prima di applicarlo.','Più tardi','Aggiorna','Verifica del salvataggio…','Riprova dopo il salvataggio','Salvataggio non confermato: conserva o esporta la bozza prima di aggiornare.','Aggiornamento…'],de:['Update bereit','Speichere oder exportiere Änderungen vor dem Update.','Später','Aktualisieren','Speicherung wird geprüft…','Nach dem Speichern erneut versuchen','Speicherung nicht bestätigt: Entwurf vor dem Update sichern oder exportieren.','Aktualisierung…'],nl:['Update klaar','Sla je wijzigingen op of exporteer ze vóór de update.','Later','Bijwerken','Opgeslagen wijzigingen controleren…','Opnieuw proberen na opslaan','Opslaan niet bevestigd: bewaar of exporteer je concept vóór de update.','Bijwerken…'],pt:['Atualização pronta','Guarda ou exporta as alterações antes de atualizar.','Mais tarde','Atualizar','A verificar a gravação…','Tentar após guardar','Gravação não confirmada: conserva ou exporta o rascunho antes de atualizar.','A atualizar…']};return (texts[(document.documentElement.lang||'fr').slice(0,2)]||texts.fr)[index];}
  function presentWorkerUpdate(registration){
    if(!registration||!registration.waiting)return false;
    pendingWorkerUpdate=registration;
    if(demoTourActive||document.getElementById('verdict-update-alert'))return false;
    var alert=document.createElement('section');
    alert.id='verdict-update-alert';alert.className='update-alert';alert.setAttribute('role','status');
    alert.innerHTML='<div><b></b><small></small></div><button type="button" data-update-later></button><button type="button" data-update-now></button>';alert.querySelector('b').textContent=updateText(0);alert.querySelector('small').textContent=updateText(1);alert.querySelector('[data-update-later]').textContent=updateText(2);alert.querySelector('[data-update-now]').textContent=updateText(3);
    alert.querySelector('[data-update-later]').addEventListener('click',dismissWorkerUpdate);
    alert.querySelector('[data-update-now]').addEventListener('click',async function(){
      if(!pendingWorkerUpdate||!pendingWorkerUpdate.waiting)return;
      this.disabled=true;this.textContent=updateText(4);
      var result=await window.VerdictUpdateGuard.prepare();
      if(!result.ok){this.disabled=false;this.textContent=updateText(5);alert.querySelector('small').textContent=updateText(6);return;}
      workerReloadRequested=true;this.textContent=updateText(7);
      pendingWorkerUpdate.waiting.postMessage({type:'SKIP_WAITING'});
    });
    document.body.appendChild(alert);
    return true;
  }
  function watchWorkerUpdate(registration){
    if(!registration)return;
    if(registration.waiting&&navigator.serviceWorker.controller)presentWorkerUpdate(registration);
    registration.addEventListener('updatefound',function(){
      var installing=registration.installing;if(!installing)return;
      installing.addEventListener('statechange',function(){
        if(installing.state==='installed'&&navigator.serviceWorker.controller){
          pendingWorkerUpdate=registration;
          if(!demoTourActive)presentWorkerUpdate(registration);
        }
      });
    });
  }
  function registerWorker(){
    if(workerRegistrationStarted||demoTourActive||location.protocol==='file:'||!('serviceWorker' in navigator)||!cfg.serviceWorker)return false;
    workerRegistrationStarted=true;
    try{performance.mark('verdict-offline-cache-start');}catch(e){}
    navigator.serviceWorker.register(cfg.serviceWorker,{scope:'./',updateViaCache:'none'}).then(function(reg){
      watchWorkerUpdate(reg);
      return navigator.serviceWorker.getRegistrations().then(function(regs){
        var root=new URL('./',location.href).href;
        regs.forEach(function(other){
          if(other!==reg&&other.scope.indexOf(root+'modules/')===0)other.unregister().catch(function(){});
        });
      });
    }).catch(function(){workerRegistrationStarted=false;});
    return true;
  }
  function queueWorkerRegistration(delay){
    if(workerRegistrationQueued||workerRegistrationStarted||demoTourActive||location.protocol==='file:'||!('serviceWorker' in navigator)||!cfg.serviceWorker)return false;
    workerRegistrationQueued=true;
    workerRegistrationTimer=setTimeout(function(){
      workerRegistrationTimer=0;
      afterStartupPaint(function(){workerRegistrationQueued=false;if(!demoTourActive)registerWorker();},260);
    },Math.max(0,Number(delay)||0));
    return true;
  }
  function cancelQueuedWorker(){
    if(workerRegistrationTimer){clearTimeout(workerRegistrationTimer);workerRegistrationTimer=0;workerRegistrationQueued=false;}
  }

  document.querySelectorAll('[data-module]').forEach(function(button){
    button.addEventListener('click',function(){activateCapability(button.getAttribute('data-capability')||capabilityFor(button.getAttribute('data-module'),button.getAttribute('data-profile')),{demo:state.context&&state.context.demo,siteId:state.context&&state.context.siteId});});
    button.addEventListener('keydown',function(event){
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      event.preventDefault();var order=['tab-verdict','tab-carte','tab-inventory'],idx=order.indexOf(button.id);
      var next=order[(idx+(event.key==='ArrowRight'?1:order.length-1))%order.length],target=document.getElementById(next);
      if(target){target.focus();activateCapability(target.getAttribute('data-capability')||capabilityFor(target.getAttribute('data-module'),target.getAttribute('data-profile')),{demo:state.context&&state.context.demo,siteId:state.context&&state.context.siteId});}
    });
  });
  ['verdict','inventory'].forEach(function(module){
    els[module].addEventListener('load',function(){
      state.ready[module]=true;passSafeBottom(els[module]);
      if(module==='verdict'&&state.pendingVerdictResume)state.pendingVerdictResume.sent=false;
      if(module===state.module)setLoading(false);
      send(els[module],{type:'verdict-unified-shell-ready',module:module,context:state.context});
      if(module==='verdict')send(els.verdict,{type:'verdict-unified-profile',profile:state.profile,navigate:false});
      var incident='';try{incident=new URL(els[module].src,location.href).searchParams.get('incident')||'';}catch(e){}if(module==='inventory'&&cleanId(incident))send(els[module],{type:'verdict-inventory-focus',incidentId:cleanId(incident)});
      if(module==='verdict')forwardOperations();
      if(module==='inventory')flushInventoryIntent();else flushVerdictResume();
      flushPendingModuleSwitch(module);
    });
  });
  window.addEventListener('message',function(event){
    if(!sameOriginMessage(event)||!event.data||typeof event.data!=='object')return;
    var data=event.data,sourceModule=moduleForSource(event.source);
    if(data.type==='verdict-unified-context'&&sourceModule===state.module)updateContext(data.context,sourceModule);
    if(data.type==='verdict-unified-switch'&&sourceModule===state.module)routeFromChild(data,sourceModule);
    if(data.type==='verdict-unified-operations'&&sourceModule==='inventory'){
      if(data.context)updateContext(data.context,'inventory');
      if(operationsMatch(data)){state.operations=data.snapshot;forwardOperations();}
    }
    if(data.type==='verdict-unified-startup-state'&&sourceModule==='verdict'&&data.ready===true)setStartupUnlocked(true);
    if(data.type==='verdict-unified-intro-complete'&&sourceModule==='verdict'){
      markStartupVisualReady('verdict');
      if(state.pendingVerdictResume){state.pendingVerdictResume.sent=false;flushVerdictResume();}
    }
    if(data.type==='verdict-unified-demo-resume-result'&&sourceModule==='verdict')finishVerdictResume(data);
    if(data.type==='verdict-unified-demo-progress'&&sourceModule==='verdict'){
      demoTourActive=true;cancelQueuedWorker();
      demoProgressStep=Math.max(1,Math.floor(Number(data.step)||1));demoProgressUpdatedAt=Date.now();
      queueDemoInventoryPreload();
    }
    if(data.type==='verdict-unified-demo-state'&&sourceModule==='verdict'&&data.state==='ended'){
      demoTourActive=false;
      if(demoInventoryQuietTimer){clearTimeout(demoInventoryQuietTimer);demoInventoryQuietTimer=0;inventoryPreloadQueued=false;}
      if(pendingWorkerUpdate)presentWorkerUpdate(pendingWorkerUpdate);
      queueWorkerRegistration(8000);
    }
    if(data.type==='verdict-unified-profile-changed'&&sourceModule==='verdict'){
      finishProfileSwitch(data);
    }
    if(data.type==='verdict-inventory-guide-state'&&sourceModule==='inventory'&&data.state==='opened'&&state.pendingInventoryIntent){
      state.pendingInventoryIntent.guide=false;
      if(!state.pendingInventoryIntent.route&&!state.pendingInventoryIntent.incidentId)state.pendingInventoryIntent=null;
    }
    if(data.type==='verdict-manager-notification'&&notificationCenter&&data.notification){
      var notification=Object.assign({},data.notification,{sourceModule:sourceModule});
      notificationCenter.ingest(notification);
    }
    if(data.type==='verdict-unified-ready'){
      var module=sourceModule;
      state.ready[module]=true;
      if(module==='inventory')try{
        performance.mark('verdict-inventory-preload-ready');
        performance.measure('verdict-inventory-preload','verdict-inventory-preload-start','verdict-inventory-preload-ready');
      }catch(e){}
      if(module===state.module&&!state.context&&data.context)updateContext(data.context,module);
      send(els[module],{type:'verdict-unified-shell-ready',module:module,context:state.context});
      if(module==='inventory')flushInventoryIntent();else flushVerdictResume();
      flushPendingModuleSwitch(module);
    }
  });
  window.addEventListener('online',updateNetwork);window.addEventListener('offline',updateNetwork);
  window.addEventListener('focus',updateNetwork);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)updateNetwork();});
  setInterval(function(){if(!document.hidden)updateNetwork();},30000);
  var networkConnection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  if(networkConnection&&networkConnection.addEventListener)networkConnection.addEventListener('change',updateNetwork);
  if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('controllerchange',function(){
    if(!workerReloadRequested)return;workerReloadRequested=false;location.reload();
  });
  window.addEventListener('resize',syncSafeBottom,{passive:true});
  if(window.visualViewport)window.visualViewport.addEventListener('resize',syncSafeBottom,{passive:true});
  window.addEventListener('orientationchange',function(){(window.requestAnimationFrame||function(fn){Promise.resolve().then(fn);})(syncSafeBottom);},{passive:true});
  window.addEventListener('pageshow',syncSafeBottom,{passive:true});
  window.addEventListener('pagehide',persistNow,{passive:true});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')persistNow();},{passive:true});
  window.addEventListener('storage',function(event){
    if(cfg.edition!=='client'||!event||event.key!==demoResumeKey())return;
    if(event.newValue==='1')updateContext(canonicalDemoContext(),'verdict');
    else if(state.context&&bool(state.context.demo))restoreRealContext();
  });
  if(els.managerAlertClose)els.managerAlertClose.addEventListener('click',function(){
    var id=els.managerAlert&&els.managerAlert.dataset.submissionId||'';try{if(id)sessionStorage.setItem('verdict:manager-alert:dismissed',id);}catch(e){}if(els.managerAlert)els.managerAlert.hidden=true;
  });
  window.addEventListener('focus',loadManagerAlert);
  window.addEventListener('popstate',function(){var q=new URLSearchParams(location.search);activate(modules[q.get('module')]?q.get('module'):'verdict',{profile:cleanProfile(q.get('profile'))},false);});
  window.addEventListener('keydown',function(event){
    if(!event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==='1'){event.preventDefault();activateCapability('pilotage');}if(event.key==='2'){event.preventDefault();activateCapability('carte');}if(event.key==='3'){event.preventDefault();activateCapability('inventory',{demo:state.context&&state.context.demo});}
  });

  var initialLaunchStarted=false;
  function launchInitialModule(){
    if(initialLaunchStarted)return true;
    var demo=demoRequested(),target=capabilityFor(state.module,state.profile),access=window.VerdictWorkspaceAccess&&window.VerdictWorkspaceAccess.getState?window.VerdictWorkspaceAccess.getState():null;
    if(!demo&&window.VERDICT_WORKSPACE_CONNECTED===true){
      /* Refus par défaut : en cas de session absente ou d'API indisponible,
         aucun gros module ni aucune donnée locale ne sont chargés derrière
         l'écran de connexion/erreur. */
      if(!access||!access.ready||!access.authenticated)return false;
      var resolved=window.VerdictWorkspaceAccess.getPreferredTarget?window.VerdictWorkspaceAccess.getPreferredTarget():null;
      if(!resolved||!resolved.site||!resolved.target){setStartupUnlocked(true);setLoading(false);return false;}
      var requested=params.get('module')==='inventory'?'inventory':(params.get('profile')==='carte'?'carte':'');
      if(requested&&resolved.modules[requested]&&resolved.modules[requested].view)target=requested;else target=resolved.target;
    }
    initialLaunchStarted=true;loadRememberedContext();updateNetwork();
    /* Le contexte local restauré ci-dessus ne peut jamais remplacer la
       décision d'accès serveur. Celle-ci est appliquée en dernier. */
    if(!demo&&window.VERDICT_WORKSPACE_CONNECTED===true)updateContext({siteId:resolved.site.id,name:resolved.site.name,accountScope:access.context&&access.context.organisationId,demo:false,source:target==='inventory'?'inventory':'verdict',locale:rememberedLocale()},target==='inventory'?'inventory':'verdict');
    if(target==='inventory'){setStartupUnlocked(true);markStartupVisualReady('workspace-direct');}
    activateCapability(target,{authorizedStartup:true,demo:demo,guide:params.get('guide')==='1',siteId:params.get('inventory')||state.context&&state.context.siteId||'',locale:rememberedLocale(),route:params.get('route')||'',profile:target==='carte'?'carte':state.profile,navigate:false},false);
    loadManagerAlert();return true;
  }
  window.VerdictUnifiedShell={activate:activate,activateModule:activateCapability,getModules:function(){return moduleContracts;},getActiveModule:function(){return capabilityFor(state.module,state.profile);},getContext:function(){return state.context;},getProfile:function(){return state.profile;},notifications:notificationCenter,isStartupUnlocked:function(){return startupUnlocked;},isStartupVisualReady:function(){return startupVisualReady;},hasStarted:function(){return initialLaunchStarted;},version:'3.9.0'};
  if(window.VERDICT_WORKSPACE_CONNECTED===true&&!demoRequested()&&window.VERDICT_WORKSPACE_BOOT_PROMISE&&typeof window.VERDICT_WORKSPACE_BOOT_PROMISE.then==='function'){
    setLoading(true,'Ouverture de votre espace…');
    window.VERDICT_WORKSPACE_BOOT_PROMISE.then(launchInitialModule,launchInitialModule);
  }else launchInitialModule();
})();

