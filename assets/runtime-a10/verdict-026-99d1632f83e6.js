
/* Verdict® — coût de main-d'œuvre directe par portion et par préparation.
   Calcul analytique uniquement : ce montant éclaire le plat mais n'est jamais
   retiré une seconde fois du résultat global, où les salaires existent déjà.
   Une préparation commune est calculée une fois par lot, puis répartie selon
   son rendement et la quantité réellement utilisée dans chaque plat. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VerdictDishLabor=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function num(v){if(v===null||v===undefined||String(v).trim()==='')return null;var n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null;}
  function nonneg(v){var n=num(v);return n==null?0:n;}
  function rounded(v,n){var p=Math.pow(10,n==null?4:n);return Math.round(v*p)/p;}
  function calculate(input){
    input=input||{};var entered=input.entered===true,rate=num(input.hourlyRate),batchQty=num(input.batchQty),batchMin=num(input.batchMinutes),batchPeople=num(input.batchPeople),finishMin=num(input.finishMinutes),finishPeople=num(input.finishPeople),passive=num(input.passiveMinutes),errors=[];
    [rate,batchQty,batchMin,batchPeople,finishMin,finishPeople,passive].forEach(function(v){if(v!=null&&v<0&&errors.indexOf('Les valeurs ne peuvent pas être négatives.')<0)errors.push('Les valeurs ne peuvent pas être négatives.');});
    batchMin=nonneg(batchMin);finishMin=nonneg(finishMin);passive=nonneg(passive);
    if(!entered)return {ready:false,entered:false,cost:null,activeMinutesPerPortion:null,batchCost:null,passiveMinutes:passive,errors:[],label:'Main-d’œuvre non chiffrée'};
    if(num(input.batchMinutes)==null)errors.push('Indiquez le temps actif du lot, ou 0 s’il n’y en a pas.');
    if(num(input.finishMinutes)==null)errors.push('Indiquez le temps actif de finition, ou 0 s’il n’y en a pas.');
    if(batchMin>0&&!(batchQty>0))errors.push('Indiquez le nombre de portions produites par lot.');
    if(batchMin>0&&!(batchPeople>0))errors.push('Indiquez le nombre de personnes mobilisées sur le lot.');
    if(finishMin>0&&!(finishPeople>0))errors.push('Indiquez le nombre de personnes mobilisées à la finition.');
    var batchPerPortion=batchMin>0&&batchQty>0&&batchPeople>0?(batchMin*batchPeople/batchQty):0,finishPerPortion=finishMin>0&&finishPeople>0?finishMin*finishPeople:0,active=batchPerPortion+finishPerPortion;
    if(active>0&&!(rate>0))errors.push('Indiquez le coût horaire chargé.');
    if(errors.length)return {ready:false,entered:true,cost:null,activeMinutesPerPortion:active,batchCost:null,passiveMinutes:passive,errors:errors,label:'Main-d’œuvre à compléter'};
    var exact=globalThis.VerdictFinance.laborAmounts({rate:rate,batchQty:batchQty,batchMin:batchMin,batchPeople:batchPeople,finishMin:finishMin,finishPeople:finishPeople});var cost=exact.cost,batchCost=exact.batchCost;
    return {ready:true,entered:true,cost:cost,activeMinutesPerPortion:exact.activeMinutesPerPortion,batchCost:batchCost,exact:exact.exact,passiveMinutes:passive,errors:[],label:'Main-d’œuvre directe calculée'};
  }
  function calculatePreparation(input){
    input=input||{};
    var yieldQty=num(input.yieldQty),materialBatchCost=num(input.materialBatchCost),unit=String(input.unit||'portion'),errors=[];
    if(yieldQty!=null&&yieldQty<0)errors.push('Le rendement ne peut pas être négatif.');
    if(materialBatchCost!=null&&materialBatchCost<0)errors.push('Le coût matière du lot ne peut pas être négatif.');
    if(!(yieldQty>0))errors.push('Indiquez un rendement de lot supérieur à zéro.');
    if(materialBatchCost==null)errors.push('Le coût matière du lot reste inconnu.');
    var source=input.labor||{},laborInput={
      entered:source.entered===true,source:source.source==='observed'?'observed':'estimated',
      hourlyRate:source.hourlyRate,batchQty:yieldQty,batchMinutes:source.batchMinutes,
      batchPeople:source.batchPeople,finishMinutes:0,finishPeople:0,passiveMinutes:source.passiveMinutes
    };
    var labor=calculate(laborInput);
    if(!labor.ready){
      if(!labor.entered)errors.push('La main-d’œuvre du lot reste inconnue : saisissez 0 si elle est réellement nulle.');
      else errors=errors.concat(labor.errors||[]);
    }
    var materialReady=materialBatchCost!=null&&materialBatchCost>=0&&yieldQty>0;
    var decimal=materialReady?globalThis.VerdictFinance.preparationAmounts(input.materialBatchExact?globalThis.VerdictFinance.fromExact(input.materialBatchExact):materialBatchCost,yieldQty,labor):null;var materialUnitCost=decimal?decimal.materialUnitCost:null;
    var laborUnitCost=labor.ready?labor.cost:null;
    var ready=materialReady&&labor.ready&&!errors.length;
    return {
      ready:ready,materialReady:materialReady,laborReady:labor.ready&&yieldQty>0,yieldQty:yieldQty,unit:unit,
      materialBatchCost:materialBatchCost,materialUnitCost:materialUnitCost,exact:decimal?decimal.exact:{materialUnitCost:null,laborUnitCost:labor.ready?labor.exact.cost:null,activeMinutesPerUnit:labor.ready?labor.exact.active:null,laborBatchCost:labor.ready?labor.exact.batchCost:null},
      laborBatchCost:labor.ready?labor.batchCost:null,laborUnitCost:laborUnitCost,
      directBatchCost:ready?decimal.directBatchCost:null,
      directUnitCost:ready?decimal.directUnitCost:null,
      activeMinutesPerUnit:labor.ready?labor.activeMinutesPerPortion:null,
      passiveMinutes:labor.passiveMinutes,source:laborInput.source,errors:errors
    };
  }
  function allocatePreparation(preparation,quantity){
    var q=num(quantity),errors=[];
    if(q==null||!(q>0))errors.push('La quantité de préparation utilisée doit être supérieure à zéro.');
    if(!preparation||!preparation.materialReady)errors.push('La matière de la préparation reste à compléter.');
    if(!preparation||!preparation.laborReady)errors.push('La main-d’œuvre de la préparation reste à compléter.');
    var decimal=q!=null&&q>0&&preparation?globalThis.VerdictFinance.preparationAllocation(preparation,q):{};
    return {
      exact:decimal.exact||null,ready:!errors.length,materialReady:!!(preparation&&preparation.materialReady),laborReady:!!(preparation&&preparation.laborReady),quantity:q,unit:preparation&&preparation.unit||'',
      materialCost:q!=null&&q>0&&preparation&&preparation.materialReady?decimal.materialCost:null,
      laborCost:q!=null&&q>0&&preparation&&preparation.laborReady?decimal.laborCost:null,
      activeMinutes:q!=null&&q>0&&preparation&&preparation.laborReady?decimal.activeMinutes:null,
      errors:errors
    };
  }
  function combine(dishLabor,preparationAllocations){
    dishLabor=dishLabor||calculate({});preparationAllocations=Array.isArray(preparationAllocations)?preparationAllocations:[];
    var errors=(dishLabor.errors||[]).slice(),prepCost=0,prepMinutes=0,prepReady=true;
    preparationAllocations.forEach(function(x){
      if(!x||!x.laborReady||x.quantity==null||!(x.quantity>0)){prepReady=false;errors=errors.concat(x&&x.errors||['Une préparation commune reste à compléter.']);return;}
      prepCost+=x.laborCost||0;prepMinutes+=x.activeMinutes||0;
    });
    var ready=!!dishLabor.ready&&prepReady,decimal=globalThis.VerdictFinance.combineLabor(dishLabor,preparationAllocations);
    return {
      ready:ready,entered:!!dishLabor.entered||preparationAllocations.length>0,
      cost:decimal.cost,exact:decimal.exact,
      dishCost:dishLabor.ready?dishLabor.cost:null,preparationCost:decimal.preparationCost,
      activeMinutesPerPortion:decimal.activeMinutesPerPortion,
      dishActiveMinutes:dishLabor.ready?dishLabor.activeMinutesPerPortion:null,
      preparationActiveMinutes:decimal.preparationActiveMinutes,
      passiveMinutes:dishLabor.passiveMinutes||0,errors:errors,
      label:ready?'Main-d’œuvre directe calculée':'Main-d’œuvre à compléter'
    };
  }
  return {version:'2.0.0',calculate:calculate,calculatePreparation:calculatePreparation,allocatePreparation:allocatePreparation,combine:combine};
});

