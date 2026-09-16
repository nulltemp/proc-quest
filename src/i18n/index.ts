import type { Locale } from './locale.js';
import type { Messages } from './messages.js';
import { en } from './en.js';
import { ja } from './ja.js';

export { SUPPORTED_LOCALES, DEFAULT_LOCALE, resolveLocale } from './locale.js';
export type { Locale } from './locale.js';
export type { Messages } from './messages.js';

const MESSAGES: Record<Locale, Messages> = { en, ja };

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
