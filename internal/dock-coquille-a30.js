/* C102 — La barre du bas vit dans la coquille, hors de la page qui défile (Steven : « module du bas, je dois cliquer
   deux fois… mon iPhone est fluide, donc le problème c'est l'appli »).
   Cause mesurée (simulateur iOS, code source de WebKit) : sur iPhone, un toucher posé pendant l'élan d'un défilement
   sert uniquement à arrêter ce défilement ; la page ne reçoit AUCUN événement. Or la barre était dessinée à l'intérieur
   du document qui défile (le cadre Pilotage/Carte ou Inventaire) : après un défilement, le premier toucher était avalé,
   il fallait le second. Les applis natives n'ont pas ce défaut parce que leur barre d'onglets est en dehors de la vue
   qui défile. C'est ce que fait ce fichier : la barre est reconstruite ici, dans la coquille, posée par-dessus le bas du
   cadre ; chaque appui s'allume immédiatement, puis commande le vrai bouton du cadre (toutes les fonctions d'origine
   restent les mêmes). La barre d'origine du cadre devient invisible mais garde sa place et son rôle de repère.
   - Même apparence (capsule blanche en clair, sombre en sombre, icônes et libellés copiés du cadre).
   - C134 (Steven, 17/10 : « sur iPhone, le module du bas ne bouge plus du tout quand je défile, il diminuait avant ») :
     la capsule suit de nouveau le repli de la barre du cadre : en descendant, elle rétrécit au centre (icônes seules) ;
     en remontant, elle se redéploie. Elle reste dans la coquille : un seul appui suffit toujours, repliée ou non.
   - Elle disparaît quand le cadre cache sa barre (grand écran : navigation en haut ; écran plein : lecteur, feuilles),
     pendant le verrou et pendant l'ouverture. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdDockCoquille) return; w.__vdDockCoquille = true;
  var E = 'cubic-bezier(.22,1,.36,1)';
  var css = doc.createElement('style'); css.id = 'dock-coquille-a30';
  css.textContent =
    '#vdDock{position:fixed;left:0;right:0;z-index:60;display:none;box-sizing:border-box;margin:0 auto;padding:6px;gap:2px;' +
      'border:1px solid rgba(15,23,42,.12);border-radius:999px;background:#ffffff;color:#405266;box-shadow:0 10px 30px rgba(15,23,42,.18);' +
      'font:700 11.5px/1.15 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;-webkit-user-select:none;user-select:none;touch-action:manipulation;opacity:0;transform:translateY(8px);transition:opacity .22s ease,transform .28s ' + E + ',width .3s ' + E + ',left .3s ' + E + ',height .3s ' + E + ',padding .3s ' + E + '}' +
    '#vdDock>button>:not(.ic):not(svg):not(.bdg){display:block;max-width:100%;max-height:16px;opacity:1;overflow:hidden;text-overflow:ellipsis;transition:max-height .3s ' + E + ',opacity .2s ease}' +
    'html.vd-dock-replie #vdDock{padding:5px}html.vd-dock-replie #vdDock>button{min-height:44px;gap:0}html.vd-dock-replie #vdDock>button>:not(.ic):not(svg):not(.bdg){max-height:0;opacity:0}' +
    'html.vd-dock-on #vdDock{display:flex;opacity:1;transform:none}' +
    'html.vd-workspace-dark #vdDock{background:#141b22;border-color:#2b3644;color:#e5e7eb;box-shadow:0 10px 30px rgba(0,0,0,.55)}' +
    '#vdDock>button{position:relative;flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:56px;padding:4px 2px 5px;border:0;border-radius:999px;background:transparent;color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#vdDock>button svg.ic{width:24px;height:24px;flex:0 0 24px;stroke:currentColor}#vdDock>button span.ic{font-size:20px;line-height:1}' +
    '#vdDock>button #bdg,#vdDock>button .bdg{position:absolute;top:6px;right:18%;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#ef4444;color:#fff;font-size:10px;line-height:16px;text-align:center}' +
    '#vdDock>button #bdg:empty,#vdDock>button .bdg:empty{display:none}' +
    '#vdDock>button.on{background:#eaf2ed;color:#126233}html.vd-workspace-dark #vdDock>button.on{background:rgba(255,255,255,.09);color:#22c55e}' +
    '#vdDock>button.appui{transform:scale(.94);background:rgba(22,163,74,.14)}#vdDock>button{transition:transform .14s ' + E + ',background .14s ease,color .14s ease}' +
    '#vdDock>button:focus-visible{outline:2px solid #22c55e;outline-offset:-2px}' +
    'body.shell-startup-locked #vdDock,body:has(#vr16:not([hidden])) #vdDock,body:has(#vr16-cache:not([hidden])) #vdDock{display:none!important}' +
    '@media (prefers-reduced-motion:reduce){#vdDock,#vdDock>button{transition:none!important}}';
  (doc.head || doc.documentElement).appendChild(css);

  var dock = null, cadre = null, cdoc = null, cnav = null, boutons = {}, obsNav = null, obsHtml = null, obsPanneaux = null, interval = 0, dernierGabarit = '', gel = 0;

  function trouverCadre() { var p = doc.querySelector('.module-panel.active iframe'); return p || doc.getElementById('frame-verdict'); }
  function trouverNav(d) { return d.querySelector('body>nav[aria-label="Navigation principale"]') || d.querySelector('nav[aria-label="Navigation principale"]') || d.querySelector('body>nav') || null; }
  function pret(d) { return !!(d && d.body && typeof d.defaultView.go === 'function'); }

  /* Dans le cadre : sa barre devient invisible (mais reste là, à sa place, pour la mise en page et la détection) et ne se
     replie plus. */
  function habillerCadre() {
    if (!cdoc || !cnav) return;
    cnav.setAttribute('data-vd-coquille', '1');
    cdoc.documentElement.classList.add('vd-dock-coquille');
    if (!cdoc.getElementById('vd-dock-coquille')) {
      var s = cdoc.createElement('style'); s.id = 'vd-dock-coquille';
      /* C342 (Steven, iPhone : « deux barres l'une sur l'autre, pas net ») : à l'état replié, la règle de dock-a19
         (html.premium-fixed-dock.premium-dock-hidden … nav { opacity:1 !important }) avait la même force que celle-ci et, déclarée
         plus loin, l'emportait : la barre d'origine du cadre réapparaissait derrière celle de la coque (fond, ombre, flou, « ‹ »).
         Le sélecteur est renforcé ; fond, ombre et flou sont aussi coupés (rien à peindre pour une barre qui ne se voit pas). */
      var B = 'html.vd-dock-coquille.vd-dock-coquille.vd-dock-coquille body nav[data-vd-coquille][data-vd-coquille][data-vd-coquille]';
      s.textContent = B + '{opacity:0!important;pointer-events:auto!important;transform:none!important;transition:none!important;animation:none!important;background:transparent!important;box-shadow:none!important;border-color:transparent!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
        B + '>*,' + B + '::before,' + B + '::after{opacity:0!important}';
      (cdoc.head || cdoc.documentElement).appendChild(s);
    }
  }
  function deshabillerCadre(d, n) {
    try { if (n) n.removeAttribute('data-vd-coquille'); if (d) { d.documentElement.classList.remove('vd-dock-coquille'); var s = d.getElementById('vd-dock-coquille'); if (s) s.remove(); } } catch (e) {}
  }

  function construireDock() {
    if (dock) return dock;
    dock = doc.createElement('nav'); dock.id = 'vdDock'; dock.setAttribute('aria-label', 'Navigation principale');
    dock.addEventListener('pointerdown', function () { gel = Date.now() + 100000; }, { passive: true });
    ['pointerup', 'pointercancel'].forEach(function (n) { dock.addEventListener(n, function () { gel = Date.now() + 350; }, { passive: true }); });
    dock.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('button[data-v]') : null; if (!b) return;
      var v = b.getAttribute('data-v');
      /* 0. l'élan d'un défilement en cours s'arrête ici (le temps d'une image, la page du cadre ne peut plus défiler :
            iOS coupe l'inertie) : la nouvelle vue s'ouvre en haut, pas déjà descendue */
      var gelDefil = null;
      try { var cw = cadre && cadre.contentWindow, de = cw && cw.document.documentElement, bo = cw && cw.document.body;
        if (de && bo) { de.style.setProperty('overflow', 'hidden', 'important'); bo.style.setProperty('overflow', 'hidden', 'important'); gelDefil = function () { de.style.removeProperty('overflow'); bo.style.removeProperty('overflow'); }; } } catch (err) {}
      /* 1. retour immédiat : le bouton s'allume dans l'image en cours */
      [].forEach.call(dock.children, function (x) { x.classList.toggle('on', x === b); if (x === b) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); });
      b.classList.add('appui'); setTimeout(function () { b.classList.remove('appui'); }, 180);
      /* 2. le vrai bouton du cadre est commandé après la peinture (et après quelques images sans défilement
            possible, le temps qu'iOS lâche l'inertie : la vue s'ouvre alors bien en haut) */
      requestAnimationFrame(function () { setTimeout(function () {
        if (gelDefil) { try { gelDefil(); } catch (err) {} gelDefil = null; }
        var fb = boutons[v], avant = cw ? (cw.scrollY || 0) : 0;
        try { if (fb && fb.isConnected) fb.click(); else if (cadre && cadre.contentWindow && typeof cadre.contentWindow.go === 'function') cadre.contentWindow.go(v); } catch (err) {}
        /* 3. si la page défilait encore sur son élan, l'appli n'arrive pas à la remettre en haut (iOS garde la main
              sur l'inertie quelques instants) : on tient le haut jusqu'à l'arrêt, sauf si la personne touche l'écran */
        /* C371 b : on tient la position que l'appli vient de choisir (l'Inventaire cale la vue sous son en-tête, à 337 px) et non 0 :
           le maintien à 0 annulait ce calage et la vue Commande sautait d'≈ 300 pt, sous le doigt, juste après l'ouverture. */
        if (cw && avant > 0) { var cible = 0; try { cible = cw.scrollY || 0; } catch (err) {} tenirHaut(cw, cible); }
        setTimeout(verifier, 120); setTimeout(verifier, 700);
      }, gelDefil ? 70 : 0); });
    });
    doc.body.appendChild(dock);
    return dock;
  }

  function tenirHaut(cw, cible) {
    cible = cible || 0;
    var t0 = Date.now(), stable = 0, fini = false, d = cw.document;
    function lacher() { fini = true; try { d.removeEventListener('touchstart', lacher, true); d.removeEventListener('wheel', lacher, true); } catch (e) {} }
    try { d.addEventListener('touchstart', lacher, { capture: true, passive: true }); d.addEventListener('wheel', lacher, { capture: true, passive: true }); } catch (e) {}
    (function tick() {
      if (fini) return;
      var y = 0; try { y = cw.scrollY || (d.scrollingElement && d.scrollingElement.scrollTop) || 0; } catch (e) { return lacher(); }
      if (Math.abs(y - cible) > 2) { stable = 0; try { cw.scrollTo(0, cible); } catch (e) {} } else stable++;
      if (stable >= 12 || Date.now() - t0 > 3000) return lacher();
      cw.requestAnimationFrame(tick);
    })();
  }
  function gabarit() {
    if (!cnav) return '';
    return [].map.call(cnav.querySelectorAll(':scope>button[data-v]'), function (b) {
      var vis = b.offsetParent !== null || cdoc.defaultView.getComputedStyle(b).display !== 'none';
      return b.getAttribute('data-v') + ':' + (vis ? 1 : 0) + ':' + String(b.textContent || '').trim();
    }).join('|');
  }
  function reconstruire() {
    construireDock(); boutons = {};
    var g = gabarit(); dernierGabarit = g;
    var frag = doc.createDocumentFragment();
    [].forEach.call(cnav.querySelectorAll(':scope>button[data-v]'), function (b) {
      var cs = cdoc.defaultView.getComputedStyle(b); if (cs.display === 'none' || b.hidden) return;
      var v = b.getAttribute('data-v'); boutons[v] = b;
      var nb = doc.createElement('button'); nb.type = 'button'; nb.setAttribute('data-v', v);
      [].forEach.call(b.childNodes, function (n) {
        if (n.nodeType === 1) { var c = doc.importNode(n, true); if (c.id === 'bdg') { c.removeAttribute('id'); c.className = 'bdg'; } nb.appendChild(c); }
        else if (n.nodeType === 3 && String(n.nodeValue).trim()) { var lb = doc.createElement('span'); lb.className = 'lib'; lb.textContent = String(n.nodeValue).trim(); nb.appendChild(lb); }
      });
      var lib = String(b.getAttribute('aria-label') || b.textContent || '').trim(); if (lib) nb.setAttribute('aria-label', lib);
      if (b.classList.contains('on') || b.getAttribute('aria-current') === 'page') { nb.classList.add('on'); nb.setAttribute('aria-current', 'page'); }
      frag.appendChild(nb);
    });
    dock.innerHTML = ''; dock.appendChild(frag);
  }
  function synchroniserEtat() {
    if (!dock || !cnav) return;
    if (gabarit() !== dernierGabarit) { reconstruire(); return; }
    [].forEach.call(dock.children, function (x) {
      var fb = boutons[x.getAttribute('data-v')], on = !!(fb && (fb.classList.contains('on') || fb.getAttribute('aria-current') === 'page'));
      /* C333 : rien n'est réécrit si l'état est le même (avant : aria-current reposé à chaque passe, un changement du DOM toutes les 400 ms) */
      if (x.classList.contains('on') !== on) x.classList.toggle('on', on); if (on) { if (x.getAttribute('aria-current') !== 'page') x.setAttribute('aria-current', 'page'); } else if (x.hasAttribute('aria-current')) x.removeAttribute('aria-current');
      /* badge de l'Inventaire */
      var fbdg = fb && fb.querySelector('#bdg'), bdg = x.querySelector('.bdg'); if (fbdg && bdg && bdg.textContent !== fbdg.textContent) bdg.textContent = fbdg.textContent;
    });
  }

  /* Géométrie : la capsule de la coquille se pose exactement sur la barre du cadre. */
  var geom = '', G = null, replie = false;
  /* C134 : repliée = capsule centrée sur la barre déployée, largeur réduite, même bas. */
  function poser() {
    if (!dock || !G) return;
    var lg = replie ? Math.min(G.w, Math.max(200, Math.min(240, w.innerWidth - 28))) : G.w, h = replie ? 56 : G.h;
    dock.style.left = (G.x + (G.w - lg) / 2) + 'px'; dock.style.right = 'auto'; dock.style.width = lg + 'px'; dock.style.height = h + 'px'; dock.style.bottom = G.b + 'px';
  }
  function placer() {
    if (!dock || !cnav || !cadre) return false;
    /* Barre du cadre repliée (après un défilement) : sa capsule rétrécit ; on garde la géométrie de la barre déployée. */
    if (cdoc.documentElement.classList.contains('premium-dock-hidden')) return !!geom;
    var r = cnav.getBoundingClientRect(), f = cadre.getBoundingClientRect();
    if (r.width < 120 || r.height < 30) return false;
    var hv = cdoc.defaultView.innerHeight || cadre.clientHeight;
    var bas = Math.max(0, Math.round((hv - r.bottom) + (w.innerHeight - f.bottom)));
    var g = [Math.round(f.left + r.left), Math.round(r.width), Math.round(r.height), bas].join(',');
    if (g !== geom) { geom = g; G = { x: f.left + r.left, w: r.width, h: r.height, b: bas }; poser(); }
    return true;
  }

  /* La barre de la coquille n'est montrée que si le cadre affiche une barre basse fixe, non couverte par un écran
     (lecteur, feuille, fenêtre), hors ouverture et hors verrou. */
  function cleTechnique() {
    return [].some.call(cnav.querySelectorAll(':scope>button[data-v]'), function (b) {
      if (b.hidden || cdoc.defaultView.getComputedStyle(b).display === 'none') return false;
      return /^nav\.[a-z]/.test(String(b.textContent || '').trim());
    });
  }
  function visibleDansCadre() {
    if (!cdoc || !cnav || !cnav.isConnected) return false;
    var html = cdoc.documentElement;
    if (!html.classList.contains('premium-fixed-dock')) return false;
    if (cdoc.getElementById('splash') || cdoc.getElementById('verdictIntroHandoff')) return false;
    var cs = cdoc.defaultView.getComputedStyle(cnav); if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    /* C446 (audit A12) : jamais de clé technique (« nav.dec », « nav.audit ») dans la barre de la coque : tant qu'un bouton visible du cadre
       n'est pas traduit, la barre attend (elle se reconstruit dès que le libellé change). Les boutons cachés (Audit) ne comptent pas. */
    if (/nav\.[a-z]/.test(cnav.textContent || '') && cleTechnique()) return false;
    var r = cnav.getBoundingClientRect(); if (r.width < 120 || r.height < 30 || r.bottom <= 0 || r.top >= (cdoc.defaultView.innerHeight || 0)) return false;
    if (html.classList.contains('premium-dock-hidden')) return !!geom; /* repliée : état précédent conservé */
    try {
      var el = cdoc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (el && !cnav.contains(el)) return false; /* un écran couvre la barre */
    } catch (e) {}
    return true;
  }
  /* C112 — Le cadre n'est habillé (sa barre rendue invisible) que lorsque la barre de la coquille est réellement
     affichée. Avant, l'habillage se faisait dès l'attache : sur Mac et iPad, où la barre du cadre n'est pas fixée en
     bas, la coquille n'affichait rien et la barre du cadre était invisible → « module blanc, on clique, rien ». */
  var habille = false;
  function verifier() {
    if (gel > Date.now()) { return; }
    var ok = false;
    try { ok = visibleDansCadre() && placer(); } catch (e) { ok = false; }
    if (ok) synchroniserEtat();
    var rp = !!(ok && cdoc && cdoc.documentElement.classList.contains('premium-dock-hidden'));
    if (rp !== replie) { replie = rp; doc.documentElement.classList.toggle('vd-dock-replie', rp); poser(); }
    if (ok !== habille) { habille = ok; if (ok) habillerCadre(); else deshabillerCadre(cdoc, cnav); }
    doc.documentElement.classList.toggle('vd-dock-on', ok);
  }

  function detacher() {
    if (obsNav) { try { obsNav.disconnect(); } catch (e) {} obsNav = null; }
    if (obsHtml) { try { obsHtml.disconnect(); } catch (e) {} obsHtml = null; }
    deshabillerCadre(cdoc, cnav); habille = false;
    cdoc = null; cnav = null; boutons = {}; geom = ''; G = null; dernierGabarit = ''; replie = false;
    doc.documentElement.classList.remove('vd-dock-on'); doc.documentElement.classList.remove('vd-dock-replie');
  }
  function attacher() {
    var f = trouverCadre(); var d = null; try { d = f && f.contentDocument; } catch (e) { d = null; }
    if (!f || !pret(d)) { if (f !== cadre) detacher(); cadre = f; return false; }
    var n = trouverNav(d);
    if (!n) { if (d !== cdoc) detacher(); cadre = f; return false; }
    if (d === cdoc && n === cnav) return true;
    detacher(); cadre = f; cdoc = d; cnav = n;
    reconstruire();
    try {
      /* C333 : plusieurs changements de la barre dans la même image → une seule vérification (elle relit la mise en page) */
      var vImg = 0, verifierImage = function () { if (vImg) return; var f = function () { vImg = 0; verifier(); }; vImg = w.requestAnimationFrame ? w.requestAnimationFrame(f) : setTimeout(f, 16); };
      obsNav = new MutationObserver(verifierImage); obsNav.observe(cnav, { attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-current', 'data-cp-back'], childList: true, subtree: true, characterData: true });
      obsHtml = new MutationObserver(verifierImage); obsHtml.observe(cdoc.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    } catch (e) {}
    d.defaultView.addEventListener('resize', function () { geom = ''; verifier(); }, { passive: true });
    verifier();
    return true;
  }
  function tour() {
    if (doc.hidden) return;
    attacher(); verifier();
  }
  /* Changement de cadre (Pilotage ↔ Inventaire), chargement des cadres, taille de fenêtre. */
  try { var ws = doc.getElementById('unified-workspace'); if (ws) { obsPanneaux = new MutationObserver(function () { setTimeout(tour, 0); }); obsPanneaux.observe(ws, { attributes: true, attributeFilter: ['class'], subtree: true }); } } catch (e) {}
  [].forEach.call(doc.querySelectorAll('iframe'), function (f) { f.addEventListener('load', function () { setTimeout(tour, 50); setTimeout(tour, 600); setTimeout(tour, 2000); }); });
  w.addEventListener('resize', function () { geom = ''; tour(); }, { passive: true });
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) tour(); });
  w.addEventListener('message', function (ev) { var t = ev && ev.data && ev.data.type; if (t === 'verdict-unified-intro-complete' || t === 'verdict-unified-ready' || t === 'verdict-verrou-ouvert') { setTimeout(tour, 0); setTimeout(tour, 400); } });
  /* Filet léger : une vérification toutes les 400 ms (un seul test de position, bien moins d'une milliseconde). */
  interval = setInterval(tour, 400);
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', tour, { once: true }); else tour();
  w.VerdictDockCoquille = { verifier: tour, etat: function () { return { actif: doc.documentElement.classList.contains('vd-dock-on'), boutons: Object.keys(boutons) }; } };
})();
