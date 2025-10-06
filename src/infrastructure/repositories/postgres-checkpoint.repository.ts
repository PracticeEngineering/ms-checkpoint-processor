import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { ICheckpointRepository } from '../../application/ports/checkpoint.repository';
import { Checkpoint } from '../../domain/checkpoint.entity';
import { DB_CONNECTION } from '../database/database.provider';
import { v4 as uuidv4 } from 'uuid';
import { LOGGER_PROVIDER_TOKEN } from '../logger/logger.constants';
import type { Logger } from 'pino';

@Injectable()
export class PostgresCheckpointRepository implements ICheckpointRepository {
  private readonly context = PostgresCheckpointRepository.name;

  constructor(
    @Inject(DB_CONNECTION) private readonly pool: Pool,
    @Inject(LOGGER_PROVIDER_TOKEN) private readonly logger: Logger,
  ) {}

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
      this.logger.info(
        { checkpointId: id, shipmentId: checkpoint.shipmentId },
        `[${this.context}] Checkpoint saved successfully.`,
      );
    } catch (error) {
      // Postgres error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
      if (error.code === '23505') {
        // unique_violation
        this.logger.warn(
          {
            err: { code: error.code, detail: error.detail },
            checkpointId: id,
          },
          `[${this.context}] Attempted to insert a duplicate checkpoint.`,
        );
        throw new ConflictException('Checkpoint already exists.');
      }

      if (error.code === '23503') {
        // foreign_key_violation
        this.logger.error(
          {
            err: { code: error.code, detail: error.detail },
            shipmentId: checkpoint.shipmentId,
          },
          `[${this.context}] Attempted to insert a checkpoint with a non-existent shipmentId.`,
        );
        throw new InternalServerErrorException(
          'Invalid reference to a shipment.',
        );
      }

      this.logger.error(
        { err: error },
        `[${this.context}] An unexpected database error occurred while saving a checkpoint.`,
      );
      throw new InternalServerErrorException(
        'An unexpected database error occurred.',
      );
    }
  }
}