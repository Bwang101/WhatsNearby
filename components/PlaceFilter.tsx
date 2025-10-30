import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PlaceType = 'libraries' | 'cafes' | 'parks' | 'studySpaces' | 'communitySpaces'  | 'gyms' | 'museums' | 'publicRestrooms';

interface FilterOption {
  type: PlaceType;
  label: string;
  icon: string;
  color: string;
}

interface PlaceFilterProps {
  activeFilters: PlaceType[];
  onFiltersChange: (filters: PlaceType[]) => void;
}

const filterOptions: FilterOption[] = [
  { type: 'libraries', label: 'Libraries', icon: '📚', color: '#FF6B6B' },
  { type: 'cafes', label: 'Cafes/WiFi', icon: '☕', color: '#4ECDC4' },
  { type: 'parks', label: 'Parks', icon: '🌳', color: '#45B7D1' },
  { type: 'studySpaces', label: 'Study Spaces', icon: '🎓', color: '#96CEB4' },
  { type: 'communitySpaces', label: 'Community', icon: '🏢', color: '#FFEAA7' },
  { type: 'gyms', label: 'Gyms', icon: '💪', color: '#FFB347' },
  { type: 'museums', label: 'Museums', icon: '🏛️', color: '#9B59B6' },
  { type: 'publicRestrooms', label: 'Restrooms', icon: '🚻', color: '#74B9FF' },
];

export default function PlaceFilter({ activeFilters, onFiltersChange }: PlaceFilterProps) {
  const toggleFilter = (type: PlaceType) => {
    if (activeFilters.includes(type)) {
      onFiltersChange(activeFilters.filter(f => f !== type));
    } else {
      onFiltersChange([...activeFilters, type]);
    }
  };

  const selectAll = () => {
    onFiltersChange(filterOptions.map(option => option.type));
  };

  const clearAll = () => {
    onFiltersChange([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Free Resources Nearby</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={selectAll} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAll} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {filterOptions.map((option) => {
          const isActive = activeFilters.includes(option.type);
          return (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.filterButton,
                isActive && [styles.filterButtonActive, { borderColor: option.color }],
              ]}
              onPress={() => toggleFilter(option.type)}
            >
              <Text style={styles.filterIcon}>{option.icon}</Text>
              <Text style={[
                styles.filterLabel,
                isActive && [styles.filterLabelActive, { color: option.color }],
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  scrollContainer: {
    paddingRight: 15,
  },
  filterButton: {
    alignItems: 'center',
    marginRight: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
    minWidth: 80,
  },
  filterButtonActive: {
    backgroundColor: 'white',
    borderWidth: 2,
  },
  filterIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  filterLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  filterLabelActive: {
    fontWeight: 'bold',
  },
});