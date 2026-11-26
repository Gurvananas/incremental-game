import { NICHE_IDS, type NicheId } from '../data/niches';
import { PLANTS, PLANT_IDS } from '../data/plants';
import { SPECIES, SPECIES_IDS, type SpeciesId } from '../data/species';
import type { GameState } from './state';

/** Niches offered by adult plantations, old trees and animals that make some, per type. */
export function getNiches(state: GameState): Record<NicheId, number> {
  const niches = {} as Record<NicheId, number>;
  for (const niche of NICHE_IDS) {
    let total = 0;
    for (const plant of PLANT_IDS) {
      total += state.plants[plant] * (PLANTS[plant].niches[niche] ?? 0);
      total += state.old[plant] * (PLANTS[plant].oldNiches[niche] ?? 0);
    }
    let made = 0;
    for (const species of SPECIES_IDS) {
      made += state.animals[species] * (SPECIES[species].makesNiches[niche] ?? 0);
    }
    // Only whole niches can be given to a species.
    niches[niche] = total + Math.floor(made);
  }
  return niches;
}

export function speciesIn(niche: NicheId): SpeciesId[] {
  return SPECIES_IDS.filter((id) => SPECIES[id].niche === niche);
}

export function assignedIn(state: GameState, niche: NicheId): number {
  return speciesIn(niche).reduce((sum, id) => sum + state.assignments[id], 0);
}

export function freeNiches(state: GameState, niche: NicheId): number {
  return Math.max(0, getNiches(state)[niche] - assignedIn(state, niche));
}

/**
 * How many individuals a species' niches can hold. If plantations disappear and
 * the niches shrink below what was assigned, every species of that niche shrinks
 * in proportion.
 */
export function getCapacity(state: GameState, id: SpeciesId): number {
  return capacityFrom(state, id, getNiches(state));
}

/** Same as getCapacity, with niches already computed (hot path of the simulation). */
export function capacityFrom(
  state: GameState,
  id: SpeciesId,
  niches: Readonly<Record<NicheId, number>>,
): number {
  const niche = SPECIES[id].niche;
  const available = niches[niche];
  const assigned = assignedIn(state, niche);
  if (assigned <= available) {
    return state.assignments[id];
  }
  return assigned === 0 ? 0 : (state.assignments[id] * available) / assigned;
}
