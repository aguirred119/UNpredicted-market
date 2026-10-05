import {readFile,appendFile,writeFile} from 'node:fs/promises';import {refreshResearch} from './nhl-research.mjs';import {dailyBatch} from '../lib/nba-publication.js';import {policy} from '../lib/nhl.js';import {parseLedger} from '../lib/predictions.js';
const status={schemaVersion:2,league:'NHL',checks:[],mode:'experimental',lastAttemptAt:new Date().toISOString(),state:'checking',publishedThisRun:0,gradedThisRun:0,skipped:[],cadence:'Daily around 13:57 UTC. Scheduled jobs can be delayed.',grading:'Official final game result including overtime and shootouts from the dated community source, at least 48 hours after scheduled start. Ambiguous or changed identities remain pending.'};
try{
 const {report,games}=await refreshResearch();status.sourceThrough=report.dataThrough;
 let feed=null;try{const r=await fetch('https://unpredicted-market.vercel.app/api/games?league=NHL',{signal:AbortSignal.timeout(10000)});if(r.ok)feed=await r.json();}catch{}
 const entries=parseLedger(await readFile('data/ledger.jsonl','utf8')),batch=dailyBatch({entries,games,report,feed,policy});
 if(batch.additions.length)await appendFile('data/ledger.jsonl',batch.additions.map(e=>JSON.stringify(e)).join('\n')+'\n');
 Object.assign(status,{state:!batch.scheduleReady?'schedule-unavailable':batch.published?'published':'waiting-for-eligible-games',publishedThisRun:batch.published,gradedThisRun:batch.graded,skipped:batch.skipped,checks:batch.checks,scheduleAsOf:batch.scheduleReady?feed.fetchedAt:null});
 console.log(`Daily NHL: ${batch.published} forecasts, ${batch.graded} results.`);
}catch(error){status.state='source-or-validation-error';status.message='NHL source retrieval or validation failed. Previous research and published records remain available with their original dates.';console.error(error.message);}
status.completedAt=new Date().toISOString();await writeFile('data/nhl-feed.json',JSON.stringify(status,null,2)+'\n');
