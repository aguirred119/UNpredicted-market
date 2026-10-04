import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {dailyBatch} from '../lib/nba-publication.js';import {publicArchive,preservePrefix} from '../lib/predictions.js';
// Isolated fixtures exercise the real pipeline. They are never committed to the public ledger.
const report=JSON.parse(await readFile(new URL('../data/nba-research.json',import.meta.url),'utf8'));
const now=Date.parse('2026-11-18T12:00:00Z'),start='2026-11-19T20:00:00.000Z';
const history=Array.from({length:12},(_,i)=>({id:'history-'+i,date:new Date(now-(14-i)*86400000).toISOString(),season:2027,home:'LA Clippers',away:'Boston Celtics',complete:true,homeScore:100+i%2,awayScore:101-i%2}));
const game={id:'future-source',date:start,season:2027,home:'LA Clippers',away:'Boston Celtics',complete:false};
const feed={enabled:true,league:'NBA',fetchedAt:new Date(now).toISOString(),games:[{id:'provider-event',league:'NBA',home:'Los Angeles Clippers',away:'Boston Celtics',eventStart:start}]};
const run=(entries=[],games=[...history,game],currentFeed=feed,clock=now)=>dailyBatch({entries,games,report,feed:currentFeed,now:clock});
test('Prospective publication reproduces a trained estimate, timestamp and simulation; reruns do not duplicate',()=>{const first=run();assert.equal(first.published,1);assert.equal(first.additions[0].forecast.publishedAt,new Date(now).toISOString());assert.equal(first.additions[0].forecast.selection,'Los Angeles Clippers');assert.equal(publicArchive(first.additions).predictions.length,1);assert.equal(run(first.additions).published,0);});
test('A losing exact completed event is retained and graded without a working schedule',()=>{const entries=run().additions,final={...game,complete:true,homeScore:99,awayScore:105};const later=Date.parse(start)+49*3600000;const second=run(entries,[...history,final],null,later);assert.equal(second.graded,1);assert.equal(second.additions[0].result,'loss');const combined=[...entries,...second.additions];assert.equal(publicArchive(combined).predictions.length,1);assert.equal(publicArchive(combined).resolutions[0].result,'loss');preservePrefix(entries.map(e=>JSON.stringify(e)+'\n').join(''),combined.map(e=>JSON.stringify(e)+'\n').join(''));assert.equal(run(combined,[final],null,later).graded,0);});
test('No forecasts for mismatched, stale or missing schedules, thin histories or imminent starts',()=>{assert.equal(run([],history.slice(0,9).concat(game)).published,0);for(const f of [null,{...feed,fetchedAt:new Date(now-3*3600000).toISOString()},{...feed,games:[{...feed.games[0],eventStart:'2026-11-19T21:00:00Z'}]}])assert.equal(run([],undefined,f).published,0);assert.equal(run([],undefined,{...feed,fetchedAt:new Date(Date.parse(start)-600000).toISOString()},Date.parse(start)-600000).published,0);});
test('Early finals, source team mismatches and rescheduled games remain pending',()=>{const entries=run().additions;const final={...game,complete:true,homeScore:99,awayScore:105};assert.equal(run(entries,[final],null,Date.parse(start)+24*3600000).graded,0);for(const g of [{...final,home:'Atlanta Hawks'},{...final,date:'2026-11-20T20:00:00.000Z'}])assert.equal(run(entries,[g],null,Date.parse(start)+72*3600000).graded,0);});
test('Every unique schedule-only event receives an explicit blocked check, never a fabricated forecast',()=>{
 const result=run([],history);assert.equal(result.published,0);assert.equal(result.checks.length,1);
 assert.equal(result.checks[0].eventId,'provider-event');assert.equal(result.checks[0].status,'blocked');assert.equal(result.checks[0].sourceGameId,null);
 assert.match(result.checks[0].reasons.join(' '),/statistical-source/);
});
test('Ambiguous provider or source identities cannot publish even when model inputs qualify',()=>{
 const duplicate={...feed,games:[feed.games[0],{...feed.games[0],id:'second-provider'}]};
 const result=run([],undefined,duplicate);assert.equal(result.published,0);
 assert.equal(result.checks.filter(c=>c.eventId).length,2);assert.ok(result.checks.every(c=>c.status==='blocked'));
 assert.equal(run([],history.concat(game,{...game,id:'second-source'})).published,0);
 assert.equal(run([],undefined,{...feed,games:[feed.games[0],feed.games[0]]}).scheduleReady,false);
});
test('Checks distinguish new and existing publications without duplicating archived forecasts',()=>{
 const first=run();assert.equal(first.checks[0].status,'published');assert.equal(first.checks[0].forecastId,first.additions[0].forecast.id);
 const second=run(first.additions);assert.equal(second.checks[0].status,'already-published');assert.equal(second.additions.length,0);
 assert.equal(second.checks[0].home,feed.games[0].home);assert.equal(second.checks[0].checkedAt,new Date(now).toISOString());
});
