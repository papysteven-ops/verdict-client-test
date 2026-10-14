
(function(){
'use strict';

/* Verdict V43.30 — moteur d'audit stratégique.
   Contrat : les comptes et le score viennent exclusivement de moteur(). Les
   réponses terrain qualifient une cause et une preuve ; elles ne recalculent
   jamais un euro, un ratio ou une note. */

var AU_YES=[['mesure','Oui, avec une mesure'],['part','En partie'],['non','Non'],['nsp','Je ne sais pas']];
var AU_CTX_QUESTIONS=[
  {id:'matiere_reelle',q:'Pouvez-vous rapprocher achats, stock et pertes sur une même période ?',o:AU_YES,why:'Le coût matière représente {fc} du CA. Le compte mesure le total, pas la cause de l’écart.',decides:'Distinguer hausse des prix, variation de stock et pertes réelles.',proof:'Achats + inventaires d’ouverture et de clôture + relevé des pertes sur la même période.'},
  {id:'equipe_services',q:'Le coût complet de l’équipe est-il rapproché des ventes, service par service ?',o:AU_YES,why:'Le coût humain représente {ms} du CA. Un total annuel ne montre pas le service qui absorbe la marge.',decides:'Distinguer un sureffectif structurel d’un mauvais placement des heures.',proof:'Rapport caisse par service + heures réellement travaillées + coût chargé.'},
  {id:'canaux_nets',q:'La contribution nette est-elle calculée séparément pour chaque canal ?',o:AU_YES,why:'Les commissions saisies représentent {com} du CA. Une commission seule ne donne pas le coût complet du canal.',decides:'Identifier le canal qui apporte du résultat, pas seulement du volume.',proof:'CA HT, remises, commission, emballage, remboursement et coût matière par canal.'},
  {id:'engagements_fixes',q:'Les engagements futurs de trésorerie sont-ils documentés ?',o:AU_YES,why:'La rentabilité calculée est de {rn}. Elle ne prouve pas la trésorerie disponible après dette et investissements.',decides:'Séparer une structure rentable d’une trésorerie sous tension.',proof:'Échéancier d’emprunts, crédits-bails, investissements signés et dettes exigibles.'},

  {id:'service_contribution',q:'Connaissez-vous la contribution de chaque service après matière et équipe présente ?',o:AU_YES,why:'Pour un {format}, le service rentable ne se déduit ni du remplissage ni du chiffre d’affaires seul.',decides:'Choisir le premier service à protéger, corriger ou tester.',proof:'CA, couverts, matière et heures réellement travaillées pour au moins trois services comparables.'},
  {id:'rotation_couverts',q:'Mesurez-vous couverts, rotation des tables et refus par service ?',o:AU_YES,why:'La capacité peut limiter le résultat même lorsque le panier est correct.',decides:'Distinguer un problème de demande d’un plafond de capacité ou de rotation.',proof:'Couverts servis, tables disponibles, réservations, refus et durée moyenne par service.'},
  {id:'mix_menu_boissons',q:'La contribution est-elle suivie par famille : menus, plats, desserts et boissons ?',o:AU_YES,why:'Le panier moyen masque les produits qui fabriquent réellement la marge.',decides:'Travailler le mix avant d’envisager une hausse générale des prix.',proof:'Ventes article + recettes valorisées + remises et offerts sur une période commune.'},
  {id:'heures_creuses',q:'Les heures creuses sont-elles identifiées par des ventes et des heures réelles ?',o:AU_YES,why:'Une moyenne journalière ne révèle pas les créneaux qui ne paient pas l’équipe.',decides:'Conserver, déplacer ou tester un créneau sans conclure sur l’intuition.',proof:'CA par tranche de 30 ou 60 minutes + heures de présence correspondantes.'},

  {id:'hdg_couvert',q:'Calculez-vous la contribution complète par couvert et par menu ?',o:AU_YES,why:'Une table haut de gamme finance une promesse de service avec une capacité volontairement limitée.',decides:'Vérifier si le niveau de service est financé par chaque couvert.',proof:'CA HT, coût matière, boissons, temps direct et prestations incluses par menu.'},
  {id:'no_show',q:'Mesurez-vous annulations, no-shows et tables non revendues ?',o:AU_YES,why:'Avec peu de couverts disponibles, une place perdue peut peser davantage qu’une faible variation de prix.',decides:'Chiffrer l’intérêt d’un acompte ou d’une règle de réservation.',proof:'Réservations, annulations, no-shows, tables revendues et panier attendu.'},
  {id:'temps_hdg',q:'Les heures de préparation et de service sont-elles affectées à chaque service ?',o:AU_YES,why:'Le coût humain ne peut pas être expliqué sans les heures réellement consommées par la promesse client.',decides:'Distinguer qualité assumée, préparation excessive et organisation perfectible.',proof:'Planning réalisé, pointage et temps de préparation par service comparable.'},
  {id:'boissons_hdg',q:'La contribution des vins, accords et suppléments est-elle isolée ?',o:AU_YES,why:'Le mix boissons peut financer une partie du niveau de service, mais le panier global le masque.',decides:'Identifier un levier de mix compatible avec l’expérience promise.',proof:'Ventes et coûts par référence, offerts, casse et stocks de cave.'},

  {id:'bar_mix',q:'Séparez-vous la contribution boissons, nourriture et événements ?',o:AU_YES,why:'Un débit de boissons peut afficher du volume tout en changeant fortement de marge selon son mix.',decides:'Identifier la partie de l’offre qui paie réellement les heures d’ouverture.',proof:'CA HT, coût matière et heures par famille et par plage horaire.'},
  {id:'bar_pertes',q:'Les doses, offerts, casse et écarts de fûts sont-ils mesurés ?',o:AU_YES,why:'Les pertes de débit ne sont pas visibles dans le chiffre d’affaires et ne doivent jamais être estimées au hasard.',decides:'Prouver ou écarter une fuite de marge sur les boissons.',proof:'Inventaire, ventes théoriques, sorties réelles, offerts et casse par période.'},
  {id:'bar_tardif',q:'Le dernier créneau d’ouverture paie-t-il l’équipe et les coûts de fermeture ?',o:AU_YES,why:'Les dernières heures peuvent être pleines ou destructrices de marge : seul un rapprochement horaire tranche.',decides:'Conserver, réduire ou tester l’amplitude de fin de service.',proof:'CA horaire, heures équipe, sécurité, énergie et nettoyage du créneau.'},
  {id:'bar_frequence',q:'Mesurez-vous la fréquence et le panier par moment de consommation ?',o:AU_YES,why:'Le panier moyen mélange café, apéritif, repas et soirée alors que leurs économies diffèrent.',decides:'Choisir le moment client à développer sans dégrader le mix.',proof:'Tickets horodatés et familles d’articles par tranche horaire.'},

  {id:'debit_pic',q:'Mesurez-vous commandes, temps d’attente et abandons pendant le pic ?',o:AU_YES,why:'En restauration rapide, la capacité du pic peut limiter le CA avant la demande.',decides:'Distinguer manque de demande, goulot de production et prise de commande.',proof:'Commandes par quart d’heure, temps moyen, commandes refusées ou annulées.'},
  {id:'portions_rapide',q:'Les portions et rendements sont-ils contrôlés sur des productions réelles ?',o:AU_YES,why:'Une faible dérive unitaire devient importante sur un volume répété.',decides:'Prouver si le coût matière vient du prix d’achat ou du rendement opérationnel.',proof:'Pesées de sortie, fiches techniques, rendement de lot et nombre réel de portions.'},
  {id:'canal_direct',q:'Comparez-vous sur place, emporter et livraison après tous les coûts ?',o:AU_YES,why:'Les canaux n’ont ni le même prix net, ni l’emballage, ni le même temps de production.',decides:'Savoir quel volume mérite d’être développé ou repricé.',proof:'CA, remises, commission, emballage, matière et temps par canal.'},
  {id:'capacite_poste',q:'Quel poste fixe le débit maximal du service ?',o:[['mesure','Mesuré en service'],['intuition','Connu à l’intuition'],['variable','Il varie'],['nsp','Je ne sais pas']],why:'Ajouter de la demande n’a de valeur que si la production peut l’absorber sans allonger les délais.',decides:'Choisir entre acquisition client et correction du goulot opérationnel.',proof:'Cadence observée par poste et temps d’attente au pic.'},

  {id:'pizza_rendement',q:'Le rendement réel des pâtons et garnitures est-il rapproché des pizzas vendues ?',o:AU_YES,why:'Le coût théorique d’une pizza ne prouve pas le rendement réel de la production.',decides:'Distinguer prix d’achat, surportion et pertes de production.',proof:'Poids du lot, nombre de pâtons, grammages réels, pertes et ventes.'},
  {id:'pizza_four',q:'Le débit du four au pic est-il mesuré avec les temps d’attente ?',o:AU_YES,why:'Le four peut plafonner les ventes avant la demande ou le nombre de commandes.',decides:'Décider si l’enjeu est le flux de production, la préparation ou la prise de commande.',proof:'Pizzas par quart d’heure, occupation du four et délai commande-remise.'},
  {id:'pizza_canaux',q:'La marge est-elle séparée entre salle, emporter et livraison ?',o:AU_YES,why:'Une même pizza change de contribution avec le prix, la commission et l’emballage du canal.',decides:'Définir prix et offre par canal sans confondre volume et marge.',proof:'Prix net, commission, emballage, matière et volume par canal.'},
  {id:'pizza_mix',q:'La contribution est-elle suivie par pizza, formule et supplément ?',o:AU_YES,why:'Le panier moyen peut progresser alors que le mix devient moins rentable.',decides:'Choisir les produits à mettre en avant et les suppléments à tester.',proof:'Ventes article, coût recette et remises sur une même période.'},

  {id:'truck_emplacement',q:'Calculez-vous le résultat de chaque emplacement après droit de place et déplacement ?',o:AU_YES,why:'Pour un food truck, deux journées au même CA peuvent laisser des résultats opposés.',decides:'Classer les emplacements sur leur contribution réelle, pas leur fréquentation.',proof:'CA, matière, équipe, droit de place, kilomètres, préparation et invendus par date.'},
  {id:'truck_meteo',q:'Les ventes sont-elles reliées à la météo et au type d’événement ?',o:AU_YES,why:'La demande dépend du contexte ; mélanger les journées fabrique une moyenne trompeuse.',decides:'Construire une référence comparable et une règle d’acceptation d’événement.',proof:'Historique daté des ventes, météo, type d’événement et fréquentation annoncée.'},
  {id:'truck_capacite',q:'Connaissez-vous le débit maximum réellement tenu pendant un rush ?',o:AU_YES,why:'Le volume potentiel ne devient du CA que si l’équipe et le véhicule peuvent le servir.',decides:'Choisir entre plus de demande, préproduction ou simplification de l’offre.',proof:'Commandes servies, attente, ruptures et abandons par tranche de 15 minutes.'},
  {id:'truck_invendus',q:'Les invendus et retours sont-ils mesurés par sortie ?',o:AU_YES,why:'La préparation avant départ transforme une mauvaise prévision en coût immédiatement perdu.',decides:'Ajuster quantités et carte à chaque type d’emplacement.',proof:'Quantités embarquées, vendues, retournées et détruites par produit.'},

  {id:'dark_canal',q:'La contribution nette est-elle calculée par plateforme et par marque ?',o:AU_YES,why:'En dark kitchen, le CA brut ne dit rien après commission, promotions, remboursements et emballage.',decides:'Identifier le couple plateforme-marque qui crée réellement du résultat.',proof:'Relevé plateforme + ventes + promotions + remboursements + emballage + matière.'},
  {id:'dark_rejets',q:'Mesurez-vous annulations, rejets, remboursements et retards ?',o:AU_YES,why:'Ces incidents détruisent du revenu et du classement sans apparaître comme une ligne de matière.',decides:'Séparer un problème de demande d’un problème d’exécution.',proof:'Exports plateformes horodatés avec motif et montant.'},
  {id:'dark_temps',q:'Le temps de préparation est-il suivi par marque et créneau ?',o:AU_YES,why:'Plusieurs marques peuvent partager une cuisine tout en créant des goulots différents.',decides:'Choisir la marque à simplifier, suspendre au pic ou réorganiser.',proof:'Temps accepté-prêt, commandes simultanées et composition équipe.'},
  {id:'dark_mix',q:'Les ventes déplacées entre vos propres marques sont-elles identifiées ?',o:AU_YES,why:'Ajouter une marque peut déplacer des commandes existantes au lieu de créer du volume net.',decides:'Évaluer la cannibalisation avant de conclure à une croissance.',proof:'Clients, zones, paniers et horaires par marque sur une période comparable.'},

  {id:'coffee_moments',q:'La contribution est-elle suivie par moment : matin, midi, après-midi ?',o:AU_YES,why:'Un coffee shop ne possède pas une seule économie sur toute la journée.',decides:'Identifier le créneau qui mérite une offre, une équipe ou une amplitude différente.',proof:'Tickets horodatés, coût article et heures équipe par tranche.'},
  {id:'coffee_attache',q:'Mesurez-vous le taux boisson + nourriture par ticket ?',o:AU_YES,why:'Le panier peut progresser par prix sans améliorer l’attachement alimentaire.',decides:'Tester une association produit précise plutôt qu’une remise générale.',proof:'Détail des tickets permettant de relier boissons et nourriture.'},
  {id:'coffee_pertes',q:'Lait, pâtisseries et produits frais invendus sont-ils mesurés ?',o:AU_YES,why:'Les petites pertes répétées ne sont pas visibles dans le panier moyen.',decides:'Identifier la famille et le moment qui expliquent la perte matière.',proof:'Production/achats, ventes, pertes et stock par famille et par jour.'},
  {id:'coffee_place',q:'Séparez-vous la contribution sur place et à emporter ?',o:AU_YES,why:'Une place assise mobilise de la capacité et du temps différemment d’une vente à emporter.',decides:'Évaluer l’usage des places sans assimiler occupation et rentabilité.',proof:'Canal du ticket, durée d’occupation observée et panier.'},

  {id:'traiteur_affaire',q:'Chaque devis clôturé possède-t-il sa marge après achats et heures réelles ?',o:AU_YES,why:'Chez un traiteur, le chiffre d’affaires annuel masque les affaires qui consomment la capacité.',decides:'Identifier les formats de prestation à repricer ou refuser.',proof:'Devis, achats affectés, heures préparation/service, transport et sous-traitance.'},
  {id:'traiteur_acompte',q:'Acomptes, annulations et solde sont-ils suivis avec leurs échéances ?',o:AU_YES,why:'Une affaire rentable sur le papier peut fragiliser la trésorerie avant l’encaissement.',decides:'Sécuriser les conditions commerciales et le besoin de financement.',proof:'Contrat, échéancier, encaissements et conditions d’annulation.'},
  {id:'traiteur_capacite',q:'La capacité déjà engagée est-elle visible avant d’accepter un devis ?',o:AU_YES,why:'Deux affaires rentables séparément peuvent devenir irréalisables le même jour.',decides:'Accepter, sous-traiter ou refuser selon la capacité prouvée.',proof:'Calendrier, volumes, matériel, véhicules et heures disponibles.'},
  {id:'traiteur_achats',q:'Les achats engagés avant confirmation client sont-ils identifiés ?',o:AU_YES,why:'Les approvisionnements spécifiques créent un risque avant la prestation.',decides:'Fixer une date de confirmation et un acompte cohérents.',proof:'Bons de commande, conditions d’annulation et date limite fournisseur.'},

  {id:'boulange_rotation',q:'Mesurez-vous le taux de vente et les invendus par famille et tranche horaire ?',o:AU_YES,why:'En boulangerie, une moyenne journalière ne dit pas quelle production devient une perte.',decides:'Choisir la famille et l’heure de production à corriger en premier.',proof:'Quantités produites, vendues, données, remisées et jetées par famille et créneau.'},
  {id:'boulange_fournées',q:'Les fournées sont-elles ajustées depuis les ventes réelles comparables ?',o:AU_YES,why:'La cadence de production doit suivre la demande par heure, jour et saison.',decides:'Réduire un invendu sans provoquer une rupture rentable.',proof:'Heure et quantité de chaque fournée + ventes et ruptures correspondantes.'},
  {id:'boulange_main_oeuvre',q:'Séparez-vous les heures de production, vente et snacking ?',o:AU_YES,why:'Les métiers et rythmes diffèrent ; un coût humain global ne permet aucune décision opérationnelle.',decides:'Distinguer besoin de capacité et mauvaise allocation des heures.',proof:'Pointage ou planning réalisé par fonction et CA par activité.'},
  {id:'boulange_mix',q:'La contribution est-elle connue par pain, viennoiserie, pâtisserie et snacking ?',o:AU_YES,why:'Le volume n’indique pas la contribution après matière et temps direct.',decides:'Protéger la production utile et repricer la famille réellement fragile.',proof:'Ventes, recettes valorisées et temps direct par famille.'},

  {id:'saison_n1',q:'Disposez-vous de la même période N−1 à périmètre comparable ?',o:[['complet','Oui, même dates et périmètre'],['part','Partiellement'],['non','Non'],['nsp','Je ne sais pas']],why:'Une activité saisonnière ne peut pas être lue contre une moyenne annuelle ou une autre phase de saison.',decides:'Séparer tendance réelle, calendrier et effet de montée en charge.',proof:'CA, jours ouverts, météo, équipe et offre sur les mêmes dates N et N−1.'},
  {id:'saison_effectif',q:'Le recrutement, le logement et la montée en compétence sont-ils chiffrés avant saison ?',o:AU_YES,why:'La capacité saisonnière dépend de ressources disponibles sur une fenêtre courte.',decides:'Vérifier si le volume prévu est réellement serviable.',proof:'Contrats, coût logement, dates d’arrivée, postes et capacité de service.'},
  {id:'saison_stock',q:'Les stocks de début et de fin de saison sont-ils valorisés ?',o:AU_YES,why:'Les achats peuvent appartenir à une autre phase de saison que les ventes observées.',decides:'Distinguer consommation réelle, constitution de stock et invendus de fermeture.',proof:'Inventaires valorisés d’ouverture et de clôture + achats de la période.'},
  {id:'saison_meteo',q:'La performance est-elle rapprochée de la météo et de la fréquentation locale ?',o:AU_YES,why:'Le contexte extérieur peut déplacer le volume sans que l’équipe ou la carte en soient la cause.',decides:'Construire des journées comparables et une fourchette prudente.',proof:'Ventes datées, météo, événements et fréquentation par jour.'}
];

var AU_MODEL_QUESTION_SETS={
  trad:['service_contribution','rotation_couverts','mix_menu_boissons','heures_creuses'],
  hdg:['hdg_couvert','no_show','temps_hdg','boissons_hdg'],
  bar:['bar_mix','bar_pertes','bar_tardif','bar_frequence'],
  rapide:['debit_pic','portions_rapide','canal_direct','capacite_poste'],
  pizza:['pizza_rendement','pizza_four','pizza_canaux','pizza_mix'],
  truck:['truck_emplacement','truck_meteo','truck_capacite','truck_invendus'],
  dark:['dark_canal','dark_rejets','dark_temps','dark_mix'],
  coffee:['coffee_moments','coffee_attache','coffee_pertes','coffee_place'],
  traiteur:['traiteur_affaire','traiteur_acompte','traiteur_capacite','traiteur_achats'],
  boulangerie:['boulange_rotation','boulange_fournées','boulange_main_oeuvre','boulange_mix'],
  saison:['saison_n1','saison_effectif','saison_stock','saison_meteo']
};

function auCtxQuestionById(id){
  for(var i=0;i<AU_CTX_QUESTIONS.length;i++)if(AU_CTX_QUESTIONS[i].id===id)return AU_CTX_QUESTIONS[i];
  return null;
}
function auAuditModelKey(){
  var f='',m='';
  try{f=String(auProfil().format||'').toLowerCase();}catch(e){}
  try{m=String(DB&&DB.modele||'').toLowerCase();}catch(e){}
  if(m==='saisonniermer'||/saisonn/.test(f))return 'saison';
  if(m==='darkkitchen'||/dark|livraison/.test(f))return 'dark';
  if(/food truck/.test(f))return 'truck';
  if(/boulanger/.test(f))return 'boulangerie';
  if(/traiteur/.test(f))return 'traiteur';
  if(/coffee/.test(f))return 'coffee';
  if(m==='barrestaurant'||/bar|tapas/.test(f))return 'bar';
  if(/pizzeria/.test(f))return 'pizza';
  if(/gastronom|exception|palace/.test(f)||m==='gastro'||m==='palace')return 'hdg';
  if(/burger|kebab/.test(f))return 'rapide';
  return 'trad';
}
function auCtxOrdre(R){
  var key=auAuditModelKey(),base=(AU_MODEL_QUESTION_SETS[key]||AU_MODEL_QUESTION_SETS.trad).slice(),lead=[],lim='';
  try{lim=auFaible(R);}catch(e){}
  if(lim==='fc')lead.push('matiere_reelle');
  if(lim==='ms'||lim==='pc')lead.push('equipe_services');
  if(lim==='com'||(R&&R.v&&R.v.com>0))lead.push('canaux_nets');
  if(lim==='pm'||lim==='sen'||(R&&R.v&&R.v.rn<5))lead.push('engagements_fixes');
  var seen={},out=[];
  lead.concat(base).forEach(function(id){if(!seen[id]&&auCtxQuestionById(id)){seen[id]=1;out.push(id);}});
  return out.slice(0,6);
}
function auCtx(){DB.auditCtx=DB.auditCtx||{};return DB.auditCtx;}
function auCtxEtat(R){
  var c=auCtx(),ids=auCtxOrdre(R),n=0;ids.forEach(function(id){if(c[id])n++;});
  return {n:n,total:ids.length,pct:ids.length?Math.round(n/ids.length*100):100,ids:ids};
}
function auCtxStateLabel(E){
  E=E||auCtxEtat(typeof moteur==='function'?moteur():null);
  return E.n===0?'Non commencé · 0 / '+E.total:(E.n>=E.total?'Terminé · '+E.total+' / '+E.total:'À reprendre · '+E.n+' / '+E.total);
}
function auCtxFill(text,R){
  var v=R&&R.v||{},M=auProfil();
  function displayRatio(value){return typeof value==='number'&&Number.isFinite(value)?pct(value):'—';}
  return String(text||'').replace('{fc}',displayRatio(v.fc)).replace('{ms}',displayRatio(v.ms)).replace('{com}',displayRatio(v.com)).replace('{rn}',displayRatio(v.rn)).replace('{format}',String(M.format||'établissement'));
}
function auCtxPourquoi(id,R){var q=auCtxQuestionById(id);return q?auCtxFill(q.why,R):'Cette réponse départage deux causes que les comptes seuls ne peuvent pas prouver.';}
function auCtxOptionLabel(q,value){
  if(!q)return '';for(var i=0;i<q.o.length;i++)if(q.o[i][0]===value)return q.o[i][1];return '';
}
function auCtxQuestionActive(R){
  var c=auCtx(),order=auCtxOrdre(R),id=AU_CTX_EDIT_ID&&order.indexOf(AU_CTX_EDIT_ID)>=0?AU_CTX_EDIT_ID:'';
  if(!id)for(var i=0;i<order.length;i++)if(!c[order[i]]){id=order[i];break;}
  return auCtxQuestionById(id);
}
function auCtxRepondre(id,v){
  var q=auCtxQuestionById(id),R=typeof moteur==='function'?moteur():null,active=auCtxOrdre(R);
  var ok=q&&active.indexOf(id)>=0&&q.o.some(function(o){return o[0]===v;});if(!ok)return;
  auCtx()[id]=v;AU_CTX_EDIT_ID='';AU_CTX_UI_OPEN=true;save();
  var ctx=null;try{ctx=etabContexteVue();}catch(e){}drawAudit();try{etabRestaurerContexte(ctx);}catch(e){}
  requestAnimationFrame(function(){var target=document.querySelector('[data-au-active-question]')||document.querySelector('[data-v12-terrain-questionnaire]');if(target){target.scrollIntoView({block:'center',behavior:scReduced()?'auto':'smooth'});var b=target.querySelector('[role="radio"]');if(b)try{b.focus({preventScroll:true});}catch(e){b.focus();}}});
  var E=auCtxEtat(R);toast('Réponse enregistrée · '+E.n+' / '+E.total+' — aucun euro ni score modifié');
}
function auCtxAnswerStrength(value){
  if(['mesure','complet','hebdo','mensuel'].indexOf(value)>=0)return 'measured';
  if(['part','ponctuel','intuition','variable'].indexOf(value)>=0)return 'partial';
  return 'missing';
}
function auCtxConstats(R){
  var c=auCtx(),out=[];auCtxOrdre(R).forEach(function(id){var q=auCtxQuestionById(id),val=c[id];if(!q||!val)return;var st=auCtxAnswerStrength(val),answer=auCtxOptionLabel(q,val);
    if(st==='measured')out.push('Déclaré « '+answer+' » — à confirmer avec : '+q.proof);
    else if(st==='partial')out.push('Cause encore partiellement tranchée. Prochaine preuve : '+q.proof);
    else out.push('Verdict ne conclut pas sur ce point. À obtenir : '+q.proof);
  });return out.slice(0,5);
}
function auCtxHTML(R){
  var E=auCtxEtat(R),c=auCtx(),C=auCtxConstats(R),q=auCtxQuestionActive(R),h='';
  h+='<div class="au-sc v43-audit-refine" data-v12-terrain-questionnaire data-audit-optional><div class="au-tag">Questions stratégiques · facultatives · propres à votre modèle</div>'+
    '<h2 class="au-h">Seulement ce que les chiffres ne peuvent pas trancher</h2>'+
    '<p class="au-p">Votre audit est déjà disponible. Verdict a sélectionné <b>'+E.total+' questions utiles</b> pour ce '+esc(auProfil().format)+' ; aucune question générique n’est ajoutée pour remplir un formulaire.</p>'+
    '<div class="au-refine-ready"><span class="au-refine-check" aria-hidden="true">✓</span><div><b>Le calcul reste indépendant</b><p>Vos réponses qualifient les causes et les preuves. Elles ne changent ni le score, ni les comptes, ni le chiffre minimum.</p></div></div>'+
    '<details class="au-refine-shell" '+(AU_CTX_UI_OPEN?'open ':'')+'ontoggle="auCtxToggle(this)"><summary><span><b>Affiner les causes</b><small>Facultatif · une question à la fois · '+E.n+' / '+E.total+'</small></span><span class="au-refine-action">'+(E.n===0?'Commencer':(E.n<E.total?'Reprendre':'Revoir'))+'</span></summary>'+
    '<div class="au-refine-body"><div class="v12-terrain-progress" role="progressbar" aria-label="Progression de l’affinage facultatif" aria-valuemin="0" aria-valuemax="'+E.total+'" aria-valuenow="'+E.n+'"><i style="width:'+E.pct+'%"></i></div>';
  if(q){
    h+='<div class="au-question-brief"><div><span>Pourquoi maintenant</span><p>'+esc(auCtxPourquoi(q.id,R))+'</p></div><div><span>Ce que la réponse tranche</span><p>'+esc(q.decides)+'</p></div><div><span>Preuve attendue</span><p>'+esc(q.proof)+'</p></div></div>'+
      '<fieldset class="au-question au-question-single" id="au-ctx-q-'+q.id+'" data-au-active-question role="radiogroup" aria-labelledby="au-ctx-l-'+q.id+'"><legend id="au-ctx-l-'+q.id+'">'+esc(q.q)+'</legend><div class="au-choices">'+q.o.map(function(o){var on=c[q.id]===o[0];return '<button type="button" role="radio" aria-checked="'+(on?'true':'false')+'" class="au-choice'+(on?' on':'')+'" onclick="auCtxRepondre(\''+q.id+'\',\''+o[0]+'\')">'+esc(o[1])+'</button>';}).join('')+'</div></fieldset>';
  }else h+='<div class="au-refine-done" role="status"><span aria-hidden="true">✓</span><div><b>Affinage terminé</b><p>Les causes sont mieux qualifiées. Le moteur financier est resté strictement inchangé.</p></div></div>';
  var answered=E.ids.map(auCtxQuestionById).filter(function(x){return x&&c[x.id];});
  if(answered.length)h+='<details class="au-refine-answers"><summary>Voir ou modifier mes réponses ('+answered.length+')</summary><div>'+answered.map(function(x){return '<button type="button" onclick="auCtxEdit(\''+x.id+'\')"><span>'+esc(x.q)+'</span><b>'+esc(auCtxOptionLabel(x,c[x.id]))+'</b></button>';}).join('')+'</div></details>';
  if(C.length)h+='<div class="au-refine-findings"><span class="au-k">Ce que vos réponses ont précisé</span>'+C.map(function(x){return '<div class="au-ok"><span class="p" style="color:#2563eb">•</span><span>'+esc(x)+'</span></div>';}).join('')+'</div>';
  return h+'</div></details></div>';
}
function auCtxSummaryHTML(R){
  var E=auCtxEtat(R),C=auCtxConstats(R),h='<div class="au-card" data-v12-terrain-summary><span class="au-k">Questions stratégiques · '+esc(auProfil().format)+'</span><b>'+auCtxStateLabel(E)+'</b><p class="au-p" style="margin:6px 0 10px">'+E.total+' questions maximum, choisies pour votre modèle et vos chiffres. Elles qualifient les causes sans modifier le calcul.</p>';
  if(C.length)h+=C.slice(0,3).map(function(x){return '<div class="au-ok"><span class="p" style="color:#2563eb">•</span><span>'+esc(x)+'</span></div>';}).join('');
  return h+'<button type="button" class="btn sec" style="margin-top:10px" onclick="auCtxOpen()">'+(E.n?'Reprendre ou modifier':'Répondre si je veux préciser les causes')+'</button></div>';
}

function auN1State(R){
  var rows=(DB&&DB.carnet||[]).filter(function(x){return x&&typeof x.an==='number'&&isFinite(x.an)&&typeof x.ca==='number'&&isFinite(x.ca)&&typeof x.res==='number'&&isFinite(x.res);}).slice().sort(function(a,b){return +a.an-+b.an;});
  var currentYear=+(DB&&DB.exerciseYear||(DB&&DB.ref&&DB.ref.exercice)||0),base=null,current=null;
  if(currentYear){for(var i=0;i<rows.length;i++){if(+rows[i].an===currentYear-1)base=rows[i];if(+rows[i].an===currentYear)current=rows[i];}}
  if(base&&!current&&R&&R.d)current={an:currentYear,ca:R.d.ca,res:R.d.res,note:R.score};
  if(!base&&rows.length>=2){base=rows[rows.length-2];current=rows[rows.length-1];}
  if(base&&current&&typeof current.ca==='number'&&isFinite(current.ca)&&typeof current.res==='number'&&isFinite(current.res)&&+current.an===+base.an+1)return {ready:true,from:base,to:current,ca:+current.ca-(+base.ca),res:+current.res-(+base.res),score:(typeof current.note==='number'&&isFinite(current.note)&&typeof base.note==='number'&&isFinite(base.note))?current.note-base.note:null};
  return {ready:false};
}
function auTruthLedgerHTML(R,P,dq){
  var n1=auN1State(R),M=auProfil(),ids=auCtxOrdre(R),c=auCtx(),pending=ids.filter(function(id){return !c[id];}).slice(0,3).map(auCtxQuestionById),p=point3Calc(R),sim=verdictScoreIsSimulation(R);
  var calculated=[
    'CA HT analysé : '+eur(R.d.ca),
    'Solde de pilotage avant impôt : '+eur(R.d.res)+' · '+pct(R.v.rn),
    'Chiffre minimum annuel : '+(p.attainable?eur(p.breakEven):'non calculable'),
    'Résultat après choc de CA −10 % : '+eur(R.d.ca*.9-R.d.cvT*.9-R.d.cf)
  ];
  var declared=[
    'Modèle : '+M.format,
    'Période économique : '+String((DB&&DB.exerciseYear)||(DB&&DB.ref&&DB.ref.exercice)||'non datée'),
    'Mois actifs : '+(typeof R.d.mois==='number'&&isFinite(R.d.mois)?fr(R.d.mois,0):'— non renseigné')+' · jours ouverts : '+(typeof R.d.jAn==='number'&&isFinite(R.d.jAn)?fr(R.d.jAn,0):'— non renseigné'),
    'Origine : '+(sim?'modèle fictif estimatif':'données déclarées par le client')
  ];
  var n1html=n1.ready?'<b style="color:'+(n1.res>=0?'#168f43':'#c43b45')+'">'+(n1.res>=0?'+':'−')+eur(Math.abs(n1.res))+' de résultat</b><p>'+n1.from.an+' → '+n1.to.an+' · CA '+(n1.ca>=0?'+':'−')+eur(Math.abs(n1.ca))+' · score '+(n1.score===null?'— non calculable':(n1.score>=0?'+':'')+fr(n1.score,0))+' pt(s).</p>':'<b>Comparaison N−1 non calculable</b><p>Aucune période annuelle consécutive et comparable n’est figée. Verdict refuse d’inventer une tendance. Ajoutez les deux exercices dans Trajectoire.</p><button type="button" class="btn sec" onclick="go(\'hist\')">Ouvrir Trajectoire</button>';
  return '<div class="au-sc au-truth-contract" data-audit-truth-ledger><div class="au-tag">Contrat de vérité · calculé, déclaré, à prouver</div><h2 class="au-h">Ce que l’audit sait — et ce qu’il refuse d’inventer</h2><p class="au-p">Chaque conclusion porte son niveau de preuve. Une réponse terrain reste une déclaration jusqu’à ce qu’une pièce ou une mesure comparable la confirme.</p>'+
    '<div class="au-truth-grid"><div class="au-truth-card calc"><span>CALCULÉ</span><b>Moteur Verdict</b>'+calculated.map(function(x){return '<p>✓ '+esc(x)+'</p>';}).join('')+'</div>'+
    '<div class="au-truth-card declared"><span>DÉCLARÉ</span><b>Entrées du dossier</b>'+declared.map(function(x){return '<p>• '+esc(x)+'</p>';}).join('')+'</div>'+
    '<div class="au-truth-card proof"><span>À PROUVER</span><b>Causes opérationnelles</b>'+(pending.length?pending.map(function(q){return '<p>— '+esc(q.proof)+'</p>';}).join(''):'<p>Les questions sélectionnées ont une réponse. Les pièces restent à rapprocher avant décision définitive.</p>')+'</div></div>'+
    '<div class="au-card au-n1-state"><span class="au-k">Évolution propre à votre établissement</span>'+n1html+'</div>'+
    '<p class="note">Les repères externes et les réponses facultatives ne modifient jamais le score. La complétude de '+dq.pct+' % mesure la présence des champs, pas leur exactitude.</p></div>';
}

function auExternalSourcesHTML(R){
  var key=auAuditModelKey(),v=R&&R.v||{},cards=[];
  cards.push({t:'Facturation électronique · calendrier officiel',d:'Depuis le 1er septembre 2026, toutes les entreprises doivent pouvoir recevoir des factures électroniques. Pour les PME et microentreprises, l’obligation d’émettre commence le 1er septembre 2027.',u:'https://entreprendre.service-public.gouv.fr/actualites/A18953'});
  cards.push({t:'Hygiène et allergènes · obligations',d:'Plan de maîtrise sanitaire, hygiène et information écrite sur les allergènes sont des contrôles de conformité distincts du score financier.',u:'https://entreprendre.service-public.gouv.fr/vosdroits/F32189'});
  if(v.ms>=30||['hdg','saison','traiteur','boulangerie','trad'].indexOf(key)>=0)cards.push({t:'Recrutement · France Travail BMO 2026',d:'Le contexte national varie fortement par métier : 57,6 % des projets de cuisiniers et 72,0 % des projets de chefs cuisiniers sont jugés difficiles. Ce contexte n’établit pas votre capacité locale à recruter.',u:'https://statistiques.francetravail.org/bmo/geo?le=0&na=0&pp=2026&ss=1'});
  if(['boulangerie','truck','dark','coffee','trad','pizza','rapide'].indexOf(key)>=0)cards.push({t:'Gaspillage alimentaire · ADEME',d:'L’ADEME publie des repères pour la restauration commerciale. Verdict les utilise comme contexte documentaire, jamais pour estimer vos pertes réelles.',u:'https://librairie.ademe.fr/consommer-autrement/7618-le-gaspillage-alimentaire-dans-la-restauration-commerciale.html'});
  if(['trad','rapide','pizza'].indexOf(key)>=0)cards.push({t:'Observatoire FIDUCIAL 2025 · résultats 2024',d:'Échantillon de 400 points de vente issus d’un réseau de 10 000 clients. Les données décrivent restauration rapide et traditionnelle ; elles ne classent ni un coffee shop, ni un traiteur, ni une dark kitchen.',u:'https://www.fnb-info.fr/medias/fichiers/observatoire_restauration_2025.pdf'});
  return '<div class="au-sc au-external-sources" data-audit-external-context><div class="au-tag">Contexte externe vérifié · hors score</div><h2 class="au-h">Ce que le marché et les obligations changent — sans remplacer vos chiffres</h2><p class="au-p">Ces sources datées servent à préparer une décision ou un contrôle. Elles ne deviennent jamais une moyenne locale ni une économie promise.</p>'+cards.map(function(x){return '<a class="au-source-card" target="_blank" rel="noopener noreferrer" href="'+x.u+'"><span>REPÈRE EXTERNE · NE MODIFIE PAS LE SCORE</span><b>'+esc(x.t)+'</b><p>'+esc(x.d)+'</p><i>Ouvrir la source officielle ↗</i></a>';}).join('')+'</div>';
}

function auSecteurPremiumHTML(R,P){
  var M=auProfil(),g=M.guide,q=P.reponses,lim=auFaible(R),key=auAuditModelKey();
  return '<div class="au-sc"><div class="au-tag">Votre modèle · '+esc(M.format)+'</div><h2 class="au-h">Une analyse construite pour ce métier, sans faux classement</h2>'+
    '<div class="au-card au-model-card"><span class="au-k">Modèle déclaré</span><b style="font-size:20px">'+esc(M.format)+'</b><p class="au-p" style="margin:6px 0 0">Verdict adapte les contrôles et les preuves au modèle <b>'+esc(key)+'</b>. Les comptes et le score, eux, gardent exactement le même moteur.</p>'+
    '<div class="au-model-facts"><div><span>ANGLE</span><b>'+esc(g.angle)+'</b></div><div><span>QUESTION DIRECTRICE</span><b>'+esc(g.question)+'</b></div></div></div>'+
    '<div class="au-card"><span class="au-k">Réponses immédiates du dirigeant</span>'+
      '<div class="au-ok"><span style="flex:1"><b>Où part le plus d’argent ?</b><br><small>'+esc(q.poste.l)+'</small></span><b>'+eur(q.poste.eur)+' · '+pct(q.postePct)+'</b></div>'+
      '<div class="au-ok"><span style="flex:1"><b>Que reste-t-il ?</b><br><small>Solde avant impôt des postes saisis</small></span><b>'+eur(q.resultat)+' · '+pct(q.resultatPct)+'</b></div>'+
      '<div class="au-ok"><span style="flex:1"><b>Quel CA minimum ?</b><br><small>Chiffre minimum de la structure actuelle</small></span><b>'+eur(q.pointMort)+'</b></div>'+
      '<div class="au-ok"><span style="flex:1"><b>Par quoi commencer ?</b><br><small>Facteur le plus limitant du moteur</small></span><b>'+esc(AU_LIB[lim])+'</b></div>'+
      '<div class="au-ok"><span style="flex:1"><b>Si le CA baisse de 10 % ?</b><br><small>Résultat mécanique, mêmes fixes</small></span><b>'+eur(R.d.ca*.9-R.d.cvT*.9-R.d.cf)+'</b></div></div>'+
    '<div class="au-card"><span class="au-k">Contrôles prioritaires propres à ce modèle</span>'+auCtxOrdre(R).slice(0,4).map(function(id){var x=auCtxQuestionById(id);return '<div class="au-ok"><span class="p" style="color:#2563eb">→</span><span>'+esc(x.decides)+'</span></div>';}).join('')+'</div>'+
    '<p class="note">Aucune comparaison locale n’est affichée sans concurrents documentés. Aucun repère sectoriel ne remplace vos données N−1, vos tickets, vos heures ou vos stocks.</p></div>';
}

function auAuditClientOrder(root){
  var wrap=root&&root.querySelector('.au-wrap');if(!wrap)return;var sections=Array.prototype.slice.call(wrap.children).filter(function(x){return x.classList&&x.classList.contains('au-sc');});if(!sections.length)return;
  function byTag(name){name=String(name||'').toLowerCase();for(var i=0;i<sections.length;i++){var tag=sections[i].querySelector('.au-tag'),txt=tag?String(tag.textContent||'').toLowerCase():'';if(txt.indexOf(name)>=0)return sections[i];}return null;}
  var anchor=sections[0],priority=[byTag('le raisonnement'),byTag('le problème principal'),byTag('contrat de vérité'),byTag('les preuves'),root.querySelector('[data-audit-optional]')];
  priority.forEach(function(section){if(!section||section===anchor)return;anchor.parentNode.insertBefore(section,anchor.nextSibling);anchor=section;});
}

/* Ajout des deux chapitres sans toucher à la construction comptable : drawAudit
   est enveloppé une seule fois, après son rendu complet. */
var auDrawAuditV4330=window.drawAudit;
if(typeof auDrawAuditV4330==='function')window.drawAudit=function(){
  auDrawAuditV4330.apply(this,arguments);
  var el=document.getElementById('auditBody'),wrap=el&&el.querySelector('.au-wrap'),R=typeof moteur==='function'?moteur():null;
  if(!wrap||!R||!R.ready||wrap.querySelector('[data-audit-truth-ledger]'))return;
  var P=auditPremiumCalc(R),dq=auDonnees(),tmp=document.createElement('div');
  tmp.innerHTML=auTruthLedgerHTML(R,P,dq)+auExternalSourcesHTML(R);
  while(tmp.firstChild)wrap.appendChild(tmp.firstChild);
  auAuditClientOrder(el);
  var sections=el.querySelectorAll('.au-sc');for(var i=0;i<sections.length;i++)sections[i].classList.add('vu');
};

window.AU_CTX_QUESTIONS=AU_CTX_QUESTIONS;
window.auAuditModelKey=auAuditModelKey;
window.auCtxQuestionById=auCtxQuestionById;
window.auCtxOrdre=auCtxOrdre;
window.auCtx=auCtx;
window.auCtxEtat=auCtxEtat;
window.auCtxStateLabel=auCtxStateLabel;
window.auCtxPourquoi=auCtxPourquoi;
window.auCtxOptionLabel=auCtxOptionLabel;
window.auCtxQuestionActive=auCtxQuestionActive;
window.auCtxRepondre=auCtxRepondre;
window.auCtxConstats=auCtxConstats;
window.auCtxHTML=auCtxHTML;
window.auCtxSummaryHTML=auCtxSummaryHTML;
window.auN1State=auN1State;
window.auTruthLedgerHTML=auTruthLedgerHTML;
window.auExternalSourcesHTML=auExternalSourcesHTML;
window.auSecteurPremiumHTML=auSecteurPremiumHTML;
window.auAuditClientOrder=auAuditClientOrder;
window.addEventListener('load',function(){
  var el=document.getElementById('auditBody');
  if(el&&String(el.innerHTML||'').trim()&&!el.querySelector('[data-audit-truth-ledger]'))setTimeout(function(){window.drawAudit();},0);
},{once:true});
})();

