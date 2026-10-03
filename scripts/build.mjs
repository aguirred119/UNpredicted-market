import {mkdir,copyFile,rm,readFile,writeFile} from 'node:fs/promises';
import {parseLedger,publicArchive} from '../lib/predictions.js';
await rm('public',{recursive:true,force:true});
await mkdir('public/assets',{recursive:true});await mkdir('public/data',{recursive:true});
for(const f of ['index.html','analytics.html','track-record.html','learn.html','methodology.html','plans.html','privacy.html','terms.html','recovery.html','calculator.html','editor.html','nba-research.html','nfl-research.html'])await copyFile(f,`public/${f}`);
for(const f of ['research.css','mobile.css','recovery-brand.css','research.js','dashboard.js','archive.js','editor.js','model.js','sports.js','team-colors.js','daily-pick.js','favicon.svg','plans.js','nba-research.js','daily-feed.js'])await copyFile(`src/${f}`,`public/assets/${f}`);
await writeFile('public/data/predictions.json',JSON.stringify(publicArchive(parseLedger(await readFile('data/ledger.jsonl','utf8'))),null,2));
// Review utility uses the actual deployed documents in phone-width frames.
const pageNames=['index.html','analytics.html','plans.html','track-record.html','nba-research.html','nfl-research.html'];
const frames=[];
for(const name of pageNames){
 const page=await readFile(name,'utf8'),attr=page.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
 const frame=`<section><h2>${name}</h2><iframe title="${name} mobile website" srcdoc="${attr}" style="width:390px;height:1900px;border:1px solid #494132;background:#080808"></iframe></section>`;
 frames.push(frame);
}
await writeFile('public/review.html',`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>Mobile review · TONATI LAB</title><style>body{margin:0;background:#292929;color:white;font:14px system-ui}main{display:flex;align-items:start;gap:24px;padding:20px}h2{font-size:14px}p{margin:16px 20px}</style></head><body><p>TONATI LAB · actual pages at 390px phone width</p><main>${frames.join('')}</main></body></html>`);
console.log('Built TONATI LAB sports intelligence platform');

await copyFile('data/nba-research.json','public/data/nba-research.json');
await copyFile('data/daily-feed.json','public/data/daily-feed.json');
await copyFile('data/nfl-research.json','public/data/nfl-research.json');
await copyFile('data/nfl-feed.json','public/data/nfl-feed.json');

const researchPage=await readFile('nba-research.html','utf8');
await writeFile('public/research-review.html',`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>Research mobile review</title></head><body style="margin:0;background:#292929;color:white;font:16px system-ui"><p>NBA research · 390px mobile viewport</p><iframe title="NBA research mobile website" style="width:390px;height:2800px;border:0" srcdoc="${researchPage.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></iframe></body></html>`);
