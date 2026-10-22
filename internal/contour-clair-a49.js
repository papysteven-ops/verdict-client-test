/* C158 — L'effet « contour » du mode sombre, aussi en mode clair (Steven, 18/10, photos de l'écran : « l'effet contour je
   le veux en clair, et sur toute l'appli ; en sombre on voit tout, ça pète bien ; en clair c'est fade, plus la même
   intensité, et on oublie l'effet »).
   En sombre, chaque carte d'état porte sa couleur : liseré de 3 px à gauche, teinte dans le coin, et sur fond noir tout
   ressort. En clair, deux familles de cartes perdaient cette couleur (ombre grise neutre, bordure grise) :
   - les cartes des écrans premium (`.mod[data-etat]`, `.courbe`) : Accueil, Priorités… (cadres p41) ;
   - les cartes à liseré (`.p40-lise`) : Planning, Priorités, Historique, Organisation, Inventaire.
   Ici, en clair seulement : bordure teintée de la couleur d'état, liseré de 3 px, halo coloré doux sous la carte et teinte
   dans le coin — intensité réglée pour un fond blanc (plus marquée qu'en sombre, où le noir fait le contraste). */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdContourClair) return; w.__vdContourClair = true;
  /* Certains écrans nomment leur couleur d'état autrement (--v) : les couleurs Verdict sont reposées ici par état. */
  var ETATS = '.mod[data-etat="vert"]{--zc:#22c55e;--zc-rgb:34,197,94}.mod[data-etat="jaune"]{--zc:#eab308;--zc-rgb:234,179,8}.mod[data-etat="orange"]{--zc:#f97316;--zc-rgb:249,115,22}.mod[data-etat="rouge"]{--zc:#ef4444;--zc-rgb:239,68,68}.mod[data-etat="info"]{--zc:#7DA2F5;--zc-rgb:125,162,245}.mod[data-etat="juste"]{--zc:#0ea5e9;--zc-rgb:14,165,233}';
  var MOD = ETATS + 'html.vd-workspace-light .mod[data-etat]:not([data-etat="neutre"]),html.vd-workspace-light .courbe[data-zone]{' +
      'border-color:rgba(var(--zc-rgb),.45)!important;' +
      'box-shadow:inset 3px 0 0 var(--zc),0 0 0 1px rgba(var(--zc-rgb),.10),0 20px 44px -24px rgba(var(--zc-rgb),.60),0 2px 8px rgba(15,23,42,.05)!important;' +
      'background-image:radial-gradient(120% 80% at 0% 0%,rgba(var(--zc-rgb),.16),transparent 62%)!important}' +
    'html.vd-workspace-light .mod[data-etat]:not([data-etat="neutre"]) .chip{border-color:rgba(var(--zc-rgb),.55)}';
  var LISE = 'html.vd-workspace-light.p40-app body .p40-lise,html.vd-workspace-light .p40-app .p40-lise{' +
      'border-color:rgba(var(--p40-rgb),.42)!important;' +
      'box-shadow:inset 3px 0 0 var(--p40-c),0 0 0 1px rgba(var(--p40-rgb),.10),0 20px 44px -26px rgba(var(--p40-rgb),.55),0 2px 8px rgba(15,23,42,.05)!important;' +
      'background-image:radial-gradient(120% 85% at 0% 0%,rgba(var(--p40-rgb),.14),transparent 60%)!important}';
  /* Graphique « Vos journées / mois / années » (Rythme, C149) : même contour à la couleur de la valeur choisie. */
  var RX = 'html.vd-workspace-light section.rx[data-st]:not([data-st="vide"]){border-color:color-mix(in srgb,var(--rx-c) 45%,transparent)!important;' +
      'box-shadow:inset 3px 0 0 var(--rx-c),0 0 0 1px color-mix(in srgb,var(--rx-c) 10%,transparent),0 20px 44px -26px color-mix(in srgb,var(--rx-c) 55%,transparent),0 2px 8px rgba(15,23,42,.05)!important}';
  MOD += RX;
  /* C250 (tour du thème clair, A5 et A7) : l'encadré « Connexion serveur non activée » de la caisse (Plus › Connexion de la caisse)
     et l'état vide de Structure › Performances restaient bleu nuit / noirs sur une page blanche. */
  MOD += 'html.vd-workspace-light .v451-flux-state{background:#eef5ff!important;border-color:#b9cff0!important;color:#17212b!important}' +
    'html.vd-workspace-light .v451-flux-state b{color:#17212b!important}html.vd-workspace-light .v451-flux-state small{color:#475569!important}html.vd-workspace-light .v451-flux-state i{background:#2563eb!important}' +
    'html.vd-workspace-light .vp-chart-empty{background:radial-gradient(circle at 50% 0,rgba(37,99,235,.07),transparent 45%),#f8fafc!important;border-color:#d5dde7!important;color:#17212b!important}' +
    'html.vd-workspace-light .vp-chart-empty>span{background:#eef4ff!important;border-color:#c7d6ee!important;color:#2563eb!important}html.vd-workspace-light .vp-chart-empty b{color:#17212b!important}html.vd-workspace-light .vp-chart-empty p{color:#475569!important}';
  MOD += 'html.vd-workspace-light .v451-flux-modal{background:rgba(15,23,42,.42)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
    'html.vd-workspace-light .v451-flux-sheet{background:#fff!important;color:#17212b!important;border-color:#d5dde5!important;box-shadow:0 18px 48px rgba(16,24,40,.18)!important}' +
    'html.vd-workspace-light .v451-flux-grab{background:#cbd5e1!important}html.vd-workspace-light .v451-flux-kicker{color:#2f5f96!important}html.vd-workspace-light .v451-flux-sheet p{color:#475569!important}' +
    'html.vd-workspace-light .v451-flux-secondary{background:#f1f5f9!important;border-color:#cbd5e1!important;color:#17212b!important}html.vd-workspace-light .v451-flux-close{background:#fff!important;border-color:#cbd5e1!important;color:#17212b!important}' +
    'html.vd-workspace-light .v451-flux-primary{background:#2563eb!important;color:#fff!important}html.vd-workspace-light .v451-flux-note{color:#526171!important}' +
    'html.vd-workspace-light .v451-flux-field input{background:#fff!important;color:#17212b!important;border-color:#94a3b8!important}html.vd-workspace-light .v451-flux-history{border-color:#e2e8f0!important}html.vd-workspace-light .v451-flux-history article{border-color:#e2e8f0!important}html.vd-workspace-light .v451-flux-history article span{color:#334155!important}';
  function poser(d) {
    try { if (!d || !d.head || d.getElementById('vx49-css')) return; var s = d.createElement('style'); s.id = 'vx49-css'; s.textContent = MOD + LISE; d.head.appendChild(s); } catch (e) {}
  }
  function tour() {
    poser(doc);
    [].forEach.call(doc.querySelectorAll('iframe'), function (f) { try { poser(f.contentDocument); } catch (e) {} });
  }
  var t = setInterval(tour, 1500); if (t && t.unref) t.unref();
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', tour); else tour();
  w.VerdictContourClair = { tour: tour };
})();
