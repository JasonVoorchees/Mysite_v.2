(function(){
  const KEY='ui_prefs_v1';
  const DEFAULTS={
    theme:'dark',
    accent:'blue',
    fontScale:1,
    fontFamily:'system',
    lineHeight:'normal',
    density:'cozy',
    sidebarSize:'normal',
    cardStyle:'elevated',
    backgroundStyle:'gradient',
    bodyWeight:'regular',
    headingFont:'sans',
    headingStyle:'minimal',
    headingColor:'auto',
    textTone:'balanced',
    reduceMotion:false,
    plainBackground:false,
    focusStrong:false,
    showHints:true,
    topbarMode:'floating',
    expandNews:false,
  };
  const themeClasses=['theme-dark','theme-light','theme-retro','theme-sepia','theme-contrast','theme-midnight','theme-aurora','theme-pastel'];
  const accentClasses=['accent-blue','accent-violet','accent-emerald','accent-amber','accent-rose','accent-sky','accent-mint','accent-copper'];
  const fontClasses={system:'font-system',serif:'font-serif',rounded:'font-rounded',mono:'font-mono'};
  const fontClassValues=Object.values(fontClasses);
  const lineClasses={normal:'line-normal',relaxed:'line-relaxed',compact:'line-compact'};
  const lineClassValues=Object.values(lineClasses);
  const densityClasses={cozy:'density-cozy',compact:'density-compact',spacious:'density-spacious'};
  const densityValues=Object.values(densityClasses);
  const sidebarClasses={narrow:'sidebar-narrow',normal:'sidebar-normal',wide:'sidebar-wide'};
  const sidebarValues=Object.values(sidebarClasses);
  const cardClasses={elevated:'card-elevated',flat:'card-flat',outline:'card-outline'};
  const cardValues=Object.values(cardClasses);
  const topbarClasses={floating:'topbar-floating',static:'topbar-static',hidden:'topbar-hidden'};
  const topbarValues=Object.values(topbarClasses);
  const backgroundClasses={gradient:'background-style-gradient',mesh:'background-style-mesh',soft:'background-style-soft'};
  const backgroundValues=Object.values(backgroundClasses);
  const bodyWeightClasses={regular:'text-weight-regular',medium:'text-weight-medium',strong:'text-weight-strong'};
  const bodyWeightValues=Object.values(bodyWeightClasses);
  const headingFontClasses={sans:'heading-font-sans',serif:'heading-font-serif',display:'heading-font-display'};
  const headingFontValues=Object.values(headingFontClasses);
  const headingStyleClasses={minimal:'heading-style-minimal',soft:'heading-style-soft',caps:'heading-style-caps'};
  const headingStyleValues=Object.values(headingStyleClasses);
  const headingColorClasses={auto:null,accent:'heading-color-accent',muted:'heading-color-muted'};
  const headingColorValues=Object.values(headingColorClasses).filter(Boolean);
  const textToneClasses={balanced:'text-tone-balanced',soft:'text-tone-soft',bold:'text-tone-bold'};
  const textToneValues=Object.values(textToneClasses);

  function load(){
    try {
      const raw=JSON.parse(localStorage.getItem(KEY)||'{}');
      return raw && typeof raw==='object' ? raw : {};
    } catch(e){
      return {};
    }
  }

  function pick(obj,key,fallback){
    if(obj && Object.prototype.hasOwnProperty.call(obj,key)) return obj[key];
    return fallback;
  }

  function apply(p){
    const body=document.body;
    if(!body) return;
    const prefs=Object.assign({}, DEFAULTS, p||{});

    // Theme management
    body.classList.remove(...themeClasses);
    let theme=typeof prefs.theme==='string' ? prefs.theme : DEFAULTS.theme;
    let appliedTheme=theme;
    if(theme==='system'){
      let mq;
      try{ mq=window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)'); }catch(e){ mq=null; }
      appliedTheme = mq && mq.matches ? 'dark' : 'light';
      body.dataset.systemTheme = appliedTheme;
    } else {
      delete body.dataset.systemTheme;
    }
    if(theme==='system'){ body.classList.add('theme-system'); }
    else { body.classList.remove('theme-system'); }
    if(appliedTheme && themeClasses.includes('theme-'+appliedTheme)){
      body.classList.add('theme-'+appliedTheme);
    } else {
      body.classList.add('theme-dark');
    }

    // Accent colors
    body.classList.remove(...accentClasses);
    const accent = typeof prefs.accent==='string' ? prefs.accent : DEFAULTS.accent;
    const accentClass='accent-'+accent;
    if(accentClasses.includes(accentClass)){ body.classList.add(accentClass); }
    else { body.classList.add('accent-'+DEFAULTS.accent); }

    // Typography
    body.classList.remove(...fontClassValues);
    const fontClass=fontClasses[prefs.fontFamily] || fontClasses[DEFAULTS.fontFamily];
    body.classList.add(fontClass);

    body.classList.remove(...lineClassValues);
    const lineClass=lineClasses[prefs.lineHeight] || lineClasses[DEFAULTS.lineHeight];
    body.classList.add(lineClass);

    // Density & layout
    body.classList.remove(...densityValues);
    const densityClass=densityClasses[prefs.density] || densityClasses[DEFAULTS.density];
    body.classList.add(densityClass);

    body.classList.remove(...sidebarValues);
    const sidebarClass=sidebarClasses[prefs.sidebarSize] || sidebarClasses[DEFAULTS.sidebarSize];
    body.classList.add(sidebarClass);

    body.classList.remove(...cardValues);
    const cardClass=cardClasses[prefs.cardStyle] || cardClasses[DEFAULTS.cardStyle];
    body.classList.add(cardClass);

    body.classList.remove(...topbarValues);
    const topbarClass=topbarClasses[prefs.topbarMode] || topbarClasses[DEFAULTS.topbarMode];
    body.classList.add(topbarClass);

    body.classList.remove(...backgroundValues);
    const backgroundClass=backgroundClasses[prefs.backgroundStyle] || backgroundClasses[DEFAULTS.backgroundStyle];
    body.classList.add(backgroundClass);

    body.classList.remove(...bodyWeightValues);
    const bodyWeightClass=bodyWeightClasses[prefs.bodyWeight] || bodyWeightClasses[DEFAULTS.bodyWeight];
    if(bodyWeightClass){ body.classList.add(bodyWeightClass); }

    body.classList.remove(...headingFontValues);
    const headingFontClass=headingFontClasses[prefs.headingFont] || headingFontClasses[DEFAULTS.headingFont];
    if(headingFontClass){ body.classList.add(headingFontClass); }

    body.classList.remove(...headingStyleValues);
    const headingStyleClass=headingStyleClasses[prefs.headingStyle] || headingStyleClasses[DEFAULTS.headingStyle];
    if(headingStyleClass){ body.classList.add(headingStyleClass); }

    body.classList.remove(...headingColorValues);
    const headingColorClass=headingColorClasses[prefs.headingColor] || headingColorClasses[DEFAULTS.headingColor];
    if(headingColorClass){ body.classList.add(headingColorClass); }

    body.classList.remove(...textToneValues);
    const toneClass=textToneClasses[prefs.textTone] || textToneClasses[DEFAULTS.textTone];
    if(toneClass){ body.classList.add(toneClass); }

    // Toggles
    body.classList.toggle('reduce-motion', !!prefs.reduceMotion);
    body.classList.toggle('plain-background', !!prefs.plainBackground);
    body.classList.toggle('focus-strong', !!prefs.focusStrong);
    body.classList.toggle('hide-hints', prefs.showHints === false);
    body.classList.toggle('news-auto-expand', !!prefs.expandNews);

    const scale=Number(pick(prefs,'fontScale',DEFAULTS.fontScale));
    document.documentElement.style.setProperty('--fz-scale', String(scale>0?scale:1));
  }

  apply(load());
  window.__loadUIPrefs=load; window.__applyUIPrefs=apply;

  const systemMedia = (function(){
    try{ return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)'); }
    catch(e){ return null; }
  })();

  function refreshSystemTheme(){
    try {
      const prefs=load();
      if((prefs && prefs.theme) === 'system'){
        apply(prefs);
      }
    } catch(e){}
  }

  if(systemMedia){
    if(typeof systemMedia.addEventListener==='function'){
      systemMedia.addEventListener('change', refreshSystemTheme);
    } else if(typeof systemMedia.addListener==='function'){
      systemMedia.addListener(refreshSystemTheme);
    }
  }
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
