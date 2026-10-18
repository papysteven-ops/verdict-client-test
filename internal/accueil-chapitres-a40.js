/* C132 — Accueil premium en quatre chapitres (Steven, 17/10 : « PC, tablette, mobile : reprends la page d'accueil, rends-la
   premium ; il y a énormément d'infos, il faut la rendre optimisée, cohérente, premium »).
   L'Accueil Pilotage faisait 14 modules à la suite (près de 15 écrans sur iPhone). Rien n'est retiré : tout est rangé.
   - Un sélecteur Jour · Mois · Année · Argent sous l'en-tête ; un seul chapitre affiché à la fois (retenu pendant la session).
   - Dans chaque chapitre, l’essentiel est ouvert ; le secondaire est dans un tiroir titré (C133 : déplié d’office dans Jour et Mois ; Argent replié sous son chiffre clé).
   - Ordinateur et tablette en largeur : l'essentiel à gauche, le complément à droite ; mobile : l'un sous l'autre.
   - Tout ce qui fait défiler vers un module (boutons, liens, calendrier) ouvre d'abord le bon chapitre et le bon tiroir.
   Les modules gardent leurs identifiants : les autres scripts (C123-C131, vx39) continuent de les trouver. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdAccueilA40) return; w.__vdAccueilA40 = true;
  var CLE = 'verdict:accueil:chapitre:v1';
  /* p = essentiel (ouvert), s = complément (replié sous une ligne de résumé). */
  var CHAP = [
    { k: 'jour', t: 'Jour', ouvert: true, p: ['modSaisie'], s: ['modAction', 'modRupture', '~modReperesJour', '~modJour'] },
    { k: 'mois', t: 'Mois', ouvert: true, large: true /* C136 : calendrier et mois ont leur propre mise en page en deux colonnes : pleine largeur, l’un sous l’autre */, p: ['calendrier'], s: ['modMois', '~vdOffCard', '~modManqueCarte'] },
    { k: 'annee', t: 'Année', p: ['modAnnee'], s: [] },
    { k: 'argent', t: 'Argent', p: ['modArgent'], s: ['~modTreso', '~modCash13'] }
  ];
  var CACHE = ['h2Saisie', 'h2Jour', 'h2Annee', 'h2Argent'];
  function lire() { try { return w.sessionStorage.getItem(CLE) || 'jour'; } catch (e) { return 'jour'; } }
  function ecrire(k) { try { w.sessionStorage.setItem(CLE, k); } catch (e) {} }
  function txt(e) { return e ? (e.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  var CSS =
    '.vx40-nav{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:14px 0 16px;padding:4px;border-radius:16px;background:var(--card,rgba(148,163,184,.08));border:1px solid var(--line,rgba(148,163,184,.16))}' +
    '.vx40-nav button{appearance:none;border:0;background:transparent;color:var(--mut,#8b94a0);font:inherit;font-size:14.5px;font-weight:700;letter-spacing:.01em;padding:11px 4px;border-radius:12px;cursor:pointer;min-height:44px;transition:background .2s,color .2s}' +
    '.vx40-nav button[aria-selected="true"]{background:linear-gradient(180deg,rgba(34,197,94,.20),rgba(34,197,94,.10));color:var(--txt,inherit);box-shadow:inset 0 0 0 1px rgba(34,197,94,.38)}' +
    '.vx40-nav button:focus-visible{outline:2px solid rgba(34,197,94,.6);outline-offset:2px}' +
    '.vx40-ch[hidden]{display:none!important}.vx40-ch{display:grid;gap:0 16px;align-items:start}.vx40-col{min-width:0}' +
    '.vx40-t{margin:0 0 12px;border:1px solid var(--line,rgba(148,163,184,.16));border-radius:var(--r-mod,18px);background:var(--card,transparent);overflow:hidden}' +
    '.vx40-t>summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:1fr auto;gap:2px 12px;align-items:center;padding:14px 16px;min-height:44px}' +
    '.vx40-t>summary::-webkit-details-marker{display:none}' +
    '.vx40-t>summary b{font-size:13px;font-weight:600;color:var(--mut,#8b94a0);grid-column:1}' +
    '.vx40-t>summary span{grid-column:1;font-size:15.5px;font-weight:700;line-height:1.35;color:var(--txt,inherit);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-variant-numeric:tabular-nums}' +
    '.vx40-t>summary i{grid-column:2;grid-row:1/span 2;font-style:normal;font-size:22px;line-height:1;opacity:.55;transition:transform .25s}' +
    '.vx40-t[open]>summary i{transform:rotate(90deg)}.vx40-t[open]>summary span{display:none}' +
    '.vx40-t>.mod,.vx40-t>section{margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important}' +
    '.vx40-t>.mod,.vx40-t>section{padding-top:2px!important}.vx40-t>.mod>.mod-h:empty,.vx40-t>.mod>.mod-h:not(:has(>:not(.kicker))){display:none}' +
    '.vx40-t>.mod>.mod-h>.kicker:first-child,.vx40-t>#vdOffCard>#vdOffTitle{display:none}' +
    '.vx40-fin .jr{opacity:1!important}.vx40-rej,.vx40-rej *{animation:none!important}' +
    '.identite .vx40-long{font-size:clamp(24px,6.6vw,36px)!important;line-height:1.08!important;letter-spacing:-.015em!important}' +
    '.identite .vx40-tres-long{font-size:clamp(21px,5.6vw,32px)!important}' +
    /* C161 : sur PC l'Accueil est une grille ; le bloc de saisie en tête prend toute la largeur (il était écrasé dans une colonne). */
    '#vx40-prio{margin:4px 0 16px;grid-column:1/-1;width:100%;min-width:0;box-sizing:border-box}#vx40-prio>#modSaisie{margin:0;width:100%;box-sizing:border-box}' +
    '.vx40-suite{display:flex;justify-content:space-between;gap:10px;margin:4px 0 0;padding-bottom:26px;grid-column:1/-1}.vx40-suite .vx40-suiv{margin-left:auto}.vx40-suite button{appearance:none;border:1px solid var(--line,rgba(148,163,184,.2));background:transparent;color:var(--txt,inherit);font:inherit;font-size:14px;font-weight:700;padding:10px 16px;border-radius:999px;cursor:pointer;min-height:44px}' +
    /* C139 (Steven, 17/10 : « boutons Mois / Année : en blanc en sombre, en sombre en clair, pour les identifier parfaitement ») */
    '.vx40-suite button{background:#111827!important;color:#ffffff!important;border-color:#111827!important;box-shadow:0 2px 6px rgba(15,23,42,.16)}.vx40-suite button:active{transform:scale(.97)}' +
    'html.vd-workspace-dark .vx40-suite button{background:#ffffff!important;color:#0b1220!important;border-color:#ffffff!important;box-shadow:0 2px 6px rgba(0,0,0,.4)}' +
    '@media (prefers-color-scheme:dark){html:not(.vd-workspace-light) .vx40-suite button{background:#ffffff!important;color:#0b1220!important;border-color:#ffffff!important}}' +
    'main.cadre>.vx40-nav,main.cadre>.vx40-ch,main.cadre>.vx40-ch~*{grid-column:1/-1!important}@media (min-width:768px){main.cadre>.vx40-nav{margin:0}}' +
    '@media (min-width:980px){.cadre.vx40-large{max-width:1180px}.vx40-ch.vx40-2{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}.vx40-nav{max-width:520px}}' +
    '@media (prefers-reduced-motion:reduce){.vx40-nav button,.vx40-t>summary i{transition:none}}';

  function resume(m) {
    var d = m.ownerDocument;
    if (m.id === 'modReperesJour') return txt(m.querySelector('.titre')) || txt(m.querySelector('b'));
    if (m.id === 'modJour') { var ca = txt(d.getElementById('jCA')), v = txt(d.getElementById('jVerdict')); return [ca, v].filter(Boolean).join(' · '); }
    if (m.id === 'vdOffCard') { var r = m.querySelector('.vo-row'); return r ? txt(r.querySelector('span')) + ' : ' + txt(r.querySelector('b')) : ''; }
    return txt(m.querySelector('.verdict-grand,.titre,.verdict,.grand'));
  }
  function titre(m) { return txt(m.querySelector('.mod-h>.kicker,#vdOffTitle,h3,.kicker')) || ''; }

  function signaler(d) { try { d.defaultView.dispatchEvent(new d.defaultView.Event('resize')); } catch (e) {} }
  /* C137 (Steven, 17/10 : « le module courbe des journées : impossible de défiler ») : déplacer un module dans le document
     remet ses zones défilantes à zéro, et une courbe dessinée dans un chapitre caché ne peut pas se placer. La courbe
     s'ouvrait donc sur le 1er du mois (légende : dernière journée) et semblait bloquée. On garde la position pendant le
     déplacement, et la courbe montrée pour la première fois se place sur la dernière journée, comme à l'origine. */
  function deplacer(m, faire) {
    var pos = [];
    [m].concat([].slice.call(m.querySelectorAll('*'))).forEach(function (e) { if (e.scrollLeft > 0 || e.scrollTop > 0) pos.push([e, e.scrollLeft, e.scrollTop]); });
    faire();
    pos.forEach(function (x) { try { x[0].scrollLeft = x[1]; x[0].scrollTop = x[2]; } catch (e) {} });
  }
  function aLaFin(racine) {
    if (!racine) return;
    [].forEach.call(racine.querySelectorAll('.jscroll'), function (e) {
      if (e.__vx40fin || e.clientWidth < 1 || e.scrollWidth <= e.clientWidth + 1) return;
      e.__vx40fin = true; if (e.scrollLeft < 1) e.scrollLeft = e.scrollWidth;
    });
  }

  function montrer(d, k, defiler) {
    var nav = d.querySelector('.vx40-nav'); if (!nav) return;
    [].forEach.call(nav.querySelectorAll('button'), function (b) { var on = b.getAttribute('data-k') === k; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    [].forEach.call(d.querySelectorAll('.vx40-ch'), function (c) { c.hidden = c.getAttribute('data-k') !== k; });
    ecrire(k); signaler(d);
    var vu = d.getElementById('vx40-' + k); d.defaultView.requestAnimationFrame(function () { aLaFin(vu); });
    /* C156 (Steven, 18/10, capture : « c'est vide ») : les animations d'arrivée attendent que le bloc passe à l'écran
       (classe « attente », R62). Un bloc rangé dans un chapitre encore caché n'était jamais vu : le calendrier du Mois
       restait vide (cases à opacité 0). Ouvrir un chapitre libère ses animations, qui se jouent sous les yeux. */
    if (vu) [].forEach.call([vu].concat([].slice.call(vu.querySelectorAll('.attente'))), function (e) { e.classList.remove('attente'); });
    /* Filet : dans Safari, une animation d'apparition lancée pendant que le chapitre était caché peut rester figée à
       opacité 0 (cases du calendrier invisibles). 1,2 s après l'ouverture, l'état final est imposé. */
    /* C159 (Steven, 18/10 : « les animations ne marchent pas directement ; si je reviens sur le module, ça marche ; ça doit
       marcher dès le premier passage ») : un chapitre est dessiné pendant qu'il est caché, et Safari tient ses animations
       pour déjà jouées. À chaque ouverture, elles sont rejouées sous les yeux (comme au second passage). */
    if (vu) {
      clearTimeout(vu.__fin); vu.classList.remove('vx40-fin'); vu.classList.add('vx40-rej'); void vu.offsetWidth;
      var W = d.defaultView; W.requestAnimationFrame(function () { W.requestAnimationFrame(function () { vu.classList.remove('vx40-rej'); }); });
      vu.__fin = W.setTimeout(function () { vu.classList.add('vx40-fin'); }, 1600);
    }
    if (defiler) { try { var f = d.defaultView.frameElement, P = d.defaultView.parent; var r = nav.getBoundingClientRect(), fr = f.getBoundingClientRect(); var y = fr.top + r.top; if (y < 0 || y > P.innerHeight * 0.6) P.scrollBy({ top: y - 12, behavior: 'smooth' }); } catch (e) {} }
  }

  function aRenseigner(d) { var m = d.getElementById('modSaisie'), chip = m && m.querySelector('.mod-h .chip'); return !!(chip && /À renseigner/.test(chip.textContent || '') && !/Jour fermé/.test(m.textContent || '')); }
  function ranger(f) {
    var d; try { d = f.contentDocument; } catch (e) { return; }
    if (!d || !d.body) return;
    var main = d.querySelector('main.cadre') || d.querySelector('main'); if (!main || !d.getElementById('modSaisie')) return;
    if (!d.getElementById('vx40-css')) { var s = d.createElement('style'); s.id = 'vx40-css'; s.textContent = CSS; (d.head || d.documentElement).appendChild(s); }
    main.classList.add('vx40-large');
    var ident = main.querySelector(':scope>.identite');
    /* C160 — Noms d'établissement longs (« Cuisine de livraison (dark kitchen) (démonstration estimative) » : 5 lignes sur
       iPhone) : taille réduite au-delà de 28 caractères. */
    if (ident) [].forEach.call(ident.querySelectorAll('h1,h2'), function (h) { var n = (h.textContent || '').trim().length, lg = n > 28, tl = n > 44; if (h.classList.contains('vx40-long') !== lg) h.classList.toggle('vx40-long', lg); if (h.classList.contains('vx40-tres-long') !== tl) h.classList.toggle('vx40-tres-long', tl); });
    var nav = main.querySelector(':scope>.vx40-nav');
    if (!nav) {
      nav = d.createElement('div'); nav.className = 'vx40-nav'; nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Chapitres de l’accueil');
      nav.innerHTML = CHAP.map(function (c) { return '<button type="button" role="tab" data-k="' + c.k + '" aria-controls="vx40-' + c.k + '">' + c.t + '</button>'; }).join('');
      nav.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('button[data-k]'); if (b) montrer(d, b.getAttribute('data-k'), false); });
      nav.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var bs = [].slice.call(nav.querySelectorAll('button')), i = bs.indexOf(d.activeElement); if (i < 0) return;
        var n = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length]; montrer(d, n.getAttribute('data-k'), false); n.focus(); e.preventDefault();
      });
    }
    if (ident && ident.nextElementSibling !== nav) ident.after(nav); else if (!ident && main.firstElementChild !== nav) main.prepend(nav);
    /* C155 (Steven, 18/10 : « la saisie doit être en priorité, en haut : c'est la première chose à faire en ouvrant
       Verdict ; là on scrolle, on scrolle ») : tant que la journée est « À renseigner », la carte de saisie passe tout en
       haut, juste sous le titre, avant les chapitres. Une fois la journée enregistrée, elle retourne dans « Jour ». */
    var prio = aRenseigner(d), hold = d.getElementById('vx40-prio');
    if (prio) { if (!hold) { hold = d.createElement('div'); hold.id = 'vx40-prio'; } if (nav.previousElementSibling !== hold) deplacer(hold, function () { nav.before(hold); }); }
    var dernier = nav;
    CHAP.forEach(function (c, ci) {
      var ch = d.getElementById('vx40-' + c.k);
      if (!ch) {
        ch = d.createElement('div'); ch.id = 'vx40-' + c.k; ch.className = 'vx40-ch'; ch.setAttribute('role', 'tabpanel'); ch.setAttribute('data-k', c.k); ch.setAttribute('aria-label', c.t);
        ch.innerHTML = '<div class="vx40-col vx40-p"></div><div class="vx40-col vx40-s"></div>';
        /* C138 (Steven, 17/10 : « un retour intelligent : Jour → Mois, Mois → Année, et ‹ Jour pour revenir ; Année revient à
           Mois ») : en bas de chaque chapitre, « ‹ précédent » à gauche et « suivant › » à droite. */
        var prec = CHAP[ci - 1], suiv = CHAP[ci + 1];
        if (prec || suiv) {
          var bt = d.createElement('div'); bt.className = 'vx40-suite';
          [[prec, '‹ ' + (prec && prec.t), 'vx40-prec'], [suiv, (suiv && suiv.t) + ' ›', 'vx40-suiv']].forEach(function (x) {
            if (!x[0]) return; var b = d.createElement('button'); b.type = 'button'; b.className = x[2]; b.textContent = x[1];
            b.setAttribute('aria-label', (x[2] === 'vx40-prec' ? 'Revenir à ' : 'Aller à ') + x[0].t);
            b.addEventListener('click', function () { montrer(d, x[0].k, true); }); bt.appendChild(b);
          });
          ch.appendChild(bt);
        }
      }
      if (dernier.nextElementSibling !== ch) dernier.after(ch);
      dernier = ch;
      var colP = ch.querySelector('.vx40-p'), colS = ch.querySelector('.vx40-s');
      function placer(id, col) {
        var plie = id.charAt(0) === '~'; id = plie ? id.slice(1) : id;
        if (id === 'modSaisie' && prio && hold) col = hold;
        var m = d.getElementById(id); if (!m) return;
        if (plie) {
          var t = d.querySelector('.vx40-t[data-m="' + id + '"]');
          if (t && m.parentElement !== t) deplacer(m, function () { t.appendChild(m); });
          if (!t) { t = d.createElement('details'); t.className = 'vx40-t'; t.setAttribute('data-m', id); /* C133 : déplié d'office dans Jour et Mois (Steven, 17/10) ; le client peut replier. */ if (c.ouvert) t.open = true; t.innerHTML = '<summary><b></b><span></span><i aria-hidden="true">›</i></summary>'; m.before(t); deplacer(m, function () { t.appendChild(m); }); t.addEventListener('toggle', function () { signaler(d); if (t.open) d.defaultView.requestAnimationFrame(function () { aLaFin(t); }); }); }
          var tb = titre(m), rs = resume(m), sb = t.querySelector('summary>b'), sp = t.querySelector('summary>span');
          if (sb.textContent !== tb) sb.textContent = tb; if (sp.textContent !== rs) sp.textContent = rs;
          if (t.parentElement !== col) deplacer(t, function () { col.appendChild(t); });
        } else if (m.parentElement !== col) deplacer(m, function () { col.appendChild(m); });
      }
      c.p.forEach(function (id) { placer(id, colP); });
      c.s.forEach(function (id) { placer(id, colS); });
      /* L'ordre voulu est rétabli si un module a été réinséré ailleurs. */
      [[c.p, colP], [c.s, colS]].forEach(function (pc) {
        var voulu = pc[0].map(function (id) { id = id.replace('~', ''); var m = d.getElementById(id); return m && (m.parentElement && m.parentElement.classList.contains('vx40-t') ? m.parentElement : m); }).filter(function (n) { return n && n.parentElement === pc[1]; });
        var reel = [].filter.call(pc[1].children, function (n) { return voulu.indexOf(n) >= 0; });
        if (voulu.some(function (n, i) { return reel[i] !== n; })) voulu.forEach(function (n) { deplacer(n, function () { pc[1].appendChild(n); }); });
      });
      ch.classList.toggle('vx40-2', !c.large && colS.children.length > 0);
    });
    if (!prio && hold && !hold.children.length) hold.remove();
    /* Un tiroir dont le module a disparu (re-rendu) est retiré ; un doublon éventuel aussi. */
    var vus = {};
    [].forEach.call(d.querySelectorAll('.vx40-t'), function (t) { var id = t.getAttribute('data-m'); if (vus[id] || !t.querySelector(':scope>#' + id)) t.remove(); else vus[id] = true; });
    CACHE.forEach(function (id) { var h = d.getElementById(id); if (h && h.style.display !== 'none') h.style.display = 'none'; });
    /* Les titres de section sans identifiant (« Mon mois », « Mes actions ») restent dans main : on les masque aussi. */
    [].forEach.call(main.querySelectorAll(':scope>h2'), function (h) { if (h.style.display !== 'none') h.style.display = 'none'; });
    /* Tout autre bloc ajouté plus tard dans main rejoint le complément du jour, plutôt que de flotter sous les chapitres. */
    [].forEach.call(main.children, function (e) {
      if (e === ident || e === nav || e.id === 'vx40-prio' || e.classList.contains('vx40-ch') || e.tagName === 'H2' || e.tagName === 'SCRIPT' || e.tagName === 'STYLE') return;
      if (e.getBoundingClientRect().height < 1 && !e.id) return;
      d.querySelector('#vx40-jour .vx40-s').appendChild(e);
    });
    if (!d.__vx40) {
      d.__vx40 = true;
      /* Un défilement vers un module caché ouvre d'abord son chapitre et son tiroir. */
      var EP = d.defaultView.Element && d.defaultView.Element.prototype, siv = EP && EP.scrollIntoView;
      if (siv) EP.scrollIntoView = function () {
        try {
          var ch = this.closest && this.closest('.vx40-ch'); if (ch && ch.hidden) montrer(d, ch.getAttribute('data-k'), false);
          var t = this.closest && this.closest('.vx40-t'); if (t && !t.open && t !== this) t.open = true;
        } catch (e) {}
        return siv.apply(this, arguments);
      };
      montrer(d, lire(), false);
    } else {
      var k = lire(); if (!d.querySelector('.vx40-nav button[aria-selected="true"][data-k="' + k + '"]')) montrer(d, k, false);
      else [].forEach.call(d.querySelectorAll('.vx40-ch'), function (c) { var h = c.getAttribute('data-k') !== k; if (c.hidden !== h) c.hidden = h; });
    }
  }

  function finRanger(d) { var c = d.querySelector('.vx40-ch:not([hidden])'); if (c) d.defaultView.requestAnimationFrame(function () { aLaFin(c); }); }
  var suivis = new WeakSet();
  function tour() {
    [].forEach.call(doc.querySelectorAll('iframe.p41-ecran'), function (f) {
      ranger(f); try { if (f.contentDocument && f.contentDocument.querySelector('.vx40-ch')) finRanger(f.contentDocument); } catch (e) {}
      try { [].forEach.call(f.contentDocument.querySelectorAll('.vx40-ch:not([hidden]):not(.vx40-fin)'), function (c) { if (!c.__fin) c.__fin = setTimeout(function () { c.classList.add('vx40-fin'); }, 2500); }); } catch (e) {}
      var d; try { d = f.contentDocument; } catch (e) { d = null; }
      if (d && d.body && !suivis.has(d)) {
        suivis.add(d); var att = null;
        new MutationObserver(function () { if (att) return; att = setTimeout(function () { att = null; ranger(f); }, 80); }).observe(d.body, { childList: true, subtree: true, characterData: true });
      }
      if (!f.__vx40) { f.__vx40 = true; f.addEventListener('load', function () { setTimeout(function () { ranger(f); tour(); }, 60); }); }
    });
  }
  setInterval(tour, 1500);
  doc.addEventListener('DOMContentLoaded', tour);
  w.addEventListener('load', function () { setTimeout(tour, 300); });
  /* C137 — Vérification complète (Steven, 17/10) : sur iPhone, la ligne sous le logo coupait ses deux textes
     (« Indice Carte · Démonstration f… », « Période · septembre 2… »). Écran étroit : ils passent à la ligne, entiers. */
  (function () {
    if (doc.getElementById('vx40-topsub')) return;
    var st = doc.createElement('style'); st.id = 'vx40-topsub';
    st.textContent = '@media (max-width:520px){#topSub{flex-wrap:wrap!important;row-gap:2px}#topSub>#topZone,#topSub>#topKpi{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;min-width:0}#topSub>#topKpi{flex:1 1 100%!important;text-align:left!important}}';
    (doc.head || doc.documentElement).appendChild(st);
  })();
  w.VerdictAccueilChapitres = { chapitres: CHAP, ranger: ranger, tour: tour };
})();
