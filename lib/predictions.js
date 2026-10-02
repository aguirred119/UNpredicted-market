import {createHash} from 'node:crypto';
import {LEAGUES} from '../src/sports.js';
import {predict,simulate,VERSION} from '../src/model.js';
const isISO=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(v)&&Number.isFinite(Date.parse(v));
const text=(v,max=2000)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
export const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function validateForecast(p){
 if(!p||(typeof p.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(p.id))||!['editorial','model'].includes(p.kind)||!LEAGUES.includes(p.league)||!text(p.event,200)||!text(p.selection,100)||!text(p.rationale)||!isISO(p.eventStart)||!isISO(p.publishedAt)||Date.parse(p.publishedAt)>=Date.parse(p.eventStart))throw Error('Invalid forecast or pregame publication time');
 if(!text(p.eventId,100)||!text(p.home,100)||!text(p.away,100)||p.home===p.away||![p.home,p.away].includes(p.selection)||!['match-winner-including-overtime','regulation-win'].includes(p.settlementRule))throw Error('Define the event teams, selected team and settlement rule');
 if(!text(p.dataSource,200)||!text(p.dataPermissionReference,300)||!isISO(p.inputAsOf)||Date.parse(p.inputAsOf)>Date.parse(p.publishedAt))throw Error('Missing pregame data provenance');
 if(p.kind==='editorial'&&(p.probability!==undefined||p.model!==undefined||p.simulation!==undefined))throw Error('Editorial selections cannot masquerade as model forecasts');
 if(p.kind==='model'){
 const m=p.model;
 if(!m||m.version!==VERSION||!Array.isArray(m.weights)||m.weights.length!==3||m.weights.some(v=>!Number.isFinite(v))||!Array.isArray(m.means)||m.means.length!==2||m.means.some(v=>!Number.isFinite(v))||!Array.isArray(m.sd)||m.sd.length!==2||m.sd.some(v=>!Number.isFinite(v)||v<=0)||!Array.isArray(m.ranges)||m.ranges.length!==2||m.ranges.some(v=>!Array.isArray(v)||v.length!==2||v.some(x=>!Number.isFinite(x))||v[0]>v[1]))throw Error('Unsupported or incomplete trained model');
 if(!Number.isInteger(m.trainingCount)||m.trainingCount<80||!Number.isInteger(m.holdoutCount)||m.holdoutCount<20||!isISO(m.trainThrough)||!isISO(m.holdoutThrough)||Date.parse(m.trainThrough)>=Date.parse(m.holdoutThrough)||Date.parse(m.holdoutThrough)>Date.parse(p.publishedAt)||!m.metrics||!['brier','baselineBrier','accuracy'].every(k=>Number.isFinite(m.metrics[k])&&m.metrics[k]>=0&&m.metrics[k]<=1))throw Error('Invalid chronological evaluation evidence');
 if(p.synthetic!==false||!/^[a-f0-9]{64}$/.test(p.datasetHash)||!Array.isArray(p.features)||p.features.length!==2||p.features.some(v=>!Number.isFinite(v))||!Number.isFinite(p.probability)||Math.abs(predict(m,p.features)-p.probability)>1e-10)throw Error('Forecast must reproduce the documented real-data model estimate');
 if(!p.simulation||digest(simulate(p.probability,p.simulation.n,p.simulation.seed))!==digest(p.simulation))throw Error('Simulation evidence is not reproducible');
 }
 if(p.marketProbability!==undefined&&(!Number.isFinite(p.marketProbability)||p.marketProbability<0||p.marketProbability>1||!isISO(p.marketUpdatedAt)||Date.parse(p.marketUpdatedAt)>Date.parse(p.publishedAt)||!text(p.marketSource,200)))throw Error('Invalid market probability evidence');
 return p;
}
export function parseLedger(raw){return raw.split('\n').filter(Boolean).map(line=>JSON.parse(line));}
export function validateLedger(entries){
 const forecasts=new Map(),ids=new Set();let prev=null,lastTime=-Infinity;
 for(const e of entries){
 if(!e||(typeof e.entryId!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(e.entryId))||ids.has(e.entryId)||!isISO(e.recordedAt)||Date.parse(e.recordedAt)<lastTime||e.previousHash!==prev)throw Error('Invalid ledger sequence');
 const {hash,...payload}=e;if(hash!==digest(payload))throw Error('Invalid ledger hash');ids.add(e.entryId);lastTime=Date.parse(e.recordedAt);
 if(e.type==='forecast'){
 validateForecast(e.forecast);if(forecasts.has(e.forecast.id)||e.forecast.publishedAt!==e.recordedAt)throw Error('Duplicate prediction or mismatched server time');
 if(e.forecast.modelPredictionId){const supported=forecasts.get(e.forecast.modelPredictionId);if(!supported||supported.kind!=='model'||supported.eventId!==e.forecast.eventId||supported.selection!==e.forecast.selection||supported.settlementRule!==e.forecast.settlementRule)throw Error('Editorial model support does not match the forecast');}
 forecasts.set(e.forecast.id,e.forecast);
 }else if(e.type==='resolution'){
 const p=forecasts.get(e.predictionId);if(!p||!['win','loss','void'].includes(e.result)||!text(e.source,300)||!text(e.reason,1000)||!isISO(e.resolvedAt)||Date.parse(e.resolvedAt)<Date.parse(p.eventStart)||Date.parse(e.resolvedAt)>Date.parse(e.recordedAt))throw Error('Invalid resolution');
 const prior=entries.slice(0,entries.indexOf(e)).filter(x=>x.type==='resolution'&&x.predictionId===e.predictionId).at(-1);
 if((prior?.entryId||null)!==(e.correctsEntryId||null))throw Error('Resolution corrections must reference the prior result');
 }else throw Error('Unsupported entry type');prev=hash;
 }return entries;
}
export function appendEntry(entries,payload,now=new Date().toISOString()){
 const entry={...payload,recordedAt:now,previousHash:entries.at(-1)?.hash||null};entry.hash=digest(entry);validateLedger([...entries,entry]);return entry;
}
export function publicArchive(entries){
 validateLedger(entries);const predictions=entries.filter(e=>e.type==='forecast').map(e=>({...e.forecast,recordHash:e.hash,archiveEntryId:e.entryId}));
 const resolutions=entries.filter(e=>e.type==='resolution');return{version:1,storage:'git-versioned-append-only-convention',predictions,resolutions,ledgerHead:entries.at(-1)?.hash||null};
}
export function preservePrefix(previous,current){if(!current.startsWith(previous))throw Error('Published ledger records cannot be modified or removed. Append a correction instead.');}
export function gradeScore(p,event){
 if(!['NBA','NFL','MLB','NHL','WNBA'].includes(p.league)||p.settlementRule!=='match-winner-including-overtime'||!event?.completed||event.id!==p.eventId||event.home_team!==p.home||event.away_team!==p.away||!Array.isArray(event.scores)||event.scores.length!==2)return null;
 const scores=event.scores;if(scores.some(s=>![p.home,p.away].includes(s.name)||s.score===null||s.score===''||!Number.isFinite(Number(s.score))||Number(s.score)<0)||new Set(scores.map(s=>s.name)).size!==2)return null;
 const a=scores.find(s=>s.name===p.selection),b=scores.find(s=>s.name!==p.selection);if(Number(a.score)===Number(b.score))return 'loss';return Number(a.score)>Number(b.score)?'win':'loss';
}
