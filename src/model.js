export const VERSION='logistic-two-feature-v1';
const sigmoid=x=>1/(1+Math.exp(-Math.max(-35,Math.min(35,x))));
export function parseCSV(text){
 const lines=text.trim().split(/\r?\n/); if(lines.shift()?.trim()!=='date,feature_a,feature_b,outcome')throw Error('Use header: date,feature_a,feature_b,outcome');
 if(lines.length<100||lines.length>10000)throw Error('Provide 100–10,000 resolved observations.');
 let prior='';const dates=new Set();
 return lines.map((line,i)=>{const c=line.split(',');const [date,a,b,y]=c;
 if(c.length!==4||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,19)+'Z'!==date||date<prior||dates.has(date)||Date.parse(date)>Date.now()||[a,b,y].some(v=>v.trim()===''||!Number.isFinite(Number(v)))||![0,1].includes(Number(y))||Math.abs(Number(a))>1e6||Math.abs(Number(b))>1e6)throw Error(`Invalid row ${i+2}: use unique past UTC timestamps in order, finite features, and binary outcomes.`);
 prior=date;dates.add(date);return{date,x:[Number(a),Number(b)],y:Number(y)};});
}
export function train(rows,cut=Math.floor(rows.length*.8)){
 if(!Number.isInteger(cut)||cut<80||rows.length-cut<20)throw Error('Insufficient chronological training/holdout observations');
 const training=rows.slice(0,cut),test=rows.slice(cut);
 if(new Set(training.map(r=>r.y)).size<2||new Set(test.map(r=>r.y)).size<2)throw Error('Training and holdout periods must each contain both outcomes.');
 const means=[0,1].map(j=>training.reduce((s,r)=>s+r.x[j],0)/training.length);
 const sd=[0,1].map(j=>Math.sqrt(training.reduce((s,r)=>s+(r.x[j]-means[j])**2,0)/training.length)||1);
 const weights=[0,0,0], base=training.reduce((s,r)=>s+r.y,0)/training.length;
 for(let epoch=0;epoch<600;epoch++){
 const g=[0,0,0];for(const r of training){const x=[1,...r.x.map((v,j)=>(v-means[j])/sd[j])];const err=sigmoid(x.reduce((s,v,j)=>s+v*weights[j],0))-r.y;x.forEach((v,j)=>g[j]+=err*v);}
 weights.forEach((v,j)=>weights[j]-=.1*(g[j]/training.length+(j? .01*v:0)));}
 const model={version:VERSION,weights,means,sd,trainingCount:training.length,holdoutCount:test.length,trainThrough:training.at(-1).date,holdoutThrough:test.at(-1).date,ranges:[0,1].map(j=>[Math.min(...training.map(r=>r.x[j])),Math.max(...training.map(r=>r.x[j]))])};
 const forecasts=test.map(r=>({p:predict(model,r.x),y:r.y}));
 model.metrics={brier:forecasts.reduce((s,r)=>s+(r.p-r.y)**2,0)/test.length,baselineBrier:test.reduce((s,r)=>s+(base-r.y)**2,0)/test.length,accuracy:forecasts.filter(r=>(r.p>=.5?1:0)===r.y).length/test.length};
 return model;
}
export function predict(model,x){if(x.length!==2||x.some(v=>!Number.isFinite(v)))throw Error('Enter two finite feature values.');return sigmoid(model.weights[0]+x.reduce((s,v,j)=>s+(v-model.means[j])/model.sd[j]*model.weights[j+1],0));}
export function simulate(p,n=10000,seed=12345){if(!Number.isFinite(p)||p<0||p>1||!Number.isInteger(n)||n<100||n>100000||!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Invalid simulation parameters.');let state=seed>>>0,yes=0;for(let i=0;i<n;i++){state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);if(((t^(t>>>14))>>>0)/4294967296<p)yes++;}return{n,seed,yes,no:n-yes,frequency:yes/n,monteCarloSE:Math.sqrt(p*(1-p)/n),assumption:'Independent Bernoulli trials using a fixed input probability. Simulation does not validate that probability.'};}
export function ledgerMetrics(records){const resolved=records.filter(r=>r.outcome===0||r.outcome===1);return{count:resolved.length,brier:resolved.length?resolved.reduce((s,r)=>s+(r.probability-r.outcome)**2,0)/resolved.length:null};}
