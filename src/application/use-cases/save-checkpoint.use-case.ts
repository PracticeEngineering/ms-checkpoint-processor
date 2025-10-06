import { Inject, Injectable } from '@nestjs/common';
import { Checkpoint } from '../../domain/checkpoint.entity';
import { LOGGER_PROVIDER_TOKEN } from '../../infrastructure/logger/logger.constants';
import type { Logger } from 'pino';
import { TRANSACTION } from '../ports/itransaction';
import type { Itransaction } from '../ports/itransaction';

@Injectable()
export class SaveCheckpointUseCase {
  private readonly context = SaveCheckpointUseCase.name;

  constructor(
    @Inject(TRANSACTION) private readonly transaction: Itransaction,
    @Inject(LOGGER_PROVIDER_TOKEN) private readonly logger: Logger,
  ) {}

  async execute(data: { trackingId: string; status: string; location?: string }): Promise<void> {
    this.logger.info({ data }, `[${this.context}] Attempting to save checkpoint...`);

    // El caso de uso solo describe QUÉ hacer, y delega el CÓMO de la transacción a la Unit of Work.
    return this.transaction.execute(async(repos) => {
      // 1. Buscar el shipment usando el trackingId del mensaje
      const shipment = await repos.shipmentRepository.findByTrackingId(data.trackingId);
      
      if (!shipment) {
        this.logger.warn({ trackingId: data.trackingId }, `[${this.context}] Shipment not found. Work will not be committed.`);
        // TODO: Implement DLQ publishing. Send message to 'projects/sistema-tracking-474120/topics/DLQ'.
        return;
      }

      this.logger.info({ trackingId: data.trackingId, shipmentId: shipment.id }, `[${this.context}] Shipment found. Preparing to save checkpoint and update status.`);
      // 2. Crear el objeto de dominio Checkpoint
      // TODO: Refactorizar la creación de la entidad Checkpoint.
      const newCheckpoint = new Checkpoint();
      newCheckpoint.status = data.status;
      newCheckpoint.location = data.location;

      // 3. Guardar el checkpoint (usando el repositorio transaccional)
      await repos.checkpointRepository.save({
        ...newCheckpoint,
        shipmentId: shipment.id,
      });

      // 4. Actualizar el estado del shipment (usando el repositorio transaccional)
      await repos.shipmentRepository.updateStatus(shipment.id, data.status);

      this.logger.info({ trackingId: data.trackingId, status: data.status }, `[${this.context}] Transaction work completed successfully.`);
    })
  }
}