// Google Places API service for finding nearby free resources
import Constants from 'expo-constants';

export interface PlaceLocation {
  lat: number;
  lng: number;
}

export interface Place {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: PlaceLocation;
  };
  rating?: number;
  price_level?: number;
  types: string[];
  opening_hours?: {
    open_now: boolean;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

export interface PlacesApiResponse {
  results: Place[];
  status: string;
  next_page_token?: string;
  error_message?: string;
}

export interface PlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    formatted_phone_number?: string;
    website?: string;
    rating?: number;
    reviews?: Array<{
      author_name: string;
      rating: number;
      text: string;
      time: number;
    }>;
    opening_hours?: {
      open_now: boolean;
      weekday_text: string[];
    };
    photos?: Array<{
      photo_reference: string;
      height: number;
      width: number;
    }>;
  };
  status: string;
}

class GooglePlacesService {
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';
  private readonly apiKey: string;

  constructor() {
    // Get API key from Expo Constants (set in app.json)
    this.apiKey = Constants.expoConfig?.extra?.googlePlacesApiKey || 'YOUR_PLACES_API_KEY_HERE';
    console.log("API KEY: ", this.apiKey);
  }

  /**
   * Search for nearby places based on location and place types
   */
  async searchNearbyPlaces(
    latitude: number,
    longitude: number,
    radius: number = 5000, // 5km default
    type?: string,
    keyword?: string
  ): Promise<Place[]> {
    try {
      const params = new URLSearchParams({
        location: `${latitude},${longitude}`,
        radius: radius.toString(),
        key: this.apiKey,
      });

      if (type) params.append('type', type);
      if (keyword) params.append('keyword', keyword);

      const requestUrl = `${this.baseUrl}/nearbysearch/json?${params}`;
      console.log('🔍 Places API Request:', requestUrl);
      console.log('🔑 API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');
      
      const response = await fetch(requestUrl);
      const data: PlacesApiResponse = await response.json();

      console.log('📡 Places API Response Status:', data.status);
      console.log('📊 Places API Response:', data);

      if (data.status === 'OK') {
        console.log('✅ Found', data.results.length, 'places');
        return data.results;
      } else {
        console.error('❌ Places API error:', data.status);
        if (data.error_message) {
          console.error('❌ Error message:', data.error_message);
        }
        return [];
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse['result'] | null> {
    try {
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'place_id,name,formatted_address,formatted_phone_number,website,rating,reviews,opening_hours,photos',
        key: this.apiKey,
      });

      const response = await fetch(`${this.baseUrl}/details/json?${params}`);
      const data: PlaceDetailsResponse = await response.json();

      if (data.status === 'OK') {
        return data.result;
      } else {
        console.error('Place details API error:', data.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }

  /**
   * Get photo URL from photo reference
   */
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }

  /**
   * Search for libraries specifically
   */
  async findLibraries(latitude: number, longitude: number, radius: number = 5000): Promise<Place[]> {
    return this.searchNearbyPlaces(latitude, longitude, radius, 'library');
  }

  /**
   * Search for cafes and restaurants with free WiFi
   */
  async findCafesWithWiFi(latitude: number, longitude: number, radius: number = 5000): Promise<Place[]> {
    // Only search for cafes to reduce API calls
    return this.searchNearbyPlaces(latitude, longitude, radius, 'cafe', 'wifi');
  }

  /**
   * Search for parks and recreational areas
   */
  async findParks(latitude: number, longitude: number, radius: number = 5000): Promise<Place[]> {
    return this.searchNearbyPlaces(latitude, longitude, radius, 'park');
  }

  /**
   * Search for universities and schools (often have study spaces)
   */
  async findStudySpaces(latitude: number, longitude: number, radius: number = 5000): Promise<Place[]> {
    // Only search for universities to reduce API calls
    return this.searchNearbyPlaces(latitude, longitude, radius, 'university');
  }

  /**
   * Search for community centers and public facilities
   */
  async findCommunitySpaces(latitude: number, longitude: number, radius: number = 5000): Promise<Place[]> {
    return this.searchNearbyPlaces(latitude, longitude, radius, 'establishment', 'community center');
  }

  /**
    * Search for gyms and fitness centers
    */
  async findGyms(latitude: number, longitude: number, radius: number = 5000): Promise<Place[]> {
    return this.searchNearbyPlaces(latitude, longitude, radius, 'gym');
  }

  /**
    * Search for museums and cultural centers
    */
  async findMuseums(latitude: number, longitude: number, radius: number = 5000): Promise<Place[]> {
    return this.searchNearbyPlaces(latitude, longitude, radius, 'museum');
  }

  /**
    * Search for public restrooms (no official type — use keyword)
    */
  async findPublicRestrooms(latitude: number, longitude: number, radius: number = 5000): Promise<Place[]> {
    return this.searchNearbyPlaces(latitude, longitude, radius, '', 'public restroom');
  }

  /**
   * Search for all types of free resources at once
   */
  async findAllFreeResources(latitude: number, longitude: number, radius: number = 5000): Promise<{
    libraries: Place[];
    cafes: Place[];
    parks: Place[];
    studySpaces: Place[];
    communitySpaces: Place[];
    gyms: Place[];
    museums: Place[];
    publicRestrooms: Place[];
  }> {
    console.log('🚀 Starting findAllFreeResources with reduced API calls...');
    
    // Use Promise.all but with fewer calls now (5 total instead of 8)
    const [libraries, cafes, parks, studySpaces, communitySpaces, gyms, museums, publicRestrooms] = await Promise.all([
      this.findLibraries(latitude, longitude, radius),
      this.findCafesWithWiFi(latitude, longitude, radius),
      this.findParks(latitude, longitude, radius),
      this.findStudySpaces(latitude, longitude, radius),
      this.findCommunitySpaces(latitude, longitude, radius),
      this.findGyms(latitude, longitude, radius),
      this.findMuseums(latitude, longitude, radius),
      this.findPublicRestrooms(latitude, longitude, radius),
    ]);

    return {
      libraries,
      cafes,
      parks,
      studySpaces,
      communitySpaces,
      gyms,
      museums,
      publicRestrooms,
    };
  }
}

export default new GooglePlacesService();