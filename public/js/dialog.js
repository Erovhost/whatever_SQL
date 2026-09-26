// Модальные окна вместо alert/confirm: у нативных нельзя задать заголовок и значок.
// Каждая функция возвращает Promise, который выполняется после закрытия окна.

const ICONS = {
  error: `<svg viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="15" fill="#c42b1c"/>
    <path d="M11 11l10 10M21 11L11 21" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
  </svg>`,
  warning: `<svg viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 2.5L30.5 28.5H1.5Z" fill="#f7c948" stroke="#9c7a00" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M16 11v9" stroke="#000000" stroke-width="3" stroke-linecap="round"/>
    <circle cx="16" cy="24" r="1.8" fill="#000000"/>
  </svg>`,
  info: `<svg viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="15" fill="#0067c0"/>
    <circle cx="16" cy="9.5" r="2" fill="#ffffff"/>
    <path d="M16 14v10" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
  </svg>`,
};

let dialogCounter = 0;

function openDialog({ type, title, message, buttons, cancelValue }) {
  dialogCounter += 1;
  const titleId = `dialog-title-${dialogCounter}`;
  const messageId = `dialog-message-${dialogCounter}`;

  const dialog = document.createElement('dialog');
  dialog.className = `dialog dialog--${type}`;
  dialog.setAttribute('role', 'alertdialog');
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.setAttribute('aria-describedby', messageId);

  const form = document.createElement('form');
  form.method = 'dialog';

  const titleElement = document.createElement('h2');
  titleElement.className = 'dialog__title';
  titleElement.id = titleId;
  titleElement.textContent = title;

  const body = document.createElement('div');
  body.className = 'dialog__body';

  const icon = document.createElement('span');
  icon.className = 'dialog__icon';
  icon.innerHTML = ICONS[type];

  const messageElement = document.createElement('p');
  messageElement.className = 'dialog__message';
  messageElement.id = messageId;
  messageElement.textContent = message;

  body.append(icon, messageElement);

  const actions = document.createElement('div');
  actions.className = 'dialog__actions';
  for (const { label, value, isDefault } of buttons) {
    const button = document.createElement('button');
    button.className = 'button';
    button.value = value;
    button.textContent = label;
    button.autofocus = isDefault === true;
    actions.append(button);
  }

  form.append(titleElement, body, actions);
  dialog.append(form);
  document.body.append(dialog);

  return new Promise((resolve) => {
    // Esc закрывает окно с пустым returnValue — считаем это нажатием «безопасной» кнопки.
    dialog.addEventListener('close', () => {
      const result = dialog.returnValue === '' ? cancelValue : dialog.returnValue;
      dialog.remove();
      resolve(result);
    });
    dialog.showModal();
  });
}

export async function showError(title, message) {
  await openDialog({
    type: 'error',
    title,
    message,
    buttons: [{ label: 'ОК', value: 'ok', isDefault: true }],
    cancelValue: 'ok',
  });
}

export async function showInfo(title, message) {
  await openDialog({
    type: 'info',
    title,
    message,
    buttons: [{ label: 'ОК', value: 'ok', isDefault: true }],
    cancelValue: 'ok',
  });
}

// true — пользователь подтвердил действие, false — отказался. По умолчанию фокус на отказе.
export async function showWarning(title, message, confirmLabel, cancelLabel) {
  const result = await openDialog({
    type: 'warning',
    title,
    message,
    buttons: [
      { label: confirmLabel, value: 'confirm' },
      { label: cancelLabel, value: 'cancel', isDefault: true },
    ],
    cancelValue: 'cancel',
  });
  return result === 'confirm';
}
