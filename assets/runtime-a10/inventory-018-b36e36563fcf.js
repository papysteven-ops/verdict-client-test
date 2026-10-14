
/* Verdict® Inventaire — démonstration guidée intégrée V1.
   Démarrage uniquement après une demande explicite (?guide=1 ou bouton).
   L'explication reste dans le flux de la page : l'écran réel demeure visible,
   manipulable et parcourable. Verdict reste l'unique autorité du score. */
(function(global){
  'use strict';

  var doc=global.document;
  var step=0;
  var panel=null;
  var marker=null;
  var lastFocus=null;
  var resumeDemoStep=null;
  var backDemoStep=null;
  var globalDemoStep=null;
  var globalDemoTotal=null;
  var placementFrame=0;
  var publicationGuardFrame=0;
  var placementObserver=null;
  var placementFocusDone=false;
  var PERSONNEL_DEMO=false;
  var EMBEDDED=false;
  try{PERSONNEL_DEMO=new URLSearchParams(global.location.search+(self.__vdq||"")).get('staff-demo')==='1';}catch(e){}
  try{EMBEDDED=new URLSearchParams(global.location.search+(self.__vdq||"")).get('embed')==='1'&&global.parent!==global;}catch(e){}
  var VERDICT_URL='../verdict/verdict-app.html?presentation=brasserie&bridge=inventory&inventory=demo-brasserie';

  function css(){
    if(doc.getElementById('inventoryGuideStyle'))return;
    var s=doc.createElement('style');
    s.id='inventoryGuideStyle';
    s.textContent=
      '.inventory-guide-open{scroll-behavior:auto}.demo-guide-start{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:8px 12px;border:1px solid rgba(147,197,253,.58);border-radius:999px;background:rgba(96,165,250,.14);color:#fff;font-weight:850;font-size:12px}.demo-guide-start:focus-visible{outline:3px solid #bfdbfe;outline-offset:2px}'+
      '.inv-guide-inline{position:relative;z-index:4;width:100%;margin:12px 0 14px;padding:17px;border:1px solid rgba(96,165,250,.68);border-left:4px solid #60a5fa;border-radius:20px;background:radial-gradient(115% 135% at 0 0,rgba(59,130,246,.18),transparent 56%),linear-gradient(155deg,#111d2c,#0c121b 70%);box-shadow:0 14px 42px rgba(0,0,0,.42),0 0 28px rgba(59,130,246,.10);scroll-margin-top:64px;overscroll-behavior:contain}'+
      '.inv-guide-inline[data-guide-positioning="1"]{visibility:hidden!important}.inv-guide-inline.guide-scroll{overflow-y:auto}.inv-guide-inline.guide-scroll .inv-guide-actions{position:sticky;bottom:-17px;margin:10px -7px -10px;padding:9px 7px 10px;background:linear-gradient(180deg,rgba(12,18,27,.25),#0c121b 24%);z-index:2}'+
      '.inv-guide-head{display:flex;align-items:center;gap:11px}.inv-guide-progress{flex:1;display:grid;grid-template-columns:repeat(var(--guide-steps,5),1fr);gap:6px}.inv-guide-progress i{height:5px;border-radius:9px;background:#2b3542}.inv-guide-progress i.on{background:#60a5fa;box-shadow:0 0 10px rgba(96,165,250,.35)}.inv-guide-progress.is-global{display:block}.inv-guide-progress i.inv-guide-global{display:block;overflow:hidden}.inv-guide-progress i.inv-guide-global b{display:block;height:100%;border-radius:inherit;background:#60a5fa;box-shadow:0 0 10px rgba(96,165,250,.35)}.inv-guide-close{flex:0 0 42px;width:42px;height:42px;border:1px solid #3a4654;border-radius:13px;color:#d5deea;font-size:22px;background:rgba(8,13,20,.45)}'+
      '.inv-guide-kicker{margin-top:14px;color:#93c5fd;font:800 11px/1.3 var(--mono);letter-spacing:.12em;text-transform:uppercase}.inv-guide-screen{display:inline-flex;margin-top:9px;padding:5px 8px;border:1px solid rgba(96,165,250,.22);border-radius:999px;background:#132234;color:#bfdbfe;font:750 10px/1.2 var(--mono);letter-spacing:.04em}.inv-guide-inline h2{margin:8px 0 8px;color:#fff;font-size:23px;line-height:1.16}.inv-guide-inline h2:focus{outline:none}.inv-guide-question{color:#f8fafc;font-weight:780;font-size:15.5px;line-height:1.35}.inv-guide-copy{margin:7px 0 0;color:#b5c0ce;font-size:14.5px;line-height:1.5}.inv-guide-proof{margin:13px 0;padding:12px 13px;border:1px solid rgba(96,165,250,.38);border-radius:14px;background:rgba(13,31,51,.76);color:#dbeafe;font-size:13.5px;line-height:1.45}.inv-guide-proof b{display:block;margin-bottom:3px;color:#fff;font-size:15.5px}'+
      '.inv-guide-film{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:8px 0 2px}.inv-guide-film span{min-width:0;padding:5px 3px;border:1px solid rgba(148,163,184,.18);border-radius:8px;color:#94a3b8;text-align:center;font:800 clamp(7.5px,2.15vw,9.5px)/1.15 var(--mono);text-transform:uppercase}.inv-guide-film span.on{border-color:rgba(96,165,250,.72);background:rgba(59,130,246,.15);color:#bfdbfe}'+
      '.inv-guide-actions{display:grid;gap:8px}.inv-guide-primary{width:100%;min-height:50px;padding:13px;border-radius:14px;background:linear-gradient(180deg,#78b7ff,#4d94e8);color:#07111d;font-weight:880;font-size:15.5px}.inv-guide-secondary-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.inv-guide-back,.inv-guide-free{min-height:43px;padding:10px;border:1px solid #34485e;border-radius:12px;background:rgba(7,13,21,.45);color:#dbeafe;font-weight:780;font-size:12.5px}.inv-guide-free{color:#fca5a5;border-color:#64343c}.inv-guide-primary:focus-visible,.inv-guide-close:focus-visible,.inv-guide-back:focus-visible,.inv-guide-free:focus-visible{outline:3px solid #bfdbfe;outline-offset:3px}.inv-guide-foot{margin:10px 0 0;text-align:center;color:#8996a6;font-size:11.5px;line-height:1.35}'+
      '.inv-guide-marker{position:relative;z-index:3;margin:0 0 10px;padding:9px 11px;border:1px solid rgba(96,165,250,.5);border-radius:12px;background:linear-gradient(90deg,rgba(18,52,82,.96),rgba(11,23,37,.96));color:#dbeafe;box-shadow:0 8px 22px rgba(0,0,0,.24)}.inv-guide-marker span{display:inline-flex;padding:3px 7px;border-radius:999px;background:#60a5fa;color:#07111d;font:900 9.5px/1.2 var(--mono);letter-spacing:.1em}.inv-guide-marker b{display:block;margin-top:6px;color:#fff;font-size:13.5px;line-height:1.3}.inv-guide-marker small{display:block;margin-top:2px;color:#9fb2c6;font-size:11.5px;line-height:1.35}'+
      '.inventory-verdict-proof{border-color:rgba(96,165,250,.46);background:radial-gradient(110% 120% at 0 0,rgba(96,165,250,.13),transparent 55%),linear-gradient(180deg,var(--card),#101318)}.inventory-proof-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:11px}.inventory-proof-grid div{padding:10px 7px;border:1px solid #2e3e52;border-radius:11px;background:#0b1119;text-align:center}.inventory-proof-grid b{display:block;color:#93c5fd;font:850 16px/1.2 var(--mono)}.inventory-proof-grid span{display:block;margin-top:4px;color:#8b98a8;font-size:11px;line-height:1.3}.inventory-proof-rule{margin:11px 0 0;color:#cbd5e1;font-size:12.5px;line-height:1.5}'+
      '@media(max-width:430px){.inv-guide-inline{margin-top:10px;padding:15px 14px;border-radius:18px}.inv-guide-inline h2{font-size:21px}.inv-guide-copy{font-size:14px}.inv-guide-secondary-row{grid-template-columns:1fr}.inv-guide-back,.inv-guide-free{min-height:42px}.inventory-proof-grid{grid-template-columns:1fr}}'+
      '@media(max-height:690px){.inv-guide-film{display:none}}'+
      /* Sur un iPhone SE, la coque et la barre basse laissent environ 395 px.
         Les deux commandes secondaires empilées faisaient dépasser la fiche
         lors du passage depuis Carte. Ce mode court conserve le texte utile
         et chaque commande dans un seul contour visible, avant le placement. */
      '@media(max-width:350px) and (max-height:620px){.inv-guide-inline{margin:6px 0 8px;padding:9px 10px;border-radius:15px;max-height:calc(100dvh - 70px);overflow-y:auto}.inv-guide-head{gap:7px}.inv-guide-progress{gap:3px}.inv-guide-close{flex-basis:34px;width:34px;height:34px;border-radius:10px;font-size:18px}.inv-guide-kicker{margin-top:6px;font-size:11px}.inv-guide-screen,.inv-guide-foot{display:none}.inv-guide-inline h2{margin:4px 0;font-size:17px;line-height:1.08}.inv-guide-question{font-size:12.5px;line-height:1.24}.inv-guide-copy{margin-top:3px;font-size:11.5px;line-height:1.32}.inv-guide-proof{margin:6px 0;padding:6px 8px;border-radius:10px;font-size:11px;line-height:1.3}.inv-guide-proof b{margin-bottom:1px;font-size:12.5px}.inv-guide-actions{gap:5px}.inv-guide-primary{min-height:40px;padding:8px;border-radius:11px;font-size:12.5px}.inv-guide-secondary-row{grid-template-columns:1fr 1fr;gap:5px}.inv-guide-back,.inv-guide-free{min-height:36px;padding:6px;border-radius:10px;font-size:11px}.inv-guide-inline.guide-scroll .inv-guide-actions{bottom:-9px;margin:6px -4px -4px;padding:5px 4px 4px}}'+
      '@media(prefers-reduced-motion:reduce){.inventory-guide-open{scroll-behavior:auto}.inv-guide-progress i.on{box-shadow:none}}';
    doc.head.appendChild(s);
  }

  function money(n){
    try{return global.eur(n);}catch(e){return Math.round(Number(n)||0).toLocaleString('fr-FR')+' €';}
  }

  function metrics(){
    var v=global.valuationForSite(global.DB.site);
    var orders=global.ordersForSite(global.DB.site);
    var orderValue=0,alerts=0,suppliers={},roundedValue=0;
    var contract=global.VERDICT_BRASSERIE_INVENTORY_DEMO||{};
    var plan=null;
    orders.forEach(function(x){
      var price=Number(x.p.price)||0;
      if(price>0)orderValue+=Number(x.st.need||0)*price;
      suppliers[x.p.sup||'Sans fournisseur']=true;
    });
    try{
      global.siteRows(global.DB.site).forEach(function(x){
        var rowState=global.state(x.p);
        if(rowState.k==='rup'||rowState.k==='min')alerts++;
      });
    }catch(e){}
    try{
      plan=global.inventoryOrderPlanSummary&&global.inventoryOrderPlanSummary(global.DB.site);
      if(plan&&plan.site===global.DB.site&&plan.rows===orders.length&&plan.unknownPrices===0){
        orderValue=Number(plan.rawValue)||0;
        roundedValue=Number(plan.roundedValue)||0;
        suppliers={};
        for(var i=0;i<plan.suppliers;i++)suppliers['plan-'+i]=true;
      }
    }catch(e){}
    return {
      total:v.total,
      counted:v.counted,
      priced:v.priced,
      value:Math.round(v.eur*100)/100,
      coverage:v.total?Math.round(v.priced/v.total*100):0,
      orders:orders.length,
      orderValue:Math.round(orderValue*100)/100,
      roundedOrderValue:Math.round(roundedValue*100)/100,
      alerts:alerts,
      suppliers:Object.keys(suppliers).length,
      site:global.siteName(global.DB.site),
      establishmentId:contract.establishmentId||global.DB.site
    };
  }

  function data(m){
    if(PERSONNEL_DEMO)return [
      {route:'count',anchor:'#countList',screen:'Compter',opened:'Votre zone Cuisine est ouverte',hint:'Seules les références autorisées sont visibles ; Verdict, le Bar et les données du gérant restent absents.',kicker:'1 · Votre mission',title:'Compter uniquement ce qui vous est confié',question:'Que reste-t-il réellement en Cuisine ?',copy:'Votre accès personnel ouvre un seul établissement, les zones choisies par le gérant et rien d’autre. Ici, seul le comptage Cuisine est autorisé.',proof:'<b>'+m.counted+'/'+m.total+' références observées</b>Accès Cuisine uniquement · aucun chiffre Verdict visible.',next:'Comprendre la bonne saisie'},
      {route:'count',anchor:'#countList',screen:'Compter',opened:'Les quantités restent modifiables',hint:'Chaque quantité est enregistrée dans votre zone sans ouvrir les prix, les commandes ni les analyses.',kicker:'2 · Saisir juste',title:'Une case vide n’est jamais un zéro',question:'Comment signaler une vraie rupture ?',copy:'Laissez vide ce que vous n’avez pas vérifié. Saisissez zéro uniquement si vous avez réellement constaté la rupture.',proof:'<b>Vide = non vérifié · 0 = rupture constatée</b>Le gérant sait exactement ce qui a été observé.',next:'Préparer l’envoi au gérant'},
      {route:'count',anchor:'#countList',screen:'Envoi',opened:'Le comptage reste sous vos yeux',hint:'Dans un accès réel, le bouton d’envoi nominatif se trouve au-dessus de cet Inventaire.',kicker:'3 · Transmettre',title:'Envoyer une preuve nominative',question:'Que reçoit le gérant ?',copy:'Votre prénom, la date, l’établissement, la zone et le résumé du comptage. Vous ne transmettez jamais un accès à Verdict.',proof:'<b>Professionnel identifié · envoi horodaté</b>Le gérant reçoit une alerte et votre saisie reste traçable.',next:'Voir les décisions possibles'},
      {route:'count',anchor:'#countList',screen:'Suivi',opened:'Votre Inventaire reste disponible',hint:'Après sa décision, le statut apparaît dans votre accès personnel sans code quotidien.',kicker:'4 · Suivre',title:'Le gérant garde la décision finale',question:'Que peut-il faire après votre envoi ?',copy:'Il peut valider, demander un réajustement ou simplement marquer le comptage comme vu. Vous voyez ensuite le statut et, si nécessaire, sa consigne.',proof:'<b>Validé · À réajuster · Vu</b>Accès révocable immédiatement, Verdict toujours inaccessible.',next:'Terminer et explorer',finish:true}
    ];
    return [
      {route:'count',anchor:'#countList',screen:'Compter',opened:'Liste de comptage ouverte',hint:m.counted+'/'+m.total+' références de la Brasserie sont visibles juste dessous.',kicker:'1 · Compter',title:'Observer le stock réel',question:'La dérive vue dans la Carte existe-t-elle dans le stock ?',copy:'Une case vide reste inconnue. Un zéro signifie une rupture réellement constatée : la preuve commence par un comptage sans ambiguïté.',proof:'<b>'+m.counted+'/'+m.total+' références observées</b>Cuisine et Bar · même Brasserie Collet.',next:'Transformer le comptage en besoin'},
      {route:'order',anchor:'#orderList',screen:'Commande',opened:'Décision et besoins ouverts',hint:'La rupture, les besoins datés et les fournisseurs restent visibles et modifiables.',kicker:'2 · Décider',title:'Transformer le comptage en besoin',question:'Qu’est-ce qui doit être traité maintenant ?',copy:'Inventaire combine le comptage, la cible et les besoins datés. Il classe les ruptures sans inventer une disponibilité fournisseur.',proof:'<b>'+m.alerts+' alerte(s) · '+m.orders+' produit(s) à traiter</b>Le zéro observé reste visible et prioritaire.',next:'Préparer la commande'},
      {route:'order',anchor:'#orderList',screen:'Commande',opened:'Commandes par fournisseur ouvertes',hint:m.suppliers+' fournisseur(s), leurs quantités et leurs échéances sont visibles juste dessous.',kicker:'3 · Commander',title:'Préparer la commande sans fausser le coût',question:'Chez qui commander, avant quand et pour combien ?',copy:'Le besoin brut vient du stock. Le cockpit applique ensuite les colis et sépare préparée, envoyée, confirmée, partielle et réceptionnée.',proof:'<b>Besoin brut '+money(m.orderValue)+' HT</b>'+(m.roundedOrderValue?'Commande arrondie aux colis '+money(m.roundedOrderValue)+' HT · ':'')+m.suppliers+' fournisseurs · disponibilité à confirmer.',next:'Vérifier la preuve chiffrée'},
      {route:'stats',anchor:'#statsBody',screen:'Analyse',opened:'Analyse et preuve Inventaire ouvertes',hint:'Valorisation, couverture et identifiant commun sont visibles dans la page réelle.',kicker:'4 · Comprendre',title:'Prouver la valeur et la couverture',question:'Que transmet réellement Inventaire ?',copy:'Le transfert transporte le stock, la couverture et les opérations. Il ne transporte jamais un score et ne crée jamais un second établissement.',proof:'<b>'+m.establishmentId+' · '+money(m.value)+' HT</b>'+m.priced+'/'+m.total+' références · couverture '+m.coverage+' %.',next:'Relier la preuve à la décision'},
      {route:'stats',anchor:'#statsBody',screen:'Analyse → Verdict',opened:'Passage vers Verdict ouvert',hint:'La preuve et le bouton réel vers Verdict sont accessibles plus bas sur cette même page.',kicker:'5 · Relier',title:'Inventaire prouve, Pilotage décide',question:'Que devient cette preuve dans Verdict ?',copy:'Pilotage la rapproche des ventes, achats, charges et équipes. Le moteur garde un seul établissement et transforme la preuve en priorité mesurable.',proof:'<b>Carte → Inventaire → Pilotage</b>Aucune double saisie, aucun indice transporté, aucun second établissement.',next:'Transformer cette preuve en décision',finish:true}
    ];
  }

  function usefulFocus(node){
    if(!node||node===doc.body||node===doc.documentElement||!node.isConnected||typeof node.focus!=='function')return false;
    if(node.closest&&node.closest('[hidden],[aria-hidden="true"]'))return false;
    return !node.getClientRects||node.getClientRects().length>0;
  }

  function restoreTarget(){
    var choices=[lastFocus,doc.querySelector('.demo-guide-start'),doc.querySelector('nav button.on'),doc.querySelector('.brand[tabindex]')];
    for(var i=0;i<choices.length;i++)if(usefulFocus(choices[i]))return choices[i];
    return null;
  }

  function removeNodes(){
    if(placementFrame&&global.cancelAnimationFrame)global.cancelAnimationFrame(placementFrame);
    if(publicationGuardFrame&&global.cancelAnimationFrame)global.cancelAnimationFrame(publicationGuardFrame);
    placementFrame=0;publicationGuardFrame=0;placementFocusDone=false;
    if(placementObserver){try{placementObserver.disconnect();}catch(e){}placementObserver=null;}
    if(panel&&panel.parentNode)panel.parentNode.removeChild(panel);
    if(marker&&marker.parentNode)marker.parentNode.removeChild(marker);
    panel=null;
    marker=null;
  }

  function removeGuideParam(){
    try{
      var u=new URL(global.location.href);
      if(u.searchParams.get('guide')==='1'){
        u.searchParams.delete('guide');
        var qs=u.searchParams.toString();
        global.history.replaceState({},'',u.pathname+(qs?'?'+qs:'')+u.hash);
      }
    }catch(e){}
  }

  function makePanel(items,item){
    var integrated=globalDemoStep!==null&&globalDemoTotal!==null;
    var currentGlobal=integrated?Math.min(globalDemoTotal,globalDemoStep+step):step+1;
    var progress=integrated?
      '<i class="inv-guide-global" aria-hidden="true"><b style="width:'+Math.round(currentGlobal/globalDemoTotal*100)+'%"></b></i>':
      items.map(function(_,i){return '<i class="'+(i<=step?'on':'')+'" aria-hidden="true"></i>';}).join('');
    var film=integrated?'<div class="inv-guide-film" aria-label="Pilotage, Carte, Inventaire, Décider"><span>1 · Pilotage</span><span>2 · Carte</span><span class="on">3 · Inventaire</span><span>4 · Décider</span></div>':'';
    var el=doc.createElement('section');
    el.id='inventoryGuide';
    el.className='inv-guide-inline';
    el.setAttribute('role','region');
    el.setAttribute('aria-labelledby','inventoryGuideTitle');
    el.setAttribute('aria-live','polite');
    el.setAttribute('data-guide-positioning','1');
    el.innerHTML=
      '<div class="inv-guide-head">'+
        '<div class="inv-guide-progress'+(integrated?' is-global':'')+'" style="--guide-steps:'+items.length+'" role="progressbar" aria-label="Progression" aria-valuemin="1" aria-valuemax="'+(integrated?globalDemoTotal:items.length)+'" aria-valuenow="'+currentGlobal+'" aria-valuetext="Étape '+currentGlobal+' sur '+(integrated?globalDemoTotal:items.length)+'">'+progress+'</div>'+
        '<button class="inv-guide-close" type="button" aria-label="Quitter le parcours et explorer cet écran">×</button>'+
      '</div>'+
      '<div class="inv-guide-kicker"></div>'+film+'<div class="inv-guide-screen"></div><h2 id="inventoryGuideTitle" tabindex="-1"></h2><div class="inv-guide-question"></div><p class="inv-guide-copy"></p><div class="inv-guide-proof"></div>'+
      '<div class="inv-guide-actions"><button class="inv-guide-primary" type="button"></button><div class="inv-guide-secondary-row"><button class="inv-guide-back" type="button"></button><button class="inv-guide-free" type="button">Quitter et explorer</button></div></div>'+
      '<p class="inv-guide-foot">Écran réel visible sous l’explication · aucune donnée réelle utilisée</p>';
    el.querySelector('.inv-guide-kicker').textContent=integrated?'Chapitre 3 / 4 · Inventaire · '+currentGlobal+' / '+globalDemoTotal:item.kicker;
    el.querySelector('.inv-guide-screen').textContent='Écran : '+item.screen;
    el.querySelector('h2').textContent=item.title;
    el.querySelector('.inv-guide-question').textContent=item.question;
    el.querySelector('.inv-guide-copy').textContent=item.copy;
    el.querySelector('.inv-guide-proof').innerHTML=item.proof;
    el.querySelector('.inv-guide-primary').textContent=item.next;
    el.querySelector('.inv-guide-back').textContent=step===0?(backDemoStep!==null?'← Revenir à Carte':'← Retour à Inventaire'):'← Étape précédente';
    el.querySelector('.inv-guide-close').addEventListener('click',close);
    el.querySelector('.inv-guide-free').addEventListener('click',close);
    el.querySelector('.inv-guide-back').addEventListener('click',previous);
    el.querySelector('.inv-guide-primary').addEventListener('click',next);
    return el;
  }

  function makeMarker(item){
    var el=doc.createElement('div');
    el.className='inv-guide-marker';
    el.setAttribute('role','status');
    el.innerHTML='<span>ÉCRAN OUVERT</span><b></b><small></small>';
    el.querySelector('b').textContent=item.opened;
    el.querySelector('small').textContent=item.hint;
    return el;
  }

  function guideViewport(){
    var vv=global.visualViewport,offset=vv&&Number.isFinite(vv.offsetTop)?vv.offsetTop:0;
    var height=vv&&Number.isFinite(vv.height)?vv.height:(global.innerHeight||doc.documentElement.clientHeight||0);
    var top=offset+10,bottom=offset+height-10,nav=doc.querySelector('nav');
    if(nav){var nr=nav.getBoundingClientRect();if(nr.height>0&&nr.top>0)bottom=Math.min(bottom,nr.top-10);}
    return {top:top,bottom:bottom,height:Math.max(0,bottom-top)};
  }

  /* La fiche est d'abord mesurée hors affichage, puis publiée seulement quand
     son contour tient entièrement entre le haut lisible et la barre basse. */
  function placePanel(){
    if(!panel||!panel.isConnected)return;
    if(placementFrame&&global.cancelAnimationFrame)global.cancelAnimationFrame(placementFrame);
    if(publicationGuardFrame&&global.cancelAnimationFrame)global.cancelAnimationFrame(publicationGuardFrame);
    publicationGuardFrame=0;
    if(placementObserver){try{placementObserver.disconnect();}catch(e){}placementObserver=null;}
    /* Une variation réelle du viewport (barre Safari, rotation, coque rendue
       visible) remet brièvement le panneau en mesure. Il ne réapparaît que
       lorsque son contour et la barre basse ont repris leur place finale. */
    panel.setAttribute('data-guide-positioning','1');
    var raf=global.requestAnimationFrame||function(fn){Promise.resolve().then(fn);return 0;};
    var frameCount=0,lastGeometry='',stableFrames=0,done=false;
    function finishPlacement(){done=true;placementFrame=0;if(placementObserver){try{placementObserver.disconnect();}catch(e){}placementObserver=null;}}
    function position(){
      placementFrame=0;
      if(done||!panel||!panel.isConnected){finishPlacement();return;}
      var viewport=guideViewport();
      if(frameCount===0){panel.style.removeProperty('max-height');panel.style.removeProperty('overflow-y');panel.classList.remove('guide-scroll');}
      var rect=panel.getBoundingClientRect();
      if(viewport.height>96&&rect.height>viewport.height){
        panel.style.maxHeight=Math.floor(viewport.height)+'px';panel.style.overflowY='auto';panel.classList.add('guide-scroll');
      }
      rect=panel.getBoundingClientRect();
      var root=doc.scrollingElement||doc.documentElement,current=(root&&root.scrollTop)||global.pageYOffset||0;
      var wanted=Math.max(0,Math.round(current+rect.top-viewport.top));
      if(root)root.scrollTop=wanted;
      try{global.scrollTo({top:wanted,left:0,behavior:'auto'});}catch(e){global.scrollTo(0,wanted);}
      rect=panel.getBoundingClientRect();
      var geometry=[Math.round(rect.top),Math.round(rect.bottom),Math.round(rect.height),Math.round(viewport.top),Math.round(viewport.bottom)].join(':');
      stableFrames=geometry===lastGeometry?stableFrames+1:0;lastGeometry=geometry;frameCount++;
      var fits=rect.top>=viewport.top-2&&rect.bottom<=viewport.bottom+2;
      if(fits&&stableFrames>=2&&panel.getAttribute('data-guide-positioning')==='1'){
        panel.removeAttribute('data-guide-positioning');
        if(!placementFocusDone){placementFocusDone=true;try{panel.querySelector('h2').focus({preventScroll:true});}catch(e){}}
        try{if(EMBEDDED)global.parent.postMessage({type:'verdict-inventory-guide-state',state:'opened',step:step+1},(global.location.protocol==='file:'||global.location.origin==="null")?'*':global.location.origin);}catch(e){}
        finishPlacement();
        /* L'iframe parente peut encore achever sa transition après notre
           publication. Pendant 36 images au maximum, on ne devine aucun
           délai : on mesure réellement le contour et on recale seulement
           si la géométrie quitte la zone visible. */
        var publishedPanel=panel,guardFrames=0;
        function guardPublishedGeometry(){
          publicationGuardFrame=0;
          if(panel!==publishedPanel||!publishedPanel||!publishedPanel.isConnected||publishedPanel.getAttribute('data-guide-positioning')==='1')return;
          var visible=guideViewport(),publishedRect=publishedPanel.getBoundingClientRect();
          if(publishedRect.top<visible.top-2||publishedRect.bottom>visible.bottom+2){placePanel();return;}
          guardFrames++;
          if(guardFrames<36)publicationGuardFrame=raf(guardPublishedGeometry);
        }
        publicationGuardFrame=raf(guardPublishedGeometry);
        return;
      }
      if(frameCount<12){placementFrame=raf(position);return;}
      /* Si la coque n’a pas encore rendu l’iframe visible, la fiche reste
         cachée. Le message explicite de visibilité ou ResizeObserver relance
         le cadrage ; elle n'est jamais publiée hors écran par épuisement. */
      panel.setAttribute('data-guide-positioning','1');placementFrame=0;
    }
    position();
    if(typeof global.ResizeObserver==='function'){
      placementObserver=new global.ResizeObserver(function(){if(!done&&!placementFrame)placementFrame=raf(position);});
      placementObserver.observe(panel);
    }
  }

  function routeDejaOuverte(route){
    var view=doc.getElementById('v-'+String(route||''));
    return !!(view&&view.classList&&view.classList.contains('on'));
  }

  function render(){
    var m=metrics(),items=data(m),item=items[step];
    if(!item)return close();
    removeNodes();
    /* Les étapes 19–20 puis 21–22 partagent le même écran réel. S'il est
       déjà ouvert, le redessiner relance ses animations sans rien montrer de
       nouveau. Seule la fiche du guide change ; la vue dessous reste stable. */
    if(!routeDejaOuverte(item.route))try{global.go(item.route);}catch(e){}
    var anchor=doc.querySelector(item.anchor)||doc.getElementById('v-'+item.route);
    if(!anchor||!anchor.parentNode)return close();
    panel=makePanel(items,item);
    marker=makeMarker(item);
    anchor.parentNode.insertBefore(panel,anchor);
    anchor.parentNode.insertBefore(marker,anchor);
    doc.body.classList.add('inventory-guide-open');
    placePanel();
  }

  function prepareIntegratedGuide(){
    if(!EMBEDDED||resumeDemoStep===null)return;
    /* Le parcours Tout Verdict possède déjà son introduction. L'onboarding
       autonome Inventaire ne doit ni le recouvrir, ni réclamer un second
       démarrage, ni rejouer son splash au changement de module. */
    try{if(global.DB){global.DB.profile=global.DB.profile||{};global.DB.profile.done=true;}}catch(e){}
    var welcome=doc.getElementById('welcome');
    if(welcome){welcome.classList.remove('on','out','anim');welcome.hidden=true;welcome.setAttribute('aria-hidden','true');welcome.style.display='none';}
    var splash=doc.getElementById('splash');
    if(splash&&splash.parentNode)splash.parentNode.removeChild(splash);
  }

  function open(index,options){
    if(!global.DEMO){
      try{global.info('Démonstration disponible','Ouvrez la Brasserie fictive pour lancer ce parcours sans toucher à vos données.');}catch(e){}
      return false;
    }
    options=options&&typeof options==='object'?options:{};
    if(Number.isFinite(Number(options.resumeDemoStep)))resumeDemoStep=Math.max(0,Math.floor(Number(options.resumeDemoStep)));
    if(Number.isFinite(Number(options.backDemoStep)))backDemoStep=Math.max(0,Math.floor(Number(options.backDemoStep)));
    if(Number.isFinite(Number(options.globalDemoStep)))globalDemoStep=Math.max(1,Math.floor(Number(options.globalDemoStep)));
    if(Number.isFinite(Number(options.globalDemoTotal)))globalDemoTotal=Math.max(1,Math.floor(Number(options.globalDemoTotal)));
    prepareIntegratedGuide();
    if(!panel||!panel.isConnected)lastFocus=doc.activeElement;
    step=Math.max(0,Math.min(data(metrics()).length-1,Number(index)||0));
    render();
    return true;
  }

  function close(options){
    options=options||{};
    removeNodes();
    doc.body.classList.remove('inventory-guide-open');
    removeGuideParam();
    if(!options.skipFocus){
      try{var restore=restoreTarget();if(restore)restore.focus({preventScroll:true});}catch(e){}
    }
    lastFocus=null;
  }

  function previous(){
    if(step<=0){
      if(backDemoStep!==null&&global.VerdictUnified&&global.VerdictUnified.embedded){
        var target=backDemoStep;close({skipFocus:true});resumeDemoStep=null;backDemoStep=null;globalDemoStep=null;globalDemoTotal=null;
        global.VerdictUnified.requestSwitch('verdict',{demo:true,profile:'carte',resumeDemoStep:target,bridge:true,siteId:'demo-brasserie'});return;
      }
      close();return;
    }
    step--;
    render();
  }

  function next(){
    var items=data(metrics());
    if(step>=items.length-1){
      close({skipFocus:true});
      if(PERSONNEL_DEMO)return;
      if(global.VerdictUnified&&global.VerdictUnified.embedded){
        var target=resumeDemoStep;resumeDemoStep=null;backDemoStep=null;globalDemoStep=null;globalDemoTotal=null;
        /* La reprise possède déjà sa destination exacte. Ne pas ouvrir
           l’Accueil Pilotage entre Inventaire et l’étape Décider : ce détour
           rejouait inutilement toutes les animations déjà montrées. */
        var options={demo:true,profile:'pilotage',navigate:false,bridge:true,siteId:'demo-brasserie'};
        if(target!==null)options.resumeDemoStep=target;
        global.VerdictUnified.requestSwitch('verdict',options);
        return;
      }
      global.location.href=VERDICT_URL;
      return;
    }
    step++;
    render();
  }

  function autoRequested(){try{return new URLSearchParams(global.location.search+(self.__vdq||"")).get('guide')==='1';}catch(e){return false;}}
  function unifiedUrl(query){return new URL('../../index.html'+query,(self.__vdBase||global.location.href)).href;}
  function restart(){
    if(PERSONNEL_DEMO){var u=new URL(global.location.href);u.searchParams.set('guide','1');global.location.href=u.href;return;}
    global.top.location.href=unifiedUrl('?module=inventory&demo=1&guide=1');
  }
  function exitDemo(){
    if(PERSONNEL_DEMO){global.top.location.href='/stock';return;}
    try{global.localStorage.removeItem('verdict:demo:resume:client:v1');}catch(e){}
    global.top.location.href=unifiedUrl('?module=verdict');
  }

  css();
  doc.addEventListener('keydown',function(event){if(event.key==='Escape'&&panel&&panel.isConnected){event.preventDefault();close();}});
  doc.addEventListener('click',function(event){
    var navButton=event.target&&event.target.closest?event.target.closest('nav button'):null;
    if(navButton&&panel&&panel.isConnected)close();
  });
  global.addEventListener('message',function(event){
    if(!EMBEDDED||event.source!==global.parent||(global.location.origin!=="null"&&global.location.protocol!=='file:')&&event.origin!==global.location.origin||!event.data)return;
    if(event.data.type==='verdict-inventory-guide-open')open(0,{resumeDemoStep:event.data.resumeDemoStep,backDemoStep:event.data.backDemoStep,globalDemoStep:event.data.globalDemoStep,globalDemoTotal:event.data.globalDemoTotal});
    if(event.data.type==='verdict-unified-module-visible'&&panel&&panel.isConnected)placePanel();
  });
  global.addEventListener('orientationchange',function(){if(panel&&panel.isConnected)placePanel();},{passive:true});
  if(global.visualViewport)global.visualViewport.addEventListener('resize',function(){if(panel&&panel.isConnected)placePanel();},{passive:true});
  global.inventoryGuideOpen=open;
  global.inventoryGuideClose=close;
  global.inventoryDemoRestart=restart;
  global.inventoryDemoExit=exitDemo;
  global.InventoryGuide=Object.freeze({version:'1.7.2',open:open,close:close,previous:previous,restart:restart,exit:exitDemo,inspect:function(){return {active:!!(panel&&panel.isConnected),step:step+1,total:data(metrics()).length,mode:'inline',personnelDemo:PERSONNEL_DEMO,establishmentId:global.DB&&global.DB.site||'',verdictUrl:PERSONNEL_DEMO?'':VERDICT_URL,resumeDemoStep:resumeDemoStep,backDemoStep:backDemoStep,globalDemoStep:globalDemoStep,globalDemoTotal:globalDemoTotal,globalCurrentStep:globalDemoStep===null?null:globalDemoStep+step};}});
  if(autoRequested()&&!EMBEDDED){var start=global.requestAnimationFrame||function(fn){Promise.resolve().then(fn);};start(function(){open(0);});}
})(window);

