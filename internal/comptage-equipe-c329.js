/* Verdict® — C329 (L6, vague 16 quater ; T3) : la cloche du patron reçoit « Comptage reçu d’Inès », nominative et datée,
   sans qu'il ait à ouvrir l'Inventaire. Sur le compte réel, l'Inventaire n'est chargé qu'à son ouverture : la cloche ne voyait
   que le dernier état qu'il avait transmis, jamais le comptage arrivé depuis sur le serveur, ni celui d'un autre établissement.
   La coque relit donc, toutes les 90 s et au retour sur l'appli, l'Inventaire de chaque établissement que le patron gère
   (/api/workspace, sync_pull) et pose une alerte par envoi d'un employé (produits signés à son prénom, de moins de 36 h).
   L'identifiant est celui que l'Inventaire produit lui-même (inventory-014) : jamais deux alertes pour le même envoi.
   Jamais en démonstration ; rien n'est écrit sur le serveur. */
(function () {
  'use strict';
  if (window.__verdictComptageEquipeC329) return;
  window.__verdictComptageEquipeC329 = true;
  var DUREE = 36 * 3600000, GROUPE = 3 * 3600000, PAS = 90000, MAX_SITES = 30, running = false, last = 0;

  function deN(by) { return /^[ée]quipe$/i.test(by) ? 'de votre équipe' : (/^[aeiouyhàâäéèêëîïôöùûüœ]/i.test(by) ? 'd’' : 'de ') + by; }
  function quantite(p) {
    if (p.stock == null || p.stock === '') return '';
    var u = String(p.unit || '');
    return String(p.stock).replace('.', ',') + ' ' + (u === 'piece' || u === 'unite' ? (Number(p.stock) > 1 ? 'pièces' : 'pièce') : u === 'l' ? 'L' : u);
  }
  /* Date ISO complète : la cloche (dateLisible) l'écrit en heure locale, dans la langue choisie (« Ven 23/10 · 12:31 »). */
  function quand(ms) { return new Date(ms).toISOString(); }
  /* Envois de l'équipe dans un document d'Inventaire : par prénom, les produits comptés dans les 3 h du dernier (un envoi). */
  function envois(data, now) {
    var patron = String(data && data.profile && data.profile.prenom || '').trim().toLowerCase(), par = {};
    Object.keys(data && data.spaces || {}).forEach(function (z) {
      ((data.spaces[z] || {}).products || []).forEach(function (p) {
        var by = String(p && p.countedBy || '').trim(), at = Date.parse(p && p.countedAt || '');
        if (!by || !isFinite(at) || by.toLowerCase() === patron || now - at > DUREE) return;
        (par[by] = par[by] || []).push({ at: at, p: p });
      });
    });
    return Object.keys(par).map(function (by) {
      var a = par[by].sort(function (x, y) { return x.at - y.at; }), fin = a[a.length - 1].at, g = a.filter(function (x) { return fin - x.at <= GROUPE; });
      return { by: by.slice(0, 80), debut: g[0].at, fin: fin, n: g.length, dernier: g[g.length - 1].p };
    });
  }
  function alerte(site, e) {
    var qn = e.n === 1 ? quantite(e.dernier) : '';
    return { id: 'operation:' + site.id + ':inventory:count-' + e.by + '-' + new Date(e.debut).toISOString().slice(0, 16), source: 'Inventaire', module: 'inventory', level: 'info',
      actorName: e.by, establishmentId: site.id, establishmentName: site.name, title: 'Comptage reçu ' + deN(e.by),
      detail: quand(e.fin) + ' · ' + (qn ? String(e.dernier.name || '').slice(0, 60) + ' : ' + qn : e.n + ' produit' + (e.n > 1 ? 's' : '')),
      proof: 'Comptage transmis et enregistré par le serveur.', createdAt: new Date(e.fin).toISOString(), actionLabel: 'Ouvrir Inventaire' };
  }
  function post(action, body) {
    return fetch(new URL('api/workspace', location.href).pathname, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ action: action }, body || {})) })
      .then(function (r) { if (!r.ok) throw new Error('indisponible'); return r.json(); });
  }
  function gere(org, site) {
    var P = Array.isArray(site.permissions) ? site.permissions : [];
    return !!(site.modules && site.modules.inventory && site.modules.inventory.view) && (org.owner === true || P.indexOf('*') >= 0 || P.indexOf('team.manage') >= 0);
  }
  async function verifier(force) {
    var shell = window.VerdictUnifiedShell, ctx = shell && shell.getContext && shell.getContext(), centre = shell && shell.notifications;
    if (running || document.hidden || !centre || typeof centre.ingestMany !== 'function' || !ctx || ctx.demo) return;
    if (Date.now() - last < (force ? 10000 : PAS)) return;
    running = true; last = Date.now();
    try {
      var w = await post('bootstrap'), orgs = (w && w.workspace && w.workspace.organisations) || [], sites = [];
      orgs.forEach(function (o) { (o.sites || []).forEach(function (s) { if (s && s.id && gere(o, s) && sites.length < MAX_SITES) sites.push({ org: o.id, id: String(s.id), name: String(s.name || '') }); }); });
      var items = [], now = Date.now();
      for (var i = 0; i < sites.length; i++) {
        var r = null; try { r = await post('sync_pull', { organisationId: sites[i].org, etabId: sites[i].id, module: 'inventory' }); } catch (e) { continue; }
        if (!r || !r.data) continue;
        envois(r.data, now).forEach(function (e) { items.push(alerte(sites[i], e)); });
      }
      if (items.length) centre.ingestMany(items);
    } catch (e) {} finally { running = false; }
  }
  window.VerdictComptageEquipe = { envois: envois, alerte: alerte, verifier: verifier };
  setInterval(function () { verifier(false); }, 15000);
  window.addEventListener('focus', function () { verifier(true); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) verifier(true); });
  window.addEventListener('load', function () { setTimeout(function () { verifier(true); }, 3000); });
})();
