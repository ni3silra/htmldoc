/**
 * @fileoverview Fluent API wrapper for DiagramLibrary
 * This module provides a fluent interface for method chaining and ease of use
 * with clear method documentation and intuitive configuration methods.
 */

import { DiagramError } from '../errors/DiagramError.js';

/**
 * Fluent API wrapper that provides method chaining capabilities for DiagramLibrary
 * Enables intuitive configuration and operation chaining for better developer experience.
 * All methods return the FluentAPI instance to enable continuous method chaining.
 * 
 * @example
 * // Method chaining for configuration and rendering
 * const diagram = new DiagramLibrary('#container')
 *   .fluent()
 *   .theme('dark')
 *   .layout({ forceStrength: 0.5, iterations: 1000 })
 *   .icons({ enableCDN: true })
 *   .performance({ maxNodes: 100 })
 *   .initialize()
 *   .then(api => api.render(htmlContent));
 * 
 * @example
 * // Conditional configuration with chaining
 * const api = diagram.fluent()
 *   .theme(isDarkMode ? 'dark' : 'light')
 *   .layout(isLargeDiagram ? { iterations: 1500 } : { iterations: 500 })
 *   .when(enableAnimations, api => api.animations(true))
 *   .when(isMobile, api => api.interaction({ enableZoom: false }));
 */
export class FluentAPI {
  /**
   * Creates a new FluentAPI wrapper around a DiagramLibrary instance
   * 
   * @param {DiagramLibrary} diagramLibrary - The DiagramLibrary instance to wrap
   * @throws {DiagramError} If diagramLibrary is not provided or invalid
   */
  constructor(diagramLibrary) {
    if (!diagramLibrary) {
      throw new DiagramError(
        'INVALID_LIBRARY_INSTANCE',
        'DiagramLibrary instance is required for FluentAPI',
        { providedInstance: diagramLibrary }
      );
    }

    /**
     * @type {DiagramLibrary} Reference to the wrapped DiagramLibrary instance
     * @private
     */
    this._library = diagramLibrary;

    /**
     * @type {Object} Accumulated configuration changes for batch application
     * @private
     */
    this._pendingConfig = {};

    /**
     * @type {boolean} Whether configuration changes should be applied immediately
     * @private
     */
    this._immediateMode = true;
  }

  // Configuration Methods

  /**
   * Configures the layout engine with force-directed algorithm parameters
   * Provides intuitive configuration for node positioning and force simulation.
   * 
   * @param {LayoutConfig|string} config - Layout configuration object or preset name
   * @param {number} [config.forceStrength=0.3] - Overall strength of forces (0-1)
   * @param {number} [config.linkDistance=100] - Desired distance between connected nodes
   * @param {number} [config.nodeRepulsion=300] - Repulsion force between nodes
   * @param {number} [config.centerForce=0.1] - Force pulling nodes toward center (0-1)
   * @param {number} [config.iterations=500] - Maximum simulation iterations
   * @param {Object} [config.bounds] - Layout bounds {width, height}
   * @param {boolean} [config.enableCollision=true] - Whether to prevent node overlaps
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   * 
   * @example
   * // Configure with object
   * api.layout({
   *   forceStrength: 0.4,
   *   linkDistance: 120,
   *   iterations: 800
   * });
   * 
   * @example
   * // Use preset configuration
   * api.layout('tight'); // or 'loose', 'balanced'
   * 
   * @example
   * // Chain with other configurations
   * api.layout({ forceStrength: 0.5 })
   *    .theme('dark')
   *    .render(htmlContent);
   */
  layout(config) {
    if (typeof config === 'string') {
      // Handle preset configurations
      const presets = {
        'tight': {
          forceStrength: 0.5,
          linkDistance: 80,
          nodeRepulsion: 200,
          iterations: 600
        },
        'loose': {
          forceStrength: 0.2,
          linkDistance: 150,
          nodeRepulsion: 400,
          iterations: 400
        },
        'balanced': {
          forceStrength: 0.3,
          linkDistance: 100,
          nodeRepulsion: 300,
          iterations: 500
        },
        'performance': {
          forceStrength: 0.3,
          linkDistance: 100,
          nodeRepulsion: 300,
          iterations: 200 // Fewer iterations for better performance
        }
      };

      config = presets[config] || presets['balanced'];
    }

    this._updateConfig('layout', config);
    return this;
  }

  /**
   * Configures the theme and visual styling of the diagram
   * Supports both predefined themes and custom theme configurations.
   * 
   * @param {ThemeConfig|string} theme - Theme configuration object or theme name
   * @param {Object} [theme.nodeStyles] - Node styling by type
   * @param {Object} [theme.edgeStyles] - Edge styling by type  
   * @param {Object} [theme.colors] - Color palette
   * @param {Object} [theme.fonts] - Font configuration
   * @param {string} [theme.backgroundColor] - Background color
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   * 
   * @example
   * // Use predefined theme
   * api.theme('dark'); // or 'light', 'colorful', 'minimal'
   * 
   * @example
   * // Custom theme configuration
   * api.theme({
   *   nodeStyles: {
   *     microservice: { fill: '#e3f2fd', stroke: '#1976d2' },
   *     database: { fill: '#e8f5e8', stroke: '#388e3c' }
   *   },
   *   backgroundColor: '#f5f5f5'
   * });
   * 
   * @example
   * // Chain theme with layout
   * api.theme('dark')
   *    .layout('tight')
   *    .render(content);
   */
  theme(theme) {
    this._updateConfig('theme', theme);
    return this;
  }

  /**
   * Configures icon management including CDN sources, caching, and fallbacks
   * Controls how icons are loaded, cached, and displayed for diagram elements.
   * 
   * @param {IconConfig} config - Icon configuration object
   * @param {boolean} [config.enableCDN=true] - Whether to load icons from CDN
   * @param {string[]} [config.cdnUrls] - Array of CDN URLs to try
   * @param {boolean} [config.enableFallbacks=true] - Whether to use fallback icons
   * @param {Object} [config.iconMappings] - Custom element type to icon mappings
   * @param {number} [config.loadTimeout=5000] - Icon loading timeout in milliseconds
   * @param {Object} [config.cacheConfig] - Icon caching configuration
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   * 
   * @example
   * // Enable CDN with custom URLs
   * api.icons({
   *   enableCDN: true,
   *   cdnUrls: ['https://my-icons.com/', 'https://backup-icons.com/'],
   *   loadTimeout: 3000
   * });
   * 
   * @example
   * // Custom icon mappings
   * api.icons({
   *   iconMappings: {
   *     'my-service': 'custom-service-icon',
   *     'special-db': 'database-special'
   *   }
   * });
   */
  icons(config) {
    this._updateConfig('icons', config);
    return this;
  }

  /**
   * Configures user interaction features including zoom, pan, tooltips, and selection
   * Controls how users can interact with the rendered diagram.
   * 
   * @param {InteractionConfig} config - Interaction configuration object
   * @param {boolean} [config.enableZoom=true] - Whether to enable zoom functionality
   * @param {boolean} [config.enablePan=true] - Whether to enable pan functionality
   * @param {boolean} [config.enableTooltips=true] - Whether to show tooltips on hover
   * @param {boolean} [config.enableSelection=true] - Whether to enable node selection
   * @param {Object} [config.zoom] - Zoom-specific configuration
   * @param {Object} [config.tooltips] - Tooltip-specific configuration
   * @param {Object} [config.selection] - Selection-specific configuration
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   * 
   * @example
   * // Configure interaction features
   * api.interaction({
   *   enableZoom: true,
   *   enablePan: true,
   *   enableTooltips: true,
   *   zoom: {
   *     minScale: 0.2,
   *     maxScale: 5,
   *     smoothZoom: true
   *   },
   *   tooltips: {
   *     delay: 300,
   *     followCursor: true
   *   }
   * });
   * 
   * @example
   * // Disable interactions for static display
   * api.interaction({
   *   enableZoom: false,
   *   enablePan: false,
   *   enableTooltips: false
   * });
   */
  interaction(config) {
    this._updateConfig('interaction', config);
    return this;
  }

  /**
   * Configures performance optimization settings for large diagrams
   * Controls performance-related features and optimizations.
   * 
   * @param {PerformanceConfig} config - Performance configuration object
   * @param {number} [config.maxNodes=200] - Maximum number of nodes before warnings
   * @param {boolean} [config.enableOptimizations=true] - Whether to enable performance optimizations
   * @param {number} [config.animationDuration=300] - Default animation duration in milliseconds
   * @param {boolean} [config.lazyLoading=false] - Whether to use lazy loading for icons
   * @param {number} [config.renderThrottle=16] - Render throttling in milliseconds
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   * 
   * @example
   * // Configure for large diagrams
   * api.performance({
   *   maxNodes: 500,
   *   enableOptimizations: true,
   *   lazyLoading: true,
   *   animationDuration: 150
   * });
   * 
   * @example
   * // Optimize for mobile devices
   * api.performance({
   *   maxNodes: 50,
   *   animationDuration: 200,
   *   renderThrottle: 32
   * });
   */
  performance(config) {
    this._updateConfig('performance', config);
    return this;
  }

  /**
   * Configures HTML parser settings for element recognition and validation
   * Controls how HTML content is parsed and validated.
   * 
   * @param {ParserConfig} config - Parser configuration object
   * @param {boolean} [config.strictMode=false] - Whether to use strict parsing mode
   * @param {string[]} [config.allowedElements] - Array of allowed element types
   * @param {boolean} [config.validateConnections=true] - Whether to validate connections
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   * 
   * @example
   * // Enable strict mode with custom elements
   * api.parser({
   *   strictMode: true,
   *   allowedElements: ['microservice', 'database', 'api-gateway', 'my-custom-element'],
   *   validateConnections: true
   * });
   */
  parser(config) {
    this._updateConfig('parser', config);
    return this;
  }

  // Operational Methods

  /**
   * Initializes the diagram library with accumulated configuration
   * Must be called before rendering. Applies all pending configuration changes.
   * 
   * @param {Object} [additionalConfig] - Additional configuration to apply during initialization
   * @returns {Promise<FluentAPI>} Promise resolving to this FluentAPI instance
   * 
   * @example
   * // Initialize with accumulated config
   * await api.theme('dark')
   *           .layout('tight')
   *           .initialize();
   * 
   * @example
   * // Initialize with additional config
   * await api.initialize({
   *   debug: true,
   *   autoResize: false
   * });
   */
  async initialize(additionalConfig = {}) {
    // Apply any pending configuration changes
    const finalConfig = { ...this._pendingConfig, ...additionalConfig };
    this._pendingConfig = {};

    await this._library.initialize(finalConfig);
    return this;
  }

  /**
   * Renders a diagram from HTML content with optional rendering options
   * Applies any pending configuration changes before rendering.
   * 
   * @param {string} htmlContent - HTML markup containing diagram elements
   * @param {RenderOptions} [options={}] - Rendering options
   * @param {boolean} [options.animate=true] - Whether to animate the rendering
   * @param {boolean} [options.preserveViewport=false] - Whether to maintain zoom/pan state
   * @returns {Promise<RenderResult>} Promise resolving to render result
   * 
   * @example
   * // Render with method chaining
   * const result = await api
   *   .theme('colorful')
   *   .layout({ iterations: 800 })
   *   .render(`
   *     <microservice name="user-service" connects="db-1">
   *       <database name="user-db" id="db-1"/>
   *     </microservice>
   *   `);
   * 
   * @example
   * // Render with options
   * await api.render(htmlContent, {
   *   animate: false,
   *   preserveViewport: true
   * });
   */
  async render(htmlContent, options = {}) {
    // Apply any pending configuration changes
    if (Object.keys(this._pendingConfig).length > 0) {
      await this._library.update(this._pendingConfig);
      this._pendingConfig = {};
    }

    return await this._library.render(htmlContent, options);
  }

  /**
   * Updates the current diagram with new content or configuration
   * More efficient than full re-render for incremental changes.
   * 
   * @param {string|Object} updates - New HTML content or configuration updates
   * @param {UpdateOptions} [options={}] - Update options
   * @returns {Promise<RenderResult>} Promise resolving to update result
   * 
   * @example
   * // Update with new HTML
   * await api.update(newHtmlContent);
   * 
   * @example
   * // Update configuration
   * await api.update({
   *   theme: 'dark',
   *   layout: { forceStrength: 0.4 }
   * });
   */
  async update(updates, options = {}) {
    return await this._library.update(updates, options);
  }

  // Utility and Control Methods

  /**
   * Conditionally applies configuration or operations based on a condition
   * Enables conditional method chaining for dynamic configuration.
   * 
   * @param {boolean|Function} condition - Condition to evaluate or boolean value
   * @param {Function} callback - Function to call if condition is true, receives this FluentAPI instance
   * @param {Function} [elseCallback] - Optional function to call if condition is false
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   * 
   * @example
   * // Conditional theme based on user preference
   * api.when(userPrefersDark, api => api.theme('dark'))
   *    .when(isLargeDiagram, api => api.performance({ maxNodes: 500 }))
   *    .render(content);
   * 
   * @example
   * // With else condition
   * api.when(isMobile, 
   *   api => api.interaction({ enableZoom: false }),
   *   api => api.interaction({ enableZoom: true })
   * );
   */
  when(condition, callback, elseCallback = null) {
    const shouldExecute = typeof condition === 'function' ? condition() : condition;
    
    if (shouldExecute && callback) {
      callback(this);
    } else if (!shouldExecute && elseCallback) {
      elseCallback(this);
    }
    
    return this;
  }

  /**
   * Applies a configuration function to this FluentAPI instance
   * Useful for reusable configuration patterns and complex setups.
   * 
   * @param {Function} configFunction - Function that receives this FluentAPI instance
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   * 
   * @example
   * // Reusable configuration function
   * const darkThemeConfig = (api) => api
   *   .theme('dark')
   *   .layout({ forceStrength: 0.4 })
   *   .interaction({ tooltips: { backgroundColor: '#333' } });
   * 
   * api.apply(darkThemeConfig).render(content);
   * 
   * @example
   * // Complex conditional configuration
   * api.apply(api => {
   *   if (isProduction) {
   *     return api.performance({ enableOptimizations: true });
   *   } else {
   *     return api.parser({ strictMode: false }).performance({ maxNodes: 1000 });
   *   }
   * });
   */
  apply(configFunction) {
    if (typeof configFunction === 'function') {
      configFunction(this);
    }
    return this;
  }

  /**
   * Enables or disables batch mode for configuration changes
   * In batch mode, configuration changes are accumulated and applied together.
   * 
   * @param {boolean} [enabled=true] - Whether to enable batch mode
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   * 
   * @example
   * // Batch multiple configuration changes
   * api.batch(true)
   *    .theme('dark')
   *    .layout('tight')
   *    .performance({ maxNodes: 100 })
   *    .batch(false) // Apply all changes at once
   *    .render(content);
   */
  batch(enabled = true) {
    this._immediateMode = !enabled;
    
    // If disabling batch mode, apply pending changes
    if (!enabled && Object.keys(this._pendingConfig).length > 0) {
      this._library.update(this._pendingConfig);
      this._pendingConfig = {};
    }
    
    return this;
  }

  /**
   * Resets all configuration to default values
   * Clears any pending configuration changes and resets to library defaults.
   * 
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   * 
   * @example
   * // Reset to defaults and apply new config
   * api.reset()
   *    .theme('light')
   *    .layout('balanced')
   *    .render(content);
   */
  reset() {
    this._pendingConfig = {};
    // Reset library to defaults would require re-initialization
    console.warn('FluentAPI.reset() clears pending config. Call initialize() to reset library to defaults.');
    return this;
  }

  // Information and Debugging Methods

  /**
   * Gets the current configuration including pending changes
   * Useful for debugging and inspecting current state.
   * 
   * @returns {Object} Current configuration object
   * 
   * @example
   * // Inspect current configuration
   * const config = api.theme('dark').layout('tight').getConfig();
   * console.log('Current config:', config);
   */
  getConfig() {
    const libraryConfig = this._library.getConfig();
    return { ...libraryConfig, ...this._pendingConfig };
  }

  /**
   * Gets performance metrics from the underlying library
   * 
   * @returns {Object} Performance metrics and statistics
   */
  getMetrics() {
    return this._library.getMetrics();
  }

  /**
   * Gets information about the current diagram
   * 
   * @returns {Object|null} Current diagram information or null
   */
  getCurrentDiagram() {
    return this._library.getCurrentDiagram();
  }

  /**
   * Enables debug mode for detailed logging and error information
   * 
   * @param {boolean} [enabled=true] - Whether to enable debug mode
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   * 
   * @example
   * // Enable debug mode
   * api.debug(true)
   *    .theme('dark')
   *    .render(content);
   */
  debug(enabled = true) {
    this._updateConfig('debug', enabled);
    return this;
  }

  // Event Handling Methods

  /**
   * Adds an event listener for diagram events
   * 
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Callback function to execute
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   * 
   * @example
   * // Listen for render completion
   * api.on('renderComplete', (result) => {
   *   console.log(`Rendered ${result.nodeCount} nodes in ${result.renderTime}ms`);
   * }).render(content);
   */
  on(eventName, callback) {
    this._library.on(eventName, callback);
    return this;
  }

  /**
   * Removes an event listener
   * 
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function to remove
   * @returns {FluentAPI} This FluentAPI instance for method chaining
   */
  off(eventName, callback) {
    this._library.off(eventName, callback);
    return this;
  }

  // Cleanup Methods

  /**
   * Destroys the underlying diagram library and cleans up resources
   * The FluentAPI instance cannot be used after calling this method.
   * 
   * @returns {Promise<void>} Promise resolving when cleanup is complete
   * 
   * @example
   * // Clean up when done
   * await api.destroy();
   */
  async destroy() {
    await this._library.destroy();
    this._library = null;
    this._pendingConfig = {};
  }

  // Private Helper Methods

  /**
   * Updates configuration either immediately or in batch mode
   * @private
   */
  _updateConfig(key, value) {
    if (this._immediateMode && this._library.initialized) {
      // Apply immediately if library is initialized
      const update = {};
      update[key] = value;
      this._library.update(update);
    } else {
      // Accumulate for batch application
      this._pendingConfig[key] = value;
    }
  }

  /**
   * Gets the underlying DiagramLibrary instance
   * Primarily for internal use and testing
   * @private
   */
  _getLibrary() {
    return this._library;
  }
}

export default FluentAPI;