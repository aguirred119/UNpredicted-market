import {train,predict} from '../src/model.js';
import {csvRecords,LAG} from './nba.js';
export {LAG};
export const NAMES={ARI:'Arizona Cardinals',ATL:'Atlanta Falcons',BAL:'Baltimore Ravens',BUF:'Buffalo Bills',CAR:'Carolina Panthers',CHI:'Chicago Bears',CIN:'Cincinnati Bengals',CLE:'Cleveland Browns',DAL:'Dallas Cowboys',DEN:'Denver Broncos',DET:'Detroit Lions',GB:'Green Bay Packers',HOU:'Houston Texans',IND:'Indianapolis Colts',JAX:'Jacksonville Jaguars',KC:'Kansas City Chiefs',LA:'Los Angeles Rams',LAC:'Los Angeles Chargers',LV:'Las Vegas Raiders',MIA:'Miami Dolphins',MIN:'Minnesota Vikings',NE:'New England Patriots',NO:'New Orleans Saints',NYG:'New York Giants',NYJ:'New York Jets',PHI:'Philadelphia Eagles',PIT:'Pittsburgh Steelers',SEA:'Seattle Seahawks',SF:'San Francisco 49ers',TB:'Tampa Bay Buccaneers',TEN:'Tennessee Titans',WAS:'Washington Commanders'};
export const canonical=t=>t;
export const FEATURE_DEFINITIONS=['Home minus away average point margin in up to 8 prior current-season regular-season games','Home minus away win fraction in those same games; ties count as non-wins'];
const eastern=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function localParts(time){return Object.fromEntries(eastern.formatToParts(time).filter(p=>['year','month','day','hour','minute'].includes(p.type)).map(p=>[p.type,+p.value]));}
// nflverse kickoff times are Eastern, including daylight-saving transitions.
export function kickoffUTC(day,time){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^\d{2}:\d{2}$/.test(time))return null;
 const [y,m,d]=day.split('-').map(Number),[h,min]=time.split(':').map(Number);if(h>23||min>59)return null;
 const guess=Date.UTC(y,m-1,d,h,min),p=localParts(guess),offset=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute)-guess,stamp=guess-offset,q=localParts(stamp);
 if(q.year!==y||q.month!==m||q.day!==d||q.hour!==h||q.minute!==min)return null;
 return new Date(stamp).toISOString();
}
export function cleanGames(text,now=Date.now()){
 const ids=new Map();let excluded=0;
 for(const r of csvRecords(text,['game_id','season','game_type','gameday','gametime','home_team','away_team','home_score','away_score','location'])){
 const season=Number(r.season),date=kickoffUTC(r.gameday,r.gametime),home=NAMES[r.home_team==='OAK'?'LV':r.home_team],away=NAMES[r.away_team==='OAK'?'LV':r.away_team];
 const scored=r.home_score!==''&&r.away_score!=='',hs=Number(r.home_score),as=Number(r.away_score);
 if(r.game_type!=='REG'||r.location!=='Home'||!home||!away||home===away||!date||!Number.isInteger(season)||season<2018||season>new Date(now).getUTCFullYear()||!/^\d{4}_\d{2}_[A-Z]{2,3}_[A-Z]{2,3}$/.test(r.game_id)||((r.home_score==='')!==(r.away_score===''))||(scored&&(!Number.isInteger(hs)||!Number.isInteger(as)||hs<0||as<0||Date.parse(date)>now-LAG))){excluded++;continue;}
 const game={id:r.game_id,season,date,home,away,complete:scored,...(scored?{homeScore:hs,awayScore:as}:{})};
 if(ids.has(game.id)&&JSON.stringify(ids.get(game.id))!==JSON.stringify(game))throw Error('Conflicting NFL source game ID');ids.set(game.id,game);
 }
 return{games:[...ids.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)),excluded};
}
export function featuresFor(game,games){
 const history=team=>games.filter(g=>g.complete&&g.id!==game.id&&g.season===game.season&&Date.parse(g.date)<=Date.parse(game.date)-LAG&&(g.home===team||g.away===team)).sort((a,b)=>a.date.localeCompare(b.date)).slice(-8);
 const home=history(game.home),away=history(game.away);if(home.length<4||away.length<4)return null;
 const mean=(list,team,win)=>list.reduce((sum,g)=>{const margin=g.home===team?g.homeScore-g.awayScore:g.awayScore-g.homeScore;return sum+(win?Number(margin>0):margin);},0)/list.length;
 return{x:[mean(home,game.home,false)-mean(away,game.away,false),mean(home,game.home,true)-mean(away,game.away,true)],inputAsOf:[home.at(-1).date,away.at(-1).date].sort().at(-1),oldestLatest:[home.at(-1).date,away.at(-1).date].sort()[0],sampleSizes:[home.length,away.length]};
}
export function research(games){
 // Version 1 split fixed before evaluation: 2018–2023 training, 2024–2025 holdout.
 const rows=games.filter(g=>g.complete&&g.season<=2025).map(g=>{const f=featuresFor(g,games);return f?{date:g.date,x:f.x,y:Number(g.homeScore>g.awayScore),season:g.season}:null;}).filter(Boolean);
 const cut=rows.findIndex(r=>r.season===2024);if(cut<800||rows.length-cut<300||!rows.some(r=>r.season===2025))throw Error('Incomplete NFL chronological evaluation');
 const model=train(rows,cut),test=rows.slice(cut),base=rows.slice(0,cut).reduce((s,r)=>s+r.y,0)/cut;
 const calibration=Array.from({length:10},(_,i)=>{const items=test.map(r=>({p:predict(model,r.x),y:r.y})).filter(r=>Math.min(9,Math.floor(r.p*10))===i);return{from:i/10,to:(i+1)/10,count:items.length,meanProbability:items.length?items.reduce((s,r)=>s+r.p,0)/items.length:null,winFraction:items.length?items.reduce((s,r)=>s+r.y,0)/items.length:null};});
 return{model,baselineProbability:base,baselineAccuracy:test.filter(r=>Number(base>=.5)===r.y).length/test.length,trainFrom:rows[0].date,holdoutFrom:test[0].date,calibration,featureDefinitions:FEATURE_DEFINITIONS};
}
export function publicationEligibility(report,game,games,now=Date.now()){
 const reasons=[],f=featuresFor(game,games);
 if(game.complete||Date.parse(game.date)<=now||Date.parse(game.date)>now+72*3600000)reasons.push('Outside upcoming 72-hour window');
 if(!f)reasons.push('Each team needs 4 current-season prior games');
 if(f&&now-Date.parse(f.oldestLatest)>21*86400000)reasons.push('Team history is older than 21 days');
 if(report.model.holdoutCount<300||report.model.metrics.baselineBrier-report.model.metrics.brier<.005)reasons.push('Research quality threshold not met');
 if(f&&f.x.some((v,i)=>v<report.model.ranges[i][0]||v>report.model.ranges[i][1]))reasons.push('Features outside training range');
 return{eligible:reasons.length===0,reasons,features:f};
}
export function matchingProviderEvent(game,events){const matches=events.filter(e=>e.league==='NFL'&&e.home===game.home&&e.away===game.away&&Date.parse(e.eventStart)===Date.parse(game.date));return matches.length===1?matches[0]:null;}
export const policy={league:'NFL',canonical,LAG,publicationEligibility,matchingProviderEvent,prefix:'nfl',scoreSource:'nflverse completed NFL score',dataSource:'nflverse NFL schedules/results; The Odds API event identity',rationale:'Home-team outright win probability, including overtime; a tie is a non-win. Experimental logistic model using trailing regular-season form. Excludes injuries, quarterbacks, lineups and odds. A probability estimate, not an editorial recommendation.'};
