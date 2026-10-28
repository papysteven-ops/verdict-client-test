/* C378 (L6, décision 40, audit vitesse A02) — la porte d'ouverture. Tant que le verrou est affiché, rien du Pilotage ni de l'Inventaire
   ne démarre : les deux cadres de la coque ne sont pas chargés. Mesure de l'audit : avec le Pilotage chargé derrière le verrou, chaque chiffre
   tapé attendait jusqu'à 0,6 s (Client), 1,8 s (démo), 3,6 s (Perso) ; sans le Pilotage, 116 à 130 ms.
   Les cadres partent :
   - au 6e chiffre du code (« verdict:verrou-preparer », envoyé par verrou-a16 avant le calcul du code), ou au Face ID accepté ;
   - à l'ouverture (« verdict:verrou-ouvert ») : appareil sans code en démonstration, délai non écoulé, mise à jour, déverrouillage ;
   - en secours, si le verrou est absent de la page ou s'il est ouvert sans l'avoir annoncé.
   Chargé en tout premier dans la coque : il retient l'adresse que la coque donne aux cadres (frame.src), puis la pose à l'ouverture.
   Signal pour les autres lots (C408, suite d'A02) : window.__vdPorte = { fermee(), apres(f) }, dans la coque et dans les deux cadres.
   - fermee() : vrai tant que l'appareil n'est pas déverrouillé (les cadres, eux, partent dès le 6e chiffre) ;
   - apres(f) : f tout de suite si la porte est ouverte, sinon au déverrouillage (dans un cadre : tâche du cadre, juste après) ;
   - événement « verdict:porte-ouverte » sur window au même moment ;
   - sans coque (cadre ouvert seul, ancienne coque) : fermee() est faux et apres(f) exécute f tout de suite.
   Dans un cadre, ce fichier ne retient rien et ne sonde rien : il relaie la porte de la coque. */
(function () {
  'use strict';
  var w = window, doc = document;
  if (w.__vdPorte378 || w.__vdPorte) return;
  var H = null; try { if (w.parent !== w && w.parent.__vdPorte && w.parent.__vdPorte378) H = w.parent.__vdPorte; } catch (e) {}
  /* un cadre, ou une page d'un module ouverte seule (sans coque) : on relaie, rien d'autre */
  if (w.parent !== w || /\/modules\//.test(String((w.location && w.location.pathname) || ''))) {
    w.__vdPorte = {
      fermee: function () { try { return !!(H && H.fermee()); } catch (e) { return false; } },
      apres: function (f) {
        var dif = false; try { dif = !!(H && H.fermee()); } catch (e) {}
        if (!dif) { f(); return; }
        H.apres(function () { try { w.setTimeout(f, 0); } catch (e) {} });
      }
    };
    if (w.__vdPorte.fermee()) w.__vdPorte.apres(function () { try { w.dispatchEvent(new CustomEvent('verdict:porte-ouverte')); } catch (e) {} });
    return;
  }
  var IDS = { 'frame-verdict': 1, 'frame-inventory': 1 }, attente = {}, ouverte = false;
  var P = w.HTMLIFrameElement && w.HTMLIFrameElement.prototype, d = P && Object.getOwnPropertyDescriptor(P, 'src');
  if (!d || !d.set || !d.get) return;
  function retenir(el) { return !ouverte && el && IDS[el.id]; }
  Object.defineProperty(P, 'src', {
    configurable: true, enumerable: d.enumerable,
    get: function () { return retenir(this) && attente[this.id] != null ? attente[this.id] : d.get.call(this); },
    set: function (v) { if (retenir(this)) { attente[this.id] = String(v); return; } d.set.call(this, v); }
  });
  var deverrouille = false, file = [];
  function deverrouiller(raison) {
    ouvrir(raison); if (deverrouille) return; deverrouille = true; clearInterval(sonde);
    var l = file; file = []; l.forEach(function (f) { try { f(); } catch (e) {} });
    try { w.dispatchEvent(new CustomEvent('verdict:porte-ouverte')); } catch (e) {}
  }
  w.__vdPorte = {
    fermee: function () { return !deverrouille; },
    apres: function (f) { if (deverrouille) f(); else file.push(f); }
  };
  function ouvrir(raison) {
    if (ouverte) return; ouverte = true;
    Object.keys(attente).forEach(function (id) { var el = doc.getElementById(id); if (el && attente[id] != null) d.set.call(el, attente[id]); });
    attente = {};
    /* le voile de démarrage de la coque déclare un échec après 20 s ; un code tapé lentement n'est pas un échec */
    try { var l = doc.querySelector('.module-loading.failed'); if (l) { l.classList.remove('failed'); var r = l.querySelector('.startup-retry'); if (r) r.hidden = true; var t = l.querySelector('span'); if (t) t.textContent = 'Ouverture de Pilotage…'; } } catch (e) {}
    w.__vdPorte378.raison = raison;
  }
  w.__vdPorte378 = { ouverte: function () { return ouverte; }, ouvrir: ouvrir, raison: '' };
  w.addEventListener('verdict:verrou-ouvert', function () { deverrouiller('ouvert'); });
  w.addEventListener('verdict:verrou-preparer', function () { ouvrir('preparer'); });
  /* secours : verrou absent de la page, ou ouvert sans signal ; vérifié deux fois par seconde jusqu'au déverrouillage */
  var debut = Date.now(), sonde = setInterval(function () {
    var V = w.VerdictVerrou, st = null; try { st = V && V.state && V.state(); } catch (e) {}
    var vr = doc.getElementById('vr16'), affiche = !!(vr && !vr.hidden);
    if (!V) { if (doc.readyState === 'complete' && Date.now() - debut > 1500) deverrouiller('sans-verrou'); return; }
    if (st && st.locked === false && !affiche) deverrouiller('ouvert-sans-signal');
  }, 500);
})();
