
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
      var mb=doc.getElementById('modeBar'),base=(mb&&mb.getClientRects().length)?Math.max(0,mb.getBoundingClientRect().bottom):0;var haut=base+(ong?ong.getBoundingClientRect().height:0)+10;
      var y=global.scrollY+el.getBoundingClientRect().top-haut;global.scrollTo({top:Math.max(0,y),behavior:'auto'});}catch(e){}};
    w.__p40=true;global.calerSur=w;
    /* R75 : après l'atterrissage, l'app peut encore bouger (cadre premium qui finit de se mesurer, bandeau qui se replie) ; on recale trois fois, sans lissage, puis on laisse la main au client */
    var o2=global.verdictSettleSubview;if(typeof o2==="function"&&!o2.__p40){var w2=function(target){var r=o2.apply(this,arguments);var el=(typeof target==='string')?doc.querySelector(target):target;if(!el)return r;
      if(tourActif())return r;
      var tries=[220,600,1200];tries.forEach(function(ms){global.setTimeout(function(){try{if(tourActif()||!el.isConnected||el.getClientRects().length===0)return;var vue=doc.querySelector('.view.on'),ong=vue&&(vue.querySelector('.actbar')||vue.querySelector(':scope > .chips'));var mb=doc.getElementById('modeBar'),base=(mb&&mb.getClientRects().length)?Math.max(0,mb.getBoundingClientRect().bottom):0;var want=base+(ong?ong.getBoundingClientRect().height:0)+10;var top=el.getBoundingClientRect().top;if(Math.abs(top-want)>6&&!global.__p40Touche)global.calerSur(el);}catch(e){}},ms);});return r;};w2.__p40=true;global.verdictSettleSubview=w2;}}
    envelopper();global.addEventListener('load',envelopper);global.setTimeout(envelopper,1500);
    try{if(global.parent&&global.parent!==global)doc.documentElement.setAttribute('data-p40-coque','1');}catch(e){}
    /* R84 : le bandeau « Démonstration fictive » se ferme d'une croix, à tout moment ; le choix tient tant que la démonstration dure, et le bandeau n'existe plus dès que le client sort de la démonstration ou saisit ses vrais chiffres */
    (function(){var CLE='vd_demobar_fermee';function ferme(){try{return global.localStorage.getItem(CLE)==='1';}catch(e){return false;}}
      function appliquerMb(){var b=doc.getElementById('modeBar');if(!b)return;doc.documentElement.classList.toggle('p40-mb-fermee',ferme());
        var lab=b.querySelector('.mb-label')||b;if(!b.querySelector('.p40-mb-x')){var x=doc.createElement('button');x.type='button';x.className='p40-mb-x';x.setAttribute('aria-label','Masquer ce bandeau');x.textContent='\u00d7';
          x.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();try{global.localStorage.setItem(CLE,'1');}catch(e){}doc.documentElement.classList.add('p40-mb-fermee');try{if(typeof global.chipsTop==='function')global.chipsTop();}catch(e){}try{if(global.VerdictPremium&&global.VerdictPremium.hautOnglets)global.VerdictPremium.hautOnglets();}catch(e){}});
          lab.appendChild(x);if(!b.__p40obs&&global.MutationObserver){b.__p40obs=new MutationObserver(function(){global.setTimeout(appliquerMb,30);});b.__p40obs.observe(b,{childList:true});}}}
      function sortir(){try{global.localStorage.removeItem(CLE);}catch(e){}doc.documentElement.classList.remove('p40-mb-fermee');}
      function envQuitter(){var q=global.quitterDemo;if(typeof q==='function'&&!q.__p40){var w=function(){sortir();return q.apply(this,arguments);};w.__p40=true;global.quitterDemo=w;}}
      appliquerMb();envQuitter();global.addEventListener('load',function(){appliquerMb();envQuitter();});global.setTimeout(function(){appliquerMb();envQuitter();},1500);
      if(global.MutationObserver&&doc.body)new MutationObserver(function(){appliquerMb();}).observe(doc.body,{childList:true,subtree:false});
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
  function planifier(){
    if(minut!==null)return;
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
          if(t.classList&&(t.classList.contains('view')||t.classList.contains('sv')||t.classList.contains('modal')||t.id==='refSh'||t.id==='splash'||t.id==='mDemoIntent')){planifier();return;}
          continue;
        }
        if(horsChamp(t))continue;
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
  global.setTimeout(planifier,900);
  global.setTimeout(planifier,2600);
})(window);
/* R199 point 47 (WCAG 3.1.1) : la langue du document hote suit celle du module affiche. Sans effet hors coque (pas de frame-verdict). */
;(function(){try{
  var fv=document.getElementById('frame-verdict');if(!fv)return;
  function sync(){try{var d=fv.contentDocument,l=d&&d.documentElement&&d.documentElement.lang;if(l&&/^[a-z]{2}/i.test(l)&&document.documentElement.lang!==l)document.documentElement.lang=l;}catch(e){}}
  function attach(){try{var d=fv.contentDocument,r=d&&d.documentElement;if(!r||fv.__lgObs===r)return;fv.__lgObs=r;new MutationObserver(sync).observe(r,{attributes:true,attributeFilter:['lang']});sync();}catch(e){}}
  fv.addEventListener('load',attach);attach();window.setTimeout(attach,1500);window.setTimeout(attach,4000);
}catch(e){}})();

