/* C151 — Consommation réelle du mois, fournie par l'Inventaire (aucun écran ici).
   L'Inventaire reste l'outil de comptage, gratuit ; il ne montre ni limites ni suivi. Il calcule seulement, pour chaque
   produit, la consommation réelle du mois en cours :
     stock compté au début de la période + quantités reçues (commandes reçues) − stock compté à la fin
   (même règle que « Matière réelle »), et dépose ce résumé pour le Pilotage. C'est le Pilotage (module Pro
   « Consommation », internal/limites-conso-pilotage-a47.js) qui porte les limites fixées par le patron et les alertes.
   Démonstration : consommations simulées, rien n'est enregistré dans les données de l'établissement. */
(function () {
  'use strict';
  var w = window; if (w.VerdictConsoInventaire) return;
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var CLE = 'verdict:conso-inventaire:v1';
  function demo() { try { return !!w.DEMO; } catch (e) { return false; } }
  function pad(n) { return String(n).padStart(2, '0'); }
  function jourCle(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function db() { try { return w.DB && w.DB.spaces ? w.DB : null; } catch (e) { return null; } }
  function site() { var D = db(); return D ? D.site : ''; }
  function lignes() { try { return typeof w.siteRows === 'function' ? w.siteRows(site()) : []; } catch (e) { return []; } }
  function prix(p) { try { var v = typeof w.px === 'function' ? w.px(p) : Number(p.price); return v != null && isFinite(v) && v >= 0 ? v : null; } catch (e) { return null; } }
  function zoneDe(space) { var D = db(), k = D && D.meta && D.meta[space] && D.meta[space].kind || space; return /bar/i.test(k) ? 'bar' : /cave|cellar/i.test(k) ? 'cave' : 'cuisine'; }
  function uniteDe(p) { var u = String(p.unit || '').toLowerCase(); return u === 'kg' ? 'kg' : u === 'l' ? 'L' : u === 'g' ? 'g' : 'unité'; }
  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function periode() {
    var now = new Date(), deb = new Date(now.getFullYear(), now.getMonth(), 1), fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { mois: now.getFullYear() + '-' + pad(now.getMonth() + 1), libMois: MOIS[now.getMonth()], debut: jourCle(deb), aujourdhui: jourCle(now), jour: now.getDate(), jours: fin.getDate() };
  }
  /* Démonstration : quatre produits aux valeurs connues (les limites d'exemple du Pilotage), les autres simulés. */
  var DEMO_VAL = { 'Entrecôte VBF': 2016, 'Filet de saumon frais': 817, 'Café en grains': 160, 'Bière blonde fût 30 L': 611 };
  function consoDemo(P) {
    var av = P.jour / P.jours, out = {};
    lignes().forEach(function (x) {
      var p = x.p, pr = prix(p); if (!pr) return;
      var v = DEMO_VAL[p.name] != null ? DEMO_VAL[p.name] : pr * (Number(p.goal) || 8) * 2.6 * av * (0.8 + (hash(p.id) % 40) / 100) * (zoneDe(x.space) === 'bar' ? 0.35 : 1.6);
      out[p.id] = { statut: 'ok', qte: v / pr, valeur: v, jours: Math.max(1, P.jour) };
    });
    return { mode: 'demo', lignes: out, debut: P.debut, fin: P.aujourdhui };
  }
  function consoReelle(P) {
    var D = db(), s = site(), out = { mode: 'reel', lignes: {} };
    var snaps = (D.snapshots || []).filter(function (x) { return x && x.site === s && x.schema === 'count-lines.v1' && Array.isArray(x.lines); }).sort(function (a, b) { return String(a.date) < String(b.date) ? -1 : 1; });
    var avant = snaps.filter(function (x) { return String(x.date).slice(0, 10) <= P.debut; }), dans = snaps.filter(function (x) { return String(x.date).slice(0, 10) > P.debut; });
    var A = avant.length ? avant[avant.length - 1] : dans.shift(); if (!A) { out.attente = 'Aucun comptage pour ce mois'; return out; }
    var B = dans.length ? dans[dans.length - 1] : null, byA = {}, byB = {};
    A.lines.forEach(function (l) { byA[l.id] = l; }); if (B) B.lines.forEach(function (l) { byB[l.id] = l; });
    lignes().forEach(function (x) {
      var p = x.p, la = byA[p.id], lb = byB[p.id], fin = lb ? lb.qty : null, fd = B ? B.date : null;
      if (fin == null && p.stock != null && p.countedAt && String(p.countedAt) > String(A.date)) { fin = Number(p.stock); fd = p.countedAt; }
      if (!la || la.qty == null || fin == null) { out.lignes[p.id] = { statut: 'attente' }; return; }
      var recu = 0;
      (D.purchaseOrders || []).forEach(function (o) {
        if (!o || o.site !== s || !/^(received|partial)$/.test(String(o.status || ''))) return;
        (o.lines || []).forEach(function (l) { var id = l.productId || (l.p && l.p.id); if (id !== p.id) return; try { var q = w.invQteDansPeriode(o, l, A.date, fd); if (isFinite(q)) recu += q; } catch (e) {} });
      });
      var q = Number(la.qty) + recu - Number(fin), pr = prix(p);
      var jours = Math.max(1, Math.round((Date.parse(String(fd).slice(0, 10)) - Date.parse(String(A.date).slice(0, 10))) / 864e5));
      out.lignes[p.id] = q < -1e-9 ? { statut: 'incoherent' } : { statut: 'ok', qte: q, valeur: pr != null ? q * pr : null, jours: jours };
      if (String(fd).slice(0, 10) > String(out.fin || '')) out.fin = String(fd).slice(0, 10);
    });
    out.debut = String(A.date).slice(0, 10); return out;
  }
  function etat() {
    if (!db()) return null;
    var P = periode(), C = demo() ? consoDemo(P) : consoReelle(P), produits = [];
    lignes().forEach(function (x) {
      var p = x.p, c = C.lignes[p.id] || { statut: 'attente' };
      produits.push({ id: p.id, nom: p.name, zone: zoneDe(x.space), unite: uniteDe(p), prix: prix(p), statut: c.statut, qte: c.qte != null ? c.qte : null, valeur: c.valeur != null ? c.valeur : null, jours: c.jours || null });
    });
    return { site: site(), mois: P.mois, libMois: P.libMois, jour: P.jour, jours: P.jours, mode: C.mode, debut: C.debut || null, fin: C.fin || null, attente: C.attente || null, produits: produits, at: new Date().toISOString(), demo: demo() };
  }
  function deposer() { try { var E = etat(); if (E) localStorage.setItem(CLE + (E.demo ? ':demo' : ''), JSON.stringify(E)); } catch (e) {} }
  setInterval(deposer, 15000); setTimeout(deposer, 2500);
  w.VerdictConsoInventaire = { etat: etat, deposer: deposer };
})();
