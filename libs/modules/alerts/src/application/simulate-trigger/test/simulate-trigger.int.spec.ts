import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '@org/shared/infrastructure';
import { SimulateTriggerHandler } from '../simulate-trigger.handler.js';
import { SimulateTriggerModule } from '../simulate-trigger.module.js';

// Test de INTEGRACIÓN: requiere el Postgres del docker-compose. Cargamos DATABASE_URL
// del .env de la raíz si Nx no la inyectó (process.loadEnvFile es no-op bajo jest).
if (!process.env.DATABASE_URL) {
  let dir = __dirname;
  for (let i = 0; i < 12; i++) {
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

const WF_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

describe('SimulateTrigger (integración)', () => {
  let moduleRef: TestingModule;
  let handler: SimulateTriggerHandler;
  let prisma: PrismaService;

  async function cleanup(): Promise<void> {
    await prisma.notification.deleteMany({
      where: { alertEvent: { workflowId: WF_ID } },
    });
    await prisma.alertEvent.deleteMany({ where: { workflowId: WF_ID } });
    await prisma.workflow.deleteMany({ where: { id: WF_ID } });
  }

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [SimulateTriggerModule],
    }).compile();
    handler = moduleRef.get(SimulateTriggerHandler);
    prisma = moduleRef.get(PrismaService);

    await cleanup();
    // Workflow activo, threshold cpu>90, con recipient in-app (genera notificación).
    await prisma.workflow.create({
      data: {
        id: WF_ID,
        name: 'Sim test wf',
        isActive: true,
        triggerType: 'threshold',
        metricName: 'cpu',
        operator: '>',
        thresholdValue: 90,
        messageTemplate: 'CPU al {{valor}}%',
        recipients: { create: [{ channel: 'in-app', destination: 'guardia' }] },
      },
    });
  });

  afterAll(async () => {
    await cleanup();
    await moduleRef.close();
  });

  it('al disparar crea el evento Y su notificación in-app atómicamente', async () => {
    const result = await handler.execute({ workflowId: WF_ID, observedValue: 95 });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.triggered).toBe(true);
      expect(result.value.duplicate).toBe(false);
      expect(result.value.eventId).toBeDefined();
    }

    const events = await prisma.alertEvent.findMany({ where: { workflowId: WF_ID } });
    expect(events).toHaveLength(1);
    const notifs = await prisma.notification.count({
      where: { alertEventId: events[0].id },
    });
    expect(notifs).toBe(1);
  });

  it('un segundo disparo con el evento aún abierto NO crea duplicado', async () => {
    const result = await handler.execute({ workflowId: WF_ID, observedValue: 99 });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.triggered).toBe(true);
      expect(result.value.duplicate).toBe(true);
    }

    const events = await prisma.alertEvent.count({ where: { workflowId: WF_ID } });
    expect(events).toBe(1); // sigue habiendo uno solo
  });
});
