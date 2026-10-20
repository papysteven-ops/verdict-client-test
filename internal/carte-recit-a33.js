/* C106 — La Carte en récit, « même magie » que l'Audit (Steven, 16/10 : « voir Carte, même magie que Pilotage et
   Audit »). Dans « Ma carte », sous la liste des plats (C176), six images plein écran, une idée chacune, chiffre géant compté, visuel animé,
   bouton : 1 Indice Carte · 2 Sur chaque 100 € de carte · 3 Vos plats vedettes · 4 L'écart à vos objectifs ·
   5 Comment remonter (le même gain que l'Audit et Simuler) · 6 Votre prochain pas (Vera, renouveler, tester un prix).
   Toutes les valeurs viennent des fonctions existantes (scoreState, carteStats, auditPremiumCalc, VerdictManqueCarte,
   VerdictGainRealiste) : rien n'est inventé ; « écart » n'est jamais présenté comme un gain promis. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.VerdictRecitCarte) return;
  var REDUIT = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches), E = 'cubic-bezier(.23,1,.32,1)';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function eur(v) { return Math.round(num(v)).toLocaleString('fr-FR') + ' €'; }
  function pct1(v) { return num(v).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'; }
  function teinte(pts) { return pts < 31 ? '#ef4444' : pts < 60 ? '#f97316' : pts < 75 ? '#eab308' : '#22c55e'; }
  function P() { return w.VerdictCartePages || null; }

  function donnees() {
    var p = P(); if (!p || typeof w.carteStats !== 'function' || typeof w.moteur !== 'function') return null;
    var st, R, etat, apc = null, manque = null, plan = null, levier = null, fiable = false;
    try { st = w.carteStats(); R = w.moteur(); } catch (e) { return null; }
    if (!st || !(st.actifs > 0)) return null;
    try { etat = p.scoreState(); } catch (e) { etat = null; }
    try { apc = w.auditPremiumCalc(R).carte; } catch (e) {}
    try { if (typeof w.VerdictManqueCarte === 'function') manque = w.VerdictManqueCarte(); } catch (e) {}
    try { if (typeof w.potentiel === 'function') levier = (w.potentiel().leviers || []).filter(function (l) { return l.id === 'carte' || /prix de la carte/i.test(l.n || ''); })[0] || null; } catch (e) {}
    var cap = (levier && levier.over && Number(levier.over.carte)) || 8;
    try { if (w.VerdictGainRealiste) { fiable = !!w.VerdictGainRealiste.carteFiable(); if (fiable) plan = w.VerdictGainRealiste.cartePlan(cap); } } catch (e) {}
    var obj = 75; try { var o = Number(w.DB && w.DB.reg && w.DB.reg.objp); if (o > 0) obj = o; } catch (e) {}
    var marge = num(st.margePond), theo = num(st.theoR), autres = Math.max(0, 100 - theo - marge);
    return { st: st, etat: etat, apc: apc, manque: manque, plan: plan, levier: levier, fiable: fiable, cap: cap, obj: obj, marge: marge, theo: theo, autres: autres,
      nom: (w.DB && w.DB.etab) || 'Votre carte', mois: manque && manque.mois || '' };
  }
  function anneau(v, col) { var r = 70, c = 2 * Math.PI * r; return '<svg class="cr-ring" viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="' + r + '" class="cr-ring-bg"/><circle cx="90" cy="90" r="' + r + '" class="cr-ring-arc" style="stroke:' + col + ';stroke-dasharray:' + c.toFixed(1) + ';--off:' + (c * (1 - v / 100)).toFixed(1) + ';--len:' + c.toFixed(1) + '"/></svg>'; }

  function tableaux(D) {
    var t = [], e = D.etat, pret = !!(e && e.ready && e.value != null), col = pret ? (e.color || teinte(e.value)) : '#94a3b8';
    /* 1 · Indice Carte */
    t.push('<section class="cr-card cr-c1" data-cr="1"><span class="cr-k">1 · Votre carte</span><h2>' + (pret ? (e.value >= 75 ? 'Une carte qui tient ses marges' : e.value >= 60 ? 'Une carte correcte, à affiner' : e.value >= 31 ? 'Une carte fragile' : 'Une carte qui perd de l’argent') : 'Indice Carte en construction') + '</h2>' +
      '<div class="cr-dial">' + anneau(pret ? e.value : Math.round(num(D.st.partFiable)), col) + '<div class="cr-dial-n"><b data-cr-count="' + (pret ? e.value : Math.round(num(D.st.partFiable))) + '">0</b><small>' + (pret ? '/100' : '%') + '</small></div></div>' +
      '<p class="cr-big"><b>' + pct1(D.marge) + '</b><small>de marge matière pondérée · objectif ' + pct1(D.obj) + '</small></p>' +
      '<p class="cr-p">' + (pret ? 'Indice Carte, calculé avec vos fiches et vos ventes.' : D.st.fiables + ' plats exploitables sur ' + D.st.actifs + ' · l’indice s’affiche à 100 % des fiches et un mois complet.') + '</p><span class="cr-suite">Où va chaque 100 € ↓</span></section>');
    /* 2 · 100 € */
    t.push('<section class="cr-card cr-c2" data-cr="2"><span class="cr-k">2 · Sur chaque 100 € de carte</span><h2>Ce que vos plats gardent</h2>' +
      '<div class="cr-stack"><i style="--w:' + D.theo.toFixed(2) + '%;--c:#f59e0b"><span><small>Matière</small>' + pct1(D.theo).replace(' %', ' €') + '</span></i>' + (D.autres > 0.05 ? '<i style="--w:' + D.autres.toFixed(2) + '%;--c:#c084fc"><span><small>Plateformes, emballages</small>' + pct1(D.autres).replace(' %', ' €') + '</span></i>' : '') + '<i class="cr-res" style="--w:' + D.marge.toFixed(2) + '%;--c:#22c55e"><span><small>Gardés</small>' + pct1(D.marge).replace(' %', ' €') + '</span></i></div>' +
      '<p class="cr-big"><b data-cr-count="' + Math.round(D.marge) + '" data-cr-eur>0 €</b><small>gardés sur 100 € encaissés, avant l’équipe, le loyer et l’impôt</small></p>' +
      '<p class="cr-p">Matière théorique des fiches : ' + pct1(D.theo) + (D.apc && D.apc.ecart != null ? ' · écart réel / théorique ' + (D.apc.ecart > 0 ? '+' : '') + pct1(D.apc.ecart) : '') + '.</p><span class="cr-suite">Vos plats vedettes ↓</span></section>');
    /* 3 · Vedettes */
    var best = (D.apc && D.apc.best || []).slice(0, 3), max = Math.max.apply(null, [1].concat(best.map(function (b) { return num(b.contrib); }))), somme = best.reduce(function (s, b) { return s + num(b.contrib); }, 0);
    if (best.length) t.push('<section class="cr-card cr-c3" data-cr="3"><span class="cr-k">3 · Vos plats vedettes</span><h2>Ceux qui font vivre la maison</h2><ol class="cr-bars">' +
      best.map(function (b, i) { return '<li style="--i:' + i + '"><span class="cr-bl">' + esc(b.nom) + '<small>' + Math.round(num(b.vol)).toLocaleString('fr-FR') + ' vendus · marge matière ' + pct1(b.marge) + '</small></span><span class="cr-track"><i style="--w:' + (num(b.contrib) / max * 100).toFixed(1) + '%"></i></span><b>' + eur(b.contrib) + '</b></li>'; }).join('') + '</ol>' +
      '<p class="cr-big"><b data-cr-count="' + Math.round(somme) + '" data-cr-eur>0 €</b><small>de contribution par mois pour ces trois plats</small></p><span class="cr-suite">L’écart à vos objectifs ↓</span></section>');
    /* 4 · Écart */
    var m = D.manque;
    if (m && m.ready && m.totalC > 0) t.push('<section class="cr-card cr-c4" data-cr="4"><span class="cr-k">4 · L’écart à vos objectifs</span><h2>Là où la marge s’échappe</h2><ol class="cr-leaks">' +
      m.rows.slice(0, 3).map(function (r, i) { return '<li style="--i:' + i + '"><span class="cr-n">' + (i + 1) + '</span><div><b>' + esc(r.nom) + '</b><small>marge matière ' + pct1(r.marge) + ' · objectif ' + pct1(r.obj) + ' · ' + Math.round(num(r.vol)).toLocaleString('fr-FR') + ' vendus</small></div><strong>' + eur(r.totC / 100) + '<small>en ' + esc(m.mois) + '</small></strong></li>'; }).join('') + '</ol>' +
      '<p class="cr-big"><b data-cr-count="' + Math.round(m.totalC / 100) + '" data-cr-eur>0 €</b><small>d’écart à vos objectifs de marge en ' + esc(m.mois) + ' — un écart, pas un gain promis' + (m.incompl ? ' · ' + m.incompl + ' fiche(s) incomplète(s)' : '') + '</small></p>' +
      '<button type="button" class="cr-btn" data-cr-go="plats">Où agir en premier</button><span class="cr-suite">Comment remonter ↓</span></section>');
    /* 5 · Remonter */
    if (D.fiable && D.levier && D.plan && D.plan.rows && D.plan.rows.length) {
      var rows = D.plan.rows.slice(0, 3);
      t.push('<section class="cr-card cr-c5" data-cr="5"><span class="cr-k">5 · Comment remonter</span><h2>Des prix justes, plat par plat</h2><ol class="cr-prix">' +
        rows.map(function (r, i) { return '<li style="--i:' + i + '"><span class="cr-bl">' + esc(r.nom) + '</span><span class="cr-av">' + num(r.avant).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €</span><span class="cr-fl">→</span><span class="cr-ap">' + num(r.apres).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €</span><small>+' + Math.round(num(r.hausse)) + ' %</small></li>'; }).join('') + '</ol>' +
        '<p class="cr-big"><b data-cr-count="' + Math.round(num(D.levier.gain) / 12) + '" data-cr-eur>0 €</b><small>par mois, soit ' + eur(D.levier.gain) + ' par an — le même chiffre que dans l’Audit et Simuler</small></p>' +
        '<p class="cr-p">Au plus +' + D.cap + ' %' + (D.cap < 8 ? ' (réduit pour ne pas dépasser le niveau des meilleurs établissements de votre format)' : '') + ', jamais au-dessus du plat le plus cher de la catégorie, avec 3 % de ventes en moins comptés.</p>' +
        '<button type="button" class="cr-btn" data-cr-go="simuler">Ouvrir dans Simuler</button><span class="cr-suite">Votre prochain pas ↓</span></section>');
    } else t.push('<section class="cr-card cr-c5" data-cr="5"><span class="cr-k">5 · Comment remonter</span><h2>Complétez vos fiches</h2><p class="cr-big"><b data-cr-count="' + Math.round(num(D.st.partFiable)) + '">0</b><small>% de vos plats vendus ont une fiche complète · il en faut 80 % pour chiffrer un plan de prix</small></p><button type="button" class="cr-btn" data-cr-go="menu">Compléter mes fiches</button><span class="cr-suite">Votre prochain pas ↓</span></section>');
    /* 6 · Prochain pas */
    t.push('<section class="cr-card cr-c6" data-cr="6"><span class="cr-k">6 · Votre prochain pas</span><h2>On fait évoluer la carte ?</h2><p class="cr-p">Vera compose des plats complets de saison avec vos produits, ou revoit toute la carte.</p>' +
      '<button type="button" class="cr-cta" data-cr-go="vera">✨ Vera propose</button><div class="cr-cta2"><button type="button" data-cr-go="rotation">Renouveler ma carte</button><button type="button" data-cr-go="sim">Tester un prix</button></div></section>');
    return t.join('');
  }

  function compter(el) {
    var fin = Number(el.getAttribute('data-cr-count')) || 0, euro = el.hasAttribute('data-cr-eur');
    function aff(x) { el.textContent = euro ? eur(x) : String(Math.round(x)); }
    if (REDUIT) return aff(fin);
    var t0 = performance.now(), tPrec = null, duree = 1100;
    (function tour(t) { if (tPrec !== null && t - tPrec > 34) t0 += (t - tPrec) - 16.7; tPrec = t; var p = Math.min(1, (t - t0) / duree), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); aff(fin * e); if (p < 1) requestAnimationFrame(tour); })(t0);
  }
  function jouer(card) { if (card.classList.contains('cr-on')) return; card.classList.add('cr-on'); [].forEach.call(card.querySelectorAll('[data-cr-count]'), function (el, i) { setTimeout(function () { compter(el); }, REDUIT ? 0 : 180 + i * 120); }); }

  function monter() {
    var p = P(), hote = doc.getElementById('c-menu'); if (!p || !hote) return;
    if (p.guided && p.guided()) { var ex = doc.getElementById('vdRecitCarte'); if (ex) ex.remove(); return; }
    var D = donnees(); if (!D) return;
    var cle = [D.etat && D.etat.value, Math.round(D.marge * 10), Math.round(D.theo * 10), D.manque && D.manque.totalC, D.levier && Math.round(num(D.levier.gain)), D.st.actifs, D.st.fiables].join('|');
    var box = doc.getElementById('vdRecitCarte');
    /* C176 (Steven, 20/10 : un ami : « je vais dans Carte, je veux voir ma carte ; là j'ai 6 images avant, sans voir ma
       carte. Voilà la carte, en bas : c'est ça que je veux voir, et après tes 6 images explicatives ») : le récit passe
       SOUS la liste des plats (un seul ordre cible, jamais défait : il n'est déplacé que s'il n'y est pas déjà). */
    var liste = hote.querySelector(':scope > .cp-menu-list');
    function bienPlace() { return liste ? liste.nextElementSibling === box : box.parentNode === hote && !box.nextElementSibling; }
    if (box && box.getAttribute('data-cle') === cle && box.parentNode === hote && bienPlace()) return;
    if (!box) { box = doc.createElement('div'); box.id = 'vdRecitCarte'; }
    box.setAttribute('data-cle', cle);
    box.innerHTML = '<header class="cr-head"><span>Carte · ' + esc(D.nom) + '</span><h1>Votre carte en 6 images</h1><p>Mêmes chiffres que l’Audit et Simuler, lus sur vos fiches et vos ventes.</p></header>' + tableaux(D);
    if (!bienPlace()) { if (liste) liste.after(box); else hote.appendChild(box); }
    [].forEach.call(box.querySelectorAll('[data-cr-go]'), function (b) {
      b.onclick = function () {
        var g = b.getAttribute('data-cr-go');
        try {
          if (g === 'vera' && w.VerdictVeraCarte) w.VerdictVeraCarte.open('dish');
          else if (g === 'simuler') { if (w.VerdictGainRealiste && w.VerdictGainRealiste.ouvrirSimuler) w.VerdictGainRealiste.ouvrirSimuler(); else w.go('dec'); }
          else if (p.open) p.open(g, true);
        } catch (e) {}
      };
    });
    var cartes = box.querySelectorAll('.cr-card');
    if (!('IntersectionObserver' in w) || REDUIT) { [].forEach.call(cartes, jouer); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && (e.intersectionRatio >= 0.45 || (e.target === cartes[0] && e.intersectionRatio >= 0.15))) { jouer(e.target); io.unobserve(e.target); } }); }, { threshold: [0.15, 0.45], rootMargin: '0px 0px -8% 0px' });
    [].forEach.call(cartes, function (c) { io.observe(c); });
  }

  var css = doc.createElement('style'); css.id = 'carte-recit-a33';
  css.textContent =
    '#vdRecitCarte{margin:4px 0 22px;font-family:-apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif}' +
    '#vdRecitCarte .cr-head{padding:6px 4px 14px;color:#101214}#vdRecitCarte .cr-head>span{font:800 11.5px/1 -apple-system,system-ui;letter-spacing:.14em;text-transform:uppercase;color:#166534}' +
    '#vdRecitCarte .cr-head h1{margin:8px 0 6px;font:900 32px/1.05 -apple-system,system-ui;letter-spacing:-.025em}#vdRecitCarte .cr-head p{margin:0;color:#5f6670;font-size:14.5px}' +
    'html.vd-workspace-dark #vdRecitCarte .cr-head>span{color:#4ade80}html.vd-workspace-dark #vdRecitCarte .cr-head{color:#f1f5f9}html.vd-workspace-dark #vdRecitCarte .cr-head p{color:#94a3b8}' +
    '#vdRecitCarte .cr-card{position:relative;overflow:hidden;min-height:min(68vh,580px);margin:0 0 16px;padding:26px 22px 22px;border-radius:28px;color:#f8fafc;display:flex;flex-direction:column;justify-content:center;gap:14px;box-shadow:0 22px 60px rgba(2,8,23,.28);isolation:isolate}' +
    '#vdRecitCarte .cr-card:before{content:"";position:absolute;inset:-40%;z-index:-1;background:radial-gradient(circle at 75% 20%,var(--g1),transparent 45%),radial-gradient(circle at 15% 85%,var(--g2),transparent 50%);opacity:.9}' +
    '#vdRecitCarte .cr-c1{background:#07130d;--g1:rgba(34,197,94,.35);--g2:rgba(16,185,129,.18)}#vdRecitCarte .cr-c2{background:#0b1120;--g1:rgba(245,158,11,.30);--g2:rgba(192,132,252,.22)}' +
    '#vdRecitCarte .cr-c3{background:#140f05;--g1:rgba(250,204,21,.34);--g2:rgba(34,197,94,.16)}#vdRecitCarte .cr-c4{background:#160a10;--g1:rgba(239,68,68,.32);--g2:rgba(245,158,11,.18)}' +
    '#vdRecitCarte .cr-c5{background:#06120f;--g1:rgba(52,211,153,.32);--g2:rgba(250,204,21,.22)}#vdRecitCarte .cr-c6{background:#0a0a0a;--g1:rgba(250,204,21,.30);--g2:rgba(34,197,94,.24)}' +
    '#vdRecitCarte .cr-k{font:800 12px/1 -apple-system,system-ui;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.72)}' +
    '#vdRecitCarte h2{margin:0;font:900 clamp(28px,7.4vw,44px)/1.04 -apple-system,system-ui;letter-spacing:-.03em;color:#fff}' +
    '#vdRecitCarte .cr-p{margin:0;color:rgba(248,250,252,.82);font-size:16px;line-height:1.4}' +
    '#vdRecitCarte .cr-big{margin:4px 0 0;display:flex;flex-direction:column;gap:6px}#vdRecitCarte .cr-big b{font:900 clamp(40px,11vw,64px)/1 -apple-system,system-ui;letter-spacing:-.035em;font-variant-numeric:tabular-nums;color:#fff}#vdRecitCarte .cr-big small{font-size:14.5px;color:rgba(248,250,252,.78)}' +
    '#vdRecitCarte .cr-suite{margin-top:6px;padding-top:8px;font:700 13px/1 -apple-system,system-ui;color:rgba(255,255,255,.62);animation:crBouge 1.8s ease-in-out infinite}@keyframes crBouge{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}' +
    '#vdRecitCarte .cr-card>*{opacity:0;transform:translateY(16px);transition:opacity .55s ' + E + ',transform .55s ' + E + '}#vdRecitCarte .cr-card.cr-on>*{opacity:1;transform:none}' +
    '#vdRecitCarte .cr-card.cr-on>*:nth-child(2){transition-delay:.07s}#vdRecitCarte .cr-card.cr-on>*:nth-child(3){transition-delay:.14s}#vdRecitCarte .cr-card.cr-on>*:nth-child(4){transition-delay:.21s}#vdRecitCarte .cr-card.cr-on>*:nth-child(n+5){transition-delay:.3s}' +
    '#vdRecitCarte .cr-dial{position:relative;width:180px;height:180px;margin:4px auto 0}#vdRecitCarte .cr-ring{width:100%;height:100%;transform:rotate(-90deg)}#vdRecitCarte .cr-ring-bg{fill:none;stroke:rgba(255,255,255,.12);stroke-width:14}' +
    '#vdRecitCarte .cr-ring-arc{fill:none;stroke-width:14;stroke-linecap:round;stroke-dashoffset:var(--len);transition:stroke-dashoffset 1.2s ' + E + ' .2s;filter:drop-shadow(0 0 10px currentColor)}#vdRecitCarte .cr-on .cr-ring-arc{stroke-dashoffset:var(--off)}' +
    '#vdRecitCarte .cr-dial-n{position:absolute;inset:0;display:flex;align-items:baseline;justify-content:center;padding-top:62px}#vdRecitCarte .cr-dial-n b{font:900 56px/1 -apple-system,system-ui;font-variant-numeric:tabular-nums}#vdRecitCarte .cr-dial-n small{font-size:16px;color:rgba(255,255,255,.7);margin-left:3px}' +
    '#vdRecitCarte .cr-stack{display:flex;height:66px;border-radius:16px;overflow:hidden;background:rgba(255,255,255,.08);clip-path:inset(0 100% 0 0 round 16px);transition:clip-path 1.1s ' + E + ' .2s}#vdRecitCarte .cr-on .cr-stack{clip-path:inset(0 0 0 0 round 16px)}' +
    '#vdRecitCarte .cr-stack i{display:block;height:100%;flex:0 0 var(--w);background:var(--c);min-width:0}#vdRecitCarte .cr-stack i+i{box-shadow:inset 2px 0 0 rgba(0,0,0,.18)}#vdRecitCarte .cr-stack .cr-res{background:linear-gradient(90deg,#16a34a,#4ade80)}' +
    '#vdRecitCarte .cr-stack i>span{display:none;flex-direction:column;justify-content:center;height:100%;padding:0 12px;overflow:hidden;white-space:nowrap;color:#0b1120;font:800 17px/1.1 -apple-system,system-ui;font-variant-numeric:tabular-nums}#vdRecitCarte .cr-stack i>span small{font:700 11px/1.2 -apple-system,system-ui;letter-spacing:.06em;text-transform:uppercase;opacity:.72}' +
    '#vdRecitCarte .cr-bars,#vdRecitCarte .cr-prix,#vdRecitCarte .cr-leaks{list-style:none;margin:0;padding:0;display:grid;gap:12px}' +
    '#vdRecitCarte .cr-bars li{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center;opacity:0;transform:translateY(10px);transition:opacity .35s ' + E + ',transform .35s ' + E + ';transition-delay:calc(var(--i)*.16s + .1s)}#vdRecitCarte .cr-on .cr-bars li{opacity:1;transform:none}' +
    '#vdRecitCarte .cr-bl{font-size:14.5px;color:#fff;font-weight:700;min-width:0}#vdRecitCarte .cr-bl small{display:block;font-weight:400;color:rgba(248,250,252,.7);font-size:12.5px}#vdRecitCarte .cr-bars b{font:800 15px/1.1 -apple-system,system-ui;font-variant-numeric:tabular-nums;color:#fde68a}' +
    '#vdRecitCarte .cr-track{grid-column:1/-1;position:relative;height:12px;border-radius:6px;background:rgba(255,255,255,.07)}#vdRecitCarte .cr-track i{position:absolute;top:0;bottom:0;left:0;width:var(--w);border-radius:6px;background:linear-gradient(90deg,#d4a017,#fde68a);transform:scaleX(0);transform-origin:left;transition:transform .6s ' + E + ';transition-delay:calc(var(--i)*.16s + .25s)}#vdRecitCarte .cr-on .cr-track i{transform:scaleX(1)}' +
    '#vdRecitCarte .cr-leaks li{display:flex;align-items:center;gap:12px;padding:14px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);transform:translateX(-12px);opacity:0;transition:transform .6s ' + E + ',opacity .6s ' + E + ';transition-delay:calc(var(--i)*.16s + .25s)}#vdRecitCarte .cr-on .cr-leaks li{transform:none;opacity:1}' +
    '#vdRecitCarte .cr-n{flex:0 0 30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(239,68,68,.22);color:#fca5a5;font-weight:900}#vdRecitCarte .cr-leaks li div{flex:1;min-width:0}#vdRecitCarte .cr-leaks li div b{display:block;color:#fff;font-size:16px}#vdRecitCarte .cr-leaks li div small{color:rgba(248,250,252,.7);font-size:12.5px}' +
    '#vdRecitCarte .cr-leaks strong{text-align:right;color:#fde68a;font:900 19px/1.1 -apple-system,system-ui;font-variant-numeric:tabular-nums;white-space:nowrap}#vdRecitCarte .cr-leaks strong small{display:block;font-size:11px;color:rgba(253,230,138,.75);font-weight:600}' +
    '#vdRecitCarte .cr-prix li{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;align-items:center;gap:4px 8px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.1);opacity:0;transform:translateY(10px);transition:opacity .35s ' + E + ',transform .35s ' + E + ';transition-delay:calc(var(--i)*.16s + .1s)}#vdRecitCarte .cr-on .cr-prix li{opacity:1;transform:none}' +
    '#vdRecitCarte .cr-prix .cr-av{color:rgba(248,250,252,.6);text-decoration:line-through;font-variant-numeric:tabular-nums}#vdRecitCarte .cr-prix .cr-fl{color:rgba(248,250,252,.5)}#vdRecitCarte .cr-prix .cr-ap{font:800 17px/1 -apple-system,system-ui;color:#6ee7b7;font-variant-numeric:tabular-nums}#vdRecitCarte .cr-prix small{grid-column:1/-1;color:rgba(248,250,252,.6);font-size:12px}' +
    '#vdRecitCarte .cr-btn{align-self:flex-start;min-height:48px;padding:0 20px;border-radius:14px;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.1);color:#fff;font:800 15px/1 -apple-system,system-ui;cursor:pointer}' +
    '#vdRecitCarte .cr-cta{min-height:60px;border:0;border-radius:18px;background:linear-gradient(90deg,#b8860b,#e3b341);color:#1a1200;font:900 18px/1 -apple-system,system-ui;cursor:pointer;box-shadow:0 14px 34px rgba(212,167,44,.4)}' +
    '#vdRecitCarte .cr-cta2{display:flex;gap:10px}#vdRecitCarte .cr-cta2 button{flex:1;min-height:50px;border-radius:16px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;font:800 15px/1 -apple-system,system-ui;cursor:pointer}' +
    '@media (min-width:700px){#vdRecitCarte{max-width:880px;margin-left:auto;margin-right:auto}#vdRecitCarte .cr-suite{display:none}#vdRecitCarte .cr-head h1{font-size:44px}#vdRecitCarte .cr-card{min-height:0;padding:38px 42px;border-radius:32px}' +
      '#vdRecitCarte .cr-c1{display:grid;grid-template-columns:minmax(0,1fr) 230px;grid-template-areas:"k d" "h d" "b d" "p d";gap:14px 40px;align-items:center}#vdRecitCarte .cr-c1>.cr-k{grid-area:k}#vdRecitCarte .cr-c1>h2{grid-area:h}#vdRecitCarte .cr-c1>.cr-big{grid-area:b}#vdRecitCarte .cr-c1>.cr-p{grid-area:p}#vdRecitCarte .cr-c1>.cr-dial{grid-area:d;width:230px;height:230px;margin:0}#vdRecitCarte .cr-c1 .cr-dial-n{padding-top:86px}#vdRecitCarte .cr-c1 .cr-dial-n b{font-size:64px}' +
      '#vdRecitCarte .cr-stack i>span{display:flex}#vdRecitCarte .cr-c6{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,380px);grid-template-areas:"k c" "h c" "p c2";gap:12px 44px;align-items:center}#vdRecitCarte .cr-c6>.cr-k{grid-area:k}#vdRecitCarte .cr-c6>h2{grid-area:h}#vdRecitCarte .cr-c6>.cr-p{grid-area:p}#vdRecitCarte .cr-c6>.cr-cta{grid-area:c;align-self:end}#vdRecitCarte .cr-c6>.cr-cta2{grid-area:c2;align-self:start}}' +
    '@media (min-width:1100px){#vdRecitCarte{max-width:1240px;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:22px;align-items:stretch}#vdRecitCarte .cr-head{grid-column:1/-1}#vdRecitCarte .cr-card{margin:0}#vdRecitCarte .cr-c1,#vdRecitCarte .cr-c6{grid-column:1/-1}#vdRecitCarte .cr-c2{grid-column:span 7}#vdRecitCarte .cr-c3{grid-column:span 5}#vdRecitCarte .cr-c4{grid-column:span 5}#vdRecitCarte .cr-c5{grid-column:span 7}#vdRecitCarte .cr-c1>h2{font-size:56px}}' +
    '@media (hover:hover) and (pointer:fine) and (min-width:700px){#vdRecitCarte .cr-card{transition:transform .35s ' + E + ',box-shadow .35s ' + E + '}#vdRecitCarte .cr-card:hover{transform:translateY(-3px);box-shadow:0 30px 70px rgba(2,8,23,.34)}}' +
    '@media (prefers-reduced-motion:reduce){#vdRecitCarte *{transition:none!important;animation:none!important}#vdRecitCarte .cr-card>*{opacity:1;transform:none}}';
  (doc.head || doc.documentElement).appendChild(css);

  /* Montage dans la même image que la Carte : le rendu des pages, puis les retours sur l'onglet. */
  function brancher() {
    var p = P(); if (!p || p.__vdRecitCarte) return !!p;
    p.__vdRecitCarte = true;
    if (typeof p.render === 'function') { var r0 = p.render; p.render = function () { var out = r0.apply(this, arguments); try { monter(); } catch (e) {} return out; }; }
    if (typeof p.open === 'function') { var o0 = p.open; p.open = function (page) { var out = o0.apply(this, arguments); if (page === 'menu') setTimeout(monter, 0); return out; }; }
    return true;
  }
  if (typeof w.go === 'function') { var go0 = w.go; w.go = function (v) { var out = go0.apply(this, arguments); if (v === 'carte') setTimeout(monter, 0); return out; }; }
  w.VerdictRecitCarte = { monter: monter, donnees: donnees };
  (function boot(n) { if (brancher()) { setTimeout(monter, 0); return; } if (n > 0) setTimeout(function () { boot(n - 1); }, 300); })(60);
})();
