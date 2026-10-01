import {mkdir,copyFile,rm} from 'node:fs/promises';
await rm('public',{recursive:true,force:true});
await mkdir('public/assets',{recursive:true});
for(const f of ['index.html','analytics.html','track-record.html','learn.html','methodology.html','plans.html','privacy.html','terms.html','recovery.html','calculator.html']) await copyFile(f,`public/${f}`);
for(const f of ['research.css','research.js','model.js','sports.js','daily-pick.js']) await copyFile(`src/${f}`,`public/assets/${f}`);
console.log('Built UNpredicted research platform');
