import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    ignores: ['**/out-tsc'],
  },

  // --- Dependencias hacia adentro DENTRO del vertical slice (hexagonal) ---
  // Los límites de @nx/enforce-module-boundaries operan entre PROYECTOS; la
  // jerarquía de capas (domain ← application ← infrastructure) vive dentro de
  // este lib (carpetas), por lo que se fuerza con no-restricted-imports.

  // domain/ es el núcleo: no conoce application ni infrastructure.
  {
    files: ['**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/application/**', '**/infrastructure/**'],
              message:
                'El dominio no puede importar de application ni infrastructure (dependencias hacia adentro).',
            },
          ],
        },
      ],
    },
  },

  // application/ orquesta el dominio pero no conoce los adaptadores concretos.
  {
    files: ['**/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**'],
              message:
                'La capa de aplicación depende de puertos (domain/ports), nunca de infrastructure.',
            },
          ],
        },
      ],
    },
  },
];
