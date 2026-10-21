(function(){
  var ov=document.createElement('div');ov.id='shCarte';ov.className='modal';ov.setAttribute('aria-hidden','true');ov.innerHTML='<div class="p"></div>';document.body.appendChild(ov);
  function closeCardScoreSheet(){if(!ov.classList.contains('on'))return;try{a11yDialogRestore(ov);}catch(e){}ov.classList.remove('on');ov.setAttribute('aria-hidden','true');}
  window.cardScoreSheetClose=closeCardScoreSheet;
  ov.addEventListener('click',function(e){if(e.target===ov)closeCardScoreSheet();});
  function metric(label,value){return '<div class="card-score-metric"><span>'+esc(label)+'</span><b>'+esc(value)+'</b></div>';}
  function scoreRow(label,pct,value,color){return '<div class="shrow"><span>'+esc(label)+'</span><div class="bar"><i style="width:'+Math.max(2,Math.min(100,pct))+'%;background:'+color+'"></i></div><b style="color:'+color+'">'+esc(value)+'</b></div>';}
  function formulaText(C,sc){return C.formulaText.replace('{c}',String(sc.coveragePoints)).replace('{m}',String(sc.contributionPoints)).replace('{t}',String(sc.total));}
  window.cardScoreSheetOpen=function(){
    var st=carteStats(),sc=scoreCarte(st),cd=cardDiagnosticStats(st,moteur()),C=cardScoreCopy(),z=zone(sc.total),col=sc.available?z.h:'#64748b';
    var h='<div class="shhead"><h3>'+esc(C.detail)+'</h3><button type="button" class="shtopx" onclick="cardScoreSheetClose()" aria-label="'+esc(C.close)+'">×</button></div>';
    if(!sc.available){
      h+='<p>Pour noter la couverture des charges : complétez Structure et toutes les fiches vendues, puis confirmez que les volumes couvrent la carte entière sur un mois complet.</p><button class="btn" onclick="cardScoreSheetClose();document.getElementById(&quot;p5-reference-card&quot;)?.setAttribute(&quot;open&quot;,&quot;&quot;);document.getElementById(&quot;p5-reference-card&quot;)?.scrollIntoView({block:&quot;center&quot;})">Vérifier la période et le périmètre</button>';
      var missing=cardScoreMissingState(st),G=cardScoreGuideCopy();window._cardScoreMissing=missing;
      h+='<div class="card-score-formula"><b>'+esc(G.title)+'</b>'+esc(G.intro)+'<br>'+esc(G.entered+' : '+missing.total)+'</div>';
      if(missing.items.length)h+='<div class="card-score-missing-list">'+missing.items.map(function(x){return '<div class="card-score-missing-item"><span class="req">*</span><span>'+esc(x.label)+'</span></div>';}).join('')+'</div>';
      h+='<p class="shn">'+esc(C.independent)+'</p>';
      if(missing.primary)h+='<button type="button" class="shx card-score-fix" onclick="cardScoreGuideGo()">'+esc(G.fix+' : '+missing.primary.label)+'</button>';
      h+='<button type="button" class="shx" onclick="cardScoreSheetClose()">'+esc(C.close)+'</button>';
    }else{
      window._cardScoreMissing=null;
      var gap=cd.gap==null?C.noGap:((cd.gap>=0?'+':'−')+fr(Math.abs(cd.gap),1)+' points');
      var coverageZone=zone(sc.coveragePct),contributionProgress=Math.round(sc.contributionPoints/60*100),contributionZone=zone(contributionProgress);
      var scoreRef=point5ReferenceState(),isSimulation=!!(scoreRef.demo||scoreRef.estimated||DB.exempleCharge||(DB.dataProvenance&&DB.dataProvenance.nature==='model_estimate'));
      h+='<div class="card-score-modal-summary"><div class="ring card-score-modal-ring" style="--ringcol:'+col+'">'+ringSVG(sc.total,col,112)+'<div class="num"><b style="color:'+col+'">'+sc.total+'</b><small>/100</small></div></div><div><span class="card-score-modal-kicker">'+esc(C.label)+(isSimulation?' · '+esc(C.sim):'')+'</span><strong class="card-score-modal-title" style="color:'+col+'">'+esc(z.t)+'</strong><p class="card-score-modal-independent">'+esc(C.independent)+'</p></div></div>';
      h+=scoreRow('Économie · poids 50 %',sc.economic.n1,fr(sc.economic.n1,1)+' / 100',col);h+=scoreRow('Résistance · poids 25 %',sc.economic.n2,fr(sc.economic.n2,1)+' / 100',col);h+=scoreRow('Exploitation · poids 25 %',sc.economic.n3,fr(sc.economic.n3,1)+' / 100',col);
      h+='<div class="card-score-formula"><b>'+esc(C.formula)+'</b>'+esc(formulaText(C,sc))+'</div>';
      h+='<div class="card-score-metrics">'+metric('Ventes mensuelles HT',eur(sc.economic.revenue))+metric('Contribution aux charges',eur(sc.economic.contribution))+metric('Charges fixes et amortissements',eur(sc.economic.fixed))+metric('Solde simulé avant impôt',eur(sc.economic.result))+metric(C.active,String(cd.active))+metric(C.reliable,String(cd.reliable))+metric(C.theoretical,cd.foodCost!=null?pc(cd.foodCost,1):'—')+metric('Nourriture : achats réels / fiches techniques',cd.actualFoodCost!=null&&cd.theoNour!=null?pc(cd.actualFoodCost,1)+' / '+pc(cd.theoNour,1):'—')+metric(C.actualGap,gap)+metric(C.negative,String(cd.negative))+'</div>';
      if(cd.priority)h+='<div class="shlim" style="border-color:'+col+'"><b>'+esc(C.priority)+' · '+esc(cd.priority.nom)+'</b>'+esc(cd.priority.action)+'</div>';
      else h+='<div class="shlim" style="border-color:#64748b"><b>'+esc(C.priority)+'</b>'+esc(C.noPriority)+'</div>';
      h+='<p class="shn">'+esc(C.limit)+'<br><strong>'+esc(C.independent)+'</strong></p><button type="button" class="shx" onclick="cardScoreSheetClose()">'+esc(C.close)+'</button>';
    }
    ov.querySelector('.p').innerHTML=h;try{translateDOM(ov);}catch(e){}try{if(window.VerdictClientVocabulary)window.VerdictClientVocabulary.apply(ov);}catch(e){}ov.setAttribute('aria-hidden','false');ov.classList.add('on');try{a11yDialogPrepare(ov);}catch(e){}
  };
})();