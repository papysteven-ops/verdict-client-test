
/* V44.42 — lancement public : Verdict Client et Inventaire sont ouverts sans
   paiement. Le backend pourra retirer ce drapeau lorsqu'un mur Pro réel sera
   activé et testé sur le domaine final. */
window.VERDICT_OPEN_ACCESS=true;
window.VERDICT_ACCOUNT_AUTH_READY=false;
window.VERDICT_ACCOUNT_PORTAL_READY=false;
window.VERDICT_ACCOUNT_API='/api/account';
window.VERDICT_WORKSPACE_CONNECTED=false;
window.VERDICT_WORKSPACE_API='/api/workspace';
window.VERDICT_TEAM_API_READY=false;
/* C215 (W38) — décision de Steven du 21/10/2026 : un seul essai de 14 jours, porté par le compte et démarré à sa création ;
   l'appli lit l'état du compte ; sans compte, elle reste en découverte. Les valeurs ci-dessus valent sans serveur de comptes.
   Quand le serveur de comptes répond sur ce domaine, sa configuration (propre à chaque session, jamais mise en cache, hors du
   service worker car sous /api/) est lue ici, avant tout le reste : VERDICT_ACCOUNT_AUTH_READY, VERDICT_ESSAI_PAR_COMPTE,
   VERDICT_COMPTE (formule, fin d'essai, échéance du compte connecté, sinon null) et VERDICT_PAIEMENT_ACTIF. Sans serveur,
   ces valeurs restent.
   C404 (L4, audit A68) : la demande n'est faite que si un serveur de comptes est annoncé sur ce domaine : VERDICT_ACCOUNT_SERVER
   (à passer à true au déploiement du serveur, /api/ envoyé au serveur Node) ou le témoin verdict_serveur=1 (suivi du port de la
   page hors production), que la configuration du serveur pose elle-même à chaque lecture (page Compte) et qui s'éteint 30 jours
   après son dernier passage. Hors ligne, rien. Sinon (site statique d'aujourd'hui) : aucune demande, aucun 404. */
window.VERDICT_ACCOUNT_SERVER=false;
(function(){try{var s=document.currentScript;if(!s||!s.src||location.protocol.indexOf('http')!==0||document.readyState!=='loading')return;var t='verdict_serveur'+(location.port?'_'+location.port:'')+'=1';if(window.VERDICT_ACCOUNT_SERVER!==true&&String(document.cookie||'').split(/;\s*/).indexOf(t)<0)return;if(navigator.onLine===false)return;var base=s.src.split('?')[0].replace(new RegExp('assets/runtime-a1'+'0/[^/]*$'),'').replace(/[^\/]*$/,'');document.write('<script src="'+base+'api/runtime-config"><\/script>');}catch(e){}})();

/* R34 : options de recette ; aucun changement de calcul ni de droits. */
window.VERDICT_SCORE_ACTION_LINKS=true;
/* Choix Steven, images IMG_1842 / IMG_1841 : capsule, écran intégral. */
window.VERDICT_FLOATING_DOCK=true;
/* Compensation seulement d'un déficit iOS installé mesuré = zone sûre haute. */
window.VERDICT_IOS_EDGE_CORRECTION=true;

