import {mkdir,copyFile,rm,readFile,writeFile} from 'node:fs/promises';
import {parseLedger,publicArchive} from '../lib/predictions.js';
await rm('public',{recursive:true,force:true});
await mkdir('public/assets',{recursive:true});await mkdir('public/data',{recursive:true});
for(const f of ['index.html','analytics.html','track-record.html','learn.html','methodology.html','plans.html','privacy.html','terms.html','recovery.html','calculator.html','editor.html','nba-research.html'])await copyFile(f,`public/${f}`);
for(const f of ['research.css','recovery-brand.css','research.js','dashboard.js','archive.js','editor.js','model.js','sports.js','team-colors.js','daily-pick.js','favicon.svg','plans.js','nba-research.js'])await copyFile(`src/${f}`,`public/assets/${f}`);
await writeFile('public/data/predictions.json',JSON.stringify(publicArchive(parseLedger(await readFile('data/ledger.jsonl','utf8'))),null,2));
// Owner review utility: the same deployed document runs in a real 390px frame.
const home=await readFile('index.html','utf8');
const attr=home.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
await writeFile('public/review.html',`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Mobile review · TONATI LAB</title><style>body{margin:0;background:#29334a;color:white;font:16px system-ui}p{margin:12px 20px}iframe{width:390px;height:2400px;border:1px solid #65718d;margin:0 20px;background:#0b1020}</style></head><body><p>TONATI LAB · mobile layout review · 390px viewport</p><iframe title="TONATI LAB mobile website" srcdoc="${attr}"></iframe></body></html>`);
console.log('Built TONATI LAB sports intelligence platform');

await copyFile('data/nba-research.json','public/data/nba-research.json');

const researchPage=await readFile('nba-research.html','utf8');
await writeFile('public/research-review.html',`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>Research mobile review</title></head><body style="margin:0;background:#292929;color:white;font:16px system-ui"><p>NBA research · 390px mobile viewport</p><iframe title="NBA research mobile website" style="width:390px;height:2800px;border:0" srcdoc="${researchPage.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></iframe></body></html>`);
