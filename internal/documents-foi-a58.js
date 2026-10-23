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
  function valeurs(D, I) {
    I = I || D.in || {}; var mois = num(I.mois) || 12, f = function (k) { return num(I[k]); }, autres = 0;
    for (var i = 2; i <= 10; i++) autres += f('f' + i);
    var eq = f('salb') * (1 + f('salt') / 100) + f('dirb') * (1 + f('dirt') / 100);
    return { ca: caDeclare(D), nour: vide(I.nour) ? null : f('nour'), boi: vide(I.boi) ? null : f('boi'), emb: vide(I.emb) ? null : f('emb'), com: vide(I.com) ? null : f('com'), equipe: eq * mois, loyer: f('f1') * mois, autres: autres * mois, amort: vide(I.amort) ? null : f('amort') };
  }
  function valeursFEC(t) { return { ca: num(t.revenue), nour: num(t.food), boi: num(t.beverage), emb: num(t.packaging), com: num(t.commissions), equipe: num(t.payroll), loyer: num(t.rent), autres: num(t.other_fixed), amort: num(t.amortization) }; }
  function resultat(v) { return v.ca == null ? null : v.ca - num(v.nour) - num(v.boi) - num(v.emb) - num(v.com) - v.equipe - v.loyer - v.autres - num(v.amort); }
  function aDesDonnees(D) { var v = valeurs(D); return !!(v.ca || v.nour || v.equipe || v.loyer); }

  /* Tableau « votre saisie / votre document / écart » — affiché avant d'importer le FEC, et après. */
  function tableau(saisie, docv) {
    var h = '<table class="df58-t"><thead><tr><th></th>' + (saisie ? '<th>Votre saisie</th>' : '') + '<th>Votre document</th>' + (saisie ? '<th>Écart</th>' : '') + '</tr></thead><tbody>';
    POSTES.concat([{ k: 'res', lib: 'Résultat avant impôt' }]).forEach(function (p) {
      var d = p.k === 'res' ? resultat(docv) : docv[p.k], s = saisie ? (p.k === 'res' ? resultat(saisie) : saisie[p.k]) : null, e = saisie && s != null && d != null ? s - d : null;
      var fort = e != null && differe(s, d);
      h += '<tr' + (p.k === 'res' ? ' class="df58-res"' : '') + '><td>' + esc(p.lib) + '</td>' + (saisie ? '<td>' + eur(s) + '</td>' : '') + '<td><b>' + eur(d) + '</b></td>' +
        (saisie ? '<td class="' + (fort ? 'df58-ko' : 'df58-ok') + '">' + (e == null ? '—' : fort ? (e > 0 ? '+' : '−') + eur(Math.abs(e)) : '≈') + '</td>' : '') + '</tr>';
    });
    return h + '</tbody></table>';
  }
  /* Appelé par le lecteur FEC avant le bouton « Confirmer et calculer ». */
  function comparaisonFEC(totals) {
    var D = w.DB, s = D && aDesDonnees(D) ? valeurs(D) : null, dv = valeursFEC(totals || {});
    var n = s ? POSTES.filter(function (p) { return differe(s[p.k], dv[p.k]); }).length : 0;
    return '<div class="df58-cmp"><h3>Ce que dit votre document comptable</h3>' + tableau(s, dv) +
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
      ETAT.bilan = { saisie: valeurs({ in: avantFec.in, ref: avantFec.ref, refSource: avantFec.refSource }), doc: D.docRef.valeurs };
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
      if (mois.length < 3 || !mois.every(function (k) { return (parMois[k] || 0) >= 15; })) return null;
    }
    var ttc = 0, tk = 0, tva = num(D.in && D.in.tva) || 10; L.forEach(function (r) { ttc += num(r.caJ); tk += num(r.tkJ); });
    return { jours: L.length, ttc: ttc, ht: ttc / (1 + tva / 100), tickets: tk, panier: tk > 0 ? ttc / tk : null, cmdj: tk > 0 ? tk / L.length : null, annee: annee };
  }

  /* ——— Écarts entre la saisie actuelle et les documents (ecarts = pas encore tranchés ; differences = tous) ——— */
  function differences(D) { var ba = D.docAccords, bc = D.docChangements; D.docAccords = {}; D.docChangements = {}; try { return ecarts(D); } finally { D.docAccords = ba; D.docChangements = bc; } }
  function tranche(D, k, v) { var a = (D.docAccords || {})[k], c = (D.docChangements || {})[k]; return (a != null && !differe(a, v)) || (c && !differe(c.saisie, v)); }
  function ecarts(D) {
    var out = [], acc = D.docAccords || {};
    if (D.docRef) {
      var dv = D.docRef.valeurs || {}, sv = valeurs(D);
      POSTES.forEach(function (p) { if (differe(sv[p.k], dv[p.k]) && !tranche(D, p.k, sv[p.k])) out.push({ k: p.k, lib: p.lib, saisie: sv[p.k], doc: dv[p.k], source: 'votre document comptable' }); });
    }
    var an = (D.refSource && D.refSource.exerciseYear) || (D.ref && D.ref.exercice), C = an ? caisse(D, an) : null;
    if (C) {
      var ca = caDeclare(D);
      if (!D.docRef && ca != null && differe(ca, C.ht) && !(acc.caCaisse != null && !differe(acc.caCaisse, ca))) out.push({ k: 'caCaisse', lib: 'Chiffre d’affaires HT ' + an, saisie: ca, doc: C.ht, source: 'votre caisse (' + C.jours + ' journées)' });
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
    else if (e.k === 'ca') { D.refSource.ca = D.docRef.ca; if (D.ref) D.ref.ca = D.docRef.ca; }
    else if (R) {
      var champs = { nour: ['nour'], boi: ['boi'], emb: ['emb'], com: ['com'], amort: ['amort'], equipe: ['salb', 'salt', 'dirb', 'dirt', 'dirn', 'saln'], loyer: ['f1'], autres: ['f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10'] }[e.k] || [];
      champs.concat(['mois']).forEach(function (c) { if (c in R) D.in[c] = R[c]; });
    }
  }
  function cleDocuments(D) { var an = (D.refSource && D.refSource.exerciseYear) || (D.ref && D.ref.exercice), C = an ? caisse(D, an) : null; return (D.docRef ? D.docRef.at : '') + '|' + (C ? C.annee + ':' + C.jours : ''); }
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
  function anneeDoc(D) { return (D.docRef && D.docRef.year) || (D.refSource && D.refSource.exerciseYear) || (D.ref && D.ref.exercice) || ''; }
  function noterChangements(D, E, depuis, raisons) {
    D.docChangements = D.docChangements || {}; D.docAccords = D.docAccords || {};
    (E || differences(D)).forEach(function (e) {
      if (e.k === 'ca' || e.k === 'caCaisse') { appliquerDocument(D, e); return; }
      D.docChangements[e.k] = { lib: e.lib, saisie: e.saisie, doc: e.doc, depuis: depuis || null, raison: (raisons && raisons[e.k]) || null, cents: !!e.cents, nombre: !!e.nombre };
      delete D.docAccords[e.k];
    });
    D.docChoix = { cle: cleDocuments(D), choix: 'changements' }; majVerrou(D); enregistrer(true);
  }
  /* Note finale seulement si rien ne contredit les documents ; et, sans document, seulement sans « incertitude » confirmée. */
  function incertitudeSansDocument(D) {
    if (D.docRef) return false; var an = (D.refSource && D.refSource.exerciseYear) || (D.ref && D.ref.exercice); if (an && caisse(D, an)) return false;
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
    if (redessiner) { try { w.fillInputs && w.fillInputs(); } catch (e) {} try { w.readInputs && w.readInputs(); } catch (e) {} try { w.refreshAll && w.refreshAll(); } catch (e) {} }
  }

  /* ——— La question (une seule, jamais pendant qu'il tape) ——— */
  var ETAT = { ouvert: null, bilan: null, remplis: {} };
  function fermer() { var m = doc.getElementById('df58-m'); if (m) m.remove(); ETAT.ouvert = null; }
  function montant(e, x) { if (e.nombre) return x.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' / jour'; return e.cents ? x.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : eur(x); }
  var SUITE = '<p>Erreur ou oubli dans la saisie ? Verdict conseille de prendre vos documents : ce sont vos vrais chiffres. Si vous gardez votre saisie sans raison, votre note sera une <b>lecture non finale</b> ; vous pourrez changer d’avis à tout moment dans Mes chiffres.</p>';
  function questionHTML(E) {
    var D = w.DB, an = anneeDoc(D), auj = new Date(), mois = [], y, m;
    for (y = Number(an) + 1 || auj.getFullYear(), m = 1; y < auj.getFullYear() || (y === auj.getFullYear() && m <= auj.getMonth() + 1); m++) { if (m > 12) { m = 0; y++; continue; } mois.push(y + '-' + ('0' + m).slice(-2)); }
    if (!mois.length) mois.push(auj.getFullYear() + '-' + ('0' + (auj.getMonth() + 1)).slice(-2));
    var h = '<h2>Vos documents et votre saisie ne disent pas la même chose</h2><table class="df58-t"><thead><tr><th></th><th>Votre saisie</th><th>Vos documents ' + esc(an) + '</th></tr></thead><tbody>';
    E.forEach(function (e) {
      var r = RAISONS[e.k], sel = r ? '<select class="df58-r" data-df58-raison="' + esc(e.k) + '"><option value="">Pourquoi ? (facultatif)</option>' + r.concat(['Autre']).map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select>' : '';
      h += '<tr><td>' + esc(e.lib) + '<br><small style="opacity:.7">' + esc(e.source) + '</small>' + (sel ? '<br>' + sel : '') + '</td><td>' + montant(e, e.saisie) + '</td><td><b>' + montant(e, e.doc) + '</b></td></tr>';
    });
    var caSeul = E.every(function (e) { return e.k === 'ca' || e.k === 'caCaisse'; });
    return h + '</tbody></table>' + SUITE +
      (caSeul ? '' : '<p class="df58-ch">Ce sont des changements depuis ' + esc(an) + ' (nouveau salarié, loyer revu, prix…) ? Verdict garde votre document ' + esc(an) + ' comme référence et tient compte de ces changements. Depuis quand ? <select data-df58-depuis="1"><option value="">je ne sais pas</option>' + mois.reverse().map(function (x) { return '<option value="' + x + '">' + esc(moisLib(x)) + '</option>'; }).join('') + '</select></p>') +
      '<div class="df58-b"><button type="button" class="btn" data-df58="tout-doc">Prendre tous mes documents (conseillé)</button>' + (caSeul ? '' : '<button type="button" class="btn sec" data-df58="tout-change">Ce sont des changements depuis ' + esc(an) + '</button>') + '<button type="button" class="btn ghost" data-df58="tout-saisie">Garder toute ma saisie</button></div>';
  }
  function bilanHTML(B) {
    var n = POSTES.filter(function (p) { return differe(B.saisie[p.k], B.doc[p.k]); }).length;
    return '<h2>Votre document comptable fait foi</h2><p>' + (n ? 'Verdict a pris les chiffres de votre document : <b>' + n + ' poste' + (n > 1 ? 's différaient' : ' différait') + '</b> de votre saisie.' : 'Votre saisie concordait avec votre document : rien n’a changé.') + '</p>' + tableau(B.saisie, B.doc) + (n ? SUITE : '') +
      '<div class="df58-b"><button type="button" class="btn" data-df58="ok">Garder mon document (conseillé)</button>' + (n ? '<button type="button" class="btn ghost" data-df58="saisie">Garder toute ma saisie</button>' : '') + '</div>';
  }
  function ouvrir(html) {
    var m = doc.getElementById('df58-m'); if (!m) { m = doc.createElement('div'); m.id = 'df58-m'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); doc.body.appendChild(m); }
    m.innerHTML = '<div class="df58-p">' + html + '</div>';
  }
  function saisieEnCours() { var a = doc.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !(a.closest && a.closest('#df58-m'))); }
  function tour() {
    var D = w.DB; if (!D || !D.in) return;
    /* démonstration : la note est déjà une simulation, rien à vérifier ni à afficher */
    if (D._demo || (D.dataProvenance && D.dataProvenance.nature === 'model_estimate')) { var bd = doc.getElementById('df58-ban'); if (bd) bd.remove(); return; }
    /* l'état de la note change (finale ↔ non finale) : on enregistre et on redessine l'écran tout de suite */
    if (majVerrou(D)) enregistrer(true);
    banniere(D);
    var C = null, an = (D.refSource && D.refSource.exerciseYear) || (D.ref && D.ref.exercice); if (an) C = caisse(D, an);
    /* panier et couverts vides : la caisse les donne, sans question */
    if (C && C.panier && vide(D.in.panier) && !ETAT.remplis[an]) { D.in.panier = Math.round(C.panier * 100) / 100; if (vide(D.in.cmdj)) D.in.cmdj = Math.round(C.cmdj * 10) / 10; ETAT.remplis[an] = true; if (D.docRef && D.docRef.in) { D.docRef.in.panier = D.in.panier; D.docRef.in.cmdj = D.in.cmdj; } enregistrer(true); }
    if (doc.getElementById('df58-m') || saisieEnCours()) return;
    if (ETAT.bilan) { ETAT.ouvert = { bilan: ETAT.bilan }; ouvrir(bilanHTML(ETAT.bilan)); ETAT.bilan = null; return; }
    var E = ecarts(D); if (E.length) { ETAT.ouvert = { liste: differences(D) }; ouvrir(questionHTML(ETAT.ouvert.liste)); }
  }
  doc.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('#df58-m [data-df58],#df58-ban [data-df58]') : null; if (!b) return;
    var a = b.getAttribute('data-df58'), O = ETAT.ouvert, D = w.DB;
    if (a === 'ok') { D.docChoix = { cle: cleDocuments(D), choix: 'documents' }; enregistrer(false); fermer(); return; }
    if (a === 'saisie') { /* juste après le FEC : revenir à toute la saisie d'avant, en un clic */
      var S = D.saisieAvantDocument; if (S) { D.docAccords = {}; var sv = valeurs({ in: S.in, ref: S.ref, refSource: S.refSource }); POSTES.forEach(function (p) { if (differe(sv[p.k], D.docRef.valeurs[p.k])) D.docAccords[p.k] = sv[p.k]; }); D.in = S.in; if (S.refSource && S.refSource.ca != null) { D.refSource.ca = S.refSource.ca; if (D.ref) D.ref.ca = S.refSource.ca; } D.docChoix = { cle: cleDocuments(D), choix: 'saisie' }; majVerrou(D); enregistrer(true); }
      fermer(); return; }
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
    var an = (D.refSource && D.refSource.exerciseYear) || (D.ref && D.ref.exercice), C = an ? caisse(D, an) : null, acc = Object.keys(D.docAccords || {}), t = [], k = 'ok';
    /* C274 (T4 vague 9) : après « Garder toute ma saisie », la première ligne disait encore que le document fait foi pour tout,
       juste au-dessus de « Vous gardez votre saisie… ». Une seule lecture : elle nomme les postes où le document fait encore foi,
       ou dit que la saisie a été retenue à sa place ; la ligne suivante nomme les postes gardés. */
    var ART = { ca: 'le chiffre d’affaires', nour: 'les achats de nourriture', boi: 'les achats de boissons', equipe: 'l’équipe', loyer: 'le loyer', autres: 'les autres charges fixes', amort: 'les amortissements', cmdj: 'les commandes par jour', panier: 'le panier moyen' };
    var nommer = function (L) { L = L.map(function (p) { return ART[p.k] || p.lib.charAt(0).toLowerCase() + p.lib.slice(1); }); return L.length > 1 ? L.slice(0, -1).join(', ') + ' et ' + L[L.length - 1] : L.join(''); };
    var gardes = POSTES.concat([{ k: 'cmdj', lib: 'Commandes par jour' }, { k: 'panier', lib: 'Panier moyen TTC' }]).filter(function (p) { return acc.indexOf(p.k) >= 0; }), restent = POSTES.filter(function (p) { return acc.indexOf(p.k) < 0; });
    if (D.docRef) t.push(!gardes.length ? '✓ Document comptable ' + (D.docRef.year || '') + ' : il fait foi pour vos ventes, achats, équipe et charges.' : restent.length ? '✓ Document comptable ' + (D.docRef.year || '') + ' : il fait foi pour ' + nommer(restent) + '.' : 'Document comptable ' + (D.docRef.year || '') + ' : votre saisie a été retenue à sa place.');
    if (C) { var ca = caDeclare(D), e = ca ? (C.ht - ca) / ca : 0; /* C216 (W49) : « identique » seulement à l'euro près ; sinon l'écart est dit en euros (et en % au-delà de 1 %). */
      var gap = ca ? C.ht - ca : 0;
      t.push('✓ Caisse ' + an + ' : ' + C.jours + ' journées, ' + eur(C.ht) + ' HT' + (ca ? (Math.abs(gap) < 1 ? ', identique à votre chiffre d’affaires' : Math.abs(e) <= 0.01 ? ', à ' + eur(Math.abs(gap)) + ' près de votre chiffre d’affaires (' + (gap > 0 ? '+' : '−') + (Math.round(Math.abs(e) * 10000) / 100).toLocaleString('fr-FR') + ' %)' : ', ' + (e > 0 ? '+' : '−') + Math.abs(Math.round(e * 1000) / 10).toLocaleString('fr-FR') + ' % par rapport à votre chiffre d’affaires' + (D.docRef ? ' : vérifiez avec votre comptable (ventes hors caisse, avoirs)' : '')) : '') + '. Panier moyen ' + (C.panier ? C.panier.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0€' : '—') + '.'); }
    if (acc.length) { k = 'ko'; var nd = noteDocuments(D), Rg = null, raison = ''; try { Rg = w.moteur && w.moteur(); } catch (e) {}
      /* C280 (T4 vague 10) : si la saisie gardée fait retirer l'Indice (garde-fou C190, ex. marge exceptionnellement élevée), on ne parle pas d'une « note non finale » qui n'est plus affichée. */
      try { raison = (w.anomaliesNonConfirmees ? w.anomaliesNonConfirmees() : []).map(function (a) { var l = String(a.lb || ''); l = l.replace(/^Marge avant imp(ô|\u00f4)t /, 'marge '); return l.charAt(0).toLowerCase() + l.slice(1) + ' à vérifier'; }).join(' ; '); } catch (e) {}
      var garde = gardes.length ? 'Vous gardez votre saisie pour ' + nommer(gardes) : 'Vous gardez votre saisie plutôt que vos documents';
      t.push(Rg && !Rg.ready ? garde + '. Avec votre saisie, Verdict n’affiche pas de note' + (raison ? ' (' + raison + ')' : '') + '.' + (nd != null ? ' Avec vos documents, votre note serait ' + nd + ' / 100.' : '') : garde + ' : votre note est une lecture non finale.' + (nd != null ? ' Avec vos documents, votre note serait ' + nd + ' / 100.' : '')); }
    var ch = D.docChangements || {}, chk = Object.keys(ch);
    if (chk.length) { var ndc = noteDocuments(D), anr = anneeDoc(D);
      t.push('Changements depuis ' + anr + ' pris en compte : ' + chk.map(function (x) { var c = ch[x], f = function (v) { if (c.nombre) return v.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' / jour'; return c.cents ? v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0€' : eur(v); }; return c.lib.toLowerCase() + ' ' + f(c.doc) + ' → ' + f(c.saisie) + (c.raison || c.depuis ? ' (' + [c.raison, c.depuis ? 'depuis ' + moisLib(c.depuis) : null].filter(Boolean).join(', ') + ')' : ''); }).join(' ; ') + '.');
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
  function boucle() { try { etiquette(); } catch (e) {} try { css(); tour(); } catch (e) {} }
  var it = setInterval(boucle, 1000); if (it && it.unref) it.unref();
  w.VerdictDocumentsFoi = { comparaisonFEC: comparaisonFEC, valeurs: valeurs, valeursFEC: valeursFEC, ecarts: ecarts, differences: differences, prendreTout: prendreTout, garderTout: garderTout, noterChangements: noterChangements, caisse: caisse, majVerrou: majVerrou, incertitudeSansDocument: incertitudeSansDocument, differe: differe, tour: boucle };
})();
