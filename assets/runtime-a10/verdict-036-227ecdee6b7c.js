
(function(){
'use strict';

/* Verdict V43.31 — mise en scène visuelle de l'Audit.
   Le moteur V43.30 reste la source unique. Cette couche ne calcule aucun
   nouveau score et ne modifie aucune donnée : elle réduit la charge de lecture. */

var AV31_STEP=0;
var AV31_SPEAKING=false;

function av31Clamp(n,a,b){n=Number(n)||0;return Math.max(a,Math.min(b,n));}
function av31Esc(v){return typeof esc==='function'?esc(String(v==null?'':v)):String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function av31Eur(v){return typeof eur==='function'?eur(Number(v)||0):Math.round(Number(v)||0).toLocaleString('fr-FR')+' €';}
function av31Pct(v){return typeof pct==='function'?pct(Number(v)||0):(Number(v)||0).toLocaleString('fr-FR',{maximumFractionDigits:1})+' %';}
function av31Num(v,d){return (Number(v)||0).toLocaleString('fr-FR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0});}
/* C246 : repère du format (verdictRepereRN de 029 : bas, médiane, meilleurs) au lieu de 5 et 8 % fixes */
function av31Rep(){try{if(typeof verdictRepereRN==='function')return verdictRepereRN();}catch(e){}return {bas:2,repere:5,cible:9};}
function av31Color(rn){return rn<0?'#ef4444':(rn<av31Rep().repere?'#f97316':'#22c55e');}
function av31Tone(rn){return rn<0?'Structure déficitaire':(rn<av31Rep().bas?'Marge trop fragile':(rn<av31Rep().repere?'Rentable, encore fragile':'Marge solide'));}
function av31Sentence(R){var rn=R.v.rn;if(rn<0)return 'La structure perd de l’argent avec les postes saisis.';if(rn<av31Rep().bas)return 'Le résultat est positif, mais un choc peut l’effacer.';if(rn<av31Rep().repere)return 'La structure est rentable, sans marge de sécurité suffisante.';return 'La structure finance ses charges et conserve une marge de sécurité.';}
function av31Action(lim){
  if(lim==='pm'||lim==='sen')return 'Sécuriser la marge par ticket et les charges fixes avant de chercher plus de volume.';
  if(lim==='ms'||lim==='pc')return 'Rapprocher ventes et heures réellement travaillées, service par service.';
  if(lim==='fc')return 'Contrôler portions, prix d’achat et rendement réel sur une période commune.';
  if(lim==='com')return 'Comparer chaque canal après commission, emballage, remboursement et matière.';
  return 'Traiter le facteur limitant avant d’ajouter une nouvelle action.';
}
function av31MetricLabel(k){var m={fc:'Matière',ms:'Équipe',com:'Plateformes',rn:'Résultat',pm:'Chiffre minimum',sen:'Résistance',pc:'Cuisine + équipe'};return m[k]||k;}
function av31TopCosts(R){
  var v=R.v||{},ca=Math.max(1,Number(R.d&&R.d.ca)||1),a=[
    {k:'fc',l:'Achats nourriture',v:Number(v.fc)||0,c:'#f59e0b'},
    {k:'ms',l:'Équipe',v:Number(v.ms)||0,c:'#3b82f6'},
    {k:'com',l:'Plateformes',v:Number(v.com)||0,c:'#a855f7'},
    {k:'cf',l:'Charges fixes',v:Number(v.acf)||0, /* C205 : hors salaires, comme Structure (l’équipe a sa propre ligne) */c:'#64748b'}
  ];
  return a.filter(function(x){return x.v>0;}).sort(function(x,y){return y.v-x.v;}).slice(0,3);
}
function av31Impact(){
  try{return typeof auImpactPrioritaire==='function'?auImpactPrioritaire():null;}catch(e){return null;}
}
function av31Scenes(R){
  var P=typeof auditPremiumCalc==='function'?auditPremiumCalc(R):{},v=R.v||{},d=R.d||{},rn=Number(v.rn)||0,score=Math.round(Number(R.score)||0),col=av31Color(rn);
  var lim=typeof auFaible==='function'?auFaible(R):'rn',lib=(typeof AU_LIB==='object'&&AU_LIB[lim])||av31MetricLabel(lim),limScore=R.s&&isFinite(Number(R.s[lim]))?Math.round(Number(R.s[lim])):score;
  var costs=av31TopCosts(R),seuil=P.seuil||{},minimum=Number(seuil.eur)||0,current=Number(d.ca)||0,scale=Math.max(1,current,minimum),currentPos=av31Clamp(current/scale*100,0,100),minPos=av31Clamp(minimum/scale*100,0,100);
  var security=isFinite(Number(seuil.securiteEur))?Number(seuil.securiteEur):current-minimum;
  var _rr=av31Rep(),risk=rn<_rr.repere?Math.max(0,(_rr.repere-rn)/100*current):0,impact=av31Impact()||{},costBars=costs.map(function(x){return '<div class="av31-cost"><div><span>'+av31Esc(x.l)+'</span><b>'+av31Pct(x.v)+'</b></div><i><em style="--w:'+av31Clamp(x.v,0,100)+'%;--c:'+x.c+'"></em></i></div>';}).join('');
  if(!costBars)costBars='<p class="av31-empty">Les postes nécessaires ne sont pas encore renseignés.</p>';
  return [
    '<article class="av31-scene" data-av31-scene="0" aria-label="Situation actuelle"><div class="av31-k">1 · LA PHOTO</div><h2>'+av31Esc(av31Tone(rn))+'</h2><div class="av31-score" style="--score:'+score+';--accent:'+col+'"><div><strong data-av31-count="'+score+'">0</strong><span>/100</span></div></div><p>'+av31Esc(av31Sentence(R))+'</p><div class="av31-pills"><span>Résultat <b>'+av31Eur(d.res)+'</b></span><span>Marge <b>'+av31Pct(rn)+'</b></span></div></article>',
    '<article class="av31-scene" data-av31-scene="1" aria-label="Répartition de l’argent"><div class="av31-k">2 · OÙ PART L’ARGENT</div><h2>Les postes qui commandent la marge</h2><div class="av31-costs">'+costBars+'</div><p>Le premier poste mesuré est <b>'+av31Esc(costs[0]?costs[0].l:'indisponible')+'</b>. Verdict ne confond pas dépense élevée et anomalie.</p></article>',
    '<article class="av31-scene" data-av31-scene="2" aria-label="Chiffre minimum"><div class="av31-k">3 · LE SEUIL</div><h2>'+av31Esc(security>=0?'Vous avez franchi le chiffre minimum':'Le chiffre minimum reste à atteindre')+'</h2><div class="av31-gauge"><div class="av31-gauge-track"><i style="--current:'+currentPos+'%"></i><span class="av31-min" style="--minimum:'+minPos+'%"><b>minimum</b></span><span class="av31-now" style="--current:'+currentPos+'%"></span></div><div><span>'+av31Eur(minimum)+' minimum</span><b>'+av31Eur(current)+' réalisé</b></div></div><div class="av31-impact '+(security>=0?'good':'bad')+'"><span>'+(security>=0?'Marge de sécurité':'Écart à combler')+'</span><strong>'+(security>=0?'+':'−')+av31Eur(Math.abs(security))+'</strong></div></article>',
    '<article class="av31-scene" data-av31-scene="3" aria-label="Facteur limitant"><div class="av31-k">4 · LE FREIN</div><h2>'+av31Esc(lib.charAt(0).toUpperCase()+lib.slice(1))+'</h2><div class="av31-limit"><div class="av31-limit-score"><strong data-av31-count="'+limScore+'">0</strong><span>/100</span></div><div><span>Facteur limitant</span><p>'+av31Esc(av31Action(lim))+'</p></div></div>'+(risk?'<div class="av31-risk"><span>Écart au repère de votre format ('+String(_rr.repere).replace('.',',')+' %)</span><b>'+av31Eur(risk)+'</b></div>':'<div class="av31-risk good"><span>Résultat au-dessus du repère interne</span><b>'+av31Pct(rn)+'</b></div>')+'</article>',
    '<article class="av31-scene" data-av31-scene="4" aria-label="Décision prioritaire"><div class="av31-k">5 · LA DÉCISION</div><h2>'+av31Esc(impact.title||'Votre première action est prête')+'</h2><div class="av31-decision"><span>IMPACT OU SIGNAL</span><strong>'+av31Esc(impact.value||av31MetricLabel(lim))+'</strong><p>'+av31Esc(impact.explanation||av31Action(lim))+'</p></div><div class="av31-final-actions"><button type="button" class="av31-primary" onclick="av31OpenAction()">Voir l’action</button><button type="button" class="av31-secondary" onclick="av31OpenFull()">Voir les preuves</button></div></article>'
  ];
}
function av31Speech(R){
  var v=R.v||{},d=R.d||{},lim=typeof auFaible==='function'?auFaible(R):'rn',lib=(typeof AU_LIB==='object'&&AU_LIB[lim])||av31MetricLabel(lim),impact=av31Impact()||{};
  return 'Voici votre audit Verdict. Score '+Math.round(Number(R.score)||0)+' sur 100. '+av31Sentence(R)+' Le résultat calculé est de '+Math.round(Number(d.res)||0)+' euros, soit '+av31Num(v.rn,1)+' pour cent du chiffre d’affaires. Le facteur limitant est '+lib+'. '+av31Action(lim)+' Première décision : '+(impact.title||'ouvrir votre action prioritaire')+'.';
}
function av31Shell(R,count){
  var scenes=av31Scenes(R),name='Mon établissement';try{name=(DB&&DB.etab)||name;}catch(e){}
  return '<section class="av31" data-audit-visual-story aria-label="Audit visuel en cinq étapes"><div class="av31-head"><div><span>VERDICT VISUEL · '+av31Esc(name)+'</span><h1>Votre audit en 60 secondes</h1></div><button type="button" class="av31-listen" onclick="av31Speak()" data-av31-listen aria-label="Écouter le résumé de l’audit"><i aria-hidden="true">V</i><span>Vera me résume</span></button></div><div class="av31-progress" role="tablist" aria-label="Étapes de l’audit">'+scenes.map(function(_,i){return '<button type="button" role="tab" aria-selected="'+(i===0?'true':'false')+'" aria-label="Étape '+(i+1)+' sur 5" onclick="av31Go('+i+')"><i></i><span>'+(i+1)+'</span></button>';}).join('')+'</div><div class="av31-stage" aria-live="polite">'+scenes.join('')+'</div><div class="av31-nav"><button type="button" class="av31-back" onclick="av31Prev()" aria-label="Étape précédente">←</button><span><b data-av31-position>1 / 5</b><small>Balayez ou continuez</small></span><button type="button" class="av31-next" onclick="av31Next()">Continuer <b>→</b></button></div></section><details class="av31-full" data-audit-full-report><summary><span><b>Analyse complète</b><small>'+count+' chapitres · preuves, méthode et exports</small></span><i>Ouvrir</i></summary><div class="av31-full-body"></div></details>';
}
function av31AnimateNumber(el){
  var end=Number(el.getAttribute('data-av31-count'))||0;if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches){el.textContent=end;return;}
  var start=performance.now(),duration=950;function tick(now){var p=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-p,3);el.textContent=Math.round(end*ease);if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);
}
function av31Paint(){
  var root=document.querySelector('[data-audit-visual-story]');if(!root)return;var scenes=root.querySelectorAll('[data-av31-scene]'),tabs=root.querySelectorAll('[role="tab"]');
  AV31_STEP=av31Clamp(AV31_STEP,0,scenes.length-1);
  for(var i=0;i<scenes.length;i++){var on=i===AV31_STEP;scenes[i].classList.toggle('on',on);scenes[i].setAttribute('aria-hidden',on?'false':'true');tabs[i].classList.toggle('on',on);tabs[i].classList.toggle('past',i<AV31_STEP);tabs[i].setAttribute('aria-selected',on?'true':'false');}
  var pos=root.querySelector('[data-av31-position]');if(pos)pos.textContent=(AV31_STEP+1)+' / '+scenes.length;
  var back=root.querySelector('.av31-back');if(back)back.disabled=AV31_STEP===0;
  var next=root.querySelector('.av31-next');if(next)next.innerHTML=AV31_STEP===scenes.length-1?'Revoir <b>↺</b>':'Continuer <b>→</b>';
  var active=scenes[AV31_STEP];if(active){active.classList.remove('play');void active.offsetWidth;active.classList.add('play');var nums=active.querySelectorAll('[data-av31-count]');for(var j=0;j<nums.length;j++)av31AnimateNumber(nums[j]);}
}
function av31Go(i){AV31_STEP=av31Clamp(i,0,4);av31Paint();}
function av31Prev(){av31Go(AV31_STEP-1);}
function av31Next(){av31Go(AV31_STEP===4?0:AV31_STEP+1);}
/* La décision finale ouvre le sous-onglet Simuler, puisque le montant montré
   est un scénario mécanique. Le point d'arrivée est brièvement indiqué, sans
   relancer l'animation de simulation ni modifier un curseur. */
function av31OpenAction(){
  var opened=false;try{opened=typeof go==='function'&&go('dec')!==false;}catch(e){opened=false;}
  if(!opened)return false;
  function indicate(){
    var target=document.getElementById('decScene')||document.getElementById('decBestCard')||document.getElementById('decBody');
    if(!target)return;
    target.classList.remove('av31-action-target');void target.offsetWidth;target.classList.add('av31-action-target');
    if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
    try{target.focus({preventScroll:true});}catch(e){try{target.focus();}catch(_){} }
    try{target.scrollIntoView({behavior:window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'nearest'});}catch(e){}
    setTimeout(function(){if(target&&target.classList)target.classList.remove('av31-action-target');},1700);
  }
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){requestAnimationFrame(indicate);});else setTimeout(indicate,0);
  return true;
}
function av31OpenFull(){var d=document.querySelector('[data-audit-full-report]');if(!d)return;d.open=true;setTimeout(function(){d.scrollIntoView({behavior:window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});},30);}
function av31Speak(){
  if(!('speechSynthesis' in window))return;var b=document.querySelector('[data-av31-listen]');
  if(AV31_SPEAKING){speechSynthesis.cancel();AV31_SPEAKING=false;if(b)b.classList.remove('on');return;}
  var R=typeof moteur==='function'?moteur():null;if(!R||!R.ready)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(av31Speech(R));u.lang='fr-FR';u.rate=.92;u.pitch=1;
  u.onstart=function(){AV31_SPEAKING=true;if(b)b.classList.add('on');};u.onend=u.onerror=function(){AV31_SPEAKING=false;if(b)b.classList.remove('on');};speechSynthesis.speak(u);
}
function av31Bind(root){
  var x=0,y=0,t=0;root.addEventListener('touchstart',function(e){if(e.touches.length!==1)return;x=e.touches[0].clientX;y=e.touches[0].clientY;t=Date.now();},{passive:true});
  root.addEventListener('touchend',function(e){if(!e.changedTouches.length)return;var dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;if(Date.now()-t<650&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.35)av31Go(AV31_STEP+(dx<0?1:-1));},{passive:true});
  root.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();av31Next();}if(e.key==='ArrowLeft'){e.preventDefault();av31Go(AV31_STEP-1);}});
}
function av31Apply(){
  var el=document.getElementById('auditBody'),wrap=el&&el.querySelector('.au-wrap'),R=typeof moteur==='function'?moteur():null;if(!wrap||!R||!R.ready||wrap.querySelector('[data-audit-visual-story]'))return;
  if(typeof isPro==='function'&&!isPro())return;var old=Array.prototype.slice.call(wrap.children);if(old.length<3)return;
  var holder=document.createElement('div');holder.innerHTML=av31Shell(R,old.filter(function(x){return x.classList&&x.classList.contains('au-sc');}).length);var visual=holder.firstChild,full=holder.lastChild,body=full.querySelector('.av31-full-body');
  old.forEach(function(node){body.appendChild(node);if(node.classList)node.classList.add('vu');});wrap.appendChild(visual);wrap.appendChild(full);wrap.insertBefore(visual,wrap.firstChild);AV31_STEP=0;av31Bind(visual);av31Paint();
  if(!('speechSynthesis' in window)){var listen=visual.querySelector('[data-av31-listen]');if(listen)listen.hidden=true;}
}

var AV31_DRAW=window.drawAudit;
if(typeof AV31_DRAW==='function')window.drawAudit=function(){AV31_DRAW.apply(this,arguments);av31Apply();};
window.av31Go=av31Go;window.av31Prev=av31Prev;window.av31Next=av31Next;window.av31OpenAction=av31OpenAction;window.av31OpenFull=av31OpenFull;window.av31Speak=av31Speak;
window.addEventListener('load',function(){setTimeout(av31Apply,0);},{once:true});
})();

