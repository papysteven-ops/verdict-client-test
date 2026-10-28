/* C428 (audit A52, session Langues) — amorceur des traductions. Les pages le chargent à la place de langues-complements.js (3 Mo, 7 langues).
   - En français : rien n'est lu.
   - Avec une langue gardée (verdict_locale) : seul son paquet (internal/langues-<l>.js, environ 1 Mo) est lu, de façon synchrone pendant
     la lecture de la page, donc avant le verrou dans la coque (décision 27 : jamais de verrou en français pour un patron d'une autre langue).
     Dans une page chargée en différé (Inventaire, Compte), le paquet est ajouté aussitôt.
   - Changement de langue en cours de route (globe, Paramètres, Vera) : le paquet de la nouvelle langue est chargé ; dans Pilotage, avant le
     rendu de setLocale (enveloppe de verdictLoadLanguagePack, comme vd-i18n-demande-c216b). Un paquet déjà là n'est jamais relu.
   Décision 47 : un paquet introuvable (hors ligne, langue jamais utilisée, donc pas encore gardée par le service worker) n'est pas marqué
   chargé ; Pilotage reçoit l'échec et affiche sa note « Langue indisponible hors connexion · Réessayez » au lieu d'un écran à moitié traduit.
   Les paquets sont construits depuis la source par 13-RAPPORTS-ET-MANIFESTES/REPRISE/LANGUES/construire-paquets.cjs. */
(function (w, d) {
  'use strict';
  if (w.__vdLanguesAmorce) return;
  w.__vdLanguesAmorce = true;
  var LANGUES = ['en', 'es', 'it', 'de', 'nl', 'pt'], charges = {}, base = '', script = d.currentScript;
  try { if (script && script.src) base = script.src.replace(/langues-amorce\.js(?:[?#].*)?$/, ''); } catch (e) {}
  if (!base) base = /\/modules\//.test(String(w.location && w.location.pathname || '')) ? '../../internal/' : './internal/';
  function propre(l) { l = String(l || '').slice(0, 2).toLowerCase(); return LANGUES.indexOf(l) >= 0 ? l : ''; }
  /* la langue gardée par le patron (Pilotage : lsGet, qui suit les règles de la démo et du Perso ; ailleurs : localStorage) */
  function gardee() { var l = ''; try { if (typeof w.lsGet === 'function') l = w.lsGet('verdict_locale') || ''; } catch (e) {} if (!l) { try { l = w.localStorage.getItem('verdict_locale') || ''; } catch (e) {} } return propre(l); }
  function affichee() { var l = ''; try { l = w.LOCALE || d.documentElement.getAttribute('lang') || ''; } catch (e) {} return propre(l); }
  function charger(l, fini) {
    l = propre(l); var c = charges[l];
    if (!l || c === true) { if (fini) fini(true); return; }
    if (c) { if (fini) c.push(fini); return; }
    charges[l] = fini ? [fini] : [];
    var s = d.createElement('script'); s.src = base + 'langues-' + l + '.js'; s.setAttribute('data-verdict-langues', l);
    function finir(ok) { var file = charges[l]; charges[l] = ok ? true : undefined; /* un échec se retente au prochain changement */ if (!ok && s.parentNode) s.parentNode.removeChild(s); (file || []).forEach(function (f) { try { f(ok); } catch (e) {} }); }
    s.onload = function () { finir(true); }; s.onerror = function () { finir(false); };
    (d.head || d.documentElement).appendChild(s);
  }
  /* démarrage : la langue gardée, lue tout de suite (synchrone si la page est encore en lecture et que ce script n'est pas différé) */
  var depart = gardee() || affichee();
  if (depart) {
    var differe = !!(script && (script.defer || script.async));
    if (d.readyState === 'loading' && !differe) { d.write('<script src="' + base + 'langues-' + depart + '.js" data-verdict-langues="' + depart + '"><\/script>'); charges[depart] = true; }
    else charger(depart);
  }
  /* changement de langue : <html lang>, l'événement de l'appli, ou un autre onglet */
  function suivre() { var l = affichee(); if (l && charges[l] !== true) charger(l); }
  try { new MutationObserver(suivre).observe(d.documentElement, { attributes: true, attributeFilter: ['lang'] }); } catch (e) {}
  w.addEventListener('verdict:locale-changed', suivre);
  w.addEventListener('storage', function (e) { if (e && e.key === 'verdict_locale') { var l = propre(e.newValue); if (l && charges[l] !== true) charger(l); } });
  /* Pilotage : le paquet de la nouvelle langue arrive avant que setLocale ne dessine (même file que le dictionnaire du moteur) */
  function envelopper() {
    var o = w.verdictLoadLanguagePack; if (typeof o !== 'function' || o.__c428) return;
    var e = function (l, fini) { var soi = this, args = arguments; charger(l, function (ok) { if (ok === false) { if (typeof fini === 'function') fini(false); return; } return o.apply(soi, args); }); };
    e.__c428 = true; w.verdictLoadLanguagePack = e;
  }
  envelopper();
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', envelopper);
  w.VerdictLanguesAmorce = { charger: charger, charges: charges, langue: gardee };
})(window, document);
