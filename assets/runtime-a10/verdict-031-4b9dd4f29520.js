(function(){
  var ov=document.createElement('div'); ov.id='shSco';
  ov.className='modal';ov.setAttribute('aria-hidden','true');
  ov.innerHTML='<div class="p"></div>';
  document.body.appendChild(ov);
  function closeScoreSheet(){if(!ov.classList.contains('on'))return;try{a11yDialogRestore(ov);}catch(e){}ov.classList.remove('on');ov.setAttribute('aria-hidden','true');}
  window.scoreSheetClose=closeScoreSheet;
  ov.addEventListener('click',function(e){ if(e.target===ov)closeScoreSheet(); });
function row(lbl,val){
    var z=zone(val);
    return '<div class="shrow"><span>'+esc(lbl)+'</span><div class="bar"><i style="width:'+Math.max(2,Math.min(100,val))+'%;background:'+z.h+'"></i></div><b style="color:'+z.h+'">'+Math.round(val)+'</b></div>';
  }

  function scoreActionCopy(){
    var I={fr:{back:"Revenir au résultat",act:'Agir sur cette priorité',all:'Voir mes actions'},en:{back:"Back to the result",act:'Act on this priority',all:'See my actions'},es:{back:"Volver al resultado",act:'Actuar sobre esta prioridad',all:'Ver mis acciones'},it:{back:"Torna al risultato",act:'Intervenire su questa priorità',all:'Vedere le mie azioni'},de:{back:"Zurück zum Ergebnis",act:'Diese Priorität bearbeiten',all:'Meine Maßnahmen ansehen'},nl:{back:"Terug naar het resultaat",act:'Deze prioriteit aanpakken',all:'Mijn acties bekijken'},pt:{back:"Voltar ao resultado",act:'Agir sobre esta prioridade',all:'Ver as minhas ações'}};
    return I[typeof LOCALE==='string'?LOCALE:'fr']||I.fr;
  }
  window.scoreSheetReturnLabel=function(){return scoreActionCopy().back;};
  window.scoreSheetGoPriority=function(){
    if(window.VERDICT_SCORE_ACTION_LINKS!==true)return false;
    var impact=null;try{impact=auImpactPrioritaire();}catch(e){}
    var p=impact&&impact.priority,route=p&&(p.routeId||p.id),dest=route&&prioDest(route);
    closeScoreSheet();
    if(dest){prioAller(route);if(PRIO_RETOUR){PRIO_RETOUR.scoreSheet=true;PRIO_RETOUR.scoreTarget=dest.champ||null;}}
    else{PRIO_RETOUR={v:VIEW,y:window.scrollY,scoreSheet:true};go('priorities');prioChipRetour();}
    return true;
  };
  function scoreSheetCopy(){
    var I={
      fr:{title:'Score Verdict® global, en détail',close:'Fermer',final:'Score Verdict® final',calc:'{n}/12 indicateurs calculés. ',illustrative:'Ce résultat reste illustratif tant que les données du modèle ne sont pas remplacées par des observations.',verified:'Le moteur utilise les données vérifiées de cet établissement.',factor:'Le facteur limitant : ',factorD:'Cet indicateur obtient {s}/100, le niveau le plus faible des 12. Verdict le traite avant les leviers mieux notés.',action:'Action reliée au résultat : ',card:'Indice Carte disponible : {n} plat(s) actif(s). Elle est distincte de la Structure et n’entre dans aucune moyenne globale.',sim:'Le score affiché en haut reste une simulation estimative tant que les chiffres du modèle ne sont pas remplacés par des données observées.',prov:'Le score affiché en haut reste {s} tant que sa provenance n’autorise pas une lecture finale.',real:'La Structure explique le Score Verdict® global de l’établissement. L’Indice Carte évalue séparément la qualité exploitable de sa carte et ne modifie jamais ce score.'},
      en:{title:'Global Verdict® Global Verdict® Global Verdict® Score details',close:'Close',final:'Final Verdict® score',calc:'{n}/12 indicators calculated. ',illustrative:'This result remains illustrative until model estimates are replaced with observed data.',verified:'The engine uses verified data for this business.',factor:'Limiting factor: ',factorD:'This indicator scores {s}/100, the lowest of the 12. Verdict addresses it before stronger levers.',action:'Action linked to the result: ',card:'Menu Index available: {n} active dish(es). It is separate from the Structure analysis and is never included in an overall average.',sim:'The score above remains an estimated simulation until model figures are replaced with observed data.',prov:'The score above remains {s} until its provenance allows a final reading.',real:'The Structure analysis remains the business’s final Verdict score. The Menu Index separately assesses its usable menu; no overall average is calculated.'},
      es:{title:'Detalle de la puntuación',close:'Cerrar',final:'Puntuación Verdict® final',calc:'{n}/12 indicadores calculados. ',illustrative:'El resultado sigue siendo ilustrativo hasta sustituir las estimaciones por datos observados.',verified:'El motor utiliza los datos verificados del establecimiento.',factor:'Factor limitante: ',factorD:'Este indicador obtiene {s}/100, el nivel más bajo de los 12. Verdict lo trata antes que las palancas mejor puntuadas.',action:'Acción vinculada al resultado: ',card:'Índice de Carta disponible: {n} plato(s) activo(s). Es distinta de la análisis de Estructura y no entra en ningún promedio global.',sim:'La puntuación superior sigue siendo una simulación estimativa hasta sustituir las cifras por datos observados.',prov:'La puntuación superior sigue siendo {s} hasta que su procedencia permita una lectura final.',real:'La análisis de Estructura sigue siendo la puntuación Verdict final. El Índice de Carta evalúa la carta por separado; no se calcula ningún promedio global.'},
      it:{title:'Dettaglio del punteggio',close:'Chiudi',final:'Punteggio Verdict® finale',calc:'{n}/12 indicatori calcolati. ',illustrative:'Il risultato resta illustrativo finché le stime non sono sostituite da dati osservati.',verified:'Il motore usa i dati verificati del locale.',factor:'Fattore limitante: ',factorD:'Questo indicatore ottiene {s}/100, il valore più basso dei 12. Verdict lo tratta prima delle leve più forti.',action:'Azione collegata al risultato: ',card:'Indice Menu disponibile: {n} piatto/i attivo/i. È distinto dal analisi Struttura e non entra in alcuna media globale.',sim:'Il punteggio in alto resta una simulazione stimata finché le cifre non sono sostituite da dati osservati.',prov:'Il punteggio in alto resta {s} finché la provenienza non consente una lettura finale.',real:'Il punteggio in alto resta l’unico punteggio Verdict finale: legge la struttura del locale.'},
      de:{title:'Score im Detail',close:'Schließen',final:'Finaler Verdict®-Score',calc:'{n}/12 Kennzahlen berechnet. ',illustrative:'Das Ergebnis bleibt beispielhaft, bis Schätzwerte durch beobachtete Daten ersetzt sind.',verified:'Die Engine verwendet die geprüften Daten dieses Betriebs.',factor:'Begrenzender Faktor: ',factorD:'Diese Kennzahl erreicht {s}/100 und ist die schwächste der 12. Verdict behandelt sie vor stärkeren Hebeln.',action:'Mit dem Ergebnis verknüpfte Maßnahme: ',card:'Speisekarte verfügbar: {n} aktive Gerichte. Sie zeigt den Handlungsort, ohne einen zweiten Score zu erzeugen.',sim:'Der Score oben bleibt eine Schätzung, bis Modellwerte durch beobachtete Daten ersetzt sind.',prov:'Der Score oben bleibt {s}, bis seine Herkunft eine endgültige Lesung zulässt.',real:'Der Score oben bleibt der einzige endgültige Verdict-Score und liest die Betriebsstruktur.'},
      nl:{title:'Score in detail',close:'Sluiten',final:'Definitieve Verdict®-score',calc:'{n}/12 indicatoren berekend. ',illustrative:'Het resultaat blijft illustratief totdat schattingen zijn vervangen door waargenomen gegevens.',verified:'De motor gebruikt de geverifieerde gegevens van deze zaak.',factor:'Beperkende factor: ',factorD:'Deze indicator scoort {s}/100, de laagste van de 12. Verdict behandelt hem vóór sterkere hefbomen.',action:'Actie gekoppeld aan het resultaat: ',card:'Menukaartindex beschikbaar: {n} actieve gerechten. Deze staat los van de Structuuranalyse en telt niet mee in een totaalgemiddelde.',sim:'De score bovenaan blijft een schatting totdat modelcijfers zijn vervangen door waargenomen gegevens.',prov:'De score bovenaan blijft {s} totdat de herkomst een definitieve lezing toestaat.',real:'De Structuuranalyse blijft de definitieve Verdict-score. De Menukaartindex beoordeelt de bruikbare kaart afzonderlijk; er wordt geen totaalgemiddelde berekend.'},
      pt:{title:'Pontuação em detalhe',close:'Fechar',final:'Pontuação Verdict® final',calc:'{n}/12 indicadores calculados. ',illustrative:'O resultado continua ilustrativo até as estimativas serem substituídas por dados observados.',verified:'O motor utiliza os dados verificados deste estabelecimento.',factor:'Fator limitante: ',factorD:'Este indicador obtém {s}/100, o nível mais baixo dos 12. O Verdict trata-o antes das alavancas mais fortes.',action:'Ação ligada ao resultado: ',card:'Índice do Cardápio disponível: {n} prato(s) ativo(s). É separada da análise de Estrutura e não entra em nenhuma média global.',sim:'A pontuação no topo continua uma simulação estimada até os valores serem substituídos por dados observados.',prov:'A pontuação no topo continua {s} até a proveniência permitir uma leitura final.',real:'A análise de Estrutura explica a Pontuação Verdict® global. O Índice do Cardápio é independente e nunca altera essa pontuação.'}
    };
    var l=typeof LOCALE==='string'?LOCALE:'fr',out=I[l]||I.fr;
    var D={
      fr:{title:'Score Verdict® global, en détail',final:'Score Verdict® global',card:'Indice Carte disponible : {n} plat(s) actif(s). Il mesure la fiabilité et la contribution matière de la carte, indépendamment du Score Verdict® global.',real:'La Structure explique le Score Verdict® global affiché en continu. L’Indice Carte reste indépendant et ne modifie jamais ce score.'},
      en:{title:'Global Verdict® Global Verdict® Score details',final:'Global Verdict® Score',card:'Menu Index available: {n} active dish(es). It measures menu data reliability and food contribution independently from the global Verdict® Score.',real:'The Structure analysis explains the global Verdict® Score shown continuously. The Menu Index remains independent and never changes that score.'},
      es:{title:'Puntuación Verdict® global, en detalle',final:'Puntuación Verdict® global',card:'Índice de Carta disponible: {n} plato(s) activo(s). Mide la fiabilidad y la contribución de materia independientemente de la Puntuación Verdict® global.',real:'El análisis de Estructura explica la Puntuación Verdict® global mostrada continuamente. El Índice de Carta es independiente y nunca modifica esa puntuación.'},
      it:{title:'Punteggio Verdict® globale, in dettaglio',final:'Punteggio Verdict® globale',card:'Indice Menu disponibile: {n} piatto/i attivo/i. Misura affidabilità e contributo materia indipendentemente dal Punteggio Verdict® globale.',real:'L’analisi Struttura spiega il Punteggio Verdict® globale sempre visibile. L’Indice Menu resta indipendente e non modifica mai quel punteggio.'},
      de:{title:'Globaler Verdict®-Score im Detail',final:'Globaler Verdict®-Score',card:'Kartenindex verfügbar: {n} aktive Gerichte. Sie misst Datenqualität und Warenbeitrag unabhängig vom globalen Verdict®-Score.',real:'Die Strukturanalyse erklärt den ständig sichtbaren globalen Verdict®-Score. Der Kartenindex bleibt unabhängig und ändert diesen Score nie.'},
      nl:{title:'Globale Verdict®-score in detail',final:'Globale Verdict®-score',card:'Menukaartindex beschikbaar: {n} actieve gerechten. Deze meet betrouwbaarheid en goederenbijdrage onafhankelijk van de globale Verdict®-score.',real:'De structuuranalyse verklaart de steeds zichtbare globale Verdict®-score. De Menukaartindex blijft onafhankelijk en wijzigt die score nooit.'},
      pt:{title:'Pontuação Verdict® global, em detalhe',final:'Pontuação Verdict® global',card:'Índice do Cardápio disponível: {n} prato(s) ativo(s). Mede confiabilidade e contribuição de matéria independentemente da Pontuação Verdict® global.',real:'A análise de Estrutura explica a Pontuação Verdict® global sempre visível. O Índice do Cardápio permanece independente e nunca altera essa pontuação.'}
    };
    var O=D[l]||D.fr;out.title=O.title;out.final=O.final;out.card=O.card;out.real=O.real;
    return out;
  }
  window.scoreSheet=function(){
    if(typeof estModeRecent==='function'&&estModeRecent()){recentFeatureGate('score');return;}
    var R; try{ R=moteur(); }catch(e){}
    if(!R||!R.ready){ goRap('saisie','in'); return; }
    try{demoScoreCueStop();}catch(e){}
    var z=zone(R.score),sim=verdictScoreIsSimulation(R),truth=verdictScoreTruth(R),L=scoreSheetCopy(),H=scoreHierarchyCopy(),h='<div class="shhead"><h3>'+esc(L.title)+'</h3><button type="button" class="shtopx" onclick="scoreSheetClose()" aria-label="'+esc(L.close)+'">×</button></div>'+verdictScoreNoticeHTML(R,true);
    h+='<div class="shrow big"><span>'+esc(H.global)+'</span><b style="color:'+z.h+'">'+Math.round(R.score)+'</b></div>';
    var replayCopy=verdictScoreReplayCopy();
    if(verdictIntroScoreDisponible(R)){
      h+=verdictScoreReplayReduced()?'<p class="shd" data-score-animation-reduced>'+esc(replayCopy[1])+'</p>':
        '<button type="button" class="shx" data-score-replay onclick="verdictScoreReplay()">'+esc(replayCopy[0])+'</button>';
    }
    h+='<p class="shd score-hierarchy-note"><strong>'+esc(H.structure)+'</strong><br>'+esc(H.structureLong)+'</p>';
    var indicatorCount=0;try{Object.keys(R.s||{}).forEach(function(k){if(R.s[k]!=null&&isFinite(R.s[k]))indicatorCount++;});}catch(e){}
    h+='<p class="shd">'+esc(L.calc.replace('{n}',indicatorCount))+esc(!truth.final?L.illustrative:L.verified)+'</p>';
    h+=row(t('d.n1'),R.n1)+row(t('d.n2'),R.n2)+row(t('d.n3'),R.n3);
    try{h+='<div class="shproof">'+demoScoreProof(R)+'</div>';}catch(e){}
    var fl=scFacteurLimitant(R);
    if(fl){ var zf=zone(fl.s);
      h+='<div class="shlim" style="border-color:'+zf.h+'"><b>'+esc(L.factor)+t('ind.'+fl.k)+'</b>'+esc(L.factorD.replace('{s}',Math.round(fl.s)))+'</div>'; }
    try{var P=auImpactPrioritaire();if(P&&P.kind!=='none')h+='<div class="shlim" style="border-color:'+z.h+'"><b>'+esc(L.action)+esc(P.title)+'</b>'+esc(P.value)+(P.explanation?'<br>'+esc(P.explanation):'')+'</div>';}catch(e){}
    if(DB.plats&&DB.plats.length){try{var C=carteStats(),cn=(C&&C.actifs)||DB.plats.length;h+='<p class="shd" style="margin-top:14px">'+esc(L.card.replace('{n}',cn))+'</p>';}catch(e){}}
    if(R.cap<100){ h+='<div class="shlim" style="border-color:'+z.h+'">'+t('d.capWarn')+'</div>'; }
    h+='<p class="shn">'+esc(!truth.final?(sim?L.sim:L.prov.replace('{s}',verdictScoreText('score',R))):L.real)+'</p>';
    if(window.VERDICT_SCORE_ACTION_LINKS===true){var actionCopy=scoreActionCopy();h+='<button type="button" class="shx" onclick="scoreSheetGoPriority()">'+esc(P&&P.priority?actionCopy.act:actionCopy.all)+'</button>';}
    h+='<button type="button" class="shx" onclick="scoreSheetClose()">'+esc(L.close)+'</button>';
    ov.querySelector('.p').innerHTML=h;try{translateDOM(ov);}catch(e){}try{if(window.VerdictClientVocabulary)window.VerdictClientVocabulary.apply(ov);}catch(e){}
    ov.setAttribute('aria-hidden','false');ov.classList.add('on');try{a11yDialogPrepare(ov);}catch(e){}
  };
})();