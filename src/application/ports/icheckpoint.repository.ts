import { Checkpoint } from '../../domain/checkpoint.entity';

// Esta es la abstracción (puerto) que nuestra lógica de negocio utilizará.
// Dependerá de ESTA interfaz, no de una implementación concreta.
export interface ICheckpointRepository {
  save(checkpoint: Checkpoint & { shipmentId: string }): Promise<void>;
}

// Exportamos un token para la inyección de dependencias,
// ya que las interfaces no existen en tiempo de ejecución en JS.
export const CHECKPOINT_REPOSITORY = 'CheckpointRepository';
