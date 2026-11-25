import { afterEach, describe, expect, it } from 'vitest';
import { en, fr, placeholders, setLocale, t, type MessageKey } from './index';

afterEach(() => setLocale('en'));

describe('t', () => {
  it('fills placeholders', () => {
    expect(t('calendar.date', { season: 'Spring', day: 3, year: 1 })).toBe('Spring, day 3, year 1');
  });

  it('uses the current locale', () => {
    setLocale('fr');
    expect(t('resource.sap')).toBe('Sève');
  });

  it('leaves unknown placeholders visible', () => {
    expect(t('journal.welcomeBack')).toContain('{duration}');
  });
});

describe('dictionaries', () => {
  it('use the same placeholders in every language', () => {
    for (const [key, text] of Object.entries(fr)) {
      expect(placeholders(text), key).toEqual(placeholders(en[key as MessageKey]));
    }
  });
});
