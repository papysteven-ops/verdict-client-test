/* C116 — Chaque établissement est relié à son inventaire dès le départ (Steven, 16/10 : « il faut absolument connecter
   chaque établissement à son inventaire dès le début ; là je peux créer un inventaire qui n'a rien à voir avec mon
   établissement »).
   Dans l'Inventaire ouvert à l'intérieur de Verdict (cadre de la coquille), l'établissement vient toujours de Verdict :
   - « Faisons connaissance » reprend le nom de l'établissement relié, sans pouvoir le changer ici ;
   - le bouton « + » ouvre la création d'établissement de Verdict (son inventaire est créé et relié automatiquement) ;
   - « Modifier l'établissement » garde le nom de Verdict (on change l'icône, pas l'identité) ;
   - si l'établissement est renommé dans Verdict, l'inventaire suit.
   L'appli Inventaire gratuite seule, la formule « Inventaire seul », l'équipe et la démonstration gardent leur
   fonctionnement : il n'y a alors pas de Verdict à relier. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.__vdEtabLien) return; w.__vdEtabLien = true;
  function parentOk() { try { return w.parent && w.parent !== w && w.parent.location.origin === w.location.origin && !!w.parent.VerdictUnifiedShell; } catch (e) { return false; } }
  function formuleInventaire() { try { var P = w.parent.VerdictPlan; return !!(P && P.actif && P.actif() && P.etat().niveau === 'inventaire'); } catch (e) { return false; } }
  function flag(n) { try { return !!w.eval('typeof ' + n + '!=="undefined"&&' + n); } catch (e) { return false; } }
  /* Relié à Verdict : cadre de la coquille, ni démonstration, ni équipe, ni inventaire partagé, ni formule Inventaire seul. */
  function relie() { return parentOk() && !flag('DEMO') && !flag('STAFF') && !flag('SHARED') && !flag('OWNER_TEAM') && !formuleInventaire(); }
  function db() { try { return w.eval('typeof DB!=="undefined"?DB:null'); } catch (e) { return null; } }
  function nomSite() { var d = db(); try { return (typeof w.siteName === 'function' && d) ? w.siteName(d.site) : (d && d.sites && d.sites[d.site] && d.sites[d.site].name) || ''; } catch (e) { return ''; } }
  function toast(t) { try { if (typeof w.toast === 'function') w.toast(t); } catch (e) {} }

  /* « + » → création d'établissement dans Verdict (le cadre Verdict est ouvert, puis son choix de création). */
  function creerDansVerdict() {
    var sh = w.parent.VerdictUnifiedShell;
    try { sh.activateModule('pilotage', {}); } catch (e) {}
    var essais = 0;
    (function tenter() {
      var f = w.parent.document.getElementById('frame-verdict'), cw = null; try { cw = f && f.contentWindow; } catch (e) {}
      if (cw && typeof cw.verdictNewEtabChooser === 'function') { try { cw.verdictNewEtabChooser(); } catch (e) {} return; }
      if (essais++ < 40) setTimeout(tenter, 250);
    })();
  }
  var openSpace0 = w.openSpace;
  if (typeof openSpace0 === 'function') {
    w.openSpace = function (k) {
      if (!relie()) return openSpace0.apply(this, arguments);
      if (!k) { toast('Nouvel établissement : il se crée dans Verdict, son inventaire est relié automatiquement'); creerDansVerdict(); return; }
      var r = openSpace0.apply(this, arguments);
      var n = doc.getElementById('sName'); if (n) { n.readOnly = true; n.setAttribute('aria-readonly', 'true'); n.title = 'Nom de l’établissement dans Verdict'; }
      var del = doc.getElementById('sDel'); if (del) del.style.display = 'none';
      if (n && !doc.getElementById('sLien')) { var p = doc.createElement('small'); p.id = 'sLien'; p.style.cssText = 'display:block;margin-top:6px;color:var(--mut,#8b94a0);font-size:12.5px'; p.textContent = 'Relié à votre établissement Verdict : le nom se change dans Verdict, l’inventaire suit.'; n.parentNode.appendChild(p); }
      return r;
    };
  }
  /* « Faisons connaissance » : l'établissement est celui de Verdict. */
  var wStep0 = w.wStep;
  if (typeof wStep0 === 'function') {
    w.wStep = function (i) {
      var r = wStep0.apply(this, arguments);
      if (!relie()) return r;
      if (i === 1) {
        var inp = doc.getElementById('wResto'), nom = nomSite();
        if (inp && nom) { inp.value = nom; inp.readOnly = true; inp.setAttribute('aria-readonly', 'true'); inp.classList.remove('miss');
          var lab = inp.closest('label') && inp.closest('label').querySelector('span'); if (lab) lab.textContent = 'Votre établissement (relié à Verdict)'; }
      }
      if (i === 2) {
        var rows = doc.querySelectorAll('#w2 .wrow'); var r0 = rows && rows[0];
        if (r0) { var b = r0.querySelector('b'), s = r0.querySelector('span'); if (b) b.textContent = 'Plusieurs établissements ?'; if (s) s.textContent = 'Ajoutez-les dans Verdict : chacun reçoit automatiquement son inventaire, relié dès le départ.'; }
      }
      return r;
    };
  }
  /* Renommé dans Verdict → l'inventaire suit (même identifiant d'établissement). */
  w.addEventListener('message', function (ev) {
    var d = ev && ev.data; if (!d || d.type !== 'verdict-unified-apply-context' || !d.context) return;
    setTimeout(function () {
      try {
        if (!relie()) return; var c = d.context, base = db(); if (!base || !base.sites || c.demo) return;
        var id = String(c.siteId || ''), nom = String(c.name || '').trim().slice(0, 100); if (!id || !nom || !base.sites[id]) return;
        /* C218 (W75) : le nom par défaut de Verdict n'écrase jamais le vrai nom choisi dans l'Inventaire ; c'est l'inverse qui se fait. */
        if (parDefaut(nom) && !parDefaut(base.sites[id].name)) { versVerdict(); return; }
        if (base.sites[id].name !== nom) { base.sites[id].name = nom; try { w.save('etab-lien'); } catch (e) {} try { w.drawSpaces(); } catch (e) {} }
      } catch (e) {}
    }, 0);
  });
  /* C218 (W75) : un établissement nommé dans l'Inventaire (formule gratuite, avant l'essai) garde son nom dans Pilotage.
     Quand l'établissement actif de Verdict n'a encore que le nom par défaut et aucun inventaire relié, il reçoit le nom du
     site de l'Inventaire et lui est relié. Rien ne change si le patron a déjà nommé son établissement dans Verdict. */
  function parDefaut(n) { n = String(n || '').trim(); return !n || /^(mon|nouvel) établissement$/i.test(n); }
  function versVerdict() {
    try {
      if (!relie()) return false; var base = db(); if (!base || !base.sites || !base.site) return false;
      var site = base.sites[base.site], nom = String(site && site.name || '').trim().slice(0, 100); if (parDefaut(nom)) return false;
      var f = w.parent.document.getElementById('frame-verdict'), V = f && f.contentWindow; if (!V || !V.STORE || !V.STORE.etabs) return false;
      var S = V.STORE, D = S.etabs[S.actif]; if (!D || D._demo && D._demo.active) return false;
      var lien = D.inventoryLink && D.inventoryLink.siteId; if (lien && lien !== base.site) return false;
      if (!parDefaut(D.etab)) return true;
      var deja = (S.ordre || []).some(function (id) { return id !== S.actif && String(S.etabs[id] && S.etabs[id].etab || '').trim() === nom; }); if (deja) return false;
      D.etab = nom; D.inventoryLink = Object.assign({}, D.inventoryLink || {}, { siteId: base.site, siteName: nom });
      try { V.save('etab-lien-nom'); } catch (e) {}
      try { if (V.fillInputs) V.fillInputs(); } catch (e) {} try { if (V.drawEtabs) V.drawEtabs(); } catch (e) {} try { if (V.refreshAll) V.refreshAll(); } catch (e) {}
      try { if (V.VerdictUnified && V.VerdictUnified.publishContext) V.VerdictUnified.publishContext(); } catch (e) {}
      return true;
    } catch (e) { return false; }
  }
  var essaisNom = 0, minuteurNom = setInterval(function () { if (versVerdict() || ++essaisNom > 40) clearInterval(minuteurNom); }, 1500);
  w.VerdictEtabLien = { relie: relie, versVerdict: versVerdict };
})();
