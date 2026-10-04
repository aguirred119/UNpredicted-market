import {upcomingEditorialGames,localDateTime} from './editor-data.js';
import {LEAGUES} from './sports.js';
const $=id=>document.getElementById(id);$('editor-league').innerHTML=LEAGUES.map(l=>`<option>${l}</option>`).join('');
$('editor-form').oninput=()=>{$('editor-output').hidden=true;$('editor-status').textContent='';};
$('editor-form').onsubmit=e=>{e.preventDefault();try{
 const home=$('editor-home').value.trim(),away=$('editor-away').value.trim(),selection=$('editor-selection').value.trim(),eventStart=new Date($('editor-start').value).toISOString(),inputAsOf=new Date($('editor-asof').value).toISOString();
 if(![home,away].includes(selection)||home===away)throw Error('Choose the exact name of one of the two different teams.');
 if(Date.parse(eventStart)<=Date.now()||Date.parse(inputAsOf)>Date.now())throw Error('Event must be in the future, and information timestamp must be in the past.');
 const record={kind:'editorial',league:$('editor-league').value,eventId:$('editor-event-id').value.trim(),home,away,event:`${away} at ${home}`,selection,eventStart,rationale:$('editor-rationale').value.trim(),settlementRule:$('editor-rule').value,dataSource:$('editor-source').value.trim(),dataPermissionReference:$('editor-permission').value.trim(),inputAsOf};
 if(['run-line-including-extra-innings','point-spread-including-overtime'].includes(record.settlementRule)){record.handicap=Number($('editor-handicap').value);if((record.settlementRule==='run-line-including-extra-innings'?record.league!=='MLB':!['NFL','NBA','WNBA'].includes(record.league))||!$('editor-handicap').value||!Number.isFinite(record.handicap)||Number.isInteger(record.handicap)||!Number.isInteger(record.handicap*2)||Math.abs(record.handicap)>(record.league==='MLB'?20:100))throw Error('Choose a supported spread league and enter a half-unit handicap such as -4.5.');}
 $('editor-json').value=JSON.stringify(record,null,2);$('editor-output').hidden=false;$('editor-status').textContent='Prepared for review. This has not been published.';
 }catch(err){$('editor-status').textContent=err.message;}};

let schedule=null,scheduledGames=[],loadVersion=0;
$('editor-load').onclick=async()=>{
 const version=++loadVersion,league=$('editor-league').value;
 $('editor-load').disabled=true;$('editor-game').disabled=true;$('editor-output').hidden=true;
 $('editor-schedule-status').textContent='Checking the selected league schedule…';
 try{
  const response=await fetch('/api/games?league='+encodeURIComponent(league));if(!response.ok)throw Error('Schedule temporarily unavailable.');
  const feed=await response.json();if(version!==loadVersion)return;
  scheduledGames=upcomingEditorialGames(feed,league);schedule=feed;
  $('editor-game').replaceChildren(new Option('Choose a matchup',''),...scheduledGames.map(g=>new Option(g.away+' at '+g.home+' · '+new Date(g.eventStart).toLocaleString(),g.id)));
  $('editor-game').disabled=!scheduledGames.length;
  $('editor-schedule-status').textContent=scheduledGames.length?'Schedule retrieved '+new Date(feed.fetchedAt).toLocaleString()+'. Cached schedule, not live scores.':'No future games in this provider snapshot. No event has been invented.';
 }catch(error){if(version===loadVersion){schedule=null;scheduledGames=[];$('editor-schedule-status').textContent=error.message;}}
 finally{if(version===loadVersion)$('editor-load').disabled=false;}
};
$('editor-league').onchange=()=>{
 ++loadVersion;schedule=null;scheduledGames=[];$('editor-load').disabled=false;$('editor-game').disabled=true;
 $('editor-game').replaceChildren(new Option('Load the league schedule first',''));
 for(const id of ['editor-event-id','editor-home','editor-away','editor-selection','editor-start','editor-handicap','editor-rationale'])$(id).value='';
 $('editor-output').hidden=true;$('editor-schedule-status').textContent='Load the new league schedule before choosing a matchup.';
};
$('editor-game').onchange=()=>{
 try{
  const game=upcomingEditorialGames(schedule,$('editor-league').value).find(g=>g.id===$('editor-game').value);
  if(!game)throw Error('Choose a future matchup from the refreshed schedule.');
  $('editor-event-id').value=game.id;$('editor-home').value=game.home;$('editor-away').value=game.away;
  $('editor-start').value=localDateTime(game.eventStart);$('editor-asof').value=localDateTime(schedule.fetchedAt);
  $('editor-source').value='The Odds API schedule; original editorial opinion';
  $('editor-permission').value='Existing The Odds API terms; owner-provided editorial selection';
  $('editor-teams').replaceChildren(new Option(game.home,game.home),new Option(game.away,game.away));
  $('editor-selection').value='';$('editor-handicap').value='';$('editor-rationale').value='';$('editor-rule').value='match-winner-including-overtime';$('editor-output').hidden=true;
  $('editor-status').textContent='Event filled. Choose your team, settlement rule and reasoning. No selection is made for you.';
 }catch(error){$('editor-output').hidden=true;$('editor-status').textContent=error.message;}
};
$('editor-copy').onclick=async()=>{try{await navigator.clipboard.writeText($('editor-json').value);$('editor-status').textContent='Prepared record copied. It has not been published.';}catch{$('editor-status').textContent='Clipboard unavailable. Select and copy the prepared JSON below.';}};
