
/* Verdict R10 — réponse tactile immédiate et mesure locale des interactions.
   Cette couche ne modifie ni les données, ni les calculs, ni les droits. */
(function verdictInteractionPolishR10(global){
  "use strict";
  if(global.__VERDICT_INTERACTION_POLISH_R10__)return;
  global.__VERDICT_INTERACTION_POLISH_R10__=true;

  var doc=global.document;
  var style=doc.createElement("style");
  style.id="verdict-interaction-polish-r10-style";
  style.textContent='\
button,a[href],[role="button"],summary,label[for],[onclick]{touch-action:manipulation;-webkit-tap-highlight-color:transparent}\
button.verdict-action-pressed,a[href].verdict-action-pressed,[role="button"].verdict-action-pressed,summary.verdict-action-pressed,[onclick].verdict-action-pressed{filter:brightness(1.16);opacity:.94}\
html.verdict-runtime-hidden *,html.verdict-runtime-hidden *::before,html.verdict-runtime-hidden *::after{animation-play-state:paused!important}\
#refSh [data-entry-door]{position:relative;transform:translateZ(0);transition:border-color .16s ease,box-shadow .18s ease,transform .16s ease,opacity .18s ease}\
#refSh [data-entry-door].entry-choice-pressed{transform:scale(.985)}\
#refSh [data-entry-door].entry-choice-selected{padding-right:54px!important;border-color:#42df87!important;color:#8af0b3!important;background:linear-gradient(155deg,rgba(20,66,46,.98),rgba(15,39,31,.98))!important;box-shadow:0 0 0 2px rgba(66,223,135,.2),0 0 26px rgba(34,197,94,.22);animation:entryChoiceConfirmed .62s cubic-bezier(.2,.8,.2,1)}\
#refSh [data-entry-door].entry-choice-selected>span{color:#d2e9dc}\
#refSh.entry-choice-pending [data-entry-door]:not(.entry-choice-selected){opacity:.38;filter:saturate(.35)}\
#refSh .ch .entry-choice-check{position:absolute;top:16px;right:15px;display:grid;place-items:center;width:25px;height:25px;margin:0;border-radius:50%;background:#4ade80;color:#06130d;font-size:17px;font-weight:900;line-height:1;box-shadow:0 0 18px rgba(74,222,128,.26)}\
#refSh .ch .entry-choice-confirmation{display:block;margin-top:8px;color:#8af0b3;font-size:12px;font-weight:800;line-height:1.4}\
#refSh .ch .entry-choice-confirmation.is-error{color:#fcd34d}\
@keyframes entryChoiceConfirmed{0%{transform:scale(.985)}45%{transform:scale(1.012)}100%{transform:scale(1)}}\
html.chr-cockpit #v-pil.view.on{padding-top:6px}\
@media(max-width:600px){html.chr-cockpit #v-pil.view.on{padding-top:4px}}\
@media(prefers-reduced-motion:reduce){#refSh [data-entry-door]{transition:none!important;animation:none!important;transform:none!important}}';
  doc.head.appendChild(style);

  var pending=false,pressed=null,touchStart=null,cancelChoice=null;
  var choiceText={
    fr:['Choix confirmé · Ouverture…','Ouverture impossible. Réessayez.'],
    en:['Choice confirmed · Opening…','Unable to open. Please try again.'],
    es:['Elección confirmada · Abriendo…','No se puede abrir. Inténtelo de nuevo.'],
    it:['Scelta confermata · Apertura…','Impossibile aprire. Riprova.'],
    de:['Auswahl bestätigt · Wird geöffnet…','Öffnen nicht möglich. Bitte erneut versuchen.'],
    nl:['Keuze bevestigd · Wordt geopend…','Openen is niet gelukt. Probeer opnieuw.'],
    pt:['Escolha confirmada · A abrir…','Não foi possível abrir. Tente novamente.']
  };
  function confirmationText(failed){
    var lang=String(global.LOCALE||doc.documentElement.lang||'fr').split('-')[0];
    return (choiceText[lang]||choiceText.fr)[failed?1:0];
  }
  function cancelPendingChoice(){if(cancelChoice)cancelChoice();}
  function actionable(target){
    if(!target||!target.closest)return null;
    var node=target.closest('button,a[href],[role="button"],summary,label[for],[onclick]');
    if(!node||node.disabled||node.getAttribute('aria-disabled')==='true')return null;
    return node;
  }
  function choiceButton(target){return target&&target.closest?target.closest('#refSh [data-entry-door]'):null;}
  function press(node){
    if(pressed&&pressed!==node)pressed.classList.remove('verdict-action-pressed','entry-choice-pressed');
    pressed=node;
    if(node)node.classList.add('verdict-action-pressed');
  }
  function release(){
    if(pressed)pressed.classList.remove('verdict-action-pressed','entry-choice-pressed');
    pressed=null;
  }
  function begin(event){
    var node=actionable(event.target);press(node);
    var choice=choiceButton(event.target);if(choice&&!pending)choice.classList.add('entry-choice-pressed');
  }
  function end(event){
    release();
    var choice=choiceButton(event&&event.target);if(choice)choice.classList.remove('entry-choice-pressed');
  }

  if('PointerEvent' in global){
    doc.addEventListener('pointerdown',begin,true);
    doc.addEventListener('pointerup',end,true);
    doc.addEventListener('pointercancel',end,true);
  }else{
    /* Très anciens aperçus iOS : déclenchement au relâchement, sans ancien
       minuteur de 320 ms et sans produire ensuite un second clic natif. */
    doc.addEventListener('touchstart',function(event){
      var touch=event.touches&&event.touches[0];
      touchStart=touch?{x:touch.clientX,y:touch.clientY,node:actionable(event.target)}:null;
      begin(event);
    },{passive:true,capture:true});
    doc.addEventListener('touchmove',function(event){
      var touch=event.touches&&event.touches[0];
      if(touchStart&&touch&&(Math.abs(touch.clientX-touchStart.x)>10||Math.abs(touch.clientY-touchStart.y)>10)){touchStart=null;release();}
    },{passive:true,capture:true});
    doc.addEventListener('touchcancel',function(){touchStart=null;release();},true);
    doc.addEventListener('touchend',function(event){
      var node=touchStart&&touchStart.node;touchStart=null;end(event);
      if(!node||/^(INPUT|SELECT|TEXTAREA)$/.test(node.tagName))return;
      event.preventDefault();try{node.click();}catch(error){}
    },{passive:false,capture:true});
  }
  doc.addEventListener('mouseup',release,true);
  global.addEventListener('blur',release,{passive:true});
  var moduleHidden=false,motionResumeQueued=false;
  function resumeDecorativeMotion(){
    if(motionResumeQueued)return;
    motionResumeQueued=true;
    (global.requestAnimationFrame||function(fn){return global.setTimeout(fn,16);})(function(){
      motionResumeQueued=false;if(doc.hidden||moduleHidden)return;
      var reduced=global.matchMedia&&global.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(!reduced)doc.querySelectorAll('.scorb,.ring .orbit').forEach(function(node){
        if(typeof node.getAnimations!=='function')return;
        node.getAnimations().forEach(function(animation){
          if(animation.animationName!=='scspin'&&animation.animationName!=='vl-orbit')return;
          /* Reconnecter la chronologie native après une iframe masquée,
             en conservant sa phase ; aucun recalcul ni redessin du score. */
          try{var phase=animation.currentTime;animation.pause();if(typeof phase==='number')animation.currentTime=phase;animation.play();}catch(e){}
        });
      });
      if(global.VeraLife&&typeof global.VeraLife.resume==='function')global.VeraLife.resume();
    });
  }
  function syncVisibility(){
    var hidden=!!(doc.hidden||moduleHidden);
    doc.documentElement.classList.toggle('verdict-runtime-hidden',hidden);
    if(hidden){
      release();cancelPendingChoice();
      if(global.VeraLife&&typeof global.VeraLife.pause==='function')global.VeraLife.pause();
    }else resumeDecorativeMotion();
  }
  global.addEventListener('message',function(event){
    if(global.parent===global||event.source!==global.parent||!event.data)return;
    if((global.location.origin!=="null"&&global.location.protocol!=='file:')&&event.origin!==global.location.origin)return;
    var type=event.data.type;
    if(type!=='verdict-unified-module-hidden'&&type!=='verdict-unified-module-visible')return;
    moduleHidden=type==='verdict-unified-module-hidden';syncVisibility();
  });
  doc.addEventListener('visibilitychange',syncVisibility,{passive:true});
  global.addEventListener('pagehide',function(){release();cancelPendingChoice();},{passive:true});
  syncVisibility();

  doc.addEventListener('click',function(event){
    var button=choiceButton(event.target);
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if(pending||button.disabled||button.getAttribute('aria-disabled')==='true')return;
    pending=true;
    var sheet=doc.getElementById('refSh');
    var buttons=sheet?sheet.querySelectorAll('[data-entry-door]'):[];
    for(var i=0;i<buttons.length;i+=1){
      buttons[i].classList.toggle('entry-choice-selected',buttons[i]===button);
      buttons[i].classList.remove('entry-choice-pressed');
      buttons[i].setAttribute('aria-pressed',buttons[i]===button?'true':'false');
      buttons[i].setAttribute('aria-disabled','true');
      var old=buttons[i].querySelectorAll('.entry-choice-check,.entry-choice-confirmation');
      for(var j=0;j<old.length;j+=1)old[j].remove();
    }
    release();
    var check=doc.createElement('span');check.className='entry-choice-check';check.setAttribute('aria-hidden','true');check.textContent='✓';button.appendChild(check);
    var note=doc.createElement('span');note.className='entry-choice-confirmation';note.setAttribute('role','status');note.setAttribute('aria-live','polite');note.setAttribute('aria-atomic','true');button.appendChild(note);
    note.textContent=confirmationText(false);
    if(sheet)sheet.classList.add('entry-choice-pending');
    var mode=button.getAttribute('data-entry-mode')||button.getAttribute('data-entry-door');
    var timer=null,done=false;
    var reset=function(){
      if(done)return;done=true;
      if(timer!==null)global.clearTimeout(timer);
      cancelChoice=null;
      pending=false;
      for(var k=0;k<buttons.length;k+=1){
        buttons[k].classList.remove('entry-choice-selected','entry-choice-pressed');
        buttons[k].setAttribute('aria-pressed','false');buttons[k].removeAttribute('aria-disabled');
      }
      check.remove();note.remove();
      if(sheet){sheet.classList.remove('entry-choice-pending');sheet.removeAttribute('aria-busy');}
    };
    cancelChoice=reset;
    var launch=function(){
      if(done)return;
      if(!sheet||!sheet.classList.contains('on')||!sheet.contains(button)){reset();return;}
      try{
        if(typeof global.choisirMode!=='function')throw new Error('Entry route unavailable');
        global.choisirMode(mode);
        reset();
      }catch(error){
        reset();note.classList.add('is-error');note.textContent=confirmationText(true);button.appendChild(note);
        try{button.focus({preventScroll:true});}catch(e){}
      }
    };
    /* Même temps lisible que le choix de langue. En mouvement réduit, la coche
       reste visible sans animation ; la destination et les données ne changent pas. */
    timer=global.setTimeout(launch,720);
  },true);

  /* Mesures locales, bornées et sans transmission : elles permettent de lire
     délai d'entrée, traitement et prochain rendu dans la console d'un mobile. */
  var samples=[],longTasks=[];
  function keep(list,value){list.push(value);if(list.length>30)list.shift();}
  try{
    if(global.PerformanceObserver){
      var supported=global.PerformanceObserver.supportedEntryTypes||[];
      if(supported.indexOf('event')>=0){
        new global.PerformanceObserver(function(list){
          list.getEntries().forEach(function(entry){
            if(!/^(click|pointerup|keydown)$/.test(entry.name))return;
            keep(samples,{name:entry.name,inputDelay:Math.max(0,entry.processingStart-entry.startTime),processing:Math.max(0,entry.processingEnd-entry.processingStart),nextPaint:Math.max(0,entry.duration),at:Date.now()});
          });
        }).observe({type:'event',buffered:true,durationThreshold:16});
      }
      if(supported.indexOf('longtask')>=0){
        new global.PerformanceObserver(function(list){list.getEntries().forEach(function(entry){keep(longTasks,{duration:entry.duration,startTime:entry.startTime,at:Date.now()});});}).observe({type:'longtask',buffered:true});
      }
    }
  }catch(error){}
  global.VerdictInteractionPerformance=Object.freeze({
    version:'1.2.0',
    snapshot:function(){return {interactions:samples.slice(),longTasks:longTasks.slice()};},
    clear:function(){samples.length=0;longTasks.length=0;}
  });
})(window);

