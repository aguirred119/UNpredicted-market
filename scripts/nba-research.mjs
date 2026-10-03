import {readFile,writeFile,appendFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {csvRecords,cleanGames,research,publicationEligibility,matchingProviderEvent} from '../lib/nba.js';
import {predict,simulate} from '../src/model.js';
import {parseLedger,validateLedger,appendEntry,gradeScore,digest} from '../lib/predictions.js';
const now=Date.now(),year=new Date(now).getUTCFullYear(),latest=new Date(now).getUTCMonth()>=6?year:year-1;
const sources=[],all=[];
for(const season of [latest-3,latest-2,latest-1,latest,latest+1]){
 const url=`https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_schedules/nba_schedule_${season}.csv`;
 let raw;if(process.env.NBA_LOCAL_SOURCE_DIR){raw=await readFile(`${process.env.NBA_LOCAL_SOURCE_DIR}/${season}.csv`,'utf8');}else{
 const res=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!res.ok)throw Error(`Historical NBA source unavailable (${season}); existing report unchanged`);raw=await res.text();}
 sources.push({season,url,sha256:createHash('sha256').update(raw).digest('hex')});all.push(...csvRecords(raw));
}
const cleaned=cleanGames(all,now);
if(cleaned.games.filter(g=>g.complete&&g.season===latest).length<1100)throw Error('Latest completed season is incomplete; previous report unchanged');
const result=research(cleaned.games.filter(g=>g.season<=latest),latest);
const upcoming=cleaned.games.filter(g=>!g.complete&&Date.parse(g.date)>now&&Date.parse(g.date)<=now+72*3600000).map(g=>({event:`${g.away} at ${g.home}`,eventStart:g.date,...publicationEligibility(result,g,cleaned.games,now)}));
const report={schemaVersion:1,status:'retrospective-research',generatedAt:new Date(now).toISOString(),dataThrough:cleaned.games.filter(g=>g.complete).at(-1)?.date,holdoutSeason:latest,source:{name:'SportsDataverse / hoopR NBA schedules (ESPN upstream)',license:'CC BY 4.0',licenseUrl:'https://github.com/sportsdataverse/hoopR-nba-data/blob/main/LICENSE.md',attribution:'© hoopR.nba authors. Normalized and filtered by TONATI LAB; no endorsement.',sources},processing:{excluded:cleaned.excluded,completedGames:cleaned.games.filter(g=>g.complete).length,lagHours:48,minimumGamesPerTeam:10,historyWindow:20,exclude:'All-Star, playoffs, preseason, neutral-site games, invalid or prematurely final results',limitations:'Latest revised historical files are used; this is not an archived point-in-time data feed. Start times are used with a conservative 48-hour lag because final-publication times are unavailable. No injuries, lineups, roster changes or odds features.'},...result,upcoming,publishing:'Research only. Automatic public forecasts remain disabled until the prospective feed has been reviewed. Historical backtests are never inserted into the public prediction ledger.'};
await writeFile('data/nba-research.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({training:report.model.trainingCount,holdout:report.model.holdoutCount,metrics:report.model.metrics,upcoming:upcoming.length},null,2));

// Opt-in prospective publication. Never backfill historical forecasts.
if(process.argv.includes('--publish')){
 const res=await fetch('https://unpredicted-market.vercel.app/api/games?league=NBA',{signal:AbortSignal.timeout(10000)});
 if(!res.ok)throw Error('Schedule unavailable; public ledger unchanged');
 const feed=await res.json();if(feed.enabled!==true||!Array.isArray(feed.games))throw Error('Schedule inactive; public ledger unchanged');
 const entries=validateLedger(parseLedger(await readFile('data/ledger.jsonl','utf8'))),additions=[];
 for(const game of cleaned.games.filter(g=>!g.complete)){
 const gate=publicationEligibility(result,game,cleaned.games,now),event=matchingProviderEvent(game,feed.games);
 if(!gate.eligible||!event||entries.some(e=>e.type==='forecast'&&e.forecast.kind==='model'&&e.forecast.eventId===event.id))continue;
 const publishedAt=new Date().toISOString();if(Date.parse(publishedAt)>=Date.parse(game.date))continue;
 const probability=predict(result.model,gate.features.x);
 const forecast={id:`nba-${game.id}-form-v1`,kind:'model',league:'NBA',eventId:event.id,sourceGameId:game.id,event:`${event.away} at ${event.home}`,home:event.home,away:event.away,selection:event.home,eventStart:game.date,publishedAt,inputAsOf:gate.features.inputAsOf,settlementRule:'match-winner-including-overtime',rationale:'Home-team win probability from trailing regular-season form. Experimental logistic model; excludes injuries and lineups. This is an estimate, not an editorial recommendation.',dataSource:'SportsDataverse / hoopR NBA results; The Odds API event identity',dataPermissionReference:report.source.licenseUrl,synthetic:false,datasetHash:digest(sources),features:gate.features.x,featureDefinitions:result.featureDefinitions,model:result.model,probability,simulation:simulate(probability,10000,12345)};
 additions.push(appendEntry([...entries,...additions],{entryId:randomUUID(),type:'forecast',forecast},publishedAt));
 }
 // Exact source identity, teams and start time; only verified finals are settled.
 for(const p of entries.filter(e=>e.type==='forecast').map(e=>e.forecast).filter(p=>p.kind==='model'&&p.league==='NBA'&&p.sourceGameId&&!entries.some(e=>e.type==='resolution'&&e.predictionId===p.id))){
 const g=cleaned.games.find(g=>g.complete&&g.id===p.sourceGameId&&canonical(p.home)===g.home&&canonical(p.away)===g.away&&p.eventStart===g.date);if(!g)continue;
 const outcome=gradeScore(p,{id:p.eventId,home_team:p.home,away_team:p.away,completed:true,scores:[{name:p.home,score:String(g.homeScore)},{name:p.away,score:String(g.awayScore)}]});if(!outcome)continue;
 const stamp=new Date().toISOString();additions.push(appendEntry([...entries,...additions],{entryId:randomUUID(),type:'resolution',predictionId:p.id,result:outcome,source:'SportsDataverse / hoopR completed NBA score',reason:'Exact source ID, teams and start time; final score including overtime. Conservative 48-hour result lag.',resolvedAt:stamp,correctsEntryId:null},stamp));
 }
 if(additions.length)await appendFile('data/ledger.jsonl',additions.map(e=>JSON.stringify(e)).join('\n')+'\n');
 console.log(`Appended ${additions.length} prospective NBA forecasts/results. Existing records preserved.`);
}
