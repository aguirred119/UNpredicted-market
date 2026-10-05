import {mkdir,copyFile,rm,readFile,writeFile} from 'node:fs/promises';
import {parseLedger,publicArchive} from '../lib/predictions.js';
await rm('public',{recursive:true,force:true});
await mkdir('public/assets',{recursive:true});await mkdir('public/data',{recursive:true});
for(const f of ['index.html','analytics.html','track-record.html','learn.html','methodology.html','plans.html','privacy.html','terms.html','recovery.html','calculator.html','editor.html','nba-research.html','nfl-research.html','app.html','offline.html','matchup.html','stats.html','soccer-research.html'])await copyFile(f,`public/${f}`);
for(const f of ['research.css','mobile.css','recovery-brand.css','research.js','dashboard.js','archive.js','editor.js','model.js','sports.js','team-colors.js','daily-pick.js','favicon.svg','plans.js','nba-research.js','daily-feed.js','app.js','matchup.js','matchup-data.js','team-form.js','soccer-data.js','stats.js','soccer-research.js','analysis-status.js','editor-data.js','us-stats.js'])await copyFile(`src/${f}`,`public/assets/${f}`);
await mkdir('public/assets/icons',{recursive:true});
for(const name of ['icon-192.png','icon-512.png','apple-touch-icon.png'])await copyFile(`src/icons/${name}`,`public/assets/icons/${name}`);
for(const name of ['manifest.webmanifest','sw.js'])await copyFile(name,`public/${name}`);
await writeFile('public/data/predictions.json',JSON.stringify(publicArchive(parseLedger(await readFile('data/ledger.jsonl','utf8'))),null,2));
// Review utility uses the actual deployed documents in phone-width frames.
const pageNames=['index.html','analytics.html','plans.html','track-record.html','nba-research.html','nfl-research.html','app.html','stats.html','editor.html'];
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

// Explicit render-only simulation of standalone layout, alongside actual install/offline pages.
const appPage=await readFile('app.html','utf8'),homePage=await readFile('index.html','utf8'),offlinePage=await readFile('offline.html','utf8');
const simulated=homePage.replace('<body>','<body class="installed-app">').replace('</body>','<nav class="app-tabs" aria-label="App navigation"><a href="/" aria-current="page">Games</a><a href="/analytics.html">Lab</a><a href="/track-record.html">Record</a></nav></body>');
const appFrames=[['Add to home screen',appPage],['Installed layout — simulation',simulated],['Connection fallback',offlinePage]].map(([title,page])=>`<section><h2>${title}</h2><iframe title="${title}" style="width:390px;height:760px;border:1px solid #494132" srcdoc="${page.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></iframe></section>`).join('');
await writeFile('public/app-review.html',`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>Home-screen mobile review</title><style>body{margin:0;padding:20px;background:#292929;color:white;font:14px system-ui}main{display:flex;gap:24px}h2{font-size:14px}</style></head><body><p>Phone layout review · installed mode is simulated; verify installation on a real device.</p><main>${appFrames}</main></body></html>`);

const matchupPage=await readFile('matchup.html','utf8'),saved=publicArchive(parseLedger(await readFile('data/ledger.jsonl','utf8'))).predictions[0];
if(saved){
 const query='?league='+encodeURIComponent(saved.league)+'&event='+encodeURIComponent(saved.eventId)+'&record='+encodeURIComponent(saved.id);
 const phone=matchupPage.replace('<script type="module" src="/assets/matchup.js"></script>',`<script type="module">import {start} from '/assets/matchup.js';start(window.parent.location.search||${JSON.stringify(query)});</script>`);
 await writeFile('public/matchup-review.html',`<!doctype html><html lang="en"><head><meta name="robots" content="noindex"><title>Matchup phone review</title></head><body style="margin:0;padding:20px;background:#292929;color:white;font:14px system-ui"><p>Actual saved publication · 390px phone viewport</p><iframe title="Matchup phone website" style="width:390px;height:1700px;border:0" srcdoc="${phone.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></iframe></body></html>`);
}

await copyFile('data/soccer-context.json','public/data/soccer-context.json');

await copyFile('data/soccer-research.json','public/data/soccer-research.json');
const soccerReview=(await readFile('soccer-research.html','utf8')).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
await writeFile('public/soccer-review.html',`<!doctype html><html lang="en"><head><meta name="robots" content="noindex"><title>Soccer research phone review</title></head><body style="margin:0;padding:20px;background:#292929;color:white;font:14px system-ui"><p>Actual soccer research document · 390px phone width</p><iframe title="Soccer research phone website" style="width:390px;height:1400px;border:0" srcdoc="${soccerReview}"></iframe></body></html>`);

for(const league of ['mlb','nhl'])await copyFile(`data/${league}-stats.json`,`public/data/${league}-stats.json`);
