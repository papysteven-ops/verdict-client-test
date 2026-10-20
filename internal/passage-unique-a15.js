/* C42 — « Un seul passage » : fichier comptable (FEC) + export de caisse, les deux notes d'un coup.
   Le client apporte ses propres données ; Vera aide seulement à compléter au départ (plats absents de la carte,
   recette de départ copiée d'un plat proche, prix lu dans la caisse) — jamais de stratégie, jamais de chiffre inventé.
   S'appuie sur l'import FEC existant (carte #v44-fec) et sur l'import de caisse existant (point5CsvAnalyse,
   point5CommitImport, verdictDishSalesImport). Tout reste dans la page : rien n'est envoyé.
   C192 — La carte vient de la caisse, sans saisie : prix, TVA, famille et ventes lus dans l'export ; moyenne des mois
   complets ; recette reprise d'un plat proche ou d'une fiche type (internal/fiches-types-a59.js) ; une seule question pour
   ce qui n'a pas de recette fixe (coût d'une portion) ; périmètre « toute la carte, mois complets » établi par la caisse. */
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
  return {ok:true,rows:rows,columns:c,hasDate:c.date>=0,hasTicket:c.ticket>=0,hasGross:c.gross>=0,hasTva:tv>=0};
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
  U.forEach(function(u){if(!u.keep||!u.fiche||u.draft.kind==='copie')return;u.fiche.rec.forEach(function(l){var k=norm(l[0]);if(!have[k]&&FT&&FT.produit(l[0])){have[k]=1;out.push(l[0]);}});});return out;}
/* Ventes de la caisse face au document comptable de la même année (même chiffre attendu, HT). */
function coherence(read,per){
  var d=DB(),fi=d&&d.fecImport,a=bornes(per);if(!fi||!fi.totals||!(fi.totals.revenue>0)||!/^moy:/.test(String(per||'')))return '';
  var annee=String(fi.period&&fi.period.year||'');if(nMois(a[0],a[1])!==12||a[0]!==annee+'-01'||a[1]!==annee+'-12')return '';
  var tv={};S.unknown.forEach(function(u){tv[norm(u.nom)]=u.tva;});(d.plats||[]).forEach(function(p){var t=num(p.tva);if(t!=null)tv[norm(p.nom)]=t;});
  var ht=0;(read.rows||[]).forEach(function(r){var m=r.date?r.date.slice(0,7):'';if(!m||m<a[0]||m>a[1]||r.gross==null)return;var t=r.tva!=null?r.tva:tv[norm(r.nom)]!=null?tv[norm(r.nom)]:tvaDefaut();ht+=(r.refund?-Math.abs(r.gross):r.gross)/(1+t/100);});
  var gap=ht-fi.totals.revenue,rel=Math.abs(gap)/fi.totals.revenue;
  return 'Ventes de la caisse sur '+esc(annee)+' : <b>'+eur0((ht))+' HT</b> · votre document comptable : '+eur0((fi.totals.revenue))+' HT — '+(rel<0.005?'<b>identique</b>.':rel<0.03?'proche (écart de '+eur0((Math.abs(gap)))+').':'<b>écart de '+eur0((Math.abs(gap)))+'</b> : la caisse ne contient peut-être pas toutes les ventes (livraison, traiteur, autre caisse).');
}

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
function fecDone(){var d=DB();return !!(d&&d.fecImport&&d.fecImport.totals);}
function caisseDone(){var d=DB();return !!(d&&(d.posImports||[]).some(function(x){return x&&x.source==='un-seul-passage';}));}
function structureState(){var R=null,m=[];try{R=root.moteur();}catch(e){}try{m=root.donneesManquantes();}catch(e){}return {ready:!!(R&&R.ready),score:R&&R.ready?Math.round(R.score):null,missing:m.map(function(c){return c.lb||c.k;})};}
function carteState(){var d=DB(),plats=(d&&d.plats||[]).filter(function(p){return !p.cpArchived;}),withVol=0,incomplete=0;plats.forEach(function(p){if(num(p.vol)!=null)withVol++;var k={};try{k=root.platCalc(p)||{};}catch(e){}if(!k.recetteComplete&&k.complete!==true)incomplete++;});return {plats:plats.length,withVol:withVol,incomplete:incomplete};}

function css(){
  if(doc.getElementById('a15-css'))return;var st=doc.createElement('style');st.id='a15-css';
  st.textContent='#a15-passage{margin-top:14px}#a15-passage .a15-steps{display:flex;gap:6px;margin:10px 0 12px;flex-wrap:wrap}#a15-passage .a15-step{flex:1;min-width:120px;display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;border:1.5px solid var(--line,#d6dde3);font-weight:700;font-size:13px}#a15-passage .a15-step b{width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;background:rgba(127,127,127,.15)}#a15-passage .a15-step.ok{border-color:#16a34a;background:rgba(22,163,74,.08)}#a15-passage .a15-step.ok b{background:#16a34a;color:#fff}#a15-passage .a15-step.now{border-color:#d4a72c;background:rgba(212,167,44,.1)}#a15-passage .a15-step.now b{background:#d4a72c;color:#1a1200}'+
  '#a15-passage .a15-row{display:grid;grid-template-columns:auto minmax(0,1.4fr) 70px minmax(120px,1fr) 90px;gap:8px;align-items:center;padding:9px 0;border-top:1px solid var(--line,#e5e9ee);font-size:14px}@media(max-width:640px){#a15-passage .a15-row{grid-template-columns:28px 1fr 1fr}#a15-passage .a15-row>span:nth-child(2),#a15-passage .a15-row .a15-q{grid-column:2/4}#a15-passage .a15-row select{grid-column:2/3}#a15-passage .a15-row input[type=text]{grid-column:3/4}#a15-passage .a15-why{margin-left:0;grid-column:2/4}}#a15-passage .a15-row input[type=checkbox]{width:18px;height:18px}#a15-passage .a15-row select,#a15-passage .a15-row input[type=text]{padding:7px 8px;border-radius:9px;border:1px solid var(--line,#d6dde3);background:transparent;color:inherit;font:600 13.5px system-ui;min-width:0;width:100%}#a15-passage .a15-why{grid-column:1/-1;font-size:12.5px;opacity:.75;margin:-4px 0 0 26px}'+
  '#a15-passage .a15-sum{border-radius:14px;padding:11px 13px;background:rgba(212,167,44,.1);margin:10px 0;font-size:14px}#a15-passage .a15-ok{background:rgba(22,163,74,.1)}#a15-passage .a15-warn{background:rgba(249,115,22,.12)}#a15-passage .a15-vera{display:flex;gap:10px;align-items:center;margin:12px 0 6px}#a15-passage .a15-vera img{width:40px;height:40px;border-radius:50%;box-shadow:0 0 0 2px #d4a72c}#a15-passage .a15-vera b{font-size:15px}#a15-passage .a15-file{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}#a15-passage .a15-file select{padding:9px 10px;border-radius:10px;border:1px solid var(--line,#d6dde3);background:transparent;color:inherit;font:600 14px system-ui}#a15-passage label.a15-consent{display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:8px 0}#a15-passage .a15-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}#a15-passage .a15-list{margin:6px 0 10px;padding-left:20px;font-size:14px}#a15-passage .a15-list li{margin:4px 0}#a15-passage .a15-ask{border:1.5px solid #d4a72c;border-radius:14px;padding:11px 13px;margin:10px 0;background:rgba(212,167,44,.08)}#a15-passage .a15-q1{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;justify-content:space-between;margin:8px 0;font-size:14px}#a15-passage .a15-q1in{display:flex;gap:8px;align-items:center;font-size:13px}#a15-passage .a15-q1 input{width:96px;padding:7px 8px;border-radius:9px;border:1px solid var(--line,#d6dde3);background:transparent;color:inherit;font:600 14px system-ui}#a15-passage details.a15-det{margin:8px 0}#a15-passage details.a15-det>summary{cursor:pointer;font-weight:750;font-size:14px;padding:6px 0}';
  (doc.head||doc.documentElement).appendChild(st);
}
function avatar(){var i=doc.querySelector('img.v-help-avatar');return i&&i.src?i.src:'';}
function card(){return doc.getElementById('a15-passage');}
function mount(){
  var fec=doc.getElementById('v44-fec'),host=doc.getElementById('v-in'),c0=card();
  /* La carte FEC peut arriver après : on se place toujours juste sous elle. */
  if(c0){if(fec&&fec.parentNode&&fec.nextElementSibling!==c0)fec.parentNode.insertBefore(c0,fec.nextSibling);return true;}
  if(!host)return false;
  css();var c=doc.createElement('section');c.id='a15-passage';c.className='card';c.setAttribute('data-guard-ignore','1');
  if(fec&&fec.parentNode)fec.parentNode.insertBefore(c,fec.nextSibling);else host.appendChild(c);
  render();return true;
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
  if(!f){h+='<div class="a15-sum">Étape 1 : déposez votre fichier comptable dans la carte juste au-dessus. Vous pouvez aussi commencer par l’export de caisse ci-dessous : la note Carte n’attend pas la Structure.</div>';}
  else{var fi=d.fecImport;h+='<div class="a15-sum a15-ok">Fichier comptable lu : exercice '+esc(fi.period&&fi.period.year||'')+', chiffre d’affaires '+money(fi.totals.revenue)+'. Structure : '+(st.ready?'<b>score '+st.score+' / 100</b>':'<b>à compléter</b> — '+esc(st.missing.slice(0,4).join(', ')))+'</div>';}
  if(S.applied){var a=S.applied;h+='<div class="a15-sum a15-ok"><b>Carte créée depuis votre caisse</b> · '+esc(periodLabel(a.period))+' : '+int(a.matched)+' plat'+(a.matched>1?'s':'')+' avec leurs ventes'+(a.created?' · '+int(a.created)+' fiche'+(a.created>1?'s':'')+' créée'+(a.created>1?'s':'')+' par Vera'+(a.vide?', sans recette':', à vérifier'):'')+(a.ajouts&&a.ajouts.length?' · '+int(a.ajouts.length)+' produit'+(a.ajouts.length>1?'s':'')+' ajouté'+(a.ajouts.length>1?'s':'')+' au catalogue avec un prix type':'')+(a.panier?' · panier moyen '+money(a.panier)+' et '+a.cmdj+' commandes par jour lus dans la caisse':'')+(a.dated?' · ventes datées conservées (écart matière théorique / réel)':'')+'.'+(a.complet&&!(a.manquent||[]).length?'<br>Toute la carte vendue est couverte, recettes comprises : l’Indice Carte se calcule.':'')+((a.manquent||[]).length?'<br><b>Reste à compléter :</b> '+esc(a.manquent.slice(0,5).join(', '))+(a.manquent.length>5?'…':'')+'. L’Indice Carte attend '+(a.manquent.length>1?'ces recettes':'cette recette')+'.':'')+'<br>Carte : '+int(ct.plats)+' plats, '+int(ct.withVol)+' avec ventes, '+int(ct.incomplete)+' recette'+(ct.incomplete>1?'s':'')+' à compléter.</div><div class="a15-actions"><button type="button" class="btn" data-a15="score">Voir mon score</button><button type="button" class="btn ghost" data-a15="carte">Compléter mes recettes</button><button type="button" class="btn ghost" data-a15="again">Un autre mois</button></div>';}
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
  S.unknown=Object.keys(unknownAgg).map(function(k){var u=unknownAgg[k],x=info[k]||{};
    var dr=draftRecipe(u.nom,plats,ing),ft=dr.kind==='copie'||!FT?null:FT.trouver(u.nom);
    var fam=x.famille&&FT?FT.famille(x.famille):null,cat=fam?pick(fam,existing):ft?pick(ft.cat,existing):guessCategory(u.nom,existing);
    var tva=x.tvaLue!=null?x.tvaLue:ft&&ft.tva!=null?ft.tva:(/alcool/.test(norm(cat))?20:null);
    return {nom:u.nom,qte:u.qte,reason:u.reason,cat:cat,price:x.price!=null?x.price:unitPrice(read,u.nom),tva:tva,tvaLue:x.tvaLue!=null,draft:dr,fiche:ft,variable:!!(FT&&!ft&&dr.kind!=='copie'&&FT.variable(u.nom)),portion:null,keep:u.qte>0};});
  S.unknown.sort(function(a,b){return b.qte-a.qte;});
  var U=S.unknown,prets=U.filter(function(u){return u.draft.kind==='copie'||u.fiche;}),manque=U.filter(function(u){return !(u.draft.kind==='copie'||u.fiche);});
  var nouveaux=produitsAjoutes(U),per=periodLabel(period),mo=lot.moyenne;
  var h='<div class="a15-sum">'+int(read.rows.length)+' lignes lues · <b>'+int(U.length+lot.matched.length)+' articles vendus</b>'+(mo?' · '+esc(per):' · '+esc(per))+(lot.matched.length?' · '+int(lot.matched.length)+' déjà sur votre carte':'')+(lot.invalid.length?' · '+int(lot.invalid.length)+' ligne'+(lot.invalid.length>1?'s':'')+' à corriger ('+esc(lot.invalid.slice(0,2).map(function(x){return x.reason;}).join(' ; '))+')':'')+(lot.duplicate?' · <b>fichier déjà importé</b>':'')+'.'+
    (vol&&(vol.panier||vol.cmdj)?'<br>Lu dans la caisse : '+(vol.tickets?int(vol.tickets)+' tickets':'')+(vol.panier?' · panier moyen '+money(vol.panier)+' TTC':'')+(vol.cmdj?' · '+vol.cmdj+' commandes par jour sur '+int(vol.days)+' jours':'')+'.':'')+'</div>';
  if(U.length){
    var coh=coherence(read,period);
    h+='<div class="a15-vera">'+(avatar()?'<img alt="" src="'+esc(avatar())+'">':'')+'<div><b>Vera a préparé votre carte</b><div class="note">Tout vient de votre caisse : nom, prix, TVA, catégorie et ventes. Pour les recettes, Vera reprend un plat proche de votre carte ou les quantités habituelles d’une brasserie. Vous les vérifiez quand vous voulez : vos factures et votre document comptable les contrôlent.</div></div></div><ul class="a15-list">'+
      (prets.length?'<li><b>'+int(prets.length)+' fiche'+(prets.length>1?'s':'')+' prête'+(prets.length>1?'s':'')+'</b> : prix et TVA lus dans la caisse, recette '+(prets.some(function(u){return u.fiche;})?'type':'copiée d’un plat proche')+' à vérifier.</li>':'')+
      (nouveaux.length?'<li><b>'+int(nouveaux.length)+' produit'+(nouveaux.length>1?'s':'')+' ajouté'+(nouveaux.length>1?'s':'')+' à votre catalogue</b> avec un prix type ('+esc(nouveaux.slice(0,4).join(', '))+(nouveaux.length>4?'…':'')+') : vos factures le remplaceront.</li>':'')+
      (coh?'<li>'+coh+'</li>':'')+'</ul>';
    if(manque.length){
      h+='<div class="a15-ask"><b>'+(manque.length>1?int(manque.length)+' informations manquent':'Une seule information manque')+'</b><div class="note">'+(manque.every(function(u){return u.variable;})?'Ce qui change chaque jour n’a pas de recette fixe : Verdict ne la devine pas.':'Pas de recette type pour '+(manque.length>1?'ces articles':'cet article')+' : Verdict ne la devine pas.')+' Un seul chiffre suffit.</div>';
      manque.forEach(function(u){var i=U.indexOf(u);h+='<label class="a15-q1"><span><b>'+esc(u.nom)+'</b> · '+fmtVol(u.qte,mo)+'</span><span class="a15-q1in">Marchandise d’une '+(u.variable?'assiette':'portion')+', en moyenne (€ HT) <input type="text" inputmode="decimal" data-a15-portion="'+i+'" placeholder="ex. 4,20"></span></label>';});
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
  bind(c);
}
function catOptions(sel){var base=['Entrées','Salades','Plat du jour','Plats','Menus','Accompagnements','Fromages','Desserts','Boissons','Boissons alcoolisées','Suppléments'],all=cats();base.forEach(function(b){if(!all.some(function(x){return norm(x).replace(/s$/,'')===norm(b).replace(/s$/,'');}))all.push(b);});if(all.indexOf(sel)<0)all.unshift(sel);return all.map(function(x){return '<option'+(x===sel?' selected':'')+'>'+esc(x)+'</option>';}).join('');}
function toast(m){try{if(typeof root.toast==='function')root.toast(m);}catch(e){}}
/* C192 — produits de la fiche type : on reprend ceux du catalogue (même nom), sinon on les ajoute avec un prix type signalé. */
function nomProduit(nom){var d=DB(),k=norm(nom);for(var i=0;i<(d.ing||[]).length;i++){var g=d.ing[i];if(g&&norm(g.nom)===k)return g.nom;}
  var FT=root.VerdictFichesTypes,t=FT&&FT.produit(nom);if(!t)return nom;
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
    var created=0,manquent=[];S.ajouts=[];S.unknown.forEach(function(u){if(u.keep){var p=createDish(u,vide);created++;if(!(p.rec&&p.rec.length&&p.rec.every(function(l){return l[1]!==''&&l[1]!=null;})))manquent.push(p.nom);}});
    var lot=analyse(S.text,S.period);
    if(lot.duplicate){toast('Ce fichier a déjà été importé : aucune vente doublée');return;}
    if(!lot.ok){toast('Fichier à corriger : '+((lot.invalid[0]||{}).reason||'aucun plat reconnu'));S.lot=lot;preview();return;}
    root.point5CommitImport(lot);
    var d=DB(),pi=d.posImports[d.posImports.length-1];if(pi){pi.source='un-seul-passage';if(lot.moyenne)pi.moyenne=lot.moyenne;}
    /* Toute la carte vendue sur des mois complets : le périmètre est établi par la caisse, sans case à cocher. */
    var complet=periodeComplete(S.read,S.period)&&!lot.unknown.length;
    if(d.carteRef){d.carteRef.fullMonth=complet;d.carteRef.origine='export-caisse';if(lot.moyenne)d.carteRef.moyenne=lot.moyenne;else delete d.carteRef.moyenne;}
    var dated=false;if(S.read&&S.read.hasDate&&typeof root.verdictDishSalesImport==='function'){try{var r=root.verdictDishSalesImport(S.text);dated=!!(r&&r.ok);}catch(e){}}
    var vol=volumes(S.read),used=null;
    if(vol&&vol.panier&&vol.cmdj){var q=d.in||(d.in={});if(num(q.panier)==null)q.panier=vol.panier;if(num(q.cmdj)==null)q.cmdj=vol.cmdj;used=vol;d.caisseVolumes={period:S.period,panier:vol.panier,cmdj:vol.cmdj,tickets:vol.tickets,days:vol.days,source:'export-caisse',at:new Date().toISOString()};}
    S.applied={period:S.period,matched:lot.matched.length,created:created,ajouts:S.ajouts.slice(),manquent:manquent,complet:complet,vide:!!vide,panier:used&&used.panier,cmdj:used&&used.cmdj,dated:dated};
    try{root.save('un-seul-passage');}catch(e){}
    try{root.fillInputs();}catch(e){}try{root.readInputs();}catch(e){}try{root.refreshAll();}catch(e){}
    try{if(root.VerdictSaveGuard&&root.VerdictSaveGuard.rebase)root.VerdictSaveGuard.rebase();}catch(e){}
    S.unknown=[];render();toast('Carte créée depuis la caisse'+(created?' · '+created+' plat'+(created>1?'s':''):''));
  };
  if(typeof root.verdictBeforeRisk==='function'){root.verdictBeforeRisk('import-pos-items').then(function(ok){if(ok)go();});}else go();
}
/* Porte d'entrée : la carte « J’ai mon fichier comptable » annonce le passage unique. */
function doorNote(){
  var b=doc.querySelector('.ch-fec');if(!b||b.getAttribute('data-a15'))return;b.setAttribute('data-a15','1');
  var s=b.querySelector('span');if(s)s.textContent=String(s.textContent||'')+' Ajoutez ensuite l’export de votre caisse : la note Carte arrive dans le même passage.';
}
function install(){
  if(!root.STORE||typeof root.point5CsvAnalyse!=='function'||!doc.getElementById('v-in'))return false;
  mount();doorNote();
  var sv=root.save;if(typeof sv==='function'&&!sv._a15){var w=function(){var r=sv.apply(this,arguments);try{var reason=String(arguments[0]||'');if(/fec-import|amort-fec|restore|create-establishment|load-demo|reset-establishment/.test(reason)&&!S.applied)render();}catch(e){}return r;};w._a15=true;for(var k in sv)if(Object.prototype.hasOwnProperty.call(sv,k))w[k]=sv[k];root.save=w;}
  var sw=root.switchEtab;if(typeof sw==='function'&&!sw._a15){var w2=function(){var r=sw.apply(this,arguments);S.applied=null;S.text='';S.lot=null;S.unknown=[];setTimeout(render,200);return r;};w2._a15=true;for(var k2 in sw)if(Object.prototype.hasOwnProperty.call(sw,k2))w2[k2]=sw[k2];root.switchEtab=w2;}
  if(root.MutationObserver){var t=0;new root.MutationObserver(function(){if(t)return;t=setTimeout(function(){t=0;mount();doorNote();},150);}).observe(doc.body,{childList:true,subtree:true});}
  return true;
}
root.VerdictPassageUnique={mois:mois,moyenneOption:moyenneOption,analyse:analyse,infosArticles:infosArticles,periodLabel:periodLabel,tvaNum:tvaNum,createDish:createDish,readCsv:readCsv,volumes:volumes,unitPrice:unitPrice,guessCategory:guessCategory,similarDish:similarDish,draftRecipe:draftRecipe,render:render,preview:preview,apply:apply,state:S,setText:function(t,per){S.text=String(t||'');if(per){S.period=per;S.periodChosen=true;}preview();}};
function boot(n){if(install())return;if(n>0)setTimeout(function(){boot(n-1);},300);}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',function(){boot(60);});else boot(60);
})(window);
