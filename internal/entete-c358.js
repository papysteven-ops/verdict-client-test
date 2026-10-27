/* C358 (L6, décision 33 : règles 1, 2 et 10 ; campagne simplicité, SIMPLICITE/SYNTHESE-CHEF-2026-10-23.md) — l'en-tête prenait
   40 % de l'iPhone : la coque (logo, établissement, cloche, Pilotage · Carte · Inventaire), puis dans le cadre Pilotage le bandeau
   de démonstration, la ligne de statut (« Simulation · Structure correcte », date, anneau, Vera) et le bandeau des établissements
   (Comparer, ⚙, +). Désormais deux lignes, dans la coque seulement :
   - ligne 1 : logo et Indice de sérénité, établissement actif ▾ (menu : Comparer en premier, la liste avec la note de chacun,
     ⚙ Gérer, + Ajouter), cloche ; en démonstration, une pastille « Démo » remplace le bandeau et ouvre le menu de la démo
     (changer de modèle, recommencer, quitter) ;
   - ligne 2 : Pilotage · Carte · Inventaire, compacte. L'Indice Carte n'est jamais dans la forme ni à la place de l'Indice de
     sérénité : il est écrit « Carte 84 » sur l'onglet Carte (toucher l'onglet déjà ouvert : son détail).
   Barre du bas du Pilotage : Accueil · À faire · Structure · Simuler · Plus ; l'Audit s'ouvre depuis Structure (« Lire mon audit »)
   et depuis Plus. Vera : par l'Indice (bouton « Demander à Vera » dans son détail) et par la recherche de Plus.
   Le même fichier sert la coque (index.html) et le cadre (modules/verdict/verdict-app.html, chargé en tête pour que les
   bandeaux masqués ne s'affichent jamais, décision 27). Dans le cadre, les bandeaux restent dans la page (leur code tourne et
   leurs boutons servent aux menus) : ils sont seulement masqués, et seulement quand le cadre est dans la coque.
   Aucune minuterie : tout est recalculé sur événement (rien ne change au repos). */
(function () {
  'use strict';
  var w = window, doc = document;
  if (w.__vdEntete358) return; w.__vdEntete358 = true;

  var L = {
    fr: { afaire: 'À faire', demo: 'Démo', test: 'Test', estime: 'Estimé', indice: 'Indice de sérénité', simule: 'simulé', sur: 'sur 100',
      etabs: 'Mes établissements', comparer: 'Comparer mes établissements', renommer: 'Renommer', gerer: 'Gérer mes établissements', ajouter: 'Ajouter un établissement',
      actif: 'affiché', demoTitre: 'Démonstration', modele: 'Changer de modèle', comprendre: 'Comprendre la démonstration',
      audit: 'Lire mon audit', vera: 'Demander à Vera', carte: 'Indice Carte', fermer: 'Fermer', menuEtab: 'Changer d’établissement, comparer, gérer', horsLigne: 'Hors ligne' },
    en: { afaire: 'To do', demo: 'Demo', test: 'Test', estime: 'Estimate', indice: 'Peace-of-mind index', simule: 'simulated', sur: 'out of 100',
      etabs: 'My businesses', comparer: 'Compare my businesses', renommer: 'Rename', gerer: 'Manage my businesses', ajouter: 'Add a business',
      actif: 'shown', demoTitre: 'Demo', modele: 'Change model', comprendre: 'About the demo',
      audit: 'Read my audit', vera: 'Ask Vera', carte: 'Menu Index', fermer: 'Close', menuEtab: 'Switch business, compare, manage', horsLigne: 'Offline' },
    es: { afaire: 'Tareas', demo: 'Demo', test: 'Prueba', estime: 'Estimado', indice: 'Índice de serenidad', simule: 'simulado', sur: 'sobre 100',
      etabs: 'Mis establecimientos', comparer: 'Comparar mis establecimientos', renommer: 'Renombrar', gerer: 'Gestionar mis establecimientos', ajouter: 'Añadir un establecimiento',
      actif: 'mostrado', demoTitre: 'Demostración', modele: 'Cambiar de modelo', comprendre: 'Entender la demostración',
      audit: 'Leer mi auditoría', vera: 'Preguntar a Vera', carte: 'Índice Carta', fermer: 'Cerrar', menuEtab: 'Cambiar de establecimiento, comparar, gestionar', horsLigne: 'Sin conexión' },
    it: { afaire: 'Da fare', demo: 'Demo', test: 'Test', estime: 'Stimato', indice: 'Indice di serenità', simule: 'simulato', sur: 'su 100',
      etabs: 'Le mie attività', comparer: 'Confronta le mie attività', renommer: 'Rinomina', gerer: 'Gestisci le mie attività', ajouter: 'Aggiungi un’attività',
      actif: 'mostrato', demoTitre: 'Demo', modele: 'Cambia modello', comprendre: 'Capire la dimostrazione',
      audit: 'Leggi il mio audit', vera: 'Chiedi a Vera', carte: 'Indice Menu', fermer: 'Chiudi', menuEtab: 'Cambia attività, confronta, gestisci', horsLigne: 'Offline' },
    de: { afaire: 'Aufgaben', demo: 'Demo', test: 'Test', estime: 'Geschätzt', indice: 'Gelassenheitsindex', simule: 'simuliert', sur: 'von 100',
      etabs: 'Meine Betriebe', comparer: 'Meine Betriebe vergleichen', renommer: 'Umbenennen', gerer: 'Meine Betriebe verwalten', ajouter: 'Betrieb hinzufügen',
      actif: 'angezeigt', demoTitre: 'Demo', modele: 'Modell wechseln', comprendre: 'Die Demo verstehen',
      audit: 'Mein Audit lesen', vera: 'Vera fragen', carte: 'Index Karte', fermer: 'Schließen', menuEtab: 'Betrieb wechseln, vergleichen, verwalten', horsLigne: 'Offline' },
    nl: { afaire: 'Te doen', demo: 'Demo', test: 'Test', estime: 'Geschat', indice: 'Gemoedsrustindex', simule: 'gesimuleerd', sur: 'op 100',
      etabs: 'Mijn zaken', comparer: 'Mijn zaken vergelijken', renommer: 'Hernoemen', gerer: 'Mijn zaken beheren', ajouter: 'Zaak toevoegen',
      actif: 'getoond', demoTitre: 'Demo', modele: 'Model wijzigen', comprendre: 'De demo begrijpen',
      audit: 'Mijn audit lezen', vera: 'Vera vragen', carte: 'Kaartindex', fermer: 'Sluiten', menuEtab: 'Zaak wisselen, vergelijken, beheren', horsLigne: 'Offline' },
    pt: { afaire: 'Tarefas', demo: 'Demo', test: 'Teste', estime: 'Estimado', indice: 'Índice de serenidade', simule: 'simulado', sur: 'em 100',
      etabs: 'Os meus estabelecimentos', comparer: 'Comparar os meus estabelecimentos', renommer: 'Mudar o nome', gerer: 'Gerir os meus estabelecimentos', ajouter: 'Adicionar um estabelecimento',
      actif: 'apresentado', demoTitre: 'Demonstração', modele: 'Mudar de modelo', comprendre: 'Compreender a demonstração',
      audit: 'Ler a minha auditoria', vera: 'Perguntar à Vera', carte: 'Índice Menu', fermer: 'Fechar', menuEtab: 'Mudar de estabelecimento, comparar, gerir', horsLigne: 'Sem ligação' }
  };
  function lang(d) { var l = String(((d || doc).documentElement.lang) || 'fr').slice(0, 2).toLowerCase(); return L[l] ? l : 'fr'; }
  function t(k, d) { return L[lang(d)][k] || L.fr[k]; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pose(el, k, v) { if (el && el.getAttribute(k) !== v) el.setAttribute(k, v); }
  function texte(el, v) { if (el && el.textContent !== v) el.textContent = v; }

  var cadreDansCoque = false;
  try { var fe = w.frameElement; cadreDansCoque = !!(fe && fe.id === 'frame-verdict' && /\/modules\/verdict\/verdict-app\.html$/.test(location.pathname)); } catch (e) {}
  if (cadreDansCoque) cadre(); else if (!w.frameElement && /(^|\/)(index\.html)?$/.test(location.pathname)) coque();

  /* ───────────────────────── Cadre Pilotage / Carte (dans la coque) ───────────────────────── */
  function cadre() {
    var html = doc.documentElement; html.classList.add('vd-c358');
    var css = doc.createElement('style'); css.id = 'entete-c358';
    css.textContent =
      /* les trois bandeaux passent dans la coque : masqués ici avant la première image */
      'html.vd-c358:not(#vd358) body #modeBar#modeBar,html.vd-c358:not(#vd358) body>.stickytop.stickytop,html.vd-c358:not(#vd358) body .stickytop>.top.top,html.vd-c358:not(#vd358) body #etabBar#etabBar{display:none!important}' +
      /* barre du bas du Pilotage : À faire à la place d'Audit (Audit : depuis Structure et Plus) */
      'html.vd-c358[data-v45-profile="pilotage"]:not(#vd358) body nav button[data-v="audit"][data-v]{display:none!important}' +
      '.vd358-audit{display:inline-flex;align-items:center;gap:6px;margin:2px 0 12px}';
    (doc.head || html).appendChild(css);

    function nav() { return doc.querySelector('nav[aria-label] button[data-v="pil"]') ? doc.querySelector('nav[aria-label] button[data-v="pil"]').parentNode : null; }
    function libelle(b, txt) {
      if (!b) return; pose(b, 'aria-label', txt);
      var lab = b.querySelector(':scope > .premium-dock-label');
      if (lab) { texte(lab, txt); return; }
      var n = null; for (var c = b.lastChild; c; c = c.previousSibling) if (c.nodeType === 3 && c.nodeValue.trim()) { n = c; break; }
      if (n) { if (n.nodeValue !== txt) n.nodeValue = txt; } else b.appendChild(doc.createTextNode(txt));
    }
    var regleAffichee = false;
    function barre() {
      var n = nav(); if (!n) return;
      var pil = n.querySelector(':scope > button[data-v="pil"]'), af = n.querySelector(':scope > button[data-v="priorities"]');
      if (!pil || !af) return;
      if (pil.nextElementSibling !== af) pil.parentNode.insertBefore(af, pil.nextElementSibling);
      libelle(af, t('afaire'));
      if (!regleAffichee) { regleAffichee = true;
        var d = w.getComputedStyle(pil).display; if (!d || d === 'none') d = 'flex';
        css.textContent += 'html.vd-c358[data-v45-profile="pilotage"]:not(#vd358) body nav button[data-v="priorities"][data-v]{display:' + d + '!important}'; }
    }
    function lienAudit() {
      var v = doc.getElementById('v-data'); if (!v) return;
      var b = v.querySelector('[data-c358-audit]');
      if (!b) { var sub = v.querySelector(':scope > .sub') || v.querySelector(':scope > h1'); if (!sub) return;
        b = doc.createElement('button'); b.type = 'button'; b.className = 'btn sec vd358-audit'; b.setAttribute('data-c358-audit', '');
        b.addEventListener('click', function () { try { w.go('audit'); } catch (e) {} });
        sub.parentNode.insertBefore(b, sub.nextSibling); }
      texte(b, t('audit'));
    }
    function tout() { barre(); lienAudit(); }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', tout); else tout();
    w.addEventListener('load', tout);
    try { w.addEventListener('verdict:locale-changed', function () { setTimeout(tout, 0); }); new MutationObserver(function () { setTimeout(tout, 0); }).observe(html, { attributes: true, attributeFilter: ['lang'] }); } catch (e) {}
  }

  /* ───────────────────────── Coque ───────────────────────── */
  function coque() {
    var css = doc.createElement('style'); css.id = 'entete-c358';
    var H = 'html body header.app-shell-header.app-shell-header';
    css.textContent =
      H + ' .vd358-indice{position:relative;flex:none;display:inline-grid;place-items:center;width:38px;height:38px;margin:0 0 0 6px;padding:0;border:0;border-radius:50%;background:none;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
      H + ' .vd358-indice[data-vide]{visibility:hidden}' +
      H + ' .vd358-indice svg{position:absolute;inset:0;width:38px;height:38px;transform:rotate(-90deg)}' +
      H + ' .vd358-indice circle{fill:none;stroke-width:3.4}' +
      H + ' .vd358-indice .fond{stroke:rgba(148,163,184,.28)}' +
      H + ' .vd358-indice b{position:relative;font:800 13.5px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;letter-spacing:-.02em;font-variant-numeric:tabular-nums}' +
      H + ' .app-shell-context.vd358{display:flex!important;align-items:center;gap:6px;min-width:0;padding:3px 4px 3px 6px!important;cursor:default}' +
      H + ' .app-shell-context.vd358>#unified-context,' + H + ' .app-shell-context.vd358>.context-dot,' + H + ' .app-shell-context.vd358>#unified-network{display:none!important}' +
      H + ' .vd358-etab{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:5px;margin:0;padding:6px 6px;border:0;border-radius:10px;background:none;color:inherit;font:700 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
      H + ' .vd358-etab .n{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      H + ' .vd358-etab .fl{flex:none;opacity:.7;font-size:11px}' +
      H + ' .vd358-etab .hl{flex:none;color:#dc2626;font-size:11px;font-weight:700}' +
      H + ' .vd358-demo{flex:none;margin:0;padding:4px 10px;border:1px solid rgba(96,165,250,.55);border-radius:999px;background:rgba(59,130,246,.16);color:#bfdbfe;font:800 11.5px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;letter-spacing:.01em;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
      'html.vd-workspace-light ' + H.slice(5) + ' .vd358-demo{background:#dbeafe;border-color:#93c5fd;color:#1e3a8a}' +
      H + ' .vd358-demo[hidden]{display:none!important}' +
      /* ligne 2 compacte */
      '@media(max-width:720px){' + H + '{padding-top:calc(4px + var(--safe-top))!important;padding-bottom:4px!important;row-gap:5px!important}' +
        H + ' .shell-actions{padding:0!important}' + H + ' .notification-button{width:40px!important;height:40px!important;min-width:40px!important}' +
        H + ' .module-tabs{padding:2px!important;min-height:0!important}' +
        H + ' .module-tabs button{min-height:32px!important;height:32px!important;padding:3px 5px!important}}' +
      H + ' .module-tabs .vd358-cn{margin-left:4px;font-weight:800;font-variant-numeric:tabular-nums}' +
      /* menus */
      '#vd358-voile{position:fixed;inset:0;z-index:2147482000;background:rgba(2,6,23,.32)}' +
      '#vd358-menu{position:fixed;z-index:2147482001;left:max(10px,env(safe-area-inset-left));right:max(10px,env(safe-area-inset-right));max-width:440px;max-height:calc(100dvh - 140px);overflow:auto;-webkit-overflow-scrolling:touch;' +
        'box-sizing:border-box;padding:8px;border:1px solid rgba(148,163,184,.25);border-radius:18px;background:#10161c;color:#f1f5f9;box-shadow:0 18px 50px rgba(0,0,0,.45);' +
        'font:500 15px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}' +
      'html.vd-workspace-light #vd358-menu{background:#fff;color:#0f172a;border-color:rgba(15,23,42,.12);box-shadow:0 18px 50px rgba(15,23,42,.22)}' +
      '#vd358-menu h2{margin:6px 10px 6px;font:800 12px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;opacity:.6}' +
      '#vd358-menu button{display:flex;align-items:center;gap:10px;width:100%;min-height:48px;margin:0;padding:10px 12px;border:0;border-radius:12px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
      '#vd358-menu button:active,#vd358-menu button:focus-visible{background:rgba(148,163,184,.16);outline:none}' +
      '#vd358-menu button .i{flex:none;width:22px;text-align:center}' +
      '#vd358-menu button .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '#vd358-menu button .s{flex:none;min-width:30px;text-align:right;font-weight:800;font-variant-numeric:tabular-nums;transition:opacity .2s ease}' +
      '#vd358-menu button .s:empty{opacity:0}' +
      '#vd358-menu button[aria-current] .n{font-weight:800}' +
      '#vd358-menu .sep{height:1px;margin:6px 8px;background:rgba(148,163,184,.22)}' +
      '#vd358-menu .prem{font-weight:800}' +
      '#vd358-menu{padding-top:8px}#vd358-menu h2{padding-right:44px}' +
      '#vd358-menu button.vd358-x{position:absolute;top:6px;right:6px;width:40px;height:40px;min-height:0;padding:0;justify-content:center;border-radius:50%;font-size:20px;line-height:1;opacity:.75}';
    (doc.head || doc.documentElement).appendChild(css);

    var header = null, ctx = null, bEtab = null, bDemo = null, bInd = null, ctxTxt = null, net = null, tabCarte = null;
    var F = null, frame = null, observes = [], prevu = 0;

    function cadreW() { try { frame = doc.getElementById('frame-verdict'); var f = frame && frame.contentWindow; return f && f.document && f.document.documentElement && f.document.documentElement.classList.contains('vd-c358') ? f : null; } catch (e) { return null; } }
    function profil() { try { return F.document.documentElement.getAttribute('data-v45-profile') || ''; } catch (e) { return ''; } }
    function panneauVerdictVisible() { var p = doc.getElementById('panel-verdict'); return !!(p && !p.hidden && p.getClientRects().length); }

    function monter() {
      header = doc.querySelector('header.app-shell-header'); if (!header) return false;
      ctx = header.querySelector('.app-shell-context'); ctxTxt = doc.getElementById('unified-context'); net = doc.getElementById('unified-network');
      var brand = header.querySelector('.app-shell-brand');
      if (brand && !brand.querySelector('.vd358-indice')) {
        bInd = doc.createElement('button'); bInd.type = 'button'; bInd.className = 'vd358-indice'; bInd.setAttribute('data-vide', '');
        bInd.innerHTML = '<svg viewBox="0 0 38 38" aria-hidden="true"><circle class="fond" cx="19" cy="19" r="16.5"/><circle class="arc" cx="19" cy="19" r="16.5" stroke-linecap="round" stroke-dasharray="0 104"/></svg><b></b>';
        bInd.addEventListener('click', ouvrirIndice);
        var img = brand.querySelector('img'); brand.insertBefore(bInd, img ? img.nextSibling : brand.firstChild);
      }
      if (ctx && !ctx.querySelector('.vd358-etab')) {
        bDemo = doc.createElement('button'); bDemo.type = 'button'; bDemo.className = 'vd358-demo'; bDemo.hidden = true;
        bDemo.setAttribute('aria-haspopup', 'menu'); bDemo.addEventListener('click', function (e) { e.stopPropagation(); menuDemo(); });
        bEtab = doc.createElement('button'); bEtab.type = 'button'; bEtab.className = 'vd358-etab';
        bEtab.setAttribute('aria-haspopup', 'menu'); bEtab.innerHTML = '<span class="n"></span><span class="hl" hidden></span><span class="fl" aria-hidden="true">▾</span>';
        bEtab.addEventListener('click', function (e) { e.stopPropagation(); menuEtab(); });
        ctx.insertBefore(bEtab, ctx.firstChild); ctx.insertBefore(bDemo, bEtab); ctx.classList.add('vd358');
        ctx.removeAttribute('aria-live');
      }
      tabCarte = doc.getElementById('tab-carte');
      if (tabCarte && !tabCarte.__vd358) { tabCarte.__vd358 = true;
        tabCarte.addEventListener('click', function () { if (tabCarte.getAttribute('aria-selected') === 'true' && F && profil() === 'carte' && panneauVerdictVisible()) { try { F.scoreSheet(); } catch (e) {} } }, true); }
      try { var o = new MutationObserver(planifier); if (ctxTxt) o.observe(ctxTxt, { childList: true, characterData: true, subtree: true }); if (net) o.observe(net, { attributes: true, attributeFilter: ['class'] }); } catch (e) {}
      return true;
    }

    /* ── lecture de l'état (cadre Pilotage) ── */
    function nomAffiche() {
      var s = ctxTxt ? ctxTxt.textContent.trim() : '';
      try { if (F && F.DB && typeof F.verdictEtabIdentity === 'function') { var n = F.verdictEtabIdentity(F.DB).name; if (n) s = n; } } catch (e) {}
      return s.replace(/^D[ée]monstration fictive\s*·\s*/i, '');
    }
    /* le moteur et l'Indice Carte ne sont recalculés que si le dossier affiché ou le chiffre de l'anneau du cadre a changé */
    var memo = { s: { k: null }, c: { k: null } };
    function cle() { try { var ts = F.document.getElementById('topScore'); return [F.DB, ts ? ts.textContent : '', profil()]; } catch (e) { return [null, '', '']; } }
    function meme(a, b) { return a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]; }
    function serenite() {
      if (!F) return null; var k = cle(); if (meme(memo.s.k, k)) return memo.s.v; var v = sereniteCalc(); memo.s = { k: k, v: v }; return v;
    }
    function sereniteCalc() {
      try { if (typeof F.estModeRecent === 'function' && F.estModeRecent()) return { v: null };
        var R = F.moteur(); if (!R || !R.ready || !isFinite(R.score)) return { v: null };
        var v = Math.round(R.score), sim = false; try { sim = !!F.verdictScoreIsSimulation(R); } catch (e) {}
        var c = '#94a3b8'; try { c = F.zone(R.score).h || c; } catch (e) {}
        return { v: v, c: c, sim: sim };
      } catch (e) { return null; }
    }
    function indiceCarte() {
      if (!F) return null; var k = cle(); if (meme(memo.c.k, k)) return memo.c.v; var v = indiceCarteCalc(); if (v != null) memo.c = { k: k, v: v }; return v; /* pas encore prêt : pas gardé */
    }
    function indiceCarteCalc() {
      try { if (profil() === 'carte') { var ts = F.document.getElementById('topScore'), x = ts && parseInt(ts.textContent, 10); return isFinite(x) ? x : null; }
        var P = F.VerdictCartePages; if (!P || typeof P.scoreState !== 'function') return null; var n = P.scoreState(); return n && n.ready ? n.value : null;
      } catch (e) { return null; }
    }
    function etatDemo() {
      if (!F) return null; var mb = F.document.getElementById('modeBar'); if (!mb) return null;
      var demo = false, test = false; try { demo = F.eval('typeof VERDICT_DEMO_SESSION!=="undefined"&&!!VERDICT_DEMO_SESSION'); test = F.eval('typeof VERDICT_TEST_SESSION!=="undefined"&&!!VERDICT_TEST_SESSION'); } catch (e) {}
      return { mb: mb, demo: demo, test: test || F.document.body.classList.contains('modebar-test') };
    }

    function dessiner() {
      prevu = 0; if (!header && !monter()) return;
      var f = cadreW(); if (f !== F) { F = f; brancher(); }
      /* établissement */
      if (bEtab) { var n = nomAffiche(); texte(bEtab.querySelector('.n'), n);
        pose(bEtab, 'aria-label', n + ' — ' + t('menuEtab'));
        var hl = bEtab.querySelector('.hl'), off = !!(net && net.classList.contains('offline')); if (hl.hidden === off) hl.hidden = !off; if (off) texte(hl, '· ' + t('horsLigne')); }
      /* pastille Démo */
      var dm = etatDemo();
      if (bDemo) { var vis = !!dm; if (bDemo.hidden === vis) bDemo.hidden = !vis;
        if (dm) { texte(bDemo, dm.test ? t('test') : dm.demo ? t('demo') : t('estime')); pose(bDemo, 'aria-label', dm.mb.getAttribute('aria-label') || t('demoTitre')); } }
      /* Indice de sérénité, toujours le même, quel que soit l'onglet */
      var s = serenite();
      if (bInd && s) {
        var b = bInd.querySelector('b'), arc = bInd.querySelector('.arc'), v = s.v;
        texte(b, v == null ? '—' : String(v));
        if (b.style.color !== (s.c || '')) b.style.color = s.c || '';
        var lg = 2 * Math.PI * 16.5, da = (v == null ? 0 : Math.max(0, Math.min(100, v)) / 100 * lg).toFixed(1) + ' ' + lg.toFixed(1);
        if (arc.getAttribute('stroke-dasharray') !== da) arc.setAttribute('stroke-dasharray', da);
        if (arc.style.stroke !== (s.c || '')) arc.style.stroke = s.c || '#94a3b8';
        pose(bInd, 'aria-label', t('indice') + (s.sim ? ' ' + t('simule') : '') + ' ' + (v == null ? '—' : v + ' ' + t('sur')));
        if (bInd.hasAttribute('data-vide')) bInd.removeAttribute('data-vide');
      }
      /* « Carte 84 » sur l'onglet Carte : une autre forme, une autre place */
      if (tabCarte) { var cn = tabCarte.querySelector('.vd358-cn'), ic = indiceCarte();
        if (ic == null) { if (cn) cn.remove(); if (essaisCarte < 10) { essaisCarte++; setTimeout(planifier, 1500); } } /* Carte pas encore prête (machine chargée) : relue, 10 fois au plus */
        else { if (!cn) { cn = doc.createElement('b'); cn.className = 'vd358-cn'; tabCarte.appendChild(cn); } texte(cn, String(ic)); pose(cn, 'aria-label', t('carte') + ' ' + ic + ' ' + t('sur')); } }
    }
    var essaisCarte = 0;
    function planifier() { if (prevu) return; prevu = (w.requestAnimationFrame || setTimeout).call(w, dessiner); }

    /* ── branchement sur le cadre : événements seulement, aucune minuterie ── */
    function brancher() {
      observes.forEach(function (o) { try { o.disconnect(); } catch (e) {} }); observes = [];
      if (!F) return;
      try { var d = F.document, o1 = new MutationObserver(planifier);
        var ts = d.getElementById('topScore'); if (ts) o1.observe(ts, { childList: true, characterData: true, subtree: true });
        o1.observe(d.body, { childList: true }); o1.observe(d.documentElement, { attributes: true, attributeFilter: ['data-v45-profile', 'lang'] });
        var mb = d.getElementById('modeBar'); if (mb) o1.observe(mb, { childList: true, attributes: true, attributeFilter: ['aria-label'] });
        observes.push(o1); } catch (e) {}
    }
    try { frame = doc.getElementById('frame-verdict'); if (frame) frame.addEventListener('load', function () { F = null; setTimeout(planifier, 0); setTimeout(planifier, 800); }); } catch (e) {}
    /* les panneaux seulement (pas leur contenu : la barre du bas y change de classe à chaque défilement) */
    try { var ws = doc.getElementById('unified-workspace'); if (ws) { var ow = new MutationObserver(planifier); ow.observe(ws, { attributes: true, attributeFilter: ['class', 'hidden'] }); [].forEach.call(ws.children, function (p) { ow.observe(p, { attributes: true, attributeFilter: ['class', 'hidden'] }); }); } } catch (e) {}
    try { new MutationObserver(planifier).observe(doc.documentElement, { attributes: true, attributeFilter: ['lang', 'class'] }); } catch (e) {}
    w.addEventListener('pageshow', planifier);
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { monter(); planifier(); }); else { monter(); planifier(); }

    /* ── menus ── */
    var ouvert = null, retourFocus = null;
    /* garder : sur iPhone, le clic qui suit le toucher retombait sur le fond de la fenêtre ouverte dans le cadre (Comparer) et la refermait ;
       le voile, rendu transparent, reste 400 ms pour le recevoir. */
    function fermer(garder) {
      var m = doc.getElementById('vd358-menu'), v = doc.getElementById('vd358-voile');
      if (m) m.remove(); if (v) { if (garder) { v.style.background = 'transparent'; v.id = ''; setTimeout(function () { v.remove(); }, 400); } else v.remove(); } doc.removeEventListener('keydown', clavier, true);
      if (ouvert) pose(ouvert, 'aria-expanded', 'false'); ouvert = null; file = [];
      try { if (retourFocus) retourFocus.focus({ preventScroll: true }); } catch (e) {} retourFocus = null;
    }
    function clavier(e) { if (e.key === 'Escape') { e.preventDefault(); fermer(); } }
    function montrerCadre() { if (!panneauVerdictVisible()) { var tv = doc.getElementById('tab-verdict'); if (tv && !tv.disabled) tv.click(); } }
    function menu(bouton, titre, lignes) {
      fermer(); /* C369 : le menu s'ouvre même avant le chargement du Pilotage (ses actions l'attendent) */
      var v = doc.createElement('div'); v.id = 'vd358-voile'; v.addEventListener('click', fermer);
      var m = doc.createElement('div'); m.id = 'vd358-menu'; m.setAttribute('role', 'menu'); m.setAttribute('aria-label', titre);
      m.innerHTML = '<h2>' + esc(titre) + '</h2>';
      /* C366 (décision 37) : une croix visible en haut à droite de toute fenêtre ou menu */
      var cx = doc.createElement('button'); cx.type = 'button'; cx.className = 'vd358-x'; cx.textContent = '×'; cx.setAttribute('aria-label', t('fermer')); cx.addEventListener('click', function (e) { e.stopPropagation(); fermer(); }); m.appendChild(cx);
      lignes.forEach(function (l) {
        if (l === '-') { var s = doc.createElement('div'); s.className = 'sep'; s.setAttribute('role', 'separator'); m.appendChild(s); return; }
        var b = doc.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); if (l.cls) b.className = l.cls;
        b.innerHTML = '<span class="i" aria-hidden="true">' + esc(l.i || '') + '</span><span class="n">' + esc(l.n) + '</span>' + (l.s !== undefined ? '<span class="s"></span>' : '');
        if (l.cur) b.setAttribute('aria-current', 'true');
        if (l.s !== undefined && l.s !== null) b.querySelector('.s').textContent = l.s;
        if (l.c) b.querySelector('.s') && (b.querySelector('.s').style.color = l.c);
        if (l.id) b.setAttribute('data-id', l.id);
        b.addEventListener('click', function () { retourFocus = null; fermer(true); if (l.apres) { l.apres(); return; } montrerCadre(); try { l.f(); } catch (e) {} });
        m.appendChild(b);
      });
      var r = header.getBoundingClientRect(); m.style.top = Math.round(r.bottom + 6) + 'px';
      doc.body.appendChild(v); doc.body.appendChild(m);
      ouvert = bouton; retourFocus = bouton; pose(bouton, 'aria-expanded', 'true'); doc.addEventListener('keydown', clavier, true);
      try { var p = m.querySelector('button'); if (p) p.focus({ preventScroll: true }); } catch (e) {}
      return m;
    }

    /* notes des autres établissements : à l'ouverture du menu, une par image, mises de côté une minute */
    var cache = {}, file = [];
    function noteDe(id) {
      var S = F.STORE, d = S && S.etabs && S.etabs[id]; if (!d) return { v: null };
      var c = cache[id]; if (c && c.d === d && Date.now() - c.t < 60000) return c.r;
      var r = { v: null };
      try { var nat = typeof F.etabNature === 'function' ? F.etabNature(d) : null;
        if (!(nat && nat.key === 'recent')) { var prev = F.DB, R = null; try { F.DB = d; R = F.moteur(); } finally { F.DB = prev; }
          if (R && R.ready && isFinite(R.score)) { r.v = Math.round(R.score); try { r.c = F.zone(R.score).h; } catch (e) {} } }
        try { F.moteur(); } catch (e) {} /* le moteur revient sur l'établissement affiché */
      } catch (e) {}
      cache[id] = { d: d, t: Date.now(), r: r }; return r;
    }
    function suivante() {
      var x = file.shift(); if (!x) return; var m = doc.getElementById('vd358-menu'); if (!m) { file = []; return; }
      var r = noteDe(x), b = m.querySelector('button[data-id="' + (w.CSS && CSS.escape ? CSS.escape(x) : x) + '"] .s');
      if (b) { b.textContent = r.v == null ? '—' : String(r.v); if (r.c) b.style.color = r.c; }
      if (file.length) (w.requestAnimationFrame || setTimeout).call(w, suivante);
    }
    /* C369 (décisions 36 et 37, trouvé par L1) : la pastille ouvre toujours ce menu, même avec un seul établissement et avant le chargement
       du Pilotage ; « Renommer » et « Gérer mes établissements » y sont toujours. */
    function quandPret(fn) { montrerCadre(); var n = 0; (function attendre() { var f = cadreW(); if (f) { F = f; try { fn(f); } catch (e) {} return; } if (++n < 60) setTimeout(attendre, 100); })(); }
    function menuEtab() {
      F = cadreW() || F;
      if (!F) { menu(bEtab, t('etabs'), [{ i: '✎', n: t('renommer'), f: function () {}, apres: function () { quandPret(function (f) { if (f.renameEtab) f.renameEtab(f.STORE.actif); }); } },
        { i: '⚙', n: t('gerer'), f: function () {}, apres: function () { quandPret(function (f) { if (f.openEtabs) f.openEtabs(); }); } }]); return; }
      var ids = []; try { ids = typeof F.etabList === 'function' ? F.etabList() : []; } catch (e) {}
      var actif = F.STORE && F.STORE.actif, s = serenite(), lignes = [], dm = etatDemo(), enDemo = !!(dm && dm.demo);
      if (typeof F.verdictCompareOpen === 'function') lignes.push({ i: '⇄', n: t('comparer'), cls: 'prem', f: function () { F.verdictCompareOpen(); } });
      if (lignes.length && ids.length) lignes.push('-');
      ids.forEach(function (id) {
        var d = F.STORE.etabs[id], nom = id; try { nom = F.verdictEtabIdentity(d).name || d.etab || id; } catch (e) { nom = (d && d.etab) || id; }
        var cur = id === actif, note = cur ? (s && s.v != null ? String(s.v) : '—') : (cache[id] && cache[id].d === d ? (cache[id].r.v == null ? '—' : String(cache[id].r.v)) : '');
        lignes.push({ i: cur ? '✓' : '', n: nom, s: note, c: cur ? s && s.c : cache[id] && cache[id].r.c, cur: cur, id: id, f: function () { if (!cur || enDemo) F.switchEtab(id); } }); /* T4 (C356) : en démo, la ligne affichée ouvre la liste des modèles */
      });
      lignes.push('-');
      if (typeof F.renameEtab === 'function' && actif) lignes.push({ i: '✎', n: t('renommer'), f: function () { F.renameEtab(actif); } });
      if (typeof F.openEtabs === 'function') lignes.push({ i: '⚙', n: t('gerer'), f: function () { F.openEtabs(); } });
      if (typeof F.openNewEtab === 'function') lignes.push({ i: '+', n: t('ajouter'), f: function () { F.openNewEtab(); } });
      var m = menu(bEtab, t('etabs'), lignes); if (!m) return;
      file = ids.filter(function (id) { return id !== actif && !(cache[id] && cache[id].d === F.STORE.etabs[id] && Date.now() - cache[id].t < 60000); });
      if (file.length) (w.requestAnimationFrame || setTimeout).call(w, suivante);
    }
    function menuDemo() {
      F = cadreW() || F; var dm = etatDemo(); if (!dm) return;
      var lignes = [], vus = {};
      if (dm.demo && !dm.test && typeof F.openModeles === 'function') lignes.push({ i: '⇆', n: t('modele'), cls: 'prem', f: function () { F.openModeles(); } });
      [].forEach.call(dm.mb.querySelectorAll('button'), function (b) {
        if (b.classList.contains('p40-mb-ouvrir') || b.classList.contains('p40-mb-x') || !/[0-9A-Za-zÀ-ÿ]/.test((b.textContent || '') + (b.classList.contains('mb-info') ? 'i' : ''))) return; /* ▾ et × du bandeau : sans objet ici */
        var info = b.classList.contains('mb-info'), n = info ? t('comprendre') : (b.textContent || '').trim() || b.getAttribute('aria-label') || '';
        if (!n || vus[n]) return; vus[n] = 1;
        lignes.push({ i: info ? 'ⓘ' : /onclick="?demoRecommencer/.test(b.outerHTML) ? '↺' : '←', n: n, f: function () { b.click(); } });
      });
      var reel = F.document.querySelector('#etabBar .p40-etab-reel');
      if (reel) { var nr = (reel.textContent || '').trim(); if (nr && !vus[nr]) lignes.push({ i: '←', n: nr, f: function () { reel.click(); } }); }
      menu(bDemo, t('demoTitre'), lignes);
    }

    /* ── l'Indice : son détail (celui du Pilotage, jamais celui de la Carte), avec Vera ── */
    function ouvrirIndice() {
      F = cadreW() || F; if (!F) return;
      function ouvrir() {
        try { F.scoreSheet(); } catch (e) { return; }
        setTimeout(function () { try {
          var tete = F.document.querySelector('.modal.on .shhead'), sh = tete && (tete.closest('.sheet') || tete.parentNode);
          if (!sh || sh.querySelector('[data-c358-vera]') || typeof F.ouvrirAide !== 'function') return;
          var b = F.document.createElement('button'); b.type = 'button'; b.className = 'btn sec'; b.setAttribute('data-c358-vera', '');
          b.style.cssText = 'width:100%;margin-top:12px'; b.textContent = t('vera', F.document);
          b.addEventListener('click', function () { try { if (typeof F.scoreSheetClose === 'function') F.scoreSheetClose(); } catch (e) {} F.ouvrirAide(); });
          var ligne = sh.querySelector('.shrow.big'); if (ligne && ligne.parentNode) ligne.parentNode.insertBefore(b, ligne.nextSibling); else sh.appendChild(b); /* visible sans défiler */
        } catch (e) {} }, 0);
      }
      var tv = doc.getElementById('tab-verdict');
      if (panneauVerdictVisible() && profil() === 'pilotage') { ouvrir(); return; }
      if (tv && !tv.disabled) tv.click();
      var n = 0; (function attendre() { if ((panneauVerdictVisible() && profil() === 'pilotage') || ++n > 40) { ouvrir(); return; } setTimeout(attendre, 50); })();
    }
    /* C369 : shell-014 (C312) posait sur la pastille un sélecteur qui ne s'ouvrait qu'à partir de deux établissements ; un toucher sur le
       bord de la pastille y allait. Tout toucher sur la pastille ouvre désormais ce menu (« Démo » : le menu de la démonstration). */
    doc.addEventListener('click', function (e) { if (!ctx || !ctx.classList.contains('vd358') || !ctx.contains(e.target)) return; e.stopPropagation(); e.preventDefault();
      if (bDemo && !bDemo.hidden && bDemo.contains(e.target)) menuDemo(); else menuEtab(); }, true);
    doc.addEventListener('keydown', function (e) { if (e.target !== ctx || !(e.key === 'Enter' || e.key === ' ')) return; e.stopPropagation(); e.preventDefault(); menuEtab(); }, true);
    w.VerdictEntete358 = { dessiner: dessiner, menuEtab: menuEtab, menuDemo: menuDemo, indice: ouvrirIndice,
      /* C369 : pour l'Inventaire (nom imposé par Verdict) : « Modifier » ouvre Mes établissements du Pilotage */
      gerer: function () { quandPret(function (f) { if (f.openEtabs) f.openEtabs(); }); }, renommer: function () { quandPret(function (f) { if (f.renameEtab) f.renameEtab(f.STORE.actif); }); } };
  }
})();
