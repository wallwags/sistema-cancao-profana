// Shared validators and input masks — logic preserved exactly from app/v2/page.tsx
export const applyCpfMask = (val: string): string => {
  let value = val.replace(/\D/g, "");
  if (value.length > 11) value = value.substring(0, 11);
  value = value.replace(/(\d{3})(\d)/, "$1.$2");
  value = value.replace(/(\d{3})(\d)/, "$1.$2");
  value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return value;
};

export const applyDateMask = (val: string): string => {
  let value = val.replace(/\D/g, "");
  if (value.length > 8) value = value.substring(0, 8);
  value = value.replace(/(\d{2})(\d)/, "$1/$2");
  value = value.replace(/(\d{2})(\d)/, "$1/$2");
  return value;
};

export const applyPhoneMask = (val: string): string => {
  let value = val.replace(/\D/g, "");
  if (value.length > 11) value = value.substring(0, 11);
  if (value.length > 10) {
    value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  } else if (value.length > 5) {
    value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
  } else if (value.length > 2) {
    value = value.replace(/^(\d{2})(\d{0,5})$/, "($1) $2");
  } else {
    value = value.replace(/^(\d*)$/, "($1");
  }
  return value;
};

export const isValidCPF = (cpf: string): boolean => {
  const raw = cpf.replace(/[^\d]+/g, '');
  if (raw.length !== 11 || /^(\d)\1{10}$/.test(raw)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum += parseInt(raw.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(raw.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(raw.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(raw.substring(10, 11))) return false;
  return true;
};

export const isValidBirthDate = (dateStr: string): boolean => {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return false;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1920 || year > 2016) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;
  return true;
};

export const isValidWhatsApp = (phoneStr: string): boolean => {
  const raw = phoneStr.replace(/[^\d]+/g, '');
  if (raw.length !== 11) return false;
  if (raw[2] !== '9') return false;
  const ddd = parseInt(raw.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  return true;
};

export const isValidEmail = (emailStr: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
};
