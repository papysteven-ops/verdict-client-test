/* C40 — Vera et la mémoire de la carte.
   1. Mémoire 5 ans : ventes par plat et par mois, anciens plats retirés (récupérables). Pour les dossiers fictifs ou
      simulés, la mémoire est reconstituée à partir de leur historique mensuel (tickets, mois fermés) ; pour un dossier
      réel, elle se construit mois après mois à partir des ventes saisies — jamais inventée.
   2. Prix fournisseurs : chaque plat, même retiré de la carte, garde un coût vivant ; une variation est signalée
      (centre de notifications) : plus rentable / moins rentable.
   3. Vera propose : un plat (prix visé, marge maximale, même période que l'an dernier, ou « Vera choisit »), ou une
      nouvelle carte cohérente (ingénierie de carte, saison, couloir de prix, concurrence saisie par le patron).
   Aucune donnée n'est envoyée : tout est calculé dans la page, avec le moteur Verdict (platCalc). */
(function(root){
'use strict';
var doc=root.document;if(!doc||root.VerdictVeraCarte)return;

/* ───────── Outils ───────── */
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function num(v){var n=typeof v==='number'?v:parseFloat(String(v==null?'':v).replace(/\s/g,'').replace(',','.'));return isFinite(n)?n:null;}
function money(v){v=num(v);return v==null?'—':v.toLocaleString(tag(),{minimumFractionDigits:2,maximumFractionDigits:2})+' €';}
function pct(v,d){v=num(v);return v==null?'—':v.toLocaleString(tag(),{maximumFractionDigits:d==null?1:d})+' %';}
function int(v){v=num(v);return v==null?'—':Math.round(v).toLocaleString(tag());}
function DB(){return root.DB||null;}
function hash(s){s=String(s);var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){var x=hash(seed)||1;return function(){x^=x<<13;x>>>=0;x^=x>>17;x^=x<<5;x>>>=0;return (x%100000)/100000;};}
function norm(k){return String(k||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();}
/* Ordre de service universel (même table que la page Carte, disponible avant son ouverture). */
var RANKS=[[/petit.?dejeuner|breakfast|brunch/,0],[/supplement|extra|option|topping/,11],[/alcool|vin|biere|cocktail|spiritueux|champagne/,10],[/boisson|^bar$|cafe|salon de the|the |soft|jus|smoothie/,9],[/dessert|patisserie|viennoiserie|glace|gourmandise|sucre/,8],[/fromage/,7],[/accompagnement|friture|frite|side|garniture/,6],[/menu|formule/,5],[/entree|starter|a partager|tapas|aperitif|amuse/,1],[/salade/,2],[/plat du jour|plats du jour|suggestion/,3],[/plat|a la carte|bowl|burger|pizza|pate|tacos|taco|sandwich|wrap|assiette|fruits de mer|poisson|viande|grill|room service|snack|pain|poke|kebab|sushi|wok|tartine|croque|quiche|galette|street/,4]];
function ownRank(k){var n=norm(k);for(var i=0;i<RANKS.length;i++)if(RANKS[i][0].test(n))return RANKS[i][1];return 12;}
if(typeof root.VerdictCourseRank!=='function')root.VerdictCourseRank=ownRank;
function courseRank(c){try{if(typeof root.VerdictCourseRank==='function')return root.VerdictCourseRank(c);}catch(e){}return ownRank(c);}
function calc(p){try{return root.platCalc(p)||{};}catch(e){return {};}}
function vat(p){var d=DB(),t=num(p&&p.tva);if(t==null)t=num(d&&d.in&&d.in.tva);return t==null?10:t;}
function ht(ttc,p){return num(ttc)/(1+vat(p)/100);}
function marginAt(p,ttc){var k=calc(p),c=num(k.cout);if(c==null||!(num(ttc)>0))return null;var h=ht(ttc,p);return {contrib:h-c,pct:(h-c)/h*100,cost:c};}
function median(a){a=a.filter(function(x){return x!=null&&isFinite(x);}).sort(function(x,y){return x-y;});if(!a.length)return null;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function round05(v){return Math.round(v*2)/2;}
function today(){var t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0');}
function monthOf(per){return Number(String(per).slice(5,7));}
function yearOf(per){return Number(String(per).slice(0,4));}
function addMonth(per,n){var y=yearOf(per),m=monthOf(per)-1+n;y+=Math.floor(m/12);m=((m%12)+12)%12;return y+'-'+String(m+1).padStart(2,'0');}
function currentPeriod(){var d=DB();var p=d&&d.carteRef&&d.carteRef.periode;return /^\d{4}-\d{2}$/.test(p||'')?p:today();}
function active(p){return p&&!p.cpArchived;}
var MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
/* Nombres et mois au format de la langue choisie — langues-complements (16/10). */
function tag(){try{return typeof root.localeTag==='function'?root.localeTag():(root.LOCALE_TAG||'fr-FR');}catch(e){return 'fr-FR';}}
function moisLocal(i){try{if(root.LOCALE&&root.LOCALE!=='fr')return new Intl.DateTimeFormat(tag(),{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2020,i,15)));}catch(e){}return MONTHS[i];}
function monthName(m){return moisLocal((m-1+12)%12);}
/* C104 — la saison se lit sur le calendrier réel (mois en cours puis mois suivant), pas sur le mois de référence des ventes. */
function moisReel(){try{if(root.VerdictSaison)return root.VerdictSaison.moisReel();}catch(e){}return new Date().getMonth()+1;}
function phraseSaison(m){try{if(root.VerdictSaison)return root.VerdictSaison.phraseSaison(m);}catch(e){}return monthName(m)+' est en moyenne à '+TEMP[m-1]+'\u00a0°C';}

/* ───────── Saison et « météo de saison » : normales mensuelles françaises (°C), sans appel réseau ───────── */
var TEMP=[5,6,9,12,15,19,21,21,17,13,8,5];
var COLD=/salade|glace|sorbet|tartare|carpaccio|poke|gaspacho|ceviche|smoothie|citronnade|limonade|rose|spritz|fruits de mer|huitre|bowl froid|tataki|granite|frappe|ete|iced|cold/;
var HOT=/soupe|veloute|gratin|raclette|fondue|bourguignon|blanquette|pot.au.feu|chocolat chaud|mijote|curry|tajine|cassoulet|choucroute|chili|ramen|pho|potee|hiver|vin chaud|risotto|lasagne|confit|daube|truffade|tartiflette/;
function warmth(p){if(p&&typeof p.cpWarmth==='number')return p.cpWarmth;var n=norm((p&&p.nom)+' '+(p&&p.cat));return COLD.test(n)?1:HOT.test(n)?-1:0;}
function seasonFactor(p,m){var w=warmth(p);if(!w)return 1;var t=TEMP[(m-1+12)%12];return Math.max(.55,Math.min(1.45,1+.28*w*(t-13)/8));}
function seasonFit(p,m){var w=warmth(p);if(!w)return 0;return w*(TEMP[(m-1+12)%12]-13)/8;}

/* ───────── 1. Mémoire de la carte ───────── */
function isSimulated(d){
  if(!d)return false;
  if(d.persoHistory5y&&d.persoHistory5y.fictional)return true;
  if(d._demo&&d._demo.fictional)return true;
  if(d.dataProvenance&&/simulation|demo|illustrative/.test(String(d.dataProvenance.verificationLevel||'')+String(d.dataProvenance.confidence||'')))return true;
  var mh=d.monthlyHistory||[];return mh.length>0&&mh.every(function(m){return m&&m.fictional===true;});
}
function months(d){return (d.monthlyHistory||[]).filter(function(m){/* « closed » = mois clôturé en comptabilité, pas établissement fermé. */return m&&/^\d{4}-\d{2}$/.test(m.period||'')&&!m.seasonClosed&&m.openDays!==0&&num(m.tickets)>0;}).sort(function(a,b){return a.period.localeCompare(b.period);});}
/* Anciennes versions de plats : variantes saisonnières de plats existants, servies certaines années, retirées depuis. */
function memoryDishes(d,r,first,last){
  var pool=(d.plats||[]).filter(function(p){var k=courseRank(p.cat);return active(p)&&[1,2,3,4,8].indexOf(k)>=0&&num(p.ttc)>0&&((p.rec||[]).length||(p.preps||[]).length);});
  pool.sort(function(a,b){return (num(b.vol)||0)-(num(a.vol)||0)||String(a.id).localeCompare(String(b.id));});
  var out=[],y0=yearOf(first),y1=yearOf(last)-1,n=Math.min(4,pool.length);
  for(var i=0;i<n;i++){
    var src=pool[i],summer=i%2===0,years=[];
    for(var y=y0;y<=y1;y++)if(r()<.55||years.length<1&&y===y1)years.push(y);
    var rec=JSON.parse(JSON.stringify(src.rec||[]));if(rec[0]&&num(rec[0][1])!=null)rec[0][1]=Math.round(num(rec[0][1])*(summer?.9:1.1)*100)/100;
    var lastY=years[years.length-1],endM=summer?8:2;
    out.push({id:'mem-'+hash(d.etab+src.id+i).toString(36),nom:src.nom+(summer?' · recette d’été':' · recette d’hiver'),cat:src.cat,ttc:Math.max(1,round05((num(src.ttc)||10)-.5)),tva:src.tva,rec:rec,preps:JSON.parse(JSON.stringify(src.preps||[])),pf:src.pf,pfttc:src.pfttc,pfshare:src.pfshare,vol:null,
      cpArchived:true,cpMemory:true,cpOrigin:src.id,cpWarmth:summer?1:-1,cpSeason:summer?'été':'hiver',cpYears:years,cpArchivedAt:(summer?lastY:lastY+1)+'-'+String(endM).padStart(2,'0')+'-28'});
  }
  return out;
}
function ensureMemory(d){
  d=d||DB();if(!d||!(d.plats||[]).length)return null;
  if(d.cpDishHistory&&d.cpDishHistory.v===1&&(d.cpDishHistory.generated===false||d.cpDishHistory.sig===memSig(d)))return d.cpDishHistory;
  if(!isSimulated(d)){d.cpDishHistory=d.cpDishHistory&&d.cpDishHistory.generated===false?d.cpDishHistory:{v:1,generated:false,months:{}};accrue(d);return d.cpDishHistory;}
  var M=months(d);if(M.length<6)return null;
  var r=rng('vera-mem-'+(d.etab||'')+'-'+(d.plats||[]).length),first=M[0].period,last=M[M.length-1].period;
  var mem=memoryDishes(d,r,first,last);
  var act=(d.plats||[]).filter(active),vols=act.map(function(p){return num(p.vol);}).filter(function(v){return v>0;}),medV=median(vols)||10;
  var intro={};act.forEach(function(p,i){intro[p.id]=(hash(p.id+d.etab)%3===0)?addMonth(last,-(6+hash(p.id)%24)):first;});
  var ref=(d.carteRef&&d.carteRef.periode)||last,refM=M.filter(function(m){return m.period===ref;})[0]||M[M.length-1];
  var sumV=act.reduce(function(s,p){return s+(num(p.vol)||0);},0),ipt=sumV>0&&num(refM.tickets)>0?Math.max(.6,Math.min(3.2,sumV/num(refM.tickets))):1.5;
  var H={};
  M.forEach(function(m){
    var mo=monthOf(m.period),y=yearOf(m.period),list=[];
    act.forEach(function(p){if(m.period>=intro[p.id])list.push({p:p,w:(num(p.vol)>0?num(p.vol):medV)*seasonFactor(p,mo)});});
    mem.forEach(function(p){var inSeason=p.cpSeason==='été'?(mo>=5&&mo<=8):(mo>=11||mo<=2);var yr=p.cpSeason==='hiver'&&mo<=2?y-1:y;if(inSeason&&p.cpYears.indexOf(yr)>=0)list.push({p:p,w:medV*.9*seasonFactor(p,mo)});});
    var tot=list.reduce(function(s,x){return s+x.w;},0),items=num(m.tickets)*ipt,row={};
    list.forEach(function(x){var q=Math.round(items*x.w/tot*(.86+r()*.28));if(q>0)row[x.p.id]=q;});
    H[m.period]=row;
  });
  d.cpMemoryDishes=mem;
  d.cpDishHistory={v:1,generated:true,fictional:true,sig:memSig(d),from:first,to:last,months:H,note:'Mémoire reconstituée à partir de l’historique mensuel fictif du dossier (tickets, mois fermés, saisons). Jamais un relevé de caisse.'};
  return d.cpDishHistory;
}
function memSig(d){return hash((d.etab||'')+'|'+(d.plats||[]).filter(active).map(function(p){return p.id+':'+(p.vol||'');}).join(',')+'|'+(d.monthlyHistory||[]).length).toString(36);}
/* Dossier réel : la mémoire se remplit avec les ventes réellement saisies, mois par mois. */
function accrue(d){
  var H=d.cpDishHistory;if(!H||H.generated!==false)return;var per=currentPeriod(),row=H.months[per]||{},changed=false;
  (d.plats||[]).forEach(function(p){var v=num(p.vol);if(v!=null&&v>=0&&row[p.id]!==v){row[p.id]=v;changed=true;}});
  if(changed)H.months[per]=row;
}
function allDishes(d){d=d||DB();return (d.plats||[]).concat(d.cpMemoryDishes||[]);}
function dishById(id){return allDishes().filter(function(p){return p.id===id;})[0]||null;}
/* Ventes d'un plat sur des mois donnés (moyenne par année où il a été vendu). */
function qtyOn(p,monthsWanted,yearsBack){
  var H=ensureMemory(),now=currentPeriod();if(!H)return {avg:0,total:0,years:[]};
  var total=0,byY={};Object.keys(H.months).forEach(function(per){if(per>=now)return;var m=monthOf(per);if(monthsWanted.indexOf(m)<0)return;if(yearsBack&&yearOf(now)-yearOf(per)>yearsBack)return;var q=H.months[per][p.id]||0;if(q){total+=q;var y=yearOf(per)-(m<monthsWanted[0]&&monthsWanted[0]>6?-1:0);byY[y]=(byY[y]||0)+q;}});
  var ys=Object.keys(byY);return {avg:ys.length?total/ys.length:0,total:total,years:ys.map(Number).sort(),best:ys.length?Math.max.apply(null,ys.map(function(y){return byY[y];})):0};
}
function last12(p){var H=ensureMemory(),now=currentPeriod();if(!H)return 0;var s=0;for(var i=1;i<=12;i++){var per=addMonth(now,-i);s+=(H.months[per]||{})[p.id]||0;}
  /* C258 (T1 N5c) : dossier réel — la caisse donne la moyenne par mois sur n mois ; tant que la mémoire n'a pas ces mois, les ventes des 12 derniers mois sont celles de la caisse (1 581 cafés gourmands, jamais 0). */
  var d=DB(),mo=d&&d.carteRef&&d.carteRef.moyenne,v=num(p&&p.vol);if(H.generated===false&&mo&&num(mo.mois)>0&&v>0){var c=Math.round(v*Math.min(12,num(mo.mois)));if(c>s)s=c;}
  return s;}
function bestSellers(year,monthsWanted,n){
  var H=ensureMemory(),now=currentPeriod();if(!H)return [];var acc={};Object.keys(H.months).forEach(function(per){if(yearOf(per)!==year||per>=now)return;if(monthsWanted&&monthsWanted.indexOf(monthOf(per))<0)return;var row=H.months[per];Object.keys(row).forEach(function(id){acc[id]=(acc[id]||0)+row[id];});});
  return Object.keys(acc).map(function(id){var p=dishById(id);if(!p||[1,2,3,4,5,8].indexOf(courseRank(p.cat))<0)return null;var k=calc(p);return {p:p,q:acc[id],contrib:num(k.contribPond)!=null?acc[id]*num(k.contribPond):null};}).filter(Boolean).sort(function(a,b){return b.q-a.q;}).slice(0,n||5);
}

/* ───────── 2. Prix fournisseurs : coût vivant + alertes ───────── */
var watchTimer=0;
function costSnapshot(){var o={};allDishes().forEach(function(p){var k=calc(p),c=num(k.cout);if(c!=null&&k.recetteComplete!==false)o[p.id]={c:Math.round(c*1000)/1000,m:num(k.margePct)};});return o;}
function watchCosts(silent){
  var d=DB();if(!d)return [];ensureMemory(d);
  var now=costSnapshot(),base=d.cpCostWatch&&d.cpCostWatch.items,changes=[];
  if(base){Object.keys(now).forEach(function(id){var a=base[id],b=now[id];if(!a||a.c==null)return;var dc=b.c-a.c;if(Math.abs(dc)>=.01&&Math.abs(dc)/Math.max(.01,a.c)>=.01){var p=dishById(id);if(p)changes.push({id:id,nom:p.nom,retired:!!p.cpArchived,before:a.c,after:b.c,mBefore:a.m,mAfter:b.m,better:dc<0});}});}
  d.cpCostWatch={v:1,at:new Date().toISOString(),items:now};
  if(changes.length){
    d.cpCostLog=(d.cpCostLog||[]).concat([{at:new Date().toISOString(),changes:changes.slice(0,40)}]).slice(-50);
    if(!silent)notifyCosts(changes);
  }
  return changes;
}
function notifyCosts(changes){
  var worse=changes.filter(function(c){return !c.better;}),better=changes.filter(function(c){return c.better;}),d=DB();
  var ex=changes.slice().sort(function(a,b){return Math.abs(b.after-b.before)-Math.abs(a.after-a.before);})[0];
  var title='Prix fournisseurs : '+changes.length+' plat'+(changes.length>1?'s changent':' change');
  var detail=(worse.length?worse.length+' moins rentable'+(worse.length>1?'s':''):'')+(worse.length&&better.length?' · ':'')+(better.length?better.length+' plus rentable'+(better.length>1?'s':''):'')+
    (ex?' · '+ex.nom+(ex.retired?' (retiré de la carte)':'')+' : '+(ex.after>ex.before?'+':'−')+money(Math.abs(ex.after-ex.before))+' / portion'+(ex.mBefore!=null&&ex.mAfter!=null?', marge '+pct(ex.mBefore,0)+' → '+pct(ex.mAfter,0):''):'');
  try{var sh=root.parent&&root.parent!==root&&root.parent.VerdictUnifiedShell;if(sh&&sh.notifications&&sh.notifications.ingestMany)sh.notifications.ingestMany([{id:'vera-prix-'+Date.now(),source:'Vera',module:'verdict',level:worse.length?'warning':'success',establishmentId:String(root.STORE&&root.STORE.actif||''),establishmentName:String(d&&d.etab||''),title:title,detail:detail,proof:'Coût matière recalculé avec les derniers prix fournisseurs, plats retirés compris.',createdAt:new Date().toISOString()}]);}catch(e){}
  try{if(typeof root.toast==='function')root.toast(title);}catch(e){}
}
function scheduleWatch(){clearTimeout(watchTimer);watchTimer=setTimeout(function(){try{watchCosts(false);}catch(e){}},1500);}

/* ───────── 3. Vera propose ───────── */
function catsOf(){var d=DB(),a=[];(d.plats||[]).forEach(function(p){var c=p.cat||'Autre';if(a.indexOf(c)<0)a.push(c);});return a.sort(function(x,y){return courseRank(x)-courseRank(y)||x.localeCompare(y,'fr');});}
function corridor(cat){var prices=(DB().plats||[]).filter(function(p){return active(p)&&p.cat===cat;}).map(function(p){return num(p.ttc);}).filter(function(v){return v>0;}).sort(function(a,b){return a-b;});if(!prices.length)return null;return {min:prices[0],max:prices[prices.length-1],med:median(prices),n:prices.length};}
function ingUsage(){var u={};(DB().plats||[]).filter(active).forEach(function(p){(p.rec||[]).forEach(function(r){var k=norm(r[0]);u[k]=(u[k]||0)+1;});});return u;}
function sharedShare(p){var u=ingUsage(),rec=p.rec||[];if(!rec.length)return 0;var s=0;rec.forEach(function(r){if((u[norm(r[0])]||0)>=1)s++;});return s/rec.length;}
/* C88 : même objectif que la fiche plat (objectif par famille, sinon réglage, sinon 75 %), jamais un 70 % propre à Vera. */
function objective(p){var d=DB();try{if(p&&root.VerdictControls&&typeof root.VerdictControls.target==='function'){var t=num(root.VerdictControls.target(d,p,'onsite'));if(t!=null&&t>0)return t;}}catch(e){}var o=num(d&&d.reg&&d.reg.objp);return o==null?75:o;}
/* Nouveauté cohérente : la recette du meilleur plat de la catégorie, un ingrédient secondaire remplacé par un
   ingrédient déjà utilisé ailleurs dans la maison (zéro nouvel achat), en accord avec la saison. */
function newCreation(cat,m,priceTarget){
  var d=DB();if([1,2,3,4,8].indexOf(courseRank(cat))<0)return null;var inCat=(d.plats||[]).filter(function(p){return active(p)&&p.cat===cat&&(p.rec||[]).length>=2;});if(!inCat.length)return null;
  inCat.sort(function(a,b){return (num(b.vol)||0)-(num(a.vol)||0);});var base=inCat[0],inRec={};(base.rec||[]).forEach(function(r){inRec[norm(r[0])]=1;});
  var u=ingUsage(),t=TEMP[(m-1)%12],want=t>=16?1:t<=9?-1:0;
  /* L’ingrédient ajouté vient d’autres plats de la même catégorie : un dessert reste un dessert. */
  var sameCat={};(d.plats||[]).filter(function(p){return active(p)&&p.cat===cat&&p!==base;}).forEach(function(p){(p.rec||[]).forEach(function(r){sameCat[norm(r[0])]=1;});});
  var cand=(d.ing||[]).filter(function(g){return !inRec[norm(g.nom)]&&sameCat[norm(g.nom)]&&num(g.prix)>0&&!/emballage|barquette|sac|boite|gobelet|couvercle|serviette|sel|poivre|huile|vinaigre|sucre|farine|eau/i.test(g.nom);});
  cand.sort(function(a,b){var wa=COLD.test(norm(a.nom))?1:HOT.test(norm(a.nom))?-1:0,wb=COLD.test(norm(b.nom))?1:HOT.test(norm(b.nom))?-1:0;return (wb===want)-(wa===want)||(u[norm(b.nom)]||0)-(u[norm(a.nom)]||0)||String(a.nom).localeCompare(b.nom);});
  var twist=cand[0];if(!twist)return null;
  var rec=JSON.parse(JSON.stringify(base.rec)),swap=rec.length-1,qty=num(rec[swap][1])||40;rec[swap]=[twist.nom,qty];
  var p={id:'vera-new-'+hash(cat+twist.nom+m).toString(36),nom:String(base.nom).split(/[·(]/)[0].trim()+' · '+String(twist.nom).toLowerCase().split(/[,(]/)[0].replace(/\b\d+([.,]\d+)?\s*(%|cl|ml|l|kg|g|cm|mm)?(?=\s|$)/g,'').replace(/\s+/g,' ').trim(),cat:cat,tva:base.tva,rec:rec,preps:JSON.parse(JSON.stringify(base.preps||[])),pf:base.pf,pfttc:base.pfttc,pfshare:base.pfshare,vol:null,cpVeraNew:true,cpBase:base.id,cpTwist:twist.nom,cpWarmth:COLD.test(norm(twist.nom))?1:HOT.test(norm(twist.nom))?-1:warmth(base)};
  var co=corridor(cat),k=calc(Object.assign({},p,{ttc:num(base.ttc)||10})),c=num(k.cout)||0;
  var target=priceTarget||null;
  if(!target){var needHT=c/(1-objective(base)/100);target=Math.max(co?co.med:num(base.ttc)||10,round05(needHT*(1+vat(p)/100)+.25));if(co)target=Math.min(target,round05(co.max*1.05));target=dansLaCarte(p,cat,target);p.ttc=Math.round(target*10)/10;if(!coutAuPrix(p,p.ttc))return null;return p;}
  p.ttc=round05(target);return p;
}
/* C268 (Steven, 22/10 : « 37 € c'est trop cher ») — une nouveauté reste dans les prix de la carte : au plus le plat le plus
   cher de sa catégorie, et proche du plat équivalent (même produit principal) : son prix, +10 % au plus. Si l'objectif de
   marge ne tient pas à ce prix, Vera agit sur le coût (portion du produit principal, −25 % au plus) et le dit ; sinon la
   nouveauté n'est pas proposée. Jamais un prix hors carte, jamais « vendez plus ». */
function lignePrincipale(n){var d=DB(),best=null;(n.rec||[]).forEach(function(l,i){var g=(d.ing||[]).filter(function(x){return x&&norm(x.nom)===norm(l[0]);})[0];if(!g)return;var q=num(l[1])||0,u=String(g.type||'KG').toUpperCase(),pe=num(g.perte)||0,c=(u==='UNITE'?num(g.prix):num(g.prix)/1000)*q/(1-Math.min(pe,90)/100);if(c>0&&(!best||c>best.c))best={i:i,nom:l[0],c:c,u:u};});return best;}
function equivalent(n,cat){var L=lignePrincipale(n);if(!L)return null;var k=norm(L.nom),eq=null;(DB().plats||[]).forEach(function(p){if(!active(p)||p===n||p.cat!==cat||!(num(p.ttc)>0))return;if((p.rec||[]).some(function(r){return norm(r[0])===k;})&&(!eq||(num(p.vol)||0)>(num(eq.vol)||0)))eq=p;});return eq;}
function dansLaCarte(n,cat,target){var co=corridor(cat),eq=equivalent(n,cat),hi=co?co.max:null;
  if(eq){var e=num(eq.ttc),near=Math.max(e,Math.floor(e*1.10*2+1e-9)/2);hi=hi?Math.min(hi,near):near;target=Math.max(target,e);}
  if(hi)target=Math.min(target,hi);n.cpCarte={max:co?co.max:null,eq:eq?{nom:eq.nom,ttc:num(eq.ttc)}:null};return target;}
function coutAuPrix(n,price){var obj=objective(n),mg=marginAt(n,price);if(!mg||mg.pct>=obj)return true;var L=lignePrincipale(n);if(!L||L.u==='UNITE')return false;
  var q0=num(n.rec[L.i][1]);for(var f=.95;f>.74;f=Math.round((f-.05)*100)/100){n.rec[L.i][1]=Math.max(5,Math.round(q0*f/5)*5);var m2=marginAt(n,price);if(m2&&m2.pct>=obj){n.cpCoutCorrige={nom:L.nom,de:q0,a:n.rec[L.i][1],u:L.u==='L'?'ml':'g'};return true;}}
  n.rec[L.i][1]=q0;return false;}
/* C104 — prix d'une nouveauté : coût matière + objectif de marge, dans le couloir des autres plats de la catégorie ; sans coût
   complet (un ingrédient à acheter), le milieu du couloir, sinon la fourchette du gabarit. */
function prixSaison(n,cat,priceTarget){
  if(priceTarget){n.ttc=round05(priceTarget);return;}
  var co=corridor(cat),k=calc(Object.assign({},n,{ttc:10})),c=num(k.cout),complet=k.recetteComplete!==false&&c!=null&&c>0,ref=n.cpVeraSaison&&n.cpVeraSaison.prix||null,target;
  if(complet){var needHT=c/(1-objective(n)/100);target=round05(needHT*(1+vat(n)/100)+.25);if(co)target=Math.max(target,co.min);if(ref)target=Math.max(target,ref[0]);}
  else target=co?co.med:(ref?(ref[0]+ref[1])/2:12);
  if(co)target=Math.min(target,round05(co.max*1.05));if(ref)target=Math.min(Math.max(target,ref[0]),ref[1]*1.15);
  target=dansLaCarte(n,cat,target);
  n.ttc=Math.round(target*10)/10;
}
function candidates(cat,o){
  var d=DB(),m=moisReel(),mm=o.samePeriod?[m,(m%12)+1]:null,list=[];
  allDishes().filter(function(p){return p.cat===cat&&(num(p.ttc)>0||o.price);}).forEach(function(p){
    var hist=mm?qtyOn(p,mm,3):{avg:last12(p),years:[]},k=calc(p),price=o.price||num(p.ttc),mg=marginAt(p,price);
    list.push({p:p,origin:p.cpMemory||p.cpArchived?'memory':'active',qty:hist.avg,years:hist.years||[],price:price,margin:mg,shared:sharedShare(p),fit:seasonFit(p,m),k:k});
  });
  /* C104 — nouveautés : de vrais plats complets, de saison, composés avec ce que la maison achète ; deux si le mois
     suivant change de climat (« maintenant » et « quand il fera froid / chaud »). */
  var nouveaux=[];try{if(root.VerdictSaison)nouveaux=root.VerdictSaison.composer({db:d,cat:cat,rang:courseRank(cat),mois:m,tva:num(d&&d.reg&&d.reg.tvac)});}catch(e){nouveaux=[];}
  /* C282 (T1 vague 11, N2) : plus de « nouveauté cohérente » fabriquée à partir d'un plat de la carte (« Œuf mayo · beurre » :
     le même plat avec du beurre, au même prix). Une variante d'un plat existant n'est pas une nouveauté : sans vrai plat
     de saison composé avec vos produits, Vera ne propose pas de nouveauté. */
  /* C258 (T1 N5d) : un produit déjà servi dans un plat de la carte garde la quantité de sa fiche (celle du plat le plus vendu) : le coût d'une nouveauté reste cohérent avec la fiche du même plat. */
  nouveaux.forEach(function(n){(n.rec||[]).forEach(function(l){var k=norm(l[0]),best=null;(d.plats||[]).forEach(function(p){if(!active(p)||p.cat!==cat)return;(p.rec||[]).forEach(function(r){if(norm(r[0])===k&&num(r[1])>0&&(!best||(num(p.vol)||0)>(num(best.p.vol)||0)))best={p:p,q:num(r[1])};});});if(best)l[1]=best.q;});});
  nouveaux.forEach(function(n){prixSaison(n,cat,o.price);if(!o.price&&!n.cpCoutCorrige&&!coutAuPrix(n,n.ttc))return;var pr=o.price||n.ttc,mg=marginAt(n,pr);
    /* une nouveauté dont le coût matière dépasse l'objectif de loin n'est pas proposée : Vera ne vend pas de rêve */
    if(mg&&mg.pct!=null&&mg.pct<Math.max(35,objective(n)-25))return;
    list.push({p:n,origin:'new',qty:null,years:[],price:pr,margin:mg,shared:sharedShare(n),fit:seasonFit(n,m),k:calc(n)});});
  var qs=list.map(function(x){return x.qty||0;}),qMax=Math.max.apply(null,qs.concat([1])),cs=list.map(function(x){return x.margin?x.margin.contrib:0;}),cMax=Math.max.apply(null,cs.concat([.01]));
  var co=corridor(cat);
  list.forEach(function(x){
    var pop=(x.qty||0)/qMax,con=x.margin?Math.max(0,x.margin.contrib)/cMax:0,mp=x.margin?x.margin.pct:0,priceGap=o.price&&num(x.p.ttc)?Math.abs(num(x.p.ttc)-o.price)/o.price:0;
    var s;if(o.vera)s=.32*pop+.28*con+.14*Math.max(-1,Math.min(1,x.fit))+.12*x.shared+.08*(x.origin==='memory'?1:x.origin==='new'?.7:0)+.06*(mp>=objective(x.p)?1:0);
    else if(o.maxMargin)s=.65*(mp/100)+.25*con+.10*pop;
    else s=.45*pop+.45*con+.10*x.shared;
    if(x.origin==='new'&&!o.vera&&o.samePeriod)s*=.85;
    s-=.35*priceGap;if(x.margin&&x.margin.pct<0)s-=.5;
    x.score=s;
    var why=[];
    if(x.qty&&mm)why.push('Même période les années passées : '+int(x.qty)+' ventes en moyenne en '+monthName(mm[0])+'–'+monthName(mm[1])+(x.years.length?' ('+x.years.join(', ')+')':''));
    else if(x.qty)why.push(int(x.qty)+' ventes sur les 12 derniers mois');
    if(x.origin==='new'&&x.p.cpVeraSaison){var vs=x.p.cpVeraSaison;
      why.push((vs.quand==='suivant'?'Pour '+monthName(vs.mois)+', quand il fera '+(vs.climat==='froid'?'froid':vs.climat==='chaud'?'chaud':'plus doux')+' : ':'Nouveauté de saison : ')+'plat complet composé avec vos produits — '+vs.avec.slice(0,6).join(', ')+(vs.manque.length?' · à acheter : '+vs.manque.join(', '):' · aucun nouvel achat'));}
    else if(x.origin==='new')why.push('Nouveauté cohérente : recette de « '+(dishById(x.p.cpBase)||{}).nom+' », '+String(x.p.cpTwist).toLowerCase()+' déjà acheté pour d’autres plats (zéro nouvel achat)');
    /* C282 (R1) : tant qu'un ingrédient manque, le coût est incomplet : la marge est dite provisoire, jamais « objectif atteint ». */
    var manq=x.p.cpVeraSaison&&x.p.cpVeraSaison.manque&&x.p.cpVeraSaison.manque.length?x.p.cpVeraSaison.manque:null,sansPiece=x.p.cpVeraSaison&&x.p.cpVeraSaison.principalManque;
    /* C289 (R3) : sans le produit principal, aucune marge — seulement ce qui manque pour la calculer */
    if(sansPiece)why.push('Il manque '+(/^[aeiouyéèêh]/i.test(sansPiece)?'l’':'le ')+sansPiece+' pour calculer la marge : indiquez son prix (facture ou catalogue) et Vera la calcule.');
    else if(x.margin&&manq)why.push('Coût incomplet : il manque '+manq.join(', ')+'. À '+money(x.price)+', marge provisoire de '+pct(x.margin.pct,0)+', à confirmer quand '+(manq.length>1?'leurs prix seront connus':'son prix sera connu'));
    else if(x.margin)why.push('À '+money(x.price)+' : '+money(x.margin.contrib)+' de contribution par vente, marge matière '+pct(x.margin.pct,0)+(x.margin.pct>=objective(x.p)?' (objectif '+pct(objective(x.p),0)+' atteint)':' (sous l’objectif '+pct(objective(x.p),0)+')'));
    var wm=warmth(x.p);
    if(x.origin==='new'&&x.p.cpCarte&&x.p.cpCarte.eq&&!o.price)why.push('Prix au niveau de votre « '+x.p.cpCarte.eq.nom+' » ('+money(x.p.cpCarte.eq.ttc)+')'+(x.p.cpCoutCorrige?' : pour tenir l’objectif à ce prix, '+x.p.cpCoutCorrige.nom+' '+int(x.p.cpCoutCorrige.a)+' '+x.p.cpCoutCorrige.u+' au lieu de '+int(x.p.cpCoutCorrige.de)+' '+x.p.cpCoutCorrige.u:''));
    else if(x.origin==='new'&&x.p.cpCoutCorrige&&!o.price)why.push('Pour tenir l’objectif au prix de vos autres plats : '+x.p.cpCoutCorrige.nom+' '+int(x.p.cpCoutCorrige.a)+' '+x.p.cpCoutCorrige.u+' au lieu de '+int(x.p.cpCoutCorrige.de)+' '+x.p.cpCoutCorrige.u);
    if(x.origin==='new'&&x.p.cpVeraSaison)why.push('Saison : '+phraseSaison(m));
    else if(x.fit>.4)why.push('De saison : '+phraseSaison(m)+(wm>0?' — ce plat se vend mieux quand il fait bon':' — plat réconfortant'));
    else if(x.fit<-.4)why.push('Hors saison : '+(wm>0?'plat d\u2019été':'plat d\u2019hiver')+' — '+phraseSaison(m));
    if(x.shared>=.75&&x.origin!=='new')why.push('Ingrédients déjà utilisés par la carte : moins de gaspillage');
    if(co&&num(x.price)>co.max*1.1)why.push('Prix au-dessus de vos autres '+String(cat).toLowerCase()+' (jusqu’à '+money(co.max)+')');
    if(o.competitor&&num(x.price)>o.competitor*1.12)why.push('Plus cher que la concurrence ('+money(o.competitor)+' en moyenne)');
    x.why=why;
  });
  return list.sort(function(a,b){return b.score-a.score;});
}
function proposeDish(o){o=o||{};var cat=o.cat||catsOf()[0];var list=candidates(cat,o);
  /* C258 (T1 N5a) : Vera ne met jamais en avant un plat de la carte sous l'objectif ; il se corrige dans Décisions, pas ici. */
  list=list.filter(function(x){return !(x.origin==='active'&&x.margin&&x.margin.pct<objective(x.p));});
  /* Un ancien plat ou une nouveauté sous l'objectif n'est proposé que si la correction de C251 (prix +15 % au plus, portion −25 % au plus) l'y amène. */
  var G=root.VerdictCarteGestes;if(G&&typeof G.corriger==='function')list=list.filter(function(x){if(x.origin==='active'||!x.margin||x.margin.pct>=objective(x.p))return true;try{var c=JSON.parse(JSON.stringify(x.p));c.ttc=x.price;var r=G.corriger(c);return !r||r.ok;}catch(e){return true;}});var seen={},out=[];list.forEach(function(x){if(out.length<3&&!seen[x.origin+(x.origin==='active'?'':x.p.id)]){out.push(x);if(x.origin!=='active')seen[x.origin+x.p.id]=1;}});
  /* Vera propose toujours au moins une vraie option : un ancien plat ou une nouveauté. */
  if(out.length===3&&out.every(function(x){return x.origin==='active';})){var alt=list.filter(function(x){return x.origin!=='active'&&(!x.margin||x.margin.pct>=0);})[0];if(alt)out[2]=alt;}
  /* C104 : les deux nouveautés de saison (maintenant, mois suivant) restent visibles, à la place des plats déjà à la carte. */
  ['maintenant','suivant'].forEach(function(q){var n=list.filter(function(x){return x.origin==='new'&&x.p.cpVeraSaison&&x.p.cpVeraSaison.quand===q;})[0];if(!n||out.indexOf(n)>=0)return;if(out.length<3){out.push(n);return;}for(var i=out.length-1;i>=0;i--){if(out[i].origin==='active'){out[i]=n;return;}}});
  return out;}

/* Nouvelle carte : ingénierie de carte (popularité × contribution) par catégorie, dans l'ordre de service. */
function proposeMenu(o){
  o=o||{};var d=DB(),m=moisReel(),mm=[m,(m%12)+1],res=[],before=0,after=0;
  catsOf().forEach(function(cat){
    var items=(d.plats||[]).filter(function(p){return active(p)&&p.cat===cat;});if(!items.length)return;
    var n=items.length,target=o.size==='compact'?Math.max(2,Math.round(n*.75)):o.size==='large'?Math.min(12,n+1):Math.min(n,10);
    items=items.filter(function(p){return num(p.ttc)>0;});if(!items.length)return;n=items.length;target=o.size==='compact'?Math.max(2,Math.round(n*.75)):o.size==='large'?Math.min(12,n+1):Math.min(n,10);
    var rows=items.map(function(p){var k=calc(p),q=qtyOn(p,mm,3).avg||num(p.vol)||0;var inc=k.complete===false||k.recetteComplete===false||num(k.contribPond)==null;return {p:p,q:q,c:inc?null:num(k.contribPond),mp:inc?null:num(k.margePct),inc:inc,fit:seasonFit(p,m)};});
    var sumQ=rows.reduce(function(s,r){return s+r.q;},0)||1,popCut=.7/n,avgC=rows.reduce(function(s,r){return s+(r.c||0)*r.q;},0)/sumQ;
    rows.forEach(function(r){if(r.inc){r.cls='inc';return;}var hiP=r.q/sumQ>=popCut,hiC=(r.c||0)>=avgC;r.cls=hiP&&hiC?'star':hiP?'plow':hiC?'puzzle':'dog';});
    var co=corridor(cat),decisions=[],dropN=Math.max(0,n-target);
    var dogs=rows.filter(function(r){return r.cls==='dog';}).sort(function(a,b){return (a.q*(a.c||0))-(b.q*(b.c||0));});
    var outOfSeason=rows.filter(function(r){return r.cls==='puzzle'&&r.fit<-.4;});
    var toReplace=dogs.concat(outOfSeason).slice(0,Math.max(dogs.length?1:0,Math.min(dogs.length+outOfSeason.length,Math.ceil(n/3))));
    var cand=candidates(cat,{samePeriod:true,vera:true,competitor:o.competitor}).filter(function(x){return x.origin!=='active';});
    /* Règle d'or : un changement n'est proposé que s'il rapporte au moins autant sur la période
       (contribution × ventes attendues). Sinon, le plat reste et il est signalé « à revoir ». */
    var medQ=median(rows.map(function(r){return r.q;}))||0,avgCat=sumQ>0?rows.reduce(function(s,r){return s+(r.c||0)*r.q;},0)/sumQ:0;
    function expectedRep(x,qty){var rq=x.qty&&x.qty>0?x.qty:Math.max(qty,medQ*.8);return rq*(x.margin?x.margin.contrib:0);}
    rows.forEach(function(r){
      var dec={p:r.p,cls:r.cls,q:r.q,c:r.c,action:'keep',text:''},qty=r.q||0,cur=qty*(r.c||0);
      if(toReplace.indexOf(r)>=0){
        if(dropN>0){dec.action='remove';dec.gain=qty*.6*avgCat-cur;dec.text='Peu vendu et peu rentable : retiré pour une carte plus courte (environ 60 % de ses ventes passent sur les autres '+String(cat).toLowerCase()+'). Il reste dans la mémoire, récupérable.';dropN--;}
        else{var best=null,bestV=cur;cand.forEach(function(x){var v=expectedRep(x,qty);if(v>bestV&&(!best||v>expectedRep(best,qty))){best=x;bestV=v;}});
          if(best){cand.splice(cand.indexOf(best),1);dec.action='replace';dec.rep=best;dec.gain=bestV-cur;dec.text='Remplacé par « '+best.p.nom+' » (+'+money(bestV-cur)+' sur la période) — '+(best.why[0]||'meilleur choix de saison');}
          else dec.text='À revoir : aucun remplaçant plus rentable pour cette période, on le garde.';}
      }else if(r.cls==='plow'&&r.mp!=null&&r.mp<objective(r.p)){var t0=num(r.p.ttc),np=Math.floor(Math.min(t0*1.08,(co&&co.max>t0)?co.max:t0*1.08)*2+1e-9)/2;var k2=np>t0?calc(Object.assign({},r.p,{ttc:np,pfttc:r.p.pf&&num(r.p.pfttc)>0?num(r.p.pfttc)*np/t0:r.p.pfttc})):null,mg0=k2&&k2.complete!==false&&num(k2.contribPond)!=null?{contrib:num(k2.contribPond)}:null,v=mg0?qty*.97*mg0.contrib:0;if(mg0&&v>cur){dec.action='price';dec.newPrice=np;dec.gain=v-cur;dec.text='Très demandé mais marge '+pct(r.mp,0)+' : prix '+money(r.p.ttc)+' → '+money(np)+' (+'+money(v-cur)+' sur la période, même avec 3 % de ventes en moins).';}}
      if(r.inc&&!dec.text)dec.text='Fiche incomplète (recette, prix ou canal) : Verdict ne la juge pas et ne la retire pas. Complétez-la pour l’inclure.';
      if(dec.action==='keep'&&!dec.text)dec.text=r.cls==='star'?'Plat vedette : populaire et rentable, on le garde en tête.':r.cls==='puzzle'?'Rentable mais discret : à mettre en avant (suggestion du serveur, ardoise).':r.cls==='plow'?'Très demandé, marge correcte : on le garde.':'Gardé.';
      if(o.competitor&&num(r.p.ttc)>o.competitor*1.15)dec.text+=' Attention : '+money(r.p.ttc)+' contre '+money(o.competitor)+' chez vos concurrents.';
      before+=cur;after+=cur+(dec.gain||0);
      decisions.push(dec);
    });
    res.push({cat:cat,n:n,target:target,corridor:co,decisions:decisions});
  });
  return {months:mm,categories:res,before:before,after:after};
}
function applyMenu(plan,choices){
  var d=DB(),changed=0,ids=[];choices=choices||{};
  plan.categories.forEach(function(c){c.decisions.forEach(function(dec){if(choices[dec.p.id]===false){if(dec.action==='keep')ids.push(dec.p.id);return;}
    if(dec.action==='remove'||dec.action==='replace')ids.push(dec.p.id);
    if(dec.action==='price'){var r0=num(dec.p.ttc);if(dec.p.pf&&num(dec.p.pfttc)>0&&r0>0)dec.p.pfttc=Math.round(num(dec.p.pfttc)*dec.newPrice/r0*100)/100;dec.p.ttc=dec.newPrice;changed++;}
    if(dec.action==='replace')addToMenu(dec.rep.p,dec.rep.price);
  });});
  if(ids.length){if(root.VerdictCarteAtelier&&root.VerdictCarteAtelier.withdraw)root.VerdictCarteAtelier.withdraw(ids);else (d.plats||[]).forEach(function(p){if(ids.indexOf(p.id)>=0){p.cpArchived=true;p.cpArchivedAt=new Date().toISOString();}});}
  try{root.save('vera-menu-apply');}catch(e){}try{root.refreshAll();}catch(e){}
  return {removed:ids.length,priced:changed};
}
/* Remettre un plat à la carte : un plat retiré revient tel quel ; un plat de mémoire ou une nouveauté devient un vrai plat. */
function addToMenu(src,price){
  var d=DB();if(!src)return null;
  if(!src.cpMemory&&!src.cpVeraNew&&src.cpArchived&&(d.plats||[]).indexOf(src)>=0){delete src.cpArchived;delete src.cpArchivedAt;if(price)src.ttc=price;return src;}
  var p=JSON.parse(JSON.stringify(src));p.id='qp-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);p.vol=null;if(price)p.ttc=price;
  ['cpArchived','cpArchivedAt','cpFrozenCost','cpMemory','cpYears','cpSeason','cpVeraSaison'].forEach(function(k){delete p[k];});p.cpOrigin=src.id;p.cpFromVera=true;
  d.plats.push(p);return p;
}

/* ───────── Interface ───────── */
var UI={tab:'dish',o:{samePeriod:true,maxMargin:false,vera:false,price:null,cat:null,size:'balanced',competitor:null}};
function css(){
  if(doc.getElementById('vc14-css'))return;var s=doc.createElement('style');s.id='vc14-css';
  s.textContent=
  '#vc14{position:fixed;inset:0;z-index:2147480000;background:rgba(8,12,18,.5);display:flex;align-items:flex-end;justify-content:center}'+
  '@media(min-width:760px){#vc14{align-items:center}}'+
  '#vc14 .vc-sheet{width:min(820px,100%);max-height:94vh;overflow:auto;background:var(--card,#fff);color:var(--txt,#111827);border-radius:24px 24px 0 0;box-shadow:0 30px 80px rgba(0,0,0,.35);padding:18px 16px calc(22px + env(safe-area-inset-bottom,0px));font:500 15px/1.45 -apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif;animation:vcUp .35s cubic-bezier(.2,.8,.2,1)}'+
  '@media(min-width:760px){#vc14 .vc-sheet{border-radius:24px}}'+
  /* C258 (T1 N7) : en thème clair, la fenêtre de Vera est claire (les variables --card/--txt du cadre restent sombres). */
  'html.vd-workspace-light #vc14 .vc-sheet{background:#ffffff!important;color:#14202b!important;box-shadow:0 30px 80px rgba(16,24,40,.22)!important}html.vd-workspace-light #vc14 .vc-av{background:#f3f5f7}'+
  '@keyframes vcUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}'+
  '#vc14 .vc-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}#vc14 .vc-av{width:54px;height:54px;border-radius:50%;object-fit:cover;background:#111;box-shadow:0 0 0 3px #d4a72c,0 0 22px rgba(212,167,44,.55);animation:vcGlow 2.4s ease-in-out infinite}'+
  '@keyframes vcGlow{50%{box-shadow:0 0 0 3px #f2cf63,0 0 34px rgba(242,207,99,.8)}}'+
  '#vc14 h2{margin:0;font-size:21px;font-weight:800}#vc14 .vc-sub{margin:2px 0 0;font-size:13.5px;opacity:.75}#vc14 .vc-x{margin-left:auto;width:42px;height:42px;border-radius:50%;border:1px solid rgba(127,127,127,.3);background:transparent;color:inherit;font-size:18px;cursor:pointer}'+
  '#vc14 .vc-tabs{display:flex;gap:6px;margin:6px 0 14px;overflow:auto}#vc14 .vc-tab{flex:1;min-width:max-content;padding:10px 12px;border-radius:12px;border:1.5px solid rgba(127,127,127,.25);background:transparent;color:inherit;font-weight:700;cursor:pointer}#vc14 .vc-tab.on{border-color:#d4a72c;background:rgba(212,167,44,.12)}'+
  '#vc14 .vc-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}@media(max-width:560px){#vc14 .vc-form{grid-template-columns:1fr}}'+
  '#vc14 label.vc-f{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:700}#vc14 .vc-f input,#vc14 .vc-f select{padding:11px 12px;border-radius:12px;border:1.5px solid rgba(127,127,127,.3);background:transparent;color:inherit;font:600 15px system-ui}'+
  '#vc14 .vc-tg{display:flex;gap:6px}#vc14 .vc-tg button{flex:1;padding:10px;border-radius:12px;border:1.5px solid rgba(127,127,127,.3);background:transparent;color:inherit;font-weight:700;cursor:pointer}#vc14 .vc-tg button.on{background:#14532d;color:#fff;border-color:#14532d}'+
  '#vc14 .vc-go{width:100%;padding:14px;border-radius:14px;border:0;background:linear-gradient(90deg,#b8860b,#e3b341);color:#1a1200;font:800 16px system-ui;cursor:pointer;margin:4px 0 14px}'+
  '#vc14 .vc-think{display:flex;flex-direction:column;align-items:center;gap:10px;padding:24px 0}#vc14 .vc-dots span{display:inline-block;width:9px;height:9px;margin:0 3px;border-radius:50%;background:#d4a72c;animation:vcDot 1s infinite}#vc14 .vc-dots span:nth-child(2){animation-delay:.15s}#vc14 .vc-dots span:nth-child(3){animation-delay:.3s}'+
  '@keyframes vcDot{50%{transform:translateY(-7px);opacity:.5}}#vc14 .vc-steps{list-style:none;margin:0;padding:0;font-size:14px}#vc14 .vc-steps li{opacity:.35;transition:opacity .25s}#vc14 .vc-steps li.ok{opacity:1}#vc14 .vc-steps li.ok:before{content:"✓ ";color:#16a34a;font-weight:800}'+
  '#vc14 .vc-card{border:1.5px solid rgba(127,127,127,.22);border-radius:18px;padding:14px;margin-bottom:12px;animation:vcIn .45s both}#vc14 .vc-card:nth-child(2){animation-delay:.12s}#vc14 .vc-card:nth-child(3){animation-delay:.24s}#vc14 .vc-card:nth-child(4){animation-delay:.36s}'+
  '@keyframes vcIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}'+
  '#vc14 .vc-badge{display:inline-block;font-size:11.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:rgba(212,167,44,.16);color:#8a6400;margin-bottom:6px}#vc14 .vc-badge.new{background:rgba(22,163,74,.14);color:#15803d}#vc14 .vc-badge.act{background:rgba(59,130,246,.14);color:#1d4ed8}'+
  '#vc14 .vc-card h3{margin:0 0 4px;font-size:18px}#vc14 .vc-kpi{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:14px;margin:6px 0}#vc14 .vc-kpi b{font-variant-numeric:tabular-nums}#vc14 ul.vc-why{margin:6px 0 10px;padding-left:18px;font-size:13.5px}'+
  '#vc14 .vc-act{display:flex;gap:8px;flex-wrap:wrap}#vc14 .vc-act button{padding:10px 14px;border-radius:12px;border:1.5px solid rgba(127,127,127,.3);background:transparent;color:inherit;font-weight:700;cursor:pointer}#vc14 .vc-act button.pri{background:#16a34a;color:#fff;border-color:#16a34a}'+
  '#vc14 .vc-row{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid rgba(127,127,127,.15);font-size:14px}#vc14 .vc-row input{margin-top:4px;width:18px;height:18px}#vc14 .vc-row b{display:block}#vc14 .vc-cls{font-size:11px;font-weight:800;padding:2px 7px;border-radius:999px;margin-left:6px;vertical-align:middle}'+
  '#vc14 .vc-cls.star{background:#dcfce7;color:#15803d}#vc14 .vc-cls.plow{background:#dbeafe;color:#1d4ed8}#vc14 .vc-cls.puzzle{background:#fef3c7;color:#92400e}#vc14 .vc-cls.dog{background:#fee2e2;color:#b91c1c}'+
  '#vc14 .vc-sum{border-radius:16px;padding:12px 14px;background:rgba(212,167,44,.1);margin:0 0 12px;font-size:14.5px}#vc14 .vc-note{font-size:12.5px;opacity:.7;margin:8px 0}#vc14 table{width:100%;border-collapse:collapse;font-size:13.5px}#vc14 td,#vc14 th{padding:6px 4px;border-top:1px solid rgba(127,127,127,.15);text-align:left}#vc14 td.n{text-align:right;font-variant-numeric:tabular-nums}'+
  '@media(prefers-reduced-motion:reduce){#vc14 *{animation:none!important;transition:none!important}}'+
  '.cp-actions .vc14-open.vc14-open.vc14-open,.vc14-open{background:linear-gradient(90deg,#b8860b,#e3b341)!important;background-color:#d4a72c!important;color:#1a1200!important;border-color:transparent!important;font-weight:800!important}';
  (doc.head||doc.documentElement).appendChild(s);
}
function avatar(){var i=doc.querySelector('img.v-help-avatar');return i&&i.src?i.src:'';}
function open(tab){
  css();ensureMemory();UI.tab=tab||UI.tab;var old=doc.getElementById('vc14');if(old)old.remove();
  var w=doc.createElement('div');w.id='vc14';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');w.setAttribute('data-guard-ignore','1');
  w.innerHTML='<div class="vc-sheet"><div class="vc-head">'+(avatar()?'<img class="vc-av" alt="" src="'+esc(avatar())+'">':'<div class="vc-av"></div>')+'<div><h2>Vera propose</h2><p class="vc-sub">'+esc(DB().etab||'')+' · '+esc(monthName(monthOf(currentPeriod())))+' '+yearOf(currentPeriod())+' · mémoire '+memoryYears()+'</p></div><button class="vc-x" type="button" aria-label="Fermer">✕</button></div>'+
    '<div class="vc-tabs"><button class="vc-tab" data-t="dish">Un plat</button><button class="vc-tab" data-t="menu">Une nouvelle carte</button><button class="vc-tab" data-t="memory">Mémoire de la carte</button></div><div class="vc-body"></div></div>';
  doc.body.appendChild(w);
  w.addEventListener('click',function(e){if(e.target===w)close();});w.querySelector('.vc-x').addEventListener('click',close);
  [].forEach.call(w.querySelectorAll('.vc-tab'),function(b){b.addEventListener('click',function(){UI.tab=b.getAttribute('data-t');render();});});
  render();
}
function memoryYears(){var H=ensureMemory();if(!H||!Object.keys(H.months).length)return 'en construction';var ks=Object.keys(H.months).sort();var span=(yearOf(ks[ks.length-1])-yearOf(ks[0]))*12+monthOf(ks[ks.length-1])-monthOf(ks[0])+1,y=Math.floor(span/12),mo=span%12;var t=(y?y+' an'+(y>1?'s':''):'')+(y&&mo?' et ':'')+(mo?mo+' mois':'');return t+(H.generated?' (reconstituée)':'');}
function close(){var w=doc.getElementById('vc14');if(w)w.remove();}
function body(){return doc.querySelector('#vc14 .vc-body');}
function render(){
  [].forEach.call(doc.querySelectorAll('#vc14 .vc-tab'),function(b){b.classList.toggle('on',b.getAttribute('data-t')===UI.tab);});
  if(UI.tab==='dish')renderDishForm();else if(UI.tab==='menu')renderMenuForm();else renderMemory();
}
function tg(name,val,yes,no){return '<div class="vc-tg" data-tg="'+name+'"><button type="button" data-v="1" class="'+(val?'on':'')+'">'+yes+'</button><button type="button" data-v="0" class="'+(!val?'on':'')+'">'+no+'</button></div>';}
function bindToggles(host){[].forEach.call(host.querySelectorAll('[data-tg]'),function(g){[].forEach.call(g.querySelectorAll('button'),function(b){b.addEventListener('click',function(){UI.o[g.getAttribute('data-tg')]=b.getAttribute('data-v')==='1';[].forEach.call(g.querySelectorAll('button'),function(x){x.classList.toggle('on',x===b);});});});});}
function readForm(host){var c=host.querySelector('#vc-cat'),p=host.querySelector('#vc-price'),k=host.querySelector('#vc-comp'),s=host.querySelector('#vc-size');if(c)UI.o.cat=c.value;if(p)UI.o.price=num(p.value);if(k)UI.o.competitor=num(k.value);if(s)UI.o.size=s.value;}
function renderDishForm(){
  var h=body(),cats=catsOf();if(!UI.o.cat||cats.indexOf(UI.o.cat)<0)UI.o.cat=cats.filter(function(c){return courseRank(c)>=3&&courseRank(c)<=4;})[0]||cats[0];
  var m=moisReel();
  h.innerHTML='<div class="vc-form">'+
    '<label class="vc-f">Catégorie<select id="vc-cat">'+cats.map(function(c){return '<option'+(c===UI.o.cat?' selected':'')+'>'+esc(c)+'</option>';}).join('')+'</select></label>'+
    '<label class="vc-f">Prix de vente visé (TTC, facultatif)<input id="vc-price" inputmode="decimal" placeholder="ex. 14,50" value="'+(UI.o.price!=null?esc(String(UI.o.price).replace('.',',')):'')+'"></label>'+
    '<label class="vc-f">Marge maximale'+tg('maxMargin',UI.o.maxMargin,'Oui','Non')+'</label>'+
    '<label class="vc-f">Même période ('+esc(monthName(m))+' + '+esc(monthName(m%12+1))+')'+tg('samePeriod',UI.o.samePeriod,'Oui','Non')+'</label>'+
    '<label class="vc-f" style="grid-column:1/-1">Vera choisit pour moi (saison, ventes passées, marge, ingrédients déjà en stock)'+tg('vera',UI.o.vera,'Oui','Non')+'</label></div>'+
    '<button class="vc-go" type="button">✨ Proposer un plat</button><div class="vc-out"></div>';
  bindToggles(h);
  h.querySelector('.vc-go').addEventListener('click',function(){readForm(h);var out=h.querySelector('.vc-out');think(out,['Lecture de '+memoryYears()+' de ventes','Même période les années passées','Marges avec les prix fournisseurs du jour','Saison et ingrédients déjà en stock'],function(){if(out.isConnected)showDishes(out,proposeDish(UI.o));});});
}
function think(out,steps,done){
  try{out.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
  out.innerHTML='<div class="vc-think"><div class="vc-dots"><span></span><span></span><span></span></div><ul class="vc-steps">'+steps.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ul></div>';
  var lis=out.querySelectorAll('.vc-steps li'),i=0,reduce=root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Les tours sont remplacés dès qu'on change d'onglet : un résultat tardif ne s'affiche jamais ailleurs. */(function tick(){if(!out.isConnected)return;if(i<lis.length){lis[i++].classList.add('ok');setTimeout(tick,reduce?0:320);}else setTimeout(done,reduce?0:250);})();
}
function originBadge(x){if(x.origin==='new'&&x.p.cpVeraSaison)return '<span class="vc-badge new">'+(x.p.cpVeraSaison.quand==='suivant'?'Pour '+esc(monthName(x.p.cpVeraSaison.mois))+' · plat de saison':'Nouveauté de saison · plat complet')+'</span>';return x.origin==='new'?'<span class="vc-badge new">Nouveauté cohérente</span>':x.origin==='memory'?'<span class="vc-badge">'+(x.p.cpMemory?'Ancien plat · mémoire 5 ans':'Plat retiré de la carte')+'</span>':'<span class="vc-badge act">Déjà à la carte · à mettre en avant</span>';}
function showDishes(out,list){
  if(!list.length){out.innerHTML='<p class="vc-note">Pas assez de plats complets dans cette catégorie pour proposer quelque chose de chiffré.</p>';return;}
  out.innerHTML=list.map(function(x,i){var mg=x.margin;return '<div class="vc-card">'+originBadge(x)+'<h3>'+esc(x.p.nom)+'</h3><div class="vc-kpi"><span>Prix <b>'+money(x.price)+'</b></span>'+(x.p.cpVeraSaison&&x.p.cpVeraSaison.principalManque?'<span>Coût matière <b>à compléter <small>(il manque '+esc(x.p.cpVeraSaison.principalManque)+')</small></b></span><span>Marge <b>non calculée</b></span>':'<span>Coût matière <b>'+money(mg&&mg.cost)+(x.p.cpVeraSaison&&x.p.cpVeraSaison.manque.length?' <small>(incomplet : sans '+esc(x.p.cpVeraSaison.manque.join(', '))+')</small>':'')+'</b></span>'+(x.p.cpVeraSaison&&x.p.cpVeraSaison.manque.length?'<span>Marge <b>≈ '+pct(mg&&mg.pct,0)+' <small>provisoire</small></b></span><span>Contribution <b>≈ '+money(mg&&mg.contrib)+'</b></span>':'<span>Marge <b>'+pct(mg&&mg.pct,0)+'</b></span><span>Contribution <b>'+money(mg&&mg.contrib)+'</b></span>'))+'</div><ul class="vc-why">'+x.why.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul>'+
    (i===0?malin(x):'')+
    '<div class="vc-act">'+(x.origin==='active'?'<button type="button" data-open="'+esc(x.p.id)+'">Voir la fiche</button>':'<button type="button" class="pri" data-add="'+i+'">Ajouter à ma carte</button>')+'</div></div>';}).join('')+'<p class="vc-note">Calcul local avec le moteur Verdict et vos prix fournisseurs du jour. Saison : normales de température du mois en cours et du mois suivant (pas de prévision en ligne) ; les nouveautés sont composées avec vos produits, ce qui manque est indiqué.</p>';
  [].forEach.call(out.querySelectorAll('[data-add]'),function(b){b.addEventListener('click',function(){var x=list[Number(b.getAttribute('data-add'))];var p=addToMenu(x.p,x.price);try{root.save('vera-add-dish');root.refreshAll();}catch(e){}b.textContent='Ajouté ✓';b.disabled=true;try{if(typeof root.toast==='function')root.toast('« '+p.nom+' » ajouté à la carte · vérifiez la fiche');}catch(e){}});});
  [].forEach.call(out.querySelectorAll('[data-open]'),function(b){b.addEventListener('click',function(){close();try{root.openPlat(b.getAttribute('data-open'));}catch(e){}});});
}
/* Suggestion maline : le meilleur accord pour faire monter le ticket sans nouvel achat. */
function malin(x){
  var d=DB(),cr=courseRank(x.p.cat),wantRank=cr<=4?8:cr===8?9:4;
  var pair=(d.plats||[]).filter(function(p){return active(p)&&courseRank(p.cat)===wantRank;}).map(function(p){return {p:p,c:num(calc(p).contribPond)||0,q:last12(p)};}).sort(function(a,b){return b.c*Math.max(1,b.q)-a.c*Math.max(1,a.q);})[0];
  if(!pair)return '';return '<div class="vc-sum">💡 Suggestion maline : proposez « '+esc(pair.p.nom)+' » avec ce plat ('+money(pair.c)+' de contribution en plus par vente, '+int(pair.q)+' vendus sur 12 mois).</div>';
}
function renderMenuForm(){
  var h=body();
  h.innerHTML='<div class="vc-form">'+
    '<label class="vc-f">Taille de carte<select id="vc-size"><option value="compact"'+(UI.o.size==='compact'?' selected':'')+'>Compacte (plus simple à tenir)</option><option value="balanced"'+(UI.o.size==='balanced'?' selected':'')+'>Équilibrée</option><option value="large"'+(UI.o.size==='large'?' selected':'')+'>Plus large</option></select></label>'+
    '<label class="vc-f">Prix moyen d’un plat chez vos concurrents (facultatif)<input id="vc-comp" inputmode="decimal" placeholder="ex. 16" value="'+(UI.o.competitor!=null?esc(String(UI.o.competitor).replace('.',',')):'')+'"></label></div>'+
    '<button class="vc-go" type="button">✨ Proposer une nouvelle carte</button><div class="vc-out"></div>';
  h.querySelector('.vc-go').addEventListener('click',function(){readForm(h);var out=h.querySelector('.vc-out');think(out,['Classement de chaque plat : popularité × contribution','Ventes de la même période les années passées','Anciens plats et nouveautés de saison','Couloir de prix et concurrence'],function(){if(out.isConnected)showMenu(out,proposeMenu(UI.o));});});
}
var CLS={star:'Vedette',plow:'Locomotive',puzzle:'Discret',dog:'À revoir'};
function showMenu(out,plan){
  var gain=plan.after-plan.before,mm=plan.months;
  out.innerHTML='<div class="vc-sum">Sur '+esc(monthName(mm[0]))+'–'+esc(monthName(mm[1]))+', d’après les ventes des années passées : contribution estimée <b>'+money(plan.before)+'</b> → <b>'+money(plan.after)+'</b> ('+(gain>=0?'+':'')+money(gain)+').'+(gain<-.005?' Carte plus courte : moins de plats à préparer et à acheter, en échange d’une contribution un peu plus basse.':Math.abs(gain)<=.005?' Votre carte est déjà bien construite pour cette période : Vera ne change rien.':'')+'</div>'+
    plan.categories.map(function(c){return '<div class="vc-card"><h3>'+esc(c.cat)+' <span class="vc-note">'+c.n+' → '+(c.n-c.decisions.filter(function(d){return d.action==='remove';}).length)+' plat(s)'+(c.corridor?' · prix '+money(c.corridor.min)+' à '+money(c.corridor.max):'')+'</span></h3>'+
      c.decisions.map(function(dec){return '<label class="vc-row"><input type="checkbox" data-id="'+esc(dec.p.id)+'" checked><span><b>'+esc(dec.p.nom)+'<span class="vc-cls '+dec.cls+'">'+CLS[dec.cls]+'</span></b>'+esc(dec.text)+'</span></label>';}).join('')+'</div>';}).join('')+
    '<p class="vc-note">Vedette : populaire et rentable · Locomotive : populaire, marge plus faible · Discret : rentable, peu vendu · À revoir : ni l’un ni l’autre (méthode Kasavana & Smith). Cochez précisément ce que vous voulez : décochez un plat pour le retirer de la carte, décochez un changement (prix, remplacement) pour ne pas l’appliquer. Un plat retiré reste dans la mémoire, avec son coût toujours à jour.</p>'+
    '<button class="vc-go" type="button" data-apply>Appliquer cette carte</button>';
  /* C44 : chaque plat se choisit — un plat conservé mais décoché est retiré de la carte ; le bouton annonce le résultat. */
  out.addEventListener('change',function(){var rm=0,pr=0;plan.categories.forEach(function(c){c.decisions.forEach(function(dec){var i=out.querySelector('input[data-id="'+dec.p.id+'"]');if(!i)return;if(i.checked){if(dec.action==='remove'||dec.action==='replace')rm++;if(dec.action==='price')pr++;}else if(dec.action==='keep')rm++;});});var b=out.querySelector('[data-apply]');if(b&&!b.disabled)b.textContent='Appliquer cette carte · '+rm+' retrait(s) · '+pr+' prix ajusté(s)';});
  out.querySelector('[data-apply]').addEventListener('click',function(){
    var choices={};[].forEach.call(out.querySelectorAll('input[data-id]'),function(i){choices[i.getAttribute('data-id')]=i.checked;});
    var r=applyMenu(plan,choices);out.querySelector('[data-apply]').textContent='Carte appliquée ✓ · '+r.removed+' retiré(s) · '+r.priced+' prix ajusté(s)';out.querySelector('[data-apply]').disabled=true;
  });
}
function renderMemory(){
  var h=body(),H=ensureMemory(),now=currentPeriod(),m=moisReel(),y=yearOf(now);
  if(!H||!Object.keys(H.months).length){h.innerHTML='<p class="vc-sum">La mémoire de votre carte se construit mois après mois avec vos ventes réelles. Dès qu’un mois de ventes par plat est saisi, Verdict le garde ici — même si le plat quitte la carte.</p>';return;}
  var years=Object.keys(H.months).map(yearOf).filter(function(v,i,a){return a.indexOf(v)===i;}).sort(),mm=[m,m%12+1];
  var retired=allDishes().filter(function(p){return p.cpArchived;});
  var log=(DB().cpCostLog||[]).slice(-6).reverse();
  h.innerHTML=(H.generated?'<p class="vc-note">'+esc(H.note)+'</p>':'')+
   '<div class="vc-card"><h3>Ce qui a marché en '+esc(monthName(mm[0]))+'–'+esc(monthName(mm[1]))+'</h3><table><tr><th>Année</th><th>Meilleures ventes</th></tr>'+years.filter(function(v){return v<y||(v===y&&m>2);}).slice(-6).reverse().map(function(yr){var b=bestSellers(yr,mm,3);if(!b.length)return '';return '<tr><td>'+yr+'</td><td>'+(b.length?b.map(function(x){return esc(x.p.nom)+' <span class="vc-note">('+int(x.q)+')</span>';}).join(' · '):'—')+'</td></tr>';}).join('')+'</table></div>'+
   '<div class="vc-card"><h3>Plats retirés · toujours à jour</h3>'+(retired.length?retired.map(function(p){var k=calc(p),q=qtyOn(p,[1,2,3,4,5,6,7,8,9,10,11,12],5);return '<div class="vc-row"><span style="flex:1"><b>'+esc(p.nom)+'</b>'+esc(p.cat)+' · '+money(p.ttc)+' · coût du jour '+money(k.cout)+' · marge '+pct(k.margePct,0)+(q.total?' · '+int(q.total)+' vendus ('+q.years.join(', ')+')':'')+(p.cpFrozenCost&&num(p.cpFrozenCost.cout)!=null?' · coût au retrait '+money(p.cpFrozenCost.cout):'')+'</span><span class="vc-act"><button type="button" data-back="'+esc(p.id)+'">Remettre à la carte</button></span></div>';}).join(''):'<p class="vc-note">Aucun plat retiré pour l’instant.</p>')+'</div>'+
   '<div class="vc-card"><h3>Variations de prix fournisseurs</h3>'+(log.length?log.map(function(e){return '<div class="vc-row"><span>'+esc(e.at.slice(0,10))+' · '+e.changes.length+' plat(s) : '+esc(e.changes.slice(0,4).map(function(c){return c.nom+' '+(c.after>c.before?'+':'−')+money(Math.abs(c.after-c.before));}).join(' · '))+'</span></div>';}).join(''):'<p class="vc-note">Aucune variation depuis l’ouverture. Dès qu’un prix fournisseur change, chaque plat concerné — même retiré — est recalculé et signalé.</p>')+'</div>';
  [].forEach.call(h.querySelectorAll('[data-back]'),function(b){b.addEventListener('click',function(){var p=dishById(b.getAttribute('data-back'));var n=addToMenu(p);try{root.save('vera-add-dish');root.refreshAll();}catch(e){}b.textContent='Remis à la carte ✓';b.disabled=true;});});
}

/* Bouton dans la page Carte, à côté de « Renouveler ma carte ». */
function mountButton(){
  var host=doc.querySelector('#c-menu .cp-actions');if(!host||host.querySelector('.vc14-open'))return;
  var b=doc.createElement('button');b.type='button';b.className='cp-button vc14-open';b.textContent='✨ Vera propose';b.addEventListener('click',function(){open('dish');});host.appendChild(b);css();
}
/* Plats retirés : le coût reste vivant (le coût au retrait est gardé pour comparaison). */
function unfreeze(){var f=root.platCalc;if(typeof f!=='function'||f._vc14)return;var w=function(p){if(p&&p.cpArchived&&p.cpFrozenCost){var keep=p.cpFrozenCost;try{delete p.cpFrozenCost;return f.apply(this,arguments);}finally{p.cpFrozenCost=keep;}}return f.apply(this,arguments);};w._vc14=true;w._qa=f._qa;root.platCalc=w;}
function install(){
  if(!root.STORE||typeof root.platCalc!=='function'||!root.DB)return false;
  unfreeze();ensureMemory();watchCosts(true);
  var sv=root.save;if(typeof sv==='function'&&!sv._vc14){var ws=function(){var r=sv.apply(this,arguments);try{var d=DB();if(d&&d.cpDishHistory&&d.cpDishHistory.generated===false)accrue(d);}catch(e){}scheduleWatch();return r;};ws._vc14=true;for(var k in sv)if(Object.prototype.hasOwnProperty.call(sv,k))ws[k]=sv[k];root.save=ws;}
  var sw=root.switchEtab;if(typeof sw==='function'&&!sw._vc14){var wsw=function(){var r=sw.apply(this,arguments);setTimeout(function(){try{ensureMemory();watchCosts(true);}catch(e){}},300);return r;};wsw._vc14=true;for(var k2 in sw)if(Object.prototype.hasOwnProperty.call(sw,k2))wsw[k2]=sw[k2];root.switchEtab=wsw;}
  /* C258 (T1 N5e) : la fenêtre de Vera se ferme quand on change d'écran. */
  var gg=root.go;if(typeof gg==='function'&&!gg._vc258){var wg=function(){try{close();}catch(e){}return gg.apply(this,arguments);};wg._vc258=true;for(var k3 in gg)if(Object.prototype.hasOwnProperty.call(gg,k3))wg[k3]=gg[k3];root.go=wg;}
  if(root.MutationObserver){var t=0;new root.MutationObserver(function(){if(t)return;t=setTimeout(function(){t=0;mountButton();},120);}).observe(doc.body,{childList:true,subtree:true});}
  mountButton();return true;
}
root.VerdictVeraCarte={_prixNouveaute:function(n,cat){prixSaison(n,cat,null);var ok=coutAuPrix(n,n.ttc);return {ttc:n.ttc,ok:ok,marge:marginAt(n,n.ttc),corrige:n.cpCoutCorrige||null,carte:n.cpCarte||null};},version:'C104',open:open,close:close,ensureMemory:ensureMemory,proposeDish:proposeDish,proposeMenu:proposeMenu,applyMenu:applyMenu,addToMenu:addToMenu,watchCosts:watchCosts,bestSellers:bestSellers,qtyOn:qtyOn,seasonFit:seasonFit,warmth:warmth,isSimulated:isSimulated,_newCreation:newCreation};
function boot(n){if(install())return;if(n>0)setTimeout(function(){boot(n-1);},300);}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',function(){boot(60);});else boot(60);
})(window);
