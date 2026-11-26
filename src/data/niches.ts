/** Habitat niches that plantations provide and species occupy (docs/design.md, "Population"). */
export const NICHE_IDS = [
  'soil',
  'grassland',
  'flower',
  'thicket',
  'groundShelter',
  'burrow',
  'branch',
  'cavity',
  'deadwood',
] as const;
export type NicheId = (typeof NICHE_IDS)[number];

export type NicheAmounts = Partial<Record<NicheId, number>>;
