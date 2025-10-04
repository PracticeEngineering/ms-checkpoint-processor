import { Checkpoint } from '../../domain/checkpoint.entity';

// Este es el token que usamos para la inyección de dependencias en el app.module
export const CHECKPOINT_REPOSITORY = 'CheckpointRepository';

export interface ICheckpointRepository {
  save(checkpoint: Checkpoint & { shipmentId: string }): Promise<void>;
}