/* C179 — Un seul nom par notion, partout (Steven, 20/10 : « je ne veux plus réfléchir “c'est quoi ?” ; si moi je me demande,
   un client débutant ne va rien comprendre »). La relecture des 30 écrans a trouvé la même chose sous 3 ou 4 noms :
   masse salariale, coût humain (chargé), équipe ; food cost, coût matière ; point mort ; ETP ; prime cost…
   Ces mots sont dans des centaines de textes (et dans les traductions) : plutôt que de les réécrire un à un, ce glossaire
   remplace, à l'affichage et en français seulement, le mot technique par le mot du patron, avec la bonne grammaire :
     coût humain / masse salariale → coût de l'équipe   ·   food cost → coût de la marchandise
     point mort → chiffre minimum (le nom déjà employé partout)   ·   7,0 ETP → 7,0 temps pleins   ·   prime cost → marchandise + équipe
   Jamais dans un champ de saisie, un script ou un texte modifiable ; un texte corrigé ne contient plus le mot, donc il
   n'est jamais retouché (0 changement au repos). Les calculs ne lisent pas ces mots. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.VerdictVocabulaire) return;
  var R = [
    /* coût humain (avec ou sans « chargé ») */
    [/\b([Dd])u coût humain chargé(?![\wÀ-ÿ])/g, '$1u coût de l’équipe'], [/\b([Dd])u coût humain\b/g, '$1u coût de l’équipe'],
    [/\bCoût humain chargé(?![\wÀ-ÿ])/g, 'Coût de l’équipe'], [/\bcoût humain chargé(?![\wÀ-ÿ])/g, 'coût de l’équipe'],
    [/\bCoût humain\b/g, 'Coût de l’équipe'], [/\bcoût humain\b/g, 'coût de l’équipe'], [/\bCOÛT HUMAIN\b/g, 'COÛT DE L’ÉQUIPE'],
    /* masse salariale (féminin → masculin : les articles suivent) */
    [/\b([Dd])e la masse salariale\b/g, function (m, d) { return (d === 'D' ? 'D' : 'd') + 'u coût de l’équipe'; }],
    [/\b([Mm])asse salariale mensuelle\b/g, function (m, M) { return (M === 'M' ? 'C' : 'c') + 'oût de l’équipe mensuel'; }], [/\b([Mm])asse salariale annuelle\b/g, function (m, M) { return (M === 'M' ? 'C' : 'c') + 'oût de l’équipe annuel'; }],
    [/\bLa masse salariale\b/g, 'Le coût de l’équipe'], [/\bla masse salariale\b/g, 'le coût de l’équipe'],
    [/\b([Vv])otre masse salariale\b/g, '$1otre coût d’équipe'], [/\bMasse salariale\b/g, 'Coût de l’équipe'], [/\bmasse salariale\b/g, 'coût de l’équipe'],
    [/\bMASSE SALARIALE\b/g, 'COÛT DE L’ÉQUIPE'],
    /* food cost */
    [/\bFood cost\b/g, 'Coût de la marchandise'], [/\bfood cost\b/gi, 'coût de la marchandise'],
    /* point mort */
    [/\bPoints morts\b/g, 'Chiffres minimums'], [/\bpoints morts\b/g, 'chiffres minimums'], [/\bPoint mort\b/g, 'Chiffre minimum'], [/\bpoint mort\b/g, 'chiffre minimum'], [/\bPOINT MORT\b/g, 'CHIFFRE MINIMUM'], /* le nom déjà employé partout dans l'appli */
    /* prime cost */
    /* C301 (V15-050) : le prime cost du moteur est la nourriture + l'équipe, hors boissons (v.pc) ; « Cuisine + salaires » est la même notion */
    [/\bLe prime cost\b/g, 'La nourriture + équipe'], [/\ble prime cost\b/g, 'la nourriture + équipe'], [/\b([Dd])u prime cost\b/g, '$1e la nourriture + équipe'], [/\bPrime cost\b/g, 'Nourriture + équipe'], [/\bprime cost\b/g, 'nourriture + équipe'], [/\bCuisine \+ salaires\b/g, 'Nourriture + équipe'],
    /* ETP : avec un nombre devant, puis seul */
    [/\bd[’']ETP\b/g, 'de temps pleins'],
    [/(\d+(?:[,.]\d+)?)\s?ETP\b/g, function (m, n) { var v = Number(String(n).replace(',', '.')); return n + ' temps plein' + (v > 1 ? 's' : ''); }],
    [/\bCA\s?\/\s?ETP\b/g, 'Ventes par temps plein'], [/\bETP\b/g, 'temps pleins'],
    /* C184 : marge de contribution, points, virgule française */
    [/\bContribution % CA\b/g, 'Reste après achats (% des ventes)'], [/\b([Ll])a marge de contribution\b/g, '$1a marge après achats'], [/\b[Mm]arge de contribution\b/g, function (m) { return m.charAt(0) === 'M' ? 'Marge après achats' : 'marge après achats'; }],
    [/(\d+(?:,\d+)?)\s?pts?\b/g, function (m, n) { var v = Math.abs(Number(String(n).replace(',', '.'))); return n + '\u00a0point' + (v >= 2 ? 's' : ''); /* C311 (V16-026, détail) : « 1,5 point », pluriel à partir de 2 */ }],
    [/(\d+)\.(\d+)\s?%/g, '$1,$2\u00a0%'],
    /* C205 (V21) : le chiffre du jour est un MINIMUM (part du minimum du mois), jamais un « objectif » ; « objectif » reste
       réservé à l'ambition (objectif de résultat, objectif choisi du mois). */
    [/\bde l[’']objectif du jour\b/g, 'du minimum du jour'], [/\bl[’']objectif du jour\b/g, 'le minimum du jour'], [/\bL[’']objectif du jour\b/g, 'Le minimum du jour'],
    [/\bObjectif du jour\b/g, 'Minimum du jour'], [/\bobjectif du jour\b/g, 'minimum du jour'], [/\bObjectif dépassé de\b/g, 'Minimum dépassé de'],
    [/^Écart à l[’']objectif$/g, 'Écart au minimum'], [/Écart à l[’']objectif(?= ?:\s?[+−-])/g, 'Écart au minimum'] /* jamais « Écart à l’objectif matière » de la Carte, qui est une vraie cible */, [/\bObjectif non disponible\b/g, 'Minimum non disponible'], [/\bObjectif à recalculer\b/g, 'Minimum à recalculer'],
    [/\bsur un objectif de\b/g, 'sur un minimum de'], [/ (sous|au-dessus de) cet objectif\b/g, ' $1 ce minimum'],
    /* C299 (V15-121) : la courbe de Performances juge le minimum du jour, comme le reste de l'écran */
    [/\bOBJECTIF À DATE\b/g, 'MINIMUM À DATE'], [/\bOBJECTIF DU JOUR\b/g, 'MINIMUM DU JOUR'],
    [/\bIl manque (jusqu’à 5|5 à 10|plus de 10)([\s\u00a0\u202f])%([\s\u00a0\u202f])de l[’']objectif\b/g, 'Il manque $1$2%$3du minimum'],
    [/^(\d+(?:,\d+)?)([\s\u00a0\u202f])%([\s\u00a0\u202f])de l[’']objectif$/g, '$1$2%$3du minimum'],
    [/ : objectif dépassé de\b/g, ' : minimum dépassé de'], [/ : objectif atteint\b/g, ' : minimum atteint'], [/(^|\s)à son (propre )?objectif\b(?! choisi| de résultat)/g, '$1à son $2minimum'],
    [/(€|\u00a0€) au-dessus de l[’']objectif$/g, '$1 au-dessus du minimum'],
    /* C309 (V16-036) : la journée de Performances est jugée sur son minimum ; la couleur, la légende, l'en-tête et la carte du jour disent le même mot */
    [/(\d)([\s  ])%([\s  ])de son objectif\b(?! choisi| de résultat)/g, '$1$2%$3de son minimum'], [/\bde l[’']objectif attendu à cette date\b/g, 'du minimum attendu à cette date'],
    [/^Objectif atteint$/g, 'Minimum atteint'], [/^Objectif presque atteint$/g, 'Minimum presque atteint'],
    [/(^|· )objectif (atteint|prévu|à confirmer)\b/g, '$1minimum $2'], [/· Objectif (atteint|prévu|à confirmer)\b/g, '· Minimum $1'] /* jamais « Objectif atteint et volume confirmé » de la Carte ni l'objectif de résultat */, [/\bobjectif atteint exactement\b/g, 'minimum atteint exactement'],
    [/\bObjectif à cette date\b/g, 'Minimum à cette date'], [/\bObjectif du mois indisponible\b/g, 'Minimum du mois indisponible'],
    [/\bObjectif calculé (du jour|pour cette journée)\b/g, 'Minimum calculé $1'], [/\bl[’']objectif calculé pour cette journée\b/g, 'le minimum calculé pour cette journée'],
    [/\bObjectif prévu :/g, 'Minimum prévu :'], [/\bObjectif aujourd’hui :/g, 'Minimum aujourd’hui :'],
    [/ a dépassé son objectif de\b/g, ' a dépassé son minimum de'], [/\bjournée sous son objectif\b/g, 'journée sous son minimum'], [/\bun objectif confirmé avant de juger\b/g, 'un minimum confirmé avant de juger'],
    [/\bobjectif à date\b/g, 'minimum à date'], [/(\d)([\s  ])%([\s  ])de l[’']objectif$/g, '$1$2%$3du minimum'],
    /* C299 (L5, V15-127) : les mots d'un patron, pas ceux du moteur */
    [/\bContribution matière pondérée\b/g, 'Marge moyenne des plats vendus'], [/\bobjectif interne pondéré\b/g, 'objectif moyen des plats vendus'],
    [/\bSolde de pilotage avant impôt\b/g, 'Résultat avant impôt'], [/\bsensibilité mécanique\b/g, 'effet direct'],
    [/\bVera explique ; le moteur Verdict calcule\./g, 'Vera explique ; Verdict fait les calculs.'], [/\btrois occurrences comparables\b/g, 'au moins trois services comparables'],
    [/\bde l[’']application CHR\b/g, 'de Verdict'], [/\bsans exposer les données au personnel Inventaire\b/g, 'sans montrer ces chiffres à l’équipe qui fait l’inventaire'],
    [/\bstatistique FIBEN publiée\b/g, 'statistique publiée par la Banque de France'], [/\bstatistique sectorielle FIBEN\b/g, 'statistique sectorielle de la Banque de France'],
    /* C317 (T4) : « FIBEN » est un mot de banquier ; le patron lit « Banque de France » (la source et la période restent écrites) */
    [/\bBanque de France FIBEN\b/g, 'Banque de France'], [/ FIBEN(?=[\s.,;:)·]|$)/g, ' de la Banque de France'], [/\bFIBEN\b/g, 'Banque de France'],
    /* C205 (V55) : une seule orthographe */
    [/\b([Pp])etit déjeuner\b/g, '$1etit-déjeuner'],
    /* C205 (V43, V44) : écriture française des montants et des dates, partout à l'affichage.
       Signe moins typographique devant un montant ou un pourcentage (« -23 € » → « −23 € ») ;
       date ISO isolée → date en français (« 2026-10-20 » → « 20 octobre 2026 ») ; « 1 déc. » → « 1er déc. » ;
       « 3 fiche(s) » → « 3 fiches », « 1 plat(s) » → « 1 plat ». */
    [/(^|[\s(·:=≈→])-(?=\d[\d\s  ]*(?:,\d+)?\s?(?:€|%|k€| €| %| €))/g, '$1−'],
    [/(^|[\s(·:])(20\d\d)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?=$|[\s)·,;.])/g, function (m, a, y, mo, d) { var M = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][Number(mo) - 1]; return a + (d === '01' ? '1er' : String(Number(d))) + ' ' + M + ' ' + y; }],
    [/(^|[^\d\s  ,.])(\s| )1(\s| )(janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.|janvier|février|avril|juillet|septembre|octobre|novembre|décembre)(?![\wÀ-ÿ])/g, '$1$21er$3$4'],
    [/^1(\s| )(janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.|janvier|février|avril|juillet|septembre|octobre|novembre|décembre)(?![\wÀ-ÿ])/g, '1er$1$2'],
    [/(\d+)(\s| )([a-zéèêàç]+)\(s\)(?:(\s| )([a-zéèêàç]+)\(s\))?/g, function (m, n, s1, w1, s2, w2) { var p = Number(n) > 1; return n + s1 + w1 + (p ? 's' : '') + (w2 ? s2 + w2 + (p ? 's' : '') : ''); }],
    /* « unite » (sans accent, venu des unités de stock) */
    [/\bunite\b/g, 'unités'],
    /* C187 : une bouteille compte en « unités » partout (l'Inventaire dit unités, l'écart disait pièces) */
    [/(\d)(\s|\u00a0)pièces\b/g, '$1$2unités'], [/(\d)(\s|\u00a0)pièce\b/g, '$1$2unité']
  ];
  var TEST = /\(s\)|(^|[\s(·:=≈→])-\d|20\d\d-\d\d-\d\d|(^|\s)1\s|objectif|etit déjeuner|co[uû]t humain|masse salariale|food cost|point mort|prime cost|cuisine \+ salaires|ETP|COÛT HUMAIN|MASSE SALARIALE|POINT MORT|unite\b|\dpièce|\d\spièce|contribution|\d\s?pts?\b|\d\.\d+\s?%|pilotage avant|mécanique|Vera explique|occurrences comparables|application CHR|personnel Inventaire|FIBEN/i;/* C299 (V15-127) */
  var EXCLU = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, NOSCRIPT: 1, CODE: 1, PRE: 1 };
  function francais(d) { try { var l = (d.defaultView && d.defaultView.LOCALE) || w.LOCALE || d.documentElement.lang || 'fr'; return /^fr/i.test(String(l)); } catch (e) { return true; } }
  function corriger(t) {
    var v = t.nodeValue; if (!v || !TEST.test(v)) return;
    var p = t.parentNode; for (var e = p; e && e.nodeType === 1; e = e.parentNode) { if (EXCLU[e.tagName] || e.isContentEditable || (e.getAttribute && e.getAttribute('data-vocab') === 'non')) return; }
    var n = v; for (var i = 0; i < R.length; i++) n = n.replace(R[i][0], R[i][1]);
    if (n !== v) t.nodeValue = n;
  }
  function parcourir(racine) {
    if (!racine) return;
    if (racine.nodeType === 3) return corriger(racine);
    var d = racine.ownerDocument || racine; if (!d.createTreeWalker) return;
    var it = d.createTreeWalker(racine, 4), t; while ((t = it.nextNode())) corriger(t);
  }
  function brancher(d) {
    try {
      /* C345 : une page de cadre peut se brancher elle-même dès son <head> (racine = <html>) : chaque texte posé par l'analyseur
         est corrigé avant la première image (observateur : passe avant le dessin) */
      var racine = d && (d.body || d.documentElement);
      if (!racine || d.__vx56 || !francais(d)) return; d.__vx56 = true;
      parcourir(racine);
      new d.defaultView.MutationObserver(function (L) {
        if (!francais(d)) return;
        L.forEach(function (m) { if (m.type === 'characterData') corriger(m.target); else [].forEach.call(m.addedNodes, parcourir); });
      }).observe(racine, { subtree: true, childList: true, characterData: true });
    } catch (e) {}
  }
  function tour() { brancher(doc); [].forEach.call(doc.querySelectorAll('iframe'), function (f) { try { brancher(f.contentDocument); } catch (e) {} }); }
  var t = setInterval(tour, 1500); if (t && t.unref) t.unref();
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', tour); else tour();
  /* C345 (décision 27 : jamais un ancien mot puis le bon) : les pages des cadres (srcdoc : Accueil, Carte, Priorités…) étaient
     branchées par la minuterie, jusqu'à 1,5 s après leur affichage (« Objectif du jour », « Masse salariale », « plat(s) » visibles
     puis corrigés). Chaque page donnée à un cadre se branche maintenant elle-même, en tête de son <head>. */
  function dansPage(v) { try { if (typeof v !== 'string' || !francais(doc) || v.indexOf('VerdictVocabulaire.brancher') >= 0) return v; var m = /<head[^>]*>/i.exec(v); if (!m) return v; var i = m.index + m[0].length;
    return v.slice(0, i) + '<script>try{parent.VerdictVocabulaire.brancher(document)}catch(e){}</' + 'script>' + v.slice(i); } catch (e) { return v; } }
  try { (function () { var P = w.HTMLIFrameElement && w.HTMLIFrameElement.prototype, DS = P && Object.getOwnPropertyDescriptor(P, 'srcdoc'); if (!DS || !DS.set || P.__vx56) return; P.__vx56 = true;
    Object.defineProperty(P, 'srcdoc', { configurable: true, enumerable: DS.enumerable, get: DS.get, set: function (v) { return DS.set.call(this, dansPage(v)); } }); })(); } catch (e) {}
  w.VerdictVocabulaire = { corriger: corriger, regles: R, tour: tour, brancher: brancher, texte: function (v) { for (var i = 0; i < R.length; i++) v = v.replace(R[i][0], R[i][1]); return v; } };
})();

/* C301 (V15-026, V15-027, V15-028, V15-003) — Alertes, sans toucher au moteur 029 (enveloppe d'alertesState) :
   · chiffre minimum : « 97 % » est la part du CA de l'ANNÉE qui paie les charges fixes, pas le mois ; rouge seulement quand
     l'année ne couvre pas les charges (≥ 100 %), orange au-dessus du repère de votre format, vert en dessous ;
   · « Rentabilité avant impôt » (le mot de partout) ; « bien au-dessus du repère » quand on dépasse les meilleurs ;
   · coût de la nourriture : le mot « nourriture » et, à côté, la marchandise complète (nourriture + boissons) ;
   · écart matière : le même que l'Audit et Simuler (window.VerdictEcartMatiere : même périmètre, période écrite) ;
   · en-tête « N alerte(s) grave(s) · N vigilance(s) » : les dates limites (lignes jaunes) comptent comme vigilances. */
(function (w) {
  'use strict';
  function n1(x) { return (Math.round(x * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function pc0(x) { return Math.round(x).toLocaleString('fr-FR') + ' %'; }
  function fam() { try { return (typeof w.famActive === 'function' && w.famActive()) || (w.FAMILLES && w.FAMILLES.trad) || null; } catch (e) { return null; } }
  function corriger(A) {
    if (!A || !A.ready || !A.checks) return A;
    var R = null; try { R = w.moteur(); } catch (e) {} if (!R || !R.ready) return A;
    var v = R.v || {}, d = R.d || {}, F = fam(), fmt = ''; try { fmt = (typeof w.fmtActif === 'function' && w.fmtActif()) || ''; } catch (e) {}
    A.checks.forEach(function (c) {
      if (c.n === 'Rentabilité nette') {
        var rr = w.verdictRepereRN(), m = rr.repere, b = rr.cible, N = w.verdictRepereRNNum || n1;
        c.n = 'Rentabilité avant impôt';
        c.ok = v.rn >= m; c.warn = v.rn >= 0;
        c.msg = v.rn < 0 ? 'Structure en perte' : v.rn < m ? 'Sous le repère de votre format (' + N(m) + ' %, les meilleurs ' + N(b) + ' %)'
          : v.rn < b ? 'Au niveau du repère de votre format (' + N(m) + ' %, les meilleurs ' + N(b) + ' %)'
          : 'Bien au-dessus du repère de votre format (' + N(m) + ' %), au niveau des meilleurs (' + N(b) + ' %)';
      } else if (c.n === 'Masse salariale' && F && F.ms && F.ms[2] > 0) {
        /* C311 (V16-010, décision 5) : un seul seuil « trop lourd », le repère haut du format (celui de l'Indice et de Repères) */
        var rep = F.ms[1], haut = F.ms[2];
        c.ok = v.ms <= rep; c.warn = v.ms <= haut;
        c.msg = v.ms > haut ? 'Trop lourd : plus de ' + haut + ' % des ventes' : v.ms > rep ? 'À surveiller : entre ' + rep + ' et ' + haut + ' % des ventes' : 'Sous contrôle';
      } else if (c.n === 'Point mort' && v.pm < 999) {
        var med = F && F.pm ? F.pm[1] : 85;
        c.n = 'Point mort sur l’année';
        c.ok = v.pm <= med; c.warn = v.pm < 100;
        c.msg = v.pm >= 100 ? 'Sur l’année, le chiffre d’affaires ne paie pas toutes les charges'
          : 'Sur l’année, ' + pc0(v.pm) + ' du chiffre d’affaires paie les charges fixes ; il reste ' + pc0(100 - v.pm) +
            (v.pm > med ? ' (repère ' + (fmt || 'de votre format') + ' : ' + pc0(med) + ' au plus)' : '');
      } else if (c.n === 'Food cost') {
        c.n = 'Coût de la nourriture (hors boissons)';
        var ca = Number(d.ca), mat = Number(d.mat);
        if (ca > 0 && mat > 0) c.msg += ' · avec les boissons : ' + n1(mat / ca * 100) + ' % du CA';
      } else if (/^Écart food cost/.test(c.n)) {
        var E = typeof w.VerdictEcartMatiere === 'function' ? w.VerdictEcartMatiere(R) : null;
        if (E) {
          c.n = 'Écart matière (' + E.perimetre + ') : achats ' + E.periode + ' contre fiches';
          c.ok = E.pts < 4; c.warn = E.pts < 8; c.val = n1(E.pts) + ' point' + (Math.abs(E.pts) >= 2 ? 's' : '');
          c.msg = E.pts >= 8 ? 'Écart notable à investiguer' : E.pts >= 4 ? 'Écart modéré' : 'Concorde';
        }
      }
    });
    A.critical = A.checks.filter(function (c) { return !c.warn; });
    A.warning = A.checks.filter(function (c) { return c.warn && !c.ok; });
    A.ok = A.checks.filter(function (c) { return c.ok; });
    return A;
  }
  var dessin = false;
  function brancher() {
    var f = w.alertesState, g = w.drawAlertes;
    if (typeof f !== 'function' || typeof g !== 'function') return false;
    if (f.__c301) return true;
    var nf = function () {
      var A = corriger(f.apply(this, arguments));
      /* C311 (V16-028) : les dates limites sont comptées à part, comme les cases de l'écran Alertes (plus dans les vigilances) */
      if (A && A.ready) { try { var dl = (typeof w.verdictAlertPreferenceOn !== 'function' || w.verdictAlertPreferenceOn('verdict_deadline')) && typeof w.rappels === 'function' ? w.rappels() : []; A.dates = dl && dl.length || 0; } catch (e) { A.dates = 0; } }
      return A;
    };
    nf.__c301 = true; w.alertesState = nf;
    /* C301 (V15-098, suite) : un mois d'avant le début du suivi n'est pas réclamé (« Septembre n'est pas renseigné » pour un client arrivé le 21 octobre) */
    var rp = w.rappels; if (typeof rp === 'function' && !rp.__c301) { var nrp = function () { var L = rp.apply(this, arguments); try { var D = w.DB || {}, now = new Date(), an = String(now.getFullYear()), P = D.performanceYearPlans && D.performanceYearPlans[an], ts = String(P && P.trackingStart || ''); if (/^\d{4}-\d{2}-\d{2}$/.test(ts)) { var debutMois = an + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01'; if (ts >= debutMois) L = (L || []).filter(function (r) { return !r || r.cle !== 'mois'; }); } } catch (e) {} return L; }; nrp.__c301 = true; w.rappels = nrp; }
    /* C324 (T4) : les cases de l'écran Alertes au bon nombre, avec les mots de l'en-tête (« 1 alerte grave », « 2 vigilances »),
       jamais « critique(s) » */
    var kpis = function () { try { if (String(w.LOCALE || 'fr').slice(0, 2) !== 'fr') return; var M = { 'critique(s)': ['alerte grave', 'alertes graves'], 'vigilance': ['vigilance', 'vigilances'], 'date(s) limite(s)': ['date limite', 'dates limites'] };
      [].forEach.call(document.querySelectorAll('#alertesBody .kpi'), function (k) { var lb = k.querySelector('.k'), v = k.querySelector('.v'); if (!lb || !v) return; var key = lb.getAttribute('data-c324') || lb.textContent.trim(); if (!M[key]) return;
        var n = parseInt(String(v.textContent).replace(/[^0-9]/g, ''), 10); lb.setAttribute('data-c324', key); lb.textContent = M[key][n > 1 ? 1 : 0]; }); } catch (e) {} };
    var ng = function () { dessin = true; try { return g.apply(this, arguments); } finally { dessin = false; kpis(); } };
    ng.__c301 = true; w.drawAlertes = ng;
    /* C311 (V16-028) : l'en-tête dit les mêmes nombres que les cases (graves · vigilances · dates limites), au bon nombre */
    var ce = w.chrCockpitEvidence; if (typeof ce === 'function' && !ce.__c311) { var nce = function (v) { var r = ce.apply(this, arguments);
      try { var l = String(w.LOCALE || 'fr').slice(0, 2); if (v === 'alertes' && r && r.main && l === 'fr') { var A = w.alertesState(); if (A && A.ready) {
        var pl = function (n, s, p) { return n + ' ' + (n > 1 ? p : s); }, t = [pl(A.critical.length, 'alerte grave', 'alertes graves'), pl(A.warning.length, 'vigilance', 'vigilances')];
        if (A.dates) t.push(pl(A.dates, 'date limite', 'dates limites')); r.main = t.join(' · '); } } } catch (e) {} return r; };
      nce.__c311 = true; w.chrCockpitEvidence = nce; }
    return true;
  }
  if (!brancher() && typeof w.setInterval === 'function') { var k = 0, iv = w.setInterval(function () { if (brancher() || ++k > 40) w.clearInterval(iv); }, 250); }
  w.VerdictAlertesC301 = { corriger: corriger };
})(window);
