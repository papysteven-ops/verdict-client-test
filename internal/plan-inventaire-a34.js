/* C107 — Formule « Inventaire seul, gratuit » et essai de 14 jours (Steven, 16/10 : « l'Inventaire gratuit doit
   fonctionner sans le reste ; le client ne voit rien d'autre ; lui donner envie de prendre le pack ; les 14 jours
   gratuits coupables à tout moment ; conversion finale »).
   Un seul verrou, dans la coquille : quand la formule est « inventaire », les onglets Pilotage et Carte n'existent
   pas, le cadre Pilotage n'est jamais montré, et toute tentative de l'ouvrir (lien du module Inventaire, historique,
   raccourci clavier) ouvre l'offre : « Essayer tout Verdict 14 jours ». L'essai se démarre d'un geste, s'arrête à tout
   moment depuis la pastille « Essai · J-n », et s'éteint seul à l'échéance : rien n'est supprimé, l'Inventaire reste.
   Le navigateur ne peut que RÉDUIRE ce qui est ouvert : la formule locale n'agit que pendant la phase d'accès ouvert
   (VERDICT_OPEN_ACCESS) ; dès que le serveur des comptes décide (espace connecté), il a le dernier mot et ce fichier
   s'efface. Les prix viennent de l'offre validée (05-BACKEND-API/src/offre.js : Inventaire 0 €, Pilotage 69 €,
   Pro 129 €, essai 14 jours). Perso, atelier et démo ne sont jamais concernés. */
(function () {
  'use strict';
  var w = window, doc = document; if (w.VerdictPlan) return;
  var CLE = 'verdict:plan:v1', JOURS = 14, JOUR = 86400000;
  var params = new URLSearchParams(location.search);
  function estDemo() { if (params.get('demo') === '1' || params.get('presentation')) return true; try { return localStorage.getItem('verdict:demo:resume:client:v1') === '1'; } catch (e) { return false; } }
  /* C119 — Une seule appli : l'essai de 14 jours démarre tout seul au premier usage réel (hors démonstration), tout est
     ouvert ; à la fin, selon l'offre prise : rien → Inventaire gratuit ; Pilotage ou Pro → ce que le serveur ouvre.
     La fermeture n'agit que lorsque les abonnements peuvent réellement être pris (VERDICT_PAIEMENT_ACTIF, émis par le
     serveur quand Stripe est configuré) : on ne coupe jamais un client qui n'a aucun moyen de payer. */
  function dejaInstalle() {
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i) || ''; if (k.indexOf('verdict:etabs:v2') !== 0 || /demo/i.test(k)) continue; if (/"onboardingDone":true/.test(localStorage.getItem(k) || '')) return true; } } catch (e) {}
    return false;
  }
  function fermetureActive() { return w.VERDICT_PAIEMENT_ACTIF === true; }
  function horsChamp() { return !!(w.VERDICT_PERSO || w.VERDICT_TEST_SESSION || estDemo()); }
  /* Le serveur a le dernier mot : espace connecté sans accès ouvert = ses droits, pas une formule locale. */
  function serveurDecide() { return w.VERDICT_WORKSPACE_CONNECTED === true && w.VERDICT_OPEN_ACCESS !== true; }

  function lire() { try { return JSON.parse(localStorage.getItem(CLE) || 'null'); } catch (e) { return null; } }
  function ecrire(p) { try { if (p) localStorage.setItem(CLE, JSON.stringify(p)); else localStorage.removeItem(CLE); } catch (e) {} }
  /* État effectif, fonction pure (testée) : {niveau:'complet'|'inventaire'|'essai', jours, termine} */
  function calc(p, now, ferme) {
    now = now || Date.now(); if (ferme === undefined) ferme = fermetureActive();
    if (!p || !p.niveau) return { niveau: 'complet', jours: 0, termine: false };
    if (p.niveau === 'essai') {
      var fin = Number(p.fin) || 0;
      if (fin > now) return { niveau: 'essai', jours: Math.max(1, Math.ceil((fin - now) / JOUR)), termine: false, fin: fin };
      if (!ferme) return { niveau: 'essai', jours: 0, termine: false, attente: true, fin: fin };
      return { niveau: 'inventaire', jours: 0, termine: true, fin: fin };
    }
    if (p.niveau === 'inventaire') return { niveau: 'inventaire', jours: 0, termine: !!p.termine };
    return { niveau: 'complet', jours: 0, termine: false };
  }
  function etat() { return calc(lire()); }

  /* ── Lecture de l'URL : ?plan=inventaire (entrée par l'appli gratuite), ?plan=complet (retour) ── */
  var demande = params.get('plan');
  if (demande === 'inventaire') { var p0 = lire(); if (!p0 || p0.niveau !== 'essai' || calc(p0).termine) ecrire({ niveau: 'inventaire', depuis: Date.now() }); }
  else if (demande === 'complet') ecrire(null);

  function actif() { return !horsChamp() && !serveurDecide(); }
  function verrou() { return actif() && etat().niveau === 'inventaire'; }

  /* ── Styles : rien de Pilotage/Carte n'existe sous la formule Inventaire ── */
  var css = doc.createElement('style'); css.id = 'plan-inventaire-a34';
  css.textContent =
    'html.vd-plan-inventaire .module-tabs,html.vd-plan-inventaire #tab-verdict,html.vd-plan-inventaire #tab-carte,html.vd-plan-inventaire #panel-verdict,html.vd-plan-inventaire #vdDock{display:none!important}' +
    'html.vd-plan-inventaire #panel-inventory{display:block!important}body.shell-startup-locked #vdPlanBadge,#vr16~#vdPlanBadge{display:none!important}' +
    '#vdPlanBadge{position:fixed;z-index:61;top:calc(env(safe-area-inset-top,0px) + 10px);right:14px;display:inline-flex;align-items:center;gap:6px;min-height:34px;box-shadow:0 8px 24px rgba(2,8,23,.18);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:0 12px;border-radius:999px;border:1px solid rgba(212,167,44,.5);background:linear-gradient(90deg,rgba(184,134,11,.18),rgba(227,179,65,.22));color:#8a5a00;font:800 12.5px/1 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;letter-spacing:.02em;cursor:pointer;white-space:nowrap}' +
    '#vdPlanBadge i{width:8px;height:8px;border-radius:50%;background:#e3b341;box-shadow:0 0 0 3px rgba(227,179,65,.25)}' +
    'html.vd-workspace-dark #vdPlanBadge,html[data-theme="dark"] #vdPlanBadge,.dark #vdPlanBadge{color:#fde68a}' +
    '#vdOffre{position:fixed;inset:0;z-index:80;display:flex;align-items:flex-end;justify-content:center;background:rgba(2,8,23,.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);opacity:0;transition:opacity .3s}#vdOffre.on{opacity:1}' +
    '#vdOffre .vo-card{position:relative;width:min(100%,560px);max-height:calc(100vh - 24px);overflow:auto;padding:28px 22px calc(22px + env(safe-area-inset-bottom));border-radius:30px 30px 0 0;background:#0a0a0a;color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif;box-shadow:0 -30px 80px rgba(0,0,0,.5);transform:translateY(24px);transition:transform .42s cubic-bezier(.23,1,.32,1);isolation:isolate}#vdOffre.on .vo-card{transform:none}' +
    '#vdOffre .vo-card:before{content:"";position:absolute;inset:-40%;z-index:-1;background:radial-gradient(circle at 80% 10%,rgba(227,179,65,.32),transparent 45%),radial-gradient(circle at 10% 90%,rgba(34,197,94,.22),transparent 50%)}' +
    '#vdOffre .vo-k{font:800 11.5px/1 -apple-system,system-ui;letter-spacing:.16em;text-transform:uppercase;color:#e3b341}#vdOffre h1{margin:10px 0 8px;font:900 clamp(26px,6.5vw,36px)/1.05 -apple-system,system-ui;letter-spacing:-.03em;color:#fff}' +
    '#vdOffre p{margin:0 0 12px;color:rgba(248,250,252,.82);font-size:15.5px;line-height:1.45}#vdOffre ul{list-style:none;margin:14px 0;padding:0;display:grid;gap:10px}' +
    '#vdOffre li{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1)}#vdOffre li b{display:block;color:#fff;font-size:15px}#vdOffre li small{color:rgba(248,250,252,.72);font-size:13px;line-height:1.35}#vdOffre li span.ic{flex:0 0 34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(227,179,65,.18);font-size:17px}' +
    '#vdOffre .vo-prix{display:flex;gap:10px;margin:4px 0 14px}#vdOffre .vo-prix div{flex:1;padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05)}#vdOffre .vo-prix b{display:block;font:900 22px/1 -apple-system,system-ui;color:#fff}#vdOffre .vo-prix small{color:rgba(248,250,252,.7);font-size:12.5px}#vdOffre .vo-prix em{display:block;font-style:normal;color:#e3b341;font-weight:800;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}' +
    '#vdOffre .vo-cta{width:100%;min-height:58px;border:0;border-radius:18px;background:linear-gradient(90deg,#b8860b,#e3b341);color:#1a1200;font:900 17px/1 -apple-system,system-ui;cursor:pointer;box-shadow:0 14px 34px rgba(212,167,44,.4)}' +
    '#vdOffre .vo-sec{width:100%;min-height:50px;margin-top:10px;border-radius:16px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.07);color:#fff;font:800 15px/1 -apple-system,system-ui;cursor:pointer}' +
    '#vdOffre .vo-stop{width:100%;min-height:46px;margin-top:10px;border-radius:16px;border:1px solid rgba(239,68,68,.45);background:rgba(239,68,68,.12);color:#fecaca;font:800 14.5px/1 -apple-system,system-ui;cursor:pointer}' +
    '#vdOffre .vo-choix{display:flex;gap:14px;align-items:flex-start;width:100%;text-align:left;margin:0 0 12px;padding:16px;border-radius:20px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font:inherit}#vdOffre .vo-choix .ic{flex:0 0 44px;height:44px;border-radius:14px;display:grid;place-items:center;background:rgba(134,239,172,.16);font-size:22px}#vdOffre .vo-choix b{display:block;font:800 17px/1.2 -apple-system,system-ui;margin-bottom:4px}#vdOffre .vo-choix small{color:rgba(248,250,252,.75);font-size:13.5px;line-height:1.4}#vdOffre .vo-choix.or{border-color:rgba(227,179,65,.55);background:linear-gradient(135deg,rgba(184,134,11,.2),rgba(227,179,65,.12))}#vdOffre .vo-choix.or .ic{background:rgba(227,179,65,.2)}' +
    'body.shell-startup-locked #vdOffre{display:none!important}' +
    '#vdOffre .vo-note{margin:12px 0 0;font-size:12.5px;color:rgba(248,250,252,.6)}#vdOffre .vo-x{position:absolute;top:12px;right:12px;width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#fff;font-size:20px;cursor:pointer}' +
    '@media (max-width:699px){#vdPlanBadge{top:calc(env(safe-area-inset-top,0px) + 66px);right:10px}}@media (min-width:700px){#vdOffre{align-items:center}#vdOffre .vo-card{border-radius:30px;padding:36px 36px 30px}}';
  (doc.head || doc.documentElement).appendChild(css);

  /* ── Offre : un seul panneau, trois humeurs (inviter · essai en cours · essai terminé) ── */
  var LIGNES = '<ul>' +
    '<li><span class="ic">📈</span><div><b>Pilotage</b><small>Votre résultat, votre seuil, la caisse du soir et les décisions du jour, en 60 secondes.</small></div></li>' +
    '<li><span class="ic">📋</span><div><b>Carte</b><small>Indice Carte, marge matière plat par plat, prix justes et Vera qui compose vos plats de saison.</small></div></li>' +
    '<li><span class="ic">🔍</span><div><b>Audit & Simuler</b><small>Les fuites que vous ne voyez pas, et des gains réalistes, bornés, rejoués levier par levier.</small></div></li></ul>' +
    '<div class="vo-prix"><div><em>Pilotage</em><b>69 € HT</b><small>par mois · Pilotage + Inventaire</small></div><div><em>Pro</em><b>129 € HT</b><small>par mois · tout Verdict, Carte et Vera compris</small></div></div>';
  function fermer() { var o = doc.getElementById('vdOffre'); if (!o) return; o.classList.remove('on'); setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 320); }
  function ouvrirOffre(mode) {
    var E = etat(), P = lire() || {}, reste = P.fin && P.fin > Date.now() ? Math.ceil((P.fin - Date.now()) / JOUR) : 0;
    mode = mode || (E.attente ? 'attente' : E.niveau === 'essai' ? 'essai' : (E.termine && !reste ? 'termine' : 'inviter'));
    fermer();
    var o = doc.createElement('div'); o.id = 'vdOffre'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    var h = '<div class="vo-card"><button type="button" class="vo-x" aria-label="Fermer">×</button>';
    if (mode === 'choix') h = '<div class="vo-card"><span class="vo-k">Bienvenue sur Verdict</span><h1>Que venez-vous faire ?</h1><p>Choisissez votre départ : l’appli ne vous montre que ce qui vous sert. Vous pourrez changer d’avis à tout moment.</p>' +
      '<button type="button" class="vo-choix" data-vo="choix-inventaire"><span class="ic">📦</span><span><b>Gérer mon inventaire</b><small>Gratuit, pour toujours. Compter, commander, suivre vos stocks, cuisine et bar.</small></span></button>' +
      '<button type="button" class="vo-choix or" data-vo="choix-complet"><span class="ic">📈</span><span><b>Piloter tout mon restaurant</b><small>14 jours gratuits, sans carte : Pilotage, Carte, Audit, Simuler, Vera, et l’Inventaire.</small></span></button>' +
      '<p class="vo-note">Après l’essai : Pilotage 69 € HT ou Pro 129 € HT par mois, ou retour à l’Inventaire gratuit. Rien n’est jamais supprimé.</p>';
    else if (mode === 'attente') h += '<span class="vo-k">Essai terminé</span><h1>Tout reste ouvert, pour l’instant.</h1><p>Vos 14 jours d’essai sont passés. Les abonnements Pilotage et Pro ouvrent très bientôt : d’ici là, rien ne se ferme et rien n’est supprimé.</p>' + LIGNES +
      '<button type="button" class="vo-cta" data-vo="continuer">Continuer</button>';
    else if (mode === 'essai') h += '<span class="vo-k">Essai · encore ' + E.jours + ' jour' + (E.jours > 1 ? 's' : '') + '</span><h1>Tout Verdict est ouvert</h1><p>Pilotage, Carte, Audit, Simuler et Vera, avec vos vrais chiffres. Vous pouvez arrêter quand vous voulez : rien n’est supprimé, l’Inventaire reste gratuit.</p>' + LIGNES +
      '<button type="button" class="vo-cta" data-vo="continuer">Continuer l’essai</button><button type="button" class="vo-stop" data-vo="arreter">Arrêter l’essai maintenant</button><p class="vo-note">À la fin de l’essai, aucun prélèvement : vous choisissez vous-même de passer à Pilotage ou Pro.</p>';
    else if (mode === 'termine') h += '<span class="vo-k">Essai terminé</span><h1>Rien n’est supprimé.</h1><p>Vos fiches, vos ventes et vos stocks sont conservés. L’Inventaire reste gratuit, pour toujours. Pour retrouver Pilotage, Carte, Audit, Simuler et Vera :</p>' + LIGNES +
      '<button type="button" class="vo-cta" data-vo="passer">Passer à Pilotage ou Pro</button><button type="button" class="vo-sec" data-vo="rester">Rester sur l’Inventaire gratuit</button>';
    else h += '<span class="vo-k">Verdict · Inventaire gratuit</span><h1>Vos stocks sont gratuits. Et tout le reste ?</h1><p><b>14 jours gratuits</b>, sans carte bancaire, à arrêter à tout moment. À la fin, rien n’est supprimé : vous retrouvez l’Inventaire gratuit.</p>' + LIGNES +
      (reste && P.essaiUtilise ? '<button type="button" class="vo-cta" data-vo="essayer">Reprendre mon essai · encore ' + reste + ' jour' + (reste > 1 ? 's' : '') + '</button>' : '<button type="button" class="vo-cta" data-vo="essayer">Essayer tout Verdict 14 jours</button>') + '<button type="button" class="vo-sec" data-vo="rester">Rester sur l’Inventaire</button>';
    h += '</div>'; o.innerHTML = h; doc.body.appendChild(o);
    requestAnimationFrame(function () { o.classList.add('on'); });
    o.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-vo],.vo-x'); if (!b) { if (ev.target === o && mode !== 'choix') fermer(); return; }
      var a = b.getAttribute('data-vo');
      if (a === 'choix-inventaire') { ecrire({ niveau: 'inventaire', depuis: Date.now(), choix: 'inventaire' }); fermer(); setTimeout(function () { location.replace(urlAvec('inventory')); }, 60); return; }
      if (a === 'choix-complet') { var t1 = Date.now(); ecrire({ niveau: 'essai', depuis: t1, fin: t1 + JOURS * JOUR, essaiUtilise: true, choix: 'complet' }); fermer(); appliquer(); try { w.VerdictUnifiedShell && w.VerdictUnifiedShell.activateModule('pilotage', {}); } catch (e) {} return; }
      if (a === 'essayer') demarrerEssai();
      else if (a === 'arreter') { if (b.getAttribute('data-sur') !== '1') { b.setAttribute('data-sur', '1'); b.textContent = 'Confirmer : revenir à l’Inventaire gratuit'; return; } arreterEssai(); }
      else if (a === 'passer') { try { location.href = 'account.html?view=abo'; } catch (e) {} }
      else fermer();
    });
  }

  /* ── Actions ── */
  function demarrerEssai() {
    var p = lire(); if (p && p.niveau === 'essai' && !calc(p).termine) { fermer(); return; }
    if (p && p.essaiUtilise && p.fin > Date.now()) { ecrire({ niveau: 'essai', depuis: p.depuis, fin: p.fin, essaiUtilise: true }); fermer(); setTimeout(function () { location.replace(urlAvec('verdict')); }, 60); return; }
    if (p && p.essaiUtilise) { ouvrirOffre('termine'); return; }
    var now = Date.now(); ecrire({ niveau: 'essai', depuis: now, fin: now + JOURS * JOUR, essaiUtilise: true });
    fermer(); appliquer(); try { w.VerdictUnifiedShell && w.VerdictUnifiedShell.activateModule('pilotage', {}); } catch (e) {}
    setTimeout(function () { location.reload(); }, 60);
  }
  function arreterEssai() { var p = lire() || {}; ecrire({ niveau: 'inventaire', depuis: Date.now(), essaiUtilise: !!p.essaiUtilise, termine: true, fin: p.fin }); fermer(); appliquer(); setTimeout(function () { location.replace(urlAvec('inventory')); }, 60); }
  function choisirInventaire() { ecrire({ niveau: 'inventaire', depuis: Date.now() }); appliquer(); }
  function urlAvec(module) { var u = new URL(location.href); u.searchParams.set('module', module); u.searchParams.delete('plan'); u.searchParams.delete('profile'); return u.pathname + u.search + u.hash; }

  /* ── Application du verrou et de la pastille ── */
  var dejaTermine = false;
  function badge() {
    var acts = doc.body; if (!acts) return;
    var b = doc.getElementById('vdPlanBadge'), E = etat();
    var texte = !actif() ? '' : (E.attente ? 'Essai terminé · tout reste ouvert' : E.niveau === 'essai' ? 'Essai · J-' + E.jours : (E.niveau === 'inventaire' ? (E.termine || (lire() || {}).essaiUtilise ? 'Passer à Pilotage ou Pro' : 'Tout Verdict · 14 j gratuits') : ''));
    if (!texte) { if (b) b.remove(); return; }
    if (!b) { b = doc.createElement('button'); b.id = 'vdPlanBadge'; b.type = 'button'; acts.appendChild(b); b.onclick = function () { ouvrirOffre(); }; }
    /* C194 : appliquer() tourne toutes les 400 ms ; la pastille n'est réécrite que si son texte change (0 changement au repos) */
    if (b.__vdTexte !== texte) { b.__vdTexte = texte; b.innerHTML = '<i></i>' + texte; b.setAttribute('aria-label', texte); }
  }
  function appliquer() {
    if (actif() && !lire() && !doc.getElementById('vdOffre') && doc.body) { ouvrirOffre('choix'); }
    var v = verrou(); doc.documentElement.classList.toggle('vd-plan-inventaire', v); badge();
    if (!v) return;
    /* Le cadre Pilotage ne doit jamais être le module courant : on ramène sur Inventaire et on ouvre l'offre. */
    var sh = w.VerdictUnifiedShell;
    var panel = doc.getElementById('panel-verdict'), pilotageActif = panel && panel.classList.contains('active');
    if (sh && sh.hasStarted && sh.hasStarted() && (sh.getActiveModule() !== 'inventory' || pilotageActif)) {
      try { sh.activateModule('inventory', {}); } catch (e) {}
      if (!doc.getElementById('vdOffre')) ouvrirOffre('inviter');
    }
    var E = etat(); if (E.termine && !dejaTermine && !(lire() || {}).vuTermine) { dejaTermine = true; var p = lire() || {}; p.vuTermine = true; ecrire(p); setTimeout(function () { ouvrirOffre('termine'); }, 900); }
  }

  if (actif()) {
    /* C119 : un client déjà installé (dossier Verdict rempli) entre directement dans son essai de 14 jours ; un nouveau
       venu choisit d'abord ce qu'il vient faire (Inventaire gratuit ou tout Verdict) et ne voit que ce parcours. */
    if (!lire() && dejaInstalle()) { var t0 = Date.now(); ecrire({ niveau: 'essai', depuis: t0, fin: t0 + JOURS * JOUR, essaiUtilise: true, auto: true }); }
    /* Avant le démarrage de la coquille : la formule Inventaire entre toujours par ?module=inventory. */
    if (verrou() && params.get('module') !== 'inventory') { location.replace(urlAvec('inventory')); return; }
    /* Les appels publics vers Pilotage/Carte sont refusés sous la formule Inventaire. */
    function garder() {
      var sh = w.VerdictUnifiedShell; if (!sh || sh.__vdPlan) return !!sh; sh.__vdPlan = true;
      var am = sh.activateModule, a = sh.activate;
      sh.activateModule = function (cap, options, hm) { if (verrou() && cap !== 'inventory' && !(options && options.authorizedStartup)) { ouvrirOffre('inviter'); return false; } return am.apply(this, arguments); };
      sh.activate = function (module, options, hm) { if (verrou() && module === 'verdict' && !(options && options.authorizedStartup)) { ouvrirOffre('inviter'); return false; } return a.apply(this, arguments); };
      return true;
    }
    (function boot(n) { if (garder()) return; if (n > 0) setTimeout(function () { boot(n - 1); }, 200); })(50);
    appliquer();
    doc.addEventListener('DOMContentLoaded', appliquer);
    w.addEventListener('load', function () { appliquer(); setTimeout(appliquer, 800); });
    setInterval(appliquer, 400);
    /* Échéance pendant l'usage : vérification chaque minute. */
    setInterval(function () { var E = etat(); if (E.termine) appliquer(); else badge(); }, 60000);
  }

  w.VerdictPlan = { etat: etat, calc: calc, fermetureActive: fermetureActive, demarrerEssai: demarrerEssai, arreterEssai: arreterEssai, choisirInventaire: choisirInventaire, ouvrirOffre: ouvrirOffre, actif: actif, JOURS: JOURS };
})();
