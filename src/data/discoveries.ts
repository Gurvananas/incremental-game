import type { Era } from './eras';
import type { Amounts } from './resources';

/** Discoveries of the mycelial network. Values from docs/design.md, "Découvertes". */

export const DISCOVERY_IDS = ['symbiosis', 'rooting', 'flowering'] as const;
export type DiscoveryId = (typeof DISCOVERY_IDS)[number];

export interface DiscoveryDef {
  readonly cost: Amounts;
  readonly requires: readonly DiscoveryId[];
  /** Multiplies storage caps. */
  readonly storageMultiplier: Amounts;
  /** Era opened by this discovery. */
  readonly era?: Era;
}

export const DISCOVERIES: Readonly<Record<DiscoveryId, DiscoveryDef>> = {
  symbiosis: { cost: { spores: 10 }, requires: [], storageMultiplier: {} },
  rooting: { cost: { spores: 25 }, requires: ['symbiosis'], storageMultiplier: { sap: 2 } },
  flowering: { cost: { spores: 60 }, requires: ['rooting'], storageMultiplier: {}, era: 2 },
};
