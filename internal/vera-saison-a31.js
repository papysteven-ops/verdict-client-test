/* C104 — Vera compose de vrais plats de saison (Steven, 16/10) : « plutôt mois actuel et mois suivant : octobre, il
   peut encore faire bon, salade iceberg ok, mais complète : chèvre chaud, miel, lardons grillés, oignons caramélisés ;
   s'il fait froid on s'adapte : salade de gésiers ; la cohérence, à tous les modèles ».
   Ce fichier porte la connaissance de saison et de métier, et le moteur de composition :
   - calendrier des produits de saison en France, normales de température par mois ;
   - familles d'établissement (brasserie, bistrot, gastronomique, italien, pizzeria, asiatique, tapas, burger, snack,
     café-boulangerie, crêperie, bord de mer, traiteur) ;
   - gabarits de plats complets (nom écrit comme sur une carte, composants avec leur rôle et leur grammage, saison,
     couloir de prix) ;
   - correspondance entre un ingrédient générique (« chèvre ») et ce que la maison achète déjà (« Bûche de chèvre »).
   composer() rend, pour une catégorie, le meilleur plat pour le mois en cours et, si le mois suivant change de
   climat, un second plat « pour quand il fera froid / chaud ». Le coût matière vient du moteur Verdict (platCalc)
   avec les prix fournisseurs de la maison ; ce qui manque est dit (« à acheter : … »), jamais inventé. */
(function (root) {
  'use strict';
  if (root.VerdictSaison) return;
  function norm(k) { return String(k || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/œ/g, 'oe').replace(/[’'`]/g, ' ').replace(/\s+/g, ' ').trim(); }
  var TEMP = [5, 6, 9, 12, 15, 19, 21, 21, 17, 13, 8, 5];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function climat(m) { var t = TEMP[(m - 1 + 12) % 12]; return t >= 16 ? 'chaud' : t <= 9 ? 'froid' : 'mi'; }

  /* ── Produits de saison (France, pleine saison) ─────────────────────────── */
  var SAISON = {
    1: { legumes: ['poireau', 'chou', 'chou-fleur', 'carotte', 'céleri-rave', 'endive', 'mâche', 'potimarron', 'topinambour', 'navet', 'panais', 'betterave', 'champignon'], fruits: ['pomme', 'poire', 'orange', 'clémentine', 'kiwi', 'citron'], mer: ['coquille saint-jacques', 'huître', 'moule', 'bar', 'lieu jaune', 'cabillaud', 'sole'], terre: ['bœuf', 'porc', 'canard', 'agneau', 'volaille', 'lentilles', 'châtaigne'] },
    2: { legumes: ['poireau', 'chou', 'chou-fleur', 'carotte', 'céleri-rave', 'endive', 'mâche', 'potimarron', 'topinambour', 'navet', 'panais', 'betterave', 'champignon'], fruits: ['pomme', 'poire', 'orange', 'clémentine', 'kiwi', 'citron'], mer: ['coquille saint-jacques', 'huître', 'moule', 'bar', 'lieu jaune', 'cabillaud', 'sole'], terre: ['bœuf', 'porc', 'canard', 'agneau', 'volaille', 'lentilles'] },
    3: { legumes: ['poireau', 'chou', 'carotte', 'épinard', 'endive', 'radis', 'asperge', 'navet', 'betterave', 'champignon'], fruits: ['pomme', 'poire', 'orange', 'kiwi', 'citron'], mer: ['coquille saint-jacques', 'huître', 'moule', 'bar', 'lieu jaune', 'cabillaud', 'maquereau'], terre: ['agneau', 'bœuf', 'porc', 'volaille'] },
    4: { legumes: ['asperge', 'radis', 'épinard', 'petit pois', 'artichaut', 'carotte nouvelle', 'oignon nouveau', 'salade verte', 'blette'], fruits: ['fraise', 'rhubarbe', 'pomme', 'citron'], mer: ['maquereau', 'lieu jaune', 'cabillaud', 'dorade', 'crevette'], terre: ['agneau', 'bœuf', 'porc', 'volaille', 'chèvre frais'] },
    5: { legumes: ['asperge', 'radis', 'petit pois', 'fève', 'artichaut', 'courgette', 'salade verte', 'concombre', 'oignon nouveau', 'épinard'], fruits: ['fraise', 'cerise', 'rhubarbe', 'melon'], mer: ['maquereau', 'sardine', 'dorade', 'bar', 'crevette', 'thon'], terre: ['agneau', 'bœuf', 'porc', 'volaille', 'chèvre frais'] },
    6: { legumes: ['tomate', 'courgette', 'aubergine', 'poivron', 'concombre', 'haricot vert', 'salade verte', 'petit pois', 'fenouil', 'artichaut'], fruits: ['fraise', 'cerise', 'abricot', 'melon', 'framboise', 'pêche'], mer: ['sardine', 'maquereau', 'dorade', 'bar', 'thon', 'crevette', 'rouget'], terre: ['bœuf', 'porc', 'volaille', 'agneau', 'chèvre frais'] },
    7: { legumes: ['tomate', 'courgette', 'aubergine', 'poivron', 'concombre', 'haricot vert', 'salade verte', 'fenouil', 'maïs'], fruits: ['abricot', 'pêche', 'nectarine', 'melon', 'pastèque', 'framboise', 'cerise', 'figue'], mer: ['sardine', 'maquereau', 'dorade', 'bar', 'thon', 'crevette', 'rouget', 'moule'], terre: ['bœuf', 'porc', 'volaille', 'agneau', 'chèvre frais'] },
    8: { legumes: ['tomate', 'courgette', 'aubergine', 'poivron', 'concombre', 'haricot vert', 'salade verte', 'fenouil', 'maïs'], fruits: ['pêche', 'nectarine', 'melon', 'pastèque', 'figue', 'prune', 'mirabelle', 'raisin'], mer: ['sardine', 'maquereau', 'dorade', 'bar', 'thon', 'moule', 'rouget'], terre: ['bœuf', 'porc', 'volaille', 'agneau', 'chèvre'] },
    9: { legumes: ['tomate', 'courgette', 'aubergine', 'poivron', 'haricot vert', 'salade verte', 'potimarron', 'champignon', 'poireau', 'fenouil', 'blette'], fruits: ['figue', 'raisin', 'prune', 'poire', 'pomme', 'mirabelle', 'mûre'], mer: ['moule', 'maquereau', 'sardine', 'dorade', 'bar', 'lieu jaune', 'huître'], terre: ['bœuf', 'porc', 'volaille', 'canard', 'gibier', 'chèvre', 'noix'] },
    10: { legumes: ['potimarron', 'butternut', 'champignon', 'poireau', 'chou', 'carotte', 'céleri-rave', 'betterave', 'épinard', 'salade verte', 'endive', 'panais', 'navet'], fruits: ['pomme', 'poire', 'raisin', 'figue', 'coing', 'châtaigne', 'noix', 'kaki'], mer: ['moule', 'huître', 'coquille saint-jacques', 'bar', 'lieu jaune', 'cabillaud', 'maquereau'], terre: ['bœuf', 'porc', 'canard', 'gibier', 'volaille', 'lentilles', 'comté'] },
    11: { legumes: ['potimarron', 'butternut', 'champignon', 'poireau', 'chou', 'chou-fleur', 'carotte', 'céleri-rave', 'betterave', 'endive', 'mâche', 'topinambour', 'panais'], fruits: ['pomme', 'poire', 'coing', 'châtaigne', 'noix', 'clémentine', 'kaki'], mer: ['coquille saint-jacques', 'huître', 'moule', 'bar', 'lieu jaune', 'cabillaud'], terre: ['bœuf', 'porc', 'canard', 'gibier', 'volaille', 'lentilles', 'comté', 'raclette'] },
    12: { legumes: ['potimarron', 'champignon', 'poireau', 'chou', 'chou-fleur', 'carotte', 'céleri-rave', 'endive', 'mâche', 'topinambour', 'panais', 'truffe'], fruits: ['pomme', 'poire', 'clémentine', 'orange', 'châtaigne', 'noix', 'litchi'], mer: ['coquille saint-jacques', 'huître', 'homard', 'langoustine', 'saumon', 'bar', 'sole'], terre: ['canard', 'chapon', 'dinde', 'bœuf', 'gibier', 'foie gras', 'comté'] }
  };

  /* ── Familles d'établissement ───────────────────────────────────────────── */
  function famille(etabType) {
    var t = norm(etabType);
    if (/pizz/.test(t)) return 'pizzeria';
    if (/italien|trattoria|pasta/.test(t)) return 'italien';
    if (/asiat|sushi|japon|wok|thai|viet|pho|ramen|chinois|coreen/.test(t)) return 'asiatique';
    if (/tapas|bar a vin|cave|bodega/.test(t)) return 'tapas';
    if (/burger|food ?truck|dark ?kitchen|fast/.test(t)) return 'burger';
    if (/kebab|snack|sandwich/.test(t)) return 'snack';
    if (/creper|galette|breton/.test(t)) return 'creperie';
    if (/coffee|cafe|salon de the|boulang|patiss|brunch/.test(t)) return 'cafe';
    if (/gastro|etoil|exception|palace|fine|hotel/.test(t)) return 'gastro';
    if (/mer|plage|poisson|marin|ecailler|huitre|port/.test(t)) return 'mer';
    if (/traiteur|banquet|evenement/.test(t)) return 'traiteur';
    if (/bistro|bouchon|auberge|traditionnel|brasserie|bar.?restaurant|village/.test(t)) return 'brasserie';
    return 'brasserie';
  }
  var NOM_FAMILLE = { brasserie: 'brasserie / bistrot', gastro: 'table gastronomique', italien: 'restaurant italien', pizzeria: 'pizzeria', asiatique: 'restaurant asiatique', tapas: 'bar à tapas', burger: 'burgers / fast-casual', snack: 'snack', creperie: 'crêperie', cafe: 'café / boulangerie', mer: 'bord de mer', traiteur: 'traiteur' };

  /* ── Ce que la maison achète : ingrédient générique → produit de la maison ─ */
  var SYN = {
    'salade verte': /mesclun|iceberg|laitue|batavia|roquette|mache|feuille de chene|sucrine|salade/, 'mesclun': /mesclun|roquette|mache|jeunes pousses/, 'iceberg': /iceberg|laitue|batavia|sucrine/,
    'chèvre': /chevre|crottin|picodon|sainte.?maure/, 'lardons': /lardon|poitrine fum|ventreche|pancetta|guanciale/, 'miel': /miel/, 'noix': /\bnoix\b(?! de coco)(?! de saint)|cerneau/, 'noisette': /noisette/,
    'pomme': /\bpomme(?!s? de terre| grenaille)/, 'pomme de terre': /pomme de terre|pommes? grenaille|frite|puree|rattes?/, 'oignon': /oignon(?! nouveau)/, 'oignon rouge': /oignon rouge|oignon/, 'échalote': /echalote/, 'ail': /\bail\b/,
    'gésiers': /gesier/, 'magret': /magret|canard/, 'confit de canard': /confit|cuisse de canard|canard/, 'foie gras': /foie gras/, 'poulet': /poulet|volaille/, 'cuisse de poulet': /cuisse de poulet|poulet|volaille/, 'filet de poulet': /filet de poulet|blanc de poulet|supreme|poulet/,
    'bœuf': /boeuf|entrecote|bavette|onglet|rumsteck|faux.?filet|paleron|joue de boeuf/, 'bœuf haché': /hache/, 'entrecôte': /entrecote|cote de boeuf|faux.?filet/, 'joue de bœuf': /joue|paleron|bourguignon|gite/, 'porc': /\bporc\b|echine|poitrine de porc|filet mignon|travers/, 'échine de porc': /echine|porc/, 'agneau': /agneau|souris|gigot/, 'jambon': /jambon/, 'jambon cru': /jambon cru|serrano|bayonne|prosciutto|coppa/, 'merguez': /merguez|saucisse/,
    'saumon': /saumon/, 'cabillaud': /cabillaud|lieu|colin|dos de/, 'bar': /\bbar\b|loup|dorade|daurade/, 'thon': /\bthon\b/, 'crevette': /crevette|gambas/, 'moules': /moule/, 'huîtres': /huitre/, 'saint-jacques': /saint.?jacques|noix de st/, 'maquereau': /maquereau|sardine/,
    'œuf': /oeuf|\boeufs?\b/, 'crème': /creme (liquide|fraiche|epaisse|35)/, 'beurre': /beurre/, 'lait': /\blait\b/, 'parmesan': /parmesan|grana|pecorino/, 'comté': /comte|emmental|gruyere|beaufort|abondance/, 'emmental': /emmental|gruyere|comte/, 'mozzarella': /mozzarella|burrata|fior di latte/, 'roquefort': /roquefort|bleu|fourme|gorgonzola|stilton/, 'reblochon': /reblochon|raclette|tomme|morbier/, 'fromage blanc': /fromage blanc|faisselle|yaourt|skyr/, 'mascarpone': /mascarpone|creme/,
    'pain': /\bpain\b(?! burger)|baguette|campagne|focaccia|ciabatta/, 'pain burger': /pain burger|bun/, 'tortilla': /tortilla|wrap|galette de ble/, 'galette': /galette|sarrasin|ble noir/, 'pâte à pizza': /pate a pizza|paton|farine/, 'pâtes': /\bpate(s)?\b(?! a pizza| feuilletee| brisee)|spaghetti|penne|tagliatelle|linguine|rigatoni|gnocchi/, 'riz': /\briz\b(?! au lait)/, 'riz à sushi': /riz (a sushi|japonais|rond)|riz/, 'nouilles': /nouille|ramen|udon|soba|vermicelle/, 'lentilles': /lentille/, 'pois chiches': /pois chiche|houmous/, 'quinoa': /quinoa|boulgour|semoule/, 'semoule': /semoule|couscous/,
    'tomate': /tomate(?! sechee| concentree)|cerise/, 'sauce tomate': /sauce tomate|pulpe|concassee|coulis|concentre/, 'courgette': /courgette/, 'aubergine': /aubergine/, 'poivron': /poivron/, 'concombre': /concombre/, 'avocat': /avocat/, 'carotte': /carotte/, 'poireau': /poireau/, 'champignon': /champignon|cepe|girolle|pleurote|shiitake/, 'potimarron': /potimarron|butternut|courge(?!tte)|potiron|citrouille/, 'chou': /\bchou\b(?!-fleur)|kale|chou vert|chou rouge/, 'chou-fleur': /chou.?fleur|brocoli/, 'épinard': /epinard|blette/, 'betterave': /betterave/, 'céleri': /celeri/, 'endive': /endive|chicon/, 'haricot vert': /haricot vert/, 'petit pois': /petit pois|feve/, 'asperge': /asperge/, 'herbes': /persil|ciboulette|basilic|coriandre|menthe|herbe|aneth|estragon/, 'basilic': /basilic|pesto/, 'coriandre': /coriandre|menthe|herbe/,
    'citron': /citron(?! vert)/, 'citron vert': /citron vert|lime/, 'orange': /orange|clementine|mandarine/, 'fraise': /fraise/, 'framboise': /framboise|fruits? rouges|myrtille|mure/, 'figue': /figue/, 'poire': /poire/, 'pêche': /peche|nectarine|abricot/, 'melon': /melon|pasteque/, 'raisin': /raisin/, 'châtaigne': /chataigne|marron/, 'coing': /coing/, 'mangue': /mangue|ananas|passion/, 'banane': /banane/, 'rhubarbe': /rhubarbe/, 'cerise': /cerise|griotte/,
    'chocolat': /chocolat|cacao/, 'sucre': /sucre/, 'farine': /farine/, 'vanille': /vanille/, 'café': /\bcafe\b/, 'caramel': /caramel|sucre/, 'glace vanille': /glace|sorbet|creme glacee/, 'sorbet': /sorbet|glace/, 'pâte feuilletée': /pate feuilletee|pate brisee|pate sablee|fond de tarte/, 'biscuit': /biscuit|speculoos|sable|cuillere/, 'amande': /amande|poudre d.amande|pralin/, 'pistache': /pistache/,
    'vin blanc': /vin blanc|vin de pays|\bvin\b|bib/, 'vin rouge': /vin rouge|vin de pays|\bvin\b|bib/, 'bière': /biere/, 'cidre': /cidre/, 'fond de veau': /fond de veau|fond brun|jus de veau/, 'bouillon': /bouillon|fond de volaille|fumet/, 'moutarde': /moutarde/, 'mayonnaise': /mayonnaise|aioli/, 'vinaigrette': /vinaigrette|huile d.olive|vinaigre/, 'huile d’olive': /huile d.olive/, 'soja': /soja|sauce soja|teriyaki/, 'sésame': /sesame/, 'gingembre': /gingembre/, 'lait de coco': /lait de coco|coco/, 'curry': /curry|cari|massaman/, 'épices': /epice|paprika|cumin|ras el|piment|curry/, 'olives': /olive(?! vierge)|tapenade/, 'câpres': /capre|cornichon/, 'oignons frits': /oignon frit|oignon/, 'cornichon': /cornichon|pickle/, 'cheddar': /cheddar|fromage a burger|tranche de fromage|emmental/, 'bacon': /bacon|poitrine fum|lardon/, 'sauce burger': /sauce burger|ketchup|mayonnaise|barbecue/, 'frites': /frite|pomme de terre/, 'sauce blanche': /sauce blanche|yaourt|fromage blanc/, 'pita': /pita|galette|pain/, 'kebab': /kebab|broche|dinde|veau/, 'falafel': /falafel|pois chiche/, 'tofu': /tofu|soja/, 'nori': /nori|algue/, 'wasabi': /wasabi|gingembre/, 'edamame': /edamame|feve|petit pois/, 'crème fraîche': /creme/, 'sarrasin': /sarrasin|ble noir|galette/, 'caramel beurre salé': /caramel|beurre sale|sucre/, 'andouille': /andouille|saucisse/, 'brie': /brie|camembert|coulommiers/, 'tomme': /tomme|cantal|salers|saint.?nectaire|comte/
  };
  /* C105 : les données de la recherche web (158 plats de plus, calendrier, alias « fromage de chèvre » → « chèvre ») */
  function web() { return root.VERDICT_SAISON_WEB || null; }
  function tousGabarits() { var w = web(); return w && w.gabarits ? G.concat(w.gabarits) : G; }
  function saisonDe(m) { var w = web(), k = String(m).padStart(2, '0'); return (w && w.saison && w.saison[k]) || SAISON[m] || SAISON[10]; }
  /* C276 (T1 vague 10, N1) : un produit est cherché par mots entiers, sans accent, au singulier comme au pluriel
     (« œuf » n'est plus trouvé dans « bœuf »). Un ingrédient absent reste « à compléter » : jamais un produit voisin
     (veau ≠ bœuf haché, burrata ≠ mozzarella râpée, pecorino ≠ parmesan, praline ≠ amande). */
  var VIDES = /^(de|du|des|d|la|le|les|l|a|au|aux|et|en|maison)$/;
  function sing(m) { return m.length > 3 ? m.replace(/aux$/, 'al').replace(/[sx]$/, '') : m; }
  function motsDe(s) { return norm(s).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(function (m) { return m && m.length > 1 && !VIDES.test(m); }).map(sing); }
  function contient(nom, ms) { if (!ms.length) return false; var p = motsDe(nom); return ms.every(function (m) { return p.indexOf(m) >= 0; }); }
  /* Correspondances métier sans produit voisin (remplacent celles de SYN qui mélangeaient deux produits). */
  var STRICT = { 'œuf': /oeufs?\b/, 'bœuf': /boeuf(?! hache)|bavette|onglet|rumsteck|paleron|entrecote|faux.?filet/,
    /* C276c : vrais équivalents — une forme de pâtes reste des pâtes, une herbe se trouve dans « Herbes fraîches », le lard fumé
       est la poitrine fumée ou les lardons, la galette de blé est la tortilla */
    'tagliatelles': /tagliatelle|pates?\b/, 'linguine': /linguine|pates?\b/, 'spaghetti': /spaghetti|pates?\b/, 'penne': /penne|pates?\b/, 'rigatoni': /rigatoni|pates?\b/, 'fettuccine': /fettuccine|pates?\b/,
    'persil': /persil|herbes? (fraiches?|aromatiques?)/, 'ciboulette': /ciboulette|herbes? (fraiches?|aromatiques?)/, 'aneth': /aneth|herbes? (fraiches?|aromatiques?)/, 'cerfeuil': /cerfeuil|herbes? (fraiches?|aromatiques?)/, 'estragon': /estragon|herbes? (fraiches?|aromatiques?)/,
    'lard fumé': /lard fume|lardons?|poitrine fumee/, 'lard': /lard\b|lardons?|poitrine fumee/, 'galette de blé': /tortilla|wrap|galette de ble/, 'bœuf haché': /boeuf hache|hache de boeuf|steak hache/, 'mascarpone': /mascarpone/, 'caramel': /caramel/,
    'cabillaud': /cabillaud/, 'bar': /bar\b|loup/, 'mozzarella': /mozzarella|fior di latte/, 'comté': /comte\b/, 'emmental': /emmental/, 'roquefort': /roquefort/, 'reblochon': /reblochon/,
    'fromage blanc': /fromage blanc|faisselle/, 'parmesan': /parmesan|parmigiano/, 'maquereau': /maquereau/, 'jambon cru': /jambon cru|serrano|bayonne|prosciutto|jambon de parme/, 'merguez': /merguez/,
    'échine de porc': /echine/, 'joue de bœuf': /joue/, 'entrecôte': /entrecote/, 'lardons': /lardon|poitrine fumee/, 'riz à sushi': /riz (a sushi|japonais|rond)/, 'quinoa': /quinoa/,
    'tomate': /tomate(?! sechee| concentree)/, 'potimarron': /potimarron/, 'chou-fleur': /chou.?fleur/, 'épinard': /epinard/, 'petit pois': /petits? pois/, 'coriandre': /coriandre|herbes? (fraiches?|aromatiques?)/, 'basilic': /basilic/,
    'orange': /orange/, 'framboise': /framboise|fruits? rouges/, 'pêche': /peche/, 'melon': /melon/, 'mangue': /mangue/, 'glace vanille': /glace|creme glacee/, 'sorbet': /sorbet/,
    'pâte feuilletée': /pate feuilletee/, 'amande': /amande|poudre d.amande/, 'vin blanc': /vin blanc/, 'vin rouge': /vin rouge/, 'mayonnaise': /mayonnaise/, 'lait de coco': /lait de coco/,
    'soja': /soja/, 'magret': /magret/, 'confit de canard': /confit|cuisse de canard/, 'pecorino': /pecorino/, 'burrata': /burrata/, 'veau': /veau(?! hache)/ };
  function regle(k) { return Object.prototype.hasOwnProperty.call(STRICT, k) ? STRICT[k] : (SYN[k] || SYN[norm(k)] || null); }
  function auDebut(rx, n) { var re = new RegExp(rx.source, 'g'), m; while ((m = re.exec(n))) { if (m.index === 0 || /[^a-z0-9]/.test(n.charAt(m.index - 1))) return true; if (!m[0].length) re.lastIndex++; } return false; }
  /* Une préparation (fond de veau, jus de citron, purée de tomate, glace vanille…) ne remplace jamais le produit brut, sauf
     si c'est elle qui est demandée (« fond de veau » trouve « Fond de veau »). */
  var PREPARE = /^(fond|jus|bouillon|fumet|sauce|soupe|creme|coulis|concentre|sirop|arome|extrait|poudre|biscuit|glace|sorbet|veloute|puree|chip|liqueur|vinaigre|huile|confiture|compote|gelee|preparation|mix|base|aide|nappage|decor|pate|tarte|mousse|tablette|bonbon)$/;
  function premier(s) { return motsDe(s)[0] || ''; }
  /* … ni un abat le morceau (« Ris de veau » n'est pas une pièce de veau), sauf s'il est demandé lui-même (« foie gras »). */
  var ABATS = /^(ris?|rognon|foie|tete|langue|cervelle|tripe|pied|coeur|gesier)$/;
  function memeNature(nom, cle) { var p = premier(nom); if (p === 'pate' && !/^pates? (a|de|d|feuilletee|brisee|sablee)\b/.test(norm(nom))) return true; /* « Pâtes sèches » : des pâtes, pas une pâte à… */ return !(PREPARE.test(p) || ABATS.test(p)) || p === premier(cle); }
  /* C276b (c104, démo Gastro) : une préparation faite en cuisine se compte avec son produit de base quand la maison ne l'achète
     pas toute prête — le caramel maison avec le sucre, la chantilly avec la crème liquide. Ce n'est pas un produit voisin : c'est
     sa recette ; la fiche le dit (« Sucre semoule (caramel maison) »). « Fleur de sel » reste « à compléter ». */
  /* C276c */
  var FAIT_MAISON = { 'caramel': 'sucre', 'sauce caramel': 'sucre', 'caramel au beurre salé': 'sucre', 'chantilly': 'crème', 'crème chantilly': 'crème',
    /* C276c : les autres préparations de cuisine, toujours sur leur produit de base */
    'oignon caramélisé': 'oignon', 'oignon confit': 'oignon', 'croûtons': 'pain', 'chapelure persillée': 'pain', 'sauce au poivre': 'crème',
    'jus au thym': 'fond de veau', 'jus au romarin': 'fond de veau', 'jus de veau': 'fond de veau', 'sauce grand veneur': 'fond de veau',
    'vinaigrette': 'huile d’olive', "vinaigrette à l'échalote": 'huile d’olive', 'sauce vierge': 'huile d’olive', 'poulet pané': 'filet de poulet',
    'sauce tartare': 'mayonnaise', 'sauce césar': 'mayonnaise', 'rouille': 'mayonnaise', 'gaufre': 'farine', 'crumble': 'farine', 'churros': 'farine' };
  function faitMaison(generic, ing) { var b = FAIT_MAISON[norm(generic)] || FAIT_MAISON[generic]; return b ? trouver(b, ing) : null; }
  function trouver(generic, ing) {
    var w = web(), al = w && w.alias && w.alias[generic] && !SYN[generic] && !STRICT[generic] ? w.alias[generic] : null, mo = motsDe(generic);
    /* l'alias n'est suivi que s'il simplifie le nom (« blanc d'œuf » → « œuf »), jamais vers un autre produit (« veau » → « bœuf ») */
    /* … ni quand le mot retiré fait un autre produit (crème anglaise ≠ crème liquide, chantilly, pâtissière) */
    if (al) { var ma = motsDe(al); if (!ma.every(function (m) { return mo.indexOf(m) >= 0; }) || mo.some(function (m) { return ma.indexOf(m) < 0 && /^(anglaise|patissiere|chantilly|glacee?|brulee|fouettee|montee|praline|caramelisee?)$/.test(m); })) al = null; }
    var cles = al ? [generic, al] : [generic], c, i;
    for (c = 0; c < cles.length; c++) { var g = norm(cles[c]); for (i = 0; i < ing.length; i++) if (norm(ing[i].nom) === g) return ing[i]; }
    for (c = 0; c < cles.length; c++) {
      var rx = regle(cles[c]);
      if (rx) { for (i = 0; i < ing.length; i++) { var n = norm(ing[i].nom); if (n && auDebut(rx, n) && memeNature(ing[i].nom, cles[c])) return ing[i]; } continue; }
      var ms = motsDe(cles[c]); for (i = 0; i < ing.length; i++) if (contient(ing[i].nom, ms) && memeNature(ing[i].nom, cles[c])) return ing[i];
    }
    return null;
  }
  /* C276 (N3) : la famille de plats est respectée — pas de tagliatelles dans « Pizzas », pas de pizza dans « Pâtes ». */
  function famillePlat(s) { var n = norm(s); return /pizza|calzone/.test(n) ? 'pizza' : /\b(pates?|pasta|spaghetti|tagliatelles?|penne|linguine|rigatoni|lasagnes?|raviolis?|gnocchis?|risotto)\b/.test(n) ? 'pates' : /burger/.test(n) ? 'burger' : null; }
  function familleGabarit(g) { return famillePlat(g.nom) || (g.comp.some(function (c) { return norm(c[1]) === 'pate a pizza'; }) ? 'pizza' : null); }
  /* C276 (N4) : la saison est réelle — un fruit ou un légume n'est proposé que le mois où il est de saison (pas de fraises en
     octobre) ; ce qui est conservé (tomates confites, séchées, marinées) reste possible toute l'année. */
  var SAISONNIERS = null;
  function saisonniers() {
    if (SAISONNIERS) return SAISONNIERS; SAISONNIERS = {}; var w = web();
    for (var m = 1; m <= 12; m++) { var s = (w && w.saison && w.saison[String(m).padStart(2, '0')]) || SAISON[m] || {}; ['legumes', 'fruits'].forEach(function (k) { (s[k] || []).forEach(function (x) { var c = sing(norm(x)); SAISONNIERS[c] = (SAISONNIERS[c] || 0) + 1; }); }); }
    return SAISONNIERS;
  }
  function deSaison(g, mois) {
    var s = saisonDe(mois), ok = {}, T = saisonniers(), nomN = norm(g.nom);
    ['legumes', 'fruits'].forEach(function (k) { (s[k] || []).forEach(function (x) { ok[sing(norm(x))] = 1; }); });
    return g.comp.every(function (c) { var k = sing(norm(c[1])); if (!T[k] || T[k] >= 12 || ok[k]) return true; return new RegExp(k.slice(0, 5) + '\\w* (confit|seche|marine|au vinaigre)').test(nomN); });
  }

  /* Un plat que la maison sert déjà n'est pas une nouveauté : on compare le début du nom (avant la première virgule). */
  function dejaALaCarte(g, d) {
    var tete = norm(g.nom.split(',')[0]).replace(/\b(aux?|a la|au|de la|des|du|de|d|la|le|les|et|en)\b/g, ' ').replace(/\s+/g, ' ').trim();
    var mots = tete.split(' ').filter(function (w) { return w.length > 3; });
    return (d.plats || []).some(function (p) {
      if (!p || p.cpArchived || !p.nom) return false;
      var n = norm(p.nom).replace(/\b(aux?|a la|au|de la|des|du|de|d|la|le|les|et|en)\b/g, ' ').replace(/\s+/g, ' ');
      if (n.indexOf(tete) >= 0 || tete.indexOf(n.split(',')[0].trim()) >= 0) return true;
      var communs = mots.filter(function (w) { return n.indexOf(w) >= 0; }).length;
      return mots.length >= 2 && communs >= Math.max(2, mots.length - 1);
    });
  }
  var EXCLU = /emballage|barquette|sac |sachet|boite|gobelet|couvercle|serviette|paille|film|aluminium/i;

  /* ── Gabarits de plats complets ───────────────────────────────────────────
     f : familles · c : catégories (1 entrée · 2 salade · 3 plat du jour · 4 plat · 8 dessert) · s : climats
     comp : [rôle, ingrédient générique, grammes] (rôles : base, piece, garniture, sauce, touche) · prix TTC [min,max]
     Les noms s'écrivent comme sur une carte : pièce principale d'abord, virgules, pas de « · ». */
  var G = [
    /* Brasserie, bistrot, traditionnel */
    { f: ['brasserie', 'cafe', 'traiteur'], c: [1, 2], s: ['chaud', 'mi'], nom: 'Salade de chèvre chaud, miel, lardons grillés, noix, oignons caramélisés', comp: [['base', 'salade verte', 90], ['piece', 'chèvre', 80], ['garniture', 'lardons', 40], ['garniture', 'noix', 15], ['touche', 'miel', 12], ['garniture', 'oignon', 40], ['base', 'pain', 40]], prix: [12, 16] },
    { f: ['brasserie', 'cafe'], c: [1, 2], s: ['froid', 'mi'], nom: 'Salade de gésiers confits, pommes sautées, lardons, noix', comp: [['base', 'salade verte', 90], ['piece', 'gésiers', 110], ['garniture', 'pomme de terre', 120], ['garniture', 'lardons', 40], ['touche', 'noix', 15], ['sauce', 'vinaigrette', 20]], prix: [13, 17] },
    { f: ['brasserie', 'gastro'], c: [1], s: ['froid', 'mi'], nom: 'Velouté de potimarron, châtaignes, crème fouettée, croûtons', comp: [['piece', 'potimarron', 220], ['garniture', 'châtaigne', 30], ['sauce', 'crème', 40], ['garniture', 'oignon', 30], ['touche', 'pain', 25], ['base', 'bouillon', 10]], prix: [8, 12] },
    { f: ['brasserie', 'tapas', 'cafe'], c: [1], s: ['froid', 'mi'], nom: 'Œuf poché, lentilles, lardons, crème ciboulette', comp: [['piece', 'œuf', 1], ['base', 'lentilles', 90], ['garniture', 'lardons', 40], ['garniture', 'carotte', 30], ['sauce', 'crème', 30], ['touche', 'herbes', 3]], prix: [8, 12] },
    { f: ['brasserie', 'mer', 'gastro'], c: [1], s: ['froid', 'mi'], nom: 'Soupe à l’oignon gratinée au comté', comp: [['piece', 'oignon', 200], ['base', 'bouillon', 10], ['garniture', 'comté', 50], ['garniture', 'pain', 50], ['touche', 'beurre', 20]], prix: [8, 12] },
    { f: ['brasserie', 'mer', 'gastro'], c: [1], s: ['chaud', 'mi'], nom: 'Tomates anciennes, burrata, basilic, huile d’olive', comp: [['base', 'tomate', 180], ['piece', 'mozzarella', 100], ['touche', 'basilic', 4], ['sauce', 'huile d’olive', 12], ['garniture', 'pain', 30]], prix: [11, 15] },
    { f: ['brasserie', 'gastro', 'mer'], c: [1], s: ['chaud'], nom: 'Gaspacho de tomate, concombre, croûtons à l’ail', comp: [['piece', 'tomate', 220], ['garniture', 'concombre', 60], ['garniture', 'poivron', 40], ['touche', 'pain', 25], ['sauce', 'huile d’olive', 10], ['touche', 'ail', 3]], prix: [8, 11] },
    { f: ['brasserie', 'mer'], c: [1], s: ['froid', 'mi'], nom: 'Six huîtres, pain de seigle, beurre demi-sel, citron', comp: [['piece', 'huîtres', 6], ['garniture', 'pain', 30], ['touche', 'beurre', 10], ['touche', 'citron', 20]], prix: [13, 19] },
    { f: ['brasserie'], c: [3, 4], s: ['froid', 'mi'], nom: 'Blanquette de volaille à l’ancienne, riz pilaf, champignons', comp: [['piece', 'cuisse de poulet', 260], ['base', 'riz', 80], ['garniture', 'champignon', 60], ['garniture', 'carotte', 60], ['sauce', 'crème', 60], ['touche', 'citron', 10]], prix: [15, 19] },
    { f: ['brasserie', 'gastro'], c: [3, 4], s: ['froid'], nom: 'Joue de bœuf braisée au vin rouge, purée maison, carottes glacées', comp: [['piece', 'joue de bœuf', 240], ['base', 'pomme de terre', 220], ['garniture', 'carotte', 80], ['sauce', 'vin rouge', 80], ['sauce', 'fond de veau', 10], ['touche', 'beurre', 25]], prix: [17, 23] },
    { f: ['brasserie'], c: [3, 4], s: ['froid', 'mi'], nom: 'Échine de porc confite, pommes de terre grenaille, champignons, jus au thym', comp: [['piece', 'échine de porc', 280], ['base', 'pomme de terre', 220], ['garniture', 'champignon', 70], ['garniture', 'oignon', 40], ['sauce', 'fond de veau', 10], ['touche', 'herbes', 2]], prix: [15, 19] },
    { f: ['brasserie', 'gastro'], c: [3, 4], s: ['froid', 'mi'], nom: 'Magret de canard, poêlée de champignons, pommes sarladaises', comp: [['piece', 'magret', 220], ['base', 'pomme de terre', 220], ['garniture', 'champignon', 70], ['touche', 'ail', 4], ['sauce', 'fond de veau', 10]], prix: [19, 25] },
    { f: ['brasserie', 'mer'], c: [3, 4], s: ['froid', 'mi'], nom: 'Dos de cabillaud rôti, écrasé de pommes de terre, beurre citronné, poireaux fondants', comp: [['piece', 'cabillaud', 180], ['base', 'pomme de terre', 200], ['garniture', 'poireau', 90], ['sauce', 'beurre', 40], ['touche', 'citron', 15]], prix: [18, 24] },
    { f: ['brasserie', 'mer'], c: [3, 4], s: ['chaud', 'mi'], nom: 'Pavé de saumon grillé, courgettes rôties, riz, sauce citronnée', comp: [['piece', 'saumon', 200], ['base', 'riz', 80], ['garniture', 'courgette', 120], ['sauce', 'crème', 40], ['touche', 'citron', 15]], prix: [17, 23] },
    { f: ['brasserie', 'tapas', 'gastro'], c: [3, 4], s: ['chaud'], nom: 'Tartare de bœuf au couteau, frites maison, salade', comp: [['piece', 'bœuf haché', 220], ['base', 'pomme de terre', 240], ['garniture', 'échalote', 25], ['sauce', 'moutarde', 15], ['touche', 'câpres', 10], ['garniture', 'salade verte', 40], ['touche', 'œuf', 1]], prix: [17, 23] },
    { f: ['brasserie'], c: [2, 4], s: ['chaud', 'mi'], nom: 'Salade César, poulet grillé, parmesan, croûtons, œuf mollet', comp: [['base', 'salade verte', 130], ['piece', 'filet de poulet', 150], ['garniture', 'parmesan', 25], ['garniture', 'pain', 30], ['touche', 'œuf', 1], ['sauce', 'mayonnaise', 35], ['garniture', 'tomate', 50]], prix: [14, 18] },
    { f: ['brasserie', 'gastro'], c: [3, 4], s: ['chaud', 'mi'], nom: 'Suprême de volaille rôti, légumes du moment, jus corsé', comp: [['piece', 'filet de poulet', 200], ['garniture', 'courgette', 90], ['garniture', 'carotte', 70], ['base', 'pomme de terre', 150], ['sauce', 'fond de veau', 10], ['touche', 'beurre', 20]], prix: [15, 20] },
    { f: ['brasserie'], c: [3, 4], s: ['froid', 'mi'], nom: 'Croque-montagnard au reblochon, lardons, oignons confits, salade', comp: [['base', 'pain', 130], ['piece', 'reblochon', 80], ['garniture', 'jambon', 60], ['garniture', 'lardons', 40], ['garniture', 'oignon', 50], ['touche', 'crème', 30], ['garniture', 'salade verte', 45]], prix: [13, 17] },
    { f: ['brasserie', 'mer'], c: [3, 4], s: ['chaud', 'mi'], nom: 'Moules marinières, frites maison', comp: [['piece', 'moules', 1000], ['base', 'pomme de terre', 230], ['sauce', 'vin blanc', 80], ['garniture', 'échalote', 40], ['touche', 'crème', 50], ['touche', 'herbes', 3]], prix: [17, 22] },
    { f: ['brasserie', 'cafe'], c: [8], s: ['froid', 'mi'], nom: 'Tarte fine aux pommes caramélisées, glace vanille', comp: [['piece', 'pomme', 160], ['base', 'pâte feuilletée', 70], ['touche', 'beurre', 20], ['touche', 'sucre', 25], ['garniture', 'glace vanille', 60]], prix: [7, 10] },
    { f: ['brasserie', 'cafe', 'gastro'], c: [8], s: ['froid', 'mi'], nom: 'Poire pochée au vin rouge, crumble aux noix, crème vanillée', comp: [['piece', 'poire', 180], ['sauce', 'vin rouge', 80], ['garniture', 'noix', 20], ['base', 'farine', 30], ['touche', 'beurre', 25], ['touche', 'sucre', 30], ['garniture', 'crème', 40]], prix: [7, 10] },
    { f: ['brasserie', 'cafe', 'italien', 'pizzeria'], c: [8], s: ['chaud', 'mi'], nom: 'Fraises de saison, chantilly vanillée, sablé breton', comp: [['piece', 'fraise', 150], ['garniture', 'crème', 60], ['touche', 'sucre', 15], ['touche', 'vanille', 0.05], ['base', 'biscuit', 40]], prix: [7, 10] },
    { f: ['brasserie', 'cafe', 'gastro'], c: [8], s: ['froid', 'mi', 'chaud'], nom: 'Moelleux au chocolat noir, cœur coulant, crème anglaise', comp: [['piece', 'chocolat', 70], ['garniture', 'beurre', 50], ['garniture', 'œuf', 1.5], ['touche', 'sucre', 45], ['base', 'farine', 25], ['sauce', 'crème', 60]], prix: [7, 10] },
    { f: ['brasserie', 'cafe'], c: [8], s: ['froid', 'mi'], nom: 'Crumble pomme-poire, glace vanille', comp: [['piece', 'pomme', 120], ['piece', 'poire', 100], ['base', 'farine', 40], ['touche', 'beurre', 40], ['touche', 'sucre', 35], ['garniture', 'glace vanille', 60]], prix: [7, 9] },
    /* Gastronomique / bistronomique */
    { f: ['gastro', 'mer'], c: [1], s: ['froid'], nom: 'Noix de Saint-Jacques snackées, crème de topinambour, noisettes torréfiées', comp: [['piece', 'saint-jacques', 90], ['base', 'potimarron', 120], ['sauce', 'crème', 40], ['touche', 'noisette', 12], ['touche', 'beurre', 20]], prix: [16, 24] },
    { f: ['gastro'], c: [1], s: ['chaud', 'mi'], nom: 'Tartare de dorade, agrumes, avocat, huile d’olive citronnée', comp: [['piece', 'bar', 110], ['garniture', 'avocat', 60], ['touche', 'citron vert', 15], ['garniture', 'orange', 40], ['sauce', 'huile d’olive', 12], ['touche', 'herbes', 3]], prix: [14, 20] },
    { f: ['gastro'], c: [3, 4], s: ['froid', 'mi'], nom: 'Filet de bar rôti, risotto de céleri, beurre blanc aux herbes', comp: [['piece', 'bar', 180], ['base', 'riz', 80], ['garniture', 'céleri', 80], ['sauce', 'beurre', 50], ['sauce', 'vin blanc', 40], ['touche', 'herbes', 3]], prix: [26, 36] },
    { f: ['gastro'], c: [3, 4], s: ['chaud', 'mi'], nom: 'Carré d’agneau en croûte d’herbes, légumes de printemps, jus au thym', comp: [['piece', 'agneau', 240], ['garniture', 'petit pois', 60], ['garniture', 'carotte', 60], ['base', 'pomme de terre', 120], ['sauce', 'fond de veau', 10], ['touche', 'herbes', 4]], prix: [28, 38] },
    { f: ['gastro'], c: [8], s: ['froid', 'mi', 'chaud'], nom: 'Sphère chocolat-noisette, cœur praliné, glace vanille', comp: [['piece', 'chocolat', 80], ['garniture', 'noisette', 30], ['garniture', 'crème', 60], ['touche', 'sucre', 30], ['garniture', 'glace vanille', 60]], prix: [11, 16] },
    /* Italien, pizzeria */
    { f: ['italien', 'pizzeria'], c: [1, 2], s: ['chaud', 'mi'], nom: 'Burrata crémeuse, tomates confites, roquette, jambon cru', comp: [['piece', 'burrata', 120], ['garniture', 'tomate', 120], ['base', 'mesclun', 40], ['garniture', 'jambon cru', 40], ['sauce', 'huile d’olive', 12], ['touche', 'basilic', 3]], prix: [12, 16] },
    { f: ['italien', 'pizzeria'], c: [1], s: ['froid', 'mi'], nom: 'Vitello tonnato, câpres, roquette', comp: [['piece', 'veau', 120], ['sauce', 'thon', 60], ['sauce', 'mayonnaise', 40], ['touche', 'câpres', 10], ['base', 'mesclun', 30]], prix: [12, 16] },
    { f: ['italien'], c: [3, 4], s: ['froid', 'mi'], nom: 'Risotto aux cèpes, parmesan 24 mois, huile de truffe', comp: [['base', 'riz', 100], ['piece', 'champignon', 120], ['garniture', 'parmesan', 40], ['sauce', 'bouillon', 10], ['touche', 'beurre', 30], ['sauce', 'vin blanc', 40]], prix: [16, 22] },
    { f: ['italien'], c: [3, 4], s: ['froid', 'mi'], nom: 'Lasagnes maison au bœuf, béchamel, parmesan gratiné', comp: [['base', 'pâtes', 120], ['piece', 'bœuf haché', 150], ['sauce', 'sauce tomate', 120], ['sauce', 'lait', 100], ['garniture', 'parmesan', 30], ['touche', 'beurre', 20]], prix: [14, 18] },
    { f: ['italien'], c: [3, 4], s: ['chaud', 'mi'], nom: 'Linguine aux gambas, tomates cerises, ail, piment doux', comp: [['base', 'pâtes', 120], ['piece', 'crevette', 120], ['garniture', 'tomate', 100], ['touche', 'ail', 4], ['sauce', 'huile d’olive', 15], ['touche', 'herbes', 3]], prix: [16, 21] },
    { f: ['italien', 'pizzeria'], c: [3, 4], s: ['froid', 'mi', 'chaud'], nom: 'Tagliatelles à la carbonara, guanciale, pecorino, jaune d’œuf', comp: [['base', 'pâtes', 130], ['piece', 'lardons', 70], ['garniture', 'parmesan', 40], ['touche', 'œuf', 1]], prix: [13, 17] },
    { f: ['pizzeria'], c: [3, 4], s: ['froid', 'mi'], nom: 'Pizza montagnarde, reblochon, lardons, pommes de terre, oignons confits', comp: [['base', 'pâte à pizza', 250], ['piece', 'reblochon', 90], ['garniture', 'lardons', 60], ['garniture', 'pomme de terre', 80], ['garniture', 'oignon', 40], ['sauce', 'crème', 40]], prix: [13, 17] },
    { f: ['pizzeria'], c: [3, 4], s: ['froid', 'mi'], nom: 'Pizza forestière, champignons, jambon, mozzarella, persillade', comp: [['base', 'pâte à pizza', 250], ['sauce', 'sauce tomate', 80], ['garniture', 'mozzarella', 100], ['piece', 'champignon', 90], ['garniture', 'jambon', 60], ['touche', 'herbes', 3]], prix: [12, 16] },
    { f: ['pizzeria'], c: [3, 4], s: ['chaud', 'mi'], nom: 'Pizza burrata, tomates cerises, roquette, jambon cru, huile de basilic', comp: [['base', 'pâte à pizza', 250], ['sauce', 'sauce tomate', 80], ['piece', 'mozzarella', 120], ['garniture', 'tomate', 80], ['garniture', 'jambon cru', 40], ['base', 'mesclun', 25], ['touche', 'basilic', 3]], prix: [14, 18] },
    { f: ['italien', 'pizzeria'], c: [8], s: ['froid', 'mi', 'chaud'], nom: 'Tiramisu maison au café, cacao amer', comp: [['piece', 'mascarpone', 90], ['garniture', 'biscuit', 40], ['sauce', 'café', 8], ['touche', 'œuf', 1], ['touche', 'sucre', 25], ['touche', 'chocolat', 8]], prix: [7, 10] },
    { f: ['italien', 'pizzeria'], c: [8], s: ['chaud', 'mi'], nom: 'Panna cotta vanille, coulis de fruits rouges', comp: [['piece', 'crème', 150], ['touche', 'sucre', 25], ['touche', 'vanille', 0.05], ['sauce', 'framboise', 60]], prix: [6, 9] },
    /* Asiatique */
    { f: ['asiatique'], c: [1], s: ['chaud', 'mi'], nom: 'Rouleaux de printemps crevettes, menthe, vermicelles, sauce cacahuète', comp: [['piece', 'crevette', 60], ['base', 'nouilles', 40], ['garniture', 'salade verte', 30], ['garniture', 'carotte', 20], ['touche', 'coriandre', 4], ['sauce', 'soja', 20]], prix: [7, 10] },
    { f: ['asiatique'], c: [3, 4], s: ['froid', 'mi'], nom: 'Ramen au porc braisé, œuf mollet, nouilles, bouillon miso', comp: [['base', 'nouilles', 150], ['piece', 'porc', 120], ['touche', 'œuf', 1], ['sauce', 'bouillon', 15], ['garniture', 'chou', 50], ['touche', 'sésame', 5], ['sauce', 'soja', 15]], prix: [14, 18] },
    { f: ['asiatique'], c: [3, 4], s: ['froid', 'mi'], nom: 'Curry de poulet au lait de coco, riz jasmin, coriandre fraîche', comp: [['piece', 'filet de poulet', 180], ['base', 'riz', 90], ['sauce', 'lait de coco', 120], ['garniture', 'poivron', 60], ['sauce', 'curry', 15], ['touche', 'coriandre', 4]], prix: [14, 18] },
    { f: ['asiatique'], c: [3, 4], s: ['chaud', 'mi'], nom: 'Poke bowl saumon mariné, riz vinaigré, avocat, edamame, sésame', comp: [['piece', 'saumon', 120], ['base', 'riz à sushi', 150], ['garniture', 'avocat', 60], ['garniture', 'edamame', 40], ['garniture', 'concombre', 40], ['touche', 'sésame', 5], ['sauce', 'soja', 20]], prix: [14, 18] },
    { f: ['asiatique'], c: [3, 4], s: ['chaud', 'mi', 'froid'], nom: 'Bœuf sauté au wok, légumes croquants, nouilles, sauce soja-gingembre', comp: [['piece', 'bœuf', 150], ['base', 'nouilles', 120], ['garniture', 'poivron', 60], ['garniture', 'carotte', 50], ['sauce', 'soja', 25], ['touche', 'gingembre', 6]], prix: [14, 18] },
    { f: ['asiatique'], c: [8], s: ['chaud', 'mi', 'froid'], nom: 'Perles de coco, mangue fraîche, sésame noir', comp: [['piece', 'mangue', 100], ['base', 'lait de coco', 80], ['touche', 'sucre', 20], ['touche', 'sésame', 4]], prix: [6, 9] },
    /* Tapas, bar à vin */
    { f: ['tapas'], c: [1, 4], s: ['froid', 'mi'], nom: 'Planche charcuterie-fromages, jambon cru, comté, pickles, pain grillé', comp: [['piece', 'jambon cru', 60], ['piece', 'comté', 60], ['garniture', 'cornichon', 30], ['base', 'pain', 60], ['touche', 'beurre', 15]], prix: [14, 20] },
    { f: ['tapas'], c: [1, 4], s: ['chaud', 'mi'], nom: 'Gambas à l’ail et au piment, citron, pain grillé', comp: [['piece', 'crevette', 140], ['touche', 'ail', 6], ['sauce', 'huile d’olive', 20], ['touche', 'citron', 20], ['base', 'pain', 40]], prix: [12, 16] },
    { f: ['tapas'], c: [1, 4], s: ['froid', 'mi'], nom: 'Croquetas de jambon, aïoli maison', comp: [['piece', 'jambon', 60], ['base', 'lait', 150], ['base', 'farine', 40], ['touche', 'beurre', 30], ['sauce', 'mayonnaise', 40], ['touche', 'ail', 3]], prix: [8, 12] },
    { f: ['tapas'], c: [1, 4], s: ['chaud', 'mi'], nom: 'Patatas bravas, sauce tomate fumée, aïoli', comp: [['piece', 'pomme de terre', 220], ['sauce', 'sauce tomate', 60], ['sauce', 'mayonnaise', 40], ['touche', 'épices', 3]], prix: [7, 10] },
    /* Burger, fast-casual, food truck */
    { f: ['burger', 'snack', 'brasserie'], c: [3, 4], s: ['froid', 'mi'], nom: 'Burger montagnard, bœuf, reblochon, lardons, oignons confits, frites', comp: [['base', 'pain burger', 1], ['piece', 'bœuf haché', 180], ['garniture', 'reblochon', 45], ['garniture', 'lardons', 35], ['garniture', 'oignon', 40], ['sauce', 'sauce burger', 25], ['garniture', 'frites', 180]], prix: [14, 18] },
    { f: ['burger', 'snack', 'brasserie'], c: [3, 4], s: ['chaud', 'mi'], nom: 'Burger chèvre-miel, bœuf, roquette, tomate, oignons rouges, frites', comp: [['base', 'pain burger', 1], ['piece', 'bœuf haché', 180], ['garniture', 'chèvre', 45], ['touche', 'miel', 8], ['garniture', 'tomate', 30], ['garniture', 'salade verte', 20], ['garniture', 'oignon rouge', 25], ['garniture', 'frites', 180]], prix: [14, 18] },
    { f: ['burger', 'snack'], c: [3, 4], s: ['chaud', 'mi', 'froid'], nom: 'Burger poulet croustillant, cheddar, salade, sauce maison, frites', comp: [['base', 'pain burger', 1], ['piece', 'filet de poulet', 160], ['garniture', 'cheddar', 30], ['garniture', 'salade verte', 25], ['garniture', 'tomate', 30], ['sauce', 'sauce burger', 25], ['garniture', 'frites', 180]], prix: [13, 17] },
    { f: ['burger', 'snack', 'cafe'], c: [2, 4], s: ['chaud', 'mi'], nom: 'Bowl poulet grillé, quinoa, avocat, légumes croquants, sauce yaourt-citron', comp: [['piece', 'filet de poulet', 140], ['base', 'quinoa', 120], ['garniture', 'avocat', 60], ['garniture', 'concombre', 50], ['garniture', 'tomate', 50], ['sauce', 'fromage blanc', 40], ['touche', 'citron', 10]], prix: [13, 17] },
    { f: ['burger', 'snack', 'cafe'], c: [2, 4], s: ['froid', 'mi'], nom: 'Bowl d’automne, patate douce rôtie, lentilles, chèvre, noix, roquette', comp: [['piece', 'potimarron', 160], ['base', 'lentilles', 100], ['garniture', 'chèvre', 40], ['garniture', 'noix', 15], ['garniture', 'mesclun', 30], ['sauce', 'vinaigrette', 20]], prix: [13, 17] },
    /* Snack, kebab */
    { f: ['snack'], c: [3, 4], s: ['chaud', 'mi', 'froid'], nom: 'Assiette kebab, frites maison, salade, tomate, oignon, sauce blanche', comp: [['piece', 'kebab', 200], ['garniture', 'frites', 200], ['garniture', 'iceberg', 50], ['garniture', 'tomate', 40], ['garniture', 'oignon', 20], ['sauce', 'sauce blanche', 40]], prix: [11, 14] },
    { f: ['snack'], c: [3, 4], s: ['chaud', 'mi'], nom: 'Wrap falafels, houmous, crudités, sauce blanche aux herbes', comp: [['base', 'tortilla', 1], ['piece', 'falafel', 120], ['sauce', 'pois chiches', 50], ['garniture', 'iceberg', 40], ['garniture', 'tomate', 40], ['garniture', 'concombre', 30], ['sauce', 'sauce blanche', 35]], prix: [9, 12] },
    { f: ['snack', 'burger'], c: [3, 4], s: ['froid', 'mi'], nom: 'Tacos poulet-cheddar, frites, sauce fromagère, oignons frits', comp: [['base', 'tortilla', 1], ['piece', 'filet de poulet', 150], ['garniture', 'frites', 120], ['garniture', 'cheddar', 40], ['sauce', 'crème', 40], ['touche', 'oignons frits', 15]], prix: [10, 13] },
    /* Café, boulangerie, brunch */
    { f: ['cafe'], c: [1, 2, 4], s: ['chaud', 'mi'], nom: 'Tartine avocat, œuf poché, feta, graines, citron', comp: [['base', 'pain', 90], ['piece', 'avocat', 90], ['touche', 'œuf', 1], ['garniture', 'chèvre', 30], ['touche', 'sésame', 5], ['touche', 'citron', 8]], prix: [11, 15] },
    { f: ['cafe'], c: [1, 2, 4], s: ['froid', 'mi'], nom: 'Croque au comté, jambon, béchamel, salade de mâche aux noix', comp: [['base', 'pain', 130], ['piece', 'jambon', 80], ['garniture', 'comté', 70], ['sauce', 'lait', 40], ['touche', 'beurre', 20], ['garniture', 'salade verte', 45], ['touche', 'noix', 10]], prix: [11, 14] },
    { f: ['cafe', 'brasserie'], c: [1, 2], s: ['chaud', 'mi'], nom: 'Salade de quinoa, feta, concombre, menthe, grenade', comp: [['base', 'quinoa', 120], ['piece', 'chèvre', 50], ['garniture', 'concombre', 60], ['garniture', 'tomate', 60], ['touche', 'coriandre', 4], ['sauce', 'vinaigrette', 20]], prix: [11, 14] },
    { f: ['cafe'], c: [8], s: ['froid', 'mi'], nom: 'Carrot cake, glaçage cream cheese, noix caramélisées', comp: [['piece', 'carotte', 90], ['base', 'farine', 70], ['garniture', 'noix', 20], ['touche', 'sucre', 50], ['garniture', 'fromage blanc', 50], ['touche', 'œuf', 1]], prix: [5, 8] },
    { f: ['cafe', 'brasserie'], c: [8], s: ['chaud', 'mi'], nom: 'Cheesecake vanille, coulis de fruits rouges', comp: [['piece', 'fromage blanc', 120], ['base', 'biscuit', 50], ['touche', 'beurre', 25], ['touche', 'sucre', 35], ['touche', 'vanille', 0.05], ['sauce', 'framboise', 50]], prix: [6, 9] },
    /* Crêperie */
    { f: ['creperie'], c: [3, 4], s: ['froid', 'mi'], nom: 'Galette forestière, champignons à la crème, lardons, œuf miroir, emmental', comp: [['base', 'galette', 1], ['piece', 'champignon', 90], ['garniture', 'lardons', 40], ['touche', 'œuf', 1], ['garniture', 'emmental', 40], ['sauce', 'crème', 40]], prix: [11, 14] },
    { f: ['creperie'], c: [3, 4], s: ['froid', 'mi'], nom: 'Galette savoyarde, reblochon, pommes de terre, lardons, oignons', comp: [['base', 'galette', 1], ['piece', 'reblochon', 70], ['garniture', 'pomme de terre', 80], ['garniture', 'lardons', 40], ['garniture', 'oignon', 30], ['sauce', 'crème', 30]], prix: [11, 14] },
    { f: ['creperie'], c: [3, 4], s: ['chaud', 'mi'], nom: 'Galette chèvre, miel, noix, roquette, tomates confites', comp: [['base', 'galette', 1], ['piece', 'chèvre', 70], ['touche', 'miel', 12], ['garniture', 'noix', 15], ['garniture', 'mesclun', 30], ['garniture', 'tomate', 50]], prix: [11, 14] },
    { f: ['creperie'], c: [8], s: ['froid', 'mi', 'chaud'], nom: 'Crêpe caramel au beurre salé maison, pommes poêlées, glace vanille', comp: [['base', 'farine', 60], ['sauce', 'caramel beurre salé', 40], ['piece', 'pomme', 100], ['touche', 'beurre', 20], ['garniture', 'glace vanille', 60]], prix: [7, 10] },
    /* Bord de mer */
    { f: ['mer', 'brasserie'], c: [1], s: ['chaud', 'mi'], nom: 'Tartare de saumon, avocat, citron vert, aneth, pain grillé', comp: [['piece', 'saumon', 120], ['garniture', 'avocat', 60], ['touche', 'citron vert', 15], ['touche', 'herbes', 3], ['sauce', 'huile d’olive', 10], ['base', 'pain', 30]], prix: [12, 16] },
    { f: ['mer'], c: [3, 4], s: ['chaud', 'mi'], nom: 'Dorade entière grillée, fenouil confit, pommes de terre à l’huile d’olive, citron', comp: [['piece', 'bar', 400], ['garniture', 'céleri', 80], ['base', 'pomme de terre', 200], ['sauce', 'huile d’olive', 15], ['touche', 'citron', 20], ['touche', 'herbes', 3]], prix: [22, 30] },
    { f: ['mer', 'brasserie'], c: [3, 4], s: ['froid', 'mi'], nom: 'Saint-Jacques poêlées, risotto crémeux au parmesan, beurre noisette', comp: [['piece', 'saint-jacques', 120], ['base', 'riz', 90], ['garniture', 'parmesan', 30], ['sauce', 'beurre', 40], ['sauce', 'vin blanc', 40], ['sauce', 'bouillon', 10]], prix: [24, 32] },
    { f: ['mer', 'brasserie'], c: [3, 4], s: ['froid', 'mi'], nom: 'Cassolette de la mer gratinée, cabillaud, moules, crevettes, sauce safranée', comp: [['piece', 'cabillaud', 120], ['garniture', 'moules', 150], ['garniture', 'crevette', 60], ['sauce', 'crème', 60], ['sauce', 'vin blanc', 40], ['garniture', 'emmental', 25], ['touche', 'épices', 1]], prix: [18, 24] },
    /* Traiteur */
    { f: ['traiteur'], c: [1, 4], s: ['froid', 'mi', 'chaud'], nom: 'Verrine saumon fumé, crème citronnée à l’aneth, concombre', comp: [['piece', 'saumon', 50], ['sauce', 'crème', 40], ['garniture', 'concombre', 40], ['touche', 'citron', 8], ['touche', 'herbes', 2]], prix: [4, 7] },
    { f: ['traiteur'], c: [3, 4], s: ['froid', 'mi'], nom: 'Parmentier de canard confit, purée maison, salade de mâche', comp: [['piece', 'confit de canard', 180], ['base', 'pomme de terre', 220], ['garniture', 'oignon', 40], ['touche', 'beurre', 25], ['garniture', 'salade verte', 40]], prix: [12, 16] }
  ];

  /* ── Composition ─────────────────────────────────────────────────────────── */
  var RANG_LIBELLE = { 1: 'entrée', 2: 'salade', 3: 'plat du jour', 4: 'plat', 8: 'dessert' };
  function rangsDeCategorie(rang) { if (rang === 3) return [3, 4]; if (rang === 2) return [2, 1]; if (rang === 1) return [1, 2]; return [rang]; }
  function composer(o) {
    o = o || {};
    var d = o.db || root.DB; if (!d) return [];
    var ing = (d.ing || []).filter(function (g) { return g && g.nom && !EXCLU.test(g.nom); });
    var fam = o.famille || famille(d.etabType), rang = o.rang, m = o.mois || (new Date().getMonth() + 1), m2 = (m % 12) + 1;
    var c1 = climat(m), c2 = climat(m2), rangs = rangsDeCategorie(rang);
    var TG = tousGabarits();
    var gabs = TG.filter(function (g) { return g.f.indexOf(fam) >= 0 && g.c.some(function (r) { return rangs.indexOf(r) >= 0; }) && !dejaALaCarte(g, d); });
    var fc = famillePlat(o.cat || ''), fams = {}; (d.plats || []).forEach(function (p) { var f = p && !p.cpArchived && famillePlat(p.cat || ''); if (f) fams[f] = 1; });
    function memeFamille(g) { var fg = familleGabarit(g); return fc ? fg === fc : !(fg && fams[fg]); }
    if (!gabs.length && fam !== 'brasserie') gabs = TG.filter(function (g) { return g.f.indexOf('brasserie') >= 0 && g.c.some(function (r) { return rangs.indexOf(r) >= 0; }) && !dejaALaCarte(g, d); });
    function evaluer(g, climatCible) {
      var rec = [], avec = [], manque = [], poids = 0, couv = 0;
      g.comp.forEach(function (c) {
        var w = c[0] === 'piece' ? 2 : c[0] === 'touche' ? 0.5 : 1; poids += w;
        var trouve = trouver(c[1], ing), lib = trouve && trouve.nom, fm = !trouve && faitMaison(c[1], ing);
        if (fm) { trouve = fm; lib = fm.nom + ' (' + c[1] + ' maison)'; }
        if (trouve) { couv += w; rec.push([trouve.nom, c[2]]); if (avec.indexOf(lib) < 0) avec.push(lib); }
        else if (manque.indexOf(c[1]) < 0) manque.push(c[1]);
      });
      var couverture = poids ? couv / poids : 0, saison = g.s.indexOf(climatCible) >= 0 ? 1 : 0;
      return { g: g, rec: rec, avec: avec, manque: manque, couverture: couverture, saison: saison, score: saison * 1.2 + couverture + (manque.length === 0 ? .3 : 0) - manque.length * .08 };
    }
    function meilleur(climatCible, exclure, mois) {
      /* un plat complet : au moins 3 composants nommés (jamais « mousse au chocolat » tout court) */
      var l = gabs.filter(function (g) { return g.s.indexOf(climatCible) >= 0 && exclure.indexOf(g) < 0 && g.comp.length >= 3 && g.nom.split(/[ ,]+/).length >= 3 && memeFamille(g) && deSaison(g, mois); }).map(function (g) { return evaluer(g, climatCible); })
        /* C276b : au moins deux produits de la maison, sinon ce n'est pas « composé avec vos produits » */
        .filter(function (e) { return e.couverture >= .5 && e.manque.length <= 2 && e.rec.length >= 2; }).sort(function (a, b) { return b.score - a.score; });
      return l[0] || null;
    }
    var out = [], e1 = meilleur(c1, [], m);
    if (e1) out.push(fabriquer(e1, d, o, m, c1, 'maintenant'));
    if (c2 !== c1) { var e2 = meilleur(c2, e1 ? [e1.g] : [], m2); if (e2) out.push(fabriquer(e2, d, o, m2, c2, 'suivant')); }
    return out;
  }
  function fabriquer(e, d, o, mois, clim, quand) {
    var g = e.g, tva = null; try { tva = o.tva != null ? o.tva : (d.reg && d.reg.tvac) || null; } catch (x) {}
    var p = { id: 'vera-saison-' + Math.abs(hash(g.nom + mois)).toString(36), nom: g.nom, cat: o.cat || '', tva: tva, rec: e.rec, preps: [], vol: null,
      cpVeraNew: true, cpVeraSaison: { quand: quand, mois: mois, climat: clim, famille: famille(d.etabType), avec: e.avec, manque: e.manque, couverture: e.couverture, prix: g.prix }, cpWarmth: clim === 'chaud' ? 1 : clim === 'froid' ? -1 : 0 };
    return p;
  }
  function hash(s) { s = String(s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  /* Phrase de saison : mois en cours puis mois suivant, en français de tous les jours. */
  function phraseSaison(m) {
    var m2 = (m % 12) + 1, t1 = TEMP[m - 1], t2 = TEMP[m2 - 1], c1 = climat(m), c2 = climat(m2);
    var s = MOIS[m - 1] + ' (' + t1 + ' °C en moyenne)' + (c1 === c2 ? ' et ' + MOIS[m2 - 1] + ' (' + t2 + ' °C)' : ', puis ' + MOIS[m2 - 1] + ' (' + t2 + ' °C)');
    if (c1 === 'mi' && c2 === 'froid') s += ' : il peut encore faire bon, puis on passe au réconfortant';
    else if (c1 === 'chaud' && c2 !== 'chaud') s += ' : la saison se rafraîchit';
    else if (c1 === 'froid' && c2 !== 'froid') s += ' : les beaux jours reviennent';
    else if (c1 === 'froid') s += ' : plats chauds et réconfortants';
    else if (c1 === 'chaud') s += ' : fraîcheur et légèreté';
    return s;
  }
  function produitsDuMoment(m) { var a = saisonDe(m), b = saisonDe((m % 12) + 1); var l = []; ['legumes', 'fruits', 'mer', 'terre'].forEach(function (k) { (a[k] || []).forEach(function (x) { if (l.indexOf(x) < 0 && (b[k] || []).indexOf(x) >= 0) l.push(x); }); }); return l; }
  root.VerdictSaison = { trouver: trouver, deSaison: deSaison, famillePlat: famillePlat, version: 'C105', dejaALaCarte: dejaALaCarte, tousGabarits: tousGabarits, saisonDe: saisonDe, TEMP: TEMP, MOIS: MOIS, SAISON: SAISON, gabarits: G, synonymes: SYN, famille: famille, nomFamille: function (f) { return NOM_FAMILLE[f] || f; }, climat: climat, composer: composer, trouver: trouver, phraseSaison: phraseSaison, produitsDuMoment: produitsDuMoment, moisReel: function () { return new Date().getMonth() + 1; }, rangLibelle: function (r) { return RANG_LIBELLE[r] || 'plat'; } };
})(window);
