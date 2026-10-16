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
  function anneeADate(c) {
    try { var key = c.input.days[0].date.slice(0, 7), y = key.slice(0, 4), plans = w.DB.performancePlans || {}, attendu = Number(c.expected) || 0, encaisse = Number(c.actual) || 0, n = 0;
      Object.keys(plans).forEach(function (k) { if (k.slice(0, 4) !== y || k >= key || !(Number(plans[k].minimum) > 0)) return; attendu += Number(plans[k].minimum); n++;
        hist().forEach(function (r) { if (String(r.date).slice(0, 7) === k) encaisse += Number(r.caJ); }); });
      return { attendu: attendu, encaisse: encaisse, moisPasses: n }; } catch (e) { return null; } }
  function signe(v) { return (v >= 0 ? '+' : '−') + eur(Math.abs(v)); }
  function position(c) {
    if (!c || !c.exact) return '';
    var base = Number(c.base) || 0, retard = Number(c.deficit) || 0, avance = Number(c.advance) || 0, total = Number(c.catchup) || base, g = c.input && c.input.glissant, out = '';
    out += retard > 0 ? '<span class="vx39-pos retard">Retard du mois : <b>' + eur(retard) + '</b></span>' : (avance > 0 ? '<span class="vx39-pos avance">Avance du mois : <b>+' + eur(avance) + '</b></span>' : '<span class="vx39-pos">Mois dans les temps</span>');
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
    if (!input || !w.VerdictCHR) return '';
    var jour = input.days.filter(function (d) { return d.date === date; })[0]; if (!jour || jour.ca == null) return '';
    var c; try { c = w.VerdictCHR.calculate({ minimum: input.minimum, today: date, days: input.days.map(function (d) { return Object.assign({}, d, { ca: d.date >= date ? null : d.ca }); }) }); } catch (e) { return ''; }
    if (!c || !c.exact || c.next !== date) return '';
    var base = Number(c.base) || 0, avant = (Number(c.deficit) || 0) - (Number(c.advance) || 0), aFaire = Number(c.catchup) || base, ca = Number(jour.ca) || 0, apres = avant + base - ca;
    function pos(v, quand) { return v > 0.5 ? '<dt>Retard du mois ' + quand + '</dt><dd class="vx39-r">' + eur(v) + '</dd>' : (v < -0.5 ? '<dt>Avance du mois ' + quand + '</dt><dd class="vx39-a">+' + eur(-v) + '</dd>' : '<dt>Mois ' + quand + '</dt><dd>dans les temps</dd>'); }
    return '<div class="vx39-l" data-vx39l="' + date + '">' + pos(avant, 'avant ce jour') + '</div>' +
      '<div class="vx39-l"><dt>À réaliser ce jour-là<small>base ' + eur(base) + ' ' + signe(aFaire - base) + ' (reste à faire du mois réparti)</small></dt><dd><b>' + eur(aFaire) + '</b></dd></div>' +
      '<div class="vx39-l">' + pos(apres, 'après ce jour') + '</div>';
  }
  function report(input) { var g = input && input.glissant; if (!g || !g.ecartAnnee) return null; return { ecartAnnee: g.ecartAnnee, partMois: g.partMois, moisRestants: g.moisRestants }; }
  var ouverts = {}; /* l'ouverture survit aux redessins du module */
  function bloc(input, date, aujourdHui) {
    if (!input || !Array.isArray(input.days) || !w.VerdictCHR) return '';
    var jour = input.days.filter(function (d) { return d.date === date; })[0]; if (!jour) return '';
    var c; try { c = w.VerdictCHR.calculate({ minimum: input.minimum, today: date, days: input.days.map(function (d) { return Object.assign({}, d, { ca: d.date >= date ? null : d.ca }); }) }); } catch (e) { return ''; }
    if (!c || !c.exact || c.next !== date) return '';
    var base = Number(c.base) || 0, total = Number(c.catchup) || base, budget = Number(input.budget) || Number(input.minimum) || 0, g = input.glissant;
    var M = moyennes(date.slice(0, 7) + '-01') /* mêmes moyennes que celles qui ont fixé les bases du mois */, connus = M.filter(function (m) { return m != null; }), js = jourSem(date), lui = M[js];
    var bas = null; M.forEach(function (m, i) { if (m != null && i !== js && (bas === null || m < M[bas])) bas = i; });
    var part = connus.length >= 3 && lui != null
      ? 'Chaque jour reçoit sa part selon ce qu’il fait d’habitude. Sur les 10 semaines avant ce mois, un <b>' + JOURS[js] + '</b> rapporte en moyenne <b>' + eur(lui) + '</b>' + (bas !== null ? ', un ' + JOURS[bas] + ' ' + eur(M[bas]) : '') + ' : la base du ' + JOURS[js] + ' est ' + (bas !== null && lui > M[bas] ? 'plus haute' : 'adaptée') + '. Base de ce jour : <b>' + eur(base) + '</b>.'
      : 'Tant que l’historique est court (moins de 3 jours de semaine connus), chaque jour ouvert reçoit la même part : <b>' + eur(base) + '</b>.';
    var annee = g && Math.abs(Number(g.ecartAnnee) || 0) >= 1 ? ' L’année porte ' + (g.ecartAnnee > 0 ? 'un retard' : 'une avance') + ' de <b>' + eur(Math.abs(g.ecartAnnee)) + '</b> sur les mois passés, réparti sur les ' + g.moisRestants + ' mois restants : objectif du mois <b>' + eur(input.minimum) + '</b> (' + signe(g.partMois) + ').' : '';
    var reste = 'Objectif du mois ' + eur(input.minimum) + ' − encaissé ' + eur(c.actual) + ' = <b>' + eur(c.remaining) + '</b> à faire sur les <b>' + c.openRemaining + ' jours ouverts</b> restants, ' + (aujourdHui ? 'partagés' : 'qui étaient partagés') + ' selon leur poids : un retard fait monter la part de chaque jour, une avance la fait baisser.';
    return '<details class="vx39" data-vx39="' + date + '"' + (ouverts[date] ? ' open' : '') + '><summary class="vx39-t"><span>Pourquoi ' + (aujourdHui ? 'ce montant aujourd’hui' : 'ce montant le ' + libJour(date)) + ' ?</span><i aria-hidden="true">›</i></summary><div class="vx39-c"><ol>' +
      '<li><b>Le budget du mois</b> : <b>' + eur(budget) + '</b> de chiffre d’affaires, la part de ce mois dans le minimum annuel qui couvre vos charges, salaires et loyer, sur <b>' + input.days.length + ' jours ouverts</b> (jours de repos exclus).' + annee + '</li>' +
      '<li><b>La part de ce jour</b> : ' + part + '</li>' +
      '<li><b>Le reste à faire</b> : ' + reste + '</li></ol>' +
      '<p class="vx39-f">Base ' + eur(base) + ' ' + signe(total - base) + ' = <b>' + eur(total) + '</b> ' + (aujourdHui ? 'à réaliser aujourd’hui' : 'à réaliser ce jour-là') + '</p></div></details>';
  }
  var CSS = '.vx39-r{color:#ea580c!important;font-weight:800}.vx39-a{color:#16a34a!important;font-weight:800}html.vd-workspace-dark .vx39-r{color:#fb923c!important}html.vd-workspace-dark .vx39-a{color:#4ade80!important}.vx39-l dt small{display:block;font-size:12px;opacity:.75;font-weight:500}' +
    '.vx39-alerte{color:#ea580c;font-weight:700}html.vd-workspace-dark .vx39-alerte{color:#fb923c}p.vx39-p{display:flex;flex-direction:column;gap:3px;margin:6px 0 10px}p.vx39-p small{font-size:13px;opacity:.85}.vx39-pos{font-weight:700}.vx39-pos.avance b{color:#16a34a}.vx39-pos.retard b{color:#ea580c}html.vd-workspace-dark .vx39-pos.avance b{color:#4ade80}html.vd-workspace-dark .vx39-pos.retard b{color:#fb923c}' +
    '.vx39>summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;min-height:44px}.vx39>summary::-webkit-details-marker{display:none}' +
    '.vx39>summary i{font-style:normal;font-size:22px;line-height:1;opacity:.6;transition:transform .25s}.vx39[open]>summary i{transform:rotate(90deg)}.vx39:not([open]){padding-top:4px!important;padding-bottom:4px!important}.vx39-c{padding-top:4px}' +
    '.vx39{margin:16px 0 0;padding:14px 16px;border-radius:16px;background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.22);color:inherit;font-size:14.5px;line-height:1.5}' +
    '.vx39-t{margin:0!important;font-weight:800;font-size:15px}.vx39 ol{margin:0;padding-left:20px;display:grid;gap:7px}.vx39 li{padding-left:2px}' +
    '.vx39-f{margin:10px 0 0!important;padding-top:10px;border-top:1px dashed rgba(34,197,94,.35);font-variant-numeric:tabular-nums}.vx39-f b{color:#16a34a;font-size:16px}' +
    'html.vd-workspace-dark .vx39{background:rgba(34,197,94,.09);border-color:rgba(34,197,94,.28)}html.vd-workspace-dark .vx39-f b{color:#4ade80}';

  function enrichir(cadre) {
    var d, cw; try { d = cadre.contentDocument; cw = cadre.contentWindow; } catch (e) { return; }
    if (!d || !d.body || !cw || !cw.VD) return;
    if (!d.getElementById('vx39-css')) { var s = d.createElement('style'); s.id = 'vx39-css'; s.textContent = CSS; (d.head || d.documentElement).appendChild(s); }
    if (!d.__vx39t) { d.__vx39t = true; d.addEventListener('toggle', function (e) { var t = e.target; if (t && t.classList && t.classList.contains('vx39')) ouverts[t.getAttribute('data-vx39')] = t.open; }, true); }
    var input = cw.VD.chr && cw.VD.chr.input; if (!input) return;
    /* Saisie du jour : le prochain jour ouvert à faire. */
    var saisie = d.getElementById('modSaisie'), next = cw.VD.chr.next;
    if (saisie) { var lp = [].filter.call(saisie.querySelectorAll('.day-total p'), function (p) { return /^À réaliser aujourd/.test((p.textContent || '').trim()); })[0];
      var deja = lp && lp.nextElementSibling && lp.nextElementSibling.classList.contains('vx39-p');
      if (lp && !deja) { var hp = position(cw.VD.chr); if (hp) lp.insertAdjacentHTML('afterend', '<p class="vx39-p">' + hp + '</p>'); } }
    if (saisie && next) {
      var ex = saisie.querySelector('.vx39');
      if (!ex || ex.getAttribute('data-vx39') !== next) { if (ex) ex.remove(); var h = bloc(input, next, true); if (h) saisie.insertAdjacentHTML('beforeend', h); }
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
  var suivis = new WeakSet();
  function tour() {
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
    var t0 = w.verdictSeuilsT; if (typeof t0 === 'function' && !t0.__c130) { var t = function (k) { var v = t0.apply(this, arguments); if (k === 'tresoD') { var cap = capitalAnnuel(); if (cap > 0) v = 'Pour couvrir les sorties d’argent : charges hors amortissements, plus ' + eur(cap) + ' de capital d’emprunt remboursé par an. Le minimum économique quotidien inclut les amortissements.'; } return v; }; t.__c130 = true; w.verdictSeuilsT = t; }
  })();
  (function () {
    var orig = w.progObjJour; if (typeof orig !== 'function' || orig.__c129) return;
    var f = function (R) {
      var o = orig.apply(this, arguments);
      try {
        var key = w.verdictOperationalClock().key.slice(0, 7), p = w.DB && w.DB.performancePlans && w.DB.performancePlans[key], ap = w.DB && w.DB.performanceYearPlans && w.DB.performanceYearPlans[key.slice(0, 4)];
        if (!o || !p || !(Number(p.minimum) > 0) || !/1\.9\.0$/.test(String(p.rulesVersion || '')) || !(ap && Number(ap.monthlyTargets && ap.monthlyTargets[key]) > 0)) return o;
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
