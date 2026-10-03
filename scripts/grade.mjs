// Run in trusted server/CI context only. No key is included in output or stored records.
import {readFile,appendFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {parseLedger,validateLedger,appendEntry,gradeScore} from '../lib/predictions.js';
import {SPORT_KEYS} from '../lib/odds.js';
if(!process.env.ODDS_API_KEY)throw Error('Configure a server-only ODDS_API_KEY before grading.');
const entries=validateLedger(parseLedger(await readFile('data/ledger.jsonl','utf8')));
const pending=entries.filter(e=>e.type==='forecast'&&!entries.some(r=>r.type==='resolution'&&r.predictionId===e.forecast.id)).map(e=>e.forecast).filter(p=>Date.parse(p.eventStart)<=Date.now()&&['NBA','NFL','MLB','NHL','WNBA'].includes(p.league)&&['match-winner-including-overtime','run-line-including-extra-innings'].includes(p.settlementRule));
const additions=[];
for(const league of new Set(pending.map(p=>p.league))){
 const url=new URL(`https://api.the-odds-api.com/v4/sports/${SPORT_KEYS[league]}/scores/`);url.search=new URLSearchParams({apiKey:process.env.ODDS_API_KEY,daysFrom:'3'}).toString();
 let events;try{const res=await fetch(url,{signal:AbortSignal.timeout(8000),redirect:'error'});if(!res.ok)throw Error();events=await res.json();if(!Array.isArray(events))throw Error();}catch{throw Error('Score provider unavailable; no results changed.');}
 for(const p of pending.filter(p=>p.league===league)){
 const event=events.find(e=>e.id===p.eventId),result=gradeScore(p,event);if(!result)continue;
 const now=new Date().toISOString(),entry=appendEntry([...entries,...additions],{entryId:randomUUID(),type:'resolution',predictionId:p.id,result,source:'The Odds API completed score',reason:p.settlementRule==='run-line-including-extra-innings'?'Selected team score plus published run-line handicap, including extra innings.':'Selected team match-winner result, including overtime. A tie is not a team win.',resolvedAt:now,correctsEntryId:null},now);
 additions.push(entry);
 }
}
if(additions.length)await appendFile('data/ledger.jsonl',additions.map(e=>JSON.stringify(e)).join('\n')+'\n');
console.log('Completed-score grading finished. Unavailable and unsupported results remain pending.');
