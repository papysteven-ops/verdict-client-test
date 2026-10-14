
/* Ancrage structurel de Vera dans l'en-tête. Ce déplacement conserve le même
   bouton, le même gestionnaire et le même assistant ; seul son emplacement
   visuel change. En cas de DOM incomplet, le bouton reste simplement à sa
   position d'origine. */
(function dockVerdictVera(){
  var top=document.querySelector('.top'),sub=document.getElementById('topSub'),btn=document.getElementById('aideBtn');
  if(!top||!btn)return;
  btn.classList.add('verdict-vera-docked');
  var veraLabel=document.createElement('span');
  veraLabel.className='verdict-vera-label';veraLabel.textContent='Vera';veraLabel.setAttribute('aria-hidden','true');
  btn.appendChild(veraLabel);
  top.insertBefore(btn,sub||null);
  if(window.VERDICT_EDITION==='test'){
    var badge=document.createElement('button');
    badge.type='button';badge.className='verdict-edition-test';badge.textContent='TEST';
    badge.title='Données temporaires — toucher pour recommencer';
    badge.setAttribute('aria-label','Mode test, données non sauvegardées. Recommencer le test');
    badge.onclick=function(){location.replace('/test');};
    top.insertBefore(badge,btn);
  }
})();

/* Filet anti-erreur commun à toutes les saisies numériques, y compris les
   écrans générés après le chargement. La valeur n'est jamais corrigée pendant
   que le client tape : elle est normalisée et contrôlée à la sortie du champ. */
function installVerdictInputSafety(){
  if(window.__verdictInputSafety)return;window.__verdictInputSafety=true;
  var style=document.createElement('style');style.textContent='.verdict-field-invalid{border-color:#ef4444!important;box-shadow:0 0 0 2px rgba(239,68,68,.18)!important}.verdict-field-error{display:block;margin-top:5px;color:#fca5a5;font-size:11.5px;line-height:1.35}.btn:disabled{opacity:.45;filter:saturate(.25);cursor:not-allowed}';document.head.appendChild(style);
  function candidate(el){return el&&el.tagName==='INPUT'&&(el.type==='number'||el.inputMode==='decimal'||el.inputMode==='numeric');}
  function clear(el){el.classList.remove('verdict-field-invalid');el.removeAttribute('aria-invalid');var n=el.parentNode&&el.parentNode.querySelector('.verdict-field-error');if(n)n.remove();}
  function fail(el,msg){clear(el);el.classList.add('verdict-field-invalid');el.setAttribute('aria-invalid','true');var n=document.createElement('small');n.className='verdict-field-error';n.textContent=msg;el.insertAdjacentElement('afterend',n);}
  document.addEventListener('input',function(ev){if(candidate(ev.target))clear(ev.target);},true);
  document.addEventListener('blur',function(ev){var el=ev.target;if(!candidate(el)||el.disabled||el.readOnly)return;var raw=String(el.value||'').trim();if(!raw){clear(el);return;}var normalized=raw.replace(/[\s\u00a0\u202f]/g,'').replace(',','.');var integer=el.inputMode==='numeric';var ok=(integer?/^-?\d+$/:/^-?(?:\d+|\d*\.\d+)$/).test(normalized)&&isFinite(Number(normalized));if(!ok){fail(el,integer?'Entrez un nombre entier, sans texte.':'Entrez un nombre valide, par exemple 1250,50.');return;}el.value=integer?String(parseInt(normalized,10)):normalized;clear(el);},true);
}
installVerdictInputSafety();
