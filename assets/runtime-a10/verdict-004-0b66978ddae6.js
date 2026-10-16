
(function(root){
'use strict';
function calculate(input){
 var minimum=Number(input.minimum);if(!Number.isFinite(minimum)||minimum<0)throw Error('Minimum invalide');
 var cents=function(n){return Math.round(n*100);},actual=0,expected=0,missing=[],remaining=[];
 (input.days||[]).slice().sort(function(a,b){return a.date.localeCompare(b.date);}).forEach(function(day){
  var known=day.ca!==null&&day.ca!==undefined&&day.ca!==''&&Number.isFinite(Number(day.ca))&&Number(day.ca)>=0;
  if(day.date>input.today){remaining.push(day);return;}
  if(known){actual+=cents(Number(day.ca));expected+=cents(Number(day.target)||0);}
  else if(day.date<input.today)missing.push(day.date);else remaining.push(day);
 });
 var rest=Math.max(0,cents(minimum)-actual),deficit=Math.max(0,expected-actual),next=remaining[0],base=next?cents(Number(next.target)||0):null,exact=!missing.length;/* C121 : le retard n'est plus reporté en entier sur le lendemain ; il est réparti sur tous les jours ouverts restants, au prorata de leur poids (samedi plus que lundi). */var poidsRestants=remaining.reduce(function(s,d){return s+Math.max(0,cents(Number(d.target)||0));},0),partRetard=exact&&next&&deficit>0?(poidsRestants>0?Math.round(deficit*base/poidsRestants):Math.round(deficit/remaining.length)):0;
 return {minimum:minimum,actual:actual/100,expected:expected/100,advance:exact?Math.max(0,actual-expected)/100:null,remaining:rest/100,exact:exact,missing:missing,next:next?next.date:null,base:base===null?null:base/100,deficit:exact?deficit/100:null,catchup:exact&&next?(base+partRetard)/100:null,catchupShare:exact&&next?partRetard/100:null,openRemaining:remaining.length,average:exact&&remaining.length?Math.ceil(rest/remaining.length)/100:null};
}
function preview(input,date,amount){
 if(!Number.isFinite(amount)||amount<0||!input||!Array.isArray(input.days))return null;
 var found=false,days=input.days.map(function(d){var copy=Object.assign({},d);if(d.date===date){copy.ca=amount;found=true;}return copy;});
 if(!found||date>input.today)return null;
 var result=calculate({minimum:input.minimum,today:input.today,days:days});result.today=input.today;result.input={minimum:input.minimum,today:input.today,days:days};result.selectedDate=date;return result;
}
function nextHTML(c,draft){
 if(!c.exact)return '<p>Complète les journées précédentes : le rattrapage ne peut pas encore être calculé.</p>';
 if(!c.next)return '<p>Aucun jour ouvert restant ce mois-ci.</p><strong>'+ (c.remaining>0?'Reste à couvrir : '+money(c.remaining):'Minimum du mois couvert')+'</strong>';
 var today=c.today||(c.input&&c.input.today),tomorrow=today?new Date(today+'T12:00:00Z'):null;if(tomorrow)tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
 var isTomorrow=tomorrow&&tomorrow.toISOString().slice(0,10)===c.next;
 var date=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(c.next+'T12:00:00Z'));
 var title=isTomorrow?'Demain · '+date:'Prochain jour ouvert · '+date;
 var explanation=c.deficit>0?'Base '+money(c.base)+' + '+money(c.catchupShare!=null?c.catchupShare:c.deficit)+' de rattrapage (retard de '+money(c.deficit)+' réparti sur les '+c.openRemaining+' jours ouverts restants).':(c.advance>0?'Avance cumulée restante : '+money(c.advance)+'. La base du prochain jour reste à faire.':'Aucun retard cumulé. La base du prochain jour reste à faire.');
 return '<p>'+(draft?'Aperçu après enregistrement':'Journée enregistrée')+'</p><strong>'+title+' : '+money(c.catchup)+' TTC</strong><p>'+explanation+'</p>'+dayExplanation(c,c.selectedDate)+(draft?'<small>Montant non enregistré : confirme avec le bouton.</small>':'');
}
function savedHTML(c,date,amount){
 var day=c.input&&c.input.days.find(function(d){return d.date===date;});
 if(!day||day.ca==null||amount==null||amount===''||!Number.isFinite(Number(amount))||Math.abs(Number(day.ca)-Number(amount))>.005||(c.next&&c.next<=date))return '<p>Le calcul du prochain jour ne correspond pas encore à la journée enregistrée. Actualise la page avant de te fier au montant.</p>';
 return nextHTML(Object.assign({},c,{selectedDate:date}),false);
}
function dayExplanation(c,date){
 var day=date&&c.input&&c.input.days.find(function(d){return d.date===date;});if(!day||!c.exact)return '';
 var gap=Math.max(0,Math.round((Number(day.target)-Number(day.ca))*100)/100);if(!gap)return '';
 var absorbed=Math.min(gap,Math.max(0,gap-(c.deficit||0)));
 return '<p>Manque sur cette journée : '+money(gap)+'.'+(absorbed>0?' Avance des jours précédents utilisée : '+money(absorbed)+'.':'')+'</p>';
}
function parseAmount(value){var s=String(value==null?'':value).replace(/\s/g,'').replace(',','.');return /^\d+(?:\.\d{1,2})?$/.test(s)&&Number.isFinite(Number(s))?Number(s):null;}

function money(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);}
var api={calculate:calculate,preview:preview,nextHTML:nextHTML,savedHTML:savedHTML,parseAmount:parseAmount};if(typeof module==='object'&&module.exports)module.exports=api;root.VerdictCHR=api;
})(typeof window!=='undefined'?window:globalThis);

