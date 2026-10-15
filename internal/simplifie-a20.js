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
  /* C71 — Ménage complet du Client : plus rien qui répète l'Accueil ni qui mène nulle part.
     Plus : « Mon action n°1 » (même contenu que l'Accueil) et le parcours « Ce qui est nécessaire » (mêmes étapes que
     l'Accueil) retirés ; « Accès Inventaire sécurisé » et « Choisir mes alertes » masqués tant que le portail d'équipe
     n'est pas en ligne (ils n'affichaient qu'un message) — l'aperçu de démonstration reste. Boutons « ← Retour aux
     modules » retirés partout (le bouton Plus de la barre du bas fait ce retour). Inventaire : « Achats et factures » et
     « Fournisseurs » n'ouvraient qu'une fenêtre d'information : retirés. */
  var sansPortail = typeof w.VERDICT_TEAM_PORTAL_URL === 'string' ? !w.VERDICT_TEAM_PORTAL_URL : true;
  var demo = function () { try { return typeof w.getMode === 'function' && w.getMode() === 'demo'; } catch (e) { return false; } };
  if (sansPortail) doc.documentElement.classList.add('vd-sans-portail');
  css.textContent +=
    '.btn-retour{display:none!important}' +
    'html.vd-sans-portail #alertPreferencesButton{display:none!important}' +
    '[data-v451-inv="invoices"],[data-v451-inv="suppliers"]{display:none!important}';
  if (typeof w.plusStartPriorityHTML === 'function') w.plusStartPriorityHTML = function () { return ''; };
  if (typeof w.parcoursHTML === 'function') w.parcoursHTML = function () { return ''; };
  if (typeof w.plusAlertPreferencesHTML === 'function') { var alertes = w.plusAlertPreferencesHTML; w.plusAlertPreferencesHTML = function () { return sansPortail ? '' : alertes.apply(this, arguments); }; }
  if (typeof w.plusInventoryAccessHTML === 'function') { var acces = w.plusInventoryAccessHTML; w.plusInventoryAccessHTML = function () { return sansPortail && !demo() ? '' : acces.apply(this, arguments); }; }
  /* C73 — « Simuler » a son propre module dans la barre du bas, juste avant Audit : il s'allume sur l'écran Simuler et
     n'est plus un onglet de Structure (une seule entrée). */
  var SIMULER = { fr: 'Simuler', en: 'Simulate', es: 'Simular', it: 'Simula', de: 'Simulieren', nl: 'Simuleren', pt: 'Simular' };
  try { if (w.I18N_DICT) Object.keys(SIMULER).forEach(function (l) { if (w.I18N_DICT[l]) w.I18N_DICT[l]['nav.dec'] = SIMULER[l]; }); } catch (e) {}
  try { var packs = w.VERDICT_I18N_PACKS || {}; Object.keys(packs).forEach(function (l) { if (packs[l] && packs[l].dict && SIMULER[l]) packs[l].dict['nav.dec'] = SIMULER[l]; }); } catch (e) {}
  /* Filet : si un libellé de traduction manque encore, le bouton garde « Simuler » (jamais une clé technique). */
  function libelleSimuler() {
    var b = doc.querySelector('nav button[data-v="dec"]'); if (!b) return;
    var t = doc.createTreeWalker(b, NodeFilter.SHOW_TEXT), n;
    while ((n = t.nextNode())) if (/nav\.dec/.test(n.nodeValue)) n.nodeValue = SIMULER[(doc.documentElement.lang || 'fr').slice(0, 2)] || 'Simuler';
  }
  try { var navEl = doc.querySelector('nav'); if (navEl) new MutationObserver(libelleSimuler).observe(navEl, { subtree: true, childList: true, characterData: true }); libelleSimuler(); } catch (e) {}
  /* Titre de l'écran = nom du module. */
  try { if (w.I18N_DICT) Object.keys(SIMULER).forEach(function (l) { if (w.I18N_DICT[l]) w.I18N_DICT[l]['v.dec.h'] = SIMULER[l]; }); } catch (e) {}
  try { Object.keys(packs).forEach(function (l) { if (packs[l] && packs[l].dict && SIMULER[l]) packs[l].dict['v.dec.h'] = SIMULER[l]; }); } catch (e) {}
  function titreSimuler() { var h = doc.querySelector('#v-dec h1'); if (h && !/Simul/.test(h.textContent)) h.textContent = (h.getAttribute('data-i18n-pre') || '') + (SIMULER[(doc.documentElement.lang || 'fr').slice(0, 2)] || 'Simuler'); }
  titreSimuler();
  /* Lisibilité en mode clair : les boîtes de simulation avaient des fonds pensés pour le sombre (voile noir à 25 %,
     barre du total presque noire) ; on leur donne un vrai fond clair, et le texte se règle alors en foncé. */
  css.textContent +=
    'html.vd-workspace-light #v-dec .dec-col{background:#f6f8fa!important;border:1px solid #e3e8ee!important}' +
    'html.vd-workspace-light #v-dec .dec-col.after{background:#effaf3!important;border:1px solid #cdeed8!important;border-left:4px solid #22c55e!important}' +
    'html.vd-workspace-light #v-dec .dec-rec{background:#f6f8fa!important;border:1px solid #e3e8ee!important}' +
    'html.vd-workspace-light #v-dec [style*="rgba(0,0,0,0.25)"]{background:#f4f6f9!important;border:1px solid #e3e8ee!important}' +
    'html.vd-workspace-light #v-dec [style*="color:#8b94a0"]{color:#5b6573!important}';
  /* C76 — Simuler commence au « Point de départ calculé » (demande de Steven) : rien au-dessus ; puis les curseurs et
     le total ; le registre des décisions et le journal des gains (seulement ici) passent tout en bas. */
  css.textContent +=
    '#v-dec>.chr-view-kicker,#v-dec>.sub,#v-dec>.vg-overview,#v-dec>.chr-view-primary{display:none!important}' +
    '#decBody{display:flex!important;flex-direction:column}#decBody>#decRegistre,#decBody>#journalGains{order:20}' +
    '#decBody>#vsModule{display:none!important}' +
    '#decBody>.card:not(.dec-best):not(.dec-card):not(#decRegistre):not(#journalGains):has(~ #decBestCard){display:none!important}';
  if (typeof w.mainNavView === 'function') { var nav0 = w.mainNavView; w.mainNavView = function (v) { if (v === 'dec') { titreSimuler(); return 'dec'; } return nav0.apply(this, arguments); }; }
  if (typeof w.actBarHTML === 'function') {
    var bar0 = w.actBarHTML;
    w.actBarHTML = function (cur) { var d = doc.createElement('div'); d.innerHTML = bar0.apply(this, arguments); [].forEach.call(d.querySelectorAll('button[onclick*="go(\'dec\')"]'), function (b) { b.remove(); }); return d.innerHTML; };
  }
  if (typeof w.actBarInject === 'function') {
    var inj0 = w.actBarInject;
    w.actBarInject = function (v) { if (v === 'dec') { var sec = doc.getElementById('v-dec'), old = sec && sec.querySelector('.actbar'); if (old) old.remove(); return; } return inj0.apply(this, arguments); };
  }
  if (Array.isArray(w.MODULES_AVEC_RETOUR)) ['audit', 'x', 'achats', 'stock'].forEach(function (v) { var i = w.MODULES_AVEC_RETOUR.indexOf(v); if (i >= 0) w.MODULES_AVEC_RETOUR.splice(i, 1); });
})();
