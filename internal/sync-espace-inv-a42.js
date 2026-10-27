/* C141 — Synchronisation de l'Inventaire entre appareils (étape B du plan de mise en ligne).
   L'Inventaire garde tous les établissements du compte dans un seul état local (zones, établissements, fournisseurs,
   commandes) et possède déjà une fusion à trois voies (VerdictInventorySync.reconcile : en cas de conflit sur un même champ,
   la saisie locale gagne, rien n'est perdu). Ce fichier réutilise cette fusion et l'envoie au serveur Verdict
   (/api/workspace, module « inventory »), sans activer le mode compte d'origine de l'Inventaire (qui changerait son interface).
   C295 : un document par établissement (avant : tout le compte dans le document du premier établissement, d'où un Café
   qui écrivait dans le Bar, un lien d'équipe du Bar donné depuis le Café, et un employé du Bar qui voyait les produits du Café).
   - Chaque site de l'Inventaire est rattaché à son établissement du serveur : même identifiant, ou établissement de Pilotage
     relié à ce site (inventoryLink), ou établissement noté à sa création depuis Verdict (verdictStoreId).
   - Un site sans établissement du serveur reste dans le document du premier établissement (l'ancre), comme avant : un client
     à un seul établissement garde exactement son document. Ce qui n'appartient à aucun site (profil, réglages) suit l'ancre.
   - Le document d'un établissement ne contient que ses sites : zones, produits, comptages, prix, factures, commandes.
   - Envoi après chaque enregistrement (2,6 s de regroupement), seulement pour les établissements modifiés ; relecture au
     démarrage, au retour sur l'appli et au signal d'un autre appareil (relayé par la coquille).
   - Jamais en démonstration, en inventaire partagé, pour l'équipe, ni tant que le compte n'est pas en ligne. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdSyncEspaceInv) return; w.__vdSyncEspaceInv = true;
  var racine = new URL('../../', location.href).pathname;
  var URL_ESPACE = racine + 'api/workspace', URL_COMPTE = racine + 'api/account', URL_FLUX = racine + 'api/flux';
  var jeton = '', organisation = '', ancre = '', serveur = [], minuteur = 0, envoi = false, actif = false, etats = null;
  var CHAMPS_SITE = ['site', 'siteId', 'establishmentId', 'etabId'];

  function eva(n) { try { return w.eval(n); } catch (e) { return undefined; } }
  function drapeau(n) { return !!eva('typeof ' + n + '!=="undefined"&&' + n); }
  /* C229 (X23) : le serveur de comptes ne pose VERDICT_WORKSPACE_CONNECTED que dans le cadre Verdict (contrat L4, C215) ; un compte
     connecté (VERDICT_COMPTE.connecte) suffit pour rattacher l'Inventaire au compte, comme le promet W38 (« rien n'est perdu »). */
  function compteEnLigne() { var t = w.top || w; try { return t.VERDICT_ACCOUNT_AUTH_READY === true && (t.VERDICT_WORKSPACE_CONNECTED === true || !!(t.VERDICT_COMPTE && t.VERDICT_COMPTE.connecte === true)); } catch (e) { return false; } }
  function horsJeu() { return drapeau('DEMO') || drapeau('SHARED') || drapeau('STAFF') || drapeau('OWNER_TEAM') || /[?&]demo=1/.test(location.search); }
  function idOk(id) { return /^[A-Za-z0-9._-]{1,120}$/.test(id || '') && id !== 'demo-brasserie' && String(id).indexOf('perso-') !== 0 && String(id).indexOf('demo') !== 0; }
  function DB() { return eva('DB'); }
  function S() { return w.VerdictInventorySync; }
  function objet(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function aDesDonnees(d) { try { return Object.keys(d.spaces || {}).some(function (k) { return ((d.spaces[k] || {}).products || []).length > 0; }); } catch (e) { return false; } }

  /* ---------- État de synchronisation par établissement (local à l'appareil, jamais envoyé) ---------- */
  function cleEtats() { return 'verdict:inv-etabs-sync:v1:' + String(eva('ACCOUNT_ID') || 'local'); }
  function lireEtats() {
    if (etats) return etats;
    try { etats = JSON.parse(localStorage.getItem(cleEtats()) || 'null'); } catch (e) { etats = null; }
    if (!objet(etats) || !objet(etats.docs)) etats = { docs: {}, sites: {} };
    if (!objet(etats.sites)) etats.sites = {};
    return etats;
  }
  function ecrireEtats() { try { localStorage.setItem(cleEtats(), JSON.stringify(lireEtats())); } catch (e) {} }

  /* ---------- Rattachement d'un site de l'Inventaire à un établissement du serveur ---------- */
  function magasinPilotage() {
    try { var f = w.parent && w.parent !== w && w.parent.document.getElementById('frame-verdict'), V = f && f.contentWindow; return V && V.eval('typeof STORE!=="undefined"?STORE:null'); } catch (e) { return null; }
  }
  function etabDe(siteId) {
    if (!siteId) return '';
    var E = lireEtats(), connu = function (id) { return !!id && serveur.indexOf(id) >= 0; };
    if (connu(E.sites[siteId])) return E.sites[siteId];
    var trouve = '';
    if (connu(siteId)) trouve = siteId;
    if (!trouve) { var d = DB(), s = d && d.sites && d.sites[siteId]; if (s && connu(s.verdictStoreId)) trouve = s.verdictStoreId; }
    if (!trouve) {
      var st = magasinPilotage();
      if (st && st.etabs) Object.keys(st.etabs).forEach(function (id) { var x = st.etabs[id] || {}; if (!trouve && connu(id) && x.inventoryLink && String(x.inventoryLink.siteId || '') === siteId) trouve = id; });
    }
    if (trouve) { E.sites[siteId] = trouve; ecrireEtats(); }
    return trouve;
  }
  function routeSite(siteId) { return etabDe(siteId) || ancre; }
  function siteDe(x) { if (!objet(x)) return ''; for (var i = 0; i < CHAMPS_SITE.length; i++) { var v = x[CHAMPS_SITE[i]]; if (typeof v === 'string' && v) return v; } return ''; }
  /* Un élément d'une liste (comptage, prix, facture, commande…) appartient à l'établissement de son site ; sans site connu
     de l'Inventaire, il reste avec l'ancre (rien ne se perd). */
  function routeElement(x, sitesLocaux) { var s = siteDe(x); return s && sitesLocaux.indexOf(s) >= 0 ? routeSite(s) : ancre; }

  function groupes(d) {
    var g = {}; ((d && d.siteList) || Object.keys((d && d.sites) || {})).forEach(function (s) { var e = routeSite(s); if (!e) return; (g[e] = g[e] || []).push(s); });
    return g;
  }
  function zonesDe(d, ids) { var z = []; ids.forEach(function (s) { ((d.sites[s] || {}).zones || []).forEach(function (k) { if (z.indexOf(k) < 0) z.push(k); }); }); return z; }
  /* Listes datées (comptages, prix…) : l'ordre chronologique est gardé après la fusion de plusieurs établissements. */
  function chrono(a) { return a.every(function (x) { return objet(x) && typeof x.date === 'string'; }) ? a.slice().sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : 0; }) : a; }
  function choisir(o, cles) { var r = {}; cles.forEach(function (k) { if (o && Object.prototype.hasOwnProperty.call(o, k)) r[k] = o[k]; }); return r; }

  /* Le document d'un établissement : ses sites, leurs zones et tout ce qui porte leur site ; le reste du compte suit l'ancre. */
  function extraire(d, etab) {
    var ids = (groupes(d)[etab] || []).slice(), estAncre = etab === ancre, locaux = (d.siteList || Object.keys(d.sites || {})).slice();
    var zones = zonesDe(d, ids), o = {};
    Object.keys(d).forEach(function (k) {
      var v = d[k];
      if (k === '_safety') return; /* révision locale de l'appareil, jamais celle d'une copie (C229, X23) */
      if (k === 'sites') o.sites = choisir(v, ids);
      else if (k === 'siteList') o.siteList = ids.slice();
      else if (k === 'spaces' || k === 'meta') o[k] = choisir(v, zones);
      else if (k === 'list') o.list = zones.slice();
      else if (k === 'site') o.site = ids.indexOf(v) >= 0 ? v : (ids[0] || '');
      else if (k === 'space') o.space = zones.indexOf(v) >= 0 ? v : (zones[0] || '');
      else if (/BySite$/.test(k) && objet(v)) o[k] = choisir(v, Object.keys(v).filter(function (s) { return locaux.indexOf(s) >= 0 ? ids.indexOf(s) >= 0 : estAncre; }));
      else if (Array.isArray(v)) o[k] = v.filter(function (x) { return routeElement(x, locaux) === etab; });
      else o[k] = v;
    });
    return S().clone(o);
  }
  /* Remet dans l'état local ce qui revient du serveur pour cet établissement, sans toucher aux autres établissements. */
  function integrer(d, sub, etab) {
    var estAncre = etab === ancre, locaux = (d.siteList || Object.keys(d.sites || {})).slice(), avant = (groupes(d)[etab] || []).slice();
    var venus = (sub.siteList || Object.keys(sub.sites || {})).filter(function (s) { return sub.sites && sub.sites[s] && (avant.indexOf(s) >= 0 || !d.sites[s] || routeSite(s) === etab); });
    var vieillesZones = zonesDe(d, avant), nouvellesZones = [];
    venus.forEach(function (s) { ((sub.sites[s] || {}).zones || []).forEach(function (k) { if (nouvellesZones.indexOf(k) < 0) nouvellesZones.push(k); }); });
    avant.forEach(function (s) { if (venus.indexOf(s) < 0) delete d.sites[s]; });
    vieillesZones.forEach(function (k) { if (nouvellesZones.indexOf(k) < 0) { if (d.spaces) delete d.spaces[k]; if (d.meta) delete d.meta[k]; } });
    venus.forEach(function (s) { d.sites[s] = sub.sites[s]; if (!etabDe(s) && etab !== ancre) { lireEtats().sites[s] = etab; ecrireEtats(); } });
    nouvellesZones.forEach(function (k) { if (sub.spaces && sub.spaces[k]) d.spaces[k] = sub.spaces[k]; if (sub.meta && sub.meta[k]) { d.meta = d.meta || {}; d.meta[k] = sub.meta[k]; } });
    var liste = (d.siteList || []).filter(function (s) { return d.sites[s]; }); venus.forEach(function (s) { if (liste.indexOf(s) < 0) liste.push(s); }); d.siteList = liste;
    var zl = (d.list || []).filter(function (k) { return d.spaces && d.spaces[k]; }); nouvellesZones.forEach(function (k) { if (zl.indexOf(k) < 0) zl.push(k); }); d.list = zl;
    Object.keys(sub).forEach(function (k) {
      if (['sites', 'siteList', 'spaces', 'meta', 'list', 'site', 'space', '_safety'].indexOf(k) >= 0) return;
      var v = sub[k];
      if (/BySite$/.test(k) && objet(v)) { var cible = objet(d[k]) ? d[k] : (d[k] = {}); Object.keys(cible).forEach(function (s) { if (avant.indexOf(s) >= 0 || (estAncre && locaux.indexOf(s) < 0)) delete cible[s]; }); Object.keys(v).forEach(function (s) { cible[s] = v[s]; }); }
      else if (Array.isArray(v)) { var garde = Array.isArray(d[k]) ? d[k].filter(function (x) { return routeElement(x, locaux) !== etab; }) : []; d[k] = chrono(garde.concat(v)); }
      else if (estAncre) d[k] = v;
    });
    if (!d.site || !d.sites[d.site]) d.site = d.siteList[0];
    return d;
  }

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
      serveur = (org.sites || []).map(function (x) { return x.id; }).filter(idOk);
      var d = DB() || {}, local = (d.siteList || []).filter(idOk);
      ancre = serveur[0] || local[0] || '';
      migrerAncienEtat();
      return { connu: serveur.indexOf(ancre) >= 0, nom: d.sites && d.sites[ancre] && d.sites[ancre].name };
    });
  }
  /* Avant C295, un seul état de synchronisation (celui de l'ancre) : il devient celui du document de l'ancre. */
  function migrerAncienEtat() {
    var E = lireEtats(); if (E.migre || !ancre) return;
    var m = eva('readSyncMeta(false)') || {}, rev = Number(eva('CLOUD_REV')) || Number(m.baseRev) || 0;
    E.docs[ancre] = { rev: rev, base: objet(m.baseData) && objet(m.baseData.spaces) ? extraire(m.baseData, ancre) : null };
    E.migre = true; ecrireEtats();
  }
  function modifie(sub, etat) { return etat && etat.base ? !S().equal(sub, etat.base) : aDesDonnees(sub); }

  /* Relire un établissement et fusionner (fusion à trois voies d'origine, sur le seul document de cet établissement). */
  function relireEtab(etab) {
    return requete(URL_ESPACE, { action: 'sync_pull', organisationId: organisation, etabId: etab, module: 'inventory' }).then(function (j) {
      var E = lireEtats(), etat = E.docs[etab] || { rev: 0, base: null }, rev = Number(j.rev) || 0;
      if (j.__statut !== 200 || !j.data || !j.data.spaces || rev <= (Number(etat.rev) || 0)) return { change: false };
      var d = DB(); if (!d) return { change: false };
      var local = extraire(d, etab), decision = S().reconcile(local, { dirty: modifie(local, etat), baseRev: etat.rev, baseData: etat.base }, j.data, rev);
      if (!decision.data) return { change: false };
      integrer(d, decision.data, etab);
      E.docs[etab] = { rev: rev, base: decision.needsUpload ? decision.baseData : S().clone(extraire(d, etab)) }; ecrireEtats();
      return { change: true, renvoyer: decision.needsUpload };
    }).catch(function () { return { change: false }; });
  }
  function relire() {
    if (!actif || envoi) return Promise.resolve(false);
    return ouvrir().then(function () {
      if (!ancre) return false;
      var cibles = serveur.length ? serveur.slice() : [ancre];
      return cibles.reduce(function (p, etab) { return p.then(function (acc) { return relireEtab(etab).then(function (r) { acc.change = acc.change || r.change; acc.renvoyer = acc.renvoyer || r.renvoyer; return acc; }); }); }, Promise.resolve({ change: false, renvoyer: false }));
    }).then(function (r) {
      if (!r || !r.change) return false;
      try { if (typeof w.cleanDB === 'function') w.cleanDB(); } catch (e) {}
      try { eva('saveLocal()'); } catch (e) {}
      try { w.drawSpaces(); w.setLevel(DB().level || 'normale', true); w.go(eva('VIEW')); } catch (e) {}
      if (r.renvoyer) planifier(); /* la fusion a gardé des saisies locales : on les renvoie */
      /* C248 : accueil de première ouverture refermé si le compte apporte un profil déjà fait (rien n'est enregistré). */
      try { var wl = w.document.getElementById('welcome'), pf = (DB() || {}).profile; if (wl && wl.classList.contains('on') && pf && pf.done && typeof w.wClose === 'function') w.wClose(w.renderGreet); } catch (e) {}
      return true;
    }).catch(function () { return false; });
  }
  function planifier() { clearTimeout(minuteur); minuteur = setTimeout(envoyer, 2600); }
  /* C328 (L4, via L7) : le serveur compte les établissements déclarés : un dossier archivé dans Pilotage (etabIsActive === false) n'est
     jamais créé au serveur par « ensure_establishment ». Seul un dossier que Pilotage connaît compte : un site d'Inventaire seul,
     inconnu de Pilotage, reste créé normalement. Pilotage est lu dans cette page ou dans son cadre voisin (coque). */
  function archiveEtab(id) {
    var V = [w]; try { var f = w.parent && w.parent !== w && w.parent.document.getElementById('frame-verdict'); if (f && f.contentWindow) V.push(f.contentWindow); } catch (e) {}
    for (var i = 0; i < V.length; i++) { try { if (typeof V[i].etabIsActive === 'function' && V[i].STORE && V[i].STORE.etabs && V[i].STORE.etabs[id]) return V[i].etabIsActive(id) === false; } catch (e) {} }
    return false;
  }
  function envoyerEtab(etab, info) {
    if (serveur.indexOf(etab) < 0 && archiveEtab(etab)) return Promise.resolve('archive');
    var E = lireEtats(), etat = E.docs[etab] || { rev: 0, base: null }, donnees = extraire(DB(), etab);
    if (etat.base && S().equal(donnees, etat.base)) return Promise.resolve('same');
    var avant = Promise.resolve();
    if (serveur.indexOf(etab) < 0) avant = requete(URL_FLUX, { action: 'ensure_establishment', etabId: etab, name: String(info.nom || 'Établissement').slice(0, 160), organisationId: organisation }, true).then(function (j) { if (!j.ok) throw new Error('etablissement'); serveur.push(etab); });
    return avant.then(function () {
      var mutation = 'inv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      return requete(URL_ESPACE, { action: 'sync_push', organisationId: organisation, etabId: etab, module: 'inventory', mutationId: mutation, rev: Number(etat.rev) || 0, data: donnees }, true);
    }).then(function (j) {
      if (j.ok) { E.docs[etab] = { rev: Number(j.rev) || (Number(etat.rev) || 0) + 1, base: donnees }; ecrireEtats(); return S().equal(extraire(DB(), etab), donnees) ? 'ok' : 'again'; }
      if (j.__statut === 409) return relireEtab(etab).then(function () { return 'again'; });
      return 'offline';
    });
  }
  function envoyer() {
    if (!actif || envoi) return; envoi = true;
    ouvrir().then(function (info) {
      if (!ancre) throw new Error('sans_etablissement');
      var cibles = Object.keys(groupes(DB() || {})); if (cibles.indexOf(ancre) < 0) cibles.unshift(ancre);
      return cibles.reduce(function (p, etab) { return p.then(function (acc) { return envoyerEtab(etab, info).then(function (r) { acc.push(r); return acc; }); }); }, Promise.resolve([]));
    }).then(function (res) {
      envoi = false;
      if (res.indexOf('offline') >= 0) { try { w.syncBadge('⚠ hors ligne', false); } catch (e) {} return; }
      try { w.markSyncClean(DB(), Number(eva('CLOUD_REV')) || 0); w.syncBadge('✓ sync', true); } catch (e) {}
      if (res.indexOf('again') >= 0) planifier();
    }).catch(function () { envoi = false; });
  }

  function demarrer() {
    if (!compteEnLigne() || horsJeu() || typeof w.save !== 'function' || !S() || typeof w.applyCloud !== 'function') return;
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
      var d = DB() || {}; if (aDesDonnees(d)) planifier();
    }).catch(function () {});
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden) relire(); });
    w.addEventListener('message', function (ev) { var d = ev && ev.data; if (d && d.type === 'verdict-sync-donnees' && d.module === 'inventory') setTimeout(relire, 400); });
  }
  if (doc.readyState === 'complete') setTimeout(demarrer, 1800); else w.addEventListener('load', function () { setTimeout(demarrer, 1800); });
  /* C295 : établissement du serveur du site affiché (lien d'équipe, « Partager ») ; à défaut, l'ancre. */
  function etabActif() { var d = DB(); return (d && routeSite(d.site)) || ancre; }
  w.VerdictSyncEspaceInv = { relire: relire, envoyer: envoyer, actif: function () { return actif; }, ancre: function () { return ancre; }, etabDe: function (s) { return routeSite(s); }, etabActif: etabActif, _ouvrir: ouvrir, _extraire: extraire, _integrer: integrer };
})();
