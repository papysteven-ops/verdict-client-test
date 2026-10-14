
    /* Dans le Pilote, la coque dorée possède déjà la zone sûre iPhone. */
    if(new URLSearchParams(location.search).get('pilot')==='1'&&window.parent!==window){
      document.documentElement.classList.add('pilot-embedded');
    }
  