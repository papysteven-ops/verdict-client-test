
(function(root){
  'use strict';
  if(root.VerdictInventoryPlusV451)return;
  var VERSION='verdict-inventory-plus/v45.1.0';
  function add(){var host=document.getElementById('v-prod');if(!host||host.querySelector('#v451-inventory-plus'))return;var section=document.createElement('section');section.id='v451-inventory-plus';section.className='v451-inv-plus';section.innerHTML='<span class="v451-inv-plus-k">INVENTAIRE · OUTILS</span><h2>Tout ce qui concerne les achats et les stocks</h2><p>Chaque outil reste ici, relié au même établissement.</p><div class="v451-inv-grid"><button type="button" class="v451-inv-card" data-v451-inv="invoices"><i>⇩</i><span><b>Achats et factures</b><small>Factures structurées, prix et coût matière réel</small></span><em>→</em></button><button type="button" class="v451-inv-card" data-v451-inv="suppliers"><i>⌂</i><span><b>Fournisseurs</b><small>Coordonnées, délais, tarifs et alternatives</small></span><em>→</em></button><button type="button" class="v451-inv-card" data-v451-inv="orders"><i>↗</i><span><b>Commandes</b><small>Préparer, envoyer, confirmer et réceptionner</small></span><em>→</em></button><button type="button" class="v451-inv-card" data-v451-inv="counting"><i>⚙</i><span><b>Paramètres de comptage</b><small>Produits, zones, unités, seuils et stock idéal</small></span><em>→</em></button></div>';var subtitle=host.querySelector('.sub');if(subtitle)subtitle.insertAdjacentElement('afterend',section);else host.insertBefore(section,host.firstChild);}
  function modal(title,body,status){
    var old=document.getElementById('v451-inv-modal');if(old)old.remove();
    var node=document.createElement('div');node.id='v451-inv-modal';node.className='v451-inv-modal';
    node.innerHTML='<section class="v451-inv-sheet" role="dialog" aria-modal="true"><span class="v451-inv-plus-k">INVENTAIRE · SOURCE</span><h2>'+title+'</h2><p>'+body+'</p><div class="v451-inv-state"><b>'+status+'</b><small>Aucune valeur n’est calculée avant une source confirmée.</small></div><button type="button" data-v451-close>Fermer</button></section>';
    node.addEventListener('click',function(event){if(event.target===node||event.target.closest('[data-v451-close]'))node.remove();});
    document.body.appendChild(node);var close=node.querySelector('button');if(close)close.focus();
  }
  function action(name){
    if(name==='orders'){root.go('order');return;}
    if(name==='counting'){var addButton=document.getElementById('staffCatalogAdd');if(addButton)try{addButton.scrollIntoView({block:'center',behavior:'auto'});}catch(error){}return;}
    if(name==='suppliers'){modal('Fournisseurs','Les profils fournisseurs, horaires limites, commandes et alternatives restent gérés dans Inventaire.','Données de l’établissement');return;}
    if(name==='invoices')modal('Achats et factures','Les factures Factur-X, UBL et CII peuvent alimenter les achats et le coût matière réel dès qu’une source est branchée.','Source à brancher');
  }
  var original=typeof root.drawProd==='function'?root.drawProd:null;if(original)root.drawProd=function(){var result=original.apply(this,arguments);add();return result;};
  document.addEventListener('click',function(event){var button=event.target&&event.target.closest?event.target.closest('[data-v451-inv]'):null;if(!button)return;event.preventDefault();action(button.getAttribute('data-v451-inv'));},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add();
  root.VerdictInventoryPlusV451=Object.freeze({VERSION:VERSION,render:add,open:action});
})(window);

