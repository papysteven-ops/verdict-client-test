/* C75 — Page « Plus » premium, pensée d'un seul tenant (au lieu d'un empilement de cartes) :
   en-tête, recherche (transmise à Vera), puis trois groupes de lignes comme les réglages d'une appli iPhone :
   Piloter · Données · Établissement & compte. Chaque ligne : icône, titre, description, chevron.
   Styles clair et sombre explicites (jamais repeints par le thème clair). Les fonctions appelées sont celles
   d'origine (go, openEtabs, langModal, connexion caisse…) : aucune n'est réécrite. */
(function () {
  'use strict';
  var w = window, doc = document;
  if (doc.getElementById('vd-plus-css')) return;
  var ICONES = {
    afaire: '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h9"/>',
    conso: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    equipe: '<path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"/><circle cx="9" cy="7" r="3.5"/><path d="M22 19v-1a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    budget: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="m9 15 2 2 4-4"/>',
    caisse: '<path d="M7 7h13l-3-3"/><path d="M17 17H4l3 3"/>',
    importer: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    etabs: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>',
    acces: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    compte: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    langue: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    chercher: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    /* C312 (V16-071) : modules */
    pilotage: '<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>',
    carte: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    inventaire: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>'
  };
  function svg(k, cls) { return '<svg class="' + (cls || 'vp-ic') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONES[k] + '</svg>'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function demo() { try { return typeof w.getMode === 'function' && w.getMode() === 'demo'; } catch (e) { return false; } }
  function modeleDemo() { try { return !w.VERDICT_TEST_SESSION && typeof w.modeleDansDemonstration === 'function' && !!w.modeleDansDemonstration(); } catch (e) { return false; } }
  var portail = typeof w.VERDICT_TEAM_PORTAL_URL === 'string' && !!w.VERDICT_TEAM_PORTAL_URL;
  function pilotage() { try { return typeof w.verdictNiveau === 'function' && w.verdictNiveau() === 'pilotage'; } catch (e) { return false; } }
  var ACTIONS = {
    /* C305 (V15-101) : en Pilotage, l'équipe (à l'année et au mois) est comprise : on l'ouvre directement, au lieu du cadenas
       Pro « Coût par service ». « À faire » et les Alertes, compris dans Pilotage, ont enfin un chemin visible. */
    equipe: function () { w.go(pilotage() ? 'sal' : 'planning'); },
    afaire: function () { w.go('priorities'); },
    /* C305 (V15-117) : « Consommation » (internal/limites-conso-pilotage-a47.js) est rendue ici, avec les autres lignes ; elle
       était ajoutée environ 60 ms après l'affichage et faisait descendre les lignes du dessous sous le doigt. */
    conso: function () { w.go('conso'); },
    budget: function () { w.go('obj'); },
    caisse: function () { if (w.VerdictFluxV451 && w.VerdictFluxV451.openConnection) w.VerdictFluxV451.openConnection(); else w.go('in'); },
    importer: function () { w.go('in'); },
    etabs: function () { w.openEtabs(); },
    acces: function () { if (demo() && typeof w.demoInventoryAccessPreview === 'function') w.demoInventoryAccessPreview(); else if (typeof w.plusInventoryAccessManage === 'function') w.plusInventoryAccessManage(); },
    compte: function () { w.go('abo'); },
    langue: function () { if (typeof w.langModal === 'function') w.langModal(); },
    /* C312 (V16-071) : Pilotage ouvert seul (sans la coque) — les trois modules restent atteignables. */
    pilotage: function () { var P = w.VerdictModuleProfilesV45; if (P && P.setProfile) P.setProfile('pilotage', true); else w.go('pil'); },
    carte: function () { var P = w.VerdictModuleProfilesV45; if (P && P.setProfile) P.setProfile('carte', true); else w.go('carte'); },
    inventaire: function () { var P = w.VerdictModuleProfilesV45; if (P && P.requestInventory) P.requestInventory('inventory-analysis'); }
  };
  function groupes() {
    var g = [
      { t: 'Piloter', l: [['afaire', 'À faire et alertes', 'Ce qui compte aujourd’hui, et ce qui demande votre attention'], ['equipe', 'Équipe & services', pilotage() ? 'Coût de l’équipe, à l’année et au mois' : 'Coût humain, planning et rentabilité des services'], ['budget', 'Budget de ventes', 'Objectifs datés, comparés à vos ventes réelles'], ['conso', 'Consommation', 'Limites par produit, kg et euros, bar et cuisine', 'PRO']] },
      { t: 'Données', l: [['caisse', 'Connexion de la caisse', 'Bientôt : vos ventes arriveront seules, sans saisie'], ['importer', 'Importer mes chiffres', 'Document comptable, saisie ou mise à jour']] },
      /* C210 (V35) : en démonstration, ce bouton ouvre le choix des modèles fictifs (openEtabs → openModeles) : le dire. */
      { t: 'Établissement & compte', l: [['etabs', 'Établissements', modeleDemo() ? 'Démonstration : changer de modèle d’établissement' : 'Ajouter, renommer ou changer d’établissement']] }
    ];
    if (demo() || portail) g[2].l.push(['acces', 'Accès du personnel', 'Inventaire pour votre équipe, droits choisis par vous']);
    g[2].l.push(['compte', 'Compte et abonnement', 'Accès, essai et facturation']);
    if (w.I18N_ENABLED !== false && typeof w.langModal === 'function') g[2].l.push(['langue', 'Langue', 'Changer la langue de l’application']);
    /* C312 (V16-071) : hors de la coque, la barre des modules n'existe pas : Plus les propose (le module ouvert n'est pas répété). */
    var seul = false, prof = 'pilotage';
    try { seul = w.top === w && !(w.VerdictUnified && w.VerdictUnified.embedded); var MP = w.VerdictModuleProfilesV45; if (MP && MP.getProfile) prof = MP.getProfile(); } catch (e) {}
    if (seul) g.unshift({ t: 'Modules', l: [prof === 'carte' ? ['pilotage', 'Pilotage', 'Accueil, Structure, Simuler et Audit'] : ['carte', 'Carte', 'Plats, recettes, prix et marges'], ['inventaire', 'Inventaire', 'Stock, comptages et commandes']] });
    return g;
  }
  function rendre() {
    var v = doc.getElementById('v-plus'); if (!v) return;
    var box = doc.getElementById('vd-plus');
    if (!box) { box = doc.createElement('section'); box.id = 'vd-plus'; v.insertBefore(box, v.firstChild); }
    box.innerHTML =
      '<header class="vp-head"><span class="vp-kicker">Verdict</span><h1>Plus</h1><p>Réglages, données et outils de votre établissement.</p></header>' +
      '<form class="vp-search" role="search" onsubmit="var s=this.querySelector(&quot;#plusSearchQ21&quot;),d=document.getElementById(&quot;plusSearchQ&quot;);if(!d){d=document.createElement(&quot;input&quot;);d.type=&quot;hidden&quot;;d.id=&quot;plusSearchQ&quot;;this.appendChild(d);}d.value=s?s.value:&quot;&quot;;return plusSearchSubmit(event)">' + svg('chercher', 'vp-search-ic') +
      '<input id="plusSearchQ21" type="search" autocomplete="off" enterkeyhint="search" placeholder="Demander à Vera…" aria-label="Demander à Vera"><button type="submit">Trouver</button></form>' +
      groupes().map(function (gr) {
        return '<div class="vp-group"><h2>' + esc(gr.t) + '</h2><div class="vp-list">' + gr.l.map(function (r) {
          return '<button type="button" class="vp-row" data-vp="' + r[0] + '"><span class="vp-tile">' + svg(r[0]) + '</span><span class="vp-txt"><b>' + esc(r[1]) + (r[3] ? ' <span class="vp-badge">' + esc(r[3]) + '</span>' : '') + '</b><small>' + esc(r[2]) + '</small></span><span class="vp-chev" aria-hidden="true">›</span></button>';
        }).join('') + '</div></div>';
      }).join('');
    [].forEach.call(box.querySelectorAll('[data-vp]'), function (b) { b.onclick = function () { var f = ACTIONS[b.getAttribute('data-vp')]; if (f) try { f(); } catch (e) {} }; });
  }
  var css = doc.createElement('style'); css.id = 'vd-plus-css';
  css.textContent =
    /* C302 (V15-057) : le guide de la démonstration (#demoInline, étape 30/30 « Donner accès uniquement à Inventaire ») reste visible sur Plus. */
    '#v-plus>*:not(#vd-plus):not(#demoInline),html body section#v-plus>div#menuGrid,html body section#v-plus>#menuGrid.menugrid.v45-plus-pilotage{display:none!important}' +
    '#vd-plus{--vp-bg:transparent;--vp-card:#ffffff;--vp-line:#e7ebf0;--vp-txt:#0f172a;--vp-sub:#64748b;--vp-tile:#eef6f1;--vp-ic:#15803d;--vp-input:#f4f6f9;--vp-shadow:0 1px 2px rgba(15,23,42,.06),0 8px 24px rgba(15,23,42,.06);max-width:720px;margin:0 auto;padding:6px 2px 120px;color:var(--vp-txt)}' +
    'html.vd-workspace-dark #vd-plus{--vp-card:#11161d;--vp-line:#222b36;--vp-txt:#f1f5f9;--vp-sub:#94a3b8;--vp-tile:#14251c;--vp-ic:#4ade80;--vp-input:#0b0f14;--vp-shadow:0 1px 0 rgba(255,255,255,.03),0 10px 30px rgba(0,0,0,.45)}' +
    '#vd-plus .vp-head{padding:8px 4px 18px}#vd-plus .vp-kicker{font:700 12px/1 -apple-system,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--vp-ic)}' +
    '#vd-plus .vp-head h1{margin:8px 0 6px;font:800 34px/1.05 -apple-system,system-ui,sans-serif;letter-spacing:-.02em;color:var(--vp-txt)}#vd-plus .vp-head p{margin:0;color:var(--vp-sub);font-size:15px;line-height:1.4}' +
    '#vd-plus .vp-search{display:flex;align-items:center;gap:10px;margin:0 0 26px;padding:6px 6px 6px 14px;border-radius:16px;background:var(--vp-card);border:1px solid var(--vp-line);box-shadow:var(--vp-shadow)}' +
    '#vd-plus .vp-search-ic{width:20px;height:20px;flex:0 0 20px;color:var(--vp-sub)}' +
    '#vd-plus .vp-search input{flex:1;min-width:0;height:44px;border:0!important;background:transparent!important;color:var(--vp-txt)!important;font:500 16px -apple-system,system-ui,sans-serif;outline:none;box-shadow:none!important;padding:0!important}' +
    '#vd-plus .vp-search input::placeholder{color:var(--vp-sub);opacity:1}' +
    '#vd-plus .vp-search button{height:44px;padding:0 16px;border:0;border-radius:12px;background:#16a34a;color:#fff;font:700 15px -apple-system,system-ui,sans-serif;cursor:pointer}' +
    '#vd-plus .vp-group{margin:0 0 22px}#vd-plus .vp-group h2{margin:0 6px 8px;font:700 12px/1 -apple-system,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--vp-sub)}' +
    '#vd-plus .vp-list{border-radius:18px;background:var(--vp-card);border:1px solid var(--vp-line);box-shadow:var(--vp-shadow);overflow:hidden}' +
    '#vd-plus .vp-row{display:flex;align-items:center;gap:14px;width:100%;min-height:68px;padding:12px 14px;border:0;background:transparent;color:var(--vp-txt);text-align:left;cursor:pointer;font:inherit}' +
    '#vd-plus .vp-row+.vp-row{border-top:1px solid var(--vp-line)}#vd-plus .vp-row:active,#vd-plus .vp-row:hover{background:rgba(22,163,74,.06)}' +
    '#vd-plus .vp-tile{display:flex;align-items:center;justify-content:center;width:42px;height:42px;flex:0 0 42px;border-radius:12px;background:var(--vp-tile);color:var(--vp-ic)}#vd-plus .vp-ic{width:22px;height:22px}' +
    '#vd-plus .vp-txt{flex:1;min-width:0}#vd-plus .vp-txt b{display:block;font:700 16px/1.25 -apple-system,system-ui,sans-serif;color:var(--vp-txt)}#vd-plus .vp-txt small{display:block;margin-top:3px;font:400 13.5px/1.35 -apple-system,system-ui,sans-serif;color:var(--vp-sub)}' +
    '#vd-plus .vp-badge{display:inline-block;margin-left:6px;padding:2px 7px;border-radius:999px;background:linear-gradient(135deg,#b45309,#92400e);color:#fff;font:800 10.5px/1.3 -apple-system,system-ui,sans-serif;letter-spacing:.06em;vertical-align:2px}' +
    '#vd-plus .vp-chev{font:400 26px/1 -apple-system,system-ui,sans-serif;color:var(--vp-sub);opacity:.7}' +
    '@media (min-width:900px){#vd-plus{padding-top:18px}#vd-plus .vp-head h1{font-size:40px}}' +
    /* C312 (V16-079) : « .vp-head » est aussi une classe de Performances (rangée flexible) : « VERDICT », « Plus » et la phrase
       se plaçaient côte à côte, le titre décalé. L'en-tête de Plus reste un bloc. */
    '#vd-plus .vp-head{display:block!important;margin-bottom:0!important}';
  (doc.head || doc.documentElement).appendChild(css);
  /* L'écran Plus est reconstruit à chaque affichage (langue, démonstration, établissement). */
  if (typeof w.mainNavView === 'function') { var nav0 = w.mainNavView; w.mainNavView = function (v) { if (v === 'plus') setTimeout(rendre, 0); return nav0.apply(this, arguments); }; }
  rendre();
})();
