/* C149 — « Rythme » : un graphique premium propre à l'Accueil, cohérent du jour à l'année (Steven, 18/10 : « fais-moi
   un premium différent de Performances ; ce n'est pas logique : Jour on voit les jours, Mois c'est les mois, Annuel…
   encore les mois ! il faut être cohérent » ; « premium ultra dans les fonctions et le visuel »).
   Une seule grammaire visuelle dans les trois chapitres, chacun avec SA propre unité :
     Jour  → les journées du mois en cours, chacune face à son objectif du jour ;
     Mois  → les mois de l'année, chacun face à son minimum (réalisé, en cours projeté, à venir projeté) ;
     Année → les années (historique saisi) face au minimum annuel d'aujourd'hui, l'année en cours projetée.
   Colonnes lumineuses animées (montée en cascade), couleur selon l'écart (vert ≥ 105 %, bleu « de justesse » de 100 à 105 %, jaune ≥ 95 %, orange ≥ 90 %,
   rouge en dessous), ligne « objectif · 100 % », colonne sélectionnée mise en avant. Un appui (ou les flèches du
   clavier) sur une colonne affiche son détail en euros. Chiffres TTC, issus des mêmes moteurs que le reste de Verdict
   (VerdictPerformanceIntegrated, VerdictAnnualProjection, historique mensuel) : aucun chiffre n'est inventé ; une journée
   ouverte sans chiffre reste vide, un jour de repos est marqué. Remplace l'essai C148 (copie des courbes de Performances). */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdAccueilRythme) return; w.__vdAccueilRythme = true;
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var INIT = 'JFMAMJJASOND';
  /* C298 : initiales des jours et des mois dans la langue choisie ; la langue entre dans la signature du dessin. */
  function lng() { try { var l = String(w.LOCALE || 'fr').slice(0, 2); return INITJ[l] ? l : 'fr'; } catch (e) { return 'fr'; } }
  var INITJ = { fr: 'LMMJVSD', en: 'MTWTFSS', es: 'LMXJVSD', it: 'LMMGVSD', de: 'MDMDFSS', nl: 'MDWDVZZ', pt: 'STQQSSD' }, INITM = { fr: INIT, en: INIT, es: 'EFMAMJJASOND', it: 'GFMAMGLASOND', de: INIT, nl: INIT, pt: INIT };
  function initMois() { return INITM[lng()]; }
  var JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  function eur(v) { return Math.round(Number(v) || 0).toLocaleString('fr-FR') + ' €'; }
  /* C204 : un chiffre sous son minimum ne s'arrondit jamais à 100 % (99,5 % s'écrit 99 %, pas 100 %). */
  function ent(r) { var v = Math.round(r * 100); return r < 1 && v >= 100 ? 99 : v; }
  function pct(r) { var v = Math.round(r * 1000) / 10; if (r < 1 && v >= 100) v = 99.9; return v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  /* C250 : vert seulement avec une vraie marge (5 % ou plus au-dessus du minimum) ; de 100 à 105 %, le minimum est couvert de justesse. */
  function etat(r) { if (r != null) { var v = Math.round(r * 1000) / 1000; r = r < 1 && v >= 1 ? r : v; } /* C298 (V15-110) : l'état suit le pourcentage affiché (104,98 % s'affiche 105,0 % : « Atteint ») */ return r == null ? 'vide' : r >= 1.05 ? 'vert' : r >= 1 ? 'juste' : r >= 0.95 ? 'jaune' : r >= 0.9 ? 'orange' : 'rouge'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function moisCle() { try { return w.verdictOperationalClock().key.slice(0, 7); } catch (e) { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); } }

  /* ---------- Données (mêmes moteurs que le reste de l'appli) ---------- */
  /* Jour = un calendrier de semaines, lundi → dimanche, comme un planning de service (logique CHR) : chaque journée a sa
     case lisible et touchable, son numéro, son % et sa couleur Verdict ; repos marqué, aujourd'hui cerclé, journées à
     venir avec leur objectif. */
  function aujourdhui() { try { return String(w.verdictOperationalClock().key).slice(0, 10); } catch (e) { return ''; } }
  var JLONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  function jours() {
    var V = w.VerdictPerformanceIntegrated, R = w.moteur(), key = moisCle(), m = V.buildMonth(R, key), auj = aujourdhui();
    var cols = (m.days || []).map(function (d) {
      var dt = new Date(d.date + 'T12:00:00'), lib = JOURS[dt.getDay()] + ' ' + d.day + ' ' + MOIS[dt.getMonth()];
      var base = { lib: lib, date: d.date, axe: String(d.day), jour: d.day, dow: (dt.getDay() + 6) % 7, wd: dt.getDay(), auj: d.date === auj, avenir: d.date > auj };
      if (d.preTracking) base.type = typeof w.verdictIsOperatingClosed === 'function' && w.verdictIsOperatingClosed(d.date) ? 'repos' : 'avant'; /* C213 (W08) : avant le suivi, un jour fermé reste « Repos », un jour ouvert n'est ni repos ni manqué */
      else if (d.closed) base.type = 'repos';
      else if (d.ca == null || !(d.target > 0)) { base.type = 'vide'; base.cible = d.target > 0 ? d.target : null; }
      else { base.type = 'reel'; base.valeur = d.ca; base.cible = d.target; base.r = Math.round(d.ca) / Math.round(d.target); } /* C205 (V42) : le taux se lit sur les montants affichés */
      return base;
    });
    var reels = cols.filter(function (c) { return c.type === 'reel'; }), sel = cols.lastIndexOf(reels[reels.length - 1]);
    if (sel < 0) sel = Math.max(0, cols.findIndex(function (c) { return c.auj; }));
    var ok = reels.filter(function (c) { return c.r >= 1; }).length;
    var moy = reels.length ? reels.reduce(function (t, c) { return t + c.r; }, 0) / reels.length : null;
    /* Le réflexe CHR : quel jour de la semaine porte la maison. */
    var parJ = {}; reels.forEach(function (c) { (parJ[c.wd] = parJ[c.wd] || []).push(c.r); });
    var meilleur = null; Object.keys(parJ).forEach(function (k) { var a = parJ[k], v = a.reduce(function (t, x) { return t + x; }, 0) / a.length; if (!meilleur || v > meilleur.v) meilleur = { k: k, v: v }; });
    return {
      vue: 'cal', kicker: 'Vos journées · ' + MOIS[Number(key.slice(5)) - 1] + ' ' + key.slice(0, 4), cols: cols, sel: sel,
      resume: reels.length ? ok + ' journée' + (ok > 1 ? 's' : '') + ' sur ' + reels.length + ' au-dessus de leur minimum · moyenne ' + pct(moy) + (meilleur && reels.length >= 5 ? ' · jour le plus fort : le ' + JLONG[meilleur.k] + ' (' + pct(meilleur.v) + ' en moyenne)' : '') : 'Aucune journée saisie ce mois-ci',
      unite: 'minimum du jour'
    };
  }
  function court(r) { return ent(r) + '<small>\u202f%</small>'; }
  function calendrier(m) {
    var h = '<div class="rx-cal" role="group" aria-label="' + esc(m.kicker) + '">';
    INITJ[lng()].split('').forEach(function (j) { h += '<span class="rx-cj" aria-hidden="true">' + j + '</span>'; });
    var prem = m.cols[0] ? m.cols[0].dow : 0; for (var k = 0; k < prem; k++) h += '<span class="rx-c0"></span>';
    m.cols.forEach(function (c, i) {
      var st = c.type === 'reel' ? etat(c.r) : c.type, v = c.type === 'reel' ? court(c.r) : c.type === 'repos' ? 'Repos' : c.type === 'avant' ? '' : c.avenir ? '' : '—';
      var al = c.type === 'reel' ? c.lib + ' : ' + pct(c.r) : c.lib + (c.type === 'repos' ? ' : repos' : c.type === 'avant' ? ' : avant le début du suivi' : c.avenir ? ' : à venir' : ' : sans chiffre');
      var jg = ''; /* C222 quater (Steven : « si la barre est inutile, on la supprime : le pourcentage dit déjà tout ») : la couleur dit atteint ou non, le % dit de combien — pas de barre en plus */
      h += '<button type="button" class="rx-j st-' + st + (c.type === 'reel' ? ' niv' : '') + (i === m.sel ? ' sel' : '') + (c.auj ? ' auj' : '') + '" data-i="' + i + '" tabindex="' + (i === m.sel ? 0 : -1) + '" aria-label="' + esc(al) + '" aria-pressed="' + (i === m.sel) + '"><b>' + c.jour + '</b><span>' + (c.type === 'reel' ? v : esc(v)) + '</span>' + jg + '</button>';
    });
    return h + '</div>';
  }
  /* Mois en cours : encaissé face à l'attendu à cette date (somme des objectifs des journées renseignées) — les mêmes
     chiffres que « Conséquence sur le mois » et la carte du jour ; pas de second moteur de prévision. */
  function aDate() {
    var V = w.VerdictPerformanceIntegrated, m = V.buildMonth(w.moteur(), moisCle()), att = 0, enc = 0;
    (m.days || []).forEach(function (d) { if (!d.closed && d.ca != null && d.target > 0) { att += d.target; enc += d.ca; } });
    return { encaisse: enc, attendu: att };
  }
  /* C157 — Projection annuelle indisponible (ex. Saisonnier mer : historique incomplet) : les mois sont repris du plan
     mensuel (minimum de chaque mois) et de l'historique, au lieu de laisser le chapitre Mois sans graphique. */
  /* C213 (W10, W11) : le minimum de chaque mois vient du plan de l'année, comme le Jour et la carte Année ; un mois sans
     chiffre n'est jamais compté « 0 € », et un mois avant le début du suivi n'a ni minimum ni échec. */
  function moisDuPlan(c, an) {
    var cur = Number(moisCle().slice(5)), plans = w.DB && w.DB.performancePlans || {}, yp = w.DB && w.DB.performanceYearPlans && w.DB.performanceYearPlans[an], hist = {}, jour = {};
    (w.DB && w.DB.monthlyHistory || []).forEach(function (x) { hist[String(x.period).slice(0, 7)] = x; });
    (w.DB && w.DB.histJour || []).forEach(function (r) { var k = String(r && r.date || '').slice(0, 7); if (k.slice(0, 4) === an && typeof r.caJ === 'number') jour[k] = (jour[k] || 0) + r.caJ; });
    return MOIS.map(function (_, i) {
      var k = an + '-' + String(i + 1).padStart(2, '0'), h = hist[k], pl = plans[k], t = pl && Number(pl.minimum) > 0 ? Number(pl.minimum) : yp && Number(yp.monthlyTargets && yp.monthlyTargets[k]) > 0 ? Number(yp.monthlyTargets[k]) : 0;
      if (h && (h.seasonClosed || Number(h.openDays) === 0)) t = 0;
      return { kind: i + 1 < cur ? 'past' : i + 1 === cur ? 'current' : 'future', target: t, actual: h ? Number(h.caTTC) || 0 : jour[k] != null ? jour[k] : null, value: null };
    });
  }
  /* C213 (W11) : le mois où commence le suivi n'a pour minimum que la part de ses jours suivis ; on le dit, avec le mois entier. */
  function partSuivie(an, i, dm) { if (i !== dm) return ''; try { var s = String(w.DB.performanceTrackingStartedAt || ''), yp = w.DB.performanceYearPlans[an], full = yp && yp.fullMonthlyTargets && Number(yp.fullMonthlyTargets[an + '-' + String(i + 1).padStart(2, '0')]); return ' · minimum du reste du mois, depuis le ' + jourLong(s) + (full > 0 ? ' (mois entier : ' + eur(full) + ')' : ''); } catch (e) { return ''; } }
  /* Mois du début du suivi dans l'année affichée (−1 si le suivi a commencé avant). */
  function moisDebut(inp, an) { var s = String(inp && inp.trackingStart || (w.DB && w.DB.performanceTrackingStartedAt) || ''); return /^\d{4}-\d{2}/.test(s) && s.slice(0, 4) === an ? Number(s.slice(5, 7)) - 1 : (s.slice(0, 4) > an ? 12 : -1); }
  function moisAnnee() {
    var A = w.VerdictAnnualProjection, inp = A.input(w.moteur()), c = A.coreN1(inp), an = moisCle().slice(0, 4), ad = aDate(); /* C204 : mêmes mois que la carte Année */
    var mois = c && c.months && c.months.length ? c.months : moisDuPlan(c, an), dm = moisDebut(inp, an);
    var cols = mois.map(function (m, i) { var c0 = colMois(m, i); c0.cle = an + '-' + String(i + 1).padStart(2, '0'); c0.minMois = Number(m.target) || 0; c0.methode = m.method || null; c0.n1 = m.lastYear || null; c0.fin = m.kind === 'current' && Number(m.value) > 0 ? Number(m.value) : null; return c0; });
    function colMois(m, i) {
      var lib = MOIS[i] + ' ' + an;
      if (i < dm) return { lib: lib, axe: initMois()[i], type: 'avant' }; /* C213 (W10) : avant le début du suivi, rien n'est attendu */
      if (!(m.target > 0)) return { lib: lib, axe: initMois()[i], type: 'repos' };
      if (m.kind === 'past') return m.actual == null ? { lib: lib, axe: initMois()[i], type: 'vide', cible: m.target } : { lib: lib, axe: initMois()[i], type: 'reel', valeur: m.actual, cible: m.target, r: m.actual / m.target };
      if (m.kind === 'current') return ad.attendu > 0 ? { lib: lib + ' (en cours)', axe: initMois()[i], type: 'encours', encours: true, valeur: ad.encaisse, cible: ad.attendu, r: ad.encaisse / ad.attendu } : { lib: lib + ' (en cours)' + partSuivie(an, i, dm), axe: initMois()[i], type: 'vide', encours: true, auj: true, cible: m.target };
      if (m.value == null) return { lib: lib, axe: initMois()[i], type: 'vide', cible: m.target, avenir: true };
      return { lib: lib, axe: initMois()[i], type: 'projete', valeur: m.value, cible: m.target, r: m.value / m.target };
    }
    var passes = cols.filter(function (x) { return x.type === 'reel'; }), ok = passes.filter(function (x) { return x.r >= 1; }).length;
    var sel = cols.findIndex(function (x) { return x.encours; }); if (sel < 0) sel = Math.min(cols.length - 1, Number(moisCle().slice(5)) - 1); /* C213 (W17) : le mois en cours, pas décembre */
    return {
      kicker: 'Vos mois · ' + an, cols: cols, sel: sel,
      resume: passes.length ? ok + ' mois sur ' + passes.length + ' terminés au-dessus de leur minimum' : dm > 0 && dm < 12 ? 'Suivi depuis ' + MOIS[dm] + ' : les mois d’avant ne sont pas comptés' : 'Premier mois en cours',
      unite: 'minimum du mois', an: an, detailMois: true
    };
  }
  function annees() {
    var A = w.VerdictAnnualProjection, inpA = A.input(w.moteur()), c = A.coreN1(inpA), an = Number(moisCle().slice(0, 4)), cible = Number(inpA && inpA.fullYearMinimum) || Number(c.minimum) || 0; /* C213 (W16) : une année entière face au minimum d'une année entière */
    var par = {}; (w.DB && w.DB.monthlyHistory || []).forEach(function (x) { var y = Number(String(x.period || '').slice(0, 4)); if (y && y < an && x.caTTC > 0) par[y] = (par[y] || 0) + Number(x.caTTC); });
    /* C213 (W16) : sans historique mensuel, une année passée vient de la caisse ou du FEC quand chacun de ses 12 mois est connu. */
    for (var yy = an - 6; yy < an; yy++) { if (par[yy] > 0) continue; try { var ky = w.VerdictPerformanceIntegrated.knownYear(yy); if (ky && ky.total > 0) par[yy] = ky.total; } catch (e) {} }
    var cols = Object.keys(par).map(Number).sort().slice(-6).map(function (y) { return { lib: 'Année ' + y, axe: String(y), type: 'reel', valeur: par[y], cible: cible, r: cible > 0 ? par[y] / cible : null }; });
    if (!(c.expected > 0)) { /* C157 : projection indisponible → année à date reprise du plan mensuel et de l'historique. */
      var ad = aDate(), ac = ad.encaisse, ex = ad.attendu, dm = moisDebut(A.input(w.moteur()), String(an)); moisDuPlan(c, String(an)).forEach(function (m, i) { if (m.kind === 'past' && m.target > 0 && i >= dm && m.actual != null) { ac += m.actual; ex += m.target; } }); /* C213 (W10) : seuls les mois suivis et chiffrés comptent */
      c = Object.assign({}, c, { actual: ac, expected: ex });
    }
    if (c.expected > 0) cols.push({ lib: 'Année ' + an + ' (en cours)', axe: String(an), type: 'encours', encours: true, valeur: c.actual, cible: c.expected, r: c.actual / c.expected });
    else cols.push({ lib: 'Année ' + an + ' (en cours)', axe: String(an), type: 'vide', encours: true }); /* C213 (W10) : aucun chiffre attendu à cette date, aucun échec */
    /* Évolution : même période de l'année précédente (janvier → mois en cours), à périmètre comparable. */
    var cmp = memeDate(an), evo = cmp && cmp.avant > 0 && cmp.maintenant > 0 ? (cmp.maintenant - cmp.avant) / cmp.avant : null;
    return {
      kicker: 'Vos années · comparées à leur minimum, à la même date', cols: cols, sel: cols.length - 1,
      resume: evo == null ? 'Historique en construction' : (evo >= 0 ? '+' : '−') + pct(Math.abs(evo)) + ' par rapport à ' + (an - 1) + ' ' + cmp.periode,
      unite: 'minimum annuel'
    };
  }

  /* C204 (V06) : « à la même date » = la même fenêtre dans les deux années. Avec la caisse jour par jour des deux années :
     du premier jour suivi cette année au dernier jour saisi, et les mêmes dates l'an dernier. Sinon : les mois terminés
     présents les deux années (historique mensuel), jamais octobre partiel face à octobre complet. */
  function jourLong(k) { var j = Number(k.slice(8, 10)); return (j === 1 ? '1er' : String(j)) + ' ' + MOIS[Number(k.slice(5, 7)) - 1]; }
  function memeDate(an) {
    var rows = (w.DB && w.DB.histJour) || [], y = String(an), p = String(an - 1), auj = aujourdhui(), deb = null, fin = null, i;
    rows.forEach(function (r) { var k = String(r && r.date || ''); if (k.slice(0, 4) !== y || typeof r.caJ !== 'number' || (auj && k > auj)) return; if (!deb || k < deb) deb = k; if (!fin || k > fin) fin = k; });
    if (deb && fin) {
      var a = p + deb.slice(4), b = p + fin.slice(4), avant = 0, maintenant = 0, jp = 0;
      rows.forEach(function (r) { var k = String(r && r.date || ''); if (typeof r.caJ !== 'number') return; if (k >= deb && k <= fin) maintenant += r.caJ; else if (k >= a && k <= b) { avant += r.caJ; jp++; } });
      if (jp > 0 && rows.some(function (r) { return String(r && r.date || '') <= a && String(r && r.date || '').slice(0, 4) === p; })) return { avant: avant, maintenant: maintenant, periode: 'à la même date (du ' + jourLong(deb) + ' au ' + jourLong(fin) + ')' };
    }
    var mc = Number(moisCle().slice(5)), h = {}, av = 0, ma = 0, n = 0, der = 0;
    (w.DB && w.DB.monthlyHistory || []).forEach(function (x) { var k = String(x.period || '').slice(0, 7); if (x.caTTC > 0) h[k] = Number(x.caTTC); });
    for (i = 1; i < mc; i++) { var kp = p + '-' + String(i).padStart(2, '0'), ky = y + '-' + String(i).padStart(2, '0'); if (h[kp] > 0 && h[ky] > 0) { av += h[kp]; ma += h[ky]; n++; der = i; } }
    return n ? { avant: av, maintenant: ma, periode: 'sur les mois terminés (' + (n === der ? 'janvier → ' + MOIS[der - 1] : n + ' mois comparables') + ')' } : null;
  }

  /* ---------- Détail d'une colonne ---------- */
  function detail(c, unite) {
    if (!c) return { big: '—', lab: '', st: 'vide' };
    if (c.type === 'repos') return { big: 'Repos', lab: c.lib + ' · fermé, aucun chiffre attendu', st: 'vide', mot: '' };
    if (c.type === 'avant') return { big: '—', lab: c.lib + ' · avant le début du suivi', st: 'vide', mot: '' };
    /* C245 : jours d'ouverture inconnus (document comptable seul) : aucun minimum du jour inventé ; le mois et l'année restent justes. */
    if (c.type === 'vide' && unite === 'minimum du jour' && typeof w.verdictJoursInconnus === 'function' && w.verdictJoursInconnus()) return { big: 'À confirmer', lab: c.lib + ' · minimum du jour à confirmer : il dépend de vos jours d’ouverture', st: 'vide', mot: '' };
    if (c.type === 'vide') return { big: c.cible ? eur(c.cible) : '—', lab: c.lib + (c.cible ? (c.avenir || c.auj ? ' · ' + (/reste du mois/.test(c.lib) ? '' : unite + ' ') + 'à réaliser' : ' · ' + unite + ', chiffre à saisir') : ' · pas encore de chiffre'), st: 'vide', mot: c.cible ? (c.avenir ? 'À venir' : c.auj && c.encours ? 'En cours' : 'À saisir') : '' }; /* C213 (W17) : l'unité du chapitre, jamais « du jour » sur un mois */
    var lab = c.type === 'encours' ? c.lib + ' · ' + eur(c.valeur) + ' encaissés pour ' + eur(c.cible) + ' attendus à cette date'
      : c.lib + ' · ' + (c.type === 'projete' ? eur(c.valeur) + ' projetés' : eur(c.valeur)) + ' pour ' + eur(c.cible) + ' (' + unite + ')';
    /* La couleur n'est jamais seule (WCAG 1.4.1) : un mot dit l'état. */
    var mot = c.r >= 1 ? (etat(c.r) === 'juste' ? (c.type === 'projete' ? 'Projeté de justesse' : 'De justesse') : c.type === 'projete' ? 'Projeté atteint' : 'Atteint') : '−' + pct(1 - c.r).replace(' %', ' %') + ' sous le minimum';
    return { big: pct(c.r), lab: lab, st: etat(c.r), mot: mot };
  }

  /* C221 : détail du mois touché (janvier, février…) — mêmes chiffres que la courbe, jamais une journée. */
  function joursDuMois(cle) {
    var n = 0, ca = 0, tk = 0, tkN = 0;
    (w.DB && w.DB.histJour || []).forEach(function (r) { var k = String(r && r.date || ''); if (k.slice(0, 7) !== cle || typeof r.caJ !== 'number' || !(r.caJ > 0)) return; n++; ca += r.caJ; var t = Number(r.tkJ); if (t > 0) { tk += t; tkN++; } });
    return { n: n, ca: ca, tickets: tkN === n && tk > 0 ? tk : null };
  }
  function ligne(lib, val, sous, cls) { return '<div class="rx-ml"><span>' + esc(lib) + (sous ? '<small>' + esc(sous) + '</small>' : '') + '</span><b' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(val) + '</b></div>'; }
  /* C256 : mois où commence le suivi (après le 1er) : la part suivie et le mois entier, chacun sous son nom. */
  function partMois(cle, mm) { try { var s = String(w.DB.performanceTrackingStartedAt || ''), yp = w.DB.performanceYearPlans[String(cle).slice(0, 4)], full = yp && yp.fullMonthlyTargets ? Number(yp.fullMonthlyTargets[cle]) : 0; if (/^\d{4}-\d{2}-\d{2}$/.test(s) && s.slice(0, 7) === cle && s.slice(8) !== '01' && full > Number(mm) + 0.5) return { depuis: jourLong(s), full: full }; } catch (e) {} return null; }
  function detailMoisHTML(c) {
    if (!c) return '';
    var nom = c.lib.replace(/ \(en cours\).*$/, ''), h = '<p class="rx-mk">' + esc(nom.charAt(0).toUpperCase() + nom.slice(1)) + ' · ' + esc({ reel: 'mois terminé', encours: 'en cours', projete: 'projeté', vide: c.avenir ? 'à venir' : c.encours ? 'en cours' : 'chiffre à saisir', repos: 'fermé', avant: 'avant le début du suivi' }[c.type] || '') + '</p>';
    if (c.type === 'repos') return h + '<p class="rx-mn">Mois fermé : aucun chiffre attendu.</p>';
    if (c.type === 'avant') return h + '<p class="rx-mn">Ce mois est avant le début de votre suivi : il n’est pas compté.</p>';
    var j = joursDuMois(c.cle), mm = c.minMois > 0 ? c.minMois : c.cible;
    if (c.type === 'reel') {
      var e = Math.round(c.valeur) - Math.round(mm);
      h += ligne('Encaissé TTC', eur(c.valeur), '', 'ok') + (function () { var p = partMois(c.cle, mm); return p ? ligne('Minimum du reste du mois TTC', eur(mm), 'depuis le ' + p.depuis + ' · mois entier : ' + eur(p.full)) : ligne('Minimum du mois TTC', eur(mm)); })() + ligne('Écart avec le minimum', e >= 0 ? eur(e) + ' au-dessus' : 'il manque ' + eur(-e), '', e >= 0 ? 'ok' : 'ko');
    } else if (c.type === 'encours') {
      h += ligne('Encaissé à ce jour', eur(c.valeur), j.n ? j.n + ' journée' + (j.n > 1 ? 's' : '') + ' saisie' + (j.n > 1 ? 's' : '') : '', 'ok') + ligne('Attendu à cette date', eur(c.cible)) + (function () { var p = partMois(c.cle, mm); return p ? ligne('Minimum du reste du mois TTC', eur(mm), 'depuis le ' + p.depuis) + ligne('Minimum du mois entier TTC', eur(p.full)) : ligne('Minimum du mois entier TTC', eur(mm)); })();
      var av = Math.round(c.valeur) - Math.round(c.cible); h += ligne(av >= 0 ? 'Avance à ce jour' : 'Retard à ce jour', (av >= 0 ? '+' : '−') + eur(Math.abs(av)), '', av >= 0 ? 'ok' : 'ko');
      if (c.fin) h += ligne('Fin de mois estimée', eur(c.fin), 'même estimation que l’onglet Année');
    } else if (c.type === 'projete') {
      var ep = Math.round(c.valeur) - Math.round(mm);
      h += ligne('Projeté TTC', eur(c.valeur), c.methode === 'n1' && c.n1 ? 'même mois l’an dernier (' + eur(c.n1) + ') × votre évolution à date' : 'votre rythme × le minimum du mois') + (function () { var p = partMois(c.cle, mm); return p ? ligne('Minimum du reste du mois TTC', eur(mm), 'depuis le ' + p.depuis + ' · mois entier : ' + eur(p.full)) : ligne('Minimum du mois TTC', eur(mm)); })() + ligne('Écart projeté', ep >= 0 ? eur(ep) + ' au-dessus' : 'il manque ' + eur(-ep), '', ep >= 0 ? 'ok' : 'ko');
    } else {
      h += (function () { var p = partMois(c.cle, mm); return p ? ligne('Minimum du reste du mois TTC', eur(mm), 'depuis le ' + p.depuis + ' · mois entier : ' + eur(p.full)) : ligne('Minimum du mois TTC', eur(mm)); })() + '<p class="rx-mn">' + esc(c.avenir ? 'Mois à venir : il sera projeté dès que la méthode a assez de données.' : 'Aucun chiffre saisi pour ce mois.') + '</p>';
    }
    if ((c.type === 'reel' || c.type === 'encours') && j.n) {
      h += ligne('Jours ouverts saisis', String(j.n)) + ligne('Moyenne par jour ouvert', eur(j.ca / j.n));
      if (j.tickets) h += ligne('Tickets', j.tickets.toLocaleString('fr-FR')) + ligne('Panier moyen TTC', (Math.round(j.ca / j.tickets * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €');
    }
    return h;
  }
  function majDetailMois(box, m) { var z = box.querySelector('.rx-md'); if (!z) return; var html = detailMoisHTML(m.cols[m.sel]); if (z.__html !== html) { z.innerHTML = html; z.__html = html; } }

  /* ---------- Dessin ---------- */
  var CSS =
    '.rx{position:relative;margin:0 0 14px;padding:16px 16px 12px;border-radius:var(--r-mod,20px);border:1px solid var(--line,rgba(148,163,184,.18));background:var(--card,#fff);overflow:hidden}' +
    '.rx:before{content:"";position:absolute;inset:-40% -10% auto auto;width:70%;height:120%;background:radial-gradient(closest-side,var(--rx-glow,rgba(34,197,94,.16)),transparent 70%);pointer-events:none}' +
    '.rx[data-st="jaune"]{--rx-glow:rgba(234,179,8,.16)}.rx[data-st="orange"]{--rx-glow:rgba(249,115,22,.16)}.rx[data-st="rouge"]{--rx-glow:rgba(239,68,68,.16)}.rx[data-st="vide"]{--rx-glow:rgba(148,163,184,.12)}.rx[data-st="juste"]{--rx-glow:rgba(14,165,233,.16)}' +
    /* C204 (V16) : couleur de TEXTE de chaque état, lisible d'emblée (mêmes teintes que le calendrier des journées) ;
       le garde-contraste n'a donc plus à figer une couleur qui deviendrait fausse au mois suivant. */
    '.rx[data-st="vert"]{--rx-t:#15803d}.rx[data-st="jaune"]{--rx-t:#a16207}.rx[data-st="orange"]{--rx-t:#c2410c}.rx[data-st="rouge"]{--rx-t:#b91c1c}.rx[data-st="vide"]{--rx-t:#64748b}.rx[data-st="juste"]{--rx-t:#0369a1}' +
    'html.vd-workspace-dark .rx[data-st="vert"]{--rx-t:#4ade80}html.vd-workspace-dark .rx[data-st="jaune"]{--rx-t:#facc15}html.vd-workspace-dark .rx[data-st="orange"]{--rx-t:#fb923c}html.vd-workspace-dark .rx[data-st="rouge"]{--rx-t:#f87171}html.vd-workspace-dark .rx[data-st="vide"]{--rx-t:#94a3b8}html.vd-workspace-dark .rx[data-st="juste"]{--rx-t:#38bdf8}' +
    '.rx-k{margin:0;font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut,#64748b)}' +
    '.rx-hero{display:flex;align-items:center;flex-wrap:wrap;gap:6px 12px;margin:6px 0 0}' +
    '.rx-big{font-size:40px;line-height:1;font-weight:850;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--rx-t,var(--rx-c,#16a34a))}' +
    '.rx-mot{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:13px;font-weight:800;color:var(--rx-t,var(--rx-c,#16a34a));background:color-mix(in srgb,var(--rx-c,#22c55e) 14%,transparent)}.rx-mot:empty{display:none}' +
    '.rx-lab{margin:6px 0 0;font-size:14px;line-height:1.4;color:var(--txt,inherit);font-weight:600}' +
    '.rx-sub{margin:2px 0 8px;font-size:13px;color:var(--mut,#64748b)}' +
    '.rx svg{display:block;width:100%;max-width:620px;margin:0 auto;height:auto;overflow:visible;touch-action:pan-y;-webkit-user-select:none;user-select:none}' +
    '.rx .col{cursor:pointer;outline:none}.rx .col rect.b{transform-box:fill-box;transform-origin:50% 100%;animation:rxMonte .7s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d,0s)}' +
    '.rx .col.proj rect.b{fill-opacity:.18;stroke-width:1.5;stroke-dasharray:3 3}.rx .col.cours rect.b{stroke:var(--txt,#0f172a);stroke-width:1.5;stroke-opacity:.55}' +
    '.rx .col.sel rect.b{filter:drop-shadow(0 0 6px var(--rx-c,#22c55e))}.rx .col:focus-visible rect.hit{stroke:var(--rx-c,#22c55e);stroke-width:2}' +
    '.rx .col.sel text.v{opacity:1}.rx text.v{opacity:0;transition:opacity .2s;font-size:10px;font-weight:800;fill:var(--txt,#0f172a);paint-order:stroke;stroke:var(--card,#fff);stroke-width:3px;stroke-linejoin:round}html.vd-workspace-dark .rx text.v{stroke:#15191f}' +
    '.rx text.ax{font-size:10px;fill:var(--mut,#64748b);font-weight:600}.rx .col.sel text.ax{fill:var(--txt,#0f172a);font-weight:800}' +
    '.rx line.obj{stroke:#d4a017;stroke-width:1.2;stroke-dasharray:5 4}.rx text.obj{font-size:10px;font-weight:800;fill:#b7860b}' +
    '.rx line.g{stroke:var(--line,rgba(148,163,184,.25));stroke-width:1}' +
    '.rx .repos{fill:var(--mut,#94a3b8);opacity:.55}.rx .vide{fill:var(--mut,#94a3b8);opacity:.3}' +
    /* C222 : une seule grille des journées ; C222 ter (Steven : « je préfère cette version plus claire ; j’aime la fonction de la jauge ») : la case claire d’origine (fond teinté, numéro, %), plus une fine jauge en bas */
    '.rx-j{position:relative}.rx-j.st-vert{--rx-n:#22c55e}.rx-j.st-jaune{--rx-n:#eab308}.rx-j.st-orange{--rx-n:#f97316}.rx-j.st-rouge{--rx-n:#ef4444}.rx-j.st-juste{--rx-n:#0ea5e9}' +
    '.rx-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin:14px 0 2px;max-width:560px}' +
    '.rx-cj{text-align:center;font-size:11px;font-weight:800;color:var(--mut,#64748b);letter-spacing:.04em;padding-bottom:2px}' +
    '.rx-j{appearance:none;-webkit-appearance:none;font:inherit;margin:0;min-width:0;min-height:50px;padding:5px 2px;border-radius:12px;border:1.5px solid transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;cursor:pointer;color:var(--txt,#0f172a);background:rgba(148,163,184,.10);transition:transform .12s ease,box-shadow .2s ease;-webkit-tap-highlight-color:transparent}' +
    '.rx-j:active{transform:scale(.95)}.rx-j b{font-size:15px;font-weight:800;line-height:1.1}.rx-j span{font-size:11px;font-weight:800;line-height:1.1;white-space:nowrap;min-height:12px}' +
    '.rx-j.st-vert{background:rgba(34,197,94,.16)}.rx-j.st-vert span{color:#15803d}.rx-j.st-jaune{background:rgba(234,179,8,.20)}.rx-j.st-jaune span{color:#a16207}.rx-j.st-juste{background:rgba(14,165,233,.16)}.rx-j.st-juste span{color:#0369a1}' +
    '.rx-j.st-orange{background:rgba(249,115,22,.18)}.rx-j.st-orange span{color:#c2410c}.rx-j.st-rouge{background:rgba(239,68,68,.16)}.rx-j.st-rouge span{color:#b91c1c}' +
    '.rx-j.st-repos{background:rgba(148,163,184,.22)}.rx-j.st-repos b,.rx-j.st-repos span{color:var(--mut,#64748b)}.rx-j.st-repos span{font-size:10px;font-weight:700}' +
    '.rx-j.st-vide,.rx-j.st-avant{background:transparent;border-color:rgba(148,163,184,.30)}.rx-j.st-avant{opacity:.45}.rx-j.st-vide b{color:var(--mut,#64748b)}' +
    '.rx-j.auj{border-color:var(--txt,#0f172a)}.rx-j.sel{box-shadow:0 0 0 2.5px var(--rx-c,#22c55e),0 6px 16px -8px var(--rx-c,#22c55e);transform:translateY(-1px)}' +
    '.rx-j small{font-size:inherit}@media (max-width:360px){.rx-cal{gap:3px}.rx-j{border-radius:10px}.rx-j b{font-size:14px}.rx-j small{display:none}.rx-j.st-repos span{font-size:9px}}' +
    '.rx-j:focus-visible{outline:2px solid var(--rx-c,#22c55e);outline-offset:2px}' +
    'html.vd-workspace-dark .rx-j.st-vert span{color:#4ade80}html.vd-workspace-dark .rx-j.st-juste span{color:#38bdf8}html.vd-workspace-dark .rx-j.st-jaune span{color:#facc15}html.vd-workspace-dark .rx-j.st-orange span{color:#fb923c}html.vd-workspace-dark .rx-j.st-rouge span{color:#f87171}' +
    '.rx-md{margin:12px 0 4px;padding:12px 14px;border-radius:14px;background:rgba(148,163,184,.08)}.rx-mk{margin:0 0 6px;font-weight:800;font-size:15px}.rx-mn{margin:6px 0 0;font-size:13px;color:var(--mut,#64748b)}' +
    '.rx-ml{display:flex;justify-content:space-between;gap:12px;align-items:baseline;padding:8px 0;border-top:1px dashed rgba(148,163,184,.3);font-size:14px}.rx-ml:first-of-type{border-top:0}.rx-ml small{display:block;font-size:12px;color:var(--mut,#64748b);margin-top:2px}.rx-ml b{font-variant-numeric:tabular-nums;white-space:nowrap}.rx-ml b.ok{color:#16a34a}.rx-ml b.ko{color:#dc2626}html.vd-workspace-dark .rx-ml b.ok{color:#4ade80}html.vd-workspace-dark .rx-ml b.ko{color:#f87171}' +
    '.rx-leg{display:flex;flex-wrap:wrap;gap:6px 12px;margin:8px 0 0;font-size:11.5px;color:var(--mut,#64748b)}.rx-leg i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px;vertical-align:-1px}' +
    'html.vd-workspace-dark .rx text.obj{fill:#facc15}' +
    '@keyframes rxMonte{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
    '@media (prefers-reduced-motion:reduce){.rx .col rect.b{animation:none}}';
  var COUL = { vert: '#22c55e', juste: '#0ea5e9', jaune: '#eab308', orange: '#f97316', rouge: '#ef4444', vide: '#94a3b8' };

  function svg(m, anime) {
    var W = 340, H = 168, G = 34, D = 8, B = 136, T = 22, n = m.cols.length || 1;
    var rs = m.cols.filter(function (c) { return c.r != null; }).map(function (c) { return c.r; });
    var haut = Math.max(1.2, Math.min(2, Math.max.apply(null, rs.concat([1])) * 1.06)), bas = Math.min(0.6, Math.max(0, Math.min.apply(null, rs.concat([1])) - 0.08));
    var y = function (r) { return B - (Math.max(bas, Math.min(haut, r)) - bas) / (haut - bas) * (B - T); };
    var pas = (W - G - D) / n, larg = Math.max(3, Math.min(34, pas * 0.62)), s = '';
    [0.8, 1.2, 1.4, 1.6, 1.8, 2].forEach(function (g) { if (g > bas && g <= haut + 1e-9) s += '<line class="g" x1="' + G + '" x2="' + (W - D) + '" y1="' + y(g).toFixed(1) + '" y2="' + y(g).toFixed(1) + '"/><text class="ax" x="' + (G - 6) + '" y="' + (y(g) + 3).toFixed(1) + '" text-anchor="end">' + Math.round(g * 100) + ' %</text>'; });
    var yo = y(1);
    s += '<line class="obj" x1="' + G + '" x2="' + (W - D) + '" y1="' + yo.toFixed(1) + '" y2="' + yo.toFixed(1) + '"/><text class="obj" x="' + (G - 6) + '" y="' + (yo + 3).toFixed(1) + '" text-anchor="end">100 %</text>';
    var pasLib = n <= 13 ? 1 : Math.ceil(n / 7);
    m.cols.forEach(function (c, i) {
      var cx = G + pas * (i + 0.5), x = cx - larg / 2, cl = 'col' + (c.type === 'projete' ? ' proj' : '') + (c.type === 'encours' ? ' cours' : '') + (i === m.sel ? ' sel' : '');
      var lab = c.r != null ? c.lib + ' : ' + pct(c.r) : c.lib + (c.type === 'repos' ? ' : repos' : c.type === 'avant' ? ' : avant le début du suivi' : ' : sans chiffre');
      s += '<g class="' + cl + '" data-i="' + i + '" tabindex="' + (i === m.sel ? 0 : -1) + '" role="button" aria-label="' + esc(lab) + '">';
      s += '<rect class="hit" x="' + (cx - pas / 2).toFixed(1) + '" y="' + T + '" width="' + pas.toFixed(1) + '" height="' + (B - T + 16) + '" fill="transparent" rx="6"/>';
      if (c.type === 'repos') s += '<circle class="repos" cx="' + cx.toFixed(1) + '" cy="' + (B - 4) + '" r="2.6"><title>Repos</title></circle>';
      else if (c.type === 'avant') s += '';
      else if (c.type === 'vide') s += '<rect class="vide" x="' + x.toFixed(1) + '" y="' + (B - 3) + '" width="' + larg.toFixed(1) + '" height="3" rx="1.5"/>';
      else {
        var col = COUL[etat(c.r)], yt = y(c.r), hgt = Math.max(2, B - yt);
        s += '<rect class="b" x="' + x.toFixed(1) + '" y="' + yt.toFixed(1) + '" width="' + larg.toFixed(1) + '" height="' + hgt.toFixed(1) + '" rx="' + Math.min(6, larg / 2).toFixed(1) + '" fill="' + col + '" stroke="' + col + '" style="--d:' + (anime ? (i * 0.035).toFixed(3) : 0) + 's' + (anime ? '' : ';animation:none') + '"/>';
        s += '<text class="v" x="' + cx.toFixed(1) + '" y="' + (yt - 5).toFixed(1) + '" text-anchor="middle">' + ent(c.r) + ' %</text>';
      }
      var proche = i !== m.sel && Math.abs(i - m.sel) < pasLib;
      if (((i % pasLib === 0 || i === n - 1) && !proche) || i === m.sel) s += '<text class="ax" x="' + cx.toFixed(1) + '" y="' + (B + 14) + '" text-anchor="middle">' + esc(c.axe) + '</text>';
      s += '</g>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(m.kicker) + '">' + s + '</svg>';
  }
  function dessiner(box, m, anime) {
    var dt = detail(m.cols[m.sel], m.unite);
    box.setAttribute('data-st', dt.st); box.style.setProperty('--rx-c', COUL[dt.st]);
    box.innerHTML = '<p class="rx-k">' + esc(m.kicker) + '</p>' +
      '<div class="rx-hero"><b class="rx-big">' + esc(dt.big) + '</b><span class="rx-mot">' + esc(dt.mot) + '</span></div><p class="rx-lab" aria-live="polite">' + esc(dt.lab) + '</p>' +
      '<p class="rx-sub">' + esc(m.resume) + '</p>' + (m.vue === 'cal' ? calendrier(m) : svg(m, anime)) + (m.detailMois ? '<div class="rx-md" aria-live="polite"></div>' : '') +
      '<div class="rx-leg"><span><i style="background:#22c55e"></i>Minimum atteint avec 5 % de marge ou plus</span><span><i style="background:#0ea5e9"></i>Couvert de justesse (moins de 5 % au-dessus)</span><span><i style="background:#eab308"></i>Il manque moins de 5 %</span><span><i style="background:#f97316"></i>Il manque 5 à 10 %</span><span><i style="background:#ef4444"></i>Il manque plus de 10 %</span>' +
      (m.vue === 'cal' ? '<span><i style="background:rgba(148,163,184,.35)"></i>Repos</span><span><i style="background:transparent;border:2px solid currentColor;border-radius:50%"></i>Aujourd’hui</span>' : '<span><i style="width:14px;height:0;border-radius:0;border-top:2px dashed #d4a017;vertical-align:3px"></i>Minimum</span>') +
      (m.cols.some(function (c) { return c.type === 'projete'; }) ? '<span><i style="background:transparent;border:1.5px dashed #94a3b8"></i>Projeté</span>' : '') +
      (m.cols.some(function (c) { return c.type === 'encours'; }) ? '<span><i style="background:transparent;border:1.5px solid currentColor"></i>En cours</span>' : '') + '</div>';
  }
  /* C183 (Steven, 20/10, vidéo : « de base le jour J ou le dernier jour enregistré ; mais si le client clique sur un jour,
     il revoit son détail complet — là ça reste sur la même journée ») : un jour touché dans « Vos journées » devient le
     jour affiché partout dans le chapitre Jour — carte de la journée, courbe des journées, ventes et heures par service. */
  /* Retire une couleur figée par le garde-contraste pour l'état précédent (le texte garde la couleur de son état). */
  function defiger(box) { [].forEach.call(box.querySelectorAll('.rx-big,.rx-mot'), function (e) { if (e.hasAttribute('data-vx44')) { e.style.removeProperty('color'); e.removeAttribute('data-vx44'); } }); }
  function changer(el, prop, v) { if (el && el[prop] !== v) el[prop] = v; }
  function appliquerJour(d) {
    var date = d.__vx46jour, box = d.querySelector('#vx40-jour section.rx'); if (!date || !box || !box.__m) return;
    var c = box.__m.cols.filter(function (x) { return x.date === date; })[0], M = d.getElementById('modJour'); if (!c || !M) return;
    var dt = new Date(date + 'T12:00:00'), nom = JLONG[dt.getDay()] + ' ' + dt.getDate() + ' ' + MOIS[dt.getMonth()];
    changer(M.querySelector('.mod-h .kicker'), 'textContent', 'Journée d’exploitation du ' + nom);
    var reel = c.type === 'reel', ca = d.getElementById('jCA'), ve = d.getElementById('jVerdict'), so = d.getElementById('jSous');
    changer(ca, 'textContent', reel ? eur(c.valeur) : c.type === 'repos' ? 'Repos' : '—');
    changer(ve, 'textContent', reel ? (c.valeur >= c.cible ? 'Minimum dépassé de ' + eur(Math.round(c.valeur) - Math.round(c.cible)) : 'Il manque ' + eur(Math.round(c.cible) - Math.round(c.valeur)) + ' pour couvrir le minimum') : c.type === 'repos' ? 'Jour de repos : aucun chiffre attendu' : c.avenir ? 'Journée à venir' : 'Journée pas encore saisie');
    changer(so, 'textContent', reel ? 'Coût de cette journée : ' + eur(c.cible) + ', soit ' + pct(c.r) + ' du minimum.' : '');
    var st = reel ? detail(c, box.__m.unite).st : 'info'; if (M.getAttribute('data-etat') !== st) M.setAttribute('data-etat', st);
  }
  function choisir(box, m, i, focus) {
    if (i < 0 || i >= m.cols.length) return; m.sel = i; box.__sel = i;
    if (box.getAttribute('data-chap') === 'jour' && m.cols[i] && m.cols[i].date) {
      var d = box.ownerDocument, c = m.cols[i], reels = m.cols.filter(function (x) { return x.type === 'reel'; }), defaut = reels.length ? reels[reels.length - 1].date : null;
      d.__vx46jour = c.date === defaut ? null : c.date;
      var hit = d.querySelector('.jscroll .hit[data-n="' + c.jour + '"]'); if (hit) try { hit.dispatchEvent(new d.defaultView.MouseEvent('click', { bubbles: true })); } catch (e) {}
      appliquerJour(d); if (c.date === defaut) appliquerDefaut(d, c, m);
      try { d.dispatchEvent(new d.defaultView.CustomEvent('vx46-jour', { detail: { date: c.date } })); } catch (e) {}
    }
    var dt = detail(m.cols[i], m.unite);
    box.setAttribute('data-st', dt.st); box.style.setProperty('--rx-c', COUL[dt.st]);
    box.querySelector('.rx-big').textContent = dt.big; box.querySelector('.rx-lab').textContent = dt.lab; box.querySelector('.rx-mot').textContent = dt.mot;
    if (m.detailMois) majDetailMois(box, m);
    defiger(box);
    [].forEach.call(box.querySelectorAll('g.col,.rx-j'), function (g) { var on = Number(g.getAttribute('data-i')) === i; g.classList.toggle('sel', on); g.setAttribute('tabindex', on ? '0' : '-1'); if (g.tagName === 'BUTTON') g.setAttribute('aria-pressed', String(on)); if (on && focus) g.focus(); });
  }
  /* Revenir au dernier jour enregistré : mêmes champs, mêmes mots (la page le remet aussi à sa prochaine mise à jour). */
  function appliquerDefaut(d, c, m) { d.__vx46jour = c.date; appliquerJour(d); d.__vx46jour = null; }
  function poser(d, chap, m) {
    var ch = d.getElementById('vx40-' + chap), col = ch && ch.querySelector('.vx40-p'); if (!col || !m || !m.cols.length) return;
    var box = col.querySelector(':scope > section.rx'), sig = lng() + JSON.stringify(m.cols.map(function (c) { return [c.type, Math.round((c.valeur || 0)), Math.round((c.cible || 0))]; }));
    if (box && box.__sig === sig) return;
    var premier = !box;
    if (!box) {
      box = d.createElement('section'); box.className = 'rx'; box.setAttribute('data-chap', chap); col.insertBefore(box, col.firstChild);
      /* Toucher ou glisser n'importe où sur le graphique : la colonne la plus proche est choisie (zones d'appui larges). */
      var suivre = function (e) {
        var sv = box.querySelector('svg'); if (!sv || !box.__m) return; var r = sv.getBoundingClientRect(); if (!r.width) return;
        var vx = (e.clientX - r.left) / r.width * 340, n = box.__m.cols.length, i = Math.floor((vx - 34) / ((340 - 34 - 8) / n));
        i = Math.max(0, Math.min(n - 1, i)); if (i !== box.__m.sel) choisir(box, box.__m, i, false);
      };
      var appui = false;
      box.addEventListener('pointerdown', function (e) { if (!e.target.closest || !e.target.closest('svg')) return; appui = true; suivre(e); });
      box.addEventListener('pointermove', function (e) { if (appui) suivre(e); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { box.addEventListener(n, function () { appui = false; }); });
      box.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.rx-j'); if (b) choisir(box, box.__m, Number(b.getAttribute('data-i')), false); });
      box.addEventListener('keydown', function (e) {
        var g = e.target.closest && e.target.closest('g.col,.rx-j'); if (!g) return; var i = Number(g.getAttribute('data-i')), n = box.__m.cols.length;
        var pas = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: g.tagName === 'BUTTON' ? 7 : 0, ArrowUp: g.tagName === 'BUTTON' ? -7 : 0 }[e.key];
        if (pas) { e.preventDefault(); choisir(box, box.__m, Math.max(0, Math.min(n - 1, i + pas)), true); }
      });
    }
    if (box.__sel != null && box.__sel < m.cols.length) m.sel = box.__sel;
    box.__sig = sig; box.__m = m; dessiner(box, m, premier); if (m.detailMois) majDetailMois(box, m);
  }
  function tour() {
    var f = doc.querySelector('iframe.p41-ecran'), d = null; try { d = f && f.contentDocument; } catch (e) {}
    if (!d || !d.getElementById('vx40-jour')) return;
    var R = null; try { R = w.moteur(); } catch (e) {} if (!R || !R.ready || !w.VerdictPerformanceIntegrated || !w.VerdictAnnualProjection) return;
    if (!d.getElementById('rx-css')) { var s = d.createElement('style'); s.id = 'rx-css'; s.textContent = CSS; (d.head || d.documentElement).appendChild(s); }
    [['jour', jours], ['mois', moisAnnee], ['annee', annees]].forEach(function (p) { try { poser(d, p[0], p[1]()); } catch (e) {} });
    try { appliquerJour(d); } catch (e) {} /* C183 : le jour choisi reste affiché si la page se redessine */
  }
  setInterval(tour, 2000);
  w.addEventListener('load', function () { setTimeout(tour, 1500); });
  w.VerdictAccueilRythme = { tour: tour, jours: jours, mois: moisAnnee, annees: annees };
})();
