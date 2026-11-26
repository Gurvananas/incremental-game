/** Threats (docs/design.md, "Menaces et voisins"). Each one is announced before it strikes. */

/** Drought: in summer, when water falls below this share of its storage. */
export const DROUGHT_WATER_SHARE = 0.2;
/** Thirsty plants produce this much during a drought. */
export const DROUGHT_PRODUCTION = 0.5;
/** Share of seedlings that die each drought day. */
export const DROUGHT_SEEDLING_DEATH_PER_DAY = 0.003;

/** Storm days: chance for each old tree, and for each adult tree, to fall. */
export const STORM_FALL_OLD_PER_DAY = 0.2;
export const STORM_FALL_ADULT_PER_DAY = 0.002;

/** Bark beetles: an outbreak needs this share of pines among trees, plus drought or heat. */
export const BEETLE_PINE_SHARE = 0.4;
/** Days of risky conditions (announced) before the outbreak starts. */
export const BEETLE_RISK_DAYS = 3;
/** Calm days in a row before an outbreak dies down. */
export const BEETLE_CALM_DAYS = 5;
/** Chance for each pine to die per outbreak day, before protection. */
export const BEETLE_DEATH_PER_DAY = 0.03;
/** Protection never goes above this share. */
export const BEETLE_MAX_SHIELD = 0.9;

/** Thunderstorm days: chance of a lightning strike, lowered by each pond. */
export const LIGHTNING_CHANCE_PER_DAY = 0.15;
export const LIGHTNING_POND_SHIELD = 0.03;
export const LIGHTNING_MAX_SHIELD = 0.8;
/** A strike burns between 1 and this many plantations. */
export const LIGHTNING_MAX_BURNED = 3;
