
(function(){
  const AUTH_KEY='authProfileKey';
  const PROF_PREFIX='profileData_v1:';
  const ACC_KEY='accounts_v1';
  const AVATAR_ZOOM_MIN=100;
  const AVATAR_ZOOM_MAX=160;
  const AVATAR_ZOOM_STEP=5;
  const AVATAR_SHIFT_STEP=2;
  function isAuthed(){ try{return !!localStorage.getItem(AUTH_KEY);}catch(e){return false;} }
  if (!isAuthed()){ location.href='index.html'; return; }

  function S(sel, root=document){ return root.querySelector(sel); }
  function getAuthLogin(){ try{return localStorage.getItem(AUTH_KEY);}catch(e){return null;} }
  function readProfile(){
    const k=getAuthLogin();
    if (!k) return {};
    try{ return JSON.parse(localStorage.getItem(PROF_PREFIX+k)||'{}') || {}; }catch(e){ return {}; }
  }
  function loadProfile(){ return { ...readProfile() }; }
  function saveProfile(update){
    const k=getAuthLogin(); if(!k) return;
    const current = readProfile();
    const merged = { ...current, ...(update || {}) };
    localStorage.setItem(PROF_PREFIX+k, JSON.stringify(merged));
  }
  function getAccounts(){ try{return JSON.parse(localStorage.getItem(ACC_KEY)||'{}')||{};}catch(e){return{};} }
  function clamp(val, min, max){
    const num = Number(val);
    const fallback = min + (max - min) / 2;
    const base = Number.isFinite(num) ? num : fallback;
    return Math.min(Math.max(base, min), max);
  }
  function normalizeAvatarPos(pos){
    const base = (pos && typeof pos === 'object') ? pos : {};
    const rawScale = base.scale ?? base.zoom ?? base.size;
    const numericScale = Number(rawScale);
    const scale = Number.isFinite(numericScale) && numericScale > 0 ? numericScale : 100;
    return {
      x: clamp(base.x ?? 50, 0, 100),
      y: clamp(base.y ?? 50, 0, 100),
      scale: clamp(scale, AVATAR_ZOOM_MIN, AVATAR_ZOOM_MAX)
    };
  }

  let logoutModal=null;
  let logoutStayBtn=null;
  let logoutExitBtn=null;
  let logoutKeyHandlerBound=false;
  let logoutPrevFocus=null;

  function bindLogoutModal(){
    if (logoutModal) return;
    logoutModal = document.getElementById('profileLogoutModal');
    if (!logoutModal) return;
    logoutStayBtn = logoutModal.querySelector('[data-action="stay"]');
    logoutExitBtn = logoutModal.querySelector('[data-action="exit"]');
    logoutModal.addEventListener('click', (evt)=>{
      if (evt.target === logoutModal) hideLogoutModal();
    });
    if (logoutStayBtn){
      logoutStayBtn.addEventListener('click', hideLogoutModal);
    }
    if (logoutExitBtn){
      logoutExitBtn.addEventListener('click', performLogout);
    }
  }

  function performLogout(){
    try{ localStorage.removeItem(AUTH_KEY); }catch(e){}
    location.href='index.html';
  }

  function handleLogoutKey(e){
    if (e.key === 'Escape'){ e.preventDefault(); hideLogoutModal(); }
  }

  function showLogoutModal(){
    bindLogoutModal();
    if (!logoutModal){
      performLogout();
      return;
    }
    logoutPrevFocus = document.activeElement;
    logoutModal.hidden = false;
    if (!logoutKeyHandlerBound){
      document.addEventListener('keydown', handleLogoutKey);
      logoutKeyHandlerBound = true;
    }
    const focusTarget = logoutExitBtn || logoutStayBtn;
    if (focusTarget){
      setTimeout(()=>{ try{ focusTarget.focus(); }catch(e){} }, 0);
    }
  }

  function hideLogoutModal(){
    if (!logoutModal || logoutModal.hidden) return;
    logoutModal.hidden = true;
    if (logoutKeyHandlerBound){
      document.removeEventListener('keydown', handleLogoutKey);
      logoutKeyHandlerBound = false;
    }
    if (logoutPrevFocus && typeof logoutPrevFocus.focus === 'function'){
      try{ logoutPrevFocus.focus(); }catch(e){}
    }
    logoutPrevFocus = null;
  }

  function fill(){ const d=loadProfile(); const v=S('#profileView'); if(!v) return;
    const loginTitle = S('#profileLoginDisplay');
    const topbarTitle = S('.topbar .page-title');
    const authLogin = getAuthLogin();
    const accounts = getAccounts();
    let loginLabel = d.loginDisplay || '';
    if (!loginLabel && authLogin){
      const entry = accounts[authLogin];
      if (entry && typeof entry === 'object'){
        loginLabel = entry.login || entry.display || authLogin;
      } else {
        loginLabel = authLogin;
      }
    }
    const finalLogin = (loginLabel || '').trim();
    if (loginTitle){
      if (finalLogin){
        loginTitle.textContent = finalLogin;
        loginTitle.dataset.state = 'filled';
        loginTitle.title = finalLogin;
      } else {
        loginTitle.textContent = '—';
        loginTitle.dataset.state = 'empty';
        loginTitle.removeAttribute('title');
      }
    }
    if (topbarTitle) topbarTitle.textContent = 'Профиль';
    function T(f,val){ const el=S('[data-f="'+f+'"]',v); if(el) el.textContent=val||'—'; }
    ['first','last','city','email','phone','interests'].forEach(k=>T(k,d[k]));
    const img=S('#avatarImg'), wrap=S('.avatar-wrap'), ph=S('.avatar-placeholder');
    const avatarPos = normalizeAvatarPos(d.avatarPos);
    if(img){
      img.style.objectPosition = `${avatarPos.x}% ${avatarPos.y}%`;
      img.style.setProperty('--avatar-scale', (avatarPos.scale/100).toFixed(3));
      img.style.setProperty('--avatar-origin-x', `${avatarPos.x}%`);
      img.style.setProperty('--avatar-origin-y', `${avatarPos.y}%`);
      if(!img._dragPrevented){
        img._dragPrevented=true;
        try{ img.draggable=false; }catch(e){}
        img.addEventListener('dragstart', e=>{ e.preventDefault(); });
      }
    }
    if(d.avatar){
      if(img){ img.src=d.avatar; img.style.display='block'; }
      if(wrap) wrap.classList.add('has-img');
      if(ph) ph.style.display='none';
    }
    else{
      if(img){
        img.removeAttribute('src');
        img.style.display='none';
        img.style.removeProperty('--avatar-scale');
        img.style.removeProperty('--avatar-origin-x');
        img.style.removeProperty('--avatar-origin-y');
      }
      if(wrap) wrap.classList.remove('has-img');
      if(ph) ph.style.display='flex';
    }
  }

    function openEdit(mode){
      const m=S('#profileEditModal'); if(!m) return;
      S('#profileEditTitle').textContent=(mode==='setup'?'Заполните данные профиля':'Редактирование профиля');
      const d=loadProfile();
      const prev=S('#pe_prev');
      const avatarBox=S('#pe_avatarBox');
      const controlsWrap=S('#pe_avatarControls');
      const file=S('#pe_file');
      const errorBox=S('#pe_error');
      if (errorBox) errorBox.textContent='';
      const fields=['first','last','city','email','phone','interests'];
      fields.forEach(k=>{ const el=S('#pe_'+k); if(el){ el.value=d[k]||''; el.classList.remove('pe-invalid'); } });
      const updateZoomLabel=(scale)=>{
        if(!controlsWrap) return;
        const label=controlsWrap.querySelector('[data-zoom-value]');
        if(label){
          if(scale==null){ label.textContent='—'; }
          else { label.textContent=`${Math.round(scale)}%`; }
        }
      };
      const applyPreviewPos=(pos)=>{
        const norm=normalizeAvatarPos(pos);
        if(avatarBox){
          avatarBox.dataset.posX=String(norm.x);
          avatarBox.dataset.posY=String(norm.y);
          avatarBox.dataset.scale=String(norm.scale);
        }
        if(prev){
          prev.style.objectPosition=`${norm.x}% ${norm.y}%`;
          prev.style.setProperty('--avatar-scale',(norm.scale/100).toFixed(3));
          prev.style.setProperty('--avatar-origin-x',`${norm.x}%`);
          prev.style.setProperty('--avatar-origin-y',`${norm.y}%`);
        }
        updateZoomLabel(norm.scale);
        return norm;
      };
      const syncControlState=()=>{
        if(!controlsWrap) return;
        const hasPhoto=!!(prev && prev.src);
        controlsWrap.classList.toggle('disabled', !hasPhoto);
        controlsWrap.querySelectorAll('button').forEach(btn=>{ btn.disabled=!hasPhoto; });
        if(!hasPhoto) updateZoomLabel(null);
      };
      const readCurrentAvatarPos=()=> normalizeAvatarPos({
        x: avatarBox?.dataset.posX,
        y: avatarBox?.dataset.posY,
        scale: avatarBox?.dataset.scale
      });
      const persistAvatarPos=(pos)=>{
        const normalized=normalizeAvatarPos(pos);
        saveProfile({ avatarPos: normalized });
        fill();
        return normalized;
      };
      if(prev){
        if(!prev._dragPrevented){
          prev._dragPrevented=true;
          try{ prev.draggable=false; }catch(e){}
          prev.addEventListener('dragstart', e=>{ e.preventDefault(); });
        }
        if(d.avatar){
          prev.src=d.avatar; prev.style.display='block';
        }
        else {
          prev.removeAttribute('src');
          prev.style.display='none';
          prev.style.removeProperty('--avatar-scale');
          prev.style.removeProperty('--avatar-origin-x');
          prev.style.removeProperty('--avatar-origin-y');
        }
      }
      if(avatarBox){
        if(d.avatar){
          avatarBox.classList.add('has-photo');
        }
        else {
          avatarBox.classList.remove('has-photo');
          delete avatarBox.dataset.scale;
        }
      }
      applyPreviewPos(d.avatarPos);
      syncControlState();
      const requiredIds=['pe_first','pe_city','pe_email'];
      const showModalError=(msg)=>{ if(errorBox) errorBox.textContent=msg||''; };
      const validateRequired=()=>{
        let ok=true;
        requiredIds.forEach(id=>{
          const el=document.getElementById(id);
          if(!el) return;
          if(!el.value.trim()){ el.classList.add('pe-invalid'); ok=false; }
          else { el.classList.remove('pe-invalid'); }
        });
        if(!ok) showModalError('Заполнены не все обязательные поля');
        else showModalError('');
        return ok;
      };
      requiredIds.forEach(id=>{
        const el=document.getElementById(id);
        if(el && !el._peInputBound){
          el._peInputBound=true;
          el.addEventListener('input', ()=>{ el.classList.remove('pe-invalid'); showModalError(''); });
        }
      });
      if(avatarBox && !avatarBox._pickerBound){
        avatarBox._pickerBound=true;
        avatarBox.addEventListener('click', ()=>{ if(file) file.click(); });
      }
      if(controlsWrap && !controlsWrap._bound){
        controlsWrap._bound=true;
        controlsWrap.addEventListener('click',(evt)=>{
          const btn=evt.target.closest('button');
          if(!btn) return;
          evt.preventDefault();
          if(!prev || !prev.src) return;
          const current=readCurrentAvatarPos();
          if(btn.dataset.dir){
            switch(btn.dataset.dir){
              case 'up': current.y = clamp(current.y + AVATAR_SHIFT_STEP, 0, 100); break;
              case 'down': current.y = clamp(current.y - AVATAR_SHIFT_STEP, 0, 100); break;
              case 'left': current.x = clamp(current.x + AVATAR_SHIFT_STEP, 0, 100); break;
              case 'right': current.x = clamp(current.x - AVATAR_SHIFT_STEP, 0, 100); break;
            }
          } else if(btn.dataset.zoom){
            const delta = btn.dataset.zoom==='in' ? AVATAR_ZOOM_STEP : -AVATAR_ZOOM_STEP;
            current.scale = clamp(current.scale + delta, AVATAR_ZOOM_MIN, AVATAR_ZOOM_MAX);
          }
          const applied=applyPreviewPos(current);
          persistAvatarPos(applied);
        });
      }
      if(!m._wired){
        m._wired=true;
        m.addEventListener('click', e=>{ if(e.target===m) m.style.display='none'; });
        m.querySelectorAll('[data-close]').forEach(b=> b.addEventListener('click', ()=> m.style.display='none'));
        const save=S('#pe_save');
        if(save){
          save.addEventListener('click', e=>{ e.preventDefault();
            if(!validateRequired()) return;
            const out={};
            fields.forEach(k=>{ const el=S('#pe_'+k); out[k]=el?el.value.trim():''; });
            if(prev && prev.src) out.avatar=prev.src;
            out.avatarPos=normalizeAvatarPos({ x: avatarBox?.dataset.posX, y: avatarBox?.dataset.posY, scale: avatarBox?.dataset.scale });
            saveProfile(out);
            showModalError('');
            m.style.display='none';
            fill();
            window.scrollTo({top:0,behavior:'smooth'});
          });
        }
      }
      fields.forEach(k=>{
        const el=S('#pe_'+k);
        if(el && !el._as){
          el._as=true;
          el.addEventListener('change', ()=>{
            saveProfile({ [k]: el.value.trim(), avatarPos: normalizeAvatarPos({ x: avatarBox?.dataset.posX, y: avatarBox?.dataset.posY, scale: avatarBox?.dataset.scale }) });
          });
        }
      });
      if(file && !file._as){
        file._as=true;
        file.addEventListener('change', ()=>{
          const processed=file._processedAvatarData;
          const alreadySaved=processed ? !!file._processedAvatarSaved : false;
          const handleData=(dataURL)=>{
            if(!dataURL) return;
            if(prev){
              prev.src=dataURL;
              prev.style.display='block';
              prev.style.objectPosition='50% 50%';
              prev.style.setProperty('--avatar-scale','1');
              prev.style.setProperty('--avatar-origin-x','50%');
              prev.style.setProperty('--avatar-origin-y','50%');
            }
            if(avatarBox){
              avatarBox.classList.add('has-photo');
              avatarBox.dataset.posX='50';
              avatarBox.dataset.posY='50';
              avatarBox.dataset.scale='100';
            }
            const centered=applyPreviewPos({x:50,y:50,scale:100});
            syncControlState();
            if(alreadySaved){
              saveProfile({ avatarPos:centered });
            } else {
              saveProfile({ avatar:dataURL, avatarPos:centered });
            }
            fill();
          };
          if(processed){
            handleData(processed);
            return;
          }
          const f=file.files&&file.files[0];
          if(!f) return;
          const r=new FileReader();
          r.onload=()=>{ handleData(r.result); };
          r.readAsDataURL(f);
        });
      }
      m.style.display='flex';
    }

  function logout(){
    showLogoutModal();
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    bindLogoutModal();

    (function bindRobustAvatarChange(){
      const fileInput = document.getElementById('pe_file');
      const prev      = document.getElementById('pe_prev');
      const avatarBox = document.getElementById('pe_avatarBox');
      if (!fileInput || fileInput._robustBound) return;
      fileInput._robustBound = true;
      fileInput.addEventListener('change', async function(e){
        const f = fileInput.files && fileInput.files[0];
        if (!f) return;
        try{
          const dataURL = await (window._processAvatarFile ? window._processAvatarFile(f) : (async ()=>{throw new Error('Ошибка подготовки фото');})());
          if (prev){
            prev.src = dataURL;
            prev.style.display = 'block';
            prev.style.objectPosition = '50% 50%';
            prev.style.setProperty('--avatar-scale','1');
            prev.style.setProperty('--avatar-origin-x','50%');
            prev.style.setProperty('--avatar-origin-y','50%');
          }
          if (avatarBox){
            avatarBox.classList.add('has-photo');
            avatarBox.dataset.posX = '50';
            avatarBox.dataset.posY = '50';
            avatarBox.dataset.scale = '100';
          }
          fileInput._processedAvatarData = dataURL;
          let savedSuccessfully = false;
          try {
            if (typeof saveProfile === 'function') {
              saveProfile({ avatar: dataURL, avatarPos: {x:50,y:50,scale:100} });
              savedSuccessfully = true;
            } else {
              localStorage.setItem('profile_avatar_fallback', dataURL);
              savedSuccessfully = true;
            }
          } catch(err){
            alert('Не удалось сохранить фото (превышен объём хранилища браузера).');
          }
          fileInput._processedAvatarSaved = savedSuccessfully;
        }catch(err){
          alert(err && err.message ? err.message : 'Не удалось обработать фото.');
          try{ fileInput.value = ''; }catch(_){}
        }
      }, true);
    })();

  // === Robust avatar processing (size/format) ===
  if (typeof window._avatarUtilsInjected === 'undefined'){
    window._avatarUtilsInjected = true;
    const MAX_AVATAR_BYTES = 4.5 * 1024 * 1024;
    const MAX_AVATAR_SIDE  = 1024;
    const ALLOWED_TYPES = /image\/(jpeg|png|webp|gif)/i;
    const BLOCKED_TYPES  = /image\/(heic|heif|tiff)/i;

    function fileToDataURL(file){
      return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
    }
    function loadImage(src){
      return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = () => rej(new Error('Невозможно прочитать изображение'));
        img.src = src;
      });
    }
    async function processAvatarFile(file){
      if (BLOCKED_TYPES.test(file.type) || /\.(heic|heif|tif|tiff)$/i.test(file.name)){
        throw new Error('Формат HEIC/HEIF/TIFF не поддерживается. Используйте JPG/PNG/WebP/GIF.');
      }
      if (!ALLOWED_TYPES.test(file.type) && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)){
        throw new Error('Допустимы только JPG, PNG, WebP или GIF.');
      }
      const raw = await fileToDataURL(file);
      const img = await loadImage(raw);

      const maxSide = Math.max(img.width, img.height);
      const scale   = Math.min(1, MAX_AVATAR_SIDE / maxSide);
      const w = Math.max(1, Math.round(img.width  * scale));
      const h = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      let q = 0.92;
      let out = canvas.toDataURL('image/webp', q);
      if (!/^data:image\/webp/.test(out)) out = canvas.toDataURL('image/jpeg', q);

      while (out.length > MAX_AVATAR_BYTES * 1.37 && q > 0.5){
        q -= 0.06;
        out = out.startsWith('data:image/webp')
          ? canvas.toDataURL('image/webp', q)
          : canvas.toDataURL('image/jpeg', q);
      }
      if (out.length > MAX_AVATAR_BYTES * 1.37 && out.startsWith('data:image/webp')){
        out = canvas.toDataURL('image/jpeg', q);
      }
      if (out.length > MAX_AVATAR_BYTES * 1.37){
        throw new Error('Фото слишком большое. Попробуйте меньший файл или кадрирование.');
      }
      return out;
    }
    window._processAvatarFile = processAvatarFile;
  }


  // Go home when clicking logo (from profile)
  (function(){
    function bindLogo(){
      var l = document.querySelector('.logo, .topbar .logo, .topbar-logo, #logo');
      if (l && !l.__profileGoHome){
        l.__profileGoHome = true;
        try{ l.style.cursor = 'pointer'; }catch(e){}
        l.addEventListener('click', function(){ location.href = 'index.html'; });
      }
    }
    bindLogo();
    document.addEventListener('readystatechange', bindLogo);
  })();


    // Hide auth button on profile page
    document.body.classList.add('profile-page-active');
    const loginBtn=document.querySelector('.login-btn'); if (loginBtn) loginBtn.style.display='none';
    const editBtn=S('#profileEditBtn'); const outBtn=S('#profileLogoutBtn');
    if(editBtn) editBtn.addEventListener('click', ()=> openEdit('edit'));
    if(outBtn) outBtn.addEventListener('click', logout);
    fill();
    const initialData = loadProfile();
    if (!initialData.first || !initialData.city || !initialData.email){
      setTimeout(()=> openEdit('setup'), 250);
    }
  });
})();
