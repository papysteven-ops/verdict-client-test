
/* Verdict Perso — centre de notifications dirigeant.
   Les alertes operationnelles restent hors des analyses. Un meme evenement
   ne peut creer qu'une notification, meme si les modules se recalculent. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.VerdictManagerNotifications=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  var VERSION='1.3.0',MAX_ITEMS=30,DAY=86400000;
  function clean(value,max){return String(value==null?'':value).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max||240);}
  function iso(value,fallback){var time=Date.parse(value||'');return Number.isFinite(time)?new Date(time).toISOString():new Date(fallback||Date.now()).toISOString();}
  function severity(value){value=clean(value,20).toLowerCase();if(/critical|danger|red|orange/.test(value))return 'critical';if(/warning|yellow|amber/.test(value))return 'warning';if(/success|green|resolved/.test(value))return 'success';return 'info';}
  function normalize(input,now){
    if(!input||typeof input!=='object')return null;
    var id=clean(input.id||input.key,190);if(!id)return null;
    return {id:id,source:clean(input.source||input.sourceModule||'Verdict',40),module:input.module==='verdict'?'verdict':'inventory',level:severity(input.level),actorName:clean(input.actorName||input.actor_name||input.actor,100),establishmentId:clean(input.establishmentId||input.establishment_id,120),establishmentName:clean(input.establishmentName||input.establishment_name,160),title:clean(input.title||'Une action attend votre décision',180),detail:clean(input.detail||input.text,360),proof:clean(input.proof,500),createdAt:iso(input.createdAt||input.created_at,now),readAt:input.readAt?iso(input.readAt,now):'',actionLabel:clean(input.actionLabel,80),demo:input.demo===true,forceUnread:input.forceUnread===true};
  }
  function merge(current,incoming,now){
    var byId={},out=[];
    (Array.isArray(current)?current:[]).forEach(function(raw){var item=normalize(raw,now);if(!item||byId[item.id])return;byId[item.id]=item;out.push(item);});
    (Array.isArray(incoming)?incoming:[incoming]).forEach(function(raw){
      var next=normalize(raw,now);if(!next)return;var previous=byId[next.id];
      if(previous){
        var readAt=next.forceUnread?'':(previous.readAt||next.readAt||'');
        Object.keys(next).forEach(function(key){if(key!=='readAt'&&key!=='forceUnread'&&next[key]!==''&&next[key]!=null)previous[key]=next[key];});
        previous.readAt=readAt;previous.forceUnread=false;
      }else{next.forceUnread=false;byId[next.id]=next;out.push(next);}
    });
    var cutoff=Date.now();out=out.filter(function(item){var age=cutoff-Date.parse(item.createdAt);return age<=(item.readAt?45:90)*DAY;});
    out.sort(function(a,b){var unread=(a.readAt?1:0)-(b.readAt?1:0);return unread||String(b.createdAt).localeCompare(String(a.createdAt));});
    return out.slice(0,MAX_ITEMS);
  }
  function unreadCount(items){return (Array.isArray(items)?items:[]).filter(function(item){return item&&!item.readAt;}).length;}

  function create(options){
    options=options||{};if(typeof document==='undefined')return null;
    var key=clean(options.storageKey||'verdict:manager-notifications:v1',180),items=[],opened=false,lastFocus=null,visible=options.visible!==false;
    var button=document.getElementById('notification-button'),badge=document.getElementById('notification-badge'),layer=document.getElementById('notification-layer'),sheet=document.getElementById('notification-sheet'),closeButton=document.getElementById('notification-close'),readAllButton=document.getElementById('notification-read-all'),list=document.getElementById('notification-list'),empty=document.getElementById('notification-empty'),summary=document.getElementById('notification-summary'),live=document.getElementById('notification-live');
    if(!button||!badge||!layer||!sheet||!closeButton||!readAllButton||!list||!empty)return null;
    var clearRead=document.getElementById('notification-clear-read');
    if(!clearRead&&readAllButton.parentNode){clearRead=document.createElement('button');clearRead.id='notification-clear-read';clearRead.type='button';clearRead.textContent='Supprimer les lues';readAllButton.parentNode.insertBefore(clearRead,readAllButton);}
    if(!document.getElementById('notification-delete-style')){var st=document.createElement('style');st.id='notification-delete-style';st.textContent='.notification-item{cursor:pointer}.notification-item:focus-visible{outline:2px solid #7dd3fc;outline-offset:2px}.notification-delete{position:absolute;top:5px;right:5px;display:grid;place-items:center;width:44px;height:44px;padding:0;border:0;border-radius:12px;background:transparent;color:#8b98a5;font-size:24px;line-height:1;cursor:pointer}.notification-delete:hover{color:#fda4af}.notification-item-top{padding-right:40px}.notification-item:before{top:58px}.notification-tools{gap:8px}';document.head.appendChild(st);}

    function readStore(){try{var parsed=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(parsed)?parsed:[];}catch(e){return [];}}
    function writeStore(){try{localStorage.setItem(key,JSON.stringify(items));}catch(e){}}
    function langue(){try{return String(document.documentElement.lang||'fr').slice(0,2).toLowerCase()||'fr';}catch(e){return 'fr';}}
    function formatDate(value){try{var l=langue();if(l==='fr')return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value)).replace(':',' h ');return new Intl.DateTimeFormat(l==='en'?'en-GB':l,{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch(e){return '';}}
    /* C277 : date-heure brute (« 2026-10-23T11:50 ») dans un détail → « Fri 23/10 · 11:50 », jour abrégé dans la langue de la page */
    function dateLisible(text){var l=langue();return String(text).replace(/\b(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?\b/g,function(m,y,mo,d,h,mi,z){try{var t=z?new Date(m.replace(' ','T')):new Date(+y,+mo-1,+d,+h,+mi);if(isNaN(t.getTime()))return m;var p=function(n){return String(n).padStart(2,'0');};var j=new Intl.DateTimeFormat(l==='en'?'en-GB':l,{weekday:'short'}).format(t).replace(/\.$/,'');return j.charAt(0).toUpperCase()+j.slice(1)+' '+p(t.getDate())+'/'+p(t.getMonth()+1)+' · '+p(t.getHours())+':'+p(t.getMinutes());}catch(e){return m;}});}
    function node(tag,className,text){var element=document.createElement(tag);if(className)element.className=className;if(text!=null)element.textContent=text;return element;}
    function setNativeBadge(count){try{if(count&&navigator.setAppBadge)navigator.setAppBadge(count);else if(!count&&navigator.clearAppBadge)navigator.clearAppBadge();}catch(e){}}
    function markRead(id){var changed=false,stamp=new Date().toISOString();items.forEach(function(item){if(item.id===id&&!item.readAt){item.readAt=stamp;changed=true;}});if(changed){writeStore();render();}}
    var delKey=key+':deleted';
    function readDeleted(){try{var a=JSON.parse(localStorage.getItem(delKey)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
    function writeDeleted(a){try{localStorage.setItem(delKey,JSON.stringify(a.slice(-400)));}catch(e){}}
    function dropDeleted(incoming){
      var gone=readDeleted();if(!gone.length)return incoming;var back=[];
      var kept=(Array.isArray(incoming)?incoming:[incoming]).filter(function(raw){
        var id=clean(raw&&(raw.id||raw.key),190);
        if(gone.indexOf(id)<0)return true;
        if(raw&&raw.forceUnread===true){back.push(id);return true;}
        return false;
      });
      if(back.length)writeDeleted(gone.filter(function(id){return back.indexOf(id)<0;}));
      return kept;
    }
    function removeIds(ids){
      if(!ids.length)return;var gone=readDeleted();
      ids.forEach(function(id){if(gone.indexOf(id)<0)gone.push(id);});writeDeleted(gone);
      items=items.filter(function(item){return ids.indexOf(item.id)<0;});writeStore();render();
    }
    function remove(id){
      var at=items.map(function(item){return item.id;}).indexOf(id);if(at<0)return;
      removeIds([id]);var rest=items.length;
      if(live)live.textContent='Notification supprimée. '+(rest?rest+' restante'+(rest>1?'s':'')+'.':'Plus aucune notification.');
      var cards=list.querySelectorAll('.notification-item'),target=cards.length?cards[Math.min(at,cards.length-1)]:null;
      var focusEl=target?target.querySelector('.notification-primary'):closeButton;
      if(target&&target.scrollIntoView)try{target.scrollIntoView({block:'nearest'});}catch(e){}
      if(focusEl&&focusEl.focus)try{focusEl.focus();}catch(e){}
    }
    /* C31 : ouvrir = lire + retirer + afficher l'écran concerné (retour du 14/10). */
    function openItem(item){markRead(item.id);removeIds([item.id]);if(live)live.textContent='Notification ouverte et retirée.';close();if(typeof options.onAction==='function')options.onAction(item);}
    function removeRead(){removeIds(items.filter(function(item){return item.readAt;}).map(function(item){return item.id;}));}
    function handled(suffix){suffix=String(suffix||'');if(!suffix)return false;var end=function(id){return String(id).slice(-suffix.length)===suffix;};if(readDeleted().some(end))return true;return items.some(function(item){return item.readAt&&end(item.id);});}
    function handledRup(id){id=String(id==null?'':id);return id?handled(':inventory:'+id):false;}
    function renderItem(item){
      var card=node('article','notification-item'+(item.readAt?' is-read':''));card.dataset.level=item.level;card.dataset.notificationId=item.id;
      card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',item.title+' — ouvrir');card.addEventListener('click',function(event){var t=event.target;if(t&&t.closest&&t.closest('button,summary,details,a[href]'))return;openItem(item);});card.addEventListener('keydown',function(event){if(event.target!==card)return;if(event.key==='Enter'||event.key===' '){event.preventDefault();openItem(item);}});
      var top=node('div','notification-item-top'),source=node('span','notification-source',(item.source||'Verdict').toUpperCase()+(item.actorName?' · signalé par '+item.actorName:'')),time=node('time','notification-time',formatDate(item.createdAt));time.dateTime=item.createdAt;top.appendChild(source);top.appendChild(time);card.appendChild(top);var del=node('button','notification-delete','×');del.type='button';del.setAttribute('aria-label','Supprimer définitivement cette notification');del.title='Supprimer définitivement';del.addEventListener('click',function(){remove(item.id);});card.appendChild(del);
      card.appendChild(node('h3','',item.title));if(item.detail)card.appendChild(node('p','notification-detail',dateLisible(item.detail)));
      var meta=[];if(item.establishmentName)meta.push(item.establishmentName);if(item.demo)meta.push('démonstration fictive');if(meta.length)card.appendChild(node('p','notification-meta',meta.join(' · ')));
      if(item.proof){var details=node('details','notification-proof'),proofTitle=node('summary','',"Pourquoi cette notification ?"),proofText=node('p','',item.proof);details.appendChild(proofTitle);details.appendChild(proofText);card.appendChild(details);}
      var actions=node('div','notification-item-actions'),openAction=node('button','notification-primary',item.actionLabel||(item.module==='inventory'?'Ouvrir Inventaire':'Ouvrir Verdict'));openAction.type='button';openAction.addEventListener('click',function(){openItem(item);});actions.appendChild(openAction);
      var read=node('button','notification-secondary',item.readAt?'Lue':'Marquer comme lue');read.type='button';read.disabled=!!item.readAt;read.addEventListener('click',function(){markRead(item.id);});actions.appendChild(read);card.appendChild(actions);return card;
    }
    function render(){
      var count=unreadCount(items),fragment=document.createDocumentFragment();list.textContent='';items.forEach(function(item){fragment.appendChild(renderItem(item));});list.appendChild(fragment);
      badge.textContent=count>99?'99+':String(count);badge.hidden=count===0;button.classList.toggle('has-notifications',count>0);button.setAttribute('aria-label',count?('Notifications : '+count+' non lue'+(count>1?'s':'')):'Notifications : aucune en attente');
      if(summary)summary.textContent=count?(count+' notification'+(count>1?'s':'')+' à traiter'):'Tout est lu';empty.hidden=items.length>0;list.hidden=items.length===0;readAllButton.disabled=count===0;if(clearRead)clearRead.disabled=!items.some(function(item){return item.readAt;});setNativeBadge(visible?count:0);
    }
    function ingest(incoming){incoming=dropDeleted(incoming);var before=unreadCount(items),next=merge(items,incoming);items=next;writeStore();render();var after=unreadCount(items);if(live&&after>before)live.textContent='Nouvelle notification. '+after+' à traiter.';return items.slice();}
    function ingestMany(incoming){return ingest(Array.isArray(incoming)?incoming:[]);}
    function markAllRead(){var stamp=new Date().toISOString(),changed=false;items.forEach(function(item){if(!item.readAt){item.readAt=stamp;changed=true;}});if(changed){writeStore();render();}}
    function setVisible(value){visible=!!value;render();return visible;}
    function open(){if(opened)return;opened=true;lastFocus=document.activeElement;layer.hidden=false;button.setAttribute('aria-expanded','true');document.body.classList.add('notifications-open');window.requestAnimationFrame(function(){closeButton.focus();});}
    function close(){if(!opened)return;opened=false;layer.hidden=true;button.setAttribute('aria-expanded','false');document.body.classList.remove('notifications-open');if(lastFocus&&lastFocus.focus)try{lastFocus.focus();}catch(e){}}
    function onKey(event){if(!opened)return;if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key!=='Tab')return;var focusable=sheet.querySelectorAll('button:not([disabled]),summary,[href],[tabindex]:not([tabindex="-1"])');if(!focusable.length)return;var first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}

    button.addEventListener('click',open);closeButton.addEventListener('click',close);readAllButton.addEventListener('click',markAllRead);if(clearRead)clearRead.addEventListener('click',removeRead);layer.addEventListener('click',function(event){if(event.target===layer)close();});document.addEventListener('keydown',onKey);
    window.addEventListener('storage',function(event){if(event.key!==key)return;items=merge(readStore(),[]);render();});
    try{new MutationObserver(function(){render();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});}catch(e){}/* C277 : heures et dates suivent un changement de langue */
    items=merge(readStore(),[]);render();
    return {version:VERSION,ingest:ingest,ingestMany:ingestMany,remove:remove,removeRead:removeRead,handled:handled,handledRup:handledRup,open:open,close:close,markAllRead:markAllRead,setVisible:setVisible,getItems:function(){return items.slice();},getUnreadCount:function(){return unreadCount(items);}};
  }

  return {version:VERSION,normalize:normalize,merge:merge,unreadCount:unreadCount,create:create};
});

