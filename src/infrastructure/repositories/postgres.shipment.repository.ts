import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { IShipmentRepository } from '../../application/ports/ishipment.repository';
import { Shipment } from '../../domain/shipment.entity';
import { DB_CONNECTION } from '../database/database.provider';
import { LOGGER_PROVIDER_TOKEN } from '../logger/logger.constants';
import type { Logger } from 'pino';

@Injectable()
export class PostgresShipmentRepository implements IShipmentRepository {
  private readonly context = PostgresShipmentRepository.name;

  constructor(
    @Inject(DB_CONNECTION) private readonly pool: Pool,
    @Inject(LOGGER_PROVIDER_TOKEN) private readonly logger: Logger,
  ) {}

  async findByTrackingId(trackingId: string): Promise<Shipment | null> {
    const query = 'SELECT * FROM shipments WHERE tracking_id = $1 LIMIT 1';

    try {
      const result = await this.pool.query(query, [trackingId]);

      if (result.rowCount === 0) {
        this.logger.info({ trackingId }, `[${this.context}] No shipment found.`);
        return null;
      }

      const row = result.rows[0];
      this.logger.info(
        { trackingId, shipmentId: row.id },
        `[${this.context}] Shipment found.`,
      );

      // Mapeo manual de la fila de la BD al objeto de dominio
      const shipment = new Shipment();
      shipment.id = row.id;
      shipment.trackingId = row.tracking_id;
      shipment.currentStatus = row.current_status;
      shipment.createdAt = row.created_at;
      shipment.updatedAt = row.updated_at;

      return shipment;
    } catch (error) {
      this.logger.error(
        { err: error, trackingId },
        `[${this.context}] An unexpected database error occurred while finding shipment.`,
      );
      throw new InternalServerErrorException(
        'An unexpected database error occurred while finding shipment.',
      );
    }
  }
}