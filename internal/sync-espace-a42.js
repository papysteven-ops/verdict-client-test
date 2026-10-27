/* C141 — Synchronisation des données entre appareils (étape B du plan de mise en ligne ; Steven, 17/10 : « branche la
   synchronisation des données et teste-la sur le banc local avec deux appareils »).
   Pilotage et Carte avaient déjà leur synchronisation complète (envoi après chaque enregistrement, conflit « version
   du compte / données de cet appareil », copie de sécurité avant d'écraser), écrite pour une ancienne adresse
   (data-api.php) jamais mise en ligne. Ce fichier garde ce mécanisme et remplace seulement sa porte de sortie : il
   parle au serveur Verdict (/api/workspace), un document chiffré par établissement (module « pilotage », qui
   contient aussi la Carte : plats et ingrédients).
   - Un établissement inconnu du serveur y est créé à son premier envoi (/api/flux « ensure_establishment »).
   - Seuls les établissements modifiés partent (empreinte de la dernière version synchronisée).
   - En direct : le serveur prévient les autres appareils (signal relayé par la coquille) ; ils relisent seuls s'ils
     n'ont rien modifié depuis leur dernière synchronisation, sinon le choix habituel leur est proposé.
   - Jamais en démonstration, en présentation, ni pour un établissement fictif ou Perso.
   - Éteint tant que le compte n'est pas en ligne (VERDICT_WORKSPACE_CONNECTED / VERDICT_ACCOUNT_AUTH_READY). */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdSyncEspace) return; w.__vdSyncEspace = true;
  var racine = new URL('../../', location.href).pathname;
  var URL_ESPACE = racine + 'api/workspace', URL_COMPTE = racine + 'api/account', URL_FLUX = racine + 'api/flux';
  var jeton = '', organisation = '', etat = { revs: {}, empreintes: {} }, actifSync = false, tirageEnCours = false;

  function eva(n) { try { return w.eval(n); } catch (e) { return undefined; } }
  function demoOuTest() { return !!(eva('typeof VERDICT_DEMO_SESSION!=="undefined"&&VERDICT_DEMO_SESSION') || eva('typeof VERDICT_PRESENTATION_PROFILE!=="undefined"&&VERDICT_PRESENTATION_PROFILE') || eva('typeof VERDICT_TEST_SESSION!=="undefined"&&VERDICT_TEST_SESSION')); }
  function compteEnLigne() { var t = w.top || w; try { return (t.VERDICT_WORKSPACE_CONNECTED === true || w.VERDICT_WORKSPACE_CONNECTED === true) && (t.VERDICT_ACCOUNT_AUTH_READY === true || w.VERDICT_ACCOUNT_AUTH_READY === true); } catch (e) { return w.VERDICT_WORKSPACE_CONNECTED === true && w.VERDICT_ACCOUNT_AUTH_READY === true; } }
  function store() { return eva('STORE'); }
  function cleEtat() { return 'verdict:sync-espace:v1:' + String(eva('typeof VERDICT_STORAGE_SCOPE!=="undefined"?VERDICT_STORAGE_SCOPE:"guest"') || 'guest'); }
  function lireEtat() { try { var o = JSON.parse(localStorage.getItem(cleEtat()) || 'null'); if (o && o.revs && o.empreintes) etat = o; } catch (e) {} }
  function ecrireEtat() { try { localStorage.setItem(cleEtat(), JSON.stringify(etat)); } catch (e) {} }
  function empreinte(texte) { var h = 2166136261; for (var i = 0; i < texte.length; i++) { h ^= texte.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + texte.length; }
  /* Horodatages de calcul recalculés à chaque ouverture (pas des saisies) : ignorés pour décider d'un envoi, sinon
     deux appareils se renverraient sans fin la même donnée. Les données envoyées restent complètes. */
  function texteComparable(d) {
    if (!d || typeof d !== 'object') return JSON.stringify(d);
    var c = Object.assign({}, d); delete c.veraUpdatedAt;
    if (c.cpCostWatch && typeof c.cpCostWatch === 'object') { c.cpCostWatch = Object.assign({}, c.cpCostWatch); delete c.cpCostWatch.at; }
    return JSON.stringify(c);
  }
  function composite() { var t = 0; for (var k in etat.revs) t += Number(etat.revs[k]) || 0; return t; }
  function idOk(id) { return /^[A-Za-z0-9._-]{1,120}$/.test(id) && id !== 'demo-brasserie' && id.indexOf('perso-') !== 0 && id.indexOf('demo') !== 0; }
  /* C330 : dossier archivé dans cet appareil (029, etabIsActive) */
  function archive(id) { try { return eva('typeof etabIsActive==="function"') && w.etabIsActive(id) === false; } catch (e) { return false; } }
  function etabsSynchro(s) {
    var ok = eva('typeof verdictPayloadAllowed==="function"') ? w.verdictPayloadAllowed : function () { return true; };
    return (s && s.ordre || []).filter(function (id) { var d = s.etabs && s.etabs[id]; return d && idOk(id) && !(d._demo && d._demo.fictional) && ok({ v: 2, actif: id, ordre: [id], etabs: (function () { var o = {}; o[id] = d; return o; })() }); });
  }

  function requete(url, corps, avecJeton) {
    var h = { 'Content-Type': 'application/json' }; if (avecJeton && jeton) h['X-CSRF-Token'] = jeton;
    return fetch(url, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: h, body: JSON.stringify(corps) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j = j || {}; j.__statut = r.status; return j; }); });
  }
  function ouvrirSession() {
    return requete(URL_COMPTE, { action: 'me' }).then(function (j) {
      if (!j.authenticated || !j.csrf) throw new Error('compte_non_connecte'); jeton = String(j.csrf);
      try { var st = eva('VERDICT_ACCOUNT_STATE'); if (st) st.csrf = jeton; } catch (e) {}
      return requete(URL_ESPACE, { action: 'bootstrap' });
    }).then(function (j) {
      var ws = j.workspace || {}, org = (ws.organisations || []).filter(function (o) { return o.owner; })[0] || (ws.organisations || [])[0];
      if (!org) throw new Error('organisation_absente'); organisation = org.id;
      return (org.sites || []).map(function (x) { return { id: x.id, name: x.name }; });
    });
  }
  function tirer(etabId) { return requete(URL_ESPACE, { action: 'sync_pull', organisationId: organisation, etabId: etabId, module: 'pilotage' }); }
  function erreur(j, defaut) { var e = new Error(j.error || j.code || defaut || 'Synchronisation indisponible'); e.status = j.__statut; e.payload = j; return e; }

  /* ---------- Les actions attendues par la synchronisation d'origine ---------- */
  function statut() {
    return ouvrirSession().then(function (sites) {
      return Promise.all(sites.map(function (s) { return tirer(s.id).then(function (j) { return { id: s.id, rev: Number(j.rev) || 0, maj: j.updatedAt || 0 }; }); }));
    }).then(function (liste) {
      var rev = 0, maj = 0, existe = false;
      liste.forEach(function (x) { if (x.rev > 0) existe = true; rev += x.rev; maj = Math.max(maj, Number(new Date(x.maj || 0)) || 0); });
      return { ok: true, configured: true, data: { exists: existe, rev: rev, updated_at: Math.floor(maj / 1000) } };
    });
  }
  function tout(sites) {
    return Promise.all(sites.map(function (s) { return tirer(s.id).then(function (j) { if (j.__statut !== 200) throw erreur(j); return { id: s.id, rev: Number(j.rev) || 0, data: j.data, maj: j.updatedAt }; }); }));
  }
  function pull() {
    return ouvrirSession().then(tout).then(function (liste) {
      var s = store() || {}, avec = liste.filter(function (x) { return x.data && typeof x.data === 'object'; });
      if (!avec.length) return { ok: true, store: null, data: { exists: false, rev: 0 } };
      var o = { v: 2, actif: null, ordre: [], etabs: {}, _safety: s._safety };
      avec.forEach(function (x) { o.ordre.push(x.id); o.etabs[x.id] = x.data; });
      o.actif = o.etabs[s.actif] ? s.actif : o.ordre[0];
      etat.revs = {}; etat.empreintes = {};
      liste.forEach(function (x) { etat.revs[x.id] = x.rev; if (x.data) etat.empreintes[x.id] = empreinte(texteComparable(x.data)); });
      ecrireEtat(); tirageEnCours = true;
      return { ok: true, store: o, data: { rev: composite(), updated_at: Math.floor(Date.now() / 1000) } };
    });
  }
  function push(payload) {
    var s = payload && payload.store, garder = payload && payload.reason === 'conflict-device-kept';
    return ouvrirSession().then(function (sites) {
      var connus = {}; sites.forEach(function (x) { connus[x.id] = true; });
      var ids = etabsSynchro(s), chaine = Promise.resolve(), conflit = null;
      ids.forEach(function (id) {
        chaine = chaine.then(function () {
          if (conflit) return;
          var data = s.etabs[id], e = empreinte(texteComparable(data));
          if (!garder && etat.empreintes[id] === e && connus[id]) return; /* inchangé depuis la dernière synchronisation */
          /* C330 (avec L4, C328) : un dossier archivé que le serveur ne connaît pas n'y est jamais créé (il serait compté au devis) */
          if (!connus[id] && archive(id)) return;
          var creer = connus[id] ? Promise.resolve() : requete(URL_FLUX, { action: 'ensure_establishment', etabId: id, name: String(data.etab || 'Établissement').slice(0, 160), organisationId: organisation }, true)
            .then(function (j) { if (!j.ok) throw erreur(j, 'Création de l’établissement impossible'); connus[id] = true; });
          var base = garder ? creer.then(function () { return tirer(id).then(function (j) { return Number(j.rev) || 0; }); }) : creer.then(function () { return Number(etat.revs[id]) || 0; });
          return base.then(function (rev) {
            var mutation = 'm-' + id.slice(0, 40) + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
            return requete(URL_ESPACE, { action: 'sync_push', organisationId: organisation, etabId: id, module: 'pilotage', mutationId: mutation, rev: rev, data: data }, true).then(function (j) {
              if (j.ok) { etat.revs[id] = Number(j.rev) || rev + 1; etat.empreintes[id] = e; ecrireEtat(); return; }
              if (j.__statut === 409 && j.conflict) { conflit = j; return; }
              throw erreur(j, j.__statut === 413 ? 'Établissement trop volumineux pour la synchronisation' : null);
            });
          });
        });
      });
      return chaine.then(function () {
        if (conflit) { var e = new Error('Deux versions de Verdict ont été détectées'); e.status = 409; e.payload = { data: { rev: composite() + 1 } }; throw e; }
        return { ok: true, data: { rev: composite(), updated_at: Math.floor(Date.now() / 1000) } };
      });
    });
  }
  function adaptateur(action, payload) {
    if (action === 'status') return statut();
    if (action === 'pull') return pull();
    if (action === 'push') return push(payload);
    if (action === 'history') return Promise.resolve({ ok: true, versions: [] });
    return Promise.reject(new Error('Fonction pas encore disponible avec le serveur Verdict'));
  }

  /* Un appareil neuf affiche « Comment souhaitez-vous commencer ? » et garde les modules fermés tant qu'aucune entrée
     n'est choisie. S'il reçoit un établissement déjà configuré, cette porte n'a plus lieu d'être : on la ferme et on
     prévient la coquille (sinon l'Inventaire et la Carte restent inaccessibles alors que les données sont là). */
  function ouvrirPorte() {
    try {
      var pret = (typeof w.getMode === 'function' && w.getMode()) || (typeof w.onboardingFait === 'function' && w.onboardingFait()) || w.verdictStoreHasBusinessData();
      if (!pret) return;
      var r = doc.getElementById('refSh'); if (r && r.classList.contains('on')) r.classList.remove('on');
      if (w.VerdictUnified && typeof w.VerdictUnified.unlockStartup === 'function') w.VerdictUnified.unlockStartup();
      if (w.VerdictUnified && typeof w.VerdictUnified.publishContext === 'function') w.VerdictUnified.publishContext();
    } catch (e) {}
  }

  /* ---------- Démarrage et rafraîchissement ---------- */
  function cloud() { return eva('VERDICT_CLOUD'); }
  function metaSure() { try { return w.verdictSafetyMeta(); } catch (e) { return {}; } }
  function sansModifLocale() { var m = metaSure(); return Number(m.localRev || 0) === Number(m.cloudLocalRev || 0); }
  /* Relecture silencieuse : on revient sur l'écran et la position où l'on était. */
  function relireEnPlace() {
    var vue = '', y = 0; try { var on = doc.querySelector('.view.on'); vue = on ? on.id.replace(/^v-/, '') : ''; y = w.scrollY; } catch (e) {}
    var toast0 = w.toast; w.toast = function () {};
    return Promise.resolve(w.verdictCloudPull(true)).then(function (ok) {
      w.toast = toast0;
      try { if (vue && vue !== 'pil' && typeof w.go === 'function') w.go(vue); setTimeout(function () { w.scrollTo(0, y); }, 60); } catch (e) {}
      if (ok) { var m = metaSure(); m.cloudLocalRev = m.localRev; try { toast0 && toast0('Données mises à jour depuis votre autre appareil'); } catch (e) {} }
      return ok;
    }, function () { w.toast = toast0; return false; });
  }
  var enCours = false;
  function verifier(origine) {
    var C = cloud(); if (!actifSync || !C || enCours || C.saving || C.applying) return Promise.resolve(false);
    enCours = true;
    return statut().then(function (j) {
      C.configured = true; C.ready = true; C.error = '';
      var m = metaSure(), localRev = Number(m.cloudRev) || 0, aDonnees = false;
      try { aDonnees = w.verdictStoreHasBusinessData(); } catch (e) {}
      if (j.data.exists) {
        if (!aDonnees) return relireEnPlace();
        if (j.data.rev > localRev) { if (sansModifLocale()) return relireEnPlace(); C.rev = j.data.rev; w.verdictCloudConflict(j.data); return false; }
        if (!sansModifLocale()) w.verdictCloudQueue(origine || 'resync');
      } else if (aDonnees) w.verdictCloudQueue('initial');
      try { w.drawDataSafety(); } catch (e) {}
      return true;
    }).catch(function (e) { if (C) C.error = e.message || 'Serveur inaccessible'; return false; }).then(function (v) { enCours = false; return v; });
  }
  function demarrer() {
    if (!compteEnLigne() || demoOuTest() || typeof w.verdictCloudPush !== 'function') return;
    lireEtat();
    w.verdictCloudRequest = adaptateur; /* la synchronisation d'origine parle désormais au serveur Verdict */
    /* Pas d'écho : après une relecture, l'appli normalise les données reçues ; l'empreinte de référence est celle des
       données rangées, sinon chaque relecture repartirait aussitôt vers le serveur (ping-pong entre appareils). */
    var appliquer0 = w.verdictApplyStore;
    if (typeof appliquer0 === 'function' && !appliquer0.__c141) {
      var appliquer = function (o) {
        var tire = tirageEnCours; tirageEnCours = false;
        var r = appliquer0.apply(this, arguments);
        if (r && tire) { try { var st = store(); etabsSynchro(st).forEach(function (id) { if (etat.revs[id] != null) etat.empreintes[id] = empreinte(texteComparable(st.etabs[id])); }); ecrireEtat(); } catch (e) {} ouvrirPorte(); }
        return r;
      };
      appliquer.__c141 = true; w.verdictApplyStore = appliquer;
    }
    var C = cloud(); if (!C) return;
    ouvrirSession().then(function () { actifSync = true; C.configured = true; C.ready = true; return verifier('demarrage'); }).catch(function () {});
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden) verifier('retour'); });
    w.addEventListener('message', function (ev) { var d = ev && ev.data; if (d && d.type === 'verdict-sync-donnees' && (!d.module || d.module === 'pilotage')) setTimeout(function () { verifier('signal'); }, 400); });
  }
  if (doc.readyState === 'complete') setTimeout(demarrer, 1500); else w.addEventListener('load', function () { setTimeout(demarrer, 1500); });
  w.VerdictSyncEspace = { verifier: verifier, actif: function () { return actifSync; }, etat: function () { return JSON.parse(JSON.stringify(etat)); }, empreinte: empreinte };
})();
