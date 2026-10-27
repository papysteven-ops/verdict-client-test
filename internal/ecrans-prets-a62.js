/* C354 (L2) — Écrans prêts au toucher : Structure, Audit, Carte.
   go() (029) réutilise un écran déjà dessiné à la révision courante des données (data-verdict-render-revision = VERDICT_VIEW_REVISION).
   Version 2 (décision 19, test de repos c333) : la préparation au repos de la version 1 dessinait les trois écrans 5 à 7 s après
   l’ouverture, en tâches de 300 à 850 ms (le dessin d’un écran ne se coupe pas : drawData, drawAudit, drawCarte). Désormais rien ne
   tourne au chargement ni au repos : l’écran est dessiné dès que le doigt (ou la souris) se pose sur un bouton qui y mène, pendant
   l’appui ; le clic le trouve prêt. L’écran affiché n’est jamais redessiné ici ; aucune minuterie. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vx62) return; w.__vx62 = true; /* l’application tourne dans le cadre de la coquille : pas de garde w.top */
  var VUES = { data: 1, audit: 1, carte: 1 };
  function rev() { return String(w.VERDICT_VIEW_REVISION); }
  function vueDe(el) {
    var b = el && el.closest && el.closest('[onclick],[data-go],[data-view]'); if (!b) return null;
    var m = /go\('(data|audit|carte)'\)/.exec(b.getAttribute('onclick') || ''), v = m ? m[1] : (b.getAttribute('data-go') || b.getAttribute('data-view'));
    return VUES[v] ? v : null;
  }
  function preparer(v) {
    if (!v || !VUES[v] || v === w.VIEW || typeof w._renderViewContent !== 'function') return false;
    var t = doc.getElementById('v-' + v); if (!t || t.classList.contains('on') || t.getAttribute('data-verdict-render-revision') === rev()) return false;
    var R = null; try { R = w.moteur(); } catch (e) {} if (!R || !R.ready) return false;
    var r = rev();
    try { w.VERDICT_PARTIAL_VIEW_RENDER = false; w._renderViewContent(v); if (!w.VERDICT_PARTIAL_VIEW_RENDER && rev() === r && !t.classList.contains('on')) t.setAttribute('data-verdict-render-revision', r); } catch (e) {}
    return true;
  }
  function intention(e) { var v = vueDe(e.target); if (v) preparer(v); }
  doc.addEventListener('pointerdown', intention, true);
  doc.addEventListener('touchstart', intention, { capture: true, passive: true });
  w.VerdictEcransPrets = { preparer: preparer, vueDe: vueDe };
})();
