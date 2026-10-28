(function () {
  'use strict';
  var desktopKey = 'verdict-workspace-theme';
  // A new mobile key discards the old three-state switch. Its first tap could
  // save "light" on a dark phone and make the app appear stuck in white.
  var mobileKey = 'verdict-mobile-appearance-v2';
  var button = document.createElement('button');
  button.className = 'workspace-theme-button';
  /* C67 — Comme sur mobile, partout : un petit carré avec une icône au lieu du texte « Mode sombre / Mode clair ».
     Même contour que les 3 autres boutons ; mode clair : lune blanche lumineuse sur fond noir ; mode sombre : soleil lumineux sur fond blanc : lune blanche éclatante (passer en sombre),
     soleil lumineux (passer en clair). Les 4 boutons du bas tiennent ainsi sur une ligne sur grand écran. */
  button.id = 'vd-theme-btn';
  var MOON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#ffffff" d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a.6.6 0 0 0-.8-.7A9.6 9.6 0 1 0 21.2 15.4a.6.6 0 0 0-.7-.8z"/></svg>';
  var SUN = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="#fcd34d"/><g stroke="#fcd34d" stroke-width="2.2" stroke-linecap="round"><path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M4.8 19.2l1.8-1.8M17.4 6.6l1.8-1.8"/></g></svg>';
  try {
    var st = document.createElement('style'); st.id = 'vd-theme-btn-css';
    st.textContent = '#vd-theme-btn{width:40px!important;min-width:40px!important;max-width:40px!important;height:40px!important;min-height:40px!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 40px!important;background:#0b0d10!important;color:#fff!important;font-size:0!important;line-height:0!important}#vd-theme-btn.vd-sun{background:#ffffff!important}' +
      '#vd-theme-btn svg{display:block;filter:drop-shadow(0 0 4px rgba(255,255,255,.55))}#vd-theme-btn.vd-sun svg{filter:drop-shadow(0 0 6px rgba(252,211,77,.85))}' +
      '.shell-actions{flex-wrap:nowrap!important;gap:8px!important}.shell-actions>button{width:40px!important;min-width:40px!important;max-width:40px!important;height:40px!important;padding:0!important;flex:0 0 40px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;overflow:visible!important}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}
  button.type = 'button';
  var actions = document.querySelector('.shell-actions');
  if (!actions) return;
  /* C343 (décisions 25 et 26 de Steven) : l'en-tête ne garde que le logo, l'établissement et la cloche. Le soleil n'y est plus
     posé : l'apparence se choisit dans Paramètres › Apparence (Automatique, Clair, Sombre), par VerdictTheme (fin du fichier). */
  var system = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  var mobile = window.matchMedia && window.matchMedia('(max-width: 767px)');
  var frameObservers = new WeakMap();
  /* C127 — Un seul choix de thème, quelle que soit l'orientation (Steven, 16/10 : « je pivote mon téléphone, la
     couleur change ; je le remets droit, ça revient »). En paysage, l'iPhone dépasse 767 px et lisait le réglage
     « grand écran ». Les deux clés sont désormais tenues identiques : le choix de l'écran actuel fait foi. */
  function cleAppareil() { try { var c = Math.min(screen.width || 9999, screen.height || 9999); return c < 768 ? mobileKey : desktopKey; } catch (e) { return mobile && mobile.matches ? mobileKey : desktopKey; } } /* la petite dimension de l'écran ne change pas en pivotant */
  try { var cle0 = cleAppareil(), autre0 = cle0 === mobileKey ? desktopKey : mobileKey, v0 = localStorage.getItem(cle0);
    if (v0 === 'light' || v0 === 'dark') { if (localStorage.getItem(autre0) !== v0) localStorage.setItem(autre0, v0); } else if (localStorage.getItem(autre0) === 'light' || localStorage.getItem(autre0) === 'dark') localStorage.removeItem(autre0); } catch (e) {}

  /* C188 (Steven, 20/10 : « le mode sombre auto ne marche pas du tout ; le bouton oui, mais pas le vrai mode sans le bouton,
     avant ça marchait ») : un seul appui sur le bouton enregistrait le choix pour toujours, et l'appli ne suivait plus jamais
     l'iPhone. Désormais : dès que l'apparence de l'appareil change (au coucher du soleil, ou réglée à la main), elle reprend
     la main — même si l'appli était fermée à ce moment-là ; et choisir au bouton l'apparence de l'appareil = revenir en auto. */
  var sysKey = 'verdict-appareil-apparence-vue';
  var choixKey = 'verdict-apparence-choix-c343';
  function apparenceAppareil() { return system && system.matches ? 'dark' : 'light'; }
  function suivreAppareil() {
    try {
      var now = apparenceAppareil(), vu = localStorage.getItem(sysKey);
      /* C343 : un choix fait dans Paramètres › Apparence (Clair ou Sombre) tient, même quand l'appareil change d'apparence. */
      if (localStorage.getItem(choixKey) === '1' && /^(light|dark)$/.test(localStorage.getItem(mobileKey) || '')) { if (vu !== now) localStorage.setItem(sysKey, now); return; }
      /* vu absent = première ouverture de cette version : l'ancien choix « pour toujours » est effacé une fois, l'appli repart en auto. */
      if (vu !== now) { localStorage.removeItem(mobileKey); localStorage.removeItem(desktopKey); }
      if (vu !== now) localStorage.setItem(sysKey, now);
    } catch (e) {}
  }
  suivreAppareil();
  function preference() {
    try {
      var saved = localStorage.getItem(cleAppareil());
      return saved === 'light' || saved === 'dark' ? saved : 'auto';
    } catch (error) { return 'auto'; }
  }
  function appearance(mode) {
    return mode === 'dark' || (mode === 'auto' && system && system.matches) ? 'dark' : 'light'; /* R316 : l’apparence de l’appareil est suivie partout (téléphone, tablette, ordinateur) ; un choix manuel reste prioritaire. */
  }

  /* R316 — thème clair sans bloc sombre. Les composants conçus en sombre (bandeaux, en-têtes, cartes,
     barres d’onglets, boutons) reçoivent en clair une surface claire et un texte foncé ; les boutons
     principaux prennent le vert Verdict ; l’élément sélectionné garde un contour vert visible.
     Styles posés en ligne et retirés à l’identique en sombre. Couleurs sémantiques (vert, jaune, orange, rouge) conservées. */
  var VDL_CAND='button,section,article,nav,header,aside,main,[role=tab],[role=tablist],div[id],[class*="card"],[class*="hero"],[class*="bar"],[class*="chip"],[class*="seg"],[class*="head"],[class*="dock"],[class*="greet"],[class*="metric"],[class*="service"],[class*="primary"],[class*="tabs"],[class*="sticky"],[class*="step"],[class*="prim"],[class*="panel"],[class*="box"],[class*="banner"],[class*="tile"],[class*="pill"],[class*="icon"],[class*="top"],[class*="sheet"],[role=dialog],dialog';
  var VDL_STYLES={surf:{'background':'#ffffff','background-image':'none','border-color':'#d5dde5','box-shadow':'0 1px 2px rgba(16,24,40,.06)'},
    btn:{'background':'#f3f5f7','background-image':'none','border-color':'#cfd8e1'},
    sel:{'background':'#e8f6ee','background-image':'none','border-color':'#15803d','box-shadow':'inset 0 0 0 2px #15803d','color':'#14532d'},
    prim:{'background':'#15803d','background-image':'none','border-color':'#15803d','color':'#ffffff'},
    page:{'background-color':'#f3f5f7','background-image':'none'},
    ink:{'color':'#14202b'},soft:{'color':'#4f5f6e'}};
  function vdlRgb(c){var m=(c||'').match(/rgba?\(([^)]+)\)/);if(!m)return null;var p=m[1].split(',').map(Number);if(p.length>3&&p[3]<0.6)return null;return p;}
  function vdlLum(p){return p?p.slice(0,3).map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}).reduce(function(s,v,i){return s+v*[0.2126,0.7152,0.0722][i];},0):null;}
  function vdlSat(p){var mx=Math.max(p[0],p[1],p[2]),mn=Math.min(p[0],p[1],p[2]);return mx===0?0:(mx-mn)/mx;}
  /* R321 : fond = couches de dégradé + couleur. La première couche entièrement opaque (en partant du dessus) recouvre
     tout ce qui est dessous, couleur de fond comprise : c’est elle qui fixe la luminance (bandeau « Ma carte »,
     panneau « Conclusion », carte « Bonjour » d’Inventaire : fond blanc recouvert d’un dégradé noir). */
  function vdlLayers(img){var out=[],depth=0,cur='';for(var i=0;i<img.length;i++){var ch=img[i];if(ch==='(')depth++;else if(ch===')')depth--;if(ch===','&&depth===0){out.push(cur);cur='';}else cur+=ch;}if(cur.trim())out.push(cur);return out;}
  function vdlBgLum(win,e){var cs=win.getComputedStyle(e),L=vdlLum(vdlRgb(cs.backgroundColor));
    if(cs.backgroundImage&&cs.backgroundImage!=='none'){var layers=vdlLayers(cs.backgroundImage),anyStops=[];
      for(var k=0;k<layers.length;k++){var st=layers[k].match(/rgba?\([^)]+\)/g);if(!st)continue;var all=st.map(function(x){return vdlLum(vdlRgb(x));}),ls=all.filter(function(x){return x!==null;});
        anyStops=anyStops.concat(ls);if(ls.length&&ls.length===all.length)return Math.max.apply(null,ls);}
      if(anyStops.length){var g=Math.max.apply(null,anyStops);L=L===null?g:Math.max(L,g);}}
    return L;}
  function vdlSet(e,kind,opt){if(e.__vdl===kind)return;vdlClear(e);var st=VDL_STYLES[kind];if(opt){st=Object.assign({},st);if(opt.tint){st.background=opt.tint;st['border-color']=opt.edge;}else if(opt.keepBorder)delete st['border-color'];}e.__vdlProps=Object.keys(st);e.__vdlVals={};Object.keys(st).forEach(function(k){e.style.setProperty(k,st[k],'important');e.__vdlVals[k]=e.style.getPropertyValue(k);});e.__vdl=kind;e.setAttribute('data-vdl',kind);}
  function vdlClear(e){if(!e.__vdlProps)return;e.__vdlProps.forEach(function(k){if(!e.__vdlVals||e.style.getPropertyValue(k)===e.__vdlVals[k]||/^background/.test(k)&&e.style.getPropertyPriority(k==='background'?'background-color':k)==='important'){e.style.removeProperty(k);if(k==='background'){['background-color','background-image','background-position','background-size','background-repeat','background-attachment','background-origin','background-clip'].forEach(function(x){if(e.style.getPropertyPriority(x)==='important')e.style.removeProperty(x);});}}});e.__vdlProps=null;e.__vdlVals=null;e.__vdl=null;e.removeAttribute('data-vdl');}
  function vdlSelected(e){var c=typeof e.className==='string'?e.className:'';return e.getAttribute('aria-pressed')==='true'||e.getAttribute('aria-selected')==='true'||e.hasAttribute('aria-current')||/(^|\s)(on|active|is-active|sel|selected|current)(\s|$)/.test(c);}

  function vdlCR(a,b){var x=Math.max(a,b),y=Math.min(a,b);return (x+0.05)/(y+0.05);}
  var VDL_TARGET={surf:1,page:0.91,btn:0.91,sel:0.9};
  function vdlEffBg(win,e){for(var x=e;x;x=x.parentElement){if(x.__vdlPending&&VDL_TARGET[x.__vdlPending])return VDL_TARGET[x.__vdlPending];
      if(x.__vdl&&VDL_TARGET[x.__vdl])return VDL_TARGET[x.__vdl];
      var cs=win.getComputedStyle(x);
      if(cs.backgroundImage&&cs.backgroundImage!=='none'){var st=cs.backgroundImage.match(/rgba?\([^)]+\)/g);if(st){var ls=st.map(function(c){return vdlLum(vdlRgb(c));}).filter(function(v){return v!==null;});if(ls.length)return Math.max.apply(null,ls);}}
      var p=vdlRgb(cs.backgroundColor);if(p)return vdlLum(p);}return 1;}
  /* R321 : une surface sombre TEINTÉE (rouge rupture, jaune, orange, vert…) devient une surface claire de la même teinte
     avec un contour de cette couleur ; une bordure colorée (liseré d’état) est conservée. Le sens de la couleur ne disparaît plus. */
  function vdlSemantic(win,e){var cs=win.getComputedStyle(e),best=null,bs=0;
    var cand=[cs.backgroundColor].concat(cs.backgroundImage&&cs.backgroundImage!=='none'?(cs.backgroundImage.match(/rgba?\([^)]+\)/g)||[]):[]);
    cand.forEach(function(c){var m=(c||'').match(/rgba?\(([^)]+)\)/);if(!m)return;var p=m[1].split(',').map(Number);if(p.length>3&&p[3]<0.35)return;var sat=vdlSat(p);if(sat>0.45&&Math.max(p[0],p[1],p[2])>60&&sat>bs){bs=sat;best=p;}});
    var bc=['Top','Right','Bottom','Left'].map(function(k){return vdlRgb(cs['border'+k+'Color']);}).filter(function(p){return p&&vdlSat(p)>0.45&&Math.max(p[0],p[1],p[2])>90;});
    if(best){var mx=Math.max(best[0],best[1],best[2]),f=255/mx,h=best.slice(0,3).map(function(v){return Math.min(255,Math.round(v*f));});
      var tint=h.map(function(v){return Math.round(255-(255-v)*0.12);}),edge=h.map(function(v){return Math.round(v*0.72);});
      return {tint:'rgb('+tint.join(',')+')',edge:'rgb('+edge.join(',')+')'};}
    return bc.length?{keepBorder:true}:null;}
  function vdlVoile(win,e){var cs=win.getComputedStyle(e);if(cs.position!=='fixed'||(cs.backgroundImage&&cs.backgroundImage!=='none'))return false;
    var m=(cs.backgroundColor||'').match(/rgba\(([^)]+)\)/);if(!m||!(+m[1].split(',')[3]<1))return false;
    var r=e.getBoundingClientRect();return r.width>=win.innerWidth*0.9&&r.height>=win.innerHeight*0.9;}
  var VDL_SKIP=/^(SCRIPT|STYLE|NOSCRIPT|OPTION|TEMPLATE|SVG|PATH|IMG|VIDEO|CANVAS|IFRAME|BR|HEAD|META|LINK)$/i;
  /* Lecture seule : décide sans rien écrire (évite les recalculs de style en chaîne). Renvoie [élément, type, couleur]. */
  function vdlDecide(doc,win,e,vh,out){
    if(VDL_SKIP.test(e.tagName))return;
    /* V2 : l’écran d’ouverture (anneau VERDICT / score) garde son fond sombre dans les deux thèmes. */
    if(e.id==='splash'||e.id==='verdictIntroHandoff'||(e.closest&&e.closest('#splash,#verdictIntroHandoff,#vr16,#vr16-cache,#vd-theme-btn,#maj18,#nv53,#vd-plus,.vd-cta,.vd-cta-hint,#decReveal,.dec-scene,.av31-full>summary,#decTotalBar,.vd-pas,#vdRecit,#vdBiblio,#vdLecteur,#vdRecitCarte,#vdOffre,#vdPlanBadge,#vx41,#vx41-feuille,#refSh,#mDemoIntent'))){if(e.__vdl)vdlClear(e);return;}
    /* C302 (V15-097) : un voile plein écran translucide (derrière la cloche, une fenêtre) reste un voile. Pris pour une
       surface sombre, il était repeint en blanc opaque et cachait toute l'appli derrière le panneau des notifications. */
    if(e.id==='notification-layer'||vdlVoile(win,e)){if(e.__vdl)vdlClear(e);return;}
    /* C400 (A28) : ces éléments ont leur couleur finale en CSS (clairFinal) : le correcteur n'y touche plus, et retire ce qu'il y avait posé. */
    if(doc.getElementById('vd-clair-c400')&&e.closest&&e.closest('#cp-nav,#v32ModuleDock,.btn.prim,button.vx40-suiv,#shSco')){if(e.__vdl)vdlClear(e);return;}
    /* V2-A8 : un onglet qui n’est plus sélectionné perd son fond « sélectionné » (avant : « Indice de sérénité » restait allumé). */
    if((e.__vdl==='sel'&&!vdlSelected(e))||(e.__vdl==='btn'&&vdlSelected(e)))vdlClear(e);
    if(e.__vdl&&e.__vdlVals){for(var pk in e.__vdlVals){if(e.style.getPropertyValue(pk)!==e.__vdlVals[pk]||e.style.getPropertyPriority(pk)!=='important'){vdlClear(e);e.__vdlVals=null;break;}}}
    var r=e.getBoundingClientRect();if(!r.width||!r.height)return;
    var kind=null;
    if((!e.__vdl||e.__vdl==='txt'||e.__vdl==='txtc')&&r.width*r.height>=300&&e.matches(VDL_CAND)){var L=vdlBgLum(win,e);
      if(L!==null&&L<0.1){var isBtn=e.tagName==='BUTTON'||e.getAttribute('role')==='tab'||e.getAttribute('role')==='button';
        var inSurf=false;for(var x=e.parentElement;x;x=x.parentElement){var k0=x.__vdlPending||x.__vdl;if(k0==='surf'||k0==='page'){inSurf=true;break;}}
        kind=isBtn?(vdlSelected(e)?'sel':(inSurf?'btn':'prim')):'surf';e.__vdlPending=kind;out.push([e,kind,kind==='surf'?vdlSemantic(win,e):null]);}}
    /* V2 : un texte foncé décidé pendant l’animation d’une feuille (fond encore transparent) est relu ; si son fond est
       maintenant sombre, la correction est retirée (titre « Protégez votre historique » illisible sinon). */
    if(e.__vdl==='txt'){if(vdlEffBg(win,e)<0.45)vdlClear(e);return;}
    if(e.__vdl==='txtc'){if(vdlEffBg(win,e)>=0.45)vdlClear(e);return;}
    var k1=e.__vdlPending||e.__vdl;if(k1==='prim')return;
    var t=false;for(var n=e.firstChild;n;n=n.nextSibling){if(n.nodeType===3&&n.textContent.trim().length){t=true;break;}}if(!t)return;
    for(var y=e;y;y=y.parentElement){if((y.__vdlPending||y.__vdl)==='prim')return;}
    var cs=win.getComputedStyle(e);
    var fg=vdlRgb(cs.color);if(!fg)return;var lf=vdlLum(fg),lb=vdlEffBg(win,e);
    if(vdlCR(lf,lb)>=3)return;
    /* C86 : un texte foncé posé sur une surface restée sombre en mode clair (bandeau du haut, fenêtre de démonstration, score)
       était illisible : il passe en clair, de la même teinte s'il est coloré. */
    if(lb<0.45){var cl;if(vdlSat(fg)<0.25)cl='#eef2f7';else{var m0=fg.slice(0,3),q=0;for(var s0=0;s0<14&&vdlCR(vdlLum(m0),lb)<4.5;s0++){q=1-(1-q)*0.8;m0=fg.slice(0,3).map(function(v){return Math.round(v+(255-v)*q);});}cl='rgb('+m0.join(',')+')';}out.push([e,'txtc',cl]);return;}
    var col;
    if(vdlSat(fg)<0.25)col=lf>0.5?'#14202b':'#4f5f6e';
    else{var k=1,c=fg.slice(0,3);for(var s=0;s<14&&vdlCR(vdlLum(c),lb)<4.5;s++){k*=0.85;c=fg.slice(0,3).map(function(v){return Math.round(v*k);});}col='rgb('+c.join(',')+')';}
    out.push([e,'txt',col]);
  }
  function vdlApply(out){if(out.length&&out[0][0].ownerDocument)out[0][0].ownerDocument.__vdlAny=true;out.forEach(function(d){var e=d[0];if(d[1]==='txt'||d[1]==='txtc'){var keep=e.__vdlProps||[];e.style.setProperty('color',d[2],'important');e.__vdlProps=keep.concat(['color']);e.__vdlVals=e.__vdlVals||{};e.__vdlVals.color=e.style.getPropertyValue('color');if(!e.__vdl){e.__vdl=d[1];e.setAttribute('data-vdl',d[1]);}}else{e.__vdlPending=null;vdlSet(e,d[1],d[2]);}});}
  /* C466 (audit A10, mesures de L3 : changer d'établissement dans le Perso, 30 à 96 ms de vdl dans les 4 s, en clair comme en sombre) :
     une passe complète seulement pour un document neuf ou quand le thème change ; chaque chargement de cadre en relançait une dans
     tous les documents (en sombre, pour ne rien retirer). Les ajouts suivent l'observateur, un seul bloc par sous-arbre en attente. */
  function vdlNeuf(doc,dark){var neuf=!doc.__vdlWatch;vdlWatch(doc);if(!neuf&&doc.__vdlTheme!==dark&&doc.__vdlGo)doc.__vdlGo();doc.__vdlTheme=dark;}
  function vdlQueue(doc,root,full){
    if(!doc.__vdlQ)doc.__vdlQ=[];
    if(full){doc.__vdlQ=[{full:true}];}
    else if(!(doc.__vdlQ[0]&&doc.__vdlQ[0].full&&!doc.__vdlQ[0].els)){
      for(var qi=0;qi<doc.__vdlQ.length;qi++){var q=doc.__vdlQ[qi];if(!q.els&&q.root&&(q.root===root||(q.root.contains&&q.root.contains(root))))return vdlSchedule(doc);}
      doc.__vdlQ.push({root:root});}
    vdlSchedule(doc);
  }
  function vdlSchedule(doc){if(doc.__vdlPend)return;doc.__vdlPend=true;var w=doc.defaultView||window;w.requestAnimationFrame(function(){doc.__vdlPend=false;vdlWork(doc);});}
  /* C400 (A28) : jamais de correction dans un cadre caché (Pilotage derrière l'Inventaire) ; elle reprend quand il réapparaît. */
  function vdlCadreVisible(win){try{for(var x=win;x&&x.frameElement;x=x.parent){var f=x.frameElement;if(!f.getClientRects().length||x.parent.getComputedStyle(f).visibility==='hidden')return false;}}catch(e){}return true;}
  function vdlWork(doc){
    var win=doc.defaultView;if(!win||!doc.body)return;
    /* C466 : en sombre, rien à mesurer (aucun calcul de mise en page forcé) : on retire seulement d'éventuelles corrections du clair. */
    if(!doc.documentElement.classList.contains('vd-workspace-light')){if(doc.__vdlAny){doc.querySelectorAll('[data-vdl]').forEach(vdlClear);doc.__vdlAny=false;}doc.__vdlQ=[];return;}
    if(!vdlCadreVisible(win))return;
    var t0=win.performance.now();
    [doc.documentElement,doc.body].forEach(function(e){if(!e||e.__vdl==='page')return;var L=vdlBgLum(win,e);if(L!==null&&L<0.1){vdlSet(e,'page');doc.__vdlAny=true;}});
    var vh=win.innerHeight||800,Q=doc.__vdlQ||[];
    while(Q.length){
      var it=Q[0];
      if(!it.els){var root=it.full?doc.body:it.root;if(!root||!root.isConnected||root.nodeType!==1){Q.shift();continue;}
        var all=[root].concat(Array.prototype.slice.call(root.getElementsByTagName('*')));
        if(it.full){var a=[],b=[];all.forEach(function(e){var r=e.getBoundingClientRect();(r.bottom>=0&&r.top<=vh?a:b).push(e);});all=a.concat(b);}
        it.els=all;it.i=0;}
      var out=[];
      while(it.i<it.els.length){var e=it.els[it.i++];if(e.isConnected){try{vdlDecide(doc,win,e,vh,out);}catch(x){}}
        if((it.i&1)===0&&win.performance.now()-t0>4){/* C333 : budget 4 ms, vérifié tous les 2 éléments (pointes de 20 ms) */vdlApply(out);doc.__vdlMs=Math.max(doc.__vdlMs||0,win.performance.now()-t0);vdlSchedule(doc);return;}}
      vdlApply(out);
      Q.shift();
    }
    doc.__vdlMs=Math.max(doc.__vdlMs||0,win.performance.now()-t0);
  }
  function vdlWatch(doc){
    if(!doc||!doc.body||doc.__vdlWatch)return;doc.__vdlWatch=true;
    try{new (doc.defaultView||window).MutationObserver(function(recs){
      if(!doc.documentElement.classList.contains('vd-workspace-light'))return;
      recs.forEach(function(m){if(m.type==='childList')m.addedNodes.forEach(function(n){if(n.nodeType===1)vdlQueue(doc,n,false);else if(n.nodeType===3&&n.parentElement)vdlQueue(doc,n.parentElement,false);});
        else if(m.type==='attributes'&&m.target.nodeType===1&&m.target!==doc.documentElement){var t=m.target;if(t.__vdl&&t.__vdl!=='txt'&&t.__vdl!=='txtc'&&m.attributeName==='class'){vdlClear(t);}vdlQueue(doc,t,false);}});
    }).observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','open','aria-pressed','aria-selected']});}catch(e){}
    /* V2 : fin d’animation ou de transition → relecture du bloc animé (feuilles qui glissent, fondus). */
    try{['animationend','transitionend'].forEach(function(t){doc.addEventListener(t,function(ev){if(ev.target&&ev.target.nodeType===1&&doc.documentElement.classList.contains('vd-workspace-light')&&ev.target.closest('.modal,.sheet,[role=dialog],#refSh'))vdlQueue(doc,ev.target.closest('.modal,.sheet,[role=dialog],#refSh')||ev.target,false);},true);});}catch(e){}
    doc.__vdlGo=function(){vdlQueue(doc,null,true);};
    try{var fe=doc.defaultView&&doc.defaultView.frameElement;if(fe&&window.ResizeObserver)new window.ResizeObserver(function(){if(doc.__vdlQ&&doc.__vdlQ.length&&vdlCadreVisible(doc.defaultView))vdlSchedule(doc);}).observe(fe);}catch(e){}
    if(doc.documentElement.classList.contains('vd-workspace-light'))doc.__vdlGo();/* C466 : document neuf en sombre : rien à corriger */
  }
  /* C400 (A28 de l'audit du 27/10 : « des couleurs changent sous les yeux ») : en clair, la couleur finale des éléments que le
     correcteur repeignait après coup est donnée en CSS dans chaque page de Pilotage, posée au chargement du cadre (avant qu'il soit
     montré) : bouton principal vert dès la première image (Accueil « Enregistrer ma journée »), rail collé de À faire clair ; la
     puce de la Carte garde la couleur de sa page (le correcteur n'y repasse plus) ; aucune transition de couleur. En sombre, rien ne change. */
  function sousPilotage(f){try{for(var x=f;x;x=x.ownerDocument.defaultView.frameElement)if(x.id==='frame-verdict')return true;}catch(e){}return false;}
  function clairFinal(doc){
    try{if(!doc||doc.getElementById('vd-clair-c400'))return;var s=doc.createElement('style');s.id='vd-clair-c400';var L='html.vd-workspace-light:not(#vd-c400) body ';/* l'identifiant l'emporte sur les règles de page (052 : bouton principal foncé en clair, !important) */
      s.textContent=L+'.btn.prim,'+L+'button.vx40-suiv{background:#15803d!important;background-image:none!important;border-color:#15803d!important;color:#fff!important;transition:none!important}'+
        L+'#cp-nav>button,'+L+'#v32ModuleDock .chips>button{transition:none!important}'+/* la puce de la Carte garde la couleur que lui donne déjà la page ; seul le correcteur n'y repasse plus */
        L+'#v32ModuleDock>.actbar>.chips{background:#ffffff!important;border-color:#d5dde5!important;box-shadow:0 8px 24px rgba(16,24,40,.12)!important}'+
        L+'#v32ModuleDock>.actbar>.chips>button{color:#334155!important;background-image:none!important}'+
        L+'#v32ModuleDock>.actbar>.chips>button.on,'+L+'#v32ModuleDock>.actbar>.chips>button[aria-current],'+L+'#v32ModuleDock>.actbar>.chips>button[aria-selected="true"]{background:#e7f1eb!important;color:#14532d!important}'+
        /* A63 (appui L1, audit du 27/10) : la page déclare color-scheme:dark sur body (cases à cocher noires, curseurs sombres en clair) et la
           fiche « Indice de sérénité en détail » (#shSco) n'a que des couleurs sombres ; en clair, sa version claire. */
        'html.vd-workspace-light:not(#vd-c400) body{color-scheme:light!important}'+
        L+'#shSco{background:rgba(15,23,42,.45)!important}'+L+'#shSco .p{background:#ffffff!important;border-color:#d5dde5!important;box-shadow:0 28px 70px rgba(15,23,42,.18)!important;color:#14202b!important}'+
        L+'#shSco h3,'+L+'#shSco .big span,'+L+'#shSco .shlim b{color:#14202b!important}'+L+'#shSco .shd,'+L+'#shSco .shn{color:#5b6878!important}'+L+'#shSco .shn{border-top-color:#e3e8ee!important}'+
        L+'#shSco .shrow span{color:#334155!important}'+L+'#shSco .shrow .bar{background:#e6ebf0!important}'+L+'#shSco .shlim{background:rgba(15,23,42,.04)!important;color:#4f5f6e!important}'+
        L+'#shSco .shproof{background:#f3f7fb!important;border-color:#cfdbe7!important;color:#334155!important}'+L+'#shSco .shproof strong{color:#0f172a!important}'+
        L+'#shSco .shtopx,'+L+'#shSco .shx{background:#f3f5f7!important;border-color:#d5dde5!important;color:#14202b!important}';
      (doc.head||doc.documentElement).appendChild(s);}catch(e){}
  }
  /* C342 (Steven, iPhone : « trou noir » au défilement rapide, « ça ne fait pas premium ») : décision 24, tout le contenu est peint
     dès qu'il entre à l'écran. Les bandeaux collants (en-tête de la coque, haut de Pilotage, barre des établissements) floutaient ce
     qui passait dessous : à chaque image du défilement, tout le contenu derrière était refloué, et sur iPhone les nouvelles zones
     restaient de la couleur du fond (noir) tant que la peinture n'avait pas suivi. Plus de flou sur ce qui défile : un fond presque
     opaque de la même teinte (en clair, ces bandeaux sont déjà opaques : rien ne change à l'œil). */
  function peinture(doc) {
    try { if (!doc || doc.getElementById('vd-peinture-c342')) return; var s = doc.createElement('style'); s.id = 'vd-peinture-c342';
      var H = 'html:not(#vd-c342) body ';
      s.textContent = [H + '.app-shell-header', H + '.stickytop', H + '.stickytop .top', H + '#etabBar'].join(',') + '{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
        'html.vd-workspace-dark:not(#vd-c342) body .app-shell-header,html.vd-workspace-dark:not(#vd-c342) body .stickytop{background-color:rgba(10,11,14,.97)!important}' +
        'html.vd-workspace-dark:not(#vd-c342) body #etabBar{background-color:rgba(8,9,11,.97)!important}';
      (doc.head || doc.documentElement).appendChild(s); } catch (e) {}
  }
  function applyToFrame(frame, dark) {
    try {
      var doc = frame.contentDocument;
      if (!doc || !doc.documentElement) return;
      doc.documentElement.classList.toggle('vd-workspace-dark', dark);
      doc.documentElement.classList.toggle('vd-workspace-light', !dark);
      doc.documentElement.style.colorScheme=dark?'dark':'light';
      doc.documentElement.style.backgroundColor=dark?'#08090b':'#fff';
      doc.querySelectorAll('iframe').forEach(function (inner) { applyToFrame(inner, dark); });
      peinture(doc);
      if (sousPilotage(frame)) clairFinal(doc);
      try { vdlNeuf(doc, dark); } catch (e) {}
      if (!frameObservers.has(doc)) {
        var observer = new MutationObserver(function () {
          var current = appearance(preference()) === 'dark';
          if (doc.documentElement.classList.contains('vd-workspace-dark') !== current ||
              doc.documentElement.classList.contains('vd-workspace-light') === current) applyToFrame(frame, current);
        });
        observer.observe(doc.documentElement, {attributes:true,attributeFilter:['class']});
        doc.addEventListener('load', function (event) {
          if (event.target && event.target.tagName === 'IFRAME') applyToFrame(event.target, appearance(preference()) === 'dark');
        }, true);
        frameObservers.set(doc, observer);
      }
    } catch (error) { /* A different origin keeps its own appearance. */ }
  }
  function render() {
    var mode = preference();
    var dark = appearance(mode) === 'dark';
    document.documentElement.classList.toggle('vd-workspace-dark', dark);
    document.documentElement.classList.toggle('vd-workspace-light', !dark);
    document.documentElement.style.colorScheme=dark?'dark':'light';
    document.documentElement.style.backgroundColor=dark?'#08090b':'#fff';
    button.innerHTML = dark ? SUN : MOON; button.classList.toggle('vd-sun', dark);
    var label = 'Passer en mode ' + (dark ? 'clair' : 'sombre') + (mode === 'auto' ? ' (apparence de l’appareil active)' : '');
    button.setAttribute('aria-label', label);
    button.title = label;
    button.setAttribute('aria-pressed', String(mode !== 'auto'));
    document.querySelectorAll('iframe').forEach(function (frame) { applyToFrame(frame, dark); });
    peinture(document);
    try { vdlNeuf(document, dark); } catch (e) {}
  }
  button.addEventListener('click', function () {
    var next = appearance(preference()) === 'dark' ? 'light' : 'dark';
    try { if (next === apparenceAppareil()) { localStorage.removeItem(mobileKey); localStorage.removeItem(desktopKey); } else { localStorage.setItem(mobileKey, next); localStorage.setItem(desktopKey, next); } } catch (error) {}
    render();
  });
  document.addEventListener('load', function (event) {
    if (event.target && event.target.tagName === 'IFRAME') render();
  }, true);
  document.querySelectorAll('.module-tabs button').forEach(function (tab) {
    tab.addEventListener('click', function () {
      render();
      requestAnimationFrame(render);
      setTimeout(render, 150);
    });
  });
  new MutationObserver(function () {
    var dark = appearance(preference()) === 'dark';
    if (document.documentElement.classList.contains('vd-workspace-dark') !== dark ||
        document.documentElement.classList.contains('vd-workspace-light') === dark) render();
  }).observe(document.documentElement, {attributes:true,attributeFilter:['class']});
  window.addEventListener('storage', function (event) { if (event.key === mobileKey || event.key === desktopKey) render(); });
  /* C242 (Y10, T1 N7 : « passer le système en sombre ne change pas l'appli tant qu'on ne la recharge pas ») : le passage
     de l'appareil en sombre ou en clair est suivi aussitôt, partout. Les anciens Safari n'ont pas addEventListener sur
     matchMedia (le script s'arrêtait ici, sans aucune écoute) : addListener en secours. Et comme l'appli installée sur
     l'écran d'accueil ne reçoit pas toujours l'événement (Centre de contrôle, coucher du soleil), l'apparence est relue au
     retour (focus, page affichée) et toutes les 2 s : une simple lecture, rien n'est réécrit tant qu'elle ne change pas.
     Le choix au soleil ou à la lune reste tel que C188 l'a fixé (l'appareil reprend la main quand il change). */
  function ecouter(mq, fn) { if (!mq) return; try { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); } catch (e) {} }
  var dernierAppareil = apparenceAppareil();
  function verifierAppareil() { var a = apparenceAppareil(); if (a === dernierAppareil) return; dernierAppareil = a; suivreAppareil(); render(); }
  ecouter(system, verifierAppareil);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { dernierAppareil = apparenceAppareil(); suivreAppareil(); render(); } });
  window.addEventListener('pageshow', function () { dernierAppareil = apparenceAppareil(); suivreAppareil(); render(); });
  window.addEventListener('focus', verifierAppareil);
  /* C323 (V16-058, T2 n° 20) : la coque relit aussi l'apparence quand la page est marquée « cachée » mais affichée (aperçu, panneau),
     au redimensionnement et au premier toucher : le changement du système s'applique entièrement, sans rechargement. */
  setInterval(verifierAppareil, 1500);
  window.addEventListener('resize', verifierAppareil);
  document.addEventListener('pointerdown', verifierAppareil, { capture: true, passive: true });
  ecouter(mobile, render);
  /* C343 : Paramètres › Apparence. « auto » = l'apparence de l'appareil (comme sans aucun choix) ; « clair » ou « sombre » = les
     deux clés lues partout (coque, cadres, script de démarrage) et la marque d'un choix fait ici, que l'appareil ne défait plus. */
  window.VerdictTheme = {
    etat: function () { var p = preference(); return p === 'dark' ? 'sombre' : p === 'light' ? 'clair' : 'auto'; },
    choisir: function (v) {
      try {
        if (v === 'clair' || v === 'sombre') { var x = v === 'sombre' ? 'dark' : 'light'; localStorage.setItem(mobileKey, x); localStorage.setItem(desktopKey, x); localStorage.setItem(choixKey, '1'); }
        else { localStorage.removeItem(mobileKey); localStorage.removeItem(desktopKey); localStorage.removeItem(choixKey); }
      } catch (e) {}
      render();
    }
  };
  render();
})();
