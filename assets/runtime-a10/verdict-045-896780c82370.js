
(function(global){
  "use strict";
  var VERSION="verdict-deep-links/v45.0.0";
  var ROUTES=Object.freeze({
    fec:{module:"verdict",view:"in",target:"v44-fec"},
    action:{module:"verdict",view:"dec",target:"decBestCard"},
    "human-cost":{module:"verdict",view:"sal",target:"salBody"},
    material:{module:"inventory",view:"prod",target:"v-prod"},
    cash:{module:"verdict",view:"in",target:"i-treso"},
    stockout:{module:"inventory",view:"count",target:"stockout"},
    suppliers:{module:"inventory",view:"order",target:"suppliers"},
    purchases:{module:"inventory",view:"prod",target:"v-prod"},
    orders:{module:"inventory",view:"order",target:"v-order"},
    "inventory-analysis":{module:"inventory",view:"stats",target:"statsBody"}
  });
  var aliases={fec:"fec",import:"fec","import-fec":"fec",priorite:"action",priority:"action",action:"action",humain:"human-cost",salaires:"human-cost",personnel:"human-cost","human-cost":"human-cost",matiere:"material",achats:"purchases",purchases:"purchases","food-cost":"inventory-analysis",material:"material",analyse:"inventory-analysis",analysis:"inventory-analysis","inventory-analysis":"inventory-analysis",tresorerie:"cash",banque:"cash",cash:"cash",rupture:"stockout",stockout:"stockout",fournisseur:"suppliers",fournisseurs:"suppliers",commande:"orders",commandes:"orders",orders:"orders",suppliers:"suppliers"};

  function clean(value){return aliases[String(value||"").toLowerCase().trim()]||"";}
  function currentModule(){try{return global.VerdictUnified&&global.VerdictUnified.module||(/inventaire/i.test(global.document&&global.document.title||"")?"inventory":"verdict");}catch(e){return "verdict";}}
  function reduced(){try{return !!(global.matchMedia&&global.matchMedia("(prefers-reduced-motion: reduce)").matches);}catch(e){return false;}}
  function visibleBlocker(){try{return !!global.document.querySelector('.modal.on,#mLang,#verdictIntroHandoff,#splash,#refSh.on');}catch(e){return false;}}
  /* V44.42 — route=fec : le visiteur a déjà choisi, la feuille d'accueil ne
     doit pas lui reposer la question. */
  function welcomeOpen(){try{var r=global.document.getElementById('refSh');return !!(r&&r.classList.contains('on')&&r.querySelector('[data-entry-door]'));}catch(e){return false;}}
  function focus(node){
    if(!node)return false;
    try{node.classList.add("v44-deep-target","v44-focus");if(!node.hasAttribute("tabindex"))node.setAttribute("tabindex","-1");node.scrollIntoView({block:"center",inline:"nearest",behavior:reduced()?"auto":"smooth"});node.focus({preventScroll:true});global.setTimeout(function(){try{node.classList.remove("v44-focus");}catch(e){}},1450);return true;}catch(e){return false;}
  }
  function verdictTarget(route){
    var entry=ROUTES[route];if(!entry)return false;
    if(typeof global.go==="function"&&global.go(entry.view)===false)return false;
    var node=global.document.getElementById(entry.target);
    if(route==="action")node=node||global.document.getElementById("decScene")||global.document.getElementById("v-dec");
    if(route==="human-cost")node=node||global.document.getElementById("i-salb")||global.document.getElementById("v-sal");
    if(route==="material")node=node||global.document.getElementById("i-nour")||global.document.getElementById("v-achats");
    return focus(node||global.document.getElementById("v-"+entry.view));
  }
  function inventoryTarget(route){
    if(typeof global.go!=="function")return false;
    if(route==="stockout"){
      global.go("count");
      return focus(global.document.querySelector("#countList .z-rup,#countList .z-min,#countList .item")||global.document.getElementById("v-count"));
    }
    if(route==="purchases"||route==="material"){
      global.go("prod");
      return focus(global.document.querySelector("#v-prod .btn,#prodList .item")||global.document.getElementById("v-prod"));
    }
    if(route==="inventory-analysis"){
      global.go("stats");
      return focus(global.document.getElementById("statsBody")||global.document.getElementById("v-stats"));
    }
    global.go("order");
    return focus(global.document.querySelector(".ord-toolbar,.ord-intro,#orderList .card")||global.document.getElementById("v-order"));
  }
  function switchModule(route){
    var entry=ROUTES[route],bridge=global.VerdictUnified;
    if(!entry||!bridge||typeof bridge.requestSwitch!=="function")return false;
    return bridge.requestSwitch(entry.module,{route:route});
  }
  function navigate(value){
    var route=clean(value),entry=ROUTES[route];if(!entry)return false;
    if(entry.module!==currentModule())return switchModule(route);
    if(route==="fec"&&welcomeOpen()&&typeof global.choisirFEC==="function"){global.choisirFEC();return true;}
    if(visibleBlocker())return false;
    var done=entry.module==="inventory"?inventoryTarget(route):verdictTarget(route);
    if(done)try{var url=new URL(global.location.href);url.searchParams.set("route",route);global.history.replaceState(global.history.state,"",url.pathname+url.search+url.hash);}catch(e){}
    return done;
  }
  function schedule(value){
    var route=clean(value);if(!route)return false;var attempt=0,delays=[0,180,520,1100,2400,4800,9000,15000,22000];
    function run(){if(navigate(route))return;attempt++;if(attempt<delays.length)global.setTimeout(run,delays[attempt]);}
    global.setTimeout(run,delays[0]);return true;
  }
  function initial(){try{return new URLSearchParams(global.location.search+(self.__vdq||"")).get("route")||"";}catch(e){return "";}}
  function install(){
    if(!global.document)return false;
    global.document.addEventListener("click",function(event){var node=event.target&&event.target.closest&&event.target.closest("[data-verdict-route]");if(!node)return;var route=node.getAttribute("data-verdict-route");if(clean(route)){event.preventDefault();schedule(route);}},true);
    global.addEventListener("message",function(event){if((global.location.origin!=="null"&&global.location.protocol!=="file:")&&event.origin!==global.location.origin)return;var data=event.data;if(data&&data.type==="verdict-deep-link")schedule(data.route);});
    global.document.addEventListener("verdict:startup-ready",function(){var route=initial();if(route)schedule(route);});
    var route=initial();if(route)schedule(route);return true;
  }
  global.VerdictDeepLinks=Object.freeze({VERSION:VERSION,ROUTES:ROUTES,clean:clean,navigate:navigate,schedule:schedule,install:install});
  if(typeof module==="object"&&module.exports)module.exports=global.VerdictDeepLinks;
  if(global.document){if(global.document.readyState==="loading")global.document.addEventListener("DOMContentLoaded",install,{once:true});else install();}
})(typeof globalThis!=="undefined"?globalThis:this);

