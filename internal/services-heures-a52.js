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
        if (enTrop >= 1) R.lourd = { nom: x.nom, cout: x.cout, ht: x.ht, part: x.part, prod: x.prod, prodCible: prodCible, caEnPlus: prodCible * x.h - x.ht, heuresEnTrop: enTrop };
      }
      var m = lourds.slice().sort(function (a, b) { return a.part - b.part; })[0];
      if (lourds.length > 1 && (!R.lourd || m.nom !== R.lourd.nom)) R.meilleur = { nom: m.nom, cout: m.cout, ht: m.ht, part: m.part, prod: m.prod };
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
  function couleur(part, rep) { return part == null ? 'info' : part <= rep + 0.005 ? 'vert' : part <= rep + 0.05 ? 'orange' : 'rouge'; }
  /* La phrase utile, la même dans la carte et dans « À faire ». */
  /* C178 (Steven, 20/10 : « je ne veux plus réfléchir “c'est quoi ?” ») : en mots de patron — ventes hors TVA, « € pour
     100 € vendus », conseil du type d'établissement dit comme tel ; plus de « CA HT », « repère », « à heures égales ». */
  function s100(x) { return x == null ? '—' : Math.round(x * 100) + '\u00a0€ pour 100\u00a0€ vendus'; }
  function conseil(R) { return Math.round(R.repere * 100) + '\u00a0€'; }
  function phrase(R) {
    if (!R || R.vide) return '';
    var quand = R.periode === 'jour' ? ' ce jour-là' : R.periode === 'mois' ? ' ce mois-ci' : ' sur l’année';
    if (!R.lourd) return (R.total.part != null && R.total.part > R.repere + 0.005 ? 'Aucun service ne dépasse nettement les ' + conseil(R) + ' de salaires pour 100 € vendus conseillés pour votre type d’établissement' : 'Chaque service reste sous les ' + conseil(R) + ' de salaires pour 100 € vendus conseillés pour votre type d’établissement') + ' : l’équipe coûte ' + eur(R.total.cout) + ' pour ' + eur(R.total.ht) + ' de ventes hors TVA' + quand + ' (' + s100(R.total.part) + '). Chaque heure de travail rapporte ' + eur(R.total.prod) + ' de ventes.';
    var L = R.lourd, t = L.nom + ' : l’équipe coûte ' + eur(L.cout) + ' pour ' + eur(L.ht) + ' de ventes hors TVA' + quand + ', soit ' + s100(L.part) + ' (conseillé pour votre type d’établissement : ' + conseil(R) + ' au plus). Chaque heure de travail y rapporte ' + eur(L.prod) + ' de ventes.';
    if (R.meilleur && R.meilleur.nom !== L.nom) t += ' ' + R.meilleur.nom + ' : ' + s100(R.meilleur.part) + ', ' + eur(R.meilleur.prod) + ' de ventes par heure.';
    t += ' Pour revenir à ' + conseil(R) + ' : ' + eur(L.caEnPlus) + ' de ventes en plus avec les mêmes heures, ou ' + hh(L.heuresEnTrop) + ' de travail en moins pour les mêmes ventes.';
    return t;
  }
  var CSS = '.sh52 table{width:100%;border-collapse:collapse;font-size:14px;margin:4px 0 10px;font-variant-numeric:tabular-nums}' +
    '.sh52 th{font-size:12px;font-weight:600;opacity:.7;text-align:right;padding:4px 6px;white-space:nowrap}.sh52 th:first-child,.sh52 td:first-child{text-align:left}' +
    '.sh52 td{text-align:right;padding:7px 6px;border-top:1px solid rgba(148,163,184,.22);white-space:nowrap}.sh52 tr.sh52-tot td{font-weight:700}' +
    '.sh52 .sh52-p{display:inline-block;min-width:44px;padding:2px 7px;border-radius:999px;font-weight:700}' +
    '.sh52 .sh52-vert{background:rgba(34,197,94,.16);color:#15803d}.sh52 .sh52-orange{background:rgba(249,115,22,.16);color:#c2410c}.sh52 .sh52-rouge{background:rgba(239,68,68,.16);color:#b91c1c}.sh52 .sh52-info{opacity:.7}' +
    'html.vd-workspace-dark .sh52 .sh52-vert{color:#4ade80}html.vd-workspace-dark .sh52 .sh52-orange{color:#fb923c}html.vd-workspace-dark .sh52 .sh52-rouge{color:#f87171}' +
    '.sh52 .sh52-c{display:none}.sh52 small.sh52-s{display:block;font-size:11px;font-weight:500;opacity:.7;margin-top:2px}.sh52 td{vertical-align:top}' +
    '@media (max-width:520px){.sh52 table{font-size:13px}.sh52 th,.sh52 td{padding:6px 3px}.sh52 td:first-child{white-space:normal}.sh52 .sh52-hab,.sh52 .sh52-l{display:none}.sh52 .sh52-c{display:inline}.sh52 .sh52-p{min-width:0;padding:2px 5px}}';
  function carteHTML(R) {
    var jour = R.periode === 'jour', aHab = jour && R.services.some(function (x) { return x.habituel != null; });
    var h = '<p class="kicker">Ventes et heures par service · ' + esc(libelle(R)) + (w.DB && (w.DB.demo || (w.DB.services || []).some(function (s) { return s && s.demo; })) ? ' · démonstration' : '') + '</p>' +
      '<p class="titre">' + esc(R.lourd ? R.lourd.nom + ' : l’équipe coûte ' + s100(R.lourd.part) : R.total.part != null && R.total.part > R.repere + 0.005 ? 'L’équipe coûte ' + s100(R.total.part) + ', sur tous les services' : 'Équipe dans le conseillé, service par service') + '</p>' +
      '<p class="sous">' + esc(phrase(R)) + '</p><table><thead><tr><th>Service</th><th>Ventes HT</th><th>Heures</th><th><span class="sh52-l">Ventes / heure</span><span class="sh52-c">€/h</span></th>' + (aHab ? '<th class="sh52-hab">D’habitude</th>' : '') + '<th><span class="sh52-l">Équipe / ventes</span><span class="sh52-c">Équipe</span></th></tr></thead><tbody>';
    var plusieurs = R.services.length > 1;
    R.services.concat(plusieurs ? [R.total] : []).forEach(function (x) {
      var tot = x === R.total;
      h += '<tr' + (tot ? ' class="sh52-tot"' : '') + '><td>' + esc(x.nom) + '</td><td>' + eur(x.ht) + (plusieurs && !tot && R.total.ht > 0 ? '<small class="sh52-s">' + pc(x.ht / R.total.ht) + ' des ventes</small>' : '') + '</td><td>' + hh(x.h) + '</td><td>' + eur(x.prod) + '</td>' + (aHab ? '<td class="sh52-hab">' + (tot || x.habituel == null ? '' : eur(x.habituel)) + '</td>' : '') +
        '<td><span class="sh52-p sh52-' + couleur(x.part, R.repere) + '">' + pc(x.part) + '</span>' + (x.coutConnu ? '<small class="sh52-s">' + eur(x.cout) + '</small>' : '') + '</td></tr>';
    });
    h += '</tbody></table><p class="sous" style="font-size:13px;opacity:.8">' + esc((R.source === 'mois' ? 'Heures du mois midi / soir (Salaires) et ventes par service de vos saisies. ' : '') + 'Ventes HT = sans la TVA. Coût d’une heure = salaire + cotisations patronales. Avant de réduire un service, regardez le planning (renforts, creux) : le fermer n’économiserait pas forcément ce montant.') + '</p>' +
      '<div class="actions"><button class="btn sec bloc" type="button" data-sh52-heures="1">Saisir ou corriger mes heures</button></div>';
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
    if (!d.__sh52) { d.__sh52 = true; d.addEventListener('click', function (ev) { if (ev.target.closest && ev.target.closest('[data-sh52-heures]')) { ev.preventDefault(); ev.stopPropagation(); try { if (w.VerdictTeam && w.VerdictTeam.open) w.VerdictTeam.open(); else w.go('sal'); w.scrollTo(0, 0); } catch (er) {} } }, true); }
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
