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
import { createInitialState } from './state';
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
    expect(state.resources).toEqual({ water: RESOURCES.water.initial, sap: RESOURCES.sap.initial });
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
