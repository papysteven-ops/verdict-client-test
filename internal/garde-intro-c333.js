/* Verdict® — C333 (L6, Steven : « au lancement toute l'animation bug, plus du tout fluide », Mac M5). Mesuré dans WebKit : l'écran
   d'ouverture restait 13 à 20 s (l'anneau dure 3 s) : pendant l'anneau, les contrôles périodiques des modules (Accueil, courbes,
   chapitres, équipe…, toutes les 0,9 à 4 s, jusqu'à 1,25 s par passe) occupaient le fil principal et les étapes de l'anneau glissaient.
   Chargé en tout premier dans Pilotage : tant que l'écran d'ouverture est affiché, une minuterie périodique de 900 ms ou plus passe son
   tour (elle reprend au tour suivant, après l'ouverture). Ce qui conduit l'ouverture elle-même (intro, écran d'ouverture, verrou,
   démarrage) n'est jamais retenu. Aucun effet quand l'intro ne se joue pas (déjà vue sur l'appareil).
   A17 (L6, audit vitesse du 27/10) : la garde connaît aussi le verrou et le module caché. Tant que le verrou de la coque est affiché
   (porte C378 fermée, ou verrou réaffiché à la reprise) ou que le Pilotage n'est pas le module affiché (Inventaire ouvert, appli en
   arrière-plan), une minuterie de 250 ms ou plus passe son tour. Au retour (déverrouillage, retour au module), chaque minuterie qui a
   sauté au moins un tour est rattrapée une fois, une par image. Signal pour les autres fichiers : window.VerdictGarde =
   { ouverture(), verrou(), cache(), retenu() }. */
(function () {
  'use strict';
  var w = window; if (w.__vdGardeIntro) return; w.__vdGardeIntro = true;
  var sI = w.setInterval, cI = w.clearInterval, SEUIL = 900, SEUIL_RETENU = 250, OUVERTURE = /splash|intro|verrou|boot|demarr|démarr/i;
  function enOuverture() { try { return !!(w.__vdAnimIntro || document.getElementById('splash')); } catch (e) { return false; } }
  var H = null; try { if (w.parent && w.parent !== w && w.parent.document) H = w.parent; } catch (e) { H = null; }
  /* verrou de la coque : porte encore fermée, ou verrou réaffiché (#vr16 visible et verrouillé) ; state() n'est lu que si #vr16 est affiché */
  function verrou() {
    try { if (w.__vdPorte && w.__vdPorte.fermee()) return true; } catch (e) {}
    try {
      var vr = H && H.document.getElementById('vr16'); if (!vr || vr.hidden) return false;
      var V = H.VerdictVerrou, st = V && V.state && V.state(); return !!(st && st.locked);
    } catch (e) { return false; }
  }
  /* module caché : appli en arrière-plan, ou panneau de la coque qui n'est pas le module affiché */
  function panneau() { try { var fe = w.frameElement, p = fe && fe.parentElement; return p && p.classList && p.classList.contains('module-panel') ? p : null; } catch (e) { return null; } }
  function cache() { try { if (document.hidden) return true; var p = panneau(); return !!(p && !p.classList.contains('active')); } catch (e) { return false; } }
  function retenu() { return cache() || verrou(); }
  var manques = [], parId = {}, prevu = false;
  function prochaineImage(f) { if (typeof w.requestAnimationFrame === 'function' && !document.hidden) w.requestAnimationFrame(function () { setTimeout(f, 0); }); else setTimeout(f, 16); }
  function rattraper() {
    if (prevu || !manques.length) return; prevu = true;
    (function suite() {
      if (retenu()) { prevu = false; return; }
      var r = manques.shift(); if (!r) { prevu = false; return; }
      if (r.manque && !r.fini) { r.manque = false; try { r.fn.apply(w, r.args); } catch (e) {} }
      prochaineImage(suite);
    })();
  }
  w.setInterval = function (fn, ms) {
    if (typeof fn !== 'function' || !(+ms >= SEUIL_RETENU)) return sI.apply(this, arguments);
    var src = ''; try { src = Function.prototype.toString.call(fn); } catch (e) {}
    if (OUVERTURE.test(src)) return sI.apply(this, arguments);
    var a = Array.prototype.slice.call(arguments), lent = +ms >= SEUIL, r = { fn: fn, args: a.slice(2), manque: false, fini: false };
    a[0] = function () {
      if (lent && enOuverture()) return;
      if (retenu()) { if (!r.manque) { r.manque = true; manques.push(r); } return; }
      var rat = manques.length; r.manque = false;
      try { return fn.apply(this, arguments); } finally { if (rat) bientot(); }
    };
    var id = sI.apply(this, a); try { parId[id] = r; } catch (e) {}
    return id;
  };
  if (typeof cI === 'function') w.clearInterval = function (id) { var r = parId[id]; if (r) { r.fini = true; delete parId[id]; } return cI.apply(this, arguments); };
  w.VerdictGarde = { ouverture: enOuverture, verrou: verrou, cache: cache, retenu: retenu };
  /* retour : déverrouillage (porte, ou verrou réaffiché puis rouvert), appli au premier plan, module de nouveau affiché */
  function bientot() { try { setTimeout(rattraper, 0); } catch (e) {} }
  try { w.addEventListener('verdict:porte-ouverte', bientot); } catch (e) {}
  try { if (H) H.addEventListener('verdict:verrou-ouvert', bientot); } catch (e) {}
  try { document.addEventListener('visibilitychange', function () { if (!document.hidden) bientot(); }); } catch (e) {}
  try { var p = panneau(); if (p && w.MutationObserver) new w.MutationObserver(function () { if (p.classList.contains('active')) bientot(); }).observe(p, { attributes: true, attributeFilter: ['class'] }); } catch (e) {}
})();
