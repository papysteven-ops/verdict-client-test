/* V10 (vérification du 21/10/2026) — Inventaire ouvert seul : un chemin vers l'Accueil de Verdict.
   Depuis Accueil › Jour › « Ouvrir l'inventaire », hors de la coque (page de l'appli ouverte directement, démonstration),
   l'Inventaire remplaçait toute la page, sans aucun bouton pour revenir à Verdict.
   - dans la coque (index.html), rien : ses onglets Pilotage · Carte · Inventaire restent le chemin ;
   - seul, un bouton « ← Verdict » en tête de page : retour à la page Verdict d'où l'on vient (mêmes réglages,
     même démonstration), sinon à l'appli Verdict avec la même démonstration et le même établissement ;
   - rien n'est envoyé nulle part ; aucune donnée n'est lue ni écrite. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.top !== w || w.VerdictRetourVerdict) return;
  var MOTS = { fr: 'Revenir à Verdict', en: 'Back to Verdict', es: 'Volver a Verdict', it: 'Torna a Verdict', de: 'Zurück zu Verdict', nl: 'Terug naar Verdict', pt: 'Voltar ao Verdict' };
  function langue() { var l = String(doc.documentElement.lang || 'fr').slice(0, 2).toLowerCase(); return MOTS[l] ? l : 'fr'; }
  function depuisVerdict() {
    try { var r = new URL(doc.referrer); return r.origin === w.location.origin && /\/modules\/verdict\/verdict-app\.html$/.test(r.pathname) ? r : null; } catch (e) { return null; }
  }
  function adresse() {
    var r = depuisVerdict(); if (r) return r.href;
    var ici = new URLSearchParams(w.location.search), q = new URLSearchParams();
    ['presentation', 'demo', 'inventory'].forEach(function (k) { var v = ici.get(k); if (v && /^[a-zA-Z0-9_-]{1,60}$/.test(v)) q.set(k, v); });
    var s = q.toString(); return '../verdict/verdict-app.html' + (s ? '?' + s : '');
  }
  function poser() {
    var top = doc.querySelector('.top'); if (!top || top.querySelector('.vd-retour-verdict')) return;
    var b = doc.createElement('a'); b.className = 'vd-retour-verdict'; b.href = adresse(); b.textContent = '← Verdict';
    b.setAttribute('aria-label', MOTS[langue()]);
    b.style.cssText = 'display:inline-flex;align-items:center;min-height:44px;margin-right:10px;padding:0 12px;border:1px solid var(--line,rgba(148,163,184,.3));border-radius:999px;font-size:13px;font-weight:650;color:inherit;text-decoration:none;white-space:nowrap;flex:0 0 auto';
    b.addEventListener('click', function (ev) {
      /* retour à la page précédente quand c'est Verdict : elle revient telle qu'elle était */
      if (depuisVerdict() && w.history.length > 1) { ev.preventDefault(); w.history.back(); }
    });
    top.insertBefore(b, top.firstChild);
  }
  w.VerdictRetourVerdict = { poser: poser };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', poser); else poser();
})();
