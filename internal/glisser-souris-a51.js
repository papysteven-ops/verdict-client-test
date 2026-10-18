/* C167 — Défilement à la souris (Steven, 19/10 : « j'ai des fonctions qui ne marchent pas du tout, exemple Journée :
   défilement impossible »). Les bandes qui défilent de côté — « Courbe des journées » (« Glissez pour voir chaque
   journée »), rangée des jours, onglets — n'ont pas de barre de défilement visible : au doigt ou au pavé tactile elles
   glissent, mais avec une souris rien ne bougeait (ni en tirant, ni à la molette).
   Ici, sur ordinateur (souris) : on attrape la bande et on la tire, comme au doigt (curseur « main »). Un clic sans
   glisser reste un clic (toucher un point de la courbe ouvre son détail). La molette n'est pas détournée : la page
   défile toujours normalement. Rien ne change au doigt ni au pavé tactile. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdGlisserSouris) return; w.__vdGlisserSouris = true;
  var CSS = 'html.vx51-tire,html.vx51-tire *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}' +
    '@media (hover:hover) and (pointer:fine){.jscroll,.rang-j{cursor:grab}}';
  var CHAMP = /^(INPUT|TEXTAREA|SELECT|OPTION)$/;
  function bande(el) {
    for (var e = el; e && e.nodeType === 1 && e.tagName !== 'BODY'; e = e.parentElement) {
      if (e.scrollWidth > e.clientWidth + 2) {
        var ox = e.ownerDocument.defaultView.getComputedStyle(e).overflowX;
        if (ox === 'auto' || ox === 'scroll') return e;
      }
    }
    return null;
  }
  function poser(d) {
    try {
      if (!d || !d.documentElement || d.__vx51) return; d.__vx51 = true;
      var s = d.createElement('style'); s.id = 'vx51-css'; s.textContent = CSS; (d.head || d.documentElement).appendChild(s);
      var W = d.defaultView, el = null, x0 = 0, sl0 = 0, tire = false, bloquerClic = false;
      function fin() { if (tire) { d.documentElement.classList.remove('vx51-tire'); bloquerClic = true; W.setTimeout(function () { bloquerClic = false; }, 50); } el = null; tire = false; }
      d.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0 || CHAMP.test(e.target.tagName) || e.target.isContentEditable) return;
        el = bande(e.target); if (!el) return; x0 = e.clientX; sl0 = el.scrollLeft; tire = false;
      }, true);
      d.addEventListener('pointermove', function (e) {
        if (!el) return; if (!e.buttons) return fin();
        var dx = e.clientX - x0;
        if (!tire && Math.abs(dx) < 6) return;
        if (!tire) { tire = true; d.documentElement.classList.add('vx51-tire'); }
        el.scrollLeft = sl0 - dx; e.preventDefault();
      }, true);
      d.addEventListener('pointerup', fin, true);
      d.addEventListener('pointercancel', fin, true);
      W.addEventListener('blur', fin);
      /* Après un glissé, le clic qui suit n'ouvre rien. */
      d.addEventListener('click', function (e) { if (bloquerClic) { bloquerClic = false; e.preventDefault(); e.stopPropagation(); } }, true);
      d.addEventListener('dragstart', function (e) { if (el) e.preventDefault(); }, true);
    } catch (e) {}
  }
  function tour() {
    poser(doc);
    [].forEach.call(doc.querySelectorAll('iframe'), function (f) { try { poser(f.contentDocument); } catch (e) {} });
  }
  var t = setInterval(tour, 1500); if (t && t.unref) t.unref();
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', tour); else tour();
  w.VerdictGlisserSouris = { tour: tour, bande: bande };
})();
