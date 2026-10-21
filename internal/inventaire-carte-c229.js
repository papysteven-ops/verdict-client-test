/* =====================================================================
   C229 (X22, avec X24) — L'Inventaire et la Carte ne font qu'un, sans recopie (lot L6, vague 5, 21/10/2026)
   Chargé par la coque (index.html), à côté des cadres Pilotage et Inventaire.
   Ce qui est appris dans l'Inventaire gratuit sert dès que Pilotage est là :
   - les factures déposées dans l'Inventaire entrent dans les achats de Pilotage et dans sa liste « Factures fournisseurs »
     (même empreinte = jamais deux fois) ;
   - le prix réel d'un produit (venu d'une facture) va dans la fiche de l'ingrédient de même nom, ou de l'ingrédient auquel
     le produit est relié (« Entrecote VBF » = « Entrecôte de bœuf ») : prix type remplacé, historique gardé.
   Tout passe par les fonctions publiques du moteur de Verdict (fusionnerAchats, facPropagerPrix) : mêmes contrôles
   (unité, facture plus ancienne, écart de plus de 50 % à confirmer). Rien n'est écrit si rien n'a changé (0 changement
   au repos). Jamais en démonstration, pour l'équipe ni en inventaire partagé.
   ===================================================================== */
(function (w) {
  'use strict';
  if (w.__vdInvCarteC229 || w.top !== w) return; w.__vdInvCarteC229 = true;
  var doc = w.document, derniere = '', minuteur = 0;
  function norm(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function equipe() { try { return /[?&](equipe|staff|shared|ownerTeam)=/.test(location.search) || !!sessionStorage.getItem('verdict:equipe:v1'); } catch (e) { return false; } }
  function demo() { try { return /[?&](demo=1|presentation=)/.test(location.search) || localStorage.getItem('verdict:demo:resume:client:v1') === '1'; } catch (e) { return false; } }
  function verdict() {
    var f = doc.getElementById('frame-verdict'), cw = null; try { cw = f && f.contentWindow; } catch (e) { return null; }
    try { if (!cw || !cw.DB || !Array.isArray(cw.DB.ing) || typeof cw.facPropagerPrix !== 'function' || !cw.VerdictFacturesXML) return null; if (cw.VERDICT_DEMO_SESSION || (typeof cw.getMode === 'function' && cw.getMode() === 'demo')) return null; } catch (e) { return null; }
    return cw;
  }
  /* L'Inventaire : celui du cadre s'il est ouvert (toujours à jour), sinon sa sauvegarde sur l'appareil (lecture seule). */
  function inventaire() {
    try { var f = doc.getElementById('frame-inventory'), iw = f && f.contentWindow; if (iw && iw.DB && iw.DB.spaces && !iw.DEMO && !iw.STAFF && !iw.SHARED) return iw.DB; } catch (e) {}
    try {
      var cles = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i) || ''; if (k.indexOf('verdict:inv:compte:v2:') === 0 && !/:sync$|demo|shared:|equipe:/i.test(k)) cles.push(k); }
      cles.sort(function (a, b) { return (b === 'verdict:inv:compte:v2:client-open-local') - (a === 'verdict:inv:compte:v2:client-open-local'); });
      for (var j = 0; j < cles.length; j++) { var d = JSON.parse(localStorage.getItem(cles[j]) || 'null'); if (d && d.spaces) return d; }
    } catch (e) {}
    return null;
  }
  /* Un seul établissement d'Inventaire, ou celui qui porte le nom de l'établissement ouvert dans Pilotage. */
  function produits(I, V) {
    var sites = (I.siteList || Object.keys(I.sites || {})), sid = I.site;
    if (sites.length > 1) { sid = sites.filter(function (s) { return norm(I.sites && I.sites[s] && I.sites[s].name) === norm(V.etab); })[0]; if (!sid) return null; }
    var out = []; ((I.sites && I.sites[sid] && I.sites[sid].zones) || Object.keys(I.spaces || {})).forEach(function (z) { ((I.spaces[z] || {}).products || []).forEach(function (p) { if (p && p.name) out.push(p); }); });
    return { site: sid, liste: out };
  }
  function uniteCode(u) { var n = norm(u).replace(/\s+/g, ''); if (/^(kg|kilo|kgs)$/.test(n)) return 'kg'; if (/^(g|gr|grm)$/.test(n)) return 'g'; if (/^(l|litre|litres|lt|ltr)$/.test(n)) return 'l'; if (n === 'cl') return 'cl'; if (n === 'ml') return 'ml'; if (/^(piece|pieces|pce|pc|u|un|unite|unites|btl|bt|bouteille|bouteilles|bout|canette|canettes)$/.test(n) || !n) return 'piece'; return null; }
  function ingredientPour(V, p) { var k = norm(p.ingredient || p.name); return (V.ing || []).filter(function (g) { return g && norm(g.nom) === k; })[0] || null; }

  function synchroniser() {
    if (equipe() || demo()) return false;
    var F = verdict(), I = inventaire(); if (!F || !I) return false;
    var V = F.DB, P = produits(I, V); if (!P) return false;
    var ach = F.achCle || function (x) { return String(x || '').trim().toLowerCase(); };
    var byId = {}; P.liste.forEach(function (p) { byId[p.id] = p; });
    var empreinte = JSON.stringify([(I.facturesInventaire || []).map(function (f) { return f.empreinte; }), P.liste.map(function (p) { return [p.id, p.name, p.ingredient || '', p.price, p.priceDate || '', p.unit]; }), (V.ing || []).map(function (g) { return [g.nom, g.prix, g.prixSource || '', g.prixDate || '']; }), (V.facturesImportees || []).length]);
    if (empreinte === derniere) return false;
    var change = false;
    /* 1. Factures de l'Inventaire → achats et liste des factures de Pilotage (une seule fois, par empreinte). */
    var connues = {}; (V.facturesImportees || []).forEach(function (h) { connues[h.empreinte] = 1; });
    (I.facturesInventaire || []).forEach(function (fac) {
      if (!fac || !fac.empreinte || connues[fac.empreinte] || !Array.isArray(fac.achats) || !fac.achats.length) return;
      var lignes = fac.achats.map(function (a) {
        /* le libellé de la facture s'il est déjà un ingrédient de la Carte, sinon l'ingrédient relié au produit, sinon le produit */
        var p = byId[a.produitId], estIng = function (x) { return x && (V.ing || []).some(function (g) { return norm(g.nom) === norm(x); }); };
        var nom = estIng(a.art) ? a.art : (p ? (p.ingredient || p.name) : (a.art || '')), l = {}; Object.keys(a).forEach(function (k) { l[k] = a[k]; });
        l.art = nom; l.produitId = ach(nom); l.source = 'inventaire'; return l;
      }).filter(function (l) { return l.art; });
      if (!lignes.length) return;
      var M = F.VerdictFacturesXML.fusionnerAchats(V.achats || [], lignes, null); V.achats = M.achats;
      V.facturesImportees = V.facturesImportees || [];
      V.facturesImportees.push({ empreinte: fac.empreinte, fournisseur: fac.fournisseur, numero: fac.numero, date: fac.date, ttc: fac.ttc, lignes: lignes.length, fichier: fac.fichier || null, importeLe: fac.importeLe || new Date().toISOString(), moteur: F.VerdictFacturesXML.version, statut: 'valide', source: 'inventaire' });
      connues[fac.empreinte] = 1; change = true;
      try { F.facPropagerPrix(lignes); } catch (e) {}
    });
    /* 2. Prix réels des produits (venus d'une facture) → fiche de l'ingrédient de même nom ou relié. */
    var factures = {}; (I.priceHistory || []).forEach(function (h) { if (h && h.source === 'facture' && byId[h.product]) factures[h.product] = h; });
    var aPropager = [];
    P.liste.forEach(function (p) {
      var pr = Number(p.price), h = factures[p.id]; if (!(pr > 0) || !h) return;
      var g = ingredientPour(V, p), u = uniteCode(p.unit); if (!g || !u) return;
      var d = String(p.priceDate || h.date || '').slice(0, 10);
      if (g.prixSource === 'facture' && g.prixDate && d && String(g.prixDate).slice(0, 10) >= d) return;
      if (g.prixSource === 'facture' && Math.abs(Number(g.prix) - pr) < 0.00005) return;
      aPropager.push({ art: g.nom, produitId: ach(g.nom), qte: 1, pu: pr, unite: u, d: d, dateFacture: d, four: p.sup || h.fournisseur || null, facture: h.facture || null, source: 'inventaire' });
    });
    if (aPropager.length) { try { var R = F.facPropagerPrix(aPropager); if (R && R.propages && R.propages.length) change = true; } catch (e) {} }
    if (change) { try { F.save('inventaire-carte'); } catch (e) { try { F.save(); } catch (x) {} } }
    derniere = JSON.stringify([(I.facturesInventaire || []).map(function (f) { return f.empreinte; }), P.liste.map(function (p) { return [p.id, p.name, p.ingredient || '', p.price, p.priceDate || '', p.unit]; }), (F.DB.ing || []).map(function (g) { return [g.nom, g.prix, g.prixSource || '', g.prixDate || '']; }), (F.DB.facturesImportees || []).length]);
    return change;
  }
  w.VerdictInventaireCarte = { synchroniser: synchroniser };
  /* Quand regarder : au retour sur l'appli, quand l'Inventaire enregistre (événement storage d'un autre onglet), et
     toutes les 4 s tant que Pilotage est chargé (lecture seule tant que rien ne change). */
  function plus_tard() { clearTimeout(minuteur); minuteur = setTimeout(function () { try { synchroniser(); } catch (e) {} }, 600); }
  w.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('verdict:inv:compte:v2:') === 0) plus_tard(); });
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) plus_tard(); });
  setInterval(function () { if (!doc.hidden && verdict()) { try { synchroniser(); } catch (e) {} } }, 4000);
})(window);
