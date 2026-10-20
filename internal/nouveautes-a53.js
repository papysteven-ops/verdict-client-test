/* C171 — « ✓ Verdict mis à jour » (Steven, 19/10 : « on garde la mise à jour automatique, mais toujours l'indiquer — oui, je
   veux ça parfait »).
   Depuis C166, une nouvelle version s'installe d'elle-même à l'ouverture : plus aucun message, donc le client ne sait plus
   que quelque chose a changé. Ici :
   - juste après une mise à jour (version installée différente de la dernière vue sur cet appareil), un petit message discret,
     une seule fois par version : « ✓ Verdict mis à jour — Nouveau : … » ; il part seul après 7 s, ou d'un appui ;
   - jamais par-dessus l'écran de verrouillage (il attend l'ouverture), jamais à la première installation ;
   - la liste des dernières nouveautés reste dans 🔒 › Version.
   NOUVEAUTES : une ligne par changement visible du client, la plus récente en premier, en mots de client (pas de code). */
(function () {
  'use strict';
  var w = window, doc = document; if (w.top !== w || w.VerdictNouveautes) return;
  var NOUVEAUTES = [
    { id: 'C185', date: '2026-10-21', titre: 'Accueil › Jour : les repères suivent aussi le jour touché ; chiffres recoupés (ventes au même jour du mois précédent, plus de dates futures), démonstration et Aide corrigées' },
    { id: 'C184', date: '2026-10-21', titre: 'Salaires, Alertes, Simuler, Structure, Organisation et Recommandations en mots simples, sans jargon' },
    { id: 'C183', date: '2026-10-20', titre: 'Accueil › Jour : touchez un jour de « Vos journées » pour revoir tout son détail (journée, courbe, ventes et heures par service)' },
    { id: 'C182', date: '2026-10-20', titre: 'Carte et Inventaire en mots simples : un seul prix conseillé par plat, familles de plats en clair, stock et commandes lisibles' },
    { id: 'C180', date: '2026-10-20', titre: 'Coût de l’équipe : les mêmes seuils partout (Priorités, Simuler, score, alertes) — conseillé pour votre type d’établissement, à surveiller jusqu’à +5 points' },
    { id: 'C179', date: '2026-10-20', titre: 'Un seul nom partout : coût de l’équipe, coût de la marchandise, seuil de rentabilité, temps pleins — et les mêmes seuils sur tous les écrans' },
    { id: 'C178', date: '2026-10-20', titre: 'Accueil en mots simples : « il vous reste X € pour 100 € vendus », ventes hors TVA, salaires conseillés pour votre type d’établissement' },
    { id: 'C177', date: '2026-10-20', titre: 'Minimum du jour : chaque chiffre expliqué, avec le calcul (ex. 1 676 € − 170 € = 1 506 €)' },
    { id: 'C176', date: '2026-10-20', titre: 'L’essentiel d’abord : Ma carte s’ouvre sur vos plats, l’Accueil sur votre journée, Décisions sur les actions' },
    { id: 'C175', date: '2026-10-19', titre: 'Plus de bandeau « Nouvelle version » : Verdict se met à jour tout seul, sans rien vous demander' },
    { id: 'C174', date: '2026-10-19', titre: 'Repères & secteur : la masse salariale se compare au repère de votre format d’établissement, le même que dans la décision et les cartes Équipe' },
    { id: 'C173', date: '2026-10-19', titre: 'Repères & secteur : le radar « La structure en un regard » est retiré, place aux 9 repères' },
    { id: 'C172', date: '2026-10-19', titre: 'Accueil › Mois : l’équipe en direct (jauge verte à rouge) et les heures à prévoir le mois prochain' },
    { id: 'C171', date: '2026-10-19', titre: 'Après chaque mise à jour, Verdict vous dit ce qui est nouveau' },
    { id: 'C170', date: '2026-10-19', titre: 'Accueil › Jour : limite de consommation et décision prioritaire regroupées tout en bas' },
    { id: 'C169', date: '2026-10-19', titre: 'Ventes et heures par service : coût de l’équipe en euros et part de chaque service dans le CA' },
    { id: 'C168', date: '2026-10-19', titre: 'Ventes et heures par service (Jour, Mois, Année) : ce que rapporte une heure de travail, midi et soir' },
    { id: 'C167', date: '2026-10-19', titre: 'Courbe des journées : elle se fait glisser à la souris' },
    { id: 'C166', date: '2026-10-19', titre: 'Mises à jour automatiques à l’ouverture, sans bouton à toucher' }
  ];
  var CLE_VERSION = 'verdict:version-vue', CLE_NOUV = 'verdict:nouveaute-vue';
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(id) { return +String(id || '').replace(/\D/g, '') || 0; }
  /* Nouveautés jamais montrées sur cet appareil (plus récentes que la dernière vue). */
  function nonVues(vue) { var n = num(vue); return NOUVEAUTES.filter(function (x) { return num(x.id) > n; }); }
  /* Décision pure : que montrer, étant donné la version installée et ce que l'appareil a déjà vu ? */
  function decider(courante, versionVue, nouvVue) {
    if (!courante) return { montrer: false, attendre: true };
    if (!versionVue) return { montrer: false, premiere: true };
    if (versionVue === courante) return { montrer: false };
    var L = nonVues(nouvVue);
    return { montrer: true, titre: L.length ? L[0].titre : 'Améliorations et corrections', autres: Math.max(0, L.length - 1) };
  }
  function marquer(courante) { ecrire(CLE_VERSION, courante); if (NOUVEAUTES.length) ecrire(CLE_NOUV, NOUVEAUTES[0].id); }

  function sombre() {
    var h = doc.documentElement; if (h.classList.contains('vd-workspace-dark')) return true; if (h.classList.contains('vd-workspace-light')) return false;
    return !!(w.matchMedia && w.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function css() {
    if (doc.getElementById('nv53-css')) return;
    var s = doc.createElement('style'); s.id = 'nv53-css';
    s.textContent = '#nv53{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147482990;display:flex;align-items:center;gap:12px;' +
      'width:max-content;max-width:min(520px,calc(100% - 24px));box-sizing:border-box;padding:12px 16px 12px 12px;border-radius:16px;background:#0f172a;color:#fff;' +
      'box-shadow:0 14px 40px rgba(15,23,42,.35);font:500 14px/1.35 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;cursor:pointer;animation:nv53In .35s ease-out both}' +
      '#nv53 i{flex:none;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#22c55e;color:#04150b;font:900 15px/1 system-ui;font-style:normal}' +
      '#nv53 b{display:block;font-size:15px;font-weight:800}#nv53 small{display:block;opacity:.8;font-size:13px}' +
      '#nv53.nv53-clair{background:#fff;color:#0f172a;border:1px solid rgba(15,23,42,.12);box-shadow:0 14px 40px rgba(0,0,0,.5)}' +
      '#nv53.nv53-part{animation:nv53Out .3s ease-in both}' +
      '@media (max-width:820px){#nv53{bottom:calc(104px + env(safe-area-inset-bottom,0px))}}' +
      '@keyframes nv53In{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}' +
      '@keyframes nv53Out{to{opacity:0;transform:translate(-50%,12px)}}' +
      '@media (prefers-reduced-motion:reduce){#nv53,#nv53.nv53-part{animation:none}}';
    (doc.head || doc.documentElement).appendChild(s);
  }
  function montrer(D) {
    if (doc.getElementById('nv53')) return;
    css();
    var b = doc.createElement('div'); b.id = 'nv53'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite');
    b.innerHTML = '<i aria-hidden="true">✓</i><span><b>Verdict mis à jour</b><small>Nouveau : ' + esc(D.titre) + (D.autres ? ' · et ' + D.autres + ' autre' + (D.autres > 1 ? 's' : '') + ' dans 🔒 › Version' : '') + '</small></span>';
    b.classList.toggle('nv53-clair', sombre());
    var parti = false;
    function partir() { if (parti) return; parti = true; b.classList.add('nv53-part'); setTimeout(function () { if (b.parentNode) b.remove(); }, 320); }
    b.addEventListener('click', partir);
    doc.body.appendChild(b);
    setTimeout(partir, 7000);
  }
  /* Le message attend que l'appli soit ouverte (verrou levé), visible, et que la version installée soit connue. */
  function verrouVisible() { var v = doc.getElementById('vr16'); return !!(v && !v.hidden && v.getClientRects().length); }
  var essais = 0, fait = false;
  function tour() {
    if (fait) return;
    if (essais++ > 90) return;
    if (doc.hidden || verrouVisible() || !doc.body || !w.VerdictMaj || !w.VerdictMaj.etat) return setTimeout(tour, 1000);
    w.VerdictMaj.etat().then(function (e) {
      var cour = e && e.courante, D = decider(cour, lire(CLE_VERSION), lire(CLE_NOUV));
      if (D.attendre) return setTimeout(tour, 2000);
      fait = true;
      if (D.montrer) montrer(D);
      marquer(cour);
    }, function () { setTimeout(tour, 2000); });
  }
  setTimeout(tour, 2500);

  /* 🔒 › Version : les dernières nouveautés. */
  function listeHTML(n) {
    var L = NOUVEAUTES.slice(0, n || 6), M = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    return '<details class="nv53-liste" style="margin:2px 0 10px;text-align:left;font-size:13px;color:#a3adb8"><summary style="cursor:pointer;min-height:32px;align-content:center;color:#cbd5e1;font-weight:600">Nouveautés</summary><ul style="margin:4px 0 0;padding-left:18px;line-height:1.45">' +
      L.map(function (x) { var p = x.date.split('-'); return '<li style="margin:0 0 4px">' + esc(x.titre) + ' <span style="opacity:.7;white-space:nowrap">· ' + (+p[2]) + '\u00a0' + M[+p[1] - 1] + '</span></li>'; }).join('') + '</ul></details>';
  }
  w.VerdictNouveautes = { liste: NOUVEAUTES, decider: decider, listeHTML: listeHTML, montrer: montrer, nonVues: nonVues };
})();
