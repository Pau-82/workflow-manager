// Borra artefactos de compilación de TS (dist/, out-tsc/) de todas las libs y apps.
// Las libs son `composite` con `emitDeclarationOnly`: emiten .d.ts a dist/. Si esas
// declaraciones quedan desfasadas del source, `tsc -b` (y el TS server) pueden marcar
// errores fantasma (TS6305 / tipos viejos). Limpiar dist fuerza una reconstrucción
// limpia. Cross-platform (Node puro, sin rm -rf).

import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const TARGET_DIRS = new Set(['dist', 'out-tsc']);
const ROOTS = ['libs', 'apps'];
let removed = 0;

function clean(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const full = join(dir, entry.name);
    if (TARGET_DIRS.has(entry.name)) {
      rmSync(full, { recursive: true, force: true });
      removed += 1;
      console.log('removed', full);
      continue;
    }
    if (entry.name === 'node_modules') {
      continue;
    }
    clean(full);
  }
}

for (const root of ROOTS) {
  if (existsSync(root)) {
    clean(root);
  }
}

console.log(`clean:dist done (${removed} dir(s) removed)`);
