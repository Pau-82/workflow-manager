'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { trpc, type RouterOutputs } from '@/lib/trpc';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  LoadingState,
  Modal,
  SelectField,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TextareaField,
} from '@/components/ui';

type EventItem = RouterOutputs['event']['history']['items'][number];
type StatusFilter = 'all' | 'abierto' | 'resuelto';

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function contextText(ctx: EventItem['triggerContext']): string {
  if (ctx.type === 'threshold') {
    return `${ctx.metricName} ${ctx.operator} ${ctx.threshold} (observado: ${ctx.observedValue})`;
  }
  return `observado ${ctx.observedValue}, base ${ctx.baseValue}, desvío ${ctx.actualDeviation}%`;
}

export default function HistoryPage() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [workflowId, setWorkflowId] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [resolving, setResolving] = useState<EventItem | null>(null);

  const workflowsQuery = trpc.workflow.list.useQuery();
  const workflowNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const wf of workflowsQuery.data?.items ?? []) {
      map.set(wf.id, wf.name);
    }
    return map;
  }, [workflowsQuery.data]);

  const query = trpc.event.history.useQuery(
    {
      status: status === 'all' ? undefined : status,
      workflowId: workflowId === 'all' ? undefined : workflowId,
      page,
      limit: PAGE_SIZE,
    },
    { placeholderData: keepPreviousData },
  );

  const onFilterChange = (apply: () => void) => {
    apply();
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Historial de eventos
      </h1>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <SelectField
            label="Estado"
            value={status}
            onChange={(e) =>
              onFilterChange(() => setStatus(e.target.value as StatusFilter))
            }
          >
            <option value="all">Todos</option>
            <option value="abierto">Abierto</option>
            <option value="resuelto">Resuelto</option>
          </SelectField>
        </div>
        <div className="w-64">
          <SelectField
            label="Workflow"
            value={workflowId}
            onChange={(e) =>
              onFilterChange(() => setWorkflowId(e.target.value))
            }
          >
            <option value="all">Todos</option>
            {(workflowsQuery.data?.items ?? []).map((wf) => (
              <option key={wf.id} value={wf.id}>
                {wf.name}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {query.isError ? (
        <ErrorMessage
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      ) : query.isSuccess ? (
        query.data.items.length === 0 ? (
          <EmptyState
            title="No hay eventos."
            description="Simulá un disparo en un workflow para generar eventos."
          />
        ) : (
          <>
            <Card>
              <Table>
                <THead>
                  <TR>
                    <TH>Workflow</TH>
                    <TH>Disparado</TH>
                    <TH>Contexto</TH>
                    <TH>Mensaje</TH>
                    <TH>Estado</TH>
                    <TH className="text-right">Acciones</TH>
                  </TR>
                </THead>
                <TBody>
                  {query.data.items.map((event) => (
                    <TR key={event.id}>
                      <TD className="font-medium text-slate-800">
                        {workflowNames.get(event.workflowId) ??
                          event.workflowId.slice(0, 8)}
                      </TD>
                      <TD className="whitespace-nowrap text-slate-600">
                        {formatDate(event.triggeredAt)}
                      </TD>
                      <TD className="text-slate-600">
                        {contextText(event.triggerContext)}
                      </TD>
                      <TD>{event.renderedMessage}</TD>
                      <TD>
                        <Badge
                          tone={event.status === 'abierto' ? 'warning' : 'success'}
                        >
                          {event.status === 'abierto' ? 'Abierto' : 'Resuelto'}
                        </Badge>
                      </TD>
                      <TD>
                        <div className="flex justify-end">
                          {event.status === 'abierto' ? (
                            <Button
                              variant="secondary"
                              onClick={() => setResolving(event)}
                            >
                              Resolver
                            </Button>
                          ) : (
                            <div className="text-right text-xs text-slate-500">
                              {event.resolvedAt && (
                                <div>{formatDate(event.resolvedAt)}</div>
                              )}
                              {event.resolutionNote && (
                                <div className="italic">
                                  “{event.resolutionNote}”
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>

            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                Página {query.data.page} de {query.data.totalPages} ·{' '}
                {query.data.total} resultado
                {query.data.total === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={query.data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  disabled={query.data.page >= query.data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )
      ) : (
        <LoadingState label="Cargando eventos…" />
      )}

      {resolving && (
        <ResolveDialog
          event={resolving}
          onClose={() => setResolving(null)}
        />
      )}
    </div>
  );
}

function ResolveDialog({
  event,
  onClose,
}: {
  event: EventItem;
  onClose: () => void;
}) {
  const [note, setNote] = useState('');
  const utils = trpc.useUtils();
  const resolve = trpc.event.resolve.useMutation({
    onSuccess: async () => {
      await utils.event.history.invalidate();
      onClose();
    },
  });

  return (
    <Modal title="Resolver evento" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{event.renderedMessage}</p>
        <TextareaField
          label="Nota (opcional)"
          value={note}
          maxLength={300}
          onChange={(e) => setNote(e.target.value)}
          hint={`${note.length}/300`}
          placeholder="Qué se hizo para resolverlo…"
        />
        {resolve.isError && (
          <ErrorMessage
            title="No se pudo resolver"
            message={resolve.error.message}
          />
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            loading={resolve.isPending}
            onClick={() =>
              resolve.mutate({
                eventId: event.id,
                note: note.trim() === '' ? undefined : note.trim(),
              })
            }
          >
            Resolver
          </Button>
        </div>
      </div>
    </Modal>
  );
}
