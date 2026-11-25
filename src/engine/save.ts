import { DISCOVERY_IDS, type DiscoveryId } from '../data/discoveries';
import { PLANT_IDS, type PlantId } from '../data/plants';
import { RESOURCE_IDS } from '../data/resources';
import { SPECIES_IDS, type SpeciesId } from '../data/species';
import { initialResources, noAnimals, noPlants, type GameState, type Seedling } from './state';

/**
 * Save format version. Bump it, and add a migration below, whenever the
 * shape of GameState changes in a way hydrate() cannot absorb on its own
 * (a renamed or removed field, a field whose meaning changes).
 * Adding a new resource, plant or discovery, or a new field with a safe
 * default, does NOT need a migration: hydrate() fills the gaps.
 */
export const SAVE_VERSION = 1;

export interface SaveFile {
  readonly version: number;
  /** Real time of the save, in ms since the epoch. Used for offline progress. */
  readonly savedAt: number;
  readonly state: GameState;
}

export type SaveErrorReason = 'corrupt' | 'too-new';

export class SaveError extends Error {
  readonly reason: SaveErrorReason;

  constructor(reason: SaveErrorReason, message: string) {
    super(message);
    this.name = 'SaveError';
    this.reason = reason;
  }
}

type RawSave = Record<string, unknown>;

/** Upgrades a raw save object from version n to version n + 1. */
export type Migration = (save: RawSave) => RawSave;

/** MIGRATIONS[n] upgrades a save from version n to version n + 1. Each one needs a test. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

function isRecord(value: unknown): value is RawSave {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPlantId(value: unknown): value is PlantId {
  return (PLANT_IDS as readonly unknown[]).includes(value);
}

function isDiscoveryId(value: unknown): value is DiscoveryId {
  return (DISCOVERY_IDS as readonly unknown[]).includes(value);
}

function hydratePlants(raw: unknown): Record<PlantId, number> {
  const plants = noPlants();
  if (isRecord(raw)) {
    for (const id of PLANT_IDS) {
      const count = raw[id];
      if (isNonNegativeNumber(count) && Number.isInteger(count)) {
        plants[id] = count;
      }
    }
  }
  return plants;
}

function hydrateSpecies(raw: unknown, wholeNumbers: boolean): Record<SpeciesId, number> {
  const counts = noAnimals();
  if (isRecord(raw)) {
    for (const id of SPECIES_IDS) {
      const count = raw[id];
      if (isNonNegativeNumber(count) && (!wholeNumbers || Number.isInteger(count))) {
        counts[id] = count;
      }
    }
  }
  return counts;
}

function hydrateSeedlings(raw: unknown): Seedling[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((item: unknown) =>
    isRecord(item) && isPlantId(item.plant) && isNonNegativeNumber(item.daysLeft)
      ? [{ plant: item.plant, daysLeft: item.daysLeft }]
      : [],
  );
}

function hydrateDiscoveries(raw: unknown): DiscoveryId[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return [...new Set(raw.filter(isDiscoveryId))];
}

export function serialize(state: GameState, savedAt: number): string {
  const file: SaveFile = { version: SAVE_VERSION, savedAt, state };
  return JSON.stringify(file);
}

/** Runs the migrations needed to bring a raw save up to `target`. */
export function migrate(
  save: RawSave,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = SAVE_VERSION,
): RawSave {
  let version = save.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) {
    throw new SaveError('corrupt', 'The save has no valid version number.');
  }
  if (version > target) {
    throw new SaveError('too-new', `The save comes from a newer version (${version}).`);
  }
  let current = save;
  while (version < target) {
    const migration = migrations[version];
    if (migration === undefined) {
      throw new SaveError('corrupt', `No migration from save version ${version}.`);
    }
    version += 1;
    current = { ...migration(current), version };
  }
  return current;
}

/** Builds a valid GameState from untrusted data. Missing parts get their starting value. */
function hydrate(raw: unknown): GameState {
  if (!isRecord(raw)) {
    throw new SaveError('corrupt', 'The save has no game state.');
  }
  if (!isNonNegativeNumber(raw.days)) {
    throw new SaveError('corrupt', 'The save has an invalid day count.');
  }
  if (typeof raw.rng !== 'number' || !Number.isInteger(raw.rng)) {
    throw new SaveError('corrupt', 'The save has an invalid RNG state.');
  }
  const resources = initialResources();
  if (isRecord(raw.resources)) {
    for (const id of RESOURCE_IDS) {
      const amount = raw.resources[id];
      if (isNonNegativeNumber(amount)) {
        resources[id] = amount;
      }
    }
  }
  return {
    days: raw.days,
    resources,
    plants: hydratePlants(raw.plants),
    seedlings: hydrateSeedlings(raw.seedlings),
    discoveries: hydrateDiscoveries(raw.discoveries),
    animals: hydrateSpecies(raw.animals, false),
    assignments: hydrateSpecies(raw.assignments, true),
    rng: raw.rng >>> 0,
  };
}

export function deserialize(
  text: string,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
): SaveFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SaveError('corrupt', 'The save is not valid JSON.');
  }
  if (!isRecord(parsed)) {
    throw new SaveError('corrupt', 'The save is not an object.');
  }
  const upgraded = migrate(parsed, migrations);
  if (!isNonNegativeNumber(upgraded.savedAt)) {
    throw new SaveError('corrupt', 'The save has no valid date.');
  }
  return { version: SAVE_VERSION, savedAt: upgraded.savedAt, state: hydrate(upgraded.state) };
}

/** Turns a serialised save into a text code the player can copy and back up. */
export function encodeSave(json: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(json)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function decodeSave(code: string): string {
  try {
    const bytes = Uint8Array.from(atob(code.trim()), (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new SaveError('corrupt', 'The save code is invalid.');
  }
}
