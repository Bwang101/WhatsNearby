import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import DatabaseService, { HistoryItem } from '../../services/DatabaseService';

// Extend HistoryItem locally with is_favorite for UI purposes
interface HistoryItemWithFavorite extends HistoryItem {
    is_favorite?: boolean;
}

export default function HistoryScreen() {
    const [history, setHistory] = useState<HistoryItemWithFavorite[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const getReadableType = (type: string) => {
        switch (type) {
            case 'library': return 'Library';
            case 'cafe': return 'Cafe/WiFi';
            case 'park': return 'Park';
            case 'studySpace': return 'Study Space';
            case 'communitySpace': return 'Community Space';
            case 'gym': return 'Gym';
            case 'museum': return 'Museum';
            case 'public_restroom': return 'Public Restroom';
            default: return 'Unknown';
        }
    };

    const fetchHistory = useCallback(async () => {
        try {
            const historyData = await DatabaseService.getPlaceHistory();
            // Add is_favorite property for UI
            const mappedData: HistoryItemWithFavorite[] = historyData.map(h => ({
                ...h,
                is_favorite: h.action_type === 'favorited'
            }));
            setHistory(mappedData);
            console.log('History reloaded:', mappedData.length, 'items');
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    }, []);

    const toggleFavorite = async (item: HistoryItemWithFavorite) => {
        try {
            const newState = await DatabaseService.toggleFavorite(item.place_id);
            setHistory(prev =>
                prev.map(h =>
                    h.place_id === item.place_id ? { ...h, is_favorite: newState } : h
                )
            );
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    // Reload data every time the tab comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory])
    );

    // Pull-to-refresh functionality
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchHistory();
        setRefreshing(false);
    }, [fetchHistory]);

    return (
        <View style={Styles.container}>
            <ScrollView
                style={{ flex: 1, width: '100%' }}
                contentContainerStyle={{ alignItems: 'center', paddingBottom: 16 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#007AFF"
                    />
                }
            >
                {history.map(item => (
                    <View key={item.id} style={Styles.item}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1, paddingRight: 40 }}>
                                <Text style={Styles.itemText}>
                                    {item.type === 'library' ? '📚' :
                                     item.type === 'cafe' ? '☕' :
                                     item.type === 'park' ? '🌳' :
                                     item.type === 'studySpace' ? '🎓' :
                                     item.type === 'communitySpace' ? '🏢' :
                                     item.type === 'gym' ? '💪' :
                                     item.type === 'museum' ? '🏛️' :
                                     item.type === 'public_restroom' ? '🚻' : '❓'}
                                    {getReadableType(item.type)}
                                </Text>
                                <Text style={{ ...Styles.itemText, fontWeight: 'bold' }}>{item.name}</Text>
                                <Text style={Styles.addressText}>{item.address}</Text>
                            </View>

                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={Styles.addressText}>{new Date(item.visited_at).toLocaleDateString()}</Text>
                                <TouchableOpacity onPress={() => toggleFavorite(item)} style={{ marginTop: 4 }}>
                                    <Text style={{ fontSize: 24 }}>
                                        {item.is_favorite ? '⭐' : '☆'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const Styles: Record<string, any> = {
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fefff7ff',
        padding: 16,
    },
    item: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        marginVertical: 4,
        width: '100%',
    },
    itemText: {
        fontSize: 16,
        marginVertical: 4,
        color: 'black',
    },
    addressText: {
        fontSize: 14,
        color: '#555',
        marginVertical: 2,
    }
};
