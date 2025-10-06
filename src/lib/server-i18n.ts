import fs from 'fs';
import path from 'path';

export const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'pt';

export function getMessages(locale?: string) {
  const lc = (
    locale && SUPPORTED_LOCALES.includes(locale as Locale) ? locale : DEFAULT_LOCALE
  ) as Locale;
  const file = path.join(process.cwd(), 'public', 'locales', lc, 'common.json');
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
