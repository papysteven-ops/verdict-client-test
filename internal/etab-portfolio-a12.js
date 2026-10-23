/* Verdict® — portefeuille d'établissements (C37, 15/10/2026).
   1. Masquer de l'accueil : un établissement peut quitter la barre de l'accueil tout en restant dans « Comparer ».
   2. Nouvel établissement : Verdict demande d'abord s'il s'agit du MÊME CONCEPT qu'un établissement existant (chaîne,
      franchise, deuxième adresse) ou d'un NOUVEAU concept.
   3. Même concept = duplication : la carte, les recettes, les ingrédients, les préparations, les suppléments, les réglages
      de carte, le type et le profil sont repris ; l'inventaire (zones, produits, fournisseurs) est repris à la première
      ouverture du module Inventaire. AUCUN chiffre n'est copié (CA, charges, salaires, journées, achats, stocks comptés,
      volumes vendus) : le score de l'établissement reste bloqué tant que ses propres chiffres ne sont pas fournis
      (FEC, exercice clos ou saisie). Une copie ne peut jamais produire une note.
   4. Nouveau concept : le parcours d'origine (dossier vide, mise en route complète).
   Aucune nouvelle formule financière ; aucun réseau. */
(function(root){
'use strict';
var doc=root.document;if(!doc)return;
var DUP_KEY='verdict:inventory:duplicate-requests:v1';
var CONCEPT_KEYS=['ing','plats','preparations','supp','reg','etabType','establishmentProfile','businessDayEndHour'];
var TXT={
  fr:{more:'masqué(s)',moreTitle:'Établissements masqués de l’accueil : toucher pour les afficher',less:'Replier',
      title:'Ajouter un établissement',lead:'Verdict prépare le nouvel établissement selon votre situation.',
      same:'Même concept qu’un établissement existant',sameSub:'Chaîne, franchise, deuxième adresse : la carte, les recettes, les ingrédients et l’inventaire sont repris. Il ne reste que ses chiffres à fournir.',
      model:'Modèle fictif de démonstration',modelSub:'Un des cas sectoriels de Verdict, pour tester (aucune donnée réelle).',createBlank:'Créer l\u2019établissement',
      fresh:'Nouveau concept',freshSub:'Un établissement différent : on part d’un dossier vide, avec la mise en route complète.',
      from:'Établissement de référence',network:'Lien avec la référence',netChain:'Même enseigne (succursale)',netFranchise:'Franchise',netOther:'Autre adresse, même concept',
      name:'Nom du nouvel établissement',city:'Ville',district:'Arrondissement / quartier',districtPh:'ex. 3e arrondissement, Part-Dieu, Vieux-Port\u2026',optional:'(facultatif)',districtHelp:'Affiché à l\u2019accueil avec la ville, tel que vous l\u2019écrivez : utile quand plusieurs établissements sont dans la même ville.',
      copied:'Repris : carte, recettes, ingrédients, préparations, suppléments, réglages de carte, type et profil, inventaire (produits, zones, fournisseurs).',
      notCopied:'Jamais repris : CA, charges, salaires, journées, achats, stocks comptés, volumes vendus.',
      scoreRule:'Le score de cet établissement reste bloqué tant que ses propres chiffres ne sont pas fournis.',
      create:'Créer à partir de la référence',back:'Retour',cancel:'Annuler',
      bannerK:'Établissement dupliqué',bannerT:'Score bloqué : il manque les chiffres de cet établissement',
      bannerB:'Repris de {src} : carte, recettes, ingrédients et inventaire. Pour obtenir sa note, fournissez ses propres chiffres — le FEC suffit, ou l’exercice clos, ou la saisie.',
      fec:'Importer le FEC',entry:'Saisir ses chiffres',done:'{name} créé à partir de {src} · score bloqué jusqu’à ses chiffres',noName:'Indiquez un nom.'},
  en:{more:'hidden',moreTitle:'Establishments hidden from home: tap to show them',less:'Collapse',
      title:'Add an establishment',lead:'Verdict prepares the new establishment for your situation.',
      same:'Same concept as an existing establishment',sameSub:'Chain, franchise, second address: menu, recipes, ingredients and inventory are reused. Only its figures remain to provide.',
      model:'Fictitious demo model',modelSub:'One of Verdict\u2019s sector cases, for testing (no real data).',createBlank:'Create the establishment',
      fresh:'New concept',freshSub:'A different establishment: start from an empty file with the full setup.',
      from:'Reference establishment',network:'Link with the reference',netChain:'Same brand (branch)',netFranchise:'Franchise',netOther:'Other address, same concept',
      name:'Name of the new establishment',city:'City',district:'District / neighbourhood',districtPh:'e.g. 3rd district, Part-Dieu, Old Port\u2026',optional:'(optional)',districtHelp:'Shown on the home screen with the city, exactly as you type it: useful when several establishments are in the same city.',
      copied:'Reused: menu, recipes, ingredients, preparations, extras, menu settings, type and profile, inventory (products, zones, suppliers).',
      notCopied:'Never reused: sales, costs, wages, days, purchases, counted stock, volumes sold.',
      scoreRule:'This establishment’s score stays locked until its own figures are provided.',
      create:'Create from the reference',back:'Back',cancel:'Cancel',
      bannerK:'Duplicated establishment',bannerT:'Score locked: this establishment’s figures are missing',
      bannerB:'Reused from {src}: menu, recipes, ingredients and inventory. To get its score, provide its own figures — the FEC is enough, or the closed year, or manual entry.',
      fec:'Import the FEC',entry:'Enter its figures',done:'{name} created from {src} · score locked until its figures',noName:'Enter a name.'}
};
/* es, it, de, nl, pt — ajoutés le 16/10/2026 (langues-complements). Une clé absente reprend le français. */
(function(){var X={
es:{more:'oculto(s)',moreTitle:'Establecimientos ocultos del inicio: toque para mostrarlos',less:'Plegar',title:'Añadir un establecimiento',lead:'Verdict prepara el nuevo establecimiento según su situación.',
  same:'Mismo concepto que un establecimiento existente',sameSub:'Cadena, franquicia, segundo local: se reutilizan la carta, las recetas, los ingredientes y el inventario. Solo faltan sus cifras.',
  model:'Modelo ficticio de demostración',modelSub:'Uno de los casos sectoriales de Verdict, para probar (ningún dato real).',createBlank:'Crear el establecimiento',
  fresh:'Nuevo concepto',freshSub:'Un establecimiento diferente: se parte de un expediente vacío, con la puesta en marcha completa.',
  from:'Establecimiento de referencia',network:'Vínculo con la referencia',netChain:'Misma marca (sucursal)',netFranchise:'Franquicia',netOther:'Otra dirección, mismo concepto',
  name:'Nombre del nuevo establecimiento',city:'Ciudad',district:'Distrito / barrio',districtPh:'p. ej. centro, casco antiguo, puerto…',optional:'(opcional)',districtHelp:'Se muestra en el inicio con la ciudad, tal como lo escriba: útil cuando varios establecimientos están en la misma ciudad.',
  copied:'Reutilizado: carta, recetas, ingredientes, preparaciones, suplementos, ajustes de carta, tipo y perfil, inventario (productos, zonas, proveedores).',
  notCopied:'Nunca reutilizado: ventas, gastos, salarios, jornadas, compras, existencias contadas, volúmenes vendidos.',
  scoreRule:'La puntuación de este establecimiento queda bloqueada mientras no se aporten sus propias cifras.',
  create:'Crear a partir de la referencia',back:'Volver',cancel:'Cancelar',
  bannerK:'Establecimiento duplicado',bannerT:'Puntuación bloqueada: faltan las cifras de este establecimiento',
  bannerB:'Reutilizado de {src}: carta, recetas, ingredientes e inventario. Para obtener su nota, aporte sus propias cifras: basta con el FEC, o el ejercicio cerrado, o la introducción manual.',
  fec:'Importar el FEC',entry:'Introducir sus cifras',done:'{name} creado a partir de {src} · puntuación bloqueada hasta tener sus cifras',noName:'Indique un nombre.'},
it:{more:'nascosta/e',moreTitle:'Attività nascoste dalla home: tocchi per mostrarle',less:'Riduci',title:'Aggiungi un’attività',lead:'Verdict prepara la nuova attività in base alla sua situazione.',
  same:'Stesso concept di un’attività esistente',sameSub:'Catena, franchising, seconda sede: menu, ricette, ingredienti e inventario vengono ripresi. Restano da fornire solo i suoi numeri.',
  model:'Modello fittizio di dimostrazione',modelSub:'Uno dei casi settoriali di Verdict, per provare (nessun dato reale).',createBlank:'Crea l’attività',
  fresh:'Nuovo concept',freshSub:'Un’attività diversa: si parte da un fascicolo vuoto, con l’avvio completo.',
  from:'Attività di riferimento',network:'Legame con il riferimento',netChain:'Stessa insegna (filiale)',netFranchise:'Franchising',netOther:'Altro indirizzo, stesso concept',
  name:'Nome della nuova attività',city:'Città',district:'Quartiere / zona',districtPh:'es. centro, centro storico, porto…',optional:'(facoltativo)',districtHelp:'Mostrato nella home con la città, come lo scrive lei: utile quando più attività sono nella stessa città.',
  copied:'Ripreso: menu, ricette, ingredienti, preparazioni, supplementi, impostazioni del menu, tipo e profilo, inventario (prodotti, zone, fornitori).',
  notCopied:'Mai ripreso: fatturato, costi, salari, giornate, acquisti, scorte contate, volumi venduti.',
  scoreRule:'Il punteggio di questa attività resta bloccato finché non vengono forniti i suoi numeri.',
  create:'Crea a partire dal riferimento',back:'Indietro',cancel:'Annulla',
  bannerK:'Attività duplicata',bannerT:'Punteggio bloccato: mancano i numeri di questa attività',
  bannerB:'Ripreso da {src}: menu, ricette, ingredienti e inventario. Per ottenere il punteggio, fornisca i suoi numeri: basta il FEC, o l’esercizio chiuso, o l’inserimento.',
  fec:'Importa il FEC',entry:'Inserisci i suoi numeri',done:'{name} creata a partire da {src} · punteggio bloccato fino ai suoi numeri',noName:'Indichi un nome.'},
de:{more:'ausgeblendet',moreTitle:'Vom Startbildschirm ausgeblendete Betriebe: tippen, um sie anzuzeigen',less:'Einklappen',title:'Betrieb hinzufügen',lead:'Verdict bereitet den neuen Betrieb passend zu Ihrer Situation vor.',
  same:'Gleiches Konzept wie ein bestehender Betrieb',sameSub:'Kette, Franchise, zweiter Standort: Karte, Rezepte, Zutaten und Inventur werden übernommen. Es fehlen nur noch seine Zahlen.',
  model:'Fiktives Demo-Modell',modelSub:'Einer der Branchenfälle von Verdict, zum Testen (keine echten Daten).',createBlank:'Betrieb anlegen',
  fresh:'Neues Konzept',freshSub:'Ein anderer Betrieb: Es beginnt mit einer leeren Akte und der vollständigen Einrichtung.',
  from:'Referenzbetrieb',network:'Verbindung zur Referenz',netChain:'Gleiche Marke (Filiale)',netFranchise:'Franchise',netOther:'Andere Adresse, gleiches Konzept',
  name:'Name des neuen Betriebs',city:'Stadt',district:'Bezirk / Viertel',districtPh:'z. B. Innenstadt, Altstadt, Hafen…',optional:'(optional)',districtHelp:'Auf dem Startbildschirm mit der Stadt angezeigt, so wie Sie es schreiben: nützlich, wenn mehrere Betriebe in derselben Stadt liegen.',
  copied:'Übernommen: Karte, Rezepte, Zutaten, Zubereitungen, Extras, Karteneinstellungen, Typ und Profil, Inventur (Produkte, Zonen, Lieferanten).',
  notCopied:'Nie übernommen: Umsatz, Kosten, Löhne, Tage, Einkäufe, gezählte Bestände, verkaufte Mengen.',
  scoreRule:'Der Score dieses Betriebs bleibt gesperrt, solange seine eigenen Zahlen fehlen.',
  create:'Aus der Referenz anlegen',back:'Zurück',cancel:'Abbrechen',
  bannerK:'Duplizierter Betrieb',bannerT:'Score gesperrt: Die Zahlen dieses Betriebs fehlen',
  bannerB:'Übernommen von {src}: Karte, Rezepte, Zutaten und Inventur. Für seine Note liefern Sie seine eigenen Zahlen — die FEC-Datei genügt, oder das abgeschlossene Geschäftsjahr, oder die Eingabe.',
  fec:'FEC importieren',entry:'Zahlen eingeben',done:'{name} aus {src} angelegt · Score gesperrt bis zu seinen Zahlen',noName:'Geben Sie einen Namen ein.'},
nl:{more:'verborgen',moreTitle:'Zaken verborgen op het startscherm: tik om ze te tonen',less:'Inklappen',title:'Een zaak toevoegen',lead:'Verdict bereidt de nieuwe zaak voor volgens uw situatie.',
  same:'Zelfde concept als een bestaande zaak',sameSub:'Keten, franchise, tweede adres: kaart, recepten, ingrediënten en inventaris worden overgenomen. Alleen de cijfers ontbreken nog.',
  model:'Fictief demomodel',modelSub:'Een van de sectorgevallen van Verdict, om te testen (geen echte gegevens).',createBlank:'De zaak aanmaken',
  fresh:'Nieuw concept',freshSub:'Een andere zaak: we starten met een leeg dossier en de volledige opstart.',
  from:'Referentiezaak',network:'Band met de referentie',netChain:'Zelfde merk (filiaal)',netFranchise:'Franchise',netOther:'Ander adres, zelfde concept',
  name:'Naam van de nieuwe zaak',city:'Stad',district:'District / wijk',districtPh:'bv. centrum, oude stad, haven…',optional:'(optioneel)',districtHelp:'Op het startscherm getoond met de stad, zoals u het schrijft: handig als meerdere zaken in dezelfde stad liggen.',
  copied:'Overgenomen: kaart, recepten, ingrediënten, bereidingen, supplementen, kaartinstellingen, type en profiel, inventaris (producten, zones, leveranciers).',
  notCopied:'Nooit overgenomen: omzet, kosten, lonen, dagen, aankopen, getelde voorraden, verkochte volumes.',
  scoreRule:'De score van deze zaak blijft geblokkeerd zolang de eigen cijfers ontbreken.',
  create:'Aanmaken vanuit de referentie',back:'Terug',cancel:'Annuleren',
  bannerK:'Gedupliceerde zaak',bannerT:'Score geblokkeerd: de cijfers van deze zaak ontbreken',
  bannerB:'Overgenomen van {src}: kaart, recepten, ingrediënten en inventaris. Voor de score geeft u de eigen cijfers — het FEC-bestand volstaat, of het afgesloten boekjaar, of invoer.',
  fec:'FEC importeren',entry:'Cijfers invoeren',done:'{name} aangemaakt vanuit {src} · score geblokkeerd tot de eigen cijfers er zijn',noName:'Geef een naam op.'},
pt:{more:'oculto(s)',moreTitle:'Estabelecimentos ocultos do início: toque para os mostrar',less:'Recolher',title:'Adicionar um estabelecimento',lead:'O Verdict prepara o novo estabelecimento conforme a sua situação.',
  same:'Mesmo conceito de um estabelecimento existente',sameSub:'Cadeia, franquia, segundo endereço: o menu, as receitas, os ingredientes e o inventário são reaproveitados. Só faltam os seus números.',
  model:'Modelo fictício de demonstração',modelSub:'Um dos casos setoriais do Verdict, para testar (nenhum dado real).',createBlank:'Criar o estabelecimento',
  fresh:'Novo conceito',freshSub:'Um estabelecimento diferente: parte-se de um processo vazio, com a configuração completa.',
  from:'Estabelecimento de referência',network:'Ligação à referência',netChain:'Mesma insígnia (sucursal)',netFranchise:'Franquia',netOther:'Outro endereço, mesmo conceito',
  name:'Nome do novo estabelecimento',city:'Cidade',district:'Bairro / zona',districtPh:'ex. centro, zona histórica, porto…',optional:'(opcional)',districtHelp:'Mostrado no início com a cidade, tal como o escreve: útil quando vários estabelecimentos estão na mesma cidade.',
  copied:'Reaproveitado: menu, receitas, ingredientes, preparações, suplementos, definições do menu, tipo e perfil, inventário (produtos, zonas, fornecedores).',
  notCopied:'Nunca reaproveitado: faturação, custos, salários, dias, compras, stocks contados, volumes vendidos.',
  scoreRule:'A pontuação deste estabelecimento fica bloqueada enquanto os seus próprios números não forem fornecidos.',
  create:'Criar a partir da referência',back:'Voltar',cancel:'Cancelar',
  bannerK:'Estabelecimento duplicado',bannerT:'Pontuação bloqueada: faltam os números deste estabelecimento',
  bannerB:'Reaproveitado de {src}: menu, receitas, ingredientes e inventário. Para obter a nota, forneça os seus próprios números — basta o FEC, ou o exercício fechado, ou a introdução manual.',
  fec:'Importar o FEC',entry:'Introduzir os números',done:'{name} criado a partir de {src} · pontuação bloqueada até aos seus números',noName:'Indique um nome.'}
};
for(var l in X){var o={};for(var k in TXT.fr)o[k]=X[l][k]!==undefined?X[l][k]:TXT.fr[k];TXT[l]=o;}})();
function T(){var l=String(root.LOCALE||doc.documentElement.lang||'fr').slice(0,2);return TXT[l]||TXT.fr;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function S(){return root.STORE;}
function placeOf(d){d=d||{};return [d.etabVille,d.etabQuartier].map(function(x){return String(x==null?'':x).trim();}).filter(Boolean).join(' \u00b7 ');}
function nameOf(id){var d=S()&&S().etabs[id];if(!d)return '';try{return root.verdictEtabIdentity(d).name;}catch(e){return d.etab||id;}}
/* C218 (W74) : le prix d'un établissement en plus, celui de l'offre validée (05-BACKEND-API/src/offre.js, 05/10/2026) et de
   la fenêtre de l'offre (C212) : +39 € HT par mois ou +390 € HT par an en Pilotage, +69 € HT par mois ou +690 € HT par an
   en Pro. Le prix du niveau actif est relu dans l'appli (verdictOffrePourTier) quand elle le donne. */
var PRIX_EN_PLUS={pilotage:{m:39,a:390},pro:{m:69,a:690}};
function prixEnPlus(){
  var niveau='pro',essai=false,P={pilotage:{m:PRIX_EN_PLUS.pilotage.m,a:PRIX_EN_PLUS.pilotage.a},pro:{m:PRIX_EN_PLUS.pro.m,a:PRIX_EN_PLUS.pro.a}};
  try{if(typeof root.verdictNiveau==='function')niveau=root.verdictNiveau()==='pilotage'?'pilotage':'pro';}catch(e){}
  try{var o=typeof root.verdictOffrePourTier==='function'?root.verdictOffrePourTier():null;if(o&&o.xm>0&&o.xa>0){P[niveau].m=o.xm;P[niveau].a=o.xa;}}catch(e){}
  try{var VP=root.VerdictPlan||(root.parent&&root.parent!==root&&root.parent.VerdictPlan);essai=!!(VP&&VP.etat&&VP.etat().niveau==='essai');}catch(e){}
  var e=function(v){return v.toLocaleString('fr-FR').replace(/\s/g,' ')+' € HT';},ligne=function(k){return '+'+e(P[k].m)+' par mois, ou +'+e(P[k].a)+' par an';};
  if(essai)return 'Pendant l’essai, cet établissement est compris. Ensuite, il s’ajoute à votre abonnement : '+ligne('pro')+' en Pro ; '+ligne('pilotage')+' en Pilotage.';
  return 'Cet établissement s’ajoute à votre abonnement '+(niveau==='pilotage'?'Pilotage':'Pro')+' : '+ligne(niveau)+' en formule annuelle.';
}
function prixHtml(){var l='';try{l=prixEnPlus();}catch(e){}return l?'<p class="ne12-prix">💶 '+esc(l)+'</p>':'';}
/* C218 (W71) : un établissement qui vient d'être créé devient aussitôt celui de la coquille (barre latérale, Inventaire relié).
   Sans cela, la coquille gardait l'établissement d'origine et pouvait le réafficher sous le nom et les chiffres du nouveau.
   Le changement passe par switchEtab, que le pont de la coquille écoute (enveloppé ensuite par d'autres modules) ; le message
   « Déjà affiché » est tu. Hors de la coquille, rien à faire. */
function publierContexte(){
  try{var id=S()&&S().actif;if(!id||typeof root.switchEtab!=='function'||!(root.VerdictUnified&&root.VerdictUnified.embedded))return;
    var t=root.toast;root.toast=function(){};try{root.switchEtab(id);}finally{root.toast=t;}}catch(e){}
}

/* ── 1. Masquer de l'accueil ───────────────────────────────────────────────── */
var showAll=false;
function decorateBar(){
  var bar=doc.getElementById('etabBar');if(!bar||!S())return;
  var hiddenIds=[];
  bar.querySelectorAll('button[onclick^="switchEtab("]').forEach(function(b){
    var m=(b.getAttribute('onclick')||'').match(/switchEtab\('([^']+)'\)/);if(!m)return;var id=m[1],d=S().etabs[id];
    if(d&&d._barHidden&&id!==S().actif){hiddenIds.push(id);b.hidden=!showAll;b.classList.toggle('etab-bar-hidden',true);}
    var pl=placeOf(d),nm=b.querySelector('.enm'),old=b.querySelector('.etab-place');if(old)old.remove();
    if(pl&&nm){var sm=doc.createElement('small');sm.className='etab-place';sm.textContent=pl;nm.appendChild(sm);}
  });
  var old=bar.querySelector('button.etab-more');if(old)old.remove();
  if(hiddenIds.length){
    var t=T(),btn=doc.createElement('button');btn.type='button';btn.className='etab-more';btn.title=t.moreTitle;
    btn.textContent=showAll?t.less:'+'+hiddenIds.length+' '+t.more;
    btn.onclick=function(){showAll=!showAll;decorateBar();};
    var gear=bar.querySelector('button.gear');if(gear)bar.insertBefore(btn,gear);else bar.appendChild(btn);
  }
}

/* ── 2-4. Nouvel établissement ─────────────────────────────────────────────── */
var originalOpenNew=null;
function closeSheet(){var m=doc.getElementById('mNewEtab12');if(m&&m.parentNode)m.parentNode.removeChild(m);}
function sheet(inner){
  closeSheet();ensureStyle();
  var m=doc.createElement('div');m.className='modal on';m.id='mNewEtab12';m.innerHTML='<div class="sheet ne12">'+inner+'</div>';
  m.addEventListener('click',function(e){if(e.target===m)closeSheet();});doc.body.appendChild(m);
  try{root.a11yDialogPrepare&&root.a11yDialogPrepare(m);}catch(e){}
  return m;
}
function openChooser(){
  var t=T(),ids=typeof root.etabList==='function'?root.etabList():[];
  if(!ids.length){closeSheet();return originalOpenNew&&originalOpenNew();}
  sheet('<div class="grab"></div><h3>'+esc(t.title)+'</h3><p class="sub" style="margin:-6px 0 14px">'+esc(t.lead)+'</p>'+prixHtml()+
    '<button type="button" class="ne12-choice" onclick="verdictNewEtabSame()"><b>🔁 '+esc(t.same)+'</b><span>'+esc(t.sameSub)+'</span></button>'+
    '<button type="button" class="ne12-choice" onclick="verdictNewEtabFresh()"><b>✨ '+esc(t.fresh)+'</b><span>'+esc(t.freshSub)+'</span></button>'+
    (isTestSession()?'<button type="button" class="ne12-choice" onclick="verdictNewEtabModel()"><b>\ud83e\uddea '+esc(t.model)+'</b><span>'+esc(t.modelSub)+'</span></button>':'')+
    '<button type="button" class="btn ghost" style="margin-top:8px;width:100%" onclick="verdictNewEtabClose()">'+esc(t.cancel)+'</button>');
}
function openSame(){
  var t=T(),ids=typeof root.etabList==='function'?root.etabList():[];
  /* Les établissements réels d'abord, puis les modèles fictifs. */
  var real=ids.filter(function(id){var d=S().etabs[id];return !(d._multiSiteModel||d._testFiction||d.exempleCharge);}),others=ids.filter(function(id){return real.indexOf(id)<0;});
  var opt=function(id){return '<option value="'+esc(id)+'"'+(id===S().actif?' selected':'')+'>'+esc(nameOf(id))+'</option>';};
  sheet('<div class="grab"></div><h3>'+esc(t.same)+'</h3>'+
    '<label class="f"><span>'+esc(t.from)+'</span><select id="ne12-src">'+real.map(opt).join('')+(others.length?'<optgroup label="—">'+others.map(opt).join('')+'</optgroup>':'')+'</select></label>'+
    '<label class="f"><span>'+esc(t.network)+'</span><select id="ne12-net"><option value="chain">'+esc(t.netChain)+'</option><option value="franchise">'+esc(t.netFranchise)+'</option><option value="other">'+esc(t.netOther)+'</option></select></label>'+
    '<label class="f"><span>'+esc(t.name)+'</span><input id="ne12-nom" type="text" autocomplete="off"></label>'+
    '<label class="f"><span>'+esc(t.city)+' <span style="opacity:.6">'+esc(t.optional)+'</span></span><input id="ne12-ville" type="text" autocomplete="off"></label>'+
    '<label class="f"><span>'+esc(t.district)+' <span style="opacity:.6">'+esc(t.optional)+'</span></span><input id="ne12-quartier" type="text" autocomplete="off" placeholder="'+esc(t.districtPh)+'"></label>'+
    '<div class="ne12-rules"><p>✅ '+esc(t.copied)+'</p><p>⛔ '+esc(t.notCopied)+'</p><p><b>🔒 '+esc(t.scoreRule)+'</b></p></div>'+prixHtml()+
    '<p class="ne12-err" id="ne12-err" hidden></p>'+
    '<button type="button" class="btn" style="width:100%" onclick="verdictNewEtabCreateSame()">'+esc(t.create)+'</button>'+
    '<button type="button" class="btn ghost" style="margin-top:8px;width:100%" onclick="verdictNewEtabChooser()">'+esc(t.back)+'</button>');
  try{doc.getElementById('ne12-nom').focus({preventScroll:true});}catch(e){}
}
function isTestSession(){return root.VERDICT_TEST_SESSION===true||(typeof VERDICT_TEST_SESSION!=='undefined'&&VERDICT_TEST_SESSION===true);}
/* Nouveau concept : dossier vide. Dans le Perso (session Test), le parcours d'origine ouvre le catalogue des modèles ; on propose donc ici le formulaire vide, qui crée par createEtab(''). */
function openFresh(){
  if(!isTestSession()||typeof root.createEtab!=='function'){closeSheet();if(originalOpenNew)originalOpenNew();return;}
  var t=T();sheet('<div class="grab"></div><h3>'+esc(t.fresh)+'</h3><p class="sub" style="margin:-6px 0 12px">'+esc(t.freshSub)+'</p>'+
    '<label class="f"><span>'+esc(t.name)+'</span><input id="ne-nom" type="text" autocomplete="off"></label>'+
    '<label class="f"><span>'+esc(t.city)+' <span style="opacity:.6">'+esc(t.optional)+'</span></span><input id="ne-ville" type="text" autocomplete="off"></label>'+
    '<label class="f"><span>'+esc(t.district)+' <span style="opacity:.6">'+esc(t.optional)+'</span></span><input id="ne-quartier" type="text" autocomplete="off" placeholder="'+esc(t.districtPh)+'"></label>'+
    prixHtml()+'<button type="button" class="btn" style="width:100%" onclick="verdictNewEtabCreateBlank()">'+esc(t.createBlank)+'</button>'+
    '<button type="button" class="btn ghost" style="margin-top:8px;width:100%" onclick="verdictNewEtabChooser()">'+esc(t.back)+'</button>');
}
function openModel(){closeSheet();if(originalOpenNew)originalOpenNew();}

/* Duplication : ne reprend que le concept, jamais les chiffres. Exposée pour les tests et la mémoire du Perso. */
function duplicate(srcId,nom,ville,network,opts){
  var quartier=opts&&opts.quartier||'';
  opts=opts||{};var src=S()&&S().etabs[srcId];if(!src||typeof root.freshDB!=='function')return null;
  if(!opts.silent&&typeof root.verdictEtabCapacityAvailable==='function'&&typeof root.etabBillableList==='function'&&!root.verdictEtabCapacityAvailable(root.etabBillableList().length+1)){
    if(typeof root.verdictRequestEtabCapacity==='function')root.verdictRequestEtabCapacity(root.etabBillableList().length+1);return null;}
  var d=root.freshDB(false);
  CONCEPT_KEYS.forEach(function(k){if(src[k]!==undefined)d[k]=clone(src[k]);});
  /* Les volumes vendus appartiennent à chaque établissement : remis à zéro. */
  (d.plats||[]).forEach(function(p){p.vol=0;delete p.ventes;delete p.realVolumes;});
  d.establishmentProfile=Object.assign({},d.establishmentProfile||{},{sites:'several',network:network==='franchise'?'franchise':'chain'});
  d.etab=String(nom||'').trim().slice(0,100)||(nameOf(srcId)+' (2)');if(ville)d.etabVille=String(ville).trim().slice(0,80);
  d.etabQuartier=String(quartier||'').trim().slice(0,80);
  d._duplicatedFrom={id:srcId,name:nameOf(srcId),network:network||'chain',at:new Date().toISOString()};
  d._billing={active:true,archivedAt:''};
  var id;
  if(opts.id&&!S().etabs[opts.id]){id=opts.id;S().etabs[id]=typeof root.fixDB==='function'?root.fixDB(d):d;S().ordre.push(id);}
  else{id=root.addEtab(d,null,!opts.silent);if(!id)return null;}
  try{var req=JSON.parse(root.localStorage.getItem(DUP_KEY)||'{}');req[id]=srcId;root.localStorage.setItem(DUP_KEY,JSON.stringify(req));}catch(e){}
  if(!opts.silent){
    try{root.save&&root.save('duplicate-establishment');}catch(e){}
    /* C230 (X32) : les écrans déjà dessinés pour la référence sont périmés. Sans cette invalidation, une création lancée
       depuis la Carte (ou tout écran autre que l'Accueil) rouvrait l'Accueil de la référence : son nom, sa journée à
       compléter, ses chiffres, sous le seul bandeau du nouvel établissement. */
    try{if(typeof root.verdictInvalidateViews==='function')root.verdictInvalidateViews();}catch(e){}
    try{root.fillInputs();root.readInputs();root.drawEtabs();root.refreshAll();root.go('pil');}catch(e){}
    publierContexte();
    try{root.toast&&root.toast(T().done.replace('{name}',d.etab).replace('{src}',nameOf(srcId)));}catch(e){}
  }
  return id;
}
/* C301 (V15-065) — porte unique vers le serveur de comptes (recette L4, C303). */
/* C306 (T1 N1, T2 F1, A-C34) : dans la coque, le compte et son état peuvent venir du cadre parent. */
function lireHaut(k){try{if(root[k]!==undefined&&root[k]!==null&&root[k]!==false)return root[k];var p=root.parent;if(p&&p!==root)return p[k];}catch(e){}return root[k];}
function compteServeur(){try{var s=root.VERDICT_ACCOUNT_STATE;return (lireHaut('VERDICT_ACCOUNT_AUTH_READY')===true&&!!lireHaut('VERDICT_COMPTE')||!!(s&&s.auth===true&&s.compte))&&typeof root.fetch==='function'&&String(root.location&&root.location.protocol||'').indexOf('http')===0;}catch(e){return false;}}
/* C306 : le jeton de session (CSRF) est lu au serveur avant tout envoi. Un compte à formule fixe (Pilotage, Pro) construit son
   état depuis la coque, sans jeton : la porte le demande (/api/account « me »), le range dans l'état du compte, et le redemande
   une fois si le serveur le refuse. Le chargement le range aussi, pour les autres envois (espace, flux). */
var JETON='';
function etatCompte(){try{return root.VERDICT_ACCOUNT_STATE||null;}catch(e){return null;}}
function jetonCompte(){try{var c=lireHaut('VERDICT_COMPTE');return c&&c.connecte!==false&&c.csrf?String(c.csrf):'';}catch(e){return '';}}
function jetonConnu(){var s=etatCompte(),c=(s&&s.csrf)||JETON||jetonCompte();if(c&&s&&!s.csrf){try{s.csrf=c;}catch(e){}}return c||'';}
function panne(code){var e=new Error(code);e.c306=code;return e;}
function demanderJeton(){return root.fetch(root.VERDICT_ACCOUNT_API||'/api/account',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{"action":"me"}'})
  .then(function(r){return r.json().catch(function(){return {};});}).then(function(j){if(!j||j.authenticated!==true)throw panne('session');if(!j.csrf)throw panne('jeton');
    JETON=String(j.csrf);var s=etatCompte();if(s){try{s.csrf=JETON;}catch(e){}}return JETON;});}
function postServeur(url,body,redemande){var c=redemande?'':jetonConnu();
  return (c?Promise.resolve(c):demanderJeton()).then(function(jt){
    return root.fetch(url,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':jt},body:JSON.stringify(body)}).then(function(r){return r.json().catch(function(){return {};}).then(function(j){return {status:r.status,j:j||{}};});});
  }).then(function(o){if(o.status===403&&o.j.error==='csrf_invalid'&&!redemande){JETON='';var s=etatCompte();if(s){try{s.csrf='';}catch(e){}}return postServeur(url,body,true);}return o;});}
/* C306 : jamais d'échec muet — la vraie cause, dans une fenêtre (et une bulle si la fenêtre manque). */
function causeEchec(o){var j=(o&&o.j)||{},e=String(j.error||j.code||'');
  if((o&&o.c306)==='session'||o&&o.status===401||e==='authentication_required')return 'Votre session n’est plus ouverte dans cet onglet : reconnectez-vous depuis la page Compte, puis recommencez. Rien n’a été créé.';
  if((o&&o.c306)==='jeton'||e==='csrf_invalid')return 'Le serveur n’a pas reconnu la session de cet onglet (jeton de sécurité refusé deux fois). Rechargez la page, puis recommencez. Rien n’a été créé.';
  if(e==='mfa_required')return 'Votre compte demande la vérification en deux étapes : confirmez-la dans la page Compte, puis revenez créer l’établissement. Rien n’a été créé.';
  if(e==='forbidden')return 'Seul le propriétaire du compte peut ajouter un établissement. Rien n’a été créé.';
  if(e==='invalid_establishment')return 'Donnez un nom à l’établissement, puis recommencez. Rien n’a été créé.';
  return 'Le serveur n’a pas confirmé l’établissement'+(o&&o.status?' (réponse '+o.status+(e?' · '+e:'')+')':'')+' : rien n’a été créé. Réessayez dans un instant.';}
function echec(t){var ok=false;try{if(typeof root.ask==='function'){root.ask('Établissement non créé',t,'Compris',function(){});ok=true;}}catch(e){}dire(t);return ok;}
function centimes(v){return (Number(v||0)/100).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:2})+' € HT';}
function prixQuote(q){var m=q&&q.montantNouveau||{},per=q&&/an/.test(String(q.periode||''))?' par an':' par mois';
  return centimes(m.premier)+per+(q&&q.fondateur&&m.ensuite!=null&&m.ensuite!==m.premier?' la première année (prix fondateur), puis '+centimes(m.ensuite)+per:'');}
function dire(t){try{if(typeof root.toast==='function')root.toast(t);}catch(e){}}
function declarer(nom,suite){
  /* C306 (L4) : sans compte connecté, création sur cet appareil seulement, et c'est dit */
  if(!compteServeur()){suite();if(!lireHaut('VERDICT_COMPTE'))dire('Établissement créé sur cet appareil seulement : aucun compte connecté, il n’est pas déclaré au serveur.');return;}
  var id=typeof root.etabId==='function'?root.etabId():('e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
  function creerLocal(q){var e0=root.etabId,une=function(){root.etabId=e0;return id;};if(typeof e0==='function')root.etabId=une;try{suite();}finally{if(root.etabId===une)root.etabId=e0;}
    if(q&&q.inclus)dire(q.raison==='essai'?'Établissement inclus pendant l’essai.':'Établissement inclus dans votre abonnement.');}
  function envoyer(q,confirme){var b={action:'add_establishment',etabId:id,name:String(nom||'Nouvel établissement').slice(0,100)};if(tz)b.timezone=tz;if(confirme!=null)b.confirmedAmount=confirme;
    postServeur('/api/workspace',b).then(function(r){
      if(r.status===200&&r.j.ok!==false){creerLocal(r.j.quote||q);return;}
      if(r.status===402&&r.j.quote){demander(r.j.quote);return;}
      if(r.status===409){root.ask('Abonnement à mettre à jour','Votre abonnement est géré dans la page Compte : ajoutez-y cet établissement, puis revenez le créer ici. Rien n’a été créé.','Ouvrir mon abonnement',function(){root.location.href='../../account.html?view=abo';});return;}
      echec(causeEchec(r));
    }).catch(function(x){echec(x&&x.c306?causeEchec(x):'Le serveur de comptes ne répond pas : rien n’a été créé. Réessayez dans un instant.');});}
  function demander(q){if(q.inclus){envoyer(q,null);return;}
    root.ask('Confirmer le supplément ?','« '+String(nom||'Nouvel établissement')+' » s’ajoute à votre abonnement : '+prixQuote(q)+'. Rien n’est facturé sans cette confirmation.','Confirmer et créer',function(){envoyer(q,q.montantNouveau&&q.montantNouveau.premier);});}
  postServeur('/api/account',{action:'establishment_quote'}).then(function(r){if(r.status===200&&r.j&&typeof r.j==='object'&&r.j.ok!==false)demander(r.j);else echec(r.status===401?causeEchec(r):'Le serveur n’a pas pu chiffrer l’établissement'+(r.status?' (réponse '+r.status+')':'')+' : rien n’a été créé.');})
    .catch(function(x){echec(x&&x.c306?causeEchec(x):'Le serveur de comptes ne répond pas : rien n’a été créé. Réessayez dans un instant.');});
}
function createSame(){
  var t=T(),src=(doc.getElementById('ne12-src')||{}).value,net=(doc.getElementById('ne12-net')||{}).value,nom=((doc.getElementById('ne12-nom')||{}).value||'').trim(),ville=((doc.getElementById('ne12-ville')||{}).value||'').trim(),quartier=((doc.getElementById('ne12-quartier')||{}).value||'').trim();
  if(!nom){var e=doc.getElementById('ne12-err');if(e){e.textContent=t.noName;e.hidden=false;}return;}
  declarer(nom,function(){closeSheet();duplicate(src,nom,ville,net,{quartier:quartier});});
}

/* Fiche « Mon établissement » : champ Arrondissement / quartier juste après la ville. */
function districtField(){
  var ville=doc.getElementById('i-etabville');if(!ville)return;var lab=ville.closest('label');if(!lab||!lab.parentNode)return;var t=T(),inp=doc.getElementById('i-etabquartier');
  if(!inp){var l=doc.createElement('label');l.className='f';l.innerHTML='<span>'+esc(t.district)+'</span><input id="i-etabquartier" type="text" autocomplete="off" placeholder="'+esc(t.districtPh)+'"><small style="display:block;opacity:.7;font-size:12px;margin-top:4px">'+esc(t.districtHelp)+'</small>';lab.parentNode.insertBefore(l,lab.nextSibling);inp=l.querySelector('input');
    inp.addEventListener('change',function(){if(!root.DB)return;root.DB.etabQuartier=inp.value.trim().slice(0,80);try{root.save&&root.save('etab-place');}catch(e){}try{root.drawEtabs&&root.drawEtabs();root.refreshAll&&root.refreshAll();}catch(e){}});}
  if(doc.activeElement!==inp)inp.value=(root.DB&&root.DB.etabQuartier)||'';
}
function createBlank(){var q=((doc.getElementById('ne-quartier')||{}).value||'').trim(),nomB=((doc.getElementById('ne-nom')||{}).value||'').trim();declarer(nomB,function(){var before=S()&&S().actif;try{var ce0=root.createEtab;(ce0&&ce0.__c301orig||ce0)('');}catch(e){}closeSheet();if(S()&&S().actif!==before)publierContexte();if(q&&S()&&S().actif!==before&&root.DB){root.DB.etabQuartier=q.slice(0,80);try{root.save&&root.save('etab-place');root.drawEtabs&&root.drawEtabs();root.refreshAll&&root.refreshAll();}catch(e){}}});}
/* Bandeau d'accueil d'un établissement dupliqué tant que son score est bloqué. */
function banner(){
  var host=doc.getElementById('v-pil');if(!host)return;var old=doc.getElementById('dup12-banner');
  var d=root.DB,R=null;if(d&&d._duplicatedFrom){try{R=root.moteur();}catch(e){R=null;}}
  if(!d||!d._duplicatedFrom||(R&&R.ready)){if(old)old.remove();return;}
  var t=T(),html='<div class="dup12-k">🔒 '+esc(t.bannerK)+'</div><b>'+esc(t.bannerT)+'</b><p>'+esc(t.bannerB.replace('{src}',d._duplicatedFrom.name||''))+'</p>'+
    /* C301 (V15-131) : un seul bouton, le même que l'Accueil (même libellé, même fenêtre) */
    '<div class="dup12-actions"><button type="button" class="btn" onclick="verdictDupRef()">'+esc(({fr:'Importer mon FEC ou saisir ma situation',en:'Import my file or enter my situation',es:'Importar archivo o indicar situación',it:'Importa il file o inserisci la situazione',de:'Datei importieren oder Lage erfassen',nl:'Bestand importeren of situatie invoeren',pt:'Importar ficheiro ou indicar situação'})[String(root.LOCALE||doc.documentElement.lang||'fr').slice(0,2)]||'Importer mon FEC ou saisir ma situation')+'</button></div>';
  if(!old){old=doc.createElement('section');old.id='dup12-banner';old.className='dup12';host.insertBefore(old,host.firstChild);}
  if(old.innerHTML!==html)old.innerHTML=html;
}
/* Accueil sans lecture premium (dossier sans chiffres) : la ville et le quartier, tels que saisis, sous le titre de l'établissement. */
function placeUnderTitle(){
  var host=doc.getElementById('v-pil');if(!host||!root.DB)return;var pl=placeOf(root.DB),nm=String(root.DB.etab||'').trim(),old=doc.getElementById('etab12-place');
  var title=nm?[].slice.call(host.querySelectorAll('h1,h2')).filter(function(h){return h.offsetParent!==null&&!h.closest('.p41-cadre')&&h.textContent.trim()===nm;})[0]:null;
  if(!pl||!title){if(old)old.remove();return;}
  if(!old||old.previousElementSibling!==title){if(old)old.remove();old=doc.createElement('p');old.id='etab12-place';old.className='etab12-place';title.parentNode.insertBefore(old,title.nextSibling);}
  var txt='\ud83d\udccd '+pl;if(old.textContent!==txt)old.textContent=txt;
}
function goFec(){try{root.go('in');}catch(e){}root.setTimeout(function(){var n=doc.getElementById('v44-fec')||doc.querySelector('#v-in .card');if(n)try{n.scrollIntoView({block:'start'});}catch(e){}},300);}
function goEntry(){try{root.go('in');}catch(e){}root.setTimeout(function(){var n=doc.getElementById('i-passport');n=n?(n.closest('.card')||n):doc.querySelector('#v-in .card');if(n)try{n.scrollIntoView({block:'start'});root.scrollBy(0,-72);}catch(e){}},300);}

var styled=false;
function ensureStyle(){
  if(styled||doc.getElementById('etab12-style'))return;styled=true;
  var st=doc.createElement('style');st.id='etab12-style';st.textContent=
  '.etab12-place{margin:2px 0 8px;font-size:13.5px;font-weight:600;opacity:.8}'+
  '#etabBar .etab-place{display:block;font-size:10.5px;font-weight:600;opacity:.65;line-height:1.1;margin-top:1px;white-space:nowrap}'+
  '#etabBar button.etab-more{font-weight:700;border-style:dashed!important;opacity:.85}'+
  '.ne12 .ne12-choice{display:block;width:100%;text-align:left;padding:14px 15px;margin:0 0 10px;border-radius:14px;border:1px solid rgba(128,128,128,.3);background:rgba(128,128,128,.05);color:inherit;cursor:pointer}.ne12 .ne12-choice:hover{border-color:#2563eb}.ne12 .ne12-choice b{display:block;font-size:15px;margin-bottom:4px}.ne12 .ne12-choice span{display:block;font-size:12.5px;line-height:1.45;opacity:.78}'+
  '.ne12 select{width:100%}.ne12-rules{margin:6px 0 12px;padding:10px 12px;border-radius:12px;background:rgba(37,99,235,.06);border:1px solid rgba(37,99,235,.25);font-size:12.5px;line-height:1.45}.ne12-rules p{margin:3px 0}.ne12-err{color:#ef4444;font-size:12.5px;margin:0 0 8px}'+
  '.ne12-prix{margin:0 0 12px;padding:9px 12px;border-radius:12px;background:rgba(22,163,74,.07);border:1px solid rgba(22,163,74,.3);font-size:12.5px;line-height:1.45}'+
  /* C241 (Y08) : « Ajouter un établissement » claire en thème clair, même sans le recoloriage de la coque. */
  'html.vd-workspace-light #mNewEtab12 .sheet{background:#ffffff!important;background-image:none!important;border-color:#d5dde5!important;box-shadow:0 18px 48px rgba(16,24,40,.18)!important;color:#14202b}html.vd-workspace-light #mNewEtab12 .sh-fermer{background:#f3f5f7!important;color:#14202b!important;border-color:#cfd8e1!important}html.vd-workspace-light #mNewEtab12 h3{color:#14202b}'+
  /* C258 (T2) : « Ajouter un établissement réel » (029, #mNewEtab) claire aussi. */
  'html.vd-workspace-light #mNewEtab .sheet{background:#ffffff!important;background-image:none!important;border-color:#d5dde5!important;box-shadow:0 18px 48px rgba(16,24,40,.18)!important;color:#14202b}html.vd-workspace-light #mNewEtab .sheet h3{color:#14202b}html.vd-workspace-light #mNewEtab .btn.ghost{color:#14202b!important;border-color:#cfd8e1!important}html.vd-workspace-light #mNewEtab .sh-fermer{background:#f3f5f7!important;color:#14202b!important;border-color:#cfd8e1!important}'+
  '.dup12{margin:0 0 14px;padding:14px 15px;border-radius:16px;border:1px solid rgba(234,179,8,.6);background:rgba(234,179,8,.08)}.dup12-k{font:800 11px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:#a16207;margin-bottom:6px}.dup12 b{display:block;font-size:15.5px;margin-bottom:4px}.dup12 p{margin:0 0 10px;font-size:13px;line-height:1.5;opacity:.85}.dup12-actions{display:flex;flex-wrap:wrap;gap:8px}';
  doc.head.appendChild(st);
}

/* C258 (W75, T3) : compte créé depuis la page Compte avant d'ouvrir Pilotage — la coque envoie le site du serveur
   (« Brasserie V6 »), mais le dossier s'appelle encore « Mon établissement » et n'y est pas relié : applyContext() ne le trouve pas
   et le nom n'était jamais repris. Un seul établissement réel, au nom par défaut, sans autre lien : il prend le nom du compte. */
function parDefaut258(n){n=String(n||'').trim();return !n||/^(mon|nouvel) établissement$/i.test(n);}
function nomDuCompte(c){
  if(!c||c.demo)return false;var demo=false;try{demo=root.eval('typeof VERDICT_DEMO_SESSION!=="undefined"&&!!VERDICT_DEMO_SESSION');}catch(e){}if(demo)return false;
  var nom=String(c.name||'').trim().slice(0,100),site=String(c.siteId||'');if(!nom||parDefaut258(nom)||!site)return false;
  var S=root.STORE;if(!S||!S.etabs)return false;var ids=(Array.isArray(S.ordre)?S.ordre:Object.keys(S.etabs)).filter(function(id){return S.etabs[id];});
  if(ids.some(function(id){var e=S.etabs[id]||{};return String(e.establishmentId||'')===site||String(e.inventoryLink&&e.inventoryLink.siteId||'')===site;}))return false;
  var reels=ids.filter(function(id){var e=S.etabs[id];return !(e._demo&&e._demo.fictional)&&!e._testFiction&&!e.exempleCharge&&!e._personalModel&&!e.presentationProfile;});
  if(reels.length!==1)return false;var D=S.etabs[reels[0]];if(!parDefaut258(D.etab))return false;var lien=D.inventoryLink&&D.inventoryLink.siteId;if(lien&&lien!==site)return false;
  D.etab=nom;D.inventoryLink=Object.assign({},D.inventoryLink||{},{siteId:site,siteName:nom});
  try{root.save('etab-nom-compte');}catch(e){}try{root.fillInputs&&root.fillInputs();}catch(e){}try{root.drawEtabs&&root.drawEtabs();}catch(e){}
  try{if(typeof root.verdictInvalidateViews==='function')root.verdictInvalidateViews();root.refreshAll&&root.refreshAll();}catch(e){}try{publierContexte();}catch(e){}
  return true;
}
root.addEventListener('message',function(ev){var d=ev&&ev.data;if(!d||!d.context||(d.type!=='verdict-unified-apply-context'&&d.type!=='verdict-unified-shell-ready'))return;try{if(ev.source!==root.parent)return;}catch(e){return;}setTimeout(function(){try{nomDuCompte(d.context);}catch(e){}},0);});
/* C258 : en démonstration, la barre ne dit jamais « Mon établissement · RÉEL » (vu pendant le chargement de la démo,
   chiffres de la Brasserie Collet affichés) : un dossier réel n'existe pas dans une session de démonstration. */
(function(){var f=root.verdictEtabIdentity;if(typeof f!=='function'||f.__c258)return;var g=function(d){var r=f.apply(this,arguments);try{var demo=root.eval('typeof VERDICT_DEMO_SESSION!=="undefined"&&!!VERDICT_DEMO_SESSION');if(demo&&r&&r.kind==='RÉEL'){var x=d||{},nm=String(x.etab||'').trim();return {name:nm&&!/^mon établissement$/i.test(nm)?nm:'Démonstration',kind:'DÉMONSTRATION',context:'Démonstration fictive · aucune donnée réelle'};}}catch(e){}return r;};g.__c258=true;root.verdictEtabIdentity=g;})();
/* C289 (C285 en partie, T1) : pendant une démo, toucher la pastille de l'établissement affiché ne répond plus « Déjà affiché ·
   … · MODÈLE FICTIF » : il propose « Revenir à mon établissement », le même libellé et la même action que le bandeau (C288). */
(function(){var f=root.switchEtab;if(typeof f!=='function'||f.__c289)return;var g=function(id){
  try{var S=root.STORE,demo=root.eval('typeof VERDICT_DEMO_SESSION!=="undefined"&&!!VERDICT_DEMO_SESSION');
    if(demo&&S&&id===S.actif&&typeof root.quitterDemo==='function'&&typeof root.ask==='function'){var nm='';try{nm=root.verdictEtabIdentity(S.etabs[id]).name;}catch(e){}
      /* libellé unique de L6 (C288), dans chaque langue ; le reste de la phrase suit */
      var L={fr:['Revenir à mon établissement','Vous regardez une démonstration','Vos propres chiffres vous attendent.'],en:['Back to my business','You are viewing a demo','Your own figures are waiting for you.'],
        es:['Volver a mi establecimiento','Está viendo una demostración','Sus propias cifras le esperan.'],it:['Torna alla mia attività','Stai guardando una dimostrazione','I tuoi dati ti aspettano.'],
        de:['Zurück zu meinem Betrieb','Sie sehen eine Demo','Ihre eigenen Zahlen warten auf Sie.'],nl:['Terug naar mijn zaak','U bekijkt een demo','Uw eigen cijfers wachten op u.'],
        pt:['Voltar ao meu estabelecimento','Está a ver uma demonstração','Os seus próprios números esperam por si.']},lg=String(root.LOCALE||root.document.documentElement.lang||'fr').slice(0,2),x=L[lg]||L.fr;
      var fr=x===L.fr;root.ask(x[0]+(fr?' ?':'?'),x[1]+(nm?(fr?' (« '+nm+' »)':' (“'+nm+'”)'):'')+'. '+x[2],x[0],function(){root.quitterDemo();});return true;}
  }catch(e){}return f.apply(this,arguments);};for(var k in f)if(Object.prototype.hasOwnProperty.call(f,k))g[k]=f[k];g.__c289=true;root.switchEtab=g;})();
/* C301 (V15-023) : majValidationVisible (029) ne retire l'aide « Depuis votre compte de résultat : … €/an ÷ 12 » que
   lorsqu'il en pose une nouvelle ; un établissement sans compte de résultat gardait celle du précédent (87 000 € de
   l'équipe du coffee sous le champ de la brasserie). Toutes les aides sont retirées avant chaque passage : seules
   celles de l'établissement affiché sont reposées. */
(function(){var f=root.majValidationVisible;if(typeof f!=='function'||f.__c301)return;var g=function(){
  try{[].forEach.call(doc.querySelectorAll('.src-champ'),function(x){if(x.parentNode)x.parentNode.removeChild(x);});}catch(e){}
  return f.apply(this,arguments);};for(var k in f)if(Object.prototype.hasOwnProperty.call(f,k))g[k]=f[k];g.__c301=true;root.majValidationVisible=g;})();
/* C301 (V15-090) : la pastille Carte d'un établissement dont l'Indice Carte attend encore des données (ventes d'un mois
   complet, toutes les fiches) dit ce qui est connu — la marge de la carte — au lieu de « Non calculable ». */
(function(){var em=root.etabCarteMeta,vi=root.verdictIndicesHTML;if(typeof em!=='function'||typeof vi!=='function'||em.__c301)return;
  var W={fr:['À compléter','il reste {m} une fois les produits payés'],en:['To complete','{m} left once products are paid'],es:['Por completar','queda {m} una vez pagados los productos'],it:['Da completare','resta {m} una volta pagati i prodotti'],de:['Zu ergänzen','{m} bleiben nach Wareneinsatz'],nl:['Aan te vullen','{m} blijft over na de producten'],pt:['A completar','sobra {m} depois de pagos os produtos']};
  var nem=function(d){var r=em.apply(this,arguments);try{if(r&&r.score==null&&d){var prev=root.DB;try{root.DB=d;var st=root.carteStats();if(st&&st.ca>0&&isFinite(st.margePond))r.marge=st.margePond;}finally{root.DB=prev;}}}catch(e){}return r;};
  nem.__c301=true;root.etabCarteMeta=nem;
  var nvi=function(p,c){var h=vi.apply(this,arguments);try{/* C301 (deux indices, liste) : ce que chacun mesure quand ils divergent */var sp=p&&Number.isFinite(p.score)?p.score:null,scc=c&&Number.isFinite(c.score)?c.score:null;
      if(sp!=null&&scc!=null&&typeof h==='string'&&String(root.LOCALE||'fr').slice(0,2)==='fr'){var lig=scc>=60&&sp<60?'La carte est bonne : c’est la structure (équipe, loyer, charges) qui perd.':(scc<60&&sp>=60?'La structure tient : c’est la carte qui reste à travailler.':'');
        if(lig)h=h.replace(/<\/span>$/,'<small style="flex:1 1 100%;display:block;color:var(--mut2);font-size:11.5px">'+lig+'</small></span>');}}catch(e){}try{if(c&&c.score==null&&c.marge!=null&&typeof h==='string'){var l=String(root.LOCALE||'fr').slice(0,2),x=W[l]||W.fr,i=h.indexOf('data-index="carte"');if(i>=0){var a=h.slice(0,i),b=h.slice(i),m=(Math.round(c.marge*10)/10).toLocaleString(root.LOCALE_TAG||'fr-FR')+' %';
        b=b.replace(/(<b style="color:[^"]*">)[^<]*(<\/b>)/,'$1'+x[0]+'$2');if(b.indexOf('<small style="display:block')<0)b=b.replace('</b></span>','</b><small style="display:block;color:var(--mut2)">'+x[1].replace('{m}',m)+'</small></span>');h=a+b;}}}catch(e){}return h;};
  nvi.__c301=true;root.verdictIndicesHTML=nvi;})();
/* C301 (V15-103) : la liste des modèles ne dit plus « Le chargement remplace votre saisie actuelle » (faux : le modèle
   s'ouvre dans une démonstration isolée, l'établissement et ses chiffres restent à leur place). */
(function(){var om=root.openModeles;if(typeof om!=='function'||om.__c301)return;var g=function(){var r=om.apply(this,arguments);try{var tw=doc.createTreeWalker(doc.body,4,null),n,L=[];while((n=tw.nextNode()))if(n.nodeValue.indexOf('Le chargement remplace votre saisie actuelle.')>=0)L.push(n);L.forEach(function(x){x.nodeValue=x.nodeValue.replace('Le chargement remplace votre saisie actuelle.','Chaque modèle s’ouvre dans une démonstration isolée : votre établissement et vos chiffres restent à leur place.');});}catch(e){}return r;};for(var k in om)if(Object.prototype.hasOwnProperty.call(om,k))g[k]=om[k];g.__c301=true;root.openModeles=g;})();
/* C301 (V15-065) : « Créer l’établissement réel » (029) passe par la même porte ; jamais pour un modèle */
(function(){var ce=root.createEtab;if(typeof ce!=='function'||ce.__c301)return;var g=function(modele){if(modele)return ce.apply(this,arguments);var s=this,a=arguments,n=((doc.getElementById('ne-nom')||{}).value||'').trim();declarer(n,function(){ce.apply(s,a);});};g.__c301=true;g.__c301orig=ce;root.createEtab=g;})();
root.VerdictDeclarerEtab=declarer;
/* C306 : au chargement et à chaque relecture du compte, un compte connecté reçoit son jeton (les envois à l'espace et aux flux
   ne reviennent plus en 403 csrf_invalid). Le jeton que la configuration du serveur donne (VERDICT_COMPTE.csrf, L4) passe en premier. */
(function(){var vu=null;function remplir(){try{var s=etatCompte();if(!s||s.auth!==true||s.csrf||!compteServeur())return;if(JETON||jetonCompte()){s.csrf=JETON||jetonCompte();return;}if(vu===s)return;vu=s;demanderJeton().catch(function(){vu=null;});}catch(e){}}
  function brancher(){var f=root.verdictAccountRefresh;if(typeof f!=='function'||f.__c306)return !!f;var g=function(){var p=f.apply(this,arguments);try{if(p&&typeof p.then==='function')p.then(function(){remplir();});else remplir();}catch(e){}return p;};g.__c306=true;root.verdictAccountRefresh=g;return true;}
  brancher();remplir();var n=0;if(typeof root.setInterval==='function'){var t=root.setInterval(function(){brancher();remplir();if(++n>=30)root.clearInterval(t);},1000);}})();
/* C306 (B F3) : le rappel « Protégez votre historique » s'ouvre en haut, à l'endroit du « + » de la barre : un appui donné juste
   avant son apparition ne télécharge plus une sauvegarde. Le rappel attend la fin du geste en cours et ignore ses boutons
   pendant ses 800 premières millisecondes. */
(function(){var geste=0;if(!doc||!doc.addEventListener)return;doc.addEventListener('pointerdown',function(){geste=Date.now();},true);
  doc.addEventListener('click',function(e){var t=e.target,m=t&&t.closest&&t.closest('#mBackupReminder');if(!m)return;if(t.closest('button')&&Date.now()-Number(m.getAttribute('data-c306')||0)<800){e.preventDefault();e.stopImmediatePropagation();}},true);
  function brancher(){var f=root.verdictMaybeRemindBackup;if(typeof f!=='function'||f.__c306)return !!f;var g=function(){if(Date.now()-geste<1500){root.setTimeout(root.verdictMaybeRemindBackup,4000);return;}var r=f.apply(this,arguments);try{var m=doc.getElementById('mBackupReminder');if(m&&!m.getAttribute('data-c306'))m.setAttribute('data-c306',String(Date.now()));}catch(e){}return r;};g.__c306=true;root.verdictMaybeRemindBackup=g;return true;}
  if(!brancher()&&typeof root.setInterval==='function'){var k=0,t=root.setInterval(function(){if(brancher()||++k>20)root.clearInterval(t);},500);}})();
root.VerdictNomCompte=nomDuCompte;root.verdictNewEtabChooser=openChooser;root.verdictNewEtabModel=openModel;root.verdictNewEtabSame=openSame;root.verdictNewEtabFresh=openFresh;root.verdictNewEtabClose=closeSheet;
root.verdictNewEtabCreateSame=createSame;root.verdictNewEtabCreateBlank=createBlank;root.verdictEtabDuplicate=duplicate;root.verdictDupFec=goFec;root.verdictDupEntry=goEntry;root.verdictDupRef=function(){try{if(typeof root.openRef==='function'){root.openRef();return;}}catch(e){}goFec();};
root.VerdictEtabPortfolio={conceptKeys:CONCEPT_KEYS.slice(),duplicate:duplicate,duplicateRequestsKey:DUP_KEY,placeOf:placeOf};

function hook(){
  if(typeof root.drawEtabs!=='function'||typeof root.openNewEtab!=='function'||typeof root.refreshAll!=='function')return false;
  if(!root.drawEtabs.__etab12){var od=root.drawEtabs,wd=function(){var r=od.apply(this,arguments);try{ensureStyle();decorateBar();}catch(e){}return r;};wd.__etab12=true;root.drawEtabs=wd;}
  if(!root.openNewEtab.__etab12){originalOpenNew=root.openNewEtab;var wn=function(){
    /* Démonstration et quotas : le parcours d'origine garde la main. */
    if(!isTestSession()&&typeof root.modeleDansDemonstration==='function'&&root.modeleDansDemonstration())return originalOpenNew.apply(this,arguments);
    if(typeof root.verdictEtabCapacityAvailable==='function'&&typeof root.etabBillableList==='function'&&!root.verdictEtabCapacityAvailable(root.etabBillableList().length+1))return originalOpenNew.apply(this,arguments);
    return openChooser();};wn.__etab12=true;root.openNewEtab=wn;}
  /* C218 (W71) : le parcours d'origine « Nouveau concept » (createEtab) publie lui aussi le nouvel établissement à la coquille. */
  if(typeof root.createEtab==='function'&&!root.createEtab.__etab12){var oce=root.createEtab,wce=function(){var avant=S()&&S().actif,r=oce.apply(this,arguments);try{if(S()&&S().actif!==avant){/* C230 (X32) : même invalidation que « Même concept » */if(typeof root.verdictInvalidateViews==='function'){root.verdictInvalidateViews();root.refreshAll();}publierContexte();}}catch(e){}return r;};wce.__etab12=true;root.createEtab=wce;}
  if(!root.refreshAll.__etab12){var orf=root.refreshAll,wr=function(){var r=orf.apply(this,arguments);try{ensureStyle();banner();districtField();placeUnderTitle();}catch(e){}return r;};wr.__etab12=true;root.refreshAll=wr;}
  try{ensureStyle();decorateBar();banner();districtField();placeUnderTitle();}catch(e){}
  /* Le titre de l'accueil est redessiné après un changement d'établissement : la ligne ville · quartier suit chaque rendu. */
  try{var vp=doc.getElementById('v-pil');if(vp&&root.MutationObserver&&!vp.__etab12Obs){var pend=0;vp.__etab12Obs=new root.MutationObserver(function(){if(pend)return;pend=1;root.setTimeout(function(){pend=0;try{placeUnderTitle();}catch(e){}},60);});vp.__etab12Obs.observe(vp,{childList:true,subtree:true,characterData:true});}}catch(e){}
  return true;
}
if(!hook()){var tries=0,iv=root.setInterval(function(){if(hook()||++tries>40)root.clearInterval(iv);},250);}
})(window);
