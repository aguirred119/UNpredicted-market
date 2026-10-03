import {matchupForm} from '../lib/matchup-form.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';import {resolve} from 'node:path';
import {cleanGames,research,publicationEligibility} from '../lib/nfl.js';
export async function refreshResearch(){
 const now=Date.now(),url='https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv';
 let raw;if(process.env.NFL_LOCAL_SOURCE_FILE)raw=await readFile(process.env.NFL_LOCAL_SOURCE_FILE,'utf8');else{const res=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!res.ok)throw Error('NFL source unavailable');raw=await res.text();}
 const cleaned=cleanGames(raw,now);
 for(const season of [2018,2019,2020,2021,2022,2023,2024,2025])if(cleaned.games.filter(g=>g.complete&&g.season===season).length<200)throw Error('Incomplete NFL source season');
 const result=research(cleaned.games);
 const upcoming=cleaned.games.filter(g=>!g.complete&&Date.parse(g.date)>now&&Date.parse(g.date)<=now+72*3600000).map(g=>({sourceEventId:g.id,home:g.home,away:g.away,event:`${g.away} at ${g.home}`,eventStart:g.date,form:matchupForm(g,cleaned.games,{window:8}),...publicationEligibility(result,g,cleaned.games,now)}));
 const report={schemaVersion:1,status:'retrospective-research',generatedAt:new Date(now).toISOString(),dataThrough:cleaned.games.filter(g=>g.complete).at(-1)?.date,holdoutSeasons:[2024,2025],source:{name:'nflverse game schedules and results',license:'CC BY 4.0',licenseUrl:'https://github.com/nflverse/nflverse-data/blob/main/LICENSE.md',attribution:'NFL schedule data maintained by Lee Sharpe and nflverse contributors. Normalized and transformed by TONATI LAB; no endorsement.',sources:[{url,sha256:createHash('sha256').update(raw).digest('hex')}]},processing:{excluded:cleaned.excluded,completedGames:cleaned.games.filter(g=>g.complete).length,lagHours:48,minimumGamesPerTeam:4,historyWindow:8,exclude:'Playoffs, preseason, neutral-site games, invalid times, incomplete scores and prematurely final results',limitations:'Revised historical files, not archived point-in-time snapshots. Scheduled kickoff timestamps use Eastern time with daylight-saving conversion. A 48-hour lag approximates final availability; ties count as non-wins. No injuries, quarterback, roster, weather or odds features.'},...result,upcoming,publishing:'Experimental forecasts run daily only when evaluation, history, freshness and exact event identity checks pass. No historical backfill into the live record.'};
 await writeFile('data/nfl-research.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({training:report.model.trainingCount,holdout:report.model.holdoutCount,metrics:report.model.metrics,upcoming:upcoming.length,eligible:upcoming.filter(g=>g.eligible).length},null,2));return{report,games:cleaned.games};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))await refreshResearch();
