// An exact, dated pipeline check; never a probability or a replacement forecast.
export function analysisStatus(game,feed,now=Date.now()){
 if(!['NBA','NFL'].includes(game?.league))return{label:'Daily model not connected',reasons:['This league does not yet have a daily publication pipeline.'],checkedAt:null};
 const completed=Date.parse(feed?.completedAt),started=Date.parse(feed?.lastAttemptAt);
 if(!feed||feed.schemaVersion!==2||feed.league!==game.league||!Number.isFinite(completed)||!Number.isFinite(started)||started>completed||completed>now||now-completed>36*3600000)return{label:'Current check unavailable',reasons:['No recent verified pipeline check is available for this event.'],checkedAt:null};
 if(['source-or-validation-error','schedule-unavailable'].includes(feed.state))return{label:'Daily check interrupted',reasons:[feed.state==='schedule-unavailable'?'The schedule could not be verified in the last run.':'The source or validation step failed in the last run.'],checkedAt:feed.completedAt};
 const matches=(Array.isArray(feed.checks)?feed.checks:[]).filter(c=>c.league===game.league&&c.eventId===game.id&&c.home===game.home&&c.away===game.away&&Date.parse(c.eventStart)===Date.parse(game.eventStart));
 if(matches.length!==1)return{label:'Event not assessed',reasons:['No exact event check in the latest run. Only upcoming games within 72 hours are assessed.'],checkedAt:feed.completedAt};
 const check=matches[0],at=Date.parse(check.checkedAt);
 if(!Number.isFinite(at)||at<started||at>completed||!['blocked','published','already-published'].includes(check.status)||!Array.isArray(check.reasons)||check.reasons.some(r=>typeof r!=='string')||(check.status==='blocked'&&!check.reasons.length))return{label:'Current check unavailable',reasons:['The saved event check could not be verified.'],checkedAt:null};
 return{label:check.status==='blocked'?'Publication withheld':'Publication recorded',reasons:check.reasons,checkedAt:check.checkedAt};
}
export function analysisStatusHtml(game,feed,esc,time,now=Date.now()){
 const s=analysisStatus(game,feed,now);
 return`<details class="analysis-check"><summary>${esc(s.label)}</summary>${s.checkedAt?`<p class="small">Pipeline checked ${time(s.checkedAt)}. This dated check does not confirm current game status.</p>`:''}${s.reasons.length?'<ul class="small">'+s.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul>':'<p class="small">Inspect the public archive for the forecast, frozen inputs and publication time.</p>'}<p class="small">No estimate is substituted when a check fails. Published forecasts remain in the archive.</p></details>`;
}
