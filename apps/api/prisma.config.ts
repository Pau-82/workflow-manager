import { defineConfig, env } from 'prisma/config';

// Prisma 7 ya no autocarga `.env` cuando se usa prisma.config.ts: lo cargamos
// explícitamente. El evaluador copia `.env.example` a `.env` en la raíz del
// monorepo, pero los scripts corren Prisma desde apps/api (pnpm --filter), así
// que probamos ambas ubicaciones relativas al cwd:
//   - `.env`        -> si Prisma se invoca desde la raíz
//   - `../../.env`  -> si se invoca desde apps/api (caso de los scripts)
// Si no hay archivo (p. ej. CI con DATABASE_URL ya en el entorno), se ignora.
for (const candidate of ['.env', '../../.env']) {
  try {
    process.loadEnvFile(candidate);
    break;
  } catch {
    // archivo inexistente en esta ubicación: probamos la siguiente
  }
}

// Configuración de Prisma 7. La URL de conexión (antes en el schema) vive acá.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    // Seed de datos de ejemplo. tsconfig dedicado (CJS + transpileOnly) para que
    // ts-node lo corra sin pelearse con la config nodenext del monorepo.
    seed: 'ts-node --project prisma/tsconfig.seed.json prisma/seed.ts',
  },
});
