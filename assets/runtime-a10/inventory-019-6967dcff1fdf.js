
/* Verdict® — viewport mobile accessible V1.16.
   Le zoom reste toujours sous le contrôle de la personne. Après 3,6 secondes
   d'immobilité en vue agrandie, une aide facultative peut recentrer le contenu
   actif sans changer l'échelle. Après un retour sous le seuil de zoom, un
   recentrage automatique n'agit que si le contenu actif est réellement perdu. */
(function(global){
  'use strict';
  var doc=global.document,viewport=global.visualViewport,timer=0,restoreTimer=0,reevaluateTimer=0,clickIdleTimer=0,dockTimer=0,dockScrollFrame=0,dockBoundsFrame=0,viewportFrame=0,dockRevealTimer=0,button=null,probe=null,dockProbe=null,dock=null,lastAnchor=null,pointers={};
  var stableDelay=3600,zoomThreshold=1.08,interacting=false,dismissed=false,hadZoom=false,dockHidden=false,lastDockScrollY=0,dockMaxScrollY=0,dockTravel=0,dockDirection=0,overlayActive=false,pointerEvents='PointerEvent' in global,observer=null,bodyObserver=null;
  var requestFrame=global.requestAnimationFrame?global.requestAnimationFrame.bind(global):function(fn){return global.setTimeout(fn,16);};
  var overlaySelector='dialog[open],[aria-modal="true"],[role="dialog"],[role="alertdialog"],.modal.on,#splash,#authGate,#welcome,#guideVoile,#guideBulle,#refSh.on,#mAsk.on,#vInvBack,#vInvSheet';
  var overlayWatchSelector='dialog,[aria-modal],[role="dialog"],[role="alertdialog"],.modal,#splash,#authGate,#welcome,#guideVoile,#guideBulle,#refSh,#mAsk,#vInvBack,#vInvSheet';

  function labels(){var declared=String(doc.documentElement.lang||'fr'),lang=declared.slice(0,2).toLowerCase(),all={fr:['Vue agrandie','Recentrer ici','Vue agrandie. Recentrer le contenu actif sans modifier le zoom.'],en:['Zoomed view','Recenter here','Zoomed view. Recenter active content without changing zoom.'],es:['Vista ampliada','Centrar aquí','Vista ampliada. Centrar el contenido activo sin cambiar el zoom.'],it:['Vista ingrandita','Centra qui','Vista ingrandita. Centra il contenuto attivo senza cambiare lo zoom.'],de:['Vergrößerte Ansicht','Hier zentrieren','Vergrößerte Ansicht. Aktiven Inhalt zentrieren, ohne den Zoom zu ändern.'],nl:['Vergrote weergave','Hier centreren','Vergrote weergave. Actieve inhoud centreren zonder de zoom te wijzigen.'],pt:['Vista ampliada','Centrar aqui','Vista ampliada. Centrar o conteúdo ativo sem alterar o zoom.']};if(!all[lang])return {lang:'fr',words:all.fr};return {lang:declared,words:all[lang]};}
  function reduced(){return !!(global.matchMedia&&global.matchMedia('(prefers-reduced-motion: reduce)').matches);}

  function style(){
    if(doc.getElementById('premiumViewportStyle'))return;
    var floating=global.VERDICT_FLOATING_DOCK!==false;
    try{if(global.parent!==global&&typeof global.parent.VERDICT_FLOATING_DOCK==='boolean')floating=global.parent.VERDICT_FLOATING_DOCK;}catch(e){}
    doc.documentElement.classList.toggle('verdict-floating-dock',floating);
    var s=doc.createElement('style');s.id='premiumViewportStyle';
    s.textContent='html,body{max-width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%}'+
      '#premiumViewportHelper{box-sizing:border-box;position:fixed;z-index:140;display:none;align-items:center;justify-content:flex-start;gap:9px;min-width:0;min-height:44px;max-width:248px;padding:10px 13px;border:1px solid rgba(147,197,253,.72);border-radius:999px;background:rgba(8,13,20,.94);color:#eff6ff;box-shadow:0 12px 34px rgba(0,0,0,.48);font:750 13px/1.25 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);touch-action:manipulation;overflow:hidden}'+
      '#premiumViewportHelper.on{display:flex}#premiumViewportHelper:focus-visible{outline:3px solid #93c5fd;outline-offset:3px}'+
      '#premiumViewportHelper .pv-icon{display:grid;place-items:center;flex:0 0 24px;width:24px;height:24px;border-radius:50%;background:rgba(96,165,250,.18);font-size:15px}'+
      '#premiumViewportHelper .pv-copy{display:block;min-width:0;max-width:100%;overflow-wrap:anywhere;word-break:break-word}#premiumViewportHelper small{display:block;color:#93c5fd;font-size:11px;font-weight:800;letter-spacing:.035em;text-transform:uppercase}#premiumViewportHelper .pv-action{display:block;margin-top:1px}'+
      '#premiumViewportHelper.compact{width:44px;max-width:44px;height:44px;min-height:44px;padding:9px;gap:0;justify-content:center}#premiumViewportHelper.compact .pv-copy{display:none}'+
      '#premiumViewportSafeProbe{position:fixed;left:-10000px;top:-10000px;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:var(--app-safe-top,env(safe-area-inset-top,0px));padding-right:var(--app-safe-right,env(safe-area-inset-right,0px));padding-bottom:var(--app-safe-bottom,env(safe-area-inset-bottom,0px));padding-left:var(--app-safe-left,env(safe-area-inset-left,0px))}'+
      '#premiumDockSafeProbe{position:fixed;left:-10000px;top:-10000px;width:0;height:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom,0px)}'+
      'html.premium-fixed-dock .premium-adaptive-dock{bottom:0!important;min-height:0!important;padding-top:var(--premium-dock-shift,0px)!important;padding-bottom:var(--premium-dock-rest,var(--premium-dock-inset,var(--unified-safe-bottom,0px)))!important;transform:translate3d(0,0,0);opacity:1;pointer-events:auto;backface-visibility:hidden;box-shadow:0 -8px 26px rgba(0,0,0,.28);transition:transform .32s cubic-bezier(.22,1,.36,1),opacity .18s ease,box-shadow .32s ease}'+
      'body.inventory-guide-open .premium-adaptive-dock,body.demo-tour-active .premium-adaptive-dock{transition:none!important;animation:none!important;transform:translate3d(0,0,0)!important;opacity:1!important;pointer-events:auto!important}'+
      'html.premium-fixed-dock .premium-adaptive-dock>button{box-sizing:border-box!important;min-height:50px!important;padding-top:4px!important;padding-bottom:5px!important;gap:2px!important;line-height:1.15!important;justify-content:center!important}'+
      'html.premium-dock-hidden .premium-adaptive-dock{transform:translate3d(0,calc(100% + 3px),0);opacity:0;pointer-events:none}'+
      '.premium-adaptive-dock.premium-dock-reveal{animation:premiumDockReveal .62s cubic-bezier(.22,1,.36,1)}'+
      '@keyframes premiumDockReveal{0%{box-shadow:0 -1px 0 rgba(34,197,94,0),0 -8px 26px rgba(0,0,0,.28)}48%{box-shadow:0 -1px 0 rgba(34,197,94,.5),0 -16px 38px rgba(34,197,94,.12),0 -8px 26px rgba(0,0,0,.34)}100%{box-shadow:0 -1px 0 rgba(34,197,94,0),0 -8px 26px rgba(0,0,0,.28)}}'+
      'html.premium-fixed-dock{--premium-dock-clearance:var(--premium-dock-height,86px)}html.premium-fixed-dock.premium-dock-hidden{--premium-dock-clearance:var(--premium-dock-inset,0px)}'+
      'html.premium-fixed-dock body{padding-bottom:calc(var(--premium-dock-height,86px) + 12px)!important}'+
      'html.premium-fixed-dock body.demo-tour-show{padding-bottom:calc(var(--premium-dock-height,86px) + 12px + var(--demo-scroll-reserve,0px))!important}'+
      'html.premium-fixed-dock #upBtn,html.premium-fixed-dock #vkBtn,html.premium-fixed-dock #prioBack,html.premium-fixed-dock #vInvBtn:not(.vinv-docked){bottom:calc(var(--premium-dock-clearance,var(--premium-dock-height,86px)) + 14px)!important}'+
      'html.premium-fixed-dock #aideBtn{bottom:calc(var(--premium-dock-clearance,var(--premium-dock-height,86px)) + 22px)!important}'+
      'html.premium-fixed-dock #toast,html.premium-fixed-dock .toast,html.premium-fixed-dock .dec-total,html.premium-fixed-dock .dec-sticky{bottom:calc(var(--premium-dock-clearance,var(--premium-dock-height,86px)) + 18px)!important}'+
      '@media(prefers-reduced-motion:reduce){#premiumViewportHelper{scroll-behavior:auto}.premium-adaptive-dock{transition:none!important;animation:none!important}}';
    doc.head.appendChild(s);
    var capsule=doc.createElement('style');capsule.textContent="/* Capsule mobile R33. The safe area is consumed exactly once. */\nhtml.premium-fixed-dock body nav.premium-adaptive-dock{\n  left:0!important;right:0!important;bottom:var(--premium-dock-bottom,8px)!important;\n  width:calc(100% - 2 * max(14px,var(--unified-safe-left,env(safe-area-inset-left,0px)),var(--unified-safe-right,env(safe-area-inset-right,0px))))!important;max-width:560px!important;margin-inline:auto!important;\n  height:70px!important;min-height:0!important;padding:6px!important;box-sizing:border-box!important;\n  border:1px solid rgba(180,206,201,.23)!important;border-radius:999px!important;\n  background:rgba(20,29,31,.88)!important;backdrop-filter:blur(20px) saturate(1.25);-webkit-backdrop-filter:blur(20px) saturate(1.25);\n  box-shadow:0 5px 22px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.07)!important;\n  transform:translate3d(0,0,0)!important;opacity:1!important;pointer-events:auto!important;\n  transition:width .38s cubic-bezier(.22,1,.36,1),height .38s cubic-bezier(.22,1,.36,1),transform .38s cubic-bezier(.22,1,.36,1)!important;\n}\nhtml.premium-fixed-dock body nav.premium-adaptive-dock>button{\n  flex:1!important;min-width:0!important;min-height:44px!important;height:100%!important;\n  padding:4px 2px!important;margin:0!important;border-radius:999px!important;\n  gap:3px!important;font-size:11px!important;line-height:1.15!important;background:transparent;\n}\nhtml.premium-fixed-dock body nav.premium-adaptive-dock>button.on,\nhtml.premium-fixed-dock body nav.premium-adaptive-dock>button.active{background:rgba(43,211,123,.12)!important;color:#44df91!important}\n.premium-adaptive-dock .premium-dock-label{display:block;max-height:18px;opacity:1;white-space:nowrap;transition:max-height .3s,opacity .2s,transform .3s}\nhtml.premium-fixed-dock.premium-dock-hidden body nav.premium-adaptive-dock{width:min(var(--premium-dock-compact-width,200px),calc(100% - 28px))!important;height:56px!important;transform:translate3d(0,0,0)!important}\nhtml.premium-dock-hidden .premium-adaptive-dock .premium-dock-label{max-height:0;opacity:0;transform:translateY(6px);overflow:hidden}\nhtml.premium-fixed-dock.premium-dock-hidden{--premium-dock-clearance:calc(56px + var(--premium-dock-bottom,8px))}\nhtml.premium-fixed-dock.premium-keyboard-open body nav.premium-adaptive-dock{transform:translate3d(0,calc(100% + var(--premium-dock-bottom,8px) + 12px),0)!important;visibility:hidden;pointer-events:none!important}\nhtml.premium-fixed-dock.premium-keyboard-open{--premium-dock-clearance:0px}\nhtml.premium-fixed-dock body{padding-bottom:calc(var(--premium-dock-height,78px) + 12px)!important;scroll-padding-bottom:calc(var(--premium-dock-height,78px) + 12px)}\n@media(max-width:350px){html.premium-fixed-dock body nav.premium-adaptive-dock{width:calc(100% - 16px)!important}html.premium-fixed-dock body nav.premium-adaptive-dock>button{font-size:11px!important}}\n@media(prefers-reduced-motion:reduce){html.premium-fixed-dock body nav.premium-adaptive-dock,.premium-adaptive-dock .premium-dock-label{transition:none!important;animation:none!important}}\n\nhtml.premium-fixed-dock body nav.premium-adaptive-dock>button>.ic{flex:0 0 24px;width:24px;height:24px}\n.premium-adaptive-dock,.premium-adaptive-dock>button>.ic,.premium-adaptive-dock>button>#bdg{transform-origin:50% 50%}\n\n/* R34-V4 : barre R1 demand\u00e9e active ; capsule facultative, sans libell\u00e9 masqu\u00e9. */\nhtml.premium-fixed-dock body nav.premium-adaptive-dock,\nhtml.premium-fixed-dock.premium-dock-hidden body nav.premium-adaptive-dock{\n background:#10161c!important;color:#d4dce5!important;\n transition:transform .18s ease,opacity .15s ease!important;\n}\nhtml.premium-fixed-dock:not(.verdict-floating-dock) body nav.premium-adaptive-dock{\n left:0!important;right:0!important;bottom:0!important;width:100%!important;max-width:none!important;\n height:calc(70px + var(--premium-dock-inset,0px))!important;\n padding:6px max(8px,var(--unified-safe-right,env(safe-area-inset-right,0px))) calc(6px + var(--premium-dock-inset,0px)) max(8px,var(--unified-safe-left,env(safe-area-inset-left,0px)))!important;\n border:0!important;border-top:1px solid #35414c!important;border-radius:0!important;gap:8px!important;\n}\n/* R34, choix Steven images 5/6 : m\u00eame capsule au repos et en d\u00e9filement.\n   Le contenu continue sous la capsule ; la fin du document garde sa r\u00e9serve. */\nhtml.premium-fixed-dock.verdict-floating-dock body nav.premium-adaptive-dock,\nhtml.premium-fixed-dock.verdict-floating-dock.premium-dock-hidden body nav.premium-adaptive-dock{\n width:calc(100% - 2 * max(14px,var(--unified-safe-left,env(safe-area-inset-left,0px)),var(--unified-safe-right,env(safe-area-inset-right,0px))))!important;\n max-width:560px!important;height:70px!important;padding:6px!important;\n bottom:var(--premium-dock-bottom,8px)!important;border-radius:999px!important;\n background:#141d1f!important;\n}\nhtml.premium-fixed-dock body nav.premium-adaptive-dock>button{font-size:11px!important;color:#d4dce5;min-width:44px!important}\nhtml.premium-fixed-dock .premium-adaptive-dock .premium-dock-label{\n display:block!important;max-height:none!important;opacity:1!important;transform:none!important;overflow:visible!important;transition:none!important;\n}\n/* Steven, vid\u00e9o du 21/09 : repli \u00e0 la descente, libell\u00e9s au retour.\n   Les noms accessibles restent port\u00e9s par aria-label. Hauteur racine inchang\u00e9e. */\nhtml.premium-fixed-dock.verdict-floating-dock.premium-dock-hidden body nav.premium-adaptive-dock{\n width:min(var(--premium-dock-compact-width,200px),calc(100% - 28px))!important;\n height:56px!important;padding:5px!important;\n}\nhtml.premium-fixed-dock.verdict-floating-dock.premium-dock-hidden body nav.premium-adaptive-dock>button{\n min-height:44px!important;gap:0!important;\n}\nhtml.premium-fixed-dock.verdict-floating-dock.premium-dock-hidden .premium-adaptive-dock .premium-dock-label{\n display:none!important;max-height:0!important;opacity:0!important;overflow:hidden!important;\n}\n/* Garder la r\u00e9serve d\u00e9ploy\u00e9e \u00e9vite de d\u00e9placer le contenu lors du repli. */\nhtml.premium-fixed-dock.premium-dock-hidden{--premium-dock-clearance:var(--premium-dock-height,86px)}\n@media(prefers-reduced-motion:reduce){\n html.premium-fixed-dock body nav.premium-adaptive-dock,\n html.premium-fixed-dock.premium-dock-hidden body nav.premium-adaptive-dock{\n  transition:none!important;animation:none!important;\n }\n}\nhtml.premium-fixed-dock body #toast,html.premium-fixed-dock body .toast{background:#10161c!important;color:#f4f7fa!important;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}\n@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){html.premium-fixed-dock body nav.premium-adaptive-dock,html.premium-fixed-dock body .toast{background:#10161c!important}}\n\n/* R37: r\u00e9serve ind\u00e9pendante du repli et des transformations anim\u00e9es. */\nhtml.premium-fixed-dock{--premium-dock-expanded-size:70px}\n";
    // The script can start after parsing. All copies keep their stylesheet beside the HTML.
    capsule.addEventListener('load',syncDock,{once:true});
    doc.head.appendChild(capsule);
  }
  function ensure(){
    if(button)return button;style();button=doc.createElement('button');button.type='button';button.id='premiumViewportHelper';
    button.innerHTML='<span class="pv-icon" aria-hidden="true">⌖</span><span class="pv-copy"><small></small><span class="pv-action"></span></span>';
    probe=doc.createElement('span');probe.id='premiumViewportSafeProbe';probe.setAttribute('aria-hidden','true');
    dockProbe=doc.createElement('span');dockProbe.id='premiumDockSafeProbe';dockProbe.setAttribute('aria-hidden','true');
    doc.body.appendChild(probe);doc.body.appendChild(dockProbe);doc.body.appendChild(button);
    refreshLabels();button.addEventListener('click',recenter);return button;
  }
  function refreshLabels(){if(!button)return;var copy=labels(),words=copy.words,small=button.querySelector('small'),value=button.querySelector('.pv-action');if(small)small.textContent=words[0];if(value)value.textContent=words[1];button.setAttribute('aria-label',words[0]+' '+words[1]);button.setAttribute('title',words[2]);button.setAttribute('lang',copy.lang);}
  function scale(){return viewport&&Number(viewport.scale)>0?Number(viewport.scale):1;}
  function zoomed(){return scale()>zoomThreshold;}
  function visible(node){if(!node||node===button||!node.isConnected)return false;var css=global.getComputedStyle?global.getComputedStyle(node):null;if(css&&(css.display==='none'||css.visibility==='hidden'||Number(css.opacity)<=.01))return false;return !!(node.getClientRects&&node.getClientRects().length);}
  /* Dans un module intégré, Safari ne résout pas toujours la zone sûre basse.
     Le lanceur transmet donc sa valeur réelle dans --unified-safe-bottom.
     La barre conserve ses icônes, ses libellés et ses dimensions d'origine. */
  function findDock(){
    if(dock&&dock.isConnected&&global.getComputedStyle(dock).position==='fixed')return dock;
    var nodes=doc.querySelectorAll('nav,.nav,#bottomNav,.bottom-nav,[data-bottom-nav]'),width=global.innerWidth||doc.documentElement.clientWidth||0;
    for(var i=0;i<nodes.length;i++){
      var node=nodes[i],css=global.getComputedStyle?global.getComputedStyle(node):null,rect=node.getBoundingClientRect?node.getBoundingClientRect():null;
      if(css&&rect&&css.position==='fixed'&&rect.width>=Math.max(240,width*.65)&&rect.height>40)return node;
    }
    return null;
  }
  function currentScrollY(){
    var root=doc.scrollingElement||doc.documentElement||doc.body,value=Number(global.scrollY);
    if(!Number.isFinite(value))value=root?Number(root.scrollTop)||0:0;
    return Math.max(0,value);
  }
  function readMaxScrollY(){
    var root=doc.scrollingElement||doc.documentElement||doc.body,height=viewport&&Number(viewport.height)>0?Number(viewport.height):(global.innerHeight||doc.documentElement.clientHeight||0);
    return Math.max(0,(root?Math.max(root.scrollHeight||0,doc.documentElement.scrollHeight||0,doc.body?doc.body.scrollHeight||0:0):0)-height);
  }
  function refreshDockBounds(){dockBoundsFrame=0;dockMaxScrollY=readMaxScrollY();}
  function queueDockBounds(){if(dockBoundsFrame)return;dockBoundsFrame=requestFrame(refreshDockBounds);}
  /* FLIP natif : seules les transformations changent pendant le mouvement.
     Les icônes compensent l'échelle de la capsule pour rester nettes. */
  var dockAnimations=[];
  function cancelDockMotion(){
    var previous=dockAnimations;dockAnimations=[];
    previous.forEach(function(animation){try{animation.cancel();}catch(e){}});
  }
  function dockMotionSnapshot(){
    if(!dock||!dock.isConnected||reduced()||doc.hidden||editing()||zoomed()||
       !doc.documentElement.classList.contains('verdict-floating-dock')||
       typeof dock.animate!=='function'||!global.CSS||!global.CSS.supports('scale','1'))return null;
    var rect=dock.getBoundingClientRect();if(rect.width<1||rect.height<1)return null;
    return {rect:rect,icons:Array.from(dock.querySelectorAll(':scope > button > .ic,:scope > button > #bdg')).map(function(node){return {node:node,rect:node.getBoundingClientRect()};}).filter(function(item){return item.rect.width>0&&item.rect.height>0;})};
  }
  function playDockMotion(before,compact){
    if(!before||!dock)return;
    var after=dock.getBoundingClientRect();if(after.width<1||after.height<1)return;
    var sx=before.rect.width/after.width,sy=before.rect.height/after.height;
    var cx=after.left+after.width/2,cy=after.top+after.height/2;
    var dx=before.rect.left+before.rect.width/2-cx,dy=before.rect.top+before.rect.height/2-cy;
    if(Math.abs(sx-1)+Math.abs(sy-1)+Math.abs(dx)+Math.abs(dy)<.001)return;
    var options={duration:compact?260:320,easing:'cubic-bezier(.22,1,.36,1)'};
    function keep(animation){
      dockAnimations.push(animation);
      if(animation.finished&&animation.finished.then){var done=function(){var i=dockAnimations.indexOf(animation);if(i>=0)dockAnimations.splice(i,1);};animation.finished.then(done,done);}
    }
    /* Mesurer les enfants avant d'appliquer la transformation du parent. */
    var icons=before.icons.map(function(item){return {node:item.node,from:item.rect,to:item.node.getBoundingClientRect()};});
    try{
      keep(dock.animate([{scale:sx+' '+sy,translate:dx+'px '+dy+'px'},{scale:'1 1',translate:'0px 0px'}],options));
      icons.forEach(function(item){
        if(!item.node.isConnected||item.to.width<1||item.to.height<1)return;
        var frames=[],tx=item.to.left+item.to.width/2,ty=item.to.top+item.to.height/2;
        for(var i=0;i<=16;i++){
          var p=i/16,x=sx+(1-sx)*p,y=sy+(1-sy)*p;
          var desiredX=item.from.left+item.from.width/2+(tx-item.from.left-item.from.width/2)*p;
          var desiredY=item.from.top+item.from.height/2+(ty-item.from.top-item.from.height/2)*p;
          var shiftX=(desiredX-cx-dx*(1-p))/x-(tx-cx),shiftY=(desiredY-cy-dy*(1-p))/y-(ty-cy);
          var width=item.from.width+(item.to.width-item.from.width)*p,height=item.from.height+(item.to.height-item.from.height)*p;
          frames.push({offset:p,scale:width/item.to.width/x+' '+height/item.to.height/y,translate:shiftX+'px '+shiftY+'px'});
        }
        if(typeof item.node.animate==='function')keep(item.node.animate(frames,options));
      });
    }catch(e){cancelDockMotion();}
  }
  /* C371 b (chef : « des touchers ignorés ») : la barre ne change pas d'état tant qu'un doigt est posé ; le changement attendu est appliqué
     350 ms après le lever du doigt. Avant, elle se repliait puis se redéployait pendant le toucher, et iPhone abandonnait le clic. */
  var vdDockAttente=null;
  function setDockHidden(next,withReveal){if(interacting&&!!next!==dockHidden){vdDockAttente=[next,withReveal];return;}
    /* Un appui tactile/souris laisse parfois le focus sur l'onglet.
       Seul le focus clavier visible doit empêcher le repli au défilement. */
    var keyboardFocus=false;
    if(dock&&dock.contains(doc.activeElement)){
      try{keyboardFocus=doc.activeElement.matches(':focus-visible');}
      catch(e){keyboardFocus=true;}
    }
    next=!!(next&&dock&&dock.isConnected&&!keyboardFocus);var root=doc.documentElement,changed=dockHidden!==next;
    var motion=changed?dockMotionSnapshot():null;
    if(changed)cancelDockMotion();
    dockHidden=next;root.classList.toggle('premium-dock-hidden',next);
    if(changed)playDockMotion(motion,next);
    if(!dock||!changed)return;
    global.clearTimeout(dockRevealTimer);dockRevealTimer=0;
    dock.classList.remove('premium-dock-reveal');
    if(!next&&changed&&withReveal&&!reduced()&&!root.classList.contains('verdict-floating-dock')){
      requestFrame(function(){if(!dockHidden&&dock&&dock.isConnected)dock.classList.add('premium-dock-reveal');});
      dockRevealTimer=global.setTimeout(function(){dockRevealTimer=0;if(dock)dock.classList.remove('premium-dock-reveal');},700);
    }
  }
  function resetDockScroll(show,withReveal){
    lastDockScrollY=currentScrollY();dockTravel=0;dockDirection=0;
    if(show)setDockHidden(false,withReveal);
  }
  function dockScrollBlocked(){return !dock||!dock.isConnected||doc.hidden||overlayActive||editing()||zoomed();}
  function updateDockForScroll(){
    dockScrollFrame=0;var y=currentScrollY(),delta=y-lastDockScrollY,limit=dockMaxScrollY;lastDockScrollY=y;
    if(!dock||!dock.isConnected){syncDock();return;}
    if(dockScrollBlocked()){dockTravel=0;dockDirection=0;setDockHidden(false,false);return;}
    if(y<=56||limit<=96||limit-y<=28){dockTravel=0;dockDirection=0;setDockHidden(false,dockHidden);return;}
    if(Math.abs(delta)<1)return;
    var direction=delta>0?1:-1;
    if(direction!==dockDirection){dockDirection=direction;dockTravel=0;}
    dockTravel+=Math.abs(delta);
    if(direction>0&&dockTravel>=24)setDockHidden(true,false);
    else if(direction<0&&dockTravel>=9)setDockHidden(false,true);
  }
  function queueDockScroll(){
    if(dockScrollFrame)return;
    dockScrollFrame=requestFrame(updateDockForScroll);
  }
  function syncDock(){
    global.clearTimeout(dockTimer);dockTimer=0;ensure();
    var next=findDock(),root=doc.documentElement,changed=dock!==next;
    if(dock&&changed){dock.classList.remove('premium-adaptive-dock','premium-dock-reveal');}dock=next;
    if(!dock){setDockHidden(false,false);root.classList.remove('premium-fixed-dock');root.style.removeProperty('--premium-dock-height');root.style.removeProperty('--premium-dock-shift');root.style.removeProperty('--premium-dock-rest');root.style.removeProperty('--premium-dock-clearance');return;}
    var raw=0,passed=null;
    try{
      var computed=global.getComputedStyle(root);
      raw=parseFloat(global.getComputedStyle(dockProbe).paddingBottom)||0;
      var passedValue=computed.getPropertyValue('--unified-safe-bottom').trim();
      passed=passedValue!==''?parseFloat(passedValue):null;
    }catch(e){}
    var embedded=false;try{embedded=global.top!==global.self;}catch(e){embedded=true;}
    /* La coque unifiée est l'autorité de la zone sûre. Si son message n'est
       pas encore arrivé, la valeur CSS locale sert uniquement de repli. */
    var inset=Math.max(0,embedded?(Number.isFinite(passed)?passed:raw):raw),shift=Math.min(18,inset*.5),rest=Math.max(0,inset-shift);
    root.style.setProperty('--premium-dock-inset',Math.round(inset*100)/100+'px');root.style.setProperty('--premium-dock-shift',Math.round(shift*100)/100+'px');root.style.setProperty('--premium-dock-rest',Math.round(rest*100)/100+'px');root.classList.add('premium-fixed-dock');dock.classList.add('premium-adaptive-dock');
    var visibleButtons=Array.from(dock.querySelectorAll(':scope > button')).filter(function(b){return global.getComputedStyle(b).display!=='none'&&!b.hidden;});
    visibleButtons.forEach(function(b){
      var labels=Array.from(b.querySelectorAll(':scope > .premium-dock-label'));
      var texts=Array.from(b.childNodes).filter(function(n){return n.nodeType===3&&n.textContent.trim();});
      var label=labels[0];
      if(texts.length||labels.length>1){
        if(!label){label=doc.createElement('span');label.className='premium-dock-label';b.appendChild(label);}
        label.textContent=(texts.length?texts[texts.length-1]:labels[labels.length-1]).textContent.trim();
        texts.forEach(function(n){n.remove();});labels.slice(1).forEach(function(n){n.remove();});
      }
      if(label)b.setAttribute('aria-label',label.textContent.trim());
    });
    root.style.setProperty('--premium-dock-compact-width',Math.max(160,visibleButtons.length*56+12)+'px');
    root.style.setProperty('--premium-dock-bottom',Math.max(8,inset)+'px');
    if(changed)resetDockScroll(true,false);
    queueDockBounds();
    dockTimer=global.setTimeout(function(){
      if(!dock||!dock.isConnected)return;
      // R37: offsetHeight ignore le FLIP; la réserve CSS reste celle de la barre ouverte.
      var expanded=parseFloat(global.getComputedStyle(root).getPropertyValue('--premium-dock-expanded-size'))||0;
      var floating=root.classList.contains('verdict-floating-dock');
      var height=Math.max(dock.offsetHeight,expanded+(floating?0:inset));
      if(height>40)root.style.setProperty('--premium-dock-height',Math.ceil(height+(parseFloat(global.getComputedStyle(dock).bottom)||0))+'px');
    },0);
  }
  function receiveSafeBottom(event){
    if(event.source!==global.parent||!event.data||event.data.type!=='verdict-unified-safe-area')return;
    if((global.location.origin!=="null"&&global.location.protocol!=='file:')&&event.origin!==global.location.origin)return;
    var bottom=Number(event.data.bottom);if(!Number.isFinite(bottom)||bottom<0||bottom>200)return;
    var value=Math.round(bottom*100)/100+'px',root=doc.documentElement;
    root.classList.toggle('premium-keyboard-open',event.data.keyboard===true);root.style.setProperty('--sab',value);root.style.setProperty('--unified-safe-bottom',value);syncDock();
  }
  function overlayOpen(){
    if(doc.body.classList.contains('inventory-guide-open')||doc.body.classList.contains('demo-tour-active'))return true;
    var nodes=doc.querySelectorAll(overlaySelector);
    for(var i=0;i<nodes.length;i++)if(visible(nodes[i]))return true;return false;
  }
  function refreshOverlayState(){overlayActive=overlayOpen();return overlayActive;}
  function editing(){var active=doc.activeElement;return !!(active&&(/^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName)||active.isContentEditable||(active.matches&&active.matches('[role="textbox"],[role="combobox"],[aria-multiline="true"]'))));}
  function unsafe(){return doc.hidden||refreshOverlayState()||editing();}
  function hide(){global.clearTimeout(timer);timer=0;if(button)button.classList.remove('on');}
  function safeInsets(){ensure();var css=global.getComputedStyle?global.getComputedStyle(probe):null,num=function(value){value=parseFloat(value);return Number.isFinite(value)&&value>0?value:0;};return css?{top:num(css.paddingTop),right:num(css.paddingRight),bottom:num(css.paddingBottom),left:num(css.paddingLeft)}:{top:0,right:0,bottom:0,left:0};}
  function visualBox(){var left=viewport?Number(viewport.offsetLeft)||0:0,top=viewport?Number(viewport.offsetTop)||0:0,width=viewport?Number(viewport.width)||global.innerWidth:global.innerWidth,height=viewport?Number(viewport.height)||global.innerHeight:global.innerHeight,safe=safeInsets();return {left:left,top:top,width:width,height:height,right:left+width,bottom:top+height,safe:safe};}
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function place(){
    if(!button)return false;var box=visualBox(),safe=box.safe,availableWidth=Math.max(0,box.width-safe.left-safe.right-24),availableHeight=Math.max(0,box.height-safe.top-safe.bottom-24);
    if(availableWidth<44||availableHeight<44){button.classList.remove('on');return false;}
    button.classList.toggle('compact',availableWidth<156);button.style.maxWidth=Math.min(248,availableWidth)+'px';
    var width=button.offsetWidth,height=button.offsetHeight;
    if((width>availableWidth+.5||height>availableHeight+.5)&&!button.classList.contains('compact')){button.classList.add('compact');width=button.offsetWidth;height=button.offsetHeight;}
    if(width>availableWidth+.5||height>availableHeight+.5){button.classList.remove('on');return false;}
    var minLeft=box.left+safe.left+12,maxLeft=box.right-safe.right-12-width,minTop=box.top+safe.top+12,maxTop=box.bottom-safe.bottom-12-height;
    var left=clamp(maxLeft,minLeft,Math.max(minLeft,maxLeft)),top=clamp(maxTop,minTop,Math.max(minTop,maxTop)),rects=[];
    var obstacles=doc.querySelectorAll('nav,.bottom-nav,#bottomNav,#upBtn,#aideBtn,.dec-total,#prioBack,.dec-sticky,[data-fixed-bottom]');
    for(var i=0;i<obstacles.length;i++){var node=obstacles[i],css=global.getComputedStyle?global.getComputedStyle(node):null,rect=node.getBoundingClientRect?node.getBoundingClientRect():null;if(rect&&visible(node)&&css&&css.position==='fixed')rects.push(rect);}
    var collides=function(rectangle){return left<rectangle.right&&left+width>rectangle.left&&top<rectangle.bottom&&top+height>rectangle.top;};
    for(var pass=0;pass<rects.length;pass++){var shifted=false;for(i=0;i<rects.length;i++)if(collides(rects[i])){var candidate=rects[i].top-height-10;if(candidate<minTop){button.classList.remove('on');return false;}if(candidate<top){top=candidate;shifted=true;}}if(!shifted)break;}
    for(i=0;i<rects.length;i++)if(collides(rects[i])){button.classList.remove('on');return false;}
    left=clamp(left,minLeft,Math.max(minLeft,maxLeft));top=clamp(top,minTop,Math.max(minTop,maxTop));button.style.left=Math.round(left)+'px';button.style.top=Math.round(top)+'px';return true;
  }
  function activeTarget(){
    if(lastAnchor&&visible(lastAnchor)&&!lastAnchor.closest(overlayWatchSelector+',.view:not(.on)'))return lastAnchor;
    var candidates=doc.querySelectorAll('.demo-target-banner,.view.on [data-reframe-anchor="true"],section.on,main,[role="main"],.view.on');for(var i=0;i<candidates.length;i++)if(visible(candidates[i])&&!candidates[i].closest(overlayWatchSelector))return candidates[i];return doc.body;
  }
  function recenter(event){
    if(unsafe()){hide();return;}var target=activeTarget(),motion=reduced()?'auto':'smooth',keyboard=!!(event&&event.detail===0),hadTabindex=target.hasAttribute&&target.hasAttribute('tabindex'),oldTabindex=hadTabindex?target.getAttribute('tabindex'):null;dismissed=true;hide();
    try{target.scrollIntoView({block:'center',inline:'nearest',behavior:motion});}catch(e){try{target.scrollIntoView(false);}catch(_error){}}
    if(keyboard)global.setTimeout(function(){try{if(!target.matches('a,button,input,select,textarea,[tabindex]'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});global.setTimeout(function(){if(!hadTabindex)target.removeAttribute('tabindex');else target.setAttribute('tabindex',oldTabindex);},650);}catch(e){}},motion==='smooth'?420:0);
  }
  function show(){timer=0;if(!zoomed()||interacting||dismissed||unsafe())return;ensure();refreshLabels();button.classList.add('on');if(!place())hide();}
  function schedule(){hide();if(!zoomed()||interacting||dismissed||unsafe())return;timer=global.setTimeout(show,stableDelay);}
  function rememberAnchor(event){var source=event&&event.target;if(source&&source.closest&&source.closest(overlayWatchSelector))return;var node=source&&source.closest?source.closest('[data-reframe-anchor="true"],.card,.item,section,main,[role="main"],.view'):null;if(node)lastAnchor=node;}
  function isHelperEvent(event){return !!(button&&event&&event.target&&(event.target===button||button.contains(event.target)));}
  function helperFocused(){var active=doc.activeElement;return !!(button&&active&&(active===button||button.contains(active)));}
  function begin(event){if(isHelperEvent(event))return;if(event&&event.pointerId!=null)pointers[event.pointerId]=true;interacting=true;rememberAnchor(event);hide();global.clearTimeout(restoreTimer);restoreTimer=0;}
  function end(event){if(isHelperEvent(event))return;if(event&&event.pointerId!=null)delete pointers[event.pointerId];interacting=pointerEvents?Object.keys(pointers).length>0:!!(event&&event.touches&&event.touches.length);if(interacting)return;if(vdDockAttente){var vdA=vdDockAttente;vdDockAttente=null;global.setTimeout(function(){if(!interacting)setDockHidden(vdA[0],vdA[1]);else vdDockAttente=vdA;},350);}if(!zoomed())dismissed=false;if(hadZoom&&!zoomed()){global.clearTimeout(restoreTimer);restoreTimer=global.setTimeout(autoReframe,520);}schedule();}
  function autoReframe(){
    restoreTimer=0;if(zoomed()||interacting)return;if(unsafe())return;
    var target=activeTarget(),rect=target.getBoundingClientRect?target.getBoundingClientRect():null,box=visualBox(),viewLeft=box.left+box.safe.left,viewTop=box.top+box.safe.top,viewRight=box.right-box.safe.right,viewBottom=box.bottom-box.safe.bottom,viewWidth=Math.max(0,viewRight-viewLeft),viewHeight=Math.max(0,viewBottom-viewTop);
    if(rect&&viewHeight>0&&viewWidth>0){var visibleHeight=Math.max(0,Math.min(rect.bottom,viewBottom)-Math.max(rect.top,viewTop)),visibleWidth=Math.max(0,Math.min(rect.right,viewRight)-Math.max(rect.left,viewLeft)),ratio=(visibleHeight*visibleWidth)/Math.max(1,Math.min(rect.height,viewHeight)*Math.min(rect.width,viewWidth));if(ratio<.48){try{target.scrollIntoView({block:'center',inline:'nearest',behavior:reduced()?'auto':'smooth'});}catch(e){}}}
    hadZoom=false;
  }
  function viewportChanged(){cancelDockMotion();syncDock();var isZoomed=zoomed();if(isZoomed||unsafe())setDockHidden(false,false);if(isZoomed){hadZoom=true;global.clearTimeout(restoreTimer);restoreTimer=0;}else{dismissed=false;if(hadZoom&&!interacting&&!unsafe()){global.clearTimeout(restoreTimer);restoreTimer=global.setTimeout(autoReframe,520);}}hide();schedule();}
  function queueViewportChanged(){if(viewportFrame)return;viewportFrame=requestFrame(function(){viewportFrame=0;viewportChanged();});}
  function viewportScrolled(){queueDockScroll();if(zoomed()||hadZoom)queueViewportChanged();}
  function reevaluate(){global.clearTimeout(reevaluateTimer);reevaluateTimer=global.setTimeout(function(){reevaluateTimer=0;syncDock();refreshLabels();if(unsafe())setDockHidden(false,false);if(helperFocused()&&!unsafe())return;if(hadZoom&&!zoomed()&&!interacting&&!unsafe()){global.clearTimeout(restoreTimer);restoreTimer=global.setTimeout(autoReframe,520);}schedule();},90);}
  function reevaluateAfterClick(){
    /* À l'échelle normale, un clic n'a rien à recalculer pour l'aide au zoom.
       En vue agrandie, le travail attend une période calme. */
    if(!zoomed()&&!helperFocused())return;
    if(clickIdleTimer){if(global.cancelIdleCallback)global.cancelIdleCallback(clickIdleTimer);else global.clearTimeout(clickIdleTimer);}
    var run=function(){clickIdleTimer=0;reevaluate();};
    if(global.requestIdleCallback)clickIdleTimer=global.requestIdleCallback(run,{timeout:450});
    else clickIdleTimer=global.setTimeout(run,180);
  }
  function overlayTree(node){if(!node||node.nodeType!==1)return false;try{return !!((node.matches&&node.matches(overlayWatchSelector))||(node.querySelector&&node.querySelector(overlayWatchSelector)));}catch(e){return false;}}
  function relevantMutation(record){
    if(record.type==='childList'){var nodes=[],i;for(i=0;i<record.addedNodes.length;i++)nodes.push(record.addedNodes[i]);for(i=0;i<record.removedNodes.length;i++)nodes.push(record.removedNodes[i]);for(i=0;i<nodes.length;i++)if(overlayTree(nodes[i]))return true;return false;}
    if(record.attributeName==='lang')return record.target===doc.documentElement;
    if(record.attributeName==='open'||record.attributeName==='aria-modal')return true;
    try{return !!(record.target&&record.target.matches&&record.target.matches(overlayWatchSelector));}catch(e){return false;}
  }

  if(pointerEvents){doc.addEventListener('pointerdown',begin,{passive:true});doc.addEventListener('pointerup',end,{passive:true});doc.addEventListener('pointercancel',end,{passive:true});}
  else{doc.addEventListener('touchstart',begin,{passive:true});doc.addEventListener('touchend',end,{passive:true});doc.addEventListener('touchcancel',end,{passive:true});}
  doc.addEventListener('click',function(event){if(!isHelperEvent(event))reevaluateAfterClick();},true);
  doc.addEventListener('focusin',function(event){setDockHidden(false,dockHidden);if(isHelperEvent(event)){global.clearTimeout(reevaluateTimer);reevaluateTimer=0;return;}rememberAnchor(event);if(refreshOverlayState()||editing())hide();else reevaluate();});doc.addEventListener('focusout',function(){global.setTimeout(function(){if(!helperFocused())reevaluate();},80);});
  doc.addEventListener('visibilitychange',function(){if(doc.hidden){pointers={};interacting=false;setDockHidden(false,false);hide();}else{resetDockScroll(true,false);reevaluate();}});
  global.addEventListener('pagehide',function(){pointers={};interacting=false;setDockHidden(false,false);hide();},{passive:true});global.addEventListener('blur',function(){pointers={};interacting=false;setDockHidden(false,false);hide();},{passive:true});/* C371 : dans la coque, le premier toucher dans l'Inventaire (après un toucher dans la coque) donne le focus au cadre ; la barre se
     redéployait aussitôt, et iPhone, voyant le contenu changer pendant le toucher, ne déclenchait pas le clic (« il faut toucher deux fois »).
     Le redéploiement attend la fin du toucher. */
  var vdFocusT=0;global.addEventListener('focus',function(){global.clearTimeout(vdFocusT);vdFocusT=global.setTimeout(function(){resetDockScroll(true,false);reevaluate();},450);},{passive:true});global.addEventListener('pageshow',function(){resetDockScroll(true,false);global.setTimeout(reevaluate,250);},{passive:true});
  global.addEventListener('orientationchange',function(){setDockHidden(false,false);hide();global.setTimeout(reevaluate,500);},{passive:true});global.addEventListener('resize',queueViewportChanged,{passive:true});global.addEventListener('scroll',queueDockScroll,{passive:true});
  global.addEventListener('message',receiveSafeBottom);
  var dockMotionPreference=global.matchMedia&&global.matchMedia('(prefers-reduced-motion: reduce)');
  if(dockMotionPreference&&dockMotionPreference.addEventListener)dockMotionPreference.addEventListener('change',function(){if(reduced())cancelDockMotion();});
  if(viewport){viewport.addEventListener('resize',queueViewportChanged,{passive:true});viewport.addEventListener('scroll',viewportScrolled,{passive:true});}
  if('MutationObserver' in global){observer=new global.MutationObserver(function(records){for(var i=0;i<records.length;i++)if(relevantMutation(records[i])){refreshOverlayState();if(unsafe()){setDockHidden(false,false);hide();}reevaluate();break;}});observer.observe(doc.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','open','aria-hidden','aria-modal','lang']});}
  if('ResizeObserver' in global&&doc.body){bodyObserver=new global.ResizeObserver(queueDockBounds);bodyObserver.observe(doc.body);}
  global.VerdictViewport=Object.freeze({version:'1.16.0',recenter:recenter,inspect:function(){var box=viewport?visualBox():null;return {scale:scale(),zoomed:zoomed(),helperVisible:!!(button&&button.classList.contains('on')),autoReframePending:!!restoreTimer||(hadZoom&&!zoomed()),overlayOpen:overlayOpen(),interacting:interacting,dock: dock?{height:Math.ceil(dock.getBoundingClientRect().height),safeBottom:parseFloat(doc.documentElement.style.getPropertyValue('--premium-dock-inset'))||0,hidden:dockHidden,scrollDirection:dockDirection}:null,visualViewport:box?{left:box.left,top:box.top,width:box.width,height:box.height}:null,changesZoomScale:false};}});
  if(zoomed())hadZoom=true;refreshOverlayState();refreshDockBounds();syncDock();global.setTimeout(reevaluate,250);
})(window);

