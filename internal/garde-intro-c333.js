/* Verdict® — C333 (L6, Steven : « au lancement toute l'animation bug, plus du tout fluide », Mac M5). Mesuré dans WebKit : l'écran
   d'ouverture restait 13 à 20 s (l'anneau dure 3 s) : pendant l'anneau, les contrôles périodiques des modules (Accueil, courbes,
   chapitres, équipe…, toutes les 0,9 à 4 s, jusqu'à 1,25 s par passe) occupaient le fil principal et les étapes de l'anneau glissaient.
   Chargé en tout premier dans Pilotage : tant que l'écran d'ouverture est affiché, une minuterie périodique de 900 ms ou plus passe son
   tour (elle reprend au tour suivant, après l'ouverture). Ce qui conduit l'ouverture elle-même (intro, écran d'ouverture, verrou,
   démarrage) n'est jamais retenu. Aucun effet quand l'intro ne se joue pas (déjà vue sur l'appareil). */
(function () {
  'use strict';
  var w = window; if (w.__vdGardeIntro) return; w.__vdGardeIntro = true;
  var sI = w.setInterval, SEUIL = 900, OUVERTURE = /splash|intro|verrou|boot|demarr|démarr/i;
  function enOuverture() { try { return !!(w.__vdAnimIntro || document.getElementById('splash')); } catch (e) { return false; } }
  w.setInterval = function (fn, ms) {
    if (typeof fn !== 'function' || !(+ms >= SEUIL)) return sI.apply(this, arguments);
    var src = ''; try { src = Function.prototype.toString.call(fn); } catch (e) {}
    if (OUVERTURE.test(src)) return sI.apply(this, arguments);
    var a = Array.prototype.slice.call(arguments);
    a[0] = function () { if (enOuverture()) return; return fn.apply(this, arguments); };
    return sI.apply(this, a);
  };
})();
