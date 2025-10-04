import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { ICheckpointRepository } from '../../application/ports/checkpoint.repository';
import { Checkpoint } from '../../domain/checkpoint.entity';
import { DB_CONNECTION } from '../database/database.provider';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PostgresCheckpointRepository implements ICheckpointRepository {
  constructor(@Inject(DB_CONNECTION) private readonly pool: Pool) {}

  async save(checkpoint: Checkpoint & { shipmentId: string }): Promise<void> {
    const query = `
      INSERT INTO checkpoints (id, shipment_id, status, location, "timestamp")
      VALUES ($1, $2, $3, $4, $5)
    `;

    const id = checkpoint.id || uuidv4();
    const timestamp = checkpoint.timestamp || new Date();

    const values = [
      id,
      checkpoint.shipmentId,
      checkpoint.status,
      checkpoint.location,
      timestamp,
    ];

    try {
      await this.pool.query(query, values);
      console.log('Checkpoint guardado en PostgreSQL con shipmentId:', checkpoint.shipmentId);
    } catch (error) {
      console.error('Error al guardar el checkpoint en la base de datos:', error);
      throw error;
    }
  }
}