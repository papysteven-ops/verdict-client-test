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
      score:'Score Verdict®',caNet:'CA HT annuel → résultat avant impôt',caNetM:'Par mois : CA HT → résultat avant impôt',ofCa:'du CA',netWord:'avant impôt',better_net:'meilleur = plus grande part du CA qui reste',ticket:'Ticket moyen HT',cmd:'Commandes / jour',mat:'Ratio matière',ms:'Masse salariale chargée',prime:'Prime cost (matière + équipe)',marge:'Marge avant impôt',pm:'Point mort (part du CA)',
      vera:'Vera',veraSpread:'C’est {m} qui sépare le plus vos dossiers : {best} à {vb}, {worst} à {vw}. Levier à regarder en premier dans {worst}.',
      veraOne:'Il faut au moins deux dossiers calculables pour comparer.',need2:'Ajoutez un second établissement pour comparer.',
      better_low:'plus bas = mieux',better_high:'plus haut = mieux',neutral:'selon le concept',ofSales:'de CA',above:'au-dessus de la médiane',below:'sous la médiane',good:'mieux',bad:'moins bien',
      sub:{score:'la synthèse Verdict® sur 100',caNet:'ce qui reste sur le CA une fois toutes les charges payées, avant impôt',caNetM:'la même lecture, mois par mois',ticket:'dépense moyenne par commande',cmd:'la fréquentation',mat:'part du CA partie en matières premières',ms:'part du CA partie en salaires chargés',prime:'matière + équipe : le couple à surveiller',pm:'part du CA nécessaire pour payer toutes les charges ; sous 100 %, on gagne'},
      tabRank:'Classement',tabTable:'Côte à côte',etabs:'établissements',fAll:'Tous',fReal:'Réels',fModel:'Modèles',fCrit:'Critiques',search:'Rechercher un établissement',noMatch:'Aucun établissement ne correspond.',pick:'Comparer',pickTitle:'Ajouter au côte à côte (2 à 4)',pickHint:'Cochez 2 à 4 établissements dans le Classement pour les comparer ligne par ligne.',chipMat:'Matière',chipMs:'Équipe',chipPrime:'Prime cost',chipPm:'Point mort',openEtab:'Ouvrir',barHide:'Masquer de l\u2019accueil',barShow:'Remettre à l\u2019accueil',barHiddenTag:'masqué de l\u2019accueil',
      overall:'Performance générale',overallSub:'indice de 0 à 100 : rang moyen du dossier sur les repères comparables (score, CA → net, matière, équipe, prime cost, point mort, fréquentation)',rank:'rang',of:'sur',podium:'Meilleur performeur général',podiumSub:'classement de tous les dossiers calculables',hide:'Cacher',hideTitle:'Cacher ce dossier : ses données sont conservées, il sort de la barre et de la comparaison ; réaffichable depuis ⚙ Gérer',hidden:'dossier(s) caché(s)',manage:'Gérer / réafficher',deletedTxt:'dossier(s) supprimé(s) définitivement',resetAll:'Rétablir tous les dossiers d\u2019origine',notCalc:'non calculable',alone:'Seul établissement calculé pour l\u2019instant : son classement viendra quand un deuxième aura ses propres chiffres.',scoreOwn:'Indice de sérénité',
      levels:['CRITIQUE','FRAGILE','CORRECTE','SAINE'],rep:{caNet:'repères 2025 : résultat < 0 % du CA critique (un quart des restaurants) · 0-2 % fragile · 2-4,5 % correcte · ≥ 4,5 % saine (moyenne nationale : 4,5 % traditionnel, 3,9 % rapide — Observatoire UMIH/OEC)',caNetM:'mêmes repères que la ligne annuelle',mat:'repères CHR : < 28 % saine · 28-32 % correcte · 32-35 % fragile · > 35 % critique (moyenne 2025 : 30,7 % traditionnel, 31,3 % rapide)',ms:'repères 2025 : ≤ 33 % saine · 33-38 % correcte · 38-42 % fragile · > 42 % critique (moyenne : 37,3 % traditionnel, 28,3 % rapide)',prime:'repères 2025 : ≤ 62 % saine · 62-68 % correcte · 68-72 % fragile · > 72 % critique (moyenne : 68 % traditionnel, 60 % rapide)',pm:'repères : < 80 % saine · 80-90 % correcte · 90-100 % fragile · > 100 % critique (on perd de l\u2019argent)'},
      why:{score:'le score le plus haut',caNet:'garde la plus grande part de son CA',caNetM:'garde la plus grande part de son CA',cmd:'le plus de commandes par jour',mat:'la matière la plus basse',ms:'l\u2019équipe la plus légère',prime:'matière + équipe les plus bas',pm:'le point mort le plus bas'}},
  en:{open:'Compare',title:'Compare my establishments',kicker:'Side by side',lead:'The same benchmarks for every file, computed by the Verdict® engine. The best value of each row is marked; the gap is given against the group median.',
      close:'Close',ind:'Indicator',median:'median',best:'best',na:'—',incomplete:'Incomplete data',complete:'Complete',
      indicative:'Indicative reading: not all files are comparable closed years (see the nature under each column). No winner is declared.',
      conclusive:'Comparable files: closed years, same bases.',
      score:'Verdict® score',caNet:'Annual net sales → result before tax',caNetM:'Per month: net sales → result before tax',ofCa:'of sales',netWord:'before tax',better_net:'best = largest share of sales kept',ticket:'Average ticket (net)',cmd:'Orders / day',mat:'Food cost ratio',ms:'Loaded labour cost',prime:'Prime cost (food + labour)',marge:'Margin before tax',pm:'Break-even (share of sales)',
      vera:'Vera',veraSpread:'{m} separates your files the most: {best} at {vb}, {worst} at {vw}. First lever to look at in {worst}.',
      veraOne:'At least two computable files are needed to compare.',need2:'Add a second establishment to compare.',
      better_low:'lower is better',better_high:'higher is better',neutral:'depends on the concept',ofSales:'of sales',above:'above the median',below:'below the median',good:'better',bad:'worse',
      sub:{score:'the Verdict® summary out of 100',caNet:'what is left of sales once every cost is paid, before tax',caNetM:'the same reading, month by month',ticket:'average spend per order',cmd:'footfall',mat:'share of sales spent on raw materials',ms:'share of sales spent on loaded wages',prime:'food + labour: the pair to watch',pm:'share of sales needed to pay every cost; below 100 % you earn'},
      tabRank:'Ranking',tabTable:'Side by side',etabs:'establishments',fAll:'All',fReal:'Real',fModel:'Models',fCrit:'Critical',search:'Search an establishment',noMatch:'No establishment matches.',pick:'Compare',pickTitle:'Add to side by side (2 to 4)',pickHint:'Tick 2 to 4 establishments in the Ranking to compare them line by line.',chipMat:'Food',chipMs:'Labour',chipPrime:'Prime cost',chipPm:'Break-even',openEtab:'Open',barHide:'Hide from home',barShow:'Show on home',barHiddenTag:'hidden from home',
      overall:'Overall performance',overallSub:'index from 0 to 100: the file\u2019s average rank over the comparable benchmarks (score, sales → net, food, labour, prime cost, break-even, footfall)',rank:'rank',of:'of',podium:'Best overall performer',podiumSub:'ranking of every computable file',hide:'Hide',hideTitle:'Hide this file: its data is kept, it leaves the bar and the comparison; restorable from ⚙ Manage',hidden:'hidden file(s)',manage:'Manage / restore',deletedTxt:'file(s) deleted for good',resetAll:'Restore every original file',notCalc:'not computable',alone:'The only establishment calculated so far: it will be ranked once a second one has its own figures.',scoreOwn:'Serenity index',
      levels:['CRITICAL','FRAGILE','FAIR','HEALTHY'],rep:{caNet:'2025 benchmarks: result < 0 % of sales critical (a quarter of restaurants) · 0-2 % fragile · 2-4.5 % fair · ≥ 4.5 % healthy (French average: 4.5 % full-service, 3.9 % quick-service — UMIH/OEC)',caNetM:'same benchmarks as the yearly line',mat:'industry benchmarks: < 28 % healthy · 28-32 % fair · 32-35 % fragile · > 35 % critical',ms:'2025 benchmarks: ≤ 33 % healthy · 33-38 % fair · 38-42 % fragile · > 42 % critical (average: 37.3 % full-service, 28.3 % quick-service)',prime:'2025 benchmarks: ≤ 62 % healthy · 62-68 % fair · 68-72 % fragile · > 72 % critical (average: 68 % full-service, 60 % quick-service)',pm:'benchmarks: < 80 % healthy · 80-90 % fair · 90-100 % fragile · > 100 % critical (money is lost)'},
      why:{score:'the highest score',caNet:'keeps the largest share of its sales',caNetM:'keeps the largest share of its sales',cmd:'the most orders per day',mat:'the lowest food cost',ms:'the lightest labour cost',prime:'lowest food + labour',pm:'the lowest break-even'}}
};
/* es, it, de, nl, pt — ajoutés le 16/10/2026 (langues-complements). Une clé absente reprend le français. */
(function(){function m(a,b){if(b===undefined)return a;if(Array.isArray(a)||typeof a!=='object'||a===null)return b;var o={};for(var k in a)o[k]=m(a[k],b[k]);return o;}
var X={
es:{open:'Comparar',title:'Comparar mis establecimientos',kicker:'Lectura en paralelo',lead:'Las mismas referencias para cada expediente, calculadas por el motor Verdict®. Se marca el mejor valor de cada línea; la diferencia se da respecto a la mediana del grupo.',
  close:'Cerrar',ind:'Indicador',median:'mediana',best:'mejor',incomplete:'Datos incompletos',complete:'Completar',
  indicative:'Lectura indicativa: no todos los expedientes son ejercicios cerrados comparables (vea la naturaleza bajo cada columna). No se proclama ningún ganador.',
  conclusive:'Expedientes comparables: ejercicios cerrados, mismas bases.',
  score:'Puntuación Verdict®',caNet:'Ventas anuales sin IVA → resultado antes de impuestos',caNetM:'Por mes: ventas sin IVA → resultado antes de impuestos',ofCa:'de las ventas',netWord:'antes de impuestos',better_net:'mejor = mayor parte de las ventas que queda',ticket:'Ticket medio sin IVA',cmd:'Pedidos / día',mat:'Ratio de materia prima',ms:'Coste total de personal',prime:'Prime cost (materia + equipo)',marge:'Margen antes de impuestos',pm:'Punto de equilibrio (parte de las ventas)',
  veraSpread:'Es {m} lo que más separa sus expedientes: {best} con {vb}, {worst} con {vw}. Palanca que mirar primero en {worst}.',
  veraOne:'Hacen falta al menos dos expedientes calculables para comparar.',need2:'Añada un segundo establecimiento para comparar.',
  better_low:'más bajo = mejor',better_high:'más alto = mejor',neutral:'según el concepto',ofSales:'de ventas',above:'por encima de la mediana',below:'por debajo de la mediana',good:'mejor',bad:'peor',
  sub:{score:'la síntesis Verdict® sobre 100',caNet:'lo que queda de las ventas una vez pagados todos los gastos, antes de impuestos',caNetM:'la misma lectura, mes a mes',ticket:'gasto medio por pedido',cmd:'la afluencia',mat:'parte de las ventas destinada a materias primas',ms:'parte de las ventas destinada a salarios con cargas',prime:'materia + equipo: la pareja que vigilar',pm:'parte de las ventas necesaria para pagar todos los gastos; por debajo del 100 %, se gana'},
  tabRank:'Clasificación',tabTable:'En paralelo',etabs:'establecimientos',fAll:'Todos',fReal:'Reales',fModel:'Modelos',fCrit:'Críticos',search:'Buscar un establecimiento',noMatch:'Ningún establecimiento coincide.',pick:'Comparar',pickTitle:'Añadir a la comparación (2 a 4)',pickHint:'Marque de 2 a 4 establecimientos en la Clasificación para compararlos línea por línea.',chipMat:'Materia',chipMs:'Equipo',chipPrime:'Prime cost',chipPm:'Equilibrio',openEtab:'Abrir',barHide:'Ocultar del inicio',barShow:'Volver a mostrar en el inicio',barHiddenTag:'oculto del inicio',
  overall:'Rendimiento general',overallSub:'índice de 0 a 100: rango medio del expediente en las referencias comparables (puntuación, ventas → neto, materia, equipo, prime cost, equilibrio, afluencia)',rank:'rango',of:'de',podium:'Mejor rendimiento general',podiumSub:'clasificación de todos los expedientes calculables',hide:'Ocultar',hideTitle:'Ocultar este expediente: sus datos se conservan, sale de la barra y de la comparación; se puede volver a mostrar desde ⚙ Gestionar',hidden:'expediente(s) oculto(s)',manage:'Gestionar / volver a mostrar',deletedTxt:'expediente(s) eliminado(s) definitivamente',resetAll:'Restablecer todos los expedientes de origen',notCalc:'no calculable',alone:'Único establecimiento calculado por ahora: se clasificará cuando un segundo tenga sus propias cifras.',scoreOwn:'Índice de serenidad',
  levels:['CRÍTICO','FRÁGIL','CORRECTO','SANO'],rep:{caNet:'referencias 2025 (Francia): resultado < 0 % de las ventas crítico (una cuarta parte de los restaurantes) · 0-2 % frágil · 2-4,5 % correcto · ≥ 4,5 % sano (media nacional: 4,5 % tradicional, 3,9 % rápida — Observatorio UMIH/OEC)',caNetM:'mismas referencias que la línea anual',mat:'referencias de hostelería: < 28 % sano · 28-32 % correcto · 32-35 % frágil · > 35 % crítico (media 2025: 30,7 % tradicional, 31,3 % rápida)',ms:'referencias 2025: ≤ 33 % sano · 33-38 % correcto · 38-42 % frágil · > 42 % crítico (media: 37,3 % tradicional, 28,3 % rápida)',prime:'referencias 2025: ≤ 62 % sano · 62-68 % correcto · 68-72 % frágil · > 72 % crítico (media: 68 % tradicional, 60 % rápida)',pm:'referencias: < 80 % sano · 80-90 % correcto · 90-100 % frágil · > 100 % crítico (se pierde dinero)'},
  why:{score:'la puntuación más alta',caNet:'conserva la mayor parte de sus ventas',caNetM:'conserva la mayor parte de sus ventas',cmd:'el mayor número de pedidos al día',mat:'la materia prima más baja',ms:'el equipo más ligero',prime:'materia + equipo más bajos',pm:'el punto de equilibrio más bajo'}},
it:{open:'Confronta',title:'Confronta le mie attività',kicker:'Lettura affiancata',lead:'Gli stessi riferimenti per ogni fascicolo, calcolati dal motore Verdict®. Il valore migliore di ogni riga è evidenziato; lo scarto è dato rispetto alla mediana del gruppo.',
  close:'Chiudi',ind:'Indicatore',median:'mediana',best:'migliore',incomplete:'Dati incompleti',complete:'Completa',
  indicative:'Lettura indicativa: non tutti i fascicoli sono esercizi chiusi confrontabili (vedere la natura sotto ogni colonna). Nessun vincitore viene proclamato.',
  conclusive:'Fascicoli confrontabili: esercizi chiusi, stesse basi.',
  score:'Punteggio Verdict®',caNet:'Fatturato annuo netto → risultato ante imposte',caNetM:'Al mese: fatturato netto → risultato ante imposte',ofCa:'del fatturato',netWord:'ante imposte',better_net:'migliore = quota maggiore di fatturato che resta',ticket:'Scontrino medio netto',cmd:'Ordini / giorno',mat:'Incidenza materia prima',ms:'Costo totale del personale',prime:'Prime cost (materia + team)',marge:'Margine ante imposte',pm:'Punto di pareggio (quota del fatturato)',
  veraSpread:'È {m} a separare di più i suoi fascicoli: {best} a {vb}, {worst} a {vw}. Leva da guardare per prima in {worst}.',
  veraOne:'Servono almeno due fascicoli calcolabili per confrontare.',need2:'Aggiunga una seconda attività per confrontare.',
  better_low:'più basso = meglio',better_high:'più alto = meglio',neutral:'secondo il concept',ofSales:'di fatturato',above:'sopra la mediana',below:'sotto la mediana',good:'meglio',bad:'peggio',
  sub:{score:'la sintesi Verdict® su 100',caNet:'ciò che resta del fatturato una volta pagati tutti i costi, ante imposte',caNetM:'la stessa lettura, mese per mese',ticket:'spesa media per ordine',cmd:'l’affluenza',mat:'quota del fatturato spesa in materie prime',ms:'quota del fatturato spesa in salari con oneri',prime:'materia + team: la coppia da tenere d’occhio',pm:'quota del fatturato necessaria a pagare tutti i costi; sotto il 100 %, si guadagna'},
  tabRank:'Classifica',tabTable:'Affiancati',etabs:'attività',fAll:'Tutte',fReal:'Reali',fModel:'Modelli',fCrit:'Critiche',search:'Cerca un’attività',noMatch:'Nessuna attività corrisponde.',pick:'Confronta',pickTitle:'Aggiungi al confronto (da 2 a 4)',pickHint:'Selezioni da 2 a 4 attività nella Classifica per confrontarle riga per riga.',chipMat:'Materia',chipMs:'Team',chipPrime:'Prime cost',chipPm:'Pareggio',openEtab:'Apri',barHide:'Nascondi dalla home',barShow:'Rimetti nella home',barHiddenTag:'nascosta dalla home',
  overall:'Performance generale',overallSub:'indice da 0 a 100: posizione media del fascicolo sui riferimenti confrontabili (punteggio, fatturato → netto, materia, team, prime cost, pareggio, affluenza)',rank:'posizione',of:'su',podium:'Migliore performance generale',podiumSub:'classifica di tutti i fascicoli calcolabili',hide:'Nascondi',hideTitle:'Nascondi questo fascicolo: i dati sono conservati, esce dalla barra e dal confronto; si può rimostrare da ⚙ Gestisci',hidden:'fascicolo/i nascosto/i',manage:'Gestisci / rimostra',deletedTxt:'fascicolo/i eliminato/i definitivamente',resetAll:'Ripristina tutti i fascicoli originali',notCalc:'non calcolabile',alone:'Unica attività calcolata per ora: sarà classificata quando una seconda avrà i propri dati.',scoreOwn:'Indice di serenità',
  levels:['CRITICA','FRAGILE','CORRETTA','SANA'],rep:{caNet:'riferimenti 2025 (Francia): risultato < 0 % del fatturato critico (un quarto dei ristoranti) · 0-2 % fragile · 2-4,5 % corretta · ≥ 4,5 % sana (media nazionale: 4,5 % tradizionale, 3,9 % veloce — Osservatorio UMIH/OEC)',caNetM:'stessi riferimenti della riga annuale',mat:'riferimenti ristorazione: < 28 % sana · 28-32 % corretta · 32-35 % fragile · > 35 % critica (media 2025: 30,7 % tradizionale, 31,3 % veloce)',ms:'riferimenti 2025: ≤ 33 % sana · 33-38 % corretta · 38-42 % fragile · > 42 % critica (media: 37,3 % tradizionale, 28,3 % veloce)',prime:'riferimenti 2025: ≤ 62 % sana · 62-68 % corretta · 68-72 % fragile · > 72 % critica (media: 68 % tradizionale, 60 % veloce)',pm:'riferimenti: < 80 % sana · 80-90 % corretta · 90-100 % fragile · > 100 % critica (si perde denaro)'},
  why:{score:'il punteggio più alto',caNet:'conserva la quota maggiore del fatturato',caNetM:'conserva la quota maggiore del fatturato',cmd:'il maggior numero di ordini al giorno',mat:'la materia prima più bassa',ms:'il team più leggero',prime:'materia + team più bassi',pm:'il punto di pareggio più basso'}},
de:{open:'Vergleichen',title:'Meine Betriebe vergleichen',kicker:'Nebeneinander',lead:'Dieselben Richtwerte für jede Akte, berechnet von der Verdict®-Engine. Der beste Wert jeder Zeile ist markiert; die Abweichung bezieht sich auf den Median der Gruppe.',
  close:'Schließen',ind:'Kennzahl',median:'Median',best:'bester',incomplete:'Unvollständige Daten',complete:'Ergänzen',
  indicative:'Indikative Auswertung: Nicht alle Akten sind vergleichbare abgeschlossene Geschäftsjahre (siehe Art unter jeder Spalte). Es wird kein Sieger erklärt.',
  conclusive:'Vergleichbare Akten: abgeschlossene Geschäftsjahre, gleiche Grundlagen.',
  score:'Verdict®-Score',caNet:'Jahresumsatz netto → Ergebnis vor Steuern',caNetM:'Pro Monat: Umsatz netto → Ergebnis vor Steuern',ofCa:'des Umsatzes',netWord:'vor Steuern',better_net:'besser = größerer Anteil des Umsatzes, der bleibt',ticket:'Durchschnittsbon netto',cmd:'Bestellungen / Tag',mat:'Wareneinsatzquote',ms:'Personalvollkosten',prime:'Prime Cost (Ware + Team)',marge:'Marge vor Steuern',pm:'Break-even (Anteil am Umsatz)',
  veraSpread:'{m} trennt Ihre Akten am stärksten: {best} bei {vb}, {worst} bei {vw}. Erster Hebel, den Sie bei {worst} prüfen sollten.',
  veraOne:'Zum Vergleichen braucht es mindestens zwei berechenbare Akten.',need2:'Fügen Sie einen zweiten Betrieb hinzu, um zu vergleichen.',
  better_low:'niedriger = besser',better_high:'höher = besser',neutral:'je nach Konzept',ofSales:'des Umsatzes',above:'über dem Median',below:'unter dem Median',good:'besser',bad:'schlechter',
  sub:{score:'die Verdict®-Synthese von 100',caNet:'was vom Umsatz bleibt, wenn alle Kosten bezahlt sind, vor Steuern',caNetM:'dieselbe Auswertung, Monat für Monat',ticket:'durchschnittliche Ausgabe pro Bestellung',cmd:'die Gästefrequenz',mat:'Anteil des Umsatzes für Rohwaren',ms:'Anteil des Umsatzes für Löhne inkl. Abgaben',prime:'Ware + Team: das Paar, das man beobachten muss',pm:'Anteil des Umsatzes, der alle Kosten deckt; unter 100 % verdient man'},
  tabRank:'Rangliste',tabTable:'Nebeneinander',etabs:'Betriebe',fAll:'Alle',fReal:'Echte',fModel:'Modelle',fCrit:'Kritische',search:'Betrieb suchen',noMatch:'Kein Betrieb passt.',pick:'Vergleichen',pickTitle:'Zum Vergleich hinzufügen (2 bis 4)',pickHint:'Markieren Sie 2 bis 4 Betriebe in der Rangliste, um sie Zeile für Zeile zu vergleichen.',chipMat:'Ware',chipMs:'Team',chipPrime:'Prime Cost',chipPm:'Break-even',openEtab:'Öffnen',barHide:'Vom Startbildschirm ausblenden',barShow:'Wieder auf dem Startbildschirm zeigen',barHiddenTag:'vom Startbildschirm ausgeblendet',
  overall:'Gesamtleistung',overallSub:'Index von 0 bis 100: durchschnittlicher Rang der Akte bei den vergleichbaren Richtwerten (Score, Umsatz → netto, Ware, Team, Prime Cost, Break-even, Frequenz)',rank:'Rang',of:'von',podium:'Beste Gesamtleistung',podiumSub:'Rangliste aller berechenbaren Akten',hide:'Ausblenden',hideTitle:'Diese Akte ausblenden: Ihre Daten bleiben erhalten, sie verschwindet aus der Leiste und dem Vergleich; über ⚙ Verwalten wieder einblendbar',hidden:'ausgeblendete Akte(n)',manage:'Verwalten / einblenden',deletedTxt:'endgültig gelöschte Akte(n)',resetAll:'Alle ursprünglichen Akten wiederherstellen',notCalc:'nicht berechenbar',alone:'Bisher einziger berechneter Betrieb: Er wird eingeordnet, sobald ein zweiter eigene Zahlen hat.',scoreOwn:'Gelassenheitsindex',
  levels:['KRITISCH','FRAGIL','ORDENTLICH','GESUND'],rep:{caNet:'Richtwerte 2025 (Frankreich): Ergebnis < 0 % des Umsatzes kritisch (ein Viertel der Restaurants) · 0-2 % fragil · 2-4,5 % ordentlich · ≥ 4,5 % gesund (Landesdurchschnitt: 4,5 % klassisch, 3,9 % Schnellgastronomie — UMIH/OEC)',caNetM:'dieselben Richtwerte wie die Jahreszeile',mat:'Gastronomie-Richtwerte: < 28 % gesund · 28-32 % ordentlich · 32-35 % fragil · > 35 % kritisch (Durchschnitt 2025: 30,7 % klassisch, 31,3 % Schnellgastronomie)',ms:'Richtwerte 2025: ≤ 33 % gesund · 33-38 % ordentlich · 38-42 % fragil · > 42 % kritisch (Durchschnitt: 37,3 % klassisch, 28,3 % Schnellgastronomie)',prime:'Richtwerte 2025: ≤ 62 % gesund · 62-68 % ordentlich · 68-72 % fragil · > 72 % kritisch (Durchschnitt: 68 % klassisch, 60 % Schnellgastronomie)',pm:'Richtwerte: < 80 % gesund · 80-90 % ordentlich · 90-100 % fragil · > 100 % kritisch (man verliert Geld)'},
  why:{score:'der höchste Score',caNet:'behält den größten Teil seines Umsatzes',caNetM:'behält den größten Teil seines Umsatzes',cmd:'die meisten Bestellungen pro Tag',mat:'der niedrigste Wareneinsatz',ms:'das schlankste Team',prime:'niedrigste Ware + Team',pm:'der niedrigste Break-even'}},
nl:{open:'Vergelijken',title:'Mijn zaken vergelijken',kicker:'Naast elkaar',lead:'Dezelfde richtwaarden voor elk dossier, berekend door de Verdict®-engine. De beste waarde van elke rij is gemarkeerd; het verschil is ten opzichte van de mediaan van de groep.',
  close:'Sluiten',ind:'Indicator',median:'mediaan',best:'beste',incomplete:'Onvolledige gegevens',complete:'Aanvullen',
  indicative:'Indicatieve lezing: niet alle dossiers zijn vergelijkbare afgesloten boekjaren (zie de aard onder elke kolom). Er wordt geen winnaar aangewezen.',
  conclusive:'Vergelijkbare dossiers: afgesloten boekjaren, dezelfde basis.',
  score:'Verdict®-score',caNet:'Jaaromzet excl. btw → resultaat vóór belasting',caNetM:'Per maand: omzet excl. btw → resultaat vóór belasting',ofCa:'van de omzet',netWord:'vóór belasting',better_net:'beter = groter deel van de omzet dat overblijft',ticket:'Gemiddeld bonbedrag excl. btw',cmd:'Bestellingen / dag',mat:'Grondstoffenratio',ms:'Totale personeelskosten',prime:'Prime cost (grondstoffen + team)',marge:'Marge vóór belasting',pm:'Break-even (deel van de omzet)',
  veraSpread:'{m} scheidt uw dossiers het meest: {best} op {vb}, {worst} op {vw}. Eerste hefboom om te bekijken bij {worst}.',
  veraOne:'Er zijn minstens twee berekenbare dossiers nodig om te vergelijken.',need2:'Voeg een tweede zaak toe om te vergelijken.',
  better_low:'lager = beter',better_high:'hoger = beter',neutral:'afhankelijk van het concept',ofSales:'van de omzet',above:'boven de mediaan',below:'onder de mediaan',good:'beter',bad:'slechter',
  sub:{score:'de Verdict®-synthese op 100',caNet:'wat van de omzet overblijft als alle kosten betaald zijn, vóór belasting',caNetM:'dezelfde lezing, maand per maand',ticket:'gemiddelde uitgave per bestelling',cmd:'de bezoekersstroom',mat:'deel van de omzet naar grondstoffen',ms:'deel van de omzet naar lonen incl. lasten',prime:'grondstoffen + team: het duo om in het oog te houden',pm:'deel van de omzet nodig om alle kosten te betalen; onder 100% verdient u'},
  tabRank:'Rangschikking',tabTable:'Naast elkaar',etabs:'zaken',fAll:'Alle',fReal:'Echte',fModel:'Modellen',fCrit:'Kritieke',search:'Een zaak zoeken',noMatch:'Geen enkele zaak komt overeen.',pick:'Vergelijken',pickTitle:'Toevoegen aan de vergelijking (2 tot 4)',pickHint:'Vink 2 tot 4 zaken aan in de Rangschikking om ze regel per regel te vergelijken.',chipMat:'Grondstoffen',chipMs:'Team',chipPrime:'Prime cost',chipPm:'Break-even',openEtab:'Openen',barHide:'Verbergen op het startscherm',barShow:'Terugzetten op het startscherm',barHiddenTag:'verborgen op het startscherm',
  overall:'Algemene prestatie',overallSub:'index van 0 tot 100: gemiddelde rang van het dossier op de vergelijkbare richtwaarden (score, omzet → netto, grondstoffen, team, prime cost, break-even, bezoekers)',rank:'rang',of:'op',podium:'Beste algemene prestatie',podiumSub:'rangschikking van alle berekenbare dossiers',hide:'Verbergen',hideTitle:'Dit dossier verbergen: de gegevens blijven bewaard, het verdwijnt uit de balk en de vergelijking; terug te tonen via ⚙ Beheren',hidden:'verborgen dossier(s)',manage:'Beheren / terug tonen',deletedTxt:'definitief verwijderd(e) dossier(s)',resetAll:'Alle oorspronkelijke dossiers herstellen',notCalc:'niet berekenbaar',alone:'Enige berekende zaak tot nu toe: de rangschikking volgt zodra een tweede eigen cijfers heeft.',scoreOwn:'Rustindex',
  levels:['KRITIEK','KWETSBAAR','CORRECT','GEZOND'],rep:{caNet:'richtwaarden 2025 (Frankrijk): resultaat < 0% van de omzet kritiek (een kwart van de restaurants) · 0-2% kwetsbaar · 2-4,5% correct · ≥ 4,5% gezond (nationaal gemiddelde: 4,5% traditioneel, 3,9% snel — UMIH/OEC)',caNetM:'dezelfde richtwaarden als de jaarregel',mat:'horecarichtwaarden: < 28% gezond · 28-32% correct · 32-35% kwetsbaar · > 35% kritiek (gemiddelde 2025: 30,7% traditioneel, 31,3% snel)',ms:'richtwaarden 2025: ≤ 33% gezond · 33-38% correct · 38-42% kwetsbaar · > 42% kritiek (gemiddelde: 37,3% traditioneel, 28,3% snel)',prime:'richtwaarden 2025: ≤ 62% gezond · 62-68% correct · 68-72% kwetsbaar · > 72% kritiek (gemiddelde: 68% traditioneel, 60% snel)',pm:'richtwaarden: < 80% gezond · 80-90% correct · 90-100% kwetsbaar · > 100% kritiek (u verliest geld)'},
  why:{score:'de hoogste score',caNet:'houdt het grootste deel van de omzet over',caNetM:'houdt het grootste deel van de omzet over',cmd:'de meeste bestellingen per dag',mat:'de laagste grondstoffenkost',ms:'het lichtste team',prime:'laagste grondstoffen + team',pm:'het laagste break-evenpunt'}},
pt:{open:'Comparar',title:'Comparar os meus estabelecimentos',kicker:'Leitura lado a lado',lead:'As mesmas referências para cada processo, calculadas pelo motor Verdict®. O melhor valor de cada linha é assinalado; a diferença é dada face à mediana do grupo.',
  close:'Fechar',ind:'Indicador',median:'mediana',best:'melhor',incomplete:'Dados incompletos',complete:'Completar',
  indicative:'Leitura indicativa: nem todos os processos são exercícios fechados comparáveis (veja a natureza sob cada coluna). Nenhum vencedor é proclamado.',
  conclusive:'Processos comparáveis: exercícios fechados, mesmas bases.',
  score:'Pontuação Verdict®',caNet:'Faturação anual sem IVA → resultado antes de impostos',caNetM:'Por mês: faturação sem IVA → resultado antes de impostos',ofCa:'da faturação',netWord:'antes de impostos',better_net:'melhor = maior parte da faturação que fica',ticket:'Ticket médio sem IVA',cmd:'Pedidos / dia',mat:'Rácio de matéria-prima',ms:'Custo total de pessoal',prime:'Prime cost (matéria + equipa)',marge:'Margem antes de impostos',pm:'Ponto de equilíbrio (parte da faturação)',
  veraSpread:'É {m} que mais separa os seus processos: {best} com {vb}, {worst} com {vw}. Primeira alavanca a ver em {worst}.',
  veraOne:'São precisos pelo menos dois processos calculáveis para comparar.',need2:'Adicione um segundo estabelecimento para comparar.',
  better_low:'mais baixo = melhor',better_high:'mais alto = melhor',neutral:'conforme o conceito',ofSales:'da faturação',above:'acima da mediana',below:'abaixo da mediana',good:'melhor',bad:'pior',
  sub:{score:'a síntese Verdict® em 100',caNet:'o que fica da faturação depois de pagos todos os custos, antes de impostos',caNetM:'a mesma leitura, mês a mês',ticket:'despesa média por pedido',cmd:'a afluência',mat:'parte da faturação gasta em matérias-primas',ms:'parte da faturação gasta em salários com encargos',prime:'matéria + equipa: o par a vigiar',pm:'parte da faturação necessária para pagar todos os custos; abaixo de 100 %, ganha-se'},
  tabRank:'Classificação',tabTable:'Lado a lado',etabs:'estabelecimentos',fAll:'Todos',fReal:'Reais',fModel:'Modelos',fCrit:'Críticos',search:'Procurar um estabelecimento',noMatch:'Nenhum estabelecimento corresponde.',pick:'Comparar',pickTitle:'Adicionar à comparação (2 a 4)',pickHint:'Marque 2 a 4 estabelecimentos na Classificação para os comparar linha a linha.',chipMat:'Matéria',chipMs:'Equipa',chipPrime:'Prime cost',chipPm:'Equilíbrio',openEtab:'Abrir',barHide:'Ocultar do início',barShow:'Repor no início',barHiddenTag:'oculto do início',
  overall:'Desempenho geral',overallSub:'índice de 0 a 100: posição média do processo nas referências comparáveis (pontuação, faturação → líquido, matéria, equipa, prime cost, equilíbrio, afluência)',rank:'posição',of:'em',podium:'Melhor desempenho geral',podiumSub:'classificação de todos os processos calculáveis',hide:'Ocultar',hideTitle:'Ocultar este processo: os dados são mantidos, sai da barra e da comparação; pode voltar a mostrar-se em ⚙ Gerir',hidden:'processo(s) oculto(s)',manage:'Gerir / voltar a mostrar',deletedTxt:'processo(s) eliminado(s) definitivamente',resetAll:'Repor todos os processos de origem',notCalc:'não calculável',alone:'Único estabelecimento calculado por agora: será classificado quando um segundo tiver os seus próprios números.',scoreOwn:'Índice de serenidade',
  levels:['CRÍTICO','FRÁGIL','CORRETO','SAUDÁVEL'],rep:{caNet:'referências 2025 (França): resultado < 0 % da faturação crítico (um quarto dos restaurantes) · 0-2 % frágil · 2-4,5 % correto · ≥ 4,5 % saudável (média nacional: 4,5 % tradicional, 3,9 % rápida — Observatório UMIH/OEC)',caNetM:'mesmas referências da linha anual',mat:'referências da restauração: < 28 % saudável · 28-32 % correto · 32-35 % frágil · > 35 % crítico (média 2025: 30,7 % tradicional, 31,3 % rápida)',ms:'referências 2025: ≤ 33 % saudável · 33-38 % correto · 38-42 % frágil · > 42 % crítico (média: 37,3 % tradicional, 28,3 % rápida)',prime:'referências 2025: ≤ 62 % saudável · 62-68 % correto · 68-72 % frágil · > 72 % crítico (média: 68 % tradicional, 60 % rápida)',pm:'referências: < 80 % saudável · 80-90 % correto · 90-100 % frágil · > 100 % crítico (perde-se dinheiro)'},
  why:{score:'a pontuação mais alta',caNet:'mantém a maior parte da faturação',caNetM:'mantém a maior parte da faturação',cmd:'o maior número de pedidos por dia',mat:'a matéria-prima mais baixa',ms:'a equipa mais leve',prime:'matéria + equipa mais baixos',pm:'o ponto de equilíbrio mais baixo'}}
};
for(var l in X)TXT[l]=m(TXT.fr,X[l]);})();
function L(){var l=String(root.LOCALE||doc.documentElement.lang||'fr').slice(0,2);return TXT[l]||TXT.fr;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function num(n){n=Number(n);return isFinite(n)?n:null;}
function fEur(n){if(n==null)return L().na;try{return new Intl.NumberFormat((root.LOCALE_TAG||'fr-FR'),{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);}catch(e){return Math.round(n)+' €';}}
function fEur2(n){if(n==null)return L().na;try{return new Intl.NumberFormat((root.LOCALE_TAG||'fr-FR'),{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}catch(e){return n.toFixed(2)+' €';}}
function fPct(n){if(n==null)return L().na;return (Math.round(n*10)/10).toLocaleString((root.LOCALE_TAG||'fr-FR'))+' %';}
function fNum(n,d){if(n==null)return L().na;return (Math.round(n*Math.pow(10,d||0))/Math.pow(10,d||0)).toLocaleString((root.LOCALE_TAG||'fr-FR'));}
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
    k:{score:calc?Math.round(R.score):null,res:calc?num(x.res):null,resM:calc?num(x.resM):null,ca:calc?ca:null,caM:calc?ca/mois:null,ticket:calc?num(x.panierHT):null,cmd:calc?num(x.cmdj):null,
       mat:mat,ms:ms,prime:(mat!=null&&ms!=null)?mat+ms:null,marge:calc?num(v.rn):null,pm:calc?num(v.pm):null}};
}
/* Couleurs Verdict® : la palette de zone() de l'application (critique, fragile, correcte, saine) ; repli sur les mêmes teintes. */
var PALETTE_FALLBACK=['#ef4444','#f97316','#eab308','#22c55e'];
function palette(){try{if(typeof root.zone==='function'){var z=[root.zone(10),root.zone(45),root.zone(65),root.zone(90)];if(z.every(function(x){return x&&x.h;}))return z.map(function(x){return x.h;});}}catch(e){}return PALETTE_FALLBACK;}
function lvlHigh(v,a,b,c){return v<a?0:v<b?1:v<c?2:3;}   /* plus haut = mieux : seuils croissants */
function lvlLow(v,a,b,c){return v>c?0:v>b?1:v>a?2:3;}    /* plus bas = mieux : seuils croissants */
var LEVEL={score:function(v){return v<35?0:v<55?1:v<75?2:3;},caNet:function(v){return lvlHigh(v,0,2,4.5);},caNetM:function(v){return lvlHigh(v,0,2,4.5);},mat:function(v){return lvlLow(v,28,32,35);},ms:function(v){return lvlLow(v,33,38,42);},prime:function(v){return lvlLow(v,62,68,72);},pm:function(v){return lvlLow(v,80,90,100);}};
var ROWS=[
  {key:'score',fmt:function(n){return n==null?L().na:fNum(n,0)+'/100';},better:'high',bar:function(n){return n;},max:100},
  {key:'caNet',get:function(s){return s.k.marge;},fmt:function(v,s){return fEur(s.k.ca)+' '+L().ofSales+' \u2192 '+fEur(s.k.res)+' '+L().netWord;},note:function(v,s){return '= '+fPct(v)+' '+L().ofCa;},better:'high',hint:'better_net',bar:function(n){return Math.max(0,n);},max:30,unit:'pt'},
  {key:'caNetM',get:function(s){return s.k.marge;},fmt:function(v,s){return fEur(s.k.caM)+' '+L().ofSales+' \u2192 '+fEur(s.k.resM)+' '+L().netWord;},note:function(v,s){return '= '+fPct(v)+' '+L().ofCa;},better:'high',hint:'better_net',noDelta:true},
  {key:'ticket',fmt:fEur2,better:'neutral'},
  {key:'cmd',fmt:function(n){return fNum(n,1);},better:'high'},
  {key:'mat',fmt:fPct,better:'low',bar:function(n){return n;},max:60,driver:true},
  {key:'ms',fmt:fPct,better:'low',bar:function(n){return n;},max:60,driver:true},
  {key:'prime',fmt:fPct,better:'low',bar:function(n){return n;},max:100,driver:true},
  {key:'pm',fmt:fPct,better:'low',bar:function(n){return Math.min(n,200);},max:200}
];
/* Indice de performance générale : pour chaque repère comparable, les dossiers calculables sont classés (1 = meilleur,
   ex æquo = même rang) ; l\u2019indice vaut 100 quand le rang moyen est 1 et 0 quand il est dernier partout.
   Aucune pondération cachée : chaque repère compte une fois. Exposé pour les tests : window.VerdictCompare.rank. */
function overallRank(snaps,rows){
  var calc=snaps.filter(function(s){return s.calculated;}),nCalc=calc.length,out={};
  snaps.forEach(function(s){out[s.id]={index:null,rank:null,n:nCalc,used:0};});
  if(nCalc<2)return out;
  var sums={},counts={};calc.forEach(function(s){sums[s.id]=0;counts[s.id]=0;});
  rows.filter(function(r){return r.better!=='neutral'&&r.key!=='caNetM';}).forEach(function(r){
    var vals=calc.map(function(s){return {id:s.id,v:r.get?r.get(s):s.k[r.key]};}).filter(function(x){return x.v!=null&&isFinite(x.v);});
    if(vals.length<2)return;
    vals.sort(function(a,b){return r.better==='high'?b.v-a.v:a.v-b.v;});
    var rank=0;vals.forEach(function(x,i){if(i===0||x.v!==vals[i-1].v)rank=i+1;sums[x.id]+=(rank-1)/(vals.length-1);counts[x.id]++;});
  });
  calc.forEach(function(s){if(counts[s.id]){out[s.id].index=Math.round(100*(1-sums[s.id]/counts[s.id]));out[s.id].used=counts[s.id];}});
  var ordered=calc.filter(function(s){return out[s.id].index!=null;}).sort(function(a,b){return out[b.id].index-out[a.id].index||((b.k.marge||0)-(a.k.marge||0));});
  var rk=0;ordered.forEach(function(s,i){if(i===0||out[s.id].index!==out[ordered[i-1].id].index)rk=i+1;out[s.id].rank=rk;});
  return out;
}
root.VerdictCompare={rank:function(snaps){return overallRank(snaps,ROWS);},rows:ROWS};
function bestIndex(row,snaps){
  var vals=snaps.map(function(s){return row.get?row.get(s):s.k[row.key];}),best=-1;
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
  '.cmp12-grid{display:grid;grid-template-columns:230px repeat(var(--n),minmax(170px,1fr));gap:6px;min-width:calc(236px + var(--n) * 176px)}'+
  '.cmp12-grid>div{padding:9px 10px;border-radius:10px;background:rgba(128,128,128,.08);border:1px solid rgba(128,128,128,.22);min-width:0;color:inherit}'+
  '.cmp12-head{background:transparent!important;border-color:transparent!important;padding-bottom:4px!important}'+
  '.cmp12-col{animation:cmp12In .5s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i)*80ms)}'+
  '.cmp12-col b{display:block;font-size:14px;line-height:1.2}.cmp12-col span{display:block;font-size:11px;opacity:.72;margin-top:3px;line-height:1.3}'+
  '.cmp12-col.actif{border-color:rgba(34,197,94,.55);box-shadow:0 0 0 1px rgba(34,197,94,.25) inset}'+
  '.cmp12-lab{font-size:12.5px;color:inherit}.cmp12-lab small{display:block;opacity:.72;font-size:10.5px;margin-top:2px}'+
  '.cmp12-val{font-family:var(--mono);font-size:14px;font-weight:800;display:flex;flex-direction:column;gap:5px}'+
  '.cmp12-val.best{border-color:rgba(34,197,94,.6)!important;background:rgba(34,197,94,.08)!important}'+
  '.cmp12-why{font:700 10.5px/1.3 var(--mono);color:#16a34a;letter-spacing:.02em}'+
'.cmp12-lvl{font:800 9.5px/1 var(--mono);letter-spacing:.14em}'+
'.cmp12-podium{margin:0 0 12px;padding:12px;border-radius:14px;border:1px solid rgba(34,197,94,.35);background:rgba(34,197,94,.06)}.cmp12-podium p{margin:8px 0 0;font-size:11.5px;opacity:.75;line-height:1.4}'+
'.cmp12-pod{display:flex;align-items:center;gap:10px;padding:6px 0;font-size:13.5px}.cmp12-pod.first b{font-size:16px}.cmp12-pod b{flex:1}.cmp12-pod span:last-child{font:800 12px var(--mono)}.cmp12-medal{font-size:18px}'+
'.cmp12-rank{display:inline-block;font:900 11px/1 var(--mono);color:#60a5fa;margin-bottom:4px;font-style:normal}'+
'.cmp12-hide{margin-top:6px;padding:3px 8px;border-radius:8px;border:1px solid rgba(128,128,128,.35);background:transparent;color:inherit;font:600 10.5px var(--mono);cursor:pointer;opacity:.75}.cmp12-hide:hover{opacity:1}'+
'.cmp12-val.critique{border-color:rgba(239,68,68,.75)!important;background:rgba(239,68,68,.09)!important;box-shadow:0 0 0 1px rgba(239,68,68,.25) inset}'+
  '.cmp12-val em{font-style:normal;font:600 10.5px/1.2 var(--mono);opacity:.72}'+
  '.cmp12-val.na{opacity:.6;font-weight:600}'+
  '.cmp12-bar{height:6px;border-radius:99px;background:rgba(127,127,127,.18);overflow:hidden}.cmp12-bar i{display:block;height:100%;width:0;border-radius:99px;background:#60a5fa;transition:width .6s cubic-bezier(.2,.7,.2,1)}'+
  '.cmp12-state{margin:12px 0 0;padding:10px 12px;border-radius:12px;border:1px solid rgba(234,179,8,.45);background:rgba(234,179,8,.08);font-size:12.5px;line-height:1.5}'+
  '.cmp12-state.ok{border-color:rgba(34,197,94,.45);background:rgba(34,197,94,.08)}'+
  '.cmp12-vera{display:flex;gap:10px;align-items:flex-start;margin:10px 0 0;padding:11px 12px;border-radius:12px;background:rgba(96,165,250,.08);border:1px solid rgba(96,165,250,.3);font-size:13px;line-height:1.5}'+
  '.cmp12-vera i{flex:none;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#60a5fa;color:#06121f;font:900 13px var(--mono);font-style:normal}'+
  '.cmp12-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}'+
  '.cmp12-grid>.cmp12-lab{position:sticky;left:0;z-index:2;background:var(--cmp12-sheet,#fff)}'+
'@media(max-width:640px){#mCompare .sheet{width:100vw;max-width:100vw!important;border-radius:18px 18px 0 0}.cmp12-grid{grid-template-columns:118px repeat(var(--n),118px);gap:5px}.cmp12-grid>div{padding:8px 8px}.cmp12-lab{font-size:11.5px}.cmp12-lab small{font-size:10px}.cmp12-val{font-size:13px}.cmp12-col b{font-size:13px}.cmp12-lead{font-size:12.5px}#mCompare h3{font-size:17px}}'+
'.cmp12-tabs{display:flex;gap:6px;padding:4px;border-radius:14px;background:rgba(128,128,128,.12);margin:4px 0 12px}.cmp12-tabs button{flex:1;padding:10px 12px;border:0;border-radius:11px;background:transparent;color:inherit;font:700 14px/1 inherit;cursor:pointer}.cmp12-tabs button.on{background:var(--cmp12-sheet,#fff);box-shadow:0 1px 6px rgba(0,0,0,.12)}.cmp12-tabs i,.cmp12-filters i{font-style:normal;opacity:.6;font-weight:600;margin-left:4px}'+
'.cmp12-filters{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 12px}.cmp12-filters button{padding:7px 12px;border-radius:999px;border:1px solid rgba(128,128,128,.3);background:transparent;color:inherit;font:600 12.5px inherit;cursor:pointer}.cmp12-filters button.on{border-color:#2563eb;background:rgba(37,99,235,.1);color:#2563eb}.cmp12-search{flex:1 1 180px;min-width:140px;padding:8px 12px;border-radius:999px;border:1px solid rgba(128,128,128,.3);background:transparent;color:inherit;font:13px inherit}'+
'.cmp12-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:10px}'+
'.cmp12-card{display:flex;flex-direction:column;gap:9px;padding:13px 14px;border-radius:16px;border:1px solid rgba(128,128,128,.22);background:rgba(128,128,128,.05);animation:cmp12In .45s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i)*45ms)}'+
'.cmp12-card.crit{border-color:rgba(239,68,68,.7);background:rgba(239,68,68,.06)}.cmp12-card.actif{box-shadow:0 0 0 2px rgba(34,197,94,.45) inset}'+
'.cmp12-card header{display:flex;align-items:flex-start;gap:10px}.cmp12-rk{flex:none;min-width:38px;padding:5px 0;border-radius:10px;background:rgba(37,99,235,.1);color:#2563eb;font:900 13px/1 var(--mono);text-align:center}.cmp12-id{flex:1;min-width:0}.cmp12-id b{display:block;font-size:15px;line-height:1.25}.cmp12-id span{display:block;font-size:11px;opacity:.68;margin-top:2px}'+
'.cmp12-pick{flex:none;display:flex;align-items:center;gap:5px;font:600 11.5px inherit;cursor:pointer;opacity:.85}.cmp12-pick input{width:18px;height:18px;accent-color:#2563eb}'+
'.cmp12-score{display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:10px}.cmp12-score b{font:900 26px/1 var(--mono)}.cmp12-score b small{font-size:12px;opacity:.6;font-weight:700}.cmp12-score .cmp12-bar{height:8px}'+
'.cmp12-line{margin:0;font-size:13px;line-height:1.45}.cmp12-chips{display:flex;flex-wrap:wrap;gap:6px}.cmp12-chip{display:inline-flex;align-items:baseline;gap:5px;padding:4px 9px;border-radius:999px;border:1px solid color-mix(in srgb,var(--c) 45%,transparent);background:color-mix(in srgb,var(--c) 10%,transparent);font-size:11.5px}.cmp12-chip i{font-style:normal;opacity:.75}.cmp12-chip b{color:var(--c);font:800 12px var(--mono)}.cmp12-chip.crit{border-width:2px}'+
'.cmp12-place{opacity:.9!important;font-weight:600}.cmp12-card .cmp12-why{margin:0}.cmp12-na{font-size:12.5px;opacity:.7}'+
'.cmp12-card footer{display:flex;justify-content:space-between;gap:8px;margin-top:2px}.cmp12-eye,.cmp12-open{padding:7px 11px;border-radius:10px;border:1px solid rgba(128,128,128,.3);background:transparent;color:inherit;font:600 12px inherit;cursor:pointer}.cmp12-open{border-color:#2563eb;color:#2563eb}'+
'.cmp12-pods{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:6px}.cmp12-pod{border:0;background:transparent;color:inherit;text-align:left;cursor:pointer;border-radius:10px}.cmp12-pod:hover{background:rgba(34,197,94,.08)}'+
'@media(max-width:640px){.cmp12-cards{grid-template-columns:1fr}.cmp12-pods{grid-template-columns:1fr}.cmp12-podium{padding:9px 10px}.cmp12-podium p{display:none}.cmp12-pod{padding:3px 0;font-size:13px}.cmp12-pod.first b{font-size:14.5px}.cmp12-medal{font-size:15px}}'+
'@media(prefers-reduced-motion:reduce){.cmp12-card{animation:none}}'+
'@keyframes cmp12In{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}'+
  '@media(prefers-reduced-motion:reduce){.cmp12-col{animation:none}.cmp12-bar i{transition:none}}'+
  /* C241 (Y08) : en thème clair, la fenêtre est claire même sans le recoloriage de la coque (appli ouverte seule) ; la
     règle sombre des fenêtres (html.p40-app .modal .sheet) ne s'applique plus qu'au thème sombre. */
  'html.vd-workspace-light #mCompare .sheet{background:#ffffff!important;background-image:none!important;border-color:#d5dde5!important;box-shadow:0 18px 48px rgba(16,24,40,.18)!important;color:#14202b}html.vd-workspace-light #mCompare .sh-fermer{background:#f3f5f7!important;color:#14202b!important;border-color:#cfd8e1!important}html.vd-workspace-light #mCompare h3{color:#14202b}';
  doc.head.appendChild(st);
}
function close(){var m=doc.getElementById('mCompare');if(!m)return;try{root.a11yDialogRestore&&root.a11yDialogRestore(m);}catch(e){}if(m.parentNode)m.parentNode.removeChild(m);}
/* C37 (15/10) : avec 10 à 20 établissements, un tableau de 20 colonnes ne se lit ni sur PC ni sur téléphone.
   La feuille s'ouvre désormais sur un CLASSEMENT (une carte par établissement, triées par performance générale,
   filtres, recherche) ; le CÔTE À CÔTE ne compare que 2 à 4 établissements choisis dans le classement. */
var UI={view:'rank',filter:'all',query:'',sel:[]};
function isModel(s){var d=root.STORE&&root.STORE.etabs[s.id];return !!(d&&(d._multiSiteModel||d._testFiction||d.exempleCharge||(d._demo&&d._demo.fictional)));}
function placeOfId(id){var d=root.STORE&&root.STORE.etabs[id]||{};return [d.etabVille,d.etabQuartier].map(function(x){return String(x==null?'':x).trim();}).filter(Boolean).join(' \u00b7 ');}
function barHidden(id){var d=root.STORE&&root.STORE.etabs[id];return !!(d&&d._barHidden);}
function cardHtml(s,RK,T,i){
  var o=RK[s.id],ix=o.index,lv=ix==null?null:LEVEL.score(ix),col=lv==null?'inherit':palette()[lv];
  var reasons=ROWS.filter(function(r){return bestIndex(r,DATA.snaps)===DATA.snaps.indexOf(s)&&T.why&&T.why[r.key];}).map(function(r){return T.why[r.key];}).filter(function(x,i,a){return a.indexOf(x)===i;});
  var chip=function(key,label){var r=ROWS.filter(function(x){return x.key===key;})[0],v=r?(r.get?r.get(s):s.k[key]):null;if(v==null)return '';var l=LEVEL[key]?LEVEL[key](v):null,c=l==null?'inherit':palette()[l];return '<span class="cmp12-chip'+(l===0?' crit':'')+'" style="--c:'+c+'"><i>'+esc(label)+'</i><b>'+esc(key==='caNet'?fPct(v):r.fmt(v,s))+'</b></span>';};
  var picked=UI.sel.indexOf(s.id)>=0,hiddenBar=barHidden(s.id);
  return '<article class="cmp12-card'+(lv===0?' crit':'')+(s.id===root.STORE.actif?' actif':'')+'" style="--i:'+Math.min(i,12)+'">'+
    '<header><span class="cmp12-rk">'+(o.rank!=null?'#'+o.rank:'—')+'</span><div class="cmp12-id"><b>'+esc(s.name)+'</b>'+(placeOfId(s.id)?'<span class="cmp12-place">\ud83d\udccd '+esc(placeOfId(s.id))+'</span>':'')+'<span>'+esc([s.kind,s.nature.label].filter(Boolean).join(' · '))+(hiddenBar?' · '+esc(T.barHiddenTag):'')+'</span></div>'+
    '<label class="cmp12-pick" title="'+esc(T.pickTitle)+'"><input type="checkbox"'+(picked?' checked':'')+' onchange="verdictCompareToggle(\''+esc(s.id)+'\')"><span>'+esc(T.pick)+'</span></label></header>'+
    /* C218 (W72) : un établissement complet n'est jamais « non calculable » ; tant qu'il est le seul calculé, il garde son
       indice et ses chiffres, et le classement attend un deuxième dossier. */
    (ix==null&&s.calculated&&s.k.score!=null?'<div class="cmp12-score"><b style="color:'+palette()[LEVEL.score(s.k.score)]+'">'+s.k.score+'<small>/100</small></b><span class="cmp12-lvl" style="color:'+palette()[LEVEL.score(s.k.score)]+'">'+esc(T.scoreOwn||'')+' · '+esc(T.levels[LEVEL.score(s.k.score)])+'</span><div class="cmp12-bar"><i data-w="'+s.k.score+'" style="background:'+palette()[LEVEL.score(s.k.score)]+'"></i></div></div>'+
      '<p class="cmp12-line">'+esc(fEur(s.k.ca))+' '+esc(T.ofSales)+' → <b>'+esc(fEur(s.k.res))+' '+esc(T.netWord)+'</b> = <b style="color:'+(LEVEL.caNet(s.k.marge)!=null?palette()[LEVEL.caNet(s.k.marge)]:'inherit')+'">'+esc(fPct(s.k.marge))+'</b> '+esc(T.ofCa)+'</p>'+
      '<div class="cmp12-chips">'+chip('mat',T.chipMat)+chip('ms',T.chipMs)+chip('prime',T.chipPrime)+chip('pm',T.chipPm)+'</div>'+
      '<p class="cmp12-na">'+esc(T.alone||'')+'</p>':
    ix==null?'<div class="cmp12-na">'+esc(T.notCalc)+' · '+esc(T.incomplete)+'</div>':
      '<div class="cmp12-score"><b style="color:'+col+'">'+ix+'<small>/100</small></b><span class="cmp12-lvl" style="color:'+col+'">'+esc(T.levels[lv])+'</span><div class="cmp12-bar"><i data-w="'+ix+'" style="background:'+col+'"></i></div></div>'+
      '<p class="cmp12-line">'+esc(fEur(s.k.ca))+' '+esc(T.ofSales)+' → <b>'+esc(fEur(s.k.res))+' '+esc(T.netWord)+'</b> = <b style="color:'+(LEVEL.caNet(s.k.marge)!=null?palette()[LEVEL.caNet(s.k.marge)]:'inherit')+'">'+esc(fPct(s.k.marge))+'</b> '+esc(T.ofCa)+'</p>'+
      '<div class="cmp12-chips">'+chip('mat',T.chipMat)+chip('ms',T.chipMs)+chip('prime',T.chipPrime)+chip('pm',T.chipPm)+'</div>'+
      (reasons.length?'<p class="cmp12-why">★ '+esc(reasons.slice(0,3).join(' · '))+'</p>':''))+
    '<footer><button type="button" class="cmp12-eye" onclick="verdictCompareBar(\''+esc(s.id)+'\')">'+(hiddenBar?'👁 '+esc(T.barShow):'◌ '+esc(T.barHide))+'</button>'+
    '<button type="button" class="cmp12-open" onclick="verdictCompareGo(\''+esc(s.id)+'\')">'+esc(T.openEtab)+' →</button></footer></article>';
}
var DATA={snaps:[],RK:{}};
function filtered(){
  var q=UI.query.trim().toLowerCase();
  return DATA.snaps.filter(function(s){
    if(UI.filter==='real'&&isModel(s))return false;if(UI.filter==='model'&&!isModel(s))return false;
    if(UI.filter==='crit'){var o=DATA.RK[s.id];if(!(o.index!=null&&LEVEL.score(o.index)===0))return false;}
    return !q||(s.name+' '+placeOfId(s.id)).toLowerCase().indexOf(q)>=0;});
}
function rankHtml(T){
  var list=filtered(),n=function(f){var keep=UI.filter;UI.filter=f;var c=filtered().length;UI.filter=keep;return c;};
  var h='<div class="cmp12-filters">'+[['all',T.fAll],['real',T.fReal],['model',T.fModel],['crit',T.fCrit]].map(function(x){return '<button type="button" class="'+(UI.filter===x[0]?'on':'')+'" onclick="verdictCompareFilter(\''+x[0]+'\')">'+esc(x[1])+' <i>'+n(x[0])+'</i></button>';}).join('')+
    (DATA.snaps.length>6?'<input type="search" class="cmp12-search" placeholder="'+esc(T.search)+'" value="'+esc(UI.query)+'" oninput="verdictCompareSearch(this.value)">':'')+'</div>';
  h+=list.length?'<div class="cmp12-cards">'+list.map(function(s,i){return cardHtml(s,DATA.RK,T,i);}).join('')+'</div>':'<div class="cmp12-state">'+esc(T.noMatch)+'</div>';
  return h;
}
function tableHtml(T){
  var snaps=DATA.snaps.filter(function(s){return UI.sel.indexOf(s.id)>=0;}),RK=DATA.RK,h='';
  if(snaps.length<2)return '<div class="cmp12-state">'+esc(T.pickHint)+'</div>';
  h+='<div class="cmp12-wrap"><div class="cmp12-grid" style="--n:'+snaps.length+'">';
  h+='<div class="cmp12-head cmp12-lab"><small>'+esc(T.ind)+'</small></div>';
  snaps.forEach(function(s,i){var rkInfo=RK[s.id];h+='<div class="cmp12-head cmp12-col'+(s.id===root.STORE.actif?' actif':'')+'" style="--i:'+i+'">'+(rkInfo.rank!=null?'<i class="cmp12-rank">#'+rkInfo.rank+'</i>':'')+'<b style="color:'+(s.zone?s.zone.h:'inherit')+'">'+esc(s.name)+'</b>'+(placeOfId(s.id)?'<span class="cmp12-place">\ud83d\udccd '+esc(placeOfId(s.id))+'</span>':'')+'<span>'+esc([s.kind,s.nature.label,s.nature.period].filter(Boolean).join(' · '))+'</span>'+(s.calculated?'':'<span>'+esc(T.incomplete)+'</span>')+'</div>';});
  h+='<div class="cmp12-lab">'+esc(T.overall)+'<small>'+esc(T.overallSub)+'</small></div>';
  snaps.forEach(function(s,i){var o=RK[s.id];if(o.index==null){h+='<div class="cmp12-val na cmp12-col" style="--i:'+i+'">'+esc(s.calculated?T.alone||T.notCalc:T.notCalc)+'</div>';return;}var lv=LEVEL.score(o.index),col=palette()[lv];h+='<div class="cmp12-val cmp12-col'+(lv===0?' critique':'')+'" style="--i:'+i+'"><span style="color:'+col+'">'+o.index+'/100</span><small class="cmp12-lvl" style="color:'+col+'">'+esc(T.levels[lv])+'</small><em>'+esc(T.rank)+' #'+o.rank+' '+esc(T.of)+' '+o.n+'</em><div class="cmp12-bar"><i data-w="'+o.index+'" style="background:'+col+'"></i></div></div>';});
  ROWS.forEach(function(r){
    var vals=snaps.map(function(s){return r.get?r.get(s):s.k[r.key];}),med=median(vals),best=bestIndex(r,snaps);
    h+='<div class="cmp12-lab">'+esc(T[r.key])+(T.sub&&T.sub[r.key]?'<small>'+esc(T.sub[r.key])+'</small>':'')+(T.rep&&T.rep[r.key]?'<small>'+esc(T.rep[r.key])+'</small>':'')+'<small>'+esc(r.hint?T[r.hint]:(r.better==='low'?T.better_low:r.better==='high'?T.better_high:T.neutral))+(med!=null&&!r.noDelta?' · '+esc(T.median)+' '+esc(r.get?fPct(med):r.fmt(med)):'')+'</small></div>';
    snaps.forEach(function(s,i){
      var v=r.get?r.get(s):s.k[r.key];
      if(v==null){h+='<div class="cmp12-val na cmp12-col" style="--i:'+i+'">'+esc(T.na)+'</div>';return;}
      var delta=(med!=null&&r.key!=='score'&&!r.noDelta)?v-med:null,dTxt='';
      if(delta!=null&&Math.abs(delta)>0.0001){var amount=r.key==='ticket'?fEur2(Math.abs(delta)):r.key==='cmd'?fNum(Math.abs(delta),1):fPct(Math.abs(delta)).replace(' %',' pt');var good=r.better==='neutral'?null:(r.better==='high'?delta>0:delta<0);dTxt=amount+' '+(delta>0?T.above:T.below)+(good==null?'':' · '+(good?T.good:T.bad));}
      var lvl=LEVEL[r.key]?LEVEL[r.key](v):null,col=lvl==null?null:palette()[lvl];
      var bar=r.bar?'<div class="cmp12-bar"><i data-w="'+Math.max(0,Math.min(100,r.bar(v)/r.max*100)).toFixed(1)+'"'+(col?' style="background:'+col+'"':'')+'></i></div>':'';
      var badge=lvl==null?'':'<small class="cmp12-lvl" style="color:'+col+'">'+esc(T.levels[lvl])+'</small>';
      h+='<div class="cmp12-val cmp12-col'+(i===best?' best':'')+(lvl===0?' critique':'')+'" style="--i:'+i+'" data-best="'+esc(T.best)+'"><span'+(col?' style="color:'+col+'"':'')+'>'+esc(r.fmt(v,s))+'</span>'+badge+(r.note?'<em>'+esc(r.note(v,s))+'</em>':'')+(dTxt?'<em>'+esc(dTxt)+'</em>':'')+(i===best?'<small class="cmp12-why">★ '+esc(T.best)+(T.why&&T.why[r.key]?' · '+esc(T.why[r.key]):'')+'</small>':'')+bar+'</div>';
    });
  });
  h+='</div></div><div class="cmp12-vera"><i>V</i><div><b>'+esc(T.vera)+'</b> · '+esc(veraLine(snaps))+'</div></div>';
  return h;
}
function bodyHtml(){
  var T=L(),h='';
  h+='<div class="cmp12-tabs" role="tablist"><button type="button" role="tab" aria-selected="'+(UI.view==='rank')+'" class="'+(UI.view==='rank'?'on':'')+'" onclick="verdictCompareView(\'rank\')">'+esc(T.tabRank)+' <i>'+DATA.snaps.length+'</i></button><button type="button" role="tab" aria-selected="'+(UI.view==='table')+'" class="'+(UI.view==='table'?'on':'')+'" onclick="verdictCompareView(\'table\')">'+esc(T.tabTable)+' <i>'+UI.sel.length+'</i></button></div>';
  h+=UI.view==='rank'?rankHtml(T):tableHtml(T);
  return h;
}
function animateBars(m){root.requestAnimationFrame(function(){root.setTimeout(function(){m.querySelectorAll('.cmp12-bar i').forEach(function(b){b.style.width=b.getAttribute('data-w')+'%';});},160);});}
function rerender(){var m=doc.getElementById('mCompare');if(!m)return;var b=m.querySelector('.cmp12-body');if(!b)return;var y=b.scrollTop;b.innerHTML=bodyHtml();b.scrollTop=y;animateBars(m);}
function open(){
  var T=L();ensureStyle();close();
  var ids=typeof root.etabList==='function'?root.etabList():[];
  var snaps=ids.map(snapshot).filter(Boolean);
  var RK=overallRank(snaps,ROWS);
  snaps.sort(function(a,b){var ra=RK[a.id].rank,rb=RK[b.id].rank;if(ra==null&&rb==null)return 0;if(ra==null)return 1;if(rb==null)return -1;return ra-rb;});
  DATA={snaps:snaps,RK:RK};
  UI.sel=UI.sel.filter(function(id){return ids.indexOf(id)>=0;});
  if(!UI.sel.length)UI.sel=snaps.filter(function(s){return RK[s.id].rank!=null;}).slice(0,3).map(function(s){return s.id;});
  if(snaps.length<=4)UI.view=UI.view||'rank';
  var hiddenCount=0;try{if(typeof root.etabAllList==='function')hiddenCount=root.etabAllList().length-ids.length;}catch(e){}
  var h='<div class="sheet"><div class="grab"></div><div class="cmp12-k">'+esc(T.kicker)+'</div><h3>'+esc(T.title)+'</h3>';
  if(snaps.length<2){h+='<div class="cmp12-state">'+esc(T.need2)+'</div>';}
  else{
    var allConclusive=snaps.every(function(s){return s.conclusive;});
    var podium=snaps.filter(function(s){return RK[s.id].rank!=null;}).slice(0,3);
    if(podium.length){h+='<div class="cmp12-podium"><div class="cmp12-k">'+esc(T.podium)+' · '+snaps.length+' '+esc(T.etabs)+'</div><div class="cmp12-pods">'+podium.map(function(s,i){var ix=RK[s.id].index,lv=LEVEL.score(ix),col=palette()[lv];return '<button type="button" class="cmp12-pod'+(i===0?' first':'')+'" onclick="verdictCompareGo(\''+esc(s.id)+'\')"><span class="cmp12-medal">'+(i===0?'🥇':i===1?'🥈':'🥉')+'</span><b>'+esc(s.name)+'</b><span style="color:'+col+'">'+ix+'/100 · '+esc(T.levels[lv])+'</span></button>';}).join('')+'</div><p>'+esc(T.overallSub)+'</p></div>';}
    h+='<div class="cmp12-body">'+bodyHtml()+'</div>';
    h+='<div class="cmp12-state'+(allConclusive?' ok':'')+'">'+esc(allConclusive?T.conclusive:T.indicative)+'</div>';
    var persoState=typeof root.verdictPersoPortfolioState==='function'?root.verdictPersoPortfolioState():null;
    if(persoState&&persoState.deleted.length)h+='<div class="cmp12-foot" style="justify-content:flex-start;align-items:center;gap:10px"><span style="font-size:12.5px;opacity:.8">'+persoState.deleted.length+' '+esc(T.deletedTxt)+'</span><button type="button" class="btn ghost mini" onclick="verdictPersoPortfolioReset()">'+esc(T.resetAll)+'</button></div>';
    if(hiddenCount>0)h+='<div class="cmp12-foot" style="justify-content:flex-start;align-items:center;gap:10px"><span style="font-size:12.5px;opacity:.8">'+hiddenCount+' '+esc(T.hidden)+'</span><button type="button" class="btn ghost mini" onclick="verdictCompareClose();if(window.openEtabs)window.openEtabs()">'+esc(T.manage)+'</button></div>';
  }
  h+='<div class="cmp12-foot"><button type="button" class="btn ghost" onclick="verdictCompareClose()">'+esc(T.close)+'</button></div></div>';
  var m=doc.createElement('div');m.className='modal on';m.id='mCompare';m.innerHTML=h;
  m.addEventListener('click',function(e){if(e.target===m)close();});
  doc.body.appendChild(m);
  try{root.a11yDialogPrepare&&root.a11yDialogPrepare(m);}catch(e){}
  try{var sheet=m.querySelector('.sheet'),bg=root.getComputedStyle(sheet).backgroundColor;if(bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent')m.style.setProperty('--cmp12-sheet',bg);}catch(e){}
  animateBars(m);
  return true;
}
function setView(v){UI.view=v==='table'?'table':'rank';rerender();}
function setFilter(f){UI.filter=f;rerender();}
function setSearch(q){UI.query=String(q||'');var m=doc.getElementById('mCompare');if(!m)return;var cards=m.querySelector('.cmp12-cards');var T=L();var list=filtered();var box=m.querySelector('.cmp12-cards')||m.querySelector('.cmp12-body .cmp12-state');var html=list.length?'<div class="cmp12-cards">'+list.map(function(s,i){return cardHtml(s,DATA.RK,T,i);}).join('')+'</div>':'<div class="cmp12-state">'+esc(T.noMatch)+'</div>';if(box){var tmp=doc.createElement('div');tmp.innerHTML=html;box.parentNode.replaceChild(tmp.firstChild,box);animateBars(m);}}
function toggleSel(id){var i=UI.sel.indexOf(id);if(i>=0)UI.sel.splice(i,1);else{if(UI.sel.length>=4)UI.sel.shift();UI.sel.push(id);}var m=doc.getElementById('mCompare');if(!m)return;var tab=m.querySelectorAll('.cmp12-tabs button i')[1];if(tab)tab.textContent=UI.sel.length;m.querySelectorAll('.cmp12-pick input').forEach(function(x){var on=UI.sel.indexOf((x.getAttribute('onchange')||'').replace(/.*\('([^']+)'\).*/,'$1'))>=0;x.checked=on;});}
/* Masquer de l'accueil : l'établissement quitte la barre de l'accueil mais reste dans le classement et le côte à côte. */
function toggleBar(id){var d=root.STORE&&root.STORE.etabs[id];if(!d)return;d._barHidden=!d._barHidden;try{if(typeof root.save==='function')root.save('bar-visibility');}catch(e){}try{root.drawEtabs&&root.drawEtabs();}catch(e){}rerender();}
function goEtab(id){close();try{if(typeof root.switchEtab==='function')root.switchEtab(id);if(typeof root.go==='function')root.go('pil');}catch(e){}}
function complete(id){close();try{if(typeof root.switchEtab==='function')root.switchEtab(id);if(typeof root.go==='function')root.go('in');}catch(e){}}
/* Cacher = archiver (askDelEtab : confirmation, données conservées, hors barre et hors comparaison) ; la feuille se rouvre après. */
function hide(id){close();try{if(typeof root.askDelEtab==='function')root.askDelEtab(id);}catch(e){}}
root.verdictCompareHide=hide;
root.verdictCompareView=setView;root.verdictCompareFilter=setFilter;root.verdictCompareSearch=setSearch;root.verdictCompareToggle=toggleSel;root.verdictCompareBar=toggleBar;root.verdictCompareGo=goEtab;
root.verdictCompareOpen=open;root.verdictCompareClose=close;root.verdictCompareComplete=complete;
/* Entrée visible : « Comparer » dans la barre d'établissements, dès deux dossiers. */
function decorateBar(){
  var bar=doc.getElementById('etabBar');if(!bar||!bar.classList.contains('on'))return;
  if(bar.querySelector('button.cmp12'))return;
  var gear=bar.querySelector('button.gear');var b=doc.createElement('button');b.type='button';b.className='cmp12';b.setAttribute('onclick','verdictCompareOpen()');b.title=L().title;b.textContent='⇄ '+L().open;
  /* Avec 10 à 20 établissements, le bouton doit être visible sans faire défiler la barre : il passe en tête. */
  bar.insertBefore(b,bar.firstChild);
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
