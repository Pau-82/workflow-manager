import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PrismaUnitOfWork } from '../prisma-unit-of-work.js';
import { Result } from '../../../domain/errors/result/result.js';
import { UnexpectedError } from '../../../domain/errors/result/unexpected-error.js';

// Test de INTEGRACIÓN: requiere la base Postgres del docker-compose levantada.
// La DATABASE_URL puede venir ya inyectada por Nx (que carga el .env del workspace).
// Si NO está (p. ej. jest crudo), la cargamos a mano: subimos desde __dirname hasta
// encontrar el .env de la raíz y parseamos. (Ojo: `process.loadEnvFile` es no-op bajo
// el sandbox de jest, por eso parseamos manualmente.)
if (!process.env.DATABASE_URL) {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    const candidate = resolve(dir, '.env');
    if (existsSync(candidate)) {
      for (const line of readFileSync(candidate, 'utf8').split('\n')) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
        if (!match) {
          continue;
        }
        let value = match[2].trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (process.env[match[1]] === undefined) {
          process.env[match[1]] = value;
        }
      }
      break;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
}

jest.setTimeout(30000);

// IDs propios del test (distintos del seed) para no interferir.
const WF_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const EVENT_COMMIT = 'c0000001-0000-4000-8000-000000000001';
const EVENT_FAIL = 'c0000002-0000-4000-8000-000000000002';
const EVENT_THROW = 'c0000003-0000-4000-8000-000000000003';

function thresholdEvent(id: string): Prisma.AlertEventUncheckedCreateInput {
  return {
    id,
    workflowId: WF_ID,
    triggeredAt: new Date('2026-06-10T08:00:00Z'),
    contextType: 'threshold',
    metricName: 'cpu',
    operator: '>',
    threshold: 90,
    observedValue: 95,
    renderedMessage: 'CPU al 95%',
    status: 'abierto',
  };
}

describe('PrismaUnitOfWork (integración)', () => {
  let prisma: PrismaService;
  let uow: PrismaUnitOfWork;

  async function cleanup(): Promise<void> {
    await prisma.notification.deleteMany({
      where: { alertEvent: { workflowId: WF_ID } },
    });
    await prisma.alertEvent.deleteMany({ where: { workflowId: WF_ID } });
    await prisma.workflow.deleteMany({ where: { id: WF_ID } });
  }

  beforeAll(async () => {
    prisma = new PrismaService();
    uow = new PrismaUnitOfWork(prisma);
    await cleanup();
    // Workflow contenedor (FK de los AlertEvent).
    await prisma.workflow.create({
      data: {
        id: WF_ID,
        name: 'UoW test wf',
        isActive: true,
        triggerType: 'threshold',
        metricName: 'cpu',
        operator: '>',
        thresholdValue: 90,
        messageTemplate: 'CPU al {{valor}}%',
      },
    });
  });

  afterEach(async () => {
    await prisma.notification.deleteMany({
      where: { alertEvent: { workflowId: WF_ID } },
    });
    await prisma.alertEvent.deleteMany({ where: { workflowId: WF_ID } });
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('commit: si el callback devuelve ok, AMBAS escrituras persisten', async () => {
    const result = await uow.execute(async (tx) => {
      const db = tx as Prisma.TransactionClient;
      await db.alertEvent.create({ data: thresholdEvent(EVENT_COMMIT) });
      await db.notification.create({
        data: { alertEventId: EVENT_COMMIT, target: 'guardia', message: 'CPU al 95%' },
      });
      return Result.ok<boolean>(true);
    });

    expect(result.isSuccess()).toBe(true);

    const event = await prisma.alertEvent.findUnique({ where: { id: EVENT_COMMIT } });
    const notifs = await prisma.notification.count({
      where: { alertEventId: EVENT_COMMIT },
    });
    expect(event).not.toBeNull();
    expect(notifs).toBe(1);
  });

  it('rollback: si el callback devuelve fail, NINGUNA escritura persiste', async () => {
    const result = await uow.execute(async (tx) => {
      const db = tx as Prisma.TransactionClient;
      await db.alertEvent.create({ data: thresholdEvent(EVENT_FAIL) });
      await db.notification.create({
        data: { alertEventId: EVENT_FAIL, target: 'guardia', message: 'CPU al 95%' },
      });
      return Result.fail<boolean>(new UnexpectedError('test', 'fallo de negocio simulado'));
    });

    expect(result.isFailure()).toBe(true);

    const event = await prisma.alertEvent.findUnique({ where: { id: EVENT_FAIL } });
    const notifs = await prisma.notification.count({
      where: { alertEventId: EVENT_FAIL },
    });
    expect(event).toBeNull();
    expect(notifs).toBe(0);
  });

  it('rollback: si el callback LANZA, hace rollback y devuelve Result.fail', async () => {
    const result = await uow.execute(async (tx) => {
      const db = tx as Prisma.TransactionClient;
      await db.alertEvent.create({ data: thresholdEvent(EVENT_THROW) });
      throw new Error('boom inesperado');
    });

    expect(result.isFailure()).toBe(true);

    const event = await prisma.alertEvent.findUnique({ where: { id: EVENT_THROW } });
    expect(event).toBeNull();
  });
});
