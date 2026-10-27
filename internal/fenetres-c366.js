/* C366 (L6, décision 37 ; vidéo de Steven sur iPhone, version en ligne) — Inventaire › Commande › « Retour · Fournisseurs de démonstration » :
   la feuille n'avait aucune croix, on ne pouvait pas en sortir, le fond devenait noir (.modal.on{background:#0A0B0E}) ; dans les lignes,
   « 19 re… · 0 déjà retourné » était écrasé sous le champ (texte, champ et motif sur une seule ligne).
   Règle pour toutes les fenêtres de l'Inventaire (.modal) :
   - une croix visible en haut à droite, qui reste visible quand la feuille défile ;
   - fermeture aussi en touchant à côté, avec Échap, et en glissant vers le bas depuis la poignée ou le titre ;
   - le fond reste visible (voile translucide), jamais noir ;
   - fermer passe par le chemin de la fenêtre (closeProd, closeSpace, vdFermer, « Annuler », « Fermer »), sinon retire « on ».
   Aucune minuterie, rien au repos : les croix sont posées au chargement et quand une fenêtre est ajoutée à la page. */
(function () {
  'use strict';
  var w = window, doc = document;
  if (w.__vdFenetres366) return; w.__vdFenetres366 = true;
  var LIB = { fr: 'Fermer', en: 'Close', es: 'Cerrar', it: 'Chiudi', de: 'Schließen', nl: 'Sluiten', pt: 'Fechar' };
  var FERMER = { mProd: 'closeProd', mSpace: 'closeSpace', vdSheet: 'vdFermer' };
  var ANNULER = /^(annuler|fermer|cancel|close|cerrar|cancelar|chiudi|annulla|schlie(ß|ss)en|abbrechen|sluiten|annuleren|fechar)$/i;
  function lib() { var l = String(doc.documentElement.lang || 'fr').slice(0, 2).toLowerCase(); return LIB[l] || LIB.fr; }

  var css = doc.createElement('style'); css.id = 'fenetres-c366';
  css.textContent =
    'html body .modal.on.on{background:rgba(2,6,10,.55)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
    'html.vd-workspace-light body .modal.on.on{background:rgba(15,23,42,.38)!important}' +
    '.vd366-xbar{position:sticky;top:0;height:0;z-index:6;pointer-events:none}' +
    /* zone de glissement : le haut de la feuille (poignée et titre), 48 px, garde le geste pour la page (touch-action:none) */
    '.vd366-zone{position:absolute;left:-24px;right:-24px;top:-22px;height:48px;pointer-events:auto;touch-action:none;background:transparent}' +
    '.vd366-x{position:absolute;right:-6px;top:-8px;z-index:1;display:grid;place-items:center;width:40px;height:40px;margin:0;padding:0;border:1px solid rgba(148,163,184,.35);border-radius:50%;' +
      'background:rgba(15,18,22,.92);color:#e5e7eb;font:600 20px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;cursor:pointer;pointer-events:auto;' +
      '-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
    'html.vd-workspace-light .vd366-x{background:rgba(255,255,255,.95);color:#0f172a;border-color:rgba(15,23,42,.18)}' +
    '.modal .sheet>h3:first-of-type,.modal .sheet>.grab+h3{padding-right:44px}' +
    /* <dialog> natif (transferts de stock) : centré (une remise à zéro des marges le collait en haut à gauche), fond translucide */
    'dialog[open]{margin:auto!important;max-width:calc(100vw - 24px)}dialog::backdrop{background:rgba(2,6,10,.55)}' +
    /* glisser vers le bas : la poignée, la croix et le titre gardent le geste pour la page (sans quoi iOS en fait un défilement de la page
       derrière) ; la page derrière ne défile pas ; le bouton ↑ de l'Inventaire ne passe plus par-dessus une fenêtre ouverte */
    '.modal .sheet>.grab,.modal .sheet>h3,.vd366-xbar,[role=dialog] h2,[role=dialog] h3{touch-action:none}' +
    '.modal.on,.modal .sheet{overscroll-behavior:contain}body:has(.modal.on) #upBtn,body:has(dialog[open]) #upBtn{display:none!important}' +
    /* Retour / Réception : nom et quantités sur toute la largeur, le champ à droite, le motif en dessous */
    '.ord-receive-row{flex-wrap:wrap!important}.ord-receive-row>div{flex:1 1 55%!important;min-width:140px!important}' +
    '.ord-receive-row>select[data-motif]{flex:1 1 100%!important;width:100%!important}' +
    '.ord-receive-row span{white-space:normal!important;overflow:visible!important;text-overflow:clip!important}';
  (doc.head || doc.documentElement).appendChild(css);

  /* Fenêtres concernées : celles de l'Inventaire (.modal), toute fenêtre déclarée modale ([role=dialog][aria-modal=true]) et les <dialog>.
     Exclues : l'écran du verrou (sécurité : on n'en sort qu'en déverrouillant) et l'écran d'échec de chargement (sa sortie est « Réessayer »). */
  var SEL = '.modal,[role=dialog][aria-modal=true],dialog';
  function exclue(m) { return !!(m.closest('#vr16,#vr16-cache') || m.classList.contains('vd-failed') || m.id === 'pst83'); }
  function racine(m) { /* la feuille dans une couche (notifications, connexions) : la couche est la fenêtre */ var c = m.parentElement && m.parentElement.closest('.modal,[role=dialog][aria-modal=true]'); return c || m; }
  function panneau(m) { if (m.tagName === 'DIALOG') return m; return m.querySelector('.sheet') || m.querySelector('[role=dialog]') || m.firstElementChild || m; }
  function aDejaCroix(m) {
    return [].some.call(m.querySelectorAll('button,[role=button]'), function (b) {
      return b.classList.contains('vd366-x') || /^\s*(×|✕|✖)\s*$/.test(b.textContent) || /^(fermer|close)/i.test(b.getAttribute('aria-label') || '');
    });
  }
  function croixDe(m) { return [].filter.call(m.querySelectorAll('button,[role=button]'), function (b) { return visible(b) && (/^\s*(×|✕|✖)\s*$/.test(b.textContent) || /^(fermer|close)/i.test(b.getAttribute('aria-label') || '')); })[0]; }
  function poser(m) {
    if (!m || exclue(m)) return; m = racine(m); if (m.__vd366) return; var sh = panneau(m); if (!sh) return;
    m.__vd366 = true; if (aDejaCroix(m)) return;
    var bar = doc.createElement('div'); bar.className = 'vd366-xbar';
    var x = doc.createElement('button'); x.type = 'button'; x.className = 'vd366-x'; x.textContent = '×'; x.setAttribute('aria-label', lib());
    x.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); fermer(m); });
    var zone = doc.createElement('div'); zone.className = 'vd366-zone'; zone.setAttribute('aria-hidden', 'true');
    bar.appendChild(zone); bar.appendChild(x); sh.insertBefore(bar, sh.firstChild);
  }
  function tout() { [].forEach.call(doc.querySelectorAll(SEL), poser); }
  function visible(b) { return !!(b && b.getClientRects().length && w.getComputedStyle(b).visibility !== 'hidden'); }
  function ouverte(m) { if (m.tagName === 'DIALOG') return m.open; if (m.classList.contains('modal')) return m.classList.contains('on') && visible(m); return m.isConnected && !m.hidden && visible(m); }
  function fermer(m) {
    try {
      var fn = FERMER[m.id];
      if (fn && typeof w[fn] === 'function') w[fn]();
      else if (m.tagName === 'DIALOG') { var ev = new Event('cancel', { cancelable: true }); if (m.dispatchEvent(ev)) m.close(); return; }
      else {
        var b = m.querySelector('#aCancel');
        if (!visible(b)) { var cx = croixDe(m); if (cx && !cx.classList.contains('vd366-x')) b = cx; }
        if (!visible(b)) b = [].filter.call(m.querySelectorAll('button'), function (x) { return !x.classList.contains('vd366-x') && visible(x) && ANNULER.test((x.textContent || '').trim()); })[0];
        if (b) b.click();
      }
    } catch (e) {}
    if (m.classList.contains('modal')) { if (m.classList.contains('on')) m.classList.remove('on'); }
    else if (ouverte(m) && m.parentNode && /^(vx41-feuille|equipeSheet|vdOffre)$/.test(m.id)) { m.remove(); var v = doc.getElementById('vx41-voile'); if (v && m.id === 'vx41-feuille') v.remove(); }
  }
  function ouvertes() { return [].filter.call(doc.querySelectorAll(SEL), function (m) { return !exclue(m) && racine(m) === m && ouverte(m); }); }

  /* toucher à côté (le fond de la fenêtre) */
  doc.addEventListener('click', function (e) { var m = e.target; if (!m || !m.matches || !m.matches(SEL) || exclue(m) || racine(m) !== m || !ouverte(m)) return;
    if (m.tagName === 'DIALOG') { var r = m.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return; }
    fermer(m); });
  /* Échap : la fenêtre du dessus */
  doc.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; var o = ouvertes(); if (!o.length) return; var m = o[o.length - 1];
    if (m.tagName === 'DIALOG') return; /* <dialog> : Échap natif (événement cancel) */
    setTimeout(function () { if (ouverte(m)) fermer(m); }, 0); });
  /* glisser vers le bas depuis la poignée, la croix ou le titre */
  var g = null;
  doc.addEventListener('touchstart', function (e) {
    if (g) { try { g.sh.style.transform = ''; g.sh.style.transition = ''; } catch (x) {} g = null; } /* geste précédent resté sans fin (iOS) */
    var t = e.target, m0 = t && t.closest && t.closest(SEL); if (!m0 || e.touches.length !== 1) return; var m = racine(m0); if (exclue(m) || !ouverte(m)) return;
    var sh = panneau(m), r = sh.getBoundingClientRect(); if (!t.closest('.grab,.vd366-xbar,h2,h3') && e.touches[0].clientY - r.top > 64) return;
    if (t.closest('input,select,textarea')) return;
    g = { sh: sh, m: m, y: e.touches[0].clientY, dy: 0 };
  }, { passive: true });
  doc.addEventListener('touchmove', function (e) {
    if (!g) return; g.dy = Math.max(0, e.touches[0].clientY - g.y);
    g.sh.style.transition = 'none'; g.sh.style.transform = g.dy ? 'translateY(' + g.dy + 'px)' : '';
  }, { passive: true });
  function finGeste() {
    if (!g) return; var x = g; g = null; x.sh.style.transition = 'transform .2s ease';
    if (x.dy > 90) { fermer(x.m); setTimeout(function () { x.sh.style.transform = ''; x.sh.style.transition = ''; }, 220); }
    else { x.sh.style.transform = ''; setTimeout(function () { x.sh.style.transition = ''; }, 220); }
  }
  doc.addEventListener('touchend', finGeste); doc.addEventListener('touchcancel', finGeste);

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', tout); else tout();
  w.addEventListener('load', tout);
  try { new MutationObserver(function (r) { for (var i = 0; i < r.length; i++) if (r[i].addedNodes.length) { tout(); return; } }).observe(doc.body || doc.documentElement, { childList: true }); } catch (e) {}
  w.VerdictFenetres366 = { fermer: fermer, ouvertes: ouvertes, poser: tout };
})();
