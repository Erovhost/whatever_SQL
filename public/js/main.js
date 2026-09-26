import { showError } from './dialog.js';

const stateElement = document.getElementById('state');
const partnersElement = document.getElementById('partners');
const searchElement = document.getElementById('search');

let loadedPartners = [];

function showState(message, isError) {
  stateElement.textContent = message;
  stateElement.className = isError ? 'state state--error' : 'state';
  stateElement.hidden = false;
}

function hideState() {
  stateElement.hidden = true;
}

function buildDetail(text) {
  const element = document.createElement('p');
  element.className = 'card__detail';
  element.textContent = text;
  return element;
}

// +79991112233 → +7 999 111 22 33, как на макете; прочие форматы выводятся без изменений.
function formatPhone(phone) {
  const match = /^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  if (match === null) {
    return phone;
  }
  return `+7 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
}

function buildCard(partner) {
  // Карточка — ссылка на форму редактирования, ID партнёра передаётся в адресе.
  const card = document.createElement('a');
  card.className = 'card';
  card.href = `partner-edit.html?id=${partner.partnerId}`;

  const info = document.createElement('div');

  const title = document.createElement('h2');
  title.className = 'card__title';
  title.textContent = `${partner.partnerType ?? 'Тип не указан'} | ${partner.name}`;

  info.append(
    title,
    buildDetail(partner.directorName ?? 'Директор не указан'),
    buildDetail(partner.phone === null ? 'Телефон не указан' : formatPhone(partner.phone)),
    buildDetail(`Рейтинг: ${partner.rating ?? 'нет оценки'}`),
  );

  const discount = document.createElement('span');
  discount.className = 'card__discount';
  discount.textContent = `${partner.discountPercent}%`;

  card.append(info, discount);
  return card;
}

function render(partners) {
  partnersElement.replaceChildren(...partners.map(buildCard));
  if (partners.length === 0) {
    showState('Партнёры не найдены.', false);
    return;
  }
  hideState();
}

function applySearch() {
  const query = searchElement.value.trim().toLowerCase();
  if (query === '') {
    render(loadedPartners);
    return;
  }
  const filtered = loadedPartners.filter((partner) => {
    const haystack = `${partner.name} ${partner.inn} ${partner.phone ?? ''}`.toLowerCase();
    return haystack.includes(query);
  });
  render(filtered);
}

async function loadPartners() {
  showState('Загрузка данных...', false);
  partnersElement.replaceChildren();
  let response;
  try {
    response = await fetch('/api/partners');
  } catch {
    showLoadError(
      'Сервер приложения не отвечает.\n\n' +
        'Что сделать:\n' +
        '1. Убедитесь, что сервер приложения запущен (команда npm start).\n' +
        '2. Проверьте подключение к сети.\n' +
        '3. Обновите страницу.',
    );
    return;
  }
  if (response.status === 503) {
    showLoadError(
      'База данных недоступна.\n\n' +
        'Что сделать:\n' +
        '1. Убедитесь, что сервер базы данных MySQL запущен.\n' +
        '2. Обновите страницу через несколько секунд.\n' +
        '3. Если ошибка повторяется, обратитесь к администратору.',
    );
    return;
  }
  if (!response.ok) {
    showLoadError(`Сервер ответил с кодом ${response.status}.\n\nОбновите страницу. Если ошибка повторяется, обратитесь к администратору.`);
    return;
  }
  loadedPartners = await response.json();
  applySearch();
}

function showLoadError(message) {
  showState('Не удалось загрузить список партнёров. Обновите страницу.', true);
  showError('Ошибка загрузки данных', message);
}

const SEARCH_STORAGE_KEY = 'crm.partnerSearch';

// Поиск хранится в sessionStorage, чтобы пережить переход в карточку и обратно.
// Если хранилище недоступно (например, запрещено настройками браузера), поиск просто не запоминается.
function restoreSearch() {
  try {
    searchElement.value = sessionStorage.getItem(SEARCH_STORAGE_KEY) ?? '';
  } catch {
    searchElement.value = '';
  }
}

function saveSearch() {
  try {
    sessionStorage.setItem(SEARCH_STORAGE_KEY, searchElement.value);
  } catch {
    return;
  }
}

searchElement.addEventListener('input', () => {
  saveSearch();
  applySearch();
});

// Браузерная кнопка «Назад» может показать страницу из кэша со старым списком.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    loadPartners();
  }
});

restoreSearch();
loadPartners();
