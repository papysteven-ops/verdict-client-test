
/* =====================================================================
   VERDICT® · Inventaire premium R74 · 22 septembre 2026
   Pour celui qui compte : chef, barman, gérant. Une seule question en tête
   de l'écran Compter : « Que faut-il faire maintenant ? » — ruptures,
   commande prête, produits à compter — et trois gestes, un tap chacun.
   Lit les fonctions du module (vInvStats, inventoryOrderPlanSummary,
   inventoryOperationsSnapshot). N'écrit rien. Ne modifie aucun calcul.
   ===================================================================== */
(function(global){
  'use strict';
  var doc=global.document;if(!doc||global.VerdictInventairePremium)return;
  var T={
    fr:{kick:"Inventaire",q:"Que faut-il faire maintenant\u00a0?",rien:"Rien d\u2019urgent. Tout est compt\u00e9, rien \u00e0 commander.",rupt:"{n} rupture{s}",cmd:"{n} produit{s} \u00e0 commander",compter:"{n} produit{s} \u00e0 compter",suivis:"{n} produits suivis",tousComptes:"tous compt\u00e9s",cmdPrete:"Commande pr\u00eate\u00a0: {v} chez {f} fournisseur{s}.",bCompter:"Compter",bCompterS:"combien il en reste",bCmd:"Commander",bCmdS:"liste pr\u00eate",bRupt:"Ruptures",bRuptS:"\u00e0 traiter d\u2019abord",prio:"\u00c0 traiter en premier",stock:"en stock",min:"minimum",vide:"Aucune rupture. Bravo.",et:" et "},
    en:{kick:"Inventory",q:"What needs doing now?",rien:"Nothing urgent. All counted, nothing to order.",rupt:"{n} out of stock",cmd:"{n} product{s} to order",compter:"{n} product{s} to count",suivis:"{n} products tracked",tousComptes:"all counted",cmdPrete:"Order ready: {v} from {f} supplier{s}.",bCompter:"Count",bCompterS:"what is left",bCmd:"Order",bCmdS:"list ready",bRupt:"Out of stock",bRuptS:"handle first",prio:"Handle first",stock:"in stock",min:"minimum",vide:"Nothing out of stock. Well done.",et:" and "},
    es:{kick:"Inventario",q:"\u00bfQu\u00e9 hay que hacer ahora?",rien:"Nada urgente. Todo contado, nada que pedir.",rupt:"{n} rotura{s}",cmd:"{n} producto{s} por pedir",compter:"{n} producto{s} por contar",suivis:"{n} productos seguidos",tousComptes:"todos contados",cmdPrete:"Pedido listo: {v} en {f} {proveedor|proveedores}.",bCompter:"Contar",bCompterS:"cu\u00e1nto queda",bCmd:"Pedir",bCmdS:"lista lista",bRupt:"Roturas",bRuptS:"primero",prio:"Tratar primero",stock:"en stock",min:"m\u00ednimo",vide:"Ninguna rotura.",et:" y "},
    it:{kick:"Inventario",q:"Cosa bisogna fare adesso?",rien:"Niente di urgente. Tutto contato, niente da ordinare.",rupt:"{n} {esaurito|esauriti}",cmd:"{n} {prodotto|prodotti} da ordinare",compter:"{n} {prodotto|prodotti} da contare",suivis:"{n} prodotti seguiti",tousComptes:"tutti contati",cmdPrete:"Ordine pronto: {v} da {f} {fornitore|fornitori}.",bCompter:"Contare",bCompterS:"quanto resta",bCmd:"Ordinare",bCmdS:"lista pronta",bRupt:"Esauriti",bRuptS:"prima di tutto",prio:"Da trattare per primi",stock:"in stock",min:"minimo",vide:"Nessun esaurito.",et:" e "},
    de:{kick:"Inventar",q:"Was ist jetzt zu tun?",rien:"Nichts Dringendes. Alles gez\u00e4hlt, nichts zu bestellen.",rupt:"{n} ausverkauft",cmd:"{n} {Produkt|Produkte} zu bestellen",compter:"{n} {Produkt|Produkte} zu z\u00e4hlen",suivis:"{n} Produkte verfolgt",tousComptes:"alle gez\u00e4hlt",cmdPrete:"Bestellung bereit: {v} bei {f} {Lieferant|Lieferanten}.",bCompter:"Z\u00e4hlen",bCompterS:"was noch da ist",bCmd:"Bestellen",bCmdS:"Liste bereit",bRupt:"Ausverkauft",bRuptS:"zuerst",prio:"Zuerst erledigen",stock:"auf Lager",min:"Minimum",vide:"Nichts ausverkauft.",et:" und "},
    nl:{kick:"Voorraad",q:"Wat moet er nu gebeuren?",rien:"Niets dringend. Alles geteld, niets te bestellen.",rupt:"{n} op",cmd:"{n} {product|producten} te bestellen",compter:"{n} {product|producten} te tellen",suivis:"{n} producten gevolgd",tousComptes:"alles geteld",cmdPrete:"Bestelling klaar: {v} bij {f} leverancier{s}.",bCompter:"Tellen",bCompterS:"wat er nog is",bCmd:"Bestellen",bCmdS:"lijst klaar",bRupt:"Op",bRuptS:"eerst",prio:"Eerst afhandelen",stock:"in voorraad",min:"minimum",vide:"Niets op.",et:" en "},
    pt:{kick:"Invent\u00e1rio",q:"O que \u00e9 preciso fazer agora?",rien:"Nada urgente. Tudo contado, nada a encomendar.",rupt:"{n} rotura{s}",cmd:"{n} produto{s} a encomendar",compter:"{n} produto{s} a contar",suivis:"{n} produtos seguidos",tousComptes:"todos contados",cmdPrete:"Encomenda pronta: {v} em {f} {fornecedor|fornecedores}.",bCompter:"Contar",bCompterS:"quanto resta",bCmd:"Encomendar",bCmdS:"lista pronta",bRupt:"Roturas",bRuptS:"primeiro",prio:"Tratar primeiro",stock:"em stock",min:"m\u00ednimo",vide:"Nenhuma rotura.",et:" e "}
  };
  var emptyCopy={"fr": "Inventaire à renseigner ou à vérifier.", "en": "Inventory needs completing or checking.", "es": "Inventario por completar o verificar.", "it": "Inventario da completare o verificare.", "de": "Inventar ergänzen oder prüfen.", "nl": "Voorraad aanvullen of controleren.", "pt": "Inventário a preencher ou verificar."};Object.keys(T).forEach(function(k){T[k].empty=emptyCopy[k];});
  var A10_THRESHOLDS={"fr": "{n} produit(s) avec des seuils à renseigner", "en": "{n} product(s) with missing thresholds", "es": "{n} producto(s) con umbrales sin completar", "it": "{n} prodotto/i con soglie da completare", "de": "Bei {n} Produkt(en) fehlen Grenzwerte", "nl": "Bij {n} product(en) ontbreken drempelwaarden", "pt": "{n} produto(s) com limites por preencher"};Object.keys(A10_THRESHOLDS).forEach(function(l){T[l].thresholds=A10_THRESHOLDS[l];});
  function L(){var l="fr";try{l=(doc.documentElement.lang||"fr").slice(0,2).toLowerCase();}catch(e){}return T[l]||T.fr;}
  /* C217 W66 : textes ajoutés (titre = tuiles ; commande sans prix connus). */
  var C217={fr:{bas:"{n} sous le minimum",bSous:"Sous le minimum",dont:"dont {n} rupture{s}",sansPrix:"Commande pr\u00eate chez {f} fournisseur{s} \u00b7 prix \u00e0 renseigner.",inconnus:"({n} prix inconnu{s})",tous:"tout est compt\u00e9"},en:{bas:"{n} below minimum",bSous:"Below minimum",dont:"incl. {n} out of stock",sansPrix:"Order ready from {f} supplier{s} \u00b7 prices to add.",inconnus:"({n} unknown price{s})",tous:"all counted"},es:{bas:"{n} bajo el m\u00ednimo",bSous:"Bajo el m\u00ednimo",dont:"incl. {n} rotura{s}",sansPrix:"Pedido listo en {f} {proveedor|proveedores} \u00b7 precios por completar.",inconnus:"({n} precio{s} desconocido{s})",tous:"todo contado"},it:{bas:"{n} sotto il minimo",bSous:"Sotto il minimo",dont:"di cui {n} {esaurito|esauriti}",sansPrix:"Ordine pronto da {f} {fornitore|fornitori} \u00b7 prezzi da inserire.",inconnus:"({n} prezzi sconosciuti)",tous:"tutto contato"},de:{bas:"{n} unter Mindestbestand",bSous:"Unter Minimum",dont:"davon {n} ausverkauft",sansPrix:"Bestellung bereit bei {f} {Lieferant|Lieferanten} \u00b7 Preise erg\u00e4nzen.",inconnus:"({n} Preise unbekannt)",tous:"alles gez\u00e4hlt"},nl:{bas:"{n} onder minimum",bSous:"Onder minimum",dont:"waarvan {n} op",sansPrix:"Bestelling klaar bij {f} leverancier{s} \u00b7 prijzen aanvullen.",inconnus:"({n} onbekende prijzen)",tous:"alles geteld"},pt:{bas:"{n} abaixo do m\u00ednimo",bSous:"Abaixo do m\u00ednimo",dont:"incl. {n} rotura{s}",sansPrix:"Encomenda pronta em {f} {fornecedor|fornecedores} \u00b7 pre\u00e7os a preencher.",inconnus:"({n} pre\u00e7o{s} desconhecido{s})",tous:"tudo contado"}};
  function L2(){var l="fr";try{l=(doc.documentElement.lang||"fr").slice(0,2).toLowerCase();}catch(e){}return C217[l]||C217.fr;}
  function tpl(s,v){return String(s).replace(/\{([^{}|]*)\|([^{}|]*)\}/g,function(m,a,b){return v&&v.s?b:a;}).replace(/\{(\w+)\}/g,function(m,k){return v[k]!=null?v[k]:m;});}/* C272 : {singulier|pluriel} */
  function fr(n){n=Math.round(Number(n)||0);var s=String(Math.abs(n)),o="";while(s.length>3){o="\u202f"+s.slice(-3)+o;s=s.slice(0,-3);}return (n<0?"\u2212":"")+s+o;}
  function eur(n){return fr(n)+"\u00a0\u20ac";}
  function q(n){return Math.round(Number(n)*10)/10;}
  function lire(){var out={ready:false,n:0,comptes:0,aCompter:0,cmd:0,unknownThresholds:0,ruptures:[],valeur:null,fournisseurs:null};
    try{var st=global.vInvStats();out.ready=Array.isArray(st.rows);out.n=(st.rows||[]).length;out.comptes=st.counted||0;out.aCompter=Math.max(0,out.n-out.comptes);out.cmd=st.orders||0;
      (st.rows||[]).forEach(function(r){var p=r.p||{};if(global.goalOf(p)===null||global.VerdictFinance.parseInput(p.min,{nonnegative:true}).state!=='known')out.unknownThresholds++;if(p.stock==null||String(p.stock).trim()===""||!Number.isFinite(Number(p.stock)))return;var stock=Number(p.stock),min=Number(p.min)||0;if(stock<=0||(min>0&&stock<min))out.ruptures.push({nom:p.name,stock:stock,min:min,unit:p.unit||"",vide:stock<=0});});
      out.ruptures.sort(function(a,b){return (a.vide===b.vide)?(a.min>0&&b.min>0?(a.stock/a.min)-(b.stock/b.min):0):(a.vide?-1:1);});}catch(e){}
    try{var pl=global.inventoryOrderPlanSummary();if(pl){out.valeur=pl.roundedValue!=null?pl.roundedValue:pl.rawValue;out.fournisseurs=pl.suppliers;if(pl.rows!=null)out.cmd=pl.rows;out.inconnus=Number(pl.unknownPrices)||0;}}catch(e){}
    /* C229 (X36) : sans le droit aux prix, l'équipe ne voit aucun montant de commande. */
    try{if(global.STAFF&&typeof global.staffCan==='function'&&!global.staffCan('view_prices'))out.valeur=null;}catch(e){}
    return out;}
  function etat(d){if(!d.ready||!d.n)return "info";var vides=d.ruptures.filter(function(r){return r.vide;}).length;if(vides>0)return "rouge";if(d.ruptures.length>0)return "orange";if(d.cmd>0||d.aCompter>0)return "jaune";if(d.unknownThresholds>0)return "info";return "vert";}
  function bouton(txt){var bs=doc.querySelectorAll("nav button, .dock button, .tabbar button, [role=tablist] button");for(var i=0;i<bs.length;i++){if((bs[i].textContent||"").toLowerCase().indexOf(txt)>=0)return bs[i];}return null;}
  function rendre(){var host=doc.getElementById("v-count");if(!host)return;var t=L(),d=lire(),sig=JSON.stringify([d,t]);
    var el=doc.getElementById("pinv");if(el&&el.getAttribute("data-sig")===sig)return;
    if(!el){el=doc.createElement("section");el.id="pinv";el.className="pinv";host.insertBefore(el,host.firstChild);}
    el.setAttribute("data-sig",sig);var e=etat(d);el.setAttribute("data-etat",e);
    var vides=d.ruptures.filter(function(r){return r.vide;}).length,parts=[];
    var t2=L2(),bas=d.ruptures.length-vides;if(vides)parts.push(tpl(t.rupt,{n:vides,s:vides>1?"s":""}));if(bas)parts.push(tpl(t2.bas,{n:bas,s:bas>1?"s":""}));if(d.cmd)parts.push(tpl(t.cmd,{n:d.cmd,s:d.cmd>1?"s":""}));if(d.aCompter)parts.push(tpl(t.compter,{n:d.aCompter,s:d.aCompter>1?"s":""}));
    if(d.unknownThresholds)parts.push(tpl(t.thresholds,{n:d.unknownThresholds}));
    var verdict=(!d.ready||!d.n)?t.empty:parts.length?parts.join(", ").replace(/, ([^,]*)$/,t.et+"$1")+".":t.rien;
    /* C217 W60/W66 : sans aucun prix connu, la commande n'est jamais chiffrée « 0 € » ; avec des prix manquants, on le dit. */
    var fS=(d.fournisseurs||0)>1?"s":"",inc=d.inconnus||0,cmdTxt=!d.cmd||d.valeur==null?"":(inc>=d.cmd?" "+tpl(t2.sansPrix,{f:d.fournisseurs||"",s:fS}):" "+(inc?tpl(t.cmdPrete,{v:eur(d.valeur),f:d.fournisseurs||"",s:fS}).replace(/\.$/,"")+" "+tpl(t2.inconnus,{n:inc,s:inc>1?"s":""})+".":tpl(t.cmdPrete,{v:eur(d.valeur),f:d.fournisseurs||"",s:fS})));
    var sous=tpl(t.suivis,{n:d.n})+(d.aCompter||!d.ready||!d.n?"":", "+t.tousComptes)+"."+cmdTxt;
    var h='<p class="pinv-k">'+t.kick+'</p><h2 class="pinv-q">'+t.q+'</h2><p class="pinv-v">'+verdict+'</p><p class="pinv-s">'+sous+'</p>';
    h+='<div class="pinv-g"><button type="button" class="pinv-b" data-act="compter"><b>'+d.aCompter+'</b><span>'+t.bCompter+'</span><small>'+(d.aCompter||!d.n?t.bCompterS:t2.tous)+'</small></button>';
    h+='<button type="button" class="pinv-b" data-act="commande" '+(d.cmd?"":"disabled")+'><b>'+d.cmd+'</b><span>'+t.bCmd+'</span><small>'+t.bCmdS+'</small></button>';
    h+='<button type="button" class="pinv-b pinv-r" data-act="ruptures" '+(d.ruptures.length?"":"disabled")+'><b>'+d.ruptures.length+'</b><span>'+(bas?t2.bSous:t.bRupt)+'</span><small>'+(bas&&vides?tpl(t2.dont,{n:vides,s:vides>1?"s":""}):t.bRuptS)+'</small></button></div>';
    if(d.ruptures.length){h+='<div class="pinv-l" id="pinvL" hidden><p class="pinv-k">'+t.prio+'</p>'+d.ruptures.slice(0,8).map(function(r){return '<div class="pinv-i" data-vide="'+r.vide+'"><span class="n">'+r.nom+'</span><span class="m">'+q(r.stock)+' '+r.unit+' '+t.stock+' \u00b7 '+t.min+' '+q(r.min)+'</span></div>';}).join("")+'</div>';}
    el.innerHTML=h;
    el.onclick=function(ev){var b=ev.target.closest("[data-act]");if(!b||b.disabled)return;var a=b.getAttribute("data-act");
      if(a==="compter"){var first=host.querySelector(".item, .row, [data-id]");if(first){var y=first.getBoundingClientRect().top+global.scrollY-96;global.scrollTo({top:Math.max(0,y),behavior:"smooth"});}}
      else if(a==="commande"){var bc=bouton("command")||bouton("order")||bouton("pedir")||bouton("bestell")||bouton("encomend")||bouton("ordin");if(bc)bc.click();}
      else if(a==="ruptures"){var l=doc.getElementById("pinvL");if(l){l.hidden=!l.hidden;b.setAttribute("aria-pressed",String(!l.hidden));}}};}
  var st=doc.createElement("style");st.textContent='.pinv{position:relative;margin:0 0 14px;background:#0F1216;border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:18px 18px 16px;box-shadow:inset 3px 0 0 var(--zc,#8A93A0),0 24px 44px -30px rgba(var(--zc-rgb,138,147,160),.8);background-image:radial-gradient(120% 80% at 0% 0%,rgba(var(--zc-rgb,138,147,160),.12),transparent 62%)}'
   +'.pinv[data-etat="vert"]{--zc:#22c55e;--zc-rgb:34,197,94}.pinv[data-etat="jaune"]{--zc:#eab308;--zc-rgb:234,179,8}.pinv[data-etat="orange"]{--zc:#f97316;--zc-rgb:249,115,22}.pinv[data-etat="rouge"]{--zc:#ef4444;--zc-rgb:239,68,68}'
   +'.pinv-k{margin:0 0 6px;font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:#8A93A0}.pinv-q{margin:0 0 6px;font-size:19px;font-weight:700;letter-spacing:-.01em;color:#E9ECF1}.pinv-v{margin:0 0 8px;font-size:26px;line-height:1.12;font-weight:800;letter-spacing:-.02em;color:var(--zc,#fff)}.pinv-s{margin:0;color:#B8BFC8;font-size:14.5px;line-height:1.5}'
   +'.pinv-g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.pinv-b{text-align:left;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:12px 10px 10px;color:#F4F6F8;font:inherit;cursor:pointer;min-width:0}.pinv-b b{display:block;font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1;color:var(--zc,#fff)}.pinv-b span{display:block;margin-top:5px;font-size:14px;font-weight:700}.pinv-b small{display:block;margin-top:2px;font-size:11.5px;color:#8A93A0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pinv-b[disabled]{opacity:.45;cursor:default}.pinv-b.pinv-r b{color:#ef4444}.pinv-b[aria-pressed="true"]{border-color:rgba(255,255,255,.35);background:rgba(255,255,255,.08)}'
   +'.pinv-l{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);display:grid;gap:8px}.pinv-i{display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:9px 12px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08)}.pinv-i .n{font-weight:700}.pinv-i .m{font-size:12.5px;color:#B8BFC8;text-align:right;white-space:nowrap}.pinv-i[data-vide="true"] .n{color:#ef4444}'
   +'@media(max-width:360px){.pinv-g{grid-template-columns:repeat(2,minmax(0,1fr))}.pinv-r{grid-column:1/-1}.pinv-b small{white-space:normal;overflow:visible}}';
  doc.head.appendChild(st);
  /* R75 : même logique d'atterrissage que Pilotage — au changement de vue (Compter, Commande, Analyse, Plus), la vue arrive en haut, juste sous l'en-tête, et reste calée */
  function tourActif(){try{if(doc.body&&doc.body.classList.contains('demo-tour-active'))return true;var k=[].slice.call(doc.querySelectorAll('*')).some(function(e){return e.children.length===0&&/CHAPITRE \d+ \/ \d+/i.test(e.textContent||'')&&e.getClientRects().length>0;});return k;}catch(e){return false;}}
  function caler(){try{if(tourActif())return;var on=null,vs=doc.querySelectorAll('[id^="v-"]');for(var i=0;i<vs.length;i++){if(global.getComputedStyle(vs[i]).display!=='none'){on=vs[i];break;}}if(!on)return;
    var hd=doc.querySelector('header'),pos=hd?global.getComputedStyle(hd).position:'',base=(hd&&(pos==='sticky'||pos==='fixed'))?Math.max(0,hd.getBoundingClientRect().bottom):0;
    var y=on.getBoundingClientRect().top+global.scrollY-base-8;global.scrollTo({top:Math.max(0,y),behavior:'auto'});}catch(e){}}
  (function(){function envelopper(){var o=global.go;if(typeof o!=="function"||o.__pinv)return;var w=function(){var r=o.apply(this,arguments);[40,220,600].forEach(function(ms){global.setTimeout(function(){if(!global.__pinvTouche)caler();},ms);});return r;};w.__pinv=true;global.go=w;}
    envelopper();global.addEventListener('load',envelopper);global.setTimeout(envelopper,1500);
    var tT=0;global.addEventListener('touchstart',function(){global.__pinvTouche=true;global.clearTimeout(tT);tT=global.setTimeout(function(){global.__pinvTouche=false;},1500);},{passive:true});
    doc.addEventListener('click',function(ev){if(ev.target&&ev.target.closest&&ev.target.closest('nav button'))global.__pinvTouche=false;},true);})();
  /* R91 · même prix partout : un prix intégré depuis une facture dans Verdict s'applique ici au produit de même nom (unité compatible) */
  function normP(x){return String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();}
  function typeP(u){u=normP(u);if(u==="kg"||u==="kilo")return "KG";if(u==="l"||u==="litre")return "L";if(/^(u|unite|piece|pce|p)$/.test(u))return "UNITE";return null;}
  global.__vdPrixSync=function(){var file=[];try{file=JSON.parse(global.localStorage.getItem("vd_prix_sync")||"[]");}catch(e){return 0;}if(!file.length)return 0;
    var D=global.DB;if(!D||!D.spaces)return 0;var n=0,reste=[];
    file.forEach(function(x){var fait=false;Object.keys(D.spaces).forEach(function(k){((D.spaces[k]||{}).products||[]).forEach(function(p){if(normP(p.name)!==normP(x.nom))return;var tp=typeP(p.unit);if(tp&&tp!==x.type)return;
        var ancien=Number(p.price)||0;if(Math.abs(ancien-x.prix)<0.00005){fait=true;return;}p.price=x.prix;fait=true;n++;
        D.priceHistory=D.priceHistory||[];D.priceHistory.push({date:new Date().toISOString(),site:D.site,space:k,product:p.id,name:p.name,from:ancien,to:x.prix,source:"facture"});});});
      if(!fait)reste.push(x);});
    if(D.priceHistory&&D.priceHistory.length>200)D.priceHistory=D.priceHistory.slice(-200);
    try{global.localStorage.setItem("vd_prix_sync",JSON.stringify(reste.slice(-200)));}catch(e){}
    if(n){try{global.save();}catch(e){}try{if(typeof global.drawProd==="function")global.drawProd();}catch(e){}planifier();}
    return n;};
  global.addEventListener("storage",function(ev){if(ev.key==="vd_prix_sync")global.__vdPrixSync();});
  global.setTimeout(function(){try{global.__vdPrixSync();}catch(e){}},1200);
  /* R95 · stock produit par produit vers Verdict : le résultat du comptage part avec ses lignes, et celles du comptage précédent */
  (function(){function lignes(){var out=[];try{global.siteRows(global.DB.site).forEach(function(x){var p=x.p;if(p.stock==null)return;out.push({nom:p.name,unite:p.unit||"",qte:Number(p.stock)||0,prix:global.px(p)});});}catch(e){}return out;}
    function env(){var oR=global.vdResultat,oE=global.vdEnvoyer;
      if(typeof oR==="function"&&!oR.__r95){var wR=function(){var r=oR.apply(this,arguments);if(!r)return r;try{var D=global.DB;D.vdLignesBySite=D.vdLignesBySite||{};var prev=D.vdLignesBySite[D.site];
          r.lignesFin=lignes();r.lignesDebut=prev?(prev.fp===r.fingerprint?prev.avant:prev.lignes):null;}catch(e){}return r;};wR.__r95=true;global.vdResultat=wR;}
      if(typeof oE==="function"&&!oE.__r95){var wE=function(){var res=oE.apply(this,arguments);try{var D=global.DB;if(!global.DEMO){var fp=global.countFingerprint(D.site);D.vdLignesBySite=D.vdLignesBySite||{};var prev=D.vdLignesBySite[D.site];
          if(!prev||prev.fp!==fp){D.vdLignesBySite[D.site]={fp:fp,lignes:lignes(),avant:prev?prev.lignes:null};try{global.save();}catch(e){}}}}catch(e){}return res;};wE.__r95=true;global.vdEnvoyer=wE;}}
    env();global.addEventListener("load",env);global.setTimeout(env,1500);})();
  var minut=null,dernier=0;function planifier(){if(minut)return;var d=tourActif()?Math.max(400,2000-(Date.now()-dernier)):220;minut=global.setTimeout(function(){minut=null;dernier=Date.now();try{rendre();}catch(e){}},d);}
  global.VerdictInventairePremium={version:"R74-1.0.0",rendre:rendre,lire:lire};
  if(global.MutationObserver&&doc.body)new MutationObserver(function(recs){for(var i=0;i<recs.length;i++){var t=recs[i].target;if(t&&t.closest&&t.closest("#pinv"))continue;planifier();return;}}).observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class","hidden"]});
  planifier();global.addEventListener("load",planifier);global.setTimeout(planifier,1500);
})(window);

