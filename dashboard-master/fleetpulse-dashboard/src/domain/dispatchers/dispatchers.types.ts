import type { ID, ISODateString } from '../../shared/types/common';

export interface Dispatcher {
  id: ID;
  name: string;
  isOnline: boolean;
  viewingTruckId: ID | null;
  lastSeenAt: ISODateString | null;
}