/* C144 — Sommaire des pages longues (analyse complète du 17/10, groupe 2 : « pages très longues sur iPhone »).
   Simuler, Entrées, Aide, Planning, Salaires et Historique font 4 300 à 7 650 px sur iPhone. Steven veut garder
   l'information dépliée (C133) : rien n'est replié. En haut de ces pages, une rangée de pastilles reprend leurs titres
   de parties ; un appui mène directement à la partie. Téléphone et tablette en portrait uniquement (< 820 px).
   L'Audit garde son propre sommaire (« Tout le détail, chapitre par chapitre ») ; Organisation n'a que deux titres. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdSommaire) return; w.__vdSommaire = true;
  var VUES = { dec: 1, in: 1, aide: 1, planning: 1, sal: 1, hist: 1 };
  function court(t) { t = String(t || '').replace(/[\u{1F300}-\u{1FAFF}⌀-⏿☀-➿️]/gu, '').replace(/\s+/g, ' ').trim(); return t.length > 30 ? t.slice(0, 28).replace(/[\s,;:·—-]+$/, '') + '…' : t; }
  var CSS = '.vx45-som{display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;margin:4px 0 14px;padding:2px 2px 6px}.vx45-som::-webkit-scrollbar{display:none}' +
    '.vx45-som b{flex:0 0 auto;align-self:center;font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-right:2px}' +
    '.vx45-som button{flex:0 0 auto;appearance:none;border:1px solid rgba(148,163,184,.45);background:rgba(148,163,184,.10);color:inherit;font:inherit;font-size:14px;font-weight:700;padding:9px 14px;border-radius:999px;min-height:40px;white-space:nowrap;cursor:pointer}' +
    '.vx45-som button:active{transform:scale(.97)}';
  function construire(v) {
    var el = doc.getElementById('v-' + v); if (!el || !VUES[v]) return;
    var ancien = el.querySelector(':scope > .vx45-som');
    if (w.innerWidth >= 820 || el.getBoundingClientRect().height < 4000) { if (ancien) ancien.remove(); return; }
    var titres = [].filter.call(el.querySelectorAll('h2, h3'), function (h) { return h.getClientRects().length && court(h.textContent) && !h.closest('.vx45-som, details:not([open]) > :not(summary)'); }).slice(0, 10);
    if (titres.length < 3) { if (ancien) ancien.remove(); return; }
    if (!doc.getElementById('vx45-css')) { var s = doc.createElement('style'); s.id = 'vx45-css'; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s); }
    var nav = ancien || doc.createElement('nav'); nav.className = 'vx45-som'; nav.setAttribute('aria-label', 'Aller à une partie de la page'); nav.innerHTML = '<b>Aller à</b>';
    titres.forEach(function (h) {
      var b = doc.createElement('button'); b.type = 'button'; b.textContent = court(h.textContent);
      b.addEventListener('click', function () { var y = h.getBoundingClientRect().top + w.scrollY - 150; w.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); });
      nav.appendChild(b);
    });
    if (!ancien) { var avant = [].filter.call(el.children, function (c) { return /card|conc|p40|section|vt/i.test(c.className || '') && c.getClientRects().length; })[0]; if (avant) el.insertBefore(nav, avant); else el.insertBefore(nav, el.firstChild); }
  }
  function vueActive() { var on = doc.querySelector('.view.on'); return on ? on.id.replace(/^v-/, '') : ''; }
  var go0 = w.go;
  if (typeof go0 === 'function' && !go0.__vx45) {
    var go = function () { var r = go0.apply(this, arguments); setTimeout(function () { construire(vueActive()); }, 900); return r; };
    for (var k in go0) { try { go[k] = go0[k]; } catch (e) {} } go.__vx45 = true; w.go = go;
  }
  w.addEventListener('resize', function () { setTimeout(function () { construire(vueActive()); }, 300); });
  w.VerdictSommaire = { construire: construire };
})();
