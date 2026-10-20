/* C176 — L'essentiel d'abord (Steven, 20/10, retour d'un ami restaurateur : « c'est génial, complet, mais pas facile : il y a
   beaucoup de choses, pas forcément bien positionnées. Je vais dans Carte, je veux voir ma carte… » ; « analyse complète,
   logique, cohérence : ce que le patron veut voir, l'essentiel — Pilotage, Carte, Inventaire ; ne casse rien des effets »).
   Analyse écran par écran (démo Brasserie, appli complète) : la plupart des écrans ouvrent déjà sur l'essentiel (Structure,
   Simuler, Audit, Inventaire Compter / Commande / Analyse, Carte › Ventes). Trois écrans faisaient passer un outil ou une
   explication avant ce que le patron vient chercher :
   - Carte › Ma carte : « Votre carte en 6 images » avant la carte → corrigé dans carte-recit-a33.js (récit sous les plats) ;
   - Accueil : une barre « Mes contrôles et actions » tout en haut, avant « Pilotage du jour » : simple raccourci vers la
     section du même nom, déjà en bas de l'Accueil → retirée du haut ;
   - Carte › Décisions : le réglage « Mes objectifs par famille et canal » avant les actions (À corriger, À tester, À pousser…)
     → placé après les actions.
   Rien n'est supprimé ni recalculé ; les effets (animations, contours, jauges) ne changent pas. Chaque bloc est déplacé
   une seule fois vers un ordre cible unique, et seulement s'il n'y est pas déjà (0 changement au repos). */
(function () {
  'use strict';
  var w = window, doc = document; if (w.VerdictOrdrePatron) return;
  var CSS = '#v-pil>#vc-entry{display:none!important}';
  function css() { if (doc.head && !doc.getElementById('op55-css')) { var s = doc.createElement('style'); s.id = 'op55-css'; s.textContent = CSS; doc.head.appendChild(s); } }
  function tour() {
    css();
    /* Carte › Décisions : les objectifs (réglage) après les actions. */
    var plats = doc.getElementById('c-plats'), obj = doc.getElementById('vc-carte');
    if (plats && obj && obj.parentNode === plats && plats.lastElementChild !== obj) plats.appendChild(obj);
  }
  var t = setInterval(tour, 1500); if (t && t.unref) t.unref();
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', tour); else tour();
  w.VerdictOrdrePatron = { tour: tour };
})();
