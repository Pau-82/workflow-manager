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
          // Excepción puntual: la web consume SOLO el TIPO del router tRPC del host
          // api (`import type { AppRouter }`), para inferencia end-to-end. Es type-only
          // (se borra en runtime), así que no crea acoplamiento real web→api.
          allow: [
            '^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$',
            '@org/api/app-router',
          ],
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
            // Los módulos (vertical slices) pueden depender de otros módulos
            // (colaboración por puertos, p. ej. alerts → workflows/notifications),
            // contracts y shared. La DIRECCIÓN permitida la fija el `scope` de abajo
            // (evita ciclos: workflows no puede depender de alerts, etc.).
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:contracts',
                'type:util',
              ],
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
            // alerts orquesta el disparo: necesita workflows (Workflow + repo) y
            // notifications (puerto NotificationCreator). Depende de ambos.
            {
              sourceTag: 'scope:alerts',
              onlyDependOnLibsWithTags: [
                'scope:alerts',
                'scope:workflows',
                'scope:notifications',
                'scope:contracts',
                'scope:shared',
              ],
            },
            // notifications es módulo hoja: nadie del dominio depende hacia afuera
            // salvo contracts/shared (a alerts lo expone vía su puerto, no al revés).
            {
              sourceTag: 'scope:notifications',
              onlyDependOnLibsWithTags: [
                'scope:notifications',
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
                'scope:notifications',
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
