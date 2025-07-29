/**
 * @fileoverview Force parameter management for the layout engine
 * This module provides configuration management and validation for force-directed layout parameters.
 * It includes default configurations, parameter validation, and utilities for force parameter optimization.
 */

import { DefaultConfig } from '../types/index.js';

/**
 * Default force configuration parameters optimized for typical architectural diagrams
 * These values provide a good balance between layout quality and performance
 * @type {LayoutConfig}
 */
export const DEFAULT_FORCE_CONFIG = {
  // Overall strength of all forces (0-1). Lower values create gentler layouts
  forceStrength: 0.3,
  
  // Desired distance between connected nodes. Affects how spread out connected elements are
  linkDistance: 100,
  
  // Repulsion force between nodes. Higher values prevent overlapping but may spread nodes too far
  nodeRepulsion: 300,
  
  // Force pulling nodes toward the center. Prevents nodes from drifting to edges
  centerForce: 0.1,
  
  // Maximum iterations for layout stabilization. Higher values improve quality but increase computation time
  iterations: 300,
  
  // Initial alpha value for force simulation. Controls the initial "heat" of the simulation
  alpha: 1.0,
  
  // Rate of alpha decay per iteration. Controls how quickly the simulation cools down
  alphaDecay: 0.0228,
  
  // Velocity decay factor (friction). Higher values slow down node movement more quickly
  velocityDecay: 0.4,
  
  // Whether to prevent node overlaps using collision detection
  enableCollision: true,
  
  // Collision detection radius multiplier. Larger values create more spacing between nodes
  collisionRadius: 1.5,
  
  // Layout boundary constraints
  bounds: {
    width: 800,
    height: 600
  }
};

/**
 * Predefined force configurations for different diagram types and sizes
 * These configurations are optimized for specific use cases
 */
export const FORCE_PRESETS = {
  /**
   * Configuration optimized for small diagrams (< 20 nodes)
   * Uses stronger forces for tighter, more organized layouts
   */
  small: {
    ...DEFAULT_FORCE_CONFIG,
    forceStrength: 0.5,
    linkDistance: 80,
    nodeRepulsion: 200,
    centerForce: 0.2,
    iterations: 200,
    alphaDecay: 0.05
  },

  /**
   * Configuration optimized for medium diagrams (20-50 nodes)
   * Balanced approach between organization and performance
   */
  medium: {
    ...DEFAULT_FORCE_CONFIG,
    forceStrength: 0.3,
    linkDistance: 100,
    nodeRepulsion: 300,
    centerForce: 0.1,
    iterations: 300,
    alphaDecay: 0.0228
  },

  /**
   * Configuration optimized for large diagrams (50+ nodes)
   * Reduced force strength and iterations for better performance
   */
  large: {
    ...DEFAULT_FORCE_CONFIG,
    forceStrength: 0.2,
    linkDistance: 120,
    nodeRepulsion: 400,
    centerForce: 0.05,
    iterations: 200,
    alphaDecay: 0.01,
    velocityDecay: 0.6
  },

  /**
   * Configuration for hierarchical diagrams with clear parent-child relationships
   * Uses stronger center force and specific link distances
   */
  hierarchical: {
    ...DEFAULT_FORCE_CONFIG,
    forceStrength: 0.4,
    linkDistance: 150,
    nodeRepulsion: 250,
    centerForce: 0.3,
    iterations: 400,
    enableCollision: true,
    collisionRadius: 2.0
  },

  /**
   * Configuration for dense network diagrams with many connections
   * Optimized for readability in highly connected graphs
   */
  network: {
    ...DEFAULT_FORCE_CONFIG,
    forceStrength: 0.25,
    linkDistance: 80,
    nodeRepulsion: 500,
    centerForce: 0.05,
    iterations: 500,
    velocityDecay: 0.3,
    collisionRadius: 1.8
  },

  /**
   * High-performance configuration for real-time or interactive layouts
   * Sacrifices some layout quality for faster computation
   */
  performance: {
    ...DEFAULT_FORCE_CONFIG,
    forceStrength: 0.2,
    linkDistance: 100,
    nodeRepulsion: 300,
    centerForce: 0.1,
    iterations: 100,
    alphaDecay: 0.1,
    velocityDecay: 0.8
  }
};

/**
 * Force configuration manager class
 * Handles validation, optimization, and dynamic adjustment of force parameters
 */
export class ForceConfig {
  /**
   * Creates a new ForceConfig instance
   * @param {Partial<LayoutConfig>} config - Initial configuration parameters
   */
  constructor(config = {}) {
    this.config = this.validateAndMerge(config);
    this.originalConfig = { ...this.config };
  }

  /**
   * Validates and merges user configuration with defaults
   * @param {Partial<LayoutConfig>} userConfig - User-provided configuration
   * @returns {LayoutConfig} Validated and merged configuration
   */
  validateAndMerge(userConfig) {
    const merged = { ...DEFAULT_FORCE_CONFIG, ...userConfig };
    
    // Validate numeric ranges
    merged.forceStrength = this.clamp(merged.forceStrength, 0, 1);
    merged.linkDistance = Math.max(1, merged.linkDistance);
    merged.nodeRepulsion = Math.max(0, merged.nodeRepulsion);
    merged.centerForce = this.clamp(merged.centerForce, 0, 1);
    merged.iterations = this.clamp(merged.iterations, 1, 10000);
    merged.alpha = this.clamp(merged.alpha, 0, 1);
    merged.alphaDecay = this.clamp(merged.alphaDecay, 0, 1);
    merged.velocityDecay = this.clamp(merged.velocityDecay, 0, 1);
    merged.collisionRadius = Math.max(0, merged.collisionRadius);

    // Validate bounds
    if (merged.bounds) {
      merged.bounds.width = Math.max(1, merged.bounds.width);
      merged.bounds.height = Math.max(1, merged.bounds.height);
    }

    return merged;
  }

  /**
   * Utility function to clamp a value between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @returns {number} Clamped value
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Gets the current configuration
   * @returns {LayoutConfig} Current force configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Updates the configuration with new parameters
   * @param {Partial<LayoutConfig>} updates - Configuration updates
   * @returns {LayoutConfig} Updated configuration
   */
  updateConfig(updates) {
    this.config = this.validateAndMerge({ ...this.config, ...updates });
    return this.getConfig();
  }

  /**
   * Applies a predefined configuration preset
   * @param {keyof FORCE_PRESETS} presetName - Name of the preset to apply
   * @returns {LayoutConfig} Applied configuration
   * @throws {Error} If preset name is invalid
   */
  applyPreset(presetName) {
    if (!FORCE_PRESETS[presetName]) {
      throw new Error(`Unknown force preset: ${presetName}. Available presets: ${Object.keys(FORCE_PRESETS).join(', ')}`);
    }
    
    this.config = { ...FORCE_PRESETS[presetName] };
    return this.getConfig();
  }

  /**
   * Automatically optimizes configuration based on graph characteristics
   * @param {Object} graphStats - Statistics about the graph
   * @param {number} graphStats.nodeCount - Number of nodes in the graph
   * @param {number} graphStats.edgeCount - Number of edges in the graph
   * @param {number} graphStats.avgDegree - Average node degree
   * @param {boolean} graphStats.isHierarchical - Whether the graph has hierarchical structure
   * @returns {LayoutConfig} Optimized configuration
   */
  optimizeForGraph(graphStats) {
    const { nodeCount, edgeCount, avgDegree, isHierarchical } = graphStats;
    
    // Start with appropriate size-based preset
    let basePreset;
    if (nodeCount < 20) {
      basePreset = 'small';
    } else if (nodeCount < 50) {
      basePreset = 'medium';
    } else {
      basePreset = 'large';
    }

    // Apply hierarchical preset if graph is hierarchical
    if (isHierarchical) {
      basePreset = 'hierarchical';
    }

    // Apply network preset for highly connected graphs
    if (avgDegree > 4) {
      basePreset = 'network';
    }

    this.applyPreset(basePreset);

    // Fine-tune based on specific characteristics
    const adjustments = {};

    // Adjust for node density
    const density = edgeCount / (nodeCount * (nodeCount - 1) / 2);
    if (density > 0.3) {
      // High density - increase repulsion and reduce link distance
      adjustments.nodeRepulsion = this.config.nodeRepulsion * 1.2;
      adjustments.linkDistance = this.config.linkDistance * 0.9;
    } else if (density < 0.1) {
      // Low density - reduce repulsion and increase link distance
      adjustments.nodeRepulsion = this.config.nodeRepulsion * 0.8;
      adjustments.linkDistance = this.config.linkDistance * 1.1;
    }

    // Adjust iterations based on complexity
    const complexity = nodeCount + edgeCount * 0.5;
    if (complexity > 200) {
      adjustments.iterations = Math.max(100, this.config.iterations * 0.7);
      adjustments.alphaDecay = Math.min(0.1, this.config.alphaDecay * 1.5);
    }

    // Apply adjustments
    if (Object.keys(adjustments).length > 0) {
      this.updateConfig(adjustments);
    }

    return this.getConfig();
  }

  /**
   * Resets configuration to original values
   * @returns {LayoutConfig} Reset configuration
   */
  reset() {
    this.config = { ...this.originalConfig };
    return this.getConfig();
  }

  /**
   * Resets configuration to default values
   * @returns {LayoutConfig} Default configuration
   */
  resetToDefaults() {
    this.config = { ...DEFAULT_FORCE_CONFIG };
    this.originalConfig = { ...this.config };
    return this.getConfig();
  }

  /**
   * Creates a configuration optimized for performance
   * Reduces iterations and force strength for faster computation
   * @returns {LayoutConfig} Performance-optimized configuration
   */
  createPerformanceConfig() {
    return {
      ...this.config,
      iterations: Math.min(100, this.config.iterations),
      alphaDecay: Math.max(0.05, this.config.alphaDecay * 2),
      forceStrength: this.config.forceStrength * 0.8
    };
  }

  /**
   * Creates a configuration optimized for quality
   * Increases iterations and fine-tunes forces for better layouts
   * @returns {LayoutConfig} Quality-optimized configuration
   */
  createQualityConfig() {
    return {
      ...this.config,
      iterations: Math.max(300, this.config.iterations * 1.5),
      alphaDecay: Math.min(0.01, this.config.alphaDecay * 0.5),
      forceStrength: Math.min(0.5, this.config.forceStrength * 1.2)
    };
  }

  /**
   * Validates a configuration object
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result with errors and warnings
   */
  static validate(config) {
    const errors = [];
    const warnings = [];

    // Check required numeric properties
    const numericProps = [
      'forceStrength', 'linkDistance', 'nodeRepulsion', 'centerForce',
      'iterations', 'alpha', 'alphaDecay', 'velocityDecay', 'collisionRadius'
    ];

    for (const prop of numericProps) {
      if (config[prop] !== undefined) {
        if (typeof config[prop] !== 'number' || isNaN(config[prop])) {
          errors.push(`${prop} must be a valid number`);
        }
      }
    }

    // Check value ranges
    if (config.forceStrength !== undefined && (config.forceStrength < 0 || config.forceStrength > 1)) {
      warnings.push('forceStrength should be between 0 and 1');
    }

    if (config.linkDistance !== undefined && config.linkDistance < 1) {
      warnings.push('linkDistance should be at least 1');
    }

    if (config.iterations !== undefined && (config.iterations < 1 || config.iterations > 10000)) {
      warnings.push('iterations should be between 1 and 10000');
    }

    // Check bounds
    if (config.bounds) {
      if (!config.bounds.width || !config.bounds.height) {
        errors.push('bounds must include width and height');
      }
      if (config.bounds.width < 1 || config.bounds.height < 1) {
        errors.push('bounds width and height must be at least 1');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Utility function to create a force configuration from a preset
 * @param {keyof FORCE_PRESETS} presetName - Name of the preset
 * @param {Partial<LayoutConfig>} overrides - Optional configuration overrides
 * @returns {ForceConfig} New ForceConfig instance
 */
export function createForceConfig(presetName = 'medium', overrides = {}) {
  const config = new ForceConfig();
  config.applyPreset(presetName);
  if (Object.keys(overrides).length > 0) {
    config.updateConfig(overrides);
  }
  return config;
}

/**
 * Utility function to get recommended configuration based on graph size
 * @param {number} nodeCount - Number of nodes in the graph
 * @returns {LayoutConfig} Recommended configuration
 */
export function getRecommendedConfig(nodeCount) {
  if (nodeCount < 20) {
    return FORCE_PRESETS.small;
  } else if (nodeCount < 50) {
    return FORCE_PRESETS.medium;
  } else {
    return FORCE_PRESETS.large;
  }
}

export default ForceConfig;