/** The six eras of ecological succession (docs/design.md, "Ères de succession écologique"). */
export const ERAS = [1, 2, 3, 4, 5, 6] as const;
export type Era = (typeof ERAS)[number];
