import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // --- Dependencias hacia adentro por tipo de capa ---
            // Las apps (host NestJS / Next) pueden depender de todo lo de adentro.
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:contracts',
                'type:util',
              ],
            },
            // Los módulos (vertical slices) solo dependen de contracts y shared.
            // No dependen de apps ni de otros módulos (referencias entre agregados por ID).
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:contracts', 'type:util'],
            },
            // Contracts (schemas Zod + DTOs) solo puede apoyarse en utilidades compartidas.
            {
              sourceTag: 'type:contracts',
              onlyDependOnLibsWithTags: ['type:util'],
            },
            // Shared no depende de nada del dominio: es la hoja del grafo.
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util'],
            },

            // --- Aislamiento entre bounded contexts por scope ---
            {
              sourceTag: 'scope:workflows',
              onlyDependOnLibsWithTags: [
                'scope:workflows',
                'scope:contracts',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:alerts',
              onlyDependOnLibsWithTags: [
                'scope:alerts',
                'scope:contracts',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'scope:contracts',
              onlyDependOnLibsWithTags: ['scope:contracts', 'scope:shared'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            // El host api cablea todos los módulos (wiring de DI).
            {
              sourceTag: 'scope:api',
              onlyDependOnLibsWithTags: [
                'scope:api',
                'scope:workflows',
                'scope:alerts',
                'scope:contracts',
                'scope:shared',
              ],
            },
            // La web solo consume contracts (tipos/forms) y shared.
            {
              sourceTag: 'scope:web',
              onlyDependOnLibsWithTags: [
                'scope:web',
                'scope:contracts',
                'scope:shared',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
