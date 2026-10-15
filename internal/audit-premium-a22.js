/* C82 — Audit premium (demande de Steven, 16/10) : « trop d'écriture dès le début ; ce que j'aime c'est le module à
   couleur ; le clic pour voir l'audit n'est pas voyant, on défile sans voir la magie ».
   - On arrive directement sur le module en couleur « Votre audit en 60 secondes » : la vue d'ensemble textuelle du
     haut (déjà présente dans Simuler, Carte et Inventaire) est retirée de l'Audit.
   - « Analyse complète » devient un vrai appel : carte verte lumineuse, halo qui pulse 3 fois, léger zoom quand elle
     entre à l'écran (une fois), main qui invite à toucher ; immobile si l'appareil demande moins d'animations.
   - Mode sombre : le fond de page passe au sombre ; les chapitres gardent leur papier blanc, posés comme des cartes. */
(function () {
  'use strict';
  var doc = document; if (doc.getElementById('audit-premium-a22')) return;
  var s = doc.createElement('style'); s.id = 'audit-premium-a22';
  s.textContent =
    '#auditBody>section.vg-overview{display:none!important}' +
    '#auditBody .av31{margin-top:4px!important}' +
    '#auditBody .av31-full{border:0!important;background:linear-gradient(135deg,#16a34a,#22c55e 55%,#4ade80)!important;box-shadow:0 18px 44px rgba(22,163,74,.35)!important;transform-origin:50% 50%}' +
    '#auditBody .av31-full>summary{position:relative;min-height:86px!important;padding:18px 20px!important;color:#ffffff!important}' +
    '#auditBody .av31-full>summary span b{font-size:20px!important;color:#ffffff!important;letter-spacing:-.01em}' +
    '#auditBody .av31-full>summary span small{color:rgba(255,255,255,.88)!important;font-size:13px!important}' +
    '#auditBody .av31-full>summary i{background:#ffffff!important;color:#15803d!important;font-weight:800!important;padding:10px 16px!important;font-style:normal}' +
    '#auditBody .av31-full>summary i::after{content:" \\1F446";}' +
    '#auditBody .av31-full[open]{background:#ffffff!important;box-shadow:0 18px 48px rgba(18,27,22,.10)!important}' +
    '#auditBody .av31-full[open]>summary{color:#101214!important;background:linear-gradient(135deg,#16a34a,#22c55e)!important}' +
    '#auditBody .av31-full.vd-appel{animation:vdAuditZoom .6s cubic-bezier(.23,1,.32,1) 1,vdAuditHalo 1.9s ease-out .6s 3}' +
    '@keyframes vdAuditZoom{0%{transform:scale(.96)}60%{transform:scale(1.025)}100%{transform:scale(1)}}' +
    '@keyframes vdAuditHalo{0%{box-shadow:0 0 0 0 rgba(34,197,94,.55),0 18px 44px rgba(22,163,74,.35)}70%{box-shadow:0 0 0 16px rgba(34,197,94,0),0 18px 44px rgba(22,163,74,.35)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0),0 18px 44px rgba(22,163,74,.35)}}' +
    '@media (prefers-reduced-motion:reduce){#auditBody .av31-full.vd-appel{animation:none}}' +
    'html.vd-workspace-dark #v-audit,html.vd-workspace-dark #auditBody{background:#0b0f14!important}' +
    'html.vd-workspace-dark #auditBody .av31-full-body{background:#fbfbf8;color:#101214}' +
    'html.vd-workspace-dark #auditBody #auditPreuves,html.vd-workspace-dark #auditBody #sourcesEtat,html.vd-workspace-dark #auditBody #sourcesVerite{border-radius:18px}';
  (doc.head || doc.documentElement).appendChild(s);
  /* Zoom + halo quand la carte « Analyse complète » entre vraiment à l'écran (une fois par affichage de l'Audit). */
  var vu = null;
  function guetter() {
    var c = doc.querySelector('#auditBody .av31-full'); if (!c || c === vu) return; vu = c;
    if (!('IntersectionObserver' in window)) { c.classList.add('vd-appel'); return; }
    var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { c.classList.add('vd-appel'); io.disconnect(); } }, { threshold: 0.6, rootMargin: '0px 0px -12% 0px' });
    io.observe(c);
  }
  try { var a = doc.getElementById('v-audit'); if (a) new MutationObserver(guetter).observe(a, { childList: true, subtree: true }); guetter(); } catch (e) {}
})();
