
/* =====================================================================
   VERDICT® · Services R56 · 22 septembre 2026
   Décision Steven (22/09) : pas de part fixe entre services. La base reste
   la journée (objectif du jour du moteur). Le client saisit chaque fin de
   service ; Verdict dit ce qu'il reste à faire pour l'objectif du jour,
   et se projette avec la part habituelle de CE service dans SES propres
   journées (même jour de semaine), jamais avec une moyenne inventée.
   Aucun calcul du moteur n'est modifié : la journée écrite dans Verdict
   reste la somme des services (mémorisée, comptée dès l'enregistrement ; la journée finit à minuit).
   Données : DB.servicesConfig = {semaine:{0..6:[ids]}} (0 = lundi)
             DB.servicesJour   = {"AAAA-MM-JJ":{midi:{ca,tk},soir:{ca,tk}}}
   ===================================================================== */
(function(global){
  'use strict';
  var doc=global.document;if(!doc||global.VerdictServices)return;
  var IDS=["matin","midi","aprem","soir"];
  var T={
    fr:{aligner:"Structure : {j} jours ouverts / semaine · calendrier : {c}. Aligner la structure sur le calendrier",deduit:"Déduit de Mes services : {j} jours ouverts / semaine",unSeul:"Une seule saisie : ce tableau règle le calendrier, la structure (jours ouverts / semaine) et la saisie par service.",ferme:"Fermé",noteFerme:"Fermé = jour de repos hebdomadaire, aucun chiffre attendu. Aucun service coché sans Fermé = journée continue, une seule saisie.",titre:"Mes services",sous:"Quand encaissez-vous ? Verdict lit chaque fin de service et vous dit ce qu’il reste à faire pour l’objectif du jour.",tous:"Tous les jours pareil",continu:"Journée continue",matin:"Matin",midi:"Midi",aprem:"Après-midi",soir:"Soir",jours:["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"],
        saisi:"Saisi",reste:"Il reste {x} pour l’objectif du jour",depasse:"Objectif du jour déjà dépassé de {x}",complet:"Journée complète",enCours:"{n} service{s} saisi{s} sur {t}",proj:"À votre rythme habituel, la journée finirait vers {x}.",ref:"Le {s} fait en général {p} de vos journées.",enregistrer:"Enregistrer ce service",tickets:"Tickets",aVenir:"à venir",jourEnCours:"Aujourd’hui · en cours",ajd:"Aujourd’hui"},
    en:{aligner:"Structure: {j} open days / week · calendar: {c}. Align the structure with the calendar",deduit:"Derived from My services: {j} open days / week",unSeul:"One single entry: this table drives the calendar, the structure (open days / week) and the entry per service.",ferme:"Closed",noteFerme:"Closed = weekly day off, no revenue expected. No service ticked without Closed = all-day, a single entry.",titre:"My services",sous:"When do you take payments? Verdict reads each end of service and tells you what is left to reach today’s target.",tous:"Same every day",continu:"All day",matin:"Morning",midi:"Lunch",aprem:"Afternoon",soir:"Dinner",jours:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
        saisi:"Entered",reste:"{x} left to reach today’s target",depasse:"Today’s target already exceeded by {x}",complet:"Day complete",enCours:"{n} service{s} entered out of {t}",proj:"At your usual pace, the day would end around {x}.",ref:"{s} usually makes {p} of your days.",enregistrer:"Save this service",tickets:"Tickets",aVenir:"to come",jourEnCours:"Today · in progress",ajd:"Today"},
    es:{aligner:"Estructura: {j} días abiertos / semana · calendario: {c}. Alinear la estructura con el calendario",deduit:"Deducido de Mis servicios: {j} días abiertos / semana",unSeul:"Una sola entrada: esta tabla rige el calendario, la estructura (días abiertos / semana) y la entrada por servicio.",ferme:"Cerrado",noteFerme:"Cerrado = descanso semanal, ningún ingreso esperado. Sin servicio marcado y sin Cerrado = jornada continua, una sola entrada.",titre:"Mis servicios",sous:"¿Cuándo cobra? Verdict lee cada fin de servicio y le dice lo que falta para el objetivo del día.",tous:"Igual todos los días",continu:"Todo el día",matin:"Mañana",midi:"Mediodía",aprem:"Tarde",soir:"Noche",jours:["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"],
        saisi:"Registrado",reste:"Faltan {x} para el objetivo del día",depasse:"Objetivo del día ya superado en {x}",complet:"Jornada completa",enCours:"{n} servicio{s} registrado{s} de {t}",proj:"A su ritmo habitual, la jornada terminaría en torno a {x}.",ref:"El {s} suele hacer {p} de sus jornadas.",enregistrer:"Guardar este servicio",tickets:"Tickets",aVenir:"pendiente",jourEnCours:"Hoy · en curso",ajd:"Hoy"},
    it:{aligner:"Struttura: {j} giorni aperti / settimana · calendario: {c}. Allineare la struttura al calendario",deduit:"Dedotto da I miei servizi: {j} giorni aperti / settimana",unSeul:"Un solo inserimento: questa tabella regola calendario, struttura (giorni aperti / settimana) e registrazione per servizio.",ferme:"Chiuso",noteFerme:"Chiuso = riposo settimanale, nessun incasso atteso. Nessun servizio spuntato senza Chiuso = giornata continua, una sola registrazione.",titre:"I miei servizi",sous:"Quando incassate? Verdict legge ogni fine servizio e dice cosa manca per l’obiettivo del giorno.",tous:"Uguale ogni giorno",continu:"Giornata continua",matin:"Mattina",midi:"Pranzo",aprem:"Pomeriggio",soir:"Cena",jours:["Lun","Mar","Mer","Gio","Ven","Sab","Dom"],
        saisi:"Registrato",reste:"Mancano {x} all’obiettivo del giorno",depasse:"Obiettivo del giorno già superato di {x}",complet:"Giornata completa",enCours:"{n} servizio/i registrato/i su {t}",proj:"Al ritmo abituale, la giornata finirebbe intorno a {x}.",ref:"Il {s} fa in genere {p} delle vostre giornate.",enregistrer:"Salva questo servizio",tickets:"Scontrini",aVenir:"da venire",jourEnCours:"Oggi · in corso",ajd:"Oggi"},
    de:{aligner:"Struktur: {j} offene Tage / Woche · Kalender: {c}. Struktur an den Kalender angleichen",deduit:"Abgeleitet aus Meine Services: {j} offene Tage / Woche",unSeul:"Eine einzige Eingabe: diese Tabelle steuert Kalender, Struktur (offene Tage / Woche) und die Eingabe pro Service.",ferme:"Geschlossen",noteFerme:"Geschlossen = wöchentlicher Ruhetag, kein Umsatz erwartet. Kein Service angehakt ohne Geschlossen = durchgehend, eine Eingabe.",titre:"Meine Services",sous:"Wann kassieren Sie? Verdict liest jedes Serviceende und sagt, was zum Tagesziel noch fehlt.",tous:"Jeden Tag gleich",continu:"Durchgehend",matin:"Morgen",midi:"Mittag",aprem:"Nachmittag",soir:"Abend",jours:["Mo","Di","Mi","Do","Fr","Sa","So"],
        saisi:"Erfasst",reste:"Es fehlen {x} bis zum Tagesziel",depasse:"Tagesziel bereits um {x} übertroffen",complet:"Tag vollständig",enCours:"{n} von {t} Services erfasst",proj:"Im üblichen Rhythmus endet der Tag bei etwa {x}.",ref:"{s} macht üblicherweise {p} Ihrer Tage aus.",enregistrer:"Diesen Service speichern",tickets:"Bons",aVenir:"folgt",jourEnCours:"Heute · läuft",ajd:"Heute"},
    nl:{aligner:"Structuur: {j} open dagen / week · kalender: {c}. Structuur afstemmen op de kalender",deduit:"Afgeleid uit Mijn services: {j} open dagen / week",unSeul:"Eén invoer: deze tabel stuurt de kalender, de structuur (open dagen / week) en de invoer per service.",ferme:"Gesloten",noteFerme:"Gesloten = wekelijkse sluitingsdag, geen omzet verwacht. Geen service aangevinkt zonder Gesloten = doorlopend, één invoer.",titre:"Mijn services",sous:"Wanneer rekent u af? Verdict leest elk einde van service en zegt wat er nog nodig is voor het dagdoel.",tous:"Elke dag hetzelfde",continu:"Doorlopend",matin:"Ochtend",midi:"Middag",aprem:"Namiddag",soir:"Avond",jours:["Ma","Di","Wo","Do","Vr","Za","Zo"],
        saisi:"Ingevoerd",reste:"Nog {x} tot het dagdoel",depasse:"Dagdoel al met {x} overschreden",complet:"Dag volledig",enCours:"{n} van {t} services ingevoerd",proj:"In uw gewone ritme eindigt de dag rond {x}.",ref:"{s} is doorgaans {p} van uw dagen.",enregistrer:"Deze service opslaan",tickets:"Bonnen",aVenir:"volgt",jourEnCours:"Vandaag · bezig",ajd:"Vandaag"},
    pt:{aligner:"Estrutura: {j} dias abertos / semana · calendário: {c}. Alinhar a estrutura com o calendário",deduit:"Deduzido de Os meus serviços: {j} dias abertos / semana",unSeul:"Um único registo: esta tabela rege o calendário, a estrutura (dias abertos / semana) e o registo por serviço.",ferme:"Fechado",noteFerme:"Fechado = folga semanal, nenhuma receita esperada. Nenhum serviço marcado sem Fechado = dia contínuo, um único registo.",titre:"Os meus serviços",sous:"Quando fatura? O Verdict lê cada fim de serviço e diz o que falta para o objetivo do dia.",tous:"Igual todos os dias",continu:"Dia contínuo",matin:"Manhã",midi:"Almoço",aprem:"Tarde",soir:"Jantar",jours:["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],
        saisi:"Registado",reste:"Faltam {x} para o objetivo do dia",depasse:"Objetivo do dia já superado em {x}",complet:"Dia completo",enCours:"{n} serviço{s} registado{s} de {t}",proj:"Ao seu ritmo habitual, o dia terminaria perto de {x}.",ref:"O {s} faz normalmente {p} dos seus dias.",enregistrer:"Guardar este serviço",tickets:"Tickets",aVenir:"a seguir",jourEnCours:"Hoje · em curso",ajd:"Hoje"}
  };
  /* R131 · fins de service et saisie attendue (7 langues) */
  var T2={
    fr:{finTitre:"Fins de service",finNote:"Heure habituelle de fin (ex. 15:00, 23:30 ; 01:30 = après minuit, reste sur le jour du service). Verdict vous demande le chiffre juste après. Sans heure, il le demande après minuit.",finJour:"Journée",aRens:"À renseigner",pVeilleSvc:"{s} du {j} : pas encore renseigné. Entrez-le dès que possible, Verdict se met à jour aussitôt.",pVeilleJour:"Journée du {j} : pas encore renseignée. Entrez-la dès que possible, Verdict se met à jour aussitôt.",pSvcFini:"{s} terminé à {h} : pas encore renseigné. Entrez-le maintenant, Verdict se met à jour aussitôt.",pJourFini:"Journée terminée à {h} : pas encore renseignée. Entrez-la maintenant, Verdict se met à jour aussitôt."},
    en:{finTitre:"End of service times",finNote:"Usual end time (e.g. 15:00, 23:30; 01:30 = after midnight, stays on the service day). Verdict asks for the figure right after. Without a time, it asks after midnight.",finJour:"Whole day",aRens:"To enter",pVeilleSvc:"{s} on {j}: not entered yet. Enter it as soon as you can; Verdict updates straight away.",pVeilleJour:"Day of {j}: not entered yet. Enter it as soon as you can; Verdict updates straight away.",pSvcFini:"{s} ended at {h}: not entered yet. Enter it now; Verdict updates straight away.",pJourFini:"Day ended at {h}: not entered yet. Enter it now; Verdict updates straight away."},
    es:{finTitre:"Fin de cada servicio",finNote:"Hora habitual de fin (p. ej. 15:00, 23:30; 01:30 = después de medianoche, se queda en el día del servicio). Verdict le pide la cifra justo después. Sin hora, la pide pasada la medianoche.",finJour:"Jornada",aRens:"Por registrar",pVeilleSvc:"{s} del {j}: aún sin registrar. Regístrelo en cuanto pueda; Verdict se actualiza al momento.",pVeilleJour:"Jornada del {j}: aún sin registrar. Regístrela en cuanto pueda; Verdict se actualiza al momento.",pSvcFini:"{s} terminado a las {h}: aún sin registrar. Regístrelo ahora; Verdict se actualiza al momento.",pJourFini:"Jornada terminada a las {h}: aún sin registrar. Regístrela ahora; Verdict se actualiza al momento."},
    it:{finTitre:"Fine dei servizi",finNote:"Ora abituale di fine (es. 15:00, 23:30; 01:30 = dopo mezzanotte, resta sul giorno del servizio). Verdict chiede il dato subito dopo. Senza ora, lo chiede dopo mezzanotte.",finJour:"Giornata",aRens:"Da inserire",pVeilleSvc:"{s} di {j}: non ancora inserito. Inseritelo appena possibile, Verdict si aggiorna subito.",pVeilleJour:"Giornata di {j}: non ancora inserita. Inseritela appena possibile, Verdict si aggiorna subito.",pSvcFini:"{s} finito alle {h}: non ancora inserito. Inseritelo ora, Verdict si aggiorna subito.",pJourFini:"Giornata finita alle {h}: non ancora inserita. Inseritela ora, Verdict si aggiorna subito."},
    de:{finTitre:"Serviceende",finNote:"Übliches Ende (z. B. 15:00, 23:30; 01:30 = nach Mitternacht, bleibt beim Servicetag). Verdict fragt direkt danach nach der Zahl. Ohne Uhrzeit fragt es nach Mitternacht.",finJour:"Ganzer Tag",aRens:"Zu erfassen",pVeilleSvc:"{s} am {j}: noch nicht erfasst. Erfassen Sie ihn so bald wie möglich, Verdict aktualisiert sich sofort.",pVeilleJour:"Tag {j}: noch nicht erfasst. Erfassen Sie ihn so bald wie möglich, Verdict aktualisiert sich sofort.",pSvcFini:"{s} um {h} beendet: noch nicht erfasst. Jetzt erfassen, Verdict aktualisiert sich sofort.",pJourFini:"Tag um {h} beendet: noch nicht erfasst. Jetzt erfassen, Verdict aktualisiert sich sofort."},
    nl:{finTitre:"Einde van de service",finNote:"Gebruikelijke eindtijd (bv. 15:00, 23:30; 01:30 = na middernacht, blijft bij de servicedag). Verdict vraagt het cijfer direct daarna. Zonder tijd vraagt het na middernacht.",finJour:"Hele dag",aRens:"In te vullen",pVeilleSvc:"{s} van {j}: nog niet ingevuld. Vul het zo snel mogelijk in; Verdict werkt meteen bij.",pVeilleJour:"Dag {j}: nog niet ingevuld. Vul hem zo snel mogelijk in; Verdict werkt meteen bij.",pSvcFini:"{s} afgelopen om {h}: nog niet ingevuld. Vul het nu in; Verdict werkt meteen bij.",pJourFini:"Dag afgelopen om {h}: nog niet ingevuld. Vul hem nu in; Verdict werkt meteen bij."},
    pt:{finTitre:"Fim de cada serviço",finNote:"Hora habitual de fim (ex. 15:00, 23:30; 01:30 = depois da meia-noite, fica no dia do serviço). O Verdict pede o valor logo a seguir. Sem hora, pede depois da meia-noite.",finJour:"Dia inteiro",aRens:"Por registar",pVeilleSvc:"{s} de {j}: ainda não registado. Registe-o assim que puder; o Verdict atualiza-se logo.",pVeilleJour:"Dia {j}: ainda não registado. Registe-o assim que puder; o Verdict atualiza-se logo.",pSvcFini:"{s} terminado às {h}: ainda não registado. Registe-o agora; o Verdict atualiza-se logo.",pJourFini:"Dia terminado às {h}: ainda não registado. Registe-o agora; o Verdict atualiza-se logo."}
  };
  Object.keys(T2).forEach(function(l){if(T[l])Object.keys(T2[l]).forEach(function(k){T[l][k]=T2[l][k];});});
  function L(){var l=(typeof global.LOCALE==="string"?global.LOCALE:"fr");return T[l]||T.fr;}
  function tpl(s,v){return String(s).replace(/\{(\w+)\}/g,function(m,k){return v[k]!=null?v[k]:m;});}
  function fr(n){n=Math.round(Number(n)||0);var s=String(Math.abs(n)),o="";while(s.length>3){o="\u202f"+s.slice(-3)+o;s=s.slice(0,-3);}return (n<0?"\u2212":"")+s+o;}
  function eur(n){return fr(n)+"\u00a0€";}
  function DBx(){return global.DB||null;}
  function config(){var d=DBx();if(!d)return null;if(!d.servicesConfig||!d.servicesConfig.semaine){d.servicesConfig={semaine:{}};}return d.servicesConfig;}
  function servicesDu(w){var c=config();if(!c)return [];var s=c.semaine[String(w)];return Array.isArray(s)?s.filter(function(x){return IDS.indexOf(x)>=0;}):[];}
  function clock(){try{return global.verdictOperationalClock();}catch(e){return null;}}
  function weekday(key){var p=key.split("-");return (new Date(+p[0],+p[1]-1,+p[2]).getDay()+6)%7;}
  function jourKey(){var c=clock();return c?c.key:null;}
  function saisies(key){var d=DBx();if(!d)return {};d.servicesJour=d.servicesJour||{};return d.servicesJour[key]||{};}
  function objectifJour(){var c=clock();if(!c)return null;try{var o=global.calObjectifJour(c.day);return o!=null&&isFinite(o)&&o>0?Number(o):null;}catch(e){return null;}}
  /* part habituelle d'un service dans les journées COMPLÈTES du même jour de semaine (8 dernières) */
  function partRef(id,w){var d=DBx();if(!d||!d.servicesJour)return null;var keys=Object.keys(d.servicesJour).sort().reverse(),tot=0,part=0,n=0;
    for(var i=0;i<keys.length&&n<8;i++){var k=keys[i];if(k===jourKey())continue;if(weekday(k)!==w)continue;var s=d.servicesJour[k],need=servicesDu(w);
      if(!need.length||!need.every(function(x){return s[x]&&isFinite(s[x].ca);}))continue;
      var sum=0;need.forEach(function(x){sum+=Number(s[x].ca)||0;});if(!(sum>0)||!s[id])continue;part+=Number(s[id].ca)/sum;tot++;n++;}
    return tot>=2?part/tot:null;}
  /* état du jour : services attendus, saisis, total, reste, projection */
  function etatJour(){var c=clock();if(!c)return null;if(DBx()&&DBx().chrDays&&DBx().chrDays[c.key])return null;try{if(global.estFerme&&global.estFerme(c.day))return null;}catch(e){}var w=(new Date(c.year,c.month-1,c.day).getDay()+6)%7,need=servicesDu(w);if(need.length<2)return null;
    var s=saisies(c.key),total=0,tk=0,faits=[],avenir=[];
    need.forEach(function(id){if(s[id]&&isFinite(s[id].ca)){total+=Number(s[id].ca);tk+=Number(s[id].tk)||0;faits.push(id);}else avenir.push(id);});
    var obj=objectifJour(),reste=obj!=null?obj-total:null,proj=null,refs=[];
    if(faits.length&&avenir.length){var pf=0,ok=true;faits.forEach(function(id){var p=partRef(id,w);if(p==null)ok=false;else{pf+=p;refs.push({id:id,part:p});}});if(ok&&pf>0.05)proj=total/pf;}
    return {w:w,need:need,faits:faits,avenir:avenir,total:total,tk:tk,obj:obj,reste:reste,proj:proj,refs:refs,complet:avenir.length===0,libelles:need.map(function(id){return L()[id];})};}
  /* ---------- une seule saisie : le calendrier (Fermé) pilote aussi la structure (jours ouverts / semaine) ---------- */
  function alignerStructure(recalc){var d=DBx();if(!d)return;var ouverts=7-(function(){try{return (global.fermesSem()||[]).length;}catch(e){return 0;}})();
    if(ouverts<1)ouverts=1;d.in=d.in||{};if(Number(d.in.jsem)!==ouverts){d.in.jsem=ouverts;var f=doc.getElementById("i-jsem");if(f)f.value=String(ouverts);try{global.save();}catch(e){}
      if(recalc){try{global.refreshAll();}catch(e){}try{global.toast(tpl(L().deduit,{j:ouverts}));}catch(e){}}}}
  function verrouillerJsem(){var f=doc.getElementById("i-jsem");if(!f)return;var ouverts=7-(function(){try{return (global.fermesSem()||[]).length;}catch(e){return 0;}})();
    if(!f.readOnly)f.readOnly=true;if(f.getAttribute("aria-readonly")!=="true")f.setAttribute("aria-readonly","true");if(f.style.opacity!=="0.6")f.style.opacity=".6";var vj=String(Number(DBx().in&&DBx().in.jsem)||ouverts);if(f.value!==vj)f.value=vj;
    var lab=f.closest("label");if(lab&&!lab.querySelector(".svc-deduit")){var sm=doc.createElement("small");sm.className="svc-deduit";sm.textContent=tpl(L().deduit,{j:ouverts});lab.appendChild(sm);}}
  /* ---------- réglage : carte « Mes services » dans Mes chiffres ---------- */
  function majCarte(el){var t=L(),fe=(function(){try{return global.fermesSem()||[];}catch(e){return [];}})();
    for(var w=0;w<7;w++){var row=el.querySelector('.svc-row[data-w="'+w+'"]'),b=row&&row.querySelector('.svc-ferme'),on=fe.indexOf(w)>=0;if(b){if(b.getAttribute("aria-pressed")!==String(on))b.setAttribute("aria-pressed",String(on));if(row.getAttribute("data-ferme")!==(on?"1":"0"))row.setAttribute("data-ferme",on?"1":"0");}} /* C190 : n'écrire que ce qui change (0 changement au repos) */
    var ouverts=7-fe.length,jsem=DBx().in&&Number(DBx().in.jsem),ba=el.querySelector(".svc-aligner");
    if(isFinite(jsem)&&jsem!==ouverts){if(!ba){ba=doc.createElement("button");ba.type="button";ba.className="btn sec svc-aligner";el.appendChild(ba);ba.addEventListener("click",function(){alignerStructure(true);ba.remove();});}var tx=tpl(t.aligner,{j:jsem,c:ouverts});if(ba.textContent!==tx)ba.textContent=tx;}
    else if(ba)ba.remove();}
  function carteReglage(){var v=doc.getElementById("v-in");if(!v||v.offsetParent===null)return;var ex=doc.getElementById("svc-card");if(ex){majCarte(ex);return;}
    var ancre=v.querySelector(".card");if(!ancre)return;var t=L(),c=config();if(!c)return;
    var el=doc.createElement("div");el.id="svc-card";el.className="card";
    var h='<h3>'+t.titre+'</h3><p class="note" style="margin-top:0">'+t.sous+'</p><div class="svc-grid">';
    function fermes(){try{return global.fermesSem()||[];}catch(e){return [];}}
    var head='<div class="svc-row svc-head"><span></span><span class="svc-hf">'+t.ferme+'</span>'+IDS.map(function(id){return '<span>'+t[id]+'</span>';}).join("")+'</div>';h+=head;
    h+='<div class="svc-row" data-w="all"><b>'+t.tous+'</b><span></span>'+IDS.map(function(id){return '<button type="button" class="svc-t" data-w="all" data-id="'+id+'" aria-pressed="false"></button>';}).join("")+'</div>';
    for(var w=0;w<7;w++){var s=servicesDu(w),fe=fermes().indexOf(w)>=0;h+='<div class="svc-row" data-w="'+w+'" data-ferme="'+(fe?1:0)+'"><b>'+t.jours[w]+'</b><button type="button" class="svc-t svc-ferme" data-w="'+w+'" data-id="ferme" aria-pressed="'+fe+'" aria-label="'+t.ferme+'"></button>'+IDS.map(function(id){return '<button type="button" class="svc-t" data-w="'+w+'" data-id="'+id+'" aria-pressed="'+(s.indexOf(id)>=0)+'"></button>';}).join("")+'</div>';}
    var ouverts=7-fermes().length,jsem=DBx().in&&Number(DBx().in.jsem);
    h+='</div><p class="note">'+t.noteFerme+'</p><p class="note svc-unseul">'+t.unSeul+'</p>'+(isFinite(jsem)&&jsem!==ouverts?'<button type="button" class="btn sec svc-aligner">'+tpl(t.aligner,{j:jsem,c:ouverts})+'</button>':'');
    h+=finsHtml(t);el.innerHTML=h;ancre.parentNode.insertBefore(el,ancre.nextSibling);lierFins(el);
    var ba=el.querySelector(".svc-aligner");if(ba)ba.addEventListener("click",function(){alignerStructure(true);ba.remove();});
    verrouillerJsem();
    el.addEventListener("click",function(ev){var b=ev.target.closest(".svc-t");if(!b)return;var id=b.getAttribute("data-id"),w=b.getAttribute("data-w"),on=b.getAttribute("aria-pressed")!=="true";
      if(id==="ferme"){var wd=+w,closed=fermes().indexOf(wd)>=0;if(on!==closed){try{global.basculerFermeSem(wd);}catch(e){}}
        alignerStructure(true);
        b.setAttribute("aria-pressed",String(on));var row=el.querySelector('.svc-row[data-w="'+w+'"]');if(row)row.setAttribute("data-ferme",on?"1":"0");
        if(on){c.semaine[String(wd)]=[];row.querySelectorAll('.svc-t:not(.svc-ferme)').forEach(function(x){x.setAttribute("aria-pressed","false");});IDS.forEach(function(sid){var a=el.querySelector('.svc-t[data-w="all"][data-id="'+sid+'"]');if(a)a.setAttribute("aria-pressed","false");});try{global.save();}catch(e){}}
        return;}
      var ws=w==="all"?[0,1,2,3,4,5,6]:[+w];ws.forEach(function(x){var s=servicesDu(x).slice();if(on&&s.indexOf(id)<0)s.push(id);if(!on)s=s.filter(function(y){return y!==id;});c.semaine[String(x)]=IDS.filter(function(y){return s.indexOf(y)>=0;});});
      el.querySelectorAll('.svc-t[data-id="'+id+'"]').forEach(function(x){var xw=x.getAttribute("data-w");if(w==="all"||xw===w||xw==="all"&&false)x.setAttribute("aria-pressed",String(on));});
      if(w!=="all"){var allOn=[0,1,2,3,4,5,6].every(function(x){return servicesDu(x).indexOf(id)>=0;});el.querySelector('.svc-t[data-w="all"][data-id="'+id+'"]').setAttribute("aria-pressed",String(allOn));}
      try{global.save();}catch(e){}try{if(global.VIEW==="pil")global.drawPil();}catch(e){}});}
  /* ---------- saisie du jour : un champ par service ---------- */
  function carteSaisie(){var host=doc.getElementById("v36-today");if(!host||host.offsetParent===null)return;var e=etatJour(),c=clock();
    var deja=host.querySelector(".svc-form"),form=host.querySelector(".v25-day-form");
    if(!e||!c){if(deja)deja.remove();if(form)form.classList.remove("svc-on");host.classList.remove("svc-progress","svc-active");return;}
    if(form){var jf=form.querySelector("#pl-jour");if(jf&&Number(jf.value)!==c.day){if(deja)deja.remove();form.classList.remove("svc-on");return;}form.classList.add("svc-on");}
    var sig=JSON.stringify(e);if(deja&&deja.getAttribute("data-sig")===sig)return;if(deja)deja.remove();
    var t=L(),s=saisies(c.key),w=doc.createElement("div");w.className="svc-form";w.setAttribute("data-sig",sig);
    var h='';e.need.forEach(function(id){var v=s[id]||{};h+='<div class="svc-line" data-id="'+id+'"><b>'+t[id]+'</b><div class="v25-input-shell"><input inputmode="decimal" autocomplete="off" data-svc-ca="'+id+'" value="'+(v.ca!=null?String(Math.round(v.ca*100)/100).replace(".",","):"")+'"><b>€</b></div><input inputmode="numeric" autocomplete="off" data-svc-tk="'+id+'" placeholder="'+t.tickets+'" value="'+(v.tk!=null?v.tk:"")+'"></div>';});
    var etat=e.reste==null?"":(e.reste>0?tpl(t.reste,{x:eur(e.reste)}):tpl(t.depasse,{x:eur(-e.reste)}));
    var avancement=e.complet?t.complet:tpl(t.enCours,{n:e.faits.length,t:e.need.length,s:e.faits.length>1?"s":""});
    h+='<div class="svc-etat"><span class="svc-kick">'+t.saisi+' <b>'+eur(e.total)+'</b> · '+avancement+'</span>'+(etat?'<div class="svc-reste" data-neg="'+(e.reste>0)+'">'+etat+'</div>':'')+(e.proj?'<div class="svc-proj">'+tpl(t.proj,{x:eur(e.proj)})+'</div>':'')+
      e.refs.map(function(r){return '<div class="svc-ref">'+tpl(t.ref,{s:t[r.id].toLowerCase(),p:Math.round(r.part*100)+"\u00a0%"})+'</div>';}).join("")+'</div>';
    h+='<button type="button" class="v25-primary svc-save">'+t.enregistrer+'</button>';w.innerHTML=h;
    var carte=host.querySelector(".v25-today"),tete=carte&&carte.querySelector(".v25-today-head");
    if(tete&&tete.parentNode===carte)carte.insertBefore(w,tete.nextSibling);else if(carte)carte.appendChild(w);else host.appendChild(w);
    host.classList.toggle("svc-progress",!e.complet);host.classList.add("svc-active");
    w.querySelector(".svc-save").addEventListener("click",function(){var d=DBx();d.servicesJour=d.servicesJour||{};var rec=d.servicesJour[c.key]||{},tot=0,tk=0,any=false;
      e.need.forEach(function(id){var ca=parseFloat(String(w.querySelector('[data-svc-ca="'+id+'"]').value).replace(/\s/g,"").replace(",","."));var tkv=parseInt(w.querySelector('[data-svc-tk="'+id+'"]').value,10);
        if(isFinite(ca)&&ca>=0){rec[id]={ca:ca,tk:isFinite(tkv)?tkv:null};tot+=ca;tk+=isFinite(tkv)?tkv:0;any=true;}else delete rec[id];});
      if(!any)return;d.servicesJour[c.key]=rec;
      /* la journée écrite dans Verdict = la somme des services saisis (même chemin que la saisie classique, sans son formulaire) */
      try{global.enregistrerJourCalcule(c.day,Math.round(tot*100)/100,tk?tk:null);}catch(err){}
      try{global.save();}catch(err){}global.PIL_JOUR=null;global.PIL_EDIT_JOUR=null;
      var e2=etatJour();try{global.toast(e2&&e2.reste!=null?(e2.reste>0?tpl(t.reste,{x:eur(e2.reste)}):tpl(t.depasse,{x:eur(-e2.reste)})):t.complet);}catch(err){}
      try{global.drawPil();}catch(err){}try{global.refreshAll();}catch(err){}});}
  /* ---------- R131 : fins de service, et le chiffre attendu au bon moment ---------- */
  function fins(){var c=config();if(!c)return {};if(!c.fins||typeof c.fins!=="object")c.fins={};return c.fins;}
  function finDe(id){var f=fins()[id];return /^\d{2}:\d{2}$/.test(String(f||""))?String(f):null;}
  function finsHtml(t){var h='<div class="svc-fins"><p class="svc-ft"><b>'+t.finTitre+'</b></p><div class="svc-fins-g">';
    IDS.concat(["jour"]).forEach(function(id){h+='<label class="svc-fin"><span>'+(id==="jour"?t.finJour:t[id])+'</span><input type="time" data-fin="'+id+'" value="'+(finDe(id)||"")+'"></label>';});
    return h+'</div><p class="note">'+t.finNote+'</p></div>';}
  function lierFins(el){el.querySelectorAll("[data-fin]").forEach(function(i){i.addEventListener("change",function(){var f=fins(),id=i.getAttribute("data-fin"),v=String(i.value||"").slice(0,5);if(/^\d{2}:\d{2}$/.test(v))f[id]=v;else delete f[id];try{global.save();}catch(e){}try{if(global.VerdictPremiumEcrans)global.VerdictPremiumEcrans.poser();}catch(e){}});});}
  function decale(k,n){var p=k.split("-").map(Number),d=new Date(Date.UTC(p[0],p[1]-1,p[2]+n,12));return d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0")+"-"+String(d.getUTCDate()).padStart(2,"0");}
  function fermeLe(k,op){try{if(k.slice(0,7)===op.key.slice(0,7)&&global.estFerme)return !!global.estFerme(Number(k.slice(8)));}catch(e){}
    var d=DBx()||{};if((d.ouvertsJours||[]).indexOf(k)>=0)return false;if((d.fermesJours||[]).indexOf(k)>=0)return true;
    var pl=d.operatingClosures||[];for(var i=0;i<pl.length;i++)if(pl[i]&&pl[i].start<=k&&pl[i].end>=k)return true;
    var fs=[];try{fs=global.fermesSem()||[];}catch(e){}return fs.indexOf(weekday(k))>=0;}
  function ligneJour(k){var d=DBx()||{},rows=d.histJour||[];for(var i=0;i<rows.length;i++){var r=rows[i];if(r&&r.date===k&&(r.caJ!=null||r.ca!=null))return r;}return null;}
  /* Journée terminée à minuit. Un service est attendu dès son heure de fin (après minuit : il reste
     sur son jour). Sans heure de fin, la journée est attendue après minuit. Aucune donnée : rien. */
  function aRenseigner(at){var op=null;try{op=global.VerdictServiceDay.clock(at==null?Date.now():at,DBx()||{});}catch(e){op=clock();}if(!op)return null;
    var d=DBx()||{},today=op.key,now=op.civilKey+"T"+String(op.hour).padStart(2,"0")+":"+String(op.minute).padStart(2,"0");
    var depuis=decale(today,-14),actif=(d.histJour||[]).some(function(r){return r&&r.date>=depuis&&r.date<=today&&(r.caJ!=null||r.ca!=null);});if(!actif)return null;
    var jours=[decale(today,-1),today];
    var debutSuivi=String(d.performanceTrackingStartedAt||'').slice(0,10);for(var i=0;i<jours.length;i++){var k=jours[i];if(debutSuivi&&k<debutSuivi)continue;if(d.chrDays&&d.chrDays[k])continue;if(fermeLe(k,op))continue;
      var need=servicesDu(weekday(k)),rec=(d.servicesJour||{})[k]||{},parSvc=need.length>=2,aSvc=Object.keys(rec).some(function(id){return rec[id]&&isFinite(rec[id].ca);});
      if(!parSvc||!aSvc){if(ligneJour(k))continue;}
      var unites=parSvc?need:["jour"];
      for(var u=0;u<unites.length;u++){var id=unites[u];if(id!=="jour"&&rec[id]&&isFinite(rec[id].ca))continue;
        var f=id==="jour"?(need.length===1?(finDe(need[0])||finDe("jour")):finDe("jour")):finDe(id),apres=!!(f&&Number(f.slice(0,2))<12&&id!=="matin"&&id!=="midi");
        var du=f?((apres?decale(k,1):k)+"T"+f):(decale(k,1)+"T00:00");
        if(now>=du)return {date:k,id:id,veille:k<today,fin:f,libelle:id==="jour"?L().finJour:L()[id],need:parSvc?need.slice():null};
        break;}
    }
    return null;}
  function texte(p){var t=L(),loc=(typeof global.LOCALE==="string"?global.LOCALE:"fr"),tag={fr:"fr-FR",en:"en-GB",es:"es-ES",it:"it-IT",de:"de-DE",nl:"nl-NL",pt:"pt-PT"}[loc]||"fr-FR",pp=String(p.date).split("-").map(Number),j;
    try{j=new Date(Date.UTC(pp[0],pp[1]-1,pp[2],12)).toLocaleDateString(tag,{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});}catch(e){j=p.date;}
    var s=p.id==="jour"?t.finJour:(t[p.id]||p.id);
    var ph=p.veille?tpl(p.id==="jour"?t.pVeilleJour:t.pVeilleSvc,{s:s,j:j}):tpl(p.id==="jour"?t.pJourFini:t.pSvcFini,{s:s,h:p.fin||""});
    return {chip:t.aRens,phrase:ph};}
  function appliquer(){try{carteReglage();}catch(e){}try{verrouillerJsem();}catch(e){}try{carteSaisie();}catch(e){}}
  var minut=null,dernier=0;function planifier(){if(minut)return;var tour=!!(doc.body&&doc.body.classList.contains('demo-tour-active')),d=tour?Math.max(400,2000-(Date.now()-dernier)):180;minut=global.setTimeout(function(){minut=null;dernier=Date.now();appliquer();},d);}
  global.VerdictServices={version:"R131-1.2.0",aligner:alignerStructure,etatJour:etatJour,servicesDu:servicesDu,appliquer:appliquer,libelle:function(id){return L()[id]||id;},T:L,aRenseigner:aRenseigner,texte:texte,fins:fins};
  if(global.MutationObserver&&doc.body)new MutationObserver(function(recs){for(var i=0;i<recs.length;i++){var r=recs[i];if(r.target&&r.target.closest&&r.target.closest("#svc-card,.svc-form"))continue;planifier();return;}}).observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
  var st=doc.createElement("style");st.textContent='.svc-grid{display:grid;gap:6px;margin:10px 0 6px}.svc-row{display:grid;grid-template-columns:1.25fr .9fr repeat(4,1fr);gap:6px;align-items:center}.svc-hf{color:#f97316!important}.svc-t.svc-ferme[aria-pressed="true"]{background:rgba(249,115,22,.16);border-color:rgba(249,115,22,.6);box-shadow:inset 0 0 0 1px rgba(249,115,22,.35)}.svc-t.svc-ferme[aria-pressed="true"]::after{background:#f97316}.svc-row[data-ferme="1"] .svc-t:not(.svc-ferme){opacity:.3;pointer-events:none}.svc-row b{font-size:13px}.svc-head span{font-size:11px;color:var(--mut2);text-align:center}.svc-unseul{color:#7DA2F5}.svc-aligner{margin-top:8px;width:100%;border-color:rgba(249,115,22,.6)!important;color:#f97316!important}.svc-t{height:34px;border-radius:10px;border:1px solid var(--line);background:transparent;cursor:pointer}.svc-t[aria-pressed="true"]{background:rgba(96,165,250,.16);border-color:rgba(96,165,250,.55);box-shadow:inset 0 0 0 1px rgba(96,165,250,.35)}.svc-t[aria-pressed="true"]::after{content:"";display:block;width:10px;height:10px;margin:0 auto;border-radius:50%;background:#60a5fa}.svc-form{margin-top:12px;display:grid;gap:10px}.svc-line{display:grid;grid-template-columns:1fr 1.6fr 1fr;gap:8px;align-items:center}.svc-line b{font-size:14px}.svc-line input{width:100%;background:#0F1216;border:1px solid var(--line);border-radius:12px;padding:11px 12px;color:var(--txt);font-size:16px;font-weight:600}.svc-etat{padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid var(--line)}.svc-kick{font-size:13px;color:var(--mut)}.svc-reste{margin-top:6px;font-size:17px;font-weight:750;letter-spacing:-.01em}.svc-reste[data-neg="true"]{color:#eab308}.svc-reste[data-neg="false"]{color:#22c55e}.svc-proj,.svc-ref{margin-top:4px;font-size:13px;color:var(--mut)}.v25-day-form.svc-on > .v25-form-grid,.v25-day-form.svc-on > .v25-form-foot{display:none!important}#v36-today.svc-active .v25-today-body{display:none!important}#v36-today.svc-progress .v25-today{border-color:rgba(96,165,250,.45)!important;box-shadow:inset 3px 0 0 #60a5fa!important}#v36-today.svc-progress .v25-state{color:#7DA2F5!important;border-color:rgba(125,162,245,.4)!important}';
  doc.head.appendChild(st);
  /* R131 : quand un service devient attendu (fin de service, minuit), l'accueil se met à jour seul. */
  var dernierPend="";function veillePend(){var p=null;try{p=aRenseigner();}catch(e){}var k=p?p.date+":"+p.id:"";if(k!==dernierPend){try{if(global.VerdictPremiumEcrans)global.VerdictPremiumEcrans.poser();}catch(e){}}dernierPend=k;}
  global.setInterval(veillePend,60000);doc.addEventListener("visibilitychange",function(){if(!doc.hidden)veillePend();});
  var st2=doc.createElement("style");st2.textContent=".svc-fins{margin-top:14px}.svc-ft{margin:0 0 8px}.svc-fins-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}.svc-fin{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--mut2)}.svc-fin input{height:44px;min-width:0;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.04);color:inherit;padding:0 10px;font:inherit;font-size:15px}";doc.head.appendChild(st2);
  planifier();global.addEventListener("load",planifier);global.setTimeout(planifier,1200);
})(window);

