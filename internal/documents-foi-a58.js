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
    { k: 'ca', lib: 'Chiffre d’affaires HT' }, { k: 'nour', lib: 'Achats nourriture' }, { k: 'boi', lib: 'Achats boissons' },
    { k: 'equipe', lib: 'Équipe (salaires et cotisations)' }, { k: 'loyer', lib: 'Loyer' }, { k: 'autres', lib: 'Autres charges fixes' },
    { k: 'amort', lib: 'Amortissements' }
  ];
  function caDeclare(D) { var rs = D.refSource || {}, rf = D.ref || {}; return rs.ca != null ? num(rs.ca) : rf.ca != null ? num(rf.ca) : null; }
  function valeurs(D, I) {
    I = I || D.in || {}; var mois = num(I.mois) || 12, f = function (k) { return num(I[k]); }, autres = 0;
    for (var i = 2; i <= 10; i++) autres += f('f' + i);
    var eq = f('salb') * (1 + f('salt') / 100) + f('dirb') * (1 + f('dirt') / 100);
    return { ca: caDeclare(D), nour: vide(I.nour) ? null : f('nour'), boi: vide(I.boi) ? null : f('boi'), equipe: eq * mois, loyer: f('f1') * mois, autres: autres * mois, amort: vide(I.amort) ? null : f('amort') };
  }
  function valeursFEC(t) { return { ca: num(t.revenue), nour: num(t.food), boi: num(t.beverage), equipe: num(t.payroll), loyer: num(t.rent), autres: num(t.other_fixed), amort: num(t.amortization) }; }
  function resultat(v) { return v.ca == null ? null : v.ca - num(v.nour) - num(v.boi) - v.equipe - v.loyer - v.autres - num(v.amort); }
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
    D.docAccords = {}; if (D.docVerrou) delete D.docVerrou;
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
    var L = (D.histJour || []).filter(function (r) { return r && String(r.date).slice(0, 4) === String(annee) && /pos|csv|caisse|import/i.test(String(r.source || '')) && num(r.caJ) > 0; });
    if (L.length < 250) return null;
    var ttc = 0, tk = 0, tva = num(D.in && D.in.tva) || 10; L.forEach(function (r) { ttc += num(r.caJ); tk += num(r.tkJ); });
    return { jours: L.length, ttc: ttc, ht: ttc / (1 + tva / 100), tickets: tk, panier: tk > 0 ? ttc / tk : null, cmdj: tk > 0 ? tk / L.length : null, annee: annee };
  }

  /* ——— Écarts entre la saisie actuelle et les documents (ecarts = pas encore tranchés ; differences = tous) ——— */
  function differences(D) { var bak = D.docAccords; D.docAccords = {}; try { return ecarts(D); } finally { D.docAccords = bak; } }
  function ecarts(D) {
    var out = [], acc = D.docAccords || {};
    if (D.docRef) {
      var dv = D.docRef.valeurs || {}, sv = valeurs(D);
      POSTES.forEach(function (p) { if (differe(sv[p.k], dv[p.k]) && !(acc[p.k] != null && !differe(acc[p.k], sv[p.k]))) out.push({ k: p.k, lib: p.lib, saisie: sv[p.k], doc: dv[p.k], source: 'votre document comptable' }); });
    }
    var an = (D.refSource && D.refSource.exerciseYear) || (D.ref && D.ref.exercice), C = an ? caisse(D, an) : null;
    if (C) {
      var ca = caDeclare(D);
      if (!D.docRef && ca != null && differe(ca, C.ht) && !(acc.caCaisse != null && !differe(acc.caCaisse, ca))) out.push({ k: 'caCaisse', lib: 'Chiffre d’affaires HT ' + an, saisie: ca, doc: C.ht, source: 'votre caisse (' + C.jours + ' journées)' });
      if (C.panier && !vide(D.in.panier) && Math.abs(num(D.in.panier) - C.panier) > C.panier * 0.05 && !(acc.panier != null && !differe(acc.panier, D.in.panier))) out.push({ k: 'panier', lib: 'Panier moyen TTC', saisie: num(D.in.panier), doc: C.panier, source: 'votre caisse', cents: true });
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
    else if (e.k === 'ca') { D.refSource.ca = D.docRef.ca; if (D.ref) D.ref.ca = D.docRef.ca; }
    else if (R) {
      var champs = { nour: ['nour'], boi: ['boi'], amort: ['amort'], equipe: ['salb', 'salt', 'dirb', 'dirt', 'dirn', 'saln'], loyer: ['f1'], autres: ['f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10'] }[e.k] || [];
      champs.concat(['mois']).forEach(function (c) { if (c in R) D.in[c] = R[c]; });
    }
  }
  function cleDocuments(D) { var an = (D.refSource && D.refSource.exerciseYear) || (D.ref && D.ref.exercice), C = an ? caisse(D, an) : null; return (D.docRef ? D.docRef.at : '') + '|' + (C ? C.annee + ':' + C.jours : ''); }
  function prendreTout(D, E) { (E || differences(D)).forEach(function (e) { appliquerDocument(D, e); }); D.docAccords = {}; D.docChoix = { cle: cleDocuments(D), choix: 'documents' }; majVerrou(D); enregistrer(true); }
  function garderTout(D, E) { D.docAccords = D.docAccords || {}; (E || differences(D)).forEach(function (e) { D.docAccords[e.k] = e.saisie; }); D.docChoix = { cle: cleDocuments(D), choix: 'saisie' }; majVerrou(D); enregistrer(true); }
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
  function montant(e, x) { return e.cents ? x.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : eur(x); }
  var SUITE = '<p>Verdict conseille de prendre vos documents : ce sont vos vrais chiffres. Si vous gardez votre saisie, votre note sera une <b>lecture non finale</b> ; vous pourrez changer d’avis à tout moment dans Mes chiffres.</p>';
  function questionHTML(E) {
    var h = '<h2>Vos documents et votre saisie ne disent pas la même chose</h2><table class="df58-t"><thead><tr><th></th><th>Votre saisie</th><th>Vos documents</th></tr></thead><tbody>';
    E.forEach(function (e) { h += '<tr><td>' + esc(e.lib) + '<br><small style="opacity:.7">' + esc(e.source) + '</small></td><td>' + montant(e, e.saisie) + '</td><td><b>' + montant(e, e.doc) + '</b></td></tr>'; });
    return h + '</tbody></table>' + SUITE + '<div class="df58-b"><button type="button" class="btn" data-df58="tout-doc">Prendre tous mes documents (conseillé)</button><button type="button" class="btn ghost" data-df58="tout-saisie">Garder toute ma saisie</button></div>';
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
  });

  /* La note calculée avec les chiffres des documents (calcul à part, la saisie n'est jamais modifiée). */
  var NOTE_DOC = { cle: null, v: null };
  function noteDocuments(D) {
    if (!D.docRef || !D.docRef.in) return null;
    var cle = JSON.stringify(D.docAccords || {}) + '|' + D.docRef.at; if (NOTE_DOC.cle === cle) return NOTE_DOC.v;
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
    if (D.docRef) t.push('✓ Document comptable ' + (D.docRef.year || '') + ' : il fait foi pour vos ventes, achats, équipe et charges.');
    if (C) { var ca = caDeclare(D), e = ca ? (C.ht - ca) / ca : 0; t.push('✓ Caisse ' + an + ' : ' + C.jours + ' journées, ' + eur(C.ht) + ' HT' + (ca ? (Math.abs(e) <= 0.01 ? ', identique à votre chiffre d’affaires' : ', ' + (e > 0 ? '+' : '−') + Math.abs(Math.round(e * 1000) / 10).toLocaleString('fr-FR') + ' % par rapport à votre chiffre d’affaires' + (D.docRef ? ' : vérifiez avec votre comptable (ventes hors caisse, avoirs)' : '')) : '') + '. Panier moyen ' + (C.panier ? C.panier.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0€' : '—') + '.'); }
    if (acc.length) { k = 'ko'; var nd = noteDocuments(D); t.push('Vous gardez votre saisie plutôt que vos documents : votre note est une lecture non finale.' + (nd != null ? ' Avec vos documents, votre note serait ' + nd + ' / 100.' : '')); }
    if (!D.docRef && !C) { k = D.docVerrou ? 'ko' : 'info'; t.push(D.docVerrou ? 'Vous avez confirmé des chiffres inhabituels sans document : votre note reste une lecture non finale.' : 'Note calculée sur votre saisie.'); t.push('Déposez votre document comptable (FEC) et l’export de votre caisse : Verdict s’appuiera sur vos vrais chiffres.'); }
    var html = '<b>D’où viennent vos chiffres</b>' + t.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + (acc.length ? '<button type="button" class="btn" data-df58="tout-doc" style="margin-top:8px">Prendre mes documents</button>' : '');
    var el = doc.getElementById('df58-ban');
    if (!el) { el = doc.createElement('div'); el.id = 'df58-ban'; var h1 = vue.querySelector('h1'); if (h1 && h1.parentNode === vue) h1.insertAdjacentElement('afterend', el); else vue.insertBefore(el, vue.firstChild); }
    if (el.__html === html + k) return; el.__html = html + k; el.className = 'df58-ban df58-' + k; el.innerHTML = html;
  }

  var CSS = '#df58-m{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,6,23,.62)}' +
    '#df58-m .df58-p{max-width:560px;width:100%;max-height:90vh;overflow:auto;background:var(--card,#111827);color:var(--txt,#f8fafc);border:1px solid rgba(148,163,184,.3);border-radius:18px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.45)}' +
    'html:not(.vd-workspace-dark) #df58-m .df58-p{background:#fff;color:#0f172a}#df58-m h2{font-size:19px;margin:0 0 8px}#df58-m p{font-size:14.5px;line-height:1.5;margin:6px 0}' +
    '.df58-b{display:flex;flex-direction:column;gap:8px;margin-top:14px}.df58-t{width:100%;border-collapse:collapse;font-size:13.5px;margin:8px 0;font-variant-numeric:tabular-nums}.df58-t th,.df58-t td{padding:6px 4px;text-align:right;border-top:1px solid rgba(148,163,184,.22)}.df58-t th:first-child,.df58-t td:first-child{text-align:left}.df58-t th{font-size:12px;opacity:.75}.df58-res td{font-weight:700}.df58-ko{color:#ef4444;font-weight:700}.df58-ok{color:#22c55e}' +
    '.df58-cmp{margin:12px 0;padding:12px;border-radius:12px;border:1px solid rgba(148,163,184,.3)}.df58-cmp h3{font-size:15px;margin:0 0 4px}.df58-cmp p{font-size:13.5px;line-height:1.45;margin:6px 0 0}' +
    '.df58-ban{margin:10px 0 14px;padding:12px 14px;border-radius:14px;border-left:4px solid #22c55e;background:rgba(34,197,94,.08)}.df58-ban.df58-ko{border-left-color:#f97316;background:rgba(249,115,22,.1)}.df58-ban.df58-info{border-left-color:#60a5fa;background:rgba(96,165,250,.1)}.df58-ban b{font-size:13px;letter-spacing:.04em;text-transform:uppercase;opacity:.8}.df58-ban p{margin:4px 0 0;font-size:14px;line-height:1.45}';
  function css() { if (!doc.getElementById('df58-css')) { var s = doc.createElement('style'); s.id = 'df58-css'; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s); } }
  function boucle() { try { css(); tour(); } catch (e) {} }
  var it = setInterval(boucle, 1000); if (it && it.unref) it.unref();
  w.VerdictDocumentsFoi = { comparaisonFEC: comparaisonFEC, valeurs: valeurs, valeursFEC: valeursFEC, ecarts: ecarts, differences: differences, prendreTout: prendreTout, garderTout: garderTout, caisse: caisse, majVerrou: majVerrou, incertitudeSansDocument: incertitudeSansDocument, differe: differe, tour: boucle };
})();
