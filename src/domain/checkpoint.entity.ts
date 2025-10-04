export class Checkpoint {
  id: string; // uuid
  trackingId: string;
  status: string;
  location?: string;
  timestamp: Date;
}