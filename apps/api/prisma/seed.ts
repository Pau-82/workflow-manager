import { PrismaClient, Prisma } from '@prisma/client';
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

// IDs fijos de workflows (para filtrar por workflowId en pruebas manuales).
const WF = {
  cpu: '11111111-1111-4111-8111-111111111111',
  ventas: '22222222-2222-4222-8222-222222222222',
  memoria: '33333333-3333-4333-8333-333333333333',
  disco: '44444444-4444-4444-8444-444444444444',
  latencia: '55555555-5555-4555-8555-555555555555',
};

// IDs fijos de eventos (UUID válidos) para asociarles notificaciones.
const ev = (n: number) =>
  `e0000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`;

function dayDate(day: number): Date {
  return new Date(`2026-06-${String(day).padStart(2, '0')}T08:00:00Z`);
}
function resolvedAtFrom(day: number): Date {
  return new Date(dayDate(day).getTime() + 3 * 3600_000); // +3h
}

function thresholdEvent(args: {
  id: string;
  workflowId: string;
  day: number;
  metricName: string;
  operator: string;
  threshold: number;
  observedValue: number;
  message: string;
  note?: string;
}): Prisma.AlertEventCreateManyInput {
  return {
    id: args.id,
    workflowId: args.workflowId,
    triggeredAt: dayDate(args.day),
    contextType: 'threshold',
    metricName: args.metricName,
    operator: args.operator,
    threshold: args.threshold,
    observedValue: args.observedValue,
    renderedMessage: args.message,
    status: args.note ? 'resuelto' : 'abierto',
    resolvedAt: args.note ? resolvedAtFrom(args.day) : null,
    resolutionNote: args.note ?? null,
  };
}

function varianceEvent(args: {
  id: string;
  workflowId: string;
  day: number;
  baseValue: number;
  deviationPercent: number;
  direction: string;
  observedValue: number;
  actualDeviation: number;
  message: string;
  note?: string;
}): Prisma.AlertEventCreateManyInput {
  return {
    id: args.id,
    workflowId: args.workflowId,
    triggeredAt: dayDate(args.day),
    contextType: 'variance',
    baseValue: args.baseValue,
    deviationPercent: args.deviationPercent,
    direction: args.direction,
    actualDeviation: args.actualDeviation,
    observedValue: args.observedValue,
    renderedMessage: args.message,
    status: args.note ? 'resuelto' : 'abierto',
    resolvedAt: args.note ? resolvedAtFrom(args.day) : null,
    resolutionNote: args.note ?? null,
  };
}

function notif(args: {
  alertEventId: string;
  day: number;
  target: string;
  message: string;
}): Prisma.NotificationCreateManyInput {
  return {
    alertEventId: args.alertEventId,
    target: args.target,
    message: args.message,
    createdAt: new Date(dayDate(args.day).getTime() + 1000),
  };
}

async function main(): Promise<void> {
  // Idempotente: limpiamos en orden de dependencias.
  await prisma.notification.deleteMany();
  await prisma.alertEvent.deleteMany();
  await prisma.recipient.deleteMany();
  await prisma.workflow.deleteMany();

  // --- Workflows (3 activos + 2 inactivos; umbral/varianza; mono y multi destino) ---
  await prisma.workflow.create({
    data: {
      id: WF.cpu,
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
      id: WF.ventas,
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

  await prisma.workflow.create({
    data: {
      id: WF.memoria,
      name: 'Memoria alta',
      isActive: true,
      triggerType: 'threshold',
      metricName: 'memoria',
      operator: '>=',
      thresholdValue: 85,
      messageTemplate: 'Memoria al {{valor}}%',
      recipients: {
        create: [
          { channel: 'in-app', destination: 'infra' },
          { channel: 'email', destination: 'infra@empresa.com' },
        ],
      },
    },
  });

  await prisma.workflow.create({
    data: {
      id: WF.disco,
      name: 'Disco lleno',
      isActive: false,
      triggerType: 'threshold',
      metricName: 'disco',
      operator: '>',
      thresholdValue: 95,
      messageTemplate: 'Disco al {{valor}}%',
      recipients: { create: [{ channel: 'in-app', destination: 'guardia' }] },
    },
  });

  await prisma.workflow.create({
    data: {
      id: WF.latencia,
      name: 'Latencia elevada',
      isActive: false,
      triggerType: 'variance',
      baseValue: 200,
      deviationPercent: 30,
      direction: 'above',
      messageTemplate: 'Latencia subió {{desvio}}%',
      recipients: {
        create: [{ channel: 'email', destination: 'sre@empresa.com' }],
      },
    },
  });

  // --- AlertEvents (14: 11 resueltos + 3 abiertos; regla: máx 1 abierto por workflow) ---
  // Los abiertos están solo en workflows ACTIVOS (cpu, ventas, memoria).
  await prisma.alertEvent.createMany({
    data: [
      // CPU (3 resueltos + 1 abierto)
      thresholdEvent({ id: ev(1), workflowId: WF.cpu, day: 1, metricName: 'cpu', operator: '>', threshold: 90, observedValue: 91, message: 'CPU al 91%', note: 'Pico transitorio, normalizado.' }),
      thresholdEvent({ id: ev(2), workflowId: WF.cpu, day: 2, metricName: 'cpu', operator: '>', threshold: 90, observedValue: 95, message: 'CPU al 95%', note: 'Escalado el servicio.' }),
      thresholdEvent({ id: ev(3), workflowId: WF.cpu, day: 6, metricName: 'cpu', operator: '>', threshold: 90, observedValue: 93, message: 'CPU al 93%', note: 'Reinicio del pod.' }),
      thresholdEvent({ id: ev(4), workflowId: WF.cpu, day: 10, metricName: 'cpu', operator: '>', threshold: 90, observedValue: 99, message: 'CPU al 99%' }),
      // Ventas (1 resuelto + 1 abierto)
      varianceEvent({ id: ev(5), workflowId: WF.ventas, day: 3, baseValue: 1000, deviationPercent: 20, direction: 'below', observedValue: 780, actualDeviation: -22, message: 'Ventas cayeron 22%', note: 'Promoción lanzada.' }),
      varianceEvent({ id: ev(6), workflowId: WF.ventas, day: 9, baseValue: 1000, deviationPercent: 20, direction: 'below', observedValue: 700, actualDeviation: -30, message: 'Ventas cayeron 30%' }),
      // Memoria (2 resueltos + 1 abierto)
      thresholdEvent({ id: ev(7), workflowId: WF.memoria, day: 4, metricName: 'memoria', operator: '>=', threshold: 85, observedValue: 88, message: 'Memoria al 88%', note: 'Liberada la cache.' }),
      thresholdEvent({ id: ev(8), workflowId: WF.memoria, day: 7, metricName: 'memoria', operator: '>=', threshold: 85, observedValue: 91, message: 'Memoria al 91%', note: 'Aumentado el límite.' }),
      thresholdEvent({ id: ev(9), workflowId: WF.memoria, day: 11, metricName: 'memoria', operator: '>=', threshold: 85, observedValue: 95, message: 'Memoria al 95%' }),
      // Disco (inactivo: 3 resueltos históricos)
      thresholdEvent({ id: ev(10), workflowId: WF.disco, day: 5, metricName: 'disco', operator: '>', threshold: 95, observedValue: 96, message: 'Disco al 96%', note: 'Limpieza de logs.' }),
      thresholdEvent({ id: ev(11), workflowId: WF.disco, day: 8, metricName: 'disco', operator: '>', threshold: 95, observedValue: 97, message: 'Disco al 97%', note: 'Ampliado el volumen.' }),
      thresholdEvent({ id: ev(14), workflowId: WF.disco, day: 13, metricName: 'disco', operator: '>', threshold: 95, observedValue: 98, message: 'Disco al 98%', note: 'Rotación de backups.' }),
      // Latencia (inactivo: 2 resueltos históricos)
      varianceEvent({ id: ev(12), workflowId: WF.latencia, day: 12, baseValue: 200, deviationPercent: 30, direction: 'above', observedValue: 280, actualDeviation: 40, message: 'Latencia subió 40%', note: 'Optimizada la query.' }),
      varianceEvent({ id: ev(13), workflowId: WF.latencia, day: 14, baseValue: 200, deviationPercent: 30, direction: 'above', observedValue: 310, actualDeviation: 55, message: 'Latencia subió 55%', note: 'Agregado índice.' }),
    ],
  });

  // --- Notifications in-app (las generaría SimulateTrigger; solo destinatarios in-app) ---
  await prisma.notification.createMany({
    data: [
      notif({ alertEventId: ev(1), day: 1, target: 'guardia', message: 'CPU al 91%' }),
      notif({ alertEventId: ev(2), day: 2, target: 'guardia', message: 'CPU al 95%' }),
      notif({ alertEventId: ev(3), day: 6, target: 'guardia', message: 'CPU al 93%' }),
      notif({ alertEventId: ev(4), day: 10, target: 'guardia', message: 'CPU al 99%' }),
      notif({ alertEventId: ev(7), day: 4, target: 'infra', message: 'Memoria al 88%' }),
      notif({ alertEventId: ev(8), day: 7, target: 'infra', message: 'Memoria al 91%' }),
      notif({ alertEventId: ev(9), day: 11, target: 'infra', message: 'Memoria al 95%' }),
      notif({ alertEventId: ev(10), day: 5, target: 'guardia', message: 'Disco al 96%' }),
      notif({ alertEventId: ev(11), day: 8, target: 'guardia', message: 'Disco al 97%' }),
      notif({ alertEventId: ev(14), day: 13, target: 'guardia', message: 'Disco al 98%' }),
    ],
  });

  const [workflows, events, notifications] = await Promise.all([
    prisma.workflow.count(),
    prisma.alertEvent.count(),
    prisma.notification.count(),
  ]);
  console.log(
    `Seed OK: ${workflows} workflows, ${events} alert events, ${notifications} notifications.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
