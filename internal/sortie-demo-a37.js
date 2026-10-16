/* C110 — Quitter la démonstration depuis l'Inventaire (Steven, 16/10 : « quand je quitte la démo, il ferme et rouvre
   l'appli comme au lancement et me remet la démo ; j'étais dans l'Inventaire »).
   Avant : le bouton « Quitter » du bandeau de l'Inventaire rechargeait toute la coquille vers Pilotage
   (`index.html?module=verdict`) : verrou, écran de lancement, puis l'accueil Pilotage d'un dossier vide — tout sauf
   l'Inventaire où l'on était. Maintenant : la démonstration s'éteint (clé de reprise et contexte de démo effacés),
   la coquille revient sur l'Inventaire réel, sans redemander le code (même tolérance que la mise à jour sans verrou),
   et l'adresse est nettoyée. Ce fichier sert dans les deux cadres : dans l'Inventaire il remplace la sortie ; dans
   la coquille il applique l'arrivée. C114 : Perso et atelier ont la même sortie (ils relançaient toute l'appli). */
(function () {
  'use strict';
  var w = window, CLE_REPRISE = 'verdict:demo:resume:client:v1', CLE_CONTEXTE = 'verdict:unified:client:v1:context', CLE_SANS_VERROU = 'verdict:maj-sans-verrou';
  function eteindre() {
    try { localStorage.removeItem(CLE_REPRISE); } catch (e) {}
    try { sessionStorage.removeItem(CLE_CONTEXTE); } catch (e) {}
  }
  var enCoquille = (function () { try { return w.top === w; } catch (e) { return false; } })();

  if (enCoquille) {
    /* Arrivée après la sortie : la démonstration ne doit pas reprendre, l'adresse redevient propre. */
    var q = new URLSearchParams(location.search);
    if (q.get('sortie') === 'demo') {
      eteindre();
      q.delete('sortie'); q.delete('demo'); q.delete('presentation'); q.delete('guide');
      try { history.replaceState(history.state, '', location.pathname + (q.toString() ? '?' + q.toString() : '') + location.hash); } catch (e) {}
    }
    w.VerdictSortieDemo = { eteindre: eteindre };
    return;
  }

  /* Cadre Inventaire : « Quitter » reste dans l'Inventaire, en réel. */
  var origine = w.inventoryDemoExit;
  function quitter() {
    eteindre();
    try { sessionStorage.setItem(CLE_SANS_VERROU, String(Date.now())); } catch (e) {}
    try {
      var base = w.__vdBase || location.href, cible = new URL('../../index.html?module=inventory&sortie=demo', base).href;
      (w.top || w).location.href = cible;
    } catch (e) { if (typeof origine === 'function') origine(); }
  }
  w.inventoryDemoExit = quitter;
  w.VerdictSortieDemo = { quitter: quitter, eteindre: eteindre };
})();
