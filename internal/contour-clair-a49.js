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
  var ETATS = '.mod[data-etat="vert"]{--zc:#22c55e;--zc-rgb:34,197,94}.mod[data-etat="jaune"]{--zc:#eab308;--zc-rgb:234,179,8}.mod[data-etat="orange"]{--zc:#f97316;--zc-rgb:249,115,22}.mod[data-etat="rouge"]{--zc:#ef4444;--zc-rgb:239,68,68}.mod[data-etat="info"]{--zc:#7DA2F5;--zc-rgb:125,162,245}';
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
