/* C152 — Carte intelligente (Carte › 4ᵉ onglet, Pro).
   Demande de Steven (18/10) : « comme Finary : il te dit où tu seras ; je veux cette magie pour la carte ; analyse ultra
   robuste sur le type d'établissement, le lieu, les habitants, la haute saison, les touristes ; adapter le nombre de plats
   à sa capacité ; demander la fréquentation, pondérée à l'année précédente ; des cartes énormes pour rien, du stock, de
   l'argent investi ; la meilleure carte intelligente et purement rentable, réfléchie — surtout pas "on garde ce qui gagne
   et basta" : tout prendre en compte ».
   Ce que fait l'écran (aucune modification de la carte sans l'accord du patron) :
   1. Profil de l'établissement (type, habitants, tourisme, places, couverts, services) — exigé avant l'analyse ; la carte
      doit aussi être remplie (6 plats complets au minimum).
   2. Classement de chaque plat dans sa catégorie (Kasavana-Smith : popularité ≥ 70 % de la part moyenne, marge en euros ≥
      marge moyenne pondérée) : Étoile (vert), Cheval de labour (jaune), Énigme (orange), Poids mort (rouge) — chacun avec
      son action et son effet en euros par mois.
   3. Nombre de plats visé par catégorie selon le type (étude Bournemouth 2013, référentiels CHR), la capacité, la rotation,
      le nombre d'habitants et la saison touristique.
   4. Équilibre des prix (Omnès : ouverture de gamme ≤ 2,5, ≤ 3 en gastronomique ; zone médiane ≥ zones basse + haute) et
      place du végétarien (au moins un plat par catégorie salée).
   5. Argent investi dans le stock : ingrédients qui ne servent qu'à un plat peu vendu (≈ une semaine de stock, repère 5 à 7
      jours pour le frais).
   6. La « magie » : marge supplémentaire projetée sur 12 mois et 3 ans, mois par mois selon la saison de l'établissement
      (historique pondéré : année précédente 60 %, celle d'avant 40 %), avec un curseur « part des conseils appliqués ».
   Hypothèses prudentes et affichées : hausse de prix ≤ 8 % avec 3 % de ventes en moins (C208 : celles du plan de prix, comme Décisions et Simuler) ; plat retiré
   : 70 % de ses ventes reportées sur les autres plats de la catégorie ; plat mis en avant : 10 % de ventes déplacées. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdCarteIntelligente) return; w.__vdCarteIntelligente = true;
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var MC = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  /* C218 : espace insécable visible entre les milliers (l'espace fine disparaissait dans les gros chiffres : « +16473 € »). */
  function eur(v) { return Math.round(Number(v) || 0).toLocaleString('fr-FR').replace(/[\u202f\s]/g, '\u00a0') + '\u00a0€'; }
  function eur2(v) { return (Math.round((Number(v) || 0) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
  function signe(v) { return (v >= 0 ? '+' : '−') + eur(Math.abs(v)); }
  function pct(v) { return Math.round(v * 100) + ' %'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pro() { try { return demo() || typeof w.verdictNiveau !== 'function' || w.verdictNiveau() === 'pro'; } catch (e) { return true; } }
  function demo() { return /[?&](demo=1|presentation=)/.test(location.search + (self.__vdq || '')); }
  function DB() { try { return w.DB && Array.isArray(w.DB.plats) ? w.DB : null; } catch (e) { return null; } }
  function moisCourant() { try { return Number(String(w.verdictOperationalClock().key).slice(5, 7)) || (new Date().getMonth() + 1); } catch (e) { return new Date().getMonth() + 1; } }

  /* ---------- Profil de l'établissement ---------- */
  var TYPES = { brasserie: 'Brasserie', traditionnel: 'Restaurant traditionnel', bistrot: 'Bistrot / ardoise', gastro: 'Gastronomique', pizzeria: 'Pizzeria', rapide: 'Restauration rapide', bar: 'Bar / café' };
  var HAB = { village: 'Moins de 2 000 habitants', bourg: '2 000 à 20 000 habitants', ville: '20 000 à 100 000 habitants', grande: 'Plus de 100 000 habitants' };
  var TOUR = { non: 'Pas de saison touristique', ete: 'Haute saison l’été (juin à septembre)', hiver: 'Haute saison l’hiver (décembre à mars)', annee: 'Touristique toute l’année' };
  var SERV = { deux: 'Midi et soir', midi: 'Midi seulement', soir: 'Soir seulement' };
  /* C218 (W77) : sans type précisé, aucun type n'est choisi à la place du patron (avant : « Brasserie » par défaut). */
  function familleDe(t) { t = String(t || '').toLowerCase(); if (!t.trim()) return ''; return /gastro|étoil|etoil|fine/.test(t) ? 'gastro' : /pizz/.test(t) ? 'pizzeria' : /snack|fast|burger|kebab|sandwich|rapide|boulang|dark|livraison/.test(t) ? 'rapide' : /bistro|ardoise|bouchon/.test(t) ? 'bistrot' : /\bbar\b|café|cafe|pub|tapas/.test(t) ? 'bar' : /tradition|italien|asiat|traiteur|bistro/.test(t) ? 'traditionnel' : /coffee|truck/.test(t) ? 'rapide' : 'brasserie'; }
  function profilBrut() {
    var D = DB(); if (!D) return null;
    if (!D.carteProfil || typeof D.carteProfil !== 'object') {
      var cmd = Math.round(Number(D.in && D.in.cmdj)) || null;
      /* C157 : chaque modèle de démonstration a son propre profil d'exemple (avant : 80 places et « été » pour tous). */
      var EX = { Kebab: ['rapide', 'ville', 'non', 30], Pizzeria: ['pizzeria', 'bourg', 'non', 50], Traditionnel: ['traditionnel', 'bourg', 'non', 60], Brasserie: ['brasserie', 'ville', 'ete', 80], Gastro: ['gastro', 'grande', 'annee', 35], Palace: ['gastro', 'grande', 'annee', 60], Boulangerie: ['rapide', 'bourg', 'non', 15], DarkKitchen: ['rapide', 'grande', 'non', 10], SaisonnierMer: ['traditionnel', 'village', 'ete', 70], BarRestaurant: ['bar', 'bourg', 'non', 45], Burger: ['rapide', 'ville', 'non', 40], Italien: ['traditionnel', 'ville', 'non', 60], Asiatique: ['traditionnel', 'ville', 'non', 50], BarTapas: ['bar', 'ville', 'non', 50], CoffeeShop: ['rapide', 'ville', 'non', 25], FoodTruck: ['rapide', 'ville', 'ete', 10], Traiteur: ['traditionnel', 'bourg', 'non', 20] }[D.modele];
      D.carteProfil = demo() ? { type: EX ? EX[0] : familleDe(D.etabType), habitants: EX ? EX[1] : 'ville', tourisme: EX ? EX[2] : 'ete', places: EX ? EX[3] : 80, couverts: cmd || 110, services: 'deux', demo: true } : { type: familleDe(D.etabType), habitants: '', tourisme: '', places: null, couverts: cmd, services: 'deux' };
    }
    return D.carteProfil;
  }
  /* C218 (W77) : le profil affiché complète le profil enregistré avec ce que la caisse donne (couverts, saison), sans rien
     écrire à l'affichage (0 changement au repos) ; il n'est enregistré que quand le patron lance l'analyse. Un ancien
     profil créé avec « Brasserie » par défaut, alors que le type n'est pas précisé, repose la question. */
  function profil() {
    var D = DB(), B = profilBrut(); if (!B || B.demo) return B;
    var P = {}; for (var k in B) P[k] = B[k];
    if (!P.typeChoisi && !profilComplet(P) && !String(D.etabType || '').trim() && P.type === 'brasserie') P.type = '';
    if (!(Number(P.couverts) > 0)) { var cv = couvertsCaisse(D); if (cv) { P.couverts = cv; P.couvertsCaisse = true; } }
    if (!P.tourisme) { var sc = saisonCaisse(D); if (sc) { P.tourisme = sc.cle; P.saisonCaisse = sc.texte; } }
    return P;
  }
  /* Couverts par jour : tickets de la caisse sur les jours ouverts (sinon le chiffre de la saisie). */
  function couvertsCaisse(D) {
    var H = (D.histJour || []).filter(function (x) { return x && Number(x.tkJ) > 0; }), t = 0;
    if (H.length >= 20) { H.forEach(function (x) { t += Number(x.tkJ); }); return Math.round(t / H.length); }
    var c = Math.round(Number(D.in && D.in.cmdj)); return c > 0 ? c : null;
  }
  /* C230 (X18, avec L3) : des journées de caisse sans aucun ticket (export « ventes par article » seul) : on dit quoi déposer. */
  function sansTickets(D) { var H = D.histJour || []; return H.length > 0 && !H.some(function (x) { return x && Number(x.tkJ) > 0; }) && !(Number(D.in && D.in.cmdj) > 0); }
  /* Saison lue dans la caisse : mois forts et creux d'une année complète. */
  function saisonCaisse(D) {
    var S = saison(D); if (!S.annees.length) return null;
    var c = S.coef, moy = function (L) { return L.reduce(function (a, m) { return a + c[m - 1]; }, 0) / L.length; };
    var ete = moy([6, 7, 8, 9]), hiver = moy([12, 1, 2, 3]), max = Math.max.apply(null, c), min = Math.min.apply(null, c);
    var forts = c.map(function (v, i) { return v > 1.12 ? MOIS[i] : null; }).filter(Boolean);
    var src = ' (' + S.annees.join(' et ') + ')';
    if (max < 1.12 && min > 0.88) return { cle: 'non', texte: 'ventes régulières toute l’année' + src };
    if (ete >= hiver + 0.1) return { cle: 'ete', texte: 'mois forts : ' + forts.join(', ') + src };
    if (hiver >= ete + 0.1) return { cle: 'hiver', texte: 'mois forts : ' + forts.join(', ') + src };
    return null;
  }
  function profilComplet(P) { return !!(P && TYPES[P.type] && HAB[P.habitants] && TOUR[P.tourisme] && Number(P.places) > 0 && Number(P.couverts) > 0 && SERV[P.services]); }
  function hauteSaison(P, m) { return P.tourisme === 'annee' || (P.tourisme === 'ete' && m >= 6 && m <= 9) || (P.tourisme === 'hiver' && (m === 12 || m <= 3)); }

  /* ---------- Nombre de plats visé ---------- */
  var CIBLES = { brasserie: { e: [6, 8], p: [8, 10], d: [6, 7] }, traditionnel: { e: [5, 7], p: [6, 9], d: [5, 6] }, bistrot: { e: [3, 5], p: [3, 6], d: [3, 4] }, gastro: { e: [3, 5], p: [3, 5], d: [3, 4] }, pizzeria: { e: [4, 6], p: [8, 12], d: [4, 6] }, rapide: { e: [3, 5], p: [5, 7], d: [3, 5] }, bar: { e: [3, 6], p: [3, 5], d: [2, 4] } };
  function role(cat) { var c = String(cat || '').toLowerCase(); return /boisson|bière|biere|vin|cocktail|soft|café|cafe|alcool/.test(c) ? '' : /entr|starter|planche|tapas|accomp|frit|salade/.test(c) ? 'e' : /dessert|sucr|douceur|viennoiser|pâtisser|patisser/.test(c) ? 'd' : /plat|pizza|burger|principal|viande|poisson|pâte|pate|sandwich|tacos|menu|bowl|assiette|kebab|wrap|galette|crêpe|crepe|fruits de mer|pain/.test(c) ? 'p' : ''; }
  /* C157 : les cartes de restauration rapide ont beaucoup de petites catégories (Burgers, Tacos, Bowls…) : en dessous de
     3 plats, une catégorie est regroupée avec celles du même rôle pour pouvoir être analysée. */
  function groupe(cat, n) { if (n >= 3) return cat; var c = String(cat || '').toLowerCase(), r = role(cat); return /boisson|bière|biere|vin|cocktail|soft|café|cafe|alcool/.test(c) ? 'Boissons' : r === 'd' ? 'Desserts' : r === 'e' ? 'Entrées et accompagnements' : r === 'p' ? 'Plats' : cat; }
  function cible(P, r, m) {
    var R = (CIBLES[P.type] || CIBLES.brasserie)[r]; if (!R) return null;
    var places = Number(P.places) || 0, pos = places < 30 ? 0 : places > 80 ? 1 : (places - 30) / 50, raisons = [];
    raisons.push((places < 30 ? 'petite salle' : places > 80 ? 'grande salle' : 'salle moyenne') + ' (' + places + ' places)');
    var serv = P.services === 'deux' ? 2 : 1, rot = Number(P.couverts) / Math.max(1, places * serv);
    if (rot > 1.5) { pos -= 0.25; raisons.push('rotation rapide (' + rot.toFixed(1).replace('.', ',') + ' couverts par place et par service) : carte plus courte, envoi plus rapide'); }
    if (P.habitants === 'village' && P.tourisme === 'non') { pos -= 0.25; raisons.push('petite commune hors tourisme : clientèle d’habitués, carte courte et renouvelée'); }
    pos = Math.max(0, Math.min(1, pos));
    var n = Math.round(R[0] + (R[1] - R[0]) * pos), min = R[0], max = R[1];
    if (P.tourisme !== 'non') { if (hauteSaison(P, m)) { n += 1; max += 1; raisons.push('haute saison touristique : un plat de plus, de passage et rapide'); } else { n = Math.max(R[0] - 1, n - 1); min = Math.max(2, R[0] - 1); raisons.push('hors saison : clientèle surtout locale, un plat de moins qu’en saison'); } }
    return { n: Math.max(min, Math.min(max, n)), min: min, max: max, raisons: raisons };
  }

  /* ---------- Classement et actions ---------- */
  var VIANDE = /bœuf|boeuf|veau|porc|poulet|canard|agneau|jambon|lard|bacon|saucisse|chorizo|entrecôte|entrecote|steak|haché|hache|volaille|dinde|lapin|foie|magret|confit|saumon|thon|cabillaud|poisson|moule|huître|huitre|crevette|gambas|anchois|truite|bar\b|dorade|lieu|coquille|crabe|homard|calamar|poulpe|fond de veau|bouillon de volaille|andouill|rillette|terrine|pâté|pate de|gélatine|gelatine/i;
  function lignes(p) { return (p.rec || []).filter(function (l) { return l && l[0]; }); }
  function coutLigne(l) { try { var r = w.coutLignesRecette([l]); return r && isFinite(r.st) ? r.st : null; } catch (e) { return null; } }
  function vegetarien(p) { var L = lignes(p); return L.length > 0 && !L.some(function (l) { return VIANDE.test(String(l[0])); }); }
  function analyse() {
    var GPR = prixDecisions(); /* C182 : prix conseillés de Décisions et Simuler */
    var D = DB(); if (!D || typeof w.platCalc !== 'function') return null;
    var P = profil(), m = moisCourant();
    var plats = D.plats.filter(function (p) { return !p.cpArchived; }).map(function (p) {
      var c = null; try { c = w.platCalc(p); } catch (e) {}
      var vol = Number(p.vol) || 0, ok = !!(c && c.recetteComplete && c.ht > 0 && isFinite(c.marge));
      /* C208 (V57) : la marge par plat est celle de Ma carte (contribution pondérée, commissions comprises) : 15,30 € partout.
         (V38) : un plat sous son objectif de marge n'est jamais dit « rapporte bien ». */
      var mg = ok ? (isFinite(c.contribPond) ? c.contribPond : c.marge) : null, sous = !!(ok && c.objPond > 0 && isFinite(c.contribPct) && c.contribPct < c.objPond);
      return { p: p, id: p.id, nom: p.nom, cat: p.cat || 'Autres', ttc: Number(p.ttc) || 0, ht: c ? c.ht : null, cout: c ? c.cout : null, marge: mg, vol: vol, ok: ok, sousObj: sous, veg: vegetarien(p) };
    });
    var complets = plats.filter(function (x) { return x.ok && x.vol > 0; });
    var R = { profil: P, profilOk: profilComplet(P), mois: m, plats: plats, complets: complets.length, pret: complets.length >= 6, cats: [], gainMois: 0, gainPrix: 0, prixPlats: 0, stockLibere: 0, alertes: [] };
    if (!R.pret || !R.profilOk) return R;
    /* Utilisation croisée des ingrédients (règle « un ingrédient doit servir au moins deux fois »). */
    var usage = {}; complets.forEach(function (x) { lignes(x.p).forEach(function (l) { var k = String(l[0]); (usage[k] = usage[k] || []).push(x.id); }); });
    var nCat = {}; complets.forEach(function (x) { nCat[x.cat] = (nCat[x.cat] || 0) + 1; });
    var parCat = {}, origines = {}; complets.forEach(function (x) { var g = groupe(x.cat, nCat[x.cat]); (parCat[g] = parCat[g] || []).push(x); (origines[g] = origines[g] || {})[x.cat] = 1; });
    Object.keys(parCat).forEach(function (cat) {
      if (parCat[cat].length < 3) { R.petites = (R.petites || []).concat(cat); return; }
      var L = parCat[cat], n = L.length, sv = L.reduce(function (t, x) { return t + x.vol; }, 0) || 1;
      var mMoy = L.reduce(function (t, x) { return t + x.marge * x.vol; }, 0) / sv, seuil = 0.7 / n, r = role(cat), ci = r ? cible(P, r, m) : null;
      L.forEach(function (x) {
        x.part = x.vol / sv; x.pop = x.part >= seuil; x.rent = x.marge >= mMoy;
        x.classe = x.pop && x.rent ? 'etoile' : x.pop ? 'cheval' : x.rent ? 'enigme' : 'mort';
        x.gain = 0;
        var pr = GPR[x.nom];
        if (pr && (x.classe === 'etoile' || x.classe === 'cheval')) {
          /* C208 (V39) : le gain d'un prix conseillé est celui du plan de prix (cartePlan : +8 % au plus, 3 % de ventes en moins), comme Décisions et Simuler */
          var hp = pr.apres / x.ttc - 1; x.prix = pr.apres;
          x.gain = Number(pr.contribMois) || 0; x.gainPrix = x.gain;
          x.action = (x.classe === 'etoile' ? 'Garder en tête de catégorie, et passer' : 'Passer') + ' de ' + eur2(x.ttc) + ' à ' + eur2(pr.apres) + ' (+' + Math.round(hp * 100) + ' %) : sa marge est sous votre objectif (même prix que Décisions et Simuler)';
        }
        else if (x.classe === 'etoile') { x.action = 'Garder et placer en tête de la catégorie'; }
        else if (x.classe === 'cheval' && Object.keys(GPR).length > 0) { x.action = 'Garder le prix : sa marge atteint votre objectif ; mettez plutôt en avant les plats qui rapportent plus'; }
        else if (x.classe === 'cheval') {
          var hausse = Math.min(0.08, Math.max(0.03, (mMoy - x.marge) / Math.max(1, x.ht)));
          var nouveau = Math.floor(x.ttc * (1 + hausse) * 10) / 10; if (nouveau <= x.ttc) nouveau = Math.round((x.ttc + 0.1) * 10) / 10; var h = nouveau / x.ttc - 1, nhT = x.ht * (1 + h); /* arrondi au dixième vers le bas : jamais plus de 8 % */
          x.prix = nouveau; x.gain = x.vol * (1 - 0.5 * h) * (x.marge + (nhT - x.ht)) - x.vol * x.marge;
          x.action = 'Passer de ' + eur2(x.ttc) + ' à ' + eur2(nouveau) + ' (+' + Math.round(h * 100) + ' %), ou réduire légèrement la portion';
        } else if (x.classe === 'enigme') { x.gainPrix = pr ? Number(pr.contribMois) || 0 : 0; if (pr) x.prix = pr.apres; x.gain = 0.10 * x.vol * (x.marge - mMoy) + x.gainPrix; x.action = 'Mettre en avant : suggestion du serveur, haut de catégorie, nom et description plus parlants' + (pr ? ' ; et passer de ' + eur2(x.ttc) + ' à ' + eur2(pr.apres) + ' (marge sous votre objectif, même prix que Décisions et Simuler)' : ''); }
        else {
          var autres = L.filter(function (y) { return y !== x; }), mAutres = autres.length ? autres.reduce(function (t, y) { return t + y.marge * y.vol; }, 0) / Math.max(1, autres.reduce(function (t, y) { return t + y.vol; }, 0)) : 0;
          var g = x.vol * (0.7 * mAutres - x.marge);
          if (g > 0 && (!ci || n - 1 >= ci.min)) { x.retirer = true; x.gain = g; x.action = 'Retirer : ses clients se reporteront sur les autres plats'; }
          else { x.action = ci && n - 1 < ci.min ? 'Remplacer par un plat plus rentable (la catégorie est déjà courte)' : 'Revoir la recette ou le prix avant de décider'; if (pr) { x.prix = pr.apres; x.gainPrix = Number(pr.contribMois) || 0; x.gain = x.gainPrix; x.action += ' ; en attendant, passer de ' + eur2(x.ttc) + ' à ' + eur2(pr.apres) + ' (marge sous votre objectif, même prix que Décisions et Simuler)'; } }
          /* Argent investi : ingrédients qui ne servent qu'à ce plat, ≈ une semaine de stock. */
          x.stock = 0; x.ingSeuls = [];
          lignes(x.p).forEach(function (l) { if ((usage[String(l[0])] || []).length === 1) { var cl = coutLigne(l); if (cl > 0) { x.stock += cl * x.vol * 7 / 30; x.ingSeuls.push(String(l[0])); } } });
          if (x.retirer) R.stockLibere += x.stock;
        }
        R.gainMois += Math.max(0, x.gain); if (x.gainPrix > 0) { R.gainPrix += x.gainPrix; R.prixPlats++; }
      });
      /* Équilibre des prix (Omnès). */
      var prix = L.map(function (x) { return x.ttc; }).filter(function (v) { return v > 0; }), pmin = Math.min.apply(null, prix), pmax = Math.max.apply(null, prix);
      var lim = P.type === 'gastro' || n > 10 ? 3 : 2.5, amp = (pmax - pmin) / 3, zones = [0, 0, 0];
      prix.forEach(function (v) { zones[amp > 0 ? Math.min(2, Math.floor((v - pmin) / amp)) : 1]++; });
      var omnes = { ouverture: pmax / pmin, limite: lim, okOuverture: pmax / pmin <= lim, zones: zones, okDispersion: zones[1] >= zones[0] + zones[2] || n < 4, pmin: pmin, pmax: pmax, mil1: pmin + amp, mil2: pmin + 2 * amp };
      var vegs = L.filter(function (x) { return x.veg; }).length;
      var retires = L.filter(function (x) { return x.retirer; }).length, apres = n - retires;
      var C = { cat: cat, regroupe: Object.keys(origines[cat] || {}).filter(function (k) { return k !== cat; }), role: r, n: n, apres: apres, cible: ci, plats: L.slice().sort(function (a, b) { var o = { etoile: 0, cheval: 1, enigme: 2, mort: 3 }; return o[a.classe] - o[b.classe] || b.vol - a.vol; }), omnes: omnes, vegs: vegs, mMoy: mMoy };
      if (ci) { C.ajouter = Math.max(0, ci.min - apres); C.enlever = Math.max(0, apres - ci.max); }
      C.vegManque = (r === 'e' || r === 'p') && vegs === 0;
      R.cats.push(C);
    });
    var ordre = { e: 0, p: 1, d: 2, '': 3 }; R.cats.sort(function (a, b) { return ordre[a.role] - ordre[b.role]; });
    /* C208 (V39) : les nouveaux prix comptent pour le montant que Simuler calcule (VerdictGainCarte, moteur rejoué) ;
       si l'Idéale n'en reprend qu'une partie (petite catégorie, plat retiré), au prorata. */
    var g = null; try { g = typeof w.VerdictGainCarte === 'function' ? w.VerdictGainCarte() : null; } catch (e) {}
    R.gc = g;
    if (g && g.fiable && g.rows && g.rows.length && R.gainPrix > 0) {
      var tot = g.rows.reduce(function (t, r) { return t + (Number(r.contribMois) || 0); }, 0);
      if (tot > 0) { var aj = Math.max(0, g.mois) * Math.min(1, R.gainPrix / tot); R.gainMois += aj - R.gainPrix; R.gainPrix = aj; R.prixTous = R.prixPlats >= g.rows.length; }
    }
    R.saison = saison(D);
    R.formuleMidi = P.services !== 'soir' && (P.tourisme !== 'non' && !hauteSaison(P, m) || P.habitants === 'village');
    return R;
  }

  /* ---------- Saison de l'établissement (fréquentation pondérée sur les années précédentes) ---------- */
  function saison(D) {
    var H = (D.monthlyHistory || []).filter(function (x) { return x && x.caTTC > 0 && /^\d{4}-\d{2}/.test(String(x.period)); }), ans = {};
    H.forEach(function (x) { var a = String(x.period).slice(0, 4), mo = Number(String(x.period).slice(5, 7)); (ans[a] = ans[a] || {})[mo] = Number(x.caTTC); });
    /* C218 (W77) : sans historique mensuel, les journées de la caisse donnent les mois (avant : saison plate, aucun point jaune). */
    var J = {}; (D.histJour || []).forEach(function (x) { var dt = String(x && x.date || ''), v = Number(x && (x.caJ != null ? x.caJ : x.ca)); if (!/^\d{4}-\d{2}/.test(dt) || !(v > 0)) return; var a = dt.slice(0, 4), mo = Number(dt.slice(5, 7)); (J[a] = J[a] || {})[mo] = ((J[a] || {})[mo] || 0) + v; });
    Object.keys(J).forEach(function (a) { if (!ans[a] || Object.keys(ans[a]).length < 12) ans[a] = J[a]; });
    var complets = Object.keys(ans).filter(function (a) { return Object.keys(ans[a]).length === 12; }).sort().reverse().slice(0, 2), poids = [0.6, 0.4], coef = [];
    for (var mo = 1; mo <= 12; mo++) {
      var t = 0, pw = 0;
      complets.forEach(function (a, i) { var moy = Object.keys(ans[a]).reduce(function (s, k) { return s + ans[a][k]; }, 0) / 12; t += poids[i] * ans[a][mo] / moy; pw += poids[i]; });
      coef.push(pw ? t / pw : 1);
    }
    return { coef: coef, annees: complets };
  }
  function projection(R, partAppliquee) {
    var c = R.saison.coef, m0 = R.mois - 1, mois = [], cumul = R.stockLibere * partAppliquee;
    for (var i = 0; i < 36; i++) { var k = (m0 + i) % 12, g = R.gainMois * partAppliquee * c[k]; cumul += g; mois.push({ k: k, gain: g, cumul: cumul }); }
    return mois;
  }

  /* ---------- Écran ---------- */
  var CL = { etoile: ['#22c55e', 'Très vendu, rapporte bien'], cheval: ['#eab308', 'Très vendu, rapporte peu'], enigme: ['#f97316', 'Rapporte bien, peu vendu'], mort: ['#ef4444', 'Peu vendu, rapporte peu'] }; /* C182 : ce que les familles de la méthode Kasavana veulent dire */
  var CSS = '#c-smart{--ci-t:#0f172a;--ci-m:#475569;--ci-b:rgba(148,163,184,.38);--ci-card:#fff}html.vd-workspace-dark #c-smart{--ci-t:#f1f5f9;--ci-m:#a8b3c4;--ci-b:rgba(148,163,184,.28);--ci-card:rgba(255,255,255,.03)}' +
    '#c-smart .ci-pro{font-size:11px;font-weight:800;letter-spacing:.06em;padding:3px 8px;border-radius:999px;background:linear-gradient(135deg,#b45309,#92400e);color:#fff;vertical-align:3px;margin-left:6px}' +
    '#c-smart h2.ci-t{font-size:26px;margin:4px 0 4px;color:var(--ci-t)}#c-smart .ci-sub{color:var(--ci-m);margin:0 0 14px;font-size:14.5px;line-height:1.45}' +
    '#c-smart .ci-sec{border:1px solid var(--ci-b);border-radius:18px;padding:16px;margin:0 0 14px;background:var(--ci-card)}#c-smart .ci-sec h3{font-size:17px;margin:0 0 6px;color:var(--ci-t)}' +
    '#c-smart .ci-m{font-size:13.5px;color:var(--ci-m);line-height:1.45;margin:0 0 8px}' +
    '#c-smart .ci-hero{background:linear-gradient(135deg,rgba(34,197,94,.14),rgba(34,197,94,.02));border-color:rgba(34,197,94,.45)}' +
    '#c-smart .ci-big{font-size:40px;font-weight:900;letter-spacing:-.02em;color:#15803d;line-height:1.05;font-variant-numeric:tabular-nums}html.vd-workspace-dark #c-smart .ci-big{color:#4ade80}' +
    '#c-smart .ci-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0}#c-smart .ci-k{border:1px solid var(--ci-b);border-radius:14px;padding:10px 12px}#c-smart .ci-k b{display:block;font-size:20px;font-weight:900;color:var(--ci-t);font-variant-numeric:tabular-nums}#c-smart .ci-k span{font-size:12.5px;color:var(--ci-m)}' +
    '#c-smart svg{display:block;width:100%;max-width:620px;margin:0 auto;height:auto}#c-smart .ci-ax{font-size:10px;fill:var(--ci-m);font-weight:700}#c-smart .ci-v{font-size:10px;fill:var(--ci-t);font-weight:800}' +
    '#c-smart .ci-range{display:grid;gap:4px;margin:10px 0 0}#c-smart .ci-range label{font-size:13.5px;font-weight:700;color:var(--ci-t);display:flex;justify-content:space-between}#c-smart input[type=range]{width:100%;min-height:36px;accent-color:#16a34a}' +
    '#c-smart .ci-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}#c-smart .ci-form label{display:grid;gap:4px;font-size:13px;font-weight:700;color:var(--ci-m)}' +
    '#c-smart .ci-form select,#c-smart .ci-form input{min-height:44px;font:inherit;font-size:16px;border-radius:10px;border:1px solid var(--ci-b);padding:8px 10px;background:transparent;color:var(--ci-t);width:100%;box-sizing:border-box}' +
    '#c-smart button.ci-b{min-height:44px;padding:9px 16px;border-radius:12px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;border:1px solid var(--ci-b);background:transparent;color:var(--ci-t)}#c-smart button.ci-p{background:#15803d;border-color:#15803d;color:#fff}' +
    '#c-smart .ci-a{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}#c-smart .ci-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 0}#c-smart .ci-chip{font-size:12.5px;font-weight:700;padding:5px 10px;border-radius:999px;border:1px solid var(--ci-b);color:var(--ci-t)}' +
    '#c-smart .ci-cat{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}#c-smart .ci-cat b{font-size:17px;color:var(--ci-t)}#c-smart .ci-cnt{font-size:13.5px;font-weight:800;color:var(--ci-t)}' +
    '#c-smart .ci-pl{border:1px solid var(--ci-b);border-left:4px solid var(--ci-c);border-radius:14px;padding:10px 12px;margin:8px 0 0}#c-smart .ci-pl .h{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}' +
    '#c-smart .ci-pl .n{font-weight:800;color:var(--ci-t);overflow-wrap:anywhere;min-width:0}#c-smart .ci-tag{flex:0 0 auto;font-size:12px;font-weight:800;padding:3px 9px;border-radius:999px;color:var(--ci-c);background:color-mix(in srgb,var(--ci-c) 14%,transparent);white-space:nowrap}' +
    '#c-smart .ci-pl .d{font-size:13px;color:var(--ci-m);margin:4px 0 0;line-height:1.4}#c-smart .ci-pl .x{font-size:14px;color:var(--ci-t);margin:4px 0 0;line-height:1.4}#c-smart .ci-pl .g{font-weight:800;color:#15803d}html.vd-workspace-dark #c-smart .ci-pl .g{color:#4ade80}' +
    '#c-smart .ci-ok{color:#15803d;font-weight:800}#c-smart .ci-ko{color:#c2410c;font-weight:800}html.vd-workspace-dark #c-smart .ci-ok{color:#4ade80}html.vd-workspace-dark #c-smart .ci-ko{color:#fb923c}' +
    '#cp-nav:has([data-ci-onglet]),.cp-nav:has([data-ci-onglet]),html.p40-app #v32ModuleDock .cp-nav:has([data-ci-onglet]){grid-template-columns:repeat(4,minmax(0,1fr))!important}#cp-nav [data-ci-onglet]{white-space:nowrap}#cp-nav [data-ci-onglet] .ci-np{display:none}@media (min-width:700px){#cp-nav [data-ci-onglet] .ci-np{display:inline}}' +
    '#c-smart .ci-form label{align-content:start}#c-smart .ci-lu{font-size:12px;font-weight:600;color:var(--ci-m)}#c-smart details{margin-top:8px}#c-smart summary{cursor:pointer;font-weight:700;color:var(--ci-t);min-height:32px;display:flex;align-items:center}';
  var part = 1, editProfil = false;
  function css() { if (!doc.getElementById('ciCss')) { var s = doc.createElement('style'); s.id = 'ciCss'; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s); } }
  function opt(map, v) { return Object.keys(map).map(function (k) { return '<option value="' + k + '"' + (k === v ? ' selected' : '') + '>' + esc(map[k]) + '</option>'; }).join(''); }
  function formProfil(P) {
    return '<form class="ci-form" data-ci-profil>' +
      '<label>Type d’établissement<select name="type"><option value="">Choisir…</option>' + opt(TYPES, P.type) + '</select></label>' +
      '<label>Habitants de la commune<select name="habitants"><option value="">Choisir…</option>' + opt(HAB, P.habitants) + '</select></label>' +
      '<label>Saison<select name="tourisme"><option value="">Choisir…</option>' + opt(TOUR, P.tourisme) + '</select>' + (P.saisonCaisse ? '<small class="ci-lu">Lue dans votre caisse : ' + esc(P.saisonCaisse) + '</small>' : '') + '</label>' +
      '<label>Places assises<input name="places" type="number" inputmode="numeric" min="1" step="1" value="' + (P.places || '') + '"></label>' +
      '<label>Couverts par jour en moyenne<input name="couverts" type="number" inputmode="numeric" min="1" step="1" value="' + (P.couverts || '') + '">' + (P.couvertsCaisse || couvertsCaisse(DB() || {}) === Number(P.couverts) ? '<small class="ci-lu">Lus dans votre caisse</small>' : (!(Number(P.couverts) > 0) && sansTickets(DB() || {}) ? '<small class="ci-lu">Votre export de caisse ne donne pas les tickets : déposez vos journées de caisse (CA et nombre de tickets) pour le remplir sans saisie.</small>' : '')) + '</label>' +
      '<label>Services<select name="services">' + opt(SERV, P.services) + '</select></label>' +
      '<div class="ci-a" style="grid-column:1/-1"><button type="submit" class="ci-b ci-p">Lancer l’analyse</button>' + (profilComplet(P) ? '<button type="button" class="ci-b" data-ci="annuler">Annuler</button>' : '') + '</div></form>';
  }
  function graphe(R, M) {
    var W = 340, H = 150, G = 6, B = 120, T = 18, max = Math.max.apply(null, M.slice(0, 12).map(function (x) { return x.cumul; }).concat([1])), pas = (W - 2 * G) / 12, s = '';
    M.slice(0, 12).forEach(function (x, i) {
      var h = Math.max(2, x.cumul / max * (B - T)), xx = G + i * pas + pas * 0.15, ww = pas * 0.7, saison = R.saison.coef[x.k];
      s += '<rect x="' + xx.toFixed(1) + '" y="' + (B - h).toFixed(1) + '" width="' + ww.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="4" fill="#22c55e" fill-opacity="' + (0.45 + 0.55 * (i + 1) / 12).toFixed(2) + '"><title>' + MOIS[x.k] + ' : ' + signe(x.gain) + ' (cumul ' + signe(x.cumul) + ')</title></rect>';
      s += '<text class="ci-ax" x="' + (xx + ww / 2).toFixed(1) + '" y="' + (B + 13) + '" text-anchor="middle">' + MC[x.k] + '</text>';
      if (saison > 1.12) s += '<circle cx="' + (xx + ww / 2).toFixed(1) + '" cy="' + (B + 21) + '" r="2" fill="#eab308"><title>Mois fort</title></circle>';
    });
    var last = M[11]; s += '<text class="ci-v" x="' + (W - G) + '" y="12" text-anchor="end">' + signe(last.cumul) + ' en 12 mois</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Marge supplémentaire cumulée sur 12 mois : ' + signe(last.cumul) + '">' + s + '</svg>';
  }
  /* C182 (relecture du 20/10 : l'entrecôte était « Étoile, à garder » ici et « premier problème, +2,7 % » dans Décisions ;
     les moules à 20,60 € ici et 20,00 € dans la Carte) : un seul prix conseillé par plat, partout — celui de Décisions et
     Simuler (plats sous votre objectif de marge, même plafond de hausse). */
  function prixDecisions() {
    var M = {};
    try {
      var GR = w.VerdictGainRealiste; if (!GR || !GR.carteFiable()) return M;
      var lev = null; try { lev = (w.potentiel().leviers || []).filter(function (l) { return l.id === 'carte' || /prix de la carte/i.test(l.n || ''); })[0]; } catch (e) {}
      var cap = (lev && lev.over && Number(lev.over.carte)) || 8, cp = GR.cartePlan(cap);
      (cp && cp.rows || []).forEach(function (r) { if (r && r.nom && r.apres > r.avant) M[r.nom] = r; });
    } catch (e) {}
    return M;
  }
  function motCat(c) { return /boisson|bière|biere|vin|cocktail|café|cafe|soft|apéritif|aperitif|digestif/i.test(String(c || '')) ? 'boisson' : 'plat'; }
  function plat(x) {
    var c = CL[x.classe], col = c[0], lib = c[1];
    /* C208 (V38) : « rapporte bien » se juge dans la catégorie ; un plat sous son objectif de marge ne l'est jamais
       (l'Audit le range parmi les contributions à revoir, Décisions propose un prix). */
    if (x.sousObj && (x.classe === 'etoile' || x.classe === 'enigme')) { col = CL.cheval[0]; lib = (x.classe === 'etoile' ? 'Très vendu' : 'Peu vendu') + ', marge sous votre objectif'; }
    var h = '<div class="ci-pl" style="--ci-c:' + col + '"><div class="h"><span class="n">' + esc(x.nom) + '</span><span class="ci-tag">' + lib + '</span></div>';
    h += '<p class="d">' + eur2(x.ttc) + ' · marge ' + eur2(x.marge) + ' par ' + motCat(x.cat) + ' · ' + Math.round(x.vol) + ' vendus par mois (' + pct(x.part) + ' de la catégorie)' + (x.veg && motCat(x.cat) === 'plat' ? ' · végétarien' : '') + '</p>';
    h += '<p class="x">' + esc(x.action) + (x.gain > 0.5 ? ' · <span class="g">' + signe(x.gain) + ' par mois</span>' : '') + '</p>';
    if (x.ingSeuls && x.ingSeuls.length) h += '<p class="d">Argent investi pour ce seul plat : ' + esc(x.ingSeuls.slice(0, 3).join(', ')) + (x.stock > 0 ? ' (≈ ' + eur(x.stock) + ' de stock)' : '') + '</p>';
    return h + '<div class="ci-a"><button type="button" class="ci-b" data-cp-dish="' + esc(x.id) + '">Ouvrir le plat</button></div></div>';
  }
  /* C208 (V39) : l'Idéale, Décisions et Simuler disent d'où vient chaque euro des prix. */
  /* C218 (W77) : le reste du gain se dit avec ce qui le produit vraiment (plats mis en avant, plats retirés), jamais
     « retirés » quand aucun plat ne sort de la carte. Une mise en avant déplace des ventes, sans client en plus. */
  function resteTxt(R, part) {
    var avant = 0, retires = 0; R.cats.forEach(function (C) { C.plats.forEach(function (x) { if (x.retirer) retires++; else if (x.classe === 'enigme' && x.gain - (x.gainPrix || 0) > 0.5) avant++; }); });
    var q = [];
    if (avant) q.push(avant + ' plat' + (avant > 1 ? 's' : '') + ' mis en avant (10 % de leurs ventes reprises aux autres plats de la catégorie, aucun client en plus)');
    if (retires) q.push(retires + ' plat' + (retires > 1 ? 's' : '') + ' retiré' + (retires > 1 ? 's' : '') + ' (70 % de leurs clients reportés)');
    return 'Le reste (' + signe((R.gainMois - R.gainPrix) * part) + ' par mois) vient de ' + (q.length ? q.join(' et de ') : 'l’argent libéré du stock') + ' : Simuler et l’Audit ne le comptent pas.';
  }
  function lienSimuler(R, part) {
    var g = R.gc; if (!(R.gainPrix > 0.5) || !g || !g.fiable) return '';
    return '<p class="ci-m" data-ci-lien style="margin-top:10px">Dont <b>' + signe(R.gainPrix * part) + ' par mois</b> par les nouveaux prix de ' + R.prixPlats + (R.prixPlats > 1 ? ' plats sous leur objectif' : ' plat sous son objectif') +
      (R.prixTous ? ' : le chiffre du curseur « Prix de la carte » de Simuler' : ', calculés comme dans Simuler') + '. ' +
      (g.retenu ? 'Ces prix sont compris dans votre plan Simuler.' : 'Votre plan Simuler (' + signe(g.plan) + ' par an) ne les ajoute pas' + (g.plafond ? ' : il atteint déjà le niveau des meilleurs établissements de votre format.' : '.')) +
      (R.gainMois - R.gainPrix > 0.5 ? ' ' + resteTxt(R, part) : '') + '</p>';
  }
  function dessiner() {
    var host = doc.getElementById('c-smart'); if (!host) return; css();
    var R = analyse(), h = '<p class="ci-sub" style="margin:0;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">Carte · analyse</p><h2 class="ci-t" data-cp-title tabindex="-1">Carte intelligente <span class="ci-pro">PRO</span></h2>' +
      '<p class="ci-sub">La carte la plus rentable pour votre établissement : chaque plat pesé, le bon nombre de plats pour votre salle et votre saison, l’argent investi dans le stock, et ce que cela vous rapporte mois après mois.</p>';
    /* C218 (W73) : la carte idéale fait partie de Pro (badge PRO, grille de l'appli, site) : sous Pilotage elle est fermée et
       le dit, comme Achats ; Ma carte, Ventes et Décisions (avec les mêmes prix conseillés) restent dans Pilotage. */
    if (!pro()) { host.innerHTML = h + '<div class="ci-sec" data-ci-verrou><h3>🔒 Réservé à Verdict Pro</h3><p class="ci-m">La carte idéale (nombre de plats pour votre salle et votre saison, plats à mettre en avant ou à retirer, argent libéré du stock, gain sur 12 mois) fait partie de Verdict Pro. Votre offre Pilotage comprend Ma carte, Ventes et Décisions : les prix conseillés pour les plats sous leur objectif y sont déjà.</p><div class="ci-a"><button type="button" class="ci-b ci-p" data-ci="offres">Voir les offres</button><button type="button" class="ci-b" data-cp-page="plats">Ouvrir Décisions</button></div></div>'; return; }
    if (!R) { host.innerHTML = h + '<p class="ci-m">Chargement…</p>'; return; }
    var P = R.profil;
    if (!R.pret) {
      host.innerHTML = h + '<div class="ci-sec"><h3>D’abord, votre carte</h3><p class="ci-m">L’analyse a besoin d’au moins 6 plats complets : prix, fiche technique et ventes par mois. Vous en avez ' + R.complets + '.</p><div class="ci-a"><button type="button" class="ci-b ci-p" data-cp-page="menu">Compléter ma carte</button></div></div>';
      return;
    }
    if (!R.profilOk || editProfil) {
      host.innerHTML = h + '<div class="ci-sec"><h3>Votre établissement</h3><p class="ci-m">Six réponses suffisent pour adapter la carte à votre salle, votre commune et votre saison' + (P.demo ? ' (démonstration : réponses d’exemple)' : '') + '.</p>' + formProfil(P) + '</div>';
      return;
    }
    var M = projection(R, part), m12 = M[11].cumul, m36 = M[35].cumul;
    h += '<div class="ci-sec ci-hero"><p class="ci-m" style="margin:0">Si vous appliquez ' + (part < 1 ? Math.round(part * 100) + ' % des' : 'les') + ' conseils ci-dessous dès ' + MOIS[R.mois - 1] + (P.demo ? ' · démonstration' : '') + '</p>' +
      '<div class="ci-big">' + signe(m12) + '</div><p class="ci-m" style="margin:2px 0 0;font-weight:700;color:var(--ci-t)">de marge en 12 mois · ' + signe(m36) + ' en 3 ans</p>' +
      '<div class="ci-kpis"><div class="ci-k"><b>' + signe(R.gainMois * part) + '</b><span>par mois en moyenne</span></div><div class="ci-k"><b>' + eur(R.stockLibere * part) + '</b><span>d’argent libéré du stock</span></div><div class="ci-k"><b>' + R.plats.length + ' → ' + (R.plats.length - R.cats.reduce(function (t, c) { return t + c.n - c.apres; }, 0)) + '</b><span>plats à la carte</span></div></div>' + /* C208 (V37) : toute la carte, comme Ma carte */
      lienSimuler(R, part) +
      graphe(R, M) +
      '<div class="ci-range"><label for="ciPart"><span>Part des conseils appliqués</span><span>' + Math.round(part * 100) + ' %</span></label><input id="ciPart" type="range" min="0" max="100" step="10" value="' + Math.round(part * 100) + '"></div>' +
      '<p class="ci-m" style="margin-top:8px">Mois par mois selon la saison de votre établissement' + (R.saison.annees.length ? ' (' + R.saison.annees.join(' et ') + (R.saison.annees.length > 1 ? ', l’année la plus récente compte pour 60 %' : '') + ')' : '') + (R.saison.coef.some(function (v) { return v > 1.12; }) ? ' ; les points jaunes marquent vos mois forts' : ' ; aucun mois nettement plus fort que les autres') + '. Hypothèses prudentes : hausse de prix limitée à 8 % avec 3 % de ventes en moins (comme Décisions et Simuler), 70 % des clients d’un plat retiré reportés sur les autres.</p></div>';
    h += '<div class="ci-sec"><h3>Votre établissement</h3><div class="ci-chips"><span class="ci-chip">' + esc(TYPES[P.type]) + '</span><span class="ci-chip">' + esc(HAB[P.habitants]) + '</span><span class="ci-chip">' + esc(TOUR[P.tourisme]) + '</span><span class="ci-chip">' + P.places + ' places</span><span class="ci-chip">' + Math.round(P.couverts) + ' couverts / jour</span><span class="ci-chip">' + esc(SERV[P.services]) + '</span></div>' +
      (R.formuleMidi ? '<p class="ci-m" style="margin-top:10px"><b>Conseil :</b> un menu du midi à prix d’appel (entrée et plat, ou plat et dessert) fidélise les habitants hors saison.</p>' : '') +
      '<div class="ci-a"><button type="button" class="ci-b" data-ci="profil">Modifier</button></div></div>';
    R.cats.forEach(function (C) {
      var ci = C.cible, o = C.omnes;
      h += '<div class="ci-sec"><div class="ci-cat"><b>' + esc(C.cat) + (C.regroupe && C.regroupe.length ? ' <small style="font-weight:600;color:var(--ci-m);font-size:13px">(' + esc(C.regroupe.join(', ')) + ')</small>' : '') + '</b><span class="ci-cnt">' + C.n + ' ' + motCat(C.cat) + (C.n > 1 ? 's' : '') + (C.apres !== C.n ? ' → ' + C.apres : '') + (ci ? ' · visé ' + ci.n + ' (' + ci.min + ' à ' + ci.max + ')' : '') + '</span></div>';
      if (ci) h += '<p class="ci-m">' + esc(ci.raisons.join(' · ')) + '.' + (C.ajouter ? ' <b>Ajouter ' + C.ajouter + ' ' + motCat(C.cat) + (C.ajouter > 1 ? 's' : '') + '</b> (Vera peut en proposer de saison).' : '') + (C.enlever ? ' <b>Encore ' + C.enlever + ' ' + motCat(C.cat) + (C.enlever > 1 ? 's' : '') + ' de trop</b> : la carte est trop longue pour votre salle.' : '') + '</p>';
      h += '<p class="ci-m">Prix de ' + eur2(o.pmin) + ' à ' + eur2(o.pmax) + ' : le plus cher vaut ' + o.ouverture.toFixed(1).replace('.', ',') + ' fois le moins cher, ' + (o.okOuverture ? '<span class="ci-ok">c’est équilibré</span>' : '<span class="ci-ko">écart trop grand (conseillé : ' + String(o.limite).replace('.', ',') + ' fois au plus)</span>') + ' · ' + (o.okDispersion ? '<span class="ci-ok">assez de plats au milieu de la gamme</span>' : '<span class="ci-ko">trop peu de plats au milieu de la gamme : ' + o.zones[1] + ' entre ' + eur2(o.mil1) + ' et ' + eur2(o.mil2) + ', contre ' + (o.zones[0] + o.zones[2]) + ' moins chers ou plus chers (conseillé : au moins autant au milieu)</span>') +
        (C.role === 'e' || C.role === 'p' ? ' · ' + (C.vegManque ? '<span class="ci-ko">aucun plat végétarien</span>' : '<span class="ci-ok">' + C.vegs + ' végétarien' + (C.vegs > 1 ? 's' : '') + '</span>') : '') + '</p>';
      C.plats.forEach(function (x) { h += plat(x); });
      if (C.ajouter && w.VerdictVeraCarte) h += '<div class="ci-a"><button type="button" class="ci-b" data-ci="vera">Vera propose des plats de saison</button></div>';
      h += '</div>';
    });
    if (R.petites && R.petites.length) h += '<p class="ci-m">Non classées (moins de 3 plats) : ' + esc(R.petites.join(', ')) + '.</p>';
    h += '<div class="ci-sec"><details><summary>Méthodes et repères</summary><p class="ci-m">Classement des plats : méthode Kasavana-Smith (Cornell), dans chaque catégorie — populaire si sa part des ventes atteint 70 % de la part moyenne, rentable si sa marge en euros dépasse la marge moyenne. Équilibre des prix : principes d’Omnès. Nombre de plats : étude de l’université de Bournemouth (2013, 7 à 10 choix par catégorie en restaurant à table) et référentiels CHR, ajusté à vos places, votre rotation, votre commune et votre saison. Stock : repère de 5 à 7 jours pour le frais ; un ingrédient devrait servir au moins à deux plats. Saison : votre historique de chiffre d’affaires, pondéré sur les deux dernières années complètes. Aucune modification n’est faite sur votre carte sans votre accord.</p></details></div>';
    host.innerHTML = h;
  }
  doc.addEventListener('input', function (e) { if (e.target && e.target.id === 'ciPart') { part = Number(e.target.value) / 100; var y = w.scrollY; dessiner(); w.scrollTo(0, y); var r = doc.getElementById('ciPart'); if (r) r.focus(); } });
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#c-smart [data-ci]'); if (!b) return;
    var a = b.getAttribute('data-ci');
    if (a === 'profil') { editProfil = true; dessiner(); } else if (a === 'annuler') { editProfil = false; dessiner(); }
    else if (a === 'offres') { try { (w.parent && w.parent.go || w.go)('abo'); } catch (er) { try { w.go('abo'); } catch (e2) {} } }
    else if (a === 'vera') { try { w.VerdictVeraCarte.open('menu'); } catch (er) { try { w.VerdictVeraCarte.open(); } catch (e2) {} } }
  });
  doc.addEventListener('submit', function (e) {
    var f = e.target.closest && e.target.closest('#c-smart form[data-ci-profil]'); if (!f) return; e.preventDefault();
    var P = profilBrut(), v = function (n) { return f.querySelector('[name="' + n + '"]').value; };
    P.type = v('type'); P.habitants = v('habitants'); P.tourisme = v('tourisme'); P.places = Math.round(+v('places')) || null; P.couverts = Math.round(+v('couverts')) || null; P.services = v('services'); delete P.demo; P.typeChoisi = true;
    if (!profilComplet(P)) { var m = f.querySelector('.ci-err') || doc.createElement('p'); m.className = 'ci-m ci-err ci-ko'; m.textContent = 'Répondez aux six questions pour lancer l’analyse.'; f.appendChild(m); return; }
    try { if (typeof w.save === 'function') w.save(); } catch (er) {}
    editProfil = false; dessiner(); var host = doc.getElementById('c-smart'); if (host) host.scrollIntoView({ block: 'start' });
  });

  /* ---------- Montage : 4ᵉ onglet de la Carte ---------- */
  function monter() {
    var root = doc.getElementById('v-carte'), nav = doc.getElementById('cp-nav'); if (!root || !nav) return;
    if (!doc.getElementById('c-smart')) { var el = doc.createElement('div'); el.className = 'sv'; el.id = 'c-smart'; root.appendChild(el); }
    if (!nav.querySelector('[data-ci-onglet]')) { var b = doc.createElement('button'); b.type = 'button'; b.setAttribute('data-ci-onglet', '1'); b.innerHTML = '✨ Idéale<span class="ci-np"> <span style="font-size:10px;font-weight:800;padding:2px 6px;border-radius:999px;background:linear-gradient(135deg,#b45309,#92400e);color:#fff;vertical-align:1px">PRO</span></span>'; b.setAttribute('aria-label', 'Carte intelligente (Pro)'); css(); nav.appendChild(b); }
    var on = root.getAttribute('data-cp-page') === 'smart'; nav.querySelector('[data-ci-onglet]').classList.toggle('on', on);
    /* C208 (V58) : un seul onglet plein — si la barre est reconstruite pendant l'Idéale, l'ancien onglet est éteint. */
    if (on) [].forEach.call(nav.querySelectorAll('button:not([data-ci-onglet])'), eteindre);
  }
  /* C218 : un onglet éteint perd aussi la couleur « bouton principal » posée en ligne par le module de contraste
     (data-vdl="prim") ; sinon « Ma carte » restait vert à côté de l'Idéale. */
  function eteindre(x) { if (x.classList.contains('on')) x.classList.remove('on'); if (x.getAttribute('aria-current') === 'page') x.setAttribute('aria-current', 'false'); if (x.getAttribute('data-vdl') === 'prim') { x.removeAttribute('data-vdl'); x.style.removeProperty('background'); x.style.removeProperty('background-color'); x.style.removeProperty('border-color'); x.style.removeProperty('color'); } }
  function ouvrir() {
    monter(); var root = doc.getElementById('v-carte'); if (!root) return;
    root.setAttribute('data-cp-page', 'smart');
    root.querySelectorAll(':scope > .sv').forEach(function (el) { el.classList.toggle('on', el.id === 'c-smart'); });
    root.querySelectorAll('#cp-nav button').forEach(function (x) { var on = x.hasAttribute('data-ci-onglet'); x.classList.toggle('on', on); if (on) x.setAttribute('aria-current', 'page'); else { x.removeAttribute('aria-current'); eteindre(x); } });
    dessiner(); var t = doc.querySelector('#c-smart [data-cp-title]'); if (t) try { t.focus({ preventScroll: true }); } catch (e) {}
    w.scrollTo(0, Math.max(0, root.getBoundingClientRect().top + w.scrollY - 120));
  }
  doc.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-ci-onglet]')) { e.preventDefault(); ouvrir(); } });
  function brancher() {
    var p = w.VerdictCartePages; if (!p || p.__ci) return !!p; p.__ci = true;
    if (typeof p.render === 'function') { var r0 = p.render; p.render = function () { var out = r0.apply(this, arguments); try { monter(); if (doc.getElementById('v-carte').getAttribute('data-cp-page') === 'smart') ouvrir(); } catch (e) {} return out; }; }
    if (typeof p.open === 'function') { var o0 = p.open; p.open = function () { var out = o0.apply(this, arguments); setTimeout(monter, 0); return out; }; }
    return true;
  }
  if (typeof w.go === 'function') { var go0 = w.go; w.go = function (v) { var out = go0.apply(this, arguments); if (v === 'carte') setTimeout(monter, 0); return out; }; for (var k in go0) { try { w.go[k] = go0[k]; } catch (e) {} } }
  w.VerdictCarteIntelligente = { analyse: analyse, projection: projection, ouvrir: ouvrir, dessiner: dessiner, cible: cible, familleDe: familleDe };
  /* La barre d'onglets est reconstruite par la Carte à chaque rendu : l'onglet est reposé dès qu'il manque. */
  setInterval(function () { try { if (w.VIEW === 'carte' || doc.querySelector('#v-carte.on')) monter(); } catch (e) {} }, 700);
  (function boot(n) { if (brancher()) { setTimeout(monter, 0); return; } if (n > 0) setTimeout(function () { boot(n - 1); }, 300); })(60);
})();
/* C251 — Carte : gestes rapides et toujours le choix le plus rentable (demande de Steven, 22/10).
   1. Une croix sur chaque plat de « Ma carte » : retrait en un geste (confirmation), Verdict recalcule tout d'un coup et
      montre l'Indice Carte et le reste après produits avant → après, avec « Annuler ».
   2. Jamais une proposition de Vera en rouge sans sa correction : la fiche Vera montre déjà le prix conseillé, et le plat
      ajouté arrive dans sa version améliorée (prix conseillé, au plus +15 % ; au-delà, portion de l'ingrédient le plus cher
      ajustée, au plus −25 %). Le patron peut revenir à la version d'origine en un clic.
   3. Un historique visible : ajouts, retraits, remises à la carte, changements de prix (date et effet en euros par mois),
      prix des produits relevés sur les factures, et établissements.
   4. « + Ajouter » en un geste : le nom suffit ; Verdict reconnaît le type de plat (fiches types), reprend les produits du
      catalogue, calcule le coût, le prix conseillé et ce qu'il reste ; le patron corrige si besoin.
   Rien n'est écrit au repos : le journal ne s'écrit que pendant un enregistrement déjà demandé par une modification. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__c251) return; w.__c251 = true;
  function D() { try { return w.DB || null; } catch (e) { return null; } }
  function num(v) { if (v == null || v === '') return null; var n = Number(String(v).replace(',', '.')); return isFinite(n) ? n : null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nb(v, dec) { return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v).replace(/[ \s]/g, ' '); }
  function eur(v, dec) { return v == null || !isFinite(v) ? '—' : nb(v, dec == null ? 2 : dec) + ' €'; }
  function pct(v, dec) { return v == null || !isFinite(v) ? '—' : nb(v, dec || 0) + ' %'; }
  function mois(v) { return v == null || !isFinite(v) ? '' : (v > 0.5 ? '+' : v < -0.5 ? '−' : '') + nb(Math.abs(Math.round(v)), 0) + ' € par mois'; }
  function r1(v) { return Math.round(v * 10) / 10; }
  function r2(v) { return Math.round(v * 100) / 100; }
  function calc(p) { try { return w.platCalc(p) || {}; } catch (e) { return {}; } }
  function actif(p) { return !!p && !p.cpArchived; }
  function okMarge(k) { return !!(k && k.complete && k.contribPct >= k.objPond - 1e-9); }
  function vol(p) { var v = num(p && p.vol); return v != null && v > 0 ? v : null; }
  function parMois(p) { var k = calc(p), v = vol(p); return k.complete && v ? k.contribPond * v : null; }
  function indice() { try { return w.scoreCarte(w.carteStats()).total; } catch (e) { return null; } }
  function resteCarte() { try { return w.carteStats().margePond; } catch (e) { return null; } }
  function platById(d, id) { return (d && d.plats || []).filter(function (p) { return p && p.id === id; })[0] || null; }
  /* Un bouton du bandeau peut servir après un rechargement de la base (démo, coque, autre établissement) : le plat est
     relu par son identifiant, jamais modifié sur une copie périmée. */
  function vivant(p) { return (p && platById(D(), p.id)) || p; }
  function enregistrer(r) { try { w.save(r); } catch (e) {} }
  function rafraichir() { try { w.verdictInvalidateViews && w.verdictInvalidateViews(); } catch (e) {} try { w.refreshAll(); } catch (e) {} }
  function dateCourte(iso) { var t = Date.parse(iso); if (!isFinite(t)) return ''; var x = new Date(t); return String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0') + '/' + x.getFullYear(); }
  function heure(iso) { var t = Date.parse(iso); if (!isFinite(t)) return ''; var x = new Date(t); return String(x.getHours()).padStart(2, '0') + ':' + String(x.getMinutes()).padStart(2, '0'); }

  /* ── Prix conseillé : le plus petit prix TTC (au dixième) qui atteint l'objectif, même calcul que la carte ─────────── */
  function prixAvec(p, ttc) { var c = {}; for (var k in p) c[k] = p[k]; if (p.pf && num(p.pfttc) > 0 && num(p.ttc) > 0) c.pfttc = r2(num(p.pfttc) * ttc / num(p.ttc)); c.ttc = ttc; return c; }
  function setPrix(p, v) { if (p.pf && num(p.pfttc) > 0 && num(p.ttc) > 0) p.pfttc = r2(num(p.pfttc) * v / num(p.ttc)); p.ttc = v; }
  function prixConseille(p) {
    var k = calc(prixAvec(p, num(p.ttc) > 0 ? num(p.ttc) : 10)); if (!(k.cout >= 0) || !(k.objPond > 0 && k.objPond < 100)) return null;
    var tva = num(p.tva); if (tva == null) tva = 10;
    var x = Math.max(0.1, Math.ceil(k.cout / (1 - k.objPond / 100) * (1 + tva / 100) * 10 - 1e-9) / 10), n = 0;
    function ok(v) { return okMarge(calc(prixAvec(p, v))); }
    while (!ok(x) && n++ < 400) x = r1(x + 0.1);
    if (n >= 400) return null;
    n = 0; while (x > 0.15 && ok(r1(x - 0.1)) && n++ < 100) x = r1(x - 0.1);
    return x;
  }
  function typeIng(nom) { var g = (D().ing || []).filter(function (x) { return x && x.nom === nom; })[0]; return g ? String(g.type || 'KG').toUpperCase() : null; }
  /* Ligne de recette la plus chère (au poids ou au volume : une pièce ne se coupe pas). */
  function lignePlusChere(p) {
    var c0 = calc(p).cout, best = null;
    (p.rec || []).forEach(function (l, i) {
      var t = typeIng(l[0]); if (!t || t === 'UNITE' || !(num(l[1]) > 0)) return;
      var rec = p.rec.map(function (x) { return x.slice(); }); rec[i][1] = 0;
      var q = {}; for (var k in p) q[k] = p[k]; q.rec = rec;
      var c = c0 - (calc(q).cout || 0); if (c > 0 && (!best || c > best.cout)) best = { i: i, nom: l[0], cout: c, type: t };
    });
    return best;
  }
  function unite(t) { return t === 'L' ? ' ml' : ' g'; }
  /* La version améliorée d'un plat proposé par Vera ; null si la marge est déjà bonne ou si le plat n'est pas chiffré. */
  function corriger(p) {
    var k = calc(p); if (!k.complete || okMarge(k) || !(num(p.ttc) > 0)) return null;
    var avant = { ttc: num(p.ttc), pfttc: p.pfttc, rec: JSON.parse(JSON.stringify(p.rec || [])), pct: k.contribPct, parVente: k.contribPond };
    var c = prixConseille(p); if (c == null) return null;
    var plafond = Math.ceil(avant.ttc * 1.15 * 10 - 1e-9) / 10, out = { avant: avant, obj: k.objPond };
    if (c <= plafond) setPrix(p, c);
    else {
      setPrix(p, plafond);
      var L = lignePlusChere(p);
      if (L) {
        var q0 = num(p.rec[L.i][1]), f = 0.95;
        for (; f > 0.74; f = Math.round((f - 0.05) * 100) / 100) { p.rec[L.i][1] = Math.max(5, Math.round(q0 * f / 5) * 5); if (okMarge(calc(p))) break; }
        out.portion = { nom: L.nom, de: q0, a: p.rec[L.i][1], u: unite(L.type) };
      }
    }
    var k2 = calc(p); out.apres = { ttc: num(p.ttc), pct: k2.contribPct, parVente: k2.contribPond }; out.ok = okMarge(k2);
    if (!out.ok) { var L2 = lignePlusChere(p); out.cher = L2 ? { nom: L2.nom, cout: L2.cout } : null; out.conseil = c; }
    p.cpC251 = { at: new Date().toISOString(), avant: avant, prix: out.apres.ttc, portion: out.portion || null };
    return out;
  }
  function texteCorrection(p, c) {
    var t = (c.portion || !c.ok ? 'Prix ' + eur(c.apres.ttc) + ' (+15 % au plus)' : 'Prix conseillé ' + eur(c.apres.ttc)) + ' au lieu de ' + eur(c.avant.ttc);
    if (c.portion) t += ', ' + c.portion.nom + ' : ' + nb(c.portion.a, 0) + c.portion.u + ' au lieu de ' + nb(c.portion.de, 0) + c.portion.u;
    t += (c.portion ? ' ; il reste ' : ' : il reste ') + pct(c.apres.pct) + ' une fois les produits payés au lieu de ' + pct(c.avant.pct) + ' (' + eur(c.apres.parVente) + ' par vente au lieu de ' + eur(c.avant.parVente) + ')';
    if (!c.ok) t += '. L’objectif de ' + pct(c.obj) + ' n’est pas encore atteint (il faudrait ' + eur(c.conseil) + ' avec la recette d’origine)' + (c.cher ? ' : remplacez ' + c.cher.nom + ' (' + eur(c.cher.cout) + ' par portion) par un produit moins cher' : '') + ', ou retirez ce plat';
    return t + '.';
  }

  /* ── Journal de la carte et des établissements ─────────────────────────────────────────────────────────────────── */
  var SNAP = typeof WeakMap === 'function' ? new WeakMap() : null, ETABS = null, croix = false;
  function photo1(p) { return { t: num(p.ttc), f: num(p.pfttc), a: !!p.cpArchived, n: p.nom, c: p.cat }; }
  function photo(d) { var m = {}; (d.plats || []).forEach(function (p) { if (p && p.id != null) m[p.id] = photo1(p); }); return m; }
  function ordre() { try { return (w.STORE && w.STORE.ordre || []).filter(function (id) { return w.STORE.etabs[id]; }); } catch (e) { return null; } }
  function nomEtab(id) { try { var e = w.STORE.etabs[id]; return String(e && (e.etab || e.nom) || 'Établissement'); } catch (e) { return 'Établissement'; } }
  function suivre() { var d = D(); if (SNAP && d && d.plats && !SNAP.has(d)) SNAP.set(d, photo(d)); if (!ETABS) ETABS = ordre(); }
  var PAR = { 'vera-add-dish': 'Vera', 'vera-menu-apply': 'Vera', 'menu-rotation': 'Renouveler ma carte', 'menu-reuse': 'Renouveler ma carte', 'c251-croix': 'croix', 'carte-ajout-rapide': 'ajout en un geste', 'quick-dish': 'saisie détaillée', 'c251-garder': 'version d’origine', 'c251-prix-conseille': 'prix conseillé', 'c251-remettre': 'historique' };
  function journaliser(d, reason, corr) {
    if (!SNAP || !d || !Array.isArray(d.plats)) return;
    /* Première vue de cet établissement (ou carte encore vide au chargement) : photo seulement, aucun faux « ajout ». */
    var S = SNAP.get(d); if (!S || !Object.keys(S).length) { SNAP.set(d, photo(d)); return; }
    var now = photo(d), at = new Date().toISOString(), ev = [], vera = /^vera-/.test(reason), par = croix ? 'croix' : PAR[reason] || '';
    Object.keys(now).forEach(function (id) {
      var a = S[id], b = now[id], p = platById(d, id); if (!p) return;
      if (b.a) {
        if (a && !a.a) { var pm = parMois(p); ev.push({ at: at, type: 'retrait', id: id, nom: p.nom, cat: p.cat, prix: b.t, effet: pm == null ? null : -pm, par: par }); }
        return;
      }
      if (!a || a.a) {
        var c = vera || (p.cpFromVera && reason !== 'c251-garder' && !p.cpC251) ? corriger(p) : null;
        if (c) { corr.push({ p: p, c: c }); now[id] = photo1(p); }
        var k = calc(p);
        ev.push({ at: at, type: a ? 'reprise' : 'ajout', id: id, nom: p.nom, cat: p.cat, prix: num(p.ttc), parVente: k.complete ? k.contribPond : null, pct: k.complete ? k.contribPct : null, effet: parMois(p), par: par, vera: !!(vera || p.cpFromVera), corr: c ? texteCorrection(p, c) : null });
        return;
      }
      if (a.t !== b.t && a.t > 0 && b.t > 0) {
        var k1 = calc(p), old = {}; for (var q in p) old[q] = p[q]; old.ttc = a.t; if (a.f != null) old.pfttc = a.f; var k0 = calc(old), v = vol(p);
        var dv = k1.complete && k0.complete ? k1.contribPond - k0.contribPond : null;
        ev.push({ at: at, type: 'prix', id: id, nom: p.nom, cat: p.cat, avant: a.t, apres: b.t, parVente: dv, effet: dv != null && v ? dv * v : null, par: par });
      }
    });
    Object.keys(S).forEach(function (id) { if (!now[id] && !S[id].a) ev.push({ at: at, type: 'suppression', id: id, nom: S[id].n, cat: S[id].c, par: par }); });
    ['ajout', 'retrait'].forEach(function (t) {
      var lot = ev.filter(function (e) { return e.type === t && !e.corr; }); if (lot.length <= 6) return;
      ev = ev.filter(function (e) { return lot.indexOf(e) < 0; });
      ev.push({ at: at, type: t, groupe: lot.length, noms: lot.slice(0, 6).map(function (e) { return e.nom; }), par: par });
    });
    SNAP.set(d, now);
    if (ev.length) d.carteJournal = (Array.isArray(d.carteJournal) ? d.carteJournal : []).concat(ev).slice(-300);
    var o = ordre();
    if (o && ETABS) {
      var ee = [];
      o.forEach(function (id) { if (ETABS.indexOf(id) < 0) ee.push({ at: at, type: 'ajout', id: id, nom: nomEtab(id) }); });
      ETABS.forEach(function (id) { if (o.indexOf(id) < 0) ee.push({ at: at, type: 'retrait', id: id }); });
      if (ee.length) try { w.STORE.c251Etabs = (Array.isArray(w.STORE.c251Etabs) ? w.STORE.c251Etabs : []).concat(ee).slice(-100); } catch (e) {}
    }
    if (o) ETABS = o;
  }
  function brancherSave() {
    var s0 = w.save; if (typeof s0 !== 'function' || s0.__c251) return typeof s0 === 'function';
    var s = function (reason) {
      var corr = [];
      try { journaliser(D(), String(reason || ''), corr); } catch (e) {}
      var out = s0.apply(this, arguments);
      if (corr.length) setTimeout(function () { bandeauVera(corr); }, 60);
      return out;
    };
    for (var k in s0) { try { s[k] = s0[k]; } catch (e) {} }
    s.__c251 = true; w.save = s; return true;
  }

  /* ── Bandeau : ce qui vient de changer, en euros ───────────────────────────────────────────────────────────────── */
  var minuteur = null;
  function bandeau(html, actions) {
    var b = doc.getElementById('c251-bandeau'); if (!b) { b = doc.createElement('div'); b.id = 'c251-bandeau'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite'); doc.body.appendChild(b); }
    b.innerHTML = '<button type="button" class="c251-x" data-c251-fermer aria-label="Fermer">×</button><div class="c251-bt">' + html + '</div>' + (actions && actions.length ? '<div class="c251-ba">' + actions.map(function (a, i) { return '<button type="button" class="c251-b' + (a.pri ? ' c251-p' : '') + '" data-c251-act="' + i + '">' + esc(a.t) + '</button>'; }).join('') + '</div>' : '');
    b.hidden = false; b.__act = actions || [];
    clearTimeout(minuteur); minuteur = setTimeout(function () { b.hidden = true; }, 16000);
  }
  /* La carte telle qu'elle est : un plat retiré n'y compte plus, 70 % de ses ventes vont aux autres plats de sa catégorie
     complets (même hypothèse que la Carte idéale, règle convenue avec L3 pour carteStats). S'il n'en reste aucun, rien n'est
     reporté. Le moteur garde l'historique des ventes ; ce calcul ne modifie rien. */
  function statsCarte() {
    /* C254 (L3) : le moteur exclut lui-même les plats retirés et le dit (`retires`) ; le calcul local ne sert qu'aux
       éditions qui n'ont pas encore C254. */
    try { var st0 = w.carteStats(); if (st0 && st0.retires) return { i: w.scoreCarte(st0).total, m: st0.margePond }; } catch (e) {}
    var d = D(), P = d && d.plats; if (!Array.isArray(P)) return { i: null, m: null };
    var arch = P.filter(function (p) { return p && p.cpArchived && vol(p); });
    if (!arch.length) return { i: indice(), m: resteCarte() };
    var act = P.filter(actif).map(function (p) { var c = {}; for (var k in p) c[k] = p[k]; return c; });
    arch.forEach(function (a) {
      var meme = act.filter(function (p) { return p.cat === a.cat && vol(p) && calc(p).complete; }), tot = 0; meme.forEach(function (p) { tot += vol(p); });
      if (tot > 0) meme.forEach(function (p) { p.vol = vol(p) + 0.7 * vol(a) * vol(p) / tot; });
    });
    var out = { i: null, m: null }; d.plats = act;
    try { var st = w.carteStats(); out.m = st.margePond; out.i = w.scoreCarte(st).total; } catch (e) {} finally { d.plats = P; }
    return out;
  }
  function avantApres(i0, m0) {
    var s1 = statsCarte(), i1 = s1.i, m1 = s1.m;
    return '<span class="c251-k">Indice Carte <b>' + (i0 == null ? '—' : i0) + ' → ' + (i1 == null ? '—' : i1) + '</b></span><span class="c251-k">Il reste <b>' + pct(m0, 1) + ' → ' + pct(m1, 1) + '</b> une fois les produits payés</span>';
  }
  function bandeauVera(corr) {
    var x = corr[corr.length - 1], p = x.p, c = x.c;
    bandeau('<b>« ' + esc(p.nom) + ' » ajouté dans sa version la plus rentable</b><p>' + esc(texteCorrection(p, c)) + '</p>', [
      { t: 'Garder la version d’origine', f: function () { p = vivant(p); var a = c.avant; p.ttc = a.ttc; p.pfttc = a.pfttc; p.rec = a.rec; delete p.cpC251; w.save('c251-garder'); rafraichir(); bandeau('<b>« ' + esc(p.nom) + ' » revient à ' + esc(eur(a.ttc)) + '</b><p>Il reste ' + esc(pct(a.pct)) + ' une fois les produits payés, sous l’objectif de ' + esc(pct(c.obj)) + '. Verdict conseillait : ' + esc(texteCorrection(p, c)) + ' Ce conseil reste dans l’historique.</p>'); } },
      c.ok ? null : { t: 'Retirer ce plat', f: function () { retirer(p, true); } }
    ].filter(Boolean));
  }

  /* ── 1. La croix : retirer un plat en un geste ─────────────────────────────────────────────────────────────────── */
  function retirer(p, direct) {
    function faire() {
      p = vivant(p); if (!actif(p)) return; var s0 = statsCarte(), i0 = s0.i, m0 = s0.m, pm = parMois(p);
      var A = w.VerdictCarteAtelier;
      croix = true;
      try { if (A && typeof A.withdraw === 'function') A.withdraw([p.id]); else { p.cpArchived = true; p.cpArchivedAt = new Date().toISOString(); w.save('c251-croix'); } } finally { croix = false; }
      rafraichir();
      bandeau('<b>« ' + esc(p.nom) + ' » retiré de la carte</b><div class="c251-kk">' + avantApres(i0, m0) + '</div><p>' + (pm != null ? 'Il laissait ' + esc(eur(pm, 0)) + ' par mois une fois les produits payés. Calcul fait si 7 de ses clients sur 10 prennent un autre plat de la catégorie. ' : '') + 'Il reste dans l’historique : vous pouvez le remettre en un clic.</p>', [{ t: 'Annuler', pri: true, f: function () { remettre(p); } }]);
    }
    if (direct || typeof w.ask !== 'function') return faire();
    var pm = parMois(p);
    w.ask('Retirer « ' + p.nom + ' » de la carte ?', (pm != null ? 'Il laisse ' + eur(pm, 0) + ' par mois une fois les produits payés. ' : '') + 'Verdict recalcule toute la carte aussitôt ; le plat reste dans l’historique et se remet en un clic.', 'Retirer', faire, true);
  }
  function remettre(p, trace) {
    p = vivant(p); var d = D(), s0 = statsCarte(), i0 = s0.i, m0 = s0.m;
    delete p.cpArchived; delete p.cpArchivedAt; delete p.cpFrozenCost;
    if (trace) { enregistrer('c251-remettre'); rafraichir(); bandeau('<b>« ' + esc(p.nom) + ' » est de nouveau à la carte</b><div class="c251-kk">' + avantApres(i0, m0) + '</div>'); return; }
    var J = d && d.carteJournal; if (Array.isArray(J)) for (var i = J.length - 1; i >= 0; i--) if (J[i].type === 'retrait' && J[i].id === p.id) { J.splice(i, 1); break; }
    var H = d && d.cpMenuHistory, h = Array.isArray(H) && H[H.length - 1]; if (h && h.removedIds && h.removedIds.length === 1 && h.removedIds[0] === p.id) H.pop();
    if (SNAP && d) SNAP.set(d, photo(d));
    enregistrer('c251-annuler'); rafraichir();
    bandeau('<b>« ' + esc(p.nom) + ' » est de nouveau à la carte</b><div class="c251-kk">' + avantApres(i0, m0) + '</div>');
  }
  function decorer() {
    var list = doc.getElementById('cp-menu-list'); if (!list) return;
    var d = D(); if (!d) return;
    [].forEach.call(list.querySelectorAll('button.cp-dish[data-cp-dish]'), function (b) {
      if (b.parentNode && b.parentNode.classList && b.parentNode.classList.contains('c251-row')) return;
      var p = platById(d, b.getAttribute('data-cp-dish')); if (!p || !actif(p)) return;
      var r = doc.createElement('div'); r.className = 'c251-row'; b.parentNode.insertBefore(r, b); r.appendChild(b);
      var x = doc.createElement('button'); x.type = 'button'; x.className = 'c251-croix'; x.setAttribute('data-c251-retirer', p.id);
      x.setAttribute('aria-label', 'Retirer « ' + p.nom + ' » de la carte'); x.title = 'Retirer de la carte'; x.textContent = '×'; r.appendChild(x);
    });
    var act = doc.querySelector('#c-menu .cp-actions');
    if (act && !act.querySelector('[data-c251-hist]')) {
      var g = doc.createElement('button'); g.type = 'button'; g.className = 'cp-button'; g.setAttribute('data-c251-geste', ''); g.textContent = '⚡ Ajout en un geste'; act.appendChild(g);
      var h = doc.createElement('button'); h.type = 'button'; h.className = 'cp-button'; h.setAttribute('data-c251-hist', ''); h.textContent = '🕘 Historique'; act.appendChild(h);
    }
  }

  /* ── 2. Fiche Vera : la correction est visible avant même l'ajout ──────────────────────────────────────────────── */
  function lireEur(s) { var m = String(s || '').replace(/ | /g, ' ').match(/-?[\d ]+(,\d+)?/); return m ? num(m[0].replace(/ /g, '')) : null; }
  function annoterVera() {
    [].forEach.call(doc.querySelectorAll('.vc-out .vc-card:not([data-c251])'), function (card) {
      card.setAttribute('data-c251', '1');
      var why = card.querySelector('.vc-why'), mo = why && why.textContent.match(/sous l’objectif (\d+(?:,\d+)?)/); if (!mo) return;
      var vu = card.querySelector('[data-open]'), pa = vu && platById(D(), vu.getAttribute('data-open'));
      if (pa) {
        var cp = prixConseille(pa); if (!(cp > 0) || cp <= num(pa.ttc)) return; var kc = calc(prixAvec(pa, cp)), el0 = doc.createElement('div'); el0.className = 'c251-vera';
        el0.innerHTML = '✓ <b>Prix conseillé ' + esc(eur(cp)) + '</b> au lieu de ' + esc(eur(num(pa.ttc))) + ' : il reste ' + esc(pct(kc.contribPct)) + ' une fois les produits payés (' + esc(eur(kc.contribPond)) + ' par vente), objectif atteint. <button type="button" class="c251-b c251-p" data-c251-prix="' + esc(pa.id) + '" data-c251-val="' + cp + '">Passer à ' + esc(eur(cp)) + '</button>';
        card.insertBefore(el0, card.querySelector('.vc-act') || null); return;
      }
      if (!card.querySelector('[data-add]')) return;
      var kp = {}; [].forEach.call(card.querySelectorAll('.vc-kpi span'), function (s) { var b = s.querySelector('b'); if (b) kp[s.firstChild && String(s.firstChild.textContent).trim()] = lireEur(b.firstChild ? b.firstChild.textContent : b.textContent); });
      var prix = kp['Prix'], cout = kp['Coût matière'], ctb = kp['Contribution'], obj = num(mo[1]);
      if (!(prix > 0) || !(cout >= 0) || ctb == null || !(obj > 0 && obj < 100)) return;
      var ratio = prix / (ctb + cout), cons = Math.ceil(cout / (1 - obj / 100) * ratio * 10 - 1e-9) / 10, plafond = Math.ceil(prix * 1.15 * 10 - 1e-9) / 10;
      var el = doc.createElement('div'); el.className = 'c251-vera';
      if (cons <= plafond) { var ht = cons / ratio; el.innerHTML = '✓ <b>Prix conseillé ' + esc(eur(cons)) + '</b> au lieu de ' + esc(eur(prix)) + ' : il reste ' + esc(pct((ht - cout) / ht * 100)) + ' une fois les produits payés (' + esc(eur(ht - cout)) + ' par vente), objectif atteint. « Ajouter à ma carte » l’ajoute à ce prix.'; }
      else el.innerHTML = '✓ <b>Version corrigée prête</b> : prix ' + esc(eur(plafond)) + ' (+15 % au plus) et portion de l’ingrédient le plus cher ajustée. Le détail et l’effet en euros s’affichent à l’ajout ; la version d’origine reste à un clic.';
      var act = card.querySelector('.vc-act'); card.insertBefore(el, act || null);
    });
  }

  /* ── Fenêtres ──────────────────────────────────────────────────────────────────────────────────────────────────── */
  function fermer(id) { var m = doc.getElementById(id); if (m && m.parentNode) m.parentNode.removeChild(m); }
  function fenetre(id, inner) {
    fermer(id); style();
    var m = doc.createElement('div'); m.className = 'modal on c251-m'; m.id = id; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="sheet c251"><div class="grab"></div><button type="button" class="c251-x" data-c251-close aria-label="Fermer">×</button>' + inner + '</div>';
    m.addEventListener('click', function (e) { if (e.target === m || (e.target.closest && e.target.closest('[data-c251-close]'))) fermer(id); });
    doc.body.appendChild(m); try { w.a11yDialogPrepare && w.a11yDialogPrepare(m); } catch (e) {}
    /* La fenêtre reçoit la croix commune de l'appli (posée juste après) : la nôtre ne sert que si elle manque. */
    [0, 120].forEach(function (ms) { setTimeout(function () { var x2 = m.querySelector('.sh-fermer'), x1 = m.querySelector('.sheet > .c251-x'); if (x2 && x1) x1.parentNode.removeChild(x1); }, ms); });
    return m;
  }

  /* ── 3. Historique ─────────────────────────────────────────────────────────────────────────────────────────────── */
  function totalMois() { var t = 0; (D().plats || []).forEach(function (p) { if (actif(p)) { var v = parMois(p); if (v) t += v; } }); return t; }
  function prixProduits() {
    var d = D(), out = [], limite = Date.now() - 180 * 864e5;
    (d.ing || []).forEach(function (g) {
      if (!g || !g.nom) return;
      (g.prixHist || []).forEach(function (h) { var t = Date.parse(h.at || h.date); if (isFinite(t) && t >= limite && h.ancien > 0 && h.prix > 0 && Math.abs(h.prix / h.ancien - 1) > 0.005) out.push({ t: t, g: g, de: h.ancien, a: h.prix, four: h.fournisseur, date: h.date || h.at }); });
      var H = d.prixHist && d.prixHist[g.nom]; if (Array.isArray(H)) for (var i = 1; i < H.length; i++) { var t2 = Date.parse(H[i].d); if (isFinite(t2) && t2 >= limite && H[i - 1].pu > 0 && H[i].pu > 0 && Math.abs(H[i].pu / H[i - 1].pu - 1) > 0.005 && !out.some(function (o) { return o.g === g && String(o.date).slice(0, 10) === String(H[i].d).slice(0, 10); })) out.push({ t: t2, g: g, de: H[i - 1].pu, a: H[i].pu, four: H[i].four, date: H[i].d }); }
    });
    out.sort(function (a, b) { return b.t - a.t; }); out = out.slice(0, 12);
    var base = totalMois();
    out.forEach(function (o) { var g = o.g, p0 = g.prix; try { g.prix = p0 * o.de / o.a; o.effet = base - totalMois(); } finally { g.prix = p0; } });
    return out;
  }
  function ligneEv(e) {
    var q = '« ' + esc(e.nom) + ' »', t = '', eff = '', btn = '';
    if (e.groupe) t = (e.type === 'ajout' ? 'Ajoutés' : 'Retirés') + ' : ' + e.groupe + ' plats (' + esc(e.noms.join(', ')) + (e.groupe > e.noms.length ? '…' : '') + ')';
    else if (e.type === 'ajout' || e.type === 'reprise') { t = (e.type === 'ajout' ? 'Ajouté' : 'Remis à la carte') + ' : ' + q + (e.prix ? ' à ' + esc(eur(e.prix)) : '') + (e.vera ? ' · proposé par Vera' : ''); eff = e.effet != null ? mois(e.effet) : e.parVente != null ? 'il reste ' + eur(e.parVente) + ' par vente (' + pct(e.pct) + ')' : ''; }
    else if (e.type === 'retrait') { t = 'Retiré : ' + q; eff = e.effet != null ? 'il laissait ' + eur(-e.effet, 0) + ' par mois' : ''; var pr = platById(D(), e.id); if (pr && pr.cpArchived && !e.__vu) { e.__vu = 1; btn = ' <button type="button" class="c251-b" data-c251-remettre="' + esc(e.id) + '">Remettre à la carte</button>'; } }
    else if (e.type === 'prix') { t = 'Prix : ' + q + ' ' + esc(eur(e.avant)) + ' → ' + esc(eur(e.apres)); eff = e.effet != null ? mois(e.effet) : e.parVente != null ? (e.parVente >= 0 ? '+' : '−') + eur(Math.abs(e.parVente)) + ' par vente' : ''; }
    else if (e.type === 'suppression') t = 'Supprimé : ' + q;
    var ton = e.type === 'retrait' || e.type === 'suppression' ? 'r' : e.type === 'prix' ? (e.effet != null ? (e.effet >= 0 ? 'v' : 'r') : (e.parVente >= 0 ? 'v' : 'r')) : 'v';
    return '<li class="c251-ev"><span class="c251-d">' + esc(dateCourte(e.at)) + '<small>' + esc(heure(e.at)) + '</small></span><span class="c251-t">' + t + (eff ? ' <b class="c251-' + ton + '">' + esc(eff) + '</b>' : '') + (e.par && e.par !== 'Vera' ? ' <small>· ' + esc(e.par) + '</small>' : '') + (e.corr ? '<small class="c251-corr">Verdict a corrigé : ' + esc(e.corr) + '</small>' : '') + btn + '</span></li>';
  }
  function ouvrirHistorique() {
    var d = D(); if (!d) return;
    var J = (Array.isArray(d.carteJournal) ? d.carteJournal : []).slice();
    (d.plats || []).forEach(function (p) { if (p && p.cpArchived && p.cpArchivedAt && !J.some(function (e) { return e.id === p.id && e.type === 'retrait'; })) J.push({ at: p.cpArchivedAt, type: 'retrait', id: p.id, nom: p.nom, cat: p.cat }); });
    J = J.map(function (e) { var c = {}; for (var k in e) c[k] = e[k]; return c; });
    J.sort(function (a, b) { return Date.parse(b.at) - Date.parse(a.at); });
    var vus = {}; J.forEach(function (e) { if (e.type === 'retrait' && e.id) { if (vus[e.id]) e.__vu = 1; vus[e.id] = 1; } });
    var bilan = 0, nb30 = 0, lim = Date.now() - 30 * 864e5; J.forEach(function (e) { if (Date.parse(e.at) >= lim) { nb30++; if (e.type === 'prix' && e.effet != null) bilan += e.effet; } });
    var P = []; try { P = prixProduits(); } catch (e) {}
    var o = ordre() || [], ev = []; try { ev = (w.STORE.c251Etabs || []).slice().reverse(); } catch (e) {}
    var html = '<h3>Historique de la carte</h3><p class="c251-sub">Ce qui a changé, quand, et ce que cela change en euros chaque mois (reste après produits, avec vos ventes).</p>' +
      '<section><h4>Plats et prix</h4>' + (J.length ? (nb30 ? '<p class="c251-sub">30 derniers jours : ' + nb30 + ' changement' + (nb30 > 1 ? 's' : '') + (bilan ? ', changements de prix ' + esc(mois(bilan)) : '') + '.</p>' : '') + '<ul class="c251-evs">' + J.slice(0, 80).map(ligneEv).join('') + '</ul>' : '<p class="c251-vide">Rien encore : chaque ajout, retrait ou changement de prix s’inscrira ici avec sa date et son effet.</p>') + '</section>' +
      '<section><h4>Prix de vos produits (factures)</h4>' + (P.length ? '<ul class="c251-evs">' + P.map(function (x) { var u = x.g.type === 'UNITE' ? ' la pièce' : x.g.type === 'L' ? ' le litre' : ' le kilo'; return '<li class="c251-ev"><span class="c251-d">' + esc(dateCourte(x.date)) + '</span><span class="c251-t">' + esc(x.g.nom) + ' : ' + esc(eur(x.de)) + ' → ' + esc(eur(x.a)) + esc(u) + (x.four ? ' <small>· ' + esc(x.four) + '</small>' : '') + (x.effet != null && Math.abs(x.effet) >= 0.5 ? ' <b class="c251-' + (x.effet >= 0 ? 'v' : 'r') + '">' + esc(mois(x.effet)) + ' sur la carte</b>' : '') + '</span></li>'; }).join('') + '</ul>' : '<p class="c251-vide">Aucun changement de prix relevé sur vos factures ces 6 derniers mois.</p>') + '</section>' +
      '<section><h4>Vos établissements</h4><ul class="c251-evs">' + o.map(function (id) {
        var e = w.STORE.etabs[id] || {}, n = (e.plats || []).filter(actif).length, j = Array.isArray(e.carteJournal) ? e.carteJournal.length : 0;
        var cree = e._duplicatedFrom && e._duplicatedFrom.at, m = /^e([0-9a-z]{8})/.exec(id), t = m ? parseInt(m[1], 36) : null; if (!cree && t > 1577836800000 && t < 4102444800000) cree = new Date(t).toISOString();
        return '<li class="c251-ev"><span class="c251-d">' + esc(cree ? dateCourte(cree) : '') + '</span><span class="c251-t"><b>' + esc(nomEtab(id)) + '</b>' + (id === w.STORE.actif ? ' <small>· ouvert</small>' : '') + ' · ' + n + ' plat' + (n > 1 ? 's' : '') + ' à la carte' + (e._duplicatedFrom ? ' · créé à partir de « ' + esc(e._duplicatedFrom.name || '') + ' »' : '') + (j ? ' · ' + j + ' changement' + (j > 1 ? 's notés' : ' noté') : '') + '</span></li>';
      }).join('') + ev.filter(function (x) { return x.type === 'retrait'; }).slice(0, 10).map(function (x) { return '<li class="c251-ev"><span class="c251-d">' + esc(dateCourte(x.at)) + '</span><span class="c251-t">Établissement retiré</span></li>'; }).join('') + '</ul></section>';
    fenetre('c251-hist', html);
  }

  /* ── 4. Ajout en un geste ──────────────────────────────────────────────────────────────────────────────────────── */
  var G = null;
  function mots(s) { var F = w.VerdictFichesTypes, n = F ? F.norm(s) : String(s || '').toLowerCase(); return n.split(' ').filter(function (m) { return m.length > 2 && !/^(les|des|aux|avec|sur|une|par|maison|du|de|la|le)$/.test(m); }); }
  function categories() { var d = D(), c = []; (d.plats || []).forEach(function (p) { if (actif(p) && p.cat && c.indexOf(p.cat) < 0 && !/formule|menu/i.test(p.cat)) c.push(p.cat); }); ['Entrées', 'Plats', 'Desserts', 'Boissons'].forEach(function (x) { if (c.indexOf(x) < 0) c.push(x); }); return c; }
  function tvaPour(cat, fiche) { if (fiche && fiche.tva != null) return fiche.tva; var p = (D().plats || []).filter(function (x) { return actif(x) && x.cat === cat && num(x.tva) != null; })[0]; if (p) return num(p.tva); return /alcool|vin|biere|bière|cocktail|spiritueux|champagne/i.test(cat || '') ? 20 : 10; }
  function deviner(nom, cat) {
    var F = w.VerdictFichesTypes, d = D(), out = { rec: [], preps: [], nouveaux: [], source: '', variable: false };
    if (F && F.variable(nom)) { out.variable = true; return out; }
    var f = F ? F.trouver(nom) : null, m = mots(nom), best = null, sc = 0;
    (d.plats || []).forEach(function (p) { if (!actif(p) || !p.rec || !p.rec.length) return; var s = 0, pm = mots(p.nom); m.forEach(function (x) { if (pm.indexOf(x) >= 0) s += 2; }); if (s && p.cat === cat) s += 1; if (s > sc) { sc = s; best = p; } });
    /* Un plat de la carte du même genre (« Burger de la brasserie » pour « Burger maison ») garde vos vrais produits et vos
       vrais prix : il passe avant la fiche type quand celle-ci ajouterait des produits au prix type. */
    var GEN = /^(salade|salades|assiette|plat|tarte|soupe|creme|pave|filet|portion|verre|menu|formule)$/;
    var meme = best && f && mots(best.nom).some(function (x) { return !GEN.test(x) && m.indexOf(x) >= 0 && mots(f.nom).indexOf(x) >= 0; });
    if (f && !meme) {
      out.fiche = f; out.source = 'Recette habituelle « ' + f.nom + ' » avec vos produits, à vérifier';
      f.rec.forEach(function (l) {
        var n = F.dansCatalogue(l[0], d.ing);
        if (!n) { var t = F.produit(l[0]); if (!t) return; n = t.nom; if (!out.nouveaux.some(function (x) { return x.nom === n; })) out.nouveaux.push({ id: 'ft-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nom: t.nom, type: t.type, prix: t.prix, perte: t.perte, prixSource: 'type', cpPrixType: true, cpCreatedAt: new Date().toISOString() }); }
        out.rec.push([n, l[1]]);
      });
      if (!out.nouveaux.length || !proche()) return out;
      out = { rec: [], preps: [], nouveaux: [], source: '', variable: false };
    }
    /* Sans mot propre en commun (« salade » seul ne suffit pas), Verdict ne recopie pas une recette : un seul chiffre suffit. */
    function proche() { return !!best && mots(best.nom).some(function (x) { return !GEN.test(x) && m.indexOf(x) >= 0; }); }
    if (proche()) { out.proche = best; out.fiche = null; out.source = 'Recette reprise de « ' + best.nom + ' », à ajuster'; out.rec = best.rec.map(function (l) { return l.slice(); }); out.preps = (best.preps || []).map(function (l) { return l.slice(); }); }
    return out;
  }
  function avecTemp(nouveaux, fn) { var I = D().ing; nouveaux.forEach(function (g) { I.push(g); }); try { return fn(); } finally { nouveaux.forEach(function (g) { var i = I.indexOf(g); if (i >= 0) I.splice(i, 1); }); } }
  function brouillon() {
    var nom = G.nom.trim(), cat = G.cat, rec = G.rec.filter(function (l) { return num(l[1]) > 0; }), nouveaux = G.nouveaux.slice();
    if (G.portion) { var cp = num(G.portion); if (cp > 0) { var g = { id: 'c251-' + Date.now().toString(36), nom: 'Portion · ' + nom, type: 'UNITE', prix: cp, perte: 0, cpPortion: true, prixSource: 'saisie' }; nouveaux.push(g); rec = [[g.nom, 1]]; } }
    return { p: { id: 'qp-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nom: nom, cat: cat, esp: G.esp || (/boisson|bar|vin|biere|bière|alcool/i.test(cat) ? 'bar' : 'cuisine'), ttc: num(G.prix) || null, tva: G.tva, vol: null, rec: rec, preps: G.preps.slice(), pf: false, pfttc: null, pfshare: 0, pq: [], cpExplicitRecipe: true, cpRapide: { at: new Date().toISOString(), source: G.source || 'saisie' } }, nouveaux: nouveaux };
  }
  function chiffrer() {
    var b = brouillon(); if (!b.p.nom || !b.p.rec.length) return null;
    return avecTemp(b.nouveaux, function () {
      var p0 = prixAvec(b.p, num(G.prix) > 0 ? num(G.prix) : 10), k = calc(p0); if (!(k.cout >= 0)) return null;
      var cons = prixConseille(p0), kc = cons ? calc(prixAvec(p0, cons)) : null, prix = num(G.prix), kp = prix > 0 ? calc(prixAvec(p0, prix)) : null;
      return { b: b, cout: k.cout, obj: k.objPond, cons: cons, kc: kc, prix: prix, kp: kp };
    });
  }
  function resultat() {
    var el = doc.getElementById('c251-res'), go = doc.getElementById('c251-ok'); if (!el) return;
    var r = null; try { r = chiffrer(); } catch (e) {}
    if (!r) { el.innerHTML = G.nom.trim() ? '<p class="c251-sub">' + (G.variable || !G.rec.length ? 'Indiquez le coût des produits d’une portion : Verdict calcule le prix conseillé.' : 'Il manque une quantité.') + '</p>' : ''; go.disabled = true; go.textContent = 'Ajouter à ma carte'; return; }
    if (!(num(G.prix) > 0) && r.cons) { G.prix = r.cons.toFixed(2).replace('.', ','); var ip = doc.getElementById('c251-prix'); if (ip) ip.value = G.prix; r = chiffrer(); }
    var ok = okMarge(r.kp), h = '<div class="c251-kk"><span class="c251-k">Coût des produits <b>' + esc(eur(r.cout)) + '</b> par portion</span><span class="c251-k">Prix conseillé <b>' + esc(eur(r.cons)) + '</b></span></div>';
    if (r.kp && r.kp.complete) h += '<p class="c251-' + (ok ? 'v' : 'r') + '"><b>À ' + esc(eur(r.prix)) + ' : il reste ' + esc(eur(r.kp.contribPond)) + ' par vente (' + esc(pct(r.kp.contribPct)) + ')</b>' + (ok ? ', objectif de ' + esc(pct(r.obj)) + ' atteint.' : ', sous l’objectif de ' + esc(pct(r.obj)) + '. À ' + esc(eur(r.cons)) + ', il resterait ' + esc(eur(r.kc && r.kc.contribPond)) + ' par vente : <button type="button" class="c251-lien" data-c251-cons>prendre le prix conseillé</button>') + '</p>';
    if (r.b.nouveaux.length && !G.portion) h += '<p class="c251-sub">Ajouté au catalogue avec un prix type, remplacé ensuite par vos factures : ' + esc(r.b.nouveaux.map(function (g) { return g.nom; }).join(', ')) + '.</p>';
    el.innerHTML = h; go.disabled = !(r.prix > 0); go.textContent = 'Ajouter à ma carte à ' + eur(r.prix);
  }
  function lignes() {
    var el = doc.getElementById('c251-rec'); if (!el) return;
    if (G.variable || !G.rec.length) {
      el.innerHTML = '<p class="c251-sub">' + (G.variable ? 'Ce plat change chaque jour : un seul chiffre suffit.' : G.nom.trim() ? 'Verdict ne reconnaît pas encore ce plat : un seul chiffre suffit, la recette peut se compléter ensuite.' : '') + '</p>' + (G.nom.trim() ? '<label class="c251-f"><span>Coût des produits pour une portion (€ HT)</span><input id="c251-portion" inputmode="decimal" placeholder="ex. 4,20" value="' + esc(G.portion || '') + '"></label>' : '');
      return;
    }
    var I = D().ing || [], F = w.VerdictFichesTypes;
    el.innerHTML = '<p class="c251-sub">' + esc(G.source) + '</p><ul class="c251-lignes">' + G.rec.map(function (l, i) {
      var g = I.filter(function (x) { return x.nom === l[0]; })[0] || G.nouveaux.filter(function (x) { return x.nom === l[0]; })[0] || (F && F.produit(l[0])), t = g ? String(g.type || 'KG').toUpperCase() : 'KG';
      return '<li><span>' + esc(l[0]) + '</span><input data-c251-q="' + i + '" inputmode="decimal" value="' + esc(String(l[1]).replace('.', ',')) + '" aria-label="Quantité de ' + esc(l[0]) + '"><em>' + (t === 'UNITE' ? 'pièce' : t === 'L' ? 'ml' : 'g') + '</em><button type="button" class="c251-moins" data-c251-suppr="' + i + '" aria-label="Enlever ' + esc(l[0]) + '">×</button></li>';
    }).join('') + '</ul>';
  }
  var attente = null;
  function surNom() {
    var r = deviner(G.nom, G.cat);
    G.rec = r.rec; G.preps = r.preps; G.nouveaux = r.nouveaux; G.source = r.source; G.variable = r.variable; G.esp = r.fiche ? r.fiche.esp : (r.proche && r.proche.esp) || null;
    if (!G.catChoisie) { var c = r.fiche ? r.fiche.cat : r.proche ? r.proche.cat : null; if (c) { G.cat = c; var s = doc.getElementById('c251-cat'); if (s) { if (![].some.call(s.options, function (o) { return o.value === c; })) { var o = doc.createElement('option'); o.value = o.textContent = c; s.appendChild(o); } s.value = c; } } }
    G.tva = tvaPour(G.cat, r.fiche); var t = doc.getElementById('c251-tva'); if (t) t.value = String(G.tva);
    if (!G.prixChoisi) { G.prix = ''; var ip = doc.getElementById('c251-prix'); if (ip) ip.value = ''; }
    lignes(); resultat();
  }
  function ouvrirGeste() {
    if (!D()) return;
    G = { nom: '', cat: categories()[0], rec: [], preps: [], nouveaux: [], source: '', prix: '', tva: 10, catChoisie: false, prixChoisi: false };
    var cats = categories(); G.cat = cats.indexOf('Plats') >= 0 ? 'Plats' : cats[0]; G.tva = tvaPour(G.cat);
    var m = fenetre('c251-geste', '<h3>Ajouter un plat en un geste</h3><p class="c251-sub">Tapez son nom : Verdict reconnaît le plat, reprend vos produits, calcule le coût et le prix conseillé. Vous corrigez si besoin.</p>' +
      '<label class="c251-f"><span>Nom du plat</span><input id="c251-nom" autocomplete="off" placeholder="ex. Burger maison, Crème brûlée, Pavé de saumon"></label>' +
      '<div class="c251-2"><label class="c251-f"><span>Catégorie</span><select id="c251-cat">' + cats.map(function (c) { return '<option' + (c === G.cat ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
      '<label class="c251-f"><span>TVA</span><select id="c251-tva">' + [5.5, 10, 20].map(function (t) { return '<option value="' + t + '"' + (t === G.tva ? ' selected' : '') + '>' + nb(t, t % 1 ? 1 : 0) + ' %</option>'; }).join('') + '</select></label></div>' +
      '<div id="c251-rec"></div><label class="c251-f"><span>Prix de vente TTC</span><input id="c251-prix" inputmode="decimal" placeholder="calculé pour vous"></label><div id="c251-res" aria-live="polite"></div>' +
      '<button type="button" class="c251-b c251-p c251-large" id="c251-ok" disabled>Ajouter à ma carte</button><button type="button" class="c251-lien" data-c251-detail>Saisie détaillée (plat du jour sur devis fournisseur)</button>');
    var nom = m.querySelector('#c251-nom');
    m.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'c251-nom') { G.nom = t.value; clearTimeout(attente); attente = setTimeout(surNom, 220); }
      else if (t.id === 'c251-prix') { G.prix = t.value; G.prixChoisi = !!t.value.trim(); resultat(); }
      else if (t.id === 'c251-portion') { G.portion = t.value; resultat(); }
      else if (t.hasAttribute('data-c251-q')) { var i = +t.getAttribute('data-c251-q'), v = num(t.value); if (G.rec[i]) G.rec[i][1] = v == null ? 0 : v; resultat(); }
    });
    m.addEventListener('change', function (e) {
      var t = e.target;
      if (t.id === 'c251-cat') { G.cat = t.value; G.catChoisie = true; G.tva = tvaPour(G.cat, null); doc.getElementById('c251-tva').value = String(G.tva); if (G.nom.trim()) surNom(); }
      else if (t.id === 'c251-tva') { G.tva = num(t.value); resultat(); }
    });
    m.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
      if (t.hasAttribute('data-c251-suppr')) { G.rec.splice(+t.getAttribute('data-c251-suppr'), 1); lignes(); resultat(); }
      else if (t.hasAttribute('data-c251-cons')) { var r = chiffrer(); if (r && r.cons) { G.prix = r.cons.toFixed(2).replace('.', ','); G.prixChoisi = true; doc.getElementById('c251-prix').value = G.prix; resultat(); } }
      else if (t.hasAttribute('data-c251-detail')) { fermer('c251-geste'); try { w.VerdictCartePages.open('quick'); } catch (er) {} }
      else if (t.id === 'c251-ok') ajouter();
    });
    setTimeout(function () { try { nom.focus(); } catch (e) {} }, 60);
  }
  function ajouter() {
    var r = chiffrer(); if (!r || !(r.prix > 0)) return;
    var d = D(), b = r.b, s0 = statsCarte(), i0 = s0.i, m0 = s0.m;
    b.nouveaux.forEach(function (g) { if (!(d.ing || []).some(function (x) { return x.nom === g.nom; })) d.ing.push(g); });
    b.p.ttc = r.prix; d.plats.push(b.p);
    try { w.save('carte-ajout-rapide'); } catch (e) {}
    fermer('c251-geste'); rafraichir();
    var k = calc(b.p), ok = okMarge(k);
    bandeau('<b>« ' + esc(b.p.nom) + ' » ajouté à ' + esc(eur(r.prix)) + '</b><p>Il reste ' + esc(eur(k.contribPond)) + ' par vente (' + esc(pct(k.contribPct)) + ')' + (ok ? ', objectif atteint.' : ' : à ' + esc(eur(r.cons)) + ', l’objectif serait atteint.') + ' Ses ventes arriveront avec votre caisse.</p><div class="c251-kk">' + avantApres(i0, m0) + '</div>', [
      ok || !r.cons ? null : { t: 'Passer à ' + eur(r.cons), pri: true, f: function () { b.p = vivant(b.p); setPrix(b.p, r.cons); w.save('carte-ajout-rapide'); rafraichir(); bandeau('<b>« ' + esc(b.p.nom) + ' » passe à ' + esc(eur(r.cons)) + '</b><p>Objectif atteint : il reste ' + esc(eur(calc(b.p).contribPond)) + ' par vente.</p>'); } },
      { t: 'Ouvrir la fiche', f: function () { try { w.openPlat(b.p.id); } catch (e) {} } }
    ].filter(Boolean));
  }

  /* ── Clics, style, démarrage ───────────────────────────────────────────────────────────────────────────────────── */
  doc.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-c251-retirer],[data-c251-remettre],[data-c251-hist],[data-c251-geste],[data-c251-prix],#c-menu [data-cp-add],#c251-bandeau button') : null; if (!t) return;
    if (t.hasAttribute('data-c251-remettre')) { e.preventDefault(); var pr = platById(D(), t.getAttribute('data-c251-remettre')); if (pr && pr.cpArchived) { fermer('c251-hist'); remettre(pr, true); } return; }
    if (t.hasAttribute('data-c251-prix')) {
      e.preventDefault(); var pp = platById(D(), t.getAttribute('data-c251-prix')), v = num(t.getAttribute('data-c251-val')); if (!pp || !(v > 0)) return;
      var av = num(pp.ttc), ka = calc(pp); setPrix(pp, v); w.save('c251-prix-conseille'); rafraichir(); var kb = calc(pp), vv = vol(pp);
      t.disabled = true; t.textContent = 'Prix passé à ' + eur(v) + ' ✓';
      bandeau('<b>« ' + esc(pp.nom) + ' » passe de ' + esc(eur(av)) + ' à ' + esc(eur(v)) + '</b><p>Il reste ' + esc(eur(kb.contribPond)) + ' par vente au lieu de ' + esc(eur(ka.contribPond)) + (vv ? ', soit ' + esc(mois((kb.contribPond - ka.contribPond) * vv)) + ' à ventes égales' : '') + '.</p>', [{ t: 'Revenir à ' + eur(av), f: function () { pp = vivant(pp); setPrix(pp, av); w.save('c251-garder'); rafraichir(); } }]);
      return;
    }
    if (t.hasAttribute('data-c251-retirer')) { e.preventDefault(); e.stopPropagation(); var p = platById(D(), t.getAttribute('data-c251-retirer')); if (p && actif(p)) retirer(p); }
    else if (t.hasAttribute('data-c251-hist')) { e.preventDefault(); ouvrirHistorique(); }
    else if (t.hasAttribute('data-c251-geste') || t.hasAttribute('data-cp-add')) { e.preventDefault(); e.stopPropagation(); ouvrirGeste(); }
    else { var b = doc.getElementById('c251-bandeau'); if (t.hasAttribute('data-c251-fermer')) { b.hidden = true; return; } var a = b.__act && b.__act[+t.getAttribute('data-c251-act')]; b.hidden = true; if (a && a.f) a.f(); }
  }, true);
  var CL = '{background:#ffffff!important;background-image:none!important;border-color:#d5dde5!important;box-shadow:0 18px 48px rgba(16,24,40,.18)!important;color:#14202b}';
  function style() {
    if (doc.getElementById('c251-style')) return;
    var st = doc.createElement('style'); st.id = 'c251-style';
    st.textContent =
      '.c251-row{position:relative;display:block}.c251-row>.cp-dish{width:100%}' +
      /* Quatre boutons sous « Ma carte » : deux par ligne sur téléphone. */
      '@media (max-width:640px){#c-menu .cp-actions>.cp-button{flex:1 1 calc(50% - 5px)}}' +
      '.c251-croix{position:absolute;top:-7px;right:-7px;width:26px;height:26px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:var(--card,#1b2129);color:inherit;font:700 16px/22px system-ui,sans-serif;cursor:pointer;opacity:.82;z-index:2;padding:0}' +
      '.c251-croix:hover,.c251-croix:focus-visible{opacity:1;border-color:#dc2626;color:#dc2626}' +
      '#c251-bandeau{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(560px,calc(100% - 32px));z-index:2147481000;background:var(--card,#1b2129);color:var(--txt,#e8edf2);border:1px solid rgba(22,163,74,.55);border-radius:16px;padding:14px 44px 14px 16px;box-shadow:0 18px 48px rgba(0,0,0,.35);font-size:13.5px;line-height:1.45}' +
      '#c251-bandeau[hidden]{display:none}#c251-bandeau p{margin:6px 0 0}#c251-bandeau .c251-ba{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}' +
      '.c251-x{position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:50%;border:1px solid rgba(128,128,128,.35);background:transparent;color:inherit;font-size:18px;line-height:26px;cursor:pointer;padding:0}' +
      '.c251-kk{display:flex;flex-wrap:wrap;gap:6px 14px;margin:8px 0 2px}.c251-k{font-size:12.5px;opacity:.9}.c251-k b{font-weight:800}' +
      '.c251-b{border:1px solid rgba(128,128,128,.4);background:transparent;color:inherit;border-radius:10px;padding:8px 13px;font:600 13px/1.2 inherit;cursor:pointer}.c251-b.c251-p{background:#16a34a!important;border-color:#16a34a!important;color:#fff!important}' +
      '.c251-large{display:block;width:100%;margin:12px 0 6px;padding:13px;font-size:15px}.c251-large[disabled]{opacity:.45;cursor:default}' +
      '.c251-lien{background:none;border:0;padding:0;color:#2563eb;text-decoration:underline;font:inherit;cursor:pointer}.sheet.c251>.c251-lien{display:block;margin:6px auto 0;font-size:12.5px}' +
      '.sheet.c251{position:relative}.sheet.c251 h3{padding-right:36px}.sheet.c251 h4{font-size:14px;margin:16px 0 8px}.c251-sub{font-size:12.5px;line-height:1.45;opacity:.8;margin:0 0 10px}.c251-vide{font-size:13px;opacity:.75}' +
      '.c251-f{display:block;margin:0 0 10px}.c251-f span{display:block;font-size:12.5px;font-weight:600;margin-bottom:4px;opacity:.85}' +
      '.c251 input,.c251 select{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid rgba(128,128,128,.4);background:rgba(128,128,128,.08);color:inherit;font:inherit;font-size:15px}' +
      '.c251-2{display:grid;grid-template-columns:2fr 1fr;gap:10px}' +
      '.c251-lignes{list-style:none;margin:0 0 10px;padding:0}.c251-lignes li{display:grid;grid-template-columns:1fr 84px 42px 30px;gap:6px;align-items:center;margin:0 0 6px;font-size:13px}.c251-lignes input{padding:7px 8px;font-size:14px;text-align:right}.c251-lignes em{font-style:normal;opacity:.7;font-size:12px}' +
      '.c251-moins{width:28px;height:28px;border-radius:50%;border:1px solid rgba(128,128,128,.35);background:transparent;color:inherit;cursor:pointer;padding:0}' +
      '.c251-v{color:#16a34a}.c251-r{color:#dc2626}#c251-res p{font-size:13px;line-height:1.45;margin:6px 0}' +
      '.c251-evs{list-style:none;margin:0;padding:0}.c251-ev{display:grid;grid-template-columns:78px 1fr;gap:10px;padding:8px 0;border-top:1px solid rgba(128,128,128,.18);font-size:13px;line-height:1.45}' +
      '.c251-d{font-variant-numeric:tabular-nums;opacity:.75;font-size:12px}.c251-d small{display:block;opacity:.8}.c251-ev small{opacity:.75}.c251-corr{display:block;margin-top:3px;color:#16a34a;opacity:1!important}' +
      '.c251-vera{margin:10px 0 0;padding:9px 12px;border-radius:12px;background:rgba(22,163,74,.08);border:1px solid rgba(22,163,74,.35);font-size:12.5px;line-height:1.45}' +
      'html.vd-workspace-light #c251-geste .sheet' + CL + 'html.vd-workspace-light #c251-hist .sheet' + CL +
      'html.vd-workspace-light #c251-bandeau{background:#ffffff;color:#14202b;box-shadow:0 18px 48px rgba(16,24,40,.18)}html.vd-workspace-light .c251-croix{background:#ffffff;color:#14202b}';
    doc.head.appendChild(st);
  }
  var prevu = false;
  function passe() { prevu = false; try { decorer(); annoterVera(); } catch (e) {} }
  function boot(n) {
    style(); var ok = brancherSave(); suivre();
    if (!ok && n > 0) return setTimeout(function () { boot(n - 1); }, 300);
    setInterval(function () { try { brancherSave(); suivre(); } catch (e) {} }, 1500);
    if (typeof MutationObserver === 'function') new MutationObserver(function () { if (!prevu) { prevu = true; setTimeout(passe, 40); } }).observe(doc.body, { childList: true, subtree: true });
    passe();
  }
  if (doc.body) boot(40); else doc.addEventListener('DOMContentLoaded', function () { boot(40); });
  w.VerdictCarteGestes = { prixConseille: prixConseille, corriger: corriger, journaliser: journaliser, historique: ouvrirHistorique, geste: ouvrirGeste, retirer: retirer, remettre: remettre, deviner: deviner, statsCarte: statsCarte };
})();
