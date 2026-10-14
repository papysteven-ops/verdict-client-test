(function(root){'use strict';
 async function prepare(){var seen=new Set(),windows=[root],results=[];
  while(windows.length){var win=windows.shift();if(seen.has(win))continue;seen.add(win);try{var frames=win.document.querySelectorAll('iframe');for(var i=0;i<frames.length;i++)if(frames[i].contentWindow)windows.push(frames[i].contentWindow);}catch(_){}
   try{if(win.VerdictDraftsA11&&win.VerdictDraftsA11.hasPending())return {ok:false,reason:'form_draft_not_committed'};var state=win.VerdictSaveStateA10;if(state&&['failed','conflict'].includes(state.status))return {ok:false,reason:'draft_not_committed'};
    if(win.VerdictSavePromiseA10){var saved=await win.VerdictSavePromiseA10;if(saved&&saved.ok===false)return {ok:false,reason:'save_failed'};}
    if(typeof win.flushInventoryFastSave==='function')win.flushInventoryFastSave();
    if(typeof win.save==='function'&&(win.STORE||win.DB)){var saved=await win.save('before-pwa-update');if(saved&&saved.ok===false)return {ok:false,reason:'save_failed'};var commit=saved&&saved.result||saved;if(!commit||commit.committed!==true)return {ok:false,reason:commit&&['temporary','disabled'].includes(commit.status)?'temporary_workspace_export_required':'save_failed'};results.push(commit);}
   }catch(error){return {ok:false,reason:'save_failed',code:String(error.message||'storage')};}
  }
  return {ok:true,checkedWindows:seen.size,results:results};
 }
 root.VerdictUpdateGuard={prepare:prepare};if(typeof module==='object'&&module.exports)module.exports=root.VerdictUpdateGuard;
})(typeof window!=='undefined'?window:globalThis);
