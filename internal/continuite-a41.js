/* C140 — Continuité comme Spotify (Steven, 17/10 : « reprendre sur PC exactement où on était, et reprendre le contrôle,
   vice versa »). Chargé dans la coquille (index.html), 3 éditions.
   - Position : chaque appareil relève où il en est (module, vue, chapitre de l'Accueil, établissement, défilement).
   - Reprise : à l'ouverture ou au retour sur un appareil, si un autre appareil du même compte était plus récent, un
     bandeau propose « Reprendre là où vous étiez sur iPhone · Accueil › Mois ».
   - Contrôle : « Mes appareils » liste les appareils en ligne ; « Ouvrir ici » reprend leur écran, « Envoyer cet écran »
     ouvre l'écran courant sur l'autre appareil (comme Spotify Connect).
   Le transport passe par le serveur Verdict (/api/continuite). Tant que le compte n'est pas en ligne
   (VERDICT_WORKSPACE_CONNECTED / VERDICT_ACCOUNT_AUTH_READY à false), rien ne s'affiche et rien n'est envoyé.
   Ce qui circule : des noms d'écrans, un numéro d'établissement opaque et une position de défilement — jamais de
   chiffres, de noms de plats ni de données personnelles. Les données elles-mêmes se synchronisent par l'espace de
   travail du compte. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdContinuite || w.top !== w) return; w.__vdContinuite = true;
  var API = new URL('api/continuite', new URL('./', location.href)).pathname;
  var CLE_ID = 'verdict:continuite:appareil:v1', CLE_CHAP = 'verdict:accueil:chapitre:v1', CLE_IGN = 'verdict:continuite:ignore:v1';
  var FRAIS_MS = 30 * 60 * 1000; /* une position de plus de 30 min n'est plus proposée */
  var NOMS = { pilotage: 'Pilotage', carte: 'Carte', inventory: 'Inventaire' };
  var VUES = { pil: 'Accueil', priorities: 'Priorités', audit: 'Audit', carte: 'Carte', data: 'Structure', dec: 'Simuler', plus: 'Plus', ca: 'Chiffre d’affaires', planning: 'Planning', sal: 'Salaires', obj: 'Objectifs', sante: 'Santé', alertes: 'Alertes', org: 'Organisation', hist: 'Historique', in: 'Entrées', aide: 'Aide', abo: 'Abonnement', count: 'Comptage', prod: 'Produits', stats: 'Analyse', order: 'Commandes' };
  var CHAPS = { jour: 'Jour', mois: 'Mois', annee: 'Année', argent: 'Argent' };

  function lire(k, s) { try { return (s || w.localStorage).getItem(k); } catch (e) { return null; } }
  function ecrire(k, v, s) { try { (s || w.localStorage).setItem(k, v); } catch (e) {} }
  function actif() { return w.VERDICT_WORKSPACE_CONNECTED === true && w.VERDICT_ACCOUNT_AUTH_READY === true && !demo(); }
  function demo() { try { var c = w.VerdictUnifiedShell && w.VerdictUnifiedShell.getContext(); return !!(c && c.demo) || /[?&]demo=1/.test(location.search); } catch (e) { return false; } }

  /* Identité de l'appareil : un identifiant aléatoire local et un nom lisible (« iPhone », « iPad », « Mac », « PC »). */
  function appareil() {
    var id = lire(CLE_ID);
    if (!/^[a-z0-9]{16,40}$/.test(id || '')) { id = ''; var a = new Uint8Array(12); (w.crypto || w.msCrypto).getRandomValues(a); for (var i = 0; i < a.length; i++) id += ('0' + a[i].toString(16)).slice(-2); ecrire(CLE_ID, id); }
    var ua = navigator.userAgent || '', tactile = navigator.maxTouchPoints > 1;
    var nom = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) || (/Macintosh/.test(ua) && tactile) ? 'iPad' : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Téléphone Android' : 'Tablette Android') : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'PC' : 'Ordinateur';
    var type = /iPhone|Téléphone/.test(nom) ? 'telephone' : /iPad|Tablette/.test(nom) ? 'tablette' : 'ordinateur';
    return { id: id, nom: nom, type: type };
  }

  /* ---------- Relever la position ---------- */
  function cadreActif() {
    var p = doc.querySelector('.module-panel.active iframe'); return p || doc.getElementById('frame-verdict');
  }
  function position() {
    var sh = w.VerdictUnifiedShell, module = 'pilotage', ctx = null;
    try { module = sh.getActiveModule() || 'pilotage'; ctx = sh.getContext(); } catch (e) {}
    var f = cadreActif(), cw = null, cd = null; try { cw = f && f.contentWindow; cd = cw && cw.document; } catch (e) {}
    var vue = '', defil = 0, chapitre = '';
    if (cd) {
      var on = cd.querySelector('.view.on'); vue = on && on.id ? on.id.replace(/^v-/, '') : '';
      defil = Math.max(0, Math.round(cw.scrollY || 0));
    }
    chapitre = vue === 'pil' ? lire(CLE_CHAP, w.sessionStorage) || 'jour' : '';
    var etab = ctx && (ctx.siteId || ctx.id) ? String(ctx.siteId || ctx.id).slice(0, 80) : '';
    return { module: String(module).slice(0, 20), vue: vue.slice(0, 20), chapitre: CHAPS[chapitre] ? chapitre : '', etablissement: etab, defil: Math.min(defil, 200000), ts: Date.now() };
  }
  function libelle(p) {
    if (!p) return '';
    var t = [NOMS[p.module] || 'Verdict'];
    if (p.vue && VUES[p.vue] && VUES[p.vue] !== t[0]) t.push(VUES[p.vue]);
    if (p.vue === 'pil' && CHAPS[p.chapitre]) t.push(CHAPS[p.chapitre]);
    return t.join(' › ');
  }
  function depuis(ts) {
    var s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    return s < 45 ? 'à l’instant' : s < 3600 ? 'il y a ' + Math.round(s / 60) + ' min' : 'il y a ' + Math.round(s / 3600) + ' h';
  }

  /* ---------- Rétablir une position ---------- */
  function appliquer(p) {
    if (!p || !p.module) return false;
    var sh = w.VerdictUnifiedShell; if (!sh) return false;
    if (p.vue === 'pil' && CHAPS[p.chapitre]) ecrire(CLE_CHAP, p.chapitre, w.sessionStorage);
    try { if (sh.getActiveModule() !== p.module) sh.activateModule(p.module, {}); } catch (e) {}
    var essais = 0, voulu = p.module === 'inventory' ? 'frame-inventory' : 'frame-verdict';
    (function tenter() {
      var f = cadreActif(), cw = null; try { cw = f && f.id === voulu && f.contentWindow; } catch (e) {}
      if (!cw || typeof cw.go !== 'function' || cw.document.getElementById('splash')) { if (essais++ < 60) setTimeout(tenter, 250); return; }
      try { if (p.vue && cw.document.getElementById('v-' + p.vue)) cw.go(p.vue); } catch (e) {}
      /* L'Accueil range ses modules en chapitres (C132) : il relit le chapitre demandé. */
      try { var fr = cw.document.querySelector('iframe.p41-ecran'); var b = fr && fr.contentDocument.querySelector('.vx40-nav button[data-k="' + p.chapitre + '"]'); if (b) b.click(); } catch (e) {}
      setTimeout(function () { try { cw.scrollTo({ top: p.defil || 0, behavior: 'auto' }); } catch (e) {} }, 700);
    })();
    return true;
  }

  /* ---------- Interface : bandeau de reprise et « Mes appareils » ---------- */
  function css() {
    if (doc.getElementById('vx41-css')) return;
    var s = doc.createElement('style'); s.id = 'vx41-css';
    s.textContent =
      '#vx41{position:fixed;left:50%;bottom:calc(104px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147482000;display:flex;align-items:center;gap:12px;width:min(520px,calc(100% - 24px));padding:12px 12px 12px 14px;border-radius:18px;background:#111827;color:#fff;box-shadow:0 14px 40px rgba(0,0,0,.35);font:600 14px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;animation:vx41In .28s cubic-bezier(.22,1,.36,1)}' +
      'html.vd-workspace-dark #vx41{background:#fff;color:#0b1220}' +
      '#vx41 .ic{flex:0 0 36px;height:36px;border-radius:12px;display:grid;place-items:center;background:rgba(34,197,94,.18);font-size:18px}' +
      '#vx41 span{flex:1;min-width:0}#vx41 b{display:block;font-size:15px}#vx41 small{display:block;opacity:.75;font-weight:500}' +
      '#vx41 button{appearance:none;border:0;border-radius:12px;min-height:44px;padding:0 14px;font:inherit;font-weight:800;cursor:pointer}' +
      '#vx41 .go{background:#22c55e;color:#06210f}#vx41 .x{background:transparent;color:inherit;opacity:.7;padding:0 10px;font-size:18px}' +
      '#vx41-btn{position:relative}#vx41-btn[hidden]{display:none!important}#vx41-btn i{font-style:normal;font-size:18px;line-height:1}#vx41-btn b{position:absolute;top:2px;right:2px;min-width:16px;height:16px;border-radius:8px;background:#22c55e;color:#06210f;font-size:10px;line-height:16px;text-align:center}' +
      '#vx41-feuille{position:fixed;inset:auto 0 0 0;z-index:2147482500;margin:0 auto;width:min(560px,100%);max-height:70vh;overflow:auto;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));border-radius:22px 22px 0 0;background:#fff;color:#0b1220;box-shadow:0 -14px 40px rgba(0,0,0,.3);font:500 14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}' +
      'html.vd-workspace-dark #vx41-feuille{background:#111827;color:#f3f5f7}' +
      '#vx41-feuille h2{margin:0 0 4px;font-size:18px}#vx41-feuille p.s{margin:0 0 12px;opacity:.7}' +
      '#vx41-feuille .ap{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;align-items:center;padding:12px 0;border-top:1px solid rgba(148,163,184,.25)}#vx41-feuille .ap .ic{grid-row:1/span 2;font-size:22px}' +
      '#vx41-feuille .ap small{opacity:.7}#vx41-feuille .act{grid-column:2;display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}' +
      '#vx41-feuille button{appearance:none;border:1px solid rgba(148,163,184,.5);background:transparent;color:inherit;border-radius:12px;min-height:44px;padding:0 14px;font:inherit;font-weight:700;cursor:pointer}' +
      '#vx41-feuille button.pr{background:#111827!important;color:#fff!important;border-color:#111827!important}html.vd-workspace-dark #vx41-feuille button.pr{background:#fff!important;color:#0b1220!important;border-color:#fff!important}' +
      '#vx41-voile{position:fixed;inset:0;z-index:2147482400;background:rgba(0,0,0,.35)}' +
      '@keyframes vx41In{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}' +
      '@media (prefers-reduced-motion:reduce){#vx41{animation:none}}';
    (doc.head || doc.documentElement).appendChild(s);
  }
  function fermerBandeau() { var b = doc.getElementById('vx41'); if (b) b.remove(); }
  function bandeau(autre, texte, action, libAction) {
    css(); fermerBandeau();
    var b = doc.createElement('div'); b.id = 'vx41'; b.setAttribute('role', 'status');
    var ic = autre.type === 'telephone' ? '📱' : autre.type === 'tablette' ? '📲' : '💻';
    b.innerHTML = '<div class="ic" aria-hidden="true">' + ic + '</div><span><b></b><small></small></span><button type="button" class="go"></button><button type="button" class="x" aria-label="Fermer">×</button>';
    b.querySelector('b').textContent = texte[0]; b.querySelector('small').textContent = texte[1];
    b.querySelector('.go').textContent = libAction;
    b.querySelector('.go').onclick = function () { fermerBandeau(); action(); };
    b.querySelector('.x').onclick = function () { fermerBandeau(); ecrire(CLE_IGN, String(autre.position && autre.position.ts || Date.now()), w.sessionStorage); };
    doc.body.appendChild(b);
    setTimeout(function () { if (b.isConnected) b.remove(); }, 20000);
  }

  /* ---------- Transport (serveur Verdict) ---------- */
  var moi = null, derniere = '', minuteur = 0, flux = null, sondage = 0, appareils = [], proposeA = 0;
  /* Jeton anti-falsification de la session (donné par /api/account « me »), redemandé une fois s'il a changé. */
  var COMPTE = new URL('api/account', new URL('./', location.href)).pathname, jeton = '';
  function obtenirJeton() {
    return fetch(COMPTE, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: '{"action":"me"}' })
      .then(function (r) { return r.json(); }).then(function (j) { jeton = j && j.authenticated && j.csrf ? String(j.csrf) : ''; if (!jeton) throw new Error('compte_non_connecte'); return jeton; });
  }
  function api(action, corps, deja) {
    var envoi = function () {
      return fetch(API, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': jeton }, body: JSON.stringify(Object.assign({ action: action, appareil: { id: moi.id, nom: moi.nom, type: moi.type } }, corps || {})) })
        .then(function (r) { if (r.status === 403 && !deja) { jeton = ''; return api(action, corps, true); } if (!r.ok) throw new Error('continuite_' + r.status); return r.json(); });
    };
    return jeton ? envoi() : obtenirJeton().then(envoi);
  }
  function publier(force) {
    if (!actif() || doc.hidden) return;
    var p = position(), cle = JSON.stringify([p.module, p.vue, p.chapitre, p.etablissement, Math.round(p.defil / 200)]);
    if (!force && cle === derniere) return; derniere = cle;
    api('publier', { position: p }).then(recevoir).catch(function () {});
  }
  function publierBientot() { clearTimeout(minuteur); minuteur = setTimeout(function () { publier(false); }, 1500); }
  function recevoir(r) {
    if (!r || !Array.isArray(r.appareils)) return;
    appareils = r.appareils.filter(function (a) { return a && a.id !== moi.id; });
    bouton();
    /* Une commande « ouvrir » envoyée par un autre appareil (Spotify Connect). */
    var commande = false;
    (r.commandes || []).forEach(function (c) {
      if (!c || c.type !== 'ouvrir' || !c.position) return;
      commande = true; moi.derniereAction = Date.now(); proposeA = c.position.ts;
      appliquer(c.position);
      bandeau(c.de || { type: 'ordinateur' }, ['Ouvert depuis ' + ((c.de && c.de.nom) || 'un autre appareil'), libelle(c.position)], function () {}, 'OK');
    });
    if (!commande) proposer();
  }
  /* Bandeau de reprise : l'appareil le plus récent, s'il est plus récent que ma dernière action ici. */
  function proposer() {
    var ici = position(), ign = +lire(CLE_IGN, w.sessionStorage) || 0;
    var cand = appareils.filter(function (a) { return a.position && a.position.ts > Date.now() - FRAIS_MS && a.position.ts > (moi.derniereAction || 0) && a.position.ts > ign; })
      .sort(function (a, b) { return b.position.ts - a.position.ts; })[0];
    if (!cand || cand.position.ts === proposeA) return;
    var memeEcran = cand.position.module === ici.module && cand.position.vue === ici.vue && cand.position.chapitre === ici.chapitre;
    if (memeEcran && Math.abs((cand.position.defil || 0) - ici.defil) < 300) return;
    proposeA = cand.position.ts;
    bandeau(cand, ['Reprendre là où vous étiez sur ' + cand.nom, libelle(cand.position) + ' · ' + depuis(cand.position.ts)], function () { appliquer(cand.position); moi.derniereAction = Date.now(); setTimeout(function () { publier(true); }, 1500); }, 'Reprendre');
  }
  /* Temps réel : flux d'événements du serveur si disponible, sinon interrogation toutes les 5 s quand l'appli est visible. */
  function ecouter() {
    if (!actif()) return;
    if ('EventSource' in w && !flux) {
      try {
        flux = new EventSource(API + '/flux?appareil=' + encodeURIComponent(moi.id) + '&nom=' + encodeURIComponent(moi.nom) + '&type=' + encodeURIComponent(moi.type), { withCredentials: true });
        flux.onmessage = function (e) { try { recevoir(JSON.parse(e.data)); } catch (x) {} };
        flux.onerror = function () { try { flux.close(); } catch (x) {} flux = null; sonder(); };
        return;
      } catch (e) { flux = null; }
    }
    sonder();
  }
  function sonder() { clearInterval(sondage); sondage = setInterval(function () { if (!doc.hidden && actif()) api('lire').then(recevoir).catch(function () {}); }, 5000); }

  /* ---------- « Mes appareils » : le bouton de l'en-tête (comme l'icône appareils de Spotify) ---------- */
  function icone(t) { return t === 'telephone' ? '📱' : t === 'tablette' ? '📲' : '💻'; }
  function bouton() {
    var b = doc.getElementById('vx41-btn');
    if (!b) {
      var cloche = doc.getElementById('notification-button'); if (!cloche || !cloche.parentNode) return null;
      css(); b = doc.createElement('button'); b.id = 'vx41-btn'; b.type = 'button'; b.className = cloche.className; b.hidden = true;
      b.setAttribute('aria-haspopup', 'dialog'); b.innerHTML = '<i aria-hidden="true">⇄</i><b></b>';
      b.onclick = ouvrirFeuille; cloche.parentNode.insertBefore(b, cloche);
    }
    var n = appareils.length; b.hidden = !actif() || !n; b.querySelector('b').textContent = n ? String(n) : '';
    b.setAttribute('aria-label', n ? 'Mes appareils : ' + n + ' autre' + (n > 1 ? 's' : '') + ' appareil' + (n > 1 ? 's' : '') : 'Mes appareils');
    return b;
  }
  function fermerFeuille() { ['vx41-feuille', 'vx41-voile'].forEach(function (id) { var e = doc.getElementById(id); if (e) e.remove(); }); }
  function ouvrirFeuille() {
    css(); fermerFeuille();
    var v = doc.createElement('div'); v.id = 'vx41-voile'; v.onclick = fermerFeuille;
    var f = doc.createElement('section'); f.id = 'vx41-feuille'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', 'Mes appareils');
    f.innerHTML = '<h2>Mes appareils</h2><p class="s"></p>';
    f.querySelector('.s').textContent = 'Ici : ' + moi.nom + ' · ' + libelle(position());
    appareils.forEach(function (a) {
      var l = doc.createElement('div'); l.className = 'ap';
      l.innerHTML = '<span class="ic" aria-hidden="true"></span><b></b><small></small><div class="act"><button type="button" class="pr ici">Ouvrir ici</button><button type="button" class="la">Envoyer cet écran</button></div>';
      l.querySelector('.ic').textContent = icone(a.type); l.querySelector('b').textContent = a.nom + (a.enLigne ? ' · en ligne' : '');
      l.querySelector('small').textContent = a.position ? libelle(a.position) + ' · ' + depuis(a.position.ts) : 'Pas encore d’écran partagé';
      var ici = l.querySelector('.ici'); ici.disabled = !a.position;
      var sombre = doc.documentElement.classList.contains('vd-workspace-dark');
      ici.style.setProperty('background', sombre ? '#ffffff' : '#111827', 'important'); ici.style.setProperty('color', sombre ? '#0b1220' : '#ffffff', 'important'); ici.style.setProperty('border-color', sombre ? '#ffffff' : '#111827', 'important'); ici.onclick = function () { fermerFeuille(); appliquer(a.position); moi.derniereAction = Date.now(); setTimeout(function () { publier(true); }, 1500); };
      l.querySelector('.la').onclick = function () { var bt = this; bt.disabled = true; envoyer(a.id).then(function () { bt.textContent = 'Envoyé ✓'; setTimeout(fermerFeuille, 900); }, function () { bt.disabled = false; bt.textContent = 'Réessayer'; }); };
      f.appendChild(l);
    });
    var x = doc.createElement('button'); x.type = 'button'; x.textContent = 'Fermer'; x.style.marginTop = '8px'; x.onclick = fermerFeuille; f.appendChild(x);
    doc.body.appendChild(v); doc.body.appendChild(f);
  }

  /* « Envoyer cet écran » vers un appareil (appelé par le menu « Mes appareils »). */
  function envoyer(cibleId) { if (!actif()) return Promise.reject(new Error('compte_hors_ligne')); return api('commander', { cible: String(cibleId), commande: { type: 'ouvrir', position: position() } }); }

  function demarrer() {
    moi = appareil(); moi.derniereAction = 0;
    if (!actif()) return; /* compte pas encore en ligne : rien n'est envoyé ni affiché */
    ['click', 'keydown', 'touchend'].forEach(function (n) { doc.addEventListener(n, function () { moi.derniereAction = Date.now(); publierBientot(); }, { capture: true, passive: true }); });
    w.addEventListener('message', function () { publierBientot(); });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) publier(true); else api('lire').then(recevoir).catch(function () {}); });
    setInterval(function () { publier(false); }, 10000);
    api('lire').then(recevoir).catch(function () {}); ecouter();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { setTimeout(demarrer, 1200); }); else setTimeout(demarrer, 1200);

  w.VerdictContinuite = { position: position, appliquer: appliquer, libelle: libelle, appareil: appareil, actif: actif, envoyer: envoyer, appareils: function () { return appareils.slice(); }, publier: publier };
})();
