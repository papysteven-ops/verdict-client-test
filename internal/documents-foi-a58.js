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
  function eur(x) { return x == null || !isFinite(x) ? '—' : Math.round(x).toLocaleString('fr-FR') + ' €'; }
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
  function comparaisonFEC(totals) {
    var D = w.DB, s = D && aDesDonnees(D) ? valeurs(D) : null, dv = valeursFEC(totals || {}), cc = !!(D && D.refSource && D.refSource.caSource === 'caisse');
    var n = s ? POSTES.filter(function (p) { return differe(s[p.k], dv[p.k]); }).length : 0;
    return '<div class="df58-cmp"><h3>Ce que dit votre document comptable</h3>' + tableau(s, dv, cc) +
      '<p>' + (s ? (n ? '<b>' + n + ' poste' + (n > 1 ? 's diffèrent' : ' diffère') + ' de votre saisie.</b> ' : 'Votre saisie concorde avec votre document. ') : '') +
      'En confirmant, Verdict retient votre document : c’est lui qui fait foi.' + (s ? ' Votre saisie est conservée à part ; vous pourrez y revenir, mais votre note ne sera alors plus un calcul final.' : '') + '</p></div>';
  }

  /* ——— Mémoire : saisie avant document, document de référence ——— */
  var avantFec = null;
  doc.addEventListener('change', function (ev) { if (ev.target && ev.target.id === 'v44-fec-input' && w.DB) avantFec = { in: copie(w.DB.in), ref: copie(w.DB.ref), refSource: copie(w.DB.refSource), provenance: copie(w.DB.dataProvenance), avait: aDesDonnees(w.DB) }; }, true);
  w.addEventListener('verdict:fec-applied', function () {
    var D = w.DB; if (!D) return;
    var t = (D.fecImport && D.fecImport.totals) || {};
    D.docRef = { source: 'fec', at: new Date().toISOString(), year: D.refSource && D.refSource.exerciseYear, in: copie(D.in), ca: caDeclare(D), valeurs: valeurs(D) };
    D.docAccords = {}; D.docChangements = {}; delete D.docChoix; if (D.docVerrou) delete D.docVerrou;
    if (avantFec && avantFec.avait) {
      D.saisieAvantDocument = { at: new Date().toISOString(), in: avantFec.in, ref: avantFec.ref, refSource: avantFec.refSource, provenance: avantFec.provenance };
      /* Le FEC ne contient ni panier ni couverts : on garde ceux de la saisie (la caisse les vérifiera). */
      if (avantFec.in) { if (!vide(avantFec.in.panier) && vide(D.in.panier)) D.in.panier = avantFec.in.panier; if (!vide(avantFec.in.cmdj) && vide(D.in.cmdj)) D.in.cmdj = avantFec.in.cmdj; D.docRef.in.panier = D.in.panier; D.docRef.in.cmdj = D.in.cmdj; }
      ETAT.bilan = { saisie: valeurs({ in: avantFec.in, ref: avantFec.ref, refSource: avantFec.refSource }), doc: D.docRef.valeurs, caCaisse: !!(avantFec.refSource && avantFec.refSource.caSource === 'caisse'), tva: avantFec.in && !vide(avantFec.in.tva) && !vide(D.in.tva) && Math.abs(num(avantFec.in.tva) - num(D.in.tva)) > 0.05 ? { saisie: num(avantFec.in.tva), doc: num(D.in.tva) } : null };
    }
    avantFec = null; enregistrer(); setTimeout(tour, 600);
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
      if (!D.docRef && !bilanRecopie(D) && ca != null && differe(ca, C.ht) && !(acc.caCaisse != null && !differe(acc.caCaisse, ca))) out.push({ k: 'caCaisse', lib: 'Chiffre d’affaires HT ' + an, saisie: ca, doc: C.ht, source: 'votre caisse (' + C.jours + ' journées)' });
      if (C.panier && !vide(D.in.panier) && Math.abs(num(D.in.panier) - C.panier) > C.panier * 0.05 && !tranche(D, 'panier', num(D.in.panier))) out.push({ k: 'panier', lib: 'Panier moyen TTC', saisie: num(D.in.panier), doc: C.panier, source: 'votre caisse', cents: true });
      /* C280 (T4 vague 10) : les commandes par jour lues dans la caisse font foi aussi, dans la même question globale (90 saisies contre 74,4 lues ne déclenchaient rien). */
      if (C.cmdj && !vide(D.in.cmdj) && Math.abs(num(D.in.cmdj) - C.cmdj) > C.cmdj * 0.05 && !tranche(D, 'cmdj', num(D.in.cmdj))) out.push({ k: 'cmdj', lib: 'Commandes par jour', saisie: num(D.in.cmdj), doc: Math.round(C.cmdj * 10) / 10, source: 'votre caisse (' + C.jours + ' journées)', nombre: true });
    }
    return out;
  }

  /* ——— Un seul choix pour l'ensemble des documents ———
     C190 bis (Steven, 21/10 : « pas chaque point : c'est tout le relevé comptable, soit il dit oui, soit non ; après, on ne lui
     redemande pas chaque point, c'est long et pénible ; soit il prend tout le relevé, soit il laisse sa saisie »).
     Une seule question, tous les écarts dans un tableau, deux boutons, la conséquence écrite, pas de seconde confirmation.
     La question ne revient que pour un nouveau document ou un chiffre que le patron modifie lui-même ensuite. */
  function appliquerDocument(D, e) {
    var R = D.docRef && D.docRef.in;
    if (e.k === 'caCaisse') { D.refSource = D.refSource || {}; D.refSource.ca = Math.round(e.doc * 100) / 100; if (D.ref) D.ref.ca = D.refSource.ca; D.refSource.caSource = 'caisse'; }
    else if (e.k === 'panier') { D.in.panier = Math.round(e.doc * 100) / 100; }
    else if (e.k === 'cmdj') { D.in.cmdj = Math.round(e.doc * 10) / 10; }/* C280 */
    else if (e.k === 'tva') { D.in.tva = e.doc; D.reg = D.reg || {}; D.reg.tvac = e.doc; }/* C300 (V15-018) */
    else if (e.k === 'ca') { D.refSource.ca = D.docRef.ca; if (D.ref) D.ref.ca = D.docRef.ca; }
    else if (R) {
      var champs = { nour: ['nour'], boi: ['boi'], emb: ['emb'], com: ['com'], amort: ['amort'], equipe: ['salb', 'salt', 'dirb', 'dirt', 'dirn', 'saln'], loyer: ['f1'], autres: ['f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10'] }[e.k] || [];
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
  var ETAT = { ouvert: null, bilan: null };
  function fermer() { var m = doc.getElementById('df58-m'); if (m) m.remove(); ETAT.ouvert = null; }
  function montant(e, x) { if (e.pct) return x.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' %'; if (e.nombre) return x.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' / jour'; return e.cents ? x.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : eur(x); }
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
    var caSeul = E.every(function (e) { return e.k === 'ca' || e.k === 'caCaisse'; });
    return h + '</tbody></table>' + SUITE + choixHTML(an, caSeul, 'tout-doc', 'tout-change', 'tout-saisie', 'Prendre tous mes documents (conseillé)');
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
  function saisieEnCours() { var a = doc.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !(a.closest && a.closest('#df58-m'))); }
  function tour() {
    var D = w.DB; if (!D || !D.in) return;
    /* C300 (V15-085) : deux onglets ouverts — l'onglet caché, resté sur une version ancienne du dossier, écrivait à chaque tour
       (remplissage, verrou de la note) et provoquait « le dossier a changé dans un autre onglet » : seul l'onglet visible agit. */
    if (doc.hidden === true) return;
    try { migrerEquipe(D); } catch (e) {}
    /* démonstration : la note est déjà une simulation, rien à vérifier ni à afficher */
    if (D._demo || (D.dataProvenance && D.dataProvenance.nature === 'model_estimate')) { var bd = doc.getElementById('df58-ban'); if (bd) bd.remove(); return; }
    /* l'état de la note change (finale ↔ non finale) : on enregistre et on redessine l'écran tout de suite */
    if (majVerrou(D)) enregistrer(true);
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
        if (!vide(D.in.panier) && Math.abs(num(D.in.panier) - pc) >= 0.005 && Math.abs(num(D.in.panier) - C.panier) <= C.panier * 0.05 && !tranche(D, 'panier', num(D.in.panier))) { D.in.panier = pc; rempli = true; }
        if (cc != null && !vide(D.in.cmdj) && Math.abs(num(D.in.cmdj) - cc) >= 0.05 && Math.abs(num(D.in.cmdj) - C.cmdj) <= C.cmdj * 0.05 && !tranche(D, 'cmdj', num(D.in.cmdj))) { D.in.cmdj = cc; rempli = true; }
        D.docAligne = cle;
      }
      if (rempli) { if (D.docRef && D.docRef.in) { D.docRef.in.panier = D.in.panier; D.docRef.in.cmdj = D.in.cmdj; } enregistrer(true); }
    }
    if (doc.getElementById('df58-m') || saisieEnCours()) return;
    if (ETAT.bilan) { var X = autresEcarts(ETAT.bilan); ETAT.ouvert = { bilan: ETAT.bilan, extra: X }; ouvrir(bilanHTML(ETAT.bilan, X)); ETAT.bilan = null; return; }
    var E = ecarts(D); if (E.length) { ETAT.ouvert = { liste: differences(D) }; ouvrir(questionHTML(ETAT.ouvert.liste)); }
  }
  doc.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('#df58-m [data-df58],#df58-ban [data-df58]') : null; if (!b) return;
    var a = b.getAttribute('data-df58'), O = ETAT.ouvert, D = w.DB;
    if (a === 'ok') { (O && O.extra || []).forEach(function (e) { if (!e.deja) appliquerDocument(D, e); }); if (D.docRef && D.docRef.in) { D.docRef.in.panier = D.in.panier; D.docRef.in.cmdj = D.in.cmdj; }
      D.docChoix = { cle: cleDocuments(D), choix: 'documents' }; enregistrer(!!(O && O.extra && O.extra.length)); fermer(); return; }
    if (a === 'saisie') { /* juste après le FEC : revenir à toute la saisie d'avant, en un clic */
      var S = D.saisieAvantDocument; if (S) { D.docAccords = {}; var sv = valeurs({ in: S.in, ref: S.ref, refSource: S.refSource }); POSTES.forEach(function (p) { if (differe(sv[p.k], docValeurs(D)[p.k])) D.docAccords[p.k] = sv[p.k]; });
        (O && O.extra || []).forEach(function (e) { D.docAccords[e.k] = e.saisie; });/* C300 : TVA, panier et commandes gardés aussi */ D.in = S.in; if (S.refSource && S.refSource.ca != null) { D.refSource.ca = S.refSource.ca; if (D.ref) D.ref.ca = S.refSource.ca; } D.docChoix = { cle: cleDocuments(D), choix: 'saisie' }; majVerrou(D); enregistrer(true); }
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
    var ART = { tva: 'la TVA moyenne', ca: 'le chiffre d’affaires', nour: 'les achats de nourriture', boi: 'les achats de boissons', equipe: 'l’équipe', loyer: 'le loyer', autres: 'les autres charges fixes', amort: 'les amortissements', cmdj: 'les commandes par jour', panier: 'le panier moyen' };
    var nommer = function (L) { L = L.map(function (p) { return ART[p.k] || p.lib.charAt(0).toLowerCase() + p.lib.slice(1); }); return L.length > 1 ? L.slice(0, -1).join(', ') + ' et ' + L[L.length - 1] : L.join(''); };
    var gardes = POSTES.concat([{ k: 'cmdj', lib: 'Commandes par jour' }, { k: 'panier', lib: 'Panier moyen TTC' }, { k: 'tva', lib: 'TVA moyenne' }]).filter(function (p) { return acc.indexOf(p.k) >= 0; }), restent = POSTES.filter(function (p) { return acc.indexOf(p.k) < 0; });
    if (D.docRef) t.push(!gardes.length ? '✓ Document comptable ' + (D.docRef.year || '') + ' : il fait foi pour vos ventes, achats, équipe et charges.' : restent.length ? '✓ Document comptable ' + (D.docRef.year || '') + ' : il fait foi pour ' + nommer(restent) + '.' : 'Document comptable ' + (D.docRef.year || '') + ' : votre saisie a été retenue à sa place.');
    if (C) { var ca = caDeclare(D), e = ca ? (C.ht - ca) / ca : 0; /* C216 (W49) : « identique » seulement à l'euro près ; sinon l'écart est dit en euros (et en % au-delà de 1 %). */
      var gap = ca ? C.ht - ca : 0;
      t.push('✓ Caisse ' + an + ' : ' + C.jours + ' journées, ' + eur(C.ht) + ' HT' + (ca ? (Math.abs(gap) < 1 ? ', identique à votre chiffre d’affaires' : Math.abs(e) <= 0.01 ? ', à ' + eur(Math.abs(gap)) + ' près de votre chiffre d’affaires (' + (gap > 0 ? '+' : '−') + (Math.round(Math.abs(e) * 10000) / 100).toLocaleString('fr-FR') + ' %)' : ', ' + (e > 0 ? '+' : '−') + Math.abs(Math.round(e * 1000) / 10).toLocaleString('fr-FR') + ' % par rapport à votre chiffre d’affaires' + (D.docRef ? ' : vérifiez avec votre comptable (ventes hors caisse, avoirs)' : '')) : '') + '. Panier moyen ' + (C.panier ? C.panier.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0€' : '—') + (C.cmdj ? ', ' + (Math.round(C.cmdj * 10) / 10).toLocaleString('fr-FR') + ' commandes par jour' : '') + '.' +
        /* C300 (V15-017) : Mes chiffres dit aussi que la caisse fait foi pour le panier et les commandes. */
        (C.panier && acc.indexOf('panier') < 0 && acc.indexOf('cmdj') < 0 ? ' Elle fait foi pour le panier et les commandes par jour.' : '')); }
    if (acc.length) { k = 'ko'; var nd = noteDocuments(D), Rg = null, raison = ''; try { Rg = w.moteur && w.moteur(); } catch (e) {}
      /* C280 (T4 vague 10) : si la saisie gardée fait retirer l'Indice (garde-fou C190, ex. marge exceptionnellement élevée), on ne parle pas d'une « note non finale » qui n'est plus affichée. */
      try { raison = (w.anomaliesNonConfirmees ? w.anomaliesNonConfirmees() : []).map(function (a) { var l = String(a.lb || ''); l = l.replace(/^Marge avant imp(ô|\u00f4)t /, 'marge '); return l.charAt(0).toLowerCase() + l.slice(1) + ' à vérifier'; }).join(' ; '); } catch (e) {}
      var garde = gardes.length ? 'Vous gardez votre saisie pour ' + nommer(gardes) : 'Vous gardez votre saisie plutôt que vos documents';
      t.push(Rg && !Rg.ready ? garde + '. Avec votre saisie, Verdict n’affiche pas de note' + (raison ? ' (' + raison + ')' : '') + '.' + (nd != null ? ' Avec vos documents, votre note serait ' + nd + ' / 100.' : '') : garde + ' : votre note est une lecture non finale.' + (nd != null ? ' Avec vos documents, votre note serait ' + nd + ' / 100.' : '')); }
    var ch = D.docChangements || {}, chk = Object.keys(ch);
    if (chk.length) { var ndc = noteDocuments(D), anr = anneeDoc(D);
      t.push('Changements depuis ' + anr + ' pris en compte : ' + chk.map(function (x) { var c = ch[x], f = function (v) { if (c.pct) return v.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' %'; if (c.nombre) return v.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' / jour'; return c.cents ? v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0€' : eur(v); }; return c.lib.toLowerCase() + ' ' + f(c.doc) + ' → ' + f(c.saisie) + (c.raison || c.depuis ? ' (' + [c.raison, c.depuis ? 'depuis ' + moisLib(c.depuis) : null].filter(Boolean).join(', ') + ')' : ''); }).join(' ; ') + '.');
      t.push('Votre note en tient compte.' + (ndc != null ? ' D’après vos seuls documents ' + anr + ' : ' + ndc + ' / 100.' : '')); }
    if (!D.docRef && !C) { k = D.docVerrou ? 'ko' : 'info'; /* C216 (W56) : sur un profil vide, il n'y a ni note ni saisie : on ne le prétend pas. */
      var pret = false; try { var Rm = w.moteur && w.moteur(); pret = !!(Rm && Rm.ready); } catch (e) {}
      t.push(D.docVerrou ? 'Vous avez confirmé des chiffres inhabituels sans document : votre note reste une lecture non finale.' : pret ? 'Note calculée sur votre saisie.' : 'Aucun chiffre pour l’instant : pas encore de note.'); t.push('Déposez votre document comptable (FEC) et l’export de votre caisse : Verdict s’appuiera sur vos vrais chiffres.'); }
    var html = '<b>D’où viennent vos chiffres</b>' + t.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + (acc.length ? '<button type="button" class="btn" data-df58="tout-doc" style="margin-top:8px">Prendre mes documents</button>' : chk.length ? '<button type="button" class="btn ghost" data-df58="tout-doc" style="margin-top:8px">Annuler ces changements et revenir à mes documents</button>' : '');
    var el = doc.getElementById('df58-ban');
    if (!el) { el = doc.createElement('div'); el.id = 'df58-ban'; var h1 = vue.querySelector('h1'); if (h1 && h1.parentNode === vue) h1.insertAdjacentElement('afterend', el); else vue.insertBefore(el, vue.firstChild); }
    if (el.__html === html + k) return; el.__html = html + k; el.className = 'df58-ban df58-' + k; el.innerHTML = html;
  }

  var CSS = '#df58-m{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,6,23,.62)}' +
    '#df58-m .df58-p{max-width:560px;width:100%;max-height:90vh;overflow:auto;background:var(--card,#111827);color:var(--txt,#f8fafc);border:1px solid rgba(148,163,184,.3);border-radius:18px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.45)}' +
    'html:not(.vd-workspace-dark) #df58-m .df58-p{background:#fff;color:#0f172a}#df58-m h2{font-size:19px;margin:0 0 8px}#df58-m p{font-size:14.5px;line-height:1.5;margin:6px 0}' +
    '.df58-b{display:flex;flex-direction:column;gap:8px;margin-top:14px}.df58-r,#df58-m [data-df58-depuis]{font:inherit;font-size:13px;margin-top:4px;padding:4px 6px;border-radius:8px;border:1px solid rgba(148,163,184,.4);background:transparent;color:inherit}.df58-ch{font-size:14px;padding:8px 10px;border-radius:10px;background:rgba(96,165,250,.1)}.df58-t{width:100%;border-collapse:collapse;font-size:13.5px;margin:8px 0;font-variant-numeric:tabular-nums}.df58-t th,.df58-t td{padding:6px 4px;text-align:right;border-top:1px solid rgba(148,163,184,.22)}.df58-t th:first-child,.df58-t td:first-child{text-align:left}.df58-t th{font-size:12px;opacity:.75}.df58-res td{font-weight:700}.df58-ko{color:#ef4444;font-weight:700}.df58-ok{color:#22c55e}' +
    '.df58-cmp{margin:12px 0;padding:12px;border-radius:12px;border:1px solid rgba(148,163,184,.3)}.df58-cmp h3{font-size:15px;margin:0 0 4px}.df58-cmp p{font-size:13.5px;line-height:1.45;margin:6px 0 0}' +
    '.df58-ban{margin:10px 0 14px;padding:12px 14px;border-radius:14px;border-left:4px solid #22c55e;background:rgba(34,197,94,.08)}.df58-ban.df58-ko{border-left-color:#f97316;background:rgba(249,115,22,.1)}.df58-ban.df58-info{border-left-color:#60a5fa;background:rgba(96,165,250,.1)}.df58-ban b{font-size:13px;letter-spacing:.04em;text-transform:uppercase;opacity:.8}.df58-ban p{margin:4px 0 0;font-size:14px;line-height:1.45}';
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
    if (rj && !rj.getAttribute('data-df58-j') && !saisi) { rj.setAttribute('data-df58-j', '1'); var jl = null; try { jl = w.VerdictPassageUnique && w.VerdictPassageUnique.joursSemaine ? w.VerdictPassageUnique.joursSemaine() : null; } catch (e) {}
      if (jl && jl.jours) { rj.value = String(jl.jours); var sj = rj.parentNode && rj.parentNode.querySelector('small'); if (sj) sj.textContent = 'Lus dans vos journées de caisse.'; } else if (rj.value === '6') rj.value = '';
      if (rm && rm.value === '12') rm.value = ''; }
    var cv = doc.getElementById('rf-cv'), C = caisseFiche();
    if (cv && C && C.tickets > 0 && !String(cv.value || '').trim()) {
      cv.value = String(Math.round(C.tickets)); cv.setAttribute('data-df58-caisse', '1');
      var sm = cv.parentNode && cv.parentNode.querySelector('small'); if (sm) sm.textContent = 'Lu dans votre caisse : ' + Math.round(C.tickets).toLocaleString('fr-FR') + ' tickets sur ' + C.jours + ' journées.';
    }
  }
  /* C300 (V15-111) : « J'ai ouvert récemment » (029, recentFormulaire) ignorait la caisse déjà importée : date d'ouverture à
     aujourd'hui alors que la caisse commence le 2 mars, fin de période aujourd'hui (journée pas finie), CA et tickets à retaper,
     jours ouverts « 6 » d'office. Les champs encore à leur valeur de départ sont repris de la caisse ; rien n'est inventé : sans
     TVA connue, le CA de la caisse (TTC) est écrit sous le champ hors taxes au lieu d'être converti. */
  function ficheRecente() {
    var D = w.DB, p = doc.getElementById('refP'), o = doc.getElementById('rc-open'); if (!D || !p || !o || o.getAttribute('data-df58-recent')) return;
    o.setAttribute('data-df58-recent', '1');
    var auj = new Date(), iso = function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }, today = iso(auj), depuis = iso(new Date(auj.getTime() - 400 * 864e5));
    var L = (D.histJour || []).filter(function (r) { return r && r.date && !r.demo && /pos|csv|caisse|import/i.test(String(r.source || '')) && num(r.caJ) > 0 && String(r.date).slice(0, 10) >= depuis && String(r.date).slice(0, 10) < today; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var q = {}; try { q = (typeof w.recentStored === 'function' ? w.recentStored() : {}) || {}; } catch (e) {}
    var put = function (id, v, garder) { var e = doc.getElementById(id); if (!e || v == null || v === '') return null; if (garder && String(e.value || '').trim() !== '') return null; e.value = String(v); e.setAttribute('data-df58-caisse', '1'); try { e.dispatchEvent(new Event('input', { bubbles: true })); } catch (x) {} return e; };
    var aide = function (id, t) { var e = doc.getElementById(id), sm = e && e.parentNode && e.parentNode.querySelector('small'); if (!e) return; if (!sm) { sm = doc.createElement('small'); e.parentNode.appendChild(sm); } sm.textContent = t; };
    if (L.length >= 3) {
      var d0 = String(L[0].date).slice(0, 10), d1 = String(L[L.length - 1].date).slice(0, 10), ttc = 0, tk = 0, tkOk = true;
      L.forEach(function (r) { ttc += num(r.caJ); if (num(r.tkJ) > 0) tk += num(r.tkJ); else tkOk = false; });
      if (!q.opened && o.value === today) put('rc-open', d0);
      var st = doc.getElementById('rc-start'), en = doc.getElementById('rc-end');
      if (st && !q.start && (st.value === today || st.value === o.value || !st.value)) put('rc-start', d0);
      if (en && !q.end && (en.value === today || !en.value)) put('rc-end', d1);
      if (tkOk && tk > 0) put('rc-tickets', Math.round(tk), true);
      var tva = !vide(D.in && D.in.tva) ? num(D.in.tva) : null;
      if (tva != null) { put('rc-ca', Math.round(ttc / (1 + tva / 100) * 100) / 100, true); put('rc-tva', tva, true); aide('rc-ca', 'Repris de votre caisse : ' + eur(ttc) + ' TTC sur ' + L.length + ' journées, à ' + tva.toLocaleString('fr-FR') + ' % de TVA.'); }
      else aide('rc-ca', 'Votre caisse : ' + eur(ttc) + ' TTC sur ' + L.length + ' journées (du ' + d0.split('-').reverse().join('/') + ' au ' + d1.split('-').reverse().join('/') + '). Indiquez ici le montant hors taxes.');
    }
    /* jours d'ouverture : lus dans la caisse, sinon à renseigner (plus de « 6 » ni de « 12 » d'office) */
    var js = null; try { js = w.VerdictPassageUnique && w.VerdictPassageUnique.joursSemaine ? w.VerdictPassageUnique.joursSemaine() : null; } catch (e) {}
    var j = doc.getElementById('rc-jsem'); if (j && q.daysWeek == null) { if (js && js.jours) { j.value = String(js.jours); aide('rc-jsem', 'Lus dans vos journées de caisse.'); } else if (j.value === '6') j.value = ''; }
    var mo = doc.getElementById('rc-mois'); if (mo && q.months == null && mo.value === '12') mo.value = '';
  }
  function amortFiche() { var i = doc.getElementById('rf-amort'); return i ? nb(i.value) : null; }
  function envelopper() {
    var F = w.refFormulaire, A = w.refApercu, V = w.refValider, E = w.refEtape, RF = w.recentFormulaire;
    if (typeof RF === 'function' && !RF.__df58) { var rf = function () { var r = RF.apply(this, arguments); try { ficheRecente(); } catch (e) {} return r; }; rf.__df58 = true; w.recentFormulaire = rf; }
    if (typeof F === 'function' && !F.__df58) { var f = function () { var r = F.apply(this, arguments); try { ficheBilan(); } catch (e) {} return r; }; f.__df58 = true; w.refFormulaire = f; }
    if (typeof E === 'function' && !E.__df58) { var g = function () { try { ficheBilan(); } catch (e) {} return E.apply(this, arguments); }; g.__df58 = true; w.refEtape = g; }
    if (typeof A === 'function' && !A.__df58) {
      var a = function () { var r = A.apply(this, arguments); try {
        var am = amortFiche(), box = doc.getElementById('rf-apercu'), L = w.refLire && w.refLire();
        if (box && am > 0 && L && !L.err) { var n = function (x) { return x == null ? 0 : x; }, qt = (L.nour == null && L.boi == null && w.__qrMatTotal > 0) ? w.__qrMatTotal : 0;
          var res = L.ca - (n(L.nour) + n(L.boi) + qt + n(L.emb) + n(L.com)) - (n(L.ms) + n(L.loy) + n(L.cf)) - am, mn = L.ca > 0 ? res / L.ca * 100 : 0;
          box.innerHTML = box.innerHTML.replace(/(R(?:é|é)sultat avant imp(?:ô|ô)t : <b style="color:)[^"]*(">)[^<]*(<\/b> · marge avant imp(?:ô|ô)t )[^&]*(&nbsp;%)/, function (m, p1, p2, p3, p4) { return p1 + (res >= 0 ? '#22c55e' : '#ef4444') + p2 + eur(res) + p3 + mn.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + p4; })
            + '<br>Amortissements <b>' + eur(am) + '/an</b> (comptés dans le résultat, jamais dans vos minimums de trésorerie)'; }
      } catch (e) {} return r; };
      a.__df58 = true; w.refApercu = a;
    }
    if (typeof V === 'function' && !V.__df58) {
      var v = function () { var am = amortFiche(), D = w.DB; if (D && D.in && am != null && am >= 0) D.in.amort = Math.round(am * 100) / 100;
        var r = V.apply(this, arguments);
        try { if (D && D.refSource && /closed-income-statement/.test(String(D.refSource.nature || '')) && am != null) { D.refSource.amortization = D.in.amort; enregistrer(false); } } catch (e) {}
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
    ouvrir('<h2>Ce montant est-il juste ?</h2><p>Vous avez saisi <b>' + eur(Q.v) + '</b> pour ' + esc(jour || Q.cle) + '.' + (fois ? ' C’est <b>' + fois.toLocaleString('fr-FR') + ' fois</b> votre journée habituelle (' + eur(Q.h) + ').' : ' C’est un montant très élevé pour une journée.') + '</p><p>Une virgule oubliée ou un zéro de trop ? Rien n’est enregistré tant que vous n’avez pas répondu.</p>' +
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
  try { protegerJournees(); } catch (e) {}
  function boucle() { try { etiquette(); } catch (e) {} try { envelopper(); } catch (e) {} try { protegerJournees(); if (w.DB) nettoyerApresCaisse(w.DB); } catch (e) {} try { css(); tour(); } catch (e) {} }
  var it = setInterval(boucle, 1000); if (it && it.unref) it.unref();
  w.VerdictDocumentsFoi = { comparaisonFEC: comparaisonFEC, valeurs: valeurs, valeursFEC: valeursFEC, ecarts: ecarts, differences: differences, prendreTout: prendreTout, garderTout: garderTout, noterChangements: noterChangements, caisse: caisse, majVerrou: majVerrou, incertitudeSansDocument: incertitudeSansDocument, differe: differe, tour: boucle };
})();
