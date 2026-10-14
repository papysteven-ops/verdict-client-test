/* Verdict internal recheck — no interface, network, or client-data persistence. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VerdictInternalCheck = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const ZERO = 0n, ONE = 1n;
  function abs(n) { return n < ZERO ? -n : n; }
  function gcd(a, b) { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a || ONE; }
  function q(n, d = ONE) { if (!d) throw Error('DIV0'); if (d < ZERO) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; }
  function add(a,b) { return q(a.n*b.d+b.n*a.d,a.d*b.d); }
  function sub(a,b) { return q(a.n*b.d-b.n*a.d,a.d*b.d); }
  function mul(a,b) { return q(a.n*b.n,a.d*b.d); }
  function div(a,b) { return q(a.n*b.d,a.d*b.n); }
  function cmp(a,b) { const x=a.n*b.d-b.n*a.d; return x<ZERO?-1:x>ZERO?1:0; }
  function decimal(s) { const neg=s[0]==='-'; if (neg) s=s.slice(1); const parts=s.split('.'), f=parts[1]||''; const d=10n**BigInt(f.length); return q((neg?-ONE:ONE)*BigInt(parts[0]+f),d); }
  const z=q(ZERO), one=q(ONE), hundred=q(100n);
  function percent(x) { return div(x,hundred); }
  function round(a,p) { const d=10n**BigInt(p), n=abs(a.n)*d; const r=(2n*n+a.d)/(2n*a.d); return a.n<ZERO?-r:r; }
  function format(a,p) { const n=round(a,p), neg=n<ZERO, s=abs(n).toString().padStart(p+1,'0'); return (neg?'-':'')+(p?s.slice(0,-p)+'.'+s.slice(-p):s); }
  function ceil(a) { let n=a.n/a.d; if (a.n>ZERO && a.n%a.d) n++; return q(n); }
  function parse(raw) {
    if (raw == null || raw === '') return { status:'MISSING' };
    if (typeof raw !== 'string') return { status:'INVALID',code:'TEXT_REQUIRED' };
    let s=raw.trim().replace(/[\u00a0\u202f\u2009 ]/g,'').replace(/(€|%)$/,'');
    if (!s) return { status:'MISSING' };
    if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(s)) return { status:'INVALID',code:'FORMAT' };
    if (/^[+-]?\d{1,3}\.\d{3}$/.test(s)) return { status:'INVALID',code:'AMBIGUOUS' };
    s=s.replace(',','.').replace(/^\+/,'');
    const [i,f='']=s.replace(/^-/, '').split('.');
    if (i.length>12 || f.length>6) return { status:'INVALID',code:'RANGE' };
    return { status:'OK',value:decimal(s) };
  }
  const F = (id,label,unit,max='1000000000',optional=false) => ({id,label,unit,max,optional});
  const schemas = {
    prix:{title:'Prix d’un plat',hint:'Du coût matière au prix TTC, sans présumer que la marge couvre toutes les charges.',fields:[F('cout','Coût matière par portion','€ HT'),F('food','Part de matière visée','%', '99.999999'),F('tva','TVA applicable à ce produit','%', '100')]},
    foodcost:{title:'Matière d’un plat',hint:'Part du coût matière dans le prix de vente hors taxes.',fields:[F('cout','Coût matière','€ HT'),F('prix','Prix de vente','€ TTC'),F('tva','TVA applicable','%', '100')]},
    seuil:{title:'Minimum du mois',hint:'Seuil de couverture des charges saisies. Ne confondez pas ce montant avec la trésorerie.',fields:[F('fixes','Charges fixes du mois','€ HT'),F('variable','Coûts variables','% du CA','99.999999'),F('jours','Jours ouverts','jours','31')]},
    masse:{title:'Poids de l’équipe',hint:'Coût de l’équipe rapporté au chiffre d’affaires HT. Aucun jugement sectoriel automatique.',fields:[F('salaires','Coût total de l’équipe','€'),F('ca','Chiffre d’affaires du mois','€ HT')]},
    plateforme:{title:'Vente en livraison',hint:'Contribution par plat après commission et matière. Emballage et autres charges restent à ajouter.',fields:[F('prix','Prix vendu sur la plateforme','€ TTC'),F('tva','TVA du plat','%','100'),F('commission','Commission facturée sur le prix HT','%','100'),F('matiere','Coût matière','€ HT')]},
    tva:{title:'HT et TTC',hint:'Conversion d’un montant selon le taux choisi. Le taux doit être vérifié selon le produit.',fields:[F('ttc','Montant encaissé','€ TTC'),F('taux','Taux applicable','%','100')]}
  };
  function run(id, raw) {
    const schema=schemas[id]; if(!schema) return {ok:false,status:'UNKNOWN'};
    const v={},issues=[];
    for(const field of schema.fields){ const p=parse(raw&&raw[field.id]); if(p.status!=='OK'){issues.push({field:field.id,code:p.code||p.status});continue;}
      if(cmp(p.value,z)<0||cmp(p.value,decimal(field.max))>0||(field.id==='jours'&&(!p.value.d||p.value.d!==ONE||cmp(p.value,z)===0))){issues.push({field:field.id,code:'RANGE'});continue;} v[field.id]=p.value; }
    if(issues.length) return {ok:false,status:issues.some(x=>x.code!=='MISSING')?'INVALID':'MISSING',issues};
    try {
      let result, unit='€',places=2,explain='',check=false;
      if(id==='prix') { if(cmp(v.food,z)===0)return {ok:false,status:'INVALID',issues:[{field:'food',code:'RANGE'}]};
        const ht=div(v.cout,percent(v.food)); result=mul(ht,add(one,percent(v.tva))); check=cmp(div(result,add(one,percent(v.tva))),ht)===0; explain='Prix TTC nécessaire pour la part de matière saisie. Les autres coûts restent à couvrir.'; }
      if(id==='foodcost') {if(cmp(v.prix,z)===0)return {ok:false,status:'INVALID',issues:[{field:'prix',code:'RANGE'}]};
        const ht=div(v.prix,add(one,percent(v.tva))); result=mul(div(v.cout,ht),hundred); unit='%';places=1;check=cmp(mul(percent(result),ht),v.cout)===0;explain='Part du coût matière dans les ventes HT de ce plat.';}
      if(id==='seuil') {if(cmp(v.jours,z)===0||cmp(v.variable,hundred)>=0)return {ok:false,status:'INVALID',issues:[{field:'jours/variable',code:'RANGE'}]};
        const margin=sub(one,percent(v.variable));result=div(v.fixes,margin);places=0;check=cmp(sub(result,mul(result,percent(v.variable))),v.fixes)===0;explain='CA HT mensuel pour couvrir les charges fixes saisies, sans bénéfice. Moyenne par jour ouvert : '+format(div(result,v.jours),0)+' € HT.';}
      if(id==='masse') {if(cmp(v.ca,z)===0)return {ok:false,status:'INVALID',issues:[{field:'ca',code:'RANGE'}]};
        result=mul(div(v.salaires,v.ca),hundred);unit='%';places=1;check=cmp(mul(percent(result),v.ca),v.salaires)===0;explain='Coût total de l’équipe divisé par le CA HT saisi.';}
      if(id==='plateforme') {const ht=div(v.prix,add(one,percent(v.tva))),fee=mul(ht,percent(v.commission));result=sub(sub(ht,fee),v.matiere);check=cmp(add(add(result,fee),v.matiere),ht)===0;explain='Contribution HT par plat après commission et matière. Commission sur base HT uniquement.';}
      if(id==='tva') {result=div(v.ttc,add(one,percent(v.taux)));check=cmp(mul(result,add(one,percent(v.taux))),v.ttc)===0;explain='Montant hors taxes correspondant au TTC saisi.';}
      if(!check)return {ok:false,status:'ERROR',issues:[{field:'',code:'SELF_CHECK'}]};
      return {ok:true,id,value:format(result,places),unit,places,explain,kind:id==='seuil'?'SEUIL':id==='plateforme'?'CONTRIBUTION':'CALCUL'};
    } catch(e){return {ok:false,status:'ERROR',issues:[{field:'',code:'CALC'}]};}
  }
  function compare(id,raw,claimed) {
    const result=run(id,raw);if(!result.ok)return {status:result.status,result};
    const p=parse(claimed);if(p.status!=='OK')return {status:'NO_COMPARISON',result};
    const other=format(p.value,result.places);
    return {status:other===result.value?'AGREE':'DIFFER',result,verdict:other};
  }
  return {version:'0.1.0',schemas,parse,run,compare};
});
