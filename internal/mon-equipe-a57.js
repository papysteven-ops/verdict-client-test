/* C189 — Mon équipe, salarié par salarié (Steven, 20/10 : « examine en profondeur : a-t-il trop de personnel ? si tu retires
   1 salarié… la structure doit être détaillée : combien de barmans, salaire, chef de cuisine… la page doit être complète pour
   chaque salarié ; le coût le plus important en CHR : salaires + marchandise + loyer ; aider le client à comprendre les fuites,
   pourquoi, comment réagir ; un avant / après, le plus réaliste possible, en vrais chiffres ; on ne peut pas dire au client
   “vends plus” si la clientèle n'est pas là »).
   Repères : 13-RAPPORTS-ET-MANIFESTES/REPERES-EQUIPE-CHR-2026-10-20.md (UMIH / Statexpert 2025, Fiducial 2026, INSEE,
   grille HCR, réduction générale 2026). Règles tenues ici :
   - coût employeur = brut × multiplicateur selon le rapport brut / SMIC (réduction générale 2026) : ×1,08 au SMIC … ×1,45 ;
   - « trop de personnel ? » : jamais sur le seul pourcentage. On compare l'équipe au minimum qu'il faut pour tenir cuisine et
     salle pendant les heures d'ouverture (1 690 h de présence par temps plein et par an), puis les ventes par temps plein au
     repère du type d'établissement ; le levier proposé est le planning, jamais « vendez plus » ;
   - « Et sans lui ? » : fourchette entre « ses heures n'étaient pas utiles » et « l'équipe reprend ses heures » (heures sup.
     majorées 20 %, puis 50 % au-delà de 43 h, impossible au-delà de 48 h) ; ne compte jamais de ventes en plus ; ne décide
     jamais à la place du patron ; aucun calcul de paie (le bulletin fait foi).
   Données : DB.staff = [{id, nom, poste, contrat, h (heures par semaine), brut (mensuel)}], DB.equipeOuverture (heures
   d'ouverture par semaine). Démonstration : une équipe fictive calée exactement sur les chiffres saisis (salaires bruts,
   taux de charges, temps pleins), rien n'est écrit tant que le patron ne modifie pas. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.VerdictMonEquipe) return;

  var SMIC_H = 12.31; /* SMIC horaire brut au 1er juin 2026 */
  var POSTES = [
    { k: 'chef', lib: 'Chef de cuisine', z: 'cuisine' }, { k: 'second', lib: 'Second de cuisine', z: 'cuisine' },
    { k: 'cuisinier', lib: 'Cuisinier', z: 'cuisine' }, { k: 'pizzaiolo', lib: 'Pizzaïolo', z: 'cuisine' },
    { k: 'commis', lib: 'Commis de cuisine', z: 'cuisine' }, { k: 'plonge', lib: 'Plongeur', z: 'cuisine' },
    { k: 'resp', lib: 'Responsable de salle', z: 'salle' }, { k: 'rang', lib: 'Chef de rang', z: 'salle' },
    { k: 'serveur', lib: 'Serveur', z: 'salle' }, { k: 'barman', lib: 'Barman', z: 'salle' },
    { k: 'runner', lib: 'Commis de salle', z: 'salle' },
    /* C355 (décision 30) : postes du comptoir, du fournil, de la boutique et de l'expédition (livraison) */
    { k: 'equipier', lib: 'Équipier de comptoir', z: 'comptoir' }, { k: 'barista', lib: 'Barista', z: 'comptoir' },
    { k: 'boulanger', lib: 'Boulanger', z: 'production' }, { k: 'patissier', lib: 'Pâtissier', z: 'production' },
    { k: 'vendeur', lib: 'Vendeur', z: 'vente' }, { k: 'prep', lib: 'Préparateur de commandes', z: 'expedition' },
    { k: 'autre', lib: 'Autre poste', z: 'autre' }
  ];
  var CONTRATS = ['CDI', 'CDD', 'Saisonnier', 'Apprenti', 'Extra'];
  /* Ventes HT par temps plein (médianes, rapport du 20/10) et grands coûts sains, par type d'établissement. */
  var CA_ETP = { 'Brasserie': 110000, 'Restaurant traditionnel': 100000, 'Restaurant gastronomique': 95000, 'Table gastronomique d’exception': 95000,
    'Restaurant italien': 100000, 'Restaurant asiatique': 100000, 'Bar à tapas': 110000, 'Pizzeria': 115000, 'Restaurant à burgers': 125000,
    'Kebab': 125000, 'Food truck': 125000, 'Dark kitchen': 125000, 'Coffee shop': 125000, 'Traiteur': 110000, 'Boulangerie': 110000 };
  var SAIN = { trad: { mat: 33, loy: 8, prime: 65 }, rapide: { mat: 35, loy: 9, prime: 60 }, hdg: { mat: 36, loy: 11, prime: 70 },
    boissons: { mat: 30, loy: 11, prime: 55 }, boulangerie: { mat: 35, loy: 9, prime: 62 }, traiteur: { mat: 35, loy: 8, prime: 62 } };
  var PRESENCE = 1690; /* heures de présence réelles d'un temps plein par an (39 h, congés, fériés, absences) */

  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function eur(x) { return x == null || !isFinite(x) ? '—' : Math.round(x).toLocaleString('fr-FR') + ' €'; }
  function un(x, d) { return (Math.round(x * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString('fr-FR'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function poste(k) { for (var i = 0; i < POSTES.length; i++) if (POSTES[i].k === k) return POSTES[i]; return POSTES[POSTES.length - 1]; }
  /* SMIC mensuel pour h heures par semaine (heures 36 à 39 majorées de 10 %, comme en HCR). */
  function smicMois(h) { h = Math.max(1, num(h)); return SMIC_H * (Math.min(h, 35) + Math.max(0, h - 35) * 1.1) * 52 / 12; }
  /* Coût employeur : brut × multiplicateur selon brut / SMIC (réduction générale 2026, rapport du 20/10, § 3.3). */
  function multiplicateur(brut, h) { var r = num(brut) / smicMois(h); return r <= 1.05 ? 1.08 : r <= 1.2 ? 1.15 : r <= 1.4 ? 1.25 : r <= 1.7 ? 1.33 : r <= 2.2 ? 1.40 : 1.45; }
  function coutMois(p) { if (p && p.demo && p.coutDemo != null) return num(p.coutDemo); /* C355 : part exacte de la masse du modèle */ return num(p.brut) * multiplicateur(p.brut, p.h); }
  /* C355 : brut d'un coût mensuel chargé, sans boucle : le palier de cotisations qui retombe sur lui-même. */
  function brutDepuisCout(c, h) {
    var M = [1.08, 1.15, 1.25, 1.33, 1.40, 1.45];
    for (var i = 0; i < M.length; i++) { var b = c / M[i], m = multiplicateur(b, h); if (m === M[i]) return b; if (m < M[i]) return c / M[i - 1 < 0 ? 0 : i - 1]; }
    /* entre deux paliers, le coût n'a pas de brut exact : on garde le palier du dessous (brut au-dessus, jamais sous le SMIC) */
    return c / M[M.length - 1];
  }
  function tauxHeure(p) { var h = num(p.h) * 52 / 12; return h > 0 ? coutMois(p) / h : 0; }

  /* C355 (décision 30) : l'équipe de démonstration suit le métier du modèle. Une équipe-type par format, autant de temps
     pleins (39 h) que le modèle en déclare (saln), salaires répartis directement depuis sa masse (salb, cotisations salt) par
     poids de poste × heures, chacun au moins au SMIC de ses heures : la somme des postes est exactement la masse du moteur.
     Sans salarié (salb = 0) : aucune équipe fictive. Une équipe saisie par le patron (DB.staff) n'est jamais touchée.
     Avant : la même brasserie de 6 salariés (salle et serveurs compris) recalée pour tous, sous le SMIC dès que la masse
     était petite (Dark kitchen 888 € pour un commis, Food truck 162 €). */
  var GABARITS = {
    salle: [['chef', 1.45], ['serveur', 1], ['cuisinier', 1.15], ['resp', 1.25], ['commis', 0.92], ['serveur', 1], ['plonge', 0.9], ['second', 1.3], ['rang', 1.05], ['runner', 0.9], ['cuisinier', 1.15], ['serveur', 1]],
    gastro: [['chef', 1.6], ['second', 1.35], ['rang', 1.1], ['cuisinier', 1.15], ['resp', 1.3], ['commis', 0.92], ['serveur', 1], ['plonge', 0.9], ['patissier', 1.15], ['rang', 1.1], ['cuisinier', 1.15], ['commis', 0.92], ['serveur', 1], ['runner', 0.9]],
    bar: [['barman', 1.05], ['serveur', 1], ['cuisinier', 1.15], ['serveur', 1], ['commis', 0.92], ['resp', 1.25], ['barman', 1.05], ['plonge', 0.9]],
    pizzeria: [['pizzaiolo', 1.15], ['serveur', 1], ['commis', 0.92], ['pizzaiolo', 1.15], ['serveur', 1], ['plonge', 0.9], ['resp', 1.25]],
    comptoir: [['cuisinier', 1.1], ['equipier', 0.95], ['commis', 0.92], ['equipier', 0.95], ['cuisinier', 1.1], ['equipier', 0.95]],
    cafe: [['barista', 1], ['equipier', 0.95], ['barista', 1], ['commis', 0.92], ['equipier', 0.95]],
    boulangerie: [['boulanger', 1.15], ['vendeur', 0.95], ['patissier', 1.1], ['vendeur', 0.95], ['boulanger', 1.15], ['commis', 0.92], ['vendeur', 0.95]],
    traiteur: [['chef', 1.4], ['cuisinier', 1.15], ['commis', 0.92], ['prep', 0.95], ['cuisinier', 1.15], ['commis', 0.92]],
    livraison: [['chef', 1.35], ['cuisinier', 1.1], ['prep', 0.95], ['commis', 0.92], ['cuisinier', 1.1], ['prep', 0.95]],
    camion: [['cuisinier', 1.1], ['equipier', 0.95]]
  };
  var GABARIT_FORMAT = { 'Dark kitchen': 'livraison', 'Food truck': 'camion', 'Coffee shop': 'cafe', 'Boulangerie': 'boulangerie', 'Traiteur': 'traiteur',
    'Pizzeria': 'pizzeria', 'Kebab': 'comptoir', 'Restaurant à burgers': 'comptoir', 'Bar / café': 'bar', 'Bar à tapas': 'bar',
    'Restaurant gastronomique': 'gastro', 'Table gastronomique d’exception': 'gastro' };
  var PRENOMS = ['Karim', 'Lucie', 'Théo', 'Inès', 'Hugo', 'Sarah', 'Nadia', 'Yanis', 'Léa', 'Malik', 'Chloé', 'Rayan', 'Emma', 'Sami', 'Julie', 'Omar', 'Camille', 'Bilal', 'Manon', 'Adam', 'Zoé', 'Nathan', 'Lina', 'Hamza', 'Jade', 'Enzo', 'Clara', 'Ilyes'];
  /* Part des ventes livrées : 100 % pour une dark kitchen, sinon la part plateforme moyenne des plats (pfshare en %). */
  function partLivraison(D) {
    if (D && D.etabType === 'Dark kitchen') return 1;
    var P = (D && Array.isArray(D.plats)) ? D.plats : []; if (!P.length) return 0;
    return P.reduce(function (t, p) { return t + (p && p.pf ? Math.min(100, Math.max(0, num(p.pfshare))) / 100 : 0); }, 0) / P.length;
  }
  function estDemo(D) { return !!(D && (D._demo || D.demo || (D.dataProvenance && D.dataProvenance.nature === 'model_estimate'))); }
  function gabarit(D) { if (partLivraison(D) >= 0.8) return 'livraison'; return GABARIT_FORMAT[D && D.etabType] || 'salle'; }
  function equipeDemo(D) {
    var I = (D && D.in) || {}, salb = num(I.salb), salt = num(I.salt), n = num(I.saln);
    if (!(salb > 0)) return [];
    if (!(n > 0)) n = 1;
    var G = GABARITS[gabarit(D)], L = [], plein = Math.floor(n + 1e-9), reste = n - plein;
    function pers(i, h) { var g = i < G.length ? G[i] : G[1 + (i - 1) % (G.length - 1 || 1)] || G[0]; return { id: 'demo' + i, nom: PRENOMS[i % PRENOMS.length] + ' (fictif)', poste: g[0], contrat: 'CDI', h: h, _w: g[1], demo: true }; }
    for (var i = 0; i < plein; i++) L.push(pers(i, 39));
    if (reste > 0.01) L.push(pers(plein, Math.round(reste * 39 * 10) / 10));
    var charge = salt > 0; /* salt > 0 : salb est un brut ; salt = 0 : salb est déjà le coût chargé */
    var poids = L.map(function (p) { return p._w * p.h; }), tp = poids.reduce(function (a, b) { return a + b; }, 0);
    var plancher = L.map(function (p) { return smicMois(p.h) * (charge ? 1 : 1.08); }), tf = plancher.reduce(function (a, b) { return a + b; }, 0);
    var sous = tf > salb + 0.005;
    L.forEach(function (p, j) {
      var v = sous ? salb * poids[j] / tp : plancher[j] + (salb - tf) * poids[j] / tp;
      if (charge) { p.brut = v; p.coutDemo = v * (1 + salt / 100); } else { p.coutDemo = v; p.brut = brutDepuisCout(v, p.h); }
      p.brut = Math.round(p.brut * 100) / 100; delete p._w;
    });
    /* La masse du modèle ne paie pas le SMIC de ses temps pleins : on ne maquille rien, l'écran le dit. */
    L.sousSmic = sous ? { masse: salb, charge: charge, n: n, parTempsPlein: salb / n, smic: smicMois(39) * (charge ? 1 : 1.08) } : null;
    return L;
  }
  function equipe(D) { return D && Array.isArray(D.staff) && D.staff.length ? D.staff : (estDemo(D) ? equipeDemo(D) : []); }
  function ouverture(D) { var o = num(D && D.equipeOuverture); if (o > 0) return o; var j = num(D && D.in && D.in.jsem) || 6; return estDemo(D) ? j * 15 : null; }

  var LIEUX = [['cuisine', 'la cuisine'], ['production', 'le fournil'], ['comptoir', 'le comptoir'], ['salle', 'la salle'], ['vente', 'la boutique'], ['expedition', 'l’expédition des commandes']];
  function lieux(z) { var L = LIEUX.filter(function (x) { return z[x[0]]; }).map(function (x) { return x[1]; }); if (z.cuisine && z.salle && L.length === 2) return 'cuisine et salle'; return L.length ? L.slice(0, -1).join(', ') + (L.length > 1 ? ' et ' : '') + L[L.length - 1] : 'l’établissement'; }
  /* L'analyse : coûts, temps pleins, minimum pour tenir l'ouverture, ventes par temps plein, verdict en mots. */
  function analyser(D, R, fmt, rep) {
    var L = equipe(D), d = (R && R.d) || {}, ca = num(d.ca), A = { liste: [], fmt: fmt, rep: rep, ca: ca };
    L.forEach(function (p) { var c = coutMois(p); A.liste.push({ p: p, poste: poste(p.poste), cout: c, taux: tauxHeure(p), etp: Math.min(num(p.h), 39) / 39 }); });
    A.cout = A.liste.reduce(function (t, x) { return t + x.cout; }, 0); A.brut = A.liste.reduce(function (t, x) { return t + num(x.p.brut); }, 0);
    A.etp = A.liste.reduce(function (t, x) { return t + x.etp; }, 0); A.h = A.liste.reduce(function (t, x) { return t + num(x.p.h); }, 0);
    var I = (D && D.in) || {}; A.dirN = num(I.dirn); A.dirCout = num(I.dirb) * (1 + num(I.dirt) / 100);
    A.saisie = num(I.salb) * (1 + num(I.salt) / 100); A.ecartSaisie = A.saisie > 0 && A.cout > 0 ? A.cout / A.saisie - 1 : null;
    if (ca > 0) { A.partSal = A.cout * 12 / ca; A.partTout = (A.cout + A.dirCout) * 12 / ca; }
    A.etpTout = A.etp + A.dirN; A.caEtp = A.etpTout > 0 ? ca / A.etpTout : null; A.caEtpRep = CA_ETP[fmt] || 105000;
    A.ouv = ouverture(D);
    var zones = {}; A.liste.forEach(function (x) { if (x.poste.z !== 'autre') zones[x.poste.z] = 1; });
    /* C355 : les lieux du métier (« cuisine et salle » seulement s'il y a une salle) et ce que compte le moteur */
    A.lieux = lieux(zones); A.sousSmic = L.sousSmic || null; A.salMoteur = num(d.sal); A.seul = !L.length && !(num(I.salb) > 0) && (A.dirN > 0 || estDemo(D));
    A.postesMin = Math.max(2, Object.keys(zones).length);
    A.etpMin = A.ouv ? A.ouv * 52 * A.postesMin / PRESENCE : null;
    /* Verdict */
    var lourd = A.partTout != null && rep > 0 && A.partTout > rep / 100 + 0.005;
    if (!A.liste.length) A.k = 'vide';
    else if (A.etpMin && A.etpTout < A.etpMin * 0.95) A.k = 'juste';
    else if (!lourd) A.k = 'ok';
    else if (A.etpMin && A.etpTout <= A.etpMin * 1.1) A.k = 'pas-trop';
    else if (A.caEtp != null && A.caEtp < A.caEtpRep * 0.85) A.k = 'trop';
    else A.k = 'planning';
    A.dirPoints = ca > 0 ? A.dirCout * 12 / ca : 0;
    A.surplus = A.k === 'trop' ? Math.max(0, A.etpTout - ca / A.caEtpRep) : 0;
    return A;
  }
  /* C189 (Steven : « avec les ventes et le personnel complets, on peut anticiper basse et haute saison, gérer son personnel au bon
     moment, sans être en sous-effectif — turnover et fatigue ») : 12 derniers mois de ventes réelles → temps pleins utiles par mois
     = ventes du mois ramenées à l'année ÷ ventes par temps plein du type d'établissement, jamais sous le minimum pour tenir
     l'ouverture. Face à l'équipe actuelle : renfort en haute saison, congés et récupérations en basse saison. */
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function saisons(D, A) {
    /* C333 : « 12 derniers mois » = 12 mois CIVILS jusqu'au dernier mois clos ; un mois fermé compte pour 0 (jamais un mois d'une autre année à sa place). */
    var H = ((D && D.monthlyHistory) || []).filter(function (m) { return m && m.closed !== false && /^\d{4}-\d{2}/.test(String(m.period)); });
    var ouverts = H.filter(function (m) { return num(m.caHT) > 0 && num(m.openDays) > 0; });
    if (!ouverts.length || !(A.etpTout > 0)) return null;
    var fin = ouverts.map(function (m) { return String(m.period).slice(0, 7); }).sort().pop(), y = +fin.slice(0, 4), mo = +fin.slice(5, 7), cles = [];
    for (var k = 11; k >= 0; k--) { var mm = mo - k, yy = y; while (mm < 1) { mm += 12; yy--; } cles.push(yy + '-' + (mm < 10 ? '0' : '') + mm); }
    if (H.map(function (m) { return String(m.period).slice(0, 7); }).sort()[0] > cles[0]) return null; /* moins de 12 mois civils d'historique */
    var par = {}; ouverts.forEach(function (m) { par[String(m.period).slice(0, 7)] = m; });
    var L = cles.map(function (c) { var m = par[c], i = Number(c.slice(5, 7)) - 1; if (!m) return { i: i, ca: 0, besoin: 0, ferme: true }; var b = num(m.caHT) * 12 / A.caEtpRep; return { i: i, ca: num(m.caHT), besoin: Math.max(A.etpMin || 0, b) }; }).sort(function (a, b) { return a.i - b.i; });
    var ouv = L.filter(function (x) { return !x.ferme; });
    var haut = ouv.filter(function (x) { return x.besoin > A.etpTout * 1.08; }), bas = ouv.filter(function (x) { return x.besoin < A.etpTout * 0.85; });
    return { mois: L, haut: haut, bas: bas, ca12: L.reduce(function (s, x) { return s + x.ca; }, 0), max: Math.max.apply(null, ouv.map(function (x) { return x.besoin; }).concat([A.etpTout])) };
  }
  function nomsMois(L) { var n = L.map(function (x) { return MOIS[x.i]; }); return n.length > 2 ? n.slice(0, -1).join(', ') + ' et ' + n[n.length - 1] : n.join(' et '); }
  function saisonsHTML(Sz, A) {
    if (!Sz) return '';
    var mn = Math.min.apply(null, Sz.mois.filter(function (x) { return !x.ferme; }).map(function (x) { return x.besoin; }).concat([A.etpTout])), base = mn * 0.6, /* C333 : un mois fermé n'entre pas dans l'échelle */ haut = function (v) { return Math.round((v - base) / (Sz.max - base) * 100); };
    var h = '<p class="me57-k" style="margin-top:16px">Votre équipe au fil de l’année</p><div class="me57-sz" role="img" aria-label="Temps pleins utiles chaque mois, face à votre équipe actuelle">';
    Sz.mois.forEach(function (x) { if (x.ferme) { h += '<div><i style="height:0"></i><span>' + MOIS[x.i].slice(0, 1).toUpperCase() + '</span></div>'; return; } /* C333 : mois fermé, barre vide */ var c = x.besoin > A.etpTout * 1.08 ? '#ef4444' : x.besoin < A.etpTout * 0.85 ? '#60a5fa' : '#22c55e';
      h += '<div><i style="height:' + haut(x.besoin) + '%;background:' + c + '"></i><span>' + MOIS[x.i].slice(0, 1).toUpperCase() + '</span></div>'; });
    h += '<em style="bottom:' + (18 + haut(A.etpTout)) + 'px"></em></div><p class="me57-szl">Barre = temps pleins utiles d’après vos ventes de ce mois-là ; trait = votre équipe actuelle (' + un(A.etpTout, 1) + ', vous compris). <b style="color:#ef4444">Rouge</b> : renfort utile · <b style="color:#22c55e">vert</b> : équipe juste · <b style="color:#60a5fa">bleu</b> : congés possibles.</p>';
    var t = [];
    if (Sz.haut.length) { var mh = Math.max.apply(null, Sz.haut.map(function (x) { return x.besoin; })); t.push('Haute saison (' + nomsMois(Sz.haut) + ') : il faudrait jusqu’à ' + un(mh, 1) + ' temps pleins. Prévoyez un saisonnier ou des extras sur les pointes, réservés à l’avance : sans renfort, l’équipe s’épuise et les départs arrivent au pire moment.'); }
    if (Sz.bas.length) { var mb = Math.min.apply(null, Sz.bas.map(function (x) { return x.besoin; })); t.push('Basse saison (' + nomsMois(Sz.bas) + ') : ' + un(mb, 1) + ' temps pleins suffisent. C’est le moment de poser les congés et les récupérations, sans les remplacer.'); }
    if (!t.length) t.push('Vos ventes sont régulières toute l’année : votre équipe actuelle convient à chaque saison.');
    return h + t.map(function (x) { return '<p class="sous" style="margin:6px 0 0">' + esc(x) + '</p>'; }).join('');
  }
  /* Grands coûts sur 100 € vendus, face aux repères sains du type d'établissement. */
  function grandsCouts(R, fam, rep) {
    var d = (R && R.d) || {}, ca = num(d.ca); if (!(ca > 0)) return null;
    var S = SAIN[fam] || SAIN.trad, eq = num(d.sal) / ca * 100, mat = num(d.mat) / ca * 100, loy = (num(d.f1) + num(d.f2)) * 12 / ca * 100;
    return { eq: eq, eqRep: rep, mat: mat, matRep: S.mat, loy: loy, loyRep: S.loy, prime: eq + mat, primeRep: S.prime };
  }

  /* « Et sans lui ? » — avant / après, fourchette, reprise par les collègues de la même zone. */
  function sansLui(A, id, R) {
    var x = A.liste.filter(function (y) { return String(y.p.id) === String(id); })[0]; if (!x) return null;
    var h = num(x.p.h), col = A.liste.filter(function (y) { return y !== x && y.poste.z === x.poste.z; }), S = { x: x, maxAn: x.cout * 12 };
    /* Les collègues de la même zone reprennent d'abord, le moins chargé en premier, jusqu'à 43 h par semaine (heures payées
       10 % de plus jusqu'à 39 h, 20 % au-delà) ; ce qui reste passe en extras (brut horaire + 10 % de congés, cotisations). */
    var reste = h, reprise = 0, ajouts = {};
    col.slice().sort(function (a, b) { return num(a.p.h) - num(b.p.h); }).forEach(function (y) {
      var avant = num(y.p.h), place = Math.max(0, 43 - avant), pris = Math.min(place, reste), a = avant, cout = 0;
      function tranche(jusqua, maj) { var t = Math.max(0, Math.min(avant + pris, jusqua) - a); cout += t * y.taux * maj; a += t; }
      tranche(39, 1.10); tranche(43, 1.20);
      reste -= pris; reprise += cout * 52; ajouts[y.p.id] = pris;
    });
    S.collegues = col.map(function (y) { return { nom: y.p.nom, avant: num(y.p.h), apres: num(y.p.h) + (ajouts[y.p.id] || 0) }; }).filter(function (c) { return c.apres > c.avant; });
    S.extrasH = Math.max(0, reste); S.extras = S.extrasH > 0.05;
    if (S.extras) { var brutH = num(x.p.brut) / (h * 52 / 12 || 1); reprise += S.extrasH * 52 * brutH * 1.10 * multiplicateur(x.p.brut, x.p.h); }
    var impossible = false;
    S.minAn = S.maxAn - reprise; S.impossible = impossible; /* peut être négatif : reprendre ses heures coûterait plus que lui */
    var d = (R && R.d) || {}, ca = num(d.ca);
    S.avant = { cout: A.cout + A.dirCout, part: A.partTout, etp: A.etpTout, res: num(d.res) };
    S.apres = { coutMin: A.cout + A.dirCout - S.maxAn / 12, coutMax: A.cout + A.dirCout - S.minAn / 12, etp: A.etpTout - x.etp, resMin: num(d.res) + S.minAn, resMax: num(d.res) + S.maxAn };
    S.dTab = S.minAn < 0;
    if (ca > 0) { S.apres.partMin = (S.apres.coutMin) * 12 / ca; S.apres.partMax = (S.apres.coutMax) * 12 / ca; }
    S.sousMin = A.etpMin != null && S.apres.etp < A.etpMin; S.lieux = A.lieux;
    return S;
  }

  /* ——— Affichage ——— */
  var COUL = { ok: '#22c55e', 'pas-trop': '#eab308', planning: '#f97316', trop: '#ef4444', juste: '#f97316', vide: '#94a3b8' };
  function verdictHTML(A, sh) {
    var rep = A.rep, p = Math.round(A.partTout * 100), t = '', s = [];
    if (A.k === 'ok') t = 'Votre équipe est à sa taille : ' + p + ' € pour 100 € vendus (conseillé : ' + rep + ' € au plus).';
    else if (A.k === 'juste') { t = 'Équipe trop juste : risque de fatigue et de départs.';
      s.push('Pour tenir ' + A.lieux + ' ' + un(A.ouv) + ' h par semaine, il faut au moins ' + un(A.etpMin, 1) + ' temps pleins ; vous en avez ' + un(A.etpTout, 1) + ' (vous compris). Les heures supplémentaires et la fatigue finissent par coûter plus cher qu’un renfort : un départ se remplace difficilement en pleine saison.'); }
    else if (A.k === 'pas-trop') { t = 'Pas trop de monde : l’équipe coûte cher, mais elle n’est pas trop nombreuse.';
      s.push('Pour tenir ' + A.lieux + ' ' + un(A.ouv) + ' h par semaine, il faut au moins ' + un(A.etpMin, 1) + ' temps pleins ; vous en avez ' + un(A.etpTout, 1) + ' (vous compris).'); }
    else if (A.k === 'trop') { t = 'Un peu trop de monde pour vos ventes actuelles.';
      s.push(eur(A.caEtp) + ' de ventes par temps plein, pour ' + eur(A.caEtpRep) + ' habituellement dans votre type d’établissement : environ ' + un(A.surplus, 1) + ' temps plein de plus que ce que vos ventes font tourner.'); }
    else { t = 'Le nombre de personnes va, c’est l’organisation des heures qui coûte.';
      if (A.etpMin) s.push('Pour tenir ' + A.lieux + ' ' + un(A.ouv) + ' h par semaine, il faut au moins ' + un(A.etpMin, 1) + ' temps pleins ; vous en avez ' + un(A.etpTout, 1) + ' (vous compris) : pas de poste en trop.');
      s.push(eur(A.caEtp) + ' de ventes par temps plein, ' + (A.caEtp < A.caEtpRep * 0.95 ? 'un peu en dessous' : 'dans la moyenne') + ' de votre type d’établissement (' + eur(A.caEtpRep) + ').'); }
    if (A.k !== 'ok' && A.k !== 'vide' && A.k !== 'juste') {
      s.push('L’équipe coûte ' + p + ' € pour 100 € vendus (conseillé : ' + rep + ' € au plus).');
      if (A.dirPoints > 0.03) s.push('Votre propre rémunération en représente ' + Math.round(A.dirPoints * 100) + ' € : sans elle, vos salariés coûtent ' + Math.round(A.partSal * 100) + ' € pour 100 € vendus.');
      if (sh && sh.lourd) s.push('Là où ça coûte : ' + ART(sh.lourd.nom) + ', environ ' + Math.round(sh.lourd.heuresEnTrop) + ' h de travail de trop ce mois-ci pour les ventes faites.');
      s.push(A.k === 'trop' ? 'Que faire : ne pas remplacer le prochain départ, ou passer un poste à temps partiel sur les créneaux calmes. Simulez ci-dessous « Et sans lui ? ».' : 'Que faire : caler les prises de poste sur le vrai rush (décaler une arrivée, avancer un départ), plutôt que de retirer quelqu’un.');
    }
    return '<div class="me57-v" style="--c:' + COUL[A.k] + '"><b>' + esc(t) + '</b>' + s.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div>';
  }
  var ARTS = { 'Petit-déjeuner': 'le petit-déjeuner', 'Midi': 'le midi', 'Après-midi': 'l’après-midi', 'Soir': 'le soir' };
  function ART(n) { return ARTS[n] || '« ' + n + ' »'; }
  function ligneHTML(x, ouvert) {
    var p = x.p;
    return '<div class="me57-l' + (ouvert ? ' on' : '') + '" data-me57-id="' + esc(p.id) + '"><div class="me57-n"><b>' + esc(p.nom || '—') + '</b><span>' + esc(x.poste.lib) + ' · ' + esc(p.contrat || 'CDI') + ' · ' + un(num(p.h)) + ' h/sem.</span></div>' +
      '<div class="me57-c"><b>' + eur(x.cout) + '</b><span>par mois · brut ' + eur(p.brut) + '</span></div>' +
      '<div class="me57-a"><button type="button" class="btn ghost" data-me57-sans="' + esc(p.id) + '">Et sans ' + esc(String(p.nom || '').split(' ')[0] || 'ce poste') + ' ?</button><button type="button" class="btn ghost" data-me57-mod="' + esc(p.id) + '">Modifier</button></div></div>';
  }
  function sansHTML(S) {
    var x = S.x, n = esc(String(x.p.nom || '').split(' ')[0] || 'ce poste');
    var h = '<div class="me57-s"><p class="me57-k">Et sans ' + n + ' ? — avant / après, sur l’année</p><table><thead><tr><th></th><th>Avant</th><th>Après</th></tr></thead><tbody>' +
      '<tr><td>Coût de l’équipe par mois</td><td>' + eur(S.avant.cout) + '</td><td>' + eur(S.apres.coutMin) + (S.apres.coutMax - S.apres.coutMin > 10 ? ' à ' + eur(S.apres.coutMax) : '') + '</td></tr>' +
      (S.avant.part != null ? '<tr><td>Pour 100 € vendus</td><td>' + Math.round(S.avant.part * 100) + ' €</td><td>' + Math.round(S.apres.partMin * 100) + (Math.round(S.apres.partMax * 100) !== Math.round(S.apres.partMin * 100) ? ' à ' + Math.round(S.apres.partMax * 100) : '') + ' €</td></tr>' : '') +
      '<tr><td>Temps pleins</td><td>' + un(S.avant.etp, 1) + '</td><td>' + un(S.apres.etp, 1) + '</td></tr>' +
      '<tr><td>Résultat avant impôt par an</td><td>' + eur(S.avant.res) + '</td><td>' + eur(S.apres.resMin) + (S.apres.resMax - S.apres.resMin > 50 ? ' à ' + eur(S.apres.resMax) : '') + '</td></tr></tbody></table>';
    var t = [];
    var comment = ' : ses collègues en reprennent une partie en heures supplémentaires (payées 10 à 20 % de plus)';
    if (S.minAn < 0) t.push('Économie : jusqu’à ' + eur(S.maxAn) + ' par an si ses ' + un(num(x.p.h)) + ' h par semaine n’étaient pas utiles. Mais s’il faut les faire quand même, ça coûterait ' + eur(-S.minAn) + ' de plus par an' + (S.collegues.length ? ', car ses collègues sont mieux payés et leurs heures supplémentaires sont majorées' : '') + (S.extras ? (S.collegues.length ? ', avec ' : ' : ') + un(S.extrasH, 1) + ' h par semaine en extras' : '') + '.');
    else t.push('Économie : entre ' + eur(S.minAn) + ' et ' + eur(S.maxAn) + ' par an. Le haut, si ses ' + un(num(x.p.h)) + ' h par semaine n’étaient pas utiles ; le bas, s’il faut les faire quand même' + (S.collegues.length ? comment : '') + (S.extras ? (S.collegues.length ? ', et ' : ' : ') + un(S.extrasH, 1) + ' h par semaine en extras' : '') + '.');
    if (S.collegues.length) t.push('Ses collègues passeraient à : ' + S.collegues.map(function (c) { return esc(String(c.nom).split(' ')[0]) + ' ' + un(c.avant) + ' → ' + un(c.apres, 1) + ' h'; }).join(', ') + ' par semaine.');
    if (S.sousMin) t.push('Attention : sans ce poste, il ne reste plus assez de monde pour tenir ' + esc(S.lieux || 'cuisine et salle') + ' à vos heures d’ouverture.');
    t.push('Aucune vente en plus n’est comptée. Le plus sûr : ne pas remplacer un départ volontaire. Un licenciement ou une rupture a un coût de séparation, non compté ici (à voir avec votre comptable). Verdict ne décide jamais à votre place.');
    return h + t.map(function (y) { return '<p>' + y + '</p>'; }).join('') + '</div>';
  }
  function formHTML(p) {
    p = p || {}; var opt = function (L, v, f) { return L.map(function (o) { var k = f ? o.k : o, l = f ? o.lib : o; return '<option value="' + esc(k) + '"' + (k === v ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join(''); };
    return '<div class="me57-f" data-me57-form="' + esc(p.id || '') + '"><label>Prénom ou initiales<input data-me57-in="nom" value="' + esc(p.nom || '') + '" maxlength="30"></label>' +
      '<label>Poste<select data-me57-in="poste">' + opt(POSTES, p.poste || 'serveur', true) + '</select></label>' +
      '<label>Contrat<select data-me57-in="contrat">' + opt(CONTRATS, p.contrat || 'CDI') + '</select></label>' +
      '<label>Heures par semaine<input data-me57-in="h" type="number" inputmode="decimal" min="1" max="48" step="0.5" value="' + esc(p.h || 39) + '"></label>' +
      '<label>Salaire brut par mois<input data-me57-in="brut" type="number" inputmode="decimal" min="0" step="10" value="' + esc(p.brut ? Math.round(p.brut) : '') + '"></label>' +
      '<div class="me57-fa"><button type="button" class="btn" data-me57-ok="1">Enregistrer</button>' + (p.id ? '<button type="button" class="btn ghost" data-me57-del="' + esc(p.id) + '">Retirer de la liste</button>' : '') + '<button type="button" class="btn ghost" data-me57-x="1">Annuler</button></div></div>';
  }
  function carteHTML(A, G, sh, etat) {
    var h = '<p class="me57-k">Mon équipe, salarié par salarié' + (A.liste.some(function (x) { return x.p.demo; }) ? ' · démonstration' : '') + '</p>';
    if (A.k === 'vide' && A.seul) return h + '<p class="titre">Pas de salarié : vous travaillez seul</p><p class="sous">Coût de l’équipe (vous compris) : <b>' + eur(A.salMoteur) + ' par an</b>, le même chiffre que dans Structure' + (A.dirN > 0 ? ' (votre rémunération, cotisations comprises : ' + eur(A.dirCout) + ' par mois)' : '') + '. Si vous embauchez, ajoutez le salarié : Verdict calcule son coût réel et vous dit si l’équipe est à la bonne taille.</p>' +
      (etat.form ? formHTML(etat.formP) : '<div class="actions"><button type="button" class="btn" data-me57-add="1">+ Ajouter un salarié</button></div>');
    if (A.k === 'vide') return h + '<p class="titre">Ajoutez vos salariés pour savoir si votre équipe est à la bonne taille</p><p class="sous">Poste, heures et salaire brut suffisent : Verdict calcule le coût réel pour vous (cotisations après la réduction générale) et vous dit, sans jargon, si vous avez trop de monde ou si c’est l’organisation des heures qui coûte.</p>' +
      (etat.form ? formHTML(etat.formP) : '<div class="actions"><button type="button" class="btn" data-me57-add="1">+ Ajouter un salarié</button></div>');
    h += verdictHTML(A, sh);
    if (A.sousSmic) h += '<p class="me57-w">Démonstration : la masse salariale de ce modèle (' + eur(A.sousSmic.masse) + (A.sousSmic.charge ? ' brut' : ' chargé') + ' par mois pour ' + un(A.sousSmic.n, 1) + ' temps plein' + (A.sousSmic.n > 1 ? 's' : '') + ', soit ' + eur(A.sousSmic.parTempsPlein) + ' chacun) ne paie pas le SMIC d’un temps plein de 39 h (' + eur(A.sousSmic.smic) + '). Les salaires ci-dessous en sont la part exacte, sans arrangement.</p>';
    h += '<div class="me57-liste">' + A.liste.map(function (x) { return ligneHTML(x, etat.sans === String(x.p.id)) + (etat.sans === String(x.p.id) ? sansHTML(sansLui(A, x.p.id, etat.R)) : '') + (etat.form && etat.formP && String(etat.formP.id) === String(x.p.id) ? formHTML(etat.formP) : ''); }).join('');
    if (A.dirN > 0) h += '<div class="me57-l me57-dir"><div class="me57-n"><b>Vous</b><span>Dirigeant · ' + un(A.dirN, 1) + ' temps plein</span></div><div class="me57-c"><b>' + eur(A.dirCout) + '</b><span>par mois, cotisations comprises</span></div><div class="me57-a"></div></div>';
    h += '<div class="me57-l me57-tot"><div class="me57-n"><b>Total</b><span>' + A.liste.length + ' salarié' + (A.liste.length > 1 ? 's' : '') + ' · ' + un(A.etp, 1) + ' temps plein' + (A.etp > 1 ? 's' : '') + ' · ' + un(A.h) + ' h/sem.</span></div><div class="me57-c"><b>' + eur(A.cout + A.dirCout) + '</b><span>par mois, vous compris</span></div><div class="me57-a"></div></div></div>';
    h += saisonsHTML(saisons(w.DB, A), A);
    h += etat.form && !(etat.formP && etat.formP.id) ? formHTML(etat.formP) : '<div class="actions"><button type="button" class="btn ghost" data-me57-add="1">+ Ajouter un salarié</button></div>';
    h += '<label class="me57-o">Heures d’ouverture par semaine<input data-me57-ouv="1" type="number" inputmode="decimal" min="10" max="168" step="1" value="' + esc(A.ouv || '') + '"></label>';
    if (A.ecartSaisie != null && Math.abs(A.ecartSaisie) > 0.05) h += '<p class="me57-w">Vos fiches font ' + eur(A.cout) + ' par mois, vos chiffres de l’année ' + eur(A.saisie) + '. <button type="button" class="btn ghost" data-me57-sync="1">Utiliser mes fiches dans mes chiffres</button></p>';
    if (G) {
      var chip = function (lib, v, r) { var c = v <= r + 0.5 ? '#22c55e' : v <= r + 5 ? '#f97316' : '#ef4444'; return '<div class="me57-g" style="--c:' + c + '"><span>' + lib + '</span><b>' + Math.round(v) + ' €</b><small>sain : ' + r + ' € au plus</small></div>'; };
      h += '<p class="me57-k" style="margin-top:16px">Vos grands coûts, sur 100 € vendus</p><div class="me57-gs">' + chip('Équipe (vous compris)', G.eq, G.eqRep) + chip('Marchandise', G.mat, G.matRep) + chip('Loyer et charges', G.loy, G.loyRep) + chip('Équipe + marchandise', G.prime, G.primeRep) + '</div>';
    }
    h += '<p class="sous" style="font-size:12.5px;opacity:.8">Coût réel = salaire brut + cotisations patronales après la réduction générale 2026 (environ +8 % au SMIC, jusqu’à +45 % pour un cadre). Repères : moyennes nationales 2025 des restaurants (UMIH, experts-comptables) et cabinets spécialisés. Ce n’est pas un calcul de paie : votre bulletin fait foi.</p>';
    return h;
  }
  var CSS = '#me57{margin:0 0 16px}#me57 .me57-k{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin:0 0 8px}' +
    '#me57 .me57-v{border-left:4px solid var(--c);padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--c) 10%,transparent);margin:0 0 12px}#me57 .me57-v b{display:block;font-size:17px;line-height:1.3;margin-bottom:4px}#me57 .me57-v p{margin:4px 0 0;font-size:14px;line-height:1.45}' +
    '#me57 .me57-l{display:grid;grid-template-columns:1fr auto;gap:4px 10px;padding:10px 0;border-top:1px solid rgba(148,163,184,.22)}#me57 .me57-n b,#me57 .me57-c b{display:block}#me57 .me57-n span,#me57 .me57-c span{font-size:12.5px;opacity:.75}#me57 .me57-c{text-align:right;font-variant-numeric:tabular-nums}' +
    '#me57 .me57-a{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}#me57 .me57-a:empty{display:none}#me57 .me57-a .btn{padding:6px 12px;font-size:13px;min-height:0;width:auto!important;flex:0 0 auto}#me57 .me57-tot b{font-size:16px}' +
    '#me57 .me57-s{margin:0 0 10px;padding:10px 12px;border-radius:12px;background:rgba(148,163,184,.1)}#me57 .me57-s table{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}#me57 .me57-s td,#me57 .me57-s th{padding:5px 4px;text-align:right;border-top:1px solid rgba(148,163,184,.2)}#me57 .me57-s td:first-child,#me57 .me57-s th:first-child{text-align:left}#me57 .me57-s p{font-size:13.5px;line-height:1.45;margin:8px 0 0}' +
    '#me57 .me57-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:8px 0;padding:10px;border-radius:12px;background:rgba(148,163,184,.1)}#me57 .me57-f label,#me57 .me57-o{display:flex;flex-direction:column;gap:4px;font-size:12.5px}#me57 .me57-f input,#me57 .me57-f select,#me57 .me57-o input{font:inherit;font-size:15px;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,.4);background:transparent;color:inherit}#me57 .me57-fa{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}' +
    '#me57 .me57-o{margin:12px 0;max-width:260px}#me57 .me57-w{font-size:13.5px;padding:8px 10px;border-radius:10px;background:rgba(234,179,8,.14)}' +
    '#me57 .me57-sz{position:relative;display:grid;grid-template-columns:repeat(12,1fr);gap:4px;height:100px;box-sizing:content-box;align-items:end;padding:6px 0 18px}#me57 .me57-sz>div{position:relative;height:100px;display:flex;align-items:flex-end}#me57 .me57-sz i{display:block;width:100%;border-radius:6px 6px 2px 2px;opacity:.9}#me57 .me57-sz span{position:absolute;bottom:-18px;left:0;right:0;text-align:center;font-size:11px;opacity:.7}#me57 .me57-sz em{position:absolute;left:0;right:0;border-top:2px dashed currentColor;opacity:.6}#me57 .me57-szl{font-size:12px;opacity:.72;margin:6px 0 0}#me57 .me57-gs{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}#me57 .me57-g{padding:10px;border-radius:12px;border:1px solid color-mix(in srgb,var(--c) 45%,transparent);background:color-mix(in srgb,var(--c) 9%,transparent)}#me57 .me57-g span,#me57 .me57-g small{display:block;font-size:12px;opacity:.78}#me57 .me57-g b{display:block;font-size:22px;color:var(--c);font-variant-numeric:tabular-nums}';

  var ETAT = { sans: null, form: false, formP: null };
  function contexte() {
    var D = w.DB, R = null, fmt = null, rep = 36, fam = 'trad';
    try { R = w.moteur(); } catch (e) {}
    try { fmt = w.fmtActif(); fam = (w.FORMATS[fmt] || {}).f || 'trad'; } catch (e) {}
    try { rep = typeof w.vdRepMs === 'function' ? w.vdRepMs() : Math.round(w.FAMILLES[fam].ms[1]); } catch (e) {}
    var sh = null; try { var S = w.VerdictServicesHeures && w.VerdictServicesHeures.etat('mois'); if (S && !S.vide) sh = S; } catch (e) {}
    return { D: D, R: R, fmt: fmt, fam: fam, rep: rep, sh: sh };
  }
  function dessiner(force) {
    var vue = doc.getElementById('v-sal'), corps = doc.getElementById('salBody'); if (!vue || !corps || !w.DB) return;
    if (!doc.getElementById('me57-css')) { var s = doc.createElement('style'); s.id = 'me57-css'; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s); }
    var C = contexte(); if (!C.R || !C.R.ready) return;
    var A = analyser(C.D, C.R, C.fmt, C.rep), G = grandsCouts(C.R, C.fam, C.rep); ETAT.R = C.R;
    var html = carteHTML(A, G, C.sh, ETAT), el = doc.getElementById('me57');
    if (!el) { el = doc.createElement('article'); el.id = 'me57'; el.className = 'card'; corps.parentNode.insertBefore(el, corps); }
    else if (el.nextElementSibling !== corps) corps.parentNode.insertBefore(el, corps);
    if (!force && el.__html === html) return; el.__html = html; el.innerHTML = html;
  }
  function liste() { var D = w.DB; if (!Array.isArray(D.staff) || !D.staff.length) D.staff = equipe(D).map(function (p) { var q = {}; for (var k in p) q[k] = p[k]; return q; }); return D.staff; }
  function enregistrer() { try { w.save(); } catch (e) {} dessiner(true); }
  function lireForm(f) { var o = {}; [].forEach.call(f.querySelectorAll('[data-me57-in]'), function (i) { o[i.getAttribute('data-me57-in')] = i.value; }); return o; }
  doc.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('#me57 [data-me57-sans],#me57 [data-me57-mod],#me57 [data-me57-add],#me57 [data-me57-ok],#me57 [data-me57-del],#me57 [data-me57-x],#me57 [data-me57-sync]') : null; if (!t) return;
    var g = function (a) { return t.getAttribute(a); };
    if (g('data-me57-sans') != null) { ETAT.sans = ETAT.sans === g('data-me57-sans') ? null : g('data-me57-sans'); ETAT.form = false; dessiner(true); return; }
    if (g('data-me57-mod') != null) { var id = g('data-me57-mod'), p = equipe(w.DB).filter(function (x) { return String(x.id) === id; })[0]; ETAT.form = true; ETAT.formP = p; ETAT.sans = null; dessiner(true); return; }
    if (g('data-me57-add') != null) { ETAT.form = true; ETAT.formP = null; ETAT.sans = null; dessiner(true); return; }
    if (g('data-me57-x') != null) { ETAT.form = false; ETAT.formP = null; dessiner(true); return; }
    if (g('data-me57-del') != null) { var L = liste(), k = g('data-me57-del'); w.DB.staff = L.filter(function (x) { return String(x.id) !== k; }); ETAT.form = false; ETAT.formP = null; enregistrer(); return; }
    if (g('data-me57-ok') != null) {
      var f = t.closest('[data-me57-form]'), o = lireForm(f), h = Math.max(1, Math.min(48, num(String(o.h).replace(',', '.')))), b = Math.max(0, num(String(o.brut).replace(',', '.')));
      if (!(b > 0)) { var ib = f.querySelector('[data-me57-in="brut"]'); if (ib) { ib.focus(); ib.style.borderColor = '#ef4444'; } return; }
      var L2 = liste(), fid = f.getAttribute('data-me57-form'), rec = { id: fid || 'p' + Date.now().toString(36), nom: String(o.nom || '').trim().slice(0, 30) || poste(o.poste).lib, poste: o.poste, contrat: o.contrat, h: h, brut: b };
      var i = -1; L2.forEach(function (x, j) { if (String(x.id) === fid) i = j; }); if (i >= 0) L2[i] = rec; else L2.push(rec);
      ETAT.form = false; ETAT.formP = null; enregistrer(); return;
    }
    if (g('data-me57-sync') != null) {
      var C = contexte(), A = analyser(w.DB, C.R, C.fmt, C.rep); if (!(A.brut > 0)) return;
      w.DB.in.salb = Math.round(A.brut); w.DB.in.saln = Math.round(A.etp * 10) / 10; w.DB.in.salt = Math.round((A.cout / A.brut - 1) * 1000) / 10;
      enregistrer(); try { w.drawSal && w.drawSal(); } catch (e) {} return;
    }
  });
  doc.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.matches || !t.matches('#me57 [data-me57-ouv]')) return;
    var v = num(String(t.value).replace(',', '.')); w.DB.equipeOuverture = v > 0 ? Math.min(168, v) : null; enregistrer();
  });
  function tour() { try { var vue = doc.getElementById('v-sal'); if (vue && (vue.classList.contains('on') || vue.classList.contains('active') || vue.offsetParent)) dessiner(false); } catch (e) {} }
  var it = setInterval(tour, 1000); if (it && it.unref) it.unref();
  w.VerdictMonEquipe = { analyser: analyser, saisons: saisons, sansLui: sansLui, grandsCouts: grandsCouts, multiplicateur: multiplicateur, smicMois: smicMois, coutMois: coutMois, equipeDemo: equipeDemo, tour: tour, POSTES: POSTES, partLivraison: partLivraison, gabarit: gabarit, brutDepuisCout: brutDepuisCout };
})();
