// Trusted operator pipeline: train on a permissioned CSV and publish real computed forecasts.
// Input is a local JSON file; never put source datasets or secrets in the public repository.
import {readFile,appendFile} from 'node:fs/promises';import {randomUUID,createHash} from 'node:crypto';
import {parseCSV,train,predict,simulate} from '../src/model.js';
import {parseLedger,validateLedger,appendEntry} from '../lib/predictions.js';
const input=JSON.parse(await readFile(process.argv[2],'utf8'));
if(input.synthetic!==false||input.dataUseAuthorized!==true||typeof input.trainingCSVPath!=='string'||!Array.isArray(input.games)||!input.featureDefinitions?.every(x=>typeof x==='string'&&x.trim())||input.featureDefinitions.length!==2)throw Error('Provide authorized real data, two pregame feature definitions and future games.');
const csv=await readFile(input.trainingCSVPath,'utf8'),model=train(parseCSV(csv)),datasetHash=createHash('sha256').update(csv).digest('hex');
const entries=validateLedger(parseLedger(await readFile('data/ledger.jsonl','utf8'))),now=new Date().toISOString();let additions=[];
for(const game of input.games){
 const id=game.id||randomUUID();if(entries.some(e=>e.type==='forecast'&&e.forecast.id===id))throw Error('Prediction ID already published');
 if(Date.parse(game.eventStart)<=Date.parse(now))throw Error('Forecast publication must precede the event');
 const probability=predict(model,game.features),forecast={...game,id,kind:'model',publishedAt:now,synthetic:false,model,probability,datasetHash,featureDefinitions:input.featureDefinitions,dataSource:input.dataSource,dataPermissionReference:input.dataPermissionReference,simulation:simulate(probability,input.trials||10000,input.seed??12345)};
 const entry=appendEntry([...entries,...additions],{entryId:randomUUID(),type:'forecast',forecast},now);additions.push(entry);
}
// Validate the entire batch before appending; never partially publish an invalid batch.
if(additions.length)await appendFile('data/ledger.jsonl',additions.map(x=>JSON.stringify(x)).join('\n')+'\n');
console.log(`Computed and archived ${additions.length} model forecasts. Commit/deploy after review.`);
