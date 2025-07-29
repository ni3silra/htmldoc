/**
 * @fileoverview Browser-based icon caching system
 * This module provides efficient caching of loaded icons using browser storage
 * with expiration logic and memory management for optimal performance.
 */

/**
 * Icon cache manager for browser-based storage with expiration
 * Handles caching of icon data in memory and localStorage with TTL support
 */
export class IconCache {
  /**
   * Creates a new IconCache instance
   * @param {Object} config - Cache configuration options
   * @param {number} config.maxCacheSize - Maximum cache size in MB (default: 10)
   * @param {number} config.defaultExpiry - Default expiration time in milliseconds (default: 1 hour)
   * @param {boolean} config.enablePersistence - Whether to use localStorage for persistence (default: true)
   * @param {boolean} config.enableMemoryCache - Whether to use in-memory caching (default: true)
   */
  constructor(config = {}) {
    this.config = {
      maxCacheSize: 10, // MB
      defaultExpiry: 60 * 60 * 1000, // 1 hour
      enablePersistence: true,
      enableMemoryCache: true,
      ...config
    };
    
    // In-memory cache for fast access
    this.memoryCache = new Map();
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0
    };
    
    // Storage key prefix
    this.storagePrefix = 'html-diagram-icons-';
    
    // Initialize cache
    this.initialize();
  }

  /**
   * Initializes the cache system
   * Loads existing cache data and performs cleanup of expired entries
   */
  initialize() {
    if (this.config.enablePersistence && this.isLocalStorageAvailable()) {
      this.loadFromPersistentStorage();
      this.cleanupExpiredEntries();
    }
    
    // Set up periodic cleanup
    this.setupPeriodicCleanup();
  }

  /**
   * Retrieves an icon from cache
   * @param {string} key - Icon identifier/key
   * @returns {Object|null} Cached icon data or null if not found/expired
   */
  get(key) {
    const cacheKey = this.getCacheKey(key);
    
    // Try memory cache first
    if (this.config.enableMemoryCache && this.memoryCache.has(cacheKey)) {
      const entry = this.memoryCache.get(cacheKey);
      if (this.isEntryValid(entry)) {
        this.stats.hits++;
        entry.lastAccessed = Date.now();
        return entry.data;
      } else {
        // Remove expired entry
        this.memoryCache.delete(cacheKey);
      }
    }
    
    // Try persistent storage
    if (this.config.enablePersistence && this.isLocalStorageAvailable()) {
      const entry = this.getFromPersistentStorage(cacheKey);
      if (entry && this.isEntryValid(entry)) {
        // Load back into memory cache
        if (this.config.enableMemoryCache) {
          this.memoryCache.set(cacheKey, entry);
        }
        this.stats.hits++;
        return entry.data;
      }
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Stores an icon in cache
   * @param {string} key - Icon identifier/key
   * @param {string|Object} data - Icon data (SVG string, data URI, or icon object)
   * @param {number} [customExpiry] - Custom expiration time in milliseconds
   * @returns {boolean} True if successfully cached, false otherwise
   */
  set(key, data, customExpiry = null) {
    const cacheKey = this.getCacheKey(key);
    const expiry = customExpiry || this.config.defaultExpiry;
    
    const entry = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry,
      lastAccessed: Date.now(),
      size: this.calculateDataSize(data)
    };
    
    // Check if we need to make space
    if (!this.hasSpaceForEntry(entry)) {
      this.evictLeastRecentlyUsed();
    }
    
    // Store in memory cache
    if (this.config.enableMemoryCache) {
      this.memoryCache.set(cacheKey, entry);
    }
    
    // Store in persistent storage
    if (this.config.enablePersistence && this.isLocalStorageAvailable()) {
      this.saveToPersistentStorage(cacheKey, entry);
    }
    
    this.stats.totalSize += entry.size;
    return true;
  }

  /**
   * Removes an icon from cache
   * @param {string} key - Icon identifier/key
   * @returns {boolean} True if item was removed, false if not found
   */
  remove(key) {
    const cacheKey = this.getCacheKey(key);
    let removed = false;
    
    // Remove from memory cache
    if (this.config.enableMemoryCache && this.memoryCache.has(cacheKey)) {
      const entry = this.memoryCache.get(cacheKey);
      this.stats.totalSize -= entry.size;
      this.memoryCache.delete(cacheKey);
      removed = true;
    }
    
    // Remove from persistent storage
    if (this.config.enablePersistence && this.isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(cacheKey);
        removed = true;
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    }
    
    return removed;
  }

  /**
   * Checks if an icon exists in cache and is not expired
   * @param {string} key - Icon identifier/key
   * @returns {boolean} True if icon exists and is valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clears all cached icons
   */
  clear() {
    // Clear memory cache
    if (this.config.enableMemoryCache) {
      this.memoryCache.clear();
    }
    
    // Clear persistent storage
    if (this.config.enablePersistence && this.isLocalStorageAvailable()) {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.storagePrefix)) {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
          }
        }
      }
    }
    
    // Reset statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0
    };
  }

  /**
   * Gets cache statistics
   * @returns {Object} Cache statistics including hits, misses, size, etc.
   */
  getStats() {
    return {
      ...this.stats,
      memoryEntries: this.memoryCache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      totalSizeMB: this.stats.totalSize / (1024 * 1024)
    };
  }

  /**
   * Gets cache configuration
   * @returns {Object} Current cache configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Updates cache configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Generates a cache key for an icon identifier
   * @param {string} key - Original icon key
   * @returns {string} Cache key with prefix
   */
  getCacheKey(key) {
    return `${this.storagePrefix}${key}`;
  }

  /**
   * Checks if a cache entry is still valid (not expired)
   * @param {Object} entry - Cache entry to validate
   * @returns {boolean} True if entry is valid
   */
  isEntryValid(entry) {
    return entry && entry.expiry > Date.now();
  }

  /**
   * Calculates the approximate size of data in bytes
   * @param {string|Object} data - Data to measure
   * @returns {number} Size in bytes
   */
  calculateDataSize(data) {
    if (typeof data === 'string') {
      // Rough estimate: 2 bytes per character for UTF-16
      return data.length * 2;
    } else if (typeof data === 'object') {
      // Rough estimate for JSON serialization
      return JSON.stringify(data).length * 2;
    }
    return 0;
  }

  /**
   * Checks if there's space for a new entry
   * @param {Object} entry - Entry to check space for
   * @returns {boolean} True if there's space
   */
  hasSpaceForEntry(entry) {
    const maxSizeBytes = this.config.maxCacheSize * 1024 * 1024;
    return (this.stats.totalSize + entry.size) <= maxSizeBytes;
  }

  /**
   * Evicts least recently used entries to make space
   */
  evictLeastRecentlyUsed() {
    if (!this.config.enableMemoryCache || this.memoryCache.size === 0) {
      return;
    }
    
    // Sort entries by last accessed time
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove oldest entries until we have space
    const maxSizeBytes = this.config.maxCacheSize * 1024 * 1024;
    const targetSize = maxSizeBytes * 0.8; // Leave 20% buffer
    
    for (const [key, entry] of entries) {
      if (this.stats.totalSize <= targetSize) {
        break;
      }
      
      this.memoryCache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.evictions++;
      
      // Also remove from persistent storage
      if (this.config.enablePersistence && this.isLocalStorageAvailable()) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Failed to remove from localStorage during eviction:', error);
        }
      }
    }
  }

  /**
   * Loads cache data from persistent storage
   */
  loadFromPersistentStorage() {
    if (!this.isLocalStorageAvailable()) {
      return;
    }
    
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.storagePrefix)) {
          const entry = this.getFromPersistentStorage(key);
          if (entry && this.isEntryValid(entry)) {
            if (this.config.enableMemoryCache) {
              this.memoryCache.set(key, entry);
            }
            this.stats.totalSize += entry.size;
          } else {
            // Remove expired entry
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load from persistent storage:', error);
    }
  }

  /**
   * Gets an entry from persistent storage
   * @param {string} key - Cache key
   * @returns {Object|null} Cache entry or null
   */
  getFromPersistentStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to parse cache entry from localStorage:', error);
      return null;
    }
  }

  /**
   * Saves an entry to persistent storage
   * @param {string} key - Cache key
   * @param {Object} entry - Cache entry
   */
  saveToPersistentStorage(key, entry) {
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing old entries');
        this.cleanupExpiredEntries();
        // Try again after cleanup
        try {
          localStorage.setItem(key, JSON.stringify(entry));
        } catch (retryError) {
          console.warn('Failed to save to localStorage after cleanup:', retryError);
        }
      } else {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  }

  /**
   * Removes expired entries from all storage
   */
  cleanupExpiredEntries() {
    // Cleanup memory cache
    if (this.config.enableMemoryCache) {
      for (const [key, entry] of this.memoryCache.entries()) {
        if (!this.isEntryValid(entry)) {
          this.memoryCache.delete(key);
          this.stats.totalSize -= entry.size;
        }
      }
    }
    
    // Cleanup persistent storage
    if (this.config.enablePersistence && this.isLocalStorageAvailable()) {
      try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith(this.storagePrefix)) {
            const entry = this.getFromPersistentStorage(key);
            if (!entry || !this.isEntryValid(entry)) {
              localStorage.removeItem(key);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to cleanup expired entries:', error);
      }
    }
  }

  /**
   * Sets up periodic cleanup of expired entries
   */
  setupPeriodicCleanup() {
    // Run cleanup every 10 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 10 * 60 * 1000);
  }

  /**
   * Checks if localStorage is available
   * @returns {boolean} True if localStorage is available
   */
  isLocalStorageAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Exports cache data for backup/migration
   * @returns {Object} Serializable cache data
   */
  export() {
    const data = {
      config: this.config,
      stats: this.stats,
      entries: {}
    };
    
    // Export memory cache entries
    if (this.config.enableMemoryCache) {
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isEntryValid(entry)) {
          data.entries[key] = entry;
        }
      }
    }
    
    return data;
  }

  /**
   * Imports cache data from backup
   * @param {Object} data - Cache data to import
   * @returns {boolean} True if import was successful
   */
  import(data) {
    try {
      if (data.config) {
        this.updateConfig(data.config);
      }
      
      if (data.entries) {
        for (const [key, entry] of Object.entries(data.entries)) {
          if (this.isEntryValid(entry)) {
            if (this.config.enableMemoryCache) {
              this.memoryCache.set(key, entry);
            }
            if (this.config.enablePersistence) {
              this.saveToPersistentStorage(key, entry);
            }
            this.stats.totalSize += entry.size;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import cache data:', error);
      return false;
    }
  }
}

export default IconCache;