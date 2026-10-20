
/* V2-A7 · Les repères du jour : prévision, minimum qui couvre toutes les charges, chiffre pour l'objectif de résultat.
   Même unité que la saisie du jour (TTC). Minimum = cible du jour du moteur (saisonnalité, jours d'ouverture).
   Objectif = minimum × (charges fixes + amortissements + objectif de résultat) ÷ (charges fixes + amortissements).
   Prévision = moyenne simple des 8 derniers mêmes jours saisis (au moins 3), jamais inventée. Absent ≠ zéro. */
(function(root){
 var T={
 fr:{k:'Les repères d’aujourd’hui',fc:'Prévision · moyenne de vos {n} derniers {j}s',fcNo:'Prévision : pas assez de {j}s saisis (il en faut 3)',min:'Coût de la journée (toutes vos charges)',obj:'Pour votre objectif de résultat ({o} par an, avant impôt)',objNo:'Objectif de résultat non saisi',objBtn:'Saisir mon objectif',ok:'La prévision dépasse {c} de {v}.',ko:'Il manque {v} à la prévision pour atteindre {c}.',cObj:'votre objectif',cMin:'le minimum',note:'Montants TTC, comme la saisie du jour. La prévision est une moyenne, pas une promesse.',minNo:'Minimum du jour non calculable : complétez vos charges et votre calendrier.'},
 en:{k:'Today’s benchmarks',fc:'Forecast · average of your last {n} {j}s',fcNo:'Forecast: not enough {j}s entered (3 needed)',min:'Minimum that covers all your costs',obj:'For your profit target ({o} a year, before tax)',objNo:'Profit target not entered',objBtn:'Enter my target',ok:'The forecast beats {c} by {v}.',ko:'The forecast is {v} short of {c}.',cObj:'your target',cMin:'the minimum',note:'Amounts incl. VAT, like the day entry. The forecast is an average, not a promise.',minNo:'Today’s minimum cannot be calculated: complete your costs and calendar.'},
 es:{k:'Las referencias de hoy',fc:'Previsión · media de sus {n} últimos {j}',fcNo:'Previsión: no hay suficientes {j} introducidos (se necesitan 3)',min:'Mínimo que cubre todos sus costes',obj:'Para su objetivo de resultado ({o} al año, antes de impuestos)',objNo:'Objetivo de resultado no introducido',objBtn:'Introducir mi objetivo',ok:'La previsión supera {c} en {v}.',ko:'A la previsión le faltan {v} para alcanzar {c}.',cObj:'su objetivo',cMin:'el mínimo',note:'Importes con IVA, como la entrada del día. La previsión es una media, no una promesa.',minNo:'Mínimo del día no calculable: complete sus costes y su calendario.'},
 it:{k:'I riferimenti di oggi',fc:'Previsione · media degli ultimi {n} {j}',fcNo:'Previsione: non abbastanza {j} inseriti (ne servono 3)',min:'Minimo che copre tutti i costi',obj:'Per il tuo obiettivo di risultato ({o} all’anno, prima delle imposte)',objNo:'Obiettivo di risultato non inserito',objBtn:'Inserisci il mio obiettivo',ok:'La previsione supera {c} di {v}.',ko:'Alla previsione mancano {v} per raggiungere {c}.',cObj:'il tuo obiettivo',cMin:'il minimo',note:'Importi IVA inclusa, come l’inserimento del giorno. La previsione è una media, non una promessa.',minNo:'Minimo del giorno non calcolabile: completa costi e calendario.'},
 de:{k:'Die Richtwerte von heute',fc:'Prognose · Durchschnitt Ihrer letzten {n} {j}e',fcNo:'Prognose: zu wenige {j}e erfasst (3 nötig)',min:'Minimum, das alle Kosten deckt',obj:'Für Ihr Ergebnisziel ({o} pro Jahr, vor Steuern)',objNo:'Ergebnisziel nicht erfasst',objBtn:'Mein Ziel erfassen',ok:'Die Prognose übertrifft {c} um {v}.',ko:'Der Prognose fehlen {v} bis {c}.',cObj:'Ihr Ziel',cMin:'das Minimum',note:'Beträge brutto, wie die Tageseingabe. Die Prognose ist ein Durchschnitt, kein Versprechen.',minNo:'Tagesminimum nicht berechenbar: Kosten und Kalender ergänzen.'},
 nl:{k:'De richtpunten van vandaag',fc:'Prognose · gemiddelde van uw laatste {n} {j}en',fcNo:'Prognose: te weinig {j}en ingevoerd (3 nodig)',min:'Minimum dat al uw kosten dekt',obj:'Voor uw resultaatdoel ({o} per jaar, vóór belasting)',objNo:'Resultaatdoel niet ingevoerd',objBtn:'Mijn doel invoeren',ok:'De prognose ligt {v} boven {c}.',ko:'De prognose mist {v} om {c} te halen.',cObj:'uw doel',cMin:'het minimum',note:'Bedragen incl. btw, zoals de dagelijkse invoer. De prognose is een gemiddelde, geen belofte.',minNo:'Dagminimum niet berekenbaar: vul kosten en kalender aan.'},
 pt:{k:'As referências de hoje',fc:'Previsão · média dos {n} últimos dias iguais ({j})',fcNo:'Previsão: poucos dias iguais introduzidos ({j}; são precisos 3)',min:'Mínimo que cobre todos os seus custos',obj:'Para o seu objetivo de resultado ({o} por ano, antes de impostos)',objNo:'Objetivo de resultado não introduzido',objBtn:'Introduzir o meu objetivo',ok:'A previsão ultrapassa {c} em {v}.',ko:'Faltam {v} à previsão para atingir {c}.',cObj:'o seu objetivo',cMin:'o mínimo',note:'Montantes com IVA, como a introdução do dia. A previsão é uma média, não uma promessa.',minNo:'Mínimo do dia não calculável: complete os custos e o calendário.'}};
 function L(){var l=root.LOCALE;return T[l]?l:'fr';}
 function t(k,p){var s=(T[L()]||T.fr)[k]||T.fr[k];return p?s.replace(/\{(\w+)\}/g,function(_,x){return p[x]!=null?p[x]:'';}):s;}
 function money(v){try{return v.toLocaleString(L(),{style:'currency',currency:'EUR',maximumFractionDigits:0});}catch(e){return Math.round(v)+' €';}}
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function num(v){return typeof v==='number'&&isFinite(v);}
 function compute(){var o={};try{var c=root.verdictOperationalClock();o.key=String(c.key).slice(0,10);}catch(e){return null;}
  var day=Number(o.key.slice(8,10)),dt=new Date(o.key+'T12:00:00');o.wd=dt.getDay();
  try{var m=root.verdictPerformanceDayTarget(day);o.min=num(Number(m))&&Number(m)>0?Number(m):null;}catch(e){o.min=null;}
  try{var p=root.point3Calc(root.moteur());o.objAn=p.objectiveResult>0?p.objectiveResult:null;o.ratio=(o.objAn&&p.objectiveRevenue>0&&p.breakEven>0)?p.objectiveRevenue/p.breakEven:null;}catch(e){o.objAn=null;o.ratio=null;}
  o.obj=(o.min!=null&&o.ratio!=null)?o.min*o.ratio:null;
  var rows=((root.DB&&root.DB.histJour)||[]).filter(function(r){return r&&typeof r.caJ==='number'&&isFinite(r.caJ)&&r.caJ>0&&String(r.date)<o.key&&new Date(String(r.date).slice(0,10)+'T12:00:00').getDay()===o.wd;}).sort(function(a,b){return a.date<b.date?1:-1;}).slice(0,8);
  o.n=rows.length;o.fc=o.n>=3?rows.reduce(function(s,r){return s+r.caJ;},0)/o.n:null;
  try{o.jour=new Intl.DateTimeFormat(L(),{weekday:'long'}).format(dt);}catch(e){o.jour='';}
  return o;}
 root.VerdictReperesJour=compute;
 function html(o){var Z={green:'vert',yellow:'jaune',orange:'orange',red:'rouge'},cible=o.obj!=null?o.obj:o.min,etat='info';
  if(o.fc!=null&&cible!=null&&root.VerdictExact)etat=Z[root.VerdictExact.zoneRatio(o.fc/cible)]||'info';
  function row(a,b,attr){return '<div style="display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-top:1px solid rgba(148,163,184,.18)"'+(attr||'')+'><span class="sous" style="margin:0">'+esc(a)+'</span><b style="white-space:nowrap;font-variant-numeric:tabular-nums">'+esc(b)+'</b></div>';}
  var h='<div class="mod-h"><p class="kicker">'+esc(t('k'))+'</p></div>';
  h+=o.fc!=null?row(t('fc',{n:o.n,j:o.jour}),money(o.fc),' data-rj="fc"'):'<p class="sous" data-rj="fc-no" style="margin:6px 0">'+esc(t('fcNo',{j:o.jour}))+'</p>';
  h+=o.min!=null?row(t('min'),money(o.min),' data-rj="min"'):'<p class="sous" data-rj="min-no" style="margin:6px 0">'+esc(t('minNo'))+'</p>';
  if(o.obj!=null)h+=row(t('obj',{o:money(o.objAn)}),money(o.obj),' data-rj="obj"');
  else if(o.min!=null)h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:7px 0;border-top:1px solid rgba(148,163,184,.18)" data-rj="obj-no"><span class="sous" style="margin:0">'+esc(t('objNo'))+'</span><button type="button" class="btn ghost" onclick="try{parent.verdictSaisirObjectifResultat()}catch(e){}">'+esc(t('objBtn'))+'</button></div>';
  if(o.fc!=null&&cible!=null){var d=o.fc-cible,c=o.obj!=null?t('cObj'):t('cMin');h+='<p class="titre" data-rj="verdict" style="font-size:16px;margin:10px 0 4px">'+esc(d>=0?t('ok',{c:c,v:money(d)}):t('ko',{c:c,v:money(-d)}))+'</p>';}
  h+='<p class="sous" style="font-size:12.5px;margin-top:6px">'+esc(t('note'))+'</p>';
  return {h:h,etat:etat};}
 root.verdictSaisirObjectifResultat=function(){try{root.go('in');}catch(e){}root.setTimeout(function(){var i=root.document.getElementById('i-obj');if(i){i.scrollIntoView({block:'center'});try{i.focus({preventScroll:true});}catch(e){}}},500);};
 function attach(){try{if(root.VIEW!=='pil')return;var fr=root.document.querySelector('#v-pil iframe.p41-ecran')||root.document.querySelector('iframe.p41-ecran'),doc=fr&&fr.contentDocument;if(!doc||!doc.body)return;
  var M=doc.getElementById('modSaisie');if(!M||!M.parentNode)return;var o=compute();if(!o)return;
  var sig=[L(),o.key,o.min,o.obj,o.fc,o.n].join('|'),el=doc.getElementById('modReperesJour');if(el&&el.getAttribute('data-rj-sig')===sig)return;
  var r=html(o);if(!el){el=doc.createElement('article');el.className='mod';el.id='modReperesJour';var off=doc.getElementById('vdOffCard'),after=(off&&off.parentNode===M.parentNode)?off:M;after.parentNode.insertBefore(el,after.nextSibling);}
  el.setAttribute('data-etat',r.etat);el.setAttribute('data-rj-sig',sig);el.innerHTML=r.h;}catch(e){}}
 root.setInterval(attach,900);
})(window);
