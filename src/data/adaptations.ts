import type { DiscoveryId } from './discoveries';
import type { Amounts } from './resources';

/** One-off upgrades, the equivalent of Kittens Game's workshop (docs/design.md, "Adaptations"). */

export const ADAPTATION_IDS = [
  'taproots',
  'waxyLeaves',
  'dormantBuds',
  'lateBlooming',
  'thickBark',
  'deepMycorrhizae',
  'territorialSong',
] as const;
export type AdaptationId = (typeof ADAPTATION_IDS)[number];

export interface AdaptationDef {
  readonly cost: Amounts;
  readonly requires: readonly DiscoveryId[];
  readonly storageMultiplier: Amounts;
  readonly productionMultiplier: Amounts;
  /** Multiplier on water drunk in summer. */
  readonly summerDrinking: number;
  /** Multiplier on Sap in winter. */
  readonly winterSap: number;
  /** Flowers ignore late frost. */
  readonly frostProof: boolean;
  /** Share of bark beetle damage prevented. */
  readonly beetleShield: number;
  /** Sap bonus per adult tree, for every plant. */
  readonly sapPerTree: number;
  /** Share taken off the price of Calls. */
  readonly callDiscount: number;
}

const BASE = {
  requires: ['lignification'],
  storageMultiplier: {},
  productionMultiplier: {},
  summerDrinking: 1,
  winterSap: 1,
  frostProof: false,
  beetleShield: 0,
  sapPerTree: 0,
  callDiscount: 0,
} as const satisfies Omit<AdaptationDef, 'cost'>;

export const ADAPTATIONS: Readonly<Record<AdaptationId, AdaptationDef>> = {
  taproots: { ...BASE, cost: { humus: 300, sap: 200 }, storageMultiplier: { water: 1.25 } },
  waxyLeaves: { ...BASE, cost: { resin: 100, seeds: 500 }, summerDrinking: 0.7 },
  dormantBuds: { ...BASE, cost: { seeds: 400, spores: 50 }, winterSap: 2 },
  lateBlooming: { ...BASE, cost: { nectar: 250 }, frostProof: true },
  thickBark: { ...BASE, cost: { resin: 200 }, beetleShield: 0.5 },
  deepMycorrhizae: {
    ...BASE,
    cost: { spores: 1000, humus: 500 },
    requires: ['mycorrhizae'],
    sapPerTree: 0.01,
  },
  territorialSong: {
    ...BASE,
    cost: { songs: 100 },
    productionMultiplier: { songs: 1.25 },
    callDiscount: 0.2,
  },
};
