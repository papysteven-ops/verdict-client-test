/* C209 (V11, vérification du 21/10/2026) — Inventaire : le thème suit l'appareil sans recharger la page.
   Le choix clair / sombre était lu une seule fois, à l'ouverture (script vd-appearance-boot-r307). Si l'appareil passait
   en sombre le soir (ou en clair le matin), l'Inventaire restait dans l'ancien thème jusqu'au prochain chargement.
   - ouvert dans la coque (index.html) : il suit la classe de thème de la page parente, dès qu'elle change ;
   - ouvert seul : si aucun thème n'est choisi sur cet appareil (réglage « clair » ou « sombre » absent), il suit
     l'apparence de l'appareil (prefers-color-scheme) ; un choix enregistré dans une autre page est aussi repris ;
   - mêmes règles et mêmes clés que le script d'ouverture ; rien n'est écrit, rien n'est envoyé. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.VerdictThemeAuto) return;
  var mq = w.matchMedia ? w.matchMedia('(prefers-color-scheme: dark)') : null;
  function parent() { try { if (w.parent !== w) { var r = w.parent.document.documentElement; if (r.classList.contains('vd-workspace-dark') || r.classList.contains('vd-workspace-light')) return r; } } catch (e) {} return null; }
  function choix() {
    try { var mobile = w.matchMedia('(max-width:767px)').matches; return w.localStorage.getItem(mobile ? 'verdict-mobile-appearance-v2' : 'verdict-workspace-theme'); } catch (e) { return null; }
  }
  function sombreVoulu() {
    var p = parent(); if (p) return p.classList.contains('vd-workspace-dark');
    var c = choix(); if (c === 'dark') return true; if (c === 'light') return false;
    return !!(mq && mq.matches);
  }
  function appliquer() {
    var r = doc.documentElement, dark = sombreVoulu();
    if (r.classList.contains(dark ? 'vd-workspace-dark' : 'vd-workspace-light') && !r.classList.contains(dark ? 'vd-workspace-light' : 'vd-workspace-dark')) return;
    r.classList.toggle('vd-workspace-dark', dark); r.classList.toggle('vd-workspace-light', !dark);
    r.style.backgroundColor = dark ? '#08090b' : '#ffffff'; r.style.colorScheme = dark ? 'dark' : 'light';
    /* le garde-contraste efface ses corrections de l'ancien thème et repasse */
    try { if (w.VerdictContraste) w.VerdictContraste.passe(); } catch (e) {}
  }
  if (mq) { if (mq.addEventListener) mq.addEventListener('change', appliquer); else if (mq.addListener) mq.addListener(appliquer); }
  w.addEventListener('storage', function (e) { if (!e.key || e.key === 'verdict-workspace-theme' || e.key === 'verdict-mobile-appearance-v2') appliquer(); });
  var p = parent();
  if (p) { try { new w.parent.MutationObserver(appliquer).observe(p, { attributes: true, attributeFilter: ['class'] }); } catch (e) {} }
  w.VerdictThemeAuto = { appliquer: appliquer };
})();
