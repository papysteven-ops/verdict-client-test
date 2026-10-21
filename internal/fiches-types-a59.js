/* C192 — Fiches types : la carte vient de la caisse, sans saisie.
   Quand l'export « ventes par article » de la caisse contient un article sans fiche, « Un seul passage » propose une
   fiche type (quantités habituelles d'une brasserie, à vérifier) et ajoute au catalogue les produits manquants avec un
   prix type, que les factures remplacent ensuite. Rien n'est créé sans la validation unique du patron.
   Pas de fiche type pour ce qui change chaque jour (plat du jour, menu, formule) : Verdict demande alors un seul
   chiffre, le coût de la marchandise d'une portion. */
(function (w) {
  'use strict';
  if (w.VerdictFichesTypes) return;
  function norm(s) { return String(s || '').replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae').replace(/Æ/g, 'AE').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }

  /* Produits utilisés par les fiches : [nom, unité, prix HT type, perte %]. Les produits de base existent déjà dans
     tout nouvel établissement ; ceux qui manquent (surtout les boissons) sont ajoutés avec ce prix type. */
  var PRODUITS = [
    ['Bœuf haché 15 %', 'KG', 9.9, 5], ['Bavette de bœuf', 'KG', 15.0, 10], ['Pomme de terre', 'KG', 1.1, 15], ['Frites surgelées', 'KG', 2.0, 0],
    ['Œuf de poule', 'UNITE', 0.25, 0], ['Pavé de saumon', 'KG', 17.0, 5], ['Filet de cabillaud', 'KG', 19.86, 10], ['Poulet fermier', 'KG', 6.5, 15],
    ['Salade verte', 'KG', 3.5, 20], ['Tomate', 'KG', 2.5, 10], ['Pain burger', 'UNITE', 0.3, 0], ['Cheddar tranche', 'KG', 9.0, 0],
    ['Comté râpé', 'KG', 15.0, 0], ['Pain de mie', 'UNITE', 0.15, 0], ['Jambon blanc', 'KG', 10.0, 5], ['Beurre', 'KG', 8.0, 0],
    ['Crème liquide', 'L', 3.99, 0], ['Lardons fumés', 'KG', 8.0, 5], ['Oignon', 'KG', 1.1, 15], ['Chocolat noir', 'KG', 9.0, 0],
    ['Sucre', 'KG', 1.1, 0], ['Crème dessert vanille', 'L', 3.0, 0], ['Anchois/câpres', 'KG', 12.0, 5], ['Parmesan', 'KG', 18.0, 0],
    ['Entrecôte de bœuf', 'KG', 24.0, 5], ['Moules de bouchot', 'KG', 5.5, 8], ['Cuisse de canard confite', 'UNITE', 4.4, 0], ['Sole entière', 'KG', 38.0, 5],
    ['Bûche de chèvre', 'KG', 12.0, 5], ['Pommes fruit', 'KG', 1.8, 10], ['Pâte feuilletée', 'KG', 4.5, 5], ['Café en grains', 'KG', 18.0, 5],
    ['Vin blanc de cuisine', 'L', 4.0, 5],
    ['Lait entier', 'L', 1.10, 5], ['Thé en sachet', 'UNITE', 0.12, 0], ['Soda 33 cl', 'UNITE', 0.62, 0], ['Eau minérale 50 cl', 'UNITE', 0.38, 0],
    ['Jus de fruits 25 cl', 'UNITE', 0.55, 0], ['Bière pression (fût)', 'L', 3.80, 5], ['Vin au verre (cubi)', 'L', 6.40, 3],
    ['Vin bouteille milieu de gamme', 'UNITE', 11.50, 0]
  ];
  var ALC = 20;
  /* [reconnaissance (nom d'article normalisé), fiche type, catégorie, espace, TVA (null = taux de l'établissement), recette].
     L'ordre compte : « café gourmand » avant « café », « bouteille de vin » avant « verre de vin ». */
  var FICHES = [
    [/\boeufs? (durs? )?mayo/, 'Œuf mayonnaise', 'Entrées', 'cuisine', null, [['Œuf de poule', 2], ['Salade verte', 30]]],
    [/soupe (a l )?oignon|gratinee a l oignon/, 'Soupe à l’oignon gratinée', 'Entrées', 'cuisine', null, [['Oignon', 250], ['Comté râpé', 50], ['Pain de mie', 1.5], ['Beurre', 20]]],
    [/chevre chaud/, 'Salade de chèvre chaud', 'Entrées', 'cuisine', null, [['Bûche de chèvre', 100], ['Salade verte', 120], ['Pain de mie', 2], ['Tomate', 60], ['Sucre', 15]]],
    [/cesar|caesar/, 'Salade César poulet', 'Salades', 'cuisine', null, [['Salade verte', 120], ['Poulet fermier', 165], ['Parmesan', 30], ['Anchois/câpres', 10]]],
    [/croque madame/, 'Croque-madame', 'Plats', 'cuisine', null, [['Pain de mie', 2], ['Jambon blanc', 105], ['Comté râpé', 65], ['Beurre', 15], ['Œuf de poule', 1]]],
    [/croque/, 'Croque-monsieur', 'Plats', 'cuisine', null, [['Pain de mie', 2], ['Jambon blanc', 105], ['Comté râpé', 65], ['Beurre', 15]]],
    [/tartare/, 'Tartare de bœuf frites', 'Plats', 'cuisine', null, [['Bavette de bœuf', 210], ['Frites surgelées', 180], ['Oignon', 20], ['Œuf de poule', 1]]],
    [/entrecote/, 'Entrecôte frites', 'Plats', 'cuisine', null, [['Entrecôte de bœuf', 300], ['Frites surgelées', 250], ['Beurre', 25], ['Salade verte', 40]]],
    [/\bsteak\b|bavette|onglet|piece du boucher/, 'Steak frites', 'Plats', 'cuisine', null, [['Bavette de bœuf', 230], ['Frites surgelées', 200]]],
    [/burger/, 'Burger maison frites', 'Plats', 'cuisine', null, [['Bœuf haché 15 %', 180], ['Pain burger', 1], ['Cheddar tranche', 40], ['Salade verte', 20], ['Tomate', 30], ['Frites surgelées', 180]]],
    [/\bmoules?\b/, 'Moules-frites', 'Plats', 'cuisine', null, [['Moules de bouchot', 500], ['Frites surgelées', 250], ['Oignon', 40], ['Vin blanc de cuisine', 60], ['Crème liquide', 40], ['Beurre', 15]]],
    [/confit|cuisse de canard/, 'Confit de canard, pommes sarladaises', 'Plats', 'cuisine', null, [['Cuisse de canard confite', 1], ['Pomme de terre', 300], ['Beurre', 30], ['Salade verte', 30], ['Oignon', 20]]],
    [/saumon/, 'Pavé de saumon', 'Plats', 'cuisine', null, [['Pavé de saumon', 190], ['Pomme de terre', 180], ['Crème liquide', 30]]],
    [/\bfish\b|cabillaud/, 'Fish & chips', 'Plats', 'cuisine', null, [['Filet de cabillaud', 200], ['Frites surgelées', 200]]],
    [/quiche/, 'Quiche lardons salade', 'Plats', 'cuisine', null, [['Lardons fumés', 90], ['Œuf de poule', 3], ['Crème liquide', 70], ['Salade verte', 60]]],
    [/carbonara/, 'Pâtes carbonara', 'Plats', 'cuisine', null, [['Lardons fumés', 105], ['Crème liquide', 90], ['Comté râpé', 45], ['Œuf de poule', 1]]],
    [/\bsole\b/, 'Sole meunière', 'Plats', 'cuisine', null, [['Sole entière', 400], ['Beurre', 40], ['Pomme de terre', 200], ['Tomate', 30]]],
    [/omelette/, 'Omelette, salade', 'Plats', 'cuisine', null, [['Œuf de poule', 3], ['Beurre', 10], ['Salade verte', 40]]],
    [/(cafe|the) gourmand/, 'Café gourmand', 'Desserts', 'cuisine', null, [['Café en grains', 8], ['Crème dessert vanille', 60], ['Chocolat noir', 30], ['Crème liquide', 30], ['Sucre', 20], ['Œuf de poule', 0.5]]],
    [/creme brulee/, 'Crème brûlée', 'Desserts', 'cuisine', null, [['Crème dessert vanille', 120], ['Œuf de poule', 1], ['Sucre', 20]]],
    [/fondant|moelleux (au )?chocolat|coulant/, 'Fondant au chocolat', 'Desserts', 'cuisine', null, [['Chocolat noir', 60], ['Beurre', 40], ['Œuf de poule', 2], ['Sucre', 40]]],
    [/tatin/, 'Tarte Tatin, crème fraîche', 'Desserts', 'cuisine', null, [['Pommes fruit', 250], ['Pâte feuilletée', 80], ['Beurre', 25], ['Sucre', 40], ['Crème liquide', 40]]],
    [/^(portion de |supplement |assiette de )?frites( maison)?$/, 'Portion de frites', 'Accompagnements', 'cuisine', null, [['Frites surgelées', 200]]],
    [/^(petite )?salade verte$/, 'Salade verte', 'Accompagnements', 'cuisine', null, [['Salade verte', 80]]],
    [/chocolat chaud/, 'Chocolat chaud', 'Boissons', 'bar', null, [['Chocolat noir', 25], ['Lait entier', 200], ['Sucre', 5]]],
    [/cafe creme|grand creme|creme cafe|cafe au lait|cappuccino|\blatte\b/, 'Café crème', 'Boissons', 'bar', null, [['Café en grains', 7], ['Lait entier', 120], ['Sucre', 5]]],
    [/\b(cafe|expresso|espresso|express|allonge|ristretto|deca|decafeine|noisette)\b/, 'Café', 'Boissons', 'bar', null, [['Café en grains', 7], ['Sucre', 5]]],
    [/\b(the|infusion|tisane)\b/, 'Thé', 'Boissons', 'bar', null, [['Thé en sachet', 1], ['Sucre', 5]]],
    [/\b(eau|evian|vittel|badoit|cristaline|pellegrino|perrier|volvic)\b.*\b(1 ?l|100 ?cl|1 litre)\b/, 'Eau minérale 1 L', 'Boissons', 'bar', null, [['Eau minérale 50 cl', 2]]],
    [/\b(eau|evian|vittel|badoit|cristaline|pellegrino|perrier|volvic)\b/, 'Eau minérale 50 cl', 'Boissons', 'bar', null, [['Eau minérale 50 cl', 1]]],
    [/\b(coca|cola|pepsi|orangina|schweppes|sprite|fanta|ice tea|limonade|soda|oasis|diabolo)\b/, 'Soda 33 cl', 'Boissons', 'bar', null, [['Soda 33 cl', 1]]],
    [/\b(jus|nectar)\b/, 'Jus de fruits', 'Boissons', 'bar', null, [['Jus de fruits 25 cl', 1]]],
    [/\bpinte\b/, 'Pinte de bière pression', 'Boissons alcoolisées', 'bar', ALC, [['Bière pression (fût)', 500]]],
    [/\b(demi|pression|biere|blonde|ambree|ipa|galopin|heineken|kronenbourg|1664|leffe|grimbergen|affligem)\b/, 'Demi pression', 'Boissons alcoolisées', 'bar', ALC, [['Bière pression (fût)', 250]]],
    [/\b(bouteille|btl|blle)\b.*\b(vin|rouge|blanc|rose|bordeaux|bourgogne|cotes|chablis|sancerre|beaujolais)\b|\b(vin|rouge|blanc|rose|bordeaux|bourgogne|cotes|chablis|sancerre|beaujolais|champagne)\b.*\b(bouteille|btl|blle|75 ?cl)\b/, 'Bouteille de vin', 'Boissons alcoolisées', 'bar', ALC, [['Vin bouteille milieu de gamme', 1]]],
    [/\b(pichet|carafe|pot)\b.*\b(vin|rouge|blanc|rose)\b|\b(vin|rouge|blanc|rose)\b.*\b(pichet|carafe|pot|50 ?cl|46 ?cl)\b/, 'Pichet de vin 50 cl', 'Boissons alcoolisées', 'bar', ALC, [['Vin au verre (cubi)', 500]]],
    [/\b(verre|ballon)\b.*\b(vin|rouge|blanc|rose)\b|vin au verre|\b(vin|rouge|blanc|rose)\b.*\b(verre|12 ?cl|15 ?cl)\b|^(vin|vin rouge|vin blanc|vin rose|rouge|blanc|rose)( maison| du moment)?$/, 'Verre de vin', 'Boissons alcoolisées', 'bar', ALC, [['Vin au verre (cubi)', 125]]]
  ];
  /* Ce qui change chaque jour : pas de fiche type possible. */
  var VARIABLE = /plat du jour|\bdu jour\b|suggestion|ardoise|\bmenu\b|formule|\bpdj\b/;
  /* Familles de caisse → catégories de Verdict (sinon la famille du client est gardée telle quelle). */
  var FAMILLES = [[/entree|starter|hors d oeuvre/, 'Entrées'], [/dessert|patisserie|sucre|glace|sorbet/, 'Desserts'], [/biere|vin|alcool|aperitif|cocktail|spiritueux|digestif|champagne|cave/, 'Boissons alcoolisées'], [/boisson|soft|chaude|cafe|the\b|eau|jus/, 'Boissons'], [/salade/, 'Salades'], [/accompagnement|garniture/, 'Accompagnements'], [/plat|main|viande|poisson|cuisine/, 'Plats'], [/menu|formule/, 'Menus'], [/fromage/, 'Fromages']];

  function trouver(nom) {
    var n = norm(nom);
    if (!n || VARIABLE.test(n)) return null;
    for (var i = 0; i < FICHES.length; i++) {
      var f = FICHES[i];
      if (f[0].test(n)) return { nom: f[1], cat: f[2], esp: f[3], tva: f[4], rec: f[5].map(function (l) { return [l[0], l[1]]; }) };
    }
    return null;
  }
  function variable(nom) { return VARIABLE.test(norm(nom)); }
  function produit(nom) { var k = norm(nom); for (var i = 0; i < PRODUITS.length; i++) if (norm(PRODUITS[i][0]) === k) return { nom: PRODUITS[i][0], type: PRODUITS[i][1], prix: PRODUITS[i][2], perte: PRODUITS[i][3] }; return null; }
  function famille(f) { var n = norm(f); if (!n) return null; for (var i = 0; i < FAMILLES.length; i++) if (FAMILLES[i][0].test(n)) return FAMILLES[i][1]; return String(f).trim(); }
  /* Coût d'une fiche (même calcul que le moteur : perte du produit, puis sauces et pertes de l'établissement). */
  function cout(rec, ing, reg) {
    var st = 0, ok = rec && rec.length > 0;
    (rec || []).forEach(function (l) {
      var g = null, k = norm(l[0]); (ing || []).forEach(function (x) { if (!g && x && norm(x.nom) === k) g = x; });
      g = g || produit(l[0]); var q = Number(l[1]), p = Number(g && g.prix), pe = Number(g && g.perte) || 0;
      if (!g || !(q >= 0) || !(p >= 0) || pe >= 100) { ok = false; return; }
      st += (g.type === 'UNITE' ? p : p / 1000) / (1 - pe / 100) * q;
    });
    reg = reg || {};
    return ok ? st * (1 + ((Number(reg.sauces) || 0) + (Number(reg.pertes) || 0)) / 100) : null;
  }
  /* Résumé lisible d'une recette : « Bavette de bœuf 230 g · Frites surgelées 200 g ». */
  function resume(rec) {
    return (rec || []).map(function (l) {
      var g = produit(l[0]), t = g ? g.type : 'KG', q = Number(l[1]);
      var u = t === 'UNITE' ? (q === 1 ? '' : ' × ' + String(q).replace('.', ',')) : ' ' + String(q).replace('.', ',') + (t === 'L' ? ' ml' : ' g');
      return l[0] + u;
    }).join(' · ');
  }
  w.VerdictFichesTypes = { trouver: trouver, variable: variable, produit: produit, famille: famille, cout: cout, resume: resume, norm: norm, produits: function () { return PRODUITS.map(function (p) { return p.slice(); }); }, nombre: FICHES.length };
})(window);
