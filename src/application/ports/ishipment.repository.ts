import { Shipment } from '../../domain/shipment.entity';

export const SHIPMENT_REPOSITORY = 'ShipmentRepository';

export interface IShipmentRepository {
  findByTrackingId(trackingId: string): Promise<Shipment | null>;
  updateStatus(shipmentId: string, newStatus: string): Promise<void>;
}