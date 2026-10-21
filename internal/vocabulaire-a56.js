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
    [/\bPrime cost\b/g, 'Total marchandise + équipe'], [/\bprime cost\b/g, 'total marchandise + équipe'],
    /* ETP : avec un nombre devant, puis seul */
    [/\bd[’']ETP\b/g, 'de temps pleins'],
    [/(\d+(?:[,.]\d+)?)\s?ETP\b/g, function (m, n) { var v = Number(String(n).replace(',', '.')); return n + ' temps plein' + (v > 1 ? 's' : ''); }],
    [/\bCA\s?\/\s?ETP\b/g, 'Ventes par temps plein'], [/\bETP\b/g, 'temps pleins'],
    /* C184 : marge de contribution, points, virgule française */
    [/\bContribution % CA\b/g, 'Reste après achats (% des ventes)'], [/\b([Ll])a marge de contribution\b/g, '$1a marge après achats'], [/\b[Mm]arge de contribution\b/g, function (m) { return m.charAt(0) === 'M' ? 'Marge après achats' : 'marge après achats'; }],
    [/(\d+(?:,\d+)?)\s?pts?\b/g, function (m, n) { var v = Math.abs(Number(String(n).replace(',', '.'))); return n + '\u00a0point' + (v > 1 ? 's' : ''); }],
    [/(\d+)\.(\d+)\s?%/g, '$1,$2\u00a0%'],
    /* C205 (V21) : le chiffre du jour est un MINIMUM (part du minimum du mois), jamais un « objectif » ; « objectif » reste
       réservé à l'ambition (objectif de résultat, objectif choisi du mois). */
    [/\bde l[’']objectif du jour\b/g, 'du minimum du jour'], [/\bl[’']objectif du jour\b/g, 'le minimum du jour'], [/\bL[’']objectif du jour\b/g, 'Le minimum du jour'],
    [/\bObjectif du jour\b/g, 'Minimum du jour'], [/\bobjectif du jour\b/g, 'minimum du jour'], [/\bObjectif dépassé de\b/g, 'Minimum dépassé de'],
    [/^Écart à l[’']objectif$/g, 'Écart au minimum'], [/Écart à l[’']objectif(?= ?:\s?[+−-])/g, 'Écart au minimum'] /* jamais « Écart à l’objectif matière » de la Carte, qui est une vraie cible */, [/\bObjectif non disponible\b/g, 'Minimum non disponible'], [/\bObjectif à recalculer\b/g, 'Minimum à recalculer'],
    [/\bsur un objectif de\b/g, 'sur un minimum de'], [/ (sous|au-dessus de) cet objectif\b/g, ' $1 ce minimum'],
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
  var TEST = /\(s\)|(^|[\s(·:=≈→])-\d|20\d\d-\d\d-\d\d|(^|\s)1\s|objectif|etit déjeuner|co[uû]t humain|masse salariale|food cost|point mort|prime cost|ETP|COÛT HUMAIN|MASSE SALARIALE|POINT MORT|unite\b|\dpièce|\d\spièce|contribution|\d\s?pts?\b|\d\.\d+\s?%/i;
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
      if (!d || !d.body || d.__vx56 || !francais(d)) return; d.__vx56 = true;
      parcourir(d.body);
      new d.defaultView.MutationObserver(function (L) {
        if (!francais(d)) return;
        L.forEach(function (m) { if (m.type === 'characterData') corriger(m.target); else [].forEach.call(m.addedNodes, parcourir); });
      }).observe(d.body, { subtree: true, childList: true, characterData: true });
    } catch (e) {}
  }
  function tour() { brancher(doc); [].forEach.call(doc.querySelectorAll('iframe'), function (f) { try { brancher(f.contentDocument); } catch (e) {} }); }
  var t = setInterval(tour, 1500); if (t && t.unref) t.unref();
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', tour); else tour();
  w.VerdictVocabulaire = { corriger: corriger, regles: R, tour: tour, texte: function (v) { for (var i = 0; i < R.length; i++) v = v.replace(R[i][0], R[i][1]); return v; } };
})();
