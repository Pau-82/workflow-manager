import { Logger as NestLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { LayeredError, LOGGER, type Logger } from '@org/shared';
import { ZodError } from 'zod';
import { AppModule } from './app/app.module';
import { TrpcService } from './trpc/trpc.service';

async function bootstrap() {
  // Carga el .env de la raíz (DATABASE_URL) si está presente.
  try {
    process.loadEnvFile();
  } catch {
    // .env ausente (p. ej. variables ya en el entorno): se ignora.
  }

  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // CORS para que la web (otro origen en dev) pueda llamar a /trpc. Configurable
  // por WEB_ORIGIN (coma-separado); default al puerto de Next en desarrollo.
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({
    origin: webOrigin.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  const trpc = app.get(TrpcService);
  const logger = app.get<Logger>(LOGGER);
  const expressApp = app.getHttpAdapter().getInstance();

  // Monta tRPC como middleware express, fuera del prefijo global (queda en /trpc).
  expressApp.use(
    '/trpc',
    createExpressMiddleware({
      router: trpc.appRouter,
      createContext: () => ({}),
      // Único punto de logging de errores: se dispara una vez por cada error que
      // sale al cliente (validación Zod + dominio/aplicación). 5xx → error con
      // stack; 4xx → warn estructurado (errores de cliente, sin stack).
      onError: ({ error, path }) => {
        const context = path ? `tRPC:${path}` : 'tRPC';
        const cause = error.cause;

        if (error.code === 'INTERNAL_SERVER_ERROR') {
          if (cause instanceof LayeredError) {
            logger.logLayeredError(cause, context);
          } else {
            logger.logUnknownError(cause ?? error, context);
          }
          return;
        }

        if (cause instanceof ZodError) {
          logger.warn('Input validation failed', context, {
            code: error.code,
            fieldErrors: cause.flatten().fieldErrors,
          });
        } else if (cause instanceof LayeredError) {
          logger.warn(cause.reason, context, {
            code: error.code,
            type: cause.type,
            layer: cause.layer,
          });
        } else {
          logger.warn(error.message, context, { code: error.code });
        }
      },
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  NestLogger.log(
    `🚀 API running on http://localhost:${port}/${globalPrefix} (tRPC at /trpc)`,
  );
}

bootstrap();
