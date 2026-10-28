/* C190 — Les vrais documents font foi (Steven, 20/10 : « il faut toujours prendre en compte les vraies données plutôt que la
   saisie ; toujours demander au client s'il est sûr de garder ses saisies ; Verdict conseille les vrais documents ; il faut
   d'abord être sûr que ça marche parfaitement, sinon un client pourra se dire : c'est différent, je ne sais pas »).
   Le test de bout en bout du 20/10 (profil vierge, puis profil qui embellit sa saisie, FEC + caisse 2025) a montré :
   - le FEC remplaçait la saisie sans rien montrer ni demander ;
   - une retouche à la main après le FEC remontait la note, toujours étiquetée « calcul final · FEC importé » ;
   - une saisie embellie, « continuée avec cette incertitude », obtenait 100/100 « calcul final » ;
   - la caisse importée (313 journées) ne confirmait rien et ne remplissait ni panier ni couverts.
   Ce module, sans toucher aux calculs :
   1. compare, champ par champ, ce que vous avez saisi à ce que disent vos documents (FEC, caisse) ;
   2. dès qu'un chiffre saisi contredit un document : question « Revenir au document (conseillé) / Garder ma saisie », et
      garder sa saisie demande une seconde confirmation et fait passer la note en lecture non finale ;
   3. caisse d'une année complète : confirme (ou non) le chiffre d'affaires, et donne le panier et les couverts par jour ;
   4. sans aucun document, des chiffres inhabituels confirmés « avec incertitude » ne donnent plus un calcul final ;
   5. un bandeau dit toujours d'où viennent les chiffres et conseille les vrais documents. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.VerdictDocumentsFoi) return;
  var TOL = 0.01, TOL_EUR = 50; /* écart toléré : 1 % ou 50 € */

  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function vide(v) { return v == null || v === '' || !isFinite(Number(v)); }
  /* C325 (Langues) : montants et nombres au format de la langue, par la fonction commune de 029 (eur, localeTag) — jamais
     « €619990,55 » ni « €22.600/month » écrits en brut. */
  function nbr(x) { var n = Number(x); return isFinite(n) ? n.toLocaleString(tagL(), { maximumFractionDigits: 1 }) : String(x); }/* C331 : « 1 818 journées », « 5,9 » */
  function tagL() { try { return (typeof w.localeTag === 'function' ? w.localeTag() : w.LOCALE_TAG) || 'fr-FR'; } catch (e) { return 'fr-FR'; } }
  function eur(x) { if (x == null || !isFinite(x)) return '—'; if (typeof w.eur === 'function' && w.eur !== eur) { try { return w.eur(x); } catch (e) {} } return (Math.round(x) || 0).toLocaleString(tagL()) + '\u00a0€'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function copie(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function differe(a, b) { if (a == null || b == null) return false; var d = Math.abs(num(a) - num(b)); return d > Math.max(TOL_EUR, Math.abs(num(b)) * TOL); }

  /* Les grands postes, calculés de la même façon pour la saisie et pour le document. */
  var POSTES = [
    /* C296 (campagne finale, C-analyste n° 23) : emballages et commissions de plateforme manquaient au tableau, et donc au
       « Résultat avant impôt » de l'écran (118 500 € au lieu de 75 824,40 € pour le Café) ; le lecteur FEC, lui, les comptait. */
    { k: 'ca', lib: 'Chiffre d’affaires HT' }, { k: 'nour', lib: 'Achats nourriture' }, { k: 'boi', lib: 'Achats boissons' },
    { k: 'emb', lib: 'Emballages' }, { k: 'com', lib: 'Commissions plateformes' },
    { k: 'equipe', lib: 'Équipe (salaires et cotisations)' }, { k: 'loyer', lib: 'Loyer' }, { k: 'autres', lib: 'Autres charges fixes' },
    { k: 'amort', lib: 'Amortissements' }
  ];
  /* C346 : « a, b et c » — chaque élément dans son <span>, la virgule et le « et » (clé liste-et) construits ici */
  function listeSpans(L) { var out = []; L.forEach(function (x, i) { if (i) { if (i < L.length - 1) out.push({ sep: ', ' }); else out.push({ sep: ' ' }, { t: 'et', k: 'liste-et' }, { sep: ' ' }); } out.push(x); }); return out; }
  function caDeclare(D) { var rs = D.refSource || {}, rf = D.ref || {}; return rs.ca != null ? num(rs.ca) : rf.ca != null ? num(rf.ca) : null; }
  /* C300 (V15-014/015) : la question annualisait l'équipe, le loyer et les charges sur les « mois travaillés » (7 pour un
     saisonnier) alors que le moteur compte 12 mois : trois montants pour la même saisie (86 100 / 147 600 / 179 700 €), et le
     document lui-même faussé (« Vos documents 104 825 € » = 179 700 × 7 ÷ 12 ; le FEC porte 179 700 €). La question compte
     désormais exactement comme le moteur : un seul total partout. */
  /* Décision 3 (Steven, 23/10 ; moteur 029 de L3) : l'équipe d'un saisonnier compte ses mois travaillés, jamais × 12 ; le
     loyer et les autres charges restent sur l'année. */
  function moisEquipe(I) { var m = num(I && I.mois); return m >= 1 && m <= 12 ? m : 12; }
  function valeurs(D, I) {
    I = I || D.in || {}; var mois = moisEquipe(I), f = function (k) { return num(I[k]); }, autres = 0;
    for (var i = 2; i <= 10; i++) autres += f('f' + i);
    var eq = f('salb') * (1 + f('salt') / 100) + f('dirb') * (1 + f('dirt') / 100);
    return { ca: caDeclare(D), nour: vide(I.nour) ? null : f('nour'), boi: vide(I.boi) ? null : f('boi'), emb: vide(I.emb) ? null : f('emb'), com: vide(I.com) ? null : f('com'), equipe: eq * mois, loyer: f('f1') * 12, autres: autres * 12, amort: vide(I.amort) ? null : f('amort') };
  }
  /* Le détail du total d'équipe, écrit sous la ligne de la question : « 20 000 €/mois de salariés + 4 300 €/mois de dirigeant × 12 mois ». */
  function detailEquipe(I) {
    I = I || {}; var s = num(I.salb) * (1 + num(I.salt) / 100), d = num(I.dirb) * (1 + num(I.dirt) / 100), L = [];
    if (s) L.push(eur(s) + '/mois de salariés'); if (d) L.push(eur(d) + '/mois de dirigeant');
    var m = moisEquipe(I); return L.length ? L.join(' + ') + ' × ' + m + ' mois' + (m < 12 ? ' travaillés' : '') : '';
  }
  function valeursFEC(t) { return { ca: num(t.revenue), nour: num(t.food), boi: num(t.beverage), emb: num(t.packaging), com: num(t.commissions), equipe: num(t.payroll), loyer: num(t.rent), autres: num(t.other_fixed), amort: num(t.amortization) }; }
  function resultat(v) { return v.ca == null ? null : v.ca - num(v.nour) - num(v.boi) - num(v.emb) - num(v.com) - v.equipe - v.loyer - v.autres - num(v.amort); }
  function aDesDonnees(D) { var v = valeurs(D); return !!(v.ca || v.nour || v.equipe || v.loyer); }

  /* Tableau « votre saisie / votre document / écart » — affiché avant d'importer le FEC, et après. */
  function tableau(saisie, docv, caCaisse) {
    var h = '<table class="df58-t"><thead><tr><th></th>' + (saisie ? '<th>Votre saisie</th>' : '') + '<th>Votre document</th>' + (saisie ? '<th>Écart</th>' : '') + '</tr></thead><tbody>';
    POSTES.concat([{ k: 'res', lib: 'Résultat avant impôt' }]).forEach(function (p) {
      var d = p.k === 'res' ? resultat(docv) : docv[p.k], s = saisie ? (p.k === 'res' ? resultat(saisie) : saisie[p.k]) : null, e = saisie && s != null && d != null ? s - d : null;
      var fort = e != null && differe(s, d);
      h += '<tr' + (p.k === 'res' ? ' class="df58-res"' : '') + '><td>' + esc(p.lib) + (p.k === 'ca' && caCaisse && saisie ? '<br><small style="opacity:.7">colonne de gauche : lu dans votre caisse</small>' : '') + '</td>' + (saisie ? '<td>' + eur(s) + '</td>' : '') + '<td><b>' + eur(d) + '</b></td>' +
        (saisie ? '<td class="' + (fort ? 'df58-ko' : 'df58-ok') + '">' + (e == null ? '—' : fort ? (e > 0 ? '+' : '−') + eur(Math.abs(e)) : '≈') + '</td>' : '') + '</tr>';
    });
    return h + '</tbody></table>';
  }
  /* Appelé par le lecteur FEC avant le bouton « Confirmer et calculer ». */
  /* C310 (V16-067) : la page du FEC comptait « 4 postes » et la fenêtre qui suit « 5 postes » (TVA, panier et commandes en plus) :
     la page compte maintenant les mêmes écarts et dit que la question unique viendra après « Confirmer et calculer ». */
  function tvaDuFEC(ag) { var mf = ag && ag.monthlyFlux || {}, s = 0, n = 0, rev = num(ag && ag.totals && ag.totals.revenue); Object.keys(mf).forEach(function (k) { var v = Number(mf[k] && mf[k].tvaCollectee); if (isFinite(v) && v !== 0) { s += v; n++; } }); var r = rev > 0 && n ? s / rev : null; return r != null && r >= 0.02 && r <= 0.25 ? Math.round(r * 1e6) / 1e4 : null; }
  function autresAvantFEC(D, ag) {
    var L = [], t = tvaDuFEC(ag);
    if (t != null && D && D.in && !vide(D.in.tva) && Math.abs(num(D.in.tva) - t) > 0.05) L.push({ k: 'tva', lib: 'TVA moyenne', saisie: num(D.in.tva), doc: t, source: 'votre document comptable', pct: true });
    try { var an = anDocs(D), C = an ? caisse(D, an) : null;
      if (C && C.panier && !vide(D.in.panier) && Math.abs(num(D.in.panier) - C.panier) > C.panier * VOLUMES) L.push({ k: 'panier', lib: 'Panier moyen TTC', saisie: num(D.in.panier), doc: C.panier, source: 'votre caisse', cents: true });
      if (C && C.cmdj && !vide(D.in.cmdj) && Math.abs(num(D.in.cmdj) - C.cmdj) > C.cmdj * VOLUMES) L.push({ k: 'cmdj', lib: 'Commandes par jour', saisie: num(D.in.cmdj), doc: Math.round(C.cmdj * 10) / 10, source: 'votre caisse (' + nbr(C.jours) + ' journées)', nombre: true }); } catch (e) {}
    return L;
  }
  function comparaisonFEC(totals, ag) {
    var D = w.DB, s = D && aDesDonnees(D) ? valeurs(D) : null, dv = valeursFEC(totals || {}), cc = !!(D && D.refSource && D.refSource.caSource === 'caisse');
    var X = s ? autresAvantFEC(D, ag) : [], n = s ? POSTES.filter(function (p) { return differe(s[p.k], dv[p.k]); }).length + X.length : 0;
    var h2 = X.length ? '<table class="df58-t"><tbody>' + X.map(function (e) { return '<tr><td>' + esc(e.lib) + '<br><small style="opacity:.7">' + esc(e.source) + '</small></td><td>' + montant(e, e.saisie) + '</td><td><b>' + montant(e, e.doc) + '</b></td></tr>'; }).join('') + '</tbody></table>' : '';
    return '<div class="df58-cmp"><h3>Ce que dit votre document comptable</h3>' + tableau(s, dv, cc) + h2 +
      '<p>' + (s ? (n ? '<b>' + n + ' poste' + (n > 1 ? 's diffèrent' : ' diffère') + ' de votre saisie.</b> Après « Confirmer et calculer », une seule question vous demandera ce que vous gardez : vos documents (conseillé) ou votre saisie.' : 'Votre saisie concorde avec votre document : en confirmant, Verdict retient votre document.') :
        'En confirmant, Verdict retient votre document : c’est lui qui fait foi.') + '</p></div>';
  }

  /* ——— Mémoire : saisie avant document, document de référence ——— */
  var avantFec = null;
  doc.addEventListener('change', function (ev) { if (ev.target && ev.target.id === 'v44-fec-input' && w.DB) avantFec = { D: w.DB, in: copie(w.DB.in), ref: copie(w.DB.ref), refSource: copie(w.DB.refSource), provenance: copie(w.DB.dataProvenance), avait: aDesDonnees(w.DB) }; }, true);
  w.addEventListener('verdict:fec-applied', function () {
    var D = w.DB; if (!D) return;
    var t = (D.fecImport && D.fecImport.totals) || {};
    D.docRef = { source: 'fec', at: new Date().toISOString(), year: D.refSource && D.refSource.exerciseYear, in: copie(D.in), ca: caDeclare(D), valeurs: valeurs(D) };
    D.docAccords = {}; D.docChangements = {}; delete D.docChoix; if (D.docVerrou) delete D.docVerrou;
    /* C310 (V16-041) : la saisie d'avant le document est celle de CET établissement (un fichier choisi dans un autre, puis confirmé
       ici, montrait « 6 postes différaient » avec la saisie de l'autre établissement). */
    if (avantFec && avantFec.D !== D) avantFec = null;
    if (avantFec && avantFec.avait) {
      D.saisieAvantDocument = { at: new Date().toISOString(), in: avantFec.in, ref: avantFec.ref, refSource: avantFec.refSource, provenance: avantFec.provenance };
      /* Le FEC ne contient ni panier ni couverts : on garde ceux de la saisie (la caisse les vérifiera). */
      if (avantFec.in) { if (!vide(avantFec.in.panier) && vide(D.in.panier)) D.in.panier = avantFec.in.panier; if (!vide(avantFec.in.cmdj) && vide(D.in.cmdj)) D.in.cmdj = avantFec.in.cmdj; D.docRef.in.panier = D.in.panier; D.docRef.in.cmdj = D.in.cmdj; }
      ETAT.bilan = { D: D, saisie: valeurs({ in: avantFec.in, ref: avantFec.ref, refSource: avantFec.refSource }), doc: D.docRef.valeurs, caCaisse: !!(avantFec.refSource && avantFec.refSource.caSource === 'caisse'), tva: avantFec.in && !vide(avantFec.in.tva) && !vide(D.in.tva) && Math.abs(num(avantFec.in.tva) - num(D.in.tva)) > 0.05 ? { saisie: num(avantFec.in.tva), doc: num(D.in.tva) } : null };
    }
    try { var LL = D[LIV]; if (LL) ['promotions', 'remboursements'].forEach(function (k) { if (LL[k]) LL[k].dejaCompte = true; }); } catch (e) {}/* décision 32 */
    avantFec = null; ETAT.fecAt = Date.now(); enregistrer(); setTimeout(tour, 600);
  });

  /* ——— Caisse : une année complète importée confirme (ou non) le chiffre d'affaires, et donne panier et couverts ——— */
  function caisse(D, annee) {
    /* C216 : l'exercice du FEC fait foi (exercice décalé : du 1er juillet au 30 juin) ; sinon l'année civile. */
    var fi = D.fecImport, per = fi && fi.period && fi.period.start && fi.period.end && String(fi.period.year) === String(annee) ? fi.period : null;
    var dans = function (d) { d = String(d).slice(0, 10); return per ? d >= per.start && d <= per.end : d.slice(0, 4) === String(annee); };
    var L = (D.histJour || []).filter(function (r) { return r && dans(r.date) && /pos|csv|caisse|import/i.test(String(r.source || '')) && num(r.caJ) > 0; });
    /* C216 (avec W27, L3) : une activité saisonnière (avril à octobre) n'a pas 250 journées. L'année est couverte aussi quand
       chaque mois où le FEC a des ventes a au moins 15 journées de caisse (3 mois au moins). */
    if (L.length < 250) {
      var M = fi && fi.monthly || {}, mois = Object.keys(M).filter(function (k) { return dans(k + '-15') && num(M[k] && M[k].revenue) > 0; }), parMois = {};
      L.forEach(function (r) { var k = String(r.date).slice(0, 7); parMois[k] = (parMois[k] || 0) + 1; });
      /* C300 : sans FEC, une saison se lit dans la caisse elle-même (chaque mois vendu a au moins 15 journées), seulement si le
         passeport dit « saisonnière » : sinon 7 mois de caisse sont une année d'ouverture, pas une saison complète (C216). */
      if (!per && !Object.keys(M).length && D.establishmentProfile && D.establishmentProfile.seasonality === 'seasonal') mois = Object.keys(parMois);
      if (mois.length < 3 || !mois.every(function (k) { return (parMois[k] || 0) >= 15; })) return null;
    }
    /* C300 (V15-018/019) : la TVA du document comptable convertit la caisse en HT, jamais une TVA tapée par-dessus. */
    var ttc = 0, tk = 0, tva = tvaRef(D) || 10; L.forEach(function (r) { ttc += num(r.caJ); tk += num(r.tkJ); });
    return { jours: L.length, ttc: ttc, ht: ttc / (1 + tva / 100), tickets: tk, panier: tk > 0 ? ttc / tk : null, cmdj: tk > 0 ? tk / L.length : null, annee: annee };
  }

  /* C310 (V16-023) : au-delà de 1 % d'écart avec la caisse, le panier et les commandes par jour sont dans la question unique
     (75,608 saisies contre 74,4 lues passaient en silence sous l'ancien seuil de 5 %) ; en dessous, c'est un écart de définition
     ou d'arrondi : la caisse les remplace sans question (une seule définition, tickets ÷ journées réelles). */
  var VOLUMES = 0.01;
  /* C310 (V16-034) : la TVA qui convertit les minimums en TTC vient-elle d'un document ? Sans FEC, c'est une saisie (un bilan n'a
     pas de TVA) : Verdict le dit, et l'Accueil peut l'écrire sous le minimum du jour (window.VerdictDocumentsFoi.tvaEstimee). */
  function tvaEstimee(D) { D = D || w.DB; if (!D || !D.in) return null; var lu = !!(D.fecImport && D.fecImport.totals) || !!(D.refSource && /fec/.test(String(D.refSource.nature || ''))); if (lu) return null;
    var t = vide(D.in.tva) ? null : num(D.in.tva); return { tva: t, texte: (t != null ? 'TVA estimée à ' + t.toLocaleString(tagL(), { maximumFractionDigits: 2 }) + ' %' : 'TVA non renseignée') + ' : importez votre document comptable (FEC) pour l’affiner, et avec elle vos minimums TTC.' }; }
  function tvaRef(D) { var t = D.docRef && D.docRef.in && D.docRef.in.tva; return !vide(t) ? num(t) : num(D.in && D.in.tva); }
  /* C300 (V15-017) : une saisie à la main (Mes chiffres) n'a pas d'année d'exercice ; la caisse était alors ignorée : ni question
     sur le panier et les commandes, ni « elle fait foi ». Sans exercice, l'année de référence est la dernière année civile
     terminée que la caisse couvre. */
  function anCaisse(D) {
    var ans = {}, cour = new Date().getFullYear();
    (D.histJour || []).forEach(function (r) { var y = r && r.date ? Number(String(r.date).slice(0, 4)) : 0; if (y && y < cour && /pos|csv|caisse|import/i.test(String(r.source || '')) && num(r.caJ) > 0) ans[y] = 1; });
    var L = Object.keys(ans).sort().reverse(); for (var i = 0; i < L.length; i++) if (caisse(D, L[i])) return L[i];
    return null;
  }
  /* C335 (décision 21, Steven : « un client qui gonfle son panier moyen fausse tout ») : le panier se calcule dès qu'une donnée
     le permet ; jamais de panier inventé.
     1. caisse (journées et tickets) : CA ÷ tickets, il fait foi (caisse(), plus haut) ;
     2. sans caisse, ventes par article : Σ (quantités × prix TTC) ÷ tickets de l'export, sinon ÷ commandes (les plats principaux
        vendus) ;
     3. carte seule : une fourchette — plancher = le plat principal le moins cher, plafond = le plat principal le plus cher + la
        boisson et le dessert les plus chers ;
     4. le panier déclaré qui dépasse le calculé de plus de 10 %, ou sort de la fourchette, entre dans la question unique ; tant
        qu'il n'est pas tranché, c'est le panier calculé (la borne la plus proche pour la carte) qui sert aux minimums
        (D.panierCalcule, lu par le moteur) ;
     5. aucune donnée : la saisie est gardée, et c'est dit. */
  var RX_PAS_PLAT = /boisson|biere|vin\b|cocktail|soda|eau\b|jus|cafe|the\b|dessert|glace|patisserie|suppl|extra|option|sauce|topping|accompagn|entree|petit.?dej|viennois|apero/;
  var RX_BOISSON = /boisson|biere|vin\b|cocktail|soda|eau\b|jus|cafe|the\b|apero/, RX_DESSERT = /dessert|glace|patisserie/;
  function sansAccent(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function panierCalcule(D) {
    if (!D) return null;
    var an = anDocs(D), C = an ? caisse(D, an) : null; if (C && C.panier) return null;
    var V = D.caisseVolumes; if (V && num(V.panier) > 0) return { source: 'ventes', valeur: Math.round(num(V.panier) * 100) / 100, base: num(V.tickets) > 0 ? 'tickets' : 'commandes', n: num(V.tickets) || null };
    var P = (D.plats || []).filter(function (p) { return p && !p.cpArchived && num(p.ttc) > 0; });
    var vendus = P.filter(function (p) { return num(p.vol) > 0; });
    if (vendus.length) { var ca = 0, cmd = 0; vendus.forEach(function (p) { ca += num(p.vol) * num(p.ttc); if (!RX_PAS_PLAT.test(sansAccent(p.cat) + ' ' + sansAccent(p.nom))) cmd += num(p.vol); });
      if (cmd > 0) return { source: 'ventes', valeur: Math.round(ca / cmd * 100) / 100, base: 'commandes', n: Math.round(cmd) }; }
    var pl = P.filter(function (p) { return !RX_PAS_PLAT.test(sansAccent(p.cat) + ' ' + sansAccent(p.nom)); }).map(function (p) { return num(p.ttc); });
    if (!pl.length) return null;
    var maxDe = function (rx) { var L = P.filter(function (p) { return rx.test(sansAccent(p.cat)); }).map(function (p) { return num(p.ttc); }); return L.length ? Math.max.apply(null, L) : 0; };
    var bas = Math.min.apply(null, pl), haut = Math.max.apply(null, pl) + maxDe(RX_BOISSON) + maxDe(RX_DESSERT);
    return { source: 'carte', plancher: Math.round(bas * 100) / 100, plafond: Math.round(haut * 100) / 100 };
  }
  function ecartPanierCalcule(D) {
    var pc = panierCalcule(D), dec = D && D.in && !vide(D.in.panier) ? num(D.in.panier) : null; if (!pc || dec == null || !(dec > 0)) return null;
    if (pc.source === 'ventes') { if (!(dec > pc.valeur * 1.10)) return null;
      return { k: 'panier', lib: 'Panier moyen TTC', saisie: dec, doc: pc.valeur, source: 'vos ventes par article' + (pc.n ? ' (' + nbr(pc.n) + (pc.base === 'tickets' ? ' tickets)' : ' commandes)') : ''), cents: true, calcule: pc }; }
    if (dec >= pc.plancher && dec <= pc.plafond) return null;
    return { k: 'panier', lib: 'Panier moyen TTC', saisie: dec, doc: dec > pc.plafond ? pc.plafond : pc.plancher, source: 'votre carte (de ' + eurC(pc.plancher) + ' à ' + eurC(pc.plafond) + ')', cents: true, calcule: pc };
  }
  function majPanierCalcule(D) {
    var pc = panierCalcule(D), ep = ecartPanierCalcule(D), att = !!(ep && !tranche(D, 'panier', ep.saisie));
    /* écrit seulement quand une question sur le panier attend (0 changement au repos pour les autres dossiers) */
    var v = pc && att ? { source: pc.source, valeur: ep.doc, plancher: pc.plancher != null ? pc.plancher : null, plafond: pc.plafond != null ? pc.plafond : null, attente: true } : null;
    var avant = D.panierCalcule ? JSON.stringify({ source: D.panierCalcule.source, valeur: D.panierCalcule.valeur, plancher: D.panierCalcule.plancher, plafond: D.panierCalcule.plafond, attente: D.panierCalcule.attente }) : 'null';
    if (avant === JSON.stringify(v)) return false;
    if (v) { v.at = new Date().toISOString(); D.panierCalcule = v; } else delete D.panierCalcule;
    return true;
  }
  function eurC(x) { return num(x).toLocaleString(tagL(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
  function anDocs(D) { return (D.refSource && D.refSource.exerciseYear) || (D.ref && D.ref.exercice) || anCaisse(D); }
  /* Un bilan recopié (« J'ai un exercice clôturé ») fait foi pour le chiffre d'affaires de l'exercice : la caisse ne le remplace pas. */
  function bilanRecopie(D) { return !!(D.refSource && /closed-income-statement/.test(String(D.refSource.nature || ''))); }
  function tvaTranchee(D, v) { var a = (D.docAccords || {}).tva, c = (D.docChangements || {}).tva; return (a != null && Math.abs(num(a) - v) <= 0.05) || !!(c && Math.abs(num(c.saisie) - v) <= 0.05); }

  /* ——— Écarts entre la saisie actuelle et les documents (ecarts = pas encore tranchés ; differences = tous) ——— */
  /* C300 : les valeurs du document, recalculées avec la même règle que la saisie (un dossier enregistré avant C300 gardait
     « 104 825 € » pour un saisonnier dont le FEC porte 179 700 €). */
  function docValeurs(D) { var R = D.docRef; if (!R) return {}; if (!R.in) return R.valeurs || {}; var v = valeurs({ in: R.in, refSource: { ca: R.ca } }, R.in); v.ca = R.ca != null ? num(R.ca) : (R.valeurs || {}).ca; return v; }
  function differences(D) { var ba = D.docAccords, bc = D.docChangements; D.docAccords = {}; D.docChangements = {}; try { return ecarts(D); } finally { D.docAccords = ba; D.docChangements = bc; } }
  function tranche(D, k, v) { var a = (D.docAccords || {})[k], c = (D.docChangements || {})[k]; return (a != null && !differe(a, v)) || (c && !differe(c.saisie, v)); }
  function ecarts(D) {
    var out = [], acc = D.docAccords || {};
    if (D.docRef) {
      var dv = docValeurs(D), sv = valeurs(D);
      POSTES.forEach(function (p) { if (differe(sv[p.k], dv[p.k]) && !tranche(D, p.k, sv[p.k])) out.push({ k: p.k, lib: p.lib, saisie: sv[p.k], doc: dv[p.k], source: 'votre document comptable', detail: p.k === 'equipe' ? { saisie: detailEquipe(D.in), doc: detailEquipe(D.docRef.in) } : null }); });
      /* C300 (V15-018) : la TVA tapée après le FEC remplaçait celle du document sans question (10 % contre 11,94 %). */
      var tr = D.docRef.in && D.docRef.in.tva;
      if (!vide(tr) && !vide(D.in.tva) && Math.abs(num(D.in.tva) - num(tr)) > 0.05 && !tvaTranchee(D, num(D.in.tva))) out.push({ k: 'tva', lib: 'TVA moyenne', saisie: num(D.in.tva), doc: num(tr), source: 'votre document comptable', pct: true });
    }
    var an = anDocs(D), C = an ? caisse(D, an) : null;
    if (C) {
      var ca = caDeclare(D);
      if (!D.docRef && !bilanRecopie(D) && ca != null && differe(ca, C.ht) && !(acc.caCaisse != null && !differe(acc.caCaisse, ca))) out.push({ k: 'caCaisse', lib: 'Chiffre d’affaires HT ' + an, saisie: ca, doc: C.ht, source: 'votre caisse (' + nbr(C.jours) + ' journées)' });
      if (C.panier && !vide(D.in.panier) && Math.abs(num(D.in.panier) - C.panier) > C.panier * VOLUMES && !tranche(D, 'panier', num(D.in.panier))) out.push({ k: 'panier', lib: 'Panier moyen TTC', saisie: num(D.in.panier), doc: C.panier, source: 'votre caisse', cents: true });
      /* C280 (T4 vague 10) : les commandes par jour lues dans la caisse font foi aussi, dans la même question globale (90 saisies contre 74,4 lues ne déclenchaient rien). */
      if (C.cmdj && !vide(D.in.cmdj) && Math.abs(num(D.in.cmdj) - C.cmdj) > C.cmdj * VOLUMES && !tranche(D, 'cmdj', num(D.in.cmdj))) out.push({ k: 'cmdj', lib: 'Commandes par jour', saisie: num(D.in.cmdj), doc: Math.round(C.cmdj * 10) / 10, source: 'votre caisse (' + nbr(C.jours) + ' journées)', nombre: true });
    }
    /* C341 : la commission des plateformes lue dans les relevés ou le FEC fait foi */
    var el = ecartLivraison(D); if (el && !tranche(D, 'tauxLiv', el.saisie)) out.push(el);
    /* C335 : sans caisse, le panier des ventes par article ou la fourchette de la carte */
    var ep = ecartPanierCalcule(D); if (ep && !out.some(function (e) { return e.k === 'panier'; }) && !tranche(D, 'panier', ep.saisie)) out.push(ep);
    return out;
  }

  /* ——— Un seul choix pour l'ensemble des documents ———
     C190 bis (Steven, 21/10 : « pas chaque point : c'est tout le relevé comptable, soit il dit oui, soit non ; après, on ne lui
     redemande pas chaque point, c'est long et pénible ; soit il prend tout le relevé, soit il laisse sa saisie »).
     Une seule question, tous les écarts dans un tableau, deux boutons, la conséquence écrite, pas de seconde confirmation.
     La question ne revient que pour un nouveau document ou un chiffre que le patron modifie lui-même ensuite. */
  var CHAMPS = { nour: ['nour'], boi: ['boi'], emb: ['emb'], com: ['com'], amort: ['amort'], equipe: ['salb', 'salt', 'dirb', 'dirt', 'dirn', 'saln'], loyer: ['f1'], autres: ['f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10'] };
  /* C325 (T1) : « Garder toute ma saisie » juste après le FEC remettait TOUTE la saisie d'avant (D.in = saisie d'avant) alors que
     la question ne portait que sur le panier et les commandes : « 8 chiffres manquants », en-tête « — », Accueil « décrivez
     votre situation ». Le choix ne porte que sur les postes comparés dans la question ; le document reste pris pour le reste. */
  function garderPoste(D, S, k) {
    var I = S && S.in || {};
    if (k === 'ca') { if (S && S.refSource && S.refSource.ca != null) { D.refSource = D.refSource || {}; D.refSource.ca = S.refSource.ca; if (D.ref) D.ref.ca = S.refSource.ca; } return; }
    if (k === 'panier' || k === 'cmdj') { if (!vide(I[k])) D.in[k] = I[k]; return; }
    if (k === 'tva') { if (!vide(I.tva)) { D.in.tva = I.tva; D.reg = D.reg || {}; D.reg.tvac = I.tva; } return; }
    (CHAMPS[k] || []).forEach(function (c) { if (c in I) D.in[c] = I[c]; });
  }
  function appliquerDocument(D, e) {
    var R = D.docRef && D.docRef.in;
    if (e.k === 'caCaisse') { D.refSource = D.refSource || {}; D.refSource.ca = Math.round(e.doc * 100) / 100; if (D.ref) D.ref.ca = D.refSource.ca; D.refSource.caSource = 'caisse'; }
    else if (e.k === 'panier') { D.in.panier = Math.round(e.doc * 100) / 100; }
    else if (e.k === 'cmdj') { D.in.cmdj = Math.round(e.doc * 10) / 10; }/* C280 */
    else if (e.k === 'tva') { D.in.tva = e.doc; D.reg = D.reg || {}; D.reg.tvac = e.doc; }/* C300 (V15-018) */
    else if (e.k === 'tauxLiv') { appliquerLivraison(D, e.doc, /relev/.test(e.source) ? 'releve' : 'fec'); }/* C341 */
    else if (e.k === 'ca') { D.refSource.ca = D.docRef.ca; if (D.ref) D.ref.ca = D.docRef.ca; }
    else if (R) {
      var champs = CHAMPS[e.k] || [];
      champs.concat(['mois']).forEach(function (c) { if (c in R) D.in[c] = R[c]; });
    }
  }
  function cleDocuments(D) { var an = anDocs(D), C = an ? caisse(D, an) : null; return (D.docRef ? D.docRef.at : '') + '|' + (C ? C.annee + ':' + C.jours : ''); }
  function prendreTout(D, E) { (E || differences(D)).forEach(function (e) { appliquerDocument(D, e); }); D.docAccords = {}; D.docChangements = {}; D.docChoix = { cle: cleDocuments(D), choix: 'documents' }; majVerrou(D); enregistrer(true); }
  function garderTout(D, E) { D.docAccords = D.docAccords || {}; D.docChangements = {}; (E || differences(D)).forEach(function (e) { D.docAccords[e.k] = e.saisie; }); D.docChoix = { cle: cleDocuments(D), choix: 'saisie' }; majVerrou(D); enregistrer(true); }
  /* C191 (Steven, 21/10 : « ton idée pouvait être bonne : comptabilité 2025, on est en 2026, des changements — un salarié de
     plus dans l'équipe, un loyer revu en hausse… il faut vraiment comprendre tout ce qui peut se passer ») : un écart n'est pas
     forcément une saisie embellie. « Ce sont des changements depuis 2025 » : le document reste la référence, Verdict tient
     compte des changements (raison et date facultatives), la note reste un calcul (pas de lecture non finale) et le bandeau les
     montre, avec la note des seuls documents. Le chiffre d'affaires de l'exercice n'est jamais un « changement » : il reste celui
     des documents (les ventes de l'année en cours se suivent jour par jour). */
  var RAISONS = { equipe: ['Nouveau salarié', 'Départ d’un salarié', 'Augmentation de salaire', 'Heures en plus ou en moins'], loyer: ['Loyer revu', 'Nouveau bail'],
    nour: ['Prix fournisseurs', 'Changement de carte'], boi: ['Prix fournisseurs', 'Changement de carte'], autres: ['Nouveau contrat', 'Énergie'], amort: ['Nouvel investissement'], panier: ['Prix de la carte revus', 'Changement de carte'] };
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function moisLib(m) { var p = String(m || '').split('-'); return p.length === 2 ? MOIS[Number(p[1]) - 1] + ' ' + p[0] : ''; }
  function anneeDoc(D) { return (D.docRef && D.docRef.year) || (D.refSource && D.refSource.exerciseYear) || (D.ref && D.ref.exercice) || anCaisse(D) || ''; }
  function noterChangements(D, E, depuis, raisons) {
    D.docChangements = D.docChangements || {}; D.docAccords = D.docAccords || {};
    (E || differences(D)).forEach(function (e) {
      if (e.k === 'ca' || e.k === 'caCaisse') { appliquerDocument(D, e); return; }
      D.docChangements[e.k] = { lib: e.lib, saisie: e.saisie, doc: e.doc, depuis: depuis || null, raison: (raisons && raisons[e.k]) || null, cents: !!e.cents, nombre: !!e.nombre, pct: !!e.pct };
      delete D.docAccords[e.k];
    });
    D.docChoix = { cle: cleDocuments(D), choix: 'changements' }; majVerrou(D); enregistrer(true);
  }
  /* Note finale seulement si rien ne contredit les documents ; et, sans document, seulement sans « incertitude » confirmée. */
  function incertitudeSansDocument(D) {
    if (D.docRef) return false; var an = anDocs(D); if (an && caisse(D, an)) return false;
    var c = D.confirmations || {}, emp = null; try { emp = w.empreinteDonnees(); } catch (e) {}
    return Object.keys(c).some(function (k) { return emp == null || c[k] === emp; });
  }
  function majVerrou(D) {
    var p = D.dataProvenance; if (!p) return false; var avant = p.finalScoreAllowed;
    var acc = D.docAccords || {}, contredit = Object.keys(acc).length > 0, incert = incertitudeSansDocument(D), raison = contredit ? 'saisie-contre-document' : incert ? 'incertitude-sans-document' : null;
    if (raison) { if (D.docVerrou !== raison) { if (!D.docVerrou) D.docVerrouAvant = p.finalScoreAllowed; D.docVerrou = raison; } p.finalScoreAllowed = false; }
    else if (D.docVerrou) { p.finalScoreAllowed = D.docVerrouAvant !== false; delete D.docVerrou; delete D.docVerrouAvant; }
    return p.finalScoreAllowed !== avant;
  }
  function enregistrer(redessiner) {
    try { w.save && w.save('documents-foi'); } catch (e) {}
    if (redessiner) { try { w.fillInputs && w.fillInputs(); } catch (e) {} try { w.readInputs && w.readInputs(); } catch (e) {} try { w.refreshAll && w.refreshAll(); } catch (e) {}
      /* C300 (V15-016, avec L2) : les chiffres retenus ont changé (document pris, saisie gardée, caisse qui remplit le panier et
         les commandes) : les écrans qui gardent un plan calculé (minimums de l'Accueil) le recalculent sur ce signal. */
      try { var D = w.DB; w.dispatchEvent(new CustomEvent('verdict:documents-foi', { detail: { choix: D && D.docChoix ? D.docChoix.choix : null, cle: D ? cleDocuments(D) : null } })); } catch (e) {} }
  }

  /* ——— La question (une seule, jamais pendant qu'il tape) ——— */
  var ETAT = { ouvert: null, bilan: null, fecAt: 0 };
  function fermer() { var m = doc.getElementById('df58-m'); if (m) m.remove(); ETAT.ouvert = null; }
  function montant(e, x) { if (e.pct) return x.toLocaleString(tagL(), { maximumFractionDigits: 2 }) + (e.base ? ' % ' + e.base : ' %');/* C351 bis : jamais un taux de commission nu */ if (e.nombre) return x.toLocaleString(tagL(), { maximumFractionDigits: 1 }) + ' / jour'; return e.cents ? x.toLocaleString(tagL(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : eur(x); }
  var SUITE = '<p>Erreur ou oubli dans la saisie ? Verdict conseille de prendre vos documents : ce sont vos vrais chiffres. Si vous gardez votre saisie sans raison, votre note sera une <b>lecture non finale</b> ; vous pourrez changer d’avis à tout moment dans Mes chiffres.</p>';
  /* C300 (V15-083) : les mêmes choix à chaque question (la fenêtre d'arrivée du FEC n'en avait que deux, sans « changements »). */
  function choixHTML(an, caSeul, kDoc, kChange, kSaisie, libDoc) {
    var auj = new Date(), mois = [], y, m;
    for (y = Number(an) + 1 || auj.getFullYear(), m = 1; y < auj.getFullYear() || (y === auj.getFullYear() && m <= auj.getMonth() + 1); m++) { if (m > 12) { m = 0; y++; continue; } mois.push(y + '-' + ('0' + m).slice(-2)); }
    if (!mois.length) mois.push(auj.getFullYear() + '-' + ('0' + (auj.getMonth() + 1)).slice(-2));
    return (caSeul ? '' : '<p class="df58-ch">Ce sont des changements depuis ' + esc(an) + ' (nouveau salarié, loyer revu, prix…) ? Verdict garde votre document ' + esc(an) + ' comme référence et tient compte de ces changements. Depuis quand ? <select data-df58-depuis="1"><option value="">je ne sais pas</option>' + mois.reverse().map(function (x) { return '<option value="' + x + '">' + esc(moisLib(x)) + '</option>'; }).join('') + '</select></p>') +
      '<div class="df58-b"><button type="button" class="btn" data-df58="' + kDoc + '">' + esc(libDoc) + '</button>' + (caSeul ? '' : '<button type="button" class="btn sec" data-df58="' + kChange + '">Ce sont des changements depuis ' + esc(an) + '</button>') + '<button type="button" class="btn ghost" data-df58="' + kSaisie + '">Garder toute ma saisie</button></div>';
  }
  function questionHTML(E) {
    var D = w.DB, an = anneeDoc(D);
    var h = '<h2>Vos documents et votre saisie ne disent pas la même chose</h2><table class="df58-t"><thead><tr><th></th><th>Votre saisie</th><th>Vos documents ' + esc(an) + '</th></tr></thead><tbody>';
    E.forEach(function (e) {
      var r = RAISONS[e.k], sel = r ? '<select class="df58-r" data-df58-raison="' + esc(e.k) + '"><option value="">Pourquoi ? (facultatif)</option>' + r.concat(['Autre']).map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select>' : '';
      var dt = e.detail || {}, pt = function (x) { return x ? '<br><small style="opacity:.7">' + esc(x) + '</small>' : ''; };
      h += '<tr><td>' + esc(e.lib) + '<br><small style="opacity:.7">' + esc(e.source) + '</small>' + (sel ? '<br>' + sel : '') + '</td><td>' + montant(e, e.saisie) + pt(dt.saisie) + '</td><td><b>' + montant(e, e.doc) + '</b>' + pt(dt.doc) + '</td></tr>';
    });
    var caSeul = E.every(function (e) { return e.k === 'ca' || e.k === 'caCaisse'; }), pq = E.filter(function (e) { return e.k === 'panier' && e.calcule; })[0];
    var pqt = !pq ? '' : '<p class="df58-pq">' + esc(pq.calcule.source === 'ventes' ? 'Votre panier déclaré ' + eurC(pq.saisie) + ' dépasse celui de vos ventes ' + eurC(pq.doc) + ' : lequel retenir ? Tant que vous n’avez pas choisi, vos minimums sont calculés avec celui de vos ventes.' : 'Votre panier déclaré ' + eurC(pq.saisie) + ' sort de la fourchette de votre carte (de ' + eurC(pq.calcule.plancher) + ' à ' + eurC(pq.calcule.plafond) + ') : lequel retenir ? Tant que vous n’avez pas choisi, vos minimums sont calculés avec ' + eurC(pq.doc) + '.') + '</p>';
    if (pqt) h = h.replace('</h2>', '</h2>' + pqt);
    /* C335 : sans document daté (panier de la carte ou des ventes seulement), pas de « changements depuis » sans année */
    return h + '</tbody></table>' + SUITE + choixHTML(an, caSeul || !an, 'tout-doc', 'tout-change', 'tout-saisie', 'Prendre tous mes documents (conseillé)');
  }
  /* C300 (V15-017, D-A28) : la fenêtre d'arrivée du FEC ne citait ni la TVA, ni le panier, ni les commandes de la caisse ;
     la question sur ces deux-là ne venait qu'après, dans une seconde fenêtre (ou jamais). Tous les écarts sont ici. */
  function autresEcarts(B) {
    var L = []; if (B.tva) L.push({ k: 'tva', lib: 'TVA moyenne', saisie: B.tva.saisie, doc: B.tva.doc, source: 'votre document comptable', pct: true, deja: true });
    try { ecarts(w.DB).forEach(function (e) { if (e.k === 'panier' || e.k === 'cmdj') L.push(e); }); } catch (x) {}
    return L;
  }
  function bilanHTML(B, X) {
    var n = POSTES.filter(function (p) { return differe(B.saisie[p.k], B.doc[p.k]); }).length + X.length;
    var h2 = X.length ? '<table class="df58-t"><thead><tr><th></th><th>Votre saisie</th><th>Vos documents</th></tr></thead><tbody>' + X.map(function (e) { return '<tr><td>' + esc(e.lib) + '<br><small style="opacity:.7">' + esc(e.source) + '</small></td><td>' + montant(e, e.saisie) + '</td><td><b>' + montant(e, e.doc) + '</b></td></tr>'; }).join('') + '</tbody></table>' : '';
    return '<h2>Votre document comptable fait foi</h2><p>' + (n ? 'Verdict a pris les chiffres de vos documents : <b>' + n + ' poste' + (n > 1 ? 's différaient' : ' différait') + '</b> de votre saisie.' : 'Votre saisie concordait avec votre document : rien n’a changé.') + '</p>' + tableau(B.saisie, B.doc, B.caCaisse) + h2 + (n ? SUITE + choixHTML(anneeDoc(w.DB), false, 'ok', 'change-fec', 'saisie', 'Garder mon document (conseillé)') :
      '<div class="df58-b"><button type="button" class="btn" data-df58="ok">Continuer</button></div>');
  }
  function ouvrir(html) {
    /* C300 (V15-083) : « open » fait reconnaître la question comme un parcours en cours (029, verdictParcoursEnCours) : le rappel
       « Protégez votre historique » attend qu'elle soit fermée au lieu de s'empiler par-dessus. */
    var m = doc.getElementById('df58-m'); if (!m) { m = doc.createElement('div'); m.id = 'df58-m'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('open', ''); doc.body.appendChild(m); }
    m.innerHTML = '<div class="df58-p">' + html + '</div>';
  }
  /* C331 (T1) : la question du FEC arrivait ≈ 30 s après « Confirmer et calculer », par-dessus Simuler. La question unique ne
     s'ouvre que sur l'écran d'import (Mes chiffres) ou l'Accueil, jamais par-dessus un autre écran ni la fenêtre Bienvenue ;
     juste après le calcul, elle s'ouvre tout de suite ; arrivée en retard, elle attend que le patron revienne. */
  function ecranQuestion() { var sh = doc.getElementById('refSh'); if (sh && sh.classList && sh.classList.contains('on')) return false; var v = w.VIEW; return v == null || v === 'in' || v === 'pil'; }
  /* C331 : un champ caché qui garde le focus (fenêtre Bienvenue fermée, écran quitté) n'est pas une saisie en cours : il bloquait
     la question jusqu'au clic suivant, qui l'ouvrait alors par-dessus un autre écran. */
  function saisieEnCours() { var a = doc.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !(a.closest && a.closest('#df58-m')) && !(a.type === 'checkbox' || a.type === 'file' || a.type === 'radio') && (a.offsetParent !== null || a.getClientRects === undefined)); }
  function tour() {
    var D = w.DB; if (!D || !D.in) return;
    /* C300 (V15-085) : deux onglets ouverts — l'onglet caché, resté sur une version ancienne du dossier, écrivait à chaque tour
       (remplissage, verrou de la note) et provoquait « le dossier a changé dans un autre onglet » : seul l'onglet visible agit. */
    if (doc.hidden === true) return;
    try { migrerEquipe(D); } catch (e) {}
    /* démonstration : la note est déjà une simulation, rien à vérifier ni à afficher */
    if (D._demo || (D.dataProvenance && D.dataProvenance.nature === 'model_estimate')) { var bd = doc.getElementById('df58-ban'); if (bd) bd.remove(); return; }
    /* l'état de la note change (finale ↔ non finale) : on enregistre et on redessine l'écran tout de suite */
    var chP = false; try { chP = majPanierCalcule(D); } catch (e) {}/* C335 */
    if (majVerrou(D) || chP) enregistrer(true);
    banniere(D);
    var C = null, an = anDocs(D); if (an) C = caisse(D, an);
    /* panier et couverts vides : la caisse les donne, sans question.
       C300 (V15-024, V15-022) : chacun des deux, même si l'autre est déjà rempli ; et pour chaque établissement. Le « déjà
       rempli » était gardé par année pour toute la page : le 2e établissement de 2025 (coffee shop, 7,40 € et 85,5 commandes) et
       un établissement revenu vide au changement d'établissement ne recevaient plus rien. Un champ vide est toujours rempli
       par la caisse : aucune saisie quand un document donne l'information. */
    if (C && C.panier) { var rempli = false;
      if (vide(D.in.panier)) { D.in.panier = Math.round(C.panier * 100) / 100; rempli = true; }
      if (C.cmdj && vide(D.in.cmdj)) { D.in.cmdj = Math.round(C.cmdj * 10) / 10; rempli = true; }
      /* C300 (V15-017/020) : une seule définition des commandes par jour — les tickets ÷ les journées réelles de la caisse.
         Une valeur proche (moins de 5 %) recalculée ailleurs (couverts ÷ jours théoriques, CA ÷ panier) prend celle de la caisse,
         une fois par jeu de documents ; au-delà de 5 %, c'est la question unique. */
      var cle = cleDocuments(D) + '|' + String((D.refSource && D.refSource.nature) || '') + ':' + caDeclare(D);/* une fois par jeu de documents (FEC, bilan recopié, caisse) */
      if (D.docAligne !== cle && !doc.getElementById('df58-m')) {
        var pc = Math.round(C.panier * 100) / 100, cc = C.cmdj ? Math.round(C.cmdj * 10) / 10 : null;
        if (!vide(D.in.panier) && Math.abs(num(D.in.panier) - pc) >= 0.005 && Math.abs(num(D.in.panier) - C.panier) <= C.panier * VOLUMES && !tranche(D, 'panier', num(D.in.panier))) { D.in.panier = pc; rempli = true; }
        if (cc != null && !vide(D.in.cmdj) && Math.abs(num(D.in.cmdj) - cc) >= 0.05 && Math.abs(num(D.in.cmdj) - C.cmdj) <= C.cmdj * VOLUMES && !tranche(D, 'cmdj', num(D.in.cmdj))) { D.in.cmdj = cc; rempli = true; }
        D.docAligne = cle;
      }
      if (rempli) { if (D.docRef && D.docRef.in) { D.docRef.in.panier = D.in.panier; D.docRef.in.cmdj = D.in.cmdj; } enregistrer(true); }
    }
    if (ETAT.ouvert && ETAT.ouvert.D && ETAT.ouvert.D !== D) fermer();
    if (doc.getElementById('df58-m') && ETAT.ouvert && !ecranQuestion()) { if (ETAT.ouvert.bilan) ETAT.bilan = ETAT.ouvert.bilan; fermer(); return; }/* C331 : rangée, elle revient au retour */
    var juste = ETAT.fecAt && Date.now() - ETAT.fecAt < 8000;
    if (doc.getElementById('df58-m') || !ecranQuestion() || (saisieEnCours() && !juste)) return;
    if (ETAT.bilan && ETAT.bilan.D && ETAT.bilan.D !== D) ETAT.bilan = null;
    if (ETAT.bilan) { var X = autresEcarts(ETAT.bilan); ETAT.ouvert = { D: D, bilan: ETAT.bilan, extra: X }; ouvrir(bilanHTML(ETAT.bilan, X)); ETAT.bilan = null; return; }
    var E = ecarts(D); if (E.length) { ETAT.ouvert = { D: D, liste: differences(D) }; ouvrir(questionHTML(ETAT.ouvert.liste)); }
  }
  doc.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('#df58-m [data-df58],#df58-ban [data-df58]') : null; if (!b) return;
    var a = b.getAttribute('data-df58'), O = ETAT.ouvert, D = w.DB;
    if (a === 'ok') { (O && O.extra || []).forEach(function (e) { if (!e.deja) appliquerDocument(D, e); }); if (D.docRef && D.docRef.in) { D.docRef.in.panier = D.in.panier; D.docRef.in.cmdj = D.in.cmdj; }
      D.docChoix = { cle: cleDocuments(D), choix: 'documents' }; enregistrer(!!(O && O.extra && O.extra.length)); fermer(); return; }
    if (a === 'saisie') { /* juste après le FEC : revenir à toute la saisie d'avant, en un clic */
      var S = D.saisieAvantDocument; if (S) { D.docAccords = {}; var sv = valeurs({ in: S.in, ref: S.ref, refSource: S.refSource }), dv = docValeurs(D), garde = [];
        POSTES.forEach(function (p) { if (differe(sv[p.k], dv[p.k])) { D.docAccords[p.k] = sv[p.k]; garde.push(p.k); } });
        (O && O.extra || []).forEach(function (e) { D.docAccords[e.k] = e.saisie; garde.push(e.k); });/* C300 : TVA, panier et commandes gardés aussi */
        garde.forEach(function (k) { garderPoste(D, S, k); });/* C325 : seulement les postes de la question */
        D.docChoix = { cle: cleDocuments(D), choix: 'saisie' }; majVerrou(D); enregistrer(true); }
      fermer(); return; }
    if (a === 'change-fec') { var mf = doc.getElementById('df58-m'), rf = {}, dpf = mf && mf.querySelector && mf.querySelector('[data-df58-depuis]'), S2 = D.saisieAvantDocument, df = dpf ? dpf.value : '';
      if (mf && mf.querySelectorAll) [].forEach.call(mf.querySelectorAll('[data-df58-raison]'), function (x) { if (x.value) rf[x.getAttribute('data-df58-raison')] = x.value; });
      fermer(); if (S2) { var caDoc = D.docRef && D.docRef.ca; D.in = copie(S2.in); if (D.refSource && caDoc != null) { D.refSource.ca = caDoc; if (D.ref) D.ref.ca = caDoc; } }
      noterChangements(D, differences(D), df, rf); setTimeout(tour, 300); return; }
    if (a === 'tout-doc') { fermer(); prendreTout(D, O && O.liste); setTimeout(tour, 300); return; }
    if (a === 'tout-saisie') { fermer(); garderTout(D, O && O.liste); setTimeout(tour, 300); return; }
    if (a === 'tout-change') { var m = doc.getElementById('df58-m'), rs = {}, dep = m && m.querySelector('[data-df58-depuis]');
      if (m) [].forEach.call(m.querySelectorAll('[data-df58-raison]'), function (x) { if (x.value) rs[x.getAttribute('data-df58-raison')] = x.value; });
      var depuis = dep ? dep.value : ''; fermer(); noterChangements(D, O && O.liste, depuis, rs); setTimeout(tour, 300); return; }
  });

  /* La note calculée avec les chiffres des documents (calcul à part, la saisie n'est jamais modifiée). */
  var NOTE_DOC = { cle: null, v: null };
  function noteDocuments(D) {
    if (!D.docRef || !D.docRef.in) return null;
    var cle = JSON.stringify(D.docAccords || {}) + '|' + JSON.stringify(D.docChangements || {}) + '|' + D.docRef.at; if (NOTE_DOC.cle === cle) return NOTE_DOC.v;
    var bak = D.in, bakCa = D.refSource && D.refSource.ca, v = null;
    try { D.in = copie(D.docRef.in); if (D.refSource) D.refSource.ca = D.docRef.ca; try { w.verdictInvalidateViews && w.verdictInvalidateViews(); } catch (e) {} var R = w.moteur(); v = R && R.score != null ? Math.round(R.score) : null; }
    catch (e) { v = null; }
    finally { D.in = bak; if (D.refSource) D.refSource.ca = bakCa; try { w.verdictInvalidateViews && w.verdictInvalidateViews(); } catch (e) {} }
    NOTE_DOC.cle = cle; NOTE_DOC.v = v; return v;
  }
  /* ——— Bandeau : d'où viennent les chiffres ——— */
  function banniere(D) {
    var vue = doc.getElementById('v-in') || null; if (!vue) return;
    var an = anDocs(D), C = an ? caisse(D, an) : null, acc = Object.keys(D.docAccords || {}), t = [], k = 'ok';
    /* C274 (T4 vague 9) : après « Garder toute ma saisie », la première ligne disait encore que le document fait foi pour tout,
       juste au-dessus de « Vous gardez votre saisie… ». Une seule lecture : elle nomme les postes où le document fait encore foi,
       ou dit que la saisie a été retenue à sa place ; la ligne suivante nomme les postes gardés. */
    var ART = { tva: 'la TVA moyenne', ca: 'le chiffre d’affaires', nour: 'les achats de nourriture', boi: 'les achats de boissons', equipe: 'l’équipe', loyer: 'le loyer', autres: 'les autres charges fixes', amort: 'les amortissements', cmdj: 'les commandes par jour', panier: 'le panier moyen', tauxLiv: 'la commission des plateformes' };
    var nommer = function (L) { L = L.map(function (p) { return ART[p.k] || p.lib.charAt(0).toLowerCase() + p.lib.slice(1); }); return L.length > 1 ? L.slice(0, -1).join(', ') + ' et ' + L[L.length - 1] : L.join(''); };
    var gardes = POSTES.concat([{ k: 'cmdj', lib: 'Commandes par jour' }, { k: 'panier', lib: 'Panier moyen TTC' }, { k: 'tva', lib: 'TVA moyenne' }, { k: 'tauxLiv', lib: 'Commission des plateformes' }]).filter(function (p) { return acc.indexOf(p.k) >= 0; }), restent = POSTES.filter(function (p) { return acc.indexOf(p.k) < 0; });
    if (D.docRef) t.push(!gardes.length ? '✓ Document comptable ' + (D.docRef.year || '') + ' : il fait foi pour vos ventes, achats, équipe et charges.' : restent.length ? '✓ Document comptable ' + (D.docRef.year || '') + ' : il fait foi pour ' + nommer(restent) + '.' : 'Document comptable ' + (D.docRef.year || '') + ' : votre saisie a été retenue à sa place.');
    if (C) { var ca = caDeclare(D), e = ca ? (C.ht - ca) / ca : 0; /* C216 (W49) : « identique » seulement à l'euro près ; sinon l'écart est dit en euros (et en % au-delà de 1 %). */
      var gap = ca ? C.ht - ca : 0;
      /* C326 (L2, langues) : une phrase entière par gabarit (chacune dans son <span>), pour que le lot Langues la traduise entière. */
      var pc = function (x) { return (Math.round(x * 100) / 100).toLocaleString(tagL()) + ' %'; }, tete = '✓ Caisse ' + an + ' : ' + nbr(C.jours) + ' journées, ' + eur(C.ht) + ' HT', L = [];
      L.push(!ca ? tete + '.' : Math.abs(gap) < 1 ? tete + ', identique à votre chiffre d’affaires.' : Math.abs(e) <= 0.01 ? tete + ', à ' + eur(Math.abs(gap)) + ' près de votre chiffre d’affaires (' + (gap > 0 ? '+' : '−') + pc(Math.abs(e) * 100) + ').' :
        tete + ', ' + (e > 0 ? '+' : '−') + (Math.abs(Math.round(e * 1000) / 10)).toLocaleString(tagL()) + ' % par rapport à votre chiffre d’affaires' + (D.docRef ? ' : vérifiez avec votre comptable (ventes hors caisse, avoirs).' : '.'));
      var pm = C.panier ? C.panier.toLocaleString(tagL(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0€' : null, cj = C.cmdj ? (Math.round(C.cmdj * 10) / 10).toLocaleString(tagL()) : null;
      if (pm) L.push('Panier moyen ' + pm + (cj ? ', ' + cj + ' commandes par jour.' : '.')); else if (cj) L.push(cj + ' commandes par jour.');
      /* C300 (V15-017) : Mes chiffres dit aussi que la caisse fait foi pour le panier et les commandes. */
      if (C.panier && acc.indexOf('panier') < 0 && acc.indexOf('cmdj') < 0) L.push('Elle fait foi pour le panier et les commandes par jour.');
      t.push(L); }
    if (acc.length) { k = 'ko'; var nd = noteDocuments(D), Rg = null, raison = ''; try { Rg = w.moteur && w.moteur(); } catch (e) {}
      /* C280 (T4 vague 10) : si la saisie gardée fait retirer l'Indice (garde-fou C190, ex. marge exceptionnellement élevée), on ne parle pas d'une « note non finale » qui n'est plus affichée. */
      var raisons = []; try { raisons = (w.anomaliesNonConfirmees ? w.anomaliesNonConfirmees() : []).map(function (a) { var l = String(a.lb || ''); l = l.replace(/^Marge avant imp(ô|\u00f4)t /, 'marge '); return l.charAt(0).toLowerCase() + l.slice(1) + ' à vérifier'; }); raison = raisons.join(' ; '); } catch (e) {}
      /* C346 (Langues) : une phrase ou un poste par <span> (clé data-lk), la ponctuation et le « et » construits par le code : chaque
         morceau se traduit seul, dans le bon ordre ; le texte français reste identique. */
      var G = gardes.length ? [{ t: 'Vous gardez votre saisie pour', k: 'garde-pour' }, { sep: ' ' }].concat(listeSpans(gardes.map(function (p) { return { t: ART[p.k] || p.lib.charAt(0).toLowerCase() + p.lib.slice(1), k: 'poste-' + p.k }; }))) : [{ t: 'Vous gardez votre saisie plutôt que vos documents', k: 'garde-tout' }];
      /* C346 : chaque raison dans son <span> (clé garde-raison), entre parenthèses construites par le code */
      if (Rg && !Rg.ready) { G.push({ sep: '. ' }, { t: 'Avec votre saisie, Verdict n’affiche pas de note', k: 'garde-sans-note' });
        if (raisons.length) { G.push({ sep: ' (' }); raisons.forEach(function (r, i) { if (i) G.push({ sep: ' ; ' }); G.push({ t: r, k: 'garde-raison' }); }); G.push({ sep: ')' }); }
        G.push({ sep: '.' }); }
      else G.push({ sep: ' : ' }, { t: 'votre note est une lecture non finale.', k: 'garde-non-finale' });
      if (nd != null) G.push({ sep: ' ' }, { t: 'Avec vos documents, votre note serait ' + nd + ' / 100.', k: 'garde-note-docs' });
      t.push(G); }
    var ch = D.docChangements || {}, chk = Object.keys(ch);
    if (chk.length) { var ndc = noteDocuments(D), anr = anneeDoc(D);
      var CH = [{ t: 'Changements depuis ' + anr + ' pris en compte :', k: 'chg-depuis' }, { sep: ' ' }];
      chk.forEach(function (x, i) { var c = ch[x], f = function (v) { if (c.pct) return v.toLocaleString(tagL(), { maximumFractionDigits: 2 }) + ' %'; if (c.nombre) return v.toLocaleString(tagL(), { maximumFractionDigits: 1 }) + ' / jour'; return c.cents ? v.toLocaleString(tagL(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0€' : eur(v); }; if (i) CH.push({ sep: ' ; ' }); CH.push({ t: c.lib.toLowerCase() + ' ' + f(c.doc) + ' → ' + f(c.saisie), k: 'chg-' + x });
        if (c.raison || c.depuis) CH.push({ sep: ' ' }, { t: '(' + [c.raison, c.depuis ? 'depuis ' + moisLib(c.depuis) : null].filter(Boolean).join(', ') + ')', k: 'chg-raison' }); });
      CH.push({ sep: '.' }); t.push(CH);
      t.push('Votre note en tient compte.' + (ndc != null ? ' D’après vos seuls documents ' + anr + ' : ' + ndc + ' / 100.' : '')); }
    if (!C || !C.panier) { var pcb = null; try { pcb = panierCalcule(D); } catch (e) {}/* C335 : le panier dit d'où il vient */
      if (pcb && pcb.source === 'ventes') t.push(['Panier moyen calculé sur vos ventes par article : ' + eurC(pcb.valeur) + (pcb.n ? ' (' + nbr(pcb.n) + (pcb.base === 'tickets' ? ' tickets).' : ' commandes).') : '.')]);
      else if (pcb) t.push(['Votre carte situe un ticket moyen entre ' + eurC(pcb.plancher) + ' (le plat principal le moins cher) et ' + eurC(pcb.plafond) + ' (le plus cher, avec une boisson et un dessert).']);
      else if (!vide(D.in.panier)) t.push(['Panier moyen : votre saisie, sans caisse, ventes par article ni carte pour le vérifier.']);
      if (D.panierCalcule && D.panierCalcule.attente && D.panierCalcule.valeur > 0) t.push(['Tant que vous n’avez pas répondu, vos minimums sont calculés avec un panier de ' + eurC(D.panierCalcule.valeur) + '.']); }
    var te = tvaEstimee(D); if (te && (C || caDeclare(D) != null)) t.push(te.texte);
    if (!D.docRef && !C) { k = D.docVerrou ? 'ko' : 'info'; /* C216 (W56) : sur un profil vide, il n'y a ni note ni saisie : on ne le prétend pas. */
      var pret = false; try { var Rm = w.moteur && w.moteur(); pret = !!(Rm && Rm.ready); } catch (e) {}
      t.push(D.docVerrou ? 'Vous avez confirmé des chiffres inhabituels sans document : votre note reste une lecture non finale.' : pret ? 'Note calculée sur votre saisie.' : 'Aucun chiffre pour l’instant : pas encore de note.'); t.push('Déposez votre document comptable (FEC) et l’export de votre caisse : Verdict s’appuiera sur vos vrais chiffres.'); }
    /* C346 : la ponctuation suit la langue — l'espace avant « : » et « ; » n'existe qu'en français */
    var sepL = function (x) { return w.LOCALE && w.LOCALE !== 'fr' ? String(x).replace(/ ([:;])/g, '$1') : x; };
    var morceau = function (y) { return typeof y === 'string' ? '<span>' + esc(y) + '</span>' : y.sep != null ? esc(sepL(y.sep)) : '<span data-lk="' + esc(y.k) + '">' + esc(y.t) + '</span>'; };
    var html = '<b>D’où viennent vos chiffres</b>' + t.map(function (x) { return '<p>' + (Array.isArray(x) ? (x.some(function (y) { return y && typeof y === 'object'; }) ? x.map(morceau).join('') : x.map(morceau).join(' ')) : esc(x)) + '</p>'; }).join('') + (acc.length ? '<button type="button" class="btn" data-df58="tout-doc" style="margin-top:8px">Prendre mes documents</button>' : chk.length ? '<button type="button" class="btn ghost" data-df58="tout-doc" style="margin-top:8px">Annuler ces changements et revenir à mes documents</button>' : '');
    var el = doc.getElementById('df58-ban');
    if (!el) { el = doc.createElement('div'); el.id = 'df58-ban'; var h1 = vue.querySelector('h1'); if (h1 && h1.parentNode === vue) h1.insertAdjacentElement('afterend', el); else vue.insertBefore(el, vue.firstChild); }
    if (el.__html === html + k) return; el.__html = html + k; el.className = 'df58-ban df58-' + k; el.innerHTML = html;
  }

  var CSS = '#df58-m{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,6,23,.62)}' +
    '#df58-m .df58-p{max-width:560px;width:100%;max-height:90vh;overflow:auto;background:var(--card,#111827);color:var(--txt,#f8fafc);border:1px solid rgba(148,163,184,.3);border-radius:18px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.45)}' +
    'html:not(.vd-workspace-dark) #df58-m .df58-p{background:#fff;color:#0f172a}#df58-m h2{font-size:19px;margin:0 0 8px}#df58-m p{font-size:14.5px;line-height:1.5;margin:6px 0}' +
    '#df58-liv .df58-liv-t input{width:100%;min-width:0}#df58-liv .df58-liv-t td,#df58-liv .df58-liv-t th{padding:6px 4px}#df58-liv select{margin-top:4px}' +
    '.df58-b{display:flex;flex-direction:column;gap:8px;margin-top:14px}.df58-r,#df58-m [data-df58-depuis]{font:inherit;font-size:13px;margin-top:4px;padding:4px 6px;border-radius:8px;border:1px solid rgba(148,163,184,.4);background:transparent;color:inherit}.df58-ch{font-size:14px;padding:8px 10px;border-radius:10px;background:rgba(96,165,250,.1)}.df58-t{width:100%;border-collapse:collapse;font-size:13.5px;margin:8px 0;font-variant-numeric:tabular-nums}.df58-t th,.df58-t td{padding:6px 4px;text-align:right;border-top:1px solid rgba(148,163,184,.22)}.df58-t th:first-child,.df58-t td:first-child{text-align:left}.df58-t th{font-size:12px;opacity:.75}.df58-res td{font-weight:700}.df58-ko{color:#ef4444;font-weight:700}.df58-ok{color:#22c55e}' +
    '.df58-cmp{margin:12px 0;padding:12px;border-radius:12px;border:1px solid rgba(148,163,184,.3)}.df58-cmp h3{font-size:15px;margin:0 0 4px}.df58-cmp p{font-size:13.5px;line-height:1.45;margin:6px 0 0}' +
    '.df58-ban{margin:10px 0 14px;padding:12px 14px;border-radius:14px;border-left:4px solid #22c55e;background:rgba(34,197,94,.08)}.df58-ban.df58-ko{border-left-color:#f97316;background:rgba(249,115,22,.1)}.df58-ban.df58-info{border-left-color:#60a5fa;background:rgba(96,165,250,.1)}.df58-ban b{font-size:13px;letter-spacing:.04em;text-transform:uppercase;opacity:.8}.df58-ban p{margin:4px 0 0;font-size:14px;line-height:1.45}';
  /* ——— C341 (décisions 22 et 23) : la livraison, une seule source par établissement ———
     DB.livraison = { part (% des ventes TTC livrées), base: 'ttc', plateformes: [{ id, nom, taux (% du prix TTC payé par le
     client), part (% des ventes livrées) }], emballage (€ par commande livrée), platsParCommande (facultatif), commission (montant
     annuel HT quand le FEC le donne : il fait foi), promotions / remboursements ({ montant } €/an ou
     { pct } % des ventes livrées), source, at } — lue par le moteur (L3), la Carte (L7), Simuler et l'Audit. Les relevés de
     plateforme (rapprochements) et le FEC (commissions) font foi : l'écart avec le taux saisi passe dans la question unique.
     Une part ou un taux s'écrit en pourcentage : « 0,3 » est lu 30 % et c'est dit ; au-delà de 100 %, refusé. */
  var LIV = 'livraison', PLATS_LIV = [['uber', 'Uber Eats'], ['deliveroo', 'Deliveroo'], ['autre', 'Autre plateforme']];
  function pctLu(v) { var n = nb(v); if (n == null) return null; if (n < 0 || n > 100) return { v: null, refus: true }; if (n > 0 && n < 1) return { v: Math.round(n * 1000) / 10, fraction: n }; return { v: n }; }
  function tauxLivraison(L) {
    var P = ((L && L.plateformes) || []).filter(function (p) { return num(p.taux) > 0; }); if (!P.length) return null;
    if (P.length === 1) return num(P[0].taux);
    var w = 0, t = 0; P.forEach(function (p) { if (num(p.part) > 0) { w += num(p.part); t += num(p.taux) * num(p.part); } });
    return w > 0 ? Math.round(t / w * 100) / 100 : null;
  }
  function livDocs(D) {
    var out = { releve: null, fec: null }, demo = !!(D && D._demo);
    var g = 0, c = 0, r = 0, par = {};
    /* C351 (testeur Dark kitchen) : « 25 % de commission sur 1 694 053 € de ventes » pour 291 000 € de chiffre d'affaires — tous les
       relevés de l'historique (plusieurs années) étaient additionnés. Seuls comptent les mois de l'exercice des documents, sinon
       les 12 derniers mois relevés. */
    var Rec = ((D && D.reconciliations) || []).filter(function (x) { return x && !(x.demo && !demo) && /^\d{4}-\d{2}/.test(String(x.period || '')); });
    var anR = anDocs(D), dansAn = Rec.filter(function (x) { return String(x.period).slice(0, 4) === String(anR); });
    var periode = dansAn.length ? 'en ' + anR : 'sur les 12 derniers mois relevés';
    if (dansAn.length) Rec = dansAn; else { var pers = Rec.map(function (x) { return String(x.period).slice(0, 7); }).filter(function (p, i, L) { return L.indexOf(p) === i; }).sort().slice(-12); Rec = Rec.filter(function (x) { return pers.indexOf(String(x.period).slice(0, 7)) >= 0; }); }
    Rec.forEach(function (x) { (x.platforms || []).forEach(function (p) { var gr = num(p.gross); if (!(gr > 0)) return; g += gr; c += num(p.commission); r += num(p.refunds); var k = String(p.provider || 'autre').toLowerCase(); k = /uber/.test(k) ? 'uber' : /deliveroo/.test(k) ? 'deliveroo' : 'autre'; var q = par[k] || (par[k] = { g: 0, c: 0 }); q.g += gr; q.c += num(p.commission); }); });
    if (g > 0 && c > 0) { out.releve = { taux: Math.round(c / g * 10000) / 100, remb: Math.round(r / g * 10000) / 100, ventes: g, periode: periode, par: {} }; Object.keys(par).forEach(function (k) { out.releve.par[k] = Math.round(par[k].c / par[k].g * 10000) / 100; }); }
    var L = D && D[LIV], t = D && D.fecImport && D.fecImport.totals, ca = caDeclare(D), tva = D && D.in && !vide(D.in.tva) ? num(D.in.tva) : null;
    if (t && num(t.commissions) > 0 && L && num(L.part) > 0 && ca > 0 && tva != null) { var ventes = ca * (1 + tva / 100) * num(L.part) / 100; out.fec = { montant: num(t.commissions), taux: Math.round(num(t.commissions) / ventes * 10000) / 100, ventes: ventes }; }
    return out;
  }
  function ecartLivraison(D) {
    var L = D && D[LIV], ts = tauxLivraison(L); if (ts == null) return null;
    var d = livDocs(D), doc = d.releve ? d.releve.taux : d.fec ? d.fec.taux : null;
    /* relevés par plateforme : on compare les seules plateformes relevées, chacune avec son taux */
    var par = d.releve && d.releve.par || {}, vus = (L.plateformes || []).filter(function (p) { return par[p.id] != null && num(p.taux) > 0; });
    if (d.releve && vus.length) { var w = 0, a1 = 0, a2 = 0; vus.forEach(function (p) { var k = num(p.part) > 0 ? num(p.part) : 1; w += k; a1 += num(p.taux) * k; a2 += par[p.id] * k; }); ts = Math.round(a1 / w * 100) / 100; doc = Math.round(a2 / w * 100) / 100; }
    if (doc == null || Math.abs(doc - ts) <= 2) return null;
    return { k: 'tauxLiv', lib: d.releve && vus.length === 1 ? 'Commission ' + vus[0].nom : 'Commission moyenne des plateformes', saisie: ts, doc: doc, source: d.releve ? 'vos relevés de plateforme' : 'votre document comptable (commissions ' + eur(d.fec.montant) + ' sur ' + nbr(num(L.part)) + ' % des ventes livrées)', pct: true, base: 'de vos ventes TTC' };
  }
  function appliquerLivraison(D, doc, source) {
    var L = D[LIV]; if (!L || !L.plateformes) return; var ts = tauxLivraison(L); if (!(ts > 0)) return;
    /* une plateforme présente dans les relevés prend son propre taux ; sans détail par plateforme (FEC), les taux suivent la moyenne */
    var par = source === 'releve' ? ((livDocs(D).releve || {}).par || {}) : {}, vus = L.plateformes.filter(function (p) { return par[p.id] != null; });
    if (vus.length) vus.forEach(function (p) { p.taux = par[p.id]; });
    else L.plateformes.forEach(function (p) { if (num(p.taux) > 0) p.taux = Math.round(num(p.taux) * doc / ts * 10) / 10; });
    if (source === 'fec') { var fd = livDocs(D).fec; if (fd) L.commission = Math.round(fd.montant * 100) / 100; }
    L.source = source || 'releve'; L.at = new Date().toISOString();
  }
  /* Décision 22 (chef) : les emballages comptés dans les fiches plats ne se ressaisissent pas par commande (pas de double compte). */
  var RX_EMB = /emball|barquette|bo[iî]te|sachet|sac |gobelet|couvercle|kraft|packag/i;
  function embFiches(D) { var P = ((D && D.plats) || []).filter(function (p) { return p && !p.cpArchived; }), n = 0;
    P.forEach(function (p) { if ((p.rec || []).some(function (l) { return RX_EMB.test(String(Array.isArray(l) ? l[0] : (l && l.nom) || '')); })) n++; }); return { n: n, total: P.length }; }
  /* Décision 32 (chef) : promotions et remboursements, coûts variables HT, gardés en % des ventes livrées HT ; jamais ajoutés quand
     le document comptable les contient déjà (ventes nettes des rabais 709 et des avoirs). */
  function dejaDansComptes(D) { return !!(D && D.fecImport && D.fecImport.totals); }
  function ventesLivreesHT(D) { var L = D && D[LIV], ca = caDeclare(D); return L && num(L.part) > 0 && ca > 0 ? ca * num(L.part) / 100 : null; }
  function livCout(D, o, lib) { if (!o) return null; var v = ventesLivreesHT(D);
    if (o.pct != null) return lib + ' : ' + nbr(o.pct) + ' % de vos ventes livrées HT' + (v ? ', soit ' + eur(v * num(o.pct) / 100) + ' par an.' : '.');
    if (o.montant != null) return lib + ' : ' + eur(num(o.montant)) + ' par an' + (v ? ', soit ' + nbr(Math.round(num(o.montant) / v * 1000) / 10) + ' % de vos ventes livrées HT.' : '.');
    return null; }
  function livHTML(D) {
    var L = (D && D[LIV]) || {}, P = {}, v = function (x) { return x == null || x === '' ? '' : String(x).replace('.', ','); }; (L.plateformes || []).forEach(function (p) { P[p.id] = p; });
    var ro = D && D._demo ? ' disabled' : '', pr = L.promotions || {}, rb = L.remboursements || {}, EF = embFiches(D), DJ = dejaDansComptes(D);
    var unite = function (id, o) { return '<select id="' + id + '"' + ro + '><option value="eur"' + (o && o.pct == null ? ' selected' : '') + '>€ par an</option><option value="pct"' + (o && o.pct != null ? ' selected' : '') + '>% des ventes livrées HT</option></select>'; };
    return '<h3>🛵 Livraison</h3><p class="note">Une seule source pour tout Verdict (Structure, Carte, Simuler, Audit). La commission se calcule sur le prix TTC payé par le client.</p>' +
      '<div class="g2"><label class="f"><span>Part des ventes livrées (%)</span><input id="lv-part" inputmode="decimal" value="' + esc(v(L.part)) + '"' + ro + '><small>En pourcentage : 30 pour 30 %.</small></label>' +
      (EF.n ? '<div class="f"><span>Emballages</span><p class="note" data-df58-emb-fiches="1">Emballages comptés dans vos fiches plats (' + nbr(EF.n) + ' plat' + (EF.n > 1 ? 's' : '') + ' sur ' + nbr(EF.total) + ').</p></div>' :
      '<label class="f"><span>Emballage par commande livrée (€)</span><input id="lv-emb" inputmode="decimal" value="' + esc(v(L.emballage)) + '"' + ro + '><small>Barquettes, sac, couverts : par commande, pas par plat.</small></label>') +
      '<label class="f"><span>Plats par commande livrée (en moyenne)</span><input id="lv-ppc" inputmode="decimal" value="' + esc(v(L.platsParCommande)) + '"' + ro + '><small>Facultatif : la Carte ramène l’emballage d’une commande à chaque plat.</small></label></div>' +
      '<table class="df58-t df58-liv-t"><thead><tr><th>Plateforme</th><th>Commission (% de vos ventes TTC)</th><th>Part des ventes livrées (%)</th></tr></thead><tbody>' +
      PLATS_LIV.map(function (x) { var p = P[x[0]] || {}; return '<tr><td>' + esc(x[1]) + '</td><td><input id="lv-t-' + x[0] + '" inputmode="decimal" value="' + esc(v(p.taux)) + '"' + ro + '></td><td><input id="lv-p-' + x[0] + '" inputmode="decimal" value="' + esc(v(p.part)) + '"' + ro + '></td></tr>'; }).join('') + '</tbody></table>' +
      (DJ ? '<p class="note" data-df58-deja="1">Promotions et remboursements : déjà dans vos comptes (votre document comptable déduit les rabais et les avoirs de vos ventes).</p>' :
      '<details class="df58-liv-opt"' + (pr.montant != null || pr.pct != null || rb.montant != null || rb.pct != null ? ' open' : '') + '><summary>Promotions et remboursements (facultatif)</summary><div class="g2">' +
      '<label class="f"><span>Promotions financées par l’établissement</span><input id="lv-promo" inputmode="decimal" value="' + esc(v(pr.pct != null ? pr.pct : pr.montant)) + '"' + ro + '>' + unite('lv-promo-u', pr) + '</label>' +
      '<label class="f"><span>Remboursements et réclamations</span><input id="lv-remb" inputmode="decimal" value="' + esc(v(rb.pct != null ? rb.pct : rb.montant)) + '"' + ro + '>' + unite('lv-remb-u', rb) + '</label></div><p class="note">0 si rien n’est saisi.</p></details>') +
      '<p class="note df58-liv-msg"></p><p class="note df58-liv-src"></p>';
  }
  function livLireForm(D) {
    var val = function (id) { var e = doc.getElementById(id); return e ? e.value : ''; }, msgs = [], L = { base: 'ttc', plateformes: [] }, ok = true;
    var lu = function (id, lib) { var r = pctLu(val(id)); if (!r) return null; if (r.refus) { msgs.push(lib + ' : entre 0 et 100 %.'); ok = false; return null; } if (r.fraction != null) { msgs.push('« ' + String(r.fraction).replace('.', ',') + ' » est lu comme ' + nbr(r.v) + ' % : ' + lib.toLowerCase() + ' s’écrit en pourcentage (30 pour 30 %).'); var e = doc.getElementById(id); if (e) e.value = String(r.v).replace('.', ','); } return r.v; };
    var part = lu('lv-part', 'La part des ventes livrées'); if (part != null) L.part = part;
    PLATS_LIV.forEach(function (x) { var t = lu('lv-t-' + x[0], 'La commission ' + x[1]), p = lu('lv-p-' + x[0], 'La part ' + x[1]); if (t != null || p != null) L.plateformes.push({ id: x[0], nom: x[1], taux: t, part: p }); });
    var emb = doc.getElementById('lv-emb') ? nb(val('lv-emb')) : null; if (emb != null && emb >= 0) L.emballage = emb;
    var ppc = nb(val('lv-ppc')); if (ppc != null) { if (ppc >= 1 && ppc <= 20) L.platsParCommande = ppc; else msgs.push('Plats par commande : entre 1 et 20.'); }
    var avant = D && D[LIV]; if (avant && avant.commission != null) L.commission = avant.commission;/* le montant du document reste */
    var avantL = D && D[LIV] || {};
    [['lv-promo', 'promotions'], ['lv-remb', 'remboursements']].forEach(function (x) { if (!doc.getElementById(x[0])) { if (avantL[x[1]]) L[x[1]] = avantL[x[1]]; return; } var n = nb(val(x[0])); if (n == null || n < 0) return; L[x[1]] = val(x[0] + '-u') === 'pct' ? { pct: n } : { montant: n }; });
    if (dejaDansComptes(D)) ['promotions', 'remboursements'].forEach(function (k) { if (L[k]) L[k].dejaCompte = true; });
    var parts = L.plateformes.filter(function (p) { return p.part != null; }).reduce(function (a, p) { return a + p.part; }, 0);
    if (L.plateformes.length > 1 && parts > 0 && Math.abs(parts - 100) > 0.5) msgs.push('Les parts des plateformes font ' + nbr(parts) + ' % : elles doivent faire 100 % des ventes livrées.');
    if (L.plateformes.filter(function (p) { return num(p.taux) > 0; }).length > 1 && !(parts > 0)) msgs.push('Indiquez la part de chaque plateforme pour calculer la commission moyenne.');
    return { L: L, ok: ok, msgs: msgs, vide: L.part == null && !L.plateformes.length && L.emballage == null && L.platsParCommande == null && !L.promotions && !L.remboursements };
  }
  function livSources(D) {
    var d = livDocs(D), L = D[LIV], t = [], ts = tauxLivraison(L);
    /* C339 (L3) : un montant « Commissions plateformes (€/an) » saisi dans Mes chiffres fait foi pour le moteur ; le taux en est
       déduit : le bloc dit alors les deux, jamais « retenue » pour un taux que le calcul n'utilise pas. */
    var Rm = null; try { Rm = L && w.moteur ? w.moteur() : null; } catch (e) {}
    var parMontant = !!(Rm && Rm.d && Rm.d.comSource === 'saisie' && num(D.in && D.in.com) > 0);
    if (ts != null) t.push((parMontant ? 'Commission moyenne saisie : ' : 'Commission moyenne retenue : ') + nbr(ts) + ' % de vos ventes TTC.');
    if (parMontant) t.push('Vos commissions saisies dans Mes chiffres (' + eur(num(D.in.com)) + '/an) font foi' + (num(Rm.d.livTaux) > 0 ? ' : soit ' + nbr(Math.round(num(Rm.d.livTaux) * 10) / 10) + ' % de vos ventes livrées TTC.' : '.'));
    if (d.releve) t.push('Vos relevés de plateforme ' + d.releve.periode + ' : commission de ' + nbr(d.releve.taux) + ' % de vos ventes TTC (' + eur(d.releve.ventes) + ' de ventes TTC), remboursements de ' + nbr(d.releve.remb) + ' % de vos ventes TTC.');
    if (d.fec) t.push('Votre document comptable : ' + eur(d.fec.montant) + ' de commissions, soit ' + nbr(d.fec.taux) + ' % de vos ventes livrées TTC.');
    if (L && !dejaDansComptes(D)) [['promotions', 'Promotions financées'], ['remboursements', 'Remboursements']].forEach(function (x) { var c = livCout(D, L[x[0]], x[1]); if (c) t.push(c); });
    return t;
  }
  function livMonter() {
    var D = w.DB, vin = doc.getElementById('v-in'), com = doc.getElementById('i-com'); if (!D || !vin || !com) return;
    /* décision 32 : avec un document comptable, des promotions ou remboursements saisis avant ne s'ajoutent jamais (une seule écriture, si la marque manque) */
    try { var LD = D[LIV]; if (LD && !D._demo && dejaDansComptes(D) && ['promotions', 'remboursements'].some(function (k) { return LD[k] && !LD[k].dejaCompte; })) { ['promotions', 'remboursements'].forEach(function (k) { if (LD[k]) LD[k].dejaCompte = true; }); enregistrer(true); } } catch (e) {}
    var carte = com.closest ? com.closest('.card') : null; if (!carte || !carte.parentNode) return;
    var el = doc.getElementById('df58-liv'), sig = JSON.stringify(D[LIV] || null) + '|' + (D._demo ? 1 : 0);
    if (!el) { el = doc.createElement('div'); el.className = 'card'; el.id = 'df58-liv'; carte.parentNode.insertBefore(el, carte.nextSibling); }
    var a = doc.activeElement, dedans = a && el.contains && el.contains(a);
    if (el.getAttribute('data-df58-sig') !== sig && !dedans) { el.innerHTML = livHTML(D); el.setAttribute('data-df58-sig', sig); }
    var src = el.querySelector('.df58-liv-src'), phr = livSources(D), txt = phr.join(' ');
    /* C389 (audit A67) : une phrase par <span>, pour que chacune se traduise ; la signature reste française (une phrase traduite n'est pas réécrite) */
    if (src && src.getAttribute('data-df58-sig') !== txt) { src.innerHTML = phr.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join(' '); src.setAttribute('data-df58-sig', txt); }
  }
  doc.addEventListener('change', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('#df58-liv') : null, D = w.DB; if (!el || !D || D._demo) return;
    var r = livLireForm(D), m = el.querySelector('.df58-liv-msg'); if (m) m.textContent = r.msgs.join(' ');
    if (!r.ok) return;
    if (r.vide) delete D[LIV]; else { r.L.source = 'saisie'; r.L.at = new Date().toISOString(); D[LIV] = r.L; }
    el.setAttribute('data-df58-sig', JSON.stringify(D[LIV] || null) + '|0'); enregistrer(true);
  }, true);
  function css() { if (!doc.getElementById('df58-css')) { var s = doc.createElement('style'); s.id = 'df58-css'; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s); } }
  /* Étiquette de la note : document + changements déclarés = « calcul à jour », pas « FEC importé » tout court. */
  function etiquette() {
    var orig = w.verdictScoreText; if (typeof orig !== 'function' || orig.__df58) return;
    var f = function (k, R, d) { var t = orig.apply(this, arguments); try { var D = d || w.DB; if (k === 'label' && D && D.docChangements && Object.keys(D.docChangements).length && /FEC/.test(String(t))) return 'CALCUL À JOUR · FEC ' + anneeDoc(D) + ' + VOS CHANGEMENTS'; } catch (e) {} return t; };
    f.__df58 = true; w.verdictScoreText = f;
  }
  /* ——— C300 (V15-020) : la fiche « J'ai un exercice clôturé › Recopiez les totaux » (verdict-029, refFormulaire) ———
     - aucune ligne pour les amortissements : résultat 102 990,55 € au lieu de 93 990,55 €, note 89 au lieu de 88 ;
     - les couverts étaient redemandés alors que la caisse importée donne les tickets de l'exercice.
     La fiche reste celle de 029 ; ce module y ajoute la ligne « Amortissements » (facultative, 0 si aucun) et reprend les tickets
     de la caisse quand elle couvre l'année saisie. */
  function nb(v) { v = String(v == null ? '' : v).replace(/\s| | /g, '').replace(',', '.'); if (v === '') return null; var n = Number(v); return isFinite(n) ? n : null; }
  function caisseFiche() { var D = w.DB, y = doc.getElementById('rf-year'), an = y ? nb(y.value) : null; return D && an ? caisse(D, String(an)) : null; }
  function ficheBilan() {
    var p = doc.getElementById('refP'), cf = doc.getElementById('rf-cf'); if (!p || !cf) return;
    if (!doc.getElementById('rf-amort')) {
      var lab = cf.closest ? cf.closest('label') : null, D = w.DB, v = D && D.in && !vide(D.in.amort) && D.refSource && /closed-income-statement/.test(String(D.refSource.nature || '')) ? D.in.amort : null;
      var l = doc.createElement('label'); l.className = 'f';
      l.innerHTML = '<span>Amortissements (€/an)</span><input id="rf-amort" inputmode="decimal" value="' + (v != null ? String(v).replace('.', ',') : '') + '"><small>Dotations aux amortissements, sur votre compte de résultat. 0 si aucune.</small>';
      if (lab && lab.parentNode) lab.parentNode.insertBefore(l, lab.nextSibling);
      var i = doc.getElementById('rf-amort'); if (i) i.addEventListener('input', function () { try { w.refApercu && w.refApercu(); } catch (e) {} });
    }
    /* C300 (V15-082) : « Jours ouverts / semaine » et « Mois travaillés » préremplis 6 et 12 sans aucune donnée (valeurs d'un
       dossier neuf) : lus dans la caisse quand elle est là, sinon à renseigner par le patron. */
    var Dj = w.DB, saisi = !!(Dj && ((Dj.maj && Dj.maj.activite) || (Dj.fermesSource && Dj.fermesSource.source === 'patron') || (Dj.refSource && Dj.refSource.nature && !/fec/.test(String(Dj.refSource.nature)))));
    var rj = doc.getElementById('rf-jsem'), rm = doc.getElementById('rf-mois');
    if (rj && poserJoursCalendrier('rf-jsem', joursCalendrier(Dj))) rj.setAttribute('data-df58-j', '1');/* C364 */
    if (rj && !rj.getAttribute('data-df58-j') && !saisi) { rj.setAttribute('data-df58-j', '1'); var jl = null; try { jl = w.VerdictPassageUnique && w.VerdictPassageUnique.joursSemaine ? w.VerdictPassageUnique.joursSemaine() : null; } catch (e) {}
      if (jl && jl.jours) { rj.value = String(jl.jours).replace('.', ',');/* C325 (T3) : « 5,9 », jamais « 5.9 » */ var sj = rj.parentNode && rj.parentNode.querySelector('small'); if (sj) sj.textContent = 'Lus dans vos journées de caisse.'; } else if (rj.value === '6') rj.value = '';
      if (rm && rm.value === '12') rm.value = ''; }
    var cv = doc.getElementById('rf-cv'), C = caisseFiche();
    if (cv && C && C.tickets > 0 && !String(cv.value || '').trim()) {
      cv.value = String(Math.round(C.tickets)); cv.setAttribute('data-df58-caisse', '1');
      var sm = cv.parentNode && cv.parentNode.querySelector('small'); if (sm) sm.textContent = 'Lu dans votre caisse : ' + Math.round(C.tickets).toLocaleString(tagL()) + ' tickets sur ' + nbr(C.jours) + ' journées.';
    }
  }
  /* C300 (V15-111) : « J'ai ouvert récemment » (029, recentFormulaire) ignorait la caisse déjà importée : date d'ouverture à
     aujourd'hui alors que la caisse commence le 2 mars, fin de période aujourd'hui (journée pas finie), CA et tickets à retaper,
     jours ouverts « 6 » d'office. Les champs encore à leur valeur de départ sont repris de la caisse ; rien n'est inventé : sans
     TVA connue, le CA de la caisse (TTC) est écrit sous le champ hors taxes au lieu d'être converti. */
  function isoJour(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function journeesCaisse(D) {
    var auj = new Date(), today = isoJour(auj), depuis = isoJour(new Date(auj.getTime() - 400 * 864e5));
    return ((D && D.histJour) || []).filter(function (r) { return r && r.date && !r.demo && /pos|csv|caisse|import/i.test(String(r.source || '')) && num(r.caJ) > 0 && String(r.date).slice(0, 10) >= depuis && String(r.date).slice(0, 10) < today; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  }
  /* la date de la phrase C322 suit la langue (le mois n'est écrit en français qu'en français ; l'année seulement si ce n'est pas l'année en cours) */
  function jourTexte(d) { if (w.LOCALE && w.LOCALE !== 'fr') { try { var o = { day: 'numeric', month: 'long' }; if (d.slice(0, 4) !== String(new Date().getFullYear())) o.year = 'numeric'; return new Intl.DateTimeFormat(w.LOCALE_TAG || w.LOCALE, o).format(new Date(d + 'T12:00:00')); } catch (e) {} }
    var M = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'], j = Number(d.slice(8, 10)), m = Number(d.slice(5, 7)), a = d.slice(0, 4);
    return (j === 1 ? '1er' : String(j)) + ' ' + M[m - 1] + (a !== String(new Date().getFullYear()) ? ' ' + a : ''); }
  /* C322 (décision 14) : « J'ai ouvert récemment », ouverture tapée le 1er avril alors que la caisse vend dès le 2 mars : le
     suivi partait du 2 mars sans le dire, la période observée commençait au 1er avril (029, C214) avec le CA de toute la caisse,
     mars compris : alerte « période de démarrage inhabituelle » à tort. La caisse fait foi : l'ouverture retenue est la première
     journée de caisse, écrite sous la date (et sous le début de la période), dans la même question. Ouverture tapée avant la
     première journée de caisse : gardée. Pendant la frappe, la phrase s'affiche seulement (la date n'est pas changée sous les
     doigts) ; la date est remplacée en quittant le champ, au passage à l'étape suivante et à la validation. */
  function noteOuverture(t) {
    ['rc-open', 'rc-start'].forEach(function (id) { var e = doc.getElementById(id), lab = e && e.parentNode; if (!lab) return; var n = lab.querySelector('small[data-df58-ouverture]');
      if (!t) { if (n) n.remove(); return; }
      if (!n) { n = doc.createElement('small'); n.setAttribute('data-df58-ouverture', '1'); n.style.cssText = 'display:block;font-weight:600'; lab.appendChild(n); } n.textContent = t; });
  }
  function ouvertureCaisse(appliquer) {
    var o = doc.getElementById('rc-open'); if (!o) return null;
    var v = String(o.value || '').trim(), L = journeesCaisse(w.DB), d0 = L.length >= 3 ? String(L[0].date).slice(0, 10) : null;
    if (!d0 || !/^\d{4}-\d{2}-\d{2}$/.test(v) || v > isoJour(new Date())) return null;
    if (!(v > d0)) { if (v !== d0) noteOuverture(''); return null; }
    noteOuverture('Votre caisse montre des ventes dès le ' + jourTexte(d0) + ' : l’ouverture est prise au ' + jourTexte(d0) + '.');
    if (appliquer === false) return { tapee: v, retenue: d0, applique: false };
    o.value = d0; o.setAttribute('data-df58-caisse', '1');
    var st = doc.getElementById('rc-start'), ca = doc.getElementById('rc-ca');
    if (st && (!st.value || st.value === v || (ca && ca.getAttribute('data-df58-caisse') && st.value > d0))) st.value = d0;
    return { tapee: v, retenue: d0, applique: true };
  }
  /* C364 (décision 36) : une seule donnée pour les jours d'ouverture — le repos de « Vos journées » (DB.fermes, choisi par le patron
     ou lu dans la caisse). Dès qu'il est connu, Bienvenue et « J'ai ouvert récemment » en déduisent les jours par semaine
     (7 − jours de repos), en lecture : ils se règlent dans « Vos journées ». */
  function joursCalendrier(D) {
    var s = D && D.fermesSource, F = D && D.fermes; if (!s || !/^(patron|caisse)$/.test(String(s.source || '')) || !Array.isArray(F)) return null;
    var texte = ''; try { texte = w.VerdictPassageUnique && w.VerdictPassageUnique.reposTexte ? w.VerdictPassageUnique.reposTexte(F.slice().sort()) : ''; } catch (e) {}
    return { jours: Math.max(1, 7 - F.length), texte: texte };
  }
  function poserJoursCalendrier(id, jc) {
    var e = doc.getElementById(id); if (!e || !jc) return false; var v = String(jc.jours);
    if (e.value !== v) e.value = v; if (!e.readOnly) e.readOnly = true; e.setAttribute('data-df58-calendrier', '1');
    var lab = e.parentNode, sm = lab && lab.querySelector('small'); if (lab && !sm) { sm = doc.createElement('small'); lab.appendChild(sm); }
    var t = 'Réglé dans vos journées' + (jc.texte ? ' : ' + jc.texte : '') + '.'; if (sm && sm.textContent !== t) sm.textContent = t; return true;
  }
  function ficheRecente() {
    var D = w.DB, p = doc.getElementById('refP'), o = doc.getElementById('rc-open'); if (!D || !p || !o || o.getAttribute('data-df58-recent')) return;
    o.setAttribute('data-df58-recent', '1');
    if (o.addEventListener) { o.addEventListener('input', function () { try { ouvertureCaisse(false); } catch (e) {} }); o.addEventListener('blur', function () { try { ouvertureCaisse(); } catch (e) {} }); }
    var today = isoJour(new Date());
    var L = journeesCaisse(D);
    var q = {}; try { q = (typeof w.recentStored === 'function' ? w.recentStored() : {}) || {}; } catch (e) {}
    var donne = function (v) { return !!v && v !== today; };
    var put = function (id, v, garder) { var e = doc.getElementById(id); if (!e || v == null || v === '') return null; if (garder && String(e.value || '').trim() !== '') return null; e.value = String(v); e.setAttribute('data-df58-caisse', '1'); try { e.dispatchEvent(new Event('input', { bubbles: true })); } catch (x) {} return e; };
    var aide = function (id, t) { var e = doc.getElementById(id), sm = e && e.parentNode && e.parentNode.querySelector('small'); if (!e) return; if (!sm) { sm = doc.createElement('small'); e.parentNode.appendChild(sm); } sm.textContent = t; };
    if (L.length >= 3) {
      var d0 = String(L[0].date).slice(0, 10), d1 = String(L[L.length - 1].date).slice(0, 10), ttc = 0, tk = 0, tkOk = true;
      L.forEach(function (r) { ttc += num(r.caJ); if (num(r.tkJ) > 0) tk += num(r.tkJ); else tkOk = false; });
      /* C325 (T4, V16-047 n° 24) : une fiche déjà enregistrée (DB.recent) avec la date du jour ou des champs vides bloquait la caisse :
         ouverture au jour même, CA et tickets vides, jours par semaine vides. Seule une valeur vraiment donnée par le patron est gardée. */
      if (!donne(q.opened) && (o.value === today || !o.value)) put('rc-open', d0);
      var st = doc.getElementById('rc-start'), en = doc.getElementById('rc-end');
      if (st && !donne(q.start) && (st.value === today || st.value === o.value || !st.value)) put('rc-start', d0);
      if (en && !donne(q.end) && (en.value === today || !en.value)) put('rc-end', d1);
      if (tkOk && tk > 0) put('rc-tickets', Math.round(tk), true);
      var tva = !vide(D.in && D.in.tva) ? num(D.in.tva) : null;
      if (tva != null) { put('rc-ca', String(Math.round(ttc / (1 + tva / 100) * 100) / 100).replace('.', ','), true); put('rc-tva', String(tva).replace('.', ','), true); aide('rc-ca', 'Repris de votre caisse : ' + eur(ttc) + ' TTC sur ' + L.length + ' journées, à ' + tva.toLocaleString(tagL()) + ' % de TVA.'); }
      else {
        /* C310 (V16-047) : sans TVA connue, le CA hors taxes est estimé à 10 % (dit à l'écran), puis recalculé dès que le patron
           indique sa TVA à l'étape 3 ; une frappe du patron dans le champ le garde tel quel. */
        var cae = put('rc-ca', String(Math.round(ttc / 1.1 * 100) / 100).replace('.', ','), true);
        if (cae) { cae.setAttribute('data-df58-ttc', String(Math.round(ttc * 100) / 100)); aide('rc-ca', 'Repris de votre caisse : ' + eur(ttc) + ' TTC sur ' + L.length + ' journées, converti avec une TVA estimée à 10 % : il sera recalculé avec votre TVA à l’étape suivante.');
          if (cae.addEventListener) cae.addEventListener('input', function (ev) { if (ev.isTrusted) cae.removeAttribute('data-df58-ttc'); });
          var tv = doc.getElementById('rc-tva'); if (tv && tv.addEventListener) tv.addEventListener('input', function () { var t = nb(tv.value), tt = nb(cae.getAttribute('data-df58-ttc')); if (tt != null && t != null && t >= 0 && t <= 30) { cae.value = String(Math.round(tt / (1 + t / 100) * 100) / 100).replace('.', ','); aide('rc-ca', 'Repris de votre caisse : ' + eur(tt) + ' TTC, converti avec votre TVA de ' + t.toLocaleString(tagL()) + ' %.'); try { cae.dispatchEvent(new Event('input', { bubbles: true })); } catch (x) {} } }); }
      }
    }
    /* jours d'ouverture : lus dans la caisse, sinon à renseigner (plus de « 6 » ni de « 12 » d'office) */
    var js = null; try { js = w.VerdictPassageUnique && w.VerdictPassageUnique.joursSemaine ? w.VerdictPassageUnique.joursSemaine() : null; } catch (e) {}
    var j = doc.getElementById('rc-jsem'); if (j && poserJoursCalendrier('rc-jsem', joursCalendrier(D))) j = null;/* C364 */ if (j && !(num(q.daysWeek) > 0)) { if (js && js.jours) { j.value = String(js.jours).replace('.', ','); aide('rc-jsem', 'Lus dans vos journées de caisse.'); } else if (j.value === '6') j.value = ''; }
    var mo = doc.getElementById('rc-mois'); if (mo && !(num(q.months) > 0) && mo.value === '12') mo.value = '';
    try { ouvertureCaisse(false); } catch (e) {}
  }
  function qrAmort() { var i = doc.getElementById('qr-amort'); return i ? nb(i.value) : null; }
  function lectureAmort() {
    var com = doc.getElementById('qr-com'); if (!com || doc.getElementById('qr-amort')) return;
    var lab = com.closest ? com.closest('label') : null; if (!lab || !lab.parentNode) return;
    var l = doc.createElement('label'); l.className = 'f';
    l.innerHTML = '<span>Amortissements (€ / an)</span><input id="qr-amort" inputmode="decimal" value=""><small>Dotations aux amortissements de votre compte de résultat. 0 si aucune ; vide : non comptées.</small>';
    lab.parentNode.insertBefore(l, lab.nextSibling);
    var i = doc.getElementById('qr-amort'); if (i) i.addEventListener('input', function () { try { w.qrApercu && w.qrApercu(); } catch (e) {} });
    try { var v = w.sessionStorage.getItem('df58-qr-amort'); if (v && i) i.value = v; i.addEventListener('input', function () { try { w.sessionStorage.setItem('df58-qr-amort', i.value); } catch (e) {} }); } catch (e) {}
  }
  /* Après « Compléter mon diagnostic » : les amortissements passent à l'étape 3 ; nourriture et boissons répartissent le total
     matière du document (et non une ancienne saisie qui ne fait pas ce total). */
  function apresLectureRapide(am) {
    var ra = doc.getElementById('rf-amort'); if (ra && am != null && !String(ra.value || '').trim()) ra.value = String(am).replace('.', ',');
    var mat = num(w.__qrMatTotal), en = doc.getElementById('rf-nour'), eb = doc.getElementById('rf-boi'); if (!(mat > 0) || !en || !eb) return;
    var n = nb(en.value), b = nb(eb.value); if (n == null && b == null) return; if (Math.abs(num(n) + num(b) - mat) < 0.5) return;
    if (n != null && b != null && n + b > 0) { var nv = Math.round(mat * n / (n + b) * 100) / 100; en.value = String(nv).replace('.', ','); eb.value = String(Math.round((mat - nv) * 100) / 100).replace('.', ','); eb.setAttribute('data-qr-auto', '1');
      var z = eb.parentNode && eb.parentNode.querySelector('small'), t = 'Répartition proposée d’après votre saisie précédente (' + eur(n) + ' / ' + eur(b) + ') pour faire vos ' + eur(mat) + ' d’achats : corrigez-la.'; if (z) z.textContent = t; else { var sm = doc.createElement('small'); sm.textContent = t; eb.parentNode.appendChild(sm); } }
    else { en.value = ''; eb.value = ''; }
    try { w.refApercu && w.refApercu(); } catch (e) {}
  }
  /* C310 (V16-005, décision 4, avec L2) : Plus › Chiffre d'affaires donnait un autre résultat du mois que l'Argent (septembre :
     5 919 € contre 6 332 € pour la Brasserie) : l'historique répartissait charges et équipe au douzième. Pour l'année affichée,
     chaque mois prend le résultat de l'Argent (window.VerdictArgent.resultatMois, 048) : équipe = un mois de paie (0 un mois
     fermé), loyer, charges et amortissements = part de saison, matière au taux de l'année ; la règle est écrite sous le bloc.
     Les valeurs enregistrées ne sont pas modifiées : elles sont remises dès l'écran dessiné. */
  function historiqueCommeArgent() {
    var D = w.DB, H = D && D.monthlyHistory, A = w.VerdictArgent, out = { regle: null, remettre: function () {} };
    if (!H || !H.length || !A || typeof A.resultatMois !== 'function') return out;
    var ans = H.map(function (x) { return String(x.period || '').slice(0, 4); }).filter(Boolean).sort(), an = String(w.VERDICT_HISTORY_YEAR || ans[ans.length - 1] || '');
    var sauve = [];
    H.forEach(function (x) { if (String(x.period || '').slice(0, 4) !== an) return; var r = null; try { r = A.resultatMois(x.period); } catch (e) { r = null; } if (!r || !r.ok || !(num(r.caHT) > 0)) return;
      sauve.push([x, { fixedCosts: x.fixedCosts, amortization: x.amortization, resultBeforeTax: x.resultBeforeTax, breakEvenHT: x.breakEvenHT, breakEvenRatio: x.breakEvenRatio }]);
      var fixes = num(r.equipe) + num(r.fixes), am = num(r.amortissements), taux = 1 - (num(r.matiere) + num(r.autres)) / num(r.caHT);
      x.fixedCosts = Math.round(fixes); x.amortization = Math.round(am); x.resultBeforeTax = Math.round(num(r.resultat));
      x.breakEvenHT = taux > 0 ? Math.round((fixes + am) / taux) : null; x.breakEvenRatio = x.breakEvenHT > 0 ? num(x.caHT) / x.breakEvenHT : null;
      if (r.regle) out.regle = r.regle; });
    out.remettre = function () { sauve.forEach(function (p) { Object.keys(p[1]).forEach(function (k) { p[0][k] = p[1][k]; }); }); };
    return out;
  }
  /* C325 (T1, mineurs) : Plus › Chiffre d'affaires écrivait « 01/26 » sous les barres et « 2026-01 » dans « Chaque mois face à
     son point mort » : un seul format, celui de la langue (mois écrit en lettres). À faire : « IMPACT CORRECTEMENT NOMMÉ » (jargon)
     devient « Ce qui est en jeu ». */
  function moisLangue(per, court) {
    var y = Number(String(per).slice(0, 4)), m = Number(String(per).slice(5, 7)); if (!(y > 0 && m >= 1 && m <= 12)) return String(per);
    try { return new Intl.DateTimeFormat(w.LOCALE_TAG || 'fr-FR', court ? { month: 'short', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 15))); }
    catch (e) { return court ? MOIS[m - 1].slice(0, 4) : MOIS[m - 1] + ' ' + y; }
  }
  function historiqueFormats(h) {
    if (typeof h !== 'string') return h;
    h = h.replace(/<b>(\d{4})-(\d{2})( · en cours)?<\/b>/g, function (x, y, mo, enc) { return '<b>' + esc(moisLangue(y + '-' + mo, false)) + (enc || '') + '</b>'; });
    var i = h.indexOf('CA HT par mois'), a = i >= 0 ? h.indexOf('<svg', i) : -1, b = a >= 0 ? h.indexOf('</svg>', a) : -1;
    if (a >= 0 && b > a) h = h.slice(0, a) + h.slice(a, b).replace(/>(0[1-9]|1[0-2])\/(\d{2})/g, function (x, mo, yy) { return '>' + esc(moisLangue('20' + yy + '-' + mo, true)); }) + h.slice(b);
    return h;
  }
  var IMPACT = ['Ce qui est en jeu', 'What is at stake', 'Lo que está en juego', 'Cosa è in gioco', 'Worum es geht', 'Wat er op het spel staat', 'O que está em jogo'];
  /* C325 (T4) : « Référence complète validée par le moteur » (Mes chiffres, CHR_COCKPIT_TEXT.engineReady de 029) : sans « moteur ». */
  var PRETE = ['Référence complète : calcul Verdict vérifié.', 'Complete reference: Verdict calculation checked.', 'Referencia completa: cálculo de Verdict comprobado.', 'Riferimento completo: calcolo Verdict verificato.', 'Vollständige Referenz: Verdict-Berechnung geprüft.', 'Volledige referentie: Verdict-berekening gecontroleerd.', 'Referência completa: cálculo Verdict verificado.'];
  function libelleImpact() { var T = w.POINT11_TEXT; if (T && T.impactNamed && T.impactNamed[0] !== IMPACT[0]) T.impactNamed = IMPACT.slice();
    var C = w.CHR_COCKPIT_TEXT; if (C && C.engineReady && C.engineReady[0] !== PRETE[0]) C.engineReady = PRETE.slice(); }
  function amortFiche() { var i = doc.getElementById('rf-amort'); return i ? nb(i.value) : null; }
  function envelopper() {
    var F = w.refFormulaire, A = w.refApercu, V = w.refValider, E = w.refEtape, RF = w.recentFormulaire, QL = w.refLectureRapide, QC = w.qrCalcul, QK = w.qrContinuer, HH = w.verdictHistoryHTML;
    if (typeof HH === 'function' && !HH.__df58) { var hh = function () { var rest = historiqueCommeArgent(), r; try { r = HH.apply(this, arguments); } finally { try { rest.remettre(); } catch (e) {} } return historiqueFormats(rest.regle && typeof r === 'string' ? r.replace(/(Chaque mois face à son point mort<\/h3><p class="note">[^<]*<\/p>)/, '$1<p class="note" data-df58-regle="1">' + esc(rest.regle) + '</p>') : r); }; hh.__df58 = true; w.verdictHistoryHTML = hh; }
    /* C310 (V16-022) : la lecture rapide « Six montants » n'avait pas d'amortissements (résultat 102 991 € au lieu de 93 991 €,
       seuil 480 995 € au lieu de 493 142 €). Ligne facultative ajoutée, comptée dans le résultat et le seuil, reprise à l'étape 3. */
    if (typeof QL === 'function' && !QL.__df58) { var ql = function () { var r = QL.apply(this, arguments); try { lectureAmort(); } catch (e) {} return r; }; ql.__df58 = true; w.refLectureRapide = ql; }
    if (typeof QC === 'function' && !QC.__df58) { var qc = function (r) { var x = QC.apply(this, arguments), am = qrAmort(); try { if (x && am > 0 && r) { var cv = num(r.mat) + num(r.com), fixes = num(r.ms) + num(r.loy) + num(r.cf), taux = r.ca > 0 ? cv / r.ca : 1; x.res = x.res - am; x.marge = r.ca > 0 ? x.res / r.ca * 100 : x.marge; x.seuil = (taux >= 0 && taux < 1) ? (fixes + am) / (1 - taux) : null; } } catch (e) {} return x; }; qc.__df58 = true; w.qrCalcul = qc; }
    if (typeof QK === 'function' && !QK.__df58) { var qk = function () { var am = qrAmort(), r = QK.apply(this, arguments); setTimeout(function () { try { apresLectureRapide(am); } catch (e) {} }, 40); return r; }; qk.__df58 = true; w.qrContinuer = qk; }
    try { libelleImpact(); } catch (e) {}
    var RE = w.recentEtape, RA = w.recentApply;
    if (typeof RE === 'function' && !RE.__df58) { var re = function () { try { ouvertureCaisse(); } catch (e) {} return RE.apply(this, arguments); }; re.__df58 = true; w.recentEtape = re; }
    if (typeof RA === 'function' && !RA.__df58) { var ra = function () { try { ouvertureCaisse(); } catch (e) {} return RA.apply(this, arguments); }; ra.__df58 = true; w.recentApply = ra; }
    if (typeof RF === 'function' && !RF.__df58) { var rf = function () { var r = RF.apply(this, arguments); try { ficheRecente(); } catch (e) {} return r; }; rf.__df58 = true; w.recentFormulaire = rf; }
    if (typeof F === 'function' && !F.__df58) { var f = function () { var r = F.apply(this, arguments); try { ficheBilan(); } catch (e) {} return r; }; f.__df58 = true; w.refFormulaire = f; }
    if (typeof E === 'function' && !E.__df58) { var g = function () { try { ficheBilan(); } catch (e) {} return E.apply(this, arguments); }; g.__df58 = true; w.refEtape = g; }
    if (typeof A === 'function' && !A.__df58) {
      var a = function () { var r = A.apply(this, arguments); try {
        var am = amortFiche(), box = doc.getElementById('rf-apercu'), L = w.refLire && w.refLire();
        if (box && am > 0 && L && !L.err) { var n = function (x) { return x == null ? 0 : x; }, qt = (L.nour == null && L.boi == null && w.__qrMatTotal > 0) ? w.__qrMatTotal : 0;
          var res = L.ca - (n(L.nour) + n(L.boi) + qt + n(L.emb) + n(L.com)) - (n(L.ms) + n(L.loy) + n(L.cf)) - am, mn = L.ca > 0 ? res / L.ca * 100 : 0;
          box.innerHTML = box.innerHTML.replace(/(R(?:é|é)sultat avant imp(?:ô|ô)t : <b style="color:)[^"]*(">)[^<]*(<\/b> · marge avant imp(?:ô|ô)t )[^&]*(&nbsp;%)/, function (m, p1, p2, p3, p4) { return p1 + (res >= 0 ? '#22c55e' : '#ef4444') + p2 + eur(res) + p3 + mn.toLocaleString(tagL(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + p4; })
            + '<br>Amortissements <b>' + eur(am) + '/an</b> (comptés dans le résultat, jamais dans vos minimums de trésorerie)'; }
        /* C310 (V16-022) : « Commandes par jour 74,7 (couverts ÷ jours ouverts) » alors que Verdict retient 74,4 (tickets ÷ 313
           journées de caisse) : quand les couverts sont ceux de la caisse, l'aperçu montre la valeur retenue. */
        var Cf = caisseFiche(), cvf = L && !L.err ? num(L.cv) : 0;
        if (box && Cf && Cf.tickets > 0 && cvf > 0 && Math.abs(cvf - Cf.tickets) <= Cf.tickets * 0.01) box.innerHTML = box.innerHTML.replace(/Commandes par jour <b>[^<]*<\/b> \([^)]*\)/, 'Commandes par jour <b>' + (Math.round(Cf.cmdj * 10) / 10).toLocaleString(tagL()) + '</b> (tickets de votre caisse ÷ ' + nbr(Cf.jours) + ' journées)');
      } catch (e) {} return r; };
      a.__df58 = true; w.refApercu = a;
    }
    if (typeof V === 'function' && !V.__df58) {
      var v = function () { var am = amortFiche(), D = w.DB; if (D && D.in && am != null && am >= 0) D.in.amort = Math.round(am * 100) / 100;
        var r = V.apply(this, arguments);
        try { if (D && D.refSource && /closed-income-statement/.test(String(D.refSource.nature || '')) && am != null) { D.refSource.amortization = D.in.amort; enregistrer(false); } } catch (e) {}
        /* C310 (V16-022/023) : couverts du bilan = tickets de la caisse : une seule définition (tickets ÷ journées réelles), sans
           question sur un écart de définition (74,705 = couverts ÷ jours théoriques ; panier calculé avec une TVA tapée). */
        try { var Cb = D && D.refSource && /closed-income-statement/.test(String(D.refSource.nature || '')) ? caisse(D, String(D.refSource.exerciseYear)) : null, cvb = D && D.refSource ? num(D.refSource.cv) : 0;
          if (Cb && Cb.tickets > 0 && cvb > 0 && Math.abs(cvb - Cb.tickets) <= Cb.tickets * 0.01) { D.in.cmdj = Math.round(Cb.cmdj * 10) / 10; D.in.panier = Math.round(Cb.panier * 100) / 100; enregistrer(true); } } catch (e) {}
        return r; };
      v.__df58 = true; w.refValider = v;
    }
  }
  /* C300 (V15-055) : un champ prérempli par Verdict (boissons déduites du total, tickets de la caisse…) : la frappe s'y ajoutait
     (« 2 244 522 445 € » de boissons). À l'entrée dans un champ que le patron n'a pas encore tapé, son contenu est sélectionné :
     la frappe le remplace. */
  var TAPE = typeof WeakSet === 'function' ? new WeakSet() : null;
  doc.addEventListener('input', function (ev) { var t = ev.target; if (TAPE && t && ev.isTrusted && t.tagName === 'INPUT') TAPE.add(t); }, true);
  doc.addEventListener('focusin', function (ev) {
    var t = ev.target; if (!TAPE || !t || t.tagName !== 'INPUT' || t.getAttribute('inputmode') !== 'decimal' || !t.value || TAPE.has(t)) return;
    if (!(t.closest && t.closest('#refP,#welcome,.sheet,.modal'))) return;
    setTimeout(function () { try { if (doc.activeElement === t && !TAPE.has(t)) t.select(); } catch (e) {} }, 0);
    /* C310 (V16-044) : entré à la souris, le relâchement du clic défaisait la sélection : la frappe s'ajoutait à la valeur. */
    var up = function (e) { doc.removeEventListener('mouseup', up, true); try { if (doc.activeElement === t && !TAPE.has(t)) { e.preventDefault(); t.select(); } } catch (x) {} };
    doc.addEventListener('mouseup', up, true);
  }, true);

  /* ——— C300 (V15-021) : la caisse retenue face à la saisie reste la référence après rechargement ———
     Le 23/10, la caisse (2 500 €) avait remplacé la saisie (2 300 €) ; après un simple rechargement, la journée revenait à
     2 300 €, « saisie à la main », avec la date d'import de la caisse : l'ancienne saisie était réécrite par-dessus. Deux gestes :
     1. à l'import, la caisse efface ce qui gardait l'ancienne saisie (brouillon de l'Accueil, services saisis, fermeture déclarée) ;
     2. une réécriture de la valeur que la caisse a remplacée, sans geste du patron (pas de clic ni de frappe), est refusée. */
  /* Le registre de la journée de l'Accueil (052 : DB.chrDays et sa copie « verdict-day-ledger-r305 » dans le navigateur) garde
     chaque journée « clôturée » et la réécrit dans l'historique à chaque chargement (dayHydrate) : c'est lui qui remettait
     2 300 € par-dessus la caisse. Une journée que la caisse remplace, ou un montant refusé, en est retiré. */
  function oublierRegistre(D, k) {
    try { if (D.chrDays && D.chrDays[k]) delete D.chrDays[k]; } catch (e) {}
    try { if (D._demo || w.VERDICT_DEMO_SESSION || w.VERDICT_PRESENTATION_PROFILE || w.DB !== D) return; var id = String(w.verdictCurrentStoreId && w.verdictCurrentStoreId() || ''); if (!id) return;
      var key = 'verdict-day-ledger-r305:real:' + String(w.SKEY || '') + ':' + id, raw = w.localStorage.getItem(key), o = raw ? JSON.parse(raw) : null;
      if (o && o.days && o.days[k]) { delete o.days[k]; w.localStorage.setItem(key, JSON.stringify(o)); } } catch (e) {}
  }
  function corrigeesParCaisse(D) { var o = {}; (D.dailyCorrections || []).forEach(function (c) { if (c && c.via === 'import-caisse' && c.date) o[c.date] = c; }); return o; }
  function nettoyerApresCaisse(D) {
    var C = corrigeesParCaisse(D), ch = false;
    Object.keys(C).forEach(function (k) {
      var c = C[k]; if (c.nettoye) return;
      var row = (D.histJour || []).filter(function (r) { return r && r.date === k; })[0];
      if (row && /pos|csv|caisse|import/i.test(String(row.source || ''))) {
        if (D.verdictLiveDays && D.verdictLiveDays[k]) delete D.verdictLiveDays[k];
        if (D.servicesJour && D.servicesJour[k]) delete D.servicesJour[k];
        var dv = D.dailyValidation && D.dailyValidation.days && D.dailyValidation.days[k]; if (dv) { dv.caJ = num(row.caJ); dv.tkJ = row.tkJ == null ? null : num(row.tkJ); dv.source = 'pos-csv'; }
        oublierRegistre(D, k);
      }
      c.nettoye = true; ch = true;
    });
    if (ch) enregistrer(false);
  }
  function gesteDuPatron() { try { var u = w.navigator && w.navigator.userActivation; return !u || u.isActive; } catch (e) { return true; } }
  function refusee(D, cle, caJ) {
    if (!D || !cle || gesteDuPatron()) return false;
    var c = corrigeesParCaisse(D)[cle], row = (D.histJour || []).filter(function (r) { return r && r.date === cle; })[0];
    if (!(row && /pos|csv|caisse|import/i.test(String(row.source || '')) && Math.abs(num(row.caJ) - num(caJ)) >= 0.005)) return false;
    /* la valeur réécrite est celle du registre de l'Accueil (rejoué au chargement) ou l'ancienne saisie remplacée par la caisse */
    var reg = false; try { var L = D.chrDays && D.chrDays[cle], api = w.VerdictDayLedger; reg = !!(L && api && api.summary && Math.abs(num(api.summary(L).total) - num(caJ)) < 0.005); } catch (e) {}
    return reg || !!(c && c.avant && Math.abs(num(c.avant.caJ) - num(caJ)) < 0.005);
  }
  /* ——— C300 (V15-055) : contrôle de vraisemblance d'une journée saisie ———
     « 940 940 € » pour un café dont la journée habituelle est de 975 € (965 fois plus) était enregistré sans un mot
     (« 106 320,9 % · Atteint »). Toute journée écrite passe par enregistrerJourCalcule (Accueil, Mes chiffres, services) :
     au-delà de 20 fois la journée habituelle (médiane des 90 derniers jours saisis ou lus, sinon le CA de l'année ÷ jours
     ouverts), ou au-delà de 500 000 € sans repère, Verdict demande avant d'enregistrer. Rien n'est écrit sans réponse. */
  var VRAI = { facteur: 20, plafond: 500000, ok: {} };
  function journeeHabituelle(D, cle) {
    var L = (D.histJour || []).filter(function (r) { return r && r.date && r.date !== cle && r.date >= decaleJ(cle, -90) && r.date <= cle && num(r.caJ) > 0; }).map(function (r) { return num(r.caJ); }).sort(function (a, b) { return a - b; });
    if (L.length >= 3) return L[Math.floor(L.length / 2)];
    try { var R = w.moteur && w.moteur(), d = R && R.d; if (d && d.ca > 0) { var t = num(D.in && D.in.tva) || 10, j = num(d.jSem) * 4.33 * (num(d.mois) || 12); if (j > 0) return d.ca * (1 + t / 100) / j; } } catch (e) {}
    return null;
  }
  function decaleJ(k, n) { var d = new Date(String(k).slice(0, 10) + 'T12:00:00Z'); if (isNaN(d)) return ''; d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function invraisemblable(D, cle, caJ) {
    var v = num(caJ); if (!D || !cle || !(v > 0) || VRAI.ok[cle + ':' + v]) return null;
    var h = journeeHabituelle(D, cle);
    if (h > 0 ? v > h * VRAI.facteur : v > VRAI.plafond) return { cle: cle, v: v, h: h, D: D };
    return null;
  }
  function questionMontant(Q, rejouer) {
    var jour = ''; try { jour = new Date(Q.cle + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) {}
    var fois = Q.h > 0 ? Math.round(Q.v / Q.h) : null;
    ouvrir('<h2>Ce montant est-il juste ?</h2><p>Vous avez saisi <b>' + eur(Q.v) + '</b> pour ' + esc(jour || Q.cle) + '.' + (fois ? ' C’est <b>' + fois.toLocaleString(tagL()) + ' fois</b> votre journée habituelle (' + eur(Q.h) + ').' : ' C’est un montant très élevé pour une journée.') + '</p><p>Une virgule oubliée ou un zéro de trop ? Rien n’est enregistré tant que vous n’avez pas répondu.</p>' +
      '<div class="df58-b"><button type="button" class="btn" data-df58-v="corriger">Corriger le montant</button><button type="button" class="btn ghost" data-df58-v="garder">Oui, enregistrer ' + eur(Q.v) + '</button></div>');
    ETAT.ouvert = { vraisemblance: Q, rejouer: rejouer };
  }
  doc.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('#df58-m [data-df58-v]') : null; if (!b) return;
    var O = ETAT.ouvert, a = b.getAttribute('data-df58-v'); fermer(); if (!O || !O.vraisemblance) return;
    if (O.vraisemblance.D && w.DB !== O.vraisemblance.D) return;/* l'établissement a changé entre-temps : rien n'est écrit ailleurs */
    if (a === 'garder') { VRAI.ok[O.vraisemblance.cle + ':' + O.vraisemblance.v] = true; try { O.rejouer(); } catch (e) {} enregistrer(true); try { w.toast && w.toast('Journée enregistrée : ' + eur(O.vraisemblance.v)); } catch (e) {} }
    else { try { if (w.DB) { oublierRegistre(w.DB, O.vraisemblance.cle); enregistrer(true); } } catch (e) {} try { w.toast && w.toast('Rien n’a été enregistré : corrigez le montant.'); } catch (e) {} }
  });
  function protegerJournees() {
    var E = w.enregistrerJourCalcule, R = w.verdictEnregistrerDate;
    if (typeof E === 'function' && !E.__df58) { var f = function (j, caJ) { var D = w.DB, cle = null, self = this, args = arguments; try { cle = typeof w.jourCle === 'function' ? w.jourCle(j) : null; } catch (e) {}
      if (refusee(D, cle, caJ)) { var row = D.histJour.filter(function (r) { return r && r.date === cle; })[0]; return { jour: j, date: cle, remplacee: false, refusee: 'caisse', total: D.pil && D.pil.ca, tickets: row && row.tkJ }; }
      var Q = invraisemblable(D, cle, caJ);
      if (Q) { questionMontant(Q, function () { E.apply(self, args); }); setTimeout(function () { try { w.toast && w.toast('Montant à confirmer : rien n’est encore enregistré.'); } catch (e) {} }, 0); return { jour: j, date: cle, remplacee: false, refusee: 'vraisemblance', total: D.pil && D.pil.ca, tickets: D.pil && D.pil.tickets }; }
      return E.apply(this, arguments); }; f.__df58 = true; w.enregistrerJourCalcule = f; }
    if (typeof R === 'function' && !R.__df58) { var g = function (cle, caJ) { var self = this, args = arguments; if (refusee(w.DB, cle, caJ)) return { date: cle, refusee: 'caisse' };
      var Q = invraisemblable(w.DB, cle, caJ); if (Q) { questionMontant(Q, function () { R.apply(self, args); }); return { date: cle, refusee: 'vraisemblance' }; }
      return R.apply(this, arguments); }; g.__df58 = true; w.verdictEnregistrerDate = g; }
  }

  function migrerEquipe(D) {
    var fi = D && D.fecImport, t = fi && fi.totals, I = D && D.in, m = num(I && I.mois); if (!t || !I || D.equipeMoisC300 || !(m >= 1 && m < 12)) return;
    var avant = (num(I.salb) + num(I.dirb)) * 12; D.equipeMoisC300 = true;
    if (Math.abs(avant - num(t.payroll)) <= Math.max(50, num(t.payroll) * 0.01)) {
      ['salb', 'dirb'].forEach(function (k) { if (!vide(I[k])) I[k] = Math.round(num(I[k]) * 12 / m * 100) / 100; if (D.docRef && D.docRef.in && !vide(D.docRef.in[k])) D.docRef.in[k] = Math.round(num(D.docRef.in[k]) * 12 / m * 100) / 100; });
    }
    enregistrer(true);
  }
  /* C310 (V16-033) : « Votre Indice, lui, ne dépend pas du type » est faux depuis le barème du format (C299) : le même dossier
     passe de 59 à 54 selon le type. L'aide du type d'établissement (029, TYPE_ETAB_AIDE) dit la règle. */
  var AIDE_TYPE = 'Choisit vos repères de comparaison (panier, équipe, matière) et les conseils qui en découlent. Votre Indice est jugé avec les repères de votre type.';
  function aideType() { try { if (typeof w.TYPE_ETAB_AIDE === 'string' && /ne d(é|\u00e9)pend pas du type/.test(w.TYPE_ETAB_AIDE)) w.TYPE_ETAB_AIDE = AIDE_TYPE; } catch (e) {}
    try { [].forEach.call(doc.querySelectorAll('#refP small, .sheet small, #v-in small'), function (x) { if (/Votre Indice, lui, ne d(é|\u00e9)pend pas du type\./.test(x.textContent || '')) x.textContent = AIDE_TYPE; }); } catch (e) {} }
  try { aideType(); } catch (e) {}
  /* C310 (V16-045) : sous « Bruts salariés » (18 300 €), l'aide de 029 écrivait « Depuis votre compte de résultat : 271 200 €/an ÷ 12 »
     (271 200 € comprennent le dirigeant, 51 600 €, inscrit dans son propre champ ; 271 200 ÷ 12 = 22 600). L'aide dit le vrai calcul. */
  function aideEquipe() {
    var D = w.DB, t = D && D.fecImport && D.fecImport.totals; if (!t || !(num(t.payroll) > 0)) return;
    var I = D.in || {}, m = moisEquipe(I), own = num(t.payrollOwner), sal = num(t.payroll) - own;
    var pose = function (id, an, mens, plus) { var el = doc.getElementById(id), lab = el && el.parentNode; if (!lab) return; var o = lab.querySelector('.src-champ');
      /* C326 (L2, langues) : une seule phrase, sans <b> qui la coupait en morceaux (montant réécrit à moitié en anglais). */
      var h = esc('Depuis votre document comptable : ' + eur(an) + '/an ÷ ' + m + ' = ' + eur(mens) + '/mois' + (plus || ''));
      /* au repos, rien n'est réécrit : le navigateur rend l'espace insécable en « &nbsp; », la comparaison se fait sur une signature */
      if (o && o.getAttribute && o.getAttribute('data-df58-sig') === h) return; if (!o) { o = doc.createElement('small'); o.className = 'src-champ'; lab.appendChild(o); } o.innerHTML = h; if (o.setAttribute) o.setAttribute('data-df58-sig', h); };
    if (vide(I.salb) || Math.abs(num(I.salb) * m - sal) > Math.max(50, sal * 0.01)) return;/* le patron a changé le champ : l'aide d'origine n'a plus cours */
    pose('i-salb', sal, sal / m, own > 0 ? ' (le dirigeant est dans son propre champ)' : '');
    if (own > 0 && !vide(I.dirb) && Math.abs(num(I.dirb) * m - own) <= Math.max(50, own * 0.01)) pose('i-dirb', own, own / m, '');
  }
  try { protegerJournees(); } catch (e) {}
  /* C387 (audit A17/A18) : au repos, derrière le verrou ou sur un autre écran, la boucle ne refait rien de lourd. */
  var dernier = { k: null, com: null };
  function utile() { try { if (doc.hidden || (w.VIEW !== undefined && w.VIEW !== 'in')) return false; if (doc.body && doc.body.classList && doc.body.classList.contains('verdict-entry-locked')) return false; } catch (e) { return false; } return true; }
  function boucle() { try { var ro = doc.getElementById('rc-open'); if (ro && !ro.getAttribute('data-df58-recent')) ficheRecente(); } catch (e) {}/* C325 : la fiche est préremplie par n'importe quel chemin d'entrée */ try { etiquette(); } catch (e) {} try { aideType(); } catch (e) {} try { envelopper(); } catch (e) {}
    if (utile()) { var com = doc.getElementById('i-com'), liv = doc.getElementById('df58-liv'), k = [typeof w.VERDICT_DB_REV !== 'undefined' ? w.VERDICT_DB_REV : '', w.STORE && w.STORE.actif, w.LOCALE, w.DB && w.DB._demo ? 1 : 0].join('|');
      if (!(k === dernier.k && com === dernier.com && liv && liv.isConnected && typeof w.VERDICT_DB_REV !== 'undefined')) { dernier = { k: k, com: com };
        try { livMonter(); } catch (e) {}/* C341 */ try { aideEquipe(); } catch (e) {} } } try { protegerJournees(); if (w.DB) nettoyerApresCaisse(w.DB); } catch (e) {} try { css(); tour(); } catch (e) {} }
  /* C387 (chef, A17/A18) : plus de minuterie d'une seconde. La boucle passe après un enregistrement, un changement d'écran,
     d'établissement ou de langue, un signal d'import ou du verrou, un choix ou un clic, ou un nouveau dessin d'écran. Rien au repos. */
  var plan = 0;
  function planifier(ms) { if (plan) return; try { plan = setTimeout(function () { plan = 0; boucle(); }, ms == null ? 60 : ms); } catch (e) { plan = 0; } }
  function accroche(nom) { try { var f = w[nom]; if (typeof f !== 'function' || f.__df58p) return; var g = function () { var r = f.apply(this, arguments); planifier(); return r; };
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) g[k] = f[k]; g.__df58p = true; w[nom] = g; } catch (e) {} }/* les marques des autres enveloppes (__sg13, _a15…) sont recopiées : personne ne s'enveloppe deux fois */
  function accrocher() { ['save', 'go', 'switchEtab', 'setLocale'].forEach(accroche); }
  ['verdict:caisse-importee', 'verdict:fec-applied', 'verdict:jours-ouverts', 'verdict:locale-changed', 'verdict:verrou-ouvert', 'verdict:porte-ouverte', 'verdict:entry-selected', 'verdict:intro-complete'].forEach(function (n) { try { w.addEventListener(n, function () { planifier(); }); } catch (e) {} });
  try { doc.addEventListener('visibilitychange', function () { if (!doc.hidden) planifier(); }); doc.addEventListener('change', function () { planifier(); }, true); doc.addEventListener('click', function () { planifier(150); }, true); } catch (e) {}
  var obs = null; function observer() { try { if (!obs && w.MutationObserver) obs = new w.MutationObserver(function () { planifier(120); }); if (!obs) return; ['v-in', 'v-pil', 'refP'].forEach(function (id) { var n = doc.getElementById(id); if (n && !n.__df58o) { n.__df58o = true; obs.observe(n, { childList: true }); } }); } catch (e) {} }
  [0, 300, 1000, 2500, 5000].forEach(function (ms) { try { setTimeout(function () { accrocher(); observer(); boucle(); }, ms); } catch (e) {} });
  w.VerdictDocumentsFoi = { joursCalendrier: joursCalendrier, embFiches: embFiches, livCout: livCout, dejaDansComptes: dejaDansComptes, tauxLivraison: tauxLivraison, livDocs: livDocs, ecartLivraison: ecartLivraison, pctLu: pctLu, tvaEstimee: tvaEstimee, panierCalcule: panierCalcule, ecartPanierCalcule: ecartPanierCalcule, ouvertureCaisse: ouvertureCaisse, comparaisonFEC: comparaisonFEC, valeurs: valeurs, valeursFEC: valeursFEC, ecarts: ecarts, differences: differences, prendreTout: prendreTout, garderTout: garderTout, noterChangements: noterChangements, caisse: caisse, majVerrou: majVerrou, incertitudeSansDocument: incertitudeSansDocument, differe: differe, tour: boucle };
})();
