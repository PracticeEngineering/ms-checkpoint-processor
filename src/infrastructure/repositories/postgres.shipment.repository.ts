import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { IShipmentRepository } from '../../application/ports/ishipment.repository';
import { Shipment } from '../../domain/shipment.entity';
import { DB_CONNECTION } from '../database/database.provider';

@Injectable()
export class PostgresShipmentRepository implements IShipmentRepository {
  constructor(@Inject(DB_CONNECTION) private readonly pool: Pool) {}

  async findByTrackingId(trackingId: string): Promise<Shipment | null> {
    const query = 'SELECT * FROM shipments WHERE tracking_id = $1 LIMIT 1';
    const result = await this.pool.query(query, [trackingId]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];
    
    // Mapeo manual de la fila de la BD al objeto de dominio
    const shipment = new Shipment();
    shipment.id = row.id;
    shipment.trackingId = row.tracking_id;
    shipment.currentStatus = row.current_status;
    shipment.createdAt = row.created_at;
    shipment.updatedAt = row.updated_at;

    return shipment;
  }
}