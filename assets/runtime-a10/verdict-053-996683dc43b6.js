
/* =====================================================================
   VERDICT® · Couche premium R40 · comportement · 22 septembre 2026
   Ne calcule aucun euro, n'écrit aucune phrase à traduire, ne modifie
   ni le moteur ni les données. Lit l'état que l'app affiche déjà
   (couleur du bord d'une carte, note /100 d'un indicateur) et le met
   en forme selon la grammaire des maquettes premium :
     - chaque module prend la couleur de SON résultat (liseré + halo) ;
     - les 12 notes deviennent des pistes à zones avec curseur ;
     - les gestes verts ou jaunes deviennent ivoire (le vert = réussite).
   Aucune boucle permanente : un observateur des vues, des minuteries
   bornées. Interrupteur : ?premium=off / ?premium=on, ou
   VerdictPremium.couper() / VerdictPremium.retablir().
   ===================================================================== */
(function(global){
  'use strict';
  var doc=global.document;
  if(!doc||!doc.documentElement||global.VerdictPremium)return;
  var root=doc.documentElement,KEY='verdict.premium',XHTML='http://www.w3.org/1999/xhtml';

  function lire(){try{return global.localStorage.getItem(KEY);}catch(e){return null;}}
  function ecrire(v){try{if(v===null)global.localStorage.removeItem(KEY);else global.localStorage.setItem(KEY,v);}catch(e){}}
  try{
    var q=new URLSearchParams(global.location.search+(self.__vdq||"")).get('premium');
    if(q==='off')ecrire('off');else if(q==='on')ecrire(null);
  }catch(e){}

  var surface=root.getAttribute('data-p40-surface')||
    (doc.getElementById('frame-verdict')?'shell':doc.getElementById('v-pil')?'app':'inv');
  var RM=false;
  try{RM=global.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}

  /* ---------- couleurs ---------- */
  function rgb(s){
    var m=/rgba?\(([^)]+)\)/.exec(s||'');if(!m)return null;
    var p=m[1].split(',').map(function(x){return parseFloat(x);});
    return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};
  }
  /* Teinte → sens. Un gris n'est pas un état : il reste neutre. */
  function teinte(c,alphaMin){
    if(!c||c.a<(alphaMin||0.2))return null;
    var r=c.r/255,g=c.g/255,b=c.b/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
    if(d<0.12)return null;
    var s=l>0.5?d/(2-max-min):d/(max+min);if(s<0.35)return null;
    var h;if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;
    h*=60;if(h<0)h+=360;
    if(h<14||h>=340)return 'rouge';if(h<38)return 'orange';if(h<66)return 'jaune';
    if(h>=85&&h<170)return 'vert';if(h>=190&&h<245)return 'info';if(h>=245&&h<300)return 'violet';
    return null;
  }
  function zone100(v){return v>=75?'vert':v>=60?'jaune':v>=30?'orange':'rouge';}

  /* ---------- 1. chaque module prend la couleur de son résultat ---------- */
  var SAUT={BUTTON:1,A:1,INPUT:1,SELECT:1,TEXTAREA:1,LABEL:1,SPAN:1,B:1,I:1,STRONG:1,EM:1,SMALL:1,IMG:1,
    TABLE:1,THEAD:1,TBODY:1,TR:1,TD:1,TH:1,LI:1,UL:1,OL:1,P:1,H1:1,H2:1,H3:1,H4:1,SUMMARY:1,OPTION:1,CANVAS:1,NAV:1};
  function etats(scope){
    var els=scope.getElementsByTagName('*');
    for(var i=0;i<els.length;i++){
      var el=els[i];
      if(el.namespaceURI!==XHTML||SAUT[el.tagName]||el.hasAttribute('data-p40'))continue;
      var h=el.offsetHeight;if(!(h>=56))continue;
      if(!(el.offsetWidth>=160))continue;
      var cs=global.getComputedStyle(el),e=null;
      if((parseFloat(cs.borderLeftWidth)||0)>=2)e=teinte(rgb(cs.borderLeftColor));
      else if((parseFloat(cs.borderTopWidth)||0)>=1&&cs.borderTopColor===cs.borderLeftColor&&cs.borderTopColor===cs.borderBottomColor)
        e=teinte(rgb(cs.borderTopColor),0.25);
      if(e){el.setAttribute('data-p40',e);el.classList.add('p40-lise');}
      else if((parseFloat(cs.borderLeftWidth)||0)>=2)el.setAttribute('data-p40','0');
    }
  }

  /* ---------- 2. les 12 notes : piste à zones + curseur ---------- */
  function pistes(scope){
    var bars=scope.querySelectorAll('#d-score .ind .bario:not(.p40-track)'),n=0;
    for(var i=0;i<bars.length;i++){
      var b=bars[i];if(b.offsetParent===null)continue;
      var s=b.parentElement&&b.parentElement.querySelector('.s');if(!s)continue;
      var t=(s.textContent||'').trim();if(!/^\d{1,3}$/.test(t))continue;
      var v=Math.max(0,Math.min(100,parseInt(t,10)));
      var fill=b.querySelector('i'),col=fill?global.getComputedStyle(fill).backgroundColor:'',c=rgb(col);
      b.classList.add('p40-track');b.setAttribute('aria-hidden','true');
      if(c){b.style.setProperty('--p40-k',col);b.style.setProperty('--p40-kg','rgba('+c.r+','+c.g+','+c.b+',.55)');}
      if(RM){b.style.setProperty('--p40-x',v+'%');}
      else{
        b.style.setProperty('--p40-x','0%');b.style.setProperty('--p40-d',(Math.min(n,12)*35)+'ms');
        (function(bb,vv){global.requestAnimationFrame(function(){global.requestAnimationFrame(function(){bb.style.setProperty('--p40-x',vv+'%');});});})(b,v);
      }
      n++;
    }
  }

  /* ---------- 3. les trois niveaux prennent la note du moteur ---------- */
  function niveaux(){
    var ds=doc.getElementById('d-score');if(!ds||ds.offsetParent===null)return;
    var hs=[],k=ds.children;
    for(var i=0;i<k.length;i++)if(k[i].tagName==='H2'&&k[i].classList.contains('sec'))hs.push(k[i]);
    if(hs.length<3||typeof global.moteur!=='function')return;
    var m=null;try{m=global.moteur();}catch(e){return;}
    if(!m)return;
    var lv=[m.n1,m.n2,m.n3];
    for(var j=0;j<3;j++){
      var v=Math.round(Number(lv[j]));if(!isFinite(v))continue;
      var e=zone100(v),h=hs[j],card=h.nextElementSibling;
      if(!h.querySelector('.p40-lvl')){
        var sp=doc.createElement('span');sp.className='p40-lvl p40-own';sp.setAttribute('data-p40',e);
        sp.textContent=v+' / 100';h.appendChild(sp);
      }
      if(card&&card.classList.contains('card')&&!card.classList.contains('p40-lise')){card.setAttribute('data-p40',e);card.classList.add('p40-lise');}
    }
    if(hs[3]){
      var c4=hs[3].nextElementSibling;
      if(c4&&c4.classList.contains('card')&&!c4.classList.contains('p40-lise')){
        var min=101,ss=c4.querySelectorAll('.s');
        for(var x=0;x<ss.length;x++){var nv=parseInt(ss[x].textContent,10);if(isFinite(nv)&&nv<min)min=nv;}
        if(min<=100){c4.setAttribute('data-p40',zone100(min));c4.classList.add('p40-lise');}
      }
    }
  }

  /* ---------- 4. un seul geste : les boutons verts ou jaunes passent ivoire */
  function gestes(scope){
    var bs=scope.querySelectorAll('button,a');
    for(var i=0;i<bs.length;i++){
      var b=bs[i];if(b.hasAttribute('data-p40g'))continue;
      if(!(b.offsetHeight>=38)||!(b.offsetWidth>=110))continue;
      b.setAttribute('data-p40g','1');
      if(b.closest('.chips,.vp-tabs,nav,.seg,.lvlseg,#modeBar,#v-audit,.module-tabs'))continue;
      var cs=global.getComputedStyle(b),c=rgb(cs.backgroundColor);
      if(!c||c.a<0.5){var mm=/rgba?\([^)]+\)/.exec(cs.backgroundImage||'');c=mm?rgb(mm[0]):null;}
      var e=teinte(c,0.5);
      if(e==='vert'||e==='jaune'||e==='orange')b.classList.add('p40-cta');
    }
  }

  /* ---------- ordonnancement ---------- */
  var minut=null,dernier=0;
  function hautOnglets(){var mb=doc.getElementById('modeBar'),t=0;if(mb&&mb.offsetParent!==null){t=mb.getBoundingClientRect().bottom;}root.style.setProperty('--p40-chips',Math.max(0,Math.round(t))+'px');}
  var hRaf=0;function hautOngletsDoux(){if(hRaf)return;hRaf=global.requestAnimationFrame(function(){hRaf=0;hautOnglets();});}
  global.addEventListener('scroll',hautOngletsDoux,{passive:true});global.addEventListener('resize',hautOngletsDoux);
  var lastGate=null,lastGateShell=null;
  /* R66 : l'en-tête n'est plus collant ; l'atterrissage d'un module se cale sous la barre des onglets telle qu'elle est réellement collée (sous le bandeau démo) */
  (function(){function envelopper(){var o=global.calerSur;if(typeof o!=="function"||o.__p40)return;
    function tourActif(){try{return (typeof global.demoTourActif==='function'&&global.demoTourActif())||(doc.body&&doc.body.classList.contains('demo-tour-active'));}catch(e){return false;}}
    var w=function(sel){if(tourActif())return o.apply(this,arguments);/* le guide garde son propre positionneur */
      try{var el=(typeof sel==='string')?doc.querySelector(sel):sel;if(!el)return;var vue=doc.querySelector('.view.on'),ong=vue&&(vue.querySelector('.actbar')||vue.querySelector(':scope > .chips'));
      var mb=doc.getElementById('modeBar'),nav=doc.querySelector('body > nav'),base=(mb&&mb.getClientRects().length)?Math.max(0,mb.getBoundingClientRect().bottom):0;if(nav&&global.innerWidth>=768)base=Math.max(base,Math.max(0,nav.getBoundingClientRect().bottom));var haut=base+(ong?ong.getBoundingClientRect().height:0)+16;
      var y=global.scrollY+el.getBoundingClientRect().top-haut;global.scrollTo({top:Math.max(0,y),behavior:'auto'});}catch(e){}};
    w.__p40=true;global.calerSur=w;
    /* R75 : après l'atterrissage, l'app peut encore bouger (cadre premium qui finit de se mesurer, bandeau qui se replie) ; on recale trois fois, sans lissage, puis on laisse la main au client */
    var o2=global.verdictSettleSubview;if(typeof o2==="function"&&!o2.__p40){var w2=function(target){var r=o2.apply(this,arguments);var el=(typeof target==='string')?doc.querySelector(target):target;if(!el)return r;
      if(tourActif())return r;
      var tries=[220,600,1200];tries.forEach(function(ms){global.setTimeout(function(){try{if(tourActif()||!el.isConnected||el.getClientRects().length===0)return;var vue=doc.querySelector('.view.on'),ong=vue&&(vue.querySelector('.actbar')||vue.querySelector(':scope > .chips'));var mb=doc.getElementById('modeBar'),nav=doc.querySelector('body > nav'),base=(mb&&mb.getClientRects().length)?Math.max(0,mb.getBoundingClientRect().bottom):0;if(nav&&global.innerWidth>=768)base=Math.max(base,Math.max(0,nav.getBoundingClientRect().bottom));var want=base+(ong?ong.getBoundingClientRect().height:0)+16;var top=el.getBoundingClientRect().top;if(Math.abs(top-want)>6&&!global.__p40Touche)global.calerSur(el);}catch(e){}},ms);});return r;};w2.__p40=true;global.verdictSettleSubview=w2;}}
    envelopper();global.addEventListener('load',envelopper);global.setTimeout(envelopper,1500);
    try{if(global.parent&&global.parent!==global)doc.documentElement.setAttribute('data-p40-coque','1');}catch(e){}
    /* R84 : le bandeau « Démonstration fictive » se replie d'une croix ; C285 : il garde toujours la sortie (« Quitter la démo »), le repli ne vaut
       que pour la démo en cours (jamais enregistré : chaque nouvelle démo rouvre le bandeau), et le sélecteur d'établissement propose aussi le retour au réel */
    (function(){var CLE='vd_demobar_fermee',REPLI='p40-mb-replie';try{global.localStorage.removeItem(CLE);}catch(e){}
      var TXT={fr:['Quitter la démo','Afficher le bandeau de démonstration','Replier ce bandeau','Revenir à mon établissement'],en:['Leave the demo','Show the demo banner','Fold this banner','Back to my business'],
        es:['Salir de la demo','Mostrar la banda de demostración','Plegar esta banda','Volver a mi establecimiento'],it:['Esci dalla demo','Mostra la barra della demo','Riduci questa barra','Torna al mio locale'],
        de:['Demo verlassen','Demo-Leiste anzeigen','Leiste einklappen','Zurück zu meinem Betrieb'],nl:['Demo verlaten','Demobalk tonen','Deze balk inklappen','Terug naar mijn zaak'],
        pt:['Sair da demo','Mostrar a faixa da demonstração','Recolher esta faixa','Voltar ao meu estabelecimento']};
      function t(i){var l='fr';try{l=String(doc.documentElement.lang||'fr').slice(0,2).toLowerCase();}catch(e){}return (TXT[l]||TXT.fr)[i];}
      function sig(b){return b.getAttribute('aria-label')||'demo';}
      function sortieDe(b){return b&&b.querySelector('button[onclick^="quitterDemo"]');}
      function style(){if(doc.getElementById('p40-c285'))return;var s=doc.createElement('style');s.id='p40-c285';
        s.textContent='html.p40-mb-replie #modeBar>*:not(.p40-mb-ouvrir):not(button[onclick^="quitterDemo"]){display:none!important}'+
          'html:not(.p40-mb-replie) #modeBar>.p40-mb-ouvrir{display:none!important}'+
          'html.p40-mb-replie #modeBar{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important}'+
          'html.p40-mb-replie #modeBar>button[onclick^="quitterDemo"]{border-radius:999px!important;font-weight:700!important}'+
          '#modeBar>.p40-mb-ouvrir{flex:none;min-width:32px;min-height:28px;border-radius:999px;cursor:pointer;color:inherit!important;opacity:1!important;font-size:15px!important;line-height:1!important}'+
          '#etabBar .p40-etab-reel{white-space:nowrap}';(doc.head||doc.documentElement).appendChild(s);}
      function rafraichir(){try{if(typeof global.chipsTop==='function')global.chipsTop();}catch(e){}try{if(global.VerdictPremium&&global.VerdictPremium.hautOnglets)global.VerdictPremium.hautOnglets();}catch(e){}}
      function replier(b,v){b.__p40Replie=v?sig(b):'';appliquerMb();rafraichir();}
      function etabReel(b){var bar=doc.getElementById('etabBar');if(!bar)return;var x=bar.querySelector('.p40-etab-reel');
        if(!sortieDe(b)){if(x)x.remove();return;}
        if(!x){x=doc.createElement('button');x.type='button';x.className='chip p40-etab-reel';x.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();if(typeof global.quitterDemo==='function')global.quitterDemo();});bar.insertBefore(x,bar.firstChild);}
        var l='↩ '+t(3);if(x.textContent!==l)x.textContent=l;
        if(!bar.__p40c285&&global.MutationObserver){bar.__p40c285=new MutationObserver(function(){global.setTimeout(appliquerMb,30);});bar.__p40c285.observe(bar,{childList:true});}}
      function appliquerMb(){var b=doc.getElementById('modeBar');etabReel(b);
        var r=!!(b&&sortieDe(b)&&b.__p40Replie===sig(b));if(doc.documentElement.classList.contains(REPLI)!==r)doc.documentElement.classList.toggle(REPLI,r);
        if(doc.documentElement.classList.contains('p40-mb-fermee'))doc.documentElement.classList.remove('p40-mb-fermee');
        if(!b)return;var q=sortieDe(b);if(!q){var v=b.querySelector('.p40-mb-x');if(v)v.remove();return;}style();
        var lab=b.querySelector('.mb-label')||b;if(!b.querySelector('.p40-mb-x')){var x=doc.createElement('button');x.type='button';x.className='p40-mb-x';x.textContent='×';
          x.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();replier(b,true);});lab.appendChild(x);}
        var xb=b.querySelector('.p40-mb-x');if(xb.getAttribute('aria-label')!==t(2)){xb.setAttribute('aria-label',t(2));xb.title=t(2);}
        var o=b.querySelector('.p40-mb-ouvrir');if(!o){o=doc.createElement('button');o.type='button';o.className='p40-mb-ouvrir';o.textContent='▾';
          o.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();replier(b,false);});b.insertBefore(o,b.firstChild);}
        if(o.getAttribute('aria-label')!==t(1)){o.setAttribute('aria-label',t(1));o.title=t(1);}
        if(r){if(q.getAttribute('data-p40-txt')==null)q.setAttribute('data-p40-txt',q.textContent);if(q.textContent!==t(0))q.textContent=t(0);}
        else if(q.getAttribute('data-p40-txt')!=null){q.textContent=q.getAttribute('data-p40-txt');q.removeAttribute('data-p40-txt');}
        if(!b.__p40obs&&global.MutationObserver){b.__p40obs=new MutationObserver(function(){global.setTimeout(appliquerMb,30);});b.__p40obs.observe(b,{childList:true});}}
      function sortir(){var b=doc.getElementById('modeBar');if(b)b.__p40Replie='';doc.documentElement.classList.remove(REPLI);}
      function envQuitter(){var q=global.quitterDemo;if(typeof q==='function'&&!q.__p40){var w=function(){sortir();return q.apply(this,arguments);};w.__p40=true;global.quitterDemo=w;}}
      appliquerMb();envQuitter();global.addEventListener('load',function(){appliquerMb();envQuitter();});global.setTimeout(function(){appliquerMb();envQuitter();},1500);
      if(global.MutationObserver&&doc.body)new MutationObserver(function(){appliquerMb();}).observe(doc.body,{childList:true,subtree:false});
      if(global.MutationObserver)new MutationObserver(function(){appliquerMb();}).observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
      global.addEventListener('vd:demobar',appliquerMb);})();
    /* si le client a repris la main (il fait défiler), on ne recale plus */
    var tT=0;global.addEventListener('touchstart',function(){global.__p40Touche=true;global.clearTimeout(tT);tT=global.setTimeout(function(){global.__p40Touche=false;},1500);},{passive:true});
    doc.addEventListener('click',function(ev){if(ev.target&&ev.target.closest&&ev.target.closest('.chips button,.actbar button'))global.__p40Touche=false;},true);})();
  function porte(){var sp=doc.getElementById('splash'),spv=!!(sp&&sp.getClientRects().length>0&&global.getComputedStyle(sp).display!=='none'&&global.getComputedStyle(sp).visibility!=='hidden');var open=!!(doc.querySelector('#mLang.on,#refSh.on,#mDemoIntent.on')||spv||global.VERDICT_DEMO_ENTRY_TIMER);
    if(open!==lastGate){lastGate=open;try{if(global.parent&&global.parent!==global)global.parent.postMessage({p41:'gate',open:open},'*');}catch(e){}}}
  function appliquer(){
    minut=null;dernier=Date.now();hautOnglets();porte();
    if(!root.classList.contains('p40'))return;
    if(surface==='app'){
      var vue=doc.querySelector('.view.on');
      if(vue&&vue.id!=='v-audit'){
        try{etats(vue);}catch(e){}
        try{gestes(vue);}catch(e){}
        if(vue.id==='v-data'){try{niveaux();}catch(e){}try{pistes(vue);}catch(e){}}
        if(global.VerdictPremiumEcrans){try{global.VerdictPremiumEcrans.poser();}catch(e){}}
      }
      var ms=doc.querySelectorAll('.modal.on');
      for(var i=0;i<ms.length;i++){try{gestes(ms[i]);}catch(e){}}
    }else if(surface==='inv'||surface==='share'){
      try{gestes(doc.body);}catch(e){}
    }
  }
  var passesIntro=0,attenteIntro=false;
  function planifier(){
    if(minut!==null)return;
    /* C103 : pendant l'écran d'ouverture, une seule passe (pour préparer l'Accueil) ; les suivantes attendent la fin de l'anneau. */
    if(doc.getElementById('splash')){if(passesIntro>=1){if(!attenteIntro){attenteIntro=true;global.addEventListener('verdict:intro-complete',function(){attenteIntro=false;global.setTimeout(planifier,120);},{once:true});}return;}passesIntro++;}
    /* pendant le parcours guidé, l'app redessine certaines vues plus de dix fois par seconde : la couche ne se recalcule qu'une fois toutes les deux secondes */
    var tour=false;try{tour=(typeof global.demoTourActif==='function'&&global.demoTourActif())||(doc.body&&doc.body.classList.contains('demo-tour-active'));}catch(e){}
    var attente=tour?Math.max(400,2000-(Date.now()-dernier)):Math.max(90,250-(Date.now()-dernier));
    minut=global.setTimeout(appliquer,attente);
  }
  function horsChamp(n){
    return n&&n.closest&&n.closest('.stickytop,#modeBar,nav,#toast,.toast,[class*="vera"],#upBtn');
  }

  global.VerdictPremium={
    version:'R41-1.0.0',surface:surface,
    actif:function(){return root.classList.contains('p40');},
    couper:function(){ecrire('off');root.classList.remove('p40','p40-'+surface);},
    retablir:function(){ecrire(null);root.classList.add('p40','p40-'+surface);root.setAttribute('data-p40-surface',surface);planifier();},
    appliquer:appliquer
  };

  if(lire()==='off'){root.classList.remove('p40','p40-'+surface);return;}
  root.classList.add('p40','p40-'+surface);root.setAttribute('data-p40-surface',surface);
  if(surface==='shell'){
    global.addEventListener('message',function(ev){var d=ev.data;if(!d||d.p41!=='gate')return;lastGateShell=!!d.open;root.classList.toggle('p40-gate',!!d.open);});
    root.classList.add('p40-gate');global.setTimeout(function(){if(lastGateShell==null)root.classList.remove('p40-gate');},20000);
    return;}

  if(global.MutationObserver&&doc.body){
    new MutationObserver(function(recs){
      for(var i=0;i<recs.length;i++){
        var r=recs[i],t=r.target;
        if(r.type==='attributes'){
          if(t.classList&&(t.classList.contains('view')||t.classList.contains('sv')||t.classList.contains('modal')||t.id==='refSh'||t.id==='mDemoIntent')){planifier();return;}
          continue;
        }
        if(horsChamp(t))continue;
        if(t&&t.closest&&t.closest('#splash,#verdictIntroHandoff'))continue;/* C103 : l'écran d'ouverture ne relance pas la couche */
        for(var j=0;j<r.addedNodes.length;j++){
          var n=r.addedNodes[j];
          if(n.nodeType===1&&!(n.classList&&n.classList.contains('p40-own'))){planifier();return;}
        }
        for(var q=0;q<r.removedNodes.length;q++){var rn=r.removedNodes[q];if(rn.nodeType===1&&(rn.id==='mDemoIntent'||rn.id==='splash'||rn.id==='mLang'||rn.id==='refSh'||rn.classList&&rn.classList.contains('modal'))){planifier();return;}}
      }
    }).observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  planifier();
  global.addEventListener('load',planifier);
  /* V05 (21/10) : au toucher d'un onglet (go) ou d'un sous-onglet de Structure (dsub), la lecture premium se pose dans le
     même geste que la vue. L'observateur la posait 90 à 250 ms plus tard, davantage si le fil principal était occupé :
     l'écran d'origine, avec ses propres calculs (Saisonnalité 51 662 €, repère 38,0 %), s'affichait entre les deux.
     Pas pendant l'écran d'ouverture ni le parcours guidé, qui gardent leur rythme (C103). */
  if(surface==='app'){
    var poserAuToucher=function(nom){var f=global[nom];if(typeof f!=='function'||f.__p40Pose)return;
      var w=function(){var r=f.apply(this,arguments);if(r!==false&&!doc.getElementById('splash')){var tour=false;try{tour=(typeof global.demoTourActif==='function'&&global.demoTourActif())||(doc.body&&doc.body.classList.contains('demo-tour-active'));}catch(e){}
        if(!tour){if(minut!==null){global.clearTimeout(minut);minut=null;}try{appliquer();}catch(e){}}}return r;};
      for(var k in f){try{w[k]=f[k];}catch(e){}}w.__p40Pose=true;global[nom]=w;};
    poserAuToucher('go');poserAuToucher('dsub');}
  /* C103 : plus de relances à 900 et 2600 ms (la couche se recalculait 6 à 8 fois au lancement). */
})(window);
/* R199 point 47 (WCAG 3.1.1) : la langue du document hote suit celle du module affiche. Sans effet hors coque (pas de frame-verdict). */
;(function(){try{
  var fv=document.getElementById('frame-verdict');if(!fv)return;
  function sync(){try{var d=fv.contentDocument,l=d&&d.documentElement&&d.documentElement.lang;if(l&&/^[a-z]{2}/i.test(l)&&document.documentElement.lang!==l)document.documentElement.lang=l;}catch(e){}}
  function attach(){try{var d=fv.contentDocument,r=d&&d.documentElement;if(!r||fv.__lgObs===r)return;fv.__lgObs=r;new MutationObserver(sync).observe(r,{attributes:true,attributeFilter:['lang']});sync();}catch(e){}}
  fv.addEventListener('load',attach);attach();window.setTimeout(attach,1500);window.setTimeout(attach,4000);
}catch(e){}})();

