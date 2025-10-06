import { ICheckpointRepository } from './icheckpoint.repository';
import { IShipmentRepository } from './ishipment.repository';

// Define las interfaces de los repositorios que pueden participar en una transacción
export interface ITransactionalRepositories {
  checkpointRepository: ICheckpointRepository;
  shipmentRepository: IShipmentRepository;
}

// Define la interfaz principal de la Unit of Work (Transacción)
export interface Itransaction {
  execute<T>(work: (repos: ITransactionalRepositories) => Promise<T>): Promise<T>;
}

export const TRANSACTION = 'Transaction';