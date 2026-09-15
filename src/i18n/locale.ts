export const SUPPORTED_LOCALES = ['en', 'ja'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Normalizes an arbitrary locale-ish string (e.g. "ja-JP", "en_US") to a supported Locale, falling back to the default. */
export function resolveLocale(input?: string | null): Locale {
  if (!input) return DEFAULT_LOCALE;
  const normalized = input.trim().toLowerCase().split(/[-_]/)[0];
  return isSupportedLocale(normalized) ? normalized : DEFAULT_LOCALE;
}
