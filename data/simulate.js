/* Fixed-seed synthetic event generator. This file makes no network requests. */
(function(){
  const SEED=20261026,N=5200;
  const segments=[
    {id:'working',name:'Working memory',color:'violet',short:'Active context',description:'The current workspace for this response. Long-term retrieval may add context here.'},
    {id:'episodic',name:'Episodic memory',color:'blue',short:'Past events',description:'Earlier conversations and experiences that may help continue a story.'},
    {id:'semantic',name:'Semantic memory',color:'green',short:'Facts & preferences',description:'Relatively stable information about the user, people, goals, or preferences.'},
    {id:'procedural',name:'Procedural memory',color:'amber',short:'Methods & skills',description:'Explicit reusable steps, routines, or methods for completing a task.'}
  ];
  const opportunities=[
    {id:'new_person',name:'New person or entity',example:'“I’m starting a new role. My manager is Priya.”',segments:['episodic','semantic'],write:['episodic','semantic']},
    {id:'journey',name:'Continuing a journey',example:'“Can we continue the plan we made for my job search?”',segments:['episodic','semantic'],write:['episodic']},
    {id:'correction',name:'Correction or update',example:'“That’s outdated—I moved to Bengaluru.”',segments:['semantic'],write:['semantic']},
    {id:'preference',name:'Recurring preference or goal',example:'“Remember that I prefer vegetarian options.”',segments:['semantic'],write:['semantic']},
    {id:'prior_context',name:'Explicit prior-context reference',example:'“What did I decide about the course last time?”',segments:['episodic','semantic'],write:['episodic']},
    {id:'repeat_method',name:'Reusable method or routine',example:'“Use my weekly review format: wins, blockers, next steps.”',segments:['procedural','semantic'],write:['procedural']}
  ];
  function hash(x){let h=(SEED^x)>>>0;h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);return(h^(h>>>16))>>>0;}
  function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
  const rows=[];
  for(let i=0;i<N;i++){
    const r=rng(hash(i+1));
    const x=r();const engagement=x<.43?'Low':x<.73?'Medium':'High';const e=engagement==='Low'?0:engagement==='Medium'?1:2;
    const priorSessions=e===0?Math.floor(r()*3):e===1?3+Math.floor(r()*7):10+Math.floor(r()*16);
    const tenureDays=1+Math.floor(r()*365);
    let pick=r(),opportunity=opportunities[0];const weights=[.18,.21,.14,.18,.14,.15];for(let j=0;j<opportunities.length;j++){pick-=weights[j];if(pick<=0){opportunity=opportunities[j];break;}}
    const complexity=r()<.22?'High':r()<.67?'Medium':'Low';
    const memoryEnabled=r()<.88;const telemetryKnown=r()>.035;
    const historySessionCount=Math.max(1,priorSessions+1+Math.floor(r()*8));
    const userPullPropensity=Math.min(.82,.06+.12*e+r()*.5);
    let shortTermSessions=0,longTermSessions=0,combinedSessions=0;
    for(let session=0;session<historySessionCount;session++){
      const longTermPull=memoryEnabled&&r()<userPullPropensity;
      const shortTermUse=r()<Math.min(.92,.12+.13*e+(longTermPull ? .48 : 0));
      if(longTermPull)longTermSessions++;
      if(shortTermUse)shortTermSessions++;
      if(longTermPull||shortTermUse)combinedSessions++;
    }
    const shortTermSessionShare=shortTermSessions/historySessionCount;
    const longTermSessionShare=longTermSessions/historySessionCount;
    const combinedSessionShare=combinedSessions/historySessionCount;
    const latentEvents=[];
    for(const segmentId of opportunity.segments){
      const segBias={episodic:.02,semantic:.01,procedural:-.03}[segmentId]||0;
      const pullP=memoryEnabled?Math.min(.78,.12+.15*e+segBias+(opportunity.id==='prior_context'?.08:0)):0;
      if(r()<pullP){
        const pullCount=1+(r()<.24?1:0)+(r()<.07?1:0);
        for(let pull=0;pull<pullCount;pull++){
          const empty=r()<.12;
          const qualityDraw=r();const itemQuality=empty?'empty':qualityDraw<.71?'relevant_correct':qualityDraw<.81?'relevant_stale':qualityDraw<.92?'irrelevant':'incorrect';
          const contextIncluded=!empty&&r()<.83;
          const appropriatelyUsed=contextIncluded&&itemQuality==='relevant_correct'&&r()<.86;
          latentEvents.push({segment:segmentId,result:empty?'empty':'nonempty',quality:itemQuality,contextIncluded,appropriatelyUsed,rank:1+Math.floor(r()*4),latencyMs:80+Math.floor(r()*520)});
        }
      }
    }
    const retrieved=latentEvents.length>0;
    const observedEvents=telemetryKnown?latentEvents:[];
    const contextUsed=latentEvents.some(ev=>ev.appropriatelyUsed);
    const responseGrounding=contextUsed?(r()<.91?'supported':'unsupported'):(r()<.83?'supported':'unsupported');
    const complaintP=latentEvents.length?latentEvents.some(ev=>['irrelevant','incorrect','relevant_stale'].includes(ev.quality))?.18:.07:.016;
    const complaint=r()<complaintP;
    const complaints=['incorrect memory','irrelevant memory','stale memory','missing memory','unwanted recall'];
    const complaintType=complaint?complaints[Math.floor(r()*complaints.length)]:null;
    const writeEvents=[];
    if(opportunity.write.length){for(const seg of opportunity.write){if(r()<(seg==='procedural'?.55:.67)){const success=r()<.87;writeEvents.push({segment:seg,status:success?'validated':'failed',laterRelevant:r()<.58,persisted:success&&r()<.79});}}}
    const base7=-2.18+.67*e+.001*Math.min(tenureDays,180)+({new_person:.02,journey:.10,correction:-.08,preference:.06,prior_context:.09,repeat_method:.04}[opportunity.id])+(complexity==='High'?.06:0);
    const followupDays=r()<.065?Math.floor(r()*7):r()<.11?7+Math.floor(r()*21):28+Math.floor(r()*32);
    rows.push({id:i+1,engagement,priorSessions,tenureDays,opportunity:opportunity.id,complexity,memoryEnabled,telemetryKnown,latentEvents,observedEvents,retrieved,contextUsed,responseGrounding,complaint,complaintType,writeEvents,base7,u28:r(),u30:r(),u7:r(),u1:r(),historySessionCount,shortTermSessionShare,longTermSessionShare,combinedSessionShare,followupDays});
  }
  window.MemoryPathways={seed:SEED,rows,segments,opportunities};
})();
