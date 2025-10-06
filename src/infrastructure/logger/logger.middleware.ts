import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import pinoHttp from 'pino-http';
import { LOGGER_PROVIDER_TOKEN } from './logger.constants';
import type { Logger } from 'pino';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly pinoHttp;

  constructor(@Inject(LOGGER_PROVIDER_TOKEN) private readonly logger: Logger) {
    this.pinoHttp = pinoHttp({ logger });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.pinoHttp(req, res);
    next();
  }
}
