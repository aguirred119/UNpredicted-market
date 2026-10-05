import {train,predict} from '../src/model.js';
import {matchupForm} from './matchup-form.js';
import {LAG} from './nba.js';
export {LAG};
export const FEATURE_DEFINITIONS=['Home minus away average goal margin in up to 10 prior same-season regular-season games, including overtime and shootouts','Home minus away win fraction in those same games; all final game wins count'];
export const canonical=t=>({'LA Kings':'Los Angeles Kings','Montréal Canadiens':'Montreal Canadiens','St Louis Blues':'St. Louis Blues'}[t]||t);
export function featuresFor(game,games){
 const form=matchupForm(game,games,{window:10}),{home,away}=form;
 if(home.count<10||away.count<10)return null;
 return{x:[home.averageMargin-away.averageMargin,home.wins/home.count-away.wins/away.count],inputAsOf:[home.inputAsOf,away.inputAsOf].sort().at(-1),oldestLatest:[home.inputAsOf,away.inputAsOf].sort()[0],sampleSizes:[home.count,away.count]};
}
export function research(games){
 // Fixed v1 split: ending seasons 2023–2025 train, 2026 evaluates.
 // Never retrain or tune against the later holdout season.
 const observations=games.filter(g=>g.complete&&g.season>=2023&&g.season<=2026).map(g=>{const f=featuresFor(g,games);return f?{date:g.date,x:f.x,y:Number(g.homeScore>g.awayScore),season:g.season}:null;}).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date));
 const cut=observations.findIndex(r=>r.season===2026);
 if(cut<2500||observations.length-cut<900||new Set(observations.slice(0,cut).map(r=>r.season)).size!==3||observations.slice(cut).some(r=>r.season!==2026))throw Error('Incomplete NHL chronological evaluation');
 const model=train(observations,cut),test=observations.slice(cut),base=observations.slice(0,cut).reduce((s,r)=>s+r.y,0)/cut;
 const forecasts=test.map(r=>({p:predict(model,r.x),y:r.y}));
 const calibration=Array.from({length:10},(_,i)=>{const items=forecasts.filter(r=>Math.min(9,Math.floor(r.p*10))===i);return{from:i/10,to:(i+1)/10,count:items.length,meanProbability:items.length?items.reduce((s,r)=>s+r.p,0)/items.length:null,winFraction:items.length?items.reduce((s,r)=>s+r.y,0)/items.length:null};});
 return{model,baselineProbability:base,baselineAccuracy:test.filter(r=>Number(base>=.5)===r.y).length/test.length,trainFrom:observations[0].date,holdoutFrom:test[0].date,calibration,featureDefinitions:FEATURE_DEFINITIONS};
}
export function publicationEligibility(report,game,games,now=Date.now()){
 const reasons=[],f=featuresFor(game,games),m=report?.model;
 if(game.complete||!Number.isFinite(Date.parse(game.date))||Date.parse(game.date)<=now||Date.parse(game.date)>now+72*3600000)reasons.push('Outside upcoming 72-hour window');
 if(!f)reasons.push('Each team needs 10 current-season prior games');
 if(f&&now-Date.parse(f.oldestLatest)>10*86400000)reasons.push('Team history is older than 10 days');
 if(!m||m.holdoutCount<900||!Number.isFinite(m.metrics?.brier)||!Number.isFinite(m.metrics?.baselineBrier)||m.metrics.baselineBrier-m.metrics.brier<.005)reasons.push('NHL research quality threshold not met');
 const generated=Date.parse(report?.generatedAt);if(!Number.isFinite(generated)||generated>now||now-generated>36*3600000)reasons.push('NHL research snapshot is unavailable or overdue');
 if(f&&(!Array.isArray(m?.ranges)||f.x.some((v,i)=>!m.ranges[i]||v<m.ranges[i][0]||v>m.ranges[i][1])))reasons.push('Features outside training range');
 return{eligible:reasons.length===0,reasons,features:f};
}
export function matchingProviderEvent(game,events){const matches=events.filter(e=>e.league==='NHL'&&canonical(e.home)===game.home&&canonical(e.away)===game.away&&Date.parse(e.eventStart)===Date.parse(game.date));return matches.length===1?matches[0]:null;}
export const policy={league:'NHL',canonical,LAG,publicationEligibility,matchingProviderEvent,prefix:'nhl',scoreSource:'SportsDataverse / fastRhockey completed NHL score',dataSource:'SportsDataverse / fastRhockey NHL results; The Odds API event identity',rationale:'Home-team outright win probability including overtime and shootouts. Experimental logistic model using prior same-season goal margin and win fraction. Excludes starting goalies, injuries, lineups, rest and odds; no puck-line or regulation-only probability is implied.'};
