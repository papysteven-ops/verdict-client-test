/* C96 — Audit « premium ultra » (Steven, 16/10) : « c'est un pavé de lecture ; chaque bloc doit me donner envie de voir
   la suite ; le visuel et l'animation valent mieux que la lecture ; comprendre pourquoi les pertes, comment remonter ;
   je veux un waouh ».
   L'Audit s'ouvre sur un récit en 6 tableaux plein écran, un par idée, chacun avec un chiffre géant compté, un visuel
   animé et une phrase courte. Les animations partent quand le tableau est vraiment à l'écran (IntersectionObserver).
   Toutes les valeurs viennent du moteur de Verdict et du gain réaliste (même base que Simuler et Priorités) : rien
   n'est inventé. L'analyse détaillée (preuves, méthode, exports) reste en dessous, repliée. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdRecit) return; w.__vdRecit = true;
  var REDUIT = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* C218 (W70) : espace insécable visible entre les milliers (l'espace fine U+202F disparaissait dans les gros chiffres gras : « +15377 € »). */
  /* C407 (décision 41) : le récit dans la langue du patron — phrases entières par tr() (Langues), montants et % mis en forme dans la langue */
  var TAG = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', it: 'it-IT', de: 'de-DE', nl: 'nl-NL', pt: 'pt-PT' };
  function lg() { try { return String(w.LOCALE || doc.documentElement.lang || 'fr').slice(0, 2).toLowerCase(); } catch (e) { return 'fr'; } }
  function loc() { return TAG[lg()] || 'fr-FR'; }
  function tr(s) { try { var V = w.VerdictLanguesComplements, t = V && V.traduire && V.traduire(String(s)); return t || s; } catch (e) { return s; } }
  function eur(v) { if (lg() === 'fr') return Math.round(Number(v) || 0).toLocaleString('fr-FR').replace(/[\u202f\s]/g, '\u00a0') + '\u00a0€';
    try { return new Intl.NumberFormat(loc(), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(Number(v) || 0)); } catch (e) { return Math.round(Number(v) || 0) + ' €'; } }
  function pct(v) { return (Number(v) || 0).toLocaleString(loc(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + (/^(en|nl)$/.test(lg()) ? '%' : ' %'); }
  /* le récit déjà rendu passe par tr() texte par texte (chaque nœud est une phrase entière) ; rien en français */
  function traduire(box) { if (!box || lg() === 'fr') return; try {
    var it = doc.createTreeWalker(box, 4), t, L = []; while ((t = it.nextNode())) L.push(t);
    L.forEach(function (n) { var v = n.nodeValue, s = v.trim(); if (!s || !/[A-Za-zÀ-ÿ]/.test(s)) return; var x = tr(s); if (x && x !== s) n.nodeValue = v.replace(s, x); });
    [].forEach.call(box.querySelectorAll('[aria-label]'), function (e) { var a = e.getAttribute('aria-label'), x = tr(a); if (x && x !== a) e.setAttribute('aria-label', x); });
  } catch (e) {} }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  /* C311 (V16-012) : le titre suit aussi le Test de résistance, comme le chapitre 01 (« rentable, mais fragile » dès que deux chocs
     sur quatre font passer en perte) : jamais « Une structure solide » au-dessus d'un chapitre qui dit fragile. */
  function ton(rn, R) { var n = 0; try { if (R && rn >= 0 && typeof w.stressStruct === 'function') n = w.stressStruct(R).pertes || 0; } catch (e) {}
    if (rn < 0) return 'Votre structure perd de l’argent'; if (rn < 5 || n >= 2) return 'Rentable, mais fragile'; if (rn < 8 || n === 1) return 'Rentable, sans matelas'; return 'Une structure solide'; }
  function teinte(rn) { return rn < 0 ? '#ef4444' : rn < 5 ? '#f97316' : rn < 8 ? '#eab308' : '#22c55e'; }

  function donnees() {
    var R; try { R = w.moteur(); } catch (e) { return null; }
    if (!R || !R.ready || !R.d) return null;
    var d = R.d, v = R.v || {}, ca = Math.max(1, num(d.ca));
    var P = null; try { P = typeof w.auditPremiumCalc === 'function' ? w.auditPremiumCalc(R) : null; } catch (e) {}
    var G = null; try { G = typeof w.potentiel === 'function' ? w.potentiel() : null; } catch (e) {}
    /* Chaque 100 € : matière, équipe, plateformes, puis tout le reste des charges (loyer, énergie, assurances…) pour que
       la somme fasse exactement 100 € avec le résultat. */
    var rn = num(v.rn);
    var postes = [
      { l: 'Matière', v: num(v.fc), c: '#f59e0b' },
      { l: 'Équipe', v: num(v.ms), c: '#60a5fa' },
      { l: 'Plateformes', v: num(v.com), c: '#c084fc' }
    ].filter(function (x) { return x.v > 0.05; });
    var reste = Math.max(0, 100 - rn - postes.reduce(function (s, x) { return s + x.v; }, 0));
    if (reste > 0.05) postes.push({ l: 'Loyer et autres charges', v: reste, c: '#94a3b8' });
    /* C99 — Une seule référence (Steven, C90) : mêmes postes, mêmes arrondis et mêmes couleurs que le chapitre
       « Sur 100 € HT » de l'analyse complète (matière = nourriture + boissons, structure, amortissements). */
    var M = P && P.money100, COURT = { matter: 'Matière', variable: 'Emballages', platforms: 'Plateformes', team: 'Équipe', structure: 'Structure', amortization: 'Amortissements' };
    if (M && M.rows && M.rows.length) {
      postes = M.rows.filter(function (x) { return num(x.display) > 0.05; }).map(function (x) { return { l: COURT[x.id] || x.l, v: num(x.display), c: x.c || '#94a3b8' }; });
      var charges = Math.round(postes.reduce(function (s, x) { return s + x.v; }, 0) * 10) / 10;
      if (M.status === 'positive') rn = Math.round(Math.max(0, 100 - charges) * 10) / 10; else if (M.status === 'loss') rn = -Math.round(Math.max(0, charges - 100) * 10) / 10;
    }
    var seuil = (P && P.seuil) || {}, mini = num(seuil.eur);
    /* C218 (W70) : l'écart matière réel (achats du document comptable contre fiches de la carte, nourriture + boissons), quand la
       carte est fiable : c'est de l'argent qui s'échappe vraiment, à côté des leviers à récupérer. */
    var fuite = null;
    try {
      /* C301 (V15-003, décision 5) : le même écart que partout (window.VerdictEcartMatiere) : même périmètre des deux côtés, période écrite. */
      var C = P && P.carte, E = typeof w.VerdictEcartMatiere === 'function' ? w.VerdictEcartMatiere(R) : null;
      if (C && C.ok && num(C.couverture) >= 80 && E && E.reel > 0 && E.theo > 0 && E.pts >= 0.5) fuite = { reel: E.reel, theo: E.theo, pts: E.pts, eur: E.eur, compte: E.compte, perimetre: E.perimetre, periode: E.periode, brouillons: E.brouillons || 0, nour: E.nour || null, boi: E.boi || null };
    } catch (e) {}
    var leviers = (G && G.leviers || []).slice(0, 8);
    return {
      R: R, ca: num(d.ca), res: num(d.res), rn: rn, score: Math.round(num(R.score)), postes: postes,
      mini: mini, securite: isFinite(Number(seuil.securiteEur)) ? Number(seuil.securiteEur) : num(d.ca) - mini,
      leviers: leviers, combine: G ? num(G.combine) : 0, fuite: fuite, cible: G && G.max ? num(d.res) + leviers.reduce(function (s, x) { return s + num(x.seul != null ? x.seul : x.gain); }, 0) + (G ? num(G.combine) : 0) : null, /* C382 : gains isolés + effet combiné = total du plan */ /* C301 (V15-041) : le possible est la somme des lignes */ cibleScore: G && G.max ? Math.round(num(G.max.score)) : null,
      nom: (function () { try { return (w.DB && w.DB.etab) || 'Votre établissement'; } catch (e) { return 'Votre établissement'; } })()
    };
  }

  function anneau(score, col) {
    var r = 70, c = 2 * Math.PI * r;
    return '<svg class="rc-ring" viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="' + r + '" class="rc-ring-bg"/>' +
      '<circle cx="90" cy="90" r="' + r + '" class="rc-ring-arc" style="stroke:' + col + ';stroke-dasharray:' + c.toFixed(1) + ';--rc-off:' + (c * (1 - score / 100)).toFixed(1) + ';--rc-len:' + c.toFixed(1) + '"/></svg>';
  }

  function tableaux(D) {
    var col = teinte(D.rn), t = [];
    /* 1 · Le verdict */
    t.push('<section class="rc-card rc-c1" data-rc="1"><span class="rc-k">1 · Le verdict</span><h2>' + esc(ton(D.rn, D.R)) + '</h2>' +
      '<div class="rc-dial">' + anneau(D.score, col) + '<div class="rc-dial-n"><b data-rc-count="' + D.score + '">0</b><small>/100</small></div></div>' +
      '<p class="rc-big"><b data-rc-count="' + Math.round(D.res) + '" data-rc-eur>0 €</b><small>de résultat sur un an · marge ' + pct(D.rn) + '</small></p>' +
      '<p class="rc-p">Indice de sérénité Verdict, calculé avec vos chiffres.</p><span class="rc-suite">Voir où part l’argent ↓</span></section>');
    /* 2 · Où part chaque 100 € */
    /* C98 — sur grand écran, chaque segment assez large porte son nom et son montant. */
    function dedans(l, v) { return v >= 9 ? '<span><small>' + esc(l) + '</small>' + (Math.round(v * 10) / 10).toLocaleString(loc(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' €</span>' : ''; }
    var seg = D.postes.map(function (x, i) { return '<i style="--w:' + Math.max(0, x.v).toFixed(2) + '%;--c:' + x.c + ';--i:' + i + '">' + dedans(x.l, x.v) + '</i>'; }).join('') +
      (D.rn > 0 ? '<i class="rc-res" style="--w:' + D.rn.toFixed(2) + '%;--c:#22c55e;--i:' + D.postes.length + '">' + dedans('Reste avant impôt', D.rn) + '</i>' : '');
    var leg = D.postes.map(function (x) { return '<li><i style="background:' + x.c + '"></i>' + esc(x.l) + '<b>' + (Math.round(x.v * 10) / 10).toLocaleString(loc(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' €</b></li>'; }).join('') +
      '<li' + (D.rn < 0 ? ' class="rc-neg"' : '') + '><i style="background:' + (D.rn > 0 ? '#22c55e' : '#ef4444') + '"></i>' + (D.rn >= 0 ? 'Reste avant impôt' : 'Il manque') + '<b>' + (D.rn >= 0 ? '' : '−') + Math.abs(Math.round(D.rn * 10) / 10).toLocaleString(loc(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' €</b></li>';
    /* V51 (21/10) : les montants sont HT (« encaissés » laissait croire à du TTC) ; « le premier poste est l’équipe », avec l'article. */
    var ART = { 'matière': 'la matière', 'équipe': 'l’équipe', 'plateformes': 'les plateformes', 'emballages': 'les emballages', 'structure': 'la structure', 'amortissements': 'les amortissements', 'loyer et autres charges': 'le loyer et les autres charges' };
    var premier = D.postes.length ? D.postes.slice().sort(function (a, b) { return b.v - a.v; })[0].l.toLowerCase() : '';
    t.push('<section class="rc-card rc-c2" data-rc="2"><span class="rc-k">2 · Où part l’argent</span><h2>Sur 100 € de chiffre d’affaires HT</h2>' +
      '<div class="rc-stack">' + seg + '</div><ul class="rc-leg">' + leg + '</ul>' +
      '<p class="rc-p">' + (premier ? esc('Le premier poste est ' + (ART[premier] || premier) + '.') : '') + '</p><span class="rc-suite">Votre seuil ↓</span></section>');
    /* 3 · Le seuil */
    if (D.mini > 0) {
      var echelle = Math.max(D.ca, D.mini) * 1.08, pc = D.ca / echelle * 100, pm = D.mini / echelle * 100, ok = D.securite >= 0;
      t.push('<section class="rc-card rc-c3" data-rc="3"><span class="rc-k">3 · Le seuil</span><h2>' + (ok ? 'Vous passez le seuil' : 'Le seuil n’est pas atteint') + '</h2>' +
        '<div class="rc-gauge"><div class="rc-track"><i style="--w:' + pc.toFixed(2) + '%"></i><span class="rc-mark" style="--x:' + pm.toFixed(2) + '%"><b>minimum</b></span></div>' +
        '<div class="rc-gauge-l"><span>Minimum ' + eur(D.mini) + ' HT</span><span>Réalisé ' + eur(D.ca) + ' HT</span></div></div>' /* C143 : HT dit */ +
        '<p class="rc-big"><b data-rc-count="' + Math.round(Math.abs(D.securite)) + '" data-rc-eur>0 €</b><small>' + (ok ? 'de marge de sécurité sur un an' : 'à aller chercher sur un an') + '</small></p>' +
        '<span class="rc-suite">Vos fuites ↓</span></section>');
    }
    /* C420 (L7) : un seul nom par levier dans les images 4 et 5, celui de l'écran (vocabulaire-a56 : « Coût humain chargé » → « Coût de l’équipe »),
       posé avant la traduction : sans cela, en es et en it, l'image 4 et l'image 5 donnaient deux noms différents. */
    function nomLevier(n) { return String(n || '').replace(/\bCoût humain chargé(?![\wÀ-ÿ])/g, 'Coût de l’équipe'); }
    /* 4 · Les fuites */
    /* C218 (W70) : d'abord ce qui s'échappe vraiment (l'écart matière entre achats et fiches), puis ce que Verdict propose de
       récupérer, avec les montants de Simuler. Le nombre de commandes n'y figure plus : ce n'est pas une décision du patron. */
    if (D.leviers.length || D.fuite) {
      var n0 = 0, fuites = '';
      if (D.fuite) {
        /* C318 (V16C-N1) : un seul arrondi, à partir de l'écart exact (Burger 1,99 → « 2,0 points », comme le chapitre 13) */
        var ecA = Math.round((D.fuite.pts != null ? Number(D.fuite.pts) : D.fuite.reel - D.fuite.theo) * 10) / 10, fpt = ecA.toLocaleString(loc(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        fuites += nbFr('<li class="rc-fuite" style="--i:0"><span class="rc-n">!</span><div><b>Écart matière (' + esc(D.fuite.perimetre || 'nourriture + boissons') + ')</b><small>' /* C420 (L7) : trois phrases entières, chacune dans son <span> (une phrase = un nœud traduisible, Langues) */ + '<span>Achats ' + esc(D.fuite.periode || '') + ' : ' + pct(D.fuite.reel) + ' du CA ; ' + (D.fuite.brouillons ? 'fiches-types proposées par Vera, à confirmer' : 'fiches') + ' : ' + pct(D.fuite.theo) + '.</span> <span>' + fpt + ' point' + (Math.abs(ecA) >= 2 ? 's' : '') + ' de pertes, portions ou offerts non saisis' + (D.fuite.compte ? (function () { /* C311 (V16-026) : ce que le plan compte vraiment, et seulement si le levier existe */
          /* C311 (décision 13) : poste par poste — nourriture et boissons, chacune bornée par son propre écart */
          var p1 = function (x) { return (Math.round(x * 10) / 10).toLocaleString(loc(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }, pl = function (x) { return p1(x) + ' point' + (Math.abs(Math.round(x * 10) / 10) >= 2 ? 's' : ''); };
          var lf = D.leviers.filter(function (x) { return x && x.id === 'fc'; })[0], lb = D.leviers.filter(function (x) { return x && x.id === 'boi'; })[0];
          var vf = lf && lf.over ? Math.abs(num(lf.over.fc)) : 0, vb = lb && lb.over ? Math.abs(num(lb.over.boi)) : 0, N = D.fuite.nour, B = D.fuite.boi;
          var postes = N && B ? ' (nourriture ' + (N.pts >= 0 ? '+' : '−') + pl(Math.abs(N.pts)) + ', boissons ' + (B.pts >= 0 ? '+' : '−') + pl(Math.abs(B.pts)) + ')' : '';
          if (!lf && !lb) return postes + '.</span> <span>Le plan ne retient pas de levier matière' + (N && N.pts <= 0 ? ' (la nourriture est déjà sous vos fiches)' : '') + ' : cet écart n’est pas compté dans le gain.</span>';
          var parts = []; if (lf) parts.push(pl(vf) + ' dans « Coût de la nourriture »'); if (lb) parts.push(pl(vb) + ' dans « Coût des boissons »');
          var tN = N ? Math.max(0, N.pts) / 3 : D.fuite.pts / 3, tB = B ? Math.max(0, B.pts) / 3 : 0, reduit = (lf && vf < tN - 0.55) || (lb && vb < tB - 0.55);
          return postes + '.</span> <span>Verdict en compte ' + parts.join(' et ') + ' ci-dessous : un tiers de l’écart de chaque poste, par pas de 0,5 point' + (reduit ? ', réduit pour rester au niveau des meilleurs établissements de votre format' : '') + '.</span>';
        })() : '.</span> <span>Sous 4 points, non compté dans le gain.</span>') + '</small></div><strong>≈\u00a0<em data-rc-count="' + Math.round(D.fuite.eur) + '" data-rc-eur>0 €</em><small>/ an</small></strong></li>');
        n0 = 1;
      }
      fuites += D.leviers.map(function (x, i) {
        return '<li style="--i:' + (i + n0) + '"><span class="rc-n">' + (i + 1) + '</span><div><b>' + esc(nomLevier(x.n)) + '</b><small>' + esc(x.vers || '') + ' · à récupérer</small></div><strong>+<em data-rc-count="' + Math.round(x.seul != null ? x.seul : x.gain) + '" data-rc-eur>0 €</em><small>/ an</small></strong></li>';
      }).join('');
      t.push('<section class="rc-card rc-c4" data-rc="4"><span class="rc-k">4 · Vos fuites</span><h2>L’argent qui s’échappe</h2><ol class="rc-leaks">' + fuites + '</ol>' +
        '<p class="rc-p">' + (D.leviers.length ? 'Montants à récupérer calculés comme dans Simuler, et repris tels quels dans Carte › Décisions pour les prix.' : 'Aucun levier réaliste à ajouter pour l’instant.') + '</p><span class="rc-suite">Comment remonter ↓</span></section>');
    }
    /* 5 · Comment remonter : cascade du résultat */
    if (D.leviers.length && D.cible != null) {
      var pas = [{ l: 'Aujourd’hui', v: D.res, base: true }];
      D.leviers.forEach(function (x) { pas.push({ l: nomLevier(x.n), v: x.seul != null ? x.seul : x.gain }); });
      if (Math.abs(num(D.combine)) >= 1) pas.push({ l: 'Effet combiné des leviers', v: num(D.combine), comb: true }); /* C382 (A47) */
      /* C97 — Cascade horizontale (lisible sur iPhone), échelle depuis 0 sans coupure, chaque barre chiffrée. */
      var bornes = [0, D.res, D.cible], cumul = D.res, barres = '';
      pas.forEach(function (p) { if (!p.base) { cumul += p.v; bornes.push(cumul); } });
      var lo = Math.min.apply(null, bornes), hi = Math.max.apply(null, bornes), plage = Math.max(1, hi - lo);
      function ligne(i, cls, lib, val, a, z) {
        var g = (Math.min(a, z) - lo) / plage * 100, l = Math.max(1.6, Math.abs(z - a) / plage * 100);
        return '<li class="rc-wf-row ' + cls + '" style="--i:' + i + '"><span class="rc-wf-l">' + esc(lib) + '</span><b class="rc-wf-v">' + val + '</b>' +
          '<span class="rc-wf-track"><i class="rc-wf-bar" style="--g:' + g.toFixed(2) + '%;--l:' + Math.min(100 - g, l).toFixed(2) + '%"></i></span></li>';
      }
      cumul = D.res;
      pas.forEach(function (p, i) {
        if (p.base) { barres += ligne(i, 'base', p.l, eur(p.v), 0, p.v); return; }
        barres += ligne(i, p.v < 0 ? 'comb' : 'gain', (p.comb ? '' : '+ ') + p.l, (p.v < 0 ? '−' + eur(-p.v) : '+' + eur(p.v)), cumul, cumul + p.v); cumul += p.v;
      });
      barres += ligne(pas.length, 'cible', 'Possible', eur(D.cible), 0, D.cible);
      t.push('<section class="rc-card rc-c5" data-rc="5"><span class="rc-k">5 · Comment remonter</span><h2>Votre résultat, levier par levier</h2>' +
        '<ol class="rc-wf">' + barres + '</ol>' +
        '<p class="rc-big"><b data-rc-count="' + Math.round(D.cible) + '" data-rc-eur>0 €</b><small>de résultat possible sur un an · ' + eur((D.cible - D.res) / 12) + ' de plus par mois</small></p>' +
        /* C357 (T1, avec L2 et L7) : l'image 4 montre l'écart matière ; quand le plan ne retient aucun levier matière, l'image 5 le dit aussi */
        (D.fuite && !D.leviers.some(function (x) { return x && (x.id === 'fc' || x.id === 'boi'); }) ? '<p class="rc-p" data-rc-noncompte>Non compté : l’écart matière (≈ ' + eur(Math.round(D.fuite.eur)) + ' par an), à expliquer avant d’en faire un gain.</p>' : '') +
        '<span class="rc-suite">Votre prochain pas ↓</span></section>');
    }
    /* 6 · Le prochain pas */
    t.push('<section class="rc-card rc-c6" data-rc="6"><span class="rc-k">6 · Votre prochain pas</span><h2>On s’y met ?</h2>' +
      '<p class="rc-p">Testez ces leviers sur vos chiffres, puis gardez ceux qui vous conviennent.</p>' +
      '<button type="button" class="rc-cta" data-rc-go="simuler">Ouvrir dans Simuler</button>' +
      '<div class="rc-cta2"><button type="button" data-rc-go="actions">Mes actions</button><button type="button" data-rc-go="preuves">Voir les preuves</button></div></section>');
    return t.join('');
  }

  function compter(el) {
    var fin = Number(el.getAttribute('data-rc-count')) || 0, euro = el.hasAttribute('data-rc-eur');
    function aff(x) { el.textContent = euro ? eur(x) : String(Math.round(x)); }
    if (REDUIT) return aff(fin);
    var t0 = performance.now(), duree = 1100;
    (function tour(t) { var p = Math.min(1, (t - t0) / duree), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); aff(fin * e); if (p < 1) requestAnimationFrame(tour); })(t0);
    /* C311 (V16-011) : le compteur finit toujours sur le chiffre exact des chapitres (12 533 €, pas 12 516 €), même quand
       l'animation est suspendue (cadre ou onglet caché) avant sa dernière image. */
    setTimeout(function () { aff(fin); }, duree + 150);
  }
  /* C342/C345 (décision 27) : une image déjà à l'écran au moment du rendu garde ses montants (écrits dès le départ, C301) : jamais
     42 692 € puis 0 puis 42 692 € ; les compteurs qui jouent à l'arrivée d'une image sont déclarés (data-vd-compteur) */
  var RENDU_RC = 0;
  /* C472 (point 9) : typographie française, espace insécable avant « : » et « ; » (les autres langues gardent leurs phrases traduites) */
  /* C490 (défaut 16, point 19) : « ci-dessous » ne se coupe plus à son trait d'union, « 1,3 point » ne se sépare plus */
  function nbFr(s) { return lg() === 'fr' ? String(s).replace(/ ([:;])/g, '\u00a0$1').replace(/ci-dessous/g, 'ci\u2011dessous').replace(/(\d) (points?)(?![\wÀ-ÿ])/g, '$1\u00a0$2') : s; }
  function jouer(card) {
    if (card.classList.contains('rc-on')) return;
    card.classList.add('rc-on');
    if (performance.now() - RENDU_RC < 600) return;
    try { var rb = card.getBoundingClientRect(), vh = w.innerHeight || doc.documentElement.clientHeight; if (rb.top < vh && rb.bottom > 0) return; } catch (e) {} /* C472 (point 10) : atteinte d'un saut, déjà à l'écran : montants définitifs */
    [].forEach.call(card.querySelectorAll('[data-rc-count]'), function (el, i) { setTimeout(function () { compter(el); }, REDUIT ? 0 : 180 + i * 120); });
  }
  /* C98 — Grand écran (Steven : « pas un copier-coller du mobile, meilleure expérience sur grand ») : barre de chapitres
     collante sous la barre du haut, qui suit la lecture ; à la souris, lumière qui suit le pointeur sur chaque carte. */
  function grandEcran(box, cartes) {
    /* Hauteur de la barre du haut (Mac) mesurée au moment de lire : elle n'existe pas encore pendant l'ouverture. */
    function caler() {
      var haut = 0; try {
        var b = doc.querySelector('[data-v="audit"]'), n = b && b.closest('nav,div'), cs = n && getComputedStyle(n), h = n ? n.getBoundingClientRect().height : 0, t = cs ? parseFloat(cs.top) : NaN;
        /* barre collée en haut (Mac) : on se place juste dessous ; barre en bas (iPhone, iPad) : rien à éviter */
        if (h && h < 150 && (cs.position === 'sticky' || cs.position === 'fixed') && isFinite(t) && t < 40) haut = Math.floor(t + h); /* C100 : collée, sans interstice */
      } catch (e) {}
      if (box.__rcTop !== haut) { box.__rcTop = haut; box.style.setProperty('--rc-top', haut + 'px'); }
    }
    caler(); if (!box.__rcCale) { box.__rcCale = true; w.addEventListener('resize', caler, { passive: true }); }
    var puces = box.querySelectorAll('[data-rc-nav]');
    [].forEach.call(puces, function (p) {
      p.onclick = function () { var c = box.querySelector('[data-rc="' + p.getAttribute('data-rc-nav') + '"]'); if (c) { box.__rcChoisi = p.getAttribute('data-rc-nav'); jouer(c); c.scrollIntoView({ behavior: REDUIT ? 'auto' : 'smooth', block: 'start' }); suivre(); } };
    });
    /* V51 (21/10) : le sélecteur suit le défilement. Avant, seule une bande à 35-45 % de l'écran comptait : en bas de page,
       les dernières images (plus courtes, côte à côte sur grand écran) ne la traversaient jamais et « 3 Seuil » restait allumé.
       Image courante = la plus basse dont le haut a passé 40 % de l'écran ; fin du récit à l'écran = la dernière image visible. */
    function suivre() {
      var cs = box.querySelectorAll('.rc-card'), ps = box.querySelectorAll('[data-rc-nav]'); if (!cs.length || !box.isConnected) return;
      var hauteur = w.innerHeight || doc.documentElement.clientHeight, ligne = hauteur * 0.4, cur = null, haut = -Infinity;
      [].forEach.call(cs, function (c) { var r = c.getBoundingClientRect(); if (r.height && r.top <= ligne && r.top > haut + 24) { cur = c; haut = r.top; } /* même rangée (±24 px) : la première image */ });
      if (box.getBoundingClientRect().bottom <= hauteur + 2) [].forEach.call(cs, function (c) { var r = c.getBoundingClientRect(); if (r.height && r.top < hauteur && r.bottom > 0) cur = c; });
      /* Image choisie dans le sélecteur (« 3 » à côté de « 2 » sur grand écran) : elle reste allumée tant qu'elle est à l'écran. */
      var choisie = box.__rcChoisi && box.querySelector('[data-rc="' + box.__rcChoisi + '"]');
      if (choisie) { var rc = choisie.getBoundingClientRect(); if (rc.height && rc.top < hauteur && rc.bottom > 0) cur = choisie; }
      var n = (cur || cs[0]).getAttribute('data-rc');
      [].forEach.call(ps, function (p) { var on = p.getAttribute('data-rc-nav') === n; if (on && !p.hasAttribute('aria-current')) p.setAttribute('aria-current', 'true'); else if (!on && p.hasAttribute('aria-current')) p.removeAttribute('aria-current'); });
    }
    if (!box.__rcSuivi) {
      box.__rcSuivi = true; var prevu = 0;
      doc.addEventListener('scroll', function () { if (!prevu) prevu = requestAnimationFrame(function () { prevu = 0; caler(); suivre(); }); }, { passive: true, capture: true });
      /* L'utilisateur fait défiler lui-même : le choix fait au clic ne compte plus. */
      ['wheel', 'touchstart', 'keydown'].forEach(function (t) { doc.addEventListener(t, function () { box.__rcChoisi = null; }, { passive: true, capture: true }); });
    }
    suivre();
    if (box.__rcSouris || REDUIT || !w.matchMedia || !w.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    box.__rcSouris = true;
    var vise = null, image = 0, mx = 0, my = 0;
    box.addEventListener('pointermove', function (e) {
      vise = e.target.closest && e.target.closest('.rc-card'); mx = e.clientX; my = e.clientY;
      if (!vise || image) return;
      image = requestAnimationFrame(function () { image = 0; if (!vise) return; var r = vise.getBoundingClientRect(); vise.style.setProperty('--mx', (mx - r.left) + 'px'); vise.style.setProperty('--my', (my - r.top) + 'px'); });
    });
  }
  function monter() {
    var body = doc.getElementById('auditBody'); if (!body) return;
    var D = donnees(); if (!D) return;
    var cle = [D.score, Math.round(D.res), Math.round(D.ca), D.leviers.length, D.cible, lg()].join('|'); /* C407 : la langue entre dans la clé */
    var box = doc.getElementById('vdRecit');
    if (box && box.getAttribute('data-cle') === cle && box.parentNode) return;
    if (!box) { box = doc.createElement('div'); box.id = 'vdRecit'; }
    box.setAttribute('data-cle', cle);
    var corps = tableaux(D), noms = { 1: 'Verdict', 2: 'Où part l’argent', 3: 'Seuil', 4: 'Fuites', 5: 'Remonter', 6: 'Prochain pas' }, puces = '';
    /* C301 (V15-080) : autant d'images annoncées que d'images affichées, numérotées à la suite (plus « en 6 images » pour 1, 2, 3, 6) */
    var rang = {}, nImg = 0; corps.replace(/data-rc="(\d)"/g, function (m, n) { if (!rang[n]) rang[n] = ++nImg; return m; });
    corps = corps.replace(/(<span class="rc-k">)(\d)( · )/g, function (m, a, n, b) { return a + (rang[n] || n) + b; });
    corps.replace(/data-rc="(\d)"/g, function (m, n) { puces += '<button type="button" data-rc-nav="' + n + '"><i>' + (rang[n] || n) + '</i>' + noms[n] + '</button>'; return m; });
    var MOTS = ['', 'une image', 'deux images', 'trois images', 'quatre images', 'cinq images', 'six images'], motN = MOTS[nImg] || (nImg + ' images');
    box.innerHTML = '<header class="rc-head"><span>Audit Verdict · ' + esc(D.nom) + '</span><h1>Votre audit en ' + nImg + (lg() === 'fr' ? '\u00a0' : ' ') + 'image' + (nImg > 1 ? 's' : '') + '</h1><p><span class="rc-m">Faites défiler : chaque image se joue quand elle arrive.</span><span class="rc-l">' + motN.charAt(0).toUpperCase() + motN.slice(1) + ', une idée chacune, toutes calculées avec vos chiffres.</span></p></header>' +
      '<div class="rc-navwrap"><div class="rc-nav" role="navigation" aria-label="Chapitres de l’audit">' + puces + '</div></div>' + corps;
    /* C301 (V15-080) : chaque montant est écrit dès le départ (l'animation repart de 0 à l'écran seulement) */
    [].forEach.call(box.querySelectorAll('[data-rc-count]'), function (x) { var v = Number(x.getAttribute('data-rc-count')); x.setAttribute('data-vd-compteur', '1'); if (isFinite(v)) x.textContent = x.hasAttribute('data-rc-eur') ? eur(v) : String(Math.round(v)); });
    traduire(box); /* C407 (décision 41) */
    RENDU_RC = performance.now();
    var wrap = body.querySelector('.au-wrap') || body;
    if (box.parentNode !== wrap || wrap.firstChild !== box) wrap.insertBefore(box, wrap.firstChild);
    [].forEach.call(box.querySelectorAll('[data-rc-go]'), function (b) {
      b.onclick = function () {
        var g = b.getAttribute('data-rc-go'), V = w.VerdictGainRealiste;
        if (g === 'simuler') { if (V && V.ouvrirSimuler) V.ouvrirSimuler(); else w.go('dec'); }
        else if (g === 'actions') w.go('priorities');
        else if (w.VerdictLecteur) w.VerdictLecteur.ouvrir('les preuves'); /* C99 : lecteur premium */
        else { var d = doc.querySelector('[data-audit-full-report]'); if (d) { d.open = true; d.scrollIntoView({ behavior: REDUIT ? 'auto' : 'smooth', block: 'start' }); } }
      };
    });
    var cartes = box.querySelectorAll('.rc-card');
    grandEcran(box, cartes);
    if (!('IntersectionObserver' in w) || REDUIT) { [].forEach.call(cartes, jouer); return; }
    /* C103 : la première image se joue dès qu'elle est un peu visible (à l'ouverture de l'Audit, elle n'est visible
       qu'à 40-47 % sous la barre du bas : au seuil de 45 % elle restait parfois vide). */
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { jouer(e.target); io.unobserve(e.target); } }); }, { threshold: 0, rootMargin: '0px 0px 100% 0px' } /* C350 (décision 27) : jouée un écran avant d'arriver, jamais vide à l'écran */);
    [].forEach.call(cartes, function (c) { io.observe(c); });
  }

  var css = doc.createElement('style'); css.id = 'audit-recit-a27';
  var E = 'cubic-bezier(.23,1,.32,1)';
  css.textContent =
    '#auditBody .av31{display:none!important}html:has(#vdRecit) [data-audit-visual-story]{display:none!important}' + /* C311 (V16-012) : une seule version visuelle de l'Audit */
    '#vdRecit{margin:4px 0 26px;font-family:-apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif}' +
    '#vdRecit .rc-head{padding:6px 4px 14px;color:#101214}#vdRecit .rc-head>span{font:800 11.5px/1 -apple-system,system-ui;letter-spacing:.14em;text-transform:uppercase;color:#16a34a}' +
    '#vdRecit .rc-head h1{margin:8px 0 6px;font:900 32px/1.05 -apple-system,system-ui;letter-spacing:-.025em}#vdRecit .rc-head p{margin:0;color:#5f6670;font-size:14.5px}' +
    'html.vd-workspace-dark #vdRecit .rc-head{color:#f1f5f9}html.vd-workspace-dark #vdRecit .rc-head p{color:#94a3b8}' +
    '#vdRecit .rc-card{position:relative;overflow:hidden;min-height:min(68vh,580px);margin:0 0 16px;padding:26px 22px 22px;border-radius:28px;color:#f8fafc;display:flex;flex-direction:column;justify-content:center;gap:14px;scroll-snap-align:start;box-shadow:0 22px 60px rgba(2,8,23,.28);isolation:isolate}' +
    '#vdRecit .rc-card:before{content:"";position:absolute;inset:-40%;z-index:-1;background:radial-gradient(circle at 75% 20%,var(--g1),transparent 45%),radial-gradient(circle at 15% 85%,var(--g2),transparent 50%);opacity:.9}' +
    '#vdRecit .rc-c1{background:#07130d;--g1:rgba(34,197,94,.35);--g2:rgba(16,185,129,.18)}#vdRecit .rc-c2{background:#0b1120;--g1:rgba(96,165,250,.32);--g2:rgba(192,132,252,.22)}' +
    '#vdRecit .rc-c3{background:#140f05;--g1:rgba(245,158,11,.34);--g2:rgba(234,179,8,.16)}#vdRecit .rc-c4{background:#160a10;--g1:rgba(239,68,68,.32);--g2:rgba(245,158,11,.18)}' +
    '#vdRecit .rc-c5{background:#06120f;--g1:rgba(52,211,153,.32);--g2:rgba(250,204,21,.22)}#vdRecit .rc-c6{background:#0a0a0a;--g1:rgba(250,204,21,.30);--g2:rgba(34,197,94,.24)}' +
    '#vdRecit .rc-k{font:800 12px/1 -apple-system,system-ui;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.72)}' +
    '#vdRecit h2{margin:0;font:900 clamp(28px,7.4vw,44px)/1.04 -apple-system,system-ui;letter-spacing:-.03em;color:#fff}' +
    '#vdRecit .rc-p{margin:0;color:rgba(248,250,252,.82);font-size:16px;line-height:1.4}#vdRecit .rc-p b{color:#fff}' +
    '#vdRecit .rc-big{margin:4px 0 0;display:flex;flex-direction:column;gap:6px}#vdRecit .rc-big b{font:900 clamp(40px,11vw,64px)/1 -apple-system,system-ui;letter-spacing:-.035em;font-variant-numeric:tabular-nums;color:#fff}' +
    '#vdRecit .rc-big small{font-size:14.5px;color:rgba(248,250,252,.78)}' +
    '#vdRecit .rc-suite{margin-top:6px;padding-top:8px;font:700 13px/1 -apple-system,system-ui;color:rgba(255,255,255,.62);animation:rcBouge 1.8s ease-in-out 2}/* C412 : jamais sans fin */' +
    '@keyframes rcBouge{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}' +
    /* entrées */
    '/* décision 27 bis */#vdRecit .rc-card>*{opacity:.6;transform:translateY(6px);transition:opacity .2s ' + E + ',transform .2s ' + E + '}' +
    '#vdRecit .rc-card.rc-on>*{opacity:1;transform:none}#vdRecit .rc-card.rc-on>*:nth-child(2){transition-delay:.01s}#vdRecit .rc-card.rc-on>*:nth-child(3){transition-delay:.02s}#vdRecit .rc-card.rc-on>*:nth-child(4){transition-delay:.03s}#vdRecit .rc-card.rc-on>*:nth-child(5){transition-delay:.04s}#vdRecit .rc-card.rc-on>*:nth-child(n+6){transition-delay:.05s}' +
    /* 1 · anneau */
    '#vdRecit .rc-dial{position:relative;width:180px;height:180px;margin:4px auto 0}#vdRecit .rc-ring{width:100%;height:100%;transform:rotate(-90deg)}' +
    '#vdRecit .rc-ring-bg{fill:none;stroke:rgba(255,255,255,.12);stroke-width:14}#vdRecit .rc-ring-arc{fill:none;stroke-width:14;stroke-linecap:round;stroke-dashoffset:var(--rc-len);transition:stroke-dashoffset 1.2s ' + E + ' .2s;filter:drop-shadow(0 0 10px currentColor)}' +
    '#vdRecit .rc-on .rc-ring-arc{stroke-dashoffset:var(--rc-off)}' +
    '#vdRecit .rc-dial-n{position:absolute;inset:0;display:flex;align-items:baseline;justify-content:center;padding-top:62px}#vdRecit .rc-dial-n b{font:900 56px/1 -apple-system,system-ui;font-variant-numeric:tabular-nums}#vdRecit .rc-dial-n small{font-size:16px;color:rgba(255,255,255,.7);margin-left:3px}' +
    /* 2 · barre empilée */
    /* C97 — la barre se remplit d'un seul geste (aucun trou entre segments), légende en une colonne. */
    '#vdRecit .rc-stack{display:flex;height:34px;border-radius:12px;overflow:hidden;background:rgba(255,255,255,.08);clip-path:inset(0 100% 0 0 round 12px);transition:clip-path 1.1s ' + E + ' .2s}' +
    '#vdRecit .rc-stack i{display:block;height:100%;flex:0 0 var(--w);background:var(--c)}#vdRecit .rc-stack i+i{box-shadow:inset 2px 0 0 rgba(0,0,0,.18)}' +
    '#vdRecit .rc-on .rc-stack{clip-path:inset(0 0 0 0 round 12px)}#vdRecit .rc-stack .rc-res{background:linear-gradient(90deg,#16a34a,#4ade80)}' +
    '#vdRecit .rc-leg{list-style:none;margin:0;padding:0;display:grid;gap:0}#vdRecit .rc-leg li{display:flex;align-items:center;gap:10px;min-height:38px;font-size:15px;color:rgba(248,250,252,.85);border-bottom:1px solid rgba(255,255,255,.08)}' +
    '#vdRecit .rc-leg li:last-child{border-bottom:0;color:#fff;font-weight:700}#vdRecit .rc-leg li:last-child b{color:#4ade80;font-size:17px}#vdRecit .rc-leg li.rc-neg:last-child b{color:#f87171}' +
    '#vdRecit .rc-leg li i{width:12px;height:12px;border-radius:4px;flex:0 0 12px}#vdRecit .rc-leg li b{margin-left:auto;white-space:nowrap;font-variant-numeric:tabular-nums;color:#fff}' +
    /* 3 · jauge */
    '#vdRecit .rc-track{position:relative;height:18px;border-radius:9px;background:rgba(255,255,255,.1);margin:22px 0 10px}' +
    '#vdRecit .rc-track>i{position:absolute;left:0;top:0;bottom:0;width:var(--w);border-radius:9px;background:linear-gradient(90deg,#f59e0b,#facc15);transform:scaleX(0);transform-origin:left;transition:transform 1s ' + E + ' .25s}' +
    '#vdRecit .rc-on .rc-track>i{transform:scaleX(1)}#vdRecit .rc-mark{position:absolute;left:var(--x);top:-8px;bottom:-8px;width:3px;margin-left:-1px;background:#fff;border-radius:2px}' +
    '#vdRecit .rc-mark b{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);padding-bottom:4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.8);white-space:nowrap}' +
    '#vdRecit .rc-gauge-l{display:flex;justify-content:space-between;font-size:13.5px;color:rgba(248,250,252,.8)}' +
    /* 4 · fuites */
    '#vdRecit .rc-leaks{list-style:none;margin:0;padding:0;display:grid;gap:10px}' +
    '#vdRecit .rc-leaks li{display:flex;align-items:center;gap:12px;padding:14px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);transform:translateX(-6px);opacity:.6;transition:transform .2s ' + E + ',opacity .2s ' + E + ';transition-delay:min(calc(var(--i)*.02s),.05s)}' +
    '#vdRecit .rc-on .rc-leaks li{transform:none;opacity:1}#vdRecit .rc-n{flex:0 0 30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(239,68,68,.22);color:#fca5a5;font-weight:900}' +
    '#vdRecit .rc-leaks li div{flex:1;min-width:0}#vdRecit .rc-leaks li div b{display:block;color:#fff;font-size:16px;overflow-wrap:anywhere;-webkit-hyphens:auto;hyphens:auto}#vdRecit .rc-leaks li div small{color:rgba(248,250,252,.7);font-size:13px}' +
    '#vdRecit .rc-leaks strong{text-align:right;color:#fde68a;font:900 20px/1.1 -apple-system,system-ui;font-variant-numeric:tabular-nums;white-space:nowrap}#vdRecit .rc-leaks strong em{font-style:normal}#vdRecit .rc-fuite .rc-n{background:rgba(249,115,22,.28);color:#fdba74}#vdRecit .rc-leaks .rc-fuite strong{color:#fdba74}#vdRecit .rc-leaks strong small{display:block;font-size:11.5px;color:rgba(253,230,138,.75)}' +
    /* 5 · cascade */
    '#vdRecit .rc-wf{list-style:none;margin:0 0 26px;padding:0;display:grid;gap:14px}' +
    '#vdRecit .rc-wf-row{display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:4px 10px;opacity:.6;transform:translateY(4px);transition:opacity .2s ' + E + ',transform .2s ' + E + ';transition-delay:min(calc(var(--i)*.02s),.05s)}' +
    '#vdRecit .rc-wf-l{font-size:14px;line-height:1.25;color:rgba(248,250,252,.82);min-width:0;overflow-wrap:anywhere}#vdRecit .rc-wf-v{font:800 15px/1.1 -apple-system,system-ui;font-variant-numeric:tabular-nums;color:#f8fafc}' +
    '#vdRecit .rc-wf-row.gain .rc-wf-v{color:#6ee7b7}#vdRecit .rc-wf-row.cible .rc-wf-v{color:#fde68a;font-size:17px}' +
    '#vdRecit .rc-wf-track{grid-column:1/-1;position:relative;height:14px;border-radius:7px;background:rgba(255,255,255,.07)}' +
    '#vdRecit .rc-wf-bar{position:absolute;top:0;bottom:0;left:var(--g);width:var(--l);border-radius:7px;background:linear-gradient(90deg,#059669,#34d399);transform:scaleX(0);transform-origin:left;transition:transform .6s ' + E + ';transition-delay:calc(var(--i)*.16s + .25s)}' +
    '#vdRecit .rc-wf-row.base .rc-wf-bar{background:linear-gradient(90deg,#64748b,#94a3b8)}#vdRecit .rc-wf-row.cible .rc-wf-track{height:18px;border-radius:9px}#vdRecit .rc-wf-row.cible .rc-wf-bar{border-radius:9px;background:linear-gradient(90deg,#d4a017,#fde68a);box-shadow:0 0 18px rgba(250,204,21,.45)}' +
    '#vdRecit .rc-wf-row.cible{padding-top:12px;border-top:1px solid rgba(255,255,255,.14)}' +
    '#vdRecit .rc-on .rc-wf-row{opacity:1;transform:none}#vdRecit .rc-on .rc-wf-bar{transform:scaleX(1)}' +
    /* 6 · appel */
    '#vdRecit .rc-cta{min-height:60px;border:0;border-radius:18px;background:linear-gradient(180deg,#22c55e,#16a34a);color:#05100a!important;-webkit-text-fill-color:#05100a;font:900 18px/1 -apple-system,system-ui;cursor:pointer;box-shadow:0 14px 34px rgba(22,163,74,.45)}' /* C421 (A70) : texte #05100a (≈ 9:1 sur le vert, comme .av31-primary) ; en blanc (2,3:1), contraste-a44 l'assombrissait en gris rgb(56,56,56) */ +
    'html:not(.vd-workspace-light) #auditBody .au-card[data-audit-language]{background:rgba(255,255,255,.06)!important;border-color:rgba(255,255,255,.12)!important;border-left-color:#eab308!important;box-shadow:none!important;color:#e5e7eb!important}' +
    'html:not(.vd-workspace-light) #auditBody .au-card[data-audit-language] .au-k{color:#fcd34d!important}html:not(.vd-workspace-light) #auditBody .au-card[data-audit-language] .au-p{color:#e5e7eb!important}' /* C447 (A63) : encart de langue sombre en thème sombre ; le clair ne change pas */ +
    '#vdRecit .rc-on .rc-cta{animation:rcHalo 1.9s ease-out .6s 3}@keyframes rcHalo{0%{box-shadow:0 0 0 0 rgba(34,197,94,.6),0 14px 34px rgba(22,163,74,.45)}70%{box-shadow:0 0 0 16px rgba(34,197,94,0),0 14px 34px rgba(22,163,74,.45)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0),0 14px 34px rgba(22,163,74,.45)}}' +
    '#vdRecit .rc-cta2{display:flex;gap:10px}#vdRecit .rc-cta2 button{flex:1;min-height:50px;border-radius:16px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;font:800 15px/1 -apple-system,system-ui;cursor:pointer}' +
    '#vdRecit .rc-navwrap,#vdRecit .rc-l,#vdRecit .rc-stack i>span{display:none}' +
    /* C98 — Tablette et grand écran : mises en page horizontales propres à l'écran large. */
    /* C472 (décision 56, contrôle visuel de l'Audit) — téléphone d'abord ; le grand écran garde ses règles */
    '@media (max-width:767px){html #v-audit{padding-top:8px!important}}' +
    /* C490 (décision 63, point 1) : sur téléphone, plus aucune marge du dossier ivoire avant le surtitre (≈ 18 px sous les onglets, comme Structure) */
    '@media (max-width:767px){html #v-audit #auditBody{padding-top:0}html #v-audit #vdRecit{margin-top:0}}' +
    /* C490 (défaut 19) : le panneau finit arrondi, plus de coin carré au-dessus de la barre ; (défaut 10) sous-titre sans mot orphelin */
    'html #v-audit #auditBody{border-radius:24px;margin-bottom:16px}#vdRecit .rc-head p{text-wrap:pretty}' +
    '#vdRecit .rc-head h1{text-wrap:balance}html.vd-workspace-light #vdRecit .rc-head>span{color:#15803d}' +
    '#vdRecit .rc-mark b{background:rgba(12,10,6,.74);border-radius:6px;padding:2px 6px;margin-bottom:5px;color:rgba(255,255,255,.92)}' +
    '#vdRecit .rc-leaks li div b{overflow-wrap:break-word;-webkit-hyphens:manual;hyphens:manual;line-height:1.25}' +
    '@media (max-width:699px){' +
      '#vdRecit .rc-leaks li{display:grid;grid-template-columns:30px minmax(0,1fr) auto;column-gap:12px;row-gap:4px;align-items:center}#vdRecit .rc-leaks li>div{display:contents}' +
      '#vdRecit .rc-leaks li>.rc-n{grid-column:1;grid-row:1}#vdRecit .rc-leaks li>div>b{grid-column:2;grid-row:1}#vdRecit .rc-leaks li>strong{grid-column:3;grid-row:1}#vdRecit .rc-leaks li>div>small{grid-column:2/4;grid-row:2}' +
      '#vdRecit .rc-leaks li.rc-fuite{align-items:start}#vdRecit .rc-leaks li.rc-fuite>.rc-n{align-self:center}#vdRecit .rc-leaks li.rc-fuite>div>b{grid-column:2/4}#vdRecit .rc-leaks li.rc-fuite>strong{grid-column:2/4;grid-row:3;text-align:left}#vdRecit .rc-leaks li.rc-fuite>strong small{display:inline;margin-left:5px}' +
      '#vdRecit .rc-card{min-height:0;justify-content:flex-start;scroll-margin-top:12px}' +
    '}' +
    '@media (max-width:767px){html #c360Som .c360-som-l{grid-template-columns:24px minmax(0,1fr) 12px;column-gap:10px;row-gap:1px;align-items:center}html #c360Som .c360-som-t{display:contents}html #c360Som .c360-som-n{grid-row:1/4;grid-column:1}html #c360Som .c360-som-t b{grid-row:1;grid-column:2;min-width:0}html #c360Som .c360-som-v{grid-row:2;grid-column:2;justify-self:start;text-align:left;font-size:13px;max-width:none;overflow:visible;text-overflow:clip;white-space:normal}html #c360Som .c360-som-v:empty{display:none}html #c360Som .c360-som-t small{grid-row:3;grid-column:2;white-space:normal;overflow:visible;text-overflow:clip}html #c360Som .c360-chev{grid-row:1/4;grid-column:3}}html #c360Som .c360-som-l{column-gap:6px}html #c360Som .c360-som-v{font-size:13px}html.vd-workspace-light #c360Som .c360-som-l{border-top-color:rgba(16,18,20,.12)}' +
    '@media (min-width:700px){' +
      '#vdRecit{max-width:880px;margin-left:auto;margin-right:auto}#vdRecit .rc-m{display:none}#vdRecit .rc-l{display:inline}#vdRecit .rc-suite{display:none}' +
      '#vdRecit .rc-head{padding:10px 4px 16px}#vdRecit .rc-head h1{font-size:44px}#vdRecit .rc-head p{font-size:16px}' +
      /* C100 — bandeau plein de la couleur de la page, collé sous la barre du haut : le texte ne défile plus entre les deux */
      '#vdRecit{--rc-shelf:#f3f5f7}html.vd-workspace-dark #vdRecit{--rc-shelf:#0b0f14}' +
      '#vdRecit .rc-navwrap{order:0;display:block;position:sticky;top:max(var(--rc-top,0px),env(safe-area-inset-top,0px));z-index:4;margin:0 0 10px;padding:10px 0 12px;background:var(--rc-shelf);box-shadow:0 0 0 100vmax var(--rc-shelf);clip-path:inset(0 -100vmax)}' +
      '#vdRecit .rc-nav{display:flex;gap:8px;padding:6px;border-radius:18px;background:#ffffff;border:1px solid #e3e8ee;box-shadow:0 10px 30px rgba(15,23,42,.10);overflow-x:auto;scrollbar-width:none}' +
      '#vdRecit .rc-nav::-webkit-scrollbar{display:none}' +
      '#vdRecit .rc-nav button{flex:1 0 auto;display:flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 14px;border:0;border-radius:13px;background:transparent;color:#475569;font:700 14px/1 -apple-system,system-ui;cursor:pointer;white-space:nowrap;transition:background .25s,color .25s}' +
      '#vdRecit .rc-nav button i{font-style:normal;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#eef2f6;color:#334155;font-size:12px;font-weight:800}' +
      '#vdRecit .rc-nav button[aria-current]{background:#0f172a;color:#fff}#vdRecit .rc-nav button[aria-current] i{background:#22c55e;color:#fff}' +
      'html.vd-workspace-dark #vdRecit .rc-nav{background:#11161d;border-color:#222b36;box-shadow:0 12px 34px rgba(0,0,0,.45)}html.vd-workspace-dark #vdRecit .rc-nav button{color:#cbd5e1}' +
      'html.vd-workspace-dark #vdRecit .rc-nav button i{background:#1e2733;color:#e2e8f0}html.vd-workspace-dark #vdRecit .rc-nav button[aria-current]{background:#f8fafc;color:#0b0f14}' +
      '#vdRecit .rc-card{min-height:0;padding:38px 42px;border-radius:32px;margin:0 0 20px;scroll-margin-top:calc(var(--rc-top,0px) + 92px)}' +
      '#vdRecit .rc-c1{display:grid;grid-template-columns:minmax(0,1fr) 230px;grid-template-areas:"k d" "h d" "b d" "p d";gap:14px 40px;align-content:center;align-items:center}' +
      '#vdRecit .rc-c1>.rc-k{grid-area:k}#vdRecit .rc-c1>h2{grid-area:h}#vdRecit .rc-c1>.rc-big{grid-area:b}#vdRecit .rc-c1>.rc-p{grid-area:p}#vdRecit .rc-c1>.rc-dial{grid-area:d;width:230px;height:230px;margin:0}' +
      '#vdRecit .rc-c1 .rc-dial-n{padding-top:86px}#vdRecit .rc-c1 .rc-dial-n b{font-size:64px}' +
      '#vdRecit .rc-stack{height:66px;border-radius:16px;clip-path:inset(0 100% 0 0 round 16px)}#vdRecit .rc-on .rc-stack{clip-path:inset(0 0 0 0 round 16px)}' +
      '#vdRecit .rc-stack i>span{display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 12px;overflow:hidden;white-space:nowrap;color:#0b1120;font:800 17px/1.1 -apple-system,system-ui;font-variant-numeric:tabular-nums}' +
      '#vdRecit .rc-stack i>span small{font:700 11px/1.2 -apple-system,system-ui;letter-spacing:.06em;text-transform:uppercase;opacity:.72;overflow:hidden;text-overflow:ellipsis}' +
      '#vdRecit .rc-leg{grid-template-columns:1fr 1fr;column-gap:28px}#vdRecit .rc-leg li:last-child{grid-column:1/-1}' +
      '#vdRecit .rc-c5{display:grid;grid-template-columns:minmax(0,1fr) 250px;grid-template-areas:"k k" "h h" "w b";gap:14px 40px;align-items:center}' +
      '#vdRecit .rc-c5>.rc-k{grid-area:k}#vdRecit .rc-c5>h2{grid-area:h}#vdRecit .rc-c5>.rc-wf{grid-area:w;margin:10px 0 0}#vdRecit .rc-c5>.rc-big{grid-area:b;margin:0}' +
      '#vdRecit .rc-wf-row{grid-template-columns:150px minmax(0,1fr) 104px;grid-template-areas:"l t v";align-items:center;gap:0 16px}' +
      '#vdRecit .rc-wf-l{grid-area:l}#vdRecit .rc-wf-track{grid-area:t;grid-column:auto}#vdRecit .rc-wf-v{grid-area:v;text-align:right}' +
      '#vdRecit .rc-c6{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,380px);grid-template-areas:"k c" "h c" "p c2";gap:12px 44px;align-items:center}' +
      '#vdRecit .rc-c6>.rc-k{grid-area:k}#vdRecit .rc-c6>h2{grid-area:h}#vdRecit .rc-c6>.rc-p{grid-area:p}#vdRecit .rc-c6>.rc-cta{grid-area:c;align-self:end}#vdRecit .rc-c6>.rc-cta2{grid-area:c2;align-self:start}' +
    '}' +
    /* Mac et iPad à l'horizontale : mosaïque sur 12 colonnes. */
    '@media (min-width:1100px){' +
      '#vdRecit{max-width:1240px;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:22px;align-items:stretch}#vdRecit .rc-head,#vdRecit .rc-navwrap{grid-column:1/-1;margin:0}' +
      '#vdRecit .rc-card{margin:0}#vdRecit .rc-c1,#vdRecit .rc-c6{grid-column:1/-1}' +
      '#vdRecit .rc-c2{grid-column:span 7}#vdRecit .rc-c3{grid-column:span 5}#vdRecit .rc-c4{grid-column:span 5}#vdRecit .rc-c5{grid-column:span 7}' +
      '#vdRecit .rc-c1{min-height:340px;grid-template-columns:minmax(0,1fr) 270px;padding:46px 56px}#vdRecit .rc-c1>.rc-dial{width:270px;height:270px}#vdRecit .rc-c1 .rc-dial-n{padding-top:100px}#vdRecit .rc-c1 .rc-dial-n b{font-size:76px}' +
      '#vdRecit .rc-c1>h2{font-size:56px}#vdRecit .rc-c1 .rc-big b{font-size:72px}' +
      '#vdRecit .rc-c5{grid-template-columns:1fr;grid-template-areas:"k" "h" "w" "b"}#vdRecit .rc-c5 .rc-big b{font-size:52px}' +
      '#vdRecit .rc-c6{padding:34px 56px}' +
    '}' +
    /* À la souris : lumière qui suit le pointeur, carte qui se soulève légèrement. */
    '@media (hover:hover) and (pointer:fine) and (min-width:700px){' +
      '#vdRecit .rc-card{transition:transform .35s ' + E + ',box-shadow .35s ' + E + '}#vdRecit .rc-card:hover{transform:translateY(-3px);box-shadow:0 30px 70px rgba(2,8,23,.34)}' +
      '#vdRecit .rc-card:after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(520px circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.09),transparent 62%);opacity:0;transition:opacity .35s}' +
      '#vdRecit .rc-card:hover:after{opacity:1}#vdRecit .rc-nav button:not([aria-current]):hover{background:rgba(148,163,184,.14)}' +
      '#vdRecit .rc-leaks li{cursor:default}#vdRecit .rc-on .rc-leaks li:hover{background:rgba(255,255,255,.11)}#vdRecit .rc-cta:hover{filter:brightness(1.06)}#vdRecit .rc-cta2 button:hover{background:rgba(255,255,255,.14)}' +
    '}' +
    '@media (prefers-reduced-motion:reduce){#vdRecit *{transition:none!important;animation:none!important}#vdRecit .rc-card>*{opacity:1;transform:none}}';
  (doc.head || doc.documentElement).appendChild(css);

  w.VerdictRecit = { monter: monter }; /* C99 : appelé dans la même image que l'Audit (plus de flash de l'ancien) */

  /* C249 (reste de C208) : le chapitre « Diagnostic Carte » de l'analyse complète classait les 3 plus faibles contributions
     de toute la carte, catégories mélangées (une assiette de fromages comparée à un plat). Il montre désormais, pour chaque
     catégorie d'au moins 2 plats vendus, le plat qui contribue le moins, et le titre le dit. Même calcul que l'Audit
     (contribution pondérée × ventes du mois) ; seules la sélection et la phrase changent. */
  function faiblesParCategorie() {
    var D = w.DB, parCat = {};
    if (!D || !Array.isArray(D.plats) || typeof w.platCalc !== 'function') return null;
    D.plats.forEach(function (p) {
      var vol = +p.vol || 0; if (vol <= 0) return;
      var k = null; try { k = w.platCalc(p); } catch (e) {} if (!k || !k.complete) return;
      var cat = String(p.cat || 'Autres'); (parCat[cat] = parCat[cat] || []).push({ nom: p.nom || 'Plat', cat: cat, vol: vol, marge: k.contribPct, contrib: k.contribPond * vol });
    });
    var out = [];
    Object.keys(parCat).forEach(function (cat) { var L = parCat[cat]; if (L.length < 2) return; L.sort(function (a, b) { return a.contrib - b.contrib; }); var x = L[0]; out.push({ nom: x.nom + ' · ' + cat, cat: cat, vol: x.vol, marge: x.marge, contrib: x.contrib }); });
    out.sort(function (a, b) { return a.contrib - b.contrib; });
    return out.slice(0, 3);
  }
  (function brancherFaibles(n) {
    var calc = w.auditPremiumCalc, html = w.auCartePremiumHTML;
    if (typeof calc !== 'function' || typeof html !== 'function') { if (n > 0) setTimeout(function () { brancherFaibles(n - 1); }, 250); return; }
    if (!calc.__c249) {
      var c249 = function () { var r = calc.apply(this, arguments); try { if (r && r.carte && r.carte.ok) { var f = faiblesParCategorie(); if (f) r.carte.weak = f; } } catch (e) {} return r; };
      c249.__c249 = true; for (var k in calc) { try { c249[k] = calc[k]; } catch (e) {} } w.auditPremiumCalc = c249;
    }
    if (!html.__c249) {
      var h249 = function () { var r = html.apply(this, arguments); try { r = String(r).replace('Contributions les plus faibles à revoir', 'La plus faible contribution de chaque catégorie, à revoir'); } catch (e) {} return r; };
      h249.__c249 = true; w.auCartePremiumHTML = h249;
    }
  })(40);
  var attente = 0;
  function planifier() { clearTimeout(attente); attente = setTimeout(monter, 60); }
  try { var a = doc.getElementById('v-audit'); if (a) new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t && t.closest && t.closest('#vdRecit')) continue;
    /* C342 (décision 27) : l'Audit vient d'être dessiné sans son récit (banc L6 : #vdRecit absent ≈ 650 ms, la minuterie de 60 ms glissait
       sous la charge) : le récit est posé ici même, avant le dessin de l'image ; les mises à jour suivantes restent groupées (60 ms). */
    if (!doc.getElementById('vdRecit')) { clearTimeout(attente); try { monter(); } catch (e) {} if (doc.getElementById('vdRecit')) return; } return planifier(); } }).observe(a, { childList: true, subtree: true }); } catch (e) {}
  if (w.VIEW === 'audit') planifier(); /* C103 : rien au lancement quand l'Audit est caché */
})();
