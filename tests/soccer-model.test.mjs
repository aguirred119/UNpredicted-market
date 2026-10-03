import test from 'node:test';import assert from 'node:assert/strict';
import {soccerRows,fitSoccer,predictSoccer,evaluateSoccer,scoreSoccer} from '../lib/soccer-model.js';
const fixtures=Array.from({length:16},(_,i)=>({id:'g'+i,complete:true,season:'2023-24',date:`2023-08-${String(i+1).padStart(2,'0')}T23:59:59.999Z`,sourceDate:`2023-08-${String(i+1).padStart(2,'0')}`,home:'A',away:'B',homeScore:i%3,awayScore:(i+1)%3}));
const training=Array.from({length:150},(_,i)=>({date:'2023-12-01',x:[(i%15-7)/3,2+i%5/5],y:i%3}));
test('Soccer features use only prior same-season results with conservative 48-hour lag',()=>{
 const r=soccerRows(fixtures);assert.equal(r.rows[0].date,'2023-08-09');assert.equal(r.rows[0].inputThrough,'2023-08-05');
 const changed=fixtures.map(g=>g.sourceDate>='2023-08-09'?{...g,homeScore:50,awayScore:0}:g);assert.deepEqual(soccerRows(changed).rows[0].x,r.rows[0].x);
 assert.equal(soccerRows(fixtures.map((g,i)=>i<5?{...g,season:'2022-23'}:g)).rows.some(g=>g.date==='2023-08-09'),false);
});
test('Three-way model returns finite normalized probabilities and rejects invalid features/classes',()=>{
 const m=fitSoccer(training),p=predictSoccer(m,[0,3]);assert.equal(p.length,3);assert.ok(p.every(v=>v>0&&v<1));assert.ok(Math.abs(p.reduce((a,b)=>a+b,0)-1)<1e-12);assert.deepEqual(fitSoccer(training).weights,m.weights);
 assert.throws(()=>predictSoccer(m,[NaN,3]));assert.throws(()=>fitSoccer(training.map(r=>({...r,y:0}))));assert.throws(()=>fitSoccer(training.map(r=>({...r,x:[0,Infinity]}))));
});
test('Historical holdout is strictly later, leaves fitted parameters frozen and reports calibration sample sizes',()=>{
 const m=fitSoccer(training),saved=JSON.stringify(m),holdout=training.slice(0,30).map(r=>({...r,date:'2024-10-01'}));
 const e=evaluateSoccer(m,holdout);assert.equal(JSON.stringify(m),saved);assert.equal(e.metrics.count,30);assert.equal(e.baseline.count,30);assert.ok(e.metrics.brier>=0&&e.metrics.brier<=2);
 for(const c of e.calibration)assert.equal(c.bins.reduce((s,b)=>s+b.count,0),30);
 assert.throws(()=>evaluateSoccer(m,training),/strictly later/);
});
test('Multiclass Brier and log loss have explicitly correct known outcomes',()=>{
 const perfect=scoreSoccer([{p:[1,0,0],y:0}]);assert.equal(perfect.brier,0);assert.equal(perfect.logLoss,0);assert.equal(perfect.accuracy,1);
 assert.equal(scoreSoccer([{p:[0,0,1],y:0}]).brier,2);assert.ok(Math.abs(scoreSoccer([{p:[1/3,1/3,1/3],y:1}]).brier-2/3)<1e-12);
});
