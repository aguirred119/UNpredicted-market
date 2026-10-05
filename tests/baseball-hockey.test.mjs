import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {cleanNhl,cleanRetrosheet} from '../lib/baseball-hockey.js';
import {usStatsReport,statsSeason} from '../src/us-stats.js';import {formCard} from '../src/team-form.js';
const now=Date.parse('2026-10-05T18:00:00Z');
const nhlHeader='game_id,season_full,game_type,game_time,home_team_abbr,away_team_abbr,home_score,away_score,game_state';
const nhlRow='2026020001,20262027,R,2026-09-29T21:00:00Z,CAR,FLA,0,1,OFF';
test('NHL includes verified final zero scores, excludes preseason, playoffs, unfinished and recent results',()=>{
 const raw=[nhlHeader,nhlRow,nhlRow.replace('2026020001','2026010001').replace(',R,',',P,'),nhlRow.replace('2026020001','2026030001').replace(',R,',',PO,'),nhlRow.replace('2026020001','2026020002').replace(',OFF',',FUT'),nhlRow.replace('2026020001','2026020003').replace('2026-09-29T21:00:00Z','2026-10-04T21:00:00Z')].join('\n');
 const c=cleanNhl(raw,2027,now);assert.equal(c.games.length,1);assert.equal(c.games[0].homeScore,0);assert.equal(c.games[0].away,'Florida Panthers');assert.equal(c.excluded,4);
});
test('NHL rejects duplicate games, ambiguous teams, impossible final scores and incorrect seasons',()=>{
 for(const row of [nhlRow.replace(',FLA,',',XXX,'),nhlRow.replace(',0,1,',',0,0,'),nhlRow.replace('20262027','20252026'),nhlRow.replace(',0,1,',',,1,')])assert.throws(()=>cleanNhl(nhlHeader+'\n'+row,2027,now));
 assert.throws(()=>cleanNhl(nhlHeader+'\n'+nhlRow+'\n'+nhlRow,2027,now),/Duplicate/);
});
function retro(changes={}){const r=Array(161).fill('');Object.assign(r,{0:'20250928',1:'0',3:'LAN',6:'SEA',9:'5',10:'0'},changes);return r.map(v=>JSON.stringify(v)).join(',');}
test('Retrosheet retains distinct doubleheaders, day precision and zero-run games without inventing kickoff times',()=>{
 const c=cleanRetrosheet(retro({1:'1'})+'\n'+retro({1:'2'}),2025);assert.equal(c.games.length,2);assert.notEqual(c.games[0].id,c.games[1].id);assert.equal(c.games[0].homeScore,0);assert.equal(c.games[0].date,'2025-09-28T23:59:59.999Z');
 assert.equal(cleanRetrosheet(retro({13:'20250929,SEA01,2,0,27'})+'\n'+retro({14:'V'}),2025).games.length,0);
 for(const change of [{0:'20260201'},{0:'20250230'},{3:'UNK'},{9:'-1'}])assert.throws(()=>cleanRetrosheet(retro(change),2025));
 assert.throws(()=>cleanRetrosheet(retro()+'\n'+retro(),2025),/Duplicate/);
});
test('Historical MLB cannot validate as current statistics, and historical NHL cannot silently replace the current season',async()=>{
 const mlb=JSON.parse(await readFile(new URL('../data/mlb-stats.json',import.meta.url),'utf8')),nhl=JSON.parse(await readFile(new URL('../data/nhl-stats.json',import.meta.url),'utf8'));
 assert.throws(()=>usStatsReport(mlb,'MLB',Date.parse(mlb.generatedAt)));
 const a=usStatsReport(mlb,'MLB',Date.parse(mlb.generatedAt),'historical');assert.equal(a.season,2025);assert.equal(a.seasonCurrent,false);assert.equal(a.teams.length,30);
 const n=usStatsReport(nhl,'NHL',Date.parse(nhl.generatedAt));assert.equal(n.season,statsSeason('NHL',Date.parse(nhl.generatedAt)));assert.equal(n.teams.length,32);
 assert.throws(()=>usStatsReport({...nhl,teamStatistics:nhl.historicalStatistics},'NHL',Date.parse(nhl.generatedAt)));
 assert.equal(usStatsReport(nhl,'NHL',Date.parse(nhl.generatedAt),'historical').season,n.season-1);
});
test('Scoring units are runs for baseball, goals for hockey and points for football',()=>{
 const f={team:'Los Angeles Dodgers',count:1,wins:1,losses:0,ties:0,averageMargin:5,averageScored:5,averageAllowed:0,inputAsOf:'2025-09-28T23:59:59.999Z',datePrecision:'day',recent:[{date:'2025-09-28T23:59:59.999Z',opponent:'Seattle Mariners',venue:'away',scored:5,allowed:0,result:'W'}]};
 assert.match(formCard(f,'MLB'),/RUNS SCORED/);assert.doesNotMatch(formCard(f,'MLB'),/GOALS|Wins–draws|11:59/);
 assert.match(formCard({...f,datePrecision:undefined,team:'Los Angeles Kings'},'NHL'),/GOALS SCORED/);
 assert.match(formCard({...f,datePrecision:undefined},'NFL'),/POINTS SCORED/);
});
