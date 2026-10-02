import {LEAGUES} from './sports.js';
const $=id=>document.getElementById(id);$('editor-league').innerHTML=LEAGUES.map(l=>`<option>${l}</option>`).join('');
$('editor-form').oninput=()=>{$('editor-output').hidden=true;$('editor-status').textContent='';};
$('editor-form').onsubmit=e=>{e.preventDefault();try{
 const home=$('editor-home').value.trim(),away=$('editor-away').value.trim(),selection=$('editor-selection').value.trim(),eventStart=new Date($('editor-start').value).toISOString(),inputAsOf=new Date($('editor-asof').value).toISOString();
 if(![home,away].includes(selection)||home===away)throw Error('Choose the exact name of one of the two different teams.');
 if(Date.parse(eventStart)<=Date.now()||Date.parse(inputAsOf)>Date.now())throw Error('Event must be in the future, and information timestamp must be in the past.');
 const record={kind:'editorial',league:$('editor-league').value,eventId:$('editor-event-id').value.trim(),home,away,event:`${away} at ${home}`,selection,eventStart,rationale:$('editor-rationale').value.trim(),settlementRule:$('editor-rule').value,dataSource:$('editor-source').value.trim(),dataPermissionReference:$('editor-permission').value.trim(),inputAsOf};
 $('editor-json').value=JSON.stringify(record,null,2);$('editor-output').hidden=false;$('editor-status').textContent='Prepared for review. This has not been published.';
 }catch(err){$('editor-status').textContent=err.message;}};
