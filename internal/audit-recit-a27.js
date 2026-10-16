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
  function eur(v) { return Math.round(Number(v) || 0).toLocaleString('fr-FR') + ' €'; }
  function pct(v) { return (Number(v) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function ton(rn) { return rn < 0 ? 'Votre structure perd de l’argent' : rn < 5 ? 'Rentable, mais fragile' : rn < 8 ? 'Rentable, sans matelas' : 'Une structure solide'; }
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
    var leviers = (G && G.leviers || []).slice(0, 8);
    return {
      R: R, ca: num(d.ca), res: num(d.res), rn: rn, score: Math.round(num(R.score)), postes: postes,
      mini: mini, securite: isFinite(Number(seuil.securiteEur)) ? Number(seuil.securiteEur) : num(d.ca) - mini,
      leviers: leviers, cible: G && G.max ? num(G.max.res) : null, cibleScore: G && G.max ? Math.round(num(G.max.score)) : null,
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
    t.push('<section class="rc-card rc-c1" data-rc="1"><span class="rc-k">1 · Le verdict</span><h2>' + esc(ton(D.rn)) + '</h2>' +
      '<div class="rc-dial">' + anneau(D.score, col) + '<div class="rc-dial-n"><b data-rc-count="' + D.score + '">0</b><small>/100</small></div></div>' +
      '<p class="rc-big"><b data-rc-count="' + Math.round(D.res) + '" data-rc-eur>0 €</b><small>de résultat sur un an · marge ' + pct(D.rn) + '</small></p>' +
      '<p class="rc-p">Indice de sérénité Verdict, calculé avec vos chiffres.</p><span class="rc-suite">Voir où part l’argent ↓</span></section>');
    /* 2 · Où part chaque 100 € */
    /* C98 — sur grand écran, chaque segment assez large porte son nom et son montant. */
    function dedans(l, v) { return v >= 9 ? '<span><small>' + esc(l) + '</small>' + (Math.round(v * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' €</span>' : ''; }
    var seg = D.postes.map(function (x, i) { return '<i style="--w:' + Math.max(0, x.v).toFixed(2) + '%;--c:' + x.c + ';--i:' + i + '">' + dedans(x.l, x.v) + '</i>'; }).join('') +
      (D.rn > 0 ? '<i class="rc-res" style="--w:' + D.rn.toFixed(2) + '%;--c:#22c55e;--i:' + D.postes.length + '">' + dedans('Reste avant impôt', D.rn) + '</i>' : '');
    var leg = D.postes.map(function (x) { return '<li><i style="background:' + x.c + '"></i>' + esc(x.l) + '<b>' + (Math.round(x.v * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' €</b></li>'; }).join('') +
      '<li><i style="background:' + (D.rn > 0 ? '#22c55e' : '#ef4444') + '"></i>' + (D.rn >= 0 ? 'Reste avant impôt' : 'Il manque') + '<b>' + (D.rn >= 0 ? '' : '−') + Math.abs(Math.round(D.rn * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' €</b></li>';
    t.push('<section class="rc-card rc-c2" data-rc="2"><span class="rc-k">2 · Où part l’argent</span><h2>Sur chaque 100 € encaissés</h2>' +
      '<div class="rc-stack">' + seg + '</div><ul class="rc-leg">' + leg + '</ul>' +
      '<p class="rc-p">' + (D.postes[0] ? 'Le premier poste est <b>' + esc(D.postes.slice().sort(function (a, b) { return b.v - a.v; })[0].l.toLowerCase()) + '</b>.' : '') + '</p><span class="rc-suite">Votre seuil ↓</span></section>');
    /* 3 · Le seuil */
    if (D.mini > 0) {
      var echelle = Math.max(D.ca, D.mini) * 1.08, pc = D.ca / echelle * 100, pm = D.mini / echelle * 100, ok = D.securite >= 0;
      t.push('<section class="rc-card rc-c3" data-rc="3"><span class="rc-k">3 · Le seuil</span><h2>' + (ok ? 'Vous passez le seuil' : 'Le seuil n’est pas atteint') + '</h2>' +
        '<div class="rc-gauge"><div class="rc-track"><i style="--w:' + pc.toFixed(2) + '%"></i><span class="rc-mark" style="--x:' + pm.toFixed(2) + '%"><b>minimum</b></span></div>' +
        '<div class="rc-gauge-l"><span>Minimum ' + eur(D.mini) + '</span><span>Réalisé ' + eur(D.ca) + '</span></div></div>' +
        '<p class="rc-big"><b data-rc-count="' + Math.round(Math.abs(D.securite)) + '" data-rc-eur>0 €</b><small>' + (ok ? 'de marge de sécurité sur un an' : 'à aller chercher sur un an') + '</small></p>' +
        '<span class="rc-suite">Vos fuites ↓</span></section>');
    }
    /* 4 · Les fuites */
    if (D.leviers.length) {
      var fuites = D.leviers.map(function (x, i) {
        return '<li style="--i:' + i + '"><span class="rc-n">' + (i + 1) + '</span><div><b>' + esc(x.n) + '</b><small>' + esc(x.vers || '') + '</small></div><strong>+<em data-rc-count="' + Math.round(x.gain) + '" data-rc-eur>0 €</em><small>/ an</small></strong></li>';
      }).join('');
      t.push('<section class="rc-card rc-c4" data-rc="4"><span class="rc-k">4 · Vos fuites</span><h2>L’argent qui s’échappe</h2><ol class="rc-leaks">' + fuites + '</ol>' +
        '<p class="rc-p">Montants réalistes pour votre format, calculés comme dans Simuler.</p><span class="rc-suite">Comment remonter ↓</span></section>');
    }
    /* 5 · Comment remonter : cascade du résultat */
    if (D.leviers.length && D.cible != null) {
      var pas = [{ l: 'Aujourd’hui', v: D.res, base: true }];
      D.leviers.forEach(function (x) { pas.push({ l: x.n, v: x.gain }); });
      /* C97 — Cascade horizontale (lisible sur iPhone), échelle depuis 0 sans coupure, chaque barre chiffrée. */
      var bornes = [0, D.res, D.cible], cumul = D.res, barres = '';
      D.leviers.forEach(function (x) { cumul += x.gain; bornes.push(cumul); });
      var lo = Math.min.apply(null, bornes), hi = Math.max.apply(null, bornes), plage = Math.max(1, hi - lo);
      function ligne(i, cls, lib, val, a, z) {
        var g = (Math.min(a, z) - lo) / plage * 100, l = Math.max(1.6, Math.abs(z - a) / plage * 100);
        return '<li class="rc-wf-row ' + cls + '" style="--i:' + i + '"><span class="rc-wf-l">' + esc(lib) + '</span><b class="rc-wf-v">' + val + '</b>' +
          '<span class="rc-wf-track"><i class="rc-wf-bar" style="--g:' + g.toFixed(2) + '%;--l:' + Math.min(100 - g, l).toFixed(2) + '%"></i></span></li>';
      }
      cumul = D.res;
      pas.forEach(function (p, i) {
        if (p.base) { barres += ligne(i, 'base', p.l, eur(p.v), 0, p.v); return; }
        barres += ligne(i, 'gain', '+ ' + p.l, '+' + eur(p.v), cumul, cumul + p.v); cumul += p.v;
      });
      barres += ligne(pas.length, 'cible', 'Possible', eur(D.cible), 0, D.cible);
      t.push('<section class="rc-card rc-c5" data-rc="5"><span class="rc-k">5 · Comment remonter</span><h2>Votre résultat, levier par levier</h2>' +
        '<ol class="rc-wf">' + barres + '</ol>' +
        '<p class="rc-big"><b data-rc-count="' + Math.round(D.cible) + '" data-rc-eur>0 €</b><small>de résultat possible sur un an · ' + eur((D.cible - D.res) / 12) + ' de plus par mois</small></p>' +
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
  }
  function jouer(card) {
    if (card.classList.contains('rc-on')) return;
    card.classList.add('rc-on');
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
      p.onclick = function () { var c = box.querySelector('[data-rc="' + p.getAttribute('data-rc-nav') + '"]'); if (c) { jouer(c); c.scrollIntoView({ behavior: REDUIT ? 'auto' : 'smooth', block: 'start' }); } };
    });
    if ('IntersectionObserver' in w) {
      var suivi = new IntersectionObserver(function (es) {
        caler(); es.forEach(function (e) { if (!e.isIntersecting) return; var n = e.target.getAttribute('data-rc');
          [].forEach.call(puces, function (p) { if (p.getAttribute('data-rc-nav') === n) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current'); }); });
      }, { rootMargin: '-35% 0px -55% 0px' });
      [].forEach.call(cartes, function (c) { suivi.observe(c); });
    }
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
    var cle = [D.score, Math.round(D.res), Math.round(D.ca), D.leviers.length, D.cible].join('|');
    var box = doc.getElementById('vdRecit');
    if (box && box.getAttribute('data-cle') === cle && box.parentNode) return;
    if (!box) { box = doc.createElement('div'); box.id = 'vdRecit'; }
    box.setAttribute('data-cle', cle);
    var corps = tableaux(D), noms = { 1: 'Verdict', 2: 'Où part l’argent', 3: 'Seuil', 4: 'Fuites', 5: 'Remonter', 6: 'Prochain pas' }, puces = '';
    corps.replace(/data-rc="(\d)"/g, function (m, n) { puces += '<button type="button" data-rc-nav="' + n + '"><i>' + n + '</i>' + noms[n] + '</button>'; return m; });
    box.innerHTML = '<header class="rc-head"><span>Audit Verdict · ' + esc(D.nom) + '</span><h1>Votre audit en 6 images</h1><p><span class="rc-m">Faites défiler : chaque image se joue quand elle arrive.</span><span class="rc-l">Six images, une idée chacune, toutes calculées avec vos chiffres.</span></p></header>' +
      '<div class="rc-navwrap"><div class="rc-nav" role="navigation" aria-label="Chapitres de l’audit">' + puces + '</div></div>' + corps;
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
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && (e.intersectionRatio >= 0.45 || (e.target === cartes[0] && e.intersectionRatio >= 0.15))) { jouer(e.target); io.unobserve(e.target); } }); }, { threshold: [0.15, 0.45], rootMargin: '0px 0px -8% 0px' });
    [].forEach.call(cartes, function (c) { io.observe(c); });
  }

  var css = doc.createElement('style'); css.id = 'audit-recit-a27';
  var E = 'cubic-bezier(.23,1,.32,1)';
  css.textContent =
    '#auditBody .av31{display:none!important}' +
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
    '#vdRecit .rc-suite{margin-top:6px;padding-top:8px;font:700 13px/1 -apple-system,system-ui;color:rgba(255,255,255,.62);animation:rcBouge 1.8s ease-in-out infinite}' +
    '@keyframes rcBouge{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}' +
    /* entrées */
    '#vdRecit .rc-card>*{opacity:0;transform:translateY(16px);transition:opacity .55s ' + E + ',transform .55s ' + E + '}' +
    '#vdRecit .rc-card.rc-on>*{opacity:1;transform:none}#vdRecit .rc-card.rc-on>*:nth-child(2){transition-delay:.07s}#vdRecit .rc-card.rc-on>*:nth-child(3){transition-delay:.14s}#vdRecit .rc-card.rc-on>*:nth-child(4){transition-delay:.21s}#vdRecit .rc-card.rc-on>*:nth-child(5){transition-delay:.28s}#vdRecit .rc-card.rc-on>*:nth-child(n+6){transition-delay:.35s}' +
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
    '#vdRecit .rc-leg li:last-child{border-bottom:0;color:#fff;font-weight:700}#vdRecit .rc-leg li:last-child b{color:#4ade80;font-size:17px}' +
    '#vdRecit .rc-leg li i{width:12px;height:12px;border-radius:4px;flex:0 0 12px}#vdRecit .rc-leg li b{margin-left:auto;white-space:nowrap;font-variant-numeric:tabular-nums;color:#fff}' +
    /* 3 · jauge */
    '#vdRecit .rc-track{position:relative;height:18px;border-radius:9px;background:rgba(255,255,255,.1);margin:22px 0 10px}' +
    '#vdRecit .rc-track>i{position:absolute;left:0;top:0;bottom:0;width:var(--w);border-radius:9px;background:linear-gradient(90deg,#f59e0b,#facc15);transform:scaleX(0);transform-origin:left;transition:transform 1s ' + E + ' .25s}' +
    '#vdRecit .rc-on .rc-track>i{transform:scaleX(1)}#vdRecit .rc-mark{position:absolute;left:var(--x);top:-8px;bottom:-8px;width:3px;margin-left:-1px;background:#fff;border-radius:2px}' +
    '#vdRecit .rc-mark b{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);padding-bottom:4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.8);white-space:nowrap}' +
    '#vdRecit .rc-gauge-l{display:flex;justify-content:space-between;font-size:13.5px;color:rgba(248,250,252,.8)}' +
    /* 4 · fuites */
    '#vdRecit .rc-leaks{list-style:none;margin:0;padding:0;display:grid;gap:10px}' +
    '#vdRecit .rc-leaks li{display:flex;align-items:center;gap:12px;padding:14px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);transform:translateX(-12px);opacity:0;transition:transform .6s ' + E + ',opacity .6s ' + E + ';transition-delay:calc(var(--i)*.16s + .25s)}' +
    '#vdRecit .rc-on .rc-leaks li{transform:none;opacity:1}#vdRecit .rc-n{flex:0 0 30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(239,68,68,.22);color:#fca5a5;font-weight:900}' +
    '#vdRecit .rc-leaks li div{flex:1;min-width:0}#vdRecit .rc-leaks li div b{display:block;color:#fff;font-size:16px}#vdRecit .rc-leaks li div small{color:rgba(248,250,252,.7);font-size:13px}' +
    '#vdRecit .rc-leaks strong{text-align:right;color:#fde68a;font:900 20px/1.1 -apple-system,system-ui;font-variant-numeric:tabular-nums;white-space:nowrap}#vdRecit .rc-leaks strong em{font-style:normal}#vdRecit .rc-leaks strong small{display:block;font-size:11.5px;color:rgba(253,230,138,.75)}' +
    /* 5 · cascade */
    '#vdRecit .rc-wf{list-style:none;margin:0 0 26px;padding:0;display:grid;gap:14px}' +
    '#vdRecit .rc-wf-row{display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:4px 10px;opacity:0;transform:translateY(10px);transition:opacity .35s ' + E + ',transform .35s ' + E + ';transition-delay:calc(var(--i)*.16s + .1s)}' +
    '#vdRecit .rc-wf-l{font-size:14px;color:rgba(248,250,252,.82);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#vdRecit .rc-wf-v{font:800 15px/1.1 -apple-system,system-ui;font-variant-numeric:tabular-nums;color:#f8fafc}' +
    '#vdRecit .rc-wf-row.gain .rc-wf-v{color:#6ee7b7}#vdRecit .rc-wf-row.cible .rc-wf-v{color:#fde68a;font-size:17px}' +
    '#vdRecit .rc-wf-track{grid-column:1/-1;position:relative;height:14px;border-radius:7px;background:rgba(255,255,255,.07)}' +
    '#vdRecit .rc-wf-bar{position:absolute;top:0;bottom:0;left:var(--g);width:var(--l);border-radius:7px;background:linear-gradient(90deg,#059669,#34d399);transform:scaleX(0);transform-origin:left;transition:transform .6s ' + E + ';transition-delay:calc(var(--i)*.16s + .25s)}' +
    '#vdRecit .rc-wf-row.base .rc-wf-bar{background:linear-gradient(90deg,#64748b,#94a3b8)}#vdRecit .rc-wf-row.cible .rc-wf-track{height:18px;border-radius:9px}#vdRecit .rc-wf-row.cible .rc-wf-bar{border-radius:9px;background:linear-gradient(90deg,#d4a017,#fde68a);box-shadow:0 0 18px rgba(250,204,21,.45)}' +
    '#vdRecit .rc-wf-row.cible{padding-top:12px;border-top:1px solid rgba(255,255,255,.14)}' +
    '#vdRecit .rc-on .rc-wf-row{opacity:1;transform:none}#vdRecit .rc-on .rc-wf-bar{transform:scaleX(1)}' +
    /* 6 · appel */
    '#vdRecit .rc-cta{min-height:60px;border:0;border-radius:18px;background:linear-gradient(180deg,#22c55e,#16a34a);color:#fff;font:900 18px/1 -apple-system,system-ui;cursor:pointer;box-shadow:0 14px 34px rgba(22,163,74,.45)}' +
    '#vdRecit .rc-on .rc-cta{animation:rcHalo 1.9s ease-out .6s 3}@keyframes rcHalo{0%{box-shadow:0 0 0 0 rgba(34,197,94,.6),0 14px 34px rgba(22,163,74,.45)}70%{box-shadow:0 0 0 16px rgba(34,197,94,0),0 14px 34px rgba(22,163,74,.45)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0),0 14px 34px rgba(22,163,74,.45)}}' +
    '#vdRecit .rc-cta2{display:flex;gap:10px}#vdRecit .rc-cta2 button{flex:1;min-height:50px;border-radius:16px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;font:800 15px/1 -apple-system,system-ui;cursor:pointer}' +
    '#vdRecit .rc-navwrap,#vdRecit .rc-l,#vdRecit .rc-stack i>span{display:none}' +
    /* C98 — Tablette et grand écran : mises en page horizontales propres à l'écran large. */
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
  var attente = 0;
  function planifier() { clearTimeout(attente); attente = setTimeout(monter, 60); }
  try { var a = doc.getElementById('v-audit'); if (a) new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t && t.closest && t.closest('#vdRecit')) continue; return planifier(); } }).observe(a, { childList: true, subtree: true }); } catch (e) {}
  if (w.VIEW === 'audit') planifier(); /* C103 : rien au lancement quand l'Audit est caché */
})();
