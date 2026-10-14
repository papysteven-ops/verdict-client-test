/* Verdict® — Comparer mes établissements (C35, 15/10/2026).
   Tous les dossiers du portefeuille côte à côte, sur les neuf repères que les gérants CHR comparent d'abord :
   score Verdict®, CA HT, ticket moyen, commandes par jour, ratio matière, masse salariale, prime cost, marge avant
   impôt, point mort. Aucune nouvelle formule : chaque colonne est le résultat du moteur exact (moteur()) pour ce
   dossier, exactement comme etabSnapshot(). Les garde-fous de comparabilité (nature des données, période) restent
   affichés : sans deux exercices clos, la lecture est indicative et aucun vainqueur n'est proclamé.
   Analyse et sources : 10-DOCUMENTATION/ANALYSE-COMPARAISON-ETABLISSEMENTS.md */
(function(root){
'use strict';
var doc=root.document;if(!doc)return;
var TXT={
  fr:{open:'Comparer',title:'Comparer mes établissements',kicker:'Lecture côte à côte',lead:'Les mêmes repères pour chaque dossier, calculés par le moteur Verdict®. La meilleure valeur de chaque ligne est marquée ; l’écart est donné par rapport à la médiane du groupe.',
      close:'Fermer',ind:'Indicateur',median:'médiane',best:'meilleur',na:'—',incomplete:'Données incomplètes',complete:'Compléter',
      indicative:'Lecture indicative : les dossiers ne sont pas tous des exercices clos comparables (voir la nature sous chaque colonne). Aucun vainqueur n’est proclamé.',
      conclusive:'Dossiers comparables : exercices clos, mêmes bases.',
      score:'Score Verdict®',ca:'CA HT annuel',caM:'CA HT mensuel',ticket:'Ticket moyen HT',cmd:'Commandes / jour',mat:'Ratio matière',ms:'Masse salariale chargée',prime:'Prime cost (matière + équipe)',marge:'Marge avant impôt',pm:'Point mort (part du CA)',
      vera:'Vera',veraSpread:'C’est {m} qui sépare le plus vos dossiers : {best} à {vb}, {worst} à {vw}. Levier à regarder en premier dans {worst}.',
      veraOne:'Il faut au moins deux dossiers calculables pour comparer.',need2:'Ajoutez un second établissement pour comparer.',
      better_low:'plus bas = mieux',better_high:'plus haut = mieux',neutral:'selon le concept'},
  en:{open:'Compare',title:'Compare my establishments',kicker:'Side by side',lead:'The same benchmarks for every file, computed by the Verdict® engine. The best value of each row is marked; the gap is given against the group median.',
      close:'Close',ind:'Indicator',median:'median',best:'best',na:'—',incomplete:'Incomplete data',complete:'Complete',
      indicative:'Indicative reading: not all files are comparable closed years (see the nature under each column). No winner is declared.',
      conclusive:'Comparable files: closed years, same bases.',
      score:'Verdict® score',ca:'Annual net sales',caM:'Monthly net sales',ticket:'Average ticket (net)',cmd:'Orders / day',mat:'Food cost ratio',ms:'Loaded labour cost',prime:'Prime cost (food + labour)',marge:'Margin before tax',pm:'Break-even (share of sales)',
      vera:'Vera',veraSpread:'{m} separates your files the most: {best} at {vb}, {worst} at {vw}. First lever to look at in {worst}.',
      veraOne:'At least two computable files are needed to compare.',need2:'Add a second establishment to compare.',
      better_low:'lower is better',better_high:'higher is better',neutral:'depends on the concept'}
};
function L(){var l=String(root.LOCALE||doc.documentElement.lang||'fr').slice(0,2);return TXT[l]||TXT.fr;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function num(n){n=Number(n);return isFinite(n)?n:null;}
function fEur(n){if(n==null)return L().na;try{return new Intl.NumberFormat(root.LOCALE==='en'?'en-GB':'fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);}catch(e){return Math.round(n)+' €';}}
function fEur2(n){if(n==null)return L().na;try{return new Intl.NumberFormat(root.LOCALE==='en'?'en-GB':'fr-FR',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}catch(e){return n.toFixed(2)+' €';}}
function fPct(n){if(n==null)return L().na;return (Math.round(n*10)/10).toLocaleString(root.LOCALE==='en'?'en-GB':'fr-FR')+' %';}
function fNum(n,d){if(n==null)return L().na;return (Math.round(n*Math.pow(10,d||0))/Math.pow(10,d||0)).toLocaleString(root.LOCALE==='en'?'en-GB':'fr-FR');}
function median(a){a=a.filter(function(x){return x!=null;}).sort(function(x,y){return x-y;});if(!a.length)return null;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}

/* Une photographie par dossier, par le moteur exact, sans toucher au dossier actif. */
function snapshot(id){
  var d=root.STORE&&root.STORE.etabs?root.STORE.etabs[id]:null;if(!d)return null;
  var prev=root.DB,R=null;try{root.DB=d;R=root.moteur();}catch(e){R=null;}root.DB=prev;
  var x=R&&R.d?R.d:{},v=R&&R.v?R.v:{},ca=num(x.ca)||0,calc=!!(R&&R.ready&&ca>0);
  var mat=calc&&ca>0?(num(x.mat)||0)/ca*100:null,ms=calc?num(v.ms):null;
  var identity=typeof root.verdictEtabIdentity==='function'?root.verdictEtabIdentity(d):{name:d.etab||'—',kind:''};
  var nature=typeof root.etabNature==='function'?root.etabNature(d):{key:'',label:'',period:''};
  var truth=null;try{truth=R&&R.ready&&typeof root.verdictScoreTruth==='function'?root.verdictScoreTruth(R,d):null;}catch(e){}
  var mois=num(x.mois)||12;
  return {id:id,name:String(identity.name||'—'),kind:String(identity.kind||''),nature:nature,calculated:calc,
    conclusive:!!(calc&&R.scoreFinalAllowed===true&&nature.key==='closed'),scoreFinal:!!(truth&&truth.final),
    zone:calc&&typeof root.zone==='function'?root.zone(R.score):null,
    missing:(R&&R.manquants||[]).length,
    k:{score:calc?Math.round(R.score):null,ca:calc?ca:null,caM:calc?ca/mois:null,ticket:calc?num(x.panierHT):null,cmd:calc?num(x.cmdj):null,
       mat:mat,ms:ms,prime:(mat!=null&&ms!=null)?mat+ms:null,marge:calc?num(v.rn):null,pm:calc?num(v.pm):null}};
}
var ROWS=[
  {key:'score',fmt:function(n){return n==null?L().na:fNum(n,0)+'/100';},better:'high',bar:function(n){return n;},max:100},
  {key:'ca',fmt:fEur,better:'high'},
  {key:'caM',fmt:fEur,better:'high'},
  {key:'ticket',fmt:fEur2,better:'neutral'},
  {key:'cmd',fmt:function(n){return fNum(n,1);},better:'high'},
  {key:'mat',fmt:fPct,better:'low',bar:function(n){return n;},max:60,driver:true},
  {key:'ms',fmt:fPct,better:'low',bar:function(n){return n;},max:60,driver:true},
  {key:'prime',fmt:fPct,better:'low',bar:function(n){return n;},max:100,driver:true},
  {key:'marge',fmt:fPct,better:'high',bar:function(n){return Math.max(0,n);},max:30},
  {key:'pm',fmt:fPct,better:'low',bar:function(n){return Math.min(n,200);},max:200}
];
function bestIndex(row,snaps){
  var vals=snaps.map(function(s){return s.k[row.key];}),best=-1;
  if(row.better==='neutral')return -1;
  vals.forEach(function(v,i){if(v==null)return;if(best<0)best=i;else if(row.better==='high'?v>vals[best]:v<vals[best])best=i;});
  return vals.filter(function(v){return v!=null;}).length>=2?best:-1;
}
function veraLine(snaps){
  var T=L(),calc=snaps.filter(function(s){return s.calculated;});
  if(calc.length<2)return T.veraOne;
  var best=null;
  ROWS.filter(function(r){return r.driver;}).forEach(function(r){
    var vals=calc.map(function(s){return s.k[r.key];}).filter(function(v){return v!=null;});if(vals.length<2)return;
    var spread=Math.max.apply(null,vals)-Math.min.apply(null,vals);
    if(!best||spread>best.spread)best={row:r,spread:spread};
  });
  if(!best)return T.veraOne;
  var r=best.row,sorted=calc.filter(function(s){return s.k[r.key]!=null;}).sort(function(a,b){return a.k[r.key]-b.k[r.key];});
  var lo=sorted[0],hi=sorted[sorted.length-1],bestS=r.better==='low'?lo:hi,worstS=r.better==='low'?hi:lo;
  return T.veraSpread.replace('{m}',T[r.key].toLowerCase()).replace('{best}',bestS.name).replace('{vb}',r.fmt(bestS.k[r.key])).replace(/\{worst\}/g,worstS.name).replace('{vw}',r.fmt(worstS.k[r.key]));
}
function ensureStyle(){
  if(doc.getElementById('cmp12-style'))return;
  var st=doc.createElement('style');st.id='cmp12-style';st.textContent=
  '#etabBar button.cmp12{font-weight:800;border-color:rgba(96,165,250,.55)!important;color:#93c5fd!important}'+
  '#mCompare .sheet{max-width:min(96vw,1040px)!important;width:min(96vw,1040px);max-height:min(94dvh,860px)!important;overflow:auto}'+
  '.cmp12-k{font-family:var(--mono);font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:#60a5fa;margin:0 0 4px}'+
  '#mCompare h3{margin:0 0 6px;font-size:19px}.cmp12-lead{font-size:13px;line-height:1.5;opacity:.78;margin:0 0 12px}'+
  '.cmp12-wrap{overflow:auto;-webkit-overflow-scrolling:touch;margin:0 -4px;padding:0 4px}'+
  '.cmp12-grid{display:grid;grid-template-columns:minmax(150px,1.3fr) repeat(var(--n),minmax(132px,1fr));gap:6px;min-width:max-content}'+
  '.cmp12-grid>div{padding:9px 10px;border-radius:10px;background:rgba(128,128,128,.08);border:1px solid rgba(128,128,128,.22);min-width:0;color:inherit}'+
  '.cmp12-head{background:transparent!important;border-color:transparent!important;padding-bottom:4px!important}'+
  '.cmp12-col{animation:cmp12In .5s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i)*80ms)}'+
  '.cmp12-col b{display:block;font-size:14px;line-height:1.2}.cmp12-col span{display:block;font-size:11px;opacity:.72;margin-top:3px;line-height:1.3}'+
  '.cmp12-col.actif{border-color:rgba(34,197,94,.55);box-shadow:0 0 0 1px rgba(34,197,94,.25) inset}'+
  '.cmp12-lab{font-size:12.5px;color:inherit}.cmp12-lab small{display:block;opacity:.72;font-size:10.5px;margin-top:2px}'+
  '.cmp12-val{font-family:var(--mono);font-size:14px;font-weight:800;display:flex;flex-direction:column;gap:5px}'+
  '.cmp12-val.best{border-color:rgba(34,197,94,.6)!important;background:rgba(34,197,94,.08)!important}'+
  '.cmp12-val.best:after{content:"\\2605 "attr(data-best);font:700 10px/1 var(--mono);color:#22c55e;letter-spacing:.06em}'+
  '.cmp12-val em{font-style:normal;font:600 10.5px/1.2 var(--mono);opacity:.72}'+
  '.cmp12-val.na{opacity:.6;font-weight:600}'+
  '.cmp12-bar{height:6px;border-radius:99px;background:rgba(127,127,127,.18);overflow:hidden}.cmp12-bar i{display:block;height:100%;width:0;border-radius:99px;background:#60a5fa;transition:width .6s cubic-bezier(.2,.7,.2,1)}'+
  '.cmp12-state{margin:12px 0 0;padding:10px 12px;border-radius:12px;border:1px solid rgba(234,179,8,.45);background:rgba(234,179,8,.08);font-size:12.5px;line-height:1.5}'+
  '.cmp12-state.ok{border-color:rgba(34,197,94,.45);background:rgba(34,197,94,.08)}'+
  '.cmp12-vera{display:flex;gap:10px;align-items:flex-start;margin:10px 0 0;padding:11px 12px;border-radius:12px;background:rgba(96,165,250,.08);border:1px solid rgba(96,165,250,.3);font-size:13px;line-height:1.5}'+
  '.cmp12-vera i{flex:none;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#60a5fa;color:#06121f;font:900 13px var(--mono);font-style:normal}'+
  '.cmp12-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}'+
  '@keyframes cmp12In{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}'+
  '@media(prefers-reduced-motion:reduce){.cmp12-col{animation:none}.cmp12-bar i{transition:none}}';
  doc.head.appendChild(st);
}
function close(){var m=doc.getElementById('mCompare');if(!m)return;try{root.a11yDialogRestore&&root.a11yDialogRestore(m);}catch(e){}if(m.parentNode)m.parentNode.removeChild(m);}
function open(){
  var T=L();ensureStyle();close();
  var ids=typeof root.etabList==='function'?root.etabList():[];
  var snaps=ids.map(snapshot).filter(Boolean);
  var h='<div class="sheet"><div class="grab"></div><div class="cmp12-k">'+esc(T.kicker)+'</div><h3>'+esc(T.title)+'</h3><p class="cmp12-lead">'+esc(T.lead)+'</p>';
  if(snaps.length<2){h+='<div class="cmp12-state">'+esc(T.need2)+'</div>';}
  else{
    var allConclusive=snaps.every(function(s){return s.conclusive;});
    h+='<div class="cmp12-wrap"><div class="cmp12-grid" style="--n:'+snaps.length+'">';
    h+='<div class="cmp12-head cmp12-lab"><small>'+esc(T.ind)+'</small></div>';
    snaps.forEach(function(s,i){
      h+='<div class="cmp12-head cmp12-col'+(s.id===root.STORE.actif?' actif':'')+'" style="--i:'+i+'"><b style="color:'+(s.zone?s.zone.h:'inherit')+'">'+esc(s.name)+'</b><span>'+esc([s.kind,s.nature.label,s.nature.period].filter(Boolean).join(' · '))+'</span>'+(s.calculated?'':'<span>'+esc(T.incomplete)+'</span>')+'</div>';
    });
    ROWS.forEach(function(r){
      var vals=snaps.map(function(s){return s.k[r.key];}),med=median(vals),best=bestIndex(r,snaps);
      h+='<div class="cmp12-lab">'+esc(T[r.key])+'<small>'+esc(r.better==='low'?T.better_low:r.better==='high'?T.better_high:T.neutral)+(med!=null?' · '+esc(T.median)+' '+esc(r.fmt(med)):'')+'</small></div>';
      snaps.forEach(function(s,i){
        var v=s.k[r.key];
        if(v==null){h+='<div class="cmp12-val na cmp12-col" style="--i:'+i+'">'+esc(T.na)+'</div>';return;}
        var delta=(med!=null&&r.key!=='score')?v-med:null,dTxt='';
        if(delta!=null&&Math.abs(delta)>0.0001){var sign=delta>0?'+':'−';dTxt=r.key==='ca'||r.key==='caM'||r.key==='ticket'?sign+(r.key==='ticket'?fEur2(Math.abs(delta)):fEur(Math.abs(delta))):sign+(r.key==='cmd'?fNum(Math.abs(delta),1):fPct(Math.abs(delta)).replace(' %',' pt'));}
        var bar=r.bar?'<div class="cmp12-bar"><i data-w="'+Math.max(0,Math.min(100,r.bar(v)/r.max*100)).toFixed(1)+'"></i></div>':'';
        h+='<div class="cmp12-val cmp12-col'+(i===best?' best':'')+'" style="--i:'+i+'" data-best="'+esc(T.best)+'">'+esc(r.fmt(v))+(dTxt?'<em>'+esc(dTxt)+' / '+esc(T.median)+'</em>':'')+bar+'</div>';
      });
    });
    h+='</div></div>';
    h+='<div class="cmp12-state'+(allConclusive?' ok':'')+'">'+esc(allConclusive?T.conclusive:T.indicative)+'</div>';
    h+='<div class="cmp12-vera"><i>V</i><div><b>'+esc(T.vera)+'</b> · '+esc(veraLine(snaps))+'</div></div>';
    var incomplete=snaps.filter(function(s){return !s.calculated;});
    if(incomplete.length){h+='<div class="cmp12-foot" style="justify-content:flex-start">'+incomplete.map(function(s){return '<button type="button" class="btn sec mini" onclick="verdictCompareComplete(\''+esc(s.id)+'\')">'+esc(T.complete)+' · '+esc(s.name)+'</button>';}).join('')+'</div>';}
  }
  h+='<div class="cmp12-foot"><button type="button" class="btn ghost" onclick="verdictCompareClose()">'+esc(T.close)+'</button></div></div>';
  var m=doc.createElement('div');m.className='modal on';m.id='mCompare';m.innerHTML=h;
  m.addEventListener('click',function(e){if(e.target===m)close();});
  doc.body.appendChild(m);
  try{root.a11yDialogPrepare&&root.a11yDialogPrepare(m);}catch(e){}
  /* Animation d'ouverture : les colonnes entrent en décalé, puis les barres se tracent jusqu'à leur valeur. */
  root.requestAnimationFrame(function(){root.setTimeout(function(){m.querySelectorAll('.cmp12-bar i').forEach(function(b){b.style.width=b.getAttribute('data-w')+'%';});},120+snaps.length*80);});
  return true;
}
function complete(id){close();try{if(typeof root.switchEtab==='function')root.switchEtab(id);if(typeof root.go==='function')root.go('in');}catch(e){}}
root.verdictCompareOpen=open;root.verdictCompareClose=close;root.verdictCompareComplete=complete;
/* Entrée visible : « Comparer » dans la barre d'établissements, dès deux dossiers. */
function decorateBar(){
  var bar=doc.getElementById('etabBar');if(!bar||!bar.classList.contains('on'))return;
  if(bar.querySelector('button.cmp12'))return;
  var gear=bar.querySelector('button.gear');var b=doc.createElement('button');b.type='button';b.className='cmp12';b.setAttribute('onclick','verdictCompareOpen()');b.title=L().title;b.textContent='⇄ '+L().open;
  if(gear)bar.insertBefore(b,gear);else bar.appendChild(b);
}
function hook(){
  if(typeof root.drawEtabs!=='function'||root.drawEtabs.__cmp12)return false;
  var orig=root.drawEtabs;var wrapped=function(){var r=orig.apply(this,arguments);try{decorateBar();}catch(e){}return r;};wrapped.__cmp12=true;root.drawEtabs=wrapped;
  try{decorateBar();}catch(e){}
  return true;
}
if(!hook()){var tries=0,iv=root.setInterval(function(){if(hook()||++tries>40)root.clearInterval(iv);},250);}
root.addEventListener('verdict:locale-changed',function(){var b=doc.querySelector('#etabBar button.cmp12');if(b){b.textContent='⇄ '+L().open;b.title=L().title;}});
})(window);
