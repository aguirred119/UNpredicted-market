import {randomUUID} from 'node:crypto';
import {canonical,LAG,publicationEligibility,matchingProviderEvent} from './nba.js';
import {predict,simulate} from '../src/model.js';
import {validateLedger,appendEntry,gradeScore,digest} from './predictions.js';
const nbaPolicy={league:'NBA',canonical,LAG,publicationEligibility,matchingProviderEvent,prefix:'nba',scoreSource:'SportsDataverse / hoopR completed NBA score',dataSource:'SportsDataverse / hoopR NBA results; The Odds API event identity',rationale:'Home-team win probability from trailing regular-season form. Experimental logistic model; excludes injuries and lineups. This is a probability estimate, not an editorial recommendation.'};
// Source-derived games only. Test fixtures never run through the production CLI.
export function dailyBatch({entries,games,report,feed,now=Date.now(),policy=nbaPolicy}){
 const {league,canonical,LAG,publicationEligibility,matchingProviderEvent}=policy;
 validateLedger(entries);const additions=[],stamp=new Date(now).toISOString(),skipped=[];
 const add=payload=>additions.push(appendEntry([...entries,...additions],{entryId:randomUUID(),...payload},stamp));
 // Grade independently of schedule availability. Ambiguous/corrected events stay pending for review.
 for(const p of entries.filter(e=>e.type==='forecast').map(e=>e.forecast).filter(p=>p.kind==='model'&&p.league===league&&p.sourceGameId&&!entries.some(e=>e.type==='resolution'&&e.predictionId===p.id))){
 const g=games.find(g=>g.complete&&now-Date.parse(g.date)>=LAG&&g.id===p.sourceGameId&&canonical(p.home)===g.home&&canonical(p.away)===g.away&&p.eventStart===g.date);if(!g)continue;
 const outcome=gradeScore(p,{id:p.eventId,home_team:p.home,away_team:p.away,completed:true,scores:[{name:p.home,score:String(g.homeScore)},{name:p.away,score:String(g.awayScore)}]});if(!outcome)continue;
 add({type:'resolution',predictionId:p.id,result:outcome,source:policy.scoreSource,reason:'Exact source ID, teams and start time; final score including overtime. Conservative 48-hour result lag.',resolvedAt:stamp,correctsEntryId:null});
 }
 const scheduleReady=feed?.enabled===true&&feed.league===league&&Array.isArray(feed.games)&&Number.isFinite(Date.parse(feed.fetchedAt))&&Date.parse(feed.fetchedAt)<=now&&now-Date.parse(feed.fetchedAt)<=2*3600000;
 for(const game of games.filter(g=>!g.complete&&Date.parse(g.date)>now&&Date.parse(g.date)<=now+72*3600000)){
 const gate=publicationEligibility(report,game,games,now),event=scheduleReady?matchingProviderEvent(game,feed.games):null;
 const reasons=[...gate.reasons];if(!scheduleReady)reasons.push('Current schedule unavailable or older than two hours');else if(!event)reasons.push('Provider teams/start time do not match');
 if(Date.parse(game.date)-now<30*60000)reasons.push('Less than 30 minutes before start');
 if(reasons.length){skipped.push({event:`${game.away} at ${game.home}`,eventStart:game.date,reasons});continue;}
 const id=`${policy.prefix}-${game.id}-form-v1`;
 if([...entries,...additions].some(e=>e.type==='forecast'&&(e.forecast.id===id||(e.forecast.kind==='model'&&e.forecast.eventId===event.id))))continue;
 const probability=predict(report.model,gate.features.x);
 const forecast={id,kind:'model',league,eventId:event.id,sourceGameId:game.id,event:`${event.away} at ${event.home}`,home:event.home,away:event.away,selection:event.home,eventStart:game.date,publishedAt:stamp,inputAsOf:gate.features.inputAsOf,settlementRule:'match-winner-including-overtime',rationale:policy.rationale,dataSource:policy.dataSource,dataPermissionReference:report.source.licenseUrl,synthetic:false,datasetHash:digest(report.source.sources),features:gate.features.x,featureDefinitions:report.featureDefinitions,model:report.model,probability,simulation:simulate(probability,10000,12345)};
 add({type:'forecast',forecast});
 }
 return{additions,skipped,scheduleReady,published:additions.filter(e=>e.type==='forecast').length,graded:additions.filter(e=>e.type==='resolution').length};
}
