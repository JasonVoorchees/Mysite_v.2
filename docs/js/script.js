
// populate 10 sample news and wire toggle (only small targeted changes)
const newsData = [
  {
    title: 'Знакомство с Trezo',
    preview: 'Trezo помогает собирать и систематизировать личную коллекцию в одном интерфейсе.',
    full: 'Trezo — цифровое пространство для хранения воспоминаний и материалов. Создавайте рубрики, описывайте экспонаты и возвращайтесь к ним с любого устройства под своей учетной записью.'
  },
  {
    title: 'Стартовая страница',
    preview: 'Главный экран встречает слоганами и кнопкой «Начать», которая ведёт к регистрации.',
    full: 'На стартовой странице представлены сменяющиеся подсказки о возможностях сервиса. Нажмите «Начать», чтобы открыть форму регистрации и сразу перейти к созданию собственной коллекции.'
  },
  {
    title: 'Ваш архив',
    preview: 'Основной рабочий раздел: создавайте рубрики и добавляйте файлы с текстом и фото.',
    full: 'Во вкладке «Ваш архив» создавайте рубрики нужного типа, настраивайте поля и загружайте до пяти изображений для каждой записи. После сохранения все данные остаются в вашем профиле и доступны для поиска.'
  },
  {
    title: 'Профиль',
    preview: 'Здесь редактируется аватар, отображается логин и выполняется выход из аккаунта.',
    full: 'Во вкладке «Профиль» настройте изображение пользователя, управляйте персональными данными и контролируйте сессии. При выходе система уточнит действие, чтобы случайно не покинуть аккаунт.'
  },
  {
    title: 'Настройки',
    preview: 'Переключайте темы, управляйте приватностью профиля и дополнительными опциями.',
    full: 'Раздел «Настройки» позволяет менять светлую и тёмную темы, регулировать приватность профиля и быстро переходить к связанным страницам. Все изменения применяются сразу и сохраняются в браузере.'
  },
  {
    title: 'Магазин',
    preview: 'Подготовьте материалы для продажи и перенесите их из архива в витрину.',
    full: 'В разделе «Магазин» собраны инструменты для публикации предметов на продажу. Используйте данные из архива, чтобы формировать карточки товаров и отслеживать готовность к размещению.'
  },
  {
    title: 'Аукцион',
    preview: 'Организуйте торги: собирайте лоты и отслеживайте интерес к коллекции.',
    full: 'Во вкладке «Аукцион» можно готовить материалы к торгам, распределять их по этапам и анализировать историю продаж. Сюда удобно переносить записи прямо из архива.'
  },
  {
    title: 'Техническая информация',
    preview: 'Этот раздел содержит справочные материалы по работе со всеми страницами.',
    full: 'Страница «Техническая информация» заменяет новости и хранит инструкции по каждой вкладке. Здесь собраны подсказки по работе с архивом, профилем, настройками, поиском и экспортом данных.'
  }
];

const list = document.getElementById('newsList');
newsData.forEach(n=>{
  const card = document.createElement('article');
  card.className = 'news-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-expanded', 'false');
  card.innerHTML = `
    <div class="news-title">${n.title}</div>
    <div class="news-preview">${n.preview}</div>
    <div class="news-full">${n.full}</div>
    <div class="center-bar" aria-hidden="true"></div>
  `;
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleNewsCard(card);
    }
  });
  list.appendChild(card);
});

function toggleNewsCard(card){
  if (!card) return;
  const willExpand = !card.classList.contains('expanded');
  document.querySelectorAll('.news-card.expanded').forEach(c => {
    if (c !== card) {
      c.classList.remove('expanded');
      c.setAttribute('aria-expanded', 'false');
    }
  });

  if (willExpand) {
    card.classList.add('expanded');
    card.setAttribute('aria-expanded', 'true');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    card.classList.remove('expanded');
    card.setAttribute('aria-expanded', 'false');
  }
}

// toggle logic: open clicked card, close others
document.addEventListener('click', (e)=>{
  const card = e.target.closest('.news-card');
  if(card){
    toggleNewsCard(card);
  }
});

const root = document.documentElement;
const backLink = document.querySelector('[data-news-back]');
if (root && root.classList.contains('news-guest') && backLink) {
  backLink.hidden = false;
}

if (typeof window !== 'undefined' && window.__newsAuthed) {
  const pageTitle = document.querySelector('[data-page-title]');
  if (pageTitle) {
    pageTitle.textContent = 'Техническая информация';
  }
  document.querySelectorAll('.side-nav .side-btn').forEach(btn => {
    if (btn.textContent && btn.textContent.trim() === 'Инструкции по пользованию') {
      btn.remove();
    }
  });
}
