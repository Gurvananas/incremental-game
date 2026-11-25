import { DISCOVERIES, type DiscoveryId } from '../data/discoveries';
import { PLANTS, PLANT_IDS, type PlantId } from '../data/plants';
import { RESOURCE_IDS, type ResourceId } from '../data/resources';
import { getLocale, t } from '../i18n';
import { formatNumber, formatPercent, roman } from './format';

/** Player-facing descriptions built from the game data, so texts never drift from numbers. */

function amount(value: number): string {
  return formatNumber(value, { locale: getLocale() });
}

export function resourceName(id: ResourceId): string {
  return t(`resource.${id}`);
}

export function plantName(id: PlantId): string {
  return t(`plant.${id}.name`);
}

export function discoveryName(id: DiscoveryId): string {
  return t(`discovery.${id}.name`);
}

export function describePlantEffects(id: PlantId): string[] {
  const def = PLANTS[id];
  const lines: string[] = [];
  for (const resource of RESOURCE_IDS) {
    const produced = def.produces[resource];
    if (produced !== undefined) {
      lines.push(
        t('effect.produces', { amount: amount(produced), resource: resourceName(resource) }),
      );
    }
  }
  if (def.sapBonus > 0) {
    lines.push(
      t('effect.sapBonus', { percent: formatPercent(def.sapBonus, { locale: getLocale() }) }),
    );
  }
  if (def.drinks > 0) {
    lines.push(t('effect.drinks', { amount: amount(def.drinks), resource: resourceName('water') }));
  }
  for (const resource of RESOURCE_IDS) {
    const storage = def.storage[resource];
    if (storage !== undefined) {
      lines.push(
        t('effect.storage', { amount: amount(storage), resource: resourceName(resource) }),
      );
    }
  }
  if (def.growthDays > 0) {
    lines.push(t('effect.growth', { days: def.growthDays }));
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
  for (const resource of RESOURCE_IDS) {
    const factor = def.storageMultiplier[resource];
    if (factor !== undefined) {
      lines.push(
        t('effect.storageMultiplier', { resource: resourceName(resource), factor: amount(factor) }),
      );
    }
  }
  if (def.era !== undefined) {
    lines.push(t('effect.era', { numeral: roman(def.era) }));
  }
  return lines;
}
