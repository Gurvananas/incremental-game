# Journal des décisions

Une ligne par décision, la plus récente en haut. On y note le choix, la raison, et ce qu'il implique.
Quand une décision change le design, on met aussi à jour `docs/design.md`.

| Date       | Décision                                           | Pourquoi                                                  | Conséquence                                                                            |
| ---------- | -------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 2026-11-25 | Anglais d'abord, français ensuite                  | Choix du porteur du projet                                | `src/i18n/en.ts` est la référence ; `fr.ts` peut être incomplet (repli sur l'anglais)  |
| 2026-11-25 | Vraie dynamique proies-prédateurs                  | Plus de profondeur que de simples ratios                  | À tester de près au simulateur : risque d'oscillations et d'extinctions                |
| 2026-11-25 | Les arbres poussent lentement (saisons, années)    | Pilier « le temps est une ressource »                     | Progression hors ligne indispensable ; le simulateur doit couvrir des années de jeu    |
| 2026-11-25 | TypeScript 6.0, pas 7                              | typescript-eslint ne supporte pas encore TS 7             | Passer à TS 7 quand l'outillage suivra                                                 |
| 2026-11-25 | DOM simple, sans framework                         | Interface textuelle, peu d'éléments, mises à jour ciblées | `ui/dom.ts` (`h`, `textSlot`) ; revoir si l'interface se complexifie beaucoup          |
| 2026-11-25 | Moteur pur et immuable : `step(state, dt) → state` | Testable, simulable, progression hors ligne gratuite      | Interdiction de DOM, `Date.now`, `Math.random` dans `src/engine` (vérifié par le lint) |
| 2026-11-25 | Pas fixe de 0,2 s, temps mesuré en temps réel      | Les navigateurs ralentissent les onglets en arrière-plan  | Au-delà de 5 s d'écart, rattrapage par pas d'un jour (`simulateOffline`)               |
| 2026-11-25 | Sauvegarde versionnée avec migrations              | Ne jamais casser les sauvegardes des joueurs              | Changer la forme de l'état = `SAVE_VERSION + 1` + migration + test                     |
