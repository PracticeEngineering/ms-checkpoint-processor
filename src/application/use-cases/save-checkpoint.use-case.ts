import { Inject, Injectable } from '@nestjs/common';
import type { IShipmentRepository } from '../ports/ishipment.repository';
import { SHIPMENT_REPOSITORY } from '../ports/ishipment.repository';
import type { ICheckpointRepository } from '../ports/checkpoint.repository';
import { CHECKPOINT_REPOSITORY } from '../ports/checkpoint.repository';
import { Checkpoint } from '../../domain/checkpoint.entity';
import { LOGGER_PROVIDER_TOKEN } from '../../infrastructure/logger/logger.constants';
import type { Logger } from 'pino';

@Injectable()
export class SaveCheckpointUseCase {
  private readonly context = SaveCheckpointUseCase.name;

  constructor(
    @Inject(SHIPMENT_REPOSITORY)
    private readonly shipmentRepository: IShipmentRepository,
    @Inject(CHECKPOINT_REPOSITORY)
    private readonly checkpointRepository: ICheckpointRepository,
    @Inject(LOGGER_PROVIDER_TOKEN) private readonly logger: Logger,
  ) {}

  async execute(data: { trackingId: string; status: string; location?: string }): Promise<void> {
    this.logger.info({ data }, `[${this.context}] Attempting to save checkpoint...`);

    try {
      // 1. Buscar el shipment usando el trackingId del mensaje
      const shipment = await this.shipmentRepository.findByTrackingId(
        data.trackingId,
      );
      if (!shipment) {
        this.logger.warn(
          { trackingId: data.trackingId },
          `[${this.context}] Shipment not found. The message will be discarded.`,
        );
        // TODO: Implement DLQ publishing. Send message to 'projects/sistema-tracking-474120/topics/DLQ'.
        return;
      }

      this.logger.info(
        { trackingId: data.trackingId, shipmentId: shipment.id },
        `[${this.context}] Shipment found. Saving checkpoint.`,
      );

      // 2. Crear el objeto de dominio Checkpoint con el shipmentId correcto
      const newCheckpoint = new Checkpoint();
      newCheckpoint.status = data.status;
      newCheckpoint.location = data.location;

      // 3. Guardar el checkpoint usando el repositorio
      await this.checkpointRepository.save({
        ...newCheckpoint,
        shipmentId: shipment.id, // <-- Pasamos el ID (UUID) del shipment encontrado
      });

      this.logger.info(
        { trackingId: data.trackingId, status: data.status },
        `[${this.context}] Checkpoint saved successfully.`,
      );
    } catch (error) {
      this.logger.error(
        { err: error, trackingId: data.trackingId },
        `[${this.context}] An unexpected error occurred while saving checkpoint.`,
      );
      // Re-lanzamos el error para que el orquestador del evento (ej. NATS/Kafka) decida qué hacer.
      throw error;
    }
  }
}