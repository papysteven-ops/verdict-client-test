/* C85 — Audit visuel « Votre audit en 60 secondes » (demande de Steven, 16/10 : « l'animation démarre au bon moment
   du défilement si on ne tombe pas directement dessus »).
   La scène 1 (anneau du score, compteur) se jouait au rendu, même sous la ligne de flottaison : sur iPhone, elle était
   finie quand le client y arrivait. Ici, si le module n'est pas à l'écran à l'ouverture, la scène attend et se joue
   quand son visuel (anneau du score) entre vraiment à l'écran (60 % visibles au-dessus de la barre du bas), une fois par affichage de l'Audit.
   Aucune donnée ni aucun calcul touchés ; immobile si l'appareil demande moins d'animations. */
(function () {
  'use strict';
  var doc = document; if (window.__vdAnimA23) return; window.__vdAnimA23 = 1;
  var reduit = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reduit || !('IntersectionObserver' in window)) return;
  var suivi = null;
  function guetter() {
    var root = doc.querySelector('#auditBody [data-audit-visual-story]'); if (!root || root === suivi) return; suivi = root;
    var premier = true, io = new IntersectionObserver(function (e) {
      var vu = e[e.length - 1].isIntersecting, scenes = root.querySelectorAll('[data-av31-scene]'), i, on = -1;
      for (i = 0; i < scenes.length; i++) if (scenes[i].classList.contains('on')) on = i;
      if (premier) { premier = false; if (vu) { io.disconnect(); return; } if (on >= 0) scenes[on].classList.remove('play'); return; }
      if (vu) { io.disconnect(); if (on >= 0 && typeof window.av31Go === 'function') window.av31Go(on); }
    }, { threshold: 0.6, rootMargin: '0px 0px -12% 0px' });
    /* on guette le visuel animé de la scène (anneau du score, barres, jauge), pas tout le module */
    var sc = root.querySelector('.av31-scene.on');
    io.observe((sc && sc.querySelector('.av31-score,.av31-costs,.av31-gauge,.av31-limit,.av31-decision')) || root);
  }
  try { var a = doc.getElementById('v-audit'); if (a) new MutationObserver(guetter).observe(a, { childList: true, subtree: true }); guetter(); } catch (e) {}
})();
