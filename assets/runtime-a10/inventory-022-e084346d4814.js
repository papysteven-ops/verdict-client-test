
(function(){
  var up=document.createElement('button');
  up.id='upBtn';up.type='button';up.setAttribute('aria-label','Revenir en haut de la page');up.textContent='↑';
  document.body.appendChild(up);
  var busy=false,measure=true,pageLong=false,visible=false,observer=null,reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function paint(){
    busy=false;
    if(measure){measure=false;pageLong=(document.documentElement.scrollHeight-window.innerHeight)>500;}
    var next=pageLong&&window.scrollY>600;
    if(next!==visible){visible=next;up.classList.toggle('on',next);}
  }
  function requestPaint(full){if(full!==false)measure=true;if(!busy){busy=true;requestAnimationFrame(paint)}}
  up.addEventListener('click',function(){window.scrollTo({top:0,behavior:reduced?'auto':'smooth'})});
  window.addEventListener('scroll',function(){requestPaint(false);},{passive:true});
  window.addEventListener('resize',function(){requestPaint(true);},{passive:true});
  document.addEventListener('DOMContentLoaded',function(){requestPaint(true);},{once:true});
  if(typeof ResizeObserver==='function'&&document.body){observer=new ResizeObserver(function(){requestPaint(true);});observer.observe(document.body);}
  requestPaint(true);setTimeout(function(){requestPaint(true);},250);
})();
