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
      if (c && c.a > 0.55) return c;
      var img = cs.backgroundImage; if (img && img !== 'none' && /gradient/.test(img)) { var m = img.match(/rgba?\([^)]*\)/); var g = m && rgb(m[0]); if (g && g.a > 0.55) return g; }
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
    if ((d.defaultView || w).innerWidth < 600) [].forEach.call(d.querySelectorAll('#modeBar button'), function (b) { if ((b.textContent || '').trim() === 'Recommencer la démonstration') { b.setAttribute('aria-label', 'Recommencer la démonstration'); b.textContent = 'Recommencer'; } });
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
      'html.p40-app body #modeBar .mb-label .p40-mb-x{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;margin-left:6px!important;margin-right:8px!important;font-size:15px!important}html.p40-app body #modeBar .mb-label{flex:0 0 auto;min-width:0}' +
      '.pinv-b small{white-space:normal!important;text-overflow:clip!important;overflow:visible!important}' +
      'div.nm{white-space:normal!important;text-overflow:clip!important;display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.solidarity-status{flex-wrap:wrap;row-gap:4px}.solidarity-status>b{flex:0 0 auto;white-space:nowrap;overflow-wrap:normal;word-break:keep-all}.solidarity-status>span{flex:1 1 140px;min-width:0}';
    (doc.head || doc.documentElement).appendChild(st);
    try { if (w.top !== w) doc.documentElement.classList.add('vx44-dans-appli'); } catch (e) {}
  })();
  function demarrer() { surveiller(doc); documents().forEach(surveiller); planifier(); }
  if (doc.readyState === 'complete') setTimeout(demarrer, 1200); else w.addEventListener('load', function () { setTimeout(demarrer, 1200); });
  setInterval(function () { documents().forEach(surveiller); }, 3000);
  w.VerdictContraste = { passe: function () { tout(); }, mesurer: passe };
})();
