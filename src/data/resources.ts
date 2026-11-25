/**
 * Resource definitions. Adding a resource here is enough: saves that lack it
 * start it at `initial` (see engine/save.ts), so no migration is needed.
 */

export interface ResourceDef {
  /** Amount at the start of a new run. */
  readonly initial: number;
  /** Storage cap before any plantation or discovery raises it. */
  readonly baseCap: number;
  /** Shown from the start; others appear once produced. */
  readonly startsVisible: boolean;
}

export const RESOURCES = {
  water: { initial: 50, baseCap: 100, startsVisible: true },
  sap: { initial: 0, baseCap: 50, startsVisible: true },
  humus: { initial: 0, baseCap: 50, startsVisible: false },
  spores: { initial: 0, baseCap: 100, startsVisible: false },
} as const satisfies Record<string, ResourceDef>;

export type ResourceId = keyof typeof RESOURCES;

export const RESOURCE_IDS = Object.keys(RESOURCES) as readonly ResourceId[];

/** A bundle of resources: a cost, a production, a storage bonus... */
export type Amounts = Partial<Record<ResourceId, number>>;
