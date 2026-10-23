/* C151 — Module Pro « Consommation » du Pilotage : limites par produit fixées par le patron.
   Demande de Steven (18/10) : « tomates séchées, truffe… Verdict calcule la consommation en euros ; le client fixe une
   limite ; si le chef dépasse, alerte (Accueil, Alertes) ; le patron sait exactement où il en est, en kg ou en euros,
   bar et cuisine », puis : « le patron lui seul gère cette limite ; l'Inventaire sert juste à faire l'inventaire ».
   - L'Inventaire (gratuit) ne fait que compter ; il fournit la consommation réelle du mois par produit
     (internal/limites-conso-a47.js : stock compté + livraisons − stock compté).
   - Ici, côté patron : écran « Consommation » (Plus › Piloter), limites en € par mois, où il en est en € et en kg/L,
     bar / cuisine, rythme et date probable de dépassement, plus grosses consommations du mois.
   - Couleurs Verdict, toujours avec un mot : vert « Sous la limite », jaune « Proche » (≥ 80 %), orange « Dépassement
     prévu » (au rythme mesuré), rouge « Limite dépassée ».
   - Alertes : carte dans l'Accueil (chapitre Jour), lignes dans Alertes, signal « risque » pour les notifications.
   Le blocage gratuit / Pro sera décidé plus tard (Steven) : le module est marqué Pro, sans verrou pour l'instant.
   C212 (W03) : la grille de l'offre (verdict-048, VO_ACCES) le range en Pro. Sous Pilotage, l'écran montre le verrou Pro
   et « Voir les offres » ; on ne peut ni fixer ni modifier une limite, et aucune alerte de limite n'est émise. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdLimitesPilotage) return; w.__vdLimitesPilotage = true;
  var CLE = 'verdict:conso-inventaire:v1';
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var COUL = { vert: '#22c55e', jaune: '#eab308', orange: '#f97316', rouge: '#ef4444', vide: '#94a3b8' }, ZONE = { cuisine: 'Cuisine', bar: 'Bar', cave: 'Cave' };
  function demo() { return /[?&](demo=1|presentation=)/.test(location.search + (self.__vdq || '')); }
  function eur(v) { return Math.round(Number(v) || 0).toLocaleString('fr-FR') + '\u00a0€'; }
  function nb(v) { return (Math.round((Number(v) || 0) * 10) / 10).toLocaleString('fr-FR', { maximumFractionDigits: 1 }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function moisCourant() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function qteTxt(q, u) { return u === 'unité' ? nb(q) + ' unité' + (q >= 2 ? 's' : '') : nb(q) + ' ' + u; }
  function dateFr(s) { return String(s || '').slice(0, 10).split('-').reverse().join('/'); }
  /* C212 : niveau lu dans l'offre appliquée (démonstration et accès ouvert = Pro ; sans grille, rien n'est fermé). */
  function pro() { try { return typeof w.verdictNiveau !== 'function' || w.verdictNiveau() === 'pro'; } catch (e) { return true; } }

  /* ---------- Consommation réelle (fournie par l'Inventaire) ---------- */
  var DEMO_P = [['Entrecôte VBF', 'cuisine', 'kg', 22.5, 2016], ['Filet de saumon frais', 'cuisine', 'kg', 15.5, 817], ['Café en grains', 'bar', 'kg', 14.5, 160], ['Bière blonde fût 30 L', 'bar', 'L', 2.55, 611],
    ['Bœuf haché frais 15 %', 'cuisine', 'kg', 10.9, 1240], ['Comté AOP 12 mois', 'cuisine', 'kg', 16.5, 520], ['Cuisse de poulet', 'cuisine', 'kg', 4.2, 610], ['Pomme de terre', 'cuisine', 'kg', 1.25, 390],
    ['Beurre doux plaquette', 'cuisine', 'kg', 10.8, 455], ['Crème liquide 35 %', 'cuisine', 'L', 4.6, 330], ['Moules de bouchot (poids acheté)', 'cuisine', 'kg', 4.2, 470], ['Parmesan AOP', 'cuisine', 'kg', 19.5, 280],
    ['Vin bouteille milieu de gamme', 'bar', 'unité', 11.5, 690], ['Pastis 1 L', 'bar', 'L', 15, 240], ['Soda 33 cl', 'bar', 'unité', 0.62, 180]];
  function consoDemo() {
    var now = new Date(), j = now.getDate(), J = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return { mois: moisCourant(), libMois: MOIS[now.getMonth()], jour: j, jours: J, mode: 'demo', demo: true, debut: moisCourant() + '-01', fin: moisCourant() + '-' + String(j).padStart(2, '0'),
      produits: DEMO_P.map(function (p, i) { return { id: 'demo-conso-' + i, nom: p[0], zone: p[1], unite: p[2], prix: p[3], statut: 'ok', valeur: p[4], qte: p[4] / p[3], jours: Math.max(1, j) }; }) };
  }
  /* C157 — Démonstration d'un autre modèle que la Brasserie (pizzeria, kebab, gastro…) : la consommation vient de ses
     propres fiches techniques et ventes (coût de chaque ingrédient par portion × ventes du mois à date), pas des produits de
     la Brasserie. */
  function brasserie() { var D = vdb(); return !D || !D.modele || D.modele === 'Brasserie'; }
  function consoModele() {
    var D = vdb(); if (!D || !Array.isArray(D.plats) || !Array.isArray(D.ing)) return null;
    var now = new Date(), j = now.getDate(), J = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), av = j / J, par = {};
    D.plats.forEach(function (pl) {
      if (pl.cpArchived) return; var bar = /boisson|bière|biere|vin|cocktail|soft|café|cafe|alcool/i.test(String(pl.cat || '')), vol = Number(pl.vol) || 0; if (!vol) return;
      (pl.rec || []).forEach(function (l) {
        var g = D.ing.filter(function (x) { return x.nom === l[0]; })[0], st = null; if (!g || !(Number(g.prix) > 0)) return;
        try { st = w.coutLignesRecette([l]).st; } catch (e) {} if (!(st > 0)) return;
        var x = par[g.nom] = par[g.nom] || { id: 'mod-' + (g.id || g.nom), nom: g.nom, zone: bar ? 'bar' : 'cuisine', unite: g.type === 'KG' ? 'kg' : g.type === 'L' ? 'L' : 'unité', prix: Number(g.prix), statut: 'ok', valeur: 0, qte: 0, jours: Math.max(1, j) };
        x.valeur += st * vol * av; x.qte = x.valeur / x.prix; if (!bar) x.zone = 'cuisine';
      });
    });
    var produits = Object.keys(par).map(function (k) { return par[k]; }); if (!produits.length) return null;
    return { mois: moisCourant(), libMois: MOIS[now.getMonth()], jour: j, jours: J, mode: 'demo', demo: true, debut: moisCourant() + '-01', fin: moisCourant() + '-' + String(j).padStart(2, '0'), produits: produits };
  }
  function conso() {
    /* C165 : en démonstration, une seule source — les fiches et ventes de l'établissement — que l'Inventaire ait été ouvert
       ou non (avant : deux calculs différents selon l'ordre d'ouverture des modules, totaux bar / cuisine différents). */
    if (demo()) { var Cm = consoModele(); if (Cm) return Cm; }
    var C = null;
    try { var f = w.parent && w.parent !== w && w.parent.document.getElementById('frame-inventory'), I = f && f.contentWindow && f.contentWindow.VerdictConsoInventaire; if (I) C = I.etat(); } catch (e) {}
    if (!C) try { C = JSON.parse(localStorage.getItem(CLE + (demo() ? ':demo' : '')) || 'null'); } catch (e) {}
    if ((!C || C.mois !== moisCourant()) && demo()) C = consoDemo();
    return C && C.mois === moisCourant() && Array.isArray(C.produits) ? C : null;
  }
  /* C305 (V15-075, avec L6) : la liste « Produit » d'une limite ne dépend plus d'une consommation déjà calculée ce mois-ci.
     Sans consommation du mois (Inventaire pas encore rouvert, ou premier comptage seulement), elle propose les produits
     chiffrés connus de l'Inventaire (dernier résumé déposé, quel que soit son mois) : la limite se pose tout de suite, la
     mesure viendra avec les comptages. */
  function produitsConnus(E) {
    if (E && E.conso && E.conso.produits && E.conso.produits.length) return E.conso.produits;
    var C = null;
    try { var f = w.parent && w.parent !== w && w.parent.document.getElementById('frame-inventory'), I = f && f.contentWindow && f.contentWindow.VerdictConsoInventaire; if (I) C = I.etat(); } catch (e) {}
    if (!C || !Array.isArray(C.produits)) try { C = JSON.parse(localStorage.getItem(CLE + (demo() ? ':demo' : '')) || 'null'); } catch (e) {}
    return C && Array.isArray(C.produits) ? C.produits : [];
  }

  /* ---------- Limites du patron (données du Pilotage) ---------- */
  function vdb() { try { return w.DB && typeof w.DB === 'object' ? w.DB : null; } catch (e) { return null; } }
  function limites() {
    var D = vdb(); if (!D) return [];
    if (!Array.isArray(D.consumptionLimits)) {
      if (!demo()) D.consumptionLimits = [];
      else { /* Limites d'exemple sur les produits du modèle : une dépassée, une en passe de l'être, deux sous la limite. */
        var Cm = consoModele(), top = Cm ? Cm.produits.slice().sort(function (a, b) { return b.valeur - a.valeur; }).slice(0, 4) : [], k = [1.12, 0.86, 0.5, 0.47];
        D.consumptionLimits = top.map(function (p, i) { return { id: 'lim-demo-' + i, productId: p.id, nom: p.nom, eur: Math.max(50, Math.round(p.valeur / k[i] / 50) * 50), demo: true }; });
      }
    }
    return D.consumptionLimits;
  }
  function enregistrer() { try { if (typeof w.save === 'function') w.save(); } catch (e) {} }
  function etatDe(valeur, limite, projection) {
    var r = limite > 0 ? valeur / limite : 0, pj = limite > 0 && projection != null ? projection / limite : 0;
    if (r >= 1) return ['rouge', 'Limite dépassée']; if (pj >= 1) return ['orange', 'Dépassement prévu']; if (r >= 0.8) return ['jaune', 'Proche de la limite']; return ['vert', 'Sous la limite'];
  }
  function etat() {
    var C = conso(), now = new Date(), lib = C ? C.libMois : MOIS[now.getMonth()];
    var J = C && C.jours || new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var items = limites().map(function (l) {
      var p = C && C.produits.filter(function (x) { return x.id === l.productId; })[0] || C && C.produits.filter(function (x) { return x.nom === l.nom; })[0] || null;
      var it = { id: l.id, productId: p ? p.id : l.productId, nom: p ? p.nom : l.nom, zone: p ? p.zone : l.zone || 'cuisine', unite: p ? p.unite : l.unite || 'kg', prix: p ? p.prix : l.prix, limite: Number(l.eur) || 0 };
      if (!p || p.statut !== 'ok' || p.valeur == null) { it.etat = 'vide'; it.mot = p && p.statut === 'incoherent' ? 'Comptage à vérifier' : 'En attente d’un comptage'; return it; }
      it.valeur = p.valeur; it.qte = p.qte; it.pct = it.limite > 0 ? p.valeur / it.limite : 0;
      /* Rythme ramené au mois entier, seulement après 5 jours mesurés (jamais une seule journée extrapolée). */
      it.projection = p.jours >= 5 || C.mode === 'demo' ? p.valeur / p.jours * J : null;
      var e = etatDe(it.valeur, it.limite, it.projection); it.etat = e[0]; it.mot = e[1];
      if (it.etat === 'orange') { var jr = Math.ceil(it.limite / (p.valeur / p.jours)); if (jr <= J) it.dateDepassement = jr + ' ' + lib; }
      it.qteLimite = it.prix ? it.limite / it.prix : null;
      return it;
    });
    var ordre = { rouge: 0, orange: 1, jaune: 2, vert: 3, vide: 4 };
    items.sort(function (a, b) { return ordre[a.etat] - ordre[b.etat] || (b.pct || 0) - (a.pct || 0); });
    var zones = {}; (C ? C.produits : []).forEach(function (p) { if (p.statut !== 'ok') return; var z = zones[p.zone] = zones[p.zone] || { eur: 0, kg: 0, L: 0 }; if (p.valeur != null) z.eur += p.valeur; if (p.unite === 'kg' || p.unite === 'L') z[p.unite] += p.qte; if (p.unite === 'g') z.kg += p.qte / 1000; });
    return { conso: C, libMois: lib, mois: moisCourant(), demo: !!(C && C.demo) || demo(), items: pro() ? items : [], zones: zones, verrou: !pro() };
  }
  function phrase(it, lib) {
    if (it.etat === 'rouge') return it.nom + ' : ' + eur(it.valeur) + ' consommés pour ' + eur(it.limite) + ' fixés en ' + lib + ' (' + ZONE[it.zone].toLowerCase() + ', ' + qteTxt(it.qte, it.unite) + '), dépassement de ' + eur(it.valeur - it.limite) + '.';
    if (it.etat === 'orange') return it.nom + ' : ' + eur(it.valeur) + ' sur ' + eur(it.limite) + ' (' + ZONE[it.zone].toLowerCase() + ') ; au rythme actuel ≈ ' + eur(it.projection) + ' sur le mois' + (it.dateDepassement ? ', limite atteinte vers le ' + it.dateDepassement : '') + '.';
    if (it.valeur == null) return it.nom + ' : ' + it.mot.toLowerCase() + ' dans l’Inventaire (début et cours de mois).';
    return it.nom + ' : ' + eur(it.valeur) + ' sur ' + eur(it.limite) + ' (' + Math.round(it.pct * 100) + ' %).';
  }

  /* ---------- Écran « Consommation » ---------- */
  /* L'encadré générique « Conclusion » posé sur toutes les vues n'a rien à dire ici : l'écran a ses propres sections. */
  var CSS = '#v-conso>.chr-view-primary{display:none!important}#v-conso{--lc-t:#0f172a;--lc-m:#475569;--lc-b:rgba(148,163,184,.38);--lc-card:#fff}html.vd-workspace-dark #v-conso{--lc-t:#f1f5f9;--lc-m:#a8b3c4;--lc-b:rgba(148,163,184,.28);--lc-card:rgba(255,255,255,.03)}' +
    '.lc-pro{font-size:12px;font-weight:800;letter-spacing:.06em;padding:3px 9px;border-radius:999px;background:linear-gradient(135deg,#b45309,#92400e);color:#fff;vertical-align:4px;margin-left:6px}' +
    '#v-conso .lc-sec{border:1px solid var(--lc-b);border-radius:18px;padding:16px;margin:0 0 14px;background:var(--lc-card)}#v-conso .lc-sec h2{font-size:17px;margin:0 0 4px;color:var(--lc-t)}' +
    '#v-conso .lc-m{font-size:13.5px;color:var(--lc-m);line-height:1.45;margin:0 0 10px}' +
    '#v-conso .lc-zones{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}#v-conso .lc-z{border:1px solid var(--lc-b);border-radius:14px;padding:10px 12px}' +
    '#v-conso .lc-z b{display:block;font-size:22px;font-weight:900;color:var(--lc-t);font-variant-numeric:tabular-nums}#v-conso .lc-z span{font-size:13px;color:var(--lc-m)}' +
    '#v-conso .lc-l{border:1px solid var(--lc-b);border-left:4px solid var(--lc-c);border-radius:14px;padding:12px;margin:0 0 10px}' +
    '#v-conso .lc-h{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}#v-conso .lc-n{font-weight:800;font-size:16px;color:var(--lc-t);min-width:0;overflow-wrap:anywhere}#v-conso .lc-n small{font-weight:600;color:var(--lc-m);font-size:13px}' +
    '#v-conso .lc-chip{flex:0 0 auto;font-size:12px;font-weight:800;padding:4px 9px;border-radius:999px;color:var(--lc-c);background:color-mix(in srgb,var(--lc-c) 14%,transparent);white-space:nowrap}' +
    '#v-conso .lc-v{margin:6px 0 2px;font-size:15px;color:var(--lc-t)}#v-conso .lc-v b{font-size:20px;font-weight:900;font-variant-numeric:tabular-nums}' +
    '#v-conso .lc-bar{position:relative;height:10px;border-radius:999px;background:rgba(148,163,184,.22);overflow:hidden;margin:8px 0 6px}#v-conso .lc-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:var(--lc-c)}' +
    '#v-conso .lc-s{font-size:13px;color:var(--lc-m);line-height:1.4;margin:0}#v-conso .lc-a{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}' +
    '#v-conso button.lc-b{min-height:44px;padding:9px 16px;border-radius:12px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;border:1px solid var(--lc-b);background:transparent;color:var(--lc-t)}' +
    '#v-conso button.lc-p{background:#15803d;border-color:#15803d;color:#fff}#v-conso .lc-f{display:grid;gap:10px;border:1px dashed var(--lc-b);border-radius:14px;padding:12px;margin:0 0 10px}' +
    '#v-conso .lc-f label{font-size:13px;font-weight:700;color:var(--lc-m);display:grid;gap:4px}#v-conso .lc-f select,#v-conso .lc-f input{min-height:44px;font:inherit;font-size:16px;border-radius:10px;border:1px solid var(--lc-b);padding:8px 10px;background:transparent;color:var(--lc-t);width:100%;box-sizing:border-box}' +
    '#v-conso .lc-eq{font-size:13px;color:var(--lc-m);min-height:18px;margin:0}' +
    '#v-conso .lc-top{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px 10px;align-items:center}#v-conso .lc-top .n{font-weight:700;color:var(--lc-t);overflow-wrap:anywhere;font-size:14.5px}#v-conso .lc-top .n small{display:block;font-weight:500;color:var(--lc-m);font-size:12.5px}' +
    '#v-conso .lc-top .e{font-weight:800;font-variant-numeric:tabular-nums;color:var(--lc-t);text-align:right;white-space:nowrap}#v-conso .lc-top button{min-height:44px;min-width:44px;padding:6px 12px}';
  var ouvert = null, presel = null;
  function css() { if (!doc.getElementById('vdConsoCss')) { var s = doc.createElement('style'); s.id = 'vdConsoCss'; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s); } }
  function ligne(it, lib) {
    var h = '<div class="lc-l" style="--lc-c:' + (COUL[it.etat] || COUL.vide) + '"><div class="lc-h"><span class="lc-n">' + esc(it.nom) + ' <small>· ' + ZONE[it.zone] + '</small></span><span class="lc-chip">' + esc(it.mot) + '</span></div>';
    if (it.valeur != null) {
      h += '<p class="lc-v"><b>' + eur(it.valeur) + '</b> sur ' + eur(it.limite) + ' · <b>' + qteTxt(it.qte, it.unite) + '</b>' + (it.qteLimite ? ' sur ≈ ' + qteTxt(it.qteLimite, it.unite) : '') + '</p>';
      h += '<div class="lc-bar" role="img" aria-label="' + Math.round(it.pct * 100) + ' % de la limite"><i style="width:' + Math.min(100, it.pct * 100).toFixed(1) + '%"></i></div>';
      var s = Math.round(it.pct * 100) + ' % de la limite du mois';
      if (it.etat === 'rouge') s += ' · dépassement de ' + eur(it.valeur - it.limite) + (it.prix ? ' (≈ ' + qteTxt((it.valeur - it.limite) / it.prix, it.unite) + ')' : '');
      else if (it.projection != null) s += ' · au rythme actuel : ≈ ' + eur(it.projection) + ' sur le mois' + (it.dateDepassement ? ', limite atteinte vers le ' + it.dateDepassement : '');
      h += '<p class="lc-s">' + s + '</p>';
    } else h += '<p class="lc-s">' + esc(it.mot) + ' : comptez ce produit dans l’Inventaire en début et en cours de mois pour mesurer sa consommation réelle.</p>';
    return h + '<div class="lc-a"><button type="button" class="lc-b" data-lc="modifier" data-id="' + esc(it.id) + '">Modifier</button><button type="button" class="lc-b" data-lc="retirer" data-id="' + esc(it.id) + '">Retirer</button></div></div>';
  }
  function formulaire(E, lim) {
    var opts = produitsConnus(E).filter(function (p) { return p.prix > 0; }).sort(function (a, b) { return a.zone === b.zone ? a.nom.localeCompare(b.nom, 'fr') : a.zone < b.zone ? 1 : -1; });
    var choisi = lim ? (lim.productId || lim.nom) : presel;
    if (!opts.length && !lim) return '<div class="lc-f"><p class="lc-m">Comptez et enregistrez l’Inventaire une première fois : vos produits apparaîtront ici.</p><div class="lc-a"><button type="button" class="lc-b" data-lc="annuler">Fermer</button></div></div>';
    var h = '<form class="lc-f" data-lc-form="' + esc(lim ? lim.id : '') + '"><label>Produit<select name="p" required>' + (choisi ? '' : '<option value="">Choisir un produit…</option>'), zc = '';
    opts.forEach(function (o) { if (o.zone !== zc) { if (zc) h += '</optgroup>'; h += '<optgroup label="' + ZONE[o.zone] + '">'; zc = o.zone; } h += '<option value="' + esc(o.id) + '" data-pr="' + o.prix + '" data-u="' + o.unite + '"' + (choisi === o.id || (lim && lim.nom === o.nom) ? ' selected' : '') + '>' + esc(o.nom) + ' — ' + nb(o.prix) + ' €/' + o.unite + '</option>'; });
    h += (zc ? '</optgroup>' : '') + '</select></label><label>Limite par mois (€ HT)<input name="e" type="number" inputmode="decimal" min="1" step="1" required value="' + (lim ? Math.round(lim.eur) : '') + '"></label><p class="lc-eq"></p>';
    return h + '<div class="lc-a"><button type="submit" class="lc-b lc-p">' + (lim ? 'Enregistrer' : 'Fixer la limite') + '</button><button type="button" class="lc-b" data-lc="annuler">Annuler</button></div></form>';
  }
  function dessiner() {
    var body = doc.getElementById('consoBody'); if (!body) return; css();
    var E = etat(), C = E.conso, lib = E.libMois, h = '';
    if (E.verrou) { ouvert = null; body.innerHTML = '<div class="lc-sec" data-vo-lock="conso"><h2>Verdict Pro</h2><p class="lc-m">Limites par produit, consommation réelle en euros et en kg ou litres, alertes avant le dépassement : avec Pro. Le comptage reste gratuit dans l’Inventaire.</p><div class="lc-a"><button type="button" class="lc-b lc-p" data-lc-offres="1">Voir les offres</button></div></div>'; return; }
    h += '<div class="lc-sec"><h2>Consommation réelle · ' + esc(lib) + (E.demo ? ' · démonstration' : '') + '</h2>';
    if (!C) h += '<p class="lc-m">Pas encore de comptage ce mois-ci. Comptez votre stock dans l’Inventaire en début de mois puis en cours de mois : Verdict calcule alors la consommation réelle de chaque produit (stock de départ + livraisons − stock compté), en euros et en kg ou litres.</p>';
    else {
      h += '<p class="lc-m">' + (C.attente ? esc(C.attente) + '.' : 'Du ' + dateFr(C.debut) + ' au ' + dateFr(C.fin || C.debut) + ' : stock du début + livraisons reçues − stock de fin, d’après vos comptages d’Inventaire.') + '</p><div class="lc-zones">';
      Object.keys(E.zones).sort().forEach(function (z) { var Z = E.zones[z]; h += '<div class="lc-z"><span>' + ZONE[z] + '</span><b>' + eur(Z.eur) + '</b><span>' + [Z.kg ? nb(Z.kg) + ' kg' : '', Z.L ? nb(Z.L) + ' L' : ''].filter(Boolean).join(' · ') + '</span></div>'; });
      h += '</div>';
    }
    h += '</div><div class="lc-sec"><h2>Vos limites</h2><p class="lc-m">Vous seul fixez les limites. Verdict prévient dans l’Accueil et les Alertes dès qu’un produit approche, va dépasser ou dépasse.</p>';
    if (ouvert === 'nouveau') h += formulaire(E, null);
    E.items.forEach(function (it) { h += ouvert === it.id ? formulaire(E, limites().filter(function (l) { return l.id === it.id; })[0]) : ligne(it, lib); });
    if (!E.items.length && ouvert !== 'nouveau') h += '<p class="lc-m">Aucune limite pour l’instant. Exemple : tomates séchées à 3 000 € par mois.</p>';
    if (ouvert !== 'nouveau') h += '<div class="lc-a"><button type="button" class="lc-b lc-p" data-lc="nouveau">+ Fixer une limite</button></div>';
    h += '</div>';
    if (C) {
      var top = C.produits.filter(function (p) { return p.statut === 'ok' && p.valeur > 0; }).sort(function (a, b) { return b.valeur - a.valeur; }).slice(0, 8);
      if (top.length) {
        var lim = {}; limites().forEach(function (l) { lim[l.productId] = 1; lim[l.nom] = 1; });
        h += '<div class="lc-sec"><h2>Plus grosses consommations du mois</h2><p class="lc-m">Les produits qui pèsent le plus : un bon point de départ pour fixer une limite.</p><div class="lc-top">';
        top.forEach(function (p) { h += '<span class="n">' + esc(p.nom) + '<small>' + ZONE[p.zone] + ' · ' + qteTxt(p.qte, p.unite) + '</small></span><span class="e">' + eur(p.valeur) + '</span>' + (lim[p.id] || lim[p.nom] ? '<span class="lc-m" style="margin:0;font-size:12.5px">Limité</span>' : '<button type="button" class="lc-b" data-lc="limiter" data-id="' + esc(p.id) + '">Limiter</button>'); });
        h += '</div></div>';
      }
    }
    body.innerHTML = h;
  }
  function majEquivalent(f) {
    var s = f.querySelector('select'), i = f.querySelector('input'), o = s && s.options[s.selectedIndex], p = f.querySelector('.lc-eq');
    if (!o || !o.value || !(+i.value > 0)) { p.textContent = ''; return; }
    var pr = +o.getAttribute('data-pr'), u = o.getAttribute('data-u'); p.textContent = pr > 0 ? '≈ ' + qteTxt(+i.value / pr, u) + ' par mois à ' + nb(pr) + ' €/' + u : '';
  }
  doc.addEventListener('input', function (e) { var f = e.target.closest && e.target.closest('#v-conso form'); if (f) majEquivalent(f); });
  doc.addEventListener('change', function (e) { var f = e.target.closest && e.target.closest('#v-conso form'); if (f) majEquivalent(f); });
  doc.addEventListener('click', function (e) {
    var o = e.target.closest && e.target.closest('#v-conso [data-lc-offres]'); if (o) { try { w.go('abo'); w.scrollTo(0, 0); } catch (er) {} return; }
    var b = e.target.closest && e.target.closest('#v-conso [data-lc]'); if (!b) return;
    if (!pro()) { ouvert = null; dessiner(); return; }
    var a = b.getAttribute('data-lc'), id = b.getAttribute('data-id');
    presel = null;
    if (a === 'nouveau') ouvert = 'nouveau'; else if (a === 'annuler') ouvert = null; else if (a === 'modifier') ouvert = id;
    else if (a === 'limiter') { ouvert = 'nouveau'; presel = id; }
    else if (a === 'retirer') { var L = limites(), k = L.findIndex(function (l) { return l.id === id; }); if (k >= 0) { L.splice(k, 1); enregistrer(); } ouvert = null; }
    dessiner(); try { tour(); } catch (er) {}
    var f = doc.querySelector('#v-conso form'); if (f) { f.scrollIntoView({ block: 'center', behavior: 'smooth' }); var champ = presel ? f.querySelector('input') : f.querySelector('select'); if (champ) champ.focus(); majEquivalent(f); }
  });
  doc.addEventListener('submit', function (e) {
    var f = e.target.closest && e.target.closest('#v-conso form'); if (!f) return; e.preventDefault();
    if (!pro()) { ouvert = null; dessiner(); return; }
    var s = f.querySelector('select'), o = s.options[s.selectedIndex], v = Math.round(+f.querySelector('input').value); if (!o || !o.value || !(v > 0)) return;
    var p = produitsConnus(etat()).filter(function (x) { return x.id === o.value; })[0] || {};
    var L = limites(), id = f.getAttribute('data-lc-form'), ex = id ? L.filter(function (l) { return l.id === id; })[0] : L.filter(function (l) { return l.productId === o.value || l.nom === p.nom; })[0];
    var rec = { productId: o.value, nom: p.nom, zone: p.zone, unite: p.unite, prix: p.prix, eur: v, updatedAt: new Date().toISOString() };
    if (ex) Object.keys(rec).forEach(function (k) { ex[k] = rec[k]; }); else { rec.id = 'lim-' + Date.now().toString(36); rec.createdAt = rec.updatedAt; L.push(rec); }
    enregistrer(); ouvert = null; dessiner(); try { tour(); } catch (er) {}
  });

  /* Section de vue, entrée dans Plus › Piloter, rendu à l'ouverture. */
  function vue() {
    if (!doc.getElementById('v-conso')) {
      var ref = doc.getElementById('v-alertes'); if (!ref) return;
      var s = doc.createElement('section'); s.className = 'view'; s.id = 'v-conso';
      s.innerHTML = '<h1>Consommation<span class="lc-pro">PRO</span></h1><p class="sub">Vos limites par produit et votre consommation réelle, bar et cuisine.</p><div id="consoBody"></div>';
      ref.parentNode.insertBefore(s, ref.nextSibling); css();
    }
    /* C305 (V15-117) : la ligne est rendue par plus-premium-a21.js avec les autres ; ceci ne sert plus que de secours. */
    var plus = doc.querySelector('#v-plus .vp-group .vp-list');
    if (plus && !doc.querySelector('#v-plus [data-vp="conso"]')) {
      var r = doc.createElement('button'); r.type = 'button'; r.className = 'vp-row'; r.setAttribute('data-vp', 'conso');
      r.innerHTML = '<span class="vp-tile"><svg class="vp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg></span><span class="vp-txt"><b>Consommation <span class="lc-pro" style="font-size:10.5px;padding:2px 7px;vertical-align:2px">PRO</span></b><small>Limites par produit, kg et euros, bar et cuisine</small></span>';
      r.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); try { w.go('conso'); } catch (er) {} }, true);
      plus.appendChild(r); css();
    }
  }
  function brancher() {
    if (typeof w.go === 'function' && !w.go.__lc) {
      var g0 = w.go, g = function (v) { if (v === 'conso') vue(); var r = g0.apply(this, arguments); if (v === 'conso') { ouvert = null; setTimeout(dessiner, 30); } if (v === 'plus') [60, 400, 1200].forEach(function (t) { setTimeout(vue, t); }); return r; };
      for (var k in g0) { try { g[k] = g0[k]; } catch (e) {} } g.__lc = true; w.go = g;
    }
    if (typeof w.drawAlertes === 'function' && !w.drawAlertes.__lc) { var d0 = w.drawAlertes; w.drawAlertes = function () { var r = d0.apply(this, arguments); try { alertes(etat()); } catch (e) {} return r; }; w.drawAlertes.__lc = true; }
    if (typeof w.verdictSignaux === 'function' && !w.verdictSignaux.__lc) {
      var s0 = w.verdictSignaux; w.verdictSignaux = function () {
        var out = s0.apply(this, arguments) || [];
        try { var E = etat(), P = typeof w.ntfPrefs === 'function' ? w.ntfPrefs() : { risque: true }; if (P.risque) E.items.forEach(function (it) { if (it.etat === 'rouge') out.push({ cat: 'risque', cle: 'limite:' + (it.productId || it.nom) + ':' + E.mois, txt: 'Limite dépassée : ' + it.nom + ' — ' + eur(it.valeur) + ' consommés pour ' + eur(it.limite) + ' en ' + E.libMois + '.' }); }); } catch (e) {}
        return out;
      }; w.verdictSignaux.__lc = true;
    }
  }

  /* ---------- Accueil ---------- */
  function accueil(E) {
    var f = doc.querySelector('iframe.p41-ecran'), d = null; try { d = f && f.contentDocument; } catch (e) {}
    var col = d && (d.querySelector('#vx40-jour .vx40-b') || d.querySelector('#vx40-jour .vx40-s')); if (!col) return; /* C164 : avec les alertes, sous « Vos journées » et le détail du jour */
    var vieux = d.getElementById('modLimites'), alerte = E.items.filter(function (it) { return it.etat === 'rouge' || it.etat === 'orange'; });
    if (!alerte.length) { if (vieux) vieux.remove(); return; }
    var pire = alerte[0], sig = JSON.stringify(alerte.map(function (it) { return [it.id, it.etat, Math.round(it.valeur), it.limite]; }));
    if (vieux && vieux.__sig === sig) return;
    var a = d.createElement('article'); a.className = 'mod'; a.id = 'modLimites'; a.setAttribute('data-etat', pire.etat); a.setAttribute('aria-label', 'Limite de consommation');
    var sous = phrase(pire, E.libMois);
    if (alerte.length > 1) sous += ' Aussi : ' + alerte.slice(1, 3).map(function (it) { return it.nom + ' (' + (it.etat === 'rouge' ? 'limite dépassée' : 'dépassement prévu') + ')'; }).join(', ') + (alerte.length > 3 ? '…' : '') + '.';
    a.innerHTML = '<p class="kicker">Limite de consommation · ' + esc(E.libMois) + (E.demo ? ' · démonstration' : '') + '</p><p class="titre">' + esc(pire.nom + (pire.etat === 'rouge' ? ' : limite dépassée' : ' : dépassement prévu')) + '</p><p class="sous">' + esc(sous) + '</p>' +
      '<div role="img" aria-label="' + Math.round(pire.pct * 100) + ' % de la limite" style="height:10px;border-radius:999px;background:rgba(148,163,184,.22);overflow:hidden;margin:4px 0 14px"><i style="display:block;height:100%;width:' + Math.min(100, pire.pct * 100).toFixed(1) + '%;background:' + COUL[pire.etat] + ';border-radius:999px"></i></div>' +
      '<div class="actions"><button class="btn prim bloc" type="button" data-lc-voir="1">Voir mes consommations</button></div>';
    if (!d.__lcClic) { d.__lcClic = true; d.addEventListener('click', function (ev) { if (ev.target.closest && ev.target.closest('[data-lc-voir]')) { ev.preventDefault(); ev.stopPropagation(); try { w.go('conso'); w.scrollTo(0, 0); } catch (er) {} } }, true); }
    a.__sig = sig; if (vieux) vieux.replaceWith(a); else col.insertBefore(a, col.firstChild);
  }

  /* ---------- Alertes ---------- */
  function alertes(E) {
    var el = doc.getElementById('alertesBody'); if (!el) return;
    var vieux = doc.getElementById('vdLimitesAlertes'); if (vieux) vieux.remove();
    if (!E.items.length) return;
    var h = '<div id="vdLimitesAlertes"><h3 style="margin:16px 0 8px;font-size:15px">Limites de consommation · ' + esc(E.libMois) + (E.demo ? ' · démonstration' : '') + '</h3>';
    E.items.forEach(function (it) {
      var c = COUL[it.etat] || COUL.vide;
      h += '<div class="item" style="border-left-color:' + c + '"><div class="l1"><div style="flex:1;min-width:0"><div class="nm">' + esc(it.nom) + ' · ' + ZONE[it.zone].toLowerCase() + ' — ' + esc(it.mot) + '</div><div class="u">' + esc(phrase(it, E.libMois)) + '</div></div><div class="v" style="color:' + c + ';white-space:nowrap">' + (it.valeur != null ? Math.round(it.pct * 100) + ' %' : '—') + '</div></div></div>';
    });
    h += '<button type="button" class="btn sec" style="margin:4px 0 12px" data-lc-gerer="1">Gérer mes limites de consommation</button></div>';
    var n = doc.createElement('div'); n.innerHTML = h;
    var k = el.querySelector('.kpis'); if (k && k.nextSibling) el.insertBefore(n.firstChild, k.nextSibling); else el.appendChild(n.firstChild);
  }
  doc.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-lc-gerer]')) { try { w.go('conso'); w.scrollTo(0, 0); } catch (er) {} } });
  function tour() {
    brancher(); vue(); var E = etat();
    try { accueil(E); } catch (e) {}
    var v = doc.getElementById('v-alertes'); if (v && v.classList.contains('on') && !doc.getElementById('vdLimitesAlertes')) try { alertes(E); } catch (e) {}
  }
  setInterval(tour, 3000); setTimeout(tour, 1500);
  w.VerdictLimitesPilotage = { etat: etat, conso: conso, tour: tour, dessiner: dessiner };
})();
