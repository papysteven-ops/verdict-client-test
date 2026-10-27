(function(root){
  'use strict';
  /* Consolidation 14/10/2026 (C13) : sommes de minimums, résultats estimés et franchissement du point mort
     passent par le moteur exact (VerdictFinance) ; un seul arrondi final au centime, demi à l'écart de zéro. */
  function vyExactSum(values){return root.VerdictFinance.sum(values.map(function(v){return Number(v)||0;})).number(2);}
  function vyExactResult(ca,tva,mc,cf){var F=root.VerdictFinance;return F.fraction(Number(ca)).div(F.fraction(1).add(Number(tva)||0)).mul(Number(mc)).sub(typeof cf==='object'?cf:Number(cf)).number(2);}
  function vyExactScope(cf,part,full){var F=root.VerdictFinance;if(!(full>0)||F.fraction(Number(part)).cmp(Number(full))>=0)return Number(cf);return F.fraction(Number(cf)).mul(Number(part)).div(Number(full));}
  if(!root.document||root.VerdictModuleProfilesV45)return;

  var VERSION='verdict-module-profiles/v45.1.7';
  var query=new URLSearchParams(root.__vdq||root.location.search);
  var embedded=query.get('embed')==='1'&&root.parent!==root;
  var originalGo=typeof root.go==='function'?root.go:null;
  var originalMainNavView=typeof root.mainNavView==='function'?root.mainNavView:null;
  var originalDrawCarte=typeof root.drawCarte==='function'?root.drawCarte:null;
  var originalDrawData=typeof root.drawData==='function'?root.drawData:null;
  var originalDrawSante=typeof root.drawSante==='function'?root.drawSante:null;
  var originalDrawPil=typeof root.drawPil==='function'?root.drawPil:null;
  var originalDrawMenu=typeof root.drawMenu==='function'?root.drawMenu:null;
  var profile=cleanProfile(query.get('profile')||readProfile());
  var pendingProfileMessage=null,profileMessageQueued=false,profileMessageChannel=null,profileNotificationSequence=0;
  var MAX_HOME_BLOCKS=3,CONCLUSION_WORD_LIMIT=60;

  var UI={
    fr:{home:'Accueil',structure:'Structure',menu:'Carte',more:'Plus',audit:'Audit',structureTitle:'Structure économique',structureSub:'Score, structure économique, causes et décisions.',menuTitle:'Pilotage de la carte',menuSub:'Plats, recettes, prix, coûts théoriques, marges, canaux et simulations.',emptyTitle:'Ajoutez votre premier plat',emptyText:'Reliez son prix, sa recette, son volume et son canal. Verdict calculera sa marge sans inventer de donnée.',emptyCta:'Ajouter mon premier plat',plusTitle:'Plus',plusSub:'Vos chiffres, votre établissement, votre abonnement et vos préférences.',plusLead:'Aucun achat ni stock ici : ils appartiennent désormais à Inventaire.',fecTitle:'Mes chiffres et FEC',openingTitle:'Jours d’ouverture',openingText:'Renseigner le calendrier utilisé par les projections.',advancedTitle:'Paramètres avancés',advancedText:'Adapter les options de votre établissement.',cash:'Trésorerie — non calculée. Aucun solde bancaire n’est déduit du résultat.',six:'Six domaines calculés montrent ce qui fragilise la structure. La trésorerie reste volontairement hors jauge.',first:'Premier domaine calculé à vérifier : '},
    en:{home:'Home',structure:'Structure',menu:'Menu',more:'More',audit:'Audit',structureTitle:'Economic structure',structureSub:'Score, economic structure, causes and decisions.',menuTitle:'Menu management',menuSub:'Dishes, recipes, prices, theoretical costs, margins, channels and simulations.',emptyTitle:'Add your first dish',emptyText:'Connect its price, recipe, volume and channel. Verdict will calculate its margin without inventing data.',emptyCta:'Add my first dish',plusTitle:'More',plusSub:'Your figures, business, subscription and preferences.',plusLead:'Purchases and stock are not here: they now belong to Inventory.',fecTitle:'My figures and accounting file',openingTitle:'Opening days',openingText:'Set the calendar used by projections.',advancedTitle:'Advanced settings',advancedText:'Adjust the options for your business.',cash:'Cash — not calculated. No bank balance is inferred from profit.',six:'Six calculated areas show what weakens the structure. Cash is intentionally outside the gauge.',first:'First calculated area to check: '},
    es:{home:'Inicio',structure:'Estructura',menu:'Carta',more:'Más',audit:'Auditoría',structureTitle:'Estructura económica',structureSub:'Puntuación, estructura, causas y decisiones.',menuTitle:'Gestión de la carta',menuSub:'Platos, recetas, precios, costes teóricos, márgenes, canales y simulaciones.',emptyTitle:'Añada su primer plato',emptyText:'Vincule precio, receta, volumen y canal. Verdict calculará el margen sin inventar datos.',emptyCta:'Añadir mi primer plato',plusTitle:'Más',plusSub:'Sus cifras, establecimiento, suscripción y preferencias.',plusLead:'Compras y existencias ya no están aquí: pertenecen a Inventario.',fecTitle:'Mis cifras y archivo contable',openingTitle:'Días de apertura',openingText:'Definir el calendario usado por las proyecciones.',advancedTitle:'Ajustes avanzados',advancedText:'Adaptar las opciones del establecimiento.',cash:'Tesorería — no calculada. No se deduce el saldo bancario del resultado.',six:'Seis áreas calculadas muestran qué debilita la estructura. La tesorería queda fuera de la jauge.',first:'Primera área calculada a revisar: '},
    it:{home:'Home',structure:'Struttura',menu:'Menu',more:'Altro',audit:'Audit',structureTitle:'Struttura economica',structureSub:'Punteggio, struttura, cause e decisioni.',menuTitle:'Gestione del menu',menuSub:'Piatti, ricette, prezzi, costi teorici, margini, canali e simulazioni.',emptyTitle:'Aggiungi il primo piatto',emptyText:'Collega prezzo, ricetta, volume e canale. Verdict calcolerà il margine senza inventare dati.',emptyCta:'Aggiungi il primo piatto',plusTitle:'Altro',plusSub:'Dati, attività, abbonamento e preferenze.',plusLead:'Acquisti e scorte non sono qui: ora appartengono a Inventario.',fecTitle:'I miei dati e file contabile',openingTitle:'Giorni di apertura',openingText:'Impostare il calendario usato dalle proiezioni.',advancedTitle:'Impostazioni avanzate',advancedText:'Adatta le opzioni della tua attività.',cash:'Liquidità — non calcolata. Nessun saldo bancario è dedotto dal risultato.',six:'Sei aree calcolate mostrano cosa indebolisce la struttura. La liquidità resta fuori dalla jauge.',first:'Prima area calcolata da verificare: '},
    de:{home:'Start',structure:'Struktur',menu:'Karte',more:'Mehr',audit:'Audit',structureTitle:'Wirtschaftliche Struktur',structureSub:'Score, Struktur, Ursachen und Entscheidungen.',menuTitle:'Kartensteuerung',menuSub:'Gerichte, Rezepte, Preise, Sollkosten, Margen, Kanäle und Simulationen.',emptyTitle:'Erstes Gericht hinzufügen',emptyText:'Verknüpfen Sie Preis, Rezept, Menge und Kanal. Verdict berechnet die Marge ohne erfundene Daten.',emptyCta:'Erstes Gericht hinzufügen',plusTitle:'Mehr',plusSub:'Zahlen, Betrieb, Abonnement und Einstellungen.',plusLead:'Einkauf und Bestand stehen nicht hier: Sie gehören jetzt zur Inventur.',fecTitle:'Meine Zahlen und Buchhaltungsdatei',openingTitle:'Öffnungstage',openingText:'Den Kalender für Prognosen festlegen.',advancedTitle:'Erweiterte Einstellungen',advancedText:'Optionen für Ihren Betrieb anpassen.',cash:'Liquidität — nicht berechnet. Aus dem Ergebnis wird kein Bankstand abgeleitet.',six:'Sechs berechnete Bereiche zeigen Schwachstellen. Liquidität bleibt bewusst außerhalb der Anzeige.',first:'Erster berechneter Prüfbereich: '},
    nl:{home:'Home',structure:'Structuur',menu:'Kaart',more:'Meer',audit:'Audit',structureTitle:'Economische structuur',structureSub:'Score, structuur, oorzaken en beslissingen.',menuTitle:'Kaartsturing',menuSub:'Gerechten, recepten, prijzen, theoretische kosten, marges, kanalen en simulaties.',emptyTitle:'Voeg uw eerste gerecht toe',emptyText:'Koppel prijs, recept, volume en kanaal. Verdict berekent de marge zonder gegevens te verzinnen.',emptyCta:'Mijn eerste gerecht toevoegen',plusTitle:'Meer',plusSub:'Cijfers, zaak, abonnement en voorkeuren.',plusLead:'Inkopen en voorraad staan hier niet: ze horen nu bij Inventaris.',fecTitle:'Mijn cijfers en boekhoudbestand',openingTitle:'Openingsdagen',openingText:'Stel de kalender voor prognoses in.',advancedTitle:'Geavanceerde instellingen',advancedText:'Pas de opties van uw zaak aan.',cash:'Cash — niet berekend. Uit het resultaat wordt geen banksaldo afgeleid.',six:'Zes berekende domeinen tonen wat de structuur verzwakt. Cash blijft bewust buiten de meter.',first:'Eerste berekende domein om te controleren: '},
    pt:{home:'Início',structure:'Estrutura',menu:'Cardápio',more:'Mais',audit:'Auditoria',structureTitle:'Estrutura económica',structureSub:'Pontuação, estrutura, causas e decisões.',menuTitle:'Gestão do cardápio',menuSub:'Pratos, receitas, preços, custos teóricos, margens, canais e simulações.',emptyTitle:'Adicione o primeiro prato',emptyText:'Ligue preço, receita, volume e canal. O Verdict calculará a margem sem inventar dados.',emptyCta:'Adicionar o primeiro prato',plusTitle:'Mais',plusSub:'Números, estabelecimento, subscrição e preferências.',plusLead:'Compras e stock não estão aqui: pertencem agora ao Inventário.',fecTitle:'Os meus números e ficheiro contabilístico',openingTitle:'Dias de abertura',openingText:'Definir o calendário usado nas projeções.',advancedTitle:'Definições avançadas',advancedText:'Adaptar as opções do estabelecimento.',cash:'Tesouraria — não calculada. Nenhum saldo bancário é deduzido do resultado.',six:'Seis áreas calculadas mostram o que fragiliza a estrutura. A tesouraria fica fora da jauge.',first:'Primeira área calculada a verificar: '}
  };

  /* Les réglages internes et l'état du code ne sont jamais exposés au client.
     Ces libellés restent centrés sur son établissement et ses décisions. */
  var CLIENT_PLUS_COPY={
    fr:{plusSub:'Vos chiffres, votre établissement, votre abonnement et vos préférences.',advancedTitle:'Préférences avancées',advancedText:'Adapter les options de votre établissement.',cash:'Trésorerie — non calculée. Aucun solde bancaire n’est déduit du résultat.'},
    en:{plusSub:'Your figures, business, subscription and preferences.',advancedTitle:'Advanced preferences',advancedText:'Adjust the options for your business.',cash:'Cash — not calculated. No bank balance is inferred from profit.'},
    es:{plusSub:'Sus cifras, establecimiento, suscripción y preferencias.',advancedTitle:'Preferencias avanzadas',advancedText:'Adaptar las opciones del establecimiento.',cash:'Tesorería — no calculada. No se deduce el saldo bancario del resultado.'},
    it:{plusSub:'Dati, attività, abbonamento e preferenze.',advancedTitle:'Preferenze avanzate',advancedText:'Adatta le opzioni della tua attività.',cash:'Liquidità — non calcolata. Nessun saldo bancario è dedotto dal risultato.'},
    de:{plusSub:'Zahlen, Betrieb, Abonnement und Einstellungen.',advancedTitle:'Erweiterte Einstellungen',advancedText:'Optionen für Ihren Betrieb anpassen.',cash:'Liquidität — nicht berechnet. Aus dem Ergebnis wird kein Bankstand abgeleitet.'},
    nl:{plusSub:'Cijfers, zaak, abonnement en voorkeuren.',advancedTitle:'Geavanceerde voorkeuren',advancedText:'Pas de opties van uw zaak aan.',cash:'Cash — niet berekend. Uit het resultaat wordt geen banksaldo afgeleid.'},
    pt:{plusSub:'Números, estabelecimento, subscrição e preferências.',advancedTitle:'Preferências avançadas',advancedText:'Adaptar as opções do estabelecimento.',cash:'Tesouraria — não calculada. Nenhum saldo bancário é deduzido do resultado.'}
  };
  Object.keys(CLIENT_PLUS_COPY).forEach(function(language){
    if(!UI[language])return;
    Object.keys(CLIENT_PLUS_COPY[language]).forEach(function(key){UI[language][key]=CLIENT_PLUS_COPY[language][key];});
  });

  var ACCOUNTING={
    fr:{k:'COMPTES 68 · TRAITEMENT SÉPARÉ',title:'Amortissements, dépréciations et provisions',before:'Activité avant amortissements',after:'Résultat comptable avant impôt',p1:'Votre activité produit {x} avant amortissements.',p2:'Après amortissements, votre résultat avant impôt est {x}.',p3:'Cela ne signifie pas que {x} se trouve sur le compte bancaire.'},
    en:{k:'ACCOUNT 68 · SEPARATE TREATMENT',title:'Depreciation, impairment and provisions',before:'Activity before depreciation',after:'Accounting profit before tax',p1:'Your activity produces {x} before depreciation.',p2:'After depreciation, your profit before tax is {x}.',p3:'This does not mean {x} is in the bank account.'},
    es:{k:'CUENTAS 68 · TRATAMIENTO SEPARADO',title:'Amortizaciones, deterioros y provisiones',before:'Actividad antes de amortizaciones',after:'Resultado contable antes de impuestos',p1:'Su actividad produce {x} antes de amortizaciones.',p2:'Después de amortizaciones, el resultado antes de impuestos es {x}.',p3:'Esto no significa que {x} esté en la cuenta bancaria.'},
    it:{k:'CONTI 68 · TRATTAMENTO SEPARATO',title:'Ammortamenti, svalutazioni e accantonamenti',before:'Attività prima degli ammortamenti',after:'Risultato contabile ante imposte',p1:'L’attività produce {x} prima degli ammortamenti.',p2:'Dopo gli ammortamenti, il risultato ante imposte è {x}.',p3:'Questo non significa che {x} si trovi sul conto bancario.'},
    de:{k:'KONTEN 68 · GETRENNTE BEHANDLUNG',title:'Abschreibungen, Wertminderungen und Rückstellungen',before:'Tätigkeit vor Abschreibungen',after:'Bilanzergebnis vor Steuern',p1:'Ihre Tätigkeit erwirtschaftet vor Abschreibungen {x}.',p2:'Nach Abschreibungen beträgt das Ergebnis vor Steuern {x}.',p3:'Das bedeutet nicht, dass {x} auf dem Bankkonto liegt.'},
    nl:{k:'REKENINGEN 68 · APARTE BEHANDELING',title:'Afschrijvingen, waardeverminderingen en voorzieningen',before:'Activiteit vóór afschrijvingen',after:'Boekhoudkundig resultaat vóór belasting',p1:'Uw activiteit levert vóór afschrijvingen {x} op.',p2:'Na afschrijvingen is het resultaat vóór belasting {x}.',p3:'Dit betekent niet dat {x} op de bankrekening staat.'},
    pt:{k:'CONTAS 68 · TRATAMENTO SEPARADO',title:'Amortizações, imparidades e provisões',before:'Atividade antes de amortizações',after:'Resultado contabilístico antes de imposto',p1:'A atividade produz {x} antes de amortizações.',p2:'Após amortizações, o resultado antes de imposto é {x}.',p3:'Isto não significa que {x} esteja na conta bancária.'}
  };

  var HOME={
    fr:{k:'PILOTAGE',noDataTitle:'Ajoutez vos chiffres pour commencer',noDataText:'Importez votre FEC ou décrivez votre situation. Aucun score, ratio ni zéro ne sera affiché avant des données réelles.',noDataCta:'Importer mon FEC ou saisir ma situation',today:'Aujourd’hui',dayRecorded:'Journée enregistrée',dayPending:'Journée à renseigner',dayClosed:'Fermé aujourd’hui',actual:'CA du jour',target:'Objectif',gap:'Écart',input:'Saisir ma journée',month:'CE MOIS-CI',monthTitle:'Situation du mois',cumulative:'CA cumulé',projection:'Projection',threshold:'Minimum',wait:'La projection apparaîtra après des journées comparables et un calendrier confirmé.',priority:'ACTION PRIORITAIRE',stock:'URGENCE INVENTAIRE',none:'Aucune urgence détectée',noneText:'Aucun signal prioritaire ne nécessite une action immédiate avec les données disponibles.',understand:'Comprendre',openInventory:'Ouvrir Inventaire',details:'Données et outils complémentaires',detailsText:'Fonctions avancées conservées',preopen:'AVANT OUVERTURE',preopenTitle:'Vous préparez votre ouverture',preopenText:'Le suivi quotidien commencera après l’ouverture. Vos hypothèses restent disponibles et modifiables.',open:'Nous avons ouvert',unknown:'À renseigner'},
    en:{k:'MANAGEMENT',noDataTitle:'Add your figures to begin',noDataText:'Import your accounting file or describe your situation. No score, ratio or artificial zero appears before real data.',noDataCta:'Import my file or enter my situation',today:'Today',dayRecorded:'Day recorded',dayPending:'Day to enter',dayClosed:'Closed today',actual:'Daily revenue',target:'Target',gap:'Gap',input:'Enter my day',month:'THIS MONTH',monthTitle:'Monthly position',cumulative:'Revenue to date',projection:'Projection',threshold:'Minimum',wait:'The projection appears after comparable days and a confirmed calendar.',priority:'PRIORITY ACTION',stock:'INVENTORY URGENCY',none:'No urgent action',noneText:'No priority signal requires immediate action with the available data.',understand:'Understand',openInventory:'Open Inventory',details:'Additional data and tools',detailsText:'Advanced functions retained',preopen:'BEFORE OPENING',preopenTitle:'You are preparing to open',preopenText:'Daily tracking begins after opening. Your assumptions remain available and editable.',open:'We are open',unknown:'To enter'},
    es:{k:'PILOTAJE',noDataTitle:'Añada sus cifras para empezar',noDataText:'Importe su archivo contable o describa su situación. No aparece ninguna puntuación, ratio o cero artificial antes de datos reales.',noDataCta:'Importar archivo o indicar situación',today:'Hoy',dayRecorded:'Jornada registrada',dayPending:'Jornada por registrar',dayClosed:'Cerrado hoy',actual:'Ventas del día',target:'Objetivo',gap:'Diferencia',input:'Registrar mi jornada',month:'ESTE MES',monthTitle:'Situación del mes',cumulative:'Ventas acumuladas',projection:'Proyección',threshold:'Mínimo',wait:'La proyección aparecerá tras jornadas comparables y un calendario confirmado.',priority:'ACCIÓN PRIORITARIA',stock:'URGENCIA DE INVENTARIO',none:'Sin urgencia',noneText:'Ninguna señal prioritaria requiere una acción inmediata con los datos disponibles.',understand:'Comprender',openInventory:'Abrir Inventario',details:'Datos y herramientas adicionales',detailsText:'Funciones avanzadas conservadas',preopen:'ANTES DE ABRIR',preopenTitle:'Está preparando la apertura',preopenText:'El seguimiento diario empezará después de abrir. Sus hipótesis siguen disponibles y editables.',open:'Ya hemos abierto',unknown:'Por registrar'},
    it:{k:'PILOTAGGIO',noDataTitle:'Aggiungi i dati per iniziare',noDataText:'Importa il file contabile o descrivi la situazione. Prima dei dati reali non appare alcun punteggio, rapporto o zero artificiale.',noDataCta:'Importa il file o inserisci la situazione',today:'Oggi',dayRecorded:'Giornata registrata',dayPending:'Giornata da inserire',dayClosed:'Chiuso oggi',actual:'Incasso del giorno',target:'Obiettivo',gap:'Scarto',input:'Inserisci la giornata',month:'QUESTO MESE',monthTitle:'Situazione del mese',cumulative:'Incasso cumulato',projection:'Proiezione',threshold:'Minimo',wait:'La proiezione apparirà dopo giornate comparabili e un calendario confermato.',priority:'AZIONE PRIORITARIA',stock:'URGENZA INVENTARIO',none:'Nessuna urgenza',noneText:'Nessun segnale prioritario richiede un’azione immediata con i dati disponibili.',understand:'Capire',openInventory:'Apri Inventario',details:'Dati e strumenti aggiuntivi',detailsText:'Funzioni avanzate conservate',preopen:'PRIMA DELL’APERTURA',preopenTitle:'Stai preparando l’apertura',preopenText:'Il monitoraggio giornaliero inizierà dopo l’apertura. Le ipotesi restano disponibili e modificabili.',open:'Abbiamo aperto',unknown:'Da inserire'},
    de:{k:'STEUERUNG',noDataTitle:'Zahlen hinzufügen und starten',noDataText:'Importieren Sie Ihre Buchhaltungsdatei oder beschreiben Sie die Lage. Vor echten Daten erscheinen kein Score, Verhältnis oder künstlicher Nullwert.',noDataCta:'Datei importieren oder Lage erfassen',today:'Heute',dayRecorded:'Tag erfasst',dayPending:'Tag erfassen',dayClosed:'Heute geschlossen',actual:'Tagesumsatz',target:'Ziel',gap:'Abstand',input:'Tag erfassen',month:'DIESER MONAT',monthTitle:'Monatslage',cumulative:'Umsatz bisher',projection:'Projektion',threshold:'Minimum',wait:'Die Projektion erscheint nach vergleichbaren Tagen und einem bestätigten Kalender.',priority:'PRIORITÄT',stock:'INVENTUR-DRINGLICHKEIT',none:'Keine dringende Aktion',noneText:'Mit den verfügbaren Daten erfordert kein Prioritätssignal sofortiges Handeln.',understand:'Verstehen',openInventory:'Inventur öffnen',details:'Weitere Daten und Werkzeuge',detailsText:'Erweiterte Funktionen bleiben erhalten',preopen:'VOR DER ERÖFFNUNG',preopenTitle:'Sie bereiten die Eröffnung vor',preopenText:'Die tägliche Steuerung beginnt nach der Eröffnung. Ihre Annahmen bleiben verfügbar und bearbeitbar.',open:'Wir haben geöffnet',unknown:'Zu erfassen'},
    nl:{k:'STURING',noDataTitle:'Voeg cijfers toe om te beginnen',noDataText:'Importeer uw boekhoudbestand of beschrijf uw situatie. Vóór echte gegevens verschijnt geen score, verhouding of kunstmatige nul.',noDataCta:'Bestand importeren of situatie invoeren',today:'Vandaag',dayRecorded:'Dag opgeslagen',dayPending:'Dag invoeren',dayClosed:'Vandaag gesloten',actual:'Dagomzet',target:'Doel',gap:'Verschil',input:'Mijn dag invoeren',month:'DEZE MAAND',monthTitle:'Maandpositie',cumulative:'Omzet tot nu',projection:'Projectie',threshold:'Minimum',wait:'De projectie verschijnt na vergelijkbare dagen en een bevestigde kalender.',priority:'PRIORITEIT',stock:'URGENTIE INVENTARIS',none:'Geen urgente actie',noneText:'Met de beschikbare gegevens vraagt geen prioriteitssignaal om onmiddellijke actie.',understand:'Begrijpen',openInventory:'Inventaris openen',details:'Aanvullende gegevens en tools',detailsText:'Geavanceerde functies behouden',preopen:'VOOR OPENING',preopenTitle:'U bereidt de opening voor',preopenText:'Dagelijkse sturing begint na de opening. Uw aannames blijven beschikbaar en bewerkbaar.',open:'Wij zijn open',unknown:'In te voeren'},
    pt:{k:'PILOTAGEM',noDataTitle:'Adicione os números para começar',noDataText:'Importe o ficheiro contabilístico ou descreva a situação. Nenhuma pontuação, rácio ou zero artificial aparece antes de dados reais.',noDataCta:'Importar ficheiro ou indicar situação',today:'Hoje',dayRecorded:'Dia registado',dayPending:'Dia por registar',dayClosed:'Fechado hoje',actual:'Receita do dia',target:'Objetivo',gap:'Desvio',input:'Registar o meu dia',month:'ESTE MÊS',monthTitle:'Situação do mês',cumulative:'Receita acumulada',projection:'Projeção',threshold:'Mínimo',wait:'A projeção aparecerá após dias comparáveis e um calendário confirmado.',priority:'AÇÃO PRIORITÁRIA',stock:'URGÊNCIA DE INVENTÁRIO',none:'Sem urgência',noneText:'Nenhum sinal prioritário exige ação imediata com os dados disponíveis.',understand:'Compreender',openInventory:'Abrir Inventário',details:'Dados e ferramentas adicionais',detailsText:'Funções avançadas conservadas',preopen:'ANTES DA ABERTURA',preopenTitle:'Está a preparar a abertura',preopenText:'O acompanhamento diário começa após a abertura. As hipóteses permanecem disponíveis e editáveis.',open:'Já abrimos',unknown:'Por registar'}
  };

  var CARTE_PLUS={
    fr:{items:[['dishes','▤','Plats et ventes','Prix, volumes, classement et menu engineering'],['ingredients','◌','Ingrédients','Prix d’achat, unités et coûts matière'],['preps','◫','Préparations','Sous-recettes et coûts intermédiaires'],['extras','＋','Suppléments','Options et coûts additionnels'],['channels','⇄','Caisse et plateformes','Périodes, volumes, commissions et rapprochements'],['stress','⌁','Simulations Carte','Tester prix, matière, volume et canal'],['settings','⚙','Objectifs et hypothèses','TVA, pertes, packaging et marges cibles']]},
    en:{items:[['dishes','▤','Dishes and sales','Prices, volumes, ranking and menu engineering'],['ingredients','◌','Ingredients','Purchase prices, units and food costs'],['preps','◫','Preparations','Sub-recipes and intermediate costs'],['extras','＋','Extras','Options and additional costs'],['channels','⇄','POS and platforms','Periods, volumes, commissions and reconciliation'],['stress','⌁','Menu simulations','Test price, food cost, volume and channel'],['settings','⚙','Targets and assumptions','VAT, waste, packaging and margin targets']]},
    es:{items:[['dishes','▤','Platos y ventas','Precios, volúmenes, clasificación e ingeniería de menú'],['ingredients','◌','Ingredientes','Precios de compra, unidades y costes de materia'],['preps','◫','Preparaciones','Subrecetas y costes intermedios'],['extras','＋','Suplementos','Opciones y costes adicionales'],['channels','⇄','Caja y plataformas','Períodos, volúmenes, comisiones y conciliación'],['stress','⌁','Simulaciones de carta','Probar precio, materia, volumen y canal'],['settings','⚙','Objetivos e hipótesis','IVA, pérdidas, embalaje y márgenes objetivo']]},
    it:{items:[['dishes','▤','Piatti e vendite','Prezzi, volumi, classifica e menu engineering'],['ingredients','◌','Ingredienti','Prezzi di acquisto, unità e costi materia'],['preps','◫','Preparazioni','Sotto-ricette e costi intermedi'],['extras','＋','Supplementi','Opzioni e costi aggiuntivi'],['channels','⇄','Cassa e piattaforme','Periodi, volumi, commissioni e riconciliazione'],['stress','⌁','Simulazioni menu','Testare prezzo, materia, volume e canale'],['settings','⚙','Obiettivi e ipotesi','IVA, perdite, packaging e margini obiettivo']]},
    de:{items:[['dishes','▤','Gerichte und Verkäufe','Preise, Mengen, Rangfolge und Menu Engineering'],['ingredients','◌','Zutaten','Einkaufspreise, Einheiten und Wareneinsatz'],['preps','◫','Vorbereitungen','Unterrezepte und Zwischenkosten'],['extras','＋','Zusätze','Optionen und Zusatzkosten'],['channels','⇄','Kasse und Plattformen','Zeiträume, Mengen, Provisionen und gemeinsame Auswertung'],['stress','⌁','Kartensimulationen','Preis, Waren, Menge und Kanal testen'],['settings','⚙','Ziele und Annahmen','MwSt., Verlust, Verpackung und Margenziele']]},
    nl:{items:[['dishes','▤','Gerechten en verkoop','Prijzen, volumes, rangschikking en menu-engineering'],['ingredients','◌','Ingrediënten','Inkoopprijzen, eenheden en productkosten'],['preps','◫','Bereidingen','Subrecepten en tussenkosten'],['extras','＋','Supplementen','Opties en extra kosten'],['channels','⇄','Kassa en platforms','Perioden, volumes, commissies en aansluiting'],['stress','⌁','Kaartsimulaties','Prijs, product, volume en kanaal testen'],['settings','⚙','Doelen en aannames','Btw, verlies, verpakking en margedoelen']]},
    pt:{items:[['dishes','▤','Pratos e vendas','Preços, volumes, classificação e engenharia de menu'],['ingredients','◌','Ingredientes','Preços de compra, unidades e custos de matéria'],['preps','◫','Preparações','Sub-receitas e custos intermédios'],['extras','＋','Suplementos','Opções e custos adicionais'],['channels','⇄','Caixa e plataformas','Períodos, volumes, comissões e reconciliação'],['stress','⌁','Simulações do menu','Testar preço, matéria, volume e canal'],['settings','⚙','Objetivos e hipóteses','IVA, perdas, embalagem e margens-alvo']]}
  };

  function locale(){var value=String(root.LOCALE||root.document.documentElement.lang||'fr').slice(0,2).toLowerCase();return UI[value]?value:'fr';}
  function ui(){return UI[locale()]||UI.fr;}
  function cleanProfile(value){return value==='carte'?'carte':'pilotage';}
  function readProfile(){try{return root.sessionStorage.getItem('verdict:v45:profile')||'';}catch(e){return '';}}
  function saveProfile(){try{root.sessionStorage.setItem('verdict:v45:profile',profile);}catch(e){}}
  function labelButton(button,label){
    if(!button)return;button.setAttribute('aria-label',label);
    var wrapped=button.querySelector(':scope > .premium-dock-label');
    if(wrapped){
      wrapped.textContent=label;
      Array.from(button.childNodes).forEach(function(node){if(node.nodeType===3||(node.nodeType===1&&node!==wrapped&&node.classList.contains('premium-dock-label')))node.remove();});
      return;
    }
    for(var i=button.childNodes.length-1;i>=0;i--)if(button.childNodes[i].nodeType===3){button.childNodes[i].nodeValue=label;return;}
    button.appendChild(root.document.createTextNode(label));
  }
  function notify(requestId,rendered,sequence){if(!embedded)return;try{root.parent.postMessage({type:'verdict-unified-profile-changed',profile:profile,requestId:String(requestId||''),sequence:Number(sequence)||0,rendered:rendered!==false},(root.location.protocol==='file:'||root.location.origin==='null')?'*':root.location.origin);}catch(e){}}
  function afterStablePaint(callback){
    /* Le rendu de go() est synchrone et les animations de grand module sont
       neutralisées par data-v45-profile-transition. Une microtâche acquitte
       donc le DOM publié sans attendre deux images susceptibles d'être
       suspendues par Safari lors d'un changement d'iframe. */
    Promise.resolve().then(callback);
  }
  function finishProfileTransition(requestId,rendered,sequence){
    afterStablePaint(function(){
      root.document.documentElement.removeAttribute('data-v45-profile-transition');
      notify(requestId,rendered,sequence);
    });
  }
  function ready(){try{var result=root.moteur();return !!(result&&result.ready);}catch(e){return false;}}
  function landing(){return ready()?'pil':'in';}
  function applyChrome(){
    var text=ui(),html=root.document.documentElement;html.setAttribute('data-v45-profile',profile);/* V10 (21/10) */if(embedded&&!html.hasAttribute('data-v45-coque'))html.setAttribute('data-v45-coque','');
    var nav=root.document.querySelector('nav[aria-label="Navigation principale"]')||root.document.querySelector('nav');
    if(nav)nav.setAttribute('aria-label',profile==='carte'?text.menuTitle:text.structureTitle);
    labelButton(root.document.querySelector('nav button[data-v="pil"]'),text.home);
    labelButton(root.document.querySelector('nav button[data-v="data"]'),text.structure);
    labelButton(root.document.querySelector('nav button[data-v="audit"]'),text.audit||'Audit');
    labelButton(root.document.querySelector('nav button[data-v="carte"]'),text.menu);
    labelButton(root.document.querySelector('nav button[data-v="plus"]'),text.more);
    var structureTitle=root.document.querySelector('#v-data h1'),structureSub=root.document.querySelector('#v-data .sub');
    if(structureTitle)structureTitle.textContent=text.structureTitle;if(structureSub)structureSub.textContent=text.structureSub;
    var menuTitle=root.document.querySelector('#v-carte h1'),menuSub=root.document.querySelector('#v-carte .sub');
    if(menuTitle)menuTitle.textContent=text.menuTitle;if(menuSub)menuSub.textContent=text.menuSub;if(root.headerState&&root.VerdictCartePages){root.headerState(root.moteur());root.VerdictCartePages.refreshDock();}
  }
  function invalidateProfileViews(){
    /* Seul Plus dépend réellement du profil actif. Pilotage, Structure et
       Carte conservent leur DOM rendu : revenir à un module déjà ouvert ne
       relance plus ses calculs ni ses animations. */
    var view=root.document.getElementById('v-plus');
    if(view)view.removeAttribute('data-verdict-render-revision');
  }
  function setProfile(next,navigate,requestId){
    var previous=profile,requested=cleanProfile(next),success=true,target='',sequence=++profileNotificationSequence;
    profile=requested;if(profile!==previous)invalidateProfileViews();applyChrome();target=profile==='carte'?'carte':landing();
    var visible=root.document.querySelector('.view.on:not(.preparing)'),alreadyVisible=!!(visible&&visible.id==='v-'+target&&root.VIEW===target);
    if(navigate&&originalGo&&!alreadyVisible){
      root.document.documentElement.setAttribute('data-v45-profile-transition',profile);
      success=originalGo(target);
    }
    if(success===false){profile=previous;applyChrome();saveProfile();finishProfileTransition(requestId,false,sequence);return profile;}
    saveProfile();finishProfileTransition(requestId,true,sequence);
    return profile;
  }
  function queueProfileMessage(data){
    pendingProfileMessage={profile:data.profile,navigate:data.navigate!==false,requestId:data.requestId||''};
    /* Une rafale de touchers produit plusieurs tâches postMessage. Les rendre
       toutes l'une après l'autre bloquait le fil principal pendant plus de
       vingt secondes. Une seule tâche événementielle traite la dernière
       intention reçue ; les messages intermédiaires ne sont jamais peints. */
    if(profileMessageQueued)return;
    profileMessageQueued=true;
    var flush=function(){
      profileMessageQueued=false;
      var job=pendingProfileMessage;pendingProfileMessage=null;
      if(job)setProfile(job.profile,job.navigate,job.requestId);
    };
    if(typeof root.MessageChannel==='function'){
      if(!profileMessageChannel){profileMessageChannel=new root.MessageChannel();profileMessageChannel.port1.onmessage=flush;}
      profileMessageChannel.port2.postMessage(0);
    }else Promise.resolve().then(flush);
  }
  function requestInventory(route,options){
    var bridge=root.VerdictUnified;
    var payload=Object.assign({route:route||'inventory-analysis'},options&&typeof options==='object'?options:{});
    if(bridge&&typeof bridge.requestSwitch==='function')return bridge.requestSwitch('inventory',payload);
    /* C302 (V15-058) : Pilotage ouvert seul (hors de la coque) : on ouvre la coque sur l'Inventaire, démonstration comprise, au lieu d'arrêter le parcours. */
    try{if(root.top===root){var demo=false;try{demo=!!root.eval('typeof VERDICT_DEMO_SESSION!=="undefined"&&VERDICT_DEMO_SESSION');}catch(e){}root.location.href=new URL('../../index.html?module=inventory'+(demo?'&demo=1':''),root.location.href).href;return true;}}catch(e){}
    try{root.toast('Ouvrez Inventaire depuis la barre des modules.');}catch(e){}
    return false;
  }
  function profileGo(view){
    view=String(view||'');
    if(view==='achats')return requestInventory('purchases');
    if(view==='stock')return requestInventory('stockout');
    if(view==='x')return requestInventory('inventory-analysis');
    if(view==='carte'&&profile!=='carte')setProfile('carte',false);
    else if(/^(pil|data|priorities|reco|alertes|dec|org|ca|sal|obj|sante|planning|in|audit)$/.test(view)&&profile!=='pilotage')setProfile('pilotage',false);
    return originalGo?originalGo.apply(this,arguments):false;
  }
  if(originalGo){profileGo.__verdictUnifiedWrapped=true;profileGo.__verdictUnifiedOriginal=originalGo;root.go=profileGo;}

  root.mainNavView=function(view){
    if(view==='carte')return 'carte';
    if(view==='pil'||view==='ca'||view==='planning')return 'pil';
    if(/^(data|sal|obj|sante|priorities|reco|alertes|dec|org)$/.test(view))return 'data';
    if(view==='audit')return 'audit'; /* C44 : Audit a son bouton */
    if(/^(plus|in|hist|aide|abo)$/.test(view))return 'plus';
    return originalMainNavView?originalMainNavView(view):'plus';
  };

  function plusItem(id){
    try{var item=root.plusNeedItem(id);if(item)return {icon:item[1],title:item[2],text:item[3]};}catch(e){}
    return null;
  }
  function fluxItem(){try{if(root.VerdictFluxV451)return root.VerdictFluxV451.entry();}catch(e){}return {icon:'⇄',title:locale()==='en'?'Till and daily statements':'Caisse et relevés quotidiens',text:locale()==='en'?'Connection status and quick daily entry':'État de connexion et saisie rapide',className:'v451-flux-card'};}
  function fluxCard(item){return '<button type="button" class="v45-admin-card btn-secondary '+escapeHTML(item.className||'')+'" data-v45-admin="cash-register"><span class="v45-admin-icon" aria-hidden="true">'+item.icon+'</span><span class="v45-admin-copy"><b>'+escapeHTML(item.title)+'</b><small>'+escapeHTML(item.text)+'</small></span></button>';}
  function injectFluxCard(host){if(!host||host.querySelector('[data-v45-admin="cash-register"]'))return;var grid=host.querySelector('.v45-plus-grid')||host,wrap=root.document.createElement('div');wrap.innerHTML=fluxCard(fluxItem());var card=wrap.firstElementChild;if(card)grid.insertBefore(card,grid.firstChild);}
  function renderPlus(){
    var host=root.document.getElementById('menuGrid');if(!host)return;
    var text=ui(),title=root.document.getElementById('plusTitle'),sub=root.document.getElementById('plusSubtitle');
    var unified=profile==='carte'&&root.VerdictCartePages;
    var plusView=root.document.getElementById('v-plus');if(plusView)plusView.classList.toggle('cp-unified-more',!!unified);
    if(unified){
      if(title)title.textContent=root.VerdictCartePages.text('tools');if(sub)sub.textContent='';
      host.className='menugrid';host.innerHTML=root.VerdictCartePages.toolsHTML()+'<div class="cp-more-common"><div class="cp-toolgrid">'+['etabs','language','vera','account'].map(function(id){var item=plusItem(id);return item?'<button type="button" class="cp-button" data-v45-admin="'+id+'">'+escapeHTML(item.title)+'</button>':'';}).join('')+'</div></div>';return;
    }
    host.className='menugrid v45-plus-pilotage';
    if(originalDrawMenu){originalDrawMenu();injectFluxCard(host);return;}
    if(title)title.textContent=text.more+' · '+homeCopy().k;if(sub)sub.textContent=text.structureSub;
    var source={fec:plusItem('import'),etabs:plusItem('etabs'),account:plusItem('account'),language:plusItem('language'),audit:plusItem('export'),vera:plusItem('vera')};
    source.fec=source.fec||{icon:'⇩',title:text.fecTitle,text:text.structureSub};source.fec.title=text.fecTitle;
    source.etabs=source.etabs||{icon:'🏢',title:'Établissements',text:'Ajouter, renommer ou changer'};
    source.account=source.account||{icon:'⚙',title:'Compte et abonnement',text:'Accès, essai et facturation'};
    source.language=source.language||{icon:'🌐',title:'Langue',text:'Changer la langue de l’application'};
    source.audit=source.audit||{icon:'↗',title:'Audit et exports',text:'Audit, comptable, banque, synthèse'};source.audit.title=(source.audit.title||'Audit')+' · exports';
    source.vera=source.vera||{icon:'V',title:'Vera',text:'Ouvrir le copilote et l’aide'};
    source.opening={icon:'◷',title:text.openingTitle,text:text.openingText};
    var alerts=null;try{var a=root.PLUS_ALERT_SETTINGS&&root.PLUS_ALERT_SETTINGS[locale()];if(a)alerts={icon:'🔔',title:a.t,text:a.d};}catch(e){}
    source.alerts=alerts||{icon:'🔔',title:'Alertes',text:'Choisir les alertes utiles'};
    source.advanced={icon:'⌘',title:text.advancedTitle,text:text.advancedText};source['cash-register']=fluxItem();
    var order=['cash-register','audit','fec','etabs','opening','alerts','vera','account','language','advanced'];
    host.innerHTML='<div class="v45-plus-grid">'+order.map(function(id){var item=source[id];return '<button type="button" class="v45-admin-card btn-secondary" data-v45-admin="'+id+'"><span class="v45-admin-icon" aria-hidden="true">'+item.icon+'</span><span class="v45-admin-copy"><b>'+escapeHTML(item.title)+'</b><small>'+escapeHTML(item.text)+'</small></span></button>';}).join('')+'</div>';
  }
  function escapeHTML(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function homeCopy(){return HOME[locale()]||HOME.fr;}
  function limitWords(value){var words=String(value||'').trim().split(/\s+/).filter(Boolean);return words.length>CONCLUSION_WORD_LIMIT?words.slice(0,CONCLUSION_WORD_LIMIT).join(' ')+'…':words.join(' ');}
  function finiteNumber(value){var n=Number(value);return value!==null&&value!==''&&Number.isFinite(n)?n:null;}
  function homeKpi(label,value,color){if(value===null||value===undefined||value==='')return '';return '<span class="v45-home-kpi"><small>'+escapeHTML(label)+'</small><b'+(color?' style="color:'+color+'"':'')+'>'+escapeHTML(value)+'</b></span>';}
  function dailyHomeHTML(R,primary,hasForm,opened){
    var copy=homeCopy();
    if(!opened)return '<section class="card v45-decision-block" data-v45-decision-block="today"><span class="v45-home-kicker">'+escapeHTML(copy.preopen)+'</span><h2>'+escapeHTML(copy.preopenTitle)+'</h2><p class="v45-home-summary" data-v45-conclusion>'+escapeHTML(limitWords(copy.preopenText))+'</p><button type="button" class="btn btn-primary" data-v45-open-project>'+escapeHTML(copy.open)+'</button></section>';
    var op=null,days={},day=0,row=null,closed=false,target=null;
    try{op=root.verdictOperationalClock();day=Number(op&&op.day)||new Date().getDate();days=root.joursMois()||{};row=days[day]||null;closed=!!root.estFerme(day);target=finiteNumber(root.verdictPerformanceDayTarget(day));}catch(e){day=new Date().getDate();}
    var actual=row&&row.ca!==null&&row.ca!==undefined&&!row.est?finiteNumber(row.ca):null;
    var service=root.VerdictServiceDay,words=service.copy(locale()),next=null,api=root.VerdictPerformanceIntegrated;
    if(op&&api)next=service.upcoming(op,actual!==null,api.isClosed,root.verdictPerformanceDayTarget);
    var date=next&&next.date,title=date?service.label(date,locale()):words.noNext;
    var kpis=next?homeKpi(words.target,next.target===null?'—':money(next.target),'#93c5fd')+homeKpi(words.actual,'—'):'';
    var summary=next?(next.target===null?words.unknown+'. ':'')+words.pending:words.noNext;
    var previousDate=op&&op.key,previousAmount=actual;
    if(op&&op.key===date&&actual===null){
      var history=(root.DB&&root.DB.histJour||[]).filter(function(r){return service.observed(r,op)&&r.date<date&&finiteNumber(r.caJ)!==null;}).slice().sort(function(a,b){return a.date.localeCompare(b.date);});
      var last=history[history.length-1];if(last){previousDate=last.date;previousAmount=finiteNumber(last.caJ);}
    }
    var previous=op&&((previousDate!==date)||previousAmount!==null)?'<div class="v45-service-previous"><b>'+escapeHTML(words.service+' · '+service.label(previousDate,locale()))+'</b><span>'+escapeHTML(previousAmount!==null?words.actual+' : '+money(previousAmount):closed?words.closed:copy.dayPending)+'</span></div>':'';
    var boundary=op&&op.key!==op.civilKey?'<p class="v45-service-boundary">'+escapeHTML(words.cutoff)+'</p>':'';
    var button=hasForm&&!closed?'<button type="button" class="btn '+(primary?'btn-primary':'btn-secondary')+'" data-v45-daily data-service-day="'+day+'">'+escapeHTML((actual!==null?words.edit:words.enter)+' · '+service.label(op.key,locale()))+'</button>':'';
    return '<section class="card v45-decision-block v45-service-plan" data-v45-decision-block="today" data-service-date="'+escapeHTML(date||'')+'" data-service-state="pending"><span class="v45-home-kicker">'+escapeHTML(next&&next.future?words.next:words.prepare)+'</span><h2>'+escapeHTML(title)+'</h2>'+(kpis?'<div class="v45-home-kpis">'+kpis+'</div>':'')+'<p class="v45-home-summary" data-v45-conclusion>'+escapeHTML(limitWords(summary))+'</p>'+previous+boundary+button+'</section>';
  }
  function monthHomeHTML(R){
    var copy=homeCopy(),S=null;try{S=root.piloteMoisEtat(R);}catch(e){}
    if(!S)return '<section class="card v45-decision-block" data-v45-decision-block="month"><span class="v45-home-kicker">'+escapeHTML(copy.month)+'</span><h2>'+escapeHTML(copy.monthTitle)+'</h2><p class="v45-home-summary" data-v45-conclusion>'+escapeHTML(limitWords(copy.wait))+'</p></section>';
    var entered=Number(S.donnees&&S.donnees.saisis)||0,cumulative=entered>0?finiteNumber(S.donnees.cumul):null,projection=S.projection&&S.projection.disponible?finiteNumber(S.projection.ca):null,minimum=finiteNumber(S.economique&&S.economique.seuilMois),summary=copy.wait,color='';
    if(projection!==null){try{var visual=root.projectionEtatVisuel(S);summary=visual&&visual.summary||copy.monthTitle;color=visual&&visual.color||'';}catch(e){summary=copy.monthTitle;}}
    var kpis=homeKpi(copy.cumulative,cumulative!==null?money(cumulative):null)+homeKpi(copy.projection,projection!==null?money(projection):null,color)+homeKpi(copy.threshold,minimum!==null?money(minimum):null);
    return '<section class="card v45-decision-block" data-v45-decision-block="month"><span class="v45-home-kicker">'+escapeHTML(copy.month)+'</span><h2>'+escapeHTML(copy.monthTitle)+'</h2>'+(kpis?'<div class="v45-home-kpis">'+kpis+'</div>':'')+'<p class="v45-home-summary" data-v45-conclusion>'+escapeHTML(limitWords(summary))+'</p></section>';
  }
  function homePriority(){
    var snapshot=null,next=null;
    try{snapshot=root.DB&&root.DB.inventoryOperations;next=snapshot&&snapshot.summary&&snapshot.summary.nextAction;}catch(e){}
    if(next)return {kind:'inventory',title:next.title||homeCopy().stock,summary:next.detail||'',route:next.kind==='order'?'orders':'stockout'};
    try{var decision=root.DecisionEngine.PrioritiesEngine.decision(root.DB),p=decision&&decision.top;if(p)return {kind:'business',title:p.diagnosis||p.title||homeCopy().priority,summary:p.action||p.detail||'',id:p.routeId||p.id||''};}catch(e){}
    return null;
  }
  function priorityHomeHTML(priority,primary){
    var copy=homeCopy();if(!priority)return '<section class="card v45-decision-block" data-v45-decision-block="priority"><span class="v45-home-kicker">'+escapeHTML(copy.priority)+'</span><h2>'+escapeHTML(copy.none)+'</h2><p class="v45-home-summary" data-v45-conclusion>'+escapeHTML(limitWords(copy.noneText))+'</p></section>';
    var inventory=priority.kind==='inventory',kicker=inventory?copy.stock:copy.priority,label=inventory?copy.openInventory:copy.understand,attrs=inventory?' data-v45-inventory="'+escapeHTML(priority.route)+'"':' data-v45-understand="'+escapeHTML(priority.id)+'"';
    return '<section class="card v45-decision-block" data-v45-decision-block="priority"><span class="v45-home-kicker">'+escapeHTML(kicker)+'</span><h2>'+escapeHTML(priority.title)+'</h2><p class="v45-home-summary" data-v45-conclusion>'+escapeHTML(limitWords(priority.summary||copy.noneText))+'</p><button type="button" class="btn '+(primary?'btn-primary':'btn-secondary')+'"'+attrs+'>'+escapeHTML(label)+'</button></section>';
  }
  function classifyOperationalControls(scope){
    if(!scope||!scope.querySelectorAll)return;
    Array.prototype.forEach.call(scope.querySelectorAll('input,select,textarea'),function(node){node.classList.add('input-control');});
    Array.prototype.forEach.call(scope.querySelectorAll('button.btn.sec,button.btn.ghost,button.btn2'),function(node){node.classList.add('btn-secondary');});
    var submit=scope.querySelector('#pil-saisie button.btn:not(.sec):not(.ghost)');if(submit)submit.classList.add('input-control');
  }

  var HOME_FLOW_R36_COPY={
  "fr": [
    "Aujourd’hui",
    "Mon mois",
    "Mes actions",
    "Préparer la prochaine journée",
    "Repères et détails du mois",
    "Données et outils complémentaires",
    "L’objectif du jour suit votre calendrier. Le minimum restant est une moyenne pour couvrir les charges du mois.",
    "La fiabilité décrit les données disponibles. Une projection reste une estimation, même avec des données complètes.",
    "Choisissez un jour pour consulter ou corriger ses chiffres. La saisie se trouve en haut de cet écran.",
    "Saisir la journée sélectionnée",
    "À propos de cette démonstration"
  ],
  "en": [
    "Today",
    "My month",
    "My actions",
    "Prepare the next day",
    "Monthly benchmarks and details",
    "Additional data and tools",
    "The daily target follows your calendar. The remaining minimum is an average needed to cover monthly costs.",
    "Reliability describes the available data. A projection remains an estimate, even with complete data.",
    "Choose a day to review or correct its figures. The entry form is at the top of this screen.",
    "Enter the selected day",
    "About this demonstration"
  ],
  "es": [
    "Hoy",
    "Mi mes",
    "Mis acciones",
    "Preparar la próxima jornada",
    "Referencias y detalles del mes",
    "Datos y herramientas adicionales",
    "El objetivo diario sigue su calendario. El mínimo restante es una media para cubrir los gastos del mes.",
    "La fiabilidad describe los datos disponibles. Una proyección sigue siendo una estimación, incluso con datos completos.",
    "Elija un día para consultar o corregir sus cifras. El formulario está al principio de esta pantalla.",
    "Registrar el día seleccionado",
    "Acerca de esta demostración"
  ],
  "it": [
    "Oggi",
    "Il mio mese",
    "Le mie azioni",
    "Preparare la prossima giornata",
    "Riferimenti e dettagli del mese",
    "Dati e strumenti aggiuntivi",
    "L’obiettivo giornaliero segue il calendario. Il minimo restante è una media per coprire i costi del mese.",
    "L’affidabilità descrive i dati disponibili. Una proiezione resta una stima, anche con dati completi.",
    "Scegli un giorno per consultarne o correggerne i dati. Il modulo si trova all’inizio di questa schermata.",
    "Inserisci il giorno selezionato",
    "Informazioni sulla dimostrazione"
  ],
  "de": [
    "Heute",
    "Mein Monat",
    "Meine Maßnahmen",
    "Den nächsten Tag vorbereiten",
    "Monatliche Richtwerte und Details",
    "Weitere Daten und Werkzeuge",
    "Das Tagesziel folgt Ihrem Kalender. Das verbleibende Minimum ist ein Durchschnitt zur Deckung der monatlichen Kosten.",
    "Die Zuverlässigkeit beschreibt die verfügbaren Daten. Eine Prognose bleibt auch bei vollständigen Daten eine Schätzung.",
    "Wählen Sie einen Tag, um Zahlen einzusehen oder zu korrigieren. Das Eingabeformular steht oben auf dieser Seite.",
    "Ausgewählten Tag erfassen",
    "Über diese Demonstration"
  ],
  "nl": [
    "Vandaag",
    "Mijn maand",
    "Mijn acties",
    "De volgende dag voorbereiden",
    "Maandelijkse referenties en details",
    "Aanvullende gegevens en tools",
    "Het dagdoel volgt uw kalender. Het resterende minimum is een gemiddelde om de maandkosten te dekken.",
    "Betrouwbaarheid beschrijft de beschikbare gegevens. Een prognose blijft een schatting, ook met volledige gegevens.",
    "Kies een dag om cijfers te bekijken of te corrigeren. Het invoerformulier staat bovenaan dit scherm.",
    "Geselecteerde dag invoeren",
    "Over deze demonstratie"
  ],
  "pt": [
    "Hoje",
    "O meu mês",
    "As minhas ações",
    "Preparar o próximo dia",
    "Referências e detalhes do mês",
    "Dados e ferramentas adicionais",
    "O objetivo diário segue o calendário. O mínimo restante é uma média para cobrir os custos do mês.",
    "A fiabilidade descreve os dados disponíveis. Uma projeção continua a ser uma estimativa, mesmo com dados completos.",
    "Escolha um dia para consultar ou corrigir os números. O formulário encontra-se no início deste ecrã.",
    "Registar o dia selecionado",
    "Sobre esta demonstração"
  ]
};

  /* ═══ R251 — MON ANNÉE : projection annuelle saisonnière ═══════════════════
     Même règles que le jour et le mois : minimum de structure, couleurs
     vert ≥ 100 %, jaune ≥ 95 %, orange ≥ 90 %, rouge < 90 %, « absent ≠ zéro ».
     Définition : rythme = réalisé ÷ attendu à ce jour (plan de saison).
     Projection = réalisé + rythme × (minimum annuel − attendu à ce jour).
     Fourchette = rythme ± écart-type des mois complets (plancher 3 points).
     Aucune ligne droite : chaque mois restant reprend le rythme sur SON minimum. */
  var VY_VERSION='R251';
  function vyNum(x){return typeof x==='number'&&isFinite(x);}
  function vyRound2(x){return Math.round(x*100)/100;}
  /* Saisonnalité tirée de l'historique, mêmes formules que createSeasonPlan (mélange 60 % avec 1 an, 80 % avec 2 ans ou plus).
     Pur : rend null si aucune année d'historique n'est complète. La somme des minimums mensuels reste égale à celle du plan. */
  function vySeasonTargets(inp){
    var T=inp.planTargets||[],cap=inp.capacity||[],years=inp.priorYears||[],i,sum=0,active=[];
    for(i=0;i<12;i++){var t=Number(T[i]);if(!vyNum(t)||t<0)t=0;if(t>0)active.push(i);sum+=t;}
    if(!(sum>0)||active.length<2)return null;
    var okYears=[],okIdx=[];
    years.forEach(function(y,yi){
      var good=true;
      active.forEach(function(k){var v=y&&y[k];if(!vyNum(v)||!(v>0))good=false;});
      if(good){okYears.push(y);okIdx.push(yi);}
    });
    if(!okYears.length)return null;
    var profile=[];for(i=0;i<12;i++)profile.push(0);
    active.forEach(function(k){var s=0;okYears.forEach(function(y){s+=y[k];});profile[k]=s/okYears.length;});
    var capTotal=0,maxCap=0,measTotal=0;
    active.forEach(function(k){var c=Number(cap[k]);if(!vyNum(c)||c<0)c=0;capTotal+=c;if(c>maxCap)maxCap=c;});
    if(!(capTotal>0)||!(maxCap>0))return null;
    active.forEach(function(k){measTotal+=profile[k]*(Number(cap[k])/maxCap);});
    if(!(measTotal>0))return null;
    var blend=okYears.length>=2?.8:.6,w=[],wSum=0;
    for(i=0;i<12;i++)w.push(0);
    active.forEach(function(k){
      var c=Number(cap[k]),neutral=c/capTotal,meas=profile[k]*(c/maxCap)/measTotal,x=neutral*(1-blend)+meas*blend;
      w[k]=Math.max(.0001,x);wSum+=w[k];
    });
    var out=[];for(i=0;i<12;i++)out.push(0);
    var allocation=root.VerdictFinance.allocate(root.VerdictFinance.sum(T).number(2),active.map(function(k){return w[k];}));active.forEach(function(k,index){out[k]=allocation[index];});
    return {targets:out,years:okYears.length,blend:blend,okIdx:okIdx};
  }
  /* Lecture de référence : quand l'historique de l'année est trop court pour projeter,
     on lit l'exercice de référence (CA annuel de la structure) face au minimum annuel complet.
     Pur. Chaque mois = CA de référence réparti comme le minimum (calendrier et saison) :
     la somme des mois égale exactement le CA de référence. Aucune projection n'est inventée. */
  function vyCoreRef(inp){
    var out={available:false,mode:'reference',version:VY_VERSION},T=[],sumT=0,i;
    for(i=0;i<12;i++){var t=Number(inp.targets&&inp.targets[i]);if(!vyNum(t)||t<0)t=0;T.push(t);}sumT=vyExactSum(T);
    var ca=(inp.referenceTTC==null||inp.referenceTTC==='')?NaN:Number(inp.referenceTTC);
    if(!(sumT>0)){out.reason='no_minimum';return out;}
    if(!vyNum(ca)||ca<0){out.reason='no_reference';return out;}
    var RM=inp.referenceMonths,rmSum=0,useRM=false;if(RM&&RM.length===12){RM.forEach(function(v){rmSum+=Number(v)||0;});useRM=rmSum>0&&Math.abs(rmSum-ca)<=0.01*ca;}
    var rmVals=useRM?RM.map(function(v){return Math.round((Number(v)||0)*100)/100;}):null;if(useRM)ca=vyExactSum(rmVals);
    var ratio=root.VerdictFinance.fraction(ca).div(sumT).number(),cum=0,cross=-1,vals=useRM?rmVals:root.VerdictFinance.allocate(ca,T);
    for(i=0;i<12;i++){cum=root.VerdictFinance.fraction(cum).add(vals[i]).number(2);if(cross<0&&T[i]>0&&cum>=sumT)cross=i;}
    var s=0;for(i=0;i<12;i++)s+=vals[i];
    if(Math.abs(s-ca)>0.01*Math.max(1,ca)/100){out.reason='inconsistent';return out;}
    var mc=Number(inp.mcPct),tva=Number(inp.tva)||0,cf=Number(inp.cf);
    out.available=true;out.minimum=sumT;out.reference=ca;out.ratio=ratio;out.crossIndex=cross;out.fromDocument=!!(typeof useRM!=='undefined'&&useRM);out.documentYear=inp.referenceDocYear||null;
    out.months=vals.map(function(v,idx){return {i:idx,kind:T[idx]>0?'ref':'off',target:T[idx],value:v};});
    out.result=(vyNum(mc)&&mc>0&&vyNum(cf))?vyExactResult(ca,tva,mc,cf):null;
    out.trackActual=vyNum(inp.actualToDate)?Number(inp.actualToDate):null;
    out.trackExpected=vyNum(inp.expectedToDate)?Number(inp.expectedToDate):null;
    out.trackPace=(out.trackExpected>0&&out.trackActual!=null)?out.trackActual/out.trackExpected:null;
    out.trackStart=inp.trackingStart||null;out.completeMonths=Number(inp.completeMonths)||0;out.exerciseYear=inp.exerciseYear||null;
    return out;
  }
  /* Méthode « même mois de l'an dernier » (N-1), prioritaire dès que l'année précédente existe.
     Évolution à date g = Σ réalisé des mois complets ÷ Σ des mêmes mois N-1 (mois comparables uniquement).
     Mois futur avec N-1 : g × N-1 du mois. Mois en cours : projection de « Mon mois » si disponible,
     sinon réalisé + g × (N-1 du mois − N-1 à la même date). Mois sans N-1 : rythme × minimum (méthode R251).
     Fourchette : g ± écart-type des rapports mensuels N/N-1 (plancher 3 points). La projection est
     la SOMME des mois : l'identité Σ mois = projection est exacte par construction. */
  function vyCoreN1(inp){
    var base=vyCore(inp);if(!base.available)return base;
    var A=inp.actuals||[],LY=inp.lastYear||[],ci=base.currentIndex,i,num=0,den=0,rs=[];
    var CR=inp.calRatio||[],crOf=function(k){var c=Number(CR[k]);return vyNum(c)&&c>0?c:1;};
    for(i=0;i<ci;i++){var a=A[i],l=Number(LY[i]);if(vyNum(a)&&vyNum(l)&&l>0&&a>0){var cr=crOf(i);num+=a;den+=l*cr;rs.push(a/(l*cr));}}
    if(rs.length<2||!(den>0))return base;
    var g=num/den,mean=0,sd=0;for(i=0;i<rs.length;i++)mean+=rs[i];mean/=rs.length;
    for(i=0;i<rs.length;i++)sd+=Math.pow(rs[i]-mean,2);sd=Math.sqrt(sd/(rs.length-1));if(!vyNum(sd)||sd<0.03)sd=0.03;
    var rel=sd/g,T=base.months.map(function(m){return m.target;}),pace=base.pace,months=[],P=0,PL=0,PH=0,anyN1=false;
    var expCur=Math.max(0,Math.min(T[ci],Number(inp.expectedToDate)-T.slice(0,ci).reduce(function(x,y){return x+y;},0)));
    for(i=0;i<12;i++){
      var m=base.months[i],v,lo,hi,meth=m.kind==='past'?'actual':m.kind,l2=Number(LY[i]);
      if(m.kind==='off'){v=0;lo=0;hi=0;meth='off';}
      else if(m.kind==='past'){v=m.value;lo=v;hi=v;}
      else if(m.kind==='current'){
        var ac=base.actualCurrent,mc=inp.monthEngineCurrent==null?NaN:Number(inp.monthEngineCurrent),ltd=inp.lastYearToDate==null?NaN:Number(inp.lastYearToDate);
        if(vyNum(mc)&&mc>=ac-0.005){v=Math.max(ac,mc);meth='month';}
        else if(vyNum(l2)&&l2>0&&vyNum(ltd)&&ltd>=0&&ltd<=l2){v=ac+g*(l2-ltd);meth='n1';anyN1=true;}
        else{v=ac+pace*Math.max(0,T[i]-expCur);meth='minimum';}
        var rem=Math.max(0,v-ac);lo=ac+rem*Math.max(0,1-rel);hi=ac+rem*(1+rel);
      }else{
        if(vyNum(l2)&&l2>0){var c2=crOf(i);v=g*l2*c2;lo=Math.max(0,g-sd)*l2*c2;hi=(g+sd)*l2*c2;meth='n1';anyN1=true;}
        else if(T[i]>0){v=pace*T[i];lo=Math.max(0,pace-base.sigma)*T[i];hi=(pace+base.sigma)*T[i];meth='minimum';}
        else{v=0;lo=0;hi=0;meth='off';}
      }
      months.push({i:i,kind:(meth==='off'&&m.kind!=='off'&&!(T[i]>0))?'off':m.kind,target:T[i],value:v,low:lo,high:hi,actual:m.actual,method:meth,lastYear:(vyNum(l2)&&l2>0)?l2:null,cal:crOf(i)});
      P+=v;PL+=lo;PH+=hi;
    }
    if(!anyN1&&months.every(function(x){return x.method!=='month';}))return base;
    var out={};for(var k in base)out[k]=base[k];
    var sumT=base.minimum;
    out.method='n1';out.growth=g;out.sigmaN1=sd;out.comparableMonths=rs.length;out.months=months;
    out.projection=P;out.projectionLow=PL;out.projectionHigh=PH;out.ratio=P/sumT;out.ratioLow=PL/sumT;out.ratioHigh=PH/sumT;
    var cum=0,cross=-1,crossPast=false;for(i=0;i<12;i++){cum+=months[i].value;if(cross<0&&cum>=sumT-1e-9){cross=i;crossPast=i<ci||(i===ci&&base.actual>=sumT-1e-9);}}
    out.crossIndex=cross;out.crossPast=crossPast;
    var mcp=Number(inp.mcPct),tva=Number(inp.tva)||0,cf=Number(inp.cf),full=Number(inp.fullYearMinimum);
    var cfScope=vyNum(cf)?vyExactScope(cf,sumT,full):null;
    var res=function(c){return (vyNum(mcp)&&mcp>0&&cfScope!=null)?vyExactResult(c,tva,mcp,cfScope):null;};
    out.result=res(P);out.resultLow=res(PL);out.resultHigh=res(PH);
    out.confidence='not_calibrated';
    var annotated=root.VerdictForecastProof.annotate(out,inp.backtestRows||[],String(inp.year)+'-'+String(inp.currentIndex+1).padStart(2,'0'));
    try{var bt=vyBacktest(inp);annotated.backtest=bt;if(bt&&bt.validated&&annotated===out){var rest=Math.max(0,P-base.actual);out.projectionLow=P-bt.q90*rest;out.projectionHigh=P-bt.q10*rest;var hw=vyNum(bt.meanErr)?Math.abs(bt.meanErr)*P:0;if(hw>0){out.projectionLow=Math.min(out.projectionLow,P-hw);out.projectionHigh=Math.max(out.projectionHigh,P+hw);} /* C264 (N12) : jamais plus étroite que l'erreur moyenne mesurée */out.ratioLow=out.projectionLow/sumT;out.ratioHigh=out.projectionHigh/sumT;out.resultLow=res(out.projectionLow);out.resultHigh=res(out.projectionHigh);out.confidence='backtested';}}catch(e){}
    return annotated;
  }
  /* Récapitulatif d'un mois (pur). Charges fixes réparties comme les minimums :
     part du mois = cf × minimum du mois ÷ minimum de l'année complète ; ainsi un mois
     exactement au minimum a un résultat nul quand le minimum est le point mort. */
  function vyMonthRecap(m){
    var o={},T=Number(m.target),V=Number(m.value);
    o.target=vyNum(T)&&T>0?T:0;o.value=vyNum(V)&&V>=0?V:0;
    o.ratio=o.target>0?o.value/o.target:null;o.gap=o.target>0?o.value-o.target:null;
    var mc=Number(m.mcPct),tva=Number(m.tva)||0,cf=Number(m.cf),full=Number(m.fullMin);
    o.result=(vyNum(mc)&&mc>0&&vyNum(cf)&&full>0&&o.target>0)?vyExactResult(o.value,tva,mc,root.VerdictFinance.fraction(Number(cf)).mul(o.target).div(full)):null;
    var tk=m.tickets;o.tickets=(vyNum(tk)&&tk>0)?tk:null;
    o.basket=(o.tickets&&m.kind!=='future'&&m.kind!=='ref')?(Number(m.actual)||0)/o.tickets:null;
    o.left=(m.kind==='current'&&o.target>0)?Math.max(0,o.target-(Number(m.actual)||0)):null;
    o.cumValue=Number(m.cumValue);o.cumTarget=Number(m.cumTarget);o.cumRatio=(o.cumTarget>0&&vyNum(o.cumValue))?o.cumValue/o.cumTarget:null;
    return o;
  }
  /* Cœur pur, sans DOM : testable isolément. */
  function vyCore(inp){
    var out={available:false,reason:null,version:VY_VERSION};
    var T=[],sumT=0,i;
    for(i=0;i<12;i++){var t=Number(inp.targets&&inp.targets[i]);if(!vyNum(t)||t<0)t=0;T.push(t);}sumT=vyExactSum(T);
    out.minimum=sumT;
    if(!(sumT>0)){out.reason='no_minimum';return out;}
    if(inp.calendarChanged){out.reason='calendar';return out;}
    if(Number(inp.missing)>0){out.reason='missing';out.missing=Number(inp.missing);return out;}
    var ci=Number(inp.currentIndex);
    if(!(ci>=0&&ci<=11)){out.reason='not_current';return out;}
    var A=inp.actuals||[],pastSum=0,pastExpected=0,ratios=[];
    for(i=0;i<ci;i++){
      pastExpected+=T[i];
      var a=A[i];
      if(vyNum(a)){pastSum+=a;if(T[i]>0)ratios.push(a/T[i]);}
      else if(T[i]>0){out.reason='missing';out.missing=1;return out;}
    }
    var n=ratios.length;out.completeMonths=n;
    var actual=Number(inp.actualToDate),expected=Number(inp.expectedToDate);
    if(!vyNum(actual)||actual<0||!vyNum(expected)){out.reason='short';return out;}
    if(n<2||!(expected>0)){out.reason='short';return out;}
    var actualCurrent=actual-pastSum;
    if(actualCurrent<-0.005){out.reason='inconsistent';return out;}
    if(actualCurrent<0)actualCurrent=0;
    var expCur=expected-pastExpected;
    if(ci<12&&T[ci]>0){if(expCur<0)expCur=0;if(expCur>T[ci])expCur=T[ci];}else expCur=0;
    var pace=actual/expected,remExp=Math.max(0,sumT-expected);
    var mean=0,s=0;
    for(i=0;i<n;i++)mean+=ratios[i];mean/=n;
    for(i=0;i<n;i++)s+=Math.pow(ratios[i]-mean,2);
    s=Math.sqrt(s/(n-1));if(!vyNum(s)||s<0.03)s=0.03;
    var lowR=Math.max(0,pace-s),highR=pace+s;
    var proj=actual+pace*remExp,projLow=actual+lowR*remExp,projHigh=actual+highR*remExp;
    var P=[],kinds=[],cum=0,cross=-1,crossPast=false;
    for(i=0;i<12;i++){
      var p,k;
      if(T[i]===0&&!(i<ci&&vyNum(A[i])&&A[i]>0)&&i!==ci){p=0;k='off';}
      else if(i<ci){p=A[i];k='past';}
      else if(i===ci){p=actualCurrent+pace*Math.max(0,T[ci]-expCur);k='current';}
      else{p=pace*T[i];k='future';}
      if(!vyNum(p)||p<0)p=0;
      P.push(p);kinds.push(k);cum+=p;
      if(cross<0&&cum>=sumT-1e-9){cross=i;crossPast=(i<ci)||(i===ci&&actual>=sumT-1e-9);}
    }
    var sumP=0;for(i=0;i<12;i++)sumP+=P[i];
    /* Identité de contrôle : la somme mensuelle doit égaler la projection globale. */
    var drift=Math.abs(sumP-proj);
    if(drift>0.01*Math.max(1,sumT)/100){out.reason='inconsistent';out.drift=drift;return out;}
    var seasonal=!!inp.seasonal,balanced=vyNum(inp.annualMinimum)?Math.abs(inp.annualMinimum-sumT)<=1:true;
    var conf='low';
    if(n>=3&&(seasonal||s<=0.20)&&balanced)conf='medium';
    if(n>=6&&seasonal&&s<=0.15&&balanced)conf='high';
    var mc=Number(inp.mcPct),tva=Number(inp.tva)||0,cf=Number(inp.cf),fullMin=Number(inp.fullYearMinimum);
    var cfScope=vyNum(cf)?vyExactScope(cf,sumT,fullMin):null;
    function result(c){return (vyNum(mc)&&mc>0&&cfScope!=null)?vyExactResult(c,tva,mc,cfScope):null;}
    out.available=true;out.pace=pace;out.sigma=s;out.projection=proj;out.projectionLow=projLow;out.projectionHigh=projHigh;
    out.actual=actual;out.expected=expected;out.gap=actual-expected;out.ratio=proj/sumT;out.ratioLow=projLow/sumT;out.ratioHigh=projHigh/sumT;
    out.remaining=Math.max(0,sumT-actual);
    out.perOpenDay=(Number(inp.futureOpenDays)>0)?out.remaining/Number(inp.futureOpenDays):null;
    out.months=P.map(function(v,idx){return {i:idx,kind:kinds[idx],target:T[idx],value:v,actual:(kinds[idx]==='past'?A[idx]:(kinds[idx]==='current'?actualCurrent:null))};});
    out.currentIndex=ci;out.actualCurrent=actualCurrent;out.crossIndex=cross;out.crossPast=crossPast;
    out.confidence=conf;out.seasonal=seasonal;out.seasonYears=Number(inp.seasonYears)||0;out.balanced=balanced;
    out.result=result(proj);out.resultLow=result(projLow);out.resultHigh=result(projHigh);
    out.futureOpenDays=Number(inp.futureOpenDays)||0;
    out.objective=(vyNum(inp.objectiveRatio)&&inp.objectiveRatio>1)?sumT*inp.objectiveRatio:null;
    return root.VerdictForecastProof.annotate(out,inp.backtestRows||[],String(inp.year)+'-'+String(inp.currentIndex+1).padStart(2,'0'));
  }
  var VY_COPY={
    fr:{tDays:'Journées',tCum:'Cumul du mois',tab:'Année',tabKicker:'Votre année, mois par mois',methN1:'Méthode : chaque mois restant reprend le même mois de {y} × votre évolution à date ({g}, sur {n} mois terminés comparables, le mois en cours n’y entre pas). Mois en cours : même estimation que l’onglet Mois.',tdLY:'Même mois {y}',tdG:'Évolution appliquée',n1Txt:'Projection = {l} réalisés en {m} {y} × {g} = {v}.',tdEndM:'Fin de mois (estimation de l’onglet Mois)',monthTxt:'Même chiffre que l’onglet Mois : la fin de mois suit le rythme de vos journées.',curN1Txt:'Projection = {a} encaissés + {g} × ce qu’il restait à faire en {m} {y} ({r}) = {v}.',vsY:'par rapport à {y}',curTxt:'Ici, la fin de mois suit le rythme de l’année. L’onglet Mois de l’Accueil la calcule au rythme des jours du mois : les deux chiffres peuvent différer.',hint:'Touchez un mois pour voir son détail.',kPast:'Réalisé',kCur:'En cours',kFut:'Projeté',kOff:'Fermé',kRef:'Référence',dRatio:'{p} du minimum du mois',tdMin:'Minimum du mois',tdReal:'Réalisé',tdCur:'Encaissé à ce jour',tdProj:'Projeté',tdRef:'Part de la référence',tdGap:'Écart au minimum',tdDays:'Journées saisies',tdDaysV:'{a} sur {b} jours ouverts du mois',tdDaysF:'Jours d’ouverture prévus',tdTk:'Tickets',tdBasket:'Panier moyen',tdNA:'non renseigné',tdRes:'Résultat estimé du mois',tdCum:'Cumul à fin de mois',tdCumV:'{a} sur {b} ({p})',tdEnd:'Fin de mois au rythme de l’année',tdLeft:'Reste pour couvrir le minimum',tdClosed:'Mois clôturé',tdOpen:'Mois non clôturé',offTxt:'Mois fermé selon votre calendrier : aucun minimum, aucun chiffre attendu.',refTxt:'Lecture de référence : la part de l’exercice de référence qui revient à ce mois, pas un réalisé.',projTxt:'Projection : ce mois reprend le rythme de l’année sur son propre minimum.',resNote:'Résultat estimé = CA HT × taux de marge − part des charges fixes du mois.',close:'Fermer le détail',rNo:'non atteint sur l’exercice de référence',rFut:'atteint en {m} sur l’exercice de référence',rk:'Référence de l’année',rAbove:'À structure inchangée, l’exercice de référence couvre le minimum annuel avec {x} d’avance',rBelow:'À structure inchangée, il manque {x} sur l’exercice de référence pour couvrir le minimum annuel',rSous:'Exercice de référence {y} : {ca} de chiffre d’affaires pour {min} de minimum annuel, soit {pct}. La projection réelle s’affichera après 2 mois complets de suivi ({n} sur 2).',rSousNoY:'Exercice de référence : {ca} de chiffre d’affaires pour {min} de minimum annuel, soit {pct}. La projection réelle s’affichera après 2 mois complets de suivi ({n} sur 2).',rChip:'Référence · projection après 2 mois complets',tRef:'CA de référence',tRefRes:'Résultat de référence',tTrack:'Suivi depuis le {d}',tTrackV:'{a} sur {e} attendus',tTrack0:'Suivi pas encore commencé',rCk:'Référence répartie selon votre calendrier, 100 % = minimum du mois',rCl:'Chaque barre : la part de l’exercice de référence qui revient au mois, face à son minimum. Hachuré : mois fermé.',rNote:'Ce n’est pas une projection : c’est votre structure annuelle telle que vos chiffres de référence la décrivent. Dès 2 mois complets de suivi, Verdict la remplace par la projection de l’année réelle.',h2:'Mon année',kicker:'Projection de l’année',conf:'fiabilité',cm:'mois complets',hi:'élevée',me:'moyenne',lo:'faible',
      above:'À ce rythme, l’année finit {x} au-dessus du minimum',below:'À ce rythme, il manquera {x} pour couvrir le minimum de l’année',
      sous:'{enc} encaissés sur {att} attendus à cette date. Rythme : {pace}. Fin d’année projetée : {proj}, entre {lo} et {hi}.',
      tEnc:'Encaissé à cette date',tAtt:'Attendu à cette date',tFin:'Fin d’année estimée',tMin:'Minimum annuel',tReach:'Minimum annuel atteint',tRes:'Résultat projeté de l’année en cours',tResRef:'Exercice {y} de référence : {r}',
      past:'franchi en {m}',fut:'attendu vers {m}',no:'non atteint à ce rythme',high:'atteignable seulement dans la fourchette haute',
      pl:['90 %','95 %','minimum annuel'],ck:'Courbe des mois, 100 % = minimum du mois couvert',ca:'Chaque mois face à son minimum de structure',
      cl:'Chaque barre : un mois face à son minimum. Plein : réalisé. Pointillé : projeté. Hachuré : mois fermé.',
      nk:'Ce qu’il faut comprendre',nv:'Cette avance peut absorber un écart de fin d’année, mais une projection reste une estimation.',nj:'L’année est presque dans le rythme. Un mois moyen suffit à repasser au-dessus, un mois faible la fait basculer.',no2:'Le retard se comble sur les mois restants, à condition de dépasser le minimum de chaque mois.',nr:'Au rythme actuel, l’année finira sous son minimum. Regardez d’abord la décision prioritaire.',
      rest:'Il reste {a} à encaisser pour couvrir le minimum de l’année, soit {d} par jour d’ouverture.',rest0:'Le minimum de l’année est couvert.',
      how:'Comment c’est calculé',method:'Le rythme est le réalisé divisé par l’attendu à ce jour, selon votre calendrier d’ouverture et la saisonnalité de votre historique. Chaque mois restant reprend ce rythme sur son propre minimum : ce n’est pas une ligne droite. Le résultat = chiffre d’affaires HT × taux de marge sur coûts variables − charges fixes de la période. Une projection reste une estimation.',
      go:'Voir les mois et la courbe',
      shortT:'Pas encore assez de données',shortB:'La projection de l’année demande au moins 2 mois complets suivis de bout en bout. Mois complets observés : {n} sur 2.',
      missT:'{n} journée(s) ouverte(s) à renseigner',missB:'Verdict ne projette pas une année avec des trous : une journée absente ne devient jamais 0 €.',
      calT:'Calendrier à confirmer',calB:'Des mois d’ouverture ont changé. Confirmez le calendrier avant de lire la projection de l’année.',
      noneT:'Projection de l’année indisponible',noneB:'Le minimum de structure ou le plan de saison manque encore.',
      m:['J','F','M','A','M','J','J','A','S','O','N','D'],mo:'Mois'},
    en:{tDays:'Days',tCum:'Month to date',tab:'Year',tabKicker:'Your year, month by month',methN1:'Method: each remaining month takes the same month of {y} × your growth to date ({g}, over {n} comparable completed months, the current month not included). Current month: projection from the Month tab of Home.',tdLY:'Same month {y}',tdG:'Growth applied',n1Txt:'Projection = {l} actual in {m} {y} × {g} = {v}.',tdEndM:'Month end (Month tab projection)',monthTxt:'Same figure as the Month tab of Home: the month end follows the pace of your days.',curN1Txt:'Projection = {a} collected + {g} × what remained in {m} {y} ({r}) = {v}.',vsY:'versus {y}',curTxt:'Here the month end follows the year’s pace. The Month tab of Home uses the pace of this month’s days: the two figures can differ.',hint:'Tap a month to see its detail.',kPast:'Actual',kCur:'In progress',kFut:'Projected',kOff:'Closed',kRef:'Reference',dRatio:'{p} of the month minimum',tdMin:'Month minimum',tdReal:'Actual',tdCur:'Collected to date',tdProj:'Projected',tdRef:'Share of the reference',tdGap:'Gap to minimum',tdDays:'Days filled in',tdDaysV:'{a} of {b} open',tdDaysF:'Planned open days',tdTk:'Tickets',tdBasket:'Average basket',tdNA:'not filled in',tdRes:'Estimated month result',tdCum:'Cumulative at month end',tdCumV:'{a} of {b} ({p})',tdEnd:'Month end at the year’s pace',tdLeft:'Left to cover the minimum',tdClosed:'Month closed',tdOpen:'Month not closed',offTxt:'Month closed per your calendar: no minimum, no figure expected.',refTxt:'Reference reading: the share of the reference year falling in this month, not an actual.',projTxt:'Projection: this month applies the year’s pace to its own minimum.',resNote:'Estimated result = revenue excl. VAT × margin rate − the month’s share of fixed costs.',close:'Close detail',rNo:'not reached in the reference year',rFut:'reached in {m} in the reference year',rk:'Reference year',rAbove:'With an unchanged structure, the reference year covers the annual minimum with {x} to spare',rBelow:'With an unchanged structure, the reference year is {x} short of the annual minimum',rSous:'Reference year {y}: {ca} revenue for an annual minimum of {min}, i.e. {pct}. The actual projection will appear after 2 complete months of tracking ({n} of 2).',rSousNoY:'Reference year: {ca} revenue for an annual minimum of {min}, i.e. {pct}. The actual projection will appear after 2 complete months of tracking ({n} of 2).',rChip:'Reference · projection after 2 complete months',tRef:'Reference revenue',tRefRes:'Reference result',tTrack:'Tracking since {d}',tTrackV:'{a} of {e} expected',tTrack0:'Tracking not started yet',rCk:'Reference spread over your calendar, 100 % = month minimum',rCl:'Each bar: the share of the reference year falling in the month, against its minimum. Hatched: closed month.',rNote:'This is not a projection: it is your annual structure as your reference figures describe it. After 2 complete months of tracking, Verdict replaces it with the actual year projection.',h2:'My year',kicker:'Year projection',conf:'reliability',cm:'complete months',hi:'high',me:'medium',lo:'low',
      above:'At this pace, the year ends {x} above the minimum',below:'At this pace, {x} will be missing to cover the year’s minimum',
      sous:'{enc} collected out of {att} expected by now. Pace: {pace}. Projected year-end: {proj}, between {lo} and {hi}.',
      tEnc:'Collected to date',tAtt:'Expected by now',tFin:'Estimated year-end',tMin:'Annual minimum',tReach:'Annual minimum reached',tRes:'Projected result for the current year',tResRef:'Reference financial year {y}: {r}',
      past:'passed in {m}',fut:'expected around {m}',no:'not reached at this pace',high:'reachable only in the high range',
      pl:['90 %','95 %','annual minimum'],ck:'Month curve, 100 % = month minimum covered',ca:'Each month against its structural minimum',
      cl:'Each bar: one month against its minimum. Solid: actual. Dashed: projected. Hatched: closed month.',
      nk:'What to understand',nv:'This lead can absorb a year-end gap, but a projection remains an estimate.',nj:'The year is almost on pace. An average month brings it back above, a weak one tips it.',no2:'The shortfall can be made up over the remaining months, provided each month exceeds its minimum.',nr:'At the current pace the year will end below its minimum. Look first at the priority decision.',
      rest:'{a} still to collect to cover the year’s minimum, i.e. {d} per open day.',rest0:'The year’s minimum is covered.',
      how:'How it is calculated',method:'The pace is the actual divided by what was expected by now, following your opening calendar and your history’s seasonality. Each remaining month applies this pace to its own minimum: it is not a straight line. Result = revenue excl. VAT × contribution margin rate − fixed costs of the period. A projection remains an estimate.',
      go:'See the months and the curve',
      shortT:'Not enough data yet',shortB:'The year projection needs at least 2 complete months followed end to end. Complete months observed: {n} of 2.',
      missT:'{n} open day(s) to fill in',missB:'Verdict does not project a year with gaps: a missing day never becomes €0.',
      calT:'Calendar to confirm',calB:'Opening months have changed. Confirm the calendar before reading the year projection.',
      noneT:'Year projection unavailable',noneB:'The structural minimum or the season plan is still missing.',
      m:['J','F','M','A','M','J','J','A','S','O','N','D'],mo:'Month'},
    es:{tDays:'Jornadas',tCum:'Acumulado del mes',tab:'Año',tabKicker:'Su año, mes a mes',methN1:'Método: cada mes restante toma el mismo mes de {y} × su evolución a la fecha ({g}, sobre {n} meses terminados comparables, sin el mes en curso). Mes en curso: proyección de la pestaña Mes de Inicio.',tdLY:'Mismo mes {y}',tdG:'Evolución aplicada',n1Txt:'Proyección = {l} reales en {m} {y} × {g} = {v}.',tdEndM:'Fin de mes (proyección de la pestaña Mes)',monthTxt:'Misma cifra que la pestaña Mes de Inicio: el fin de mes sigue el ritmo de sus jornadas.',curN1Txt:'Proyección = {a} cobrados + {g} × lo que quedaba en {m} {y} ({r}) = {v}.',vsY:'respecto a {y}',curTxt:'Aquí el fin de mes sigue el ritmo del año. La pestaña Mes de Inicio usa el ritmo de los días del mes: las dos cifras pueden diferir.',hint:'Toque un mes para ver su detalle.',kPast:'Real',kCur:'En curso',kFut:'Proyectado',kOff:'Cerrado',kRef:'Referencia',dRatio:'{p} del mínimo del mes',tdMin:'Mínimo del mes',tdReal:'Real',tdCur:'Cobrado hasta hoy',tdProj:'Proyectado',tdRef:'Parte de la referencia',tdGap:'Diferencia con el mínimo',tdDays:'Días registrados',tdDaysV:'{a} de {b} abiertos',tdDaysF:'Días de apertura previstos',tdTk:'Tickets',tdBasket:'Ticket medio',tdNA:'sin datos',tdRes:'Resultado estimado del mes',tdCum:'Acumulado a fin de mes',tdCumV:'{a} de {b} ({p})',tdEnd:'Fin de mes al ritmo del año',tdLeft:'Falta para cubrir el mínimo',tdClosed:'Mes cerrado',tdOpen:'Mes sin cerrar',offTxt:'Mes cerrado según su calendario: sin mínimo ni cifra prevista.',refTxt:'Lectura de referencia: la parte del ejercicio de referencia que corresponde a este mes, no un real.',projTxt:'Proyección: este mes aplica el ritmo del año a su propio mínimo.',resNote:'Resultado estimado = ingresos sin IVA × tasa de margen − parte de los costes fijos del mes.',close:'Cerrar el detalle',rNo:'no alcanzado en el ejercicio de referencia',rFut:'alcanzado en {m} en el ejercicio de referencia',rk:'Año de referencia',rAbove:'Con la estructura sin cambios, el ejercicio de referencia cubre el mínimo anual con {x} de margen',rBelow:'Con la estructura sin cambios, al ejercicio de referencia le faltan {x} para cubrir el mínimo anual',rSous:'Ejercicio de referencia {y}: {ca} de ingresos para un mínimo anual de {min}, es decir {pct}. La proyección real aparecerá tras 2 meses completos de seguimiento ({n} de 2).',rSousNoY:'Ejercicio de referencia: {ca} de ingresos para un mínimo anual de {min}, es decir {pct}. La proyección real aparecerá tras 2 meses completos de seguimiento ({n} de 2).',rChip:'Referencia · proyección tras 2 meses completos',tRef:'Ingresos de referencia',tRefRes:'Resultado de referencia',tTrack:'Seguimiento desde el {d}',tTrackV:'{a} de {e} previstos',tTrack0:'Seguimiento aún no iniciado',rCk:'Referencia repartida según su calendario, 100 % = mínimo del mes',rCl:'Cada barra: la parte del ejercicio de referencia que corresponde al mes, frente a su mínimo. Rayado: mes cerrado.',rNote:'No es una proyección: es su estructura anual tal como la describen sus cifras de referencia. Tras 2 meses completos de seguimiento, Verdict la sustituye por la proyección del año real.',h2:'Mi año',kicker:'Proyección del año',conf:'fiabilidad',cm:'meses completos',hi:'alta',me:'media',lo:'baja',
      above:'A este ritmo, el año termina {x} por encima del mínimo',below:'A este ritmo, faltarán {x} para cubrir el mínimo del año',
      sous:'{enc} cobrados de {att} previstos a esta fecha. Ritmo: {pace}. Cierre de año proyectado: {proj}, entre {lo} y {hi}.',
      tEnc:'Cobrado a esta fecha',tAtt:'Previsto a esta fecha',tFin:'Cierre de año estimado',tMin:'Mínimo anual',tReach:'Mínimo anual alcanzado',tRes:'Resultado proyectado del año en curso',tResRef:'Ejercicio de referencia {y}: {r}',
      past:'superado en {m}',fut:'previsto hacia {m}',no:'no alcanzado a este ritmo',high:'alcanzable solo en el rango alto',
      pl:['90 %','95 %','mínimo anual'],ck:'Curva de meses, 100 % = mínimo del mes cubierto',ca:'Cada mes frente a su mínimo de estructura',
      cl:'Cada barra: un mes frente a su mínimo. Lleno: real. Discontinuo: proyectado. Rayado: mes cerrado.',
      nk:'Lo que hay que entender',nv:'Esta ventaja puede absorber un desvío a final de año, pero una proyección sigue siendo una estimación.',nj:'El año va casi al ritmo. Un mes medio lo devuelve por encima, un mes débil lo hace caer.',no2:'El retraso se recupera en los meses restantes, siempre que cada mes supere su mínimo.',nr:'Al ritmo actual, el año terminará por debajo de su mínimo. Mire primero la decisión prioritaria.',
      rest:'Faltan {a} por cobrar para cubrir el mínimo del año, es decir {d} por día abierto.',rest0:'El mínimo del año está cubierto.',
      how:'Cómo se calcula',method:'El ritmo es lo realizado dividido por lo previsto a esta fecha, según su calendario de apertura y la estacionalidad de su historial. Cada mes restante aplica este ritmo a su propio mínimo: no es una línea recta. Resultado = ingresos sin IVA × tasa de margen sobre costes variables − costes fijos del periodo. Una proyección sigue siendo una estimación.',
      go:'Ver los meses y la curva',
      shortT:'Aún no hay datos suficientes',shortB:'La proyección del año requiere al menos 2 meses completos seguidos de principio a fin. Meses completos observados: {n} de 2.',
      missT:'{n} jornada(s) abierta(s) por completar',missB:'Verdict no proyecta un año con huecos: una jornada ausente nunca se convierte en 0 €.',
      calT:'Calendario por confirmar',calB:'Han cambiado meses de apertura. Confirme el calendario antes de leer la proyección del año.',
      noneT:'Proyección del año no disponible',noneB:'Aún falta el mínimo de estructura o el plan de temporada.',
      m:['E','F','M','A','M','J','J','A','S','O','N','D'],mo:'Mes'},
    it:{tDays:'Giornate',tCum:'Cumulato del mese',tab:'Anno',tabKicker:'Il suo anno, mese per mese',methN1:'Metodo: ogni mese restante riprende lo stesso mese del {y} × la sua evoluzione a oggi ({g}, su {n} mesi conclusi confrontabili, senza il mese in corso). Mese in corso: proiezione della scheda Mese della Home.',tdLY:'Stesso mese {y}',tdG:'Evoluzione applicata',n1Txt:'Proiezione = {l} realizzati a {m} {y} × {g} = {v}.',tdEndM:'Fine mese (proiezione della scheda Mese)',monthTxt:'Stessa cifra della scheda Mese della Home: la fine mese segue il ritmo delle sue giornate.',curN1Txt:'Proiezione = {a} incassati + {g} × ciò che restava a {m} {y} ({r}) = {v}.',vsY:'rispetto al {y}',curTxt:'Qui la fine mese segue il ritmo dell’anno. La scheda Mese della Home usa il ritmo dei giorni del mese: le due cifre possono differire.',hint:'Tocchi un mese per vederne il dettaglio.',kPast:'Realizzato',kCur:'In corso',kFut:'Proiettato',kOff:'Chiuso',kRef:'Riferimento',dRatio:'{p} del minimo del mese',tdMin:'Minimo del mese',tdReal:'Realizzato',tdCur:'Incassato finora',tdProj:'Proiettato',tdRef:'Quota del riferimento',tdGap:'Scarto dal minimo',tdDays:'Giorni inseriti',tdDaysV:'{a} su {b} aperti',tdDaysF:'Giorni di apertura previsti',tdTk:'Scontrini',tdBasket:'Scontrino medio',tdNA:'non inserito',tdRes:'Risultato stimato del mese',tdCum:'Cumulato a fine mese',tdCumV:'{a} su {b} ({p})',tdEnd:'Fine mese al ritmo dell’anno',tdLeft:'Manca per coprire il minimo',tdClosed:'Mese chiuso',tdOpen:'Mese non chiuso',offTxt:'Mese chiuso secondo il calendario: nessun minimo, nessuna cifra attesa.',refTxt:'Lettura di riferimento: la quota dell’esercizio di riferimento che spetta al mese, non un realizzato.',projTxt:'Proiezione: questo mese applica il ritmo dell’anno al proprio minimo.',resNote:'Risultato stimato = ricavi IVA esclusa × tasso di margine − quota dei costi fissi del mese.',close:'Chiudi il dettaglio',rNo:'non raggiunto nell’esercizio di riferimento',rFut:'raggiunto a {m} nell’esercizio di riferimento',rk:'Anno di riferimento',rAbove:'A struttura invariata, l’esercizio di riferimento copre il minimo annuale con {x} di margine',rBelow:'A struttura invariata, all’esercizio di riferimento mancano {x} per coprire il minimo annuale',rSous:'Esercizio di riferimento {y}: {ca} di ricavi per un minimo annuale di {min}, cioè {pct}. La proiezione reale comparirà dopo 2 mesi completi di monitoraggio ({n} su 2).',rSousNoY:'Esercizio di riferimento: {ca} di ricavi per un minimo annuale di {min}, cioè {pct}. La proiezione reale comparirà dopo 2 mesi completi di monitoraggio ({n} su 2).',rChip:'Riferimento · proiezione dopo 2 mesi completi',tRef:'Ricavi di riferimento',tRefRes:'Risultato di riferimento',tTrack:'Monitoraggio dal {d}',tTrackV:'{a} su {e} previsti',tTrack0:'Monitoraggio non ancora iniziato',rCk:'Riferimento ripartito secondo il calendario, 100 % = minimo del mese',rCl:'Ogni barra: la quota dell’esercizio di riferimento che spetta al mese, rispetto al suo minimo. Retinato: mese chiuso.',rNote:'Non è una proiezione: è la struttura annuale come la descrivono i dati di riferimento. Dopo 2 mesi completi di monitoraggio, Verdict la sostituisce con la proiezione dell’anno reale.',h2:'Il mio anno',kicker:'Proiezione dell’anno',conf:'affidabilità',cm:'mesi completi',hi:'alta',me:'media',lo:'bassa',
      above:'A questo ritmo, l’anno chiude {x} sopra il minimo',below:'A questo ritmo mancheranno {x} per coprire il minimo dell’anno',
      sous:'{enc} incassati su {att} previsti a questa data. Ritmo: {pace}. Fine anno proiettata: {proj}, tra {lo} e {hi}.',
      tEnc:'Incassato a questa data',tAtt:'Previsto a questa data',tFin:'Fine anno stimata',tMin:'Minimo annuale',tReach:'Minimo annuale raggiunto',tRes:'Risultato proiettato dell’anno in corso',tResRef:'Esercizio di riferimento {y}: {r}',
      past:'superato a {m}',fut:'previsto verso {m}',no:'non raggiunto a questo ritmo',high:'raggiungibile solo nella fascia alta',
      pl:['90 %','95 %','minimo annuale'],ck:'Curva dei mesi, 100 % = minimo del mese coperto',ca:'Ogni mese rispetto al suo minimo di struttura',
      cl:'Ogni barra: un mese rispetto al suo minimo. Pieno: reale. Tratteggiato: proiettato. Retinato: mese chiuso.',
      nk:'Cosa capire',nv:'Questo vantaggio può assorbire uno scarto di fine anno, ma una proiezione resta una stima.',nj:'L’anno è quasi in linea. Un mese medio lo riporta sopra, un mese debole lo fa scendere.',no2:'Il ritardo si recupera nei mesi restanti, a condizione di superare il minimo di ogni mese.',nr:'Al ritmo attuale l’anno finirà sotto il minimo. Guardi prima la decisione prioritaria.',
      rest:'Restano {a} da incassare per coprire il minimo dell’anno, cioè {d} per giorno di apertura.',rest0:'Il minimo dell’anno è coperto.',
      how:'Come viene calcolato',method:'Il ritmo è il realizzato diviso per il previsto a oggi, secondo il calendario di apertura e la stagionalità dello storico. Ogni mese restante applica questo ritmo al proprio minimo: non è una retta. Risultato = ricavi IVA esclusa × tasso di margine sui costi variabili − costi fissi del periodo. Una proiezione resta una stima.',
      go:'Vedi i mesi e la curva',
      shortT:'Dati ancora insufficienti',shortB:'La proiezione dell’anno richiede almeno 2 mesi completi seguiti dall’inizio alla fine. Mesi completi osservati: {n} su 2.',
      missT:'{n} giornata/e aperta/e da inserire',missB:'Verdict non proietta un anno con buchi: una giornata assente non diventa mai 0 €.',
      calT:'Calendario da confermare',calB:'I mesi di apertura sono cambiati. Confermi il calendario prima di leggere la proiezione dell’anno.',
      noneT:'Proiezione dell’anno non disponibile',noneB:'Manca ancora il minimo di struttura o il piano di stagione.',
      m:['G','F','M','A','M','G','L','A','S','O','N','D'],mo:'Mese'},
    de:{tDays:'Tage',tCum:'Monat kumuliert',tab:'Jahr',tabKicker:'Ihr Jahr, Monat für Monat',methN1:'Methode: jeder restliche Monat übernimmt denselben Monat {y} × Ihre bisherige Entwicklung ({g}, über {n} abgeschlossene vergleichbare Monate, ohne den laufenden Monat). Laufender Monat: Prognose des Reiters Monat der Startseite.',tdLY:'Gleicher Monat {y}',tdG:'Angewandte Entwicklung',n1Txt:'Prognose = {l} Ist im {m} {y} × {g} = {v}.',tdEndM:'Monatsende (Prognose des Reiters Monat)',monthTxt:'Gleiche Zahl wie der Reiter Monat der Startseite: das Monatsende folgt dem Tempo Ihrer Tage.',curN1Txt:'Prognose = {a} eingenommen + {g} × der Rest im {m} {y} ({r}) = {v}.',vsY:'gegenüber {y}',curTxt:'Hier folgt das Monatsende dem Jahrestempo. Der Reiter Monat der Startseite nutzt das Tempo der Tage dieses Monats: beide Zahlen können abweichen.',hint:'Tippen Sie auf einen Monat, um Details zu sehen.',kPast:'Ist',kCur:'Laufend',kFut:'Prognose',kOff:'Geschlossen',kRef:'Referenz',dRatio:'{p} des Monatsminimums',tdMin:'Monatsminimum',tdReal:'Ist',tdCur:'Bis heute eingenommen',tdProj:'Prognose',tdRef:'Anteil der Referenz',tdGap:'Abweichung zum Minimum',tdDays:'Erfasste Tage',tdDaysV:'{a} von {b} geöffnet',tdDaysF:'Geplante Öffnungstage',tdTk:'Bons',tdBasket:'Durchschnittsbon',tdNA:'nicht erfasst',tdRes:'Geschätztes Monatsergebnis',tdCum:'Kumuliert zum Monatsende',tdCumV:'{a} von {b} ({p})',tdEnd:'Monatsende im Jahrestempo',tdLeft:'Fehlt zum Minimum',tdClosed:'Monat abgeschlossen',tdOpen:'Monat nicht abgeschlossen',offTxt:'Monat laut Kalender geschlossen: kein Minimum, kein erwarteter Betrag.',refTxt:'Referenzlesung: der Anteil des Referenzjahres in diesem Monat, kein Ist.',projTxt:'Prognose: dieser Monat wendet das Jahrestempo auf sein eigenes Minimum an.',resNote:'Geschätztes Ergebnis = Umsatz netto × Margenquote − Monatsanteil der Fixkosten.',close:'Details schließen',rNo:'im Referenzjahr nicht erreicht',rFut:'im Referenzjahr im {m} erreicht',rk:'Referenzjahr',rAbove:'Bei unveränderter Struktur deckt das Referenzjahr das Jahresminimum mit {x} Puffer',rBelow:'Bei unveränderter Struktur fehlen dem Referenzjahr {x} zum Jahresminimum',rSous:'Referenzjahr {y}: {ca} Umsatz für ein Jahresminimum von {min}, also {pct}. Die echte Prognose erscheint nach 2 vollständigen Monaten Erfassung ({n} von 2).',rSousNoY:'Referenzjahr: {ca} Umsatz für ein Jahresminimum von {min}, also {pct}. Die echte Prognose erscheint nach 2 vollständigen Monaten Erfassung ({n} von 2).',rChip:'Referenz · Prognose nach 2 vollständigen Monaten',tRef:'Referenzumsatz',tRefRes:'Referenzergebnis',tTrack:'Erfassung seit {d}',tTrackV:'{a} von {e} erwartet',tTrack0:'Erfassung noch nicht begonnen',rCk:'Referenz nach Ihrem Kalender verteilt, 100 % = Monatsminimum',rCl:'Jeder Balken: der Anteil des Referenzjahres im Monat, gegenüber seinem Minimum. Schraffiert: geschlossener Monat.',rNote:'Das ist keine Prognose: es ist Ihre Jahresstruktur, wie Ihre Referenzzahlen sie beschreiben. Nach 2 vollständigen Monaten Erfassung ersetzt Verdict sie durch die Prognose des echten Jahres.',h2:'Mein Jahr',kicker:'Jahresprognose',conf:'Zuverlässigkeit',cm:'vollständige Monate',hi:'hoch',me:'mittel',lo:'niedrig',
      above:'In diesem Tempo endet das Jahr {x} über dem Minimum',below:'In diesem Tempo fehlen {x}, um das Jahresminimum zu decken',
      sous:'{enc} eingenommen von {att} bis heute erwartet. Tempo: {pace}. Prognostiziertes Jahresende: {proj}, zwischen {lo} und {hi}.',
      tEnc:'Bis heute eingenommen',tAtt:'Bis heute erwartet',tFin:'Geschätztes Jahresende',tMin:'Jahresminimum',tReach:'Jahresminimum erreicht',tRes:'Prognostiziertes Ergebnis des laufenden Jahres',tResRef:'Referenzgeschäftsjahr {y}: {r}',
      past:'überschritten im {m}',fut:'erwartet etwa im {m}',no:'in diesem Tempo nicht erreicht',high:'nur im oberen Bereich erreichbar',
      pl:['90 %','95 %','Jahresminimum'],ck:'Monatskurve, 100 % = Monatsminimum gedeckt',ca:'Jeder Monat gegenüber seinem Strukturminimum',
      cl:'Jeder Balken: ein Monat gegenüber seinem Minimum. Voll: Ist. Gestrichelt: Prognose. Schraffiert: geschlossener Monat.',
      nk:'Was zu verstehen ist',nv:'Dieser Vorsprung kann eine Abweichung am Jahresende auffangen, aber eine Prognose bleibt eine Schätzung.',nj:'Das Jahr liegt fast im Tempo. Ein durchschnittlicher Monat bringt es darüber, ein schwacher kippt es.',no2:'Der Rückstand lässt sich in den restlichen Monaten aufholen, wenn jeder Monat sein Minimum übertrifft.',nr:'Im aktuellen Tempo endet das Jahr unter seinem Minimum. Sehen Sie zuerst die vorrangige Entscheidung an.',
      rest:'Noch {a} einzunehmen, um das Jahresminimum zu decken, das sind {d} pro Öffnungstag.',rest0:'Das Jahresminimum ist gedeckt.',
      how:'So wird gerechnet',method:'Das Tempo ist das Ist geteilt durch das bis heute Erwartete, nach Ihrem Öffnungskalender und der Saisonalität Ihrer Historie. Jeder restliche Monat wendet dieses Tempo auf sein eigenes Minimum an: keine Gerade. Ergebnis = Umsatz netto × Deckungsbeitragsquote − Fixkosten des Zeitraums. Eine Prognose bleibt eine Schätzung.',
      go:'Monate und Kurve ansehen',
      shortT:'Noch nicht genug Daten',shortB:'Die Jahresprognose braucht mindestens 2 lückenlos erfasste Monate. Beobachtete vollständige Monate: {n} von 2.',
      missT:'{n} offene(r) Tag(e) zu erfassen',missB:'Verdict prognostiziert kein Jahr mit Lücken: ein fehlender Tag wird nie zu 0 €.',
      calT:'Kalender bestätigen',calB:'Öffnungsmonate haben sich geändert. Bestätigen Sie den Kalender, bevor Sie die Jahresprognose lesen.',
      noneT:'Jahresprognose nicht verfügbar',noneB:'Das Strukturminimum oder der Saisonplan fehlt noch.',
      m:['J','F','M','A','M','J','J','A','S','O','N','D'],mo:'Monat'},
    nl:{tDays:'Dagen',tCum:'Maand cumulatief',tab:'Jaar',tabKicker:'Uw jaar, maand per maand',methN1:'Methode: elke resterende maand neemt dezelfde maand van {y} × uw evolutie tot nu ({g}, over {n} afgesloten vergelijkbare maanden, zonder de lopende maand). Lopende maand: prognose van het tabblad Maand van Start.',tdLY:'Zelfde maand {y}',tdG:'Toegepaste evolutie',n1Txt:'Prognose = {l} werkelijk in {m} {y} × {g} = {v}.',tdEndM:'Maandeinde (prognose van het tabblad Maand)',monthTxt:'Zelfde cijfer als het tabblad Maand van Start: het maandeinde volgt het tempo van uw dagen.',curN1Txt:'Prognose = {a} ontvangen + {g} × wat er restte in {m} {y} ({r}) = {v}.',vsY:'ten opzichte van {y}',curTxt:'Hier volgt het maandeinde het jaartempo. Het tabblad Maand van Start gebruikt het tempo van de dagen van deze maand: beide cijfers kunnen verschillen.',hint:'Tik op een maand om het detail te zien.',kPast:'Werkelijk',kCur:'Lopend',kFut:'Prognose',kOff:'Gesloten',kRef:'Referentie',dRatio:'{p} van het maandminimum',tdMin:'Maandminimum',tdReal:'Werkelijk',tdCur:'Ontvangen tot nu',tdProj:'Prognose',tdRef:'Aandeel van de referentie',tdGap:'Verschil met minimum',tdDays:'Ingevulde dagen',tdDaysV:'{a} van {b} open',tdDaysF:'Geplande openingsdagen',tdTk:'Bonnen',tdBasket:'Gemiddelde bon',tdNA:'niet ingevuld',tdRes:'Geschat maandresultaat',tdCum:'Cumulatief op maandeinde',tdCumV:'{a} van {b} ({p})',tdEnd:'Maandeinde op jaartempo',tdLeft:'Nog nodig voor het minimum',tdClosed:'Maand afgesloten',tdOpen:'Maand niet afgesloten',offTxt:'Maand gesloten volgens uw kalender: geen minimum, geen verwacht bedrag.',refTxt:'Referentielezing: het deel van het referentiejaar dat op deze maand valt, geen werkelijk cijfer.',projTxt:'Prognose: deze maand past het jaartempo toe op zijn eigen minimum.',resNote:'Geschat resultaat = omzet excl. btw × margepercentage − maanddeel van de vaste kosten.',close:'Detail sluiten',rNo:'niet gehaald in het referentiejaar',rFut:'in {m} gehaald in het referentiejaar',rk:'Referentiejaar',rAbove:'Bij ongewijzigde structuur dekt het referentiejaar het jaarminimum met {x} marge',rBelow:'Bij ongewijzigde structuur ontbreekt in het referentiejaar {x} om het jaarminimum te dekken',rSous:'Referentiejaar {y}: {ca} omzet voor een jaarminimum van {min}, dus {pct}. De echte prognose verschijnt na 2 volledige maanden opvolging ({n} van 2).',rSousNoY:'Referentiejaar: {ca} omzet voor een jaarminimum van {min}, dus {pct}. De echte prognose verschijnt na 2 volledige maanden opvolging ({n} van 2).',rChip:'Referentie · prognose na 2 volledige maanden',tRef:'Referentieomzet',tRefRes:'Referentieresultaat',tTrack:'Opvolging sinds {d}',tTrackV:'{a} van {e} verwacht',tTrack0:'Opvolging nog niet gestart',rCk:'Referentie verdeeld volgens uw kalender, 100 % = maandminimum',rCl:'Elke balk: het deel van het referentiejaar dat op de maand valt, tegenover zijn minimum. Gearceerd: gesloten maand.',rNote:'Dit is geen prognose: het is uw jaarstructuur zoals uw referentiecijfers die beschrijven. Na 2 volledige maanden opvolging vervangt Verdict ze door de prognose van het echte jaar.',h2:'Mijn jaar',kicker:'Jaarprognose',conf:'betrouwbaarheid',cm:'volledige maanden',hi:'hoog',me:'gemiddeld',lo:'laag',
      above:'Op dit tempo eindigt het jaar {x} boven het minimum',below:'Op dit tempo ontbreekt {x} om het jaarminimum te dekken',
      sous:'{enc} ontvangen van {att} verwacht op deze datum. Tempo: {pace}. Verwacht jaareinde: {proj}, tussen {lo} en {hi}.',
      tEnc:'Ontvangen tot nu',tAtt:'Verwacht op deze datum',tFin:'Geschat jaareinde',tMin:'Jaarminimum',tReach:'Jaarminimum bereikt',tRes:'Verwacht resultaat van het lopende jaar',tResRef:'Referentieboekjaar {y}: {r}',
      past:'gehaald in {m}',fut:'verwacht rond {m}',no:'op dit tempo niet gehaald',high:'alleen haalbaar in de hoge marge',
      pl:['90 %','95 %','jaarminimum'],ck:'Maandcurve, 100 % = maandminimum gedekt',ca:'Elke maand tegenover zijn structuurminimum',
      cl:'Elke balk: een maand tegenover zijn minimum. Vol: werkelijk. Gestippeld: prognose. Gearceerd: gesloten maand.',
      nk:'Wat u moet begrijpen',nv:'Deze voorsprong kan een afwijking aan het jaareinde opvangen, maar een prognose blijft een schatting.',nj:'Het jaar ligt bijna op tempo. Een gemiddelde maand brengt het erboven, een zwakke doet het kantelen.',no2:'De achterstand kan in de resterende maanden worden ingehaald, op voorwaarde dat elke maand zijn minimum overschrijdt.',nr:'Op het huidige tempo eindigt het jaar onder zijn minimum. Bekijk eerst de prioritaire beslissing.',
      rest:'Nog {a} te ontvangen om het jaarminimum te dekken, dat is {d} per openingsdag.',rest0:'Het jaarminimum is gedekt.',
      how:'Hoe het berekend wordt',method:'Het tempo is het werkelijke gedeeld door het tot nu toe verwachte, volgens uw openingskalender en de seizoenspatronen van uw historiek. Elke resterende maand past dit tempo toe op zijn eigen minimum: geen rechte lijn. Resultaat = omzet excl. btw × dekkingsbijdrage − vaste kosten van de periode. Een prognose blijft een schatting.',
      go:'Maanden en curve bekijken',
      shortT:'Nog niet genoeg gegevens',shortB:'De jaarprognose vraagt minstens 2 volledig gevolgde maanden. Waargenomen volledige maanden: {n} van 2.',
      missT:'{n} openingsdag(en) in te vullen',missB:'Verdict maakt geen prognose voor een jaar met gaten: een ontbrekende dag wordt nooit 0 €.',
      calT:'Kalender te bevestigen',calB:'Openingsmaanden zijn gewijzigd. Bevestig de kalender voordat u de jaarprognose leest.',
      noneT:'Jaarprognose niet beschikbaar',noneB:'Het structuurminimum of het seizoensplan ontbreekt nog.',
      m:['J','F','M','A','M','J','J','A','S','O','N','D'],mo:'Maand'},
    pt:{tDays:'Dias',tCum:'Acumulado do mês',tab:'Ano',tabKicker:'O seu ano, mês a mês',methN1:'Método: cada mês restante retoma o mesmo mês de {y} × a sua evolução até hoje ({g}, sobre {n} meses concluídos comparáveis, sem o mês em curso). Mês em curso: projeção do separador Mês do Início.',tdLY:'Mesmo mês {y}',tdG:'Evolução aplicada',n1Txt:'Projeção = {l} realizados em {m} {y} × {g} = {v}.',tdEndM:'Fim do mês (projeção do separador Mês)',monthTxt:'Mesmo valor que o separador Mês do Início: o fim do mês segue o ritmo dos seus dias.',curN1Txt:'Projeção = {a} recebidos + {g} × o que faltava em {m} {y} ({r}) = {v}.',vsY:'em relação a {y}',curTxt:'Aqui o fim do mês segue o ritmo do ano. O separador Mês do Início usa o ritmo dos dias do mês: os dois valores podem diferir.',hint:'Toque num mês para ver o detalhe.',kPast:'Realizado',kCur:'Em curso',kFut:'Projetado',kOff:'Fechado',kRef:'Referência',dRatio:'{p} do mínimo do mês',tdMin:'Mínimo do mês',tdReal:'Realizado',tdCur:'Recebido até hoje',tdProj:'Projetado',tdRef:'Parte da referência',tdGap:'Diferença para o mínimo',tdDays:'Dias registados',tdDaysV:'{a} de {b} abertos',tdDaysF:'Dias de abertura previstos',tdTk:'Talões',tdBasket:'Talão médio',tdNA:'não registado',tdRes:'Resultado estimado do mês',tdCum:'Acumulado no fim do mês',tdCumV:'{a} de {b} ({p})',tdEnd:'Fim do mês ao ritmo do ano',tdLeft:'Falta para cobrir o mínimo',tdClosed:'Mês fechado',tdOpen:'Mês não fechado',offTxt:'Mês fechado segundo o calendário: sem mínimo, sem valor esperado.',refTxt:'Leitura de referência: a parte do exercício de referência que cabe a este mês, não um realizado.',projTxt:'Projeção: este mês aplica o ritmo do ano ao seu próprio mínimo.',resNote:'Resultado estimado = receita sem IVA × taxa de margem − parte dos custos fixos do mês.',close:'Fechar o detalhe',rNo:'não atingido no exercício de referência',rFut:'atingido em {m} no exercício de referência',rk:'Ano de referência',rAbove:'Com a estrutura inalterada, o exercício de referência cobre o mínimo anual com {x} de folga',rBelow:'Com a estrutura inalterada, faltam {x} ao exercício de referência para cobrir o mínimo anual',rSous:'Exercício de referência {y}: {ca} de receita para um mínimo anual de {min}, ou seja {pct}. A projeção real aparecerá após 2 meses completos de acompanhamento ({n} de 2).',rSousNoY:'Exercício de referência: {ca} de receita para um mínimo anual de {min}, ou seja {pct}. A projeção real aparecerá após 2 meses completos de acompanhamento ({n} de 2).',rChip:'Referência · projeção após 2 meses completos',tRef:'Receita de referência',tRefRes:'Resultado de referência',tTrack:'Acompanhamento desde {d}',tTrackV:'{a} de {e} previstos',tTrack0:'Acompanhamento ainda não iniciado',rCk:'Referência repartida segundo o calendário, 100 % = mínimo do mês',rCl:'Cada barra: a parte do exercício de referência que cabe ao mês, face ao seu mínimo. Hachurado: mês fechado.',rNote:'Não é uma projeção: é a sua estrutura anual tal como os números de referência a descrevem. Após 2 meses completos de acompanhamento, o Verdict substitui-a pela projeção do ano real.',h2:'O meu ano',kicker:'Projeção do ano',conf:'fiabilidade',cm:'meses completos',hi:'elevada',me:'média',lo:'baixa',
      above:'A este ritmo, o ano termina {x} acima do mínimo',below:'A este ritmo, faltarão {x} para cobrir o mínimo do ano',
      sous:'{enc} recebidos de {att} previstos até esta data. Ritmo: {pace}. Fim de ano projetado: {proj}, entre {lo} e {hi}.',
      tEnc:'Recebido até esta data',tAtt:'Previsto até esta data',tFin:'Fim de ano estimado',tMin:'Mínimo anual',tReach:'Mínimo anual atingido',tRes:'Resultado projetado do ano em curso',tResRef:'Exercício de referência {y}: {r}',
      past:'ultrapassado em {m}',fut:'previsto por volta de {m}',no:'não atingido a este ritmo',high:'alcançável apenas na faixa alta',
      pl:['90 %','95 %','mínimo anual'],ck:'Curva dos meses, 100 % = mínimo do mês coberto',ca:'Cada mês face ao seu mínimo de estrutura',
      cl:'Cada barra: um mês face ao seu mínimo. Cheio: real. Tracejado: projetado. Hachurado: mês fechado.',
      nk:'O que é preciso compreender',nv:'Esta vantagem pode absorver um desvio no fim do ano, mas uma projeção continua a ser uma estimativa.',nj:'O ano está quase no ritmo. Um mês médio devolve-o para cima, um mês fraco faz com que caia.',no2:'O atraso recupera-se nos meses restantes, desde que cada mês ultrapasse o seu mínimo.',nr:'Ao ritmo atual, o ano terminará abaixo do mínimo. Veja primeiro a decisão prioritária.',
      rest:'Faltam {a} por receber para cobrir o mínimo do ano, ou seja {d} por dia de abertura.',rest0:'O mínimo do ano está coberto.',
      how:'Como é calculado',method:'O ritmo é o realizado dividido pelo previsto até hoje, segundo o calendário de abertura e a sazonalidade do histórico. Cada mês restante aplica este ritmo ao seu próprio mínimo: não é uma reta. Resultado = receita sem IVA × taxa de margem sobre custos variáveis − custos fixos do período. Uma projeção continua a ser uma estimativa.',
      go:'Ver os meses e a curva',
      shortT:'Ainda sem dados suficientes',shortB:'A projeção do ano exige pelo menos 2 meses completos acompanhados do princípio ao fim. Meses completos observados: {n} de 2.',
      missT:'{n} dia(s) aberto(s) por preencher',missB:'O Verdict não projeta um ano com lacunas: um dia em falta nunca se torna 0 €.',
      calT:'Calendário a confirmar',calB:'Os meses de abertura mudaram. Confirme o calendário antes de ler a projeção do ano.',
      noneT:'Projeção do ano indisponível',noneB:'Ainda falta o mínimo de estrutura ou o plano de temporada.',
      m:['J','F','M','A','M','J','J','A','S','O','N','D'],mo:'Mês'}
  };
  var VY_NS={fr:'Pas encore d’historique saisonnier clos dans l’application : les mois restants reprennent le rythme actuel sur le calendrier d’ouverture, sans saisonnalité.',
    en:'No closed seasonal history in the app yet: the remaining months follow the current pace on the opening calendar, without seasonality.',
    es:'Aún no hay historial estacional cerrado en la aplicación: los meses restantes siguen el ritmo actual sobre el calendario de apertura, sin estacionalidad.',
    it:'Nell’app non c’è ancora uno storico stagionale chiuso: i mesi restanti seguono il ritmo attuale sul calendario di apertura, senza stagionalità.',
    de:'In der App gibt es noch keine abgeschlossene Saisonhistorie: die restlichen Monate folgen dem aktuellen Tempo im Öffnungskalender, ohne Saisonalität.',
    nl:'Nog geen afgesloten seizoenshistoriek in de app: de resterende maanden volgen het huidige tempo op de openingskalender, zonder seizoenseffect.',
    pt:'Ainda não há histórico sazonal fechado na aplicação: os meses restantes seguem o ritmo atual no calendário de abertura, sem sazonalidade.'};
  var VY_SH={fr:'Saisonnalité reprise de {n} année(s) d’historique : chaque mois restant suit la forme de ces années.',
    en:'Seasonality taken from {n} year(s) of history: each remaining month follows the shape of those years.',
    es:'Estacionalidad tomada de {n} año(s) de historial: cada mes restante sigue la forma de esos años.',
    it:'Stagionalità ripresa da {n} anno/i di storico: ogni mese restante segue la forma di quegli anni.',
    de:'Saisonalität aus {n} Jahr(en) Historie übernommen: jeder restliche Monat folgt dem Verlauf dieser Jahre.',
    nl:'Seizoenspatroon overgenomen uit {n} jaar historiek: elke resterende maand volgt het verloop van die jaren.',
    pt:'Sazonalidade retirada de {n} ano(s) de histórico: cada mês restante segue a forma desses anos.'};
  var VY_NB='\u00a0';
  var VY_A10_COPY={"fr": ["estimation", "à prendre avec prudence", "{enc} encaissés, {att} attendus ; rythme {pace}. Fin d’année estimée : {proj}.", "Estimation de l’année à prendre avec prudence : Verdict ne vous promet aucun résultat."], "en": ["estimate", "to take with caution", "{enc} received, {att} expected; pace {pace}. Estimated year-end: {proj}.", "Year estimate to take with caution: Verdict promises no result."], "es": ["estimación", "con prudencia", "Cobrado {enc}, esperado {att}; ritmo {pace}. Fin de año estimado: {proj}.", "Estimación del año que hay que tomar con prudencia: Verdict no le promete ningún resultado."], "it": ["stima", "da prendere con prudenza", "Incassato {enc}, atteso {att}; ritmo {pace}. Fine anno stimata: {proj}.", "Stima dell’anno da prendere con prudenza: Verdict non le promette nessun risultato."], "de": ["Schätzung", "mit Vorsicht zu lesen", "Eingenommen {enc}, erwartet {att}; Tempo {pace}. Geschätztes Jahresende: {proj}.", "Jahresschätzung, mit Vorsicht zu lesen: Verdict verspricht Ihnen kein Ergebnis."], "nl": ["schatting", "met voorzichtigheid te lezen", "Ontvangen {enc}, verwacht {att}; tempo {pace}. Geschat jaareinde: {proj}.", "Jaarschatting, met voorzichtigheid te lezen: Verdict belooft u geen resultaat."], "pt": ["estimativa", "a ler com prudência", "Recebido {enc}, esperado {att}; ritmo {pace}. Fim do ano estimado: {proj}.", "Estimativa do ano a ler com prudência: o Verdict não lhe promete nenhum resultado."]};Object.keys(VY_A10_COPY).forEach(function(l){var x=VY_A10_COPY[l];VY_COPY[l].conf=x[0];VY_COPY[l].hi=x[1];VY_COPY[l].me=x[1];VY_COPY[l].lo=x[1];VY_COPY[l].sous=x[2];VY_COPY[l].calibrationNote=x[3];});
  /* C204 : la jauge du haut suit le mois touché (sa couleur, son pourcentage), puis revient à l'année. */
  var VY_CUR={fr:{y:'Année ({k}) : {p} du minimum annuel',m:'{m} ({k}) : {p} du minimum du mois',off:'{m} : mois fermé, aucun minimum',back:'Revenir à l’année',minM:'minimum du mois',kp:'réalisé',kc:'en cours, projeté',kf:'projeté',kr:'référence',ky:'projetée',kyr:'référence'},
    en:{y:'Year ({k}): {p} of the annual minimum',m:'{m} ({k}): {p} of the month minimum',off:'{m}: closed month, no minimum',back:'Back to the year',minM:'month minimum',kp:'actual',kc:'in progress, projected',kf:'projected',kr:'reference',ky:'projected',kyr:'reference'},
    es:{y:'Año ({k}): {p} del mínimo anual',m:'{m} ({k}): {p} del mínimo del mes',off:'{m}: mes cerrado, sin mínimo',back:'Volver al año',minM:'mínimo del mes',kp:'real',kc:'en curso, proyectado',kf:'proyectado',kr:'referencia',ky:'proyectado',kyr:'referencia'},
    it:{y:'Anno ({k}): {p} del minimo annuale',m:'{m} ({k}): {p} del minimo del mese',off:'{m}: mese chiuso, nessun minimo',back:'Torna all’anno',minM:'minimo del mese',kp:'reale',kc:'in corso, previsto',kf:'previsto',kr:'riferimento',ky:'previsto',kyr:'riferimento'},
    de:{y:'Jahr ({k}): {p} des Jahresminimums',m:'{m} ({k}): {p} des Monatsminimums',off:'{m}: geschlossener Monat, kein Minimum',back:'Zurück zum Jahr',minM:'Monatsminimum',kp:'Ist',kc:'laufend, Prognose',kf:'Prognose',kr:'Referenz',ky:'Prognose',kyr:'Referenz'},
    nl:{y:'Jaar ({k}): {p} van het jaarminimum',m:'{m} ({k}): {p} van het maandminimum',off:'{m}: gesloten maand, geen minimum',back:'Terug naar het jaar',minM:'maandminimum',kp:'werkelijk',kc:'lopend, prognose',kf:'prognose',kr:'referentie',ky:'prognose',kyr:'referentie'},
    pt:{y:'Ano ({k}): {p} do mínimo anual',m:'{m} ({k}): {p} do mínimo do mês',off:'{m}: mês fechado, sem mínimo',back:'Voltar ao ano',minM:'mínimo do mês',kp:'realizado',kc:'em curso, projetado',kf:'projetado',kr:'referência',ky:'projetado',kyr:'referência'}};
  function vyLoc(){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}return VY_COPY[l]?l:'fr';}
  function vyCopy(){return VY_COPY[vyLoc()];}
  function vyTag(){try{return typeof root.localeTag==='function'?root.localeTag():'fr-FR';}catch(e){return 'fr-FR';}}
  function vyEur(v){if(!vyNum(v))return '—';var s=new Intl.NumberFormat(vyTag(),{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Math.round(Math.abs(v)));return (v<0&&Math.round(Math.abs(v))>0?'\u2212':'')+s;}
  function vyEur2(v){if(!vyNum(v))return '—';return new Intl.NumberFormat(vyTag(),{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(v);}
  function vyGrowth(g){if(!vyNum(g))return '—';var d=(g-1)*100;return (d>0?'+':d<0?'\u2212':'')+Math.abs(d).toLocaleString(vyTag(),{minimumFractionDigits:1,maximumFractionDigits:1})+VY_NB+'%';}
  /* C204 : sous le minimum, jamais « 100,0 % » par arrondi (99,96 % s'écrit 99,9 %). */
  function vyPct(r){if(!vyNum(r))return '—';var v=r*100;if(r<1&&Math.round(v*10)/10>=100)v=99.9;return v.toLocaleString(vyTag(),{minimumFractionDigits:1,maximumFractionDigits:1})+VY_NB+'%';}
  function vyEsc(x){return String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function vyFill(t,o){return String(t).replace(/\{(\w+)\}/g,function(m,k){return o&&o[k]!=null?o[k]:m;});}
  function vyMonthName(i){try{return new Intl.DateTimeFormat(vyTag(),{month:'long'}).format(new Date(2026,i,1,12));}catch(e){return String(i+1);}}
  /* C250 : vert seulement avec une vraie marge (5 % ou plus au-dessus du minimum) ; de 100 à 105 %, le minimum est couvert de justesse. */
  /* C256 : jours d'ouverture inconnus (document comptable seul) : aucun nombre de jours inventé. */
  var VY_AC={fr:'à confirmer',en:'to be confirmed',es:'por confirmar',it:'da confermare',de:'noch zu bestätigen',nl:'nog te bevestigen',pt:'a confirmar'};
  function vyJoursInc(){try{return typeof root.verdictJoursInconnus==='function'&&!!root.verdictJoursInconnus();}catch(e){return false;}}
  var VY_JUSTE={fr:{note:'Le minimum est couvert de justesse : moins de 5\u00a0% au-dessus, il ne reste presque pas de marge. Un mois faible suffit à repasser en dessous.',leg:'Couvert de justesse (moins de 5\u00a0% au-dessus)'},en:{note:'The minimum is only just covered: less than 5\u00a0% above it, there is almost no margin left. One weak month is enough to fall below.',leg:'Only just covered (less than 5\u00a0% above)'},es:{note:'El mínimo está cubierto por poco: menos de un 5\u00a0% por encima, casi no queda margen. Un mes flojo basta para quedar por debajo.',leg:'Cubierto por poco (menos de un 5\u00a0% por encima)'},it:{note:'Il minimo è coperto di misura: meno del 5\u00a0% sopra, non resta quasi margine. Basta un mese debole per scendere sotto.',leg:'Coperto di misura (meno del 5\u00a0% sopra)'},de:{note:'Das Minimum ist nur knapp gedeckt: weniger als 5\u00a0% darüber, es bleibt kaum Spielraum. Ein schwacher Monat reicht, um darunter zu fallen.',leg:'Knapp gedeckt (weniger als 5\u00a0% darüber)'},nl:{note:'Het minimum is maar net gedekt: minder dan 5\u00a0% erboven, er blijft bijna geen marge over. Eén zwakke maand is genoeg om eronder te zakken.',leg:'Net gedekt (minder dan 5\u00a0% erboven)'},pt:{note:'O mínimo está coberto à justa: menos de 5\u00a0% acima, quase não sobra margem. Basta um mês fraco para ficar abaixo.',leg:'Coberto à justa (menos de 5\u00a0% acima)'}};
  function vyEtat(r){var API=root.VerdictPerformanceIntegrated,st=API&&typeof API.ratioStatus==='function'?API.ratioStatus(r):(r>=1?'green':r>=.95?'yellow':r>=.9?'orange':'red');return st==='green'?(vyNum(r)&&Math.round(r*1e9)/1e9<1.05?'juste':'vert'):st==='yellow'?'jaune':st==='orange'?'orange':st==='red'?'rouge':'info';}
  var VY_COL={vert:'#22c55e',juste:'#0ea5e9',jaune:'#eab308',orange:'#f97316',rouge:'#ef4444',info:'#8A93A0'};
  function vyPos(r){var p=[[.6,0],[.9,25],[.95,50],[1,75],[1.3,100]];if(!vyNum(r)||r<=p[0][0])return 0;if(r>=p[p.length-1][0])return 100;for(var i=1;i<p.length;i++){if(r<=p[i][0]){var a=p[i-1],b=p[i];return a[1]+(r-a[0])/(b[0]-a[0])*(b[1]-a[1]);}}return 100;}
  /* Courbe des mois : chaque barre = ratio du mois face à SON minimum (100 % = minimum couvert). */
  function vyChart(a,C){
    var W=340,H=146,L=46,R=14,T=14,B=24,slot=(W-L-R)/12,bw=Math.min(16,slot*.62),i,m,rs=[];
    for(i=0;i<12;i++){m=a.months[i];if(m.kind!=='off'&&m.target>0)rs.push(m.value/m.target);}
    var lo=Math.min.apply(null,rs.concat([1])),hi=Math.max.apply(null,rs.concat([1]));
    var ymin=0,ymax=Math.max(1.4,Math.ceil((hi+.02)*5)/5),step=(ymax-ymin)>1.6?.4:.2;
    var y=function(r){return T+(ymax-Math.min(Math.max(r,ymin),ymax))/(ymax-ymin)*(H-T-B);},xb=function(k){return L+slot*k+(slot-bw)/2;};
    var s='<defs><pattern id="vyHach" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,.16)" stroke-width="2"/></pattern></defs>';
    for(var v=ymin;v<=ymax+.001;v+=step){var rv=Math.round(v*100)/100;s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(rv).toFixed(1)+'" y2="'+y(rv).toFixed(1)+'" class="gl'+(Math.abs(rv-1)<.001?' obj':'')+'"/><text x="'+(L-6)+'" y="'+(y(rv)+3.5).toFixed(1)+'" text-anchor="end" class="ax">'+Math.round(rv*100)+VY_NB+'%</text>';}
    for(i=0;i<12;i++){
      m=a.months[i];var x=xb(i),lab=C.m[i]||'',base=H-B;
      if(m.kind==='off'||!(m.target>0)){s+='<rect x="'+x.toFixed(1)+'" y="'+T+'" width="'+bw.toFixed(1)+'" height="'+(H-T-B)+'" rx="2" fill="url(#vyHach)"><title>'+vyEsc(vyMonthName(i))+'</title></rect>';}
      else{
        var r=m.value/m.target,col=VY_COL[vyEtat(r)],yy=y(r),h=Math.max(1.5,base-yy);
        if(m.kind==='past'){s+='<rect x="'+x.toFixed(1)+'" y="'+yy.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="3" fill="'+col+'"><title>'+vyEsc(vyMonthName(i)+' · '+vyPct(r))+'</title></rect>';}
        else{
          s+='<rect x="'+x.toFixed(1)+'" y="'+yy.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="3" fill="'+col+'" fill-opacity=".2" stroke="'+col+'" stroke-width="1.2" stroke-dasharray="3 2"><title>'+vyEsc(vyMonthName(i)+' · '+vyPct(r))+'</title></rect>';
          if(m.kind==='current'&&m.actual>0){var ra=m.actual/m.target,ya=y(ra),ha=Math.max(1.5,base-ya);s+='<rect x="'+x.toFixed(1)+'" y="'+ya.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+ha.toFixed(1)+'" rx="3" fill="'+col+'"/>';}
        }
      }
      s+='<text x="'+(x+bw/2).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" class="ax'+(i===a.currentIndex?' vy-current-month':'')+'">'+vyEsc(lab)+'</text>';
      s+='<rect class="vy-hit" data-vy-m="'+i+'" x="'+(L+slot*i).toFixed(1)+'" y="1.5" width="'+slot.toFixed(1)+'" height="'+(H-3)+'" fill="transparent" tabindex="0" role="button" aria-label="'+vyEsc(vyMonthName(i))+'" style="cursor:pointer"/>';
    }
    return s;
  }
  var vyPriorCache={key:null,priors:null};
  /* Clé de cache : l'historique des années passées ne change que si les données ou le calendrier changent. */
  function vyPriorKey(year,caps){var d=root.DB||{},rows=d.histJour||[],n=0,s=0,i;
    for(i=0;i<rows.length;i++){var r=rows[i];if(!r||String(r.date)>=String(year))continue;n++;var v=typeof r.caJ==='number'?r.caJ:(typeof r.ca==='number'?r.ca:0);s+=v;}
    var cl=d.performanceClosures?Object.keys(d.performanceClosures).length:0;
    var cal='';try{cal=JSON.stringify([d.fermes||[],d.operatingClosures||[],d.moisPilotage||{},d.fermesJours||[],d.ouvertsJours||[]]);}catch(e){}
    return [d.establishmentId||d.etab||'',year,n,Math.round(s*100),cl,(d.fermesJours||[]).length,(d.ouvertsJours||[]).length,caps.join(','),cal].join('|');}
  /* C204 : une année passée se juge sur SON calendrier (les mois changent d'un dimanche d'une année à l'autre).
     Plan de cette année-là sans ancre ni historique : seul le nombre de jours ouverts par mois est lu, aucune écriture. */
  function vyYearCaps(R,API,y){var out=[],i,p=null;y=String(y);
    try{p=API.createSeasonPlan(R,y,1,{accountingAnchor:{},evidence:{years:[],count:0,profile:[0,0,0,0,0,0,0,0,0,0,0,0]}});}catch(e){p=null;}
    for(i=0;i<12;i++)out.push(Number(p&&p.openDayCapacity&&p.openDayCapacity[y+'-'+('0'+(i+1)).slice(-2)])||0);return out;}
  /* C204 : document comptable (FEC) de l'exercice clos. Chiffre d'affaires HT de chaque mois, ramené en TTC avec la TVA
     moyenne de la structure. Il sert d'année précédente et de forme de saison quand l'historique journalier manque ;
     un mois déjà complet en caisse garde toujours son chiffre de caisse. Aucun mois n'est inventé. */
  function vyFecMonths(tva){var f=root.DB&&root.DB.fecImport,m=f&&f.monthly,out={},n=0;if(!m||typeof m!=='object')return null;var t=Number(tva);if(!vyNum(t)||t<0)t=0;if(t>1)t=t/100;
    Object.keys(m).forEach(function(k){if(!/^\d{4}-\d{2}$/.test(k))return;var v=Number(m[k]&&m[k].revenue);if(vyNum(v)&&v>0){out[k]=Math.round(v*(1+t)*100)/100;n++;}});
    return n?{months:out,year:String(f.period&&f.period.year||''),hash:String(f.hash||f.appliedAt||''),tva:t}:null;}
  function vyFecYear(fec,y){var a=[],i;for(i=0;i<12;i++){var v=fec&&fec.months[String(y)+'-'+('0'+(i+1)).slice(-2)];a.push(vyNum(v)?v:null);}return {values:a};}
  /* Les 12 derniers mois consécutifs du document (exercice décalé compris), rangés par mois du calendrier. */
  function vyFecReference(fec){if(!fec)return null;var keys=Object.keys(fec.months).sort().slice(-12);if(keys.length!==12)return null;
    for(var i=1;i<12;i++){var a=keys[i-1],y=Number(a.slice(0,4)),mo=Number(a.slice(5,7))+1;if(mo>12){mo=1;y++;}if(keys[i]!==y+'-'+('0'+mo).slice(-2))return null;}
    var v=[];for(i=0;i<12;i++)v.push(null);keys.forEach(function(k){v[Number(k.slice(5,7))-1]=fec.months[k];});return {values:v,year:fec.year||keys[11].slice(0,4)};}
  var VY_FEC={fr:{rCk:'Votre document comptable {y} mois par mois, 100 % = minimum du mois',rSous:'D’après votre document comptable {y} : {ca} de chiffre d’affaires TTC pour {min} de minimum annuel, soit {pct}. La projection réelle s’affichera après 2 mois complets de suivi ({n} sur 2).',rCl:'Chaque barre : le chiffre du mois dans votre document comptable {y} (HT ramené en TTC avec votre TVA moyenne), face au minimum du mois. Hachuré : mois fermé.',refTxt:'Chiffre de ce mois dans votre document comptable {y}, ramené en TTC avec votre TVA moyenne : ce n’est pas un réalisé de cette année.',tdRef:'Document comptable {y}',n1Doc:' Les mois de {y} viennent de votre document comptable (HT ramené en TTC avec votre TVA moyenne).',shDoc:'Saisonnalité reprise de votre document comptable {y} : chaque mois restant suit sa forme.',shMix:'Saisonnalité reprise de {n} année(s) : votre historique de caisse et votre document comptable {y}.'},
    en:{rCk:'Your {y} accounting file month by month, 100% = month minimum',rSous:'From your {y} accounting file: {ca} of revenue incl. VAT for an annual minimum of {min}, i.e. {pct}. The real projection appears after 2 full months of tracking ({n} of 2).',rCl:'Each bar: the month’s figure in your {y} accounting file (net amount converted at your average VAT rate), against the month minimum. Hatched: closed month.',refTxt:'This month’s figure in your {y} accounting file, converted at your average VAT rate: not an actual for this year.',tdRef:'Accounting file {y}',n1Doc:' The {y} months come from your accounting file (net amounts converted at your average VAT rate).',shDoc:'Seasonality taken from your {y} accounting file: each remaining month follows its shape.',shMix:'Seasonality taken from {n} year(s): your till history and your {y} accounting file.'},
    es:{rCk:'Su documento contable {y} mes a mes, 100 % = mínimo del mes',rSous:'Según su documento contable {y}: {ca} de facturación con IVA para un mínimo anual de {min}, es decir {pct}. La proyección real aparecerá tras 2 meses completos de seguimiento ({n} de 2).',rCl:'Cada barra: la cifra del mes en su documento contable {y} (sin IVA convertida con su IVA medio), frente al mínimo del mes. Rayado: mes cerrado.',refTxt:'Cifra de este mes en su documento contable {y}, convertida con su IVA medio: no es un dato real de este año.',tdRef:'Documento contable {y}',n1Doc:' Los meses de {y} proceden de su documento contable (sin IVA convertidos con su IVA medio).',shDoc:'Estacionalidad tomada de su documento contable {y}: cada mes restante sigue su forma.',shMix:'Estacionalidad tomada de {n} año(s): su historial de caja y su documento contable {y}.'},
    it:{rCk:'Il suo documento contabile {y} mese per mese, 100 % = minimo del mese',rSous:'Dal suo documento contabile {y}: {ca} di fatturato IVA inclusa per un minimo annuale di {min}, cioè {pct}. La proiezione reale apparirà dopo 2 mesi completi di monitoraggio ({n} su 2).',rCl:'Ogni barra: il dato del mese nel suo documento contabile {y} (netto convertito con la sua IVA media), rispetto al minimo del mese. Tratteggio: mese chiuso.',refTxt:'Dato di questo mese nel suo documento contabile {y}, convertito con la sua IVA media: non è un dato reale di quest’anno.',tdRef:'Documento contabile {y}',n1Doc:' I mesi del {y} provengono dal suo documento contabile (netto convertito con la sua IVA media).',shDoc:'Stagionalità ripresa dal suo documento contabile {y}: ogni mese restante ne segue la forma.',shMix:'Stagionalità ripresa da {n} anno/i: lo storico di cassa e il documento contabile {y}.'},
    de:{rCk:'Ihre Buchhaltungsdatei {y} Monat für Monat, 100 % = Monatsminimum',rSous:'Laut Ihrer Buchhaltungsdatei {y}: {ca} Umsatz brutto bei einem Jahresminimum von {min}, also {pct}. Die echte Prognose erscheint nach 2 vollständigen Monaten ({n} von 2).',rCl:'Jeder Balken: der Monatswert aus Ihrer Buchhaltungsdatei {y} (netto, mit Ihrem durchschnittlichen MwSt.-Satz umgerechnet) gegenüber dem Monatsminimum. Schraffiert: geschlossener Monat.',refTxt:'Wert dieses Monats aus Ihrer Buchhaltungsdatei {y}, mit Ihrem durchschnittlichen MwSt.-Satz umgerechnet: kein Ist-Wert dieses Jahres.',tdRef:'Buchhaltungsdatei {y}',n1Doc:' Die Monate {y} stammen aus Ihrer Buchhaltungsdatei (netto, mit Ihrem durchschnittlichen MwSt.-Satz umgerechnet).',shDoc:'Saisonverlauf aus Ihrer Buchhaltungsdatei {y}: jeder verbleibende Monat folgt diesem Verlauf.',shMix:'Saisonverlauf aus {n} Jahr(en): Ihre Kassendaten und Ihre Buchhaltungsdatei {y}.'},
    nl:{rCk:'Uw boekhoudbestand {y} maand per maand, 100 % = maandminimum',rSous:'Volgens uw boekhoudbestand {y}: {ca} omzet incl. btw voor een jaarminimum van {min}, dus {pct}. De echte prognose verschijnt na 2 volledige maanden ({n} van 2).',rCl:'Elke balk: het maandcijfer uit uw boekhoudbestand {y} (netto omgerekend met uw gemiddelde btw), tegenover het maandminimum. Gearceerd: gesloten maand.',refTxt:'Cijfer van deze maand uit uw boekhoudbestand {y}, omgerekend met uw gemiddelde btw: geen werkelijk cijfer van dit jaar.',tdRef:'Boekhoudbestand {y}',n1Doc:' De maanden van {y} komen uit uw boekhoudbestand (netto omgerekend met uw gemiddelde btw).',shDoc:'Seizoenspatroon uit uw boekhoudbestand {y}: elke resterende maand volgt dat verloop.',shMix:'Seizoenspatroon uit {n} jaar: uw kassahistoriek en uw boekhoudbestand {y}.'},
    pt:{rCk:'O seu documento contabilístico {y} mês a mês, 100 % = mínimo do mês',rSous:'Segundo o seu documento contabilístico {y}: {ca} de faturação com IVA para um mínimo anual de {min}, ou seja {pct}. A projeção real aparecerá após 2 meses completos de acompanhamento ({n} de 2).',rCl:'Cada barra: o valor do mês no seu documento contabilístico {y} (sem IVA convertido com o seu IVA médio), face ao mínimo do mês. Tracejado: mês fechado.',refTxt:'Valor deste mês no seu documento contabilístico {y}, convertido com o seu IVA médio: não é um realizado deste ano.',tdRef:'Documento contabilístico {y}',n1Doc:' Os meses de {y} vêm do seu documento contabilístico (sem IVA convertidos com o seu IVA médio).',shDoc:'Sazonalidade retirada do seu documento contabilístico {y}: cada mês restante segue a sua forma.',shMix:'Sazonalidade retirada de {n} ano(s): o histórico de caixa e o documento contabilístico {y}.'}};
  /* C204 (V18) : « Comment c'est calculé » décrit la méthode réellement utilisée. */
  var VY_HOW={fr:'Les mois passés sont vos chiffres réels. Chaque mois restant reprend le même mois de l’an dernier, multiplié par votre évolution à date : vos mois complets de cette année comparés aux mêmes mois de l’an dernier. Le mois en cours reprend l’estimation de l’onglet Mois. La fin d’année est la somme des 12 mois. Le résultat = chiffre d’affaires HT × taux de marge sur coûts variables − charges fixes de la période. Une projection reste une estimation.',
    en:'Past months are your actual figures. Each remaining month repeats the same month last year, multiplied by your change to date: your complete months this year compared with the same months last year. The current month uses the Month tab estimate. Year-end is the sum of the 12 months. Result = revenue excl. VAT × contribution margin rate − fixed costs of the period. A projection remains an estimate.',
    es:'Los meses pasados son sus cifras reales. Cada mes restante repite el mismo mes del año pasado, multiplicado por su evolución a la fecha: sus meses completos de este año frente a los mismos meses del año pasado. El mes en curso usa la estimación de la pestaña Mes. El cierre del año es la suma de los 12 meses. Resultado = ingresos sin IVA × tasa de margen sobre costes variables − costes fijos del periodo. Una proyección sigue siendo una estimación.',
    it:'I mesi passati sono i suoi dati reali. Ogni mese restante riprende lo stesso mese dell’anno scorso, moltiplicato per l’evoluzione a oggi: i mesi completi di quest’anno confrontati con gli stessi mesi dell’anno scorso. Il mese in corso usa la stima della scheda Mese. La fine anno è la somma dei 12 mesi. Risultato = ricavi IVA esclusa × tasso di margine sui costi variabili − costi fissi del periodo. Una proiezione resta una stima.',
    de:'Vergangene Monate sind Ihre Ist-Zahlen. Jeder restliche Monat übernimmt denselben Monat des Vorjahres, multipliziert mit Ihrer bisherigen Entwicklung: Ihre vollständigen Monate dieses Jahres im Vergleich zu denselben Monaten des Vorjahres. Der laufende Monat übernimmt die Schätzung des Reiters Monat. Das Jahresende ist die Summe der 12 Monate. Ergebnis = Umsatz netto × Deckungsbeitragsquote − Fixkosten des Zeitraums. Eine Prognose bleibt eine Schätzung.',
    nl:'Afgelopen maanden zijn uw werkelijke cijfers. Elke resterende maand herhaalt dezelfde maand van vorig jaar, vermenigvuldigd met uw evolutie tot nu: uw volledige maanden van dit jaar vergeleken met dezelfde maanden van vorig jaar. De lopende maand gebruikt de schatting van het tabblad Maand. Het jaareinde is de som van de 12 maanden. Resultaat = omzet excl. btw × dekkingsbijdrage − vaste kosten van de periode. Een prognose blijft een schatting.',
    pt:'Os meses passados são os seus valores reais. Cada mês restante repete o mesmo mês do ano passado, multiplicado pela sua evolução até à data: os meses completos deste ano face aos mesmos meses do ano passado. O mês em curso usa a estimativa do separador Mês. O fim do ano é a soma dos 12 meses. Resultado = receita sem IVA × taxa de margem sobre custos variáveis − custos fixos do período. Uma projeção continua a ser uma estimativa.'};
  /* C204 (R1 Reco A, R2 n° 1, prouvé par contrôle a posteriori sur la démo : erreur mensuelle 2,83 % → 1,57 %,
     erreur sur l'année 0,91 % → 0,72 %) : un mois se compare à l'an dernier à calendrier égal. Chaque jour ouvert pèse le
     poids de son jour de semaine (CA moyen de ce jour ÷ CA moyen d'un jour ouvert, sur les 12 mois avant le mois en cours ;
     moins de 8 semaines d'historique : chaque jour ouvert pèse 1). Rapport du mois = jours pondérés cette année ÷ jours
     pondérés l'an dernier. Mois passés : jours réellement saisis ; mois à venir et année sans caisse : calendrier d'ouverture. */
  /* C213 (D18, décision de Steven du 21/10) : la fourchette de l'année n'est affichée que si un contrôle a posteriori la
     valide sur les années passées de l'établissement (R1 : fourchette empirique, Lee & Scholtes 2014 ; validation
     glissante, Hyndman & Athanasopoulos §5.10). Méthode rejouée = celle de l'écran (même mois N-1 × évolution à date,
     corrigé du calendrier). Pour chaque année passée Y dont Y-1 est connue, et chaque fin de mois k (2 à 11), Verdict
     refait la projection avec les seuls mois connus à cette date, puis compare à la vraie année. L'erreur est rapportée à
     la part encore projetée (u = (projeté − réel) ÷ reste projeté), ce qui rend comparables les débuts et fins d'année.
     Fourchette à 80 % = quantiles 10 % et 90 % de u. Validée seulement avec au moins 20 cas sur 3 années et une couverture,
     année par année laissée de côté, entre 70 % et 95 %. Sinon : « non validée », et la raison est dite. */
  var vyBtCache={key:null,res:null};
  function vyQuant(s,q){if(!s.length)return null;var p=(s.length-1)*q,a=Math.floor(p),b=Math.ceil(p);return s[a]+(s[b]-s[a])*(p-a);}
  function vyBacktest(inp){
    var API=root.VerdictPerformanceIntegrated;if(!API||typeof API.knownYearMonths!=='function'||!inp)return null;
    var Y=Number(inp.year),d=root.DB||{},rows=d.histJour||[],last=rows.length?rows[rows.length-1]:null,key=[Y,inp.currentIndex,rows.length,last?last.date+':'+last.caJ:'',(d.fecImport&&(d.fecImport.hash||d.fecImport.appliedAt))||'',Object.keys(d.performanceClosures||{}).length,JSON.stringify([d.fermes||[],d.operatingClosures||[],d.moisPilotage||{}])].join('|');
    if(vyBtCache.key===key)return vyBtCache.res;
    var years={},cases=[],y,i;
    for(y=Y-1;y>=Y-7;y--){var m=null;try{m=API.knownYearMonths(y);}catch(e){m=null;}if(m)years[y]=m;}
    Object.keys(years).forEach(function(ys){var yy=Number(ys),A=years[yy],P=years[yy-1];if(!P)return;var tot=A.reduce(function(s,v){return s+v;},0);if(!(tot>0))return;
      for(var k=2;k<=11;k++){var cr=null;try{cr=vyCalendarRatios(String(yy),String(yy-1),k);}catch(e){cr=null;}var crOf=function(j){var c=cr&&Number(cr[j]);return vyNum(c)&&c>0?c:1;},num=0,den=0;
        for(i=0;i<k;i++)if(A[i]>0&&P[i]>0){num+=A[i];den+=P[i]*crOf(i);}if(!(den>0))continue;
        var g=num/den,done=0,pr=0;for(i=0;i<k;i++)done+=A[i];pr=done;for(i=k;i<12;i++)pr+=P[i]>0?g*P[i]*crOf(i):0;var rem=pr-done;if(!(rem>0))continue;
        cases.push({y:yy,k:k,u:(pr-tot)/rem,e:(pr-tot)/tot});}});
    var ys=[];cases.forEach(function(c){if(ys.indexOf(c.y)<0)ys.push(c.y);});ys.sort();
    var res={cases:cases.length,years:ys.slice(),validated:false,reason:null,coverage:null,q10:null,q90:null,meanErr:null,origin:null};
    if(cases.length<20||ys.length<3){res.reason='years';vyBtCache={key:key,res:res};return res;}
    var all=cases.map(function(c){return c.u;}).sort(function(a,b){return a-b;});res.q10=vyQuant(all,.1);res.q90=vyQuant(all,.9);
    var inside=0;ys.forEach(function(yy){var o=cases.filter(function(c){return c.y!==yy;}).map(function(c){return c.u;}).sort(function(a,b){return a-b;}),lo=vyQuant(o,.1),hi=vyQuant(o,.9);cases.forEach(function(c){if(c.y===yy&&c.u>=lo&&c.u<=hi)inside++;});});
    res.coverage=inside/cases.length;var k0=Math.max(2,Math.min(11,Number(inp.currentIndex)||2)),same=cases.filter(function(c){return c.k===k0;});res.origin=k0;
    res.meanErr=same.length?same.reduce(function(s,c){return s+Math.abs(c.e);},0)/same.length:null;
    res.validated=res.coverage>=.80&&res.coverage<=.95; /* C264 (N12) : au moins 8 fois sur 10, comme la fourchette 10 %–90 % le prétend */if(!res.validated)res.reason='coverage';
    vyBtCache={key:key,res:res};return res;
  }
  var VY_BT={fr:{chip:'fourchette vérifiée',ok:'Fourchette : de {lo} à {hi}. Vérifiée sur vos années {y0} à {y1} : Verdict a refait sa projection à chaque fin de mois avec les seuls chiffres connus ce jour-là (même mois de l’an dernier × votre évolution, corrigé du calendrier) ; la vraie année est tombée dans la fourchette {c} fois sur 10.{e}',e:' À fin {m}, la projection se trompait en moyenne de {p}.',no:'À prendre avec prudence : {r}',rYears:'pour vérifier cette estimation sur votre passé, il faut au moins 3 années complètes, chacune avec son année d’avant (vous en avez {n}). Verdict ne vous promet aucun résultat.',rCov:'sur vos années {y0} à {y1}, cette estimation ne serait tombée juste que {c} fois sur 10. La fourchette n’est donc pas affichée.'},
    en:{chip:'range checked',ok:'Range: from {lo} to {hi}. Checked on your years {y0} to {y1}: Verdict redid its projection at each month-end with only the figures known that day (same month last year × your growth, calendar-adjusted); the real year fell within the range {c} times in 10.{e}',e:' At the end of {m}, the projection was off by {p} on average.',no:'To take with caution: {r}',rYears:'checking this estimate on your past needs at least 3 complete years, each with the year before (here: {n}). Verdict promises no result.',rCov:'on your years {y0} to {y1}, this estimate would have been right only {c} times in 10. The range is therefore not shown.'},
    es:{chip:'horquilla verificada',ok:'Horquilla: de {lo} a {hi}. Verificada en sus años {y0} a {y1}: Verdict rehízo su proyección a cada fin de mes solo con las cifras conocidas ese día (mismo mes del año pasado × su evolución, corregido del calendario); el año real cayó en la horquilla {c} veces de 10.{e}',e:' A finales de {m}, la proyección se equivocaba de media un {p}.',no:'Con prudencia: {r}',rYears:'para verificar esta estimación con su pasado hacen falta al menos 3 años completos, cada uno con su año anterior (aquí: {n}). Verdict no le promete ningún resultado.',rCov:'en sus años {y0} a {y1}, esta estimación solo habría acertado {c} veces de 10. Por eso no se muestra la horquilla.'},
    it:{chip:'forbice verificata',ok:'Forbice: da {lo} a {hi}. Verificata sui suoi anni dal {y0} al {y1}: Verdict ha rifatto la proiezione a ogni fine mese con i soli dati noti quel giorno (stesso mese dell’anno scorso × la sua evoluzione, corretto per il calendario); l’anno reale è caduto nella forbice {c} volte su 10.{e}',e:' A fine {m}, la proiezione sbagliava in media del {p}.',no:'Da prendere con prudenza: {r}',rYears:'per verificare questa stima sul suo passato servono almeno 3 anni completi, ciascuno con l’anno precedente (qui: {n}). Verdict non le promette nessun risultato.',rCov:'sui suoi anni dal {y0} al {y1}, questa stima avrebbe colto nel segno solo {c} volte su 10. Per questo la forbice non è mostrata.'},
    de:{chip:'Spanne geprüft',ok:'Spanne: von {lo} bis {hi}. Geprüft an Ihren Jahren {y0} bis {y1}: Verdict hat die Prognose an jedem Monatsende nur mit den an diesem Tag bekannten Zahlen neu erstellt (gleicher Monat des Vorjahres × Ihre Entwicklung, kalenderbereinigt); das tatsächliche Jahr lag {c} von 10 Mal in der Spanne.{e}',e:' Ende {m} lag die Prognose im Mittel um {p} daneben.',no:'Mit Vorsicht zu lesen: {r}',rYears:'um diese Schätzung an Ihrer Vergangenheit zu prüfen, braucht es mindestens 3 vollständige Jahre, jedes mit seinem Vorjahr (hier: {n}). Verdict verspricht Ihnen kein Ergebnis.',rCov:'an Ihren Jahren {y0} bis {y1} hätte diese Schätzung nur {c} von 10 Mal gestimmt. Die Spanne wird daher nicht angezeigt.'},
    nl:{chip:'marge gecontroleerd',ok:'Marge: van {lo} tot {hi}. Gecontroleerd op uw jaren {y0} tot {y1}: Verdict maakte zijn prognose opnieuw aan elk maandeinde met alleen de cijfers die die dag bekend waren (zelfde maand vorig jaar × uw groei, gecorrigeerd voor de kalender); het echte jaar viel {c} van de 10 keer binnen de marge.{e}',e:' Eind {m} zat de prognose gemiddeld {p} ernaast.',no:'Met voorzichtigheid te lezen: {r}',rYears:'om deze schatting op uw verleden te controleren zijn minstens 3 volledige jaren nodig, elk met het jaar ervoor (hier: {n}). Verdict belooft u geen resultaat.',rCov:'op uw jaren {y0} tot {y1} zou deze schatting maar {c} van de 10 keer kloppen. De marge wordt daarom niet getoond.'},
    pt:{chip:'intervalo verificado',ok:'Intervalo: de {lo} a {hi}. Verificado nos seus anos de {y0} a {y1}: o Verdict refez a projeção em cada fim de mês só com os números conhecidos nesse dia (mesmo mês do ano passado × a sua evolução, corrigido do calendário); o ano real ficou dentro do intervalo {c} vezes em 10.{e}',e:' No fim de {m}, a projeção errava em média {p}.',no:'A ler com prudência: {r}',rYears:'para verificar esta estimativa no seu passado são precisos pelo menos 3 anos completos, cada um com o ano anterior (aqui: {n}). O Verdict não lhe promete nenhum resultado.',rCov:'nos seus anos de {y0} a {y1}, esta estimativa só teria acertado {c} vezes em 10. Por isso o intervalo não é mostrado.'}};
  function vyBtText(a){var T=VY_BT[vyLoc()]||VY_BT.fr,b=a&&a.backtest;if(!b)return null;var y0=b.years.length?b.years[0]:'',y1=b.years.length?b.years[b.years.length-1]:'';
    if(b.validated&&vyNum(a.projectionLow)&&vyNum(a.projectionHigh))return vyFill(T.ok,{lo:vyEur(a.projectionLow),hi:vyEur(a.projectionHigh),y0:y0,y1:y1,c:Math.floor(b.coverage*10+1e-9),e:vyNum(b.meanErr)?vyFill(T.e,{m:vyMonthName(b.origin-1),p:(Math.round(b.meanErr*1000)/10).toLocaleString(vyTag(),{maximumFractionDigits:1})+' %'}):''});
    return vyFill(T.no,{r:b.reason==='coverage'?vyFill(T.rCov,{y0:y0,y1:y1,c:Math.floor((b.coverage||0)*10+1e-9)}):vyFill(T.rYears,{n:b.years.length})})+(b.reason==='coverage'&&vyNum(b.meanErr)?vyFill(T.e,{m:vyMonthName(b.origin-1),p:(Math.round(b.meanErr*1000)/10).toLocaleString(vyTag(),{maximumFractionDigits:1})+'\u00a0%'}):'');}
  /* C213 (W13) : une période de gestion en cours (« J'ai ouvert récemment ») n'est pas un exercice. Le moteur l'annualise pour
     la structure, mais la carte Année ne la présente jamais comme un « exercice de référence » de 12 mois : elle dit la
     période réellement observée, et la projection attend 2 mois complets suivis. */
  function vyPartialRef(){var s=root.DB&&root.DB.refSource;return !!(s&&s.nature==='current-management-period');}
  var VY_PART={fr:' Période observée du {a} au {b} : {ca} HT. Verdict n’en tire aucune année fictive : aucun exercice de 12 mois n’est extrapolé.',
    en:' Period observed from {a} to {b}: {ca} excl. VAT. Verdict draws no fictitious year from it: no 12-month year is extrapolated.',
    es:' Periodo observado del {a} al {b}: {ca} sin IVA. Verdict no saca de él ningún año ficticio: no se extrapola ningún ejercicio de 12 meses.',
    it:' Periodo osservato dal {a} al {b}: {ca} IVA esclusa. Verdict non ne ricava alcun anno fittizio: nessun esercizio di 12 mesi è estrapolato.',
    de:' Beobachteter Zeitraum vom {a} bis {b}: {ca} netto. Verdict leitet daraus kein fiktives Jahr ab: kein 12-Monats-Geschäftsjahr wird hochgerechnet.',
    nl:' Waargenomen periode van {a} tot {b}: {ca} excl. btw. Verdict maakt er geen fictief jaar van: er wordt geen boekjaar van 12 maanden geëxtrapoleerd.',
    pt:' Período observado de {a} a {b}: {ca} sem IVA. O Verdict não tira daí nenhum ano fictício: nenhum exercício de 12 meses é extrapolado.'};
  function vyPartialLine(){try{if(!vyPartialRef())return '';var s=root.DB.refSource,raw=root.DB.recent&&root.DB.recent.raw||{},f=function(k){var p=String(k||'').split('-');return p.length===3?new Intl.DateTimeFormat(vyTag(),{day:'numeric',month:'long',year:'numeric'}).format(new Date(+p[0],+p[1]-1,+p[2],12)):'';};
    return vyFill(VY_PART[vyLoc()]||VY_PART.fr,{a:f(s.start),b:f(s.end),ca:vyEur(Number(raw.ca)||0)});}catch(e){return '';}}
  /* C213 (W22) : quand l'exercice comptable ne finit pas en décembre (clôture lue dans le FEC), la carte Année dit aussi
     l'exercice en cours, mois par mois avec la même méthode : mois passés réels, mois de l'année civile en cours tels que
     projetés ci-dessus, mois de l'an prochain = même mois de cette année × la même évolution. Minimums : ceux du plan de
     l'année (un mois de l'an prochain reprend le minimum du même mois). Rien n'est inventé au-delà. */
  var VY_EX={fr:'Votre exercice comptable se clôt fin {c}. Exercice en cours ({a} → {b}) : fin estimée {p} pour {m} de minimum, soit {r}, avec la même méthode et les mêmes minimums que l’année civile.',
    en:'Your financial year closes at the end of {c}. Current financial year ({a} → {b}): estimated end {p} for a minimum of {m}, i.e. {r}, with the same method and minimums as the calendar year.',
    es:'Su ejercicio contable cierra a finales de {c}. Ejercicio en curso ({a} → {b}): cierre estimado {p} para {m} de mínimo, es decir {r}, con el mismo método y los mismos mínimos que el año natural.',
    it:'Il suo esercizio contabile chiude a fine {c}. Esercizio in corso ({a} → {b}): fine stimata {p} per {m} di minimo, cioè {r}, con lo stesso metodo e gli stessi minimi dell’anno solare.',
    de:'Ihr Geschäftsjahr endet Ende {c}. Laufendes Geschäftsjahr ({a} → {b}): geschätztes Ende {p} bei {m} Minimum, also {r}, mit derselben Methode und denselben Minimums wie das Kalenderjahr.',
    nl:'Uw boekjaar sluit eind {c}. Lopend boekjaar ({a} → {b}): geschat einde {p} voor {m} minimum, dus {r}, met dezelfde methode en minimums als het kalenderjaar.',
    pt:'O seu exercício contabilístico fecha no fim de {c}. Exercício em curso ({a} → {b}): fim estimado {p} para {m} de mínimo, ou seja {r}, com o mesmo método e os mesmos mínimos do ano civil.'};
  function vyExerciceLine(a){try{
    var f=root.DB&&root.DB.fecImport,end=String(f&&f.period&&f.period.end||''),cs=root.DB&&(root.DB.ref&&root.DB.ref.closingMonth||root.DB.refSource&&root.DB.refSource.closingMonth),cm=/^\d{4}-\d{2}-\d{2}$/.test(end)?Number(end.slice(5,7)):Number(cs);if(!(cm>=1&&cm<=12))return '';if(cm===12||!a||!a.months||a.months.length!==12)return '';
    var inp=vyLastInput||{},Y=Number(inp.year),ci=Number(a.currentIndex),startY=ci+1>cm?Y:Y-1,g=vyNum(a.growth)?a.growth:vyNum(a.pace)?a.pace:null,yp=root.DB.performanceYearPlans||{},cur=yp[String(Y)]||{},full=cur.fullMonthlyTargets||cur.monthlyTargets||{},P=0,M=0,ok=true,k,mm,yy;
    var jour=function(y,m){var s=0,n=0;(root.DB.histJour||[]).forEach(function(r){var d=String(r&&r.date||'');if(d.slice(0,7)===y+'-'+('0'+m).slice(-2)&&typeof r.caJ==='number'){s+=r.caJ;n++;}});return n?s:null;};
    for(k=0;k<12;k++){mm=(cm+k)%12+1;yy=startY+((cm+k)>=12?1:0);var key=('0'+mm).slice(-2),v=null,t=null;
      if(yy===Y){v=a.months[mm-1].value;t=a.months[mm-1].target;}
      else if(yy<Y){v=jour(yy,mm);var py=yp[String(yy)];t=py&&py.monthlyTargets&&Number(py.monthlyTargets[yy+'-'+key])>0?Number(py.monthlyTargets[yy+'-'+key]):Number(full[Y+'-'+key])||0;}
      else{var base=a.months[mm-1];v=base&&base.kind==='past'&&vyNum(base.value)&&g!=null?base.value*g:null;t=Number(full[Y+'-'+key])||0;}
      if(!vyNum(v)){ok=false;break;}P+=v;M+=t;}
    if(!ok||!(M>0))return '';
    var mn=function(y,m){try{return new Intl.DateTimeFormat(vyTag(),{month:'long',year:'numeric'}).format(new Date(y,m-1,1,12));}catch(e){return m+'/'+y;}};
    return vyFill(VY_EX[vyLoc()]||VY_EX.fr,{c:vyMonthName(cm-1),a:mn(startY,cm%12+1),b:mn(startY+1,cm),p:vyEur(P),m:vyEur(M),r:vyPct(P/M)});}catch(e){return '';}}
  /* C240 (Y12) : projection sans saison (pas d'année passée) — l'écart possible est dit avec les mois déjà suivis : la fin
     d'année si les mois restants ressemblaient au plus faible, ou au plus fort, d'entre eux. Ce sont deux cas lus dans vos
     chiffres, pas une fourchette de probabilité (décision D18 : aucune fourchette non validée). */
  var VY_SPREAD={fr:'Vos mois suivis vont de {lo} à {hi} de leur minimum. Si les mois restants ressemblaient à votre mois le plus faible, l’année finirait vers {flo} ; à votre mois le plus fort, vers {fhi}. Ce ne sont pas des probabilités : sans année passée, l’erreur de la projection ne peut pas être mesurée.',
    en:'Your tracked months range from {lo} to {hi} of their minimum. If the remaining months were like your weakest month, the year would end around {flo}; like your strongest, around {fhi}. These are not probabilities: without a past year, the projection error cannot be measured.',
    es:'Sus meses seguidos van del {lo} al {hi} de su mínimo. Si los meses restantes se parecieran a su mes más flojo, el año terminaría hacia {flo}; a su mes más fuerte, hacia {fhi}. No son probabilidades: sin un año pasado, el error de la proyección no se puede medir.',
    it:'I suoi mesi seguiti vanno dal {lo} al {hi} del loro minimo. Se i mesi restanti somigliassero al mese più debole, l’anno finirebbe verso {flo}; al più forte, verso {fhi}. Non sono probabilità: senza un anno passato, l’errore della proiezione non si può misurare.',
    de:'Ihre erfassten Monate liegen zwischen {lo} und {hi} ihres Minimums. Wären die restlichen Monate wie Ihr schwächster Monat, endete das Jahr bei etwa {flo}; wie Ihr stärkster, bei etwa {fhi}. Das sind keine Wahrscheinlichkeiten: ohne Vorjahr lässt sich der Fehler der Prognose nicht messen.',
    nl:'Uw gevolgde maanden liggen tussen {lo} en {hi} van hun minimum. Als de resterende maanden op uw zwakste maand leken, eindigde het jaar rond {flo}; op uw sterkste, rond {fhi}. Dit zijn geen kansen: zonder vorig jaar is de fout van de prognose niet te meten.',
    pt:'Os seus meses acompanhados vão de {lo} a {hi} do seu mínimo. Se os meses restantes fossem como o seu mês mais fraco, o ano terminaria perto de {flo}; como o mais forte, perto de {fhi}. Não são probabilidades: sem um ano anterior, o erro da projeção não pode ser medido.'};
  function vySpreadLine(a){try{if(!a||a.method==='n1'||a.seasonal||!vyNum(a.pace)||!(a.pace>0)||!vyNum(a.projection)||!vyNum(a.actual))return '';
    var rs=(a.months||[]).filter(function(m){return m.kind==='past'&&m.target>0&&vyNum(m.value)&&m.value>0;}).map(function(m){return m.value/m.target;});if(rs.length<2)return '';
    var lo=Math.min(a.pace,Math.min.apply(null,rs)),hi=Math.max(a.pace,Math.max.apply(null,rs)),rest=(a.projection-a.actual)/a.pace;if(!(rest>0))return ''; /* C308 (décision 7) : la projection reste dans sa fourchette */
    return vyFill(VY_SPREAD[vyLoc()]||VY_SPREAD.fr,{lo:vyPct(lo),hi:vyPct(hi),flo:vyEur(a.actual+lo*rest),fhi:vyEur(a.actual+hi*rest)});}catch(e){return '';}}
  function vyCalendarRatios(year,prevY,ci){
    var rows=(root.DB&&root.DB.histJour)||[],by={},closed=root.verdictIsOperatingClosed,i,d,pad=function(x){return ('0'+x).slice(-2);};
    rows.forEach(function(r){var k=String(r&&r.date||'');if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&typeof r.caJ==='number')by[k]=(by[k]||0)+r.caJ;});
    var start=year+'-'+pad(ci+1)+'-01',from=String(Number(year)-1)+start.slice(4),sw=[0,0,0,0,0,0,0],nw=[0,0,0,0,0,0,0],tot=0,cnt=0;
    Object.keys(by).forEach(function(k){if(k>=from&&k<start){var x=new Date(k+'T12:00:00').getDay();sw[x]+=by[k];nw[x]++;tot+=by[k];cnt++;}});
    var mean=cnt?tot/cnt:0,w=[];for(i=0;i<7;i++)w.push(cnt>=56&&mean>0&&nw[i]>=4?sw[i]/nw[i]/mean:1);
    function cap(y,m,mode){var n=new Date(Number(y),m,0).getDate(),c=0;for(var dd=1;dd<=n;dd++){var k=y+'-'+pad(m)+'-'+pad(dd),open=mode==='data'?by[k]!=null:!(typeof closed==='function'&&closed(k));if(open)c+=w[new Date(k+'T12:00:00').getDay()];}return c;}
    var out=[];for(i=0;i<12;i++){var m=i+1,prevHas=false;for(d=1;d<=31&&!prevHas;d++)if(by[prevY+'-'+pad(m)+'-'+pad(d)]!=null)prevHas=true;
      var cN=i<ci?cap(year,m,'data'):cap(year,m,'calendar'),cP=prevHas?cap(prevY,m,'data'):cap(prevY,m,'calendar');
      out.push(cN>0&&cP>0?Math.round(cN/cP*10000)/10000:1);}
    return out;}
  var VY_CAL={fr:{meth:' Chaque mois est corrigé de son calendrier : ses jours d’ouverture, un samedi comptant plus qu’un lundi.',n1:'Projection = {l} réalisés en {m} {y} × {c} pour le calendrier × {g} = {v}. Le calendrier compare les jours d’ouverture de ce mois à ceux de {m} {y}, chaque jour pesant comme votre jour de semaine moyen.'},
    en:{meth:' Each month is corrected for its calendar: its opening days, a Saturday counting more than a Monday.',n1:'Projection = {l} achieved in {m} {y} × {c} for the calendar × {g} = {v}. The calendar compares this month’s opening days with those of {m} {y}, each day weighted like your average day of that weekday.'},
    es:{meth:' Cada mes se corrige según su calendario: sus días de apertura, un sábado cuenta más que un lunes.',n1:'Proyección = {l} realizados en {m} {y} × {c} por el calendario × {g} = {v}. El calendario compara los días de apertura de este mes con los de {m} {y}, cada día con el peso de su día de la semana medio.'},
    it:{meth:' Ogni mese è corretto per il suo calendario: i giorni di apertura, un sabato conta più di un lunedì.',n1:'Proiezione = {l} realizzati a {m} {y} × {c} per il calendario × {g} = {v}. Il calendario confronta i giorni di apertura di questo mese con quelli di {m} {y}, ogni giorno pesato come il suo giorno della settimana medio.'},
    de:{meth:' Jeder Monat wird um seinen Kalender bereinigt: seine Öffnungstage, ein Samstag zählt mehr als ein Montag.',n1:'Prognose = {l} erzielt im {m} {y} × {c} für den Kalender × {g} = {v}. Der Kalender vergleicht die Öffnungstage dieses Monats mit denen von {m} {y}, jeder Tag gewichtet wie Ihr durchschnittlicher Wochentag.'},
    nl:{meth:' Elke maand wordt gecorrigeerd voor zijn kalender: de openingsdagen, een zaterdag telt zwaarder dan een maandag.',n1:'Prognose = {l} gerealiseerd in {m} {y} × {c} voor de kalender × {g} = {v}. De kalender vergelijkt de openingsdagen van deze maand met die van {m} {y}, elke dag gewogen als uw gemiddelde weekdag.'},
    pt:{meth:' Cada mês é corrigido do seu calendário: os dias de abertura, um sábado conta mais do que uma segunda-feira.',n1:'Projeção = {l} realizados em {m} {y} × {c} pelo calendário × {g} = {v}. O calendário compara os dias de abertura deste mês com os de {m} {y}, cada dia com o peso do seu dia da semana médio.'}};
  function vyCalOn(){var c=(vyLastInput&&vyLastInput.calRatio)||[];return c.some(function(x){return vyNum(x)&&Math.abs(x-1)>0.0005;});}
  function vyFecCopy(){return VY_FEC[vyLoc()]||VY_FEC.fr;}
  /* Méthode N-1 : les mois projetés suivent l'an dernier ; la saison des années passées répartit seulement les minimums. */
  var VY_SHN={fr:{h:'Minimums des mois répartis selon la saison de {n} année(s) d’historique.',d:'Minimums des mois répartis selon la saison de votre document comptable {y}.',x:'Minimums des mois répartis selon la saison de {n} année(s) : votre historique de caisse et votre document comptable {y}.'},
    en:{h:'Monthly minimums spread according to the seasonality of {n} year(s) of history.',d:'Monthly minimums spread according to the seasonality of your {y} accounting file.',x:'Monthly minimums spread according to the seasonality of {n} year(s): your till history and your {y} accounting file.'},
    es:{h:'Mínimos mensuales repartidos según la estacionalidad de {n} año(s) de historial.',d:'Mínimos mensuales repartidos según la estacionalidad de su documento contable {y}.',x:'Mínimos mensuales repartidos según la estacionalidad de {n} año(s): su historial de caja y su documento contable {y}.'},
    it:{h:'Minimi mensili ripartiti secondo la stagionalità di {n} anno/i di storico.',d:'Minimi mensili ripartiti secondo la stagionalità del suo documento contabile {y}.',x:'Minimi mensili ripartiti secondo la stagionalità di {n} anno/i: storico di cassa e documento contabile {y}.'},
    de:{h:'Monatsminima nach dem Saisonverlauf von {n} Jahr(en) Historie verteilt.',d:'Monatsminima nach dem Saisonverlauf Ihrer Buchhaltungsdatei {y} verteilt.',x:'Monatsminima nach dem Saisonverlauf von {n} Jahr(en) verteilt: Ihre Kassendaten und Ihre Buchhaltungsdatei {y}.'},
    nl:{h:'Maandminima verdeeld volgens het seizoenspatroon van {n} jaar historiek.',d:'Maandminima verdeeld volgens het seizoenspatroon van uw boekhoudbestand {y}.',x:'Maandminima verdeeld volgens het seizoenspatroon van {n} jaar: uw kassahistoriek en uw boekhoudbestand {y}.'},
    pt:{h:'Mínimos mensais repartidos segundo a sazonalidade de {n} ano(s) de histórico.',d:'Mínimos mensais repartidos segundo a sazonalidade do seu documento contabilístico {y}.',x:'Mínimos mensais repartidos segundo a sazonalidade de {n} ano(s): o histórico de caixa e o documento contabilístico {y}.'}};
  /* C298 (V15-144) : l’année de référence connue mois par mois est déjà comparée dans « Vos années ». */
  var VY_CONNUE={fr:'Votre année {y} est connue mois par mois : elle est comparée à son minimum dans « Vos années ». La projection de {a} part de vos mois de {a}.',en:'Your {y} year is known month by month: it is compared with its minimum in “Your years”. The {a} projection starts from your {a} months.',es:'Su año {y} se conoce mes a mes: se compara con su mínimo en «Sus años». La proyección de {a} parte de sus meses de {a}.',it:'Il suo anno {y} è noto mese per mese: è confrontato con il suo minimo in «I suoi anni». La proiezione del {a} parte dai suoi mesi del {a}.',de:'Ihr Jahr {y} ist Monat für Monat bekannt: Es wird unter „Ihre Jahre“ mit seinem Minimum verglichen. Die Prognose für {a} beruht auf Ihren Monaten {a}.',nl:'Uw jaar {y} is maand per maand bekend: het wordt in „Uw jaren” met zijn minimum vergeleken. De prognose voor {a} vertrekt van uw maanden van {a}.',pt:'O seu ano {y} é conhecido mês a mês: é comparado com o seu mínimo em «Os seus anos». A projeção de {a} parte dos seus meses de {a}.'};
  var VY_NOSEAS={fr:'Sans année complète, Verdict ne connaît pas encore votre saison : les mois restants reprennent votre rythme moyen. Si vos mois d’hiver sont plus calmes, cette fin d’année sera plus basse.',en:'Without a full year, Verdict does not know your season yet: the remaining months follow your average pace. If your winter months are quieter, this year-end will be lower.',es:'Sin un año completo, Verdict aún no conoce su temporada: los meses restantes siguen su ritmo medio. Si sus meses de invierno son más tranquilos, este cierre de año será más bajo.',it:'Senza un anno completo, Verdict non conosce ancora la sua stagione: i mesi restanti seguono il suo ritmo medio. Se i mesi invernali sono più calmi, questa fine anno sarà più bassa.',de:'Ohne vollständiges Jahr kennt Verdict Ihre Saison noch nicht: Die restlichen Monate folgen Ihrem Durchschnittstempo. Sind Ihre Wintermonate ruhiger, fällt dieses Jahresende niedriger aus.',nl:'Zonder volledig jaar kent Verdict uw seizoen nog niet: de resterende maanden volgen uw gemiddelde tempo. Zijn uw wintermaanden rustiger, dan valt dit jaareinde lager uit.',pt:'Sem um ano completo, o Verdict ainda não conhece a sua época: os meses restantes seguem o seu ritmo médio. Se os seus meses de inverno forem mais calmos, este fim de ano será mais baixo.'}; /* C298 (V15-012) */
  function vySeasonNote(a){var inp=vyLastInput||{},fy=inp.seasonFecYears||[],n=Number(inp.seasonYears)||Number(a&&a.seasonYears)||0;if(!n)return '';
    if(a&&a.method==='n1'){var N=VY_SHN[vyLoc()]||VY_SHN.fr;return fy.length?(n>fy.length?vyFill(N.x,{n:n,y:fy.join(', ')}):vyFill(N.d,{y:fy.join(', ')})):vyFill(N.h,{n:n});}
    if(fy.length){var X=vyFecCopy();return n>fy.length?vyFill(X.shMix,{n:n,y:fy.join(', ')}):vyFill(X.shDoc,{y:fy.join(', ')});}
    return vyFill(VY_SH[vyLoc()]||VY_SH.fr,{n:n});}
  function vyInput(R){
    var API=root.VerdictPerformanceIntegrated;
    if(!API||typeof API.seasonState!=='function'||typeof API.yearSummary!=='function')return {error:'api'};
    var clock=null;try{clock=root.verdictOperationalClock();}catch(e){}
    var key=clock&&/^\d{4}-\d{2}-\d{2}$/.test(clock.key)?clock.key:null;if(!key)return {error:'clock'};
    var year=key.slice(0,4),ci=Number(key.slice(5,7))-1;
    var st=API.seasonState(R,year,true);if(!st||!st.available||!st.plan)return {error:'plan'};
    var ys=API.yearSummary(year),acts=[],i;
    for(i=0;i<12;i++){var mo=ys&&ys.months&&ys.months[i],v=null;
      if(mo){var cl=mo.closure;if(cl&&cl.coverage===100&&vyNum(Number(cl.actual)))v=Number(cl.actual);else if(mo.hasData||mo.inactive)v=Number(mo.actual)||0;}
      acts.push(v);}
    var tg=[];for(i=0;i<12;i++)tg.push(Number(st.plan.monthlyTargets&&st.plan.monthlyTargets[year+'-'+('0'+(i+1)).slice(-2)])||0);
    var objRatio=null;try{var o=root.progObjJour(R);if(o&&o.mois>0&&o.objectifMois>o.mois)objRatio=o.objectifMois/o.mois;}catch(e){}
    var d=R&&R.d||{};
    /* Plan non saisonnier mais historique disponible : on reconstruit les minimums mensuels avec la forme des années passées. */
    var seasonal=!!st.seasonal,expected=Number(st.expectedToDate),seasonYears=seasonal?(st.plan.evidenceYears||[]).length:0,seasonSource=seasonal?'plan':null,fec=vyFecMonths(d.tva),seasonFecYears=seasonal?(st.plan.evidenceFecYears||[]).slice():[],seasonPriors=null,fecFlags=[];
    try{
      var locked=st.plan.lockedTargets&&Object.keys(st.plan.lockedTargets).length>0;
      if(!seasonal&&!locked){
        var priors=[],caps=[];
        for(i=0;i<12;i++)caps.push(Number(st.plan.openDayCapacity&&st.plan.openDayCapacity[year+'-'+('0'+(i+1)).slice(-2)])||0);
        var pkey=vyPriorKey(year,caps)+'|fec:'+(fec?fec.hash+':'+fec.tva:'');
        if(vyPriorCache.key===pkey){priors=vyPriorCache.priors;fecFlags=vyPriorCache.fecFlags||[];}else{
        for(var py=Number(year)-1;py>=Number(year)-5;py--){
          var ps=API.yearSummary(String(py)),pcaps=vyYearCaps(R,API,py),arr=[];
          for(i=0;i<12;i++){var pm=ps&&ps.months&&ps.months[i],val=null;
            if(pm){var pc=pm.closure;
              if(pc&&pc.coverage===100&&vyNum(Number(pc.actual)))val=Number(pc.actual);
              else if(pm.hasData&&pcaps[i]>0&&pm.days>=pcaps[i])val=Number(pm.actual);}
            arr.push(val);}
          var fu=false;if(fec){var fy=vyFecYear(fec,py);for(i=0;i<12;i++)if(arr[i]==null&&fy.values[i]!=null){arr[i]=fy.values[i];fu=true;}}
          priors.push(arr);fecFlags.push(fu?String(py):null);
        }
        vyPriorCache={key:pkey,priors:priors,fecFlags:fecFlags};}
        var sf=vySeasonTargets({planTargets:tg,capacity:caps,priorYears:priors});
        if(sf){
          var fcur=(tg[ci]>0)?Math.max(0,Math.min(1,(expected-tg.slice(0,ci).reduce(function(a,b){return a+b;},0))/tg[ci])):0;
          expected=sf.targets.slice(0,ci).reduce(function(a,b){return a+b;},0)+sf.targets[ci]*fcur;
          tg=sf.targets;seasonal=true;seasonYears=sf.years;seasonSource='history';seasonPriors=priors;
          seasonFecYears=(sf.okIdx||[]).map(function(k){return fecFlags[k];}).filter(Boolean);
        }
      }
    }catch(e){}
    var fullTargets=null;
    try{var fp=API.createSeasonPlan(R,year,1,{});if(fp&&fp.monthlyTargets){fullTargets=[];for(i=0;i<12;i++)fullTargets.push(Number(fp.monthlyTargets[year+'-'+('0'+(i+1)).slice(-2)])||0);}}catch(e){fullTargets=null;}
    if(fullTargets&&seasonPriors){try{var fcap=[];for(i=0;i<12;i++)fcap.push(Number(fp.openDayCapacity&&fp.openDayCapacity[year+'-'+('0'+(i+1)).slice(-2)])||0);var sfull=vySeasonTargets({planTargets:fullTargets,capacity:fcap,priorYears:seasonPriors});if(sfull)fullTargets=sfull.targets;}catch(e){}}
    var dd=root.DB||{},exY=dd.exerciseYear||(dd.ref&&dd.ref.exercice)||(dd.in&&dd.in.annee)||null;
    var lastYear=[],lyToDate=null,monthEngineCurrent=null,prevY=String(Number(year)-1);
    try{
      var pys=API.yearSummary(prevY),pplan=API.createSeasonPlan(R,prevY,1,{});
      for(i=0;i<12;i++){var pm2=pys&&pys.months&&pys.months[i],pc2=pm2&&pm2.closure,pcap=Number(pplan&&pplan.openDayCapacity&&pplan.openDayCapacity[prevY+'-'+('0'+(i+1)).slice(-2)])||0,lv=null;
        if(pc2&&pc2.coverage===100&&vyNum(Number(pc2.actual))&&Number(pc2.actual)>0)lv=Number(pc2.actual);
        else if(pm2&&pm2.hasData&&pcap>0&&pm2.days>=pcap&&Number(pm2.actual)>0)lv=Number(pm2.actual);
        lastYear.push(lv);}
      var cd=(clock.completedKey&&clock.completedKey.slice(0,7)===key.slice(0,7))?Number(clock.completedKey.slice(8)):0;
      if(lastYear[ci]!=null){var s2=0;(root.DB&&root.DB.histJour||[]).forEach(function(r){var k2=String(r&&r.date||'');if(k2.slice(0,7)===prevY+'-'+('0'+(ci+1)).slice(-2)&&Number(k2.slice(8,10))<=cd&&typeof r.caJ==='number')s2+=r.caJ;});lyToDate=s2;}
    }catch(e){lastYear=[];}
    var lastYearFec=null;if(fec){var fl=vyFecYear(fec,prevY);for(i=0;i<12;i++)if(lastYear[i]==null&&fl.values[i]!=null){lastYear[i]=fl.values[i];lastYearFec=prevY;}}
    var fecRef=vyFecReference(fec),calRatio=null;try{calRatio=vyCalendarRatios(year,prevY,ci);}catch(e){calRatio=null;}
    try{var Sm=root.piloteMoisEtat(R);if(Sm&&Sm.projection&&Sm.projection.disponible&&vyNum(Number(Sm.projection.ca)))monthEngineCurrent=Number(Sm.projection.ca);}catch(e){}
    try{var cr=root.verdictCHRReading(R);if(cr&&cr.input){
      var before=tg.slice(0,ci).reduce(function(a,b){return a+b;},0),annual=tg.reduce(function(a,b){return a+b;},0),future=tg.slice(ci+1).reduce(function(a,b){return a+b;},0);
      tg[ci]=cr.minimum;
      if(future>0){var scale=Math.max(0,annual-before-cr.minimum)/future;for(i=ci+1;i<12;i++)tg[i]*=scale;}
      expected=before+cr.expected;
      /* C205 (V14) : la projection du moteur (piloteMoisEtat, onglet Mois) prime ; le rythme × minimum ne sert qu’à défaut. */if(monthEngineCurrent==null)monthEngineCurrent=cr.exact&&cr.expected>0?Math.round(cr.actual/cr.expected*cr.minimum):null;
    }}catch(e){}
    var capArr=[],clArr=[],fullCap=null;for(i=0;i<12;i++){capArr.push(Number(st.plan.openDayCapacity&&st.plan.openDayCapacity[year+'-'+('0'+(i+1)).slice(-2)])||0);var mo2=ys&&ys.months&&ys.months[i];clArr.push(!!(mo2&&mo2.closure&&mo2.closure.coverage===100));}
    try{var fp2=API.createSeasonPlan(R,year,1,{});if(fp2&&fp2.openDayCapacity){fullCap=[];for(i=0;i<12;i++)fullCap.push(Number(fp2.openDayCapacity[year+'-'+('0'+(i+1)).slice(-2)])||0);}}catch(e){}
    var backtestRows=(root.DB&&root.DB.monthlyHistory||[]).map(function(row){return {period:row.period,actual:row.caTTC,complete:row.closed===true,fictional:row.fictional===true||root.DB.dataProvenance&&root.DB.dataProvenance.nature==='model_estimate',availableAt:row.availableAt||null};});
    return {referenceMonths:fecRef?fecRef.values:null,referenceDocYear:fecRef?fecRef.year:null,lastYearFec:lastYearFec,seasonFecYears:seasonFecYears,calRatio:calRatio,backtestRows:backtestRows,lastYear:lastYear,lastYearToDate:lyToDate,monthEngineCurrent:monthEngineCurrent,prevYear:prevY,capacity:capArr,fullCapacity:fullCap,closures:clArr,fullTargets:fullTargets,referenceTTC:(vyNum(Number(d.ca))&&Number(d.ca)>0&&!vyPartialRef())?Number(d.ca)*(1+(Number(d.tva)||0)):null,trackingStart:st.plan.trackingStart||null,exerciseYear:exY,seasonYears:seasonYears,seasonSource:seasonSource,targets:tg,actuals:acts,currentIndex:ci,actualToDate:Number(st.actual),expectedToDate:expected,missing:Number(st.missingDays)||0,
      calendarChanged:!!st.calendarChanged,seasonal:seasonal,annualMinimum:Number(st.plan.annualMinimum),fullYearMinimum:Number(st.plan.fullYearMinimum),
      mcPct:(d.ca>0&&d.mc>0)?d.mc/d.ca:null,tva:Number(d.tva)||0,cf:Number(d.cf)+(Number(d.amort)||0),futureOpenDays:Number(st.futureOpenDays)||0,objectiveRatio:objRatio,year:year};
  }
  function vyRefChart(r,C){
    var W=340,H=146,L=46,R=14,T=14,B=24,slot=(W-L-R)/12,bw=Math.min(16,slot*.62),i,m;
    var rs=r.months.filter(function(q){return q.kind!=='off'&&q.target>0;}).map(function(q){return q.value/q.target;}).concat([r.ratio]),rmin=Math.min.apply(null,rs),rmax=Math.max.apply(null,rs);
    var ymin=Math.max(0,Math.min(.6,Math.floor((Math.min(rmin,1)-.02)*5)/5)),ymax=Math.max(1.4,Math.ceil((Math.max(rmax,1)+.02)*5)/5),step=(ymax-ymin)>1.6?.4:.2;
    var y=function(v){return T+(ymax-Math.min(Math.max(v,ymin),ymax))/(ymax-ymin)*(H-T-B);},xb=function(k){return L+slot*k+(slot-bw)/2;};
    var s='<defs><pattern id="vyHachR" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,.16)" stroke-width="2"/></pattern></defs>';
    for(var v=ymin;v<=ymax+.001;v+=step){var rv=Math.round(v*100)/100;s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(rv).toFixed(1)+'" y2="'+y(rv).toFixed(1)+'" class="gl'+(Math.abs(rv-1)<.001?' obj':'')+'"/><text x="'+(L-6)+'" y="'+(y(rv)+3.5).toFixed(1)+'" text-anchor="end" class="ax">'+Math.round(rv*100)+VY_NB+'%</text>';}
    var col=VY_COL[vyEtat(r.ratio)];
    for(i=0;i<12;i++){m=r.months[i];var x=xb(i),base=H-B;
      if(m.kind==='off')s+='<rect x="'+x.toFixed(1)+'" y="'+T+'" width="'+bw.toFixed(1)+'" height="'+(H-T-B)+'" rx="2" fill="url(#vyHachR)"><title>'+vyEsc(vyMonthName(i))+'</title></rect>';
      else{var mr=m.target>0?m.value/m.target:r.ratio,mcol=VY_COL[vyEtat(mr)],yy=y(mr),h=Math.max(1.5,base-yy);s+='<rect x="'+x.toFixed(1)+'" y="'+yy.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="3" fill="'+mcol+'" fill-opacity=".55"><title>'+vyEsc(vyMonthName(i)+' · '+vyEur(m.value)+' / '+vyEur(m.target))+'</title></rect>';}
      s+='<text x="'+(x+bw/2).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" class="ax">'+vyEsc(C.m[i]||'')+'</text>';
      s+='<rect class="vy-hit" data-vy-m="'+i+'" x="'+(L+slot*i).toFixed(1)+'" y="1.5" width="'+slot.toFixed(1)+'" height="'+(H-3)+'" fill="transparent" tabindex="0" role="button" aria-label="'+vyEsc(vyMonthName(i))+'" style="cursor:pointer"/>';}
    return s;
  }
  function vyRefMarkup(a,C){
    var inp=vyLastInput;if(!inp||!inp.fullTargets)return null;
    var r=vyCoreRef({referenceMonths:inp.referenceMonths,referenceDocYear:inp.referenceDocYear,targets:inp.fullTargets,referenceTTC:inp.referenceTTC,mcPct:inp.mcPct,tva:inp.tva,cf:inp.cf,actualToDate:inp.actualToDate,expectedToDate:inp.expectedToDate,trackingStart:inp.trackingStart,completeMonths:a.completeMonths,exerciseYear:inp.exerciseYear});
    if(!r.available)return null;
    vyLastView={mode:'reference',yearRatio:r.ratio,fromDocument:!!r.fromDocument,documentYear:r.documentYear,months:r.months,year:inp.year,capacity:inp.fullCapacity||inp.capacity,mcPct:inp.mcPct,tva:inp.tva,cf:inp.cf,fullMin:r.minimum,extras:vyMonthExtras(inp.year),closures:null,defaultMonth:Number(inp.currentIndex)};
    var etat=vyEtat(r.ratio),diff=r.reference-r.minimum;
    var ttc=({fr:'TTC',en:'incl. VAT',es:'IVA incl.',it:'IVA incl.',de:'brutto',nl:'incl. btw',pt:'IVA incl.'})[vyLoc()]||'TTC'; /* C264 (R2) : un montant TTC, à côté d'une marge en HT dans Structure */
    var head=diff>=0?vyFill(C.rAbove,{x:vyEur(diff)+VY_NB+ttc}):vyFill(C.rBelow,{x:vyEur(-diff)+VY_NB+ttc});
    var sous=vyFill(r.exerciseYear?C.rSous:C.rSousNoY,{y:r.exerciseYear,ca:vyEur(r.reference),min:vyEur(r.minimum),pct:vyPct(r.ratio),n:r.completeMonths});
    if(r.fromDocument)sous=vyFill(vyFecCopy().rSous,{y:r.documentYear||r.exerciseYear||'',ca:vyEur(r.reference),min:vyEur(r.minimum),pct:vyPct(r.ratio),n:r.completeMonths});try{var yRef=Number(r.documentYear||r.exerciseYear||(Number(inp.year)-1)),kyRef=yRef&&Number(r.completeMonths)<2&&root.VerdictPerformanceIntegrated&&root.VerdictPerformanceIntegrated.knownYear(yRef);if(kyRef&&kyRef.total>0&&String(yRef)!==String(inp.year))sous+=' '+vyFill(VY_CONNUE[vyLoc()]||VY_CONNUE.fr,{y:yRef,a:inp.year});}catch(_){} /* C298 (V15-144) */
    var reach=r.crossIndex>=0?vyFill(C.rFut,{m:vyMonthName(r.crossIndex)}):C.rNo;
    var res=vyNum(r.result)?vyEur(r.result):'—',resCol=vyNum(r.result)?(r.result>=0?'#22c55e':'#ef4444'):'#fff';
    var track=C.tTrack0,trackV='—';
    if(r.trackStart&&r.trackExpected!=null){var sd='';try{var p=r.trackStart.split('-');sd=new Intl.DateTimeFormat(vyTag(),{day:'numeric',month:'long'}).format(new Date(Number(p[0]),Number(p[1])-1,Number(p[2]),12));if(vyLoc()==='fr'&&Number(p[2])===1)sd=sd.replace(/^1(?=\s)/,'1er');}catch(e){}
      track=vyFill(C.tTrack,{d:sd});trackV=vyFill(C.tTrackV,{a:vyEur(r.trackActual),e:vyEur(r.trackExpected)});}
    var curve='<div class="courbe vy-year-curve"><p class="kicker">'+vyEsc(r.fromDocument?vyFill(vyFecCopy().rCk,{y:r.documentYear||''}):C.rCk)+'</p><svg viewBox="0 0 340 146" role="img" aria-label="'+vyEsc(r.fromDocument?vyFill(vyFecCopy().rCk,{y:r.documentYear||''}):C.rCk)+'">'+vyRefChart(r,C)+'</svg><p class="legende">'+vyEsc(r.fromDocument?vyFill(vyFecCopy().rCl,{y:r.documentYear||''}):C.rCl)+' '+vyEsc(C.hint)+'</p><div id="vyDetail" aria-live="polite"></div></div>';
    var html='<h2 id="h2Annee">'+vyEsc(C.h2)+'</h2><article class="mod" id="modAnnee" data-etat="'+etat+'" data-vy-mode="reference" aria-live="polite" data-vy-version="'+VY_VERSION+'">'+
      '<div class="mod-h" style="flex-wrap:wrap"><p class="kicker">'+vyEsc(C.rk)+'</p><span class="chip info" style="white-space:normal;height:auto;min-height:28px;padding:4px 11px;line-height:1.3;flex:0 1 auto;max-width:100%">'+vyEsc(C.rChip)+'</span></div>'+
      '<p class="verdict-grand">'+vyEsc(head)+'</p><p class="sous">'+vyEsc(sous)+'</p>'+
      '<div class="piste" aria-hidden="true" style="--pos:'+vyPos(r.ratio).toFixed(1)+'%"><span class="z r"></span><span class="z o"></span><span class="z j"></span><span class="z v"></span><i class="curseur"></i></div>'+
      '<div class="piste-l" aria-hidden="true"><span>'+vyEsc(C.pl[0])+'</span><span>'+vyEsc(C.pl[1])+'</span><span>'+vyEsc(C.pl[2])+'</span></div>'+vyCursorLabel(r.ratio,'ref')+
      curve+
      '<div class="tuiles" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">'+
        '<div class="tuile" style="min-width:0"><small style="display:block;overflow-wrap:anywhere">'+vyEsc(C.tRef)+'</small><b style="display:block;overflow-wrap:anywhere">'+vyEsc(vyEur(r.reference))+'</b></div>'+
        '<div class="tuile" style="min-width:0"><small style="display:block;overflow-wrap:anywhere">'+vyEsc(C.tMin)+'</small><b style="display:block;overflow-wrap:anywhere">'+vyEsc(vyEur(r.minimum))+'</b></div>'+
        '<div class="tuile" style="min-width:0"><small style="display:block;overflow-wrap:anywhere">'+vyEsc(C.tReach)+'</small><b style="display:block;overflow-wrap:anywhere">'+vyEsc(reach)+'</b></div>'+
        '<div class="tuile" style="min-width:0"><small style="display:block;overflow-wrap:anywhere">'+vyEsc(C.tRefRes)+'</small><b style="display:block;overflow-wrap:anywhere;color:'+resCol+'">'+vyEsc(res)+'</b></div>'+
        '<div class="tuile" style="grid-column:1/-1;min-width:0"><small style="display:block;overflow-wrap:anywhere">'+vyEsc(track)+'</small><b style="display:block;overflow-wrap:anywhere">'+vyEsc(trackV)+'</b></div>'+
      '</div>'+
      '<aside class="note"><p class="kicker">'+vyEsc(C.nk)+'</p><p>'+vyEsc(C.rNote)+'</p></aside>'+
      '<div class="actions"><button class="btn ghost bloc" type="button" data-go="performances-annee">'+vyEsc(C.go)+'</button></div></article>';
    return {etat:etat,html:html};
  }
  var vyLastView=null;
  function vyMonthExtras(year){
    var rows=(root.DB&&root.DB.histJour)||[],tk=[],days=[],i;
    for(i=0;i<12;i++){tk.push(null);days.push(0);}
    rows.forEach(function(r){var k=String(r&&r.date||'');if(k.slice(0,4)!==String(year))return;var mi=Number(k.slice(5,7))-1;if(!(mi>=0&&mi<12))return;
      var ca=(typeof r.caJ==='number')?r.caJ:null;if(ca==null)return;days[mi]++;
      if(typeof r.tkJ==='number'&&r.tkJ>0)tk[mi]=(tk[mi]||0)+r.tkJ;});
    return {tickets:tk,days:days};
  }
  function vyDetailHTML(i,C){
    var v=vyLastView;if(!v)return '';
    var m=v.months[i],kind=m.kind,name=vyMonthName(i),yr=v.year||'',cap=v.capacity&&v.capacity[i]||0;
    var kl={past:C.kPast,current:C.kCur,future:C.kFut,off:C.kOff,ref:C.kRef}[kind]||'';
    var head='<div class="mod-h" style="flex-wrap:wrap;margin-top:12px"><p class="kicker" style="text-transform:none;font-size:15px;color:var(--text)">'+vyEsc(name.charAt(0).toUpperCase()+name.slice(1)+' '+yr)+'</p><span class="chip info" style="white-space:normal;height:auto;min-height:26px;padding:3px 10px">'+vyEsc(kl)+'</span></div>';
    if(kind==='off'||!(m.target>0))return head+'<p class="sous">'+vyEsc(C.offTxt)+'</p>';
    var cumV=0,cumT=0;for(var k=0;k<=i;k++){cumV+=v.months[k].value;cumT+=v.months[k].target;}
    var rc=vyMonthRecap({target:m.target,value:m.value,actual:m.actual,kind:kind,mcPct:v.mcPct,tva:v.tva,cf:v.cf,fullMin:v.fullMin,cumValue:cumV,cumTarget:cumT,tickets:v.extras.tickets[i]});
    var etat=vyEtat(rc.ratio),col=VY_COL[etat];
    var tile=function(l,val,style){return '<div class="tuile" style="min-width:0"><small style="display:block;overflow-wrap:anywhere">'+vyEsc(l)+'</small><b style="display:block;overflow-wrap:anywhere'+(style||'')+'">'+val+'</b></div>';};
    var mainL=kind==='past'?C.tdReal:kind==='current'?(m.method==='month'?C.tdEndM:C.tdEnd):kind==='ref'?(v.fromDocument?vyFill(vyFecCopy().tdRef,{y:v.documentYear||''}):C.tdRef):C.tdProj;
    var tiles=tile(C.tdMin,vyEsc(vyEur(rc.target)))+tile(mainL,vyEsc(vyEur(rc.value)));
    if(kind==='current'){tiles+=tile(C.tdCur,vyEsc(vyEur(m.actual)))+tile(C.tdLeft,vyEsc(vyEur(rc.left)));}
    tiles+=tile(C.tdGap,vyEsc((rc.gap>0?'+':rc.gap<0?'−':'')+vyEur(Math.abs(rc.gap))),';color:'+(rc.gap>=0?'#22c55e':'#ef4444'));
    var jInc=vyJoursInc(),jAc=VY_AC[vyLoc()]||VY_AC.fr;
    if(kind==='past'||kind==='current')tiles+=tile(C.tdDays,vyEsc(vyFill(C.tdDaysV,{a:v.extras.days[i],b:jInc?jAc:(cap||'—')})));
    else if(cap)tiles+=tile(C.tdDaysF,vyEsc(jInc?jAc:String(cap)));
    if(kind==='past'||kind==='current'){tiles+=tile(C.tdTk,rc.tickets?vyEsc(Math.round(rc.tickets).toLocaleString(vyTag())):vyEsc(C.tdNA))+tile(C.tdBasket,rc.basket!=null?vyEsc(vyEur2(rc.basket)):vyEsc(C.tdNA));}
    if(m.lastYear!=null&&kind!=='ref')tiles+=tile(vyFill(C.tdLY,{y:v.prevYear}),vyEsc(vyEur(m.lastYear)));
    if((m.method==='n1')&&vyNum(v.growth))tiles+=tile(C.tdG,vyEsc(vyGrowth(v.growth)+' '+vyFill(C.vsY,{y:v.prevYear})));
    if(rc.result!=null)tiles+=tile(C.tdRes,vyEsc(vyEur(rc.result)),';color:'+(rc.result>=0?'#22c55e':'#ef4444'));
    if(rc.cumRatio!=null)tiles+='<div class="tuile" style="grid-column:1/-1;min-width:0"><small style="display:block">'+vyEsc(C.tdCum)+'</small><b style="display:block;overflow-wrap:anywhere">'+vyEsc(vyFill(C.tdCumV,{a:vyEur(rc.cumValue),b:vyEur(rc.cumTarget),p:vyPct(rc.cumRatio)}))+'</b></div>';
    if(kind==='past'&&v.closures){var cl=v.closures[i];tiles+='<div class="tuile" style="grid-column:1/-1;min-width:0"><small style="display:block">'+vyEsc(cl?C.tdClosed:C.tdOpen)+'</small><b style="display:block">'+(cl?'✓':'—')+'</b></div>';}
    var mname=vyMonthName(i);
    var note=kind==='ref'?(v.fromDocument?vyFill(vyFecCopy().refTxt,{y:v.documentYear||''}):C.refTxt):kind==='current'?(m.method==='month'?C.monthTxt:m.method==='n1'?vyFill(C.curN1Txt,{a:vyEur(m.actual),g:vyGrowth(v.growth),m:mname,y:v.prevYear,r:vyEur(Math.max(0,(m.value-(m.actual||0))/(v.growth||1))),v:vyEur(m.value)}):C.curTxt):kind==='future'?(m.method==='n1'?vyFill(vyNum(m.cal)&&Math.abs(m.cal-1)>0.0005?(VY_CAL[vyLoc()]||VY_CAL.fr).n1:C.n1Txt,{c:vyNum(m.cal)?m.cal.toLocaleString(vyTag(),{minimumFractionDigits:3,maximumFractionDigits:3}):'',l:vyEur(m.lastYear),m:mname,y:v.prevYear,g:'(1 '+(v.growth>=1?'+':'\u2212')+' '+Math.abs((v.growth-1)*100).toLocaleString(vyTag(),{minimumFractionDigits:1,maximumFractionDigits:1})+VY_NB+'%)',v:vyEur(m.value)}):C.projTxt):'';
    return head+'<p class="verdict-grand" style="font-size:22px;color:'+(kind==='current'?'var(--text)':col)+'">'+vyEsc((kind==='current'?C.tdCur+' · ':'')+vyFill(C.dRatio,{p:vyPct(kind==='current'?(m.actual||0)/m.target:rc.ratio)}))+'</p>'+
      '<div class="tuiles" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">'+tiles+'</div>'+
      (note?'<p class="sous" style="margin-top:8px">'+vyEsc(note)+'</p>':'')+(rc.result!=null?'<p class="sous" style="margin-top:4px;font-size:12px">'+vyEsc(C.resNote)+'</p>':'')+(root.VerdictTeam?'<div class="actions" style="margin-top:10px"><button class="btn ghost bloc" type="button" onclick="try{parent.VerdictTeam.open('+i+')}catch(e){}">'+vyEsc((root.VerdictTeam&&root.VerdictTeam.openLabel&&root.VerdictTeam.openLabel())||'')+'</button></div>':'');
  }
  function vyCursorLabel(ratio,mode){var T=VY_CUR[vyLoc()]||VY_CUR.fr,col=VY_COL[vyEtat(ratio)];
    return '<p class="vy-cursor-label" aria-live="polite" style="display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:-4px 0 10px;font-size:13px;font-weight:700;color:'+col+'"><span class="vy-cursor-text">'+vyEsc(vyFill(T.y,{k:mode==='ref'?T.kyr:T.ky,p:vyPct(ratio)}))+'</span><button type="button" class="vy-cursor-back" hidden style="font:inherit;font-size:12px;font-weight:600;padding:3px 10px;min-height:28px;border-radius:999px;border:1px solid currentColor;background:transparent;color:var(--mut,#8a93a0);cursor:pointer">'+vyEsc(T.back)+'</button></p>';}
  /* i = null : l'année ; sinon le mois i. Ne change que la jauge et son étiquette (aucun chiffre recalculé). */
  function vyCursorTo(card,i){var v=vyLastView,piste=card.querySelector('.piste'),lab=card.querySelector('.vy-cursor-label');if(!v||!piste||!lab)return;
    var T=VY_CUR[vyLoc()]||VY_CUR.fr,C=vyCopy(),ratio,text,m=i==null?null:v.months[i],closedM=false;
    if(m==null){ratio=v.yearRatio;text=vyFill(T.y,{k:v.mode==='reference'?T.kyr:T.ky,p:vyPct(ratio)});}
    else if(m.kind==='off'||!(m.target>0)){closedM=true;ratio=v.yearRatio;var nm=vyMonthName(i);text=vyFill(T.off,{m:nm.charAt(0).toUpperCase()+nm.slice(1)});}
    else{ratio=m.value/m.target;var nm2=vyMonthName(i),k={past:T.kp,current:T.kc,future:T.kf,ref:T.kr}[m.kind]||T.kf;text=vyFill(T.m,{m:nm2.charAt(0).toUpperCase()+nm2.slice(1),k:k,p:vyPct(ratio)});}
    var col=closedM?VY_COL.info:VY_COL[vyEtat(ratio)];
    piste.style.setProperty('--pos',vyPos(ratio).toFixed(1)+'%');
    var cur=piste.querySelector('.curseur');if(cur){cur.style.background=col;cur.style.boxShadow='0 0 0 2px '+col+'8c';}
    var pl=card.querySelector('.piste-l span:last-child');if(pl)pl.textContent=m==null?C.pl[2]:T.minM;
    lab.style.color=col;var tx=lab.querySelector('.vy-cursor-text');if(tx)tx.textContent=text;
    var bk=lab.querySelector('.vy-cursor-back');if(bk)bk.hidden=(m==null);
  }
  function vyBindDetail(doc,card){
    if(!card||card.getAttribute('data-vy-bound'))return;card.setAttribute('data-vy-bound','1');
    var chosen=null;
    var show=function(i,pick){var box=doc.getElementById('vyDetail');if(!box)return;var C=vyCopy();box.innerHTML=vyDetailHTML(i,C);
      [].forEach.call(card.querySelectorAll('.vy-hit'),function(h){var on=pick&&Number(h.getAttribute('data-vy-m'))===i;h.setAttribute('aria-pressed',on?'true':'false');h.setAttribute('stroke',on?'#ffffff':'none');h.setAttribute('stroke-width',on?'1.5':'0');h.setAttribute('rx','4');h.setAttribute('fill',on?'rgba(255,255,255,.06)':'transparent');});
      chosen=pick?i:null;if(pick)card.setAttribute('data-vy-month',String(i));else card.removeAttribute('data-vy-month');vyCursorTo(card,chosen);};
    /* Par défaut : détail du mois en cours, jauge sur l'année. Mois touché : jauge sur ce mois. Même mois retouché : retour à l'année. */
    var def=vyLastView&&vyLastView.defaultMonth;
    var reset=function(){if(def!=null&&def>=0)show(def,false);else{chosen=null;card.removeAttribute('data-vy-month');vyCursorTo(card,null);}};
    var pickMonth=function(i){if(chosen===i)reset();else show(i,true);};
    card.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('.vy-cursor-back')){reset();return;}var h=e.target&&e.target.closest&&e.target.closest('[data-vy-m]');if(!h)return;pickMonth(Number(h.getAttribute('data-vy-m')));});
    card.addEventListener('keydown',function(e){var h=e.target&&e.target.closest&&e.target.closest('[data-vy-m]');if(!h)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();pickMonth(Number(h.getAttribute('data-vy-m')));}});
    reset();
  }
  /* Rendu au format de la carte « Mon mois » : mêmes classes, mêmes zones de couleur. */
  function vyMarkup(a,C){
    var open='<h2 id="h2Annee">'+vyEsc(C.h2)+'</h2>';
    function blocked(etat,t,b,go){return {etat:etat,html:open+'<article class="mod" id="modAnnee" data-etat="'+etat+'" aria-live="polite" data-vy-version="'+VY_VERSION+'"><div class="mod-h"><p class="kicker">'+vyEsc(C.kicker)+'</p></div><p class="verdict-grand">'+vyEsc(t)+'</p><p class="sous">'+vyEsc(b)+'</p>'+(go?'<div class="actions"><button class="btn ghost bloc" type="button" data-go="performances-annee">'+vyEsc(C.go)+'</button></div>':'')+'</article>'};}
    if(!a.available){
      if(a.reason==='missing')return blocked('rouge',vyFill(C.missT,{n:a.missing||1}),C.missB,true);
      if(a.reason==='calendar')return blocked('orange',C.calT,C.calB,true);
      if(a.reason==='short'){var rf=vyRefMarkup(a,C);if(rf)return rf;return blocked('info',C.shortT,vyFill(C.shortB,{n:a.completeMonths||0})+vyPartialLine(),false);}
      return blocked('info',C.noneT,C.noneB,false);
    }
    var inpL=vyLastInput||{};vyLastView={mode:'projection',yearRatio:a.ratio,method:a.method,growth:a.growth,prevYear:inpL.prevYear,months:a.months,year:inpL.year,capacity:inpL.capacity,mcPct:inpL.mcPct,tva:inpL.tva,cf:inpL.cf,fullMin:Number(inpL.fullYearMinimum)||a.minimum,extras:vyMonthExtras(inpL.year),closures:inpL.closures,defaultMonth:a.currentIndex};
    var etat=vyEtat(a.ratio),diff=a.projection-a.minimum,confL=a.confidence==='backtested'?(VY_BT[vyLoc()]||VY_BT.fr).chip:a.confidence==='high'?C.hi:a.confidence==='medium'?C.me:C.lo;
    var head=diff>=0?vyFill(C.above,{x:vyEur(diff)}):vyFill(C.below,{x:vyEur(-diff)});
    var sous=vyFill(C.sous,{enc:vyEur(a.actual),att:vyEur(a.expected),pace:vyPct(a.pace),proj:vyEur(a.projection),lo:vyEur(a.projectionLow),hi:vyEur(a.projectionHigh)});
    var reach=a.crossIndex>=0?vyFill(a.crossPast?C.past:C.fut,{m:vyMonthName(a.crossIndex)}):(a.ratioHigh>=1?C.high:C.no);
    var res='—';if(vyNum(a.result)){res=vyEur(a.result);}
     var resRef='';try{var dR=root.moteur().d,yR=inpL.exerciseYear;if(vyNum(dR.res)&&yR&&String(yR)!==String(inpL.year)&&C.tResRef)resRef=vyFill(C.tResRef,{y:yR,r:vyEur(dR.res)});}catch(_){} /* C298 (V15-049) */
    var note=etat==='juste'?(VY_JUSTE[vyLoc()]||VY_JUSTE.fr).note:etat==='vert'?C.nv:etat==='jaune'?C.nj:etat==='orange'?C.no2:C.nr;
    var rest=a.remaining<=0.5?C.rest0:vyFill(C.rest,{a:vyEur(a.remaining),d:a.perOpenDay!=null?vyEur(a.perOpenDay):'—'});
    var curve='<div class="courbe vy-year-curve"><p class="kicker">'+vyEsc(C.ck)+'</p><svg viewBox="0 0 340 146" role="img" aria-label="'+vyEsc(C.ca)+'">'+vyChart(a,C)+'</svg><p class="legende">'+vyEsc(C.cl)+' '+vyEsc(C.hint)+'</p><div id="vyDetail" aria-live="polite"></div></div>';
    var html=open+'<article class="mod" id="modAnnee" data-etat="'+etat+'" aria-live="polite" data-vy-version="'+VY_VERSION+'">'+
      '<div class="mod-h" style="flex-wrap:wrap"><p class="kicker">'+vyEsc(C.kicker)+'</p><span class="chip info" style="white-space:normal;height:auto;min-height:28px;padding:4px 11px;line-height:1.3;flex:0 1 auto;max-width:100%">'+a.completeMonths+' '+vyEsc(C.cm)+' · '+(a.confidence==='backtested'?'':vyEsc(C.conf)+' ')+vyEsc(confL)+'</span></div>'+
      '<p class="verdict-grand" data-vy-projection="'+Math.round(a.projection)+'" data-vy-method="'+(a.method||'minimum')+'">'+vyEsc(head)+'</p><p class="sous">'+vyEsc(sous)+'</p>'+(vyExerciceLine(a)?'<p class="sous" data-vy-exercice="1">'+vyEsc(vyExerciceLine(a))+'</p>':'')+'<p class="sous" data-vy-fourchette="'+(a.confidence==='backtested'?'1':'0')+'">'+vyEsc(vyBtText(a)||C.calibrationNote)+'</p>'+(a.method==='n1'?'<p class="sous" style="margin-top:6px">'+vyEsc(vyFill(C.methN1,{y:(vyLastInput&&vyLastInput.prevYear)||'',g:vyGrowth(a.growth),n:a.comparableMonths})+(vyLastInput&&vyLastInput.lastYearFec?vyFill(vyFecCopy().n1Doc,{y:vyLastInput.lastYearFec}):'')+(vyCalOn()?(VY_CAL[vyLoc()]||VY_CAL.fr).meth:''))+'</p>':'')+
      '<div class="piste" aria-hidden="true" style="--pos:'+vyPos(a.ratio).toFixed(1)+'%"><span class="z r"></span><span class="z o"></span><span class="z j"></span><span class="z v"></span><i class="curseur"></i></div>'+
      '<div class="piste-l" aria-hidden="true"><span>'+vyEsc(C.pl[0])+'</span><span>'+vyEsc(C.pl[1])+'</span><span>'+vyEsc(C.pl[2])+'</span></div>'+vyCursorLabel(a.ratio,'projection')+
      curve+
      '<div class="tuiles" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">'+
        '<div class="tuile" style="min-width:0"><small style="display:block;overflow-wrap:anywhere">'+vyEsc(C.tEnc)+'</small><b style="display:block;overflow-wrap:anywhere">'+vyEsc(vyEur(a.actual))+'</b></div>'+
        '<div class="tuile" style="min-width:0"><small style="display:block;overflow-wrap:anywhere">'+vyEsc(C.tAtt)+'</small><b style="display:block;overflow-wrap:anywhere">'+vyEsc(vyEur(a.expected))+'</b></div>'+
        '<div class="tuile" style="min-width:0"><small style="display:block;overflow-wrap:anywhere">'+vyEsc(C.tFin)+'</small><b style="display:block;overflow-wrap:anywhere">'+vyEsc(vyEur(a.projection))+'</b></div>'+
        '<div class="tuile" style="min-width:0"><small style="display:block;overflow-wrap:anywhere">'+vyEsc(C.tMin)+'</small><b style="display:block;overflow-wrap:anywhere">'+vyEsc(vyEur(a.minimum))+'</b></div>'+
        '<div class="tuile" style="min-width:0"><small style="display:block;overflow-wrap:anywhere">'+vyEsc(C.tReach)+'</small><b style="display:block;overflow-wrap:anywhere">'+vyEsc(reach)+'</b></div>'+
        '<div class="tuile" style="min-width:0"><small style="display:block;overflow-wrap:anywhere">'+vyEsc(C.tRes)+'</small><b style="display:block;overflow-wrap:anywhere">'+res+'</b>'+(resRef?'<small style="display:block;font-weight:500;opacity:.75;overflow-wrap:anywhere">'+vyEsc(resRef)+'</small>':'')+'</div>'+
      '</div>'+
      '<aside class="note"><p class="kicker">'+vyEsc(C.nk)+'</p><p>'+vyEsc(note)+'</p><p style="margin-top:8px;font-weight:500;color:var(--mut)">'+vyEsc(rest)+'</p>'+(a.seasonal?(vySeasonNote(a)?'<p style="margin-top:8px;font-weight:500;color:var(--mut)">'+vyEsc(vySeasonNote(a))+'</p>':''):(a.method==='n1'?'':'<p style="margin-top:8px;font-weight:500;color:var(--mut)">'+vyEsc(VY_NS[vyLoc()]||VY_NS.fr)+'</p>'+(vySpreadLine(a)?'<p style="margin-top:8px;font-weight:500;color:var(--mut)" data-vy-ecart="1">'+vyEsc(vySpreadLine(a))+'</p>':'')))+'</aside>'+(!a.seasonal&&a.method!=='n1'?'<p class="sous" style="margin-top:8px" data-vy-saison="0">'+vyEsc(VY_NOSEAS[vyLoc()]||VY_NOSEAS.fr)+'</p>':'')+
      (root.verdictSeuilsHTML?root.verdictSeuilsHTML('annee'):'')+
      '<details style="margin-top:12px"><summary style="cursor:pointer;color:var(--mut2);font-size:13px">'+vyEsc(C.how)+'</summary><p class="sous" style="margin-top:8px">'+vyEsc(a.method==='n1'?(VY_HOW[vyLoc()]||VY_HOW.fr)+(vyCalOn()?(VY_CAL[vyLoc()]||VY_CAL.fr).meth:''):C.method)+'</p></details>'+
      '<div class="actions"><button class="btn ghost bloc" type="button" data-go="performances-annee">'+vyEsc(C.go)+'</button></div></article>';
    return {etat:etat,html:html};
  }
  /* ═══ Vue « Année » dans l'écran Structure (troisième lecture à côté de Journées et Cumul du mois) ═══ */
  function vyMainStyle(){
    var d=root.document;if(d.getElementById('vy-main-style'))return;
    var s=d.createElement('style');s.id='vy-main-style';
    s.textContent='.vy-main-shell .vy-current-pulse{animation:vyCurrentPulse 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center;pointer-events:none}@keyframes vyCurrentPulse{0%,100%{opacity:.85;transform:scale(.85)}50%{opacity:.2;transform:scale(1.35)}}@media(prefers-reduced-motion:reduce){.vy-main-shell .vy-current-pulse,.vy-main-shell.is-animated .vp-segment{animation:none!important;stroke-dashoffset:0!important}.vy-main-shell .vy-current-pulse{opacity:.5}}.vy-main-shell .vy-year-summary{white-space:normal;line-height:1.4}.vy-main-shell .vy-year-point:focus-visible{outline:none}.vy-main-shell .vy-year-point:focus-visible .vy-year-halo{visibility:visible}.vy-main{--vy-txt:#eef2f6;--vy-mut:#9aa6b2;--vy-mut2:#8a93a0;--vy-line:rgba(148,163,184,.18);color:var(--vy-txt)}'+
    '.vy-main .mod{position:relative;background:transparent;border:0;padding:0;margin:0}'+
    '.vy-main .mod-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin:4px 0 8px}'+
    '.vy-main .kicker{margin:0 0 6px;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--vy-mut2)}'+
    '.vy-main .chip{display:inline-flex;align-items:center;min-height:26px;padding:3px 10px;border-radius:999px;font-size:12.5px;font-weight:600;color:#9db7f5;background:rgba(125,162,245,.10);border:1px solid rgba(125,162,245,.28)}'+
    '.vy-main .verdict-grand{margin:4px 0 6px;font-size:21px;line-height:1.25;font-weight:800;letter-spacing:-.01em}'+
    '.vy-main .mod[data-etat="vert"] > .verdict-grand{color:#22c55e}.vy-main .mod[data-etat="juste"] > .verdict-grand{color:#0ea5e9}.vy-main .mod[data-etat="jaune"] > .verdict-grand{color:#eab308}.vy-main .mod[data-etat="orange"] > .verdict-grand{color:#f97316}.vy-main .mod[data-etat="rouge"] > .verdict-grand{color:#ef4444}'+
    '.vy-main .sous{margin:0;color:var(--vy-mut);font-size:14px;line-height:1.5}'+
    '.vy-main .piste{position:relative;display:flex;gap:3px;height:9px;margin:16px 0 6px}.vy-main .piste .z{flex:1;border-radius:99px;opacity:.85}.vy-main .z.r{background:#ef4444}.vy-main .z.o{background:#f97316}.vy-main .z.j{background:#eab308}.vy-main .z.v{background:#22c55e}'+
    '.vy-main .curseur{position:absolute;top:50%;left:var(--pos);width:18px;height:18px;border-radius:50%;background:#0b0e12;border:3px solid #fff;transform:translate(-50%,-50%);box-shadow:0 0 0 3px rgba(0,0,0,.35)}'+
    '.vy-main .piste-l{display:flex;justify-content:space-between;font-size:11.5px;color:var(--vy-mut2);margin-bottom:12px}'+
    '.vy-main .tuiles{display:grid;gap:9px;margin:10px 0}.vy-main .tuile{padding:11px 12px;border:1px solid var(--vy-line);border-radius:14px;background:rgba(10,14,19,.55)}.vy-main .tuile small{color:var(--vy-mut);font-size:12.5px}.vy-main .tuile b{margin-top:5px;font-size:17px;font-weight:800;font-variant-numeric:tabular-nums}'+
    '.vy-main .courbe{margin:12px 0;padding:12px;border:1px solid var(--vy-line);border-radius:16px;background:rgba(10,14,19,.45)}.vy-main .vy-year-curve{border-color:var(--vy-tone,var(--vy-line));background:rgba(10,14,19,.72)}.vy-main .courbe svg{width:100%;height:auto;display:block}.vy-main .legende{margin:8px 0 0;color:var(--vy-mut);font-size:12.5px;line-height:1.45}'+
    '.vy-main .gl{stroke:rgba(148,163,184,.16);stroke-width:1}.vy-main .gl.obj{stroke:rgba(226,232,240,.55);stroke-dasharray:5 5}.vy-main .ax{fill:#8a93a0;font-size:10.5px;font-family:inherit}'+
    '.vy-main .note{margin-top:10px;padding:12px;border-radius:14px;background:rgba(125,162,245,.06);border:1px solid rgba(125,162,245,.18)}.vy-main .note p{margin:0;font-size:14px;line-height:1.5}'+
    '.vy-main details summary{cursor:pointer;color:var(--vy-mut);font-size:13px;margin-top:10px}.vy-main .vy-hit:focus{outline:2px solid #fff;outline-offset:2px}';
    d.head.appendChild(s);
  }
  function vyTabLabel(){return vyCopy().tab;}
  function vyToggleLabel(k){var C=vyCopy();return k==='daily'?C.tDays:k==='pace'?C.tCum:C.tab;}
  /* R271: the Structure annual view uses the same curve vocabulary as Days/Month.
     Home keeps the complete financial explanation. All ratios come from VY models. */
  var VY_CURVE_COPY={
    fr:{open:'Voir toutes les informations',target:'MINIMUM DU MOIS',rule:'Chaque point compare un mois à son propre minimum. Le segment prend la couleur du mois auquel il arrive. Les mois fermés sont exclus.',projected:'Pointillés : projeté',reference:'Pointillés : référence, pas un réalisé',good:'Objectif atteint',slight:'Il manque jusqu’à 5 %',near:'Il manque 5 à 10 %',bad:'Il manque plus de 10 %'},
    en:{open:'See all information',target:'MONTH MINIMUM',rule:'Each point compares a month with its own minimum. Each segment uses the colour of its destination month. Closed months are excluded.',projected:'Dashed: projected',reference:'Dashed: reference, not actual',good:'Target reached',slight:'Up to 5% short',near:'5–10% short',bad:'More than 10% short'},
    es:{open:'Ver toda la información',target:'MÍNIMO DEL MES',rule:'Cada punto compara un mes con su propio mínimo. El tramo toma el color del mes al que llega. Se excluyen los meses cerrados.',projected:'Discontinuo: proyectado',reference:'Discontinuo: referencia, no real',good:'Objetivo alcanzado',slight:'Falta hasta un 5 %',near:'Falta entre un 5 y un 10 %',bad:'Falta más de un 10 %'},
    it:{open:'Vedi tutte le informazioni',target:'MINIMO DEL MESE',rule:'Ogni punto confronta un mese con il proprio minimo. Il segmento assume il colore del mese di arrivo. I mesi chiusi sono esclusi.',projected:'Tratteggiato: previsto',reference:'Tratteggiato: riferimento, non reale',good:'Obiettivo raggiunto',slight:'Manca fino al 5 %',near:'Manca dal 5 al 10 %',bad:'Manca oltre il 10 %'},
    de:{open:'Alle Informationen ansehen',target:'MONATSMINIMUM',rule:'Jeder Punkt vergleicht einen Monat mit seinem eigenen Minimum. Der Abschnitt erhält die Farbe des Zielmonats. Geschlossene Monate sind ausgeschlossen.',projected:'Gestrichelt: Prognose',reference:'Gestrichelt: Referenz, kein Ist-Wert',good:'Ziel erreicht',slight:'Bis zu 5 % fehlen',near:'5 bis 10 % fehlen',bad:'Mehr als 10 % fehlen'},
    nl:{open:'Alle informatie bekijken',target:'MAANDMINIMUM',rule:'Elk punt vergelijkt een maand met zijn eigen minimum. Het segment krijgt de kleur van de maand waar het aankomt. Gesloten maanden tellen niet mee.',projected:'Gestippeld: prognose',reference:'Gestippeld: referentie, niet werkelijk',good:'Doel bereikt',slight:'Tot 5 % tekort',near:'5 tot 10 % tekort',bad:'Meer dan 10 % tekort'},
    pt:{open:'Ver todas as informações',target:'MÍNIMO DO MÊS',rule:'Cada ponto compara um mês com o seu próprio mínimo. O segmento recebe a cor do mês de chegada. Os meses fechados são excluídos.',projected:'Tracejado: projetado',reference:'Tracejado: referência, não realizado',good:'Objetivo atingido',slight:'Falta até 5 %',near:'Falta entre 5 e 10 %',bad:'Falta mais de 10 %'}
  };
  function vyCurveCopy(){return VY_CURVE_COPY[vyLoc()]||VY_CURVE_COPY.fr;}
  function vyCurveStatus(r){return {vert:'green',juste:'green',jaune:'yellow',orange:'orange',rouge:'red',info:'neutral'}[vyEtat(r)];}
  var vyPerformanceView=null;
  function vyCurvePoints(months){return (months||[]).map(function(m,i){return {month:i,kind:m.kind,value:m.value,target:m.target,ratio:m.target>0&&vyNum(m.value)&&m.value>=0?m.value/m.target:null};}).filter(function(p){return p.kind!=='off'&&p.ratio!=null;});}
  function vyPerformanceSVG(points,C,T){
    var W=720,H=286,L=48,R=22,Tp=32,B=45,rs=points.map(function(p){return p.ratio*100;}),lo=Math.min.apply(null,rs.concat([90])),hi=Math.max.apply(null,rs.concat([110]));
    var span=hi-lo+10,step=span<=60?10:span<=150?25:span<=300?50:Math.ceil(span/600)*100,lower=Math.max(0,Math.floor((lo-5)/step)*step),upper=Math.ceil((hi+5)/step)*step;
    var x=function(i){return points.length===1?(L+W-R)/2:L+i*(W-L-R)/Math.max(1,points.length-1);},y=function(v){return Tp+(upper-v)/(upper-lower)*(H-Tp-B);};
    var svg='<svg viewBox="0 0 '+W+' '+H+'" role="group" aria-label="'+vyEsc(C.tabKicker)+'"><title>'+vyEsc(C.tabKicker)+'</title>';
    svg+='<rect class="vp-near-band" x="'+L+'" y="'+y(100)+'" width="'+(W-L-R)+'" height="'+(y(90)-y(100))+'"/>';
    for(var tick=lower;tick<=upper;tick+=step)svg+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(tick)+'" y2="'+y(tick)+'" class="vp-grid"/><text x="'+(L-8)+'" y="'+(y(tick)+3)+'" text-anchor="end" class="vp-y-axis">'+tick+' %</text>';
    svg+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(100)+'" y2="'+y(100)+'" class="vp-target"/><text x="'+(W-R)+'" y="18" text-anchor="end" class="vp-target-label">'+vyEsc(T.target)+' · 100 %</text>';
    points.forEach(function(p,i){if(!i)return;var prev=points[i-1],cx1=x(i-1),cy1=y(prev.ratio*100),cx2=x(i),cy2=y(p.ratio*100),mid=(cx1+cx2)/2,estimate=p.kind!=='past'||prev.kind!=='past';
      svg+='<path class="vp-segment '+(estimate?'is-uncertain':'is-solid')+'" style="--vp-delay:'+(i*.07).toFixed(2)+'s" data-year-segment="'+p.month+'" data-ratio="'+p.ratio+'" data-kind="'+p.kind+'" d="M '+cx1+' '+cy1+' C '+mid+' '+cy1+' '+mid+' '+cy2+' '+cx2+' '+cy2+'" fill="none" stroke="'+VY_COL[vyEtat(p.ratio)]+'"'+(estimate?' stroke-dasharray="7 6"':' pathLength="1"')+'/>';
    });
    points.forEach(function(p,i){var cx=x(i),cy=y(p.ratio*100),status=vyCurveStatus(p.ratio),color=VY_COL[vyEtat(p.ratio)],estimated=p.kind!=='past',kind={past:C.kPast,current:C.kCur+' · '+C.kFut,future:C.kFut,ref:C.kRef}[p.kind]||C.kRef;
      svg+='<g class="vp-point-group vy-year-point" data-year-month="'+p.month+'" data-status="'+status+'" data-ratio="'+p.ratio+'" tabindex="0" role="button" aria-pressed="false" aria-label="'+vyEsc(vyMonthName(p.month)+' · '+kind+' · '+vyPct(p.ratio))+'" onclick="VerdictAnnualProjection.selectMonth('+p.month+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();VerdictAnnualProjection.selectMonth('+p.month+');}"><title>'+vyEsc(vyMonthName(p.month)+' · '+kind+' · '+vyPct(p.ratio))+'</title><rect x="'+(cx-20)+'" y="24" width="40" height="238" fill="transparent"/><circle class="vy-year-halo" cx="'+cx+'" cy="'+cy+'" r="14" fill="none" stroke="'+color+'" stroke-width="2" visibility="hidden"/>';
      if(p.kind==='current')svg+='<circle class="vy-current-pulse" cx="'+cx+'" cy="'+cy+'" r="11" fill="none" stroke="'+color+'" stroke-width="2" pointer-events="none"/>';
      if(status==='orange')svg+='<rect x="'+(cx-6)+'" y="'+(cy-6)+'" width="12" height="12" rx="2" transform="rotate(45 '+cx+' '+cy+')" fill="'+(estimated?'#090c10':color)+'" stroke="'+color+'" stroke-width="2"/>';
      else svg+='<circle cx="'+cx+'" cy="'+cy+'" r="6" fill="'+(estimated?'#090c10':color)+'" stroke="'+color+'" stroke-width="2"/>';
      if(!estimated&&status==='green')svg+='<path class="vp-point-symbol" d="M '+(cx-3.5)+' '+cy+' l 2.4 2.5 l 5 -5.5"/>';
      if(status==='red')svg+='<line x1="'+(cx-3)+'" y1="'+cy+'" x2="'+(cx+3)+'" y2="'+cy+'" stroke="'+(estimated?color:'#fff')+'" stroke-width="2"/>';
      svg+='</g><text x="'+cx+'" y="'+(H-15)+'" text-anchor="middle" class="vp-axis">'+vyEsc(C.m[p.month])+'</text>';
    });
    return svg+'</svg>';
  }
  function vyYearToggle(C){return '<div class="vp-chart-toggle" role="group" aria-label="'+vyEsc(C.tabKicker)+'">'+['daily','pace','year'].map(function(mode){return '<button type="button" aria-pressed="'+(mode==='year')+'" class="'+(mode==='year'?'on':'')+'" onclick="performanceChartMode(\''+mode+'\')">'+vyEsc(mode==='daily'?C.tDays:mode==='pace'?C.tCum:C.tab)+'</button>';}).join('')+'</div>';}
  function vyPerformanceHTML(a,inp,C){
    var T=vyCurveCopy(),ref=null,months=a.months,mode='projection',note='',title='',year=inp.year;
    if(!a.available&&a.reason==='short')ref=vyCoreRef({referenceMonths:inp.referenceMonths,referenceDocYear:inp.referenceDocYear,targets:inp.fullTargets||[],referenceTTC:inp.referenceTTC,mcPct:inp.mcPct,tva:inp.tva,cf:inp.cf,actualToDate:inp.actualToDate,expectedToDate:inp.expectedToDate,trackingStart:inp.trackingStart,completeMonths:a.completeMonths,exerciseYear:inp.exerciseYear});
    if(ref&&ref.available){months=ref.months;mode='reference';note=C.rChip;title=C.rk+(inp.exerciseYear?' · '+inp.exerciseYear:'');}
    else if(a.available){title=C.h2+' · '+year;note=a.completeMonths+' '+C.cm+' · '+C.conf+' '+(a.confidence==='high'?C.hi:a.confidence==='medium'?C.me:C.lo);}
    else {vyPerformanceView=null;var blocked=a.reason==='missing'?vyFill(C.missT,{n:a.missing||1}):a.reason==='calendar'?C.calT:a.reason==='short'?C.shortT:C.noneT,body=a.reason==='missing'?C.missB:a.reason==='calendar'?C.calB:a.reason==='short'?vyFill(C.shortB,{n:a.completeMonths||0}):C.noneB;
      return '<div class="vp-chart-shell vy-main-shell"><div class="vp-chart-head"><div><div class="vp-kicker">'+vyEsc(C.tabKicker)+'</div><h3>'+vyEsc(blocked)+'</h3><p>'+vyEsc(body)+'</p></div>'+vyYearToggle(C)+'</div>'+vyHomeButton('year')+'</div>';}
    var points=vyCurvePoints(months),selected=points.filter(function(p){return p.month===Number(inp.currentIndex);})[0]||points.filter(function(p){return p.month<Number(inp.currentIndex);}).slice(-1)[0]||points[0];
    if(!selected)return '<div class="vp-chart-shell vy-main-shell">'+vyYearToggle(C)+'<p>'+vyEsc(C.noneB)+'</p>'+vyHomeButton('year')+'</div>';
    vyPerformanceView={points:points,selected:selected.month,mode:mode,year:year};var color=VY_COL[vyEtat(selected.ratio)];
    return '<div class="vp-chart-shell vy-main-shell" data-trajectory-state="'+vyCurveStatus(selected.ratio)+'" style="--vp-trajectory-tone:'+color+'"><div class="vp-chart-head"><div><div class="vp-kicker">'+vyEsc(C.tabKicker)+'</div><h3>'+vyEsc(title)+'</h3><p>'+vyEsc(note)+'</p></div>'+vyYearToggle(C)+'</div><div class="vp-chart-meta"><span class="vp-trajectory-chip vy-year-summary" data-status="'+vyCurveStatus(selected.ratio)+'" aria-live="polite">'+vySelectedYearText(selected,C)+'</span></div><div class="vp-chart-scroll">'+vyPerformanceSVG(points,C,T)+'</div><div class="vp-legend"><span><i class="good"></i>'+vyEsc(T.good)+'</span><span><i class="good" style="background:#0ea5e9"></i>'+vyEsc((VY_JUSTE[vyLoc()]||VY_JUSTE.fr).leg)+'</span><span><i class="slight"></i>'+vyEsc(T.slight)+'</span><span><i class="near"></i>'+vyEsc(T.near)+'</span><span><i class="bad"></i>'+vyEsc(T.bad)+'</span><span><i class="gap" style="border-color:#9aa6b2;background:transparent"></i>'+vyEsc(mode==='reference'?T.reference:T.projected)+'</span></div><div class="vp-chart-rule">'+vyEsc(T.rule)+'</div>'+vyHomeButton('year')+'</div>';
  }
  function vySelectedYearText(p,C){var kind={past:C.kPast,current:C.kCur+' · '+C.kFut,future:C.kFut,ref:C.kRef}[p.kind]||C.kRef;return '<i aria-hidden="true"></i>'+vyEsc(vyMonthName(p.month)+' · '+kind+' · '+vyFill(C.dRatio,{p:vyPct(p.ratio)}));}
  function vySelectPerformanceMonth(i){var view=vyPerformanceView,card=root.document.querySelector('.vy-main-shell');if(!view||!card)return;var p=view.points.filter(function(p){return p.month===i;})[0];if(!p)return;view.selected=i;
    var status=vyCurveStatus(p.ratio),color=VY_COL[vyEtat(p.ratio)];card.setAttribute('data-trajectory-state',status);card.style.setProperty('--vp-trajectory-tone',color);
    var summary=card.querySelector('.vy-year-summary');if(summary){summary.setAttribute('data-status',status);summary.innerHTML=vySelectedYearText(p,vyCopy());}
    [].forEach.call(card.querySelectorAll('[data-year-month]'),function(el){var on=Number(el.getAttribute('data-year-month'))===i;el.setAttribute('aria-pressed',String(on));var halo=el.querySelector('.vy-year-halo');if(halo)halo.setAttribute('visibility',on?'visible':'hidden');});
  }
  function vyHomeButton(mode){return '<button type="button" class="btn ghost bloc vy-home-link" style="width:100%;min-height:44px;margin-top:12px" onclick="VerdictAnnualProjection.openHome(\''+mode+'\')">'+vyEsc(vyCurveCopy().open)+'</button>';}
  var vyHomeRequest=0;
  function vyOpenHome(mode){var token=++vyHomeRequest,month=vyPerformanceView&&vyPerformanceView.selected,id=mode==='daily'?'modJour':mode==='pace'?'modMois':'modAnnee',tries=0;
    root.go('pil');
    function locate(){if(token!==vyHomeRequest||root.VIEW!=='pil')return;var fr=root.document.querySelector('#v-pil iframe.p41-ecran'),doc=fr&&fr.contentDocument;if(mode==='year'&&doc&&!doc.getElementById(id))vyAttach();var target=doc&&doc.getElementById(id);
      if(!target){if(++tries<80)root.setTimeout(locate,60);else if(root.toast)root.toast(vyCopy().noneT);return;}
      if(mode==='year'&&month!=null){var hit=target.querySelector('[data-vy-m="'+month+'"]');if(hit)hit.dispatchEvent(new fr.contentWindow.MouseEvent('click',{bubbles:true}));}
      if(typeof root.VERDICT_SCROLL_EPOCH==='number')root.VERDICT_SCROLL_EPOCH++;
      var settle=0,lastTop=null,stable=0;
      function align(){if(token!==vyHomeRequest||root.VIEW!=='pil'||!target.isConnected)return;var anchor=target.previousElementSibling&&target.previousElementSibling.tagName==='H2'?target.previousElementSibling:target;var y=fr.getBoundingClientRect().top+root.scrollY+anchor.getBoundingClientRect().top;
        var headers=[].slice.call(root.document.querySelectorAll('#modeBar,.stickytop,body > nav,#v32ModuleDock,.view.on > .actbar,.view.on > .chips')),offset=80;
        headers.forEach(function(el){var st=root.getComputedStyle(el),r=el.getBoundingClientRect();if(st.display!=='none'&&st.visibility!=='hidden'&&r.height>0&&(st.position==='fixed'||st.position==='sticky')&&r.top>=0&&r.bottom<root.innerHeight*.5)offset=Math.max(offset,r.bottom+12);});
        root.scrollTo({top:Math.max(0,y-offset),behavior:'auto'});if(lastTop!=null&&Math.abs(lastTop-y)<1)stable++;else stable=0;lastTop=y;if(++settle<30&&(settle<8||stable<4))root.setTimeout(align,80);
      }align();
    }root.setTimeout(locate,80);
  }
  function vyMainHTML(){try{var C=vyCopy(),R=root.moteur();if(!R||!R.ready)return null;var inp=vyInput(R);if(inp.error)return null;vyLastInput=inp;vyMainStyle();var html=vyPerformanceHTML(vyCoreN1(inp),inp,C);
    var API=root.VerdictPerformanceIntegrated,reduced=root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(vyPerformanceView&&!reduced&&API&&API.claimAnimation&&API.claimAnimation('chart:'+inp.year+':year'))html=html.replace('vp-chart-shell vy-main-shell','vp-chart-shell vy-main-shell is-animated');
    root.setTimeout(function(){if(vyPerformanceView)vySelectPerformanceMonth(vyPerformanceView.selected);},0);return html;
  }catch(e){try{console.warn('VerdictAnnualProjection main',e);}catch(x){}return null;}}
  var vySig='',vyLastInput=null;
  function vyDataSig(){var d=root.DB||{},rows=d.histJour||[],last=rows.length?rows[rows.length-1]:null,clock='';try{clock=root.verdictOperationalClock().key;}catch(e){}
    return [vyLoc(),clock,rows.length,last?last.date+':'+last.ca+':'+last.caJ:'',d.etab||'',Object.keys(d.performanceYearPlans||{}).length,Object.keys(d.performanceClosures||{}).length,(d.in&&d.in.amort)||0,(d.in&&d.in.tva)||'',(d.fecImport&&(d.fecImport.hash||d.fecImport.appliedAt))||''].join('|');}
  function vyAttach(){
    try{
      if(root.VIEW!=='pil')return;
      var fr=root.document.querySelector('iframe.p41-ecran');if(!fr)return;
      var doc=fr.contentDocument;if(!doc)return;
      var chY=doc.getElementById('vx40-annee');if(chY&&chY.hidden)return;/* C333 (décision 19) : chapitre Année caché, rien à calculer */
      var act=doc.getElementById('modAction'),exist=doc.getElementById('modAnnee');
      if(!act){return;}
      var sig=vyDataSig();
      if(exist&&vySig===sig&&exist.getAttribute('data-vy-sig')===sig)return;
      var R=null;try{R=root.moteur();}catch(e){}
      var drop=function(){var h=doc.getElementById('h2Annee'),m=doc.getElementById('modAnnee');if(h)h.parentNode.removeChild(h);if(m)m.parentNode.removeChild(m);};
      if(!R||!R.ready||(typeof root.projetOuvert==='function'&&!root.projetOuvert())){drop();vySig=sig;return;}
      var inp=vyInput(R);if(inp.error){drop();vySig=sig;return;}vyLastInput=inp;
      var out=vyMarkup(vyCoreN1(inp),vyCopy());
      drop();
      var anchor=act.previousElementSibling&&act.previousElementSibling.tagName==='H2'?act.previousElementSibling:act;
      anchor.insertAdjacentHTML('beforebegin',out.html);
      var card=doc.getElementById('modAnnee');if(card){card.setAttribute('data-vy-sig',sig);vyBindDetail(doc,card);}
      vySig=sig;
    }catch(e){try{console.warn('VerdictAnnualProjection',e);}catch(x){}}
  }
  root.VerdictAnnualProjection={selectMonth:vySelectPerformanceMonth,openHome:vyOpenHome,homeButton:vyHomeButton,performanceHTML:vyPerformanceHTML,curvePoints:vyCurvePoints,version:VY_VERSION,mainHTML:vyMainHTML,tabLabel:vyTabLabel,toggleLabel:vyToggleLabel,core:vyCore,coreN1:vyCoreN1,coreRef:vyCoreRef,monthRecap:vyMonthRecap,season:vySeasonTargets,input:vyInput,markup:function(a){return vyMarkup(a,vyCopy());},copy:VY_COPY,attach:vyAttach};
  root.VerdictAnnualProjection.__attach=vyAttach;/* C333 : relancé à l’ouverture du chapitre */
  root.setInterval(vyAttach,900);
  /* ═══ fin R251 ═══ */

  /* ═══ R252 — MODULE ÉQUIPE : coût, budget payable, capacité (cœur pur) ═══════
     Règles : une capacité et une marge au jour, une analyse au mois, aucune consigne
     sur les personnes. Absent ≠ zéro. Les pourcentages vivent ici et dans le Diagnostic. */
  var VT_VERSION='R252';
  function vtNum(x){return typeof x==='number'&&isFinite(x);}
  function vtQuantile(arr,q){
    var a=(arr||[]).filter(vtNum).slice().sort(function(x,y){return x-y;});
    if(!a.length)return null;if(a.length===1)return a[0];
    var pos=(a.length-1)*q,lo=Math.floor(pos),hi=Math.ceil(pos);
    return a[lo]+(a[hi]-a[lo])*(pos-lo);
  }
  /* Budget que la structure peut consacrer à l'équipe sur une période :
     CA HT × taux de marge sur coûts variables − charges fixes hors personnel − objectif. */
  function vtPayable(caTTC,tva,mcRate,cfOther,obj){
    if(!vtNum(caTTC)||!vtNum(mcRate)||!vtNum(cfOther))return null;
    var ht=caTTC/(1+(vtNum(tva)?tva:0));
    var be=ht*mcRate-cfOther;
    var calculated={ht:ht,breakEven:be,withObjective:be-(vtNum(obj)?obj:0)};
    if(window.VerdictInternalAudit)window.VerdictInternalAudit.auditPayable(caTTC,tva,mcRate,cfOther,obj,calculated);
    return calculated;
  }
  /* Couverture = budget payable ÷ coût de l'équipe. 1 = l'équipe est exactement payée. */
  function vtCoverage(payable,cost){
    if(!vtNum(payable)||!vtNum(cost))return null;
    if(cost<=0)return payable>=0?null:0;
    if(payable<=0)return 0;
    return payable/cost;
  }
  function vtStatus(r){if(!vtNum(r))return 'info';return ({green:'vert',yellow:'jaune',orange:'orange',red:'rouge'})[window.VerdictExact.zoneRatio(r)]||'info';}
  /* Agrégat des services par mois d'une année : CA, heures, coût, personnes, journées. */
  function vtAggregate(services,year){
    var M=[],i;for(i=0;i<12;i++)M.push({ca:0,hours:0,cost:0,other:0,days:{},hasData:false});
    (services||[]).forEach(function(s){
      var d=String(s&&s.d||'');if(d.slice(0,4)!==String(year))return;var mi=Number(d.slice(5,7))-1;if(!(mi>=0&&mi<12))return;
      if(s.h==null||s.h==='')return;
      var h=Number(s.h),ca=Number(s.ca),rate=Number(s.rate);
      if(!vtNum(h)||h<0)return;
      var m=M[mi];m.hasData=true;m.hours+=h;if(vtNum(ca))m.ca+=ca;if(vtNum(rate))m.cost+=h*rate;if(vtNum(Number(s.otherCost)))m.other+=Number(s.otherCost);
      var day=m.days[d]||(m.days[d]={ca:0,hours:0,cost:0,pers:0,services:0,event:false});
      day.hours+=h;if(vtNum(ca))day.ca+=ca;if(vtNum(rate))day.cost+=h*rate;day.pers=Math.max(day.pers,Number(s.pers)||0);day.services++;
      if(s.exceptional&&s.exceptional!=='normal')day.event=true;
    });
    return M;
  }
  /* Productivité tenue : 75e centile des journées observées (CA HT ÷ heures), au moins 10 journées. */
  function vtProductivity(dayList,tva){
    var p=[];(dayList||[]).forEach(function(d){if(d&&d.hours>0&&d.ca>0)p.push((d.ca/(1+tva))/d.hours);});
    if(p.length<10)return {available:false,n:p.length};
    return {available:true,n:p.length,median:vtQuantile(p,.5),capacity:vtQuantile(p,.75)};
  }
  /* Capacité d'une équipe de h heures, tirée de VOS journées avec un effectif comparable (±10 % d'heures,
     au moins 5) : confortable = 75e centile du CA encaissé, déjà tenu = meilleur CA encaissé.
     Les journées notées « juste » ou « débordé » sont exclues en amont. Sinon : productivité × h. */
  function vtCapacityFor(h,days,tva){
    if(!vtNum(h)||h<=0)return null;
    var near=(days||[]).filter(function(d){return d&&d.hours>0&&d.ca>0&&Math.abs(d.hours-h)<=0.1*h;});
    if(near.length>=5){var cas=near.map(function(d){return d.ca;}),best=near[0];near.forEach(function(d){if(d.ca>best.ca)best=d;});
      return {comfort:vtQuantile(cas,.75),record:best.ca,recordDate:best.date||null,basis:'team',n:near.length};}
    var p=[];(days||[]).forEach(function(d){if(d&&d.hours>0&&d.ca>0)p.push((d.ca/(1+tva))/d.hours);});
    if(p.length>=10)return {comfort:vtQuantile(p,.75)*h*(1+tva),record:vtQuantile(p,.95)*h*(1+tva),recordDate:null,basis:'productivity',n:p.length};
    return null;
  }
  /* Lecture d'une journée passée : jaune = équipe large, vert = adaptée, orange = au-delà du confortable ;
     la note du service prime (« juste » = orange, « débordé » = rouge). */
  function vtDayReading(caTTC,cap,rating){
    if(!cap||!vtNum(cap.comfort)||cap.comfort<=0)return null;
    var util=vtNum(caTTC)?caTTC/cap.comfort:null;
    var st=util==null?'info':util<=0.70?'jaune':util<=1.0?'vert':'orange';
    if(rating==='juste')st='orange';if(rating==='deb')st='rouge';
    return {comfort:cap.comfort,record:cap.record,utilisation:util,status:st};
  }
  /* Lecture d'une journée future : la fourchette haute face au confortable et au déjà tenu. */
  function vtFutureReading(f,cap){
    if(!f||!cap)return null;
    /* tolérance de 3 % au-dessus du déjà tenu : en dessous, l'écart n'est pas mesurable */
    return {state:f.high<=cap.comfort?'ok':f.high<=cap.record*1.03?'tight':'beyond',margin:cap.comfort-f.high};
  }
  /* Prévision d'une journée future : mêmes jours de semaine du même mois N-1 × évolution ; fourchette = min/max × évolution. */
  function vtForecastDay(sameDaysLY,recentSameDays,growth){
    var g=vtNum(growth)&&growth>0?growth:1,base=null,lo=null,hi=null,src=null;
    var a=(sameDaysLY||[]).filter(function(x){return vtNum(x)&&x>0;});
    if(a.length>=2){var s=0;a.forEach(function(x){s+=x;});base=s/a.length*g;lo=Math.min.apply(null,a)*g;hi=Math.max.apply(null,a)*g;src='n1';}
    else{var b=(recentSameDays||[]).filter(function(x){return vtNum(x)&&x>0;});
      if(b.length>=2){var t=0;b.forEach(function(x){t+=x;});base=t/b.length;lo=Math.min.apply(null,b);hi=Math.max.apply(null,b);src='recent';}}
    return base==null?null:{mid:base,low:lo,high:hi,source:src};
  }
  /* Coût réel d'un salarié moyen, à partir des réglages (brut, taux de charges, effectif). */
  /* ═══ P4 · coût humain PAR SERVICE (pur) ═══════════════════════════════════════
     Pour chaque service : CA, heures, personnes, coût chargé, CA HT par heure, part du coût dans le CA.
     Comparables = le même créneau (midi, soir…) le même jour de semaine, avant ce service, hors journées
     exceptionnelles, 8 au plus, 4 au moins. Lecture = analyse, jamais une consigne sur une personne. */
  function vtWeekday(iso){var p=String(iso).split('-');return new Date(Date.UTC(+p[0],+p[1]-1,+p[2],12)).getUTCDay();}
  function vtServiceRow(s,tva){
    if(!s||s.h==null||s.h===''||!(Number(s.h)>0))return null;var h=Number(s.h),ca=Number(s.ca),rate=Number(s.rate),t=vtNum(tva)?tva:0;
    var ht=vtNum(ca)?ca/(1+t):null,cost=vtNum(rate)?h*rate:null;
    return {d:String(s.d),slot:String(s.s||''),label:s.label||null,pers:vtNum(Number(s.pers))?Number(s.pers):null,h:h,ca:vtNum(ca)?ca:null,ht:ht,cost:cost,
      prod:ht!=null?ht/h:null,part:(ht!=null&&ht>0&&cost!=null)?cost/ht:null,event:!!(s.exceptional&&s.exceptional!=='normal')};
  }
  function vtComparables(services,ref,tva,max){
    var wd=vtWeekday(ref.d),out=[];max=max||8;
    var rows=(services||[]).map(function(s){return vtServiceRow(s,tva);}).filter(function(r){return r&&r.slot===ref.slot&&r.d<ref.d&&!r.event&&r.prod!=null&&vtWeekday(r.d)===wd;});
    rows.sort(function(a,b){return a.d<b.d?1:-1;});rows=rows.slice(0,max);
    if(rows.length<4)return {n:rows.length,suffisant:false};
    return {n:rows.length,suffisant:true,prod:vtQuantile(rows.map(function(r){return r.prod;}),.5),part:vtQuantile(rows.filter(function(r){return r.part!=null;}).map(function(r){return r.part;}),.5),
      ca:vtQuantile(rows.map(function(r){return r.ca;}),.5),h:vtQuantile(rows.map(function(r){return r.h;}),.5),dates:rows.map(function(r){return r.d;})};
  }
  /* Lecture : CA HT par heure face à la médiane des services comparables. */
  function vtServiceStatus(row,comp){
    if(!row||row.prod==null||!comp||!comp.suffisant)return {statut:'insuffisant',ratio:null};
    var r=row.prod/comp.prod;return {statut:r>=1.10?'tendu':r>=0.90?'habituel':'large',ratio:r};
  }
  /* Créneaux d'un mois : par jour de semaine × service, moyennes et CA HT par heure. */
  function vtSlotsMonth(services,ym,tva){
    var g={};(services||[]).forEach(function(s){if(String(s&&s.d||'').slice(0,7)!==ym)return;var r=vtServiceRow(s,tva);if(!r||r.event)return;
      var k=vtWeekday(r.d)+'|'+r.slot,G=g[k]||(g[k]={wd:vtWeekday(r.d),slot:r.slot,label:r.label,n:0,ca:0,ht:0,h:0,cost:0,costKnown:true});G.n++;G.ca+=r.ca||0;G.ht+=r.ht||0;G.h+=r.h;if(r.cost==null)G.costKnown=false;else G.cost+=r.cost;});
    var L=Object.keys(g).map(function(k){var G=g[k];G.caMoy=G.ca/G.n;G.hMoy=G.h/G.n;G.prod=G.h>0?G.ht/G.h:null;G.part=(G.costKnown&&G.ht>0)?G.cost/G.ht:null;return G;});
    L.sort(function(a,b){return (a.prod==null?1e9:a.prod)-(b.prod==null?1e9:b.prod);});
    return L;
  }
  function vtCostLadder(brutTotal,taux,etp,serviceHours){
    if(!vtNum(brutTotal)||brutTotal<=0||!vtNum(etp)||etp<=0)return null;
    var t=vtNum(taux)?taux:0,brut=brutTotal/etp,charge=brut*(1+t/100),hour=charge/169;
    return {brut:brut,charges:charge-brut,charged:charge,hour:hour,service:vtNum(serviceHours)?hour*serviceHours:null};
  }
  var VT_COPY={"fr": {"title": "Équipe", "kicker": "Votre équipe, mois par mois", "src_services": "D’après vos services", "src_settings": "Estimation d’après vos réglages", "fict": "Données fictives", "yCost": "Coût de l’équipe {y} (d’après vos services)", "yShare": "Part du CA", "yFte": "Temps pleins payés / que vos ventes peuvent payer", "yHour": "Coût d’une heure travaillée", "yReadOk": "La structure couvre l’équipe sur tous les mois de l’année.", "yReadWeak": "Mois où l’équipe coûte plus que ce que la structure peut payer : {list}.", "yReadModel": "La structure ne paie pas l’équipe : le levier est le prix moyen, les couverts ou les charges, pas l’effectif.", "chartK": "Budget équipe couvert · 100 % = l’équipe est payée par la structure", "chartLegend": "Plein : réel. Pointillé : projeté. Hachuré : mois fermé. Touchez un mois.", "kPast": "Réel", "kCur": "En cours", "kFut": "Projeté", "kOff": "Fermé", "mVerdict": "Vos ventes paient l’équipe à {p}", "mCA": "Chiffre d’affaires", "mCost": "Coût de l’équipe", "mPay": "Ce que vous pouvez dépenser en équipe (en gardant votre objectif)", "mPayBE": "Ce que vous pouvez dépenser en équipe sans perdre d’argent", "mGap": "Écart", "mHours": "Heures payées", "mUseful": "Heures passées en service (estimation)", "mRatio": "Heures payées pour 1 heure de service", "mFte": "Temps pleins payés / que vos ventes peuvent payer", "mLY": "Même mois {y}", "mLYv": "{ca} de CA · {h} h · {c}", "mCostN1": "Coût prévu si l’organisation de {y} est reprise.", "mCostRun": "Coût prévu au rythme actuel de l’équipe.", "mCostEst": "Coût estimé d’après vos réglages (aucune heure de service renseignée ce mois).", "pistesK": "Pistes à examiner · aucune décision sur une personne", "p1": "Laisser un contrat saisonnier arriver à son terme.", "p2": "Placer des congés sur les semaines creuses.", "p3": "Ne pas remplacer un départ déjà prévu.", "p4": "Réduire ou supprimer les extras.", "p5": "Réduire l’équipe ne suffit pas : revoir le prix moyen, les couverts ou les charges.", "calK": "Les journées", "calLegend": "Vert : équipe adaptée. Jaune : plus de monde que nécessaire. Orange : équipe tendue. Rouge : service noté débordé. Gris : à venir. Touchez un jour.", "dCA": "Chiffre d’affaires", "dHours": "Heures", "dPers": "Personnes", "dCost": "Coût de l’équipe", "dProd": "CA HT par heure", "dCap": "Capacité de l’équipe", "dCapV": "confortable jusqu’à {v} · déjà tenu jusqu’à {r}", "dMargin": "Marge", "dLY": "Même jour {y}", "dLYv": "{ca} · {p} pers. · {h} h", "dFore": "Prévu", "dForeV": "{lo} à {hi}", "dTeam": "Équipe habituelle", "dTeamV": "{p} pers. · {h} h", "dAdj": "Équipe prévue ce jour", "dWarn": "Au-delà de ce que cette équipe a déjà encaissé ({r}) : prévoyez un renfort.", "dLight": "Journée légère : bon moment pour la mise en place, l’inventaire, une formation ou un repos à récupérer.", "dOk": "L’équipe prévue couvre la journée avec de la marge.", "rateQ": "Le service était…", "rTenu": "👍 tenu", "rJuste": "😐 juste", "rDeb": "🔥 débordé", "noProd": "Il faut au moins 10 journées avec heures pour mesurer votre rythme tenu.", "costK": "Ce que coûte vraiment votre équipe", "c1": "Brut moyen par salarié", "c2": "Charges patronales ({t} %)", "c3": "Coût chargé par mois", "c4": "Coût d’une heure", "c5": "Coût d’un service de {h} h", "cSvc": "D’après vos services : {v} de l’heure en moyenne.", "cDiff": "Vos réglages donnent {a} par an, vos services {b} : à vérifier.", "cNo": "Renseignez les salaires dans Paramètres pour voir le coût réel.", "rule": "Analyse, jamais une consigne : Verdict ne propose aucune décision sur une personne. Un salarié en CDI ou en saisonnier n’est pas un levier du jour.", "noData": "Pas encore de données d’équipe : renseignez les salaires dans Paramètres ou les heures de vos services.", "open": "Voir l’équipe de ce mois", "back": "Retour à l’année", "notApplic": "Aucun salaire renseigné : la lecture de l’équipe ne s’applique pas.", "unitH": "h", "yNote": "Réel jusqu’au mois dernier, puis projeté.", "dTight": "Déjà tenu avec cette équipe (jusqu’à {r}), mais sans marge : gardez un renfort joignable.", "yPartial": "Calculé sur {n} mois renseignés sur {t} : les mois sans chiffre ne sont pas comptés à zéro.", "svcK": "Services de la journée", "svcLine": "{p} pers. · {h} h · {ca} · {prod} HT/h · coût {part}", "svcComp": "{st} · médiane des {n} derniers « {wd} · {lab} » : {prod} HT/h", "st_habituel": "habituel", "st_tendu": "équipe plus sollicitée que d’habitude", "st_large": "équipe plus large que d’habitude", "st_insuffisant": "pas encore assez de services comparables (4 nécessaires)", "slotsK": "Par service, ce mois-ci", "slotLine": "{n} services · CA moyen {ca} · {h} h · {prod} HT/h · coût {part}", "slotLow": "le moins productif du mois", "svcRule": "Lecture d’analyse : on compare des services, on ne désigne personne.", "slot_breakfast": "petit déjeuner", "slot_lunch": "midi", "slot_afternoon": "après-midi", "slot_dinner": "soir"}, "en": {"title": "Team", "kicker": "Your team, month by month", "src_services": "From your services", "src_settings": "Estimate from your settings", "fict": "Fictional data", "yCost": "Team cost {y}", "yShare": "Share of revenue", "yFte": "Full-time paid / sustainable", "yHour": "Cost of one hour worked", "yReadOk": "The structure covers the team in every month of the year.", "yReadWeak": "Months where the team costs more than the structure can pay: {list}.", "yReadModel": "The structure does not pay for the team: the lever is the average price, the covers or the costs, not the headcount.", "chartK": "Team budget covered · 100 % = the team is paid by the structure", "chartLegend": "Solid: actual. Dashed: projected. Hatched: closed month. Tap a month.", "kPast": "Actual", "kCur": "In progress", "kFut": "Projected", "kOff": "Closed", "mVerdict": "Team budget covered at {p}", "mCA": "Revenue", "mCost": "Team cost", "mPay": "Team budget (with your target)", "mPayBE": "Team budget at break-even", "mGap": "Gap", "mHours": "Hours paid", "mUseful": "Estimated useful hours", "mRatio": "Hours paid per useful hour", "mFte": "Full-time paid / sustainable", "mLY": "Same month {y}", "mLYv": "{ca} revenue · {h} h · {c}", "mCostN1": "Expected cost if the {y} organisation is repeated.", "mCostRun": "Expected cost at the team’s current pace.", "mCostEst": "Cost estimated from your settings (no service hours entered this month).", "pistesK": "Options to review · no decision about any person", "p1": "Let a seasonal contract reach its end.", "p2": "Schedule leave in the quiet weeks.", "p3": "Do not replace a departure already planned.", "p4": "Reduce or drop extras.", "p5": "Reducing the team is not enough: review the average price, the covers or the costs.", "calK": "The days", "calLegend": "Green: team suited. Yellow: team generous. Orange: team tight. Red: service rated overwhelmed. Grey: upcoming. Tap a day.", "dCA": "Revenue", "dHours": "Hours", "dPers": "People", "dCost": "Team cost", "dProd": "Revenue excl. VAT per hour", "dCap": "Team capacity", "dCapV": "comfortable up to {v} · already held up to {r}", "dMargin": "Margin", "dLY": "Same day {y}", "dLYv": "{ca} · {p} people · {h} h", "dFore": "Expected", "dForeV": "{lo} to {hi}", "dTeam": "Usual team", "dTeamV": "{p} people · {h} h", "dAdj": "Team planned this day", "dWarn": "Beyond what this team has ever collected ({r}): plan a backup.", "dLight": "Light day: a good time for prep, stock count, training or time off owed.", "dOk": "The planned team covers the day with room to spare.", "rateQ": "The service was…", "rTenu": "👍 held", "rJuste": "😐 tight", "rDeb": "🔥 overwhelmed", "noProd": "At least 10 days with hours are needed to measure your held pace.", "costK": "What your team really costs", "c1": "Average gross per employee", "c2": "Employer contributions ({t} %)", "c3": "Loaded cost per month", "c4": "Cost of one hour", "c5": "Cost of a {h} h service", "cSvc": "From your services: {v} per hour on average.", "cDiff": "Your settings give {a} per year, your services {b}: to check.", "cNo": "Enter salaries in Settings to see the real cost.", "rule": "Analysis, never an instruction: Verdict proposes no decision about any person. An employee on a permanent or seasonal contract is not a lever for the day.", "noData": "No team data yet: enter salaries in Settings or your service hours.", "open": "See the team for this month", "back": "Back to the year", "notApplic": "No salary entered: the team reading does not apply.", "unitH": "h", "yNote": "Actual up to last month, then projected.", "dTight": "Already held with this team (up to {r}), but with no margin: keep a backup reachable.", "yPartial": "Calculated over {n} of {t} months with figures: months without figures are not counted as zero.", "svcK": "Services of the day", "svcLine": "{p} people · {h} h · {ca} · {prod} excl. VAT/h · cost {part}", "svcComp": "{st} · median of the last {n} “{wd} · {lab}”: {prod} excl. VAT/h", "st_habituel": "usual", "st_tendu": "team busier than usual", "st_large": "team larger than usual for the business", "st_insuffisant": "not enough comparable services yet (4 needed)", "slotsK": "By service, this month", "slotLine": "{n} services · average {ca} · {h} h · {prod} excl. VAT/h · cost {part}", "slotLow": "the least productive this month", "svcRule": "Analysis only: we compare services, we never single anyone out.", "slot_breakfast": "breakfast", "slot_lunch": "lunch", "slot_afternoon": "afternoon", "slot_dinner": "dinner"}, "es": {"title": "Equipo", "kicker": "Su equipo, mes a mes", "src_services": "Según sus servicios", "src_settings": "Estimación según sus ajustes", "fict": "Datos ficticios", "yCost": "Coste del equipo {y}", "yShare": "Peso en los ingresos", "yFte": "Jornadas completas pagadas / sostenibles", "yHour": "Coste de una hora trabajada", "yReadOk": "La estructura cubre el equipo todos los meses del año.", "yReadWeak": "Meses en que el equipo cuesta más de lo que la estructura puede pagar: {list}.", "yReadModel": "La estructura no paga el equipo: la palanca es el precio medio, los cubiertos o los costes, no la plantilla.", "chartK": "Presupuesto de equipo cubierto · 100 % = la estructura paga el equipo", "chartLegend": "Lleno: real. Discontinuo: proyectado. Rayado: mes cerrado. Toque un mes.", "kPast": "Real", "kCur": "En curso", "kFut": "Proyectado", "kOff": "Cerrado", "mVerdict": "Presupuesto de equipo cubierto al {p}", "mCA": "Ingresos", "mCost": "Coste del equipo", "mPay": "Presupuesto de equipo (con su objetivo)", "mPayBE": "Presupuesto de equipo en el punto de equilibrio", "mGap": "Diferencia", "mHours": "Horas pagadas", "mUseful": "Horas útiles estimadas", "mRatio": "Horas pagadas por hora útil", "mFte": "Jornadas completas pagadas / sostenibles", "mLY": "Mismo mes {y}", "mLYv": "{ca} de ingresos · {h} h · {c}", "mCostN1": "Coste previsto si se repite la organización de {y}.", "mCostRun": "Coste previsto al ritmo actual del equipo.", "mCostEst": "Coste estimado según sus ajustes (sin horas de servicio este mes).", "pistesK": "Pistas a revisar · ninguna decisión sobre una persona", "p1": "Dejar que un contrato de temporada llegue a su término.", "p2": "Situar vacaciones en las semanas flojas.", "p3": "No sustituir una salida ya prevista.", "p4": "Reducir o suprimir los extras.", "p5": "Reducir el equipo no basta: revise el precio medio, los cubiertos o los costes.", "calK": "Las jornadas", "calLegend": "Verde: equipo adecuado. Amarillo: equipo amplio. Naranja: equipo justo. Rojo: servicio marcado como desbordado. Gris: por venir. Toque un día.", "dCA": "Ingresos", "dHours": "Horas", "dPers": "Personas", "dCost": "Coste del equipo", "dProd": "Ingresos sin IVA por hora", "dCap": "Capacidad del equipo", "dCapV": "cómodo hasta {v} · ya sostenido hasta {r}", "dMargin": "Margen", "dLY": "Mismo día {y}", "dLYv": "{ca} · {p} pers. · {h} h", "dFore": "Previsto", "dForeV": "{lo} a {hi}", "dTeam": "Equipo habitual", "dTeamV": "{p} pers. · {h} h", "dAdj": "Equipo previsto este día", "dWarn": "Por encima de lo que este equipo ya ha cobrado ({r}): prevea un refuerzo.", "dLight": "Jornada tranquila: buen momento para la mise en place, el inventario, una formación o un descanso pendiente.", "dOk": "El equipo previsto cubre la jornada con margen.", "rateQ": "El servicio fue…", "rTenu": "👍 sostenido", "rJuste": "😐 justo", "rDeb": "🔥 desbordado", "noProd": "Se necesitan al menos 10 jornadas con horas para medir su ritmo sostenido.", "costK": "Lo que cuesta realmente su equipo", "c1": "Bruto medio por empleado", "c2": "Cotizaciones patronales ({t} %)", "c3": "Coste total por mes", "c4": "Coste de una hora", "c5": "Coste de un servicio de {h} h", "cSvc": "Según sus servicios: {v} por hora de media.", "cDiff": "Sus ajustes dan {a} al año, sus servicios {b}: a verificar.", "cNo": "Indique los salarios en Ajustes para ver el coste real.", "rule": "Análisis, nunca una orden: Verdict no propone ninguna decisión sobre una persona. Un empleado indefinido o de temporada no es una palanca del día.", "noData": "Aún no hay datos de equipo: indique los salarios en Ajustes o las horas de sus servicios.", "open": "Ver el equipo de este mes", "back": "Volver al año", "notApplic": "Ningún salario indicado: la lectura del equipo no se aplica.", "unitH": "h", "yNote": "Real hasta el mes pasado, luego proyectado.", "dTight": "Ya sostenido con este equipo (hasta {r}), pero sin margen: tenga un refuerzo localizable.", "yPartial": "Calculado sobre {n} de {t} meses con datos: los meses sin cifras no cuentan como cero.", "svcK": "Servicios del día", "svcLine": "{p} pers. · {h} h · {ca} · {prod} sin IVA/h · coste {part}", "svcComp": "{st} · mediana de los últimos {n} «{wd} · {lab}»: {prod} sin IVA/h", "st_habituel": "habitual", "st_tendu": "equipo más exigido de lo habitual", "st_large": "equipo más amplio de lo habitual", "st_insuffisant": "aún no hay suficientes servicios comparables (4 necesarios)", "slotsK": "Por servicio, este mes", "slotLine": "{n} servicios · media {ca} · {h} h · {prod} sin IVA/h · coste {part}", "slotLow": "el menos productivo del mes", "svcRule": "Lectura de análisis: se comparan servicios, no se señala a nadie.", "slot_breakfast": "desayuno", "slot_lunch": "mediodía", "slot_afternoon": "tarde", "slot_dinner": "noche"}, "it": {"title": "Squadra", "kicker": "La sua squadra, mese per mese", "src_services": "Secondo i suoi servizi", "src_settings": "Stima secondo le sue impostazioni", "fict": "Dati fittizi", "yCost": "Costo della squadra {y}", "yShare": "Incidenza sui ricavi", "yFte": "Tempi pieni pagati / sostenibili", "yHour": "Costo di un’ora lavorata", "yReadOk": "La struttura copre la squadra in tutti i mesi dell’anno.", "yReadWeak": "Mesi in cui la squadra costa più di quanto la struttura possa pagare: {list}.", "yReadModel": "La struttura non paga la squadra: la leva è il prezzo medio, i coperti o i costi, non l’organico.", "chartK": "Budget squadra coperto · 100 % = la squadra è pagata dalla struttura", "chartLegend": "Pieno: reale. Tratteggiato: proiettato. Retinato: mese chiuso. Tocchi un mese.", "kPast": "Reale", "kCur": "In corso", "kFut": "Proiettato", "kOff": "Chiuso", "mVerdict": "Budget squadra coperto al {p}", "mCA": "Ricavi", "mCost": "Costo della squadra", "mPay": "Budget squadra (con il suo obiettivo)", "mPayBE": "Budget squadra al punto di pareggio", "mGap": "Scarto", "mHours": "Ore pagate", "mUseful": "Ore utili stimate", "mRatio": "Ore pagate per un’ora utile", "mFte": "Tempi pieni pagati / sostenibili", "mLY": "Stesso mese {y}", "mLYv": "{ca} di ricavi · {h} h · {c}", "mCostN1": "Costo previsto se si riprende l’organizzazione del {y}.", "mCostRun": "Costo previsto al ritmo attuale della squadra.", "mCostEst": "Costo stimato secondo le impostazioni (nessuna ora di servizio inserita questo mese).", "pistesK": "Piste da esaminare · nessuna decisione su una persona", "p1": "Lasciare che un contratto stagionale arrivi a scadenza.", "p2": "Collocare le ferie nelle settimane tranquille.", "p3": "Non sostituire una partenza già prevista.", "p4": "Ridurre o eliminare gli extra.", "p5": "Ridurre la squadra non basta: rivedere il prezzo medio, i coperti o i costi.", "calK": "Le giornate", "calLegend": "Verde: squadra adeguata. Giallo: squadra abbondante. Arancione: squadra giusta. Rosso: servizio segnato come travolto. Grigio: in arrivo. Tocchi un giorno.", "dCA": "Ricavi", "dHours": "Ore", "dPers": "Persone", "dCost": "Costo della squadra", "dProd": "Ricavi IVA esclusa per ora", "dCap": "Capacità della squadra", "dCapV": "comodo fino a {v} · già retto fino a {r}", "dMargin": "Margine", "dLY": "Stesso giorno {y}", "dLYv": "{ca} · {p} pers. · {h} h", "dFore": "Previsto", "dForeV": "da {lo} a {hi}", "dTeam": "Squadra abituale", "dTeamV": "{p} pers. · {h} h", "dAdj": "Squadra prevista oggi", "dWarn": "Oltre quanto questa squadra abbia mai incassato ({r}): preveda un rinforzo.", "dLight": "Giornata leggera: buon momento per la mise en place, l’inventario, una formazione o un riposo da recuperare.", "dOk": "La squadra prevista copre la giornata con margine.", "rateQ": "Il servizio è stato…", "rTenu": "👍 tenuto", "rJuste": "😐 al limite", "rDeb": "🔥 travolto", "noProd": "Servono almeno 10 giornate con ore per misurare il suo ritmo sostenuto.", "costK": "Quanto costa davvero la sua squadra", "c1": "Lordo medio per dipendente", "c2": "Contributi a carico del datore ({t} %)", "c3": "Costo totale al mese", "c4": "Costo di un’ora", "c5": "Costo di un servizio di {h} h", "cSvc": "Secondo i suoi servizi: {v} l’ora in media.", "cDiff": "Le impostazioni danno {a} all’anno, i servizi {b}: da verificare.", "cNo": "Inserisca gli stipendi nelle Impostazioni per vedere il costo reale.", "rule": "Analisi, mai un ordine: Verdict non propone alcuna decisione su una persona. Un dipendente a tempo indeterminato o stagionale non è una leva del giorno.", "noData": "Ancora nessun dato sulla squadra: inserisca gli stipendi nelle Impostazioni o le ore dei servizi.", "open": "Vedi la squadra di questo mese", "back": "Torna all’anno", "notApplic": "Nessuno stipendio inserito: la lettura della squadra non si applica.", "unitH": "h", "yNote": "Reale fino al mese scorso, poi proiettato.", "dTight": "Già retto con questa squadra (fino a {r}), ma senza margine: tenga un rinforzo reperibile.", "yPartial": "Calcolato su {n} mesi con dati su {t}: i mesi senza cifre non contano come zero.", "svcK": "Servizi della giornata", "svcLine": "{p} pers. · {h} h · {ca} · {prod} IVA escl./h · costo {part}", "svcComp": "{st} · mediana degli ultimi {n} «{wd} · {lab}»: {prod} IVA escl./h", "st_habituel": "abituale", "st_tendu": "squadra più sollecitata del solito", "st_large": "squadra più ampia del solito", "st_insuffisant": "non ancora abbastanza servizi comparabili (ne servono 4)", "slotsK": "Per servizio, questo mese", "slotLine": "{n} servizi · media {ca} · {h} h · {prod} IVA escl./h · costo {part}", "slotLow": "il meno produttivo del mese", "svcRule": "Lettura di analisi: si confrontano servizi, non si indica nessuno.", "slot_breakfast": "colazione", "slot_lunch": "pranzo", "slot_afternoon": "pomeriggio", "slot_dinner": "cena"}, "de": {"title": "Team", "kicker": "Ihr Team, Monat für Monat", "src_services": "Aus Ihren Services", "src_settings": "Schätzung aus Ihren Einstellungen", "fict": "Fiktive Daten", "yCost": "Teamkosten {y}", "yShare": "Anteil am Umsatz", "yFte": "Bezahlte / tragbare Vollzeitstellen", "yHour": "Kosten einer Arbeitsstunde", "yReadOk": "Die Struktur trägt das Team in allen Monaten des Jahres.", "yReadWeak": "Monate, in denen das Team mehr kostet, als die Struktur tragen kann: {list}.", "yReadModel": "Die Struktur trägt das Team nicht: der Hebel ist der Durchschnittspreis, die Gedecke oder die Kosten, nicht die Besetzung.", "chartK": "Teambudget gedeckt · 100 % = die Struktur bezahlt das Team", "chartLegend": "Voll: Ist. Gestrichelt: Prognose. Schraffiert: geschlossener Monat. Tippen Sie auf einen Monat.", "kPast": "Ist", "kCur": "Laufend", "kFut": "Prognose", "kOff": "Geschlossen", "mVerdict": "Teambudget zu {p} gedeckt", "mCA": "Umsatz", "mCost": "Teamkosten", "mPay": "Teambudget (mit Ihrem Ziel)", "mPayBE": "Teambudget am Break-even", "mGap": "Abweichung", "mHours": "Bezahlte Stunden", "mUseful": "Geschätzte nützliche Stunden", "mRatio": "Bezahlte Stunden je nützliche Stunde", "mFte": "Bezahlte / tragbare Vollzeitstellen", "mLY": "Gleicher Monat {y}", "mLYv": "{ca} Umsatz · {h} h · {c}", "mCostN1": "Erwartete Kosten bei gleicher Organisation wie {y}.", "mCostRun": "Erwartete Kosten im aktuellen Tempo des Teams.", "mCostEst": "Kosten aus Ihren Einstellungen geschätzt (keine Servicestunden in diesem Monat).", "pistesK": "Zu prüfende Optionen · keine Entscheidung über eine Person", "p1": "Einen Saisonvertrag regulär auslaufen lassen.", "p2": "Urlaub in ruhige Wochen legen.", "p3": "Einen bereits geplanten Abgang nicht ersetzen.", "p4": "Aushilfen reduzieren oder streichen.", "p5": "Das Team zu verkleinern reicht nicht: Durchschnittspreis, Gedecke oder Kosten prüfen.", "calK": "Die Tage", "calLegend": "Grün: Team passend. Gelb: Team großzügig. Orange: Team knapp. Rot: Service als überlastet markiert. Grau: kommend. Tippen Sie auf einen Tag.", "dCA": "Umsatz", "dHours": "Stunden", "dPers": "Personen", "dCost": "Teamkosten", "dProd": "Nettoumsatz pro Stunde", "dCap": "Kapazität des Teams", "dCapV": "komfortabel bis {v} · schon gehalten bis {r}", "dMargin": "Spielraum", "dLY": "Gleicher Tag {y}", "dLYv": "{ca} · {p} Pers. · {h} h", "dFore": "Erwartet", "dForeV": "{lo} bis {hi}", "dTeam": "Übliches Team", "dTeamV": "{p} Pers. · {h} h", "dAdj": "Geplantes Team an diesem Tag", "dWarn": "Über dem, was dieses Team je eingenommen hat ({r}): planen Sie eine Verstärkung.", "dLight": "Ruhiger Tag: guter Moment für Mise en place, Inventur, Schulung oder fälligen Ausgleich.", "dOk": "Das geplante Team deckt den Tag mit Spielraum.", "rateQ": "Der Service war…", "rTenu": "👍 gehalten", "rJuste": "😐 knapp", "rDeb": "🔥 überlastet", "noProd": "Mindestens 10 Tage mit Stunden sind nötig, um Ihr gehaltenes Tempo zu messen.", "costK": "Was Ihr Team wirklich kostet", "c1": "Durchschnittliches Brutto je Mitarbeiter", "c2": "Arbeitgeberbeiträge ({t} %)", "c3": "Gesamtkosten pro Monat", "c4": "Kosten einer Stunde", "c5": "Kosten eines Services von {h} h", "cSvc": "Aus Ihren Services: durchschnittlich {v} pro Stunde.", "cDiff": "Ihre Einstellungen ergeben {a} pro Jahr, Ihre Services {b}: zu prüfen.", "cNo": "Tragen Sie die Gehälter in den Einstellungen ein, um die echten Kosten zu sehen.", "rule": "Analyse, nie eine Anweisung: Verdict schlägt keine Entscheidung über eine Person vor. Ein unbefristet oder saisonal Beschäftigter ist kein Hebel des Tages.", "noData": "Noch keine Teamdaten: tragen Sie Gehälter in den Einstellungen oder die Stunden Ihrer Services ein.", "open": "Team dieses Monats ansehen", "back": "Zurück zum Jahr", "notApplic": "Kein Gehalt eingetragen: die Teamlesung gilt nicht.", "unitH": "h", "yNote": "Ist bis zum Vormonat, danach Prognose.", "dTight": "Mit diesem Team schon gehalten (bis {r}), aber ohne Spielraum: halten Sie eine Verstärkung erreichbar.", "yPartial": "Berechnet über {n} von {t} Monaten mit Zahlen: Monate ohne Zahlen zählen nicht als null.", "svcK": "Services des Tages", "svcLine": "{p} Pers. · {h} h · {ca} · {prod} netto/h · Kosten {part}", "svcComp": "{st} · Median der letzten {n} „{wd} · {lab}“: {prod} netto/h", "st_habituel": "üblich", "st_tendu": "Team stärker gefordert als üblich", "st_large": "Team großzügiger als üblich", "st_insuffisant": "noch nicht genug vergleichbare Services (4 nötig)", "slotsK": "Nach Service, diesen Monat", "slotLine": "{n} Services · Ø {ca} · {h} h · {prod} netto/h · Kosten {part}", "slotLow": "am wenigsten produktiv diesen Monat", "svcRule": "Nur Analyse: Services werden verglichen, niemand wird benannt.", "slot_breakfast": "Frühstück", "slot_lunch": "Mittag", "slot_afternoon": "Nachmittag", "slot_dinner": "Abend"}, "nl": {"title": "Team", "kicker": "Uw team, maand per maand", "src_services": "Volgens uw diensten", "src_settings": "Schatting volgens uw instellingen", "fict": "Fictieve gegevens", "yCost": "Teamkosten {y}", "yShare": "Aandeel in de omzet", "yFte": "Betaalde / houdbare voltijdsbanen", "yHour": "Kosten van een gewerkt uur", "yReadOk": "De structuur dekt het team in alle maanden van het jaar.", "yReadWeak": "Maanden waarin het team meer kost dan de structuur kan betalen: {list}.", "yReadModel": "De structuur betaalt het team niet: de hefboom is de gemiddelde prijs, de couverts of de kosten, niet de bezetting.", "chartK": "Teambudget gedekt · 100 % = het team wordt door de structuur betaald", "chartLegend": "Vol: werkelijk. Gestippeld: prognose. Gearceerd: gesloten maand. Tik op een maand.", "kPast": "Werkelijk", "kCur": "Lopend", "kFut": "Prognose", "kOff": "Gesloten", "mVerdict": "Teambudget gedekt voor {p}", "mCA": "Omzet", "mCost": "Teamkosten", "mPay": "Teambudget (met uw doel)", "mPayBE": "Teambudget op break-even", "mGap": "Verschil", "mHours": "Betaalde uren", "mUseful": "Geschatte nuttige uren", "mRatio": "Betaalde uren per nuttig uur", "mFte": "Betaalde / houdbare voltijdsbanen", "mLY": "Zelfde maand {y}", "mLYv": "{ca} omzet · {h} u · {c}", "mCostN1": "Verwachte kosten als de organisatie van {y} wordt herhaald.", "mCostRun": "Verwachte kosten op het huidige tempo van het team.", "mCostEst": "Kosten geschat volgens uw instellingen (geen dienstsuren deze maand).", "pistesK": "Te bekijken opties · geen beslissing over een persoon", "p1": "Een seizoenscontract laten aflopen.", "p2": "Verlof inplannen in de rustige weken.", "p3": "Een gepland vertrek niet vervangen.", "p4": "Extra’s verminderen of schrappen.", "p5": "Het team verkleinen volstaat niet: bekijk de gemiddelde prijs, de couverts of de kosten.", "calK": "De dagen", "calLegend": "Groen: team passend. Geel: team ruim. Oranje: team krap. Rood: dienst gemarkeerd als overspoeld. Grijs: komend. Tik op een dag.", "dCA": "Omzet", "dHours": "Uren", "dPers": "Personen", "dCost": "Teamkosten", "dProd": "Omzet excl. btw per uur", "dCap": "Capaciteit van het team", "dCapV": "comfortabel tot {v} · al gehouden tot {r}", "dMargin": "Marge", "dLY": "Zelfde dag {y}", "dLYv": "{ca} · {p} pers. · {h} u", "dFore": "Verwacht", "dForeV": "{lo} tot {hi}", "dTeam": "Gewoon team", "dTeamV": "{p} pers. · {h} u", "dAdj": "Gepland team deze dag", "dWarn": "Boven wat dit team ooit ontving ({r}): plan een versterking.", "dLight": "Rustige dag: goed moment voor mise-en-place, inventaris, opleiding of in te halen rust.", "dOk": "Het geplande team dekt de dag met ruimte over.", "rateQ": "De dienst was…", "rTenu": "👍 gehouden", "rJuste": "😐 krap", "rDeb": "🔥 overspoeld", "noProd": "Minstens 10 dagen met uren zijn nodig om uw gehouden tempo te meten.", "costK": "Wat uw team echt kost", "c1": "Gemiddeld bruto per werknemer", "c2": "Werkgeversbijdragen ({t} %)", "c3": "Totale kosten per maand", "c4": "Kosten van een uur", "c5": "Kosten van een dienst van {h} u", "cSvc": "Volgens uw diensten: gemiddeld {v} per uur.", "cDiff": "Uw instellingen geven {a} per jaar, uw diensten {b}: na te gaan.", "cNo": "Vul de lonen in bij Instellingen om de echte kosten te zien.", "rule": "Analyse, nooit een opdracht: Verdict stelt geen beslissing over een persoon voor. Een werknemer met vast of seizoenscontract is geen hefboom van de dag.", "noData": "Nog geen teamgegevens: vul de lonen in bij Instellingen of de uren van uw diensten.", "open": "Bekijk het team van deze maand", "back": "Terug naar het jaar", "notApplic": "Geen loon ingevuld: de teamlezing is niet van toepassing.", "unitH": "u", "yNote": "Werkelijk tot vorige maand, daarna prognose.", "dTight": "Al gehouden met dit team (tot {r}), maar zonder marge: houd een versterking bereikbaar.", "yPartial": "Berekend over {n} van {t} maanden met cijfers: maanden zonder cijfers tellen niet als nul.", "svcK": "Diensten van de dag", "svcLine": "{p} pers. · {h} u · {ca} · {prod} excl. btw/u · kosten {part}", "svcComp": "{st} · mediaan van de laatste {n} „{wd} · {lab}”: {prod} excl. btw/u", "st_habituel": "gebruikelijk", "st_tendu": "team drukker dan gewoonlijk", "st_large": "team ruimer dan gewoonlijk", "st_insuffisant": "nog niet genoeg vergelijkbare diensten (4 nodig)", "slotsK": "Per dienst, deze maand", "slotLine": "{n} diensten · gem. {ca} · {h} u · {prod} excl. btw/u · kosten {part}", "slotLow": "het minst productief deze maand", "svcRule": "Alleen analyse: we vergelijken diensten, niemand wordt aangewezen.", "slot_breakfast": "ontbijt", "slot_lunch": "lunch", "slot_afternoon": "middag", "slot_dinner": "diner"}, "pt": {"title": "Equipa", "kicker": "A sua equipa, mês a mês", "src_services": "Segundo os seus serviços", "src_settings": "Estimativa segundo as suas definições", "fict": "Dados fictícios", "yCost": "Custo da equipa {y}", "yShare": "Peso nas receitas", "yFte": "Tempos inteiros pagos / sustentáveis", "yHour": "Custo de uma hora trabalhada", "yReadOk": "A estrutura cobre a equipa em todos os meses do ano.", "yReadWeak": "Meses em que a equipa custa mais do que a estrutura pode pagar: {list}.", "yReadModel": "A estrutura não paga a equipa: a alavanca é o preço médio, os talheres ou os custos, não o efetivo.", "chartK": "Orçamento da equipa coberto · 100 % = a equipa é paga pela estrutura", "chartLegend": "Cheio: real. Tracejado: projetado. Hachurado: mês fechado. Toque num mês.", "kPast": "Real", "kCur": "Em curso", "kFut": "Projetado", "kOff": "Fechado", "mVerdict": "Orçamento da equipa coberto a {p}", "mCA": "Receita", "mCost": "Custo da equipa", "mPay": "Orçamento da equipa (com o seu objetivo)", "mPayBE": "Orçamento da equipa no ponto de equilíbrio", "mGap": "Diferença", "mHours": "Horas pagas", "mUseful": "Horas úteis estimadas", "mRatio": "Horas pagas por hora útil", "mFte": "Tempos inteiros pagos / sustentáveis", "mLY": "Mesmo mês {y}", "mLYv": "{ca} de receita · {h} h · {c}", "mCostN1": "Custo previsto se a organização de {y} for repetida.", "mCostRun": "Custo previsto ao ritmo atual da equipa.", "mCostEst": "Custo estimado segundo as suas definições (sem horas de serviço neste mês).", "pistesK": "Pistas a analisar · nenhuma decisão sobre uma pessoa", "p1": "Deixar um contrato sazonal chegar ao fim.", "p2": "Marcar férias nas semanas fracas.", "p3": "Não substituir uma saída já prevista.", "p4": "Reduzir ou suprimir os extras.", "p5": "Reduzir a equipa não chega: rever o preço médio, os talheres ou os custos.", "calK": "Os dias", "calLegend": "Verde: equipa ajustada. Amarelo: equipa folgada. Laranja: equipa justa. Vermelho: serviço marcado como ultrapassado. Cinzento: por vir. Toque num dia.", "dCA": "Receita", "dHours": "Horas", "dPers": "Pessoas", "dCost": "Custo da equipa", "dProd": "Receita sem IVA por hora", "dCap": "Capacidade da equipa", "dCapV": "confortável até {v} · já aguentado até {r}", "dMargin": "Margem", "dLY": "Mesmo dia {y}", "dLYv": "{ca} · {p} pess. · {h} h", "dFore": "Previsto", "dForeV": "{lo} a {hi}", "dTeam": "Equipa habitual", "dTeamV": "{p} pess. · {h} h", "dAdj": "Equipa prevista neste dia", "dWarn": "Acima do que esta equipa já recebeu ({r}): preveja um reforço.", "dLight": "Dia calmo: bom momento para a mise en place, o inventário, uma formação ou um descanso a recuperar.", "dOk": "A equipa prevista cobre o dia com margem.", "rateQ": "O serviço foi…", "rTenu": "👍 aguentado", "rJuste": "😐 justo", "rDeb": "🔥 ultrapassado", "noProd": "São necessários pelo menos 10 dias com horas para medir o seu ritmo sustentado.", "costK": "O que custa realmente a sua equipa", "c1": "Bruto médio por trabalhador", "c2": "Contribuições patronais ({t} %)", "c3": "Custo total por mês", "c4": "Custo de uma hora", "c5": "Custo de um serviço de {h} h", "cSvc": "Segundo os seus serviços: {v} por hora em média.", "cDiff": "As suas definições dão {a} por ano, os seus serviços {b}: a verificar.", "cNo": "Indique os salários nas Definições para ver o custo real.", "rule": "Análise, nunca uma ordem: o Verdict não propõe nenhuma decisão sobre uma pessoa. Um trabalhador efetivo ou sazonal não é uma alavanca do dia.", "noData": "Ainda sem dados da equipa: indique os salários nas Definições ou as horas dos seus serviços.", "open": "Ver a equipa deste mês", "back": "Voltar ao ano", "notApplic": "Nenhum salário indicado: a leitura da equipa não se aplica.", "unitH": "h", "yNote": "Real até ao mês passado, depois projetado.", "dTight": "Já aguentado com esta equipa (até {r}), mas sem margem: mantenha um reforço contactável.", "yPartial": "Calculado sobre {n} de {t} meses com números: os meses sem números não contam como zero.", "svcK": "Serviços do dia", "svcLine": "{p} pess. · {h} h · {ca} · {prod} sem IVA/h · custo {part}", "svcComp": "{st} · mediana dos últimos {n} «{wd} · {lab}»: {prod} sem IVA/h", "st_habituel": "habitual", "st_tendu": "equipa mais solicitada do que o habitual", "st_large": "equipa mais folgada do que o habitual", "st_insuffisant": "ainda não há serviços comparáveis suficientes (4 necessários)", "slotsK": "Por serviço, este mês", "slotLine": "{n} serviços · média {ca} · {h} h · {prod} sem IVA/h · custo {part}", "slotLow": "o menos produtivo do mês", "svcRule": "Leitura de análise: comparam-se serviços, não se aponta ninguém.", "slot_breakfast": "pequeno-almoço", "slot_lunch": "almoço", "slot_afternoon": "tarde", "slot_dinner": "jantar"}};
  VT_COPY["fr"].slotHelp="Chaque ligne regroupe les services du même jour et créneau ce mois-ci. CA moyen TTC et heures moyennes ; HT/h = CA HT ÷ heures ; coût = coût chargé de l’équipe ÷ CA HT. Un seul service ne suffit pas pour conclure.";VT_COPY["fr"].dayNoData="Aucune donnée de service disponible pour ce jour.";
VT_COPY["en"].slotHelp="Each line groups services from the same weekday and time slot this month. Average sales include VAT; sales per hour exclude VAT; team cost is the share of sales excluding VAT. One service is not enough for a conclusion.";VT_COPY["en"].dayNoData="No service data is available for this day.";
VT_COPY["es"].slotHelp="Cada línea agrupa los servicios del mismo día y turno de este mes. Ventas medias con IVA; ventas por hora sin IVA; coste del equipo como parte de las ventas sin IVA. Un solo servicio no basta para concluir.";VT_COPY["es"].dayNoData="No hay datos de servicio para este día.";
VT_COPY["it"].slotHelp="Ogni riga raggruppa i servizi dello stesso giorno e turno del mese. Incasso medio con IVA, incasso orario senza IVA e costo del personale sul fatturato senza IVA. Un solo servizio non basta per concludere.";VT_COPY["it"].dayNoData="Nessun dato di servizio disponibile per questo giorno.";
VT_COPY["de"].slotHelp="Jede Zeile gruppiert Dienste desselben Wochentags und Zeitfensters in diesem Monat. Durchschnittsumsatz mit MwSt.; Umsatz je Stunde ohne MwSt.; Teamkosten als Anteil am Umsatz ohne MwSt. Ein Dienst reicht nicht für ein Urteil.";VT_COPY["de"].dayNoData="Für diesen Tag liegen keine Dienstdaten vor.";
VT_COPY["nl"].slotHelp="Elke regel groepeert diensten op dezelfde weekdag en hetzelfde dagdeel deze maand. Gemiddelde omzet inclusief btw, omzet per uur exclusief btw en teamkosten als deel van de omzet exclusief btw. Eén dienst is te weinig voor een conclusie.";VT_COPY["nl"].dayNoData="Er zijn geen dienstgegevens voor deze dag.";
VT_COPY["pt"].slotHelp="Cada linha agrupa serviços do mesmo dia da semana e turno deste mês. Vendas médias com IVA, vendas por hora sem IVA e custo da equipa como parte das vendas sem IVA. Um único serviço não permite concluir.";VT_COPY["pt"].dayNoData="Não há dados de serviço para este dia.";
  function vtC(){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}return VT_COPY[l]||VT_COPY.fr;}
  function vtF(t,o){return String(t).replace(/\{(\w+)\}/g,function(m,k){return o&&o[k]!=null?o[k]:m;});}
  function vtE(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function vtTag(){try{return typeof root.localeTag==='function'?root.localeTag():'fr-FR';}catch(e){return 'fr-FR';}}
  function vtEur(v){if(!vtNum(v))return '—';var s=new Intl.NumberFormat(vtTag(),{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Math.round(Math.abs(v)));return (v<0&&Math.round(Math.abs(v))>0?'\u2212':'')+s;}
  function vtEur2(v){if(!vtNum(v))return '—';return new Intl.NumberFormat(vtTag(),{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(v);}
  function vtN(v,d){if(!vtNum(v))return '—';return v.toLocaleString(vtTag(),{minimumFractionDigits:d||0,maximumFractionDigits:d||0});}
  function vtPct(r){return vtNum(r)?(r*100).toLocaleString(vtTag(),{minimumFractionDigits:1,maximumFractionDigits:1})+'\u00a0%':'—';}
  function vtMonth(i){try{var s=new Intl.DateTimeFormat(vtTag(),{month:'long'}).format(new Date(2026,i,1,12));return s.charAt(0).toUpperCase()+s.slice(1);}catch(e){return String(i+1);}}
  function vtMonthShort(i){try{return new Intl.DateTimeFormat(vtTag(),{month:'narrow'}).format(new Date(2026,i,1,12)).toUpperCase();}catch(e){return String(i+1);}}
  function vtDayLabel(iso){try{var p=iso.split('-');return new Intl.DateTimeFormat(vtTag(),{weekday:'long',day:'numeric',month:'long'}).format(new Date(+p[0],+p[1]-1,+p[2],12));}catch(e){return iso;}}
  var VT_COL={vert:'#22c55e',jaune:'#eab308',orange:'#f97316',rouge:'#ef4444',info:'#64748b'};
  var vtSel={m:null,d:null},vtCache={sig:null,model:null};
  function vtISO(dt){return dt.getFullYear()+'-'+('0'+(dt.getMonth()+1)).slice(-2)+'-'+('0'+dt.getDate()).slice(-2);}
  function vtSig(){var d=root.DB||{},s=d.services||[],h=d.histJour||[],last=s.length?s[s.length-1]:null,clk='';try{clk=root.verdictOperationalClock().key;}catch(e){}
    return [d.establishmentId||d.etab||'',clk,s.length,h.length,last?last.d+':'+last.h+':'+last.ca:'',JSON.stringify(d.teamDayAdj||{}).length,JSON.stringify(d.teamDayRatings||{}).length,(d.in&&[d.in.salb,d.in.saln,d.in.salt,d.in.dirb,d.in.dirn].join(','))||''].join('|');}
  /* Modèle de l'année : réel des services, projection du CA (« Mon année »), budget payable de la structure. */
  function vtBuild(R){
    var d=R&&R.d||{},clock=root.verdictOperationalClock(),key=clock.key,year=Number(key.slice(0,4)),ci=Number(key.slice(5,7))-1;
    var tva=vtNum(d.tva)?d.tva:0,mcRate=(d.ca>0&&vtNum(d.mc))?d.mc/d.ca:null,cfOther=(vtNum(d.cf)&&vtNum(d.sal))?(d.cf-d.sal)/12:null,objM=(vtNum(d.obj)&&d.obj>0)?d.obj/12:0;
    var DBx=root.DB||{},S=DBx.services||[],aggY=vtAggregate(S,year),aggLY=vtAggregate(S,year-1),fict=S.some(function(s){return s&&(s.fictional||s.demo);});
    var ratings=DBx.teamDayRatings||{},adj=DBx.teamDayAdj||{};
    var API=root.VerdictPerformanceIntegrated,cap=[],capLY=[],i;
    try{var pl=API.createSeasonPlan(R,String(year),1,{});for(i=0;i<12;i++)cap.push(Number(pl.openDayCapacity[year+'-'+('0'+(i+1)).slice(-2)])||0);}catch(e){for(i=0;i<12;i++)cap.push(0);}
    var proj=null,projMonths=null,growth=1;
    try{var VA=root.VerdictAnnualProjection,inp=VA.input(R);if(!inp.error){proj=VA.coreN1(inp);if(proj&&proj.available){projMonths=proj.months.map(function(m){return m.value;});growth=proj.growth||proj.pace||1;}
      /* C213 (W12) : sans projection, aucun chiffre d'affaires n'est prêté au mois en cours ni aux mois à venir. */}}catch(e){}
    /* toutes les journées connues, triées */
    var allDays=[];[aggLY,aggY].forEach(function(A){A.forEach(function(m){for(var k in m.days)allDays.push({date:k,ca:m.days[k].ca,hours:m.days[k].hours,cost:m.days[k].cost,pers:m.days[k].pers,event:m.days[k].event});});});
    allDays.sort(function(a,b){return a.date<b.date?-1:1;});
    var past=allDays.filter(function(x){return x.date<=key;}),recent=past.slice(-28),recentProd=past.slice(-120);
    var tenu=recentProd.filter(function(x){return ratings[x.date]==='tenu';});
    var prod=vtProductivity(tenu.length>=10?tenu:recentProd,tva);prod.fromRatings=tenu.length>=10;
    var lastYearDays=past.slice(-365),rated=lastYearDays.filter(function(x){return ratings[x.date]&&ratings[x.date]!=='tenu';}).map(function(x){return x.date;});
    var refDays=lastYearDays.filter(function(x){return rated.indexOf(x.date)<0;});
    var avgCost=null,avgHours=null;if(recent.length){var sc=0,sh=0;recent.forEach(function(x){sc+=x.cost;sh+=x.hours;});avgCost=sc/recent.length;avgHours=sh/recent.length;}
    var etp=vtNum(d.etp)&&d.etp>0?d.etp:null,salM=vtNum(d.salM)?d.salM:null,hourSettings=(salM&&etp)?salM/(etp*169):null;
    var hasPay=(salM&&salM>0)||S.length>0;
    var months=[];
    for(i=0;i<12;i++){
      var A=aggY[i],L=aggLY[i],m={i:i,kind:'future',ca:null,cost:null,hours:null,src:null,lyCa:L.hasData?L.ca:null,lyCost:L.hasData?L.cost:null,lyHours:L.hasData?L.hours:null,cap:cap[i]};
      var pm=projMonths?projMonths[i]:null;
      if(i<ci){m.kind='past';if(A.hasData){m.ca=A.ca;m.cost=A.cost;m.hours=A.hours;m.src='services';}else{var hc=0,hasH=false;(DBx.histJour||[]).forEach(function(r){var k=String(r.date);if(k.slice(0,7)===year+'-'+('0'+(i+1)).slice(-2)&&typeof r.caJ==='number'){hc+=r.caJ;hasH=true;}});
          if(hasH){m.ca=hc;m.cost=cap[i]>0?salM:0;m.src='est';}}}
      else if(i===ci){m.kind='current';var doneDays=Object.keys(A.days).length,rem=Math.max(0,cap[i]-doneDays);
        m.ca=vtNum(pm)?pm:(A.hasData?A.ca:null);m.cost=A.cost+(avgCost!=null?avgCost*rem:0);m.hours=A.hours+(avgHours!=null?avgHours*rem:0);m.src=avgCost!=null?'run':'est';m.costToDate=A.cost;m.caToDate=A.ca;
        if(avgCost==null){m.cost=salM;m.hours=null;}}
      else{m.ca=vtNum(pm)?pm:null;
        if(L.hasData){m.cost=L.cost;m.hours=L.hours;m.src='n1';}
        else if(avgCost!=null&&cap[i]>0){m.cost=avgCost*cap[i];m.hours=avgHours*cap[i];m.src='run';}
        else if(cap[i]>0){m.cost=salM;m.src='est';}else{m.cost=0;}}
      if(cap[i]===0&&!(m.ca>0)&&!A.hasData)m.kind='off';
      var pay=vtNum(m.ca)?vtPayable(m.ca,tva,mcRate,cfOther,objM):null;m.pay=pay;
      m.coverage=(pay&&vtNum(m.cost))?vtCoverage(pay.withObjective,m.cost):null;m.status=m.kind==='off'?'off':vtStatus(m.coverage);
      var hr=(vtNum(m.hours)&&m.hours>0&&vtNum(m.cost))?m.cost/m.hours:hourSettings;m.costHour=hr;
      m.useful=(prod.available&&pay)?pay.ht/prod.capacity:null;m.ratioHours=(m.useful>0&&vtNum(m.hours))?m.hours/m.useful:null;
      m.ftePaid=vtNum(m.hours)?m.hours/169:(vtNum(m.cost)&&hr?m.cost/(hr*169):null);m.fteSust=(pay&&hr)?Math.max(0,pay.withObjective)/(hr*169):null;
      months.push(m);
    }
    var tot={cost:0,ht:0,hours:0,nH:0,payable:0};months.forEach(function(m){if(m.kind==='off')return;if(vtNum(m.cost))tot.cost+=m.cost;if(m.pay){tot.ht+=m.pay.ht;tot.payable+=m.pay.withObjective;}if(vtNum(m.hours)){tot.hours+=m.hours;tot.nH++;}});
    var active=months.filter(function(m){return m.kind!=='off'&&vtNum(m.ftePaid);});
    tot.share=tot.ht>0?tot.cost/tot.ht:null;tot.hour=tot.hours>0?tot.cost/tot.hours:hourSettings;
    tot.ftePaid=active.length?active.reduce(function(a,m){return a+m.ftePaid;},0)/active.length:null;
    var sus=months.filter(function(m){return m.kind!=='off'&&vtNum(m.fteSust);});tot.fteSust=sus.length?sus.reduce(function(a,m){return a+m.fteSust;},0)/sus.length:null;
    tot.coverage=vtCoverage(tot.payable,tot.cost);
    tot.monthsKnown=months.filter(function(m){return m.kind!=='off'&&vtNum(m.cost)&&vtNum(m.ca);}).length;tot.monthsActive=months.filter(function(m){return m.kind!=='off';}).length;
    return {refDays:refDays,year:year,ci:ci,key:key,tva:tva,mcRate:mcRate,cfOther:cfOther,objM:objM,months:months,tot:tot,prod:prod,growth:growth,aggY:aggY,aggLY:aggLY,allDays:allDays,
      src:S.length?'services':'settings',fict:fict,salM:salM,etp:etp,hourSettings:hourSettings,hasPay:hasPay,d:d,ratings:ratings,adj:adj};
  }
  function vtModel(){var R=null;try{R=root.moteur();}catch(e){}if(!R||!R.ready)return null;var s=vtSig();if(vtCache.sig===s&&vtCache.model)return vtCache.model;var m=vtBuild(R);vtCache={sig:s,model:m};return m;}
  function vtStyle(){var d=root.document;if(d.getElementById('vt-style'))return;var s=d.createElement('style');s.id='vt-style';
    s.textContent='.vt{color:#eef2f6;margin:0 0 18px}.vt h2{margin:0;font-size:22px;letter-spacing:-.01em}.vt .vt-k{margin:0 0 6px;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#8a93a0}'+
    '.vt .vt-chips{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 12px}.vt .vt-chips span{padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;color:#9db7f5;background:rgba(125,162,245,.1);border:1px solid rgba(125,162,245,.28)}.vt .vt-chips .f{color:#f5c26b;background:rgba(245,194,107,.08);border-color:rgba(245,194,107,.3)}'+
    '.vt .vt-card{padding:14px;border:1px solid rgba(148,163,184,.18);border-radius:18px;background:rgba(15,20,27,.7);margin:10px 0;box-shadow:inset 3px 0 0 var(--vtc,#64748b)}'+
    '.vt .vt-tiles{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin:10px 0}.vt .vt-t{min-width:0;padding:10px 11px;border:1px solid rgba(148,163,184,.16);border-radius:13px;background:rgba(10,14,19,.6)}.vt .vt-t small{display:block;color:#9aa6b2;font-size:12px;overflow-wrap:anywhere}.vt .vt-t b{display:block;margin-top:4px;font-size:16px;font-weight:800;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.vt .vt-t.w{grid-column:1/-1}'+
    '.vt .vt-read{margin:6px 0 0;font-size:14.5px;line-height:1.45}.vt .vt-note{margin:8px 0 0;color:#9aa6b2;font-size:12.5px;line-height:1.45}.vt svg{width:100%;height:auto;display:block}.vt .gl{stroke:rgba(148,163,184,.16)}.vt .gl.o{stroke:rgba(226,232,240,.55);stroke-dasharray:5 5}.vt .ax{fill:#8a93a0;font-size:10.5px}'+
    '.vt .vt-big{margin:2px 0 0;font-size:20px;font-weight:800}.vt .vt-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin:8px 0}.vt .vt-cal button{min-height:38px;border-radius:9px;border:1px solid rgba(148,163,184,.15);background:rgba(10,14,19,.6);color:#eef2f6;font:600 13px/1 inherit;cursor:pointer;padding:0}.vt .vt-cal button[data-st]{border-width:2px}.vt .vt-cal .x{visibility:hidden}.vt .vt-cal button[aria-pressed=true]{outline:2px solid #fff;outline-offset:1px}.vt .vt-wd{font-size:10.5px;color:#8a93a0;text-align:center}'+
    '.vt .vt-btns{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.vt .vt-btns button{min-height:40px;padding:0 14px;border-radius:12px;border:1px solid rgba(148,163,184,.25);background:rgba(20,26,34,.9);color:#eef2f6;font:600 14px inherit;cursor:pointer}.vt .vt-btns button[aria-pressed=true]{background:#e2e8f0;color:#0b0e12}'+
    '.vt .vt-hit:focus{outline:2px solid #fff}.vt ul{margin:6px 0 0;padding-left:18px;color:#cbd5e1;font-size:13.5px;line-height:1.55}.vt details summary{cursor:pointer;color:#cbd5e1;font-weight:700;font-size:14px}';
    d.head.appendChild(s);}
  function vtTile(l,v,col,wide){return '<div class="vt-t'+(wide?' w':'')+'"><small>'+vtE(l)+'</small><b'+(col?' style="color:'+col+'"':'')+'>'+v+'</b></div>';}
  function vtChart(M,C){
    var W=340,H=150,L=36,Rr=12,T=12,B=24,slot=(W-L-Rr)/12,bw=Math.min(16,slot*.62),i,s='',vals=[];
    M.months.forEach(function(m){if(vtNum(m.coverage))vals.push(Math.min(m.coverage,2));});
    var ymax=Math.max(1.4,Math.ceil((Math.max.apply(null,vals.concat([1]))+.02)*5)/5),ymin=0,step=ymax>1.6?.4:.2;
    var y=function(r){return T+(ymax-Math.min(Math.max(r,ymin),ymax))/(ymax-ymin)*(H-T-B);};
    s+='<defs><pattern id="vtH" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,.16)" stroke-width="2"/></pattern></defs>';
    for(var v=ymin;v<=ymax+.001;v+=step){var rv=Math.round(v*100)/100;s+='<line x1="'+L+'" x2="'+(W-Rr)+'" y1="'+y(rv).toFixed(1)+'" y2="'+y(rv).toFixed(1)+'" class="gl'+(Math.abs(rv-1)<.001?' o':'')+'"/><text x="'+(L-5)+'" y="'+(y(rv)+3.5).toFixed(1)+'" text-anchor="end" class="ax">'+Math.round(rv*100)+'\u00a0%</text>';}
    for(i=0;i<12;i++){var m=M.months[i],x=L+slot*i+(slot-bw)/2,base=H-B;
      if(m.kind==='off'||!vtNum(m.coverage)){s+='<rect x="'+x.toFixed(1)+'" y="'+T+'" width="'+bw.toFixed(1)+'" height="'+(H-T-B)+'" rx="2" fill="'+(m.kind==='off'?'url(#vtH)':'rgba(100,116,139,.18)')+'"/>';}
      else{var col=VT_COL[m.status]||VT_COL.info,yy=y(m.coverage),h=Math.max(1.5,base-yy),dash=m.kind!=='past';
        s+='<rect x="'+x.toFixed(1)+'" y="'+yy.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="3" fill="'+col+'"'+(dash?' fill-opacity=".22" stroke="'+col+'" stroke-width="1.2" stroke-dasharray="3 2"':'')+'/>';}
      var sel=vtSel.m===i;
      s+='<text x="'+(x+bw/2).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" class="ax"'+(i===M.ci||sel?' style="fill:#fff;font-weight:700"':'')+'>'+vtE(vtMonthShort(i))+'</text>';
      s+='<rect class="vt-hit" data-vt-m="'+i+'" x="'+(L+slot*i).toFixed(1)+'" y="0" width="'+slot.toFixed(1)+'" height="'+H+'" rx="4" fill="'+(sel?'rgba(255,255,255,.06)':'transparent')+'" stroke="'+(sel?'#fff':'none')+'" tabindex="0" role="button" aria-pressed="'+sel+'" aria-label="'+vtE(vtMonth(i))+'" style="cursor:pointer"/>';}
    return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+vtE(C.chartK)+'">'+s+'</svg>';
  }
  function vtCalendar(M,i,C){
    var y=M.year,first=new Date(y,i,1,12),n=new Date(y,i+1,0,12).getDate(),off=(first.getDay()+6)%7,h='<div class="vt-cal">',k;
    for(k=0;k<7;k++)h+='<div class="vt-wd">'+vtE(new Intl.DateTimeFormat(vtTag(),{weekday:'narrow'}).format(new Date(2024,0,1+k,12)))+'</div>';
    for(k=0;k<off;k++)h+='<button class="x" tabindex="-1" aria-hidden="true"></button>';
    var A=M.aggY[i];
    for(k=1;k<=n;k++){var iso=y+'-'+('0'+(i+1)).slice(-2)+'-'+('0'+k).slice(-2),dd=A.days[iso],st=null,style='';
      if(dd&&iso<=M.key){var cp=vtCapacityFor(dd.hours,M.refDays,M.tva),r=cp?vtDayReading(dd.ca,cp,M.ratings[iso]):null;if(r)st=r.status;}
      if(st)style=' style="border-color:'+VT_COL[st]+';background:'+VT_COL[st]+'22"';else if(iso>M.key)style=' style="color:#8a93a0"';
      h+='<button type="button" data-vt-d="'+iso+'"'+(st?' data-st="'+st+'"':'')+style+' aria-pressed="'+(vtSel.d===iso)+'" aria-label="'+vtE(vtDayLabel(iso))+'">'+k+'</button>';}
    return h+'</div>';
  }
  function vtSlotLabel(C,slot,label){return C['slot_'+slot]||label||slot;}
  function vtCap(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1);}
  function vtWdName(iso){try{var p=iso.split('-');return new Intl.DateTimeFormat(vtTag(),{weekday:'long'}).format(new Date(+p[0],+p[1]-1,+p[2],12));}catch(e){return '';}}
  var VT_SVC_COL={habituel:'#22c55e',tendu:'#f97316',large:'#eab308',insuffisant:'#94a3b8'};
  /* P4 · services d'une journée passée, chacun face à ses services comparables */
  function vtServicesDayHTML(M,iso,C){
    var S=(root.DB&&root.DB.services)||[],rows=S.filter(function(s){return s&&String(s.d)===iso;}).map(function(s){return vtServiceRow(s,M.tva);}).filter(Boolean);
    if(!rows.length)return '';var order={breakfast:0,lunch:1,afternoon:2,dinner:3};rows.sort(function(a,b){return (order[a.slot]==null?9:order[a.slot])-(order[b.slot]==null?9:order[b.slot]);});
    var h='<p class="vt-k" style="margin-top:12px">'+vtE(C.svcK)+'</p>';
    rows.forEach(function(r){var comp=vtComparables(S,r,M.tva,8),st=vtServiceStatus(r,comp),col=VT_SVC_COL[st.statut];
      h+='<div class="vt-card" data-vt-svc="'+vtE(r.slot)+'" style="--vtc:'+col+';margin:6px 0;padding:10px 12px"><b>'+vtE(vtCap(vtSlotLabel(C,r.slot,r.label)))+'</b>'+(r.event?' · ⚑':'')+
        '<div class="vt-note" style="margin-top:2px">'+vtE(vtF(C.svcLine,{p:vtN(r.pers),h:vtN(r.h,1),ca:vtEur(r.ca),prod:vtEur2(r.prod),part:vtPct(r.part)}))+'</div>'+
        '<div class="vt-note" style="margin-top:2px;color:'+col+'">'+vtE(st.statut==='insuffisant'?C.st_insuffisant:vtF(C.svcComp,{st:C['st_'+st.statut],wd:vtWdName(iso),lab:vtSlotLabel(C,r.slot,r.label),prod:vtEur2(comp.prod),n:comp.n}))+'</div></div>';});
    return h+'<p class="vt-note">'+vtE(C.svcRule)+'</p>';
  }
  /* P4 · créneaux du mois, du moins productif au plus productif */
  function vtSlotsHTML(M,i,C){
    var ym=M.year+'-'+('0'+(i+1)).slice(-2),L=vtSlotsMonth((root.DB&&root.DB.services)||[],ym,M.tva);if(!L.length)return '';
    var comparable=L.filter(function(G){return G.n>=4&&G.prod!=null;}),lowest=comparable.length>=2?comparable.reduce(function(a,b){return a.prod<=b.prod?a:b;}):null;
    var h='<p class="vt-k" style="margin-top:12px">'+vtE(C.slotsK)+'</p><p class="vt-note">'+vtE(C.slotHelp)+'</p>';
    L.forEach(function(G,ix){var wd='';try{wd=new Intl.DateTimeFormat(vtTag(),{weekday:'long'}).format(new Date(2024,0,7+G.wd,12));}catch(e){}
      h+='<div class="vt-note" data-vt-slot="'+G.wd+'|'+vtE(G.slot)+'" style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-top:1px solid rgba(148,163,184,.12)"><span style="min-width:0"><b>'+vtE(vtCap(wd)+' · '+vtSlotLabel(C,G.slot,G.label))+'</b>'+(G===lowest?' · <span style="color:#b45309">'+vtE(C.slotLow)+'</span>':'')+'<br>'+vtE(vtF(C.slotLine,{n:G.n,ca:vtEur(G.caMoy),h:vtN(G.hMoy,1),prod:vtEur2(G.prod),part:vtPct(G.part)}))+'</span></div>';});
    return h;
  }
  function vtMonthHTML(M,i,C){
    var m=M.months[i],kl={past:C.kPast,current:C.kCur,future:C.kFut,off:C.kOff}[m.kind],col=VT_COL[m.status]||VT_COL.info;
    var h='<div class="vt-card" style="--vtc:'+col+'" id="vtMonth"><div class="vt-chips" style="margin:0 0 6px"><span>'+vtE(vtMonth(i)+' '+M.year)+'</span><span>'+vtE(kl)+'</span></div>';
    if(m.kind==='off')return h+'<p class="vt-read">'+vtE(C.kOff)+'</p></div>';
    h+='<p class="vt-big" style="color:'+col+'">'+vtE(vtF(C.mVerdict,{p:vtPct(m.coverage)}))+'</p><div class="vt-tiles">';
    h+=vtTile(C.mCA+(m.kind==='current'?' (fin de mois estimée)':m.kind==='future'?' (estimé)':''),vtE(vtEur(m.ca)))+vtTile(C.mCost+(m.kind==='current'||m.kind==='future'?' (estimé)':''),vtE(vtEur(m.cost)));
    if(m.pay){h+=vtTile(C.mPay,vtE(vtEur(m.pay.withObjective)))+vtTile(C.mPayBE,vtE(vtEur(m.pay.breakEven)));
      var gap=vtNum(m.cost)?m.pay.withObjective-m.cost:null;h+=vtTile(C.mGap,vtE((gap>0?'+':'')+vtEur(gap)),gap==null?null:(gap>=0?'#22c55e':'#ef4444'));}
    if(vtNum(m.hours))h+=vtTile(C.mHours,vtE(vtN(m.hours)+' '+C.unitH));
    if(vtNum(m.useful))h+=vtTile(C.mUseful,vtE(vtN(m.useful)+' '+C.unitH));
    if(vtNum(m.ratioHours))h+=vtTile(C.mRatio,vtE(vtN(m.ratioHours,2)),m.ratioHours>1.15?'#f97316':null);
    if(vtNum(m.ftePaid)||vtNum(m.fteSust))h+=vtTile(C.mFte,vtE(vtN(m.ftePaid,1)+' / '+vtN(m.fteSust,1)),null,true);
    if(m.lyCa!=null)h+=vtTile(vtF(C.mLY,{y:M.year-1}),vtE(vtF(C.mLYv,{ca:vtEur(m.lyCa),h:vtN(m.lyHours),c:vtEur(m.lyCost)})),null,true);
    h+='</div>';
    var srcTxt=m.src==='n1'?vtF(C.mCostN1,{y:M.year-1}):m.src==='run'?C.mCostRun:m.src==='est'?C.mCostEst:'';
    if(srcTxt&&m.kind!=='past')h+='<p class="vt-note">'+vtE(srcTxt)+'</p>';
    if(m.src==='est'&&m.kind==='past')h+='<p class="vt-note">'+vtE(C.mCostEst)+'</p>';
    if(m.kind!=='past'&&vtNum(m.coverage)&&m.coverage<0.95){
      var model=m.pay&&m.pay.withObjective<=0;
      h+='<p class="vt-k" style="margin-top:12px">'+vtE(C.pistesK)+'</p><ul>'+(model?'<li>'+vtE(C.p5)+'</li>':'<li>'+vtE(C.p1)+'</li><li>'+vtE(C.p2)+'</li><li>'+vtE(C.p3)+'</li><li>'+vtE(C.p4)+'</li>')+'</ul>';}
    if(m.kind!=='future'||true){h+='<p class="vt-k" style="margin-top:12px">'+vtE(C.calK)+'</p>'+vtCalendar(M,i,C)+'<p class="vt-note">'+vtE(M.prod.available?C.calLegend:C.noProd)+'</p>';}
    h+='<div id="vtDay" aria-live="polite"></div>';
    if(m.kind!=='future')h+=vtSlotsHTML(M,i,C);
    h+='</div>';
    return h;
  }
  function vtSameWeekday(M,iso,yearOffset,limit){
    var p=iso.split('-'),dt=new Date(+p[0],+p[1]-1,+p[2],12),wd=dt.getDay(),out=[];
    if(yearOffset){var ly=String(+p[0]-1)+'-'+p[1];M.allDays.forEach(function(x){if(x.date.slice(0,7)===ly){var q=x.date.split('-');if(new Date(+q[0],+q[1]-1,+q[2],12).getDay()===wd)out.push(x);}});return out;}
    for(var k=M.allDays.length-1;k>=0&&out.length<limit;k--){var x=M.allDays[k];if(x.date>=iso)continue;var q=x.date.split('-');if(new Date(+q[0],+q[1]-1,+q[2],12).getDay()===wd)out.push(x);}
    return out;
  }
  function vtDayHTML(M,iso,C){
    var p=iso.split('-'),mi=+p[1]-1,dd=M.aggY[mi]&&M.aggY[mi].days[iso],tiles='',after='',msg='';
    var dt=new Date(+p[0],+p[1]-1,+p[2],12),ly=new Date(dt.getTime()-364*864e5),lyIso=vtISO(ly),lyD=null;
    M.allDays.forEach(function(x){if(x.date===lyIso)lyD=x;});
    var prodCap=M.prod.available?M.prod.capacity:null;
    if(dd&&iso<=M.key){
      var cpP=vtCapacityFor(dd.hours,M.refDays,M.tva),r=cpP?vtDayReading(dd.ca,cpP,M.ratings[iso]):null;
      tiles+=vtTile(C.dCA,vtE(vtEur(dd.ca)))+vtTile(C.dCost,vtE(vtEur(dd.cost)))+vtTile(C.dHours,vtE(vtN(dd.hours)+' '+C.unitH))+vtTile(C.dPers,vtE(vtN(dd.pers)));
      tiles+=vtTile(C.dProd,vtE(vtEur2(dd.hours>0?(dd.ca/(1+M.tva))/dd.hours:null)));
      if(r)tiles+=vtTile(C.dCap,vtE(vtF(C.dCapV,{v:vtEur(r.comfort),r:vtEur(r.record)})),VT_COL[r.status],true);
      var cur=M.ratings[iso]||'';
      after+=vtServicesDayHTML(M,iso,C);
      after+='<p class="vt-k" style="margin-top:10px">'+vtE(C.rateQ)+'</p><div class="vt-btns">'+[['tenu',C.rTenu],['juste',C.rJuste],['deb',C.rDeb]].map(function(o){return '<button type="button" data-vt-rate="'+o[0]+'" aria-pressed="'+(cur===o[0])+'">'+vtE(o[1])+'</button>';}).join('')+'</div>';
    }else{
      var lyList=vtSameWeekday(M,iso,true).map(function(x){return x.ca;}),rec=vtSameWeekday(M,iso,false,8),f=vtForecastDay(lyList,rec.map(function(x){return x.ca;}),M.growth);
      var hrs=rec.map(function(x){return x.hours;}).filter(function(x){return x>0;}),prs=rec.map(function(x){return x.pers;}).filter(function(x){return x>0;});
      var hMed=vtQuantile(hrs,.5),pMed=vtQuantile(prs,.5),delta=Number(M.adj[iso])||0,hPer=(hMed&&pMed)?hMed/pMed:null;
      var pPlan=pMed!=null?Math.max(0,Math.round(pMed)+delta):null,hPlan=(hMed!=null&&hPer!=null)?Math.max(0,hMed+delta*hPer):null;
      if(f)tiles+=vtTile(C.dFore,vtE(vtF(C.dForeV,{lo:vtEur(f.low),hi:vtEur(f.high)})));
      if(pMed!=null)tiles+=vtTile(C.dTeam,vtE(vtF(C.dTeamV,{p:vtN(Math.round(pMed)),h:vtN(hMed)})));
      var cpF=hPlan!=null?vtCapacityFor(hPlan,M.refDays,M.tva):null;
      if(cpF){tiles+=vtTile(C.dCap,vtE(vtF(C.dCapV,{v:vtEur(cpF.comfort),r:vtEur(cpF.record)})),null,true);
        var fr=vtFutureReading(f,cpF);
        if(fr){msg=fr.state==='ok'?(f.mid<cpF.comfort*0.7?C.dLight:C.dOk):fr.state==='tight'?vtF(C.dTight,{r:vtEur(cpF.record)}):vtF(C.dWarn,{r:vtEur(cpF.record)});
          tiles+=vtTile(C.dMargin,vtE(vtEur(fr.margin)),fr.state==='ok'?'#22c55e':fr.state==='tight'?'#f97316':'#ef4444');}}
      if(pPlan!=null)after+='<p class="vt-k" style="margin-top:10px">'+vtE(C.dAdj)+'</p><div class="vt-btns"><button type="button" data-vt-adj="-1" aria-label="-1">−1</button><span data-vt-plan style="align-self:center;font-weight:800;font-size:18px;min-width:56px;text-align:center">'+vtN(pPlan)+'</span><button type="button" data-vt-adj="1" aria-label="+1">+1</button></div>';
    }
    if(lyD)tiles+=vtTile(vtF(C.dLY,{y:ly.getFullYear()}),vtE(vtF(C.dLYv,{ca:vtEur(lyD.ca),p:vtN(lyD.pers),h:vtN(lyD.hours)})),null,true);
    return '<div class="vt-card" style="--vtc:#7DA2F5;margin-top:12px" data-vt-day="'+iso+'"><div class="vt-chips" style="margin:0 0 6px"><span>'+vtE(vtDayLabel(iso))+'</span></div><div class="vt-tiles">'+tiles+'</div>'+(msg?'<p class="vt-read">'+vtE(msg)+'</p>':'')+(!tiles?'<p class="vt-note">'+vtE(C.dayNoData)+'</p>':'')+after+'</div>';
  }
  function vtCostHTML(M,C){
    var d=root.DB&&root.DB.in||{},lad=vtCostLadder(Number(d.salb),Number(d.salt),Number(d.saln),null);
    var svcH=null;var last=(M.allDays||[]).slice(-28);if(last.length){var sh=0,sc=0;last.forEach(function(x){sh+=x.hours;sc+=x.cost;});if(sh>0)svcH=sc/sh;}
    var h='<details class="vt-card" style="--vtc:#7DA2F5"><summary>'+vtE(C.costK)+'</summary>';
    if(!lad){h+='<p class="vt-note">'+vtE(C.cNo)+'</p>';}
    else{var serviceH=(function(){var S=(root.DB&&root.DB.services)||[];var a=S.slice(-60).map(function(s){return (Number(s.h)||0)/(Number(s.pers)||1);}).filter(function(x){return x>0;});return vtQuantile(a,.5);})();
      h+='<div class="vt-tiles">'+vtTile(C.c1,vtE(vtEur(lad.brut)))+vtTile(vtF(C.c2,{t:vtN(Number(d.salt),0)}),vtE(vtEur(lad.charges)))+vtTile(C.c3,vtE(vtEur(lad.charged)))+vtTile(C.c4,vtE(vtEur2(lad.hour)));
      if(serviceH)h+=vtTile(vtF(C.c5,{h:vtN(serviceH,1)}),vtE(vtEur(lad.hour*serviceH)),null,true);
      h+='</div>';}
    if(svcH)h+='<p class="vt-note">'+vtE(vtF(C.cSvc,{v:vtEur2(svcH)}))+'</p>';
    var lyTot=M.aggLY.reduce(function(a,m){return a+m.cost;},0);
    if(M.salM&&lyTot>0){var moisT=Number(root.DB&&root.DB.in&&root.DB.in.mois),setYear=M.salM*(moisT>=1&&moisT<=12?moisT:12); /* C298 (décision 3) : salaires par mois × mois travaillés, jamais × 12 pour un saisonnier */if(Math.abs(setYear-lyTot)/Math.max(setYear,lyTot)>0.15)h+='<p class="vt-note" style="color:#f5c26b">'+vtE(vtF(C.cDiff,{a:vtEur(setYear),b:vtEur(lyTot)}))+'</p>';}
    return h+'</details>';
  }
  function vtHTML(){
    var C=vtC(),M=vtModel();if(!M)return '';
    if(!M.hasPay)return '<section class="vt" id="vtModule" data-vt-version="'+VT_VERSION+'"><p class="vt-k">'+vtE(C.kicker)+'</p><h2>'+vtE(C.title)+'</h2><p class="vt-note">'+vtE(C.notApplic)+'</p></section>';
    if(vtSel.m==null)vtSel.m=M.ci;
    var T=M.tot,cov=T.coverage,col=VT_COL[vtStatus(cov)];
    var weak=M.months.filter(function(m){return m.kind!=='off'&&vtNum(m.coverage)&&m.coverage<0.95;}).map(function(m){return vtMonth(m.i);});
    /* C213 (W12) : sans aucun mois chiffré dans l'année, ni coût annuel, ni part du CA, ni verdict : rien n'est inventé. */
    var vide=!(T.monthsKnown>0),VZ=VT_C213[(function(){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}return l;})()]||VT_C213.fr,model=!vide&&vtNum(T.payable)&&T.payable<=0;
    var read=vide?vtF(VZ.none,{y:M.year}):model?C.yReadModel:(weak.length?vtF(C.yReadWeak,{list:weak.join(', ')}):C.yReadOk);
    var h='<section class="vt" id="vtModule" data-vt-version="'+VT_VERSION+'"><p class="vt-k">'+vtE(C.kicker)+'</p><h2>'+vtE(C.title)+' · '+M.year+'</h2>'+
      '<div class="vt-chips"><span>'+vtE(M.src==='services'?C.src_services:(function(){var q=root.VerdictEquipeFec&&root.VerdictEquipeFec.ok();return q?root.VerdictEquipeFec.t('chip',{f:q.annee}):C.src_settings;})())+'</span>'+(M.fict?'<span class="f">'+vtE(C.fict)+'</span>':'')+'</div>'+
      '<div class="vt-card" style="--vtc:'+(vide?'#64748b':col)+'">'+(vide?'':'<div class="vt-tiles" style="margin-top:0">'+vtTile((function(){var q=M.src!=='services'&&root.VerdictEquipeFec&&root.VerdictEquipeFec.ok();return q?root.VerdictEquipeFec.t('cost',{y:M.year,f:q.annee}):vtF(M.src==='services'?C.yCost:VZ.cost,{y:M.year});})(),vtE(vtEur(T.cost)))+vtTile(C.yShare,vtE(vtPct(T.share)))+
      vtTile(C.yFte,vtE(vtN(T.ftePaid,1)+' / '+vtN(T.fteSust,1)))+vtTile(C.yHour,vtE(vtEur2(T.hour)))+'</div><p class="vt-note" style="margin-top:0">'+vtE(C.yNote)+(T.monthsKnown<T.monthsActive?' '+vtF(C.yPartial,{n:T.monthsKnown,t:T.monthsActive}):'')+'</p>')+'<p class="vt-read" style="color:'+(vide?'inherit':model?'#ef4444':weak.length?'#f5c26b':'#22c55e')+'">'+vtE(read)+'</p></div>'+
      '<div class="vt-card"><p class="vt-k">'+vtE(C.chartK)+'</p>'+vtChart(M,C)+'<p class="vt-note">'+vtE(C.chartLegend)+'</p></div>'+
      vtMonthHTML(M,vtSel.m,C)+vtCostHTML(M,C)+'<p class="vt-note">'+vtE(C.rule)+'</p></section>';
    return h;
  }
  var VT_C213={fr:{none:'Aucun chiffre {y} pour l’instant : la lecture de l’équipe sur l’année commencera avec vos premières journées de {y}.',cost:'Coût de l’équipe {y} (estimé d’après vos réglages)'},
    en:{none:'No {y} figures yet: the team reading for the year will start with your first days of {y}.',cost:'Team cost {y} (estimated from your settings)'},
    es:{none:'Aún no hay cifras de {y}: la lectura del equipo del año empezará con sus primeras jornadas de {y}.',cost:'Coste del equipo {y} (estimado según sus ajustes)'},
    it:{none:'Ancora nessun dato {y}: la lettura della squadra sull’anno inizierà con le prime giornate del {y}.',cost:'Costo della squadra {y} (stimato dalle impostazioni)'},
    de:{none:'Noch keine Zahlen für {y}: die Jahreslesung des Teams beginnt mit Ihren ersten Tagen {y}.',cost:'Teamkosten {y} (geschätzt aus Ihren Einstellungen)'},
    nl:{none:'Nog geen cijfers voor {y}: de teamlezing over het jaar begint met uw eerste dagen van {y}.',cost:'Teamkosten {y} (geschat op basis van uw instellingen)'},
    pt:{none:'Ainda sem números de {y}: a leitura da equipa no ano começará com os seus primeiros dias de {y}.',cost:'Custo da equipa {y} (estimado a partir das suas definições)'}};
  function vtRender(){
    try{
      var host=root.document.getElementById('salBody');if(!host)return;vtStyle();
      var old=root.document.getElementById('vtModule');if(old)old.parentNode.removeChild(old);
      var html=vtHTML();if(!html)return;host.insertAdjacentHTML('afterbegin',html);
      var mod=root.document.getElementById('vtModule');if(!mod)return;
      if(vtSel.d){var dayBox=root.document.getElementById('vtDay');var M=vtModel();if(dayBox&&M)dayBox.innerHTML=vtDayHTML(M,vtSel.d,vtC());}
      mod.addEventListener('click',function(e){
        var t=e.target;if(!t||!t.closest)return;
        var hm=t.closest('[data-vt-m]');if(hm){vtSel.m=Number(hm.getAttribute('data-vt-m'));vtSel.d=null;vtRender();var mm=root.document.getElementById('vtMonth');if(mm&&mm.scrollIntoView)mm.scrollIntoView({block:'nearest'});return;}
        var hd=t.closest('[data-vt-d]');if(hd){vtSel.d=hd.getAttribute('data-vt-d');var box=root.document.getElementById('vtDay'),M=vtModel();if(box&&M){box.innerHTML=vtDayHTML(M,vtSel.d,vtC());box.scrollIntoView({block:'nearest',behavior:root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});[].forEach.call(mod.querySelectorAll('[data-vt-d]'),function(b){b.setAttribute('aria-pressed',b.getAttribute('data-vt-d')===vtSel.d?'true':'false');});}return;}
        var ha=t.closest('[data-vt-adj]');if(ha&&vtSel.d){var D=root.DB;D.teamDayAdj=D.teamDayAdj||{};var v=(Number(D.teamDayAdj[vtSel.d])||0)+Number(ha.getAttribute('data-vt-adj'));if(v===0)delete D.teamDayAdj[vtSel.d];else D.teamDayAdj[vtSel.d]=Math.max(-20,Math.min(20,v));try{root.save('team-day-adjust');}catch(x){}vtCache.sig=null;vtRender();return;}
        var hr=t.closest('[data-vt-rate]');if(hr&&vtSel.d){var D2=root.DB;D2.teamDayRatings=D2.teamDayRatings||{};var val=hr.getAttribute('data-vt-rate');if(D2.teamDayRatings[vtSel.d]===val)delete D2.teamDayRatings[vtSel.d];else D2.teamDayRatings[vtSel.d]=val;try{root.save('team-day-rating');}catch(x){}vtCache.sig=null;vtRender();return;}
      });
      mod.addEventListener('keydown',function(e){var hm=e.target&&e.target.closest&&e.target.closest('[data-vt-m]');if(hm&&(e.key==='Enter'||e.key===' ')){e.preventDefault();hm.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
    }catch(e){try{console.warn('VerdictTeam',e);}catch(x){}}
  }
  function vtWrap(){var f=root.drawSal;if(typeof f!=='function'||f.__vt)return;var w=function(){var r=f.apply(this,arguments);vtRender();return r;};w.__vt=true;root.drawSal=w;}
  vtWrap();root.setInterval(function(){vtWrap();if(root.VIEW==='sal'&&!root.document.getElementById('vtModule')&&root.document.getElementById('salBody'))vtRender();},1200);
  root.VerdictTeam={version:VT_VERSION,openLabel:function(){return vtC().open;},model:function(){vtCache.sig=null;return vtModel();},open:function(m){vtSel.m=vtNum(m)?m:null;vtSel.d=null;try{root.go('sal');}catch(e){}root.setTimeout(vtRender,60);},render:vtRender,
    core:{serviceRow:vtServiceRow,comparables:vtComparables,serviceStatus:vtServiceStatus,slotsMonth:vtSlotsMonth,future:vtFutureReading,quantile:vtQuantile,payable:vtPayable,coverage:vtCoverage,status:vtStatus,aggregate:vtAggregate,productivity:vtProductivity,day:vtDayReading,capacity:vtCapacityFor,forecast:vtForecastDay,ladder:vtCostLadder}};
  /* ═══ fin R252 ═══ */

  /* ═══ P5 — OÙ PART L'ARGENT (cœur pur) ═══════════════════════════════════════
     Sur 100 € de chiffre d'affaires HT d'un mois : matière (taux de la structure), écart matière (dernière
     clôture, si elle existe), emballages et autres coûts variables, commissions, équipe utile, heures en trop,
     charges fixes hors personnel, et ce qui reste. La somme des lignes = le CA, au centime.
     Absent ≠ zéro : une ligne non mesurée est marquée « non mesurée », jamais comptée à 0 sans le dire. */
  function vmNum(x){return typeof x==='number'&&isFinite(x);}
  /* in = {caHT, taux:{mat,av,com}, equipe:{cost,useful,costHour,src}, fixesMois, ecart:{explique,aVerifier}|null} */
  function vmBreakdown(inp){
    if(!inp||!vmNum(inp.caHT)||inp.caHT<=0)return {ok:false,raison:'ca'};
    var ca=inp.caHT,t=inp.taux||{},L=[],add=function(k,v,src,mesure){L.push({k:k,eur:v,pour100:v/ca*100,src:src,mesure:mesure!==false});};
    add('matiere',ca*(vmNum(t.mat)?t.mat:0),inp.matSrc==='fec'?'fec':'structure',vmNum(t.mat));
    if(inp.ecartAudit&&vmNum(inp.ecartAudit.pts))L.push({k:'ecart',eur:inp.ecartAudit.eur,pour100:inp.ecartAudit.pts,src:'audit',mesure:true,inclus:true,info:inp.ecartAudit}); /* C308 (V16-013) : compris dans la matière */
    else if(inp.ecart&&vmNum(inp.ecart.explique)&&vmNum(inp.ecart.aVerifier)){add('pertes',inp.ecart.explique,'cloture');add('ecart',inp.ecart.aVerifier,'cloture');}
    else L.push({k:'ecart',eur:null,pour100:null,src:'aucune',mesure:false});
    if(vmNum(t.av)&&t.av>0)add('variables',ca*t.av,'structure');
    if(vmNum(t.com)&&t.com>0)add('commissions',ca*t.com,'structure');
    var E=inp.equipe||{};
    if(vmNum(E.cost)){
      if(vmNum(E.useful)&&vmNum(E.costHour)&&E.costHour>0){var u=Math.min(E.cost,Math.max(0,E.useful*E.costHour));add('equipeUtile',u,E.src||'services');add('heuresTrop',E.cost-u,E.src||'services');}
      else add('equipe',E.cost,E.src||'reglages');
    }else L.push({k:'equipe',eur:null,pour100:null,src:'aucune',mesure:false});
    add('fixes',vmNum(inp.fixesMois)?inp.fixesMois:0,'structure',vmNum(inp.fixesMois));
    if(vmNum(inp.amortMois)&&inp.amortMois>0)add('amortissements',inp.amortMois,'fec');
    var depenses=L.reduce(function(a,x){return a+(vmNum(x.eur)&&!x.inclus?x.eur:0);},0),reste=ca-depenses;
    L.push({k:'resultat',eur:reste,pour100:reste/ca*100,src:'calcul',mesure:true});
    var somme=L.reduce(function(a,x){return a+(vmNum(x.eur)&&!x.inclus?x.eur:0);},0);
    var calculated={ok:true,partSaison:inp.partSaison==null?null:inp.partSaison,partSource:inp.partSource||null,annee:inp.annee||null,moisTravailles:inp.moisTravailles||null,caHT:ca,lignes:L,reste:reste,pour100Reste:reste/ca*100,controle:Math.abs(somme-ca),nonMesurees:L.filter(function(x){return !x.mesure;}).map(function(x){return x.k;})};
    if(window.VerdictInternalAudit)window.VerdictInternalAudit.auditBreakdown(calculated);
    return calculated;
  }
  /* Ce qui a changé d'un mois à l'autre, en € sur 100 € : les deux plus grands écarts (résultat exclu). */
  function vmChangements(a,b){
    if(!a||!a.ok||!b||!b.ok)return [];var idx={};b.lignes.forEach(function(x){idx[x.k]=x;});
    return a.lignes.filter(function(x){return x.k!=='resultat'&&vmNum(x.pour100)&&idx[x.k]&&vmNum(idx[x.k].pour100);})
      .map(function(x){return {k:x.k,delta:x.pour100-idx[x.k].pour100};}).filter(function(x){return Math.abs(x.delta)>=0.05;})
      .sort(function(p,q){return Math.abs(q.delta)-Math.abs(p.delta);}).slice(0,2);
  }
  /* ═══ P9 — OFFERTS, REMISES, ANNULATIONS (cœur pur) ═══════════════════════════
     Lus dans l'export de la caisse (rapport Z ou journalier) : date ; remises ; offerts ; annulations (TTC).
     Ce n'est pas une dépense : c'est un manque à gagner au prix de la carte, montré à côté des 100 €.
     Une colonne absente reste « non fournie » ; ré-import idempotent (une date remplace la précédente). */
  function vcaNum(v){if(v==null)return null;var s=String(v).trim().replace(/[\s\u00a0\u202f€]/g,'');if(!s)return null;
    if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,'').replace(',','.');else if(/,/.test(s)&&!/\./.test(s))s=s.replace(',','.');else if(/,/.test(s)&&/\./.test(s))s=s.replace(/,/g,'');
    var n=Number(s);return isFinite(n)?Math.abs(n):null;}
  function vcaDate(v){var s=String(v||'').trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return m[1]+'-'+m[2]+'-'+m[3];
    m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);if(!m)return null;var y=m[3].length===2?'20'+m[3]:m[3],mo=('0'+m[2]).slice(-2),d=('0'+m[1]).slice(-2),t=Date.parse(y+'-'+mo+'-'+d+'T12:00:00Z');
    return isFinite(t)&&new Date(t).getUTCDate()===+d?y+'-'+mo+'-'+d:null;}
  function vcaNorm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
  function vcaParse(text){
    var out={ok:false,lignes:[],ignorees:0,colonnes:null};var raw=String(text||'').replace(/^\ufeff/,'').split(/\r\n|\n|\r/).filter(function(l){return l.trim().length;});
    if(raw.length<2){out.raison='fichier-vide';return out;}
    var head=raw[0],sep=[';','\t',','].map(function(c){return [c,head.split(c).length];}).sort(function(a,b){return b[1]-a[1];})[0][0];
    function cells(l){var r=[],cur='',q=false;for(var i=0;i<l.length;i++){var ch=l[i];if(ch==='"'){if(q&&l[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(ch===sep&&!q){r.push(cur);cur='';}else cur+=ch;}r.push(cur);return r.map(function(x){return x.trim();});}
    var H=cells(head).map(vcaNorm),col={date:-1,remises:-1,offerts:-1,annulations:-1};
    H.forEach(function(h,i){if(col.date<0&&/^(date|jour|day|fecha|data|datum)\b/.test(h))col.date=i;else if(col.remises<0&&/(remise|reduc|discount|rabatt|descuento|sconto|korting|desconto)/.test(h))col.remises=i;
      else if(col.offerts<0&&/(offert|gratuit|comp\b|comps|free|invit|omaggio|gratis)/.test(h))col.offerts=i;else if(col.annulations<0&&/(annul|void|cancel|retour|rembours|storno|anula)/.test(h))col.annulations=i;});
    out.colonnes=col;if(col.date<0||(col.remises<0&&col.offerts<0&&col.annulations<0)){out.raison='colonnes-manquantes';return out;}
    for(var k=1;k<raw.length;k++){var c=cells(raw[k]),d=vcaDate(c[col.date]);if(!d){out.ignorees++;continue;}
      var L={date:d,remises:col.remises>=0?vcaNum(c[col.remises]):undefined,offerts:col.offerts>=0?vcaNum(c[col.offerts]):undefined,annulations:col.annulations>=0?vcaNum(c[col.annulations]):undefined};
      if(L.remises==null&&L.offerts==null&&L.annulations==null){out.ignorees++;continue;}out.lignes.push(L);}
    out.ok=out.lignes.length>0;if(!out.ok)out.raison='aucune-ligne-valide';return out;
  }
  function vcaMerge(existing,lignes){var m={};(existing||[]).forEach(function(x){if(x&&x.date)m[x.date]=x;});var aj=0,rp=0;(lignes||[]).forEach(function(l){if(m[l.date])rp++;else aj++;m[l.date]=l;});
    return {liste:Object.keys(m).sort().map(function(k){return m[k];}),ajoutees:aj,remplacees:rp};}
  /* Totaux d'un mois ; une rubrique jamais fournie reste null (non fournie), jamais 0. */
  function vcaMois(liste,ym){var o={remises:null,offerts:null,annulations:null,jours:0};
    (liste||[]).forEach(function(x){if(!x||String(x.date).slice(0,7)!==ym)return;o.jours++;['remises','offerts','annulations'].forEach(function(k){if(typeof x[k]==='number'&&isFinite(x[k]))o[k]=(o[k]||0)+x[k];});});
    o.total=['remises','offerts','annulations'].reduce(function(a,k){return a+(o[k]||0);},0);o.fourni=o.remises!=null||o.offerts!=null||o.annulations!=null;return o;}
  var VM_COPY={"fr":{"h2":"Où part l’argent","kicker":"Sur 100 € de chiffre d’affaires, hors TVA","reste":"En {m}, vous gagnez {v} pour 100 € de ventes HT.","manque":"En {m}, vous perdez {v} pour 100 € de ventes HT.","matiere":"Matière, nourriture + boissons (selon votre taux habituel)","pertes":"Pertes déclarées","ecart":"Écart de matière à vérifier","ecartAbsent":"Écart matière : non mesuré (deux inventaires nécessaires)","variables":"Emballages et autres coûts variables","commissions":"Commissions des plateformes","equipeUtile":"Salaires des heures nécessaires","heuresTrop":"Heures payées en trop pour l’activité","equipe":"Équipe","equipeAbsent":"Équipe : non mesurée","fixes":"Loyer et charges fixes","resultat":"Bénéfice avant impôt","resultatNeg":"Perte avant impôt","total":"pour un CA HT de {v}","change":"Depuis {m} : {l} {d} sur 100 €.","sources":"Matière, emballages et commissions au taux de votre structure ; équipe d’après {e}.","srcServices":"vos services saisis","srcEst":"vos réglages (estimation)","srcCloture":"Écart matière d’après la clôture du {a} au {b}{f}.","fictif":" (données fictives)","attente":"Il faut un mois complet de chiffre d’affaires pour lire où part l’argent.","nonMesure":"Non mesuré n’est pas zéro : le reste est calculé sans ces lignes.","choisir":"Choisir le mois","offTitre":"En plus : ce que vous n’avez pas encaissé (au prix de la carte, TTC)","off_remises":"Remises","off_offerts":"Offerts","off_annulations":"Annulations","offPour100":"soit {v} pour 100 € encaissés (remises, offerts et annulations)","offNonFourni":"non fourni par la caisse","offAbsent":"Offerts, remises et annulations : non fournis par votre caisse pour ce mois. Importez l’export journalier (date, remises, offerts, annulations).","offImport":"Importer offerts, remises, annulations (CSV)","offOk":"{n} journées lues ({a} nouvelles, {r} mises à jour), {i} ligne(s) ignorée(s).","offKo":"Fichier non reconnu : il faut une colonne date et au moins une colonne remises, offerts ou annulations. Rien n’a été enregistré.","amortissements":"Amortissements (charge sans sortie d’argent)","amortNote":"Ce mois : résultat avant impôt {r}, dont amortissements −{a} (aucune sortie d’argent ; avant amortissements : {av}). Le minimum économique du jour les inclut ; la trésorerie les réintègre car ils ne sont pas décaissés.","taxNote":"Pour 100 € de ventes HT, les charges prises en compte représentent {c}. L’impôt sur le bénéfice n’est pas calculé. Ce résultat ne correspond ni au solde bancaire ni à votre revenu personnel."},"en":{"h2":"Where the money goes","kicker":"Per €100 of revenue, excl. VAT","reste":"In {m}, you earn {v} per €100 of sales excluding VAT.","manque":"In {m}, you lose {v} per €100 of sales excluding VAT.","matiere":"Planned food & drink (your structure’s rate)","pertes":"Declared losses","ecart":"Food cost variance to check","ecartAbsent":"Food cost variance: not measured (two stock counts needed)","variables":"Packaging and other variable costs","commissions":"Platform commissions","equipeUtile":"Useful staff time","heuresTrop":"Hours paid beyond the held pace","equipe":"Staff","equipeAbsent":"Staff: not measured","fixes":"Rent and fixed costs","resultat":"Profit before tax","resultatNeg":"Loss before tax","total":"for revenue excl. VAT of {v}","change":"Since {m}: {l} {d} per €100.","sources":"Food & drink, packaging and commissions at your structure’s rate; staff from {e}.","srcServices":"your recorded services","srcEst":"your settings (estimate)","srcCloture":"Food cost variance from the closing of {a} to {b}{f}.","fictif":" (fictional data)","attente":"One complete month of revenue is needed to show where the money goes.","nonMesure":"Not measured is not zero: what remains is calculated without these lines.","choisir":"Choose the month","offTitre":"Outside the €100 — revenue forgone at menu price (incl. VAT)","off_remises":"Discounts","off_offerts":"On the house","off_annulations":"Voids","offPour100":"or {v} per €100 collected","offNonFourni":"not provided by the till","offAbsent":"Comps, discounts and voids: not provided by your till for this month. Import the daily export (date, discounts, comps, voids).","offImport":"Import comps, discounts, voids (CSV)","offOk":"{n} days read ({a} new, {r} updated), {i} line(s) ignored.","offKo":"File not recognised: a date column and at least one discounts, comps or voids column are needed. Nothing was saved.","amortissements":"Depreciation (expense with no cash out)","amortNote":"This month: profit before tax {r}, including depreciation −{a} (no cash out; before depreciation: {av}). The daily minimum and cash do not count it.","taxNote":"For €100 of sales excluding VAT, the costs included total {c}. Profit tax is not calculated. This result is neither your bank balance nor your personal income."},"es":{"h2":"Adónde va el dinero","kicker":"Por cada 100 € de ingresos, sin IVA","reste":"En {m}, gana {v} por cada 100 € de ventas sin IVA.","manque":"En {m}, pierde {v} por cada 100 € de ventas sin IVA.","matiere":"Materia prevista (tasa de su estructura)","pertes":"Pérdidas declaradas","ecart":"Desviación de materia a verificar","ecartAbsent":"Desviación de materia: no medida (se necesitan dos inventarios)","variables":"Envases y otros costes variables","commissions":"Comisiones de plataformas","equipeUtile":"Equipo útil","heuresTrop":"Horas pagadas por encima del ritmo sostenido","equipe":"Equipo","equipeAbsent":"Equipo: no medido","fixes":"Alquiler y cargas fijas","resultat":"Beneficio antes de impuestos","resultatNeg":"Pérdida antes de impuestos","total":"para unos ingresos sin IVA de {v}","change":"Desde {m}: {l} {d} por cada 100 €.","sources":"Materia, envases y comisiones a la tasa de su estructura; equipo según {e}.","srcServices":"sus servicios registrados","srcEst":"sus ajustes (estimación)","srcCloture":"Desviación de materia según el cierre del {a} al {b}{f}.","fictif":" (datos ficticios)","attente":"Se necesita un mes completo de ingresos para ver adónde va el dinero.","nonMesure":"No medido no es cero: el resto se calcula sin estas líneas.","choisir":"Elegir el mes","offTitre":"Fuera de los 100 € — ingresos no percibidos al precio de carta (con IVA)","off_remises":"Descuentos","off_offerts":"Invitaciones","off_annulations":"Anulaciones","offPour100":"o {v} por cada 100 € cobrados","offNonFourni":"no proporcionado por la caja","offAbsent":"Invitaciones, descuentos y anulaciones: no proporcionados por su caja este mes. Importe la exportación diaria (fecha, descuentos, invitaciones, anulaciones).","offImport":"Importar invitaciones, descuentos, anulaciones (CSV)","offOk":"{n} días leídos ({a} nuevos, {r} actualizados), {i} línea(s) ignorada(s).","offKo":"Archivo no reconocido: se necesita una columna de fecha y al menos una de descuentos, invitaciones o anulaciones. No se guardó nada.","amortissements":"Amortizaciones (gasto sin salida de dinero)","amortNote":"Este mes: resultado antes de impuestos {r}, con amortizaciones −{a} (sin salida de dinero; antes de amortizaciones: {av}). El mínimo diario y la tesorería no las cuentan.","taxNote":"Por cada 100 € de ventas sin IVA, los costes incluidos suman {c}. No se calcula el impuesto sobre beneficios. Este resultado no es el saldo bancario ni sus ingresos personales."},"it":{"h2":"Dove vanno i soldi","kicker":"Su 100 € di ricavi, IVA esclusa","reste":"A {m}, guadagna {v} ogni 100 € di vendite IVA esclusa.","manque":"A {m}, perde {v} ogni 100 € di vendite IVA esclusa.","matiere":"Materia prevista (tasso della sua struttura)","pertes":"Perdite dichiarate","ecart":"Scostamento materia da verificare","ecartAbsent":"Scostamento materia: non misurato (servono due inventari)","variables":"Imballaggi e altri costi variabili","commissions":"Commissioni delle piattaforme","equipeUtile":"Squadra utile","heuresTrop":"Ore pagate oltre il ritmo sostenuto","equipe":"Squadra","equipeAbsent":"Squadra: non misurata","fixes":"Affitto e costi fissi","resultat":"Utile prima delle imposte","resultatNeg":"Perdita prima delle imposte","total":"per ricavi IVA esclusa di {v}","change":"Da {m}: {l} {d} su 100 €.","sources":"Materia, imballaggi e commissioni al tasso della sua struttura; squadra secondo {e}.","srcServices":"i servizi registrati","srcEst":"le impostazioni (stima)","srcCloture":"Scostamento materia dalla chiusura dal {a} al {b}{f}.","fictif":" (dati fittizi)","attente":"Serve un mese completo di ricavi per vedere dove vanno i soldi.","nonMesure":"Non misurato non è zero: il resto è calcolato senza queste righe.","choisir":"Scegliere il mese","offTitre":"Fuori dai 100 € — mancato incasso al prezzo di carta (IVA inclusa)","off_remises":"Sconti","off_offerts":"Offerti","off_annulations":"Annullamenti","offPour100":"cioè {v} ogni 100 € incassati","offNonFourni":"non fornito dalla cassa","offAbsent":"Offerti, sconti e annullamenti: non forniti dalla cassa per questo mese. Importi l’esportazione giornaliera (data, sconti, offerti, annullamenti).","offImport":"Importa offerti, sconti, annullamenti (CSV)","offOk":"{n} giornate lette ({a} nuove, {r} aggiornate), {i} riga/e ignorata/e.","offKo":"File non riconosciuto: servono una colonna data e almeno una colonna sconti, offerti o annullamenti. Nulla è stato salvato.","amortissements":"Ammortamenti (costo senza uscita di cassa)","amortNote":"Questo mese: risultato ante imposte {r}, di cui ammortamenti −{a} (nessuna uscita di cassa; prima degli ammortamenti: {av}). Il minimo del giorno e la cassa non li contano.","taxNote":"Per 100 € di vendite IVA esclusa, i costi considerati sono {c}. Le imposte sugli utili non sono calcolate. Questo risultato non è il saldo bancario né il suo reddito personale."},"de":{"h2":"Wohin das Geld geht","kicker":"Je 100 € Umsatz, ohne MwSt.","reste":"Im Monat {m} verdienen Sie {v} je 100 € Umsatz ohne MwSt.","manque":"Im Monat {m} verlieren Sie {v} je 100 € Umsatz ohne MwSt.","matiere":"Geplanter Wareneinsatz (Satz Ihrer Struktur)","pertes":"Erfasste Verluste","ecart":"Zu prüfende Wareneinsatz-Abweichung","ecartAbsent":"Wareneinsatz-Abweichung: nicht gemessen (zwei Inventuren nötig)","variables":"Verpackung und andere variable Kosten","commissions":"Plattformprovisionen","equipeUtile":"Nützliche Teamzeit","heuresTrop":"Über dem gehaltenen Tempo bezahlte Stunden","equipe":"Team","equipeAbsent":"Team: nicht gemessen","fixes":"Miete und Fixkosten","resultat":"Gewinn vor Steuern","resultatNeg":"Verlust vor Steuern","total":"bei einem Nettoumsatz von {v}","change":"Seit {m}: {l} {d} je 100 €.","sources":"Wareneinsatz, Verpackung und Provisionen zum Satz Ihrer Struktur; Team aus {e}.","srcServices":"Ihren erfassten Services","srcEst":"Ihren Einstellungen (Schätzung)","srcCloture":"Wareneinsatz-Abweichung aus dem Abschluss vom {a} bis {b}{f}.","fictif":" (fiktive Daten)","attente":"Ein vollständiger Umsatzmonat ist nötig, um zu zeigen, wohin das Geld geht.","nonMesure":"Nicht gemessen ist nicht null: der Rest wird ohne diese Zeilen berechnet.","choisir":"Monat wählen","offTitre":"Außerhalb der 100 € — entgangener Umsatz zum Kartenpreis (brutto)","off_remises":"Rabatte","off_offerts":"Aufs Haus","off_annulations":"Stornos","offPour100":"also {v} je 100 € Einnahmen","offNonFourni":"von der Kasse nicht geliefert","offAbsent":"Aufs Haus, Rabatte und Stornos: für diesen Monat nicht von der Kasse geliefert. Importieren Sie den Tagesexport (Datum, Rabatte, aufs Haus, Stornos).","offImport":"Aufs Haus, Rabatte, Stornos importieren (CSV)","offOk":"{n} Tage gelesen ({a} neu, {r} aktualisiert), {i} Zeile(n) ignoriert.","offKo":"Datei nicht erkannt: eine Datumsspalte und mindestens eine Spalte Rabatte, aufs Haus oder Stornos sind nötig. Nichts wurde gespeichert.","amortissements":"Abschreibungen (Aufwand ohne Geldabfluss)","amortNote":"Diesen Monat: Ergebnis vor Steuern {r}, davon Abschreibungen −{a} (kein Geldabfluss; vor Abschreibungen: {av}). Tagesminimum und Liquidität zählen sie nicht.","taxNote":"Je 100 € Umsatz ohne MwSt. betragen die berücksichtigten Kosten {c}. Ertragsteuer wird nicht berechnet. Dieses Ergebnis ist weder Ihr Kontostand noch Ihr persönliches Einkommen."},"nl":{"h2":"Waar het geld naartoe gaat","kicker":"Per 100 € omzet, excl. btw","reste":"In {m} verdient u {v} per €100 omzet exclusief btw.","manque":"In {m} verliest u {v} per €100 omzet exclusief btw.","matiere":"Geplande grondstoffen (percentage van uw structuur)","pertes":"Geregistreerde verliezen","ecart":"Te controleren grondstofafwijking","ecartAbsent":"Grondstofafwijking: niet gemeten (twee inventarissen nodig)","variables":"Verpakking en andere variabele kosten","commissions":"Platformcommissies","equipeUtile":"Nuttige teamtijd","heuresTrop":"Uren betaald boven het gehouden tempo","equipe":"Team","equipeAbsent":"Team: niet gemeten","fixes":"Huur en vaste kosten","resultat":"Winst vóór belasting","resultatNeg":"Verlies vóór belasting","total":"voor een omzet excl. btw van {v}","change":"Sinds {m}: {l} {d} per 100 €.","sources":"Grondstoffen, verpakking en commissies tegen het percentage van uw structuur; team volgens {e}.","srcServices":"uw geregistreerde diensten","srcEst":"uw instellingen (schatting)","srcCloture":"Grondstofafwijking volgens de afsluiting van {a} tot {b}{f}.","fictif":" (fictieve gegevens)","attente":"Er is één volledige omzetmaand nodig om te tonen waar het geld naartoe gaat.","nonMesure":"Niet gemeten is geen nul: de rest wordt berekend zonder deze regels.","choisir":"Maand kiezen","offTitre":"Buiten de 100 € — gederfde omzet tegen kaartprijs (incl. btw)","off_remises":"Kortingen","off_offerts":"Van het huis","off_annulations":"Annuleringen","offPour100":"of {v} per 100 € ontvangen","offNonFourni":"niet geleverd door de kassa","offAbsent":"Van het huis, kortingen en annuleringen: deze maand niet geleverd door de kassa. Importeer de dagexport (datum, kortingen, van het huis, annuleringen).","offImport":"Van het huis, kortingen, annuleringen importeren (CSV)","offOk":"{n} dagen gelezen ({a} nieuw, {r} bijgewerkt), {i} regel(s) genegeerd.","offKo":"Bestand niet herkend: een datumkolom en minstens één kolom kortingen, van het huis of annuleringen zijn nodig. Er is niets opgeslagen.","amortissements":"Afschrijvingen (kost zonder geldstroom)","amortNote":"Deze maand: resultaat vóór belasting {r}, waarvan afschrijvingen −{a} (geen geldstroom; vóór afschrijvingen: {av}). Het dagminimum en de kas tellen ze niet mee.","taxNote":"Per €100 omzet exclusief btw bedragen de opgenomen kosten {c}. Winstbelasting wordt niet berekend. Dit resultaat is niet uw banksaldo of uw persoonlijke inkomen."},"pt":{"h2":"Para onde vai o dinheiro","kicker":"Por cada 100 € de receita, sem IVA","reste":"Em {m}, ganha {v} por cada 100 € de vendas sem IVA.","manque":"Em {m}, perde {v} por cada 100 € de vendas sem IVA.","matiere":"Matéria prevista (taxa da sua estrutura)","pertes":"Perdas declaradas","ecart":"Desvio de matéria a verificar","ecartAbsent":"Desvio de matéria: não medido (são necessários dois inventários)","variables":"Embalagens e outros custos variáveis","commissions":"Comissões das plataformas","equipeUtile":"Equipa útil","heuresTrop":"Horas pagas acima do ritmo sustentado","equipe":"Equipa","equipeAbsent":"Equipa: não medida","fixes":"Renda e custos fixos","resultat":"Lucro antes de impostos","resultatNeg":"Prejuízo antes de impostos","total":"para uma receita sem IVA de {v}","change":"Desde {m}: {l} {d} por cada 100 €.","sources":"Matéria, embalagens e comissões à taxa da sua estrutura; equipa segundo {e}.","srcServices":"os seus serviços registados","srcEst":"as suas definições (estimativa)","srcCloture":"Desvio de matéria segundo o fecho de {a} a {b}{f}.","fictif":" (dados fictícios)","attente":"É necessário um mês completo de receita para ver para onde vai o dinheiro.","nonMesure":"Não medido não é zero: o resto é calculado sem estas linhas.","choisir":"Escolher o mês","offTitre":"Fora dos 100 € — receita perdida ao preço da carta (com IVA)","off_remises":"Descontos","off_offerts":"Ofertas","off_annulations":"Anulações","offPour100":"ou {v} por cada 100 € recebidos","offNonFourni":"não fornecido pela caixa","offAbsent":"Ofertas, descontos e anulações: não fornecidos pela caixa este mês. Importe a exportação diária (data, descontos, ofertas, anulações).","offImport":"Importar ofertas, descontos, anulações (CSV)","offOk":"{n} dias lidos ({a} novos, {r} atualizados), {i} linha(s) ignorada(s).","offKo":"Ficheiro não reconhecido: são necessárias uma coluna de data e pelo menos uma de descontos, ofertas ou anulações. Nada foi guardado.","amortissements":"Amortizações (custo sem saída de dinheiro)","amortNote":"Este mês: resultado antes de impostos {r}, dos quais amortizações −{a} (sem saída de dinheiro; antes de amortizações: {av}). O mínimo do dia e a tesouraria não as contam.","taxNote":"Por cada 100 € de vendas sem IVA, os custos considerados somam {c}. O imposto sobre lucros não é calculado. Este resultado não é o saldo bancário nem o seu rendimento pessoal."}};
  var VM_COL={amortissements:'#64748b',matiere:'#60a5fa',pertes:'#a78bfa',ecart:'#f59e0b',variables:'#38bdf8',commissions:'#f472b6',equipeUtile:'#34d399',heuresTrop:'#fb923c',equipe:'#34d399',fixes:'#94a3b8',resultat:'#22c55e'};
  var vmSel=null,vmSig=null,vmCache={sig:null,ecart:null},vmLastB=null,vmRenderData=null,vmIdent=null;
  function vmC(){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}return VM_COPY[l]||VM_COPY.fr;}
  function vmF(t,o){return String(t).replace(/\{(\w+)\}/g,function(m,k){return o&&o[k]!=null?o[k]:m;});}
  function vmE(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function vmTag(){try{return typeof root.localeTag==='function'?root.localeTag():'fr-FR';}catch(e){return 'fr-FR';}}
  function vmEur(v,d){if(!vmNum(v))return '—';d=d==null?0:d;return new Intl.NumberFormat(vmTag(),{style:'currency',currency:'EUR',minimumFractionDigits:d,maximumFractionDigits:d}).format(v);}
  /* C213 (W20) : un mois de l'an dernier porte un indice négatif (−1 = décembre de l'an dernier) et son année est écrite. */
  function vmYm(i){var y=Number(root.verdictOperationalClock().key.slice(0,4));if(i<0){y--;i+=12;}return y+'-'+('0'+(i+1)).slice(-2);}
  function vmMois(i){try{var k=vmYm(i),s=new Intl.DateTimeFormat(vmTag(),{month:'long'}).format(new Date(Number(k.slice(0,4)),Number(k.slice(5,7))-1,1,12));return i<0?s+' '+k.slice(0,4):s;}catch(e){return String(i+1);}}
  function vmJour(iso){var p=String(iso||'').slice(0,10).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:'';}
  /* Écart matière de la dernière clôture (taux sur son CA HT), si deux inventaires existent. Mis en cache. */
  function vmEcart(){
    try{
      if(typeof root.verdictMatiereDepuisInventaire!=='function'||!root.VerdictCloture)return null;
      var R=root.verdictMatiereDepuisInventaire();if(!R||!R.statutGlobal||!R.produits)return null;
      var ca=root.VerdictCloture.caHT(R.debutISO,R.finISO),C=root.VerdictCloture.cloture(R,R.coutsBase||{},{},ca);
      if(C.statut!=='ok'||!vmNum(C.caHT)||C.caHT<=0)return null;
      return {txExplique:C.explique/C.caHT,txAVerifier:C.aVerifier/C.caHT,debut:R.debutISO,fin:R.finISO,fictif:!!R.fictif};
    }catch(e){return null;}
  }
  /* Assemble les entrées d'un mois i de l'année courante (mois complet). */
  /* C308 (décision 11) : part de chaque mois dans le chiffre d’affaires de l’année, lue dans la caisse de cette année (journées de caisse
     datées, hors démo écartée) ; null si la caisse ne couvre pas tous les mois travaillés : la saison reste inconnue. */
  var vmSaisonMemo={k:null,v:null};
  function vmSaisonCaisse(y,d){
    var rows=(root.DB&&root.DB.histJour)||[],k=y+'|'+rows.length+'|'+(rows.length?String(rows[rows.length-1]&&rows[rows.length-1].date)+':'+(rows[rows.length-1]&&rows[rows.length-1].caJ):'')+'|'+(d&&d.mois);
    if(vmSaisonMemo.k===k)return vmSaisonMemo.v;
    var mois={},tot=0;rows.forEach(function(r){var dt=String(r&&r.date||'');if(dt.slice(0,4)!==String(y)||typeof r.caJ!=='number'||!isFinite(r.caJ)||r.caJ<0)return;mois[dt.slice(0,7)]=(mois[dt.slice(0,7)]||0)+r.caJ;tot+=r.caJ;});
    var couverts=Object.keys(mois).filter(function(m){return mois[m]>0;}).length,besoin=Math.max(1,Math.min(12,Number(d&&d.mois)||12)),v=null;
    if(tot>0&&couverts>=besoin){v={annee:String(y),parts:{}};for(var mm=1;mm<=12;mm++){var km=y+'-'+('0'+mm).slice(-2);v.parts[km]=(mois[km]||0)/tot;}}
    vmSaisonMemo={k:k,v:v};return v;
  }
  function vmEntrees(i,ecart,teamModel){
    var R=vmRenderData?vmRenderData.model:root.moteur(),d=R.d,ym=vmYm(i),s=0,n=0;
    ((root.DB&&root.DB.histJour)||[]).forEach(function(r){if(String(r&&r.date||'').slice(0,7)===ym&&typeof r.caJ==='number'){s+=r.caJ;n++;}});
    /* C225 (X09b) : les documents priment. Le mois du FEC donne le CA HT et les achats de nourriture et de boissons ; la caisse
       (TTC ramené en HT avec la TVA moyenne) ne sert qu'à défaut. */
    var fecM=root.DB&&root.DB.fecImport&&root.DB.fecImport.monthly&&root.DB.fecImport.monthly[ym],fecHT=fecM&&Number(fecM.revenue)>0?Number(fecM.revenue):null,fecMat=fecHT!=null&&(vmNum(Number(fecM.food))||vmNum(Number(fecM.beverage)))?(Number(fecM.food)||0)+(Number(fecM.beverage)||0):null;
    if((!n||!(s>0))&&!fecHT)return null;var caHT=fecHT!=null?fecHT:s/(1+(vmNum(d.tva)?d.tva:0));
    var M=arguments.length>=3?teamModel:vmRenderData?vmRenderData.team:null;if(arguments.length<3&&!vmRenderData)try{M=root.VerdictTeam&&root.VerdictTeam.model();}catch(e){}var m=M&&M.months&&M.months[i];
    var eq=m&&vmNum(m.cost)&&m.kind!=='off'?{cost:m.cost,useful:m.src==='services'?m.useful:null,costHour:m.src==='services'?m.costHour:null,src:m.src==='services'?'services':'reglages'}:{cost:vmNum(d.salM)?d.salM:null,src:'reglages'};
    vmMigrerAmort();
    /* C298 (V15-004, décision 4) : les charges d'un mois suivent sa part de saison, comme le minimum (mois entier ÷ année entière du plan). */
    var partS=null;try{var ypS=root.DB&&root.DB.performanceYearPlans&&root.DB.performanceYearPlans[ym.slice(0,4)],fmS=ypS&&ypS.fullMonthlyTargets,totS=fmS?Object.keys(fmS).reduce(function(a,k){return a+(Number(fmS[k])||0);},0):0;if(totS>0&&fmS[ym]!=null)partS=(Number(fmS[ym])||0)/totS;}catch(_){partS=null;}
    /* C308 (décision 11) : sans plan d’année, la saison de l’année est lue dans sa caisse quand elle couvre tous les mois travaillés. */
    var partSrc=partS!=null?'plan':null;if(partS==null){var scS=vmSaisonCaisse(ym.slice(0,4),d);if(scS){partS=scS.parts[ym]||0;partSrc='caisse';}}
    /* C308 (V16-005, V16-024, décision 4) : l’équipe d’un mois est un mois de paie (coût annuel ÷ mois travaillés), rien un mois fermé ;
       les heures des services, quand elles existent, restent la mesure du mois. */
    var moisPaie=vmNum(d.salM)&&d.salM>0?d.salM:(vmNum(d.sal)&&Number(d.mois)>0?d.sal/Number(d.mois):null),fermeM=!!((m&&m.kind==='off')||(fmS&&fmS[ym]!=null&&!(Number(fmS[ym])>0)));
    if(fermeM)eq={cost:0,src:'ferme'};else if(eq.src==='reglages'&&moisPaie!=null)eq.cost=moisPaie;
    var demo=root.DB&&root.DB.dataProvenance&&root.DB.dataProvenance.nature==='model_estimate'&&root.DB.demoFinance&&root.DB.demoFinance[ym];
    /* C308 (V16-013) : l’écart matière est celui de l’Audit (VerdictEcartMatiere : périmètre et période écrits), en euros du mois. */
    var ecA=null;try{var EA=typeof root.VerdictEcartMatiere==='function'?root.VerdictEcartMatiere():null;if(EA&&isFinite(Number(EA.pts)))ecA={pts:Number(EA.pts),eur:caHT*Number(EA.pts)/100,avecBoissons:EA.avecBoissons!==false,periode:EA.periode||'',compte:EA.compte!==false};}catch(_){ecA=null;}
    return {ecartAudit:ecA,annee:ym.slice(0,4),partSaison:partS,partSource:partSrc,moisTravailles:Number(d.mois)>0?Number(d.mois):null,amortMois:vmNum(d.amort)&&d.amort>0?(partS!=null?d.amort*partS:d.amort/12):null,caHT:caHT,caSrc:fecHT!=null?'fec':'caisse',matSrc:fecMat!=null?'fec':'structure',taux:{mat:fecMat!=null?fecMat/caHT:(d.ca>0?d.mat/d.ca:null),av:d.ca>0?d.av/d.ca:0,com:d.ca>0?d.com/d.ca:0},equipe:eq,fixesMois:vmNum(d.af)?(partS!=null?d.af*partS:d.af/12):null,
      ecart:ecA?null:demo?{explique:demo.loss,aVerifier:demo.gap}:(ecart?{explique:caHT*ecart.txExplique,aVerifier:caHT*ecart.txAVerifier}:null)};
  }
  /* R267 · un FEC importé avant R267 garde ses amortissements dans fecImport : on les reporte une fois dans la structure. */
  function vmMigrerAmort(){try{var D=root.DB;if(!D||!D.in||D.in.amort!=null)return;var a=D.fecImport&&D.fecImport.totals&&Number(D.fecImport.totals.amortization);if(a>0){D.in.amort=Math.round(a*100)/100;try{root.save('amort-fec');}catch(e){}}}catch(e){}}
  var VM_MAT_FEC={fr:'Matière, nourriture + boissons (achats du mois, document comptable)',en:'Ingredients, food + drinks (purchases of the month, accounting file)',es:'Materia, comida + bebidas (compras del mes, documento contable)',it:'Materie, cibo + bevande (acquisti del mese, documento contabile)',de:'Wareneinsatz, Speisen + Getränke (Einkäufe des Monats, Buchhaltung)',nl:'Grondstoffen, eten + drinken (aankopen van de maand, boekhouding)',pt:'Matéria, comida + bebidas (compras do mês, documento contabilístico)'};
  var VM_MAT={fr:'Matière, nourriture + boissons',en:'Ingredients, food + drinks',es:'Materia, comida + bebidas',it:'Materie, cibo + bevande',de:'Wareneinsatz, Speisen + Getränke',nl:'Grondstoffen, eten + drinken',pt:'Matéria, comida + bebidas'};
  /* C298 (V15-123) : l’équipe lue dans le document comptable n’est pas « d’après vos réglages (estimation) ». Vrai seulement si les salaires des réglages sont encore ceux du FEC. */
  root.VerdictEquipeFec=root.VerdictEquipeFec||{ok:function(){try{var D=root.DB||{},fi=D.fecImport,t=fi&&fi.totals,I=D.in||{};if(!fi||!(fi.appliedAt||fi.hash)||!t||!(Number(t.payroll)>0))return null;var m=(Number(I.salb)||0)+(Number(I.dirb)||0);if(!(m>0))return null;var k=Number(t.payroll)/m,n=Math.round(k);if(n<1||n>24||Math.abs(k-n)>0.01)return null;return {annee:String(fi.period&&fi.period.year||D.exerciseYear||'')};}catch(e){return null;}},
    T:{fr:{e:'votre document comptable (exercice {f})',chip:'D’après votre document comptable (exercice {f})',cost:'Coût de l’équipe {y} (d’après votre document comptable {f})'},
       en:{e:'your accounting file ({f} financial year)',chip:'From your accounting file ({f} financial year)',cost:'Team cost {y} (from your accounting file {f})'},
       es:{e:'su documento contable (ejercicio {f})',chip:'Según su documento contable (ejercicio {f})',cost:'Coste del equipo {y} (según su documento contable {f})'},
       it:{e:'il suo documento contabile (esercizio {f})',chip:'Dal suo documento contabile (esercizio {f})',cost:'Costo della squadra {y} (dal documento contabile {f})'},
       de:{e:'Ihrer Buchhaltungsdatei (Geschäftsjahr {f})',chip:'Aus Ihrer Buchhaltungsdatei (Geschäftsjahr {f})',cost:'Teamkosten {y} (aus Ihrer Buchhaltungsdatei {f})'},
       nl:{e:'uw boekhoudbestand (boekjaar {f})',chip:'Volgens uw boekhoudbestand (boekjaar {f})',cost:'Teamkosten {y} (volgens uw boekhoudbestand {f})'},
       pt:{e:'o seu documento contabilístico (exercício {f})',chip:'Segundo o seu documento contabilístico (exercício {f})',cost:'Custo da equipa {y} (segundo o documento contabilístico {f})'}},
    t:function(k,o){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}var T=this.T[String(l).slice(0,2)]||this.T.fr;return String(T[k]).replace(/\{(\w+)\}/g,function(m,x){return o&&o[x]!=null?o[x]:m;});}};
  var VM_SRC_FEC={fr:'Matière : achats du mois dans votre document comptable ; emballages et commissions au taux de votre structure ; équipe d’après {e}.',en:'Ingredients: purchases of the month in your accounting file; packaging and commissions at your structure’s rate; team from {e}.',es:'Materia: compras del mes en su documento contable; envases y comisiones al porcentaje de su estructura; equipo según {e}.',it:'Materie: acquisti del mese nel suo documento contabile; imballaggi e commissioni al tasso della sua struttura; squadra secondo {e}.',de:'Wareneinsatz: Einkäufe des Monats aus Ihrer Buchhaltung; Verpackung und Provisionen zum Satz Ihrer Struktur; Team laut {e}.',nl:'Grondstoffen: aankopen van de maand in uw boekhouding; verpakking en commissies tegen het tarief van uw structuur; team volgens {e}.',pt:'Matéria: compras do mês no seu documento contabilístico; embalagens e comissões à taxa da sua estrutura; equipa segundo {e}.'};
  function vmLoc(){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}return l;}
  function vmMoisDispo(teamModel){var ci=Number(root.verdictOperationalClock().key.slice(5,7))-1,out=[];for(var i=-12;i<ci;i++){var e=arguments.length?vmEntrees(i,null,teamModel):vmEntrees(i,null);if(e)out.push(i);}return out;}
  var VM_ECART_AUDIT={fr:'Écart matière ({b}, {per}, comme l’Audit) : déjà compris dans la matière',en:'Food cost variance ({b}, same period as the Audit): already included in ingredients',es:'Desviación de materia ({b}, mismo periodo que la Auditoría): ya incluida en la materia',it:'Scostamento materie ({b}, stesso periodo dell’Audit): già compreso nelle materie',de:'Wareneinsatz-Abweichung ({b}, gleicher Zeitraum wie das Audit): bereits im Wareneinsatz enthalten',nl:'Afwijking grondstoffen ({b}, zelfde periode als de Audit): al in de grondstoffen begrepen',pt:'Desvio de matéria ({b}, mesmo período da Auditoria): já incluído na matéria'};
  var VM_ECART_B={fr:['nourriture + boissons','nourriture'],en:['food + drinks','food'],es:['comida + bebidas','comida'],it:['cibo + bevande','cibo'],de:['Speisen + Getränke','Speisen'],nl:['eten + drinken','eten'],pt:['comida + bebidas','comida']};
  function vmLabel(C,x){if(x.k==='ecart'&&x.src==='audit'&&x.info){var l=vmLoc(),b=(VM_ECART_B[l]||VM_ECART_B.fr)[x.info.avecBoissons?0:1];return vmF(VM_ECART_AUDIT[l]||VM_ECART_AUDIT.fr,{b:b,per:x.info.periode||'sur l’année'});}/* C308 (V16-013) */if(x.k==='matiere'&&x.src==='fec')return (VM_MAT_FEC[vmLoc()]||VM_MAT_FEC.fr);if(x.k==='matiere'&&!x.src)return (VM_MAT[vmLoc()]||VM_MAT.fr);if(x.k==='resultat')return x.eur<0?C.resultatNeg:C.resultat;if(!x.mesure&&x.k==='ecart')return C.ecartAbsent;if(!x.mesure&&x.k==='equipe')return C.equipeAbsent;return C[x.k]||x.k;}
  /* P9 · offerts, remises, annulations du mois (hors des 100 €) + import */
  function verdictCaisseAjustImport(text){var P=vcaParse(text);if(!P.ok)return {ok:false};var M=vcaMerge(root.DB.caisseAjust||[],P.lignes);root.DB.caisseAjust=M.liste;try{root.save('caisse-ajustements');}catch(e){}return {ok:true,lignes:P.lignes.length,ajoutees:M.ajoutees,remplacees:M.remplacees,ignorees:P.ignorees};}
  function verdictCaisseAjustPickIn(doc,win){var i=doc.createElement('input');i.type='file';i.accept='.csv,.txt,text/csv,text/plain';i.style.display='none';doc.body.appendChild(i);
    i.onchange=function(){var f=i.files&&i.files[0];if(!f)return;var rd=new win.FileReader();rd.onload=function(){var r=verdictCaisseAjustImport(String(rd.result||'')),C=vmC();try{win.toast(r.ok?vmF(C.offOk,{n:r.lignes,a:r.ajoutees,r:r.remplacees,i:r.ignorees}):C.offKo);}catch(e){}vmAttach(true);try{i.remove();}catch(e){}};rd.readAsText(f);};i.click();}
  root.verdictCaisseAjustImport=verdictCaisseAjustImport;root.verdictCaisseAjustPickIn=verdictCaisseAjustPickIn;
  function vmAjustHTML(C,i,caHT){
    var ym=vmYm(i),S=vcaMois((root.DB&&root.DB.caisseAjust)||[],ym),tva=0;try{tva=Number((vmRenderData?vmRenderData.model:root.moteur()).d.tva)||0;}catch(e){}
    var h='<div data-vm-ajust="'+(S.fourni?'1':'0')+'" style="margin-top:10px;padding-top:8px;border-top:2px dashed rgba(148,163,184,.25)">';
    if(!S.fourni)h+='<p class="sous" style="margin:0 0 6px;font-size:13px">'+vmE(C.offAbsent)+'</p>';
    else{h+='<p class="sous" style="margin:0 0 4px;font-size:12.5px">'+vmE(C.offTitre)+'</p>';
      ['remises','offerts','annulations'].forEach(function(k){h+='<div data-vm-off="'+k+'" style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;font-size:14px"><span>'+vmE(C['off_'+k])+'</span><b>'+(S[k]==null?'<span style="font-weight:500;opacity:.7">'+vmE(C.offNonFourni)+'</span>':vmE(vmEur(S[k])))+'</b></div>';});
      if(caHT>0)h+='<p class="sous" style="margin:4px 0 0;font-size:12.5px">'+vmE(vmF(C.offPour100,{v:vmEur(S.total/(1+tva)/caHT*100,2)}))+'</p>';}
    return h+'<button type="button" class="btn ghost" style="margin-top:6px" onclick="try{parent.verdictCaisseAjustPickIn(document,window)}catch(e){}">'+vmE(C.offImport)+'</button></div>';
  }
  function vmMarkup(C){
    var dispo=vmMoisDispo();
    var head='<h2 id="h2Argent">'+vmE(C.h2)+'</h2><article class="mod" id="modArgent" data-vm-version="P5"';
    if(!dispo.length){vmLastB=null;return head+' data-etat="info"><p class="sous">'+vmE(C.attente)+'</p></article>';}
    if(vmSel==null||dispo.indexOf(vmSel)<0)vmSel=dispo[dispo.length-1];
    var ec=root.DB&&root.DB.demoCompleteVersion==='R275'?null:vmCache.ecart,B=vmBreakdown(vmEntrees(vmSel,ec));vmLastB=B;var _unused=0,prevI=dispo.indexOf(vmSel)>0?dispo[dispo.indexOf(vmSel)-1]:null,P=prevI!=null?vmBreakdown(vmEntrees(prevI,ec)):null;
    var neg=B.reste<0,etat=neg?'rouge':(B.pour100Reste<3?'orange':'vert');
    var h=head+' data-etat="'+etat+'" data-vm-mois="'+vmSel+'"><div class="mod-h"><p class="kicker">'+vmE(C.kicker)+'</p></div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 8px" role="group" aria-label="'+vmE(C.choisir)+'">'+dispo.slice(-6).map(function(i){var on=i===vmSel;return '<button type="button" data-vm-m="'+i+'" aria-pressed="'+on+'" style="min-height:36px;padding:4px 12px;border-radius:999px;border:1px solid '+(on?'#94a3b8':'rgba(148,163,184,.6)')+';background:'+(on?'#e2e8f0':'transparent')+';color:'+(on?'#0b0e12':'inherit')+';font:inherit;font-size:13px;cursor:pointer">'+vmE(vmMois(i))+'</button>';}).join('')+'</div>';
    h+='<p class="verdict-grand" style="color:'+(neg?'#ef4444':'inherit')+'">'+vmE(vmF(neg?C.manque:C.reste,{m:vmMois(vmSel),dm:(/^[aeiouyhâéèêîôûœ]/i.test(vmMois(vmSel))?'d’':'de ')+vmMois(vmSel),v:vmEur(Math.abs(B.pour100Reste),2)}))+'</p>';
    h+='<p class="sous" style="margin:0 0 8px">'+vmE(vmF(C.total,{v:vmEur(B.caHT)}))+'</p>';
    h+='<p class="sous" data-tax-scope style="margin:4px 0 10px;font-size:14px">'+vmE(vmF(C.taxNote,{c:vmEur(100-B.pour100Reste,2)}))+'</p>';
    /* barre : 100 € découpés */
    var pos=B.lignes.filter(function(x){return vmNum(x.pour100)&&x.pour100>0&&!x.inclus;}),tot=pos.reduce(function(a,x){return a+x.pour100;},0);
    h+='<div style="display:flex;height:14px;border-radius:7px;overflow:hidden;margin:0 0 10px" aria-hidden="true">'+pos.map(function(x){return '<span style="width:'+(x.pour100/Math.max(tot,100)*100).toFixed(2)+'%;background:'+VM_COL[x.k]+'"></span>';}).join('')+'</div>';
    B.lignes.forEach(function(x){h+='<div data-vm-l="'+x.k+'" style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-top:1px solid rgba(148,163,184,.12);font-size:14px"><span style="min-width:0"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+(x.k==='resultat'?(x.eur<0?'#ef4444':x.eur===0?'#9aa6b2':'#22c55e'):(VM_COL[x.k]||'#64748b'))+';margin-right:6px"></span>'+vmE(vmLabel(C,x))+'</span><b style="white-space:nowrap'+(x.k==='resultat'&&x.eur<0?';color:#ef4444':'')+'">'+(x.mesure&&vmNum(x.pour100)?vmE(vmEur(x.k==='resultat'?Math.abs(x.pour100):x.pour100,2))+' <span style="font-weight:500;opacity:.7">· '+vmE(vmEur(x.k==='resultat'?Math.abs(x.eur):x.eur))+'</span>':'—')+'</b></div>';});
    var ch=vmChangements(B,P);
    ch.forEach(function(c){var lab=vmLabel(C,{k:c.k,mesure:true,eur:1});h+='<p class="sous" style="margin:6px 0 0">'+vmE(vmF(C.change,{m:vmMois(prevI),l:lab,d:(c.delta>0?'+':'\u2212')+vmEur(Math.abs(c.delta),2)}))+'</p>';});
    h+='<p class="sous" style="margin:8px 0 0;font-size:12.5px">'+vmE(vmF(B.lignes.some(function(x){return x.k==='matiere'&&x.src==='fec';})?(VM_SRC_FEC[vmLoc()]||VM_SRC_FEC.fr):C.sources,{e:(B.lignes.some(function(x){return x.src==='services';})?C.srcServices:(function(){var q=root.VerdictEquipeFec.ok();return q?root.VerdictEquipeFec.t('e',{f:q.annee}):C.srcEst;})())}))+(root.DB&&root.DB.demoCompleteVersion==='R275'?vmE(C.fictif):'')+(ec?' '+vmE(vmF(C.srcCloture,{a:vmJour(ec.debut),b:vmJour(ec.fin),f:ec.fictif?C.fictif:''})):'')+'</p>';
    h+='<p class="sous" data-vm-regle style="margin:6px 0 0;font-size:12.5px">'+vmE(vmRegle(B))+'</p>'; /* C308 (décision 4) */
    var _am=B.lignes.filter(function(x){return x.k==='amortissements';})[0];if(_am)h+='<p class="sous" data-vm-amort style="margin:6px 0 0;font-size:12.5px">'+vmE(vmF(C.amortNote,{r:vmEur(B.reste),a:vmEur(_am.eur),av:vmEur(B.reste+_am.eur)}))+'</p>';
    if(B.nonMesurees.length)h+='<p class="sous" style="margin:4px 0 0;font-size:12.5px;color:#f59e0b">'+vmE(C.nonMesure)+'</p>';
    h+=vmAjustHTML(C,vmSel,B.caHT);
    return h+'</article>';
  }
  /* C308 (V16-005, V16-024, décision 4) : la règle du mois, écrite à côté du résultat, et le résultat d’un mois par sa clé (L5 :
     Plus › Chiffre d’affaires donne le même chiffre que l’Argent). */
  var VM_REGLE={fr:{t:'Règle du mois : {e} ; {c}.',m:'l’équipe compte un mois de paie (coût annuel ÷ {n} mois travaillés, rien un mois fermé)',s:'l’équipe compte les heures de vos services du mois',f:'mois fermé : aucune paie comptée',p:'loyer, charges fixes et amortissements suivent la part de saison du mois ({p} de l’année)',pc:'loyer, charges fixes et amortissements suivent la part de saison du mois lue dans votre caisse {y} ({p} de l’année)',d:'loyer, charges fixes et amortissements : saison inconnue, répartition à parts égales sur les 12 mois'},
    en:{t:'Month rule: {e}; {c}.',m:'the team counts one month of pay (annual cost ÷ {n} months worked, nothing in a closed month)',s:'the team counts the hours of your services this month',f:'closed month: no pay counted',p:'rent, fixed costs and depreciation follow the month’s seasonal share ({p} of the year)',pc:'rent, fixed costs and depreciation follow the month’s seasonal share read in your {y} till data ({p} of the year)',d:'rent, fixed costs and depreciation: season unknown, split in equal parts over the 12 months'},
    es:{t:'Regla del mes: {e}; {c}.',m:'el equipo cuenta un mes de nómina (coste anual ÷ {n} meses trabajados, nada en un mes cerrado)',s:'el equipo cuenta las horas de sus servicios del mes',f:'mes cerrado: ninguna nómina contada',p:'alquiler, gastos fijos y amortizaciones siguen la parte de temporada del mes ({p} del año)',pc:'alquiler, gastos fijos y amortizaciones siguen la parte de temporada del mes leída en su caja {y} ({p} del año)',d:'alquiler, gastos fijos y amortizaciones: temporada desconocida, reparto a partes iguales en los 12 meses'},
    it:{t:'Regola del mese: {e}; {c}.',m:'la squadra conta un mese di paga (costo annuo ÷ {n} mesi lavorati, nulla in un mese chiuso)',s:'la squadra conta le ore dei suoi servizi del mese',f:'mese chiuso: nessuna paga contata',p:'affitto, costi fissi e ammortamenti seguono la quota stagionale del mese ({p} dell’anno)',pc:'affitto, costi fissi e ammortamenti seguono la quota stagionale del mese letta nella sua cassa {y} ({p} dell’anno)',d:'affitto, costi fissi e ammortamenti: stagione sconosciuta, ripartizione in parti uguali sui 12 mesi'},
    de:{t:'Monatsregel: {e}; {c}.',m:'das Team zählt einen Monatslohn (Jahreskosten ÷ {n} Arbeitsmonate, nichts in einem geschlossenen Monat)',s:'das Team zählt die Stunden Ihrer Services dieses Monats',f:'geschlossener Monat: kein Lohn gezählt',p:'Miete, Fixkosten und Abschreibungen folgen dem saisonalen Anteil des Monats ({p} des Jahres)',pc:'Miete, Fixkosten und Abschreibungen folgen dem saisonalen Anteil des Monats aus Ihren Kassendaten {y} ({p} des Jahres)',d:'Miete, Fixkosten und Abschreibungen: Saison unbekannt, Aufteilung zu gleichen Teilen auf die 12 Monate'},
    nl:{t:'Regel van de maand: {e}; {c}.',m:'het team telt één maand loon (jaarkosten ÷ {n} gewerkte maanden, niets in een gesloten maand)',s:'het team telt de uren van uw diensten van de maand',f:'gesloten maand: geen loon geteld',p:'huur, vaste kosten en afschrijvingen volgen het seizoensaandeel van de maand ({p} van het jaar)',pc:'huur, vaste kosten en afschrijvingen volgen het seizoensaandeel van de maand uit uw kassagegevens {y} ({p} van het jaar)',d:'huur, vaste kosten en afschrijvingen: seizoen onbekend, verdeling in gelijke delen over de 12 maanden'},
    pt:{t:'Regra do mês: {e}; {c}.',m:'a equipa conta um mês de salário (custo anual ÷ {n} meses trabalhados, nada num mês fechado)',s:'a equipa conta as horas dos seus serviços do mês',f:'mês fechado: nenhum salário contado',p:'renda, custos fixos e amortizações seguem a parte sazonal do mês ({p} do ano)',pc:'renda, custos fixos e amortizações seguem a parte sazonal do mês lida na sua caixa {y} ({p} do ano)',d:'renda, custos fixos e amortizações: época desconhecida, repartição em partes iguais pelos 12 meses'}};
  function vmRegle(B){
    var T=VM_REGLE[vmLoc()]||VM_REGLE.fr,L=(B&&B.lignes)||[],srv=L.some(function(x){return x.src==='services';}),ferme=L.some(function(x){return x.src==='ferme';}),n=B&&B.moisTravailles,p=B&&B.partSaison;
    var pp=p!=null?(Math.round(p*1000)/10).toLocaleString(vmTag())+'\u202f%':null;
    var e=ferme?T.f:srv?T.s:vmF(T.m,{n:n?String(n):'12'}),c=p!=null?(B.partSource==='caisse'?vmF(T.pc,{p:pp,y:B.annee||''}):vmF(T.p,{p:pp})):T.d; /* C308 (décision 11) */
    return vmF(T.t,{e:e,c:c});
  }
  function vmResultatMois(cle){
    try{
      var k=String(cle||'');if(!/^\d{4}-\d{2}$/.test(k))return {ok:false,raison:'cle'};
      var y=Number(root.verdictOperationalClock().key.slice(0,4)),i=(Number(k.slice(0,4))-y)*12+Number(k.slice(5,7))-1;if(i<-12||i>11)return {ok:false,raison:'periode'};
      var ec=root.DB&&root.DB.demoCompleteVersion==='R275'?null:(vmCache.sig?vmCache.ecart:vmEcart()),inp=vmEntrees(i,ec);if(!inp)return {ok:false,raison:'ca'};
      var B=vmBreakdown(inp);if(!B.ok)return {ok:false,raison:B.raison||'ca'};
      var v=function(){var ks=[].slice.call(arguments);return B.lignes.filter(function(x){return ks.indexOf(x.k)>=0&&vmNum(x.eur)&&!x.inclus;}).reduce(function(a,x){return a+x.eur;},0);};
      return {ok:true,mois:k,caHT:B.caHT,matiere:v('matiere'),equipe:v('equipe','equipeUtile','heuresTrop'),fixes:v('fixes'),amortissements:v('amortissements'),autres:v('variables','commissions','pertes','ecart'),resultat:B.reste,pour100:B.pour100Reste,regle:vmRegle(B),ecartMatiere:inp.ecartAudit||null/* C308 (V16-013) : compris dans la matière */,
        sources:{ca:inp.caSrc,matiere:inp.matSrc,equipe:inp.equipe&&inp.equipe.src||null,partSaison:inp.partSaison,moisTravailles:inp.moisTravailles}};
    }catch(e){return {ok:false,raison:'erreur'};}
  }
  function vmDataSig(){var d=root.DB||{},rows=d.histJour||[],last=rows.length?rows[rows.length-1]:null,clock='';try{clock=root.verdictOperationalClock().key;}catch(e){}
    return [vmC().h2,clock,rows.length,last?last.date+':'+last.caJ:'',d.etab||'',(d.services||[]).length,(d.lossJournal||[]).length,(d.achats||[]).length,(d.caisseAjust||[]).length,vmSel,(typeof verdictNiveau==='function'?verdictNiveau():''),JSON.stringify(d.tresoParams||{}),d.in&&d.in.treso].join('|');}
  /* C333 : ouvrir un chapitre de l’Accueil relance tout de suite les cartes Argent et Année (sans attendre la minuterie). */
  function vmBindChap(doc){if(doc.__vmChap)return;doc.__vmChap=true;doc.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('.vx40-nav'))root.setTimeout(function(){try{vmAttach();}catch(_){}try{if(root.VerdictAnnualProjection&&root.VerdictAnnualProjection.__attach)root.VerdictAnnualProjection.__attach();}catch(_){}},0);},true);}
  function vmBindMonths(doc){
    if(doc.__verdictMoneyClicks)return;doc.__verdictMoneyClicks=true;
    doc.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#modArgent [data-vm-m]');if(!b)return;
      var i=Number(b.getAttribute('data-vm-m'));if(!Number.isInteger(i)||i<-12||i>11||i===vmSel)return; /* C234 : les mois de l'an dernier ont un indice négatif */
      e.preventDefault();vmSel=i;vmAttach(true,true);
    });
  }
  function vmAttach(force,selectionOnly){
    try{
      if(root.VIEW!=='pil')return;var vmId=root.VERDICT_DEMO_SESSION?'demo:'+((root.DB&&root.DB.modele)||''):'reel:'+((root.STORE&&root.STORE.actif)||'');if(vmId!==vmIdent){vmIdent=vmId;vmSel=null;vmSig=null;vmCache={sig:null,ecart:null};vmLastB=null;} /* C298 (D-A29) : un autre établissement repart d’un état neuf */var fr=root.document.querySelector('#v-pil .p41-cadre > iframe')||root.document.querySelector('iframe.p41-ecran');if(!fr)return;var doc=fr.contentDocument;if(!doc)return;
      var chA=doc.getElementById('vx40-argent');vmBindChap(doc);if(!force&&chA&&chA.hidden)return;/* C333 (décision 19) : chapitre Argent caché, rien à calculer */
      var act=doc.getElementById('modAction');if(!act)return;vmBindMonths(doc);var exist=doc.getElementById('modArgent'),sig=vmDataSig();
      if(!force&&exist&&vmSig===sig&&exist.getAttribute('data-vm-sig')===sig)return;
      var R=null;try{R=root.moteur();}catch(e){}
      var drop=function(){var h=doc.getElementById('h2Argent'),m=doc.getElementById('modArgent');if(h)h.parentNode.removeChild(h);if(m)m.parentNode.removeChild(m);};
      if(!R||!R.ready||(typeof root.projetOuvert==='function'&&!root.projetOuvert())){drop();vmSig=sig;return;}
      if(typeof verdictNiveau==='function'&&!voAcces('argent',verdictNiveau())){drop();['modTreso','modCash13','modPro'].forEach(function(id){var e=doc.getElementById(id);if(e)e.parentNode.removeChild(e);});var anc=act.previousElementSibling&&act.previousElementSibling.tagName==='H2'?act.previousElementSibling:act;anc.insertAdjacentHTML('beforebegin',voLockHTML(voC(),null,'modArgent'));var lk=doc.getElementById('modArgent');if(lk)lk.setAttribute('data-vm-sig',sig);vmSig=sig;return;}
      var _pro=doc.getElementById('modPro');if(_pro)_pro.parentNode.removeChild(_pro);
      var dataSig=sig.split('|').slice(0,8).join('|');if(vmCache.sig!==dataSig){vmCache={sig:dataSig,ecart:vmEcart()};}
      var team=null;try{team=root.VerdictTeam&&root.VerdictTeam.model();}catch(e){}vmRenderData={model:R,team:team};
      var html=vmMarkup(vmC());sig=vmDataSig();
      try{if(!selectionOnly&&vmLastB&&vmLastB.ok){var _snap={argent:vmLastB.pour100Reste,mois:vmSel};try{var _E=vfEntrees();if(_E){var _P=vfPlanning(_E);if(_P.ok)_snap.pointBas=_P.pointBas;}}catch(e){}voSnapshot(_snap);}}catch(e){}
      var anchor=act.previousElementSibling&&act.previousElementSibling.tagName==='H2'?act.previousElementSibling:act;
      if(exist&&selectionOnly){var wrap=doc.createElement('div');wrap.innerHTML=html;var fresh=wrap.querySelector('#modArgent');if(fresh){exist.innerHTML=fresh.innerHTML;['data-etat','data-vm-mois'].forEach(function(k){exist.setAttribute(k,fresh.getAttribute(k));});}}
      else{drop();anchor.insertAdjacentHTML('beforebegin',html);}
      var card=doc.getElementById('modArgent');if(card){card.setAttribute('data-vm-sig',sig);
        if(typeof vbAttach==='function')vbAttach(doc,vmSel,vmLastB);
        if(!selectionOnly&&typeof vfAttach==='function')vfAttach(doc);}
      vmSig=sig;
    }catch(e){try{console.error('VerdictArgent : panneau Argent non posé ('+vmIdent+')',e);}catch(x){}}finally{vmRenderData=null;} /* C298 (D-A29) : l’erreur est visible */
  }
  root.VerdictArgent={version:'P5',resultatMois:vmResultatMois/* C308 (décision 4) */,regle:vmRegle,breakdown:vmBreakdown,changements:vmChangements,entrees:vmEntrees,moisDispo:vmMoisDispo,ecart:vmEcart,attach:vmAttach,select:function(i){i=Number(i);if(!Number.isInteger(i)||i<-12||i>11)return;vmSel=i;vmAttach(true,true);}};
  root.setInterval(vmAttach,950);
  /* ═══ fin P5 ═══ */
  /* ═══ P6 — DU RÉSULTAT À LA BANQUE (cœur pur) ═════════════════════════════════
     Variation de trésorerie du mois = résultat + amortissements (charge sans sortie d'argent)
     − hausse du stock − TVA nette à reverser (collectée − déductible) − capital d'emprunt remboursé
     − investissements − prélèvements du dirigeant. Une donnée absente est « non mesurée » : elle est
     listée, jamais comptée à zéro en silence. */
  function vbNum(x){return typeof x==='number'&&isFinite(x);}
  function vbBridge(inp){return root.VerdictFinance.cashBridge(inp);}
  var VB_COPY={"fr": {"kicker": "Du résultat à la banque", "hausse": "En {m}, variation de trésorerie estimée : +{v}.", "baisse": "En {m}, variation de trésorerie estimée : −{v}.", "partiel": "{n} élément(s) non mesuré(s) : la variation est calculée sans eux.", "resultat": "Résultat du mois (où part l’argent) · avant impôt sur le bénéfice", "amortissements": "Amortissements (charge sans sortie d’argent)", "stock": "Hausse du stock", "stockBaisse": "Baisse du stock", "arrondi": "Montants arrondis à l’euro ; l’écart d’arrondi est réparti sur les lignes pour que leur somme tombe juste.", "tvaCollectee": "TVA collectée sur vos ventes", "tvaDeductible": "TVA déductible sur vos achats", "tvaNette": "TVA nette à reverser", "emprunt": "Capital d’emprunt remboursé", "investissements": "Investissements payés", "prelevements": "Prélèvements du dirigeant", "variation": "Variation de trésorerie estimée", "solde": "Trésorerie saisie dans vos chiffres : {s} → environ {f} après ce mois.", "nonMesure": "non mesuré", "reglagesK": "Réglages saisis une fois (par mois)", "reglagesNote": "Montants mensuels. Vide = non renseigné (non compté). Le FEC, quand il couvre le mois, remplace ces réglages.", "attente": "Un mois complet de chiffre d’affaires est nécessaire.", "srcStock": "Variation de stock d’après la clôture du {a} au {b}{f}.", "fictif": " (données fictives)", "sources": "Estimation avec encaissements et paiements dans le même mois. Le résultat est HT : TVA collectée − TVA déductible − TVA nette reversée = 0. Les décalages de règlement et l’impôt sur le bénéfice sont exclus.", "taxNote": "Impôt sur le bénéfice non calculé. Ce montant appartient à l’établissement : ce n’est pas votre revenu personnel disponible."}, "en": {"kicker": "From profit to bank balance", "hausse": "In {m}, your cash should have risen by about {v}.", "baisse": "In {m}, your cash should have fallen by about {v}.", "partiel": "{n} item(s) not measured: the change is calculated without them.", "resultat": "Month result (where the money goes) · before profit tax", "amortissements": "Depreciation (expense with no cash out)", "stock": "Increase in stock", "stockBaisse": "Decrease in stock", "arrondi": "Amounts rounded to the euro; the rounding difference is spread across the lines so that they add up exactly.", "tvaCollectee": "VAT collected on your sales", "tvaDeductible": "VAT deductible on your purchases", "tvaNette": "Net VAT to pay", "emprunt": "Loan principal repaid", "investissements": "Investments paid", "prelevements": "Owner drawings", "variation": "Estimated cash change", "solde": "Cash entered in your figures: {s} → about {f} after this month.", "nonMesure": "not measured", "reglagesK": "Settings entered once (per month)", "reglagesNote": "Monthly amounts. Empty = not entered (not counted). When the FEC covers the month, it replaces these settings.", "attente": "One complete month of revenue is needed.", "srcStock": "Stock change from the closing of {a} to {b}{f}.", "fictif": " (fictional data)", "sources": "Estimate assuming receipts and payments in the same month. Profit excludes VAT: collected − deductible − net VAT paid = 0. Payment timing differences and profit tax are excluded.", "taxNote": "Profit tax is not calculated. This amount belongs to the business; it is not your personal take-home income."}, "es": {"kicker": "Del resultado al banco", "hausse": "En {m}, su tesorería debería haber subido unos {v}.", "baisse": "En {m}, su tesorería debería haber bajado unos {v}.", "partiel": "{n} elemento(s) no medido(s): la variación se calcula sin ellos.", "resultat": "Resultado del mes (adónde va el dinero) · antes del impuesto sobre beneficios", "amortissements": "Amortizaciones (gasto sin salida de dinero)", "stock": "Aumento del stock", "stockBaisse": "Disminución del stock", "arrondi": "Importes redondeados al euro; la diferencia de redondeo se reparte entre las líneas para que la suma cuadre.", "tvaCollectee": "IVA repercutido en sus ventas", "tvaDeductible": "IVA deducible en sus compras", "tvaNette": "IVA neto a ingresar", "emprunt": "Capital de préstamo devuelto", "investissements": "Inversiones pagadas", "prelevements": "Retiradas del titular", "variation": "Variación de tesorería estimada", "solde": "Tesorería indicada en sus cifras: {s} → unos {f} tras este mes.", "nonMesure": "no medido", "reglagesK": "Ajustes indicados una vez (por mes)", "reglagesNote": "Importes mensuales. Vacío = no indicado (no contado). Cuando el FEC cubre el mes, sustituye estos ajustes.", "attente": "Se necesita un mes completo de ingresos.", "srcStock": "Variación de stock según el cierre del {a} al {b}{f}.", "fictif": " (datos ficticios)", "sources": "Estimación con cobros y pagos en el mismo mes. Resultado sin IVA: repercutido − deducible − IVA neto pagado = 0. Se excluyen desfases de pago e impuesto sobre beneficios.", "taxNote": "Impuesto sobre beneficios no calculado. Este importe pertenece al negocio; no es su renta personal disponible."}, "it": {"kicker": "Dal risultato alla banca", "hausse": "A {m}, la sua cassa dovrebbe essere aumentata di circa {v}.", "baisse": "A {m}, la sua cassa dovrebbe essere diminuita di circa {v}.", "partiel": "{n} elemento/i non misurato/i: la variazione è calcolata senza di essi.", "resultat": "Risultato del mese (dove vanno i soldi) · prima delle imposte sul reddito", "amortissements": "Ammortamenti (costo senza uscita di cassa)", "stock": "Aumento delle scorte", "stockBaisse": "Diminuzione delle scorte", "arrondi": "Importi arrotondati all’euro; la differenza di arrotondamento è ripartita sulle righe perché la somma torni.", "tvaCollectee": "IVA incassata sulle vendite", "tvaDeductible": "IVA detraibile sugli acquisti", "tvaNette": "IVA netta da versare", "emprunt": "Capitale di prestito rimborsato", "investissements": "Investimenti pagati", "prelevements": "Prelievi del titolare", "variation": "Variazione di cassa stimata", "solde": "Cassa indicata nei suoi numeri: {s} → circa {f} dopo questo mese.", "nonMesure": "non misurato", "reglagesK": "Impostazioni inserite una volta (al mese)", "reglagesNote": "Importi mensili. Vuoto = non indicato (non contato). Quando il FEC copre il mese, sostituisce queste impostazioni.", "attente": "Serve un mese completo di ricavi.", "srcStock": "Variazione delle scorte dalla chiusura dal {a} al {b}{f}.", "fictif": " (dati fittizi)", "sources": "Stima con incassi e pagamenti nello stesso mese. Risultato IVA esclusa: riscossa − detraibile − IVA netta versata = 0. Esclusi sfasamenti dei pagamenti e imposte sul reddito.", "taxNote": "Imposte sul reddito non calcolate. Questo importo appartiene all’attività, non è il reddito personale disponibile."}, "de": {"kicker": "Vom Ergebnis zum Kontostand", "hausse": "Im {m} dürfte Ihre Liquidität um etwa {v} gestiegen sein.", "baisse": "Im {m} dürfte Ihre Liquidität um etwa {v} gesunken sein.", "partiel": "{n} Posten nicht gemessen: die Veränderung wird ohne sie berechnet.", "resultat": "Monatsergebnis (wohin das Geld geht) · vor Ertragsteuer", "amortissements": "Abschreibungen (Aufwand ohne Geldabfluss)", "stock": "Bestandserhöhung", "stockBaisse": "Bestandsminderung", "arrondi": "Beträge auf volle Euro gerundet; die Rundungsdifferenz wird auf die Zeilen verteilt, damit die Summe aufgeht.", "tvaCollectee": "Vereinnahmte MwSt. auf Verkäufe", "tvaDeductible": "Vorsteuer auf Einkäufe", "tvaNette": "Zu zahlende Netto-MwSt.", "emprunt": "Getilgtes Darlehenskapital", "investissements": "Bezahlte Investitionen", "prelevements": "Privatentnahmen", "variation": "Geschätzte Liquiditätsveränderung", "solde": "In Ihren Zahlen erfasste Liquidität: {s} → etwa {f} nach diesem Monat.", "nonMesure": "nicht gemessen", "reglagesK": "Einmal erfasste Einstellungen (pro Monat)", "reglagesNote": "Monatsbeträge. Leer = nicht erfasst (nicht gezählt). Deckt der FEC den Monat ab, ersetzt er diese Einstellungen.", "attente": "Ein vollständiger Umsatzmonat ist nötig.", "srcStock": "Bestandsveränderung aus dem Abschluss vom {a} bis {b}{f}.", "fictif": " (fiktive Daten)", "sources": "Schätzung bei Ein- und Auszahlungen im selben Monat. Ergebnis ohne MwSt.: vereinnahmte − Vorsteuer − abgeführte Nettosteuer = 0. Zahlungsverschiebungen und Ertragsteuer sind ausgeschlossen.", "taxNote": "Ertragsteuer nicht berechnet. Dieser Betrag gehört dem Betrieb und ist kein persönlich verfügbares Nettoeinkommen."}, "nl": {"kicker": "Van resultaat naar banksaldo", "hausse": "In {m} had uw kas met ongeveer {v} moeten stijgen.", "baisse": "In {m} had uw kas met ongeveer {v} moeten dalen.", "partiel": "{n} post(en) niet gemeten: de verandering is zonder berekend.", "resultat": "Maandresultaat (waar het geld naartoe gaat) · vóór winstbelasting", "amortissements": "Afschrijvingen (kost zonder geldstroom)", "stock": "Toename van de voorraad", "stockBaisse": "Afname van de voorraad", "arrondi": "Bedragen afgerond op de euro; het afrondingsverschil is over de regels verdeeld zodat de som klopt.", "tvaCollectee": "Btw ontvangen op uw verkopen", "tvaDeductible": "Aftrekbare btw op uw aankopen", "tvaNette": "Netto af te dragen btw", "emprunt": "Afgelost leningkapitaal", "investissements": "Betaalde investeringen", "prelevements": "Privé-opnames", "variation": "Geschatte kasverandering", "solde": "Kas ingevuld in uw cijfers: {s} → ongeveer {f} na deze maand.", "nonMesure": "niet gemeten", "reglagesK": "Eenmalig ingevulde instellingen (per maand)", "reglagesNote": "Maandbedragen. Leeg = niet ingevuld (niet meegeteld). Als de FEC de maand dekt, vervangt hij deze instellingen.", "attente": "Er is één volledige omzetmaand nodig.", "srcStock": "Voorraadverandering volgens de afsluiting van {a} tot {b}{f}.", "fictif": " (fictieve gegevens)", "sources": "Raming met ontvangsten en betalingen in dezelfde maand. Resultaat excl. btw: ontvangen − aftrekbaar − netto afgedragen btw = 0. Betaalverschillen en winstbelasting zijn uitgesloten.", "taxNote": "Winstbelasting niet berekend. Dit bedrag behoort aan het bedrijf; het is geen persoonlijk besteedbaar inkomen."}, "pt": {"kicker": "Do resultado ao banco", "hausse": "Em {m}, a sua tesouraria deverá ter subido cerca de {v}.", "baisse": "Em {m}, a sua tesouraria deverá ter descido cerca de {v}.", "partiel": "{n} elemento(s) não medido(s): a variação é calculada sem eles.", "resultat": "Resultado do mês (para onde vai o dinheiro) · antes do imposto sobre lucros", "amortissements": "Amortizações (custo sem saída de dinheiro)", "stock": "Aumento do stock", "stockBaisse": "Diminuição do stock", "arrondi": "Montantes arredondados ao euro; a diferença de arredondamento é repartida pelas linhas para que a soma bata certo.", "tvaCollectee": "IVA liquidado nas vendas", "tvaDeductible": "IVA dedutível nas compras", "tvaNette": "IVA líquido a entregar", "emprunt": "Capital de empréstimo reembolsado", "investissements": "Investimentos pagos", "prelevements": "Levantamentos do gerente", "variation": "Variação de tesouraria estimada", "solde": "Tesouraria indicada nos seus números: {s} → cerca de {f} após este mês.", "nonMesure": "não medido", "reglagesK": "Definições indicadas uma vez (por mês)", "reglagesNote": "Montantes mensais. Vazio = não indicado (não contado). Quando o FEC cobre o mês, substitui estas definições.", "attente": "É necessário um mês completo de receita.", "srcStock": "Variação de stock segundo o fecho de {a} a {b}{f}.", "fictif": " (dados fictícios)", "sources": "Estimativa com recebimentos e pagamentos no mesmo mês. Resultado sem IVA: liquidado − dedutível − IVA líquido pago = 0. Exclui desfasamentos de pagamento e imposto sobre lucros.", "taxNote": "Imposto sobre lucros não calculado. Este valor pertence ao estabelecimento; não é o seu rendimento pessoal disponível."}};
  function vbC(){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}return VB_COPY[l]||VB_COPY.fr;}
  function vbParams(){var d=root.DB||{};return d.tresoParams||{};}
  function vbSetParam(k,val){root.DB.tresoParams=root.DB.tresoParams||{};if(val==null||val==='')delete root.DB.tresoParams[k];else root.DB.tresoParams[k]=val;try{root.save('treso-params');}catch(e){}}
  /* Flux du FEC pour un mois (si l'import FEC garde les flux par mois). */
  function vbFluxMois(ym){var f=root.DB&&root.DB.fecImport;var M=f&&f.monthlyFlux&&f.monthlyFlux[ym];return M||null;}
  /* Variation de stock de la dernière clôture si elle recouvre au moins la moitié du mois. */
  function vbStockMois(ym){
    try{if(typeof root.verdictMatiereDepuisInventaire!=='function'||!root.VerdictCloture)return null;var R=root.verdictMatiereDepuisInventaire();if(!R||!R.statutGlobal)return null;
      var a=String(R.debutISO).slice(0,10),b=String(R.finISO).slice(0,10),y=+ym.slice(0,4),m=+ym.slice(5,7),n=new Date(Date.UTC(y,m,0)).getUTCDate(),in_=0;
      for(var d=1;d<=n;d++){var iso=ym+'-'+('0'+d).slice(-2);if(iso>=a&&iso<=b)in_++;}if(in_<n/2)return null;
      var C=root.VerdictCloture.cloture(R,R.coutsBase||{},{},null);if(C.statut!=='ok')return null;return {valeur:C.stockFin-C.stockDebut,debut:a,fin:b,fictif:!!R.fictif};}catch(e){return null;}
  }
  function vbEntrees(i,B){
    var d=root.moteur().d,ym=vmYm(i),y=Number(ym.slice(0,4)),ttc=0,n=0;
    ((root.DB&&root.DB.histJour)||[]).forEach(function(r){if(String(r&&r.date||'').slice(0,7)===ym&&typeof r.caJ==='number'){ttc+=r.caJ;n++;}});
    if(!n&&B&&B.ok&&B.caHT>0&&root.DB&&root.DB.fecImport&&root.DB.fecImport.monthly&&root.DB.fecImport.monthly[ym]){ttc=B.caHT*(1+(vbNum(d.tva)?d.tva:0));n=1;}
    if(!n||!B||!B.ok)return null;var ht=B.caHT,P=vbParams(),F=vbFluxMois(ym),fi=root.DB&&root.DB.fecImport,st=vbStockMois(ym);
    var demo=root.DB&&root.DB.dataProvenance&&root.DB.dataProvenance.nature==='model_estimate'&&root.DB.demoFinance&&root.DB.demoFinance[ym];if(demo){F=demo;st={valeur:demo.stockChange,debut:ym+'-01',fin:ym+'-'+new Date(y,Number(ym.slice(5,7)),0).getDate(),fictif:true};}
    return {resultat:B.reste,caTTC:ttc,tvaCollectee:ttc-ht,tvaDeductible:F&&vbNum(F.tvaDeductible)?F.tvaDeductible:null,srcTvaDed:demo?'demo':'fec',
      amortissements:vbNum(d.amort)&&d.amort>0?d.amort/12:(fi?0:null),
      variationStock:st?st.valeur:null,stockInfo:st,
      empruntCapital:F&&vbNum(F.empruntCapital)?F.empruntCapital:(vbNum(Number(P.emprunt))&&P.emprunt!==''&&P.emprunt!=null?Number(P.emprunt):null),srcEmprunt:F&&vbNum(F.empruntCapital)?'fec':'reglage',
      investissements:F&&vbNum(F.immobilisations)?F.immobilisations:(P.investissements!=null&&P.investissements!==''?Number(P.investissements):null),srcInvest:F&&vbNum(F.immobilisations)?'fec':'reglage',
      prelevements:F&&vbNum(F.prelevements)?F.prelevements:(P.prelevements!=null&&P.prelevements!==''?Number(P.prelevements):null),srcPrel:F&&vbNum(F.prelevements)?'fec':'reglage',
      solde:vbNum(Number(root.DB&&root.DB.in&&root.DB.in.treso))&&root.DB.in.treso!==''&&root.DB.in.treso!=null?Number(root.DB.in.treso):null};
  }
  /* V01 : une variation de stock négative est une baisse du stock (elle rend de l'argent) : libellé « Baisse du stock ». */
  function vbLab(C,x){return x.k==='stock'&&x.mesure&&x.eur<0?C.stockBaisse:(C[x.k]||x.k);}
  /* V01 : signe affiché = sens × montant (ce que le moteur compte), jamais le seul sens : la somme des lignes égale le total. */
  function vbSigne(n){return n>0?'+ ':(n<0?'− ':'');}
  function vbRnd(v){return (v<0?-1:1)*Math.round(Math.abs(v));}
  /* V01 : chaque ligne arrondie à l'euro séparément ne retombe pas toujours sur le total arrondi (septembre de la démo :
     5 821 € contre 5 819 €). Le résultat du mois garde son arrondi (il est cité ailleurs) ; l'écart restant est réparti
     sur les autres lignes comptées, au plus grand reste (au plus 1 € par ligne). */
  function vbArrondis(R){
    var v={},rows=[],fixed=0,fixed0=0,base=0,ajuste=false;
    R.lignes.forEach(function(x){if(!x.mesure)return;if(x.k==='resultat'){fixed=fixed0=vbRnd(x.eur);return;}if(x.info||x.sens===0)return;
      var c=Math.round(x.sens*x.eur*100),b=Math.floor(c/100);rows.push({k:x.k,c:c,b:b,r:c-b*100,n:rows.length});base+=b;});
    var k=vbRnd(R.variation)-fixed-base;
    rows.slice().sort(function(a,b){return b.r-a.r||a.n-b.n;}).forEach(function(o){if(k>0&&o.r>0){o.b++;k--;}});
    fixed+=k;v.resultat=fixed;if(fixed!==fixed0)ajuste=true;
    rows.forEach(function(o){v[o.k]=o.b;if(o.b!==vbRnd(o.c/100))ajuste=true;});
    return {v:v,ajuste:ajuste};
  }
  function vbMarkup(C,i,B){
    var head='<article class="mod" id="modTreso" data-vb-version="P6"';
    var E=vbEntrees(i,B);if(!E)return head+' data-etat="info"><div class="mod-h"><p class="kicker">'+vmE(C.kicker)+'</p></div><p class="sous">'+vmE(C.attente)+'</p></article>';
    var R=vbBridge(E),neg=R.variation<0,etat=neg?'orange':'vert';
    var h=head+' data-etat="'+etat+'" data-vb-mois="'+i+'"><div class="mod-h"><p class="kicker">'+vmE(C.kicker)+'</p></div>';
    h+='<p class="verdict-grand" style="color:'+(neg?'#f59e0b':'inherit')+'">'+vmE(vmF(neg?C.baisse:C.hausse,{m:vmMois(i),v:vmEur(Math.abs(R.variation))}))+'</p>';
    h+='<p class="sous" data-tax-scope style="margin:4px 0 10px;font-size:14px">'+vmE(C.taxNote)+'</p>';
    if(R.nonMesurees.length)h+='<p class="sous" style="margin:0 0 8px;color:#f59e0b">'+vmE(vmF(C.partiel,{n:R.nonMesurees.length}))+'</p>';
    var A=vbArrondis(R);
    R.lignes.forEach(function(x){var val=!x.mesure?'—':(x.k==='resultat'?vmEur(A.v.resultat):(x.sens===0?vmEur(Math.abs(x.eur)):vbSigne(A.v[x.k])+vmEur(Math.abs(A.v[x.k]))));
      h+='<div data-vb-l="'+x.k+'" style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-top:1px solid rgba(148,163,184,.12);font-size:14px'+(x.info?';opacity:.75':'')+'"><span style="min-width:0">'+vmE(vbLab(C,x))+(x.mesure?'':' <span style="color:#f59e0b">· '+vmE(C.nonMesure)+'</span>')+'</span><b style="white-space:nowrap'+(x.k==='resultat'&&x.eur<0?';color:#ef4444':'')+'">'+vmE(val)+'</b></div>';});
    h+='<div style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-top:2px solid rgba(148,163,184,.3);font-size:15px"><b>'+vmE(C.variation)+'</b><b style="color:'+(neg?'#f59e0b':'#22c55e')+'">'+vmE((neg?'− ':'+ ')+vmEur(Math.abs(R.variation)))+'</b></div>';
    if(A.ajuste)h+='<p class="sous" data-vb-arrondi style="margin:4px 0 0;font-size:12.5px">'+vmE(C.arrondi)+'</p>';
    if(R.solde!=null&&vbParams().dateSolde===vmYm(i)+'-01')h+='<p class="sous" style="margin:4px 0 0">'+vmE(vmF(C.solde,{s:vmEur(R.solde),f:vmEur(R.soldeFin)}))+'</p>';
    /* réglages saisis une fois */
    var P=vbParams();
    h+='<details style="margin-top:8px"><summary class="sous" style="cursor:pointer;margin:0">'+vmE(C.reglagesK)+'</summary><p class="sous" style="margin:6px 0">'+vmE(C.reglagesNote)+'</p>'+
      [['emprunt',C.emprunt],['prelevements',C.prelevements],['investissements',C.investissements]].map(function(o){return '<label class="sous" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:4px 0">'+vmE(o[1])+'<input type="number" inputmode="decimal" min="0" step="1" data-vb-k="'+o[0]+'" value="'+(P[o[0]]!=null?vmE(P[o[0]]):'')+'" placeholder="—" style="width:110px;padding:8px;border-radius:10px"></label>';}).join('')+'</details>';
    if(E.stockInfo)h+='<p class="sous" style="margin:6px 0 0;font-size:12.5px">'+vmE(vmF(C.srcStock,{a:vmJour(E.stockInfo.debut),b:vmJour(E.stockInfo.fin),f:E.stockInfo.fictif?C.fictif:''}))+'</p>';
    h+='<p class="sous" style="margin:6px 0 0;font-size:12.5px">'+vmE(C.sources)+'</p>';
    return h+'</article>';
  }
  function vbAttach(doc,i,B){
    try{var old=doc.getElementById('modTreso');if(old)old.parentNode.removeChild(old);var arg=doc.getElementById('modArgent');if(!arg)return;
      arg.insertAdjacentHTML('afterend',vbMarkup(vbC(),i,B));var card=doc.getElementById('modTreso');if(!card)return;
      card.addEventListener('change',function(e){var inp=e.target&&e.target.closest&&e.target.closest('[data-vb-k]');if(!inp)return;var val=inp.value===''?null:Number(inp.value);if(val!=null&&!(val>=0))val=null;vbSetParam(inp.getAttribute('data-vb-k'),val);vmAttach(true);});
    }catch(e){try{console.warn('VerdictTreso',e);}catch(x){}}
  }
  root.VerdictTreso={version:'P6',bridge:vbBridge,entrees:vbEntrees,params:vbParams,setParam:vbSetParam};
  /* ═══ fin P6 ═══ */
  /* ═══ P7 — TRÉSORERIE À 13 SEMAINES (cœur pur) ═══════════════════════════════
     Solde de départ + encaissements prévus jour par jour − sorties datées (fournisseurs avec délai, salaires,
     cotisations, loyer et charges fixes, TVA nette, emprunt, prélèvements, investissements) → solde de fin de
     chaque semaine, point bas, semaine critique et ce qui la charge. Sans solde de départ : rien n'est calculé. */
  function vfNum(x){return typeof x==='number'&&isFinite(x);}
  function vfAdd(iso,n){var p=String(iso).split('-'),d=new Date(Date.UTC(+p[0],+p[1]-1,+p[2]+n,12));return d.toISOString().slice(0,10);}
  function vfDaysIn(y,m){return new Date(Date.UTC(y,m,0)).getUTCDate();}
  /* Jours du mois où tombe une sortie mensuelle : jour 0 = dernier jour du mois ; plafonné à la longueur du mois. */
  function vfJourMois(iso,jour){var p=String(iso).split('-'),y=+p[0],m=+p[1],n=vfDaysIn(y,m);var j=jour===0?n:Math.min(Math.max(1,jour|0),n);return p[0]+'-'+p[1]+'-'+('0'+j).slice(-2);}
  /* in = {debut, solde, jours:[{date,caTTC}], tva, tauxAchats, tauxCom, mensuel:{nets,cotisations,fixes,emprunt,prelevements,investissements}, params:{...}} */
  /* Internal cash reserve guide, independent of profitability and sales targets. */
  function vfReserveState(balance,weeklyOutflow){
    if(!vfNum(balance)||!vfNum(weeklyOutflow)||weeklyOutflow<=0)return balance<0?'rouge':'info';
    return balance<0?'rouge':balance<weeklyOutflow*2?'orange':balance<weeklyOutflow*4?'jaune':'vert';
  }
  function vfReserveColor(state){return {vert:'#22c55e',jaune:'#eab308',orange:'#f97316',rouge:'#ef4444',info:'#9aa6b2'}[state]||'#9aa6b2';}
  function vfPlanning(inp){return root.VerdictFinance.cashPlanning(inp);}
  /* Prévision jour par jour (pur) : même jour de semaine autour de la même date N-1 (±10 jours) × évolution, sinon 8 derniers mêmes jours ; un jour sans aucune activité connue = 0 (fermé). */
  function vfPrevision(hist,debut,nJours,growth,calendar){
 var F=root.VerdictFinance,byDate={},rows=[];(hist||[]).forEach(function(r){var d=String(r&&r.date||'').slice(0,10);if(F.isoDate(d)&&typeof r.caJ==='number'&&Number.isFinite(r.caJ)&&r.caJ>=0){byDate[d]=r.caJ;rows.push({d:d,ca:r.caJ});}});rows.sort(function(a,b){return a.d.localeCompare(b.d);});
 var g=typeof growth==='number'&&Number.isFinite(growth)&&growth>0?growth:1,out=[];function wd(d){return new Date(d+'T12:00:00Z').getUTCDay();}
 for(var i=0;i<nJours;i++){var date=F.addDate(debut,i);if(calendar&&calendar.isClosed&&calendar.isClosed(date)){out.push({date:date,caTTC:0,source:'ferme',observedClosure:true});continue;}var day=wd(date),reference=F.addDate(date,-364),values=[];for(var offset=-10;offset<=10;offset++){var previous=F.addDate(reference,offset);if(wd(previous)===day&&byDate[previous]!==undefined)values.push(byDate[previous]);}
  if(values.length){out.push({date:date,caTTC:F.sum(values).div(values.length).mul(g).number(2),source:'n1',sampleSize:values.length});continue;}
  var recent=[];for(var j=rows.length-1;j>=0&&recent.length<8;j--)if(rows[j].d<debut&&wd(rows[j].d)===day)recent.push(rows[j].ca);
  out.push({date:date,caTTC:recent.length?F.sum(recent).div(recent.length).number(2):null,source:recent.length?'recent':'unknown',sampleSize:recent.length});
 }return out;
}
  var VF_COPY={"fr": {"kicker": "Votre compte en banque, les 3 prochains mois", "bas": "Moment le plus serré : environ {v} sur votre compte, la semaine du {a} au {b} (dans {n} sem.).", "neg": "Votre compte en banque passerait sous zéro la semaine du {a} au {b} : {v}.", "causes": "Cette semaine-là : {l}.", "sansSolde": "Renseignez votre trésorerie disponible dans « Mes chiffres » pour voir les 13 semaines.", "col": "Semaine · encaissements · sorties · solde de fin", "sem": "S{i} · {a} → {b}", "hyp": "Encaissements prévus = même jour l’an dernier × votre évolution (sinon vos 8 derniers mêmes jours ; 0 = fermé). Fournisseurs payés à {d} jours, TVA déductible estimée à {t} du HT des achats et charges, cotisations {r}, paiements carte comptés le jour même. Impôt sur les bénéfices non inclus. Salaires nets estimés à 78 % du brut, cotisations = coût chargé − nets.", "mensuel": "mensuelles", "trimestriel": "trimestrielles", "reglagesK": "Hypothèses modifiables", "delai": "Délai de paiement des fournisseurs (jours)", "jSal": "Jour de paie (0 = dernier jour du mois)", "jUr": "Jour de paiement URSSAF", "rythme": "Rythme URSSAF (mensuel / trimestriel)", "jTva": "Jour de paiement de la TVA", "txDed": "TVA déductible estimée (% du HT)", "jLoy": "Jour du loyer", "jEmp": "Jour de l’échéance d’emprunt", "jPre": "Jour des prélèvements", "dateSolde": "Date du solde saisi", "k_encaissements": "encaissements", "k_fournisseurs": "fournisseurs", "k_salaires": "salaires nets", "k_cotisations": "cotisations URSSAF", "k_loyer": "loyer et charges fixes", "k_tva": "TVA", "k_emprunt": "emprunt", "k_prelevements": "prélèvements", "k_investissements": "investissements", "k_commissions": "commissions", "regle": "Estimation, pas une certitude : une semaine creuse ou un client en retard déplace le point bas. Le patron décide.", "week": "Semaine", "receipts": "Entrées", "payments": "Sorties", "balance": "Solde prévu", "state_vert": "Réserve", "state_jaune": "Vigilance", "state_orange": "Tension", "state_rouge": "Déficit", "state_info": "Non évalué", "cashOnly": "À droite : argent estimé disponible en fin de semaine, après les entrées et sorties prévues. Cette couleur évalue la réserve de trésorerie, pas la rentabilité.", "reserveBasis": "Une semaine de réserve = {v} de sorties moyennes sur ces 13 semaines.", "reserveGuide": "Repère interne Verdict : vert ≥ 4 semaines de réserve ; jaune de 2 à moins de 4 ; orange de 0 à moins de 2 ; rouge : solde négatif. Impôt sur le bénéfice exclu."}, "en": {"kicker": "13-week cash forecast", "bas": "Expected low point: {v} in the week of {a} to {b} (in {n} week(s)).", "neg": "Your cash would go below zero in the week of {a} to {b}: {v}.", "causes": "That week: {l}.", "sansSolde": "Enter your available cash in “My figures” to see the 13 weeks.", "col": "Week · receipts · payments · closing balance", "sem": "W{i} · {a} → {b}", "hyp": "Expected receipts = same day last year × your trend (otherwise your last 8 same weekdays; 0 = closed). Suppliers paid at {d} days, deductible VAT estimated at {t} of purchases and charges excl. VAT, {r} social contributions, card payments counted the same day. Corporate tax not included. Net wages estimated at 78 % of gross; contributions = loaded cost − net.", "mensuel": "monthly", "trimestriel": "quarterly", "reglagesK": "Editable assumptions", "delai": "Supplier payment delay (days)", "jSal": "Payday (0 = last day of the month)", "jUr": "Social contributions payment day", "rythme": "Contributions rhythm (monthly / quarterly)", "jTva": "VAT payment day", "txDed": "Estimated deductible VAT (% excl. VAT)", "jLoy": "Rent day", "jEmp": "Loan instalment day", "jPre": "Drawings day", "dateSolde": "Date of the entered balance", "k_encaissements": "receipts", "k_fournisseurs": "suppliers", "k_salaires": "net wages", "k_cotisations": "social contributions", "k_loyer": "rent and fixed costs", "k_tva": "VAT", "k_emprunt": "loan", "k_prelevements": "drawings", "k_investissements": "investments", "k_commissions": "commissions", "regle": "An estimate, not a certainty: a quiet week or a late payer moves the low point. The owner decides.", "week": "Week", "receipts": "In", "payments": "Out", "balance": "Forecast balance", "state_vert": "Reserve", "state_jaune": "Watch", "state_orange": "Tight", "state_rouge": "Deficit", "state_info": "Not assessed", "cashOnly": "Right: estimated cash available at week end, after expected receipts and payments. Colour rates the cash reserve, not profitability.", "reserveBasis": "One reserve week = {v} average weekly outflows over these 13 weeks.", "reserveGuide": "Internal Verdict guide: green ≥ 4 reserve weeks; yellow 2 to under 4; orange 0 to under 2; red: negative balance. Profit tax excluded."}, "es": {"kicker": "Tesorería a 13 semanas", "bas": "Punto bajo previsto: {v} la semana del {a} al {b} (dentro de {n} semana(s)).", "neg": "Su tesorería pasaría por debajo de cero la semana del {a} al {b}: {v}.", "causes": "Esa semana: {l}.", "sansSolde": "Indique su tesorería disponible en «Mis cifras» para ver las 13 semanas.", "col": "Semana · cobros · pagos · saldo final", "sem": "S{i} · {a} → {b}", "hyp": "Cobros previstos = mismo día del año pasado × su evolución (si no, sus 8 últimos mismos días; 0 = cerrado). Proveedores pagados a {d} días, IVA deducible estimado al {t} de la base de compras y cargas, cotizaciones {r}, pagos con tarjeta contados el mismo día. Impuesto sobre beneficios no incluido. Salarios netos estimados al 78 % del bruto; cotizaciones = coste total − netos.", "mensuel": "mensuales", "trimestriel": "trimestrales", "reglagesK": "Hipótesis modificables", "delai": "Plazo de pago a proveedores (días)", "jSal": "Día de pago de nóminas (0 = último día del mes)", "jUr": "Día de pago de cotizaciones", "rythme": "Ritmo de cotizaciones (mensual / trimestral)", "jTva": "Día de pago del IVA", "txDed": "IVA deducible estimado (% de la base)", "jLoy": "Día del alquiler", "jEmp": "Día de la cuota del préstamo", "jPre": "Día de las retiradas", "dateSolde": "Fecha del saldo indicado", "k_encaissements": "cobros", "k_fournisseurs": "proveedores", "k_salaires": "salarios netos", "k_cotisations": "cotizaciones", "k_loyer": "alquiler y cargas fijas", "k_tva": "IVA", "k_emprunt": "préstamo", "k_prelevements": "retiradas", "k_investissements": "inversiones", "k_commissions": "comisiones", "regle": "Una estimación, no una certeza: una semana floja o un cliente que paga tarde mueve el punto bajo. El patrón decide.", "week": "Semana", "receipts": "Entradas", "payments": "Salidas", "balance": "Saldo previsto", "state_vert": "Reserva", "state_jaune": "Vigilancia", "state_orange": "Tensión", "state_rouge": "Déficit", "state_info": "No evaluado", "cashOnly": "Derecha: efectivo estimado al cierre semanal, tras cobros y pagos previstos. El color evalúa la reserva de tesorería, no la rentabilidad.", "reserveBasis": "Una semana de reserva = {v} de salidas semanales medias en estas 13 semanas.", "reserveGuide": "Referencia interna Verdict: verde ≥ 4 semanas; amarillo de 2 a menos de 4; naranja de 0 a menos de 2; rojo: saldo negativo. Impuesto sobre beneficios excluido."}, "it": {"kicker": "Cassa a 13 settimane", "bas": "Punto minimo previsto: {v} nella settimana dal {a} al {b} (fra {n} settimana/e).", "neg": "La sua cassa scenderebbe sotto zero nella settimana dal {a} al {b}: {v}.", "causes": "Quella settimana: {l}.", "sansSolde": "Indichi la cassa disponibile in «I miei numeri» per vedere le 13 settimane.", "col": "Settimana · incassi · uscite · saldo finale", "sem": "S{i} · {a} → {b}", "hyp": "Incassi previsti = stesso giorno dell’anno scorso × la sua evoluzione (altrimenti gli ultimi 8 stessi giorni; 0 = chiuso). Fornitori pagati a {d} giorni, IVA detraibile stimata al {t} dell’imponibile di acquisti e costi, contributi {r}, pagamenti con carta contati lo stesso giorno. Imposta sul reddito non inclusa. Stipendi netti stimati al 78 % del lordo; contributi = costo totale − netti.", "mensuel": "mensili", "trimestriel": "trimestrali", "reglagesK": "Ipotesi modificabili", "delai": "Termine di pagamento fornitori (giorni)", "jSal": "Giorno di paga (0 = ultimo giorno del mese)", "jUr": "Giorno di pagamento dei contributi", "rythme": "Ritmo dei contributi (mensile / trimestrale)", "jTva": "Giorno di pagamento IVA", "txDed": "IVA detraibile stimata (% dell’imponibile)", "jLoy": "Giorno dell’affitto", "jEmp": "Giorno della rata del prestito", "jPre": "Giorno dei prelievi", "dateSolde": "Data del saldo indicato", "k_encaissements": "incassi", "k_fournisseurs": "fornitori", "k_salaires": "stipendi netti", "k_cotisations": "contributi", "k_loyer": "affitto e costi fissi", "k_tva": "IVA", "k_emprunt": "prestito", "k_prelevements": "prelievi", "k_investissements": "investimenti", "k_commissions": "commissioni", "regle": "Una stima, non una certezza: una settimana fiacca o un cliente in ritardo sposta il punto minimo. Il titolare decide.", "week": "Settimana", "receipts": "Entrate", "payments": "Uscite", "balance": "Saldo previsto", "state_vert": "Riserva", "state_jaune": "Attenzione", "state_orange": "Tensione", "state_rouge": "Deficit", "state_info": "Non valutato", "cashOnly": "A destra: liquidità stimata a fine settimana dopo entrate e uscite previste. Il colore valuta la riserva di cassa, non la redditività.", "reserveBasis": "Una settimana di riserva = {v} di uscite settimanali medie in queste 13 settimane.", "reserveGuide": "Riferimento interno Verdict: verde ≥ 4 settimane; giallo da 2 a meno di 4; arancione da 0 a meno di 2; rosso: saldo negativo. Imposte sul reddito escluse."}, "de": {"kicker": "Liquidität auf 13 Wochen", "bas": "Erwarteter Tiefpunkt: {v} in der Woche vom {a} bis {b} (in {n} Woche(n)).", "neg": "Ihre Liquidität würde in der Woche vom {a} bis {b} unter null fallen: {v}.", "causes": "In dieser Woche: {l}.", "sansSolde": "Tragen Sie Ihre verfügbare Liquidität unter „Meine Zahlen“ ein, um die 13 Wochen zu sehen.", "col": "Woche · Einnahmen · Ausgaben · Endsaldo", "sem": "W{i} · {a} → {b}", "hyp": "Erwartete Einnahmen = gleicher Tag im Vorjahr × Ihre Entwicklung (sonst Ihre letzten 8 gleichen Wochentage; 0 = geschlossen). Lieferanten nach {d} Tagen bezahlt, Vorsteuer geschätzt mit {t} des Nettos von Einkäufen und Kosten, Sozialabgaben {r}, Kartenzahlungen am selben Tag gezählt. Ertragsteuer nicht enthalten. Nettolöhne mit 78 % des Bruttos geschätzt; Abgaben = Gesamtkosten − netto.", "mensuel": "monatlich", "trimestriel": "vierteljährlich", "reglagesK": "Anpassbare Annahmen", "delai": "Zahlungsziel Lieferanten (Tage)", "jSal": "Lohnzahltag (0 = letzter Tag des Monats)", "jUr": "Zahltag Sozialabgaben", "rythme": "Rhythmus der Abgaben (monatlich / vierteljährlich)", "jTva": "Zahltag MwSt.", "txDed": "Geschätzte Vorsteuer (% des Nettos)", "jLoy": "Mietzahltag", "jEmp": "Tag der Darlehensrate", "jPre": "Tag der Entnahmen", "dateSolde": "Datum des erfassten Saldos", "k_encaissements": "Einnahmen", "k_fournisseurs": "Lieferanten", "k_salaires": "Nettolöhne", "k_cotisations": "Sozialabgaben", "k_loyer": "Miete und Fixkosten", "k_tva": "MwSt.", "k_emprunt": "Darlehen", "k_prelevements": "Entnahmen", "k_investissements": "Investitionen", "k_commissions": "Provisionen", "regle": "Eine Schätzung, keine Gewissheit: eine schwache Woche oder ein säumiger Kunde verschiebt den Tiefpunkt. Der Inhaber entscheidet.", "week": "Woche", "receipts": "Eingänge", "payments": "Ausgänge", "balance": "Plansaldo", "state_vert": "Reserve", "state_jaune": "Beachten", "state_orange": "Engpass", "state_rouge": "Defizit", "state_info": "Nicht bewertet", "cashOnly": "Rechts: geschätzte Liquidität am Wochenende nach geplanten Ein- und Auszahlungen. Die Farbe bewertet die Liquiditätsreserve, nicht die Rentabilität.", "reserveBasis": "Eine Reservewoche = {v} durchschnittliche wöchentliche Auszahlungen über diese 13 Wochen.", "reserveGuide": "Interner Verdict-Richtwert: grün ≥ 4 Wochen; gelb 2 bis unter 4; orange 0 bis unter 2; rot: negativer Saldo. Ertragsteuer ausgeschlossen."}, "nl": {"kicker": "Kaspositie op 13 weken", "bas": "Verwacht dieptepunt: {v} in de week van {a} tot {b} (over {n} week/weken).", "neg": "Uw kas zou onder nul gaan in de week van {a} tot {b}: {v}.", "causes": "Die week: {l}.", "sansSolde": "Vul uw beschikbare kas in bij „Mijn cijfers” om de 13 weken te zien.", "col": "Week · ontvangsten · uitgaven · eindsaldo", "sem": "W{i} · {a} → {b}", "hyp": "Verwachte ontvangsten = dezelfde dag vorig jaar × uw evolutie (anders uw laatste 8 dezelfde weekdagen; 0 = gesloten). Leveranciers betaald op {d} dagen, aftrekbare btw geschat op {t} van aankopen en kosten excl. btw, bijdragen {r}, kaartbetalingen dezelfde dag geteld. Winstbelasting niet inbegrepen. Nettolonen geschat op 78 % van bruto; bijdragen = totale kost − netto.", "mensuel": "maandelijks", "trimestriel": "per kwartaal", "reglagesK": "Aanpasbare aannames", "delai": "Betaaltermijn leveranciers (dagen)", "jSal": "Loondag (0 = laatste dag van de maand)", "jUr": "Betaaldag sociale bijdragen", "rythme": "Ritme bijdragen (maandelijks / per kwartaal)", "jTva": "Betaaldag btw", "txDed": "Geschatte aftrekbare btw (% excl. btw)", "jLoy": "Huurdag", "jEmp": "Dag van de leningaflossing", "jPre": "Dag van de opnames", "dateSolde": "Datum van het ingevulde saldo", "k_encaissements": "ontvangsten", "k_fournisseurs": "leveranciers", "k_salaires": "nettolonen", "k_cotisations": "sociale bijdragen", "k_loyer": "huur en vaste kosten", "k_tva": "btw", "k_emprunt": "lening", "k_prelevements": "opnames", "k_investissements": "investeringen", "k_commissions": "commissies", "regle": "Een schatting, geen zekerheid: een rustige week of een late betaler verschuift het dieptepunt. De eigenaar beslist.", "week": "Week", "receipts": "In", "payments": "Uit", "balance": "Verwacht saldo", "state_vert": "Reserve", "state_jaune": "Opletten", "state_orange": "Krap", "state_rouge": "Tekort", "state_info": "Niet beoordeeld", "cashOnly": "Rechts: verwachte kas aan het einde van de week na geplande ontvangsten en betalingen. De kleur beoordeelt de kasreserve, niet de winstgevendheid.", "reserveBasis": "Eén reserveweek = {v} gemiddelde wekelijkse uitgaven over deze 13 weken.", "reserveGuide": "Interne Verdict-richtlijn: groen ≥ 4 weken; geel 2 tot minder dan 4; oranje 0 tot minder dan 2; rood: negatief saldo. Winstbelasting uitgesloten."}, "pt": {"kicker": "Tesouraria a 13 semanas", "bas": "Ponto baixo previsto: {v} na semana de {a} a {b} (daqui a {n} semana(s)).", "neg": "A sua tesouraria passaria abaixo de zero na semana de {a} a {b}: {v}.", "causes": "Nessa semana: {l}.", "sansSolde": "Indique a sua tesouraria disponível em «Os meus números» para ver as 13 semanas.", "col": "Semana · recebimentos · pagamentos · saldo final", "sem": "S{i} · {a} → {b}", "hyp": "Recebimentos previstos = mesmo dia do ano passado × a sua evolução (senão os seus últimos 8 mesmos dias; 0 = fechado). Fornecedores pagos a {d} dias, IVA dedutível estimado em {t} da base de compras e encargos, contribuições {r}, pagamentos com cartão contados no próprio dia. Imposto sobre lucros não incluído. Salários líquidos estimados em 78 % do bruto; contribuições = custo total − líquidos.", "mensuel": "mensais", "trimestriel": "trimestrais", "reglagesK": "Hipóteses modificáveis", "delai": "Prazo de pagamento aos fornecedores (dias)", "jSal": "Dia de pagamento dos salários (0 = último dia do mês)", "jUr": "Dia de pagamento das contribuições", "rythme": "Ritmo das contribuições (mensal / trimestral)", "jTva": "Dia de pagamento do IVA", "txDed": "IVA dedutível estimado (% da base)", "jLoy": "Dia da renda", "jEmp": "Dia da prestação do empréstimo", "jPre": "Dia dos levantamentos", "dateSolde": "Data do saldo indicado", "k_encaissements": "recebimentos", "k_fournisseurs": "fornecedores", "k_salaires": "salários líquidos", "k_cotisations": "contribuições", "k_loyer": "renda e custos fixos", "k_tva": "IVA", "k_emprunt": "empréstimo", "k_prelevements": "levantamentos", "k_investissements": "investimentos", "k_commissions": "comissões", "regle": "Uma estimativa, não uma certeza: uma semana fraca ou um cliente atrasado desloca o ponto baixo. O patrão decide.", "week": "Semana", "receipts": "Entradas", "payments": "Saídas", "balance": "Saldo previsto", "state_vert": "Reserva", "state_jaune": "Atenção", "state_orange": "Tensão", "state_rouge": "Défice", "state_info": "Não avaliado", "cashOnly": "À direita: dinheiro estimado no fim da semana, após entradas e saídas previstas. A cor avalia a reserva de tesouraria, não a rentabilidade.", "reserveBasis": "Uma semana de reserva = {v} de saídas semanais médias nestas 13 semanas.", "reserveGuide": "Referência interna Verdict: verde ≥ 4 semanas; amarelo de 2 a menos de 4; laranja de 0 a menos de 2; vermelho: saldo negativo. Imposto sobre lucros excluído."}};
  var VF_EXTRA={"fr": ["Plan incomplet : certaines journées ou sorties restent à renseigner. Les montants ci-dessous couvrent seulement les données connues ; le point bas réel reste inconnu.", "Vérifiez les dates, montants et hypothèses de la trésorerie."], "en": ["Incomplete plan: some days or payments are missing. The amounts below cover known data only; the actual low point remains unknown.", "Check cash dates, amounts and assumptions."], "es": ["Plan incompleto: faltan días o pagos. Los importes siguientes solo cubren datos conocidos; el mínimo real sigue siendo desconocido.", "Comprueba las fechas, los importes y las hipótesis de tesorería."], "it": ["Piano incompleto: mancano giorni o pagamenti. Gli importi seguenti coprono solo i dati noti; il minimo reale resta sconosciuto.", "Verifica date, importi e ipotesi di cassa."], "de": ["Unvollständiger Plan: Tage oder Zahlungen fehlen. Die Beträge umfassen nur bekannte Daten; der tatsächliche Tiefpunkt ist unbekannt.", "Prüfe Termine, Beträge und Annahmen zur Liquidität."], "nl": ["Onvolledig plan: dagen of betalingen ontbreken. De bedragen omvatten alleen bekende gegevens; het echte dieptepunt blijft onbekend.", "Controleer data, bedragen en kasstroomaannames."], "pt": ["Plano incompleto: faltam dias ou pagamentos. Os montantes cobrem apenas dados conhecidos; o mínimo real permanece desconhecido.", "Verifica datas, montantes e hipóteses de tesouraria."]};Object.keys(VF_EXTRA).forEach(function(l){VF_COPY[l].partial=VF_EXTRA[l][0];VF_COPY[l].invalid=VF_EXTRA[l][1];});
  var VF_TVA={"fr": {"tvaK": "TVA : vos échéances dans ces 13 semaines", "tvaAucune": "Aucune échéance de TVA dans ces 13 semaines.", "n_ca3-mensuelle": "TVA de {p} (CA3 mensuelle)", "n_ca3-trimestrielle": "TVA du trimestre {p} (CA3 trimestrielle)", "n_acompte-simplifie": "Acompte du régime simplifié ({p}), estimé sur le semestre (au moins 80 % de la TVA due du semestre selon la DGFiP)", "n_solde-ca12": "Solde de la déclaration annuelle CA12 2026 (au plus tard le 4 mai 2027)", "n_solde-ca12e": "Solde de la déclaration annuelle CA12E 2026/2027 (dans les 3 mois de la clôture)", "n_acompte-2027-07": "Acompte de juillet 2027 (exercice clos de juillet à novembre 2027, dû si la TVA de l’exercice précédent dépasse 1 000 €)", "n_transition": "Première CA3 après la clôture : mois entre la clôture et le trimestre suivant", "n_regime-inconnu": "TVA : régime à préciser", "n_cloture-inconnue": "TVA : date de clôture à préciser", "n_periodicite-inconnue": "TVA : rythme des déclarations 2027 à préciser", "inconnu": "montant non compté", "estime": "estimation", "indique": "montant indiqué", "st_simplifie": "Votre TVA : régime simplifié jusqu’au 31/12/2026, puis réel normal, déclarations CA3 {per} dès {first}.", "st_simplifieSansClo": "Votre TVA : régime simplifié jusqu’au 31/12/2026, puis réel normal, déclarations CA3 {per}.", "st_normal": "Votre TVA : réel normal, déclarations CA3 {per}.", "st_inconnu": "Votre TVA : régime non renseigné. Jusqu’au 31/12/2026, Verdict compte la TVA du mois écoulé chaque mois ; à partir de 2027, rien n’est supposé.", "per_mensuelle": "mensuelles", "per_trimestrielle": "trimestrielles", "per_inconnue": "au rythme à préciser", "clo": "Clôture de l’exercice : {d}.", "cloInconnue": "Clôture de l’exercice : à préciser.", "lu": "Lu : {l}.", "s_fec-44581": "régime lu dans votre FEC (compte 44581, acomptes du régime simplifié)", "s_fec-44551-mensuel": "régime et rythme lus dans votre FEC (TVA à décaisser passée chaque mois)", "s_fec-44551-trimestriel": "régime et rythme lus dans votre FEC (TVA à décaisser passée chaque trimestre)", "s_fec-44551-annuel": "régime lu dans votre FEC (TVA à décaisser passée une fois sur l’exercice)", "s_fec-ca": "rythme 2027 proposé d’après le chiffre d’affaires lu dans votre FEC : {v} (seuil DGFiP : 1 M€ ; acquisitions taxables non lues)", "s_fec-nom": "clôture lue dans le nom du fichier FEC ({d})", "s_fec-fin": "clôture lue à la dernière écriture du FEC ({d})", "s_patron": "votre réponse", "s_demo": "données de démonstration", "regle2027": "À partir du 1er janvier 2027, aucun acompte de l’ancien régime simplifié n’est reconduit : seules les déclarations du nouveau rythme sont comptées.", "avert": "À FAIRE CONFIRMER PAR VOTRE EXPERT-COMPTABLE : le calendrier exact dépend de votre dossier.", "source": "Source : DGFiP, impots.gouv.fr — « Le régime simplifié d’imposition à la TVA est supprimé à compter du 1er janvier 2027 », actualité du 22/09/2026 (modifiée le 23/09/2026) ; FAQ des acomptes du régime simplifié modifiée le 14/10/2026.", "qK": "Une seule question pour caler la TVA à partir de janvier 2027", "qSous": "Vos documents ne donnent pas tout : répondez seulement à ce qui manque (votre expert-comptable ou votre dernière déclaration de TVA le dit).", "qRegime": "Votre régime de TVA en 2026", "o_simplifie": "Régime simplifié (CA12 et acomptes)", "o_normal": "Réel normal (CA3)", "qPer": "Rythme de vos déclarations CA3", "o_mensuelle": "Mensuelles", "o_trimestrielle": "Trimestrielles", "qPerAide": "Trimestrielles si le chiffre d’affaires, acquisitions taxables comprises, ne dépasse pas 1 M€ l’année précédente et 1,1 M€ l’année en cours ; sinon mensuelles (DGFiP, 22/09/2026).", "qClo": "Date de clôture de l’exercice", "qMontant": "{n} : montant indiqué par votre expert-comptable (€)", "qOk": "Enregistrer", "choisir": "— choisir —", "corriger": "Corriger le régime de TVA"}, "en": {"tvaK": "VAT: your due dates in these 13 weeks", "tvaAucune": "No VAT due date in these 13 weeks.", "n_ca3-mensuelle": "VAT for {p} (monthly CA3)", "n_ca3-trimestrielle": "VAT for the quarter {p} (quarterly CA3)", "n_acompte-simplifie": "Simplified-regime instalment ({p}), estimated on the half-year (at least 80 % of the half-year VAT due, per the DGFiP)", "n_solde-ca12": "Balance of the 2026 CA12 annual return (no later than 4 May 2027)", "n_solde-ca12e": "Balance of the 2026/2027 CA12E annual return (within 3 months of year-end)", "n_acompte-2027-07": "July 2027 instalment (year ending July to November 2027, due if the previous year’s VAT exceeds €1,000)", "n_transition": "First CA3 after year-end: months between year-end and the next quarter", "n_regime-inconnu": "VAT: regime to be specified", "n_cloture-inconnue": "VAT: year-end date to be specified", "n_periodicite-inconnue": "VAT: 2027 filing rhythm to be specified", "inconnu": "amount not counted", "estime": "estimate", "indique": "amount provided", "st_simplifie": "Your VAT: simplified regime until 31/12/2026, then standard regime, {per} CA3 returns from {first}.", "st_simplifieSansClo": "Your VAT: simplified regime until 31/12/2026, then standard regime, {per} CA3 returns.", "st_normal": "Your VAT: standard regime, {per} CA3 returns.", "st_inconnu": "Your VAT: regime not provided. Until 31/12/2026, Verdict counts the previous month’s VAT every month; from 2027, nothing is assumed.", "per_mensuelle": "monthly", "per_trimestrielle": "quarterly", "per_inconnue": "with a rhythm to be specified", "clo": "Financial year-end: {d}.", "cloInconnue": "Financial year-end: to be specified.", "lu": "Read: {l}.", "s_fec-44581": "regime read in your FEC (account 44581, simplified-regime instalments)", "s_fec-44551-mensuel": "regime and rhythm read in your FEC (VAT payable booked every month)", "s_fec-44551-trimestriel": "regime and rhythm read in your FEC (VAT payable booked every quarter)", "s_fec-44551-annuel": "regime read in your FEC (VAT payable booked once in the year)", "s_fec-ca": "2027 rhythm suggested from the revenue read in your FEC: {v} (DGFiP threshold: €1M; taxable acquisitions not read)", "s_fec-nom": "year-end read in the FEC file name ({d})", "s_fec-fin": "year-end read at the last FEC entry ({d})", "s_patron": "your answer", "s_demo": "demo data", "regle2027": "From 1 January 2027, no instalment of the former simplified regime is carried over: only returns of the new rhythm are counted.", "avert": "TO BE CONFIRMED BY YOUR ACCOUNTANT: the exact calendar depends on your file.", "source": "Source: DGFiP, impots.gouv.fr — news “The simplified VAT regime is abolished from 1 January 2027” of 22/09/2026 (updated 23/09/2026); simplified-regime instalments FAQ updated 14/10/2026.", "qK": "One question to set VAT from January 2027", "qSous": "Your documents do not give everything: answer only what is missing (your accountant or your last VAT return says it).", "qRegime": "Your VAT regime in 2026", "o_simplifie": "Simplified regime (CA12 and instalments)", "o_normal": "Standard regime (CA3)", "qPer": "Rhythm of your CA3 returns", "o_mensuelle": "Monthly", "o_trimestrielle": "Quarterly", "qPerAide": "Quarterly if revenue, taxable acquisitions included, does not exceed €1M in the previous year and €1.1M in the current year; otherwise monthly (DGFiP, 22/09/2026).", "qClo": "Financial year-end date", "qMontant": "{n}: amount given by your accountant (€)", "qOk": "Save", "choisir": "— choose —", "corriger": "Correct the VAT regime"}, "es": {"tvaK": "IVA: sus vencimientos en estas 13 semanas", "tvaAucune": "Ningún vencimiento de IVA en estas 13 semanas.", "n_ca3-mensuelle": "IVA de {p} (CA3 mensual)", "n_ca3-trimestrielle": "IVA del trimestre {p} (CA3 trimestral)", "n_acompte-simplifie": "Pago a cuenta del régimen simplificado ({p}), estimado sobre el semestre (al menos el 80 % del IVA del semestre según la DGFiP)", "n_solde-ca12": "Saldo de la declaración anual CA12 2026 (a más tardar el 4 de mayo de 2027)", "n_solde-ca12e": "Saldo de la declaración anual CA12E 2026/2027 (en los 3 meses siguientes al cierre)", "n_acompte-2027-07": "Pago a cuenta de julio de 2027 (ejercicio cerrado de julio a noviembre de 2027, debido si el IVA del ejercicio anterior supera 1 000 €)", "n_transition": "Primera CA3 tras el cierre: meses entre el cierre y el trimestre siguiente", "n_regime-inconnu": "IVA: régimen por precisar", "n_cloture-inconnue": "IVA: fecha de cierre por precisar", "n_periodicite-inconnue": "IVA: ritmo de declaraciones 2027 por precisar", "inconnu": "importe no contado", "estime": "estimación", "indique": "importe indicado", "st_simplifie": "Su IVA: régimen simplificado hasta el 31/12/2026, luego régimen real normal, declaraciones CA3 {per} desde {first}.", "st_simplifieSansClo": "Su IVA: régimen simplificado hasta el 31/12/2026, luego régimen real normal, declaraciones CA3 {per}.", "st_normal": "Su IVA: régimen real normal, declaraciones CA3 {per}.", "st_inconnu": "Su IVA: régimen no indicado. Hasta el 31/12/2026, Verdict cuenta cada mes el IVA del mes anterior; desde 2027 no se supone nada.", "per_mensuelle": "mensuales", "per_trimestrielle": "trimestrales", "per_inconnue": "con ritmo por precisar", "clo": "Cierre del ejercicio: {d}.", "cloInconnue": "Cierre del ejercicio: por precisar.", "lu": "Leído: {l}.", "s_fec-44581": "régimen leído en su FEC (cuenta 44581, pagos a cuenta del régimen simplificado)", "s_fec-44551-mensuel": "régimen y ritmo leídos en su FEC (IVA a ingresar contabilizado cada mes)", "s_fec-44551-trimestriel": "régimen y ritmo leídos en su FEC (IVA a ingresar contabilizado cada trimestre)", "s_fec-44551-annuel": "régimen leído en su FEC (IVA a ingresar contabilizado una vez en el ejercicio)", "s_fec-ca": "ritmo 2027 propuesto según la cifra de negocios leída en su FEC: {v} (umbral DGFiP: 1 M€; adquisiciones gravadas no leídas)", "s_fec-nom": "cierre leído en el nombre del archivo FEC ({d})", "s_fec-fin": "cierre leído en el último asiento del FEC ({d})", "s_patron": "su respuesta", "s_demo": "datos de demostración", "regle2027": "Desde el 1 de enero de 2027 no se prorroga ningún pago a cuenta del antiguo régimen simplificado: solo se cuentan las declaraciones del nuevo ritmo.", "avert": "A CONFIRMAR POR SU ASESOR CONTABLE: el calendario exacto depende de su expediente.", "source": "Fuente: DGFiP, impots.gouv.fr — noticia «Le régime simplifié d’imposition à la TVA est supprimé à compter du 1er janvier 2027» del 22/09/2026 (modificada el 23/09/2026); FAQ de pagos a cuenta modificada el 14/10/2026.", "qK": "Una sola pregunta para ajustar el IVA desde enero de 2027", "qSous": "Sus documentos no lo dan todo: responda solo lo que falta (su asesor o su última declaración de IVA lo indica).", "qRegime": "Su régimen de IVA en 2026", "o_simplifie": "Régimen simplificado (CA12 y pagos a cuenta)", "o_normal": "Régimen real normal (CA3)", "qPer": "Ritmo de sus declaraciones CA3", "o_mensuelle": "Mensuales", "o_trimestrielle": "Trimestrales", "qPerAide": "Trimestrales si la cifra de negocios, adquisiciones gravadas incluidas, no supera 1 M€ el año anterior y 1,1 M€ el año en curso; si no, mensuales (DGFiP, 22/09/2026).", "qClo": "Fecha de cierre del ejercicio", "qMontant": "{n}: importe indicado por su asesor (€)", "qOk": "Guardar", "choisir": "— elegir —", "corriger": "Corregir el régimen de IVA"}, "it": {"tvaK": "IVA: le scadenze in queste 13 settimane", "tvaAucune": "Nessuna scadenza IVA in queste 13 settimane.", "n_ca3-mensuelle": "IVA di {p} (CA3 mensile)", "n_ca3-trimestrielle": "IVA del trimestre {p} (CA3 trimestrale)", "n_acompte-simplifie": "Acconto del regime semplificato ({p}), stimato sul semestre (almeno l’80 % dell’IVA dovuta del semestre secondo la DGFiP)", "n_solde-ca12": "Saldo della dichiarazione annuale CA12 2026 (entro il 4 maggio 2027)", "n_solde-ca12e": "Saldo della dichiarazione annuale CA12E 2026/2027 (entro 3 mesi dalla chiusura)", "n_acompte-2027-07": "Acconto di luglio 2027 (esercizio chiuso da luglio a novembre 2027, dovuto se l’IVA dell’esercizio precedente supera 1 000 €)", "n_transition": "Prima CA3 dopo la chiusura: mesi tra la chiusura e il trimestre successivo", "n_regime-inconnu": "IVA: regime da precisare", "n_cloture-inconnue": "IVA: data di chiusura da precisare", "n_periodicite-inconnue": "IVA: ritmo delle dichiarazioni 2027 da precisare", "inconnu": "importo non conteggiato", "estime": "stima", "indique": "importo indicato", "st_simplifie": "La sua IVA: regime semplificato fino al 31/12/2026, poi regime ordinario, dichiarazioni CA3 {per} da {first}.", "st_simplifieSansClo": "La sua IVA: regime semplificato fino al 31/12/2026, poi regime ordinario, dichiarazioni CA3 {per}.", "st_normal": "La sua IVA: regime ordinario, dichiarazioni CA3 {per}.", "st_inconnu": "La sua IVA: regime non indicato. Fino al 31/12/2026 Verdict conta ogni mese l’IVA del mese precedente; dal 2027 non si presume nulla.", "per_mensuelle": "mensili", "per_trimestrielle": "trimestrali", "per_inconnue": "con ritmo da precisare", "clo": "Chiusura dell’esercizio: {d}.", "cloInconnue": "Chiusura dell’esercizio: da precisare.", "lu": "Letto: {l}.", "s_fec-44581": "regime letto nel suo FEC (conto 44581, acconti del regime semplificato)", "s_fec-44551-mensuel": "regime e ritmo letti nel suo FEC (IVA da versare registrata ogni mese)", "s_fec-44551-trimestriel": "regime e ritmo letti nel suo FEC (IVA da versare registrata ogni trimestre)", "s_fec-44551-annuel": "regime letto nel suo FEC (IVA da versare registrata una volta nell’esercizio)", "s_fec-ca": "ritmo 2027 proposto in base al fatturato letto nel suo FEC: {v} (soglia DGFiP: 1 M€; acquisti imponibili non letti)", "s_fec-nom": "chiusura letta nel nome del file FEC ({d})", "s_fec-fin": "chiusura letta all’ultima scrittura del FEC ({d})", "s_patron": "la sua risposta", "s_demo": "dati dimostrativi", "regle2027": "Dal 1° gennaio 2027 nessun acconto del vecchio regime semplificato viene riportato: si contano solo le dichiarazioni del nuovo ritmo.", "avert": "DA FAR CONFERMARE AL SUO COMMERCIALISTA: il calendario esatto dipende dalla sua pratica.", "source": "Fonte: DGFiP, impots.gouv.fr — notizia «Le régime simplifié d’imposition à la TVA est supprimé à compter du 1er janvier 2027» del 22/09/2026 (modificata il 23/09/2026); FAQ sugli acconti modificata il 14/10/2026.", "qK": "Una sola domanda per impostare l’IVA da gennaio 2027", "qSous": "I suoi documenti non dicono tutto: risponda solo a ciò che manca (lo indica il commercialista o l’ultima dichiarazione IVA).", "qRegime": "Il suo regime IVA nel 2026", "o_simplifie": "Regime semplificato (CA12 e acconti)", "o_normal": "Regime ordinario (CA3)", "qPer": "Ritmo delle dichiarazioni CA3", "o_mensuelle": "Mensili", "o_trimestrielle": "Trimestrali", "qPerAide": "Trimestrali se il fatturato, acquisti imponibili compresi, non supera 1 M€ l’anno precedente e 1,1 M€ l’anno in corso; altrimenti mensili (DGFiP, 22/09/2026).", "qClo": "Data di chiusura dell’esercizio", "qMontant": "{n}: importo indicato dal commercialista (€)", "qOk": "Salva", "choisir": "— scegliere —", "corriger": "Correggere il regime IVA"}, "de": {"tvaK": "MwSt.: Ihre Fälligkeiten in diesen 13 Wochen", "tvaAucune": "Keine MwSt.-Fälligkeit in diesen 13 Wochen.", "n_ca3-mensuelle": "MwSt. für {p} (monatliche CA3)", "n_ca3-trimestrielle": "MwSt. für das Quartal {p} (vierteljährliche CA3)", "n_acompte-simplifie": "Vorauszahlung der vereinfachten Regelung ({p}), auf das Halbjahr geschätzt (mindestens 80 % der MwSt. des Halbjahres laut DGFiP)", "n_solde-ca12": "Restbetrag der Jahreserklärung CA12 2026 (spätestens am 4. Mai 2027)", "n_solde-ca12e": "Restbetrag der Jahreserklärung CA12E 2026/2027 (innerhalb von 3 Monaten nach dem Abschluss)", "n_acompte-2027-07": "Vorauszahlung Juli 2027 (Geschäftsjahr endet Juli bis November 2027; fällig, wenn die MwSt. des Vorjahres 1 000 € übersteigt)", "n_transition": "Erste CA3 nach dem Abschluss: Monate zwischen Abschluss und nächstem Quartal", "n_regime-inconnu": "MwSt.: Regelung angeben", "n_cloture-inconnue": "MwSt.: Abschlussdatum angeben", "n_periodicite-inconnue": "MwSt.: Rhythmus der Erklärungen 2027 angeben", "inconnu": "Betrag nicht gezählt", "estime": "Schätzung", "indique": "angegebener Betrag", "st_simplifie": "Ihre MwSt.: vereinfachte Regelung bis 31.12.2026, danach Regelbesteuerung, {per} CA3-Erklärungen ab {first}.", "st_simplifieSansClo": "Ihre MwSt.: vereinfachte Regelung bis 31.12.2026, danach Regelbesteuerung, {per} CA3-Erklärungen.", "st_normal": "Ihre MwSt.: Regelbesteuerung, {per} CA3-Erklärungen.", "st_inconnu": "Ihre MwSt.: Regelung nicht angegeben. Bis 31.12.2026 zählt Verdict jeden Monat die MwSt. des Vormonats; ab 2027 wird nichts angenommen.", "per_mensuelle": "monatliche", "per_trimestrielle": "vierteljährliche", "per_inconnue": "noch festzulegende", "clo": "Abschluss des Geschäftsjahres: {d}.", "cloInconnue": "Abschluss des Geschäftsjahres: angeben.", "lu": "Gelesen: {l}.", "s_fec-44581": "Regelung aus Ihrem FEC gelesen (Konto 44581, Vorauszahlungen der vereinfachten Regelung)", "s_fec-44551-mensuel": "Regelung und Rhythmus aus Ihrem FEC gelesen (Zahllast jeden Monat gebucht)", "s_fec-44551-trimestriel": "Regelung und Rhythmus aus Ihrem FEC gelesen (Zahllast jedes Quartal gebucht)", "s_fec-44551-annuel": "Regelung aus Ihrem FEC gelesen (Zahllast einmal im Geschäftsjahr gebucht)", "s_fec-ca": "Rhythmus 2027 vorgeschlagen nach dem Umsatz aus Ihrem FEC: {v} (DGFiP-Schwelle: 1 Mio. €; steuerpflichtige Erwerbe nicht gelesen)", "s_fec-nom": "Abschluss aus dem FEC-Dateinamen gelesen ({d})", "s_fec-fin": "Abschluss aus der letzten FEC-Buchung gelesen ({d})", "s_patron": "Ihre Antwort", "s_demo": "Demodaten", "regle2027": "Ab 1. Januar 2027 wird keine Vorauszahlung der früheren vereinfachten Regelung übernommen: nur Erklärungen im neuen Rhythmus zählen.", "avert": "VON IHREM STEUERBERATER BESTÄTIGEN LASSEN: Der genaue Kalender hängt von Ihrer Akte ab.", "source": "Quelle: DGFiP, impots.gouv.fr — Meldung „Le régime simplifié d’imposition à la TVA est supprimé à compter du 1er janvier 2027“ vom 22.09.2026 (geändert am 23.09.2026); FAQ zu Vorauszahlungen geändert am 14.10.2026.", "qK": "Eine einzige Frage, um die MwSt. ab Januar 2027 festzulegen", "qSous": "Ihre Unterlagen sagen nicht alles: Beantworten Sie nur, was fehlt (Ihr Steuerberater oder Ihre letzte MwSt.-Erklärung weiß es).", "qRegime": "Ihre MwSt.-Regelung 2026", "o_simplifie": "Vereinfachte Regelung (CA12 und Vorauszahlungen)", "o_normal": "Regelbesteuerung (CA3)", "qPer": "Rhythmus Ihrer CA3-Erklärungen", "o_mensuelle": "Monatlich", "o_trimestrielle": "Vierteljährlich", "qPerAide": "Vierteljährlich, wenn der Umsatz einschließlich steuerpflichtiger Erwerbe 1 Mio. € im Vorjahr und 1,1 Mio. € im laufenden Jahr nicht übersteigt; sonst monatlich (DGFiP, 22.09.2026).", "qClo": "Abschlussdatum des Geschäftsjahres", "qMontant": "{n}: vom Steuerberater genannter Betrag (€)", "qOk": "Speichern", "choisir": "— wählen —", "corriger": "MwSt.-Regelung korrigieren"}, "nl": {"tvaK": "Btw: uw vervaldagen in deze 13 weken", "tvaAucune": "Geen btw-vervaldag in deze 13 weken.", "n_ca3-mensuelle": "Btw over {p} (maandelijkse CA3)", "n_ca3-trimestrielle": "Btw over het kwartaal {p} (driemaandelijkse CA3)", "n_acompte-simplifie": "Voorschot vereenvoudigde regeling ({p}), geschat op het halfjaar (minstens 80 % van de btw van het halfjaar volgens de DGFiP)", "n_solde-ca12": "Saldo van de jaarlijkse aangifte CA12 2026 (uiterlijk 4 mei 2027)", "n_solde-ca12e": "Saldo van de jaarlijkse aangifte CA12E 2026/2027 (binnen 3 maanden na de afsluiting)", "n_acompte-2027-07": "Voorschot juli 2027 (boekjaar afgesloten van juli tot november 2027, verschuldigd als de btw van het vorige boekjaar 1 000 € overschrijdt)", "n_transition": "Eerste CA3 na de afsluiting: maanden tussen afsluiting en volgend kwartaal", "n_regime-inconnu": "Btw: regeling te preciseren", "n_cloture-inconnue": "Btw: afsluitdatum te preciseren", "n_periodicite-inconnue": "Btw: ritme van de aangiften 2027 te preciseren", "inconnu": "bedrag niet meegeteld", "estime": "schatting", "indique": "opgegeven bedrag", "st_simplifie": "Uw btw: vereenvoudigde regeling tot 31/12/2026, daarna normale regeling, {per} CA3-aangiften vanaf {first}.", "st_simplifieSansClo": "Uw btw: vereenvoudigde regeling tot 31/12/2026, daarna normale regeling, {per} CA3-aangiften.", "st_normal": "Uw btw: normale regeling, {per} CA3-aangiften.", "st_inconnu": "Uw btw: regeling niet opgegeven. Tot 31/12/2026 telt Verdict elke maand de btw van de vorige maand; vanaf 2027 wordt niets aangenomen.", "per_mensuelle": "maandelijkse", "per_trimestrielle": "driemaandelijkse", "per_inconnue": "nog te bepalen", "clo": "Afsluiting van het boekjaar: {d}.", "cloInconnue": "Afsluiting van het boekjaar: te preciseren.", "lu": "Gelezen: {l}.", "s_fec-44581": "regeling gelezen in uw FEC (rekening 44581, voorschotten vereenvoudigde regeling)", "s_fec-44551-mensuel": "regeling en ritme gelezen in uw FEC (af te dragen btw elke maand geboekt)", "s_fec-44551-trimestriel": "regeling en ritme gelezen in uw FEC (af te dragen btw elk kwartaal geboekt)", "s_fec-44551-annuel": "regeling gelezen in uw FEC (af te dragen btw eenmaal per boekjaar geboekt)", "s_fec-ca": "ritme 2027 voorgesteld op basis van de omzet in uw FEC: {v} (DGFiP-drempel: 1 mln €; belaste verwervingen niet gelezen)", "s_fec-nom": "afsluiting gelezen in de FEC-bestandsnaam ({d})", "s_fec-fin": "afsluiting gelezen bij de laatste FEC-boeking ({d})", "s_patron": "uw antwoord", "s_demo": "demogegevens", "regle2027": "Vanaf 1 januari 2027 wordt geen voorschot van de oude vereenvoudigde regeling overgenomen: alleen aangiften in het nieuwe ritme tellen.", "avert": "LAAT UW ACCOUNTANT DIT BEVESTIGEN: de exacte kalender hangt af van uw dossier.", "source": "Bron: DGFiP, impots.gouv.fr — bericht „Le régime simplifié d’imposition à la TVA est supprimé à compter du 1er janvier 2027” van 22/09/2026 (gewijzigd op 23/09/2026); FAQ over voorschotten gewijzigd op 14/10/2026.", "qK": "Eén vraag om de btw vanaf januari 2027 goed te zetten", "qSous": "Uw documenten geven niet alles: beantwoord alleen wat ontbreekt (uw accountant of uw laatste btw-aangifte weet het).", "qRegime": "Uw btw-regeling in 2026", "o_simplifie": "Vereenvoudigde regeling (CA12 en voorschotten)", "o_normal": "Normale regeling (CA3)", "qPer": "Ritme van uw CA3-aangiften", "o_mensuelle": "Maandelijks", "o_trimestrielle": "Driemaandelijks", "qPerAide": "Driemaandelijks als de omzet, belaste verwervingen inbegrepen, niet hoger is dan 1 mln € het vorige jaar en 1,1 mln € het lopende jaar; anders maandelijks (DGFiP, 22/09/2026).", "qClo": "Afsluitdatum van het boekjaar", "qMontant": "{n}: bedrag opgegeven door uw accountant (€)", "qOk": "Opslaan", "choisir": "— kiezen —", "corriger": "Btw-regeling corrigeren"}, "pt": {"tvaK": "IVA: os seus prazos nestas 13 semanas", "tvaAucune": "Nenhum prazo de IVA nestas 13 semanas.", "n_ca3-mensuelle": "IVA de {p} (CA3 mensal)", "n_ca3-trimestrielle": "IVA do trimestre {p} (CA3 trimestral)", "n_acompte-simplifie": "Pagamento por conta do regime simplificado ({p}), estimado sobre o semestre (pelo menos 80 % do IVA devido do semestre segundo a DGFiP)", "n_solde-ca12": "Saldo da declaração anual CA12 2026 (até 4 de maio de 2027)", "n_solde-ca12e": "Saldo da declaração anual CA12E 2026/2027 (nos 3 meses após o fecho)", "n_acompte-2027-07": "Pagamento por conta de julho de 2027 (exercício encerrado de julho a novembro de 2027, devido se o IVA do exercício anterior exceder 1 000 €)", "n_transition": "Primeira CA3 após o fecho: meses entre o fecho e o trimestre seguinte", "n_regime-inconnu": "IVA: regime a precisar", "n_cloture-inconnue": "IVA: data de fecho a precisar", "n_periodicite-inconnue": "IVA: ritmo das declarações 2027 a precisar", "inconnu": "montante não contado", "estime": "estimativa", "indique": "montante indicado", "st_simplifie": "O seu IVA: regime simplificado até 31/12/2026, depois regime normal, declarações CA3 {per} a partir de {first}.", "st_simplifieSansClo": "O seu IVA: regime simplificado até 31/12/2026, depois regime normal, declarações CA3 {per}.", "st_normal": "O seu IVA: regime normal, declarações CA3 {per}.", "st_inconnu": "O seu IVA: regime não indicado. Até 31/12/2026, o Verdict conta todos os meses o IVA do mês anterior; a partir de 2027 nada é suposto.", "per_mensuelle": "mensais", "per_trimestrielle": "trimestrais", "per_inconnue": "com ritmo a precisar", "clo": "Fecho do exercício: {d}.", "cloInconnue": "Fecho do exercício: a precisar.", "lu": "Lido: {l}.", "s_fec-44581": "regime lido no seu FEC (conta 44581, pagamentos por conta do regime simplificado)", "s_fec-44551-mensuel": "regime e ritmo lidos no seu FEC (IVA a pagar lançado todos os meses)", "s_fec-44551-trimestriel": "regime e ritmo lidos no seu FEC (IVA a pagar lançado todos os trimestres)", "s_fec-44551-annuel": "regime lido no seu FEC (IVA a pagar lançado uma vez no exercício)", "s_fec-ca": "ritmo 2027 proposto segundo o volume de negócios lido no seu FEC: {v} (limiar DGFiP: 1 M€; aquisições tributáveis não lidas)", "s_fec-nom": "fecho lido no nome do ficheiro FEC ({d})", "s_fec-fin": "fecho lido no último lançamento do FEC ({d})", "s_patron": "a sua resposta", "s_demo": "dados de demonstração", "regle2027": "A partir de 1 de janeiro de 2027, nenhum pagamento por conta do antigo regime simplificado é reconduzido: só contam as declarações do novo ritmo.", "avert": "A CONFIRMAR PELO SEU CONTABILISTA: o calendário exato depende do seu processo.", "source": "Fonte: DGFiP, impots.gouv.fr — notícia «Le régime simplifié d’imposition à la TVA est supprimé à compter du 1er janvier 2027» de 22/09/2026 (modificada a 23/09/2026); FAQ dos pagamentos por conta modificada a 14/10/2026.", "qK": "Uma só pergunta para acertar o IVA a partir de janeiro de 2027", "qSous": "Os seus documentos não dizem tudo: responda só ao que falta (o seu contabilista ou a sua última declaração de IVA indica-o).", "qRegime": "O seu regime de IVA em 2026", "o_simplifie": "Regime simplificado (CA12 e pagamentos por conta)", "o_normal": "Regime normal (CA3)", "qPer": "Ritmo das suas declarações CA3", "o_mensuelle": "Mensais", "o_trimestrielle": "Trimestrais", "qPerAide": "Trimestrais se o volume de negócios, aquisições tributáveis incluídas, não exceder 1 M€ no ano anterior e 1,1 M€ no ano em curso; caso contrário, mensais (DGFiP, 22/09/2026).", "qClo": "Data de fecho do exercício", "qMontant": "{n}: montante indicado pelo seu contabilista (€)", "qOk": "Guardar", "choisir": "— escolher —", "corriger": "Corrigir o regime de IVA"}};Object.keys(VF_TVA).forEach(function(l){if(VF_COPY[l])Object.keys(VF_TVA[l]).forEach(function(k){VF_COPY[l][k]=VF_TVA[l][k];});});
  /* TVA datée (alerte de veille tva-fin-regime-simplifie) : échéances du moteur, régime lu dans les documents, une seule question
     pour ce qui manque, À FAIRE CONFIRMER PAR VOTRE EXPERT-COMPTABLE, source DGFiP datée. */
  [['fr','au moins {v} · journées de caisse manquantes','à estimer : journées de caisse manquantes'],['en','at least {v} · daily takings missing','to be estimated: daily takings missing'],['es','al menos {v} · faltan jornadas de caja','por estimar: faltan jornadas de caja'],['it','almeno {v} · mancano giornate di cassa','da stimare: mancano giornate di cassa'],['de','mindestens {v} · Kassentage fehlen','noch zu schätzen: Kassentage fehlen'],['nl','minstens {v} · kassadagen ontbreken','nog te schatten: kassadagen ontbreken'],['pt','pelo menos {v} · faltam dias de caixa','a estimar: faltam dias de caixa']].forEach(function(x){if(VF_COPY[x[0]]){VF_COPY[x[0]].partiel=x[1];VF_COPY[x[0]].aEstimer=x[2];}});
  function vfMoisTxt(ym,opt){var p=String(ym||'').split('-');try{return new Intl.DateTimeFormat(vmTag(),opt||{month:'long',year:'numeric'}).format(new Date(+p[0],+p[1]-1,15,12));}catch(e){return p[1]+'/'+p[0];}}
  function vfDateTxt(iso){var p=String(iso||'').slice(0,10).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:String(iso||'');}
  function vfPeriodeTxt(e){var p=String(e.periode||'').split('/');if(p.length>1)return vfMoisTxt(p[0],{month:'short'})+'–'+vfMoisTxt(p[1],{month:'short',year:'numeric'});return p[0]?vfMoisTxt(p[0]):'';}
  function vfSourceTxt(C,s){s=String(s||'');var k=s.split(':')[0],v=s.slice(k.length+1);if(!C['s_'+k])return '';return vmF(C['s_'+k],{v:k==='fec-ca'?vmEur(Number(v)):'',d:vfDateTxt(v)});}
  function vfTvaBlock(C,R,P){
    var T=R.tva||{},cfg=P.tva&&typeof P.tva==='object'?P.tva:{},src=cfg.sources||{},ech=T.echeances||[],h='<div data-vf-tva-bloc="1" style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(148,163,184,.18)">';
    h+='<p class="kicker" style="margin:0 0 6px">'+vmE(C.tvaK)+'</p>';
    if(!ech.length)h+='<p class="sous" style="margin:0 0 6px;font-size:14px">'+vmE(C.tvaAucune)+'</p>';
    ech.forEach(function(e){var lib=vmF(C['n_'+e.nature]||e.nature,{p:vfPeriodeTxt(e)}),m=e.montant==null?C.inconnu:e.complet===false?(Math.abs(e.montant)>0?vmF(C.partiel,{v:vmEur(Math.abs(e.montant))}):C.aEstimer):vmEur(Math.abs(e.montant))+' · '+(e.source==='indique'?C.indique:C.estime);h+='<div data-vf-tva-e="'+vmE(e.nature)+'" style="display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,2fr) minmax(0,1fr);gap:6px;padding:5px 0;font-size:13.5px"><span>'+vmE(vfJourTxt(e.date))+'</span><span>'+vmE(lib)+'</span><b style="text-align:right'+(e.montant==null||e.complet===false?';color:#f97316':'')+'">'+vmE(m)+'</b></div>';});
    var per=T.periodicite?C['per_'+T.periodicite]:C.per_inconnue,first=T.clotureExercice?vfMoisTxt(addMonthIso(T.clotureExercice)):'';
    var st=T.regime==='simplifie'?vmF(first?C.st_simplifie:C.st_simplifieSansClo,{per:per,first:first}):T.regime==='normal'?vmF(C.st_normal,{per:T.periodicite?per:C.per_mensuelle}):C.st_inconnu;
    var lus=[src.regime,src.periodicite,src.cloture].filter(function(x,i,a){return x&&a.indexOf(x)===i;}).map(function(x){return vfSourceTxt(C,x);}).filter(Boolean);
    h+='<p class="sous" style="margin:6px 0 0;font-size:13.5px" data-vf-tva-statut="1">'+vmE(st)+' '+vmE(cfg.cloture?vmF(C.clo,{d:vfCloTxt(cfg.cloture)}):C.cloInconnue)+(lus.length?' '+vmE(vmF(C.lu,{l:lus.join(' ; ')})):'')+'</p>';
    h+='<p class="sous" style="margin:4px 0 0;font-size:13px">'+vmE(C.regle2027)+'</p>';
    var manque=[],inconnus=ech.filter(function(e){return e.montant==null&&/^(solde-ca12|solde-ca12e|acompte-2027-07|transition)$/.test(e.nature);});
    if(!cfg.regime){manque.push('regime');if(!cfg.periodicite)manque.push('periodicite');if(!cfg.cloture)manque.push('cloture');}if(cfg.regime==='simplifie'&&!cfg.periodicite)manque.push('periodicite');if(cfg.regime==='simplifie'&&!cfg.cloture)manque.push('cloture');
    var form=vfTvaForm(C,cfg,manque.length||inconnus.length?manque:['regime','periodicite','cloture'],inconnus);
    if(manque.length||inconnus.length)h+='<div data-vf-tva-question="1" style="margin-top:10px;padding:10px;border-radius:12px;background:rgba(249,115,22,.08)"><p class="sous" style="margin:0 0 4px;font-weight:600">'+vmE(C.qK)+'</p><p class="sous" style="margin:0 0 6px;font-size:13px">'+vmE(C.qSous)+'</p>'+form+'</div>';
    else h+='<details style="margin-top:6px"><summary class="sous" style="cursor:pointer;margin:0;font-size:13px;padding:12px 0;min-height:44px;box-sizing:border-box">'+vmE(C.corriger)+'</summary>'+form+'</details>';
    h+='<p class="sous" style="margin:8px 0 0;font-size:12.5px;font-weight:700">'+vmE(C.avert)+'</p><p class="sous" style="margin:2px 0 0;font-size:12px">'+vmE(C.source)+'</p>';
    return h+'</div>';
  }
  function addMonthIso(iso){var p=String(iso).split('-'),d=new Date(Date.UTC(+p[0],+p[1],1,12));return d.toISOString().slice(0,7);}
  function vfCloTxt(mmdd){var p=String(mmdd||'').split('-');try{return +p[1]+' '+new Intl.DateTimeFormat(vmTag(),{month:'long'}).format(new Date(2027,+p[0]-1,1,12));}catch(e){return p[1]+'/'+p[0];}}
  function vfTvaForm(C,cfg,champs,inconnus){
    var sel=function(k,lab,opts,val,aide){return '<label class="sous" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:4px 0;flex-wrap:wrap">'+vmE(lab)+'<select data-vf-tva="'+k+'" style="padding:8px;border-radius:10px;max-width:100%"><option value="">'+vmE(C.choisir)+'</option>'+opts.map(function(o){return '<option value="'+vmE(o[0])+'"'+(val===o[0]?' selected':'')+'>'+vmE(o[1])+'</option>';}).join('')+'</select></label>'+(aide?'<p class="sous" style="margin:0 0 4px;font-size:12.5px">'+vmE(aide)+'</p>':'');};
    var h='';
    if(champs.indexOf('regime')>=0)h+=sel('regime',C.qRegime,[['simplifie',C.o_simplifie],['normal',C.o_normal]],cfg.regime||'');
    if(champs.indexOf('periodicite')>=0)h+=sel('periodicite',C.qPer,[['trimestrielle',C.o_trimestrielle],['mensuelle',C.o_mensuelle]],cfg.periodicite||'',C.qPerAide);
    if(champs.indexOf('cloture')>=0){var mois=[];for(var m=1;m<=12;m++){var mm=('0'+m).slice(-2),dd=String(new Date(Date.UTC(2027,m,0)).getUTCDate());mois.push([mm+'-'+dd,vfCloTxt(mm+'-'+dd)]);}h+=sel('cloture',C.qClo,mois,cfg.cloture||'');}
    (inconnus||[]).forEach(function(e){var n=vmF(C['n_'+e.nature]||e.nature,{p:''});h+='<label class="sous" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:4px 0;flex-wrap:wrap">'+vmE(vmF(C.qMontant,{n:n}))+'<input type="number" inputmode="decimal" min="0" step="0.01" data-vf-tva-montant="'+vmE(e.nature)+'" value="'+vmE(cfg.montants&&cfg.montants[e.nature]!=null?cfg.montants[e.nature]:'')+'" style="width:120px;padding:8px;border-radius:10px"></label>';});
    return h+'<button type="button" data-vf-tva-ok="1" class="btn" style="margin-top:6px;min-height:44px;padding:8px 16px;border-radius:10px">'+vmE(C.qOk)+'</button>';
  }
  function vfTvaSave(card){var P=vbParams(),cur=P.tva&&typeof P.tva==='object'?P.tva:{},nv={regime:cur.regime||null,periodicite:cur.periodicite||null,cloture:cur.cloture||null,montants:Object.assign({},cur.montants||{}),sources:Object.assign({},cur.sources||{})};
    card.querySelectorAll('[data-vf-tva]').forEach(function(s){var k=s.getAttribute('data-vf-tva'),v=s.value||null;if(v!==(nv[k]||null)){nv[k]=v;if(v)nv.sources[k]='patron';else delete nv.sources[k];}});
    card.querySelectorAll('[data-vf-tva-montant]').forEach(function(i){var k=i.getAttribute('data-vf-tva-montant'),v=i.value===''?null:Number(i.value);if(v!=null&&v>=0)nv.montants[k]=v;else delete nv.montants[k];});
    vbSetParam('tva',nv);}
  function vfC(){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}return VF_COPY[l]||VF_COPY.fr;}
  function vfJourTxt(iso){var p=String(iso||'').slice(0,10).split('-');try{return new Intl.DateTimeFormat(vmTag(),{day:'numeric',month:'short'}).format(new Date(+p[0],+p[1]-1,+p[2],12));}catch(e){return p[2]+'/'+p[1];}}
  /* Entrées réelles : solde saisi, prévision jour par jour, taux de la structure, sorties mensuelles, hypothèses. */
  function vfEntrees(){
    var R=root.moteur(),d=R.d,P=vbParams(),today=root.verdictOperationalClock().key.slice(0,10);
    var treso=root.DB&&root.DB.in&&root.DB.in.treso;if(treso==null||treso===''||!vfNum(Number(treso)))return null;
    var debut=P.dateSolde&&/^\d{4}-\d{2}-\d{2}$/.test(P.dateSolde)&&P.dateSolde>today?P.dateSolde:today;
    var g=1;try{var M=root.VerdictTeam&&root.VerdictTeam.model();if(M&&vfNum(M.growth)&&M.growth>0)g=M.growth;}catch(e){}
    var jours=vfPrevision((root.DB&&root.DB.histJour)||[],vfAdd(debut,-200),200+13*7,g,root.VerdictPerformanceIntegrated);
    /* les jours déjà réalisés avant le début (délai fournisseur et TVA du mois précédent) remplacent la prévision par le réel */
    var reel={};((root.DB&&root.DB.histJour)||[]).forEach(function(r){if(typeof r.caJ==='number')reel[String(r.date).slice(0,10)]=r.caJ;});
    jours.forEach(function(j){if(j.date<debut&&vfNum(reel[j.date])){j.caTTC=reel[j.date];j.source='reel';}});
    var brut=(vfNum(d.salb)?d.salb:0)+(vfNum(d.dirb)?d.dirb:0),nets=brut*0.78,cot=vfNum(d.salM)?Math.max(0,d.salM-nets):0;
    return {debut:debut,solde:Number(treso),jours:jours,tva:vfNum(d.tva)?d.tva:0,tauxAchats:d.ca>0?(d.mat+d.av)/d.ca:0,tauxCom:d.ca>0?d.com/d.ca:0,
      mensuel:{nets:nets,cotisations:cot,fixes:vfNum(d.af)?d.af/12:0,emprunt:P.emprunt!=null&&P.emprunt!==''?Number(P.emprunt):null,prelevements:P.prelevements!=null&&P.prelevements!==''?Number(P.prelevements):null,investissements:P.investissements!=null&&P.investissements!==''?Number(P.investissements):null},
      params:{delaiFournisseurs:P.delaiFournisseurs!=null?Number(P.delaiFournisseurs):30,jourSalaires:P.jourSalaires!=null?Number(P.jourSalaires):0,jourUrssaf:P.jourUrssaf!=null?Number(P.jourUrssaf):15,rythmeUrssaf:P.rythmeUrssaf||'mensuel',jourTva:P.jourTva!=null?Number(P.jourTva):20,tauxTvaDeductible:P.tauxTvaDeductible!=null?Number(P.tauxTvaDeductible)/100:0.10,jourLoyer:P.jourLoyer!=null?Number(P.jourLoyer):1,jourEmprunt:P.jourEmprunt!=null?Number(P.jourEmprunt):5,jourPrelevements:P.jourPrelevements!=null?Number(P.jourPrelevements):10},tvaRegime:P.tva&&typeof P.tva==='object'?P.tva:null,growth:g};
  }
  function vfMarkup(C){
    var head='<article class="mod" id="modCash13" data-vf-version="P7"><div class="mod-h"><p class="kicker">'+vmE(C.kicker)+'</p></div>';
    var E=vfEntrees();if(!E)return head.replace('<article','<article data-etat="info"')+'<p class="sous">'+vmE(C.sansSolde)+'</p></article>';
    var R=vfPlanning(E);if(!R.ok)return head+'<p class="sous">'+vmE(R.raison==='solde'?C.sansSolde:C.invalid)+'</p></article>';
    var crit=R.semaineCritique||R.semaines[0],col=vfReserveColor(R.etat);
    var h=head.replace('<article','<article data-etat="'+R.etat+'"');
    h+='<p class="verdict-grand" style="color:'+col+'">'+vmE(R.complete?vmF(R.pointBas<0?C.neg:C.bas,{v:vmEur(R.pointBas),a:vfJourTxt(crit.debut),b:vfJourTxt(crit.fin),n:crit.i+1}):C.partial)+'</p>';
    if(R.causes.length)h+='<p class="sous" style="margin:0 0 8px">'+vmE(vmF(C.causes,{l:R.causes.map(function(x){return (C['k_'+x.k]||x.k)+' '+vmEur(Math.abs(x.v));}).join(', ')}))+'</p>';
    h+='<p class="sous" style="margin:0 0 8px;font-size:14px">'+vmE(C.cashOnly)+'</p>';
    h+='<p class="sous" style="margin:0 0 8px;font-size:14px">'+vmE(vmF(C.reserveBasis,{v:vmEur(R.sortiesMoyennes)}))+'</p>';
    h+='<div style="display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.25fr);gap:6px;padding:6px 0;font-size:13px;color:#9aa6b2"><span>'+vmE(C.week)+'</span><span style="text-align:right">'+vmE(C.receipts)+'</span><span style="text-align:right">'+vmE(C.payments)+'</span><strong style="text-align:right">'+vmE(C.balance)+'</strong></div>';
    R.semaines.forEach(function(s){var cr=s.i===crit.i,tone=vfReserveColor(s.etat);h+='<div data-vf-s="'+s.i+'" data-cash-state="'+s.etat+'" style="display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.25fr);gap:6px;padding:7px 0;border-top:1px solid rgba(148,163,184,.12);font-size:14px'+(cr?';background:'+tone+'1a;border-radius:6px':'')+'"><span>'+vmE(vmF(C.sem,{i:s.i+1,a:vfJourTxt(s.debut),b:vfJourTxt(s.fin)}))+'</span><span style="text-align:right">+'+vmE(vmEur(s.encaissements))+'</span><span style="text-align:right">−'+vmE(vmEur(Math.abs(s.sorties)))+'</span><b style="text-align:right;color:'+tone+'">'+vmE(vmEur(s.solde))+'<small style="display:block;font-size:12px;font-weight:500">'+vmE(C['state_'+s.etat])+'</small></b></div>';});
    h+='<p class="sous" style="margin:10px 0 0;font-size:13px">'+vmE(C.reserveGuide)+'</p>';
    h+=vfTvaBlock(C,R,vbParams());
    var P=vbParams(),p=R.params;
    h+='<details style="margin-top:8px"><summary class="sous" style="cursor:pointer;margin:0">'+vmE(C.reglagesK)+'</summary>'+
      [['delaiFournisseurs',C.delai,p.delai],['jourSalaires',C.jSal,p.jSal],['jourUrssaf',C.jUr,p.jUr],['jourTva',C.jTva,p.jTva],['tauxTvaDeductible',C.txDed,Math.round(p.txDed*100)],['jourLoyer',C.jLoy,p.jLoy],['jourEmprunt',C.jEmp,p.jEmp],['jourPrelevements',C.jPre,p.jPre]].map(function(o){return '<label class="sous" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:4px 0">'+vmE(o[1])+'<input type="number" inputmode="numeric" min="0" step="1" data-vf-k="'+o[0]+'" value="'+vmE(P[o[0]]!=null?P[o[0]]:o[2])+'" style="width:90px;padding:8px;border-radius:10px"></label>';}).join('')+
      '<label class="sous" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:4px 0">'+vmE(C.rythme)+'<select data-vf-k="rythmeUrssaf" style="padding:8px;border-radius:10px"><option value="mensuel"'+(p.trim?'':' selected')+'>'+vmE(C.mensuel)+'</option><option value="trimestriel"'+(p.trim?' selected':'')+'>'+vmE(C.trimestriel)+'</option></select></label>'+
      '<label class="sous" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:4px 0">'+vmE(C.dateSolde)+'<input type="date" data-vf-k="dateSolde" value="'+vmE(P.dateSolde||'')+'" style="padding:8px;border-radius:10px"></label></details>';
    h+='<p class="sous" style="margin:8px 0 0;font-size:12.5px">'+vmE(vmF(C.hyp,{d:p.delai,t:Math.round(p.txDed*100)+'\u00a0%',r:p.trim?C.trimestriel:C.mensuel}))+'</p><p class="sous" style="margin:4px 0 0;font-size:12.5px">'+vmE(C.regle)+'</p>';
    return h+'</article>';
  }
  function vfAttach(doc){
    try{var old=doc.getElementById('modCash13');if(old)old.parentNode.removeChild(old);var after=doc.getElementById('modTreso')||doc.getElementById('modArgent');if(!after)return;
      after.insertAdjacentHTML('afterend',vfMarkup(vfC()));var card=doc.getElementById('modCash13');if(!card)return;
      card.addEventListener('click',function(e){var ok=e.target&&e.target.closest&&e.target.closest('[data-vf-tva-ok]');if(!ok)return;vfTvaSave(card);vmAttach(true);});
      card.addEventListener('change',function(e){var inp=e.target&&e.target.closest&&e.target.closest('[data-vf-k]');if(!inp)return;var k=inp.getAttribute('data-vf-k'),val=inp.value;
        if(k==='rythmeUrssaf'||k==='dateSolde')vbSetParam(k,val||null);else{var n=val===''?null:Number(val);if(n!=null&&!(n>=0))n=null;vbSetParam(k,n);}vmAttach(true);});
    }catch(e){try{console.warn('VerdictCash13',e);}catch(x){}}
  }
  root.VerdictCash13={version:'P7',reserveState:vfReserveState,planning:vfPlanning,prevision:vfPrevision,entrees:vfEntrees};
  /* ═══ fin P7 ═══ */
  /* ═══ P8 — SIMULATEUR DE DÉCISIONS (cœur pur) ═════════════════════════════════
     Six décisions, chacune avec ses hypothèses visibles et son impact sur le résultat, par mois et par an.
     Rien n'est présenté comme acquis : une simulation, c'est une hypothèse à tester. */
  function vsNum(x){return typeof x==='number'&&isFinite(x);}
  function vsOut(annuel,hyp,det){return {ok:vsNum(annuel),annuel:annuel,mensuel:vsNum(annuel)?annuel/12:null,hypotheses:hyp||[],detail:det||{}};}
  /* 1. Fermer un créneau (ou un jour) : CA perdu × (1 − report) × taux de marge sur coûts variables, plus les heures réellement économisées. */
  function vsFermer(x){
    if(!vsNum(x.caAnHT)||!vsNum(x.mcRate))return vsOut(null);
    var report=vsNum(x.report)?x.report:0.2,perdu=x.caAnHT*(1-report),marge=perdu*x.mcRate,eco=(vsNum(x.heuresAn)?x.heuresAn:0)*(vsNum(x.coutHoraire)?x.coutHoraire:0)*(vsNum(x.partHeures)?x.partHeures:1);
    return vsOut(eco-marge,['report','partHeures'],{caPerdu:perdu,margePerdue:marge,economiePersonnel:eco});
  }
  /* 2. Monter le prix d'un plat : gain HT par vente × volume, moins la marge des ventes perdues ; seuil de perte de ventes qui annule le gain. */
  function vsPrix(x){
    if(!vsNum(x.prixTTC)||!vsNum(x.volumeMois)||!vsNum(x.hausseTTC))return vsOut(null);
    var tva=vsNum(x.tva)?x.tva:0.1,h=x.hausseTTC/(1+tva),ht=x.prixTTC/(1+tva),cout=vsNum(x.coutMatiere)?x.coutMatiere:0,marge=ht-cout,baisse=vsNum(x.baisseVentes)?x.baisseVentes:0;
    var v2=x.volumeMois*(1-baisse),mois=v2*(marge+h)-x.volumeMois*marge,seuil=(marge+h)>0?h/(marge+h):null;
    return vsOut(mois*12,['baisseVentes'],{gainParVente:h,margeAvant:marge,seuilBaisse:seuil,volumeApres:v2});
  }
  /* 3. Retirer une plateforme : commissions économisées − marge (avant commissions) des ventes non reportées. */
  function vsPlateforme(x){
    if(!vsNum(x.commissionsAn)||!vsNum(x.tauxCommission)||x.tauxCommission<=0||!vsNum(x.margeAvantCom))return vsOut(null);
    var caPlat=x.commissionsAn/x.tauxCommission,report=vsNum(x.report)?x.report:0.2,perdu=caPlat*(1-report);
    return vsOut(x.commissionsAn-perdu*x.margeAvantCom,['tauxCommission','report'],{caPlateforme:caPlat,caPerdu:perdu,commissions:x.commissionsAn});
  }
  /* 4. Embaucher : coût chargé annuel, et le CA HT supplémentaire nécessaire pour le payer. */
  function vsEmbaucher(x){
    if(!vsNum(x.brutMois)||!vsNum(x.mcRate)||x.mcRate<=0)return vsOut(null);
    var cout=x.brutMois*(1+(vsNum(x.tauxCharges)?x.tauxCharges:0))*12,eco=vsNum(x.economieAn)?x.economieAn:0,ca=vsNum(x.caSupAn)?x.caSupAn:0;
    return vsOut(ca*x.mcRate+eco-cout,['tauxCharges','caSupAn','economieAn'],{coutAn:cout,caNecessaireAn:(cout-eco)/x.mcRate,caNecessaireMois:(cout-eco)/x.mcRate/12});
  }
  /* 5. Hausse fournisseur : achats concernés × hausse ; hausse moyenne de la carte qui compenserait. */
  function vsFournisseur(x){
    if(!vsNum(x.achatsAn)||!vsNum(x.hausse))return vsOut(null);
    var part=vsNum(x.part)?x.part:1,cout=x.achatsAn*part*x.hausse;
    return vsOut(-cout,['part','hausse'],{surcout:cout,hausseCarte:vsNum(x.caAnHT)&&x.caAnHT>0?cout/x.caAnHT:null});
  }
  /* 6. Fermer N semaines : marge perdue sur le CA de la période ; charges fixes et congés payés continuent ; économies déclarées seulement. */
  function vsFermeture(x){
    if(!vsNum(x.caSemaineHT)||!vsNum(x.semaines)||!vsNum(x.mcRate))return vsOut(null);
    var perdu=x.caSemaineHT*x.semaines,eco=vsNum(x.economies)?x.economies:0;
    return vsOut(eco-perdu*x.mcRate,['economies'],{caPerdu:perdu,margePerdue:perdu*x.mcRate});
  }
  var VS_COPY={"fr": {"titre": "Simuler une décision", "intro": "Six décisions, avec leurs hypothèses visibles. Une simulation n’est pas un gain acquis : c’est une hypothèse à tester.", "s_fermer": "Fermer un service", "s_prix": "Monter un prix", "s_plateforme": "Retirer une plateforme", "s_embaucher": "Embaucher", "s_fournisseur": "Hausse fournisseur", "s_fermeture": "Fermer des semaines", "impactAn": "Impact sur le résultat : {v} par an", "impactMois": "soit {v} par mois", "positif": "La décision améliore le résultat", "negatif": "La décision dégrade le résultat", "creneau": "Service à fermer", "jourEntier": "journée entière", "report": "Part des ventes reportée sur d’autres services (%)", "partHeures": "Part des heures réellement économisées (%)", "partHeuresNote": "Un salarié en CDI reste payé : ne comptez que les heures qui disparaissent vraiment (extras, coupures, contrats à la fin).", "caPerdu": "CA HT perdu {v} · marge perdue {m} · personnel économisé {e}", "plat": "Plat", "hausse": "Hausse du prix TTC (€)", "baisse": "Baisse des ventes attendue (%)", "prixDet": "+{g} HT par vente · {n} ventes par mois après la hausse", "seuil": "La hausse reste gagnante tant que les ventes baissent de moins de {s}.", "taux": "Taux de commission de la plateforme (%)", "reportPlat": "Part des clients qui recommandent en direct (%)", "platDet": "CA estimé sur la plateforme {c} · commissions économisées {k} · CA perdu {p}", "platAbsent": "Aucune commission de plateforme dans votre structure : rien à simuler.", "brut": "Salaire brut mensuel (€)", "charges": "Charges patronales (%)", "caSup": "CA HT supplémentaire attendu par an (€)", "ecoAn": "Économies attendues par an (extras, heures) (€)", "embDet": "Coût chargé {c} par an · il faut {m} de CA HT en plus par mois pour le payer", "pctHausse": "Hausse des prix d’achat (%)", "partAchats": "Part de vos achats concernée (%)", "fourDet": "Surcoût {c} par an · une hausse moyenne de la carte de {h} le compenserait", "semaines": "Nombre de semaines fermées", "moisFerm": "Mois de fermeture", "ecoFerm": "Économies pendant la fermeture (€)", "ecoFermNote": "Loyer, abonnements et congés payés continuent : ne comptez que ce qui s’arrête vraiment.", "fermDet": "CA HT perdu {c} (même mois l’an dernier) · marge perdue {m}", "hyp": "Hypothèses : marge sur coûts variables {mc} · TVA {t} · données de votre structure et de vos services.", "aucune": "Pas assez de données pour cette simulation.", "noter": "Noter cette décision dans le registre"}, "en": {"titre": "Simulate a decision", "intro": "Six decisions, with visible assumptions. A simulation is not a secured gain: it is an assumption to test.", "s_fermer": "Close a service", "s_prix": "Raise a price", "s_plateforme": "Leave a platform", "s_embaucher": "Hire", "s_fournisseur": "Supplier increase", "s_fermeture": "Close for weeks", "impactAn": "Impact on result: {v} per year", "impactMois": "or {v} per month", "positif": "The decision improves the result", "negatif": "The decision worsens the result", "creneau": "Service to close", "jourEntier": "whole day", "report": "Share of sales moved to other services (%)", "partHeures": "Share of hours actually saved (%)", "partHeuresNote": "A permanent employee is still paid: count only hours that really disappear (extras, split shifts, ending contracts).", "caPerdu": "Revenue lost excl. VAT {v} · margin lost {m} · staff saved {e}", "plat": "Dish", "hausse": "Price increase incl. VAT (€)", "baisse": "Expected drop in sales (%)", "prixDet": "+{g} excl. VAT per sale · {n} sales per month after the increase", "seuil": "The increase still pays as long as sales drop by less than {s}.", "taux": "Platform commission rate (%)", "reportPlat": "Share of customers who reorder directly (%)", "platDet": "Estimated platform revenue {c} · commissions saved {k} · revenue lost {p}", "platAbsent": "No platform commission in your structure: nothing to simulate.", "brut": "Monthly gross salary (€)", "charges": "Employer contributions (%)", "caSup": "Expected extra revenue excl. VAT per year (€)", "ecoAn": "Expected savings per year (extras, hours) (€)", "embDet": "Loaded cost {c} per year · you need {m} more revenue excl. VAT per month to pay for it", "pctHausse": "Purchase price increase (%)", "partAchats": "Share of your purchases affected (%)", "fourDet": "Extra cost {c} per year · an average menu increase of {h} would offset it", "semaines": "Number of weeks closed", "moisFerm": "Closing month", "ecoFerm": "Savings during the closure (€)", "ecoFermNote": "Rent, subscriptions and paid leave continue: count only what really stops.", "fermDet": "Revenue lost excl. VAT {c} (same month last year) · margin lost {m}", "hyp": "Assumptions: contribution margin {mc} · VAT {t} · data from your structure and services.", "aucune": "Not enough data for this simulation.", "noter": "Record this decision in the log"}, "es": {"titre": "Simular una decisión", "intro": "Seis decisiones, con sus hipótesis visibles. Una simulación no es una ganancia asegurada: es una hipótesis que probar.", "s_fermer": "Cerrar un servicio", "s_prix": "Subir un precio", "s_plateforme": "Dejar una plataforma", "s_embaucher": "Contratar", "s_fournisseur": "Subida del proveedor", "s_fermeture": "Cerrar semanas", "impactAn": "Impacto en el resultado: {v} al año", "impactMois": "o {v} al mes", "positif": "La decisión mejora el resultado", "negatif": "La decisión empeora el resultado", "creneau": "Servicio a cerrar", "jourEntier": "jornada completa", "report": "Parte de las ventas trasladada a otros servicios (%)", "partHeures": "Parte de las horas realmente ahorradas (%)", "partHeuresNote": "Un empleado indefinido sigue cobrando: cuente solo las horas que desaparecen de verdad (extras, turnos partidos, contratos que terminan).", "caPerdu": "Ingresos perdidos sin IVA {v} · margen perdido {m} · personal ahorrado {e}", "plat": "Plato", "hausse": "Subida del precio con IVA (€)", "baisse": "Bajada de ventas esperada (%)", "prixDet": "+{g} sin IVA por venta · {n} ventas al mes tras la subida", "seuil": "La subida sigue ganando mientras las ventas bajen menos del {s}.", "taux": "Tasa de comisión de la plataforma (%)", "reportPlat": "Parte de clientes que piden directamente (%)", "platDet": "Ingresos estimados en la plataforma {c} · comisiones ahorradas {k} · ingresos perdidos {p}", "platAbsent": "Ninguna comisión de plataforma en su estructura: nada que simular.", "brut": "Salario bruto mensual (€)", "charges": "Cotizaciones patronales (%)", "caSup": "Ingresos extra esperados sin IVA al año (€)", "ecoAn": "Ahorros esperados al año (extras, horas) (€)", "embDet": "Coste total {c} al año · necesita {m} más de ingresos sin IVA al mes para pagarlo", "pctHausse": "Subida de precios de compra (%)", "partAchats": "Parte de sus compras afectada (%)", "fourDet": "Sobrecoste {c} al año · una subida media de la carta del {h} lo compensaría", "semaines": "Número de semanas cerradas", "moisFerm": "Mes de cierre", "ecoFerm": "Ahorros durante el cierre (€)", "ecoFermNote": "Alquiler, suscripciones y vacaciones pagadas continúan: cuente solo lo que realmente se detiene.", "fermDet": "Ingresos perdidos sin IVA {c} (mismo mes del año pasado) · margen perdido {m}", "hyp": "Hipótesis: margen sobre costes variables {mc} · IVA {t} · datos de su estructura y servicios.", "aucune": "No hay datos suficientes para esta simulación.", "noter": "Anotar esta decisión en el registro"}, "it": {"titre": "Simulare una decisione", "intro": "Sei decisioni, con le ipotesi visibili. Una simulazione non è un guadagno acquisito: è un’ipotesi da verificare.", "s_fermer": "Chiudere un servizio", "s_prix": "Alzare un prezzo", "s_plateforme": "Lasciare una piattaforma", "s_embaucher": "Assumere", "s_fournisseur": "Aumento fornitore", "s_fermeture": "Chiudere settimane", "impactAn": "Impatto sul risultato: {v} all’anno", "impactMois": "cioè {v} al mese", "positif": "La decisione migliora il risultato", "negatif": "La decisione peggiora il risultato", "creneau": "Servizio da chiudere", "jourEntier": "giornata intera", "report": "Quota di vendite spostata su altri servizi (%)", "partHeures": "Quota di ore realmente risparmiate (%)", "partHeuresNote": "Un dipendente a tempo indeterminato resta pagato: conti solo le ore che spariscono davvero (extra, turni spezzati, contratti in scadenza).", "caPerdu": "Ricavi persi IVA esclusa {v} · margine perso {m} · personale risparmiato {e}", "plat": "Piatto", "hausse": "Aumento del prezzo IVA inclusa (€)", "baisse": "Calo delle vendite atteso (%)", "prixDet": "+{g} IVA esclusa per vendita · {n} vendite al mese dopo l’aumento", "seuil": "L’aumento resta vantaggioso finché le vendite calano meno del {s}.", "taux": "Commissione della piattaforma (%)", "reportPlat": "Quota di clienti che riordinano direttamente (%)", "platDet": "Ricavi stimati sulla piattaforma {c} · commissioni risparmiate {k} · ricavi persi {p}", "platAbsent": "Nessuna commissione di piattaforma nella sua struttura: niente da simulare.", "brut": "Stipendio lordo mensile (€)", "charges": "Contributi a carico del datore (%)", "caSup": "Ricavi extra attesi IVA esclusa all’anno (€)", "ecoAn": "Risparmi attesi all’anno (extra, ore) (€)", "embDet": "Costo totale {c} all’anno · servono {m} di ricavi IVA esclusa in più al mese per pagarlo", "pctHausse": "Aumento dei prezzi d’acquisto (%)", "partAchats": "Quota degli acquisti interessata (%)", "fourDet": "Extra costo {c} all’anno · un aumento medio della carta del {h} lo compenserebbe", "semaines": "Numero di settimane chiuse", "moisFerm": "Mese di chiusura", "ecoFerm": "Risparmi durante la chiusura (€)", "ecoFermNote": "Affitto, abbonamenti e ferie pagate continuano: conti solo ciò che si ferma davvero.", "fermDet": "Ricavi persi IVA esclusa {c} (stesso mese dell’anno scorso) · margine perso {m}", "hyp": "Ipotesi: margine sui costi variabili {mc} · IVA {t} · dati della sua struttura e dei servizi.", "aucune": "Dati insufficienti per questa simulazione.", "noter": "Annotare questa decisione nel registro"}, "de": {"titre": "Eine Entscheidung simulieren", "intro": "Sechs Entscheidungen mit sichtbaren Annahmen. Eine Simulation ist kein gesicherter Gewinn, sondern eine zu prüfende Annahme.", "s_fermer": "Einen Service schließen", "s_prix": "Einen Preis erhöhen", "s_plateforme": "Eine Plattform verlassen", "s_embaucher": "Einstellen", "s_fournisseur": "Lieferantenerhöhung", "s_fermeture": "Wochen schließen", "impactAn": "Wirkung auf das Ergebnis: {v} pro Jahr", "impactMois": "also {v} pro Monat", "positif": "Die Entscheidung verbessert das Ergebnis", "negatif": "Die Entscheidung verschlechtert das Ergebnis", "creneau": "Zu schließender Service", "jourEntier": "ganzer Tag", "report": "Anteil der Verkäufe, der auf andere Services ausweicht (%)", "partHeures": "Anteil der tatsächlich eingesparten Stunden (%)", "partHeuresNote": "Ein unbefristet Beschäftigter wird weiter bezahlt: zählen Sie nur Stunden, die wirklich wegfallen (Aushilfen, geteilte Dienste, auslaufende Verträge).", "caPerdu": "Verlorener Nettoumsatz {v} · verlorene Marge {m} · eingesparte Personalkosten {e}", "plat": "Gericht", "hausse": "Preiserhöhung brutto (€)", "baisse": "Erwarteter Absatzrückgang (%)", "prixDet": "+{g} netto pro Verkauf · {n} Verkäufe pro Monat nach der Erhöhung", "seuil": "Die Erhöhung lohnt sich, solange der Absatz um weniger als {s} sinkt.", "taux": "Provisionssatz der Plattform (%)", "reportPlat": "Anteil der Kunden, die direkt bestellen (%)", "platDet": "Geschätzter Plattformumsatz {c} · eingesparte Provisionen {k} · verlorener Umsatz {p}", "platAbsent": "Keine Plattformprovision in Ihrer Struktur: nichts zu simulieren.", "brut": "Monatliches Bruttogehalt (€)", "charges": "Arbeitgeberbeiträge (%)", "caSup": "Erwarteter Zusatzumsatz netto pro Jahr (€)", "ecoAn": "Erwartete Einsparungen pro Jahr (Aushilfen, Stunden) (€)", "embDet": "Gesamtkosten {c} pro Jahr · Sie brauchen {m} mehr Nettoumsatz pro Monat, um sie zu bezahlen", "pctHausse": "Erhöhung der Einkaufspreise (%)", "partAchats": "Betroffener Anteil Ihrer Einkäufe (%)", "fourDet": "Mehrkosten {c} pro Jahr · eine durchschnittliche Kartenerhöhung von {h} würde sie ausgleichen", "semaines": "Anzahl geschlossener Wochen", "moisFerm": "Schließmonat", "ecoFerm": "Einsparungen während der Schließung (€)", "ecoFermNote": "Miete, Abos und bezahlter Urlaub laufen weiter: zählen Sie nur, was wirklich stoppt.", "fermDet": "Verlorener Nettoumsatz {c} (gleicher Monat im Vorjahr) · verlorene Marge {m}", "hyp": "Annahmen: Deckungsbeitrag {mc} · MwSt. {t} · Daten Ihrer Struktur und Services.", "aucune": "Nicht genug Daten für diese Simulation.", "noter": "Diese Entscheidung im Register vermerken"}, "nl": {"titre": "Een beslissing simuleren", "intro": "Zes beslissingen, met zichtbare aannames. Een simulatie is geen verworven winst: het is een aanname om te testen.", "s_fermer": "Een dienst sluiten", "s_prix": "Een prijs verhogen", "s_plateforme": "Een platform verlaten", "s_embaucher": "Aannemen", "s_fournisseur": "Prijsstijging leverancier", "s_fermeture": "Weken sluiten", "impactAn": "Effect op het resultaat: {v} per jaar", "impactMois": "of {v} per maand", "positif": "De beslissing verbetert het resultaat", "negatif": "De beslissing verslechtert het resultaat", "creneau": "Te sluiten dienst", "jourEntier": "hele dag", "report": "Deel van de verkopen dat naar andere diensten verschuift (%)", "partHeures": "Deel van de uren dat echt bespaard wordt (%)", "partHeuresNote": "Een vaste werknemer wordt doorbetaald: tel alleen uren die echt verdwijnen (extra’s, gebroken diensten, aflopende contracten).", "caPerdu": "Verloren omzet excl. btw {v} · verloren marge {m} · bespaard personeel {e}", "plat": "Gerecht", "hausse": "Prijsverhoging incl. btw (€)", "baisse": "Verwachte daling van de verkopen (%)", "prixDet": "+{g} excl. btw per verkoop · {n} verkopen per maand na de verhoging", "seuil": "De verhoging blijft lonen zolang de verkopen minder dan {s} dalen.", "taux": "Commissiepercentage van het platform (%)", "reportPlat": "Deel van de klanten dat rechtstreeks bestelt (%)", "platDet": "Geschatte platformomzet {c} · bespaarde commissies {k} · verloren omzet {p}", "platAbsent": "Geen platformcommissie in uw structuur: niets te simuleren.", "brut": "Brutomaandsalaris (€)", "charges": "Werkgeversbijdragen (%)", "caSup": "Verwachte extra omzet excl. btw per jaar (€)", "ecoAn": "Verwachte besparingen per jaar (extra’s, uren) (€)", "embDet": "Totale kost {c} per jaar · u hebt {m} meer omzet excl. btw per maand nodig om die te betalen", "pctHausse": "Stijging van de inkoopprijzen (%)", "partAchats": "Betrokken deel van uw aankopen (%)", "fourDet": "Meerkost {c} per jaar · een gemiddelde kaartverhoging van {h} zou die compenseren", "semaines": "Aantal gesloten weken", "moisFerm": "Sluitingsmaand", "ecoFerm": "Besparingen tijdens de sluiting (€)", "ecoFermNote": "Huur, abonnementen en betaald verlof lopen door: tel alleen wat echt stopt.", "fermDet": "Verloren omzet excl. btw {c} (zelfde maand vorig jaar) · verloren marge {m}", "hyp": "Aannames: dekkingsbijdrage {mc} · btw {t} · gegevens van uw structuur en diensten.", "aucune": "Niet genoeg gegevens voor deze simulatie.", "noter": "Deze beslissing in het register noteren"}, "pt": {"titre": "Simular uma decisão", "intro": "Seis decisões, com as hipóteses visíveis. Uma simulação não é um ganho garantido: é uma hipótese a testar.", "s_fermer": "Fechar um serviço", "s_prix": "Subir um preço", "s_plateforme": "Sair de uma plataforma", "s_embaucher": "Contratar", "s_fournisseur": "Aumento do fornecedor", "s_fermeture": "Fechar semanas", "impactAn": "Impacto no resultado: {v} por ano", "impactMois": "ou {v} por mês", "positif": "A decisão melhora o resultado", "negatif": "A decisão piora o resultado", "creneau": "Serviço a fechar", "jourEntier": "dia inteiro", "report": "Parte das vendas transferida para outros serviços (%)", "partHeures": "Parte das horas realmente poupadas (%)", "partHeuresNote": "Um trabalhador efetivo continua a ser pago: conte só as horas que desaparecem mesmo (extras, turnos partidos, contratos a terminar).", "caPerdu": "Receita perdida sem IVA {v} · margem perdida {m} · pessoal poupado {e}", "plat": "Prato", "hausse": "Aumento do preço com IVA (€)", "baisse": "Descida de vendas esperada (%)", "prixDet": "+{g} sem IVA por venda · {n} vendas por mês após o aumento", "seuil": "O aumento continua a compensar enquanto as vendas descerem menos de {s}.", "taux": "Taxa de comissão da plataforma (%)", "reportPlat": "Parte dos clientes que encomendam diretamente (%)", "platDet": "Receita estimada na plataforma {c} · comissões poupadas {k} · receita perdida {p}", "platAbsent": "Nenhuma comissão de plataforma na sua estrutura: nada a simular.", "brut": "Salário bruto mensal (€)", "charges": "Contribuições patronais (%)", "caSup": "Receita extra esperada sem IVA por ano (€)", "ecoAn": "Poupanças esperadas por ano (extras, horas) (€)", "embDet": "Custo total {c} por ano · precisa de mais {m} de receita sem IVA por mês para o pagar", "pctHausse": "Aumento dos preços de compra (%)", "partAchats": "Parte das compras afetada (%)", "fourDet": "Custo extra {c} por ano · um aumento médio da carta de {h} compensá-lo-ia", "semaines": "Número de semanas fechadas", "moisFerm": "Mês de fecho", "ecoFerm": "Poupanças durante o fecho (€)", "ecoFermNote": "Renda, assinaturas e férias pagas continuam: conte só o que para mesmo.", "fermDet": "Receita perdida sem IVA {c} (mesmo mês do ano passado) · margem perdida {m}", "hyp": "Hipóteses: margem sobre custos variáveis {mc} · IVA {t} · dados da sua estrutura e serviços.", "aucune": "Dados insuficientes para esta simulação.", "noter": "Registar esta decisão no registo"}};
  var vsState={sc:'fermer',v:{}};
  function vsC(){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}return VS_COPY[l]||VS_COPY.fr;}
  function vsPct(r){return vtNum(r)?(r*100).toLocaleString(vtTag(),{maximumFractionDigits:1})+'\u00a0%':'—';}
  function vsVal(k,def){var v=vsState.v[vsState.sc+':'+k];return v==null||v===''?def:v;}
  /* Créneaux des 364 derniers jours de services : CA HT, heures, coût, ramenés à l'année. */
  function vsCreneaux(d){
    var S=(root.DB&&root.DB.services)||[],key=root.verdictOperationalClock().key.slice(0,10),a=vfAdd(key,-364),g={},mn=null,mx=null,H=0,Ccost=0;
    S.forEach(function(s){var r=vtServiceRow(s,d.tva);if(!r||r.d<a||r.d>=key)return;if(!mn||r.d<mn)mn=r.d;if(!mx||r.d>mx)mx=r.d;var wd=vtWeekday(r.d),k=wd+'|'+r.slot,G=g[k]||(g[k]={wd:wd,slot:r.slot,label:r.label,ht:0,h:0,cost:0});G.ht+=r.ht||0;G.h+=r.h;G.cost+=r.cost||0;H+=r.h;Ccost+=r.cost||0;});
    if(!mn)return null;var span=(Date.parse(mx)-Date.parse(mn))/864e5+1,f=span>=300?1:364/span;
    var L=Object.keys(g).map(function(k){var G=g[k];return {id:k,wd:G.wd,slot:G.slot,label:G.label,caAnHT:G.ht*f,heuresAn:G.h*f};});
    var jours={};L.forEach(function(x){var J=jours[x.wd]||(jours[x.wd]={id:x.wd+'|*',wd:x.wd,slot:'*',caAnHT:0,heuresAn:0});J.caAnHT+=x.caAnHT;J.heuresAn+=x.heuresAn;});
    L.sort(function(p,q){return p.wd-q.wd||String(p.slot).localeCompare(String(q.slot));});
    return {creneaux:L,jours:Object.keys(jours).map(function(k){return jours[k];}),coutHoraire:H>0?Ccost/H:null,facteur:f};
  }
  function vsWd(w){try{return new Intl.DateTimeFormat(vtTag(),{weekday:'long'}).format(new Date(2024,0,7+w,12));}catch(e){return String(w);}}
  function vsField(k,lab,def,opts){var v=vsVal(k,def);
    if(opts)return '<label class="vt-note" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0">'+vtE(lab)+'<select data-vs-k="'+k+'" style="max-width:60%;padding:8px;border-radius:10px">'+opts.map(function(o){return '<option value="'+vtE(o[0])+'"'+(String(o[0])===String(v)?' selected':'')+'>'+vtE(o[1])+'</option>';}).join('')+'</select></label>';
    return '<label class="vt-note" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0">'+vtE(lab)+'<input type="number" inputmode="decimal" step="any" min="0" data-vs-k="'+k+'" value="'+vtE(v)+'" style="width:100px;padding:8px;border-radius:10px"></label>';}
  function vsCompute(C,d){
    var mc=d.ca>0?d.mc/d.ca:null,sc=vsState.sc,form='',R=null,det='',note='';
    if(sc==='fermer'){var K=vsCreneaux(d);if(!K)return {form:'',R:null};var opts=K.creneaux.map(function(x){return [x.id,vtCap(vsWd(x.wd))+' · '+(C['slot_'+x.slot]||vtSlotLabel(vtC(),x.slot,x.label))];}).concat(K.jours.map(function(x){return [x.id,vtCap(vsWd(x.wd))+' · '+C.jourEntier];}));
      var id=vsVal('creneau',opts[0][0]),x=K.creneaux.concat(K.jours).filter(function(c){return c.id===id;})[0]||K.creneaux[0];
      form=vsField('creneau',C.creneau,id,opts)+vsField('report',C.report,20)+vsField('partHeures',C.partHeures,50);note=C.partHeuresNote;
      R=vsFermer({caAnHT:x.caAnHT,mcRate:mc,report:Number(vsVal('report',20))/100,heuresAn:x.heuresAn,coutHoraire:K.coutHoraire,partHeures:Number(vsVal('partHeures',50))/100});
      if(R.ok)det=vtF(C.caPerdu,{v:vtEur(R.detail.caPerdu),m:vtEur(R.detail.margePerdue),e:vtEur(R.detail.economiePersonnel)});}
    else if(sc==='prix'){var P=((root.DB&&root.DB.plats)||[]).filter(function(p){return p&&p.vol>0&&p.ttc>0;});if(!P.length)return {form:'',R:null};
      var opts2=P.map(function(p,i){return [String(i),p.nom];}),pi=Number(vsVal('plat','0')),p=P[pi]||P[0],calc=null;try{calc=root.platCalc(p);}catch(e){}
      form=vsField('plat',C.plat,'0',opts2)+vsField('hausse',C.hausse,0.5)+vsField('baisse',C.baisse,0);
      R=vsPrix({prixTTC:p.ttc,volumeMois:p.vol,hausseTTC:Number(vsVal('hausse',0.5)),tva:(root.platTVA?root.platTVA(p):10)/100,coutMatiere:calc&&vtNum(calc.cout)?calc.cout:0,baisseVentes:Number(vsVal('baisse',0))/100});
      if(R.ok)det=vtF(C.prixDet,{g:vtEur2(R.detail.gainParVente),n:vtN(R.detail.volumeApres)})+(R.detail.seuilBaisse!=null?' '+vtF(C.seuil,{s:vsPct(R.detail.seuilBaisse)}):'');}
    else if(sc==='plateforme'){if(!(d.com>0))return {form:'',R:null,absent:C.platAbsent};
      form=vsField('taux',C.taux,30)+vsField('report',C.reportPlat,20);
      R=vsPlateforme({commissionsAn:d.com,tauxCommission:Number(vsVal('taux',30))/100,report:Number(vsVal('report',20))/100,margeAvantCom:d.ca>0?(d.ca-d.mat-d.av)/d.ca:null});
      if(R.ok)det=vtF(C.platDet,{c:vtEur(R.detail.caPlateforme),k:vtEur(R.detail.commissions),p:vtEur(R.detail.caPerdu)});}
    else if(sc==='embaucher'){var bm=d.saln>0?Math.round(d.salb/d.saln):2000;
      form=vsField('brut',C.brut,bm)+vsField('charges',C.charges,vtNum(d.salt)?d.salt:42)+vsField('caSup',C.caSup,0)+vsField('ecoAn',C.ecoAn,0);
      R=vsEmbaucher({brutMois:Number(vsVal('brut',bm)),tauxCharges:Number(vsVal('charges',vtNum(d.salt)?d.salt:42))/100,mcRate:mc,caSupAn:Number(vsVal('caSup',0)),economieAn:Number(vsVal('ecoAn',0))});
      if(R.ok)det=vtF(C.embDet,{c:vtEur(R.detail.coutAn),m:vtEur(R.detail.caNecessaireMois)});}
    else if(sc==='fournisseur'){form=vsField('hausse',C.pctHausse,8)+vsField('part',C.partAchats,100);
      R=vsFournisseur({achatsAn:(d.mat||0)+(d.av||0),part:Number(vsVal('part',100))/100,hausse:Number(vsVal('hausse',8))/100,caAnHT:d.ca});
      if(R.ok)det=vtF(C.fourDet,{c:vtEur(R.detail.surcout),h:vsPct(R.detail.hausseCarte)});}
    else if(sc==='fermeture'){var key=root.verdictOperationalClock().key,y=Number(key.slice(0,4)),mo=Array.from({length:12},function(_,i){return [String(i),vtCap(vtMonth(i))];}),mi=Number(vsVal('mois',String((Number(key.slice(5,7)))%12)));
      var ym=(y-1)+'-'+('0'+(mi+1)).slice(-2),s=0,n=0;((root.DB&&root.DB.histJour)||[]).forEach(function(r){if(String(r.date).slice(0,7)===ym&&typeof r.caJ==='number'){s+=r.caJ;n++;}});
      form=vsField('mois',C.moisFerm,String(mi),mo)+vsField('semaines',C.semaines,2)+vsField('economies',C.ecoFerm,0);note=C.ecoFermNote;
      if(!n)return {form:form,R:null,note:note};var jours=new Date(Date.UTC(y-1,mi+1,0)).getUTCDate();
      R=vsFermeture({caSemaineHT:s/(1+d.tva)/jours*7,semaines:Number(vsVal('semaines',2)),mcRate:mc,economies:Number(vsVal('economies',0))});
      if(R.ok)det=vtF(C.fermDet,{c:vtEur(R.detail.caPerdu),m:vtEur(R.detail.margePerdue)});}
    return {form:form,R:R,det:det,note:note,mc:mc};
  }
  function vsHTML(){
    var R0=null;try{R0=root.moteur();}catch(e){}if(!R0||!R0.ready)return '';var d=R0.d,C=Object.assign({},vtC(),vsC());
    var h='<section class="vt" id="vsModule" data-vs-version="P8"><p class="vt-k">'+vtE(C.titre)+'</p><p class="vt-note" style="margin:0 0 8px">'+vtE(C.intro)+'</p><div class="vt-btns" role="tablist">'+
      ['fermer','prix','plateforme','embaucher','fournisseur','fermeture'].map(function(k){return '<button type="button" role="tab" data-vs-sc="'+k+'" aria-pressed="'+(vsState.sc===k)+'">'+vtE(C['s_'+k])+'</button>';}).join('')+'</div>';
    var X=vsCompute(C,d);
    h+='<div class="vt-card" style="--vtc:'+(X.R&&X.R.ok?(X.R.annuel>=0?'#22c55e':'#ef4444'):'#64748b')+'">'+X.form;
    if(X.absent)h+='<p class="vt-note">'+vtE(X.absent)+'</p>';
    else if(!X.R||!X.R.ok)h+='<p class="vt-note">'+vtE(C.aucune)+'</p>';
    else{var pos=X.R.annuel>=0;h+='<p class="vt-big" data-vs-annuel="'+X.R.annuel.toFixed(2)+'" style="color:'+(pos?'#22c55e':'#ef4444')+'">'+vtE(vtF(C.impactAn,{v:(pos?'+':'')+vtEur(X.R.annuel)}))+'</p><p class="vt-note" style="margin:0">'+vtE(vtF(C.impactMois,{v:(pos?'+':'')+vtEur(X.R.mensuel)}))+' · '+vtE(pos?C.positif:C.negatif)+'</p>';
      if(X.det)h+='<p class="vt-read" data-vs-det>'+vtE(X.det)+'</p>';}
    if(X.note)h+='<p class="vt-note">'+vtE(X.note)+'</p>';
    h+='<p class="vt-note">'+vtE(vtF(C.hyp,{mc:vsPct(d.ca>0?d.mc/d.ca:null),t:vsPct(d.tva)}))+'</p></div></section>';
    return h;
  }
  function vsRender(){
    try{var host=root.document.getElementById('decBody');if(!host)return;vtStyle();var old=root.document.getElementById('vsModule');if(old)old.parentNode.removeChild(old);
      var html=vsHTML();if(!html)return;host.insertAdjacentHTML('afterbegin',html);var mod=root.document.getElementById('vsModule');
      mod.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('[data-vs-sc]');if(b){vsState.sc=b.getAttribute('data-vs-sc');vsRender();}});
      mod.addEventListener('change',function(e){var i=e.target&&e.target.closest&&e.target.closest('[data-vs-k]');if(!i)return;vsState.v[vsState.sc+':'+i.getAttribute('data-vs-k')]=i.value;vsRender();});
    }catch(e){try{console.warn('VerdictSimulateur',e);}catch(x){}}
  }
  root.setInterval(function(){if(root.VIEW==='dec'&&root.document.getElementById('decBody')&&!root.document.getElementById('vsModule'))vsRender();},1000);
  root.VerdictSimulateur={version:'P8',render:vsRender,state:vsState,creneaux:function(){return vsCreneaux(root.moteur().d);},core:{fermer:vsFermer,prix:vsPrix,plateforme:vsPlateforme,embaucher:vsEmbaucher,fournisseur:vsFournisseur,fermeture:vsFermeture}};
  /* ═══ fin P8 ═══ */
  /* ═══ P10 — VERA SUR TOUT ════════════════════════════════════════════════════
     Vera répond sur l'argent, la trésorerie, l'équipe par service, la clôture matière, les simulations et les
     offerts / remises / annulations, avec EXACTEMENT les fonctions des écrans (aucun calcul à part), datées et
     sourcées. Les autres questions continuent vers les réponses existantes. */
  var VV_COPY={"fr": {"k": "Vera · mêmes chiffres que vos écrans", "date": "Au {d} · {s}.", "srcArgent": "carte « Où part l’argent »", "srcTreso": "cartes « Du résultat à la banque » et « Trésorerie à 13 semaines »", "srcEquipe": "module Équipe (Salaires)", "srcMatiere": "clôture matière (Inventaire > Analyse)", "srcSim": "simulateur (Décisions)", "srcOff": "offerts, remises et annulations importés de la caisse", "demo": "Données de démonstration fictives.", "argReste": "Sur 100 € de chiffre d’affaires de {m}, il vous reste {v}.", "argManque": "Sur 100 € de chiffre d’affaires de {m}, il vous manque {v}.", "argTop": "Les plus gros postes : {l}.", "argChange": "Depuis {m} : {l} {d} sur 100 €.", "argAttente": "Il faut un mois complet de chiffre d’affaires pour dire où part l’argent.", "trBas": "Moment le plus serré pour votre compte en banque : environ {v}, la semaine du {a} au {b}.", "trNeg": "Attention : votre compte en banque passerait sous zéro la semaine du {a} au {b} ({v}).", "trCauses": "Cette semaine-là : {l}.", "trSansSolde": "Je ne peux pas prévoir votre trésorerie sans solde de départ : renseignez votre trésorerie disponible dans « Mes chiffres ».", "trPont": "En {m}, votre trésorerie a dû {s} d’environ {v} ({n} élément(s) non mesuré(s)).", "trHausse": "augmenter", "trBaisse": "baisser", "eqFaible": "Le créneau le moins productif de {m} : {c}, {p} HT par heure ({n} services).", "eqHeures": "En {m}, vous avez payé {r} heure pour 1 heure utile au rythme que vous tenez.", "eqBudget": "Votre équipe de {m} est couverte à {p} par ce que la structure peut payer.", "eqRegle": "On compare des services, on ne désigne personne.", "eqAttente": "Il faut des services saisis (heures et chiffre d’affaires) pour lire votre équipe service par service.", "matCloture": "Dernière clôture ({a} → {b}) : {r} réellement consommés, théorique {t}, à vérifier {x}.", "matTop": "Premier endroit où regarder : {f} ({x}).", "matAttente": "Je ne peux pas dire où part votre matière sans deux inventaires complets : coût matière réel non calculable.", "matPertes": "Pertes déclarées sur la période : {v}.", "simRes": "Si vous {q} : impact estimé {v} par an ({m} par mois).", "simDet": "{d}", "simHyp": "Hypothèses par défaut, à ajuster dans Décisions > Simuler une décision. Une simulation n’est pas un gain acquis.", "simNon": "Je n’ai pas assez de données pour simuler cette décision.", "sim_fermer": "fermez {c}", "sim_prix": "montez « {p} » de {h}", "sim_plateforme": "retirez votre plateforme de livraison", "sim_embaucher": "embauchez une personne à {b} brut par mois", "sim_fournisseur": "subissez une hausse fournisseur de {h}", "sim_fermeture": "fermez {n} semaine(s) en {m}", "offRes": "En {m} : remises {r}, offerts {o}, annulations {a} — manque à gagner au prix de la carte.", "offNon": "non fourni", "offAbsent": "Votre caisse ne m’a fourni ni offerts, ni remises, ni annulations pour {m}. Importez l’export journalier depuis la carte « Où part l’argent ».", "argAmort": "Dont amortissements −{a} ce mois : une charge, pas une sortie d’argent (avant amortissements : {av})."}, "en": {"k": "Vera · same figures as your screens", "date": "As of {d} · {s}.", "srcArgent": "“Where the money goes” card", "srcTreso": "“From profit to bank balance” and “13-week cash forecast” cards", "srcEquipe": "Team module (Payroll)", "srcMatiere": "food cost closing (Inventory > Analysis)", "srcSim": "simulator (Decisions)", "srcOff": "comps, discounts and voids imported from the till", "demo": "Fictional demonstration data.", "argReste": "For every €100 of revenue in {m}, you keep {v}.", "argManque": "For every €100 of revenue in {m}, you are short {v}.", "argTop": "Largest items: {l}.", "argChange": "Since {m}: {l} {d} per €100.", "argAttente": "One complete month of revenue is needed to say where the money goes.", "trBas": "Expected low point of your cash: {v}, in the week of {a} to {b}.", "trNeg": "Warning: your cash would go below zero in the week of {a} to {b} ({v}).", "trCauses": "That week: {l}.", "trSansSolde": "I cannot forecast your cash without a starting balance: enter your available cash in “My figures”.", "trPont": "In {m}, your cash should have {s} by about {v} ({n} item(s) not measured).", "trHausse": "risen", "trBaisse": "fallen", "eqFaible": "The least productive slot in {m}: {c}, {p} excl. VAT per hour ({n} services).", "eqHeures": "In {m}, you paid {r} hours for every useful hour at the pace you hold.", "eqBudget": "Your team in {m} is {p} covered by what the structure can pay.", "eqRegle": "We compare services, we never single anyone out.", "eqAttente": "Recorded services (hours and revenue) are needed to read your team service by service.", "matCloture": "Last closing ({a} → {b}): {r} actually used, theoretical {t}, to check {x}.", "matTop": "First place to look: {f} ({x}).", "matAttente": "I cannot say where your food cost goes without two complete stock counts: actual food cost cannot be calculated.", "matPertes": "Losses declared in the period: {v}.", "simRes": "If you {q}: estimated impact {v} per year ({m} per month).", "simDet": "{d}", "simHyp": "Default assumptions, to adjust in Decisions > Simulate a decision. A simulation is not a secured gain.", "simNon": "I do not have enough data to simulate this decision.", "sim_fermer": "close {c}", "sim_prix": "raise “{p}” by {h}", "sim_plateforme": "leave your delivery platform", "sim_embaucher": "hire someone at {b} gross per month", "sim_fournisseur": "face a supplier increase of {h}", "sim_fermeture": "close {n} week(s) in {m}", "offRes": "In {m}: discounts {r}, comps {o}, voids {a} — revenue forgone at menu price.", "offNon": "not provided", "offAbsent": "Your till gave me no comps, discounts or voids for {m}. Import the daily export from the “Where the money goes” card.", "argAmort": "Including depreciation −{a} this month: an expense, not cash out (before depreciation: {av})."}, "es": {"k": "Vera · mismas cifras que sus pantallas", "date": "A {d} · {s}.", "srcArgent": "tarjeta «Adónde va el dinero»", "srcTreso": "tarjetas «Del resultado al banco» y «Tesorería a 13 semanas»", "srcEquipe": "módulo Equipo (Salarios)", "srcMatiere": "cierre de materia (Inventario > Análisis)", "srcSim": "simulador (Decisiones)", "srcOff": "invitaciones, descuentos y anulaciones importados de la caja", "demo": "Datos de demostración ficticios.", "argReste": "De cada 100 € de ingresos de {m}, le quedan {v}.", "argManque": "De cada 100 € de ingresos de {m}, le faltan {v}.", "argTop": "Las partidas más grandes: {l}.", "argChange": "Desde {m}: {l} {d} por cada 100 €.", "argAttente": "Se necesita un mes completo de ingresos para decir adónde va el dinero.", "trBas": "Punto bajo previsto de su tesorería: {v}, la semana del {a} al {b}.", "trNeg": "Atención: su tesorería pasaría por debajo de cero la semana del {a} al {b} ({v}).", "trCauses": "Esa semana: {l}.", "trSansSolde": "No puedo prever su tesorería sin saldo inicial: indique su tesorería disponible en «Mis cifras».", "trPont": "En {m}, su tesorería debería haber {s} unos {v} ({n} elemento(s) no medido(s)).", "trHausse": "subido", "trBaisse": "bajado", "eqFaible": "El tramo menos productivo de {m}: {c}, {p} sin IVA por hora ({n} servicios).", "eqHeures": "En {m}, pagó {r} horas por cada hora útil al ritmo que sostiene.", "eqBudget": "Su equipo de {m} está cubierto al {p} por lo que la estructura puede pagar.", "eqRegle": "Se comparan servicios, no se señala a nadie.", "eqAttente": "Se necesitan servicios registrados (horas e ingresos) para leer su equipo servicio a servicio.", "matCloture": "Último cierre ({a} → {b}): {r} realmente consumidos, teórico {t}, a verificar {x}.", "matTop": "Primer lugar donde mirar: {f} ({x}).", "matAttente": "No puedo decir adónde va su materia sin dos inventarios completos: coste de materia real no calculable.", "matPertes": "Pérdidas declaradas en el periodo: {v}.", "simRes": "Si {q}: impacto estimado {v} al año ({m} al mes).", "simDet": "{d}", "simHyp": "Hipótesis por defecto, a ajustar en Decisiones > Simular una decisión. Una simulación no es una ganancia asegurada.", "simNon": "No tengo datos suficientes para simular esta decisión.", "sim_fermer": "cierra {c}", "sim_prix": "sube «{p}» {h}", "sim_plateforme": "deja su plataforma de reparto", "sim_embaucher": "contrata a alguien a {b} brutos al mes", "sim_fournisseur": "sufre una subida de proveedor del {h}", "sim_fermeture": "cierra {n} semana(s) en {m}", "offRes": "En {m}: descuentos {r}, invitaciones {o}, anulaciones {a} — ingresos no percibidos al precio de carta.", "offNon": "no proporcionado", "offAbsent": "Su caja no me dio invitaciones, descuentos ni anulaciones para {m}. Importe la exportación diaria desde la tarjeta «Adónde va el dinero».", "argAmort": "Con amortizaciones −{a} este mes: un gasto, no una salida de dinero (antes de amortizaciones: {av})."}, "it": {"k": "Vera · stessi numeri dei suoi schermi", "date": "Al {d} · {s}.", "srcArgent": "scheda «Dove vanno i soldi»", "srcTreso": "schede «Dal risultato alla banca» e «Cassa a 13 settimane»", "srcEquipe": "modulo Squadra (Stipendi)", "srcMatiere": "chiusura materia (Inventario > Analisi)", "srcSim": "simulatore (Decisioni)", "srcOff": "offerti, sconti e annullamenti importati dalla cassa", "demo": "Dati dimostrativi fittizi.", "argReste": "Su 100 € di ricavi di {m}, le restano {v}.", "argManque": "Su 100 € di ricavi di {m}, le mancano {v}.", "argTop": "Le voci più grandi: {l}.", "argChange": "Da {m}: {l} {d} su 100 €.", "argAttente": "Serve un mese completo di ricavi per dire dove vanno i soldi.", "trBas": "Punto minimo previsto della sua cassa: {v}, nella settimana dal {a} al {b}.", "trNeg": "Attenzione: la sua cassa scenderebbe sotto zero nella settimana dal {a} al {b} ({v}).", "trCauses": "Quella settimana: {l}.", "trSansSolde": "Non posso prevedere la cassa senza saldo iniziale: indichi la cassa disponibile in «I miei numeri».", "trPont": "A {m}, la sua cassa dovrebbe essere {s} di circa {v} ({n} elemento/i non misurato/i).", "trHausse": "aumentata", "trBaisse": "diminuita", "eqFaible": "La fascia meno produttiva di {m}: {c}, {p} IVA esclusa all’ora ({n} servizi).", "eqHeures": "A {m}, ha pagato {r} ore per ogni ora utile al ritmo che sostiene.", "eqBudget": "La sua squadra di {m} è coperta al {p} da ciò che la struttura può pagare.", "eqRegle": "Si confrontano servizi, non si indica nessuno.", "eqAttente": "Servono servizi registrati (ore e ricavi) per leggere la squadra servizio per servizio.", "matCloture": "Ultima chiusura ({a} → {b}): {r} realmente consumati, teorico {t}, da verificare {x}.", "matTop": "Primo posto dove guardare: {f} ({x}).", "matAttente": "Non posso dire dove va la materia senza due inventari completi: costo materia reale non calcolabile.", "matPertes": "Perdite dichiarate nel periodo: {v}.", "simRes": "Se {q}: impatto stimato {v} all’anno ({m} al mese).", "simDet": "{d}", "simHyp": "Ipotesi predefinite, da regolare in Decisioni > Simulare una decisione. Una simulazione non è un guadagno acquisito.", "simNon": "Non ho dati sufficienti per simulare questa decisione.", "sim_fermer": "chiude {c}", "sim_prix": "alza «{p}» di {h}", "sim_plateforme": "lascia la piattaforma di consegna", "sim_embaucher": "assume qualcuno a {b} lordi al mese", "sim_fournisseur": "subisce un aumento fornitore del {h}", "sim_fermeture": "chiude {n} settimana/e a {m}", "offRes": "A {m}: sconti {r}, offerti {o}, annullamenti {a} — mancato incasso al prezzo di carta.", "offNon": "non fornito", "offAbsent": "La cassa non mi ha fornito offerti, sconti né annullamenti per {m}. Importi l’esportazione giornaliera dalla scheda «Dove vanno i soldi».", "argAmort": "Di cui ammortamenti −{a} questo mese: un costo, non un’uscita di cassa (prima degli ammortamenti: {av})."}, "de": {"k": "Vera · dieselben Zahlen wie Ihre Bildschirme", "date": "Stand {d} · {s}.", "srcArgent": "Karte „Wohin das Geld geht“", "srcTreso": "Karten „Vom Ergebnis zum Kontostand“ und „Liquidität auf 13 Wochen“", "srcEquipe": "Team-Modul (Gehälter)", "srcMatiere": "Wareneinsatz-Abschluss (Inventar > Analyse)", "srcSim": "Simulator (Entscheidungen)", "srcOff": "aus der Kasse importierte Hausgaben, Rabatte und Stornos", "demo": "Fiktive Demodaten.", "argReste": "Von 100 € Umsatz im {m} bleiben Ihnen {v}.", "argManque": "Von 100 € Umsatz im {m} fehlen Ihnen {v}.", "argTop": "Größte Posten: {l}.", "argChange": "Seit {m}: {l} {d} je 100 €.", "argAttente": "Ein vollständiger Umsatzmonat ist nötig, um zu sagen, wohin das Geld geht.", "trBas": "Erwarteter Tiefpunkt Ihrer Liquidität: {v}, in der Woche vom {a} bis {b}.", "trNeg": "Achtung: Ihre Liquidität würde in der Woche vom {a} bis {b} unter null fallen ({v}).", "trCauses": "In dieser Woche: {l}.", "trSansSolde": "Ohne Anfangssaldo kann ich Ihre Liquidität nicht vorhersagen: tragen Sie Ihre verfügbare Liquidität unter „Meine Zahlen“ ein.", "trPont": "Im {m} dürfte Ihre Liquidität um etwa {v} {s} sein ({n} Posten nicht gemessen).", "trHausse": "gestiegen", "trBaisse": "gesunken", "eqFaible": "Der am wenigsten produktive Zeitraum im {m}: {c}, {p} netto pro Stunde ({n} Services).", "eqHeures": "Im {m} haben Sie {r} Stunden pro nützlicher Stunde bezahlt, beim gehaltenen Tempo.", "eqBudget": "Ihr Team im {m} ist zu {p} durch das gedeckt, was die Struktur tragen kann.", "eqRegle": "Services werden verglichen, niemand wird benannt.", "eqAttente": "Erfasste Services (Stunden und Umsatz) sind nötig, um Ihr Team Service für Service zu lesen.", "matCloture": "Letzter Abschluss ({a} → {b}): {r} tatsächlich verbraucht, Soll {t}, zu prüfen {x}.", "matTop": "Erster Ort zum Hinschauen: {f} ({x}).", "matAttente": "Ohne zwei vollständige Inventuren kann ich nicht sagen, wohin Ihr Wareneinsatz geht: tatsächlicher Wareneinsatz nicht berechenbar.", "matPertes": "Im Zeitraum erfasste Verluste: {v}.", "simRes": "Wenn Sie {q}: geschätzte Wirkung {v} pro Jahr ({m} pro Monat).", "simDet": "{d}", "simHyp": "Standardannahmen, anpassbar unter Entscheidungen > Eine Entscheidung simulieren. Eine Simulation ist kein gesicherter Gewinn.", "simNon": "Mir fehlen Daten, um diese Entscheidung zu simulieren.", "sim_fermer": "{c} schließen", "sim_prix": "„{p}“ um {h} erhöhen", "sim_plateforme": "Ihre Lieferplattform verlassen", "sim_embaucher": "jemanden zu {b} brutto pro Monat einstellen", "sim_fournisseur": "eine Lieferantenerhöhung von {h} hinnehmen", "sim_fermeture": "{n} Woche(n) im {m} schließen", "offRes": "Im {m}: Rabatte {r}, aufs Haus {o}, Stornos {a} — entgangener Umsatz zum Kartenpreis.", "offNon": "nicht geliefert", "offAbsent": "Ihre Kasse hat mir für {m} weder Hausgaben noch Rabatte noch Stornos geliefert. Importieren Sie den Tagesexport über die Karte „Wohin das Geld geht“.", "argAmort": "Davon Abschreibungen −{a} diesen Monat: Aufwand, kein Geldabfluss (vor Abschreibungen: {av})."}, "nl": {"k": "Vera · dezelfde cijfers als uw schermen", "date": "Op {d} · {s}.", "srcArgent": "kaart „Waar het geld naartoe gaat”", "srcTreso": "kaarten „Van resultaat naar banksaldo” en „Kaspositie op 13 weken”", "srcEquipe": "Teammodule (Lonen)", "srcMatiere": "afsluiting grondstoffen (Inventaris > Analyse)", "srcSim": "simulator (Beslissingen)", "srcOff": "van het huis, kortingen en annuleringen uit de kassa", "demo": "Fictieve demonstratiegegevens.", "argReste": "Van 100 € omzet in {m} houdt u {v} over.", "argManque": "Van 100 € omzet in {m} komt u {v} tekort.", "argTop": "Grootste posten: {l}.", "argChange": "Sinds {m}: {l} {d} per 100 €.", "argAttente": "Er is één volledige omzetmaand nodig om te zeggen waar het geld naartoe gaat.", "trBas": "Verwacht dieptepunt van uw kas: {v}, in de week van {a} tot {b}.", "trNeg": "Let op: uw kas zou onder nul gaan in de week van {a} tot {b} ({v}).", "trCauses": "Die week: {l}.", "trSansSolde": "Zonder beginsaldo kan ik uw kas niet voorspellen: vul uw beschikbare kas in bij „Mijn cijfers”.", "trPont": "In {m} had uw kas met ongeveer {v} moeten {s} ({n} post(en) niet gemeten).", "trHausse": "stijgen", "trBaisse": "dalen", "eqFaible": "Het minst productieve blok in {m}: {c}, {p} excl. btw per uur ({n} diensten).", "eqHeures": "In {m} betaalde u {r} uur per nuttig uur, op het tempo dat u aanhoudt.", "eqBudget": "Uw team in {m} is voor {p} gedekt door wat de structuur kan betalen.", "eqRegle": "We vergelijken diensten, niemand wordt aangewezen.", "eqAttente": "Geregistreerde diensten (uren en omzet) zijn nodig om uw team per dienst te lezen.", "matCloture": "Laatste afsluiting ({a} → {b}): {r} werkelijk verbruikt, theoretisch {t}, te controleren {x}.", "matTop": "Eerste plek om te kijken: {f} ({x}).", "matAttente": "Zonder twee volledige inventarissen kan ik niet zeggen waar uw grondstoffen heen gaan: werkelijke grondstofkost niet berekenbaar.", "matPertes": "Geregistreerde verliezen in de periode: {v}.", "simRes": "Als u {q}: geschat effect {v} per jaar ({m} per maand).", "simDet": "{d}", "simHyp": "Standaardaannames, aan te passen in Beslissingen > Een beslissing simuleren. Een simulatie is geen verworven winst.", "simNon": "Ik heb niet genoeg gegevens om deze beslissing te simuleren.", "sim_fermer": "{c} sluit", "sim_prix": "„{p}” met {h} verhoogt", "sim_plateforme": "uw bezorgplatform verlaat", "sim_embaucher": "iemand aanneemt aan {b} bruto per maand", "sim_fournisseur": "een leveranciersstijging van {h} krijgt", "sim_fermeture": "{n} week/weken sluit in {m}", "offRes": "In {m}: kortingen {r}, van het huis {o}, annuleringen {a} — gederfde omzet tegen kaartprijs.", "offNon": "niet geleverd", "offAbsent": "Uw kassa gaf me voor {m} geen gratis items, kortingen of annuleringen. Importeer de dagexport via de kaart „Waar het geld naartoe gaat”.", "argAmort": "Waarvan afschrijvingen −{a} deze maand: een kost, geen geldstroom (vóór afschrijvingen: {av})."}, "pt": {"k": "Vera · os mesmos números dos seus ecrãs", "date": "A {d} · {s}.", "srcArgent": "cartão «Para onde vai o dinheiro»", "srcTreso": "cartões «Do resultado ao banco» e «Tesouraria a 13 semanas»", "srcEquipe": "módulo Equipa (Salários)", "srcMatiere": "fecho de matéria (Inventário > Análise)", "srcSim": "simulador (Decisões)", "srcOff": "ofertas, descontos e anulações importados da caixa", "demo": "Dados de demonstração fictícios.", "argReste": "Em cada 100 € de receita de {m}, ficam-lhe {v}.", "argManque": "Em cada 100 € de receita de {m}, faltam-lhe {v}.", "argTop": "As maiores rubricas: {l}.", "argChange": "Desde {m}: {l} {d} por cada 100 €.", "argAttente": "É necessário um mês completo de receita para dizer para onde vai o dinheiro.", "trBas": "Ponto baixo previsto da sua tesouraria: {v}, na semana de {a} a {b}.", "trNeg": "Atenção: a sua tesouraria passaria abaixo de zero na semana de {a} a {b} ({v}).", "trCauses": "Nessa semana: {l}.", "trSansSolde": "Não posso prever a sua tesouraria sem saldo inicial: indique a tesouraria disponível em «Os meus números».", "trPont": "Em {m}, a sua tesouraria deverá ter {s} cerca de {v} ({n} elemento(s) não medido(s)).", "trHausse": "subido", "trBaisse": "descido", "eqFaible": "O período menos produtivo de {m}: {c}, {p} sem IVA por hora ({n} serviços).", "eqHeures": "Em {m}, pagou {r} horas por cada hora útil ao ritmo que sustenta.", "eqBudget": "A sua equipa de {m} está coberta a {p} pelo que a estrutura pode pagar.", "eqRegle": "Comparam-se serviços, não se aponta ninguém.", "eqAttente": "São necessários serviços registados (horas e receita) para ler a equipa serviço a serviço.", "matCloture": "Último fecho ({a} → {b}): {r} realmente consumidos, teórico {t}, a verificar {x}.", "matTop": "Primeiro sítio onde olhar: {f} ({x}).", "matAttente": "Não posso dizer para onde vai a sua matéria sem dois inventários completos: custo de matéria real não calculável.", "matPertes": "Perdas declaradas no período: {v}.", "simRes": "Se {q}: impacto estimado {v} por ano ({m} por mês).", "simDet": "{d}", "simHyp": "Hipóteses por defeito, a ajustar em Decisões > Simular uma decisão. Uma simulação não é um ganho garantido.", "simNon": "Não tenho dados suficientes para simular esta decisão.", "sim_fermer": "fechar {c}", "sim_prix": "subir «{p}» {h}", "sim_plateforme": "sair da plataforma de entregas", "sim_embaucher": "contratar alguém a {b} brutos por mês", "sim_fournisseur": "sofrer um aumento do fornecedor de {h}", "sim_fermeture": "fechar {n} semana(s) em {m}", "offRes": "Em {m}: descontos {r}, ofertas {o}, anulações {a} — receita perdida ao preço da carta.", "offNon": "não fornecido", "offAbsent": "A sua caixa não me deu ofertas, descontos nem anulações para {m}. Importe a exportação diária a partir do cartão «Para onde vai o dinheiro».", "argAmort": "Dos quais amortizações −{a} este mês: um custo, não uma saída de dinheiro (antes de amortizações: {av})."}};
  function vvC(){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}return VV_COPY[l]||VV_COPY.fr;}
  function vvNorm(q){return String(q||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/’/g,"'");}
  var VV_RULES=[
    {k:'sim',re:/((^|[\s,.;!?¿])(et si|what if|y si|e se|was wa?e?re wenn|wat als|e se eu)\b|si (je |j')(ferme|monte|augmente|embauche|recrute|retire|quitte|arrete)|if i (close|raise|hire|leave|drop)|wenn ich (schliesse|erhohe|einstelle)|simul)/},
    {k:'tresorerie',re:/(tresorerie|tresor|point bas|13 semaines|compte (en banque|bancaire|vide)|ma banque|cash|bank balance|tesoreria|liquidit|kassa|kaspositie|tesouraria|banco)/},
    {k:'argent',re:/(ou part (mon |l'|l )?argent|il me reste combien|combien il me reste|where (does|is) (the|my) money|a donde va (el|mi) dinero|adonde va|dove vanno i (miei )?soldi|wohin geht (das|mein) geld|waar gaat (het|mijn) geld|para onde vai o dinheiro)/},
    {k:'offerts',re:/(offert|remise|annulation|gratuit|discount|comps?\b|voids?\b|descuento|invitacion|anulacion|sconti|omagg|annullament|rabatt|storno|korting|annulering|desconto|oferta|anulac)/},
    {k:'matiere',re:/(cloture|ecart (de )?matiere|pertes?|gaspill|inventaire|ou part (ma|la) matiere|stock count|food cost variance|waste|desperdicio|merma|spreco|perdite|verlust|inventur|verspilling|desperdicio|perdas)/},
    {k:'equipe',re:/(service le (moins|plus)|quel service|creneau|heures? en trop|heures payees|equipe (trop|assez|large)|least productive|which service|busiest service|servicio menos|turno menos|servizio meno|unproduktivst|am wenigsten produktiv|minst productief|servico menos|serviço menos)/}];
  function vvIntention(q){var n=vvNorm(q);for(var i=0;i<VV_RULES.length;i++)if(VV_RULES[i].re.test(n))return VV_RULES[i].k;return null;}
  function vvDateTxt(){try{var k=root.verdictOperationalClock().key.slice(0,10),p=k.split('-');return new Intl.DateTimeFormat(vmTag(),{day:'numeric',month:'long',year:'numeric'}).format(new Date(+p[0],+p[1]-1,+p[2],12));}catch(e){return '';}}
  function vvDemo(){try{return !!((root.DB&&root.DB.services||[]).some(function(s){return s&&(s.fictional||s.demo);})||(typeof root.VERDICT_DEMO_SESSION!=='undefined'&&root.VERDICT_DEMO_SESSION));}catch(e){return false;}}
  function vvDernierMois(){var d=vmMoisDispo();return d.length?d[d.length-1]:null;}
  function vvArgent(C){
    var M=null;try{M=root.VerdictTeam&&root.VerdictTeam.model();}catch(e){}
    var dispo=vmMoisDispo(M),i=dispo.length?dispo[dispo.length-1]:null;
    if(i==null)return {l:[C.argAttente],s:C.srcArgent};
    var ec=vmEcart(),B=vmBreakdown(vmEntrees(i,ec,M)),j=dispo.length>1?dispo[dispo.length-2]:null,P=j!=null?vmBreakdown(vmEntrees(j,ec,M)):null,MC=vmC();
    var L=[vmF(B.reste<0?C.argManque:C.argReste,{m:vmMois(i),v:vmEur(Math.abs(B.pour100Reste),2)})];
    var top=B.lignes.filter(function(x){return x.k!=='resultat'&&vmNum(x.pour100);}).sort(function(a,b){return b.pour100-a.pour100;}).slice(0,3);
    L.push(vmF(C.argTop,{l:top.map(function(x){return vmLabel(MC,x)+' '+vmEur(x.pour100,2);}).join(', ')}));
    var _va=B.lignes.filter(function(x){return x.k==='amortissements';})[0];if(_va)L.push(vmF(C.argAmort,{a:vmEur(_va.eur),av:vmEur(B.reste+_va.eur)}));
    vmChangements(B,P).slice(0,1).forEach(function(c){L.push(vmF(C.argChange,{m:vmMois(j),l:vmLabel(MC,{k:c.k,mesure:true,eur:1}),d:(c.delta>0?'+':'\u2212')+vmEur(Math.abs(c.delta),2)}));});
    return {l:L,s:C.srcArgent,data:{mois:i,pour100Reste:B.pour100Reste}};
  }
  function vvTreso(C){
    var E=vfEntrees();if(!E)return {l:[C.trSansSolde],s:C.srcTreso};var R=vfPlanning(E),FC=vfC(),cr=R.semaineCritique;
    var L=[vmF(R.pointBas<0?C.trNeg:C.trBas,{v:vmEur(R.pointBas),a:vfJourTxt(cr.debut),b:vfJourTxt(cr.fin).replace(/\.$/,'')})];
    if(R.causes.length)L.push(vmF(C.trCauses,{l:R.causes.map(function(x){return (FC['k_'+x.k]||x.k)+' '+vmEur(Math.abs(x.v));}).join(', ')}));
    var i=vvDernierMois();if(i!=null){var B=vmBreakdown(vmEntrees(i,vmEcart())),V=vbBridge(vbEntrees(i,B));if(V.ok)L.push(vmF(C.trPont,{m:vmMois(i),s:V.variation<0?C.trBaisse:C.trHausse,v:vmEur(Math.abs(V.variation)),n:V.nonMesurees.length}));}
    return {l:L,s:C.srcTreso,data:{pointBas:R.pointBas}};
  }
  function vvEquipe(C){
    var M=null;try{M=root.VerdictTeam.model();}catch(e){}var i=vvDernierMois();if(!M||i==null)return {l:[C.eqAttente],s:C.srcEquipe};
    var ym=M.year+'-'+('0'+(i+1)).slice(-2),S=vtSlotsMonth((root.DB&&root.DB.services)||[],ym,M.tva),TC=vtC();if(!S.length)return {l:[C.eqAttente],s:C.srcEquipe};
    var G=S[0],wd='';try{wd=new Intl.DateTimeFormat(vtTag(),{weekday:'long'}).format(new Date(2024,0,7+G.wd,12));}catch(e){}
    var L=[vmF(C.eqFaible,{m:vmMois(i),c:wd+' · '+vtSlotLabel(TC,G.slot,G.label),p:vtEur2(G.prod),n:G.n})],m=M.months[i];
    if(m&&vtNum(m.ratioHours))L.push(vmF(C.eqHeures,{m:vmMois(i),r:vtN(m.ratioHours,2)}));
    if(m&&vtNum(m.coverage))L.push(vmF(C.eqBudget,{m:vmMois(i),p:vtPct(m.coverage)}));
    L.push(C.eqRegle);return {l:L,s:C.srcEquipe,data:{slot:G.wd+'|'+G.slot,prod:G.prod}};
  }
  function vvMatiere(C){
    var R=null;try{R=root.verdictMatiereDepuisInventaire();}catch(e){}if(!R||!R.statutGlobal||!R.produits)return {l:[C.matAttente],s:C.srcMatiere};
    var K=root.VerdictCloture.cloture(R,R.coutsBase||{},root.VerdictCloture.groupes('four'),root.VerdictCloture.caHT(R.debutISO,R.finISO));if(K.statut!=='ok')return {l:[C.matAttente],s:C.srcMatiere};
    var L=[vmF(C.matCloture,{a:vmJour(R.debutISO),b:vmJour(R.finISO),r:vmEur(K.reel),t:vmEur(K.theorique),x:vmEur(K.aVerifier)})];
    if(K.groupesTries&&K.groupesTries.length&&K.groupesTries[0].aVerifier>0)L.push(vmF(C.matTop,{f:K.groupesTries[0].nom,x:vmEur(K.groupesTries[0].aVerifier)}));
    if(K.explique>0)L.push(vmF(C.matPertes,{v:vmEur(K.explique)}));
    return {l:L,s:C.srcMatiere,data:{aVerifier:K.aVerifier}};
  }
  var VV_JOURS={lundi:1,monday:1,lunes:1,lunedi:1,montag:1,maandag:1,segunda:1,mardi:2,tuesday:2,martes:2,martedi:2,dienstag:2,dinsdag:2,terca:2,mercredi:3,wednesday:3,miercoles:3,mercoledi:3,mittwoch:3,woensdag:3,quarta:3,jeudi:4,thursday:4,jueves:4,giovedi:4,donnerstag:4,donderdag:4,quinta:4,vendredi:5,friday:5,viernes:5,venerdi:5,freitag:5,vrijdag:5,sexta:5,samedi:6,saturday:6,sabado:6,sabato:6,samstag:6,zaterdag:6,dimanche:0,sunday:0,domingo:0,domenica:0,sonntag:0,zondag:0};
  function vvSimulation(C,q){
    var n=vvNorm(q),sc=/(plateforme|platform|deliveroo|uber|just ?eat|plataforma|piattaforma|plattform|platform)/.test(n)?'plateforme':/(fournisseur|supplier|proveedor|fornitore|lieferant|leverancier|fornecedor)/.test(n)?'fournisseur':/(embauch|recrut|hire|contrat|assum|einstell|aanneem|aannemen|contrata)/.test(n)?'embaucher':/(semaine|week|semana|settiman|woche)/.test(n)?'fermeture':/(prix|price|precio|prezzo|preis|prijs|preco|augmente|monte|raise|subo|alzo|erhoh|verhoog|subir)/.test(n)?'prix':'fermer';
    var save=vsState.sc,saved=JSON.parse(JSON.stringify(vsState.v));vsState.sc=sc;
    var d=root.moteur().d,SC=Object.assign({},vtC(),vsC()),qtxt='';
    if(sc==='fermer'){var K=vsCreneaux(d),wd=null,slot=null;Object.keys(VV_JOURS).forEach(function(w){if(new RegExp('\\b'+w+'\\b').test(n))wd=VV_JOURS[w];});
      slot=/(apres-midi|apres midi|afternoon|tarde|pomeriggio|nachmittag|middag)/.test(n)?'afternoon':/(midi|lunch|mediodia|pranzo|mittag|almoco)/.test(n)?'lunch':/(soir|dinner|noche|cena|abend|diner|jantar)/.test(n)?'dinner':/(petit dej|breakfast|desayuno|colazione|fruhstuck|ontbijt)/.test(n)?'breakfast':null;
      if(K&&wd!=null){var id=slot?wd+'|'+slot:wd+'|*';if(K.creneaux.concat(K.jours).some(function(c){return c.id===id;}))vsState.v['fermer:creneau']=id;}
      var cid=vsState.v['fermer:creneau']||(K&&K.creneaux[0]&&K.creneaux[0].id),cc=K?K.creneaux.concat(K.jours).filter(function(c){return c.id===cid;})[0]:null;
      if(cc)qtxt=vmF(C.sim_fermer,{c:vsWd(cc.wd)+' · '+(cc.slot==='*'?SC.jourEntier:(SC['slot_'+cc.slot]||cc.slot))});}
    var pm=n.match(/(\d+(?:[.,]\d+)?)\s*(?:€|eur|euros?)/),pc=n.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if(sc==='prix'){if(pm)vsState.v['prix:hausse']=pm[1].replace(',','.');var P=((root.DB&&root.DB.plats)||[]).filter(function(p){return p&&p.vol>0&&p.ttc>0;});var pi=0;P.forEach(function(p,ix){if(n.indexOf(vvNorm(p.nom))>=0)pi=ix;});vsState.v['prix:plat']=String(pi);if(P[pi])qtxt=vmF(C.sim_prix,{p:P[pi].nom,h:vmEur(Number(vsState.v['prix:hausse']||0.5),2)});}
    if(sc==='fournisseur'){if(pc)vsState.v['fournisseur:hausse']=pc[1].replace(',','.');qtxt=vmF(C.sim_fournisseur,{h:(vsState.v['fournisseur:hausse']||8)+'\u00a0%'});}
    if(sc==='plateforme')qtxt=C.sim_plateforme;
    if(sc==='embaucher'){var bm=d.saln>0?Math.round(d.salb/d.saln):2000;if(pm)vsState.v['embaucher:brut']=pm[1].replace(',','.');qtxt=vmF(C.sim_embaucher,{b:vmEur(Number(vsState.v['embaucher:brut']||bm))});}
    if(sc==='fermeture'){var nw=n.match(/(\d+)\s*(semaine|week|semana|settiman|woche|weken)/);if(nw)vsState.v['fermeture:semaines']=nw[1];var mi=Number(vsState.v['fermeture:mois']!=null?vsState.v['fermeture:mois']:(Number(root.verdictOperationalClock().key.slice(5,7)))%12);qtxt=vmF(C.sim_fermeture,{n:vsState.v['fermeture:semaines']||2,m:vtMonth(mi)});}
    var X=vsCompute(SC,d);vsState.sc=save;vsState.v=saved;
    if(!X.R||!X.R.ok)return {l:[C.simNon],s:C.srcSim};
    return {l:[vmF(C.simRes,{q:qtxt,v:(X.R.annuel>=0?'+':'')+vmEur(X.R.annuel),m:(X.R.mensuel>=0?'+':'')+vmEur(X.R.mensuel)}),X.det,C.simHyp].filter(Boolean),s:C.srcSim,data:{sc:sc,annuel:X.R.annuel}};
  }
  function vvOfferts(C){
    var i=vvDernierMois();if(i==null)return {l:[C.argAttente],s:C.srcOff};var S=vcaMois((root.DB&&root.DB.caisseAjust)||[],vmYm(i));
    if(!S.fourni)return {l:[vmF(C.offAbsent,{m:vmMois(i)})],s:C.srcOff};
    var f=function(v){return v==null?C.offNon:vmEur(v);};return {l:[vmF(C.offRes,{m:vmMois(i),r:f(S.remises),o:f(S.offerts),a:f(S.annulations)})],s:C.srcOff,data:{total:S.total}};
  }
  function vvRepondre(q){
    var k=vvIntention(q);if(!k)return null;var C=vvC(),R=null;
    try{R=k==='argent'?vvArgent(C):k==='tresorerie'?vvTreso(C):k==='equipe'?vvEquipe(C):k==='matiere'?vvMatiere(C):k==='sim'?vvSimulation(C,q):vvOfferts(C);}catch(e){return null;}
    if(!R)return null;R.k=k;R.date=vmF(C.date,{d:vvDateTxt(),s:R.s});R.demo=vvDemo()?C.demo:null;return R;
  }
  function vvRender(box,R){var C=vvC();box.className='v-answer on';box.setAttribute('data-vv',R.k);
    box.innerHTML='<span class="v-answer-k">'+aideEsc(C.k)+'</span>'+R.l.map(function(l,i){return i?'<div class="v-answer-row">'+aideEsc(l)+'</div>':'<b>'+aideEsc(l)+'</b>';}).join('')+(R.date?'<div class="v-answer-row" style="opacity:.75;font-size:.9em">'+aideEsc(R.date)+(R.demo?' '+aideEsc(R.demo):'')+'</div>':'');}
  function vvWrap(){var f=root.veraReponseLocale;if(typeof f!=='function'||f.__vv)return;
    var w=function(question){var box=root.document.getElementById('veraReponse');var R=box?vvRepondre(question):null;if(R){vvRender(box,R);return;}if(box)box.removeAttribute('data-vv');return f.apply(this,arguments);};w.__vv=true;root.veraReponseLocale=w;}
  vvWrap();root.setInterval(vvWrap,1500);
  root.VerdictVeraP10={version:'P10',intention:vvIntention,repondre:vvRepondre};
  /* ═══ fin P10 ═══ */
  /* ═══ P11 — OFFRE APPLIQUÉE (validée le 5 octobre 2026) ═══════════════════════
     Inventaire 0 € · Pilotage 69 €/690 € · Pro 129 €/1 290 € (HT) · établissement en plus +39 € (Pilotage) / +69 € (Pro)
     Essai 14 jours Pro complet sans carte · fin d'essai : rien supprimé, analyses figées et datées
     Fondateurs (50) : Pro 69 €/690 € la 1re année puis 99 €/990 € tant que l'abonnement reste actif ; établissement en plus +69 € ; prix jamais augmenté par une mise à jour (décision Steven 12/10/2026).
     Le niveau vient du serveur (TIER) ; démonstration et accès public ouvert = Pro. Un réglage de test
     (__verdictNiveauMax) ne peut que BAISSER le niveau, jamais ouvrir l'interface payante. */
  var VO_COPY={"fr": {"proK": "Verdict Pro", "proT": "Où part l’argent, trésorerie, clôture matière, coût par service, simulateur : avec Pro.", "proBtn": "Voir les offres", "fige": "Dernière lecture Pro, figée au {d} : {l}.", "figeArgent": "il restait {v} sur 100 €", "figeTreso": "point bas prévu {v}", "figeMat": "{v} d’écart matière à vérifier", "figeSvc": "créneau le plus fragile : {v}", "lockEquipeJour": "Détail par jour et par service (capacité, comparaison) : avec Pro.", "lockMatiere": "Bilan des produits, écarts et pertes : avec Pro. Le comptage reste gratuit.", "lockSim": "Simuler une décision (6 décisions) : avec Pro.", "grilleK": "Les offres Verdict", "gratuitN": "Inventaire", "gratuitP": "0 €", "gratuitD": "Compter, valoriser, commander. Gratuit, sans limite de durée.", "pilotageN": "Pilotage", "pilotageP": "69 € HT/mois · 690 € HT/an", "pilotageD": "Où j’en suis : jour, mois, année, structure, point mort, carte, équipe à l’année et au mois.", "proN": "Pro", "proP": "129 € HT/mois · 1 290 € HT/an", "proD": "Où part l’argent et quoi changer : bilan des produits, pertes, achats, coût par service, compte en banque à 3 mois, simulateur, Vera (l’assistante) partout.", "extra": "Établissement supplémentaire : +39 € HT/mois ou +390 € HT/an en Pilotage, +69 € HT/mois ou +690 € HT/an en Pro.", "fondateurs": "50 premiers clients (fondateurs) : Pro à 69 € HT/mois ou 690 € HT/an la première année, puis 99 € HT/mois ou 990 € HT/an tant que l’abonnement reste actif. Établissement en plus : +69 € HT/mois. Les mises à jour de Verdict n’augmentent jamais ce prix.", "essai": "Essai : 14 jours Pro complet, sans carte. Ensuite, rien n’est supprimé : vous revenez à l’Inventaire gratuit et vos données restent à vous.", "actuel": "Votre niveau actuel : {n}.", "finEssaiK": "Votre essai Pro est terminé", "finEssaiT": "Vos données restent à vous. Votre Inventaire continue gratuitement.", "finEssaiFige": "Ces analyses sont figées au {d} ; elles se remettent à jour avec Pilotage ou Pro."}, "en": {"proK": "Verdict Pro", "proT": "Where the money goes, cash, food cost closing, cost per service, simulator: with Pro.", "proBtn": "See the plans", "fige": "Last Pro reading, frozen on {d}: {l}.", "figeArgent": "{v} left per €100", "figeTreso": "expected low point {v}", "figeMat": "{v} of food cost variance to check", "figeSvc": "most fragile slot: {v}", "lockEquipeJour": "Day-by-day and per-service detail (capacity, comparison): with Pro.", "lockMatiere": "Food cost closing, variances and waste log: with Pro. Counting stays free.", "lockSim": "Simulate a decision (6 decisions): with Pro.", "grilleK": "Verdict plans", "gratuitN": "Inventory", "gratuitP": "€0", "gratuitD": "Count, value, order. Free, no time limit.", "pilotageN": "Pilotage", "pilotageP": "€69/month · €690/year excl. VAT", "pilotageD": "Where I stand: day, month, year, structure, break-even, menu, team by year and month.", "proN": "Pro", "proP": "€129/month · €1,290/year excl. VAT", "proD": "Where the money goes and what to change: food cost closing, waste, purchases, cost per service, cash, 13 weeks, simulator, Vera on everything.", "extra": "Additional business: +€39/month or +€390/year on Pilotage, +€69/month or +€690/year on Pro (excl. VAT).", "fondateurs": "First 50 businesses (founders): Pro at €69/month or €690/year for the first year, then €99/month or €990/year as long as the subscription stays active (excl. VAT). Additional business: +€69/month. Verdict updates never raise this price.", "essai": "Trial: 14 days of full Pro, no card. Afterwards nothing is deleted: you go back to the free Inventory and your data stays yours.", "actuel": "Your current level: {n}.", "finEssaiK": "Your Pro trial has ended", "finEssaiT": "Your data stays yours. Your Inventory continues for free.", "finEssaiFige": "These analyses are frozen on {d}; they update again with Pilotage or Pro."}, "es": {"proK": "Verdict Pro", "proT": "Adónde va el dinero, tesorería, cierre de materia, coste por servicio, simulador: con Pro.", "proBtn": "Ver las ofertas", "fige": "Última lectura Pro, fijada el {d}: {l}.", "figeArgent": "quedaban {v} de cada 100 €", "figeTreso": "punto bajo previsto {v}", "figeMat": "{v} de desviación de materia a verificar", "figeSvc": "tramo más frágil: {v}", "lockEquipeJour": "Detalle por día y por servicio (capacidad, comparación): con Pro.", "lockMatiere": "Cierre de materia, desviaciones y registro de pérdidas: con Pro. El recuento sigue gratis.", "lockSim": "Simular una decisión (6 decisiones): con Pro.", "grilleK": "Las ofertas Verdict", "gratuitN": "Inventario", "gratuitP": "0 €", "gratuitD": "Contar, valorar, pedir. Gratis, sin límite de tiempo.", "pilotageN": "Pilotage", "pilotageP": "69 €/mes · 690 €/año sin IVA", "pilotageD": "Dónde estoy: día, mes, año, estructura, punto de equilibrio, carta, equipo por año y mes.", "proN": "Pro", "proP": "129 €/mes · 1290 €/año sin IVA", "proD": "Adónde va el dinero y qué cambiar: cierre de materia, pérdidas, compras, coste por servicio, tesorería, 13 semanas, simulador, Vera sobre todo.", "extra": "Establecimiento adicional: +39 €/mes o +390 €/año en Pilotage, +69 €/mes o +690 €/año en Pro (sin IVA).", "fondateurs": "Primeros 50 establecimientos (fundadores): Pro a 69 €/mes o 690 €/año el primer año, luego 99 €/mes o 990 €/año mientras la suscripción siga activa (sin IVA). Establecimiento adicional: +69 €/mes. Las actualizaciones de Verdict nunca suben este precio.", "essai": "Prueba: 14 días de Pro completo, sin tarjeta. Después no se borra nada: vuelve al Inventario gratuito y sus datos siguen siendo suyos.", "actuel": "Su nivel actual: {n}.", "finEssaiK": "Su prueba Pro ha terminado", "finEssaiT": "Sus datos siguen siendo suyos. Su Inventario continúa gratis.", "finEssaiFige": "Estos análisis están fijados el {d}; se actualizan de nuevo con Pilotage o Pro."}, "it": {"proK": "Verdict Pro", "proT": "Dove vanno i soldi, cassa, chiusura materia, costo per servizio, simulatore: con Pro.", "proBtn": "Vedere le offerte", "fige": "Ultima lettura Pro, ferma al {d}: {l}.", "figeArgent": "restavano {v} ogni 100 €", "figeTreso": "punto minimo previsto {v}", "figeMat": "{v} di scostamento materia da verificare", "figeSvc": "fascia più fragile: {v}", "lockEquipeJour": "Dettaglio per giorno e per servizio (capacità, confronto): con Pro.", "lockMatiere": "Chiusura materia, scostamenti e registro delle perdite: con Pro. Il conteggio resta gratuito.", "lockSim": "Simulare una decisione (6 decisioni): con Pro.", "grilleK": "Le offerte Verdict", "gratuitN": "Inventario", "gratuitP": "0 €", "gratuitD": "Contare, valorizzare, ordinare. Gratis, senza limiti di tempo.", "pilotageN": "Pilotage", "pilotageP": "69 €/mese · 690 €/anno IVA esclusa", "pilotageD": "Dove sono: giorno, mese, anno, struttura, punto di pareggio, carta, squadra per anno e mese.", "proN": "Pro", "proP": "129 €/mese · 1.290 €/anno IVA esclusa", "proD": "Dove vanno i soldi e cosa cambiare: chiusura materia, perdite, acquisti, costo per servizio, cassa, 13 settimane, simulatore, Vera su tutto.", "extra": "Attività aggiuntiva: +39 €/mese o +390 €/anno in Pilotage, +69 €/mese o +690 €/anno in Pro (IVA esclusa).", "fondateurs": "Prime 50 attività (fondatori): Pro a 69 €/mese o 690 €/anno il primo anno, poi 99 €/mese o 990 €/anno finché l’abbonamento resta attivo (IVA esclusa). Attività aggiuntiva: +69 €/mese. Gli aggiornamenti di Verdict non aumentano mai questo prezzo.", "essai": "Prova: 14 giorni di Pro completo, senza carta. Poi nulla viene cancellato: torna all’Inventario gratuito e i dati restano suoi.", "actuel": "Il suo livello attuale: {n}.", "finEssaiK": "La sua prova Pro è terminata", "finEssaiT": "I suoi dati restano suoi. L’Inventario continua gratis.", "finEssaiFige": "Queste analisi sono ferme al {d}; si aggiornano di nuovo con Pilotage o Pro."}, "de": {"proK": "Verdict Pro", "proT": "Wohin das Geld geht, Liquidität, Wareneinsatz-Abschluss, Kosten je Service, Simulator: mit Pro.", "proBtn": "Angebote ansehen", "fige": "Letzte Pro-Lesung, eingefroren am {d}: {l}.", "figeArgent": "es blieben {v} je 100 €", "figeTreso": "erwarteter Tiefpunkt {v}", "figeMat": "{v} zu prüfende Wareneinsatz-Abweichung", "figeSvc": "schwächster Zeitraum: {v}", "lockEquipeJour": "Detail je Tag und Service (Kapazität, Vergleich): mit Pro.", "lockMatiere": "Wareneinsatz-Abschluss, Abweichungen und Verlustjournal: mit Pro. Das Zählen bleibt kostenlos.", "lockSim": "Eine Entscheidung simulieren (6 Entscheidungen): mit Pro.", "grilleK": "Die Verdict-Angebote", "gratuitN": "Inventar", "gratuitP": "0 €", "gratuitD": "Zählen, bewerten, bestellen. Kostenlos, ohne Zeitlimit.", "pilotageN": "Pilotage", "pilotageP": "69 €/Monat · 690 €/Jahr zzgl. MwSt.", "pilotageD": "Wo ich stehe: Tag, Monat, Jahr, Struktur, Break-even, Karte, Team nach Jahr und Monat.", "proN": "Pro", "proP": "129 €/Monat · 1.290 €/Jahr zzgl. MwSt.", "proD": "Wohin das Geld geht und was zu ändern ist: Wareneinsatz-Abschluss, Verluste, Einkäufe, Kosten je Service, Liquidität, 13 Wochen, Simulator, Vera zu allem.", "extra": "Zusätzlicher Betrieb: +39 €/Monat oder +390 €/Jahr mit Pilotage, +69 €/Monat oder +690 €/Jahr mit Pro (zzgl. MwSt.).", "fondateurs": "Die ersten 50 Betriebe (Gründer): Pro für 69 €/Monat oder 690 €/Jahr im ersten Jahr, danach 99 €/Monat oder 990 €/Jahr, solange das Abo aktiv bleibt (zzgl. MwSt.). Weiterer Betrieb: +69 €/Monat. Updates von Verdict erhöhen diesen Preis nie.", "essai": "Test: 14 Tage Pro komplett, ohne Karte. Danach wird nichts gelöscht: Sie kehren zum kostenlosen Inventar zurück, Ihre Daten bleiben Ihre.", "actuel": "Ihre aktuelle Stufe: {n}.", "finEssaiK": "Ihr Pro-Test ist beendet", "finEssaiT": "Ihre Daten bleiben Ihre. Ihr Inventar läuft kostenlos weiter.", "finEssaiFige": "Diese Analysen sind am {d} eingefroren; mit Pilotage oder Pro werden sie wieder aktualisiert."}, "nl": {"proK": "Verdict Pro", "proT": "Waar het geld naartoe gaat, kas, afsluiting grondstoffen, kost per dienst, simulator: met Pro.", "proBtn": "Bekijk de aanbiedingen", "fige": "Laatste Pro-lezing, bevroren op {d}: {l}.", "figeArgent": "er bleef {v} over per 100 €", "figeTreso": "verwacht dieptepunt {v}", "figeMat": "{v} grondstofafwijking te controleren", "figeSvc": "zwakste blok: {v}", "lockEquipeJour": "Detail per dag en per dienst (capaciteit, vergelijking): met Pro.", "lockMatiere": "Afsluiting grondstoffen, afwijkingen en verliesregister: met Pro. Tellen blijft gratis.", "lockSim": "Een beslissing simuleren (6 beslissingen): met Pro.", "grilleK": "De Verdict-aanbiedingen", "gratuitN": "Inventaris", "gratuitP": "€ 0", "gratuitD": "Tellen, waarderen, bestellen. Gratis, zonder tijdslimiet.", "pilotageN": "Pilotage", "pilotageP": "€ 69/maand · € 690/jaar excl. btw", "pilotageD": "Waar ik sta: dag, maand, jaar, structuur, break-even, kaart, team per jaar en maand.", "proN": "Pro", "proP": "€ 129/maand · € 1.290/jaar excl. btw", "proD": "Waar het geld naartoe gaat en wat te veranderen: afsluiting grondstoffen, verliezen, aankopen, kost per dienst, kas, 13 weken, simulator, Vera over alles.", "extra": "Extra vestiging: +€ 39/maand of +€ 390/jaar met Pilotage, +€ 69/maand of +€ 690/jaar met Pro (excl. btw).", "fondateurs": "Eerste 50 vestigingen (oprichters): Pro aan € 69/maand of € 690/jaar het eerste jaar, daarna € 99/maand of € 990/jaar zolang het abonnement actief blijft (excl. btw). Extra vestiging: +€ 69/maand. Updates van Verdict verhogen deze prijs nooit.", "essai": "Proef: 14 dagen volledige Pro, zonder kaart. Daarna wordt niets gewist: u gaat terug naar de gratis Inventaris en uw gegevens blijven van u.", "actuel": "Uw huidige niveau: {n}.", "finEssaiK": "Uw Pro-proef is afgelopen", "finEssaiT": "Uw gegevens blijven van u. Uw Inventaris gaat gratis door.", "finEssaiFige": "Deze analyses zijn bevroren op {d}; ze worden weer bijgewerkt met Pilotage of Pro."}, "pt": {"proK": "Verdict Pro", "proT": "Para onde vai o dinheiro, tesouraria, fecho de matéria, custo por serviço, simulador: com Pro.", "proBtn": "Ver as ofertas", "fige": "Última leitura Pro, fixada a {d}: {l}.", "figeArgent": "ficavam {v} em cada 100 €", "figeTreso": "ponto baixo previsto {v}", "figeMat": "{v} de desvio de matéria a verificar", "figeSvc": "período mais frágil: {v}", "lockEquipeJour": "Detalhe por dia e por serviço (capacidade, comparação): com Pro.", "lockMatiere": "Fecho de matéria, desvios e registo de perdas: com Pro. A contagem continua gratuita.", "lockSim": "Simular uma decisão (6 decisões): com Pro.", "grilleK": "As ofertas Verdict", "gratuitN": "Inventário", "gratuitP": "0 €", "gratuitD": "Contar, valorizar, encomendar. Grátis, sem limite de tempo.", "pilotageN": "Pilotage", "pilotageP": "69 €/mês · 690 €/ano sem IVA", "pilotageD": "Onde estou: dia, mês, ano, estrutura, ponto de equilíbrio, carta, equipa por ano e mês.", "proN": "Pro", "proP": "129 €/mês · 1290 €/ano sem IVA", "proD": "Para onde vai o dinheiro e o que mudar: fecho de matéria, perdas, compras, custo por serviço, tesouraria, 13 semanas, simulador, Vera sobre tudo.", "extra": "Estabelecimento adicional: +39 €/mês ou +390 €/ano no Pilotage, +69 €/mês ou +690 €/ano no Pro (sem IVA).", "fondateurs": "Primeiros 50 estabelecimentos (fundadores): Pro a 69 €/mês ou 690 €/ano no primeiro ano, depois 99 €/mês ou 990 €/ano enquanto a assinatura se mantiver ativa (sem IVA). Estabelecimento adicional: +69 €/mês. As atualizações do Verdict nunca aumentam este preço.", "essai": "Teste: 14 dias de Pro completo, sem cartão. Depois nada é apagado: volta ao Inventário gratuito e os seus dados continuam seus.", "actuel": "O seu nível atual: {n}.", "finEssaiK": "O seu teste Pro terminou", "finEssaiT": "Os seus dados continuam seus. O seu Inventário continua grátis.", "finEssaiFige": "Estas análises estão fixadas a {d}; voltam a atualizar-se com Pilotage ou Pro."}};
  var VO_OFFRE={version:'2026-10-05',pilotage:{m:69,a:690,xm:39,xa:390},pro:{m:129,a:1290,xm:69,xa:690},fondateur:{m:69,a:690,ensuite:99,ensuiteA:990,mois:12,places:50,xm:69,xa:690},essaiJours:14};
  var VO_ACCES={accueil:'pilotage',monMois:'pilotage',monAnnee:'pilotage',structure:'pilotage',diagnostic:'pilotage',carte:'pilotage',equipeMois:'pilotage',vera:'pilotage',inventaire:'gratuit',
    argent:'pro',tresorerie:'pro',cash13:'pro',offerts:'pro',equipeJour:'pro',servicesJour:'pro',cloture:'pro',pertes:'pro',achats:'pro',simulateur:'pro',veraTout:'pro'};
  function voRang(n){return n==='pro'?2:n==='pilotage'?1:0;}
  function voAcces(f,niveau){return voRang(niveau)>=voRang(VO_ACCES[f]||'pro');}
  function voC(){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}return VO_COPY[l]||VO_COPY.fr;}
  function verdictNiveau(){var n='gratuit';try{if((typeof root.estDemo==='function'&&root.estDemo())||root.VERDICT_PUBLIC_OPEN)n='pro';else{var T=root.TIER;n=T==='pro'?'pro':T==='pilotage'?'pilotage':'gratuit';}}catch(e){}
    var cap=root.__verdictNiveauMax;if(cap&&voRang(cap)<voRang(n))n=cap;return n;}
  function verdictOffrePourTier(){var n=verdictNiveau();return n==='pilotage'?VO_OFFRE.pilotage:VO_OFFRE.pro;}
  root.verdictNiveau=verdictNiveau;root.verdictOffrePourTier=verdictOffrePourTier;
  /* Lecture Pro figée : mise à jour quand Pro tourne, montrée quand Pro n'est plus là. */
  function voSnapshot(maj){try{var D=root.DB;if(!D)return null;if(maj){var cur=JSON.stringify(D.proSnapshot||{}),nx=Object.assign({},D.proSnapshot||{},maj,{d:root.verdictOperationalClock().key.slice(0,10)});if(JSON.stringify(nx)!==cur){D.proSnapshot=nx;try{root.save('pro-snapshot');}catch(e){}}}return D.proSnapshot||null;}catch(e){return null;}}
  function voFigeTxt(C,S){if(!S||!S.d)return '';var L=[];if(vmNum(S.argent))L.push(vmF(C.figeArgent,{v:vmEur(S.argent,2)}));if(vmNum(S.pointBas))L.push(vmF(C.figeTreso,{v:vmEur(S.pointBas)}));if(vmNum(S.mat))L.push(vmF(C.figeMat,{v:vmEur(S.mat)}));if(S.svc)L.push(vmF(C.figeSvc,{v:S.svc}));
    return L.length?vmF(C.fige,{d:vmJour(S.d),l:L.join(' · ')}):'';}
  function voLockHTML(C,texte,id){var S=voSnapshot(null),f=voFigeTxt(C,S);
    return '<article class="mod" id="'+(id||'modPro')+'" data-etat="info" data-vo-lock="1"><div class="mod-h"><p class="kicker">'+vmE(C.proK)+'</p></div><p class="sous" style="margin:0 0 6px">'+vmE(texte||C.proT)+'</p>'+(f?'<p class="sous" style="margin:0 0 6px;font-size:13px;opacity:.85">'+vmE(f)+'</p>':'')+'<button type="button" class="btn ghost" onclick="try{(parent.go||go)(\'abo\')}catch(e){}">'+vmE(C.proBtn)+'</button></article>';}
  /* Équipe : la journée détaillée (capacité, services) est Pro ; année et mois restent Pilotage. */
  if(typeof vtDayHTML==='function'){var _vtDay=vtDayHTML;vtDayHTML=function(){if(!voAcces('equipeJour',verdictNiveau())){var C=voC();return '<div class="vt-card" data-vo-lock="equipeJour" style="--vtc:#64748b"><p class="vt-k">'+vtE(C.proK)+'</p><p class="vt-note">'+vtE(C.lockEquipeJour)+'</p></div>';}return _vtDay.apply(this,arguments);};}
  /* Simulateur : Pro. */
  if(typeof vsHTML==='function'){var _vsHTML=vsHTML;vsHTML=function(){if(!voAcces('simulateur',verdictNiveau())){var C=voC();vtStyle();return '<section class="vt" id="vsModule" data-vo-lock="simulateur"><p class="vt-k">'+vtE(C.proK)+'</p><p class="vt-note">'+vtE(C.lockSim)+'</p></section>';}return _vsHTML.apply(this,arguments);};}
  /* Vera : les réponses « sur tout » sont Pro ; en Pilotage, Vera garde ses réponses existantes. */
  if(typeof vvRepondre==='function'){var _vv=vvRepondre;vvRepondre=function(q){if(!voAcces('veraTout',verdictNiveau())){var k=vvIntention(q);if(!k)return null;var C=voC();return {k:'pro-lock',l:[C.proT],date:'',demo:null};}return _vv.apply(this,arguments);};}
  /* Matière (clôture, écarts, pertes) : Pro ; le comptage reste gratuit. */
  function voWrapMat(){var f=root.verdictMatiereCarteHTML;if(typeof f!=='function'||f.__vo)return;var w=function(){if(!voAcces('cloture',verdictNiveau())){var C=voC();return '<div class="card" data-vo-lock="cloture"><p class="note" style="margin:0"><b>'+vmE(C.proK)+'</b> · '+vmE(C.lockMatiere)+'</p></div>';}return f.apply(this,arguments);};w.__vo=true;root.verdictMatiereCarteHTML=w;}
  voWrapMat();root.setInterval(voWrapMat,1500);
  /* Grille des offres + fin d'essai dans l'écran Abonnement. */
  var VO_LANC={fr:'Tout reste ouvert pendant le lancement.',en:'Everything stays open during the launch.',es:'Todo sigue abierto durante el lanzamiento.',it:'Tutto resta aperto durante il lancio.',de:'Während des Starts bleibt alles geöffnet.',nl:'Tijdens de lancering blijft alles open.',pt:'Tudo continua aberto durante o lançamento.'};
  var VO_DECOUV={fr:'découverte',en:'discovery',es:'descubrimiento',it:'scoperta',de:'Kennenlernen',nl:'kennismaking',pt:'descoberta'}; /* C298 (V15-139) : sans compte, aucun niveau payant n'est affiché */
  function voGrilleHTML(){var C=voC(),n=verdictNiveau(),acct=root.VERDICT_ACCOUNT_STATE||{},fin=n==='gratuit'&&acct.access_state==='expired'&&Number(acct.trial_ends_at)>0,S=voSnapshot(null);
    /* C239 (Y15, demande L3) : un compte connecté montre sa formule (après une résiliation : Inventaire), même si le lancement garde tout ouvert. */
    var nAff=n,lanc=false,rg={gratuit:0,pilotage:1,pro:2},sansCompte=false;try{sansCompte=root.VERDICT_COMPTE==null&&!(typeof root.estDemo==='function'&&root.estDemo());}catch(e){} /* C298 (V15-139) */try{var cc=!(typeof root.estDemo==='function'&&root.estDemo())&&typeof root.verdictCompteCourant==='function'?root.verdictCompteCourant():null;if(cc){nAff=cc.essai?'pro':(cc.formule==='pilotage'?'pilotage':(cc.formule==='pro'?'pro':'gratuit'));lanc=rg[n]>rg[nAff];}}catch(e){}
    var h='<section id="voGrille" data-vo-version="'+VO_OFFRE.version+'" style="margin:12px 0">';
    if(fin)h+='<div class="card" data-vo-fin-essai="1" style="border-left:4px solid #f59e0b"><b>'+vmE(C.finEssaiK)+'</b><p class="note" style="margin:6px 0">'+vmE(C.finEssaiT)+'</p>'+(S&&S.d?'<p class="note" style="margin:0">'+vmE(voFigeTxt(C,S))+' '+vmE(vmF(C.finEssaiFige,{d:vmJour(S.d)}))+'</p>':'')+'</div>';
    h+='<p class="note" style="margin:8px 0 4px;font-weight:700">'+vmE(C.grilleK)+'</p>';
    [['gratuit',C.gratuitN,C.gratuitP,C.gratuitD],['pilotage',C.pilotageN,C.pilotageP,C.pilotageD],['pro',C.proN,C.proP,C.proD]].forEach(function(p){h+='<div class="card" data-vo-plan="'+p[0]+'" style="margin:6px 0'+(p[0]===nAff?';outline:2px solid #22c55e':'')+'"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>'+vmE(p[1])+'</b><b>'+vmE(p[2])+'</b></div><p class="note" style="margin:4px 0 0">'+vmE(p[3])+'</p></div>';});
    h+='<p class="note" style="margin:6px 0">'+vmE(C.extra)+'</p><p class="note" style="margin:6px 0">'+vmE(C.fondateurs)+'</p><p class="note" style="margin:6px 0">'+vmE(C.essai)+'</p><p class="note" style="margin:6px 0">'+vmE(vmF(C.actuel,{n:(sansCompte&&!cc)?(VO_DECOUV[Object.keys(VO_COPY).filter(function(k){return VO_COPY[k]===C;})[0]]||VO_DECOUV.fr):nAff==='pro'?C.proN:nAff==='pilotage'?C.pilotageN:C.gratuitN})+((lanc||(sansCompte&&!cc&&n!=='gratuit'))?' '+(VO_LANC[Object.keys(VO_COPY).filter(function(k){return VO_COPY[k]===C;})[0]]||VO_LANC.fr):''))+'</p>';
    return h+'</section>';}
  function voAboAttach(){try{if(root.VIEW!=='abo')return;var sub=root.document.getElementById('aboSub');if(!sub)return;var sig=verdictNiveau()+'|'+(typeof locale==='function'?locale():'')+'|'+((root.VERDICT_ACCOUNT_STATE||{}).access_state||'');var old=root.document.getElementById('voGrille');if(old&&old.getAttribute('data-vo-sig')===sig)return;if(old)old.parentNode.removeChild(old);sub.insertAdjacentHTML('afterend',voGrilleHTML());var g=root.document.getElementById('voGrille');if(g)g.setAttribute('data-vo-sig',sig);}catch(e){}}
  root.setInterval(voAboAttach,800);
  /* V2-A4 · le niveau peut changer pendant que l'app est ouverte (statut serveur reçu après l'ouverture,
     fin d'essai) : on invalide les écrans déjà dessinés pour que chaque verrou Pro soit réappliqué. */
  var voNiveauVu=null;
  function voSuivreNiveau(){try{var n=verdictNiveau();if(voNiveauVu===null){voNiveauVu=n;return;}if(n===voNiveauVu)return;voNiveauVu=n;
    var sim=root.document.getElementById('vsModule');if(sim)sim.parentNode.removeChild(sim);
    if(typeof root.verdictInvalidateViews==='function')root.verdictInvalidateViews();
    if(typeof root.refreshLocks==='function')root.refreshLocks();
    if(root.VIEW&&typeof root.go==='function')root.go(root.VIEW);
    try{root.document.dispatchEvent(new root.CustomEvent('verdict:niveau',{detail:{niveau:n}}));}catch(e){}
  }catch(e){}}
  root.setInterval(voSuivreNiveau,700);
  var VF_VAT={"fr": {"k": "TVA moyenne (%)", "h": "Facultatif si votre FEC contient la TVA collectée : Verdict la calcule, tous taux confondus. Sinon, indiquez votre taux moyen réellement constaté.", "ph": "constatée dans le FEC", "missing": "Votre FEC ne contient pas de TVA collectée exploitable : indiquez votre TVA moyenne réellement constatée. Verdict ne suppose jamais 0 %.", "bad": "Indiquez un taux entre 0 et 30 %."}, "en": {"k": "Average VAT (%)", "h": "Optional if your FEC contains collected VAT: Verdict calculates it across all rates. Otherwise, enter your actual average rate.", "ph": "taken from the FEC", "missing": "Your FEC contains no usable collected VAT: enter your actual average VAT rate. Verdict never assumes 0%.", "bad": "Enter a rate between 0 and 30%."}, "es": {"k": "IVA medio (%)", "h": "Opcional si su FEC contiene el IVA repercutido: Verdict lo calcula con todos los tipos. Si no, indique su tipo medio real.", "ph": "obtenido del FEC", "missing": "Su FEC no contiene IVA repercutido utilizable: indique su IVA medio real. Verdict nunca supone 0 %.", "bad": "Indique un tipo entre 0 y 30 %."}, "it": {"k": "IVA media (%)", "h": "Facoltativa se il FEC contiene l’IVA incassata: Verdict la calcola su tutte le aliquote. Altrimenti indica la tua aliquota media reale.", "ph": "ricavata dal FEC", "missing": "Il FEC non contiene IVA incassata utilizzabile: indica la tua IVA media reale. Verdict non suppone mai 0%.", "bad": "Indica un’aliquota tra 0 e 30%."}, "de": {"k": "Durchschnittliche MwSt. (%)", "h": "Optional, wenn Ihr FEC die vereinnahmte MwSt. enthält: Verdict berechnet sie über alle Sätze. Sonst Ihren tatsächlichen Durchschnittssatz eintragen.", "ph": "aus dem FEC", "missing": "Ihr FEC enthält keine verwertbare vereinnahmte MwSt.: tragen Sie Ihren tatsächlichen Durchschnittssatz ein. Verdict nimmt nie 0 % an.", "bad": "Satz zwischen 0 und 30 % eintragen."}, "nl": {"k": "Gemiddelde btw (%)", "h": "Optioneel als uw FEC de ontvangen btw bevat: Verdict berekent die over alle tarieven. Anders vult u uw werkelijke gemiddelde tarief in.", "ph": "uit de FEC", "missing": "Uw FEC bevat geen bruikbare ontvangen btw: vul uw werkelijke gemiddelde btw in. Verdict gaat nooit uit van 0%.", "bad": "Vul een tarief tussen 0 en 30% in."}, "pt": {"k": "IVA médio (%)", "h": "Opcional se o FEC contiver o IVA liquidado: o Verdict calcula-o com todas as taxas. Caso contrário, indique a sua taxa média real.", "ph": "obtido do FEC", "missing": "O seu FEC não contém IVA liquidado utilizável: indique o seu IVA médio real. O Verdict nunca supõe 0%.", "bad": "Indique uma taxa entre 0 e 30%."}};
  root.verdictFecVatT=function(k){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}var D=VF_VAT[l]||VF_VAT.fr;return D[k]||VF_VAT.fr[k]||k;};
  var VS_SEUILS={"fr": {"chip": "Chiffre minimum", "tag": "SEUIL DE TRÉSORERIE ET SEUIL DE RENTABILITÉ COMPTABLE · EXERCICE ANNUEL · HT", "kpi": "Seuil de trésorerie annuel", "tresoK": "Ventes pour ne jamais manquer d’argent", "tresoD": "Elles paient toutes les sorties d’argent de l’année, sans compter l’usure du matériel. Votre comptable dit « seuil de trésorerie ». Votre minimum du jour, lui, compte cette usure.", "comptaK": "Ventes pour ne pas perdre d’argent", "comptaD": "Elles comptent aussi l’usure du matériel et des travaux ({a} par an). Votre comptable dit « seuil de rentabilité ».", "comptaD0": "Aucune usure du matériel renseignée : même chiffre que la ligne du dessus.", "note": "L’usure du matériel baisse le résultat, mais elle ne sort pas de la banque.", "ht": "HT par an", "comptable": "Pour votre comptable : vos deux seuils de l’année"}, "en": {"chip": "Thresholds", "tag": "CASH THRESHOLD AND ACCOUNTING BREAK-EVEN · ANNUAL · EXCL. VAT", "kpi": "Annual cash threshold", "tresoK": "Sales so you never run short of cash", "tresoD": "They pay for every cash outflow of the year, without counting equipment wear. Your accountant calls it the “cash threshold”. Your daily minimum does count this wear.", "comptaK": "Sales so you don’t lose money", "comptaD": "They also count the wear of equipment and works ({a} a year). Your accountant calls it the “break-even point”.", "comptaD0": "No equipment wear entered: same figure as the line above.", "note": "Equipment wear lowers your profit, but no money leaves the bank for it.", "ht": "excl. VAT per year", "comptable": "For your accountant: your two thresholds for the year"}, "es": {"chip": "Umbrales", "tag": "UMBRAL DE TESORERÍA Y UMBRAL DE RENTABILIDAD CONTABLE · ANUAL · SIN IVA", "kpi": "Umbral de tesorería anual", "tresoK": "Ventas para que nunca falte dinero", "tresoD": "Pagan todas las salidas de dinero del año, sin contar el desgaste del material. Su gestor lo llama «umbral de tesorería». Su mínimo del día sí cuenta ese desgaste.", "comptaK": "Ventas para no perder dinero", "comptaD": "Cuentan también el desgaste del material y de las obras ({a} al año). Su gestor lo llama «umbral de rentabilidad».", "comptaD0": "Ningún desgaste del material indicado: la misma cifra que la línea de arriba.", "note": "El desgaste del material baja el resultado, pero no sale dinero del banco.", "ht": "sin IVA al año", "comptable": "Para su gestor: sus dos umbrales del año"}, "it": {"chip": "Soglie", "tag": "SOGLIA DI CASSA E PUNTO DI PAREGGIO CONTABILE · ANNUALE · IVA ESCLUSA", "kpi": "Soglia di cassa annuale", "tresoK": "Vendite per non restare mai senza soldi", "tresoD": "Pagano tutte le uscite di denaro dell’anno, senza contare l’usura delle attrezzature. Il suo commercialista la chiama «soglia di cassa». Il suo minimo del giorno invece conta questa usura.", "comptaK": "Vendite per non perdere soldi", "comptaD": "Contano anche l’usura delle attrezzature e dei lavori ({a} all’anno). Il suo commercialista lo chiama «punto di pareggio».", "comptaD0": "Nessuna usura delle attrezzature indicata: stessa cifra della riga sopra.", "note": "L’usura delle attrezzature abbassa il risultato, ma non fa uscire denaro dalla banca.", "ht": "IVA esclusa all’anno", "comptable": "Per il suo commercialista: le due soglie dell’anno"}, "de": {"chip": "Schwellen", "tag": "LIQUIDITÄTSSCHWELLE UND BUCHHALTERISCHE GEWINNSCHWELLE · JÄHRLICH · NETTO", "kpi": "Jährliche Liquiditätsschwelle", "tresoK": "Umsatz, damit nie das Geld fehlt", "tresoD": "Er bezahlt alle Geldabflüsse des Jahres, ohne den Verschleiß der Ausstattung. Ihr Steuerberater nennt das „Liquiditätsschwelle“. Ihr Tagesminimum rechnet diesen Verschleiß mit ein.", "comptaK": "Umsatz, um kein Geld zu verlieren", "comptaD": "Er rechnet auch den Verschleiß von Ausstattung und Umbauten mit ({a} pro Jahr). Ihr Steuerberater nennt das „Gewinnschwelle“.", "comptaD0": "Kein Verschleiß der Ausstattung erfasst: dieselbe Zahl wie in der Zeile darüber.", "note": "Der Verschleiß der Ausstattung senkt das Ergebnis, aber dafür geht kein Geld vom Konto.", "ht": "netto pro Jahr", "comptable": "Für Ihren Steuerberater: Ihre zwei Schwellen des Jahres"}, "nl": {"chip": "Drempels", "tag": "KASDREMPEL EN BOEKHOUDKUNDIG BREAK-EVENPUNT · JAARLIJKS · EXCL. BTW", "kpi": "Jaarlijkse kasdrempel", "tresoK": "Omzet om nooit geld tekort te komen", "tresoD": "Die betaalt alle uitgaven van het jaar, zonder de slijtage van het materiaal. Uw boekhouder noemt dat de „kasdrempel”. Uw dagminimum telt die slijtage wel mee.", "comptaK": "Omzet om geen geld te verliezen", "comptaD": "Die telt ook de slijtage van materiaal en verbouwingen mee ({a} per jaar). Uw boekhouder noemt dat het „break-evenpunt”.", "comptaD0": "Geen slijtage van materiaal ingevuld: hetzelfde cijfer als de regel erboven.", "note": "Slijtage van materiaal verlaagt het resultaat, maar er gaat geen geld van de bank af.", "ht": "excl. btw per jaar", "comptable": "Voor uw boekhouder: uw twee drempels van het jaar"}, "pt": {"chip": "Limiares", "tag": "LIMIAR DE TESOURARIA E LIMIAR DE RENTABILIDADE CONTABILÍSTICA · ANUAL · SEM IVA", "kpi": "Limiar de tesouraria anual", "tresoK": "Vendas para nunca faltar dinheiro", "tresoD": "Pagam todas as saídas de dinheiro do ano, sem contar o desgaste do equipamento. O seu contabilista chama-lhe «limiar de tesouraria». O seu mínimo do dia conta esse desgaste.", "comptaK": "Vendas para não perder dinheiro", "comptaD": "Contam também o desgaste do equipamento e das obras ({a} por ano). O seu contabilista chama-lhe «limiar de rentabilidade».", "comptaD0": "Nenhum desgaste do equipamento indicado: o mesmo valor da linha de cima.", "note": "O desgaste do equipamento baixa o resultado, mas não sai dinheiro do banco.", "ht": "sem IVA por ano", "comptable": "Para o seu contabilista: os seus dois limiares do ano"}};
  root.verdictSeuilsT=function(k){var l='fr';try{l=(typeof locale==='function'?locale():root.LOCALE)||'fr';}catch(e){}var D=VS_SEUILS[l]||VS_SEUILS.fr;return D[k]||VS_SEUILS.fr[k]||k;};
  /* R268 · les deux seuils, toujours nommés : trésorerie (référence du jour) puis rentabilité comptable (avec amortissements). */
  root.verdictSeuilsHTML=function(mode,p){try{if(!p){var R=root.moteur();if(!R||!R.ready||typeof root.point3Calc!=='function')return '';p=root.point3Calc(R);}if(!p||!p.attainable||!vmNum(p.breakEvenTresorerie))return '';
    var T=root.verdictSeuilsT,eu=function(v){return vmEur(v);},a=p.amortization||0,d=a>0?T('comptaD').replace('{a}',eu(a)):T('comptaD0');
    /* C362 (T1, avec L2) : sur l'Accueil, les deux seuils comptables sont repliés sous « Pour votre comptable » ; le minimum du jour, du mois et de l'année reste la seule réponse visible */if(mode==='annee')return '<details data-vs-seuils="annee" style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(148,163,184,.15)"><summary class="sous" style="margin:0 0 6px;cursor:pointer;font-weight:700">'+vmE(T('comptable'))+'</summary><p class="sous" style="margin:0"><b>'+vmE(T('tresoK'))+' · <span data-vs-tresorerie="'+Math.round(p.breakEvenTresorerie)+'">'+vmE(eu(p.breakEvenTresorerie))+'</span></b> '+vmE(T('ht'))+'</p><p class="sous" style="margin:2px 0 6px;font-size:12.5px">'+vmE(T('tresoD'))+'</p><p class="sous" style="margin:0"><b>'+vmE(T('comptaK'))+' · <span data-vs-comptable="'+Math.round(p.breakEvenComptable)+'">'+vmE(eu(p.breakEvenComptable))+'</span></b> '+vmE(T('ht'))+'</p><p class="sous" style="margin:2px 0 6px;font-size:12.5px">'+vmE(d)+'</p><p class="sous" style="margin:0;font-size:12.5px;opacity:.85">'+vmE(T('note'))+'</p></details>';
    return '<div class="card" data-vs-seuils="diag"><div class="kpis"><div class="kpi"><div class="k">'+vmE(T('tresoK'))+'</div><div class="v" data-vs-tresorerie="'+Math.round(p.breakEvenTresorerie)+'">'+vmE(eu(p.breakEvenTresorerie))+'</div><div class="d">'+vmE(T('tresoD'))+'</div></div><div class="kpi"><div class="k">'+vmE(T('comptaK'))+'</div><div class="v" data-vs-comptable="'+Math.round(p.breakEvenComptable)+'">'+vmE(eu(p.breakEvenComptable))+'</div><div class="d">'+vmE(d)+'</div></div></div><p class="note" style="margin:8px 0 0">'+vmE(T('note'))+'</p></div>';}catch(e){return '';}};
  /* R268 · Diagnostic visible : l'onglet « Point mort » est un écran premium (iframe) ; on y ajoute les deux seuils nommés et on renomme l'onglet. */
  function vsDiagAttach(){try{
    if(root.VIEW!=='data')return;var host=root.document.getElementById('d-pm');if(!host)return;
    var chip=[].slice.call(root.document.querySelectorAll('#dchips button')).filter(function(b){return (b.getAttribute('onclick')||'').indexOf("dsub('pm'")>=0;})[0];
    if(chip&&chip.textContent!==root.verdictSeuilsT('chip'))chip.textContent=root.verdictSeuilsT('chip');
    var fr=host.querySelector('iframe.p41-ecran');if(!fr||!fr.contentDocument||!fr.contentDocument.body)return;var doc=fr.contentDocument;
    var p=null;try{p=root.point3Calc(root.moteur());}catch(e){}if(!p||!p.attainable)return;
    var sig=Math.round(p.breakEvenTresorerie)+'|'+Math.round(p.breakEvenComptable)+'|'+(typeof locale==='function'?locale():'');
    var old=doc.querySelector('[data-vs-diag-wrap]');if(old&&old.getAttribute('data-vs-sig')===sig)return;if(old)old.parentNode.removeChild(old);
    var html=root.verdictSeuilsHTML('annee',p);if(!html)return;
    html+='<button type="button" class="btn sec" onclick="parent.go(\'ca\')">Historique · comparer les années et les mois</button>';
    var main=doc.querySelector('main')||doc.body;main.insertAdjacentHTML('beforeend','<article class="mod" data-vs-diag-wrap="1" data-vs-sig="'+vmE(sig)+'" style="margin-top:14px">'+html.replace('data-vs-seuils="annee"','data-vs-seuils="diag-visible"')+'</article>');
    /* C312 (V16-079) : ce bloc vit dans le cadre isolé de l'écran, qui n'a ni .btn ni .sous : carte, textes et bouton au style de l'écran (variables du cadre, clair et sombre). */
    if(!doc.getElementById('vs-diag-css')){var vst=doc.createElement('style');vst.id='vs-diag-css';vst.textContent='[data-vs-diag-wrap]{padding:16px 16px 14px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(180deg,var(--card-a),var(--card-b));color:var(--txt)}[data-vs-diag-wrap] [data-vs-seuils]{margin-top:0!important;padding-top:0!important;border-top:0!important}[data-vs-diag-wrap] .sous{margin:0;color:var(--mut);font-size:13.5px;line-height:1.45}[data-vs-diag-wrap] .sous b{color:var(--txt);font-size:15px;line-height:1.35}[data-vs-diag-wrap] .btn{display:block;width:100%;margin-top:12px;min-height:44px;padding:11px 14px;border-radius:14px;border:1px solid var(--line);background:transparent;color:var(--txt);font-family:inherit;font-size:14.5px;font-weight:700;line-height:1.3;cursor:pointer}';(doc.head||doc.body).appendChild(vst);}
  }catch(e){}}
  root.setInterval(vsDiagAttach,900);
  root.VerdictOffre={version:VO_OFFRE.version,offre:VO_OFFRE,acces:voAcces,matrice:VO_ACCES,niveau:verdictNiveau,snapshot:voSnapshot,grilleHTML:voGrilleHTML};
  /* ═══ fin P11 ═══ */

  // Presentation only: move live nodes, never copy inputs or recalculate figures.
  function renderHomeFlowR36(host,archive,R,priority,opened,hasForm){
    if(root.VERDICT_HOME_FLOW_R36===false||query.get('homeFlow')==='legacy')return false;
    var daily=archive.querySelector('.v25-today');
    if(!opened||!daily)return false;
    var words=HOME_FLOW_R36_COPY[locale()]||HOME_FLOW_R36_COPY.fr,doc=root.document;
    function node(tag,cls,text){var n=doc.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
    function section(id,title){var n=node('section','v36-home-section');n.id=id;n.setAttribute('aria-labelledby',id+'-title');var h=node('h2','v36-home-title',title);h.id=id+'-title';n.appendChild(h);return n;}
    function fold(title){var d=node('details','v25-disclosure v36-fold');d.appendChild(node('summary','',title));var b=node('div','v25-disclosure-body');d.appendChild(b);return {el:d,body:b};}
    function move(selector,to){var n=archive.querySelector(selector);if(n)to.appendChild(n);return n;}
    var flow=node('div','v36-home-flow');flow.id='v45-home-essential';flow.setAttribute('data-v45-decision-budget','3');
    var today=section('v36-today',words[0]),month=section('v36-month',words[1]),actions=section('v36-actions',words[2]);
    flow.appendChild(today);flow.appendChild(month);flow.appendChild(actions);
    // Keep the existing upcoming-day information available without preceding the actual form.
    var plan=fold(words[3]);plan.body.innerHTML=dailyHomeHTML(R,false,hasForm,opened);
    today.appendChild(daily);
    var planned=plan.body.querySelector('[data-service-date]'),selected=daily.querySelector('#pl-jour');
    if(planned&&selected&&planned.getAttribute('data-service-date')===(selected.getAttribute('data-service-date')||((root.VerdictServiceDay.clock(null,root.DB).key.slice(0,8))+String(selected.value).padStart(2,'0')))){
      var kpis=planned.querySelector('.v45-home-kpis'),body=daily.querySelector('.v25-today-body');
      if(kpis&&body)daily.insertBefore(kpis,body);
    }

    var glance=daily.querySelector('.v25-glance'),footer=daily.querySelector('.v25-today-foot');
    var references=fold(words[4]);references.body.appendChild(node('p','v36-explanation',words[6]));
    references.body.appendChild(node('p','v36-explanation',words[7]));
    if(glance)references.body.appendChild(glance);
    if(footer)references.body.appendChild(footer);
    if(priority&&priority.kind==='inventory'){
      var alert=node('aside','v36-stock-alert');alert.setAttribute('aria-label',homeCopy().stock);
      var copy=node('div');copy.appendChild(node('strong','',priority.title));copy.appendChild(node('p','',priority.summary));
      var link=node('button','btn btn-secondary',homeCopy().openInventory);link.type='button';link.setAttribute('data-v45-inventory',priority.route);
      alert.appendChild(copy);alert.appendChild(link);today.appendChild(alert);
    }
    today.appendChild(plan.el);
    var grid=node('div','v36-month-grid');month.appendChild(grid);
    move('.v25-month',grid);
    var calendar=move('.v26-calendar-section',grid);
    if(calendar){
      var intro=calendar.querySelector('.v26-section-head p');if(intro)intro.textContent=words[8];
      // The old position-dependent instruction is replaced in all seven languages.
      var note=calendar.querySelector('[data-performance-status] > p.note');
      if(note&&/juste en dessous|just below|justo debajo|qui sotto|direkt darunter|hieronder|logo abaixo/.test(note.textContent))note.textContent=words[8];
      var entry=node('button','btn btn-secondary',words[9]);entry.type='button';entry.addEventListener('click',function(){if(typeof root.pilChoisirJour==='function')root.pilChoisirJour(root.pilJourActif());});calendar.appendChild(entry);
    }
    move('#v451-weekly-card',month);
    var detail=archive.querySelector('.v25-month-detail');
    if(detail){detail.open=false;references.body.appendChild(detail);}
    month.appendChild(references.el);
    var action=move('.v25-priority',actions);
    if(!action){var wrap=node('div');wrap.innerHTML=priorityHomeHTML(priority,false);while(wrap.firstChild)actions.appendChild(wrap.firstChild);}
    // Retain any other operational cards, imports and multi-establishment controls.
    var extras=fold(words[5]);extras.el.id='v45-home-complete';archive.id='v36-home-retained';extras.body.appendChild(archive);
    flow.appendChild(extras.el);host.appendChild(flow);
    return true;
  }

  /* C308 (V16-047, avec L5) : des journées de caisse sont lues mais la situation n’est pas décrite : l’Accueil le dit, avec la période. */
  var HOME_CAISSE={fr:{t:'Votre caisse est lue',p:'Vos {n} journées de caisse sont lues (du {a} au {b}) : décrivez votre situation pour obtenir vos minimums.'},
    en:{t:'Your till data is read',p:'Your {n} till days are read (from {a} to {b}): describe your situation to get your minimums.'},
    es:{t:'Su caja está leída',p:'Sus {n} jornadas de caja están leídas (del {a} al {b}): describa su situación para obtener sus mínimos.'},
    it:{t:'La sua cassa è letta',p:'Le sue {n} giornate di cassa sono lette (dal {a} al {b}): descriva la sua situazione per ottenere i suoi minimi.'},
    de:{t:'Ihre Kasse ist gelesen',p:'Ihre {n} Kassentage sind gelesen (vom {a} bis {b}): Beschreiben Sie Ihre Situation, um Ihre Minimums zu erhalten.'},
    nl:{t:'Uw kassa is gelezen',p:'Uw {n} kassadagen zijn gelezen (van {a} tot {b}): beschrijf uw situatie om uw minimums te krijgen.'},
    pt:{t:'A sua caixa está lida',p:'Os seus {n} dias de caixa estão lidos (de {a} a {b}): descreva a sua situação para obter os seus mínimos.'}};
  function homeCaisseLue(copy){
    var rows=((root.DB&&root.DB.histJour)||[]).filter(function(r){return r&&/^\d{4}-\d{2}-\d{2}$/.test(String(r.date||''))&&typeof r.caJ==='number'&&isFinite(r.caJ)&&r.demo!==true;});
    if(!rows.length)return copy;
    var dates=rows.map(function(r){return String(r.date);}).sort(),jours={};dates.forEach(function(d){jours[d]=1;});
    var l=(typeof locale==='function'&&locale())||root.LOCALE||'fr',T=HOME_CAISSE[String(l).slice(0,2)]||HOME_CAISSE.fr,fmt=function(d){var p=d.split('-').map(Number);try{return new Intl.DateTimeFormat(l,{day:'numeric',month:'long',year:'numeric'}).format(new Date(p[0],p[1]-1,p[2],12));}catch(e){return d;}};
    var n=Object.keys(jours).length,nf=n;try{nf=new Intl.NumberFormat(l).format(n);}catch(e){}
    return Object.assign({},copy,{noDataTitle:T.t,noDataText:T.p.replace('{n}',nf).replace('{a}',fmt(dates[0])).replace('{b}',fmt(dates[dates.length-1]))});
  }
  function renderPilotageHome(){
    if(profile!=='pilotage'||root.VIEW!=='pil')return;
    var host=root.document.getElementById('pilBody');if(!host)return;var R=null;try{R=root.moteur();}catch(e){}
    if(!R||!R.ready){var copy=homeCopy();try{copy=homeCaisseLue(copy);}catch(e){}host.innerHTML='<section id="v45-home-essential" class="v45-home-essential" data-v45-decision-budget="'+MAX_HOME_BLOCKS+'"><section class="card v45-decision-block v45-no-data" data-v45-decision-block="fec"><span class="v45-home-kicker">'+escapeHTML(copy.k)+'</span><h2>'+escapeHTML(copy.noDataTitle)+'</h2><p class="v45-home-summary" data-v45-conclusion>'+escapeHTML(limitWords(copy.noDataText))+'</p><button type="button" class="btn btn-primary" data-v45-fec>'+escapeHTML(copy.noDataCta)+'</button></section></section>';return;}
    var archive=root.document.createElement('div');archive.id='v45-home-complete';archive.className='v45-home-archive v45-home-complete';archive.setAttribute('aria-label',homeCopy().details);while(host.firstChild)archive.appendChild(host.firstChild);classifyOperationalControls(archive);
    var priority=homePriority(),opened=true;try{opened=typeof root.projetOuvert==='function'?!!root.projetOuvert():true;}catch(e){}
    var hasForm=!!archive.querySelector('#pil-saisie'),priorityOwnsPrimary=opened&&!!priority;
    if(renderHomeFlowR36(host,archive,R,priority,opened,hasForm))return;
    var essential=root.document.createElement('section');essential.id='v45-home-essential';essential.className='v45-home-essential';essential.setAttribute('data-v45-decision-budget',String(MAX_HOME_BLOCKS));essential.innerHTML=dailyHomeHTML(R,!priorityOwnsPrimary,hasForm,opened)+monthHomeHTML(R)+priorityHomeHTML(priority,priorityOwnsPrimary);
    host.appendChild(essential);host.appendChild(archive);
  }
  if(originalDrawPil)root.drawPil=function(){var result=originalDrawPil.apply(this,arguments);renderPilotageHome();return result;};
  function focusLater(selector){root.setTimeout(function(){var node=root.document.querySelector(selector);if(!node)return;try{var parent=node.parentElement;while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}node.scrollIntoView({block:'center',behavior:'auto'});node.focus({preventScroll:true});}catch(e){}},80);}
  function admin(action){
    if(action==='cash-register'&&root.VerdictFluxV451){root.VerdictFluxV451.openConnection();return true;}
    if(action==='fec'){setProfile('pilotage',false);if(originalGo)originalGo('in');focusLater('#v44-fec');return true;}
    if(action==='opening'){setProfile('pilotage',false);if(originalGo)originalGo('in');focusLater('#i-jsem');return true;}
    if(action==='etabs'&&typeof root.openEtabs==='function'){root.openEtabs();return true;}
    if(action==='account'){if(root.go)root.go('abo');return true;}
    if(action==='language'&&typeof root.langModal==='function'){root.langModal();return true;}
    if(action==='alerts'&&typeof root.plusAlertPreferencesManage==='function'){root.plusAlertPreferencesManage();return true;}
    if(action==='vera'){if(typeof root.ouvrirAide==='function')root.ouvrirAide();else if(originalGo)originalGo('aide');return true;}
    if(action==='audit'){if(originalGo)originalGo('audit');focusLater('#auExports');return true;}
    if(action==='advanced'){
      setProfile('pilotage',false);if(originalGo)originalGo('in');
      root.setTimeout(function(){var details=root.document.getElementById('v44-manual');if(details)details.open=true;var more=root.document.getElementById('btnMoreFix');if(more)focusLater('#btnMoreFix');},60);return true;
    }
    return false;
  }
  function carteAdmin(action){
    var routes={dishes:['plats','#c-plats'],ingredients:['ing','#c-ing'],preps:['preps','#c-preps'],extras:['supp','#c-supp'],channels:['plats','#point7-reconciliation'],stress:['cstress','#c-cstress'],settings:['creg','#c-creg']},route=routes[action];
    if(!route)return false;setProfile('carte',false);if(originalGo)originalGo('carte');root.setTimeout(function(){var buttons=root.document.querySelectorAll('#cchips button'),button=null;for(var i=0;i<buttons.length;i++)if(String(buttons[i].getAttribute('onclick')||'').indexOf("csub('"+route[0]+"'")>=0){button=buttons[i];break;}if(button&&typeof root.csub==='function')root.csub(route[0],button);focusLater(route[1]);},60);return true;
  }
  root.drawMenu=renderPlus;

  function renderCarteEmpty(){
    try{if(!root.DB||!Array.isArray(root.DB.plats)||root.DB.plats.length)return;}catch(e){return;}
    var host=root.document.getElementById('c-plats');if(!host)return;var text=ui();
    host.innerHTML='<section class="card v45-empty-card" aria-labelledby="v45-empty-title"><span class="v45-empty-icon" aria-hidden="true">＋</span><h2 id="v45-empty-title">'+escapeHTML(text.emptyTitle)+'</h2><p>'+escapeHTML(text.emptyText)+'</p><button type="button" class="btn btn-primary" onclick="openPlat()">'+escapeHTML(text.emptyCta)+'</button></section>';
  }
  if(originalDrawCarte)root.drawCarte=function(){var result=originalDrawCarte.apply(this,arguments);renderCarteEmpty();return result;};

  function money(value){
    try{return new Intl.NumberFormat(locale()==='en'?'en-IE':locale(),{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value)||0);}catch(e){return Math.round(Number(value)||0)+' €';}
  }
  function sentence(template,value){return escapeHTML(template).replace('{x}','<b>'+escapeHTML(value)+'</b>');}
  function renderAccounting(){
    var proof=null;try{proof=root.DB&&root.DB.fecImport;}catch(e){}
    if(!proof||!proof.totals||proof.totals.amortization==null)return;
    var host=root.document.getElementById('d-carnet');if(!host)return;
    var previous=host.querySelector('#v45-accounting-68');if(previous)previous.remove();
    var before=proof.accounting&&Number(proof.accounting.operatingBeforeAmortization),after=proof.accounting&&Number(proof.accounting.preTaxResult),amort=Number(proof.totals.amortization)||0;
    if(!Number.isFinite(before))try{before=Number(root.moteur().d.res)||0;}catch(e){before=0;}
    if(!Number.isFinite(after))after=before-amort;
    var copy=ACCOUNTING[locale()]||ACCOUNTING.fr,beforeText=money(before),afterText=money(after),card=root.document.createElement('section');
    card.id='v45-accounting-68';card.className='card v45-accounting-68';
    card.innerHTML='<span class="v45-accounting-kicker">'+escapeHTML(copy.k)+'</span><h3>'+escapeHTML(copy.title)+'</h3><div class="v45-accounting-amounts"><span>'+escapeHTML(copy.before)+'<b>'+escapeHTML(beforeText)+'</b></span><span>'+escapeHTML(copy.after)+'<b>'+escapeHTML(afterText)+'</b></span></div><p>'+sentence(copy.p1,beforeText)+'</p><p>'+sentence(copy.p2,afterText)+'</p><p>'+sentence(copy.p3,afterText)+'</p>';
    host.insertBefore(card,host.firstChild);
  }
  if(originalDrawData)root.drawData=function(){var result=originalDrawData.apply(this,arguments);applyChrome();renderAccounting();renderPointMortR36();return result;};


  /* C279 : le mois où commence le suivi n'a pour minimum que la part restante ; on la nomme et on donne le mois entier (même libellé que l'Accueil, C256). */
  var PM_RESTE_C279={fr:['Minimum du reste du mois','Minimum du mois entier'],en:['Minimum for the rest of the month','Minimum for the whole month'],es:['Mínimo del resto del mes','Mínimo del mes completo'],it:['Minimo del resto del mese','Minimo del mese intero'],de:['Minimum für den Rest des Monats','Minimum für den ganzen Monat'],nl:['Minimum voor de rest van de maand','Minimum voor de hele maand'],pt:['Mínimo do resto do mês','Mínimo do mês inteiro']};
  var POINT_MORT_R36_COPY={
  "fr": [
    "Point mort",
    "Quand vos charges sont-elles couvertes ?",
    "Ce mois-ci · CA TTC",
    "Couverture constatée le {date}",
    "Couverture estimée le {date}",
    "Date à confirmer",
    "Minimum non couvert ce mois-ci",
    "Aucune charge à couvrir dans les données saisies",
    "Minimum à couvrir",
    "Déjà enregistré",
    "Reste à couvrir",
    "Constaté",
    "Estimé",
    "Le constat reprend les journées enregistrées. L’estimation répartit la projection restante selon les objectifs du calendrier.",
    "Une journée manquante ou un calendrier modifié empêche de donner une date fiable.",
    "Une date estimée dépend du rythme futur. Elle ne garantit ni bénéfice ni trésorerie.",
    "Exercice · CA HT",
    "jours ouverts équivalents",
    "À rythme uniforme, le seuil représente {days} jours ouverts sur {total}. Ce n’est pas une date de calendrier.",
    "Voir et compléter mes journées",
    "Tester ma résistance",
    "Comparer la saisonnalité",
    "Hypothèses et limites",
    "Effet des chocs sur la couverture annuelle",
    "Scénario",
    "Chiffre minimum HT",
    "Couverture au rythme simulé",
    "Hors période",
    "Contribution insuffisante",
    "mois actifs équivalents",
    "Saison : durée nécessaire pour couvrir les charges",
    "À contribution mensuelle constante, il faut {months} mois actifs. Le calendrier réel peut déplacer cette date.",
    "Début du mois",
    "Fin du mois",
    "Situation actuelle",
    "Le seuil annuel ci-dessous utilise votre exercice. La date ci-dessus utilise les journées du mois courant."
  ],
  "en": [
    "Break-even",
    "When are your costs covered?",
    "This month · revenue incl. tax",
    "Coverage recorded on {date}",
    "Coverage estimated on {date}",
    "Date to confirm",
    "Minimum not covered this month",
    "No costs to cover in the entered data",
    "Minimum to cover",
    "Already recorded",
    "Still to cover",
    "Recorded",
    "Estimated",
    "Recorded coverage uses entered days. The estimate allocates the remaining projection using calendar targets.",
    "A missing day or changed calendar prevents a reliable date.",
    "An estimated date depends on future activity. It guarantees neither profit nor cash.",
    "Annual period · revenue excl. tax",
    "equivalent open days",
    "At a uniform pace, the threshold represents {days} open days out of {total}. This is not a calendar date.",
    "Review and complete my days",
    "Test my resilience",
    "Compare seasonality",
    "Assumptions and limits",
    "Effect of shocks on annual coverage",
    "Scenario",
    "Minimum revenue excl. tax",
    "Coverage at simulated pace",
    "Beyond the period",
    "Insufficient contribution",
    "equivalent active months",
    "Season: time needed to cover costs",
    "With constant monthly contribution, {months} active months are needed. The actual calendar may change the date.",
    "Start of month",
    "End of month",
    "Current situation",
    "The annual threshold below uses your accounting period. The date above uses days in the current month."
  ],
  "es": [
    "Punto de equilibrio",
    "¿Cuándo se cubren sus gastos?",
    "Este mes · ventas con impuestos",
    "Cobertura registrada el {date}",
    "Cobertura estimada el {date}",
    "Fecha por confirmar",
    "Mínimo no cubierto este mes",
    "Sin gastos que cubrir en los datos introducidos",
    "Mínimo que cubrir",
    "Ya registrado",
    "Pendiente de cubrir",
    "Registrado",
    "Estimado",
    "La cobertura registrada usa las jornadas introducidas. La estimación distribuye la proyección restante según los objetivos del calendario.",
    "Un día pendiente o un calendario modificado impiden dar una fecha fiable.",
    "La fecha estimada depende de la actividad futura. No garantiza beneficios ni tesorería.",
    "Ejercicio · ventas sin impuestos",
    "días abiertos equivalentes",
    "A ritmo uniforme, el umbral representa {days} días abiertos de {total}. No es una fecha del calendario.",
    "Consultar y completar mis jornadas",
    "Probar mi resistencia",
    "Comparar estacionalidad",
    "Hipótesis y límites",
    "Efecto de los impactos sobre la cobertura anual",
    "Escenario",
    "Ventas mínimas sin impuestos",
    "Cobertura al ritmo simulado",
    "Fuera del período",
    "Contribución insuficiente",
    "meses activos equivalentes",
    "Temporada: tiempo necesario para cubrir gastos",
    "Con contribución mensual constante, hacen falta {months} meses activos. El calendario real puede desplazar la fecha.",
    "Inicio del mes",
    "Fin del mes",
    "Situación actual",
    "El umbral anual usa su ejercicio contable. La fecha anterior usa las jornadas del mes actual."
  ],
  "it": [
    "Punto di pareggio",
    "Quando sono coperti i costi?",
    "Questo mese · incassi IVA inclusa",
    "Copertura registrata il {date}",
    "Copertura stimata il {date}",
    "Data da confermare",
    "Minimo non coperto questo mese",
    "Nessun costo da coprire nei dati inseriti",
    "Minimo da coprire",
    "Già registrato",
    "Ancora da coprire",
    "Registrato",
    "Stimato",
    "La copertura registrata usa le giornate inserite. La stima distribuisce la proiezione residua secondo gli obiettivi del calendario.",
    "Una giornata mancante o un calendario modificato impediscono una data affidabile.",
    "La data stimata dipende dall’attività futura. Non garantisce utile né liquidità.",
    "Esercizio · ricavi IVA esclusa",
    "giorni aperti equivalenti",
    "A ritmo uniforme, la soglia equivale a {days} giorni aperti su {total}. Non è una data di calendario.",
    "Consultare e completare le giornate",
    "Provare la resistenza",
    "Confrontare la stagionalità",
    "Ipotesi e limiti",
    "Effetto degli shock sulla copertura annua",
    "Scenario",
    "Ricavi minimi IVA esclusa",
    "Copertura al ritmo simulato",
    "Oltre il periodo",
    "Contributo insufficiente",
    "mesi attivi equivalenti",
    "Stagione: tempo necessario per coprire i costi",
    "A contributo mensile costante servono {months} mesi attivi. Il calendario reale può spostare la data.",
    "Inizio mese",
    "Fine mese",
    "Situazione attuale",
    "La soglia annua usa il periodo contabile. La data sopra usa le giornate del mese corrente."
  ],
  "de": [
    "Break-even",
    "Wann sind Ihre Kosten gedeckt?",
    "Dieser Monat · Umsatz inkl. Steuern",
    "Deckung erfasst am {date}",
    "Deckung geschätzt am {date}",
    "Datum zu bestätigen",
    "Minimum diesen Monat nicht gedeckt",
    "Keine zu deckenden Kosten in den erfassten Daten",
    "Zu deckendes Minimum",
    "Bereits erfasst",
    "Noch zu decken",
    "Erfasst",
    "Geschätzt",
    "Die erfasste Deckung nutzt eingetragene Tage. Die Schätzung verteilt die verbleibende Prognose nach den Kalenderzielen.",
    "Ein fehlender Tag oder ein geänderter Kalender verhindert ein verlässliches Datum.",
    "Das geschätzte Datum hängt von der künftigen Tätigkeit ab. Es garantiert weder Gewinn noch Liquidität.",
    "Geschäftsjahr · Nettoumsatz",
    "äquivalente Öffnungstage",
    "Bei gleichmäßigem Verlauf entspricht die Schwelle {days} Öffnungstagen von {total}. Dies ist kein Kalenderdatum.",
    "Meine Tage prüfen und ergänzen",
    "Belastbarkeit testen",
    "Saisonalität vergleichen",
    "Annahmen und Grenzen",
    "Auswirkung von Schocks auf die jährliche Deckung",
    "Szenario",
    "Mindestnettoumsatz",
    "Deckung beim simulierten Verlauf",
    "Außerhalb des Zeitraums",
    "Unzureichender Deckungsbeitrag",
    "äquivalente aktive Monate",
    "Saison: Zeit zur Kostendeckung",
    "Bei konstantem monatlichem Deckungsbeitrag sind {months} aktive Monate nötig. Der tatsächliche Kalender kann das Datum verschieben.",
    "Monatsbeginn",
    "Monatsende",
    "Aktuelle Situation",
    "Die jährliche Schwelle nutzt Ihr Geschäftsjahr. Das Datum oben nutzt die Tage des laufenden Monats."
  ],
  "nl": [
    "Break-evenpunt",
    "Wanneer zijn uw kosten gedekt?",
    "Deze maand · omzet incl. btw",
    "Dekking vastgesteld op {date}",
    "Dekking geschat op {date}",
    "Datum te bevestigen",
    "Minimum deze maand niet gedekt",
    "Geen te dekken kosten in de ingevoerde gegevens",
    "Te dekken minimum",
    "Al geregistreerd",
    "Nog te dekken",
    "Vastgesteld",
    "Geschat",
    "Vastgestelde dekking gebruikt ingevoerde dagen. De schatting verdeelt de resterende prognose volgens de kalenderdoelen.",
    "Een ontbrekende dag of gewijzigde kalender verhindert een betrouwbare datum.",
    "De geschatte datum hangt af van toekomstige activiteit. Ze garandeert geen winst of liquiditeit.",
    "Boekjaar · omzet excl. btw",
    "equivalente openingsdagen",
    "Bij gelijkmatig tempo komt de drempel overeen met {days} openingsdagen van {total}. Dit is geen kalenderdatum.",
    "Mijn dagen bekijken en aanvullen",
    "Mijn weerbaarheid testen",
    "Seizoenen vergelijken",
    "Aannames en grenzen",
    "Effect van schokken op de jaarlijkse dekking",
    "Scenario",
    "Minimumomzet excl. btw",
    "Dekking bij gesimuleerd tempo",
    "Buiten de periode",
    "Onvoldoende bijdrage",
    "equivalente actieve maanden",
    "Seizoen: tijd nodig om kosten te dekken",
    "Bij een constante maandbijdrage zijn {months} actieve maanden nodig. De werkelijke kalender kan de datum verschuiven.",
    "Begin van de maand",
    "Einde van de maand",
    "Huidige situatie",
    "De jaarlijkse drempel gebruikt uw boekjaar. De datum hierboven gebruikt dagen van de huidige maand."
  ],
  "pt": [
    "Ponto de equilíbrio",
    "Quando ficam os custos cobertos?",
    "Este mês · receita com IVA",
    "Cobertura registada em {date}",
    "Cobertura estimada em {date}",
    "Data por confirmar",
    "Mínimo não coberto este mês",
    "Sem custos a cobrir nos dados introduzidos",
    "Mínimo a cobrir",
    "Já registado",
    "Falta cobrir",
    "Registado",
    "Estimado",
    "A cobertura registada usa os dias introduzidos. A estimativa distribui a projeção restante segundo os objetivos do calendário.",
    "Um dia em falta ou um calendário alterado impede uma data fiável.",
    "A data estimada depende da atividade futura. Não garante lucro nem tesouraria.",
    "Exercício · receita sem IVA",
    "dias abertos equivalentes",
    "A ritmo uniforme, o limiar representa {days} dias abertos em {total}. Não é uma data de calendário.",
    "Consultar e completar os meus dias",
    "Testar a resistência",
    "Comparar a sazonalidade",
    "Hipóteses e limites",
    "Efeito dos choques na cobertura anual",
    "Cenário",
    "Receita mínima sem IVA",
    "Cobertura ao ritmo simulado",
    "Fora do período",
    "Contribuição insuficiente",
    "meses ativos equivalentes",
    "Época: tempo necessário para cobrir os custos",
    "Com contribuição mensal constante, são necessários {months} meses ativos. O calendário real pode alterar a data.",
    "Início do mês",
    "Fim do mês",
    "Situação atual",
    "O limiar anual usa o exercício contabilístico. A data acima usa os dias do mês atual."
  ]
};

  // Read-only presentation model. No score, financial threshold, input or source day is written.
  function pointMortTimelineR36(month,minimum){
    function valid(v){return (typeof v==='number'||typeof v==='string'&&v.trim()!=='')&&Number.isFinite(Number(v));}
    var result={status:'unknown',date:null,minimum:valid(minimum)?Number(minimum):null,actual:0,remaining:null,points:[]};
    if(!month||!Array.isArray(month.days)||!valid(minimum)||Number(minimum)<0)return result;
    var days=month.days.slice().sort(function(a,b){return a.date.localeCompare(b.date);}),sum=0,fsum=root.VerdictFinance.fraction(0),uncertain=false,crossed=null;
    days.forEach(function(d){
      if(d.status==='missing'||d.ignored||d.preTracking||d.invalid||d.estimated)uncertain=true;
      if(valid(d.ca)){fsum=fsum.add(Number(d.ca));sum=fsum.number(2);if(!crossed&&fsum.cmp(Number(minimum))>=0)crossed=d.date;result.points.push({date:d.date,value:sum,estimated:false});}
    });
    result.actual=sum;result.remaining=fsum.cmp(Number(minimum))>=0?0:root.VerdictFinance.fraction(Number(minimum)).sub(fsum).number(2);
    if(minimum===0){result.status='zero';return result;}
    if(uncertain||month.calendarChanged)return result;
    if(crossed){result.status='observed';result.date=crossed;return result;}
    if(!valid(month.projection)||Number(month.projection)<sum)return result;
    var future=days.filter(function(d){return !d.closed&&!valid(d.ca)&&(d.status==='today'||d.status==='future');});
    if(future.some(function(d){return !valid(d.target)||Number(d.target)<0;}))return result;
    var weight=future.reduce(function(n,d){return n+Number(d.target);},0);
    if(!future.length||weight<=0){result.status=Number(month.projection)<minimum?'beyond':'unknown';return result;}
    var residual=Number(month.projection)-sum;
    future.forEach(function(d){sum+=residual*Number(d.target)/weight;if(!result.date&&sum+1e-7>=minimum)result.date=d.date;result.points.push({date:d.date,value:sum,estimated:true});});
    result.status=result.date?'estimated':'beyond';return result;
  }
  function renderPointMortR36(){
    if(root.VERDICT_POINT_MORT_R36===false||profile!=='pilotage')return;
    var R;try{R=root.moteur();}catch(e){return;}if(!R||!R.ready)return;
    var words=POINT_MORT_R36_COPY[locale()]||POINT_MORT_R36_COPY.fr,p=root.point3Calc(R),doc=root.document;
    var fmt=new Intl.NumberFormat(locale(),{maximumFractionDigits:1});
    function text(k,vars){var s=words[k];Object.keys(vars||{}).forEach(function(key){s=s.replace('{'+key+'}',vars[key]);});return s;}
    function esc(v){return escapeHTML(v);}
    function card(id){var old=doc.getElementById(id);if(old)old.remove();var n=doc.createElement('section');n.id=id;n.className='v36-pointmort card';n.setAttribute('data-verdict-vocabulary','off');return n;}
    function insert(id,n){var host=doc.getElementById(id);if(host)host.insertBefore(n,host.firstChild);}
    function daysFor(a){return a.attainable&&a.ca>0?a.breakEven/a.ca*a.activeDays:null;}
    function labelDays(a){var days=daysFor(a);return days===null?text(28):fmt.format(days)+' '+text(17)+(days>a.activeDays?' · '+text(27):'');}
    var month=null,S=null,clock=null;
    try{clock=root.VerdictServiceDay.clock(null,root.DB);month=root.VerdictPerformanceIntegrated.buildMonth(R,clock.key.slice(0,7));S=root.piloteMoisEtat(R);}catch(e){}
    var timeline=pointMortTimelineR36(month,S&&S.economique&&S.economique.seuilMois);
    var date=timeline.date?new Intl.DateTimeFormat(locale(),{day:'numeric',month:'long',year:'numeric'}).format(new Date(timeline.date+'T12:00:00')):null;
    var title=timeline.status==='observed'?text(3,{date:date}):timeline.status==='estimated'?text(4,{date:date}):timeline.status==='beyond'?text(6):timeline.status==='zero'?text(7):text(5);
    var view=card('v36-point-mort');
    var html='<span class="v36-pm-kicker">'+esc(text(0))+' · '+esc(text(2))+'</span><h2>'+esc(text(1))+'</h2><p class="v36-pm-answer">'+esc(title)+'</p>';
    if(month&&timeline.minimum!==null){
      var last=month.days.length,mark=timeline.date?Number(timeline.date.slice(8)):null;
      html+='<div class="v36-pm-timeline" role="img" aria-label="'+esc(title)+'"><div class="v36-pm-track">';
      month.days.forEach(function(day){var recorded=day.ca!==null&&day.ca!==undefined,cls=day.closed?'closed':recorded?'recorded':'forecast';html+='<i class="'+cls+(mark===day.day?' crossing':'')+'" title="'+esc(new Intl.DateTimeFormat(locale(),{weekday:'short',day:'numeric',month:'long'}).format(new Date(day.date+'T12:00:00')))+'"></i>';});
      html+='</div><div class="v36-pm-ends"><span>'+esc(text(32))+'</span><span>'+esc(text(33))+'</span></div><div class="v36-pm-legend"><span>● '+esc(text(11))+'</span><span>┄ '+esc(text(12))+'</span>'+(date?'<b>'+esc(date)+'</b>':'')+'</div></div>';
      var pmFull=(function(){try{var s0=String(root.DB.performanceTrackingStartedAt||''),mk=clock.key.slice(0,7),yp=root.DB.performanceYearPlans[mk.slice(0,4)],full=yp&&yp.fullMonthlyTargets?Number(yp.fullMonthlyTargets[mk]):0;return /^\d{4}-\d{2}-\d{2}$/.test(s0)&&s0.slice(0,7)===mk&&s0.slice(8)!=='01'&&full>Number(timeline.minimum)+0.5?full:null;}catch(e){return null;}})(),pmL=PM_RESTE_C279[locale()]||PM_RESTE_C279.fr;
      html+='<dl class="v36-pm-metrics">'+(pmFull!==null?[[pmL[0],timeline.minimum],[pmL[1],pmFull],[text(9),timeline.actual],[text(10),timeline.remaining]]:[[text(8),timeline.minimum],[text(9),timeline.actual],[text(10),timeline.remaining]]).map(function(row){return '<div><dt>'+esc(row[0])+'</dt><dd>'+esc(row[1]===null?'—':money(row[1]))+'</dd></div>';}).join('')+'</dl>';
    }
    html+='<p class="v36-explanation">'+esc(timeline.status==='unknown'?text(14):text(15))+'</p><details class="v36-pm-method"><summary>'+esc(text(22))+'</summary><p>'+esc(text(13))+'</p><p>'+esc(text(35))+'</p><p>'+esc(text(18,{days:daysFor(p)===null?'—':fmt.format(daysFor(p)),total:fmt.format(p.activeDays)}))+'</p></details><div class="v36-pm-buttons"><button type="button" class="btn" data-v36-pm="days">'+esc(text(19))+'</button><button type="button" class="btn sec" data-v36-pm="stress">'+esc(text(20))+'</button><button type="button" class="btn sec" data-v36-pm="season">'+esc(text(21))+'</button></div>';
    view.innerHTML=html;
    if(root.VerdictMinimumCurveR38&&root.VerdictMinimumCurveR38.enabled())root.VerdictMinimumCurveR38.enhance(view,{timeline:timeline,month:month,words:words,locale:locale(),statusFor:root.VerdictPerformanceIntegrated.statusFor});
    insert('d-pm',view);
    // Make the existing screen discoverable under both its clear and technical names.
    var tab=doc.querySelector('[data-i18n="tab.pm"]');
    if(tab){tab.setAttribute('data-verdict-vocabulary','off');tab.textContent=({fr:"Chiffre minimum",en:"Minimum revenue",de:"Mindestumsatz",es:"Ingresos mínimos",it:"Ricavi minimi",nl:"Minimumomzet",pt:"Receita mínima"})[locale()]||"Chiffre minimum";}
    var stress=card('v36-point-mort-stress'),chocks=root.stressStruct(R).ch;
    stress.innerHTML='<span class="v36-pm-kicker">'+esc(text(0))+' · '+esc(text(16))+'</span><h3>'+esc(text(23))+'</h3><div class="v36-pm-scenarios">'+[{n:text(34),p:p}].concat(chocks.map(function(c){var rate=c.ca>0?1-c.cv/c.ca:0;return {n:c.n,p:{attainable:rate>0,breakEven:rate>0?(c.cf+(Number(R.d.amort)||0))/rate:null,ca:c.ca,activeDays:p.activeDays}};})) /* C298 (V15-001) : chaque choc a son propre chiffre minimum (point3Calc recalculait la situation actuelle) */.map(function(row){return '<article><h4>'+esc(row.n)+'</h4><p>'+esc(text(25))+'<b>'+esc(row.p.attainable?money(row.p.breakEven):text(28))+'</b></p><p>'+esc(text(26))+'<b>'+esc(labelDays(row.p))+'</b></p></article>';}).join('')+'</div><p class="v36-explanation">'+esc(text(18,{days:daysFor(p)===null?'—':fmt.format(daysFor(p)),total:fmt.format(p.activeDays)}))+'</p>';insert('d-stress',stress);
    var season=card('v36-point-mort-season'),months=p.attainable&&R.d.mc>0?R.d.cf/(R.d.mc/p.activeMonths):null;
    season.innerHTML='<span class="v36-pm-kicker">'+esc(text(0))+' · '+esc(text(16))+'</span><h3>'+esc(text(30))+'</h3><p class="v36-pm-answer">'+esc(months===null?text(28):fmt.format(months)+' '+text(29))+'</p><p class="v36-explanation">'+esc(text(31,{months:months===null?'—':fmt.format(months)}))+'</p><button type="button" class="btn sec" data-v36-pm="days">'+esc(text(19))+'</button>';insert('d-annuel',season);
    [view,stress,season].forEach(function(n){Array.prototype.forEach.call(n.querySelectorAll('[data-v36-pm]'),function(button){button.addEventListener('click',function(){var action=button.getAttribute('data-v36-pm');if(action==='days'){root.go('pil');focusLater('#point4-calendar');}else {var target=action==='stress'?'stress':'annuel',buttons=doc.querySelectorAll('#dchips button');for(var i=0;i<buttons.length;i++)if((buttons[i].getAttribute('onclick')||'').indexOf("dsub('"+target+"'")>=0){root.dsub(target,buttons[i]);break;}}});});});
  }
  root.VerdictPointMortR36={timeline:pointMortTimelineR36};

  function renderCashStatus(){
    var host=root.document.getElementById('santeBody');if(!host)return;
    var axes=host.querySelectorAll('.solidarity-axis'),firstVisible='';
    for(var i=0;i<axes.length;i++){
      var label=axes[i].querySelector('span'),value=label&&String(label.textContent||'');
      if(/trésor|tresor|cash|tesorer|liquid|tesour/i.test(value)){axes[i].hidden=true;axes[i].setAttribute('data-v45-cash-axis','hidden');}
      else if(!firstVisible)firstVisible=value;
    }
    var note=host.querySelector('.v45-cash-not-calculated');if(!note){note=root.document.createElement('p');note.className='v45-cash-not-calculated';var grid=host.querySelector('.solidarity-grid');if(grid)grid.insertAdjacentElement('afterend',note);}
    note.innerHTML='<b>'+escapeHTML(ui().cash.split('.')[0])+'.</b>'+escapeHTML(ui().cash.slice(ui().cash.indexOf('.')+1));
    var intro=host.querySelector('[data-v12-solidity-diagnostic] > .note');if(intro)intro.textContent=ui().six;
    var warning=host.querySelector('[data-v12-solidity-diagnostic] > .warn');if(warning&&(/trésor|tresor|cash|tesorer|liquid|tesour/i.test(warning.textContent)||firstVisible)){var bold=warning.querySelector('b');if(bold)bold.textContent=ui().first+firstVisible;}
  }
  if(originalDrawSante)root.drawSante=function(){var result=originalDrawSante.apply(this,arguments);renderCashStatus();return result;};

  root.document.addEventListener('click',function(event){
    var target=event.target&&event.target.closest?event.target.closest('[data-v45-fec],[data-v45-daily],[data-v45-understand],[data-v45-inventory],[data-v45-open-project]'):null;
    if(target){
      event.preventDefault();
      if(target.hasAttribute('data-v45-fec')&&typeof root.openRef==='function')root.openRef();
      else if(target.hasAttribute('data-v45-daily')){var selected=Number(target.getAttribute('data-service-day'));if(selected>0){root.PIL_JOUR=selected;if(typeof root.drawPil==='function')root.drawPil();}focusLater('#pl-ca');}
      else if(target.hasAttribute('data-v45-understand')&&typeof root.p11Comprendre==='function')root.p11Comprendre(target.getAttribute('data-v45-understand'));
      else if(target.hasAttribute('data-v45-inventory'))requestInventory(target.getAttribute('data-v45-inventory'));
      else if(target.hasAttribute('data-v45-open-project')&&typeof root.projetOuvrir==='function')root.projetOuvrir();
      return;
    }
    var button=event.target&&event.target.closest?event.target.closest('[data-v45-admin],[data-v45-carte-admin]'):null;if(button){event.preventDefault();if(button.hasAttribute('data-v45-carte-admin'))carteAdmin(button.getAttribute('data-v45-carte-admin'));else admin(button.getAttribute('data-v45-admin'));}
  },true);
  root.addEventListener('message',function(event){
    if(!embedded||event.source!==root.parent||(root.location.origin!=='null'&&root.location.protocol!=='file:')&&event.origin!==root.location.origin||!event.data)return;
    if(event.data.type==='verdict-unified-profile')queueProfileMessage(event.data);
  });
  root.addEventListener('verdict:locale-changed',function(){/* R320 : setLocale réécrit la barre APRÈS cet événement (ancien libellé « Diagnostic ») ; on repasse ensuite pour garder « Structure » quel que soit le chemin. */setTimeout(applyChrome,0);applyChrome();if(root.VIEW==='plus')renderPlus();if(root.VIEW==='carte')renderCarteEmpty();if(root.VIEW==='data')renderAccounting();if(root.VIEW==='sante')renderCashStatus();if(root.VIEW==='pil'&&root.drawPil)root.drawPil();});

  root.VerdictModuleProfilesV45=Object.freeze({VERSION:VERSION,maxHomeBlocks:MAX_HOME_BLOCKS,conclusionWordLimit:CONCLUSION_WORD_LIMIT,getProfile:function(){return profile;},setProfile:setProfile,requestInventory:requestInventory,admin:admin,renderPlus:renderPlus,renderHome:renderPilotageHome});
  applyChrome();
  var languageGate=root.document.getElementById('mLang');
  if(!languageGate||!languageGate.classList.contains('on'))setProfile(profile,true);else notify();
})(window);

