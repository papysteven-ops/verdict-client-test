/* C92 — Curseurs de Simuler fluides (Steven, 16/10 : « pas du tout fluide », « sur mobile j'ai du mal à bouger »).
   Mesure : à chaque mouvement, le calcul complet de l'établissement (moteur) tournait 100 fois pour seulement
   3 situations différentes (environ 50 ms par mouvement sur Mac, plusieurs fois plus sur iPhone).
   1. Pendant un même rendu de Simuler, un calcul déjà fait pour exactement les mêmes chiffres est réutilisé
      (mémoire vidée dès la fin du rendu : aucune donnée périmée).
   2. Les mouvements de curseur sont regroupés : un seul rendu par image affichée, avec la dernière position. */
(function () {
  'use strict';
  var w = window; if (w.__vdFluidite) return; w.__vdFluidite = true;
  if (typeof w.moteur !== 'function') return;
  var calcul = w.moteur, memoire = null;
  w.moteur = function (over) {
    if (!memoire) return calcul.apply(this, arguments);
    var cle; try { cle = JSON.stringify(over === undefined ? null : over); } catch (e) { return calcul.apply(this, arguments); }
    if (Object.prototype.hasOwnProperty.call(memoire, cle)) return memoire[cle];
    return (memoire[cle] = calcul.apply(this, arguments));
  };
  function avecMemoire(fn) {
    return function () {
      var proprio = !memoire; if (proprio) memoire = Object.create(null);
      try { return fn.apply(this, arguments); } finally { if (proprio) memoire = null; }
    };
  }
  ['drawDec', 'decBest', 'decResetAll', 'decDrawTotal'].forEach(function (n) { if (typeof w[n] === 'function') w[n] = avecMemoire(w[n]); });
  /* C94 — Pendant le glissé, seuls le curseur, sa carte et la barre du total se mettent à jour. Le récapitulatif, la
     fourchette et le recalage de la marge du bas (qui force un calcul de mise en page) sont refaits une seule fois,
     180 ms après l'arrêt du doigt. */
  var glisse = false, repos = 0, aRefaire = {};
  ['decDrawRecap', 'decFourchetteInject', 'decPadFix'].forEach(function (n) {
    var f = w[n]; if (typeof f !== 'function') return;
    w[n] = function () { if (glisse) { aRefaire[n] = arguments; return; } return f.apply(this, arguments); };
    w[n].__vdOrig = f;
  });
  var finGlisse = avecMemoire(function () {
    glisse = false; var faire = aRefaire; aRefaire = {};
    ['decDrawRecap', 'decFourchetteInject', 'decPadFix'].forEach(function (n) { if (faire[n] && w[n]) try { w[n].apply(w, faire[n]); } catch (e) {} });
  });
  if (typeof w.decMove === 'function') {
    var bouger = avecMemoire(w.decMove), enAttente = null, image = 0;
    w.decMove = function (id, el) {
      glisse = true; clearTimeout(repos); repos = setTimeout(finGlisse, 180);
      enAttente = [id, el];
      if (image) return;
      image = requestAnimationFrame(function () { image = 0; var p = enAttente; enAttente = null; if (p) bouger(p[0], p[1]); });
    };
  }
})();

/* C92 (suite) — Sur iPhone, un curseur natif ne bouge que si l'on attrape exactement sa pastille. Ici, toucher n'importe
   où sur la barre place la pastille sous le doigt, puis glisser la suit ; zone tactile de 44 px de haut ; le défilement
   vertical de la page reste libre. */
(function () {
  'use strict';
  var doc = document; if (doc.__vdCurseurs) return; doc.__vdCurseurs = true;
  var st = doc.createElement('style');
  st.textContent = 'input[type=range]{touch-action:pan-y;min-height:44px;cursor:pointer}';
  (doc.head || doc.documentElement).appendChild(st);
  var actif = null, x0 = 0, y0 = 0, decide = false;
  function valeur(el, clientX) {
    var r = el.getBoundingClientRect(), pouce = 28, min = +el.min || 0, max = el.max === '' ? 100 : +el.max, pas = +el.step || 1;
    var f = Math.max(0, Math.min(1, (clientX - r.left - pouce / 2) / Math.max(1, r.width - pouce)));
    var v = min + f * (max - min); v = Math.round((v - min) / pas) * pas + min;
    return Math.max(min, Math.min(max, +v.toFixed(6)));
  }
  function poser(el, clientX) {
    var v = String(valeur(el, clientX)); if (el.value === v) return;
    el.value = v; el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  doc.addEventListener('pointerdown', function (e) {
    var el = e.target; if (!el || el.tagName !== 'INPUT' || el.type !== 'range' || el.disabled) return;
    actif = el; x0 = e.clientX; y0 = e.clientY; decide = e.pointerType === 'mouse';
    if (decide) poser(el, e.clientX);
  }, true);
  doc.addEventListener('pointermove', function (e) {
    if (!actif) return;
    if (!decide) {
      var dx = Math.abs(e.clientX - x0), dy = Math.abs(e.clientY - y0);
      if (dy > 10 && dy > dx) { actif = null; return; } /* geste vertical : on laisse défiler la page */
      if (dx < 4) return; decide = true;
    }
    poser(actif, e.clientX);
  }, true);
  function fin(e) {
    if (!actif) return; var el = actif; actif = null;
    if (!decide && e && e.type === 'pointerup') poser(el, e.clientX); /* simple toucher : la pastille vient sous le doigt */
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  doc.addEventListener('pointerup', fin, true);
  doc.addEventListener('pointercancel', function () { actif = null; }, true);
})();

/* C95 — Simuler, demandes de Steven (vidéo du 16/10) :
   1. La barre du total clignotait en noir pendant le glissé (rendu brut, puis repeint par le thème clair) : elle a
      désormais son propre style clair et sombre, jamais repeint ; « Score » y est nommé « Indice de sérénité ».
   2. Le bandeau « Modifications non enregistrées » passait par-dessus la barre du total : dans Simuler, il se place
      en haut de l'écran.
   3. Boutons − et + de part et d'autre de chaque curseur, au pas du curseur, pour être précis (appui long = défile). */
(function () {
  'use strict';
  var w = window, doc = document; if (doc.__vdSimC95) return; doc.__vdSimC95 = true;
  var st = doc.createElement('style'); st.id = 'vd-sim-c95';
  st.textContent =
    'html.vd-workspace-light #decTotalBar{background:#ffffff!important;color:#0f172a!important;border:1px solid #e3e8ee!important;box-shadow:0 -2px 6px rgba(15,23,42,.04),0 14px 34px rgba(15,23,42,.14)!important}' +
    'html.vd-workspace-light #decTotalBar .dt-k,html.vd-workspace-light #decTotalBar .dt-t,html.vd-workspace-light #decTotalBar .dt-line span{color:#64748b!important}' +
    'html.vd-workspace-light #decTotalBar .dt-line b{color:#0f172a}html.vd-workspace-light #decTotalBar .dt-line{border-top-color:#e9edf2!important}' +
    'html.vd-workspace-light #decTotalBar .dt-reset{color:#334155!important;border-color:#dbe2ea!important;background:#ffffff!important}' +
    'html.vd-workspace-light #decTotalBar .dt-replay{background:#eff6ff!important;color:#1d4ed8!important;border-color:#bfdbfe!important}' +
    'body:has(#decTotalBar.on) #sg13-bar{top:calc(env(safe-area-inset-top,0px) + 10px)!important;bottom:auto!important}' +
    '.vd-pas{display:flex;align-items:center;gap:10px}.vd-pas>input[type=range]{flex:1;min-width:0}' +
    '.vd-pas>button{flex:0 0 44px;width:44px;height:44px;border-radius:14px;border:1px solid var(--line,#dbe2ea);background:var(--card2,#f4f6f9);color:var(--txt,#0f172a);font:800 22px/1 -apple-system,system-ui,sans-serif;cursor:pointer;touch-action:manipulation;-webkit-user-select:none;user-select:none}' +
    '.vd-pas>button:active{transform:scale(.94)}' +
    'html.vd-workspace-light .vd-pas>button{background:#f4f6f9!important;color:#0f172a!important;border-color:#dbe2ea!important}';
  (doc.head || doc.documentElement).appendChild(st);
  /* Libellé de la barre du total. */
  if (typeof w.decDrawTotal === 'function') {
    var dt = w.decDrawTotal;
    w.decDrawTotal = function () {
      var r = dt.apply(this, arguments);
      try { var d = doc.getElementById('dt-detail'); if (d) [].forEach.call(d.querySelectorAll('span'), function (s) { var n = s.firstChild; if (n && n.nodeType === 3 && /^\s*Score\s*$/.test(n.nodeValue)) n.nodeValue = 'Indice de sérénité '; }); } catch (e) {}
      return r;
    };
  }
  /* Boutons − / +. */
  function pas(el, sens) {
    var min = el.min === '' ? -Infinity : +el.min, max = el.max === '' ? Infinity : +el.max, p = +el.step || 1;
    var v = Math.round(((+el.value || 0) + sens * p) / p) * p; v = Math.max(min, Math.min(max, +v.toFixed(6)));
    if (String(v) === el.value) return;
    el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function equiper() {
    [].forEach.call(doc.querySelectorAll('#v-dec input[type=range]:not([data-pas])'), function (el) {
      el.setAttribute('data-pas', '1');
      var box = doc.createElement('div'); box.className = 'vd-pas';
      var moins = doc.createElement('button'), plus = doc.createElement('button');
      moins.type = plus.type = 'button'; moins.textContent = '−'; plus.textContent = '+';
      moins.setAttribute('aria-label', 'Diminuer'); plus.setAttribute('aria-label', 'Augmenter');
      el.parentNode.insertBefore(box, el); box.appendChild(moins); box.appendChild(el); box.appendChild(plus);
      [[moins, -1], [plus, 1]].forEach(function (b) {
        var t1 = 0, t2 = 0;
        function stop() { clearTimeout(t1); clearInterval(t2); if (t1 || t2) el.dispatchEvent(new Event('change', { bubbles: true })); t1 = t2 = 0; }
        b[0].addEventListener('pointerdown', function (e) { e.preventDefault(); pas(el, b[1]); t1 = setTimeout(function () { t2 = setInterval(function () { pas(el, b[1]); }, 90); }, 420); });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (n) { b[0].addEventListener(n, stop); });
        b[0].addEventListener('click', function (e) { if (e.detail === 0) pas(el, b[1]); }); /* clavier */
      });
    });
  }
  try { var v = doc.getElementById('v-dec'); if (v) new MutationObserver(equiper).observe(v, { childList: true, subtree: true }); equiper(); } catch (e) {}
})();
