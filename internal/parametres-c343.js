/* Verdict® — C343 (L1 ; décisions 25, 26, 27 et 29 de Steven, 23/10) : un seul écran « Paramètres ».
   Inventaire de départ : 13-RAPPORTS-ET-MANIFESTES/INVENTAIRE-PARAMETRES-C343.md.
   - Feuille plein écran de la coque, ouverte par VerdictParametres.ouvrir(section) : depuis la première ligne de « Plus »
     (Pilotage), de l'Inventaire, et pour l'Inventaire gratuit comme pour le lien d'équipe.
   - Ordre : Compte, Abonnement, Sécurité de cet appareil, Apparence, Langue, Notifications, Établissements, Équipe et accès,
     Connexions, Données, Aide et documents, À propos.
   - Rien n'est recopié : chaque ligne appelle la fonction qui existe déjà (page Compte, go('abo'), VerdictVerrou, VerdictTheme,
     openEtabs, backup, VerdictMaj…). Une ligne dont la fonction n'existe pas n'est pas affichée ; seule « Comptable et
     plateformes de livraison » est annoncée « Bientôt ».
   - Décision 29 : avec le lien d'équipe, seules Langue et Apparence ; en démonstration, Compte, Abonnement et Équipe disent
     « Disponible avec votre compte », sans bouton.
   - Décision 27 : l'écran est construit d'un seul tenant, styles posés avant, aucune animation qui décale.
   - Au repos (feuille fermée ou ouverte sans geste), rien ne tourne et rien n'est réécrit. */
(function () {
  'use strict';
  var w = window, doc = document;
  if (w.top !== w || w.VerdictParametres) return;
  var SITE = 'https://verdictchr.fr/';
  var LANGUES = [['fr', 'Français'], ['en', 'English'], ['es', 'Español'], ['it', 'Italiano'], ['de', 'Deutsch'], ['nl', 'Nederlands'], ['pt', 'Português']];
  var ICONES = {
    compte: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    abo: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/>',
    securite: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    apparence: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
    langue: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    notif: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    etabs: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>',
    equipe: '<path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"/><circle cx="9" cy="7" r="3.5"/><path d="M22 19v-1a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    connexions: '<path d="M7 7h13l-3-3"/><path d="M17 17H4l3 3"/>',
    donnees: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    aide: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    apropos: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7h.01"/>'
  };

  /* ---------- contexte ---------- */
  function langue() { var l = String(doc.documentElement.lang || 'fr').slice(0, 2).toLowerCase(); return /^(fr|en|es|it|de|nl|pt)$/.test(l) ? l : 'fr'; }
  /* Même traducteur que le reste de la coque (langues-complements.js) : la phrase est posée déjà traduite, sans second passage. */
  function T(s) { var l = langue(); if (l === 'fr') return s; try { var L = w.VerdictLanguesComplements; return (L && L.traduire && L.traduire(s, l)) || s; } catch (e) { return s; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cadre(id) { try { var f = doc.getElementById(id), x = f && f.getAttribute('src') && f.contentWindow; return x && x.document ? x : null; } catch (e) { return null; } }
  function equipe() { if (doc.documentElement.classList.contains('vd-equipe')) return true; try { return /[?&]equipe=/.test(location.search) || !!sessionStorage.getItem('verdict:equipe:v1'); } catch (e) { return false; } }
  function perso() { return w.VERDICT_PERSO === true; }
  /* Même lecture que le verrou (C312) : la session de démonstration de Pilotage fait foi, sinon le contexte de la coque. */
  function demo() {
    try { var V = cadre('frame-verdict'), s = V && V.eval('typeof VERDICT_DEMO_SESSION!=="undefined"&&VERDICT_DEMO_SESSION?true:typeof VERDICT_PRESENTATION_PROFILE!=="undefined"&&VERDICT_PRESENTATION_PROFILE?true:typeof VERDICT_DEMO_SESSION!=="undefined"?false:null'); if (s === true || s === false) return s; } catch (e) {}
    try { var U = w.VerdictUnifiedShell, c = U && U.getContext && U.getContext(); if (c && typeof c.demo !== 'undefined') return !!c.demo; } catch (e) {}
    try { var q = new URLSearchParams(location.search); return q.get('demo') === '1' || q.has('presentation'); } catch (e) { return false; }
  }
  function compte() { var c = w.VERDICT_COMPTE; return c && c.connecte ? c : null; }
  /* Formule Inventaire (Pilotage et Carte floutés, C224) ou lien d'équipe : Pilotage n'est pas ouvert. */
  function pilotageFerme() { return equipe() || doc.documentElement.classList.contains('vd-plan-inventaire'); }
  function fn(o, k) { return !!(o && typeof o[k] === 'function'); }

  /* ---------- ouvrir ce qui existe ---------- */
  function aller(url) { try { location.href = url; } catch (e) {} }
  function nouvelOnglet(url) { try { w.open(url, '_blank', 'noopener'); } catch (e) {} }
  /* Ouvre le module puis appelle la fonction dans son cadre dès qu'elle est prête (au plus 6 s). */
  function dansModule(cap, id, appel) {
    var section = retourSection; retourSection = '';
    fermer();
    var U = w.VerdictUnifiedShell;
    try { if (U && U.activateModule && (!U.getActiveModule || U.getActiveModule() !== cap)) U.activateModule(cap); } catch (e) {}
    var n = 0;
    (function essai() { var X = cadre(id); if (X && X.document.readyState === 'complete') { var avant = fenetres(X); try { if (appel(X) !== false) { if (section) revenir(X, section, avant); return; } } catch (e) { return; } } if (n++ < 60) setTimeout(essai, 100); })();
  }
  /* C401 (A78 de l'audit du 27/10) : une fenêtre ouverte depuis Paramètres (Mes établissements, Jours d'ouverture, Connecter la
     caisse, Repartir de zéro…) ramène à Paramètres en se fermant, sur la même section, comme la cloche ou les connexions. Les écrans
     (Abonnement, Alertes, Aide) ne sont pas des fenêtres : on y reste. Rien n'est observé au repos : seulement tant que la fenêtre est là. */
  var retourSection = '';
  function visible(X, e) { if (!e.isConnected) return false; var cs = X.getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; var r = e.getBoundingClientRect(); return r.width >= 40 && r.height >= 40; }
  function fenetres(X) {
    var out = [];
    try { [].forEach.call(X.document.querySelectorAll('.modal.on,[role="dialog"],[aria-modal="true"],body>*'), function (e) {
      if (out.indexOf(e) >= 0 || !visible(X, e)) return;
      if (!e.matches('.modal.on,[role="dialog"],[aria-modal="true"]')) { var cs = X.getComputedStyle(e), r = e.getBoundingClientRect(); if (cs.position !== 'fixed' || r.width * r.height < 0.3 * X.innerWidth * X.innerHeight) return; }
      out.push(e);
    }); } catch (e) {}
    return out;
  }
  function revenir(X, section, avant) {
    setTimeout(function () {
      function neuves() { return fenetres(X).filter(function (e) { return avant.indexOf(e) < 0; }); }
      if (!neuves().length) return;
      var fin = Date.now() + 1800000, mo = new X.MutationObserver(function () {
        if (Date.now() > fin) return mo.disconnect();
        if (neuves().length) return;
        mo.disconnect(); if (!ouvert()) ouvrir(section);
      });
      mo.observe(X.document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open'] });
    }, 350);
  }
  function pilotage(appel) { dansModule('pilotage', 'frame-verdict', appel); }
  function inventaire(appel) { dansModule('inventory', 'frame-inventory', appel); }
  function choisirLangue(l) {
    var I = cadre('frame-inventory'), V = cadre('frame-verdict');
    /* L'Inventaire relaie à Pilotage (même réglage partout, C266) ; sinon Pilotage ; sinon la coque seule. */
    if (fn(I, 'inventaireChoisirLangue')) I.inventaireChoisirLangue(l);
    else if (fn(V, 'setLocale')) V.setLocale(l);
    else { try { localStorage.setItem('verdict_locale', l); localStorage.setItem('verdict_lang_asked', '1'); } catch (e) {} doc.documentElement.lang = l; }
    setTimeout(function () { if (ouvert()) rendre(sectionVisible()); }, 400);
  }
  function deconnecter() {
    var C = compte(), h = { 'Content-Type': 'application/json' }; if (C && C.csrf) h['X-CSRF-Token'] = C.csrf;
    return fetch(w.VERDICT_ACCOUNT_API || '/api/account', { method: 'POST', credentials: 'same-origin', headers: h, body: JSON.stringify({ action: 'logout' }) })
      .then(function (r) { if (!r.ok) throw new Error('logout'); aller('account.html?mode=login&return=app'); });
  }
  function reglagesCloche() {
    var N = w.VerdictNotifEtabs; if (fn(N, 'ouvrirReglages')) return N.ouvrirReglages();
    /* En attendant l'ouverture directe (L6) : la cloche, puis son onglet « ⚙ Réglages ». */
    var U = w.VerdictUnifiedShell, c = U && U.notifications; if (!fn(c, 'open')) return; c.open();
    setTimeout(function () { var b = doc.querySelector('#ne17-bar [data-settings][aria-pressed="false"]'); if (b) b.click(); }, 60);
  }
  function connexions() {
    var R = w.VerdictConnectionsR18; if (fn(R, 'ouvrir')) return R.ouvrir();
    var b = doc.getElementById('r18-connect-button'); if (b) b.click();
  }
  function restaurerFichier() {
    /* Le sélecteur de fichier s'ouvre ici, dans le geste ; le fichier est remis à restore() de Pilotage, inchangé. */
    var i = doc.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
    i.addEventListener('change', function () { if (i.files && i.files[0]) pilotage(function (V) { if (!fn(V, 'restore')) return false; V.restore(i); }); });
    i.click();
  }

  /* ---------- contenu ---------- */
  function resumeFormule() {
    var C = compte(), E = null; try { E = w.VerdictPlan && w.VerdictPlan.etat(); } catch (e) {}
    if (C) {
      if (C.formule === 'essai') { var j = Math.max(0, Number(C.joursRestants) || 0); return T('Essai gratuit') + (j ? ' · ' + (j > 1 ? T('{n} jours restants').replace('{n}', j) : T('1 jour restant')) : ''); }
      if (C.formule === 'pro') return 'Verdict Pro';
      if (C.formule === 'pilotage') return 'Verdict Pilotage';
      if (C.formule === 'inventaire') return T('Inventaire gratuit');
    }
    if (E && E.niveau === 'inventaire') return T('Inventaire gratuit');
    if (E && E.niveau === 'essai' && !E.attente && E.jours) return T('Essai gratuit') + ' · ' + (E.jours > 1 ? T('{n} jours restants').replace('{n}', E.jours) : T('1 jour restant'));
    return T('Formules, essai et facturation');
  }
  /* Une ligne : [id, titre, sous-titre, action | null, options] ; options.inactif : texte gris, sans bouton. */
  function sections() {
    var E = equipe(), D = demo(), P = perso(), C = compte(), F = pilotageFerme(), S = [];
    var Vr = w.VerdictVerrou, Th = w.VerdictTheme, M = w.VerdictMaj, App = w.VerdictAppareils, V = cadre('frame-verdict');
    var avecCompte = !E && !P, sansCompte = T('Disponible avec votre compte');
    function sec(id, titre, lignes, extra) { lignes = lignes.filter(Boolean); if (lignes.length || extra) S.push({ id: id, titre: titre, lignes: lignes, extra: extra || '' }); }

    if (avecCompte) sec('compte', T('Compte'), D ? [['compte-demo', T('Mon compte'), sansCompte, null, { inactif: true }]] : C ? [
      ['email', T('Adresse e-mail'), C.email || '', function () { aller('account.html?view=securite'); }],
      ['mdp', T('Mot de passe'), T('Changer le mot de passe'), function () { aller('account.html?view=securite'); }],
      ['mfa', T('Double authentification'), T('Un code en plus du mot de passe'), function () { aller('account.html?view=securite'); }],
      fn(App, 'ouvrir') && fn(App, 'etat') && App.etat().actif ? ['appareils', T('Mes appareils'), T('Reprendre sur un autre appareil'), function () { App.ouvrir(); }] : null,
      ['deconnexion', T('Se déconnecter'), T('Les données de cet appareil restent sur cet appareil.'), 'deconnexion'],
      ['supprimer', T('Supprimer mon compte'), T('Effacement après 7 jours, annulable'), function () { aller('account.html?view=securite'); }, { danger: true }]
    ] : [
      ['creer', T('Créer mon compte'), T('14 jours d’essai, sans carte bancaire'), function () { aller('account.html?mode=register&return=app'); }],
      ['connexion', T('J’ai déjà un compte'), T('Se connecter'), function () { aller('account.html?mode=login&return=app'); }]
    ]);

    if (avecCompte) sec('abonnement', T('Abonnement'), [D ? ['abo-demo', T('Ma formule'), sansCompte, null, { inactif: true }]
      : ['abo', T('Ma formule'), resumeFormule(), function () { if (F) aller('account.html?view=abo'); else pilotage(function (X) { if (!fn(X, 'go')) return false; X.go('abo'); }); }]]);

    /* Sans code créé (démonstration ouverte sans code, C312), il n'y a rien à régler : le code est demandé au passage au réel. */
    var st = {}; try { st = (Vr && fn(Vr, 'state') && Vr.state()) || {}; } catch (e) {}
    if (!E && fn(Vr, 'settings') && (st.configured || st.coffre)) {
      sec('securite', T('Sécurité de cet appareil'), [
        ['verrou', st.coffre ? T('Face ID et verrouillage automatique') : T('Code, Face ID et verrouillage automatique'), T('Délai avant de redemander le code'), function () { Vr.settings(); }],
        st.configured && fn(Vr, 'lock') ? ['verrouiller', T('Verrouiller maintenant'), '', function () { fermer(); Vr.lock(); }] : null
      ]);
    }

    if (Th && fn(Th, 'choisir')) {
      var m = fn(Th, 'etat') ? Th.etat() : 'auto';
      sec('apparence', T('Apparence'), [], '<div class="vpa-seg" role="radiogroup" aria-label="' + esc(T('Apparence')) + '">' +
        [['auto', T('Automatique')], ['clair', T('Clair')], ['sombre', T('Sombre')]].map(function (o) { return '<button type="button" role="radio" data-theme="' + o[0] + '" aria-checked="' + (m === o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') +
        '</div><p class="vpa-note">' + esc(T('Automatique suit l’apparence de l’appareil.')) + '</p>');
    }

    if (!(V && V.I18N_ENABLED === false)) {
      var lg = langue();
      sec('langue', T('Langue'), [], '<label class="vpa-row vpa-select"><span class="vpa-tile">' + svg('langue') + '</span><span class="vpa-txt"><b>' + esc(T('Langue de l’application')) + '</b></span>' +
        '<select data-langue aria-label="' + esc(T('Langue')) + '">' + LANGUES.map(function (o) { return '<option value="' + o[0] + '" lang="' + o[0] + '"' + (o[0] === lg ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>');
    }

    if (!E) {
      var nEtat = M && M.notifications && fn(M.notifications, 'etat') ? M.notifications.etat() : 'indisponible';
      sec('notifications', T('Notifications'), [
        ['notif-app', T('Notifications et nombre sur l’icône'), nEtat === 'indisponible' ? T('Indisponible sur cet appareil') : T('Nouvelles versions et alertes'), null, { interrupteur: nEtat === 'indisponible' ? null : nEtat === 'active' }],
        w.VerdictNotifEtabs || (w.VerdictUnifiedShell && w.VerdictUnifiedShell.notifications) ? ['notif-etabs', T('Par établissement'), T('Toutes, urgences seulement ou aucune'), reglagesCloche] : null,
        !F && !D ? ['notif-alertes', T('Alertes de Pilotage'), T('Ce qui vous est signalé, catégorie par catégorie'), function () { pilotage(function (X) { if (!fn(X, 'go')) return false; X.go('alertes'); }); }] : null
      ]);
    }

    /* C359 (décision 33, avec L2) : la façon de saisir la journée se règle une fois, par établissement (DB.saisieMode, lu par la
       carte de saisie de l'Accueil, 052) ; sans réglage, la carte garde ses trois boutons. */
    var Vd = V && V.DB && fn(V, 'save') ? V.DB : null, sm = Vd ? Vd.saisieMode : '', nomEtab = '';
    try { var cx = w.VerdictUnifiedShell && w.VerdictUnifiedShell.getContext && w.VerdictUnifiedShell.getContext(); nomEtab = cx && typeof cx.name === 'string' ? cx.name : ''; } catch (e) {}
    /* C364 (décision 36, éditeur de L2) : les jours d'ouverture se règlent dans « Vos journées » de l'Accueil ; Paramètres ouvre le
       même éditeur (verdictOuvrirJours, cadre Pilotage), sans copie. Ligne absente tant que l'éditeur n'existe pas. */
    if (!E && !F) sec('etablissements', T('Établissements'), [['etabs', T('Mes établissements'), D ? T('Démonstration : changer de modèle d’établissement') : T('Ajouter, renommer, archiver'), function () { pilotage(function (X) { if (!fn(X, 'openEtabs')) return false; X.openEtabs(); }); }],
      fn(V, 'verdictOuvrirJours') ? ['jours', T('Jours d’ouverture et fermetures'), T('Repos, fermetures, vacances, ouvertures exceptionnelles'), function () { pilotage(function (X) { if (!fn(X, 'verdictOuvrirJours')) return false; X.verdictOuvrirJours(); }); }] : null],
      Vd ? '<p class="vpa-titre-extra"><b>' + esc(T('Saisie de ma journée')) + '</b><small>' + esc(T('Réglée une fois pour cet établissement')) + (nomEtab ? ' · ' + esc(nomEtab) : '') + '</small></p><div class="vpa-seg" role="radiogroup" aria-label="' + esc(T('Saisie de ma journée')) + '">' +
        [['total', T('Journée complète')], ['two', T('Déjeuner + dîner')], ['services', T('Services séparés')]].map(function (o) { return '<button type="button" role="radio" data-saisie="' + o[0] + '" aria-checked="' + (sm === o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>' : '');

    if (avecCompte) sec('equipe', T('Équipe et accès'), D || !C ? [['equipe-sans', T('Membres et droits'), sansCompte, null, { inactif: true }]] : [
      ['membres', T('Membres et droits'), T('Qui voit quoi, établissement par établissement'), function () { aller('account.html#workspace-panel'); }],
      ['lien-equipe', T('Lien d’inventaire pour l’équipe'), T('Votre équipe compte, sans voir vos chiffres'), function () { inventaire(function (X) { if (!fn(X, 'inventairePartagerEquipe')) return false; X.inventairePartagerEquipe(); }); }]
    ]);

    if (!E) sec('connexions', T('Connexions'), [
      w.VerdictConnectionsR18 || doc.getElementById('r18-connect-button') ? ['branchements', T('État des connexions'), T('Caisse, factures électroniques, sauvegarde'), connexions] : null,
      !F ? ['caisse', T('Connecter la caisse'), T('Bientôt : vos ventes arriveront seules, sans saisie'), function () { pilotage(function (X) { if (X.VerdictFluxV451 && fn(X.VerdictFluxV451, 'openConnection')) X.VerdictFluxV451.openConnection(); else if (fn(X, 'go')) X.go('in'); else return false; }); }] : null,
      ['bientot', T('Comptable et plateformes de livraison'), T('Bientôt'), null, { inactif: true }]
    ]);

    if (!E) sec('donnees', T('Données'), [
      !F && !D ? ['sauver', T('Sauvegarder dans un fichier'), T('Tout votre dossier, sur cet appareil'), function () { pilotage(function (X) { if (!fn(X, 'backup')) return false; X.backup(); }); }] : null,
      !F && !D ? ['restaurer', T('Restaurer depuis un fichier'), T('Une sauvegarde Verdict (.json)'), restaurerFichier] : null,
      !F && !D ? ['precedente', T('Revenir à la version précédente'), T('Avant le dernier import ou la dernière remise à zéro'), function () { pilotage(function (X) { if (!fn(X, 'verdictRestoreSafety')) return false; X.verdictRestoreSafety(); }); }] : null,
      C && !D ? ['exporter', T('Exporter toutes mes données'), T('Une copie complète de votre compte'), function () { aller('account.html?view=export'); }] : null,
      !F && !D ? ['zero', T('Repartir de zéro'), T('Efface les chiffres de l’établissement affiché'), function () { pilotage(function (X) { if (!fn(X, 'clearAll')) return false; X.clearAll(); }); }, { danger: true }] : null,
      Vr && fn(Vr, 'effacerAppareil') ? ['effacer', T('Effacer les données de cet appareil'), T('Tout Verdict, sur cet appareil seulement'), function () { Vr.effacerAppareil(); }, { danger: true }] : null
    ]);

    if (!E) sec('aide', T('Aide et documents'), [
      !F ? ['vera', T('Aide'), T('Demander à Vera'), function () { pilotage(function (X) { if (!fn(X, 'ouvrirAide')) return false; X.ouvrirAide(); }); }] : null,
      ['methodes', T('Méthodes et sources'), T('Comment Verdict calcule'), function () { nouvelOnglet('methodes-sources.html'); }],
      ['mentions', T('Mentions légales'), '', function () { nouvelOnglet(SITE + 'mentions-legales'); }],
      ['confidentialite', T('Confidentialité'), '', function () { nouvelOnglet(SITE + 'confidentialite'); }],
      ['cgv', T('Conditions générales de vente'), '', function () { nouvelOnglet(SITE + 'cgv'); }],
      ['contact', T('Contact'), '', function () { nouvelOnglet(SITE + 'contact'); }]
    ]);

    if (!E) {
      var NV = w.VerdictNouveautes, Mo = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
      sec('apropos', T('À propos'), [
        M && fn(M, 'etat') ? ['version', T('Version'), T('Vérification…'), null, { bouton: fn(M, 'verifier') ? T('Rechercher une mise à jour') : '' }] : null
      ], NV && NV.liste && NV.liste.length ? '<details class="vpa-nv"><summary>' + esc(T('Nouveautés')) + '</summary><ul>' + NV.liste.slice(0, 8).map(function (x) {
        var p = String(x.date || '').split('-'); return '<li>' + esc(x.titre) + (p.length === 3 ? ' <span>· ' + (+p[2]) + ' ' + Mo[+p[1] - 1] + '</span>' : '') + '</li>';
      }).join('') + '</ul></details>' : '');
    }
    return S;
  }
  function svg(k) { return '<svg class="vpa-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONES[k] + '</svg>'; }
  var ICONE_SECTION = { compte: 'compte', abonnement: 'abo', securite: 'securite', apparence: 'apparence', langue: 'langue', notifications: 'notif', etablissements: 'etabs', equipe: 'equipe', connexions: 'connexions', donnees: 'donnees', aide: 'aide', apropos: 'apropos' };

  /* ---------- feuille ---------- */
  var racine = null, actions = {};
  function ouvert() { return !!(racine && racine.parentNode); }
  function sectionVisible() { if (!racine) return ''; var b = racine.querySelector('.vpa-corps'), top = b ? b.scrollTop : 0, id = ''; [].forEach.call(racine.querySelectorAll('.vpa-sec'), function (s) { if (s.offsetTop - 80 <= top) id = s.getAttribute('data-sec'); }); return id; }
  function rendre(cible) {
    actions = {};
    var S = sections();
    /* C368 (décision 37) : une feuille posée sur l'appli, qui reste visible derrière ; croix en haut à droite ; se ferme aussi en
       touchant à côté, en glissant la barre vers le bas et avec Échap. */
    var html = '<div class="vpa-feuille"><div class="vpa-barre"><span class="vpa-poignee" aria-hidden="true"></span><h1 id="vpa-titre">' + esc(T('Paramètres')) + '</h1><button type="button" class="vpa-croix" data-fermer aria-label="' + esc(T('Fermer')) + '">×</button></div><div class="vpa-corps"><div class="vpa-page">' +
      S.map(function (s) {
        return '<section class="vpa-sec" data-sec="' + s.id + '" aria-labelledby="vpa-' + s.id + '"><h2 id="vpa-' + s.id + '">' + esc(s.titre) + '</h2>' +
          (s.lignes.length ? '<div class="vpa-liste">' + s.lignes.map(function (l) {
            var o = l[4] || {}, ic = svg(ICONE_SECTION[s.id] || 'apropos'), txt = '<span class="vpa-txt"><b>' + esc(l[1]) + '</b>' + (l[2] ? '<small' + (l[0] === 'version' ? ' class="vpa-version"' : '') + '>' + esc(l[2]) + '</small>' : '') + '</span>';
            if (typeof l[3] === 'function') actions[l[0]] = l[3];
            if (o.inactif) return '<div class="vpa-row vpa-inactif" data-l="' + l[0] + '"><span class="vpa-tile">' + ic + '</span>' + txt + '</div>';
            if ('interrupteur' in o) return o.interrupteur === null ? '<div class="vpa-row vpa-inactif" data-l="' + l[0] + '"><span class="vpa-tile">' + ic + '</span>' + txt + '</div>'
              : '<label class="vpa-row" data-l="' + l[0] + '"><span class="vpa-tile">' + ic + '</span>' + txt + '<input type="checkbox" role="switch" class="vpa-switch" data-notif' + (o.interrupteur ? ' checked' : '') + '></label>';
            if (o.bouton !== undefined) return '<div class="vpa-row" data-l="' + l[0] + '"><span class="vpa-tile">' + ic + '</span>' + txt.replace(/<\/span>$/, (o.bouton ? '<button type="button" class="vpa-mini vpa-sous" data-maj>' + esc(o.bouton) + '</button>' : '') + '</span>') + '</div>';
            if (l[3] === 'deconnexion') return '<button type="button" class="vpa-row" data-deconnexion><span class="vpa-tile">' + ic + '</span>' + txt + '<span class="vpa-chev" aria-hidden="true">›</span></button>' +
              '<div class="vpa-confirme" hidden><p>' + esc(T('Se déconnecter de Verdict sur cet appareil ?')) + '</p><button type="button" class="vpa-mini vpa-danger" data-deco-ok>' + esc(T('Se déconnecter')) + '</button><button type="button" class="vpa-mini" data-deco-non>' + esc(T('Annuler')) + '</button></div>';
            return '<button type="button" class="vpa-row' + (o.danger ? ' vpa-danger' : '') + '" data-l="' + l[0] + '"><span class="vpa-tile">' + ic + '</span>' + txt + '<span class="vpa-chev" aria-hidden="true">›</span></button>';
          }).join('') + '</div>' : '') + (s.extra ? '<div class="vpa-liste vpa-extra">' + s.extra + '</div>' : '') + '</section>';
      }).join('') + '</div></div></div>';
    if (!racine) {
      racine = doc.createElement('div'); racine.id = 'vd-param'; racine.tabIndex = -1; racine.setAttribute('role', 'dialog'); racine.setAttribute('aria-modal', 'true'); racine.setAttribute('aria-labelledby', 'vpa-titre');
      racine.addEventListener('click', clic); racine.addEventListener('change', changement); glisser(racine);
    }
    racine.innerHTML = html;
    if (!racine.parentNode) doc.body.appendChild(racine);
    var corps = racine.querySelector('.vpa-corps'), c = cible && racine.querySelector('[data-sec="' + cible + '"]');
    if (corps) corps.scrollTop = c ? Math.max(0, c.offsetTop - 8) : 0;
    version();
  }
  function version() {
    var M = w.VerdictMaj, vz = racine && racine.querySelector('.vpa-version'); if (!vz || !fn(M, 'etat')) return;
    M.etat().then(function (e) { if (e && e.texte && vz.isConnected && vz.textContent !== e.texte) vz.textContent = e.texte; }, function () {});
  }
  function clic(ev) {
    var t = ev.target;
    if (t === racine || t.closest('[data-fermer]')) return fermer();
    var th = t.closest('[data-theme]');
    if (th) { var Th = w.VerdictTheme, v = th.getAttribute('data-theme'); if (Th && fn(Th, 'choisir')) Th.choisir(v); [].forEach.call(racine.querySelectorAll('[data-theme]'), function (b) { var on = String(b === th); if (b.getAttribute('aria-checked') !== on) b.setAttribute('aria-checked', on); }); return; }
    var sa = t.closest('[data-saisie]');
    if (sa) {
      var Vp = cadre('frame-verdict'), sm = sa.getAttribute('data-saisie'); if (!Vp || !Vp.DB || !fn(Vp, 'save')) return;
      Vp.DB.saisieMode = sm; try { Vp.save('saisie-mode'); } catch (e) {}
      try { Vp.dispatchEvent(new Vp.CustomEvent('verdict:saisie-mode', { detail: { mode: sm } })); } catch (e) {}
      [].forEach.call(racine.querySelectorAll('[data-saisie]'), function (b) { var on = String(b === sa); if (b.getAttribute('aria-checked') !== on) b.setAttribute('aria-checked', on); });
      return;
    }
    var dc = t.closest('[data-deconnexion]');
    if (dc) { var cf = dc.nextElementSibling; if (cf) cf.hidden = !cf.hidden; return; }
    if (t.closest('[data-deco-non]')) { var c0 = t.closest('.vpa-confirme'); if (c0) c0.hidden = true; return; }
    var ok = t.closest('[data-deco-ok]');
    if (ok) { ok.disabled = true; deconnecter().catch(function () { ok.disabled = false; var p = ok.parentNode.querySelector('p'); if (p) p.textContent = T('Déconnexion impossible pour le moment. Réessayez.'); }); return; }
    var mj = t.closest('[data-maj]');
    if (mj) {
      var M = w.VerdictMaj, vz = racine.querySelector('.vpa-version'); if (!fn(M, 'verifier')) return; mj.disabled = true;
      M.verifier(function (x) { mj.textContent = x; }).then(function (e) { mj.disabled = false; mj.textContent = T('Rechercher une mise à jour'); if (e && e.texte && vz) vz.textContent = e.texte; }, function () { mj.disabled = false; mj.textContent = T('Rechercher une mise à jour'); if (vz) vz.textContent = T('Vérification impossible, réessayez.'); });
      return;
    }
    var row = t.closest('button.vpa-row[data-l]'); if (!row) return;
    var f = actions[row.getAttribute('data-l')], sx = row.closest('.vpa-sec'); retourSection = sx ? sx.getAttribute('data-sec') : '';
    if (f) try { f(); } catch (e) {}
    retourSection = '';
  }
  function changement(ev) {
    var t = ev.target;
    if (t.matches('[data-langue]')) return choisirLangue(t.value);
    if (t.matches('[data-notif]')) {
      var M = w.VerdictMaj; if (!M || !M.notifications || !fn(M.notifications, 'activer')) return; t.disabled = true;
      M.notifications.activer(t.checked).then(function (e) { t.disabled = false; t.checked = e === 'active'; var s = t.parentNode.querySelector('small'); if (s && e === 'refusee') s.textContent = T('Refusées : autorisez-les dans les réglages de l’appareil.'); }, function () { t.disabled = false; });
    }
  }
  /* Glisser la barre vers le bas : la feuille suit le doigt ; au-delà de 80 px elle se ferme, sinon elle revient. */
  function glisser(r) {
    var y0 = null, dy = 0, f = null;
    r.addEventListener('touchstart', function (e) { if (!e.target.closest('.vpa-barre') || e.target.closest('[data-fermer]')) return; y0 = e.touches[0].clientY; dy = 0; f = r.querySelector('.vpa-feuille'); }, { passive: true });
    r.addEventListener('touchmove', function (e) { if (y0 === null || !f) return; dy = Math.max(0, e.touches[0].clientY - y0); f.style.transform = dy ? 'translateY(' + dy + 'px)' : ''; }, { passive: true });
    r.addEventListener('touchend', function () { if (y0 === null) return; var fin = dy > 80; y0 = null; if (f) f.style.transform = ''; if (fin) fermer(); });
  }
  function cle(ev) { if (ev.key === 'Escape' && ouvert() && !doc.querySelector('#vr16:not([hidden]),#r18-connections:not([hidden]),#vx41-feuille')) fermer(); }
  var focusAvant = null;
  function ouvrir(section) {
    if (!doc.body) return;
    if (!ouvert()) focusAvant = doc.activeElement;
    rendre(section);
    doc.documentElement.classList.add('vd-param-ouvert');
    try { racine.focus({ preventScroll: true }); } catch (e) {}
  }
  function fermer() {
    if (!ouvert()) return;
    racine.parentNode.removeChild(racine);
    doc.documentElement.classList.remove('vd-param-ouvert');
    if (focusAvant && focusAvant.focus) try { focusAvant.focus({ preventScroll: true }); } catch (e) {}
    focusAvant = null;
  }
  doc.addEventListener('keydown', cle);

  /* ---------- styles (posés au chargement : l'écran apparaît entier, décision 27) ---------- */
  /* Niveau 80 : au-dessus de l'en-tête et du dock (60) ; sous la cloche (90), les connexions (1200), Mes appareils et le verrou,
     qui s'ouvrent donc par-dessus Paramètres et y ramènent en se fermant. */
  var css = doc.createElement('style'); css.id = 'vd-param-css';
  css.textContent =
    '#vd-param{--pa-bg:#f3f5f7;--pa-card:#fff;--pa-line:#e3e8ee;--pa-txt:#0f172a;--pa-sub:#5b6878;--pa-tile:#eef6f1;--pa-ic:#15803d;--pa-danger:#b42318;--pa-seg:#e8ecf1;' +
    'position:fixed;inset:0;z-index:80;outline:none;display:flex;align-items:flex-end;justify-content:center;padding-top:calc(env(safe-area-inset-top,0px) + 22px);background:rgba(15,23,42,.36);color:var(--pa-txt);font:500 16px/1.4 -apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif;-webkit-text-size-adjust:100%}' +
    'html.vd-workspace-dark #vd-param{background:rgba(0,0,0,.48)}' +
    '#vd-param .vpa-feuille{display:flex;flex-direction:column;width:min(100%,760px);height:100%;background:var(--pa-bg);border-radius:20px 20px 0 0;overflow:hidden;box-shadow:0 -12px 40px rgba(0,0,0,.25);transition:transform .18s ease-out}' +
    '@media (min-width:700px){#vd-param{align-items:center;padding:4vh 16px}#vd-param .vpa-feuille{height:min(92vh,980px);border-radius:20px}}' +
    'html.vd-workspace-dark #vd-param{--pa-bg:#08090b;--pa-card:#11161d;--pa-line:#222b36;--pa-txt:#f1f5f9;--pa-sub:#9aa7b6;--pa-tile:#14251c;--pa-ic:#4ade80;--pa-danger:#f87171;--pa-seg:#1a212b}' +
    '#vd-param *{box-sizing:border-box}' +
    '#vd-param .vpa-barre{position:relative;display:flex;align-items:center;gap:8px;min-height:60px;padding:14px 12px 8px 20px;background:var(--pa-bg);border-bottom:1px solid var(--pa-line);flex:0 0 auto;touch-action:none}' +
    '#vd-param .vpa-poignee{position:absolute;top:6px;left:50%;width:40px;height:5px;margin-left:-20px;border-radius:3px;background:var(--pa-line)}' +
    '#vd-param .vpa-croix{margin-left:auto;width:40px;height:40px;flex:0 0 40px;border:0;border-radius:50%;background:var(--pa-seg);color:var(--pa-txt);font:400 24px/1 -apple-system,system-ui,sans-serif;cursor:pointer;padding:0 0 2px}' +
    '#vd-param h1{margin:0;font:800 20px/1.2 -apple-system,system-ui,sans-serif;letter-spacing:-.01em;color:var(--pa-txt)}' +
    '#vd-param .vpa-corps{flex:1 1 auto;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}' +
    '#vd-param .vpa-page{max-width:720px;margin:0 auto;padding:18px 16px calc(40px + env(safe-area-inset-bottom,0px))}' +
    '#vd-param .vpa-sec{margin:0 0 22px}#vd-param .vpa-sec h2{margin:0 6px 8px;font:700 12px/1.2 -apple-system,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--pa-sub)}' +
    '#vd-param .vpa-liste{border-radius:16px;background:var(--pa-card);border:1px solid var(--pa-line);overflow:hidden}#vd-param .vpa-liste+.vpa-liste{margin-top:10px}' +
    '#vd-param .vpa-row{display:flex;align-items:center;gap:12px;width:100%;min-height:60px;margin:0;padding:10px 14px;border:0;background:transparent;color:var(--pa-txt);text-align:left;cursor:pointer;font:inherit}' +
    '#vd-param .vpa-row+.vpa-row,#vd-param .vpa-confirme+.vpa-row{border-top:1px solid var(--pa-line)}#vd-param button.vpa-row:active,#vd-param button.vpa-row:hover{background:rgba(22,163,74,.07)}' +
    '#vd-param .vpa-tile{display:flex;align-items:center;justify-content:center;width:36px;height:36px;flex:0 0 36px;border-radius:10px;background:var(--pa-tile);color:var(--pa-ic)}#vd-param .vpa-ic{width:20px;height:20px}' +
    '#vd-param .vpa-txt{flex:1 1 auto;min-width:0}#vd-param .vpa-txt b{display:block;font:650 16px/1.25 -apple-system,system-ui,sans-serif;color:inherit;overflow-wrap:anywhere}' +
    '#vd-param .vpa-txt small{display:block;margin-top:2px;font:400 13.5px/1.35 -apple-system,system-ui,sans-serif;color:var(--pa-sub);overflow-wrap:anywhere}' +
    '#vd-param .vpa-chev{font:400 24px/1 -apple-system,system-ui,sans-serif;color:var(--pa-sub);opacity:.7}' +
    '#vd-param .vpa-danger .vpa-txt b{color:var(--pa-danger)}#vd-param .vpa-inactif{cursor:default}#vd-param .vpa-inactif .vpa-txt b{color:var(--pa-sub)}#vd-param .vpa-inactif .vpa-tile{opacity:.6}' +
    '#vd-param .vpa-mini{flex:0 0 auto;min-height:40px;padding:0 14px;border-radius:10px;border:1px solid var(--pa-line);background:var(--pa-seg);color:var(--pa-txt);font:650 14px -apple-system,system-ui,sans-serif;cursor:pointer}' +
    '#vd-param .vpa-mini.vpa-sous{display:block;margin-top:8px}#vd-param .vpa-mini.vpa-danger{background:var(--pa-danger);border-color:var(--pa-danger);color:#fff}#vd-param .vpa-mini:disabled{opacity:.6}' +
    '#vd-param .vpa-confirme{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:4px 14px 14px 62px}#vd-param .vpa-confirme[hidden]{display:none}#vd-param .vpa-confirme p{flex:1 1 100%;margin:0;color:var(--pa-sub);font-size:14px}' +
    '#vd-param .vpa-switch{-webkit-appearance:none;appearance:none;flex:0 0 51px;width:51px;height:31px;margin:0;border-radius:16px;background:var(--pa-seg);border:1px solid var(--pa-line);position:relative;cursor:pointer;transition:background .2s}' +
    '#vd-param .vpa-switch::after{content:"";position:absolute;top:2px;left:2px;width:25px;height:25px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s}' +
    '#vd-param .vpa-switch:checked{background:#16a34a;border-color:#16a34a}#vd-param .vpa-switch:checked::after{transform:translateX(20px)}' +
    '#vd-param .vpa-extra{padding:12px 14px}#vd-param .vpa-extra .vpa-row{padding:0;min-height:48px}' +
    '#vd-param .vpa-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border-radius:12px;background:var(--pa-seg)}' +
    '#vd-param .vpa-seg button{min-height:40px;border:0;border-radius:9px;background:transparent;color:var(--pa-txt);font:600 14.5px -apple-system,system-ui,sans-serif;cursor:pointer;padding:0 6px}' +
    '#vd-param .vpa-seg button[aria-checked="true"]{background:var(--pa-card);box-shadow:0 1px 3px rgba(0,0,0,.18);color:var(--pa-ic)}html.vd-workspace-dark #vd-param .vpa-seg button[aria-checked="true"]{background:#2a3442}' +
    '#vd-param .vpa-note{margin:8px 2px 0;color:var(--pa-sub);font-size:13px}' +
    '#vd-param .vpa-titre-extra{margin:0 2px 10px}#vd-param .vpa-titre-extra b{display:block;font:650 16px/1.25 -apple-system,system-ui,sans-serif}#vd-param .vpa-titre-extra small{display:block;margin-top:2px;color:var(--pa-sub);font-size:13.5px}' +
    '#vd-param select{flex:0 1 auto;max-width:48%;min-height:40px;padding:0 10px;border-radius:10px;border:1px solid var(--pa-line);background:var(--pa-seg);color:var(--pa-txt);font:600 15px -apple-system,system-ui,sans-serif}' +
    '#vd-param .vpa-nv summary{cursor:pointer;min-height:40px;align-content:center;font-weight:650;color:var(--pa-txt)}#vd-param .vpa-nv ul{margin:6px 0 0;padding-left:18px;color:var(--pa-sub);font-size:13.5px}#vd-param .vpa-nv li{margin:0 0 6px}#vd-param .vpa-nv li span{white-space:nowrap;opacity:.8}' +
    '#vd-param button:focus-visible,#vd-param select:focus-visible,#vd-param input:focus-visible,#vd-param summary:focus-visible{outline:2px solid #16a34a;outline-offset:2px}' +
    'html.vd-param-ouvert,html.vd-param-ouvert body{overflow:hidden!important}';
  (doc.head || doc.documentElement).appendChild(css);

  w.VerdictParametres = { ouvrir: ouvrir, fermer: fermer, ouvert: ouvert, _sections: sections };
})();
