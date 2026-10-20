
(function(){
  'use strict';
  var textMemory=new WeakMap(),attributeMemory=new WeakMap(),scheduled=false,observer=null,workQueue=[],activeJob=null;
  var rules={
    fr:[[/Score moteur/gi,'Indice calculé'],[/Scores/gi,'Indices de sérénité'],[/Score/gi,'Indice de sérénité'],[/points morts/gi,'chiffres minimums'],[/point mort/gi,'chiffre minimum'],[/Pilote Quotidien/gi,'Pilotage du jour'],[/Formule du jour/gi,'Menu du jour'],[/formules de calcul/gi,'calculs'],[/formule de calcul/gi,'calcul'],[/fichiers/gi,'documents'],[/fichier/gi,'document'],[/onglets/gi,'écrans'],[/onglet/gi,'écran'],[/\bfuites\b/gi,'écarts économiques'],[/\bfuite\b/gi,'écart économique'],[/\bIA\b/g,'Vera']],
    en:[[/engine score/gi,'calculated index'],[/scores/gi,'serenity indices'],[/score/gi,'serenity index'],[/break[ -]?even(?: point)?/gi,'minimum revenue'],[/daily pilot/gi,'daily steering'],[/formula of the day/gi,'menu of the day'],[/formulas/gi,'calculations'],[/formula/gi,'calculation'],[/\bfiles\b/gi,'documents'],[/\bfile\b/gi,'document'],[/\btabs\b/gi,'screens'],[/\btab\b/gi,'screen'],[/\bleaks\b/gi,'economic gaps'],[/\bleak\b/gi,'economic gap'],[/\bAI\b/g,'Vera']],
    es:[[/puntuaciones/gi,'índices de serenidad'],[/puntuación/gi,'índice de serenidad'],[/punto de equilibrio/gi,'cifra mínima'],[/fórmulas/gi,'cálculos'],[/fórmula/gi,'cálculo'],[/archivos/gi,'documentos'],[/archivo/gi,'documento'],[/pestañas/gi,'pantallas'],[/pestaña/gi,'pantalla'],[/\bfugas\b/gi,'diferencias económicas'],[/\bfuga\b/gi,'diferencia económica'],[/\bIA\b/g,'Vera']],
    it:[[/punteggi/gi,'indici di serenità'],[/punteggio/gi,'indice di serenità'],[/punto di pareggio/gi,'ricavo minimo'],[/formula del giorno/gi,'menu del giorno'],[/formule/gi,'calcoli'],[/formula/gi,'calcolo'],[/\bfiles\b/gi,'documenti'],[/\bfile\b/gi,'documento'],[/\btabs\b/gi,'schermate'],[/\btab\b/gi,'schermata'],[/\bfughe\b/gi,'scostamenti economici'],[/\bfuga\b/gi,'scostamento economico'],[/\bIA\b/g,'Vera']],
    /* R320 : « Datei » (féminin) devient « Dokument » (neutre) : les articles doivent suivre, sinon « meine Buchhaltungsdokument », « liest die Dokument ». */
    de:[[/\b(Ihres|des|desselben) Scores\b/g,'$1 Stabilitätsindex'],[/\bder offiziellen Buchungsdatei\b/gi,'dem offiziellen Buchungsdokument'],[/\bmeine Buchhaltungsdatei\b/gi,'mein Buchhaltungsdokument'],[/\bIhre Buchhaltungsdatei\b/g,'Ihr Buchhaltungsdokument'],[/\bIhrer Buchungsdatei\b/g,'Ihrem Buchungsdokument'],[/\bdie XML-Datei\b/gi,'das XML-Dokument'],[/\bdie Rohdatei\b/gi,'das Rohdokument'],[/\bdie Datei\b/gi,'das Dokument'],[/\bdiese Datei\b/gi,'dieses Dokument'],[/\bdieser Datei\b/gi,'diesem Dokument'],[/\beiner Datei\b/gi,'einem Dokument'],[/\bder Datei\b/gi,'des Dokuments'],[/([a-zäöüß])dateien\b/g,'$1dokumente'],[/([a-zäöüß])datei\b/g,'$1dokument'],[/Motorbewertung/gi,'berechneter Index'],[/Bewertungen|Scores/gi,'Stabilitätsindizes'],[/Bewertung|Score/gi,'Stabilitätsindex'],[/Break[ -]?even(?:[ -]?Punkt)?/gi,'Mindestumsatz'],[/Formeln/gi,'Berechnungen'],[/Formel/gi,'Berechnung'],[/Dateien/gi,'Dokumente'],[/Datei/gi,'Dokument'],[/Registerkarten/gi,'Ansichten'],[/Registerkarte/gi,'Ansicht'],[/\bLecks\b/gi,'wirtschaftliche Abweichungen'],[/\bLeck\b/gi,'wirtschaftliche Abweichung'],[/\bKI\b/g,'Vera']],
    nl:[[/motorscore/gi,'berekende index'],[/scores/gi,'rustindices'],[/score/gi,'rustindex'],[/break[ -]?evenpunt/gi,'minimale omzet'],[/formules/gi,'berekeningen'],[/formule/gi,'berekening'],[/bestanden/gi,'documenten'],[/bestand/gi,'document'],[/tabbladen/gi,'schermen'],[/tabblad/gi,'scherm'],[/\blekken\b/gi,'economische verschillen'],[/\blek\b/gi,'economisch verschil'],[/\bAI\b/g,'Vera']],
    pt:[[/pontuações/gi,'índices de serenidade'],[/pontuação/gi,'índice de serenidade'],[/ponto de equilíbrio/gi,'faturação mínima'],[/fórmulas/gi,'cálculos'],[/fórmula/gi,'cálculo'],[/ficheiros|arquivos/gi,'documentos'],[/ficheiro|arquivo/gi,'documento'],[/separadores|abas/gi,'ecrãs'],[/separador|aba/gi,'ecrã'],[/\bfugas\b/gi,'desvios económicos'],[/\bfuga\b/gi,'desvio económico'],[/\bIA\b/g,'Vera']]
  };
  function locale(){var value='';try{value=String(window.LOCALE||document.documentElement.lang||'fr');}catch(e){}value=value.toLowerCase().split('-')[0];return rules[value]?value:'fr';}
  function preserveCase(source,replacement){if(!source)return replacement;if(source===source.toUpperCase())return replacement.toUpperCase();if(source.charAt(0)===source.charAt(0).toUpperCase())return replacement.charAt(0).toUpperCase()+replacement.slice(1);return replacement;}
  function rewrite(value){var out=String(value==null?'':value);(rules[locale()]||rules.fr).forEach(function(rule){out=out.replace(rule[0],function(match){var args=arguments,replacement=rule[1];replacement=replacement.replace(/\$(\d)/g,function(_,n){return args[Number(n)]||'';});return preserveCase(match,replacement);});});if(locale()==='fr')out=out.replace(/\b(le|du|au|ce) (indice(?: de sérénité| calculé)?)/gi,function(match,article,noun){var join={le:'l’',du:'de l’',au:'à l’',ce:'cet '}[article.toLowerCase()];return preserveCase(article,join)+noun.toLowerCase();});return out;}
  function excluded(node){var parent=node&&node.nodeType===3?node.parentElement:node;return !!(parent&&parent.closest&&parent.closest('script,style,textarea,code,pre,[data-verdict-vocabulary="off"]'));}
  function transformText(node){if(!node||node.nodeType!==3||excluded(node))return;var current=node.nodeValue||'',record=textMemory.get(node);if(record&&current===record.output)return;if(record&&current!==record.output)record=null;var source=record?record.source:current,output=rewrite(source);textMemory.set(node,{source:source,output:output});if(output!==current)node.nodeValue=output;}
  function transformAttributes(element){if(!element||element.nodeType!==1||excluded(element))return;var map=attributeMemory.get(element);if(!map){map={};attributeMemory.set(element,map);}['aria-label','title','placeholder','data-label'].forEach(function(name){if(!element.hasAttribute(name))return;var current=element.getAttribute(name)||'',record=map[name];if(record&&current===record.output)return;if(record&&current!==record.output)record=null;var source=record?record.source:current,output=rewrite(source);map[name]={source:source,output:output};if(output!==current)element.setAttribute(name,output);});}
  function walk(root){if(!root)return;if(root.nodeType===3){transformText(root);return;}if(root.nodeType===1)transformAttributes(root);var walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT),node;while((node=walker.nextNode())){if(node.nodeType===3)transformText(node);else transformAttributes(node);}}
  function restore(root){root=root||document;function restoreNode(node){var record=textMemory.get(node);if(record&&node.nodeValue===record.output)node.nodeValue=record.source;}function restoreElement(element){var map=attributeMemory.get(element);if(!map)return;Object.keys(map).forEach(function(name){var record=map[name];if(element.getAttribute(name)===record.output)element.setAttribute(name,record.source);});}if(root.nodeType===3)restoreNode(root);else{if(root.nodeType===1)restoreElement(root);var walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT),node;while((node=walker.nextNode())){if(node.nodeType===3)restoreNode(node);else restoreElement(node);}}}
  function workNode(node){if(!node)return;if(node.nodeType===3)transformText(node);else if(node.nodeType===1)transformAttributes(node);}
  function enqueue(root,urgent){
    if(!root)return;var actual=root.nodeType?root:(document.body||document.documentElement);if(!actual)return;
    if(urgent&&activeJob&&activeJob.root&&activeJob.root!==actual&&activeJob.root.contains&&activeJob.root.contains(actual)){workQueue.push(activeJob);activeJob=null;}
    for(var i=workQueue.length-1;i>=0;i--){var queued=workQueue[i]&&workQueue[i].root;if(queued===actual)return;if(queued&&queued.contains&&queued.contains(actual)&&!urgent)return;if(actual.contains&&actual.contains(queued))workQueue.splice(i,1);}
    var job={root:actual,walker:null,rootDone:false};if(urgent)workQueue.unshift(job);else workQueue.push(job);
  }
  function requestWork(urgent){
    if(scheduled)return;scheduled=true;
    var run=function(){drainWork();};
    if(urgent){var raf=window.requestAnimationFrame||function(fn){Promise.resolve().then(fn);};raf(run);}
    else if(window.requestIdleCallback)window.requestIdleCallback(run,{timeout:120});
    else window.setTimeout(run,16);
  }
  function drainWork(){
    scheduled=false;var started=window.performance&&performance.now?performance.now():Date.now(),count=0;
    while(count<180&&((window.performance&&performance.now?performance.now():Date.now())-started)<4){
      if(!activeJob){activeJob=workQueue.shift()||null;if(!activeJob)break;}
      var job=activeJob,node=null;
      if(!job.rootDone){job.rootDone=true;node=job.root;}
      else{if(!job.walker)job.walker=document.createTreeWalker(job.root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);node=job.walker.nextNode();}
      if(!node){activeJob=null;continue;}workNode(node);count++;
    }
    if(activeJob||workQueue.length)requestWork(false);
  }
  function schedule(root,urgent){enqueue(root,!!urgent);requestWork(!!urgent);}
  function wrap(name){var original=window[name];if(typeof original!=='function'||original.__verdictVocabularyWrapped)return;var wrapped=function(){var target=name==='translateDOM'&&arguments[0]&&arguments[0].nodeType?arguments[0]:document;var result=original.apply(this,arguments);if(name==='translateDOM'){/* R320 : une fiche précise (feuille d'entrée, modale) reçoit son vocabulaire tout de suite, sans afficher une image avec l'ancien mot puis le nouveau. Le document entier reste traité par tranches. */if(target&&target.nodeType===1&&target!==document.body&&target!==document.documentElement&&target.getElementsByTagName('*').length<400){try{walk(target);}catch(e){schedule(target,true);}}else schedule(target,true);}else{schedule(document.querySelector('.stickytop'),true);schedule(document.querySelector('nav'),true);schedule(document.querySelector('.view.on'),true);}return result;};wrapped.__verdictVocabularyWrapped=true;wrapped.__verdictVocabularyOriginal=original;window[name]=wrapped;}
  /* La traduction passe d'abord, puis le vocabulaire client est appliqué.
     Surtout, on ne restaure jamais le DOM dans translateDOM : cela créerait
     une alternance sans fin entre les deux MutationObserver. */
  function install(){
    wrap('translateDOM');wrap('setLocale');
    /* R320 : une feuille déjà ouverte avant cette installation (feuille d'entrée
       du premier lancement) reçoit son vocabulaire immédiatement. */
    try{Array.prototype.forEach.call(document.querySelectorAll('#refSh.on #refP,.modal.on'),function(el){walk(el);});}catch(e){}
    /* La page complète reste couverte, mais par tranches de 4 ms. L'ancien
       parcours synchrone de tous les écrans cachés bloquait le premier rendu. */
    schedule(document.body,false);
    if(!observer&&window.MutationObserver){observer=new MutationObserver(function(records){records.forEach(function(record){
      if(record.type==='characterData'){var textRecord=textMemory.get(record.target);if(!textRecord||record.target.nodeValue!==textRecord.output)schedule(record.target,true);}
      else if(record.type==='attributes')schedule(record.target,true);
      else Array.prototype.forEach.call(record.addedNodes||[],function(node){schedule(node,true);});
    });});observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','data-label']});}
  }
  window.VerdictClientVocabulary={version:'1.1.0',apply:function(root){walk(root||document.body);},restore:function(root){restore(root||document.body);},rewrite:rewrite,flush:function(){while(activeJob||workQueue.length)drainWork();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
