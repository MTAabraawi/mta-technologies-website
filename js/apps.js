(function(){
 const search=document.getElementById('app-search');
 const platform=document.getElementById('platform-filter');
 const category=document.getElementById('category-filter');
 const developer=document.getElementById('developer-filter');
 const grid=document.getElementById('apps-grid');
 const empty=document.getElementById('apps-empty');
 const count=document.getElementById('app-count');
 const api=(window.MTA_MARKETPLACE_API||'').replace(/\/$/,'');
 function makeCard(app){
  const card=document.createElement('article');card.className='app-card';
  card.dataset.name=app.app_name||'';card.dataset.description=app.description||'';
  card.dataset.platform=app.platform||'';card.dataset.category=app.category||'Other';card.dataset.developer=app.developer_name||'';
  const top=document.createElement('div');top.className='app-card-top';
  const icon=document.createElement('div');icon.className='app-icon app-icon-mta';icon.textContent=(app.app_name||'APP').slice(0,3).toUpperCase();top.append(icon);
  const status=document.createElement('span');status.className='app-status status-live';status.textContent=document.documentElement.lang==='en'?'Approved':'معتمد';top.append(status);card.append(top);
  const meta=document.createElement('div');meta.className='app-card-meta';meta.textContent=(app.developer_name||'Developer')+' · '+(app.platform||'');card.append(meta);
  const title=document.createElement('h3');title.textContent=app.app_name||'Application';card.append(title);
  const desc=document.createElement('p');desc.textContent=app.description||'';card.append(desc);
  const tags=document.createElement('div');tags.className='app-tags';
  for(const label of [app.platform,app.category]){const span=document.createElement('span');span.textContent=label||'';tags.append(span);}card.append(tags);
  const action=document.createElement('a');action.className='app-card-link';
  if(app.file_name){action.href=api+'/v1/download/'+encodeURIComponent(app.id);action.textContent=document.documentElement.lang==='en'?'Direct download':'تنزيل مباشر';}
  else if(app.source_url){action.href=app.source_url;action.target='_blank';action.rel='noopener noreferrer';action.textContent=document.documentElement.lang==='en'?'Official source':'المصدر الرسمي';}
  else {action.href='#';action.textContent=document.documentElement.lang==='en'?'Details coming soon':'التفاصيل قريباً';}
  card.append(action);return card;
 }
 async function loadApproved(){
  if(!api)return;
  try{
   const response=await fetch(api+'/v1/apps',{credentials:'include'});
   if(!response.ok)throw new Error('catalogue unavailable');
   const data=await response.json();
   const existing=new Set([...grid.querySelectorAll('.app-card')].map(x=>x.dataset.name.toLowerCase()));
   (data.apps||[]).forEach(app=>{if(!existing.has(String(app.app_name||'').toLowerCase()))grid.insertBefore(makeCard(app),empty);});
   filter();
  }catch(error){console.warn('MTA catalogue API unavailable; showing static listings.',error);}
 }
 function filter(){
  const q=(search.value||'').trim().toLowerCase();let visible=0;
  grid.querySelectorAll('.app-card').forEach(card=>{
   const text=[card.dataset.name,card.dataset.description,card.textContent].join(' ').toLowerCase();
   const ok=text.includes(q)&&(platform.value==='all'||card.dataset.platform===platform.value)&&(category.value==='all'||card.dataset.category===category.value)&&(developer.value==='all'||(developer.value==='MTA TECHNOLOGIES'?card.dataset.developer==='MTA TECHNOLOGIES':card.dataset.developer!=='MTA TECHNOLOGIES'));
   card.hidden=!ok;if(ok)visible++;
  });
  empty.hidden=visible!==0;
  count.textContent=visible+' '+(document.documentElement.lang==='ar'?'تطبيق معروض':'apps shown');
 }
 [search,platform,category,developer].forEach(el=>el.addEventListener('input',filter));
 [platform,category,developer].forEach(el=>el.addEventListener('change',filter));
 filter();loadApproved();
})();