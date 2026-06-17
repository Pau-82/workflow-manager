'use client';

import { useParams, useRouter } from 'next/navigation';
import { trpc, type RouterOutputs } from '@/lib/trpc';
import {
  WorkflowForm,
  type WorkflowFormValues,
} from '@/components/workflows/workflow-form';
import { ErrorMessage, LoadingState } from '@/components/ui';

type WorkflowDetail = RouterOutputs['workflow']['getById'];

/** Mapea el DTO del backend al estado del formulario (incluye tipo y campos condicionales). */
function toFormValues(dto: WorkflowDetail): WorkflowFormValues {
  const trigger = dto.triggerCondition;
  return {
    name: dto.name,
    type: trigger.type,
    metricName: trigger.type === 'threshold' ? trigger.metricName : '',
    operator: trigger.type === 'threshold' ? trigger.operator : '>',
    value: trigger.type === 'threshold' ? String(trigger.value) : '',
    baseValue: trigger.type === 'variance' ? String(trigger.baseValue) : '',
    deviationPercent:
      trigger.type === 'variance' ? String(trigger.deviationPercent) : '',
    direction: trigger.type === 'variance' ? trigger.direction : 'above',
    messageTemplate: dto.messageTemplate,
    recipients: dto.recipients.map((r) =>
      r.channel === 'email'
        ? { channel: 'email', value: r.address }
        : { channel: 'in-app', value: r.target },
    ),
  };
}

export default function EditWorkflowPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const utils = trpc.useUtils();

  const query = trpc.workflow.getById.useQuery({ id });
  const update = trpc.workflow.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.workflow.list.invalidate(),
        utils.workflow.getById.invalidate({ id }),
      ]);
      router.push('/workflows');
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Editar workflow</h1>

      {query.isError ? (
        <ErrorMessage
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      ) : query.isSuccess ? (
        <WorkflowForm
          mode="edit"
          initialValues={toFormValues(query.data)}
          submitting={update.isPending}
          submitError={update.error?.message ?? null}
          onSubmit={(input) => update.mutate({ id, ...input })}
          onCancel={() => router.push('/workflows')}
        />
      ) : (
        <LoadingState label="Cargando workflow…" />
      )}
    </div>
  );
}
