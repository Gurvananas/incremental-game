/** Ecology rules from docs/design.md ("Population", "Équilibrage et formules"). */

/** Share of a hungry population lost per game day (scaled by how hungry it is). */
export const STARVATION_PER_DAY = 0.02;

/** Share of the individuals above their niches that leave per game day (about a season). */
export const LEAVING_PER_DAY = 0.03;

/** At most this share of a prey population can be eaten per game day. */
export const MAX_PREDATION_PER_DAY = 0.1;

/** Each Balance point above 1 adds this much to all production. */
export const BALANCE_BONUS_PER_POINT = 0.04;

/** Overgrazing starts when grazers fill more than this share of the grassland niches. */
export const OVERGRAZING_THRESHOLD = 0.75;

/** Seedlings grow this much slower at full overgrazing (before brambles' protection). */
export const OVERGRAZING_MAX_SLOWDOWN = 0.5;

/** Pests: above this share of the Insects storage, insects start eating the plants. */
export const PEST_THRESHOLD = 0.5;

/** Sap lost at a full Insects storage. */
export const PEST_MAX_SAP_LOSS = 0.2;
