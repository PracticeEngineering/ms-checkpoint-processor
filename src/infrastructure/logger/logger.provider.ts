import pino from 'pino';
import { LOGGER_PROVIDER_TOKEN } from './logger.constants';

export const loggerProvider = {
  provide: LOGGER_PROVIDER_TOKEN,
  useFactory: () => {
    const logger = pino({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
              },
            }
          : undefined,
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    logger.log = logger.info.bind(logger);

    return logger;
  },
};
