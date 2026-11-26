import type { DiscoveryId } from './discoveries';
import type { NicheAmounts, NicheId } from './niches';
import type { PlantId } from './plants';
import type { Amounts, ResourceId } from './resources';

/**
 * Animals (the "kittens"). Each one lives in a niche the player assigns to it,
 * eats something, and gives something back. docs/design.md, "Population".
 */

export const SPECIES_IDS = [
  'earthworm',
  'ant',
  'bee',
  'butterfly',
  'tit',
  'hedgehog',
  'rabbit',
  'fox',
  'woodpecker',
  'squirrel',
  'jay',
] as const;
export type SpeciesId = (typeof SPECIES_IDS)[number];

/** What an individual eats per game day: a resource, or individuals of a prey species. */
export type Food =
  | { readonly resource: ResourceId; readonly perDay: number }
  | { readonly prey: SpeciesId; readonly perDay: number };

export interface SpeciesDef {
  readonly niche: NicheId;
  /** Eaten in this order: the second food only covers what the first one could not. */
  readonly diet: readonly Food[];
  /** Births per individual per game day when fed, slowed as the niches fill up (logistic). */
  readonly birthsPerDay: number;
  /** Share of the free assigned niches filled by newcomers per game day. */
  readonly arrivalsPerDay: number;
  /** Per fed individual, per real second. */
  readonly produces: Amounts;
  /** Storage added per individual. */
  readonly storage: Amounts;
  /** Added to the Seeds multiplier per fed individual (pollination, dispersal). */
  readonly seedBonus: number;
  /** Weight of each individual in the animal half of the Balance index. */
  readonly balanceWeight: number;
  /** Asleep in winter: eats nothing, gives nothing, does not breed. */
  readonly hibernates: boolean;
  /** Counts toward overgrazing. */
  readonly grazer: boolean;
  /** Niches each individual makes for others (a woodpecker carves cavities). */
  readonly makesNiches: NicheAmounts;
  /** Share of bark beetle damage each fed individual prevents. */
  readonly beetleShield: number;
  /** Free seedlings each individual plants per game day (forgotten caches). */
  readonly plantsPerDay: Readonly<Partial<Record<PlantId, number>>>;
  readonly requires: readonly DiscoveryId[];
}

const BASE = {
  diet: [],
  birthsPerDay: 0.05,
  arrivalsPerDay: 0.02,
  produces: {},
  storage: {},
  seedBonus: 0,
  balanceWeight: 1,
  hibernates: false,
  grazer: false,
  makesNiches: {},
  beetleShield: 0,
  plantsPerDay: {},
} as const satisfies Omit<SpeciesDef, 'niche' | 'requires'>;

export const SPECIES: Readonly<Record<SpeciesId, SpeciesDef>> = {
  earthworm: {
    ...BASE,
    niche: 'soil',
    diet: [{ resource: 'litter', perDay: 0.06 }],
    produces: { humus: 0.03 },
    storage: { humus: 5 },
    requires: ['symbiosis'],
  },
  ant: {
    ...BASE,
    niche: 'soil',
    diet: [{ resource: 'nectar', perDay: 0.02 }],
    storage: { water: 10 },
    seedBonus: 0.02,
    requires: ['flowering'],
  },
  bee: {
    ...BASE,
    niche: 'flower',
    diet: [{ resource: 'nectar', perDay: 0.04 }],
    seedBonus: 0.05,
    hibernates: true,
    requires: ['pollination'],
  },
  butterfly: {
    ...BASE,
    niche: 'flower',
    diet: [{ resource: 'nectar', perDay: 0.03 }],
    seedBonus: 0.02,
    balanceWeight: 2,
    hibernates: true,
    requires: ['pollination'],
  },
  tit: {
    ...BASE,
    niche: 'thicket',
    diet: [
      { resource: 'insects', perDay: 0.06 },
      { resource: 'berries', perDay: 0.04 },
    ],
    produces: { songs: 0.02 },
    requires: ['foodChain'],
  },
  hedgehog: {
    ...BASE,
    niche: 'groundShelter',
    diet: [{ resource: 'insects', perDay: 0.08 }],
    produces: { humus: 0.005 },
    hibernates: true,
    requires: ['foodChain'],
  },
  rabbit: {
    ...BASE,
    niche: 'grassland',
    diet: [{ resource: 'sap', perDay: 0.2 }],
    birthsPerDay: 0.08,
    arrivalsPerDay: 0.03,
    produces: { humus: 0.005 },
    grazer: true,
    requires: ['foodChain'],
  },
  fox: {
    ...BASE,
    niche: 'burrow',
    diet: [
      { prey: 'rabbit', perDay: 0.05 },
      { resource: 'berries', perDay: 0.1 },
    ],
    birthsPerDay: 0.02,
    arrivalsPerDay: 0.01,
    requires: ['predation'],
  },
  woodpecker: {
    ...BASE,
    niche: 'deadwood',
    diet: [{ resource: 'insects', perDay: 0.08 }],
    makesNiches: { cavity: 0.5 },
    beetleShield: 0.05,
    requires: ['decomposition'],
  },
  squirrel: {
    ...BASE,
    niche: 'cavity',
    diet: [
      { resource: 'seeds', perDay: 0.1 },
      { resource: 'berries', perDay: 0.1 },
    ],
    storage: { seeds: 20 },
    plantsPerDay: { hazel: 0.0005 },
    requires: ['migration'],
  },
  jay: {
    ...BASE,
    niche: 'branch',
    diet: [
      { resource: 'seeds', perDay: 0.05 },
      { resource: 'berries', perDay: 0.05 },
    ],
    seedBonus: 0.02,
    plantsPerDay: { hazel: 0.0005 },
    requires: ['migration'],
  },
};
