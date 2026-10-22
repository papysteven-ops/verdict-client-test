/* C171 — « ✓ Verdict mis à jour » (Steven, 19/10 : « on garde la mise à jour automatique, mais toujours l'indiquer — oui, je
   veux ça parfait »).
   Depuis C166, une nouvelle version s'installe d'elle-même à l'ouverture : plus aucun message, donc le client ne sait plus
   que quelque chose a changé. Ici :
   - juste après une mise à jour (version installée différente de la dernière vue sur cet appareil), un petit message discret,
     une seule fois par version : « ✓ Verdict mis à jour — Nouveau : … » ; il part seul après 7 s, ou d'un appui ;
   - jamais par-dessus l'écran de verrouillage (il attend l'ouverture), jamais à la première installation ;
   - la liste des dernières nouveautés reste dans 🔒 › Version.
   NOUVEAUTES : une ligne par changement visible du client, la plus récente en premier, en mots de client (pas de code). */
(function () {
  'use strict';
  var w = window, doc = document; if (w.top !== w || w.VerdictNouveautes) return;
  var NOUVEAUTES = [
    { id: 'C255', date: '2026-10-22', titre: 'Thème clair : la fenêtre de bienvenue, la présentation « Démonstration fictive », la carte d’import du document comptable et « Option 2 · Saisir mes chiffres » sont claires et lisibles ; la case d’autorisation se coche en vert ; derrière une fenêtre, la page reste visible, simplement assombrie' },
    { id: 'C254', date: '2026-10-22', titre: 'Carte : quand vous retirez un plat, Verdict recalcule toute la carte aussitôt (le plat ne compte plus, 7 de ses clients sur 10 reportés sur les plats de sa catégorie, hypothèse dite). Thème clair plus lisible dans À faire, Budget de ventes et « Carte à construire » ; changer de langue plusieurs fois de suite fonctionne' },
    { id: 'C253', date: '2026-10-22', titre: 'Inventaire en équipe : un comptage complet fait par votre équipe vous arrive bien, comme un comptage partiel, et plusieurs comptages de suite partent tous. L’employé ne voit plus de mention de prix en terminant son comptage' },
    { id: 'C251', date: '2026-10-22', titre: 'Carte : une croix sur chaque plat pour le retirer en un geste (Indice Carte et reste après produits recalculés, « Annuler ») ; une proposition de Vera n’arrive jamais en rouge, elle est ajoutée au prix conseillé ou avec sa portion ajustée ; « Historique » des ajouts, retraits et prix avec leur effet en euros par mois ; « Ajouter un plat » en un geste : le nom suffit, Verdict reprend vos produits et calcule le prix conseillé' },
    { id: 'C250', date: '2026-10-22', titre: 'Accueil : le vert veut dire une vraie marge (au moins 5 % au-dessus du minimum). Juste au-dessus, de 100 à 105 %, le jour, le mois ou l’année s’affiche « de justesse », en bleu, avec ce que cela veut dire. En thème clair, la feuille de la caisse et l’écran vide de Performances sont enfin clairs' },
    { id: 'C249', date: '2026-10-21', titre: 'Carte et Audit : l’analyse complète de l’Audit montre le plat qui contribue le moins dans chaque catégorie (entrées, desserts, boissons…), plus un mélange de toute la carte ; dans « Votre carte en 6 images », le chiffre gardé sur 100 € est le même que celui de la barre (75,7 €)' },
    { id: 'C248', date: '2026-10-22', titre: 'Inventaire plus calme : la carte « Bonjour » ne disparaît plus un instant sous « Que faut-il faire maintenant ? » quand vous comptez, et la reprise de votre Carte ne pousse plus l’écran pendant que vous comptez. Sur un nouvel appareil, vos produits s’ouvrent directement, sans repasser par l’accueil. Les cartes de Verdict dans l’Inventaire suivent la langue choisie' },
    { id: 'C247', date: '2026-10-22', titre: 'Dans toutes les langues : l’Accueil (journées, mois, années, équipe du jour), Simuler, les Priorités, l’écart matière, l’équipe salarié par salarié, la Carte en 6 images et la carte idéale, Vera « plats de saison », la consommation, les alertes et les infobulles sont traduits, avec les dates dans la langue choisie. L’Audit reste en français, avec sa notice traduite' },
    { id: 'C246', date: '2026-10-22', titre: 'Rentabilité : partout, Verdict compare votre résultat au repère de votre type d’établissement (par exemple 5 % en médiane et 9 % pour les meilleurs en brasserie), comme dans Simuler, et non plus à un 8 % unique' },
    { id: 'C245', date: '2026-10-22', titre: 'Jours d’ouverture : Verdict ne les invente plus. Si votre document comptable ne les donne pas, une seule question en tête de l’Accueil vous les demande, et le minimum de chaque jour se cale sur votre réponse' },
    { id: 'C244', date: '2026-10-21', titre: 'Dans toutes les langues : la priorité « écart matière » et les prix de l’écran Abonnement (1 établissement inclus, établissement en plus, tarif fondateur) sont traduits ; vos éditions personnelles ont les mêmes écrans que l’application' },
    { id: 'C243', date: '2026-10-21', titre: 'Équipe › Tester une décision : la boîte est claire et lisible en mode clair (elle restait sombre avec vos propres chiffres)' },
    { id: 'C242', date: '2026-10-21', titre: 'Quand votre iPhone ou votre Mac passe en sombre ou en clair, Verdict suit aussitôt, sans recharger, même installé sur l’écran d’accueil' },
    { id: 'C241', date: '2026-10-21', titre: 'Thème clair : les fenêtres « Comparer mes établissements » et « Ajouter un établissement » sont claires et lisibles, même quand Verdict est ouvert seul ; le thème sombre ne change pas' },
    { id: 'C240', date: '2026-10-21', titre: 'Accueil : juste après « Enregistrer ma journée », l’onglet Mois compte aussitôt votre journée ; une journée sans tickets dit « non renseignés » ; en année partielle, la projection montre l’écart entre votre mois le plus faible et le plus fort' },
    { id: 'C239', date: '2026-10-21', titre: 'J’ai ouvert récemment : « Importer mes chiffres » ouvre bien la page d’import et Structure ne montre plus d’Indice. Abonnement : en Pro fondateur, le total de vos établissements donne votre tarif fondateur (138 € puis 168 € HT/mois pour 2). À faire s’ouvre sans l’ancien écran sombre, et « Protégez votre historique » se lit en thème clair' },
    { id: 'C238', date: '2026-10-21', titre: 'Inventaire en équipe : l’employé qui ouvre votre lien arrive directement sur Compter, écrit son nom dans « Inventaire réalisé par » sans bandeau « Modifications non enregistrées », et son nom est gardé jusqu’à l’envoi. Votre prénom n’est plus jamais remplacé par le sien, et un comptage enregistré ne contient plus aucun prix. Après une mise à jour, une page gardée par votre navigateur ne reste plus jamais bloquée : elle se recharge seule sur la nouvelle version' },
    { id: 'C236', date: '2026-10-21', titre: 'Abonnement : les prix en deux blocs clairs. Votre abonnement (1 établissement inclus) : Pilotage 69 €, Pro 129 € HT/mois ; puis chaque établissement en plus : +39 € ou +69 €' },
    { id: 'C235', date: '2026-10-21', titre: 'Écran Abonnement : avec votre compte, le prix d’un établissement en plus redonne aussi le montant à l’année (+390 € HT en Pilotage, +690 € HT en Pro)' },
    { id: 'C234', date: '2026-10-21', titre: 'Argent : les mois de l’an dernier (de juillet à novembre) s’ouvrent bien quand vous les touchez, et leurs boutons se voient aussi en thème clair' },
    { id: 'C233', date: '2026-10-21', titre: 'À faire, Alertes et Équipe lisibles en mode clair. « À faire » dit ce que vous achetez de trop en nourriture, combien (en euros) et quoi faire, étape par étape' },
    { id: 'C231', date: '2026-10-21', titre: 'Mêmes écrans partout et dans toutes les langues : l’abonnement lu sur votre compte, les verrous, la lecture rapide et les minimums du jour sont traduits dans les 7 langues, et l’exemple d’exercice décalé est le même partout' },
    { id: 'C230', date: '2026-10-21', titre: 'Plusieurs établissements : un établissement créé « à partir de la référence » ouvre son propre Accueil, même quand vous le créez depuis la Carte (plus jamais le nom, la date ni les chiffres de la référence) ; dans Comparer, le résultat est dit « avant impôt »' },
    { id: 'C229', date: '2026-10-21', titre: 'Inventaire et Carte ne font qu’un : les factures déposées dans l’Inventaire arrivent dans Pilotage et leurs prix dans vos fiches, un produit facturé se relie à son ingrédient (« Entrecote VBF » = « Entrecôte de bœuf »), et l’Inventaire est gardé sur votre compte. Nouveau : « Partager » donne à votre équipe un lien qui ouvre l’Inventaire seul, sans Pilotage ni Carte, sans prix ni chiffre d’affaires ; l’équipe compte, vous recevez le comptage. Plus de bandeau sur les champs pendant le comptage, « prix connus 33/42 » dans l’Analyse' },
    { id: 'C228', date: '2026-10-21', titre: 'Votre choix de départ est gardé : après la création de votre compte, Verdict revient sur l’import de votre document comptable (FEC), sans assistant de saisie ; dans « Un seul passage », un coût saisi « 4,20 » reste écrit « 4,20 »' },
    { id: 'C227', date: '2026-10-21', titre: 'Page Compte : en Pro fondateur, le montant réellement dû la première année puis le prix fondateur (par exemple 138 € HT par mois pour 2 établissements, puis 168 €) ; « Choisir une formule » n’apparaît plus quand votre formule est payée ; un lien de nouveau mot de passe ouvert en étant connecté montre son formulaire et explique ce qui va se passer' },
    { id: 'C226', date: '2026-10-21', titre: 'Votre formule est respectée : avec un compte Pilotage, l’appli est en Pilotage, et l’écran Abonnement affiche votre formule, votre essai ou votre prochaine échéance. Les écrans réservés à Pro sont lisibles en thème clair, et le coût par service mène à votre équipe. La lecture rapide reprend vos achats sans inventer de répartition, le rappel de sauvegarde n’interrompt plus un import, et le contrôle du type d’établissement s’affiche dès qu’on le change' },
    { id: 'C225', date: '2026-10-21', titre: 'Minimums encore plus justes : vos jours de fermeture comptent même sans caisse (6 jours par semaine = dimanche fermé), une activité saisonnière porte ses charges sur ses mois ouverts sans réclamer de journées pendant la fermeture, l’avance du mois est la même partout, et l’onglet Argent lit le chiffre d’affaires et les achats du mois dans votre document comptable' },
    { id: 'C224', date: '2026-10-21', titre: 'Inventaire gratuit sans pression : une fois l’Inventaire choisi, plus de pastille d’essai ; Pilotage et Carte restent visibles mais floutés, avec une seule proposition « Essayer 14 jours », et tout se débloque à l’essai. Une seule question avant votre document comptable. Un abonnement terminé se dit « Abonnement terminé · vos données sont conservées », plus « Essai terminé »' },
    { id: 'C223', date: '2026-10-21', titre: 'Accueil › Mois : l’équipe de ce mois-ci n’est plus dite deux fois. « Ventes et heures par service » la donne (jauge, € de trop) ; « Comparer les mois » commence par le mois prochain' },
    { id: 'C222', date: '2026-10-21', titre: 'Vos journées : un seul calendrier, clair. Chaque case dit son pourcentage du minimum, avec sa couleur Verdict : vert atteint ; jaune, orange ou rouge, il manque' },
    { id: 'C221', date: '2026-10-21', titre: 'Accueil › Mois : plus de journées ici. Touchez janvier, février… dans « Vos mois » : le détail de ce mois s’affiche (encaissé ou projeté, minimum, écart, jours, tickets, panier)' },
    { id: 'C219', date: '2026-10-21', titre: 'Toutes les langues à jour : les nouveautés de ces derniers jours (abonnement et offres Pilotage et Pro, type d’établissement, notes pas encore mesurées, minimums du jour, ajout d’un établissement, ouverture par empreinte) sont traduites dans les 7 langues ; la démonstration dit « 24 mois détaillés · journées depuis 2021 » et donne partout les mêmes chiffres ; plus de « fiches complètes » quand aucune fiche n’existe encore' },
    { id: 'C218', date: '2026-10-21', titre: 'Carte, établissements, Simuler et Audit : Verdict ne vous propose plus jamais d’attirer plus de clients ; le gain de vos nouveaux prix est le même dans la Carte, Simuler et l’Audit, qui montre aussi l’écart entre vos achats et vos fiches ; un nouvel établissement garde son propre nom et son prix est annoncé (+39 € HT par mois en Pilotage, +69 € HT en Pro) ; la comparaison montre un établissement complet même seul ; la carte idéale lit votre saison et vos couverts dans votre caisse ; Décisions suit vos factures sans recharger' },
    { id: 'C217', date: '2026-10-21', titre: 'Inventaire relié à vos documents : vos factures se déposent aussi dans l’Inventaire gratuit et leurs prix mettent à jour vos produits (valeur du stock, commandes) ; avec Pilotage, les ingrédients de votre Carte deviennent vos produits en un geste et la commande suit vos ventes ; un prix non saisi n’est plus jamais compté 0 € ; « Rapprocher un produit » se remplit depuis vos comptages ; l’Inventaire s’ouvre directement depuis le site, sans écran d’attente ni faux « Réseau faible »' },
    { id: 'C216', date: '2026-10-21', titre: 'Import de vos documents plus simple : écrans lisibles en thème clair, jours d’ouverture lus dans votre caisse au lieu d’être redemandés, TVA et dates d’exercice de votre FEC exactes, part du gérant reprise du FEC' },
    { id: 'C215', date: '2026-10-21', titre: 'Comptes Verdict, prêts pour leur ouverture : l’essai de 14 jours de Verdict Pro démarrera à la création du compte, une seule fois, sans carte ; la page Compte dit votre formule, la fin de l’essai ou la prochaine échéance, le total pour plusieurs établissements et « Gérer ou résilier », avec des messages en clair ; une fois connecté, les établissements de cet appareil iront dans votre compte sans rien effacer ; les liens de confirmation d’adresse et de nouveau mot de passe s’ouvrent ; d’ici là, Verdict reste en découverte et vos données restent sur votre appareil' },
    { id: 'C214', date: '2026-10-21', titre: 'Moins de questions, plus de justesse : une facture reconnaît vos ingrédients même écrits autrement (« Entrecote VBF » = « Entrecôte de bœuf ») et met leur prix réel dans vos fiches en une seule validation ; les journées de caisse complètent les tickets au lieu de créer des conflits ; une activité saisonnière a son Indice ; Simuler et le coût par service disent clairement qu’ils sont dans Pro ; l’écran Abonnement mène à votre compte et donne le total de vos établissements ; le type d’établissement est demandé une fois, et une porte « Inventaire gratuit » s’ouvre dès l’accueil' },
    { id: 'C213', date: '2026-10-21', titre: 'Minimums justes du jour à l’année : un seul minimum par mois, réparti selon la saison lue dans votre caisse ou votre FEC ; une caisse importée après le FEC compte dès sa première journée ; les mois d’avant le début du suivi ne sont plus comptés en échec et une journée non saisie n’est plus « renseignée à 0 € » ; vos années passées, l’Argent des derniers mois et l’exercice décalé apparaissent ; la fourchette de l’année n’est affichée que si elle est vérifiée sur vos années passées' },
    { id: 'C212', date: '2026-10-21', titre: 'Offre et essai plus clairs : la pastille d’essai a sa place dans l’en-tête et ne cache plus aucun bouton, l’offre s’ouvre dès le clic et dit la même chose partout (Carte, Audit et Vera dès Pilotage ; prix au mois et à l’an ; offre fondateurs), un seul essai de 14 jours porté par votre compte et toujours un chemin vers l’abonnement ; Consommation est réservée à Pro' },
    { id: 'C210', date: '2026-10-21', titre: 'Écrans plus clairs : la fenêtre Langue est lisible et a un bouton Fermer, l’animation d’ouverture a un bouton Passer et n’allume la zone qu’à l’arrivée du score, l’en-tête et la barre d’établissement tiennent sur téléphone ; des libellés justes pour l’Accès du personnel, le Budget, les Établissements, la décision prioritaire et les journées de caisse' },
    { id: 'C209', date: '2026-10-21', titre: 'Inventaire en thème clair : fond clair et textes lisibles sur ordinateur comme au téléphone, les onglets Compter · Commande · Analyse · Plus en haut, et le thème suit celui de votre appareil sans recharger. Compter indique l’espace affiché (« 44 / 44 · Cuisine · 51 / 51 avec Bar »), et les noms s’écrivent juste : « Échine », « 35 % », litres en « L »' },
    { id: 'C208', date: '2026-10-21', titre: 'Carte : des chiffres qui se tiennent. L’écart à vos objectifs et la part de fiches complètes sont les mêmes partout ; le gain des nouveaux prix est celui de Simuler, dans Ma carte, Décisions, l’Accueil et l’Idéale, avec la raison quand votre plan ne l’ajoute pas ; le montant des Ventes est nommé « reste après produits » et l’Idéale compte tous vos plats' },
    { id: 'C207', date: '2026-10-21', titre: 'Audit plus juste : le bon nombre de chapitres, la même comparaison dans la phrase et le tableau de « La reprise », des montants qui disent HT, par an et quelle période, et l’état de vos sources sans ligne vide' },
    { id: 'C206', date: '2026-10-21', titre: 'Simuler plus juste : « Utiliser comme point de départ » part toujours de vos chiffres enregistrés, comme la carte l’annonce ; un curseur n’est plus dit « au-delà du réaliste » quand il reste dans sa borne ; le registre et le journal des gains donnent le même état, avec les valeurs et leurs unités ; la démonstration repart de zéro à chaque ouverture et le panneau du total ne cache plus la lecture guidée ; « Indice de sérénité » et « Rentabilité » partout' },
    { id: 'C205', date: '2026-10-21', titre: 'Des chiffres qui se tiennent d’un écran à l’autre : la baisse de 10 % des ventes donne le même résultat dans Structure et dans l’Audit (amortissements compris), et le titre de l’Audit suit le test de résistance ; un seul repère de rentabilité partout (8 € pour 100 € vendus) ; une seule fin de mois et un seul nombre de jours restants ; le chiffre du jour s’appelle « minimum » et son écart se recompte (1 786 € − 1 676 € = 110 €) ; le tableau des services montre l’économie d’un service (−300 €) et fait le total ; « achats nourriture » et « matière (nourriture + boissons) » ne sont plus confondus ; dates en français, vrai signe moins, panier à deux décimales.' },
    { id: 'C204', date: '2026-10-21', titre: 'Projection de l’année plus juste : les minimums suivent la saison de vos années passées, chacune lue sur son propre calendrier ; chaque mois à venir est comparé au même mois de l’an dernier à calendrier égal (un samedi de plus ou de moins compte) ; en touchant un mois, la jauge du haut passe sur ce mois avec sa couleur, puis revient à l’année ; sans caisse jour par jour, les 12 mois de votre document comptable servent de référence ; la comparaison avec l’an dernier se fait à la même date, et les couleurs et l’axe de la courbe des mois sont justes' },
    { id: 'C202', date: '2026-10-21', titre: 'Audit : la lecture complète défile enfin, à la molette comme au doigt, chaque chapitre s’ouvre en haut et le sommaire suit le chapitre lu' },
    { id: 'C199', date: '2026-10-21', titre: 'TVA 2027 : fin du régime simplifié au 1er janvier 2027. Votre trésorerie à 13 semaines date vos échéances de TVA selon votre régime, son rythme et votre clôture (lus dans votre FEC, sinon une seule question), sans reconduire les anciens acomptes ; à faire confirmer par votre expert-comptable' },
    { id: 'C198', date: '2026-10-21', titre: 'Sécurité : si Chrome n’est pas à jour sur votre ordinateur, Verdict vous le signale discrètement (vos données sont dans ce navigateur), avec la marche à suivre' },
    { id: 'C196', date: '2026-10-21', titre: 'Équipe du jour : « 41 € pour 100 € vendus » et « 96 € de trop » sont maintenant reliés en une phrase, avec les montants du jour' },
    { id: 'C195', date: '2026-10-21', titre: 'Votre jour de fermeture se lit aussi dans vos journées de caisse : « Mes services » le coche pour vous, et si vous aviez choisi autre chose, Verdict vous le dit et vous laisse décider en un clic' },
    { id: 'C193', date: '2026-10-21', titre: 'Vos journées de caisse se déposent dans « Importer mes chiffres », l’export « ventes par article » les remplit aussi, et vos jours d’ouverture se lisent dans la caisse : rien à saisir' },
    { id: 'C192', date: '2026-10-21', titre: 'Votre carte vient de votre caisse : déposez l’export « ventes par article », Verdict crée toutes vos fiches (prix, TVA, ventes) et ne vous demande que ce qui manque' },
    { id: 'C191', date: '2026-10-21', titre: 'Un salarié en plus, un loyer revu depuis votre dernier bilan ? Indiquez-le en un clic : Verdict garde votre bilan comme référence et calcule à jour' },
    { id: 'C190', date: '2026-10-21', titre: 'Vos vrais documents font foi : FEC et caisse comparés à votre saisie, une seule question pour tout prendre ou garder votre saisie' },
    { id: 'C189', date: '2026-10-21', titre: 'Mon équipe, salarié par salarié : trop de monde ou mauvais horaires ? Et sans lui ? (avant / après), saisons et grands coûts' },
    { id: 'C188', date: '2026-10-21', titre: 'Le mode sombre suit de nouveau votre iPhone ; jauge en couleur sur « Ventes et heures par service »' },
    { id: 'C187', date: '2026-10-21', titre: 'Démonstration plus réaliste : achats suivant la carte, heures qui changent d’une année à l’autre, sommaire de l’Audit plus clair' },
    { id: 'C186', date: '2026-10-21', titre: 'Ventes et heures par service : la conclusion en titre, trois phrases simples et un tableau « En trop » en euros' },
    { id: 'C185', date: '2026-10-21', titre: 'Accueil › Jour : les repères suivent aussi le jour touché ; chiffres recoupés (ventes au même jour du mois précédent, plus de dates futures), démonstration et Aide corrigées' },
    { id: 'C184', date: '2026-10-21', titre: 'Salaires, Alertes, Simuler, Structure, Organisation et Recommandations en mots simples, sans jargon' },
    { id: 'C183', date: '2026-10-20', titre: 'Accueil › Jour : touchez un jour de « Vos journées » pour revoir tout son détail (journée, courbe, ventes et heures par service)' },
    { id: 'C182', date: '2026-10-20', titre: 'Carte et Inventaire en mots simples : un seul prix conseillé par plat, familles de plats en clair, stock et commandes lisibles' },
    { id: 'C180', date: '2026-10-20', titre: 'Coût de l’équipe : les mêmes seuils partout (Priorités, Simuler, score, alertes) — conseillé pour votre type d’établissement, à surveiller jusqu’à +5 points' },
    { id: 'C179', date: '2026-10-20', titre: 'Un seul nom partout : coût de l’équipe, coût de la marchandise, seuil de rentabilité, temps pleins — et les mêmes seuils sur tous les écrans' },
    { id: 'C178', date: '2026-10-20', titre: 'Accueil en mots simples : « il vous reste X € pour 100 € vendus », ventes hors TVA, salaires conseillés pour votre type d’établissement' },
    { id: 'C177', date: '2026-10-20', titre: 'Minimum du jour : chaque chiffre expliqué, avec le calcul (ex. 1 676 € − 170 € = 1 506 €)' },
    { id: 'C176', date: '2026-10-20', titre: 'L’essentiel d’abord : Ma carte s’ouvre sur vos plats, l’Accueil sur votre journée, Décisions sur les actions' },
    { id: 'C175', date: '2026-10-19', titre: 'Plus de bandeau « Nouvelle version » : Verdict se met à jour tout seul, sans rien vous demander' },
    { id: 'C174', date: '2026-10-19', titre: 'Repères & secteur : la masse salariale se compare au repère de votre format d’établissement, le même que dans la décision et les cartes Équipe' },
    { id: 'C173', date: '2026-10-19', titre: 'Repères & secteur : le radar « La structure en un regard » est retiré, place aux 9 repères' },
    { id: 'C172', date: '2026-10-19', titre: 'Accueil › Mois : l’équipe en direct (jauge verte à rouge) et les heures à prévoir le mois prochain' },
    { id: 'C171', date: '2026-10-19', titre: 'Après chaque mise à jour, Verdict vous dit ce qui est nouveau' },
    { id: 'C170', date: '2026-10-19', titre: 'Accueil › Jour : limite de consommation et décision prioritaire regroupées tout en bas' },
    { id: 'C169', date: '2026-10-19', titre: 'Ventes et heures par service : coût de l’équipe en euros et part de chaque service dans le CA' },
    { id: 'C168', date: '2026-10-19', titre: 'Ventes et heures par service (Jour, Mois, Année) : ce que rapporte une heure de travail, midi et soir' },
    { id: 'C167', date: '2026-10-19', titre: 'Courbe des journées : elle se fait glisser à la souris' },
    { id: 'C166', date: '2026-10-19', titre: 'Mises à jour automatiques à l’ouverture, sans bouton à toucher' }
  ];
  var CLE_VERSION = 'verdict:version-vue', CLE_NOUV = 'verdict:nouveaute-vue';
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(id) { return +String(id || '').replace(/\D/g, '') || 0; }
  /* Nouveautés jamais montrées sur cet appareil (plus récentes que la dernière vue). */
  function nonVues(vue) { var n = num(vue); return NOUVEAUTES.filter(function (x) { return num(x.id) > n; }); }
  /* Décision pure : que montrer, étant donné la version installée et ce que l'appareil a déjà vu ? */
  function decider(courante, versionVue, nouvVue) {
    if (!courante) return { montrer: false, attendre: true };
    if (!versionVue) return { montrer: false, premiere: true };
    if (versionVue === courante) return { montrer: false };
    var L = nonVues(nouvVue);
    return { montrer: true, titre: L.length ? L[0].titre : 'Améliorations et corrections', autres: Math.max(0, L.length - 1) };
  }
  function marquer(courante) { ecrire(CLE_VERSION, courante); if (NOUVEAUTES.length) ecrire(CLE_NOUV, NOUVEAUTES[0].id); }

  function sombre() {
    var h = doc.documentElement; if (h.classList.contains('vd-workspace-dark')) return true; if (h.classList.contains('vd-workspace-light')) return false;
    return !!(w.matchMedia && w.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function css() {
    if (doc.getElementById('nv53-css')) return;
    var s = doc.createElement('style'); s.id = 'nv53-css';
    s.textContent = '#nv53{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147482990;display:flex;align-items:center;gap:12px;' +
      'width:max-content;max-width:min(520px,calc(100% - 24px));box-sizing:border-box;padding:12px 16px 12px 12px;border-radius:16px;background:#0f172a;color:#fff;' +
      'box-shadow:0 14px 40px rgba(15,23,42,.35);font:500 14px/1.35 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;cursor:pointer;animation:nv53In .35s ease-out both}' +
      '#nv53 i{flex:none;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#22c55e;color:#04150b;font:900 15px/1 system-ui;font-style:normal}' +
      '#nv53 b{display:block;font-size:15px;font-weight:800}#nv53 small{display:block;opacity:.8;font-size:13px}' +
      '#nv53.nv53-clair{background:#fff;color:#0f172a;border:1px solid rgba(15,23,42,.12);box-shadow:0 14px 40px rgba(0,0,0,.5)}' +
      '#nv53.nv53-part{animation:nv53Out .3s ease-in both}' +
      '@media (max-width:820px){#nv53{bottom:calc(104px + env(safe-area-inset-bottom,0px))}}' +
      '@keyframes nv53In{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}' +
      '@keyframes nv53Out{to{opacity:0;transform:translate(-50%,12px)}}' +
      '@media (prefers-reduced-motion:reduce){#nv53,#nv53.nv53-part{animation:none}}';
    (doc.head || doc.documentElement).appendChild(s);
  }
  function montrer(D) {
    if (doc.getElementById('nv53')) return;
    css();
    var b = doc.createElement('div'); b.id = 'nv53'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite');
    b.innerHTML = '<i aria-hidden="true">✓</i><span><b>Verdict mis à jour</b><small>Nouveau : ' + esc(D.titre) + (D.autres ? ' · et ' + D.autres + ' autre' + (D.autres > 1 ? 's' : '') + ' dans 🔒 › Version' : '') + '</small></span>';
    b.classList.toggle('nv53-clair', sombre());
    var parti = false;
    function partir() { if (parti) return; parti = true; b.classList.add('nv53-part'); setTimeout(function () { if (b.parentNode) b.remove(); }, 320); }
    b.addEventListener('click', partir);
    doc.body.appendChild(b);
    setTimeout(partir, 7000);
  }
  /* Le message attend que l'appli soit ouverte (verrou levé), visible, et que la version installée soit connue. */
  function verrouVisible() { var v = doc.getElementById('vr16'); return !!(v && !v.hidden && v.getClientRects().length); }
  var essais = 0, fait = false;
  function tour() {
    if (fait) return;
    if (essais++ > 90) return;
    if (doc.hidden || verrouVisible() || !doc.body || !w.VerdictMaj || !w.VerdictMaj.etat) return setTimeout(tour, 1000);
    w.VerdictMaj.etat().then(function (e) {
      var cour = e && e.courante, D = decider(cour, lire(CLE_VERSION), lire(CLE_NOUV));
      if (D.attendre) return setTimeout(tour, 2000);
      fait = true;
      if (D.montrer) montrer(D);
      marquer(cour);
    }, function () { setTimeout(tour, 2000); });
  }
  setTimeout(tour, 2500);

  /* 🔒 › Version : les dernières nouveautés. */
  function listeHTML(n) {
    var L = NOUVEAUTES.slice(0, n || 6), M = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    return '<details class="nv53-liste" style="margin:2px 0 10px;text-align:left;font-size:13px;color:#a3adb8"><summary style="cursor:pointer;min-height:32px;align-content:center;color:#cbd5e1;font-weight:600">Nouveautés</summary><ul style="margin:4px 0 0;padding-left:18px;line-height:1.45">' +
      L.map(function (x) { var p = x.date.split('-'); return '<li style="margin:0 0 4px">' + esc(x.titre) + ' <span style="opacity:.7;white-space:nowrap">· ' + (+p[2]) + '\u00a0' + M[+p[1] - 1] + '</span></li>'; }).join('') + '</ul></details>';
  }
  w.VerdictNouveautes = { liste: NOUVEAUTES, decider: decider, listeHTML: listeHTML, montrer: montrer, nonVues: nonVues };
})();
