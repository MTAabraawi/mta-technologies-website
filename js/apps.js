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
  const platforms=Array.isArray(app.platforms)?app.platforms:String(app.platform||'').split(',').map(x=>x.trim()).filter(Boolean);
  const description=document.documentElement.lang==='ar'?(app.description_ar||app.description||''):(app.description_en||app.description||'');
  card.dataset.name=app.app_name||'';card.dataset.description=description;
  card.dataset.platform=platforms.join(',');card.dataset.category=app.category||'Other';card.dataset.developer=app.developer_name||'';
  const top=document.createElement('div');top.className='app-card-top';
  const icon=document.createElement('div');icon.className='app-icon app-icon-mta';icon.textContent=(app.app_name||'APP').replace(/[^A-Za-z0-9]/g,'').slice(0,3).toUpperCase()||'APP';top.append(icon);
  const status=document.createElement('span');status.className='app-status status-live';
  status.textContent=app.file_name?(document.documentElement.lang==='en'?'MTA hosted':'مستضاف لدى MTA'):(document.documentElement.lang==='en'?'Official external source':'مصدر رسمي خارجي');top.append(status);card.append(top);
  const meta=document.createElement('div');meta.className='app-card-meta';meta.textContent=(app.developer_name||'Developer')+' · '+platforms.join(', ');card.append(meta);
  const title=document.createElement('h3');title.textContent=app.app_name||'Application';card.append(title);
  const desc=document.createElement('p');desc.textContent=description;card.append(desc);
  if(app.license_name){const license=document.createElement('small');license.className='app-license';license.textContent=(document.documentElement.lang==='en'?'License: ':'الترخيص: ')+app.license_name;card.append(license);}
  const tags=document.createElement('div');tags.className='app-tags';
  for(const label of [...platforms,app.category].filter(Boolean)){const span=document.createElement('span');span.textContent=label;tags.append(span);}card.append(tags);
  const action=document.createElement('a');action.className='app-card-link';
  if(app.file_name&&api){action.href=api+'/v1/download/'+encodeURIComponent(app.id);action.textContent=document.documentElement.lang==='en'?'Direct download':'تنزيل مباشر';}
  else if(app.source_url){action.href=app.source_url;action.target='_blank';action.rel='noopener noreferrer';action.textContent=document.documentElement.lang==='en'?'Official source / store':'المصدر الرسمي / المتجر';}
  else {action.href='#';action.textContent=document.documentElement.lang==='en'?'Details coming soon':'التفاصيل قريباً';}
  card.append(action);return card;
 }
 function addApps(items){
  const existing=new Set([...grid.querySelectorAll('.app-card')].map(x=>x.dataset.name.toLowerCase()));
  (items||[]).forEach(app=>{const key=String(app.app_name||'').toLowerCase();if(key&&!existing.has(key)){grid.insertBefore(makeCard(app),empty);existing.add(key);}});
  filter();
 }
 async function loadCurated(){
  try{const r=await fetch('data/curated-apps.json',{cache:'no-cache'});if(!r.ok)throw new Error('curated catalogue unavailable');addApps(await r.json());}
  catch(error){console.warn('Curated catalogue unavailable.',error);}
 }
 async function loadApproved(){
  if(!api)return;
  try{const r=await fetch(api+'/v1/apps',{credentials:'include'});if(!r.ok)throw new Error('catalogue unavailable');const data=await r.json();addApps(data.apps||[]);}
  catch(error){console.warn('MTA approved catalogue API unavailable; showing verified external listings.',error);}
 }
 function filter(){
  const q=(search.value||'').trim().toLowerCase();let visible=0;
  grid.querySelectorAll('.app-card').forEach(card=>{
   const text=[card.dataset.name,card.dataset.description,card.textContent].join(' ').toLowerCase();
   const supported=card.dataset.platform.split(',').map(x=>x.trim());
   const ok=text.includes(q)&&(platform.value==='all'||supported.includes(platform.value))&&(category.value==='all'||card.dataset.category===category.value)&&(developer.value==='all'||(developer.value==='MTA TECHNOLOGIES'?card.dataset.developer==='MTA TECHNOLOGIES':card.dataset.developer!=='MTA TECHNOLOGIES'));
   card.hidden=!ok;if(ok)visible++;
  });
  empty.hidden=visible!==0;
  count.textContent=visible+' '+(document.documentElement.lang==='ar'?'تطبيق معروض':'apps shown');
 }
 [search,platform,category,developer].forEach(el=>el.addEventListener('input',filter));
 [platform,category,developer].forEach(el=>el.addEventListener('change',filter));
 filter();loadCurated();loadApproved();
})();