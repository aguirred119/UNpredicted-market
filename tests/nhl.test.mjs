import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {featuresFor,publicationEligibility,matchingProviderEvent,validateHistoricalScores,policy} from '../lib/nhl.js';
import {cleanNhl} from '../lib/baseball-hockey.js';import {dailyBatch} from '../lib/nba-publication.js';import {publicArchive,preservePrefix} from '../lib/predictions.js';import {analysisStatus} from '../src/analysis-status.js';
const report=JSON.parse(await readFile(new URL('../data/nhl-research.json',import.meta.url),'utf8'));
const now=Date.parse('2026-11-18T12:00:00Z'),start='2026-11-19T20:00:00.000Z';
const history=Array.from({length:10},(_,i)=>({id:'history-'+i,date:new Date(now-(22-i*2)*86400000).toISOString(),season:2027,home:'Los Angeles Kings',away:'Boston Bruins',complete:true,homeScore:i%2?3:2,awayScore:i%2?2:3}));
const game={id:'2026020200',date:start,season:2027,home:'Los Angeles Kings',away:'Boston Bruins',complete:false};
const feed={enabled:true,league:'NHL',fetchedAt:new Date(now).toISOString(),games:[{id:'nhl-fixture-provider',league:'NHL',home:game.home,away:game.away,eventStart:start}]};
// A qualified *test-only* report exercises downstream mechanics. It is never saved to public data.
const qualified={...report,generatedAt:new Date(now).toISOString(),model:{...report.model,metrics:{...report.model.metrics,baselineBrier:report.model.metrics.brier+.01}}};
const run=(entries=[],games=[...history,game],provider=feed,clock=now,r=qualified)=>dailyBatch({entries,games,report:r,feed:provider,now:clock,policy});
test('NHL placeholder season scores are rejected before model fitting; the quarantined season is disclosed',()=>{
 const valid=Array.from({length:1312},(_,i)=>({complete:true,homeScore:i%2?1+i%7:0,awayScore:i%2?0:1+i%7}));assert.doesNotThrow(()=>validateHistoricalScores(valid));
 assert.throws(()=>validateHistoricalScores(valid.map(g=>({...g,homeScore:2,awayScore:3}))),/source validation/);
 assert.throws(()=>validateHistoricalScores(valid.slice(0,300)),/source validation/);
 assert.equal(report.revision.excludedSource.season,2023);assert.ok(!report.source.sources.some(s=>s.season===2023));
});
test('NHL published research retains fixed split and honestly fails the quality gate',()=>{
 assert.deepEqual(report.processing.trainingSeasons,[2024,2025]);assert.deepEqual(report.processing.holdoutSeasons,[2026]);assert.ok(report.model.trainingCount>=2000);assert.ok(report.model.holdoutCount>=900);
 assert.ok(Date.parse(report.model.trainThrough)<Date.parse(report.holdoutFrom));
 const failed={...qualified,model:{...qualified.model,metrics:{...qualified.model.metrics,baselineBrier:qualified.model.metrics.brier+.004}}};
 assert.equal(run([],undefined,undefined,now,failed).published,0);
 assert.ok(publicationEligibility(failed,game,history,now).reasons.includes('NHL research quality threshold not met'));
});
test('NHL features reject thin history and cannot use overlapping, future or other-season scores',()=>{
 const f=featuresFor(game,history);assert.deepEqual(f.sampleSizes,[10,10]);assert.equal(featuresFor(game,history.slice(1)),null);
 const extra=[{...history[0],id:'overlap',date:new Date(Date.parse(start)-3600000).toISOString(),homeScore:99},{...history[0],id:'future',date:new Date(Date.parse(start)+3600000).toISOString(),homeScore:99},{...history[0],id:'prior-season',season:2026,homeScore:99}];
 assert.deepEqual(featuresFor(game,[...history,...extra]),f);
 for(const r of [{...qualified,generatedAt:new Date(now-37*3600000).toISOString()},{...qualified,generatedAt:new Date(now+3600000).toISOString()},{...qualified,model:{...qualified.model,ranges:[[2,3],[2,3]]}}])assert.equal(publicationEligibility(r,game,history,now).eligible,false);
 assert.equal(publicationEligibility(qualified,game,history.map(g=>({...g,date:new Date(now-30*86400000).toISOString()})),now).eligible,false);
});
test('NHL future schedule inclusion is explicit; original Arizona identity is retained',()=>{
 const h='game_id,season_full,game_type,game_time,home_team_abbr,away_team_abbr,home_score,away_score,game_state';
 const future=h+'\n2026020200,20262027,R,'+start+',LAK,BOS,,,FUT';
 assert.equal(cleanNhl(future,2027,now).games.length,0);assert.equal(cleanNhl(future,2027,now,{includeUpcoming:true}).games[0].complete,false);
 assert.equal(cleanNhl(h+'\n2023020200,20232024,R,2023-11-19T20:00:00Z,ARI,BOS,3,2,OFF',2024,now).games[0].home,'Arizona Coyotes');
 assert.throws(()=>cleanNhl(h+'\n2026020200,20262027,R,'+start+',ARI,BOS,,,FUT',2027,now,{includeUpcoming:true}));
});
test('NHL exact schedule and lead time stay strict; documented spelling aliases do not relax identity',()=>{
 const g={...game,home:'Montreal Canadiens',away:'St. Louis Blues'},e={...feed.games[0],home:'Montréal Canadiens',away:'St Louis Blues'};
 assert.equal(matchingProviderEvent(g,[e]),e);assert.equal(matchingProviderEvent(g,[e,{...e,id:'duplicate'}]),null);assert.equal(matchingProviderEvent(g,[{...e,eventStart:'2026-11-19T20:10:00Z'}]),null);
 for(const f of [null,{...feed,games:[...feed.games,{...feed.games[0],id:'duplicate'}]},{...feed,fetchedAt:new Date(now-3*3600000).toISOString()}])assert.equal(run([],undefined,f).published,0);
 const late=Date.parse(start)-10*60000;assert.equal(run([],undefined,{...feed,fetchedAt:new Date(late).toISOString()},late,{...qualified,generatedAt:new Date(late).toISOString()}).published,0);
});
test('NHL model publication is reproducible; final shootout/OT scores grade once and a loss stays',()=>{
 const first=run();assert.equal(first.published,1);const entries=first.additions,p=entries[0].forecast;assert.equal(p.league,'NHL');assert.equal(p.simulation.n,10000);assert.match(p.rationale,/overtime and shootouts/);assert.equal(run(entries).published,0);
 const final={...game,complete:true,homeScore:2,awayScore:3},clock=Date.parse(start)+49*3600000;
 assert.equal(run(entries,[final],null,Date.parse(start)+24*3600000).graded,0);
 assert.equal(run(entries,[{...final,id:'different-source'}],null,clock).graded,0);
 const resolution=run(entries,[final],null,clock);assert.equal(resolution.graded,1);assert.equal(resolution.additions[0].result,'loss');
 const all=[...entries,...resolution.additions];assert.equal(publicArchive(all).predictions.length,1);assert.equal(run(all,[final],null,clock).graded,0);preservePrefix(entries.map(e=>JSON.stringify(e)+'\n').join(''),all.map(e=>JSON.stringify(e)+'\n').join(''));
 const status=analysisStatus(feed.games[0],{schemaVersion:2,league:'NHL',state:'published',lastAttemptAt:new Date(now).toISOString(),completedAt:new Date(now).toISOString(),checks:first.checks},now);assert.equal(status.label,'Publication recorded');
});
