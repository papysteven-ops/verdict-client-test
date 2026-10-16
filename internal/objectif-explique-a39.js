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
  /* C125 — Sous « À réaliser aujourd'hui » (l'objectif du jour) et avant « Reste à faire » (qui baisse au fil des
     saisies) : la position du mois — avance gardée en réserve, retard compris dans l'objectif du jour, ou dans les temps. */
  function position(c) {
    if (!c || !c.exact) return '';
    var base = Number(c.base) || 0, retard = Number(c.deficit) || 0, avance = Number(c.advance) || 0;
    if (retard > 0) return '<span class="vx39-pos retard">Retard du mois : <b>' + eur(retard) + '</b></span><small>Il est compris dans l’objectif du jour : base ' + eur(base) + ' + retard ' + eur(retard) + '.</small>';
    if (avance > 0) return '<span class="vx39-pos avance">Avance du mois : <b>+' + eur(avance) + '</b></span><small>Gardée en réserve pour un jour plus faible : l’objectif du jour reste la base.</small>';
    return '<span class="vx39-pos">Mois dans les temps</span><small>Ni avance ni retard : l’objectif du jour est la base.</small>';
  }
  /* C126 — Détail d'un jour passé : le retard (ou l'avance) du mois avant ce jour, ce qu'il y avait à réaliser ce
     jour-là (base + retard), et la position du mois après ce jour. Le calendrier juge chaque jour contre sa base ; ces
     lignes montrent comment le retard s'accumule jusqu'à l'objectif d'aujourd'hui (Steven, 16/10 : « chaque jour on
     dit 1 000 €, mais aujourd'hui 3 000 € : pas logique »). */
  function lignesJour(input, date) {
    if (!input || !w.VerdictCHR) return '';
    var jour = input.days.filter(function (d) { return d.date === date; })[0]; if (!jour || jour.ca == null) return '';
    var c; try { c = w.VerdictCHR.calculate({ minimum: input.minimum, today: date, days: input.days.map(function (d) { return Object.assign({}, d, { ca: d.date >= date ? null : d.ca }); }) }); } catch (e) { return ''; }
    if (!c || !c.exact || c.next !== date) return '';
    var base = Number(c.base) || 0, avant = (Number(c.deficit) || 0) - (Number(c.advance) || 0), aFaire = base + Math.max(0, avant), ca = Number(jour.ca) || 0, apres = avant + base - ca;
    function pos(v, quand) { return v > 0.5 ? '<dt>Retard du mois ' + quand + '</dt><dd class="vx39-r">' + eur(v) + '</dd>' : (v < -0.5 ? '<dt>Avance du mois ' + quand + '</dt><dd class="vx39-a">+' + eur(-v) + '</dd>' : '<dt>Mois ' + quand + '</dt><dd>dans les temps</dd>'); }
    return '<div class="vx39-l" data-vx39l="' + date + '">' + pos(avant, 'avant ce jour').replace(/^/, '') + '</div>' +
      '<div class="vx39-l"><dt>À réaliser ce jour-là<small>base ' + eur(base) + (avant > 0.5 ? ' + retard ' + eur(avant) : '') + '</small></dt><dd><b>' + eur(aFaire) + '</b></dd></div>' +
      '<div class="vx39-l">' + pos(apres, 'après ce jour') + '</div>';
  }
  var ouverts = {}; /* l'ouverture survit aux redessins du module */
  function bloc(input, date, aujourdHui) {
    if (!input || !Array.isArray(input.days) || !w.VerdictCHR) return '';
    var jour = input.days.filter(function (d) { return d.date === date; })[0]; if (!jour) return '';
    var c; try { c = w.VerdictCHR.calculate({ minimum: input.minimum, today: date, days: input.days.map(function (d) { return Object.assign({}, d, { ca: d.date >= date ? null : d.ca }); }) }); } catch (e) { return ''; }
    if (!c || !c.exact || c.next !== date) return '';
    var base = Number(c.base) || 0, retard = Number(c.deficit) || 0, avance = Number(c.advance) || 0, total = Number(c.catchup) || base;
    var M = moyennes(date.slice(0, 7) + '-01') /* mêmes moyennes que celles qui ont fixé les bases du mois */, connus = M.filter(function (m) { return m != null; }), js = jourSem(date), lui = M[js];
    var bas = null; M.forEach(function (m, i) { if (m != null && i !== js && (bas === null || m < M[bas])) bas = i; });
    var part = connus.length >= 3 && lui != null
      ? 'Chaque jour reçoit sa part selon ce qu’il fait d’habitude. Sur les 10 semaines avant ce mois, un <b>' + JOURS[js] + '</b> rapporte en moyenne <b>' + eur(lui) + '</b>' + (bas !== null ? ', un ' + JOURS[bas] + ' ' + eur(M[bas]) : '') + ' : la base du ' + JOURS[js] + ' est ' + (bas !== null && lui > M[bas] ? 'plus haute' : 'adaptée') + '. Base de ce jour : <b>' + eur(base) + '</b>.'
      : 'Tant que l’historique est court (moins de 3 jours de semaine connus), chaque jour ouvert reçoit la même part : <b>' + eur(base) + '</b>.';
    var ret = retard > 0
      ? 'Les jours précédents du mois sont en retard de <b>' + eur(retard) + '</b> sur leurs bases : ' + (aujourdHui ? 'ce retard se rattrape en entier aujourd’hui' : 'ce retard était à rattraper en entier ce jour-là') + '.'
      : (avance > 0 ? 'Les jours précédents ont <b>' + eur(avance) + '</b> d’avance : elle reste en réserve pour un jour plus faible, la base ' + (aujourdHui ? 'reste à faire.' : 'restait à faire.') : 'Aucun retard avant ce jour : la base suffit.');
    return '<details class="vx39" data-vx39="' + date + '"' + (ouverts[date] ? ' open' : '') + '><summary class="vx39-t"><span>Pourquoi ' + (aujourdHui ? 'ce montant aujourd’hui' : 'ce montant le ' + libJour(date)) + '\u00a0?</span><i aria-hidden="true">›</i></summary><div class="vx39-c"><ol>' +
      '<li><b>Votre structure ce mois-ci</b> : <b>' + eur(input.minimum) + '</b> de chiffre d’affaires pour couvrir vos charges, salaires et loyer, sur <b>' + input.days.length + ' jours ouverts</b> (jours de repos exclus).</li>' +
      '<li><b>La part de ce jour</b> : ' + part + '</li>' +
      '<li><b>Le retard</b> : ' + ret + '</li></ol>' +
      '<p class="vx39-f">' + (retard > 0 ? 'Base ' + eur(base) + ' + retard ' + eur(retard) + ' = <b>' + eur(total) + '</b> ' + (aujourdHui ? 'à réaliser aujourd’hui' : 'à réaliser ce jour-là') : (aujourdHui ? 'À réaliser aujourd’hui' : 'À réaliser ce jour-là') + ' : <b>' + eur(total) + '</b>, la base du jour') + '</p></div></details>';
  }
  var CSS = '.vx39-r{color:#ea580c!important;font-weight:800}.vx39-a{color:#16a34a!important;font-weight:800}html.vd-workspace-dark .vx39-r{color:#fb923c!important}html.vd-workspace-dark .vx39-a{color:#4ade80!important}.vx39-l dt small{display:block;font-size:12px;opacity:.75;font-weight:500}' +
    'p.vx39-p{display:flex;flex-direction:column;gap:3px;margin:6px 0 10px}p.vx39-p small{font-size:13px;opacity:.85}.vx39-pos{font-weight:700}.vx39-pos.avance b{color:#16a34a}.vx39-pos.retard b{color:#ea580c}html.vd-workspace-dark .vx39-pos.avance b{color:#4ade80}html.vd-workspace-dark .vx39-pos.retard b{color:#fb923c}' +
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
  w.VerdictObjectifExplique = { bloc: bloc, position: position, lignesJour: lignesJour, tour: tour };
})();
