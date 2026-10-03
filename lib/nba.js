import {train,predict} from '../src/model.js';
export const TEAMS=new Set(['Atlanta Hawks','Boston Celtics','Brooklyn Nets','Charlotte Hornets','Chicago Bulls','Cleveland Cavaliers','Dallas Mavericks','Denver Nuggets','Detroit Pistons','Golden State Warriors','Houston Rockets','Indiana Pacers','LA Clippers','Los Angeles Lakers','Memphis Grizzlies','Miami Heat','Milwaukee Bucks','Minnesota Timberwolves','New Orleans Pelicans','New York Knicks','Oklahoma City Thunder','Orlando Magic','Philadelphia 76ers','Phoenix Suns','Portland Trail Blazers','Sacramento Kings','San Antonio Spurs','Toronto Raptors','Utah Jazz','Washington Wizards']);
export const canonical=t=>t==='Los Angeles Clippers'?'LA Clippers':t;
export const FEATURE_DEFINITIONS=['Home minus away average point margin in up to 20 prior regular-season games','Home minus away win fraction in those same games'];
export const LAG=48*60*60*1000;
// RFC-style quoted fields, including commas/newlines and escaped quotes.
export function csvRecords(text){
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===','||c==='\n')){row.push(field.replace(/\r$/,''));field='';if(c==='\n'){rows.push(row);row=[];}}else field+=c;}
 if(quoted)throw Error('Unterminated CSV field');if(field||row.length){row.push(field.replace(/\r$/,''));rows.push(row);}const header=rows.shift();if(!header?.includes('id')||!header.includes('date'))throw Error('Unsupported NBA source schema');
 return rows.filter(r=>r.length>1).map(r=>{if(r.length!==header.length)throw Error('Malformed CSV row');return Object.fromEntries(header.map((k,i)=>[k,r[i]]));});
}
export function cleanGames(records,now=Date.now()){
 const ids=new Map();let excluded=0;
 for(const r of records){const home=canonical(r.home_display_name),away=canonical(r.away_display_name),time=Date.parse(r.date),complete=r.status_type_completed==='true';
 if(r.season_type!=='2'||r.neutral_site!=='false'||!TEAMS.has(home)||!TEAMS.has(away)||home===away||!r.id||!Number.isFinite(time)||r.time_valid!=='true'){excluded++;continue;}
 const hs=Number(r.home_score),as=Number(r.away_score);
 if(complete&&(time>now-LAG||r.status_type_name!=='STATUS_FINAL'||!r.home_score||!r.away_score||!Number.isInteger(hs)||!Number.isInteger(as)||hs<=0||as<=0||hs===as)){excluded++;continue;}
 const game={id:r.id,season:Number(r.season),date:new Date(time).toISOString(),home,away,complete,...(complete?{homeScore:hs,awayScore:as}:{})};
 if(ids.has(r.id)&&JSON.stringify(ids.get(r.id))!==JSON.stringify(game))throw Error('Conflicting source game ID');ids.set(r.id,game);
 }
 return{games:[...ids.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)),excluded};
}
export function featuresFor(game,games){
 const cutoff=Date.parse(game.date)-LAG;
 const history=team=>games.filter(g=>g.complete&&g.id!==game.id&&g.season===game.season&&Date.parse(g.date)<=cutoff&&(g.home===team||g.away===team)).sort((a,b)=>a.date.localeCompare(b.date)).slice(-20);
 const home=history(game.home),away=history(game.away);if(home.length<10||away.length<10)return null;
 const average=(list,team,win)=>list.reduce((sum,g)=>{const margin=g.home===team?g.homeScore-g.awayScore:g.awayScore-g.homeScore;return sum+(win?Number(margin>0):margin);},0)/list.length;
 return{x:[average(home,game.home,false)-average(away,game.away,false),average(home,game.home,true)-average(away,game.away,true)],inputAsOf:[home.at(-1).date,away.at(-1).date].sort().at(-1),oldestLatest:[home.at(-1).date,away.at(-1).date].sort()[0],sampleSizes:[home.length,away.length]};
}
export function research(games,holdoutSeason){
 const observations=games.filter(g=>g.complete).map(g=>{const f=featuresFor(g,games);return f?{date:g.date,x:f.x,y:Number(g.homeScore>g.awayScore),season:g.season}:null;}).filter(Boolean);
 const cut=observations.findIndex(r=>r.season===holdoutSeason);if(cut<80||observations.length-cut<20)throw Error('Incomplete NBA chronological evaluation');
 if(observations.slice(cut).some(r=>r.season!==holdoutSeason))throw Error('Holdout must be the latest completed season');
 const model=train(observations,cut),test=observations.slice(cut),base=observations.slice(0,cut).reduce((s,r)=>s+r.y,0)/cut;
 const calibration=Array.from({length:10},(_,i)=>{const items=test.map(r=>({p:predict(model,r.x),y:r.y})).filter(r=>Math.min(9,Math.floor(r.p*10))===i);return{from:i/10,to:(i+1)/10,count:items.length,meanProbability:items.length?items.reduce((s,r)=>s+r.p,0)/items.length:null,winFraction:items.length?items.reduce((s,r)=>s+r.y,0)/items.length:null};});
 return{model,baselineProbability:base,baselineAccuracy:test.filter(r=>Number(base>=.5)===r.y).length/test.length,trainFrom:observations[0].date,holdoutFrom:test[0].date,calibration,featureDefinitions:FEATURE_DEFINITIONS};
}
export function publicationEligibility(report,game,games,now=Date.now()){
 const reasons=[];const f=featuresFor(game,games);
 if(game.complete||Date.parse(game.date)<=now||Date.parse(game.date)>now+72*3600000)reasons.push('Outside upcoming 72-hour window');
 if(!f)reasons.push('Each team needs 10 current-season prior games');
 if(f&&now-Date.parse(f.oldestLatest)>10*86400000)reasons.push('Team history is older than 10 days');
 if(report.model.holdoutCount<500||report.model.metrics.baselineBrier-report.model.metrics.brier<.005)reasons.push('Research quality threshold not met');
 if(f&&f.x.some((v,i)=>v<report.model.ranges[i][0]||v>report.model.ranges[i][1]))reasons.push('Features outside training range');
 return{eligible:reasons.length===0,reasons,features:f};
}
export function matchingProviderEvent(game,events){
 return events.find(e=>e.league==='NBA'&&canonical(e.home)===game.home&&canonical(e.away)===game.away&&Date.parse(e.eventStart)===Date.parse(game.date));
}
