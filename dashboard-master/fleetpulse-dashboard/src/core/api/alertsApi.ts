import { httpFetch } from './httpClient';

export function sendTruckAlert(truckId: string, message: string) {
  return httpFetch(`/fleet/${truckId}/alert`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}