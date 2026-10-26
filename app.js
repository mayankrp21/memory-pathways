(function(){
  const data=window.MemoryPathways;
  const rows=data.rows;
  const segmentById=Object.fromEntries(data.segments.map(s=>[s.id,s]));
  const opportunityById=Object.fromEntries(data.opportunities.map(o=>[o.id,o]));
  const $=s=>document.querySelector(s);
  const fmt=n=>Math.round(n).toLocaleString('en-US');
  const pct=(x,d=1)=>(100*(Number.isFinite(x)?x:0)).toFixed(d)+'%';
  const pp=x=>(x>=0?'+':'')+(x*100).toFixed(1)+' pp';
  const logistic=x=>1/(1+Math.exp(-x));
  const scenario=$('#scenario'),opportunity=$('#opportunity');
  const nice=(s)=>s.replaceAll('_',' ');
  const outcomes=[1,7,28];
  for(const o of data.opportunities){const opt=document.createElement('option');opt.value=o.id;opt.textContent=o.name;opportunity.appendChild(opt);}
  function effect(){return Number(scenario.value);}
  function chosenRows(){return rows.filter(r=>opportunity.value==='all'||r.opportunity===opportunity.value);}
  function outcome(row,days,e=effect()){
    if(row.followupDays<days)return 'pending';
    const p28=logistic(row.base7+.66+(row.retrieved?e:0));
    const p7=logistic(row.base7+(row.retrieved?e:0));
    const p1=logistic(row.base7-1.28+(row.retrieved?e:0));
    const p30=logistic(row.base7+.72+(row.retrieved?e:0));
    const did28=row.u28<p28;
    const did30=did28||(!did28&&row.u30<(p30-p28)/(1-p28));
    const did7=did28&&row.u7<Math.min(1,p7/p28);
    const did1=did7&&row.u1<Math.min(1,p1/p7);
    return (days===1?did1:days===7?did7:days===30?did30:did28)?'returned':'no_return';
  }
  function summarize(list,predicate){const complete=list.filter(r=>outcome(r,7)!=='pending');const k=complete.filter(predicate).length;return{n:complete.length,k,p:complete.length?k/complete.length:0,pending:list.length-complete.length};}
  function wilson(k,n){if(!n)return[0,0];const z=1.96,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,w=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return[Math.max(0,c-w),Math.min(1,c+w)];}
  function rate(list,predicate){const eligible=list.filter(r=>r.telemetryKnown);const k=eligible.filter(predicate).length;return{n:eligible.length,k,p:eligible.length?k/eligible.length:0,ci:wilson(k,eligible.length)};}
  function pctBar(label,value,color,detail){return `<div class="metric-bar-row"><div class="metric-bar-label"><span>${label}</span><b>${pct(value)}</b></div><div class="bar-track"><i class="${color}" style="width:${Math.max(0,Math.min(100,value*100))}%"></i></div><small>${detail}</small></div>`;}
  function labelColor(id){return segmentById[id]?.color||'violet';}
  function renderKpis(list){
    const known=list.filter(r=>r.telemetryKnown),observed=known.filter(r=>r.observedEvents.length>0);
    const complete7=list.filter(r=>r.followupDays>=7),returns7=complete7.filter(r=>outcome(r,7)==='returned');
    const complaintKnown=list.filter(r=>r.telemetryKnown),complaints=complaintKnown.filter(r=>r.complaint);
    const multi=known.filter(r=>new Set(r.observedEvents.map(e=>e.segment)).size>1);
    const cards=[
      ['Eligible anchor users',fmt(list.length),'One first eligible opportunity per user','01','violet'],
      ['Observed retrieval',pct(known.length?observed.length/known.length:0),`${fmt(observed.length)} of ${fmt(known.length)} with known telemetry`,'02','blue'],
      ['7-day return',pct(complete7.length?returns7.length/complete7.length:0),`${fmt(returns7.length)} returned · ${fmt(list.length-complete7.length)} pending`,'03','green'],
      ['Explicit complaint',pct(complaintKnown.length?complaints.length/complaintKnown.length:0),`${fmt(complaints.length)} anchor-session labels · ${fmt(multi.length)} multi-segment pulls`,'04','coral']
    ];
    $('#kpis').innerHTML=cards.map(c=>`<article class="kpi-card"><div class="kpi-top"><span>${c[0]}</span><i class="kpi-num ${c[4]}">${c[3]}</i></div><b class="kpi-value">${c[1]}</b><small>${c[2]}</small></article>`).join('');
  }
  function renderSegments(list){
    const html=data.segments.map(seg=>{
      if(seg.id==='working'){
        const allEvents=list.filter(r=>r.telemetryKnown).flatMap(r=>r.observedEvents).filter(e=>e.result==='nonempty');
        const included=allEvents.filter(e=>e.contextIncluded),used=allEvents.filter(e=>e.appropriatelyUsed);
        return `<article class="segment-card ${seg.color}"><div class="segment-heading"><span class="segment-glyph">W</span><div><h3>${seg.name}</h3><small>${seg.short}</small></div></div><p>${seg.description}</p><div class="segment-stat"><b>${fmt(included.length)} / ${fmt(allEvents.length)}</b><span>non-empty items added to active context</span></div>${pctBar('Context inclusion',allEvents.length?included.length/allEvents.length:0,'fill-'+seg.color,'Among observed non-empty retrieval items')}${pctBar('Appropriate response use',allEvents.length?used.length/allEvents.length:0,'fill-'+seg.color,'Requires the item to be included and used well')}<div class="segment-takeaway">This is where retrieved information becomes available to the current answer.</div></article>`;
      }
      const eligible=list.filter(r=>opportunityById[r.opportunity].segments.includes(seg.id));
      const known=eligible.filter(r=>r.telemetryKnown);
      const events=known.flatMap(r=>r.observedEvents).filter(e=>e.segment===seg.id);
      const pulledUsers=known.filter(r=>r.observedEvents.some(e=>e.segment===seg.id));
      const nonempty=events.filter(e=>e.result==='nonempty');
      const relevant=nonempty.filter(e=>e.quality==='relevant_correct'||e.quality==='relevant_stale');
      const fresh=nonempty.filter(e=>e.quality==='relevant_correct');
      const used=nonempty.filter(e=>e.appropriatelyUsed);
      const emptyEvents=events.filter(e=>e.result==='empty');
      const coverage=known.length?pulledUsers.length/known.length:0;
      const relevance=nonempty.length?relevant.length/nonempty.length:0;
      const freshness=relevant.length?fresh.length/relevant.length:0;
      const use=nonempty.length?used.length/nonempty.length:0;
      const mapNote=seg.id==='episodic'?'Past events and conversation sequences may support continuity.':seg.id==='semantic'?'Facts and preferences may support personalization and correction.':'Explicit reusable methods may support repeated tasks.';
      return `<article class="segment-card ${seg.color}"><div class="segment-heading"><span class="segment-glyph">${seg.id[0].toUpperCase()}</span><div><h3>${seg.name}</h3><small>${seg.short}</small></div><span class="eligible-chip">${fmt(eligible.length)} eligible</span></div><p>${seg.description}</p><div class="segment-stat"><b>${fmt(pulledUsers.length)} / ${fmt(known.length)}</b><span>eligible users with a retrieval observed</span><em class="empty-chip">${fmt(emptyEvents.length)} empty retrieval events</em></div>${pctBar('Retrieval coverage',coverage,'fill-'+seg.color,'Retrieved users ÷ eligible users with known telemetry')}${pctBar('Relevant result',relevance,'fill-'+seg.color,`${fmt(relevant.length)} of ${fmt(nonempty.length)} non-empty reviewed results`)}${pctBar('Fresh and correct',freshness,'fill-'+seg.color,`${fmt(fresh.length)} of ${fmt(relevant.length)} relevant results`)}${pctBar('Appropriate response use',use,'fill-'+seg.color,`${fmt(used.length)} of ${fmt(nonempty.length)} non-empty results`)}<div class="segment-takeaway">${mapNote}</div></article>`;
    }).join('');
    $('#segments').innerHTML=html;
  }
  const responseCopy={
    new_person:'Synthetic answer: “Got it — I’ll keep Priya’s new role in context as we talk through your first week.”',
    journey:'Synthetic answer: “Last time, we outlined three job-search steps. Which one should we pick up today?”',
    correction:'Synthetic answer: “Thanks for the update. I’ll use Bengaluru as your current city going forward.”',
    preference:'Synthetic answer: “I’ll keep vegetarian options in mind for future meal suggestions.”',
    prior_context:'Synthetic answer: “You were leaning toward the evening course because it fits your work schedule.”',
    repeat_method:'Synthetic answer: “Let’s use your review format: wins, blockers, and next steps.”'
  };
  function resultText(ev){if(!ev)return 'No retrieval observed for this segment.';if(ev.result==='empty')return 'A retrieval was attempted, but it returned no item.';const names={relevant_correct:'Relevant and current',relevant_stale:'Relevant but stale',irrelevant:'Irrelevant',incorrect:'Incorrect'};return `${names[ev.quality]}; ${ev.contextIncluded?'included in active context':'not added to active context'}.`;}
  function sampleMemory(opp,segment){const examples={new_person:{episodic:'Earlier event: the user introduced Priya as their new manager.',semantic:'Person fact: Priya is the user’s manager at their new role.'},journey:{episodic:'Earlier event: the user outlined three job-search steps.',semantic:'Goal: the user is preparing for a job search.'},correction:{semantic:'Current fact: the user’s city is Bengaluru; this replaced an older location.'},preference:{semantic:'Preference: the user prefers vegetarian meal options.'},prior_context:{episodic:'Earlier event: the user compared two evening courses.',semantic:'Constraint: the user needs a course compatible with a full-time work schedule.'},repeat_method:{procedural:'Routine: structure weekly review as wins, blockers, next steps.',semantic:'Preference: the user likes concise weekly planning.'}};return examples[opp]?.[segment]||'Synthetic memory item for this opportunity.';}
  function renderCase(list){
    const candidates=list.filter(r=>r.telemetryKnown&&(r.observedEvents.length||r.writeEvents.length));
    const fallback=list.filter(r=>r.telemetryKnown);
    if(!candidates.length&&!fallback.length){$('#case-card').innerHTML='<p class="empty-state">No synthetic examples for this filter.</p>';return;}
    const pool=candidates.length?candidates:fallback;
    let idx=Number($('#case-card').dataset.caseIndex||0)%pool.length;
    const row=pool[idx],opp=opportunityById[row.opportunity];
    const eventFor=id=>row.observedEvents.find(e=>e.segment===id);
    const segmentEvents=opp.segments.map(id=>({id,event:eventFor(id)}));
    const retrieved=segmentEvents.filter(x=>x.event);
    const retrievalLine=retrieved.length?retrieved.map(x=>`${segmentById[x.id].name}: ${resultText(x)}`).join(' '):'No long-term memory retrieval was observed at this eligible moment.';
    const writeLine=row.writeEvents.length?row.writeEvents.map(w=>`${segmentById[w.segment].name}: ${w.status==='validated'?'write validated':'write did not validate'}`).join(' · '):'No long-term memory write in this example.';
    const returnStatus=outcome(row,7);
    const retText=returnStatus==='pending'?'7-day follow-up is still pending':returnStatus==='returned'?'A new session was observed within 7 days':'No new session was observed within 7 days';
    const complaintText=row.complaint?`Explicit signal: ${row.complaintType}.`:'No explicit memory complaint was labeled in the anchor session.';
    const steps=[
      ['01','Opportunity',opp.name,opp.example,'step-opportunity'],
      ['02','Retrieve',retrieved.length?`${retrieved.length} segment${retrieved.length===1?'':'s'} retrieved`:'No pull observed',retrievalLine,'step-retrieval'],
      ['03','Working context',row.observedEvents.some(e=>e.contextIncluded)?'Some retrieved context was included':retrieved.length?'Nothing reached active context':'No retrieved item to include',row.observedEvents.some(e=>e.appropriatelyUsed)?'At least one retrieved item was used appropriately in the simulated response.':'No appropriate use label for an included retrieved item.','step-context'],
      ['04','Grounding & response',row.responseGrounding==='supported'?'Response supported by available context':'Response support flag: needs review',responseCopy[row.opportunity],'step-response'],
      ['05','User signal',row.complaint?'Complaint labeled':'No complaint label',complaintText,'step-user'],
      ['06','Learning',row.writeEvents.length?'Memory write/update event': 'No write event',writeLine,'step-learning'],
      ['07','Return',returnStatus==='returned'?'Returned':returnStatus==='pending'?'Pending':'No return in window',retText,'step-return']
    ];
    $('#case-card').dataset.caseIndex=String(idx);
    $('#case-card').innerHTML=`<div class="case-top"><div><span class="case-label">SYNTHETIC USER ${String(row.id).padStart(4,'0')}</span><h3>${opp.name}</h3><p>Prior engagement: <b>${row.engagement.toLowerCase()}</b> · ${row.priorSessions} sessions in prior 7 days · ${row.tenureDays} days since signup</p></div><span class="case-tag">Example trace</span></div><div class="case-steps">${steps.map(s=>`<article class="case-step ${s[4]}"><div class="case-step-number">${s[0]}</div><div><span>${s[1]}</span><b>${s[2]}</b><p>${s[3]}</p></div></article>`).join('')}</div><div class="case-caveat">This is a generated walkthrough. A single case explains how to read the measures; it cannot establish a population pattern.</div>`;
  }
  function renderQuality(list){
    const events=list.filter(r=>r.telemetryKnown).flatMap(r=>r.observedEvents).filter(e=>e.result==='nonempty');
    const labels=[['Relevant & current',events.filter(e=>e.quality==='relevant_correct').length,'green'],['Relevant but stale',events.filter(e=>e.quality==='relevant_stale').length,'amber'],['Irrelevant',events.filter(e=>e.quality==='irrelevant').length,'coral'],['Incorrect',events.filter(e=>e.quality==='incorrect').length,'red']];
    const total=events.length;
    $('#quality-chart').innerHTML=labels.map(([name,count,color])=>`<div class="stack-row"><div><span>${name}</span><b>${fmt(count)} <small>${pct(total?count/total:0)}</small></b></div><div class="stack-track"><i class="stack-${color}" style="width:${total?count/total*100:0}%"></i></div></div>`).join('')+`<div class="quality-total">${fmt(total)} observed non-empty retrieval items · segment events can overlap within a user turn.</div>`;
    const nonempty=events.length,inContext=events.filter(e=>e.contextIncluded),used=events.filter(e=>e.appropriatelyUsed);
    $('#use-chart').innerHTML=`<div class="mini-funnel"><div><span>Non-empty retrievals</span><b>${fmt(nonempty)}</b></div><i>↓</i><div><span>Added to active context</span><b>${fmt(inContext.length)} <small>${pct(nonempty?inContext.length/nonempty:0)}</small></b></div><i>↓</i><div><span>Used appropriately</span><b>${fmt(used.length)} <small>${pct(nonempty?used.length/nonempty:0)}</small></b></div></div>`;
    const known=list.filter(r=>r.telemetryKnown),complaints=known.filter(r=>r.complaint);
    const cLabels=['incorrect memory','irrelevant memory','stale memory','missing memory','unwanted recall'];
    $('#complaint-chart').innerHTML=`<div class="complaint-total"><b>${fmt(complaints.length)}</b><span>explicit labels · ${pct(known.length?complaints.length/known.length:0)} of ${fmt(known.length)} users with known telemetry</span></div>`+cLabels.map(label=>{const n=complaints.filter(r=>r.complaintType===label).length;return `<div class="complaint-line"><span>${label}</span><div class="complaint-track"><i style="width:${complaints.length?n/complaints.length*100:0}%"></i></div><b>${fmt(n)}</b></div>`;}).join('');
    renderLearning(list);
  }
  function renderLearning(list){
    const events=list.flatMap(r=>r.writeEvents.map(w=>({...w,opportunity:r.opportunity})));
    const writes=events.length,validated=events.filter(w=>w.status==='validated').length;
    const later=events.filter(w=>w.status==='validated'&&w.laterRelevant),persisted=later.filter(w=>w.persisted).length;
    $('#learning-summary').innerHTML=`<div class="learning-icon">↻</div><div class="learning-copy"><span class="eyebrow">LEARNING · WRITING TO LONG-TERM MEMORY</span><b>${fmt(validated)} of ${fmt(writes)} simulated write events validated (${pct(writes?validated/writes:0)})</b><small>At a later relevant opportunity, ${fmt(persisted)} of ${fmt(later.length)} validated-write cases preserved the update. This measures simulated memory persistence, not user retention.</small></div><div class="learning-segments">${data.segments.filter(s=>s.id!=='working').map(s=>{const n=events.filter(w=>w.segment===s.id).length;return `<span class="${s.color}">${s.name} <b>${fmt(n)}</b></span>`;}).join('')}</div>`;
  }
  function standardize(complete,exposed){
    const known=complete.filter(r=>r.telemetryKnown),levels=['Low','Medium','High'];let estimate=0,variance=0;
    for(const level of levels)for(const opp of data.opportunities){
      const targetRows=known.filter(r=>r.engagement===level&&r.opportunity===opp.id);
      const weight=known.length?targetRows.length/known.length:0;
      const cell=targetRows.filter(exposed),success=cell.filter(r=>outcome(r,7)==='returned').length,n=cell.length;
      const p=n?success/n:0;estimate+=weight*p;if(n)variance+=weight*weight*p*(1-p)/n;
    }
    const m=1.96*Math.sqrt(variance);return{p:estimate,lo:Math.max(0,estimate-m),hi:Math.min(1,estimate+m)};
  }
  function renderRetentionCurve(){
    const series=[
      {id:'short',label:'Short-term / working context',color:'#7258d5',share:r=>r.shortTermSessionShare},
      {id:'long',label:'Long-term retrieval',color:'#4d7fc1',share:r=>r.longTermSessionShare},
      {id:'combined',label:'Combined memory activity',color:'#368b70',share:r=>r.combinedSessionShare}
    ];
    const W=900,H=365,left=62,right=24,top=24,bottom=72,plotW=W-left-right,plotH=H-top-bottom,maxY=.7;
    const x=i=>left+i*plotW/10,y=v=>top+plotH-(v/maxY)*plotH;
    const grid=[0,.1,.2,.3,.4,.5,.6,.7].map(v=>`<g><line x1="${left}" y1="${y(v)}" x2="${W-right}" y2="${y(v)}" stroke="#e9eaf0"/><text x="${left-10}" y="${y(v)+4}" text-anchor="end" fill="#858a9a" font-size="11">${Math.round(v*100)}%</text></g>`).join('');
    let paths='',dots='',xLabels='';
    for(let i=0;i<=10;i++)xLabels+=`<text x="${x(i)}" y="${top+plotH+24}" text-anchor="middle" fill="#596074" font-size="11">${i*10}%</text>`;
    const legend=series.map(s=>`<span><i style="background:${s.color}"></i>${s.label}</span>`).join('');
    const days=Number($('#retention-window').value);
    for(const s of series){
      const points=[];
      for(let i=0;i<=10;i++){
        const cohort=rows.filter(r=>r.telemetryKnown&&r.followupDays>=days&&Math.min(10,Math.floor(s.share(r)*10+.5))===i);
        const returned=cohort.filter(r=>outcome(r,days)==='returned').length;
        if(cohort.length)points.push({x:x(i),y:y(returned/cohort.length),n:cohort.length,rate:returned/cohort.length,bin:i*10});
      }
      if(points.length>1){
        let d=`M ${points[0].x} ${points[0].y}`;
        for(let i=0;i<points.length-1;i++){
          const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
          const c1x=p1.x+(p2.x-p0.x)/6,c1y=p1.y+(p2.y-p0.y)/6;
          const c2x=p2.x-(p3.x-p1.x)/6;
          const lowY=Math.min(p1.y,p2.y),highY=Math.max(p1.y,p2.y);
          const smoothY=value=>Math.max(lowY,Math.min(highY,value));
          const safeC1y=smoothY(c1y),safeC2y=smoothY(p2.y-(p3.y-p1.y)/6);
          d+=` C ${c1x} ${safeC1y}, ${c2x} ${safeC2y}, ${p2.x} ${p2.y}`;
        }
        paths+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="3.5" stroke-linecap="round"/>`;
      }
      dots+=points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="white" stroke="${s.color}" stroke-width="2"><title>${s.label} · ${p.bin}% session-frequency band: ${pct(p.rate)} ${days}-day return · n=${fmt(p.n)}</title></circle>`).join('');
    }
    $('#retention-curve').innerHTML=`<div class="curve-legend">${legend}</div><div class="curve-scroll"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Smoothed line chart of ${days}-day return by the share of prior sessions with memory activity">${grid}<line x1="${left}" y1="${top+plotH}" x2="${W-right}" y2="${top+plotH}" stroke="#cfd2dc"/>${paths}${dots}${xLabels}<text x="${left+plotW/2}" y="${H-15}" text-anchor="middle" fill="#555b6f" font-size="12">Share of sessions with memory activity · prior 28 days</text><text transform="translate(17 ${top+plotH/2}) rotate(-90)" text-anchor="middle" fill="#555b6f" font-size="12">Users returning within ${days} days</text></svg></div><div class="curve-foot"><b>How to read:</b> Users are grouped by the percentage of their observed sessions in the prior 28 days with short-term/working-context use, long-term retrieval, or either. Points show the synthetic group rates; smooth curves are a visual guide. Working context is an observable proxy for short-term memory use, not a separate long-term retrieval store. Hover a point for its denominator. The relationship is observational and synthetic, not causal.</div>`;
  }
  function renderReturn(list){
    const mature=list.filter(r=>r.followupDays>=7&&r.telemetryKnown);
    const groups=[
      {id:'retrieved',label:'At least one segment retrieved',color:'violet',test:r=>r.observedEvents.length>0},
      {id:'no_pull',label:'No pull observed',color:'gray',test:r=>r.observedEvents.length===0},
      {id:'unknown',label:'Telemetry unknown',color:'amber',test:r=>!r.telemetryKnown}
    ];
    const knownMature=mature;
    const chart=groups.slice(0,2).map(g=>{
      const set=knownMature.filter(g.test),returned=set.filter(r=>outcome(r,7)==='returned').length,p=set.length?returned/set.length:0,ci=wilson(returned,set.length);
      const adj=standardize(knownMature,g.test);
      return `<article class="return-group"><div class="return-group-head"><b>${g.label}</b><span>n = ${fmt(set.length)}</span></div><div class="rate-line"><span>Crude</span><div class="rate-track"><i class="${g.color}" style="width:${p*100}%"></i></div><b>${pct(p)}</b></div><small class="rate-ci">95% Wilson interval ${pct(ci[0])}–${pct(ci[1])} · ${fmt(returned)} / ${fmt(set.length)}</small><div class="rate-line adjusted-line"><span>Standardized</span><div class="rate-track"><i class="teal" style="width:${adj.p*100}%"></i></div><b>${pct(adj.p)}</b></div><small class="rate-ci">Approx. interval ${pct(adj.lo)}–${pct(adj.hi)} · balances engagement and opportunity mix</small></article>`;
    }).join('');
    $('#return-chart').innerHTML=chart;
    const pull=knownMature.filter(r=>r.observedEvents.length>0),none=knownMature.filter(r=>!r.observedEvents.length);
    const pPull=pull.length?pull.filter(r=>outcome(r,7)==='returned').length/pull.length:0,pNone=none.length?none.filter(r=>outcome(r,7)==='returned').length/none.length:0;
    const aPull=standardize(knownMature,r=>r.observedEvents.length>0),aNone=standardize(knownMature,r=>r.observedEvents.length===0);
    const crudeGap=pPull-pNone,adjGap=aPull.p-aNone.p;
    const assumption=effect()===0?'The simulation sets the true retrieval effect to zero.':effect()>0?'The simulation adds a small positive retrieval effect.':'The simulation adds a small negative retrieval effect.';
    const conclusion=Math.abs(crudeGap-adjGap)>.025?'The raw gap changes after balancing measured differences. That is evidence that the crude comparison mixed memory status with cohort composition.':'The raw and standardized gaps are similar in this simulated cohort. Measured engagement and opportunity mix explain little of the difference here.';
    $('#gap-summary').innerHTML=`<div class="truth-chip">${assumption}</div><p><b>Crude gap: ${pp(crudeGap)}.</b> After standardizing for prior engagement and opportunity type: <b>${pp(adjGap)}.</b> ${conclusion} This remains an association; adjustment cannot remove unmeasured bias.</p>`;
    const activity=['Low','Medium','High'].map(level=>{const set=list.filter(r=>r.engagement===level),known=set.filter(r=>r.telemetryKnown),pulled=known.filter(r=>r.observedEvents.length>0),matureSet=set.filter(r=>r.followupDays>=7),ret=matureSet.filter(r=>outcome(r,7)==='returned');return `<div class="activity-row"><div class="activity-label"><b>${level}</b><small>${fmt(set.length)} users · ${fmt(set[0]?.priorSessions?set.reduce((a,r)=>a+r.priorSessions,0)/set.length:0)} avg prior sessions</small></div><div><div class="activity-bar-label"><span>Retrieval</span><b>${pct(known.length?pulled.length/known.length:0)}</b></div><div class="activity-track"><i class="violet" style="width:${known.length?pulled.length/known.length*100:0}%"></i></div></div><div><div class="activity-bar-label"><span>7-day return</span><b>${pct(matureSet.length?ret.length/matureSet.length:0)}</b></div><div class="activity-track"><i class="teal" style="width:${matureSet.length?ret.length/matureSet.length*100:0}%"></i></div></div></div>`;}).join('');
    $('#activity-chart').innerHTML=activity;
    renderRetentionCurve();
    const table=groups.map(g=>{const set=list.filter(g.test),rowsOut=outcomes.map(days=>{const complete=set.filter(r=>r.followupDays>=days),ret=complete.filter(r=>outcome(r,days)==='returned').length;return `<td>${fmt(ret)} / ${fmt(complete.length)} <span>${pct(complete.length?ret/complete.length:0)}</span><small>${fmt(set.length-complete.length)} pending</small></td>`;}).join('');const c=set.filter(r=>r.telemetryKnown),compl=c.filter(r=>r.complaint);return `<tr><th>${g.label}</th><td>${fmt(set.length)}</td>${rowsOut}<td>${fmt(compl.length)} / ${fmt(c.length)} <span>${pct(c.length?compl.length/c.length:0)}</span></td></tr>`;}).join('');
    $('#return-table').innerHTML=`<table><thead><tr><th>Observed state</th><th>Users</th><th>1-day return</th><th>7-day return</th><th>28-day return</th><th>Anchor complaints</th></tr></thead><tbody>${table}</tbody></table>`;
    $('#interpretation').innerHTML=`<article><span>READ 1</span><b>Crude does not mean causal</b><p>Users can return for many reasons unrelated to memory retrieval.</p></article><article><span>READ 2</span><b>Adjustment is a check, not proof</b><p>We balance measured pre-anchor engagement and opportunity type only.</p></article><article><span>READ 3</span><b>Unknown stays unknown</b><p>Users with unavailable telemetry are not silently counted as “no pull.”</p></article>`;
  }
  function renderOpportunities(){
    const html=data.opportunities.map(o=>{const set=rows.filter(r=>r.opportunity===o.id),eligibleKnown=set.filter(r=>r.telemetryKnown);const pulled=eligibleKnown.filter(r=>r.observedEvents.length);const complaint=eligibleKnown.filter(r=>r.complaint);const mature=set.filter(r=>r.followupDays>=7);const returned=mature.filter(r=>outcome(r,7)==='returned');const target=o.segments.map(s=>segmentById[s].name).join(' + ');return `<tr><th>${o.name}<small>${o.example}</small></th><td>${fmt(set.length)}</td><td>${pct(eligibleKnown.length?pulled.length/eligibleKnown.length:0)}<small>${target}</small></td><td>${pct(eligibleKnown.length?complaint.length/eligibleKnown.length:0)}<small>${fmt(complaint.length)} explicit labels</small></td><td>${pct(mature.length?returned.length/mature.length:0)}<small>${fmt(returned.length)} / ${fmt(mature.length)} mature</small></td></tr>`;}).join('');
    $('#opportunity-table').innerHTML=`<table><thead><tr><th>Eligible moment</th><th>Users</th><th>Any retrieval</th><th>Complaint rate</th><th>7-day return</th></tr></thead><tbody>${html}</tbody></table>`;
  }
  function render(){const list=chosenRows();renderKpis(list);renderSegments(rows);renderCase(list);renderQuality(list);renderReturn(list);renderOpportunities();}
  scenario.addEventListener('change',render);opportunity.addEventListener('change',render);$('#retention-window').addEventListener('change',renderRetentionCurve);
  $('#another-case').addEventListener('click',()=>{const el=$('#case-card');el.dataset.caseIndex=String(Number(el.dataset.caseIndex||0)+1);renderCase(chosenRows());});
  $('#reset').addEventListener('click',()=>{scenario.value='0';opportunity.value='all';render();window.scrollTo({top:0,behavior:'smooth'});});
  const links=[...document.querySelectorAll('.nav-link')];
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));}}},{rootMargin:'-20% 0px -70% 0px'});
  links.forEach(a=>{const target=$(a.getAttribute('href'));if(target)observer.observe(target);});
  render();
})();
