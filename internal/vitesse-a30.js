/* C103 — Lancement rapide et anneau fluide (Steven : « ça rame dès le lancement, l'animation du score est coupée, la
   couleur change d'un coup ; je cherche le maximum de vitesse, aucune latence »).
   Mesuré dans WebKit (moteur de Safari) : dès qu'un dossier a un score, le fil principal est bloqué 4,6 s sur les
   8 premières secondes. Ce n'est pas le téléchargement (8 Mo analysés en 17 ms) mais le travail lancé pendant l'anneau :
   l'Accueil redessiné 8 fois, le moteur recalculé environ 1 300 fois (même chiffres, même résultat), la couche premium
   recalculée 6 à 8 fois, l'Audit préparé alors qu'il est caché. Ce fichier :
   1. offre une file « après l'ouverture » (verdictApresIntro) : le travail lourd attend la fin de l'anneau ;
   2. met le moteur en mémoire le temps d'un rendu (clé = chiffres saisis + établissement + paramètres) : un même calcul
      n'est plus refait 31 fois pour le calendrier ni 9 fois par levier ; la mémoire est vidée à la fin de chaque rendu ;
   3. ne redessine l'Accueil qu'une fois par état des données pendant l'ouverture.
   Les retouches qui ne pouvaient pas se faire d'ici sont dans verdict-029/040/041/042/053, verdict-app.html,
   verrou-a16, gain-realiste-a24 et audit-recit-a27 (voir le registre, C103). */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdVitesse) return; w.__vdVitesse = true;

  /* ── 1. File « après l'ouverture » ───────────────────────────────────────── */
  function enIntro() { return !!(w.__vdAnimIntro || doc.getElementById('splash')); }
  var file = [];
  /* C333 : la file se vide une tâche par image (l'Accueil s'affiche d'abord, puis chaque travail a son tour), et un travail marqué
     « d'après l'ouverture » peut être sauté s'il ne changerait rien (voir drawPil plus bas). */
  function prochaineImage(f) { if (typeof w.requestAnimationFrame === 'function' && !doc.hidden) w.requestAnimationFrame(function () { setTimeout(f, 0); }); else setTimeout(f, 16); }
  function vider() {
    var q = file.splice(0);
    (function suite() { var f = q.shift(); if (!f) return; w.__vdFileApresIntro = true; try { f(); } catch (e) {} finally { w.__vdFileApresIntro = false; } prochaineImage(suite); })();
  }
  w.verdictApresIntro = function (f) { if (typeof f !== 'function') return; if (!enIntro()) { f(); return; } file.push(f); };
  w.addEventListener('verdict:intro-complete', function () { w.__vdAnimIntro = false; prochaineImage(vider); });
  /* Filet : si l'écran d'ouverture disparaît sans son événement, la file est vidée quand même. */
  var filet = setInterval(function () { if (!enIntro()) { clearInterval(filet); vider(); } }, 500);
  setTimeout(function () { clearInterval(filet); vider(); }, 15000);

  /* ── 2. Mémoire du moteur pendant un rendu ───────────────────────────────── */
  var calcul = w.moteur, memoire = null;
  function cleDonnees() {
    try { return (typeof w.empreinteDonnees === 'function' ? w.empreinteDonnees() : '') + '|' + ((w.STORE && w.STORE.actif) || '') + '|' + (w.LOCALE || ''); }
    catch (e) { return null; }
  }
  function avecMemoire(fn) {
    return function () {
      var proprio = !memoire; if (proprio) memoire = Object.create(null);
      try { return fn.apply(this, arguments); } finally { if (proprio) memoire = null; }
    };
  }
  if (typeof calcul === 'function') {
    w.moteur = function (over) {
      if (!memoire) return calcul.apply(this, arguments);
      var cle; try { var d = cleDonnees(); if (d === null) return calcul.apply(this, arguments); cle = d + '#' + JSON.stringify(over === undefined ? null : over); }
      catch (e) { return calcul.apply(this, arguments); }
      if (Object.prototype.hasOwnProperty.call(memoire, cle)) return memoire[cle];
      return (memoire[cle] = calcul.apply(this, arguments));
    };
    w.moteur.__vdVitesse = true;
    w.VerdictMemoireMoteur = avecMemoire;
    ['drawPil', 'refreshAll', 'renderViewContent', 'headerState', 'drawAudit', 'drawDec', 'drawData', 'drawCarte', 'drawPriorities', 'drawPlus',
      'calObjectifJour', 'blocCalendrierJours', 'point11Decision', 'potentiel', 'auditPremiumCalc', 'decNbActifs', 'decImpactTotal', 'progJours', 'scoreSheet'
    ].forEach(function (n) { if (typeof w[n] === 'function' && !w[n].__vdMem) { var f = avecMemoire(w[n]); f.__vdMem = true; w[n] = f; } });
    function envelopper(o, cles) { if (!o) return; cles.forEach(function (k) { if (typeof o[k] === 'function' && !o[k].__vdMem) { var f = avecMemoire(o[k]); f.__vdMem = true; o[k] = f; } }); }
    envelopper(w.VerdictGainRealiste, ['plan', 'cartePlan', 'overAll', 'horsBornes', 'carteFiable']);
    envelopper(w.VerdictPremiumEcrans, ['poser']);
    envelopper(w.VerdictRecit, ['monter']);
  }

  /* ── 3. Un seul Accueil par état des données pendant l'ouverture ─────────── */
  function revision() { var d = cleDonnees(); return (d === null ? String(Date.now()) : d) + '|' + (w.VIEW || '') + '|' + ((w.DB && w.DB.histJour && w.DB.histJour.length) || 0); }
  if (typeof w.drawPil === 'function') {
    var dp = w.drawPil, derniere = null, enAttente = false;
    /* C333 : après l'ouverture, un Accueil déjà dessiné pour le même état des données n'est pas redessiné par la file (1,5 à 2,6 s
       mesurées dans WebKit pour un redessin identique demandé par verdict-041). */
    var dessine = null;
    w.drawPil = function () {
      if (enIntro()) { var r = revision(); if (r === derniere) { enAttente = true; return; } derniere = r; }
      else { derniere = null; if (w.__vdFileApresIntro && dessine !== null && revision() === dessine && doc.getElementById('pilHead')) return; }
      try { return dp.apply(this, arguments); } finally { try { dessine = revision(); } catch (e) { dessine = null; } }
    };
    w.drawPil.__vdMem = true;
    w.addEventListener('verdict:intro-complete', function () { derniere = null; if (enAttente) { enAttente = false; prochaineImage(function () { w.__vdFileApresIntro = true; try { if (w.VIEW === 'pil') w.drawPil(); } catch (e) {} finally { w.__vdFileApresIntro = false; } }); } });
  }
})();
