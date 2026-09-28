const INN_PATTERN = /^(\d{10}|\d{12})$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d{10,15}$/;
const RATING_PATTERN = /^\d{1,2}(\.\d)?$/;

export const MAX_RATING = 10;

const TEXT_LIMITS = [
  { field: 'name', label: 'Наименование', limit: 255 },
  { field: 'directorName', label: 'ФИО директора', limit: 255 },
  { field: 'email', label: 'Email', limit: 255 },
  { field: 'legalAddress', label: 'Адрес', limit: 500 },
];

function toText(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
}

function toOptionalText(value) {
  const text = toText(value);
  return text === '' ? null : text;
}

function parseRating(value) {
  const text = toText(value);
  if (text === '') {
    return null;
  }
  if (!RATING_PATTERN.test(text)) {
    return Number.NaN;
  }
  return Number(text);
}

export function parsePartnerInput(body) {
  const partner = {
    partnerTypeId: Number(toText(body.partnerTypeId)),
    name: toText(body.name),
    directorName: toOptionalText(body.directorName),
    email: toText(body.email),
    phone: toOptionalText(body.phone),
    inn: toText(body.inn),
    legalAddress: toOptionalText(body.legalAddress),
    rating: parseRating(body.rating),
  };

  if (partner.name === '') {
    return { error: 'Укажите наименование партнёра.' };
  }
  if (!Number.isInteger(partner.partnerTypeId) || partner.partnerTypeId <= 0) {
    return { error: 'Выберите тип партнёра из списка.' };
  }
  if (!INN_PATTERN.test(partner.inn)) {
    return { error: 'ИНН должен состоять из 10 или 12 цифр.' };
  }
  if (Number.isNaN(partner.rating) || partner.rating > MAX_RATING) {
    return { error: `Рейтинг должен быть числом от 0 до ${MAX_RATING} с одним знаком после точки.` };
  }
  if (partner.phone !== null && !PHONE_PATTERN.test(partner.phone)) {
    return { error: 'Телефон должен быть в формате +79991234567.' };
  }
  if (!EMAIL_PATTERN.test(partner.email)) {
    return { error: 'Укажите email в формате имя@домен.ru.' };
  }
  for (const { field, label, limit } of TEXT_LIMITS) {
    if (partner[field] !== null && partner[field].length > limit) {
      return { error: `Поле «${label}» не должно быть длиннее ${limit} символов.` };
    }
  }
  return { partner };
}
