// types.ts
export interface Place {
  id: string;
  name: string;
  type: string;       // e.g., 'cafe', 'library', 'park', etc.
  latitude: number;
  longitude: number;
  rating?: number;
}
