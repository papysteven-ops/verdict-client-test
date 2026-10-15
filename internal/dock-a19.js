/* C55 — Barre du bas de Pilotage et Carte : opaque et nette, en clair comme en sombre.
   Sur iPhone, en mode sombre, l'effet de flou d'arrière-plan (backdrop-filter) laissait voir une forme floue sans
   boutons, surtout une fois la barre repliée au défilement. La barre garde sa forme et son repli ; seuls le fond
   (plein) et la visibilité des boutons sont fixés. L'Inventaire n'était pas concerné. */
(function () {
  'use strict';
  var doc = document; if (doc.getElementById('dock-a19')) return;
  var s = doc.createElement('style'); s.id = 'dock-a19';
  s.textContent =
    'html.premium-fixed-dock body nav.premium-adaptive-dock,html.premium-fixed-dock.premium-dock-hidden body nav.premium-adaptive-dock{' +
      '-webkit-backdrop-filter:none!important;backdrop-filter:none!important;opacity:1!important;' +
      'background:#ffffff!important;border:1px solid rgba(15,23,42,.12)!important;box-shadow:0 10px 30px rgba(15,23,42,.18)!important}' +
    'html.vd-workspace-dark.premium-fixed-dock body nav.premium-adaptive-dock,html.vd-workspace-dark.premium-fixed-dock.premium-dock-hidden body nav.premium-adaptive-dock{' +
      'background:#141b22!important;border-color:#2b3644!important;box-shadow:0 10px 30px rgba(0,0,0,.55)!important}' +
    'html.premium-fixed-dock body nav.premium-adaptive-dock>button{opacity:1!important;visibility:visible!important}' +
    'html.premium-fixed-dock body nav.premium-adaptive-dock>button svg{opacity:1!important}' +
    'html.vd-workspace-dark.premium-fixed-dock body nav.premium-adaptive-dock>button{color:#e5e7eb!important}' +
    'html.vd-workspace-dark.premium-fixed-dock body nav.premium-adaptive-dock>button.on{color:#22c55e!important}';
  (doc.head || doc.documentElement).appendChild(s);
})();
/* C61 : mise à jour en ligne vérifiée de bout en bout le 15/10, y compris en démonstration (publication de contrôle). */

/* C77 — Un seul appui suffit, même quand la barre du bas est repliée (en défilant). Avant : le doigt posé rouvrait
   la barre, les boutons se déplaçaient sous le doigt et l'appui était perdu ; il fallait toucher deux fois.
   Le bouton touché barre repliée est mémorisé et ouvert au lever du doigt (une seule fois). */
(function () {
  'use strict';
  var doc = document; if (doc.__vdDockUnAppui) return; doc.__vdDockUnAppui = true;
  var vise = null, t0 = 0, fait = false;
  function bouton(e) { var b = e.target && e.target.closest && e.target.closest('nav.premium-adaptive-dock > button, nav[aria-label] > button'); return b && b.getAttribute('data-v') ? b : null; }
  doc.addEventListener('pointerdown', function (e) {
    vise = null; fait = false;
    if (!doc.documentElement.classList.contains('premium-dock-hidden')) return;
    var b = bouton(e); if (b) { vise = b; t0 = Date.now(); }
  }, true);
  doc.addEventListener('click', function (e) { var b = bouton(e); if (b && b === vise) fait = true; }, true);
  doc.addEventListener('pointerup', function () {
    var b = vise; if (!b) return;
    setTimeout(function () { if (!fait && vise === b && Date.now() - t0 < 900) { fait = true; vise = null; b.click(); } else vise = null; }, 80);
  }, true);
})();

/* C80 — « Encore le bas, module flou » (Steven, captures iPhone) : pendant le repli, Safari iOS dessinait la barre
   animée (agrandissement simulé + flou d'arrière-plan) comme une tache floue sans boutons. On supprime le flou pour
   de bon (règle plus forte que celles d'origine) et l'animation de déformation : la barre se replie et revient par
   une simple transition de largeur, toujours nette, boutons visibles. */
(function () {
  'use strict';
  var doc = document; if (doc.getElementById('dock-a19-net')) return;
  var s = doc.createElement('style'); s.id = 'dock-a19-net';
  s.textContent = 'html body nav.premium-adaptive-dock.premium-adaptive-dock[class]{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;filter:none!important;will-change:auto!important;transition:width .22s cubic-bezier(.22,1,.36,1),height .22s cubic-bezier(.22,1,.36,1)!important}' +
    'html body nav.premium-adaptive-dock.premium-adaptive-dock[class]>button,html body nav.premium-adaptive-dock.premium-adaptive-dock[class]>button>.ic{opacity:1!important;visibility:visible!important;filter:none!important}';
  (doc.head || doc.documentElement).appendChild(s);
  var fausse = function () { return { cancel: function () {}, finish: function () {}, finished: Promise.resolve(), addEventListener: function () {} }; };
  function neutraliser() {
    var nav = doc.querySelector('nav.premium-adaptive-dock'); if (!nav || nav.__vdNet) return; nav.__vdNet = true;
    nav.animate = fausse;
    [].forEach.call(nav.querySelectorAll(':scope > button > .ic, :scope > button > #bdg'), function (n) { n.animate = fausse; });
  }
  neutraliser();
  /* C92 : plus d'observation de toute la page (coûteuse pendant les curseurs) : une vérification à l'ouverture puis
     quelques secondes après, le temps que la barre soit construite. */
  [300, 1500, 4000].forEach(function (t) { setTimeout(neutraliser, t); });
})();
