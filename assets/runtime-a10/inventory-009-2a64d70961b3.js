
/* Verdict® Inventaire — fusion locale/cloud déterministe.
   Règle de sûreté : une copie cloud ancienne ne remplace jamais une copie
   locale modifiée hors ligne. Les conflits de même champ gardent le local et
   sont signalés ; les changements indépendants sont fusionnés. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.VerdictInventorySync=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function clone(v){if(v===undefined)return undefined;return JSON.parse(JSON.stringify(v));}
  function object(v){return !!v&&typeof v==='object'&&!Array.isArray(v);}
  function equal(a,b){if(a===b)return true;try{return JSON.stringify(a)===JSON.stringify(b);}catch(e){return false;}}
  function own(o,k){return Object.prototype.hasOwnProperty.call(o||{},k);}
  function entityArray(a){return Array.isArray(a)&&a.length>0&&a.every(function(x){return object(x)&&String(x.id||'').trim();});}
  function conflict(conflicts,path,kind){conflicts.push({path:path||'$',kind:kind||'same-field',resolution:'local'});}

  function mergeEntityArrays(base,local,remote,path,conflicts){
    base=Array.isArray(base)?base:[];local=Array.isArray(local)?local:[];remote=Array.isArray(remote)?remote:[];
    var bm={},lm={},rm={},order=[];
    base.forEach(function(x){bm[String(x.id)]=x;});
    local.forEach(function(x){var k=String(x.id);lm[k]=x;if(order.indexOf(k)<0)order.push(k);});
    remote.forEach(function(x){var k=String(x.id);rm[k]=x;if(order.indexOf(k)<0)order.push(k);});
    Object.keys(bm).forEach(function(k){if(order.indexOf(k)<0)order.push(k);});
    var out=[];
    order.forEach(function(k){
      var b=own(bm,k)?bm[k]:undefined,l=own(lm,k)?lm[k]:undefined,r=own(rm,k)?rm[k]:undefined,p=(path||'$')+'['+k+']';
      if(l===undefined&&r===undefined)return;
      if(l===undefined){
        if(b===undefined){out.push(clone(r));return;}
        if(equal(r,b))return;
        conflict(conflicts,p,'local-delete/remote-change');return;
      }
      if(r===undefined){
        if(b===undefined){out.push(clone(l));return;}
        if(equal(l,b))return;
        conflict(conflicts,p,'local-change/remote-delete');out.push(clone(l));return;
      }
      out.push(mergeValue(b,l,r,p,conflicts));
    });
    return out;
  }

  function mergeValue(base,local,remote,path,conflicts){
    if(equal(local,remote))return clone(local);
    if(equal(local,base))return clone(remote);
    if(equal(remote,base))return clone(local);
    if(Array.isArray(local)&&Array.isArray(remote)){
      if(entityArray(local)||entityArray(remote)||entityArray(base))return mergeEntityArrays(base,local,remote,path,conflicts);
      conflict(conflicts,path,'array');return clone(local);
    }
    if(object(local)&&object(remote)){
      var out={},keys={};Object.keys(object(base)?base:{}).forEach(function(k){keys[k]=1;});Object.keys(local).forEach(function(k){keys[k]=1;});Object.keys(remote).forEach(function(k){keys[k]=1;});
      Object.keys(keys).forEach(function(k){
        var b=object(base)&&own(base,k)?base[k]:undefined,l=own(local,k)?local[k]:undefined,r=own(remote,k)?remote[k]:undefined,p=(path?path+'.':'')+k;
        if(l===undefined&&r===undefined)return;
        if(l===undefined){if(b!==undefined&&equal(r,b))return;if(b!==undefined&&!equal(r,b)){conflict(conflicts,p,'local-delete/remote-change');return;}out[k]=clone(r);return;}
        if(r===undefined){if(b!==undefined&&equal(l,b))return;if(b!==undefined&&!equal(l,b))conflict(conflicts,p,'local-change/remote-delete');out[k]=clone(l);return;}
        out[k]=mergeValue(b,l,r,p,conflicts);
      });
      return out;
    }
    conflict(conflicts,path,'same-field');return clone(local);
  }

  function mergeThreeWay(base,local,remote){var conflicts=[];return {data:mergeValue(base,local,remote,'',conflicts),conflicts:conflicts};}
  function normalizeMeta(meta){meta=object(meta)?meta:{};return {dirty:!!meta.dirty,baseRev:Math.max(0,Number(meta.baseRev)||0),baseData:object(meta.baseData)?clone(meta.baseData):null,changedAt:String(meta.changedAt||'')};}
  function validData(v){return object(v)&&object(v.spaces);}

  function reconcile(localData,meta,cloudData,cloudRev){
    meta=normalizeMeta(meta);cloudRev=Math.max(0,Number(cloudRev)||0);
    var hasLocal=validData(localData),hasCloud=validData(cloudData);
    if(!hasLocal&&hasCloud)return {data:clone(cloudData),needsUpload:false,source:'cloud',baseRev:cloudRev,baseData:clone(cloudData),conflicts:[]};
    if(!hasLocal&&!hasCloud)return {data:null,needsUpload:false,source:'empty',baseRev:cloudRev,baseData:null,conflicts:[]};
    if(hasLocal&&!hasCloud)return {data:clone(localData),needsUpload:true,source:'local',baseRev:cloudRev,baseData:null,conflicts:[]};
    if(!meta.dirty)return {data:clone(cloudData),needsUpload:false,source:'cloud',baseRev:cloudRev,baseData:clone(cloudData),conflicts:[]};
    if(cloudRev<=meta.baseRev)return {data:clone(localData),needsUpload:true,source:'local-newer',baseRev:cloudRev,baseData:clone(cloudData),conflicts:[]};
    var merged=mergeThreeWay(meta.baseData||{},localData,cloudData);
    return {data:merged.data,needsUpload:true,source:'merged',baseRev:cloudRev,baseData:clone(cloudData),conflicts:merged.conflicts};
  }

  return {version:'1.0.0',clone:clone,equal:equal,normalizeMeta:normalizeMeta,mergeThreeWay:mergeThreeWay,reconcile:reconcile};
});

