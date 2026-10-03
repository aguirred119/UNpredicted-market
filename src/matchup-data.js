import {LEAGUES} from './sports.js';
export const validId=id=>typeof id==='string'&&/^[-a-zA-Z0-9]{1,100}$/.test(id);
export const matchupUrl=g=>`/matchup.html?league=${encodeURIComponent(g.league)}&event=${encodeURIComponent(g.id)}`;
export const recordUrl=p=>`/matchup.html?league=${encodeURIComponent(p.league)}&event=${encodeURIComponent(p.eventId)}&record=${encodeURIComponent(p.id)}`;
export function parseMatchup(search){
 const q=new URLSearchParams(search),league=q.get('league'),event=q.get('event'),record=q.get('record');
 if([...q.keys()].some(k=>!['league','event','record'].includes(k))||[...new Set(q.keys())].some(k=>q.getAll(k).length!==1)||!LEAGUES.includes(league)||!validId(event)||(record!==null&&!validId(record)))return null;
 return{league,event,record};
}
export function resolveMatchup(query,archive,feed,now=Date.now()){
 const publications=(archive?.predictions||[]).filter(p=>p.league===query.league&&p.eventId===query.event&&Date.parse(p.publishedAt)<=now);
 const record=query.record?publications.find(p=>p.id===query.record):null;
 // An explicit permanent publication must exist. Do not fall back to another forecast.
 if(query.record&&!record)return null;
 const event=record||publications[0]||((feed?.enabled&&feed.league===query.league)?feed.games?.find(g=>g.id===query.event):null);
 if(!event)return null;
 const home=event.home,away=event.away,eventStart=event.eventStart;
 return{id:query.event,league:query.league,home,away,eventStart,record,publications:publications.filter(p=>p.home===home&&p.away===away&&p.eventStart===eventStart),schedule:(feed?.games||[]).find(g=>g.id===query.event&&g.home===home&&g.away===away&&g.eventStart===eventStart)||null};
}
export function findContext(game,report){
 const canon=t=>game.league==='NBA'&&t==='Los Angeles Clippers'?'LA Clippers':t;
 const matches=(report?.upcoming||[]).filter(g=>canon(g.home)===canon(game.home)&&canon(g.away)===canon(game.away)&&g.eventStart===game.eventStart);
 return matches.length===1?matches[0]:null;
}
export function findMarket(game,markets){
 const matches=(markets||[]).filter(m=>m.id==='odds-'+game.id&&m.home===game.home&&m.away===game.away&&Number.isFinite(Date.parse(m.eventStart))&&Date.parse(m.eventStart)===Date.parse(game.eventStart));
 return matches.length===1?matches[0]:null;
}
