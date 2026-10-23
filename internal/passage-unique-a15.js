/* C42 — « Un seul passage » : fichier comptable (FEC) + export de caisse, les deux notes d'un coup.
   Le client apporte ses propres données ; Vera aide seulement à compléter au départ (plats absents de la carte,
   recette de départ copiée d'un plat proche, prix lu dans la caisse) — jamais de stratégie, jamais de chiffre inventé.
   S'appuie sur l'import FEC existant (carte #v44-fec) et sur l'import de caisse existant (point5CsvAnalyse,
   point5CommitImport, verdictDishSalesImport). Tout reste dans la page : rien n'est envoyé.
   C192 — La carte vient de la caisse, sans saisie : prix, TVA, famille et ventes lus dans l'export ; moyenne des mois
   complets ; recette reprise d'un plat proche ou d'une fiche type (internal/fiches-types-a59.js) ; une seule question pour
   ce qui n'a pas de recette fixe (coût d'une portion) ; périmètre « toute la carte, mois complets » établi par la caisse.
   C193 — Les journées de caisse : l'import des clôtures est dans « Importer mes chiffres » (plus dans un bloc caché) ;
   l'export « ventes par article » remplit aussi les journées (CA TTC du jour = somme des articles) dans la même validation,
   sans jamais écraser une clôture déjà importée ; les jours d'ouverture par semaine se lisent dans ces journées.
   C195 — Le jour de repos se lit aussi dans les journées : le jour de semaine absent des semaines entières habituelles
   (congés et fériés sans effet). Sans choix du patron, il est posé à la validation de l'import ; un choix explicite du
   patron n'est jamais écrasé : Mes services le dit et propose la caisse en un clic. */
(function(root){
'use strict';
var doc=root.document;if(!doc||root.VerdictPassageUnique)return;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function num(v){var n=typeof v==='number'?v:parseFloat(String(v==null?'':v).replace(/\s/g,'').replace(',','.'));return isFinite(n)?n:null;}
function money(v){v=num(v);return v==null?'—':v.toLocaleString(tag(),{minimumFractionDigits:2,maximumFractionDigits:2})+' €';}
function int(v){v=num(v);return v==null?'—':Math.round(v).toLocaleString(tag());}
function norm(s){return String(s||'').replace(/œ/g,'oe').replace(/Œ/g,'OE').replace(/æ/g,'ae').replace(/Æ/g,'AE').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function DB(){return root.DB||null;}
function today(){var t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0');}
function addMonth(per,n){var y=+per.slice(0,4),m=+per.slice(5,7)-1+n;y+=Math.floor(m/12);m=((m%12)+12)%12;return y+'-'+String(m+1).padStart(2,'0');}
var MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
/* Nombres et mois au format de la langue choisie — langues-complements (16/10). */
function tag(){try{return typeof root.localeTag==='function'?root.localeTag():(root.LOCALE_TAG||'fr-FR');}catch(e){return 'fr-FR';}}
function moisLocal(i){try{if(root.LOCALE&&root.LOCALE!=='fr')return new Intl.DateTimeFormat(tag(),{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2020,i,15)));}catch(e){}return MONTHS[i];}
function monthLabel(per){return moisLocal(+per.slice(5,7)-1)+' '+per.slice(0,4);}

/* ───────── Lecture du CSV de caisse (mêmes lecteurs que l'import existant) ───────── */
function csvRow(line,sep){if(typeof root.point5CsvRow==='function')return root.point5CsvRow(line,sep);return line.split(sep).map(function(x){return x.trim().replace(/^"|"$/g,'');});}
function csvSep(line){if(typeof root.point5CsvSep==='function')return root.point5CsvSep(line);var best=';',n=0;[';',',','\t'].forEach(function(s){var x=line.split(s).length;if(x>n){n=x;best=s;}});return best;}
function columns(head){if(typeof root.point5Columns==='function')return root.point5Columns(head);var m={nom:-1,qte:-1,date:-1,cat:-1,gross:-1,status:-1,ticket:-1};head.forEach(function(x,i){var h=norm(x).replace(/ /g,'');if(m.nom<0&&/(article|item|produit|plat|designation|libelle|nom)/.test(h))m.nom=i;else if(m.qte<0&&/(quantite|qte|qty|nombre|volume|ventes)/.test(h))m.qte=i;else if(m.date<0&&/(date|jour|time)/.test(h))m.date=i;else if(m.cat<0&&/(categorie|category|famille|family|rayon|espace)/.test(h))m.cat=i;else if(m.gross<0&&/(totalht|totalttc|montant|gross|netsales|ventesnettes|ca)/.test(h))m.gross=i;else if(m.status<0&&/(statut|status|etat|type)/.test(h))m.status=i;else if(m.ticket<0&&/(ticket|transaction|order|commande|receipt|id)/.test(h))m.ticket=i;});return m;}
function isoDate(v){var s=String(v||'').trim();var m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return m[1]+'-'+m[2]+'-'+m[3];m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);if(m){var y=m[3].length===2?'20'+m[3]:m[3];return y+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2);}return '';}
/* Lecture brute : lignes, articles, tickets, dates, montants. Pure, aucune écriture. */
function readCsv(text){
  var lines=String(text||'').replace(/^﻿/,'').split(/\r?\n/).filter(function(x){return x.trim();});
  if(lines.length<2)return {ok:false,reason:'fichier vide ou sans données',rows:[]};
  var sep=csvSep(lines[0]),head=csvRow(lines[0],sep),c=columns(head),tv=tvaCol(head);
  if(c.nom<0||c.qte<0)return {ok:false,reason:'colonnes article et quantité introuvables (en-têtes lus : '+head.join(', ')+')',rows:[]};
  var rows=[];for(var i=1;i<lines.length;i++){var p=csvRow(lines[i],sep);var st=norm(c.status>=0?p[c.status]:'');if(/annul|cancel|void|supprim/.test(st))continue;rows.push({nom:String(p[c.nom]||'').trim(),qte:num(p[c.qte]),date:c.date>=0?isoDate(p[c.date]):'',cat:c.cat>=0?p[c.cat]:'',gross:c.gross>=0?num(p[c.gross]):null,ticket:c.ticket>=0?String(p[c.ticket]||'').trim():'',refund:/refund|rembours|retour/.test(st),tva:tv>=0?tvaNum(p[tv]):null});}
  return {ok:true,rows:rows,columns:c,hasDate:c.date>=0,hasTicket:c.ticket>=0,hasGross:c.gross>=0,hasTva:tv>=0,grossHT:c.gross>=0&&/\bht\b|hors taxe/.test(norm(head[c.gross]))&&!/ttc/.test(norm(head[c.gross]))};
}
/* Panier moyen et commandes par jour, uniquement si le fichier les contient vraiment. */
function volumes(read){
  if(!read||!read.ok)return null;
  var tickets={},days={},gross=0,grossN=0;
  read.rows.forEach(function(r){if(r.date)days[r.date]=1;if(r.ticket)tickets[r.ticket]=1;if(r.gross!=null){gross+=r.refund?-Math.abs(r.gross):r.gross;grossN++;}});
  var nT=Object.keys(tickets).length,nD=Object.keys(days).length;
  return {tickets:nT||null,days:nD||null,gross:grossN?Math.round(gross*100)/100:null,panier:(nT&&grossN)?Math.round(gross/nT*100)/100:null,cmdj:(nT&&nD)?Math.round(nT/nD*10)/10:null,period:(function(){var per={};Object.keys(days).forEach(function(d){per[d.slice(0,7)]=(per[d.slice(0,7)]||0)+1;});var best=null;Object.keys(per).forEach(function(k){if(!best||per[k]>per[best])best=k;});return best;})()};
}
/* Prix de vente lu dans la caisse pour un article (montant / quantité), si les deux existent. */
function unitPrice(read,nom){var k=norm(nom),q=0,g=0,ok=false;read.rows.forEach(function(r){if(norm(r.nom)!==k||r.gross==null||!(r.qte>0))return;q+=r.qte;g+=r.gross;ok=true;});return ok&&q>0?Math.round(g/q*100)/100:null;}
/* ───────── C192 — la carte vient de la caisse : mois couverts, moyenne, TVA et famille lues dans le fichier ───────── */
function tvaCol(head){for(var i=0;i<head.length;i++){if(/^(taux (de )?)?tva( %| taux)?$|^vat( rate)?$|^taux$/.test(norm(head[i])))return i;}return -1;}
function tvaNum(v){var n=num(String(v==null?'':v).replace('%',''));if(n==null)return null;if(n>0&&n<1)n=n*100;return n>=0&&n<=30?Math.round(n*100)/100:null;}
function tvaDefaut(){var d=DB(),t=num(d&&d.reg&&d.reg.tvac);return t!=null?t:10;}
/* Un mois est complet quand ses ventes vont du début à la fin du mois (jours de fermeture tolérés). */
function mois(read){
  var M={};(read&&read.rows||[]).forEach(function(r){if(!r.date)return;var k=r.date.slice(0,7),j=+r.date.slice(8,10),m=M[k]||(M[k]={min:31,max:0,jours:{}});if(j<m.min)m.min=j;if(j>m.max)m.max=j;m.jours[r.date]=1;});
  return Object.keys(M).sort().map(function(k){var m=M[k],last=new Date(Date.UTC(+k.slice(0,4),+k.slice(5,7),0)).getUTCDate(),n=Object.keys(m.jours).length;return {per:k,jours:n,complet:m.min<=3&&m.max>=last-2&&n>=Math.min(15,last-6)};});
}
/* Les derniers mois complets qui se suivent (12 au plus) : la carte prend leur moyenne par mois. */
function moyenneOption(read){var L=mois(read),run=[];for(var i=L.length-1;i>=0&&run.length<12;i--){if(L[i].complet&&(!run.length||addMonth(L[i].per,1)===run[0].per))run.unshift(L[i]);else if(run.length)break;}
  if(run.length<2)return null;return {value:'moy:'+run[0].per+':'+run[run.length-1].per,debut:run[0].per,fin:run[run.length-1].per,n:run.length};}
function nMois(a,b){return (+b.slice(0,4)-+a.slice(0,4))*12+(+b.slice(5,7)-+a.slice(5,7))+1;}
function bornes(per){return /^moy:/.test(String(per||''))?per.split(':').slice(1):[per,per];}
function periodLabel(per){if(/^moy:/.test(String(per||''))){var a=bornes(per);return 'moyenne par mois sur '+nMois(a[0],a[1])+' mois, de '+monthLabel(a[0])+' à '+monthLabel(a[1]);}return per?monthLabel(per):'';}
function periodeComplete(read,per){if(/^moy:/.test(String(per||'')))return true;var m=mois(read).filter(function(x){return x.per===per;})[0];return !!(m&&m.complet);}
function filtrer(text,d0,d1){var lines=String(text||'').split(/\r?\n/).filter(function(x){return x.trim();});if(lines.length<2)return text;var sep=csvSep(lines[0]),c=columns(csvRow(lines[0],sep));if(c.date<0)return text;
  return [lines[0]].concat(lines.slice(1).filter(function(l){var m=isoDate(csvRow(l,sep)[c.date]).slice(0,7);return m>=d0&&m<=d1;})).join('\n');}
/* Lecture des ventes pour la période choisie ; « moy:début:fin » = ventes de ces mois divisées par leur nombre. */
function analyse(text,per){
  if(/^moy:/.test(String(per||''))){var a=bornes(per),n=nMois(a[0],a[1]),lot=root.point5CsvAnalyse(filtrer(text,a[0],a[1]),{period:''});
    lot.period=a[1];lot.moyenne={debut:a[0],fin:a[1],mois:n};lot.matched.forEach(function(x){x.qte=x.qte/n;});lot.unknown.forEach(function(u){u.qte=(num(u.qte)||0)/n;});
    lot.ok=lot.matched.length>0&&!lot.invalid.length&&!lot.duplicate;return lot;}
  return root.point5CsvAnalyse(text,{period:per});
}
function mode(o){var b=null;Object.keys(o).forEach(function(k){if(b==null||o[k]>o[b])b=k;});return b;}
/* Prix moyen, TVA et famille de chaque article sur la période (ce que la caisse dit, rien d'inventé). */
function infosArticles(read,per){
  var a=bornes(per),I={};
  (read.rows||[]).forEach(function(r){var m=r.date?r.date.slice(0,7):'';if(m&&a[0]&&(m<a[0]||m>a[1]))return;var k=norm(r.nom),x=I[k]||(I[k]={g:0,gq:0,tva:{},fam:{},ht:0,htOk:true});
    if(r.qte>0&&r.gross!=null){x.g+=r.gross;x.gq+=r.qte;}if(r.tva!=null)x.tva[r.tva]=(x.tva[r.tva]||0)+(r.qte||1);if(r.cat)x.fam[r.cat]=(x.fam[r.cat]||0)+(r.qte||1);});
  Object.keys(I).forEach(function(k){var x=I[k],t=mode(x.tva);x.price=x.gq>0?Math.round(x.g/x.gq*100)/100:null;x.tvaLue=t==null?null:+t;x.famille=mode(x.fam);});
  return I;
}
function eur0(v){return int(v)+' €';}
function fmtVol(q,mo){var v=Math.round(num(q)*10)/10;return (v>=10?int(v):String(v).replace('.',','))+(mo?' vendus / mois':' vendus');}
function produitsAjoutes(U){var FT=root.VerdictFichesTypes,d=DB(),have={},out=[];(d&&d.ing||[]).forEach(function(g){if(g&&g.nom)have[norm(g.nom)]=1;});
  U.forEach(function(u){if(!u.keep||!u.fiche||u.draft.kind==='copie')return;u.fiche.rec.forEach(function(l){var k=norm(l[0]);if(!have[k]&&FT&&FT.produit(l[0])&&!(FT.dansCatalogue&&FT.dansCatalogue(l[0],d&&d.ing))){have[k]=1;out.push(l[0]);}});});return out;}
/* Ventes de la caisse face au document comptable de la même année (même chiffre attendu, HT). */
function coherence(read,per){
  var d=DB(),fi=d&&d.fecImport,a=bornes(per);if(!fi||!fi.totals||!(fi.totals.revenue>0)||!/^moy:/.test(String(per||'')))return '';
  var annee=String(fi.period&&fi.period.year||'');if(nMois(a[0],a[1])!==12||a[0]!==annee+'-01'||a[1]!==annee+'-12')return '';
  var tv={};S.unknown.forEach(function(u){tv[norm(u.nom)]=u.tva;});(d.plats||[]).forEach(function(p){var t=num(p.tva);if(t!=null)tv[norm(p.nom)]=t;});
  var ht=0;(read.rows||[]).forEach(function(r){var m=r.date?r.date.slice(0,7):'';if(!m||m<a[0]||m>a[1]||r.gross==null)return;var t=r.tva!=null?r.tva:tv[norm(r.nom)]!=null?tv[norm(r.nom)]:tvaDefaut();ht+=(r.refund?-Math.abs(r.gross):r.gross)/(1+t/100);});
  var gap=ht-fi.totals.revenue,rel=Math.abs(gap)/fi.totals.revenue;
  return 'Ventes de la caisse sur '+esc(annee)+' : <b>'+eur0((ht))+' HT</b> · votre document comptable : '+eur0((fi.totals.revenue))+' HT — '+(Math.abs(gap)<1?'<b>identique</b>.':rel<0.03?'proche (écart de '+eur0((Math.abs(gap)))+').':'<b>écart de '+eur0((Math.abs(gap)))+'</b> : la caisse ne contient peut-être pas toutes les ventes (livraison, traiteur, autre caisse).');
}

/* ───────── C193 — journées de caisse : lues dans l'export « ventes par article », jours d'ouverture lus dans les journées ───────── */
function isoToday(){var t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');}
function dateLabel(iso){var j=+String(iso).slice(8,10);return (j===1&&!(root.LOCALE&&root.LOCALE!=='fr')?'1er':j)+' '+moisLocal(+String(iso).slice(5,7)-1)+' '+String(iso).slice(0,4);}
/* Une journée venue d'une caisse (clôture, export) : jamais une saisie à la main ni la démonstration. */
function journeeCaisse(r){var s=String(r&&r.source||'');return !!(r&&!r.demo&&/pos|csv|caisse|import|ticket/i.test(s)&&!/demo|manual/i.test(s));}
/* CA TTC de chaque jour = somme des articles du jour (remboursements déduits) ; tickets seulement si le fichier les numérote. */
function journees(read){
  if(!read||!read.ok||!read.hasDate||!read.hasGross)return null;
  var J={},max=isoToday();
  read.rows.forEach(function(r){if(!r.date||r.date>max||r.gross==null)return;var g=r.refund?-Math.abs(r.gross):r.gross;if(read.grossHT)g=g*(1+(r.tva!=null?r.tva:tvaDefaut())/100);
    var x=J[r.date]||(J[r.date]={ttc:0,tk:{}});x.ttc+=g;if(r.ticket)x.tk[r.ticket]=1;});
  return Object.keys(J).sort().map(function(d){var n=Object.keys(J[d].tk).length;return {date:d,caJ:Math.round(J[d].ttc*100)/100,tkJ:read.hasTicket&&n?n:null};}).filter(function(x){return x.caJ>0;});
}
/* Ce que l'export apporte aux journées déjà connues : nouvelles, identiques, clôtures gardées, saisies remplacées par la caisse. */
function planJournees(read){
  var L=journees(read);if(!L||!L.length)return null;
  var d=DB(),H=d&&d.histJour||[],idx={};H.forEach(function(r,i){if(r&&r.date)idx[r.date]=i;});
  var P={rows:L,nouveaux:[],identiques:0,gardees:0,remplacees:[]};
  L.forEach(function(x){var o=idx[x.date]!=null?H[idx[x.date]]:null;
    if(!o)P.nouveaux.push(x);else if(Math.abs((num(o.caJ)||0)-x.caJ)<0.01)P.identiques++;else if(journeeCaisse(o)||o.demo)P.gardees++;else P.remplacees.push(x);});
  var h=JSON.stringify(L.map(function(x){return [x.date,x.caJ,x.tkJ];}));P.fingerprint=typeof root.point5Hash==='function'?root.point5Hash(h):String(h.length);
  return P;
}
function ligneJournee(x,at){return {date:x.date,jour:+x.date.slice(8),caJ:x.caJ,tkJ:x.tkJ,ca:null,tickets:null,source:'pos-articles',importedAt:at};}
function appliquerJournees(P){
  var d=DB();if(!d||!P||!(P.nouveaux.length||P.remplacees.length))return 0;
  d.histJour=d.histJour||[];var at=new Date().toISOString(),faits=P.nouveaux.concat(P.remplacees);
  P.nouveaux.forEach(function(x){d.histJour.push(ligneJournee(x,at));});
  P.remplacees.forEach(function(x){var i=d.histJour.findIndex(function(r){return r&&r.date===x.date;});if(i<0)return;var o=d.histJour[i];
    (d.dailyCorrections=d.dailyCorrections||[]).push({date:x.date,avant:{caJ:o.caJ,tkJ:o.tkJ,source:o.source||null},apres:{caJ:x.caJ,tkJ:x.tkJ},at:at,via:'ventes-par-article'});d.histJour[i]=ligneJournee(x,at);});
  faits.forEach(function(x){d.moisPilotage=d.moisPilotage||{};d.moisPilotage[x.date.slice(0,7)]=true;d.ouvertsJours=d.ouvertsJours||[];if(d.ouvertsJours.indexOf(x.date)<0)d.ouvertsJours.push(x.date);});
  d.dailyImports=d.dailyImports||[];d.dailyImports.push({fingerprint:P.fingerprint,at:at,rows:P.rows.length,added:P.nouveaux.length,replaced:P.remplacees.length,kept:P.gardees,source:'ventes-par-article'});if(d.dailyImports.length>120)d.dailyImports=d.dailyImports.slice(-120);
  try{if(typeof root.dailyCsvRecompute==='function')root.dailyCsvRecompute();}catch(e){}
  return faits.length;
}
/* Jours d'ouverture par semaine : le nombre de jours ouverts le plus fréquent sur les semaines entières couvertes par la caisse
   (fermetures annuelles et jours fériés n'y changent rien). « extra » : journées sur le point d'être ajoutées. */
/* C300 (V15-082) : des jours d'ouverture réellement indiqués (Mes chiffres, calendrier du patron, fiche d'exercice) — pas la valeur par défaut d'un dossier neuf. */
function jsemSaisi(d){return !!(d&&((d.maj&&d.maj.activite)||(d.fermesSource&&d.fermesSource.source==='patron')||(d.refSource&&d.refSource.nature&&!/fec/.test(String(d.refSource.nature)))));}
function joursSemaine(extra){
  var d=DB(),vu={};(d&&d.histJour||[]).forEach(function(r){if(r&&r.date&&journeeCaisse(r)&&num(r.caJ)>0)vu[String(r.date).slice(0,10)]=1;});
  (extra||[]).forEach(function(x){if(x&&x.caJ>0)vu[x.date]=1;});
  var dates=Object.keys(vu).filter(function(s){return /^\d{4}-\d{2}-\d{2}$/.test(s);}).sort();if(dates.length<28)return null;
  var t0=Date.parse(dates[0]+'T00:00:00Z'),t1=Date.parse(dates[dates.length-1]+'T00:00:00Z'),W={},WD={};
  dates.forEach(function(s){var t=Date.parse(s+'T00:00:00Z'),wd=(new Date(t).getUTCDay()+6)%7,lundi=t-wd*864e5;if(lundi<t0||lundi+6*864e5>t1)return;W[lundi]=(W[lundi]||0)+1;(WD[lundi]=WD[lundi]||[]).push(wd);});
  var C={},n=0;Object.keys(W).forEach(function(k){C[W[k]]=(C[W[k]]||0)+1;n++;});if(n<8)return null;
  var best=null;Object.keys(C).forEach(function(k){if(best==null||C[k]>C[best]||(C[k]===C[best]&&+k>+best))best=k;});
  var j=+best;
  /* C195 — jour(s) de repos : absent(s) des semaines entières qui ont le nombre habituel de jours ouverts (une semaine de
     congés ou avec un férié n'y compte pas). Repos qui change d'une semaine à l'autre : rien n'est déduit. */
  var N=[0,0,0,0,0,0,0],m=0;Object.keys(W).forEach(function(k){if(W[k]!==j)return;m++;WD[k].forEach(function(x){N[x]++;});});
  var repos=[];N.forEach(function(x,w){if(x<=m*0.1)repos.push(w);});if(m<6||repos.length!==7-j)repos=null;
  return {jours:j,repos:repos,semainesRepos:m,journees:dates.length,semaines:n,debut:dates[0],fin:dates[dates.length-1],texte:j+' par semaine, lu'+(j>1?'s':'')+' dans vos '+int(dates.length)+' journées de caisse (du '+dateLabel(dates[0])+' au '+dateLabel(dates[dates.length-1])+')'};
}
function majJoursSemaine(){var d=DB(),js=joursSemaine();if(!d||!d.in||!js)return null;var avant=num(d.in.jsem);d.jsemSource={source:'caisse',jours:js.jours,journees:js.journees,at:new Date().toISOString()};if(avant===js.jours)return null;d.in.jsem=js.jours;return {avant:avant,apres:js.jours};}
/* C195 — le jour de repos : DB.fermes (0 = lundi) et sa source (DB.fermesSource : « caisse » ou « patron »). */
var JOURS=['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
function nb(a,b){return a-b;}
function reposTexte(R){if(!R)return '';if(!R.length)return 'ouvert 7 jours sur 7';var a=R.slice().sort(nb).map(function(w){return 'le '+JOURS[w];});return 'fermé '+(a.length>1?a.slice(0,-1).join(', ')+' et '+a[a.length-1]:a[0]);}
/* Un choix du patron : touché à la main (source « patron »), ou des jours fermés posés avant que la caisse ne les dise. */
function reposExplicite(d){var s=d&&d.fermesSource;if(s&&s.source)return s.source==='patron';return !!(d&&d.fermes&&d.fermes.length);}
function etatRepos(){var d=DB(),js=joursSemaine();if(!d||!js||!js.repos)return null;var fe=(d.fermes||[]).slice().sort(nb),sig=js.repos.join(','),s=d.fermesSource||{};
  return {repos:js.repos.slice(),fermes:fe,egal:fe.join(',')===sig,explicite:reposExplicite(d),garde:s.source==='patron'&&s.garde===sig,source:s.source||null,jours:js.jours,journees:js.journees,semaines:js.semainesRepos,texte:reposTexte(js.repos)};}
/* Prendre les jours de la caisse (un clic dans Mes services, ou la validation d'un import sans choix du patron). */
function prendreRepos(){var d=DB(),js=joursSemaine();if(!d||!js||!js.repos)return null;var avant=(d.fermes||[]).slice().sort(nb),at=new Date().toISOString();
  d.fermes=js.repos.slice();d.fermesSource={source:'caisse',repos:js.repos.slice(),journees:js.journees,semaines:js.semainesRepos,avant:avant,at:at};
  d.in=d.in||{};d.in.jsem=js.jours;d.jsemSource={source:'caisse',jours:js.jours,journees:js.journees,at:at};return {avant:avant,apres:d.fermes.slice()};}
/* Garder son calendrier : la caisse ne le repropose plus tant qu'elle dit la même chose. */
function garderRepos(){var d=DB(),js=joursSemaine();if(!d||!js||!js.repos)return null;d.fermesSource={source:'patron',garde:js.repos.join(','),at:new Date().toISOString()};return true;}
/* À la validation d'un import : posé sans choix du patron ; un choix explicite différent est gardé et signalé. */
function majJoursRepos(){var e=etatRepos(),d=DB();if(!e)return null;
  if(e.egal){if(!e.explicite)d.fermesSource={source:'caisse',repos:e.repos.slice(),journees:e.journees,semaines:e.semaines,at:new Date().toISOString()};return null;}
  if(e.explicite)return {garde:true,avant:e.fermes,caisse:e.repos};
  return prendreRepos();}
function jsemLigne(js){if(!js)return '';var d=DB(),avant=jsemSaisi(d)?num(d&&d.in&&d.in.jsem):null/* C300 (V15-082) : la valeur 6 d'un dossier neuf n'a pas été indiquée par le patron */,R=js.repos,fe=(d&&d.fermes||[]).slice().sort(nb),conflit=!!(R&&fe.join(',')!==R.join(',')&&reposExplicite(d));return 'Jours d’ouverture : <b>'+js.jours+' par semaine'+(R?', '+reposTexte(R):'')+'</b>, lus dans ces journées'+(avant!=null&&avant!==js.jours?' (vous aviez indiqué '+String(avant).replace('.',',')+')':'')+' : rien à saisir.'+(conflit?' Vous aviez indiqué '+reposTexte(fe)+' : votre choix est gardé, Mes services vous propose celui de la caisse.':'');}
function journeesLigne(P){
  if(!P)return '';var n=P.nouveaux.length+P.remplacees.length;
  if(!n)return 'Journées de caisse : déjà à jour ('+int(P.rows.length)+' jours'+(P.gardees?', '+int(P.gardees)+' clôture'+(P.gardees>1?'s':'')+' de caisse gardée'+(P.gardees>1?'s':'')+' telle'+(P.gardees>1?'s':'')+' quelle'+(P.gardees>1?'s':''):'')+').';
  return '<b>'+int(n)+' journée'+(n>1?'s':'')+' de caisse</b> remplie'+(n>1?'s':'')+' depuis cet export, du '+esc(dateLabel(P.rows[0].date))+' au '+esc(dateLabel(P.rows[P.rows.length-1].date))+' : chiffre du jour TTC = somme des articles'+(P.rows.some(function(x){return x.tkJ!=null;})?', tickets comptés':'')+'.'+
    (P.gardees?' '+int(P.gardees)+' clôture'+(P.gardees>1?'s':'')+' de caisse déjà importée'+(P.gardees>1?'s':'')+' : gardée'+(P.gardees>1?'s':'')+' telle'+(P.gardees>1?'s':'')+' quelle'+(P.gardees>1?'s':'')+'.':'')+
    (P.remplacees.length?' '+int(P.remplacees.length)+' journée'+(P.remplacees.length>1?'s':'')+' saisie'+(P.remplacees.length>1?'s':'')+' à la main, différente'+(P.remplacees.length>1?'s':'')+' : la caisse fait foi (l’ancienne valeur est gardée dans l’historique des corrections).':'');
}
/* La carte « Journées de caisse » dans Importer mes chiffres : ce qui est déjà là, puis l'import des clôtures. */
function jCard(){return doc.getElementById('a15-journees');}
function jEtat(){var d=DB(),L=(d&&d.histJour||[]).filter(journeeCaisse).map(function(r){return String(r.date).slice(0,10);}).sort(),js=joursSemaine();
  /* C210 (V34) : en démonstration, les journées de caisse sont fictives (source « demo-pos ») ; à la main, elles sont saisies.
     Ne plus écrire « aucune journée » quand l’Accueil en suit : dire ce qu’il y a et d’où cela vient. */
  /* C300 (V15-081) : un dossier réel annonçait « 618 journées de caisse de démonstration » (reste d'une démo ouverte avant) et la
     démo Bar-restaurant « aucune journée » (ses 1 818 journées n'ont pas la source « pos »). Les journées de démonstration ne se
     comptent que dans une démonstration, quelle que soit leur source. */
  var enDemo=!!(d&&(d._demo||d.exempleCharge||(d.dataProvenance&&(d.dataProvenance.nature==='model_estimate'||d.dataProvenance.verificationLevel==='simulation'))));
  if(!L.length){var hj=(d&&d.histJour)||[],D=enDemo?hj.filter(function(r){return r&&r.date&&(r.demo||r.fictional||/demo/i.test(String(r.source||'')))&&(+r.caJ>0||+r.ca>0);}).map(function(r){return String(r.date).slice(0,10);}).sort():[],
    M=hj.filter(function(r){return r&&!r.demo&&r.date&&!journeeCaisse(r)&&(+r.caJ>0||+r.ca>0);}).length;
    if(D.length)return '<div class="a15-sum a15-ok"><b>'+int(D.length)+' journée'+(D.length>1?'s':'')+' de caisse de démonstration</b>, du '+esc(dateLabel(D[0]))+' au '+esc(dateLabel(D[D.length-1]))+(js?' · '+js.jours+' jour'+(js.jours>1?'s':'')+' d’ouverture par semaine'+(js.repos&&js.repos.length?', '+reposTexte(js.repos):''):'')+'. Avec vos chiffres, les clôtures de votre caisse les remplacent.</div>';
    if(M)return '<div class="a15-sum">Aucune clôture de caisse importée pour l’instant : '+int(M)+' journée'+(M>1?'s':'')+' saisie'+(M>1?'s':'')+' à la main sui'+(M>1?'vent':'t')+' vos ventes à l’Accueil. L’export « ventes par article » ci-dessus apporte aussi les clôtures.</div>';
    return '<div class="a15-sum">Aucune journée de caisse pour l’instant. L’export « ventes par article » ci-dessus les remplit aussi.</div>';}
  return '<div class="a15-sum a15-ok"><b>'+int(L.length)+' journée'+(L.length>1?'s':'')+' de caisse</b>, du '+esc(dateLabel(L[0]))+' au '+esc(dateLabel(L[L.length-1]))+(js?' · '+js.jours+' jour'+(js.jours>1?'s':'')+' d’ouverture par semaine'+(js.repos&&js.repos.length?', '+reposTexte(js.repos):''):'')+'.</div>';}
function jRender(){var c=jCard();if(!c)return;var form=typeof root.dailyCsvHTML==='function'?String(root.dailyCsvHTML()).replace('<details class="card">','<details class="a15-det">'):'';
  c.innerHTML='<h2 style="margin:0 0 4px">Journées de caisse</h2><p class="note" style="margin:0 0 6px">Le chiffre de chaque journée (clôture, ticket Z). Il suit vos ventes jour par jour à l’Accueil et donne vos jours d’ouverture.</p>'+jEtat()+form;}
function jMount(){var p=card(),c=jCard();if(!p||!p.parentNode)return;
  if(c){if(p.nextElementSibling!==c)p.parentNode.insertBefore(c,p.nextSibling);return;}
  c=doc.createElement('section');c.id='a15-journees';c.className='card';c.setAttribute('data-guard-ignore','1');p.parentNode.insertBefore(c,p.nextSibling);jRender();}

/* ───────── Vera complète : catégorie, plat proche, recette de départ ───────── */
var CATS=[[/plat du jour|suggestion/,'Plat du jour'],[/cafe gourmand|the gourmand/,'Desserts'],[/petit.?dej|brunch|croissant|pain au choc|viennois/,'Petit-déjeuner'],[/supplement|extra|option|topping|sauce en plus/,'Suppléments'],[/biere|vin\b|rose\b|rouge\b|blanc\b|cocktail|spritz|mojito|champagne|pinte|demi|whisky|rhum|gin|vodka|aperol|pastis|kir/,'Boissons alcoolisées'],[/\beau\b|soda|soft|coca|jus|the\b|cafe|espresso|cappuccino|latte|chocolat chaud|limonade|perrier|sirop|smoothie|boisson/,'Boissons'],[/dessert|tiramisu|brulee|mousse|tarte|fondant|glace|sorbet|cafe gourmand|crumble|cheesecake|panna|cookie|brownie|gaufre|crepe sucree|pudding|riz au lait|compote|fromage blanc|muffin|banana bread|energy ball/,'Desserts'],[/fromage|camembert|plateau/,'Fromages'],[/burger|pizza|bowl|tacos|wrap|sandwich|kebab|steak|entrecote|tartare|cote de|magret|poulet|poisson|saumon|dorade|pates|risotto|lasagne|curry|wok|ramen|pho|bo bun|couscous|tajine|blanquette|bourguignon|moules|omelette|croque|quiche|galette|hot dog|plat\b/,'Plats'],[/frites|accompagnement|garniture|riz nature|legumes|salade verte|pommes de terre/,'Accompagnements'],[/menu|formule|combo/,'Menus'],[/salade/,'Salades'],[/entree|soupe|veloute|tartare|carpaccio|oeuf|terrine|rillette|bruschetta|nems|samoussa|houmous|tapas|planche|a partager/,'Entrées']];
function guessCategory(nom,cats){
  var n=norm(nom);for(var i=0;i<CATS.length;i++)if(CATS[i][0].test(n))return pick(CATS[i][1],cats);
  return pick('Plats',cats);
}
/* Si la carte a déjà une catégorie équivalente (« Dessert » / « Desserts », « Plat »), on la reprend telle quelle. */
function pick(label,cats){var want=norm(label).replace(/s$/,'');for(var i=0;i<(cats||[]).length;i++){if(norm(cats[i]).replace(/s$/,'')===want)return cats[i];}return label;}
function words(s){return norm(s).split(' ').filter(function(w){return w.length>=3&&!/^(les|des|aux|avec|sans|du|de|la|le|et|ou|au|en|sur|pour|maison|chef|petit|grand|grande)$/.test(w);});}
function similarity(a,b){var A=words(a),B=words(b);if(!A.length||!B.length)return 0;var hit=0;A.forEach(function(w){if(B.some(function(x){return x===w||x.indexOf(w)===0||w.indexOf(x)===0;}))hit++;});return hit/Math.max(A.length,B.length);}
function similarDish(nom,plats){var best=null,bs=0;(plats||[]).forEach(function(p){if(!p||!p.nom||p.cpArchived)return;var s=similarity(nom,p.nom);if(s>bs){bs=s;best=p;}});return bs>=.5?{plat:best,score:bs}:null;}
/* Recette de départ : copie d'un plat proche (quantités comprises, à vérifier) ; sinon les ingrédients du catalogue
   dont le nom est dans celui de l'article, sans quantité (le client la met). Jamais de quantité inventée. */
function draftRecipe(nom,plats,ing){
  var sim=similarDish(nom,plats);
  if(sim&&(sim.plat.rec||[]).length)return {kind:'copie',from:sim.plat.nom,rec:JSON.parse(JSON.stringify(sim.plat.rec)),preps:JSON.parse(JSON.stringify(sim.plat.preps||[])),esp:sim.plat.esp||null};
  var W=words(nom),lines=[];(ing||[]).forEach(function(g){if(!g||!g.nom)return;var gw=words(g.nom);if(gw.some(function(w){return W.some(function(x){return x===w||(w.length>=4&&(x.indexOf(w)===0||w.indexOf(x)===0));});}))lines.push([g.nom,'']);});
  return {kind:lines.length?'ingredients':'vide',rec:lines.slice(0,6),preps:[]};
}
function espFor(cat){return /boisson|bar|cafe|the/i.test(norm(cat))?'bar':'cuisine';}

/* ───────── État et interface ───────── */
var S={text:'',read:null,lot:null,period:null,unknown:[],applied:null};
function cats(){var d=DB(),a=[];(d&&d.plats||[]).forEach(function(p){if(p.cat&&a.indexOf(p.cat)<0)a.push(p.cat);});return a;}
/* C300 (V15-022, avec L7) : au changement ou à la création d'un établissement, la lecture de l'export de caisse en cours (fichier lu,
   période, tickets) est oubliée : « Lu dans la caisse : N tickets » ne vient plus d'un autre établissement. */
/* C310 (V16-066) : répondre « 6 jours » à « Combien de jours ouvrez-vous par semaine ? » (029, document comptable seul) mettait le
   dimanche en repos d'office : un restaurant fermé le lundi aurait de faux minimums de jour. Sans caisse pour le dire, Verdict
   demande aussitôt quel(s) jour(s) l'établissement est fermé ; rien n'est supposé tant que le patron n'a pas répondu. */
function reposQuestion(n,parent,avant){var d=DB();if(!d||!(n>=1&&n<7)||!doc.createElement)return;var manque=7-n,choix=[];
  var c=doc.createElement('div');c.className='card';c.id='a15-repos-q';c.style.cssText='border-left:3px solid #f97316;margin:0 0 12px';
  var dessiner=function(){c.innerHTML='<b>Quel'+(manque>1?'s jours êtes-vous fermé':' jour êtes-vous fermé')+' ?</b><p class="note" style="margin:6px 0 2px">'+(manque>1?'Choisissez vos '+manque+' jours de fermeture':'Choisissez votre jour de fermeture')+' : vos minimums de chaque jour en dépendent. L’export de votre caisse le dit aussi.</p><div>'+JOURS.map(function(j,i){var on=choix.indexOf(i)>=0;return '<button type="button" class="btn sec" data-a15-repos="'+i+'" aria-pressed="'+(on?'true':'false')+'" style="display:inline-flex;justify-content:center;width:auto;margin:6px 6px 0 0'+(on?';background:#15803d!important;color:#fff!important;border-color:#15803d!important':'')+'">'+(on?'✓ ':'')+j.charAt(0).toUpperCase()+j.slice(1)+'</button>';}).join('')+'</div>'+(choix.length===manque?'<button type="button" class="btn" data-a15-repos="ok" style="margin-top:10px">Enregistrer : '+esc(reposTexte(choix))+'</button>':'');};
  c.addEventListener('click',function(ev){var b=ev.target&&ev.target.closest?ev.target.closest('[data-a15-repos]'):null;if(!b)return;var v=b.getAttribute('data-a15-repos');
    if(v==='ok'){var dd=DB();if(!dd)return;dd.fermes=choix.slice().sort(nb);dd.fermesSource={source:'patron',repos:dd.fermes.slice(),at:new Date().toISOString(),via:'question-jours'};c.remove();try{root.save('repos-patron');}catch(e){}try{root.dispatchEvent(new CustomEvent('verdict:jours-ouverts',{detail:{jours:7-dd.fermes.length,fermes:dd.fermes.slice(),source:'patron'}}));}catch(e){}try{root.refreshAll();}catch(e){}try{root.toast(reposTexte(dd.fermes).charAt(0).toUpperCase()+reposTexte(dd.fermes).slice(1)+' : c’est enregistré.');}catch(e){}return;}
    var i=+v,k=choix.indexOf(i);if(k>=0)choix.splice(k,1);else{if(choix.length>=manque)choix.shift();choix.push(i);}dessiner();});
  dessiner();if(parent&&parent.isConnected){parent.insertBefore(c,avant&&avant.parentNode===parent?avant:parent.firstChild);}else{var v=doc.getElementById('v-pil');if(v)v.insertBefore(c,v.firstChild);}}
function wrapJours(){var f=root.verdictJoursRepondre;if(typeof f!=='function'||f.__c310)return;
  var g=function(n){var q=doc.getElementById('vdJoursQ'),parent=q&&q.parentNode,avant=q&&q.nextSibling,r=f.apply(this,arguments);
    try{n=Math.round(Number(n));var d=DB();if(n>=1&&n<7&&!joursSemaine()&&!(d&&d.fermesSource&&d.fermesSource.source==='patron'))reposQuestion(n,parent,avant);}catch(e){}return r;};
  g.__c310=true;root.verdictJoursRepondre=g;}
wrapJours();setTimeout(wrapJours,500);setTimeout(wrapJours,2000);
/* C310 (V16-004, décision 3, avec L2) : un import de journées de caisse (clôtures ou ventes par article) émet
   « verdict:caisse-importee » ; le plan du mois (041, L2) refait alors les poids des jours avec la caisse. Un seul signal par import. */
var DERNIER_IMPORT=typeof WeakMap==='function'?new WeakMap():null;
function signalCaisse(){var d=DB();if(!d||!DERNIER_IMPORT)return;var L=d.dailyImports||[],x=L[L.length-1];if(!x)return;var cle=L.length+'|'+(x.at||'');
  if(!DERNIER_IMPORT.has(d)){DERNIER_IMPORT.set(d,cle);if(Date.now()-Date.parse(x.at||0)>10000)return;}else if(DERNIER_IMPORT.get(d)===cle)return;
  DERNIER_IMPORT.set(d,cle);if(!((x.added||0)+(x.replaced||0)>0))return;
  var J=(d.histJour||[]).filter(function(r){return r&&r.date&&!r.demo&&journeeCaisse(r)&&num(r.caJ)>0;}).map(function(r){return String(r.date).slice(0,10);}).sort(),mois={};J.forEach(function(k){mois[k.slice(0,7)]=1;});
  try{root.dispatchEvent(new CustomEvent('verdict:caisse-importee',{detail:{jours:J.length,du:J[0]||null,au:J[J.length-1]||null,mois:Object.keys(mois),ajoutees:x.added||0,remplacees:x.replaced||0,source:x.source||'journees-caisse'}}));}catch(e){}}
function oublierLecture(){S.applied=null;S.text='';S.lot=null;S.unknown=[];S.jour=null;S.read=null;S.period=null;S.periodChosen=false;}
function fecDone(){var d=DB();return !!(d&&d.fecImport&&d.fecImport.totals);}
function caisseDone(){var d=DB();return !!(d&&(d.posImports||[]).some(function(x){return x&&x.source==='un-seul-passage';}));}
function structureState(){var R=null,m=[];try{R=root.moteur();}catch(e){}try{m=root.donneesManquantes();}catch(e){}return {ready:!!(R&&R.ready),score:R&&R.ready?Math.round(R.score):null,missing:m.map(function(c){return c.lb||c.k;})};}
/* C216 (W55) : la note Structure du passage unique suit celle de l'en-tête à chaque enregistrement (journées de caisse, saisie). */
function structHtml(st){return st.ready?'<b>score '+st.score+' / 100</b>':'<b>à compléter</b> — '+esc(st.missing.slice(0,4).join(', '));}
function structCle(st){return st.ready?'s'+st.score:'m'+st.missing.join('|');}
function majStruct(){var e=doc.getElementById('a15-struct');if(!e)return;var st=structureState(),k=structCle(st);if(e.getAttribute('data-k')===k)return;e.setAttribute('data-k',k);e.innerHTML=structHtml(st);}
function carteState(){var d=DB(),plats=(d&&d.plats||[]).filter(function(p){return !p.cpArchived;}),withVol=0,incomplete=0;plats.forEach(function(p){if(num(p.vol)!=null)withVol++;var k={};try{k=root.platCalc(p)||{};}catch(e){}if(!k.recetteComplete&&k.complete!==true)incomplete++;});return {plats:plats.length,withVol:withVol,incomplete:incomplete};}

function css(){
  if(doc.getElementById('a15-css'))return;var st=doc.createElement('style');st.id='a15-css';
  st.textContent='#a15-passage{margin-top:14px}#a15-passage .a15-steps{display:flex;gap:6px;margin:10px 0 12px;flex-wrap:wrap}#a15-passage .a15-step{flex:1;min-width:120px;display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;border:1.5px solid var(--line,#d6dde3);font-weight:700;font-size:13px}#a15-passage .a15-step b{width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;background:rgba(127,127,127,.15)}#a15-passage .a15-step.ok{border-color:#16a34a;background:rgba(22,163,74,.08)}#a15-passage .a15-step.ok b{background:#16a34a;color:#fff}#a15-passage .a15-step.now{border-color:#d4a72c;background:rgba(212,167,44,.1)}#a15-passage .a15-step.now b{background:#d4a72c;color:#1a1200}'+
  '#a15-passage .a15-row{display:grid;grid-template-columns:auto minmax(0,1.4fr) 70px minmax(120px,1fr) 90px;gap:8px;align-items:center;padding:9px 0;border-top:1px solid var(--line,#e5e9ee);font-size:14px}@media(max-width:640px){#a15-passage .a15-row{grid-template-columns:28px 1fr 1fr}#a15-passage .a15-row>span:nth-child(2),#a15-passage .a15-row .a15-q{grid-column:2/4}#a15-passage .a15-row select{grid-column:2/3}#a15-passage .a15-row input[type=text]{grid-column:3/4}#a15-passage .a15-why{margin-left:0;grid-column:2/4}}#a15-passage .a15-row input[type=checkbox]{width:18px;height:18px}#a15-passage .a15-row select,#a15-passage .a15-row input[type=text]{padding:7px 8px;border-radius:9px;border:1px solid var(--line,#d6dde3);background:transparent;color:inherit;font:600 13.5px system-ui;min-width:0;width:100%}#a15-passage .a15-why{grid-column:1/-1;font-size:12.5px;opacity:.75;margin:-4px 0 0 26px}'+
  '#a15-passage .a15-sum{border-radius:14px;padding:11px 13px;background:rgba(212,167,44,.1);margin:10px 0;font-size:14px}#a15-passage .a15-ok{background:rgba(22,163,74,.1)}#a15-passage .a15-warn{background:rgba(249,115,22,.12)}#a15-passage .a15-vera{display:flex;gap:10px;align-items:center;margin:12px 0 6px}#a15-passage .a15-vera img{width:40px;height:40px;border-radius:50%;box-shadow:0 0 0 2px #d4a72c}#a15-passage .a15-vera b{font-size:15px}#a15-passage .a15-file{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}#a15-passage .a15-file select{padding:9px 10px;border-radius:10px;border:1px solid var(--line,#d6dde3);background:transparent;color:inherit;font:600 14px system-ui}#a15-passage label.a15-consent{display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:8px 0}#a15-passage .a15-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}#a15-passage .a15-list{margin:6px 0 10px;padding-left:20px;font-size:14px}#a15-passage .a15-list li{margin:4px 0}#a15-passage .a15-ask{border:1.5px solid #d4a72c;border-radius:14px;padding:11px 13px;margin:10px 0;background:rgba(212,167,44,.08)}#a15-passage .a15-q1{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;justify-content:space-between;margin:8px 0;font-size:14px}#a15-passage .a15-q1in{display:flex;gap:8px;align-items:center;font-size:13px}#a15-passage .a15-q1 input{width:96px;padding:7px 8px;border-radius:9px;border:1px solid var(--line,#d6dde3);background:transparent;color:inherit;font:600 14px system-ui}#a15-passage details.a15-det{margin:8px 0}#a15-passage details.a15-det>summary{cursor:pointer;font-weight:750;font-size:14px;padding:6px 0}'+
  '#a15-journees{margin-top:14px}#a15-journees .a15-sum{border-radius:14px;padding:11px 13px;background:rgba(212,167,44,.1);margin:10px 0;font-size:14px}#a15-journees .a15-ok{background:rgba(22,163,74,.1)}#a15-journees details.a15-det{margin:8px 0}#a15-journees details.a15-det>summary{cursor:pointer;font-weight:750;font-size:14px;padding:6px 0}';
  (doc.head||doc.documentElement).appendChild(st);
}
function avatar(){var i=doc.querySelector('img.v-help-avatar');return i&&i.src?i.src:'';}
function card(){return doc.getElementById('a15-passage');}
function mount(){
  var fec=doc.getElementById('v44-fec'),host=doc.getElementById('v-in'),c0=card();
  /* La carte FEC peut arriver après : on se place toujours juste sous elle. */
  if(c0){if(fec&&fec.parentNode&&fec.nextElementSibling!==c0)fec.parentNode.insertBefore(c0,fec.nextSibling);jMount();return true;}
  if(!host)return false;
  css();var c=doc.createElement('section');c.id='a15-passage';c.className='card';c.setAttribute('data-guard-ignore','1');
  if(fec&&fec.parentNode)fec.parentNode.insertBefore(c,fec.nextSibling);else host.appendChild(c);
  render();jMount();return true;
}
function stepsHtml(){
  var f=fecDone(),k=caisseDone(),v=k&&!S.unknown.length;
  return '<div class="a15-steps"><div class="a15-step '+(f?'ok':'now')+'"><b>'+(f?'✓':'1')+'</b>Fichier comptable</div><div class="a15-step '+(k?'ok':(f?'now':''))+'"><b>'+(k?'✓':'2')+'</b>Export de caisse</div><div class="a15-step '+(v?'ok':(k||S.unknown.length?'now':''))+'"><b>'+(v?'✓':'3')+'</b>Vera complète</div></div>';
}
function monthOptions(sel){
  var h='',read=S.read&&S.read.ok?S.read:null,moy=read?moyenneOption(read):null,list=read?mois(read).map(function(m){return m.per;}).reverse():[],p=today();
  if(!list.length)for(var i=0;i<14;i++)list.push(addMonth(p,-i));
  if(sel&&!/^moy:/.test(sel)&&list.indexOf(sel)<0)list.unshift(sel);
  if(moy)h+='<option value="'+moy.value+'"'+(moy.value===sel?' selected':'')+'>Moyenne par mois · '+esc(monthLabel(moy.debut))+' → '+esc(monthLabel(moy.fin))+'</option>';
  list.forEach(function(per){h+='<option value="'+per+'"'+(per===sel?' selected':'')+'>'+monthLabel(per)+'</option>';});
  return h;
}
function render(){
  var c=card();if(!c)return;var d=DB(),f=fecDone(),st=structureState(),ct=carteState();
  var h='<h2 style="margin:0 0 4px">Un seul passage : fichier comptable + export de caisse</h2><p class="note" style="margin:0 0 6px">Vos deux notes d’un coup. Le fichier comptable (FEC) donne la <b>Structure</b> ; l’export « ventes par article » de votre caisse donne la <b>Carte</b>. Tout est lu ici, dans ce navigateur : rien n’est envoyé.</p>'+stepsHtml();
  if(!f){h+='<div class="a15-sum">Étape 1 : déposez votre fichier comptable dans la carte juste au-dessus. Vous pouvez aussi commencer par l’export de caisse ci-dessous : l’analyse de votre carte n’attend pas le fichier comptable.</div>';}
  else{var fi=d.fecImport;h+='<div class="a15-sum a15-ok">Fichier comptable lu : exercice '+esc(fi.period&&fi.period.year||'')+', chiffre d’affaires '+money(fi.totals.revenue)+'. Structure : <span id="a15-struct" data-k="'+esc(structCle(st))+'">'+structHtml(st)+'</span></div>';}
  if(S.applied){var a=S.applied;h+='<div class="a15-sum a15-ok"><b>Carte créée depuis votre caisse</b> · '+esc(periodLabel(a.period))+' : '+int(a.matched)+' plat'+(a.matched>1?'s':'')+' avec leurs ventes'+(a.created?' · '+int(a.created)+' fiche'+(a.created>1?'s':'')+' créée'+(a.created>1?'s':'')+' par Vera'+(a.vide?', sans recette':', à vérifier'):'')+(a.ajouts&&a.ajouts.length?' · '+int(a.ajouts.length)+' produit'+(a.ajouts.length>1?'s':'')+' ajouté'+(a.ajouts.length>1?'s':'')+' au catalogue avec un prix type':'')+(a.repris&&a.repris.length?' · '+int(a.repris.length)+' produit'+(a.repris.length>1?'s':'')+' de votre catalogue repris tel'+(a.repris.length>1?'s':'')+' quel'+(a.repris.length>1?'s':'')+' ('+esc(a.repris.slice(0,3).join(', '))+(a.repris.length>3?'…':'')+')':'')+(a.panier?' · panier moyen '+money(a.panier)+' et '+a.cmdj+' commandes par jour lus dans la caisse':'')+(a.dated?' · ventes datées conservées (écart matière théorique / réel)':'')+(a.jours?' · '+int(a.jours)+' journée'+(a.jours>1?'s':'')+' de caisse remplie'+(a.jours>1?'s':''):'')+(a.jsem?' · '+a.jsem.apres+' jours d’ouverture par semaine, lus dans la caisse':'')+(a.repos&&a.repos.apres?' · '+reposTexte(a.repos.apres)+', lu dans la caisse':'')+(a.repos&&a.repos.garde?' · votre calendrier est gardé ('+reposTexte(a.repos.avant)+') : la caisse dit '+reposTexte(a.repos.caisse)+', Mes services vous le propose':'')+'.'+(a.complet&&!(a.manquent||[]).length?'<br>Toute la carte vendue est couverte, recettes comprises : l’Indice Carte se calcule.':'')+((a.manquent||[]).length?'<br><b>Reste à compléter :</b> '+esc(a.manquent.slice(0,5).join(', '))+(a.manquent.length>5?'…':'')+'. L’Indice Carte attend '+(a.manquent.length>1?'ces recettes':'cette recette')+'.':'')+'<br>Carte : '+int(ct.plats)+' plats, '+int(ct.withVol)+' avec ventes, '+(ct.incomplete?int(ct.incomplete)+' recette'+(ct.incomplete>1?'s':'')+' à compléter':'toutes les recettes sont là')+'.</div><div class="a15-actions"><button type="button" class="btn" data-a15="score">Voir mon score</button><button type="button" class="btn ghost" data-a15="carte">'+(ct.incomplete?'Compléter mes recettes':'Voir ma carte')+'</button><button type="button" class="btn ghost" data-a15="again">Un autre mois</button></div>';}
  else{
    h+='<label class="a15-consent"><input type="checkbox" id="a15-consent"><span>J’autorise l’analyse locale de cet export pour préremplir la carte de cet établissement. Le fichier n’est ni envoyé ni conservé.</span></label>'+
      '<div class="a15-file"><label class="btn" for="a15-file">Choisir l’export de caisse</label><input id="a15-file" type="file" accept=".csv,.txt,text/csv,text/plain" hidden><select id="a15-period" aria-label="Mois du fichier">'+monthOptions(S.period||addMonth(today(),-1))+'</select><span class="note" id="a15-fname">Colonnes minimales : article et quantité. La date, le montant, la TVA et la famille servent aussi : un export de plusieurs mois donne la carte de toute l’année, saisons comprises.</span></div><div id="a15-preview"></div>';
  }
  c.innerHTML=h;bind(c);
}
function bind(c){
  var inp=c.querySelector('#a15-file'),consent=c.querySelector('#a15-consent'),per=c.querySelector('#a15-period');
  if(inp&&!inp._a15){inp._a15=1;inp.addEventListener('click',function(e){if(!consent.checked){e.preventDefault();toast('Cochez d’abord l’autorisation d’analyse locale');consent.focus();}});
    inp.addEventListener('change',function(){var f=inp.files&&inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){S.text=String(r.result||'');S.periodChosen=false;c.querySelector('#a15-fname').textContent=f.name;preview();};r.readAsText(f);});}
  if(per&&!per._a15){per._a15=1;per.addEventListener('change',function(){S.period=per.value;S.periodChosen=true;if(S.text)preview();});}
  [].forEach.call(c.querySelectorAll('[data-a15]'),function(b){if(b._a15)return;b._a15=1;b.addEventListener('click',function(){var k=b.getAttribute('data-a15');
    if(k==='score'){try{root.go('pil');}catch(e){}}
    else if(k==='carte'){try{root.go('carte');}catch(e){}}
    else if(k==='again'){S.applied=null;S.text='';S.lot=null;S.unknown=[];S.periodChosen=false;render();}
    else if(k==='apply')apply(false);else if(k==='apply-vide')apply(true);
  });});
}
function preview(){
  var c=card(),out=c&&c.querySelector('#a15-preview');if(!out)return;
  var read=readCsv(S.text);S.read=read;
  if(!read.ok){out.innerHTML='<div class="a15-sum a15-warn">Fichier non lu : '+esc(read.reason)+'.</div>';return;}
  /* C192 — un export de plusieurs mois complets : la carte prend la moyenne par mois (saisons comprises), pas un seul mois. */
  var vol=volumes(read),moy=moyenneOption(read);if(!S.periodChosen)S.period=moy?moy.value:(vol&&vol.period)||S.period;
  var sel=c.querySelector('#a15-period');if(sel){sel.innerHTML=monthOptions(S.period);sel.value=S.period;}
  var period=S.period;
  var lot=null;try{lot=analyse(S.text,period);}catch(e){lot={matched:[],unknown:[],invalid:[{reason:String(e.message)}],duplicate:false};}
  S.lot=lot;
  var info=infosArticles(read,period),FT=root.VerdictFichesTypes||null;
  var unknownAgg={};lot.unknown.forEach(function(u){var k=norm(u.nom);if(!unknownAgg[k])unknownAgg[k]={nom:u.nom,qte:0,reason:u.reason};unknownAgg[k].qte+=num(u.qte)||0;});
  var d=DB(),plats=(d.plats||[]).filter(function(p){return !p.cpArchived;}),ing=d.ing||[],existing=cats();
  /* Tout vient de la caisse : nom, prix, TVA, famille, ventes. Recette : plat proche de la carte, sinon fiche type ; ce qui change chaque jour demande un seul chiffre. */
  /* C216 (W56) : un coût de portion déjà tapé survit à un nouvel aperçu, et s'écrit à la française (« 4,20 », jamais « 4.20 »). */
  var dejaP={};(S.unknown||[]).forEach(function(u){if(u&&u.portion!=null)dejaP[norm(u.nom)]=u.portion;});
  S.unknown=Object.keys(unknownAgg).map(function(k){var u=unknownAgg[k],x=info[k]||{};
    var dr=draftRecipe(u.nom,plats,ing),ft=dr.kind==='copie'||!FT?null:FT.trouver(u.nom);
    var fam=x.famille&&FT?FT.famille(x.famille):null,cat=fam?pick(fam,existing):ft?pick(ft.cat,existing):guessCategory(u.nom,existing);
    var tva=x.tvaLue!=null?x.tvaLue:ft&&ft.tva!=null?ft.tva:(/alcool/.test(norm(cat))?20:null);
    return {nom:u.nom,qte:u.qte,reason:u.reason,cat:cat,price:x.price!=null?x.price:unitPrice(read,u.nom),tva:tva,tvaLue:x.tvaLue!=null,draft:dr,fiche:ft,variable:!!(FT&&!ft&&dr.kind!=='copie'&&FT.variable(u.nom)),portion:dejaP[k]!=null?dejaP[k]:null,keep:u.qte>0};});
  S.unknown.sort(function(a,b){return b.qte-a.qte;});
  var U=S.unknown,prets=U.filter(function(u){return u.draft.kind==='copie'||u.fiche;}),manque=U.filter(function(u){return !(u.draft.kind==='copie'||u.fiche);});
  var nouveaux=produitsAjoutes(U),per=periodLabel(period),mo=lot.moyenne;
  /* C193 — les journées de caisse viennent du même export, dans la même validation. */
  S.jour=planJournees(read);var jl=journeesLigne(S.jour),jsl=S.jour?jsemLigne(joursSemaine(S.jour.nouveaux.concat(S.jour.remplacees))):'';
  var h='<div class="a15-sum">'+int(read.rows.length)+' lignes lues · <b>'+int(U.length+lot.matched.length)+' articles vendus</b>'+(mo?' · '+esc(per):' · '+esc(per))+(lot.matched.length?' · '+int(lot.matched.length)+' déjà sur votre carte':'')+(lot.invalid.length?' · '+int(lot.invalid.length)+' ligne'+(lot.invalid.length>1?'s':'')+' à corriger ('+esc(lot.invalid.slice(0,2).map(function(x){return x.reason;}).join(' ; '))+')':'')+(lot.duplicate?' · <b>fichier déjà importé</b>':'')+'.'+
    (vol&&(vol.panier||vol.cmdj)?'<br>Lu dans la caisse : '+(vol.tickets?int(vol.tickets)+' tickets':'')+(vol.panier?' · panier moyen '+money(vol.panier)+' TTC':'')+(vol.cmdj?' · '+vol.cmdj+' commandes par jour sur '+int(vol.days)+' jours':'')+'.':'')+(U.length?'':(jl?'<br>'+jl:'')+(jsl?'<br>'+jsl:''))+'</div>';
  if(U.length){
    var coh=coherence(read,period);
    h+='<div class="a15-vera">'+(avatar()?'<img alt="" src="'+esc(avatar())+'">':'')+'<div><b>Vera a préparé votre carte</b><div class="note">Tout vient de votre caisse : nom, prix, TVA, catégorie et ventes. Pour les recettes, Vera reprend un plat proche de votre carte ou les quantités habituelles d’une brasserie. Vous les vérifiez quand vous voulez : vos factures et votre document comptable les contrôlent.</div></div></div><ul class="a15-list">'+
      (prets.length?'<li><b>'+int(prets.length)+' fiche'+(prets.length>1?'s':'')+' prête'+(prets.length>1?'s':'')+'</b> : prix et TVA lus dans la caisse, recette '+(prets.some(function(u){return u.fiche;})?'type':'copiée d’un plat proche')+' à vérifier.</li>':'')+
      (nouveaux.length?'<li><b>'+int(nouveaux.length)+' produit'+(nouveaux.length>1?'s':'')+' ajouté'+(nouveaux.length>1?'s':'')+' à votre catalogue</b> avec un prix type ('+esc(nouveaux.slice(0,4).join(', '))+(nouveaux.length>4?'…':'')+') : vos factures le remplaceront.</li>':'')+
      (coh?'<li>'+coh+'</li>':'')+(jl?'<li>'+jl+'</li>':'')+(jsl?'<li>'+jsl+'</li>':'')+'</ul>';
    if(manque.length){
      h+='<div class="a15-ask"><b>'+(manque.length>1?int(manque.length)+' informations manquent':'Une seule information manque')+'</b><div class="note">'+(manque.every(function(u){return u.variable;})?'Ce qui change chaque jour n’a pas de recette fixe : Verdict ne la devine pas.':'Pas de recette type pour '+(manque.length>1?'ces articles':'cet article')+' : Verdict ne la devine pas.')+' Un seul chiffre suffit.</div>';
      manque.forEach(function(u){var i=U.indexOf(u);h+='<label class="a15-q1"><span><b>'+esc(u.nom)+'</b> · '+fmtVol(u.qte,mo)+'</span><span class="a15-q1in">Marchandise d’une '+(u.variable?'assiette':'portion')+', en moyenne (€ HT) <input type="text" inputmode="decimal" data-a15-portion="'+i+'" placeholder="ex. 4,20" value="'+(u.portion!=null?esc(u.portion.toLocaleString(tag(),{minimumFractionDigits:2,maximumFractionDigits:2})):'')+'"></span></label>';});
      h+='<div class="note">Laissé vide : la fiche est créée sans recette et l’Indice Carte attend ce chiffre.</div></div>';
    }
    h+='<details class="a15-det"><summary>Voir ou ajuster les '+int(U.length)+' fiches</summary>';
    U.forEach(function(u,i){var rec=u.draft.kind==='copie'?u.draft.rec:u.fiche?u.fiche.rec:null,cost=rec&&FT?FT.cout(rec,ing,d.reg):null,ht=u.price!=null?u.price/(1+(u.tva!=null?u.tva:tvaDefaut())/100):null;
      var why=u.draft.kind==='copie'?'Copie de « '+u.draft.from+' » de votre carte':u.fiche?'Fiche type « '+u.fiche.nom+' » : '+(FT?FT.resume(u.fiche.rec):''):u.variable?'Change chaque jour : coût d’une assiette demandé ci-dessus':'Pas de recette type : coût d’une portion demandé ci-dessus';
      why+=' · TVA '+String(u.tva!=null?u.tva:tvaDefaut()).replace('.',',')+' %'+(u.tvaLue?' (caisse)':'')+(cost!=null&&ht>0?' · coût '+money(cost)+', soit '+Math.round(cost/ht*100)+' % du prix HT':'');
      h+='<div class="a15-row"><input type="checkbox" data-a15-keep="'+i+'"'+(u.keep?' checked':'')+' aria-label="Garder '+esc(u.nom)+'"><span><b>'+esc(u.nom)+'</b></span><span class="a15-q">'+fmtVol(u.qte,mo)+'</span><select data-a15-cat="'+i+'" aria-label="Catégorie">'+catOptions(u.cat)+'</select><input type="text" inputmode="decimal" placeholder="Prix TTC" aria-label="Prix TTC" data-a15-price="'+i+'" value="'+(u.price!=null?esc(String(u.price).replace('.',',')):'')+'"><div class="a15-why">'+esc(why)+'</div></div>';});
    h+='</details>';
  }
  var can=(lot.matched.length||S.unknown.some(function(u){return u.keep;}))&&!lot.duplicate;
  h+='<div class="a15-actions"><button type="button" class="btn" data-a15="apply"'+(can?'':' disabled')+'>'+(U.length?'Créer ma carte (conseillé)':'Appliquer les ventes')+'</button>'+(U.length?'<button type="button" class="btn ghost" data-a15="apply-vide"'+(can?'':' disabled')+'>Créer les plats sans recette</button>':'')+'</div>'+(U.length?'<p class="note">Une seule validation. Tout reste modifiable ensuite dans Carte.</p>':'');
  out.innerHTML=h;
  [].forEach.call(out.querySelectorAll('[data-a15-keep]'),function(i){i.addEventListener('change',function(){S.unknown[+i.getAttribute('data-a15-keep')].keep=i.checked;});});
  [].forEach.call(out.querySelectorAll('[data-a15-cat]'),function(s){s.addEventListener('change',function(){S.unknown[+s.getAttribute('data-a15-cat')].cat=s.value;});});
  [].forEach.call(out.querySelectorAll('[data-a15-price]'),function(s){s.addEventListener('input',function(){S.unknown[+s.getAttribute('data-a15-price')].price=num(s.value);});});
  [].forEach.call(out.querySelectorAll('[data-a15-portion]'),function(s){s.addEventListener('input',function(){var v=num(s.value);S.unknown[+s.getAttribute('data-a15-portion')].portion=v!=null&&v>0&&v<1000?v:null;});});
  /* C228 (X21) : le contrôle commun des champs décimaux (verdict-034) réécrit « 4,20 » en « 4.20 » à la sortie du champ. Ces champs
     sont lus avec la virgule (num) : on leur rend l'écriture de la langue juste après ce contrôle. */
  [].forEach.call(out.querySelectorAll('input[inputmode=decimal]'),function(s){s.addEventListener('blur',virgule);});
  bind(c);
}
function virgule(ev){var el=ev&&ev.target;if(!el)return;var sep=(1.5).toLocaleString(tag()).charAt(1);if(sep!==',')return;var v=String(el.value||'');if(/^-?\d+\.\d+$/.test(v))el.value=v.replace('.',',');}
function catOptions(sel){var base=['Entrées','Salades','Plat du jour','Plats','Menus','Accompagnements','Fromages','Desserts','Boissons','Boissons alcoolisées','Suppléments'],all=cats();base.forEach(function(b){if(!all.some(function(x){return norm(x).replace(/s$/,'')===norm(b).replace(/s$/,'');}))all.push(b);});if(all.indexOf(sel)<0)all.unshift(sel);return all.map(function(x){return '<option'+(x===sel?' selected':'')+'>'+esc(x)+'</option>';}).join('');}
function toast(m){try{if(typeof root.toast==='function')root.toast(m);}catch(e){}}
/* C192 — produits de la fiche type : on reprend ceux du catalogue (même nom), sinon on les ajoute avec un prix type signalé. */
function nomProduit(nom){var d=DB(),k=norm(nom),FT=root.VerdictFichesTypes;
  /* C216 (W54) : le même produit déjà au catalogue sous un autre nom (facture, Inventaire) est repris, jamais doublé ;
     au prix réel, il passe avant le produit de départ du même nom que la fiche type. */
  var deja=FT&&FT.dansCatalogue?FT.dansCatalogue(nom,d.ing):null;if(deja){if(norm(deja)!==k)(S.repris=S.repris||[]).push(deja);return deja;}
  for(var i=0;i<(d.ing||[]).length;i++){var g=d.ing[i];if(g&&norm(g.nom)===k)return g.nom;}
  var t=FT&&FT.produit(nom);if(!t)return nom;
  d.ing.push({id:'ft-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),nom:t.nom,type:t.type,prix:t.prix,perte:t.perte,prixSource:'type',cpPrixType:true,cpCreatedAt:new Date().toISOString()});(S.ajouts=S.ajouts||[]).push(t.nom);return t.nom;}
function produitPortion(u){var d=DB(),nom=u.nom+' — marchandise par '+(u.variable?'assiette':'portion');for(var i=0;i<(d.ing||[]).length;i++)if(d.ing[i]&&d.ing[i].nom===nom){d.ing[i].prix=u.portion;return nom;}
  d.ing.push({id:'pp-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),nom:nom,type:'UNITE',prix:u.portion,perte:0,prixSource:'patron',cpPortion:true,cpCreatedAt:new Date().toISOString()});return nom;}
function createDish(u,vide){
  var d=DB(),id='qp-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),rec=[],preps=[],kind='vide',from=null;
  if(!vide){
    if(u.draft.kind==='copie'){rec=u.draft.rec||[];preps=u.draft.preps||[];kind='copie';from=u.draft.from;}
    else if(u.fiche){rec=u.fiche.rec.map(function(l){return [nomProduit(l[0]),l[1]];});kind='fiche-type';from=u.fiche.nom;}
    else if(u.portion>0){rec=[[produitPortion(u),1]];kind='portion';}
    else if(u.draft.kind==='ingredients'){rec=u.draft.rec||[];kind='ingredients';}
  }
  var p={id:id,nom:u.nom,cat:u.cat,esp:(u.fiche&&u.fiche.esp)||u.draft.esp||espFor(u.cat),ttc:u.price!=null?u.price:null,vol:null,rec:rec,preps:preps,tva:u.tva!=null?u.tva:null,cpVeraDraft:true,cpSource:'caisse',cpDraftKind:kind,cpDraftFrom:kind==='copie'?from:null,cpFicheType:kind==='fiche-type'?from:null,cpCreatedAt:new Date().toISOString()};
  d.plats.push(p);return p;
}
function apply(vide){
  if(!S.lot||!S.text)return;
  var go=function(){
    var created=0,manquent=[];S.ajouts=[];S.repris=[];S.unknown.forEach(function(u){if(u.keep){var p=createDish(u,vide);created++;if(!(p.rec&&p.rec.length&&p.rec.every(function(l){return l[1]!==''&&l[1]!=null;})))manquent.push(p.nom);}});
    var lot=analyse(S.text,S.period);
    if(lot.duplicate){toast('Ce fichier a déjà été importé : aucune vente doublée');return;}
    if(!lot.ok){toast('Fichier à corriger : '+((lot.invalid[0]||{}).reason||'aucun plat reconnu'));S.lot=lot;preview();return;}
    root.point5CommitImport(lot);
    var d=DB(),pi=d.posImports[d.posImports.length-1];if(pi){pi.source='un-seul-passage';if(lot.moyenne)pi.moyenne=lot.moyenne;}
    /* Toute la carte vendue sur des mois complets : le périmètre est établi par la caisse, sans case à cocher. */
    var complet=periodeComplete(S.read,S.period)&&!lot.unknown.length;
    if(d.carteRef){d.carteRef.fullMonth=complet;d.carteRef.origine='export-caisse';if(lot.moyenne)d.carteRef.moyenne=lot.moyenne;else delete d.carteRef.moyenne;}
    var dated=false;if(S.read&&S.read.hasDate&&typeof root.verdictDishSalesImport==='function'){try{var r=root.verdictDishSalesImport(S.text);dated=!!(r&&r.ok);}catch(e){}}
    var jours=appliquerJournees(S.jour),jsem=jours?majJoursSemaine():null;S.jour=null;var repos=jours?majJoursRepos():null;
    var vol=volumes(S.read),used=null;
    if(vol&&vol.panier&&vol.cmdj){var q=d.in||(d.in={});if(num(q.panier)==null)q.panier=vol.panier;if(num(q.cmdj)==null)q.cmdj=vol.cmdj;used=vol;d.caisseVolumes={period:S.period,panier:vol.panier,cmdj:vol.cmdj,tickets:vol.tickets,days:vol.days,source:'export-caisse',at:new Date().toISOString()};}
    S.applied={period:S.period,matched:lot.matched.length,created:created,ajouts:S.ajouts.slice(),repris:S.repris.filter(function(x,i,a){return a.indexOf(x)===i;}),manquent:manquent,complet:complet,vide:!!vide,panier:used&&used.panier,cmdj:used&&used.cmdj,dated:dated,jours:jours,jsem:jsem,repos:repos};
    try{root.save('un-seul-passage');}catch(e){}
    try{root.fillInputs();}catch(e){}try{root.readInputs();}catch(e){}try{root.refreshAll();}catch(e){}
    try{if(root.VerdictSaveGuard&&root.VerdictSaveGuard.rebase)root.VerdictSaveGuard.rebase();}catch(e){}
    S.unknown=[];render();jRender();toast('Carte créée depuis la caisse'+(created?' · '+created+' plat'+(created>1?'s':''):''));
  };
  if(typeof root.verdictBeforeRisk==='function'){root.verdictBeforeRisk('import-pos-items').then(function(ok){if(ok)go();});}else go();
}
/* Porte d'entrée : la carte « J’ai mon fichier comptable » annonce le passage unique. */
function doorNote(){
  var b=doc.querySelector('.ch-fec');if(!b||b.getAttribute('data-a15'))return;b.setAttribute('data-a15','1');
  var s=b.querySelector('span');if(s)s.textContent=String(s.textContent||'')+' Ajoutez ensuite l’export de votre caisse : l’analyse de votre carte arrive dans le même passage.'/* C300 (V15-127) : « la note Carte » était du jargon */;
}
function install(){
  if(!root.STORE||typeof root.point5CsvAnalyse!=='function'||!doc.getElementById('v-in'))return false;
  mount();doorNote();
  var sv=root.save;if(typeof sv==='function'&&!sv._a15){var w=function(){
      /* C193 — import des clôtures de caisse : les jours d'ouverture se lisent dans les journées, au même enregistrement. */
      var reason0=String(arguments[0]||''),js=null;if(reason0==='import-daily-pos'){try{js=majJoursSemaine();}catch(e){}}var rp=null;if(reason0==='import-daily-pos'){try{rp=majJoursRepos();}catch(e){}}
      var r=sv.apply(this,arguments);try{signalCaisse();}catch(_c){}try{var reason=reason0;/* C216 (W56) : après le FEC, l'étape 1 n'est plus affichée, même quand la carte vient d'être créée depuis la caisse. */if(/create-establishment|duplicate-establishment|load-demo|reset-establishment/.test(reason))oublierLecture();if(/fec-import|amort-fec|restore|create-establishment|load-demo|reset-establishment/.test(reason)){render();if(S.text&&!S.applied)preview();}if(/import-daily-pos|un-seul-passage|fec-import/.test(reason)){try{root.VerdictFEC&&root.VerdictFEC.majJours&&root.VerdictFEC.majJours();}catch(_f){}}setTimeout(majStruct,60);if(/import-daily-pos|fec-import|restore|create-establishment|load-demo|reset-establishment/.test(reason))jRender();if(js||(rp&&rp.apres))setTimeout(function(){var m=js&&rp&&rp.apres?js.apres+' jours d’ouverture par semaine, '+reposTexte(rp.apres)+', lus':js?js.apres+' jours d’ouverture par semaine, lus':reposTexte(rp.apres)+', lu';toast(m.charAt(0).toUpperCase()+m.slice(1)+' dans vos journées de caisse');},900);}catch(e){}return r;};w._a15=true;for(var k in sv)if(Object.prototype.hasOwnProperty.call(sv,k))w[k]=sv[k];root.save=w;}
  var sw=root.switchEtab;if(typeof sw==='function'&&!sw._a15){var w2=function(){var r=sw.apply(this,arguments);oublierLecture();setTimeout(function(){render();jRender();},200);return r;};w2._a15=true;for(var k2 in sw)if(Object.prototype.hasOwnProperty.call(sw,k2))w2[k2]=sw[k2];root.switchEtab=w2;}
  /* L'aperçu des clôtures dit aussi les jours d'ouverture qu'elles donnent, avant la validation. */
  var dp=root.dailyCsvPreview;if(typeof dp==='function'&&!dp._a15){var w3=function(){var r=dp.apply(this,arguments);try{var L=root.DAILY_CSV_LOT,e=doc.getElementById('daily-csv-result');if(L&&L.ok&&e){var mode=(doc.getElementById('daily-csv-conflict')||{}).value||'replace',x=jsemLigne(joursSemaine(L.newRows.concat(mode==='replace'?L.conflicts.map(function(c){return c.incoming;}):[])));if(x)e.insertAdjacentHTML('beforeend','<p class="note" style="margin:6px 0">'+x.replace('lus dans ces journées','lus dans ces journées de caisse')+'</p>');}}catch(err){}return r;};w3._a15=true;root.dailyCsvPreview=w3;}
  /* C195 — toucher « Fermé » (Mes services ou la lettre du jour dans le calendrier) est un choix du patron : la caisse ne l'écrase plus. */
  var bf=root.basculerFermeSem;if(typeof bf==='function'&&!bf._a15){var w4=function(){try{var d=DB();if(d)d.fermesSource={source:'patron',at:new Date().toISOString()};}catch(e){}return bf.apply(this,arguments);};w4._a15=true;root.basculerFermeSem=w4;}
  if(root.MutationObserver){var t=0;new root.MutationObserver(function(){if(t)return;t=setTimeout(function(){t=0;mount();doorNote();},150);}).observe(doc.body,{childList:true,subtree:true});}
  return true;
}
root.VerdictPassageUnique={journees:journees,planJournees:planJournees,appliquerJournees:appliquerJournees,joursSemaine:joursSemaine,majJoursSemaine:majJoursSemaine,etatRepos:etatRepos,prendreRepos:prendreRepos,garderRepos:garderRepos,majJoursRepos:majJoursRepos,reposTexte:reposTexte,renderJournees:jRender,mois:mois,moyenneOption:moyenneOption,analyse:analyse,infosArticles:infosArticles,periodLabel:periodLabel,tvaNum:tvaNum,createDish:createDish,readCsv:readCsv,volumes:volumes,unitPrice:unitPrice,guessCategory:guessCategory,similarDish:similarDish,draftRecipe:draftRecipe,render:render,preview:preview,apply:apply,state:S,setText:function(t,per){S.text=String(t||'');if(per){S.period=per;S.periodChosen=true;}preview();}};
/* C300 (V15-113) : l'aperçu d'import des journées de caisse annonçait « 1 conflit · un conflit reste visible avant validation »
   sans montrer ni la date, ni la saisie, ni la caisse. Chaque conflit est écrit sous l'aperçu (dix au plus). */
function conflitsCaisse(){var r=root.DAILY_CSV_LOT,e=doc.getElementById('daily-csv-result');if(!e||!r||!r.conflicts||!r.conflicts.length||e.querySelector('[data-a15-conflits]'))return;
  var sel=doc.getElementById('daily-csv-conflict'),garde=sel&&sel.value==='keep',L=r.conflicts.slice(0,10).map(function(c){var a=c.existing||{},b=c.incoming||{},src=/manual/i.test(String(a.source||''))||!a.source?'saisie à la main':'déjà importée';
    return '<li>'+esc(dateLabel(String(b.date).slice(0,10)))+' : '+src+' <b>'+money(a.caJ)+'</b>'+(a.tkJ!=null?' ('+int(a.tkJ)+' tickets)':'')+', caisse <b>'+money(b.caJ)+'</b>'+(b.tkJ!=null?' ('+int(b.tkJ)+' tickets)':'')+'</li>';}).join('');
  var d=doc.createElement('div');d.setAttribute('data-a15-conflits','1');d.className='note';d.style.margin='0 0 9px';
  d.innerHTML='<b>'+(r.conflicts.length>1?r.conflicts.length+' journées différentes':'1 journée différente')+' de ce que Verdict connaît déjà :</b><ul style="margin:4px 0 0 18px;padding:0">'+L+'</ul>'+(r.conflicts.length>10?'<p style="margin:4px 0 0">… et '+int(r.conflicts.length-10)+' autres.</p>':'')+'<p style="margin:4px 0 0">'+(garde?'Vous avez choisi de garder les journées déjà connues.':'La caisse fait foi : ces journées prendront le chiffre de la caisse (l’ancienne valeur reste dans l’historique des corrections).')+'</p>';
  e.appendChild(d);}
function wrapPreview(){var f=root.dailyCsvPreview;if(typeof f!=='function'||f.__c300)return;var g=function(){var r=f.apply(this,arguments);try{conflitsCaisse();}catch(x){}return r;};g.__c300=true;root.dailyCsvPreview=g;}
if(doc.addEventListener)doc.addEventListener('change',function(ev){if(ev.target&&ev.target.id==='daily-csv-conflict'){var o=doc.querySelector('#daily-csv-result [data-a15-conflits]');if(o)o.remove();try{conflitsCaisse();}catch(x){}}},true);
wrapPreview();setTimeout(wrapPreview,500);setTimeout(wrapPreview,2000);
function boot(n){if(install())return;if(n>0)setTimeout(function(){boot(n-1);},300);}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',function(){boot(60);});else boot(60);
})(window);
