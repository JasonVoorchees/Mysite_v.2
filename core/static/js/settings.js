(function(){
  const load = window.__loadUIPrefs || (() => ({}));
  const apply = window.__applyUIPrefs || (() => {});
  const PREF_KEY = 'ui_prefs_v1';

  const allowedThemes = ['dark','light','retro','sepia','contrast','system'];
  const allowedAccents = ['blue','violet','emerald','amber','rose'];
  const allowedFontFamilies = ['system','serif','rounded','mono'];
  const allowedLineHeights = ['normal','relaxed','compact'];
  const allowedDensity = ['cozy','compact','spacious'];
  const allowedSidebar = ['narrow','normal','wide'];
  const allowedCardStyles = ['elevated','flat','outline'];
  const allowedTopbar = ['floating','static','hidden'];
  const allowedPrivacy = ['public','friends','private'];
  const booleanPrefs = new Set(['reduceMotion','plainBackground','focusStrong','showHints','expandNews']);

  const defaults = {
    theme: 'dark',
    accent: 'blue',
    fontScale: 1,
    fontFamily: 'system',
    lineHeight: 'normal',
    density: 'cozy',
    sidebarSize: 'normal',
    cardStyle: 'elevated',
    reduceMotion: false,
    plainBackground: false,
    focusStrong: false,
    showHints: true,
    topbarMode: 'floating',
    expandNews: false,
    privacy: 'public',
  };

  const savedPrefs = load();
  let storedPrivacy = null;
  try {
    storedPrivacy = localStorage.getItem('profile_privacy_v1');
  } catch (e) {
    storedPrivacy = null;
  }

  const state = Object.assign({}, defaults, savedPrefs || {});
  if (typeof storedPrivacy === 'string' && allowedPrivacy.includes(storedPrivacy)) {
    state.privacy = storedPrivacy;
  }

  const fontRange = document.getElementById('fontRange');
  const fontLabel = document.getElementById('fontLabel');
  const prefControls = Array.from(document.querySelectorAll('[data-pref]'));
  const privacyControl = document.querySelector('.privacy-control');
  const privacyToggle = document.getElementById('privacyToggle');
  const privacyMenu = document.getElementById('privacyMenu');
  const privacyOptions = privacyMenu ? Array.from(privacyMenu.querySelectorAll('.privacy-option')) : [];
  const privacyMap = {
    public: 'Публичный',
    friends: 'Только друзьям',
    private: 'Закрытый',
  };

  function clampFont(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return 1;
    }
    return Math.min(1.6, Math.max(0.85, num));
  }

  function sanitizeState() {
    if (!allowedThemes.includes(state.theme)) state.theme = defaults.theme;
    if (!allowedAccents.includes(state.accent)) state.accent = defaults.accent;
    if (!allowedFontFamilies.includes(state.fontFamily)) state.fontFamily = defaults.fontFamily;
    if (!allowedLineHeights.includes(state.lineHeight)) state.lineHeight = defaults.lineHeight;
    if (!allowedDensity.includes(state.density)) state.density = defaults.density;
    if (!allowedSidebar.includes(state.sidebarSize)) state.sidebarSize = defaults.sidebarSize;
    if (!allowedCardStyles.includes(state.cardStyle)) state.cardStyle = defaults.cardStyle;
    if (!allowedTopbar.includes(state.topbarMode)) state.topbarMode = defaults.topbarMode;
    if (!allowedPrivacy.includes(state.privacy)) state.privacy = defaults.privacy;
    state.reduceMotion = !!state.reduceMotion;
    state.plainBackground = !!state.plainBackground;
    state.focusStrong = !!state.focusStrong;
    state.showHints = state.showHints !== false;
    state.expandNews = !!state.expandNews;
    state.fontScale = clampFont(state.fontScale);
  }

  sanitizeState();

  function ensureToast() {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    return toast;
  }

  function showToast(message) {
    const toast = ensureToast();
    toast.textContent = message || 'Сохранено';
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2500);
  }

  const UI_PREF_KEYS = [
    'theme',
    'fontScale',
    'accent',
    'fontFamily',
    'lineHeight',
    'density',
    'sidebarSize',
    'cardStyle',
    'reduceMotion',
    'plainBackground',
    'focusStrong',
    'showHints',
    'topbarMode',
    'expandNews',
  ];

  function buildUIPrefs() {
    const prefs = {};
    UI_PREF_KEYS.forEach((key) => {
      prefs[key] = state[key];
    });
    return prefs;
  }

  function persistState() {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(buildUIPrefs()));
      localStorage.setItem('profile_privacy_v1', state.privacy);
    } catch (e) {
      /* ignore */
    }
  }

  function save(toastMessage) {
    persistState();
    if (toastMessage === false) return;
    showToast(typeof toastMessage === 'string' ? toastMessage : 'Сохранено');
  }

  function saveSilent() {
    persistState();
  }

  function render() {
    const percent = Math.round(state.fontScale * 100);
    if (fontRange) {
      fontRange.value = String(percent);
    }
    if (fontLabel) {
      fontLabel.textContent = `${percent}%`;
    }
    prefControls.forEach((ctrl) => {
      const key = ctrl.dataset.pref;
      if (!(key in state)) return;
      if (ctrl.tagName === 'SELECT') {
        ctrl.value = String(state[key]);
        return;
      }
      if (ctrl.type === 'checkbox') {
        ctrl.checked = !!state[key];
        return;
      }
      if (ctrl.type === 'radio') {
        ctrl.checked = String(state[key]) === String(ctrl.value);
        return;
      }
      ctrl.value = state[key];
    });
    if (privacyToggle) {
      const label = privacyMap[state.privacy] || privacyMap.public;
      privacyToggle.dataset.value = state.privacy;
      privacyToggle.textContent = label;
      privacyToggle.setAttribute('aria-expanded', privacyControl && privacyControl.dataset.open === 'true' ? 'true' : 'false');
    }
    privacyOptions.forEach((btn) => {
      const active = btn.dataset.value === state.privacy;
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    apply(state);
  }

  function setPref(key, value, toastMessage) {
    let changed = false;
    if (key === 'fontScale') {
      const normalized = clampFont(value);
      if (Math.abs(normalized - state.fontScale) > 0.001) {
        state.fontScale = normalized;
        changed = true;
      }
    } else if (booleanPrefs.has(key)) {
      const boolVal = !!value;
      if (state[key] !== boolVal) {
        state[key] = boolVal;
        changed = true;
      }
    } else if (typeof value === 'string') {
      if (state[key] !== value) {
        state[key] = value;
        changed = true;
      }
    } else if (state[key] !== value) {
      state[key] = value;
      changed = true;
    }
    sanitizeState();
    if (!changed) {
      return;
    }
    render();
    save(toastMessage);
  }

  function setPrivacy(value) {
    const next = allowedPrivacy.includes(value) ? value : 'public';
    if (state.privacy === next) {
      return;
    }
    state.privacy = next;
    render();
    save(`Конфиденциальность: ${privacyMap[state.privacy] || privacyMap.public}`);
  }

  if (fontRange) {
    fontRange.addEventListener('input', () => {
      const normalized = clampFont(Number(fontRange.value) / 100);
      document.documentElement.style.setProperty('--fz-scale', String(normalized));
      if (fontLabel) {
        fontLabel.textContent = `${Math.round(normalized * 100)}%`;
      }
    });
    fontRange.addEventListener('change', () => {
      const normalized = clampFont(Number(fontRange.value) / 100);
      setPref('fontScale', normalized, `Размер сохранён: ${Math.round(normalized * 100)}%`);
    });
  }

  prefControls.forEach((ctrl) => {
    const key = ctrl.dataset.pref;
    const controlToast = ctrl.dataset.toast;
    if (ctrl.tagName === 'SELECT') {
      ctrl.addEventListener('change', () => setPref(key, ctrl.value, controlToast));
      return;
    }
    if (ctrl.type === 'checkbox') {
      ctrl.addEventListener('change', () => setPref(key, ctrl.checked, controlToast));
      return;
    }
    if (ctrl.type === 'radio') {
      ctrl.addEventListener('change', () => {
        if (ctrl.checked) {
          setPref(key, ctrl.value, ctrl.dataset.toast || controlToast);
        }
      });
    }
  });

  function focusActivePrivacy() {
    const active = privacyOptions.find((btn) => btn.dataset.value === state.privacy) || privacyOptions[0];
    if (active) {
      active.focus({ preventScroll: true });
    }
  }

  function openPrivacyMenu() {
    if (!privacyControl) return;
    privacyControl.dataset.open = 'true';
    if (privacyToggle) privacyToggle.setAttribute('aria-expanded', 'true');
    if (privacyMenu) privacyMenu.hidden = false;
    focusActivePrivacy();
  }

  function closePrivacyMenu() {
    if (!privacyControl) return;
    privacyControl.dataset.open = 'false';
    if (privacyToggle) privacyToggle.setAttribute('aria-expanded', 'false');
    if (privacyMenu) privacyMenu.hidden = true;
  }

  if (privacyToggle) {
    privacyToggle.addEventListener('click', () => {
      const isOpen = privacyControl && privacyControl.dataset.open === 'true';
      if (isOpen) closePrivacyMenu();
      else openPrivacyMenu();
    });
    privacyToggle.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown' || ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        openPrivacyMenu();
      }
    });
  }

  privacyOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      setPrivacy(btn.dataset.value || 'public');
      closePrivacyMenu();
      if (privacyToggle) privacyToggle.focus({ preventScroll: true });
    });
    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        closePrivacyMenu();
        if (privacyToggle) privacyToggle.focus({ preventScroll: true });
        return;
      }
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        const index = privacyOptions.indexOf(btn);
        const delta = ev.key === 'ArrowDown' ? 1 : -1;
        const next = privacyOptions[(index + delta + privacyOptions.length) % privacyOptions.length];
        if (next) next.focus({ preventScroll: true });
      }
      if (ev.key === 'Tab') {
        closePrivacyMenu();
      }
    });
  });

  document.addEventListener('click', (ev) => {
    if (!privacyControl || !privacyMenu || privacyMenu.hidden) return;
    if (ev.target instanceof Node && privacyControl.contains(ev.target)) return;
    closePrivacyMenu();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closePrivacyMenu();
  });

  render();
  window.__settingsSaveSilent = saveSilent;
})();

/* Сохраняем изменения при клике по пунктам сайдбара перед навигацией */
document.addEventListener('click', (ev) => {
  const target = ev.target.closest('.side-nav a, .side-nav button, .side-btn');
  if (!target) return;
  const saver = window.__settingsSaveSilent;
  if (typeof saver === 'function') {
    try { saver(); } catch (e) {}
  }
}, { capture: true });

window.addEventListener('beforeunload', () => {
  const saver = window.__settingsSaveSilent;
  if (typeof saver === 'function') {
    try { saver(); } catch (e) {}
  }
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
