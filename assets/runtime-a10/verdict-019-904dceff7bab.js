
/* La zone sûre CSS reste la source principale. Certains navigateurs intégrés
   iOS et certaines PWA plein écran renvoient toutefois 0 pour les insets alors
   que la barre d'état recouvre réellement le WebView. Cette classe, posée
   avant le premier rendu, n'active un repli que dans ces contextes obscurcis. */
(function(){
  var root=document.documentElement,nav=window.navigator||{},ua=String(nav.userAgent||'');
  /* ChatGPT Sites ouvre parfois la page dans un lecteur dont les commandes
     natives recouvrent le haut du WebView. Cette réserve ne s'applique qu'au
     lecteur intégré : une ouverture Safari/PWA classique conserve sa zone
     sûre habituelle. */
  var hostedViewer=false;
  try{hostedViewer=window.top!==window.self;}catch(e){hostedViewer=true;}
  if(/ChatGPT|OpenAI/i.test(ua))hostedViewer=true;
  root.classList.toggle('verdict-hosted-viewer',hostedViewer);
  var isiOS=/iPad|iPhone|iPod/.test(ua)||(nav.platform==='MacIntel'&&Number(nav.maxTouchPoints)>1);
  if(!isiOS)return;
  var alternate=/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  var safari=/Version\/[\d.]+.*Safari\//.test(ua)&&!alternate;
  var standalone=nav.standalone===true;
  try{standalone=standalone||matchMedia('(display-mode:standalone)').matches||matchMedia('(display-mode:fullscreen)').matches;}catch(e){}
  var embedded=!safari&&!alternate;
  function refresh(){
    var edgeToEdge=false;
    try{edgeToEdge=!!(window.visualViewport&&screen.height&&window.visualViewport.height/screen.height>.92);}catch(e){}
    root.classList.toggle('verdict-ios-obscured',!!(standalone||embedded||edgeToEdge));
  }
  refresh();
  window.addEventListener('pageshow',refresh,{passive:true});
  window.addEventListener('orientationchange',refresh,{passive:true});
})();
