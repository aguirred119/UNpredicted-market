// Descriptive source-derived form; never a forecast. Preserve the 48-hour availability lag.
export function matchupForm(game,games,{window,lagHours=48}={}){
 if(!Number.isInteger(window)||window<1)throw Error('Invalid form window');
 const cutoff=Date.parse(game.date)-lagHours*3600000;
 const teamForm=team=>{
  const prior=games.filter(g=>g.complete&&g.id!==game.id&&g.season===game.season&&Date.parse(g.date)<=cutoff&&(g.home===team||g.away===team)&&Number.isInteger(g.homeScore)&&Number.isInteger(g.awayScore)).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).slice(-window);
  const recent=prior.map(g=>{const home=g.home===team,scored=home?g.homeScore:g.awayScore,allowed=home?g.awayScore:g.homeScore;return{date:g.date,opponent:home?g.away:g.home,venue:home?'home':'away',scored,allowed,result:scored>allowed?'W':scored<allowed?'L':'T'};});
  return{team,count:recent.length,wins:recent.filter(g=>g.result==='W').length,losses:recent.filter(g=>g.result==='L').length,ties:recent.filter(g=>g.result==='T').length,averageMargin:recent.length?recent.reduce((s,g)=>s+g.scored-g.allowed,0)/recent.length:null,inputAsOf:recent.at(-1)?.date||null,recent:recent.slice(-5).reverse()};
 };
 return{season:game.season,window,lagHours,cutoff:new Date(cutoff).toISOString(),home:teamForm(game.home),away:teamForm(game.away)};
}
