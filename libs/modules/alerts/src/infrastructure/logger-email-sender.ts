import { Inject, Injectable } from '@nestjs/common';
import { Result, LOGGER, type Logger, type LayeredError } from '@org/shared';
import type { IEmailSender } from '../domain/ports/email-sender.port.js';

const CONTEXT = 'LoggerEmailSender';

/**
 * Stub de IEmailSender: "envía" logueando (vía el puerto Logger), sin proveedor real.
 * La arquitectura queda lista para un proveedor real cambiando sólo el binding del
 * token EMAIL_SENDER por otra impl.
 */
@Injectable()
export class LoggerEmailSender implements IEmailSender {
  constructor(@Inject(LOGGER) private readonly logger: Logger) {}

  async send(
    recipient: string,
    message: string,
  ): Promise<Result<void, LayeredError>> {
    this.logger.log('Email enviado (stub)', CONTEXT, { recipient, message });
    return Result.ok<void>(undefined);
  }
}
