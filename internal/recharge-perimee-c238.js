/* =====================================================================
   C238 (Y05) — Une page restée en cache ne reste jamais cassée après une publication (lot L6, 21/10/2026)
   Chargé en premier par les pages qui appellent des fichiers à empreinte (assets/runtime-a10/*-<12 caractères>.js).
   GitHub Pages sert toutes les pages avec « max-age=600 » et la publication supprime les fichiers de la version
   précédente : sans service worker actif, une page gardée jusqu'à 10 minutes appelle des fichiers qui n'existent plus
   (404 : go(), drawCount()… indéfinis, appli cassée jusqu'à un rechargement forcé).
   Ici : un fichier à empreinte qui manque VRAIMENT (le serveur répond 404 ou 410, pas une coupure réseau) → la page est
   relue sur le serveur (cache HTTP remplacé) puis rechargée, une seule fois par minute au plus (jamais de boucle).
   Hors ligne : rien (la page reste telle quelle). Rien n'est envoyé ailleurs que sur le serveur de l'appli.
   ===================================================================== */
(function (w) {
  'use strict';
  if (w.__vdRechargePerimee) return; w.__vdRechargePerimee = true;
  var CLE = 'verdict:page-perimee:' + w.location.pathname, EMPREINTE = /\/assets\/runtime-a10\/[^\/?#]+-[a-f0-9]{12}\.js(?:[?#]|$)/, fait = false;
  function recharger() {
    if (fait) return;
    var avant = 0; try { avant = +w.sessionStorage.getItem(CLE) || 0; } catch (e) { return; }
    if (Date.now() - avant < 60000) return;
    try { w.sessionStorage.setItem(CLE, String(Date.now())); } catch (e) { return; }
    fait = true;
    try { var sw = w.navigator.serviceWorker; if (sw && sw.getRegistration) sw.getRegistration().then(function (r) { if (r) r.update(); }, function () {}); } catch (e) {}
    var fin = function () { w.location.reload(); };
    try { w.fetch(w.location.href, { cache: 'reload', credentials: 'same-origin' }).then(fin, fin); } catch (e) { fin(); }
  }
  w.addEventListener('error', function (e) {
    var s = e && e.target; if (!s || s.tagName !== 'SCRIPT' || !EMPREINTE.test(s.src || '')) return;
    try { w.fetch(s.src, { method: 'HEAD', cache: 'no-store', credentials: 'same-origin' }).then(function (r) { if (r.status === 404 || r.status === 410) recharger(); }, function () {}); } catch (x) {}
  }, true);
})(window);
