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
  /* C233 (Steven, 21/10 : « revoir entièrement les 3 modules, mode clair complètement noir, illisible ») : À faire, Alertes et
     Équipe gardaient en clair la barre d'onglets noire collée en haut, les cases noires des Alertes et les boîtes sombres de
     « Tester une décision ». Fond clair partout ; onglet actif au vert Verdict ; le texte se règle alors en foncé. */
  css.textContent +=
    'html.vd-workspace-light #v-priorities .chips,html.vd-workspace-light #v-alertes .chips,html.vd-workspace-light #v-org .chips{background:#fff!important;border:1px solid #d5dde5!important;box-shadow:0 6px 18px rgba(20,35,50,.10)!important;backdrop-filter:none!important}' +
    'html.vd-workspace-light #v-priorities .chips>button,html.vd-workspace-light #v-alertes .chips>button,html.vd-workspace-light #v-org .chips>button{color:#334155!important;background:transparent!important}' +
    'html.vd-workspace-light #v-priorities .chips>button.on,html.vd-workspace-light #v-alertes .chips>button.on,html.vd-workspace-light #v-org .chips>button.on{background:#e8f5ee!important;color:#166534!important;box-shadow:inset 0 0 0 1px #bfe5cd!important}' +
    'html.vd-workspace-light #v-alertes .kpis{background:#fff!important;border:1px solid #e3e8ee!important}' +
    'html.vd-workspace-light #v-alertes .kpi{background:#fff!important;border-color:#e3e8ee!important;box-shadow:none!important}' +
    'html.vd-workspace-light #v-org .dec-col,html.vd-workspace-light #v-org .dec-vd,html.vd-workspace-light #v-org .dec-rec{background:#f6f8fa!important;border:1px solid #e3e8ee!important}' +
    'html.vd-workspace-light #v-org .dec-col.after{background:#effaf3!important;border:1px solid #cdeed8!important;border-left:4px solid #22c55e!important}' +
    'html.vd-workspace-light #v-org .warn.on{background:#fff7ed!important;border:1px solid #fed7aa!important;color:#9a3412!important}' +
    'html.vd-workspace-light #v-org [style*="rgba(0,0,0,0.25)"]{background:#f4f6f9!important;border:1px solid #e3e8ee!important}' +
    /* C243 (T1, vague 5 : « Tester une décision » gardait en clair son dégradé sombre écrit dans la carte, titre gris sur gris) */
    'html.vd-workspace-light #v-org #point9-organization{background:#fff!important;border:1px solid #cfe0f5!important;box-shadow:0 6px 18px rgba(20,35,50,.06)!important}' +
    'html.vd-workspace-light #v-org #point9-organization h3{color:#17212b!important}html.vd-workspace-light #v-org #point9-organization p.note{color:#526171!important}' +
    'html.vd-workspace-light #v-org #point9-organization [style*="color:#93c5fd"]{color:#1d4ed8!important}';
  /* C76 — Simuler commence au « Point de départ calculé » (demande de Steven) : rien au-dessus ; puis les curseurs et
     le total ; le registre des décisions et le journal des gains (seulement ici) passent tout en bas. */
  css.textContent +=
    '#v-dec>.chr-view-kicker,#v-dec>.sub,#v-dec>.vg-overview,#v-dec>.chr-view-primary{display:none!important}' +
    '#decBody{display:flex!important;flex-direction:column}#decBody>#decRegistre,#decBody>#journalGains{order:20}' +
    '#decBody>#vsModule{display:none!important}' +
    '#decBody>.card:not(.dec-best):not(.dec-card):not(#decRegistre):not(#journalGains):has(~ #decBestCard){display:none!important}';
  /* C79 — Plus de grand vide en haut de Simuler (réserve de 174 px prévue pour l'ancienne barre d'onglets). Et le
     bouton « Utiliser comme point de départ » se voit tout de suite : vert, halo lumineux qui pulse, main qui tape,
     et une phrase qui dit ce qui va se passer — un client qui ne connaît pas l'appli ne peut plus le manquer. */
  css.textContent +=
    '#v-dec{padding-top:18px!important}' +
    '#decBestCard .vd-cta{position:relative;display:flex!important;align-items:center;justify-content:center;width:100%;min-height:58px;padding:0 54px!important;border:0!important;border-radius:16px!important;background:linear-gradient(180deg,#22c55e,#16a34a)!important;color:#ffffff!important;font-weight:800!important;font-size:17px!important;letter-spacing:.01em;cursor:pointer;animation:vdHalo 1.8s ease-out infinite;transition:transform .15s ease,filter .15s ease}' +
    '#decBestCard .vd-cta:hover{filter:brightness(1.08);transform:translateY(-1px)}#decBestCard .vd-cta:active{transform:scale(.98)}' +
    '#decBestCard .vd-cta::after{content:"\\1F446";position:absolute;right:16px;top:50%;margin-top:-13px;font-size:24px;line-height:26px;animation:vdTape 1.2s ease-in-out infinite}' +
    '#decBestCard .vd-cta-hint{margin:10px 2px 2px;text-align:center;font-size:13.5px;font-weight:600;color:#16a34a}html.vd-workspace-dark #decBestCard .vd-cta-hint{color:#4ade80}' +
    '@keyframes vdHalo{0%{box-shadow:0 0 0 0 rgba(34,197,94,.6),0 0 16px rgba(34,197,94,.35)}70%{box-shadow:0 0 0 14px rgba(34,197,94,0),0 0 30px rgba(34,197,94,.55)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0),0 0 16px rgba(34,197,94,.35)}}' +
    '@keyframes vdTape{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-6px) rotate(-8deg) scale(1.08)}}' +
    '@media (prefers-reduced-motion:reduce){#decBestCard .vd-cta,#decBestCard .vd-cta::after{animation:none}#decBestCard .vd-cta{box-shadow:0 0 0 3px rgba(34,197,94,.45),0 0 22px rgba(34,197,94,.45)}}' +
    '@media (min-width:900px){#decBestCard .vd-cta{min-height:62px;font-size:18px}}';
  /* C81 — Après « Utiliser comme point de départ » : l'écran du score et la lecture guidée étaient pensés pour le
     sombre ; en mode clair ils gardaient des voiles gris foncé et des textes éteints. Styles clairs dédiés (blanc,
     gris très clair, vert clair), et « Indice de sérénité Verdict » ne déborde plus du cadran. */
  css.textContent +=
    '.dec-reveal-score span{max-width:104px;text-align:center;font-size:8.5px!important;letter-spacing:.07em!important;line-height:1.25!important}' +
    'html.vd-workspace-light .dec-reveal-dial{background:conic-gradient(var(--dec-tone) var(--dec-progress),#e5e9ef 0)!important;filter:drop-shadow(0 10px 22px rgba(15,23,42,.14))!important}' +
    'html.vd-workspace-light .dec-reveal-dial:before{background:radial-gradient(circle at 50% 30%,#ffffff,#f6f8fa 70%)!important;box-shadow:inset 0 0 0 1px #e3e8ee!important}' +
    'html.vd-workspace-light .dec-reveal-score span{color:#64748b!important}html.vd-workspace-light .dec-reveal-score em{color:#64748b!important}' +
    'html.vd-workspace-light .dec-reveal-score b{color:color-mix(in srgb,var(--dec-tone) 78%,#000)!important;text-shadow:none!important}' +
    'html.vd-workspace-light .dec-reveal-pos{background:#f6f8fa!important;border:1px solid #e3e8ee!important}' +
    'html.vd-workspace-light .dec-reveal-pos.after{background:color-mix(in srgb,var(--dec-tone) 9%,#ffffff)!important;border-color:color-mix(in srgb,var(--dec-tone) 45%,#ffffff)!important}' +
    'html.vd-workspace-light .dec-reveal-pos>small,html.vd-workspace-light .dec-reveal-metric span{color:#64748b!important}html.vd-workspace-light .dec-reveal-metric b{color:#0f172a!important}' +
    'html.vd-workspace-light .dec-reveal-pos.after .dec-reveal-metric b{color:color-mix(in srgb,var(--dec-tone) 78%,#000)!important}' +
    'html.vd-workspace-light .dec-scene{background:radial-gradient(circle at 88% 5%,rgba(96,165,250,.10),transparent 34%),linear-gradient(160deg,#f0fdf4,#ffffff 55%)!important;border-color:#bbf7d0!important;color:#0f172a!important}' +
    'html.vd-workspace-light .dec-scene-step{background:#ffffff!important;border:1px solid #e3e8ee!important;box-shadow:0 1px 2px rgba(15,23,42,.05),0 6px 16px rgba(15,23,42,.05)!important;color:#0f172a!important}' +
    'html.vd-workspace-light .dec-scene-step small,html.vd-workspace-light .dec-scene-step .k,html.vd-workspace-light .dec-scene-step p{color:#64748b!important}' +
    'html.vd-workspace-light .dec-scene-pos{background:#f6f8fa!important;border:1px solid #e3e8ee!important}html.vd-workspace-light .dec-scene-pos.after{background:#effaf3!important;border-color:#bbf7d0!important}' +
    'html.vd-workspace-light .dec-scene-pos small,html.vd-workspace-light .dec-scene-row span{color:#64748b!important}html.vd-workspace-light .dec-scene-row b{color:#0f172a!important}html.vd-workspace-light .dec-scene-pos.after .dec-scene-row b{color:#15803d!important}' +
    'html.vd-workspace-light .dec-scene-chip{background:#ecfdf3!important;border-color:#bbf7d0!important;color:#166534!important}';
  function marquerCTA() {
    var c = doc.getElementById('decBestCard'); if (!c) return;
    var b = [].filter.call(c.querySelectorAll('button'), function (x) { return /Utiliser comme point de d/.test(x.textContent); })[0];
    if (!b || b.classList.contains('vd-cta')) return;
    b.classList.add('vd-cta');
    var h = doc.createElement('div'); h.className = 'vd-cta-hint'; h.textContent = 'Touchez ici : Verdict applique ces leviers et vous montre le résultat, étape par étape.';
    b.parentNode.insertBefore(h, b.nextSibling);
  }
  try { var corps = doc.getElementById('v-dec'); if (corps) new MutationObserver(marquerCTA).observe(corps, { childList: true, subtree: true }); marquerCTA(); } catch (e) {}
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
