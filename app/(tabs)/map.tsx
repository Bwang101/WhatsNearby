import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import PlaceFilter from '../../components/PlaceFilter';
import DatabaseService from '../../services/DatabaseService';
import GooglePlacesService, { Place } from '../../services/GooglePlacesService';

interface UserLocation {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

type PlaceType = 'libraries' | 'cafes' | 'parks' | 'studySpaces' | 'communitySpaces' | 'gyms' | 'museums' | 'publicRestrooms';

interface PlaceMarker extends Place {
    type: PlaceType;
}

export default function MapScreen() {
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [loading, setLoading] = useState(true);
    const [places, setPlaces] = useState<PlaceMarker[]>([]);
    const [loadingPlaces, setLoadingPlaces] = useState(false);
    const [activeFilters, setActiveFilters] = useState<PlaceType[]>(['libraries', 'cafes', 'parks']);
    const params = useLocalSearchParams();
    const mapRef = useRef<MapView | null>(null);

    useEffect(() => {
        getUserLocation();
    }, []);

    useEffect(() => {
        if (userLocation && !loadingPlaces) {
            console.log('🔄 Location or filters changed, searching places...');
            searchNearbyPlaces();
        }
    }, [userLocation, activeFilters]);

    // If the suggestions screen navigates here with lat/lng params, center the map
    useEffect(() => {
        try {
            const latParam = params.lat as string | undefined;
            const lngParam = params.lng as string | undefined;
            if (latParam && lngParam && mapRef.current) {
                const lat = parseFloat(latParam);
                const lng = parseFloat(lngParam);
                if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                    const region = { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
                    // animate to region
                    mapRef.current.animateToRegion(region, 500);
                }
            }
        } catch (e) {
            // ignore
        }
    }, [params]);

    // Refresh places when tab comes into focus
    useFocusEffect(
        useCallback(() => {
            if (userLocation && !loadingPlaces) {
                console.log('🔄 Map tab focused, refreshing places...');
                searchNearbyPlaces();
            }
        }, [userLocation, activeFilters])
    );

    const getUserLocation = async () => {
        try {
            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Location permission is required to show nearby places.',
                    [{ text: 'OK' }]
                );
                setLoading(false);
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const userLoc = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };

            console.log('📍 User location detected:', userLoc);
            setUserLocation(userLoc);
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Could not get your location. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const searchNearbyPlaces = async () => {
        if (!userLocation) {
            console.log('❌ No user location available for search');
            return;
        }

        console.log('🔍 Starting search for nearby places...');
        console.log('📍 Search location:', userLocation);
        console.log('🏷️ Active filters:', activeFilters);

        setLoadingPlaces(true);
        try {
            const allPlaces = await GooglePlacesService.findAllFreeResources(
                userLocation.latitude,
                userLocation.longitude,
                5000 // 5km radius
            );

            const placeMarkers: PlaceMarker[] = [];

            // Add places based on active filters
            if (activeFilters.includes('libraries')) {
                allPlaces.libraries.forEach(place =>
                    placeMarkers.push({ ...place, type: 'libraries' })
                );
            }
            if (activeFilters.includes('cafes')) {
                allPlaces.cafes.forEach(place =>
                    placeMarkers.push({ ...place, type: 'cafes' })
                );
            }
            if (activeFilters.includes('parks')) {
                allPlaces.parks.forEach(place =>
                    placeMarkers.push({ ...place, type: 'parks' })
                );
            }
            if (activeFilters.includes('studySpaces')) {
                allPlaces.studySpaces.forEach(place =>
                    placeMarkers.push({ ...place, type: 'studySpaces' })
                );
            }
            if (activeFilters.includes('communitySpaces')) {
                allPlaces.communitySpaces.forEach(place =>
                    placeMarkers.push({ ...place, type: 'communitySpaces' })
                );
            }
            if (activeFilters.includes('gyms')) {
                allPlaces.gyms.forEach(place =>
                    placeMarkers.push({ ...place, type: 'gyms' })
                );
            }
            if (activeFilters.includes('museums')) {
                allPlaces.museums.forEach(place =>
                    placeMarkers.push({ ...place, type: 'museums' })
                );
            }
            if (activeFilters.includes('publicRestrooms')) {
                allPlaces.publicRestrooms.forEach(place =>
                    placeMarkers.push({ ...place, type: 'publicRestrooms' })
                );
            }

            setPlaces(placeMarkers);
        } catch (error) {
            console.error('Error searching for places:', error);
            Alert.alert('Error', 'Could not load nearby places. Please try again.');
        } finally {
            setLoadingPlaces(false);
        }
    };

    const getMarkerColor = (type: PlaceType): string => {
        switch (type) {
            case 'libraries': return '#FF6B6B';
            case 'cafes': return '#4ECDC4';
            case 'parks': return '#45B7D1';
            case 'studySpaces': return '#96CEB4';
            case 'communitySpaces': return '#FFEAA7';
            case 'gyms': return '#FF9F1C';
            case 'museums': return '#9B5DE5';
            case 'publicRestrooms': return '#00B4D8';

            default: return '#74B9FF';
        }
    };

    const getMarkerTitle = (type: PlaceType): string => {
        switch (type) {
            case 'libraries': return '📚 Library';
            case 'cafes': return '☕ Cafe/WiFi';
            case 'parks': return '🌳 Park';
            case 'studySpaces': return '🎓 Study Space';
            case 'communitySpaces': return '🏢 Community Space';
            case 'gyms': return '💪 Gym';
            case 'museums': return '🏛️ Museum';
            case 'publicRestrooms': return '🚻 Public Restroom';

            default: return 'Place';
        }
    };

    const openDirections = async (place: PlaceMarker) => {
        try {
            const lat = place.geometry.location.lat;
            const lng = place.geometry.location.lng;

            let placeType: string;

            // Use the type you already assigned to the marker
            switch (place.type) {
                case 'libraries':
                    placeType = 'library';
                    break;
                case 'cafes':
                    placeType = 'cafe';
                    break;
                case 'parks':
                    placeType = 'park';
                    break;
                case 'studySpaces':
                    placeType = 'study_space';
                    break;
                case 'communitySpaces':
                    placeType = 'community_space';
                    break;
                case 'gyms':
                    placeType = 'gym';
                    break;
                case 'museums':
                    placeType = 'museum';
                    break;
                case 'publicRestrooms':
                    placeType = 'public_restroom';
                    break;
                default:
                    placeType = 'establishment';
            }

            const historyData = {
                place_id: place.place_id,
                name: place.name,
                address: place.vicinity,
                latitude: lat,
                longitude: lng,
                type: placeType,
                rating: place.rating,
                visited_at: new Date().toISOString(),
                action_type: "directions" as "directions"
            };

            DatabaseService.addPlaceHistory(historyData).catch(err => {
                console.error('Failed to log place history:', err);
            });

            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${place.place_id}`;

            console.log('Opening directions to:', place.name, 'at', lat, lng);

            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert(
                    'Cannot Open Directions',
                    'Unable to open directions. Please make sure you have Google Maps installed.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error opening directions:', error);
            Alert.alert(
                'Error',
                'Failed to open directions. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (!userLocation) {
        return (
            <View style={styles.errorContainer}>
                <Text>Unable to load map. Please check location permissions.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <PlaceFilter
                activeFilters={activeFilters}
                onFiltersChange={setActiveFilters}
            />

            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={userLocation}
                ref={ref => { mapRef.current = ref; }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                followsUserLocation={true}
            >
                {/* User location marker */}
                <Marker
                    coordinate={{
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                    }}
                    title="Your Location"
                    description="You are here"
                    pinColor="blue"
                />

                {/* Place markers */}
                {places.map((place, index) => (
                    <Marker
                        key={`${place.place_id}-${index}`}
                        coordinate={{
                            latitude: place.geometry.location.lat,
                            longitude: place.geometry.location.lng,
                        }}
                        pinColor={getMarkerColor(place.type)}
                    >
                        <Callout
                            style={styles.callout}
                            onPress={() => openDirections(place)}
                        >
                            <View style={styles.calloutContainer}>
                                <Text style={styles.calloutTitle}>
                                    {getMarkerTitle(place.type)}
                                </Text>
                                <Text style={styles.calloutName}>{place.name}</Text>
                                <Text style={styles.calloutAddress}>{place.vicinity}</Text>
                                {place.rating && (
                                    <Text style={styles.calloutRating}>
                                        ⭐ {place.rating.toFixed(1)}
                                    </Text>
                                )}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {place.opening_hours?.open_now !== undefined && (
                                        <Text style={[
                                            styles.calloutStatus,
                                            { color: place.opening_hours.open_now ? 'green' : 'red' }
                                        ]}>
                                            {place.opening_hours.open_now ? 'Open Now' : 'Closed'}
                                        </Text>
                                    )}
                                    <View style={styles.directionsButton}>
                                        <Text style={styles.directionsButtonText}>
                                            Directions
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            {/* Loading overlay for places */}
            {
                loadingPlaces && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={styles.loadingText}>Finding places...</Text>
                    </View>
                )
            }
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    callout: {
        width: 200,
        padding: 0,
    },
    calloutContainer: {
        padding: 10,
    },
    calloutTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 4,
    },
    calloutName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    calloutAddress: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    calloutRating: {
        fontSize: 12,
        color: '#333',
        marginBottom: 2,
    },
    calloutStatus: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    directionsButton: {
        marginTop: 8,
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignItems: 'center',
    },
    directionsButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});