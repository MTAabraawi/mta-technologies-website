(function(){
 const search=document.getElementById('app-search');
 const platform=document.getElementById('platform-filter');
 const category=document.getElementById('category-filter');
 const developer=document.getElementById('developer-filter');
 const cards=[...document.querySelectorAll('.app-card')];
 const empty=document.getElementById('apps-empty');
 const count=document.getElementById('app-count');
 function filter(){
  const q=(search.value||'').trim().toLowerCase();
  let visible=0;
  cards.forEach(card=>{
   const text=[card.dataset.name,card.dataset.description,card.textContent].join(' ').toLowerCase();
   const ok=text.includes(q)&&(platform.value==='all'||card.dataset.platform===platform.value)&&(category.value==='all'||card.dataset.category===category.value)&&(developer.value==='all'||card.dataset.developer===developer.value);
   card.hidden=!ok;if(ok)visible++;
  });
  empty.hidden=visible!==0;
  count.textContent=visible+' '+(document.documentElement.lang==='ar'?'تطبيق معروض':'apps shown');
 }
 [search,platform,category,developer].forEach(el=>el.addEventListener('input',filter));
 [platform,category,developer].forEach(el=>el.addEventListener('change',filter));
 filter();
})();