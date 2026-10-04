import test from 'node:test';import assert from 'node:assert/strict';
import {upcomingEditorialGames,localDateTime} from '../src/editor-data.js';
const now=Date.parse('2026-10-04T19:00:00Z'),game={id:'event',league:'NFL',home:'Raiders',away:'Chiefs',eventStart:'2026-10-04T20:25:00Z'},feed={enabled:true,league:'NFL',fetchedAt:'2026-10-04T18:00:00Z',games:[game]};
test('Editorial schedule picker includes only future verified events',()=>{assert.deepEqual(upcomingEditorialGames({...feed,games:[game,{...game,id:'past',eventStart:'2026-10-04T17:00:00Z'}]},'NFL',now),[game]);});
test('Stale, future, disconnected, cross-league and ambiguous identities cannot prefill a pick',()=>{
 for(const f of [{...feed,enabled:false},{...feed,league:'NBA'},{...feed,fetchedAt:'2026-10-04T15:00:00Z'},{...feed,fetchedAt:'2026-10-04T21:00:00Z'},{...feed,games:[game,game]},{...feed,games:[{...game,home:game.away}]}])assert.throws(()=>upcomingEditorialGames(f,'NFL',now));
});
test('Editor local time fields preserve the intended date and minute without claiming UTC',()=>{
 const iso=game.eventStart,d=new Date(iso),actual=localDateTime(iso);assert.equal(new Date(actual).getTime(),d.getTime());assert.throws(()=>localDateTime('invalid'));
});
