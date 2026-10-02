import {SPORT_KEYS,normalizeOdds} from '../lib/odds.js';
// Fixed provider, region, market and sport allowlist. The client never supplies a URL or key.
const cache=new Map(),pending=new Map();let pauseUntil=0;
export function cacheSeconds(value){const n=Number(value);return Number.isInteger(n)&&n>=1800&&n<=86400?n:86400;}
export function createOddsHandler({fetchImpl=fetch,env=process.env,now=Date.now,store=cache,inflight=pending}={}){
 return async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 const query=req.query||Object.fromEntries(new URL(req.url||'/api/odds','http://localhost').searchParams);
 if(Object.keys(query).some(k=>k!=='league')||Array.isArray(query.league))return res.status(400).json({error:'Invalid request'});
 if(!env.ODDS_API_KEY){res.setHeader('Cache-Control','no-store');return res.status(200).json({enabled:false,reason:'not-configured'});}
 const league=query.league||'NBA',sport=SPORT_KEYS[league];if(!Object.hasOwn(SPORT_KEYS,league))return res.status(400).json({error:'Unsupported league'});
 const ttl=cacheSeconds(env.ODDS_CACHE_SECONDS),cached=store.get(league);
 function send(data){res.setHeader('Cache-Control',`public, max-age=0, s-maxage=${ttl}`);return res.status(200).json(data);}
 if(cached&&cached.expires>now())return send(cached.data);
 if(pauseUntil>now())return res.status(503).json({enabled:true,error:'Odds temporarily unavailable'});
 try{
 if(!inflight.has(league))inflight.set(league,(async()=>{
 const url=new URL(`https://api.the-odds-api.com/v4/sports/${sport}/odds/`);url.search=new URLSearchParams({apiKey:env.ODDS_API_KEY,regions:'us',markets:'h2h',oddsFormat:'decimal'}).toString();
 const response=await fetchImpl(url,{signal:AbortSignal.timeout(8000),redirect:'error'});
 if(!response.ok){if([401,403,429].includes(response.status))pauseUntil=now()+3600000;throw Error('Provider unavailable');}
 const body=await response.text();if(body.length>2000000)throw Error('Response too large');
 const data={enabled:true,source:'The Odds API',league,fetchedAt:new Date(now()).toISOString(),cacheSeconds:ttl,attribution:'Sportsbook moneyline odds. Implied probabilities include bookmaker margin and are not AI forecasts.',markets:normalizeOdds(JSON.parse(body),league)};
 const remaining=response.headers.get('x-requests-remaining');if(remaining!==null&&Number.isFinite(Number(remaining))&&Number(remaining)<=10)pauseUntil=now()+3600000;
 store.set(league,{expires:now()+ttl*1000,data});return data;
 })());
 const data=await inflight.get(league);return send(data);
 }catch{res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');return res.status(503).json({enabled:true,error:'Odds temporarily unavailable'});}
 finally{inflight.delete(league);}
 };}
export default createOddsHandler();
