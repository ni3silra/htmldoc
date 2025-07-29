/**
 * @fileoverview Core type definitions and interfaces for the HTML Diagram Library
 * This file contains JSDoc type definitions for all core data models used throughout the library.
 */

/**
 * Represents a parsed HTML element from the diagram markup
 * @typedef {Object} ParsedElement
 * @property {string} type - The element type (e.g., 'microservice', 'api-gateway', 'database')
 * @property {string} id - Unique identifier for the element
 * @property {Object<string, string>} attributes - Key-value pairs of element attributes
 * @property {string} [attributes.name] - Display name for the element
 * @property {string} [attributes.brand] - Brand/technology identifier for icon selection
 * @property {string} [attributes.connects] - Comma-separated list of element IDs this connects to
 * @property {ParsedElement[]} children - Array of child elements for hierarchical structures
 * @property {string[]} connections - Array of element IDs this element connects to
 * @property {Object<string, any>} metadata - Additional metadata extracted from attributes
 */

/**
 * Represents the complete graph data structure for diagram rendering
 * @typedef {Object} GraphData
 * @property {Node[]} nodes - Array of all nodes in the graph
 * @property {Edge[]} edges - Array of all edges connecting nodes
 * @property {Object} bounds - Bounding box information for the graph
 * @property {number} bounds.width - Total width of the graph
 * @property {number} bounds.height - Total height of the graph
 * @property {Object} center - Center point of the graph
 * @property {number} center.x - X coordinate of the center
 * @property {number} center.y - Y coordinate of the center
 */

/**
 * Represents a single node in the diagram graph
 * @typedef {Object} Node
 * @property {string} id - Unique identifier for the node
 * @property {string} type - Node type (e.g., 'microservice', 'database', 'api-gateway')
 * @property {string} label - Display text for the node
 * @property {string} icon - Icon identifier or URL for the node
 * @property {Object} position - Current position of the node
 * @property {number} position.x - X coordinate
 * @property {number} position.y - Y coordinate
 * @property {Object} size - Dimensions of the node
 * @property {number} size.width - Width of the node
 * @property {number} size.height - Height of the node
 * @property {NodeStyle} style - Visual styling information for the node
 * @property {Object<string, any>} metadata - Additional data associated with the node
 * @property {boolean} [fixed] - Whether the node position is fixed during layout
 * @property {number} [weight] - Weight factor for force calculations
 */

/**
 * Represents a connection between two nodes in the graph
 * @typedef {Object} Edge
 * @property {string} id - Unique identifier for the edge
 * @property {string} source - ID of the source node
 * @property {string} target - ID of the target node
 * @property {('connection'|'hierarchy'|'dependency')} type - Type of relationship
 * @property {EdgeStyle} style - Visual styling information for the edge
 * @property {string} [label] - Optional label for the edge
 * @property {number} [weight] - Weight factor for layout calculations
 * @property {boolean} [bidirectional] - Whether the connection is bidirectional
 * @property {Object<string, any>} metadata - Additional data associated with the edge
 */

/**
 * Visual styling configuration for nodes
 * @typedef {Object} NodeStyle
 * @property {string} fill - Fill color for the node
 * @property {string} stroke - Border color for the node
 * @property {number} strokeWidth - Border width in pixels
 * @property {string} textColor - Color for node labels
 * @property {string} fontFamily - Font family for node labels
 * @property {number} fontSize - Font size for node labels
 * @property {string} fontWeight - Font weight for node labels
 * @property {number} opacity - Opacity value (0-1)
 * @property {number} borderRadius - Border radius for rounded corners
 * @property {string} [shadowColor] - Optional shadow color
 * @property {number} [shadowBlur] - Optional shadow blur radius
 */

/**
 * Visual styling configuration for edges
 * @typedef {Object} EdgeStyle
 * @property {string} stroke - Line color for the edge
 * @property {number} strokeWidth - Line width in pixels
 * @property {string} strokeDasharray - Dash pattern for dashed lines
 * @property {number} opacity - Opacity value (0-1)
 * @property {string} markerEnd - Arrow marker configuration
 * @property {string} [labelColor] - Color for edge labels
 * @property {string} [labelFontFamily] - Font family for edge labels
 * @property {number} [labelFontSize] - Font size for edge labels
 */

/**
 * Complete configuration object for the diagram library
 * @typedef {Object} DiagramConfig
 * @property {LayoutConfig} layout - Layout engine configuration
 * @property {IconConfig} icons - Icon management configuration
 * @property {ThemeConfig} theme - Visual theming configuration
 * @property {InteractionConfig} interaction - User interaction configuration
 * @property {PerformanceConfig} performance - Performance optimization settings
 * @property {ValidationConfig} validation - Input validation settings
 * @property {ErrorConfig} error - Error handling configuration
 */

/**
 * Configuration for the force-directed layout engine
 * @typedef {Object} LayoutConfig
 * @property {number} forceStrength - Overall strength of forces (0-1)
 * @property {number} linkDistance - Desired distance between connected nodes
 * @property {number} nodeRepulsion - Repulsion force between nodes
 * @property {number} centerForce - Force pulling nodes toward center
 * @property {number} iterations - Maximum iterations for layout stabilization
 * @property {number} alpha - Initial alpha value for force simulation
 * @property {number} alphaDecay - Rate of alpha decay per iteration
 * @property {number} velocityDecay - Velocity decay factor (friction)
 * @property {boolean} enableCollision - Whether to prevent node overlaps
 * @property {number} collisionRadius - Collision detection radius multiplier
 * @property {Object} bounds - Layout boundary constraints
 * @property {number} bounds.width - Maximum layout width
 * @property {number} bounds.height - Maximum layout height
 */

/**
 * Configuration for icon management and loading
 * @typedef {Object} IconConfig
 * @property {Object<string, string>} iconSources - Mapping of node types to icon URLs
 * @property {string} fallbackIcon - Default icon when specific icon not found
 * @property {string[]} externalSources - Array of external icon CDN URLs
 * @property {boolean} enableCaching - Whether to cache loaded icons
 * @property {number} cacheExpiry - Cache expiration time in milliseconds
 * @property {number} loadTimeout - Timeout for icon loading in milliseconds
 * @property {Object<string, string>} bundledIcons - Built-in icon definitions
 * @property {boolean} lazyLoading - Whether to load icons on demand
 */

/**
 * Visual theming configuration for the entire diagram
 * @typedef {Object} ThemeConfig
 * @property {Object<string, NodeStyle>} nodeStyles - Styles for different node types
 * @property {Object<string, EdgeStyle>} edgeStyles - Styles for different edge types
 * @property {Object<string, string>} colors - Color palette definitions
 * @property {FontConfig} fonts - Font configuration
 * @property {string} backgroundColor - Background color for the diagram
 * @property {GridConfig} [grid] - Optional grid configuration
 * @property {AnimationConfig} animations - Animation settings
 * @property {ResponsiveConfig} responsive - Responsive design settings
 */

/**
 * Font configuration for text elements
 * @typedef {Object} FontConfig
 * @property {string} primary - Primary font family
 * @property {string} secondary - Secondary font family
 * @property {Object<string, number>} sizes - Font size definitions
 * @property {number} sizes.small - Small font size
 * @property {number} sizes.medium - Medium font size
 * @property {number} sizes.large - Large font size
 * @property {Object<string, string>} weights - Font weight definitions
 * @property {string} weights.normal - Normal font weight
 * @property {string} weights.bold - Bold font weight
 */

/**
 * Configuration for user interaction features
 * @typedef {Object} InteractionConfig
 * @property {boolean} enableZoom - Whether zooming is enabled
 * @property {boolean} enablePan - Whether panning is enabled
 * @property {boolean} enableTooltips - Whether tooltips are enabled
 * @property {boolean} enableSelection - Whether node selection is enabled
 * @property {ZoomConfig} zoom - Zoom behavior configuration
 * @property {TooltipConfig} tooltips - Tooltip appearance configuration
 * @property {SelectionConfig} selection - Selection behavior configuration
 * @property {boolean} enableKeyboardNav - Whether keyboard navigation is enabled
 */

/**
 * Zoom behavior configuration
 * @typedef {Object} ZoomConfig
 * @property {number} minScale - Minimum zoom scale factor
 * @property {number} maxScale - Maximum zoom scale factor
 * @property {number} scaleStep - Zoom step increment
 * @property {boolean} smoothZoom - Whether to use smooth zoom transitions
 * @property {number} duration - Animation duration for zoom transitions
 */

/**
 * Tooltip configuration
 * @typedef {Object} TooltipConfig
 * @property {number} delay - Delay before showing tooltip (ms)
 * @property {number} duration - How long tooltip stays visible (ms)
 * @property {string} backgroundColor - Tooltip background color
 * @property {string} textColor - Tooltip text color
 * @property {number} fontSize - Tooltip font size
 * @property {number} padding - Tooltip padding
 * @property {number} borderRadius - Tooltip border radius
 * @property {boolean} followCursor - Whether tooltip follows cursor
 */

/**
 * Selection behavior configuration
 * @typedef {Object} SelectionConfig
 * @property {boolean} multiSelect - Whether multiple selection is enabled
 * @property {string} selectionColor - Color for selected elements
 * @property {number} selectionWidth - Border width for selected elements
 * @property {boolean} highlightConnected - Whether to highlight connected nodes
 */

/**
 * Performance optimization configuration
 * @typedef {Object} PerformanceConfig
 * @property {number} maxNodes - Maximum number of nodes before optimization
 * @property {number} animationDuration - Default animation duration (ms)
 * @property {number} renderThrottle - Throttle delay for render updates (ms)
 * @property {boolean} lazyLoading - Whether to use lazy loading for icons
 * @property {boolean} enableVirtualization - Whether to virtualize large graphs
 * @property {number} viewportBuffer - Buffer size for viewport culling
 * @property {boolean} enableWebWorkers - Whether to use web workers for calculations
 * @property {MemoryConfig} memory - Memory management settings
 */

/**
 * Memory management configuration
 * @typedef {Object} MemoryConfig
 * @property {number} maxCacheSize - Maximum cache size in MB
 * @property {boolean} enableGarbageCollection - Whether to enable periodic cleanup
 * @property {number} gcInterval - Garbage collection interval (ms)
 * @property {number} maxHistorySize - Maximum undo/redo history size
 */

/**
 * Input validation configuration
 * @typedef {Object} ValidationConfig
 * @property {boolean} strictMode - Whether to use strict validation
 * @property {boolean} allowUnknownElements - Whether to allow unknown element types
 * @property {boolean} validateConnections - Whether to validate connection references
 * @property {boolean} requireUniqueIds - Whether to require unique element IDs
 * @property {number} maxDepth - Maximum nesting depth for elements
 * @property {RegExp[]} allowedAttributes - Patterns for allowed attribute names
 */

/**
 * Error handling configuration
 * @typedef {Object} ErrorConfig
 * @property {boolean} throwOnError - Whether to throw exceptions on errors
 * @property {boolean} logErrors - Whether to log errors to console
 * @property {('silent'|'warn'|'error')} logLevel - Logging level for errors
 * @property {boolean} showUserFriendlyMessages - Whether to show user-friendly error messages
 * @property {Object<string, string>} customMessages - Custom error message overrides
 */

/**
 * Grid configuration for background grid
 * @typedef {Object} GridConfig
 * @property {boolean} enabled - Whether grid is visible
 * @property {number} size - Grid cell size in pixels
 * @property {string} color - Grid line color
 * @property {number} opacity - Grid opacity (0-1)
 * @property {boolean} snapToGrid - Whether elements snap to grid
 */

/**
 * Animation configuration
 * @typedef {Object} AnimationConfig
 * @property {boolean} enabled - Whether animations are enabled
 * @property {number} duration - Default animation duration (ms)
 * @property {string} easing - Animation easing function
 * @property {boolean} reduceMotion - Whether to respect prefers-reduced-motion
 */

/**
 * Responsive design configuration
 * @typedef {Object} ResponsiveConfig
 * @property {boolean} enabled - Whether responsive behavior is enabled
 * @property {Object<string, number>} breakpoints - Breakpoint definitions
 * @property {number} breakpoints.mobile - Mobile breakpoint width
 * @property {number} breakpoints.tablet - Tablet breakpoint width
 * @property {number} breakpoints.desktop - Desktop breakpoint width
 * @property {boolean} scaleContent - Whether to scale content on small screens
 */

/**
 * Result of HTML parsing and validation
 * @typedef {Object} ParseResult
 * @property {ParsedElement[]} elements - Successfully parsed elements
 * @property {ValidationError[]} errors - Array of validation errors
 * @property {ValidationWarning[]} warnings - Array of validation warnings
 * @property {boolean} isValid - Whether the parsing was successful
 * @property {Object} statistics - Parsing statistics
 * @property {number} statistics.elementCount - Total number of elements parsed
 * @property {number} statistics.connectionCount - Total number of connections found
 */

/**
 * Validation error information
 * @typedef {Object} ValidationError
 * @property {string} type - Error type identifier
 * @property {string} message - Human-readable error message
 * @property {string} [elementId] - ID of the element causing the error
 * @property {number} [line] - Line number in source HTML (if available)
 * @property {number} [column] - Column number in source HTML (if available)
 * @property {Object} [context] - Additional context information
 */

/**
 * Validation warning information
 * @typedef {Object} ValidationWarning
 * @property {string} type - Warning type identifier
 * @property {string} message - Human-readable warning message
 * @property {string} [elementId] - ID of the element causing the warning
 * @property {string} [suggestion] - Suggested fix for the warning
 */

/**
 * Layout calculation result
 * @typedef {Object} LayoutResult
 * @property {Node[]} nodes - Nodes with calculated positions
 * @property {Edge[]} edges - Edges with calculated paths
 * @property {Object} bounds - Final bounding box of the layout
 * @property {number} bounds.minX - Minimum X coordinate
 * @property {number} bounds.minY - Minimum Y coordinate
 * @property {number} bounds.maxX - Maximum X coordinate
 * @property {number} bounds.maxY - Maximum Y coordinate
 * @property {number} bounds.width - Total width
 * @property {number} bounds.height - Total height
 * @property {Object} center - Center point of the layout
 * @property {number} center.x - X coordinate of center
 * @property {number} center.y - Y coordinate of center
 * @property {boolean} converged - Whether the layout algorithm converged
 * @property {number} iterations - Number of iterations performed
 */

// Export all types for use in other modules
export {};

/**
 * @fileoverview Validation schemas for configuration objects
 * These schemas define the structure and constraints for validating configuration objects
 */

/**
 * Validation schema for DiagramConfig
 * @type {Object}
 */
export const DiagramConfigSchema = {
  type: 'object',
  required: ['layout', 'icons', 'theme'],
  properties: {
    layout: { $ref: '#/definitions/LayoutConfig' },
    icons: { $ref: '#/definitions/IconConfig' },
    theme: { $ref: '#/definitions/ThemeConfig' },
    interaction: { $ref: '#/definitions/InteractionConfig' },
    performance: { $ref: '#/definitions/PerformanceConfig' },
    validation: { $ref: '#/definitions/ValidationConfig' },
    error: { $ref: '#/definitions/ErrorConfig' }
  },
  additionalProperties: false
};

/**
 * Validation schema for LayoutConfig
 * @type {Object}
 */
export const LayoutConfigSchema = {
  type: 'object',
  required: ['forceStrength', 'linkDistance', 'nodeRepulsion'],
  properties: {
    forceStrength: { type: 'number', minimum: 0, maximum: 1 },
    linkDistance: { type: 'number', minimum: 1 },
    nodeRepulsion: { type: 'number', minimum: 0 },
    centerForce: { type: 'number', minimum: 0, maximum: 1 },
    iterations: { type: 'integer', minimum: 1, maximum: 10000 },
    alpha: { type: 'number', minimum: 0, maximum: 1 },
    alphaDecay: { type: 'number', minimum: 0, maximum: 1 },
    velocityDecay: { type: 'number', minimum: 0, maximum: 1 },
    enableCollision: { type: 'boolean' },
    collisionRadius: { type: 'number', minimum: 0 },
    bounds: {
      type: 'object',
      properties: {
        width: { type: 'number', minimum: 1 },
        height: { type: 'number', minimum: 1 }
      },
      required: ['width', 'height']
    }
  },
  additionalProperties: false
};

/**
 * Validation schema for IconConfig
 * @type {Object}
 */
export const IconConfigSchema = {
  type: 'object',
  required: ['fallbackIcon'],
  properties: {
    iconSources: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z][a-zA-Z0-9-_]*$': { type: 'string', format: 'uri' }
      }
    },
    fallbackIcon: { type: 'string', minLength: 1 },
    externalSources: {
      type: 'array',
      items: { type: 'string', format: 'uri' }
    },
    enableCaching: { type: 'boolean' },
    cacheExpiry: { type: 'integer', minimum: 0 },
    loadTimeout: { type: 'integer', minimum: 100 },
    bundledIcons: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z][a-zA-Z0-9-_]*$': { type: 'string' }
      }
    },
    lazyLoading: { type: 'boolean' }
  },
  additionalProperties: false
};

/**
 * Validation schema for ThemeConfig
 * @type {Object}
 */
export const ThemeConfigSchema = {
  type: 'object',
  required: ['nodeStyles', 'edgeStyles', 'colors'],
  properties: {
    nodeStyles: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z][a-zA-Z0-9-_]*$': { $ref: '#/definitions/NodeStyle' }
      }
    },
    edgeStyles: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z][a-zA-Z0-9-_]*$': { $ref: '#/definitions/EdgeStyle' }
      }
    },
    colors: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z][a-zA-Z0-9-_]*$': { 
          type: 'string', 
          pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\\(|^rgba\\(|^hsl\\(|^hsla\\(' 
        }
      }
    },
    fonts: { $ref: '#/definitions/FontConfig' },
    backgroundColor: { 
      type: 'string', 
      pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\\(|^rgba\\(|^hsl\\(|^hsla\\(' 
    },
    grid: { $ref: '#/definitions/GridConfig' },
    animations: { $ref: '#/definitions/AnimationConfig' },
    responsive: { $ref: '#/definitions/ResponsiveConfig' }
  },
  additionalProperties: false
};

/**
 * Validation schema for NodeStyle
 * @type {Object}
 */
export const NodeStyleSchema = {
  type: 'object',
  required: ['fill', 'stroke'],
  properties: {
    fill: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\\(|^rgba\\(' },
    stroke: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\\(|^rgba\\(' },
    strokeWidth: { type: 'number', minimum: 0 },
    textColor: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\\(|^rgba\\(' },
    fontFamily: { type: 'string', minLength: 1 },
    fontSize: { type: 'number', minimum: 1 },
    fontWeight: { type: 'string', enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
    opacity: { type: 'number', minimum: 0, maximum: 1 },
    borderRadius: { type: 'number', minimum: 0 },
    shadowColor: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\\(|^rgba\\(' },
    shadowBlur: { type: 'number', minimum: 0 }
  },
  additionalProperties: false
};

/**
 * Validation schema for EdgeStyle
 * @type {Object}
 */
export const EdgeStyleSchema = {
  type: 'object',
  required: ['stroke'],
  properties: {
    stroke: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\\(|^rgba\\(' },
    strokeWidth: { type: 'number', minimum: 0 },
    strokeDasharray: { type: 'string' },
    opacity: { type: 'number', minimum: 0, maximum: 1 },
    markerEnd: { type: 'string' },
    labelColor: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\\(|^rgba\\(' },
    labelFontFamily: { type: 'string', minLength: 1 },
    labelFontSize: { type: 'number', minimum: 1 }
  },
  additionalProperties: false
};

/**
 * Validation schema for PerformanceConfig
 * @type {Object}
 */
export const PerformanceConfigSchema = {
  type: 'object',
  properties: {
    maxNodes: { type: 'integer', minimum: 1 },
    animationDuration: { type: 'integer', minimum: 0 },
    renderThrottle: { type: 'integer', minimum: 0 },
    lazyLoading: { type: 'boolean' },
    enableVirtualization: { type: 'boolean' },
    viewportBuffer: { type: 'number', minimum: 0 },
    enableWebWorkers: { type: 'boolean' },
    memory: {
      type: 'object',
      properties: {
        maxCacheSize: { type: 'number', minimum: 1 },
        enableGarbageCollection: { type: 'boolean' },
        gcInterval: { type: 'integer', minimum: 1000 },
        maxHistorySize: { type: 'integer', minimum: 0 }
      }
    }
  },
  additionalProperties: false
};

/**
 * Validation schema for InteractionConfig
 * @type {Object}
 */
export const InteractionConfigSchema = {
  type: 'object',
  properties: {
    enableZoom: { type: 'boolean' },
    enablePan: { type: 'boolean' },
    enableTooltips: { type: 'boolean' },
    enableSelection: { type: 'boolean' },
    enableKeyboardNav: { type: 'boolean' },
    zoom: {
      type: 'object',
      properties: {
        minScale: { type: 'number', minimum: 0.1 },
        maxScale: { type: 'number', minimum: 1 },
        scaleStep: { type: 'number', minimum: 0.01 },
        smoothZoom: { type: 'boolean' },
        duration: { type: 'integer', minimum: 0 }
      }
    },
    tooltips: {
      type: 'object',
      properties: {
        delay: { type: 'integer', minimum: 0 },
        duration: { type: 'integer', minimum: 0 },
        backgroundColor: { type: 'string' },
        textColor: { type: 'string' },
        fontSize: { type: 'number', minimum: 1 },
        padding: { type: 'number', minimum: 0 },
        borderRadius: { type: 'number', minimum: 0 },
        followCursor: { type: 'boolean' }
      }
    },
    selection: {
      type: 'object',
      properties: {
        multiSelect: { type: 'boolean' },
        selectionColor: { type: 'string' },
        selectionWidth: { type: 'number', minimum: 0 },
        highlightConnected: { type: 'boolean' }
      }
    }
  },
  additionalProperties: false
};

/**
 * Default configuration values for validation and initialization
 * @type {DiagramConfig}
 */
export const DefaultConfig = {
  layout: {
    forceStrength: 0.3,
    linkDistance: 100,
    nodeRepulsion: 300,
    centerForce: 0.1,
    iterations: 300,
    alpha: 1,
    alphaDecay: 0.0228,
    velocityDecay: 0.4,
    enableCollision: true,
    collisionRadius: 1.5,
    bounds: {
      width: 800,
      height: 600
    }
  },
  icons: {
    iconSources: {},
    fallbackIcon: 'default',
    externalSources: [],
    enableCaching: true,
    cacheExpiry: 3600000, // 1 hour
    loadTimeout: 5000,
    bundledIcons: {},
    lazyLoading: true
  },
  theme: {
    nodeStyles: {
      default: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
        textColor: '#333333',
        fontFamily: 'Arial, sans-serif',
        fontSize: 12,
        fontWeight: 'normal',
        opacity: 1,
        borderRadius: 4
      }
    },
    edgeStyles: {
      default: {
        stroke: '#666666',
        strokeWidth: 1,
        strokeDasharray: 'none',
        opacity: 1,
        markerEnd: 'url(#arrowhead)'
      }
    },
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545'
    },
    fonts: {
      primary: 'Arial, sans-serif',
      secondary: 'Helvetica, sans-serif',
      sizes: {
        small: 10,
        medium: 12,
        large: 16
      },
      weights: {
        normal: 'normal',
        bold: 'bold'
      }
    },
    backgroundColor: '#ffffff',
    animations: {
      enabled: true,
      duration: 300,
      easing: 'ease-in-out',
      reduceMotion: true
    }
  },
  interaction: {
    enableZoom: true,
    enablePan: true,
    enableTooltips: true,
    enableSelection: true,
    enableKeyboardNav: true,
    zoom: {
      minScale: 0.1,
      maxScale: 10,
      scaleStep: 0.1,
      smoothZoom: true,
      duration: 200
    },
    tooltips: {
      delay: 500,
      duration: 0,
      backgroundColor: '#333333',
      textColor: '#ffffff',
      fontSize: 12,
      padding: 8,
      borderRadius: 4,
      followCursor: false
    },
    selection: {
      multiSelect: false,
      selectionColor: '#007bff',
      selectionWidth: 3,
      highlightConnected: true
    }
  },
  performance: {
    maxNodes: 200,
    animationDuration: 300,
    renderThrottle: 16,
    lazyLoading: true,
    enableVirtualization: false,
    viewportBuffer: 100,
    enableWebWorkers: false,
    memory: {
      maxCacheSize: 50,
      enableGarbageCollection: true,
      gcInterval: 30000,
      maxHistorySize: 50
    }
  },
  validation: {
    strictMode: false,
    allowUnknownElements: true,
    validateConnections: true,
    requireUniqueIds: true,
    maxDepth: 10,
    allowedAttributes: [/^[a-zA-Z][a-zA-Z0-9-_]*$/]
  },
  error: {
    throwOnError: false,
    logErrors: true,
    logLevel: 'warn',
    showUserFriendlyMessages: true,
    customMessages: {}
  }
};

/**
 * Utility function to validate configuration objects against their schemas
 * @param {Object} config - Configuration object to validate
 * @param {Object} schema - JSON schema to validate against
 * @returns {ValidationResult} Validation result with errors and warnings
 */
export function validateConfig(config, schema) {
  const errors = [];
  const warnings = [];
  
  // Basic type checking and required field validation
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in config)) {
        errors.push({
          type: 'MISSING_REQUIRED_FIELD',
          message: `Required field '${field}' is missing`,
          field: field
        });
      }
    }
  }
  
  // Property validation
  if (schema.properties) {
    for (const [key, value] of Object.entries(config)) {
      const propSchema = schema.properties[key];
      if (!propSchema && !schema.additionalProperties) {
        warnings.push({
          type: 'UNKNOWN_PROPERTY',
          message: `Unknown property '${key}' will be ignored`,
          field: key
        });
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Utility function to merge configuration with defaults
 * @param {Partial<DiagramConfig>} userConfig - User-provided configuration
 * @param {DiagramConfig} defaultConfig - Default configuration
 * @returns {DiagramConfig} Merged configuration
 */
export function mergeConfig(userConfig = {}, defaultConfig = DefaultConfig) {
  const merged = { ...defaultConfig };
  
  for (const [key, value] of Object.entries(userConfig)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      merged[key] = { ...merged[key], ...value };
    } else {
      merged[key] = value;
    }
  }
  
  return merged;
}