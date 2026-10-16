/* C42 — « Un seul passage » : fichier comptable (FEC) + export de caisse, les deux notes d'un coup.
   Le client apporte ses propres données ; Vera aide seulement à compléter au départ (plats absents de la carte,
   recette de départ copiée d'un plat proche, prix lu dans la caisse) — jamais de stratégie, jamais de chiffre inventé.
   S'appuie sur l'import FEC existant (carte #v44-fec) et sur l'import de caisse existant (point5CsvAnalyse,
   point5CommitImport, verdictDishSalesImport). Tout reste dans la page : rien n'est envoyé. */
(function(root){
'use strict';
var doc=root.document;if(!doc||root.VerdictPassageUnique)return;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function num(v){var n=typeof v==='number'?v:parseFloat(String(v==null?'':v).replace(/\s/g,'').replace(',','.'));return isFinite(n)?n:null;}
function money(v){v=num(v);return v==null?'—':v.toLocaleString(tag(),{minimumFractionDigits:2,maximumFractionDigits:2})+' €';}
function int(v){v=num(v);return v==null?'—':Math.round(v).toLocaleString(tag());}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
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
  var sep=csvSep(lines[0]),head=csvRow(lines[0],sep),c=columns(head);
  if(c.nom<0||c.qte<0)return {ok:false,reason:'colonnes article et quantité introuvables (en-têtes lus : '+head.join(', ')+')',rows:[]};
  var rows=[];for(var i=1;i<lines.length;i++){var p=csvRow(lines[i],sep);var st=norm(c.status>=0?p[c.status]:'');if(/annul|cancel|void|supprim/.test(st))continue;rows.push({nom:String(p[c.nom]||'').trim(),qte:num(p[c.qte]),date:c.date>=0?isoDate(p[c.date]):'',cat:c.cat>=0?p[c.cat]:'',gross:c.gross>=0?num(p[c.gross]):null,ticket:c.ticket>=0?String(p[c.ticket]||'').trim():'',refund:/refund|rembours|retour/.test(st)});}
  return {ok:true,rows:rows,columns:c,hasDate:c.date>=0,hasTicket:c.ticket>=0,hasGross:c.gross>=0};
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

/* ───────── Vera complète : catégorie, plat proche, recette de départ ───────── */
var CATS=[[/petit.?dej|brunch|croissant|pain au choc|viennois/,'Petit-déjeuner'],[/supplement|extra|option|topping|sauce en plus/,'Suppléments'],[/biere|vin\b|rose\b|rouge\b|blanc\b|cocktail|spritz|mojito|champagne|pinte|demi|whisky|rhum|gin|vodka|aperol|pastis|kir/,'Boissons alcoolisées'],[/eau|soda|coca|jus|the\b|cafe|espresso|cappuccino|latte|chocolat chaud|limonade|perrier|sirop|smoothie|boisson/,'Boissons'],[/dessert|tiramisu|brulee|mousse|tarte|fondant|glace|sorbet|cafe gourmand|crumble|cheesecake|panna|cookie|brownie|gaufre|crepe sucree|pudding|riz au lait|compote|fromage blanc|muffin|banana bread|energy ball/,'Desserts'],[/fromage|camembert|chevre chaud|plateau/,'Fromages'],[/burger|pizza|bowl|tacos|wrap|sandwich|kebab|steak|entrecote|tartare|cote de|magret|poulet|poisson|saumon|dorade|pates|risotto|lasagne|curry|wok|ramen|pho|bo bun|couscous|tajine|blanquette|bourguignon|moules|omelette|croque|quiche|galette|hot dog|plat\b/,'Plats'],[/frites|accompagnement|garniture|riz nature|legumes|salade verte|pommes de terre/,'Accompagnements'],[/menu|formule|combo/,'Menus'],[/salade/,'Salades'],[/entree|soupe|veloute|tartare|carpaccio|oeuf|terrine|rillette|bruschetta|nems|samoussa|houmous|tapas|planche|a partager/,'Entrées'],[/plat du jour|suggestion/,'Plat du jour']];
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
  '#a15-passage .a15-sum{border-radius:14px;padding:11px 13px;background:rgba(212,167,44,.1);margin:10px 0;font-size:14px}#a15-passage .a15-ok{background:rgba(22,163,74,.1)}#a15-passage .a15-warn{background:rgba(249,115,22,.12)}#a15-passage .a15-vera{display:flex;gap:10px;align-items:center;margin:12px 0 6px}#a15-passage .a15-vera img{width:40px;height:40px;border-radius:50%;box-shadow:0 0 0 2px #d4a72c}#a15-passage .a15-vera b{font-size:15px}#a15-passage .a15-file{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}#a15-passage .a15-file select{padding:9px 10px;border-radius:10px;border:1px solid var(--line,#d6dde3);background:transparent;color:inherit;font:600 14px system-ui}#a15-passage label.a15-consent{display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:8px 0}#a15-passage .a15-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}';
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
function monthOptions(sel){var h='',p=today();for(var i=0;i<14;i++){var per=addMonth(p,-i);h+='<option value="'+per+'"'+(per===sel?' selected':'')+'>'+monthLabel(per)+'</option>';}return h;}
function render(){
  var c=card();if(!c)return;var d=DB(),f=fecDone(),st=structureState(),ct=carteState();
  var h='<h2 style="margin:0 0 4px">Un seul passage : fichier comptable + export de caisse</h2><p class="note" style="margin:0 0 6px">Vos deux notes d’un coup. Le fichier comptable (FEC) donne la <b>Structure</b> ; l’export « ventes par article » de votre caisse donne la <b>Carte</b>. Tout est lu ici, dans ce navigateur : rien n’est envoyé.</p>'+stepsHtml();
  if(!f){h+='<div class="a15-sum">Étape 1 : déposez votre fichier comptable dans la carte juste au-dessus. Vous pouvez aussi commencer par l’export de caisse ci-dessous : la note Carte n’attend pas la Structure.</div>';}
  else{var fi=d.fecImport;h+='<div class="a15-sum a15-ok">Fichier comptable lu : exercice '+esc(fi.period&&fi.period.year||'')+', chiffre d’affaires '+money(fi.totals.revenue)+'. Structure : '+(st.ready?'<b>score '+st.score+' / 100</b>':'<b>à compléter</b> — '+esc(st.missing.slice(0,4).join(', ')))+'</div>';}
  if(S.applied){var a=S.applied;h+='<div class="a15-sum a15-ok"><b>Export de caisse appliqué</b> · '+esc(monthLabel(a.period))+' : '+int(a.matched)+' plat'+(a.matched>1?'s':'')+' avec leurs ventes'+(a.created?' · '+int(a.created)+' plat'+(a.created>1?'s':'')+' créé'+(a.created>1?'s':'')+' par Vera, à vérifier':'')+(a.panier?' · panier moyen '+money(a.panier)+' et '+a.cmdj+' commandes par jour lus dans la caisse':'')+(a.dated?' · ventes datées conservées (écart matière théorique / réel)':'')+'.<br>Carte : '+int(ct.plats)+' plats, '+int(ct.withVol)+' avec ventes, '+int(ct.incomplete)+' recette'+(ct.incomplete>1?'s':'')+' à compléter.</div><div class="a15-actions"><button type="button" class="btn" data-a15="score">Voir mon score</button><button type="button" class="btn ghost" data-a15="carte">Compléter mes recettes</button><button type="button" class="btn ghost" data-a15="again">Un autre mois</button></div>';}
  else{
    h+='<label class="a15-consent"><input type="checkbox" id="a15-consent"><span>J’autorise l’analyse locale de cet export pour préremplir la carte de cet établissement. Le fichier n’est ni envoyé ni conservé.</span></label>'+
      '<div class="a15-file"><label class="btn" for="a15-file">Choisir l’export de caisse</label><input id="a15-file" type="file" accept=".csv,.txt,text/csv,text/plain" hidden><select id="a15-period" aria-label="Mois du fichier">'+monthOptions(S.period||addMonth(today(),-1))+'</select><span class="note" id="a15-fname">Colonnes minimales : article et quantité. Date, ticket et montant servent, s’ils existent, au panier moyen et aux commandes par jour.</span></div><div id="a15-preview"></div>';
  }
  c.innerHTML=h;bind(c);
}
function bind(c){
  var inp=c.querySelector('#a15-file'),consent=c.querySelector('#a15-consent'),per=c.querySelector('#a15-period');
  if(inp){inp.addEventListener('click',function(e){if(!consent.checked){e.preventDefault();toast('Cochez d’abord l’autorisation d’analyse locale');consent.focus();}});
    inp.addEventListener('change',function(){var f=inp.files&&inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){S.text=String(r.result||'');c.querySelector('#a15-fname').textContent=f.name;preview();};r.readAsText(f);});}
  if(per)per.addEventListener('change',function(){S.period=per.value;if(S.text)preview();});
  [].forEach.call(c.querySelectorAll('[data-a15]'),function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-a15');
    if(k==='score'){try{root.go('pil');}catch(e){}}
    else if(k==='carte'){try{root.go('carte');}catch(e){}}
    else if(k==='again'){S.applied=null;S.text='';S.lot=null;S.unknown=[];render();}
    else if(k==='apply')apply();
  });});
}
function preview(){
  var c=card(),out=c&&c.querySelector('#a15-preview');if(!out)return;
  var read=readCsv(S.text);S.read=read;
  if(!read.ok){out.innerHTML='<div class="a15-sum a15-warn">Fichier non lu : '+esc(read.reason)+'.</div>';return;}
  var vol=volumes(read);if(vol&&vol.period&&!S.periodChosen){S.period=vol.period;var sel=c.querySelector('#a15-period');if(sel)sel.value=vol.period;}
  var period=(c.querySelector('#a15-period')||{}).value||S.period;S.period=period;
  var lot=null;try{lot=root.point5CsvAnalyse(S.text,{period:period});}catch(e){lot={matched:[],unknown:[],invalid:[{reason:String(e.message)}],duplicate:false};}
  S.lot=lot;
  var unknownAgg={};lot.unknown.forEach(function(u){var k=norm(u.nom);if(!unknownAgg[k])unknownAgg[k]={nom:u.nom,qte:0,reason:u.reason};unknownAgg[k].qte+=num(u.qte)||0;});
  var d=DB(),plats=(d.plats||[]).filter(function(p){return !p.cpArchived;}),ing=d.ing||[],existing=cats();
  S.unknown=Object.keys(unknownAgg).map(function(k){var u=unknownAgg[k];var dr=draftRecipe(u.nom,plats,ing),price=unitPrice(read,u.nom);return {nom:u.nom,qte:u.qte,reason:u.reason,cat:guessCategory(u.nom,existing),price:price,draft:dr,keep:u.qte>0};});
  var h='<div class="a15-sum">'+int(read.rows.length)+' lignes lues · <b>'+int(lot.matched.length)+' plat'+(lot.matched.length>1?'s':'')+' de votre carte reconnu'+(lot.matched.length>1?'s':'')+'</b> · '+int(S.unknown.length)+' article'+(S.unknown.length>1?'s':'')+' absent'+(S.unknown.length>1?'s':'')+' de la carte'+(lot.invalid.length?' · '+int(lot.invalid.length)+' ligne'+(lot.invalid.length>1?'s':'')+' à corriger ('+esc(lot.invalid.slice(0,2).map(function(x){return x.reason;}).join(' ; '))+')':'')+(lot.outside?' · '+int(lot.outside)+' hors '+esc(monthLabel(period)):'')+(lot.duplicate?' · <b>fichier déjà importé</b>':'')+'.'+
    (vol&&(vol.panier||vol.cmdj)?'<br>Lu dans la caisse : '+(vol.tickets?int(vol.tickets)+' tickets':'')+(vol.panier?' · panier moyen '+money(vol.panier)+' TTC':'')+(vol.cmdj?' · '+vol.cmdj+' commandes par jour sur '+int(vol.days)+' jours':'')+'.':'')+'</div>';
  if(S.unknown.length){
    h+='<div class="a15-vera">'+(avatar()?'<img alt="" src="'+esc(avatar())+'">':'')+'<div><b>Vera complète</b><div class="note">Ces articles vendus n’ont pas de fiche. Vera propose une catégorie, le prix lu dans la caisse et une recette de départ copiée d’un plat proche — vous vérifiez, elle n’invente aucune quantité.</div></div></div>';
    S.unknown.forEach(function(u,i){var why=u.draft.kind==='copie'?'Recette de départ : copie de « '+u.draft.from+' » ('+u.draft.rec.length+' ingrédient'+(u.draft.rec.length>1?'s':'')+'), à vérifier dans la fiche.':u.draft.kind==='ingredients'?'Ingrédients possibles de votre catalogue : '+u.draft.rec.map(function(r){return r[0];}).join(', ')+' — quantités à saisir.':'Aucun plat proche : la fiche sera créée vide, recette à saisir.';
      h+='<div class="a15-row"><input type="checkbox" data-a15-keep="'+i+'"'+(u.keep?' checked':'')+'><span><b>'+esc(u.nom)+'</b><br><span class="note">'+esc(u.reason)+'</span></span><span class="a15-q">'+int(u.qte)+' vendus</span><select data-a15-cat="'+i+'">'+catOptions(u.cat)+'</select><input type="text" inputmode="decimal" placeholder="Prix TTC" data-a15-price="'+i+'" value="'+(u.price!=null?esc(String(u.price).replace('.',',')):'')+'"><div class="a15-why">'+esc(why)+'</div></div>';});
  }
  var can=lot.matched.length||S.unknown.some(function(u){return u.keep;});
  h+='<div class="a15-actions"><button type="button" class="btn" data-a15="apply"'+(can&&!lot.duplicate?'':' disabled')+'>'+(S.unknown.length?'Créer ces plats et appliquer les ventes':'Appliquer les ventes')+'</button></div>';
  out.innerHTML=h;
  [].forEach.call(out.querySelectorAll('[data-a15-keep]'),function(i){i.addEventListener('change',function(){S.unknown[+i.getAttribute('data-a15-keep')].keep=i.checked;});});
  [].forEach.call(out.querySelectorAll('[data-a15-cat]'),function(s){s.addEventListener('change',function(){S.unknown[+s.getAttribute('data-a15-cat')].cat=s.value;});});
  [].forEach.call(out.querySelectorAll('[data-a15-price]'),function(s){s.addEventListener('input',function(){S.unknown[+s.getAttribute('data-a15-price')].price=num(s.value);});});
  bind(c);
}
function catOptions(sel){var base=['Entrées','Salades','Plat du jour','Plats','Menus','Accompagnements','Fromages','Desserts','Boissons','Boissons alcoolisées','Suppléments'],all=cats();base.forEach(function(b){if(!all.some(function(x){return norm(x).replace(/s$/,'')===norm(b).replace(/s$/,'');}))all.push(b);});if(all.indexOf(sel)<0)all.unshift(sel);return all.map(function(x){return '<option'+(x===sel?' selected':'')+'>'+esc(x)+'</option>';}).join('');}
function toast(m){try{if(typeof root.toast==='function')root.toast(m);}catch(e){}}
function createDish(u){
  var d=DB(),id='qp-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  var p={id:id,nom:u.nom,cat:u.cat,esp:u.draft.esp||espFor(u.cat),ttc:u.price!=null?u.price:null,vol:null,rec:u.draft.rec||[],preps:u.draft.preps||[],tva:null,cpVeraDraft:true,cpSource:'caisse',cpDraftFrom:u.draft.kind==='copie'?u.draft.from:null,cpCreatedAt:new Date().toISOString()};
  d.plats.push(p);return p;
}
function apply(){
  if(!S.lot||!S.text)return;
  var go=function(){
    var created=0;S.unknown.forEach(function(u){if(u.keep){createDish(u);created++;}});
    var lot=root.point5CsvAnalyse(S.text,{period:S.period});
    if(lot.duplicate){toast('Ce fichier a déjà été importé : aucune vente doublée');return;}
    if(!lot.ok){toast('Fichier à corriger : '+((lot.invalid[0]||{}).reason||'aucun plat reconnu'));S.lot=lot;preview();return;}
    root.point5CommitImport(lot);
    var d=DB(),pi=d.posImports[d.posImports.length-1];if(pi)pi.source='un-seul-passage';
    var dated=false;if(S.read&&S.read.hasDate&&typeof root.verdictDishSalesImport==='function'){try{var r=root.verdictDishSalesImport(S.text);dated=!!(r&&r.ok);}catch(e){}}
    var vol=volumes(S.read),used=null;
    if(vol&&vol.panier&&vol.cmdj){var q=d.in||(d.in={});if(num(q.panier)==null)q.panier=vol.panier;if(num(q.cmdj)==null)q.cmdj=vol.cmdj;used=vol;d.caisseVolumes={period:S.period,panier:vol.panier,cmdj:vol.cmdj,tickets:vol.tickets,days:vol.days,source:'export-caisse',at:new Date().toISOString()};}
    S.applied={period:S.period,matched:lot.matched.length,created:created,panier:used&&used.panier,cmdj:used&&used.cmdj,dated:dated};
    try{root.save('un-seul-passage');}catch(e){}
    try{root.fillInputs();}catch(e){}try{root.readInputs();}catch(e){}try{root.refreshAll();}catch(e){}
    try{if(root.VerdictSaveGuard&&root.VerdictSaveGuard.rebase)root.VerdictSaveGuard.rebase();}catch(e){}
    S.unknown=[];render();toast('Ventes de la caisse appliquées'+(created?' · '+created+' plat'+(created>1?'s':'')+' à vérifier':''));
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
root.VerdictPassageUnique={readCsv:readCsv,volumes:volumes,unitPrice:unitPrice,guessCategory:guessCategory,similarDish:similarDish,draftRecipe:draftRecipe,render:render,preview:preview,apply:apply,state:S,setText:function(t,per){S.text=String(t||'');if(per){S.period=per;S.periodChosen=true;}preview();}};
function boot(n){if(install())return;if(n>0)setTimeout(function(){boot(n-1);},300);}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',function(){boot(60);});else boot(60);
})(window);
