/* R321 — champs numériques : un nombre calculé (12,04796238 ; 38,82152479644708) s’affiche arrondi
   (2 décimales, 3 sous 10) mais la valeur exacte est rendue au code tant que le client n’a pas modifié le champ :
   aucun calcul ne change parce qu’un écran a été ouvert. */
(function(){try{
  var D=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');if(!D||!D.get||!D.set)return;
  var LONG=/^([−-]?)(\d+)[.,](\d{5,})$/;
  function disp(s){var m=LONG.exec(s);if(!m)return null;var n=Number((m[1]?'-':'')+m[2]+'.'+m[3]);if(!isFinite(n))return null;var k=Math.abs(n)<10?1000:100;var r=String(Math.round(n*k)/k);return (s.indexOf(',')>=0||s.indexOf('.')<0?r.replace('.',','):r);}
  Object.defineProperty(HTMLInputElement.prototype,'value',{configurable:true,enumerable:D.enumerable,
    get:function(){var v=D.get.call(this),x=this.__vdExact;return (x&&v===x.d)?x.r:v;},
    set:function(val){var s=val==null?'':String(val),t=this.type;var d=(t==='text'||t==='number'||t==='search'||t==='')?disp(s):null;
      if(d!==null&&d!==s){this.__vdExact={r:s,d:d};D.set.call(this,d);}else{this.__vdExact=null;D.set.call(this,s);}}});
  function scan(root){if(!root||!root.getElementsByTagName)return;var list=root.tagName==='INPUT'?[root]:root.getElementsByTagName('input');
    for(var i=0;i<list.length;i++){var el=list[i];if(el.__vdExact)continue;var v=D.get.call(el);if(LONG.test(v))el.value=v;}}
  new MutationObserver(function(recs){for(var i=0;i<recs.length;i++){var a=recs[i].addedNodes;for(var j=0;j<a.length;j++)if(a[j].nodeType===1)scan(a[j]);}})
    .observe(document.documentElement,{childList:true,subtree:true});
}catch(e){}})();