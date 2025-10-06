import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { Itransaction, ITransactionalRepositories } from '../../application/ports/itransaction';
import { DB_CONNECTION } from '../database/database.provider';
import { PostgresCheckpointRepository } from '../repositories/postgres.checkpoint.repository';
import { PostgresShipmentRepository } from '../repositories/postgres.shipment.repository';
import { LOGGER_PROVIDER_TOKEN } from '../logger/logger.constants';
import type { Logger } from 'pino';


@Injectable()
export class PostgresTransaction implements Itransaction {
  constructor(
    @Inject(DB_CONNECTION) private readonly pool: Pool,
    @Inject(LOGGER_PROVIDER_TOKEN) private readonly logger: Logger,
  ) {}

  async execute<T>(work: (repos: ITransactionalRepositories) => Promise<T>): Promise<T> {
    const client: PoolClient = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Creamos las instancias de los repositorios pasándoles el cliente transaccional
      // Deuda técnica (Responsable): Esto introduce un acoplamiento que, si bien no es ideal, 
      // está completamente encapsulado dentro de nuestra PostgresTransaction, y es una deuda técnica consciente y aceptable 
      // para evitar una complejidad mucho mayor.
      const transactionalRepos: ITransactionalRepositories = {
        checkpointRepository: new PostgresCheckpointRepository(client, this.logger),
        shipmentRepository: new PostgresShipmentRepository(client, this.logger),
      };
      
      const result = await work(transactionalRepos);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}