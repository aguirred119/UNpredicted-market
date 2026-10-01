export const SPORT_KEYS={NBA:'basketball_nba',MLB:'baseball_mlb',NFL:'americanfootball_nfl',NHL:'icehockey_nhl',WNBA:'basketball_wnba','Premier League':'soccer_epl','La Liga':'soccer_spain_la_liga','Serie A':'soccer_italy_serie_a',Bundesliga:'soccer_germany_bundesliga','Ligue 1':'soccer_france_ligue_one',MLS:'soccer_usa_mls','Liga MX':'soccer_mexico_ligamx','UEFA Champions League':'soccer_uefa_champs_league'};
export function americanOdds(decimal){return decimal>=2?Math.round((decimal-1)*100):Math.round(-100/(decimal-1));}
export function normalizeOdds(events,league){
 if(!Array.isArray(events))throw Error('Invalid provider response');
 return events.slice(0,100).flatMap(event=>{
 if(!event||typeof event.id!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(event.id)||typeof event.home_team!=='string'||typeof event.away_team!=='string'||!Number.isFinite(Date.parse(event.commence_time)))return[];
 const books=(event.bookmakers||[]).filter(b=>typeof b.title==='string'&&Array.isArray(b.markets));
 const book=books.find(b=>b.markets.some(m=>m.key==='h2h'&&Array.isArray(m.outcomes)&&m.outcomes.length>=2&&m.outcomes.every(o=>typeof o.name==='string'&&typeof o.price==='number'&&Number.isFinite(o.price)&&o.price>1&&o.price<10000)));
 if(!book)return[];const market=book.markets.find(m=>m.key==='h2h');const updatedAt=market.last_update||book.last_update;
 if(!Number.isFinite(Date.parse(updatedAt)))return[];
 return [{id:`odds-${event.id}`,question:`${event.away_team.slice(0,100)} at ${event.home_team.slice(0,100)}`,category:'Sports',league,type:'sportsbook-odds',ask:null,source:'The Odds API',bookmaker:book.title.slice(0,100),eventStart:event.commence_time,updatedAt,outcomes:market.outcomes.slice(0,3).map(o=>({name:o.name.slice(0,100),decimal:o.price,american:americanOdds(o.price),implied:1/o.price}))}];
 });
}
