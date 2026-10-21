/* Veille du 20/10/2026 — avis CERT-FR CERTFR-2026-AVI-1329 du 16/10/2026, « Multiples vulnérabilités dans Google Chrome ».
   Les données de Verdict sont enregistrées dans le navigateur : sur un poste Google Chrome (Windows, Mac, Linux) antérieur
   aux versions corrigées de l'avis, un petit message discret le rappelle et dit comment mettre à jour.
   - seulement Google Chrome (marque « Google Chrome » donnée par le navigateur lui-même) ; jamais Safari, iPhone, iPad,
     Android, Firefox, Edge ni un autre navigateur ; dans le doute (version inconnue), rien ;
   - seuils de l'avis : 155.0.8059.84 (Windows, Linux), 155.0.8059.85 (Mac), Extended Stable 152.0.7977.169 (Windows, Mac) ;
   - jamais par-dessus le verrou ni pendant le message « Verdict mis à jour » ; « Compris » le masque 7 jours pour cette version ;
   - l'avis ne démontre aucune faille de Verdict : le message ne le prétend pas. Aucune donnée n'est envoyée nulle part. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.top !== w || w.VerdictNavigateur) return;
  var AVIS = {
    ref: 'CERTFR-2026-AVI-1329', date: '16/10/2026', lien: 'https://cert.cyber.gouv.fr/avis/CERTFR-2026-AVI-1329/',
    seuils: { Windows: '155.0.8059.84', Linux: '155.0.8059.84', macOS: '155.0.8059.85' },
    etendue: { majeure: 152, seuil: '152.0.7977.169', plateformes: ['Windows', 'macOS'] }
  };
  var CLE = 'verdict:avis-chrome-vu', SEPT_JOURS = 7 * 864e5;
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cmp(a, b) { var x = String(a).split('.'), y = String(b).split('.'); for (var i = 0; i < 4; i++) { var d = (+x[i] || 0) - (+y[i] || 0); if (d) return d < 0 ? -1 : 1; } return 0; }

  /* Décision pure : { version, seuil } si ce Chrome est antérieur aux versions de l'avis, sinon null (à jour, pas concerné ou inconnu). */
  function evaluer(info) {
    if (!info || !info.chrome || info.mobile) return null;
    var seuil = AVIS.seuils[info.plateforme]; if (!seuil) return null;
    var E = AVIS.etendue, etendue = E.plateformes.indexOf(info.plateforme) >= 0;
    var v = /^\d+\.\d+\.\d+\.\d+$/.test(info.version || '') ? info.version : '', maj = +String(v || info.majeure || '').split('.')[0];
    if (!maj) return null;
    if (v) {
      if (etendue && maj === E.majeure) return cmp(v, E.seuil) < 0 ? { version: v, seuil: E.seuil } : null;
      return cmp(v, seuil) < 0 ? { version: v, seuil: seuil } : null;
    }
    /* Version complète inconnue : seulement les cas sûrs (avant 155, hors 152 Extended Stable possible). */
    if (maj >= 155 || (etendue && maj === E.majeure)) return null;
    return { version: String(maj), seuil: seuil };
  }

  /* Ce que le navigateur dit de lui-même (Chrome, Edge, Opera… ; rien sous Safari ou sur iPhone). */
  function lireInfo(nav) {
    var u = nav && nav.userAgentData;
    if (!u || !Array.isArray(u.brands)) return Promise.resolve(null);
    function marque(L) { return (L || []).filter(function (b) { return b && b.brand === 'Google Chrome'; })[0]; }
    var m = marque(u.brands); if (!m) return Promise.resolve(null);
    var info = { chrome: true, mobile: !!u.mobile, plateforme: u.platform || '', majeure: m.version };
    if (typeof u.getHighEntropyValues !== 'function') return Promise.resolve(info);
    return Promise.resolve(u.getHighEntropyValues(['fullVersionList', 'platform'])).then(function (h) {
      var f = marque(h && h.fullVersionList); if (f) info.version = f.version;
      if (h && h.platform) info.plateforme = h.platform;
      return info;
    }, function () { return info; });
  }
  function masque(R, maintenant) {
    var s = null; try { s = JSON.parse(lire(CLE) || 'null'); } catch (e) {}
    return !!(s && s.v === R.version && maintenant - (+s.t || 0) >= 0 && maintenant - (+s.t || 0) < SEPT_JOURS);
  }

  function sombre() {
    var h = doc.documentElement; if (h.classList.contains('vd-workspace-dark')) return true; if (h.classList.contains('vd-workspace-light')) return false;
    return !!(w.matchMedia && w.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function css() {
    if (doc.getElementById('nav60-css')) return;
    var s = doc.createElement('style'); s.id = 'nav60-css';
    s.textContent = '#nav60{position:fixed;right:16px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:2147482980;box-sizing:border-box;width:min(400px,calc(100% - 24px));' +
      'padding:14px 16px;border-radius:16px;background:#fff;color:#0f172a;border:1px solid rgba(15,23,42,.14);box-shadow:0 14px 40px rgba(15,23,42,.22);' +
      'font:500 13px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;text-align:left}' +
      '#nav60 b{display:block;font-size:14px;font-weight:800;margin:0 0 4px}#nav60 p{margin:0 0 6px}' +
      '#nav60 .nav60-pied{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:8px}' +
      '#nav60 a{color:#1d4ed8;font-size:12px;text-decoration:underline}' +
      '#nav60 button{min-height:36px;padding:0 16px;border-radius:10px;border:0;background:#2563eb;color:#fff;font:700 13px/1 system-ui,sans-serif;cursor:pointer}' +
      '#nav60.nav60-sombre{background:#0f172a;color:#f1f5f9;border-color:rgba(255,255,255,.14);box-shadow:0 14px 40px rgba(0,0,0,.5)}' +
      '#nav60.nav60-sombre a{color:#93c5fd}#nav60.nav60-sombre button{background:#f1f5f9;color:#0f172a}' +
      '@media (max-width:820px){#nav60{right:12px;bottom:calc(104px + env(safe-area-inset-bottom,0px))}}';
    (doc.head || doc.documentElement).appendChild(s);
  }
  function montrer(R) {
    if (!R || doc.getElementById('nav60')) return;
    css();
    var b = doc.createElement('div'); b.id = 'nav60'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite');
    b.innerHTML = '<b>Chrome n’est pas à jour sur ce poste</b>' +
      '<p>Version ' + esc(R.version) + '. Le CERT-FR a publié le ' + AVIS.date + ' un avis de sécurité pour les versions antérieures à ' + esc(R.seuil) + '. Vos données Verdict sont enregistrées dans ce navigateur.</p>' +
      '<p>Mettez Chrome à jour (⋮ › Aide › À propos de Google Chrome), relancez-le, puis vérifiez que Verdict s’ouvre avec vos chiffres.</p>' +
      '<div class="nav60-pied"><a href="' + AVIS.lien + '" target="_blank" rel="noopener noreferrer">Avis ' + AVIS.ref + ' du ' + AVIS.date + '</a><button type="button">Compris</button></div>';
    b.classList.toggle('nav60-sombre', sombre());
    b.querySelector('button').addEventListener('click', function () { ecrire(CLE, JSON.stringify({ v: R.version, t: Date.now() })); b.remove(); });
    doc.body.appendChild(b);
  }

  /* Le message attend que l'appli soit ouverte (verrou levé), visible, et que « Verdict mis à jour » soit parti. */
  function verrouVisible() { var v = doc.getElementById('vr16'); return !!(v && !v.hidden && v.getClientRects().length); }
  function attendre(R, essais) {
    if (essais > 120) return;
    if (doc.hidden || !doc.body || verrouVisible() || doc.getElementById('nv53')) return setTimeout(function () { attendre(R, essais + 1); }, 1500);
    montrer(R);
  }
  function verifier() {
    return lireInfo(w.navigator).then(function (info) {
      var R = evaluer(info);
      if (R && !masque(R, Date.now())) attendre(R, 0);
      return R;
    }, function () { return null; });
  }
  setTimeout(verifier, 4000);

  w.VerdictNavigateur = { avis: AVIS, evaluer: evaluer, lireInfo: lireInfo, masque: masque, montrer: montrer, verifier: verifier };
})();
