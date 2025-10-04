import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IShipmentRepository } from '../ports/ishipment.repository';
import { SHIPMENT_REPOSITORY } from '../ports/ishipment.repository';
import type { ICheckpointRepository } from '../ports/checkpoint.repository';
import { CHECKPOINT_REPOSITORY } from '../ports/checkpoint.repository';
import { Checkpoint } from '../../domain/checkpoint.entity';

@Injectable()
export class SaveCheckpointUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY)
    private readonly shipmentRepository: IShipmentRepository,
    @Inject(CHECKPOINT_REPOSITORY)
    private readonly checkpointRepository: ICheckpointRepository,
  ) {}

  async execute(data: { trackingId: string; status: string; location?: string }): Promise<void> {
    // 1. Buscar el shipment usando el trackingId del mensaje
    const shipment = await this.shipmentRepository.findByTrackingId(data.trackingId);
    if (!shipment) {
      console.error(`Error: No se encontró el shipment con trackingId: ${data.trackingId}. El mensaje será descartado.`);
      // En un sistema real, aquí enviaríamos el mensaje a una Dead-Letter Queue.
      return; 
    }

    // 2. Crear el objeto de dominio Checkpoint con el shipmentId correcto
    const newCheckpoint = new Checkpoint();
    newCheckpoint.status = data.status;
    newCheckpoint.location = data.location;
    
    // 3. Guardar el checkpoint usando el repositorio
    await this.checkpointRepository.save({
        ...newCheckpoint,
        shipmentId: shipment.id, // <-- Pasamos el ID (UUID) del shipment encontrado
    });
  }
}