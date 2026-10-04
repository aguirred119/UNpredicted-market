import test from 'node:test';
import assert from 'node:assert/strict';
import {validateForecast,gradeScore} from '../lib/predictions.js';
const p={id:'spread-test',kind:'editorial',league:'NFL',eventId:'event',event:'Chiefs at Raiders',home:'Las Vegas Raiders',away:'Kansas City Chiefs',selection:'Kansas City Chiefs',handicap:-4.5,settlementRule:'point-spread-including-overtime',publishedAt:'2026-10-04T19:00:00Z',eventStart:'2026-10-04T20:25:00Z',inputAsOf:'2026-10-04T18:00:00Z',rationale:'Test only',dataSource:'Test',dataPermissionReference:'Test'};
const result=(chiefs,raiders)=>({id:'event',home_team:p.home,away_team:p.away,completed:true,scores:[{name:p.home,score:String(raiders)},{name:p.away,score:String(chiefs)}]});
test('Chiefs -4.5 requires a five-point margin, not merely an outright win',()=>{
 assert.equal(validateForecast(p),p);
 assert.equal(gradeScore(p,result(24,20)),'loss');assert.equal(gradeScore(p,result(25,20)),'win');assert.equal(gradeScore(p,result(20,20)),'loss');assert.equal(gradeScore(p,result(17,20)),'loss');
 assert.equal(gradeScore({...p,selection:p.home,handicap:4.5},result(24,20)),'win');
});
test('Spread publications reject unsupported leagues, models, missing and push-capable handicaps',()=>{
 for(const change of [{league:'MLB'},{league:'NHL'},{kind:'model'},{handicap:undefined},{handicap:-4},{handicap:NaN},{handicap:101.5},{handicap:-4.25}])assert.throws(()=>validateForecast({...p,...change}));
});
test('Unfinished, mismatched and fractional-score spread results stay ungraded',()=>{
 const e=result(25,20);for(const event of [{...e,completed:false},{...e,id:'wrong'},{...e,home_team:'Other'},result(24.5,20)])assert.equal(gradeScore(p,event),null);
});
