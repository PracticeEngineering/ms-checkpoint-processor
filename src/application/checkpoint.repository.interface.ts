import { Checkpoint } from '../domain/checkpoint.entity';

// Esta es la abstracción. Nuestra lógica de negocio dependerá de ESTA interfaz,
// no de una implementación concreta de PostgreSQL.
export interface ICheckpointRepository {
  save(checkpoint: Checkpoint): Promise<void>;
}

// Exportamos un token para la inyección de dependencias
export const CHECKPOINT_REPOSITORY = 'CheckpointRepository';