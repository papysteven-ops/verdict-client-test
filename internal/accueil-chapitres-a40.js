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
    { k: 'mois', t: 'Mois', ouvert: true, p: ['calendrier'], s: ['modMois', '~vdOffCard', '~modManqueCarte'] },
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
    '.vx40-suite{display:flex;justify-content:flex-end;margin:4px 0 8px}.vx40-suite button{appearance:none;border:1px solid var(--line,rgba(148,163,184,.2));background:transparent;color:var(--txt,inherit);font:inherit;font-size:14px;font-weight:700;padding:10px 16px;border-radius:999px;cursor:pointer;min-height:44px}' +
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

  function montrer(d, k, defiler) {
    var nav = d.querySelector('.vx40-nav'); if (!nav) return;
    [].forEach.call(nav.querySelectorAll('button'), function (b) { var on = b.getAttribute('data-k') === k; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    [].forEach.call(d.querySelectorAll('.vx40-ch'), function (c) { c.hidden = c.getAttribute('data-k') !== k; });
    ecrire(k); signaler(d);
    if (defiler) { try { var f = d.defaultView.frameElement, P = d.defaultView.parent; var r = nav.getBoundingClientRect(), fr = f.getBoundingClientRect(); var y = fr.top + r.top; if (y < 0 || y > P.innerHeight * 0.6) P.scrollBy({ top: y - 12, behavior: 'smooth' }); } catch (e) {} }
  }

  function ranger(f) {
    var d; try { d = f.contentDocument; } catch (e) { return; }
    if (!d || !d.body) return;
    var main = d.querySelector('main.cadre') || d.querySelector('main'); if (!main || !d.getElementById('modSaisie')) return;
    if (!d.getElementById('vx40-css')) { var s = d.createElement('style'); s.id = 'vx40-css'; s.textContent = CSS; (d.head || d.documentElement).appendChild(s); }
    main.classList.add('vx40-large');
    var ident = main.querySelector(':scope>.identite');
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
    var dernier = nav;
    CHAP.forEach(function (c, ci) {
      var ch = d.getElementById('vx40-' + c.k);
      if (!ch) {
        ch = d.createElement('div'); ch.id = 'vx40-' + c.k; ch.className = 'vx40-ch'; ch.setAttribute('role', 'tabpanel'); ch.setAttribute('data-k', c.k); ch.setAttribute('aria-label', c.t);
        ch.innerHTML = '<div class="vx40-col vx40-p"></div><div class="vx40-col vx40-s"></div>';
        var suiv = CHAP[ci + 1];
        if (suiv) { var bt = d.createElement('div'); bt.className = 'vx40-suite'; bt.innerHTML = '<button type="button">' + suiv.t + ' ›</button>'; bt.firstChild.addEventListener('click', function () { montrer(d, suiv.k, true); }); ch.appendChild(bt); }
      }
      if (dernier.nextElementSibling !== ch) dernier.after(ch);
      dernier = ch;
      var colP = ch.querySelector('.vx40-p'), colS = ch.querySelector('.vx40-s');
      function placer(id, col) {
        var plie = id.charAt(0) === '~'; id = plie ? id.slice(1) : id;
        var m = d.getElementById(id); if (!m) return;
        if (plie) {
          var t = d.querySelector('.vx40-t[data-m="' + id + '"]');
          if (t && m.parentElement !== t) t.appendChild(m);
          if (!t) { t = d.createElement('details'); t.className = 'vx40-t'; t.setAttribute('data-m', id); /* C133 : déplié d'office dans Jour et Mois (Steven, 17/10) ; le client peut replier. */ if (c.ouvert) t.open = true; t.innerHTML = '<summary><b></b><span></span><i aria-hidden="true">›</i></summary>'; m.before(t); t.appendChild(m); t.addEventListener('toggle', function () { signaler(d); }); }
          var tb = titre(m), rs = resume(m), sb = t.querySelector('summary>b'), sp = t.querySelector('summary>span');
          if (sb.textContent !== tb) sb.textContent = tb; if (sp.textContent !== rs) sp.textContent = rs;
          if (t.parentElement !== col) col.appendChild(t);
        } else if (m.parentElement !== col) col.appendChild(m);
      }
      c.p.forEach(function (id) { placer(id, colP); });
      c.s.forEach(function (id) { placer(id, colS); });
      /* L'ordre voulu est rétabli si un module a été réinséré ailleurs. */
      [[c.p, colP], [c.s, colS]].forEach(function (pc) {
        var voulu = pc[0].map(function (id) { id = id.replace('~', ''); var m = d.getElementById(id); return m && (m.parentElement && m.parentElement.classList.contains('vx40-t') ? m.parentElement : m); }).filter(function (n) { return n && n.parentElement === pc[1]; });
        var reel = [].filter.call(pc[1].children, function (n) { return voulu.indexOf(n) >= 0; });
        if (voulu.some(function (n, i) { return reel[i] !== n; })) voulu.forEach(function (n) { pc[1].appendChild(n); });
      });
      ch.classList.toggle('vx40-2', colS.children.length > 0);
    });
    /* Un tiroir dont le module a disparu (re-rendu) est retiré ; un doublon éventuel aussi. */
    var vus = {};
    [].forEach.call(d.querySelectorAll('.vx40-t'), function (t) { var id = t.getAttribute('data-m'); if (vus[id] || !t.querySelector(':scope>#' + id)) t.remove(); else vus[id] = true; });
    CACHE.forEach(function (id) { var h = d.getElementById(id); if (h && h.style.display !== 'none') h.style.display = 'none'; });
    /* Les titres de section sans identifiant (« Mon mois », « Mes actions ») restent dans main : on les masque aussi. */
    [].forEach.call(main.querySelectorAll(':scope>h2'), function (h) { if (h.style.display !== 'none') h.style.display = 'none'; });
    /* Tout autre bloc ajouté plus tard dans main rejoint le complément du jour, plutôt que de flotter sous les chapitres. */
    [].forEach.call(main.children, function (e) {
      if (e === ident || e === nav || e.classList.contains('vx40-ch') || e.tagName === 'H2' || e.tagName === 'SCRIPT' || e.tagName === 'STYLE') return;
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

  var suivis = new WeakSet();
  function tour() {
    [].forEach.call(doc.querySelectorAll('iframe.p41-ecran'), function (f) {
      ranger(f);
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
  w.VerdictAccueilChapitres = { chapitres: CHAP, ranger: ranger, tour: tour };
})();
