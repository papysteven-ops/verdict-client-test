/* C48 — Notifications rangées par établissement (retour de Steven du 15/10).
   1. Ouvrir une notification bascule d'abord sur SON établissement, puis sur le bon module (avant : on restait
      sur l'établissement affiché, la notification ne servait à rien).
   2. Le centre regroupe tout : un filtre par établissement (« Tous · 5 », « Clean Fuel · 2 »…), l'établissement
      affiché en tête de chaque carte, celui en cours d'abord.
   3. Le patron règle chaque établissement : Toutes les notifications / Urgences seulement / Aucune. Les urgences
      (rupture, accès) passent toujours en « Urgences seulement ». Rien n'est supprimé : une notification masquée
      revient si l'on réactive l'établissement ; la pastille ne compte que ce qui est affiché.
   4. Démonstration : en passant d'un modèle de démonstration à un autre, les notifications fictives du modèle
      quitté sont retirées (elles ne s'empilent plus).
   Aucun envoi réseau ; réglages gardés sur l'appareil. */
(function () {
  'use strict';
  if (window.__verdictNotifEtabs) return; window.__verdictNotifEtabs = true;
  var doc = document, PREFS = 'verdict:manager-notifications:v1:etabs', UI = { filter: 'all', settings: false };
  var LEVELS = [['all', 'Toutes'], ['urgent', 'Urgences seulement'], ['none', 'Aucune']];
  function shell() { return window.VerdictUnifiedShell || null; }
  function center() { var s = shell(); return s && s.notifications; }
  /* C54 : réglages gardés aussi dans IndexedDB (le Perso et l'atelier vident localStorage à chaque ouverture). */
  var PREF_CACHE = null;
  function prefsDb(op, val) {
    return new Promise(function (res) {
      try {
        var r = indexedDB.open('verdict-notif-etabs', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('p'); };
        r.onerror = function () { res(null); };
        r.onsuccess = function () { try { var s = r.result.transaction('p', op === 'get' ? 'readonly' : 'readwrite').objectStore('p'), q = op === 'get' ? s.get('prefs') : s.put(val, 'prefs'); q.onsuccess = function () { res(op === 'get' ? q.result || null : true); }; q.onerror = function () { res(null); }; } catch (e) { res(null); } };
      } catch (e) { res(null); }
    });
  }
  function prefs() { if (PREF_CACHE) return JSON.parse(JSON.stringify(PREF_CACHE)); try { return JSON.parse(localStorage.getItem(PREFS) || '{}') || {}; } catch (e) { return {}; } }
  function savePrefs(p) { PREF_CACHE = p; try { localStorage.setItem(PREFS, JSON.stringify(p)); } catch (e) {} prefsDb('put', JSON.stringify(p)); }
  prefsDb('get').then(function (raw) { try { if (raw) { PREF_CACHE = JSON.parse(raw); if (typeof decorate === 'function') decorate(); } } catch (e) {} });
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* Établissements connus : ceux de Pilotage (même règle de correspondance que le pont de contexte). */
  function store() { try { var f = doc.getElementById('frame-verdict'), w = f && f.contentWindow; return w && w.STORE && w.STORE.etabs ? w.STORE : null; } catch (e) { return null; } }
  function etabs() {
    var S = store(), out = [];
    if (S) (Array.isArray(S.ordre) ? S.ordre : Object.keys(S.etabs)).forEach(function (id) {
      var d = S.etabs[id] || {}, link = d.inventoryLink || {}, demo = d._demo || {};
      out.push({ key: id, name: String(d.etab || 'Établissement'), alias: [id, d.establishmentId, link.siteId, demo.establishmentId].filter(Boolean).map(String), demo: !!(d._testFiction || d.exempleCharge || d.presentationProfile), hidden: !!d._barHidden });
    });
    return out;
  }
  function siteOf(item) {
    var id = String(item.establishmentId || ''), nm = norm(item.establishmentName), list = etabs();
    for (var i = 0; i < list.length; i++) if (id && list[i].alias.indexOf(id) >= 0) return list[i];
    for (i = 0; i < list.length; i++) if (nm && norm(list[i].name) === nm) return list[i];
    return { key: id || ('nom:' + nm) || 'autre', name: item.establishmentName || 'Verdict', systeme: !id && !nm, alias: [id], demo: !!item.demo };
  }
  function currentKey() {
    var c = shell() && shell().getContext && shell().getContext(); if (!c) return '';
    var S = store(); if (S && S.actif) return S.actif;
    return String(c.siteId || '');
  }
  function level(key) { return prefs()[key] || 'all'; }
  function shown(item, site) { var l = level(site.key); return l === 'all' || (l === 'urgent' && item.level === 'critical'); }

  /* ───────── Rendu (après celui du centre) ───────── */
  function css() {
    if (doc.getElementById('ne17-css')) return;
    var s = doc.createElement('style'); s.id = 'ne17-css';
    s.textContent =
      '.ne17-bar{display:flex;gap:7px;overflow-x:auto;padding:4px 18px 8px;scrollbar-width:none}.ne17-bar::-webkit-scrollbar{display:none}' +
      '.ne17-chip{flex:none;min-height:36px;padding:0 13px;border-radius:999px;border:1px solid rgba(148,163,184,.35);background:transparent;color:inherit;font:700 13px/1 inherit;cursor:pointer;white-space:nowrap}' +
      '.ne17-chip[aria-pressed=true]{background:#22c55e;border-color:#22c55e;color:#04150b}.ne17-chip b{margin-left:5px}' +
      '.ne17-etab{display:inline-flex;align-items:center;gap:6px;margin:0 0 6px;padding:3px 9px;border-radius:999px;background:rgba(96,165,250,.14);color:#60a5fa;font:800 11px/1.3 inherit;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.ne17-etab.cur{background:rgba(34,197,94,.15);color:#16a34a}' +
      '.ne17-hidden{display:none!important}.ne17-note{margin:0 18px 8px;font-size:12.5px;opacity:.75}' +
      '.ne17-set{margin:0 18px 10px;padding:12px 14px;border:1px solid rgba(148,163,184,.3);border-radius:16px}' +
      '.ne17-set h3{margin:0 0 4px;font-size:15px}.ne17-set p{margin:0 0 8px;font-size:12.5px;opacity:.75}' +
      '.ne17-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid rgba(148,163,184,.18);font-size:14px}' +
      '.ne17-row select{min-height:36px;border-radius:10px;font:600 13px/1 inherit;padding:0 6px}' +
      '.ne17-all{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 6px}.ne17-all span{font-size:12.5px;opacity:.75}.ne17-back{border-color:#22c55e!important}';
    doc.head.appendChild(s);
  }
  var busy = false;
  function decorate() {
    var c = center(), list = doc.getElementById('notification-list'); if (!c || !list || busy) return;
    busy = true; css();
    try {
      var items = c.getItems(), byId = {}, cur = currentKey(), groups = {}, order = [], visibleUnread = 0, masked = 0;
      items.forEach(function (it) {
        var site = siteOf(it); byId[it.id] = { item: it, site: site };
        if (!groups[site.key]) { groups[site.key] = { site: site, unread: 0, total: 0 }; order.push(site.key); }
        if (shown(it, site)) { groups[site.key].total++; if (!it.readAt) { groups[site.key].unread++; visibleUnread++; } } else masked++;
      });
      order.sort(function (a, b) { return (b === cur) - (a === cur) || groups[b].unread - groups[a].unread; });
      if (UI.filter !== 'all' && !groups[UI.filter]) UI.filter = 'all';
      [].forEach.call(list.querySelectorAll('.notification-item'), function (card) {
        var e = byId[card.dataset.notificationId]; if (!e) return;
        var ok = shown(e.item, e.site) && (UI.filter === 'all' || UI.filter === e.site.key);
        card.classList.toggle('ne17-hidden', !ok);
        if (!card.querySelector('.ne17-etab') && !e.site.systeme) {
          var tag = doc.createElement('div'); tag.className = 'ne17-etab' + (e.site.key === cur ? ' cur' : '');
          tag.textContent = (e.site.key === cur ? '● ' : '🏢 ') + e.site.name + (e.site.key === cur ? ' · affiché' : '');
          card.insertBefore(tag, card.firstChild);
        }
      });
      /* Barre de filtres (dès deux établissements) et réglages. */
      var sheet = doc.getElementById('notification-sheet'), tools = sheet && sheet.querySelector('.notification-tools');
      var bar = doc.getElementById('ne17-bar');
      if (!bar && tools) { bar = doc.createElement('div'); bar.id = 'ne17-bar'; bar.className = 'ne17-bar'; tools.parentNode.insertBefore(bar, tools.nextSibling); }
      /* C53 : les réglages sont un écran à part — la liste se cache, un bouton « Retour » ramène aux notifications. */
      list.classList.toggle('ne17-hidden', UI.settings);
      var emptyEl = doc.getElementById('notification-empty'); if (emptyEl) emptyEl.classList.toggle('ne17-hidden', UI.settings);
      if (bar && UI.settings) {
        var back = '<button type="button" class="ne17-chip ne17-back" data-settings aria-pressed="false">← Retour aux notifications</button>';
        if (bar.innerHTML !== back) bar.innerHTML = back;
      } else if (bar) {
        var chips = '<button type="button" class="ne17-chip" data-f="all" aria-pressed="' + (UI.filter === 'all') + '">Tous<b>' + visibleUnread + '</b></button>' +
          (order.length > 1 ? order.map(function (k) { var g = groups[k]; return '<button type="button" class="ne17-chip" data-f="' + esc(k) + '" aria-pressed="' + (UI.filter === k) + '">' + (k === cur ? '● ' : '') + esc(g.site.name) + '<b>' + g.unread + '</b></button>'; }).join('') : '') +
          '<button type="button" class="ne17-chip" data-settings aria-pressed="' + UI.settings + '">⚙ Réglages</button>';
        if (bar.innerHTML !== chips) bar.innerHTML = chips;
      }
      var note = doc.getElementById('ne17-note');
      if (!note && bar) { note = doc.createElement('p'); note.id = 'ne17-note'; note.className = 'ne17-note'; bar.parentNode.insertBefore(note, bar.nextSibling); }
      if (note) { note.textContent = masked ? masked + ' notification' + (masked > 1 ? 's' : '') + ' masquée' + (masked > 1 ? 's' : '') + ' par vos réglages.' : ''; note.hidden = !masked; }
      renderSettings(note || bar);
      /* La pastille et le résumé ne comptent que ce qui est affiché. */
      var badge = doc.getElementById('notification-badge'), btn = doc.getElementById('notification-button'), sum = doc.getElementById('notification-summary');
      if (badge) { badge.textContent = visibleUnread > 99 ? '99+' : String(visibleUnread); badge.hidden = visibleUnread === 0; }
      if (btn) { btn.classList.toggle('has-notifications', visibleUnread > 0); btn.setAttribute('aria-label', visibleUnread ? 'Notifications : ' + visibleUnread + ' non lue' + (visibleUnread > 1 ? 's' : '') : 'Notifications : aucune en attente'); }
      if (sum) sum.textContent = visibleUnread ? visibleUnread + ' notification' + (visibleUnread > 1 ? 's' : '') + ' à traiter' + (order.length > 1 ? ' · ' + order.length + ' établissements' : '') : 'Tout est lu';
      try { if (navigator.setAppBadge) { if (visibleUnread) navigator.setAppBadge(visibleUnread); else if (navigator.clearAppBadge) navigator.clearAppBadge(); } } catch (e) {}
    } finally { busy = false; }
  }
  function renderSettings(after) {
    var box = doc.getElementById('ne17-set');
    if (!UI.settings) { if (box) box.remove(); return; }
    if (!box && after) { box = doc.createElement('section'); box.id = 'ne17-set'; box.className = 'ne17-set'; after.parentNode.insertBefore(box, after.nextSibling); }
    if (!box) return;
    var list = etabs(), p = prefs(), seen = {};
    (center() ? center().getItems() : []).forEach(function (it) { var s = siteOf(it); if (!list.some(function (e) { return e.key === s.key; }) && !seen[s.key]) { seen[s.key] = 1; list.push(s); } });
    var html = '<h3>Notifications par établissement</h3><p>« Urgences seulement » laisse passer les ruptures et les alertes d’accès. Rien n’est effacé : réactivez un établissement pour revoir ses notifications.</p>' +
      '<div class="ne17-all"><span>Pour tous :</span>' + LEVELS.map(function (l) { return '<button type="button" class="ne17-chip" data-all="' + l[0] + '">' + l[1] + '</button>'; }).join('') + '</div>' +
      list.map(function (e) { return '<label class="ne17-row"><span>' + esc(e.name) + (e.demo ? ' <small style="opacity:.6">démonstration</small>' : '') + '</span><select data-site="' + esc(e.key) + '">' + LEVELS.map(function (l) { return '<option value="' + l[0] + '"' + ((p[e.key] || 'all') === l[0] ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select></label>'; }).join('');
    if (box.getAttribute('data-html') !== html) { box.innerHTML = html; box.setAttribute('data-html', html); }
  }

  /* ───────── Actions ───────── */
  doc.addEventListener('change', function (e) {
    var s = e.target.closest && e.target.closest('#ne17-set select[data-site]'); if (!s) return;
    var p = prefs(); if (s.value === 'all') delete p[s.getAttribute('data-site')]; else p[s.getAttribute('data-site')] = s.value; savePrefs(p); decorate();
  });
  doc.addEventListener('click', function (e) {
    var chip = e.target.closest && e.target.closest('#ne17-bar .ne17-chip');
    if (chip) { if (chip.hasAttribute('data-settings')) UI.settings = !UI.settings; else UI.filter = chip.getAttribute('data-f'); decorate(); var top = doc.getElementById('notification-sheet'); if (top) top.scrollTop = 0; return; }
    /* Tout régler d'un coup (beaucoup d'établissements), puis choisir ceux à garder un par un. */
    var bulk = e.target.closest && e.target.closest('#ne17-set [data-all]');
    if (bulk) {
      var v = bulk.getAttribute('data-all'), p = {};
      if (v !== 'all') [].forEach.call(doc.querySelectorAll('#ne17-set select[data-site]'), function (s) { p[s.getAttribute('data-site')] = v; });
      savePrefs(p); decorate(); return;
    }
    /* Ouvrir une notification : d'abord SON établissement (capture, avant l'ouverture du module). */
    var card = e.target.closest && e.target.closest('#notification-list .notification-item'); if (!card) return;
    if (e.target.closest('.notification-delete,.notification-secondary,summary,details')) return;
    var c = center(); if (!c) return;
    var it = c.getItems().filter(function (x) { return x.id === card.dataset.notificationId; })[0]; if (!it) return;
    switchTo(it);
  }, true);
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var card = e.target.closest && e.target.closest('#notification-list .notification-item'); if (!card || e.target !== card) return;
    var c = center(), it = c && c.getItems().filter(function (x) { return x.id === card.dataset.notificationId; })[0]; if (it) switchTo(it);
  }, true);
  function switchTo(it) {
    var site = siteOf(it), S = store(), sh = shell(), ctx = sh && sh.getContext && sh.getContext();
    if (!site || site.key === currentKey()) return;
    /* Pilotage : changement direct d'établissement (même effet que la barre d'établissements). */
    try { var w = doc.getElementById('frame-verdict').contentWindow; if (S && S.etabs[site.key] && typeof w.switchEtab === 'function') w.switchEtab(site.key); } catch (e) {}
    /* Inventaire : même contexte que lorsque Pilotage change d'établissement. */
    var context = { siteId: it.establishmentId || site.key, name: site.name, demo: !!it.demo, accountScope: ctx && ctx.accountScope || '' };
    ['frame-verdict', 'frame-inventory'].forEach(function (id) { try { var f = doc.getElementById(id); if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'verdict-unified-apply-context', context: context }, location.origin); } catch (e) {} });
  }

  /* Démonstration : un seul modèle fictif à la fois dans le centre. */
  var lastDemo = '';
  function purgeDemo() {
    var sh = shell(), ctx = sh && sh.getContext && sh.getContext(), c = center(); if (!ctx || !c) return;
    var key = ctx.demo ? String(ctx.siteId || '') + '|' + String(ctx.name || '') : '';
    if (key === lastDemo) return; var prev = lastDemo; lastDemo = key; if (!prev) return;
    var cur = currentKey();
    c.getItems().forEach(function (it) { if (it.demo && siteOf(it).key !== cur && String(it.establishmentId || '') !== String(ctx.siteId || '')) c.remove(it.id); });
  }

  function start() {
    var list = doc.getElementById('notification-list'); if (!list || !center()) return setTimeout(start, 400);
    new MutationObserver(function () { decorate(); }).observe(list, { childList: true });
    var ctxEl = doc.getElementById('unified-context'); if (ctxEl) new MutationObserver(function () { purgeDemo(); decorate(); }).observe(ctxEl, { childList: true, characterData: true, subtree: true });
    var btn = doc.getElementById('notification-button'); if (btn) btn.addEventListener('click', function () { setTimeout(decorate, 0); });
    window.addEventListener('storage', function (e) { if (e.key === PREFS) decorate(); });
    purgeDemo(); decorate();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
  window.VerdictNotifEtabs = { decorate: decorate, siteOf: siteOf, level: level, prefs: prefs, _shown: shown };
})();
