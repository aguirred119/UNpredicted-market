import {writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cleanNhl,cleanRetrosheet,NHL_TEAMS,MLB_TEAMS} from '../lib/baseball-hockey.js';
import {leagueFormSnapshot} from '../lib/matchup-form.js';
import {statsSeason} from '../src/us-stats.js';
const now=Date.now(),generatedAt=new Date(now).toISOString();
async function nhl(){
 const current=statsSeason('NHL',now),sources=[],snapshots=[];
 for(const season of [current,current-1]){
  const url=`https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_schedules/nhl_schedule_${season}.csv`;
  const response=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error('NHL source unavailable');const raw=await response.text();
  const clean=cleanNhl(raw,season,now);if(clean.sourceRows<1000)throw Error('Incomplete NHL schedule');
  sources.push({season,url,sha256:createHash('sha256').update(raw).digest('hex')});
  snapshots.push(leagueFormSnapshot(clean.games,{season,teams:Object.values(NHL_TEAMS),window:10,now}));
 }
 return{schemaVersion:1,status:'descriptive-statistics',league:'NHL',generatedAt,teamStatistics:snapshots[0],historicalStatistics:snapshots[1],source:{name:'SportsDataverse / fastRhockey NHL schedules (NHL upstream)',license:'CC BY 4.0 (published datasets)',licenseUrl:'https://github.com/sportsdataverse/sportsdataverse-data#readme',attribution:'SportsDataverse / fastRhockey authors; source-derived statistics normalized by TONATI LAB. No league or provider endorsement.',sources},processing:{limitations:'Regular-season final scores only, including overtime and the official shootout deciding goal. Wins and losses here are game outcomes, not NHL standings points; overtime losses are not separated. Preseason and playoffs are excluded. The community dataset can lag or revise results. No lineups, goalie availability, injuries, expected goals or model probability is supplied.'}};
}
async function mlb(){
 const source=JSON.parse(execFileSync('python3',['scripts/retrosheet-source.py'],{encoding:'utf8',maxBuffer:12_000_000,timeout:60000}));
 const clean=cleanRetrosheet(source.text,2025);if(clean.games.length<2300)throw Error('Incomplete 2025 MLB archive');
 const stats=leagueFormSnapshot(clean.games,{season:2025,teams:Object.values(MLB_TEAMS),window:20,now});stats.teams=stats.teams.map(t=>({...t,datePrecision:'day'}));
 return{schemaVersion:1,status:'descriptive-statistics',league:'MLB',generatedAt,teamStatistics:null,currentSeasonStatus:'source-not-connected',historicalStatistics:stats,source:{name:'Retrosheet 2025 regular-season game logs',license:'Retrosheet reuse permission with attribution',licenseUrl:'https://www.retrosheet.org/gamelogs/index.html',attribution:'The information used here was obtained free of charge from and is copyrighted by Retrosheet. Interested parties may contact Retrosheet at "www.retrosheet.org".',sources:[{season:2025,url:source.url,sha256:source.sha256}]},processing:{excluded:clean.excluded,limitations:'Historical 2025 research only. Current-season MLB results are not connected. Up to the last 20 regular-season games per team; no postseason, pitching, lineup, injury or park-adjusted inputs. Suspended, forfeited and protested games are excluded. Match dates have day precision; the end-of-day UTC timestamp is a conservative processing cutoff, not the game start time. This archive must not be used as current form or a published forecast.'}};
}
// Each league can fail independently without replacing a good snapshot.
let failed=false;
for(const [league,refresh] of [['NHL',nhl],['MLB',mlb]]){
 try{const report=await refresh();await writeFile(`data/${league.toLowerCase()}-stats.json`,JSON.stringify(report,null,2)+'\n');console.log(`${league}: snapshot saved`);}
 catch(error){failed=true;console.error(`${league}: ${error.message}; previous dated snapshot retained`);}
}
if(failed)process.exitCode=1;
