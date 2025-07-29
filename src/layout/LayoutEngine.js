/**
 * @fileoverview Force-directed layout engine using D3.js force simulation
 * This module provides the core layout calculation functionality for positioning nodes
 * in architectural diagrams using physics-based force simulation algorithms.
 */

import { 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide,
  forceX,
  forceY
} from 'd3-force';
import { ForceConfig, DEFAULT_FORCE_CONFIG } from './ForceConfig.js';

/**
 * Force-directed layout engine class
 * Manages the physics simulation for positioning nodes and calculating optimal layouts
 */
export class LayoutEngine {
  /**
   * Creates a new LayoutEngine instance
   * @param {Partial<LayoutConfig>} config - Layout configuration parameters
   */
  constructor(config = {}) {
    this.forceConfig = new ForceConfig(config);
    this.simulation = null;
    this.isRunning = false;
    this.convergenceThreshold = 0.01;
    this.stabilizationTimeout = 10000; // 10 seconds max
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
  }

  /**
   * Calculates layout positions for nodes and edges using force-directed algorithms
   * This is the main entry point for layout calculation
   * @param {GraphData} graphData - Graph data containing nodes and edges
   * @returns {Promise<LayoutResult>} Promise resolving to layout result with positioned nodes
   */
  async calculateLayout(graphData) {
    try {
      // Validate input data
      this.validateGraphData(graphData);
      
      // Prepare nodes and edges for simulation
      const simulationNodes = this.prepareNodes(graphData.nodes);
      const simulationEdges = this.prepareEdges(graphData.edges, simulationNodes);
      
      // Configure and initialize the force simulation
      this.configureForces(simulationNodes, simulationEdges);
      
      // Run the simulation until stabilization
      const result = await this.stabilizeLayout();
      
      // Calculate final bounds and center
      const bounds = this.calculateBounds(result.nodes);
      const center = this.calculateCenter(bounds);
      
      return {
        nodes: result.nodes,
        edges: this.updateEdgePositions(simulationEdges, result.nodes),
        bounds,
        center,
        converged: result.converged,
        iterations: result.iterations
      };
    } catch (error) {
      if (this.onError) {
        this.onError(error);
      }
      throw new Error(`Layout calculation failed: ${error.message}`);
    }
  }

  /**
   * Configures the D3 force simulation with appropriate forces
   * Sets up link, charge, center, and collision forces based on configuration
   * @param {Node[]} nodes - Array of nodes for the simulation
   * @param {Edge[]} edges - Array of edges for the simulation
   */
  configureForces(nodes, edges) {
    const config = this.forceConfig.getConfig();
    
    // Create the force simulation with nodes
    this.simulation = forceSimulation(nodes);
    
    // Configure link force for edge connections
    // This force maintains desired distances between connected nodes
    const linkForce = forceLink(edges)
      .id(d => d.id)
      .distance(d => {
        // Allow per-edge distance customization, fallback to global config
        return d.distance || config.linkDistance;
      })
      .strength(d => {
        // Stronger links for hierarchy relationships, weaker for loose connections
        const baseStrength = config.forceStrength;
        if (d.type === 'hierarchy') {
          return baseStrength * 1.5;
        } else if (d.type === 'dependency') {
          return baseStrength * 0.7;
        }
        return baseStrength;
      });
    
    this.simulation.force('link', linkForce);
    
    // Configure many-body force for node repulsion
    // This prevents nodes from overlapping and creates natural spacing
    const chargeForce = forceManyBody()
      .strength(d => {
        // Larger nodes have stronger repulsion to maintain visual hierarchy
        const baseStrength = -config.nodeRepulsion;
        const sizeMultiplier = d.size ? (d.size.width + d.size.height) / 100 : 1;
        return baseStrength * sizeMultiplier;
      })
      .distanceMin(10) // Minimum distance for force calculation
      .distanceMax(300); // Maximum distance for performance optimization
    
    this.simulation.force('charge', chargeForce);
    
    // Configure center force to prevent nodes from drifting away
    // This keeps the diagram centered within the viewport
    if (config.centerForce > 0) {
      const centerX = config.bounds ? config.bounds.width / 2 : 400;
      const centerY = config.bounds ? config.bounds.height / 2 : 300;
      
      this.simulation.force('center', forceCenter(centerX, centerY)
        .strength(config.centerForce));
    }
    
    // Configure collision detection to prevent node overlaps
    // This ensures nodes don't visually overlap while maintaining readability
    if (config.enableCollision) {
      const collisionForce = forceCollide()
        .radius(d => {
          // Calculate collision radius based on node size
          const baseRadius = d.size ? 
            Math.max(d.size.width, d.size.height) / 2 : 20;
          return baseRadius * config.collisionRadius;
        })
        .strength(0.8) // Strong collision avoidance
        .iterations(2); // Multiple iterations for better collision resolution
      
      this.simulation.force('collision', collisionForce);
    }
    
    // Add boundary forces if bounds are specified
    // These forces keep nodes within the specified layout area
    if (config.bounds) {
      const { width, height } = config.bounds;
      const padding = 50; // Padding from edges
      
      // X-axis boundary force
      this.simulation.force('boundaryX', forceX()
        .x(d => Math.max(padding, Math.min(width - padding, d.x || width / 2)))
        .strength(0.1));
      
      // Y-axis boundary force
      this.simulation.force('boundaryY', forceY()
        .y(d => Math.max(padding, Math.min(height - padding, d.y || height / 2)))
        .strength(0.1));
    }
    
    // Set simulation parameters
    this.simulation
      .alpha(config.alpha) // Initial energy of the simulation
      .alphaDecay(config.alphaDecay) // Rate of energy decay
      .velocityDecay(config.velocityDecay); // Friction/damping factor
  }

  /**
   * Runs the force simulation until it stabilizes or times out
   * Monitors convergence and provides progress updates
   * @returns {Promise<Object>} Promise resolving to stabilization result
   */
  async stabilizeLayout() {
    return new Promise((resolve, reject) => {
      if (!this.simulation) {
        reject(new Error('Simulation not initialized'));
        return;
      }

      const config = this.forceConfig.getConfig();
      let iterations = 0;
      let lastAlpha = this.simulation.alpha();
      let stableIterations = 0;
      const maxIterations = config.iterations;
      
      // Set up timeout to prevent infinite loops
      const timeout = setTimeout(() => {
        this.isRunning = false;
        this.simulation.stop();
        reject(new Error(`Layout stabilization timed out after ${this.stabilizationTimeout}ms`));
      }, this.stabilizationTimeout);

      this.isRunning = true;

      // Simulation tick handler
      this.simulation.on('tick', () => {
        iterations++;
        const currentAlpha = this.simulation.alpha();
        
        // Check for convergence
        // Convergence is detected when alpha changes very little between iterations
        const alphaChange = Math.abs(currentAlpha - lastAlpha);
        if (alphaChange < this.convergenceThreshold) {
          stableIterations++;
        } else {
          stableIterations = 0;
        }
        
        lastAlpha = currentAlpha;
        
        // Report progress if callback is provided
        if (this.onProgress) {
          this.onProgress({
            iterations,
            alpha: currentAlpha,
            progress: Math.min(iterations / maxIterations, 1),
            converged: stableIterations >= 5
          });
        }
        
        // Check termination conditions
        const shouldStop = 
          iterations >= maxIterations || // Maximum iterations reached
          stableIterations >= 5 || // Stable for multiple iterations
          currentAlpha < 0.001; // Alpha below minimum threshold
        
        if (shouldStop) {
          clearTimeout(timeout);
          this.isRunning = false;
          this.simulation.stop();
          
          resolve({
            nodes: this.simulation.nodes(),
            converged: stableIterations >= 5,
            iterations,
            finalAlpha: currentAlpha
          });
        }
      });

      // Handle simulation end
      this.simulation.on('end', () => {
        clearTimeout(timeout);
        this.isRunning = false;
        
        if (this.onComplete) {
          this.onComplete({
            iterations,
            converged: stableIterations >= 5
          });
        }
      });

      // Start the simulation
      this.simulation.restart();
    });
  }

  /**
   * Validates input graph data for layout calculation
   * @param {GraphData} graphData - Graph data to validate
   * @throws {Error} If graph data is invalid
   */
  validateGraphData(graphData) {
    if (!graphData) {
      throw new Error('Graph data is required');
    }
    
    if (!Array.isArray(graphData.nodes)) {
      throw new Error('Graph data must include nodes array');
    }
    
    if (!Array.isArray(graphData.edges)) {
      throw new Error('Graph data must include edges array');
    }
    
    if (graphData.nodes.length === 0) {
      throw new Error('Graph must contain at least one node');
    }
    
    // Validate node structure
    for (const node of graphData.nodes) {
      if (!node.id) {
        throw new Error('All nodes must have an id property');
      }
    }
    
    // Validate edge structure and references
    const nodeIds = new Set(graphData.nodes.map(n => n.id));
    for (const edge of graphData.edges) {
      if (!edge.source || !edge.target) {
        throw new Error('All edges must have source and target properties');
      }
      
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        throw new Error(`Edge references non-existent node: ${edge.source} -> ${edge.target}`);
      }
    }
  }

  /**
   * Prepares nodes for D3 force simulation
   * Adds necessary properties and initializes positions
   * @param {Node[]} nodes - Original nodes array
   * @returns {Node[]} Prepared nodes for simulation
   */
  prepareNodes(nodes) {
    const config = this.forceConfig.getConfig();
    const centerX = config.bounds ? config.bounds.width / 2 : 400;
    const centerY = config.bounds ? config.bounds.height / 2 : 300;
    
    return nodes.map(node => ({
      ...node,
      // Initialize position if not already set
      x: node.position?.x ?? centerX + (Math.random() - 0.5) * 100,
      y: node.position?.y ?? centerY + (Math.random() - 0.5) * 100,
      // Initialize velocity
      vx: 0,
      vy: 0,
      // Set default size if not provided
      size: node.size || { width: 40, height: 40 },
      // Mark fixed nodes (won't move during simulation)
      fx: node.fixed ? node.position?.x : null,
      fy: node.fixed ? node.position?.y : null
    }));
  }

  /**
   * Prepares edges for D3 force simulation
   * Converts string references to node objects
   * @param {Edge[]} edges - Original edges array
   * @param {Node[]} nodes - Prepared nodes array
   * @returns {Edge[]} Prepared edges for simulation
   */
  prepareEdges(edges, nodes) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    return edges.map(edge => ({
      ...edge,
      source: nodeMap.get(edge.source),
      target: nodeMap.get(edge.target)
    })).filter(edge => edge.source && edge.target);
  }

  /**
   * Updates edge positions based on final node positions
   * @param {Edge[]} edges - Simulation edges
   * @param {Node[]} nodes - Final positioned nodes
   * @returns {Edge[]} Edges with updated position information
   */
  updateEdgePositions(edges, nodes) {
    return edges.map(edge => ({
      ...edge,
      sourcePosition: {
        x: edge.source.x,
        y: edge.source.y
      },
      targetPosition: {
        x: edge.target.x,
        y: edge.target.y
      }
    }));
  }

  /**
   * Calculates the bounding box of all positioned nodes
   * @param {Node[]} nodes - Positioned nodes
   * @returns {Object} Bounding box with min/max coordinates and dimensions
   */
  calculateBounds(nodes) {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const node of nodes) {
      const nodeWidth = node.size?.width || 40;
      const nodeHeight = node.size?.height || 40;
      const halfWidth = nodeWidth / 2;
      const halfHeight = nodeHeight / 2;
      
      minX = Math.min(minX, node.x - halfWidth);
      minY = Math.min(minY, node.y - halfHeight);
      maxX = Math.max(maxX, node.x + halfWidth);
      maxY = Math.max(maxY, node.y + halfHeight);
    }
    
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Calculates the center point of the layout
   * @param {Object} bounds - Bounding box of the layout
   * @returns {Object} Center coordinates
   */
  calculateCenter(bounds) {
    return {
      x: bounds.minX + bounds.width / 2,
      y: bounds.minY + bounds.height / 2
    };
  }

  /**
   * Updates the layout configuration
   * @param {Partial<LayoutConfig>} newConfig - New configuration parameters
   */
  updateConfig(newConfig) {
    this.forceConfig.updateConfig(newConfig);
  }

  /**
   * Gets the current layout configuration
   * @returns {LayoutConfig} Current configuration
   */
  getConfig() {
    return this.forceConfig.getConfig();
  }

  /**
   * Stops the current simulation if running
   */
  stop() {
    if (this.simulation && this.isRunning) {
      this.simulation.stop();
      this.isRunning = false;
    }
  }

  /**
   * Restarts the simulation with current configuration
   */
  restart() {
    if (this.simulation) {
      this.simulation.restart();
      this.isRunning = true;
    }
  }

  /**
   * Sets progress callback for layout calculation
   * @param {Function} callback - Progress callback function
   */
  onProgressCallback(callback) {
    this.onProgress = callback;
  }

  /**
   * Sets completion callback for layout calculation
   * @param {Function} callback - Completion callback function
   */
  onCompleteCallback(callback) {
    this.onComplete = callback;
  }

  /**
   * Sets error callback for layout calculation
   * @param {Function} callback - Error callback function
   */
  onErrorCallback(callback) {
    this.onError = callback;
  }

  /**
   * Checks if the layout engine is currently running
   * @returns {boolean} True if simulation is running
   */
  isLayoutRunning() {
    return this.isRunning;
  }

  /**
   * Gets statistics about the current simulation
   * @returns {Object} Simulation statistics
   */
  getSimulationStats() {
    if (!this.simulation) {
      return null;
    }
    
    return {
      alpha: this.simulation.alpha(),
      nodes: this.simulation.nodes().length,
      forces: Object.keys(this.simulation._forces || {}),
      isRunning: this.isRunning
    };
  }
}

/**
 * Utility function to create a layout engine with preset configuration
 * @param {string} preset - Preset name (small, medium, large, etc.)
 * @param {Partial<LayoutConfig>} overrides - Configuration overrides
 * @returns {LayoutEngine} New layout engine instance
 */
export function createLayoutEngine(preset = 'medium', overrides = {}) {
  const config = new ForceConfig();
  config.applyPreset(preset);
  if (Object.keys(overrides).length > 0) {
    config.updateConfig(overrides);
  }
  return new LayoutEngine(config.getConfig());
}

export default LayoutEngine;