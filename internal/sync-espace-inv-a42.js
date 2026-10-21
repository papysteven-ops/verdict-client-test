/* C141 — Synchronisation de l'Inventaire entre appareils (étape B du plan de mise en ligne).
   L'Inventaire range tout le compte dans un seul état (zones, établissements, fournisseurs, commandes) et possède déjà
   une fusion à trois voies (VerdictInventorySync.reconcile : en cas de conflit sur un même champ, la saisie locale gagne,
   rien n'est perdu). Ce fichier réutilise cette fusion et l'envoie au serveur Verdict (/api/workspace, module
   « inventory »), sans activer le mode compte d'origine de l'Inventaire (qui changerait son interface).
   - Le document Inventaire du compte est rattaché au premier établissement connu du serveur (le même pour tous les
     appareils) ; s'il n'y en a pas encore, à l'établissement de l'appareil, créé au premier envoi.
   - Envoi après chaque enregistrement (2,6 s de regroupement) ; relecture au démarrage, au retour sur l'appli et au
     signal d'un autre appareil (relayé par la coquille).
   - Jamais en démonstration, en inventaire partagé, pour l'équipe, ni tant que le compte n'est pas en ligne. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdSyncEspaceInv) return; w.__vdSyncEspaceInv = true;
  var racine = new URL('../../', location.href).pathname;
  var URL_ESPACE = racine + 'api/workspace', URL_COMPTE = racine + 'api/account', URL_FLUX = racine + 'api/flux';
  var jeton = '', organisation = '', ancre = '', minuteur = 0, envoi = false, actif = false;

  function eva(n) { try { return w.eval(n); } catch (e) { return undefined; } }
  function drapeau(n) { return !!eva('typeof ' + n + '!=="undefined"&&' + n); }
  /* C229 (X23) : le serveur de comptes ne pose VERDICT_WORKSPACE_CONNECTED que dans le cadre Verdict (contrat L4, C215) ; un compte
     connecté (VERDICT_COMPTE.connecte) suffit pour rattacher l'Inventaire au compte, comme le promet W38 (« rien n'est perdu »). */
  function compteEnLigne() { var t = w.top || w; try { return t.VERDICT_ACCOUNT_AUTH_READY === true && (t.VERDICT_WORKSPACE_CONNECTED === true || !!(t.VERDICT_COMPTE && t.VERDICT_COMPTE.connecte === true)); } catch (e) { return false; } }
  function horsJeu() { return drapeau('DEMO') || drapeau('SHARED') || drapeau('STAFF') || drapeau('OWNER_TEAM') || /[?&]demo=1/.test(location.search); }
  function idOk(id) { return /^[A-Za-z0-9._-]{1,120}$/.test(id || '') && id !== 'demo-brasserie' && String(id).indexOf('perso-') !== 0 && String(id).indexOf('demo') !== 0; }
  function DB() { return eva('DB'); }
  function aDesDonnees(d) { try { return Object.keys(d.spaces || {}).some(function (k) { return ((d.spaces[k] || {}).products || []).length > 0; }); } catch (e) { return false; } }

  function requete(url, corps, avecJeton) {
    var h = { 'Content-Type': 'application/json' }; if (avecJeton && jeton) h['X-CSRF-Token'] = jeton;
    return fetch(url, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: h, body: JSON.stringify(corps) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j = j || {}; j.__statut = r.status; return j; }); });
  }
  function ouvrir() {
    return requete(URL_COMPTE, { action: 'me' }).then(function (j) {
      if (!j.authenticated || !j.csrf) throw new Error('compte_non_connecte'); jeton = String(j.csrf);
      return requete(URL_ESPACE, { action: 'bootstrap' });
    }).then(function (j) {
      var ws = j.workspace || {}, org = (ws.organisations || []).filter(function (o) { return o.owner; })[0] || (ws.organisations || [])[0];
      if (!org) throw new Error('organisation_absente'); organisation = org.id;
      var serveur = (org.sites || []).map(function (x) { return x.id; }).filter(idOk);
      var d = DB() || {}, local = (d.siteList || []).filter(idOk);
      ancre = serveur[0] || local[0] || '';
      return { connu: serveur.indexOf(ancre) >= 0, nom: d.sites && d.sites[ancre] && d.sites[ancre].name };
    });
  }

  /* Relire le serveur et fusionner (fusion à trois voies d'origine). */
  function relire() {
    if (!actif || envoi) return Promise.resolve(false);
    return ouvrir().then(function () {
      if (!ancre) return false;
      return requete(URL_ESPACE, { action: 'sync_pull', organisationId: organisation, etabId: ancre, module: 'inventory' }).then(function (j) {
        if (j.__statut !== 200 || !j.data || !j.data.spaces) return false;
        var rev = Number(j.rev) || 0, cloud = Number(eva('CLOUD_REV')) || 0;
        if (rev <= cloud) return false;
        var meta = eva('readSyncMeta(false)') || {}, d = DB();
        /* C229 (X23) : la révision locale (_safety) reste celle de cet appareil, jamais celle de la copie reçue. */
        try { if (d && d._safety && j.data && typeof j.data === 'object') j.data._safety = JSON.parse(JSON.stringify(d._safety)); } catch (e) {}
        var ok = w.applyCloud({ ok: true, data: j.data, rev: rev }, eva('ACCOUNT_ID'), !!(meta.dirty && aDesDonnees(d)));
        if (ok && (eva('readSyncMeta(false)') || {}).dirty) planifier(); /* la fusion a gardé des saisies locales : on les renvoie */
        return ok;
      });
    }).catch(function () { return false; });
  }
  function planifier() { clearTimeout(minuteur); minuteur = setTimeout(envoyer, 2600); }
  function envoyer() {
    if (!actif || envoi) return; envoi = true;
    var donnees = null, rev = 0;
    ouvrir().then(function (info) {
      if (!ancre) throw new Error('sans_etablissement');
      donnees = w.VerdictInventorySync.clone(DB()); rev = Number(eva('CLOUD_REV')) || 0;
      if (info.connu) return;
      return requete(URL_FLUX, { action: 'ensure_establishment', etabId: ancre, name: String(info.nom || 'Établissement').slice(0, 160), organisationId: organisation }, true).then(function (j) { if (!j.ok) throw new Error('etablissement'); });
    }).then(function () {
      var mutation = 'inv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      return requete(URL_ESPACE, { action: 'sync_push', organisationId: organisation, etabId: ancre, module: 'inventory', mutationId: mutation, rev: rev, data: donnees }, true);
    }).then(function (j) {
      envoi = false;
      if (j.ok) {
        eva('CLOUD_REV=' + (Number(j.rev) || rev + 1));
        if (w.VerdictInventorySync.equal(DB(), donnees)) w.markSyncClean(donnees, Number(j.rev) || rev + 1); else planifier();
        try { w.syncBadge('✓ sync', true); } catch (e) {}
        return;
      }
      if (j.__statut === 409) return relire().then(function () { if ((eva('readSyncMeta(false)') || {}).dirty) planifier(); });
      try { w.syncBadge('⚠ hors ligne', false); } catch (e) {}
    }).catch(function () { envoi = false; });
  }

  function demarrer() {
    if (!compteEnLigne() || horsJeu() || typeof w.save !== 'function' || !w.VerdictInventorySync || typeof w.applyCloud !== 'function') return;
    /* La saisie hors connexion est notée « à envoyer » même en accès ouvert (l'original l'ignorait dans ce mode). */
    w.markSyncDirty = function () {
      if (!eva('ACCOUNT_ID') || drapeau('DEMO')) return;
      var m = eva('readSyncMeta(false)'); if (!m) return;
      if (!m.dirty) { m.dirty = true; m.changedAt = new Date().toISOString(); if (!m.baseData) m.baseRev = Number(eva('CLOUD_REV')) || 0; }
      w.writeSyncMeta(m);
    };
    var save0 = w.save;
    w.save = function () { var r = save0.apply(this, arguments); try { if (actif && !horsJeu()) { w.markSyncDirty(); planifier(); } } catch (e) {} return r; };
    ouvrir().then(function () { actif = true; return relire(); }).then(function () {
      var m = eva('readSyncMeta(false)') || {};
      if ((m.dirty || !Number(eva('CLOUD_REV'))) && aDesDonnees(DB())) planifier();
    }).catch(function () {});
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden) relire(); });
    w.addEventListener('message', function (ev) { var d = ev && ev.data; if (d && d.type === 'verdict-sync-donnees' && d.module === 'inventory') setTimeout(relire, 400); });
  }
  if (doc.readyState === 'complete') setTimeout(demarrer, 1800); else w.addEventListener('load', function () { setTimeout(demarrer, 1800); });
  w.VerdictSyncEspaceInv = { relire: relire, envoyer: envoyer, actif: function () { return actif; }, ancre: function () { return ancre; } };
})();
