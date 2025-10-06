import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SaveCheckpointUseCase } from './application/use-cases/save-checkpoint.use-case';
import { PubSubModule } from './infrastructure/pubsub/pubsub.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AppController } from './infrastructure/controllers/app.controller';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { LoggerMiddleware } from './infrastructure/logger/logger.middleware';
import { TRANSACTION } from './application/ports/itransaction';
import { PostgresTransaction } from './infrastructure/repositories/postgres.transaction';

@Module({
  imports: [PubSubModule, DatabaseModule, LoggerModule],
  controllers: [AppController],
  providers: [
    SaveCheckpointUseCase,
    {
      provide: TRANSACTION,
      useClass: PostgresTransaction,
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}