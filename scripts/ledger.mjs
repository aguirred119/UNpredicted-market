import {readFile,appendFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseLedger,validateLedger,appendEntry,preservePrefix} from '../lib/predictions.js';
const raw=await readFile('data/ledger.jsonl','utf8'),entries=validateLedger(parseLedger(raw));
const [command,file]=process.argv.slice(2);
if(command==='check'){
 if(file){const previous=execFileSync('git',['show',`${file}:data/ledger.jsonl`],{encoding:'utf8'});preservePrefix(previous,raw);}
 console.log(`Validated ${entries.length} archived entries.`);
}else if(command==='publish'){
 const input=JSON.parse(await readFile(file,'utf8')),now=new Date().toISOString();
 if(Date.parse(input.eventStart)<=Date.parse(now))throw Error('Only future events can be published');
 const forecast={...input,id:input.id||randomUUID(),publishedAt:now};
 const entry=appendEntry(entries,{entryId:randomUUID(),type:'forecast',forecast},now);
 await appendFile('data/ledger.jsonl',JSON.stringify(entry)+'\n');console.log(`Published ${forecast.kind} record ${forecast.id}`);
}else if(command==='resolve'){
 const input=JSON.parse(await readFile(file,'utf8'));const entry=appendEntry(entries,{...input,entryId:randomUUID(),type:'resolution'});
 await appendFile('data/ledger.jsonl',JSON.stringify(entry)+'\n');console.log('Resolution appended; original prediction retained.');
}else throw Error('Usage: node scripts/ledger.mjs check [base-ref] | publish file.json | resolve file.json');
