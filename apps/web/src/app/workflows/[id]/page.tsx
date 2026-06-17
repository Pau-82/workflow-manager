'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { trpc, type RouterOutputs } from '@/lib/trpc';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorMessage,
  Field,
  LoadingState,
} from '@/components/ui';

type WorkflowDetail = RouterOutputs['workflow']['getById'];

const DIRECTION_LABEL: Record<string, string> = {
  above: 'Por encima',
  below: 'Por debajo',
  any: 'Cualquiera',
};
const CHANNEL_LABEL: Record<string, string> = {
  email: 'Email',
  'in-app': 'In-app',
};

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const query = trpc.workflow.getById.useQuery({ id });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          Detalle del workflow
        </h1>
        <Button variant="secondary" onClick={() => router.push('/workflows')}>
          Volver
        </Button>
      </div>

      {query.isError ? (
        <ErrorMessage
          title="No se pudo cargar el workflow"
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      ) : query.isSuccess ? (
        <WorkflowDetailView workflow={query.data} />
      ) : (
        <LoadingState label="Cargando workflow…" />
      )}
    </div>
  );
}

function WorkflowDetailView({ workflow }: { workflow: WorkflowDetail }) {
  const trigger = workflow.triggerCondition;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-3">
              {workflow.name}
              <Badge tone={workflow.isActive ? 'success' : 'neutral'}>
                {workflow.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </span>
          }
          actions={
            <Link
              href={`/workflows/${workflow.id}/edit`}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              Editar
            </Link>
          }
        />
        <CardBody className="space-y-4">
          <Section title="Disparo">
            {trigger.type === 'threshold' ? (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                <Item label="Tipo" value="Umbral" />
                <Item label="Métrica" value={trigger.metricName} />
                <Item label="Operador" value={trigger.operator} />
                <Item label="Valor" value={String(trigger.value)} />
              </dl>
            ) : (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                <Item label="Tipo" value="Varianza" />
                <Item label="Valor base" value={String(trigger.baseValue)} />
                <Item
                  label="Desviación"
                  value={`${trigger.deviationPercent}%`}
                />
                <Item
                  label="Dirección"
                  value={DIRECTION_LABEL[trigger.direction] ?? trigger.direction}
                />
              </dl>
            )}
          </Section>

          <Section title="Mensaje">
            <code className="block rounded bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {workflow.messageTemplate}
            </code>
          </Section>

          <Section title="Destinatarios">
            <ul className="space-y-1">
              {workflow.recipients.map((recipient, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Badge tone="info">
                    {CHANNEL_LABEL[recipient.channel] ?? recipient.channel}
                  </Badge>
                  <span className="text-slate-700">
                    {recipient.channel === 'email'
                      ? recipient.address
                      : recipient.target}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </CardBody>
      </Card>

      <SimulatePanel
        workflowId={workflow.id}
        isActive={workflow.isActive}
      />
    </div>
  );
}

function SimulatePanel({
  workflowId,
  isActive,
}: {
  workflowId: string;
  isActive: boolean;
}) {
  const [observed, setObserved] = useState('');
  const simulate = trpc.event.simulate.useMutation();

  const handleSimulate = () => {
    const value = observed.trim() === '' ? Number.NaN : Number(observed);
    if (!Number.isFinite(value)) {
      return;
    }
    simulate.mutate({ workflowId, observedValue: value });
  };

  return (
    <Card>
      <CardHeader
        title="Simular disparo"
        description="Ingresá un valor observado y mirá si el workflow dispara."
      />
      <CardBody className="space-y-4">
        {!isActive && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Este workflow está inactivo: no va a disparar hasta que lo actives.
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="w-48">
            <Field
              id="observedValue"
              label="Valor observado"
              type="number"
              step="any"
              value={observed}
              onChange={(e) => setObserved(e.target.value)}
              placeholder="95"
            />
          </div>
          <Button
            loading={simulate.isPending}
            disabled={observed.trim() === ''}
            onClick={handleSimulate}
          >
            Simular
          </Button>
        </div>

        {simulate.isError && (
          <ErrorMessage
            title="No se pudo simular"
            message={simulate.error.message}
          />
        )}

        {simulate.isSuccess && <SimulationResult result={simulate.data} />}
      </CardBody>
    </Card>
  );
}

function SimulationResult({
  result,
}: {
  result: RouterOutputs['event']['simulate'];
}) {
  if (!result.triggered) {
    return (
      <ResultBox tone="neutral" title="No disparó">
        La condición no se cumplió (o el workflow está inactivo). No se creó
        ningún evento.
      </ResultBox>
    );
  }

  if (result.duplicate) {
    return (
      <ResultBox
        tone="warning"
        title="Ya existe un evento abierto para este workflow"
      >
        No se creó uno nuevo: hay que resolver el evento abierto antes de que
        pueda volver a disparar.
        {result.eventId && (
          <span className="mt-1 block text-xs">Evento: {result.eventId}</span>
        )}
      </ResultBox>
    );
  }

  return (
    <ResultBox tone="success" title="Disparó: se creó un evento">
      {result.renderedMessage && (
        <span className="mt-1 block">
          Mensaje:{' '}
          <span className="font-medium">{result.renderedMessage}</span>
        </span>
      )}
      {result.eventId && (
        <span className="mt-1 block text-xs">Evento: {result.eventId}</span>
      )}
    </ResultBox>
  );
}

const RESULT_TONES = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  success: 'border-green-200 bg-green-50 text-green-800',
};

function ResultBox({
  tone,
  title,
  children,
}: {
  tone: keyof typeof RESULT_TONES;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${RESULT_TONES[tone]}`}>
      <p className="font-semibold">{title}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
