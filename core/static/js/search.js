(function(){
  const AUTH_KEY = 'authProfileKey';
  const STORAGE_KEY_BASE = 'archive_state_v2';
  const STORAGE_KEY_PREFIX = STORAGE_KEY_BASE + ':';
  const OPEN_SESSION_KEY = 'trezo:open-file';
  const OPEN_EVENT_NAME = 'trezo-open-file';
  const DB_NAME = 'trezo-archive-db';
  const STORE_NAME = 'states';

  const globalApi = window.TrezoSearch = window.TrezoSearch || {};

  const components = [];
  let componentCounter = 0;

  function nextResultsId(){
    componentCounter += 1;
    return `trezoSearchResults_${Date.now().toString(36)}_${componentCounter}`;
  }

  const searchWraps = Array.from(document.querySelectorAll('.search-wrap'));

  function createSearchComponent(wrap){
    if (!wrap) return null;
    const input = wrap.querySelector('.search');
    if (!input) return null;

    let host = wrap.querySelector('[data-search-results]');
    if (!host){
      host = document.createElement('div');
      host.className = 'search-results hidden';
      host.dataset.searchResults = 'true';
      wrap.appendChild(host);
    }

    if (!host.hasAttribute('role')){
      host.setAttribute('role', 'listbox');
    }
    if (!host.hasAttribute('aria-live')){
      host.setAttribute('aria-live', 'polite');
    }
    if (!host.id){
      host.id = nextResultsId();
    }

    input.setAttribute('autocomplete', 'off');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', host.id);

    function clear(){
      host.innerHTML = '';
      host.classList.add('hidden');
      input.setAttribute('aria-expanded', 'false');
      return [];
    }

    function getResultItems(){
      return Array.from(host.querySelectorAll('.search-results__item'));
    }

    function renderMatches(query){
      const matches = collectMatches(query);
      host.innerHTML = '';
      let appended = false;
      matches.forEach((match, index) => {
        if (!match || !match.rubricId || !match.fileId){
          return;
        }
        const link = document.createElement('a');
        link.className = 'search-results__item';
        const href = `archive.html?rubric=${encodeURIComponent(match.rubricId)}&file=${encodeURIComponent(match.fileId)}`;
        link.href = href;
        link.dataset.index = String(index);
        link.dataset.rubricId = match.rubricId;
        link.dataset.fileId = match.fileId;
        link.setAttribute('role', 'option');
        link.setAttribute('tabindex', '-1');
        link.setAttribute('aria-label', `${match.title} — ${match.rubricName}`);

        const titleEl = document.createElement('span');
        titleEl.className = 'search-results__title';
        titleEl.textContent = match.title;

        const rubricEl = document.createElement('span');
        rubricEl.className = 'search-results__rubric';
        rubricEl.textContent = match.rubricName;

        link.append(titleEl, rubricEl);
        host.appendChild(link);
        appended = true;
      });

      if (!appended){
        return clear();
      }

      host.classList.remove('hidden');
      input.setAttribute('aria-expanded', 'true');
      return getResultItems();
    }

    function ensureMatches(){
      const query = input.value || '';
      if (!query.trim()){
        return clear();
      }
      return renderMatches(query);
    }

    function focusItem(index){
      const items = getResultItems();
      if (!items.length){
        return;
      }
      const clamped = Math.max(0, Math.min(index, items.length - 1));
      const item = items[clamped];
      if (item){
        item.focus();
      }
    }

    function handleSelection(link){
      if (!link) return;
      const rubricId = link.dataset.rubricId;
      const fileId = link.dataset.fileId;
      const targetHref = link.getAttribute('href');
      if (!rubricId || !fileId){
        return;
      }
      input.value = '';
      clear();
      input.blur();
      const detail = { rubricId, fileId };
      const isArchivePage = Boolean(document.getElementById('archiveModalHost'));
      if (isArchivePage){
        window.dispatchEvent(new CustomEvent(OPEN_EVENT_NAME, { detail }));
        return;
      }
      try {
        sessionStorage.setItem(OPEN_SESSION_KEY, JSON.stringify(detail));
      } catch (e) {}
      if (targetHref){
        window.location.href = targetHref;
      } else {
        window.location.href = 'archive.html';
      }
    }

    function onInput(){
      ensureMatches();
    }

    function onFocus(){
      if (input.value && input.value.trim()){
        ensureMatches();
      }
    }

    function onKeyDown(event){
      if (event.key === 'ArrowDown'){
        const items = ensureMatches();
        if (items.length){
          event.preventDefault();
          focusItem(0);
        }
      } else if (event.key === 'Enter'){
        const items = ensureMatches();
        if (items.length){
          event.preventDefault();
          handleSelection(items[0]);
        }
      } else if (event.key === 'Escape'){
        clear();
      }
    }

    function onResultsKeyDown(event){
      const items = getResultItems();
      if (!items.length){
        return;
      }
      const currentIndex = items.indexOf(document.activeElement);
      if (event.key === 'ArrowDown'){
        event.preventDefault();
        const next = currentIndex >= 0 ? Math.min(currentIndex + 1, items.length - 1) : 0;
        focusItem(next);
      } else if (event.key === 'ArrowUp'){
        event.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : 0;
        if (prev === 0 && currentIndex <= 0){
          input.focus();
        } else {
          focusItem(prev);
        }
      } else if (event.key === 'Enter'){
        event.preventDefault();
        handleSelection(document.activeElement);
      } else if (event.key === 'Escape'){
        event.preventDefault();
        clear();
        input.focus();
      }
    }

    function onResultsClick(event){
      const link = event.target.closest('.search-results__item');
      if (!link) return;
      event.preventDefault();
      handleSelection(link);
    }

    input.addEventListener('input', onInput);
    input.addEventListener('focus', onFocus);
    input.addEventListener('keydown', onKeyDown);
    host.addEventListener('click', onResultsClick);
    host.addEventListener('keydown', onResultsKeyDown);

    return {
      wrap,
      input,
      host,
      clear,
      ensureMatches,
      refreshIfQuery(){
        if (input.value && input.value.trim()){
          renderMatches(input.value);
        }
      },
      hide(){
        clear();
      },
      hasQuery(){
        return Boolean(input.value && input.value.trim());
      },
      isOpen(){
        return !host.classList.contains('hidden');
      }
    };
  }

  searchWraps.forEach((wrap) => {
    const component = createSearchComponent(wrap);
    if (component){
      components.push(component);
    }
  });

  if (!components.length){
    globalApi.refresh = () => {};
    globalApi.hide = () => {};
    globalApi.resetCache = () => {};
    globalApi.setActiveState = () => {};
    return;
  }

  let cachedLogin = null;
  let cachedState = null;
  let cachedKey = null;
  const indexedCache = new Map();
  const indexedPromises = new Map();
  let dbPromise = null;

  function hideAll(){
    components.forEach((component) => {
      component.hide();
    });
  }

  function refreshAll(){
    components.forEach((component) => {
      component.refreshIfQuery();
    });
  }

  function openDb(){
    if (!('indexedDB' in window)){
      return Promise.resolve(null);
    }
    if (dbPromise){
      return dbPromise;
    }
    dbPromise = new Promise((resolve) => {
      let settled = false;
      function finish(result){
        if (!settled){
          settled = true;
          resolve(result || null);
        }
      }
      try {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
          const db = event.target && event.target.result;
          if (db && !db.objectStoreNames.contains(STORE_NAME)){
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => finish(request.result);
        request.onerror = () => finish(null);
        request.onblocked = () => finish(request.result || null);
      } catch (err) {
        console.warn('IndexedDB недоступна для поиска архива', err);
        finish(null);
      }
    });
    return dbPromise;
  }

  function parseStoredState(raw){
    if (!raw) return { rubrics: [] };
    let data = raw;
    if (typeof data === 'string'){
      try {
        data = JSON.parse(data);
      } catch (e) {
        return { rubrics: [] };
      }
    }
    const rubrics = Array.isArray(data && data.rubrics) ? data.rubrics.map((rubric) => {
      if (!rubric) return null;
      const id = rubric.id != null ? String(rubric.id) : null;
      if (!id) return null;
      const fields = Array.isArray(rubric.fields) ? rubric.fields.map((field) => {
        if (!field) return null;
        const fieldId = field.id != null ? String(field.id) : null;
        if (!fieldId) return null;
        return {
          id: fieldId,
          type: field.type || 'text'
        };
      }).filter(Boolean) : [];
      const files = Array.isArray(rubric.files) ? rubric.files.map((file) => {
        if (!file) return null;
        const fileId = file.id != null ? String(file.id) : null;
        if (!fileId) return null;
        const rubricId = file.rubricId != null ? String(file.rubricId) : id;
        const values = file && typeof file.values === 'object' && file.values ? { ...file.values } : {};
        return {
          id: fileId,
          rubricId,
          values
        };
      }).filter(Boolean) : [];
      return {
        id,
        name: rubric && rubric.name ? String(rubric.name) : 'Рубрика',
        fields,
        files
      };
    }).filter(Boolean) : [];
    return { rubrics };
  }

  function cacheState(login, key, state){
    cachedLogin = login;
    cachedKey = key;
    cachedState = state;
  }

  function setActiveStateExternal(login, rawState){
    if (!login){
      return;
    }
    const parsed = parseStoredState(rawState);
    const key = STORAGE_KEY_PREFIX + login;
    cacheState(login, key, parsed);
    indexedCache.set(login, parsed);
    indexedPromises.delete(login);
    if (components.some((component) => component.hasQuery())){
      requestAnimationFrame(() => {
        refreshAll();
      });
    } else {
      hideAll();
    }
  }

  function ensureIndexedState(login, storageKey){
    if (!login || indexedCache.has(login)){
      return;
    }
    if (indexedPromises.has(login)){
      return;
    }
    const promise = openDb().then((db) => {
      if (!db){
        return null;
      }
      return new Promise((resolve) => {
        let finished = false;
        function complete(result){
          if (!finished){
            finished = true;
            resolve(result != null ? result : null);
          }
        }
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const request = store.get(storageKey);
          request.onsuccess = () => complete(request.result || null);
          request.onerror = () => complete(null);
          tx.onabort = () => complete(null);
        } catch (err) {
          console.warn('Не удалось прочитать архив из IndexedDB для поиска', err);
          complete(null);
        }
      });
    }).then((result) => {
      if (!result){
        return null;
      }
      const parsed = parseStoredState(result);
      indexedCache.set(login, parsed);
      if (!cachedState || cachedLogin === login){
        cacheState(login, storageKey, parsed);
      }
      if (components.some((component) => component.hasQuery())){
        requestAnimationFrame(() => {
          refreshAll();
        });
      }
      return parsed;
    }).catch(() => null).finally(() => {
      indexedPromises.delete(login);
    });

    indexedPromises.set(login, promise);
  }

  function normalizeText(value){
    const text = value == null ? '' : String(value);
    try {
      return text.toLocaleLowerCase('ru-RU');
    } catch (e) {
      return text.toLowerCase();
    }
  }

  function getLogin(){
    try {
      return localStorage.getItem(AUTH_KEY) || null;
    } catch (e) {
      return null;
    }
  }

  function loadState(){
    const login = getLogin();
    if (!login){
      cachedLogin = null;
      cachedState = null;
      cachedKey = null;
      return null;
    }
    if (cachedState && cachedLogin === login){
      return cachedState;
    }
    const key = STORAGE_KEY_PREFIX + login;
    try {
      const raw = localStorage.getItem(key);
      if (raw){
        const parsed = parseStoredState(raw);
        cacheState(login, key, parsed);
        indexedCache.set(login, parsed);
        return parsed;
      }
    } catch (e) {}

    if (indexedCache.has(login)){
      const cached = indexedCache.get(login);
      cacheState(login, key, cached);
      return cached;
    }

    cacheState(login, key, { rubrics: [] });
    ensureIndexedState(login, key);
    return cachedState;
  }

  function getRubricTitleFieldId(rubric){
    if (!rubric || !Array.isArray(rubric.fields)) return null;
    const titleField = rubric.fields.find((field) => field && field.id === 'title');
    return titleField ? titleField.id : null;
  }

  function extractTitle(rubric, file, titleFieldId){
    if (!file || !file.values || !titleFieldId) return '';
    const raw = file.values[titleFieldId];
    if (typeof raw === 'string'){ return raw; }
    if (raw == null){ return ''; }
    if (typeof raw === 'number' || typeof raw === 'boolean'){ return String(raw); }
    return '';
  }

  function collectMatches(query){
    const trimmed = query == null ? '' : String(query).trim();
    if (!trimmed){
      return [];
    }
    const normalizedQuery = normalizeText(trimmed);
    if (!normalizedQuery){
      return [];
    }
    const state = loadState();
    if (!state || !Array.isArray(state.rubrics) || !state.rubrics.length){
      return [];
    }
    const matches = [];
    state.rubrics.forEach((rubric) => {
      if (!rubric || !Array.isArray(rubric.files) || !rubric.files.length){
        return;
      }
      const titleFieldId = getRubricTitleFieldId(rubric);
      if (!titleFieldId){
        return;
      }
      const baseRubricId = rubric && rubric.id ? String(rubric.id) : null;
      if (!baseRubricId){
        return;
      }
      const rubricName = rubric && rubric.name ? String(rubric.name) : 'Рубрика';
      rubric.files.forEach((file) => {
        if (!file) return;
        const fileId = file && file.id ? String(file.id) : null;
        const rubricId = file && file.rubricId ? String(file.rubricId) : baseRubricId;
        if (!fileId || !rubricId){
          return;
        }
        const title = extractTitle(rubric, file, titleFieldId);
        if (!title){
          return;
        }
        if (normalizeText(title).includes(normalizedQuery)){
          matches.push({
            rubricId,
            fileId,
            title,
            rubricName
          });
        }
      });
    });
    return matches;
  }

  function resetCache(){
    cachedState = null;
    cachedLogin = null;
    cachedKey = null;
    indexedCache.clear();
    indexedPromises.clear();
    dbPromise = null;
    hideAll();
  }

  function onDocumentPointerDown(event){
    const target = event.target;
    if (components.some((component) => component.wrap.contains(target))){
      return;
    }
    hideAll();
  }

  document.addEventListener('pointerdown', onDocumentPointerDown);

  window.addEventListener('storage', (event) => {
    if (!event.key){
      return;
    }
    if (event.key === cachedKey || event.key === AUTH_KEY || event.key.startsWith(STORAGE_KEY_PREFIX)){
      resetCache();
      refreshAll();
    }
  });

  globalApi.refresh = () => {
    refreshAll();
  };
  globalApi.hide = () => {
    hideAll();
  };
  globalApi.resetCache = resetCache;
  globalApi.setActiveState = setActiveStateExternal;
})();
