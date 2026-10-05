import {csvRecords} from './nba.js';
export const NHL_TEAMS={ANA:'Anaheim Ducks',BOS:'Boston Bruins',BUF:'Buffalo Sabres',CAR:'Carolina Hurricanes',CBJ:'Columbus Blue Jackets',CGY:'Calgary Flames',CHI:'Chicago Blackhawks',COL:'Colorado Avalanche',DAL:'Dallas Stars',DET:'Detroit Red Wings',EDM:'Edmonton Oilers',FLA:'Florida Panthers',LAK:'Los Angeles Kings',MIN:'Minnesota Wild',MTL:'Montreal Canadiens',NJD:'New Jersey Devils',NSH:'Nashville Predators',NYI:'New York Islanders',NYR:'New York Rangers',OTT:'Ottawa Senators',PHI:'Philadelphia Flyers',PIT:'Pittsburgh Penguins',SEA:'Seattle Kraken',SJS:'San Jose Sharks',STL:'St. Louis Blues',TBL:'Tampa Bay Lightning',TOR:'Toronto Maple Leafs',UTA:'Utah Mammoth',VAN:'Vancouver Canucks',VGK:'Vegas Golden Knights',WPG:'Winnipeg Jets',WSH:'Washington Capitals'};
export const MLB_TEAMS={ANA:'Los Angeles Angels',ARI:'Arizona Diamondbacks',ATH:'Athletics',ATL:'Atlanta Braves',BAL:'Baltimore Orioles',BOS:'Boston Red Sox',CHA:'Chicago White Sox',CHN:'Chicago Cubs',CIN:'Cincinnati Reds',CLE:'Cleveland Guardians',COL:'Colorado Rockies',DET:'Detroit Tigers',HOU:'Houston Astros',KCA:'Kansas City Royals',LAN:'Los Angeles Dodgers',MIA:'Miami Marlins',MIL:'Milwaukee Brewers',MIN:'Minnesota Twins',NYA:'New York Yankees',NYN:'New York Mets',PHI:'Philadelphia Phillies',PIT:'Pittsburgh Pirates',SDN:'San Diego Padres',SEA:'Seattle Mariners',SFN:'San Francisco Giants',SLN:'St. Louis Cardinals',TBA:'Tampa Bay Rays',TEX:'Texas Rangers',TOR:'Toronto Blue Jays',WAS:'Washington Nationals'};
const score=v=>/^\d+$/.test(v)?Number(v):NaN;
function unique(games){if(new Set(games.map(g=>g.id)).size!==games.length)throw Error('Duplicate source game identity');return games.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));}
export function cleanNhl(raw,season,now=Date.now()){
 const rows=csvRecords(raw,['game_id','season_full','game_type','game_time','home_team_abbr','away_team_abbr','home_score','away_score','game_state']);const games=[];let excluded=0;
 for(const r of rows){
  if(r.game_type!=='R'){excluded++;continue;}
  const home=NHL_TEAMS[r.home_team_abbr],away=NHL_TEAMS[r.away_team_abbr],time=Date.parse(r.game_time),expected=`${season-1}${season}`;
  if(r.season_full!==expected||!/^\d{10}$/.test(r.game_id)||!home||!away||home===away||!Number.isFinite(time))throw Error('Invalid NHL regular-season identity');
  if(!['OFF','FINAL'].includes(r.game_state)){excluded++;continue;}
  const homeScore=score(r.home_score),awayScore=score(r.away_score);
  if(!Number.isSafeInteger(homeScore)||!Number.isSafeInteger(awayScore)||homeScore===awayScore)throw Error('Invalid NHL final score');
  if(time>now-48*3600000){excluded++;continue;}
  games.push({id:r.game_id,season,home,away,date:new Date(time).toISOString(),homeScore,awayScore,complete:true});
 }
 return{games:unique(games),excluded,sourceRows:rows.length};
}
export function cleanRetrosheet(raw,season){
 const headers=Array.from({length:161},(_,i)=>'f'+i);const rows=csvRecords(headers.join(',')+'\n'+raw,headers);const games=[];let excluded=0;
 for(const r of rows){
  // Do not assign a suspended or forfeited game's final score to its original date.
  if(r.f13||r.f14||r.f15){excluded++;continue;}
  const home=MLB_TEAMS[r.f6],away=MLB_TEAMS[r.f3],homeScore=score(r.f10),awayScore=score(r.f9),day=r.f0;
  if(!/^\d{8}$/.test(day)||Number(day.slice(0,4))!==season||!home||!away||home===away||!Number.isSafeInteger(homeScore)||!Number.isSafeInteger(awayScore)||!/^\d+$/.test(r.f1))throw Error('Invalid Retrosheet game identity or score');
  const date=`${day.slice(0,4)}-${day.slice(4,6)}-${day.slice(6,8)}T23:59:59.999Z`;
  if(!Number.isFinite(Date.parse(date))||new Date(date).toISOString()!==date)throw Error('Invalid Retrosheet date');
  games.push({id:`${day}-${r.f6}-${r.f1}`,season,home,away,date,homeScore,awayScore,complete:true});
 }
 return{games:unique(games),excluded,sourceRows:rows.length};
}
