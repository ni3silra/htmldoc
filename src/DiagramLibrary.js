/**
 * @fileoverview Main DiagramLibrary class - Public API for HTML Diagram Library
 * This is the primary entry point for users to create and manage architectural diagrams
 * from HTML-like markup. Provides a simple initialization API with comprehensive configuration
 * options for layout, theming, performance, and interaction settings.
 */

import { HTMLParser } from './parser/HTMLParser.js';
import { DataTransformer } from './parser/DataTransformer.js';
import { LayoutEngine } from './layout/LayoutEngine.js';
import { SVGRenderer } from './renderer/SVGRenderer.js';
import { InteractionLayer } from './interaction/InteractionLayer.js';
import { IconManager } from './icons/IconManager.js';
import { ThemeManager } from './themes/ThemeManager.js';
import { FluentAPI } from './api/FluentAPI.js';
import { DiagramError } from './errors/DiagramError.js';

/**
 * Main DiagramLibrary class providing the public API for creating architectural diagrams
 * from HTML-like markup. This class orchestrates all the internal components and provides
 * a simple, fluent interface for diagram creation and management.
 * 
 * @example
 * // Basic usage
 * const diagram = new DiagramLibrary('#diagram-container');
 * await diagram.initialize({
 *   theme: 'default',
 *   layout: { forceStrength: 0.5 },
 *   icons: { enableCDN: true }
 * });
 * 
 * const html = `
 *   <microservice name="user-service" connects="database-1">
 *     <database name="user-db" id="database-1" brand="postgresql"/>
 *   </microservice>
 * `;
 * 
 * await diagram.render(html);
 * 
 * @example
 * // Fluent API usage
 * const diagram = new DiagramLibrary('#container')
 *   .theme('dark')
 *   .layout({ iterations: 1000 })
 *   .performance({ maxNodes: 100 })
 *   .render(htmlContent);
 */
export class DiagramLibrary {
  /**
   * Creates a new DiagramLibrary instance with comprehensive configuration support
   * 
   * @param {string|HTMLElement} container - CSS selector string or DOM element for the diagram container
   * @param {LibraryConfig} [config={}] - Initial configuration options for the library
   * @param {LayoutConfig} [config.layout] - Layout engine configuration (force parameters, iterations, etc.)
   * @param {ThemeConfig} [config.theme] - Theme configuration (colors, fonts, styling)
   * @param {IconConfig} [config.icons] - Icon management configuration (CDN URLs, caching, fallbacks)
   * @param {InteractionConfig} [config.interaction] - User interaction configuration (zoom, pan, tooltips)
   * @param {PerformanceConfig} [config.performance] - Performance optimization settings
   * @param {ParserConfig} [config.parser] - HTML parser configuration (validation, allowed elements)
   * @param {boolean} [config.autoResize=true] - Whether to automatically resize on container changes
   * @param {boolean} [config.enableErrorRecovery=true] - Whether to attempt error recovery on failures
   * 
   * @throws {DiagramError} If container element cannot be found or is invalid
   * 
   * @example
   * // Create with default configuration
   * const diagram = new DiagramLibrary('#my-container');
   * 
   * @example
   * // Create with custom configuration
   * const diagram = new DiagramLibrary(document.getElementById('container'), {
   *   layout: {
   *     forceStrength: 0.3,
   *     linkDistance: 100,
   *     iterations: 500
   *   },
   *   theme: {
   *     nodeStyles: {
   *       microservice: { fill: '#e3f2fd', stroke: '#1976d2' }
   *     }
   *   },
   *   performance: {
   *     maxNodes: 50,
   *     enableOptimizations: true
   *   }
   * });
   */
  constructor(container, config = {}) {
    // Resolve and validate container element
    this.container = this._resolveContainer(container);
    if (!this.container) {
      throw new DiagramError(
        'INITIALIZATION_ERROR',
        'Container element not found or invalid',
        { container, providedConfig: config }
      );
    }

    /**
     * @type {LibraryConfig} Complete configuration object with defaults applied
     */
    this.config = this._mergeWithDefaults(config);

    /**
     * @type {boolean} Whether the library has been initialized
     */
    this.initialized = false;

    /**
     * @type {boolean} Whether a diagram is currently being rendered
     */
    this.rendering = false;

    /**
     * @type {Object|null} Current diagram data (nodes, edges, metadata)
     */
    this.currentDiagram = null;

    /**
     * @type {string|null} Current HTML content being displayed
     */
    this.currentHTML = null;

    // Core component instances (initialized during initialize())
    /**
     * @type {HTMLParser|null} HTML parser for extracting diagram elements
     */
    this.parser = null;

    /**
     * @type {DataTransformer|null} Data transformer for graph conversion
     */
    this.transformer = null;

    /**
     * @type {LayoutEngine|null} Layout engine for positioning calculations
     */
    this.layoutEngine = null;

    /**
     * @type {SVGRenderer|null} SVG renderer for visual output
     */
    this.renderer = null;

    /**
     * @type {InteractionLayer|null} Interaction layer for user interactions
     */
    this.interactionLayer = null;

    /**
     * @type {IconManager|null} Icon manager for loading and caching icons
     */
    this.iconManager = null;

    /**
     * @type {ThemeManager|null} Theme manager for styling and appearance
     */
    this.themeManager = null;

    /**
     * @type {FluentAPI|null} Fluent API wrapper for method chaining
     */
    this.fluentAPI = null;

    // Event listeners and callbacks
    /**
     * @type {Map<string, Function[]>} Event listeners for diagram events
     */
    this.eventListeners = new Map();

    /**
     * @type {ResizeObserver|null} Observer for container size changes
     */
    this.resizeObserver = null;

    // Performance and debugging
    /**
     * @type {Object} Performance metrics and statistics
     */
    this.metrics = {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
      errorCount: 0,
      lastError: null
    };

    /**
     * @type {boolean} Whether debug mode is enabled
     */
    this.debugMode = config.debug || false;

    // Set up container preparation
    this._prepareContainer();

    // Set up resize handling if enabled
    if (this.config.autoResize) {
      this._setupResizeHandling();
    }

    // Log initialization in debug mode
    if (this.debugMode) {
      console.log('DiagramLibrary instance created', {
        container: this.container,
        config: this.config
      });
    }
  }

  /**
   * Initializes the diagram library with configuration options for layout, theming, and performance
   * This method must be called before rendering any diagrams. It sets up all internal components
   * and prepares the library for diagram creation.
   * 
   * @param {Partial<LibraryConfig>} [options={}] - Configuration options to override defaults
   * @param {LayoutConfig} [options.layout] - Layout engine configuration
   * @param {ThemeConfig} [options.theme] - Theme and styling configuration  
   * @param {IconConfig} [options.icons] - Icon management configuration
   * @param {InteractionConfig} [options.interaction] - User interaction settings
   * @param {PerformanceConfig} [options.performance] - Performance optimization settings
   * @param {boolean} [options.preloadCommonIcons=true] - Whether to preload commonly used icons
   * @returns {Promise<DiagramLibrary>} Promise resolving to this instance for method chaining
   * 
   * @throws {DiagramError} If initialization fails due to configuration or component errors
   * 
   * @example
   * // Initialize with default settings
   * await diagram.initialize();
   * 
   * @example
   * // Initialize with custom configuration
   * await diagram.initialize({
   *   layout: {
   *     forceStrength: 0.4,
   *     iterations: 800
   *   },
   *   theme: 'dark',
   *   icons: {
   *     enableCDN: true,
   *     cdnUrls: ['https://my-icon-cdn.com/']
   *   },
   *   performance: {
   *     maxNodes: 100,
   *     enableOptimizations: true
   *   }
   * });
   */
  async initialize(options = {}) {
    if (this.initialized) {
      console.warn('DiagramLibrary already initialized. Skipping re-initialization.');
      return this;
    }

    try {
      // Merge new options with existing configuration
      this.config = this._mergeWithDefaults({ ...this.config, ...options });

      // Initialize core components in dependency order
      await this._initializeComponents();

      // Set up event handling between components
      this._setupComponentInteractions();

      // Preload common icons if enabled
      if (this.config.preloadCommonIcons !== false) {
        await this._preloadCommonIcons();
      }

      // Mark as initialized
      this.initialized = true;

      // Create fluent API wrapper
      this.fluentAPI = new FluentAPI(this);

      // Emit initialization complete event
      this._emit('initialized', { config: this.config });

      if (this.debugMode) {
        console.log('DiagramLibrary initialized successfully', this.config);
      }

      return this;

    } catch (error) {
      this.metrics.errorCount++;
      this.metrics.lastError = error;

      const initError = new DiagramError(
        'INITIALIZATION_ERROR',
        `Failed to initialize DiagramLibrary: ${error.message}`,
        { originalError: error, config: this.config }
      );

      if (this.config.enableErrorRecovery) {
        console.error('Initialization failed, attempting recovery:', initError);
        await this._attemptErrorRecovery('initialization', initError);
      } else {
        throw initError;
      }
    }
  }

  /**
   * Renders a diagram from HTML markup with comprehensive error handling
   * Parses the HTML, transforms it to graph data, calculates layout, and renders the SVG output.
   * This is the primary method for creating diagrams from HTML content.
   * 
   * @param {string} htmlContent - HTML markup containing diagram elements
   * @param {RenderOptions} [options={}] - Rendering options and overrides
   * @param {boolean} [options.animate=true] - Whether to animate the rendering process
   * @param {boolean} [options.preserveViewport=false] - Whether to maintain current zoom/pan state
   * @param {LayoutConfig} [options.layoutOverrides] - Temporary layout configuration overrides
   * @param {ThemeConfig} [options.themeOverrides] - Temporary theme configuration overrides
   * @returns {Promise<RenderResult>} Promise resolving to render result with metadata
   * 
   * @throws {DiagramError} If rendering fails due to parsing, layout, or rendering errors
   * 
   * @example
   * // Basic rendering
   * await diagram.render(`
   *   <microservice name="user-service" connects="db-1">
   *     <database name="user-db" id="db-1" brand="postgresql"/>
   *   </microservice>
   * `);
   * 
   * @example
   * // Rendering with options
   * const result = await diagram.render(htmlContent, {
   *   animate: false,
   *   preserveViewport: true,
   *   layoutOverrides: { iterations: 1200 }
   * });
   * console.log(`Rendered ${result.nodeCount} nodes and ${result.edgeCount} edges`);
   */
  async render(htmlContent, options = {}) {
    if (!this.initialized) {
      throw new DiagramError(
        'NOT_INITIALIZED',
        'DiagramLibrary must be initialized before rendering. Call initialize() first.',
        { htmlContent: htmlContent?.substring(0, 100) + '...' }
      );
    }

    if (this.rendering) {
      throw new DiagramError(
        'RENDER_IN_PROGRESS',
        'Another render operation is already in progress. Wait for it to complete.',
        { currentHTML: this.currentHTML }
      );
    }

    const startTime = performance.now();
    this.rendering = true;

    try {
      // Validate input
      if (!htmlContent || typeof htmlContent !== 'string') {
        throw new DiagramError(
          'INVALID_INPUT',
          'HTML content must be a non-empty string',
          { providedContent: htmlContent }
        );
      }

      // Apply temporary configuration overrides
      const originalConfig = this.config;
      if (options.layoutOverrides || options.themeOverrides) {
        this.config = {
          ...this.config,
          layout: { ...this.config.layout, ...options.layoutOverrides },
          theme: { ...this.config.theme, ...options.themeOverrides }
        };
        this._updateComponentConfigurations();
      }

      // Emit render start event
      this._emit('renderStart', { htmlContent, options });

      // Step 1: Parse HTML content
      const parseResult = this.parser.parseHTML(htmlContent);
      if (!parseResult.isValid) {
        throw new DiagramError(
          'PARSE_ERROR',
          'Failed to parse HTML content',
          { 
            errors: parseResult.errors,
            warnings: parseResult.warnings,
            htmlContent: htmlContent.substring(0, 200) + '...'
          }
        );
      }

      // Step 2: Transform to graph data
      const graphData = this.transformer.transformToGraph(parseResult.elements);
      
      // Validate graph data
      if (!graphData.nodes || graphData.nodes.length === 0) {
        throw new DiagramError(
          'EMPTY_DIAGRAM',
          'No valid diagram elements found in HTML content',
          { parseResult, htmlContent: htmlContent.substring(0, 200) + '...' }
        );
      }

      // Step 3: Calculate layout
      const layoutResult = await this.layoutEngine.calculateLayout(graphData);

      // Step 4: Render SVG
      await this.renderer.render(layoutResult);

      // Step 5: Set up interactions
      this.interactionLayer.updateData(layoutResult.nodes, layoutResult.edges);
      if (!options.preserveViewport) {
        this.interactionLayer.resetView(options.animate !== false);
      }

      // Store current state
      this.currentDiagram = {
        parseResult,
        graphData,
        layoutResult,
        renderTime: performance.now() - startTime
      };
      this.currentHTML = htmlContent;

      // Update metrics
      this.metrics.renderCount++;
      this.metrics.lastRenderTime = this.currentDiagram.renderTime;
      this.metrics.totalRenderTime += this.currentDiagram.renderTime;
      this.metrics.averageRenderTime = this.metrics.totalRenderTime / this.metrics.renderCount;

      // Restore original configuration if overrides were applied
      if (originalConfig !== this.config) {
        this.config = originalConfig;
        this._updateComponentConfigurations();
      }

      // Create render result
      const renderResult = {
        success: true,
        nodeCount: layoutResult.nodes.length,
        edgeCount: layoutResult.edges.length,
        renderTime: this.currentDiagram.renderTime,
        warnings: parseResult.warnings,
        bounds: layoutResult.bounds,
        converged: layoutResult.converged,
        iterations: layoutResult.iterations
      };

      // Emit render complete event
      this._emit('renderComplete', renderResult);

      if (this.debugMode) {
        console.log('Render completed successfully', renderResult);
      }

      return renderResult;

    } catch (error) {
      this.metrics.errorCount++;
      this.metrics.lastError = error;

      // Emit render error event
      this._emit('renderError', { error, htmlContent, options });

      if (this.config.enableErrorRecovery) {
        console.error('Render failed, attempting recovery:', error);
        const recoveryResult = await this._attemptErrorRecovery('render', error, { htmlContent, options });
        if (recoveryResult.success) {
          return recoveryResult;
        }
      }

      throw error;

    } finally {
      this.rendering = false;
    }
  }

  /**
   * Updates the current diagram with new HTML content or configuration changes
   * More efficient than a full re-render when making incremental changes.
   * 
   * @param {string|Object} updates - New HTML content or configuration updates
   * @param {UpdateOptions} [options={}] - Update options
   * @param {boolean} [options.animate=true] - Whether to animate the update
   * @param {boolean} [options.preservePositions=true] - Whether to maintain node positions
   * @returns {Promise<RenderResult>} Promise resolving to update result
   * 
   * @throws {DiagramError} If no current diagram exists or update fails
   */
  async update(updates, options = {}) {
    if (!this.currentDiagram) {
      throw new DiagramError(
        'NO_CURRENT_DIAGRAM',
        'No diagram to update. Call render() first.',
        { updates }
      );
    }

    // If updates is a string, treat it as new HTML content
    if (typeof updates === 'string') {
      return this.render(updates, { 
        preserveViewport: true,
        ...options 
      });
    }

    // Handle configuration updates
    if (typeof updates === 'object') {
      this.config = this._mergeWithDefaults({ ...this.config, ...updates });
      this._updateComponentConfigurations();

      // Re-render with updated configuration
      return this.render(this.currentHTML, {
        preserveViewport: true,
        ...options
      });
    }

    throw new DiagramError(
      'INVALID_UPDATE',
      'Updates must be HTML string or configuration object',
      { updates, typeof: typeof updates }
    );
  }

  /**
   * Destroys the diagram library instance and cleans up all resources
   * Removes event listeners, clears caches, and destroys all component instances.
   * The instance cannot be used after calling this method.
   * 
   * @returns {Promise<void>} Promise resolving when cleanup is complete
   * 
   * @example
   * // Clean up when done
   * await diagram.destroy();
   */
  async destroy() {
    try {
      // Emit destroy start event
      this._emit('destroyStart');

      // Stop any ongoing rendering
      this.rendering = false;

      // Destroy components in reverse dependency order
      if (this.interactionLayer) {
        this.interactionLayer.destroy();
        this.interactionLayer = null;
      }

      if (this.renderer) {
        this.renderer.destroy();
        this.renderer = null;
      }

      if (this.layoutEngine) {
        this.layoutEngine.stop();
        this.layoutEngine = null;
      }

      if (this.iconManager) {
        this.iconManager.clearCache();
        this.iconManager = null;
      }

      // Clean up DOM
      if (this.container) {
        this.container.innerHTML = '';
        this.container.classList.remove('diagram-library-container');
      }

      // Clean up resize observer
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      // Clear all event listeners
      this.eventListeners.clear();

      // Reset state
      this.initialized = false;
      this.currentDiagram = null;
      this.currentHTML = null;

      // Emit destroy complete event
      this._emit('destroyComplete');

      if (this.debugMode) {
        console.log('DiagramLibrary destroyed successfully');
      }

    } catch (error) {
      console.error('Error during DiagramLibrary destruction:', error);
      throw new DiagramError(
        'DESTROY_ERROR',
        `Failed to destroy DiagramLibrary: ${error.message}`,
        { originalError: error }
      );
    }
  }

  // Fluent API methods for method chaining

  /**
   * Returns the fluent API wrapper for method chaining
   * @returns {FluentAPI} Fluent API instance
   */
  fluent() {
    if (!this.fluentAPI) {
      this.fluentAPI = new FluentAPI(this);
    }
    return this.fluentAPI;
  }

  // Event handling methods

  /**
   * Adds an event listener for diagram events
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Callback function to execute
   * @returns {DiagramLibrary} This instance for method chaining
   */
  on(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
    return this;
  }

  /**
   * Removes an event listener
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function to remove
   * @returns {DiagramLibrary} This instance for method chaining
   */
  off(eventName, callback) {
    if (this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  // Utility and information methods

  /**
   * Gets current library configuration
   * @returns {LibraryConfig} Current configuration object
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Gets performance metrics and statistics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      initialized: this.initialized,
      rendering: this.rendering,
      hasCurrentDiagram: !!this.currentDiagram
    };
  }

  /**
   * Gets information about the current diagram
   * @returns {Object|null} Current diagram information or null
   */
  getCurrentDiagram() {
    if (!this.currentDiagram) return null;

    return {
      nodeCount: this.currentDiagram.layoutResult.nodes.length,
      edgeCount: this.currentDiagram.layoutResult.edges.length,
      renderTime: this.currentDiagram.renderTime,
      bounds: this.currentDiagram.layoutResult.bounds,
      converged: this.currentDiagram.layoutResult.converged
    };
  }

  // Private helper methods

  /**
   * Resolves container element from selector or element
   * @private
   */
  _resolveContainer(container) {
    if (typeof container === 'string') {
      return document.querySelector(container);
    } else if (container instanceof HTMLElement) {
      return container;
    }
    return null;
  }

  /**
   * Merges user configuration with default values
   * @private
   */
  _mergeWithDefaults(config) {
    const defaults = {
      layout: {
        forceStrength: 0.3,
        linkDistance: 100,
        nodeRepulsion: 300,
        centerForce: 0.1,
        iterations: 500
      },
      theme: 'default',
      icons: {
        enableCDN: true,
        enableFallbacks: true
      },
      interaction: {
        enableZoom: true,
        enablePan: true,
        enableTooltips: true
      },
      performance: {
        maxNodes: 200,
        enableOptimizations: true
      },
      parser: {
        strictMode: false,
        validateConnections: true
      },
      autoResize: true,
      enableErrorRecovery: true,
      preloadCommonIcons: true,
      debug: false
    };

    return this._deepMerge(defaults, config);
  }

  /**
   * Deep merge utility for configuration objects
   * @private
   */
  _deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Prepares the container element for diagram rendering
   * @private
   */
  _prepareContainer() {
    this.container.classList.add('diagram-library-container');
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
  }

  /**
   * Sets up resize handling for the container
   * @private
   */
  _setupResizeHandling() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.initialized && this.currentDiagram) {
          // Trigger re-render on container resize
          this._emit('containerResize');
          // Debounce resize handling
          clearTimeout(this._resizeTimeout);
          this._resizeTimeout = setTimeout(() => {
            this.update({}, { preserveViewport: true });
          }, 250);
        }
      });
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * Initializes all core components
   * @private
   */
  async _initializeComponents() {
    // Initialize icon manager first (needed by renderer)
    this.iconManager = new IconManager(this.config.icons);

    // Initialize theme manager
    this.themeManager = new ThemeManager(this.config.theme);

    // Initialize parser
    this.parser = new HTMLParser(this.config.parser);

    // Initialize data transformer
    this.transformer = new DataTransformer();

    // Initialize layout engine
    this.layoutEngine = new LayoutEngine(this.config.layout);

    // Initialize renderer
    this.renderer = new SVGRenderer(this.container, this.iconManager, this.config.renderer);

    // Initialize interaction layer
    this.interactionLayer = new InteractionLayer(
      this.renderer.getSVGElement(),
      this.config.interaction
    );
  }

  /**
   * Sets up interactions between components
   * @private
   */
  _setupComponentInteractions() {
    // Apply theme to renderer
    if (this.themeManager && this.renderer) {
      this.renderer.applyTheme(this.themeManager.getCurrentTheme());
    }

    // Set up layout progress callbacks
    if (this.layoutEngine) {
      this.layoutEngine.onProgressCallback((progress) => {
        this._emit('layoutProgress', progress);
      });
    }
  }

  /**
   * Updates component configurations after config changes
   * @private
   */
  _updateComponentConfigurations() {
    if (this.layoutEngine) {
      this.layoutEngine.updateConfig(this.config.layout);
    }
    if (this.iconManager) {
      this.iconManager.updateConfig(this.config.icons);
    }
    if (this.themeManager) {
      this.themeManager.updateConfig(this.config.theme);
    }
  }

  /**
   * Preloads commonly used icons for better performance
   * @private
   */
  async _preloadCommonIcons() {
    const commonIcons = [
      'microservice', 'api-gateway', 'database', 'cache', 'queue',
      'storage', 'load-balancer', 'monitoring', 'logging'
    ];

    try {
      await this.iconManager.preloadIcons(commonIcons, { timeout: 2000 });
    } catch (error) {
      console.warn('Failed to preload some icons:', error);
    }
  }

  /**
   * Attempts error recovery based on error type
   * @private
   */
  async _attemptErrorRecovery(operation, error, context = {}) {
    console.log(`Attempting error recovery for ${operation}:`, error);
    
    // Basic recovery strategies
    switch (operation) {
      case 'initialization':
        // Try with minimal configuration
        try {
          this.config = this._mergeWithDefaults({});
          await this._initializeComponents();
          this.initialized = true;
          return { success: true, recovery: 'minimal-config' };
        } catch (recoveryError) {
          return { success: false, error: recoveryError };
        }

      case 'render':
        // Try with simplified HTML or fallback rendering
        try {
          if (context.htmlContent) {
            // Attempt simplified parsing
            const simpleHTML = context.htmlContent.replace(/<[^>]*>/g, '');
            if (simpleHTML.trim()) {
              return { success: false, error: new DiagramError('RECOVERY_FAILED', 'Could not recover from render error') };
            }
          }
        } catch (recoveryError) {
          return { success: false, error: recoveryError };
        }
        break;
    }

    return { success: false, error };
  }

  /**
   * Emits an event to all registered listeners
   * @private
   */
  _emit(eventName, data = {}) {
    if (this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName);
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }
}

export default DiagramLibrary;