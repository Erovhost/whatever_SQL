const stateElement = document.getElementById('state');
const titleElement = document.getElementById('form-title');
const formElement = document.getElementById('partner-form');
const backButton = document.getElementById('back');
const saveButton = document.getElementById('save');
const fields = formElement.elements;

// ID партнёра приходит с главной формы в адресе (?id=5); без него карточка открывается пустой.
const partnerId = new URLSearchParams(window.location.search).get('id');
const isEditMode = partnerId !== null;

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

async function fetchJson(url) {
  const response = await fetch(url);
  if (response.status === 404) {
    throw new Error('партнёр не найден, возможно, он был удалён');
  }
  if (!response.ok) {
    throw new Error(`сервер ответил ${response.status}`);
  }
  return response.json();
}

async function loadPartnerTypes() {
  const partnerTypes = await fetchJson('/api/partner-types');
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

async function init() {
  applyMode();
  try {
    // Справочник грузится раньше данных партнёра: иначе select не найдёт option с его типом.
    await loadPartnerTypes();
    if (isEditMode) {
      const partner = await fetchJson(`/api/partners/${encodeURIComponent(partnerId)}`);
      fillForm(partner);
    }
    hideState();
    formElement.hidden = false;
    saveButton.hidden = false;
  } catch (error) {
    showState(
      `Не удалось открыть карточку: ${error.message}. ` +
        'Вернитесь к списку партнёров и попробуйте ещё раз.',
      true,
    );
  }
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

async function sendPartner(partner) {
  const url = isEditMode ? `/api/partners/${encodeURIComponent(partnerId)}` : '/api/partners';
  const response = await fetch(url, {
    method: isEditMode ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partner),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `сервер ответил ${response.status}`);
  }
}

async function savePartner(event) {
  event.preventDefault();
  saveButton.disabled = true;
  showState('Сохранение...', false);
  try {
    await sendPartner(collectForm());
    // replace, а не href: кнопка «Назад» браузера не должна возвращать в уже сохранённую карточку.
    window.location.replace('index.html');
  } catch (error) {
    showState(`Не удалось сохранить партнёра. ${error.message}`, true);
    saveButton.disabled = false;
  }
}

formElement.addEventListener('submit', savePartner);

backButton.addEventListener('click', () => {
  window.location.href = 'index.html';
});

init();
