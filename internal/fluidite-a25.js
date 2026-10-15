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
  if (typeof w.decMove === 'function') {
    var bouger = avecMemoire(w.decMove), enAttente = null, image = 0;
    w.decMove = function (id, el) {
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
