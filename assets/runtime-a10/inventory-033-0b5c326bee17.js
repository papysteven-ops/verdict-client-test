/* R321 — Échap ferme la fenêtre ouverte d’Inventaire par son propre chemin de fermeture (clic sur le fond), comme au toucher. */
document.addEventListener('keydown',function(e){if(e.key!=='Escape'||e.defaultPrevented||document.body.classList.contains('vinv-open'))return;
  var open=[].slice.call(document.querySelectorAll('.modal.on')).filter(function(m){var r=m.getBoundingClientRect();return r.width&&r.height;});if(!open.length)return;
  var m=open[open.length-1];e.preventDefault();var before=m.classList.contains('on');m.click();
  if(before&&m.classList.contains('on')){var c=m.querySelector('[aria-label*="ermer"],.x,.close,.sh-fermer');if(c)c.click();}});