import {readFile,appendFile,writeFile} from 'node:fs/promises';
import {refreshResearch} from './nba-research.mjs';
import {dailyBatch} from '../lib/nba-publication.js';
import {parseLedger} from '../lib/predictions.js';
const status={schemaVersion:2,league:'NBA',checks:[],mode:'experimental',lastAttemptAt:new Date().toISOString(),state:'checking',publishedThisRun:0,gradedThisRun:0,skipped:[],cadence:'Daily, approximately 05:17 Pacific daylight time / 04:17 Pacific standard time. Scheduled jobs can be delayed.',grading:'Completed results from the licensed historical source, at least 48 hours after scheduled start. Postponed, changed or ambiguous events remain pending for review.'};
try{
 const {report,games}=await refreshResearch();status.sourceThrough=report.dataThrough;
 let feed=null;try{const res=await fetch('https://unpredicted-market.vercel.app/api/games?league=NBA',{signal:AbortSignal.timeout(10000)});if(res.ok)feed=await res.json();}catch{}
 const raw=await readFile('data/ledger.jsonl','utf8'),batch=dailyBatch({entries:parseLedger(raw),games,report,feed});
 if(batch.additions.length)await appendFile('data/ledger.jsonl',batch.additions.map(e=>JSON.stringify(e)).join('\n')+'\n');
 Object.assign(status,{state:!batch.scheduleReady?'schedule-unavailable':batch.published?'published':'waiting-for-eligible-games',publishedThisRun:batch.published,gradedThisRun:batch.graded,skipped:batch.skipped,checks:batch.checks,scheduleAsOf:batch.scheduleReady?feed.fetchedAt:null});
 console.log(`Daily NBA run: ${batch.published} forecasts, ${batch.graded} results.`);
}catch(error){
 // Source/provider outages must be visible; do not claim fresh analysis or fabricate replacements.
 status.state='source-or-validation-error';status.message='NBA source retrieval or validation failed. Previous research and published records remain available, visibly dated.';
 console.error(status.message);
}
status.completedAt=new Date().toISOString();await writeFile('data/daily-feed.json',JSON.stringify(status,null,2)+'\n');
