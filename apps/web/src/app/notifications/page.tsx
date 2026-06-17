'use client';

import { trpc, type RouterOutputs } from '@/lib/trpc';
import {
  Badge,
  Card,
  CardBody,
  EmptyState,
  ErrorMessage,
  LoadingState,
} from '@/components/ui';

type NotificationItem =
  RouterOutputs['notification']['list']['items'][number];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function NotificationsPage() {
  const query = trpc.notification.list.useQuery();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Notificaciones</h1>

      {query.isError ? (
        <ErrorMessage
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      ) : query.isSuccess ? (
        query.data.items.length === 0 ? (
          <EmptyState
            title="No hay notificaciones."
            description="Se generan al disparar workflows con destinatarios in-app."
          />
        ) : (
          <div className="space-y-3">
            {query.data.items.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        )
      ) : (
        <LoadingState label="Cargando notificaciones…" />
      )}
    </div>
  );
}

function NotificationCard({
  notification,
}: {
  notification: NotificationItem;
}) {
  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-800">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Badge tone="info">in-app</Badge>
            <span>{notification.target}</span>
          </div>
        </div>
        <span className="whitespace-nowrap text-xs text-slate-400">
          {formatDate(notification.createdAt)}
        </span>
      </CardBody>
    </Card>
  );
}
