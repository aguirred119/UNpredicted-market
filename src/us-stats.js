export const US_STATS_LEAGUES=['NFL','NBA'];
export function statsSeason(league,now=Date.now()){
 const d=new Date(now),year=d.getUTCFullYear();
 return league==='NFL'?year-(d.getUTCMonth()<2?1:0):year+(d.getUTCMonth()>=6?1:0);
}
export function usStatsReport(report,league,now=Date.now()){
 if(!US_STATS_LEAGUES.includes(league)||report?.status!=='retrospective-research'||!report.source?.name)throw Error('Statistics source unavailable.');
 const stats=report.teamStatistics,generated=Date.parse(report.generatedAt),window=league==='NFL'?8:20;
 if(!stats||!Number.isFinite(generated)||generated>now+60000||stats.season!==statsSeason(league,generated)||stats.window!==window||stats.lagHours!==48||Date.parse(stats.cutoff)!==generated-48*3600000||!Array.isArray(stats.teams)||stats.teams.length!==(league==='NFL'?32:30)||new Set(stats.teams.map(t=>t.team)).size!==stats.teams.length)throw Error('Statistics snapshot is incomplete or inconsistent. No replacement figures are shown.');
 for(const t of stats.teams){
  if(typeof t.team!=='string'||!t.team.trim()||!Number.isInteger(t.count)||t.count<0||t.count>window||['wins','losses','ties'].some(k=>!Number.isInteger(t[k])||t[k]<0)||t.wins+t.losses+t.ties!==t.count||!Array.isArray(t.recent)||t.recent.length!==Math.min(5,t.count))throw Error('Invalid team sample.');
  if(t.count&&(!Number.isFinite(t.averageMargin)||!Number.isFinite(t.averageScored)||!Number.isFinite(t.averageAllowed)||t.averageScored<0||t.averageAllowed<0||Math.abs(t.averageScored-t.averageAllowed-t.averageMargin)>1e-8||!Number.isFinite(Date.parse(t.inputAsOf))||Date.parse(t.inputAsOf)>Date.parse(stats.cutoff)))throw Error('Invalid team statistics.');
  if(!t.count&&['averageMargin','averageScored','averageAllowed','inputAsOf'].some(k=>t[k]!==null))throw Error('Empty samples must not imply statistics.');
 }
 const through=Date.parse(stats.dataThrough);
 if(!Number.isInteger(stats.completedGames)||stats.completedGames<0||(stats.completedGames===0?stats.dataThrough!==null:!Number.isFinite(through)||through>Date.parse(stats.cutoff)))throw Error('Invalid source coverage date.');
 return{...stats,snapshotOverdue:now-generated>36*3600000,seasonCurrent:stats.season===statsSeason(league,now),daysBehind:Number.isFinite(through)?Math.max(0,Math.floor((now-through)/86400000)):null};
}
