import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {SOCCER_LEAGUES} from '../src/soccer-data.js';import {cleanSoccer} from '../lib/soccer.js';import {soccerRows,fitSoccer,evaluateSoccer} from '../lib/soccer-model.js';
const seasons=['2023-24','2024-25'],reports={};
const local=process.argv.indexOf('--source-dir');
for(const [league,config] of Object.entries(SOCCER_LEAGUES)){
 const datasets=[],sources=[];
 for(const season of seasons){
  const url=`https://raw.githubusercontent.com/openfootball/football.json/master/${season}/${config.code}.json`;
  let raw;if(local>=0)raw=await readFile(`${process.argv[local+1]}/tonati-${season}-${config.code}.json`,'utf8');else{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`Source unavailable: ${league} ${season}`);raw=await r.text();}
  if(raw.length>1000000)throw Error('Oversized historical source');
  const cleaned=cleanSoccer(JSON.parse(raw),league,season),expected=config.expectedTeams*(config.expectedTeams-1);
  if(cleaned.excluded||cleaned.games.length!==expected||cleaned.games.filter(g=>g.complete).length<expected*.9)throw Error(`Incomplete historical season: ${league} ${season}`);
  datasets.push(soccerRows(cleaned.games));sources.push({season,url,sha256:createHash('sha256').update(raw).digest('hex'),fixtures:cleaned.games.length,completedGames:cleaned.games.filter(g=>g.complete).length,missingResults:cleaned.games.filter(g=>!g.complete).length,sourceTitle:JSON.parse(raw).name});
 }
 const model=fitSoccer(datasets[0].rows),evaluation=evaluateSoccer(model,datasets[1].rows);delete evaluation.forecasts;
 reports[league]={league,model,evaluation,excluded:{training:datasets[0].skipped.length,holdout:datasets[1].skipped.length,reason:'Fewer than five same-season prior results for either team at the conservative 48-hour cutoff'},sources};
 console.log(league,JSON.stringify({training:model.trainingCount,holdout:evaluation.metrics.count,brier:evaluation.metrics.brier,baselineBrier:evaluation.baseline.brier}));
}
const report={schemaVersion:1,status:'retrospective-research-only',generatedAt:new Date().toISOString(),processing:{trainingSeason:seasons[0],holdoutSeason:seasons[1],window:10,minimumGamesPerTeam:5,lagHours:48,historicalEventCutoff:'Start of the fixture calendar date minus two hours UTC, before subtracting the 48-hour lag',datePrecision:'day',features:['Home minus away recent average goal margin','Half the sum of both teams’ recent goals scored and allowed per game'],outcomes:['Home win','Draw','Away win'],scoreDefinition:'Multiclass Brier: mean sum of the three squared probability errors; range 0–2, lower is better.',limitations:'Retrospective revised community results, not archived point-in-time inputs. Date-only result availability uses end-of-day UTC; historical fixture cutoff uses the earliest possible European local day boundary (00:00 UTC minus two hours), then a 48-hour assumed availability lag. Domestic league full-time outcomes only. No odds, injuries, lineups, cups, xG or roster features. Coefficients and training scales are frozen during the later-season holdout; form updates only from earlier same-season results. Fixed hyperparameters were not tuned on this holdout. No prospective soccer predictions are published and no profitability is evaluated.'},source:{name:'OpenFootball community league results',license:'CC0 1.0 / public domain',licenseUrl:'https://github.com/openfootball/football.json/blob/master/LICENSE.md',attribution:'OpenFootball contributors. Normalized and modeled by TONATI LAB; no endorsement.'},leagues:reports};
await writeFile('data/soccer-research.json',JSON.stringify(report,null,2)+'\n');
