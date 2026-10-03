import http from 'node:http';import {readFile} from 'node:fs/promises';import path from 'node:path';
import games from '../api/games.js';import odds from '../api/odds.js';import markets from '../api/markets.js';
const root=path.resolve('public');
http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/__preview/mobile'){
 const page=['index.html','analytics.html','plans.html','recovery.html','track-record.html','editor.html'].includes(url.searchParams.get('page'))?url.searchParams.get('page'):'index.html';
 res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><body style="margin:0;background:#29334a;font-family:system-ui;color:white"><p style="margin:12px">Local mobile layout verification · 390px viewport</p><iframe title="Mobile layout" src="/${page}" style="border:0;width:390px;height:1800px;margin:0 20px"></iframe></body></html>`);return;
 }
 if(url.pathname.startsWith('/api/')){res.status=n=>{res.statusCode=n;return res;};res.json=v=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(v));};req.query=Object.fromEntries(url.searchParams);const h={'/api/games':games,'/api/odds':odds,'/api/markets':markets}[url.pathname];if(!h)return res.status(404).json({error:'Not found'});await h(req,res);return;}
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 const ext=path.extname(file),type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'}[ext]||'application/octet-stream';
 res.setHeader('Content-Type',type);res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(3000,'0.0.0.0',()=>console.log('TONATI LAB development server on port 3000'));
