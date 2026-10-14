
/* R38: presentation only. Reads R36 timeline and the existing performance colour function. */
(function(root){
  'use strict';
  var COPY={
    fr:{name:'Chiffre minimum',observed:'Couvert',estimated:'Estimation',below:'Sous le minimum',unknown:'À compléter',zero:'Sans minimum',comparison:'Couleur : {percent} du minimum en fin de mois selon la projection actuelle.',covered:'Le CA enregistré a atteint le minimum du mois.',gap:'Il manquerait {amount} en fin de mois selon la projection actuelle.',above:'CA au-delà du minimum',warning:'Le CA au-delà du minimum n’est pas intégralement un bénéfice.',progress:'{percent} du minimum enregistré',end:'Fin de mois estimée',unavailable:'Projection indisponible',graph:'CA cumulé : {actual} enregistré. Minimum : {minimum}. {conclusion}'},
    en:{name:'Minimum revenue',observed:'Covered',estimated:'Estimate',below:'Below minimum',unknown:'Complete the data',zero:'No minimum',comparison:'Colour: {percent} of the minimum at month end according to the current forecast.',covered:'Recorded revenue has reached this month’s minimum.',gap:'The current forecast shows a shortfall of {amount} at month end.',above:'Revenue above minimum',warning:'Revenue above the minimum is not entirely profit.',progress:'{percent} of the minimum recorded',end:'Estimated month end',unavailable:'Forecast unavailable',graph:'Cumulative revenue: {actual} recorded. Minimum: {minimum}. {conclusion}'},
    es:{name:'Ingresos mínimos',observed:'Cubierto',estimated:'Estimación',below:'Por debajo del mínimo',unknown:'Completar los datos',zero:'Sin mínimo',comparison:'Color: {percent} del mínimo al final del mes según la previsión actual.',covered:'Los ingresos registrados han alcanzado el mínimo del mes.',gap:'Según la previsión actual, faltarían {amount} al final del mes.',above:'Ingresos sobre el mínimo',warning:'Los ingresos sobre el mínimo no son íntegramente beneficio.',progress:'{percent} del mínimo registrado',end:'Final de mes estimado',unavailable:'Previsión no disponible',graph:'Ingresos acumulados: {actual} registrados. Mínimo: {minimum}. {conclusion}'},
    it:{name:'Ricavi minimi',observed:'Coperto',estimated:'Stima',below:'Sotto il minimo',unknown:'Completare i dati',zero:'Nessun minimo',comparison:'Colore: {percent} del minimo a fine mese secondo la previsione attuale.',covered:'I ricavi registrati hanno raggiunto il minimo del mese.',gap:'Secondo la previsione attuale, a fine mese mancherebbero {amount}.',above:'Ricavi oltre il minimo',warning:'I ricavi oltre il minimo non sono interamente un utile.',progress:'{percent} del minimo registrato',end:'Fine mese stimata',unavailable:'Previsione non disponibile',graph:'Ricavi cumulati: {actual} registrati. Minimo: {minimum}. {conclusion}'},
    de:{name:'Mindestumsatz',observed:'Gedeckt',estimated:'Schätzung',below:'Unter dem Mindestumsatz',unknown:'Daten ergänzen',zero:'Kein Mindestumsatz',comparison:'Farbe: Laut aktueller Prognose werden zum Monatsende {percent} des Mindestumsatzes erreicht.',covered:'Der erfasste Umsatz hat den Mindestumsatz des Monats erreicht.',gap:'Laut aktueller Prognose würden am Monatsende {amount} fehlen.',above:'Umsatz über dem Mindestumsatz',warning:'Der Umsatz über dem Mindestumsatz ist nicht vollständig Gewinn.',progress:'{percent} des Mindestumsatzes erfasst',end:'Geschätztes Monatsende',unavailable:'Keine Prognose verfügbar',graph:'Kumulierter Umsatz: {actual} erfasst. Mindestumsatz: {minimum}. {conclusion}'},
    nl:{name:'Minimumomzet',observed:'Gedekt',estimated:'Schatting',below:'Onder het minimum',unknown:'Gegevens aanvullen',zero:'Geen minimum',comparison:'Kleur: volgens de huidige prognose wordt aan het einde van de maand {percent} van het minimum bereikt.',covered:'De geregistreerde omzet heeft het maandminimum bereikt.',gap:'Volgens de huidige prognose zou aan het einde van de maand {amount} ontbreken.',above:'Omzet boven het minimum',warning:'Omzet boven het minimum is niet volledig winst.',progress:'{percent} van het minimum geregistreerd',end:'Geschat maandeinde',unavailable:'Geen prognose beschikbaar',graph:'Cumulatieve omzet: {actual} geregistreerd. Minimum: {minimum}. {conclusion}'},
    pt:{name:'Receita mínima',observed:'Coberto',estimated:'Estimativa',below:'Abaixo do mínimo',unknown:'Completar os dados',zero:'Sem mínimo',comparison:'Cor: {percent} do mínimo no final do mês segundo a previsão atual.',covered:'A receita registada atingiu o mínimo do mês.',gap:'Segundo a previsão atual, faltariam {amount} no final do mês.',above:'Receita acima do mínimo',warning:'A receita acima do mínimo não é integralmente lucro.',progress:'{percent} do mínimo registado',end:'Final do mês estimado',unavailable:'Previsão indisponível',graph:'Receita acumulada: {actual} registados. Mínimo: {minimum}. {conclusion}'}
  };
  function valid(n){return typeof n==='number'&&Number.isFinite(n);}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function tpl(s,v){return s.replace(/\{(\w+)\}/g,function(_,k){return v[k];});}
  function enabled(){
    if(root.VERDICT_MINIMUM_CURVE_R38===true)return true;
    try{return new URLSearchParams(root.location.search+(self.__vdq||"")).get('minimumCurve')==='r38'||root.parent!==root&&new URLSearchParams(root.parent.location.search+(self.__vdq||"")).get('minimumCurve')==='r38';}catch(_){return false;}
  }
  function model(t,m,statusFor){
    var usable=!!t&&valid(t.minimum)&&t.minimum>0&&t.status!=='unknown',projection=m&&valid(m.projection)?m.projection:null;
    var zone='neutral';
    if(usable)zone=t.status==='observed'?statusFor(t.actual,t.minimum):projection===null?'neutral':statusFor(projection,t.minimum);
    if(['green','yellow','orange','red','neutral'].indexOf(zone)<0)zone='neutral';
    return {zone:zone,usable:usable,projection:usable?projection:null,points:usable?t.points.filter(function(p){return valid(p.value)&&/^\d{4}-\d{2}-\d{2}$/.test(p.date);}):[],shortfall:usable&&projection!==null?Math.max(0,t.minimum-projection):null};
  }
  function graph(t,m,display){
    if(!display.usable||!display.points.length)return '';
    var n=m.days.length,W=640,H=240,L=8,R=632,T=18,B=226;
    var pts=display.points,max=Math.max(t.minimum*1.15,1);
    pts.forEach(function(p){max=Math.max(max,p.value*1.08);});
    function x(day){return L+(R-L)*day/n;}function y(v){return B-(B-T)*v/max;}
    function xy(p){return x(Number(p.date.slice(8))).toFixed(2)+' '+y(p.value).toFixed(2);}
    var actual=pts.filter(function(p){return !p.estimated;}),forecast=pts.filter(function(p){return p.estimated;}),minimumY=y(t.minimum),s='';
    function path(a,start){return (start||'')+a.map(function(p,i){return (i||start?' L':'M')+xy(p);}).join('');}
    var aPath=path(actual,'M'+L+' '+B),last=actual[actual.length-1];
    var fPath=forecast.length?path(forecast,last?'M'+xy(last):'M'+L+' '+B):'';
    // Areas above the threshold show excess revenue, never labelled profit.
    function area(a,estimated){
      var chain=estimated?(last?[last]:[]).concat(a):[{date:m.key+'-00',value:0}].concat(a),out='',prev=null;
      chain.forEach(function(p){if(prev&&prev.value<t.minimum&&p.value>=t.minimum){var d0=Number(prev.date.slice(8)),d1=Number(p.date.slice(8));out='M'+x(d0+(d1-d0)*(t.minimum-prev.value)/(p.value-prev.value)).toFixed(2)+' '+minimumY.toFixed(2);}
        if(p.value>=t.minimum){if(!out)out='M'+x(Number(p.date.slice(8))).toFixed(2)+' '+minimumY.toFixed(2);out+=' L'+xy(p);}prev=p;});
      return out&&prev?'<path d="'+out+' L'+x(Number(prev.date.slice(8))).toFixed(2)+' '+minimumY.toFixed(2)+' Z" fill="'+(estimated?'url(#v38-hatch)':'currentColor')+'" opacity=".22"/>':'';
    }
    s+='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><pattern id="v38-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V7" stroke="currentColor" stroke-width="3"/></pattern></defs>';
    s+='<path d="'+aPath+' L'+(last?x(Number(last.date.slice(8))):L)+' '+B+' Z" fill="currentColor" opacity=".06"/>';
    s+=area(actual,false)+area(forecast,true);
    s+='<path d="M'+L+' '+minimumY+'H'+R+'" stroke="#a2aebd" stroke-dasharray="4 5" fill="none" vector-effect="non-scaling-stroke"/>';
    s+='<path d="'+aPath+'" class="v38-actual"/>'+(fPath?'<path d="'+fPath+'" class="v38-forecast"/>':'');
    if(last)s+='<circle cx="'+x(Number(last.date.slice(8)))+'" cy="'+y(last.value)+'" r="4" fill="currentColor"/>';
    if(t.date){var index=pts.findIndex(function(p){return p.date===t.date;}),cross=pts[index],prev=pts[index-1]||{date:m.key+'-00',value:0};if(cross){var day0=Number(prev.date.slice(8)),day1=Number(cross.date.slice(8)),fraction=cross.value>prev.value?(t.minimum-prev.value)/(cross.value-prev.value):1;s+='<circle cx="'+x(day0+(day1-day0)*fraction)+'" cy="'+minimumY+'" r="6" fill="currentColor" stroke="#0c1423" stroke-width="2"/>';}}
    return s+'</svg>';
  }
  function enhance(card,options){
    var t=options.timeline,m=options.month,w=options.words,lang=COPY[options.locale]?options.locale:'fr',c=COPY[lang];
    var cf=new Intl.NumberFormat(lang,{style:'currency',currency:'EUR',maximumFractionDigits:0}),pf=new Intl.NumberFormat(lang,{style:'percent',maximumFractionDigits:0});
    function money(v){return valid(v)?cf.format(v):'—';}function pct(v){return valid(v)?pf.format(v):'—';}
    var d=model(t,m,options.statusFor),date=t.date?new Intl.DateTimeFormat(lang,{day:'numeric',month:'long',year:'numeric'}).format(new Date(t.date+'T12:00:00')):null;
    var title=t.status==='observed'?tpl(w[3],{date:date}):t.status==='estimated'?tpl(w[4],{date:date}):t.status==='beyond'?w[6]:t.status==='zero'?w[7]:w[5];
    var label=t.status==='observed'?c.observed:t.status==='estimated'?c.estimated:t.status==='beyond'?c.below:t.status==='zero'?c.zero:c.unknown;
    var conclusion=t.status==='observed'?c.covered:d.shortfall>0?tpl(c.gap,{amount:money(d.shortfall)}):d.projection!==null?tpl(c.comparison,{percent:pct(d.projection/t.minimum)}):w[14];
    var detail=card.querySelector('.v36-pm-method'),buttons=card.querySelector('.v36-pm-buttons');
    var actualKnown=!!m&&m.days.some(function(day){return day.ca!==null&&day.ca!==undefined&&Number.isFinite(Number(day.ca));});
    var above=valid(t.minimum)&&t.actual>t.minimum,metrics=[[w[8],t.minimum],[w[9],actualKnown?t.actual:null],[above?c.above:w[10],actualKnown?(above?t.actual-t.minimum:t.remaining):null]];
    var svg=m?graph(t,m,d):'';
    card.classList.add('v38-minimum');card.setAttribute('data-zone',d.zone);
    card.innerHTML='<div class="v38-heading"><span class="v36-pm-kicker">'+esc(c.name)+' · '+esc(w[2])+'</span><span class="v38-pill">'+esc(label)+'</span></div><h2>'+esc(w[1])+'</h2><p class="v38-answer">'+esc(title)+'</p><p class="v38-conclusion">'+esc(conclusion)+'</p><div class="v38-grid"><div class="v38-plot"><div class="v38-chart-label"><span>'+esc(w[8])+'</span><b>'+esc(money(t.minimum))+'</b></div><div class="v38-chart" role="img" aria-label="'+esc(tpl(c.graph,{actual:money(actualKnown?t.actual:null),minimum:money(t.minimum),conclusion:title}))+'">'+(svg||'<p>'+esc(c.unavailable)+'</p>')+'</div>'+(svg?'<div class="v38-axis"><span>'+esc(w[32])+'</span><span>'+esc(w[33])+'</span></div><div class="v38-legend"><span><i></i>'+esc(w[11])+'</span>'+(d.points.some(function(p){return p.estimated;})?'<span><i class="dashed"></i>'+esc(w[12])+'</span>':'')+'</div>':'')+'</div><div><dl class="v38-metrics">'+metrics.map(function(row){return '<div><dt>'+esc(row[0])+'</dt><dd>'+esc(money(row[1]))+'</dd></div>';}).join('')+'</dl>'+(d.usable?'<div class="v38-progress" aria-hidden="true"><span style="transform:scaleX('+Math.max(0,Math.min(1,t.actual/t.minimum))+')"></span></div><p class="v38-progress-label">'+esc(tpl(c.progress,{percent:pct(t.actual/t.minimum)}))+'</p>':'')+'<p class="v38-end">'+esc(c.end)+'<b>'+esc(money(d.projection))+'</b></p></div></div><p class="v38-limit">'+esc(w[15])+'</p>'+(above?'<p class="v38-limit">'+esc(c.warning)+'</p>':'')+(detail?detail.outerHTML:'')+(buttons?buttons.outerHTML:'');
  }
  root.VerdictMinimumCurveR38={enabled:enabled,model:model,graph:graph,enhance:enhance,copy:COPY};
})(typeof window!=='undefined'?window:globalThis);

