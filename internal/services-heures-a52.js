/* C168 — Ventes et heures, service par service (Steven, 19/10 : « comparez ventes et heures service par service : Verdict ne
   calcule pas ça ? J, M, A — c'est une bonne info pour savoir si le coût salarial et les revenus… c'est brouillon » ; « À faire :
   ça me dit les problèmes, me dit de voir Salaires, et débrouille-toi »).
   Verdict avait les chiffres (heures, taux et CA de chaque service saisis dans Salaires › Équipe ; CA du jour par service ; heures
   du mois midi / soir) mais les rangeait dans trois coins, et « À faire » renvoyait le client faire le calcul lui-même.
   Ici, un seul calcul, affiché dans l'Accueil — Jour, Mois et Année — et repris mot pour mot dans « À faire » :
   - CA HT par heure travaillée = CA HT du service ÷ heures payées du service (la mesure de productivité de la profession) ;
   - poids de l'équipe = coût chargé des heures (heures × taux chargé) ÷ CA HT du service ;
   - repère = part médiane du personnel pour le format de l'établissement (FAMILLES[…].ms[1], ex. 36 % en traditionnel) ;
   - pour le service le plus lourd : CA HT par heure qu'il faudrait pour revenir au repère, et ce que cela représente
     (CA en plus à heures égales, ou heures en trop à CA égal). C'est une lecture, jamais une consigne de réduire l'équipe.
   Sources, par ordre : services saisis avec leurs heures (DB.services) ; à défaut, CA par service du jour (DB.servicesJour) et
   heures du mois midi / soir (DB.laborMonths, Mois et Année seulement). Les journées exceptionnelles sont écartées. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.VerdictServicesHeures) return;

  var NOMS = { breakfast: 'Petit-déjeuner', matin: 'Matin', lunch: 'Midi', midi: 'Midi', afternoon: 'Après-midi', aprem: 'Après-midi', apresmidi: 'Après-midi', dinner: 'Soir', soir: 'Soir' };
  var ORDRE = ['Petit-déjeuner', 'Matin', 'Midi', 'Après-midi', 'Soir'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  function num(x) { x = Number(x); return isFinite(x) ? x : null; }
  function nomService(s) { var k = String(s && s.s || ''); return NOMS[k] || (s && s.label) || 'Journée'; }
  function jourSemaine(iso) { var p = String(iso).split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)).getUTCDay(); }
  function mediane(a) { a = a.slice().sort(function (x, y) { return x - y; }); var n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : null; }

  /* Une ligne de service : CA HT, heures, coût chargé (si le taux est connu). */
  function ligne(s, tva) {
    var h = num(s && s.h), ca = num(s && s.ca), r = num(s && s.rate);
    if (!(h > 0) || ca == null || ca < 0 || (s.exceptional && s.exceptional !== 'normal')) return null;
    return { d: String(s.d), nom: nomService(s), h: h, ht: ca / (1 + (tva || 0)), cout: r != null && r >= 0 ? h * r : null };
  }
  function cumuler(lignes) {
    var g = {}, tot = { nom: 'Total', h: 0, ht: 0, cout: 0, coutConnu: true, n: 0 };
    lignes.forEach(function (l) {
      var x = g[l.nom] || (g[l.nom] = { nom: l.nom, h: 0, ht: 0, cout: 0, coutConnu: true, n: 0, jours: {} });
      [x, tot].forEach(function (y) { y.h += l.h; y.ht += l.ht; y.n++; if (l.cout == null) y.coutConnu = false; else y.cout += l.cout; });
      x.jours[l.d] = 1;
    });
    function fin(y) { y.prod = y.h > 0 ? y.ht / y.h : null; y.part = y.coutConnu && y.ht > 0 ? y.cout / y.ht : null; y.coutHeure = y.coutConnu && y.h > 0 ? y.cout / y.h : null; if (y.jours) { y.nbJours = Object.keys(y.jours).length; delete y.jours; } return y; }
    var L = Object.keys(g).map(function (k) { return fin(g[k]); });
    L.sort(function (a, b) { var i = ORDRE.indexOf(a.nom), j = ORDRE.indexOf(b.nom); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || (a.nom < b.nom ? -1 : 1); });
    return { services: L, total: fin(tot) };
  }

  /* Cœur pur : services = DB.services ; periode = 'jour' | 'mois' | 'annee' ; aujourdhui = 'AAAA-MM-JJ' ; repere = part (0,36). */
  function analyser(services, periode, aujourdhui, tva, repere, secours, choisi) {
    var toutes = (services || []).map(function (s) { return ligne(s, tva); }).filter(function (l) { return l && l.d <= aujourdhui; });
    var cle, lignes;
    if (periode === 'jour') {
      /* C183 (Steven, 20/10, vidéo : « de base le jour J ou le dernier jour enregistré ; mais si le client clique sur un
         jour, il revoit son détail complet — là ça reste sur la même journée ») : le jour choisi dans le calendrier. */
      var dates = toutes.map(function (l) { return l.d; }).sort(); cle = choisi || dates[dates.length - 1] || null;
      lignes = toutes.filter(function (l) { return l.d === cle; });
      if (choisi && !lignes.length) return { periode: periode, cle: choisi, vide: true, jourChoisi: true };
    } else {
      cle = periode === 'mois' ? aujourdhui.slice(0, 7) : aujourdhui.slice(0, 4);
      lignes = toutes.filter(function (l) { return l.d.slice(0, cle.length) === cle; });
    }
    var src = 'services';
    if (!lignes.length && periode !== 'jour' && secours) { lignes = secours(cle); src = 'mois'; }
    if (!lignes.length) return { periode: periode, cle: cle, vide: true };
    var R = cumuler(lignes); R.periode = periode; R.cle = cle; R.source = src; R.repere = repere;
    /* Jour : chaque service face à ses semblables (même service, même jour de semaine, 4 à 8 précédents). */
    if (periode === 'jour') R.services.forEach(function (x) {
      var wd = jourSemaine(cle), par = {};
      toutes.forEach(function (l) { if (l.nom === x.nom && l.d < cle && jourSemaine(l.d) === wd) { var p = par[l.d] || (par[l.d] = { h: 0, ht: 0 }); p.h += l.h; p.ht += l.ht; } });
      var ds = Object.keys(par).sort().reverse().slice(0, 8);
      if (ds.length >= 4) x.habituel = mediane(ds.map(function (d) { return par[d].ht / par[d].h; }));
    });
    /* Le service où l'équipe pèse le plus, et ce qu'il faudrait pour revenir au repère. */
    /* Classement par euros au-dessus du repère (coût − repère × CA HT), pas par pourcentage : un petit service à 47 % pèse
       moins qu'un grand service à 42 %. Moins d'une heure d'écart = dans le repère (bruit d'une journée). */
    var lourds = R.services.filter(function (x) { return x.part != null; }).sort(function (a, b) { return (b.cout - repere * b.ht) - (a.cout - repere * a.ht); });
    if (lourds.length && repere > 0) {
      var x = lourds[0];
      if (x.part > repere) {
        var prodCible = x.coutHeure / repere, enTrop = x.h - x.ht / prodCible;
        if (enTrop >= 1) R.lourd = { nom: x.nom, cout: x.cout, ht: x.ht, part: x.part, prod: x.prod, prodCible: prodCible, caEnPlus: prodCible * x.h - x.ht, heuresEnTrop: enTrop, trop: x.cout - repere * x.ht };
      }
      /* C186 (Steven, 20/10 : « je ne comprends pas pourquoi on parle du soir précisément, le pire c'est le matin ») : on dit
         aussi quels autres services dépassent, et lequel a la part la plus forte, avec ses euros en trop — le choix devient lisible. */
      R.depassent = lourds.filter(function (y) { return y.part > repere + 0.005 && y.cout - repere * y.ht >= 0.5; }).map(function (y) { return { nom: y.nom, part: y.part, trop: y.cout - repere * y.ht }; });
      var pp = lourds.slice().sort(function (a, b) { return b.part - a.part; })[0];
      if (R.lourd && pp && pp.nom !== R.lourd.nom && pp.part > R.lourd.part + 0.005) R.pirePart = { nom: pp.nom, part: pp.part, trop: pp.cout - repere * pp.ht, ht: pp.ht };
      var m = lourds.slice().sort(function (a, b) { return a.part - b.part; })[0];
      /* « Le meilleur » seulement s'il est vraiment dans le conseillé (un service à 45 % n'est pas un exemple). */
      if (lourds.length > 1 && (!R.lourd || m.nom !== R.lourd.nom) && m.part <= repere + 0.005) R.meilleur = { nom: m.nom, cout: m.cout, ht: m.ht, part: m.part, prod: m.prod };
    }
    return R;
  }

  /* À défaut d'heures par service : CA par service (saisie du jour) + heures du mois midi / soir (Salaires). */
  function secoursMois(D, tva) {
    return function (cle) {
      var out = [], sj = D.servicesJour || {}, lm = (D.laborMonths || []).filter(function (r) { return String(r.period).slice(0, cle.length) === cle; });
      lm.forEach(function (r) {
        var dt = r.detail || {}, H = { Midi: num(dt.hMi), Soir: num(dt.hSo) }, taux = r.heures > 0 && r.cout > 0 ? (r.cout - (num(dt.abC) || 0)) / r.heures : null, ca = { Midi: 0, Soir: 0 };
        Object.keys(sj).forEach(function (k) { if (k.slice(0, 7) !== r.period) return; var x = sj[k] || {}; if (x.midi && num(x.midi.ca) != null) ca.Midi += +x.midi.ca; if (x.soir && num(x.soir.ca) != null) ca.Soir += +x.soir.ca; });
        ['Midi', 'Soir'].forEach(function (n) { if (H[n] > 0 && ca[n] > 0) out.push({ d: r.period + '-01', nom: n, h: H[n], ht: ca[n] / (1 + (tva || 0)), cout: taux != null ? H[n] * taux : null }); });
      });
      return out;
    };
  }

  /* ---------- Lecture dans l'appli ---------- */
  function eur(x) { return x == null ? '—' : Math.round(x).toLocaleString('fr-FR') + '\u00a0€'; }
  function pc(x) { return x == null ? '—' : Math.round(x * 100) + '\u00a0%'; }
  function hh(x) { return Math.round(x).toLocaleString('fr-FR') + '\u00a0h'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function repere() {
    try { var t = typeof w.fmtActif === 'function' ? w.fmtActif() : null, F = t && w.FORMATS && w.FORMATS[t] && w.FAMILLES && w.FAMILLES[w.FORMATS[t].f]; F = F || (w.FAMILLES && w.FAMILLES.trad); if (F && F.ms && F.ms[1] > 0) return F.ms[1] / 100; } catch (e) {}
    return 0.36;
  }
  function contexte() {
    var D = w.DB; if (!D) return null; var tva = 0;
    try { var R = typeof w.moteur === 'function' ? w.moteur() : null; tva = R && R.d && num(R.d.tva) != null ? R.d.tva : 0; } catch (e) {}
    if (tva > 1) tva = tva / 100;
    var auj = null; try { auj = String(w.verdictOperationalClock().key).slice(0, 10); } catch (e) {}
    if (!auj) { var n = new Date(); auj = n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); }
    return { D: D, tva: tva, auj: auj, rep: repere() };
  }
  function etat(periode, choisi) { var C = contexte(); if (!C) return null; return analyser(C.D.services, periode, C.auj, C.tva, C.rep, secoursMois(C.D, C.tva), choisi); }
  /* Jour choisi dans « Vos journées » (accueil-courbes-a46.js, C183) : AAAA-MM-JJ, ou null pour le dernier jour saisi. */
  function jourChoisi(d) { return (d && d.__vx46jour) || null; }
  function libelle(R) {
    if (R.periode === 'jour') { var p = R.cle.split('-'); return JOURS[jourSemaine(R.cle)] + ' ' + (+p[2]) + ' ' + MOIS[+p[1] - 1]; }
    if (R.periode === 'mois') { var q = R.cle.split('-'); return MOIS[+q[1] - 1] + ' ' + q[0]; }
    return 'année ' + R.cle;
  }
  /* C188 : les 4 couleurs de la jauge d'équipe (C172/C180), partout pareil : vert ≤ conseillé, jaune ≤ +2 points, orange ≤ +5, rouge au-delà. */
  function couleur(part, rep) { return part == null ? 'info' : part <= rep + 0.005 ? 'vert' : part <= rep + 0.02 ? 'jaune' : part <= rep + 0.05 ? 'orange' : 'rouge'; }
  var COUL = { vert: '#22c55e', jaune: '#eab308', orange: '#f97316', rouge: '#ef4444', info: '#94a3b8' };
  /* C188 (Steven : « jauge Verdict, couleur premium, effet possible ici ») : la jauge du jour / du mois / de l'année, en tête de carte. */
  function jaugeHTML(part, rep) {
    if (part == null || !(rep > 0)) return '';
    var min = Math.max(0, rep - 0.15), max = rep + 0.25, pos = function (v) { return Math.max(0, Math.min(100, (v - min) / (max - min) * 100)); };
    var b = [pos(rep), pos(rep + 0.02), pos(rep + 0.05)], x = pos(part), k = couleur(part, rep), mot = { vert: 'dans le conseillé', jaune: 'juste au-dessus', orange: 'à surveiller', rouge: 'trop lourde' }[k] || '';
    return '<div class="sh52-j" role="img" aria-label="L’équipe coûte ' + Math.round(part * 100) + ' € pour 100 € vendus, conseillé ' + Math.round(rep * 100) + ' € au plus : ' + mot + '">' +
      '<div class="sh52-jb"><i style="left:0;width:' + b[0] + '%;background:linear-gradient(90deg,#15803d,#22c55e)"></i><i style="left:' + b[0] + '%;width:' + (b[1] - b[0]) + '%;background:linear-gradient(90deg,#facc15,#eab308)"></i>' +
      '<i style="left:' + b[1] + '%;width:' + (b[2] - b[1]) + '%;background:linear-gradient(90deg,#fb923c,#f97316)"></i><i style="left:' + b[2] + '%;width:' + (100 - b[2]) + '%;background:linear-gradient(90deg,#ef4444,#991b1b)"></i>' +
      '<em class="sh52-js"></em><span class="sh52-jr" style="left:' + b[0] + '%"></span><b class="sh52-jm" style="left:' + x + '%;--c:' + COUL[k] + '"><span style="transform:translateX(-' + (x > 75 ? 88 : x < 25 ? 12 : 50) + '%)">' + Math.round(part * 100) + '\u00a0€ pour 100\u00a0€ · ' + mot + '</span></b></div>' +
      '<div class="sh52-jl"><span></span><span style="left:' + b[0] + '%">conseillé : ' + Math.round(rep * 100) + '\u00a0€</span><span>trop lourde</span></div></div>';
  }
  /* La phrase utile, la même dans la carte et dans « À faire ». */
  /* C178 (Steven, 20/10 : « je ne veux plus réfléchir “c'est quoi ?” ») : en mots de patron — ventes hors TVA, « € pour
     100 € vendus », conseil du type d'établissement dit comme tel ; plus de « CA HT », « repère », « à heures égales ». */
  function s100(x) { return x == null ? '—' : Math.round(x * 100) + '\u00a0€ pour 100\u00a0€ vendus'; }
  function conseil(R) { return Math.round(R.repere * 100) + '\u00a0€'; }
  var ART = { 'Petit-déjeuner': 'le petit-déjeuner', 'Midi': 'le midi', 'Après-midi': 'l’après-midi', 'Soir': 'le soir', 'Service continu': 'le service continu', 'Livraison': 'la livraison', 'Événement': 'l’événement' };
  function le(nom) { return ART[nom] || '« ' + nom + ' »'; }
  function cap(x) { return x.charAt(0).toUpperCase() + x.slice(1); }
  /* C196 (Steven : « pourquoi 2 chiffres opposés, lequel est juste : 96 ou 41 ? ») : les deux sont justes, l'un en € pour
     100 € vendus, l'autre en euros ; une phrase les relie avec les montants du jour (soustraction juste à l'euro près). */
  function lienHTML(R) {
    var t = tropTotal(R); if (t == null || t < 0.5 || !(R.total.part > R.repere + 0.005)) return '';
    var c = Math.round(R.total.cout), tr = Math.round(t), quand = R.periode === 'jour' ? 'Ce jour-là' : R.periode === 'mois' ? 'Ce mois-ci' : 'Sur l’année';
    return '<p class="sh52-lien">' + esc(quand + ', l’équipe a coûté ' + eur(c) + ' pour ' + eur(R.total.ht) + ' de ventes : ' + s100(R.total.part) + '. Au conseillé (' + conseil(R) + ' pour 100\u00a0€), elle aurait coûté ' + eur(c - tr) + ' : ' + eur(tr) + ' de trop.') + '</p>';
  }
  function tropTotal(R) { return R.total && R.total.cout != null && R.total.ht > 0 ? R.total.cout - R.repere * R.total.ht : null; }
  function phrase(R) {
    if (!R || R.vide) return '';
    var quand = R.periode === 'jour' ? ' ce jour-là' : R.periode === 'mois' ? ' ce mois-ci' : ' sur l’année';
    if (!R.lourd) { var tt = tropTotal(R); return tt != null && tt >= 0.5 && R.total.part > R.repere + 0.005 ? 'Aucun service ne dépasse nettement le conseillé, mais au total l’équipe coûte ' + eur(tt) + ' de trop' + quand + '.' : 'Chaque service reste dans le conseillé' + quand + ' : ' + s100(R.total.part) + ', pour ' + conseil(R) + ' au plus conseillés.'; }
    /* C186 (Steven : « rien ne doit poser question ; il y a plein de chiffres sans même comprendre ») : trois phrases
       courtes — qui pèse le plus et pourquoi, pourquoi pas le service le plus cher en pourcentage, quoi faire. */
    var L = R.lourd, t = cap(le(L.nom)) + ' pèse le plus : ' + eur(L.trop) + ' de trop, car il y a trop d’heures pour les ventes faites.';
    if (R.pirePart) t += ' ' + cap(le(R.pirePart.nom)) + ' coûte cher pour ce qu’il vend, mais il vend peu : ' + eur(R.pirePart.trop) + ' de trop seulement.';
    /* C189 : jamais « vendez plus » (on ne fait pas venir des clients) ; le levier, ce sont les heures. */
    t += ' Pour ' + le(L.nom) + ' : ' + hh(L.heuresEnTrop) + ' de travail en moins pour les mêmes ventes, en calant les horaires sur le vrai rush.';
    return t;
  }
  var CSS = '.sh52 table{width:100%;border-collapse:collapse;font-size:14px;margin:4px 0 10px;font-variant-numeric:tabular-nums}' +
    '.sh52 th{font-size:12px;font-weight:600;opacity:.7;text-align:right;padding:4px 6px;white-space:nowrap}.sh52 th:first-child,.sh52 td:first-child{text-align:left}' +
    '.sh52 td{text-align:right;padding:7px 6px;border-top:1px solid rgba(148,163,184,.22);white-space:nowrap}.sh52 tr.sh52-tot td{font-weight:700}' +
    '.sh52 .sh52-p{display:inline-block;min-width:44px;padding:2px 7px;border-radius:999px;font-weight:700}' +
    '.sh52 .sh52-vert{background:rgba(34,197,94,.16);color:#15803d}.sh52 .sh52-orange{background:rgba(249,115,22,.16);color:#c2410c}.sh52 .sh52-rouge{background:rgba(239,68,68,.16);color:#b91c1c}.sh52 .sh52-info{opacity:.7}' +
    '.sh52 .sh52-jaune{background:rgba(234,179,8,.18);color:#a16207}html.vd-workspace-dark .sh52 .sh52-jaune{color:#facc15}' +
    '.sh52-j{margin:16px 0 12px;padding-top:30px}.sh52-jb{position:relative;height:14px;border-radius:999px;background:rgba(148,163,184,.2);box-shadow:inset 0 1px 2px rgba(15,23,42,.25),0 0 18px -6px var(--sh52-glow,transparent);overflow:visible}' +
    '.sh52-jb>i{position:absolute;top:0;bottom:0;opacity:.95}.sh52-jb>i:first-of-type{border-radius:999px 0 0 999px}.sh52-jb>i:nth-of-type(4){border-radius:0 999px 999px 0}' +
    '.sh52-js{position:absolute;inset:0;border-radius:999px;overflow:hidden;pointer-events:none}.sh52-js::after{content:"";position:absolute;top:0;bottom:0;width:40%;left:-45%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);animation:sh52Shine 1.6s .3s ease-out both}' +
    '.sh52-jr{position:absolute;top:-5px;bottom:-5px;width:2px;margin-left:-1px;background:currentColor;opacity:.55}' +
    '.sh52-jm{position:absolute;top:50%;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:#fff;border:4px solid var(--c);box-shadow:0 0 0 5px color-mix(in srgb,var(--c) 28%,transparent),0 0 22px color-mix(in srgb,var(--c) 70%,transparent),0 6px 14px rgba(15,23,42,.35);animation:sh52In 1s cubic-bezier(.2,.8,.2,1) both}' +
    '.sh52-jm>span{position:absolute;bottom:calc(100% + 9px);left:50%;transform:translateX(-50%);padding:4px 10px;border-radius:999px;background:linear-gradient(180deg,color-mix(in srgb,var(--c) 85%,#fff),var(--c));color:#fff;font:800 13px/1.2 system-ui;white-space:nowrap;box-shadow:0 4px 12px color-mix(in srgb,var(--c) 45%,transparent)}' +
    '.sh52-jl{position:relative;display:flex;justify-content:space-between;margin-top:9px;font-size:12px;opacity:.72}.sh52-jl>span:nth-child(2){position:absolute;transform:translateX(-50%);font-weight:700;white-space:nowrap}' +
    '@keyframes sh52In{from{left:0;opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}@keyframes sh52Shine{to{left:110%}}' +
    '@media (prefers-reduced-motion:reduce){.sh52-jm,.sh52-js::after{animation:none}}' +
    'html.vd-workspace-dark .sh52 .sh52-vert{color:#4ade80}html.vd-workspace-dark .sh52 .sh52-orange{color:#fb923c}html.vd-workspace-dark .sh52 .sh52-rouge{color:#f87171}' +
    '.sh52 .sh52-lien{margin:2px 0 10px;padding:9px 12px;border-radius:12px;background:rgba(148,163,184,.12);font-size:14px;line-height:1.45}.sh52 .sh52-c{display:none}.sh52 small.sh52-s{display:block;font-size:11px;font-weight:500;opacity:.7;margin-top:2px}.sh52 td{vertical-align:top}' +
    '@media (max-width:520px){.sh52 table{font-size:13px}.sh52 th,.sh52 td{padding:6px 3px}.sh52 th,.sh52 td{white-space:normal}.sh52 .sh52-hab,.sh52 .sh52-l{display:none}.sh52 .sh52-c{display:inline}.sh52 .sh52-p{min-width:0;padding:2px 5px}}';
  function carteHTML(R) {
    var jour = R.periode === 'jour', aHab = jour && R.services.some(function (x) { return x.habituel != null; });
    var h = '<p class="kicker">Ventes et heures par service · ' + esc(libelle(R)) + (w.DB && (w.DB.demo || (w.DB.services || []).some(function (s) { return s && s.demo; })) ? ' · démonstration' : '') + '</p>' +
      '<p class="titre">' + esc(R.lourd && tropTotal(R) >= 0.5 ? 'L’équipe a coûté ' + eur(tropTotal(R)) + ' de trop' + (R.periode === 'jour' ? ' ce jour-là' : R.periode === 'mois' ? ' ce mois-ci' : ' sur l’année') : R.lourd ? cap(le(R.lourd.nom)) + ' coûte trop d’équipe' : R.total.part != null && R.total.part > R.repere + 0.005 ? 'L’équipe coûte ' + s100(R.total.part) + ', sur tous les services' : 'Équipe dans le conseillé, service par service') + '</p>' +
      jaugeHTML(R.total.part, R.repere) + lienHTML(R) + '<p class="sous">' + esc(phrase(R)) + '</p><table><thead><tr><th>Service</th><th>Ventes</th><th>Équipe</th><th>En trop</th></tr></thead><tbody>';
    var plusieurs = R.services.length > 1;
    /* C205 (V17) : un service sous le conseillé montre son économie (« −299 € », en vert) au lieu de « OK », et la colonne
       se recompte : la somme des services arrondis égale la ligne Total (écart d'arrondi au plus grand reste). */
    var ecarts = (function () {
      var v = R.services.map(function (x) { return x.coutConnu && x.ht > 0 ? x.cout - R.repere * x.ht : null; });
      if (v.some(function (a) { return a == null; })) return v.map(function (a) { return a == null ? null : Math.round(a); });
      var somme = Math.round(v.reduce(function (s, a) { return s + a; }, 0)), f = v.map(function (a) { return Math.floor(a); }), reste = somme - f.reduce(function (s, a) { return s + a; }, 0);
      v.map(function (a, i) { return i; }).sort(function (i, j) { return (v[j] - f[j]) - (v[i] - f[i]); }).forEach(function (i) { if (reste > 0) { f[i]++; reste--; } });
      return f;
    })();
    R.services.concat(plusieurs ? [R.total] : []).forEach(function (x, ix) {
      var tot = x === R.total, brut = x.coutConnu && x.ht > 0 ? x.cout - R.repere * x.ht : null, trop = brut == null ? null : tot ? Math.round(brut) : ecarts[ix], ok = trop != null && trop <= 0;
      h += '<tr' + (tot ? ' class="sh52-tot"' : '') + '><td>' + esc(x.nom) + '</td>' +
        '<td>' + eur(x.ht) + (plusieurs && !tot && R.total.ht > 0 ? '<small class="sh52-s">' + pc(x.ht / R.total.ht) + ' des ventes</small>' : '') + '</td>' +
        '<td>' + (x.coutConnu ? eur(x.cout) : '—') + '<small class="sh52-s">' + hh(x.h) + ' de travail</small></td>' +
        '<td><span class="sh52-p sh52-' + (trop == null ? 'info' : ok ? 'vert' : couleur(x.part, R.repere)) + '">' + (trop == null ? '—' : trop < 0 ? '\u2212' + eur(-trop) : trop === 0 ? eur(0) : '+' + eur(trop)) + '</span>' +
        (x.part != null ? '<small class="sh52-s">' + Math.round(x.part * 100) + '\u00a0€ pour 100\u00a0€</small>' : '') + '</td></tr>';
    });
    h += '</tbody></table><p class="sous" style="font-size:13px;opacity:.8">' + esc((R.source === 'mois' ? 'Heures du mois midi / soir (Salaires) et ventes par service de vos saisies. ' : '') + 'Conseillé pour votre type d’établissement : ' + conseil(R) + ' d’équipe (salaires + cotisations) pour 100 € vendus. « En trop » = ce que l’équipe a coûté au-delà ; en vert avec −, ce qu’elle a coûté en moins. Ventes sans la TVA.') + '</p>' +
      '<div class="actions"><button class="btn sec bloc" type="button" data-sh52-equipe="1">Voir mon équipe, salarié par salarié</button><button class="btn sec bloc" type="button" data-sh52-heures="1">Saisir ou corriger mes heures</button></div>';
    return h;
  }
  function jourSansHeuresHTML(R) {
    return '<p class="kicker">Ventes et heures par service · ' + esc(libelle(R)) + '</p><p class="titre">Pas d’heures saisies pour ce jour</p>' +
      '<p class="sous">Les heures de chaque service de ce jour n’ont pas été saisies (ou c’était un jour de repos) : touchez une autre journée du calendrier, ou saisissez ses heures.</p>' +
      '<div class="actions"><button class="btn sec bloc" type="button" data-sh52-heures="1">Saisir ou corriger mes heures</button></div>';
  }
  function videHTML(periode) {
    return '<p class="kicker">Ventes et heures par service</p><p class="titre">Combien rapporte une heure de travail, midi et soir ?</p>' +
      '<p class="sous">Saisissez les heures de chaque service (Salaires › Équipe) : Verdict calcule ce que rapporte une heure de travail et ce que coûte l’équipe pour 100 € vendus, service par service' + (periode === 'jour' ? '' : ', pour le mois et l’année') + '.</p>' +
      '<div class="actions"><button class="btn prim bloc" type="button" data-sh52-heures="1">Saisir mes heures</button></div>';
  }
  var CARTES = { jour: 'modServJ', mois: 'modServM', annee: 'modServA' };
  function poser(d, periode) {
    var col = d.querySelector('#vx40-' + periode + ' .vx40-b') || d.querySelector('#vx40-' + periode + ' .vx40-s'); if (!col) return;
    if (!d.getElementById('sh52-css')) { var s = d.createElement('style'); s.id = 'sh52-css'; s.textContent = CSS; (d.head || d.documentElement).appendChild(s); }
    var R = etat(periode, periode === 'jour' ? jourChoisi(d) : null), id = CARTES[periode], vieux = d.getElementById(id);
    /* Sans aucune donnée : la carte d'invitation n'apparaît que dans Jour (pas trois fois la même). */
    if (R && R.vide && periode !== 'jour') { if (vieux) vieux.remove(); return; }
    var html = R && R.jourChoisi ? jourSansHeuresHTML(R) : !R || R.vide ? videHTML(periode) : carteHTML(R), et = !R || R.vide ? 'info' : couleur(R.lourd ? R.lourd.part : R.total.part, R.repere);
    if (vieux && vieux.__html === html) return;
    var a = d.createElement('article'); a.className = 'mod sh52'; a.id = id; a.setAttribute('data-etat', et); a.setAttribute('aria-label', 'Ventes et heures par service'); a.innerHTML = html; a.__html = html;
    if (vieux) vieux.replaceWith(a); else col.appendChild(a);
    if (!d.__sh52j) { d.__sh52j = true; d.addEventListener('vx46-jour', function () { try { poser(d, 'jour'); } catch (e) {} }); }
    if (!d.__sh52) { d.__sh52 = true; d.addEventListener('click', function (ev) { if (ev.target.closest && ev.target.closest('[data-sh52-equipe]')) { ev.preventDefault(); ev.stopPropagation(); try { w.go('sal'); [400, 1200].forEach(function (ms) { setTimeout(function () { var e = w.document.getElementById('me57'); if (e) e.scrollIntoView({ block: 'start' }); }, ms); }); } catch (er) {} return; } if (ev.target.closest && ev.target.closest('[data-sh52-heures]')) { ev.preventDefault(); ev.stopPropagation(); try { if (w.VerdictTeam && w.VerdictTeam.open) w.VerdictTeam.open(); else w.go('sal'); w.scrollTo(0, 0); } catch (er) {} } }, true); }
  }
  /* « À faire » : la phrase chiffrée remplace « comparez vous-même ». */
  function brancher() {
    if (typeof w.p11StaffAction === 'function' && !w.p11StaffAction.__sh52) {
      var o = w.p11StaffAction, f = function (type) { try { var R = etat('mois'); if (R && !R.vide && R.lourd) return phrase(R); } catch (e) {} return o.apply(this, arguments); };
      f.__sh52 = true; f.__r158 = true; w.p11StaffAction = f;
    }
  }
  function tour() {
    brancher();
    var f = doc.querySelector('iframe.p41-ecran'), d = null; try { d = f && f.contentDocument; } catch (e) {}
    if (!d || !d.getElementById('vx40-jour')) return;
    ['jour', 'mois', 'annee'].forEach(function (p) { try { poser(d, p); } catch (e) {} });
  }
  var t = setInterval(tour, 3000); if (t && t.unref) t.unref(); setTimeout(tour, 1500);
  /* C179 : le même conseil partout (Alertes, jauge, cartes) : salaires conseillés pour le type d'établissement, en %. */
  w.vdRepMs = function () { return Math.round(repere() * 100); };
  w.VerdictServicesHeures = { analyser: analyser, etat: etat, phrase: phrase, tour: tour, secoursMois: secoursMois };
})();
