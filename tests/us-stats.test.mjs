import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {leagueFormSnapshot} from '../lib/matchup-form.js';import {usStatsReport,statsSeason} from '../src/us-stats.js';import {formCard} from '../src/team-form.js';
const now=Date.parse('2026-10-05T06:00:00Z'),teams=['Kansas City Chiefs','Las Vegas Raiders'];
const game=(id,date,season,homeScore,awayScore)=>({id,date,season,home:teams[0],away:teams[1],homeScore,awayScore,complete:true});
test('League browsing excludes prior seasons, unfinished games and results inside the availability lag',()=>{
 const games=[game('prior','2025-10-01T20:00:00Z',2025,99,0),game('valid','2026-09-27T20:00:00Z',2026,30,27),game('recent','2026-10-04T20:25:00Z',2026,30,27),{...game('future','2026-10-06T20:00:00Z',2026,0,0),complete:false}];
 const s=leagueFormSnapshot(games,{season:2026,teams,window:8,now});assert.equal(s.completedGames,1);assert.equal(s.dataThrough,games[1].date);assert.equal(s.teams[0].count,1);assert.equal(s.teams[0].averageScored,30);assert.equal(s.teams[0].averageAllowed,27);assert.equal(s.teams[0].averageMargin,3);
 const empty=leagueFormSnapshot(games,{season:2027,teams,window:20,now});assert.equal(empty.completedGames,0);assert.equal(empty.dataThrough,null);assert.equal(empty.teams[0].averageScored,null);assert.deepEqual(empty.teams[0].recent,[]);
});
test('League snapshot rejects ambiguous source IDs and team identities',()=>{const g=game('one','2026-09-27T20:00:00Z',2026,30,27);assert.throws(()=>leagueFormSnapshot([g,g],{season:2026,teams,window:8,now}),/Ambiguous/);assert.throws(()=>leagueFormSnapshot([g],{season:2026,teams:[teams[0],teams[0]],window:8,now}),/identity/);});
test('Browser labels dated NFL snapshots and fails closed on incomplete or inconsistent statistics',async()=>{
 const source=JSON.parse(await readFile(new URL('../data/nfl-research.json',import.meta.url),'utf8'));
 // A bounded fixture avoids coupling tests to when the daily source refreshed.
 const stamp='2026-10-05T06:00:00.000Z',list=Array.from({length:32},(_,i)=>'Team '+i),stats=leagueFormSnapshot([],{season:2026,teams:list,window:8,now});
 const report={...source,generatedAt:stamp,teamStatistics:stats};assert.equal(usStatsReport(report,'NFL',now).teams.length,32);assert.equal(usStatsReport(report,'NFL',now+37*3600000).snapshotOverdue,true);
 for(const change of [{...stats,teams:stats.teams.slice(1)},{...stats,cutoff:stamp},{...stats,season:2025},{...stats,teams:stats.teams.map((t,i)=>i? t:{...t,averageMargin:1})},{...stats,dataThrough:stamp,completedGames:1}])assert.throws(()=>usStatsReport({...report,teamStatistics:change},'NFL',now));
 assert.throws(()=>usStatsReport({...report,generatedAt:new Date(now+3600000).toISOString()},'NFL',now));
});
test('Season selection handles NFL January and the NBA ending-year convention',()=>{assert.equal(statsSeason('NFL',Date.parse('2027-01-05T12:00:00Z')),2026);assert.equal(statsSeason('NFL',now),2026);assert.equal(statsSeason('NBA',now),2027);assert.equal(statsSeason('NBA',Date.parse('2027-04-05T12:00:00Z')),2027);});
test('US form displays scoring units and never turns an empty season into zero-valued performance',()=>{const s=leagueFormSnapshot([game('valid','2026-09-27T20:00:00Z',2026,30,27)],{season:2026,teams,window:8,now});assert.match(formCard(s.teams[0],'NFL'),/POINTS SCORED \/ GAME/);assert.doesNotMatch(formCard(s.teams[0],'NFL'),/GOALS/);const empty=leagueFormSnapshot([],{season:2026,teams,window:8,now});assert.match(formCard(empty.teams[0],'NFL'),/No completed current-season/);assert.doesNotMatch(formCard(empty.teams[0],'NFL'),/0\.00/);});
