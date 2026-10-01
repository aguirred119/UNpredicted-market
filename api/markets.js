import {LEAGUES} from '../src/sports.js';
// Connect only a JSON feed for which the operator has explicit redistribution rights.
// No exchange API calls or third-party data redistribution are enabled by default.
export function normalizeFeed(data){
 if(!data||typeof data.source!=='string'||typeof data.attribution!=='string'||!Array.isArray(data.markets))throw Error('Invalid feed');
 return{source:data.source.slice(0,150),attribution:data.attribution.slice(0,500),markets:data.markets.slice(0,100).map(m=>{
 if(typeof m.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(m.id)||typeof m.question!=='string'||!['Sports','Economics','Politics','Technology'].includes(m.category)||!(m.ask===null||(typeof m.ask==='number'&&Number.isFinite(m.ask)&&m.ask>=0&&m.ask<=1)))throw Error('Invalid market');
 if(m.category==='Sports'&&!LEAGUES.includes(m.league))throw Error('Sports markets require a supported league');
 return{league:m.category==='Sports'?m.league:null,id:m.id,question:m.question.slice(0,180),category:m.category,ask:m.ask,source:data.source.slice(0,150)};})};
}
export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 if(process.env.MARKET_FEED_AUTHORIZED!=='true'||!process.env.MARKET_FEED_PERMISSION_REFERENCE||!process.env.MARKET_FEED_URL)return res.status(200).json({enabled:false});
 try{const url=new URL(process.env.MARKET_FEED_URL);if(url.protocol!=='https:')throw Error('HTTPS required');
 const response=await fetch(url,{signal:AbortSignal.timeout(5000),redirect:'error'});if(!response.ok)throw Error('Feed unavailable');
 const text=await response.text();if(text.length>500000)throw Error('Feed too large');const data=normalizeFeed(JSON.parse(text));
 res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=120');return res.status(200).json({enabled:true,fetchedAt:new Date().toISOString(),...data});
 }catch{return res.status(503).json({enabled:false,error:'Authorized feed unavailable'});}
}
