import { v4 as uuidv4 } from 'uuid';

export class Checkpoint {
  id: string; // uuid
  trackingId: string;
  status: string;
  location?: string;
  timestamp: Date;

  constructor(data: { trackingId: string; status: string; location?: string }) {
    this.id = uuidv4();
    this.timestamp = new Date();
    this.trackingId = data.trackingId;
    this.status = data.status;
    this.location = data.location;
  }
}