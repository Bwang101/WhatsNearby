import * as SQLite from 'expo-sqlite';

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
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  async init() {
    if (this.initialized) return;
    
    try {
      this.db = await SQLite.openDatabaseAsync('whats_nearby.db');
      await this.createTables();
      this.initialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Create place history table
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
        action_type TEXT NOT NULL CHECK (action_type IN ('directions', 'favorited'))
      );
    `);

    // Create search history table
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

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_place_history_place_id ON place_history(place_id);
      CREATE INDEX IF NOT EXISTS idx_place_history_visited_at ON place_history(visited_at);
      CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at);
    `);

    console.log('✅ Database tables created successfully');
  }

  // Place History Methods
  async addPlaceHistory(item: Omit<HistoryItem, 'id'>): Promise<void> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT INTO place_history 
         (place_id, name, address, latitude, longitude, type, rating, visited_at, action_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.place_id,
          item.name,
          item.address,
          item.latitude,
          item.longitude,
          item.type,
          item.rating || null,
          item.visited_at,
          item.action_type
        ]
      );
      console.log('✅ Added place to history:', item.name);
    } catch (error) {
      console.error('❌ Error adding place history:', error);
      throw error;
    }
  }

  async getPlaceHistory(limit: number = 50): Promise<HistoryItem[]> {
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(
        `SELECT * FROM place_history 
         ORDER BY visited_at DESC 
         LIMIT ?`,
        [limit]
      );
      return result as HistoryItem[];
    } catch (error) {
      console.error('❌ Error getting place history:', error);
      throw error;
    }
  }

  async getRecentPlaces(limit: number = 10): Promise<HistoryItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(
        `SELECT DISTINCT place_id, name, address, latitude, longitude, type, rating, 
                MAX(visited_at) as visited_at, action_type
         FROM place_history 
         GROUP BY place_id 
         ORDER BY visited_at DESC 
         LIMIT ?`,
        [limit]
      );
      return result as HistoryItem[];
    } catch (error) {
      console.error('❌ Error getting recent places:', error);
      throw error;
    }
  }

  async getFavorites(): Promise<HistoryItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(
        `SELECT * FROM place_history 
         WHERE action_type = 'favorited' 
         ORDER BY visited_at DESC`
      );
      return result as HistoryItem[];
    } catch (error) {
      console.error('❌ Error getting favorites:', error);
      throw error;
    }
  }

  async isPlaceFavorited(placeId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync(
        `SELECT id FROM place_history 
         WHERE place_id = ? AND action_type = 'favorited'`,
        [placeId]
      );
      return result !== null;
    } catch (error) {
      console.error('❌ Error checking if place is favorited:', error);
      return false;
    }
  }

  async removeFavorite(placeId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `DELETE FROM place_history 
         WHERE place_id = ? AND action_type = 'favorited'`,
        [placeId]
      );
      console.log('✅ Removed place from favorites:', placeId);
    } catch (error) {
      console.error('❌ Error removing favorite:', error);
      throw error;
    }
  }
  
}

export default new DatabaseService();