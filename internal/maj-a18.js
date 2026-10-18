/* C51 — « Nouvelle version disponible » : plus jamais besoin de supprimer et réinstaller l'appli.
   - L'appli vérifie s'il existe une nouvelle version à l'ouverture, au retour au premier plan et toutes les
     minutes (Mac, iPhone, iPad, appli du Dock ou de l'écran d'accueil).
   - Appli classique (Client, appli Mac locale) : la nouvelle version s'installe en arrière-plan ; dès qu'elle est
     prête, un bandeau propose « Mettre à jour » (enregistrement des saisies, puis rechargement).
   - Espace chiffré (Perso, Pilote en ligne) : la version publiée est comparée à celle ouverte.
   Rien n'est envoyé : seules les pages de l'appli sont relues. */
(function () {
  'use strict';
  if (window.top !== window || window.__verdictMaj) return; window.__verdictMaj = true;
  var w = window, doc = document, PERIODE = 60 * 1000, ready = false, base = null, timer = 0;
  var coffre = doc.querySelector('script[data-coffre]');
  var coffreUrl = coffre ? new URL('coffre.json', new URL(coffre.src, location.href)).href : '';

  function css() {
    if (doc.getElementById('maj18-css')) return;
    var s = doc.createElement('style'); s.id = 'maj18-css';
    s.textContent = '#maj18{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:12px;width:min(520px,calc(100% - 24px));padding:12px 12px 12px 16px;border-radius:16px;background:#0f172a;color:#fff;box-shadow:0 14px 40px rgba(0,0,0,.35);font:600 14px/1.35 -apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif;animation:maj18In .35s ease}' +
      '@keyframes maj18In{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}' +
      '#maj18 span{flex:1}#maj18 b{display:block;font-size:15px}#maj18 small{opacity:.75;font-weight:500}' +
      '#maj18 button{min-height:42px;padding:0 16px;border:0;border-radius:12px;background:#22c55e;color:#04150b;font:800 14px/1 inherit;cursor:pointer;white-space:nowrap}' +
      '#maj18 button.maj18-later{background:transparent;color:#cbd5e1;padding:0 8px;font-weight:600}' +
      /* C72 : couleur opposée à l'écran pour sauter aux yeux — écran sombre → alerte blanche. */
      '#maj18.maj18-clair{background:#ffffff;color:#0f172a;box-shadow:0 14px 40px rgba(0,0,0,.55);border:1px solid rgba(15,23,42,.12)}#maj18.maj18-clair small{opacity:.7}#maj18.maj18-clair button.maj18-later{color:#475569}';
    doc.head.appendChild(s);
  }
  /* C56 : toutes les fenêtres ouvertes de la même appli se tiennent au courant (un « Plus tard » ferme le bandeau partout). */
  var canal = null; try { canal = new BroadcastChannel('verdict-maj'); canal.onmessage = function (e) { if (e.data === 'plus-tard') later(true); }; } catch (e) {}
  var NOTIF_ID = 'maj:nouvelle-version', postponed = false;
  function centre() { var s = window.VerdictUnifiedShell; return s && s.notifications; }
  /* C166 (Steven, 19/10 : « j'ai toujours l'info Journée tout en bas, je sais pas si j'ai les vraies mises à jour ») :
     l'appli installée gardait l'ancienne version tant que « Mettre à jour » n'était pas touché. Désormais, à l'ouverture
     (30 premières secondes) et au retour sur l'appli après plus d'une minute ailleurs, une nouvelle version s'installe
     d'elle-même — jamais pendant une saisie (champ en cours de remplissage) : le bandeau reste alors proposé. */
  var ouvertA = Date.now(), cacheA = 0, retourA = 0, autoFaite = false;
  doc.addEventListener('visibilitychange', function () { if (doc.hidden) cacheA = Date.now(); else if (cacheA && Date.now() - cacheA > 60000) retourA = Date.now(); });
  function champActif(d, n) {
    try {
      var a = d.activeElement; if (!a) return false;
      if (a.tagName === 'IFRAME') return n < 3 && !!a.contentDocument && champActif(a.contentDocument, n + 1);
      if (a.isContentEditable) return true;
      return /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !/^(button|submit|checkbox|radio|range|reset)$/i.test(a.type || '') && String(a.value || '') !== '';
    } catch (e) { return false; }
  }
  function momentSur() { var t = Date.now(), dern = 0; try { dern = +sessionStorage.getItem('verdict:maj-appliquee') || 0; } catch (e) {} return !autoFaite && t - dern > 120000 && (t - ouvertA < 30000 || (!!retourA && t - retourA < 15000)) && !champActif(doc, 0); }
  function banner() {
    if (doc.getElementById('maj18') || postponed) return;
    if (momentSur()) { autoFaite = true; return apply(true); }
    css();
    var b = doc.createElement('div'); b.id = 'maj18'; b.setAttribute('role', 'status');
    b.innerHTML = '<span><b>Nouvelle version Verdict disponible</b><small>Vos saisies sont enregistrées avant la mise à jour.</small></span><button type="button" class="maj18-go">Mettre à jour</button><button type="button" class="maj18-later" aria-label="Plus tard">Plus tard</button>';
    doc.body.appendChild(b); contraste(); ranger();
    b.querySelector('.maj18-go').onclick = apply;
    prevenir();
    b.querySelector('.maj18-later').onclick = function () { later(false); };
  }
  /* C72 — L'alerte prend la couleur opposée à l'écran (clair → alerte sombre, sombre → alerte blanche), y compris
     quand on change de thème pendant qu'elle est affichée. */
  function sombre() {
    var h = doc.documentElement; if (h.classList.contains('vd-workspace-dark')) return true; if (h.classList.contains('vd-workspace-light')) return false;
    try { var c = getComputedStyle(doc.body).backgroundColor.match(/\d+(\.\d+)?/g); if (c && (c.length < 4 || +c[3] > 0)) return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 < 0.45; } catch (e) {}
    return !!(w.matchMedia && w.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function contraste() { var t = sombre(); ['maj18', 'pst83'].forEach(function (id) { var b = doc.getElementById(id); if (b) b.classList.toggle('maj18-clair', t); }); }
  try { new MutationObserver(contraste).observe(doc.documentElement, { attributes: true, attributeFilter: ['class'] }); } catch (e) {}
  /* C72 — Vraie notification du système (avec le son de l'appareil) quand une nouvelle version arrive, si le client l'a
     activée dans Sécurité 🔒. Une seule fois par version ; la toucher ouvre Verdict et lance la mise à jour.
     Appli ouverte ou en arrière-plan ; appli fermée : il faudra le serveur Verdict (notifications push). */
  var NOTIF_PREF = 'verdict:maj-notifications', NOTIF_FAITE = 'verdict:maj-notifiee', prevenirPlusTard = false;
  doc.addEventListener('visibilitychange', function () { if (doc.hidden && prevenirPlusTard && doc.getElementById('maj18')) prevenir(); });
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function notifEtat() { if (!('Notification' in w)) return 'indisponible'; if (Notification.permission === 'denied') return 'refusee'; return Notification.permission === 'granted' && lire(NOTIF_PREF) !== 'non' ? 'active' : 'inactive'; }
  /* C135 (Steven, 17/10 : « je veux juste Nouvelle version Verdict disponible, rien d'autre, pas de from ») : iOS ajoute
     lui-même « from Verdict » à toute notification système d'une appli web installée, et aucune appli ne peut l'enlever.
     Appli ouverte : plus de notification système, seulement le bandeau de Verdict (titre exact, sans « from »).
     La notification système ne part que si Verdict est en arrière-plan (ou dès qu'il y passe). */
  function prevenir() {
    if (notifEtat() !== 'active') return;
    if (!doc.hidden) { prevenirPlusTard = true; return; }
    prevenirPlusTard = false;
    versionPubliee().then(function (v) {
      v = v || 'nouvelle'; if (lire(NOTIF_FAITE) === v) return; ecrire(NOTIF_FAITE, v);
      var titre = 'Nouvelle version Verdict disponible', opts /* C117/C135 : iOS ajoute lui-même « from Verdict » en arrière-plan */ = { body: 'Touchez pour mettre à jour. Vos saisies sont enregistrées avant.', tag: 'verdict-maj', renotify: true, icon: new URL('icon-192.png', (doc.querySelector('link[rel=manifest]') || {}).href || location.href).href };
      var viaWorker = 'serviceWorker' in navigator ? navigator.serviceWorker.getRegistration().then(function (r) { if (!r) throw 0; return r.showNotification(titre, opts); }) : Promise.reject();
      return viaWorker.catch(function () { var n = new Notification(titre, opts); n.onclick = function () { try { w.focus(); } catch (e) {} n.close(); apply(); }; });
    }).catch(function () {});
  }
  function notifActiver(oui) {
    if (!oui) { ecrire(NOTIF_PREF, 'non'); return Promise.resolve(notifEtat()); }
    if (!('Notification' in w)) return Promise.resolve('indisponible');
    ecrire(NOTIF_PREF, 'oui');
    var p = Notification.permission === 'granted' ? Promise.resolve('granted') : Promise.resolve(Notification.requestPermission());
    return p.then(function () { return notifEtat(); }, function () { return notifEtat(); });
  }
  if ('serviceWorker' in navigator) try { navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.type === 'verdict-maj-appliquer') apply(); }); } catch (e) {}
  /* C83 — Pastille du nombre sur l'icône (écran d'accueil iPhone / iPad) : iOS ne l'affiche qu'après autorisation des
     notifications (sur Mac, elle s'affiche sans). Dans l'appli installée sur iPhone/iPad, si l'autorisation n'a jamais
     été demandée, Verdict la propose une fois (refusable, reproposée au plus tous les 7 jours) ; dès qu'elle est
     donnée, le nombre de notifications non lues s'affiche sur l'icône, comme sur Mac. */
  function poserPastille() { try { var n = +w.__vdBadgeCount || 0; if (navigator.setAppBadge) { if (n) navigator.setAppBadge(n); else if (navigator.clearAppBadge) navigator.clearAppBadge(); } } catch (e) {} }
  var IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var installee = !!(navigator.standalone || (w.matchMedia && w.matchMedia('(display-mode: standalone)').matches));
  function proposerPastille() {
    if (!IOS || !installee || !('Notification' in w) || Notification.permission !== 'default' || doc.getElementById('pst83')) return;
    var plusTard = +lire('verdict:pastille-plus-tard') || 0; if (Date.now() - plusTard < 7 * 864e5) return;
    css();
    var b = doc.createElement('div'); b.id = 'pst83'; b.setAttribute('role', 'dialog');
    b.innerHTML = '<span><b>Le nombre sur l’icône Verdict</b><small>Comme sur Mac : vos notifications non lues s’affichent sur l’icône de l’écran d’accueil.</small></span><button type="button" class="maj18-go">Activer</button><button type="button" class="maj18-later">Plus tard</button>';
    b.style.cssText = 'top:auto;bottom:calc(96px + env(safe-area-inset-bottom,0px))';
    if (!doc.getElementById('pst83-css')) { var st = doc.createElement('style'); st.id = 'pst83-css'; st.textContent = (doc.getElementById('maj18-css') || { textContent: '' }).textContent.replace(/#maj18/g, '#pst83'); doc.head.appendChild(st); }
    doc.body.appendChild(b); b.classList.toggle('maj18-clair', sombre());
    b.querySelector('.maj18-later').onclick = function () { ecrire('verdict:pastille-plus-tard', String(Date.now())); b.remove(); };
    b.querySelector('.maj18-go').onclick = function () {
      Promise.resolve(Notification.requestPermission()).then(function (r) {
        b.remove(); if (r === 'granted') { ecrire(NOTIF_PREF, 'oui'); poserPastille(); } else ecrire('verdict:pastille-plus-tard', String(Date.now()));
      }, function () { b.remove(); });
    };
  }
  setTimeout(proposerPastille, 6000);
  doc.addEventListener('visibilitychange', function () { if (doc.hidden) poserPastille(); });
  /* « Plus tard » : le bandeau se ferme (dans toutes les fenêtres) et la mise à jour attend dans les notifications. */
  function later(fromOther) {
    postponed = true; var b = doc.getElementById('maj18'); if (b) b.remove();
    if (!fromOther && canal) try { canal.postMessage('plus-tard'); } catch (e) {}
    ranger();
  }
  /* C74 — Dès qu'une mise à jour existe, elle entre d'office dans le centre de notifications (cloche +1), sur
     ordinateur, tablette et mobile, comme une rupture d'Inventaire ; elle y reste jusqu'à la mise à jour. */
  /* C111 — Client : le bandeau arrive souvent avant que le centre de notifications de la coquille soit prêt (verrou,
     démarrage) ; l'entrée est alors réessayée jusqu'à 2 minutes, au lieu d'être perdue. */
  var rangerEssais = 0;
  function ranger() {
    var c = centre();
    if (!c || !c.ingest) { if (rangerEssais++ < 240) setTimeout(ranger, 500); return; }
    rangerEssais = 0;
    c.ingest({ id: NOTIF_ID, source: 'Verdict', module: 'verdict', level: 'info', title: 'Nouvelle version Verdict disponible', detail: 'Mettez à jour quand vous voulez : vos saisies sont enregistrées avant.', actionLabel: 'Mettre à jour', proof: 'Une nouvelle version a été publiée et téléchargée sur cet appareil.', createdAt: new Date().toISOString(), forceUnread: true });
  }
  /* Ouvrir cette notification = mettre à jour (avant l'action habituelle du centre). */
  doc.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('#notification-list .notification-item[data-notification-id="' + NOTIF_ID + '"]');
    if (!card || e.target.closest('.notification-delete,.notification-secondary,summary,details')) return;
    e.preventDefault(); e.stopImmediatePropagation(); var c = centre(); if (c && c.remove) c.remove(NOTIF_ID); apply();
  }, true);
  /* Une ouverture charge toujours la dernière version : la notification d'une mise à jour déjà faite disparaît. */
  setTimeout(function () { var c = centre(); if (c && c.getItems && c.getItems().some(function (i) { return i.id === NOTIF_ID; }) && !postponed) c.remove(NOTIF_ID); }, 1500);
  function apply(auto) {
    /* C59 : la mise à jour est validée dans une appli déjà ouverte : le rechargement ne redemande ni code, ni mot de passe.
       C166 : mise à jour automatique pendant que l'écran de verrouillage est affiché → le code reste demandé. */
    var verrouille = auto === true && !!doc.getElementById('vr16');
    try { if (!verrouille) sessionStorage.setItem('verdict:maj-sans-verrou', String(Date.now())); sessionStorage.setItem('verdict:maj-appliquee', String(Date.now())); } catch (e) {}
    var btn = doc.querySelector('#maj18 .maj18-go'); if (btn) { btn.disabled = true; btn.textContent = 'Mise à jour…'; }
    var guard = window.VerdictUpdateGuard && window.VerdictUpdateGuard.prepare ? window.VerdictUpdateGuard.prepare() : Promise.resolve({ ok: true });
    Promise.resolve(guard).catch(function () { return { ok: true }; }).then(function () {
      /* Appli classique : on « réveille » la version téléchargée (elle attend), puis on recharge quand elle a pris la main. */
      if (coffreUrl || !('serviceWorker' in navigator)) return location.reload();
      navigator.serviceWorker.getRegistration().then(function (reg) {
        function bascule(r) { applying = true; r.waiting.postMessage({ type: 'SKIP_WAITING' }); setTimeout(function () { location.reload(); }, 4000); }
        if (reg && reg.waiting) return bascule(reg);
        /* C70 : la nouvelle version n'est pas encore téléchargée sur cet appareil (iPhone : téléchargement lent ou
           interrompu) : on la télécharge maintenant, puis on bascule ; sinon réparation (jamais un simple rechargement
           qui laisserait l'ancienne version). */
        if (!reg) return reparer();
        reg.update().catch(function () {}).then(function () { return attendreAttente(reg, 45000); }).then(function (pret) { if (pret) bascule(reg); else reparer(); });
      }, function () { location.reload(); });
    });
  }

  /* Espace chiffré : la version publiée (coffre.json) a-t-elle changé depuis l'ouverture ? */
  function checkCoffre() {
    return fetch(coffreUrl + '?maj=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (m) {
      if (!m || !m.version) return;
      if (base === null) { base = m.version; return; }
      if (m.version !== base) banner();
    }).catch(function () {});
  }
  /* Appli classique : on demande au service worker de vérifier ; la nouvelle version prête prend la main. */
  var applying = false, watched = null;
  /* Dès que la nouvelle version a fini de se télécharger (état « installée »), l'alerte s'affiche, sans attendre. */
  function watch(reg) {
    if (!reg || watched === reg) return; watched = reg;
    function follow(w) { if (w) w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) banner(); }); }
    reg.addEventListener('updatefound', function () { follow(reg.installing); });
    /* C61 : une installation déjà commencée à l'ouverture (avant ce script) est suivie elle aussi. */
    follow(reg.installing);
  }
  /* C61 : pendant la démonstration, le shell n'enregistre pas le service worker : sans lui, aucune nouvelle version
     ne pouvait être détectée. Il est enregistré ici (même fichier, même portée que le shell) après 15 s. */
  var loadedAt = Date.now(), registering = false;
  function selfRegister(now) {
    var c = window.VERDICT_UNIFIED_CONFIG;
    if (registering || !c || !c.serviceWorker || location.protocol === 'file:' || (!now && Date.now() - loadedAt < 15000)) return;
    registering = true;
    return navigator.serviceWorker.register(c.serviceWorker, { scope: './', updateViaCache: 'none' }).then(watch, function () { registering = false; });
  }
  function checkWorker() {
    if (!('serviceWorker' in navigator)) return Promise.resolve();
    return navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg) return selfRegister();
      watch(reg);
      if (reg.waiting) banner();
      return reg.update().catch(function () {}).then(function () {
        /* C70 : l'alerte ne dépend plus du téléchargement : une version publiée plus récente que celle qui tourne
           suffit à proposer « Mettre à jour ». */
        return etat().then(function (e) { if (e.publiee && e.courante && !e.aJour) banner(); });
      });
    }).catch(function () {});
  }
  function check() {
    clearTimeout(timer);
    if (!doc.hidden && navigator.onLine !== false) (coffreUrl ? checkCoffre() : checkWorker());
    timer = setTimeout(check, PERIODE);
  }
  /* C64 : la nouvelle version demande si cette fenêtre sait se mettre à jour ; oui → alerte habituelle (jamais de
     rechargement imposé pendant une saisie). Sans réponse (ancienne version), elle prendrait la main d'elle-même. */
  if (!coffreUrl && 'serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.type === 'verdict-maj-presence' && e.source) try { e.source.postMessage({ type: 'verdict-maj-present' }); } catch (x) {} });
      navigator.serviceWorker.startMessages();
    } catch (e) {}
  }
  if (!coffreUrl && 'serviceWorker' in navigator) {
    var had = !!navigator.serviceWorker.controller;
    /* C78 : dans la minute qui suit « Mettre à jour », la nouvelle version peut prendre la main juste après le
       rechargement : on recharge alors en silence (sans alerte fantôme, sans redemander le code). */
    var justeMaj = false; try { justeMaj = Date.now() - (+sessionStorage.getItem('verdict:maj-appliquee') || 0) < 60000; } catch (e) {}
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (applying) return location.reload();
      if (justeMaj) { justeMaj = false; try { sessionStorage.setItem('verdict:maj-sans-verrou', String(Date.now())); } catch (e) {} return location.reload(); }
      if (had) banner(); had = true;
    });
  }
  /* Une seule alerte : celle d'origine du shell (« Mise à jour prête », en bas) est masquée ; celle-ci fait la même bascule. */
  try { var hide = doc.createElement('style'); hide.textContent = '#verdict-update-alert{display:none!important}'; (doc.head || doc.documentElement).appendChild(hide); } catch (e) {}
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) check(); });
  window.addEventListener('focus', function () { check(); });
  window.addEventListener('online', function () { check(); });
  setTimeout(function () { ready = true; check(); }, 4000);
  /* C65 — Version visible et recherche manuelle (écran Sécurité 🔒), comme dans les applis pro.
     etat() : version qui tourne ici et version publiée ; verifier() : cherche, installe, et en dernier recours
     répare (service worker et fichiers en cache seulement : codes, réglages et données ne sont pas touchés). */
  function court(v) { var m = /([0-9a-f]{6,})$/.exec(v || ''); return m ? m[1].slice(0, 7) : (v || '?'); }
  function versionCourante() {
    if (coffreUrl) return Promise.resolve(base);
    return new Promise(function (res) {
      var c = navigator.serviceWorker && navigator.serviceWorker.controller; if (!c) return res(null);
      var t = setTimeout(function () { res(null); }, 1500);
      navigator.serviceWorker.addEventListener('message', function on(e) { if (e.data && e.data.type === 'verdict-version') { clearTimeout(t); navigator.serviceWorker.removeEventListener('message', on); res(e.data.version); } });
      try { c.postMessage({ type: 'verdict-version' }); } catch (x) { res(null); }
    });
  }
  function versionPubliee() {
    if (coffreUrl) return fetch(coffreUrl + '?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (m) { return m.version; }, function () { return null; });
    var sw = (window.VERDICT_UNIFIED_CONFIG && window.VERDICT_UNIFIED_CONFIG.serviceWorker) || './sw.js';
    return fetch(sw + '?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) { var m = /const CACHE=CACHE_PREFIX\+'([^']+)'/.exec(t); return m ? m[1] : null; }, function () { return null; });
  }
  function etat() {
    return Promise.all([versionCourante(), versionPubliee()]).then(function (v) {
      /* Le service worker donne le nom complet (« verdict-v2-client-a10-… »), le fichier publié sa fin : on compare l'empreinte. */
      var same = !!(v[0] && v[1] && court(v[0]) === court(v[1]));
      return { courante: v[0], publiee: v[1], aJour: same, texte: 'Version ' + court(v[0]) + (v[1] ? (same ? ' · à jour' : ' · nouvelle version ' + court(v[1]) + ' disponible') : ' · hors ligne') };
    });
  }
  function reparer() {
    var jobs = [];
    try { jobs.push(navigator.serviceWorker.getRegistrations().then(function (a) { return Promise.all(a.map(function (r) { return r.unregister(); })); })); } catch (e) {}
    try { jobs.push(caches.keys().then(function (k) { return Promise.all(k.filter(function (n) { return /^verdict-v2-/.test(n); }).map(function (n) { return caches.delete(n); })); })); } catch (e) {}
    return Promise.all(jobs).catch(function () {}).then(function () { try { sessionStorage.setItem('verdict:maj-sans-verrou', String(Date.now())); } catch (e) {} location.reload(); });
  }
  /* C66 — Réponse immédiate, comme les applis pro : « Verdict est à jour » (avec l'heure), ou installation de la
     nouvelle version (« Mise à jour en cours… ») puis rechargement sans redemander le code. */
  function heure() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ' h ' + ('0' + d.getMinutes()).slice(-2); }
  function attendreAttente(reg, ms) {
    return new Promise(function (res) {
      var fin = Date.now() + ms;
      (function tour() { if (reg.waiting) return res(true); if (Date.now() > fin) return res(false); setTimeout(tour, 1000); })();
    });
  }
  function verifier(onEtape) {
    var etape = typeof onEtape === 'function' ? onEtape : function () {};
    etape('Recherche en cours…');
    return etat().then(function (e) {
      if (!e.publiee) { e.texte = 'Hors ligne : vérification impossible pour le moment.'; return e; }
      /* Sans service worker actif, la page vient d'être chargée depuis internet : c'est déjà la dernière version. */
      var aJour = e.aJour || (!coffreUrl && !(navigator.serviceWorker && navigator.serviceWorker.controller));
      if (aJour) { e.aJour = true; e.texte = 'Verdict est à jour · version ' + court(e.publiee) + ' · vérifié à ' + heure(); return e; }
      etape('Mise à jour en cours…');
      if (coffreUrl) { apply(); return e; }
      return navigator.serviceWorker.getRegistration().then(function (reg) {
        if (!reg) return reparer();
        watch(reg);
        if (reg.waiting) return apply();
        return reg.update().catch(function () {}).then(function () { return attendreAttente(reg, 45000); }).then(function (pret) { if (pret) apply(); else reparer(); });
      }).then(function () { e.texte = 'Mise à jour en cours…'; return e; });
    });
  }
  window.VerdictMaj = { check: check, banner: banner, etat: etat, verifier: verifier, notifications: { etat: notifEtat, activer: notifActiver } };
})();
