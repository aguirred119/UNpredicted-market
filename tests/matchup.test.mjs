import test from 'node:test';import assert from 'node:assert/strict';
import {matchupForm} from '../lib/matchup-form.js';
import {parseMatchup,resolveMatchup,findContext,recordUrl} from '../src/matchup-data.js';
test('Form uses same-season completed games available 48h before event, retains ties and perspective',()=>{
 const game={id:'next',season:2026,date:'2026-10-06T12:00:00Z',home:'Home',away:'Away'};
 const base={complete:true,season:2026,home:'Home',away:'Away',homeScore:10,awayScore:10};
 const games=[{...base,id:'tie',date:'2026-10-01T12:00:00Z'},{...base,id:'win',date:'2026-10-02T12:00:00Z',homeScore:21,awayScore:10},{...base,id:'recent',date:'2026-10-05T12:00:00Z'},{...base,id:'old-season',date:'2026-09-01T12:00:00Z',season:2025},{...base,id:'unfinished',date:'2026-10-03T12:00:00Z',complete:false}];
 const f=matchupForm(game,games,{window:8});assert.equal(f.home.count,2);assert.equal(f.home.ties,1);assert.equal(f.home.wins,1);assert.equal(f.away.losses,1);assert.equal(f.home.averageMargin,5.5);assert.equal(f.away.averageMargin,-5.5);assert.equal(f.home.recent[0].result,'W');assert.equal(f.away.recent[0].venue,'away');
 assert.equal(matchupForm(game,[],{window:8}).home.averageMargin,null);
});
test('Permanent links round-trip and reject ambiguous query inputs',()=>{const p={league:'MLB',eventId:'abc',id:'record-1'};assert.deepEqual(parseMatchup(recordUrl(p).split('?')[1]),{league:'MLB',event:'abc',record:'record-1'});for(const q of ['league=NBA&event=x&event=y','league=FAKE&event=x','league=NBA&event=<script>','league=NBA&event=x&home=Fake'])assert.equal(parseMatchup(q),null);});
test('Saved forecast identity survives schedule removal and cannot be replaced by changed schedule',()=>{
 const p={id:'saved',league:'NFL',eventId:'abc',home:'Home',away:'Away',eventStart:'2026-10-04T12:00:00Z',publishedAt:'2026-10-01T12:00:00Z'};const q={league:'NFL',event:'abc',record:'saved'},archive={predictions:[p]};
 assert.equal(resolveMatchup(q,archive,null).home,'Home');assert.equal(resolveMatchup({...q,record:'missing'},archive,{enabled:true,league:'NFL',games:[{id:'abc'}]}),null);
 const changed={...p,id:'abc',home:'Other'};assert.equal(resolveMatchup(q,archive,{enabled:true,league:'NFL',games:[changed]}).schedule,null);
 assert.equal(resolveMatchup(q,archive,null,Date.parse('2026-09-01')),null);
});
test('Form attaches only to exact unique teams and start time',()=>{const game={league:'NBA',home:'Los Angeles Clippers',away:'Boston Celtics',eventStart:'2026-10-05T12:00:00Z'},context={home:'LA Clippers',away:game.away,eventStart:game.eventStart};assert.equal(findContext(game,{upcoming:[context]}),context);assert.equal(findContext(game,{upcoming:[context,context]}),null);assert.equal(findContext(game,{upcoming:[{...context,eventStart:'2026-10-06T12:00:00Z'}]}),null);});
