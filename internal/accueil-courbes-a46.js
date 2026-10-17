/* C148 — Jour, Mois, Année : la même courbe premium (Steven, 18/10 : « avant on pouvait voir exactement le même mode que
   le journalier en jour, mois et annuel premium ; je veux du premium jour mois année cohérent, le client doit suivre et
   comprendre »).
   La courbe premium (points cochés, couleurs par écart, animation) existe en trois modes dans Structure › Performances :
   Journées, Cumul du mois, Année. Dans l'Accueil, seul le chapitre Jour l'avait ; Mois montrait un ancien graphique
   hachuré et Année des barres. Ce fichier place la même courbe premium en tête des chapitres Mois (cumul du mois) et
   Année (l'année mois par mois), calculée par le même moteur (VerdictPerformanceIntegrated, VerdictAnnualProjection) :
   mêmes chiffres, même lecture. L'ancien graphique hachuré du mois est retiré (doublon) ; les barres de l'année restent
   plus bas, car leur détail par mois est utile. Un appui sur la courbe ouvre la vue complète. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdAccueilCourbes) return; w.__vdAccueilCourbes = true;

  /* Les règles de style de la courbe premium sont copiées dans le cadre de l'Accueil (une fois par cadre). */
  /* Seules les règles dont CHAQUE sélecteur vise la courbe (.vp- / .vy-) sont reprises ; les préfixes d'appli
     (« html.p40 », « .p40-app »…) sont retirés pour qu'elles s'appliquent dans le cadre selon son thème. */
  function adapter(sel) { return sel.replace(/html(\.[\w-]+)*/g, function (m) { var t = m.match(/\.vd-workspace-(light|dark)/); return 'html' + (t ? t[0] : ''); }).replace(/body(\.[\w-]+)+/g, 'body').replace(/\.p40[\w-]*\s+/g, '').replace(/#d-carnet/g, '.vx46'); }
  function regle(r, out) {
    if (r.type === 1) {
      var sels = String(r.selectorText || '').split(',').map(function (x) { return x.trim(); });
      if (!sels.length || !sels.every(function (x) { return /\.vp-|\.vy-/.test(x); })) return;
      out.push(sels.map(adapter).join(',') + '{' + r.style.cssText + '}');
    } else if (r.type === 4) {
      var dedans = []; [].forEach.call(r.cssRules || [], function (x) { regle(x, dedans); });
      if (dedans.length) out.push('@media ' + r.conditionText + '{' + dedans.join('') + '}');
    } else if (r.type === 7 && /^v[py]/i.test(r.name || '')) out.push(r.cssText);
  }
  function css() {
    var out = [];
    [].forEach.call(doc.styleSheets, function (sh) {
      var regles; try { regles = sh.cssRules; } catch (e) { return; }
      [].forEach.call(regles || [], function (r) { regle(r, out); });
    });
    return out.join('\n') +
      '.vx46{margin:0 0 14px;cursor:pointer}.vx46 .vp-chart-toggle{display:none!important}.vx46 [onclick]{pointer-events:none}' +
      '.vx46-k{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 0 8px}.vx46-k b{font-size:13px;font-weight:600;opacity:.75}.vx46-k span{font-size:13px;font-weight:700;opacity:.8}' +
      '#modMois .vx46-ancien{display:none!important}';
  }
  function moisCle() { try { return w.verdictOperationalClock().key.slice(0, 7); } catch (e) { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); } }
  function rendus() {
    var V = w.VerdictPerformanceIntegrated, A = w.VerdictAnnualProjection, R = null, o = {};
    try { R = w.moteur(); } catch (e) {} if (!V || !R || !R.ready) return null;
    try { o.mois = V.chart(V.buildMonth(R, moisCle()), { compact: true }); } catch (e) {}
    try { o.annee = A && typeof A.mainHTML === 'function' ? A.mainHTML() : ''; } catch (e) {}
    return o;
  }
  function ouvrir(mode) {
    try { if (typeof w.performanceChartMode === 'function') w.performanceChartMode(mode); } catch (e) {}
    try { if (typeof w.performanceOpenCumulative === 'function' && mode === 'pace') { w.performanceOpenCumulative(); return; } } catch (e) {}
    try { if (typeof w.goPerformance === 'function') w.goPerformance(); } catch (e) {}
  }
  function poser(d, chapitre, html, mode, titre) {
    var ch = d.getElementById('vx40-' + chapitre), col = ch && ch.querySelector('.vx40-p'); if (!col || !html) return;
    var box = col.querySelector(':scope > .vx46');
    if (box && box.__html === html) return;
    if (!box) {
      box = d.createElement('section'); box.className = 'vx46'; box.setAttribute('role', 'button'); box.tabIndex = 0;
      box.setAttribute('aria-label', titre + ' : ouvrir la vue complète');
      box.addEventListener('click', function () { ouvrir(mode); });
      box.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(mode); } });
      col.insertBefore(box, col.firstChild);
    }
    box.__html = html;
    box.innerHTML = '<div class="vx46-k"><b>' + titre + '</b><span>Vue complète ›</span></div>' + html;
  }
  function tour() {
    var f = doc.querySelector('iframe.p41-ecran'), d = null; try { d = f && f.contentDocument; } catch (e) {}
    if (!d || !d.getElementById('vx40-mois')) return;
    if (!d.getElementById('vx46-css')) { var s = d.createElement('style'); s.id = 'vx46-css'; s.textContent = css(); (d.head || d.documentElement).appendChild(s); }
    var r = rendus(); if (!r) return;
    poser(d, 'mois', r.mois, 'pace', 'Le mois, jour après jour');
    poser(d, 'annee', r.annee, 'year', 'L’année, mois après mois');
    /* L'ancien graphique hachuré « Avance cumulée du mois » fait doublon avec la courbe premium. */
    [].forEach.call(d.querySelectorAll('#modMois *'), function (e) {
      if (e.children.length || (e.textContent || '').trim() !== 'Avance cumulée du mois') return;
      var bloc = e.parentElement; for (var i = 0; i < 4 && bloc && bloc.id !== 'modMois' && !bloc.querySelector('svg'); i++) bloc = bloc.parentElement;
      if (bloc && bloc.id !== 'modMois') bloc.classList.add('vx46-ancien');
    });
  }
  setInterval(tour, 2000);
  w.addEventListener('load', function () { setTimeout(tour, 1500); });
  w.VerdictAccueilCourbes = { tour: tour };
})();
