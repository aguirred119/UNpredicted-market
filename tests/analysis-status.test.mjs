import test from 'node:test';
import assert from 'node:assert/strict';
import {analysisStatus,analysisStatusHtml} from '../src/analysis-status.js';
const now=Date.parse('2026-10-04T00:00:00Z'),game={id:'event-one',league:'NFL',home:'Home',away:'Away',eventStart:'2026-10-04T17:00:00Z'};
const check={...game,eventId:game.id,status:'blocked',reasons:['Each team needs 4 current-season prior games'],checkedAt:'2026-10-03T23:01:00Z'};
const feed={schemaVersion:2,league:'NFL',state:'waiting-for-eligible-games',lastAttemptAt:'2026-10-03T23:00:00Z',completedAt:'2026-10-03T23:02:00Z',checks:[check]};
test('Recent exact event check discloses blocked reasons, with equivalent ISO timestamps',()=>{
 const state=analysisStatus({...game,eventStart:'2026-10-04T17:00:00.000Z'},feed,now);
 assert.equal(state.label,'Publication withheld');assert.deepEqual(state.reasons,check.reasons);assert.equal(state.checkedAt,check.checkedAt);
});
test('Wrong teams, event IDs, start times and duplicate checks cannot claim an exact check',()=>{
 for(const g of [{...game,id:'other'},{...game,home:'Away',away:'Home'},{...game,eventStart:'2026-10-04T18:00:00Z'}])assert.equal(analysisStatus(g,feed,now).label,'Event not assessed');
 assert.equal(analysisStatus(game,{...feed,checks:[check,check]},now).label,'Event not assessed');
});
test('Stale, future, legacy, cross-league and internally inconsistent checks fail closed',()=>{
 for(const f of [null,{...feed,schemaVersion:1},{...feed,league:'NBA'},{...feed,completedAt:'2026-10-05T00:00:00Z'},{...feed,lastAttemptAt:'2026-10-04T01:00:00Z'},{...feed,completedAt:'2026-10-01T00:00:00Z'},{...feed,checks:[{...check,checkedAt:'2026-10-03T22:00:00Z'}]},{...feed,checks:[{...check,reasons:[]}]}])assert.equal(analysisStatus(game,f,now).label,'Current check unavailable');
});
test('Unsupported leagues and failed runs explain limits without inventing probabilities',()=>{
 assert.equal(analysisStatus({...game,league:'MLB'},feed,now).label,'Daily model not connected');
 for(const state of ['source-or-validation-error','schedule-unavailable'])assert.equal(analysisStatus(game,{...feed,state},now).label,'Daily check interrupted');
 assert.equal(analysisStatus(game,{...feed,checks:[{...check,status:'published',reasons:[]}]},now).label,'Publication recorded');
});
test('Check HTML escapes source messages and never renders them as executable markup',()=>{
 const esc=s=>String(s).replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const html=analysisStatusHtml(game,{...feed,checks:[{...check,reasons:['<img src=x onerror=alert(1)>']}]},esc,esc,now);
 assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(html.includes('Published forecasts remain'));
});
