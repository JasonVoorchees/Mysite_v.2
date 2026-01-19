(function(){
  const KEY='ui_prefs_v1';
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)||'{}'); } catch(e){ return {}; } }
  function apply(p){
    const theme=p && p.theme;
    const body=document.body;
    body.classList.remove('theme-dark','theme-light','theme-retro','theme-sepia');
    if(theme==='dark') body.classList.add('theme-dark');
    else if(theme==='light') body.classList.add('theme-light');
    else if(theme==='retro') body.classList.add('theme-retro');
    else if(theme==='sepia') body.classList.add('theme-sepia');
    else if(theme==='system'){ const mq=window.matchMedia('(prefers-color-scheme: dark)'); body.classList.add(mq.matches?'theme-dark':'theme-light'); }
    else { body.classList.add('theme-dark'); }
    const scale=Number(p.fontScale||1);
    document.documentElement.style.setProperty('--fz-scale', String(scale>0?scale:1));
  }
  apply(load());
  window.__loadUIPrefs=load; window.__applyUIPrefs=apply;
})();

/* Live-обновление темы и масштаба на других открытых страницах */
window.addEventListener('storage', (ev) => {
  try{
    if(ev.key === 'ui_prefs_v1'){
      if (typeof __loadUIPrefs === 'function' && typeof __applyUIPrefs === 'function'){
        __applyUIPrefs(__loadUIPrefs());
      }
    }
  }catch(e){}
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden){
    try{
      if (typeof __loadUIPrefs === 'function' && typeof __applyUIPrefs === 'function'){
        __applyUIPrefs(__loadUIPrefs());
      }
    }catch(e){}
  }
});
