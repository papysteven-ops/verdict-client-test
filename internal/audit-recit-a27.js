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
    var seuil = (P && P.seuil) || {}, mini = num(seuil.eur);
    var leviers = (G && G.leviers || []).slice(0, 3);
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
    var seg = D.postes.map(function (x, i) { return '<i style="--w:' + Math.max(0, x.v).toFixed(2) + '%;--c:' + x.c + ';--i:' + i + '"></i>'; }).join('') +
      (D.rn > 0 ? '<i class="rc-res" style="--w:' + D.rn.toFixed(2) + '%;--c:#22c55e;--i:' + D.postes.length + '"></i>' : '');
    var leg = D.postes.map(function (x) { return '<li><i style="background:' + x.c + '"></i>' + esc(x.l) + '<b>' + (Math.round(x.v * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' €</b></li>'; }).join('') +
      '<li><i style="background:' + (D.rn > 0 ? '#22c55e' : '#ef4444') + '"></i>Il vous reste<b>' + (D.rn >= 0 ? '' : '−') + Math.abs(Math.round(D.rn * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' €</b></li>';
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
      var haut = Math.max(Math.abs(D.res), Math.abs(D.cible), 1), sol = D.res > 0 ? Math.min(D.res, D.cible) * 0.55 : 0, plage = Math.max(1, haut - sol), cumul = D.res, barres = '';
      /* Axe zoomé (départ à 55 % du résultat actuel) pour que chaque levier se voie ; la barre « Aujourd’hui » le signale par sa coupe. */
      pas.forEach(function (p, i) {
        var bas, h; if (p.base) { bas = 0; h = p.v; } else { bas = cumul; h = p.v; cumul += p.v; }
        var y0 = Math.max(sol, Math.min(bas, bas + h)), y1 = Math.max(bas, bas + h);
        barres += '<div class="rc-wf-col" style="--i:' + i + '"><div class="rc-wf-bar' + (p.base ? ' base' : '') + '" style="--b:' + ((y0 - sol) / plage * 100).toFixed(2) + '%;--h:' + (Math.max(1.5, (y1 - y0) / plage * 100)).toFixed(2) + '%"></div><span>' + esc(p.base ? p.l : '+ ' + p.l) + '</span></div>';
      });
      barres += '<div class="rc-wf-col" style="--i:' + pas.length + '"><div class="rc-wf-bar cible" style="--b:0%;--h:' + (Math.max(0, D.cible - sol) / plage * 100).toFixed(2) + '%"></div><span>Possible</span></div>';
      t.push('<section class="rc-card rc-c5" data-rc="5"><span class="rc-k">5 · Comment remonter</span><h2>Votre résultat, levier par levier</h2>' +
        '<div class="rc-wf">' + barres + '</div>' +
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
  function monter() {
    var body = doc.getElementById('auditBody'); if (!body) return;
    var D = donnees(); if (!D) return;
    var cle = [D.score, Math.round(D.res), Math.round(D.ca), D.leviers.length, D.cible].join('|');
    var box = doc.getElementById('vdRecit');
    if (box && box.getAttribute('data-cle') === cle && box.parentNode) return;
    if (!box) { box = doc.createElement('div'); box.id = 'vdRecit'; }
    box.setAttribute('data-cle', cle);
    box.innerHTML = '<header class="rc-head"><span>Audit Verdict · ' + esc(D.nom) + '</span><h1>Votre audit en 6 images</h1><p>Faites défiler : chaque image se joue quand elle arrive.</p></header>' + tableaux(D);
    var wrap = body.querySelector('.au-wrap') || body;
    if (box.parentNode !== wrap || wrap.firstChild !== box) wrap.insertBefore(box, wrap.firstChild);
    [].forEach.call(box.querySelectorAll('[data-rc-go]'), function (b) {
      b.onclick = function () {
        var g = b.getAttribute('data-rc-go'), V = w.VerdictGainRealiste;
        if (g === 'simuler') { if (V && V.ouvrirSimuler) V.ouvrirSimuler(); else w.go('dec'); }
        else if (g === 'actions') w.go('priorities');
        else { var d = doc.querySelector('[data-audit-full-report]'); if (d) { d.open = true; d.scrollIntoView({ behavior: REDUIT ? 'auto' : 'smooth', block: 'start' }); } }
      };
    });
    var cartes = box.querySelectorAll('.rc-card');
    if (!('IntersectionObserver' in w) || REDUIT) { [].forEach.call(cartes, jouer); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { jouer(e.target); io.unobserve(e.target); } }); }, { threshold: 0.45, rootMargin: '0px 0px -8% 0px' });
    [].forEach.call(cartes, function (c) { io.observe(c); });
  }

  var css = doc.createElement('style'); css.id = 'audit-recit-a27';
  var E = 'cubic-bezier(.23,1,.32,1)';
  css.textContent =
    '#auditBody .av31{display:none!important}' +
    '#vdRecit{margin:4px 0 26px;font-family:-apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif}' +
    '#vdRecit .rc-head{padding:6px 4px 14px;color:#101214}#vdRecit .rc-head span{font:800 11.5px/1 -apple-system,system-ui;letter-spacing:.14em;text-transform:uppercase;color:#16a34a}' +
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
    '#vdRecit .rc-stack{display:flex;height:34px;border-radius:12px;overflow:hidden;background:rgba(255,255,255,.08)}' +
    '#vdRecit .rc-stack i{display:block;height:100%;width:var(--w);background:var(--c);transform:scaleX(0);transform-origin:left;transition:transform .7s ' + E + ';transition-delay:calc(var(--i)*.13s + .2s)}' +
    '#vdRecit .rc-on .rc-stack i{transform:scaleX(1)}#vdRecit .rc-stack .rc-res{box-shadow:inset 0 0 0 2px rgba(255,255,255,.5)}' +
    '#vdRecit .rc-leg{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px 14px}#vdRecit .rc-leg li{display:flex;align-items:center;gap:8px;font-size:14.5px;color:rgba(248,250,252,.85)}' +
    '#vdRecit .rc-leg li i{width:10px;height:10px;border-radius:3px;flex:0 0 10px}#vdRecit .rc-leg li b{margin-left:auto;font-variant-numeric:tabular-nums;color:#fff}' +
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
    '#vdRecit .rc-wf{display:flex;align-items:flex-end;gap:8px;height:200px;margin-bottom:34px;border-bottom:1px solid rgba(255,255,255,.14)}' +
    '#vdRecit .rc-wf-col{position:relative;flex:1;height:100%}#vdRecit .rc-wf-col span{position:absolute;left:-2px;right:-2px;top:calc(100% + 6px);font-size:10.5px;line-height:1.15;text-align:center;color:rgba(248,250,252,.78);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '#vdRecit .rc-wf-bar{position:absolute;left:0;right:0;bottom:var(--b);height:var(--h);border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#34d399,#059669);transform:scaleY(0);transform-origin:bottom;transition:transform .7s ' + E + ';transition-delay:calc(var(--i)*.22s + .2s)}' +
    '#vdRecit .rc-wf-bar.base{background:linear-gradient(180deg,#94a3b8,#64748b);-webkit-mask:linear-gradient(0deg,transparent 0 6px,#000 6px 10px,transparent 10px 13px,#000 13px)}#vdRecit .rc-wf-bar.cible{background:linear-gradient(180deg,#fde68a,#d4a017);box-shadow:0 0 18px rgba(250,204,21,.45)}' +
    '#vdRecit .rc-on .rc-wf-bar{transform:scaleY(1)}' +
    /* 6 · appel */
    '#vdRecit .rc-cta{min-height:60px;border:0;border-radius:18px;background:linear-gradient(180deg,#22c55e,#16a34a);color:#fff;font:900 18px/1 -apple-system,system-ui;cursor:pointer;box-shadow:0 14px 34px rgba(22,163,74,.45)}' +
    '#vdRecit .rc-on .rc-cta{animation:rcHalo 1.9s ease-out .6s 3}@keyframes rcHalo{0%{box-shadow:0 0 0 0 rgba(34,197,94,.6),0 14px 34px rgba(22,163,74,.45)}70%{box-shadow:0 0 0 16px rgba(34,197,94,0),0 14px 34px rgba(22,163,74,.45)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0),0 14px 34px rgba(22,163,74,.45)}}' +
    '#vdRecit .rc-cta2{display:flex;gap:10px}#vdRecit .rc-cta2 button{flex:1;min-height:50px;border-radius:16px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;font:800 15px/1 -apple-system,system-ui;cursor:pointer}' +
    '@media (min-width:900px){#vdRecit .rc-card{min-height:520px;padding:40px 44px}#vdRecit{display:grid;grid-template-columns:1fr 1fr;gap:18px}#vdRecit .rc-head{grid-column:1/-1}#vdRecit .rc-card{margin:0}}' +
    '@media (prefers-reduced-motion:reduce){#vdRecit *{transition:none!important;animation:none!important}#vdRecit .rc-card>*{opacity:1;transform:none}}';
  (doc.head || doc.documentElement).appendChild(css);

  var attente = 0;
  function planifier() { clearTimeout(attente); attente = setTimeout(monter, 60); }
  try { var a = doc.getElementById('v-audit'); if (a) new MutationObserver(function (l) { for (var i = 0; i < l.length; i++) { var t = l[i].target; if (t && t.closest && t.closest('#vdRecit')) continue; return planifier(); } }).observe(a, { childList: true, subtree: true }); } catch (e) {}
  planifier();
})();
