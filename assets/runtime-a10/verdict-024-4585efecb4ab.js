
/* Garde de démarrage autonome, installé AVANT le moteur et les modèles.
   Le zéro rouge est déjà l'état initial réel de l'échelle : il reste immobile
   et lisible pendant la préparation, sans chargeur ou écran parasite. */
(function(){
  window.__verdictBootError='';
  window.addEventListener('error',function(ev){
    if(!window.__verdictIntroInitialDone&&!window.__verdictBootError){
      window.__verdictBootError=String((ev&&ev.message)||'erreur de démarrage');
    }
  });
  /* C302 (V15-067) : le garde ne compte plus les attentes normales — feuille de langue d'une première visite, écran de code
     de la coque, panneau caché par la coque (aucune image n'y est peinte), appli en arrière-plan, page encore en
     téléchargement sur un réseau lent (jusqu'à 90 s). Il couvrait l'appli « après des changements d'établissement
     rapides » ou sur une origine neuve sans aucune panne. Seules 30 s d'attente sans raison l'affichent, en texte web. */
  var bootAttente=0,bootDebut=Date.now(),bootDernier=bootDebut;
  function bootAttenteNormale(){
    if(document.visibilityState==='hidden'||window.__verdictIntroWaitingLanguage)return true;
    try{if(window.parent!==window&&window.parent.VerdictVerrou&&window.parent.VerdictVerrou.state().locked)return true;}catch(e){}
    try{var fe=window.frameElement;if(fe&&!fe.getClientRects().length)return true;}catch(e){}
    return document.readyState!=='complete'&&Date.now()-bootDebut<90000;
  }
  function bootTexte(){
    var T={fr:['Verdict met plus de temps que prévu à démarrer','Vérifiez votre connexion, puis réessayez. Rien n\u2019est perdu. Code&nbsp;: VD-BOOT','Réessayer'],
      en:['Verdict is taking longer than expected to start','Check your connection, then try again. Nothing is lost. Code: VD-BOOT','Try again'],
      es:['Verdict tarda más de lo previsto en iniciarse','Compruebe su conexión y vuelva a intentarlo. No se pierde nada. Código: VD-BOOT','Reintentar'],
      it:['Verdict impiega più tempo del previsto ad avviarsi','Controlli la connessione, poi riprovi. Non si perde nulla. Codice: VD-BOOT','Riprova'],
      de:['Verdict braucht länger als erwartet zum Starten','Prüfen Sie Ihre Verbindung und versuchen Sie es erneut. Nichts geht verloren. Code: VD-BOOT','Erneut versuchen'],
      nl:['Verdict heeft meer tijd nodig dan verwacht om te starten','Controleer uw verbinding en probeer het opnieuw. Er gaat niets verloren. Code: VD-BOOT','Opnieuw proberen'],
      pt:['O Verdict está a demorar mais do que o previsto a iniciar','Verifique a sua ligação e tente novamente. Nada se perde. Código: VD-BOOT','Tentar novamente']},l='';
    try{l=new URLSearchParams(location.search).get('lang')||localStorage.getItem('verdict_locale')||'';}catch(e){}
    l=String(l||document.documentElement.lang||navigator.language||'fr').slice(0,2).toLowerCase();
    return T[l]||T.fr;
  }
  /* C319 (V16-094, T1 : modèle chargé, page rechargée, panneau masqué) : VD-BOOT restait par-dessus une appli démarrée. L'appli est
     « prête » quand ses écrans existent (go, moteur, une vue ouverte, page chargée). Prête au moment du garde : l'ouverture est
     terminée proprement, sans VD-BOOT. Déjà affiché : VD-BOOT se retire de lui-même dès que l'appli démarre, même tard. */
  function bootAppPrete(){try{return document.readyState==='complete'&&typeof window.go==='function'&&typeof window.moteur==='function'&&!!document.querySelector('.view.on');}catch(e){return false;}}
  function bootTerminer(sp,raison){try{sp.setAttribute('data-intro-stop',raison);}catch(e){}
    try{if(!window.__verdictIntroInitialDone&&typeof window.verdictIntroDebloquer==='function')window.verdictIntroDebloquer('initial',null,raison);}catch(e){}
    try{if(sp.parentNode&&document.getElementById('splash')===sp&&/VD-BOOT/.test(sp.innerHTML))sp.parentNode.removeChild(sp);}catch(e){}}
  function bootLever(sp){setTimeout(function(){try{if(!sp.parentNode)return;if(window.__verdictIntroInitialDone||bootAppPrete()){bootTerminer(sp,'c319-vd-boot-leve');return;}}catch(e){}bootLever(sp);},1000);}
  function bootVerifier(){
    window.__verdictBootGuard=null;
    var sp=document.getElementById('splash'),maintenant=Date.now();
    if(!sp||window.__verdictIntroInitialDone)return;
    if(!bootAttenteNormale())bootAttente+=Math.min(maintenant-bootDernier,5000);
    bootDernier=maintenant;
    if(bootAttente<30000){window.__verdictBootGuard=setTimeout(bootVerifier,1000);return;}
    if(bootAppPrete()){bootTerminer(sp,'c319-garde-appli-prete');return;}
    var t=bootTexte();
    sp.className='';
    sp.innerHTML='<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center;font:16px/1.5 Inter,-apple-system,system-ui,sans-serif;color:#f2f4f8">'+
      '<b style="font-size:19px">'+t[0]+'</b>'+
      '<span style="max-width:330px;margin-top:10px;color:#98a1ad">'+t[1]+'</span>'+
      '<button type="button" onclick="location.reload()" style="margin-top:18px;border:0;border-radius:12px;padding:13px 22px;background:#22c55e;color:#04120a;font:800 15px Inter,-apple-system,system-ui,sans-serif">'+t[2]+'</button></div>';
    bootLever(sp);
  /* Ce garde couvre uniquement une panne réelle de chargement. L'iPhone peut
     garder le lecteur Sites au-dessus de la page plusieurs secondes : le
     délai ne doit jamais remplacer le zéro Verdict avant que l'app soit
     réellement visible. Le garde court est armé séparément au lancement de
     l'animation. */
  }
  window.__verdictBootGuard=setTimeout(bootVerifier,1000);
})();
/* La présentation Brasserie est le même moteur que Verdict, mais dans un
   bac à sable strict. Le profil est détecté AVANT le service worker, le
   stockage, le compte et le cloud afin qu'une ouverture directe du fichier
   livré ne puisse jamais toucher le portefeuille réel du navigateur. */
window.VERDICT_PRESENTATION_PROFILE=(function(){
  try{
    var q=new URLSearchParams(location.search+(self.__vdq||"")),file=String(location.pathname||'').split('/').pop().toLowerCase();
    return (q.get('presentation')==='brasserie'||file==='verdict-brasserie-complet.html')?'brasserie-24m':'';
  }catch(e){return '';}
})();
/* Installation sur l'écran d'accueil : l'application s'ouvre instantanément
   et fonctionne sans réseau. Silencieux si le navigateur ne le gère pas
   ou si la page est ouverte depuis un fichier local. */
if (!window.VERDICT_PRESENTATION_PROFILE && !(window.parent!==window&&new URLSearchParams(location.search+(self.__vdq||"")).get('embed')==='1') && false && 'serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(function(reg){
      try{reg.update();}catch(e){}
    }).catch(function () {});
  });
}
