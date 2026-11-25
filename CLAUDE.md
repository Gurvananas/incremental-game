# Sylve — guide pour travailler sur le projet

Sylve est un jeu incrémental dans le navigateur, inspiré par la profondeur de Kittens Game :
on fait pousser une forêt d'une friche jusqu'à la forêt ancienne, puis on la laisse brûler (prestige).

- **Design** : `docs/design.md` est la référence de gameplay. Ne pas inventer de mécanique ni de chiffre
  qui n'y figure pas : proposer d'abord, puis mettre le doc à jour.
- **Décisions** : `docs/decisions.md`. Ajouter une ligne pour tout choix structurant.
- **Langue** : on échange en français avec le porteur du projet. Code, noms et commentaires en anglais.
  Textes du jeu : anglais d'abord (`src/i18n/en.ts`), français ensuite (`src/i18n/fr.ts`).

## Commandes

```bash
npm install          # une fois
npm run dev          # jeu en local, panneau de debug visible
npm run check        # TOUT : types, lint, format, tests, simulateur, build. Doit passer avant chaque commit.
npm test             # tests seuls (npm run test:watch pour le mode continu)
npm run sim -- --days=800 --seed=1   # simulation sans interface
npm run format       # reformate le code
```

## Architecture

```
src/
  data/     chiffres et définitions du jeu (ressources, temps, climat...). Aucune logique.
  engine/   logique pure : state, step/advance, production, calendrier, hors ligne, sauvegarde, RNG.
  i18n/     textes de l'interface (en = référence, fr = traduction partielle avec repli).
  ui/       affichage, boucle temps réel, stockage navigateur, debug. Seule couche qui touche au DOM.
  main.ts   point d'entrée : charge la sauvegarde, lance la boucle, l'autosave.
sim/        simulateur d'équilibrage (Node), lancé en CI.
docs/       design et décisions.
```

Flux : `data` → `engine` (calcule un nouvel état) → `ui` (affiche). Jamais dans l'autre sens.

## Règles (non négociables)

1. **Le moteur est pur.** Dans `src/engine` et `src/data` : pas de DOM, pas de `Date.now()`,
   pas de `Math.random()` (utiliser `engine/rng.ts`, l'état du RNG vit dans `GameState.rng`),
   pas d'import de `ui/` ni `i18n/`. Le lint le vérifie.
2. **Immuabilité.** Les fonctions du moteur ne modifient jamais l'état reçu : elles en renvoient un nouveau.
3. **Aucun chiffre de gameplay dans le code.** Coûts, taux, durées, multiplicateurs : dans `src/data`.
4. **Toute formule a un test** (fichier `*.test.ts` à côté du module). Écrire le test d'abord quand c'est possible.
5. **`GameState` reste du JSON simple** (pas de classes, Map, Set, fonctions).
6. **Sauvegardes** : ajouter une ressource ne demande rien (`hydrate` complète). Renommer, supprimer
   ou changer le sens d'un champ : incrémenter `SAVE_VERSION` dans `engine/save.ts`, ajouter la
   migration dans `MIGRATIONS` et un test qui charge une sauvegarde de l'ancienne version.
7. **Textes** : aucune chaîne visible en dur dans `ui/`. Ajouter la clé dans `en.ts` (et `fr.ts` si possible).
   Les `{placeholders}` doivent être identiques dans chaque langue (testé).
8. **Nombres et durées affichés** : toujours via `ui/format.ts`.
9. **Affichage** : construire le DOM une fois, puis n'écrire que ce qui change (`textSlot`).
10. **Le simulateur doit rester vert.** Quand une mécanique arrive, enrichir `sim/simulate.ts`
    (stratégie, objectifs de rythme par ère tirés de `docs/design.md`).

## Façon de travailler

- Une fonctionnalité à la fois, en petites étapes. Proposer un plan court avant un changement important.
- `npm run check` avant chaque commit. Un commit par étape cohérente.
- Vérifier dans le jeu (`npm run dev`, ou le build avec `?debug`) : le panneau de debug permet
  d'accélérer le temps (×10, ×100), sauter une saison, remplir les ressources, exporter/importer, recommencer.
- Langue du jeu dans l'URL : `?lang=fr`. Panneau de debug en production : `?debug`.
- Si une décision de design change, mettre à jour `docs/design.md` et `docs/decisions.md` dans le même commit.
