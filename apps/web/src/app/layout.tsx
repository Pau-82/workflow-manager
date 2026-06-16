import type { ReactNode } from 'react';
import Link from 'next/link';
import './global.css';
import { TrpcProvider } from '@/lib/trpc-provider';
import { Nav } from '@/components/layout/nav';

export const metadata = {
  title: 'Workflow Manager',
  description: 'Gestión de workflows, alertas y notificaciones',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <TrpcProvider>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3">
                <Link href="/workflows" className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-600 text-sm font-bold text-white">
                    W
                  </span>
                  <span className="text-base font-semibold text-slate-800">
                    Workflow Manager
                  </span>
                </Link>
                <Nav />
              </div>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
              {children}
            </main>
          </div>
        </TrpcProvider>
      </body>
    </html>
  );
}
