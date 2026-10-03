// Retrospective three-outcome research. No live publication or betting-market inputs.
export const SOCCER_MODEL_VERSION='soccer-softmax-form-v1';
const lag=48*3600000;
export function soccerRows(games,{window=10,minimum=5}={}){
 const sorted=games.filter(g=>g.complete).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)),rows=[],skipped=[];
 for(const game of sorted){
  // Earliest possible local day boundary across these five European leagues (UTC+2).
  // Never assume a historical kickoff at the end of its date.
  const cutoff=Date.parse(game.sourceDate+'T00:00:00Z')-2*3600000-lag;
  const form=team=>sorted.filter(g=>g.id!==game.id&&g.season===game.season&&Date.parse(g.date)<=cutoff&&(g.home===team||g.away===team)).slice(-window);
  const home=form(game.home),away=form(game.away);
  if(home.length<minimum||away.length<minimum){skipped.push({id:game.id,reason:'Insufficient same-season prior results'});continue;}
  const rates=(history,team)=>{const scored=history.reduce((s,g)=>s+(g.home===team?g.homeScore:g.awayScore),0)/history.length,allowed=history.reduce((s,g)=>s+(g.home===team?g.awayScore:g.homeScore),0)/history.length;return{scored,allowed,margin:scored-allowed};};
  const h=rates(home,game.home),a=rates(away,game.away);
  rows.push({id:game.id,date:game.sourceDate,season:game.season,home:game.home,away:game.away,x:[h.margin-a.margin,(h.scored+h.allowed+a.scored+a.allowed)/2],y:game.homeScore>game.awayScore?0:game.homeScore===game.awayScore?1:2,inputThrough:[...home,...away].map(g=>g.sourceDate).sort().at(-1),homeCount:home.length,awayCount:away.length});
 }
 return{rows,skipped};
}
function softmax(z){const max=Math.max(...z),e=z.map(v=>Math.exp(v-max)),sum=e.reduce((a,b)=>a+b,0);return e.map(v=>v/sum);}
export function predictSoccer(model,x){
 if(!Array.isArray(x)||x.length!==2||x.some(v=>!Number.isFinite(v)))throw Error('Two finite soccer features required');
 const f=[1,...x.map((v,j)=>(v-model.means[j])/model.sd[j])];return softmax(model.weights.map(w=>w.reduce((s,v,j)=>s+v*f[j],0)));
}
export function fitSoccer(rows){
 if(rows.length<100||rows.some(r=>!Array.isArray(r.x)||r.x.length!==2||r.x.some(v=>!Number.isFinite(v))||![0,1,2].includes(r.y))||new Set(rows.map(r=>r.y)).size!==3)throw Error('Insufficient valid three-outcome training data');
 const means=[0,1].map(j=>rows.reduce((s,r)=>s+r.x[j],0)/rows.length),sd=[0,1].map(j=>Math.sqrt(rows.reduce((s,r)=>s+(r.x[j]-means[j])**2,0)/rows.length)||1),weights=Array.from({length:3},()=>[0,0,0]);
 const prepared=rows.map(r=>({x:[1,...r.x.map((v,j)=>(v-means[j])/sd[j])],y:r.y}));
 // Fixed optimizer and regularization declared before evaluation; no holdout tuning.
 for(let epoch=0;epoch<1000;epoch++){
  const grad=Array.from({length:3},()=>[0,0,0]);
  for(const r of prepared){const p=softmax(weights.map(w=>w.reduce((s,v,j)=>s+v*r.x[j],0)));for(let c=0;c<3;c++)for(let j=0;j<3;j++)grad[c][j]+=(p[c]-(r.y===c?1:0))*r.x[j];}
  for(let c=0;c<3;c++)for(let j=0;j<3;j++)weights[c][j]-=.1*(grad[c][j]/rows.length+(j?.02*weights[c][j]:0));
 }
 return{version:SOCCER_MODEL_VERSION,classes:['Home win','Draw','Away win'],weights,means,sd,trainingCount:rows.length,trainingFrom:rows[0].date,trainingThrough:rows.at(-1).date,ranges:[0,1].map(j=>[Math.min(...rows.map(r=>r.x[j])),Math.max(...rows.map(r=>r.x[j]))]),baseline:[0,1,2].map(c=>rows.filter(r=>r.y===c).length/rows.length),optimizer:{epochs:1000,learningRate:.1,l2:.02}};
}
export function scoreSoccer(forecasts){
 if(!forecasts.length)throw Error('No evaluation observations');
 return{count:forecasts.length,brier:forecasts.reduce((s,r)=>s+r.p.reduce((t,p,c)=>t+(p-(r.y===c?1:0))**2,0),0)/forecasts.length,logLoss:forecasts.reduce((s,r)=>s-Math.log(Math.max(1e-15,r.p[r.y])),0)/forecasts.length,accuracy:forecasts.filter(r=>r.p.indexOf(Math.max(...r.p))===r.y).length/forecasts.length};
}
export function evaluateSoccer(model,rows){
 if(!rows.length||rows.some(r=>r.date<=model.trainingThrough))throw Error('Holdout must be strictly later than training');
 const forecasts=rows.map(r=>({...r,probabilities:predictSoccer(model,r.x),withinTrainingRange:r.x.every((v,j)=>v>=model.ranges[j][0]&&v<=model.ranges[j][1])}));
 const metrics=scoreSoccer(forecasts.map(r=>({p:r.probabilities,y:r.y}))),baseline=scoreSoccer(rows.map(r=>({p:model.baseline,y:r.y})));
 const calibration=[0,1,2].map(c=>({outcome:model.classes[c],bins:Array.from({length:5},(_,i)=>{const selected=forecasts.filter(r=>r.probabilities[c]>=i/5&&(i===4?r.probabilities[c]<=1:r.probabilities[c]<(i+1)/5));return{from:i/5,to:(i+1)/5,count:selected.length,meanProbability:selected.length?selected.reduce((s,r)=>s+r.probabilities[c],0)/selected.length:null,observedFraction:selected.length?selected.filter(r=>r.y===c).length/selected.length:null};})}));
 return{metrics,baseline,calibration,forecasts,holdoutFrom:rows[0].date,holdoutThrough:rows.at(-1).date,outsideTrainingRange:forecasts.filter(r=>!r.withinTrainingRange).length};
}
