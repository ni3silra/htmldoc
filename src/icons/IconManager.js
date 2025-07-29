/**
 * @fileoverview Icon management system for HTML diagram library
 * This module provides comprehensive icon loading, caching, and fallback mechanisms
 * for architectural diagram elements with external CDN support and error handling.
 */

import { IconCache } from './IconCache.js';
import { FallbackIcons } from './FallbackIcons.js';

/**
 * Icon manager for loading, caching, and serving icons for diagram elements
 * Handles external CDN fetching, browser caching, and fallback mechanisms
 */
export class IconManager {
  /**
   * Creates a new IconManager instance
   * @param {Object} config - Icon manager configuration
   * @param {string[]} config.cdnUrls - Array of CDN URLs to try for icon loading
   * @param {Object} config.cacheConfig - Configuration for icon caching
   * @param {number} config.loadTimeout - Timeout for icon loading in milliseconds (default: 5000)
   * @param {boolean} config.enableFallbacks - Whether to use fallback icons (default: true)
   * @param {Object} config.iconMappings - Custom mappings from element types to icon names
   */
  constructor(config = {}) {
    this.config = {
      cdnUrls: [
        'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/',
        'https://unpkg.com/simple-icons@latest/icons/',
        'https://cdnjs.cloudflare.com/ajax/libs/simple-icons/latest/'
      ],
      cacheConfig: {
        maxCacheSize: 10, // MB
        defaultExpiry: 24 * 60 * 60 * 1000, // 24 hours
        enablePersistence: true,
        enableMemoryCache: true
      },
      loadTimeout: 5000,
      enableFallbacks: true,
      iconMappings: {
        'microservice': 'docker',
        'api-gateway': 'nginx',
        'database': 'postgresql',
        'cache': 'redis',
        'queue': 'rabbitmq',
        'storage': 'amazons3',
        'cdn': 'cloudflare',
        'loadbalancer': 'nginx',
        'monitoring': 'grafana',
        'logging': 'elasticsearch'
      },
      ...config
    };

    // Initialize cache system
    this.cache = new IconCache(this.config.cacheConfig);
    
    // Initialize fallback icons
    this.fallbackIcons = new FallbackIcons();
    
    // Track loading states
    this.loadingPromises = new Map();
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cdnLoads: 0,
      fallbackUsed: 0,
      errors: 0
    };

    // Initialize bundled icons
    this.bundledIcons = new Map();
    this.initializeBundledIcons();
  }

  /**
   * Loads an icon with comprehensive fallback mechanisms
   * @param {string} iconName - Name or identifier of the icon to load
   * @param {string} [elementType] - Type of diagram element (for mapping)
   * @param {Object} [options] - Loading options
   * @param {boolean} options.preferBundled - Prefer bundled icons over CDN
   * @param {number} options.timeout - Custom timeout for this request
   * @param {string} options.format - Preferred format ('svg', 'png', 'data-uri')
   * @returns {Promise<string>} Promise resolving to icon data (SVG string or data URI)
   */
  async loadIcon(iconName, elementType = null, options = {}) {
    this.stats.totalRequests++;
    
    const loadOptions = {
      preferBundled: false,
      timeout: this.config.loadTimeout,
      format: 'svg',
      ...options
    };

    // Resolve icon name from element type if needed
    const resolvedIconName = this.resolveIconName(iconName, elementType);
    const cacheKey = this.getCacheKey(resolvedIconName, loadOptions);

    try {
      // Check cache first
      const cachedIcon = this.cache.get(cacheKey);
      if (cachedIcon) {
        this.stats.cacheHits++;
        return cachedIcon;
      }

      // Check if already loading
      if (this.loadingPromises.has(cacheKey)) {
        return await this.loadingPromises.get(cacheKey);
      }

      // Start loading process
      const loadingPromise = this.performIconLoad(resolvedIconName, loadOptions);
      this.loadingPromises.set(cacheKey, loadingPromise);

      try {
        const iconData = await loadingPromise;
        
        // Cache the result
        this.cache.set(cacheKey, iconData);
        
        return iconData;
      } finally {
        // Clean up loading promise
        this.loadingPromises.delete(cacheKey);
      }

    } catch (error) {
      this.stats.errors++;
      console.warn(`Failed to load icon "${resolvedIconName}":`, error);
      
      // Return fallback icon
      if (this.config.enableFallbacks) {
        this.stats.fallbackUsed++;
        return this.getFallbackIcon(elementType || 'default');
      }
      
      throw error;
    }
  }

  /**
   * Performs the actual icon loading with multiple strategies
   * @param {string} iconName - Resolved icon name
   * @param {Object} options - Loading options
   * @returns {Promise<string>} Icon data
   */
  async performIconLoad(iconName, options) {
    // Strategy 1: Try bundled icons first if preferred
    if (options.preferBundled || this.bundledIcons.has(iconName)) {
      const bundledIcon = await this.loadBundledIcon(iconName);
      if (bundledIcon) {
        return bundledIcon;
      }
    }

    // Strategy 2: Try CDN loading
    const cdnIcon = await this.loadFromCDN(iconName, options);
    if (cdnIcon) {
      this.stats.cdnLoads++;
      return cdnIcon;
    }

    // Strategy 3: Try bundled icons as fallback
    if (!options.preferBundled) {
      const bundledIcon = await this.loadBundledIcon(iconName);
      if (bundledIcon) {
        return bundledIcon;
      }
    }

    // If all strategies fail, throw error
    throw new Error(`Icon "${iconName}" not found in any source`);
  }

  /**
   * Loads an icon from bundled resources
   * @param {string} iconName - Icon name to load
   * @returns {Promise<string|null>} Icon data or null if not found
   */
  async loadBundledIcon(iconName) {
    if (this.bundledIcons.has(iconName)) {
      return this.bundledIcons.get(iconName);
    }

    // Try to load from bundled directory
    try {
      const response = await fetch(`./src/icons/bundled/${iconName}.svg`);
      if (response.ok) {
        const svgData = await response.text();
        this.bundledIcons.set(iconName, svgData);
        return svgData;
      }
    } catch (error) {
      // Bundled icon not found, continue to other strategies
    }

    return null;
  }

  /**
   * Loads an icon from CDN with timeout and error handling
   * @param {string} iconName - Icon name to load
   * @param {Object} options - Loading options
   * @returns {Promise<string|null>} Icon data or null if failed
   */
  async loadFromCDN(iconName, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      // Try each CDN URL until one succeeds
      for (const cdnUrl of this.config.cdnUrls) {
        try {
          const iconUrl = this.buildIconUrl(cdnUrl, iconName, options.format);
          
          const response = await fetch(iconUrl, {
            signal: controller.signal,
            headers: {
              'Accept': 'image/svg+xml,image/*,*/*'
            }
          });

          if (response.ok) {
            const iconData = await response.text();
            
            // Validate SVG content
            if (this.isValidSVG(iconData)) {
              return iconData;
            }
          }
        } catch (cdnError) {
          // Try next CDN
          continue;
        }
      }

      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Builds a complete icon URL from CDN base URL and icon name
   * @param {string} cdnUrl - Base CDN URL
   * @param {string} iconName - Icon name
   * @param {string} format - Icon format
   * @returns {string} Complete icon URL
   */
  buildIconUrl(cdnUrl, iconName, format) {
    const extension = format === 'svg' ? 'svg' : 'png';
    const normalizedName = iconName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cdnUrl.replace(/\/$/, '')}/${normalizedName}.${extension}`;
  }

  /**
   * Validates SVG content
   * @param {string} svgData - SVG data to validate
   * @returns {boolean} True if valid SVG
   */
  isValidSVG(svgData) {
    return typeof svgData === 'string' && 
           svgData.trim().startsWith('<svg') && 
           svgData.includes('</svg>') &&
           svgData.length > 50; // Minimum reasonable SVG size
  }

  /**
   * Gets a fallback icon for the specified element type
   * @param {string} elementType - Type of diagram element
   * @returns {string} Fallback icon SVG data
   */
  getFallbackIcon(elementType) {
    return this.fallbackIcons.getIcon(elementType);
  }

  /**
   * Resolves icon name from element type using mappings
   * @param {string} iconName - Original icon name
   * @param {string} elementType - Element type for mapping
   * @returns {string} Resolved icon name
   */
  resolveIconName(iconName, elementType) {
    // If explicit icon name provided, use it
    if (iconName && iconName !== 'auto') {
      return iconName;
    }

    // Try to map from element type
    if (elementType && this.config.iconMappings[elementType]) {
      return this.config.iconMappings[elementType];
    }

    // Default to element type as icon name
    return elementType || 'default';
  }

  /**
   * Generates cache key for icon requests
   * @param {string} iconName - Icon name
   * @param {Object} options - Loading options
   * @returns {string} Cache key
   */
  getCacheKey(iconName, options) {
    return `${iconName}-${options.format}-${options.preferBundled ? 'bundled' : 'cdn'}`;
  }

  /**
   * Preloads commonly used icons for better performance
   * @param {string[]} iconNames - Array of icon names to preload
   * @param {Object} [options] - Preload options
   * @returns {Promise<Object>} Results of preload operations
   */
  async preloadIcons(iconNames, options = {}) {
    const preloadOptions = {
      timeout: 2000, // Shorter timeout for preloading
      ...options
    };

    const results = {
      successful: [],
      failed: [],
      total: iconNames.length
    };

    const preloadPromises = iconNames.map(async (iconName) => {
      try {
        await this.loadIcon(iconName, null, preloadOptions);
        results.successful.push(iconName);
      } catch (error) {
        results.failed.push({ iconName, error: error.message });
      }
    });

    await Promise.allSettled(preloadPromises);
    return results;
  }

  /**
   * Initializes bundled icons from the bundled directory
   */
  async initializeBundledIcons() {
    // Common architectural component icons
    const commonIcons = [
      'microservice', 'api-gateway', 'database', 'cache', 'queue',
      'storage', 'cdn', 'loadbalancer', 'monitoring', 'logging'
    ];

    // Try to preload bundled icons
    for (const iconName of commonIcons) {
      try {
        const iconData = await this.loadBundledIcon(iconName);
        if (iconData) {
          this.bundledIcons.set(iconName, iconData);
        }
      } catch (error) {
        // Ignore errors during initialization
      }
    }
  }

  /**
   * Gets icon manager statistics
   * @returns {Object} Statistics including cache performance and loading metrics
   */
  getStats() {
    return {
      ...this.stats,
      cacheStats: this.cache.getStats(),
      bundledIconsCount: this.bundledIcons.size,
      loadingInProgress: this.loadingPromises.size
    };
  }

  /**
   * Updates icon manager configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Update cache configuration if provided
    if (newConfig.cacheConfig) {
      this.cache.updateConfig(newConfig.cacheConfig);
    }
  }

  /**
   * Clears all cached icons and resets statistics
   */
  clearCache() {
    this.cache.clear();
    this.bundledIcons.clear();
    this.loadingPromises.clear();
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cdnLoads: 0,
      fallbackUsed: 0,
      errors: 0
    };
  }

  /**
   * Adds custom icon mappings
   * @param {Object} mappings - Object mapping element types to icon names
   */
  addIconMappings(mappings) {
    this.config.iconMappings = { ...this.config.iconMappings, ...mappings };
  }

  /**
   * Registers a custom bundled icon
   * @param {string} iconName - Icon name
   * @param {string} svgData - SVG data
   */
  registerBundledIcon(iconName, svgData) {
    if (this.isValidSVG(svgData)) {
      this.bundledIcons.set(iconName, svgData);
    } else {
      throw new Error(`Invalid SVG data for icon "${iconName}"`);
    }
  }

  /**
   * Gets list of available bundled icons
   * @returns {string[]} Array of bundled icon names
   */
  getBundledIconNames() {
    return Array.from(this.bundledIcons.keys());
  }

  /**
   * Checks if an icon is available (cached or bundled)
   * @param {string} iconName - Icon name to check
   * @param {string} [elementType] - Element type for mapping
   * @returns {boolean} True if icon is readily available
   */
  isIconAvailable(iconName, elementType = null) {
    const resolvedIconName = this.resolveIconName(iconName, elementType);
    const cacheKey = this.getCacheKey(resolvedIconName, { format: 'svg', preferBundled: false });
    
    return this.cache.has(cacheKey) || this.bundledIcons.has(resolvedIconName);
  }
}

export default IconManager;