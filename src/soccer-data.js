// Explicit source/provider identity aliases. No fuzzy name matching.
export const SOCCER_LEAGUES={
 'Premier League':{code:'en.1',sourceName:'English Premier League',timeZone:'Europe/London',expectedTeams:20},
 'La Liga':{code:'es.1',sourceName:'Spain Primera División',timeZone:'Europe/Madrid',expectedTeams:20},
 'Serie A':{code:'it.1',sourceName:'Italian Serie A',timeZone:'Europe/Rome',expectedTeams:20},
 'Bundesliga':{code:'de.1',sourceName:'Deutsche Bundesliga',timeZone:'Europe/Berlin',expectedTeams:18},
 'Ligue 1':{code:'fr.1',sourceName:'French Ligue 1',timeZone:'Europe/Paris',expectedTeams:18}
};
const aliases={
 'Premier League':{'AFC Bournemouth':'Bournemouth','Arsenal FC':'Arsenal','Aston Villa FC':'Aston Villa','Brentford FC':'Brentford','Brighton & Hove Albion FC':'Brighton and Hove Albion','Chelsea FC':'Chelsea','Coventry City FC':'Coventry City','Crystal Palace FC':'Crystal Palace','Everton FC':'Everton','Fulham FC':'Fulham','Hull City AFC':'Hull City','Ipswich Town FC':'Ipswich Town','Leeds United FC':'Leeds United','Liverpool FC':'Liverpool','Manchester City FC':'Manchester City','Manchester United FC':'Manchester United','Newcastle United FC':'Newcastle United','Nottingham Forest FC':'Nottingham Forest','Sunderland AFC':'Sunderland','Tottenham Hotspur FC':'Tottenham Hotspur'},
 'La Liga':{'Athletic Club':'Athletic Bilbao','Club Atlético de Madrid':'Atlético Madrid','Deportivo Alavés':'Alavés','FC Barcelona':'Barcelona','Getafe CF':'Getafe','Levante UD':'Levante','Málaga CF':'Málaga','RC Celta de Vigo':'Celta Vigo','RC Deportivo La Coruña':'Deportivo La Coruña','RCD Espanyol de Barcelona':'Espanyol','Rayo Vallecano de Madrid':'Rayo Vallecano','Real Betis Balompié':'Real Betis','Real Madrid CF':'Real Madrid','Real Sociedad de Fútbol':'Real Sociedad','Sevilla FC':'Sevilla','Valencia CF':'Valencia','Villarreal CF':'Villarreal'},
 'Serie A':{'AC Monza':'Monza','ACF Fiorentina':'Fiorentina','Bologna FC 1909':'Bologna','Cagliari Calcio':'Cagliari','Como 1907':'Como','FC Internazionale Milano':'Inter Milan','Frosinone Calcio':'Frosinone','Genoa CFC':'Genoa','Juventus FC':'Juventus','Parma Calcio 1913':'Parma','SS Lazio':'Lazio','SSC Napoli':'Napoli','Torino FC':'Torino','US Lecce':'Lecce','US Sassuolo Calcio':'Sassuolo','Udinese Calcio':'Udinese','Venezia FC':'Venezia'},
 'Bundesliga':{'1. FC Union Berlin':'Union Berlin','1. FSV Mainz 05':'FSV Mainz 05','Bayer 04 Leverkusen':'Bayer Leverkusen','Borussia Mönchengladbach':'Borussia Monchengladbach','FC Augsburg':'Augsburg','FC Bayern München':'Bayern Munich','SC Paderborn 07':'SC Paderborn','SV 07 Elversberg':'Elversberg','SV Werder Bremen':'Werder Bremen','TSG 1899 Hoffenheim':'TSG Hoffenheim'},
 'Ligue 1':{'AJ Auxerre':'Auxerre','AS Monaco FC':'AS Monaco','Angers SCO':'Angers','ES Troyes AC':'Troyes','FC Lorient':'Lorient','Le Havre AC':'Le Havre','Lille OSC':'Lille','OGC Nice':'Nice','Olympique Lyonnais':'Lyon','Olympique de Marseille':'Marseille','Paris Saint-Germain FC':'Paris Saint Germain','RC Strasbourg Alsace':'Strasbourg','Racing Club de Lens':'RC Lens','Stade Brestois 29':'Brest','Stade Rennais FC 1901':'Rennes','Toulouse FC':'Toulouse'}
};
export function canonicalSoccer(name,league){return aliases[league]?.[name]||name;}
export function competitionDay(time,league){
 if(!SOCCER_LEAGUES[league]||!Number.isFinite(Date.parse(time)))return null;
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:SOCCER_LEAGUES[league].timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(time));
 const values=Object.fromEntries(parts.map(p=>[p.type,p.value]));return`${values.year}-${values.month}-${values.day}`;
}
export function soccerSeason(now=Date.now()){const d=new Date(now),y=d.getUTCFullYear()-(d.getUTCMonth()<6?1:0);return`${y}-${String(y+1).slice(-2)}`;}
export function sourceHealth(report,now=Date.now()){
 const fetched=Date.parse(report?.generatedAt),through=Date.parse((report?.dataThrough||'')+'T23:59:59.999Z');
 return{snapshotOverdue:!Number.isFinite(fetched)||fetched>now+60000||now-fetched>36*3600000,resultsDelayed:!Number.isFinite(through)||now-through>7*86400000,daysBehind:Number.isFinite(through)?Math.max(0,Math.floor((now-Date.parse(report.dataThrough+'T00:00:00Z'))/86400000)):null};
}

// Input preflight only. Passing does not produce or authorize a model forecast.
export function soccerInputReadiness(report,event,now=Date.now()){
 const reasons=[],health=sourceHealth(report,now),start=Date.parse(event?.eventStart),schedule=Date.parse(report?.scheduleAsOf);
 if(!SOCCER_LEAGUES[report?.league]||report.season!==soccerSeason(now))reasons.push('Current-season league data is required.');
 if(health.resultsDelayed)reasons.push('Available results are more than seven days behind today or unavailable.');
 if(health.snapshotOverdue)reasons.push('The results snapshot needs a successful refresh.');
 if(!Number.isFinite(schedule)||schedule>now||now-schedule>2*3600000)reasons.push('The event schedule needs a refresh within two hours.');
 if(!Number.isFinite(start)||start<=now||start-now>14*86400000)reasons.push('A future event within fourteen days is required.');
 const matches=(report?.upcoming||[]).filter(g=>g.eventId===event?.eventId&&g.home===event?.home&&g.away===event?.away&&Date.parse(g.eventStart)===start);
 if(!event?.eventId||matches.length!==1)reasons.push('A unique provider-matched event is required.');
 for(const [label,name] of [['Home',event?.home],['Away',event?.away]]){
  const teams=(report?.teams||[]).filter(t=>t.team===name),team=teams.length===1?teams[0]:null;
  if(!team||!Number.isInteger(team.count)||team.count<5||team.count>10)reasons.push(`${label} team needs five to ten same-season prior games.`);
  else if(!Number.isFinite(Date.parse(team.inputAsOf))||Date.parse(team.inputAsOf)>now-48*3600000||![team.averageMargin,team.averageScored,team.averageAllowed].every(Number.isFinite))reasons.push(`${label} team inputs need valid statistics and the 48-hour availability lag.`);
 }
 return{status:reasons.length?'blocked':'inputs-pass',reasons};
}
