
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VerdictHonestyR18=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const REASONS={donnee_non_fournie:'Donnée non fournie',non_calcule:'Non calculé',serveur_non_branche:'Serveur non branché',connexion_non_verifiee:'Connexion non vérifiée'};
  function isNumber(value){return typeof value==='number'&&Number.isFinite(value)}
  function absent(value,reason){return isNumber(value)?{absent:false,value,reason:null}:{absent:true,value:null,reason:reason||'donnee_non_fournie'}}
  function display(value,formatter,reasons){const item=value&&typeof value==='object'&&'absent' in value?value:absent(value);if(item.absent)return {text:'—',reason:(reasons||REASONS)[item.reason]||item.reason};return {text:(formatter||String)(item.value),reason:null}}
  function enteredZero(value,entered){return entered===true&&isNumber(value)&&value===0?{absent:false,value:0,reason:'saisi_a_zero'}:absent(value)}
  return Object.freeze({REASONS,isNumber,absent,display,enteredZero});
});

