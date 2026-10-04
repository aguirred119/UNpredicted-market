export function upcomingEditorialGames(feed,league,now=Date.now()){
 const fetched=Date.parse(feed?.fetchedAt);
 if(feed?.enabled!==true||feed.league!==league||!Number.isFinite(fetched)||fetched>now||now-fetched>2*3600000||!Array.isArray(feed.games))throw Error('A recent connected schedule is required. Try refreshing.');
 const seen=new Set();
 for(const g of feed.games){
  if(!g||typeof g.id!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(g.id)||seen.has(g.id)||g.league!==league||typeof g.home!=='string'||!g.home.trim()||typeof g.away!=='string'||!g.away.trim()||g.home===g.away||!Number.isFinite(Date.parse(g.eventStart)))throw Error('Schedule identities could not be verified. No event fields were filled.');
  seen.add(g.id);
 }
 return feed.games.filter(g=>Date.parse(g.eventStart)>now).sort((a,b)=>Date.parse(a.eventStart)-Date.parse(b.eventStart));
}
export function localDateTime(iso){
 const d=new Date(iso);if(!Number.isFinite(d.getTime()))throw Error('Invalid date');
 const pad=n=>String(n).padStart(2,'0');return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
