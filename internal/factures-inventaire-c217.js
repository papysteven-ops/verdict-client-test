/* C217 (L6) — factures-inventaire-c217.js · Inventaire : factures, prix des produits, reprise de la Carte, commande depuis les ventes.
   Partie 1 : copie fidèle du moteur pur de lecture des factures de Verdict (verdict-029, invoiceImportEngine v1.1), installée seulement
   si la page ne l'a pas déjà (l'Inventaire gratuit n'a pas Pilotage). Partie 2 : le branchement dans l'Inventaire. */
/* =====================================================================
   VERDICT® · Moteur factures fournisseurs — extraction → contrôle → rapprochement → décision (point 13)
   invoiceImportEngine:v1.1 · 27 septembre 2026 (aligné sur le cahier point 13) · pur et déterministe, n'écrit rien.
   Formats lus : UBL 2.1 (Invoice / CreditNote) et UN/CEFACT CII (XML Factur-X / ZUGFeRD).
   Non couverts ici : OCR d'un PDF scanné, extraction du XML embarqué dans un PDF Factur-X (à fournir en .xml).
   Doctrine : ce qui est lu n'est pas encore validé ; un rapprochement probable n'est pas un rapprochement ;
   aucune ligne n'entre dans les achats sans validation humaine ; absence ≠ zéro ; aucune conversion inventée.
   ===================================================================== */
(function(root,factory){if(root&&root.VerdictFacturesXML)return;var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.VerdictFacturesXML=api; /* nom distinct : VerdictFactures existe déjà dans Verdict */})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  var VERSION='invoiceImportEngine:v1.1',TOL=0.02;
  var CONSIGNE=/consign|deposit|pfand|cauzione|statiegeld|vasilhame|dep[oó]sito/i;
  /* --- mini-lecteur XML (sans dépendance, identique navigateur / Node) --- */
  function lireXML(txt){
    var s=String(txt||'').replace(/<\?[\s\S]*?\?>/g,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<!DOCTYPE[\s\S]*?>/gi,''),i=0,rootN={nom:'#root',enfants:[],attrs:{},texte:''},pile=[rootN];
    var re=/<(\/?)([A-Za-z_][\w.\-:]*)((?:\s+[\w.\-:]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|<!\[CDATA\[([\s\S]*?)\]\]>/g,m,last=0;
    function ent(t){return t.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,function(_,d){return String.fromCharCode(+d);}).replace(/&amp;/g,'&');}
    while((m=re.exec(s))){var txt2=s.slice(last,m.index);if(txt2.trim())pile[pile.length-1].texte+=ent(txt2.trim());last=re.lastIndex;
      if(m[5]!==undefined){pile[pile.length-1].texte+=m[5];continue;}
      var nom=m[2].replace(/^.*:/,'');
      if(m[1]){if(pile.length>1)pile.pop();continue;}
      var attrs={};(m[3]||'').replace(/([\w.\-:]+)\s*=\s*("([^"]*)"|'([^']*)')/g,function(_,k,__,a,b){attrs[k.replace(/^.*:/,'')]=ent(a!==undefined?a:b);});
      var n={nom:nom,attrs:attrs,enfants:[],texte:''};pile[pile.length-1].enfants.push(n);if(!m[4])pile.push(n);}
    return rootN.enfants[0]||null;
  }
  function kids(n,nom){return n?n.enfants.filter(function(e){return e.nom===nom;}):[];}
  function path(n,chemin){var cur=[n];String(chemin).split('/').forEach(function(p){var nx=[];cur.forEach(function(c){nx=nx.concat(kids(c,p));});cur=nx;});return cur;}
  function one(n,chemin){var r=path(n,chemin);return r.length?r[0]:null;}
  function txt(n,chemin){var e=chemin?one(n,chemin):n;return e?String(e.texte).trim():null;}
  function nb(n,chemin){var t=txt(n,chemin);if(t==null||t==='')return null;var v=Number(t);return isFinite(v)?v:NaN;}
  /* --- unités UN/ECE Recommandation 20 → unités Verdict --- */
  var UNITES={KGM:'kg',GRM:'g',LTR:'L',CLT:'cl',MLT:'ml',C62:'piece',H87:'piece',EA:'piece',XPP:'piece',XBO:'bouteille',XBX:null,XCT:null,XPK:null,XBG:null,XCS:null};
  function unite(code){if(code==null)return {unite:null,code:null,connue:false};var c=String(code).toUpperCase();if(Object.prototype.hasOwnProperty.call(UNITES,c))return {unite:UNITES[c],code:c,connue:UNITES[c]!=null,commerciale:UNITES[c]==null};return {unite:null,code:c,connue:false};}
  function jour(t,format){if(!t)return null;t=String(t).trim();if(/^\d{8}$/.test(t))return t.slice(0,4)+'-'+t.slice(4,6)+'-'+t.slice(6,8);if(/^\d{4}-\d{2}-\d{2}/.test(t))return t.slice(0,10);return null;}
  /* --- UBL --- */
  function depuisUBL(r){
    var avoir=r.nom==='CreditNote'||txt(r,'InvoiceTypeCode')==='381',L=kids(r,avoir&&kids(r,'CreditNoteLine').length?'CreditNoteLine':'InvoiceLine');
    var sup=one(r,'AccountingSupplierParty/Party'),nomF=sup&&(txt(sup,'PartyName/Name')||txt(sup,'PartyLegalEntity/RegistrationName'));
    var tot=one(r,'LegalMonetaryTotal')||{enfants:[]},tax=path(r,'TaxTotal/TaxAmount')[0];
    return {format:'UBL',numero:txt(r,'ID'),date:jour(txt(r,'IssueDate')),type:avoir?'avoir':'facture',devise:txt(r,'DocumentCurrencyCode'),fournisseur:nomF||null,fournisseurId:sup?(txt(sup,'PartyTaxScheme/CompanyID')||txt(sup,'PartyLegalEntity/CompanyID')||txt(sup,'PartyIdentification/ID')):null,
      dateEco:jour(txt(r,'Delivery/ActualDeliveryDate')),acheteur:txt(r,'AccountingCustomerParty/Party/PartyName/Name')||txt(r,'AccountingCustomerParty/Party/PartyLegalEntity/RegistrationName'),
      ajustements:kids(r,'AllowanceCharge').map(function(a){return {charge:txt(a,'ChargeIndicator')==='true',montant:nb(a,'Amount'),raison:txt(a,'AllowanceChargeReason')};}),
      tvaParTaux:path(r,'TaxTotal/TaxSubtotal').map(function(t){return {base:nb(t,'TaxableAmount'),montant:nb(t,'TaxAmount'),taux:nb(t,'TaxCategory/Percent')};}),
      totaux:{lignes:nb(tot,'LineExtensionAmount'),ht:nb(tot,'TaxExclusiveAmount'),tva:tax?nb(tax):null,ttc:nb(tot,'TaxInclusiveAmount'),aPayer:nb(tot,'PayableAmount'),remises:nb(tot,'AllowanceTotalAmount'),frais:nb(tot,'ChargeTotalAmount')},
      lignes:L.map(function(l){var q=one(l,avoir?'CreditedQuantity':'InvoicedQuantity')||one(l,'InvoicedQuantity');var u=unite(q&&q.attrs.unitCode);
        return {id:txt(l,'ID'),libelle:txt(l,'Item/Name'),ref:txt(l,'Item/SellersItemIdentification/ID'),gtin:txt(l,'Item/StandardItemIdentification/ID')||null,quantite:q?Number(String(q.texte).trim()):null,unite:u.unite,uniteCode:u.code,uniteCommerciale:!!u.commerciale,
          prix:nb(l,'Price/PriceAmount'),baseQuantite:nb(l,'Price/BaseQuantity'),montant:nb(l,'LineExtensionAmount'),tva:nb(l,'Item/ClassifiedTaxCategory/Percent')};})};
  }
  /* --- CII (Factur-X / ZUGFeRD) --- */
  function depuisCII(r){
    var doc=one(r,'ExchangedDocument'),tr=one(r,'SupplyChainTradeTransaction'),ag=one(tr,'ApplicableHeaderTradeAgreement'),st=one(tr,'ApplicableHeaderTradeSettlement'),sm=one(st,'SpecifiedTradeSettlementHeaderMonetarySummation');
    var tc=txt(doc,'TypeCode'),dt=one(doc,'IssueDateTime/DateTimeString'),seller=one(ag,'SellerTradeParty');
    return {format:'CII',numero:txt(doc,'ID'),date:jour(dt&&dt.texte,dt&&dt.attrs.format),type:tc==='381'?'avoir':'facture',devise:txt(st,'InvoiceCurrencyCode'),fournisseur:seller?txt(seller,'Name'):null,fournisseurId:seller?(txt(seller,'SpecifiedTaxRegistration/ID')||txt(seller,'ID')):null,
      dateEco:(function(){var e=one(tr,'ApplicableHeaderTradeDelivery/ActualDeliverySupplyChainEvent/OccurrenceDateTime/DateTimeString');return e?jour(e.texte):null;})(),acheteur:txt(ag,'BuyerTradeParty/Name'),
      ajustements:kids(st,'SpecifiedTradeAllowanceCharge').map(function(a){return {charge:txt(a,'ChargeIndicator/Indicator')==='true',montant:nb(a,'ActualAmount'),raison:txt(a,'Reason')};}),
      tvaParTaux:kids(st,'ApplicableTradeTax').map(function(t){return {base:nb(t,'BasisAmount'),montant:nb(t,'CalculatedAmount'),taux:nb(t,'RateApplicablePercent')};}),
      totaux:{lignes:nb(sm,'LineTotalAmount'),ht:nb(sm,'TaxBasisTotalAmount'),tva:nb(sm,'TaxTotalAmount'),ttc:nb(sm,'GrandTotalAmount'),aPayer:nb(sm,'DuePayableAmount'),remises:nb(sm,'AllowanceTotalAmount'),frais:nb(sm,'ChargeTotalAmount')},
      lignes:kids(tr,'IncludedSupplyChainTradeLineItem').map(function(l){var q=one(l,'SpecifiedLineTradeDelivery/BilledQuantity'),u=unite(q&&q.attrs.unitCode),pr=one(l,'SpecifiedLineTradeAgreement/NetPriceProductTradePrice');
        return {id:txt(l,'AssociatedDocumentLineDocument/LineID'),libelle:txt(l,'SpecifiedTradeProduct/Name'),ref:txt(l,'SpecifiedTradeProduct/SellerAssignedID'),gtin:txt(l,'SpecifiedTradeProduct/GlobalID')||null,quantite:q?Number(String(q.texte).trim()):null,unite:u.unite,uniteCode:u.code,uniteCommerciale:!!u.commerciale,
          prix:pr?nb(pr,'ChargeAmount'):null,baseQuantite:pr?nb(pr,'BasisQuantity'):null,montant:nb(l,'SpecifiedLineTradeSettlement/SpecifiedTradeSettlementLineMonetarySummation/LineTotalAmount'),tva:nb(l,'SpecifiedLineTradeSettlement/ApplicableTradeTax/RateApplicablePercent')};})};
  }
  /* --- contrôles (jamais corrigés en silence) --- */
  function controler(f){
    var C=[],add=function(code,ok,det){C.push({code:code,ok:!!ok,detail:det||null});};
    add('numero',!!f.numero);add('date',!!f.date);add('fournisseur',!!f.fournisseur);add('devise-eur',f.devise==='EUR',f.devise||'absente');add('au-moins-une-ligne',f.lignes.length>0);
    var somme=0,okSomme=true;f.lignes.forEach(function(l,i){
      var base=l.baseQuantite&&l.baseQuantite>0?l.baseQuantite:1;
      if(l.quantite==null||!isFinite(l.quantite)||l.prix==null||!isFinite(l.prix)||l.montant==null||!isFinite(l.montant)){add('ligne-'+(l.id||i+1)+'-complete',false,'quantité, prix ou montant manquant');okSomme=false;return;}
      if(l.prix===0)add('ligne-'+(l.id||i+1)+'-prix-zero',false,'prix nul : gratuité ou erreur, jamais un tarif');
      if(l.quantite===0)add('ligne-'+(l.id||i+1)+'-quantite-zero',false,'quantité nulle');
      if((l.quantite<0||l.prix<0)&&f.type!=='avoir')add('ligne-'+(l.id||i+1)+'-negative',false,'valeur négative sur une facture (pas un avoir)');
      var calc=l.quantite*l.prix/base;add('ligne-'+(l.id||i+1)+'-coherente',Math.abs(calc-l.montant)<=TOL+1e-9,{calcule:Math.round(calc*100)/100,facture:l.montant});somme+=l.montant;
      if(!l.unite)add('ligne-'+(l.id||i+1)+'-unite',false,l.uniteCommerciale?'unité commerciale ('+l.uniteCode+') : contenu à confirmer':'unité inconnue ('+(l.uniteCode||'absente')+')');});
    var t=f.totaux;
    if(okSomme&&t.lignes!=null)add('somme-lignes',Math.abs(somme-t.lignes)<=TOL+1e-9,{somme:Math.round(somme*100)/100,total:t.lignes});
    if(t.lignes!=null&&t.ht!=null)add('ht-apres-remises-frais',Math.abs(t.lignes-(t.remises||0)+(t.frais||0)-t.ht)<=TOL+1e-9,{lignes:t.lignes,remises:t.remises||0,frais:t.frais||0,ht:t.ht});
    if(t.ht!=null&&t.tva!=null&&t.ttc!=null)add('ht-plus-tva-egal-ttc',Math.abs(t.ht+t.tva-t.ttc)<=TOL+1e-9,{ht:t.ht,tva:t.tva,ttc:t.ttc});
    var tt=f.tvaParTaux||[],stva=0,okT=tt.length>0;tt.forEach(function(x){if(x.base==null||x.montant==null||x.taux==null||!isFinite(x.base)||!isFinite(x.montant)){okT=false;return;}stva+=x.montant;add('tva-'+x.taux+'-pct',Math.abs(x.base*x.taux/100-x.montant)<=TOL+1e-9,{base:x.base,taux:x.taux,montant:x.montant,calcule:Math.round(x.base*x.taux)/100});});
    if(okT&&t.tva!=null)add('tva-somme-des-taux',Math.abs(stva-t.tva)<=TOL+1e-9,{somme:Math.round(stva*100)/100,total:t.tva});
    f.consignes=0;f.fraisDoc=0;f.remisesDoc=0;(f.ajustements||[]).forEach(function(a){if(a.montant==null||!isFinite(a.montant))return;if(a.charge&&CONSIGNE.test(a.raison||''))f.consignes+=a.montant;else if(a.charge)f.fraisDoc+=a.montant;else f.remisesDoc+=a.montant;});
    return C;
  }
  /* --- rapprochement produits : exact / probable / ambigu / inconnu (seul l'exact est proposé d'office) --- */
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
  /* C214 (W26) : « bœuf » se lit « boeuf » (et non « b uf »), et les mentions d'origine ou de qualité (VBF, bio, AOP…) ne
     comptent pas comme des mots du produit. */
  function mots(s){return norm(String(s||'').replace(/œ/gi,'oe').replace(/æ/gi,'ae')).split(' ').filter(function(w){return w.length>1&&!/^\d+$/.test(w)&&['de','du','la','le','les','des','en','et','au','aux','kg','g','l','vbf','vf','bio','aop','igp','label','rouge','fr','france','origine','frais','fraiche','extra','pce','piece'].indexOf(w)<0;});}
  function rapprocher(ligne,catalogue,memoire,fournisseur){
    memoire=memoire||{};var cle=(fournisseur||'')+'|'+(ligne.ref||'');
    if(ligne.gtin&&memoire['gtin|'+ligne.gtin])return {statut:'exact',produitId:memoire['gtin|'+ligne.gtin],score:1,raison:'code-barres déjà validé'};
    if(ligne.ref&&memoire[cle])return {statut:'exact',produitId:memoire[cle],score:1,raison:'référence fournisseur déjà validée'};
    var n=norm(ligne.libelle);var ex=(catalogue||[]).filter(function(p){return norm(p.nom)===n;});if(ex.length===1)return {statut:'exact',produitId:ex[0].id,score:1,raison:'libellé identique'};
    var a=mots(ligne.libelle),sc=(catalogue||[]).map(function(p){var b=mots(p.nom),inter=a.filter(function(w){return b.indexOf(w)>=0;}).length,uni=a.length+b.length-inter,x=uni?inter/uni:0;if(a[0]&&a[0]===b[0]&&a[0].length>=4)x=Math.max(x,0.5);/* C214 (W26) : même produit de tête */return {id:p.id,nom:p.nom,score:x};}).filter(function(x){return x.score>0;}).sort(function(x,y){return y.score-x.score;});
    if(!sc.length||sc[0].score<0.34)return {statut:'inconnu',produitId:null,score:sc.length?sc[0].score:0,candidats:sc.slice(0,3)};
    if(sc.length>1&&sc[0].score-sc[1].score<0.1)return {statut:'ambigu',produitId:null,score:sc[0].score,candidats:sc.slice(0,3)};
    return {statut:'probable',produitId:null,proposition:sc[0].id,score:sc[0].score,candidats:sc.slice(0,3),raison:'à valider par une personne'};
  }
  /* --- doublon : même fournisseur + numéro + date + total TTC --- */
  function empreinteDoc(f){return [norm(f.fournisseur),String(f.numero||'').trim(),f.date,f.totaux&&f.totaux.ttc].join('|');}
  function analyser(xml,opts){
    opts=opts||{};var r;try{r=lireXML(xml);}catch(e){r=null;}
    if(!r)return {version:VERSION,statut:'illisible',statutVerdict:'erreur',raison:'XML illisible'};
    var f=r.nom==='CrossIndustryInvoice'?depuisCII(r):(r.nom==='Invoice'||r.nom==='CreditNote')?depuisUBL(r):null;
    if(!f)return {version:VERSION,statut:'format-non-supporte',statutVerdict:'erreur',raison:'racine '+r.nom};
    f.version=VERSION;f.controles=controler(f);f.empreinte=empreinteDoc(f);
    f.doublon=(opts.dejaImportees||[]).indexOf(f.empreinte)>=0;
    (opts.historiqueDocs||[]).forEach(function(h){if(f.doublon||!h||norm(h.fournisseur)!==norm(f.fournisseur))return;
      if(h.numero&&f.numero&&String(h.numero).trim()===String(f.numero).trim()&&h.ttc!=null&&f.totaux.ttc!=null&&Math.abs(h.ttc-f.totaux.ttc)>0.01){f.versionCorrigee={remplace:h.empreinte};return;}
      if(h.ttc!=null&&f.totaux.ttc!=null&&Math.abs(h.ttc-f.totaux.ttc)<=0.01&&h.date&&f.date&&Math.abs(Date.parse(h.date)-Date.parse(f.date))<=3*864e5&&String(h.numero||'')!==String(f.numero||''))f.doublonProbable={avec:h.empreinte};});
    if(opts.etablissement&&f.acheteur&&norm(f.acheteur)!==norm(opts.etablissement))f.controles.push({code:'etablissement-destinataire',ok:false,detail:f.acheteur});
    f.lignes.forEach(function(l){l.correspondance=rapprocher(l,opts.catalogue,opts.memoire,f.fournisseur);});
    var bloquants=f.controles.filter(function(c){return !c.ok&&/^(numero|date|fournisseur|au-moins-une-ligne|somme-lignes|ht-plus-tva-egal-ttc|ht-apres-remises-frais)$/.test(c.code);});
    var alertes=f.controles.filter(function(c){return !c.ok;});
    f.statut=f.doublon?'doublon':(f.doublonProbable?'doublon-probable':(bloquants.length?'a-verifier':'a-valider'));
    var incomplet=f.controles.some(function(c){return !c.ok&&/^(numero|date|fournisseur|au-moins-une-ligne)$|-complete$/.test(c.code);});
    f.statutVerdict=f.doublon?'doublon':(incomplet?'incomplet':((f.doublonProbable||bloquants.length||f.controles.some(function(c){return !c.ok&&c.code==='etablissement-destinataire';}))?'a-verifier':(f.controles.every(function(c){return c.ok;})?'verifie':'a-verifier')));
    f.confiance=f.doublon?'non-applicable':(bloquants.length?'faible':(alertes.length?'moyenne':'forte'));
    f.aValider=f.lignes.filter(function(l){return l.correspondance.statut!=='exact';}).length;
    return f;
  }
  /* --- après validation humaine seulement : lignes d'achat Verdict (avoir = quantités négatives) --- */
  function versAchats(f,validations){
    if(!f||f.statut==='doublon'||f.statut==='doublon-probable'||f.statut==='illisible'||f.statut==='format-non-supporte')return {lignes:[],refusees:[],raison:f&&f.statut};
    validations=validations||{};var out=[],ref=[],signe=f.type==='avoir'?-1:1;
    f.lignes.forEach(function(l,i){var k=l.id||String(i+1),v=validations[k];
      if(!v||!v.valide){ref.push({ligne:k,raison:'non validée'});return;}
      var produit=v.produitId||(l.correspondance&&l.correspondance.statut==='exact'?l.correspondance.produitId:null);if(!produit){ref.push({ligne:k,raison:'produit non choisi'});return;}
      var u=l.unite||v.unite||null,cond=v.conditionnement||null;if(!u&&!cond){ref.push({ligne:k,raison:'unité à confirmer'});return;}
      var base=l.baseQuantite&&l.baseQuantite>0?l.baseQuantite:1;
      out.push({d:f.dateEco||f.date,dateFacture:f.date,four:f.fournisseur,art:v.nomProduit||l.libelle,produitId:produit,qte:signe*l.quantite,unite:u||l.uniteCode,cond:cond,pu:l.prix/base,tva:l.tva,source:'facture-'+f.format.toLowerCase(),facture:f.numero,empreinte:f.empreinte,ligne:k});});
    return {lignes:out,refusees:ref};
  }
  /* Import idempotent : même facture + même ligne = ignorée si identique, remplacée si la version est corrigée. */
  function cleAchat(a){return norm(a.four)+'|'+String(a.facture||'')+'|'+String(a.ligne||'');}
  function fusionnerAchats(existants,nouveaux,remplace){var ex=(existants||[]).slice(),idx={},aj=0,rp=0,ig=0;
    if(remplace)ex=ex.filter(function(a){return a.empreinte!==remplace;});
    ex.forEach(function(a,i){if(a.facture)idx[cleAchat(a)]=i;});
    (nouveaux||[]).forEach(function(n){var k=cleAchat(n);if(idx[k]!==undefined){var o=ex[idx[k]];if(JSON.stringify(o)===JSON.stringify(n))ig++;else{ex[idx[k]]=n;rp++;}}else{idx[k]=ex.length;ex.push(n);aj++;}});
    return {achats:ex,ajoutes:aj,remplaces:rp,ignores:ig};}
  /* PDF Factur-X : le XML CII est un fichier embarqué (souvent compressé FlateDecode). inflate(Uint8Array) → Promise<Uint8Array> est fourni par l'appelant. */
  function extraireXMLduPDF(bytes,inflate){
    var b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),s='',i;for(i=0;i<b.length;i+=8192)s+=String.fromCharCode.apply(null,b.subarray(i,Math.min(b.length,i+8192)));
    if(s.slice(0,5)!=='%PDF-')return Promise.resolve({xml:null,raison:'pas-un-pdf'});
    var re=/stream\r?\n/g,m,c=[];while((m=re.exec(s))){if(s.slice(Math.max(0,m.index-3),m.index)==='end')continue;var st=m.index+m[0].length,en=s.indexOf('endstream',st);if(en<0)break;var o=s.lastIndexOf(' obj',m.index),dict=s.slice(o<0?Math.max(0,m.index-400):o,m.index),lg=/\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict);c.push({st:st,en:en,len:lg?Number(lg[1]):null,dict:dict});re.lastIndex=en+9;}
    c.sort(function(x,y){return (/EmbeddedFile/.test(y.dict)?1:0)-(/EmbeddedFile/.test(x.dict)?1:0);});
    var dec=typeof TextDecoder!=='undefined'?new TextDecoder('utf-8'):null;
    return c.reduce(function(p,x){return p.then(function(trouve){if(trouve)return trouve;var e=x.en;if(x.len!=null&&x.st+x.len<=x.en)e=x.st+x.len;else{if(b[e-1]===10)e--;if(b[e-1]===13)e--;}var raw=b.subarray(x.st,e);
      var d=/FlateDecode/.test(x.dict)?Promise.resolve().then(function(){return inflate(raw);}).catch(function(){return null;}):Promise.resolve(raw);
      return d.then(function(u){if(!u||!dec)return null;var t=dec.decode(u);return /CrossIndustryInvoice|urn:oasis:names:specification:ubl:schema/.test(t)?{xml:t.slice(t.indexOf('<')),raison:null}:null;});});},Promise.resolve(null))
      .then(function(r){return r||{xml:null,raison:'aucun-xml-integre'};});
  }
  function memoriser(memoire,f,validations){memoire=Object.assign({},memoire||{});f.lignes.forEach(function(l,i){var v=(validations||{})[l.id||String(i+1)];if(v&&v.valide&&v.produitId&&l.ref)memoire[(f.fournisseur||'')+'|'+l.ref]=v.produitId;if(v&&v.valide&&v.produitId&&l.gtin)memoire['gtin|'+l.gtin]=v.produitId;});return memoire;}
  return {version:VERSION,extraireXMLduPDF:extraireXMLduPDF,fusionnerAchats:fusionnerAchats,lireXML:lireXML,analyser:analyser,rapprocher:rapprocher,versAchats:versAchats,memoriser:memoriser,unite:unite,tolerance:TOL};
});

/* =====================================================================
   C217 — L'Inventaire relié à ses documents (lot L6, vague 3, 21/10/2026)
   W64 · Inventaire gratuit : une facture électronique se dépose ici, sans Pilotage. Ses prix mettent à jour les
         produits (valeur du stock, commandes) ; l'analyse (écart matière, Carte) reste dans Pilotage et Pro.
   W59 · Avec Pilotage ou Pro : une facture validée dans Inventaire › Analyse met aussi à jour les produits de
         l'Inventaire (avant : seule la Carte changeait, l'Inventaire restait à 0 €).
   W58 · Inventaire relié : les ingrédients des fiches et les produits des factures deviennent des produits de
         l'Inventaire (une seule question globale), et les ventes de la caisse × les fiches alimentent la commande.
   W63 · Ouvert directement sur l'Inventaire pendant l'essai ou avec Pilotage/Pro, Analyse demande à la coque de
         préparer Pilotage en arrière-plan : Factures, Pertes, Clôture et Écart reviennent sans détour.
   Doctrine : un document prime, aucune saisie qu'il peut donner ; rien n'est écrit sans validation ; un prix inconnu
   reste inconnu (jamais 0) ; aucune conversion d'unité inventée ; 0 changement au repos (rien n'est réécrit si rien
   n'a changé).
   Le lecteur de factures ci-dessus est une copie fidèle du moteur pur de Verdict (invoiceImportEngine v1.1,
   verdict-029) : il n'est installé que si la page ne l'a pas déjà.
   ===================================================================== */
(function (w) {
  'use strict';
  if (w.__vdInvC217) return; w.__vdInvC217 = true;
  var doc = w.document;
  function g(n) { try { return w[n]; } catch (e) { return undefined; } }
  function DBi() { return g('DB'); }
  function norm(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nbFr(n, d) { if (n == null || !isFinite(n)) return '—'; return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); }
  function jj(d) { d = String(d || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.split('-').reverse().join('/') : ''; }
  function demo() { try { return !!g('DEMO'); } catch (e) { return false; } }
  /* C229 (X36) : en équipe (lien du patron) ou en inventaire partagé, rien de Verdict ni des factures du patron. */
  function equipe() { try { return !!g('STAFF') || !!g('SHARED'); } catch (e) { return true; } }
  function verdictF() { try { return typeof w.matiereVerdictFrame === 'function' ? w.matiereVerdictFrame() : null; } catch (e) { return null; } }
  function planInventaire() { try { var P = w.top && w.top.VerdictPlan; return !!(P && typeof P.actif === 'function' && P.actif() && P.etat().niveau === 'inventaire'); } catch (e) { return false; } }
  function rows() { try { return w.siteRows(DBi().site) || []; } catch (e) { return []; } }
  function sauver() { try { w.save(); } catch (e) {} }
  function redessiner() { try { var v = g('VIEW'); if (v === 'stats' && typeof w.drawStats === 'function') w.drawStats(); else if (v === 'count' && typeof w.drawCount === 'function') w.drawCount(); else if (v === 'prod' && typeof w.drawProd === 'function') w.drawProd(); else if (v === 'order' && typeof w.drawOrder === 'function') w.drawOrder(); } catch (e) {} try { poserReprise(); } catch (e) {} }

  /* ── Unités : une conversion n'est faite que si elle est certaine ── */
  var DIM = { kg: ['m', 1], kilo: ['m', 1], kgm: ['m', 1], g: ['m', 0.001], grm: ['m', 0.001], gr: ['m', 0.001], l: ['v', 1], ltr: ['v', 1], litre: ['v', 1], litres: ['v', 1], lt: ['v', 1], cl: ['v', 0.01], clt: ['v', 0.01], ml: ['v', 0.001], mlt: ['v', 0.001],
    piece: ['p', 1], pieces: ['p', 1], pce: ['p', 1], pc: ['p', 1], u: ['p', 1], un: ['p', 1], unite: ['p', 1], unites: ['p', 1], c62: ['p', 1], h87: ['p', 1], ea: ['p', 1], btl: ['p', 1], bt: ['p', 1], bouteille: ['p', 1], bouteilles: ['p', 1], bout: ['p', 1], canette: ['p', 1], canettes: ['p', 1] };
  function dim(u) { return DIM[norm(u).replace(/\s+/g, '')] || null; }
  /* Prix d'une ligne de facture ramené à l'unité de base (kg, L ou pièce) ; null si l'unité n'est pas certaine. */
  function prixBase(l) {
    if (!(l.pu > 0)) return null;
    var c = l.cond; if (c && c.qte > 0) { var cu = dim(c.unite); return cu ? { dim: cu[0], prix: l.pu / (c.qte * cu[1]) } : null; }
    var u = dim(l.unite); return u ? { dim: u[0], prix: l.pu / u[1] } : null;
  }
  /* Prix dans l'unité du produit, ou une raison claire de ne pas l'appliquer. */
  function prixPourProduit(p, b) {
    var pd = dim(p.unit);
    if (!pd && !String(p.unit || '').trim() && b.dim === 'p') pd = ['p', 1];
    if (!pd) return { non: 'unité du produit (' + (p.unit || '—') + ') à rapprocher de la facture' };
    if (pd[0] !== b.dim) return { non: 'facture au ' + (b.dim === 'm' ? 'kg' : b.dim === 'v' ? 'litre' : 'pièce') + ', produit en ' + (p.unit || '—') };
    return { prix: Math.round(b.prix * pd[1] * 10000) / 10000 };
  }
  function uniteProduit(l) { var c = l.cond && l.cond.qte > 0 ? dim(l.cond.unite) : dim(l.unite); if (!c) return ''; return c[0] === 'm' ? 'kg' : c[0] === 'v' ? 'L' : (/bout|btl/.test(norm(l.unite)) ? 'btl' : 'pièce'); }
  var BOISSON = /\b(vin|vins|biere|bieres|soda|sodas|eau|eaux|jus|sirop|whisky|rhum|vodka|gin|champagne|cola|limonade|cafe|the|tisane|cidre|aperitif|liqueur|tonic|pression|fut|cubi)\b/;
  function zonePour(nom, esp) {
    var D = DBi(), zs = []; try { zs = w.spList(D.site) || []; } catch (e) {}
    var bar = zs.filter(function (k) { var m = D.meta && D.meta[k] || {}; return m.kind === 'bar' || /bar/i.test(k + ' ' + (m.name || '')); })[0];
    var cui = zs.filter(function (k) { return k !== bar; })[0];
    if (esp === 'bar' || (!esp && BOISSON.test(norm(nom)))) return bar || cui || D.space;
    return cui || D.space;
  }
  function produitParNom(nom) { var k = norm(nom), r = rows(); for (var i = 0; i < r.length; i++) if (norm(r[i].p.name) === k) return r[i]; for (var j = 0; j < r.length; j++) if (r[j].p.ingredient && norm(r[j].p.ingredient) === k) return r[j]; return null; }
  function produitParId(id) { var r = rows(); for (var i = 0; i < r.length; i++) if (r[i].p.id === id) return r[i]; return null; }
  function creerProduit(o) {
    var D = DBi(), z = zonePour(o.name, o.esp); if (!D.spaces[z]) return null;
    var p = { id: w.uid(), name: String(o.name).slice(0, 160), sup: String(o.sup || '').slice(0, 160), unit: String(o.unit || '').slice(0, 40), goal: null, min: null, price: o.price > 0 ? o.price : null, pack: 1, minOrder: 0, leadDays: 0, shelfLifeDays: 0, over: {}, stock: null, sku: '', priceDate: o.priceDate || '', offers: [], category: '', origine: o.origine || '' };
    (D.spaces[z].products = D.spaces[z].products || []).push(p);
    return { p: p, space: z, site: D.site };
  }

  /* ── W59 · prix des factures → produits de l'Inventaire (+ produits créés quand l'Inventaire est relié) ── */
  function appliquerLignes(lignes, opts) {
    opts = opts || {}; var D = DBi(), res = { maj: [], confirmes: [], ajoutes: [], non: [] };
    if (!D || demo()) return res;
    (lignes || []).forEach(function (l) {
      if (!(l.qte > 0) || !(l.pu > 0)) return;
      var nom = l.art || l.libelle || '', cible = null;
      var ingCarte = /^ing:/.test(String(l.produitInv || '')) ? String(l.produitInv).slice(4) : '';
      if (ingCarte) { cible = produitParNom(ingCarte); if (!cible) { var u0 = uniteProduit(l), b0 = prixBase(l), pr0 = b0 ? prixPourProduit({ unit: u0 }, b0) : null; cible = creerProduit({ name: ingCarte, sup: l.four, unit: u0, price: pr0 && pr0.prix, priceDate: String(l.d || l.dateFacture || '').slice(0, 10), origine: 'facture' }); if (cible) { cible.p.ingredient = ingCarte; res.ajoutes.push(cible.p.name); journal(D, cible, null, cible.p.price, l); } return; } }
      else if (l.produitInv) cible = produitParId(l.produitInv);
      if (!cible && l.produitInv !== '__nouveau__') cible = produitParNom(nom) || (l.nomCatalogue ? produitParNom(l.nomCatalogue) : null);
      var b = prixBase(l);
      if (!cible) {
        if (!opts.creer && l.produitInv !== '__nouveau__') { res.non.push(nom + ' (aucun produit de ce nom dans l’Inventaire)'); return; }
        var u = uniteProduit(l), pr = b ? prixPourProduit({ unit: u }, b) : null;
        cible = creerProduit({ name: nom, sup: l.four, unit: u, price: pr && pr.prix, priceDate: String(l.d || l.dateFacture || '').slice(0, 10), origine: 'facture' });
        if (cible) { res.ajoutes.push(cible.p.name); journal(D, cible, null, cible.p.price, l); }
        return;
      }
      var p = cible.p; if (!p.sup && l.four) p.sup = String(l.four).slice(0, 160);
      if (!b) { res.non.push(p.name + ' (unité de la facture à confirmer)'); return; }
      var r = prixPourProduit(p, b); if (r.non) { res.non.push(p.name + ' (' + r.non + ')'); return; }
      var d = String(l.d || l.dateFacture || '').slice(0, 10);
      if (p.priceDate && d && d < String(p.priceDate).slice(0, 10)) { res.non.push(p.name + ' (facture plus ancienne que le prix actuel)'); return; }
      var av = Number(p.price) > 0 ? Number(p.price) : null;
      if (av != null && Math.abs(av - r.prix) < 0.00005) { if (d) p.priceDate = d; res.confirmes.push(p.name); return; }
      p.price = r.prix; if (d) p.priceDate = d; journal(D, cible, av, r.prix, l);
      /* C229 (X30) : sans ancien prix, pas de « — → » : « premier prix ». */
      res.maj.push(av == null ? p.name + ' : ' + nbFr(r.prix) + ' € / ' + (p.unit || 'unité') + ' (premier prix)' : p.name + ' ' + nbFr(av) + ' → ' + nbFr(r.prix) + ' € / ' + (p.unit || 'unité'));
    });
    if (res.maj.length || res.ajoutes.length || res.confirmes.length) { if (D.priceHistory && D.priceHistory.length > 200) D.priceHistory = D.priceHistory.slice(-200); sauver(); }
    return res;
  }
  function journal(D, cible, av, nv, l) { D.priceHistory = D.priceHistory || []; D.priceHistory.push({ date: new Date().toISOString(), site: cible.site || D.site, space: cible.space, product: cible.p.id, name: cible.p.name, from: av, to: nv, source: 'facture', facture: l.facture || null, fournisseur: l.four || null }); }
  function texteResultat(r) {
    var t = [];
    if (r.maj.length) t.push('Prix mis à jour dans l’Inventaire : ' + r.maj.join(' · ') + '.');
    if (r.confirmes.length) t.push('Prix confirmés : ' + r.confirmes.join(', ') + '.');
    if (r.ajoutes.length) t.push(r.ajoutes.length + (r.ajoutes.length > 1 ? ' produits ajoutés' : ' produit ajouté') + ' à l’Inventaire : ' + r.ajoutes.join(', ') + '.');
    if (r.non.length) t.push('Non appliqué : ' + r.non.join(' · ') + '.');
    return t.join(' ');
  }
  w.inventaireAppliquerFacture = appliquerLignes;

  /* Avec Pilotage (essai, Pilotage, Pro) : la carte Factures reste celle de Verdict ; après sa validation, les mêmes
     lignes validées mettent à jour l'Inventaire et y créent les produits absents (Inventaire relié). */
  var dernierTexte = '';
  function envelopperValidation() {
    var o = w.facValider; if (typeof o !== 'function' || o.__c217) return;
    var v2 = function () {
      var F = verdictF(), f = F && F.__factureEnCours, lignes = [];
      if (F && f && F.VerdictFacturesXML) {
        try {
          var v = {}, cat = {};
          try { (F.facCatalogue ? F.facCatalogue() : []).forEach(function (c) { cat[c.id] = c.nom; }); } catch (e) {}
          [].forEach.call(doc.querySelectorAll('#facturesCarte .fac-l'), function (row) { var id = row.getAttribute('data-ligne'), ck = row.querySelector('.fac-ok'), sel = row.querySelector('.fac-prod'), cq = row.querySelector('.fac-cq'), cu = row.querySelector('.fac-cu'); var x = { valide: !!(ck && ck.checked), produitId: sel && sel.value ? sel.value : null }; if (cq && cq.value !== '' && isFinite(+cq.value) && +cq.value > 0) x.conditionnement = { qte: +cq.value, unite: cu ? cu.value : 'kg' }; if (x.produitId) x.nomProduit = cat[x.produitId] || null; v[id] = x; });
          lignes = F.VerdictFacturesXML.versAchats(f, v).lignes.map(function (a) { var l = (f.lignes || []).filter(function (x, i) { return (x.id || String(i + 1)) === a.ligne; })[0] || {}; return { art: l.libelle || a.art, nomCatalogue: a.art, qte: a.qte, pu: a.pu, unite: a.unite, cond: a.cond, d: a.d, dateFacture: a.dateFacture, four: a.four, facture: a.facture }; });
        } catch (e) { lignes = []; }
      }
      var r = o.apply(this, arguments);
      if (lignes.length) { var res = appliquerLignes(lignes, { creer: true }); dernierTexte = texteResultat(res); if (dernierTexte) { try { w.toast(res.maj.length || res.ajoutes.length ? 'Inventaire mis à jour ✓' : 'Facture enregistrée'); } catch (e) {} redessiner(); } }
      return r;
    };
    v2.__c217 = true; w.facValider = v2;
  }

  /* ── W64 · carte Factures propre à l'Inventaire, quand Pilotage n'est pas là (Inventaire gratuit) ── */
  var EN_COURS = null, RESULTAT = '';
  /* C302 (V15-115) : les ingrédients de la Carte sont proposés aussi (« Entrecote VBF » relié à « Entrecôte de bœuf » au lieu d'un doublon). */
  function ingredientsCarte() { var deja = {}; rows().forEach(function (x) { deja[norm(x.p.name)] = 1; if (x.p.ingredient) deja[norm(x.p.ingredient)] = 1; }); var out = []; try { var F = verdictF(); if (F && !carteExemple(F)) (F.DB.ing || []).forEach(function (i) { if (i && i.nom && !deja[norm(i.nom)] && !NON_COMPTABLE.test(i.nom)) { deja[norm(i.nom)] = 1; out.push({ id: 'ing:' + i.nom, nom: i.nom }); } }); } catch (e) {} return out; }
  function catalogueInv() { return rows().map(function (x) { return { id: x.p.id, nom: x.p.name }; }).concat(ingredientsCarte()); }
  function analyser(texte, nom) {
    var X = w.VerdictFacturesXML, D = DBi(); if (!X) return;
    var hist = (D.facturesInventaire || []);
    var ici = ''; try { ici = String(w.siteName(D.site) || '').replace(/&[a-z]+;/gi, ' ').trim(); } catch (e) {}
    var f = X.analyser(texte, { catalogue: catalogueInv(), memoire: D.factureMemoireInv || {}, dejaImportees: hist.map(function (h) { return h.empreinte; }), historiqueDocs: hist, etablissement: /^mon (e|é)tablissement$/i.test(ici) ? '' : ici });
    /* C302 (V15-075, V15-115) : destinataire contrôlé — adressée à un autre établissement du compte, elle est bloquée ici ; nom inconnu, il faut confirmer. */
    try { f.__ici = ici; f.__autre = ''; if (f.acheteur && (f.controles || []).some(function (c) { return !c.ok && c.code === 'etablissement-destinataire'; })) (D.siteList || []).forEach(function (s) { if (s !== D.site && !f.__autre && norm(w.siteName(s)) === norm(f.acheteur)) f.__autre = String(w.siteName(s)); }); } catch (e) {}
    f.fichier = nom || null; EN_COURS = f; RESULTAT = '';
  }
  w.invFacLire = function (inp) {
    var fi = inp && inp.files && inp.files[0]; if (!fi || !w.VerdictFacturesXML) return;
    var pdf = /\.pdf$/i.test(fi.name) || fi.type === 'application/pdf', r = new FileReader();
    r.onload = function () {
      try {
        if (pdf) {
          var inflate = function (u) { return new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer().then(function (a) { return new Uint8Array(a); }); };
          w.VerdictFacturesXML.extraireXMLduPDF(new Uint8Array(r.result), inflate).then(function (x) { if (x && x.xml) analyser(x.xml, fi.name); else { EN_COURS = null; RESULTAT = 'Ce PDF ne contient pas de facture électronique lisible (Factur-X). Déposez le fichier XML de la facture.'; } redessiner(); }, function () { RESULTAT = 'PDF illisible.'; redessiner(); });
          return;
        }
        analyser(String(r.result || ''), fi.name);
      } catch (e) { EN_COURS = null; RESULTAT = 'Facture illisible.'; }
      redessiner();
    };
    if (pdf) r.readAsArrayBuffer(fi); else r.readAsText(fi);
  };
  w.invFacAnnuler = function () { EN_COURS = null; RESULTAT = ''; redessiner(); };
  w.invFacValider = function () {
    var f = EN_COURS, D = DBi(); if (!f || !w.VerdictFacturesXML || !D) return;
    if (f.doublon) { RESULTAT = 'Cette facture a déjà été importée : rien n’a changé.'; EN_COURS = null; redessiner(); return; }
    if (f.doublonProbable) { var dp = doc.querySelector('#facturesInv .fi-dp-ok'); if (!dp || !dp.checked) { RESULTAT = 'Rien n’a été importé : cette facture ressemble à une facture déjà importée. Cochez « Ce n’est pas un doublon » pour l’importer quand même.'; redessiner(); return; } f = Object.assign({}, f, { statut: 'a-valider', doublonProbable: null }); }
    var dest = (f.controles || []).some(function (c) { return !c.ok && c.code === 'etablissement-destinataire'; });
    if (dest && f.__autre) { RESULTAT = 'Rien n’a été importé : cette facture est pour « ' + f.__autre + ' ».'; redessiner(); return; }
    if (dest) { var ok = doc.querySelector('#facturesInv .fi-dest-ok'); if (!ok || !ok.checked) { RESULTAT = 'Confirmez d’abord que cette facture concerne « ' + (f.__ici || 'cet établissement') + ' ».'; redessiner(); return; } }
    var v = {}, choix = {};
    [].forEach.call(doc.querySelectorAll('#facturesInv .fi-l'), function (row) { var id = row.getAttribute('data-ligne'), ck = row.querySelector('.fi-ok'), sel = row.querySelector('.fi-prod'); var val = sel ? sel.value : ''; choix[id] = val; v[id] = { valide: !!(ck && ck.checked) && val !== '__ignorer__', produitId: val ? val : null }; });
    var A = w.VerdictFacturesXML.versAchats(f, v), lignes = A.lignes.map(function (a) { var l = (f.lignes || []).filter(function (x, i) { return (x.id || String(i + 1)) === a.ligne; })[0] || {}, c = choix[a.ligne]; return { art: l.libelle || a.art, produitInv: c, qte: a.qte, pu: a.pu, unite: a.unite, cond: a.cond, d: a.d, dateFacture: a.dateFacture, four: a.four, facture: a.facture }; });
    var res = appliquerLignes(lignes, { creer: false });
    D.factureMemoireInv = w.VerdictFacturesXML.memoriser(D.factureMemoireInv || {}, f, v);
    D.facturesInventaire = (D.facturesInventaire || []).filter(function (h) { return h.empreinte !== f.empreinte; });
    D.facturesInventaire.push({ site: D.site, empreinte: f.empreinte, fournisseur: f.fournisseur, numero: f.numero, date: f.date, ht: f.totaux && f.totaux.ht, ttc: f.totaux && f.totaux.ttc, lignes: lignes.length, fichier: f.fichier, importeLe: new Date().toISOString(), achats: A.lignes });
    /* C302 : avec Pilotage sur le même établissement, les achats validés y entrent aussi (comme l'ancienne carte de Pilotage). */
    try { var F = verdictF(); if (F && F.DB && F.VerdictFacturesXML && A.lignes.length && F.DB.inventoryLink && String(F.DB.inventoryLink.siteId || '') === String(D.site)) { var noms = {}; lignes.forEach(function (x) { var c = x.produitInv && !/^(__|ing:)/.test(x.produitInv) ? produitParId(x.produitInv) : null; noms[x.facture + '|' + x.art] = c ? c.p.name : (/^ing:/.test(String(x.produitInv || '')) ? String(x.produitInv).slice(4) : x.art); }); var pa = A.lignes.map(function (a) { var l = (f.lignes || []).filter(function (x, i) { return (x.id || String(i + 1)) === a.ligne; })[0] || {}, nm = noms[a.facture + '|' + (l.libelle || a.art)] || a.art; return Object.assign({}, a, { art: nm, produitId: typeof F.achCle === 'function' ? F.achCle(nm) : nm }); }); var M = F.VerdictFacturesXML.fusionnerAchats(F.DB.achats || [], pa, f.versionCorrigee && f.versionCorrigee.remplace); F.DB.achats = M.achats; if (typeof F.save === 'function') F.save('facture-inventaire'); } } catch (e) {}
    if (D.facturesInventaire.length > 120) D.facturesInventaire = D.facturesInventaire.slice(-120);
    sauver(); EN_COURS = null; RESULTAT = texteResultat(res) || 'Facture enregistrée : aucune ligne validée.';
    try { w.toast('Facture enregistrée ✓'); } catch (e) {}
    redessiner();
  };
  /* Le choix proposé pour une ligne : le produit reconnu, sinon « nouveau produit » (rien n'est créé sans « Valider »). */
  function selectProduit(l, i) {
    var c = l.correspondance || {}, def = c.statut === 'exact' ? c.produitId : (c.statut === 'probable' ? c.proposition : '__nouveau__');
    var opts = rows().map(function (x) { return '<option value="' + esc(x.p.id) + '"' + (x.p.id === def ? ' selected' : '') + '>' + esc(x.p.name) + (x.p.unit ? ' · ' + esc(x.p.unit) : '') + '</option>'; }).join('');
    var ing = ingredientsCarte(); if (ing.length) opts += '<optgroup label="Ingrédients de votre Carte">' + ing.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === def ? ' selected' : '') + '>' + esc(x.nom) + '</option>'; }).join('') + '</optgroup>';
    return '<select class="fi-prod" style="min-height:44px;width:100%;font:inherit;font-size:15px;padding:8px 10px;border-radius:12px;border:1px solid var(--line,#cbd5dc);background:var(--card,#fff);color:inherit" aria-label="Produit de l’Inventaire pour ' + esc(l.libelle) + '"><option value="__nouveau__"' + (def === '__nouveau__' ? ' selected' : '') + '>➕ Nouveau produit « ' + esc(l.libelle) + ' »</option>' + opts + '<option value="__ignorer__">Ignorer cette ligne</option></select>' + (c.statut === 'probable' ? '<small class="fi-a">proposition à confirmer</small>' : '');
  }
  function carteNative() {
    if (demo() || equipe() || !w.VerdictFacturesXML) return '';
    var D = DBi(), f = EN_COURS, h = '<div class="card" id="facturesInv"><h3>Factures fournisseurs<span class="n">prix de vos produits</span></h3>';
    h += '<p class="sub" style="margin:0 0 10px">Déposez la facture électronique de votre fournisseur (XML Factur-X, UBL ou PDF Factur-X)&nbsp;: ses prix mettent à jour vos produits, donc la valeur du stock et vos commandes. Rien n’est enregistré sans votre validation.</p>';
    if (!f) h += '<label class="btn ghost fi-depot" style="display:block;text-align:center;cursor:pointer">Déposer une facture<input type="file" accept=".xml,.pdf,application/xml,text/xml,application/pdf" onchange="invFacLire(this)" style="display:none"></label>';
    if (f) {
      if (f.statut === 'illisible' || f.statut === 'format-non-supporte') h += '<p class="sub" style="color:var(--orange)">Facture non lue&nbsp;: ' + esc(f.raison || f.statut) + '.</p><button class="btn ghost" onclick="invFacAnnuler()">Fermer</button>';
      else {
        h += '<p style="margin:0 0 8px"><b>' + esc(f.fournisseur || 'Fournisseur') + '</b> · n° ' + esc(f.numero || '—') + ' · ' + esc(jj(f.date)) + (f.totaux && f.totaux.ht != null ? ' · ' + nbFr(f.totaux.ht) + ' € HT' : '') + '</p>';
        if (f.doublon) h += '<p class="sub" style="color:var(--orange)">Cette facture a déjà été importée.</p>';
        /* C302 : un doublon probable (même fournisseur, même montant, à quelques jours) n'était jamais dit : toutes ses lignes étaient écartées en silence. */
        if (f.doublonProbable && !f.doublon) h += '<label class="fi-dp" style="display:flex;gap:8px;align-items:flex-start;margin:0 0 8px;color:var(--orange)"><input type="checkbox" class="fi-dp-ok"><span><b>Très proche d’une facture déjà importée</b> (même fournisseur, même montant, à quelques jours). Ce n’est pas un doublon : l’importer quand même.</span></label>';
        var dest = (f.controles || []).some(function (c) { return !c.ok && c.code === 'etablissement-destinataire'; });
        if (dest && f.__autre) h += '<p class="sub fi-dest" style="color:var(--orange)"><b>Facture adressée à « ' + esc(f.__autre) + ' »</b>, pas à « ' + esc(f.__ici) + ' ». Ouvrez l’Inventaire de « ' + esc(f.__autre) + ' » pour l’importer.</p>';
        else if (dest) h += '<label class="fi-dest" style="display:flex;gap:8px;align-items:flex-start;margin:0 0 8px;color:var(--orange)"><input type="checkbox" class="fi-dest-ok"><span><b>Facture adressée à « ' + esc(f.acheteur) + ' »</b>. Je confirme qu’elle concerne « ' + esc(f.__ici) + ' ».</span></label>';
        h += (f.lignes || []).map(function (l, i) { var id = l.id || String(i + 1), u = l.unite || l.uniteCode || ''; return '<div class="fi-l" data-ligne="' + esc(id) + '" style="display:grid;gap:6px;padding:9px 0;border-top:1px solid var(--line)"><label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" class="fi-ok"' + (f.doublon ? '' : ' checked') + '><span><b>' + esc(l.libelle) + '</b><br><small>' + nbFr(l.quantite, l.quantite % 1 ? 2 : 0) + ' ' + esc(u === 'piece' ? 'pièce' + (l.quantite > 1 ? 's' : '') : u) + ' × ' + nbFr(l.prix) + ' € HT</small></span></label>' + selectProduit(l, i) + '</div>'; }).join('');
        h += '<div style="display:flex;gap:8px;margin-top:10px">' + (dest && f.__autre ? '' : '<button class="btn" onclick="invFacValider()">Valider les lignes cochées</button>') + '<button class="btn ghost" onclick="invFacAnnuler()">' + (dest && f.__autre ? 'Fermer' : 'Annuler') + '</button></div>';
      }
    }
    if (RESULTAT) h += '<p class="sub fi-res" style="margin:10px 0 0">' + esc(RESULTAT) + '</p>';
    /* C302 (V15-115) : les achats facturés entrent dans l'Analyse, par mois (HT, factures de cet établissement). */
    try { var mois = {}, premier = (D.siteList || [])[0], ceSite = (D.facturesInventaire || []).filter(function (x) { return (x.site || premier) === D.site; }); ceSite.forEach(function (x) { var m = String(x.date || '').slice(0, 7); if (!/^\d{4}-\d{2}$/.test(m)) return; var ht = x.ht != null ? Number(x.ht) : (x.achats || []).reduce(function (s, a) { return s + (Number(a.qte) || 0) * (Number(a.pu) || 0); }, 0); if (!isFinite(ht)) return; mois[m] = mois[m] || { ht: 0, n: 0 }; mois[m].ht += ht; mois[m].n++; });
      var cles = Object.keys(mois).sort().reverse().slice(0, 3); if (cles.length) h += '<div class="fi-achats" style="margin:10px 0 0;padding:10px 12px;border-radius:12px;border:1px solid var(--line)"><b>Achats facturés</b>' + cles.map(function (m) { var d = new Date(m + '-15T12:00:00'); return '<div style="display:flex;justify-content:space-between;gap:8px;margin-top:4px"><span>' + esc(d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })) + ' · ' + mois[m].n + ' facture' + (mois[m].n > 1 ? 's' : '') + '</span><b>' + nbFr(mois[m].ht) + ' € HT</b></div>'; }).join('') + '</div>'; } catch (e) {}
    var hist = (D && D.facturesInventaire || []).filter(function (x) { return (x.site || (D.siteList || [])[0]) === D.site; }).slice(-3).reverse();/* sans site : d'avant C302, au premier établissement */
    if (hist.length && !f) h += '<p class="sub" style="margin:10px 0 0">Dernières factures&nbsp;: ' + hist.map(function (x) { return esc(x.fournisseur || '') + ' ' + esc(jj(x.date)); }).join(' · ') + '. ' + (planInventaire() ? 'Elles restent ici et serviront à l’analyse si vous passez à Pilotage.' : 'Elles servent aussi à l’analyse de Pilotage : écart matière et coût des plats.') + '</p>';/* C312 (V16-059) : la phrase suit la formule */
    return h + '</div>';
  }
  function envelopperFactures() {
    var o = w.facturesHtml; if (typeof o !== 'function' || o.__c217) return;
    /* C302 (V15-074, V15-115) : dans l'Inventaire, toujours sa propre carte — la carte de Pilotage ne savait ni créer un produit ni
       proposer les boissons (« 2 non importée(s) »). Les achats validés partent aussi dans Pilotage quand c'est le même établissement. */
    var f2 = function () { return carteNative(); };
    f2.__c217 = true; w.facturesHtml = f2;
  }

  /* ── W63 · Pilotage préparé à la demande quand l'Inventaire est ouvert seul (essai, Pilotage, Pro) ── */
  var demande = 0;
  function verdictDemande() {
    if (verdictF() || planInventaire() || demo() || equipe()) return false;
    try { if (w.parent === w || !w.parent.VerdictUnifiedShell) return false; } catch (e) { return false; }
    if (Date.now() - demande < 20000) return true;
    demande = Date.now();
    try { w.parent.postMessage({ type: 'verdict-inventory-needs-verdict' }, location.origin); } catch (e) { return false; }
    return true;
  }
  w.addEventListener('message', function (ev) {
    if (ev.origin !== location.origin || !ev.data || ev.data.type !== 'verdict-frame-ready') return;
    demande = 0; envelopperValidation(); redessiner(); try { repriseEtDemande(); } catch (e) {}
  });

  /* ── W58 · ingrédients des fiches → produits (une seule question) ; ventes × fiches → commande intelligente ── */
  var CLE_IGN = 'verdict:inv:reprise-verdict-ignoree:v1';
  /* C229 (X25) : ce qui n'est pas un produit qu'on compte (plat du jour, marchandise par assiette) n'est jamais proposé. */
  var NON_COMPTABLE = /plat du jour|marchandise par assiette|par assiette/i;
  function premierMot(n) { var m = norm(n).split(' ').filter(function (x) { return x.length >= 4 && !/^(avec|sans|pour|frais|fraiche|maison)$/.test(x); })[0] || ''; return m.replace(/(s|x)$/, ''); }
  function dimIngredient(i) { var t = String(i && i.type || '').toUpperCase(); return t === 'KG' ? 'm' : (t === 'L' || /VOL|LIT/.test(t)) ? 'v' : 'p'; }
  function ingredientsAbsents(F) {
    var V = F && F.DB; if (!V || !Array.isArray(V.ing)) return [];
    var deja = {}; rows().forEach(function (x) { deja[norm(x.p.name)] = 1; if (x.p.ingredient) deja[norm(x.p.ingredient)] = 1; });
    var esp = {}; platsPropres(F).forEach(function (p) { (p.rec || []).forEach(function (r) { var k = norm(Array.isArray(r) ? r[0] : r && (r.nom || r.name)); if (k) { esp[k] = esp[k] || {}; esp[k][p.esp || 'cuisine'] = (esp[k][p.esp || 'cuisine'] || 0) + 1; } }); });
    return V.ing.filter(function (i) { return i && i.nom && esp[norm(i.nom)] && !deja[norm(i.nom)] && !NON_COMPTABLE.test(i.nom); }).map(function (i) { var e = esp[norm(i.nom)] || {}; return { ing: i, esp: (e.bar || 0) > (e.cuisine || 0) ? 'bar' : (e.cuisine ? 'cuisine' : null) }; });
  }
  /* C229 (X24) : un produit déjà compté sous un autre nom (« Entrecote VBF ») est proposé pour l'ingrédient de la fiche
     (« Entrecôte de bœuf ») : même premier mot, même grandeur (kg, litre ou pièce), un seul candidat. Relié = pas de doublon,
     et le prix de ses factures va dans la fiche. */
  function propositions(list) {
    var nomsIng = {}; list.forEach(function (x) { nomsIng[norm(x.ing.nom)] = 1; });
    /* un produit qui porte déjà le nom exact d'un ingrédient de la Carte y est relié par son nom : jamais proposé pour un autre */
    var tous = {}; try { (verdictF().DB.ing || []).forEach(function (g) { tous[norm(g.nom)] = 1; }); } catch (e) {}
    var libres = rows().filter(function (x) { return !x.p.ingredient && !tous[norm(x.p.name)]; }), pris = {};
    return list.map(function (x) {
      var mot = premierMot(x.ing.nom); if (!mot) return null;
      var c = libres.filter(function (r) { if (pris[r.p.id] || nomsIng[norm(r.p.name)]) return false; var d = dim(r.p.unit); return premierMot(r.p.name) === mot && (!d || d[0] === dimIngredient(x.ing)); });
      if (c.length !== 1) return null; pris[c[0].p.id] = 1; return { ing: x.ing, produit: c[0].p };
    }).filter(Boolean);
  }
  /* C229 (X25) : un prix n'est repris que s'il est réel (facture, saisi par le patron) ; un prix du catalogue de départ
     (SEED_CAT, prix type) ou proposé par Vera reste vide, comme le dit l'Inventaire. */
  function prixReel(i, F) {
    var pr = Number(i.prix); if (!(pr > 0)) return null;
    if (i.prixSource === 'facture' || i.prixSource === 'patron') return Math.round(pr * 10000) / 10000;
    if (i.cpPrixType || i.prixSource === 'type') return null;
    var seed = null; try { seed = F.SEED_CAT; } catch (e) {}
    if (Array.isArray(seed) && seed.some(function (s) { return norm(s[0]) === norm(i.nom) && Math.abs(Number(s[2]) - pr) < 0.00005; })) return null;
    return Math.round(pr * 10000) / 10000;
  }
  function empreinte(list, props) { return list.map(function (x) { return norm(x.ing.nom); }).sort().join('|') + '#' + (props || []).map(function (p) { return p.produit.id + '=' + norm(p.ing.nom); }).join('|'); }
  function dernierFournisseur(V, nom) { var k = norm(nom), a = (V.achats || []).filter(function (x) { return norm(x.art) === k || norm(x.produitId) === k; }); a.sort(function (x, y) { return String(x.d || '').localeCompare(String(y.d || '')); }); return a.length ? a[a.length - 1].four || '' : ''; }
  function texteBouton(n, m) { return (n - m > 0 ? 'Ajouter les ' + (n - m) + ' produit' + (n - m > 1 ? 's' : '') : 'Valider') + (m ? (n - m > 0 ? ' et relier ' : ' : relier ') + m + ' produit' + (m > 1 ? 's' : '') + ' déjà compté' + (m > 1 ? 's' : '') : ''); }
  /* C266 : Carte d'exemple (formule Inventaire, ou modèle de démonstration chargé dans Pilotage) : rien n'est repris. */
  /* C272 : plats du client = plats de Pilotage hors carte d'exemple (SEED_PLATS) ; sans plat à lui, rien n'est repris, quelle que soit la formule. */
  function platsPropres(F) { var V = F && F.DB; if (!V || !Array.isArray(V.plats)) return []; var ex = {}; try { (F.SEED_PLATS || []).forEach(function (s) { ex[norm(Array.isArray(s) ? s[0] : s && s.nom)] = 1; }); } catch (e) {} return V.plats.filter(function (p) { return p && p.nom && !ex[norm(p.nom)]; }); }
  function carteExemple(F) { try { if (F && typeof F.modeleDansDemonstration === 'function' && F.modeleDansDemonstration()) return true; } catch (e) { return true; } return !platsPropres(F).length; }
  function carteReprise() {
    if (demo() || equipe()) return '';
    var F = verdictF(); if (!F || carteExemple(F)) return '';
    var list = ingredientsAbsents(F); if (!list.length) return '';
    var props = propositions(list), emp = empreinte(list, props);
    var ign = ''; try { ign = localStorage.getItem(CLE_IGN + ':' + DBi().site) || ''; } catch (e) {}
    if (ign === emp) return '';
    var n = list.length, ex = list.filter(function (x) { return !props.some(function (p) { return p.ing === x.ing; }); }).slice(0, 4).map(function (x) { return x.ing.nom; }).join(', ');
    var h = '<div class="card" id="repriseVerdict" data-empreinte="' + esc(emp) + '" style="border-color:rgba(34,197,94,.45)"><h3>Votre Carte connaît ' + n + ' ingrédient' + (n > 1 ? 's' : '') + ' absent' + (n > 1 ? 's' : '') + ' de l’Inventaire</h3>' +
      (ex ? '<p class="sub" style="margin:0 0 8px">' + esc(ex) + (n - props.length > 4 ? '…' : '.') + ' Nom, unité et fournisseur sont repris de vos fiches et de vos factures ; seul un prix réel (facture, saisi par vous) est repris, jamais un prix type. Le stock idéal et le minimum restent à vous.</p>' : '');
    if (props.length) h += '<p class="sub" style="margin:0 0 6px"><b>Déjà dans votre Inventaire sous un autre nom&nbsp;?</b> Relié, le produit garde son nom et ses comptages, et le prix de ses factures va dans la fiche.</p>' + props.map(function (p, k) { return '<label style="display:flex;gap:8px;align-items:center;margin:0 0 6px"><input type="checkbox" class="c229-lien" data-k="' + k + '" checked onchange="inventaireRepriseLibelle()"> <span>« ' + esc(p.produit.name) + ' » = « ' + esc(p.ing.nom) + ' » de vos fiches</span></label>'; }).join('');
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn c229-go" onclick="inventaireRepriseVerdict()">' + esc(texteBouton(n, props.length)) + '</button><button class="btn ghost" onclick="inventaireRepriseIgnorer()">Plus tard</button></div></div>';
    return h;
  }
  w.__inventaireC229 = { propositions: propositions, ingredientsAbsents: ingredientsAbsents, prixReel: prixReel }; /* pour les tests (08-TESTS/consolidation/c229) */
  w.inventaireRepriseLibelle = function () { var n = ingredientsAbsents(verdictF()).length; [].forEach.call(doc.querySelectorAll('[id^="repriseVerdict"]'), function (c) { var m = c.querySelectorAll('.c229-lien:checked').length, b = c.querySelector('.c229-go'); if (b) b.textContent = texteBouton(n, m); }); };
  w.inventaireRepriseVerdict = function (ev) {
    var F = verdictF(), V = F && F.DB; if (!V) return;
    var list = ingredientsAbsents(F), props = propositions(list), emp = empreinte(list, props);
    var carte = null; [].forEach.call(doc.querySelectorAll('[id^="repriseVerdict"]'), function (c) { if (c.getClientRects().length) carte = c; }); carte = carte || doc.getElementById('repriseVerdict');
    /* X25 : on ajoute exactement ce qui est affiché ; si la Carte a changé depuis, la carte est redessinée d'abord. */
    if (carte && carte.getAttribute('data-empreinte') !== emp) { redessiner(); try { w.toast('Votre Carte a changé : vérifiez la liste, puis validez.'); } catch (e) {} return; }
    var coches = {}; if (carte) [].forEach.call(carte.querySelectorAll('.c229-lien'), function (cb) { if (cb.checked) coches[cb.getAttribute('data-k')] = 1; });
    var relies = 0, n = 0, lies = {};
    props.forEach(function (p, k) { if (!coches[k]) return; p.produit.ingredient = p.ing.nom; lies[norm(p.ing.nom)] = 1; relies++; });
    list.forEach(function (x) { var i = x.ing; if (lies[norm(i.nom)]) return; var t = String(i.type || '').toUpperCase(); var c = creerProduit({ name: i.nom, unit: t === 'KG' ? 'kg' : t === 'L' ? 'L' : 'pièce', price: prixReel(i, F), priceDate: i.prixSource === 'facture' ? (i.prixDate || '') : '', sup: dernierFournisseur(V, i.nom), esp: x.esp, origine: 'fiche' }); if (c) { c.p.ingredient = i.nom; n++; } });
    if (n || relies) { sauver(); try { w.toast((n ? n + (n > 1 ? ' produits ajoutés' : ' produit ajouté') : '') + (n && relies ? ', ' : '') + (relies ? relies + (relies > 1 ? ' produits reliés' : ' produit relié') : '') + ' depuis votre Carte ✓'); } catch (e) {} }
    calculerDemande(true); redessiner();
  };
  w.inventaireRepriseIgnorer = function () { var F = verdictF(), l = ingredientsAbsents(F); try { localStorage.setItem(CLE_IGN + ':' + DBi().site, empreinte(l, propositions(l))); } catch (e) {} redessiner(); };

  /* Ventes par plat (caisse) × fiches → consommation par jour de chaque produit relié. Période : les 8 dernières
     semaines si la caisse les couvre, sinon les mêmes semaines de l'an passé, sinon les 8 dernières semaines connues. */
  function iso(d) { return d.toISOString().slice(0, 10); }
  function ajoute(s, n) { var d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function choisirPeriode(dates) {
    var auj = iso(new Date()), a = ajoute(auj, -56); var dans = function (x, y) { return dates.filter(function (d) { return d >= x && d <= y; }).length; };
    if (dans(a, auj) >= 7) return { de: a, a: auj, nature: 'récentes' };
    var a1 = ajoute(auj, -365 - 28), b1 = ajoute(auj, -365 + 28); if (dans(a1, b1) >= 7) return { de: a1, a: b1, nature: 'mêmes semaines l’an passé' };
    var last = dates[dates.length - 1]; return last ? { de: ajoute(last, -55), a: last, nature: 'dernières connues' } : null;
  }
  function calculerDemande(force) {
    var F = verdictF(), V = F && F.DB, D = DBi(); if (!V || !D || demo() || equipe() || carteExemple(F)) return false;
    var ventes = Array.isArray(V.dishSales) ? V.dishSales : []; if (!ventes.length) return false;
    var prods = rows(), byNom = {}; prods.forEach(function (x) { byNom[norm(x.p.name)] = x.p; if (x.p.ingredient) byNom[norm(x.p.ingredient)] = x.p; }); if (!prods.length) return false;
    var dates = ventes.map(function (s) { return String(s.date || '').slice(0, 10); }).filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); }); dates = Array.from(new Set(dates)).sort();
    var P = choisirPeriode(dates); if (!P) return false;
    var plats = {}; (V.plats || []).forEach(function (p) { if (p && p.nom) plats[norm(p.nom)] = p; });
    var ing = {}; (V.ing || []).forEach(function (i) { if (i && i.nom) ing[norm(i.nom)] = i; });
    var fp = [P.de, P.a, ventes.length, dates[dates.length - 1], prods.map(function (x) { return x.p.id + ':' + norm(x.p.name) + ':' + norm(x.p.unit); }).join(','), (V.plats || []).map(function (p) { return norm(p.nom) + JSON.stringify(p.rec || []); }).join(';').length].join('#');
    var old = D.demandBridge; if (!force && old && old.c217 === fp) return false;
    var obs = {}, tot = 0, couvert = 0;
    ventes.forEach(function (s) {
      var d = String(s.date || '').slice(0, 10); if (d < P.de || d > P.a) return; var q = Number(s.qte) || 0; if (!(q > 0)) return; tot += q;
      var pl = plats[norm(s.article)]; if (!pl || !(pl.rec || []).length) return; couvert += q;
      (pl.rec || []).forEach(function (r) {
        var nom = Array.isArray(r) ? r[0] : r && (r.nom || r.name), qr = Number(Array.isArray(r) ? r[1] : r && (r.qte != null ? r.qte : r.quantity)); if (!nom || !(qr > 0)) return;
        var p = byNom[norm(nom)], i = ing[norm(nom)]; if (!p || !i) return;
        var t = String(i.type || '').toUpperCase(), base = t === 'KG' ? ['m', 0.001] : t === 'L' ? ['v', 0.001] : ['p', 1]; /* fiches : grammes, millilitres ou pièces */
        var pd = dim(p.unit) || (!String(p.unit || '').trim() ? ['p', 1] : null); if (!pd || pd[0] !== base[0]) return;
        var perte = Number(i.perte) > 0 && Number(i.perte) < 90 ? Number(i.perte) / 100 : 0;
        var x = q * qr * base[1] / pd[1] / (1 - perte);
        obs[p.id] = obs[p.id] || {}; obs[p.id][d] = (obs[p.id][d] || 0) + x;
      });
    });
    var cov = tot ? couvert / tot : 0;
    var products = Object.keys(obs).map(function (id) { var o = obs[id]; return { id: id, observations: Object.keys(o).sort().map(function (d) { return { date: d, qty: Math.round(o[d] * 1000) / 1000, exceptional: 'normal', source: 'verdict-caisse-fiches' }; }), recipeCoverage: Math.round(cov * 1000) / 1000, onOrder: 0, reviewDays: 7 }; });
    D.demandBridge = { c217: fp, source: 'verdict-caisse-fiches', generatedAt: new Date().toISOString(), periode: P, recipeCoverage: Math.round(cov * 1000) / 1000, products: products };
    sauver(); return true;
  }
  w.inventaireCalculerDemande = calculerDemande;
  function repriseEtDemande() { if (calculerDemande(false)) redessiner(); }

  /* ── W65 · « Rapprocher un produit » : choisir le produit suffit. L'appli remplit ce qu'elle sait déjà (période et stocks
     des deux derniers comptages, réceptions, prix) ; elle met 0 seulement quand elle sait qu'aucun mouvement n'est
     enregistré, et laisse vide ce qu'elle ignore. La case « J'ai vérifié… » reste à cocher par la personne. ── */
  function dansPeriode(d, a, b) { d = String(d || '').slice(0, 10); return d && d >= String(a).slice(0, 10) && d <= String(b).slice(0, 10); }
  function remplirRapprochement(form, id) {
    var x = produitParId(id); if (!x) return; var p = x.p, D = DBi(), M = null, mis = [];
    try { M = w.inventaireDonneesMatiere(); } catch (e) { M = null; }
    function set(n, v) { var el = form.querySelector('[name="' + n + '"]'); if (!el || v == null || v === '') return; el.value = String(v); mis.push(n); }
    set('label', p.name + ' · ' + (p.unit || 'unités'));
    var pr = null; try { pr = w.px(p); } catch (e) {} if (pr != null && pr > 0) set('price', Math.round(pr * 10000) / 10000);
    if (M && M.statut === 'ok') {
      var a = (M.lignesA || []).filter(function (l) { return l && l.id === id; })[0], b = (M.lignesB || []).filter(function (l) { return l && l.id === id; })[0];
      set('from', String(M.debut).slice(0, 10)); set('to', String(M.fin).slice(0, 10));
      if (a && a.qty != null) set('opening', a.qty); if (b && b.qty != null) set('closing', b.qty);
      var rec = (M.receptions || []).filter(function (r) { return r.productId === id; }).reduce(function (s, r) { return s + (Number(r.qty) || 0); }, 0);
      set('receipts', Math.round(rec * 1000) / 1000);
      var tr = (D.physicalTransfers || []).some(function (t) { var j = JSON.stringify(t); return j.indexOf('"' + id + '"') >= 0 && dansPeriode(t.dispatchedAt || t.createdAt || t.recordedAt || t.date, M.debut, M.fin); });
      if (!tr) { set('transfersIn', 0); set('transfersOut', 0); }
      var ret = 0, retConnu = true; (D.purchaseOrders || []).forEach(function (o) { (o.lines || []).forEach(function (l) { if ((l.productId || (l.p && l.p.id)) === id && Number(l.returnedQty) > 0) { if (dansPeriode(o.receivedAt || o.updatedAt, M.debut, M.fin)) ret += Number(l.returnedQty); else retConnu = retConnu && true; } }); });
      set('returns', Math.round(ret * 1000) / 1000);
      if (!verdictF()) { set('waste', 0); set('offered', 0); }
      var B = D.demandBridge, o = B && (B.products || []).filter(function (q) { return q.id === id; })[0];
      if (o && Number(B.recipeCoverage) >= 0.5) { var obs = (o.observations || []).filter(function (q) { return dansPeriode(q.date, M.debut, M.fin); }); if (obs.length) set('theoretical', Math.round(obs.reduce(function (s, q) { return s + q.qty; }, 0) * 1000) / 1000); }
      set('source', 'Comptages du ' + jj(M.debut) + ' et du ' + jj(M.fin) + (rec ? ' · réceptions enregistrées' : ' · aucune réception enregistrée') + (tr ? '' : ' · aucun transfert enregistré'));
    } else if (p.stock != null && p.stock !== '') {
      set('closing', p.stock);
    }
    var aide = form.querySelector('.c217-aide'); if (aide) aide.textContent = M && M.statut === 'ok' ? 'Rempli depuis vos deux derniers comptages : vérifiez puis complétez les cases restées vides.' : 'Deux comptages enregistrés suffisent pour que le stock de début, le stock de fin et les réceptions se remplissent seuls.';
    try { form.dispatchEvent(new w.Event('input', { bubbles: true })); var last = form.querySelector('[name="' + (mis[mis.length - 1] || 'label') + '"]'); if (last) last.dispatchEvent(new w.Event('input', { bubbles: true })); } catch (e) {}
  }
  function aideRapprocher() {
    var form = doc.querySelector('#vc-main form[data-vc-form="check"]'); if (!form || form.querySelector('.c217-choix')) return;
    var lab = form.querySelector('input[name="label"]'); if (!lab) return;
    var prods = rows().map(function (x) { return x.p; }); if (!prods.length) return;
    var box = doc.createElement('label'); box.className = 'c217-choix'; box.style.display = 'block'; box.style.marginBottom = '10px';
    box.innerHTML = '<span>Produit de l’Inventaire</span><select class="c217-prod" style="min-height:44px;width:100%;font:inherit;font-size:15px;padding:8px 10px;border-radius:12px;border:1px solid var(--line,#cbd5dc);background:var(--card,#fff);color:inherit"><option value="">Choisir un produit…</option>' + prods.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + (p.unit ? ' · ' + esc(p.unit) : '') + '</option>'; }).join('') + '</select><small class="c217-aide" style="display:block;margin-top:4px">Choisissez le produit : l’appli remplit ce qu’elle sait déjà.</small>';
    form.insertBefore(box, form.firstChild);
    box.querySelector('select').addEventListener('change', function () { if (this.value) remplirRapprochement(form, this.value); });
  }
  w.inventaireRemplirRapprochement = function (id) { var f = doc.querySelector('#vc-main form[data-vc-form="check"]'); if (f) remplirRapprochement(f, id); };
  try { new MutationObserver(function () { if (doc.getElementById('vc-main') && !doc.querySelector('#vc-main .c217-choix')) aideRapprocher(); }).observe(doc.body || doc.documentElement, { childList: true, subtree: true }); } catch (e) {}

  /* ── C229 (X36) · « Le même inventaire pour votre équipe » : le vrai lien, par le compte (le portail R32 n'existe plus) ── */
  w.inventairePartagerEquipe = function () {
    var old = doc.getElementById('equipeSheet'); if (old) old.remove();
    var etab = ''; try { if (w.VerdictSyncEspaceInv && w.VerdictSyncEspaceInv.actif()) etab = (w.VerdictSyncEspaceInv.etabActif && w.VerdictSyncEspaceInv.etabActif()) || w.VerdictSyncEspaceInv.ancre() || ''; } catch (e) {}/* C295 : l'établissement affiché, plus le premier */
    var racine = new URL('../../', location.href), lien = etab ? new URL('?module=inventory&equipe=' + encodeURIComponent(etab), racine).href : '';
    var o = doc.createElement('div'); o.id = 'equipeSheet'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.style.cssText = 'position:fixed;inset:0;z-index:2147482500;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,14,20,.5);padding:12px;box-sizing:border-box';
    var s = 'width:min(560px,100%);max-height:calc(100vh - 24px);overflow:auto;background:var(--card,#fff);color:inherit;border-radius:20px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.35);font:inherit';
    var b = 'display:block;width:100%;margin-top:8px;padding:13px;border-radius:12px;font-weight:800;font-size:15px;cursor:pointer;';
    var h = '<div style="' + s + '"><h3 style="margin:0 0 8px">Le même inventaire pour votre équipe</h3><p class="sub" style="margin:0 0 10px">Votre équipe compte avec son propre compte Verdict, gratuit. Elle ne voit que l’Inventaire : jamais Pilotage, la Carte ni vos chiffres ; les prix et les fournisseurs seulement si vous le décidez.</p>';
    if (lien) h += '<ol style="margin:0 0 10px;padding-left:20px;line-height:1.5"><li>Votre employé crée son compte Verdict.</li><li>Dans <b>Compte › Équipe et établissements</b>, ajoutez son adresse et choisissez son rôle : <b>Employé de comptage</b> (voit ce qu’il y a à compter, sans prix) ou <b>Chef</b> / <b>Responsable bar</b> (compte et enregistre dans votre inventaire).</li><li>Donnez-lui ce lien : il ouvre l’Inventaire seul.</li></ol><input id="equipeLien" readonly value="' + esc(lien) + '" style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid var(--line,#cbd5dc);font:inherit;font-size:13px"><button type="button" id="equipeCopier" class="btn" style="' + b + '">Copier le lien</button><button type="button" id="equipeCompte" class="btn ghost" style="' + b + '">Ouvrir Compte › Équipe</button>';
    else h += '<p class="sub" style="margin:0 0 10px">Créez d’abord votre compte : votre Inventaire y est rattaché, et le lien de l’équipe s’en sert. Rien n’est perdu sur cet appareil.</p><button type="button" id="equipeCreer" class="btn" style="' + b + '">Créer mon compte</button>';
    h += '<button type="button" id="equipeFermer" class="btn ghost" style="' + b + '">Fermer</button></div>';
    o.innerHTML = h; doc.body.appendChild(o);
    var fermer = function () { o.remove(); };
    o.addEventListener('click', function (e) { if (e.target === o) fermer(); });
    doc.getElementById('equipeFermer').onclick = fermer;
    var cp = doc.getElementById('equipeCopier'); if (cp) cp.onclick = function () { var v = doc.getElementById('equipeLien').value; var ok = function () { cp.textContent = 'Lien copié ✓'; }; try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(ok, function () { doc.getElementById('equipeLien').select(); }); else { doc.getElementById('equipeLien').select(); doc.execCommand('copy'); ok(); } } catch (e) { doc.getElementById('equipeLien').select(); } };
    var ac = doc.getElementById('equipeCompte'); if (ac) ac.onclick = function () { try { (w.top || w).location.href = new URL('account.html#workspace-panel', racine).href; } catch (e) {} };
    var cr = doc.getElementById('equipeCreer'); if (cr) cr.onclick = function () { try { (w.top || w).location.href = new URL('account.html?mode=register&return=app', racine).href; } catch (e) {} };
  };

  /* ── C229 (X36) · comptage de l'équipe : « Terminer le comptage » l'envoie au compte de l'établissement ; d'ici là, les
     quantités saisies restent sur cet onglet (rien n'est perdu au rechargement, rien n'est écrit sur l'appareil au-delà de l'onglet). ── */
  function equipeLien() { return !!g('EQUIPE_ETAB'); }
  function cleComptage() { return 'verdict:equipe:comptage:' + (g('EQUIPE_ETAB') || ''); }
  function noterComptage() { if (!equipeLien()) return; var m = {}; rows().forEach(function (x) { if (x.p.stock != null && x.p.stock !== '') m[x.p.id] = [x.p.stock, x.p.countedAt || '']; }); try { sessionStorage.setItem(cleComptage(), JSON.stringify(m)); } catch (e) {} }
  function reprendreComptage() { if (!equipeLien() || !g('AUTHED')) return; var m = null; try { m = JSON.parse(sessionStorage.getItem(cleComptage()) || 'null'); } catch (e) {} if (!m) return; var n = 0; rows().forEach(function (x) { var v = m[x.p.id]; if (v && x.p.stock !== v[0]) { x.p.stock = v[0]; x.p.countedAt = v[1] || new Date().toISOString(); n++; } }); if (n) redessiner(); }
  function nbInstantanes() { var D = DBi(); return (D && D.snapshots || []).length; }
  /* C253 : « avant » = nombre d'instantanés lu avant finishCount (comptage complet : l'instantané est ajouté pendant l'appel ;
     partiel : après la question « Enregistrer ce comptage ? »). Envoi dès qu'un nouvel instantané existe. */
  /* C323 (T3 n° 23) : le comptage envoyé porte le prénom de l'employé (sinon le responsable ne sait pas qui a compté et la cloche
     ne peut rien dire) : prénom de cet appareil, sinon le champ « Inventaire réalisé par », sinon demandé une fois. */
  function nomEquipe() {
    var n = ''; try { n = typeof w.equipeNom === 'function' ? w.equipeNom() : ''; } catch (e) {}
    if (!n) { try { n = localStorage.getItem('verdict:equipe:prenom:v1') || ''; } catch (e) {} }
    if (!n) { var f = doc.getElementById('countActor'); if (f && f.value) n = f.value.trim(); }
    if (!n) { try { n = String(w.prompt('Votre prénom : votre responsable verra qui a compté.', '') || '').trim().slice(0, 80); } catch (e) {} }
    if (n) { try { if (typeof w.equipeNom === 'function') w.equipeNom(n); localStorage.setItem('verdict:equipe:prenom:v1', n); } catch (e) {} try { var D = DBi(); if (D) { D.profile = D.profile || {}; D.profile.prenom = n; } } catch (e) {} }
    return n;
  }
  function signer() { var n = nomEquipe() || 'Équipe', lim = Date.now() - 36 * 3600000; rows().forEach(function (x) { var p = x.p, at = Date.parse(p.countedAt || ''); if (p.stock != null && p.stock !== '' && isFinite(at) && at >= lim && !String(p.countedBy || '').trim()) p.countedBy = n; }); }
  function envoyerComptage(avantAppel) {
    if (!equipeLien() || typeof w.staffSubmitForReview !== 'function') return;
    var avant = typeof avantAppel === 'number' ? avantAppel : nbInstantanes(), essais = 0;
    (function attendre() {
      if (nbInstantanes() > avant) { signer(); w.staffSubmitForReview(0); return; }   /* nouveau comptage enregistré : envoi (C323 : signé) */
      var q = doc.getElementById('mAsk'), ouverte = !!(q && q.classList.contains('on'));
      if (ouverte) { if (essais++ < 600) setTimeout(attendre, 300); return; }   /* « Enregistrer ce comptage ? » : on attend la réponse */
      /* rien de nouveau, aucune question : comptage déjà enregistré (ou annulé). Renvoyé seulement si son envoi avait échoué. */
      if (essais === 0 && w.__c253NonEnvoye) { signer(); w.staffSubmitForReview(0); }
    })();
  }
  function equipeResultat() {
    var o = w.staffSubmissionResult; if (typeof o !== 'function' || o.__c229) return;
    var f = function (r) { try { o.apply(this, arguments); } catch (e) {} if (!equipeLien()) return; if (r && r.ok) { w.__c253NonEnvoye = false; try { sessionStorage.removeItem(cleComptage()); } catch (e) {} try { w.toast('Comptage envoyé à votre responsable ✓'); } catch (e) {} } else { w.__c253NonEnvoye = true; } if (!(r && r.ok) && !w.__equipeAvis) { try { w.toast((r && r.error) || 'Envoi impossible pour l’instant : votre comptage reste sur cet appareil.'); } catch (e) {} } };
    f.__c229 = true; w.staffSubmissionResult = f;
  }

  /* ── Branchements : Compter (reprise), Analyse (factures, Pilotage à la demande), rien d'autre ── */
  /* C253 : « avant » (facultatif) est lu avant l'appel et transmis à « apres ». */
  function envelopper(nom, apres, avant) { var o = w[nom]; if (typeof o !== 'function' || o.__c217) return; var f = function () { var b; try { b = avant ? avant() : undefined; } catch (e) {} var r = o.apply(this, arguments); try { apres(b); } catch (e) {} return r; }; f.__c217 = true; w[nom] = f; }
  /* La carte se pose en tête de Compter (sous « Que faut-il faire maintenant ? ») et de Plus (la liste des produits). */
  function poserReprise() {
    var h = carteReprise();
    ['v-count', 'v-prod'].forEach(function (vid) {
      var host = doc.getElementById(vid); if (!host) return;
      var id = 'repriseVerdict' + (vid === 'v-prod' ? '-prod' : ''), old = doc.getElementById(id);
      if (!h) { if (old) old.remove(); return; }
      var hh = h.replace('id="repriseVerdict"', 'id="' + id + '"'); if (old && old.outerHTML === hh) return;
      var t = doc.createElement('div'); t.innerHTML = hh; var el = t.firstChild;
      /* C248 : jamais de saut d'écran : à sa place si l'écran est déjà affiché, sinon en tête (sous « Que faut-il faire maintenant ? »). */
      var affiche = host.classList.contains('on') && doc.visibilityState === 'visible' && host.getClientRects().length && (w.performance ? w.performance.now() > 1500 : true);
      if (old) old.replaceWith(el); else if (affiche) host.appendChild(el); else { var pinv = doc.getElementById('pinv'); if (vid === 'v-count' && pinv && pinv.parentNode === host) pinv.after(el); else host.insertBefore(el, host.firstChild); }
    });
  }
  function installer() {
    envelopperFactures(); envelopperValidation();
    envelopper('drawCount', poserReprise); envelopper('drawProd', poserReprise);
    envelopper('drawStats', function () { if (!verdictF()) verdictDemande(); });
    envelopper('setStock', noterComptage); envelopper('commitStockEdit', noterComptage); envelopper('firstRun', reprendreComptage); envelopper('finishCount', envoyerComptage, nbInstantanes); equipeResultat();
  }
  installer(); w.addEventListener('load', function () { installer(); setTimeout(function () { try { poserReprise(); repriseEtDemande(); } catch (e) {} }, 1500); /* C229 (X31) : Pilotage n'est préparé qu'une fois l'Inventaire affiché et l'appareil au repos (jamais pendant l'ouverture). */ var auRepos = w.requestIdleCallback || function (f) { return setTimeout(f, 1); }; setTimeout(function () { auRepos(function () { try { verdictDemande(); } catch (e) {} }, { timeout: 15000 }); }, 6000); });
  /* Le cadre Pilotage peut arriver après l'Inventaire : on vérifie quelques fois, sans boucle permanente. */
  var essais = 0; (function attendre() { if (verdictF()) { envelopperValidation(); try { poserReprise(); repriseEtDemande(); } catch (e) {} return; } if (essais++ < 20) setTimeout(attendre, 1500); })();
})(window);
