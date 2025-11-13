const modal = document.getElementById("authModal");
const openBtns = Array.from(document.querySelectorAll('.login-btn,[data-open-auth]'));
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

openBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    if (modal) modal.style.display = "flex";
  });
});
if (modal){
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.getAttribute("data-tab");
    tabContents.forEach(tc => {
      tc.classList.remove("active");
      if (tc.id === target) tc.classList.add("active");
    });
  });
});


// Проверка совпадения паролей
const pass1 = document.getElementById("regPass");
const pass2 = document.getElementById("regPass2");
const passError = document.getElementById("passError");

[pass1, pass2].forEach(input => {
  input.addEventListener("input", () => {
    if (pass1.value && pass2.value && pass1.value !== pass2.value) {
      passError.textContent = "Пароли не совпадают";
    } else {
      passError.textContent = "";
    }
  });
});

// Проверка уникальности логина (симуляция)
const regLogin = document.getElementById("regLogin");
const loginError = document.getElementById("loginError");
const loginAuthError = document.getElementById('loginAuthError');
const loginUserInput = document.getElementById('loginUser');
const loginPassInput = document.getElementById('loginPass');

function readStoredAccounts(){
  try {
    return JSON.parse(localStorage.getItem('accounts_v1') || '{}') || {};
  } catch (e) {
    return {};
  }
}
function isLoginTaken(value){
  if (!value) return false;
  const reserved = ["admin","test"];
  const lower = value.trim().toLowerCase();
  if (!lower) return false;
  if (reserved.includes(lower)) return true;
  const acc = readStoredAccounts();
  return Object.prototype.hasOwnProperty.call(acc, lower);
}

if (regLogin) {
  regLogin.addEventListener("input", () => {
    if (isLoginTaken(regLogin.value)) {
      loginError.textContent = "Логин уже занят";
    } else {
      loginError.textContent = "";
    }
  });
}


const aboutBtn = document.getElementById("aboutBtn");
const aboutContent = document.getElementById("aboutContent");

if (aboutBtn && aboutContent){
  aboutBtn.addEventListener("click", () => {
    aboutContent.classList.toggle("active");
  });
}
// === enhanced validation & otp flow ===
function showErrorBelow(input, msg){
  input.classList.add('input-error');
  let anchor = input;
  if (input.parentElement && input.parentElement.classList.contains('input-group')) anchor = input.parentElement;
  let err = anchor.nextElementSibling;
  if (!err || !err.classList || !err.classList.contains('field-error')){
    err = document.createElement('small');
    err.className = 'field-error';
    anchor.after(err);
  }
  err.textContent = msg || 'необходимо заполнить';
}
function clearErrorBelow(input){
  input.classList.remove('input-error');
  let anchor = input;
  if (input.parentElement && input.parentElement.classList.contains('input-group')) anchor = input.parentElement;
  const err = anchor.nextElementSibling;
  if (err && err.classList && err.classList.contains('field-error')) err.textContent = '';
}
function validateRequired(arr){
  let ok = true;
  arr.forEach(inp => { if (!inp.value.trim()){ showErrorBelow(inp); ok = false; } });
  return ok;
}
function wrapGroup(input){
  if (input.parentElement && input.parentElement.classList.contains('input-group')) return input.parentElement;
  const wrap = document.createElement('div');
  wrap.className = 'input-group';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);
  return wrap;
}
function addEye(input){
  const wrap = wrapGroup(input);
  if (wrap.querySelector('.toggle-pass')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'toggle-pass';
  btn.setAttribute('aria-label','Показать/скрыть пароль');
  btn.textContent = '👁';
  btn.addEventListener('click', () => {
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.textContent = isPass ? '🙈' : '👁';
    input.focus();
  });
  wrap.appendChild(btn);
}
document.querySelectorAll('#login input[type="password"], #register input[type="password"]').forEach(addEye);
document.querySelectorAll('#login input, #register input').forEach(inp => {
  inp.addEventListener('input', () => { if (inp.value.trim()) clearErrorBelow(inp); });
});

const regTab = document.getElementById('register');
const sendCodeBtn = regTab ? regTab.querySelector('.btn') : null;
const codeSection = document.getElementById('codeSection');
const codeInputs = codeSection ? Array.from(codeSection.querySelectorAll('.code-input')) : [];
const codeError = document.getElementById('codeError');

if (sendCodeBtn){
  sendCodeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const base = [
      document.getElementById('regLogin'),
      document.getElementById('regPass'),
      document.getElementById('regPass2'),
      regTab.querySelector('input[placeholder="Телефон или Email"]')
    ].filter(Boolean);
    const ok = validateRequired(base);
    const p1 = document.getElementById('regPass');
    const p2 = document.getElementById('regPass2');
    if (p1 && p2 && p1.value && p2.value && p1.value !== p2.value){
      showErrorBelow(p2, 'пароли не совпадают');
      return;
    }
    const loginEl = document.getElementById('regLogin');
    if (loginEl && isLoginTaken(loginEl.value)){
      showErrorBelow(loginEl, 'логин уже занят');
      return;
    }
    if (!ok) return;
    if (codeSection){
      codeSection.classList.remove('hidden');
      if (codeInputs.length) codeInputs[0].focus();
      if (codeError) codeError.textContent = '';
    }
  });
}

codeInputs.forEach((inp, idx) => {
  inp.addEventListener('input', () => {
    inp.value = inp.value.replace(/\D/g,'').slice(0,1);
    if (inp.value && idx < codeInputs.length - 1) codeInputs[idx+1].focus();
    inp.classList.remove('input-error');
    if (codeError) codeError.textContent = '';
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !inp.value && idx > 0) codeInputs[idx-1].focus();
  });
});
if (codeInputs[0]){
  codeInputs[0].addEventListener('paste', (e) => {
    const t = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'').slice(0,6);
    if (!t) return;
    e.preventDefault();
    codeInputs.forEach((i,k)=>{ i.value = t[k] || ''; i.classList.remove('input-error'); });
    if (codeError) codeError.textContent = '';
    (codeInputs[Math.min(t.length,6)-1] || codeInputs[0]).focus();
  });
}

// Login submit (front validation only — actual auth handled later)
(() => {
  const loginForm = document.getElementById('login');
  if (!loginForm) return;
  const loginBtn = loginForm.querySelector('.btn');
  if (!loginBtn) return;
  const inputs = Array.from(loginForm.querySelectorAll('input'));
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginBtn.dataset.authReady = '';
    const ok = validateRequired(inputs);
    if (!ok) return;
    inputs.forEach(inp => clearErrorBelow(inp));
    clearLoginAuthError();
    loginBtn.dataset.authReady = '1';
  });
})();

// Register submit
(() => {
  if (!regTab) return;
  const regBtn = regTab.querySelector('.modal-footer .ios-button');
  if (!regBtn) return;
  regBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const base = [
      document.getElementById('regLogin'),
      document.getElementById('regPass'),
      document.getElementById('regPass2'),
      regTab.querySelector('input[placeholder="Телефон или Email"]')
    ].filter(Boolean);
    const okBase = validateRequired(base);
    const loginEl = document.getElementById('regLogin');
    let okLogin = true;
    if (loginEl && isLoginTaken(loginEl.value)){
      showErrorBelow(loginEl, 'логин уже занят');
      okLogin = false;
    }
    const p1 = document.getElementById('regPass');
    const p2 = document.getElementById('regPass2');
    let okPass = true;
    if (p1 && p2 && p1.value !== p2.value){
      showErrorBelow(p2, 'пароли не совпадают');
      okPass = false;
    }
    let okOTP = true;
    if (codeSection && !codeSection.classList.contains('hidden')){
      const filled = codeInputs.length === 6 && codeInputs.every(i => i.value.trim());
      if (!filled){
        okOTP = false;
        if (codeError) codeError.textContent = 'необходимо заполнить';
        codeInputs.forEach(i => { if (!i.value.trim()) i.classList.add('input-error'); });
      }
    } else {
      okOTP = false;
      if (codeError) codeError.textContent = 'Сначала нажмите «Отправить код» и введите его';
    }
    regBtn.dataset.authReady = '';
    if (!(okBase && okLogin && okPass && okOTP)) return;
    base.forEach(inp => clearErrorBelow(inp));
    regBtn.dataset.authReady = '1';
  });
})();

// === pro features: resend timer, disable register until code, strength meter, enter submit, ARIA, drafts ===
(function(){
  const modalEl = document.getElementById('authModal');
  if (modalEl){
    modalEl.setAttribute('role','dialog');
    modalEl.setAttribute('aria-modal','true');
    modalEl.setAttribute('aria-label','Окно авторизации и регистрации');
  }

  const regForm = document.getElementById('register');
  const loginForm = document.getElementById('login');
  if (!regForm) return;

  const sendCodeBtn = regForm.querySelector('.btn'); // "Отправить код"
  const regBtn = regForm.querySelector('.modal-footer .ios-button'); // "Зарегистрироваться"
  const codeSection = document.getElementById('codeSection');
  const codeInputs = codeSection ? Array.from(codeSection.querySelectorAll('.code-input')) : [];
  const codeError = document.getElementById('codeError');

  // ---------- helpers for errors: ARIA ties ----------
  function ensureErrId(el){
    if (!el.dataset.errId){
      el.dataset.errId = (el.id ? el.id : ('fld' + Math.random().toString(36).slice(2))) + '-err';
    }
    return el.dataset.errId;
  }
  const prevShowErr = typeof showErrorBelow === 'function' ? showErrorBelow : null;
  window.showErrorBelow = function(input, msg){
    if (prevShowErr) prevShowErr(input, msg);
    // ARIA
    input.setAttribute('aria-invalid','true');
    const id = ensureErrId(input);
    let anchor = input;
    if (input.parentElement && input.parentElement.classList.contains('input-group')) anchor = input.parentElement;
    let err = anchor.nextElementSibling;
    if (err && err.classList && err.classList.contains('field-error')){
      err.id = id;
      input.setAttribute('aria-describedby', id);
    }
  };
  const prevClearErr = typeof clearErrorBelow === 'function' ? clearErrorBelow : null;
  window.clearErrorBelow = function(input){
    if (prevClearErr) prevClearErr(input);
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  };

  // ---------- password strength meter (for regPass) ----------
  const p1 = document.getElementById('regPass');
  if (p1){
    // create UI once under the password field
    (function(){
      // place after input-group or input
      let anchor = p1.parentElement && p1.parentElement.classList.contains('input-group') ? p1.parentElement : p1;
      if (!anchor.nextElementSibling || !anchor.nextElementSibling.classList || !anchor.nextElementSibling.classList.contains('strength-wrap')){
        const wrap = document.createElement('div');
        wrap.className = 'strength-wrap';
        wrap.innerHTML = '<div class="strength-meter" aria-hidden="true"><span></span></div><small class="hint"></small>';
        anchor.after(wrap);
      }
    })();

    const wrap = (p1.parentElement && p1.parentElement.classList.contains('input-group') ? p1.parentElement.nextElementSibling : p1.nextElementSibling);
    const bar = wrap.querySelector('.strength-meter > span');
    const hint = wrap.querySelector('.hint');

    function scorePass(v){
      let score = 0;
      if (v.length >= 8) score++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
      if (/\d/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      return score; // 0..4
    }
    function render(v){
      const s = scorePass(v);
      let pct = [0,25,50,75,100][s];
      bar.style.width = pct + '%';
      bar.className = ''; // reset
      if (s <= 1){ bar.classList.add('strength-weak'); hint.textContent = 'Минимум 8 символов, буквы в разном регистре, цифра и спецсимвол.'; }
      else if (s === 2 || s === 3){ bar.classList.add('strength-medium'); hint.textContent = 'Хорошо. Добавь недостающие элементы для максимальной надёжности.'; }
      else { bar.classList.add('strength-strong'); hint.textContent = 'Отличный пароль.'; }
    }
    p1.addEventListener('input', () => render(p1.value));
    render(p1.value || '');
  }

  // ---------- resend timer on "Отправить код" ----------
  let timerId = null;
  function startResendTimer(sec){
    clearInterval(timerId);
    let left = sec;
    if (sendCodeBtn){
      sendCodeBtn.disabled = true;
      sendCodeBtn.dataset.original = sendCodeBtn.dataset.original || sendCodeBtn.textContent;
      sendCodeBtn.textContent = 'Отправить повторно (' + left + 'с)';
    }
    const noteId = 'resend-note';
    let note = document.getElementById(noteId);
    if (!note){
      note = document.createElement('div');
      note.id = noteId;
      note.className = 'resend-note';
      sendCodeBtn.parentElement && sendCodeBtn.parentElement.appendChild(note);
    }
    note.textContent = 'Повторная отправка станет доступна через ' + left + ' секунд.';

    timerId = setInterval(() => {
      left -= 1;
      if (left <= 0){
        clearInterval(timerId);
        if (sendCodeBtn){
          sendCodeBtn.disabled = false;
          sendCodeBtn.textContent = sendCodeBtn.dataset.original || 'Отправить код';
        }
        note.textContent = 'Можно отправить код ещё раз.';
      } else {
        if (sendCodeBtn) sendCodeBtn.textContent = 'Отправить повторно (' + left + 'с)';
        note.textContent = 'Повторная отправка станет доступна через ' + left + ' секунд.';
      }
    }, 1000);
  }

  if (sendCodeBtn){
    const prev = sendCodeBtn.onclick;
    sendCodeBtn.addEventListener('click', () => {
      // при успешной базовой проверке (код секция открывается ранее в коде) запускаем таймер
      startResendTimer(30);
    });
  }

  // ---------- disable "Зарегистрироваться" до полного кода ----------
  function isCodeComplete(){
    return codeSection && !codeSection.classList.contains('hidden') && codeInputs.length === 6 && codeInputs.every(i => i.value.trim());
  }
  function updateRegisterCTAState(){
    if (!regBtn) return;
    regBtn.disabled = !isCodeComplete();
  }
  updateRegisterCTAState();
  codeInputs.forEach(inp => inp.addEventListener('input', updateRegisterCTAState));
  if (codeSection) {
    const obs = new MutationObserver(updateRegisterCTAState);
    obs.observe(codeSection, { attributes: true, attributeFilter: ['class'] });
  }

  // ---------- Submit by Enter ----------
  function handleEnterIn(container, handler){
    container.querySelectorAll('input').forEach(el => {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter'){
          e.preventDefault();
          handler();
        }
      });
    });
  }
  if (loginForm){
    const loginBtn = loginForm.querySelector('.btn');
    handleEnterIn(loginForm, () => loginBtn && loginBtn.click());
  }
  handleEnterIn(regForm, () => {
    if (codeSection && !codeSection.classList.contains('hidden')){
      if (isCodeComplete() && regBtn) regBtn.click();
    } else if (sendCodeBtn){
      sendCodeBtn.click();
    }
  });

  // ---------- Drafts in localStorage ----------
  const LS_KEY = 'authDraft_v1';
  function saveDraft(){
    const phoneEl = regForm.querySelector('input[placeholder="Телефон или Email"]');
    const data = {
      tab: document.querySelector('.tab.active')?.getAttribute('data-tab') || 'login',
      regLogin: document.getElementById('regLogin')?.value || '',
      regPass: document.getElementById('regPass')?.value || '',
      regPass2: document.getElementById('regPass2')?.value || '',
      phone: phoneEl ? phoneEl.value : '',
      code: codeInputs.map(i=>i.value).join(''),
      codeVisible: codeSection && !codeSection.classList.contains('hidden')
    };
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e){}
  }
  function loadDraft(){
    let data = null;
    try { data = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch(e){}
    if (!data) return;
    // switch tab
    const desired = data.tab === 'register' ? 'register' : 'login';
    const btn = document.querySelector('.tab[data-tab="'+desired+'"]');
    if (btn) btn.click();
    // fill fields
    if (data.regLogin) document.getElementById('regLogin').value = data.regLogin;
    if (data.regPass)  document.getElementById('regPass').value  = data.regPass;
    if (data.regPass2) document.getElementById('regPass2').value = data.regPass2;
    const phoneEl = regForm.querySelector('input[placeholder="Телефон или Email"]');
    if (phoneEl && data.phone) phoneEl.value = data.phone;
    if (data.codeVisible && codeSection) {
      codeSection.classList.remove('hidden');
      const arr = data.code.split('');
      codeInputs.forEach((i,k)=> i.value = arr[k] || '');
    }
    updateRegisterCTAState();
  }
  function clearDraft(){ try { localStorage.removeItem(LS_KEY); } catch(e){} }

  // save on input
  document.querySelectorAll('#login input, #register input').forEach(inp => {
    inp.addEventListener('input', saveDraft);
  });
  // also when toggling code section, timer etc.
  if (sendCodeBtn) sendCodeBtn.addEventListener('click', saveDraft);
  codeInputs.forEach(i => i.addEventListener('input', saveDraft));

  // clear after success (hook existing alerts)
  const origLoginClick = loginForm?.querySelector('.btn')?.onclick;
  if (loginForm && loginForm.querySelector('.btn')){
    loginForm.querySelector('.btn').addEventListener('click', () => setTimeout(clearDraft, 0));
  }
  if (regBtn){
    regBtn.addEventListener('click', () => setTimeout(clearDraft, 0));
  }

  // load on init
  loadDraft();
})();


// === disable "Отправить код" пока поля не заполнены ===
(() => {
  const reg = document.getElementById('register');
  if (!reg) return;

  const sendCodeBtn = reg.querySelector('.btn'); // "Отправить код"
  if (!sendCodeBtn) return;

  const loginEl = document.getElementById('regLogin');
  const pass1   = document.getElementById('regPass');
  const pass2   = document.getElementById('regPass2');
  const phoneEl = reg.querySelector('input[placeholder="Телефон или Email"]');

  const fields = [loginEl, pass1, pass2, phoneEl].filter(Boolean);

  // если хочешь учитывать «занят логин»:
  function allFilled() {
    return fields.every(i => i.value.trim().length > 0);
  }

  // ВАРИАНТ ПО-СТРОЖЕ: все заполнены + пароли совпадают + логин свободен
  function isReadyStrict() {
    const filled = allFilled();
    const passOk = pass1 && pass2 ? pass1.value === pass2.value : true;
    const loginOk = loginEl ? !isLoginTaken(loginEl.value) : true;
    return filled && passOk && loginOk;
  }

  // ВАРИАНТ ПРОЩЕ: только «все заполнены»
  function isReadySimple() {
    return allFilled();
  }

  function updateSendCodeState() {
    // выбери нужную строку:
    // sendCodeBtn.disabled = !isReadySimple();   // только заполнение
    sendCodeBtn.disabled = !isReadyStrict();      // заполнение + совпадение паролей + логин не занят
  }

  // следим за вводом и обновляем состояние кнопки
  fields.forEach(i => i && i.addEventListener('input', updateSendCodeState));

  // первый вызов при загрузке
  updateSendCodeState();
})();

// === accounts + auth + redirects to profile.html ===
(function(){
  const ACC_KEY='accounts_v1';
  const AUTH_KEY='authProfileKey';
  const PROF_PREFIX='profileData_v1:';
  let authSuccessFlag = false;
  function getAcc(){ try{return JSON.parse(localStorage.getItem(ACC_KEY)||'{}');}catch(e){return{}} }
  function setAcc(obj){ localStorage.setItem(ACC_KEY, JSON.stringify(obj||{})); }
  function hash(v){ try{return btoa(unescape(encodeURIComponent(v||'')));}catch(e){return v||'';} }
  function isAuthed(){ try{return !!localStorage.getItem(AUTH_KEY);}catch(e){return false;} }

  function persistProfileLogin(user, display){
    if (!user) return;
    try {
      const key = PROF_PREFIX + user;
      const data = JSON.parse(localStorage.getItem(key) || '{}') || {};
      if (display) data.loginDisplay = display;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      /* игнорируем переполнение */
    }
  }

  function toggleUI(){
    const btn = document.querySelector('.login-btn');
    if (btn) btn.style.display = isAuthed() ? 'none' : '';
    const nav = document.querySelector('.side-nav');
    if (nav){
      const archiveBtn = Array.from(nav.querySelectorAll('.side-btn')).find(b=>b.textContent.trim()==='Ваш архив');
      if (archiveBtn) archiveBtn.style.display = isAuthed() ? '' : 'none';
      let pBtn = document.getElementById('sideProfileBtn');
      if (!pBtn){
        pBtn = Array.from(nav.querySelectorAll('.side-btn')).find((btn)=>{
          return btn.textContent && btn.textContent.trim() === 'Профиль';
        }) || null;
        if (pBtn && !pBtn.id){
          pBtn.id = 'sideProfileBtn';
        }
      }
      if (!pBtn){
        pBtn = document.createElement('button');
        pBtn.id = 'sideProfileBtn';
        pBtn.className = 'side-btn';
        pBtn.textContent = 'Профиль';
        pBtn.addEventListener('click', ()=> location.href='profile.html');
        pBtn._profileNavBound = true;
        nav.insertBefore(pBtn, nav.firstChild);
      } else if (pBtn.tagName === 'BUTTON' && !pBtn._profileNavBound){
        pBtn.addEventListener('click', ()=> location.href='profile.html');
        pBtn._profileNavBound = true;
      }
      if (pBtn){
        pBtn.style.display = isAuthed() ? '' : 'none';
      }
    }
  }
  document.addEventListener('DOMContentLoaded', toggleUI);
  toggleUI();

  // login submit
  (function(){
    const box = document.getElementById('login');
    if (!box) return;
    const btn = box.querySelector('.btn');
    const inputs = box.querySelectorAll('input');
    if (!btn) return;
    if (btn._authWired) return; btn._authWired=true;
    btn.addEventListener('click', (e)=>{
      const ready = btn.dataset.authReady === '1';
      btn.dataset.authReady = '';
      if (!ready) return;
      clearLoginAuthError();
      const rawLogin = (loginUserInput ? loginUserInput.value : inputs[0]?.value || '').trim();
      const u = rawLogin.toLowerCase();
      const p = (loginPassInput ? loginPassInput.value : inputs[1]?.value || '').trim();
      const acc = getAcc();
      if (!u || !p) return;
      const stored = acc[u];
      if (!stored){
        showLoginAuthError('Неверные логин или пароль', loginUserInput || inputs[0]);
        showAuthFailureModal('Неверные логин или пароль. Проверьте введенные данные.');
        return;
      }
      const storedHash = typeof stored === 'object' && stored !== null ? stored.pass : stored;
      if (storedHash !== hash(p)){
        showLoginAuthError('Неверные логин или пароль', loginPassInput || inputs[1]);
        showAuthFailureModal('Неверные логин или пароль. Проверьте введенные данные.');
        return;
      }
      authSuccessFlag = true;
      localStorage.setItem(AUTH_KEY, u);
      const displayLogin = typeof stored === 'object' && stored !== null
        ? (stored.login || stored.display || rawLogin)
        : rawLogin;
      persistProfileLogin(u, displayLogin || rawLogin);
      const m = document.getElementById('authModal'); if (m) m.style.display='none';
      toggleUI();
      __goProfile();
    });
  })();

  // register submit
  (function(){
    const reg = document.getElementById('register');
    if (!reg) return;
    const regBtn = reg.querySelector('.modal-footer .ios-button');
    if (!regBtn) return;
    if (regBtn._authWired) return; regBtn._authWired=true;
    regBtn.addEventListener('click', (e)=>{
      const ready = regBtn.dataset.authReady === '1';
      regBtn.dataset.authReady = '';
      if (!ready) return;
      const loginEl = document.getElementById('regLogin');
      const p1 = document.getElementById('regPass');
      const p2 = document.getElementById('regPass2');
      if (!loginEl || !p1 || !p2) return;
      const originalLogin = (loginEl.value||'').trim();
      const user = originalLogin.toLowerCase();
      const pass = p1.value||'';
      if (!user || !pass || pass !== p2.value) return;
      const acc = getAcc();
      if (acc[user]) return;
      authSuccessFlag = true;
      acc[user] = { pass: hash(pass), login: originalLogin };
      setAcc(acc);
      localStorage.setItem(AUTH_KEY, user);
      persistProfileLogin(user, originalLogin);
      const m = document.getElementById('authModal'); if (m) m.style.display='none';
      const regTabBtn = document.querySelector('.tab[data-tab="register"]');
      const regContent = document.getElementById('register');
      if (regTabBtn) regTabBtn.style.display='none';
      if (regContent) regContent.style.display='none';
      toggleUI();
      __goProfile();
    });
  })();
})();


// Ensure clicking logo goes to home
(function(){
  function bindLogo(){
    var l = document.querySelector('.logo, .topbar .logo, .topbar-logo, #logo');
    if (l && !l.__goHome){
      l.__goHome = true;
      try{ l.style.cursor = 'pointer'; }catch(e){}
      l.addEventListener('click', function(){ location.href = 'index.html'; });
    }
  }
  document.addEventListener('DOMContentLoaded', bindLogo);
  bindLogo();
})();

// Header auth button toggle (safety)
(function(){
  const AUTH_KEY='authProfileKey';
  function isAuthed(){ try{return !!localStorage.getItem(AUTH_KEY);}catch(e){return false;} }
  function toggleHeaderAuth(){
    var btn = document.querySelector('.login-btn');
    if (btn){ btn.style.display = isAuthed() ? 'none' : ''; }
  }
  window.addEventListener('storage', function(e){ if (e.key===AUTH_KEY) toggleHeaderAuth(); });
  document.addEventListener('DOMContentLoaded', toggleHeaderAuth);
  toggleHeaderAuth();
})();


// === AUTH SUCCESS REDIRECT & CONFIRM AUTO-CLOSE ===
(function(){
  const AUTH_KEY='authProfileKey';

  function closeAnyConfirm(){
    // try close via OK buttons
    ['.confirm-ok','#confirmOkBtn','.modal-confirm .ios-button','.ios-confirm .ios-button','.btn-ok','.confirm__ok']
      .forEach(sel=>document.querySelectorAll(sel).forEach(b=>{ try{ b.click(); }catch(e){} }));
    // hard hide common wrappers
    ['#confirmModal','.confirm-modal','.modal-confirm','.ios-confirm']
      .forEach(sel=>document.querySelectorAll(sel).forEach(el=>{ el.style.display='none'; }));
  }

  function goProfile(){
    closeAnyConfirm();
    const m = document.getElementById('authModal');
    if (m) m.style.display='none';
    setTimeout(function(){
      try {
        window.location.assign('archive.html');
      } catch (e) {
        location.href = 'archive.html';
      }
    }, 10);
  }
  window.__goProfile = goProfile;

  // Also listen our custom event
  document.addEventListener('auth:success', goProfile);
})();

// notify on auth success (safety — call this in your success callbacks if needed)
window.__notifyAuthSuccess = function(){
  try{ document.dispatchEvent(new Event('auth:success')); }catch(e){}
  if (typeof __goProfile === 'function') __goProfile();
};


/* === AUTH/UI glue (robust) === */
(function(){
  const ACC_KEY='accounts_v1';
  const AUTH_KEY='authProfileKey';
  function getAcc(){ try{return JSON.parse(localStorage.getItem(ACC_KEY)||'{}');}catch(e){return{}} }
  function isAuthed(){ try{return !!localStorage.getItem(AUTH_KEY);}catch(e){return false;} }
  function setAuth(u){ if(!u) return; try{ localStorage.setItem(AUTH_KEY, String(u).toLowerCase()); }catch(e){}; toggleUI(); }

  function hideAuthButtons(){
    const cands = Array.from(document.querySelectorAll('.login-btn,#loginBtn,.auth-btn,.topbar .ios-button,.topbar button'))
      .filter(el => /войти/i.test(el.textContent||'') && /регистрац/i.test(el.textContent||''));
    cands.forEach(el => { el.style.display = isAuthed() ? 'none' : ''; });
  }
  function toggleUI(){
    hideAuthButtons();
    const nav = document.querySelector('.side-nav');
    if (nav){
      const archive = Array.from(nav.querySelectorAll('.side-btn')).find(b=> (b.textContent||'').trim()==='Ваш архив');
      if (archive) archive.style.display = isAuthed() ? '' : 'none';
      let p = document.getElementById('sideProfileBtn');
      if (!p){
        p = Array.from(nav.querySelectorAll('.side-btn')).find(btn => (btn.textContent||'').trim() === 'Профиль') || null;
        if (p && !p.id){
          p.id = 'sideProfileBtn';
        }
      }
      if (!p){
        p = document.createElement('button');
        p.id='sideProfileBtn'; p.className='side-btn'; p.textContent='Профиль';
        p.addEventListener('click', ()=> location.href='profile.html');
        p._profileNavBound = true;
        nav.insertBefore(p, nav.firstChild);
      } else if (p.tagName === 'BUTTON' && !p._profileNavBound){
        p.addEventListener('click', ()=> location.href='profile.html');
        p._profileNavBound = true;
      }
      if (p){
        p.style.display = isAuthed() ? '' : 'none';
      }
    }
  }

  function getLoginValue(){
    const el = document.getElementById('regLogin')
            || document.querySelector('#login input[type="text"], #login input[type="email"], #login input[name="login"]')
            || document.querySelector('#register input[type="text"], #register input[type="email"]');
    return el ? el.value.trim() : '';
  }
  function onAuthSuccess(){
    if (!authSuccessFlag) return;
    authSuccessFlag = false;
    const u = getLoginValue();
    if (u) setAuth(u);
    document.dispatchEvent(new Event('auth:success'));
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    toggleUI();
    const L = document.querySelector('#login .btn');
    if (L && !L.__authGlue){ L.__authGlue=true; L.addEventListener('click', ()=> setTimeout(onAuthSuccess, 0)); }
    const R = document.querySelector('#register .modal-footer .ios-button, #register .btn-register');
    if (R && !R.__authGlue){ R.__authGlue=true; R.addEventListener('click', ()=> setTimeout(onAuthSuccess, 0)); }
  });
  new MutationObserver(()=>{ if (isAuthed()) hideAuthButtons(); }).observe(document.documentElement,{childList:true,subtree:true});

  // logo -> home
  (function(){
     var l = document.querySelector('.logo, .topbar .logo, .topbar-logo, #logo');
     if (l && !l.__goHome){ l.__goHome=true; try{l.style.cursor='pointer';}catch(e){}; l.addEventListener('click', ()=> location.href='index.html'); }
  })();
})();
function clearLoginAuthError(){
  if (loginAuthError) loginAuthError.textContent = '';
  if (loginUserInput) loginUserInput.classList.remove('input-error');
  if (loginPassInput) loginPassInput.classList.remove('input-error');
}

let authFailureModal = null;
let authFailureMessageNode = null;
let authFailureOkButton = null;
let lastActiveBeforeAuthFailure = null;

function ensureAuthFailureModal(){
  if (authFailureModal) return authFailureModal;
  authFailureModal = document.createElement('div');
  authFailureModal.id = 'authFailureModal';
  authFailureModal.className = 'modal auth-feedback-modal';
  authFailureModal.setAttribute('role', 'alertdialog');
  authFailureModal.setAttribute('aria-modal', 'true');
  authFailureModal.tabIndex = -1;

  const content = document.createElement('div');
  content.className = 'modal-content auth-feedback-content';

  authFailureMessageNode = document.createElement('p');
  authFailureMessageNode.className = 'auth-feedback-message';
  authFailureMessageNode.id = 'authFailureMessage';
  content.appendChild(authFailureMessageNode);
  authFailureModal.setAttribute('aria-labelledby', authFailureMessageNode.id);

  const footer = document.createElement('div');
  footer.className = 'modal-footer auth-feedback-footer';
  authFailureOkButton = document.createElement('button');
  authFailureOkButton.type = 'button';
  authFailureOkButton.className = 'btn ios-button';
  authFailureOkButton.textContent = 'Ок';
  footer.appendChild(authFailureOkButton);
  content.appendChild(footer);

  authFailureModal.appendChild(content);
  document.body.appendChild(authFailureModal);

  function hide(){
    if (authFailureModal) authFailureModal.style.display = 'none';
    if (lastActiveBeforeAuthFailure && typeof lastActiveBeforeAuthFailure.focus === 'function'){
      try { lastActiveBeforeAuthFailure.focus(); } catch (e){}
    }
  }

  authFailureOkButton.addEventListener('click', hide);
  authFailureOkButton.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });
  authFailureModal.addEventListener('click', (event) => {
    if (event.target === authFailureModal) hide();
  });
  authFailureModal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape'){ hide(); }
  });

  return authFailureModal;
}

function showAuthFailureModal(message){
  const modalEl = ensureAuthFailureModal();
  lastActiveBeforeAuthFailure = document.activeElement;
  if (authFailureMessageNode) authFailureMessageNode.textContent = message || '';
  modalEl.style.display = 'flex';
  if (authFailureOkButton){
    authFailureOkButton.focus();
  }
}

function showLoginAuthError(message, target){
  if (loginAuthError) loginAuthError.textContent = message || '';
  if (loginUserInput) loginUserInput.classList.remove('input-error');
  if (loginPassInput) loginPassInput.classList.remove('input-error');
  if (target && message) target.classList.add('input-error');
}
if (loginUserInput) loginUserInput.addEventListener('input', clearLoginAuthError);
if (loginPassInput) loginPassInput.addEventListener('input', clearLoginAuthError);
