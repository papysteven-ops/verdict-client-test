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
    equipe: '<path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"/><circle cx="9" cy="7" r="3.5"/><path d="M22 19v-1a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    budget: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="m9 15 2 2 4-4"/>',
    caisse: '<path d="M7 7h13l-3-3"/><path d="M17 17H4l3 3"/>',
    importer: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    etabs: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>',
    acces: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    compte: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    langue: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    chercher: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'
  };
  function svg(k, cls) { return '<svg class="' + (cls || 'vp-ic') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONES[k] + '</svg>'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function demo() { try { return typeof w.getMode === 'function' && w.getMode() === 'demo'; } catch (e) { return false; } }
  var portail = typeof w.VERDICT_TEAM_PORTAL_URL === 'string' && !!w.VERDICT_TEAM_PORTAL_URL;
  var ACTIONS = {
    equipe: function () { w.go('planning'); },
    budget: function () { w.go('obj'); },
    caisse: function () { if (w.VerdictFluxV451 && w.VerdictFluxV451.openConnection) w.VerdictFluxV451.openConnection(); else w.go('in'); },
    importer: function () { w.go('in'); },
    etabs: function () { w.openEtabs(); },
    acces: function () { if (demo() && typeof w.demoInventoryAccessPreview === 'function') w.demoInventoryAccessPreview(); else if (typeof w.plusInventoryAccessManage === 'function') w.plusInventoryAccessManage(); },
    compte: function () { w.go('abo'); },
    langue: function () { if (typeof w.langModal === 'function') w.langModal(); }
  };
  function groupes() {
    var g = [
      { t: 'Piloter', l: [['equipe', 'Équipe & services', 'Coût humain, planning et rentabilité des services'], ['budget', 'Budget de ventes', 'Objectifs datés, comparés à vos ventes réelles']] },
      { t: 'Données', l: [['caisse', 'Connexion de la caisse', 'Vos ventes arrivent seules, sans saisie'], ['importer', 'Importer mes chiffres', 'Document comptable, saisie ou mise à jour']] },
      { t: 'Établissement & compte', l: [['etabs', 'Établissements', 'Ajouter, renommer ou changer d’établissement']] }
    ];
    if (demo() || portail) g[2].l.push(['acces', 'Accès du personnel', 'Inventaire pour votre équipe, droits choisis par vous']);
    g[2].l.push(['compte', 'Compte et abonnement', 'Accès, essai et facturation']);
    if (w.I18N_ENABLED !== false && typeof w.langModal === 'function') g[2].l.push(['langue', 'Langue', 'Changer la langue de l’application']);
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
          return '<button type="button" class="vp-row" data-vp="' + r[0] + '"><span class="vp-tile">' + svg(r[0]) + '</span><span class="vp-txt"><b>' + esc(r[1]) + '</b><small>' + esc(r[2]) + '</small></span><span class="vp-chev" aria-hidden="true">›</span></button>';
        }).join('') + '</div></div>';
      }).join('');
    [].forEach.call(box.querySelectorAll('[data-vp]'), function (b) { b.onclick = function () { var f = ACTIONS[b.getAttribute('data-vp')]; if (f) try { f(); } catch (e) {} }; });
  }
  var css = doc.createElement('style'); css.id = 'vd-plus-css';
  css.textContent =
    '#v-plus>*:not(#vd-plus),html body section#v-plus>div#menuGrid,html body section#v-plus>#menuGrid.menugrid.v45-plus-pilotage{display:none!important}' +
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
    '#vd-plus .vp-chev{font:400 26px/1 -apple-system,system-ui,sans-serif;color:var(--vp-sub);opacity:.7}' +
    '@media (min-width:900px){#vd-plus{padding-top:18px}#vd-plus .vp-head h1{font-size:40px}}';
  (doc.head || doc.documentElement).appendChild(css);
  /* L'écran Plus est reconstruit à chaque affichage (langue, démonstration, établissement). */
  if (typeof w.mainNavView === 'function') { var nav0 = w.mainNavView; w.mainNavView = function (v) { if (v === 'plus') setTimeout(rendre, 0); return nav0.apply(this, arguments); }; }
  rendre();
})();
