import { en, type MessageKey } from './en';
import { fr } from './fr';

export type { MessageKey };

const DICTIONARIES = { en, fr } as const;

export type Locale = keyof typeof DICTIONARIES;

export const LOCALES = Object.keys(DICTIONARIES) as readonly Locale[];

let current: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function setLocale(locale: Locale): void {
  current = locale;
}

export function getLocale(): Locale {
  return current;
}

/** Translates a key, falling back to English, and fills {placeholders}. */
export function t(key: MessageKey, params: Readonly<Record<string, string | number>> = {}): string {
  const dictionary: Partial<Record<MessageKey, string>> = DICTIONARIES[current];
  const template = dictionary[key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** Lists the {placeholders} of a template, sorted. Used by tests. */
export function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();
}

export { en, fr };
