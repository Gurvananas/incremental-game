import type { Era } from './eras';
import type { Amounts } from './resources';

/** Discoveries of the mycelial network. Values from docs/design.md, "Découvertes". */

export const DISCOVERY_IDS = [
  'symbiosis',
  'rooting',
  'flowering',
  'pollination',
  'dispersal',
  'fruiting',
  'foodChain',
  'predation',
  'lignification',
] as const;
export type DiscoveryId = (typeof DISCOVERY_IDS)[number];

export interface DiscoveryDef {
  readonly cost: Amounts;
  readonly requires: readonly DiscoveryId[];
  /** Multiplies storage caps. */
  readonly storageMultiplier: Amounts;
  /** Given once, when the discovery is made. */
  readonly grants: Amounts;
  /** Era opened by this discovery. */
  readonly era?: Era;
  /** Turns on the Balance index (biodiversity multiplier). */
  readonly revealsBalance?: boolean;
}

const BASE = { requires: [], storageMultiplier: {}, grants: {} } as const;

export const DISCOVERIES: Readonly<Record<DiscoveryId, DiscoveryDef>> = {
  symbiosis: { ...BASE, cost: { spores: 10 } },
  rooting: {
    ...BASE,
    cost: { spores: 25 },
    requires: ['symbiosis'],
    storageMultiplier: { sap: 2 },
  },
  flowering: {
    ...BASE,
    cost: { spores: 60 },
    requires: ['rooting'],
    grants: { seeds: 25 },
    era: 2,
  },
  pollination: { ...BASE, cost: { spores: 150 }, requires: ['flowering'] },
  dispersal: {
    ...BASE,
    cost: { spores: 250 },
    requires: ['pollination'],
    storageMultiplier: { seeds: 2, spores: 2 },
  },
  fruiting: { ...BASE, cost: { spores: 400 }, requires: ['dispersal'], era: 3 },
  foodChain: { ...BASE, cost: { spores: 700 }, requires: ['fruiting'], revealsBalance: true },
  predation: { ...BASE, cost: { spores: 1200 }, requires: ['foodChain'] },
  lignification: { ...BASE, cost: { spores: 2000 }, requires: ['fruiting'], era: 4 },
};
