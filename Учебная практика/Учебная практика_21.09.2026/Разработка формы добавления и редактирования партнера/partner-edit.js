import { showError, showInfo, showWarning } from './dialog.js';

const stateElement = document.getElementById('state');
const titleElement = document.getElementById('form-title');
const formElement = document.getElementById('partner-form');
const backButton = document.getElementById('back');
const saveButton = document.getElementById('save');
const fields = formElement.elements;

// ID партнёра приходит с главной формы в адресе (?id=5); без него карточка открывается пустой.
const partnerId = new URLSearchParams(window.location.search).get('id');
const isEditMode = partnerId !== null;

const INN_PATTERN = /^(\d{10}|\d{12})$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d{10,15}$/;
const RATING_PATTERN = /^\d{1,2}(\.\d)?$/;
const MAX_RATING = 10;

const DB_UNAVAILABLE_STEPS =
  'Что сделать:\n' +
  '1. Убедитесь, что сервер базы данных MySQL запущен.\n' +
  '2. Повторите попытку через несколько секунд.\n' +
  '3. Если ошибка повторяется, обратитесь к администратору.';

const SERVER_UNREACHABLE_STEPS =
  'Что сделать:\n' +
  '1. Убедитесь, что сервер приложения запущен (команда npm start).\n' +
  '2. Проверьте подключение к сети.\n' +
  '3. Повторите попытку.';

let savedSnapshot = '';
let isLeaving = false;

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

class RequestError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function showState(message, isError) {
  stateElement.textContent = message;
  stateElement.className = isError ? 'state state--error' : 'state';
  stateElement.hidden = false;
}

function hideState() {
  stateElement.hidden = true;
}

function applyMode() {
  const modeName = isEditMode ? 'Редактирование' : 'Добавление';
  document.title = `CRM: Карточка партнёра [${modeName}]`;
  titleElement.textContent = `Карточка партнёра: ${modeName.toLowerCase()}`;
}

async function request(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new RequestError('Сервер приложения не отвечает.', 0);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new RequestError(body.error ?? `Сервер ответил с кодом ${response.status}.`, response.status);
  }
  return response.json();
}

function describeRequestError(error, fixHint) {
  if (error.status === 0) {
    return `${error.message}\n\n${SERVER_UNREACHABLE_STEPS}`;
  }
  if (error.status === 503) {
    return `${error.message}\n\n${DB_UNAVAILABLE_STEPS}`;
  }
  return `${error.message}\n\n${fixHint}`;
}

async function loadPartnerTypes() {
  const partnerTypes = await request('/api/partner-types');
  // В value кладётся ID из справочника partner_types — он уйдёт в БД как внешний ключ.
  const options = partnerTypes.map((type) => new Option(type.name, String(type.partnerTypeId)));
  fields.partnerTypeId.append(...options);
}

function fillForm(partner) {
  fields.name.value = partner.name;
  fields.partnerTypeId.value = String(partner.partnerTypeId);
  fields.inn.value = partner.inn;
  fields.rating.value = partner.rating ?? '';
  fields.legalAddress.value = partner.legalAddress ?? '';
  fields.directorName.value = partner.directorName ?? '';
  fields.phone.value = partner.phone ?? '';
  fields.email.value = partner.email;
}

function collectForm() {
  return {
    name: fields.name.value,
    partnerTypeId: fields.partnerTypeId.value,
    inn: fields.inn.value,
    rating: fields.rating.value,
    legalAddress: fields.legalAddress.value,
    directorName: fields.directorName.value,
    phone: fields.phone.value,
    email: fields.email.value,
  };
}

// Снимок полей после загрузки: сравнение с ним показывает, есть ли несохранённые изменения.
function takeSnapshot() {
  return JSON.stringify(collectForm());
}

function hasUnsavedChanges() {
  return !formElement.hidden && takeSnapshot() !== savedSnapshot;
}

function validateRating() {
  // Для type="number" браузер отдаёт пустое value, если введено не число (например, «4,8,1» или «abc»).
  if (fields.rating.validity.badInput) {
    return false;
  }
  const rating = fields.rating.value.trim();
  if (rating === '') {
    return true;
  }
  return RATING_PATTERN.test(rating) && Number(rating) <= MAX_RATING;
}

function validateForm(partner) {
  if (partner.name.trim() === '') {
    throw new ValidationError(
      'Не заполнено поле «Наименование».\n\nВведите наименование партнёра и повторите сохранение.',
      'name',
    );
  }
  if (partner.partnerTypeId === '') {
    throw new ValidationError(
      'Не выбран тип партнёра.\n\nВыберите тип (ООО, ИП и т.д.) из выпадающего списка и повторите сохранение.',
      'partnerTypeId',
    );
  }
  if (!INN_PATTERN.test(partner.inn.trim())) {
    throw new ValidationError(
      'ИНН должен состоять из 10 цифр (организация) или 12 цифр (ИП).\n\n' +
        'Удалите пробелы, буквы и знаки препинания и повторите попытку.',
      'inn',
    );
  }
  if (!validateRating()) {
    throw new ValidationError(
      `Рейтинг должен быть числом от 0 до ${MAX_RATING} с одним знаком после точки, например 4.8.\n\n` +
        'Удалите знак минус, лишние цифры и знаки препинания и повторите попытку. Если оценки нет, оставьте поле пустым.',
      'rating',
    );
  }
  if (partner.phone.trim() !== '' && !PHONE_PATTERN.test(partner.phone.trim())) {
    throw new ValidationError(
      'Телефон указан в неверном формате.\n\n' +
        'Введите номер в формате +79991234567: от 10 до 15 цифр без пробелов, скобок и дефисов.',
      'phone',
    );
  }
  if (partner.email.trim() === '') {
    throw new ValidationError(
      'Не заполнено поле «Email компании».\n\nВведите адрес электронной почты, например info@company.ru.',
      'email',
    );
  }
  if (!EMAIL_PATTERN.test(partner.email.trim())) {
    throw new ValidationError(
      'Email указан в неверном формате.\n\nВведите адрес вида имя@домен.ru, например info@company.ru.',
      'email',
    );
  }
}

async function sendPartner(partner) {
  const url = isEditMode ? `/api/partners/${encodeURIComponent(partnerId)}` : '/api/partners';
  await request(url, {
    method: isEditMode ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partner),
  });
}

function leaveToMainWindow() {
  isLeaving = true;
  // replace, а не href: кнопка «Назад» браузера не должна возвращать в уже сохранённую карточку.
  window.location.replace('index.html');
}

async function savePartner(event) {
  event.preventDefault();
  const partner = collectForm();
  saveButton.disabled = true;
  try {
    validateForm(partner);
    await sendPartner(partner);
    savedSnapshot = takeSnapshot();
    const action = isEditMode ? 'сохранены' : 'добавлены в базу';
    await showInfo('Партнёр сохранён', `Данные партнёра «${partner.name.trim()}» успешно ${action}.`);
    leaveToMainWindow();
  } catch (error) {
    if (error instanceof ValidationError) {
      await showError('Ошибка ввода данных', error.message);
      fields[error.field].focus();
    } else if (error instanceof RequestError) {
      await showError(
        'Ошибка сохранения',
        describeRequestError(error, 'Исправьте данные и нажмите «Сохранить» ещё раз. Введённые данные не потеряны.'),
      );
    } else {
      console.error(error);
      await showError('Ошибка сохранения', `Непредвиденная ошибка: ${error.message}\n\nПовторите попытку.`);
    }
  } finally {
    saveButton.disabled = false;
  }
}

// Если карточку открыли с главной формы, возвращаемся по истории: браузер сохранит прокрутку списка
// и не оставит в истории лишний переход. Если карточку открыли по прямой ссылке — просто на главную.
function goBack() {
  isLeaving = true;
  const cameFromApp = document.referrer !== '' && new URL(document.referrer).origin === window.location.origin;
  if (cameFromApp && window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.href = 'index.html';
}

async function handleBack() {
  if (hasUnsavedChanges()) {
    const isConfirmed = await showWarning(
      'Несохранённые изменения',
      'В карточке есть несохранённые изменения.\n\n' +
        'Если вернуться к списку, они будут безвозвратно потеряны. Эту операцию нельзя отменить.\n\n' +
        'Вернуться без сохранения?',
      'Вернуться без сохранения',
      'Остаться',
    );
    if (!isConfirmed) {
      return;
    }
  }
  goBack();
}

async function init() {
  applyMode();
  try {
    // Справочник грузится раньше данных партнёра: иначе select не найдёт option с его типом.
    await loadPartnerTypes();
    if (isEditMode) {
      const partner = await request(`/api/partners/${encodeURIComponent(partnerId)}`);
      fillForm(partner);
    }
    savedSnapshot = takeSnapshot();
    hideState();
    formElement.hidden = false;
    saveButton.hidden = false;
  } catch (error) {
    const message = error.status === 404
      ? 'Партнёр не найден, возможно, он был удалён.\n\nВернитесь к списку партнёров и выберите партнёра заново.'
      : describeRequestError(error, 'Вернитесь к списку партнёров и попробуйте открыть карточку ещё раз.');
    showState('Не удалось открыть карточку партнёра.', true);
    await showError('Ошибка загрузки', message);
  }
}

formElement.addEventListener('submit', savePartner);

backButton.addEventListener('click', handleBack);

// Закрытие вкладки или переход по адресной строке: браузер покажет своё предупреждение.
window.addEventListener('beforeunload', (event) => {
  if (!isLeaving && hasUnsavedChanges()) {
    event.preventDefault();
    event.returnValue = '';
  }
});

init();
