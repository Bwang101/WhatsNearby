import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity } from 'react-native';
import DatabaseService from '../../services/DatabaseService';
import GooglePlacesService from '../../services/GooglePlacesService';
import { getRandomNearbySuggestions, PlaceItem } from '../../services/PlaceService';

// Simple suggestions screen: pick 5 random places from the app's nearby list.
export default function SuggestionsScreen() {
  const [suggestions, setSuggestions] = useState<PlaceItem[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceItem[]>([]);
  const [allPlacesLoaded, setAllPlacesLoaded] = useState(false);
  const router = useRouter();
  const filters = ['library', 'cafe', 'park', 'gym', 'museum', 'communitySpace', 'studySpace'];

  const SUGGESTION_COUNT = 5;

  // Load all nearby places (not just history) using device location + Places API
  const loadNearbyPlaces = async () => {
    try {
      // Ask for permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location required', 'Please enable location permissions to see nearby places.');
        // fallback to history
        const recent = await DatabaseService.getRecentPlaces(50);
        const mappedFallback: PlaceItem[] = recent.map((h: any) => ({
          id: String(h.place_id ?? h.id ?? `${h.name}-${h.address}`),
          name: h.name,
          address: h.address,
          type: h.type ?? 'unknown',
          latitude: h.latitude,
          longitude: h.longitude,
          rating: h.rating,
        }));
        setNearbyPlaces(mappedFallback);
        setSuggestions(await getRandomNearbySuggestions(filters, SUGGESTION_COUNT, mappedFallback));
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      // Query Google Places for a variety of types in a single batch method
      const all = await GooglePlacesService.findAllFreeResources(lat, lng, 5000);

      // Aggregate results into a single PlaceItem[] and tag types
      const aggregated: PlaceItem[] = [];

      const pushPlaces = (places: any[], typeLabel: string) => {
        (places || []).forEach(p => {
          try {
            aggregated.push({
              id: p.place_id || `${p.name}-${p.vicinity}`,
              name: p.name,
              address: p.vicinity || p.formatted_address || '',
              type: typeLabel,
              latitude: p.geometry.location.lat,
              longitude: p.geometry.location.lng,
              rating: p.rating,
            });
          } catch (e) {
            // ignore malformed
          }
        });
      };

      pushPlaces(all.libraries, 'library');
      pushPlaces(all.cafes, 'cafe');
      pushPlaces(all.parks, 'park');
      pushPlaces(all.studySpaces, 'studySpace');
      pushPlaces(all.communitySpaces, 'communitySpace');
      pushPlaces(all.gyms, 'gym');
      pushPlaces(all.museums, 'museum');
      pushPlaces(all.publicRestrooms, 'publicRestroom');

      // Deduplicate by id
  const dedup = Object.values(aggregated.reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {})) as PlaceItem[];

  setNearbyPlaces(dedup);
  setAllPlacesLoaded(true);
  setSuggestions(await getRandomNearbySuggestions(filters, SUGGESTION_COUNT, dedup));
    } catch (err) {
      console.error('Failed to load places from API, falling back to history', err);
      // fallback to history
      const recent = await DatabaseService.getRecentPlaces(50);
      const mappedFallback: PlaceItem[] = recent.map((h: any) => ({
        id: String(h.place_id ?? h.id ?? `${h.name}-${h.address}`),
        name: h.name,
        address: h.address,
        type: h.type ?? 'unknown',
        latitude: h.latitude,
        longitude: h.longitude,
        rating: h.rating,
      }));
      setNearbyPlaces(mappedFallback);
      setSuggestions(await getRandomNearbySuggestions(filters, SUGGESTION_COUNT, mappedFallback));
    }
  };

  // Randomize suggestions from currently loaded nearbyPlaces
  const randomizeSuggestions = async () => {
    if (!nearbyPlaces || nearbyPlaces.length === 0) return;
    // if places were loaded from API we can reshuffle locally; otherwise same
    const items = await getRandomNearbySuggestions(filters, SUGGESTION_COUNT, nearbyPlaces);
    setSuggestions(items);
  };

  useEffect(() => { loadNearbyPlaces(); }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {suggestions.map(item => (
        <TouchableOpacity
          key={item.id}
          onPress={() => {
            // Navigate to map tab and pass coordinates so the map can center on this place
            router.push({ pathname: '/(tabs)/map', params: { lat: String(item.latitude), lng: String(item.longitude), placeId: item.id } });
          }}
          style={{ marginBottom: 12, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 }}
        >
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
          <Text>{item.address}</Text>
          <Text style={{ color: '#555' }}>{item.type}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={randomizeSuggestions}
        style={{ marginTop: 20, padding: 12, backgroundColor: '#007AFF', borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>New Suggestions</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
