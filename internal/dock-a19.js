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
/* C61 : mise à jour en ligne vérifiée de bout en bout le 15/10 (publication d’essai). */
