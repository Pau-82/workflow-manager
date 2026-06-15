-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "triggerType" TEXT NOT NULL,
    "metricName" TEXT,
    "operator" TEXT,
    "thresholdValue" DOUBLE PRECISION,
    "baseValue" DOUBLE PRECISION,
    "deviationPercent" DOUBLE PRECISION,
    "direction" TEXT,
    "messageTemplate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipient" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "destination" TEXT NOT NULL,

    CONSTRAINT "Recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contextType" TEXT NOT NULL,
    "metricName" TEXT,
    "operator" TEXT,
    "threshold" DOUBLE PRECISION,
    "baseValue" DOUBLE PRECISION,
    "deviationPercent" DOUBLE PRECISION,
    "direction" TEXT,
    "actualDeviation" DOUBLE PRECISION,
    "observedValue" DOUBLE PRECISION NOT NULL,
    "renderedMessage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'abierto',
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,

    CONSTRAINT "AlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "alertEventId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recipient_workflowId_idx" ON "Recipient"("workflowId");

-- CreateIndex
CREATE INDEX "AlertEvent_workflowId_idx" ON "AlertEvent"("workflowId");

-- CreateIndex
CREATE INDEX "AlertEvent_triggeredAt_idx" ON "AlertEvent"("triggeredAt");

-- CreateIndex
CREATE INDEX "Notification_alertEventId_idx" ON "Notification"("alertEventId");

-- AddForeignKey
ALTER TABLE "Recipient" ADD CONSTRAINT "Recipient_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertEvent" ADD CONSTRAINT "AlertEvent_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_alertEventId_fkey" FOREIGN KEY ("alertEventId") REFERENCES "AlertEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Índice único PARCIAL — regla de no-duplicados (SQL manual).
-- Garantiza a lo sumo UN AlertEvent en estado 'abierto' por workflow.
-- Prisma no expresa índices parciales declarativamente, por eso se agrega acá.
-- Es la garantía real ante condiciones de carrera / múltiples instancias
-- (caso de uso SimulateTrigger).
-- ============================================================================
CREATE UNIQUE INDEX "AlertEvent_workflowId_open_unique"
    ON "AlertEvent" ("workflowId")
    WHERE "status" = 'abierto';
