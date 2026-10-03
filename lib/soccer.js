import {createHash} from 'node:crypto';
import {SOCCER_LEAGUES,canonicalSoccer,competitionDay} from '../src/soccer-data.js';
import {matchupForm} from './matchup-form.js';
const DAY=86400000,LAG=48*3600000;
export function cleanSoccer(data,league,season,now=Date.now()){
 if(!Object.hasOwn(SOCCER_LEAGUES,league)||!/^\d{4}-\d{2}$/.test(season)||!Array.isArray(data?.matches)||data.matches.length>1000||typeof data.name!=='string'||![SOCCER_LEAGUES[league].sourceName+' '+season.replace('-','/'),...(league==='La Liga'&&season==='2023-24'?['Primera División de España 2023/24']:[])].includes(data.name))throw Error('Unsupported soccer dataset');
 const start=Number(season.slice(0,4));if(Number(season.slice(5))!==(start+1)%100)throw Error('Invalid soccer season');
 const games=new Map();let excluded=0;
 for(const r of data.matches){
  if(!r||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date))||new Date(r.date).toISOString().slice(0,10)!==r.date||r.date<`${start}-07-01`||r.date>=`${start+1}-07-01`||typeof r.team1!=='string'||typeof r.team2!=='string'||!r.team1.trim()||!r.team2.trim()||r.team1.length>100||r.team2.length>100){excluded++;continue;}
  const home=canonicalSoccer(r.team1,league),away=canonicalSoccer(r.team2,league);if(home===away){excluded++;continue;}
  const scores=Array.isArray(r.score)?r.score:r.score?.ft;
  if(scores!==undefined&&(!Array.isArray(scores)||scores.length!==2||scores.some(v=>!Number.isInteger(v)||v<0||v>50))){excluded++;continue;}
  // Source dates have day precision. End-of-day UTC is a conservative upper bound
  // for these European league dates, not an invented kickoff/publication time.
  const date=r.date+'T23:59:59.999Z',complete=scores!==undefined;
  if(complete&&Date.parse(date)>now-LAG){excluded++;continue;}
  const id='soccer-'+createHash('sha256').update([league,season,r.date,home,away].join('|')).digest('hex').slice(0,24);
  const game={id,league,season,date,sourceDate:r.date,home,away,complete,...(complete?{homeScore:scores[0],awayScore:scores[1]}:{})};
  if(games.has(id)&&JSON.stringify(games.get(id))!==JSON.stringify(game))throw Error('Conflicting soccer result');games.set(id,game);
 }
 const list=[...games.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 const teams=[...new Set(list.flatMap(g=>[g.home,g.away]))].sort();
 if(teams.length!==SOCCER_LEAGUES[league].expectedTeams||list.length<100||excluded>data.matches.length*.1)throw Error('Incomplete soccer source');
 return{games:list,teams,excluded};
}
export function soccerForm(event,games){
 const f=matchupForm(event,games,{window:10});f.datePrecision='day';
 for(const team of [f.home,f.away]){
  team.datePrecision='day';team.inputAsOfDateOnly=team.inputAsOf?.slice(0,10)||null;
  team.recent=team.recent.map(g=>({...g,dateOnly:g.date.slice(0,10),result:g.result==='T'?'D':g.result}));
  const prior=games.filter(g=>g.complete&&g.season===event.season&&g.id!==event.id&&Date.parse(g.date)<=Date.parse(event.date)-LAG&&(g.home===team.team||g.away===team.team)).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).slice(-10);
  team.averageScored=prior.length?prior.reduce((s,g)=>s+(g.home===team.team?g.homeScore:g.awayScore),0)/prior.length:null;
  team.averageAllowed=prior.length?prior.reduce((s,g)=>s+(g.home===team.team?g.awayScore:g.homeScore),0)/prior.length:null;
 }
 return f;
}
export function matchingSoccerFixture(event,games){
 if(!Object.hasOwn(SOCCER_LEAGUES,event.league)||typeof event.home!=='string'||typeof event.away!=='string')return null;
 const day=competitionDay(event.eventStart,event.league),home=canonicalSoccer(event.home,event.league),away=canonicalSoccer(event.away,event.league);
 const matches=games.filter(g=>g.sourceDate===day&&g.home===home&&g.away===away);
 return matches.length===1?matches[0]:null;
}
export function buildSoccerReport({league,season,raw,feed,now=Date.now()}){
 const cleaned=cleanSoccer(JSON.parse(raw),league,season,now),completed=cleaned.games.filter(g=>g.complete),upcoming=[],skipped=[];
 const scheduleReady=feed?.enabled===true&&feed.league===league&&Array.isArray(feed.games)&&Number.isFinite(Date.parse(feed.fetchedAt))&&Date.parse(feed.fetchedAt)<=now+60000&&now-Date.parse(feed.fetchedAt)<=2*3600000;
 if(scheduleReady)for(const e of feed.games.filter(e=>Date.parse(e.eventStart)>now&&Date.parse(e.eventStart)<=now+14*DAY)){
  const fixture=matchingSoccerFixture(e,cleaned.games);
  if(!fixture||fixture.complete){skipped.push({event:`${e.away} at ${e.home}`,reason:'No unique uncompleted source fixture for these teams and competition-local date'});continue;}
  if(!/^[-a-zA-Z0-9]{1,100}$/.test(e.id)||e.league!==league){skipped.push({event:'Invalid provider event',reason:'Event identity rejected'});continue;}
  upcoming.push({eventId:e.id,home:e.home,away:e.away,eventStart:e.eventStart,sourceEventId:fixture.id,sourceDate:fixture.sourceDate,identityBasis:'Exact explicit team aliases and competition-local calendar date; kickoff supplied by The Odds API, not verified by the day-precision results source'});
 }
 const teams=cleaned.teams.map(team=>soccerForm({id:'snapshot-'+team,season,date:new Date(now).toISOString(),home:team,away:team},cleaned.games).home);
 return{schemaVersion:1,league,season,status:'descriptive-statistics',generatedAt:new Date(now).toISOString(),dataThrough:completed.at(-1)?.sourceDate||null,completedGames:completed.length,source:{name:'OpenFootball community league results',license:'CC0 1.0 / public domain',licenseUrl:'https://github.com/openfootball/football.json/blob/master/LICENSE.md',attribution:'OpenFootball contributors. Normalized and aggregated by TONATI LAB; no endorsement.',url:`https://raw.githubusercontent.com/openfootball/football.json/master/${season}/${SOCCER_LEAGUES[league].code}.json`,sha256:createHash('sha256').update(raw).digest('hex')},processing:{window:10,lagHours:48,datePrecision:'day',excluded:cleaned.excluded,limitations:'Community-maintained results can be delayed or corrected. Match dates have day precision; source kickoff times are not used. Only same-season domestic league games. No cup games, injuries, lineups, xG or model probabilities.'},scheduleAsOf:scheduleReady?feed.fetchedAt:null,scheduleState:scheduleReady?'matched-schedule':'schedule-unavailable',teams,upcoming,skipped};
}
