import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { SaveCheckpointUseCase } from './application/use-cases/save-checkpoint.use-case';
import { SHIPMENT_REPOSITORY } from './application/ports/ishipment.repository';
import { PostgresShipmentRepository } from './infraestructura/repositories/postgres.shipment.repository';
import { PubSubModule } from './infraestructura/pubsub/pubsub.module';
import { CheckpointSubscriber } from './infraestructura/event-suscription/checkpoint.subscriber.service';
import { databaseProvider, DB_CONNECTION } from './infraestructura/database/database.provider';
import { PostgresCheckpointRepository } from './infraestructura/repositories/postgres-checkpoint.repository';
import { CHECKPOINT_REPOSITORY } from './application/checkpoint.repository.interface';

@Module({
  imports: [PubSubModule],
  controllers: [],
  providers: [
    CheckpointSubscriber, // <-- El servicio que escucha los mensajes
    SaveCheckpointUseCase,
    databaseProvider, // Proveedor de la conexión a la BD
    {
      provide: CHECKPOINT_REPOSITORY, // Cuando se pida esta interfaz...
      useClass: PostgresCheckpointRepository, // ...usa esta clase concreta.
    },
    { // <-- proveedor para el repositorio de shipments
      provide: SHIPMENT_REPOSITORY,
      useClass: PostgresShipmentRepository,
    },
    // Proveedor para cerrar la conexión de la BD al apagar la app
    {
      provide: 'APP_SHUTDOWN',
      inject: [DB_CONNECTION],
      useFactory: (pool: Pool) => async () => {
        await pool.end();
      },
    },
  ],
})
export class AppModule {}