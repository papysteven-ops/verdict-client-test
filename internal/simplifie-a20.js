/* C69 — Une seule entrée par destination : l'appli est très complète, le client doit la trouver simple et cohérente.
   Ce qui a déjà son bouton permanent (barre du bas Accueil · Structure · Audit · Plus, onglets Pilotage · Carte ·
   Inventaire, barre d'établissements, bouton Vera) n'est plus répété ailleurs.
   Pilotage › Plus : carte « Audit Premium », raccourcis « Comprendre mes chiffres », « Carte & matières »,
   « Mes établissements », carte « Demander à Vera » et carte « Voir la carte complète » retirés ; restent les
   entrées sans autre accès (Équipe & services, Caisse, Budget, Réglages…).
   Aide Vera : les 4 raccourcis (Mes chiffres, Mes établissements, Mon audit, Voir tout Verdict) retirés.
   Audit : plus de « ← Retour aux modules » (Audit est déjà dans la barre du bas).
   Inventaire › Plus : « Commandes » retiré pour le gérant (déjà dans la barre du bas ; gardé pour un compteur). */
(function () {
  'use strict';
  var w = window, doc = document;
  if (doc.getElementById('simplifie-a20')) return;
  var css = doc.createElement('style'); css.id = 'simplifie-a20';
  css.textContent =
    '.plus-start-map{display:none!important}' +
    '#v-aide .help-actions{display:none!important}' +
    '#v-audit .btn-retour{display:none!important}' +
    'html:not(.shared-counter) [data-v451-inv="orders"]{display:none!important}';
  (doc.head || doc.documentElement).appendChild(css);
  /* Module Pilotage : remplacement des cartes en double au moment où l'écran Plus est construit. */
  if (typeof w.plusStartAuditHTML === 'function') w.plusStartAuditHTML = function () { return ''; };
  if (typeof w.plusStartVeraHTML === 'function') w.plusStartVeraHTML = function () { return ''; };
  if (typeof w.plusStartShortcutsHTML === 'function' && Array.isArray(w.PLUS_START_ROUTES)) {
    var original = w.plusStartShortcutsHTML, toutes = w.PLUS_START_ROUTES.slice();
    w.plusStartShortcutsHTML = function (u) {
      var routes = [], libelles = [];
      toutes.forEach(function (r, i) { if (r.go === 'planning') { routes.push(r); libelles.push(u && u.shortcuts ? u.shortcuts[i] : null); } });
      if (!routes.length) return '';
      var avant = w.PLUS_START_ROUTES; w.PLUS_START_ROUTES = routes;
      try { return original(Object.assign({}, u, { shortcuts: libelles })); } finally { w.PLUS_START_ROUTES = avant; }
    };
  }
  if (Array.isArray(w.MODULES_AVEC_RETOUR)) ['audit', 'x', 'achats', 'stock'].forEach(function (v) { var i = w.MODULES_AVEC_RETOUR.indexOf(v); if (i >= 0) w.MODULES_AVEC_RETOUR.splice(i, 1); });
})();
