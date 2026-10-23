/* C144 — Garde-contraste (analyse complète du 17/10, groupe 2 : « textes trop pâles »).
   L'appli est dessinée en sombre ; le mode clair repeint les couleurs automatiquement, et selon les composants il repeint
   le fond sans le texte, ou l'inverse : blanc sur blanc (Historique, bouton « Importer / renseigner mes ventes »), gris
   foncé sur noir (cases du Chiffre d'affaires, Planning, Alertes), onglets inactifs à 1,8 pour 1.
   Après chaque affichage, chaque texte visible est mesuré face à son fond réel. S'il est sous le seuil de lisibilité
   (4,5 pour 1 ; 3 pour 1 pour les grands textes gras), sa couleur est assombrie ou éclaircie EN GARDANT SA TEINTE
   (un vert reste vert, un rouge reste rouge), juste assez pour passer le seuil. Rien d'autre n'est modifié.
   Ignorés : éléments désactivés, cachés, transparents (animations en cours), dessins SVG, champs de saisie. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdContraste) return; w.__vdContraste = true;
  function rgb(c) { var m = String(c || '').match(/[\d.]+/g); return m && m.length >= 3 ? { r: +m[0], g: +m[1], b: +m[2], a: m[3] != null ? +m[3] : 1 } : null; }
  function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function lum(c) { return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b); }
  function ratio(a, b) { var x = Math.max(a, b), y = Math.min(a, b); return (x + 0.05) / (y + 0.05); }
  function fondDe(e, win) {
    for (var p = e; p && p.nodeType === 1; p = p.parentElement) {
      var cs = win.getComputedStyle(p), c = rgb(cs.backgroundColor);
      /* C216 (W46) : un dégradé se peint PAR-DESSUS la couleur de fond, et ses couches se lisent sur leur première couleur
         opaque (pas sur la première écrite, souvent un halo transparent). Sinon l'écran Bienvenue et la carte FEC, sombres,
         étaient mesurés comme clairs en thème clair, et leurs textes assombris jusqu'au presque noir. */
      var img = cs.backgroundImage; if (img && img !== 'none' && /gradient/.test(img)) { var ms = img.match(/rgba?\([^)]*\)/g) || []; for (var gi = 0; gi < ms.length; gi++) { var g = rgb(ms[gi]); if (g && g.a > 0.55) return g; } }
      if (c && c.a > 0.55) return c;
    }
    var b = rgb(win.getComputedStyle(e.ownerDocument.body).backgroundColor); return b && b.a > 0.5 ? b : { r: 255, g: 255, b: 255, a: 1 };
  }
  function opacite(e, win) { var o = 1; for (var p = e; p && p.nodeType === 1; p = p.parentElement) o *= Number(win.getComputedStyle(p).opacity) || 0; return o; }
  /* Rapproche la couleur du noir (fond clair) ou du blanc (fond sombre) par petits pas, en gardant la teinte. */
  function corriger(t, f, seuil) {
    var lf = lum(f), versNoir = lf > 0.18, c = { r: t.r, g: t.g, b: t.b };
    for (var i = 0; i < 24 && ratio(lum(c), lf) < seuil; i++) {
      if (versNoir) { c.r *= 0.86; c.g *= 0.86; c.b *= 0.86; }
      else { c.r += (255 - c.r) * 0.16; c.g += (255 - c.g) * 0.16; c.b += (255 - c.b) * 0.16; }
    }
    return 'rgb(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ')';
  }
  var vus = new WeakSet(); /* textes déjà vérifiés pour le thème courant : pas remesurés */
  function passe(racine) {
    var d = racine.ownerDocument || racine, win = d.defaultView; if (!win) return 0;
    var n = 0, liste = racine.querySelectorAll('body *');
    for (var i = 0; i < liste.length; i++) {
      var e = liste[i]; if (vus.has(e)) continue;
      if (e.closest('svg') || /^(INPUT|TEXTAREA|SELECT|OPTION|SCRIPT|STYLE|IMG|CANVAS|VIDEO)$/.test(e.tagName)) continue;
      if (e.disabled || e.getAttribute('aria-disabled') === 'true' || e.closest('[disabled],.attente,[aria-hidden="true"]')) continue;
      var direct = false; for (var k = 0; k < e.childNodes.length; k++) { var nd = e.childNodes[k]; if (nd.nodeType === 3 && nd.nodeValue.trim()) { direct = true; break; } }
      if (!direct) continue;
      var r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
      var cs = win.getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      var t = rgb(cs.color); if (!t || t.a < 0.4) continue;
      if (opacite(e, win) < 0.6) continue; /* animation en cours ou effacement voulu */
      var f = fondDe(e, win), taille = parseFloat(cs.fontSize) || 14, gras = Number(cs.fontWeight) >= 600;
      var seuil = (taille >= 24 || (taille >= 18.6 && gras)) ? 3 : 4.5;
      vus.add(e);
      if (ratio(lum(t), lum(f)) >= seuil) continue;
      e.style.setProperty('color', corriger(t, f, seuil), 'important'); e.setAttribute('data-vx44', '1'); n++;
    }
    return n;
  }
  /* C147 (Steven, 18/10 : « pourquoi je vois des repos côte à côte, Structure, mois ») : dans les courbes de journées
     et du mois, une pastille « N j repos » est posée à chaque interruption ; deux repos proches (jours de fermeture
     rapprochés, écran étroit) se superposaient ou se répétaient (« 1 j repos » « 1 j repos »). Une seule étiquette
     reste, en haut à gauche, avec le total (« 2 j repos ») ; chaque jour de repos garde un fin repère pointillé. */
  function fusionRepos(d) {
    var NS = 'http://www.w3.org/2000/svg';
    [].forEach.call(d.querySelectorAll('svg'), function (svg) {
      var pastilles = [].slice.call(svg.querySelectorAll('g.vp-rest-mark'));
      var resume = [].filter.call(svg.querySelectorAll('text'), function (t) { return !t.closest('g.vp-rest-mark') && /^\d+ j repos$/.test((t.textContent || '').trim()); })[0];
      if (!pastilles.length || (pastilles.length < 2 && !resume)) return;
      var grilles = [].map.call(svg.querySelectorAll('line.vp-grid'), function (l) { return { x: parseFloat(l.getAttribute('x1')), y: parseFloat(l.getAttribute('y1')) }; });
      var gauche = grilles.length ? Math.min.apply(null, grilles.map(function (g) { return g.x; })) : 8;
      var bas = grilles.length ? Math.max.apply(null, grilles.map(function (g) { return g.y; })) : 120;
      var total = 0;
      pastilles.forEach(function (g) {
        var r = g.querySelector('rect'), t = g.querySelector('text'), n = parseInt(t && t.textContent, 10) || 0; total += n;
        var cx = parseFloat(t && t.getAttribute('x')); if (r && isFinite(cx)) {
          var l = d.createElementNS(NS, 'line'); l.setAttribute('x1', cx.toFixed(1)); l.setAttribute('x2', cx.toFixed(1)); l.setAttribute('y1', '26'); l.setAttribute('y2', String(bas));
          l.setAttribute('class', 'vx47-repos'); l.setAttribute('stroke', 'currentColor'); l.setAttribute('stroke-opacity', '.22'); l.setAttribute('stroke-dasharray', '2 4'); l.setAttribute('stroke-width', '1');
          var titre = d.createElementNS(NS, 'title'); titre.textContent = n + ' jour' + (n > 1 ? 's' : '') + ' de repos'; l.appendChild(titre); svg.insertBefore(l, svg.firstChild);
        }
        g.remove();
      });
      if (resume) return; /* le total est déjà écrit en haut à gauche */
      var t2 = d.createElementNS(NS, 'text'); t2.setAttribute('x', String(gauche)); t2.setAttribute('y', '18'); t2.setAttribute('text-anchor', 'start'); t2.setAttribute('class', 'vp-axis');
      t2.textContent = total + ' j repos'; svg.appendChild(t2);
    });
  }
  /* C145 — petits défauts relevés par l'analyse complète. */
  var SERVICES = { matin: 'Matin', midi: 'Midi', apres: 'Après-midi', aprem: 'Après-midi', soir: 'Soir', nuit: 'Nuit', petitdej: 'Petit-déjeuner', brunch: 'Brunch' };
  function petitsDefauts(d) {
    /* Entrées : boutons de service sans nom pour les lecteurs d'écran. */
    [].forEach.call(d.querySelectorAll('button.svc-t:not([aria-label])'), function (b) {
      var ligne = b.closest('.svc-row'), titre = ligne && ligne.querySelector('b'), id = b.getAttribute('data-id') || '';
      b.setAttribute('aria-label', (titre ? titre.textContent.trim() + ' · ' : '') + (SERVICES[id] || id || 'service'));
    });
    /* Structure : zéro négatif d'arrondi (« −0,0 % ») affiché « 0,0 % ». */
    var it = d.createTreeWalker(d.body, 4, null), n, a = [];
    while ((n = it.nextNode())) if (/[-−]0,0(\s| )?%/.test(n.nodeValue)) a.push(n);
    a.forEach(function (t) { t.nodeValue = t.nodeValue.replace(/[-−]0,0(\s| )?%/g, '0,0$1%'); });
    /* Bandeau de démonstration sur téléphone : « Recommencer la démonstration » devient « Recommencer » (nom complet gardé
       pour les lecteurs d'écran), pour que le × ait sa place. */
    if ((d.defaultView || w).innerWidth < 600) [].forEach.call(d.querySelectorAll('#modeBar button'), function (b) { if (/^Recommencer\s+la\s+démonstration$/.test((b.textContent || '').replace(/\s+/g, ' ').trim())) { /* C160 : aussi après un changement de modèle (espaces insécables) */ b.setAttribute('aria-label', 'Recommencer la démonstration'); b.textContent = 'Recommencer'; } });
    /* Aide : texte d'aide du champ trop long pour un téléphone. */
    var q = d.getElementById('aideQ'); if (q && q.getBoundingClientRect().width > 0 && q.getBoundingClientRect().width < 300 && q.placeholder.length > 22) q.placeholder = 'Demander à Vera…';
    /* Inventaire : lien « Ouvrir le même établissement » de 17 px de haut. */
    [].forEach.call(d.querySelectorAll('a'), function (l) { if (/Ouvrir le même établissement/.test(l.textContent || '') && !l.__vx45) { l.__vx45 = true; l.style.display = 'inline-flex'; l.style.alignItems = 'center'; l.style.minHeight = '44px'; } });
  }
  /* Changement de thème : on efface nos corrections puis on repasse. */
  function effacer(d) { [].forEach.call(d.querySelectorAll('[data-vx44]'), function (e) { e.style.removeProperty('color'); e.removeAttribute('data-vx44'); }); }
  var minuteur = 0, dernierTheme = '';
  function planifier() { clearTimeout(minuteur); minuteur = setTimeout(tout, 450); }
  function documents() {
    var l = [doc]; [].forEach.call(doc.querySelectorAll('iframe'), function (f) { try { if (f.contentDocument && f.contentDocument.body) l.push(f.contentDocument); } catch (e) {} });
    return l;
  }
  function tout() {
    var theme = doc.documentElement.className.indexOf('vd-workspace-dark') >= 0 ? 'sombre' : 'clair';
    var ds = documents();
    if (theme !== dernierTheme) { ds.forEach(effacer); dernierTheme = theme; vus = new WeakSet(); }
    ds.forEach(function (d) { try { fusionRepos(d); petitsDefauts(d); passe(d); } catch (e) {} });
  }
  function surveiller(d) {
    if (!d || d.__vx44) return; d.__vx44 = true;
    try { new d.defaultView.MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { var x = l[i]; if (x.type === 'attributes' && x.target.hasAttribute && x.target.hasAttribute('data-vx44')) continue; planifier(); return; } }).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'open'] }); } catch (e) {}
  }
  /* Santé › Diagnostic de solidité : « Correct » était coupé en « Corr / ect » (colonne de 56 px, coupure autorisée
     partout). Le mot garde sa largeur ; c'est le texte voisin qui passe à la ligne. */
  (function () {
    if (doc.getElementById('vx44-css')) return;
    var st = doc.createElement('style'); st.id = 'vx44-css';
    st.textContent =
      /* C144 — En-tête compact sur iPhone dans l'appli (coquille) : le sous-titre passe sur la ligne du score et de Vera
         (une ligne entière gagnée, rien retiré) ; Vera garde son visage, sans le mot. */
      '@media (max-width:600px){html.verdict-hosted-viewer .stickytop .top{flex-wrap:nowrap!important;align-items:center!important;gap:8px!important}' +
      'html.verdict-hosted-viewer .stickytop .top>#topSub{order:-1;flex:1 1 auto!important;min-width:0;flex-direction:column!important;align-items:flex-start!important;margin:0!important;padding:0!important}' +
      'html.verdict-hosted-viewer .stickytop .top>#topSub>#topKpi{flex:0 0 auto!important;margin-left:0!important;align-self:flex-start!important;text-align:left!important}' +
      'html.verdict-hosted-viewer .stickytop .top>.brand{display:none!important}' +
      'html.verdict-hosted-viewer #aideBtn .verdict-vera-label{display:none!important}html.verdict-hosted-viewer #aideBtn{padding-right:6px!important;min-width:0!important}}' +
      /* Inventaire dans l'appli, sur iPhone : établissements, zones et niveau d'activité resserrés (≈ 45 px gagnés). */
      '@media (max-width:600px){html.vx44-dans-appli body>.top{padding-top:6px!important;padding-bottom:6px!important}' +
      'html.vx44-dans-appli #siteSeg,html.vx44-dans-appli #zoneSeg{margin-top:6px!important;padding:3px!important}html.vx44-dans-appli #siteSeg>button,html.vx44-dans-appli #zoneSeg>button{padding-top:7px!important;padding-bottom:7px!important;min-height:38px}' +
      'html.vx44-dans-appli .lvl{margin-top:6px!important}html.vx44-dans-appli #lvlSeg>button{padding-top:6px!important;padding-bottom:6px!important;min-height:36px}html.vx44-dans-appli #demoBanner{margin-top:6px!important}}' +
      /* C145 — petits défauts (groupe 3) : bouton × du bandeau de démonstration à 32 px, sans déborder ; noms de produits et
         légendes de l'Inventaire sur deux lignes au lieu d'être coupés. */
      '.mb-label{display:inline-flex!important;align-items:center;gap:6px}.p40-mb-x{min-width:32px!important;min-height:32px!important;flex:0 0 auto;display:inline-grid;place-items:center}' +
      /* C160 — Pastille du score (« 67 → 30 −37 rejouer ») : sur téléphone elle couvrait « Mes contrôles et actions » ; elle
         passe en bas, au-dessus de la barre de navigation. */
      '@media (max-width:600px){#scTrace{top:auto!important;bottom:calc(104px + env(safe-area-inset-bottom))!important;right:12px!important}}' +
      'html.p40-app body #modeBar .mb-label .p40-mb-x{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;margin-left:6px!important;margin-right:8px!important;font-size:15px!important}html.p40-app body #modeBar .mb-label{flex:0 0 auto;min-width:0}' +
      '.pinv-b small{white-space:normal!important;text-overflow:clip!important;overflow:visible!important}' +
      'div.nm{white-space:normal!important;text-overflow:clip!important;display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.solidarity-status{flex-wrap:wrap;row-gap:4px}.solidarity-status>b{flex:0 0 auto;white-space:nowrap;overflow-wrap:normal;word-break:keep-all}.solidarity-status>span{flex:1 1 140px;min-width:0}' +
      /* C255 (tour du thème clair, A2, A3, A6) : en thème clair, la fenêtre Bienvenue, la « Démonstration fictive », la carte FEC,
         « Option 2 » et la case d'autorisation passent en clair ; le voile des fenêtres n'est plus flouté (WebKit rendait la page
         blanche derrière). Le thème sombre n'est pas touché.
         C259 : la case dessinée vaut aussi pour l'export de caisse et les fiches du passage unique (#a15-passage) et pour les
         journées de caisse (#a15-journees) : la case d'autorisation de l'export restait native, en carré noir dans WebKit.
         C262 : le « Passeport établissement » (.ux-passport, styles en ligne de uxPassport) passe aussi en clair.
         C300 (V15-102) : la fenêtre « Une copie plus récente a été retrouvée » (#mSafetyRecovery) restait sombre en thème clair.
         C320 (vague 16 bis) : en thème clair, la bulle de notification (#toast) gardait son fond foncé mais prenait le texte foncé
         du thème (html.p40 #toast : color var(--p40-txt)) : « un message noir vide ». Texte clair sur la bulle foncée. */
      'html.vd-workspace-light body #refSh.on>.p{--txt:#17212b;--mut:#4b5b6b;--mut2:#5f6d7c;--line:rgba(23,33,43,.14);--card:#ffffff;--card2:#f6f8fa;--card3:#eef2f6;color:#17212b!important;background:linear-gradient(180deg,#ffffff,#f4f7f9)!important;border-color:rgba(23,33,43,.12)!important;box-shadow:0 30px 80px rgba(15,23,42,.16),0 2px 8px rgba(15,23,42,.08)!important}html.vd-workspace-light body #refSh.on>.p h2,html.vd-workspace-light body #refSh.on>.p h3,html.vd-workspace-light body #refSh.on>.p .p{color:#0f172a!important}html.vd-workspace-light body #refSh .p>.note,html.vd-workspace-light body #refSh .p .note{color:#4b5b6b!important}html.vd-workspace-light body #refSh .grab{background:rgba(23,33,43,.22)!important}html.vd-workspace-light body #refSh #refP .vera-ref-intro{background:linear-gradient(135deg,rgba(22,163,74,.10),rgba(22,163,74,.03))!important;border-color:rgba(22,163,74,.30)!important;color:#1f2937!important}html.vd-workspace-light body #refSh #refP .vera-ref-intro *{color:#334155!important}html.vd-workspace-light body #refSh #refP .vera-ref-intro b,html.vd-workspace-light body #refSh #refP .vera-ref-intro strong,html.vd-workspace-light body #refSh #refP .vera-ref-intro h4{color:#0f172a!important}html.vd-workspace-light body #refSh .p .ch,html.vd-workspace-light body #refSh .p .ch.ch-fec{background:#ffffff!important;border:1px solid rgba(23,33,43,.14)!important;color:#0f172a!important;box-shadow:0 1px 2px rgba(15,23,42,.06)!important}html.vd-workspace-light body #refSh .p .ch.ch-fec{background:#eef5ff!important;border-color:rgba(37,99,235,.40)!important}html.vd-workspace-light body #refSh .p .ch span{color:#4b5b6b!important}html.vd-workspace-light body #refSh .p .ch:hover{background:color-mix(in srgb,var(--ac,#16a34a) 7%,#ffffff)!important}html.vd-workspace-light body #refSh .p .ch:active{background:#f1f5f9!important}html.vd-workspace-light body #refSh .p .btn.ghost{color:#334155!important;border-color:rgba(23,33,43,.22)!important}html.vd-workspace-light body #mDemoIntent .tv-sheet{background:linear-gradient(180deg,#ffffff,#f4f7f9)!important;border-color:rgba(23,33,43,.12)!important;box-shadow:0 34px 90px rgba(15,23,42,.16),0 2px 8px rgba(15,23,42,.08)!important}html.vd-workspace-light body #mDemoIntent h2{color:#0f172a!important}html.vd-workspace-light body #mDemoIntent .tv-lead{color:#4b5b6b!important}html.vd-workspace-light body #mDemoIntent .tv-kicker{color:#15803d!important}html.vd-workspace-light body #mDemoIntent .tv-close{background:rgba(23,33,43,.05)!important;color:#17212b!important;border-color:rgba(23,33,43,.16)!important}html.vd-workspace-light body #mDemoIntent .demo-film-plan span{background:#ffffff!important;border-color:rgba(23,33,43,.12)!important;color:#17212b!important}html.vd-workspace-light body #mDemoIntent .demo-film-plan span b{color:#0f172a!important}html.vd-workspace-light body #mDemoIntent .demo-film-plan span small{color:#5f6d7c!important}html.vd-workspace-light body #mDemoIntent .demo-film-plan span:nth-child(1) b{color:#15803d!important}html.vd-workspace-light body #mDemoIntent .demo-film-plan span:nth-child(2) b{color:#b45309!important}html.vd-workspace-light body #mDemoIntent .demo-film-plan span:nth-child(3) b{color:#1d4ed8!important}html.vd-workspace-light body #mDemoIntent .demo-film-plan span:nth-child(4) b{color:#6d28d9!important}html.vd-workspace-light body #mDemoIntent .di-links button.primary{background:linear-gradient(180deg,#15803d,#166534)!important}html.vd-workspace-light.p40-app body #mDemoIntent.modal.on{background:#eef1f4!important}html.vd-workspace-light body #mDemoIntent .di-links button:not(.primary){background:#ffffff!important;border-color:rgba(23,33,43,.16)!important;color:#0f172a!important}html.vd-workspace-light body #mDemoIntent .di-links button:not(.primary) b{color:#0f172a!important}html.vd-workspace-light body #mDemoIntent .di-links button:not(.primary) span{color:#4b5b6b!important}html.vd-workspace-light body #mDemoIntent .di-links button:not(.primary):hover{background:#f1f5f9!important}html.vd-workspace-light body .v44-manual>summary{background:#ffffff!important;color:#17212b!important;border-color:#cfd8e0!important}html.vd-workspace-light body .v44-manual[open]>summary{border-color:#b9c4ce!important;color:#17212b!important}html.vd-workspace-light body .v44-fec-card{background:linear-gradient(155deg,#f2f7ff,#ffffff)!important;border-color:rgba(37,99,235,.35)!important;color:#17212b!important}html.vd-workspace-light body .v44-fec-card h2,html.vd-workspace-light body .v44-fec-card h3,html.vd-workspace-light body .v44-fec-card b,html.vd-workspace-light body .v44-fec-card strong{color:#0f172a!important}html.vd-workspace-light body .v44-fec-card p,html.vd-workspace-light body .v44-fec-card .v44-fec-note,html.vd-workspace-light body .v44-fec-card .v44-fec-warning,html.vd-workspace-light body .v44-fec-card .v44-fec-actions>span,html.vd-workspace-light body .v44-fec-card label{color:#3b4a5a!important}html.vd-workspace-light body .v44-fec-card .v44-fec-kicker{color:#1d4ed8!important}html.vd-workspace-light body .v44-fec-card .v44-fec-mark{background:#ffffff!important;color:#1d4ed8!important;border-color:rgba(37,99,235,.35)!important}html.vd-workspace-light body .v44-fec-steps li{background:#ffffff!important;border-color:#d5dde5!important;color:#17212b!important}html.vd-workspace-light body .v44-fec-steps li b{background:#e8eef5!important;color:#1d4ed8!important}html.vd-workspace-light body .v44-fec-consent{background:#ffffff!important;border-color:#d5dde5!important;color:#17212b!important}html.vd-workspace-light body .v44-fec-summary>div,html.vd-workspace-light body .v44-fec-context,html.vd-workspace-light body .v44-fec-ambiguities,html.vd-workspace-light body .v44-fec-card .df58-cmp{background:#ffffff!important;border-color:#d5dde5!important;color:#17212b!important}html.vd-workspace-light body .v44-fec-card .btn:not(.ghost){background:#17212b!important;color:#ffffff!important}html.vd-workspace-light body .v44-fec-consent input[type=checkbox],html.vd-workspace-light body #a15-passage input[type=checkbox],html.vd-workspace-light body #a15-journees input[type=checkbox]{-webkit-appearance:none!important;appearance:none!important;width:24px!important;height:24px!important;flex:0 0 24px;border:2px solid #8a99a8!important;border-radius:7px!important;background:#ffffff!important;display:inline-grid;place-content:center;cursor:pointer}html.vd-workspace-light body .v44-fec-consent input[type=checkbox]:checked,html.vd-workspace-light body #a15-passage input[type=checkbox]:checked,html.vd-workspace-light body #a15-journees input[type=checkbox]:checked{background:#16a34a!important;border-color:#16a34a!important;background-image:url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath d=%27M6 12.5l4 4 8-9%27 fill=%27none%27 stroke=%27white%27 stroke-width=%273%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E\")!important;background-size:18px 18px!important;background-position:center!important;background-repeat:no-repeat!important}html.vd-workspace-light body .v44-fec-consent input[type=checkbox]:focus-visible,html.vd-workspace-light body #a15-passage input[type=checkbox]:focus-visible,html.vd-workspace-light body #a15-journees input[type=checkbox]:focus-visible{outline:2px solid #2563eb;outline-offset:2px}html.vd-workspace-light body #a15-passage .a15-row input[type=checkbox]{width:20px!important;height:20px!important;flex:0 0 20px;border-radius:6px!important}html.vd-workspace-light body .ux-passport{background:linear-gradient(145deg,#f1fbf6,#ffffff)!important;border-color:rgba(22,163,74,.38)!important;box-shadow:0 1px 2px rgba(15,23,42,.06)!important;color:#17212b!important}html.vd-workspace-light body .ux-passport .ux-kicker{color:#15803d!important}html.vd-workspace-light body .ux-passport h4,html.vd-workspace-light body .ux-passport h3{color:#0f172a!important}html.vd-workspace-light body .ux-passport .note,html.vd-workspace-light body .ux-passport p{color:#3b4a5a!important}html.vd-workspace-light body .ux-passport label,html.vd-workspace-light body .ux-passport label span{color:#3b4a5a!important}html.vd-workspace-light body .ux-passport .ux-required{color:#b91c1c!important}html.vd-workspace-light body .df58-ban.df58-ok,html.vd-workspace-light body .df58-ban.df58-ko{color:#17212b!important;font-weight:inherit!important}html.vd-workspace-light .modal.on,html.vd-workspace-light .sheet-backdrop{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:rgba(15,23,42,.42)!important}html.vd-workspace-light body #mSafetyRecovery .sheet{background:#fff!important;border-color:#dbe2e8!important;color:#17212b!important}html.vd-workspace-light body #mSafetyRecovery h3{color:#17212b!important}html.vd-workspace-light body #mSafetyRecovery .sub{color:#40566d!important}html.vd-workspace-light body #mSafetyRecovery .btn.sec{background:#fff!important;color:#17212b!important;border:1px solid #cbd5e1!important}html.vd-workspace-light body #toast,html.vd-workspace-light body .toast{color:#f8fafc!important}';
    (doc.head || doc.documentElement).appendChild(st);
    try { if (w.top !== w) doc.documentElement.classList.add('vx44-dans-appli'); } catch (e) {}
  })();
  function demarrer() { surveiller(doc); documents().forEach(surveiller); planifier(); }
  if (doc.readyState === 'complete') setTimeout(demarrer, 1200); else w.addEventListener('load', function () { setTimeout(demarrer, 1200); });
  setInterval(function () { documents().forEach(surveiller); }, 3000);
  /* C160 — Le bandeau de démonstration est redessiné à chaque changement de modèle : « Recommencer » est raccourci sans
     attendre (le texte long recouvrait la croix pendant quelques secondes). */
  var tBandeau = setInterval(function () {
    if (w.innerWidth >= 600) return;
    [].forEach.call(doc.querySelectorAll('#modeBar button'), function (b) { if (/^Recommencer\s+la\s+démonstration$/.test((b.textContent || '').replace(/\s+/g, ' ').trim())) { b.setAttribute('aria-label', 'Recommencer la démonstration'); b.textContent = 'Recommencer'; } });
  }, 250); if (tBandeau && tBandeau.unref) tBandeau.unref();
  w.VerdictContraste = { passe: function () { tout(); }, mesurer: passe };
})();
