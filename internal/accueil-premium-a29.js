/* C100 — Accueil et démonstration premium (Steven, 16/10) : « la logique : module foncé si fond clair ; là c'est
   flagrant, blanc sur blanc pour des demandes d'information, pas premium ».
   - L'écran de bienvenue (« Comment souhaitez-vous commencer ? », #refSh) et l'invitation de la démonstration
     (« La Brasserie Collet, du constat à l'action », #mDemoIntent) deviennent des panneaux foncés premium, posés sur
     le fond clair de la page (ou sombre, en mode sombre) : contraste net, cartes de choix lisibles, une couleur
     d'accent par porte, flèche d'action, appui qui répond.
   - Ces deux écrans ne sont plus repeints par le thème clair (workspace-theme.js) : leurs couleurs sont fixées ici.
   Aucune fonction n'est réécrite : seuls les styles changent. */
(function () {
  'use strict';
  var doc = document; if (doc.getElementById('accueil-premium-a29')) return;
  var E = 'cubic-bezier(.23,1,.32,1)';
  var PANNEAU = 'radial-gradient(120% 70% at 100% 0%,rgba(34,197,94,.16),transparent 55%),radial-gradient(90% 60% at 0% 100%,rgba(96,165,250,.10),transparent 60%),linear-gradient(180deg,#0f1622,#0a0f17)';
  var VARS = '--txt:#f1f5f9;--mut:#a3b1c2;--mut2:#7d8b9d;--line:rgba(148,163,184,.18);--card:#141c28;--card2:#182233;--card3:#1d2838;color:#f1f5f9';
  var css = doc.createElement('style'); css.id = 'accueil-premium-a29';
  css.textContent =
    /* ── Bienvenue ── */
    'html body #refSh.on>.p{' + VARS + ';background:' + PANNEAU + '!important;border:1px solid rgba(148,163,184,.16)!important;border-radius:28px!important;box-shadow:0 30px 80px rgba(2,8,23,.38),0 2px 8px rgba(2,8,23,.22)!important;padding:22px 20px 20px!important}' +
    'html body #refSh .grab{background:rgba(148,163,184,.35)!important}' +
    'html body #refSh h3{margin:16px 2px 6px!important;font:900 clamp(24px,6vw,30px)/1.1 -apple-system,BlinkMacSystemFont,system-ui,sans-serif!important;letter-spacing:-.025em;color:#ffffff!important}' +
    'html body #refSh .p>.note{color:#a3b1c2!important;font-size:15px!important;margin:0 2px 14px!important}' +
    'html body #refSh #refP .vera-ref-intro{background:linear-gradient(135deg,rgba(34,197,94,.16),rgba(34,197,94,.04))!important;border:1px solid rgba(34,197,94,.30)!important;border-radius:20px!important;box-shadow:none!important;color:#e2e8f0!important}' +
    'html body #refSh #refP .vera-ref-intro *{color:#cbd5e1!important}html body #refSh #refP .vera-ref-intro b,html body #refSh #refP .vera-ref-intro strong,html body #refSh #refP .vera-ref-intro h4{color:#ffffff!important}' +
    'html body #refSh .p .ch{position:relative;display:block;width:100%;margin:10px 0 0!important;padding:16px 46px 16px 18px!important;border-radius:18px!important;border:1px solid rgba(148,163,184,.18)!important;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025))!important;color:#ffffff!important;font:750 16.5px/1.3 -apple-system,BlinkMacSystemFont,system-ui,sans-serif!important;text-align:left;box-shadow:inset 3px 0 0 var(--ac,#22c55e),0 1px 0 rgba(255,255,255,.04)!important;cursor:pointer;transition:transform .25s ' + E + ',border-color .25s,background .25s,box-shadow .25s;-webkit-tap-highlight-color:transparent}' +
    'html body #refSh .p .ch:after{content:"\\2192";position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:19px;color:#64748b;transition:transform .25s ' + E + ',color .25s}' +
    'html body #refSh .p .ch span{display:block;margin-top:5px!important;font:400 14px/1.45 -apple-system,BlinkMacSystemFont,system-ui,sans-serif!important;color:#a3b1c2!important}' +
    'html body #refSh .p .ch[data-entry-door="fec"]{--ac:#60a5fa}html body #refSh .p .ch[data-entry-door="closed"]{--ac:#22c55e}html body #refSh .p .ch[data-entry-door="recent"]{--ac:#34d399}html body #refSh .p .ch[data-entry-door="creation"]{--ac:#f59e0b}html body #refSh .p .ch[data-entry-door="demo"]{--ac:#a78bfa}' +
    'html body #refSh .p .ch:active{transform:scale(.985);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04))!important}' +
    'html body #refSh .p .ch:focus-visible{outline:2px solid #4ade80;outline-offset:2px}' +
    '@media (hover:hover) and (pointer:fine){html body #refSh .p .ch:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--ac,#22c55e) 55%,transparent)!important;background:linear-gradient(180deg,color-mix(in srgb,var(--ac,#22c55e) 12%,transparent),rgba(255,255,255,.03))!important}html body #refSh .p .ch:hover:after{transform:translate(4px,-50%);color:var(--ac,#22c55e)}}' +
    'html body #refSh .p .btn.ghost{color:#cbd5e1!important;border-color:rgba(148,163,184,.3)!important;background:transparent!important}' +
    'html.vd-workspace-dark body #refSh.on>.p{border-color:rgba(148,163,184,.24)!important;box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 0 1px rgba(34,197,94,.10)!important}' +
    /* ── Invitation de la démonstration ── */
    'html body #mDemoIntent{background:rgba(238,241,244,.78)!important}html.vd-workspace-dark body #mDemoIntent{background:rgba(2,6,12,.78)!important}' +
    'html body #mDemoIntent .tv-sheet{' + VARS + ';background:' + PANNEAU + '!important;border:1px solid rgba(148,163,184,.16)!important;border-radius:28px!important;box-shadow:0 34px 90px rgba(2,8,23,.40),0 2px 8px rgba(2,8,23,.22)!important}' +
    'html body #mDemoIntent .tv-scroll{background:transparent!important}' +
    'html body #mDemoIntent .tv-kicker{color:#4ade80!important;font:800 12px/1.2 -apple-system,system-ui!important;letter-spacing:.16em!important;text-transform:uppercase}' +
    'html body #mDemoIntent h2{color:#ffffff!important;font:900 clamp(26px,5vw,38px)/1.08 -apple-system,BlinkMacSystemFont,system-ui,sans-serif!important;letter-spacing:-.03em!important}' +
    'html body #mDemoIntent .tv-lead{color:#a3b1c2!important;font-size:16px!important;line-height:1.55!important}' +
    'html body #mDemoIntent .tv-close{background:rgba(255,255,255,.08)!important;color:#ffffff!important;border:1px solid rgba(148,163,184,.22)!important;border-radius:14px!important}' +
    'html body #mDemoIntent .demo-film-plan span{background:rgba(255,255,255,.05)!important;border:1px solid rgba(148,163,184,.16)!important;border-radius:16px!important;color:#ffffff!important}' +
    'html body #mDemoIntent .demo-film-plan span b{color:#ffffff!important}html body #mDemoIntent .demo-film-plan span small{color:#94a3b8!important}' +
    'html body #mDemoIntent .demo-film-plan span:nth-child(1) b{color:#4ade80!important}html body #mDemoIntent .demo-film-plan span:nth-child(2) b{color:#fbbf24!important}html body #mDemoIntent .demo-film-plan span:nth-child(3) b{color:#60a5fa!important}html body #mDemoIntent .demo-film-plan span:nth-child(4) b{color:#c4b5fd!important}' +
    'html body #mDemoIntent .di-links button{border-radius:18px!important;min-height:62px;transition:transform .25s ' + E + ',filter .25s,background .25s;-webkit-tap-highlight-color:transparent}' +
    'html body #mDemoIntent .di-links button.primary{background:linear-gradient(180deg,#22c55e,#16a34a)!important;border:0!important;color:#ffffff!important;box-shadow:0 14px 34px rgba(22,163,74,.40)!important}' +
    'html body #mDemoIntent .di-links button.primary b{color:#ffffff!important}html body #mDemoIntent .di-links button.primary span{color:rgba(255,255,255,.86)!important}' +
    'html body #mDemoIntent .di-links button:not(.primary){background:rgba(255,255,255,.06)!important;border:1px solid rgba(148,163,184,.22)!important;color:#ffffff!important}' +
    'html body #mDemoIntent .di-links button:not(.primary) b{color:#ffffff!important}html body #mDemoIntent .di-links button:not(.primary) span{color:#a3b1c2!important}' +
    'html body #mDemoIntent .di-links button:active{transform:scale(.985)}' +
    '@media (hover:hover) and (pointer:fine){html body #mDemoIntent .di-links button.primary:hover{filter:brightness(1.07)}html body #mDemoIntent .di-links button:not(.primary):hover{background:rgba(255,255,255,.10)!important}}' +
    '@media (prefers-reduced-motion:reduce){html body #refSh .p .ch,html body #mDemoIntent .di-links button{transition:none!important}}';
  (doc.head || doc.documentElement).appendChild(css);
})();
