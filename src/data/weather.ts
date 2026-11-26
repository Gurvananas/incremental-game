import type { Season } from './time';

/** Daily weather (docs/design.md, "Météo du jour"). Drawn one day ahead, so threats are announced. */

export const WEATHER_KINDS = [
  'clear',
  'rain',
  'fog',
  'heatwave',
  'lateFrost',
  'thunderstorm',
  'storm',
] as const;
export type WeatherKind = (typeof WEATHER_KINDS)[number];

export interface WeatherDef {
  /** How likely this weather is in each season (relative weights, 0 = never). */
  readonly weight: Readonly<Record<Season, number>>;
  /** Duration in game days, drawn between these bounds. */
  readonly minDays: number;
  readonly maxDays: number;
  readonly rain: number;
  readonly spores: number;
  readonly sap: number;
  /** Multiplier on the water plants drink. */
  readonly drinking: number;
  readonly nectar: number;
  /** Lightning may strike on these days. */
  readonly lightning: boolean;
  /** Old trees may fall on these days. */
  readonly windfall: boolean;
  /** A threat: announced in the journal the day before. */
  readonly notable: boolean;
}

const CALM = {
  minDays: 2,
  maxDays: 10,
  rain: 1,
  spores: 1,
  sap: 1,
  drinking: 1,
  nectar: 1,
  lightning: false,
  windfall: false,
  notable: false,
} as const;

export const WEATHER: Readonly<Record<WeatherKind, WeatherDef>> = {
  clear: { ...CALM, weight: { spring: 5, summer: 6, autumn: 4, winter: 6 } },
  rain: { ...CALM, weight: { spring: 4, summer: 2, autumn: 4, winter: 2 }, rain: 2 },
  fog: {
    ...CALM,
    weight: { spring: 1, summer: 0, autumn: 2, winter: 2 },
    spores: 1.5,
  },
  heatwave: {
    ...CALM,
    weight: { spring: 0, summer: 2, autumn: 0, winter: 0 },
    minDays: 3,
    maxDays: 8,
    sap: 1.2,
    drinking: 2,
    notable: true,
  },
  lateFrost: {
    ...CALM,
    weight: { spring: 1, summer: 0, autumn: 0, winter: 0 },
    minDays: 1,
    maxDays: 3,
    nectar: 0,
    notable: true,
  },
  thunderstorm: {
    ...CALM,
    weight: { spring: 0.5, summer: 1.5, autumn: 0, winter: 0 },
    minDays: 1,
    maxDays: 2,
    rain: 2,
    lightning: true,
    notable: true,
  },
  storm: {
    ...CALM,
    weight: { spring: 0, summer: 0, autumn: 1.5, winter: 0 },
    minDays: 1,
    maxDays: 2,
    windfall: true,
    notable: true,
  },
};

/** Mast years: oaks and hazels fruit together every 2 to 5 years. */
export const MAST_YEARS_MIN = 2;
export const MAST_YEARS_MAX = 5;
export const MAST_SEED_MULTIPLIER = 3;
