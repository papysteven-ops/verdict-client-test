
/* Verdict R34 — protection additive, aucun changement des données métier. */
(function(w,d){
'use strict';
var copy={
 fr:{install:'Avant de saisir vos chiffres',how:'Dans Safari, ouvrez Partager puis Sur l’écran d’accueil. Ouvrez ensuite Verdict depuis cette icône avant de commencer.',separate:'Les chiffres saisis dans Safari ne sont pas automatiquement transférés à l’app installée. Si vous avez déjà commencé, téléchargez une sauvegarde avant de changer.',later:'Continuer ici',quota:'L’espace accordé à Verdict est presque plein. Téléchargez une sauvegarde de vos données.',backup:'Télécharger ma sauvegarde'},
 en:{install:'Before entering your figures',how:'In Safari, open Share, then Add to Home Screen. Open Verdict from that icon before starting.',separate:'Figures entered in Safari are not automatically transferred to the installed app. If you have already started, download a backup before switching.',later:'Continue here',quota:'The storage allocated to Verdict is nearly full. Download a backup of your data.',backup:'Download my backup'},
 es:{install:'Antes de introducir sus cifras',how:'En Safari, abra Compartir y luego Añadir a pantalla de inicio. Abra Verdict desde ese icono antes de empezar.',separate:'Los datos de Safari no se transfieren automáticamente a la app instalada. Si ya ha empezado, descargue una copia de seguridad antes de cambiar.',later:'Continuar aquí',quota:'El espacio asignado a Verdict está casi lleno. Descargue una copia de seguridad de sus datos.',backup:'Descargar mi copia'},
 it:{install:'Prima di inserire i dati',how:'In Safari, apra Condividi e poi Aggiungi alla schermata Home. Apra Verdict da questa icona prima di iniziare.',separate:'I dati inseriti in Safari non vengono trasferiti automaticamente all’app installata. Se ha già iniziato, scarichi una copia di sicurezza prima di cambiare.',later:'Continua qui',quota:'Lo spazio assegnato a Verdict è quasi pieno. Scarichi una copia di sicurezza dei dati.',backup:'Scarica la mia copia'},
 de:{install:'Bevor Sie Ihre Zahlen eingeben',how:'Öffnen Sie in Safari Teilen und dann Zum Home-Bildschirm. Öffnen Sie Verdict über dieses Symbol, bevor Sie beginnen.',separate:'In Safari eingegebene Daten werden nicht automatisch in die installierte App übertragen. Laden Sie vor dem Wechsel eine Sicherung herunter, falls Sie bereits begonnen haben.',later:'Hier fortfahren',quota:'Der für Verdict verfügbare Speicher ist fast voll. Laden Sie eine Sicherung Ihrer Daten herunter.',backup:'Sicherung herunterladen'},
 nl:{install:'Voordat u uw cijfers invoert',how:'Open in Safari Deel en daarna Zet op beginscherm. Open Verdict via dat pictogram voordat u begint.',separate:'Cijfers uit Safari worden niet automatisch overgezet naar de geïnstalleerde app. Download eerst een back-up als u al bent begonnen.',later:'Hier doorgaan',quota:'De opslagruimte voor Verdict is bijna vol. Download een back-up van uw gegevens.',backup:'Mijn back-up downloaden'},
 pt:{install:'Antes de introduzir os seus números',how:'No Safari, abra Partilhar e depois Adicionar ao ecrã principal. Abra o Verdict através desse ícone antes de começar.',separate:'Os dados introduzidos no Safari não são transferidos automaticamente para a aplicação instalada. Se já começou, descarregue uma cópia de segurança antes de mudar.',later:'Continuar aqui',quota:'O espaço atribuído ao Verdict está quase cheio. Descarregue uma cópia de segurança dos seus dados.',backup:'Descarregar a minha cópia'}
};
var high=false,lastCheck=0,pending=false,dismissed=false;
try{dismissed=sessionStorage.getItem('verdict:install-advice:r34')==='dismissed';}catch(e){}
function words(){return copy[typeof w.LOCALE==='string'?w.LOCALE:'fr']||copy.fr;}
function demo(){return !!(w.VERDICT_PRESENTATION_PROFILE||w.VERDICT_DEMO_SESSION||w.VERDICT_TEST_SESSION);}
function installed(){try{return w.navigator.standalone===true||w.matchMedia('(display-mode: standalone)').matches||(w.parent!==w&&(w.parent.navigator.standalone===true||w.parent.matchMedia('(display-mode: standalone)').matches));}catch(e){return false;}}
function element(tag,text){var e=d.createElement(tag);if(text)e.textContent=text;return e;}
function card(id){var e=element('section');e.id=id;e.className='card';e.style.cssText='margin:12px 0;padding:16px;border:1px solid var(--border,#47515c);border-radius:16px;background:#10161c;color:#eef2f6';return e;}
/* V2 : dans un aperçu intégré (lien claude.ai, cadre d’un autre site), « Sur l’écran d’accueil » installerait la page
   hôte et non Verdict : le conseil serait faux et bloquerait l’entrée. Il n’est donné que si Verdict est la page ouverte. */
function embedded(){try{var shell=w.parent!==w?w.parent:w;return shell.parent!==shell;}catch(e){return true;}}
function install(host){
 if(!host||demo()||dismissed||installed()||embedded()||!/iPhone|iPad|iPod/.test(w.navigator.userAgent||''))return false;
 var old=d.getElementById('verdictInstallAdvice');if(old)old.remove();
 var t=words(),e=card('verdictInstallAdvice');e.appendChild(element('h3',t.install));e.appendChild(element('p',t.how));e.appendChild(element('p',t.separate));
 var b=element('button',t.later);b.type='button';b.className='btn sec';b.style.minHeight='44px';b.onclick=function(){dismissed=true;try{sessionStorage.setItem('verdict:install-advice:r34','dismissed');}catch(x){}e.remove();};e.appendChild(b);host.insertBefore(e,host.firstChild);return true;
}
function render(){
 renderDraft();
 var old=d.getElementById('verdictStorageAdvice');
 if(!high||demo()){if(old)old.remove();return;}
 var host=d.querySelector('.view.on');if(!host)return;
 if(old&&old.parentNode===host&&old.getAttribute('data-locale')===String(w.LOCALE||'fr'))return;
 if(old)old.remove();var t=words(),e=card('verdictStorageAdvice');e.setAttribute('data-locale',String(w.LOCALE||'fr')); e.setAttribute('role','status');e.appendChild(element('p',t.quota));
 if(typeof w.backup==='function'){var b=element('button',t.backup);b.type='button';b.className='btn sec';b.style.minHeight='44px';b.onclick=function(){w.backup();};e.appendChild(b);}
 host.insertBefore(e,host.firstChild);
}
var draftCopy={fr:['Une saisie non validée a été conservée.','Reprendre ma saisie','Brouillon repris : vérifiez les chiffres avant de les valider.'],en:['An unfinished entry has been saved.','Resume my entry','Draft restored: check the figures before confirming.'],es:['Se ha guardado una entrada sin confirmar.','Retomar mi entrada','Borrador recuperado: revise las cifras antes de confirmar.'],it:['È stata conservata una voce non confermata.','Riprendi la mia voce','Bozza ripristinata: controlli i dati prima di confermare.'],de:['Eine noch nicht bestätigte Eingabe wurde gespeichert.','Eingabe fortsetzen','Entwurf wiederhergestellt: Prüfen Sie die Zahlen vor der Bestätigung.'],nl:['Een nog niet bevestigde invoer is bewaard.','Mijn invoer hervatten','Concept hersteld: controleer de cijfers voordat u bevestigt.'],pt:['Foi guardada uma introdução por confirmar.','Retomar a minha introdução','Rascunho recuperado: confira os números antes de confirmar.']};
var resumedKey='';
function draftKey(){return !demo()&&w.SAVE===true&&w.STORE&&w.STORE.actif&&typeof w.verdictClientAuxKey==='function'?w.verdictClientAuxKey('economic-input-draft',w.STORE.actif):'';}
function readDraft(){var key=draftKey();if(!key)return {};try{var value=JSON.parse(w.localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch(e){return {};}}
function writeDraft(value){var key=draftKey();if(!key)return false;try{if(Object.keys(value).length)w.localStorage.setItem(key,JSON.stringify(value));else w.localStorage.removeItem(key);return true;}catch(e){return false;}}
function captureDraft(event){var el=event&&event.target;if(!el||!Array.isArray(w.FIELDS)||w.FIELDS.indexOf(String(el.id||'').slice(2))<0||String(el.id||'').slice(0,2)!=='i-')return;var value=readDraft();value[el.id]=String(el.value);writeDraft(value);}
function committed(){
 var value=readDraft(),changed=false;
 Object.keys(value).forEach(function(id){var key=id.slice(2),el=d.getElementById(id);if(!Array.isArray(w.FIELDS)||w.FIELDS.indexOf(key)<0||typeof w.num!=='function')return;var number=value[id]===''?null:w.num(value[id]);if(el&&el.classList.contains('bad'))return;if(w.DB&&w.DB.in&&w.DB.in[key]===number){delete value[id];changed=true;}});
 if(changed)writeDraft(value);
}
function renderDraft(){
 var value=readDraft(),ids=Object.keys(value).filter(function(id){return id.slice(0,2)==='i-'&&Array.isArray(w.FIELDS)&&w.FIELDS.indexOf(id.slice(2))>=0&&typeof value[id]==='string';});
 var old=d.getElementById('verdictInputDraft'),host=d.querySelector('.view.on'),key=draftKey(),inside=host&&host.id==='v-in';
 if(!ids.length||!host||(inside&&resumedKey!==key)){if(old)old.remove();return;}
 var locale=String(w.LOCALE||'fr'),kind=inside?'review':'resume';if(old&&old.parentNode===host&&old.getAttribute('data-kind')===kind&&old.getAttribute('data-locale')===locale)return;if(old)old.remove();
 var text=draftCopy[locale]||draftCopy.fr,e=card('verdictInputDraft');e.setAttribute('data-kind',kind);e.setAttribute('data-locale',locale);e.appendChild(element('p',text[inside?2:0]));
 if(!inside){var b=element('button',text[1]);b.type='button';b.className='btn sec';b.style.minHeight='44px';b.onclick=function(){if(typeof w.go!=='function')return;w.go('in');if(typeof w.VERDICT_SCROLL_EPOCH==='number')w.VERDICT_SCROLL_EPOCH++;ids.forEach(function(id){var field=d.getElementById(id);if(field)field.value=value[id];});resumedKey=key;renderDraft();var first=d.getElementById(ids[0]);if(first){first.focus();try{first.scrollIntoView({block:'center',behavior:'auto'});}catch(x){}}};e.appendChild(b);}
 host.insertBefore(e,host.firstChild);
}

function check(){
 var storage=w.navigator.storage;if(!storage||typeof storage.estimate!=='function'||pending||demo())return Promise.resolve(false);
 var now=Date.now();if(lastCheck&&now-lastCheck<60000)return Promise.resolve(high);lastCheck=now;pending=true;
 return Promise.resolve().then(function(){return storage.estimate();}).then(function(x){
  if(x&&Number.isFinite(x.usage)&&Number.isFinite(x.quota)&&x.usage>=0&&x.quota>0){high=x.usage/x.quota>=0.8;render();}return high;
 }).catch(function(){return false;}).then(function(value){pending=false;return value;});
}
w.VerdictDataGuard=Object.freeze({install:install,check:check,render:render,committed:committed});
d.addEventListener('input',captureDraft,{passive:true});d.addEventListener('input',check,{passive:true});d.addEventListener('click',render,{passive:true});
d.addEventListener('visibilitychange',function(){if(!d.hidden){lastCheck=0;check();}});
w.addEventListener('pageshow',function(){lastCheck=0;check();});w.addEventListener('storage',function(){lastCheck=0;check();});
install(d.getElementById('refP'));renderDraft();check();
})(window,document);

