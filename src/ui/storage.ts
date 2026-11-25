import {
  SaveError,
  deserialize,
  serialize,
  type SaveErrorReason,
  type SaveFile,
} from '../engine/save';
import type { GameState } from '../engine/state';

const SAVE_KEY = 'sylve.save';
/** An unreadable save is moved here instead of being destroyed. */
const BACKUP_KEY = 'sylve.save.unreadable';

export type LoadResult =
  | { readonly kind: 'none' }
  | { readonly kind: 'loaded'; readonly save: SaveFile }
  | { readonly kind: 'error'; readonly reason: SaveErrorReason };

export function loadSave(): LoadResult {
  let text: string | null;
  try {
    text = localStorage.getItem(SAVE_KEY);
  } catch {
    return { kind: 'none' }; // storage blocked (private mode, settings): play without saving
  }
  if (text === null) {
    return { kind: 'none' };
  }
  try {
    return { kind: 'loaded', save: deserialize(text) };
  } catch (error) {
    try {
      localStorage.setItem(BACKUP_KEY, text);
    } catch {
      // nothing more we can do
    }
    return { kind: 'error', reason: error instanceof SaveError ? error.reason : 'corrupt' };
  }
}

export function writeSave(state: GameState, now: number): void {
  try {
    localStorage.setItem(SAVE_KEY, serialize(state, now));
  } catch {
    // storage full or blocked: keep playing, the next autosave will retry
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // storage blocked: nothing to clear
  }
}
