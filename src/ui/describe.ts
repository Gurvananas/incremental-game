import { ADAPTATIONS, type AdaptationId } from '../data/adaptations';
import { DISCOVERIES, type DiscoveryId } from '../data/discoveries';
import { NICHE_IDS, type NicheId } from '../data/niches';
import { PLANTS, PLANT_IDS, type PlantId } from '../data/plants';
import { RESOURCE_IDS, type ResourceId } from '../data/resources';
import { SPECIES, SPECIES_IDS, type SpeciesId } from '../data/species';
import { DAYS_PER_YEAR } from '../data/time';
import type { RateSource } from '../engine/production';
import { getLocale, t } from '../i18n';
import { formatNumber, formatPercent, roman } from './format';

/** Player-facing descriptions built from the game data, so texts never drift from numbers. */

function amount(value: number): string {
  return formatNumber(value, { locale: getLocale() });
}

function percent(ratio: number): string {
  return formatPercent(ratio, { locale: getLocale() });
}

export function resourceName(id: ResourceId): string {
  return t(`resource.${id}`);
}

export function plantName(id: PlantId): string {
  return t(`plant.${id}.name`);
}

export function speciesName(id: SpeciesId): string {
  return t(`species.${id}.name`);
}

export function nicheName(id: NicheId): string {
  return t(`niche.${id}`);
}

export function discoveryName(id: DiscoveryId): string {
  return t(`discovery.${id}.name`);
}

export function adaptationName(id: AdaptationId): string {
  return t(`adaptation.${id}.name`);
}

function nicheLines(niches: Partial<Record<(typeof NICHE_IDS)[number], number>>): string[] {
  return NICHE_IDS.flatMap((niche) => {
    const count = niches[niche];
    return count === undefined
      ? []
      : [t('effect.niches', { count: amount(count), niche: nicheName(niche) })];
  });
}

export function isPlantSource(source: RateSource): source is PlantId {
  return (PLANT_IDS as readonly string[]).includes(source);
}

export function isSpeciesSource(source: RateSource): source is SpeciesId {
  return (SPECIES_IDS as readonly string[]).includes(source);
}

function producesLines(produces: Partial<Record<ResourceId, number>>): string[] {
  return RESOURCE_IDS.flatMap((resource) => {
    const value = produces[resource];
    return value === undefined
      ? []
      : [t('effect.produces', { amount: amount(value), resource: resourceName(resource) })];
  });
}

function storageLines(storage: Partial<Record<ResourceId, number>>): string[] {
  return RESOURCE_IDS.flatMap((resource) => {
    const value = storage[resource];
    return value === undefined
      ? []
      : [t('effect.storage', { amount: amount(value), resource: resourceName(resource) })];
  });
}

export function describePlantEffects(id: PlantId): string[] {
  const def = PLANTS[id];
  const lines = producesLines(def.produces);
  if (def.sapBonus > 0) {
    lines.push(t('effect.sapBonus', { percent: percent(def.sapBonus) }));
  }
  if (def.drinks > 0) {
    lines.push(t('effect.drinks', { amount: amount(def.drinks), resource: resourceName('water') }));
  }
  lines.push(...storageLines(def.storage));
  lines.push(...nicheLines(def.niches));
  if (def.grazingShield > 0) {
    lines.push(t('effect.grazingShield'));
  }
  if (def.crown > 0) {
    lines.push(t('effect.crown', { amount: amount(def.crown) }));
  }
  if (def.light === 'sun') {
    lines.push(t('effect.sun'));
  } else if (def.light === 'shade') {
    lines.push(t('effect.shade'));
  }
  if (def.growthDays > 0) {
    lines.push(t('effect.growth', { days: def.growthDays }));
  }
  if (def.lifespanDays > 0) {
    lines.push(t('effect.lifespan', { years: Math.round(def.lifespanDays / DAYS_PER_YEAR) }));
  }
  return lines;
}

export function describeSpeciesEffects(id: SpeciesId): string[] {
  const def = SPECIES[id];
  const lines: string[] = [];
  def.diet.forEach((food, index) => {
    if ('prey' in food) {
      lines.push(t('effect.hunts', { amount: amount(food.perDay), prey: speciesName(food.prey) }));
    } else {
      const key = index === 0 ? 'effect.eats' : 'effect.orEats';
      lines.push(t(key, { amount: amount(food.perDay), food: resourceName(food.resource) }));
    }
  });
  lines.push(...producesLines(def.produces));
  if (def.seedBonus > 0) {
    lines.push(t('effect.seedBonus', { percent: percent(def.seedBonus) }));
  }
  lines.push(...storageLines(def.storage));
  lines.push(...nicheLines(def.makesNiches));
  if (def.beetleShield > 0) {
    lines.push(t('effect.beetleShield'));
  }
  for (const plant of PLANT_IDS) {
    if ((def.plantsPerDay[plant] ?? 0) > 0) {
      lines.push(t('effect.plantsSeedlings', { name: plantName(plant) }));
    }
  }
  if (def.hibernates) {
    lines.push(t('effect.hibernates'));
  }
  return lines;
}

export function describeDiscoveryEffects(id: DiscoveryId): string[] {
  const def = DISCOVERIES[id];
  const lines: string[] = [];
  for (const plant of PLANT_IDS) {
    if (PLANTS[plant].requires.discoveries?.includes(id)) {
      lines.push(t('effect.unlocks', { name: plantName(plant) }));
    }
  }
  for (const species of SPECIES_IDS) {
    if (SPECIES[species].requires.includes(id)) {
      lines.push(t('effect.attracts', { name: speciesName(species) }));
    }
  }
  for (const resource of RESOURCE_IDS) {
    const factor = def.storageMultiplier[resource];
    if (factor !== undefined) {
      lines.push(
        t('effect.storageMultiplier', { resource: resourceName(resource), factor: amount(factor) }),
      );
    }
    const boost = def.productionMultiplier[resource];
    if (boost !== undefined) {
      lines.push(
        t('effect.productionMultiplier', {
          resource: resourceName(resource),
          factor: amount(boost),
        }),
      );
    }
    const gift = def.grants[resource];
    if (gift !== undefined) {
      lines.push(t('effect.grants', { amount: amount(gift), resource: resourceName(resource) }));
    }
  }
  if (def.revealsBalance === true) {
    lines.push(t('effect.balance'));
  }
  if (def.era !== undefined) {
    lines.push(t('effect.era', { numeral: roman(def.era) }));
  }
  return lines;
}

export function describeAdaptationEffects(id: AdaptationId): string[] {
  const def = ADAPTATIONS[id];
  const lines: string[] = [];
  for (const resource of RESOURCE_IDS) {
    const storage = def.storageMultiplier[resource];
    if (storage !== undefined) {
      lines.push(
        t('effect.storageMultiplier', {
          resource: resourceName(resource),
          factor: amount(storage),
        }),
      );
    }
    const boost = def.productionMultiplier[resource];
    if (boost !== undefined) {
      lines.push(
        t('effect.productionMultiplier', {
          resource: resourceName(resource),
          factor: amount(boost),
        }),
      );
    }
  }
  if (def.summerDrinking !== 1) {
    lines.push(t('effect.summerDrinking', { percent: percent(1 - def.summerDrinking) }));
  }
  if (def.winterSap !== 1) {
    lines.push(t('effect.winterSap', { factor: amount(def.winterSap) }));
  }
  if (def.frostProof) {
    lines.push(t('effect.frostProof'));
  }
  if (def.beetleShield > 0) {
    lines.push(t('effect.beetleShield'));
  }
  if (def.sapPerTree > 0) {
    lines.push(t('effect.sapPerTree', { percent: percent(def.sapPerTree) }));
  }
  if (def.callDiscount > 0) {
    lines.push(t('effect.callDiscount', { percent: percent(def.callDiscount) }));
  }
  return lines;
}
