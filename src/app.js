(()=>{
 // Review frames exercise page layouts; they should not register workers or install prompts.
 if(window.self!==window.top)return;
 const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 document.body.classList.toggle('installed-app',standalone);
 const button=document.querySelector('#install-app'),state=document.querySelector('#install-state');let prompt=null,added=standalone;
 if(standalone){
  if(state)state.textContent='You’re already using the home-screen app.';
  const nav=document.createElement('nav');nav.className='app-tabs';nav.setAttribute('aria-label','App navigation');
  const path=location.pathname;
  for(const [label,href,active] of [['Games','/',path==='/'||path==='/index.html'],['Lab','/analytics.html',path==='/analytics.html'||/\/(nba|nfl)-research\.html$/.test(path)],['Record','/track-record.html',path==='/track-record.html']]){
   const a=document.createElement('a');a.textContent=label;a.href=href;if(active)a.setAttribute('aria-current','page');nav.append(a);
  }
  document.body.append(nav);
 }
 window.addEventListener('beforeinstallprompt',event=>{
  if(standalone)return;event.preventDefault();prompt=event;
  if(button){button.hidden=false;if(state)state.textContent='Your browser supports adding TONATI LAB. Use the button to continue.';}
 });
 if(button)button.addEventListener('click',async()=>{
  if(!prompt)return;const request=prompt;prompt=null;button.disabled=true;
  try{await request.prompt();const result=await request.userChoice;if(!added&&state)state.textContent=result.outcome==='accepted'?'Installation requested. Complete any browser confirmation, then open TONATI LAB from your home screen or app launcher.':'Not added. You can add it later from your browser’s menu.';}
  catch{if(state)state.textContent='The install request could not be completed. Use your browser’s menu and the steps below.';}
  finally{button.hidden=true;button.disabled=false;}
 });
 window.addEventListener('appinstalled',()=>{added=true;prompt=null;if(button)button.hidden=true;if(state)state.textContent='TONATI LAB was added. Open it from your home screen or app launcher.';});
 const note=document.createElement('p');note.className='app-connection';note.setAttribute('role','status');note.hidden=true;
 const main=document.querySelector('main');if(main)main.before(note);
 const offline=()=>{note.hidden=false;note.textContent='Offline · updates unavailable. Any displayed data is a previously fetched snapshot. Reconnect to refresh the schedule.';};
 if(navigator.onLine===false)offline();window.addEventListener('offline',offline);
 window.addEventListener('online',()=>{note.hidden=false;note.textContent='Connection restored. Refresh the schedule to request an updated snapshot.';});
 if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(()=>{});
})();
