/* C99 — L'Audit entier en premium (Steven, 16/10) : « tout le module complet premium, pas seulement le début ; les clics
   qui dirigent premium, du début à la fin ». Et : « au lancement, je vois l'ancienne version puis la nouvelle ».
   1. Plus d'ancien Audit qui apparaît : le récit et la bibliothèque sont construits dans la même image que l'Audit
      (branchés sur drawAudit) ; l'ancienne carte « Analyse complète » et les cartes brutes de preuves sont masquées
      dès le chargement.
   2. Bibliothèque : les chapitres de l'analyse complète (plus les preuves et les sources) sont rangés en 5 thèmes,
      en tuiles (numéro, sujet, titre, chiffre clé) qui apparaissent en cascade.
   3. Lecteur premium : un chapitre à la fois, plein écran sur iPhone, grand panneau avec sommaire sur Mac et iPad
      à l'horizontale ; barre de progression, Précédent / Suivant, balayage, flèches du clavier, Échap.
      Les chapitres ne sont ni copiés ni réécrits : ce sont les vrais, déplacés le temps de la lecture, à l'intérieur
      de l'Audit (leurs styles et leurs boutons continuent de fonctionner).
   4. Tous les accès existants (« Pourquoi et comment », raccourci Exports de Plus, « Voir les preuves ») ouvrent le
      lecteur au bon chapitre. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.VerdictLecteur) return;
  var REDUIT = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var E = 'cubic-bezier(.23,1,.32,1)';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function txt(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function plat(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  var THEMES = [
    { id: 'verdict', n: 'Le verdict', c: '#22c55e', ic: '<path d="M20 6 9 17l-5-5"/>', re: /audit premium|simulation estimative|lecture|raisonnement|probleme principal|verdict final/ },
    { id: 'argent', n: 'Votre argent', c: '#f59e0b', ic: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5a3 3 0 0 0-3-1.5c-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2a3 3 0 0 1-3-1.5M12 6v2M12 16v2"/>', re: /gain realiste|structure economique|l.argent|chiffre minimum|prix|risquez/ },
    { id: 'metier', n: 'Votre métier', c: '#60a5fa', ic: '<path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/>', re: /productivite|votre modele|carte|canaux|plateformes|contexte externe/ },
    { id: 'agir', n: 'Passer à l’action', c: '#a78bfa', ic: '<path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>', re: /detecte|fonctionne|plan 90|reprise|questions strategiques/ },
    { id: 'fiable', n: 'Preuves et fiabilité', c: '#2dd4bf', ic: '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>', re: /contrat de verite|preuve|qualite des donnees|honnetete|sources|qui fait foi/ }
  ];
  function theme(k, t) { var s = plat(k + ' ' + t); for (var i = 0; i < THEMES.length; i++) if (THEMES[i].re.test(s)) return THEMES[i]; return THEMES[3]; }
  function svg(p, cls) { return '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }

  /* ── Les chapitres, dans l'ordre des thèmes ─────────────────────────────── */
  var CH = [], lecteur = null, ouvert = -1, retourFocus = null;
  function relever() {
    var body = doc.getElementById('auditBody'); if (!body) return [];
    var bruts = [].slice.call(body.querySelectorAll('.av31-full .av31-full-body > .au-sc'));
    ['auditPreuves', 'sourcesEtat', 'sourcesVerite'].forEach(function (id) { var e = doc.getElementById(id); if (e && e.parentNode === body) bruts.push(e); });
    var L = bruts.map(function (el) {
      var k = txt(el.querySelector('.au-tag')).split(' · ')[0], h = el.querySelector('.au-h,h2,h3'), t = txt(h);
      if (!k && el.classList.contains('card')) k = 'Preuves';
      var f = txt(el.querySelector('.au-eur,.au-big')).replace(/\s*·.*$/, '');
      return { el: el, k: k, t: t, f: f.length > 26 ? '' : f, th: theme(k, t) };
    }).filter(function (x) { return x.t; });
    var ordre = [];
    THEMES.forEach(function (T) { L.forEach(function (x) { if (x.th === T) ordre.push(x); }); });
    return ordre;
  }

  /* ── Bibliothèque ───────────────────────────────────────────────────────── */
  function construire(force) {
    var body = doc.getElementById('auditBody'); if (!body) return;
    if (ouvert >= 0 && !force) return; /* pendant la lecture, rien ne bouge */
    var L = relever(); if (!L.length) return;
    var cle = L.map(function (x) { return x.t; }).join('|');
    var bib = doc.getElementById('vdBiblio');
    if (bib && bib.getAttribute('data-cle') === cle && bib.isConnected && !force) { CH = L; brancher(); return; }
    CH = L;
    if (!bib) { bib = doc.createElement('section'); bib.id = 'vdBiblio'; }
    bib.setAttribute('data-cle', cle);
    var n = 0, html = '<header class="bb-head"><span class="bb-k">L’analyse complète</span><h2>Tout le détail, chapitre par chapitre</h2>' +
      '<p>' + L.length + ' chapitres en ' + THEMES.filter(function (T) { return L.some(function (x) { return x.th === T; }); }).length + ' thèmes, tous calculés avec vos chiffres.</p>' +
      '<button type="button" class="bb-go" data-bb="0">Lire depuis le début<span aria-hidden="true">→</span></button></header>';
    THEMES.forEach(function (T) {
      var dans = L.filter(function (x) { return x.th === T; }); if (!dans.length) return;
      html += '<section class="bb-theme" style="--t:' + T.c + '"><h3><span class="bb-ic">' + svg(T.ic, 'bb-svg') + '</span>' + esc(T.n) + '<small>' + dans.length + ' chapitre' + (dans.length > 1 ? 's' : '') + '</small></h3><ol class="bb-grid">' +
        dans.map(function (x, j) {
          var i = n++;
          return '<li style="--j:' + j + '"><button type="button" class="bb-tile" data-bb="' + i + '"><span class="bb-n">' + (i < 9 ? '0' : '') + (i + 1) + '</span>' +
            '<span class="bb-tk">' + esc(x.k) + '</span><b>' + esc(x.t) + '</b>' + (x.f ? '<em>' + esc(x.f) + '</em>' : '') + '<i aria-hidden="true">→</i></button></li>';
        }).join('') + '</ol></section>';
    });
    bib.innerHTML = html;
    var recit = doc.getElementById('vdRecit'), wrap = body.querySelector('.au-wrap') || body;
    if (recit && recit.parentNode) recit.parentNode.insertBefore(bib, recit.nextSibling); else if (bib.parentNode !== wrap) wrap.insertBefore(bib, wrap.firstChild);
    [].forEach.call(bib.querySelectorAll('[data-bb]'), function (b) { b.onclick = function () { ouvrir(+b.getAttribute('data-bb'), b); }; });
    apparition(bib);
    brancher();
  }
  function apparition(bib) {
    var th = bib.querySelectorAll('.bb-theme,.bb-head');
    if (REDUIT || !('IntersectionObserver' in w)) { [].forEach.call(th, function (e) { e.classList.add('bb-on'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('bb-on'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
    [].forEach.call(th, function (e) { io.observe(e); });
  }
  /* Tout ce qui voulait faire défiler jusqu'à un chapitre (raccourcis, « Pourquoi et comment ») ouvre le lecteur. */
  function brancher() {
    CH.forEach(function (x, i) {
      if (x.el.__lxBranche) return; x.el.__lxBranche = true;
      x.el.scrollIntoView = function () { var k = CH.indexOf(CH.filter(function (y) { return y.el === x.el; })[0]); if (k >= 0) ouvrir(k); };
      x.el.focus = function () {};
    });
  }

  /* ── Lecteur ─────────────────────────────────────────────────────────────── */
  function creerLecteur() {
    var body = doc.getElementById('auditBody'); if (!body) return null;
    var L = doc.getElementById('vdLecteur');
    if (L && L.parentNode === body) return L;
    L = doc.createElement('div'); L.id = 'vdLecteur'; L.setAttribute('role', 'dialog'); L.setAttribute('aria-modal', 'true'); L.setAttribute('aria-label', 'Lecture de l’audit');
    L.innerHTML = '<div class="lx-fond" data-lx="fermer"></div><div class="lx-pan">' +
      '<aside class="lx-som" aria-label="Sommaire"></aside>' +
      '<div class="lx-main"><header class="lx-tete"><button type="button" class="lx-x" data-lx="fermer" aria-label="Fermer la lecture">' + svg('<path d="M18 6 6 18M6 6l12 12"/>', 'lx-svg') + '</button>' +
      '<div class="lx-meta"><span class="lx-th"></span><span class="lx-pos"></span></div></header><div class="lx-prog"><i></i></div>' +
      '<div class="lx-corps"><div class="au-wrap lx-wrap"><div class="av31-full-body lx-page"></div></div></div>' +
      '<footer class="lx-pied"><button type="button" class="lx-av" data-lx="prec"><small>← Précédent</small><b></b></button><button type="button" class="lx-ap" data-lx="suiv"><small>Suivant →</small><b></b></button></footer></div></div>';
    body.appendChild(L);
    [].forEach.call(L.querySelectorAll('[data-lx]'), function (b) {
      b.addEventListener('click', function () { var a = b.getAttribute('data-lx'); if (a === 'fermer') fermer(); else if (a === 'prec') aller(ouvert - 1); else aller(ouvert + 1); });
    });
    /* Balayage horizontal (iPhone, iPad) — ignoré dans une zone qui défile elle-même de côté. */
    var x0 = 0, y0 = 0, t0 = 0, ok = false;
    L.querySelector('.lx-corps').addEventListener('touchstart', function (e) {
      var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); ok = true;
      for (var n = e.target; n && n !== L; n = n.parentElement) { if (n.scrollWidth > n.clientWidth + 4 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) { ok = false; break; } if (/^(INPUT|SELECT|TEXTAREA)$/.test(n.tagName)) { ok = false; break; } }
    }, { passive: true });
    L.querySelector('.lx-corps').addEventListener('touchend', function (e) {
      if (!ok) return; var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 70 && Math.abs(dy) < 45 && Date.now() - t0 < 600) aller(ouvert + (dx < 0 ? 1 : -1));
    }, { passive: true });
    return L;
  }
  function sommaire(L) {
    var html = '<p class="lx-som-k">Sommaire</p>', n = 0;
    THEMES.forEach(function (T) {
      var dans = CH.filter(function (x) { return x.th === T; }); if (!dans.length) return;
      html += '<p class="lx-som-t" style="--t:' + T.c + '">' + esc(T.n) + '</p><ol>' + dans.map(function (x) { var i = n++; return '<li><button type="button" data-lx-i="' + i + '"><span>' + (i + 1) + '</span>' + esc(x.t) + '</button></li>'; }).join('') + '</ol>';
    });
    var s = L.querySelector('.lx-som'); s.innerHTML = html;
    [].forEach.call(s.querySelectorAll('[data-lx-i]'), function (b) { b.onclick = function () { aller(+b.getAttribute('data-lx-i')); }; });
  }
  function rendre(i) {
    var x = CH[i]; if (!x || !lecteur) return;
    var page = lecteur.querySelector('.lx-page');
    rendreAuParent();
    var ph = doc.createComment('vd-lecteur'); x.el.parentNode.insertBefore(ph, x.el); x.ph = ph;
    page.appendChild(x.el); x.el.classList.add('vu');
    ouvert = i;
    lecteur.style.setProperty('--t', x.th.c);
    lecteur.querySelector('.lx-th').textContent = x.th.n;
    lecteur.querySelector('.lx-pos').textContent = 'Chapitre ' + (i + 1) + ' sur ' + CH.length;
    lecteur.querySelector('.lx-prog i').style.transform = 'scaleX(' + ((i + 1) / CH.length).toFixed(4) + ')';
    var av = lecteur.querySelector('.lx-av'), ap = lecteur.querySelector('.lx-ap');
    av.disabled = i === 0; av.querySelector('b').textContent = i > 0 ? CH[i - 1].t : '';
    ap.querySelector('small').textContent = i < CH.length - 1 ? 'Suivant →' : 'Fin de l’audit';
    ap.querySelector('b').textContent = i < CH.length - 1 ? CH[i + 1].t : 'Retour à l’Audit';
    [].forEach.call(lecteur.querySelectorAll('[data-lx-i]'), function (b) {
      var on = +b.getAttribute('data-lx-i') === i; if (on) { b.setAttribute('aria-current', 'true'); try { b.scrollIntoView({ block: 'nearest' }); } catch (e) {} } else b.removeAttribute('aria-current');
    });
    lecteur.querySelector('.lx-corps').scrollTop = 0;
  }
  function rendreAuParent() {
    CH.forEach(function (y) { if (y.ph) { if (y.ph.parentNode) y.ph.parentNode.replaceChild(y.el, y.ph); else if (y.el.parentNode) y.el.parentNode.removeChild(y.el); y.ph = null; } });
  }
  function aller(i) {
    if (i >= CH.length) return fermer();
    if (i < 0 || i === ouvert || !lecteur) return;
    var page = lecteur.querySelector('.lx-page'), sens = i > ouvert ? 1 : -1;
    if (REDUIT) return rendre(i);
    page.style.transition = 'opacity .16s ease,transform .16s ease'; page.style.opacity = '0'; page.style.transform = 'translateX(' + (-18 * sens) + 'px)';
    setTimeout(function () {
      rendre(i); page.style.transition = 'none'; page.style.transform = 'translateX(' + (18 * sens) + 'px)';
      void page.offsetWidth; page.style.transition = 'opacity .32s ' + E + ',transform .32s ' + E; page.style.opacity = '1'; page.style.transform = 'none';
    }, 160);
  }
  function ouvrir(i, depuis) {
    if (!CH.length) construire(true);
    if (typeof i === 'string') { var q = plat(i); i = 0; for (var k = 0; k < CH.length; k++) if (plat(CH[k].k + ' ' + CH[k].t).indexOf(q) >= 0) { i = k; break; } }
    if (!CH[i]) return;
    lecteur = creerLecteur(); if (!lecteur) return;
    retourFocus = depuis || doc.activeElement;
    sommaire(lecteur);
    doc.documentElement.classList.add('vd-lecture');
    lecteur.classList.add('on');
    rendre(i);
    requestAnimationFrame(function () { requestAnimationFrame(function () { lecteur && lecteur.classList.add('vis'); try { lecteur.querySelector('.lx-x').focus({ preventScroll: true }); } catch (e) {} }); });
  }
  function fermer(net) {
    if (!lecteur || ouvert < 0) return;
    var L = lecteur; ouvert = -1;
    var fin = function () { rendreAuParent(); L.classList.remove('on'); doc.documentElement.classList.remove('vd-lecture'); if (retourFocus && retourFocus.isConnected) try { retourFocus.focus({ preventScroll: true }); } catch (e) {} };
    L.classList.remove('vis');
    if (net || REDUIT) fin(); else setTimeout(fin, 380);
  }
  doc.addEventListener('keydown', function (e) {
    if (ouvert < 0) return;
    if (e.key === 'Escape') { e.preventDefault(); fermer(); }
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !/^(INPUT|SELECT|TEXTAREA)$/.test((e.target && e.target.tagName) || '')) { e.preventDefault(); aller(ouvert + (e.key === 'ArrowRight' ? 1 : -1)); }
  });

  /* Le chapitre « Sur 100 € HT » affichait la clé technique « amortization » : libellé manquant au dictionnaire. */
  try {
    if (typeof MONEY100_I18N === 'object' && MONEY100_I18N) {
      var AM = { fr: 'Amortissements', en: 'Depreciation', es: 'Amortizaciones', it: 'Ammortamenti', de: 'Abschreibungen', nl: 'Afschrijvingen', pt: 'Amortizações' };
      Object.keys(MONEY100_I18N).forEach(function (l) { var b = MONEY100_I18N[l]; if (b && typeof b === 'object' && !b.amortization) b.amortization = AM[l] || AM.fr; });
    }
  } catch (e) {}

  /* ── Branchements ────────────────────────────────────────────────────────── */
  if (typeof w.drawAudit === 'function') {
    var da = w.drawAudit;
    w.drawAudit = function () {
      var lu = ouvert >= 0 && CH[ouvert] ? CH[ouvert].t : null;
      if (ouvert >= 0) fermer(true);
      lecteur = null;
      var r = da.apply(this, arguments);
      try { if (w.VerdictRecit) w.VerdictRecit.monter(); } catch (e) {}
      try { construire(true); if (lu) { for (var i = 0; i < CH.length; i++) if (CH[i].t === lu) { ouvrir(i); break; } } } catch (e) {}
      return r;
    };
  }
  /* Quitter l'Audit (bouton d'un chapitre qui mène ailleurs) ferme la lecture proprement. */
  if (typeof w.go === 'function') { var go0 = w.go; w.go = function () { if (ouvert >= 0) fermer(true); return go0.apply(this, arguments); }; }
  if (w.VerdictGainRealiste) { try { w.VerdictGainRealiste.ouvrirDetail = function () { ouvrir('gain realiste'); }; } catch (e) {} }
  w.av31OpenFull = function () { ouvrir(0); };
  var attente = 0;
  try {
    var va = doc.getElementById('v-audit');
    if (va) new MutationObserver(function (l) {
      for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t && t.closest && t.closest('#vdBiblio,#vdLecteur,#vdRecit')) continue; clearTimeout(attente); attente = setTimeout(function () { construire(false); }, 40); return; }
    }).observe(va, { childList: true, subtree: true });
  } catch (e) {}
  w.VerdictLecteur = { ouvrir: ouvrir, fermer: fermer, chapitres: function () { return CH.map(function (x) { return { theme: x.th.n, sujet: x.k, titre: x.t }; }); } };

  /* ── Styles ──────────────────────────────────────────────────────────────── */
  var css = doc.createElement('style'); css.id = 'audit-lecteur-a28';
  css.textContent =
    /* l'ancien Audit ne s'affiche jamais (fin du flash à l'ouverture) */
    '#auditBody .av31-full,#auditBody>#auditPreuves,#auditBody>#sourcesEtat,#auditBody>#sourcesVerite{display:none!important}' +
    /* grand écran : l'Audit occupe toute la largeur (plus de bandes noires sur les côtés) */
    '@media (min-width:1100px){#v-audit{max-width:none!important}}' +
    /* Bibliothèque */
    '#vdBiblio{--bb-card:#ffffff;--bb-line:#e6ebf0;--bb-txt:#0f172a;--bb-sub:#64748b;--bb-hov:0 18px 40px rgba(15,23,42,.12);margin:34px 0 40px;font-family:-apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif;color:var(--bb-txt)}' +
    'html.vd-workspace-dark #vdBiblio{--bb-card:#11161d;--bb-line:#222b36;--bb-txt:#f1f5f9;--bb-sub:#94a3b8;--bb-hov:0 20px 44px rgba(0,0,0,.5)}' +
    '#vdBiblio .bb-head{padding:4px 4px 8px}#vdBiblio .bb-k{font:800 11.5px/1 -apple-system,system-ui;letter-spacing:.14em;text-transform:uppercase;color:#16a34a}' +
    '#vdBiblio .bb-head h2{margin:8px 0 6px;font:900 30px/1.08 -apple-system,system-ui;letter-spacing:-.025em;color:var(--bb-txt)}#vdBiblio .bb-head p{margin:0 0 16px;color:var(--bb-sub);font-size:15px}' +
    '#vdBiblio .bb-go{display:inline-flex;align-items:center;gap:12px;min-height:52px;padding:0 22px;border:0;border-radius:16px;background:linear-gradient(180deg,#22c55e,#16a34a);color:#fff;font:800 16px/1 -apple-system,system-ui;cursor:pointer;box-shadow:0 12px 28px rgba(22,163,74,.35);transition:transform .25s ' + E + '}' +
    '#vdBiblio .bb-go span{font-size:20px;transition:transform .25s ' + E + '}#vdBiblio .bb-go:active{transform:scale(.97)}' +
    '#vdBiblio .bb-theme{margin:30px 0 0}#vdBiblio .bb-theme h3{display:flex;align-items:center;gap:12px;margin:0 4px 12px;font:800 19px/1.2 -apple-system,system-ui;color:var(--bb-txt)}' +
    '#vdBiblio .bb-theme h3 small{margin-left:auto;font:600 13px/1 -apple-system,system-ui;color:var(--bb-sub)}' +
    '#vdBiblio .bb-ic{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;background:color-mix(in srgb,var(--t) 16%,transparent);color:var(--t)}#vdBiblio .bb-svg{width:20px;height:20px}' +
    '#vdBiblio .bb-grid{list-style:none;margin:0;padding:0;display:grid;gap:10px}' +
    '#vdBiblio .bb-grid li{opacity:0;transform:translateY(14px);transition:opacity .45s ' + E + ',transform .45s ' + E + ';transition-delay:calc(var(--j)*.05s)}#vdBiblio .bb-on .bb-grid li{opacity:1;transform:none}' +
    '#vdBiblio .bb-head{opacity:0;transform:translateY(14px);transition:opacity .5s ' + E + ',transform .5s ' + E + '}#vdBiblio .bb-head.bb-on{opacity:1;transform:none}' +
    '#vdBiblio .bb-tile{position:relative;display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:"n k i" "n b i" "n e i";align-items:center;gap:2px 14px;width:100%;min-height:76px;padding:14px 16px;border-radius:20px;border:1px solid var(--bb-line);background:var(--bb-card);color:var(--bb-txt);text-align:left;font:inherit;cursor:pointer;overflow:hidden;transition:transform .3s ' + E + ',box-shadow .3s ' + E + ',border-color .3s}' +
    '#vdBiblio .bb-tile:before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:0 3px 3px 0;background:var(--t)}' +
    '#vdBiblio .bb-n{grid-area:n;align-self:start;display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:color-mix(in srgb,var(--t) 14%,transparent);color:var(--t);font:800 14px/1 -apple-system,system-ui;font-variant-numeric:tabular-nums}' +
    '#vdBiblio .bb-tk{grid-area:k;font:700 11px/1.3 -apple-system,system-ui;letter-spacing:.1em;text-transform:uppercase;color:var(--bb-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#vdBiblio .bb-tile b{grid-area:b;font:750 16px/1.3 -apple-system,system-ui;color:var(--bb-txt);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '#vdBiblio .bb-tile em{grid-area:e;font:800 15px/1.3 -apple-system,system-ui;font-style:normal;font-variant-numeric:tabular-nums;color:var(--t)}' +
    '#vdBiblio .bb-tile i{grid-area:i;font-style:normal;font-size:20px;color:var(--bb-sub);transition:transform .3s ' + E + ',color .3s}' +
    '#vdBiblio .bb-tile:active{transform:scale(.985)}' +
    '@media (hover:hover) and (pointer:fine){#vdBiblio .bb-tile:hover{transform:translateY(-3px);box-shadow:var(--bb-hov);border-color:color-mix(in srgb,var(--t) 45%,var(--bb-line))}#vdBiblio .bb-tile:hover i{transform:translateX(4px);color:var(--t)}#vdBiblio .bb-go:hover span{transform:translateX(4px)}}' +
    '@media (min-width:700px){#vdBiblio{max-width:880px;margin-left:auto;margin-right:auto}#vdBiblio .bb-head h2{font-size:40px}#vdBiblio .bb-grid{grid-template-columns:1fr 1fr;gap:12px}}' +
    '@media (min-width:1100px){#vdBiblio{max-width:1240px}#vdBiblio .bb-head{display:grid;grid-template-columns:1fr auto;grid-template-areas:"k g" "h g" "p g";align-items:end;column-gap:30px}' +
      '#vdBiblio .bb-k{grid-area:k}#vdBiblio .bb-head h2{grid-area:h;font-size:46px}#vdBiblio .bb-head p{grid-area:p;margin:0}#vdBiblio .bb-go{grid-area:g;min-height:58px;padding:0 28px;font-size:17px}' +
      '#vdBiblio .bb-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}#vdBiblio .bb-tile{min-height:112px;grid-template-columns:auto 1fr;grid-template-areas:"n k" "n b" "n e";padding:18px 20px}#vdBiblio .bb-tile i{display:none}}' +
    /* Lecteur */
    'html.vd-lecture,html.vd-lecture body{overflow:hidden!important}html.vd-lecture #v-audit{transform:none!important;z-index:400!important}' +
    '#vdLecteur{--lx-bg:#f3f5f8;--lx-chrome:#ffffff;--lx-line:#e5e9ef;--lx-txt:#0f172a;--lx-sub:#64748b;--lx-paper:#ffffff;--lx-btn:#f1f4f8;position:fixed;inset:0;z-index:10;display:none;font-family:-apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif}' +
    'html.vd-workspace-dark #vdLecteur{--lx-bg:#080b10;--lx-chrome:#0e131a;--lx-line:#1e2733;--lx-txt:#f1f5f9;--lx-sub:#94a3b8;--lx-paper:#fbfbf8;--lx-btn:#161d26}' +
    '#vdLecteur.on{display:block}' +
    '#vdLecteur .lx-fond{position:absolute;inset:0;background:rgba(2,6,12,.58);opacity:0;transition:opacity .35s ease}#vdLecteur.vis .lx-fond{opacity:1}' +
    '#vdLecteur .lx-pan{position:absolute;inset:0;display:flex;background:var(--lx-bg);color:var(--lx-txt);transform:translateY(104%);transition:transform .42s ' + E + ';overflow:hidden}#vdLecteur.vis .lx-pan{transform:none}' +
    '#vdLecteur .lx-som{display:none}#vdLecteur .lx-main{flex:1;min-width:0;display:flex;flex-direction:column}' +
    '#vdLecteur .lx-tete{display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 10px) 14px 10px;background:var(--lx-chrome);border-bottom:1px solid var(--lx-line)}' +
    '#vdLecteur .lx-x{flex:0 0 44px;width:44px;height:44px;border-radius:50%;border:0;background:var(--lx-btn);color:var(--lx-txt);display:grid;place-items:center;cursor:pointer}#vdLecteur .lx-svg{width:20px;height:20px}' +
    '#vdLecteur .lx-meta{display:flex;flex-direction:column;gap:3px;min-width:0}#vdLecteur .lx-th{font:800 12px/1.2 -apple-system,system-ui;letter-spacing:.12em;text-transform:uppercase;color:var(--t)}#vdLecteur .lx-pos{font:600 14px/1.2 -apple-system,system-ui;color:var(--lx-sub);font-variant-numeric:tabular-nums}' +
    '#vdLecteur .lx-prog{height:3px;background:var(--lx-line)}#vdLecteur .lx-prog i{display:block;height:100%;background:var(--t);transform-origin:left;transition:transform .45s ' + E + '}' +
    '#vdLecteur .lx-corps{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:16px 12px 28px}' +
    '#vdLecteur .lx-wrap{max-width:780px!important;margin:0 auto!important;padding:0!important}' +
    '#vdLecteur .lx-page{background:var(--lx-paper)!important;color:#101214;border-radius:26px;padding:28px 22px 30px!important;box-shadow:0 1px 2px rgba(15,23,42,.05),0 18px 50px rgba(15,23,42,.10);will-change:auto}' +
    '#vdLecteur .lx-pied{display:grid;grid-template-columns:1fr 1.25fr;gap:10px;padding:10px 12px calc(env(safe-area-inset-bottom,0px) + 10px);background:var(--lx-chrome);border-top:1px solid var(--lx-line)}' +
    '#vdLecteur .lx-pied button{display:flex;flex-direction:column;justify-content:center;gap:3px;min-height:58px;padding:8px 14px;border-radius:16px;border:1px solid var(--lx-line);background:var(--lx-btn);color:var(--lx-txt);text-align:left;font:inherit;cursor:pointer;min-width:0}' +
    '#vdLecteur .lx-pied small{font:700 12px/1 -apple-system,system-ui;color:var(--lx-sub)}#vdLecteur .lx-pied b{font:700 14px/1.25 -apple-system,system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#vdLecteur .lx-pied .lx-ap{border:0;background:linear-gradient(180deg,#22c55e,#16a34a);color:#fff;text-align:right;box-shadow:0 10px 24px rgba(22,163,74,.3)}#vdLecteur .lx-pied .lx-ap small{color:rgba(255,255,255,.85)}' +
    '#vdLecteur .lx-pied button:disabled{opacity:.4;cursor:default}#vdLecteur .lx-pied button:active:not(:disabled){transform:scale(.98)}' +
    /* Le chapitre, mis en page comme une belle page */
    '#vdLecteur .lx-page>.au-sc,#vdLecteur .lx-page>.card{margin:0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;opacity:1!important;transform:none!important;min-height:0!important}' +
    '#vdLecteur .lx-page>.au-sc:before{content:none!important;display:none!important}' + /* ancien compteur « 09 / 24 » */
    '#vdLecteur .lx-page .au-tag{display:inline-block;font:800 12px/1.3 -apple-system,system-ui!important;letter-spacing:.12em!important;text-transform:uppercase;color:var(--t)!important;background:none!important;padding:0!important}' +
    '#vdLecteur .lx-page .au-h,#vdLecteur .lx-page>.card>h3{margin:10px 0 14px!important;font:900 clamp(25px,5.4vw,36px)/1.1 -apple-system,system-ui!important;letter-spacing:-.025em!important;color:#0b1220!important}' +
    '#vdLecteur .lx-page .au-p,#vdLecteur .lx-page .note{font-size:16px!important;line-height:1.6!important;color:#3b4554!important}' +
    '#vdLecteur .lx-page .au-card{border-radius:18px!important;border:1px solid #e8ecf1!important;background:#f8fafc!important;padding:16px 18px!important;box-shadow:none!important;margin:12px 0!important}' +
    '#vdLecteur .lx-page .au-k{font:800 11.5px/1.3 -apple-system,system-ui!important;letter-spacing:.1em!important;text-transform:uppercase;color:#64748b!important}' +
    '#vdLecteur .lx-page .au-eur{font:900 30px/1.1 -apple-system,system-ui!important;letter-spacing:-.02em;font-variant-numeric:tabular-nums}' +
    '#vdLecteur .lx-page .btn,#vdLecteur .lx-page button.au-choice{min-height:46px;border-radius:14px!important}' +
    '#vdLecteur .lx-page details{border-radius:14px;border:1px solid #e8ecf1;padding:2px 14px;margin:8px 0;background:#ffffff}#vdLecteur .lx-page details>summary{min-height:44px;display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:700}' +
    '#vdLecteur .lx-page .src-l{border-radius:14px;border:1px solid #e8ecf1;padding:12px 14px;margin:8px 0;background:#ffffff}#vdLecteur .lx-page .svt-l{padding:10px 0;border-bottom:1px solid #eef1f5}' +
    /* Tablette : panneau arrondi */
    '@media (min-width:700px){#vdLecteur .lx-pan{inset:3vh 3vw;border-radius:28px;box-shadow:0 40px 120px rgba(0,0,0,.45);transform:translateY(30px) scale(.97);opacity:0;transition:transform .42s ' + E + ',opacity .3s ease}#vdLecteur.vis .lx-pan{transform:none;opacity:1}' +
      '#vdLecteur .lx-tete{padding:14px 20px}#vdLecteur .lx-corps{padding:26px 28px 36px}#vdLecteur .lx-page{padding:42px 48px 46px!important}#vdLecteur .lx-pied{padding:12px 20px;grid-template-columns:1fr 1fr}}' +
    /* Mac, iPad à l'horizontale : sommaire à gauche */
    '@media (min-width:1100px){#vdLecteur .lx-pan{inset:4vh max(3vw,calc((100vw - 1320px)/2))}' +
      '#vdLecteur .lx-som{display:block;flex:0 0 300px;overflow-y:auto;padding:22px 14px 22px 18px;background:var(--lx-chrome);border-right:1px solid var(--lx-line)}' +
      '#vdLecteur .lx-som-k{margin:0 8px 14px;font:900 22px/1 -apple-system,system-ui;letter-spacing:-.02em;color:var(--lx-txt)}' +
      '#vdLecteur .lx-som-t{margin:18px 8px 6px;font:800 11px/1.2 -apple-system,system-ui;letter-spacing:.12em;text-transform:uppercase;color:var(--t)}' +
      '#vdLecteur .lx-som ol{list-style:none;margin:0;padding:0}#vdLecteur .lx-som button{display:flex;gap:10px;width:100%;padding:9px 10px;border:0;border-radius:12px;background:transparent;color:var(--lx-sub);text-align:left;font:600 13.5px/1.3 -apple-system,system-ui;cursor:pointer}' +
      '#vdLecteur .lx-som button span{flex:0 0 22px;font-variant-numeric:tabular-nums;opacity:.7}#vdLecteur .lx-som button:hover{background:var(--lx-btn);color:var(--lx-txt)}' +
      '#vdLecteur .lx-som button[aria-current]{background:var(--lx-btn);color:var(--lx-txt);font-weight:800;box-shadow:inset 3px 0 0 var(--t)}' +
      '#vdLecteur .lx-corps{padding:34px 40px 44px}#vdLecteur .lx-page{padding:52px 60px 56px!important}#vdLecteur .lx-pied{grid-template-columns:minmax(0,320px) minmax(0,420px);justify-content:space-between}}' +
    '@media (prefers-reduced-motion:reduce){#vdBiblio *,#vdLecteur *{transition:none!important;animation:none!important}#vdBiblio .bb-grid li,#vdBiblio .bb-head{opacity:1;transform:none}}';
  (doc.head || doc.documentElement).appendChild(css);
  construire(true);
})();
