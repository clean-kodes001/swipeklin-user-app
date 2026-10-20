// A calendar day (a birthday, a booking date) has no time and no timezone. A JS Date always
// has both. `new Date('1990-10-17')` is parsed as UTC midnight per spec, while every renderer
// in this app reads local getters — so at any negative UTC offset (all of Canada) a round trip
// through a Date silently moves the day. These functions are the only place that crossing is
// allowed to happen, and parseDateOnly/formatDateOnly are exact inverses so the round trip is
// idempotent in every timezone.

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY = /^(\d{1,2}):(\d{2})$/;

const pad = n => (n < 10 ? `0${n}` : `${n}`);

const valid = date => (date && !isNaN(date.getTime()) ? date : null);

export const parseDateOnly = value => {
  if (!value) return null;
  if (value instanceof Date) return valid(value);

  const str = String(value);
  if (DATE_ONLY.test(str)) {
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // An ISO datetime is a real instant — resolve it and let the local getters decide the day.
  return valid(new Date(str));
};

export const formatDateOnly = value => {
  const date = parseDateOnly(value);
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const parseTimeOnly = value => {
  if (!value) return null;
  if (value instanceof Date) return valid(value);

  const str = String(value);
  const match = TIME_ONLY.exec(str);
  if (match) {
    const date = new Date();
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return date;
  }

  return valid(new Date(str));
};
