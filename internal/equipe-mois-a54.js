/* C172 — Comparer les mois et anticiper l'équipe (Steven, 19/10 : « j'aimerais aussi comparer les mois, ainsi je peux anticiper :
   personnel plus, moins, heures, adapter » ; « attention, je ne suis pas comptable : ce n'est pas risqué ? »).
   Lecture de pilotage, jamais un calcul de paie :
   - le passé = les vrais chiffres du client : heures et coût du mois saisis depuis les bulletins (Salaires) en priorité,
     sinon les heures de chaque service (Salaires › Équipe) ; CA HT des services, sinon des journées saisies ;
   - le mois à venir = une estimation, dite comme telle : CA HT du même mois l'an dernier × l'évolution des 3 derniers mois
     complets (bornée à ±30 %) ; heures à prévoir = ce CA ÷ le CA HT par heure de l'établissement sur ces 3 mois ;
     coût estimé = ces heures × le coût d'une heure sur ces 3 mois ;
   - aucune heure supplémentaire « due », aucun montant par salarié : la paie reste au logiciel de paie et au comptable. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.VerdictEquipeMois) return;
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function num(x) { x = Number(x); return isFinite(x) ? x : null; }
  function decaler(m, n) { var y = +m.slice(0, 4), k = +m.slice(5, 7) - 1 + n; y += Math.floor(k / 12); k = ((k % 12) + 12) % 12; return y + '-' + ('0' + (k + 1)).slice(-2); }
  var COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  function court(m) { return COURT[+m.slice(5, 7) - 1] + ' ' + m.slice(2, 4); }
  function nomMois(m) { return MOIS[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4); }

  /* Chiffres de chaque mois : CA HT, heures, coût de l'équipe (null si inconnu) et d'où viennent les heures. */
  function parMois(D, tva, aujourdhui) {
    var M = {}, t = 1 + (tva || 0);
    function m(k) { return M[k] || (M[k] = { m: k, ht: 0, h: 0, cout: 0, coutConnu: true, caJours: 0, src: 'services' }); }
    (D.services || []).forEach(function (s) {
      if (!s || String(s.d) > aujourdhui || (s.exceptional && s.exceptional !== 'normal')) return;
      var h = num(s.h), ca = num(s.ca), r = num(s.rate); if (!(h > 0)) return;
      var x = m(String(s.d).slice(0, 7)); x.h += h; if (ca != null) x.ht += ca / t; if (r == null) x.coutConnu = false; else x.cout += h * r;
    });
    (D.histJour || []).forEach(function (r) { if (r && num(r.caJ) != null && String(r.date) <= aujourdhui) m(String(r.date).slice(0, 7)).caJours += +r.caJ / t; });
    (D.laborMonths || []).forEach(function (r) {
      var h = num(r.heures), c = num(r.cout); if (!(h > 0) || !/^\d{4}-\d{2}$/.test(String(r.period))) return;
      var x = m(r.period); x.h = h; x.cout = c; x.coutConnu = c != null; x.src = 'bulletins';
    });
    Object.keys(M).forEach(function (k) {
      var x = M[k]; if (!(x.ht > 0)) x.ht = x.caJours; delete x.caJours;
      if (!x.coutConnu) x.cout = null;
      x.prod = x.h > 0 && x.ht > 0 ? x.ht / x.h : null; x.part = x.cout != null && x.ht > 0 ? x.cout / x.ht : null;
    });
    return M;
  }

  /* Cœur pur : comparaison des derniers mois et estimation du mois suivant. */
  function anticiper(D, tva, aujourdhui) {
    var M = parMois(D, tva, aujourdhui), cour = aujourdhui.slice(0, 7), prochain = decaler(cour, 1);
    var complets = Object.keys(M).filter(function (k) { return k < cour && M[k].h > 0 && M[k].ht > 0; }).sort();
    if (complets.length < 3) {
      /* Établissement qui démarre : le verdict du mois en cours, sans prévision (pas assez d'historique). */
      var D1 = M[cour] && M[cour].h > 0 && M[cour].ht > 0 ? M[cour] : null; if (!D1) return { vide: true, mois: cour };
      D1.enCours = true; return { mois: cour, direct: D1, lignes: [D1], prochain: { m: prochain }, sansHistorique: true };
    }
    var ref = complets.slice(-3), sht = 0, sh = 0, sc = 0, cc = true;
    ref.forEach(function (k) { sht += M[k].ht; sh += M[k].h; if (M[k].cout == null) cc = false; else sc += M[k].cout; });
    var prodRef = sht / sh, coutH = cc ? sc / sh : null;
    /* Évolution : les 3 derniers mois face aux mêmes mois de l'an dernier. */
    var n1 = ref.map(function (k) { return M[decaler(k, -12)]; }), evol = null;
    if (n1.every(function (x) { return x && x.ht > 0; })) evol = Math.max(0.7, Math.min(1.3, sht / n1.reduce(function (a, x) { return a + x.ht; }, 0)));
    var base = M[decaler(prochain, -12)], P = { m: prochain, n1: base && base.ht > 0 ? base : null, evol: evol };
    if (P.n1 && evol != null) {
      P.ht = P.n1.ht * evol; P.hRecent = P.ht / prodRef;
      P.hN1 = P.n1.prod ? P.ht / P.n1.prod : null;
      /* Fourchette : au rythme du même mois l'an dernier (les mois calmes gardent une équipe minimale) et au rythme récent. */
      P.hBas = P.hN1 != null ? Math.min(P.hN1, P.hRecent) : P.hRecent; P.hHaut = P.hN1 != null ? Math.max(P.hN1, P.hRecent) : P.hRecent;
      P.h = (P.hBas + P.hHaut) / 2;
      P.coutBas = coutH != null ? P.hBas * coutH : null; P.coutHaut = coutH != null ? P.hHaut * coutH : null; P.cout = coutH != null ? P.h * coutH : null;
      P.prodBas = P.ht / P.hHaut; P.prodHaut = P.ht / P.hBas;
      if (P.n1.h > 0) P.ecartN1 = P.h - P.n1.h;
    }
    var dernier = M[complets[complets.length - 1]];
    if (P.h != null) P.ecartDernier = P.h - dernier.h;
    var lignes = complets.slice(-6).map(function (k) { var x = M[k], a = M[decaler(k, -12)]; x.n1ht = a && a.ht > 0 ? a.ht : null; return x; });
    if (M[cour] && M[cour].h > 0) { var c = M[cour]; c.enCours = true; lignes.push(c); }
    var D0 = M[cour] && M[cour].h > 0 && M[cour].ht > 0 ? M[cour] : null;
    return { mois: cour, direct: D0, lignes: lignes, prochain: P, prodRef: prodRef, coutH: coutH, ref: ref, dernier: dernier };
  }

  function repere() {
    try { var t = typeof w.fmtActif === 'function' ? w.fmtActif() : null, F = t && w.FORMATS && w.FORMATS[t] && w.FAMILLES && w.FAMILLES[w.FORMATS[t].f]; F = F || (w.FAMILLES && w.FAMILLES.trad); if (F && F.ms && F.ms[1] > 0) return F.ms[1] / 100; } catch (e) {}
    return 0.36;
  }
  /* C172 (Steven, 19/10 : « mon but : que le patron comprenne, en fonction du CA, si l'équipe est OK ou pas, en direct, sans
     attendre un bilan et comprendre trop tard ») : verdict du mois en cours, à ce jour. */
  /* 4 zones (Steven : « une jauge premium : vert, jaune, orange, rouge ») : sous le repère, jusqu'à +2 points, +5 points, au-delà. */
  var SEUILS = [0, 0.02, 0.05];
  /* C308 (décision 5) : « trop lourde » au-delà du repère haut du format (029, repereMS().haut), le même seuil que Structure, Priorités et
     Alertes ; « repère + 5 points » ne sert plus que si ce repère manque. */
  function repereHaut(rep) {
    try { var m = typeof w.repereMS === 'function' ? w.repereMS() : null, h = m && Number(m.haut) / 100; if (h > rep) return h; } catch (e) {}
    try { var t = typeof w.fmtActif === 'function' ? w.fmtActif() : null, F = t && w.FORMATS && w.FORMATS[t] && w.FAMILLES && w.FAMILLES[w.FORMATS[t].f]; F = F || (w.FAMILLES && w.FAMILLES.trad); if (F && F.ms && F.ms[2] / 100 > rep) return F.ms[2] / 100; } catch (e) {}
    return rep + SEUILS[2];
  }
  function seuilJaune(rep) { return Math.min(rep + SEUILS[1], repereHaut(rep)); }
  function statut(part, rep) {
    if (part == null) return null;
    return part <= rep + 0.0005 ? { k: 'vert', mot: 'OK' } : part <= seuilJaune(rep) ? { k: 'jaune', mot: 'juste au-dessus du repère' } : part <= repereHaut(rep) + 0.0005 ? { k: 'orange', mot: 'à surveiller' } : { k: 'rouge', mot: 'trop lourde' };
  }
  var COUL = { vert: '#22c55e', jaune: '#eab308', orange: '#f97316', rouge: '#ef4444' };
  function jaugeHTML(part, rep) {
    var min = Math.max(0, rep - 0.15), max = rep + 0.15, pos = function (v) { return Math.max(0, Math.min(100, (v - min) / (max - min) * 100)); };
    var b = [pos(rep), pos(seuilJaune(rep)), pos(repereHaut(rep))], x = pos(part), st = statut(part, rep); /* C308 (décision 5) */
    return '<div class="em54-j" role="img" aria-label="L’équipe coûte ' + Math.round(part * 100) + ' € pour 100 € vendus, conseillé ' + Math.round(rep * 100) + ' € au plus, ' + st.mot + '">' +
      '<div class="em54-jb"><i style="left:0;width:' + b[0] + '%;background:linear-gradient(90deg,#16a34a,#22c55e)"></i><i style="left:' + b[0] + '%;width:' + (b[1] - b[0]) + '%;background:#eab308"></i>' +
      '<i style="left:' + b[1] + '%;width:' + (b[2] - b[1]) + '%;background:#f97316"></i><i style="left:' + b[2] + '%;width:' + (100 - b[2]) + '%;background:linear-gradient(90deg,#ef4444,#b91c1c)"></i>' +
      '<span class="em54-jr" style="left:' + b[0] + '%"></span><b class="em54-jm" style="left:' + x + '%;--c:' + COUL[st.k] + '"><span style="transform:translateX(-' + (x > 75 ? 88 : x < 25 ? 12 : 50) + '%)">' + Math.round(part * 100) + '\u00a0€ pour 100\u00a0€</span></b></div>' + /* C196 : même unité que « conseillé : 36 € » (jamais « 41 % » face à « 36 € ») */
      '<div class="em54-jl"><span>équipe légère</span><span style="left:' + b[0] + '%">conseillé : ' + Math.round(rep * 100) + ' €</span><span>trop lourde</span></div></div>';
  }
  function arr(x, p) { return Math.round(x / p) * p; }
  function eur(x) { return x == null ? '—' : Math.round(x).toLocaleString('fr-FR') + '\u00a0€'; }
  function pc(x) { return x == null ? '—' : Math.round(x * 100) + '\u00a0%'; }
  function hh(x) { return x == null ? '—' : Math.round(x).toLocaleString('fr-FR') + '\u00a0h'; }
  function sg(x) { return (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(Math.round(x)).toLocaleString('fr-FR'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* La phrase utile. */
  function directPhrase(A) {
    var x = A.direct, t = 'Du 1er à aujourd’hui : l’équipe a coûté ' + eur(x.cout) + ' pour ' + eur(x.ht) + ' de ventes hors TVA (' + hh(x.h) + ' de travail, ' + eur(x.prod) + ' de ventes par heure). Conseillé pour votre type d’établissement : ' + Math.round(A.rep * 100) + ' € de salaires au plus pour 100 € vendus.';
    if (A.statut.k === 'vert') t += ' Rien à corriger.';
    else { var cible = x.cout / A.rep - x.ht, hEnTrop = x.h - x.ht * A.rep / (x.cout / x.h); t += ' Pour y revenir : environ ' + hh(arr(hEnTrop, 5)) + ' de travail en moins d’ici la fin du mois, en calant les horaires sur les ventes réelles.'; } /* C189 : jamais « vendez plus » */
    return t;
  }
  function phrase(A) {
    if (!A || A.vide) return '';
    var P = A.prochain, nm = MOIS[+P.m.slice(5, 7) - 1];
    if (P.h == null) return A.sansHistorique ? 'Prévision du mois prochain dès 3 mois complets saisis.' : 'Pour estimer ' + nm + ', il faut le même mois de l’an dernier et les 3 mois précédents de l’an dernier.';
    var ev = Math.round((P.evol - 1) * 100);
    var t = nm.charAt(0).toUpperCase() + nm.slice(1) + ' : ventes hors TVA estimées ≈ ' + eur(arr(P.ht, 100)) + ' (' + nm + ' ' + P.n1.m.slice(0, 4) + (ev === 0 ? '' : ' ' + (ev > 0 ? '+' : '−') + Math.abs(ev) + ' %') + ', ' + (ev === 0 ? 'vos 3 derniers mois étant au même niveau que l’an dernier' : 'comme l’évolution de vos 3 derniers mois') + ').';
    t += ' ' + nm.charAt(0).toUpperCase() + nm.slice(1) + ' dernier : ' + hh(P.n1.h) + (P.n1.prod != null ? ', ' + eur(P.n1.prod) + ' de ventes par heure' : '') + (P.n1.part != null ? ', l’équipe à ' + Math.round(P.n1.part * 100) + ' € pour 100 € vendus' : '') + '.';
    if (P.hN1 != null && Math.abs(P.hHaut - P.hBas) >= 10) t += ' Pour ces ventes, prévoyez ≈ ' + hh(arr(P.hN1, 10)) + ' de travail si vous tournez comme en ' + nm + ' dernier, ≈ ' + hh(arr(P.hRecent, 10)) + ' si vous tournez comme ces 3 derniers mois (' + eur(A.prodRef) + ' de ventes par heure).';
    else t += ' Pour ces ventes, prévoyez ≈ ' + hh(arr(P.h, 10)) + ' de travail, à votre rythme habituel (' + eur(A.prodRef) + ' de ventes par heure).';
    if (P.coutBas != null) t += ' Coût estimé : ' + (Math.abs(P.coutHaut - P.coutBas) >= 100 ? '≈ ' + eur(arr(P.coutBas, 100)) + ' à ' + eur(arr(P.coutHaut, 100)) : '≈ ' + eur(arr(P.cout, 100))) + '.';
    return t;
  }
  var CSS = '.em54 table{width:100%;border-collapse:collapse;font-size:14px;margin:4px 0 10px;font-variant-numeric:tabular-nums}' +
    '.em54 th{font-size:12px;font-weight:600;opacity:.7;text-align:right;padding:4px 6px;white-space:nowrap}.em54 th:first-child,.em54 td:first-child{text-align:left}' +
    '.em54 td{text-align:right;padding:7px 6px;border-top:1px solid rgba(148,163,184,.22);white-space:nowrap;vertical-align:top}' +
    '.em54 tr.em54-prev td{font-weight:700;border-top:2px solid rgba(148,163,184,.45)}.em54 tr.em54-cours td{opacity:.75}' +
    '.em54 small.em54-s{display:block;font-size:11px;font-weight:500;opacity:.7;margin-top:2px}.em54 .em54-c{display:none}' +
    '.em54-j{margin:18px 0 14px;padding-top:26px}.em54-jb{position:relative;height:14px;border-radius:999px;background:rgba(148,163,184,.2);box-shadow:inset 0 1px 2px rgba(15,23,42,.18)}' +
    '.em54-jb>i{position:absolute;top:0;bottom:0;opacity:.9}.em54-jb>i:first-child{border-radius:999px 0 0 999px}.em54-jb>i:nth-child(4){border-radius:0 999px 999px 0}' +
    '.em54-jr{position:absolute;top:-4px;bottom:-4px;width:2px;margin-left:-1px;background:currentColor;opacity:.55}' +
    '.em54-jm{position:absolute;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#fff;border:4px solid var(--c);box-shadow:0 0 0 4px color-mix(in srgb,var(--c) 25%,transparent),0 6px 14px rgba(15,23,42,.3);animation:em54In .9s cubic-bezier(.2,.8,.2,1) both}' +
    '.em54-jm>span{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);padding:3px 9px;border-radius:999px;background:var(--c);color:#fff;font:800 13px/1.2 system-ui;white-space:nowrap;box-shadow:0 4px 10px color-mix(in srgb,var(--c) 40%,transparent)}' +
    '.em54-jl{position:relative;display:flex;justify-content:space-between;margin-top:8px;font-size:12px;opacity:.7;font-variant-numeric:tabular-nums}.em54-jl>span:nth-child(2){position:absolute;transform:translateX(-50%);font-weight:700;white-space:nowrap}' +
    '@keyframes em54In{from{left:0;opacity:0}}@media (prefers-reduced-motion:reduce){.em54-jm{animation:none}}' +
    '@media (max-width:520px){.em54 tr.em54-prev td{white-space:normal}.em54 table{font-size:13px}.em54 th,.em54 td{padding:6px 3px}.em54 td:first-child{white-space:normal}.em54 .em54-l{display:none}.em54 .em54-c{display:inline}}';
  /* C223 (Steven, 21/10 : « collées d’affilée, même info, doublons ») : dans Accueil › Mois, « Ventes et heures par service »
     dit déjà l’équipe de ce mois-ci (titre, jauge, € de trop, service par service). Cette carte ne la redit pas : elle compare
     les mois et anticipe le suivant. Elle garde « Équipe ce mois-ci » seulement quand la carte des services n’a pas ce mois. */
  function moisDejaDit(A) {
    try { var S = w.VerdictServicesHeures, R = S && S.etat ? S.etat('mois') : null; return !!(R && !R.vide && R.cle === A.mois && R.total && R.total.part != null); } catch (e) { return false; }
  }
  function carteHTML(A, dejaDit) {
    var P = A.prochain, demo = w.DB && (w.DB.demo || (w.DB.services || []).some(function (s) { return s && s.demo; }));
    var h = '<p class="kicker">Comparer les mois · anticiper l’équipe' + (demo ? ' · démonstration' : '') + '</p>' +
      (A.direct && A.direct.part != null && !dejaDit ?'<p class="titre">' + esc('Équipe ce mois-ci : ' + A.statut.mot + ' — ' + Math.round(A.direct.part * 100) + ' € pour 100 € vendus, à ce jour') + '</p>' + jaugeHTML(A.direct.part, A.rep) + '<p class="sous">' + esc(directPhrase(A)) + '</p><p class="kicker" style="margin-top:14px">Mois prochain</p>' : '') +
      '<p class="titre">' + esc(P.h != null ? nomMois(P.m).replace(/^./, function (c) { return c.toUpperCase(); }) + ' : prévoir ' + (Math.abs(P.hHaut - P.hBas) >= 10 ? 'entre ' + hh(arr(P.hBas, 10)).replace('\u00a0h', '') + ' et ' + hh(arr(P.hHaut, 10)) : 'environ ' + hh(arr(P.h, 10))) + ' d’équipe' : 'Vos mois, côte à côte') + '</p>' +
      '<p class="sous">' + esc(phrase(A)) + '</p>' +
      '<table><thead><tr><th>Mois</th><th>Ventes HT</th><th>Heures</th><th><span class="em54-l">Ventes / heure</span><span class="em54-c">€/h</span></th><th><span class="em54-l">Équipe / ventes</span><span class="em54-c">Équipe</span></th></tr></thead><tbody>';
    A.lignes.forEach(function (x) {
      var ev = x.n1ht ? (x.ht / x.n1ht - 1) : null;
      h += '<tr' + (x.enCours ? ' class="em54-cours"' : '') + '><td>' + esc(court(x.m)) + (x.enCours ? '<small class="em54-s">en cours</small>' : x.src === 'bulletins' ? '<small class="em54-s">bulletins</small>' : '') + '</td>' +
        '<td>' + eur(x.ht) + (ev != null && !x.enCours ? '<small class="em54-s">' + (ev >= 0 ? '+' : '−') + Math.abs(Math.round(ev * 100)) + ' % / an dernier</small>' : '') + '</td><td>' + hh(x.h) + '</td><td>' + eur(x.prod) + '</td><td>' + pc(x.part) + (x.cout != null ? '<small class="em54-s">' + eur(x.cout) + '</small>' : '') + '</td></tr>';
    });
    if (P.h != null) h += '<tr class="em54-prev"><td>' + esc(court(P.m)) + '<small class="em54-s">estimation</small></td><td>≈ ' + eur(arr(P.ht, 100)) + '</td><td>' + (Math.abs(P.hHaut - P.hBas) >= 10 ? Math.round(arr(P.hBas, 10)).toLocaleString('fr-FR') + '–<wbr>' + hh(arr(P.hHaut, 10)) : '≈ ' + hh(arr(P.h, 10))) + '</td><td>' + (Math.abs(P.prodHaut - P.prodBas) >= 1 ? Math.round(P.prodBas) + '–<wbr>' + eur(P.prodHaut) : eur(P.prodHaut)) + '</td><td>' + (P.coutBas != null ? (Math.abs(P.coutHaut - P.coutBas) >= 100 ? Math.round(P.coutBas / P.ht * 100) + '–<wbr>' + pc(P.coutHaut / P.ht) : pc(P.cout / P.ht)) + '<small class="em54-s">≈ ' + (Math.abs(P.coutHaut - P.coutBas) >= 100 ? Math.round(arr(P.coutBas, 100)).toLocaleString('fr-FR') + '–<wbr>' + eur(arr(P.coutHaut, 100)) : eur(arr(P.cout, 100))) + '</small>' : '—') + '</td></tr>';
    h += '</tbody></table><p class="sous" style="font-size:13px;opacity:.8">Estimation pour vous organiser (extras, congés, renforts), pas un calcul de paie : heures supplémentaires et salaires restent ceux de votre logiciel de paie ou de votre comptable. Mois passés : vos heures et coûts saisis' + (A.lignes.some(function (x) { return x.src === 'bulletins'; }) ? ' (bulletins en priorité)' : '') + '.</p>' +
      '<div class="actions"><button class="btn ghost bloc" data-c399b="1" type="button" data-em54-heures="1">Saisir les heures du mois</button></div>';
    return h;
  }
  function contexte() {
    var D = w.DB; if (!D) return null; var tva = 0;
    try { var R = typeof w.moteur === 'function' ? w.moteur() : null; tva = R && R.d && num(R.d.tva) != null ? R.d.tva : 0; } catch (e) {}
    if (tva > 1) tva = tva / 100;
    var auj = null; try { auj = String(w.verdictOperationalClock().key).slice(0, 10); } catch (e) {}
    if (!auj) { var n = new Date(); auj = n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); }
    return { D: D, tva: tva, auj: auj };
  }
  function etat() { var C = contexte(); if (!C) return null; var A = anticiper(C.D, C.tva, C.auj); if (A && !A.vide) { A.rep = repere(); A.statut = A.direct ? statut(A.direct.part, A.rep) : null; } return A; }
  function tour() {
    var f = doc.querySelector('iframe.p41-ecran'), d = null; try { d = f && f.contentDocument; } catch (e) {}
    var col = d && (d.querySelector('#vx40-mois .vx40-b') || d.querySelector('#vx40-mois .vx40-s')); if (!col) return;
    if (!d.getElementById('em54-css')) { var s = d.createElement('style'); s.id = 'em54-css'; s.textContent = CSS; (d.head || d.documentElement).appendChild(s); }
    if (!d.__em54clic) { d.__em54clic = true; d.addEventListener('click', function () { setTimeout(tour, 0); }, true); } /* C333 : ouvrir un chapitre, tout de suite */
    var chap = d.getElementById('vx40-mois'); if (chap && !chap.offsetParent) return; /* C333 (décision 19) : chapitre non affiché, rien */
    var D = w.DB || {}, H = D.histJour || [], l = H.length ? H[H.length - 1] : null, k = ''; try { k = w.verdictOperationalClock().key; } catch (e) {}
    var sg = [String(w.LOCALE || 'fr'), w.VERDICT_DB_REV || 0, w.VERDICT_VIEW_REVISION || 0, k, H.length, l ? l.date + ':' + l.caJ : '', w.VERDICT_DEMO_SESSION ? 1 : 0, D.modele || '', D.etab || '', (w.STORE && w.STORE.actif) || ''].join('|');
    if (d.__em54sig === sg) return; d.__em54sig = sg; /* C333 : signature avant le calcul */
    var A = null; try { A = etat(); } catch (e) {}
    var vieux = d.getElementById('modEquipeM');
    var dejaDit = A && !A.vide && moisDejaDit(A);
    /* C223 : sans prévision ni mois passés à comparer, il ne resterait que la ligne du mois en cours, déjà dite au-dessus. */
    if (!A || A.vide || (dejaDit && A.prochain.h == null && A.lignes.every(function (x) { return x.enCours; }))) { if (vieux) vieux.remove(); return; }
    var html = carteHTML(A, dejaDit); if (vieux && vieux.__html === html) return;
    var a = d.createElement('article'); a.className = 'mod em54'; a.id = 'modEquipeM'; a.setAttribute('data-etat', A.statut && !dejaDit ? A.statut.k : 'info'); a.setAttribute('aria-label', 'Comparer les mois et anticiper l’équipe'); a.innerHTML = html; a.__html = html;
    if (vieux) vieux.replaceWith(a); else col.appendChild(a);
    if (!d.__em54) { d.__em54 = true; d.addEventListener('click', function (ev) { if (ev.target.closest && ev.target.closest('[data-em54-heures]')) { ev.preventDefault(); ev.stopPropagation(); try { w.go('sal'); w.scrollTo(0, 0); } catch (er) {} } }, true); }
  }
  var t = setInterval(tour, 3000); if (t && t.unref) t.unref(); setTimeout(tour, 1600);
  w.VerdictEquipeMois = { anticiper: anticiper, parMois: parMois, phrase: phrase, etat: etat, tour: tour, carteHTML: carteHTML, moisDejaDit: moisDejaDit };
})();
