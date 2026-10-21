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
