'use client';

import { trpc } from '@/lib/trpc';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  ErrorMessage,
  LoadingState,
} from '@/components/ui';

/**
 * Placeholder de Workflows. Incluye un smoke test del cliente tRPC tipado
 * (trpc.workflow.list): confirma conexión + inferencia end-to-end. La pantalla
 * completa (tabla + alta) llega en el próximo prompt.
 */
export default function WorkflowsPage() {
  const query = trpc.workflow.list.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Workflows</h1>
        <p className="mt-1 text-sm text-slate-500">
          La lista completa y el alta llegan en el próximo prompt.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Conexión con el backend"
          description="Smoke test del cliente tRPC tipado (trpc.workflow.list)."
        />
        <CardBody>
          {query.isError ? (
            <ErrorMessage
              message={query.error.message}
              onRetry={() => query.refetch()}
            />
          ) : query.isSuccess ? (
            <p className="flex items-center gap-2 text-sm text-slate-700">
              Conectado:
              <Badge tone="info">{query.data.items.length} workflows</Badge>
            </p>
          ) : (
            <LoadingState label="Consultando workflows…" />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
