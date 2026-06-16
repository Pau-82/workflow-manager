'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './trpc';

/**
 * URL del endpoint tRPC del backend (apps/api lo monta en /trpc, puerto 3001).
 * Configurable por NEXT_PUBLIC_TRPC_URL; default razonable para desarrollo local.
 */
const TRPC_URL =
  process.env.NEXT_PUBLIC_TRPC_URL ?? 'http://localhost:3001/trpc';

/** Provider que habilita queries/mutations tipadas en toda la app (envuelve el layout). */
export function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false } },
      }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({ links: [httpBatchLink({ url: TRPC_URL })] }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
