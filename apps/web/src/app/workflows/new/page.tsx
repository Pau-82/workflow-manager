'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { WorkflowForm } from '@/components/workflows/workflow-form';

export default function NewWorkflowPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const create = trpc.workflow.create.useMutation({
    onSuccess: async () => {
      await utils.workflow.list.invalidate();
      router.push('/workflows');
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Nuevo workflow</h1>
      <WorkflowForm
        mode="create"
        submitting={create.isPending}
        submitError={create.error?.message ?? null}
        onSubmit={(input) => create.mutate(input)}
        onCancel={() => router.push('/workflows')}
      />
    </div>
  );
}
