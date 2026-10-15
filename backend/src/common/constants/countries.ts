/** Страны для профиля блогера/рекламодателя и фильтров поиска */
export const COUNTRIES = [
  { code: 'RU', name: 'Россия' },
  { code: 'BY', name: 'Беларусь' },
  { code: 'KZ', name: 'Казахстан' },
  { code: 'UA', name: 'Украина' },
  { code: 'UZ', name: 'Узбекистан' },
  { code: 'KG', name: 'Кыргызстан' },
  { code: 'TJ', name: 'Таджикистан' },
  { code: 'AM', name: 'Армения' },
  { code: 'AZ', name: 'Азербайджан' },
  { code: 'GE', name: 'Грузия' },
  { code: 'MD', name: 'Молдова' },
  { code: 'TM', name: 'Туркменистан' },
  { code: 'TR', name: 'Турция' },
  { code: 'AE', name: 'ОАЭ' },
  { code: 'US', name: 'США' },
  { code: 'DE', name: 'Германия' },
  { code: 'PL', name: 'Польша' },
  { code: 'IL', name: 'Израиль' },
  { code: 'OTHER', name: 'Другая' },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]['code'];

export function isValidCountryCode(code?: string | null): boolean {
  if (!code) return false;
  return COUNTRIES.some((c) => c.code === code);
}
