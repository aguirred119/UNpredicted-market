import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';import {resolve} from 'node:path';
import {SOCCER_LEAGUES,soccerSeason} from '../src/soccer-data.js';
import {buildSoccerReport} from '../lib/soccer.js';
export async function refreshSoccer({now=Date.now(),fetchImpl=fetch,previous={leagues:{}}}={}){
 const season=soccerSeason(now),leagues={},refresh={};
 for(const [league,config] of Object.entries(SOCCER_LEAGUES)){
  try{
   const url=`https://raw.githubusercontent.com/openfootball/football.json/master/${season}/${config.code}.json`,response=await fetchImpl(url,{signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw Error('Source unavailable');const raw=await response.text();if(raw.length>1000000)throw Error('Oversized source');
   // Only the existing zero-credit event schedule endpoint. Never request odds/scores.
   let feed=null;try{const r=await fetchImpl(`https://unpredicted-market.vercel.app/api/games?league=${encodeURIComponent(league)}`,{signal:AbortSignal.timeout(10000)});if(r.ok)feed=await r.json();}catch{}
   leagues[league]=buildSoccerReport({league,season,raw,feed,now});
   const before=previous.leagues?.[league],after=leagues[league];
   // Retrieval success is separate from whether the source's results advanced.
   const resultsChanged=before?JSON.stringify([before.dataThrough,before.completedGames,before.teams])!==JSON.stringify([after.dataThrough,after.completedGames,after.teams]):null;
   refresh[league]={state:'updated',attemptedAt:new Date(now).toISOString(),resultsChanged,sourceFileChanged:before?before.source?.sha256!==after.source.sha256:null};
  }catch{
   // Preserve earlier snapshots with their original dates. A failed attempt is not fresh data.
   if(previous.leagues?.[league])leagues[league]=previous.leagues[league];
   refresh[league]={state:'source-or-validation-error',attemptedAt:new Date(now).toISOString(),message:'Source retrieval or validation failed. Previous snapshot, if present, retains its original timestamp.'};
  }
 }
 return{schemaVersion:1,lastAttemptAt:new Date(now).toISOString(),cadence:'Daily retrieval; upstream community results are not guaranteed to update daily.',leagues,refresh};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 let previous={leagues:{}};try{previous=JSON.parse(await readFile('data/soccer-context.json','utf8'));}catch{}
 const result=await refreshSoccer({previous});await writeFile('data/soccer-context.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({states:result.refresh,leagues:Object.keys(result.leagues)},null,2));
}
