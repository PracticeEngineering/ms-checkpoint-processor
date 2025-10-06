import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionLoggerFilter } from './infrastructure/common/filters/global-exception-logger.filter';
import { LOGGER_PROVIDER_TOKEN } from './infrastructure/logger/logger.constants';
import { Logger } from 'pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const appLogger = app.get<Logger>(LOGGER_PROVIDER_TOKEN);
  app.useLogger(appLogger as any);

  // Get dependencies for the global filter
  const httpAdapterHost = app.get(HttpAdapterHost);

  // Apply the global filter
  app.useGlobalFilters(new GlobalExceptionLoggerFilter(httpAdapterHost, appLogger));

  const port = process.env.PORT || 3000;
  app.enableShutdownHooks();

  await app.listen(port);
  appLogger.info(
    `Checkpoint processor service started on port ${port}, and is now bootstrapping subscribers.`,
  );
}
bootstrap();