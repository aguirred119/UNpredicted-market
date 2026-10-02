import {mkdir,copyFile,rm,readFile,writeFile} from 'node:fs/promises';
import {parseLedger,publicArchive} from '../lib/predictions.js';
await rm('public',{recursive:true,force:true});
await mkdir('public/assets',{recursive:true});await mkdir('public/data',{recursive:true});
for(const f of ['index.html','analytics.html','track-record.html','learn.html','methodology.html','plans.html','privacy.html','terms.html','recovery.html','calculator.html','editor.html'])await copyFile(f,`public/${f}`);
for(const f of ['research.css','recovery-brand.css','research.js','dashboard.js','archive.js','editor.js','model.js','sports.js','daily-pick.js','favicon.svg','plans.js'])await copyFile(`src/${f}`,`public/assets/${f}`);
await writeFile('public/data/predictions.json',JSON.stringify(publicArchive(parseLedger(await readFile('data/ledger.jsonl','utf8'))),null,2));
console.log('Built TONATI LAB sports intelligence platform');
