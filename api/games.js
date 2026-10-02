import {SPORT_KEYS} from '../lib/odds.js';
const cache=new Map(),pending=new Map();
export function normalizeGames(events,league){
 if(!Array.isArray(events))throw Error('Invalid schedule');
 return events.slice(0,250).flatMap(e=>!e||typeof e.id!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(e.id)||typeof e.home_team!=='string'||typeof e.away_team!=='string'||!Number.isFinite(Date.parse(e.commence_time))?[]:[{id:e.id,league,home:e.home_team.slice(0,100),away:e.away_team.slice(0,100),eventStart:new Date(e.commence_time).toISOString()}]);
}
export function createGamesHandler({env=process.env,fetchImpl=fetch,now=Date.now,store=cache,inflight=pending}={}){
 return async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 const q=req.query||Object.fromEntries(new URL(req.url||'/api/games','http://localhost').searchParams),league=q.league||'NBA';
 if(Object.keys(q).some(k=>k!=='league')||typeof league!=='string'||!Object.hasOwn(SPORT_KEYS,league))return res.status(400).json({error:'Unsupported league'});
 if(!env.ODDS_API_KEY)return res.status(200).json({enabled:false,reason:'not-configured',games:[]});
 const send=data=>{res.setHeader('Cache-Control','public, max-age=0, s-maxage=3600');return res.status(200).json(data);};
 const old=store.get(league);if(old&&old.expires>now())return send(old.data);
 try{
 if(!inflight.has(league))inflight.set(league,(async()=>{
 const url=new URL(`https://api.the-odds-api.com/v4/sports/${SPORT_KEYS[league]}/events`);url.searchParams.set('apiKey',env.ODDS_API_KEY);
 const response=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('Unavailable');
 const body=await response.text();if(body.length>2000000)throw Error('Too large');
 const data={enabled:true,league,source:'The Odds API',fetchedAt:new Date(now()).toISOString(),cacheSeconds:3600,dataType:'cached-schedule',games:normalizeGames(JSON.parse(body),league)};
 store.set(league,{data,expires:now()+3600000});return data;
 })());return send(await inflight.get(league));
 }catch{return res.status(503).json({enabled:true,error:'Schedule temporarily unavailable',games:[]});}finally{inflight.delete(league);}
 };
}
export default createGamesHandler();
