/* Verdict financial core. Decimal fractions until an explicit display boundary. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.VerdictFinance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function abs(x) { return x < 0n ? -x : x; }
  function gcd(a, b) { a = abs(a); b = abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1n; }
  function Fraction(n, d) {
    n = BigInt(n); d = d === undefined ? 1n : BigInt(d);
    if (!d) throw new RangeError('DIVISION_ZERO');
    if (d < 0n) { n = -n; d = -d; }
    var g = gcd(n, d); this.n = n / g; this.d = d / g; Object.freeze(this);
  }
  function fraction(raw) {
    if (raw instanceof Fraction) return raw;
    if (raw && typeof raw.n === 'bigint' && typeof raw.d === 'bigint') return new Fraction(raw.n, raw.d);
    if (raw === null || raw === undefined || String(raw).trim() === '') throw new TypeError('MISSING');
    if (typeof raw === 'boolean' || typeof raw === 'object') throw new TypeError('INVALID_DECIMAL');
    var s = String(raw).trim(), m = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(s);
    if (!m || (!m[2] && !m[3]) || (typeof raw === 'number' && !Number.isFinite(raw))) throw new TypeError('INVALID_DECIMAL');
    var exponent = Number(m[4] || 0), scale = (m[3] || '').length - exponent;
    if (Math.abs(exponent) > 100 || s.length > 150) throw new RangeError('DECIMAL_RANGE');
    var n = BigInt((m[2] || '0') + (m[3] || '')) * (m[1] === '-' ? -1n : 1n);
    return scale >= 0 ? new Fraction(n, 10n ** BigInt(scale)) : new Fraction(n * 10n ** BigInt(-scale));
  }
  Fraction.prototype.add = function (other) { var b = fraction(other); return new Fraction(this.n * b.d + b.n * this.d, this.d * b.d); };
  Fraction.prototype.sub = function (other) { var b = fraction(other); return new Fraction(this.n * b.d - b.n * this.d, this.d * b.d); };
  Fraction.prototype.mul = function (other) { var b = fraction(other); return new Fraction(this.n * b.n, this.d * b.d); };
  Fraction.prototype.div = function (other) { var b = fraction(other); return new Fraction(this.n * b.d, this.d * b.n); };
  Fraction.prototype.cmp = function (other) { var b = fraction(other), x = this.n * b.d - b.n * this.d; return x < 0n ? -1 : x > 0n ? 1 : 0; };
  Fraction.prototype.units = function (places, mode) {
    places = places === undefined ? 2 : places;
    if (!Number.isInteger(places) || places < 0 || places > 18) throw new RangeError('SCALE');
    var scale = 10n ** BigInt(places), a = abs(this.n) * scale, q = a / this.d, r = a % this.d;
    if (mode === 'ceil') return this.n < 0n ? -q : q + (r ? 1n : 0n);
    if (mode === 'floor') return this.n < 0n ? -(q + (r ? 1n : 0n)) : q;
    if (mode !== 'truncate' && 2n * r >= this.d) q++;
    return this.n < 0n ? -q : q;
  };
  Fraction.prototype.format = function (places, mode) {
    places = places === undefined ? 2 : places;
    var n = this.units(places, mode), s = abs(n).toString().padStart(places + 1, '0');
    return (n < 0n ? '-' : '') + (places ? s.slice(0, -places) + '.' + s.slice(-places) : s);
  };
  Fraction.prototype.number = function (places, mode) {
    places = places === undefined ? 17 : places;
    var whole = this.units(2);
    if (abs(whole) > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('UNSAFE_AMOUNT');
    var value = Number(this.format(places, mode));
    if (!Number.isFinite(value) || (places === 2 && fraction(value).units(2) !== this.units(2, mode))) throw new RangeError('UNSAFE_AMOUNT');
    return value;
  };
  Fraction.prototype.toJSON = function () { return { n: this.n.toString(), d: this.d.toString() }; };
  function exact(value) { return fraction(value).toJSON(); }
  function fromExact(value) { if(value&&typeof value.n==='string'&&typeof value.d==='string'){if(!/^-?\d{1,150}$/.test(value.n)||!/^\d{1,150}$/.test(value.d))throw new RangeError('DECIMAL_RANGE');return new Fraction(value.n,value.d);}return fraction(value); }
  function sum(values) { return values.reduce(function (a, x) { return a.add(x); }, fraction(0)); }
  function parseInput(raw, options) {
    options = options || {};
    if (raw === null || raw === undefined || String(raw).trim() === '') return { state: 'missing', value: null };
    var rawText=typeof raw==='string'?raw.trim():String(raw);if(typeof raw==='string'&&/\d[\u00a0\u202f\u2009 ]+\d/.test(rawText)&&!/^[+-]?\d{1,3}(?:[\u00a0\u202f\u2009 ]\d{3})+(?:[.,]\d+)?$/.test(rawText))return {state:'invalid',value:null,reason:'grouping'};
    var s = typeof raw === 'string' ? rawText.replace(/[\u00a0\u202f\u2009 ]/g, '') : String(raw);
    if ((typeof raw==='number'&&!Number.isFinite(raw))||(typeof raw!=='number'&&!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(s))) return { state: 'invalid', value: null, reason: 'format' };
    if (typeof raw==='string'&&options.imported && !options.decimalSeparator && /^[+-]?\d{1,3}[.,]\d{3}$/.test(s)) return { state: 'invalid', value: null, reason: 'ambiguous_separator' };
    if (typeof raw==='string'&&options.decimalSeparator && s.includes(options.decimalSeparator === ',' ? '.' : ',')) return { state: 'invalid', value: null, reason: 'separator' };
    try {
      var q = fraction(s.replace(',', '.'));
      if (options.nonnegative && q.cmp(0) < 0) return { state: 'invalid', value: null, reason: 'negative' };
      if (options.integer && q.d !== 1n) return { state: 'invalid', value: null, reason: 'integer' };
      if (options.positive && q.cmp(0) <= 0) return { state: 'invalid', value: null, reason: 'positive' };
      if (options.max !== undefined && q.cmp(options.max) > 0) return { state: 'invalid', value: null, reason: 'range' };
      return { state: 'known', value: q.number(), exact: q.toJSON() };
    } catch (_) { return { state: 'invalid', value: null, reason: 'range' }; }
  }
  function money(value) { return fraction(value).number(2); }
  function divideOrNull(a, b) { return fraction(b).cmp(0) === 0 ? null : fraction(a).div(b); }
  function coverage(actual, target) {
    if (actual === null || actual === undefined || target === null || target === undefined) return { state: 'unknown', ratio: null, percent: null };
    var a = fraction(actual), t = fraction(target);
    if (t.cmp(0) <= 0) return { state: 'not_applicable', ratio: null, percent: null };
    var r = a.div(t), state = r.cmp(1) >= 0 ? 'green' : r.cmp('0.95') >= 0 ? 'yellow' : r.cmp('0.9') >= 0 ? 'orange' : 'red';
    /* Floor only under a boundary that ordinary display rounding would cross. */
    var p = r.mul(100), display = p.format(1);
    if ((state === 'yellow' && fraction(display).cmp(100) >= 0) || (state === 'orange' && fraction(display).cmp(95) >= 0) || (state === 'red' && fraction(display).cmp(90) >= 0)) display = p.format(1, 'floor');
    return { state: state, ratio: r.number(), percent: display, exact: r.toJSON() };
  }
  function allocate(total, weights) {
    var cents = fraction(total).units(2), negative = cents < 0n, magnitude = abs(cents);
    var ws = weights.map(fraction);
    if (ws.some(function (x) { return x.cmp(0) < 0; })) throw new RangeError('NEGATIVE_WEIGHT');
    var base = sum(ws);
    if (!ws.length || base.cmp(0) === 0) { if (magnitude) throw new RangeError('NO_OPEN_WEIGHT'); return ws.map(function () { return 0; }); }
    var rows = ws.map(function (w, i) { var share = w.mul(new Fraction(magnitude)).div(base), n = share.units(0, 'floor'); return { i: i, n: n, remainder: share.sub(new Fraction(n)) }; });
    var rest = magnitude - rows.reduce(function (n, row) { return n + row.n; }, 0n);
    rows.slice().sort(function (a, b) { return b.remainder.cmp(a.remainder) || a.i - b.i; }).forEach(function (row) { if (rest > 0n) { row.n++; rest--; } });
    return rows.map(function (row) { return new Fraction(negative ? -row.n : row.n, 100n).number(2); });
  }
  function derived(input, context) {
    context = context || {}; var d = {}, q = {}, moneyKeys = [], get = function (key, fallback) { var p = parseInput(input[key]); return p.state === 'known' ? fromExact(p.exact) : fraction(fallback === undefined ? 0 : fallback); };
    var unitAmounts = ['panierHT', 'caReconstructed', 'caReconciliationGap', 'cfM', 'resM', 'cvu', 'mcCmd', 'caSalarie'];
    function put(key, value, monetary) { if (value !== null && monetary && unitAmounts.indexOf(key) < 0) value = new Fraction(value.units(2), 100n); q[key] = value; d[key] = value === null ? null : monetary ? money(value) : value.number(); if (monetary) moneyKeys.push(key); }
    put('tva', get('tva').div(100)); put('panierTTC', get('panier'), true); put('panierHT', q.panierTTC.div(fraction(1).add(q.tva)), true);
    put('jSem', get('jsem', 6)); put('mois', get('mois', 12));
    put('jMois', new Fraction(q.jSem.mul('4.33').units(0, 'ceil'))); put('jAn', new Fraction(q.jSem.mul('4.33').mul(q.mois).units(0, 'ceil')));
    put('cmdj', get('cmdj')); put('cmdAn', q.cmdj.mul(q.jSem).mul('4.33').mul(q.mois));
    put('caReconstructed', q.panierHT.mul(q.cmdAn), true);
    var declared = context.declaredCA === null || context.declaredCA === undefined ? null : fraction(context.declaredCA);
    if (declared && declared.cmp(0) < 0) throw new RangeError('NEGATIVE_ANNUAL_REVENUE');
    var revenue = declared || q.caReconstructed;
    if (declared && context.revenueOverride && context.baseReconstructed && fraction(context.baseReconstructed).cmp(0) > 0) revenue = declared.mul(q.caReconstructed).div(context.baseReconstructed);
    put('caDeclared', declared, true); put('ca', revenue, true);
    d.caSource = declared ? 'declared-closed-period' : 'operational-reconstruction'; put('caReconciliationGap', declared ? q.caReconstructed.sub(declared) : fraction(0), true);
    put('hNote', q.jSem.mul(q.mois).mul('4.33').mul(8)); put('hKpi', q.jMois.mul(q.mois).mul(8));
    put('moisch', get('moisch', 12)); put('obj', get('obj'), true);
    ['nour', 'boi', 'emb', 'autv', 'com', 'dirb', 'salb'].forEach(function (key) { put(key, get(key), true); });
    ['dirt', 'salt', 'dirn', 'saln'].forEach(function (key) { put(key, get(key)); });
    d._dirnRaw = d.dirn; d._salnRaw = d.saln;
    put('mat', q.nour.add(q.boi), true); put('av', q.emb.add(q.autv), true); put('cvT', q.mat.add(q.av).add(q.com), true);
    put('salM', q.dirb.mul(fraction(1).add(q.dirt.div(100))).add(q.salb.mul(fraction(1).add(q.salt.div(100)))), true);
    put('sal', q.salM.mul(q.mois), true); /* C299 (décision 3 de Steven) : une équipe payée « par mois » coûte ses mois travaillés, jamais × 12 pour un saisonnier */
    var fixed = fraction(0); for (var i = 1; i <= 10; i++) { put('f' + i, get('f' + i), true); fixed = fixed.add(q['f' + i]); }
    put('fixM', fixed, true); put('af', fixed.mul(12), true); put('cf', q.sal.add(q.af), true); put('cfM', divideOrNull(q.cf, q.moisch), true);
    put('mc', q.ca.sub(q.cvT), true); put('amort', get('amort'), true); put('resAvantAmort', q.mc.sub(q.cf), true); put('res', q.resAvantAmort.sub(q.amort), true); put('resM', q.res.div(12), true);
    put('cvu', divideOrNull(q.cvT, q.cmdAn), true); put('mcCmd', divideOrNull(q.mc, q.cmdAn), true);
    put('etp', q.dirn.add(q.saln)); put('caSalarie', q.ca.cmp(0) > 0 && q.etp.cmp(0) > 0 ? q.ca.div(q.etp) : null, true);
    d.exact = {}; Object.keys(q).forEach(function (key) { d.exact[key] = q[key] === null ? null : q[key].toJSON(); });
    d.engineVersion = 'A10.1'; d.rounding = 'decimal fractions; half away from zero at money display boundary';
    d.financialScope = { revenue: 'HT', result: 'avant impôt selon charges saisies', taxAfterProfit: 'unknown', borrowingPrincipal: 'cash only', missingCostsMustBeDisclosed: true };
    return d;
  }
  function knownExact(object, key) { return object.exact && object.exact[key] ? fromExact(object.exact[key]) : fraction(object[key]); }
  function metrics(d) {
    var ca=knownExact(d,'ca'), mc=knownExact(d,'mc'), fixed=knownExact(d,'cf').add(knownExact(d,'amort'));
    function percent(value){return ca.cmp(0)>0?value.div(ca).mul(100).number():0;}
    var v={rn:percent(knownExact(d,'res')),mc:percent(mc),cv:percent(knownExact(d,'cvT')),ms:percent(knownExact(d,'sal')),acf:percent(knownExact(d,'af')),tc:percent(knownExact(d,'cvT').add(fixed)),fc:percent(knownExact(d,'nour')),pc:percent(knownExact(d,'nour').add(knownExact(d,'sal'))),com:percent(knownExact(d,'com')),prod:d.hKpi>0?mc.div(knownExact(d,'hKpi')).number():0};
    v.pm=mc.cmp(0)>0?fixed.div(mc).mul(100).number():999;
    v.pmEur=mc.cmp(0)>0?money(fixed.mul(ca).div(mc)):null;
    v.sen=ca.cmp(0)>0?mc.mul('0.9').sub(fixed).div(ca.mul('0.9')).mul(100).number():0;
    v.scope={fc:'nourriture HT',pc:'nourriture + coût humain chargé, hors boissons',tc:'charges saisies y compris amortissements',rn:'solde selon charges saisies, avant impôt'};
    return v;
  }
  function monthlyTargets(d,openDays){
    var ca=knownExact(d,'ca'),mc=knownExact(d,'mc');if(ca.cmp(0)<=0||mc.cmp(0)<=0)return null;
    var months=Math.max(1,Math.min(12,d.mois||12)),fixed=knownExact(d,'cf').add(knownExact(d,'amort')),rate=mc.div(ca),vat=fraction(1).add(knownExact(d,'tva')),target=knownExact(d,'obj');
    if(target.cmp(0)<0)target=fraction(0);
    var minimum=fixed.div(months).div(rate).mul(vat),goal=fixed.add(target).div(months).div(rate).mul(vat);
    return {obj:openDays>0?money(minimum.div(openDays)):null,mois:money(minimum),jOuv:openDays,objectif:openDays>0?money(goal.div(openDays)):null,objectifMois:money(goal),resultatChoisi:money(target.div(months)),moisActifs:months,engineVersion:'A10.1'};
  }
  function breakEven(d) {
    var ca = knownExact(d, 'ca'), contribution = knownExact(d, 'mc'), fixed = knownExact(d, 'cf'), amort = knownExact(d, 'amort'), target = knownExact(d, 'obj');
    var rate = ca.cmp(0) > 0 ? contribution.div(ca) : fraction(0), attainable = rate.cmp(0) > 0;
    var required = attainable ? fixed.add(amort).div(rate) : null, cashRequired = attainable ? fixed.div(rate) : null;
    var difference = required ? ca.sub(required) : null, months = Math.max(1, Math.min(12, d.mois || 12)), days = Math.max(1, d.jAn || 1);
    function monetary(q) { return q === null ? null : money(q); }
    return { attainable: attainable, ca: money(ca), fixed: money(fixed), contribution: money(contribution), contributionRate: rate.mul(100).number(), breakEven: monetary(required), breakEvenTresorerie: monetary(cashRequired), breakEvenComptable: monetary(required), amortization: money(amort), delta: monetary(difference), safetyPct: difference && difference.cmp(0) > 0 ? difference.div(ca).mul(100).number() : 0, gapPct: difference && difference.cmp(0) < 0 ? difference.mul(-1).div(required).mul(100).number() : 0, activeMonths: months, activeDays: days, currentPerMonth: money(ca.div(months)), requiredPerMonth: required ? money(required.div(months)) : null, currentPerDay: money(ca.div(days)), requiredPerDay: required ? money(required.div(days)) : null, currentOrders: d.cmdj || 0, requiredOrders: attainable && d.mcCmd > 0 ? fixed.add(amort).div(knownExact(d, 'mcCmd')).div(days).number() : null, contributionPerOrder: d.mcCmd, coverage: fixed.add(amort).cmp(0) > 0 ? contribution.div(fixed.add(amort)).number() : null, objectiveResult: money(target), objectiveRevenue: attainable && target.cmp(0) > 0 ? money(fixed.add(amort).add(target).div(rate)) : null, objectivePerDay: attainable && target.cmp(0) > 0 ? money(fixed.add(amort).add(target).div(rate).div(days)) : null, engineVersion: 'A10.1' };
  }
  function ingredientUnitCost(g) {
    var p = parseInput(g && g.prix, { nonnegative: true }); if (p.state !== 'known') return null;
    var loss = parseInput(g.perte); if (loss.state === 'invalid') return null;
    var l = fraction(loss.state === 'known' ? loss.value : 0); if (l.cmp(0) < 0 || l.cmp(100) >= 0) return null;
    var base = fromExact(p.exact); if (g.type !== 'UNITE') base = base.div(1000);
    return base.div(fraction(1).sub(l.div(100)));
  }
  function recipeLines(lines, lookup) {
    var total = fraction(0), missing = [], seen = {};
    (lines || []).forEach(function (line) { var g = lookup(line[0]), quantity = parseInput(line[1], { nonnegative: true }), unit = g && ingredientUnitCost(g); if (!g || !unit || quantity.state !== 'known') { missing.push(line[0] || 'Ingrédient'); return; } var amount=fromExact(quantity.exact);if(line[2]){try{amount=amount.mul(unitFactor(line[2],g.type==='UNITE'?'u':g.type==='L'?'ml':'g'));}catch(error){missing.push((line[0]||'Ingrédient')+' · INCOMPATIBLE_UNITS');return;}}total = total.add(unit.mul(amount)); seen[g.nom] = (seen[g.nom] || 0) + 1; });
    return { st: total.number(), exact: total.toJSON(), complete: !!(lines && lines.length) && !missing.length, manquants: missing, doublons: Object.keys(seen).filter(function (key) { return seen[key] > 1; }) };
  }
  function recipeMaterial(raw, preparations, settings, hasSources) {
    var direct = fromExact(raw.exact), prep = preparations.exactMaterial?fromExact(preparations.exactMaterial):fraction(preparations.material || 0), subtotal = direct.add(prep), sauces = subtotal.mul(fraction(settings.sauces || 0).div(100)), loss = subtotal.mul(fraction(settings.pertes || 0).div(100)), total = subtotal.add(sauces).add(loss), missing = raw.manquants.concat(preparations.manquants);
    return { st: subtotal.number(), sauces: sauces.number(), pertes: loss.number(), total: total.number(), directIngredientMaterial: direct.number(), preparationMaterial: prep.number(), preparationAllocations: preparations, complete: !!hasSources && !missing.length && preparations.materialReady, manquants: missing, doublons: raw.doublons, prepDoublons: preparations.doublons, exact: { st: subtotal.toJSON(), total: total.toJSON() }, engineVersion: 'A10.1' };
  }
  function ht(ttc, rate) { return fraction(ttc).div(fraction(1).add(fraction(rate).div(100))); }
  function inventoryGoal(p, level, coefficients) {
    var raw=p.over&&p.over[level];if(raw===null||raw===undefined||raw==='')raw=p.goal;
    var parsed=parseInput(raw,{nonnegative:true});if(parsed.state!=='known')return null;
    var factor=p.over&&p.over[level]!==null&&p.over[level]!==undefined&&p.over[level]!==''?1:coefficients[level];
    if(factor===undefined)return null;return fromExact(parsed.exact).mul(factor).number(1);
  }
  function inventoryAssessment(p, goal, step) {
    var stock=parseInput(p.stock,{nonnegative:true}),minimum=parseInput(p.min,{nonnegative:true}),pack=parseInput(p.pack,{positive:true});
    if(stock.state!=='known')return {state:'uncounted',need:null};
    var s=fromExact(stock.exact),need=null;
    if(goal!==null&&goal!==undefined){var gap=fraction(goal).sub(s),unit=pack.state==='known'?fromExact(pack.exact):fraction(step);need=gap.cmp(0)>0?new Fraction(gap.div(unit).units(0,'ceil')).mul(unit).number():0;}
    if(s.cmp(0)===0)return {state:'out',need:need};
    /* C302 (V15-137) : l'alerte se lit « si moins de X » : un stock égal au minimum n'est pas dessous. */
    if(minimum.state==='known'&&s.cmp(fromExact(minimum.exact))<0)return {state:'minimum',need:need};
    if(need>0)return {state:'order',need:need};
    return {state:goal===null||goal===undefined||minimum.state!=='known'?'unknown':'ok',need:need};
  }
  function inventoryValuation(rows) {
    var total=fraction(0),counted=0,priced=0,pricedRefs=0,missing=[];
    rows.forEach(function(row){var p=row.p||row,stock=parseInput(p.stock,{nonnegative:true}),price=parseInput(p.price,{nonnegative:true});if(price.state==='known')pricedRefs++;if(stock.state==='known')counted++;if(stock.state==='known'&&price.state==='known'){priced++;total=total.add(fromExact(stock.exact).mul(fromExact(price.exact)));}else missing.push(p.id||p.name||'product');});
    return {rows:rows,total:rows.length,counted:counted,priced:priced,pricedRefs:pricedRefs,eur:money(total),coverage:rows.length?Math.round(priced/rows.length*100):0,exact:rows.length>0&&!missing.length,complete:rows.length>0&&!missing.length,missing:missing,exactValue:total.toJSON()};
  }
  function isoDate(raw){var s=String(raw||''),d=new Date(s+'T12:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s?s:null;}
  function addDate(iso,days){var d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
  function cashBridge(input){
    var result=parseInput(input&&input.resultat);if(result.state!=='known')return {ok:false,raison:'resultat'};
    var lines=[],missing=[],change=fraction(result.value);
    function add(k,value,sens,source,info){var p=parseInput(value),known=p.state==='known';lines.push({k:k,eur:known?money(p.value):null,sens:sens,src:known?source:'aucune',mesure:known,info:!!info});if(known&&!info)change=change.add(fraction(p.value).mul(sens));if(!known&&!info)missing.push(k);}
    lines.push({k:'resultat',eur:money(result.value),sens:0,src:input.srcResultat||'structure',mesure:true});
    add('amortissements',input.amortissements,1,input.srcAmort||'fec');add('stock',input.variationStock,-1,input.srcStock||'cloture');
    add('tvaCollectee',input.tvaCollectee,0,'caisse',true);add('tvaDeductible',input.tvaDeductible,0,input.srcTvaDed||'fec',true);
    var collected=parseInput(input.tvaCollectee),deductible=parseInput(input.tvaDeductible),vat=collected.state==='known'&&deductible.state==='known'?fraction(collected.value).sub(deductible.value):null;
    add('tvaNette',vat?vat.number():null,0,'calcul',true);if(!vat)missing.push('tvaNette');
    add('emprunt',input.empruntCapital,-1,input.srcEmprunt||'reglage');add('investissements',input.investissements,-1,input.srcInvest||'reglage');add('prelevements',input.prelevements,-1,input.srcPrel||'reglage');
    var opening=parseInput(input.solde),complete=!missing.length;
    return {ok:true,lignes:lines,variation:money(change),nonMesurees:missing,complete:complete,solde:opening.state==='known'?money(opening.value):null,soldeFin:complete&&opening.state==='known'?money(change.add(opening.value)):null,controle:0,exact:change.toJSON(),engineVersion:'A10.1'};
  }
  function cashPlanning(input){
    var opening=parseInput(input&&input.solde);if(opening.state!=='known'||!isoDate(input.debut))return {ok:false,raison:'solde'};
    var P=input.params||{},M=input.mensuel||{},fields={delai:['delaiFournisseurs',30,365],jSal:['jourSalaires',0,31],jUr:['jourUrssaf',15,31],jTva:['jourTva',20,31],jLoy:['jourLoyer',1,31],jEmp:['jourEmprunt',5,31],jPre:['jourPrelevements',10,31]},params={},invalid=[];
    Object.keys(fields).forEach(function(k){var f=fields[k],p=parseInput(P[f[0]]===undefined?f[1]:P[f[0]],{nonnegative:true,integer:true,max:f[2]});if(p.state!=='known')invalid.push(f[0]);else params[k]=p.value;});
    var deductible=parseInput(P.tauxTvaDeductible===undefined?'.10':P.tauxTvaDeductible,{nonnegative:true,max:1}),vat=parseInput(input.tva,{nonnegative:true,max:1}),purchases=parseInput(input.tauxAchats,{nonnegative:true}),commission=parseInput(input.tauxCom,{nonnegative:true});
    if(deductible.state!=='known'||vat.state!=='known'||purchases.state!=='known'||commission.state!=='known')invalid.push('rates');if(invalid.length)return {ok:false,raison:'invalid',invalid:invalid};
    params.txDed=deductible.value;params.trim=P.rythmeUrssaf==='trimestriel';
    var end=addDate(input.debut,90),cashByDay={},missingDates=[],missingExpenses=[],flow={},v=fraction(vat.value),txA=fraction(purchases.value),txC=fraction(commission.value);
    (input.jours||[]).forEach(function(row){if(!row||!isoDate(row.date))return;var p=parseInput(row.caTTC,{nonnegative:true});if(p.state==='known')cashByDay[row.date]=fraction(p.value);});
    function push(day,key,value){if(day<input.debut||day>end)return;var amount=new Fraction(fraction(value).units(2),100n);if(amount.cmp(0)===0)return;(flow[day]||(flow[day]=[])).push({k:key,v:amount});}
    function due(ym,day){var first=ym+'-01',last=addDate(addDate(first,32).slice(0,7)+'-01',-1),n=Number(last.slice(8));return ym+'-'+String(day===0?n:Math.min(day,n)).padStart(2,'0');}
    for(var day=addDate(input.debut,-Math.max(params.delai,45));day<=end;day=addDate(day,1)){var c=cashByDay[day];if(!c){if(day>=input.debut)missingDates.push(day);continue;}var net=c.div(fraction(1).add(v));if(day>=input.debut){push(day,'encaissements',c);push(day,'commissions',net.mul(txC).mul(-1));}push(addDate(day,params.delai),'fournisseurs',net.mul(txA).mul(-1));}
    [['nets','salaires','jSal'],['fixes','loyer','jLoy'],['emprunt','emprunt','jEmp'],['prelevements','prelevements','jPre'],['investissements','investissements','jPre'],['cotisations','cotisations','jUr']].forEach(function(x){if(parseInput(M[x[0]],{nonnegative:true}).state!=='known')missingExpenses.push(x[0]);});
    var firstMonth=addDate(input.debut,-31).slice(0,7),lastMonth=end.slice(0,7);
    /* TVA datée selon le régime de l'établissement (DGFiP : actualité du 22/09/2026 modifiée le 23/09/2026 ; FAQ des acomptes
       modifiée le 14/10/2026). Réel normal : CA3 mensuelle (mois écoulé) ou trimestrielle (trimestre civil écoulé). Régime simplifié
       jusqu'au 31/12/2026 : acomptes de juillet et de décembre estimés sur le semestre. À partir du 1er janvier 2027, aucun ancien
       acompte n'est reconduit : CA3 dès janvier 2027 (exercice civil) ou après la clôture 2026/2027 (exercice décalé) ; solde
       CA12 / CA12E et acompte de juillet 2027 : montant indiqué (document ou expert-comptable), sinon plan incomplet.
       Régime inconnu : mensuel jusqu'au 31/12/2026, inconnu ensuite. À faire confirmer par l'expert-comptable. */
    var TV=input.tvaRegime||{},tvR=TV.regime==='simplifie'||TV.regime==='normal'?TV.regime:null,tvP=TV.periodicite==='mensuelle'||TV.periodicite==='trimestrielle'?TV.periodicite:null,tvM=TV.montants||{},tvC=null,echeances=[],Y27='2027-01-01';
    if(/^\d{2}-\d{2}$/.test(String(TV.cloture||''))){var tcm=Number(String(TV.cloture).slice(0,2)),tcd=Number(String(TV.cloture).slice(3));if(tcm===12&&tcd===31)tvC='2026-12-31';else if(tcm>=1&&tcm<=11&&tcd>=1&&tcd<=31)tvC=due('2027-'+String(TV.cloture).slice(0,2),tcd);}
    function nextMonth(ym){return addDate(ym+'-01',32).slice(0,7);}
    function monthsBack(ym,n){var out=[ym];while(out.length<n)out.unshift(addDate(out[0]+'-01',-1).slice(0,7));return out;}
    function inWindow(d){return d>=input.debut&&d<=end;}
    function monthVat(ym){var monthly=fraction(0),count=0;Object.keys(cashByDay).forEach(function(d){if(d.slice(0,7)===ym){monthly=monthly.add(cashByDay[d]);count++;}});if(!count)return null;var days=Number(addDate(nextMonth(ym)+'-01',-1).slice(8)),net=monthly.div(fraction(1).add(v)),fixed=parseInput(M.fixes),ded=net.mul(txA).add(fixed.state==='known'?fixed.value:0).mul(deductible.value);return {v:monthly.sub(net).sub(ded),complete:count>=days};}
    function vatEvent(d,nature,months){if(!inWindow(d))return;var total=fraction(0),known=true;months.forEach(function(m){var x=monthVat(m);if(!x){known=false;missingExpenses.push('tva:'+m);return;}if(!x.complete){known=false;missingExpenses.push('tva:'+m);}total=total.add(x.v);});var amount=total.cmp(0)>0?total:fraction(0);push(d,'tva',amount.mul(-1));echeances.push({date:d,nature:nature,periode:months[0]+(months.length>1?'/'+months[months.length-1]:''),montant:money(amount.mul(-1)),complet:known,source:'estimation'});}
    function vatUnknown(d,nature,key){if(!inWindow(d))return;var given=tvM[nature]!=null&&tvM[nature]!==''?parseInput(tvM[nature],{nonnegative:true}):null;if(given&&given.state==='known'){push(d,'tva',fraction(given.value).mul(-1));echeances.push({date:d,nature:nature,montant:money(fraction(given.value).mul(-1)),complet:true,source:'indique'});return;}missingExpenses.push(key);echeances.push({date:d,nature:nature,montant:null,complet:false,source:'inconnu'});}
    function vatDue(ym){var d=due(ym,params.jTva),prev=addDate(ym+'-01',-1).slice(0,7),pm=Number(prev.slice(5)),mm=Number(ym.slice(5));
      if(tvR==='normal'||(!tvR&&d<Y27)){var p=tvR==='normal'?(tvP||'mensuelle'):'mensuelle';if(p==='mensuelle')vatEvent(d,'ca3-mensuelle',[prev]);else if(pm%3===0)vatEvent(d,'ca3-trimestrielle',monthsBack(prev,3));return;}
      if(!tvR){if(inWindow(d)){missingExpenses.push('tva-regime');echeances.push({date:d,nature:'regime-inconnu',montant:null,complet:false,source:'inconnu'});}return;}
      if(d<Y27){if(mm===7)vatEvent(d,'acompte-simplifie',monthsBack(ym.slice(0,4)+'-06',6));else if(mm===12)vatEvent(d,'acompte-simplifie',monthsBack(ym,6));return;}
      if(!tvC){if(inWindow(d)){missingExpenses.push('tva-cloture');echeances.push({date:d,nature:'cloture-inconnue',montant:null,complet:false,source:'inconnu'});}return;}
      var first=nextMonth(tvC.slice(0,7));if(prev<first)return;
      if(!tvP){if(inWindow(d)){missingExpenses.push('tva-periodicite');echeances.push({date:d,nature:'periodicite-inconnue',montant:null,complet:false,source:'inconnu'});}return;}
      if(tvP==='mensuelle'){vatEvent(d,'ca3-mensuelle',[prev]);return;}
      if(pm%3!==0)return;var q=monthsBack(prev,3);if(q[0]<first){vatUnknown(d,'transition','tva-transition');return;}vatEvent(d,'ca3-trimestrielle',q);
    }
    function vatOnce(){if(tvR!=='simplifie'||!tvC)return;if(tvC==='2026-12-31'){vatUnknown('2027-05-04','solde-ca12','tva-solde');return;}
      var ym3=nextMonth(nextMonth(nextMonth(tvC.slice(0,7)))),last=tvC===due(tvC.slice(0,7),0);vatUnknown(due(ym3,last?0:Number(tvC.slice(8))),'solde-ca12e','tva-solde');
      var cm=Number(tvC.slice(5,7));if(cm>=7&&cm<=11)vatUnknown(due('2027-07',params.jTva),'acompte-2027-07','tva-acompte');}
    for(var ym=firstMonth;ym<=lastMonth;ym=addDate(ym+'-01',32).slice(0,7)){
      [['nets','salaires','jSal'],['fixes','loyer','jLoy'],['emprunt','emprunt','jEmp'],['prelevements','prelevements','jPre'],['investissements','investissements','jPre']].forEach(function(x){var p=parseInput(M[x[0]],{nonnegative:true});if(p.state==='known')push(due(ym,params[x[2]]),x[1],fraction(p.value).mul(-1));});
      var previous=addDate(ym+'-01',-1).slice(0,7),prevMonth=Number(previous.slice(5)),cot=parseInput(M.cotisations,{nonnegative:true});if(cot.state==='known'&&(!params.trim||prevMonth%3===0))push(due(ym,params.jUr),'cotisations',fraction(cot.value).mul(params.trim?-3:-1));
      vatDue(ym);
    }
    vatOnce();
    var weeks=[],balance=fraction(opening.value),minimum=null,critical=null,totalOut=fraction(0);
    for(var w=0;w<13;w++){var start=addDate(input.debut,w*7),finish=addDate(start,6),receipts=fraction(0),payments=fraction(0),detail={};for(var d=start;d<=finish;d=addDate(d,1))(flow[d]||[]).forEach(function(f){if(f.v.cmp(0)>0)receipts=receipts.add(f.v);else{payments=payments.add(f.v);detail[f.k]=(detail[f.k]||fraction(0)).add(f.v);}});balance=balance.add(receipts).add(payments);totalOut=totalOut.sub(payments);var row={i:w,debut:start,fin:finish,encaissements:money(receipts),sorties:money(payments),solde:money(balance),detail:Object.keys(detail).map(function(k){return {k:k,v:money(detail[k])};}).sort(function(a,b){return a.v-b.v;})};weeks.push(row);if(!minimum||balance.cmp(minimum)<0){minimum=balance;critical=row;}}
    var complete=!missingDates.length&&!missingExpenses.length,average=totalOut.div(13);
    function state(b){b=fraction(b);return !complete?'info':b.cmp(0)<0?'rouge':average.cmp(0)<=0?'info':b.cmp(average.mul(2))<0?'orange':b.cmp(average.mul(4))<0?'jaune':'vert';}
    weeks.forEach(function(w){w.etat=state(w.solde);});return {ok:true,complete:complete,missingDates:missingDates,missingExpenses:Array.from(new Set(missingExpenses)),semaines:weeks,pointBas:money(minimum),semaineCritique:critical,etat:state(minimum),sortiesMoyennes:money(average),causes:critical?critical.detail.slice(0,3):[],params:params,tva:{regime:tvR,periodicite:tvP,cloture:tvC?String(TV.cloture):null,clotureExercice:tvC,echeances:echeances.sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;})},engineVersion:'A10.1'};
  }

  function laborAmounts(x){var batch=fraction(x.batchMin||0),finish=fraction(x.finishMin||0),people=fraction(x.batchPeople||0),finPeople=fraction(x.finishPeople||0),rate=fraction(x.rate||0);var per=batch.cmp(0)>0?batch.mul(people).div(x.batchQty):fraction(0),active=per.add(finish.mul(finPeople)),cost=active.mul(rate).div(60),batchCost=batch.mul(people).mul(rate).div(60);return {cost:cost.number(),activeMinutesPerPortion:active.number(),batchCost:money(batchCost),exact:{cost:cost.toJSON(),active:active.toJSON(),batchCost:batchCost.toJSON()}};}
  function preparationAmounts(material,yieldQty,labor){var yieldValue=fraction(yieldQty),mat=fraction(material),unit=mat.div(yieldValue),laborUnit=labor&&labor.exact?fromExact(labor.exact.cost):labor&&labor.cost!==null?fraction(labor.cost):null,batch=labor&&labor.exact?fromExact(labor.exact.batchCost):labor&&labor.batchCost!==null?fraction(labor.batchCost):null;return {materialUnitCost:unit.number(),laborUnitCost:laborUnit?laborUnit.number():null,directBatchCost:batch?mat.add(batch).number():null,directUnitCost:laborUnit?unit.add(laborUnit).number():null,exact:{materialUnitCost:unit.toJSON(),laborUnitCost:laborUnit?laborUnit.toJSON():null,activeMinutesPerUnit:labor&&labor.exact?labor.exact.active:null,laborBatchCost:batch?batch.toJSON():null}};}
  function preparationAllocation(prep,quantity){var qty=fraction(quantity);function value(name,fallback){return prep.exact&&prep.exact[name]?fromExact(prep.exact[name]):fallback!==null&&fallback!==undefined?fraction(fallback):null;}var mat=prep.materialReady?value('materialUnitCost',prep.materialUnitCost):null,lab=prep.laborReady?value('laborUnitCost',prep.laborUnitCost):null,active=prep.laborReady?value('activeMinutesPerUnit',prep.activeMinutesPerUnit):null;return {materialCost:mat?mat.mul(qty).number():null,laborCost:lab?lab.mul(qty).number():null,activeMinutes:active?active.mul(qty).number():null,exact:{materialCost:mat?mat.mul(qty).toJSON():null,laborCost:lab?lab.mul(qty).toJSON():null,activeMinutes:active?active.mul(qty).toJSON():null}};}
  function combineLabor(dish,allocations){var prepCost=fraction(0),prepMinutes=fraction(0),ready=true;allocations.forEach(function(a){if(!a||!a.laborReady||!(a.quantity>0)){ready=false;return;}prepCost=prepCost.add(a.exact&&a.exact.laborCost?fromExact(a.exact.laborCost):a.laborCost||0);prepMinutes=prepMinutes.add(a.exact&&a.exact.activeMinutes?fromExact(a.exact.activeMinutes):a.activeMinutes||0);});var dishCost=dish.exact?fromExact(dish.exact.cost):fraction(dish.cost||0),dishMinutes=dish.exact?fromExact(dish.exact.active):fraction(dish.activeMinutesPerPortion||0),complete=!!dish.ready&&ready;return {cost:complete?dishCost.add(prepCost).number():null,preparationCost:ready?prepCost.number():null,activeMinutesPerPortion:complete?dishMinutes.add(prepMinutes).number():null,preparationActiveMinutes:ready?prepMinutes.number():null,exact:complete?{cost:dishCost.add(prepCost).toJSON(),active:dishMinutes.add(prepMinutes).toJSON()}:null};}
  function unitFactor(from,to){var units={kg:['mass',1000],g:['mass',1],mg:['mass','.001'],l:['volume',1000],litre:['volume',1000],ml:['volume',1],cl:['volume',10],portion:['count',1],unite:['count',1],piece:['count',1],u:['count',1]};from=String(from||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/s$/,'');to=String(to||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/s$/,'');if(from===to&&from)return fraction(1);if(!units[from]||!units[to]||units[from][0]!==units[to][0])throw new Error('INCOMPATIBLE_UNITS');return fraction(units[from][1]).div(units[to][1]);}

  var ISSUE_TEXT={"RECIPE_CYCLE": ["Boucle entre préparations : corrige les références.", "Preparation cycle: correct the references.", "Ciclo entre preparaciones: corrige las referencias.", "Ciclo tra preparazioni: correggi i riferimenti.", "Zyklus zwischen Zubereitungen: Verweise korrigieren.", "Cyclus tussen bereidingen: corrigeer de verwijzingen.", "Ciclo entre preparações: corrige as referências."], "PREPARATION_QUANTITY_INVALID": ["Quantité de préparation à renseigner.", "Enter a preparation quantity.", "Indica la cantidad de preparación.", "Indica la quantità della preparazione.", "Menge der Zubereitung angeben.", "Vul de hoeveelheid bereiding in.", "Indica a quantidade da preparação."], "INCOMPATIBLE_UNITS": ["Unités incompatibles.", "Incompatible units.", "Unidades incompatibles.", "Unità incompatibili.", "Einheiten passen nicht zusammen.", "Onverenigbare eenheden.", "Unidades incompatíveis."]};function issueText(code,language){var index=['fr','en','es','it','de','nl','pt'].indexOf(String(language||'fr').slice(0,2));return ISSUE_TEXT[code]?ISSUE_TEXT[code][Math.max(0,index)]:String(code);}
  function dishFinancial(existing,p,material,rate,settings){
 var o=existing,cost=material.exact?fromExact(material.exact.total):fraction(material.total),read=parseInput(p.ttc,{nonnegative:true}),price=read.state==='known'?ht(fromExact(read.exact),rate):null,margin=price&&material.complete?price.sub(cost):null,labor=o.labor&&o.labor.ready?(o.labor.exact?fromExact(o.labor.exact.cost):fraction(o.labor.cost)):null,missing=[];
 o.priceReady=!!price;o.partialMaterialCost=cost.number();o.cout=material.complete?cost.number():null;o.ht=price?price.number():null;o.marge=margin?margin.number():null;o.margePct=margin&&price.cmp(0)>0?margin.div(price).mul(100).number():null;o.coef=price&&material.complete&&cost.cmp(0)>0?price.div(cost).number():null;
 o.directCost=material.complete&&labor?cost.add(labor).number():null;o.directMargin=margin&&labor?margin.sub(labor).number():null;o.directMarginPct=o.directMargin!==null&&price.cmp(0)>0?margin.sub(labor).div(price).mul(100).number():null;
 if(!price)missing.push('onsite_sale_price');if(!material.complete)missing.push('recipe_cost');if(!labor)missing.push('labor_cost');
 var platform=null,platformMargin=null,platformNet=null;
 if(p.pf){var pfPrice=parseInput(p.pfttc,{nonnegative:true}),commission=parseInput(settings.compf,{nonnegative:true,max:100}),pack=parseInput(settings.pack,{nonnegative:true});platform=pfPrice.state==='known'?ht(fromExact(pfPrice.exact),rate):null;var comm=platform&&commission.state==='known'?platform.mul(fromExact(commission.exact)).div(100):null,packValue=pack.state==='known'?fromExact(pack.exact):null;platformNet=platform&&comm&&packValue?platform.sub(comm).sub(packValue):null;platformMargin=platformNet&&material.complete?platformNet.sub(cost):null;if(!platform)missing.push('platform_sale_price');if(!comm)missing.push('platform_commission');if(!packValue)missing.push('platform_packaging');o.pf=Object.assign({},o.pf||{},{complete:!!platformMargin,ht:platform?platform.number():null,comm:comm?comm.number():null,pack:packValue?packValue.number():null,net:platformNet?platformNet.number():null,marge:platformMargin?platformMargin.number():null,margePct:platformMargin&&platform.cmp(0)>0?platformMargin.div(platform).mul(100).number():null,directCost:platformMargin&&labor?cost.add(labor).add(comm).add(packValue).number():null,directMargin:platformMargin&&labor?platformMargin.sub(labor).number():null,directMarginPct:platformMargin&&labor&&platform.cmp(0)>0?platformMargin.sub(labor).div(platform).mul(100).number():null});}
 var shareRead=parseInput(p.pf?p.pfshare:0,{nonnegative:true,max:100}),share=shareRead.state==='known'?fromExact(shareRead.exact).div(100):null,onsite=share?fraction(1).sub(share):null;
 o.mixReady=!!share&&(!onsite.cmp(0)||!!margin)&&(!share.cmp(0)||!!platformMargin);
 if(o.mixReady){var weightedPrice=(onsite.cmp(0)>0?price.mul(onsite):fraction(0)).add(share.cmp(0)>0?platform.mul(share):0),weightedMargin=(onsite.cmp(0)>0?margin.mul(onsite):fraction(0)).add(share.cmp(0)>0?platformMargin.mul(share):0);o.htPond=weightedPrice.number();o.contribPond=weightedMargin.number();o.contribPct=weightedPrice.cmp(0)>0?weightedMargin.div(weightedPrice).mul(100).number():null;o.directContribPond=labor?weightedMargin.sub(labor).number():null;o.directContribPct=labor&&weightedPrice.cmp(0)>0?weightedMargin.sub(labor).div(weightedPrice).mul(100).number():null;o.ecartObjectif=o.contribPct!==null?o.contribPct-o.objPond:null;o.exact={cost:cost.toJSON(),weightedPrice:weightedPrice.toJSON(),weightedMargin:weightedMargin.toJSON()};}
 else{o.htPond=null;o.contribPond=null;o.contribPct=null;o.directContribPond=null;o.directContribPct=null;o.ecartObjectif=null;}
 o.missingFinancialInputs=missing;o.engineVersion='A10.1';return o;
}
  return { version: 'A10.1',issueText:issueText,laborAmounts:laborAmounts,preparationAmounts:preparationAmounts,preparationAllocation:preparationAllocation,combineLabor:combineLabor,unitFactor:unitFactor,cashPlanning:cashPlanning,cashBridge:cashBridge,isoDate:isoDate,addDate:addDate,Fraction: Fraction, fraction: fraction, fromExact: fromExact, exact: exact, sum: sum, money: money, parseInput: parseInput, coverage: coverage, allocate: allocate, derived: derived, metrics:metrics,monthlyTargets:monthlyTargets,breakEven: breakEven, ingredientUnitCost: ingredientUnitCost, recipeLines: recipeLines, recipeMaterial: recipeMaterial, ht: ht, dishFinancial: dishFinancial,inventoryGoal:inventoryGoal,inventoryAssessment:inventoryAssessment,inventoryValuation:inventoryValuation };
});
