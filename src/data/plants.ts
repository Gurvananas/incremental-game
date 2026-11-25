import type { DiscoveryId } from './discoveries';
import type { Amounts } from './resources';

/**
 * Plantations (the "buildings"). Values from docs/design.md, "Structures : les plantations",
 * tuned with the simulator for v0.1 (see docs/decisions.md).
 */

export const PLANT_IDS = ['grass', 'moss', 'lichen', 'clover'] as const;
export type PlantId = (typeof PLANT_IDS)[number];

export interface Requirement {
  /** Plantations owned, seedlings included. */
  readonly plants?: Readonly<Partial<Record<PlantId, number>>>;
  readonly discoveries?: readonly DiscoveryId[];
}

export interface PlantDef {
  /** Price of the first one. */
  readonly cost: Amounts;
  /** Price multiplier for each one already owned. */
  readonly costGrowth: number;
  /** Game days from planting to adulthood; 0 means adult at once. */
  readonly growthDays: number;
  /** Per adult, per real second, before multipliers. */
  readonly produces: Amounts;
  /** Water drunk per plantation (seedlings too), per real second. */
  readonly drinks: number;
  /** Storage added by each adult. */
  readonly storage: Amounts;
  /** Added to the Sap multiplier of every plant, per adult (nitrogen). */
  readonly sapBonus: number;
  /** When the plantation appears in the list. */
  readonly requires: Requirement;
}

export const PLANTS: Readonly<Record<PlantId, PlantDef>> = {
  grass: {
    cost: { sap: 10 },
    costGrowth: 1.15,
    growthDays: 10,
    produces: { sap: 0.2 },
    drinks: 0.05,
    storage: { sap: 5 },
    sapBonus: 0,
    requires: {},
  },
  moss: {
    cost: { sap: 15 },
    costGrowth: 1.15,
    growthDays: 0,
    produces: { water: 0.02 },
    drinks: 0,
    storage: { water: 50, sap: 5 },
    sapBonus: 0,
    requires: { plants: { grass: 1 } },
  },
  lichen: {
    cost: { sap: 25 },
    costGrowth: 1.15,
    growthDays: 0,
    produces: { humus: 0.01, spores: 0.012 },
    drinks: 0,
    storage: { sap: 5 },
    sapBonus: 0,
    requires: { plants: { grass: 2 } },
  },
  clover: {
    cost: { sap: 40, humus: 5 },
    costGrowth: 1.15,
    growthDays: 20,
    produces: {},
    drinks: 0,
    storage: { sap: 5 },
    sapBonus: 0.05,
    requires: { discoveries: ['symbiosis'] },
  },
};
