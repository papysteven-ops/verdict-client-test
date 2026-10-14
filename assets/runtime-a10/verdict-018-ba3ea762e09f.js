
/* Une seule application, deux usages explicites.
   - TEST : moteur complet, données uniquement en mémoire.
   - CLIENT : droits réels et sauvegarde durable inchangés. */
window.VERDICT_EDITION=(function(){
  /* Frontière de livraison : le Site Client ne peut jamais devenir Perso/Test
     par un paramètre, une route ou une ancienne URL partagée. */
  return 'client';
})();
window.VERDICT_APP_VERSION='17.2.0';
window.VERDICT_TEST_SESSION=false;
document.title='Verdict — Client';
try{document.getElementById('verdictManifest').href='./manifest-client.json';}catch(e){}
