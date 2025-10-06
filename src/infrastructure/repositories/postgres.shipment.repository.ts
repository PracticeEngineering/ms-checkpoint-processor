import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DB_CONNECTION } from '../database/database.provider';
import type { Pool,PoolClient } from 'pg';
import { IShipmentRepository } from '../../application/ports/ishipment.repository';
import { Shipment } from '../../domain/shipment.entity';
import { LOGGER_PROVIDER_TOKEN } from '../logger/logger.constants';
import type { Logger } from 'pino';

@Injectable()
export class PostgresShipmentRepository implements IShipmentRepository {
  private readonly context = PostgresShipmentRepository.name;

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Pool | PoolClient,
    @Inject(LOGGER_PROVIDER_TOKEN) private readonly logger: Logger,
  ) {}

  async findByTrackingId(trackingId: string): Promise<Shipment | null> {
    const query = 'SELECT * FROM shipments WHERE tracking_id = $1 LIMIT 1';

    try {
      const result = await this.db.query(query, [trackingId]);

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

  async updateStatus(shipmentId: string, newStatus: string): Promise<void> {
    const query = `
      UPDATE shipments
      SET current_status = $1, updated_at = NOW()
      WHERE id = $2
    `;
    try {
      await this.db.query(query, [newStatus, shipmentId]);
      this.logger.info(
        { shipmentId, newStatus },
        `[${this.context}] Shipment status updated successfully.`,
      );
    } catch (error) {
      this.logger.error(
        { err: error, shipmentId },
        `[${this.context}] An unexpected database error occurred while updating shipment status.`,
      );
      throw new InternalServerErrorException(
        'An unexpected database error occurred.',
      );
    }
  }
}