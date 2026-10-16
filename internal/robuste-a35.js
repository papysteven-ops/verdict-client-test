/* C108 — Suites du grand test robuste WebKit du 16/10 (12 parcours × 3 formats × 2 thèmes, 0 erreur JS, 0 débordement
   de page). Ce fichier regroupe les correctifs de présentation qui ne vivent pas dans un module précis :
   B1 titre de la couverture invisible dans le lecteur de l'Audit (noir sur noir) · G3 pastille d'établissement coupée
   sans points de suspension · G4 tableau « Résistance de la carte » plus large que l'iPhone · G5 contrastes faibles en
   thème clair (sommaire du lecteur, numéros de chapitres, indicateurs d'ingrédients, badge jaune des contrôles) · D1 deux champs « plusSearchQ »
   dans Plus (corrigé dans plus-premium-a21 : id propre, valeur recopiée) · D2 mini-anneau du score qui déborde de son bouton. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdRobuste35) return; w.__vdRobuste35 = true;
  var css = doc.createElement('style'); css.id = 'robuste-a35';
  css.textContent =
    /* B1 : la couverture du chapitre garde ses couleurs claires sur fond sombre, même déplacée dans le lecteur. */
    '#vdLecteur .lx-page .au-cover .au-h,#vdLecteur .lx-page .au-cover h1.au-h{color:#fff!important}#vdLecteur .lx-page .au-cover .au-p{color:#aeb8b1!important}' +
    /* G3 : « Ville touristique » et « ACTIF » tiennent dans la pastille. */
    '#etabBar .etab-place{overflow:hidden!important;text-overflow:ellipsis!important;max-width:100%!important}#etabBar button{max-width:min(78vw,320px);overflow:hidden}' +
    /* G4 : tout tableau de la Carte défile horizontalement au lieu de casser ses en-têtes. */
    '#v-carte .vd-tscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 -3px;max-width:calc(100% + 6px)}#v-carte .vd-tscroll>table.tt{min-width:560px}' +
    /* G5 : contrastes en thème clair (textes de couleur sur fond blanc). */
    'html.vd-workspace-light #vdLecteur .lx-som-t,html.vd-workspace-light #vdLecteur .lx-th,html.vd-workspace-light #vdBiblio .bb-n{filter:brightness(.6) saturate(1.25)}' +
    'html.vd-workspace-light #c-ing .card .ind .v,html.vd-workspace-light #c-ing .card .ind .s{color:#4b5563!important}' +
    'html.vd-workspace-light .au-tag{filter:brightness(.7)}' +
    'html.vd-workspace-dark #vc14 .vc-badge{background:rgba(212,167,44,.22);color:#fde68a}html.vd-workspace-dark #vc14 .vc-badge.new{color:#86efac}html.vd-workspace-dark #vc14 .vc-badge.act{color:#93c5fd}' +
    /* G4 : en-têtes du tableau de résistance sur une ligne, largeur suffisante pour ses 5 colonnes. */
    '#c-cstress table.tt{min-width:640px}#c-cstress table.tt th{white-space:nowrap}' +
    /* B2 : la page du module seule (hors coquille) en thème clair : titres, boutons et colonnes de Simuler lisibles. */
    'html.vd-workspace-light .cp-pagehead h2,html.vd-workspace-light .cp-menuhead h2,html.vd-workspace-light #v-carte.cp-active .sv>h2{color:#14202b}html.vd-workspace-light #c-menu .cp-actions button.cp-button{color:#14202b}' +
    'html.vd-workspace-light .dec-col .li b{color:#14202b}html.vd-workspace-light #toast{color:#f8fafc;background:#14202b}' +
    /* C114 : sous une sous-page courte de la Carte (Mac, thème clair), plus de bande noire ; bouton TEST du Perso à 44 px. */
    'html.vd-workspace-light.p40,html.vd-workspace-light.p40 body{background:#f3f5f7!important}html.vd-workspace-light.p40 body{min-height:100vh}' +
    'button.verdict-edition-test{min-height:44px;padding-left:12px;padding-right:12px}' +
    /* D2 : le mini-anneau reste dans son bouton. */
    '#scBox{overflow:visible}#scBox .scmini{max-width:100%}';
  (doc.head || doc.documentElement).appendChild(css);

  /* G4 : envelopper les tableaux de la Carte qui n'ont pas déjà de zone de défilement. */
  function envelopper() {
    var zone = doc.getElementById('v-carte'); if (!zone) return;
    [].forEach.call(zone.querySelectorAll('table.tt'), function (t) {
      if (t.parentNode && (t.parentNode.classList.contains('tscroll') || t.parentNode.classList.contains('vd-tscroll'))) return;
      var d = doc.createElement('div'); d.className = 'vd-tscroll'; t.parentNode.insertBefore(d, t); d.appendChild(t);
    });
  }
  var attente = null;
  function planifier() { if (attente) return; attente = setTimeout(function () { attente = null; envelopper(); }, 60); }
  function observer() {
    var zone = doc.getElementById('v-carte'); if (!zone || !('MutationObserver' in w)) return false;
    new MutationObserver(planifier).observe(zone, { childList: true, subtree: true }); envelopper(); return true;
  }
  if (!observer()) doc.addEventListener('DOMContentLoaded', observer);

})();
