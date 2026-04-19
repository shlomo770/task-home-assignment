export type ID = string;
export type ISODateString = string;

export interface Coordinates {
  lat: number;
  lng: number;
}

export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AppError {
  message: string;
  code?: string | number;
  details?: unknown;
}