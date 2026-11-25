// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // The engine and the game data must stay pure: no DOM, no wall clock, no Math.random,
    // no imports from the UI. This keeps them testable, deterministic and simulable.
    files: ['src/engine/**/*.ts', 'src/data/**/*.ts'],
    languageOptions: { globals: { ...globals.es2021 } },
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'The engine must not touch the DOM.' },
        { name: 'document', message: 'The engine must not touch the DOM.' },
        { name: 'localStorage', message: 'Persistence belongs to the UI layer.' },
        { name: 'performance', message: 'Pass time in as an argument.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded RNG in engine/rng.ts.' },
        { object: 'Date', property: 'now', message: 'Pass the current time in as an argument.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/ui', '**/ui/**', '**/i18n', '**/i18n/**'],
              message: 'The engine must not depend on the UI or texts.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
