
/* Dates d'exploitation et de préparation. Aucun calcul financier ici. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.VerdictServiceDay=api;
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  var formatters={},defaultZone=Intl.DateTimeFormat().resolvedOptions().timeZone||'Europe/Paris';
  function pad(n){return String(n).padStart(2,'0');}
  function shift(key,n){var p=key.split('-').map(Number),d=new Date(Date.UTC(p[0],p[1]-1,p[2]+n,12));return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate());}
  function clock(value,config){
    var d=config||{},instant=value==null?new Date():new Date(value),zone=d.businessTimezone||(d.orderingSettings&&d.orderingSettings.timezone)||defaultZone,parts={};
    if(!Number.isFinite(instant.getTime()))throw new Error('Date invalide');
    function formatter(key){return formatters[key]||(formatters[key]=new Intl.DateTimeFormat('en-CA',{timeZone:key,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));}
    var fmt;try{fmt=formatter(zone);}catch(_){zone='Europe/Paris';fmt=formatter(zone);}
    fmt.formatToParts(instant).forEach(function(p){if(p.type!=='literal')parts[p.type]=p.value;});
    var civil=parts.year+'-'+parts.month+'-'+parts.day,hour=Number(parts.hour)%24,key=civil,p=key.split('-').map(Number);
    return {key:key,civilKey:civil,completedKey:shift(civil,-1),year:p[0],month:p[1],monthIndex:p[1]-1,day:p[2],hour:hour,minute:Number(parts.minute),second:Number(parts.second),endHour:0,date:new Date(p[0],p[1]-1,p[2],12),timeZone:zone};
  }
  function observed(row,op){
    if(!row||!/^\d{4}-\d{2}-\d{2}$/.test(String(row.date||''))||row.date>op.key)return false;
    // Les anciennes démos remplissaient aussi le jour civil courant.
    // On masque uniquement leurs lignes automatiques ; les données restent intactes.
    var seeded=row.demo===true&&(row.source==='demo-pos'||row.source==='demo-seed'||!row.source);
    return !seeded||row.date<=op.completedKey;
  }
  function upcoming(op,recorded,isClosed,targetFor){
    var key=op.civilKey>op.key?op.civilKey:recorded?shift(op.key,1):op.key;
    for(var i=0;i<366;i++,key=shift(key,1))if(!isClosed(key)){
      var value=targetFor(key),target=typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null;
      return {date:key,target:target,future:key>op.key,ca:null,status:'pending'};
    }
    return null;
  }
  var COPY={
    /* C308 (V16-002) : « Minimum », jamais « Objectif » : le minimum du jour est le même que « À tenir aujourd’hui ». */fr:{closed:'Établissement fermé pour ce service',service:'Service',next:'Prochain service',prepare:'À préparer',pending:'À réaliser · aucun CA enregistré pour ce service.',noNext:'Aucun service ouvert dans les 12 prochains mois.',target:'Minimum de CA TTC',actual:'CA enregistré',last:'Service précédent',enter:'Renseigner le service',edit:'Corriger le service',cutoff:'La journée se termine à minuit ; un service qui finit après minuit reste rattaché à son jour.',unknown:'Minimum à confirmer',stale:'La date du service a changé. Vos chiffres restent dans le formulaire ; vérifiez la date avant de continuer.'},
    en:{closed:'Closed for this service',service:'Service',next:'Next service',prepare:'To prepare',pending:'Still to complete · no sales recorded for this service.',noNext:'No open service in the next 12 months.',target:'Minimum gross sales',actual:'Recorded sales',last:'Previous service',enter:'Enter service figures',edit:'Correct service figures',cutoff:'The day ends at midnight; a service that ends after midnight stays on the day it started.',unknown:'Minimum to confirm',stale:'The service date has changed. Your figures remain in the form; check the date before continuing.'},
    es:{closed:'Cerrado para este servicio',service:'Servicio',next:'Próximo servicio',prepare:'Por preparar',pending:'Por realizar · sin ventas registradas para este servicio.',noNext:'Ningún servicio abierto en los próximos 12 meses.',target:'Mínimo de ventas con IVA',actual:'Ventas registradas',last:'Servicio anterior',enter:'Registrar el servicio',edit:'Corregir el servicio',cutoff:'La jornada termina a medianoche; un servicio que acaba después de medianoche se queda en su día.',unknown:'Mínimo por confirmar',stale:'La fecha del servicio ha cambiado. Las cifras siguen en el formulario; compruebe la fecha antes de continuar.'},
    it:{closed:'Chiuso per questo servizio',service:'Servizio',next:'Prossimo servizio',prepare:'Da preparare',pending:'Da svolgere · nessun incasso registrato per questo servizio.',noNext:'Nessun servizio aperto nei prossimi 12 mesi.',target:'Incasso minimo IVA inclusa',actual:'Incasso registrato',last:'Servizio precedente',enter:'Inserisci il servizio',edit:'Correggi il servizio',cutoff:'La giornata termina a mezzanotte; un servizio che finisce dopo mezzanotte resta nel suo giorno.',unknown:'Minimo da confermare',stale:'La data del servizio è cambiata. I dati restano nel modulo; controlla la data prima di continuare.'},
    de:{closed:'An diesem Betriebstag geschlossen',service:'Betriebstag',next:'Nächster Betriebstag',prepare:'Vorbereiten',pending:'Noch ausstehend · kein Umsatz für diesen Betriebstag erfasst.',noNext:'Kein geöffneter Betriebstag in den nächsten 12 Monaten.',target:'Mindestumsatz brutto',actual:'Erfasster Umsatz',last:'Vorheriger Betriebstag',enter:'Betriebstag erfassen',edit:'Betriebstag korrigieren',cutoff:'Der Tag endet um Mitternacht; ein Service, der nach Mitternacht endet, bleibt bei seinem Tag.',unknown:'Minimum zu bestätigen',stale:'Das Datum des Betriebstags hat sich geändert. Ihre Zahlen bleiben im Formular; prüfen Sie das Datum, bevor Sie fortfahren.'},
    nl:{closed:'Gesloten voor deze servicedag',service:'Servicedag',next:'Volgende servicedag',prepare:'Voorbereiden',pending:'Nog te doen · geen omzet voor deze servicedag geregistreerd.',noNext:'Geen geopende servicedag in de komende 12 maanden.',target:'Minimumomzet inclusief btw',actual:'Geregistreerde omzet',last:'Vorige servicedag',enter:'Servicedag invoeren',edit:'Servicedag corrigeren',cutoff:'De dag eindigt om middernacht; een service die na middernacht eindigt, blijft bij zijn dag.',unknown:'Minimum te bevestigen',stale:'De datum van de servicedag is gewijzigd. Uw cijfers blijven in het formulier; controleer de datum voordat u verdergaat.'},
    pt:{closed:'Fechado para este serviço',service:'Serviço',next:'Próximo serviço',prepare:'Por preparar',pending:'Por realizar · nenhuma receita registada para este serviço.',noNext:'Nenhum serviço aberto nos próximos 12 meses.',target:'Receita mínima com IVA',actual:'Receita registada',last:'Serviço anterior',enter:'Registar o serviço',edit:'Corrigir o serviço',cutoff:'O dia termina à meia-noite; um serviço que acaba depois da meia-noite fica no seu dia.',unknown:'Mínimo por confirmar',stale:'A data do serviço mudou. Os valores continuam no formulário; verifique a data antes de continuar.'}
  };
  function copy(locale){return COPY[locale]||COPY.fr;}
  function label(key,locale){var p=key.split('-').map(Number);return new Intl.DateTimeFormat(locale||'fr',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(p[0],p[1]-1,p[2],12)));}
  return {version:'1.0.0',clock:clock,shift:shift,observed:observed,upcoming:upcoming,copy:copy,label:label};
});

