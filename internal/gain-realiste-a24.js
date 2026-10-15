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
   avant ces bornes n'est plus restauré tel quel ; si le client pousse lui-même un curseur, une phrase simple le dit. */
(function(w){
'use strict';
if(w.VerdictGainRealiste||typeof w.moteur!=='function'||typeof w.DEC_DEFS==='undefined'||typeof w.deriv!=='function')return;

var CTRL={sal:1,fc:1,com:1,emb:1,fix:.5,panier:.5,carte:.5,cmd:1/3,jour:1/3};
var CTRL_LIB={1:'élevé',0.5:'partiel'};
var ORDER=['sal','fix','com','emb','fc','carte','panier','cmd'];
var CARTE_CAP=8,CARTE_ELAST=.03,JOUR_DEMANDE=.6,JOUR_EQUIPE=.8;

function def(id){for(var i=0;i<w.DEC_DEFS.length;i++)if(w.DEC_DEFS[i].id===id)return w.DEC_DEFS[i];return null;}
function num(x){x=Number(x);return isFinite(x)?x:0;}
function inp(k){return num(w.DB&&w.DB.in?w.DB.in[k]:0);}
function eur(x){return typeof w.eur==='function'?w.eur(x):Math.round(x).toLocaleString('fr-FR')+' €';}
function pc(x,d){return typeof w.pc==='function'?w.pc(x,d==null?1:d):(Math.round(x*10)/10).toString().replace('.',',')+' %';}
function fr2(x){return Number(x).toFixed(2).replace('.',',');}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function signe(x){return (x>=0?'+':'−')+eur(Math.abs(x));}
function ctrlLib(id){var c=CTRL[id];return c>=1?'élevé':(c>=.5?'partiel':'faible');}

/* ── Repères du format (FAMILLES / FORMATS de 029) ── */
function format(){
  var t=null,F=null,fmt=null;
  try{t=typeof w.fmtActif==='function'?w.fmtActif():null;}catch(e){}
  try{if(t&&w.FORMATS&&w.FORMATS[t]){fmt=w.FORMATS[t];F=w.FAMILLES[fmt.f];}}catch(e){}
  var generic=!F;if(!F)F=(w.FAMILLES&&w.FAMILLES.trad)||{ms:[30,36,42],fc:[25,29,32],cv:[33,38,43],acf:[15,20,26],rn:[2,5,9]};
  return {type:t,fam:F,fmt:fmt,generic:generic,nom:t||'votre format (repères généraux de la restauration traditionnelle)'};
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
    var ttc=num(p.ttc),c=p.cat||'Autre',limite=ttc>=catMax[c]?ttc*(1+capPct/100):Math.min(catMax[c],ttc*(1+capPct/100));
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
  if(vP)over.panier=inp('panier')+vP;
  var jsem=inp('jsem')||6,cmdj=inp('cmdj');
  if(vC)over.cmdj=Math.max(0,cmdj+vC);
  if(vJ){var nj=Math.max(1,Math.min(7,jsem+vJ)),dj=nj-jsem;over.jsem=nj;
    /* un jour ajouté (ou retiré) ne vaut pas une journée moyenne : 60 % de la demande d'une journée moyenne */
    if(dj)over.cmdj=(over.cmdj!=null?over.cmdj:cmdj)*(jsem+JOUR_DEMANDE*dj)/nj;}
  var d1=(vP||vC||vJ)?w.deriv(over):d0,k=d0.ca>0?d1.ca/d0.ca:1,renfort=0;
  if(Math.abs(k-1)>1e-9){
    /* un client de plus consomme de la matière, des emballages et des commissions */
    over.nour=inp('nour')*k;over.boi=inp('boi')*k;over.emb=inp('emb')*k;over.autv=inp('autv')*k;over.com=inp('com')*k;
    var salM=num(d0.salM),volPct=cmdj>0?vC/cmdj:0;
    if(vJ&&over.jsem!==jsem)renfort+=salM*(over.jsem-jsem)/jsem*(over.jsem>jsem?JOUR_EQUIPE:.5);
    if(volPct>.05)renfort+=salM*(volPct-.05)*.5;
  }
  /* 2. prix de la carte : la hausse de prix ne consomme pas de matière, la baisse de 3 % des ventes est comptée */
  if(vK>0){var cp=cartePlan(vK);if(cp.dCaAn){var caAv=d1.ca;over.panier=(over.panier!=null?over.panier:inp('panier'))*(1+cp.dCaAn/caAv);
    over.nour=(over.nour!=null?over.nour:inp('nour'))+(cp.dCaAn-cp.dContribAn);}}
  /* 3. food cost en points du CA résultant */
  var vF=etat(state,'fc');if(vF){var d2=w.deriv(over);over.nour=Math.max(0,(over.nour!=null?over.nour:inp('nour'))+vF/100*d2.ca);}
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
function cle(){try{return JSON.stringify([w.DB.in,w.DB.etabType,w.DB.plats,w.DB.carteRef,w.DB.reg,w.DB.controlTargets,(w.DB.decisions||[]).length]);}catch(e){return String(Math.random());}}
function payrollOk(){try{return typeof w.decPayrollRecommendationAllowed==='function'&&w.decPayrollRecommendationAllowed();}catch(e){return false;}}
function txt(f,a){try{return typeof w[f]==='function'?w[f](a):'';}catch(e){return '';}}
function plan(){
  var k=cle();if(CACHE.k===k&&CACHE.v)return CACHE.v;
  var R=w.moteur();if(!R||!R.ready)return null;
  var d=R.d,v=R.v,ca=d.ca,F=format(),fam=F.fam,type=F.type,L=[],cf=carteFiable();
  function add(id,val,why,how){if(val&&isFinite(val))L.push({id:id,v:val,why:why,how:how,ctrl:ctrlLib(id)});}
  /* équipe : un tiers de l'écart au repère médian */
  if(num(d.salM)>0&&v.ms>fam.ms[1]){var m=Math.round((v.ms-fam.ms[1])/100*ca/3/12/100)*100;
    add('sal',-m,'Coût humain à '+pc(v.ms)+' du CA ; repère médian '+F.nom+' : '+pc(fam.ms[1],0)+'. Verdict retient un tiers de l’écart.',txt('p11StaffAction',type)||'Comparer ventes et heures, service par service.');}
  /* charges fixes : un tiers de l'écart, exprimé sur l'ensemble mais à chercher hors loyer */
  if(num(d.af)>0&&v.acf>fam.acf[1]){var sv=(v.acf-fam.acf[1])/100*ca/3,p=Math.floor(sv/d.af*100);
    add('fix',-p,'Charges fixes à '+pc(v.acf)+' du CA ; repère '+pc(fam.acf[1],0)+'. Un tiers de l’écart : '+eur(sv)+' par an.','Assurances, énergie, abonnements et maintenance, ligne par ligne. Le loyer n’est pas compté.');}
  /* commissions */
  if(num(d.com)>0)add('com',-10,'Commissions plateformes : '+eur(d.com)+' par an.','Faire passer une partie des commandes en clic-et-retrait et revoir les prix affichés en livraison.');
  /* emballages */
  if(num(d.av)>0&&v.cv>fam.cv[1])add('emb',-10,'Coûts variables à '+pc(v.cv)+' du CA ; repère '+pc(fam.cv[1],0)+'.','Regrouper les commandes, revoir les formats, supprimer les consommables en double.');
  /* matière : la carte (recettes et fuite) quand elle est fiable, sinon l'écart structurel */
  var why=null,pts=0;
  if(cf){var st=null;try{st=w.carteStats();}catch(e){}
    if(st&&st.theoR>0){var rec=st.theoR>fam.fc[1]?(st.theoR-fam.fc[1])/3:0,fuite=(v.fc-st.theoR)>=4?(v.fc-st.theoR)/3:0;pts=rec+fuite;
      why='Food cost théorique de la carte '+pc(st.theoR)+' (repère '+pc(fam.fc[1],0)+')'+(fuite?' ; écart réel / théorique de '+pc(v.fc-st.theoR)+' : pertes, portions ou offerts invisibles.':'.')+' Un tiers de chaque écart.';}}
  else if(v.fc>fam.fc[1]){pts=(v.fc-fam.fc[1])/3;why='Food cost à '+pc(v.fc)+' du CA ; repère médian '+pc(fam.fc[1],0)+'. Un tiers de l’écart.';}
  pts=Math.floor(pts*2)/2;if(pts>=.5)add('fc',-pts,why,'Repeser les portions clés, mettre à jour les fiches techniques, renégocier le premier fournisseur.');
  /* carte : prix des plats sous leur objectif, plafonnés */
  var cp=cf?cartePlan(CARTE_CAP):null;
  if(cp&&cp.dContribAn>0)add('carte',CARTE_CAP,cp.sous+' plat'+(cp.sous>1?'s':'')+' sous leur objectif de marge. Prix relevés au plus de '+CARTE_CAP+' %, sans dépasser le prix le plus haut de leur catégorie ; 3 % de ventes en moins comptés.',
    'Nouveaux prix : '+cp.rows.slice(0,3).map(function(r){return r.nom+' '+fr2(r.avant)+' → '+fr2(r.apres)+' €';}).join(' · ')+(cp.rows.length>3?' · …':''));
  /* panier : remplacé par la carte quand elle est fiable */
  var pa=num(d.panierTTC);
  var bornePanier=0;
  if(pa>0){var tk=F.fmt&&F.fmt.tk,pct=!tk?.02:(pa<tk[1]?.03:(pa<tk[2]?.015:.01)),vp=Math.floor(pa*pct*10)/10;bornePanier=vp;}
  if(pa>0&&!(cp&&cp.dContribAn>0)){
    add('panier',vp,'Panier '+fr2(pa)+' € TTC'+(tk?' ; repères '+F.nom+' : médiane '+fr2(tk[1])+' €, haut '+fr2(tk[2])+' €':'')+'. Vente additionnelle : la matière et les commissions suivent.',txt('p11BasketAction',type)||'Entrées, desserts et boissons mis en avant, sans toucher aux prix affichés.');}
  /* commandes */
  var c=num(d.cmdj);
  if(c>0){var cl=F.fmt&&F.fmt.cl,pc2=!cl?.02:(c<cl[1]?.04:.02),vc=Math.floor(c*pc2*2)/2;
    add('cmd',vc,c.toLocaleString('fr-FR',{maximumFractionDigits:1})+' commandes par jour'+(cl?' ; repère médian '+F.nom+' : '+cl[1]:'')+'. Contrôle faible : la fréquentation ne se décrète pas.',txt('p11VolumeAction',type)||'Travailler les services creux.');}
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
      if(best){st2[x.id]=best;var y={};for(var z in x)y[z]=x[z];y.v=best;y.why=x.why+' Réduit pour ne pas dépasser '+pc(haut,0)+' de rentabilité, le niveau des meilleurs établissements de votre format.';ret2.push(y);}
      break;}
    if(plafonne){state=st2;retenus=ret2;}
  }
  /* la seule référence affichée sur un curseur est la proposition elle-même */
  var bornesLevier=bornes;if(plafonne){bornes={};for(var bi in bornesLevier)bornes[bi]=state[bi]||0;}
  var cumul={},prev=base,steps=[];
  retenus.forEach(function(x){cumul[x.id]=x.v;var Mx=w.moteur(overAll(cumul)),g=Mx.d.res-prev;prev=Mx.d.res;x.gain=g;steps.push(x);});
  var MC=w.moteur(overAll(state));
  attente.forEach(function(x){var o={};o[x.id]=x.v;x.gain=w.moteur(overAll(o)).d.res-base;});
  var central=MC.d.res-base;
  var r={R:R,format:F,leviers:L,retenus:steps,attente:attente,state:state,bornes:bornes,bornesLevier:bornesLevier,carte:cp,carteFiable:cf,
    central:{gain:central,mois:central/12,res:MC.d.res,rn:MC.v.rn,score:MC.score},
    base:{res:base,rn:v.rn,score:R.score},plafond:{rn:haut,atteint:plafonne}};
  CACHE={k:k,v:r};return r;
}

/* ── Simuler : nouveaux pas, levier Carte, cumul et impacts individuels ── */
function installerSimuler(){
  var p=def('panier');if(p)p.step=0.1;var c=def('cmd');if(c){c.step=0.5;c.fmt=function(v){return (v>0?'+':v<0?'\u2212':'')+String(Math.abs(Math.round(v*10)/10)).replace('.',',')+' / jour';};}var x=def('fix');if(x)x.step=1;
  if(!def('carte')){
    var at=w.DEC_DEFS.indexOf(def('panier'))+1;
    w.DEC_DEFS.splice(at,0,{id:'carte',t:'Prix de la carte',icon:'🍽️',step:1,min:0,max:CARTE_CAP,def:0,
      visible:function(){return carteFiable();},
      label:'Je relève les prix des plats sous leur objectif, au plus de',
      fmt:function(v){return '+'+Math.round(v)+' % max';},
      dispBase:function(){var cp=cartePlan(CARTE_CAP);return cp.sous+' plat'+(cp.sous>1?'s':'')+' sous l’objectif';},
      dispAfter:function(R,v){var cp=cartePlan(v);return (cp.dContribAn>=0?'+':'')+eur(cp.dContribAn)+' / an · '+cp.rows.length+' prix';},
      apply:function(over,v){var o=overAll({carte:v});for(var k in o)over[k]=o[k];}});
    try{w.DEC_CONTROLE.carte=['partiel','vous fixez les prix ; la réaction des clients ne se décide pas'];}catch(e){}
  }
  w.decOverAll=overAll;
  w.decImpact=function(id,v){
    var R0=w.moteur();if(!R0.ready)return null;var s={};s[id]=v;var R1=w.moteur(overAll(s));
    return {R0:R0,R1:R1,before:R0.d.res,after:R1.d.res,delta:R1.d.res-R0.d.res,score0:R0.score,score1:R1.score,rn0:R0.v.rn,rn1:R1.v.rn};
  };
  /* Priorités « Votre potentiel » et le paquet de Simuler : le même plan, les mêmes montants */
  w.potentiel=function(){
    var P=plan();if(!P)return null;var b=P.base;
    var lev=P.retenus.map(function(x){var o={};o[x.id]=x.v;var M=w.moteur(overAll(o)),dd=def(x.id);
      return {n:dd?dd.t:x.id,de:'',vers:dd?dd.fmt(x.v):String(x.v),act:x.how,gain:M.d.res-b.res,pts:M.score-b.score,sc:M.score,over:o,livraison:x.id==='com',id:x.id,why:x.why};})
      .filter(function(x){return x.gain>1||x.pts>0;});
    lev.sort(function(a,c){return c.gain-a.gain;});
    return {base:b.score,baseRes:b.res,leviers:lev,max:{score:P.central.score,res:P.central.res},state:P.state,realiste:P};
  };
  w.decPotentialState=function(P){var s={},src=(P&&P.state)||{};for(var k in src)s[k]=src[k];s.jour=0;return s;};
  w.decBest=decBest;
  w.decScenarioPersist=persist;
  if(typeof w.decScenarioEnsure==='function'&&!w.decScenarioEnsure.__c90){w.decScenarioEnsure=restaurer(w.decScenarioEnsure);w.decScenarioEnsure.__c90=true;}
  var origRecap=w.decDrawRecap;
  if(typeof origRecap==='function'&&!origRecap.__c90){w.decDrawRecap=function(){var r=origRecap.apply(this,arguments);try{noteRecap();}catch(e){}return r;};w.decDrawRecap.__c90=true;}
  var origRender=w.decRender;
  if(typeof origRender==='function'&&!origRender.__c88){w.decRender=function(id,v){var r=origRender.apply(this,arguments);try{noteLevier(id,v);}catch(e){}return r;};w.decRender.__c88=true;}
}
function depasse(id,v,P){
  var b=num(P&&P.bornes[id]);v=num(v);
  if(id==='panier'||id==='cmd'||id==='carte')return v>b+1e-9;
  if(id==='sal'||id==='fc'||id==='fix'||id==='com'||id==='emb')return v<b-1e-9;
  return false;
}
function horsBornes(state){var P=plan(),o=[];if(!P||!state)return o;for(var k in state)if(depasse(k,state[k],P))o.push(k);return o;}
function phrase(id,P){
  var R=P.R,d=R.d,v=R.v,F=P.format,fam=F.fam,fmt=F.fmt,t=F.type?'des établissements « '+F.type+' »':'de la restauration traditionnelle',b=P.bornes[id],dd=def(id),coupe=P.plafond.atteint&&num(P.bornesLevier[id])!==num(b),au=(b?'Verdict compte au plus '+dd.fmt(b):(coupe?'Verdict ne l’ajoute pas':'Verdict ne compte aucun gain ici'))+(coupe?' : avec vos autres leviers, vous atteignez déjà '+pc(P.plafond.rn,0)+' de rentabilité, le niveau des meilleurs établissements '+t.replace(/^des établissements /,'')+'.':'.');
  var fin=' Au-delà, ce n’est plus réaliste.';if(!b&&P.plafond.atteint&&num(P.bornesLevier[id])!==0)fin='';
  if(id==='cmd')return 'Vous servez '+String(Math.round(num(d.cmdj)*10)/10).replace('.',',')+' commandes par jour'+(fmt?' ; repère Verdict '+t+' : '+fmt.cl[1]:'')+'. '+au+fin;
  if(id==='panier')return 'Votre panier moyen est de '+fr2(d.panierTTC)+' €'+(fmt?' ; repère Verdict '+t+' : '+fr2(fmt.tk[1])+' €':'')+'. '+au+fin;
  if(id==='carte')return 'Verdict relève les prix d’au plus '+CARTE_CAP+' %, sans dépasser le plat le plus cher de la catégorie.'+fin;
  if(id==='sal')return 'Votre équipe coûte '+pc(v.ms)+' du chiffre d’affaires ; repère Verdict '+t+' : '+pc(fam.ms[1],0)+'. '+au+fin;
  if(id==='fc')return 'Votre food cost est de '+pc(v.fc)+' ; repère Verdict '+t+' : '+pc(fam.fc[1],0)+'. '+au+fin;
  if(id==='fix')return 'Vos charges fixes pèsent '+pc(v.acf)+' du chiffre d’affaires ; repère Verdict '+t+' : '+pc(fam.acf[1],0)+'. '+au+fin;
  if(id==='com')return 'Verdict compte au plus −10 % de commissions, en passant une partie des commandes en retrait.'+fin;
  if(id==='emb')return 'Verdict compte au plus −10 % sur ces achats.'+fin;
  return '';
}
function noteLevier(id,v){
  var box=document.getElementById('dr-'+id);if(!box)return;var n=document.getElementById('c88-note-'+id);
  var P=plan(),msg='';v=num(v);
  if(id==='jour'&&v)msg='Un jour de plus : Verdict compte '+Math.round(JOUR_DEMANDE*100)+' % d’une journée moyenne, avec l’équipe nécessaire.';
  else if(P&&depasse(id,v,P))msg=phrase(id,P);
  if(!msg){if(n)n.remove();return;}
  if(!n){n=document.createElement('p');n.id='c88-note-'+id;n.className='note c88-note';box.appendChild(n);}
  n.textContent=msg;
}
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
    '<div class="autoline"><span class="k">'+U.profit+'</span><b>'+pc(Rt.v.rn,1)+'</b></div>'+
    (!had&&P.plafond.atteint?'<p class="note">Verdict s’arrête à '+pc(P.plafond.rn,0)+' de rentabilité, le niveau des meilleurs établissements de votre format'+(P.format.type?' ('+esc(P.format.type)+')':'')+'.</p>':'')+
    (P.attente.length&&!had?'<p class="note">'+P.attente.map(function(x){return 'Coût humain : jusqu’à '+signe(x.gain)+' / an possibles, proposés seulement après une décision d’organisation mesurée (onglet Équipe).';}).join(' ')+'</p>':'')+
    '<p class="note" style="margin:6px 0 0">Chaque levier est borné par les repères de votre format'+(P.format.type?' ('+esc(P.format.type)+')':'')+' ; un client de plus consomme de la matière et des commissions ; tout est recalculé ensemble par le moteur, sans double comptage.</p>'+
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
    '<h2 class="au-h">'+signe(c.mois)+' par mois, soit '+signe(c.gain)+' par an</h2>'+
    '<p class="au-p">Un seul calcul, rejoué dans le moteur avec vos chiffres. Chaque levier est borné par les repères de votre format'+(P.format.type?' ('+esc(P.format.type)+')':' (repères généraux de la restauration traditionnelle)')+' (un tiers de l’écart au repère, comme vos priorités). Les étapes s’enchaînent : chaque montant est ce que le levier ajoute après les précédents, aucun euro n’est compté deux fois.</p>'+
    '<div class="au-card"><span class="au-k">Pas à pas</span>'+
      '<div class="au-ok"><span style="flex:1"><b>Résultat actuel</b></span><b>'+eur(P.base.res)+' · '+pc(P.base.rn)+'</b></div>'+lignes(P)+
      '<div class="au-ok"><span style="flex:1"><b>Résultat visé</b></span><b>'+eur(c.res)+' · '+pc(c.rn)+' · score '+c.score+'</b></div></div>'+
    (P.plafond.atteint?'<p class="note">Verdict s’arrête à '+pc(P.plafond.rn,0)+' de rentabilité : c’est le niveau des meilleurs établissements de votre format'+(P.format.type?' ('+esc(P.format.type)+')':'')+'. Au-delà, ce ne serait plus réaliste.</p>':'')+
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
    var el=document.getElementById('auditBody');if(!el)return;var P=plan();if(!P)return;
    var full=el.querySelector('.av31-full-body');
    if(full&&!full.querySelector('#auGainReel')){var t=document.createElement('div');t.innerHTML=chapitreHTML(P);full.insertBefore(t.firstChild,full.firstChild);}
    var s5=el.querySelector('[data-av31-scene="4"]');if(s5&&!s5.getAttribute('data-c88')){s5.innerHTML=sceneDecision(P);s5.setAttribute('data-c88','1');s5.setAttribute('aria-label','Gain réaliste');}
    var s4=el.querySelector('[data-av31-scene="3"] .av31-risk');
    if(s4&&!s4.getAttribute('data-c88')){var R=P.R,rr=P.format.fam.rn[1],risk=R.v.rn<rr?(rr-R.v.rn)/100*R.d.ca:0;s4.setAttribute('data-c88','1');
      s4.className='av31-risk'+(risk?'':' good');s4.innerHTML=risk?'<span>Écart au repère de rentabilité de '+esc(P.format.type||'votre format')+' ('+pc(rr,0)+')</span><b>'+eur(risk)+'</b>':'<span>Au-dessus du repère de '+esc(P.format.type||'votre format')+' ('+pc(rr,0)+')</span><b>'+pc(R.v.rn)+'</b>';}
  }catch(e){}
}
function installerAudit(){
  var prev=w.drawAudit;if(typeof prev!=='function'||prev.__c88)return;
  w.drawAudit=function(){var r=prev.apply(this,arguments);patchAudit();return r;};w.drawAudit.__c88=true;
}

var css=document.createElement('style');css.id='c88-gain-realiste';
css.textContent='.c88-best{background:rgba(0,0,0,.25);border-radius:12px;padding:12px;margin:8px 0}'+
  '.c88-amount{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;margin:4px 0 10px}.c88-amount span{width:100%;font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut2)}'+
  '.c88-amount strong{font-family:var(--mono);font-size:28px;font-weight:800;color:var(--green);letter-spacing:-.02em}.c88-amount strong small{font-size:14px;font-weight:700}.c88-amount em{font-style:normal;font-family:var(--mono);font-weight:700;color:var(--green)}'+
  '.c88-warn{color:#f59e0b!important}.c88-note{color:#f59e0b!important;margin:2px 0 8px}.c88-step .c88-eur{text-align:right;white-space:nowrap;color:var(--green)}.c88-step small{font-weight:600}'+
  '.c88-top{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:6px}.c88-top li{display:flex;justify-content:space-between;gap:10px;font-size:13.5px}.c88-top b{font-family:var(--mono);white-space:nowrap}'+
  'html.vd-workspace-light #v-dec .c88-best{background:#f6f8fa!important}';
(document.head||document.documentElement).appendChild(css);

w.VerdictGainRealiste={version:'C90',plan:plan,cartePlan:cartePlan,horsBornes:horsBornes,carteFiable:carteFiable,overAll:overAll,
  ouvrirSimuler:function(){var P=plan();if(!P)return;try{w.decDepuisPotentiel();}catch(e){w.DEC_STATE=w.decPotentialState(P);w.go('dec');}},
  ouvrirDetail:function(){var d=document.querySelector('[data-audit-full-report]');if(d)d.open=true;setTimeout(function(){var c=document.getElementById('auGainReel');if(c)c.scrollIntoView({behavior:'smooth',block:'start'});},40);}};
installerSimuler();installerAudit();
w.addEventListener('load',function(){setTimeout(function(){installerAudit();patchAudit();},30);},{once:true});
})(window);
