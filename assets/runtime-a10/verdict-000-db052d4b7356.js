/* Coverage and percentage display use the shared decimal engine. */
(function(w){'use strict';
 function ratio(raw){var p=w.VerdictFinance.parseInput(raw);return p.state==='known'?w.VerdictFinance.fromExact(p.exact):null;}
 function zoneRatio(raw){var r=ratio(raw);return r?w.VerdictFinance.coverage(r,1).state:'neutral';}
 function zoneAmounts(actual,target){var a=ratio(actual),t=ratio(target);if(!a||!t||t.cmp(0)<=0)return 'neutral';return w.VerdictFinance.coverage(a,t).state;}
 function pctValue(raw,decimals){var r=ratio(raw);if(!r)return null;decimals=decimals==null?0:decimals;var p=r.mul(100),display=p.number(decimals);[90,95,100].forEach(function(boundary){if(p.cmp(boundary)<0&&display>=boundary)display=p.number(decimals,'floor');});return display;}
 w.VerdictExact={zoneRatio:zoneRatio,zoneAmounts:zoneAmounts,pctValue:pctValue,rules:'V2-couverture-90-95-100',engineVersion:'A10.1'};
})(window);
