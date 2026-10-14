
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
  window.__verdictBootGuard=setTimeout(function(){
    var sp=document.getElementById('splash');
    if(!sp||window.__verdictIntroInitialDone||document.visibilityState==='hidden')return;
    sp.className='';
    sp.innerHTML='<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center;font:16px/1.5 Inter,-apple-system,system-ui,sans-serif;color:#f2f4f8">'+
      '<b style="font-size:19px">Verdict n\u2019a pas pu démarrer</b>'+
      '<span style="max-width:330px;margin-top:10px;color:#98a1ad">Fermez ce fichier puis ouvrez la version autonome. Code&nbsp;: VD-BOOT</span>'+
      '<button type="button" onclick="location.reload()" style="margin-top:18px;border:0;border-radius:12px;padding:13px 22px;background:#22c55e;color:#04120a;font:800 15px Inter,-apple-system,system-ui,sans-serif">Réessayer</button></div>';
  /* Ce garde couvre uniquement une panne réelle de chargement. L'iPhone peut
     garder le lecteur Sites au-dessus de la page plusieurs secondes : le
     délai ne doit jamais remplacer le zéro Verdict avant que l'app soit
     réellement visible. Le garde court est armé séparément au lancement de
     l'animation. */
  },30000);
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
