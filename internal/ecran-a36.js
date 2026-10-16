/* C109 — Points laissés par le grand test robuste (Steven, 16/10 : « traite G2, G6, G7 et B2 »).
   G2 · iPhone : le haut d'écran de la démonstration empilait bandeau (89 px, deux rangées) + en-tête + barre
        d'établissement ≈ 45 % de l'écran. Le bandeau tient sur une rangée (38 px), sans le bouton ⓘ (la fiche reste
        accessible par le libellé), et le sous-titre de l'en-tête reste sur une ligne.
   G6 · Cohérence premium : plus d'emoji en tête des titres et boutons de Simuler, Priorités, Food Cost et de l'Audit
        (« 🎯 », « 🔥 », « ✨ », « 🧾 », « 🍽️ »), alors que Pilotage, Carte et Audit n'en portent pas ; le bandeau de
        démonstration prend la forme arrondie de celui de l'Inventaire.
   B2 · Le module ouvert seul (hors coquille) en thème clair gardait des blocs sombres et des textes blancs sur fond
        clair : jetons clairs posés ici pour la barre d'établissement, le segment de la Carte, Priorités et ses puces,
        les titres de pages et le bouton Comparer ; le segment « Ma carte · Ventes · Décisions » reste volontairement
        foncé (règle « module foncé si fond clair », C100). Dans la coquille, le re-stylage R316 garde la main (styles en ligne).
   G7 est traité dans stock-transfer-ui-a11 (libellé court « Transferts »). */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdEcran36) return; w.__vdEcran36 = true;
  var css = doc.createElement('style'); css.id = 'ecran-a36';
  css.textContent =
    /* G2 + G6 : bandeau de démonstration compact et arrondi. */
    'body.modebar #modeBar{margin:6px 8px 0;left:auto;right:auto;border-radius:14px;box-shadow:0 6px 18px rgba(2,8,23,.12)}' +
    '@media(max-width:520px){body.modebar #modeBar{display:grid!important;grid-template-columns:minmax(0,1fr) auto auto!important;grid-auto-rows:auto;align-items:center!important;padding:4px 6px 4px 10px!important;gap:5px!important;min-height:0}' +
    'body.modebar #modeBar>*{grid-row:1!important}body.modebar #modeBar .mb-info{display:none!important}body.modebar #modeBar .mb-label{font-size:11.5px!important;display:flex;align-items:center;gap:6px;padding-right:6px}body.modebar #modeBar .p40-mb-x{flex:0 0 auto;margin-left:auto}' +
    'body.modebar #modeBar button{min-height:30px!important;padding:5px 9px!important;font-size:11px!important;border-radius:9px!important}' +
    '#topSub{display:flex;align-items:baseline;gap:8px;min-width:0}#topSub .zl,#topSub .kp{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}#topSub .zl{flex:1 1 auto}#topSub .kp{flex:0 1 auto}}' +
    /* B2 : thème clair du module seul. */
    'html.vd-workspace-light #etabBar{background:#f4f6f8;border-color:#d5dde5}html.vd-workspace-light #etabBar button{color:#14202b!important;background:#fff!important;border-color:#d5dde5!important}html.vd-workspace-light #etabBar button small{color:#5f6670}' +
    'html.vd-workspace-light #v-priorities>h1,html.vd-workspace-light #v-x>h1,html.vd-workspace-light #v-dec>h1,html.vd-workspace-light .view>h1{color:#14202b}html.vd-workspace-light .view>p.sub{color:#5f6670}' +
    'html.vd-workspace-light .actbar,html.vd-workspace-light .actbar .chips{background:#fff;border-color:#d5dde5}html.vd-workspace-light .chips button{color:#4b5563}html.vd-workspace-light .chips button.on{color:#14202b}' +
    'html.vd-workspace-light #etabBar .etab-compare,html.vd-workspace-light #etabBar button[data-etab-compare]{background:#fff;color:#14202b;border-color:#d5dde5}';
  (doc.head || doc.documentElement).appendChild(css);

  /* G6 : retirer les emoji de tête (et leurs variantes) des titres et boutons de Simuler, Priorités, Food Cost, Audit. */
  var RE = /^(?:\s|️|‍|[☀-➿]|[\uD83C-\uDBFF][\uDC00-\uDFFF])+/;
  var ZONES = '#v-dec,#v-priorities,#v-x,#v-audit,#v-alertes,#v-org';
  var CIBLES = 'h1,h2,h3,h4,b,strong,button,.k,.au-k,.dec-t,.plus-eyebrow,summary';
  function nettoyer(racine) {
    if (!racine || racine.nodeType !== 1) return;
    var liste = racine.matches && racine.matches(CIBLES) ? [racine] : [];
    [].push.apply(liste, racine.querySelectorAll(CIBLES));
    liste.forEach(function (el) {
      if (el.closest('#modeBar,#etabBar,.v-avatar,[data-i18n-preserve]')) return;
      if (el.hasAttribute('data-i18n-pre')) el.setAttribute('data-i18n-pre', '');
      var n = el.firstChild; while (n && n.nodeType === 3 && !n.nodeValue.trim()) n = n.nextSibling;
      if (!n || n.nodeType !== 3) return;
      var v = n.nodeValue, s = v.replace(RE, '');
      if (s !== v && s.trim()) n.nodeValue = s;
    });
  }
  var attente = null, enCours = false;
  function planifier() { if (attente) return; attente = setTimeout(function () { attente = null; passer(); }, 40); }
  function passer() {
    if (enCours) return; enCours = true;
    try { [].forEach.call(doc.querySelectorAll(ZONES), nettoyer); } catch (e) {} finally { enCours = false; }
  }
  function observer() {
    var zones = doc.querySelectorAll(ZONES); if (!zones.length || !('MutationObserver' in w)) return false;
    var mo = new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { if (ms[i].type === 'characterData' || ms[i].addedNodes.length) { planifier(); return; } } });
    [].forEach.call(zones, function (z) { mo.observe(z, { childList: true, subtree: true, characterData: true }); });
    passer(); return true;
  }
  if (!observer()) doc.addEventListener('DOMContentLoaded', observer);
  w.addEventListener('load', function () { setTimeout(passer, 200); });
  w.VerdictEcran36 = { nettoyer: nettoyer, passer: passer };
})();
