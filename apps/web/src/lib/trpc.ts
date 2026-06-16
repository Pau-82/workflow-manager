import { createTRPCReact } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
// TIPO del router del host api (type-only: se borra en runtime, sin acoplamiento real).
import type { AppRouter } from '@org/api/app-router';

/** Cliente tRPC + React Query, TIPADO contra el AppRouter del backend. */
export const trpc = createTRPCReact<AppRouter>();

/** Helpers de inferencia: tipos de input/output de cada procedure, sin redefinir nada. */
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
