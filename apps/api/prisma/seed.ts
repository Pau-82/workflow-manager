import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 no autocarga `.env` con prisma.config.ts. El proceso del seed hereda el
// entorno del CLI (que ya cargó .env), pero por las dudas lo intentamos también acá.
for (const candidate of ['.env', '../../.env']) {
  try {
    process.loadEnvFile(candidate);
    break;
  } catch {
    // archivo inexistente en esta ubicación: probamos la siguiente
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

// IDs fijos para poder filtrar por workflowId en pruebas manuales (.http).
const WF_CPU_ID = '11111111-1111-4111-8111-111111111111';
const WF_VAR_ID = '22222222-2222-4222-8222-222222222222';

async function main(): Promise<void> {
  // Idempotente: limpiamos en orden de dependencias.
  await prisma.notification.deleteMany();
  await prisma.alertEvent.deleteMany();
  await prisma.recipient.deleteMany();
  await prisma.workflow.deleteMany();

  // --- Workflows ---
  await prisma.workflow.create({
    data: {
      id: WF_CPU_ID,
      name: 'Alerta CPU alta',
      isActive: true,
      triggerType: 'threshold',
      metricName: 'cpu',
      operator: '>',
      thresholdValue: 90,
      messageTemplate: 'CPU al {{valor}}%',
      recipients: { create: [{ channel: 'in-app', destination: 'guardia' }] },
    },
  });

  await prisma.workflow.create({
    data: {
      id: WF_VAR_ID,
      name: 'Caída de ventas',
      isActive: true,
      triggerType: 'variance',
      baseValue: 1000,
      deviationPercent: 20,
      direction: 'below',
      messageTemplate: 'Ventas cayeron {{desvio}}%',
      recipients: {
        create: [{ channel: 'email', destination: 'ventas@empresa.com' }],
      },
    },
  });

  // --- AlertEvents (abiertos y resueltos, de ambos workflows) ---
  // Regla de negocio: a lo sumo UN evento 'abierto' por workflow.
  await prisma.alertEvent.createMany({
    data: [
      {
        workflowId: WF_CPU_ID,
        triggeredAt: new Date('2026-06-01T08:00:00Z'),
        contextType: 'threshold',
        metricName: 'cpu',
        operator: '>',
        threshold: 90,
        observedValue: 91,
        renderedMessage: 'CPU al 91%',
        status: 'resuelto',
        resolvedAt: new Date('2026-06-01T09:00:00Z'),
        resolutionNote: 'Pico transitorio, normalizado.',
      },
      {
        workflowId: WF_CPU_ID,
        triggeredAt: new Date('2026-06-02T08:00:00Z'),
        contextType: 'threshold',
        metricName: 'cpu',
        operator: '>',
        threshold: 90,
        observedValue: 95,
        renderedMessage: 'CPU al 95%',
        status: 'resuelto',
        resolvedAt: new Date('2026-06-02T10:30:00Z'),
        resolutionNote: 'Escalado el servicio.',
      },
      {
        workflowId: WF_VAR_ID,
        triggeredAt: new Date('2026-06-03T08:00:00Z'),
        contextType: 'variance',
        baseValue: 1000,
        deviationPercent: 20,
        direction: 'below',
        actualDeviation: -22,
        observedValue: 780,
        renderedMessage: 'Ventas cayeron 22%',
        status: 'resuelto',
        resolvedAt: new Date('2026-06-03T18:00:00Z'),
        resolutionNote: 'Promoción lanzada.',
      },
      {
        workflowId: WF_VAR_ID,
        triggeredAt: new Date('2026-06-04T08:00:00Z'),
        contextType: 'variance',
        baseValue: 1000,
        deviationPercent: 20,
        direction: 'below',
        actualDeviation: -30,
        observedValue: 700,
        renderedMessage: 'Ventas cayeron 30%',
        status: 'abierto',
      },
      {
        workflowId: WF_CPU_ID,
        triggeredAt: new Date('2026-06-05T08:00:00Z'),
        contextType: 'threshold',
        metricName: 'cpu',
        operator: '>',
        threshold: 90,
        observedValue: 99,
        renderedMessage: 'CPU al 99%',
        status: 'abierto',
      },
    ],
  });

  const [workflows, events] = await Promise.all([
    prisma.workflow.count(),
    prisma.alertEvent.count(),
  ]);
  console.log(`Seed OK: ${workflows} workflows, ${events} alert events.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
