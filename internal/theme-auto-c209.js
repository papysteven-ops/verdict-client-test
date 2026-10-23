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
    /* C323 : les écrans qui colorent en JavaScript (cadres premium, graphiques) sont prévenus du nouveau thème. */
    try { w.dispatchEvent(new CustomEvent('verdict:theme', { detail: { dark: dark } })); } catch (e) {}
  }
  if (mq) { if (mq.addEventListener) mq.addEventListener('change', appliquer); else if (mq.addListener) mq.addListener(appliquer); }
  w.addEventListener('storage', function (e) { if (!e.key || e.key === 'verdict-workspace-theme' || e.key === 'verdict-mobile-appearance-v2') appliquer(); });
  var p = parent();
  if (p) { try { new w.parent.MutationObserver(appliquer).observe(p, { attributes: true, attributeFilter: ['class'] }); } catch (e) {} }
  /* C312 (V16-058) : comme la coque (C242), l'apparence est aussi relue au retour et toutes les 2 s : l'événement de l'appareil
     n'arrive pas toujours (appli installée, Centre de contrôle, coucher du soleil). Simple lecture : rien n'est écrit tant qu'elle ne change pas. */
  /* C323 (V16-058, T2 n° 20) : la relecture ne s'arrêtait pas seulement quand la page était vraiment cachée : un aperçu ou un panneau
     « caché » qui reste affiché (et l'émulation d'apparence, qui n'envoie pas d'événement) gardaient les classes de l'ancien thème
     alors que le CSS du système avait déjà basculé. Elle tourne donc toujours (simple lecture), et aussi au redimensionnement,
     au retour sur la page et au premier toucher : même traitement que le rechargement (classes, fond, color-scheme, garde-contraste). */
  if (w.addEventListener) { w.addEventListener('focus', appliquer); w.addEventListener('resize', appliquer); w.addEventListener('pageshow', appliquer); }
  if (doc.addEventListener) { doc.addEventListener('visibilitychange', appliquer); doc.addEventListener('pointerdown', appliquer, { capture: true, passive: true }); }
  var tAuto = typeof setInterval === 'function' ? setInterval(appliquer, 1500) : 0; if (tAuto && tAuto.unref) tAuto.unref();
  w.VerdictThemeAuto = { appliquer: appliquer };
})();
