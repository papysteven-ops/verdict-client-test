/* C149 — « Rythme » : un graphique premium propre à l'Accueil, cohérent du jour à l'année (Steven, 18/10 : « fais-moi
   un premium différent de Performances ; ce n'est pas logique : Jour on voit les jours, Mois c'est les mois, Annuel…
   encore les mois ! il faut être cohérent » ; « premium ultra dans les fonctions et le visuel »).
   Une seule grammaire visuelle dans les trois chapitres, chacun avec SA propre unité :
     Jour  → les journées du mois en cours, chacune face à son objectif du jour ;
     Mois  → les mois de l'année, chacun face à son minimum (réalisé, en cours projeté, à venir projeté) ;
     Année → les années (historique saisi) face au minimum annuel d'aujourd'hui, l'année en cours projetée.
   Colonnes lumineuses animées (montée en cascade), couleur selon l'écart (vert ≥ 100 %, jaune ≥ 95 %, orange ≥ 90 %,
   rouge en dessous), ligne « objectif · 100 % », colonne sélectionnée mise en avant. Un appui (ou les flèches du
   clavier) sur une colonne affiche son détail en euros. Chiffres TTC, issus des mêmes moteurs que le reste de Verdict
   (VerdictPerformanceIntegrated, VerdictAnnualProjection, historique mensuel) : aucun chiffre n'est inventé ; une journée
   ouverte sans chiffre reste vide, un jour de repos est marqué. Remplace l'essai C148 (copie des courbes de Performances). */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdAccueilRythme) return; w.__vdAccueilRythme = true;
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var INIT = 'JFMAMJJASOND';
  var JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  function eur(v) { return Math.round(Number(v) || 0).toLocaleString('fr-FR') + ' €'; }
  function pct(r) { return (Math.round(r * 1000) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function etat(r) { return r == null ? 'vide' : r >= 1 ? 'vert' : r >= 0.95 ? 'jaune' : r >= 0.9 ? 'orange' : 'rouge'; }
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
      var base = { lib: lib, axe: String(d.day), jour: d.day, dow: (dt.getDay() + 6) % 7, wd: dt.getDay(), auj: d.date === auj, avenir: d.date > auj };
      if (d.preTracking) base.type = 'avant';
      else if (d.closed) base.type = 'repos';
      else if (d.ca == null || !(d.target > 0)) { base.type = 'vide'; base.cible = d.target > 0 ? d.target : null; }
      else { base.type = 'reel'; base.valeur = d.ca; base.cible = d.target; base.r = d.ca / d.target; }
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
      resume: reels.length ? ok + ' journée' + (ok > 1 ? 's' : '') + ' sur ' + reels.length + ' au-dessus de leur objectif · moyenne ' + pct(moy) + (meilleur && reels.length >= 5 ? ' · meilleur jour : ' + JLONG[meilleur.k] + ' (' + pct(meilleur.v) + ')' : '') : 'Aucune journée saisie ce mois-ci',
      unite: 'objectif du jour'
    };
  }
  function court(r) { return Math.round(r * 100) + '<small>\u202f%</small>'; }
  function calendrier(m) {
    var h = '<div class="rx-cal" role="group" aria-label="' + esc(m.kicker) + '">';
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(function (j) { h += '<span class="rx-cj" aria-hidden="true">' + j + '</span>'; });
    var prem = m.cols[0] ? m.cols[0].dow : 0; for (var k = 0; k < prem; k++) h += '<span class="rx-c0"></span>';
    m.cols.forEach(function (c, i) {
      var st = c.type === 'reel' ? etat(c.r) : c.type, v = c.type === 'reel' ? court(c.r) : c.type === 'repos' ? 'Repos' : c.type === 'avant' ? '' : c.avenir ? '' : '—';
      var al = c.type === 'reel' ? c.lib + ' : ' + pct(c.r) : c.lib + (c.type === 'repos' ? ' : repos' : c.avenir ? ' : à venir' : ' : sans chiffre');
      h += '<button type="button" class="rx-j st-' + st + (i === m.sel ? ' sel' : '') + (c.auj ? ' auj' : '') + '" data-i="' + i + '" tabindex="' + (i === m.sel ? 0 : -1) + '" aria-label="' + esc(al) + '" aria-pressed="' + (i === m.sel) + '"><b>' + c.jour + '</b><span>' + (c.type === 'reel' ? v : esc(v)) + '</span></button>';
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
  function moisDuPlan(c, an) {
    var cur = Number(moisCle().slice(5)), plans = w.DB && w.DB.performancePlans || {}, hist = {};
    (w.DB && w.DB.monthlyHistory || []).forEach(function (x) { hist[String(x.period).slice(0, 7)] = x; });
    var parMois = Number(c && c.minimum) > 0 ? Number(c.minimum) / 12 : 0;
    return MOIS.map(function (_, i) {
      var k = an + '-' + String(i + 1).padStart(2, '0'), h = hist[k], pl = plans[k], t = pl && Number(pl.minimum) > 0 ? Number(pl.minimum) : parMois;
      if (h && (h.seasonClosed || Number(h.openDays) === 0)) t = 0;
      return { kind: i + 1 < cur ? 'past' : i + 1 === cur ? 'current' : 'future', target: t, actual: h ? Number(h.caTTC) || 0 : 0, value: null };
    });
  }
  function moisAnnee() {
    var A = w.VerdictAnnualProjection, c = A.core(A.input()), an = moisCle().slice(0, 4), ad = aDate();
    var mois = c && c.months && c.months.length ? c.months : moisDuPlan(c, an);
    var cols = mois.map(function (m, i) {
      var lib = MOIS[i] + ' ' + an;
      if (!(m.target > 0)) return { lib: lib, axe: INIT[i], type: 'repos' };
      if (m.kind === 'past') return { lib: lib, axe: INIT[i], type: 'reel', valeur: m.actual, cible: m.target, r: m.actual / m.target };
      if (m.kind === 'current') return ad.attendu > 0 ? { lib: lib + ' (en cours)', axe: INIT[i], type: 'encours', encours: true, valeur: ad.encaisse, cible: ad.attendu, r: ad.encaisse / ad.attendu } : { lib: lib, axe: INIT[i], type: 'vide' };
      if (m.value == null) return { lib: lib, axe: INIT[i], type: 'vide', cible: m.target, avenir: true };
      return { lib: lib, axe: INIT[i], type: 'projete', valeur: m.value, cible: m.target, r: m.value / m.target };
    });
    var passes = cols.filter(function (x) { return x.type === 'reel'; }), ok = passes.filter(function (x) { return x.r >= 1; }).length;
    var sel = cols.findIndex(function (x) { return x.encours; }); if (sel < 0) sel = cols.length - 1;
    return {
      kicker: 'Vos mois · ' + an, cols: cols, sel: sel,
      resume: passes.length ? ok + ' mois sur ' + passes.length + ' terminés au-dessus de leur minimum' : 'Premier mois en cours',
      unite: 'minimum du mois'
    };
  }
  function annees() {
    var A = w.VerdictAnnualProjection, c = A.core(A.input()), an = Number(moisCle().slice(0, 4)), cible = Number(c.minimum) || 0;
    var par = {}; (w.DB && w.DB.monthlyHistory || []).forEach(function (x) { var y = Number(String(x.period || '').slice(0, 4)); if (y && y < an && x.caTTC > 0) par[y] = (par[y] || 0) + Number(x.caTTC); });
    var cols = Object.keys(par).map(Number).sort().slice(-6).map(function (y) { return { lib: 'Année ' + y, axe: String(y), type: 'reel', valeur: par[y], cible: cible, r: cible > 0 ? par[y] / cible : null }; });
    if (!(c.expected > 0)) { /* C157 : projection indisponible → année à date reprise du plan mensuel et de l'historique. */
      var ad = aDate(), ac = ad.encaisse, ex = ad.attendu; moisDuPlan(c, String(an)).forEach(function (m) { if (m.kind === 'past' && m.target > 0) { ac += m.actual; ex += m.target; } });
      c = Object.assign({}, c, { actual: ac, expected: ex });
    }
    if (c.expected > 0) cols.push({ lib: 'Année ' + an + ' (en cours)', axe: String(an), type: 'encours', encours: true, valeur: c.actual, cible: c.expected, r: c.actual / c.expected });
    /* Évolution : même période de l'année précédente (janvier → mois en cours), à périmètre comparable. */
    var mc = Number(moisCle().slice(5)), meme = 0; (w.DB && w.DB.monthlyHistory || []).forEach(function (x) { var p = String(x.period || ''); if (Number(p.slice(0, 4)) === an - 1 && Number(p.slice(5, 7)) <= mc && x.caTTC > 0) meme += Number(x.caTTC); });
    var evo = meme > 0 && c.actual > 0 ? (c.actual - meme) / meme : null;
    return {
      kicker: 'Vos années · comparées au minimum d’aujourd’hui', cols: cols, sel: cols.length - 1,
      resume: evo == null ? 'Historique en construction' : (evo >= 0 ? '+' : '−') + pct(Math.abs(evo)) + ' par rapport à ' + (an - 1) + ' à la même date (janvier → ' + MOIS[mc - 1] + ')',
      unite: 'minimum annuel'
    };
  }

  /* ---------- Détail d'une colonne ---------- */
  function detail(c, unite) {
    if (!c) return { big: '—', lab: '', st: 'vide' };
    if (c.type === 'repos') return { big: 'Repos', lab: c.lib + ' · fermé, aucun chiffre attendu', st: 'vide', mot: '' };
    if (c.type === 'avant') return { big: '—', lab: c.lib + ' · avant le début du suivi', st: 'vide', mot: '' };
    if (c.type === 'vide') return { big: c.cible ? eur(c.cible) : '—', lab: c.lib + (c.cible ? (c.avenir || c.auj ? ' · objectif du jour à réaliser' : ' · objectif du jour, chiffre à saisir') : ' · pas encore de chiffre'), st: 'vide', mot: c.cible ? (c.avenir ? 'À venir' : 'À saisir') : '' };
    var lab = c.type === 'encours' ? c.lib + ' · ' + eur(c.valeur) + ' encaissés pour ' + eur(c.cible) + ' attendus à cette date'
      : c.lib + ' · ' + (c.type === 'projete' ? eur(c.valeur) + ' projetés' : eur(c.valeur)) + ' pour ' + eur(c.cible) + ' (' + unite + ')';
    /* La couleur n'est jamais seule (WCAG 1.4.1) : un mot dit l'état. */
    var mot = c.r >= 1 ? (c.type === 'projete' ? 'Projeté atteint' : 'Atteint') : '−' + pct(1 - c.r).replace(' %', ' %') + ' sous l’objectif';
    return { big: pct(c.r), lab: lab, st: etat(c.r), mot: mot };
  }

  /* ---------- Dessin ---------- */
  var CSS =
    '.rx{position:relative;margin:0 0 14px;padding:16px 16px 12px;border-radius:var(--r-mod,20px);border:1px solid var(--line,rgba(148,163,184,.18));background:var(--card,#fff);overflow:hidden}' +
    '.rx:before{content:"";position:absolute;inset:-40% -10% auto auto;width:70%;height:120%;background:radial-gradient(closest-side,var(--rx-glow,rgba(34,197,94,.16)),transparent 70%);pointer-events:none}' +
    '.rx[data-st="jaune"]{--rx-glow:rgba(234,179,8,.16)}.rx[data-st="orange"]{--rx-glow:rgba(249,115,22,.16)}.rx[data-st="rouge"]{--rx-glow:rgba(239,68,68,.16)}.rx[data-st="vide"]{--rx-glow:rgba(148,163,184,.12)}' +
    '.rx-k{margin:0;font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut,#64748b)}' +
    '.rx-hero{display:flex;align-items:center;flex-wrap:wrap;gap:6px 12px;margin:6px 0 0}' +
    '.rx-big{font-size:40px;line-height:1;font-weight:850;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--rx-c,#16a34a);transition:color .3s}' +
    '.rx-mot{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:13px;font-weight:800;color:var(--rx-c,#16a34a);background:color-mix(in srgb,var(--rx-c,#22c55e) 14%,transparent)}.rx-mot:empty{display:none}' +
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
    '.rx-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin:14px 0 2px;max-width:560px}' +
    '.rx-cj{text-align:center;font-size:11px;font-weight:800;color:var(--mut,#64748b);letter-spacing:.04em;padding-bottom:2px}' +
    '.rx-j{appearance:none;-webkit-appearance:none;font:inherit;margin:0;min-width:0;min-height:50px;padding:5px 2px;border-radius:12px;border:1.5px solid transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;cursor:pointer;color:var(--txt,#0f172a);background:rgba(148,163,184,.10);transition:transform .12s ease,box-shadow .2s ease;-webkit-tap-highlight-color:transparent}' +
    '.rx-j:active{transform:scale(.95)}.rx-j b{font-size:15px;font-weight:800;line-height:1.1}.rx-j span{font-size:11px;font-weight:800;line-height:1.1;white-space:nowrap;min-height:12px}' +
    '.rx-j.st-vert{background:rgba(34,197,94,.16)}.rx-j.st-vert span{color:#15803d}.rx-j.st-jaune{background:rgba(234,179,8,.20)}.rx-j.st-jaune span{color:#a16207}' +
    '.rx-j.st-orange{background:rgba(249,115,22,.18)}.rx-j.st-orange span{color:#c2410c}.rx-j.st-rouge{background:rgba(239,68,68,.16)}.rx-j.st-rouge span{color:#b91c1c}' +
    '.rx-j.st-repos{background:rgba(148,163,184,.22)}.rx-j.st-repos b,.rx-j.st-repos span{color:var(--mut,#64748b)}.rx-j.st-repos span{font-size:10px;font-weight:700}' +
    '.rx-j.st-vide,.rx-j.st-avant{background:transparent;border-color:rgba(148,163,184,.30)}.rx-j.st-avant{opacity:.45}.rx-j.st-vide b{color:var(--mut,#64748b)}' +
    '.rx-j.auj{border-color:var(--txt,#0f172a)}.rx-j.sel{box-shadow:0 0 0 2.5px var(--rx-c,#22c55e),0 6px 16px -8px var(--rx-c,#22c55e);transform:translateY(-1px)}' +
    '.rx-j small{font-size:inherit}@media (max-width:360px){.rx-cal{gap:3px}.rx-j{border-radius:10px}.rx-j b{font-size:14px}.rx-j small{display:none}.rx-j.st-repos span{font-size:9px}}' +
    '.rx-j:focus-visible{outline:2px solid var(--rx-c,#22c55e);outline-offset:2px}' +
    'html.vd-workspace-dark .rx-j.st-vert span{color:#4ade80}html.vd-workspace-dark .rx-j.st-jaune span{color:#facc15}html.vd-workspace-dark .rx-j.st-orange span{color:#fb923c}html.vd-workspace-dark .rx-j.st-rouge span{color:#f87171}' +
    '.rx-leg{display:flex;flex-wrap:wrap;gap:6px 12px;margin:8px 0 0;font-size:11.5px;color:var(--mut,#64748b)}.rx-leg i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px;vertical-align:-1px}' +
    'html.vd-workspace-dark .rx text.obj{fill:#facc15}' +
    '@keyframes rxMonte{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
    '@media (prefers-reduced-motion:reduce){.rx .col rect.b{animation:none}}';
  var COUL = { vert: '#22c55e', jaune: '#eab308', orange: '#f97316', rouge: '#ef4444', vide: '#94a3b8' };

  function svg(m, anime) {
    var W = 340, H = 168, G = 34, D = 8, B = 136, T = 22, n = m.cols.length || 1;
    var rs = m.cols.filter(function (c) { return c.r != null; }).map(function (c) { return c.r; });
    var haut = Math.max(1.2, Math.min(2, Math.max.apply(null, rs.concat([1])) * 1.06)), bas = Math.min(0.6, Math.max(0, Math.min.apply(null, rs.concat([1])) - 0.08));
    var y = function (r) { return B - (Math.max(bas, Math.min(haut, r)) - bas) / (haut - bas) * (B - T); };
    var pas = (W - G - D) / n, larg = Math.max(3, Math.min(34, pas * 0.62)), s = '';
    [0.8, 1.2, 1.4, 1.6].forEach(function (g) { if (g > bas && g < haut) s += '<line class="g" x1="' + G + '" x2="' + (W - D) + '" y1="' + y(g).toFixed(1) + '" y2="' + y(g).toFixed(1) + '"/><text class="ax" x="' + (G - 6) + '" y="' + (y(g) + 3).toFixed(1) + '" text-anchor="end">' + Math.round(g * 100) + ' %</text>'; });
    var yo = y(1);
    s += '<line class="obj" x1="' + G + '" x2="' + (W - D) + '" y1="' + yo.toFixed(1) + '" y2="' + yo.toFixed(1) + '"/><text class="obj" x="' + (G - 6) + '" y="' + (yo + 3).toFixed(1) + '" text-anchor="end">100 %</text>';
    var pasLib = n <= 13 ? 1 : Math.ceil(n / 7);
    m.cols.forEach(function (c, i) {
      var cx = G + pas * (i + 0.5), x = cx - larg / 2, cl = 'col' + (c.type === 'projete' ? ' proj' : '') + (c.type === 'encours' ? ' cours' : '') + (i === m.sel ? ' sel' : '');
      var lab = c.r != null ? c.lib + ' : ' + pct(c.r) : c.lib + (c.type === 'repos' ? ' : repos' : ' : sans chiffre');
      s += '<g class="' + cl + '" data-i="' + i + '" tabindex="' + (i === m.sel ? 0 : -1) + '" role="button" aria-label="' + esc(lab) + '">';
      s += '<rect class="hit" x="' + (cx - pas / 2).toFixed(1) + '" y="' + T + '" width="' + pas.toFixed(1) + '" height="' + (B - T + 16) + '" fill="transparent" rx="6"/>';
      if (c.type === 'repos') s += '<circle class="repos" cx="' + cx.toFixed(1) + '" cy="' + (B - 4) + '" r="2.6"><title>Repos</title></circle>';
      else if (c.type === 'vide') s += '<rect class="vide" x="' + x.toFixed(1) + '" y="' + (B - 3) + '" width="' + larg.toFixed(1) + '" height="3" rx="1.5"/>';
      else {
        var col = COUL[etat(c.r)], yt = y(c.r), hgt = Math.max(2, B - yt);
        s += '<rect class="b" x="' + x.toFixed(1) + '" y="' + yt.toFixed(1) + '" width="' + larg.toFixed(1) + '" height="' + hgt.toFixed(1) + '" rx="' + Math.min(6, larg / 2).toFixed(1) + '" fill="' + col + '" stroke="' + col + '" style="--d:' + (anime ? (i * 0.035).toFixed(3) : 0) + 's' + (anime ? '' : ';animation:none') + '"/>';
        s += '<text class="v" x="' + cx.toFixed(1) + '" y="' + (yt - 5).toFixed(1) + '" text-anchor="middle">' + Math.round(c.r * 100) + ' %</text>';
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
      '<p class="rx-sub">' + esc(m.resume) + '</p>' + (m.vue === 'cal' ? calendrier(m) : svg(m, anime)) +
      '<div class="rx-leg"><span><i style="background:#22c55e"></i>Objectif atteint</span><span><i style="background:#eab308"></i>À moins de 5 %</span><span><i style="background:#f97316"></i>5 à 10 %</span><span><i style="background:#ef4444"></i>Plus de 10 %</span>' +
      (m.vue === 'cal' ? '<span><i style="background:rgba(148,163,184,.35)"></i>Repos</span><span><i style="background:transparent;border:2px solid currentColor;border-radius:50%"></i>Aujourd’hui</span>' : '<span><i style="width:14px;height:0;border-radius:0;border-top:2px dashed #d4a017;vertical-align:3px"></i>Objectif</span>') +
      (m.cols.some(function (c) { return c.type === 'projete'; }) ? '<span><i style="background:transparent;border:1.5px dashed #94a3b8"></i>Projeté</span>' : '') +
      (m.cols.some(function (c) { return c.type === 'encours'; }) ? '<span><i style="background:transparent;border:1.5px solid currentColor"></i>En cours</span>' : '') + '</div>';
  }
  function choisir(box, m, i, focus) {
    if (i < 0 || i >= m.cols.length) return; m.sel = i; box.__sel = i;
    var dt = detail(m.cols[i], m.unite);
    box.setAttribute('data-st', dt.st); box.style.setProperty('--rx-c', COUL[dt.st]);
    box.querySelector('.rx-big').textContent = dt.big; box.querySelector('.rx-lab').textContent = dt.lab; box.querySelector('.rx-mot').textContent = dt.mot;
    [].forEach.call(box.querySelectorAll('g.col,.rx-j'), function (g) { var on = Number(g.getAttribute('data-i')) === i; g.classList.toggle('sel', on); g.setAttribute('tabindex', on ? '0' : '-1'); if (g.tagName === 'BUTTON') g.setAttribute('aria-pressed', String(on)); if (on && focus) g.focus(); });
  }
  function poser(d, chap, m) {
    var ch = d.getElementById('vx40-' + chap), col = ch && ch.querySelector('.vx40-p'); if (!col || !m || !m.cols.length) return;
    var box = col.querySelector(':scope > section.rx'), sig = JSON.stringify(m.cols.map(function (c) { return [c.type, Math.round((c.valeur || 0)), Math.round((c.cible || 0))]; }));
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
    box.__sig = sig; box.__m = m; dessiner(box, m, premier);
  }
  function tour() {
    var f = doc.querySelector('iframe.p41-ecran'), d = null; try { d = f && f.contentDocument; } catch (e) {}
    if (!d || !d.getElementById('vx40-jour')) return;
    var R = null; try { R = w.moteur(); } catch (e) {} if (!R || !R.ready || !w.VerdictPerformanceIntegrated || !w.VerdictAnnualProjection) return;
    if (!d.getElementById('rx-css')) { var s = d.createElement('style'); s.id = 'rx-css'; s.textContent = CSS; (d.head || d.documentElement).appendChild(s); }
    [['jour', jours], ['mois', moisAnnee], ['annee', annees]].forEach(function (p) { try { poser(d, p[0], p[1]()); } catch (e) {} });
  }
  setInterval(tour, 2000);
  w.addEventListener('load', function () { setTimeout(tour, 1500); });
  w.VerdictAccueilRythme = { tour: tour, jours: jours, mois: moisAnnee, annees: annees };
})();
