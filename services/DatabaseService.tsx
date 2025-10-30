import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export interface HistoryItem {
  id?: number;
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  rating?: number;
  visited_at: string;
  action_type: 'viewed' | 'directions' | 'favorited';
  is_favorite?: boolean;
}

export interface SearchHistory {
  id?: number;
  search_query: string;
  latitude: number;
  longitude: number;
  results_count: number;
  searched_at: string;
}

// Mock implementation for web/simulator
class MockDatabaseService {
  private history: HistoryItem[] = [];
  private nextId = 1;

  async init() {
    console.log('✅ Mock Database initialized (Web/Simulator)');
    // Add some mock data
    this.history = [
      {
        id: 1,
        place_id: 'mock_1',
        name: 'Central Library',
        address: '123 Main St',
        latitude: 37.7749,
        longitude: -122.4194,
        type: 'library',
        rating: 4.5,
        visited_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        action_type: 'viewed',
      },
      {
        id: 2,
        place_id: 'mock_2',
        name: 'Blue Bottle Coffee',
        address: '456 Coffee Ave',
        latitude: 37.7849,
        longitude: -122.4094,
        type: 'cafe',
        rating: 4.2,
        visited_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        action_type: 'directions',
      },
      {
        id: 3,
        place_id: 'mock_3',
        name: 'Golden Gate Park',
        address: '789 Park Way',
        latitude: 37.7949,
        longitude: -122.3994,
        type: 'park',
        rating: 4.8,
        visited_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        action_type: 'favorited',
      },
    ];
  }

  async addPlaceHistory(item: Omit<HistoryItem, 'id'>): Promise<void> {
    const newItem: HistoryItem = { ...item, id: this.nextId++ };
    this.history.unshift(newItem);
    console.log('✅ Added place to mock history:', item.name);
  }

  async getPlaceHistory(limit: number = 50): Promise<HistoryItem[]> {
    // Filter to show only favorited items or most recent non-favorited if no favorite exists
    const uniquePlaces = new Map<string, HistoryItem>();
    
    // First pass: collect favorited items
    for (const item of this.history) {
      if (item.action_type === 'favorited') {
        uniquePlaces.set(item.place_id, item);
      }
    }
    
    // Second pass: add non-favorited items only if no favorite exists
    for (const item of this.history) {
      if (!uniquePlaces.has(item.place_id)) {
        uniquePlaces.set(item.place_id, item);
      }
    }
    
    return Array.from(uniquePlaces.values())
      .sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime())
      .slice(0, limit);
  }

  async getRecentPlaces(limit: number = 10): Promise<HistoryItem[]> {
    const uniquePlaces = new Map<string, HistoryItem>();
    for (const item of this.history) {
      if (!uniquePlaces.has(item.place_id)) uniquePlaces.set(item.place_id, item);
    }
    return Array.from(uniquePlaces.values()).slice(0, limit);
  }

  async getFavorites(): Promise<HistoryItem[]> {
    return this.history.filter(item => item.action_type === 'favorited');
  }

  async isPlaceFavorited(placeId: string): Promise<boolean> {
    return this.history.some(item => item.place_id === placeId && item.action_type === 'favorited');
  }

  async removeFavorite(placeId: string): Promise<void> {
    this.history = this.history.filter(item => !(item.place_id === placeId && item.action_type === 'favorited'));
  }

  async addSearchHistory(item: Omit<SearchHistory, 'id'>): Promise<void> {
    console.log('✅ Added search to mock history:', item.search_query);
  }

  async getSearchHistory(limit: number = 20): Promise<SearchHistory[]> {
    return [];
  }

  async clearOldHistory(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    this.history = this.history.filter(item => new Date(item.visited_at) > cutoffDate || item.action_type === 'favorited');
  }

  async clearAllHistory(): Promise<void> {
    this.history = this.history.filter(item => item.action_type === 'favorited');
  }

  async toggleFavorite(placeId: string): Promise<boolean> {
    const item = this.history.find(h => h.place_id === placeId);
    if (!item) return false;

    // ✅ Just toggle the flag; don’t modify visited_at
    item.is_favorite = !item.is_favorite;
    console.log(`⭐ Mock favorite toggled: ${item.name} → ${item.is_favorite}`);
    return item.is_favorite;
  }
}


// Real SQLite implementation for native devices
class RealDatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  async init() {
    if (this.initialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('whats_nearby.db');
      await this.createTables();
      this.initialized = true;
      console.log('✅ Real SQLite Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS place_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        place_id TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        type TEXT NOT NULL,
        rating REAL,
        visited_at TEXT NOT NULL,
        action_type TEXT NOT NULL CHECK (action_type IN ('viewed', 'directions', 'favorited'))
      );
    `);

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        search_query TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        results_count INTEGER NOT NULL,
        searched_at TEXT NOT NULL
      );
    `);

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_place_history_place_id ON place_history(place_id);
      CREATE INDEX IF NOT EXISTS idx_place_history_visited_at ON place_history(visited_at);
      CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at);
    `);
  }

  async addPlaceHistory(item: Omit<HistoryItem, 'id'>): Promise<void> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT INTO place_history 
         (place_id, name, address, latitude, longitude, type, rating, visited_at, action_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.place_id, item.name, item.address, item.latitude, item.longitude, item.type, item.rating || null, item.visited_at, item.action_type]
      );
      console.log('✅ Added place to SQLite history:', item.name);
    } catch (error) {
      console.error('❌ Error adding place history:', error);
      throw error;
    }
  }

  async getPlaceHistory(limit: number = 50): Promise<HistoryItem[]> {
  if (!this.db) await this.init();
  if (!this.db) throw new Error('Database not initialized');

  const result = await this.db.getAllAsync(
    `
    SELECT * FROM place_history ph1
    WHERE 
      -- Show favorited items
      action_type = 'favorited'
      OR
      -- Show non-favorited items only if no favorited version exists
      (action_type != 'favorited' 
       AND NOT EXISTS (
         SELECT 1 FROM place_history ph2 
         WHERE ph2.place_id = ph1.place_id 
         AND ph2.action_type = 'favorited'
       )
       -- And only show the most recent non-favorited visit
       AND visited_at = (
         SELECT MAX(visited_at)
         FROM place_history ph3
         WHERE ph3.place_id = ph1.place_id
         AND ph3.action_type != 'favorited'
       )
      )
    ORDER BY visited_at DESC
    LIMIT ?
    `,
    [limit]
  );

  return result as HistoryItem[];
}


  async getRecentPlaces(limit: number = 10): Promise<HistoryItem[]> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT DISTINCT place_id, name, address, latitude, longitude, type, rating, MAX(visited_at) as visited_at, action_type
       FROM place_history 
       GROUP BY place_id 
       ORDER BY visited_at DESC LIMIT ?`,
      [limit]
    );
    return result as HistoryItem[];
  }

  async getFavorites(): Promise<HistoryItem[]> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM place_history WHERE action_type = 'favorited' ORDER BY visited_at DESC`
    );
    return result as HistoryItem[];
  }

  async isPlaceFavorited(placeId: string): Promise<boolean> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      `SELECT id FROM place_history WHERE place_id = ? AND action_type = 'favorited'`,
      [placeId]
    );
    return result !== null;
  }

  async removeFavorite(placeId: string): Promise<void> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `DELETE FROM place_history WHERE place_id = ? AND action_type = 'favorited'`,
      [placeId]
    );
  }

  async addSearchHistory(item: Omit<SearchHistory, 'id'>): Promise<void> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT INTO search_history (search_query, latitude, longitude, results_count, searched_at) VALUES (?, ?, ?, ?, ?)`,
      [item.search_query, item.latitude, item.longitude, item.results_count, item.searched_at]
    );
  }

  async getSearchHistory(limit: number = 20): Promise<SearchHistory[]> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM search_history ORDER BY searched_at DESC LIMIT ?`,
      [limit]
    );
    return result as SearchHistory[];
  }

  async clearOldHistory(daysToKeep: number = 30): Promise<void> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffString = cutoffDate.toISOString();

    await this.db.runAsync(
      `DELETE FROM place_history WHERE visited_at < ? AND action_type != 'favorited'`,
      [cutoffString]
    );
    await this.db.runAsync(`DELETE FROM search_history WHERE searched_at < ?`, [cutoffString]);
  }

  async clearAllHistory(): Promise<void> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`DELETE FROM place_history WHERE action_type != 'favorited'`);
    await this.db.runAsync(`DELETE FROM search_history`);
  }

  async toggleFavorite(placeId: string): Promise<boolean> {
    const isFavorited = await this.isPlaceFavorited(placeId);
    if (isFavorited) {
      await this.removeFavorite(placeId);
      return false;
    } else {
      const historyItems = await this.db?.getAllAsync(
        `SELECT * FROM place_history WHERE place_id = ? ORDER BY visited_at DESC LIMIT 1`,
        [placeId]
      ) as HistoryItem[];

      if (historyItems && historyItems.length > 0) {
        const item = historyItems[0];
        // Keep the original visited_at timestamp when favoriting
        await this.addPlaceHistory({ ...item, action_type: 'favorited' });
        return true;
      }
      return false;
    }
  }
}

// Smart selection: Use real SQLite on native, mock on web
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
const DatabaseService = isNative ? new RealDatabaseService() : new MockDatabaseService();

export default DatabaseService;
