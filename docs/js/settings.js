(function(){
  const load = window.__loadUIPrefs || (()=>({}));
  const apply = window.__applyUIPrefs || (()=>{});
  const saved = load();
  const allowedThemes = ['light','dark','retro','sepia'];
  function resolveInitialTheme(){
    const raw = saved && saved.theme;
    if(allowedThemes.includes(raw)) return raw;
    if(raw === 'system'){
      try {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } catch (e) {
        return 'dark';
      }
    }
    return 'dark';
  }
  const state = Object.assign({ theme: resolveInitialTheme(), fontScale:1, privacy:'public' }, saved);
  state.theme = resolveInitialTheme();

  const fr=document.getElementById('fontRange');
  const fl=document.getElementById('fontLabel');
  const trs=document.querySelectorAll('input[name="theme"]');
  const privacyControl=document.querySelector('.privacy-control');
  const privacyToggle=document.getElementById('privacyToggle');
  const privacyMenu=document.getElementById('privacyMenu');
  const privacyOptions=privacyMenu ? Array.from(privacyMenu.querySelectorAll('.privacy-option')) : [];
  const privacyMap={public:'Публичный', friends:'Только друзьям', private:'Закрытый'};

  function ensureToast(){
  if(document.getElementById('appToast')) return document.getElementById('appToast');
  const t=document.createElement('div'); t.id='appToast'; t.className='toast'; document.body.appendChild(t); return t;
}
function showToast(msg){
  const t=ensureToast(); t.textContent=msg||'Сохранено'; t.classList.add('show');
  clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>t.classList.remove('show'), 2500);
}
function save(){ try{ localStorage.setItem('ui_prefs_v1', JSON.stringify({ theme:state.theme, fontScale:state.fontScale })); localStorage.setItem('profile_privacy_v1', state.privacy); showToast('Сохранено'); }catch(e){} }
  function render(){
    if(fl) fl.textContent=Math.round((state.fontScale||1)*100)+'%';
    if(fr) fr.value=Math.round((state.fontScale||1)*100);
    trs.forEach(x=>x.checked=(x.value===state.theme));
    if(privacyToggle){
      const label=privacyMap[state.privacy]||privacyMap.public;
      privacyToggle.dataset.value=state.privacy;
      privacyToggle.textContent=label;
    }
    privacyOptions.forEach(btn=>{
      const isActive=btn.dataset.value===state.privacy;
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    apply(state);
  }

  if(fr){
    fr.addEventListener('input', ()=>{
      state.fontScale = Math.max(0.6, Math.min(2, Number(fr.value)/100));
      // live update CSS var for smooth effect
      document.documentElement.style.setProperty('--fz-scale', String(state.fontScale));
      if(fl) fl.textContent = Math.round(state.fontScale*100)+'%';
    });
    fr.addEventListener('change', ()=>{ save('Размер сохранён: '+Math.round(state.fontScale*100)+'%'); });
  }

  const themeLabels = {light:'Светлая', dark:'Тёмная', retro:'Ретро', sepia:'Сепия'};

  trs.forEach(x=>x.addEventListener('change',()=>{
    if(x.checked){ state.theme = x.value; render(); save('Тема: '+(themeLabels[state.theme]||state.theme)); }
  }));

  function closePrivacyMenu(){
    if(!privacyControl) return;
    privacyControl.dataset.open='false';
    if(privacyToggle){ privacyToggle.setAttribute('aria-expanded','false'); }
    if(privacyMenu){ privacyMenu.hidden=true; }
  }

  function focusActivePrivacy(){
    const active=privacyOptions.find(btn=>btn.dataset.value===state.privacy) || privacyOptions[0];
    if(active){ active.focus({preventScroll:true}); }
  }

  function openPrivacyMenu(){
    if(!privacyControl) return;
    privacyControl.dataset.open='true';
    if(privacyToggle){ privacyToggle.setAttribute('aria-expanded','true'); }
    if(privacyMenu){ privacyMenu.hidden=false; }
    focusActivePrivacy();
  }

  if(privacyToggle){
    privacyToggle.addEventListener('click', ()=>{
      const isOpen=privacyControl && privacyControl.dataset.open==='true';
      if(isOpen){ closePrivacyMenu(); }
      else { openPrivacyMenu(); }
    });
    privacyToggle.addEventListener('keydown',(ev)=>{
      if(ev.key==='ArrowDown' || ev.key==='Enter' || ev.key===' '){
        ev.preventDefault();
        openPrivacyMenu();
      }
    });
  }

  privacyOptions.forEach(btn=>{
    btn.addEventListener('click',()=>{
      state.privacy = btn.dataset.value || 'public';
      render();
      save('Конфиденциальность: '+(privacyMap[state.privacy]||state.privacy));
      closePrivacyMenu();
      if(privacyToggle) privacyToggle.focus({preventScroll:true});
    });
    btn.addEventListener('keydown',(ev)=>{
      if(ev.key==='Escape'){ ev.stopPropagation(); closePrivacyMenu(); if(privacyToggle) privacyToggle.focus({preventScroll:true}); return; }
      if(ev.key==='ArrowDown' || ev.key==='ArrowUp'){
        ev.preventDefault();
        const idx=privacyOptions.indexOf(btn);
        const delta=ev.key==='ArrowDown'?1:-1;
        const next=privacyOptions[(idx+delta+privacyOptions.length)%privacyOptions.length];
        if(next) next.focus({preventScroll:true});
      }
      if(ev.key==='Tab'){
        closePrivacyMenu();
      }
    });
  });

  document.addEventListener('click',(ev)=>{
    if(!privacyControl || !privacyMenu || privacyMenu.hidden) return;
    if(ev.target instanceof Node && privacyControl.contains(ev.target)) return;
    closePrivacyMenu();
  });

  document.addEventListener('keydown',(ev)=>{
    if(ev.key==='Escape'){ closePrivacyMenu(); }
  });

  // initial apply
  render();
})();

/* Сохраняем изменения при клике по пунктам сайдбара перед навигацией */
document.addEventListener('click', (ev)=>{
  const target = ev.target.closest('.side-nav a, .side-nav button, .side-btn');
  if (!target) return;
  try { saveSilent(); } catch(e){}
}, {capture:true});

window.addEventListener('beforeunload', ()=>{
  try { saveSilent(); } catch(e){}
});


/* settings-only: hide login button when authed */
function __settingsIsAuthed(){
  try {
    const byProfile = !!localStorage.getItem('authProfileKey');
    const ao = localStorage.getItem('auth_ok');
    const byFlag = (ao === '1' || ao === 'true');
    return !!(byProfile || byFlag);
  } catch(e){ return false; }
}
function __settingsToggleAuthBtn(){
  const btn = document.querySelector('.login-btn');
  if(!btn) return;
  if(__settingsIsAuthed()){ btn.style.display = 'none'; }
  else { btn.style.display = ''; }
}
function __settingsToggleProtectedNav(){
  const isAuthed = __settingsIsAuthed();
  const profileLink = document.querySelector('.side-nav a[href="profile.html"]');
  const archiveBtn = document.querySelector('.side-nav button[onclick*="archive.html"]');
  if(profileLink){ profileLink.style.display = isAuthed ? '' : 'none'; }
  if(archiveBtn){ archiveBtn.style.display = isAuthed ? '' : 'none'; }
}
function __settingsRefreshAuthUI(){
  __settingsToggleAuthBtn();
  __settingsToggleProtectedNav();
}
document.addEventListener('DOMContentLoaded', __settingsRefreshAuthUI);
window.addEventListener('storage', (e)=>{
  if(e.key==='auth_ok' || e.key==='authProfileKey') __settingsRefreshAuthUI();
});
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) __settingsRefreshAuthUI(); });
