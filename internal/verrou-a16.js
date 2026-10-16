/* C47 — Verrouillage de Verdict, comme une application bancaire.
   - À la première ouverture : création d'un code personnel à 6 chiffres (obligatoire), puis Face ID / Touch ID proposé.
   - À chaque ouverture et au retour après le délai choisi : Face ID d'abord ; code si le visage échoue, est
     refusé, bloqué ou indisponible.
   - Codes faux : après 5 essais, attente croissante (1 min, 5 min, 15 min, puis 1 h), conservée même si on recharge.
   - Dès que l'appli passe en arrière-plan, un écran opaque masque les chiffres (aperçu du sélecteur d'applis).
   - Le code n'est jamais gardé en clair (PBKDF2-SHA-256 + sel). Face ID passe par une clé d'accès de l'appareil
     (WebAuthn) dont la signature est vérifiée ici avec la clé publique enregistrée.
   - Tout reste sur l'appareil : rien n'est envoyé. Réglages : bouton 🔒 de l'en-tête. */
(function () {
  'use strict';
  if (window.__verdictVerrou) return; window.__verdictVerrou = true;
  /* Page affichée dans une autre page Verdict déjà verrouillée (atelier dans le Pilote) : un seul verrou, celui du haut. */
  try { if (window.top !== window && window.top.__verdictVerrou) return; } catch (e) {}
  /* C58 — Espace chiffré en ligne (Perso, Pilote) : un seul secret, le mot de passe du coffre (celui saisi la
     première fois). Pas de second code à 6 chiffres : Face ID / Touch ID ouvre l'appli, et si le visage n'est pas
     reconnu (ou si Face ID n'est pas activé), c'est ce même mot de passe qui est redemandé. */
  var COFFRE = !!window.__verdictCoffre, FRAIS = !!window.__verdictCoffreFrais;
  /* C59 : « Mettre à jour » validé alors que l'appli était ouverte → le rechargement ne redemande rien. */
  var MAJ = false; try { var t = +sessionStorage.getItem('verdict:maj-sans-verrou') || 0; sessionStorage.removeItem('verdict:maj-sans-verrou'); MAJ = t > 0 && Date.now() - t < 120000; } catch (e) {}
  var doc = document, KEY = 'verdict:verrou:v1', ITER = 310000, LEN = 6;
  var DELAIS = [[0, 'Immédiatement'], [60, 'Après 1 minute'], [300, 'Après 5 minutes'], [900, 'Après 15 minutes']];
  var PALIERS = [0, 0, 0, 0, 0, 60, 300, 900, 3600];
  var S = { locked: true, hiddenAt: 0, entry: '', mode: '', tmp: '', busy: false, timer: 0 };
  var IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var MAC = !IOS && /Mac/.test(navigator.platform || '');
  var BIO = IOS ? 'Face ID' : MAC ? 'Touch ID' : 'empreinte ou visage';

  /* ───────── Stockage ───────── */
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function store(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} idb('put', JSON.stringify(c)); }
  /* C54 : stockage durable. Le Perso et l'atelier remplacent localStorage par une mémoire temporaire (vidée à chaque
     ouverture) : la configuration du verrou vit donc aussi dans IndexedDB, que rien ne vide. */
  function idb(op, val) {
    return new Promise(function (res) {
      try {
        var r = indexedDB.open('verdict-verrou', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('c'); };
        r.onerror = function () { res(null); };
        r.onsuccess = function () {
          try { var t = r.result.transaction('c', op === 'get' ? 'readonly' : 'readwrite'), s = t.objectStore('c'), q = op === 'get' ? s.get('cfg') : s.put(val, 'cfg');
            q.onsuccess = function () { res(op === 'get' ? (q.result || null) : true); }; q.onerror = function () { res(null); }; } catch (e) { res(null); }
        };
      } catch (e) { res(null); }
    });
  }

  var C = load();
  function b64(buf) { var s = '', u = new Uint8Array(buf); for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  function unb64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function b64url(buf) { return b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function rnd(n) { var u = new Uint8Array(n); crypto.getRandomValues(u); return u; }
  function hashCode(code, salt, iter) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, k, 256); })
      .then(b64);
  }
  function same(a, b) { if (a.length !== b.length) return false; var d = 0; for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }

  /* ───────── Face ID / Touch ID (WebAuthn, vérifié localement) ───────── */
  /* C59 : sur une adresse en chiffres (127.0.0.1…), les navigateurs refusent Face ID / Touch ID pour une page web. */
  var IP = /^[\d.]+$|^\[|:/.test(location.hostname);
  function bioAvailable() {
    if (IP) return Promise.resolve(false);
    try { return window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ? PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() : Promise.resolve(false); }
    catch (e) { return Promise.resolve(false); }
  }
  function bioEnroll() {
    var opts = { publicKey: {
      rp: { name: 'Verdict' }, challenge: rnd(32),
      user: { id: rnd(16), name: 'verdict-' + location.pathname.split('/')[1], displayName: 'Verdict — déverrouillage' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      timeout: 60000, attestation: 'none' } };
    return navigator.credentials.create(opts).then(function (cred) {
      var r = cred.response, pk = r.getPublicKey && r.getPublicKey(), alg = r.getPublicKeyAlgorithm ? r.getPublicKeyAlgorithm() : -7;
      if (!pk) throw new Error('Clé publique indisponible sur cet appareil.');
      C.bio = { id: b64(cred.rawId), pk: b64(pk), alg: alg }; store(C);
      return true;
    });
  }
  function derToRaw(der) {
    var u = new Uint8Array(der), i = 2; if (u[1] & 0x80) i += u[1] & 0x7f;
    function part() { i++; var len = u[i++], v = u.slice(i, i + len); i += len; while (v.length > 32 && v[0] === 0) v = v.slice(1); var o = new Uint8Array(32); o.set(v, 32 - v.length); return o; }
    var r = part(), s = part(), out = new Uint8Array(64); out.set(r); out.set(s, 32); return out;
  }
  function bioVerify() {
    if (!C || !C.bio) return Promise.reject(new Error('non'));
    var ch = rnd(32);
    return navigator.credentials.get({ publicKey: { challenge: ch, allowCredentials: [{ type: 'public-key', id: unb64(C.bio.id), transports: ['internal'] }], userVerification: 'required', timeout: 60000 } })
      .then(function (a) {
        var r = a.response, cd = JSON.parse(new TextDecoder().decode(r.clientDataJSON)), ad = new Uint8Array(r.authenticatorData);
        if (cd.type !== 'webauthn.get' || cd.challenge !== b64url(ch) || cd.origin !== location.origin) throw new Error('réponse invalide');
        if (!(ad[32] & 0x04)) throw new Error('visage non vérifié');
        return Promise.all([crypto.subtle.digest('SHA-256', new TextEncoder().encode(location.hostname)), crypto.subtle.digest('SHA-256', r.clientDataJSON)]).then(function (h) {
          var rp = new Uint8Array(h[0]); for (var i = 0; i < 32; i++) if (rp[i] !== ad[i]) throw new Error('site différent');
          var data = new Uint8Array(ad.length + 32); data.set(ad); data.set(new Uint8Array(h[1]), ad.length);
          var ec = C.bio.alg === -7, algo = ec ? { name: 'ECDSA', namedCurve: 'P-256' } : { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
          return crypto.subtle.importKey('spki', unb64(C.bio.pk), algo, false, ['verify']).then(function (key) {
            return crypto.subtle.verify(ec ? { name: 'ECDSA', hash: 'SHA-256' } : algo, key, ec ? derToRaw(r.signature) : r.signature, data);
          });
        });
      }).then(function (ok) { if (!ok) throw new Error('signature invalide'); return true; });
  }

  /* ───────── Interface ───────── */
  function css() {
    if (doc.getElementById('vr16-css')) return;
    var s = doc.createElement('style'); s.id = 'vr16-css';
    s.textContent =
      '#vr16{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:radial-gradient(120% 80% at 50% 0,#14251b 0,#07090c 62%);color:#f5f7fa;font:500 16px/1.4 -apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif;padding:calc(20px + env(safe-area-inset-top,0px)) 16px calc(20px + env(safe-area-inset-bottom,0px));-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}' +
      '#vr16,#vr16 *{pointer-events:auto!important;visibility:visible!important}#vr16[hidden]{display:none}#vr16 .vr-box{width:min(360px,100%);text-align:center}' +
      '#vr16 .vr-logo{width:64px;height:64px;margin:0 auto 14px;display:grid;place-items:center;border-radius:20px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.35);font-size:28px}' +
      '#vr16 h2{margin:0 0 6px;font-size:22px;letter-spacing:-.02em}#vr16 p{margin:0 auto 18px;max-width:300px;color:#a3adb8;font-size:14px}' +
      '#vr16 .vr-dots{display:flex;justify-content:center;gap:14px;margin:6px 0 10px}#vr16 .vr-dots i{width:14px;height:14px;border-radius:50%;border:2px solid #8b97a4;transition:background .15s,border-color .15s}#vr16 .vr-dots i.on{background:#22c55e;border-color:#22c55e}' +
      '#vr16 .vr-dots.shake{animation:vrShake .4s}@keyframes vrShake{20%,60%{transform:translateX(-9px)}40%,80%{transform:translateX(9px)}}' +
      '#vr16 .vr-msg{min-height:22px;margin:4px 0 12px;color:#f87171;font-size:14px}' +
      '#vr16 .vr-pad{display:grid;grid-template-columns:repeat(3,76px);gap:14px 22px;justify-content:center;margin:0 auto}' +
      '#vr16 .vr-pad button{width:76px;height:76px;border-radius:50%;border:0;background:rgba(255,255,255,.09);color:#fff;font:600 28px/1 inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
      '#vr16 .vr-pad button:active{background:rgba(255,255,255,.24)}#vr16 .vr-pad button.vr-ghost{background:transparent;font-size:15px;font-weight:600}' +
      '#vr16 .vr-pad button:disabled{opacity:.35}' +
      '#vr16 .vr-link{margin-top:18px;background:none;border:0;color:#86efac;font:600 14px/1.3 inherit;cursor:pointer}' +
      '#vr16 .vr-btn{display:block;width:100%;min-height:52px;margin:10px 0 0;border:0;border-radius:14px;background:#22c55e;color:#04150b;font:800 16px/1 inherit;cursor:pointer}' +
      '#vr16 .vr-btn.sec{background:rgba(255,255,255,.1);color:#fff}#vr16 .vr-btn.danger{background:#7f1d1d;color:#fff}' +
      '#vr16 .vr-list{text-align:left;margin:0 0 6px}#vr16 .vr-list label{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:15px}' +
      '#vr16 select{min-height:40px;border-radius:10px;border:1px solid #3b4652;background:#11161c;color:#fff;font:600 15px/1 inherit;padding:0 8px}' +
      '#vr16 input[type=checkbox]{width:22px;height:22px;accent-color:#22c55e}' +
      '#vr16 .vr-close{position:absolute;top:calc(14px + env(safe-area-inset-top,0px));right:16px;width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#fff;font-size:22px;cursor:pointer}' +
      '#vr16-cache{position:fixed;inset:0;z-index:2147483601;display:grid;place-items:center;background:#07090c;color:#22c55e;font:900 22px/1 -apple-system,system-ui,sans-serif;letter-spacing:.2em}#vr16-cache[hidden]{display:none}' +
      '.vr16-lockbtn svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}';
    doc.head.appendChild(s);
  }
  function root() {
    var el = doc.getElementById('vr16');
    if (!el) { el = doc.createElement('div'); el.id = 'vr16'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.hidden = true; doc.body.appendChild(el);
      /* C57 : une fenêtre de l'appli (accueil, intro) peut rendre « inactif » tout le reste de la page : jamais le verrou. */
      new MutationObserver(function () { if (el.hasAttribute('inert')) el.removeAttribute('inert'); if (el.getAttribute('aria-hidden') === 'true') el.removeAttribute('aria-hidden'); }).observe(el, { attributes: true, attributeFilter: ['inert', 'aria-hidden'] }); }
    return el;
  }
  /* Rend le reste de la page inactif (ni clic ni clavier) ; ne retire ensuite que ce que le verrou a posé. */
  function shield(on) {
    [].forEach.call(doc.body.children, function (n) {
      if (n.id === 'vr16' || n.id === 'vr16-cache' || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
      if (on) { if (!n.hasAttribute('inert')) { n.setAttribute('inert', ''); n.setAttribute('data-vr16', ''); } }
      else if (n.hasAttribute('data-vr16')) { n.removeAttribute('inert'); n.removeAttribute('data-vr16'); }
    });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(withBio) {
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', withBio ? 'bio' : '', '0', 'del'];
    return '<div class="vr-dots" aria-hidden="true">' + new Array(LEN + 1).join('<i></i>') + '</div><div class="vr-msg" role="alert"></div><div class="vr-pad">' +
      keys.map(function (k) {
        if (!k) return '<span></span>';
        if (k === 'bio') return '<button type="button" class="vr-ghost" data-k="bio" aria-label="' + esc(BIO) + '">' + esc(BIO) + '</button>';
        if (k === 'del') return '<button type="button" class="vr-ghost" data-k="del" aria-label="Effacer">⌫</button>';
        return '<button type="button" data-k="' + k + '">' + k + '</button>';
      }).join('') + '</div>';
  }
  function dots() { var el = root(); [].forEach.call(el.querySelectorAll('.vr-dots i'), function (d, i) { d.classList.toggle('on', i < S.entry.length); }); }
  function msg(t) { var m = root().querySelector('.vr-msg'); if (m) m.textContent = t || ''; }
  function shake() { var d = root().querySelector('.vr-dots'); if (!d) return; d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); try { navigator.vibrate && navigator.vibrate([40, 40, 40]); } catch (e) {} }
  function show(html, close) {
    css(); var el = root(); S.entry = '';
    el.innerHTML = (close ? '<button type="button" class="vr-close" data-close aria-label="Fermer">×</button>' : '') + '<div class="vr-box">' + html + '</div>';
    el.hidden = false; shield(true); dots();
    hookFrames(); el.tabIndex = -1; try { if (doc.activeElement && doc.activeElement.blur) doc.activeElement.blur(); el.focus({ preventScroll: true }); } catch (x) {}
    var c = el.querySelector('[data-close]'); if (c) c.onclick = function () { hide(); };
  }
  function hide() { var el = root(); el.hidden = true; el.innerHTML = ''; S.mode = ''; shield(false); annoncerOuvert(); }
  /* C103 : l'appli (dans son cadre) attend ce signal pour lancer l'anneau du score : il n'est plus joué derrière le verrou. */
  function annoncerOuvert() {
    if (S.locked) return;
    try { [].forEach.call(doc.querySelectorAll('iframe'), function (f) { try { f.contentWindow.postMessage({ type: 'verdict-verrou-ouvert' }, location.origin); } catch (e) {} }); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('verdict:verrou-ouvert')); } catch (e) {}
  }

  /* ───────── Écrans ───────── */
  function waitLeft() { return Math.max(0, Math.ceil(((C && C.until) || 0) - Date.now() / 1000)); }
  function fmt(s) { return s >= 3600 ? Math.ceil(s / 3600) + ' h' : s >= 60 ? Math.ceil(s / 60) + ' min' : s + ' s'; }
  function screenUnlock(autoBio) {
    S.mode = 'unlock'; S.locked = true;
    show('<div class="vr-logo">🔒</div><h2>Verdict est verrouillé</h2><p>' + (C.bio ? 'Utilisez ' + esc(BIO) + ' ou votre code.' : 'Saisissez votre code.') + '</p>' + pad(!!C.bio) + '<button type="button" class="vr-link" data-forgot>Code oublié ?</button>');
    root().querySelector('[data-forgot]').onclick = screenForgot;
    tick();
    if (autoBio && C.bio && !waitLeft()) tryBio();
  }
  function tick() {
    clearInterval(S.timer); var left = waitLeft(), el = root();
    [].forEach.call(el.querySelectorAll('.vr-pad button'), function (b) { if (b.getAttribute('data-k') !== 'bio') b.disabled = left > 0; });
    if (left > 0) { msg('Trop d’essais. Réessayez dans ' + fmt(left) + '.'); S.timer = setInterval(function () { if (!waitLeft()) { clearInterval(S.timer); msg(''); tick(); } else msg('Trop d’essais. Réessayez dans ' + fmt(waitLeft()) + '.'); }, 1000); }
  }
  function tryBio() {
    if (S.busy) return; S.busy = true;
    bioVerify().then(function () { S.busy = false; success(); }, function () { S.busy = false; msg(COFFRE ? BIO + ' n’a pas abouti : réessayez ou utilisez votre mot de passe.' : 'Saisissez votre code.'); });
  }
  function success() {
    C.fails = 0; C.until = 0; store(C); S.locked = false; S.hiddenAt = 0; hide();
  }
  function checkCode(code) {
    S.busy = true;
    return hashCode(code, unb64(C.salt), C.iter || ITER).then(function (h) { S.busy = false; return same(h, C.hash); });
  }
  function onUnlockCode(code) {
    checkCode(code).then(function (ok) {
      if (ok) return success();
      C.fails = (C.fails || 0) + 1;
      var wait = PALIERS[Math.min(C.fails, PALIERS.length - 1)];
      if (wait) C.until = Date.now() / 1000 + wait;
      store(C); S.entry = ''; dots(); shake();
      var rest = 5 - C.fails;
      msg(wait ? '' : 'Code incorrect' + (rest > 0 && rest < 3 ? ' · encore ' + rest + ' essai' + (rest > 1 ? 's' : '') + ' avant attente' : '') + '.');
      tick();
    });
  }
  function screenCoffre(autoBio) {
    S.mode = 'coffre'; S.locked = true;
    if (!C.bio) return motDePasse();
    show('<div class="vr-logo">🔒</div><h2>Verdict est verrouillé</h2><p>Utilisez ' + esc(BIO) + ' ou votre mot de passe.</p><div class="vr-msg" role="alert"></div>' +
      '<button type="button" class="vr-btn" data-bio>Utiliser ' + esc(BIO) + '</button><button type="button" class="vr-btn sec" data-mdp>Mot de passe</button>');
    var el = root();
    el.querySelector('[data-bio]').onclick = function () { tryBio(); };
    el.querySelector('[data-mdp]').onclick = motDePasse;
    if (autoBio) tryBio();
  }
  /* Revenir à la page du mot de passe : la clé du coffre est oubliée sur cet appareil, puis l'appli se recharge. */
  function motDePasse() {
    var g = window.VerdictUpdateGuard && window.VerdictUpdateGuard.prepare ? window.VerdictUpdateGuard.prepare() : null;
    Promise.resolve(g).catch(function () {}).then(function () {
      var sw = navigator.serviceWorker && navigator.serviceWorker.controller;
      return new Promise(function (res) {
        if (!sw) return res();
        var ch = new MessageChannel(), t = setTimeout(res, 3000);
        ch.port1.onmessage = function () { clearTimeout(t); res(); };
        sw.postMessage({ type: 'oublier' }, [ch.port2]);
      });
    }).then(function () { location.reload(); });
  }
  function screenCreate(step) {
    S.mode = step === 2 ? 'create2' : 'create';
    show('<div class="vr-logo">🛡️</div><h2>' + (step === 2 ? 'Confirmez votre code' : 'Protégez Verdict') + '</h2><p>' +
      (step === 2 ? 'Saisissez le même code une seconde fois.' : 'Choisissez votre code personnel à 6 chiffres.' + (IP ? '' : ' Ensuite, ' + esc(BIO) + ' pourra ouvrir Verdict ; ce code restera le secours.') + ' Personne d’autre que vous ne pourra ouvrir vos chiffres.') + '</p>' + pad(false));
  }
  function weak(code) { return /^(\d)\1+$/.test(code) || '0123456789012345'.indexOf(code) >= 0 || '9876543210987654'.indexOf(code) >= 0; }
  function onCreate(code) {
    if (S.mode === 'create') {
      if (weak(code)) { S.entry = ''; dots(); shake(); msg('Code trop simple : évitez 123456 ou 111111.'); return; }
      S.tmp = code; screenCreate(2); return;
    }
    if (code !== S.tmp) { S.tmp = ''; screenCreate(1); msg('Les deux codes sont différents, recommencez.'); return; }
    var salt = rnd(16); S.busy = true;
    hashCode(code, salt, ITER).then(function (h) {
      S.busy = false; S.tmp = '';
      C = Object.assign(C || {}, { v: 1, salt: b64(salt), hash: h, iter: ITER, delai: C && C.delai != null ? C.delai : 60, fails: 0, until: 0 });
      store(C); S.locked = false; screenBioOffer();
    });
  }
  function screenBioOffer() {
    bioAvailable().then(function (av) {
      /* Pas de nouvelle proposition juste après un code choisi parce que Face ID / Touch ID venait d'être écarté. */
      if (!av || (C && C.bio)) { hide(); return; }
      /* C111 — Proposé une seule fois par appareil : « il me demande si je veux activer Touch ID alors que c'est déjà
         fait » (Steven, 16/10, Pilote). Un refus vaut réponse ; le réglage reste disponible dans Sécurité. */
      if (C && C.bioPropose) { hide(); return; }
      C = C || {}; C.bioPropose = Date.now(); store(C);
      S.mode = 'offer';
      show('<div class="vr-logo">🙂</div><h2>Activer ' + esc(BIO) + ' ?</h2><p>Ouvrez Verdict d’un regard. ' + (COFFRE ? 'Votre mot de passe reste le secours si le visage n’est pas reconnu ; sans ' + esc(BIO) + ', il sera demandé à chaque ouverture.' : 'Votre code reste le secours si le visage n’est pas reconnu.') + '</p><button type="button" class="vr-btn" data-yes>Activer ' + esc(BIO) + '</button><button type="button" class="vr-btn sec" data-no>Plus tard</button>');
      var el = root();
      el.querySelector('[data-no]').onclick = hide;
      el.querySelector('[data-yes]').onclick = function () { bioEnroll().then(function () { hide(); toast(BIO + ' activé'); }, function () { hide(); toast(BIO + ' non activé : ' + (COFFRE ? 'le mot de passe' : 'le code') + ' reste demandé.'); }); };
    });
  }
  function screenForgot() {
    S.mode = 'forgot';
    show('<div class="vr-logo">❓</div><h2>Code oublié</h2><p>' + (C.bio ? 'Confirmez avec ' + esc(BIO) + ' pour choisir un nouveau code.' : 'Sans ' + esc(BIO) + ', la seule solution sûre est d’effacer les données Verdict de cet appareil, comme pour une appli bancaire.') + '</p>' +
      (C.bio ? '<button type="button" class="vr-btn" data-bio>Utiliser ' + esc(BIO) + '</button>' : '') +
      '<button type="button" class="vr-btn danger" data-wipe>Effacer les données de cet appareil</button><button type="button" class="vr-btn sec" data-back>Retour</button>');
    var el = root();
    el.querySelector('[data-back]').onclick = function () { screenUnlock(false); };
    var b = el.querySelector('[data-bio]'); if (b) b.onclick = function () { bioVerify().then(function () { C.fails = 0; C.until = 0; store(C); screenCreate(1); }, function () { screenUnlock(false); }); };
    el.querySelector('[data-wipe]').onclick = screenWipe;
  }
  function screenWipe() {
    S.mode = 'wipe';
    show('<div class="vr-logo">⚠️</div><h2>Tout effacer ?</h2><p>Vos établissements, cartes, inventaires et réglages Verdict seront supprimés de cet appareil. Cette action est définitive.</p><button type="button" class="vr-btn danger" data-ok>Oui, tout effacer</button><button type="button" class="vr-btn sec" data-back>Annuler</button>');
    var el = root();
    el.querySelector('[data-back]').onclick = function () { screenUnlock(false); };
    el.querySelector('[data-ok]').onclick = wipe;
  }
  /* N'efface que Verdict Client : les espaces chiffrés (Perso, Pilote) partagent l'adresse et restent intacts. */
  function wipe() {
    var keep = function (n) { return /^coffre:|^verdict-coffre/.test(n); };
    try { for (var i = localStorage.length - 1; i >= 0; i--) { var k = localStorage.key(i); if (k && !keep(k)) localStorage.removeItem(k); } } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    var jobs = [];
    try { if (indexedDB.databases) jobs.push(indexedDB.databases().then(function (a) { a.forEach(function (d) { if (d.name && !keep(d.name)) indexedDB.deleteDatabase(d.name); }); })); } catch (e) {}
    try { jobs.push(caches.keys().then(function (a) { return Promise.all(a.filter(function (n) { return !keep(n); }).map(function (n) { return caches.delete(n); })); })); } catch (e) {}
    Promise.all(jobs).catch(function () {}).then(function () { location.reload(); });
  }
  function screenSettings() {
    if (S.locked) return;
    S.mode = 'settings';
    bioAvailable().then(function (av) {
      show('<div class="vr-logo">🔒</div><h2>Sécurité</h2><p>Verdict se verrouille à chaque ouverture et au retour après le délai choisi.</p><div class="vr-list">' +
        (av ? '<label>' + esc(BIO) + '<input type="checkbox" data-bio' + (C.bio ? ' checked' : '') + '></label>' : '<label>' + esc(BIO) + '<span style="color:#a3adb8">indisponible ici</span></label>') +
        (window.VerdictMaj && window.VerdictMaj.notifications && window.VerdictMaj.notifications.etat() !== 'indisponible' ? '<label>Notifications et nombre sur l’icône<input type="checkbox" data-notif' + (window.VerdictMaj.notifications.etat() === 'active' ? ' checked' : '') + '></label>' : '<label>Notifications et nombre sur l’icône<span style="color:#a3adb8">indisponible ici</span></label>') +
        '<label>Verrouillage auto<select data-delai>' + DELAIS.map(function (d) { return '<option value="' + d[0] + '"' + (+C.delai === d[0] ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select></label></div>' +
        '<div class="vr-version" style="margin:14px 0 4px;color:#a3adb8;font-size:13px">Version : vérification…</div><button type="button" class="vr-btn sec" data-maj>Rechercher une mise à jour</button>' +
        '<button type="button" class="vr-btn" data-lock>Verrouiller maintenant</button>' + (COFFRE ? '' : '<button type="button" class="vr-btn sec" data-code>Changer mon code</button>'), true);
      var el = root();
      el.querySelector('[data-lock]').onclick = function () { lock(false); };
      /* C72 : notifications de mise à jour (vraie notification du système, avec son). */
      var nf = el.querySelector('[data-notif]');
      if (nf) nf.onchange = function () {
        var box = this; box.disabled = true;
        window.VerdictMaj.notifications.activer(box.checked).then(function (e) {
          box.disabled = false; box.checked = e === 'active';
          toast(e === 'active' ? 'Activé : nouvelles versions et nombre de notifications sur l’icône.' : e === 'refusee' ? 'Notifications refusées : autorisez-les dans les réglages de l’appareil.' : 'Notifications de mise à jour désactivées.');
        });
      };
      /* C65 : version installée / publiée et recherche manuelle d'une mise à jour. */
      var vz = el.querySelector('.vr-version'), mj = el.querySelector('[data-maj]'), M = window.VerdictMaj;
      /* C70 : une version plus récente existe → le bouton dit « Mettre à jour » (vert), pas « Rechercher ». */
      if (M && M.etat) M.etat().then(function (e) {
        vz.textContent = e.aJour || !e.publiee || !e.courante ? e.texte : 'Nouvelle version disponible (' + e.texte.replace(/^.*nouvelle version /, '').replace(/ disponible$/, '') + ')';
        if (e.publiee && e.courante && !e.aJour) { mj.textContent = 'Mettre à jour'; mj.classList.remove('sec'); }
      }); else vz.textContent = '';
      mj.onclick = function () {
        if (!M || !M.verifier) return; mj.disabled = true;
        M.verifier(function (t) { mj.textContent = t; }).then(function (e) {
          if (e && e.aJour === false && /en cours/.test(e.texte || '')) return; /* rechargement imminent */
          mj.disabled = false; mj.textContent = 'Rechercher une mise à jour'; mj.classList.add('sec');
          if (e && e.texte) { vz.textContent = e.texte; vz.style.color = e.aJour ? '#22c55e' : '#a3adb8'; toast(e.aJour ? 'Verdict est à jour' : e.texte); }
        }, function () { mj.disabled = false; mj.textContent = 'Rechercher une mise à jour'; toast('Vérification impossible, réessayez.'); });
      };
      el.querySelector('[data-delai]').onchange = function () { C.delai = +this.value; store(C); };
      if (el.querySelector('[data-code]')) el.querySelector('[data-code]').onclick = function () { S.mode = 'verify-change'; show('<div class="vr-logo">🔑</div><h2>Code actuel</h2><p>Saisissez votre code actuel.</p>' + pad(false), true); };
      var bx = el.querySelector('[data-bio]');
      if (bx) bx.onchange = function () {
        var box = this;
        if (box.checked) bioEnroll().then(function () { toast(BIO + ' activé'); }, function () { box.checked = false; toast(BIO + ' non activé'); });
        else { delete C.bio; store(C); toast(BIO + ' désactivé'); }
      };
    });
  }
  function toast(t) {
    var n = doc.createElement('div'); n.textContent = t;
    n.style.cssText = 'position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483647;background:#111827;color:#fff;padding:12px 18px;border-radius:14px;font:600 14px/1.3 -apple-system,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35)';
    doc.body.appendChild(n); setTimeout(function () { n.remove(); }, 2600);
  }

  /* ───────── Saisie (clavier tactile et clavier physique) ───────── */
  function press(k) {
    if (S.busy || !S.mode || /offer|forgot|wipe|settings|coffre/.test(S.mode)) return;
    if (k === 'bio') return tryBio();
    if (k === 'del') { S.entry = S.entry.slice(0, -1); dots(); return; }
    if (!/^\d$/.test(k) || S.entry.length >= LEN) return;
    if (S.mode === 'unlock' && waitLeft()) return;
    S.entry += k; dots(); msg('');
    if (S.entry.length < LEN) return;
    var code = S.entry;
    setTimeout(function () {
      if (S.mode === 'unlock') onUnlockCode(code);
      else if (S.mode === 'create' || S.mode === 'create2') onCreate(code);
      else if (S.mode === 'verify-change') checkCode(code).then(function (ok) { if (ok) screenCreate(1); else { S.entry = ''; dots(); shake(); msg('Code incorrect.'); } });
    }, 120);
  }
  /* Sur iPhone, l'appli neutralise certains « clics » issus du toucher : le verrou réagit donc au doigt levé
     (pointerup), et ignore le clic natif qui pourrait suivre, pour ne jamais compter une touche deux fois. */
  /* Un appui = un chiffre : la touche réagit dès que le doigt (ou la souris) se pose ; le clic qui suit ce même
     appui est ignoré. Les autres boutons réagissent au doigt levé. Le clic seul (clavier, Entrée) reste accepté. */
  var TAP = '#vr16 button, #vr16 input[type=checkbox]';
  function recent(b) { return b.__vrAt && Date.now() - b.__vrAt < 1000; }
  doc.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('#vr16 [data-k]'); if (!b || b.disabled) return;
    b.__vrAt = Date.now(); press(b.getAttribute('data-k'));
  }, true);
  doc.addEventListener('pointerup', function (e) {
    var b = e.target.closest && e.target.closest(TAP); if (!b || b.disabled || b.hasAttribute('data-k') || recent(b)) return;
    b.__vrAt = Date.now(); b.click();
  }, true);
  doc.addEventListener('click', function (e) {
    if (!e.isTrusted) return;
    var b = e.target.closest && e.target.closest(TAP); if (!b) return;
    if (recent(b)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (b.hasAttribute('data-k')) press(b.getAttribute('data-k'));
  }, true);
  /* Clavier d'ordinateur : la touche physique compte, pas le caractère. Sur un clavier français (AZERTY), la rangée
     du haut donne « & é " ' ( » sans Maj : Digit1…Digit0 et le pavé numérique valent quand même 1…0. */
  function onKey(e) {
    var el = doc.getElementById('vr16'); if (!el || el.hidden) return;
    var m = /^(?:Digit|Numpad)(\d)$/.exec(e.code || ''), k = m ? m[1] : (/^\d$/.test(e.key) ? e.key : '');
    if (k) { press(k); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === 'Backspace' || e.key === 'Delete') { press('del'); e.preventDefault(); e.stopPropagation(); }
  }
  doc.addEventListener('keydown', onKey, true);
  /* Si le curseur est resté dans Pilotage, Carte ou Inventaire (cadres intégrés), les touches y arrivent : on les écoute
     aussi là, et le verrou reprend le focus dès qu'il s'affiche. */
  function hookFrames() {
    [].forEach.call(doc.querySelectorAll('iframe'), function (f) {
      try { var d = f.contentDocument; if (d && !d.__vr16) { d.__vr16 = true; d.addEventListener('keydown', onKey, true); } } catch (x) {}
    });
  }

  /* ───────── Verrouillage ───────── */
  function configured() { return COFFRE || !!(C && C.hash); }
  function lock(autoBio) { if (COFFRE) { C = C || {}; return screenCoffre(autoBio); } /* C60 — logique des applis bancaires : un code Verdict à 6 chiffres est toujours la base (créé à la première
     ouverture) ; Face ID / Touch ID est le raccourci, essayé d'abord ; s'il échoue, c'est ce code qui est demandé. */
    if (!C || !C.hash) return screenCreate(1); S.locked = true; screenUnlock(autoBio); }
  function cover(on) {
    var c = doc.getElementById('vr16-cache');
    if (!c) { c = doc.createElement('div'); c.id = 'vr16-cache'; c.textContent = 'VERDICT'; c.hidden = true; doc.body.appendChild(c); }
    c.hidden = !on;
  }
  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) { S.hiddenAt = Date.now(); cover(true); return; }
    cover(false);
    if (!S.locked && configured() && S.hiddenAt && (Date.now() - S.hiddenAt) / 1000 >= (+C.delai || 0)) lock(true);
  });
  window.addEventListener('pagehide', function () { cover(true); });
  window.addEventListener('pageshow', function (e) { cover(false); if (e.persisted && configured()) lock(true); });

  /* Bouton 🔒 dans l'en-tête (à côté des notifications). */
  function lockButton() {
    var host = doc.querySelector('.shell-actions') || doc.querySelector('.topbar'); if (!host || host.querySelector('.vr16-lockbtn')) return;
    var ref = host.querySelector('button'), b = doc.createElement('button');
    b.type = 'button'; b.className = 'vr16-lockbtn ' + (ref ? ref.className.replace(/\bnotification-button\b/, '') : ''); b.setAttribute('aria-label', 'Sécurité et verrouillage');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
    b.onclick = screenSettings; host.insertBefore(b, host.firstChild);
  }
  function start() {
    css(); cover(true);
    idb('get').then(function (raw) {
      var saved = null; try { saved = raw ? JSON.parse(raw) : null; } catch (e) {}
      /* C113 — La mémoire durable vaut aussi pour les réglages seuls (délai, « Touch ID déjà proposé ») : dans le
         coffre (Perso, Pilote), le stockage local est vidé à chaque ouverture, IndexedDB est la seule référence. */
      if (saved && (saved.hash || saved.bio || saved.bioPropose || saved.delai != null)) C = saved; else if (C && (C.hash || C.bio)) idb('put', JSON.stringify(C));
      /* Face ID activé sans code (version du 15/10 à 20 h) : le code de base est créé à la prochaine ouverture. */
      cover(false);
      if (COFFRE) {
        C = C || {}; if (C.delai == null) C.delai = 60; store(C);
        /* Mot de passe tout juste saisi : l'appli s'ouvre (pas de seconde serrure) ; Face ID est proposé une fois. */
        if (FRAIS) { S.locked = false; annoncerOuvert(); screenBioOffer(); } else if (MAJ) { S.locked = false; annoncerOuvert(); } else screenCoffre(true);
        return;
      }
      if (MAJ && configured()) { S.locked = false; annoncerOuvert(); return; }
      lock(true);
    });
    lockButton(); hookFrames(); [].forEach.call(doc.querySelectorAll("iframe"), function (f) { f.addEventListener("load", function () { setTimeout(hookFrames, 0); }); });
    new MutationObserver(lockButton).observe(doc.body, { childList: true, subtree: true });
    /* C57 : tant que le verrou est affiché, il reste au premier plan : un écran ajouté ensuite (animation d’ouverture du
       Perso, fenêtre d’accueil) est rendu inactif et passe dessous, sinon il capterait les appuis sur le clavier. */
    new MutationObserver(function (list) {
      var el = doc.getElementById("vr16"); if (!el || el.hidden) return;
      list.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1 && n.id !== "vr16" && n.id !== "vr16-cache" && n.id !== "maj18" && n.tagName !== "SCRIPT" && n.tagName !== "STYLE" && !n.hasAttribute("inert")) { n.setAttribute("inert", ""); n.setAttribute("data-vr16", ""); } }); });
      if (doc.body.lastElementChild !== el) doc.body.appendChild(el);
    }).observe(doc.body, { childList: true });
  }
  if (doc.body) start(); else doc.addEventListener('DOMContentLoaded', start);

  window.VerdictVerrou = { lock: function () { lock(false); }, settings: screenSettings, state: function () { return { locked: S.locked, mode: S.mode, configured: configured(), coffre: COFFRE, bio: !!(C && C.bio), fails: (C && C.fails) || 0, wait: waitLeft() }; },
    _hash: hashCode, _derToRaw: derToRaw, _weak: weak, _wipeKeep: function (n) { return /^coffre:|^verdict-coffre/.test(n); } };
})();
