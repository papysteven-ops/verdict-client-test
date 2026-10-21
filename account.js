"use strict";
/* Page Compte. C215 (21/10/2026, W38 à W45) : un seul essai de 14 jours, porté par le compte et démarré à sa création ;
   la formule, l'échéance et « Gérer ou résilier » en clair ; des phrases en français à la place des codes du serveur ;
   le total pour N établissements ; rien n'est affiché comme « connecté » avant le code de double authentification ;
   les liens avec paramètres (?reset, ?verify, ?mode, ?return, ?view=abo) sont lus. */
(function(){
  const byId=id=>document.getElementById(id),params=new URLSearchParams(location.search);
  const state={mode:"login",csrf:"",user:null,workspace:null,mfaPending:false,emailDelivery:"",authReady:window.VERDICT_ACCOUNT_AUTH_READY===true||window.VERDICT_ACCOUNT_PORTAL_READY===true,billingReady:window.VERDICT_ACCOUNT_PORTAL_READY===true};
  /* Offre validée le 05/10/2026 (05-BACKEND-API/src/offre.js), en centimes HT. */
  const OFFRE={pilotage:{monthly:6900,annual:69000,extraMonthly:3900,extraAnnual:39000},pro:{monthly:12900,annual:129000,extraMonthly:6900,extraAnnual:69000}};
  const MESSAGES={
    invalid_credentials:"Adresse ou mot de passe incorrect.",
    email_exists:"Un compte existe déjà avec cette adresse. Connectez-vous, ou choisissez « Mot de passe oublié ».",
    weak_password:"Mot de passe trop faible : 12 caractères au moins, avec une majuscule, une minuscule et un chiffre.",
    invalid_email:"Cette adresse e-mail n’est pas valide.",
    invalid_or_expired_token:"Ce lien n’est plus valable. Demandez-en un nouveau.",
    rate_limited:"Trop d’essais en peu de temps. Réessayez dans une minute.",
    too_many_attempts:"Trop d’essais. Réessayez dans quelques minutes.",
    busy:"Le serveur est très occupé. Réessayez dans un instant.",
    authentication_required:"Votre session a pris fin. Connectez-vous à nouveau.",
    csrf_invalid:"Votre session doit être rafraîchie : rechargez la page.",
    mfa_required:"Entrez d’abord le code de votre application d’authentification.",
    stripe_not_configured:"Le paiement en ligne n’est pas encore ouvert.",
    stripe_request_failed:"Le paiement est momentanément indisponible. Réessayez plus tard.",
    missing_customer:"Aucun abonnement à gérer pour l’instant.",
    invalid_checkout:"Choix d’offre incomplet : vérifiez le nombre d’établissements.",
    account_not_found:"Cette adresse doit d’abord créer un compte Verdict.",
    forbidden:"Action réservée au propriétaire du compte.",
    origin_forbidden:"Cette page doit être ouverte depuis l’adresse de Verdict.",
    service_unavailable:"Service momentanément indisponible. Réessayez dans un instant."
  };
  const texte=value=>{const code=String(value||"");return MESSAGES[code]||(/^[a-z0-9_]+$/.test(code)?"Action impossible pour l’instant. Réessayez dans un instant.":code);};
  const feedback=(message,kind="")=>{const node=byId("feedback");node.textContent=message||"";node.className="feedback "+kind;};
  const show=(id,visible)=>{const node=byId(id);if(node)node.hidden=!visible;};
  /* Un lien de réinitialisation ou de confirmation ne sert qu'une fois : l'adresse est nettoyée après usage. */
  const cleanUrl=()=>{try{if(typeof history!=="undefined"&&history.replaceState)history.replaceState(null,"",location.pathname);}catch(error){}};
  function euros(cents){const value=Math.round(Number(cents)||0)/100;return value.toLocaleString("fr-FR",{minimumFractionDigits:value%1?2:0,maximumFractionDigits:2}).replace(/[  ]/g," ")+" €";}
  function jour(seconds){const n=Number(seconds)||0;if(!n)return "";const d=new Date(n*1000),day=Number(d.toLocaleDateString("fr-FR",{day:"numeric",timeZone:"Europe/Paris"}));return (day===1?"1er":String(day))+" "+d.toLocaleDateString("fr-FR",{month:"long",year:"numeric",timeZone:"Europe/Paris"});}
  const pluriel=(n,mot)=>n+" "+mot+(n>1?"s":"");
  function total(offre,period,count){const P=OFFRE[offre==="pilotage"?"pilotage":"pro"],annual=period==="annual";return (annual?P.annual:P.monthly)+Math.max(0,count-1)*(annual?P.extraAnnual:P.extraMonthly);}
  async function call(endpoint,action,data={}){const headers={"Content-Type":"application/json"};if(state.csrf)headers["X-CSRF-Token"]=state.csrf;const response=await fetch(endpoint,{method:"POST",credentials:"same-origin",headers,body:JSON.stringify({action,...data})}),json=await response.json().catch(()=>({}));if(!response.ok||json.ok===false){const error=new Error(json.error||json.code||"service_unavailable");error.status=response.status;throw error;}if(json.csrf)state.csrf=json.csrf;if(json.user)state.user=json.user;return json;}
  const request=(action,data)=>call(window.VERDICT_ACCOUNT_API||"/api/account",action,data);
  const workspaceRequest=(action,data)=>call(window.VERDICT_WORKSPACE_API||"/api/workspace",action,data);
  window.VERDICT_ACCOUNT_BRIDGE={call,currentUser:()=>state.user};
  function mode(next){state.mode=next;document.querySelectorAll("[data-mode]").forEach(button=>button.classList.toggle("active",button.dataset.mode===next));show("password-row",next!=="forgot");show("password-hint",next==="register"||next==="reset");show("confirm-row",next==="register"||next==="reset");show("token-row",next==="reset"&&!byId("reset-token").value);byId("password").autocomplete=next==="login"?"current-password":"new-password";byId("auth-submit").textContent=next==="login"?"Se connecter":next==="register"?"Créer mon compte et commencer l’essai":next==="forgot"?"Recevoir un lien":"Changer le mot de passe";byId("auth-intro").textContent=next==="register"?"Votre essai de 14 jours de Verdict Pro commence dès la création du compte, sans carte bancaire. À la fin, rien n’est prélevé.":next==="forgot"?"Indiquez l’adresse de votre compte : un lien pour choisir un nouveau mot de passe vous sera proposé.":next==="reset"?"Choisissez votre nouveau mot de passe.":"";feedback("");}
  function option(select,value,label){const node=document.createElement("option");node.value=value;node.textContent=label;select.appendChild(node);}

  /* ── Formule, échéance, « Gérer ou résilier » ── */
  function formule(user){if(user.formule)return user.formule;const s=user.access_state;return s==="trial_active"?"essai":["paid","grace"].includes(s)?(user.tier==="pilotage"?"pilotage":"pro"):"inventaire";}
  function renderPlan(user){
    const f=formule(user),s=user.access_state,sites=Math.max(1,Number(user.active_establishments)||1),period=user.subscription_period==="annual"?"annual":"monthly";
    const noms={essai:"Essai Verdict Pro",pilotage:"Verdict Pilotage",pro:"Verdict Pro",activation:"Paiement reçu",inventaire:"Inventaire gratuit"};
    byId("plan-name").textContent=noms[f]||noms.inventaire;
    let detail="",deadline="";
    if(f==="essai"){const n=Math.max(0,Number(user.trial_days_left)||0);detail="Tout Verdict est ouvert : Pilotage, Carte, Audit, Simuler, Vera et l’Inventaire. "+(n?"Encore "+pluriel(n,"jour")+".":"Dernier jour.");deadline="Fin de l’essai : "+jour(user.trial_ends_at)+". À la fin, rien n’est prélevé ; sans formule choisie, vous gardez l’Inventaire gratuit.";}
    else if(f==="activation"){detail="Stripe confirme votre abonnement : l’accès s’ouvre dès cette confirmation, en général en quelques secondes. Rechargez la page si besoin.";}
    else if(f==="pilotage"||f==="pro"){detail=(period==="annual"?"Paiement annuel":"Paiement mensuel")+" · "+pluriel(sites,"établissement")+" "+(sites>1?"actifs":"actif")+" · "+euros(total(f,period,sites))+" HT"+(period==="annual"?"/an":"/mois")+(user.founder_price_lock?" (avant remise fondateur)":"")+".";
      if(s==="grace")detail+=" Le dernier paiement n’est pas passé : mettez à jour votre moyen de paiement dans « Gérer ou résilier ». Vos données restent lisibles.";
      deadline=user.cancel_at_period_end===true?"Résiliation prévue : accès jusqu’au "+jour(user.current_period_end)+", puis Inventaire gratuit. Aucun autre prélèvement.":user.current_period_end?"Prochaine échéance : "+jour(user.current_period_end)+".":"";}
    else if(s==="expired"&&Number(user.trial_ends_at)>0&&!user.has_subscription){detail="Votre essai s’est terminé le "+jour(user.trial_ends_at)+". Vos données sont conservées et l’Inventaire reste gratuit. Pour retrouver Pilotage ou Pro, choisissez une formule ci-dessous.";}
    else if(s==="expired"){detail="Votre abonnement est terminé. Vos données sont conservées et l’Inventaire reste gratuit. Pour retrouver Pilotage ou Pro, choisissez une formule ci-dessous.";}
    else if(s==="billing_issue"){detail="Un paiement est à régulariser : ouvrez « Gérer ou résilier » pour mettre à jour votre moyen de paiement. Vos données sont conservées.";}
    else if(s==="trial_eligible"){detail="Votre essai de 14 jours n’a pas encore commencé.";}
    else detail="L’Inventaire est gratuit, sans limite de durée.";
    byId("plan-detail").textContent=detail;byId("plan-deadline").textContent=deadline;show("plan-deadline",!!deadline);
    byId("plan-founder").textContent=user.founder_price_lock?"Prix fondateur : 69 € HT/mois la première année, puis 99 € HT/mois (ou 690 € puis 990 € HT/an), tant que l’abonnement reste actif. Résilier fait perdre ce prix.":"";show("plan-founder",!!user.founder_price_lock);
    show("start-trial",s==="trial_eligible");
    const portal=byId("billing-portal"),canManage=!!user.has_billing_profile&&state.billingReady;portal.disabled=!canManage;
    byId("billing-note").textContent=canManage?"Changer de formule, de moyen de paiement ou résilier : sur la page sécurisée de Stripe. Une résiliation prend effet à la fin de la période payée.":user.has_billing_profile?"La gestion de l’abonnement s’ouvre avec le paiement en ligne.":f==="essai"?"Aucun abonnement en cours, donc rien à résilier : l’essai s’arrête seul, sans prélèvement.":"Aucun abonnement en cours.";
  }
  function renderEmail(user){
    const node=byId("email-state"),verified=user.email_verified===true,delivery=state.emailDelivery;
    node.textContent=verified?"Adresse e-mail confirmée.":delivery==="email"?"Adresse à confirmer : ouvrez le lien reçu par e-mail.":delivery==="local"?"Adresse à confirmer. Développement : aucun e-mail ne part, le lien est dans la boîte locale.":"Adresse à confirmer : l’envoi des e-mails n’est pas encore activé.";
    if(!verified&&delivery==="local"&&typeof node.append==="function"){const link=document.createElement("a");link.href="/dev/boite-locale";link.textContent=" Ouvrir la boîte locale";node.append(link);}
    show("resend-verification",!verified&&(delivery==="email"||delivery==="local"));
  }
  function renderTotals(){
    const count=Math.max(1,Math.min(500,Math.floor(Number(byId("active-sites").value)||1)));
    document.querySelectorAll("[data-checkout]").forEach(button=>{const node=typeof button.querySelector==="function"?button.querySelector("[data-total]"):null;if(!node)return;const period=button.dataset.checkout==="annual"?"annual":"monthly";node.textContent="Total : "+euros(total(button.dataset.offre,period,count))+" HT"+(period==="annual"?"/an":"/mois")+" pour "+pluriel(count,"établissement");});
  }
  function renderOffers(){document.querySelectorAll("[data-checkout]").forEach(button=>button.disabled=!state.billingReady);byId("offers-state").textContent=state.billingReady?"":"Le paiement en ligne n’est pas encore ouvert : ces formules pourront être choisies ici dès son ouverture."+(state.user&&formule(state.user)==="essai"?" Votre essai continue d’ici là.":"");renderTotals();}

  /* ── Équipe ── */
  function renderWorkspace(workspace){
    state.workspace=workspace;const panel=byId("workspace-panel"),organisations=workspace&&workspace.organisations||[],sites=organisations.flatMap(org=>org.sites.map(site=>({...site,organisationId:org.id,organisationName:org.name}))),manageable=organisations.find(org=>Array.isArray(org.members));panel.hidden=false;byId("workspace-summary").textContent=sites.length?(sites.length>1?`${sites.length} établissements dans votre compte. Les onglets sont calculés par rôle côté serveur.`:`${sites.length} établissement dans votre compte. Les onglets sont calculés par rôle côté serveur.`):"Aucun établissement dans votre compte pour l’instant : ils y arrivent quand vous ouvrez Verdict sur votre appareil, connecté à ce compte.";
    const manager=byId("workspace-manager"),memberSelect=byId("access-member"),siteSelect=byId("access-site"),list=byId("workspace-access-list");manager.hidden=!manageable;memberSelect.textContent="";siteSelect.textContent="";list.textContent="";
    if(manageable){
      const assignable=manageable.members.filter(member=>member.accountId!==state.user.id&&member.status==="active");assignable.forEach(member=>option(memberSelect,member.accountId,member.email));manageable.sites.forEach(site=>option(siteSelect,site.id,site.name));manager.hidden=manageable.sites.length===0;byId("access-form").hidden=assignable.length===0;
      const roleLabels={manager:"Directeur / manager",chef:"Chef",second:"Second de cuisine",bar:"Responsable bar",buyer:"Économe / acheteur",accountant:"Comptable",consultant:"Consultant",counter:"Employé de comptage"},landingLabels={pilotage:"Pilotage",carte:"Carte",inventory:"Inventaire"},siteNames=Object.fromEntries(manageable.sites.map(site=>[site.id,site.name])),assignments=(manageable.accesses||[]).filter(item=>item.accountId!==state.user.id);assignments.forEach(item=>{const li=document.createElement("li"),text=document.createElement("span"),strong=document.createElement("strong"),button=document.createElement("button");strong.textContent=item.email;text.append(strong,document.createTextNode(`${siteNames[item.etabId]||item.etabId} · ${roleLabels[item.role]||item.role} · arrivée sur ${landingLabels[item.landingModule]||item.landingModule}`));button.type="button";button.textContent="Retirer";button.dataset.revokeAccount=item.accountId;button.dataset.revokeSite=item.etabId;button.dataset.organisation=manageable.id;li.append(text,button);list.appendChild(li);});if(!assignments.length){const li=document.createElement("li");li.textContent="Ajoutez un compte, puis choisissez son métier et son établissement.";list.appendChild(li);}
    }else sites.forEach(site=>{const li=document.createElement("li"),text=document.createElement("span"),strong=document.createElement("strong");strong.textContent=`${site.organisationName} · ${site.name}`;text.append(strong,document.createTextNode(`${site.role} · arrivée ${site.landingModule}`));li.appendChild(text);list.appendChild(li);});
  }
  async function loadWorkspace(){if(!state.authReady||state.mfaPending)return;try{const result=await workspaceRequest("bootstrap");renderWorkspace(result.workspace);}catch(error){byId("workspace-panel").hidden=false;byId("workspace-summary").textContent="Les accès d’équipe sont momentanément indisponibles.";}}

  function retour(){const next=params.get("return");if(next==="app")return "./";if(next&&next.startsWith("/")&&!next.startsWith("//"))return next;if(next&&next.startsWith("./")&&!next.includes("//"))return next;return "";}
  function showAccount(user,mfaPending){
    state.user=user;state.mfaPending=!!mfaPending;show("auth-tabs",false);show("auth-form",false);show("account-panel",true);byId("account-email").textContent=user.email||"";
    /* W45 : avant le code de double authentification, seule la demande de code est visible. */
    show("account-main",!state.mfaPending);show("account-who",!state.mfaPending);show("mfa-pending",state.mfaPending);byId("mfa-pending").textContent=state.mfaPending?"Connexion à terminer pour "+(user.email||"")+" : entrez le code de votre application d’authentification.":"";
    if(state.mfaPending){feedback("Entrez le code de votre application d’authentification pour terminer la connexion.");window.dispatchEvent&&window.dispatchEvent(new Event("verdict-account-ready"));return;}
    renderPlan(user);renderEmail(user);byId("active-sites").value=Math.max(1,Number(user.active_establishments)||1);renderOffers();
    const back=retour();if(back){byId("open-app").href=back;byId("open-app").textContent="Revenir à Verdict";}
    loadWorkspace();if(window.dispatchEvent)window.dispatchEvent(new Event("verdict-account-ready"));
    if(params.get("view")==="abo"){const card=byId("plan-card");if(card&&typeof card.scrollIntoView==="function")card.scrollIntoView({block:"start"});}
  }
  function showAuth(){state.user=null;state.workspace=null;state.mfaPending=false;const mfaFeedback=byId("client-mfa-feedback");if(mfaFeedback)mfaFeedback.textContent="";show("auth-tabs",true);show("auth-form",true);show("account-panel",false);show("workspace-panel",false);}
  function verificationText(delivery,email){return delivery==="email"?" Un lien pour confirmer votre adresse part à "+email+".":delivery==="local"?" Développement : aucun e-mail ne part ; le lien de confirmation est dans la boîte locale.":delivery==="failed"?" Le lien de confirmation n’a pas pu partir : utilisez « Renvoyer le lien de confirmation ».":" La confirmation de votre adresse se fera quand l’envoi des e-mails sera activé.";}
  async function submit(event){
    event.preventDefault();if(!state.authReady){feedback("Le serveur de comptes n’est pas encore en ligne sur ce domaine.","error");return;}
    const email=byId("email").value.trim(),password=byId("password").value,confirm=byId("confirm").value;
    try{
      if((state.mode==="register"||state.mode==="reset")&&password!==confirm)throw new Error("Les deux mots de passe ne sont pas identiques.");
      if(state.mode==="forgot"){const result=await request("request_reset",{email});feedback(result.message||"Demande enregistrée.",result.delivery==="none"?"error":"ok");return;}
      if(state.mode==="reset"){await request("reset_password",{email,password,token:byId("reset-token").value.trim()});byId("password").value="";byId("confirm").value="";mode("login");cleanUrl();feedback("Mot de passe modifié. Connectez-vous avec le nouveau.","ok");return;}
      const result=await request(state.mode,{email,password});if(result.emailDelivery)state.emailDelivery=result.emailDelivery;
      if(state.mode==="register"){if(!state.emailDelivery){try{const me=await request("me");state.emailDelivery=me.emailDelivery||"";}catch(error){}}showAccount(result.user,false);feedback("Compte créé : votre essai de 14 jours de Verdict Pro commence aujourd’hui."+verificationText(result.verification,result.user.email||email),"ok");return;}
      if(!state.emailDelivery){try{const me=await request("me");state.emailDelivery=me.emailDelivery||"";}catch(error){}}
      showAccount(result.user,result.mfaRequired===true);if(result.mfaRequired!==true)feedback("Connecté. Ouvrez Verdict sur cet appareil : ses établissements sont envoyés dans votre compte, sans rien effacer.","ok");
    }catch(error){feedback(texte(error.message),"error");}
  }
  async function checkout(plan,offre){if(!state.billingReady){feedback("Le paiement en ligne n’est pas encore ouvert.","error");return;}try{const response=await fetch("/api/billing/checkout",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","X-CSRF-Token":state.csrf},body:JSON.stringify({plan,period:plan,offre:offre==="pilotage"?"pilotage":"pro",activeEstablishments:Number(byId("active-sites").value)||1})}),json=await response.json();if(!response.ok||!json.url)throw new Error(json.error||"stripe_request_failed");location.href=json.url;}catch(error){feedback(texte(error.message),"error");}}
  async function verifyFromLink(){const token=params.get("verify"),email=params.get("email")||"";if(!token)return;try{await request("verify_email",{email,token});cleanUrl();feedback("Adresse e-mail confirmée. Merci.","ok");}catch(error){feedback(texte(error.message),"error");}}
  async function boot(){
    const service=byId("service-state");
    if(!state.authReady){service.textContent="Le serveur de comptes n’est pas encore en ligne sur ce domaine : Verdict s’utilise en découverte et vos données restent sur cet appareil.";service.className="service-state blocked";document.querySelectorAll("form button,form input,form select").forEach(node=>node.disabled=true);return;}
    service.textContent=state.billingReady?"Compte et abonnement disponibles.":"Comptes disponibles · paiement en ligne pas encore ouvert.";service.className="service-state "+(state.billingReady?"ready":"blocked");
    await verifyFromLink();
    try{const result=await request("me");state.emailDelivery=result.emailDelivery||"";if(result.authenticated&&result.user)showAccount(result.user,result.mfaRequired===true);else showAuth();}catch(error){feedback(texte("service_unavailable"),"error");}
  }
  document.querySelectorAll("[data-mode]").forEach(button=>button.addEventListener("click",()=>mode(button.dataset.mode)));
  document.querySelectorAll("[data-checkout]").forEach(button=>button.addEventListener("click",()=>checkout(button.dataset.checkout,button.dataset.offre)));
  byId("auth-form").addEventListener("submit",submit);
  byId("active-sites").addEventListener("input",renderTotals);
  byId("start-trial").addEventListener("click",async()=>{try{const result=await request("start_trial");if(result.user)showAccount(result.user,false);feedback("Votre essai de 14 jours a commencé.","ok");}catch(error){feedback(texte(error.message),"error");}});
  byId("resend-verification").addEventListener("click",async()=>{try{const result=await request("resend_verification");feedback(result.delivery==="email"?"Un nouveau lien de confirmation part à "+(state.user&&state.user.email||"votre adresse")+".":result.delivery==="local"?"Développement : un nouveau lien est dans la boîte locale (aucun e-mail ne part).":result.delivery==="already"?"Adresse déjà confirmée.":result.delivery==="none"?"L’envoi des e-mails n’est pas encore activé.":"Le lien n’a pas pu partir. Réessayez plus tard.",["email","local","already"].includes(result.delivery)?"ok":"error");}catch(error){feedback(texte(error.message),"error");}});
  byId("access-role").addEventListener("change",event=>{const landing={manager:"pilotage",chef:"carte",second:"carte",bar:"carte",buyer:"inventory",accountant:"pilotage",consultant:"pilotage",counter:"inventory"};byId("access-landing").value=landing[event.target.value]||"pilotage";});
  byId("member-form").addEventListener("submit",async event=>{event.preventDefault();const organisation=(state.workspace.organisations||[]).find(item=>Array.isArray(item.members));if(!organisation)return;try{await workspaceRequest("add_member",{organisationId:organisation.id,email:byId("member-email").value.trim()});byId("member-email").value="";await loadWorkspace();feedback("Membre ajouté. Choisissez maintenant son rôle.","ok");}catch(error){feedback(texte(error.message),"error");}});
  byId("access-form").addEventListener("submit",async event=>{event.preventDefault();const organisation=(state.workspace.organisations||[]).find(item=>Array.isArray(item.members));if(!organisation)return;try{await workspaceRequest("grant_access",{organisationId:organisation.id,etabId:byId("access-site").value,accountId:byId("access-member").value,role:byId("access-role").value,landingModule:byId("access-landing").value});await loadWorkspace();feedback("Droits appliqués immédiatement.","ok");}catch(error){feedback(texte(error.message),"error");}});
  byId("workspace-access-list").addEventListener("click",async event=>{const button=event.target.closest("[data-revoke-account]");if(!button)return;try{await workspaceRequest("revoke_access",{organisationId:button.dataset.organisation,etabId:button.dataset.revokeSite,accountId:button.dataset.revokeAccount});await loadWorkspace();feedback("Accès retiré.","ok");}catch(error){feedback(texte(error.message),"error");}});
  byId("logout").addEventListener("click",async()=>{try{await request("logout");state.csrf="";showAuth();mode("login");feedback("Vous êtes déconnecté. Les données de cet appareil restent sur cet appareil.","ok");}catch(error){feedback(texte(error.message),"error");}});
  byId("billing-portal").addEventListener("click",async()=>{if(byId("billing-portal").disabled)return;try{const response=await fetch("/api/billing/portal",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","X-CSRF-Token":state.csrf},body:"{}"}),json=await response.json();if(!response.ok||!json.url)throw new Error(json.error||"stripe_request_failed");location.href=json.url;}catch(error){feedback(texte(error.message),"error");}});
  if(params.get("reset")){byId("reset-token").value=params.get("reset");byId("email").value=params.get("email")||"";mode("reset");}
  else mode(["register","forgot"].includes(params.get("mode"))?params.get("mode"):"login");
  if(params.get("email")&&!params.get("reset"))byId("email").value=params.get("email");
  boot();
})();
