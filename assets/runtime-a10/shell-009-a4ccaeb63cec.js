
/* R33 — CSS owns the full viewport. VisualViewport is only a keyboard signal.
   https://webkit.org/blog/7929/designing-websites-for-iphone-x/
   https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport */
(function(){
  'use strict';
  var root=document.documentElement,visual=window.visualViewport,queued=0,lastKeyboard=false;
  var dynamic=!!(window.CSS&&CSS.supports('height','100dvh'));
  var probe=document.createElement('div');
  probe.id='verdict-layout-probe';probe.setAttribute('aria-hidden','true');
  probe.style.cssText='position:fixed;top:0;left:0;width:0;height:100vh;height:100dvh;box-sizing:border-box;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  document.body.appendChild(probe);
  function activeInput(){
    var el=document.activeElement;
    try{while(el&&el.tagName==='IFRAME')el=el.contentDocument.activeElement;}catch(e){return false;}
    return !!(el&&!el.disabled&&!el.readOnly&&(el.isContentEditable||el.tagName==='TEXTAREA'||el.tagName==='INPUT'&&!/^(button|submit|reset|checkbox|radio|range|color|file|hidden)$/i.test(el.type)));
  }
  // R34 : aucune hauteur d'écran supposée. Safari installé expose parfois une
  // hauteur CSS amputée de la zone sûre haute (captures Steven : 47 pt).
  // On compense uniquement cette signature mesurée, jamais Safari en onglet,
  // un iframe, une largeur incohérente ou un autre déficit.
  function standaloneGap(height,safeTop){
    if(window.VERDICT_IOS_EDGE_CORRECTION===false||!dynamic||navigator.standalone!==true||window.top!==window||safeTop<=0)return 0;
    var meta=document.querySelector('meta[name="viewport"]');
    if(!meta||!/(?:^|,)\s*viewport-fit\s*=\s*cover(?:\s*,|$)/i.test(meta.content||''))return 0;
    var width=root.clientWidth,sw=Number(screen.width),sh=Number(screen.height),full=0;
    if(Math.abs(width-sw)<=2)full=sh;
    else if(Math.abs(width-sh)<=2)full=sw; // Safari peut conserver les axes portrait.
    var gap=full-height;
    return full>0&&gap>0&&Math.abs(gap-safeTop)<=2?safeTop:0;
  }
  function measure(){
    var css=getComputedStyle(probe),height=dynamic?probe.getBoundingClientRect().height:window.innerHeight;
    var cssHeight=height,gap=standaloneGap(cssHeight,parseFloat(css.paddingTop)||0);
    height+=gap;
    var scale=visual?visual.scale:1,zoomed=Math.abs(scale-1)>.08;
    var bottom=visual?visual.height+Math.max(0,visual.offsetTop):height;
    var keyboard=!!(visual&&!zoomed&&activeInput()&&height-bottom>150);
    return {height:height,cssHeight:cssHeight,standaloneGap:gap,visibleBottom:bottom,keyboard:keyboard,zoomed:zoomed,
      safe:{top:parseFloat(css.paddingTop)||0,right:parseFloat(css.paddingRight)||0,bottom:parseFloat(css.paddingBottom)||0,left:parseFloat(css.paddingLeft)||0}};
  }
  function forFrame(frame){
    var m=measure(),r=frame.getBoundingClientRect(),boxBottom=m.keyboard?m.visibleBottom:m.height;
    return {type:'verdict-unified-safe-area',keyboard:m.keyboard,
      top:Math.max(0,m.safe.top-Math.max(0,r.top)),
      right:Math.max(0,m.safe.right-Math.max(0,root.clientWidth-r.right)),
      bottom:m.keyboard?0:Math.max(0,m.safe.bottom-Math.max(0,boxBottom-r.bottom)),
      left:Math.max(0,m.safe.left-Math.max(0,r.left))};
  }
  function send(frame){
    if(!frame||!frame.contentWindow)return;
    var data=forFrame(frame);
    try{var child=frame.contentDocument.documentElement;
      ['top','right','bottom','left'].forEach(function(side){child.style.setProperty('--unified-safe-'+side,data[side]+'px');});
      child.style.setProperty('--sab',data.bottom+'px');child.classList.toggle('premium-keyboard-open',data.keyboard);
    }catch(e){}
    frame.contentWindow.postMessage(data,location.protocol==='file:'?'*':location.origin);
  }
  function refresh(){
    queued=0;var m=measure();
    if(m.standaloneGap)root.style.setProperty('--verdict-standalone-gap',m.standaloneGap+'px');
    else root.style.removeProperty('--verdict-standalone-gap');
    // A short visual viewport is NOT the document height: browser UI and zoom
    // can change it independently. Never persist it after keyboard dismissal.
    if(m.keyboard)root.style.setProperty('--verdict-layout-height',m.visibleBottom+'px');
    else if(!dynamic&&!m.zoomed)root.style.setProperty('--verdict-layout-height',m.height+'px');
    else if(dynamic)root.style.removeProperty('--verdict-layout-height');
    root.classList.toggle('premium-keyboard-open',m.keyboard);
    document.querySelectorAll('#frame-verdict,#frame-inventory,#local-frame,#inventory-frame').forEach(send);
    if(lastKeyboard!==m.keyboard)window.dispatchEvent(new CustomEvent('verdict-keyboard-change',{detail:{open:m.keyboard}}));
    lastKeyboard=m.keyboard;
  }
  function schedule(){if(!queued)queued=requestAnimationFrame(refresh);}
  ['resize','orientationchange','pageshow','focusin','focusout'].forEach(function(name){window.addEventListener(name,schedule,{passive:true});});
  if(visual){visual.addEventListener('resize',schedule,{passive:true});visual.addEventListener('scroll',schedule,{passive:true});}
  document.addEventListener('visibilitychange',schedule);
  document.addEventListener('load',function(e){if(e.target.tagName==='IFRAME'){
    send(e.target);try{e.target.contentDocument.addEventListener('focusin',schedule);e.target.contentDocument.addEventListener('focusout',schedule);}catch(ignore){}
  }},true);
  if(window.ResizeObserver)new ResizeObserver(schedule).observe(document.body);
  new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
  window.VerdictViewportLayout=Object.freeze({version:'r34-edge-20260921',refresh:refresh,send:send,inspect:measure});
  refresh();
})();

