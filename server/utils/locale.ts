// server/utils/locale.ts

import type { H3Event } from "h3";

export const SUPPORTED_LOCALES = ["en", "vi"] as const;
export const DEFAULT_LOCALE: Locale = "en";

export type Locale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: unknown): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function resolveLocale(event: H3Event): Locale {
  const rawLocale = getQuery(event).locale;

  return isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
}
