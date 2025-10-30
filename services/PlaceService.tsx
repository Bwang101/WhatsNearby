export interface PlaceItem {
  id: string;
  name: string;
  address: string;
  type: string; // 'library' | 'cafe' | 'park' | ...
  latitude: number;
  longitude: number;
  rating?: number;
}

export const getRandomNearbySuggestions = async (
  filters: string[],
  count: number,
  nearbyPlaces: PlaceItem[]
): Promise<PlaceItem[]> => {
  // Filter by type
  const filtered = nearbyPlaces.filter(p => filters.includes(p.type));

  // Shuffle
  const shuffled = filtered.sort(() => 0.5 - Math.random());

  // Return first `count` items
  return shuffled.slice(0, count);
};

export default getRandomNearbySuggestions;