/* Private application diagnostic: only status counters, no monetary values or client records. */
(function (root) {
  'use strict';
  var state = { checked: 0, agreed: 0, differed: 0, skipped: 0, last: 'NOT_RUN' };
  function decimal(value) {
    if (value === null || value === undefined || value === '') return null;
    var s = String(value);
    if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null;
    var p = s.split('.'), den = 10n ** BigInt((p[1] || '').length);
    return { n: BigInt(p[0].replace(/^-/, '') + (p[1] || '')) * (s[0] === '-' ? -1n : 1n), d: den };
  }
  function add(a, b) { return { n: a.n * b.d + b.n * a.d, d: a.d * b.d }; }
  function sub(a, b) { return { n: a.n * b.d - b.n * a.d, d: a.d * b.d }; }
  function mul(a, b) { return { n: a.n * b.n, d: a.d * b.d }; }
  function div(a, b) { if (!b.n) return null; return { n: a.n * b.d, d: a.d * b.n }; }
  function close(a, b) {
    var diff = sub(a, b), n = diff.n < 0n ? -diff.n : diff.n;
    return n * 100n <= diff.d; // one cent: floating output and exact recalculation
  }
  function record(result) {
    state.last = result;
    if (result === 'NOT_COMPARABLE') state.skipped++;
    else { state.checked++; if (result === 'AGREE') state.agreed++; else state.differed++; }
    return result;
  }
  function auditPayable(caTTC, tvaRate, marginRate, fixedOther, objective, actual) {
    try {
      var ca = decimal(caTTC), tva = decimal(tvaRate), mc = decimal(marginRate), cf = decimal(fixedOther);
      if (!ca || !tva || !mc || !cf || !actual) return record('NOT_COMPARABLE');
      var one = decimal('1'), ht = div(ca, add(one, tva));
      if (!ht) return record('NOT_COMPARABLE');
      var payable = sub(mul(ht, mc), cf);
      var aHt = decimal(actual.ht), aPayable = decimal(actual.breakEven);
      if (!aHt || !aPayable) return record('NOT_COMPARABLE');
      var ok = close(ht, aHt) && close(payable, aPayable);
      var obj = decimal(objective), aWith = decimal(actual.withObjective);
      if (obj && aWith) ok = ok && close(sub(payable, obj), aWith);
      return record(ok ? 'AGREE' : 'DIFFER');
    } catch (_) { return record('NOT_COMPARABLE'); }
  }
  function auditBreakdown(actual) {
    try {
      if (!actual || !actual.ok || !Array.isArray(actual.lignes)) return record('NOT_COMPARABLE');
      var ca = decimal(actual.caHT), rest = decimal(actual.reste), total = decimal('0');
      if (!ca || !rest) return record('NOT_COMPARABLE');
      var resultLines = 0, resultValue = null;
      for (var i = 0; i < actual.lignes.length; i++) {
        var line = actual.lignes[i], amount = decimal(line.eur);
        if (line.k === 'resultat') { resultLines++; resultValue = amount; }
        else if (amount) total = add(total, amount);
      }
      if (resultLines !== 1 || !resultValue) return record('NOT_COMPARABLE');
      return record(close(sub(ca, total), rest) && close(rest, resultValue) ? 'AGREE' : 'DIFFER');
    } catch (_) { return record('NOT_COMPARABLE'); }
  }
  var api = { auditPayable: auditPayable, auditBreakdown: auditBreakdown,
    status: function () { return Object.freeze({ checked: state.checked, agreed: state.agreed, differed: state.differed, skipped: state.skipped, last: state.last }); } };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VerdictInternalAudit = api;
})(typeof self !== 'undefined' ? self : this);
