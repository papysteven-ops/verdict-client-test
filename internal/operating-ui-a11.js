/* Dated sales budgets. Economic break-even remains a separate reference. */
(function(w){
  'use strict';
  var L=w.VerdictOperatingLedger,F=w.VerdictFinance;if(!L||!F)throw Error('OPERATING_ENGINE_REQUIRED');
  var locales=['fr','en','es','it','de','nl','pt'];
  var copy={
    title:['Budget de ventes daté','Dated sales budget','Presupuesto de ventas fechado','Budget vendite datato','Datierter Umsatzplan','Omzetbudget met datum','Orçamento de vendas datado'],
    description:['Fixez un objectif de CA TTC et son calendrier. Chaque révision garde les objectifs passés. Le minimum économique reste calculé séparément.','Set a gross sales target and calendar. Each revision preserves past targets. Economic break-even is calculated separately.','Defina un objetivo de ventas con IVA y su calendario. Cada revisión conserva los objetivos pasados. El mínimo económico se calcula por separado.','Imposta un obiettivo di vendite IVA inclusa e il calendario. Ogni revisione conserva gli obiettivi passati. Il minimo economico è calcolato separatamente.','Legen Sie ein Bruttoumsatzziel und den Kalender fest. Jede Änderung erhält vergangene Ziele. Die wirtschaftliche Gewinnschwelle wird separat berechnet.','Stel een omzetdoel inclusief btw en de kalender in. Iedere wijziging bewaart eerdere doelen. De economische drempel wordt apart berekend.','Defina um objetivo de vendas com IVA e o calendário. Cada revisão conserva os objetivos passados. O mínimo económico é calculado separadamente.'],
    annual:['Budget annuel de CA TTC (€)','Annual gross sales budget (€)','Presupuesto anual de ventas con IVA (€)','Budget annuo vendite IVA inclusa (€)','Jährlicher Bruttoumsatzplan (€)','Jaarlijks omzetbudget inclusief btw (€)','Orçamento anual de vendas com IVA (€)'],
    effective:['Applicable à partir du','Effective from','Aplicable desde','Valido dal','Gültig ab','Geldig vanaf','Aplicável a partir de'],
    reason:['Motif de la révision','Reason for revision','Motivo de la revisión','Motivo della revisione','Grund der Änderung','Reden voor de wijziging','Motivo da revisão'],
    weights:['Poids des mois ouverts','Weights of open months','Pesos de los meses abiertos','Pesi dei mesi aperti','Gewichtung der geöffneten Monate','Gewichten van open maanden','Pesos dos meses abertos'],
    calendar:['Les jours ouverts et fermés viennent de votre calendrier d’établissement. À poids égal, un mois ouvert reçoit la même part annuelle ; ses jours ouverts se partagent cette part.','Open and closed days come from your business calendar. With equal weights, each open month receives the same annual share, divided among its open days.','Los días abiertos y cerrados proceden de su calendario. Con pesos iguales, cada mes abierto recibe la misma parte anual, repartida entre sus días abiertos.','I giorni aperti e chiusi provengono dal calendario dell’attività. A parità di peso, ogni mese aperto riceve la stessa quota annua, suddivisa tra i giorni aperti.','Offene und geschlossene Tage stammen aus Ihrem Betriebskalender. Bei gleichen Gewichten erhält jeder geöffnete Monat denselben Jahresanteil, verteilt auf seine offenen Tage.','Open en gesloten dagen komen uit uw bedrijfskalender. Bij gelijke gewichten krijgt iedere open maand hetzelfde jaaraandeel, verdeeld over de open dagen.','Os dias abertos e fechados vêm do calendário do estabelecimento. Com pesos iguais, cada mês aberto recebe a mesma parte anual, dividida pelos dias abertos.'],
    save:['Enregistrer le budget','Save budget','Guardar presupuesto','Salva budget','Umsatzplan speichern','Budget opslaan','Guardar orçamento'],
    revise:['Enregistrer une révision','Save revision','Guardar revisión','Salva revisione','Änderung speichern','Wijziging opslaan','Guardar revisão'],
    pending:['Enregistrement en cours…','Saving…','Guardando…','Salvataggio…','Wird gespeichert…','Bezig met opslaan…','A guardar…'],
    saved:['Budget enregistré. Les objectifs passés sont conservés.','Budget saved. Past targets are preserved.','Presupuesto guardado. Se conservan los objetivos pasados.','Budget salvato. Gli obiettivi passati sono conservati.','Umsatzplan gespeichert. Vergangene Ziele bleiben erhalten.','Budget opgeslagen. Eerdere doelen zijn bewaard.','Orçamento guardado. Os objetivos passados são conservados.'],
    temporary:['Budget temporaire de ce modèle ; aucune donnée réelle n’est modifiée.','Temporary budget for this model; real data is unchanged.','Presupuesto temporal de este modelo; no se modifican datos reales.','Budget temporaneo del modello; i dati reali restano invariati.','Temporärer Plan für dieses Modell; reale Daten bleiben unverändert.','Tijdelijk budget voor dit model; echte gegevens blijven ongewijzigd.','Orçamento temporário deste modelo; os dados reais não são alterados.'],
    failed:['Enregistrement non confirmé. Vos valeurs restent dans le formulaire.','Saving was not confirmed. Your values remain in the form.','Guardado no confirmado. Los valores siguen en el formulario.','Salvataggio non confermato. I valori restano nel modulo.','Speicherung nicht bestätigt. Ihre Werte bleiben im Formular.','Opslaan niet bevestigd. Uw waarden blijven in het formulier.','Gravação não confirmada. Os valores continuam no formulário.'],
    invalid:['Vérifiez le montant, les poids et la date : aucun objectif passé ne peut être réécrit.','Check amount, weights and date: past targets cannot be rewritten.','Revise importe, pesos y fecha: no se pueden reescribir objetivos pasados.','Controlla importo, pesi e data: gli obiettivi passati non possono essere riscritti.','Prüfen Sie Betrag, Gewichte und Datum: vergangene Ziele können nicht überschrieben werden.','Controleer bedrag, gewichten en datum: eerdere doelen kunnen niet worden herschreven.','Verifique montante, pesos e data: os objetivos passados não podem ser reescritos.'],
    stale:['L’établissement a changé. Revenez au dossier d’origine pour enregistrer ces valeurs.','The business has changed. Return to the original record to save these values.','El establecimiento ha cambiado. Vuelva al expediente original para guardar los valores.','L’attività è cambiata. Torna al dossier originale per salvare i valori.','Der Betrieb wurde gewechselt. Kehren Sie zum ursprünglichen Datensatz zurück, um diese Werte zu speichern.','Het bedrijf is gewijzigd. Ga terug naar het oorspronkelijke dossier om de waarden op te slaan.','O estabelecimento mudou. Volte ao dossier original para guardar os valores.'],
    history:['Versions conservées','Preserved versions','Versiones conservadas','Versioni conservate','Gespeicherte Versionen','Bewaarde versies','Versões conservadas'],
    unknown:['Aucun budget daté pour cette période.','No dated budget for this period.','Sin presupuesto fechado para este periodo.','Nessun budget datato per questo periodo.','Kein datierter Plan für diesen Zeitraum.','Geen budget met datum voor deze periode.','Sem orçamento datado para este período.'],
    partial:['Les dates précédant le premier budget restent sans objectif déclaré.','Dates before the first budget have no declared target.','Las fechas anteriores al primer presupuesto no tienen objetivo declarado.','Le date precedenti al primo budget non hanno un obiettivo dichiarato.','Für Tage vor dem ersten Plan gibt es kein erklärtes Ziel.','Datums vóór het eerste budget hebben geen opgegeven doel.','As datas anteriores ao primeiro orçamento não têm objetivo declarado.'],
    cancel:['Fermer le formulaire','Close form','Cerrar formulario','Chiudi modulo','Formular schließen','Formulier sluiten','Fechar formulário'],
    draft:['Des valeurs sont encore à enregistrer. Enregistrez-les ou fermez explicitement le formulaire.','Values are still unsaved. Save them or explicitly close the form.','Hay valores sin guardar. Guárdelos o cierre el formulario expresamente.','Alcuni valori non sono salvati. Salvali o chiudi esplicitamente il modulo.','Es gibt ungespeicherte Werte. Speichern Sie sie oder schließen Sie das Formular ausdrücklich.','Er zijn nog niet opgeslagen waarden. Sla ze op of sluit het formulier uitdrukkelijk.','Existem valores por guardar. Guarde-os ou feche explicitamente o formulário.'],
    export:['Exporter les mêmes objectifs (CSV)','Export the same targets (CSV)','Exportar los mismos objetivos (CSV)','Esporta gli stessi obiettivi (CSV)','Dieselben Ziele exportieren (CSV)','Dezelfde doelen exporteren (CSV)','Exportar os mesmos objetivos (CSV)'],
    day:['Date','Date','Fecha','Data','Datum','Datum','Data'],
    target:['Objectif CA TTC (€)','Gross sales target (€)','Objetivo ventas con IVA (€)','Obiettivo vendite IVA inclusa (€)','Bruttoumsatzziel (€)','Omzetdoel inclusief btw (€)','Objetivo vendas com IVA (€)'],
    version:['Version','Version','Versión','Versione','Version','Versie','Versão']
  };
  var note=['Le montant se répartit sur les jours ouverts couverts à partir de la date choisie.','The amount is allocated to covered open days from the selected date.','El importe se reparte entre los días abiertos cubiertos desde la fecha elegida.','L’importo è ripartito tra i giorni aperti coperti dalla data scelta.','Der Betrag wird ab dem gewählten Datum auf die abgedeckten offenen Tage verteilt.','Het bedrag wordt vanaf de gekozen datum verdeeld over de gedekte open dagen.','O montante distribui-se pelos dias abertos abrangidos a partir da data escolhida.'];copy.description=copy.description.map(function(s,i){return s+' '+note[i];});
  function locale(){var v=String(w.LOCALE||w.document.documentElement.lang||'fr').slice(0,2);return locales.includes(v)?v:'fr';}
  function text(k){return copy[k][locales.indexOf(locale())];}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function context(){
    var d=w.DB,store=w.STORE||{},env=w.VERDICT_PERSO===true||d&&(d._personalModel||d._personalCard)?'personal_model':d&&(d._testFiction||d.exempleCharge||d._demo&&d._demo.fictional)||w.VERDICT_DEMO_SESSION?'demo':'real';
    var workspace=null;try{workspace=w.parent&&w.parent.VerdictWorkspaceAccess&&w.parent.VerdictWorkspaceAccess.getState();}catch(_){}
    var selected=workspace&&workspace.context,site=String(store.actif||d&&d.id||'');
    return {db:d,token:String(w.SKEY||'memory')+'|'+site+'|'+env,scope:{organisationId:selected&&selected.organisationId||'local:'+String(w.VERDICT_STORAGE_SCOPE||'guest'),siteId:site||'local-establishment',environment:env},timeZone:d&&d.businessTimezone||w.VerdictServiceDay.clock(null,d).timeZone,cutoffHour:0};
  }
  function getBudget(key){var c=context(),b=c.db&&c.db.operatingBudgets&&c.db.operatingBudgets[String(key).slice(0,4)];return b||null;}
  function target(key){var b=getBudget(key);return b?L.budgetAt(b,key):null;}
  function yearDays(year,weights){
    var counts=Array(12).fill(0),days=[],api=w.VerdictPerformanceIntegrated;
    if(!api||typeof api.isClosed!=='function')throw Error('OPENING_CALENDAR_REQUIRED');
    for(var key=year+'-01-01';key<=year+'-12-31';key=F.addDate(key,1)){var month=Number(key.slice(5,7))-1,open=!api.isClosed(key);if(open)counts[month]++;days.push({date:key,open:open,month:month});}
    return days.map(function(d){var weight=d.open?F.fraction(weights[d.month]).div(counts[d.month]):F.fraction(0);return {date:d.date,open:d.open,weight:weight.format(18),weightExact:weight.toJSON(),source:'establishment_calendar'};});
  }
  async function persist(c,budget){
    if(context().token!==c.token||w.DB!==c.db)throw Error('SCOPE_CHANGED');
    var before=c.db.operatingBudgets,newBudgets=Object.assign({},before||{});newBudgets[budget.year]=budget;c.db.operatingBudgets=newBudgets;
    try{
      var result=typeof w.save==='function'?await w.save('dated-sales-budget'):null,state=result&&result.result||result;
      var temporary=c.scope.environment!=='real'&&(w.VERDICT_DEMO_SESSION===true||c.scope.environment==='personal_model');
      if(!(state&&state.committed===true)&&!temporary)throw Error('COMMIT_NOT_CONFIRMED');
      if(context().token===c.token&&w.DB===c.db){if(typeof w.verdictInvalidateViews==='function')w.verdictInvalidateViews();if(w.VerdictSeasonalCacheInvalidate)w.VerdictSeasonalCacheInvalidate();}
      return {committed:!temporary,temporary:temporary};
    }catch(e){if(c.db.operatingBudgets===newBudgets){if(before===undefined)delete c.db.operatingBudgets;else c.db.operatingBudgets=before;}throw e;}
  }
  function exportBudget(b){
    var rows=[];for(var key=b.year+'-01-01';key<=b.year+'-12-31';key=F.addDate(key,1)){var t=L.budgetAt(b,key);rows.push({date:key,target:t.target,revision:t.revisionId||'',state:t.state});}
    var csv=L.csvReport({columns:[{key:'date',label:text('day')},{key:'target',label:text('target'),type:'number'},{key:'revision',label:text('version')},{key:'state',label:'state'}],rows:rows}),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=w.document.createElement('a');link.href=url;link.download='Verdict-budget-'+b.year+'.csv';link.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }
  function render(host){
    if(!host||!w.DB)return;var c=context(),today=L.businessDate(new Date(),c.timeZone,0),year=Number(today.slice(0,4)),budget=getBudget(today),latest=budget&&budget.revisions[budget.revisions.length-1],weights=latest&&latest.source&&latest.source.monthlyWeights||Array(12).fill('1');
    var section=w.document.createElement('section');section.className='budget-a11 card';section.id='budget-a11';
    var history=budget?'<ol>'+budget.revisions.map(function(r){return '<li><time datetime="'+esc(r.recordedAt)+'">'+esc(new Intl.DateTimeFormat(locale(),{dateStyle:'short',timeStyle:'short',timeZone:c.timeZone}).format(new Date(r.recordedAt)))+'</time> · '+esc(r.effectiveFrom)+' · '+esc(new Intl.NumberFormat(locale(),{style:'currency',currency:'EUR'}).format(new F.Fraction(BigInt(r.annualCents),100n).number(2)))+(r.reason?' · '+esc(r.reason):'')+'</li>';}).join('')+'</ol>':'<p>'+esc(text('unknown'))+'</p>';
    section.innerHTML='<h2>'+esc(text('title'))+'</h2><p>'+esc(text('description'))+'</p><details><summary>'+esc(latest?text('revise'):text('save'))+'</summary><form novalidate><label>'+esc(text('annual'))+'<input name="annual" inputmode="decimal" required value="'+esc(latest?new F.Fraction(BigInt(latest.annualCents),100n).format(2):'')+'"></label><label>'+esc(text('effective'))+'<input name="effective" type="date" required min="'+today+'" max="'+year+'-12-31" value="'+today+'"></label><fieldset><legend>'+esc(text('weights'))+'</legend><div class="budget-a11-months">'+weights.map(function(value,i){var name=new Intl.DateTimeFormat(locale(),{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(year,i,15)));return '<label>'+esc(name)+'<input name="month-'+i+'" inputmode="decimal" required value="'+esc(value)+'"></label>';}).join('')+'</div><p>'+esc(text('calendar'))+'</p></fieldset><label>'+esc(text('reason'))+'<textarea name="reason" maxlength="2000"></textarea></label><div class="budget-a11-actions"><button type="submit" class="btn">'+esc(latest?text('revise'):text('save'))+'</button><button type="button" class="btn sec" data-close>'+esc(text('cancel'))+'</button></div><p class="budget-a11-status" role="status" aria-live="polite"></p></form></details><h3>'+esc(text('history'))+'</h3>'+history+'<p>'+esc(text('partial'))+'</p>'+(budget?'<button type="button" class="btn sec" data-export>'+esc(text('export'))+'</button>':'');
    var prior=host.querySelector('#budget-a11');if(prior)prior.remove();host.appendChild(section);
    var form=section.querySelector('form'),status=section.querySelector('[role="status"]'),details=section.querySelector('details'),pending=false,dirty=false,submit=form.querySelector('[type="submit"]'),draft=w.VerdictDraftsA11&&w.VerdictDraftsA11.bind(form,c.token+':budget-form:'+year);if(draft&&draft.hasPending()){dirty=true;details.open=true;}
    form.addEventListener('input',function(){dirty=true;});
    form.addEventListener('keydown',function(e){if(e.key==='Escape'&&dirty){e.preventDefault();e.stopImmediatePropagation();status.textContent=text('draft');}else if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'){e.preventDefault();e.stopImmediatePropagation();if(!pending)form.requestSubmit();}});
    section.querySelector('[data-close]').addEventListener('click',function(){if(!pending)details.open=false;});
    var exportButton=section.querySelector('[data-export]');if(exportButton)exportButton.addEventListener('click',function(){exportBudget(getBudget(today));});
    form.addEventListener('submit',async function(e){
      e.preventDefault();e.stopImmediatePropagation();if(pending)return;if(context().token!==c.token||w.DB!==c.db){status.textContent=text('stale');return;}
      var fields=form.elements,annual=fields.namedItem('annual').value,effective=fields.namedItem('effective').value,monthly=[],next;
      try{
        if(effective<today||!F.isoDate(effective)||Number(effective.slice(0,4))!==year)throw Error('INVALID_DATE');
        for(var i=0;i<12;i++){var raw=fields.namedItem('month-'+i).value,p=F.parseInput(raw,{nonnegative:true});if(p.state!=='known')throw Error('INVALID_WEIGHT');monthly.push(F.fromExact(p.exact).format(18));}
        var days=yearDays(year,monthly),input={scope:c.scope,year:year,id:'budget-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),annualAmount:annual,effectiveFrom:effective,recordedAt:new Date().toISOString(),days:days,timeZone:c.timeZone,cutoffHour:0,reason:fields.namedItem('reason').value,source:{kind:'manual_declaration',monthlyWeights:monthly}},existing=getBudget(today);
        next=existing?L.reviseBudget(existing,input):L.createBudget(input);
      }catch(error){status.textContent=text('invalid');return;}
      pending=true;submit.disabled=true;status.textContent=text('pending');
      try{var result=await persist(c,next);dirty=false;if(draft)draft.clear();if(w.DB===c.db&&context().token===c.token){render(host);var node=host.querySelector('[role="status"]');if(node)node.textContent=result.temporary?text('temporary'):text('saved');}else status.textContent=result.temporary?text('temporary'):text('saved');}
      catch(error){status.textContent=error.message==='SCOPE_CHANGED'?text('stale'):text('failed');}
      finally{pending=false;submit.disabled=false;}
    });
  }
  function install(){
    if(w.__budgetA11Installed)return;w.__budgetA11Installed=true;
    var draw=w.drawObj;if(typeof draw==='function')w.drawObj=function(){var value=draw.apply(this,arguments);render(w.document.getElementById('objBody'));return value;};
    var originalTarget=w.verdictPerformanceDayTarget;if(typeof originalTarget==='function')w.verdictPerformanceDayTarget=function(day){var key=typeof day==='string'&&F.isoDate(day)?day:w.verdictOperationalClock().key.slice(0,8)+String(day).padStart(2,'0'),value=target(key);return value?value.target:originalTarget.apply(this,arguments);};
    var menu=w.drawMenu;if(typeof menu==='function')w.drawMenu=function(){var value=menu.apply(this,arguments),host=w.document.getElementById('menuGrid');if(host&&!host.querySelector('[data-a11-budget]')){var button=w.document.createElement('button');button.type='button';button.className='btn sec budget-a11-entry';button.setAttribute('data-a11-budget','');button.textContent=text('title');button.addEventListener('click',function(){w.go('obj');});host.appendChild(button);}return value;};
  }
  w.VerdictBudgetUI={version:'A11.1',render:render,target:target,getBudget:getBudget,persist:persist,context:context,yearDays:yearDays,copy:copy,install:install};install();
})(window);
