/**
 * Resource definitions. Adding a resource here is enough: saves that lack it
 * start it at `initial` (see engine/save.ts), so no migration is needed.
 */

export interface ResourceDef {
  /** Amount at the start of a new run. */
  readonly initial: number;
  /** Storage cap before any plantation, animal or discovery raises it. */
  readonly baseCap: number;
  /** Shown from the start; others appear once produced. */
  readonly startsVisible: boolean;
  /** Share of the stock that rots away each game day (berries). */
  readonly decayPerDay: number;
}

export const RESOURCES = {
  water: { initial: 50, baseCap: 100, startsVisible: true, decayPerDay: 0 },
  sap: { initial: 0, baseCap: 50, startsVisible: true, decayPerDay: 0 },
  humus: { initial: 0, baseCap: 150, startsVisible: false, decayPerDay: 0 },
  litter: { initial: 0, baseCap: 100, startsVisible: false, decayPerDay: 0 },
  spores: { initial: 0, baseCap: 100, startsVisible: false, decayPerDay: 0 },
  nectar: { initial: 0, baseCap: 50, startsVisible: false, decayPerDay: 0 },
  seeds: { initial: 0, baseCap: 100, startsVisible: false, decayPerDay: 0 },
  berries: { initial: 0, baseCap: 100, startsVisible: false, decayPerDay: 0.02 },
  insects: { initial: 0, baseCap: 100, startsVisible: false, decayPerDay: 0 },
  songs: { initial: 0, baseCap: 100, startsVisible: false, decayPerDay: 0 },
  deadwood: { initial: 0, baseCap: 100, startsVisible: false, decayPerDay: 0.01 },
  resin: { initial: 0, baseCap: 100, startsVisible: false, decayPerDay: 0 },
} as const satisfies Record<string, ResourceDef>;

export type ResourceId = keyof typeof RESOURCES;

export const RESOURCE_IDS = Object.keys(RESOURCES) as readonly ResourceId[];

/** A bundle of resources: a cost, a production, a storage bonus... */
export type Amounts = Partial<Record<ResourceId, number>>;
