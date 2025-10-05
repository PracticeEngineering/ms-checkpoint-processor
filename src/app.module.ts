import { Module } from '@nestjs/common';
import { SaveCheckpointUseCase } from './application/use-cases/save-checkpoint.use-case';
import { SHIPMENT_REPOSITORY } from './application/ports/ishipment.repository';
import { PostgresShipmentRepository } from './infrastructure/repositories/postgres.shipment.repository';
import { PubSubModule } from './infrastructure/pubsub/pubsub.module';
import { CheckpointSubscriber } from './infrastructure/event-suscription/checkpoint.subscriber.service';
import { PostgresCheckpointRepository } from './infrastructure/repositories/postgres-checkpoint.repository';
import { CHECKPOINT_REPOSITORY } from './application/checkpoint.repository.interface';
import { DatabaseModule } from './infrastructure/database/database.module';

@Module({
  imports: [PubSubModule, DatabaseModule],
  controllers: [],
  providers: [
    CheckpointSubscriber, // <-- El servicio que escucha los mensajes
    SaveCheckpointUseCase,
    {
      provide: CHECKPOINT_REPOSITORY, // Cuando se pida esta interfaz...
      useClass: PostgresCheckpointRepository, // ...usa esta clase concreta.
    },
    { // <-- proveedor para el repositorio de shipments
      provide: SHIPMENT_REPOSITORY,
      useClass: PostgresShipmentRepository,
    },
  ],
})
export class AppModule {}