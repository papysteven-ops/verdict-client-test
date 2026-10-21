/* C159 — Les animations jouent dès le premier passage (Steven, 18/10 : « les animations ne marchent pas directement,
   mais si je vais en arrière et reviens sur le module, ça marche ; le but : dès le premier passage, sinon aucun intérêt »).
   Un écran peut être dessiné avant d'être vu : derrière l'écran de verrouillage (Face ID / code) ou de chargement, ou dans
   un cadre encore caché. Safari joue alors ses animations dans le vide, et le client arrive sur un écran déjà figé.
   Au moment où l'écran devient réellement visible — appli déverrouillée, changement de page — ses animations d'arrivée
   sont rejouées (elles repartent du début, exactement comme au second passage). Les chapitres de l'Accueil sont traités
   dans accueil-chapitres-a40.js. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdRejouer) return; w.__vdRejouer = true;
  var CSS = '.vx50-rej,.vx50-rej *{animation:none!important}';
  function css(d) { try { if (d && d.head && !d.getElementById('vx50-css')) { var s = d.createElement('style'); s.id = 'vx50-css'; s.textContent = CSS; d.head.appendChild(s); } } catch (e) {} }
  function rejouer(el) {
    if (!el || !el.classList) return; var d = el.ownerDocument, W = d && d.defaultView; if (!W) return;
    /* V05 (21/10) : retrait dans le même geste, après un recalcul forcé (les animations repartent du début). Les deux images
       d'attente duraient jusqu'à 0,7 s pendant le chargement d'un cadre, puis la vue repartait d'une opacité 0 : page vide. */
    css(d); el.classList.add('vx50-rej'); void el.offsetWidth; el.classList.remove('vx50-rej');
  }
  /* L'écran visible : la vue active et ses cadres internes (dans l'Accueil, seulement le chapitre affiché). */
  /* V05 (21/10) : au changement de page, la vue qui s'ouvre joue déjà ses animations d'arrivée : seuls ses cadres internes
     (déjà dessinés, peut-être hors de la vue) sont rejoués. */
  function ecranVisible(navigation) {
    var v = doc.querySelector('.view.on'); if (!v) return;
    if (navigation !== true) rejouer(v);
    [].forEach.call(v.querySelectorAll('iframe'), function (f) {
      try { var fd = f.contentDocument; if (!fd || !fd.body || !f.getClientRects().length) return; rejouer(fd.querySelector('.vx40-ch:not([hidden])') || fd.body); } catch (e) {}
    });
  }
  var dernier = 0;
  function apres(ms) { var t = Date.now(); if (t - dernier < 400) return; dernier = t; setTimeout(ecranVisible, ms); }
  /* 1. Appli déverrouillée (signal du verrou, dans la coquille ou dans cette page). */
  w.addEventListener('message', function (e) { if (e && e.data && e.data.type === 'verdict-verrou-ouvert') apres(60); });
  w.addEventListener('verdict:verrou-ouvert', function () { apres(60); });
  /* 2. Retour sur l'appli après l'avoir quittée (l'écran a pu rester figé en arrière-plan). */
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) apres(120); });
  /* 3. Changement de page. */
  function brancher() {
    if (typeof w.go !== 'function' || w.go.__vx50) return;
    var g0 = w.go, g = function () { var r = g0.apply(this, arguments); setTimeout(function () { ecranVisible(true); }, 80); return r; };
    for (var k in g0) { try { g[k] = g0[k]; } catch (e) {} } g.__vx50 = true; w.go = g;
  }
  var t = setInterval(brancher, 1000); if (t && t.unref) t.unref(); brancher();
  w.VerdictRejouer = { rejouer: rejouer, ecranVisible: ecranVisible };
})();
