import test from 'node:test';
import assert from 'node:assert/strict';
import {editorialDisplay} from '../src/daily-pick.js';
const pick={id:'p1',kind:'editorial',league:'MLB',event:'Away at Home',selection:'Home',rationale:'Editorial opinion',publishedAt:'2026-10-02T12:00:00Z',eventStart:'2026-10-03T20:00:00Z'};
const now=Date.parse('2026-10-04T00:00:00Z');
const resolution={predictionId:'p1',result:'win',resolvedAt:'2026-10-03T23:00:00Z',recordedAt:'2026-10-03T23:01:00Z'};
test('settled editorial selections preserve win, loss and void equally',()=>{
 for(const result of ['win','loss','void']){
  const state=editorialDisplay({predictions:[pick],resolutions:[{...resolution,result}]},now);
  assert.equal(state.status,'settled');assert.equal(state.resolution.result,result);assert.equal(state.pick,pick);
 }
});
test('started event without a verified resolution remains pending',()=>{
 for(const r of [[],[{...resolution,result:'unknown'}],[{...resolution,recordedAt:'2026-10-05T00:00:00Z'}],[{...resolution,resolvedAt:pick.publishedAt}]]){
  const state=editorialDisplay({predictions:[pick],resolutions:r},now);assert.equal(state.status,'pending');assert.equal(state.resolution,null);
 }
});
test('new pregame editorial selection takes priority; unpublished and model records do not',()=>{
 const upcoming={...pick,id:'p2',publishedAt:'2026-10-03T23:00:00Z',eventStart:'2026-10-04T20:00:00Z'};
 assert.equal(editorialDisplay({predictions:[upcoming,pick],resolutions:[resolution]},now).pick,upcoming);
 assert.equal(editorialDisplay({predictions:[pick,{...upcoming,kind:'model'},{...upcoming,publishedAt:'2026-10-04T12:00:00Z'}],resolutions:[resolution]},now).pick,pick);
 assert.equal(editorialDisplay({predictions:[{...pick,publishedAt:pick.eventStart}]},now),null);
});
test('latest appended correction is visible without deleting original result',()=>{
 const corrections=[resolution,{...resolution,result:'loss',recordedAt:'2026-10-03T23:30:00Z'}];
 assert.equal(editorialDisplay({predictions:[pick],resolutions:corrections},now).resolution.result,'loss');
 assert.equal(corrections.length,2);
});
