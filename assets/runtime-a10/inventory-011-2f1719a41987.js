
/* Contrat Brasserie Collet partagé par Inventaire et Verdict.
   Cette fixture est entièrement fictive. Les 51 noms, unités et prix viennent
   du modèle Brasserie Verdict 2026 ; la dernière valeur de stock (17 350 € HT)
   est la même dans les deux applications. Le score reste calculé par Verdict. */
(function(global){
  'use strict';
  var references=[
    ['Œuf frais calibre M','UNITE',0.28,'cuisine'],
    ['Mayonnaise seau 5 L','KG',3.6,'cuisine'],
    ['Salade iceberg','KG',2.1,'cuisine'],
    ['Oignon jaune','KG',1.25,'cuisine'],
    ['Bouillon de volaille','KG',8.5,'cuisine'],
    ['Emmental râpé','KG',8.2,'cuisine'],
    ['Pain de campagne tranché','KG',3.6,'cuisine'],
    ['Beurre doux plaquette','KG',10.8,'cuisine'],
    ['Mesclun','KG',8.9,'cuisine'],
    ['Bûche de chèvre','KG',11.5,'cuisine'],
    ['Miel toutes fleurs','KG',8.5,'cuisine'],
    ['Tomate ronde','KG',3.2,'cuisine'],
    ["Huile d'olive vierge extra",'L',8.5,'cuisine'],
    ['Huîtres n°3 (pièce)','UNITE',0.78,'cuisine'],
    ['Citron','KG',2.6,'cuisine'],
    ['Cuisse de poulet','KG',4.2,'cuisine'],
    ['Pomme de terre','KG',1.25,'cuisine'],
    ['Carotte','KG',1.2,'cuisine'],
    ['Champignon de Paris','KG',4.5,'cuisine'],
    ['Fond de veau déshydraté','KG',14,'cuisine'],
    ['Crème liquide 35%','L',4.6,'cuisine'],
    ['Echine de porc','KG',7.6,'cuisine'],
    ['Entrecôte VBF','KG',22.5,'cuisine'],
    ['Huile de friture','L',2.3,'cuisine'],
    ['Échalote','KG',3.2,'cuisine'],
    ['Bœuf haché frais 15%','KG',10.9,'cuisine'],
    ['Moutarde de Dijon','KG',3.4,'cuisine'],
    ['Moules de bouchot (poids acheté)','KG',4.2,'cuisine'],
    ['Vin de pays BIB (litre)','L',3.2,'bar'],
    ['Filet de saumon frais','KG',15.5,'cuisine'],
    ['Riz long grain','KG',1.9,'cuisine'],
    ['Courgette','KG',2.4,'cuisine'],
    ['Pain burger brioché','UNITE',0.42,'cuisine'],
    ['Comté AOP 12 mois','KG',16.5,'cuisine'],
    ['Filet de poulet','KG',8.4,'cuisine'],
    ['Parmesan AOP','KG',19.5,'cuisine'],
    ['Jambon blanc supérieur','KG',9.4,'cuisine'],
    ['Lait entier UHT','L',1.15,'cuisine'],
    ['Roquefort AOP','KG',21,'cuisine'],
    ['Sucre semoule','KG',1.3,'cuisine'],
    ['Gousse de vanille','UNITE',4.5,'cuisine'],
    ['Appareil à choux (base)','KG',3.9,'cuisine'],
    ['Glace / sorbet artisanal','L',6.5,'cuisine'],
    ['Chocolat noir 55%','KG',8.9,'cuisine'],
    ['Café en grains','KG',14.5,'bar'],
    ['Pomme','KG',2.2,'cuisine'],
    ['Bière blonde fût 30 L','L',2.55,'bar'],
    ['Vin bouteille milieu de gamme','UNITE',11.5,'bar'],
    ['Pastis 1 L','L',15,'bar'],
    ['Soda 33 cl','UNITE',0.62,'bar'],
    ['Eau plate 1 L verre','UNITE',0.75,'bar']
  ];
  var REEL={"Œuf frais calibre M": [0, 240, 90, 30], "Mayonnaise seau 5 L": [10, 10, 5, 5], "Salade iceberg": [6, 8, 3, 2], "Oignon jaune": [15, 15, 5, 5], "Bouillon de volaille": [2, 2, 1, 1], "Emmental râpé": [5, 5, 2, 1], "Pain de campagne tranché": [6, 6, 2, 1], "Beurre doux plaquette": [6, 6, 2, 1], "Mesclun": [2, 2, 0.5, 0.5], "Bûche de chèvre": [3, 3, 1, 1], "Miel toutes fleurs": [2, 2, 1, 1], "Tomate ronde": [10, 10, 4, 5], "Huile d'olive vierge extra": [5, 5, 2, 1], "Huîtres n°3 (pièce)": [96, 144, 48, 48], "Citron": [5, 5, 2, 1], "Cuisse de poulet": [12, 12, 5, 5], "Pomme de terre": [50, 75, 25, 25], "Carotte": [10, 10, 4, 5], "Champignon de Paris": [4, 4, 2, 2], "Fond de veau déshydraté": [2.25, 2.25, 0.75, 0.75], "Crème liquide 35%": [6, 12, 6, 6], "Echine de porc": [8, 8, 3, 2], "Entrecôte VBF": [12, 15, 6, 4], "Huile de friture": [40, 40, 10, 10], "Échalote": [5, 5, 2, 5], "Bœuf haché frais 15%": [8, 8, 3, 1], "Moutarde de Dijon": [5, 5, 1, 1], "Moules de bouchot (poids acheté)": [15, 20, 10, 5], "Vin de pays BIB (litre)": [40, 40, 15, 10], "Filet de saumon frais": [4.5, 6, 3, 1.5], "Riz long grain": [10, 10, 5, 5], "Courgette": [6, 6, 2, 5], "Pain burger brioché": [48, 60, 24, 12], "Comté AOP 12 mois": [3, 3, 1, 1], "Filet de poulet": [8, 8, 3, 2], "Parmesan AOP": [2, 2, 0.5, 1], "Jambon blanc supérieur": [5, 5, 2, 1], "Lait entier UHT": [18, 24, 6, 6], "Roquefort AOP": [1.5, 1.5, 0.5, 0.5], "Sucre semoule": [10, 10, 3, 1], "Gousse de vanille": [20, 20, 6, 10], "Appareil à choux (base)": [5, 5, 2, 1], "Glace / sorbet artisanal": [20, 20, 8, 5], "Chocolat noir 55%": [5, 5, 1, 1], "Café en grains": [10, 12, 4, 6], "Pomme": [6, 6, 2, 1], "Bière blonde fût 30 L": [150, 150, 60, 30], "Vin bouteille milieu de gamme": [300, 300, 120, 6], "Pastis 1 L": [8, 8, 3, 1], "Soda 33 cl": [192, 240, 96, 24], "Eau plate 1 L verre": [120, 120, 48, 12]};/* V2-A6 · quantités réalistes par référence : [stock compté, stock idéal, alerte, colisage fournisseur]. Colisages courants en restauration (bourriche de 48 huîtres, sac de 25 kg de pommes de terre, bidon de 10 L d’huile, boîte de 750 g de fond, fût de 30 L…). Seuls les produits frais sont sous leur niveau idéal. */
  var ID='demo-brasserie',NAME='Brasserie Collet',STOCK=17350,PREVIOUS_STOCK=16601;

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function round(value,decimals){var p=Math.pow(10,decimals==null?2:decimals);return Math.round((Number(value)||0)*p)/p;}
  function isoDate(date){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
  function supplierFor(name){
    name=String(name||'');
    if(/huître|moule|saumon/i.test(name))return 'Marée Centrale';
    if(/poulet|porc|entrecôte|b(?:oe|œ)uf|jambon/i.test(name))return 'Maison Viandes';
    if(/bière/i.test(name))return 'Brasseur Régional';
    if(/vin|pastis/i.test(name))return 'Cave Distribution';
    if(/soda|eau plate/i.test(name))return 'Boissons Services';
    if(/café/i.test(name))return 'Torréfacteur Local';
    if(/beurre|crème|lait|emmental|chèvre|comté|parmesan|roquefort|glace/i.test(name))return 'Crèmerie Pro';
    if(/salade|oignon|mesclun|tomate|citron|pomme|carotte|champignon|échalote|courgette/i.test(name))return 'Primeur du Marché';
    return 'Épicerie Centrale';
  }
  function productRows(spaces){var out=[];['cuisine','bar'].forEach(function(space){(spaces[space].products||[]).forEach(function(p){out.push({space:space,p:p});});});return out;}
  function stockValue(spaces){var t=0;Object.keys(spaces||{}).forEach(function(k){(spaces[k].products||[]).forEach(function(p){t+=(Number(p.stock)||0)*(Number(p.price)||0);});});return round(t,2);}/* R239 */
  function createSpaces(){
    var weighted=[],weightTotal=0;
    references.forEach(function(ref,index){var weight=index===0?0:(.82+(index%7)*.13+(ref[3]==='bar'?.22:0));weightTotal+=weight;weighted.push({ref:ref,index:index,weight:weight});});
    var spaces={cuisine:{products:[]},bar:{products:[]}};
    weighted.forEach(function(item){
      var ref=item.ref,price=Number(ref[2])||0,observed=item.index===0?0:round(STOCK*item.weight/weightTotal/price,6);/* R239 : quantité lisible (pièce entière, sinon 2 décimales), identique dans Inventaire et Verdict */observed=ref[1]==='UNITE'?Math.round(observed):round(observed,2);
      var needsOrder=item.index===0||item.index%6===0,goal=item.index===0?240:round(observed*(needsOrder?1.34:.82),2),minimum=item.index===0?80:round(goal*(needsOrder?.58:.32),2);
      var pack=ref[1]==='UNITE'?(item.index%2?12:6):(item.index%3===0?5:(item.index%3===1?2:1));
      var RR=REEL[ref[0]];if(RR){observed=RR[0];goal=RR[1];minimum=RR[2];pack=RR[3];}
      var p={id:'brasserie-ref-'+String(item.index+1).padStart(2,'0'),name:ref[0],sup:supplierFor(ref[0]),unit:ref[1].toLowerCase(),goal:goal,min:minimum,price:price,stock:observed,pack:pack,minOrder:0,
        leadDays:/Marée|Viandes/.test(supplierFor(ref[0]))?1:2,shelfLifeDays:/huître|moule|saumon|salade|mesclun/i.test(ref[0])?3:14,sku:'BC-'+String(item.index+1).padStart(3,'0'),priceDate:'2026-08-25',offers:[],over:{},demo:true,source:'verdict-brasserie-2026'};
      if(ref[3]==='bar'){p.category=/bière/i.test(ref[0])?'Bières':(/vin/i.test(ref[0])?'Vins':(/pastis/i.test(ref[0])?'Spiritueux':(/café/i.test(ref[0])?'Café':'Softs')));p.countMode=/unite/i.test(ref[1])?'unit':(/bière/i.test(ref[0])?'keg':(/café/i.test(ref[0])?'weight':'volume'));p.portionSize=/bière/i.test(ref[0])?.25:(/café/i.test(ref[0])?.008:1);p.portionLabel=/bière/i.test(ref[0])?'pressions 25 cl':(/café/i.test(ref[0])?'cafés 8 g':'unités de service');}
      spaces[ref[3]||'cuisine'].products.push(p);item.product=p;
    });
    /* V2-A6 : plus d’ajustement d’une quantité pour tomber sur un montant cible : la valeur du stock est la somme réelle des quantités comptées. */
    return spaces;
  }
  function createDemand(spaces,now){
    var products=[];now=now instanceof Date?now:new Date();
    ['cuisine','bar'].forEach(function(space){(spaces[space].products||[]).slice(0,space==='cuisine'?9:3).forEach(function(p,pi){var observations=[];for(var d=14;d>=1;d--){var at=new Date(now.getFullYear(),now.getMonth(),now.getDate()-d,12);observations.push({date:isoDate(at),qty:round(Math.max(1,p.goal/7)*(1+((d+pi)%5-2)*.06),3),exceptional:'normal',source:'verdict-demo-sales-recipes'});}products.push({id:p.id,onOrder:0,reviewDays:7,safetyDays:1,recipeCoverage:1,observations:observations});});});
    return {source:'verdict-demo-sales-recipes',products:products};
  }
  function demoReportMoment(now){var at=new Date(now.getFullYear(),now.getMonth(),now.getDate()-1,23,4,0,0);return at.toISOString();}
  function createSupplierProfiles(spaces){var out={};productRows(spaces).forEach(function(row){var name=row.p.sup,key=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();if(!out[key])out[key]={id:'demo-'+key.replace(/ /g,'-'),name:name,channel:'other',verified:false,verifiedAt:'',rules:[],note:'Horaire fictif à confirmer avec le fournisseur.',freeShippingFrom:0,deliveryFee:0};});Object.keys(out).sort().forEach(function(key,index){var day=1+(index%5);out[key].rules=[{id:'demo-rule-'+String(index+1),label:'Passage fictif à confirmer',orderDay:day,cutoff:index%2?'15:00':'11:30',deliveryDay:day===5?6:day+1,deliveryStart:'05:00',deliveryEnd:'08:00',validFrom:'',validTo:'',active:true}];});return out;}
  function createDatabase(now){
    now=now instanceof Date?now:new Date();var spaces=createSpaces(),rows=productRows(spaces),fingerprint=rows.map(function(x){return x.space+':'+x.p.id+':'+x.p.stock+':'+x.p.price;}).join('|');
    var stockEur=round(rows.reduce(function(t,x){return t+(Number(x.p.stock)||0)*(Number(x.p.price)||0);},0),2);/* R239 : valeur = somme réelle des quantités arrondies */
    var previous=new Date(now.getFullYear(),now.getMonth()-1,1,12),tomorrow=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,12),receivedAt=new Date(now.getTime()-172800000),database={schema:2,site:ID,space:'cuisine',spaces:spaces,meta:{cuisine:{name:'Cuisine',emo:'🍳',site:ID,kind:'cuisine'},bar:{name:'Bar',emo:'🍸',site:ID,kind:'bar'}},list:['cuisine','bar'],sites:{},siteList:[ID],level:'normale',profile:{done:true,prenom:''},snapshots:[],priceHistory:[],vdPrecBySite:{},demandBridge:createDemand(spaces,now),operationsBySite:{},suppliersBySite:{},needs:[],purchaseOrders:[],supplyIncidents:[],demoOrderingSeed:0,_demo:{fictional:true,persistent:false,establishmentId:ID}};
    database.sites[ID]={name:NAME,emo:'🏪',zones:['cuisine','bar'],establishmentId:ID};database.suppliersBySite[ID]=createSupplierProfiles(spaces);
    database.snapshots=[{id:'demo-stock-previous',site:ID,date:previous.toISOString(),eur:PREVIOUS_STOCK,counted:51,total:51,coverage:100,exact:true,fingerprint:'demo-previous'},{id:'demo-stock-current',site:ID,date:now.toISOString(),eur:stockEur,counted:51,total:51,coverage:100,exact:true,fingerprint:fingerprint}];
    database.vdPrecBySite[ID]={eur:stockEur,date:isoDate(now).slice(0,7),countedAt:isoDate(now),fingerprint:fingerprint,previousEur:PREVIOUS_STOCK,previousDate:isoDate(previous)};
    database.needs=[{id:'need_demo_oeuf',site:ID,space:'cuisine',productId:'brasserie-ref-01',qtyBase:240,requiredDate:isoDate(tomorrow),note:'Rupture constatée avant le service',status:'open',createdAt:now.toISOString()}];
    database.purchaseOrders=[{id:'po_demo_received',site:ID,supplier:'Brasseur Régional',status:'received',createdAt:receivedAt.toISOString(),updatedAt:receivedAt.toISOString(),cutoffAt:'',deliveryAt:'',deliveryEndAt:'',estimatedTotal:153,lines:[{site:ID,space:'bar',productId:'brasserie-ref-47',name:'Bière blonde fût 30 L',sku:'BC-047',unit:'l',quantity:60,receivedQty:60,pack:5,packages:12,price:2.55,priceDate:isoDate(now),sourceNeedIds:[]}]}];
    database.supplyIncidents=[{id:'demo-incident-rupture',site:ID,space:'cuisine',productId:'brasserie-ref-01',productName:'Œuf frais calibre M',status:'awaiting-decision',actorName:'Greg',reportedAt:now.toISOString(),requiredAt:isoDate(now)+'T12:00:00',availability:'unconfirmed',urgentCoverage:'store-purchase-to-decide',replenishmentStatus:'prepared'}];
    database.demoContract={version:'1.1.0',establishmentId:ID,references:51,stockFinalHT:stockValue(createSpaces()),previousStockHT:PREVIOUS_STOCK,scoreAuthority:'verdict-engine'};
    return database;
  }
  function createOperationsSnapshot(api,now){
    if(!api||typeof api.buildInventorySnapshot!=='function')return null;now=now instanceof Date?now:new Date();var db=createDatabase(now),snapshot=api.buildInventorySnapshot(db,{siteId:ID,demo:true,now:now});
    var rows=productRows(db.spaces),rupture=rows[0].p,need=rows.filter(function(x){return x.p.stock<x.p.goal;})[1]||rows[0],qty=Math.ceil(Math.max(0,need.p.goal-need.p.stock)/need.p.pack)*need.p.pack;
    snapshot.incidents=[{id:'demo-incident-rupture',productId:rupture.id,productName:rupture.name,space:'cuisine',status:'open',open:true,actorName:'Greg',reportedAt:now.toISOString(),requiredAt:isoDate(now),quantity:rupture.goal,unit:rupture.unit,supplier:rupture.sup,cutoffAt:'',deliveryAt:'',scheduleVerified:false,availability:'unconfirmed',availabilityEvidence:'',urgentCoverage:'store-purchase-to-decide',replenishmentStatus:'prepared'}];
    snapshot.orders=[{id:'demo-order-prepared',status:'prepared',supplier:need.p.sup,createdAt:now.toISOString(),updatedAt:now.toISOString(),cutoffAt:'',deliveryAt:'',deliveryEndAt:'',requiredAt:isoDate(now),estimatedTotal:round(qty*need.p.price,2),lines:[{productId:need.p.id,name:need.p.name,space:need.space,sku:need.p.sku,unit:need.p.unit,quantity:qty,receivedQuantity:0,packages:Math.ceil(qty/need.p.pack),requiredAt:isoDate(now)}],scheduleVerified:false,supplierConfirmation:'unconfirmed',statusEvidence:'computed-plan',availability:'unconfirmed',availabilityEvidence:''},
      {id:'demo-order-received',status:'received',supplier:'Brasseur Régional',createdAt:new Date(now.getTime()-172800000).toISOString(),updatedAt:new Date(now.getTime()-86400000).toISOString(),cutoffAt:'',deliveryAt:'',deliveryEndAt:'',requiredAt:'',estimatedTotal:153,lines:[{productId:'brasserie-ref-47',name:'Bière blonde fût 30 L',space:'bar',sku:'BC-047',unit:'l',quantity:60,receivedQuantity:60,packages:12,requiredAt:''}],scheduleVerified:false,supplierConfirmation:'declared-confirmed',statusEvidence:'user-declared',availability:'observed-at-receipt',availabilityEvidence:''}];
    snapshot.summary=api.summarize(snapshot,now);snapshot.fingerprint=api.hash(JSON.stringify({establishment:snapshot.establishment,stock:snapshot.stock,suppliers:snapshot.suppliers,incidents:snapshot.incidents,orders:snapshot.orders}));return snapshot;
  }
  function createBridge(api,now){
    now=now instanceof Date?now:new Date();var operations=createOperationsSnapshot(api,now),stockFinalEur=stockValue(createSpaces()),result={version:3,demo:true,source:'verdict-inventaire-demo',siteId:ID,etablissement:NAME,date:isoDate(now).slice(0,7),countedAt:isoDate(now),stockInitial:PREVIOUS_STOCK,stockInitialDate:isoDate(new Date(now.getFullYear(),now.getMonth()-1,1,12)),stockFinal:stockFinalEur,achats:null,consommation:null,premierComptage:false,qualite:'complete',references:51,referencesTotal:51,couverture:100,fingerprint:'demo-brasserie-17350-51',scopeHash:'INVAPP:demo-brasserie',scopedPurchases:false,operations:operations};
    return {schema:'verdict.inventory.bridge.v1',demo:true,account_match:true,site_id:ID,site_name:NAME,generated_at:now.toISOString(),catalogue:references.map(function(r,index){return {id:'brasserie-ref-'+String(index+1).padStart(2,'0'),nom:r[0],unite:r[1],prix:r[2],espace:r[3],fournisseur:supplierFor(r[0])};}),result:result,operations:operations};
  }

  PREVIOUS_STOCK=Math.round(stockValue(createSpaces())*16601/17350);/* V2-A6 : même évolution d’un mois sur l’autre qu’avant, sur la valeur réelle */
  var api={version:'1.1.0',establishmentId:ID,establishmentName:NAME,referenceCount:51,targetStockFinalHT:stockValue(createSpaces()),previousStockHT:PREVIOUS_STOCK,scoreAuthority:'verdict-engine',source:'verdict-presentation-brasserie-24m',references:Object.freeze(references.map(Object.freeze)),supplierFor:supplierFor,createSpaces:createSpaces,createDatabase:createDatabase,createOperationsSnapshot:createOperationsSnapshot,createBridge:createBridge,clone:clone};
  global.VERDICT_BRASSERIE_INVENTORY_DEMO=Object.freeze(api);
})(window);

