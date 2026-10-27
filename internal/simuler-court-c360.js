/* C360 (T2, campagne simplicité C344, décision 33 n° 6) — Simuler court, 23/10/2026.
   Rapport : 13-RAPPORTS-ET-MANIFESTES/SIMPLICITE/T2-dark-kitchen.md (Simuler faisait 9,8 hauteurs d'iPhone, le même bloc
   « Résultat / Indice / Rentabilité » répété 16 fois, la commission au 7e curseur pour une dark kitchen).
   1. Un seul bloc « Aujourd'hui → Après vos changements », collé en haut : résultat sur un an, Indice de sérénité, ce qui
      reste pour 100 € vendus. Il lit decImpactTotal(), le calcul de « Le total de vos changements » : rien de nouveau.
   2. Chaque levier tient sur une ligne (nom, valeur, gain) et se déplie au toucher (curseur, explication). Ses colonnes
      « Aujourd'hui / Après simulation » et son gain sont masqués : le bloc du haut les dit une fois.
   3. Les leviers sont classés selon le métier : livraison (dark kitchen, ou 80 % des ventes livrées) commission, prix et
      panier d'abord ; food truck prix, panier, commandes ; restaurant panier, prix, nourriture, équipe.
   4. « Le total de vos changements » et la barre flottante du bas sont masqués : doublons du bloc du haut.
   5. Le registre des décisions (traçabilité, estimé ≠ observé) et le journal des gains quittent Simuler pour l'onglet
      « Mes décisions » d'À faire (vue v-mesdec).
   Aucun calcul ne change : chaque enveloppe rend la valeur de la fonction d'origine, et les lignes recopient ce que les
   cartes d'origine affichent (même valeur, même format). Au repos, rien n'est réécrit (chaque écriture compare d'abord). */
(function (w) {
  'use strict';
  var doc = w.document;
  if (w.__vdC360) return;
  w.__vdC360 = true;

  /* ── Textes (7 langues ; ordre en, es, it, de, nl, pt) : versés dans le dictionnaire TR de Pilotage ── */
  var ORDER = ['en', 'es', 'it', 'de', 'nl', 'pt'];
  var D = {
    'Aujourd’hui': ['Today', 'Hoy', 'Oggi', 'Heute', 'Vandaag', 'Hoje'],
    'Après': ['After', 'Después', 'Dopo', 'Danach', 'Na', 'Depois'],
    'Comment c’est calculé': ['How it is calculated', 'Cómo se calcula', 'Come viene calcolato', 'Wie es berechnet wird', 'Hoe het wordt berekend', 'Como é calculado'],
    'Après vos changements': ['After your changes', 'Después de sus cambios', 'Dopo le sue modifiche', 'Nach Ihren Änderungen', 'Na uw wijzigingen', 'Depois das suas alterações'],
    'Résultat sur un an': ['Result over a year', 'Resultado en un año', 'Risultato su un anno', 'Ergebnis über ein Jahr', 'Resultaat over een jaar', 'Resultado num ano'],
    'Indice de sérénité': ['Serenity index', 'Índice de serenidad', 'Indice di serenità', 'Gelassenheitsindex', 'Sereniteitsindex', 'Índice de serenidade'],
    'Pour 100 € vendus': ['Per €100 sold', 'Por cada 100 € vendidos', 'Per 100 € venduti', 'Je 100 € Umsatz', 'Per € 100 verkocht', 'Por cada 100 € vendidos'],
    'Aucun changement pour l’instant : touchez un levier pour le régler.': ['No change yet: tap a lever to adjust it.', 'Ningún cambio por ahora: toque una palanca para ajustarla.', 'Nessuna modifica per ora: tocchi una leva per regolarla.', 'Noch keine Änderung: tippen Sie auf einen Hebel, um ihn einzustellen.', 'Nog geen wijziging: tik op een hefboom om hem in te stellen.', 'Nenhuma alteração por agora: toque numa alavanca para a ajustar.'],
    'par an avec vos changements': ['per year with your changes', 'al año con sus cambios', 'all’anno con le sue modifiche', 'pro Jahr mit Ihren Änderungen', 'per jaar met uw wijzigingen', 'por ano com as suas alterações'],
    'Remettre à zéro': ['Reset', 'Poner a cero', 'Azzera', 'Zurücksetzen', 'Op nul zetten', 'Repor a zero'],
    'Mes décisions': ['My decisions', 'Mis decisiones', 'Le mie decisioni', 'Meine Entscheidungen', 'Mijn beslissingen', 'As minhas decisões'],
    'Ce que vous avez décidé, ce qui est en cours et ce qui a été mesuré, avec le journal des gains.': ['What you decided, what is under way and what has been measured, with the gains log.', 'Lo que ha decidido, lo que está en curso y lo que se ha medido, con el registro de ganancias.', 'Ciò che ha deciso, ciò che è in corso e ciò che è stato misurato, con il registro dei guadagni.', 'Was Sie entschieden haben, was läuft und was gemessen wurde, mit dem Gewinnjournal.', 'Wat u hebt besloten, wat loopt en wat is gemeten, met het winstlogboek.', 'O que decidiu, o que está em curso e o que foi medido, com o registo de ganhos.'],
    'Aucune décision pour l’instant. Elles s’ajoutent ici depuis Simuler et À faire.': ['No decision yet. They are added here from Simulate and To do.', 'Ninguna decisión por ahora. Se añaden aquí desde Simular y Por hacer.', 'Nessuna decisione per ora. Si aggiungono qui da Simula e Da fare.', 'Noch keine Entscheidung. Sie kommen hier aus Simulieren und Zu tun hinzu.', 'Nog geen beslissing. Ze worden hier toegevoegd vanuit Simuleren en Te doen.', 'Nenhuma decisão por agora. São acrescentadas aqui a partir de Simular e A fazer.']
  };
  function installerTextes() {
    if (typeof w.TR !== 'object' || !w.TR || typeof w.TR_ORDER === 'undefined') return false;
    var pos = ORDER.map(function (l) { return w.TR_ORDER.indexOf(l); });
    Object.keys(D).forEach(function (k) {
      var row = w.TR[k] || [];
      for (var i = 0; i < ORDER.length; i++) if (pos[i] >= 0 && !row[pos[i]]) row[pos[i]] = D[k][i];
      w.TR[k] = row;
    });
    try { w._trIdx = null; w._trKeys = null; w._trTplCache = null; w._trCountCache = -1; w._trTextMemo = { lang: '', count: -1, values: Object.create(null), order: [] }; } catch (e) {}
    return true;
  }
  /* Texte dans la langue en cours (le traducteur de Pilotage ne repasse pas sur une ligne mise à jour par un curseur). */
  function t(fr) {
    var l = w.LOCALE || 'fr', i = ORDER.indexOf(l);
    return i >= 0 && D[fr] && D[fr][i] ? D[fr][i] : fr;
  }

  /* ── Écritures sans effet au repos : on n'écrit que si la valeur change ── */
  function setTexte(el, v) { if (el && el.textContent !== v) el.textContent = v; }
  function setAttr(el, a, v) { if (el && el.getAttribute(a) !== v) el.setAttribute(a, v); }
  function basculer(el, c, on) { if (el) el.classList.toggle(c, !!on); }
  function setOrdre(el, n) { var v = String(n); if (el && el.style.order !== v) el.style.order = v; }

  /* ── Métier : l'ordre des leviers ── */
  var ORDRES = {
    livraison: ['com', 'carte', 'panier', 'cmd', 'fc', 'boi', 'emb', 'sal', 'fix', 'jour'],
    foodtruck: ['carte', 'panier', 'cmd', 'fc', 'boi', 'jour', 'sal', 'fix', 'emb', 'com'],
    restaurant: ['panier', 'carte', 'fc', 'boi', 'sal', 'fix', 'cmd', 'jour', 'emb', 'com']
  };
  function metier() {
    var f = '';
    try { f = String(typeof w.fmtActif === 'function' ? w.fmtActif() || '' : ''); } catch (e) {}
    var m = String((w.DB && w.DB.modele) || '');
    if (/dark ?kitchen/i.test(f) || /dark ?kitchen/i.test(m)) return 'livraison';
    try { var L = typeof w.verdictLivraison === 'function' ? w.verdictLivraison(w.DB) : null; if (L && L.part >= 80) return 'livraison'; } catch (e) {}
    if (/food ?truck/i.test(f) || /food ?truck/i.test(m)) return 'foodtruck';
    return 'restaurant';
  }

  /* ── Le bloc « Aujourd'hui → Après vos changements » ── */
  function nombre(x, dec) { try { return w.fr(x, dec); } catch (e) { return String(Math.round(x * 10) / 10).replace('.', ','); } }
  function signe(x) { return x < 0 ? '−' : ''; }
  function pour100(rn) { var v = Number(rn); return isFinite(v) ? signe(v) + nombre(Math.abs(v), 1) + ' €' : '—'; }
  function euros(x) { var v = Number(x); if (!isFinite(v)) return '—'; try { return w.eur(v); } catch (e) { return signe(v) + nombre(Math.abs(v), 0) + ' €'; } }
  function blocHTML() {
    var ligne = function (k, a, b) {
      return '<div class="c360-l"><span class="c360-k">' + k + '</span><b class="c360-a" data-c360="' + a + '"></b>' +
        '<span class="c360-fl" aria-hidden="true">→</span><b class="c360-b" data-c360="' + b + '"></b></div>';
    };
    return '<div class="c360-grille"><div class="c360-l c360-tete"><span class="c360-k"></span><span class="c360-a">Aujourd’hui</span>' +
      '<span class="c360-fl" aria-hidden="true">→</span><span class="c360-b">Après</span></div>' +
      ligne('Résultat sur un an', 'r0', 'r1') + ligne('Indice de sérénité', 's0', 's1') + ligne('Pour 100 € vendus', 'n0', 'n1') + '</div>' +
      '<div class="c360-pied"><p class="c360-vide">Aucun changement pour l’instant : touchez un levier pour le régler.</p>' +
      '<p class="c360-gain"><b data-c360="g"></b> <span>par an avec vos changements</span></p>' +
      '<span class="c360-actions">' + (typeof w.decEnDecision === 'function' ? '<button type="button" class="c360-zero c360-decider" onclick="decEnDecision()">J’en fais une décision</button>' : '') +
      '<button type="button" class="c360-zero" onclick="decResetAll()">Remettre à zéro</button></span></div>';
  }
  function tonalite(el, avant, apres, plusEstMieux) {
    var d = (Number(apres) - Number(avant)) * (plusEstMieux ? 1 : -1);
    basculer(el, 'c360-mieux', d > 0.0001); basculer(el, 'c360-moins', d < -0.0001);
  }
  function actifs() { try { return typeof w.decLeviersActifs === 'function' ? w.decLeviersActifs().length : 0; } catch (e) { return 0; } }
  function majBloc(corps) {
    var T = null;
    try { T = typeof w.decImpactTotal === 'function' ? w.decImpactTotal() : null; } catch (e) { T = null; }
    var b = doc.getElementById('c360Bloc');
    if (!T) { if (b) basculer(b, 'c360-attente', true); return; }
    if (!b) {
      /* Pas de classe « card » : simplifie-a20 (C76) masque toute carte placée avant le point de départ. */
      b = doc.createElement('div'); b.id = 'c360Bloc'; b.className = 'c360-bloc'; b.setAttribute('role', 'region');
      b.setAttribute('aria-label', t('Aujourd’hui') + ' → ' + t('Après vos changements'));
      b.innerHTML = blocHTML();
      corps.insertBefore(b, corps.firstChild);
      if ((w.LOCALE || 'fr') !== 'fr' && typeof w.translateDOM === 'function') { try { w.translateDOM(b); } catch (e) {} }
    } else if (b.parentNode !== corps) corps.insertBefore(b, corps.firstChild);
    basculer(b, 'c360-attente', false);
    var q = function (k) { return b.querySelector('[data-c360="' + k + '"]'); }, n = actifs();
    setTexte(q('r0'), euros(T.before)); setTexte(q('r1'), euros(T.after)); tonalite(q('r1'), T.before, T.after, true);
    setTexte(q('s0'), T.score0 + ' /100'); setTexte(q('s1'), T.score1 + ' /100'); tonalite(q('s1'), T.score0, T.score1, true);
    setTexte(q('n0'), pour100(T.rn0)); setTexte(q('n1'), pour100(T.rn1)); tonalite(q('n1'), T.rn0, T.rn1, true);
    var g = Number(T.delta) || 0;
    setTexte(q('g'), (g >= 0 ? '+' : '−') + euros(Math.abs(g)));
    tonalite(q('g'), 0, g, true);
    basculer(b, 'c360-repos', !n);
  }

  /* ── Une ligne par levier ── */
  var OUVERTS = {};
  function texteCarte(card, sel) { var e = card.querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function majLigne(card) {
    var id = card.getAttribute('data-dec'); if (!id) return;
    var l = card.querySelector(':scope > .c360-ligne');
    if (!l) {
      l = doc.createElement('button'); l.type = 'button'; l.className = 'c360-ligne';
      l.innerHTML = '<span class="c360-nom"></span><span class="c360-val"></span><span class="c360-g"></span><span class="c360-chev" aria-hidden="true">›</span>';
      l.addEventListener('click', function () {
        var ouvert = !card.classList.contains('c360-ouvert');
        OUVERTS[id] = ouvert; basculer(card, 'c360-ouvert', ouvert); setAttr(l, 'aria-expanded', ouvert ? 'true' : 'false');
      });
      card.insertBefore(l, card.firstChild);
    }
    basculer(card, 'c360-lev', true);
    basculer(card, 'c360-ouvert', !!OUVERTS[id]); setAttr(l, 'aria-expanded', OUVERTS[id] ? 'true' : 'false');
    setTexte(l.querySelector('.c360-nom'), texteCarte(card, ':scope > h3'));
    /* Valeur : celle que la carte d'origine affiche (Aujourd'hui, puis Après simulation si le curseur a bougé). */
    /* Seule la valeur (avant « · », qui ouvre une explication) tient sur la ligne ; l'explication reste dans le levier déplié. */
    var court = function (s) { return s.split(' · ')[0]; };
    var avant = court(texteCarte(card, '.dec-col:not(.after) .big')), apres = court(texteCarte(card, '#da-lev-' + id));
    var st = w.DEC_STATE && w.DEC_STATE[id], bouge = st != null && Number(st) !== 0;
    setTexte(l.querySelector('.c360-val'), bouge && apres && apres !== avant ? avant + ' → ' + apres : avant);
    /* Gain : celui que la carte d'origine affiche (#da-gain-id), seulement si le levier a bougé. */
    var gEl = card.querySelector('#da-gain-' + id), gv = gEl ? Number(gEl.dataset.cur) : NaN, gx = l.querySelector('.c360-g');
    setTexte(gx, bouge && gEl ? gEl.textContent.replace(/\s+/g, ' ').trim() : '');
    basculer(gx, 'c360-mieux', bouge && gv > 0); basculer(gx, 'c360-moins', bouge && gv < 0);
  }
  function majLeviers(corps) {
    var ordre = ORDRES[metier()] || ORDRES.restaurant;
    [].forEach.call(corps.querySelectorAll(':scope > .dec-card[data-dec]'), function (card) {
      majLigne(card);
      var i = ordre.indexOf(card.getAttribute('data-dec'));
      setOrdre(card, 10 + (i < 0 ? ordre.length : i));
    });
  }

  /* Le point de départ (gain-realiste-a24, L7) garde son titre, ses leviers, son gain et son bouton ; les explications et les
     trois lignes « Nouveau résultat / indice / rentabilité » (le bloc du haut les dira une fois appliqué) passent derrière
     « Comment c'est calculé ». Présentation seulement : rien n'est retiré du document. */
  var DETAIL = false;
  function compacterDepart() {
    var c = doc.getElementById('decBestCard'); if (!c) return;
    var bt = c.querySelector(':scope > .c360-comment');
    if (!bt) {
      bt = doc.createElement('button'); bt.type = 'button'; bt.className = 'c360-comment';
      bt.innerHTML = '<span>' + t('Comment c’est calculé') + '</span><span class="c360-chev" aria-hidden="true">›</span>';
      bt.addEventListener('click', function () { DETAIL = !DETAIL; basculer(c, 'c360-detail', DETAIL); setAttr(bt, 'aria-expanded', DETAIL ? 'true' : 'false'); });
      c.appendChild(bt);
    }
    basculer(c, 'c360-detail', DETAIL); setAttr(bt, 'aria-expanded', DETAIL ? 'true' : 'false');
  }
  function simuler() {
    var corps = doc.getElementById('decBody'); if (!corps) return;
    basculer(doc.getElementById('v-dec'), 'c360', true);
    majBloc(corps); majLeviers(corps); compacterDepart();
  }

  /* ── Enveloppes : la valeur d'origine est toujours rendue telle quelle ── */
  function envelopper(nom, apres) {
    var f = w[nom]; if (typeof f !== 'function' || f.__c360) return false;
    var g = function () { var r = f.apply(this, arguments); try { apres.apply(this, arguments); } catch (e) {} return r; };
    g.__c360 = true; g.__orig = f; w[nom] = g; return true;
  }
  envelopper('drawDec', simuler);
  /* Les curseurs fluides (fluidite-a25) reportent la mise à jour à l'image suivante : on suit donc les fonctions qui
     redessinent vraiment, la carte d'un levier (decRender) et le total (decDrawTotal), pas decMove. */
  envelopper('decRender', function (id) {
    var corps = doc.getElementById('decBody'); if (!corps) return;
    var card = corps.querySelector(':scope > .dec-card[data-dec="' + id + '"]'); if (card) majLigne(card);
  });
  envelopper('decDrawTotal', function () { var corps = doc.getElementById('decBody'); if (corps && w.VIEW === 'dec') majBloc(corps); });
  /* Fin de la lecture guidée (« Utiliser comme point de départ ») : elle descendait vers le total, masqué ; on remonte au bloc. */
  envelopper('decSceneTotal', function () {
    var b = doc.getElementById('c360Bloc'); if (!b) return;
    try { w.scrollTo({ top: 0, behavior: (typeof w.scReduced === 'function' && w.scReduced()) ? 'auto' : 'smooth' }); } catch (e) {}
  });

  /* ── « Mes décisions », onglet d'À faire (vue v-mesdec) ── */
  function vueMesDecisions() {
    var v = doc.getElementById('v-mesdec');
    if (v) return v;
    var p = doc.getElementById('v-priorities'); if (!p || !p.parentNode) return null;
    v = doc.createElement('section'); v.className = 'view'; v.id = 'v-mesdec'; v.setAttribute('aria-hidden', 'true'); v.setAttribute('data-chr-view', 'priorities');
    v.innerHTML = '<h1>Mes décisions</h1><p class="sub c360-sub">Ce que vous avez décidé, ce qui est en cours et ce qui a été mesuré, avec le journal des gains.</p><div id="c360Decisions"></div>';
    p.parentNode.insertBefore(v, p.nextSibling);
    return v;
  }
  /* Les identifiants d'origine (decRegistre, journalGains) restent à Simuler, masqués : les mises à jour de L7 et du journal
     (getElementById) continuent de viser leur copie, et la vue « Mes décisions » est redessinée à chaque ouverture. */
  function dessinerMesDecisions() {
    var v = vueMesDecisions(); if (!v) return;
    var box = doc.getElementById('c360Decisions'), h = '';
    try { if (typeof w.decisionsRegistreHTML === 'function') h += w.decisionsRegistreHTML(); } catch (e) {}
    try { if (typeof w.journalGainsHTML === 'function') h += w.journalGainsHTML(); } catch (e) {}
    h = h.replace('id="decRegistre"', 'id="c360Registre"').replace('id="journalGains"', 'id="c360Journal"');
    if (!h) h = '<div class="card"><p class="note" style="margin:0">Aucune décision pour l’instant. Elles s’ajoutent ici depuis Simuler et À faire.</p></div>';
    if (box.innerHTML !== h) box.innerHTML = h;
    try { if (typeof w.actBarInject === 'function') w.actBarInject('mesdec'); } catch (e) {}
  }
  if (typeof w.renderViewContent === 'function' && !w.renderViewContent.__c360) {
    var rvc = w.renderViewContent;
    w.renderViewContent = function (v) {
      /* Pas de chrCockpitApply : il poserait l'encadré générique « En bref / D'où viennent ces chiffres » (décision 33 n° 8). */
      if (v === 'mesdec') { dessinerMesDecisions(); return; }
      return rvc.apply(this, arguments);
    };
    w.renderViewContent.__c360 = true; w.renderViewContent.__orig = rvc;
    try { w._renderViewContent = w.renderViewContent; } catch (e) {}
  }
  if (typeof w.actBarHTML === 'function' && !w.actBarHTML.__c360) {
    var abh = w.actBarHTML;
    w.actBarHTML = function (cur) {
      var h = abh.apply(this, arguments);
      vueMesDecisions(); /* go('mesdec') exige que #v-mesdec existe avant le premier dessin */
      if (/go\(\\?'mesdec\\?'\)/.test(h)) return h;
      var bt = '<button class="' + (cur === 'mesdec' ? 'on' : '') + '" onclick="go(\'mesdec\')">' + t('Mes décisions') + '</button>';
      var i = h.lastIndexOf('</div>');
      return i > 0 ? h.slice(0, i) + bt + h.slice(i) : h + bt;
    };
    w.actBarHTML.__c360 = true; w.actBarHTML.__orig = abh;
  }
  if (typeof w.mainNavView === 'function' && !w.mainNavView.__c360) {
    var mnv = w.mainNavView;
    w.mainNavView = function (v) { return mnv.call(this, v === 'mesdec' ? 'priorities' : v); };
    w.mainNavView.__c360 = true; w.mainNavView.__orig = mnv;
  }

  /* ── Styles (clair et sombre) ── */
  var css = doc.createElement('style'); css.id = 'vd-c360';
  css.textContent =
    /* Ordre de Simuler : le bloc, le point de départ, les leviers, la note ; doublons masqués. */
    '#v-dec.c360 #decBody>#c360Bloc{order:-2}#v-dec.c360 #decBody>#decBestCard{order:-1}' +
    '#v-dec.c360 #decBody>#decTotal,#v-dec.c360 #decBody>#decRegistre,#v-dec.c360 #decBody>#journalGains{display:none!important}' +
    /* La barre de synthèse (#decTotalBar, posée dans <body> par decDrawTotal) : son « J'en fais une décision » et son
       « Remettre à zéro » sont repris dans le pied du bloc du haut. */
    '#v-dec.c360 #decBody>.note{order:60}html.vd-c360 #decTotalBar{display:none!important}#v-dec.c360{padding-bottom:28px!important}' +
    /* Le bloc collé en haut */
    '#c360Bloc{display:block;position:sticky;top:0;z-index:6;margin:0 0 12px;padding:12px 14px 10px;border-radius:16px;color:var(--txt,#0f172a);' +
      'background:#ffffff!important;border:1px solid #dfe5e9!important;box-shadow:0 8px 22px rgba(15,23,42,.10)!important}' +
    'html:not(.vd-workspace-light) #c360Bloc{background:#14181d!important;border-color:rgba(255,255,255,.12)!important;box-shadow:0 10px 26px rgba(0,0,0,.45)!important}' +
    '#c360Bloc .c360-grille{display:grid;grid-template-columns:minmax(0,1fr) auto 14px auto;align-items:baseline;column-gap:8px;row-gap:5px}' +
    '#c360Bloc .c360-l{display:contents}' +
    '#c360Bloc .c360-k{font-size:13px;color:var(--mut,#64748b);min-width:0}' +
    '#c360Bloc .c360-a,#c360Bloc .c360-b{font-family:var(--mono,ui-monospace,monospace);font-size:15px;font-weight:700;text-align:right;white-space:nowrap;color:var(--txt,#0f172a)}' +
    '#c360Bloc .c360-a{color:var(--mut,#64748b);font-weight:600}' +
    '#c360Bloc .c360-fl{text-align:center;color:var(--mut,#64748b);font-size:12px}' +
    '#c360Bloc .c360-tete span{font-family:inherit!important;font-size:11px!important;font-weight:700!important;letter-spacing:.06em;text-transform:uppercase;color:var(--mut,#64748b)!important;padding-bottom:4px;border-bottom:1px solid var(--line,rgba(127,127,127,.2))}' +
    '#c360Bloc .c360-mieux{color:#15803d!important}#c360Bloc .c360-moins{color:#dc2626!important}' +
    'html:not(.vd-workspace-light) #c360Bloc .c360-mieux{color:#4ade80!important}html:not(.vd-workspace-light) #c360Bloc .c360-moins{color:#f87171!important}' +
    '#c360Bloc.c360-repos .c360-b{color:var(--mut,#64748b)!important;font-weight:600}' +
    '#c360Bloc .c360-pied{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px;min-height:30px}' +
    '#c360Bloc .c360-pied p{margin:0;font-size:13px;color:var(--mut,#64748b)}#c360Bloc .c360-gain b{font-family:var(--mono,ui-monospace,monospace);font-size:16px;font-weight:800}' +
    '#c360Bloc.c360-repos .c360-gain,#c360Bloc.c360-repos .c360-actions,#c360Bloc:not(.c360-repos) .c360-vide{display:none}' +
    '#c360Bloc .c360-pied{flex-wrap:wrap}#c360Bloc .c360-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}' +
    '#c360Bloc .c360-decider{background:#15803d;border-color:#15803d;color:#fff}' +
    '#c360Bloc .c360-zero{flex:none;font-size:12.5px;font-weight:700;padding:7px 11px;border-radius:10px;border:1px solid var(--line,rgba(127,127,127,.3));background:transparent;color:var(--txt,#0f172a);cursor:pointer}' +
    '#c360Bloc.c360-attente{visibility:hidden}' +
    /* Grand écran : les chiffres restent près de leur libellé. */
    '@media (min-width:700px){#c360Bloc .c360-grille,#c360Bloc .c360-pied{max-width:640px}}' +
    /* Une ligne par levier, dépliée au toucher */
    '#v-dec.c360 .dec-card.c360-lev{padding:0!important;overflow:hidden}' +
    /* Replié : la ligne seule. Déplié : tout sauf le titre (la ligne le dit) ; chaque élément garde son affichage d'origine. */
    '#v-dec.c360 .dec-card.c360-lev:not(.c360-ouvert)>*:not(.c360-ligne),#v-dec.c360 .dec-card.c360-lev>h3{display:none!important}' +
    '#v-dec.c360 .dec-card.c360-lev.c360-ouvert [id^="dr-"]>.dec-ba,#v-dec.c360 .dec-card.c360-lev.c360-ouvert [id^="dr-"]>.dec-gain{display:none!important}' +
    '#v-dec.c360 .dec-card.c360-lev.c360-ouvert>*:not(.c360-ligne){margin-left:16px!important;margin-right:16px!important}' +
    '#v-dec.c360 .dec-card.c360-lev.c360-ouvert>*:last-child{margin-bottom:14px!important}' +
    '#v-dec.c360 .c360-ligne{display:grid;grid-template-columns:minmax(0,1fr) auto 14px;grid-template-areas:"nom g chev" "val g chev";align-items:center;column-gap:10px;row-gap:1px;' +
      'width:100%;min-height:56px;padding:9px 14px 9px 16px;margin:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}' +
    '#v-dec.c360 .c360-ligne .c360-nom{grid-area:nom;font-weight:700;font-size:15px;color:var(--txt,#0f172a);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '#v-dec.c360 .c360-ligne .c360-val{grid-area:val;font-size:12.5px;color:var(--mut,#64748b);font-family:var(--mono,ui-monospace,monospace);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '#v-dec.c360 .c360-ligne .c360-g{grid-area:g;font-family:var(--mono,ui-monospace,monospace);font-weight:800;font-size:14px;white-space:nowrap}' +
    '#v-dec.c360 .c360-ligne .c360-g.c360-mieux{color:#15803d}#v-dec.c360 .c360-ligne .c360-g.c360-moins{color:#dc2626}' +
    'html:not(.vd-workspace-light) #v-dec.c360 .c360-ligne .c360-g.c360-mieux{color:#4ade80}html:not(.vd-workspace-light) #v-dec.c360 .c360-ligne .c360-g.c360-moins{color:#f87171}' +
    '#v-dec.c360 .c360-ligne .c360-chev{grid-area:chev;font-size:20px;line-height:1;color:var(--mut,#64748b);transition:transform .15s ease}' +
    '#v-dec.c360 .c360-ouvert>.c360-ligne .c360-chev{transform:rotate(90deg)}' +
    '#v-dec.c360 .c360-ligne:focus-visible{outline:2px solid #15803d;outline-offset:-2px;border-radius:14px}' +
    '@media (prefers-reduced-motion:reduce){#v-dec.c360 .c360-ligne .c360-chev{transition:none}}' +
    /* Point de départ compact (le détail derrière « Comment c'est calculé ») */
    '#v-dec.c360 #decBestCard:not(.c360-detail)>div:first-child,#v-dec.c360 #decBestCard:not(.c360-detail)>p,' +
    '#v-dec.c360 #decBestCard:not(.c360-detail) .c88-best>.autoline,#v-dec.c360 #decBestCard:not(.c360-detail) .c88-best>p.note,' +
    '#v-dec.c360 #decBestCard:not(.c360-detail) .c88-best>div:not(.c88-amount):not(:first-child),#v-dec.c360 #decBestCard:not(.c360-detail) .vd-cta-hint{display:none!important}' +
    '#v-dec.c360 #decBestCard .c360-comment{display:flex;align-items:center;justify-content:space-between;width:100%;margin:10px 0 0;padding:8px 2px;border:0;border-top:1px solid var(--line,rgba(127,127,127,.2));background:transparent;color:var(--mut,#64748b);font:inherit;font-size:13px;font-weight:600;cursor:pointer}' +
    '#v-dec.c360 #decBestCard .c360-comment .c360-chev{font-size:18px;transition:transform .15s ease}#v-dec.c360 #decBestCard.c360-detail .c360-comment .c360-chev{transform:rotate(90deg)}' +
    '#v-mesdec .c360-sub{margin:0 0 10px}';
  (doc.head || doc.documentElement).appendChild(css);

  /* ── Audit (décision 33 n° 7) : un sommaire des 6 images en tête, une ligne chacune avec son chiffre clé ; les 27
     chapitres repliés sous « Tout le détail ». Les images ne bougent pas (audit-recit-a27 : compteurs écrits au rendu,
     RENDU_RC, jouer(card) — L2 C350, L7) ; le chiffre clé est lu dans data-rc-count, la valeur finale, jamais dans le
     texte qui compte. L'Audit reste en français (décision « Point 13 ») : pas de traduction ici. ── */
  function txt(e) { return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function compteur(e) {
    if (!e) return '';
    var n = Number(e.getAttribute('data-rc-count')); if (!isFinite(n)) return txt(e);
    return /€/.test(e.textContent) ? euros(n) : nombre(n, 0);
  }
  function chiffreCle(card, i) {
    var c = card.querySelectorAll('[data-rc-count]');
    if (i === 1) return c[0] ? compteur(c[0]) + '/100' : '';
    if (i === 2) { var b = card.querySelectorAll('b'), d = b.length ? txt(b[b.length - 1]) : ''; return d && !/€/.test(d) ? '1er poste : ' + d : ''; }
    if (i === 4) return c[0] ? compteur(c[0]) + ' / an' : '';
    if (i === 6) return '';
    return c[0] ? compteur(c[0]) : '';
  }
  function sommaireAudit() {
    var recit = doc.getElementById('vdRecit'); if (!recit) return;
    var cartes = recit.querySelectorAll(':scope > .rc-card'); if (!cartes.length) return;
    var som = doc.getElementById('c360Som');
    if (!som || som.parentNode !== recit) {
      if (som) som.remove();
      /* Un div (rôle navigation) et non un <nav> : a27 fixe à l'écran les <nav> du récit (sa barre de pastilles). */
      som = doc.createElement('div'); som.id = 'c360Som'; som.className = 'c360-som'; som.setAttribute('role', 'navigation'); som.setAttribute('aria-label', 'Sommaire de l’audit');
      var tete = recit.querySelector(':scope > .rc-head');
      recit.insertBefore(som, tete ? tete.nextSibling : recit.firstChild);
    }
    var h = '';
    [].forEach.call(cartes, function (card, k) {
      var i = k + 1, titre = txt(card.querySelector('.rc-k')).replace(/^\d+\s*·\s*/, ''), sous = txt(card.querySelector('h2'));
      h += '<button type="button" class="c360-som-l" data-c360-carte="' + i + '"><span class="c360-som-n">' + i + '</span>' +
        '<span class="c360-som-t"><b>' + esc(titre) + '</b><small>' + esc(sous) + '</small></span>' +
        '<span class="c360-som-v">' + esc(chiffreCle(card, i)) + '</span><span class="c360-chev" aria-hidden="true">›</span></button>';
    });
    if (som.__c360h !== h) { som.innerHTML = h; som.__c360h = h; }
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function replierChapitres() {
    var bib = doc.getElementById('vdBiblio'); if (!bib) return;
    if (!bib.querySelector(':scope > .bb-theme')) return;
    var bt = bib.querySelector(':scope > .c360-detail-bt');
    if (!bt) {
      bt = doc.createElement('button'); bt.type = 'button'; bt.className = 'c360-detail-bt'; bt.setAttribute('aria-expanded', 'false');
      var nb = (txt(bib.querySelector(':scope > .bb-head')).match(/(\d+)\s+chapitres/) || [])[1];
      bt.innerHTML = '<span>' + (nb ? 'Voir les ' + nb + ' chapitres' : 'Voir tous les chapitres') + '</span><span class="c360-chev" aria-hidden="true">›</span>';
      bt.addEventListener('click', function () { var o = !bib.classList.contains('c360-ouvert'); basculer(bib, 'c360-ouvert', o); setAttr(bt, 'aria-expanded', o ? 'true' : 'false'); });
      var tete = bib.querySelector(':scope > .bb-head');
      bib.insertBefore(bt, tete ? tete.nextSibling : bib.firstChild);
    }
    basculer(bib, 'c360-replie', true);
  }
  function audit() { try { sommaireAudit(); replierChapitres(); } catch (e) {} }
  doc.addEventListener('click', function (ev) {
    var l = ev.target && ev.target.closest && ev.target.closest('#c360Som .c360-som-l'); if (!l) return;
    var card = doc.querySelector('#vdRecit > .rc-card.rc-c' + l.getAttribute('data-c360-carte')); if (!card) return;
    try { card.scrollIntoView({ block: 'start', behavior: (typeof w.scReduced === 'function' && w.scReduced()) ? 'auto' : 'smooth' }); } catch (e) { card.scrollIntoView(); }
  });
  /* Le récit et la bibliothèque sont montés par a27 et a28 (parfois après drawAudit) : on observe la vue, et on n'écrit
     que si le sommaire ou le bouton manquent, ou si un chiffre a changé (0 changement au repos). */
  function surveillerAudit() {
    var v = doc.getElementById('v-audit'); if (!v || v.__c360) return !!v; v.__c360 = true;
    try { new w.MutationObserver(function () { if (doc.getElementById('vdRecit') || doc.getElementById('vdBiblio')) audit(); }).observe(v, { childList: true, subtree: true }); } catch (e) {}
    audit(); return true;
  }
  if (!surveillerAudit()) doc.addEventListener('DOMContentLoaded', surveillerAudit);
  css.textContent +=
    /* Couleurs explicites : dans l'Audit, --card vaut le gris sombre des images, même en thème clair. */
    '#c360Som{display:flex;flex-direction:column;gap:0;margin:8px 0 18px;border:1px solid #dfe5e9;border-radius:16px;overflow:hidden;background:#ffffff;color:#0f172a}' +
    'html:not(.vd-workspace-light) #c360Som{background:#14181d;border-color:rgba(255,255,255,.12);color:#f3f4f6}' +
    '#c360Som .c360-som-t b,#c360Som .c360-som-v{color:#0f172a}#c360Som .c360-som-t small,#c360Som .c360-chev{color:#64748b}' +
    'html:not(.vd-workspace-light) #c360Som .c360-som-t b,html:not(.vd-workspace-light) #c360Som .c360-som-v{color:#f3f4f6}html:not(.vd-workspace-light) #c360Som .c360-som-t small,html:not(.vd-workspace-light) #c360Som .c360-chev{color:#9aa4b2}' +
    '#c360Som .c360-som-l{display:grid;grid-template-columns:24px minmax(0,1fr) auto 12px;align-items:center;gap:10px;width:100%;min-height:56px;padding:8px 14px;border:0;border-top:1px solid var(--line,rgba(127,127,127,.15));background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}' +
    '#c360Som .c360-som-l:first-child{border-top:0}' +
    '#c360Som .c360-som-n{font-family:var(--mono,ui-monospace,monospace);font-weight:800;font-size:13px;color:#15803d;text-align:center}' +
    'html:not(.vd-workspace-light) #c360Som .c360-som-n{color:#4ade80}' +
    '#c360Som .c360-som-t{display:flex;flex-direction:column;min-width:0}#c360Som .c360-som-t b{font-size:14.5px}' +
    '#c360Som .c360-som-t small{font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '#c360Som .c360-som-v{font-family:var(--mono,ui-monospace,monospace);font-weight:800;font-size:14px;white-space:nowrap;max-width:46vw;overflow:hidden;text-overflow:ellipsis}' +
    '#c360Som .c360-chev{font-size:18px}' +
    '#vdBiblio.c360-replie:not(.c360-ouvert)>.bb-theme{display:none!important}' +
    '#vdBiblio .c360-detail-bt{display:flex;align-items:center;justify-content:space-between;width:100%;margin:6px 0 12px;padding:14px 16px;border:1px solid #cbd5e1;border-radius:14px;background:#ffffff;color:#0f172a;font:inherit;font-size:15px;font-weight:700;cursor:pointer}' +
    'html:not(.vd-workspace-light) #vdBiblio .c360-detail-bt{background:#14181d;border-color:rgba(255,255,255,.18);color:#f3f4f6}' +
    '#vdBiblio.c360-ouvert .c360-detail-bt .c360-chev{transform:rotate(90deg)}#vdBiblio .c360-detail-bt .c360-chev{transition:transform .15s ease}';

  installerTextes();
  doc.documentElement.classList.add('vd-c360');
  try { vueMesDecisions(); } catch (e) {}
  /* Simuler déjà dessiné avant le chargement de ce fichier : on le met en forme tout de suite. */
  try { if (doc.getElementById('decBody') && doc.querySelector('#decBody > .dec-card')) simuler(); } catch (e) {}
  w.VerdictSimulerCourt = { version: 'C360', metier: metier, ordres: ORDRES, textes: D };
})(window);
