
(function(){
  'use strict';
  var enabled=window.VERDICT_WORKSPACE_CONNECTED===true;
  var endpoint=String(window.VERDICT_WORKSPACE_API||'/api/workspace');
  var state={ready:false,authenticated:false,workspace:null,context:null,error:''};

  function demoRequested(){var query=new URLSearchParams(location.search);return query.get('demo')==='1'||!!query.get('presentation');}
  function announce(message){var node=document.getElementById('notification-live');if(node&&message)node.textContent=message;}
  function unlock(){document.documentElement.classList.remove('workspace-access-pending');}
  function publish(name,detail){try{window.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(error){}}
  async function request(action,data){
    var response=await fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action},data||{}))});
    var payload=await response.json().catch(function(){return {};});
    if(!response.ok||payload.ok===false){var error=new Error(payload.error||payload.code||'workspace_unavailable');error.status=response.status;throw error;}
    return payload;
  }
  function resolveSite(workspace,context){
    var organisation=context&&workspace&&workspace.organisations&&workspace.organisations.find(function(item){return item.id===context.organisationId;});
    return organisation&&organisation.sites&&organisation.sites.find(function(item){return item.id===context.etabId;})||null;
  }
  function preferredTarget(workspace,context){
    var site=resolveSite(workspace,context),modules=site&&site.modules||{};
    var target=String(context&&context.module||site&&site.landingModule||'pilotage');
    if(!modules[target]||!modules[target].view)target=['pilotage','carte','inventory'].find(function(key){return modules[key]&&modules[key].view;})||'';
    return {target:target,site:site,modules:modules};
  }
  function applyPermissions(workspace){
    state.workspace=workspace||null;state.context=workspace&&workspace.defaultContext||null;state.authenticated=true;
    if(demoRequested()){state.ready=true;unlock();publish('verdict:workspace-ready',{demo:true,workspace:workspace});return state;}
    var context=state.context,resolved=preferredTarget(workspace,context),site=resolved.site,modules=resolved.modules;
    document.querySelectorAll('[data-capability]').forEach(function(button){var capability=String(button.getAttribute('data-capability')||''),allowed=!!(modules[capability]&&modules[capability].view);button.hidden=!allowed;button.disabled=!allowed;button.setAttribute('aria-hidden',allowed?'false':'true');});
    /* Au démarrage, la coque attend cette décision avant de créer une iframe.
       Lors d'un rafraîchissement ultérieur des droits, elle ne déplace
       l'utilisateur que si son module courant vient réellement d'être retiré. */
    if(site&&window.VerdictUnifiedShell&&typeof window.VerdictUnifiedShell.hasStarted==='function'&&window.VerdictUnifiedShell.hasStarted()){
      var current=window.VerdictUnifiedShell.getActiveModule();
      if(!modules[current]||!modules[current].view)window.VerdictUnifiedShell.activateModule(resolved.target,{siteId:site.id,name:site.name,accountScope:context.organisationId,demo:false},'replace');
    }
    state.ready=true;unlock();publish('verdict:workspace-ready',{demo:false,workspace:workspace,context:context});return state;
  }
  async function boot(){
    if(!enabled){state.ready=true;unlock();return state;}
    try{var payload=await request('bootstrap');return applyPermissions(payload.workspace);}
    catch(error){state.ready=true;state.error=error.message||'workspace_unavailable';unlock();if(error.status===401){announce('Connexion requise');publish('verdict:authentication-required',{});if(window.VERDICT_OPEN_ACCESS!==true&&!demoRequested()){var next=location.pathname+location.search+location.hash;location.replace('./account.html?return='+encodeURIComponent(next));}}else{announce('Accès momentanément indisponible');publish('verdict:workspace-error',{error:state.error});}return state;}
  }
  window.VerdictWorkspaceAccess={boot:boot,getState:function(){return {ready:state.ready,authenticated:state.authenticated,workspace:state.workspace,context:state.context,error:state.error};},getPreferredTarget:function(){return preferredTarget(state.workspace,state.context);},refresh:boot,version:'17.3.1'};
  window.VERDICT_WORKSPACE_BOOT_PROMISE=boot();
})();

