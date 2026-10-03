import test from 'node:test';
import assert from 'node:assert/strict';
import {soccerInputReadiness} from '../src/soccer-data.js';
const now=Date.parse('2026-10-03T12:00:00Z'),event={eventId:'one',home:'Home',away:'Away',eventStart:'2026-10-04T12:00:00Z'};
const report={league:'Premier League',season:'2026-27',generatedAt:'2026-10-03T11:30:00Z',scheduleAsOf:'2026-10-03T11:30:00Z',dataThrough:'2026-09-30',upcoming:[event],teams:['Home','Away'].map(team=>({team,count:5,inputAsOf:'2026-09-30T23:59:59Z',averageMargin:0,averageScored:1,averageAllowed:1}))};
test('fresh exact sufficient inputs pass only preflight, without producing probabilities',()=>{
 assert.deepEqual(soccerInputReadiness(report,event,now),{status:'inputs-pass',reasons:[]});
});
test('fresh retrieval cannot pass stale results; old schedules and wrong identities block',()=>{
 for(const changed of [{...report,dataThrough:'2026-09-20'},{...report,scheduleAsOf:'2026-10-03T08:00:00Z'},{...report,upcoming:[event,event]},{...report,season:'2025-26'}])assert.equal(soccerInputReadiness(changed,event,now).status,'blocked');
 assert.equal(soccerInputReadiness(report,{...event,away:'Other'},now).status,'blocked');
});
test('future inputs, thin histories and started events remain blocked',()=>{
 for(const team of [{...report.teams[0],count:4},{...report.teams[0],inputAsOf:'2026-10-02T23:00:00Z'},{...report.teams[0],averageScored:NaN}])assert.equal(soccerInputReadiness({...report,teams:[team,report.teams[1]]},event,now).status,'blocked');
 assert.equal(soccerInputReadiness(report,{...event,eventStart:'2026-10-03T11:00:00Z'},now).status,'blocked');
});
