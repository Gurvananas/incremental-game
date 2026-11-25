import { describe, expect, it } from 'vitest';
import { RESOURCES } from '../data/resources';
import {
  decodeSave,
  deserialize,
  encodeSave,
  migrate,
  SAVE_VERSION,
  SaveError,
  serialize,
  type Migration,
} from './save';
import { createInitialState, noPlants } from './state';
import { advance } from './tick';

function reasonOf(action: () => unknown): string {
  try {
    action();
  } catch (error) {
    if (error instanceof SaveError) {
      return error.reason;
    }
    throw error;
  }
  return 'no error';
}

describe('serialize / deserialize', () => {
  it('round-trips a game state', () => {
    const state = advance(createInitialState(123), 500);
    const loaded = deserialize(serialize(state, 1_000));
    expect(loaded).toEqual({ version: SAVE_VERSION, savedAt: 1_000, state });
  });

  it('rejects text that is not JSON', () => {
    expect(reasonOf(() => deserialize('not a save'))).toBe('corrupt');
  });

  it('rejects a save from a newer version', () => {
    const text = JSON.stringify({ version: SAVE_VERSION + 1, savedAt: 0, state: {} });
    expect(reasonOf(() => deserialize(text))).toBe('too-new');
  });

  it('rejects a save whose state is broken', () => {
    const text = JSON.stringify({ version: SAVE_VERSION, savedAt: 0, state: { days: -1, rng: 1 } });
    expect(reasonOf(() => deserialize(text))).toBe('corrupt');
  });

  it('gives missing resources their initial amount, and drops unknown or invalid ones', () => {
    const text = JSON.stringify({
      version: SAVE_VERSION,
      savedAt: 0,
      state: { days: 3, rng: 9, resources: { water: -5, oldResource: 12 } },
    });
    const { state } = deserialize(text);
    expect(state.resources.water).toBe(RESOURCES.water.initial);
    expect(state.resources).not.toHaveProperty('oldResource');
  });

  it('loads a v0.0 save, which had no plants, seedlings or discoveries', () => {
    const text = JSON.stringify({
      version: 1,
      savedAt: 0,
      state: { days: 12, rng: 3, resources: { water: 80, sap: 0 } },
    });
    const { state } = deserialize(text);
    expect(state).toEqual({
      ...createInitialState(3),
      days: 12,
      resources: { ...state.resources, water: 80 },
    });
    expect(state.plants.grass).toBe(0);
  });

  it('keeps animals and assignments, and drops invalid ones', () => {
    const text = JSON.stringify({
      version: SAVE_VERSION,
      savedAt: 0,
      state: {
        days: 0,
        rng: 1,
        animals: { earthworm: 2.5, unicorn: 3, rabbit: -1 },
        assignments: { earthworm: 3, bee: 1.5 },
      },
    });
    const { state } = deserialize(text);
    expect(state.animals.earthworm).toBe(2.5);
    expect(state.animals.rabbit).toBe(0);
    expect(state.animals).not.toHaveProperty('unicorn');
    expect(state.assignments.earthworm).toBe(3);
    expect(state.assignments.bee).toBe(0);
  });

  it('drops invalid plants, seedlings and discoveries', () => {
    const text = JSON.stringify({
      version: SAVE_VERSION,
      savedAt: 0,
      state: {
        days: 0,
        rng: 1,
        plants: { grass: 2.5, moss: 3, oak: 9 },
        seedlings: [{ plant: 'grass', daysLeft: 4 }, { plant: 'oak', daysLeft: 1 }, 'junk'],
        discoveries: ['symbiosis', 'symbiosis', 'telepathy'],
      },
    });
    const { state } = deserialize(text);
    expect(state.plants).toEqual({ ...noPlants(), moss: 3 });
    expect(state.seedlings).toEqual([{ plant: 'grass', daysLeft: 4 }]);
    expect(state.discoveries).toEqual(['symbiosis']);
  });
});

describe('migrate', () => {
  const migrations: Record<number, Migration> = {
    1: (save) => ({ ...save, addedInV2: true }),
    2: (save) => ({ ...save, steps: ['v2', 'v3'] }),
  };

  it('applies every migration in order up to the target version', () => {
    expect(migrate({ version: 1 }, migrations, 3)).toEqual({
      version: 3,
      addedInV2: true,
      steps: ['v2', 'v3'],
    });
  });

  it('fails when a migration is missing', () => {
    expect(reasonOf(() => migrate({ version: 0 }, migrations, 3))).toBe('corrupt');
  });

  it('fails without a version number', () => {
    expect(reasonOf(() => migrate({}, migrations, 3))).toBe('corrupt');
  });
});

describe('save codes', () => {
  it('round-trips text with accents', () => {
    const json = '{"note":"Été, forêt, sève"}';
    expect(decodeSave(encodeSave(json))).toBe(json);
  });

  it('rejects an invalid code', () => {
    expect(reasonOf(() => decodeSave('%%% not base64 %%%'))).toBe('corrupt');
  });
});
