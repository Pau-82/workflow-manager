'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc, type RouterOutputs } from '@/lib/trpc';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  LoadingState,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';

type WorkflowListItem = RouterOutputs['workflow']['list']['items'][number];

const TRIGGER_LABEL: Record<
  WorkflowListItem['triggerCondition']['type'],
  string
> = {
  threshold: 'Umbral',
  variance: 'Varianza',
};

export default function WorkflowsPage() {
  const router = useRouter();
  const query = trpc.workflow.list.useQuery();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Workflows</h1>
        <Button onClick={() => router.push('/workflows/new')}>
          Nuevo workflow
        </Button>
      </header>

      {query.isError ? (
        <ErrorMessage
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      ) : query.isSuccess ? (
        query.data.items.length === 0 ? (
          <EmptyState
            title="No hay workflows todavía."
            description="Creá el primero para empezar a vigilar tus métricas."
            action={
              <Button onClick={() => router.push('/workflows/new')}>
                Nuevo workflow
              </Button>
            }
          />
        ) : (
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Nombre</TH>
                  <TH>Tipo de disparo</TH>
                  <TH>Estado</TH>
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {query.data.items.map((workflow) => (
                  <WorkflowRow key={workflow.id} workflow={workflow} />
                ))}
              </TBody>
            </Table>
          </Card>
        )
      ) : (
        <LoadingState label="Cargando workflows…" />
      )}
    </div>
  );
}

/** Fila de la tabla con su propio estado de mutación (toggle activar/desactivar). */
function WorkflowRow({ workflow }: { workflow: WorkflowListItem }) {
  const utils = trpc.useUtils();
  const onSettled = () => utils.workflow.list.invalidate();
  const activate = trpc.workflow.activate.useMutation({ onSuccess: onSettled });
  const deactivate = trpc.workflow.deactivate.useMutation({
    onSuccess: onSettled,
  });

  const pending = activate.isPending || deactivate.isPending;
  const error = activate.error ?? deactivate.error;

  const toggle = () => {
    if (workflow.isActive) {
      deactivate.mutate({ id: workflow.id });
    } else {
      activate.mutate({ id: workflow.id });
    }
  };

  return (
    <>
      <TR>
        <TD className="font-medium text-slate-800">{workflow.name}</TD>
        <TD>{TRIGGER_LABEL[workflow.triggerCondition.type]}</TD>
        <TD>
          <Badge tone={workflow.isActive ? 'success' : 'neutral'}>
            {workflow.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </TD>
        <TD>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant={workflow.isActive ? 'secondary' : 'primary'}
              loading={pending}
              onClick={toggle}
            >
              {workflow.isActive ? 'Desactivar' : 'Activar'}
            </Button>
            <Link
              href={`/workflows/${workflow.id}`}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              Ver
            </Link>
            <Link
              href={`/workflows/${workflow.id}/edit`}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              Editar
            </Link>
          </div>
        </TD>
      </TR>
      {error && (
        <TR>
          <TD colSpan={4} className="bg-red-50 text-xs text-red-700">
            No se pudo cambiar el estado: {error.message}
          </TD>
        </TR>
      )}
    </>
  );
}
