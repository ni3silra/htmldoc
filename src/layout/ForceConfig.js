/**
 * @fileoverview Force parameter management for the layout engine
 * This module provides configuration management and validation for force-directed layout parameters.
 */

import { DefaultConfig, validateConfig, LayoutConfigSchema } from '../types/index.js';

/**
 * ForceConfig class manages force simulation parameters and provides validation
 * and optimization for different diagram sizes and performance requirements.
 */
export class ForceConfig {
  /**
   * Creates a new ForceConfig instance with validated parameters
   * @param {LayoutConfig} config - Layout configuration object
   */
  constructor(config = {}) {
    // Merge with default configuration
    this.config = this._mergeWithDefaults(config);
    
    // Validate the configuration
    const validation = this._validateConfig(this.config);
    if (!validation.isValid) {
      throw new Error(`Invalid force configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    
    // Store original config for reset functionality
    this._originalConfig = { ...this.config };
    
    // Performance optimization flags
    this._isOptimized = false;
    this._nodeCount = 0;
  }

  /**
   * Gets the current force strength parameter
   * Controls the overall intensity of all forces in the simulation
   * @returns {number} Force strength value between 0 and 1
   */
  get forceStrength() {
    return this.config.forceStrength;
  }

  /**
   * Sets the force strength parameter with validation
   * @param {number} value - Force strength value between 0 and 1
   */
  set forceStrength(value) {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new Error('Force strength must be a number between 0 and 1');
    }
    this.config.forceStrength = value;
  }

  /**
   * Gets the desired distance between connected nodes
   * @returns {number} Link distance in pixels
   */
  get linkDistance() {
    return this.config.linkDistance;
  }

  /**
   * Sets the link distance parameter with validation
   * @param {number} value - Link distance in pixels (minimum 1)
   */
  set linkDistance(value) {
    if (typeof value !== 'number' || value < 1) {
      throw new Error('Link distance must be a number greater than 0');
    }
    this.config.linkDistance = value;
  }

  /**
   * Gets the repulsion force between nodes
   * @returns {number} Node repulsion strength
   */
  get nodeRepulsion() {
    return this.config.nodeRepulsion;
  }

  /**
   * Sets the node repulsion parameter with validation
   * @param {number} value - Node repulsion strength (minimum 0)
   */
  set nodeRepulsion(value) {
    if (typeof value !== 'number' || value < 0) {
      throw new Error('Node repulsion must be a non-negative number');
    }
    this.config.nodeRepulsion = value;
  }

  /**
   * Gets the center force that pulls nodes toward the center
   * @returns {number} Center force strength between 0 and 1
   */
  get centerForce() {
    return this.config.centerForce;
  }

  /**
   * Sets the center force parameter with validation
   * @param {number} value - Center force strength between 0 and 1
   */
  set centerForce(value) {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new Error('Center force must be a number between 0 and 1');
    }
    this.config.centerForce = value;
  }

  /**
   * Gets the maximum number of iterations for layout stabilization
   * @returns {number} Maximum iterations
   */
  get iterations() {
    return this.config.iterations;
  }

  /**
   * Sets the maximum iterations parameter with validation
   * @param {number} value - Maximum iterations (minimum 1, maximum 10000)
   */
  set iterations(value) {
    if (typeof value !== 'number' || value < 1 || value > 10000) {
      throw new Error('Iterations must be a number between 1 and 10000');
    }
    this.config.iterations = value;
  }

  /**
   * Gets the initial alpha value for the force simulation
   * Alpha controls the simulation's cooling rate
   * @returns {number} Alpha value between 0 and 1
   */
  get alpha() {
    return this.config.alpha;
  }

  /**
   * Sets the alpha parameter with validation
   * @param {number} value - Alpha value between 0 and 1
   */
  set alpha(value) {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new Error('Alpha must be a number between 0 and 1');
    }
    this.config.alpha = value;
  }

  /**
   * Gets the alpha decay rate per iteration
   * @returns {number} Alpha decay rate between 0 and 1
   */
  get alphaDecay() {
    return this.config.alphaDecay;
  }

  /**
   * Sets the alpha decay parameter with validation
   * @param {number} value - Alpha decay rate between 0 and 1
   */
  set alphaDecay(value) {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new Error('Alpha decay must be a number between 0 and 1');
    }
    this.config.alphaDecay = value;
  }

  /**
   * Gets the velocity decay factor (friction)
   * @returns {number} Velocity decay between 0 and 1
   */
  get velocityDecay() {
    return this.config.velocityDecay;
  }

  /**
   * Sets the velocity decay parameter with validation
   * @param {number} value - Velocity decay between 0 and 1
   */
  set velocityDecay(value) {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new Error('Velocity decay must be a number between 0 and 1');
    }
    this.config.velocityDecay = value;
  }

  /**
   * Gets whether collision detection is enabled
   * @returns {boolean} True if collision detection is enabled
   */
  get enableCollision() {
    return this.config.enableCollision;
  }

  /**
   * Sets the collision detection flag
   * @param {boolean} value - Whether to enable collision detection
   */
  set enableCollision(value) {
    if (typeof value !== 'boolean') {
      throw new Error('Enable collision must be a boolean value');
    }
    this.config.enableCollision = value;
  }

  /**
   * Gets the collision radius multiplier
   * @returns {number} Collision radius multiplier
   */
  get collisionRadius() {
    return this.config.collisionRadius;
  }

  /**
   * Sets the collision radius multiplier with validation
   * @param {number} value - Collision radius multiplier (minimum 0)
   */
  set collisionRadius(value) {
    if (typeof value !== 'number' || value < 0) {
      throw new Error('Collision radius must be a non-negative number');
    }
    this.config.collisionRadius = value;
  }

  /**
   * Gets the layout boundary constraints
   * @returns {Object} Bounds object with width and height
   */
  get bounds() {
    return { ...this.config.bounds };
  }

  /**
   * Sets the layout bounds with validation
   * @param {Object} bounds - Bounds object with width and height properties
   * @param {number} bounds.width - Layout width (minimum 1)
   * @param {number} bounds.height - Layout height (minimum 1)
   */
  set bounds(bounds) {
    if (!bounds || typeof bounds !== 'object') {
      throw new Error('Bounds must be an object with width and height properties');
    }
    if (typeof bounds.width !== 'number' || bounds.width < 1) {
      throw new Error('Bounds width must be a number greater than 0');
    }
    if (typeof bounds.height !== 'number' || bounds.height < 1) {
      throw new Error('Bounds height must be a number greater than 0');
    }
    this.config.bounds = { width: bounds.width, height: bounds.height };
  }

  /**
   * Optimizes force parameters based on the number of nodes in the diagram
   * Automatically adjusts parameters for better performance with large graphs
   * @param {number} nodeCount - Number of nodes in the diagram
   * @returns {ForceConfig} Returns this instance for method chaining
   */
  optimizeForNodeCount(nodeCount) {
    if (typeof nodeCount !== 'number' || nodeCount < 0) {
      throw new Error('Node count must be a non-negative number');
    }

    this._nodeCount = nodeCount;

    // Small diagrams (< 20 nodes): Use default settings for best visual quality
    if (nodeCount < 20) {
      this._resetToDefaults();
      this._isOptimized = false;
      return this;
    }

    // Medium diagrams (20-50 nodes): Slight optimization
    if (nodeCount < 50) {
      this.config.iterations = Math.max(200, this.config.iterations * 0.8);
      this.config.alphaDecay = Math.min(0.05, this.config.alphaDecay * 1.2);
      this._isOptimized = true;
      return this;
    }

    // Large diagrams (50-100 nodes): Moderate optimization
    if (nodeCount < 100) {
      this.config.iterations = Math.max(150, this.config.iterations * 0.6);
      this.config.alphaDecay = Math.min(0.08, this.config.alphaDecay * 1.5);
      this.config.forceStrength = Math.max(0.1, this.config.forceStrength * 0.8);
      this._isOptimized = true;
      return this;
    }

    // Very large diagrams (100+ nodes): Aggressive optimization
    this.config.iterations = Math.max(100, this.config.iterations * 0.4);
    this.config.alphaDecay = Math.min(0.1, this.config.alphaDecay * 2);
    this.config.forceStrength = Math.max(0.05, this.config.forceStrength * 0.6);
    this.config.velocityDecay = Math.min(0.8, this.config.velocityDecay * 1.5);
    this._isOptimized = true;

    return this;
  }

  /**
   * Optimizes force parameters for performance over visual quality
   * Reduces computational complexity for faster rendering
   * @returns {ForceConfig} Returns this instance for method chaining
   */
  optimizeForPerformance() {
    this.config.iterations = Math.min(100, this.config.iterations);
    this.config.alphaDecay = Math.max(0.1, this.config.alphaDecay * 2);
    this.config.forceStrength = Math.max(0.1, this.config.forceStrength * 0.7);
    this.config.enableCollision = false; // Collision detection is expensive
    this._isOptimized = true;
    return this;
  }

  /**
   * Optimizes force parameters for visual quality over performance
   * Increases computational complexity for better-looking layouts
   * @returns {ForceConfig} Returns this instance for method chaining
   */
  optimizeForQuality() {
    this.config.iterations = Math.max(500, this.config.iterations * 1.5);
    this.config.alphaDecay = Math.min(0.01, this.config.alphaDecay * 0.5);
    this.config.forceStrength = Math.min(0.5, this.config.forceStrength * 1.2);
    this.config.enableCollision = true;
    this.config.collisionRadius = Math.max(1.5, this.config.collisionRadius);
    this._isOptimized = true;
    return this;
  }

  /**
   * Resets all parameters to their original values
   * @returns {ForceConfig} Returns this instance for method chaining
   */
  reset() {
    this.config = { ...this._originalConfig };
    this._isOptimized = false;
    this._nodeCount = 0;
    return this;
  }

  /**
   * Creates a copy of this ForceConfig instance
   * @returns {ForceConfig} New ForceConfig instance with the same parameters
   */
  clone() {
    return new ForceConfig(this.config);
  }

  /**
   * Exports the current configuration as a plain object
   * @returns {LayoutConfig} Configuration object
   */
  toObject() {
    return { ...this.config };
  }

  /**
   * Gets performance metrics about the current configuration
   * @returns {Object} Performance metrics object
   */
  getPerformanceMetrics() {
    const complexity = this._calculateComplexity();
    const estimatedTime = this._estimateRenderTime();
    
    return {
      complexity: complexity,
      estimatedRenderTime: estimatedTime,
      isOptimized: this._isOptimized,
      nodeCount: this._nodeCount,
      recommendations: this._getRecommendations()
    };
  }

  /**
   * Merges user configuration with default values
   * @private
   * @param {LayoutConfig} userConfig - User-provided configuration
   * @returns {LayoutConfig} Merged configuration
   */
  _mergeWithDefaults(userConfig) {
    const defaults = DefaultConfig.layout;
    const merged = { ...defaults };

    // Deep merge bounds object
    if (userConfig.bounds) {
      merged.bounds = { ...defaults.bounds, ...userConfig.bounds };
    }

    // Merge other properties
    for (const [key, value] of Object.entries(userConfig)) {
      if (key !== 'bounds') {
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * Validates the configuration against the schema
   * @private
   * @param {LayoutConfig} config - Configuration to validate
   * @returns {ValidationResult} Validation result
   */
  _validateConfig(config) {
    return validateConfig(config, LayoutConfigSchema);
  }

  /**
   * Resets configuration to default values
   * @private
   */
  _resetToDefaults() {
    const defaults = DefaultConfig.layout;
    for (const [key, value] of Object.entries(defaults)) {
      if (key === 'bounds') {
        this.config.bounds = { ...value };
      } else {
        this.config[key] = value;
      }
    }
  }

  /**
   * Calculates the computational complexity of the current configuration
   * @private
   * @returns {string} Complexity level ('low', 'medium', 'high')
   */
  _calculateComplexity() {
    let score = 0;
    
    // Factor in iterations
    score += this.config.iterations / 100;
    
    // Factor in force strength
    score += this.config.forceStrength * 10;
    
    // Factor in collision detection
    if (this.config.enableCollision) {
      score += 5;
    }
    
    // Factor in alpha decay (lower decay = more iterations)
    score += (1 - this.config.alphaDecay) * 10;

    if (score < 5) return 'low';
    if (score < 15) return 'medium';
    return 'high';
  }

  /**
   * Estimates render time based on configuration and node count
   * @private
   * @returns {number} Estimated render time in milliseconds
   */
  _estimateRenderTime() {
    const baseTime = 50; // Base time for minimal diagram
    const nodeMultiplier = this._nodeCount * 2;
    const iterationMultiplier = this.config.iterations * 0.5;
    const collisionPenalty = this.config.enableCollision ? this._nodeCount * 0.5 : 0;
    
    return Math.round(baseTime + nodeMultiplier + iterationMultiplier + collisionPenalty);
  }

  /**
   * Generates performance recommendations based on current configuration
   * @private
   * @returns {string[]} Array of recommendation strings
   */
  _getRecommendations() {
    const recommendations = [];
    
    if (this._nodeCount > 50 && !this._isOptimized) {
      recommendations.push('Consider optimizing for node count to improve performance');
    }
    
    if (this.config.iterations > 300 && this._nodeCount > 30) {
      recommendations.push('Reduce iterations for better performance with large diagrams');
    }
    
    if (this.config.enableCollision && this._nodeCount > 100) {
      recommendations.push('Disable collision detection for better performance with very large diagrams');
    }
    
    if (this.config.alphaDecay < 0.02) {
      recommendations.push('Increase alpha decay to reduce convergence time');
    }
    
    return recommendations;
  }
}

/**
 * Factory function to create optimized ForceConfig instances for common use cases
 */
export class ForceConfigFactory {
  /**
   * Creates a ForceConfig optimized for small diagrams (< 20 nodes)
   * @param {Partial<LayoutConfig>} overrides - Optional parameter overrides
   * @returns {ForceConfig} Optimized ForceConfig instance
   */
  static createForSmallDiagram(overrides = {}) {
    const config = new ForceConfig({
      forceStrength: 0.4,
      linkDistance: 80,
      nodeRepulsion: 200,
      centerForce: 0.15,
      iterations: 400,
      alphaDecay: 0.02,
      enableCollision: true,
      collisionRadius: 2,
      ...overrides
    });
    return config;
  }

  /**
   * Creates a ForceConfig optimized for medium diagrams (20-50 nodes)
   * @param {Partial<LayoutConfig>} overrides - Optional parameter overrides
   * @returns {ForceConfig} Optimized ForceConfig instance
   */
  static createForMediumDiagram(overrides = {}) {
    const config = new ForceConfig({
      forceStrength: 0.3,
      linkDistance: 100,
      nodeRepulsion: 300,
      centerForce: 0.1,
      iterations: 250,
      alphaDecay: 0.03,
      enableCollision: true,
      collisionRadius: 1.5,
      ...overrides
    });
    return config;
  }

  /**
   * Creates a ForceConfig optimized for large diagrams (50+ nodes)
   * @param {Partial<LayoutConfig>} overrides - Optional parameter overrides
   * @returns {ForceConfig} Optimized ForceConfig instance
   */
  static createForLargeDiagram(overrides = {}) {
    const config = new ForceConfig({
      forceStrength: 0.2,
      linkDistance: 120,
      nodeRepulsion: 400,
      centerForce: 0.05,
      iterations: 150,
      alphaDecay: 0.05,
      enableCollision: false,
      velocityDecay: 0.6,
      ...overrides
    });
    return config;
  }

  /**
   * Creates a ForceConfig optimized for performance over visual quality
   * @param {Partial<LayoutConfig>} overrides - Optional parameter overrides
   * @returns {ForceConfig} Performance-optimized ForceConfig instance
   */
  static createForPerformance(overrides = {}) {
    const config = new ForceConfig({
      forceStrength: 0.2,
      linkDistance: 100,
      nodeRepulsion: 250,
      centerForce: 0.1,
      iterations: 100,
      alphaDecay: 0.1,
      enableCollision: false,
      velocityDecay: 0.7,
      ...overrides
    });
    return config;
  }

  /**
   * Creates a ForceConfig optimized for visual quality over performance
   * @param {Partial<LayoutConfig>} overrides - Optional parameter overrides
   * @returns {ForceConfig} Quality-optimized ForceConfig instance
   */
  static createForQuality(overrides = {}) {
    const config = new ForceConfig({
      forceStrength: 0.4,
      linkDistance: 90,
      nodeRepulsion: 350,
      centerForce: 0.12,
      iterations: 500,
      alphaDecay: 0.015,
      enableCollision: true,
      collisionRadius: 2,
      velocityDecay: 0.3,
      ...overrides
    });
    return config;
  }
}

export default ForceConfig;