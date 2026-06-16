import type { ReactNode } from 'react';
import { Card, CardBody } from '@/components/ui';

/** Página placeholder ("Próximamente") para rutas aún sin construir. */
export function Placeholder({
  title,
  description,
}: {
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <Card>
        <CardBody>
          <p className="text-sm text-slate-500">
            {description ?? 'Próximamente.'}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
