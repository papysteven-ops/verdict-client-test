
(function(){
'use strict';

/* Safari iOS perd parfois position:sticky sur les longues vues rendues puis
   remplacées. Le dock vit directement dans body, hors de tout ancêtre animé,
   et délègue chaque action au vrai bouton de la vue active. */
var MR32={source:null,anchor:null,dock:null,clone:null,raf:0,sourceAria:null,busy:false,layoutDirty:true,metrics:null,docked:false};

function mr32Visible(el){
  if(!el||!el.isConnected)return false;
  var s=getComputedStyle(el),r=el.getBoundingClientRect();
  return s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1;
}
function mr32Eligible(el){
  if(!el||!el.isConnected)return false;
  var s=getComputedStyle(el),r=el.getBoundingClientRect();
  return s.display!=='none'&&r.width>1&&r.height>1&&(s.visibility!=='hidden'||el.classList.contains('v32-rail-source-docked'));
}
function mr32Blocked(){
  if(document.documentElement.classList.contains('dec-reveal-lock')||document.body.classList.contains('demo-tour-active'))return true;
  return !!document.querySelector('.modal.on,.dec-reveal.on,#refSh.on');
}
function mr32Top(){
  var top=0,limit=Math.min(190,Math.max(100,window.innerHeight*.28));
  ['#modeBar','.stickytop','body > nav'].forEach(function(sel){
    var el=document.querySelector(sel);if(!el||!mr32Visible(el))return;
    var p=getComputedStyle(el).position,r=el.getBoundingClientRect();
    if((p==='sticky'||p==='fixed')&&r.top<limit&&r.bottom>0)top=Math.max(top,r.bottom);
  });
  return Math.max(0,Math.round(top));
}
function mr32View(){return document.querySelector('.view.on');}
function mr32Source(){
  var view=mr32View();if(!view)return null;
  var action=view.querySelector(':scope > .actbar');
  if(action&&mr32Eligible(action))return action;
  var chips=view.querySelector(':scope > .chips');
  return chips&&mr32Eligible(chips)?chips:null;
}
function mr32Restore(){
  if(MR32.source){
    MR32.source.classList.remove('v32-rail-source-docked');
    if(MR32.sourceAria==null)MR32.source.removeAttribute('aria-hidden');
    else MR32.source.setAttribute('aria-hidden',MR32.sourceAria);
  }
  MR32.source=null;MR32.clone=null;MR32.sourceAria=null;MR32.metrics=null;MR32.layoutDirty=true;MR32.docked=false;
  if(MR32.anchor&&MR32.anchor.parentNode)MR32.anchor.parentNode.removeChild(MR32.anchor);
  MR32.anchor=null;
  if(MR32.dock){MR32.dock.classList.remove('on');MR32.dock.innerHTML='';MR32.dock.removeAttribute('style');}
}
function mr32EnsureDock(){
  if(MR32.dock&&MR32.dock.isConnected)return MR32.dock;
  var dock=document.createElement('div');dock.id='v32ModuleDock';dock.setAttribute('role','navigation');dock.setAttribute('aria-label','Navigation de la page');
  document.body.appendChild(dock);MR32.dock=dock;return dock;
}
function mr32Strip(root){
  [root].concat(Array.prototype.slice.call(root.querySelectorAll('*'))).forEach(function(el){
    el.removeAttribute('id');el.removeAttribute('onclick');el.removeAttribute('onkeydown');
    /* C442 (L4, audit A38) : la copie perd les couleurs « vdl » de la barre d'origine (déclarations !important, data-vdl), que le correcteur ne sait pas effacer sur une copie (deux onglets verts) ; ses autres styles en ligne restent. */
    if(el.hasAttribute('data-vdl')){var st=el.style,imp=[];for(var k=0;k<st.length;k++)if(st.getPropertyPriority(st[k])==='important')imp.push(st[k]);imp.forEach(function(p){st.removeProperty(p);});if(!st.length)el.removeAttribute('style');el.removeAttribute('data-vdl');}
  });
}
function mr32Build(source){
  if(MR32.source!==source){
    mr32Restore();MR32.source=source;MR32.sourceAria=source.getAttribute('aria-hidden');
    var anchor=document.createElement('i');anchor.className='v32-rail-anchor';anchor.setAttribute('aria-hidden','true');source.parentNode.insertBefore(anchor,source);MR32.anchor=anchor;
  }
  var dock=mr32EnsureDock(),clone=source.cloneNode(true);mr32Strip(clone);clone.classList.remove('v32-rail-source-docked');clone.setAttribute('data-v32-module-rail','');/* C442 : refaite pendant le collage, la copie ne reprend pas le masquage de la barre d'origine. */if(MR32.sourceAria==null)clone.removeAttribute('aria-hidden');else clone.setAttribute('aria-hidden',MR32.sourceAria);MR32.sourceText=source.textContent;
  var copies=clone.querySelectorAll('button');
  for(var i=0;i<copies.length;i++)(function(index){
    copies[index].setAttribute('data-v32-source-index',String(index));
    copies[index].addEventListener('click',function(ev){
      ev.preventDefault();var current=MR32.source&&MR32.source.querySelectorAll('button')[index];if(!current)return;
      current.click();mr32Schedule();setTimeout(function(){mr32Schedule();var active=MR32.clone&&MR32.clone.querySelectorAll('button')[index];if(active)active.focus({preventScroll:true});},0);
    });
  })(i);
  dock.innerHTML='';dock.appendChild(clone);MR32.clone=clone;
  var srcScroller=source.classList.contains('chips')?source:source.querySelector('.chips');
  var copyScroller=clone.classList.contains('chips')?clone:clone.querySelector('.chips');
  if(srcScroller&&copyScroller){copyScroller.scrollLeft=srcScroller.scrollLeft;copyScroller.addEventListener('scroll',function(){srcScroller.scrollLeft=copyScroller.scrollLeft;},{passive:true});}
  MR32.layoutDirty=true;MR32.metrics=null;
}
function mr32SyncButtons(){
  if(!MR32.source||!MR32.clone)return;
  var a=MR32.source.querySelectorAll('button'),b=MR32.clone.querySelectorAll('button');
  /* C442 (L4, audit A38) : contenu de la barre d'origine changé (onglets, libellés ; comparé à l'instantané pris à la construction, pas à la copie que d'autres scripts réécrivent) : la copie est refaite ; sinon seul l'état est recopié (classe, aria, hidden). */
  if(a.length!==b.length||MR32.source.textContent!==MR32.sourceText){mr32Build(MR32.source);return false;}
  for(var i=0;i<a.length;i++){
    if(b[i].className!==a[i].className)b[i].className=a[i].className;b[i].disabled=a[i].disabled;
    ['aria-current','aria-selected','aria-expanded','aria-pressed','title','hidden'].forEach(function(n){var v=a[i].getAttribute(n);if(v==null)b[i].removeAttribute(n);else b[i].setAttribute(n,v);});
  }
  return true;
}
function mr32Measure(){
  MR32.raf=0;if(MR32.busy)return;MR32.busy=true;
  try{
    /* Desktop keeps the source rail sticky; a fixed clone jumps on subpage changes. */
    if(window.innerWidth>=768){mr32Restore();return;}
    if(MR32.layoutDirty){
      var source=mr32Source();
      if(!source||mr32Blocked()){mr32Restore();return;}
      if(source!==MR32.source)mr32Build(source);
      if(!MR32.anchor||!MR32.anchor.isConnected){mr32Restore();return;}
      var view=source.closest('.view');if(!view){mr32Restore();return;}
      var top=mr32Top(),y=window.scrollY||window.pageYOffset||0;
      var ar=MR32.anchor.getBoundingClientRect(),sr=source.getBoundingClientRect(),vr=view.getBoundingClientRect();
      var left=Math.max(0,Math.round(sr.left)),right=Math.min(window.innerWidth,Math.round(sr.right));
      MR32.metrics={top:top,anchorY:ar.top+y,viewBottomY:vr.bottom+y,height:Math.max(44,sr.height),left:left,width:Math.max(1,right-left)};
      MR32.dock.style.top=top+'px';MR32.dock.style.left=left+'px';MR32.dock.style.width=MR32.metrics.width+'px';
      MR32.layoutDirty=false;
      if(mr32SyncButtons()===false){mr32Schedule(true);return;}
    }
    if(!MR32.metrics||!MR32.source||!MR32.source.isConnected){mr32Restore();return;}
    var scrollY=window.scrollY||window.pageYOffset||0,m=MR32.metrics;
    var docked=m.anchorY-scrollY<=m.top+.5&&m.viewBottomY-scrollY>m.top+m.height+8;
    if(!docked){
      if(MR32.docked){
        MR32.source.classList.remove('v32-rail-source-docked');
        if(MR32.sourceAria==null)MR32.source.removeAttribute('aria-hidden');else MR32.source.setAttribute('aria-hidden',MR32.sourceAria);
        MR32.dock.classList.remove('on');MR32.docked=false;
      }
      return;
    }
    if(!MR32.docked){MR32.source.classList.add('v32-rail-source-docked');MR32.source.setAttribute('aria-hidden','true');MR32.dock.classList.add('on');MR32.docked=true;}
  }finally{MR32.busy=false;}
}
/* Pendant le geste, aucun style calculé ni rectangle DOM n'est relu : la
   position absolue mesurée au dernier changement de vue suffit. */
function mr32Schedule(layout){if(layout!==false)MR32.layoutDirty=true;if(MR32.raf)return;MR32.raf=requestAnimationFrame(mr32Measure);}
function mr32StableClassList(value){
  return String(value||'').split(/\s+/).filter(function(name){return name&&name!=='verdict-action-pressed'&&name!=='entry-choice-pressed';}).sort().join(' ');
}
function mr32MutationRelevant(record){
  if(!record)return false;
  if(MR32.dock&&(record.target===MR32.dock||MR32.dock.contains(record.target)))return false;
  /* Le retour visuel sous le doigt ajoute puis retire une classe transitoire.
     Il ne modifie ni la vue ni le rail et ne doit déclencher aucune mesure de
     géométrie. */
  if(record.type==='attributes'&&record.attributeName==='class'){
    var current=record.target&&record.target.getAttribute?record.target.getAttribute('class'):'';
    if(mr32StableClassList(record.oldValue)===mr32StableClassList(current))return false;
  }
  return true;
}

window.addEventListener('scroll',function(){mr32Schedule(false);},{passive:true});
window.addEventListener('resize',function(){mr32Schedule(true);},{passive:true});
window.addEventListener('orientationchange',function(){mr32Schedule(true);},{passive:true});
window.addEventListener('load',function(){mr32Schedule(true);},{once:true});
document.addEventListener('visibilitychange',function(){mr32Schedule(true);});
if(window.visualViewport){visualViewport.addEventListener('resize',function(){mr32Schedule(true);},{passive:true});visualViewport.addEventListener('scroll',function(){mr32Schedule(false);},{passive:true});}
try{new MutationObserver(function(records){
  for(var i=0;i<records.length;i++){
    if(mr32MutationRelevant(records[i])){mr32Schedule(true);break;}
  }
}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeOldValue:true,attributeFilter:['class','aria-selected','aria-current']});}catch(e){}
window.verdictModuleRailRefresh=mr32Schedule;
mr32Schedule(true);
})();

