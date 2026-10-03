import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {csvRecords,cleanGames,research,publicationEligibility} from '../lib/nba.js';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export async function refreshResearch(){
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
const report={schemaVersion:1,status:'retrospective-research',generatedAt:new Date(now).toISOString(),dataThrough:cleaned.games.filter(g=>g.complete).at(-1)?.date,holdoutSeason:latest,source:{name:'SportsDataverse / hoopR NBA schedules (ESPN upstream)',license:'CC BY 4.0',licenseUrl:'https://github.com/sportsdataverse/hoopR-nba-data/blob/main/LICENSE.md',attribution:'© hoopR.nba authors. Normalized and filtered by TONATI LAB; no endorsement.',sources},processing:{excluded:cleaned.excluded,completedGames:cleaned.games.filter(g=>g.complete).length,lagHours:48,minimumGamesPerTeam:10,historyWindow:20,exclude:'All-Star, playoffs, preseason, neutral-site games, invalid or prematurely final results',limitations:'Latest revised historical files are used; this is not an archived point-in-time data feed. Start times are used with a conservative 48-hour lag because final-publication times are unavailable. No injuries, lineups, roster changes or odds features.'},...result,upcoming,publishing:'Experimental prospective publication is scheduled daily, subject to data, freshness and evaluation gates. Historical backtests are never inserted into the public prediction ledger.'};
await writeFile('data/nba-research.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({training:report.model.trainingCount,holdout:report.model.holdoutCount,metrics:report.model.metrics,upcoming:upcoming.length},null,2));

return {report,games:cleaned.games};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))await refreshResearch();
