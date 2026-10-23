/* C88 — Gain réaliste (16/10/2026).
   « Simuler doit être cohérent et juste selon le modèle du client, ne pas vendre du rêve. L'Audit doit retrouver les bases
   de Pilotage et Simuler, faisables. Un Audit 2-en-1 : le vrai gain fusionné structure + carte, mensuel et annuel. » (Steven)
   Une seule base pour Simuler, Priorités et l'Audit :
   1. chaque levier est borné par le repère du format (un tiers de l'écart au repère médian, comme Priorités) ;
   2. un chiffre d'affaires en plus entraîne ses coûts (matière, boissons, emballages, commissions, renfort d'équipe) ;
   3. la Carte entre dans le même calcul par ses propres prix (plafonnés, −3 % de ventes) et remplace alors le levier panier ;
   4. tout est rejoué par moteur() : aucun euro n'est additionné à côté, donc aucun double comptage.
   C90 (retour de Steven : « une seule base, une référence juste, c'est tout ») : un seul montant ; la proposition ne dépasse
   ni la borne de chaque levier ni la rentabilité des meilleurs établissements du format ; un ancien scénario enregistré
   avant ces bornes n'est plus restauré tel quel ; si le client pousse lui-même un curseur, une phrase simple le dit.
   C91 : Priorités et Audit affichent pour chaque action le montant que Simuler calcule pour le même levier. */
(function(w){
'use strict';
if(w.VerdictGainRealiste||typeof w.moteur!=='function'||typeof w.DEC_DEFS==='undefined'||typeof w.deriv!=='function')return;

/* C206 (V27) — démonstration : le bandeau dit « vos chiffres ne sont pas conservés ». Le scénario de Simuler qu'une visite
   précédente de la démo avait gardé (stockage du navigateur, clé verdict:demo:decision:scenario:…) est oublié au
   chargement de la page ; pendant la visite, il reste conservé d'un écran à l'autre. Un vrai établissement n'est pas touché. */
try{var LS=w.localStorage,OUB=[];for(var li=0;li<LS.length;li++){var lk=LS.key(li);if(lk&&lk.indexOf('verdict:demo:decision:scenario:')===0)OUB.push(lk);}OUB.forEach(function(k){LS.removeItem(k);});}catch(e){}
var CTRL={sal:1,fc:1,com:1,emb:1,fix:.5,panier:.5,carte:.5,cmd:1/3,jour:1/3};
var CTRL_LIB={1:'élevé',0.5:'partiel'};
var ORDER=['sal','fix','com','emb','fc','boi','carte','panier','cmd'];
var CARTE_CAP=8,CARTE_ELAST=.03,JOUR_DEMANDE=.6,JOUR_EQUIPE=.8,PANIER_PCT=.02;

function def(id){for(var i=0;i<w.DEC_DEFS.length;i++)if(w.DEC_DEFS[i].id===id)return w.DEC_DEFS[i];return null;}
function num(x){x=Number(x);return isFinite(x)?x:0;}
function inp(k){return num(w.DB&&w.DB.in?w.DB.in[k]:0);}
function eur(x){return typeof w.eur==='function'?w.eur(x):Math.round(x).toLocaleString('fr-FR')+' €';}
function pc(x,d){return typeof w.pc==='function'?w.pc(x,d==null?1:d):(Math.round(x*10)/10).toString().replace('.',',')+' %';}
/* Prix au format de la langue choisie (virgule en français, point en anglais) — langues-complements. */
function tag(){try{return typeof w.localeTag==='function'?w.localeTag():'fr-FR';}catch(e){return 'fr-FR';}}
function fr2(x){return Number(x).toLocaleString(tag(),{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:false});}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function signe(x){return (x>=0?'+':'−')+eur(Math.abs(x));}
function ctrlLib(id){var c=CTRL[id];return c>=1?'élevé':(c>=.5?'partiel':'faible');}

/* C301 (V15-003, décision 5) — L'écart matière se lit sur le MÊME périmètre des deux côtés : achats nourriture + boissons
   contre fiches nourriture + boissons quand les fiches comptent des boissons ; sinon nourriture contre nourriture (une carte
   sans boissons ne peut pas expliquer les achats de boissons). La période des achats est écrite. Une seule fonction pour
   l'Audit, Simuler, Priorités, les Alertes et la Carte : window.VerdictEcartMatiere(). */
function periodeAchats(R){var D=w.DB||{},y=D.refSource&&D.refSource.exerciseYear;if(y)return 'exercice '+y;var m=num(R&&R.d&&R.d.mois);return m&&m<12?'sur '+Math.round(m)+' mois':'sur l’année';}
function ecartMatiere(R,st){
  try{R=R||w.moteur();if(!R||!R.ready)return null;if(st===undefined)st=typeof w.carteStats==='function'&&w.DB&&w.DB.plats&&w.DB.plats.length?w.carteStats():null;}catch(e){return null;}
  if(!st||!(num(st.theoR)>0))return null;var d=R.d,ca=num(d.ca);if(!(ca>0))return null;
  var tn=st.theoNourR!=null?num(st.theoNourR):num(st.theoR),avec=num(st.theoR)-tn>0.05;
  var reel=(avec?num(d.nour)+num(d.boi):num(d.nour))/ca*100,theo=avec?num(st.theoR):tn,pts=reel-theo;
  /* C311 (V16-021, décision 8) : les fiches-types proposées par Vera (brouillons) sont comptées et dites ; les vraies fiches priment */
  var brouillons=0;try{(w.DB&&w.DB.plats||[]).forEach(function(p){if(p&&p.cpVeraDraft&&p.actif!==false)brouillons++;});}catch(e){}
  /* C311 (décision 13) : le détail par poste — un levier ne va jamais au-delà de l'écart de son poste */
  var rN=num(d.nour)/ca*100,eNour={reel:rN,theo:tn,pts:rN-tn},eBoi=avec?{reel:num(d.boi)/ca*100,theo:num(st.theoR)-tn,pts:num(d.boi)/ca*100-(num(st.theoR)-tn)}:null;
  /* C311 (V16T1-N1) : la forme demandée par le chef, avec l'euro de chaque poste (eur = pts / 100 × CA) */
  eNour.eur=eNour.pts/100*ca;if(eBoi)eBoi.eur=eBoi.pts/100*ca;
  return {parPoste:{nourriture:eNour,boissons:eBoi},perimetre:avec?'nourriture + boissons':'nourriture',avecBoissons:avec,reel:reel,theo:theo,pts:pts,eur:pts/100*ca,compte:pts>=4,tiers:pts>=4?pts/3/100*ca:0,periode:periodeAchats(R),ca:ca,brouillons:brouillons,nour:eNour,boi:eBoi};
}
/* C301 (V15-002, phrase) : la phrase de la décision de Steven, la même que l'Audit (verdictGainPanier, traduite par L3) */
function reglePanier(){try{var g=typeof w.verdictGainPanier==='function'?w.verdictGainPanier(1):null;if(g&&g.hypothese)return g.hypothese;}catch(e){}return 'À volume constant, une hausse de prix ne coûte pas de matière ; seules la TVA et les commissions suivent.';}
function pts1(x){return (Math.round(x*10)/10).toLocaleString(tag(),{minimumFractionDigits:1,maximumFractionDigits:1})+' point'+(Math.abs(x)>=2?'s':'');}
w.VerdictEcartMatiere=ecartMatiere;

/* ── Repères du format (FAMILLES / FORMATS de 029) ── */
function format(){
  var t=null,F=null,fmt=null;
  try{t=typeof w.fmtActif==='function'?w.fmtActif():null;}catch(e){}
  try{if(t&&w.FORMATS&&w.FORMATS[t]){fmt=w.FORMATS[t];F=w.FAMILLES[fmt.f];}}catch(e){}
  var generic=!F;if(!F)F=(w.FAMILLES&&w.FAMILLES.trad)||{ms:[30,36,42],fc:[25,29,32],cv:[33,38,43],acf:[15,20,26],rn:[2,5,9]};
  /* C311 (V16-072) : un établissement saisonnier garde les repères de sa famille, mais il est nommé comme tel (le saisonnier de bord
     de mer n'est pas « Restaurant traditionnel ») */
  var aff=t;try{var D=w.DB||{},pr=D.establishmentProfile||{};if(t&&!generic&&pr.seasonality==='seasonal'&&fmt&&fmt.f==='trad')aff='Restaurant saisonnier, repères de la restauration traditionnelle';}catch(e){}
  return {type:aff,fam:F,fmt:fmt,generic:generic,nom:aff||'votre format (repères généraux de la restauration traditionnelle)'};
}

/* ── Carte : gain réaliste par plat (prix plafonné, ventes −3 %) ── */
var CF={k:null,v:false},CP={};
function carteFiable(){
  var k=cle();if(CF.k===k)return CF.v;CF={k:k,v:carteFiableCalc()};return CF.v;
}
function carteFiableCalc(){
  try{
    if(!w.DB||!w.DB.plats||!w.DB.plats.length||typeof w.auditPremiumCalc!=='function')return false;
    var c=w.auditPremiumCalc(w.moteur()).carte;return !!(c&&c.ok&&num(c.couverture)>=80);
  }catch(e){return false;}
}
function actif(p){return p&&!p.cpArchived&&num(p.ttc)>0;}
function scaled(p,f){var q={};for(var k in p)q[k]=p[k];q.ttc=num(p.ttc)*f;if(p.pf&&num(p.pfttc)>0)q.pfttc=num(p.pfttc)*f;return q;}
function cartePlan(capPct){
  var k=cle()+'|'+capPct;if(CP.k===k)return CP.v;var r=cartePlanCalc(capPct);CP={k:k,v:r};return r;
}
function cartePlanCalc(capPct){
  var out={fiable:carteFiable(),rows:[],dCaAn:0,dContribAn:0,sous:0};
  if(!out.fiable||!(capPct>0)||typeof w.platCalc!=='function')return out;
  var plats=w.DB.plats.filter(actif),catMax={};
  plats.forEach(function(p){var c=p.cat||'Autre';catMax[c]=Math.max(catMax[c]||0,num(p.ttc));});
  var dCa=0,dCo=0;
  plats.forEach(function(p){
    if(p.vol==null||!(num(p.vol)>0))return;
    var k=w.platCalc(p);if(!k||!k.complete||!(k.objPond>0)||!isFinite(k.contribPct)||k.contribPct>=k.objPond)return;
    out.sous++;
    var ttc=num(p.ttc),c=p.cat||'Autre',limite=ttc>=catMax[c]?ttc:Math.min(catMax[c],ttc*(1+capPct/100));/* C301 (V15-061) : le plus cher de sa catégorie ne monte pas */
    var lo=1,hi=limite/ttc,ok=function(f){var n=w.platCalc(scaled(p,f));return n&&n.complete&&n.contribPct>=n.objPond;};
    var f=hi;if(ok(hi)){for(var i=0;i<30;i++){var m=(lo+hi)/2;if(ok(m))hi=m;else lo=m;}f=hi;}
    var np=Math.min(Math.ceil(ttc*f*10-1e-9)/10,Math.floor(limite*10+1e-9)/10);if(!(np>ttc+0.049))return;
    var k2=w.platCalc(scaled(p,np/ttc)),v=num(p.vol);if(!k2||!k2.complete)return;
    var ca=v*(1-CARTE_ELAST)*k2.htPond-v*k.htPond,co=v*(1-CARTE_ELAST)*k2.contribPond-v*k.contribPond;
    if(!(co>0))return;
    dCa+=ca;dCo+=co;out.rows.push({id:p.id,nom:p.nom,cat:c,avant:ttc,apres:np,hausse:(np/ttc-1)*100,vol:v,contribMois:co,marge:k.contribPct,obj:k.objPond});
  });
  var mois=num(w.DB.in&&w.DB.in.mois)||12,st=null;try{st=w.carteStats();}catch(e){}
  var caStr=w.moteur().d.ca,caCarte=st&&st.ca>0?st.ca*mois:0,ech=caCarte>0?Math.min(1,caStr/caCarte):1;
  out.dCaAn=dCa*mois*ech;out.dContribAn=dCo*mois*ech;out.echelle=ech;out.mois=mois;
  out.rows.sort(function(a,b){return b.contribMois-a.contribMois;});
  return out;
}

/* ── Cumul : tous les leviers rejoués ensemble, coûts liés compris ── */
function etat(state,id){var d=def(id);if(!d)return 0;try{if(typeof w.decPertinent==='function'&&!w.decPertinent(d))return 0;}catch(e){}var v=(state&&state[id]!=null)?state[id]:d.def;return num(v);}
function overAll(state){
  state=state||w.DEC_STATE;
  var over={},d0=w.deriv(),vP=etat(state,'panier'),vC=etat(state,'cmd'),vJ=etat(state,'jour'),vK=etat(state,'carte');
  /* 1. leviers de chiffre d'affaires */
  /* C301 bis (panier exact) : +X € de panier ajoute exactement tickets × X ÷ (1 + TVA) de CA HT, comme verdictGainPanier (l'Audit) ;
     le moteur part du panier arrondi saisi (29,80 € pour 29,798 € réels) : la hausse est calibrée sur ce CA. */
  /* C311 (correctif SIM de L3, la caisse fait foi) : panier et commandes par jour de départ = ceux du moteur (R.d), dérivés de la caisse
     quand elle couvre l'exercice ; la saisie brute ne sert qu'à défaut (elle faisait perdre 38 600 € au Saisonnier pour +1 commande). */
  var pan0=num(d0.panierTTC)>0?num(d0.panierTTC):inp('panier'),cmd0=num(d0.cmdj)>0?num(d0.cmdj):inp('cmdj');
  if(vP){var pb=pan0,cible=num(d0.cmdAn)*vP/(1+num(d0.tva)),essai=w.deriv({panier:pb+vP}),pente=(num(essai.ca)-num(d0.ca))/vP;
    over.panier=pb+(cible>0&&pente>0?cible/pente:vP);}
  var jsem=inp('jsem')||6,cmdj=cmd0;
  if(vC)over.cmdj=Math.max(0,cmdj+vC);
  if(vJ){var nj=Math.max(1,Math.min(7,jsem+vJ)),dj=nj-jsem;over.jsem=nj;
    /* un jour ajouté (ou retiré) ne vaut pas une journée moyenne : 60 % de la demande d'une journée moyenne */
    if(dj)over.cmdj=(over.cmdj!=null?over.cmdj:cmdj)*(jsem+JOUR_DEMANDE*dj)/nj;}
  var d1=(vP||vC||vJ)?w.deriv(over):d0,k=d0.ca>0?d1.ca/d0.ca:1,renfort=0;
  /* C301 (V15-002, décision 2, la règle de verdictGainPanier) : une hausse du panier à volume constant ne consomme pas de
     matière ni d'emballages ; la TVA et les commissions suivent le CA. Seuls les clients en plus (commandes, jours) en consomment. */
  var oV={};for(var q in over)if(q!=='panier')oV[q]=over[q];var dV=vP&&(vC||vJ)?w.deriv(oV):(vP?d0:d1),kv=d0.ca>0?dV.ca/d0.ca:1;
  if(Math.abs(k-1)>1e-9){
    /* un client de plus consomme de la matière, des emballages et des commissions ; un prix plus haut, seulement des commissions */
    over.nour=inp('nour')*kv;over.boi=inp('boi')*kv;over.emb=inp('emb')*kv;over.autv=inp('autv')*kv;over.com=inp('com')*k;
    var salM=num(d0.salM),volPct=cmdj>0?vC/cmdj:0;
    if(vJ&&over.jsem!==jsem)renfort+=salM*(over.jsem-jsem)/jsem*(over.jsem>jsem?JOUR_EQUIPE:.5);
    if(volPct>.05)renfort+=salM*(volPct-.05)*.5;
  }
  /* 2. prix de la carte : la hausse de prix ne consomme pas de matière, la baisse de 3 % des ventes est comptée */
  if(vK>0){var cp=cartePlan(vK);if(cp.dCaAn){var caAv=d1.ca;over.panier=(over.panier!=null?over.panier:pan0)*(1+cp.dCaAn/caAv);
    over.nour=(over.nour!=null?over.nour:inp('nour'))+(cp.dCaAn-cp.dContribAn);}}
  /* 3. food cost en points du CA résultant */
  var vF=etat(state,'fc');if(vF){var d2=w.deriv(over);over.nour=Math.max(0,(over.nour!=null?over.nour:inp('nour'))+vF/100*d2.ca);}
  /* 3 bis. C311 (décision 13) : coût des boissons en points du CA résultant */
  var vB=etat(state,'boi');if(vB){var d3=w.deriv(over);over.boi=Math.max(0,(over.boi!=null?over.boi:inp('boi'))+vB/100*d3.ca);}
  /* 4. équipe (curseur + renfort imposé par le volume) */
  var vS=etat(state,'sal');if(vS||renfort)w.decApplyHumanLoaded(over,vS+Math.round(renfort));
  /* 5. autres postes */
  var vCom=etat(state,'com');if(vCom)over.com=Math.max(0,(over.com!=null?over.com:inp('com'))*(1+vCom/100));
  var vX=etat(state,'fix');if(vX){for(var i=1;i<=10;i++){var x=inp('f'+i);if(x>0)over['f'+i]=Math.max(0,x*(1+vX/100));}}
  var vE=etat(state,'emb');if(vE){over.emb=Math.max(0,(over.emb!=null?over.emb:inp('emb'))*(1+vE/100));over.autv=Math.max(0,(over.autv!=null?over.autv:inp('autv'))*(1+vE/100));}
  return over;
}

/* ── Le plan réaliste de l'établissement ── */
var CACHE={k:null,v:null};
/* C218 (W76) : les prix des ingrédients, des préparations et des suppléments font partie de la clé : une facture qui change
   un prix recalcule aussitôt le gain de la carte (avant, le gain restait celui d'avant la facture). */
function cle(){try{return JSON.stringify([w.LOCALE,w.DB.in,w.DB.etabType,w.DB.plats,w.DB.carteRef,w.DB.reg,w.DB.controlTargets,(w.DB.decisions||[]).length,w.DB.ing,w.DB.preparations,w.DB.supp]);}catch(e){return String(Math.random());}}
function payrollOk(){try{return typeof w.decPayrollRecommendationAllowed==='function'&&w.decPayrollRecommendationAllowed();}catch(e){return false;}}
function txt(f,a){try{return typeof w[f]==='function'?w[f](a):'';}catch(e){return '';}}
function plan(){
  var k=cle();if(CACHE.k===k&&CACHE.v)return CACHE.v;
  var R=w.moteur();if(!R||!R.ready)return null;
  var d=R.d,v=R.v,ca=d.ca,F=format(),fam=F.fam,type=F.type,L=[],cf=carteFiable();
  function texteCarte(cap){var c=cartePlan(cap);return {why:c.sous+' plat'+(c.sous>1?'s':'')+' sous leur objectif de marge. Prix relevés au plus de '+cap+' %, sans dépasser le prix le plus haut de leur catégorie ; 3 % de ventes en moins comptés.',
    how:'Nouveaux prix : '+c.rows.slice(0,3).map(function(r){return r.nom+' '+fr2(r.avant)+' → '+fr2(r.apres)+' €';}).join(' · ')+(c.rows.length>3?' · …':'')};}
  function add(id,val,why,how){if(val&&isFinite(val))L.push({id:id,v:val,why:why,how:how,ctrl:ctrlLib(id)});}
  /* équipe : un tiers de l'écart au repère médian */
  if(num(d.salM)>0&&v.ms>fam.ms[1]){var m=Math.floor((v.ms-fam.ms[1])/100*ca/3/12/50)*50;
    add('sal',-m,'Coût humain à '+pc(v.ms)+' du CA ; repère médian '+F.nom+' : '+pc(fam.ms[1],0)+'. Verdict retient un tiers de l’écart.',txt('p11StaffAction',type)||'Comparer ventes et heures, service par service.');}
  /* charges fixes : un tiers de l'écart, exprimé sur l'ensemble mais à chercher hors loyer */
  if(num(d.af)>0&&v.acf>fam.acf[1]){var sv=(v.acf-fam.acf[1])/100*ca/3,p=Math.floor(sv/d.af*100);
    add('fix',-p,'Charges fixes à '+pc(v.acf)+' du CA ; repère '+pc(fam.acf[1],0)+'. Un tiers de l’écart, arrondi au pas du curseur : '+eur(d.af*p/100)+' par an.','Assurances, énergie, abonnements et maintenance, ligne par ligne. Le loyer n’est pas compté.');}
  /* commissions */
  if(num(d.com)>0)add('com',-10,'Commissions plateformes : '+eur(d.com)+' par an.','Faire passer une partie des commandes en clic-et-retrait et revoir les prix affichés en livraison.');
  /* emballages */
  if(num(d.av)>0&&v.cv>fam.cv[1])add('emb',-10,'Coûts variables à '+pc(v.cv)+' du CA ; repère '+pc(fam.cv[1],0)+'.','Regrouper les commandes, revoir les formats, supprimer les consommables en double.');
  /* matière : la carte (recettes et fuite) quand elle est fiable, sinon l'écart structurel */
  var why=null,pts=0;
  if(cf){var st=null;try{st=w.carteStats();}catch(e){}
    /* C311 (décision 13) : poste par poste — la part « fuite » de chaque levier est bornée par l'écart de son poste ; un poste déjà sous
       ses fiches n'en a pas ; un écart qui est dans les boissons va au levier « Coût des boissons », jamais à la nourriture. */
    if(st&&st.theoR>0){var tn=st.theoNourR!=null?st.theoNourR:st.theoR,E=ecartMatiere(R,st),rec=tn>fam.fc[1]?(tn-fam.fc[1])/3:0,eN=E&&E.nour?Math.max(0,E.nour.pts):0,eB=E&&E.boi?Math.max(0,E.boi.pts):0,fuite=E&&E.compte?eN/3:0;pts=rec+fuite;
      var ptsB=E&&E.compte?Math.floor(eB/3*2)/2:0;if(ptsB>=.5)add('boi',-ptsB,'Coût des boissons : achats '+E.periode+' à '+pc(E.boi.reel)+' du CA, fiches '+pc(E.boi.theo)+' : '+pts1(E.boi.pts)+' de pertes, offerts ou portions servies. Un tiers de l’écart des boissons, par pas de 0,5 point.','Mesurer les verres et les doses, noter les offerts, compter le bar chaque semaine.');
      why='Coût de la nourriture d’après vos fiches '+pc(tn)+' du CA, hors boissons (repère '+pc(fam.fc[1],0)+')'+(fuite?' ; écart nourriture entre vos achats ('+E.periode+', '+pc(E.nour.reel)+' du CA) et vos fiches ('+pc(E.nour.theo)+') : '+pts1(E.nour.pts)+' de pertes, portions ou offerts invisibles.':'.')+' Un tiers de chaque écart, par pas de 0,5 point.';}}
  else if(v.fc>fam.fc[1]){pts=(v.fc-fam.fc[1])/3;why='Coût de la nourriture à '+pc(v.fc)+' du CA, hors boissons ; repère médian '+pc(fam.fc[1],0)+'. Un tiers de l’écart, par pas de 0,5 point.';}
  pts=Math.floor(pts*2)/2;if(pts>=.5)add('fc',-pts,why,'Repeser les portions clés, mettre à jour les fiches techniques, renégocier le premier fournisseur.');
  /* carte : prix des plats sous leur objectif, plafonnés */
  var cp=cf?cartePlan(CARTE_CAP):null;
  if(cp&&cp.dContribAn>0){var tc=texteCarte(CARTE_CAP);add('carte',CARTE_CAP,tc.why,tc.how);}
  /* panier : remplacé par la carte quand elle est fiable */
  /* C218 (W70) : le panier se borne sur le panier du client lui-même (+2 %), plus sur un repère de ticket propre au type
     (repères à la précision douteuse, et gain qui changeait avec le seul type choisi). */
  var pa=num(d.panierTTC);
  var bornePanier=0;
  if(pa>0){var vp=Math.floor(pa*PANIER_PCT*10)/10;bornePanier=vp;}
  if(pa>0&&vp>0&&!(cp&&cp.dContribAn>0)){
    add('panier',vp,'Panier '+fr2(pa)+' € TTC. Verdict compte au plus +'+Math.round(PANIER_PCT*100)+' % de votre propre panier, auprès des clients déjà là. '+reglePanier(),txt('p11BasketAction',type)||'Entrées, desserts et boissons mis en avant, sans toucher aux prix affichés.');}
  /* C218 (W70) : le nombre de commandes n'est jamais proposé (doctrine C189 : on ne dit pas « vendez plus » quand la
     clientèle n'est pas là ; la fréquentation ne se décide pas). Le curseur reste dans Simuler, comme une hypothèse. */
  L.sort(function(a,b){return ORDER.indexOf(a.id)-ORDER.indexOf(b.id);});
  /* l'équipe n'est proposée qu'après une décision d'organisation mesurée (règle existante de Simuler) */
  var pr=payrollOk(),retenus=L.filter(function(x){return x.id!=='sal'||pr;}),attente=L.filter(function(x){return x.id==='sal'&&!pr;});
  var state={},bornes={panier:bornePanier};L.forEach(function(x){bornes[x.id]=x.v;});retenus.forEach(function(x){state[x.id]=x.v;});
  /* C90 — une seule référence : la proposition ne dépasse jamais la rentabilité des meilleurs établissements du format.
     Les leviers sont pris dans l'ordre (ce qui dépend le plus du client d'abord) ; celui qui ferait dépasser ce niveau
     est réduit au pas du curseur, les suivants ne sont pas proposés. */
  var base=d.res,haut=fam.rn[2],plafonne=false;
  if(v.rn<haut){
    var st2={},ret2=[];
    for(var i=0;i<retenus.length;i++){var x=retenus[i],t={};for(var q in st2)t[q]=st2[q];t[x.id]=x.v;
      if(w.moteur(overAll(t)).v.rn<=haut+1e-9){st2=t;ret2.push(x);continue;}
      plafonne=true;var dd=def(x.id),pas=dd?dd.step:1,sg=x.v<0?-1:1,best=0;
      for(var kk=Math.floor(Math.abs(x.v)/pas+1e-9)-1;kk>=1;kk--){var val=Math.round(sg*kk*pas*100)/100;t[x.id]=val;if(w.moteur(overAll(t)).v.rn<=haut+1e-9){best=val;break;}}
      if(best){st2[x.id]=best;var y={};for(var z in x)y[z]=x[z];y.v=best;if(x.id==='carte'){var tc2=texteCarte(best);y.why=tc2.why;y.how=tc2.how;}y.why=y.why+' Réduit pour ne pas dépasser '+pc(haut,0)+' de rentabilité, le niveau des meilleurs établissements de votre format.';ret2.push(y);}
      break;}
    if(plafonne){state=st2;retenus=ret2;}
  }
  /* la seule référence affichée sur un curseur est la proposition elle-même */
  var bornesLevier=bornes;if(plafonne){bornes={};for(var bi in bornesLevier)bornes[bi]=state[bi]||0;}
  var cumul={},prev=base,steps=[];
  retenus.forEach(function(x){cumul[x.id]=x.v;var Mx=w.moteur(overAll(cumul)),g=Mx.d.res-prev;prev=Mx.d.res;x.gain=g;steps.push(x);});
  /* C301 (V15-041) : un levier qui ne rapporte rien (gain nul ou négatif une fois les autres appliqués) n'est pas retenu ;
     le possible est alors exactement la somme des lignes affichées. */
  var nuls=steps.filter(function(x){return !(x.gain>0.5);});
  if(nuls.length&&nuls.length<steps.length){retenus=retenus.filter(function(x){return nuls.indexOf(x)<0;});state={};retenus.forEach(function(x){state[x.id]=x.v;});cumul={};prev=base;steps=[];
    retenus.forEach(function(x){cumul[x.id]=x.v;var Mx=w.moteur(overAll(cumul)),g=Mx.d.res-prev;prev=Mx.d.res;x.gain=g;steps.push(x);});}
  var MC=w.moteur(overAll(state));
  attente.forEach(function(x){var o={};o[x.id]=x.v;x.gain=w.moteur(overAll(o)).d.res-base;});
  var central=MC.d.res-base;
  var r={R:R,format:F,leviers:L,retenus:steps,attente:attente,state:state,bornes:bornes,bornesLevier:bornesLevier,carte:cp,carteFiable:cf,
    central:{gain:central,mois:central/12,res:MC.d.res,rn:MC.v.rn,score:MC.score,ca:MC.d.ca},
    base:{res:base,rn:v.rn,score:R.score},plafond:{rn:haut,atteint:plafonne}};
  CACHE={k:k,v:r};return r;
}

/* ── Simuler : nouveaux pas, levier Carte, cumul et impacts individuels ── */
function installerSimuler(){
  /* C218 (W80) : ce curseur agit sur la nourriture seule (achats nourriture / CA) : il le dit, et rappelle la marchandise
     complète (nourriture + boissons) pour qu'aucun écran ne présente 18,6 % comme « le coût de la marchandise ». */
  var fcd=def('fc');if(fcd&&!fcd.__c218){fcd.__c218=true;fcd.t='Coût de la nourriture';fcd.label='Je modifie le coût de la nourriture (hors boissons) de';
    var fb0=fcd.dispBase;if(typeof fb0==='function')fcd.dispBase=function(){var r=fb0.apply(this,arguments);try{var R=w.moteur(),ca=num(R.d.ca),m=num(R.d.mat);if(ca>0&&m>0)r=String(r)+' · nourriture seule ; avec les boissons : '+pc(m/ca*100);}catch(e){}return r;};}
  /* C311 (décision 13) : le curseur « Coût des boissons », présent quand l'écart des boissons le justifie (ou déjà réglé) */
  if(!def('boi')&&fcd){var bd={id:'boi',t:'Coût des boissons',icon:'🍷',step:0.5,min:-10,max:10,def:0,label:'Je modifie le coût des boissons de',
      visible:function(){try{if(!(inp('boi')>0))return false;if(num(w.DEC_STATE&&w.DEC_STATE.boi))return true;var E=ecartMatiere();return !!(E&&E.compte&&E.boi&&E.boi.pts>=1.5);}catch(e){return false;}},
      fmt:fcd.fmt,dispBase:function(R){return pc(num(R.d.boi)/Math.max(1,num(R.d.ca))*100)+' du CA · boissons seules';},dispAfter:function(R,v){return pc(num(R.d.boi)/Math.max(1,num(R.d.ca))*100+num(v))+' du CA';},
      apply:function(over,v){var d0=w.deriv();over.boi=Math.max(0,inp('boi')+(num(v)/100)*d0.ca);}};
    w.DEC_DEFS.splice(w.DEC_DEFS.indexOf(fcd)+1,0,bd);try{if(w.DEC_STATE&&w.DEC_STATE.boi==null)w.DEC_STATE.boi=0;if(w.DEC_CONTROLE)w.DEC_CONTROLE.boi=['élevé','doses, offerts et pertes du bar dépendent de vous'];}catch(e){}}
  var p=def('panier');if(p)p.step=0.1;
  /* C301 (V15-002, écran) : la règle du panier est écrite sous le curseur, la même que l'Audit (verdictGainPanier) */
  if(p&&!p.__c301){p.__c301=true;var pb0=p.dispBase;if(typeof pb0==='function')p.dispBase=function(){/* C301 (V15-078) : aucun ticket lu = panier inconnu, jamais 0,00 € */if(!(inp('panier')>0))return 'inconnu : aucun ticket lu dans votre caisse';var r=pb0.apply(this,arguments);return String(r)+' · '+reglePanier();};}var sl=def('sal');if(sl)sl.step=50;var c=def('cmd');if(c){c.step=0.5;c.fmt=function(v){return (v>0?'+':v<0?'\u2212':'')+String(Math.abs(Math.round(v*10)/10)).replace('.',',')+' / jour';};
    /* C311 (correctif SIM de L3, la caisse fait foi) : « Aujourd'hui » et « Après » partent des commandes du moteur (R.d.cmdj), comme le calcul */
    var cB=function(R){var x=num(R&&R.d&&R.d.cmdj);if(!(x>0))try{x=num(w.deriv().cmdj);}catch(e){}return x>0?x:inp('cmdj');},c1=function(x){return typeof w.fr==='function'?w.fr(x,1):(Math.round(x*10)/10).toLocaleString(tag(),{minimumFractionDigits:1,maximumFractionDigits:1});};
    c.dispBase=function(R){return c1(cB(R))+' / jour';};c.dispAfter=function(R,v){return c1(Math.max(0,cB(R)+num(v)))+' / jour';};c.apply=function(over,v){over.cmdj=Math.max(0,cB(null)+num(v));};}
  if(p&&!p.__c311c){p.__c311c=true;var pB=function(R){var x=num(R&&R.d&&R.d.panierTTC);if(!(x>0))try{x=num(w.deriv().panierTTC);}catch(e){}return x>0?x:inp('panier');},p2=function(x){return typeof w.eur2==='function'?w.eur2(x):(Math.round(x*100)/100).toLocaleString(tag(),{minimumFractionDigits:2,maximumFractionDigits:2})+'\u00a0€';},pd0=p.dispBase;
    p.dispBase=function(R){if(!(inp('panier')>0)&&!(pB(R)>0))return pd0.apply(this,arguments);return p2(pB(R))+' TTC · '+reglePanier();};p.dispAfter=function(R,v){return p2(pB(R)+num(v))+' TTC';};p.apply=function(over,v){over.panier=pB(null)+num(v);};}var x=def('fix');if(x)x.step=1;
  if(!def('carte')){
    var at=w.DEC_DEFS.indexOf(def('panier'))+1;
    w.DEC_DEFS.splice(at,0,{id:'carte',t:'Prix de la carte',icon:'🍽️',step:1,min:0,max:CARTE_CAP,def:0,
      visible:function(){return carteFiable();},
      label:'Je relève les prix des plats sous leur objectif, au plus de',
      fmt:function(v){return '+'+Math.round(v)+' % max';},
      dispBase:function(){var cp=cartePlan(CARTE_CAP);return cp.sous+' plat'+(cp.sous>1?'s':'')+' sous l’objectif';},
      dispAfter:function(R,v){var cp=cartePlan(v),I=null;try{I=w.decImpact('carte',v);}catch(e){}var g=I&&isFinite(I.delta)?I.delta:cp.dContribAn;return (g>=0?'+':'')+eur(g)+' / an · '+cp.rows.length+' prix';},
      apply:function(over,v){var o=overAll({carte:v});for(var k in o)over[k]=o[k];}});
    try{w.DEC_CONTROLE.carte=['partiel','vous fixez les prix ; la réaction des clients ne se décide pas'];}catch(e){}
  }
  w.decOverAll=overAll;
  /* C311 (V16-016, décision 6) : le curseur « Jours d'ouverture » écrit les jours du calendrier (caisse ou calendrier déclaré),
     jamais « 6.1 j/semaine » : un nombre entier de jours par semaine, la virgule française, et « estimé » quand rien n'est connu. */
  try{var DJ=def('jour');if(DJ&&!DJ.__c311){var jFr=function(x){return (Math.round(num(x)*10)/10).toLocaleString(tag(),{maximumFractionDigits:1});},
    jAn=function(R){var d=R&&R.d||{};/* C309 (L3) : d.jAn et d.joursSource (« caisse », « calendrier », « estime ») d'abord */if(num(d.jAn)>0&&d.joursSource&&d.joursSource!=='estime')return {n:Math.round(num(d.jAn)),cal:true,src:d.joursSource};if(num(d.jAn)>0&&d.joursSource==='estime')return {n:Math.round(num(d.jAn)),cal:false};var a=num(d.joursAn)||num(d.joursCaisse&&d.joursCaisse.jours)||0;return a>0?{n:Math.round(a),cal:true}:{n:Math.round((num(d.jSem)||num(w.DB&&w.DB.in&&w.DB.in.jsem)||6)*4.33*(num(d.mois)||12)),cal:false};},
    jSem=function(){return Math.max(1,Math.min(7,Math.round(num(w.DB&&w.DB.in&&w.DB.in.jsem)||6)));};
    DJ.fmt=function(v){return (v>0?'+':v<0?'\u2212':'')+jFr(Math.abs(v))+' j/sem';};
    DJ.dispBase=function(R){var a=jAn(R);return jSem()+' j/semaine · '+(a.cal?'':'≈ ')+a.n.toLocaleString(tag())+' jours par an'+(a.cal?(a.src==='caisse'?' (votre caisse)':' (calendrier)'):' (estimé)');};
    DJ.dispAfter=function(R,v){if(!num(v))return DJ.dispBase(R);var s0=jSem(),s1=Math.max(1,Math.min(7,s0+num(v))),a=jAn(R),m=num(R&&R.d&&R.d.mois)||12;return s1+' j/semaine · ≈ '+Math.round(a.n+(s1-s0)*52*m/12).toLocaleString(tag())+' jours par an';};
    DJ.__c311=true;}}catch(e){}
  /* C301 (V15-126) : « Premium » n'existe pas dans les offres (Pilotage, Pro) : le bandeau de Simuler dit « VERDICT · … » */
  try{var PU=w.DEC_PREMIUM_UI;if(PU)for(var lg in PU)if(PU[lg]&&typeof PU[lg].tag==='string')PU[lg].tag=PU[lg].tag.replace(/^VERDICT PREMIUM\s*·\s*/,'VERDICT · ');}catch(e){}
  /* C301 (V15-140) : le poste le plus lourd des charges fixes est un montant mensuel, et il est dit */
  if(typeof w.point11Decision==='function'&&!w.point11Decision.__c301){var p11b=w.point11Decision;w.point11Decision=function(){var r=p11b.apply(this,arguments);try{(r&&r.items||[]).forEach(function(it){if(it&&typeof it.detail==='string')it.detail=it.detail.replace(/(Le poste le plus lourd est « [^»]+ » \()([^)]*\d\s?€)\)/,'$1$2 par mois)');});}catch(e){}return r;};for(var kp in p11b)if(Object.prototype.hasOwnProperty.call(p11b,kp))w.point11Decision[kp]=p11b[kp];w.point11Decision.__c301=true;}
  /* C301 (V15-069) : la décision enregistrée depuis Simuler apparaît tout de suite dans le registre (au-dessus), rattachée à
     l'établissement affiché, et le texte ne renvoie plus vers des écrans absents du menu. */
  if(typeof w.decEnDecision==='function'&&!w.decEnDecision.__c301){var ed=function(){
    var T=null;try{T=w.decImpactTotal();}catch(e){}
    if(!T||!T.n){try{w.toast('Modifiez d’abord un levier');}catch(e){}return;}
    var lib=String(w.decNomScenario()||'Scénario simulé');lib=lib.charAt(0).toUpperCase()+lib.slice(1);
    /* C311 (V16-060) : le geste lui-même est écrit dans la décision (« Panier moyen +0,30 € ») */
    try{var gestes=[];w.DEC_DEFS.forEach(function(dd){var v=w.DEC_STATE[dd.id];if(v!=null&&num(v)!==num(dd.def))gestes.push(dd.t+' '+dd.fmt(v));});if(gestes.length&&lib.indexOf(gestes[0])<0)lib+=' : '+gestes.join(' · ');}catch(e){}
    w.ask('En faire une décision ?',lib+'\u00a0— gain estimé '+(T.delta>=0?'+':'−')+eur(Math.abs(T.delta))+' par an. Verdict l’inscrit dans le registre des décisions, en haut de Simuler. Pour en mesurer le résultat, lancez ensuite une seule action depuis « À faire » : sa source et sa date de contrôle seront figées. Vos chiffres ne sont pas modifiés.','Enregistrer',function(){
      var D=w.DB;D.decisions=D.decisions||[];var eid=(D._demo&&D._demo.establishmentId)||(typeof w.point12EstablishmentId==='function'?w.point12EstablishmentId():'');
      D.decisions.push({version:'10.12',kind:'scenario',status:'recorded',date:new Date().toISOString().slice(0,10),id:'SIMU_'+Date.now(),lib:lib,est:Math.round(T.delta),profile:String(D.etabType||''),establishmentId:String(eid||'')});
      try{w.save();}catch(e){}
      try{var r=document.getElementById('decRegistre');if(r&&typeof w.decisionsRegistreHTML==='function'){var t=document.createElement('div');t.innerHTML=w.decisionsRegistreHTML();if(t.firstChild)r.parentNode.replaceChild(t.firstChild,r);}}catch(e){}
      try{w.toast('Décision enregistrée : elle est dans le registre des décisions, en haut de Simuler');}catch(e){}
      try{w.decDrawTotal(true);}catch(e){}
    });};ed.__c301=true;w.decEnDecision=ed;}
  w.decImpact=function(id,v){
    var R0=w.moteur();if(!R0.ready)return null;var s={};s[id]=v;var R1=w.moteur(overAll(s));
    return {R0:R0,R1:R1,before:R0.d.res,after:R1.d.res,delta:R1.d.res-R0.d.res,score0:R0.score,score1:R1.score,rn0:R0.v.rn,rn1:R1.v.rn};
  };
  /* Priorités « Votre potentiel » et le paquet de Simuler : le même plan, les mêmes montants */
  w.potentiel=function(){
    var P=plan();if(!P)return null;var b=P.base;
    var lev=P.retenus.map(function(x){var o={};o[x.id]=x.v;var M=w.moteur(overAll(o)),dd=def(x.id);
      return {n:dd?dd.t:x.id,de:'',vers:dd?dd.fmt(x.v):String(x.v),act:x.how,gain:(isFinite(x.gain)?x.gain:M.d.res-b.res),pts:M.score-b.score,sc:M.score,over:o,livraison:x.id==='com',id:x.id,why:x.why};})
      .filter(function(x){return x.gain>1||x.pts>0;});
    lev.sort(function(a,c){return c.gain-a.gain;});
    return {base:b.score,baseRes:b.res,leviers:lev,max:{score:P.central.score,res:P.central.res},state:P.state,realiste:P};
  };
  /* C301 bis (panier exact, suite) : le moteur arrondit le panier HT au centime (marches de CA de plusieurs centaines d'euros) ;
     l'impact du levier panier et le total de Simuler lisent donc la règle unique (verdictGainPanier), comme l'Audit. */
  if(!w.decImpact.__c301){var di0=w.decImpact;w.decImpact=function(id,v){var r=di0.apply(this,arguments);try{if(r&&id==='panier'&&num(v)&&typeof w.verdictGainPanier==='function'){var g=w.verdictGainPanier(num(v),r.R0);if(g&&isFinite(g.gain)){r.delta=g.gain;r.after=r.before+g.gain;}}}catch(e){}return r;};w.decImpact.__c301=true;}
  if(typeof w.decImpactTotal==='function'&&!w.decImpactTotal.__c301){var dt0=w.decImpactTotal;w.decImpactTotal=function(){var t=dt0.apply(this,arguments);try{var vP=etat(w.DEC_STATE,'panier');if(t&&isFinite(t.delta)&&vP&&typeof w.verdictGainPanier==='function'){var R0=w.moteur(),seul=w.moteur(overAll({panier:vP})).d.res-R0.d.res,g=w.verdictGainPanier(vP,R0);if(g&&isFinite(g.gain)){t.delta+=g.gain-seul;t.after=t.before+t.delta;}}}catch(e){}return t;};w.decImpactTotal.__c301=true;}
  /* C311 (V16-068, décision du chef) : la barre « N leviers modifiés » réserve sa place, à sa hauteur réelle (suivie en continu),
     et l'Indice « après » d'un levier suit l'échelle des zones, comme la barre (jamais 59 vert d'un côté et orange de l'autre). */
  (function(){var obs=null;function caler(){try{var bar=document.getElementById('decTotalBar'),view=document.getElementById('v-dec'),h=bar&&bar.classList.contains('on')?Math.round(bar.getBoundingClientRect().height||0):0;
      if(view)view.style.paddingBottom=h?(h+28)+'px':'';document.documentElement.style.scrollPaddingBottom=h?(h+16)+'px':'';
      if(bar&&!obs&&typeof w.ResizeObserver==='function'){obs=new w.ResizeObserver(caler);obs.observe(bar);try{new w.MutationObserver(caler).observe(bar,{attributes:true,attributeFilter:['class']});}catch(e){}}}catch(e){}}
    function brancher(){var ok=true;
      if(typeof w.decPadFix==='function'){if(!w.decPadFix.__c311){var pf=w.decPadFix;w.decPadFix=function(){var r=pf.apply(this,arguments);caler();return r;};w.decPadFix.__c311=true;}}else ok=false;
      if(typeof w.decRender==='function'){if(!w.decRender.__c311){var dr=w.decRender;w.decRender=function(id,v){var r=dr.apply(this,arguments);try{var sc=document.getElementById('da-sc-'+id);if(sc&&typeof w.zone==='function'){var I=w.decImpact(id,v);if(I&&isFinite(I.score1))sc.style.setProperty('color',w.zone(I.score1).h,'important');}}catch(e){}return r;};w.decRender.__c311=true;}}else ok=false;
      return ok;}
    if(!brancher()&&typeof w.setInterval==='function'){var k=0,iv=w.setInterval(function(){if(brancher()||++k>40)w.clearInterval(iv);},250);}})();
  /* C311 (V16-060, V16-084) : le bouton du registre porte le nom du menu (« À faire et alertes »), pas un écran absent */
  if(typeof w.decisionsRegistreHTML==='function'&&!w.decisionsRegistreHTML.__c311){var drh=w.decisionsRegistreHTML;w.decisionsRegistreHTML=function(){var h=drh.apply(this,arguments);try{if(typeof h==='string')h=h.replace('>Voir les priorités<','>Voir À faire et alertes<');}catch(e){}return h;};w.decisionsRegistreHTML.__c311=true;}
  w.decPotentialState=function(P){var s={},src=(P&&P.state)||{};for(var k in src)s[k]=src[k];s.jour=0;return s;};
  /* C311 (V16-009) : le registre de Simuler reprend le point de départ (même montant, mêmes leviers) et l'écart matière de l'Audit
     (le levier « coût de la nourriture » du plan s'il est retenu, sinon l'écart entier, non compté dans le gain). */
  if(typeof w.decisionsRegistre==='function'&&!w.decisionsRegistre.__c311){var dr0=w.decisionsRegistre;w.decisionsRegistre=function(){var G=dr0.apply(this,arguments);
    try{if(G&&G.aExaminer){var P=plan(),L=G.aExaminer;if(P&&P.state){var gain=Math.round(num(P.central&&P.central.res)-num(P.base&&P.base.res)),noms=[];
      Object.keys(P.state).filter(function(k){return P.state[k];}).sort(function(a,b){return ORDER.indexOf(a)-ORDER.indexOf(b);}).forEach(function(k){var d=def(k);if(d)noms.push(d.t+' '+d.fmt(P.state[k]));});
      L.forEach(function(x){var r=x&&x.reco;if(!r||r.id!=='FOOD_GAP_VERIFY')return;var g=null;try{var T13=titreEcart(ecartMatiere());if(T13)r.t=T13;}catch(e){}
        if(P.state.fc||P.state.boi){try{var s9={};if(P.state.fc)s9.fc=P.state.fc;if(P.state.boi)s9.boi=P.state.boi;var M=w.moteur(overAll(s9));g=Math.round(M.d.res-num(P.base.res));}catch(e){}}
        if(!(g>0)){var E=w.VerdictEcartMatiere?w.VerdictEcartMatiere():null;if(E&&E.eur>0)g=Math.round(E.eur);}
        if(g>0)r.imp=g;});
      /* C311 (V16-018) : jamais « Impact estimé : 0 € par an » ; un constat sans levier chiffré est dit comme tel */
      L.forEach(function(x){var r=x&&x.reco;if(r&&r.imp!=null&&!(Math.abs(num(r.imp))>=1)){r.imp=null;r.t=String(r.t||'')+' — constat : pas de montant chiffré, le levier se choisit dans Simuler';}});
      if(gain>0&&noms.length&&!L.some(function(x){return x&&x.reco&&x.reco.id==='SIMU_DEPART';})){var c0=L[0]&&L[0].reco&&L[0].reco.conf;
        L.unshift({reco:{id:'SIMU_DEPART',t:'Point de départ de Simuler : '+noms.join(' · '),imp:gain,conf:c0!=null?c0:null},etat:'a-examiner'});G.compte.e=L.length;}}}}catch(e){}
    return G;};w.decisionsRegistre.__c311=true;}
  w.decBest=decBest;
  if(typeof w.point11Decision==='function'&&!w.point11Decision.__c91){var p11=w.point11Decision;w.point11Decision=function(db){var r=p11.apply(this,arguments);try{sansVolume(r);}catch(e){}try{aligner(r,db);}catch(e){}return r;};w.point11Decision.__c91=true;}
  w.decScenarioPersist=persist;
  if(typeof w.decScenarioEnsure==='function'&&!w.decScenarioEnsure.__c90){w.decScenarioEnsure=restaurer(w.decScenarioEnsure);w.decScenarioEnsure.__c90=true;}
  var origRecap=w.decDrawRecap;
  if(typeof origRecap==='function'&&!origRecap.__c90){w.decDrawRecap=function(){var r=origRecap.apply(this,arguments);try{noteRecap();}catch(e){}return r;};w.decDrawRecap.__c90=true;}
  var origRender=w.decRender;
  if(typeof origRender==='function'&&!origRender.__c88){w.decRender=function(id,v){var r=origRender.apply(this,arguments);try{noteLevier(id,v);autresNotes(id);}catch(e){}return r;};w.decRender.__c88=true;}
  var origTotal=w.decDrawTotal;
  if(typeof origTotal==='function'&&!origTotal.__c206){w.decDrawTotal=function(){var r=origTotal.apply(this,arguments);try{panneau();}catch(e){}return r;};w.decDrawTotal.__c206=true;}
}
/* C206 (V25) — la borne d'un curseur dépend des autres curseurs réellement actifs, plus de la proposition de Verdict :
   un panier à +0,20 € seul n'est plus « au-delà du réaliste » parce que la proposition, elle, ne l'utilisait pas.
   Règle inchangée : chaque levier reste borné par le repère du format, et l'ensemble ne dépasse pas la rentabilité
   des meilleurs établissements du format. Le moteur n'est rejoué que si l'ensemble des curseurs dépasse ce niveau. */
var MONTE={panier:1,cmd:1,carte:1},BAISSE={sal:1,fc:1,boi:1,fix:1,com:1,emb:1}/* C318 : le coût des boissons (décision 13) compte aussi dans les bornes des curseurs */,BD={k:null,m:{}};
function rnDe(st){var k=JSON.stringify(st);if(BD.k!==cle()){BD={k:cle(),m:{}};}if(BD.m[k]==null)BD.m[k]=w.moteur(overAll(st)).v.rn;return BD.m[k];}
/* Comme la proposition : les leviers sont pris dans l'ordre (ce qui dépend le plus du client d'abord) ; un levier n'est
   borné que par ceux qui le précèdent, et seul celui qui fait dépasser le niveau des meilleurs établissements est signalé. */
function actifs(state,sauf){var o={},n=0,rang=sauf==null?99:ORDER.indexOf(sauf);for(var k in state){if(k===sauf||!(MONTE[k]||BAISSE[k]))continue;if(sauf!=null&&!(ORDER.indexOf(k)<rang))continue;var x=num(state[k]);if(x){o[k]=x;n++;}}return {st:o,n:n};}
function borneDyn(id,state,P){
  var cap=num(P&&P.bornesLevier[id]),haut=P.plafond.rn,out={b:cap,cap:cap,reduit:false,rnAutres:null,nAutres:0};
  if(!cap||!(P.base.rn<haut))return out;
  var A=actifs(state||{},id),t={};for(var q in A.st)t[q]=A.st[q];out.nAutres=A.n;t[id]=cap;
  if(rnDe(t)<=haut+1e-9)return out;
  var dd=def(id),pas=dd&&dd.step?dd.step:1,sg=cap<0?-1:1,lo=0,hi=Math.floor(Math.abs(cap)/pas+1e-9);
  while(hi-lo>1){var mi=Math.floor((lo+hi)/2);t[id]=Math.round(sg*mi*pas*100)/100;if(rnDe(t)<=haut+1e-9)lo=mi;else hi=mi;}
  out.b=Math.round(sg*lo*pas*100)/100;out.reduit=true;out.rnAutres=rnDe(A.st);return out;
}
function depasse(id,v,P,state){
  v=num(v);if(!P||!(MONTE[id]||BAISSE[id])||!v)return false;
  var cap=num(P.bornesLevier[id]);
  if(MONTE[id]&&v>cap+1e-9)return true;if(BAISSE[id]&&v<cap-1e-9)return true;
  var s={};for(var k in (state||{}))s[k]=state[k];s[id]=v;var A=actifs(s,null);
  if(!(P.base.rn<P.plafond.rn)||rnDe(A.st)<=P.plafond.rn+1e-9)return false;
  var b=borneDyn(id,s,P).b;return MONTE[id]?v>b+1e-9:v<b-1e-9;
}
function horsBornes(state){var P=plan(),o=[];if(!P||!state)return o;for(var k in state)if(depasse(k,state[k],P,state))o.push(k);return o;}
function phrase(id,P,B){
  var R=P.R,d=R.d,v=R.v,F=P.format,fam=F.fam,fmt=F.fmt,t=F.type?'des établissements « '+F.type+' »':'de la restauration traditionnelle',dd=def(id);
  B=B||{b:num(P.bornesLevier[id]),reduit:false};var b=B.b,t2=t.replace(/^des établissements /,''),meilleurs=pc(P.plafond.rn,0)+', le niveau des meilleurs établissements '+t2;
  var au=!B.reduit?(b?'Verdict compte au plus '+dd.fmt(b)+'.':'Verdict ne compte aucun gain ici.')
    :(b?'Avec vos autres leviers, Verdict compte au plus '+dd.fmt(b)+' : au-delà, la rentabilité dépasserait '+meilleurs+'.'
       :'Verdict n’en compte pas davantage : avec vos autres leviers, la rentabilité est déjà de '+pc(B.rnAutres,1)+(B.rnAutres>=P.plafond.rn?', au-delà de ':' ; ce levier la ferait dépasser ')+meilleurs+'.');
  var fin=B.reduit?'':' Au-delà, ce n’est plus réaliste.';
  if(id==='cmd')return 'Vous servez '+String(Math.round(num(d.cmdj)*10)/10).replace('.',',')+' commandes par jour. La fréquentation ne se décide pas : Verdict ne propose jamais ce levier. Ce curseur reste une hypothèse à vérifier ; la matière et les commissions suivent.';
  if(B.reduit&&id==='carte')return 'Verdict relève les prix d’au plus '+CARTE_CAP+' %, sans dépasser le plat le plus cher de la catégorie. '+au;
  /* C311 (V16-032) : une seule phrase pour une seule règle (« +2 % de votre propre panier, soit +0,30 € ») */
  if(id==='panier')return 'Votre panier moyen est de '+fr2(d.panierTTC)+' € ; Verdict compte au plus +'+Math.round(PANIER_PCT*100)+' % de votre propre panier'+(!B.reduit&&b?', soit '+dd.fmt(b)+'.':'. '+au)+fin;
  if(id==='carte')return 'Verdict relève les prix d’au plus '+CARTE_CAP+' %, sans dépasser le plat le plus cher de la catégorie.'+fin;
  if(id==='sal')return 'Votre équipe coûte '+pc(v.ms)+' du chiffre d’affaires ; repère Verdict '+t+' : '+pc(fam.ms[1],0)+'. '+au+fin;
  /* C318 (SIM) : la règle du levier matière est écrite là où il est borné : un tiers de l'écart de chaque poste, par pas de 0,5 point */
  if(id==='fc')return 'Votre coût de nourriture (hors boissons) est de '+pc(v.fc)+' du CA ; repère Verdict '+t+' : '+pc(fam.fc[1],0)+'. Verdict retient un tiers de l’écart, par pas de 0,5 point. '+au+fin;
  if(id==='boi'){var Eb=null;try{Eb=ecartMatiere(R);}catch(e){}return (Eb&&Eb.boi?'Vos achats de boissons pèsent '+pc(Eb.boi.reel)+' du CA, vos fiches '+pc(Eb.boi.theo)+'. ':'')+'Verdict retient un tiers de l’écart des boissons, par pas de 0,5 point. '+au+fin;}
  if(id==='fix')return 'Vos charges fixes pèsent '+pc(v.acf)+' du chiffre d’affaires ; repère Verdict '+t+' : '+pc(fam.acf[1],0)+'. '+au+fin;
  if(id==='com')return 'Verdict compte au plus −10 % de commissions, en passant une partie des commandes en retrait.'+fin;
  if(id==='emb')return 'Verdict compte au plus −10 % sur ces achats.'+fin;
  return '';
}
function noteLevier(id,v){
  var box=document.getElementById('dr-'+id);if(!box)return;var n=document.getElementById('c88-note-'+id);
  var P=plan(),msg='',st={};v=num(v);for(var k in (w.DEC_STATE||{}))st[k]=w.DEC_STATE[k];st[id]=v;
  if(id==='jour'&&v)msg='Un jour de plus : Verdict compte '+Math.round(JOUR_DEMANDE*100)+' % d’une journée moyenne, avec l’équipe nécessaire.';
  else if(P&&depasse(id,v,P,st))msg=phrase(id,P,borneDyn(id,st,P));
  if(!msg){if(n)n.remove();return;}
  if(!n){n=document.createElement('p');n.id='c88-note-'+id;n.className='note c88-note';box.appendChild(n);}
  n.textContent=msg;
}
function autresNotes(id){(w.DEC_DEFS||[]).forEach(function(d){if(d.id===id||d.id==='jour')return;var v=num(w.DEC_STATE&&w.DEC_STATE[d.id]);if(v||document.getElementById('c88-note-'+d.id))noteLevier(d.id,v);});}
/* C206 (V27) — le panneau flottant du total ne recouvre plus la lecture guidée : il se retire tant qu'elle est à l'écran
   (elle montre les mêmes chiffres et les mêmes boutons), et revient dès qu'on la quitte. */
function panneau(){
  var bar=document.getElementById('decTotalBar');if(!bar)return;var sc=document.getElementById('decScene'),cache=false;
  if(sc&&w.VIEW==='dec'&&bar.classList.contains('on')){var a=sc.getBoundingClientRect(),h=bar.getBoundingClientRect();cache=a.height>0&&a.bottom>h.top-8&&a.top<h.bottom;}
  /* C318 (T4, G02) : la barre se retire aussi tant que « Le total de vos changements » passe dessous (mêmes chiffres, mêmes boutons) :
     elle ne recouvre plus jamais son encadré (« Gain mécanique limité », « Perte mécanique »). */
  var tot=document.getElementById('decTotal');
  if(!cache&&tot&&w.VIEW==='dec'&&bar.classList.contains('on')){var a2=tot.getBoundingClientRect();cache=a2.height>0&&a2.bottom>hautBarre(bar)-8&&a2.top<w.innerHeight;}
  if(bar.classList.contains('c206-retire')!==cache)bar.classList.toggle('c206-retire',cache);
}
/* C318 (T4, G02) : après un geste sur un curseur, l'encadré de ce levier (gain et avis) ne reste jamais sous la barre :
   la page remonte juste assez, sans jamais cacher le haut de la carte. */
/* le haut de la barre à sa place de repos (bas de l'écran − son écart − sa hauteur), même pendant qu'elle glisse */
function hautBarre(bar){var bb=bar.getBoundingClientRect(),bo=0;try{bo=parseFloat(w.getComputedStyle(bar).bottom)||0;}catch(e){}return w.innerHeight-bo-(bb.height||0);}
function montrerLevier(id){
  var bar=document.getElementById('decTotalBar');if(!bar||!bar.classList.contains('on')||bar.classList.contains('c206-retire')||w.VIEW!=='dec')return;
  var el=document.getElementById('da-vd-'+id)||document.getElementById('da-gain-'+id),card=el&&el.closest?el.closest('[data-dec]'):null;if(!el)return;
  /* la phrase de borne écrite sous l'encadré (« Vous servez … ») compte aussi */
  var note=document.getElementById('c88-note-'+id),r=el.getBoundingClientRect(),haut=hautBarre(bar)-12;if(note){var rn=note.getBoundingClientRect();if(rn.height>0&&rn.bottom>r.bottom)r={top:r.top,bottom:rn.bottom,height:rn.bottom-r.top};}
  if(!(r.height>0)||r.bottom<=haut||r.top>=w.innerHeight)return;
  var dy=r.bottom-haut;if(card){var c=card.getBoundingClientRect();dy=Math.min(dy,Math.max(0,c.top-80));}
  if(dy>0){var red=false;try{red=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}w.scrollBy({top:dy,behavior:red?'auto':'smooth'});}
}
/* jamais pendant qu'on fait glisser un curseur (le curseur fuirait sous le doigt) : au relâchement, 350 ms après le dernier geste */
(function(){var k=0,appui=false,attente=null,minu=null;function lancer(){if(appui||attente==null)return;var id=attente;attente=null;try{panneau();montrerLevier(id);}catch(e){}}
  try{document.addEventListener('pointerdown',function(){appui=true;},true);['pointerup','pointercancel'].forEach(function(t){document.addEventListener(t,function(){appui=false;if(minu)clearTimeout(minu);minu=setTimeout(lancer,350);},true);});}catch(e){}
  function br(){if(typeof w.decMove!=='function')return false;if(!w.decMove.__c318){var dm=w.decMove;w.decMove=function(id){var r=dm.apply(this,arguments);try{attente=id;try{panneau();}catch(e){}if(minu)clearTimeout(minu);minu=setTimeout(lancer,350);}catch(e){}return r;};w.decMove.__c318=true;}return true;}
  if(!br()&&typeof w.setInterval==='function'){var iv=w.setInterval(function(){if(br()||++k>40)w.clearInterval(iv);},250);}})();
var PAN=0;w.addEventListener('scroll',function(){if(PAN)return;PAN=1;(w.requestAnimationFrame||setTimeout)(function(){PAN=0;try{panneau();}catch(e){}});},{passive:true});
w.addEventListener('resize',function(){try{panneau();}catch(e){}},{passive:true});
/* Enregistrement : on garde la version et l'origine du scénario (proposition de Verdict ou curseurs du client). */
var SCEN='C90';
function persist(reason){
  var D=w.DB;if(!D)return;w.DEC_SCENARIO_CONTEXT=D;var K=w.DEC_SCENARIO_DB_KEY;
  if(!w.decNbActifs(w.DEC_STATE)){delete D[K];w.decDurableWrite('scenario',null);}
  else{D[K]={version:1,realiste:SCEN,origin:horsBornes(w.DEC_STATE).length?'client':'verdict',state:w.decScenarioState(w.DEC_STATE),label:(w.DEC_SCENE_LAST&&w.DEC_SCENE_LAST.label)||w.decPremiumUI().calculated,updatedAt:new Date().toISOString()};
    if(w.decDurableDemo())w.decDurableWrite('scenario',JSON.stringify(D[K]));}
  try{w.save(reason||'decision-scenario');}catch(e){}
}
/* Restauration : un scénario d'avant C90 ou une proposition de Verdict qui dépasse désormais les bornes est remplacé
   par la proposition réaliste du jour ; un scénario construit par le client reste le sien. */
function restaurer(orig){
  return function(){
    var avant=w.DEC_SCENARIO_CONTEXT,r=orig.apply(this,arguments);
    try{
      if(!w.DB||avant===w.DB)return r;var saved=w.DB[w.DEC_SCENARIO_DB_KEY];
      if(!saved&&w.decDurableDemo()){try{saved=JSON.parse(w.decDurableRead('scenario')||'null');}catch(e){saved=null;}}
      if(!saved||!saved.state||!horsBornes(w.DEC_STATE).length)return r;
      if(saved.realiste===SCEN&&saved.origin==='client')return r;
      var P=plan();
      if(P&&P.retenus.length){w.DEC_STATE=w.decPotentialState(P);w.DEC_SCENE_LAST=w.decSceneSnapshot(w.moteur(),w.decPremiumUI().calculated);}
      else{w.DEC_STATE={};w.DEC_SCENE_LAST=null;}
      w.DEC_BEST_PENDING=null;persist('decision-scenario-realiste');
    }catch(e){}
    return r;
  };
}
/* Récapitulatif : une phrase si le client a dépassé le réaliste, avec la seule référence (la proposition de Verdict). */
function noteRecap(){
  var box=document.querySelector('#decTotal .dec-rec');if(!box)return;var n=document.getElementById('c90-recap'),P=plan(),h=P?horsBornes(w.DEC_STATE):[];
  if(!h.length){if(n)n.remove();return;}
  if(!n){n=document.createElement('p');n.id='c90-recap';n.className='note c88-note';var vd=document.getElementById('rc-vd');box.insertBefore(n,vd||null);}
  n.textContent='Vous avez poussé '+(h.length>1?h.length+' curseurs':'un curseur')+' au-delà du réaliste : ce total n’est plus la proposition de Verdict, qui est de '+signe(P.central.gain)+' par an.';
}

/* C91 — Priorités et Audit : le montant d'une action est celui que Simuler calcule pour le même levier, avec le même moteur
   (une seule base). La règle reste la même (un tiers de l'écart au repère du format) ; seul le calcul passe par moteur(). */
var ACTIONS={STAFF_COST_HIGH:['sal'],CHARGES_AUTRES_HIGH:['fix'],PANIER_LOW:['panier'],COMMANDES_LOW:['cmd'],VARIABLE_COST_HIGH:['fc','emb','com']};
/* C218 (W70) : l'action « attirer plus de commandes » n'est pas une décision du patron ; elle sort des priorités. */
function sansVolume(res){
  if(!res||!Array.isArray(res.items))return;var avant=res.items.length;res.items=res.items.filter(function(it){return !it||it.id!=='COMMANDES_LOW';});if(res.items.length===avant)return;
  var vol=function(x){return x&&(x.id==='COMMANDES_LOW'||x==='COMMANDES_LOW');};
  if(vol(res.top))res.top=res.items[0]||null;if(vol(res.next))res.next=res.items.filter(function(x){return x!==res.top;})[0]||null;
}
/* C311 (décision 13) : l'intitulé de l'écart matière nomme le poste en cause (nourriture, boissons, ou les deux) */
function titreEcart(E){if(!E||!E.nour)return null;var n=E.nour.pts>=1,b=E.boi&&E.boi.pts>=1;
  if(n&&b)return 'Vous achetez plus de nourriture et de boissons que vos ventes n’en utilisent';if(b)return 'Vous achetez plus de boissons que vos ventes n’en utilisent';return null;}
function aligner(res,db){
  if(!res||!res.items||!res.items.length)return;var keep=w.DB,swap=db&&db!==w.DB;if(swap)w.DB=db;
  try{
    try{var T13=titreEcart(ecartMatiere());if(T13)res.items.forEach(function(it){if(it&&it.id==='FOOD_GAP_VERIFY')it.diagnosis=T13;});}catch(e){}
    var P=plan();if(!P)return;var base=P.base.res,lv={};P.leviers.forEach(function(x){lv[x.id]=x.v;});
    /* C301 bis (B10) : la valeur retenue par le plan (réduite pour ne pas dépasser le niveau des meilleurs) : le même montant que Simuler et l'Audit */
    for(var ks in P.state)if(P.state[ks])lv[ks]=P.state[ks];if(P.bornesLevier.panier&&lv.panier==null)lv.panier=P.bornesLevier.panier;
    res.items.forEach(function(it){var ids=ACTIONS[it.id],imp=it.impact;if(!ids||!imp||imp.kind!=='scenario_gain')return;
      var st={},n=0;ids.forEach(function(id){if(lv[id]){st[id]=lv[id];n++;}});if(!n)return;
      var g=Math.round(w.moteur(overAll(st)).d.res-base);if(!(g>0))return;
      imp.annual=g;imp.amount=g;imp.monthly=Math.round(g/12);
      if(imp.assumption&&imp.assumption.indexOf('Simuler')<0)imp.assumption+=' Montant rejoué par le moteur Verdict, identique au curseur de Simuler.';});
  }finally{if(swap)w.DB=keep;}
}

/* ── Point de départ de Simuler ── */
function chips(state){
  return Object.keys(state).filter(function(k){return state[k];}).sort(function(a,b){return ORDER.indexOf(a)-ORDER.indexOf(b);}).map(function(k){var d=def(k);return d?'<b>'+d.icon+' '+esc(d.t)+' '+esc(d.fmt(state[k]))+'</b>':'';}).join(' · ');
}
function decBest(){
  var out=document.getElementById('dec-best-out');if(!out)return;
  var R0=w.moteur();if(!R0||!R0.ready)return;var U=w.decPremiumUI(),P=plan();if(!P)return;
  var cur={};w.DEC_DEFS.forEach(function(d){cur[d.id]=(w.DEC_STATE[d.id]!=null)?w.DEC_STATE[d.id]:d.def;});
  var had=w.decNbActifs(cur)>0,target={},nb=0;
  if(!had){for(var k in P.state){target[k]=P.state[k];nb++;}}
  else{for(var j in cur)target[j]=cur[j];
    for(var id in P.state){var pv=P.state[id],cv=num(cur[id]);if((pv>0&&cv<pv)||(pv<0&&cv>pv)){target[id]=pv;nb++;}}}
  if(!nb){w.DEC_BEST_PENDING=null;out.innerHTML='<p class="note">'+(had?'Vos curseurs atteignent déjà la proposition réaliste de Verdict'+(P.format.type?' pour votre format ('+esc(P.format.type)+')':'')+'. Au-delà, ce n’est plus réaliste.':esc(U.none))+'</p>';return;}
  var Rb=w.moteur(overAll(cur)),Rt=w.moteur(overAll(target)),delta=Rt.d.res-Rb.d.res;
  w.DEC_BEST_PENDING={paquet:!had,starting:!had,state:target,nb:nb,score:Rt.score,res:Rt.d.res,delta:delta,rn:Rt.v.rn,pv:0,fv:0,sv:0};
  var h='<div class="c88-best">'+
    '<div style="font-size:13px;margin-bottom:8px">'+(had?U.added:U.calculated)+' : '+chips(had?diff(cur,target):target)+'</div>'+
    '<div class="c88-amount"><span>Gain réaliste</span><strong>'+signe(delta/12)+' <small>/ mois</small></strong><em>'+signe(delta)+' / an</em></div>'+
    '<div class="autoline"><span class="k">'+U.result+'</span><b>'+eur(Rt.d.res)+'</b></div>'+
    '<div class="autoline"><span class="k">'+U.score+'</span><b>'+Rt.score+' /100 ('+(Rt.score-Rb.score>=0?'+':'')+(Rt.score-Rb.score)+')</b></div>'+
    '<div class="autoline"><span class="k">'+U.profit+'</span><b>'+pc(Rt.v.rn,1)+' <small>sur un CA de '+eur(Rt.d.ca)+'</small></b></div>'+/* C301 (V15-041) CA écrit */
    (!had&&P.plafond.atteint?'<p class="note">Verdict ne propose pas d’aller au-delà de '+pc(P.plafond.rn,0)+' de résultat, le niveau des meilleurs établissements de votre format'+(P.format.type?' ('+esc(P.format.type)+')':'')+'.</p>':'')+
    (P.attente.length&&!had?'<p class="note">'+P.attente.map(function(x){return 'Coût humain : jusqu’à '+signe(x.gain)+' / an possibles, proposés seulement après une décision d’organisation mesurée (onglet Équipe).';}).join(' ')+'</p>':'')+
    '<p class="note" style="margin:6px 0 0">Chaque levier est borné par les repères de votre format'+(P.format.type?' ('+esc(P.format.type)+')':'')+' ; une vente en plus consomme de la matière et des commissions, une hausse de prix à clients constants seulement des commissions (et la TVA) ; le nombre de clients n’est jamais compté comme un levier ; tout est recalculé ensemble, sans rien compter deux fois.</p>'+
    '<div style="margin-top:9px;padding-top:9px;border-top:1px solid var(--line)"><div style="font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:#93c5fd">'+U.proof+'</div><p class="note" style="margin:4px 0 0">'+U.proofD+'</p></div>'+
    '<button class="btn sec" style="margin-top:10px" onclick="decApplyBest()">'+(had?U.applyAdd:U.applyStart)+'</button></div>';
  out.innerHTML=h;
}
function diff(a,b){var o={};for(var k in b)if(num(b[k])!==num(a[k]))o[k]=b[k];return o;}

/* ── Audit 2-en-1 : le gain fusionné structure + carte ── */
function lignes(P){
  return P.retenus.map(function(x){var d=def(x.id);
    return '<div class="au-ok c88-step"><span style="flex:1"><b>'+esc(d?d.icon+' '+d.t:x.id)+' · '+esc(d?d.fmt(x.v):'')+'</b><br><span style="color:var(--mut)"><b>Pourquoi</b> : '+esc(x.why)+'<br><b>Comment</b> : '+esc(x.how)+'<br>Contrôle '+esc(x.ctrl)+'</span></span><b class="c88-eur">'+signe(x.gain/12)+'<small> / mois</small><br><small>'+signe(x.gain)+' / an</small></b></div>';
  }).join('');
}
function chapitreHTML(P){
  var cf=P.carteFiable,c=P.central;
  return '<div class="au-sc vu" id="auGainReel"><div class="au-tag">Le gain réaliste · structure + carte</div>'+
    /* C311 (V16-030) : jamais « +0 € par mois, soit +0 € par an » : la raison est écrite */
    (c.gain>0.5?'<h2 class="au-h">'+signe(c.mois)+' par mois, soit '+signe(c.gain)+' par an</h2>':'<h2 class="au-h">Pas de gain chiffré à ce stade</h2><p class="au-p">'+(inp('panier')>0?'Aucun levier ne dépasse les repères de votre format : Verdict ne compte pas de gain qu’il ne peut pas tenir.':'Vos tickets ne sont pas encore connus (aucun ticket lu dans votre caisse) : le panier et les commandes se chiffrent dès que votre caisse est importée.')+'</p>')+
    /* C301 (V15-032, suite) : la décision annoncée au chapitre 4 (l'équipe) n'est pas dans ce montant tant qu'elle n'est pas mesurée */
    (P.attente.length&&(function(){try{var a=w.auActions()[0];return a&&ACTIONS[a.id]&&ACTIONS[a.id].indexOf('sal')>=0;}catch(e){return false;}})()?'<p class="au-p"><b>La décision du chapitre précédent, l’équipe, n’est pas encore dans ce montant</b> : elle y entrera après une décision d’organisation mesurée (jusqu’à '+signe(P.attente[0].gain)+' par an). Ce montant vient des autres leviers.</p>':'')+
    '<p class="au-p">Un seul calcul, rejoué dans le moteur avec vos chiffres. Chaque levier est borné par les repères de votre format'+(P.format.type?' ('+esc(P.format.type)+')':' (repères généraux de la restauration traditionnelle)')+' (un tiers de l’écart au repère, comme vos priorités). Les étapes s’enchaînent : chaque montant est ce que le levier ajoute après les précédents, aucun euro n’est compté deux fois.</p>'+
    '<div class="au-card"><span class="au-k">Pas à pas</span>'+
      '<div class="au-ok"><span style="flex:1"><b>Résultat actuel</b></span><b>'+eur(P.base.res)+' · '+pc(P.base.rn)+'</b></div>'+lignes(P)+
      '<div class="au-ok"><span style="flex:1"><b>Résultat visé</b></span><b>'+eur(c.res)+' · '+pc(c.rn)+(c.ca?' d’un CA de '+eur(c.ca):'')+' · score '+c.score+'</b></div></div>'+
    (P.plafond.atteint?'<p class="note">Verdict ne propose pas d’aller au-delà de '+pc(P.plafond.rn,0)+' de résultat : c’est le niveau des meilleurs établissements de votre format'+(P.format.type?' ('+esc(P.format.type)+')':'')+'. Au-delà, ce ne serait plus réaliste.</p>':'')+
    '<div class="au-card"><span class="au-k">Ce qui n’est pas compté</span><p class="note" style="margin:0">'+
      [P.attente.length?'Le coût humain (jusqu’à '+signe(P.attente[0].gain)+' / an) : proposé seulement après une décision d’organisation mesurée.':'',
       'Les jours et horaires d’ouverture : leur faisabilité se décide dans Équipe.',
       cf?'':'La carte : complétez les fiches et les ventes (80 % du CA au moins) pour ajouter le gain plat par plat.',
       'La saison, la concurrence et le temps de mise en œuvre.'].filter(Boolean).join(' · ')+'</p></div>'+
    '<button type="button" class="btn" onclick="VerdictGainRealiste.ouvrirSimuler()">Ouvrir ce scénario dans Simuler</button></div>';
}
function sceneDecision(P){
  var c=P.central,top=P.retenus.slice().sort(function(a,b){return b.gain-a.gain;}).slice(0,3);
  return '<div class="av31-k">5 · LE GAIN RÉALISTE</div><h2>'+(P.retenus.length?'Ce que votre établissement peut vraiment gagner':'Aucun levier réaliste à ajouter')+'</h2>'+
    '<div class="av31-decision"><span>STRUCTURE'+(P.carteFiable?' + CARTE':'')+'</span><strong>'+signe(c.mois)+' / mois</strong><p>soit '+signe(c.gain)+' par an</p>'+
    (top.length?'<ul class="c88-top">'+top.map(function(x){var d=def(x.id);return '<li><span>'+esc(d?d.icon+' '+d.t:x.id)+'</span><b>'+signe(x.gain/12)+' / mois</b></li>';}).join('')+'</ul>':'')+'</div>'+
    '<div class="av31-final-actions"><button type="button" class="av31-primary" onclick="VerdictGainRealiste.ouvrirSimuler()">Ouvrir dans Simuler</button><button type="button" class="av31-secondary" onclick="VerdictGainRealiste.ouvrirDetail()">Pourquoi et comment</button></div>';
}
function patchAudit(){
  try{
    var el=document.getElementById('auditBody');if(!el)return;try{var R0=w.moteur();if(R0&&R0.ready)lectureResistance(el,R0);}catch(e){}
    /* C311 (V16-030) : FEC seul, aucun ticket lu : « inconnu », jamais 0 (Prix & panier, Productivité) */
    try{if(!(inp('panier')>0)){[].forEach.call(el.querySelectorAll('.au-sc'),function(sc){var tg=sc.querySelector('.au-tag'),tx=tg?tg.textContent:'';
      if(/Prix & panier/.test(tx)){var pp=sc.querySelector('.au-p');if(pp&&/Panier actuel/.test(pp.textContent))pp.textContent='Panier actuel : inconnu (aucun ticket lu dans votre caisse). Ce qu’un panier plus haut changerait se calcule dès que vos tickets sont connus.';
        [].forEach.call(sc.querySelectorAll('.au-eur'),function(e){if(/^\s*\+?\s*0\s*€/.test(e.textContent))e.textContent='à calculer : tickets inconnus';});}
      if(/Productivit/.test(tx))[].forEach.call(sc.querySelectorAll('.au-ok'),function(r){var s=r.querySelector('span'),b=r.querySelector('b');if(!s||!b)return;
        if(/^Commandes sur l/.test(s.textContent)&&/^0$/.test(b.textContent.trim()))b.textContent='inconnues : aucun ticket lu';
        if(/^Contribution \/ h/.test(s.textContent)&&/^0\s*€$/.test(b.textContent.trim()))b.textContent='à calculer : tickets inconnus';});});}}catch(e){}
    /* C311 (V16-014) : « Le résultat reste sous le repère » n'est écrit que si c'est vrai ; au-dessus du repère du format, la phrase le dit. */
    try{var R14=w.moteur(),rp14=w.verdictRepereRN?w.verdictRepereRN():null;if(R14&&R14.ready&&rp14&&R14.v.rn>=rp14.repere){var N14=w.verdictRepereRNNum||function(x){return String(x);};
      var tw14=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null),n14,L14=[];while((n14=tw14.nextNode()))if(n14.nodeValue.indexOf('Le résultat reste sous le repère de pilotage utilisé par Verdict.')>=0)L14.push(n14);
      L14.forEach(function(x){x.nodeValue=x.nodeValue.replace('Le résultat reste sous le repère de pilotage utilisé par Verdict.','Le résultat est au-dessus du repère de votre format ('+N14(rp14.repere)+' %) : ce point reste celui qui le limite.');});}}catch(e){}
    /* C301 bis (V15a-N2, V15-078) : jours inconnus → « à confirmer », jamais « 1 jours · 493 142 € » ; les rythmes sont HT */
    try{[].forEach.call(el.querySelectorAll('.au-ok > span'),function(sp){var t=sp.textContent||'',m=/^Par jour ouvert · (\d+) jours?$/.exec(t),b=sp.parentNode.querySelector('b');
      if(m){if(Number(m[1])<=1){sp.textContent='Par jour ouvert';if(b)b.textContent='à confirmer : jours d’ouverture inconnus';}else sp.textContent='Par jour ouvert (HT) · '+m[1]+' jours';}
      else if(/^Par mois actif · /.test(t))sp.textContent=t.replace(/^Par mois actif · /,'Par mois actif (HT) · ');});}catch(e){}var P=plan();if(!P)return;
    var full=el.querySelector('.av31-full-body');
    if(full&&!full.querySelector('#auGainReel')){var t=document.createElement('div');t.innerHTML=chapitreHTML(P);full.insertBefore(t.firstChild,full.firstChild);}
    var s5=el.querySelector('[data-av31-scene="4"]');if(s5&&!s5.getAttribute('data-c88')){s5.innerHTML=sceneDecision(P);s5.setAttribute('data-c88','1');s5.setAttribute('aria-label','Gain réaliste');}
    var s4=el.querySelector('[data-av31-scene="3"] .av31-risk');
    /* C218 (W78) : un seul repère de rentabilité, celui de la note et de l'Accueil (verdictRepereRN, C205 : 8 € pour 100 € vendus). */
    if(s4&&!s4.getAttribute('data-c88')){var R=P.R,rr=8;try{var RR=typeof w.verdictRepereRN==='function'?w.verdictRepereRN():null;if(RR&&RR.repere>0)rr=RR.repere;}catch(e){}var risk=R.v.rn<rr?(rr-R.v.rn)/100*R.d.ca:0,rrTxt=String(rr).replace('.',',')+' € pour 100 € vendus';s4.setAttribute('data-c88','1');
      s4.className='av31-risk'+(risk?'':' good');s4.innerHTML=risk?'<span>Écart au repère Verdict ('+rrTxt+')</span><b>'+eur(risk)+'</b>':'<span>Au-dessus du repère Verdict ('+rrTxt+')</span><b>'+String(Math.round(R.v.rn*10)/10).replace('.',',')+' €</b>';}
  }catch(e){}
}
/* C301 (V15-054) : un document comptable importé (FEC) fait foi. L'Audit le disait « Période non documentée · donnée
   non fournie · données déclarées par le client · preuves 1 / 5 » tant que la période n'avait pas été choisie à la main.
   Sans rien écrire dans le dossier : la période et la source se lisent dans le FEC tant que le patron n'a rien choisi ;
   les journées de caisse et les ventes par article comptent comme preuves opérationnelles. */
function fecOuvert(){var D=w.DB||{},r=D.refSource||{},p=D.dataProvenance||{};if(r.nature==='closed-fec-local'||p.source==='fec-local')return {annee:String(r.exerciseYear||p.period||D.exerciseYear||'')};return null;}
function journeesCaisse(){var h=w.DB&&w.DB.histJour;if(!Array.isArray(h))return 0;return h.filter(function(x){return x&&/^(pos|csv|caisse|import)/.test(String(x.source||''));}).length;}
function articlesCaisse(){var c=w.DB&&w.DB.carteRef;return !!(c&&c.confirmed&&/caisse|import|pos/.test(String(c.origine||'')+' '+String(c.source||'')));}
function envelopperPreuves(){
  var ok=true;
  var ev=w.auEvidence;if(typeof ev==='function'&&!ev.__c301){var nev=function(){var E=ev.apply(this,arguments),F=fecOuvert();if(!F||!E||(E.period&&E.source))return E;
      var V={};Object.defineProperty(V,'period',{enumerable:true,get:function(){return E.period||'closed';},set:function(x){E.period=x;}});
      Object.defineProperty(V,'source',{enumerable:true,get:function(){return E.source||'accounting';},set:function(x){E.source=x;}});
      Object.defineProperty(V,'docs',{enumerable:true,get:function(){return E.docs;},set:function(x){E.docs=x;}});return V;};
    nev.__c301=true;w.auEvidence=nev;}else if(typeof ev!=='function')ok=false;
  var dm=w.auDossierMode;if(typeof dm==='function'&&!dm.__c301){var ndm=function(){var m=dm.apply(this,arguments),F=fecOuvert();
      if(F&&m&&(m.key==='closed'||m.key==='unknown'))return {key:'closed',lib:'Exercice clos'+(F.annee?' '+F.annee:'')+' · document comptable (FEC) qui fait foi',limit:'Le document comptable importé fait foi : les montants sont réalisés, pas estimés.'};return m;};
    ndm.__c301=true;w.auDossierMode=ndm;}else if(typeof dm!=='function')ok=false;
  var ad=w.auDonnees;if(typeof ad==='function'&&!ad.__c301){var nad=function(){var q=ad.apply(this,arguments);try{if(!q||!fecOuvert())return q;var L=(q.operationalList||[]).slice(),j=journeesCaisse();
      if(j>=20&&L.indexOf('journées du mois')<0)L.push('journées de caisse ('+j+')');if(articlesCaisse()&&L.indexOf('ventes par article')<0)L.push('ventes par article');
      q.operationalList=L;q.operational=L.length;var E=q.evidence||{};
      if(q.pct===100){q.level='Calculable';q.levelWhy='Le moteur peut calculer, mais la source ou la période n’est pas encore documentée.';
        if(E.source&&E.period){q.level='Étayé';q.levelWhy='La source et la période sont déclarées ; les preuves opérationnelles restent partielles.';}
        if(E.source&&E.period&&q.ctx&&q.ctx.n>=6&&q.operational>=2){q.level='Documenté';q.levelWhy='Source, période, contexte terrain et au moins deux preuves opérationnelles sont renseignés.';}}}catch(e){}return q;};
    nad.__c301=true;w.auDonnees=nad;}else if(typeof ad!=='function')ok=false;
  var tl=w.auTruthLedgerHTML;if(typeof tl==='function'&&!tl.__c301){var ntl=function(){var h=tl.apply(this,arguments),F=fecOuvert();if(!F||typeof h!=='string')return h;
      h=h.replace('Origine : données déclarées par le client','Origine : document comptable (FEC)'+(F.annee?' de l’exercice '+F.annee:'')+', qui fait foi');
      if(F.annee)h=h.replace('Période économique : non datée','Période économique : exercice '+F.annee);return h;};
    ntl.__c301=true;w.auTruthLedgerHTML=ntl;}
  /* C301 (V15-032) : le ch. 04 (« Une seule décision ») ne nomme pas l'équipe tant qu'elle n'est pas comptée dans le gain du
     ch. 05 (proposée seulement après une décision d'organisation mesurée) : la priorité suivante passe devant. */
  /* C301 (V15-079) : un plan 90 jours dont la revue complète est déjà passée sans être fini repart de la date de l'audit */
  var ae=w.au90Etat;if(typeof ae==='function'&&!ae.__c301){var nae=function(){var E=ae.apply(this,arguments);try{if(E&&/^\d{4}-\d{2}-\d{2}$/.test(String(E.start||''))&&E.fait<E.total){var fin=new Date(E.start+'T12:00:00');fin.setDate(fin.getDate()+90);var auj=new Date();if(fin<auj)E.start=auj.toISOString().slice(0,10);}}catch(e){}return E;};nae.__c301=true;w.au90Etat=nae;}
  var aa=w.auActions;if(typeof aa==='function'&&!aa.__c301){var naa=function(){var o=aa.apply(this,arguments);try{if(!payrollOk()&&o&&o.length>1){var eq=o.filter(function(p){return p&&ACTIONS[p.id]&&ACTIONS[p.id].indexOf('sal')>=0;});
      if(eq.length&&o.indexOf(eq[0])===0)o=o.filter(function(p){return eq.indexOf(p)<0;}).concat(eq);}}catch(e){}return o;};
    naa.__c301=true;w.auActions=naa;}else if(typeof aa!=='function')ok=false;
  return ok;
}
/* C301 (V15-031) : la phrase de lecture (« … décrit une structure rentable et solide ») suit aussi le Test de résistance de
   Structure (stressStruct) : solide si aucun choc ne fait passer en perte, sinon elle dit combien. */
var FRAGILE=['','rentable ; elle tient, mais un choc sur quatre la fait passer en perte (Test de résistance)','rentable, mais fragile : deux chocs sur quatre la font passer en perte (Test de résistance)','rentable, mais exposée : trois chocs sur quatre la font passer en perte (Test de résistance)','rentable, mais exposée : les quatre chocs la font passer en perte (Test de résistance)'];
function lectureResistance(el,R){
  var n=0;try{n=w.stressStruct(R).pertes||0;}catch(e){return;}if(!n||!FRAGILE[n])return;
  var tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null),t,L=[];while((t=tw.nextNode()))if(t.nodeValue.indexOf('rentable et solide')>=0)L.push(t);
  L.forEach(function(x){x.nodeValue=x.nodeValue.replace('rentable et solide',FRAGILE[n]);});
}
function installerAudit(){
  if(!envelopperPreuves()&&typeof w.setInterval==='function'){var k=0,iv=w.setInterval(function(){if(envelopperPreuves()||++k>40)w.clearInterval(iv);},250);}
  var prev=w.drawAudit;if(typeof prev!=='function'||prev.__c88)return;
  w.drawAudit=function(){var r=prev.apply(this,arguments);patchAudit();return r;};w.drawAudit.__c88=true;
}

var css=document.createElement('style');css.id='c88-gain-realiste';
css.textContent='.c88-best{background:rgba(0,0,0,.25);border-radius:12px;padding:12px;margin:8px 0}'+
  '.c88-amount{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;margin:4px 0 10px}.c88-amount span{width:100%;font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut2)}'+
  '.c88-amount strong{font-family:var(--mono);font-size:28px;font-weight:800;color:var(--green);letter-spacing:-.02em}.c88-amount strong small{font-size:14px;font-weight:700}.c88-amount em{font-style:normal;font-family:var(--mono);font-weight:700;color:var(--green)}'+
  '.c88-warn{color:#f59e0b!important}.c88-note{color:#f59e0b!important;margin:2px 0 8px}.c88-step .c88-eur{text-align:right;white-space:nowrap;color:var(--green)}.c88-step small{font-weight:600}'+
  '.c88-top{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:6px}.c88-top li{display:flex;justify-content:space-between;gap:10px;font-size:13.5px}.c88-top b{font-family:var(--mono);white-space:nowrap}'+
  'html.vd-workspace-light #v-dec .c88-best{background:#f6f8fa!important}'+
  /* C206 (V25) : vert et rouge vifs illisibles en 12 px sur fond clair (contraste 2,1) : teintes foncées, contraste ≥ 4,5 */
  'html.vd-workspace-light #v-dec .dec-col b[style*="--green"],html.vd-workspace-light #v-dec .dec-gain[style*="--green"],html.vd-workspace-light #v-dec [id^="dval-"][style*="--green"]{color:#15803d!important}'+
  'html.vd-workspace-light #v-dec .dec-col b[style*="--red"],html.vd-workspace-light #v-dec .dec-gain[style*="--red"],html.vd-workspace-light #v-dec [id^="dval-"][style*="--red"]{color:#b91c1c!important}'+
  'html.vd-workspace-light #v-dec .c88-note{color:#92400e!important}'+
  '#decTotalBar.c206-retire{opacity:0!important;pointer-events:none!important;transform:translateY(16px)!important;transition:opacity .2s ease,transform .2s ease}';
(document.head||document.documentElement).appendChild(css);

w.VerdictGainRealiste={version:'C218',borneDyn:borneDyn,plan:plan,cartePlan:cartePlan,horsBornes:horsBornes,carteFiable:carteFiable,overAll:overAll,
  ouvrirSimuler:function(){var P=plan();if(!P)return;try{w.decDepuisPotentiel();}catch(e){w.DEC_STATE=w.decPotentialState(P);w.go('dec');}},
  ouvrirDetail:function(){var d=document.querySelector('[data-audit-full-report]');if(d)d.open=true;setTimeout(function(){var c=document.getElementById('auGainReel');if(c)c.scrollIntoView({behavior:'smooth',block:'start'});},40);}};
installerSimuler();installerAudit();
/* C106 (I-6) : le chapitre « Prix & panier » rejoue +1 € et +2 € hors de toute borne ; on le rattache au gain réaliste pour qu'il n'y ait qu'une référence. */
if(typeof w.auPrixPremiumHTML==='function'&&!w.auPrixPremiumHTML.__c106){var ap0=w.auPrixPremiumHTML;w.auPrixPremiumHTML=function(R,P){
  /* C311 (V16-030, fin) : aucun ticket lu → le chapitre dit « inconnu » et « à calculer », jamais « 0,00 € » ni « +0 € » */
  if(!(inp('panier')>0))return '<div class="au-sc"><div class="au-tag">Prix &amp; panier</div><h2 class="au-h">Ce que +1 € ou +2 € changeraient mécaniquement</h2><p class="au-p">Panier actuel : <b>inconnu</b> (aucun ticket lu dans votre caisse).</p><div class="au-card"><span class="au-k">Panier moyen +1 € ou +2 € TTC</span><div class="au-eur">à calculer : tickets inconnus</div><p class="au-p" style="margin:7px 0 0">Le calcul se fait dès que vos tickets sont connus (import de la caisse).</p></div></div>';
  var h=ap0.apply(this,arguments);try{var Pl=plan();if(Pl&&Pl.central&&Pl.central.gain>0.5)h=h.replace('</h2>','</h2><p class="au-p c106-ref" style="margin:0 0 10px;padding:10px 12px;border-radius:12px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25)"><b>Repère :</b> le gain réaliste de Verdict, borné et rejoué levier par levier, est de <b>'+signe(Pl.central.gain)+' par an</b>. Les montants ci-dessous sont une mécanique pure, sans réaction des clients ni plafond : ils ne s’y ajoutent pas.</p>');}catch(e){}return h;};w.auPrixPremiumHTML.__c106=true;}
w.addEventListener('load',function(){setTimeout(function(){installerAudit();if(w.VIEW==='audit')patchAudit();/* C103 : l'Audit caché n'est plus préparé au lancement ; drawAudit s'en charge à l'ouverture */},30);},{once:true});
})(window);
