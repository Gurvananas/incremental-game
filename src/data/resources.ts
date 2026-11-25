/**
 * Resource definitions. Adding a resource here is enough: saves that lack it
 * start it at `initial` (see engine/save.ts), so no migration is needed.
 */

export interface ResourceDef {
  /** Amount at the start of a new run. */
  readonly initial: number;
  /** Storage cap before any plantation or upgrade raises it. */
  readonly baseCap: number;
}

export const RESOURCES = {
  water: { initial: 50, baseCap: 100 },
  sap: { initial: 0, baseCap: 50 },
} as const satisfies Record<string, ResourceDef>;

export type ResourceId = keyof typeof RESOURCES;

export const RESOURCE_IDS = Object.keys(RESOURCES) as readonly ResourceId[];
