/* C123 — « Pourquoi ce montant ? » (Steven, 16/10 : « je veux que tout soit expliqué parfaitement ; le samedi a une
   base plus haute que le lundi »). Sous la saisie du jour et dans le détail de chaque jour du calendrier, trois lignes
   simples puis le calcul :
   1. la structure du mois (minimum de chiffre d'affaires, jours ouverts, repos exclus) ;
   2. la part de ce jour (selon ce qu'il fait d'habitude : moyenne des 10 dernières semaines) ;
   3. le retard des jours précédents, à rattraper en entier ce jour-là (C122), ou l'avance gardée en réserve ;
   puis « Base + retard = à réaliser ». Tous les chiffres viennent du plan du mois et de VerdictCHR : rien n'est recalculé
   autrement que par l'appli. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdObjectifExplique) return; w.__vdObjectifExplique = true;
  var JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  function eur(v) { return Math.round(Number(v) || 0).toLocaleString('fr-FR') + ' €'; }
  function jourSem(date) { return (new Date(date + 'T12:00:00').getDay() + 6) % 7; }
  function libJour(date) { var d = new Date(date + 'T12:00:00'); return JOURS[jourSem(date)] + ' ' + d.getDate(); }
  /* Moyenne réelle par jour de semaine sur les 70 jours avant la date (au moins 2 journées par jour de semaine). */
  function moyennes(avant) {
    var fin = new Date(avant + 'T00:00:00'), debut = new Date(fin); debut.setDate(debut.getDate() - 70);
    var s = [[], [], [], [], [], [], []];
    try { (w.DB && w.DB.histJour || []).forEach(function (r) { var d = new Date(String(r.date) + 'T00:00:00'), v = Number(r.caJ); if (d < fin && d >= debut && isFinite(v) && v >= 0) s[jourSem(String(r.date))].push(v); }); } catch (e) {}
    return s.map(function (a) { return a.length >= 2 ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; });
  }
  /* C130 — Règle des références CHR : budget figé (base du jour, couleurs) ; « à réaliser » glissant = reste à faire du
     mois (objectif du mois − encaissé) réparti sur les jours ouverts restants selon leur poids ; l'écart de l'année à date
     est réparti sur les mois restants. Retard et avance comptent dans les deux sens. */
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function hist() { try { return (w.DB && w.DB.histJour || []).filter(function (r) { return r && r.date && isFinite(Number(r.caJ)) && Number(r.caJ) >= 0; }); } catch (e) { return []; } }
  function ticketMoyen(avant) { var fin = new Date(avant + 'T00:00:00'), deb = new Date(fin); deb.setDate(deb.getDate() - 56); var ca = 0, tk = 0;
    hist().forEach(function (r) { var d = new Date(String(r.date) + 'T00:00:00'), t = Number(r.tkJ); if (d < fin && d >= deb && t > 0) { ca += Number(r.caJ); tk += t; } }); return tk >= 20 ? ca / tk : null; }
  function meilleurJour(avant) { var m = 0; hist().forEach(function (r) { if (String(r.date) < avant) m = Math.max(m, Number(r.caJ)); }); return m || null; }
  /* C225 (X08) : « Année à date » = l'année suivie (même plan que la carte Année), jamais les seuls chiffres du mois. Rien
     n'est dit tant que le suivi n'a pas au moins un mois avant celui-ci, ou s'il manque des journées. */
  function anneeADate(c) {
    try { var key = c.input.days[0].date.slice(0, 7), y = key.slice(0, 4), V = w.VerdictPerformanceIntegrated, st = V && V.seasonState ? V.seasonState(w.moteur(), y, false) : null;
      if (!st || !st.available || st.missingDays || !(Number(st.expectedToDate) > 0)) return null;
      var debut = String(st.plan && st.plan.trackingStart || ''); if (debut && debut.slice(0, 7) >= key) return null;
      return { attendu: Number(st.expectedToDate), encaisse: Number(st.actual), moisPasses: Number(key.slice(5)) - 1 }; } catch (e) { return null; } }
  /* C225 (X08) : l'avance ou le retard du mois = encaissé arrondi − attendu arrondi, comme les montants affichés à côté
     (règle C205) ; partout le même chiffre (6 978 €, jamais 6 978 € ici et 6 979 € là). */
  function ecartMois(c) { var a = Number(c && c.actual), x = Number(c && c.expected); if (!isFinite(a) || !isFinite(x)) return { retard: Number(c && c.deficit) || 0, avance: Number(c && c.advance) || 0 }; var e = Math.round(a) - Math.round(x); return { retard: Math.max(0, -e), avance: Math.max(0, e) }; }
  function signe(v) { return (v >= 0 ? '+' : '−') + eur(Math.abs(v)); }
  function position(c) {
    if (!c || !c.exact) return '';
    var base = Number(c.base) || 0, em = ecartMois(c), retard = em.retard, avance = em.avance, total = Number(c.catchup) || base, g = c.input && c.input.glissant, out = '';
    var saisies = c.input && Array.isArray(c.input.days) ? c.input.days.filter(function (d) { return d && d.ca != null; }).length : 1; /* C213 (W08) : sans journée saisie, le mois n'est ni en retard ni « dans les temps » */
    out += retard > 0 ? '<span class="vx39-pos retard">Retard du mois : <b>' + eur(retard) + '</b></span>' : (avance > 0 ? '<span class="vx39-pos avance">Avance du mois : <b>+' + eur(avance) + '</b></span>' : (saisies ? '<span class="vx39-pos">Mois dans les temps</span>' : '<span class="vx39-pos">Aucune journée saisie ce mois-ci</span>'));
    out += '<small>Reste à faire ce mois : <b>' + eur(c.remaining) + '</b> sur ' + c.openRemaining + ' jour' + (c.openRemaining > 1 ? 's' : '') + ' ouvert' + (c.openRemaining > 1 ? 's' : '') + ', réparti selon le poids de chaque jour : aujourd’hui ' + eur(total) + ' (base ' + eur(base) + ' ' + signe(total - base) + ').</small>';
    if (g && Math.abs(Number(g.ecartAnnee) || 0) >= 1) out += '<small class="vx39-rep">Année : ' + (g.ecartAnnee > 0 ? 'retard' : 'avance') + ' de ' + eur(Math.abs(g.ecartAnnee)) + ' sur les mois passés, réparti sur les ' + g.moisRestants + ' mois restants (' + signe(g.partMois) + ' sur ce mois).</small>';
    var tm = c.input && c.input.days ? ticketMoyen(c.next || c.input.days[0].date) : null; if (tm) out += '<small>Soit environ <b>' + Math.ceil(total / tm) + ' couverts</b> au ticket moyen de ' + tm.toFixed(2).replace('.', ',') + ' € TTC (8 dernières semaines).</small>';
    var best = c.next ? meilleurJour(c.next) : null; if (best && total > best) out += '<small class="vx39-alerte">Au-dessus de votre meilleur jour (' + eur(best) + ') : ce retard ne se rattrapera pas en une journée ; il reste réparti sur le mois et l’année.</small>';
    var a = anneeADate(c); if (a && a.attendu > 0) out += '<small>Année à date : <b>' + eur(a.encaisse) + '</b> encaissés pour ' + eur(a.attendu) + ' attendus (' + signe(a.encaisse - a.attendu) + ').</small>';
    return out;
  }
  /* C126/C130 — Détail d'un jour passé : écart du mois avant ce jour, ce qu'il y avait à réaliser ce jour-là (base ±
     ajustement glissant), et l'écart du mois après ce jour. */
  function lignesJour(input, date) {
    if (!input || !w.VerdictCHR || joursInconnus()) return ''; /* C245 */
    var jour = input.days.filter(function (d) { return d.date === date; })[0]; if (!jour || jour.ca == null) return '';
    var c; try { c = w.VerdictCHR.calculate({ minimum: input.minimum, today: date, days: input.days.map(function (d) { return Object.assign({}, d, { ca: d.date >= date ? null : d.ca }); }) }); } catch (e) { return ''; }
    if (!c || !c.exact || c.next !== date) return '';
    var base = Number(c.base) || 0, avant = (Number(c.deficit) || 0) - (Number(c.advance) || 0), aFaire = Number(c.catchup) || base, ca = Number(jour.ca) || 0, apres = avant + base - ca;
    function pos(v, quand) { return v > 0.5 ? '<dt>Retard du mois ' + quand + '</dt><dd class="vx39-r">' + eur(v) + '</dd>' : (v < -0.5 ? '<dt>Avance du mois ' + quand + '</dt><dd class="vx39-a">+' + eur(-v) + '</dd>' : '<dt>Mois ' + quand + '</dt><dd>dans les temps</dd>'); }
    return '<div class="vx39-l" data-vx39l="' + date + '">' + pos(avant, 'avant ce jour') + '</div>' +
      '<div class="vx39-l"><dt>Minimum à faire ce jour-là<small>minimum du jour ' + eur(base) + ' ' + signe(aFaire - base) + ' (' + (aFaire < base ? 'part de l’avance du mois' : 'part du retard du mois') + ')</small></dt><dd><b>' + eur(aFaire) + '</b></dd></div>' +
      '<div class="vx39-l">' + pos(apres, 'après ce jour') + '</div>';
  }
  /* C213 (W11) : quand le suivi commence en cours de mois, le budget est la part des jours suivis, selon le même calcul que l'année. */
  function debutMois(plan, date) {
    var s = String(plan && plan.trackingStart || ''); if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || s.slice(0, 7) !== date.slice(0, 7) || s.slice(8) === '01') return '';
    var ap = w.DB && w.DB.performanceYearPlans && w.DB.performanceYearPlans[s.slice(0, 4)], full = ap && ap.fullMonthlyTargets && Number(ap.fullMonthlyTargets[s.slice(0, 7)]);
    return ' Suivi depuis le ' + (Number(s.slice(8)) === 1 ? '1er' : Number(s.slice(8))) + ' ' + MOIS[Number(s.slice(5, 7)) - 1] + ' : c’est la part de ces jours' + (full > 0 ? ' dans le minimum du mois entier (' + eur(full) + ')' : '') + '.';
  }
  /* C225 (T2-04) : dire comment l'année est répartie entre les mois. Avec une seule année d'historique, la saison compte pour
     60 % et les jours d'ouverture pour 40 % (une année seule peut contenir des accidents) ; à partir de 2 années, 80 % / 20 %. */
  function saisonMois(date) {
    try { var ap = w.DB.performanceYearPlans[date.slice(0, 4)], ev = ap && ap.evidenceYears || [], n = ev.length;
      if (!n) return ' Les mois sont répartis selon leurs jours d’ouverture : aucune année complète ne donne encore votre saison.';
      return n === 1 ? ' Les mois sont répartis à 60 % selon la saison de votre année ' + ev[0] + ' et à 40 % selon leurs jours d’ouverture : une seule année peut contenir des accidents. Dès 2 années, la saison comptera pour 80 %.'
        : ' Les mois sont répartis à 80 % selon la saison de vos ' + n + ' années (' + ev.slice().sort().join(', ') + ') et à 20 % selon leurs jours d’ouverture.'; } catch (e) { return ''; }
  }
  function report(input) { var g = input && input.glissant; if (!g || !g.ecartAnnee) return null; return { ecartAnnee: g.ecartAnnee, partMois: g.partMois, moisRestants: g.moisRestants }; }
  var ouverts = {}; /* l'ouverture survit aux redessins du module */
  function bloc(input, date, aujourdHui) {
    if (!input || !Array.isArray(input.days) || !w.VerdictCHR || joursInconnus()) return ''; /* C245 : pas de part du jour tant que les jours sont inconnus */
    var jour = input.days.filter(function (d) { return d.date === date; })[0]; if (!jour) return '';
    var c; try { c = w.VerdictCHR.calculate({ minimum: input.minimum, today: date, days: input.days.map(function (d) { return Object.assign({}, d, { ca: d.date >= date ? null : d.ca }); }) }); } catch (e) { return ''; }
    if (!c || !c.exact || c.next !== date) return '';
    var base = Number(c.base) || 0, total = Number(c.catchup) || base, budget = Number(input.budget) || Number(input.minimum) || 0, g = input.glissant;
    var plan = w.DB && w.DB.performancePlans && w.DB.performancePlans[date.slice(0, 7)], src = plan && Array.isArray(plan.weekdayMeans) ? plan.weekdayMeansSource : null;
    var M = plan && Array.isArray(plan.weekdayMeans) ? plan.weekdayMeans : moyennes(date.slice(0, 7) + '-01') /* C213 (W09) : les poids qui ont fixé les bases du mois, lus dans le plan */, connus = M.filter(function (m) { return m != null && m > 0; }), js = jourSem(date), lui = M[js];
    var quand = src === 'lastYear' ? 'Sur les mêmes semaines de l’an dernier (votre caisse ' + (Number(date.slice(0, 4)) - 1) + ')' : src === 'year' ? 'Sur vos 12 derniers mois de caisse' : 'Sur les 10 semaines avant ce mois';
    var bas = null; M.forEach(function (m, i) { if (m != null && i !== js && (bas === null || m < M[bas])) bas = i; });
    var part = connus.length >= 3 && lui != null
      ? 'Chaque jour reçoit sa part selon ce qu’il fait d’habitude. ' + quand + ', un <b>' + JOURS[js] + '</b> rapporte en moyenne <b>' + eur(lui) + '</b>' + (bas !== null ? ', un ' + JOURS[bas] + ' ' + eur(M[bas]) : '') + ' : la base du ' + JOURS[js] + ' est ' + (bas !== null && lui > M[bas] ? 'plus haute' : 'adaptée') + '. Base de ce jour : <b>' + eur(base) + '</b>.'
      : 'Aucune caisse jour par jour ne dit encore ce que rapporte chaque jour de semaine : chaque jour ouvert reçoit la même part, <b>' + eur(base) + '</b>.';
    var annee = g && Math.abs(Number(g.ecartAnnee) || 0) >= 1 ? ' L’année porte ' + (g.ecartAnnee > 0 ? 'un retard' : 'une avance') + ' de <b>' + eur(Math.abs(g.ecartAnnee)) + '</b> sur les mois passés, réparti sur les ' + g.moisRestants + ' mois restants : minimum du mois <b>' + eur(input.minimum) + '</b> (' + signe(g.partMois) + ').' : '';
    var reste = (/reste du mois/.test(resteMois(input.minimum, date)) ? 'Minimum du reste du mois ' : 'Minimum du mois ') /* C264 (R1) */ + eur(input.minimum) + ' − encaissé ' + eur(c.actual) + ' = <b>' + eur(Math.max(0, Math.round(input.minimum) - Math.round(c.actual))) /* C298 (V15-044) : opération juste telle qu'écrite */ + '</b> à faire sur les <b>' + c.openRemaining + ' jours ouverts</b> restants, ' + (aujourdHui ? 'partagés' : 'qui étaient partagés') + ' selon leur poids : un retard fait monter la part de chaque jour, une avance la fait baisser.';
    return '<details class="vx39" data-vx39="' + date + '"' + (ouverts[date] ? ' open' : '') + '><summary class="vx39-t"><span>Pourquoi ' + (aujourdHui ? 'ce montant aujourd’hui' : 'ce montant le ' + libJour(date)) + ' ?</span><i aria-hidden="true">›</i></summary><div class="vx39-c"><ol>' +
      '<li><b>Le budget du mois</b> : <b>' + eur(budget) + '</b> de chiffre d’affaires, la part de ce mois dans le minimum annuel qui couvre vos charges, salaires et loyer, sur <b>' + input.days.length + ' jours ouverts</b> (jours de repos exclus).' + debutMois(plan, date) + saisonMois(date) + annee + '</li>' +
      '<li><b>La part de ce jour</b> : ' + part + '</li>' +
      '<li><b>Le reste à faire</b> : ' + reste + '</li></ol>' +
      '<p class="vx39-f">Base ' + eur(base) + ' ' + signe(total - base) + ' = <b>' + eur(total) + '</b> ' + (aujourdHui ? 'à réaliser aujourd’hui' : 'à réaliser ce jour-là') + '</p></div></details>';
  }
  var CSS = '.vx39-r{color:#ea580c!important;font-weight:800}.vx39-a{color:#16a34a!important;font-weight:800}html.vd-workspace-dark .vx39-r{color:#fb923c!important}html.vd-workspace-dark .vx39-a{color:#4ade80!important}.vx39-l dt small{display:block;font-size:12px;opacity:.75;font-weight:500}' +
    /* C142 (Steven, 17/10 : « avant c'était nickel, fluide, clair ; là énormément d'infos utiles, ça fait chargé ») :
       la carte du jour garde l'essentiel (à réaliser, avance ou retard du mois, saisie) ; le détail passe dans le volet
       replié « Pourquoi ce montant ? » ; « Reste à faire aujourd'hui » et sa barre n'apparaissent qu'une fois une saisie
       commencée (avant, ils répètent exactement « À réaliser »). */
    '#modSaisie .day-total>p:not(.vx39-p){font-size:19px;font-weight:800;margin:6px 0 2px;letter-spacing:-.01em}' +
    '#modSaisie p.vx39-p{flex-direction:row;flex-wrap:wrap;margin:6px 0 12px}#modSaisie p.vx39-p small{display:none}' +
    '#modSaisie .vx39-pos{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:14px;background:rgba(148,163,184,.14)}' +
    '#modSaisie .vx39-pos.avance{background:rgba(34,197,94,.13)}#modSaisie .vx39-pos.retard{background:rgba(249,115,22,.14)}' +
    '#modSaisie .day-total:has(.day-none)>.day-track,#modSaisie .day-total:has(.day-none)>b{display:none}' +
    '#modSaisie .day-total:has(.day-none)>small,#modSaisie .day-total:has(.day-none)>strong{display:none}#modSaisie p.vx39-p{display:none!important}' +
    '#modSaisie p.vx53-o{font-size:22px!important;font-weight:800;margin:4px 0 4px!important;letter-spacing:-.01em}#modSaisie p.vx53-o b{font-variant-numeric:tabular-nums}' +
    '#modSaisie .day-total>p.vx53-e{margin:0 0 12px!important;font-size:15px!important;font-weight:500!important;line-height:1.45;letter-spacing:0!important;opacity:.92}#modSaisie p.vx53-e b{font-weight:800}' +
    '.vx39-d{display:grid;gap:6px;margin:0 0 12px;padding:0 0 12px;border-bottom:1px dashed rgba(34,197,94,.35)}.vx39-d small{font-size:14px;line-height:1.45;opacity:.9}' +
    '.vx39-alerte{color:#ea580c;font-weight:700}html.vd-workspace-dark .vx39-alerte{color:#fb923c}p.vx39-p{display:flex;flex-direction:column;gap:3px;margin:6px 0 10px}p.vx39-p small{font-size:13px;opacity:.85}.vx39-pos{font-weight:700}.vx39-pos.avance b{color:#16a34a}.vx39-pos.retard b{color:#ea580c}html.vd-workspace-dark .vx39-pos.avance b{color:#4ade80}html.vd-workspace-dark .vx39-pos.retard b{color:#fb923c}' +
    '.vx39>summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;min-height:44px}.vx39>summary::-webkit-details-marker{display:none}' +
    '.vx39>summary i{font-style:normal;font-size:22px;line-height:1;opacity:.6;transition:transform .25s}.vx39[open]>summary i{transform:rotate(90deg)}.vx39:not([open]){padding-top:4px!important;padding-bottom:4px!important}.vx39-c{padding-top:4px}' +
    '.vx39{margin:16px 0 0;padding:14px 16px;border-radius:16px;background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.22);color:inherit;font-size:14.5px;line-height:1.5}' +
    '.vx39-t{margin:0!important;font-weight:800;font-size:15px}.vx39 ol{margin:0;padding-left:20px;display:grid;gap:7px}.vx39 li{padding-left:2px}' +
    '.vx39-f{margin:10px 0 0!important;padding-top:10px;border-top:1px dashed rgba(34,197,94,.35);font-variant-numeric:tabular-nums}.vx39-f b{color:#16a34a;font-size:16px}' +
    'html.vd-workspace-dark .vx39{background:rgba(34,197,94,.09);border-color:rgba(34,197,94,.28)}html.vd-workspace-dark .vx39-f b{color:#4ade80}';

  /* C143 — Une seule « avance du mois » partout. Dans le détail du mois en cours (courbe des mois), la case
     « Écart au minimum » montrait l'écart PRÉVU en fin de mois (fin de mois estimée − minimum : +3 957 €), à côté de
     « Encaissé à ce jour » : le client y lisait une deuxième avance, différente de celle de la carte du jour (+2 036 €).
     La case est renommée « Écart prévu en fin de mois » et une case « Avance à ce jour » (ou « Retard à ce jour ») reprend
     exactement le chiffre de la carte du jour (règle CHR, attendu à cette date selon le poids des jours). */
  function uneSeuleAvance(d, chr) {
    if (!d || !chr || !chr.exact) return;
    [].forEach.call(d.querySelectorAll('.tuile small'), function (sm) {
      if ((sm.textContent || '').trim() !== 'Écart au minimum') return;
      var tuile = sm.closest('.tuile'), boite = tuile && tuile.parentElement; if (!boite) return;
      var encours = [].some.call(boite.querySelectorAll('.tuile small'), function (x) { return (x.textContent || '').trim() === 'Encaissé à ce jour'; });
      if (!encours) return;
      sm.textContent = 'Écart prévu en fin de mois';
      if (boite.querySelector('.vx43-avance')) return;
      var em = ecartMois(chr), retard = em.retard, avance = em.avance;
      var t = d.createElement('div'); t.className = 'tuile vx43-avance'; t.style.minWidth = '0';
      t.innerHTML = '<small style="display:block;overflow-wrap:anywhere"></small><b style="display:block;overflow-wrap:anywhere"></b>';
      t.querySelector('small').textContent = retard > 0 ? 'Retard à ce jour' : 'Avance à ce jour';
      var b = t.querySelector('b'); b.textContent = retard > 0 ? '−' + eur(retard) : (avance > 0 ? '+' + eur(avance) : '0 €'); b.style.color = retard > 0 ? '#ef4444' : '#22c55e';
      boite.insertBefore(t, tuile);
    });
  }
  /* C153 (Steven, 18/10 : « j'aime pas du tout, tu trouves ça cohérent, compréhensible ? » devant « À réaliser
     aujourd'hui : 1 147,98 € (base 967,15 € + rattrapage) · Retard du mois : 2 796 € ») : des centimes, du jargon
     (« base », « rattrapage ») et deux chiffres sans lien visible (181 € de rattrapage aujourd'hui contre 2 796 € de
     retard). Désormais une seule phrase relie tout : « Objectif aujourd'hui : 1 148 € » puis « 967 € pour couvrir les
     charges d'un dimanche + 181 € pour rattraper le retard du mois (2 796 € à combler sur 13 jours ouverts…) ».
     Montants à l'euro près dans la carte du jour. */
  function montant(t) { var m = /([\d\u202f\u00a0 .]+(?:,\d{1,2})?)\s*€/.exec(t || ''); return m ? Number(m[1].replace(/[\s\u202f\u00a0.]/g, '').replace(',', '.')) : null; }
  /* C245 : jours d'ouverture inconnus (document comptable seul, question de l'Accueil sans réponse) : aucun minimum du jour inventé. */
  function joursInconnus() { try { return typeof w.verdictJoursInconnus === 'function' && !!w.verdictJoursInconnus(); } catch (e) { return false; } }
  /* C256 : le mois où commence le suivi n'a pour minimum que la part restante ; on la nomme et on donne le mois entier à côté. */
  function resteMois(min, date) { var s = String(w.DB && w.DB.performanceTrackingStartedAt || ''), k = String(date || '').slice(0, 7), full = null;
    try { var ap = w.DB.performanceYearPlans[k.slice(0, 4)]; full = ap && ap.fullMonthlyTargets ? Number(ap.fullMonthlyTargets[k]) : null; } catch (e) {}
    if (/^\d{4}-\d{2}-\d{2}$/.test(s) && s.slice(0, 7) === k && s.slice(8) !== '01' && full > Number(min) + 0.5) return 'Minimum du reste du mois, depuis le ' + Number(s.slice(8)) + ' ' + MOIS[Number(s.slice(5, 7)) - 1] + ' : <b>' + eur(min) + '</b> (mois entier : ' + eur(full) + ').';
    return 'Minimum du mois : <b>' + eur(min) + '</b>.'; }
  /* C298 (V15-070) : la date de la journée de la carte de saisie (une journée passée choisie par « Corriger cette journée » ; avec tous, aussi aujourd'hui). */
  function cleSaisie(S, tous) { if (!S || (!S.passe && !tous) || S.cle || !(S.n >= 1)) return null; var k; try { k = String(w.verdictOperationalClock().key).slice(0, 8); } catch (e) { return null; } return k + (S.n < 10 ? '0' : '') + S.n; }
  function clair(lp, c, S) {
    var t = montant(lp.textContent), base = Number(S.obj) || t, passe = /pour cette journée/.test(lp.textContent);
    if (!(t > 0)) return;
    if (joursInconnus()) { lp.className = 'vx53-o'; lp.innerHTML = 'Minimum à faire ' + (passe ? 'cette journée-là' : 'aujourd’hui') + ' : <b>à confirmer</b>';
      var ex0 = lp.nextElementSibling; if (!ex0 || !ex0.classList.contains('vx53-e')) { ex0 = lp.ownerDocument.createElement('p'); ex0.className = 'vx53-e'; lp.insertAdjacentElement('afterend', ex0); }
      ex0.innerHTML = 'Il dépend de vos jours d’ouverture : répondez à « Combien de jours ouvrez-vous par semaine ? », en haut de l’Accueil.' + (c && c.input && Number(c.input.minimum) > 0 ? ' ' + resteMois(c.input.minimum, S.cle || (c && c.next) || (function () { try { return String(w.verdictOperationalClock().key); } catch (e) { return ''; } })()) : ''); return; }
    var cleS = S.cle || cleSaisie(S, true); /* C298 (V15-070, 084) : la journée de la carte (passée, ou aujourd'hui déjà saisi) se lit avec l'avance du mois et les jours restants de ce jour-là */
    if (cleS && c && c.input && Array.isArray(c.input.days) && c.next !== cleS && w.VerdictCHR) { try { var c0 = w.VerdictCHR.calculate({ minimum: c.input.minimum, today: cleS, days: c.input.days.map(function (x) { return Object.assign({}, x, { ca: x.date >= cleS ? null : x.ca }); }) }); if (c0 && c0.exact && c0.next === cleS) c = c0; } catch (e) {} }
    var date = cleS || (c && c.next), jourDate = cleS || (function () { try { return String(w.verdictOperationalClock().key).slice(0, 10); } catch (e) { return date; } })(), jour = jourDate ? JOURS[jourSem(jourDate)] : 'jour', extra = Math.round(t) - Math.round(base); /* C240 : le jour de la carte (après la saisie, c.next est déjà demain) */
    var meme = c && c.exact && c.next === date, em = meme ? ecartMois(c) : { retard: 0, avance: 0 }, retard = em.retard, avance = em.avance, ouv = meme ? Number(c.openRemaining) || 0 : 0;
    /* C177 (Steven, 20/10 : « je comprends rien : 2 300 c'est quoi, si 1 676… là tu additionnes, mais pourquoi ? Je ne
       comprends pas l'info d'après ») : l'avance (ou le retard) du mois est partagée entre les jours ouverts qui restent ;
       seule la part d'aujourd'hui compte. La phrase le dit, et montre le calcul. */
    var jours = ouv + ' jour' + (ouv > 1 ? 's' : '') + ' ouvert' + (ouv > 1 ? 's' : '') + ' restant' + (ouv > 1 ? 's' : '');
    var charges = 'Minimum de ce ' + jour + ' : <b>' + eur(base) + '</b>.', e; /* C225 (X07) */
    if (extra >= 1 && retard > 0) e = charges + ' Le mois a <b>' + eur(retard) + '</b> de retard, partagé entre les ' + jours + ' selon le poids de chaque jour\u00a0: <b>+ ' + eur(extra) + '</b> pour ce ' + jour + '.<br>' + eur(base) + ' + ' + eur(extra) + ' = <b>' + eur(t) + '</b>.';
    else if (extra <= -1 && avance > 0) e = charges + ' Le mois a <b>' + eur(avance) + '</b> d’avance, partagée entre les ' + jours + ' selon le poids de chaque jour\u00a0: <b>− ' + eur(-extra) + '</b> pour ce ' + jour + '.<br>' + eur(base) + ' − ' + eur(-extra) + ' = <b>' + eur(t) + '</b>.';
    else if (retard > 0) e = charges + ' Le mois a ' + eur(retard) + ' de retard, partagé entre les jours ouverts restants.';
    else if (avance > 0) e = charges + ' Le mois a ' + eur(avance) + ' d’avance.';
    else e = charges + (c && c.input && Array.isArray(c.input.days) && !c.input.days.some(function (d) { return d && d.ca != null; }) ? ' Aucune journée n’est encore saisie ce mois-ci.' : ' Le mois est dans les temps.'); /* C213 (W08) */
    lp.className = 'vx53-o'; /* C165 : « minimum », comme les repères (« objectif » est réservé à l'objectif de résultat) */ lp.innerHTML = 'Minimum à faire ' + (passe ? 'cette journée-là' : 'aujourd’hui') + ' : <b>' + eur(t) + '</b>';
    var ex = lp.nextElementSibling; if (!ex || !ex.classList.contains('vx53-e')) { ex = lp.ownerDocument.createElement('p'); ex.className = 'vx53-e'; lp.insertAdjacentElement('afterend', ex); }
    ex.innerHTML = e;
  }
  /* Montants de la carte du jour à l'euro près (le détail replié garde ses décimales utiles, ex. ticket moyen). */
  function arrondir(saisie) {
    var tot = saisie.querySelector('.day-total'); if (!tot) return;
    var it = tot.ownerDocument.createTreeWalker(tot, 4), n, re = /(\d[\d\u202f\u00a0 ]*),(\d{1,2})\s?€/g;
    while ((n = it.nextNode())) { if (re.test(n.nodeValue)) { re.lastIndex = 0; n.nodeValue = n.nodeValue.replace(re, function (m0, a, b) { return eur(Number(a.replace(/[\s\u202f\u00a0]/g, '') + '.' + b)); }); } re.lastIndex = 0; }
  }
  w.VerdictObjectifClair = { clair: clair, arrondir: arrondir, montant: montant };
  function enrichir(cadre) {
    var d, cw; try { d = cadre.contentDocument; cw = cadre.contentWindow; } catch (e) { return; }
    if (!d || !d.body || !cw || !cw.VD) return;
    if (!d.getElementById('vx39-css')) { var s = d.createElement('style'); s.id = 'vx39-css'; s.textContent = CSS; (d.head || d.documentElement).appendChild(s); }
    if (!d.__vx39t) { d.__vx39t = true; d.addEventListener('toggle', function (e) { var t = e.target; if (t && t.classList && t.classList.contains('vx39')) ouverts[t.getAttribute('data-vx39')] = t.open; }, true); }
    var input = cw.VD.chr && cw.VD.chr.input; if (!input) return;
    try { uneSeuleAvance(d, cw.VD.chr); uneSeuleAvance(doc, cw.VD.chr); mentionTTC(d); } catch (e) {}
    /* Saisie du jour : le prochain jour ouvert à faire. */
    var saisie = d.getElementById('modSaisie'), next = cw.VD.chr.next, cleS = cleSaisie(cw.VD.saisie), quand = cleS || next; /* C298 (V15-070) */
    if (saisie) { var lp = [].filter.call(saisie.querySelectorAll('.day-total p'), function (p) { return /^À réaliser (aujourd|pour cette journée)/.test((p.textContent || '').trim()); })[0];
      if (lp) clair(lp, cw.VD.chr, cw.VD.saisie || {}); arrondir(saisie); }
    if (saisie && quand) {
      var ex = saisie.querySelector('.vx39');
      if (!ex || ex.getAttribute('data-vx39') !== quand) { if (ex) ex.remove(); var h = bloc(input, quand, !cleS && (!input.today || input.today === next)) /* C131 : jour fermé aujourd'hui → titre du prochain jour ouvert */; if (h) saisie.insertAdjacentHTML('beforeend', h); }
      /* C142 : le détail de la position (reste du mois, couverts, année à date) est en tête du volet replié. */
      var vol = saisie.querySelector('.vx39 .vx39-c');
      if (vol && !vol.querySelector('.vx39-d')) { var hp2 = position(cw.VD.chr); if (hp2) { var t = d.createElement('div'); t.innerHTML = hp2; var lignes = t.querySelectorAll('small'); if (lignes.length) { var dd = d.createElement('div'); dd.className = 'vx39-d'; [].forEach.call(lignes, function (x) { dd.appendChild(x); }); vol.insertBefore(dd, vol.firstChild); } } }
    }
    /* Détail d'un jour touché dans le calendrier. */
    var det = d.getElementById('detail');
    if (det) {
      var k = det.querySelector('.kicker'), m = k && /(\d{1,2})/.exec(k.textContent || '');
      var date = m ? (input.days.filter(function (x) { return Number(x.date.slice(8)) === Number(m[1]); })[0] || {}).date : null;
      var ex2 = det.querySelector('.vx39');
      if (date && (!ex2 || ex2.getAttribute('data-vx39') !== date)) { if (ex2) ex2.remove(); var h2 = bloc(input, date, false); if (h2) det.insertAdjacentHTML('beforeend', h2); }
      if (!date && ex2) ex2.remove();
      var dl = det.querySelector('dl'), exl = det.querySelector('.vx39-l');
      if (dl && date && (!exl || exl.getAttribute('data-vx39l') !== date)) {
        [].forEach.call(det.querySelectorAll('.vx39-l'), function (n) { n.remove(); });
        var hl = lignesJour(input, date); if (hl) { var ref = [].filter.call(dl.children, function (n) { return /Minimum de structure/.test(n.textContent || ''); })[0]; if (ref) ref.insertAdjacentHTML('afterend', hl); else dl.insertAdjacentHTML('beforeend', hl); }
      }
    }
  }
  /* C143 — Structure › Chiffre minimum : la case « Seuil de trésorerie annuel » affichait en réalité le chiffre minimum
     annuel (574 390 €, amortissements compris), alors que le vrai seuil de trésorerie (583 241 €, sorties d'argent +
     remboursement du capital d'emprunt, C130) est affiché juste en dessous et dans l'Accueil. Le libellé reprend son nom
     d'origine quand la valeur est bien celle du chiffre minimum. */
  /* C143 — HT ou TTC dit à chaque minimum. Le pilotage du jour et du mois compte en TTC (comme la caisse et la saisie) ;
     Structure, Audit et Simuler comptent en HT. Sans la mention, 643 593 € (TTC) et 574 390 € (HT) semblaient se
     contredire. Les étiquettes de minimum issues du pilotage reçoivent « TTC ». */
  var LIBELLES_TTC = { 'Minimum du mois': 1, 'Minimum annuel': 1, 'Minimum à couvrir': 1, 'Minimum du reste du mois': 1, 'Minimum du mois entier': 1, 'Minimum de structure ce jour': 1, 'Minimum du jour': 1, 'Reste pour couvrir le minimum': 1, 'Encaissé à ce jour': 1 };
  function mentionTTC(d) {
    if (!d) return;
    [].forEach.call(d.querySelectorAll('small, .k, dt, span, b, div'), function (e) {
      if (e.children.length) return; var t = (e.textContent || '').trim();
      if (LIBELLES_TTC[t]) e.textContent = t + ' TTC';
    });
  }
  /* C143 — Salaires : la page donnait deux coûts d'équipe sans les relier (253 286 € · 39,7 % du CA en haut ; « Équipe ·
     2026 » 242 376 € · 37,9 % plus bas). Ce ne sont pas les mêmes périmètres : l'exercice complet de la structure (repris
     par Structure, Priorités et l'Audit) et l'année 2026 reconstruite d'après les services saisis. Une phrase le dit. */
  function deuxCouts() {
    var mod = doc.getElementById('vtModule'); if (!mod || mod.querySelector('.vx43-lien')) return;
    var masse = '', part = '';
    [].forEach.call(doc.querySelectorAll('#v-sal .kpi'), function (k) { var l = (k.querySelector('.k') || {}).textContent || ''; if (/Masse salariale \/ an/.test(l)) masse = ((k.querySelector('.v') || {}).textContent || '').trim(); });
    [].forEach.call(doc.querySelectorAll('#v-sal .jauge .jt'), function (j) { if (/(Masse salariale|Coût de l’équipe) % CA/.test(j.textContent || '')) /* C179 : glossaire */ { var m = /(\d+(?:,\d+)?)\s*%/.exec(j.parentElement.textContent || ''); if (m) part = m[1] + ' %'; } });
    if (!masse) return;
    var chips = mod.querySelector('.vt-chips'); if (!chips) return;
    var p = doc.createElement('p'); p.className = 'vt-note vx43-lien'; p.style.margin = '6px 0 10px';
    p.textContent = 'Ici : l’année 2026, reconstruite d’après vos services saisis. Le coût humain de référence de la structure (' + masse + (part ? ' · ' + part + ' du CA' : '') + ') porte sur l’exercice complet : c’est lui que reprennent Structure, Priorités et l’Audit.';
    chips.insertAdjacentElement('afterend', p);
  }
  function libelleSeuil() {
    var p = null; try { p = w.point3Calc(w.moteur()); } catch (e) {} if (!p || !(p.breakEven > 0)) return;
    var mini = Math.round(p.breakEven), treso = Math.round(p.breakEvenTresorerie || 0);
    [].forEach.call(doc.querySelectorAll('.kpi > .k'), function (k) {
      if ((k.textContent || '').trim() !== 'Seuil de trésorerie annuel') return;
      var v = k.parentElement.querySelector('.v'), n = v ? Number(String(v.textContent).replace(/[^0-9-]/g, '')) : NaN;
      if (n === mini && n !== treso) k.textContent = 'Chiffre minimum annuel';
    });
  }
  var suivis = new WeakSet();
  function tour() {
    try { libelleSeuil(); mentionTTC(doc.getElementById('v-data')); deuxCouts(); } catch (e) {}
    [].forEach.call(doc.querySelectorAll('iframe.p41-ecran'), function (f) {
      enrichir(f);
      var d; try { d = f.contentDocument; } catch (e) { d = null; }
      if (d && d.body && !suivis.has(d)) {
        suivis.add(d); var att = null;
        new MutationObserver(function () { if (att) return; att = setTimeout(function () { att = null; enrichir(f); }, 60); }).observe(d.body, { childList: true, subtree: true });
      }
      if (!f.__vx39) { f.__vx39 = true; f.addEventListener('load', function () { setTimeout(function () { enrichir(f); tour(); }, 50); }); }
    });
  }
  setInterval(tour, 1500);
  doc.addEventListener('DOMContentLoaded', tour);
  w.addEventListener('load', function () { setTimeout(tour, 300); });
  /* C129 — Un seul minimum du mois partout : quand le plan du mois existe (part saisonnière du plan annuel + report),
     l'objectif mensuel lu par les autres écrans (progObjJour) prend ce même montant ; l'objectif de résultat choisi
     garde son supplément. Sans plan du mois ou sans plan annuel, le calcul d'origine reste. */
  /* C130 — Seuil de trésorerie complet (pratique comptable) : (charges fixes hors amortissements + capital d'emprunt
     remboursé dans l'année) ÷ taux de marge sur coûts variables. Le capital vient des réglages de trésorerie (par mois). */
  function capitalAnnuel() { try { var m = Number(w.DB && w.DB.tresoParams && w.DB.tresoParams.emprunt); return isFinite(m) && m > 0 ? m * 12 : 0; } catch (e) { return 0; } }
  (function () {
    var orig = w.point3Calc; if (typeof orig !== 'function' || orig.__c130) return;
    var f = function () { var p = orig.apply(this, arguments); try { var cap = capitalAnnuel(), taux = Number(p && p.contributionRate) / 100; if (p && p.attainable && cap > 0 && taux > 0 && isFinite(Number(p.breakEvenTresorerie))) { p = Object.assign({}, p); p.capitalRembourseAn = Math.round(cap * 100) / 100; p.breakEvenTresorerie = Math.round((Number(p.breakEvenTresorerie) + cap / taux) * 100) / 100; } } catch (e) {} return p; };
    f.__c130 = true; w.point3Calc = f;
    var t0 = w.verdictSeuilsT; if (typeof t0 === 'function' && !t0.__c130) { var t = function (k) { var v = t0.apply(this, arguments); if (k === 'tresoD') { var cap = capitalAnnuel(); if (cap > 0) v = 'Pour couvrir les sorties d’argent : charges hors amortissements, plus ' + eur(cap) + ' de capital d’emprunt remboursé par an. Le minimum économique quotidien inclut les amortissements.'; }
        /* C299 (V15-046) : dire pourquoi le seuil comptable, qui inclut les amortissements, est plus bas que le seuil de trésorerie. */
        if (k === 'comptaD') { try { var cap2 = capitalAnnuel(), R2 = typeof w.moteur === 'function' ? w.moteur() : null, am = R2 && R2.d ? Number(R2.d.amort) || 0 : 0; if (cap2 > am) v += ' Il est plus bas que le seuil de trésorerie : vos amortissements (' + eur(am) + ' par an) pèsent moins que le capital d’emprunt remboursé (' + eur(cap2) + ' par an).'; } catch (e) {} } return v; }; t.__c130 = true; w.verdictSeuilsT = t; }
  })();
  (function () {
    var orig = w.progObjJour; if (typeof orig !== 'function' || orig.__c129) return;
    var f = function (R) {
      var o = orig.apply(this, arguments);
      try {
        var key = w.verdictOperationalClock().key.slice(0, 7), p = w.DB && w.DB.performancePlans && w.DB.performancePlans[key], ap = w.DB && w.DB.performanceYearPlans && w.DB.performanceYearPlans[key.slice(0, 4)];
        if (!o || !p || !(Number(p.minimum) > 0) || !/(1\.9\.0|[2-9]\.\d+\.\d+)$/.test(String(p.rulesVersion || '')) || !(ap && Number(ap.monthlyTargets && ap.monthlyTargets[key]) > 0)) return o;
        var r = Object.assign({}, o), delta = Number(p.minimum) - Number(o.mois || 0), n = Number(o.jOuv) || (p.openDates && p.openDates.length) || 0;
        r.mois = Math.round(Number(p.minimum) * 100) / 100; if (n > 0) r.obj = Math.round(r.mois / n * 100) / 100;
        if (o.objectifMois != null) { r.objectifMois = Math.round((Number(o.objectifMois) + delta) * 100) / 100; if (n > 0) r.objectif = Math.round(r.objectifMois / n * 100) / 100; }
        r.source = 'plan-du-mois'; return r;
      } catch (e) { return o; }
    };
    f.__c129 = true; w.progObjJour = f;
  })();
  w.VerdictObjectifExplique = { capitalAnnuel: capitalAnnuel, report: report, bloc: bloc, position: position, lignesJour: lignesJour, tour: tour };
})();
