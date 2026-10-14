/* R321 — Entrée valide le formulaire actif (brief de reprise §5) : dans un champ de saisie, Entrée déclenche le bouton
   principal de la fiche, par le MÊME chemin que le clic (aucun second système de sauvegarde). Rien n’est fait dans une
   zone de texte, une recherche, une liste déroulante, un vrai <form> (le navigateur le gère déjà) ou un champ qui gère
   Entrée lui-même. Un second Entrée dans la seconde qui suit est ignoré (pas de double enregistrement). */
(function(d){
  var PRIM=/^(\s|[✓✔➕+\u{1F4BE}\u{1F4E5}])*(enregistrer|valider|calculer|appliquer|ajouter|confirmer|mettre à jour|créer|save|apply|confirm|add|update|guardar|aplicar|añadir|salva|applica|aggiungi|speichern|übernehmen|hinzufügen|opslaan|toepassen|toevoegen|adicionar)\b/iu;
  var last=0;
  function visible(b){if(!b||b.disabled||b.hidden)return false;var r=b.getBoundingClientRect();return r.width>0&&r.height>0;}
  var STRONG=/^(\s|[\u2713\u2714])*(enregistrer|valider|appliquer|confirmer|mettre à jour|save|apply|confirm|update|guardar|aplicar|confirmar|salva|applica|conferma|speichern|übernehmen|bestätigen|opslaan|toepassen|bevestigen)\b/iu;
  /* Un seul bouton « fort » (Enregistrer, Valider…) gagne ; sinon un seul bouton principal ; « + Ajouter un ingrédient » ne compte pas. */
  function candidates(box){var strong=[],other=[];box.querySelectorAll('button,[role=button],input[type=submit],input[type=button]').forEach(function(b){if(!visible(b))return;var t=(b.textContent||b.value||'').trim();
    if(/^\s*[+\u2795]/.test(t)||b.matches('.ghost,.sec,.x,.sh-fermer'))return;
    if(STRONG.test(t))strong.push(b);else if(b.matches('.prim,.btn.prim,.primary,[data-primary],[type=submit]')||PRIM.test(t))other.push(b);});return strong.length?strong:other;}
  d.addEventListener('keydown',function(e){
    if(e.key!=='Enter'||e.defaultPrevented||e.isComposing||e.shiftKey||e.altKey||e.ctrlKey||e.metaKey)return;
    var el=e.target;if(!el||el.tagName!=='INPUT')return;
    var type=(el.type||'text').toLowerCase();if(!/^(text|number|tel|email|date|time|month|week|password|)$/.test(type))return;
    if(el.form||el.closest('form'))return;
    if(el.list||/search/i.test(el.getAttribute('inputmode')||'')||/rechercher|cherch|search|buscar|cerca|suchen|zoeken|pesquisar|filtr/i.test((el.placeholder||'')+' '+(el.getAttribute('aria-label')||'')))return;
    if(el.getAttribute('onkeydown')||el.getAttribute('onkeyup')||el.getAttribute('onkeypress'))return;
    var box=el.parentElement,btn=null;
    while(box&&box!==d.body){var c=candidates(box);if(c.length===1){btn=c[0];break;}if(c.length>1){break;}
      if(box.matches('.sheet,.modal,[role=dialog],.card,section,details,fieldset'))break;box=box.parentElement;}
    if(!btn)return;
    e.preventDefault();
    var now=Date.now();if(e.repeat||now-last<1000)return;last=now;
    try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(x){}
    btn.click();
  },false);
})(document);