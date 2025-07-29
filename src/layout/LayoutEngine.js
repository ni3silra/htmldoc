/**
 * @fileoverview Force-directed layout engine with D3.js integration
 * This module implements a sophisticated force-directed graph layout system using D3.js force simulation.
 * It provides automatic node positioning, collision detection, and convergence optimization.
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
import { ForceConfig } from './ForceConfig.js';

/**
 * LayoutEngine class implements force-directed graph layout using D3.js force simulation.
 * It automatically positions nodes and edges in a visually appealing and readable manner.
 */
export class LayoutEngine {
  /**
   * Creates a new LayoutEngine instance with the specified configuration
   * @param {LayoutConfig|ForceConfig} config - Layout configuration object or ForceConfig instance
   */
  constructor(config = {}) {
    // Initialize force configuration
    this.forceConfig = config instanceof ForceConfig ? config : new ForceConfig(config);
    
    // D3 force simulation instance
    this.simulation = null;
    
    // Layout state tracking
    this.isRunning = false;
    this.isStabilized = false;
    this.currentIteration = 0;
    this.convergenceThreshold = 0.01;
    this.lastAlpha = 1;
    
    // Performance monitoring
    this.startTime = 0;
    this.endTime = 0;
    this.performanceMetrics = {
      totalTime: 0,
      iterations: 0,
      averageAlpha: 0,
      converged: false
    };
    
    // Event callbacks
    this.onTick = null;
    this.onEnd = null;
    this.onProgress = null;
    
    // Layout bounds and centering
    this.bounds = { ...this.forceConfig.bounds };
    this.center = { 
      x: this.bounds.width / 2, 
      y: this.bounds.height / 2 
    };
    
    // Node and edge data references
    this.nodes = [];
    this.edges = [];
    
    // Timeout handling for stabilization
    this.stabilizationTimeout = null;
    this.maxStabilizationTime = 30000; // 30 seconds maximum
  }

  /**
   * Calculates the optimal layout for the given graph data using force-directed algorithms.
   * This is the main entry point for layout computation.
   * 
   * The algorithm works by:
   * 1. Setting up D3 force simulation with configured forces
   * 2. Running the simulation until convergence or timeout
   * 3. Returning positioned nodes and edges with bounds information
   * 
   * @param {GraphData} graphData - Graph data containing nodes and edges
   * @returns {Promise<LayoutResult>} Promise resolving to layout result with positioned elements
   */
  async calculateLayout(graphData) {
    if (!graphData || !graphData.nodes || !graphData.edges) {
      throw new Error('Invalid graph data: must contain nodes and edges arrays');
    }

    // Validate and prepare data
    this._validateGraphData(graphData);
    this._prepareData(graphData);
    
    // Optimize configuration based on graph size
    this.forceConfig.optimizeForNodeCount(this.nodes.length);
    
    // Initialize performance tracking
    this._initializePerformanceTracking();
    
    try {
      // Configure and start the force simulation
      this._configureSimulation();
      
      // Wait for layout stabilization
      const result = await this._runSimulation();
      
      // Calculate final bounds and center
      const bounds = this._calculateBounds();
      const center = this._calculateCenter(bounds);
      
      // Prepare and return the layout result
      return {
        nodes: this._prepareNodesResult(),
        edges: this._prepareEdgesResult(),
        bounds: bounds,
        center: center,
        converged: this.isStabilized,
        iterations: this.currentIteration,
        performanceMetrics: { ...this.performanceMetrics }
      };
      
    } catch (error) {
      this._cleanup();
      throw new Error(`Layout calculation failed: ${error.message}`);
    }
  }

  /**
   * Configures the D3 force simulation with all necessary forces based on the current configuration.
   * 
   * Forces applied:
   * - Link force: Maintains desired distance between connected nodes
   * - Many-body force: Creates repulsion between all nodes to prevent overlap
   * - Center force: Pulls nodes toward the center of the layout area
   * - Collision force: Prevents node overlapping (if enabled)
   * - Position forces: Constrains nodes within bounds (if specified)
   * 
   * @private
   */
  _configureSimulation() {
    // Create new simulation instance
    this.simulation = forceSimulation(this.nodes);
    
    // Configure basic simulation parameters
    this.simulation
      .alpha(this.forceConfig.alpha)
      .alphaDecay(this.forceConfig.alphaDecay)
      .velocityDecay(this.forceConfig.velocityDecay);

    // Apply forces based on configuration
    this._applyLinkForce();
    this._applyManyBodyForce();
    this._applyCenterForce();
    this._applyCollisionForce();
    this._applyBoundaryForces();
    
    // Set up event handlers
    this._setupEventHandlers();
    
    console.log(`Force simulation configured with ${this.nodes.length} nodes and ${this.edges.length} edges`);
  }

  /**
   * Applies the link force to maintain desired distances between connected nodes.
   * The link force creates springs between connected nodes, pulling them toward
   * the configured link distance while allowing for natural movement.
   * 
   * @private
   */
  _applyLinkForce() {
    if (this.edges.length === 0) {
      console.log('No edges found, skipping link force');
      return;
    }

    const linkForce = forceLink(this.edges)
      .id(d => d.id)
      .distance(d => {
        // Use edge-specific distance if available, otherwise use global setting
        const baseDistance = d.distance || this.forceConfig.linkDistance;
        
        // Adjust distance based on node types and sizes
        const sourceSize = d.source.size ? Math.max(d.source.size.width, d.source.size.height) : 50;
        const targetSize = d.target.size ? Math.max(d.target.size.width, d.target.size.height) : 50;
        const sizeAdjustment = (sourceSize + targetSize) / 2;
        
        return baseDistance + sizeAdjustment * 0.5;
      })
      .strength(d => {
        // Stronger links for hierarchy relationships, weaker for connections
        const baseStrength = this.forceConfig.forceStrength;
        return d.type === 'hierarchy' ? baseStrength * 1.5 : baseStrength;
      });

    this.simulation.force('link', linkForce);
    console.log(`Applied link force with distance ${this.forceConfig.linkDistance} to ${this.edges.length} edges`);
  }

  /**
   * Applies the many-body force to create repulsion between all nodes.
   * This force prevents nodes from clustering too closely together and
   * helps create a more readable layout with proper spacing.
   * 
   * @private
   */
  _applyManyBodyForce() {
    const manyBodyForce = forceManyBody()
      .strength(d => {
        // Larger nodes should have stronger repulsion
        const baseStrength = -this.forceConfig.nodeRepulsion;
        const sizeMultiplier = d.size ? Math.max(d.size.width, d.size.height) / 50 : 1;
        return baseStrength * sizeMultiplier;
      })
      .distanceMin(10) // Minimum distance for force calculation
      .distanceMax(300); // Maximum distance for force calculation (performance optimization)

    this.simulation.force('charge', manyBodyForce);
    console.log(`Applied many-body force with strength ${-this.forceConfig.nodeRepulsion}`);
  }

  /**
   * Applies the center force to pull nodes toward the center of the layout area.
   * This prevents the entire graph from drifting away from the intended center
   * and helps maintain a balanced layout.
   * 
   * @private
   */
  _applyCenterForce() {
    if (this.forceConfig.centerForce <= 0) {
      console.log('Center force disabled (strength = 0)');
      return;
    }

    const centerForce = forceCenter(this.center.x, this.center.y)
      .strength(this.forceConfig.centerForce);

    this.simulation.force('center', centerForce);
    console.log(`Applied center force with strength ${this.forceConfig.centerForce} at (${this.center.x}, ${this.center.y})`);
  }

  /**
   * Applies collision detection force to prevent node overlapping.
   * This force ensures that nodes maintain a minimum distance from each other
   * based on their size and the configured collision radius.
   * 
   * @private
   */
  _applyCollisionForce() {
    if (!this.forceConfig.enableCollision) {
      console.log('Collision force disabled');
      return;
    }

    const collisionForce = forceCollide()
      .radius(d => {
        // Calculate collision radius based on node size
        const baseRadius = d.size ? Math.max(d.size.width, d.size.height) / 2 : 25;
        return baseRadius * this.forceConfig.collisionRadius;
      })
      .strength(0.8) // Strong collision avoidance
      .iterations(2); // Multiple iterations for better collision resolution

    this.simulation.force('collide', collisionForce);
    console.log(`Applied collision force with radius multiplier ${this.forceConfig.collisionRadius}`);
  }

  /**
   * Applies boundary forces to keep nodes within the specified layout bounds.
   * These forces gently push nodes back into the layout area if they drift outside.
   * 
   * @private
   */
  _applyBoundaryForces() {
    const margin = 50; // Margin from edges
    const boundaryStrength = 0.1;

    // X-axis boundary force
    const forceXBoundary = forceX()
      .x(d => {
        const nodeRadius = d.size ? Math.max(d.size.width, d.size.height) / 2 : 25;
        const minX = margin + nodeRadius;
        const maxX = this.bounds.width - margin - nodeRadius;
        
        if (d.x < minX) return minX;
        if (d.x > maxX) return maxX;
        return d.x;
      })
      .strength(d => {
        const nodeRadius = d.size ? Math.max(d.size.width, d.size.height) / 2 : 25;
        const minX = margin + nodeRadius;
        const maxX = this.bounds.width - margin - nodeRadius;
        
        // Apply force only when outside bounds
        if (d.x < minX || d.x > maxX) return boundaryStrength;
        return 0;
      });

    // Y-axis boundary force
    const forceYBoundary = forceY()
      .y(d => {
        const nodeRadius = d.size ? Math.max(d.size.width, d.size.height) / 2 : 25;
        const minY = margin + nodeRadius;
        const maxY = this.bounds.height - margin - nodeRadius;
        
        if (d.y < minY) return minY;
        if (d.y > maxY) return maxY;
        return d.y;
      })
      .strength(d => {
        const nodeRadius = d.size ? Math.max(d.size.width, d.size.height) / 2 : 25;
        const minY = margin + nodeRadius;
        const maxY = this.bounds.height - margin - nodeRadius;
        
        // Apply force only when outside bounds
        if (d.y < minY || d.y > maxY) return boundaryStrength;
        return 0;
      });

    this.simulation.force('boundaryX', forceXBoundary);
    this.simulation.force('boundaryY', forceYBoundary);
    console.log(`Applied boundary forces for ${this.bounds.width}x${this.bounds.height} layout area`);
  }

  /**
   * Sets up event handlers for the force simulation to track progress and detect convergence.
   * 
   * @private
   */
  _setupEventHandlers() {
    console.log('Setting up event handlers...');
    
    this.simulation.on('tick', () => {
      this.currentIteration++;
      this.lastAlpha = this.simulation.alpha();
      
      // Debug output for first few iterations
      if (this.currentIteration <= 5) {
        console.log(`Tick ${this.currentIteration}, alpha: ${this.lastAlpha.toFixed(4)}`);
      }
      
      // Update performance metrics
      this.performanceMetrics.averageAlpha = 
        (this.performanceMetrics.averageAlpha * (this.currentIteration - 1) + this.lastAlpha) / this.currentIteration;
      
      // Call user-defined tick callback
      if (this.onTick) {
        this.onTick({
          iteration: this.currentIteration,
          alpha: this.lastAlpha,
          nodes: this.nodes,
          edges: this.edges
        });
      }
      
      // Call progress callback
      if (this.onProgress) {
        const progress = Math.min(1, this.currentIteration / this.forceConfig.iterations);
        this.onProgress(progress, this.currentIteration, this.lastAlpha);
      }
      
      // Check for early convergence
      if (this._checkConvergence()) {
        console.log(`Layout converged early at iteration ${this.currentIteration} (alpha: ${this.lastAlpha.toFixed(4)})`);
        console.log('Stopping simulation...');
        this.simulation.stop();
        
        // Manually trigger end logic since stop() doesn't always fire 'end' event
        this._handleSimulationEnd();
      }
    });
    
    console.log('Event handlers set up successfully');
  }

  /**
   * Runs the force simulation and returns a promise that resolves when the layout is complete.
   * Implements timeout handling and convergence detection for robust operation.
   * 
   * @private
   * @returns {Promise<void>} Promise that resolves when simulation is complete
   */
  _runSimulation() {
    return new Promise((resolve, reject) => {
      this.isRunning = true;
      this.startTime = performance.now();
      
      // Store resolve/reject for use in other methods
      this._simulationResolve = resolve;
      this._simulationReject = reject;
      
      // Set up timeout to prevent infinite simulation
      this.stabilizationTimeout = setTimeout(() => {
        if (this.isRunning) {
          console.warn(`Layout stabilization timeout after ${this.maxStabilizationTime}ms`);
          this.simulation.stop();
          this.isStabilized = false;
          reject(new Error('Layout stabilization timeout'));
        }
      }, this.maxStabilizationTime);
      
      // Set up the end event handler before starting
      this.simulation.on('end', () => {
        console.log('Simulation end event triggered');
        this._handleSimulationEnd();
      });
      
      // Start the simulation
      console.log(`Starting force simulation with ${this.forceConfig.iterations} max iterations`);
      this.simulation.restart();
    });
  }

  /**
   * Implements the stabilizeLayout method with convergence detection and timeout handling.
   * This method provides fine-grained control over the stabilization process.
   * 
   * Convergence is detected when:
   * - Alpha value falls below the convergence threshold
   * - Node positions change by less than 1 pixel between iterations
   * - Maximum iterations are reached
   * 
   * @returns {Promise<boolean>} Promise resolving to true if converged, false if timeout
   */
  async stabilizeLayout() {
    if (!this.simulation) {
      throw new Error('Simulation not initialized. Call calculateLayout first.');
    }

    return new Promise((resolve) => {
      let previousPositions = new Map();
      let stableIterations = 0;
      const requiredStableIterations = 5; // Require 5 stable iterations for convergence
      const positionThreshold = 1; // 1 pixel movement threshold
      
      // Store initial positions
      this.nodes.forEach(node => {
        previousPositions.set(node.id, { x: node.x || 0, y: node.y || 0 });
      });
      
      const checkStabilization = () => {
        let maxMovement = 0;
        let totalMovement = 0;
        let movingNodes = 0;
        
        // Calculate movement for each node
        this.nodes.forEach(node => {
          const prev = previousPositions.get(node.id);
          const currentX = node.x || 0;
          const currentY = node.y || 0;
          
          const movement = Math.sqrt(
            Math.pow(currentX - prev.x, 2) + Math.pow(currentY - prev.y, 2)
          );
          
          maxMovement = Math.max(maxMovement, movement);
          totalMovement += movement;
          
          if (movement > positionThreshold) {
            movingNodes++;
          }
          
          // Update previous position
          previousPositions.set(node.id, { x: currentX, y: currentY });
        });
        
        const averageMovement = totalMovement / this.nodes.length;
        const alpha = this.simulation.alpha();
        
        // Check convergence criteria
        const alphaConverged = alpha < this.convergenceThreshold;
        const positionConverged = maxMovement < positionThreshold && movingNodes < this.nodes.length * 0.1;
        const iterationLimitReached = this.currentIteration >= this.forceConfig.iterations;
        
        if (alphaConverged || positionConverged || iterationLimitReached) {
          stableIterations++;
          console.log(`Stable iteration ${stableIterations}/${requiredStableIterations} - Alpha: ${alpha.toFixed(4)}, Max movement: ${maxMovement.toFixed(2)}, Moving nodes: ${movingNodes}`);
        } else {
          stableIterations = 0; // Reset counter if not stable
        }
        
        // Resolve if we have enough stable iterations
        if (stableIterations >= requiredStableIterations) {
          console.log(`Layout stabilized after ${this.currentIteration} iterations`);
          this.isStabilized = true;
          this.simulation.stop();
          resolve(true);
          return;
        }
        
        // Continue if still running
        if (this.isRunning && !iterationLimitReached) {
          requestAnimationFrame(checkStabilization);
        } else {
          console.log(`Layout stabilization completed at iteration limit`);
          this.isStabilized = iterationLimitReached;
          resolve(this.isStabilized);
        }
      };
      
      // Start stabilization check
      requestAnimationFrame(checkStabilization);
    });
  }

  /**
   * Validates the input graph data for required properties and structure
   * @private
   * @param {GraphData} graphData - Graph data to validate
   */
  _validateGraphData(graphData) {
    if (!Array.isArray(graphData.nodes)) {
      throw new Error('Graph data must contain a nodes array');
    }
    
    if (!Array.isArray(graphData.edges)) {
      throw new Error('Graph data must contain an edges array');
    }
    
    // Validate nodes
    graphData.nodes.forEach((node, index) => {
      if (!node.id) {
        throw new Error(`Node at index ${index} is missing required 'id' property`);
      }
    });
    
    // Validate edges
    graphData.edges.forEach((edge, index) => {
      if (!edge.source || !edge.target) {
        throw new Error(`Edge at index ${index} is missing required 'source' or 'target' property`);
      }
    });
    
    console.log(`Validated graph data: ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`);
  }

  /**
   * Prepares and clones the graph data for simulation
   * @private
   * @param {GraphData} graphData - Original graph data
   */
  _prepareData(graphData) {
    // Clone nodes to avoid modifying original data
    this.nodes = graphData.nodes.map(node => ({
      ...node,
      // Initialize position if not provided
      x: node.position?.x ?? this.center.x + (Math.random() - 0.5) * 100,
      y: node.position?.y ?? this.center.y + (Math.random() - 0.5) * 100,
      // Ensure size defaults
      size: node.size || { width: 50, height: 50 },
      // Add velocity tracking
      vx: 0,
      vy: 0
    }));
    
    // Clone edges
    this.edges = graphData.edges.map(edge => ({
      ...edge,
      // Ensure source and target are node references for D3
      source: edge.source,
      target: edge.target
    }));
    
    console.log(`Prepared ${this.nodes.length} nodes and ${this.edges.length} edges for simulation`);
  }

  /**
   * Initializes performance tracking metrics
   * @private
   */
  _initializePerformanceTracking() {
    this.currentIteration = 0;
    this.isStabilized = false;
    this.performanceMetrics = {
      totalTime: 0,
      iterations: 0,
      averageAlpha: 0,
      converged: false
    };
  }

  /**
   * Checks if the simulation has converged based on alpha value and node movement
   * @private
   * @returns {boolean} True if converged
   */
  _checkConvergence() {
    return this.lastAlpha < this.convergenceThreshold;
  }

  /**
   * Handles simulation end logic manually when convergence is detected
   * @private
   */
  _handleSimulationEnd() {
    if (!this.isRunning) return; // Already handled
    
    console.log('Handling simulation end manually');
    
    // Clear timeout
    if (this.stabilizationTimeout) {
      clearTimeout(this.stabilizationTimeout);
      this.stabilizationTimeout = null;
    }
    
    this.isRunning = false;
    this.isStabilized = true;
    this.endTime = performance.now();
    
    // Update final performance metrics
    this.performanceMetrics.totalTime = this.endTime - this.startTime;
    this.performanceMetrics.iterations = this.currentIteration;
    this.performanceMetrics.converged = this._checkConvergence();
    
    console.log(`Layout completed in ${this.performanceMetrics.totalTime.toFixed(2)}ms after ${this.currentIteration} iterations`);
    
    // Call user-defined end callback if it exists
    if (this.onEnd) {
      this.onEnd({
        iterations: this.currentIteration,
        totalTime: this.performanceMetrics.totalTime,
        converged: this.performanceMetrics.converged,
        nodes: this.nodes,
        edges: this.edges
      });
    }
    
    // Resolve the promise if it exists
    if (this._simulationResolve) {
      this._simulationResolve();
      this._simulationResolve = null;
      this._simulationReject = null;
    }
  }

  /**
   * Calculates the bounding box of all nodes in the layout
   * @private
   * @returns {Object} Bounds object with min/max coordinates and dimensions
   */
  _calculateBounds() {
    if (this.nodes.length === 0) {
      return {
        minX: 0, minY: 0, maxX: this.bounds.width, maxY: this.bounds.height,
        width: this.bounds.width, height: this.bounds.height
      };
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    this.nodes.forEach(node => {
      const nodeRadius = node.size ? Math.max(node.size.width, node.size.height) / 2 : 25;
      minX = Math.min(minX, (node.x || 0) - nodeRadius);
      minY = Math.min(minY, (node.y || 0) - nodeRadius);
      maxX = Math.max(maxX, (node.x || 0) + nodeRadius);
      maxY = Math.max(maxY, (node.y || 0) + nodeRadius);
    });
    
    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Calculates the center point of the layout
   * @private
   * @param {Object} bounds - Bounds object from _calculateBounds
   * @returns {Object} Center point with x and y coordinates
   */
  _calculateCenter(bounds) {
    return {
      x: bounds.minX + bounds.width / 2,
      y: bounds.minY + bounds.height / 2
    };
  }

  /**
   * Prepares the final nodes result with cleaned up properties
   * @private
   * @returns {Node[]} Array of nodes with final positions
   */
  _prepareNodesResult() {
    return this.nodes.map(node => ({
      ...node,
      position: {
        x: node.x || 0,
        y: node.y || 0
      },
      // Remove D3-specific properties
      vx: undefined,
      vy: undefined,
      index: undefined
    }));
  }

  /**
   * Prepares the final edges result
   * @private
   * @returns {Edge[]} Array of edges with source/target as IDs
   */
  _prepareEdgesResult() {
    return this.edges.map(edge => ({
      ...edge,
      // Ensure source and target are IDs, not object references
      source: typeof edge.source === 'object' ? edge.source.id : edge.source,
      target: typeof edge.target === 'object' ? edge.target.id : edge.target
    }));
  }

  /**
   * Cleans up simulation resources
   * @private
   */
  _cleanup() {
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
    
    if (this.stabilizationTimeout) {
      clearTimeout(this.stabilizationTimeout);
      this.stabilizationTimeout = null;
    }
    
    this.isRunning = false;
  }

  /**
   * Updates the layout configuration and reconfigures forces if simulation is running
   * @param {LayoutConfig|ForceConfig} newConfig - New configuration
   */
  updateConfiguration(newConfig) {
    this.forceConfig = newConfig instanceof ForceConfig ? newConfig : new ForceConfig(newConfig);
    this.bounds = { ...this.forceConfig.bounds };
    this.center = { 
      x: this.bounds.width / 2, 
      y: this.bounds.height / 2 
    };
    
    // Reconfigure simulation if it's running
    if (this.simulation && this.isRunning) {
      this._configureSimulation();
      console.log('Updated layout configuration and reconfigured simulation');
    }
  }

  /**
   * Stops the current simulation
   */
  stop() {
    if (this.simulation) {
      this.simulation.stop();
    }
    this._cleanup();
    console.log('Layout simulation stopped');
  }

  /**
   * Gets the current simulation status
   * @returns {Object} Status object with running state and metrics
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isStabilized: this.isStabilized,
      currentIteration: this.currentIteration,
      alpha: this.lastAlpha,
      performanceMetrics: { ...this.performanceMetrics },
      nodeCount: this.nodes.length,
      edgeCount: this.edges.length
    };
  }

  /**
   * Sets event callbacks for simulation monitoring
   * @param {Object} callbacks - Object containing callback functions
   * @param {Function} callbacks.onTick - Called on each simulation tick
   * @param {Function} callbacks.onEnd - Called when simulation ends
   * @param {Function} callbacks.onProgress - Called with progress updates
   */
  setCallbacks(callbacks = {}) {
    this.onTick = callbacks.onTick || null;
    this.onEnd = callbacks.onEnd || null;
    this.onProgress = callbacks.onProgress || null;
  }
}

export default LayoutEngine;