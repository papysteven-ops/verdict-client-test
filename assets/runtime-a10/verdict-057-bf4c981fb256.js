
/* Vera Life 5.2.0 — animation de référence commune à Verdict.
   Deux paupières DOM opaques ferment réellement les yeux. Le portrait ne
   flotte pas, ne se translate pas et conserve sa bouche originale en trait
   blanc fin : aucune nouvelle forme de bouche n'est dessinée. */
(function(global){
  'use strict';
  if(global.VeraLife&&global.VeraLife.version==='5.2.0'){
    try{global.VeraLife.scan(document);}catch(e){}
    return;
  }

  var SELECTOR='[data-vv-avatar],[data-vera-avatar],[data-vera-inventory-avatar],#veraPilotPortrait';
  var FIRST_MIN=650,FIRST_MAX=950,MIN_DELAY=3000,MAX_DELAY=6200;
  var DOUBLE_CHANCE=.16,BLINK_MS=380,DOUBLE_GAP_MS=210;
  var STYLE_ID='vera-life-style-5';
  var EYE_L={x:42.6,y:33.1},EYE_R={x:58.3,y:33.1},EYE_W=8.4,EYE_H=9.6;
  var states=new Map(),observer=null,mutation=null;
  var reduceQuery=global.matchMedia?global.matchMedia('(prefers-reduced-motion: reduce)'):null;

  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    var css=SELECTOR+'{animation:none!important;transform:none!important}'+
      '[data-vera-life-host]{position:relative!important}'+
      '.vera-life-eyes{all:initial;position:absolute!important;z-index:2147483000!important;display:block!important;pointer-events:none!important;overflow:visible!important;line-height:0!important;opacity:0!important;transform:none!important;margin:0!important;padding:0!important;border:0!important}'+
      '.vera-life-eyes.ready{opacity:1!important}'+
      '.vera-life-lid{all:initial;display:block!important;position:absolute!important;top:'+EYE_L.y+'%!important;width:'+EYE_W+'%!important;height:'+EYE_H+'%!important;border-radius:50%!important;margin:0!important;padding:0!important;border:0!important;background:#010403!important;box-shadow:0 0 1px 1px rgba(0,0,0,.72)!important;transform:translate(-50%,-50%) scaleY(0);transform-origin:center!important;will-change:transform!important}'+
      '.vera-life-lid.l{left:'+EYE_L.x+'%!important}.vera-life-lid.r{left:'+EYE_R.x+'%!important;top:'+EYE_R.y+'%!important}'+
      '.vera-life-eyes.blink .vera-life-lid{animation:veraLifeBlink5 '+BLINK_MS+'ms cubic-bezier(.45,0,.55,1) both!important}'+
      '@keyframes veraLifeBlink5{0%{transform:translate(-50%,-50%) scaleY(0)}18%{transform:translate(-50%,-50%) scaleY(1.12)}72%{transform:translate(-50%,-50%) scaleY(1.12)}100%{transform:translate(-50%,-50%) scaleY(0)}}'+
      '@media(prefers-reduced-motion:reduce){.vera-life-eyes.blink .vera-life-lid{animation:none!important}}'+
      '@media print{.vera-life-eyes{display:none!important}}';
    var style=document.createElement('style');style.id=STYLE_ID;style.textContent=css;
    (document.head||document.documentElement).appendChild(style);
  }

  function motionReduced(){return !!(reduceQuery&&reduceQuery.matches);}
  function randomBetween(a,b){return a+Math.floor(Math.random()*(b-a+1));}
  function nextDelay(first){
    if(first)return randomBetween(FIRST_MIN,FIRST_MAX);
    return motionReduced()?randomBetween(5200,8500):randomBetween(MIN_DELAY,MAX_DELAY);
  }
  function visible(img){
    if(!img||!img.isConnected||document.hidden)return false;
    var rect=img.getBoundingClientRect();
    if(rect.width<24||rect.height<24||rect.right<=0||rect.bottom<=0||rect.left>=global.innerWidth||rect.top>=global.innerHeight)return false;
    for(var node=img;node&&node!==document.documentElement;node=node.parentElement){
      if(node.hidden)return false;
      var computed=global.getComputedStyle?global.getComputedStyle(node):null;
      if(computed&&(computed.display==='none'||computed.visibility==='hidden'||(computed.opacity!==''&&Number(computed.opacity)===0)))return false;
    }
    return true;
  }
  function localBox(img,host){
    if(img.offsetParent===host){
      return {left:img.offsetLeft,top:img.offsetTop,width:img.offsetWidth,height:img.offsetHeight};
    }
    var imageRect=img.getBoundingClientRect(),hostRect=host.getBoundingClientRect();
    var scaleX=host.offsetWidth?hostRect.width/host.offsetWidth:1;
    var scaleY=host.offsetHeight?hostRect.height/host.offsetHeight:1;
    if(!isFinite(scaleX)||scaleX===0)scaleX=1;
    if(!isFinite(scaleY)||scaleY===0)scaleY=1;
    return {left:(imageRect.left-hostRect.left)/scaleX+host.scrollLeft,top:(imageRect.top-hostRect.top)/scaleY+host.scrollTop,width:imageRect.width/scaleX,height:imageRect.height/scaleY};
  }
  function position(img,state){
    if(!img||!state||!state.layer||!img.isConnected)return false;
    var host=img.parentElement;if(!host)return false;
    var box=localBox(img,host);
    if(box.width<1||box.height<1){if(state.layer.classList.contains('ready'))state.layer.classList.remove('ready');return false;}
    state.layer.style.left=box.left+'px';state.layer.style.top=box.top+'px';
    state.layer.style.width=box.width+'px';state.layer.style.height=box.height+'px';
    if(!state.layer.classList.contains('ready'))state.layer.classList.add('ready');return true;/* C464 : n'écrire que si l'état change */
  }
  function normalMood(mood){return /^(calm|focused|concerned|smile)$/.test(String(mood||''))?String(mood):'calm';}
  function makeLayer(img,state){
    var host=img.parentElement;if(!host)return null;
    var computed=global.getComputedStyle?global.getComputedStyle(host):null;
    if(!computed||!computed.position||computed.position==='static')host.setAttribute('data-vera-life-host','');
    var layer=document.createElement('span');layer.className='vera-life-eyes';layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<span class="vera-life-lid l"></span><span class="vera-life-lid r"></span>';
    layer.setAttribute('data-mood',normalMood(img.getAttribute('data-vera-mood')||'calm'));
    host.appendChild(layer);state.layer=layer;position(img,state);
    if(global.requestAnimationFrame)global.requestAnimationFrame(function(){position(img,state);});
    if('ResizeObserver' in global){state.resize=new global.ResizeObserver(function(){position(img,state);});state.resize.observe(img);state.resize.observe(host);}
    if(!img.complete)img.addEventListener('load',function(){position(img,state);},{once:true});
    img.addEventListener('animationend',function(){position(img,state);});
    img.addEventListener('transitionend',function(){position(img,state);});
    return layer;
  }
  function clearState(state){
    if(state.timer){global.clearTimeout(state.timer);state.timer=0;}
    state.blinking=false;if(state.layer)state.layer.classList.remove('blink');
  }
  function setMood(target,mood){
    mood=normalMood(mood);var images=[];
    if(target&&target.matches&&target.matches(SELECTOR))images=[target];
    else if(target&&target.querySelectorAll)images=Array.prototype.slice.call(target.querySelectorAll(SELECTOR));
    else if(!target)images=Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
    images.forEach(function(img){
      img.setAttribute('data-vera-mood',mood);
      var state=states.get(img);
      if(state&&state.layer){state.layer.setAttribute('data-mood',mood);position(img,state);}
    });
    return mood;
  }
  function flash(layer){if(layer.classList.contains('blink')){layer.classList.remove('blink');void layer.offsetWidth;}layer.classList.add('blink');}/* C464 */
  function finishBlink(img,state,twice){
    state.timer=0;state.blinking=false;if(state.layer)state.layer.classList.remove('blink');
    if(!twice){schedule(img,state);return;}
    state.timer=global.setTimeout(function(){
      state.timer=0;if(!visible(img)){schedule(img,state,900);return;}
      position(img,state);state.blinking=true;flash(state.layer);
      state.timer=global.setTimeout(function(){state.timer=0;state.blinking=false;state.layer.classList.remove('blink');schedule(img,state);},motionReduced()?420:BLINK_MS);
    },DOUBLE_GAP_MS);
  }
  function perform(img,state){
    if(!visible(img)){schedule(img,state,900);return;}
    if(!position(img,state)||!state.layer||!state.layer.classList.contains('ready')){schedule(img,state,650);return;}
    var twice=!motionReduced()&&Math.random()<DOUBLE_CHANCE;
    state.first=false;state.blinking=true;flash(state.layer);
    state.timer=global.setTimeout(function(){finishBlink(img,state,twice);},motionReduced()?420:BLINK_MS);
  }
  function schedule(img,state,wait){
    if(!state||!img.isConnected){if(state)clearState(state);states.delete(img);return;}
    if(state.timer)global.clearTimeout(state.timer);
    if(document.hidden||state.intersecting===false){state.timer=0;if(img.getAttribute('data-vera-life')!=='paused')img.setAttribute('data-vera-life','paused');return;}
    if(img.getAttribute('data-vera-life')!=='ready')img.setAttribute('data-vera-life','ready');/* C464 */
    state.timer=global.setTimeout(function(){state.timer=0;perform(img,state);},typeof wait==='number'?wait:nextDelay(state.first));
  }
  function register(img){
    if(!img||img.nodeType!==1||states.has(img))return;
    injectStyle();
    var state={timer:0,blinking:false,intersecting:true,layer:null,resize:null,first:true};
    states.set(img,state);img.setAttribute('data-vera-life','ready');makeLayer(img,state);schedule(img,state);
    if(observer)observer.observe(img);
  }
  function scan(root){
    root=root||document;
    if(root.matches&&root.matches(SELECTOR))register(root);
    if(root.querySelectorAll)root.querySelectorAll(SELECTOR).forEach(register);
  }
  function pauseAll(){states.forEach(function(state,img){clearState(state);img.setAttribute('data-vera-life','paused');});}
  function resumeVisible(){states.forEach(function(state,img){position(img,state);if(state.intersecting!==false)schedule(img,state,state.first?nextDelay(true):randomBetween(700,1300));});}

  if('IntersectionObserver' in global){
    observer=new global.IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var state=states.get(entry.target);if(!state)return;
        state.intersecting=!!entry.isIntersecting;
        if(state.intersecting){position(entry.target,state);schedule(entry.target,state);}else clearState(state);
      });
    },{root:null,threshold:.05});
  }
  document.addEventListener('visibilitychange',function(){if(document.hidden)pauseAll();else resumeVisible();});
  global.addEventListener('resize',resumeVisible,{passive:true});
  if(reduceQuery){
    var onMotion=function(){resumeVisible();};
    if(reduceQuery.addEventListener)reduceQuery.addEventListener('change',onMotion);else if(reduceQuery.addListener)reduceQuery.addListener(onMotion);
  }
  if('MutationObserver' in global){
    mutation=new global.MutationObserver(function(records){
      records.forEach(function(record){record.addedNodes.forEach(function(node){if(node.nodeType===1)scan(node);});});
    });
    mutation.observe(document.documentElement,{childList:true,subtree:true});
  }
  global.VeraLife=Object.freeze({
    version:'5.2.0',scan:scan,pause:pauseAll,resume:resumeVisible,setMood:setMood,
    blink:function(img){var state=states.get(img);if(state){if(state.timer){global.clearTimeout(state.timer);state.timer=0;}perform(img,state);}},
    inspect:function(img){var state=states.get(img);return state?{first:state.first,blinking:state.blinking,ready:!!(state.layer&&state.layer.classList.contains('ready')),mood:state.layer?state.layer.getAttribute('data-mood'):'calm'}:null;}
  });
  function start(){scan(document);if(!observer)resumeVisible();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);

