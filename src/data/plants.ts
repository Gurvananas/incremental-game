import type { DiscoveryId } from './discoveries';
import type { NicheAmounts } from './niches';
import type { Amounts } from './resources';

/**
 * Plantations (the "buildings"). Values from docs/design.md, "Structures : les plantations",
 * tuned with the simulator (see docs/decisions.md).
 */

export const PLANT_IDS = [
  'grass',
  'moss',
  'lichen',
  'clover',
  'flowers',
  'pond',
  'brambles',
  'bank',
  'hazel',
] as const;
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
  /** Habitat niches offered by each adult. */
  readonly niches: NicheAmounts;
  /** Added to the Sap multiplier of every plant, per adult (nitrogen). */
  readonly sapBonus: number;
  /** Share of the overgrazing that each adult prevents (thorny brambles). */
  readonly grazingShield: number;
  /** Weight of each adult in the plant half of the Balance index. 0 = not a living plant. */
  readonly biomass: number;
  /** When the plantation appears in the list. */
  readonly requires: Requirement;
}

const BASE = {
  costGrowth: 1.15,
  growthDays: 0,
  produces: {},
  drinks: 0,
  storage: {},
  niches: {},
  sapBonus: 0,
  grazingShield: 0,
  biomass: 0,
  requires: {},
} as const satisfies Omit<PlantDef, 'cost'>;

export const PLANTS: Readonly<Record<PlantId, PlantDef>> = {
  // Era I
  grass: {
    ...BASE,
    cost: { sap: 10 },
    growthDays: 10,
    produces: { sap: 0.2, litter: 0.01 },
    drinks: 0.05,
    storage: { sap: 5 },
    niches: { grassland: 1 },
    biomass: 0.1,
  },
  moss: {
    ...BASE,
    cost: { sap: 15 },
    produces: { water: 0.05 },
    storage: { water: 50, sap: 5 },
    biomass: 0.05,
    requires: { plants: { grass: 1 } },
  },
  lichen: {
    ...BASE,
    cost: { sap: 25 },
    produces: { humus: 0.01, spores: 0.012 },
    storage: { sap: 5, spores: 20 },
    biomass: 0.02,
    requires: { plants: { grass: 2 } },
  },
  clover: {
    ...BASE,
    cost: { sap: 40, humus: 5 },
    growthDays: 20,
    storage: { sap: 5, humus: 10 },
    niches: { soil: 1 },
    sapBonus: 0.05,
    biomass: 0.1,
    requires: { discoveries: ['symbiosis'] },
  },
  // Era II
  flowers: {
    ...BASE,
    cost: { sap: 60, seeds: 10 },
    growthDays: 100,
    produces: { nectar: 0.1, seeds: 0.02, insects: 0.01, litter: 0.02 },
    drinks: 0.05,
    storage: { sap: 5, nectar: 10, seeds: 10, insects: 5 },
    niches: { flower: 2 },
    biomass: 0.2,
    requires: { discoveries: ['flowering'] },
  },
  pond: {
    ...BASE,
    cost: { humus: 100, seeds: 50 },
    // Collects the runoff of the slope around it.
    produces: { water: 0.2 },
    storage: { water: 500 },
    requires: { discoveries: ['dispersal'] },
  },
  // Era III
  brambles: {
    ...BASE,
    cost: { seeds: 80, humus: 20 },
    growthDays: 100,
    produces: { berries: 0.05, insects: 0.03, litter: 0.02 },
    drinks: 0.05,
    storage: { sap: 5, insects: 20 },
    niches: { thicket: 1, groundShelter: 1 },
    grazingShield: 0.05,
    biomass: 1,
    requires: { discoveries: ['fruiting'] },
  },
  bank: {
    ...BASE,
    cost: { humus: 100 },
    storage: { humus: 200 },
    niches: { burrow: 2 },
    requires: { discoveries: ['predation'] },
  },
  hazel: {
    ...BASE,
    cost: { seeds: 150, humus: 50 },
    growthDays: 200,
    // Hazel roots live with fungi (truffle orchards are planted with hazel).
    produces: { berries: 0.08, seeds: 0.03, litter: 0.05, spores: 0.025 },
    drinks: 0.05,
    storage: { sap: 5, seeds: 50, spores: 40 },
    niches: { thicket: 2 },
    biomass: 3,
    requires: { discoveries: ['fruiting'] },
  },
};
