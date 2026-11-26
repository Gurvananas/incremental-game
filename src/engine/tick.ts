import { GROWTH_PAUSED_SEASONS } from '../data/climate';
import { LEAVING_PER_DAY, STARVATION_PER_DAY } from '../data/ecology';
import type { PlantId } from '../data/plants';
import { RESOURCE_IDS, type ResourceId } from '../data/resources';
import { SPECIES, SPECIES_IDS, type SpeciesId } from '../data/species';
import { SECONDS_PER_DAY } from '../data/time';
import { getCalendar } from './calendar';
import { runDay } from './daily';
import { getCaps, getProduction, type Production } from './production';
import type { GameState, Seedling } from './state';

/** Fixed simulation step, in real seconds (5 ticks per second). */
export const STEP_SECONDS = 0.2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Seedlings grow (slower when overgrazed), except in winter; grown ones join the adults. */
function grow(state: GameState, days: number, grazing: number): GameState {
  if (
    state.seedlings.length === 0 ||
    GROWTH_PAUSED_SEASONS.includes(getCalendar(state.days).season)
  ) {
    return state;
  }
  const plants = { ...state.plants } as Record<PlantId, number>;
  const seedlings: Seedling[] = [];
  for (const seedling of state.seedlings) {
    const daysLeft = seedling.daysLeft - days * grazing;
    if (daysLeft <= 1e-9) {
      plants[seedling.plant] += 1;
    } else {
      seedlings.push({ plant: seedling.plant, daysLeft });
    }
  }
  return { ...state, plants, seedlings };
}

/**
 * Populations move toward their niches: fed animals breed (logistic growth) and
 * newcomers arrive; hungry ones decline; extra ones leave; prey get eaten.
 */
function updateAnimals(
  state: GameState,
  production: Production,
  days: number,
): Record<SpeciesId, number> {
  const animals = { ...state.animals } as Record<SpeciesId, number>;
  for (const id of SPECIES_IDS) {
    const n = state.animals[id];
    const capacity = production.capacity[id];
    if ((n === 0 && capacity === 0) || production.asleep[id]) {
      continue;
    }
    const def = SPECIES[id];
    const fed = production.fed[id];
    const room = Math.max(0, capacity - n);
    const births = capacity > 0 ? fed * def.birthsPerDay * n * (room / capacity) : 0;
    const arrivals = fed * def.arrivalsPerDay * room;
    const starvation = STARVATION_PER_DAY * (1 - fed) * n;
    const leaving = n > capacity ? LEAVING_PER_DAY * (n - capacity) : 0;
    const next = n + days * (births + arrivals - starvation - leaving - production.eaten[id]);
    animals[id] = next < 1e-6 ? 0 : next;
  }
  return animals;
}

/** Advances the game by `dt` real seconds. Pure: returns a new state. */
export function step(state: GameState, dt: number): GameState {
  const production = getProduction(state);
  const { caps } = production;
  const resources = { ...state.resources } as Record<ResourceId, number>;
  for (const id of RESOURCE_IDS) {
    resources[id] = clamp(resources[id] + production.rates[id] * dt, 0, caps[id]);
  }
  const days = dt / SECONDS_PER_DAY;
  const grown = grow(state, days, production.modifiers.grazing);
  let next: GameState = {
    ...grown,
    days: state.days + days,
    resources,
    animals: updateAnimals(state, production, days),
  };
  // Once a day: weather, ageing, threats... (several days at once in coarse offline steps).
  const firstDay = Math.floor(state.days + DAY_EPSILON) + 1;
  const lastDay = Math.floor(next.days + DAY_EPSILON);
  for (let day = firstDay; day <= lastDay; day++) {
    next = runDay(next, day);
  }
  // Caps can shrink during the step (animals that add storage leave, trees fall).
  const after = getCaps(next);
  if (RESOURCE_IDS.some((id) => next.resources[id] > after[id])) {
    const clamped = { ...next.resources } as Record<ResourceId, number>;
    for (const id of RESOURCE_IDS) {
      clamped[id] = Math.min(clamped[id], after[id]);
    }
    next = { ...next, resources: clamped };
  }
  return next;
}

/** Same tolerance as the calendar, so daily events fire exactly on day boundaries. */
const DAY_EPSILON = 1e-6;

/**
 * Advances the game by `seconds` real seconds in fixed steps of `stepSeconds`.
 * The remainder, if any, is applied as one last shorter step.
 */
export function advance(
  state: GameState,
  seconds: number,
  stepSeconds: number = STEP_SECONDS,
): GameState {
  if (seconds <= 0) {
    return state;
  }
  const fullSteps = Math.floor(seconds / stepSeconds + 1e-9);
  let next = state;
  for (let i = 0; i < fullSteps; i++) {
    next = step(next, stepSeconds);
  }
  const remainder = seconds - fullSteps * stepSeconds;
  if (remainder > 1e-9) {
    next = step(next, remainder);
  }
  return next;
}
