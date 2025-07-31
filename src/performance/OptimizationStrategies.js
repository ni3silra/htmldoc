/**
 * Performance optimization strategies for large diagrams
 * Implements various techniques to maintain performance with 50+ elements
 */

/**
 * Optimization strategy types
 * @enum {string}
 */
const STRATEGY_TYPES = {
    LAZY_LOADING: 'lazy_loading',
    VIRTUALIZATION: 'virtualization',
    LEVEL_OF_DETAIL: 'level_of_detail',
    BATCHING: 'batching',
    CACHING: 'caching'
};

/**
 * Optimization strategies manager
 */
class OptimizationStrategies {
    /**
     * Create optimization strategies manager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            enableLazyLoading: config.enableLazyLoading !== false,
            enableVirtualization: config.enableVirtualization !== false,
            enableLevelOfDetail: config.enableLevelOfDetail !== false,
            enableBatching: config.enableBatching !== false,
            enableCaching: config.enableCaching !== false,
            viewportBuffer: config.viewportBuffer || 100,
            batchSize: config.batchSize || 10,
            lodThreshold: config.lodThreshold || 0.5
        };

        this.cache = new Map();
        this.visibleElements = new Set();
        this.loadingQueue = [];
        this.isProcessingQueue = false;
    }

    /**
     * Optimize diagram for large graphs (50+ elements)
     * @param {Object} graphData - Graph data with nodes and edges
     * @param {Object} viewport - Current viewport information
     * @returns {Object} Optimized graph data and strategies applied
     */
    optimizeForLargeGraphs(graphData, viewport = {}) {
        const { nodes, edges } = graphData;
        const nodeCount = nodes.length;
        
        // Determine which optimizations to apply
        const strategies = this.selectStrategies(nodeCount);
        
        let optimizedNodes = [...nodes];
        let optimizedEdges = [...edges];
        
        // Apply selected optimization strategies
        if (strategies.includes(STRATEGY_TYPES.VIRTUALIZATION)) {
            const virtualized = this.applyVirtualization(optimizedNodes, optimizedEdges, viewport);
            optimizedNodes = virtualized.nodes;
            optimizedEdges = virtualized.edges;
        }
        
        if (strategies.includes(STRATEGY_TYPES.LEVEL_OF_DETAIL)) {
            optimizedNodes = this.applyLevelOfDetail(optimizedNodes, viewport);
        }
        
        if (strategies.includes(STRATEGY_TYPES.LAZY_LOADING)) {
            optimizedNodes = this.prepareLazyLoading(optimizedNodes);
        }
        
        return {
            nodes: optimizedNodes,
            edges: optimizedEdges,
            strategies: strategies,
            originalCount: nodeCount,
            optimizedCount: optimizedNodes.length,
            performance: {
                reduction: Math.round((1 - optimizedNodes.length / nodeCount) * 100),
                estimatedSpeedup: this.estimateSpeedup(strategies, nodeCount)
            }
        };
    }

    /**
     * Select appropriate optimization strategies based on node count
     * @param {number} nodeCount - Number of nodes in the diagram
     * @returns {string[]} Array of strategy types to apply
     */
    selectStrategies(nodeCount) {
        const strategies = [];
        
        if (nodeCount >= 50 && this.config.enableLazyLoading) {
            strategies.push(STRATEGY_TYPES.LAZY_LOADING);
        }
        
        if (nodeCount >= 100 && this.config.enableVirtualization) {
            strategies.push(STRATEGY_TYPES.VIRTUALIZATION);
        }
        
        if (nodeCount >= 75 && this.config.enableLevelOfDetail) {
            strategies.push(STRATEGY_TYPES.LEVEL_OF_DETAIL);
        }
        
        if (nodeCount >= 50 && this.config.enableBatching) {
            strategies.push(STRATEGY_TYPES.BATCHING);
        }
        
        if (this.config.enableCaching) {
            strategies.push(STRATEGY_TYPES.CACHING);
        }
        
        return strategies;
    }

    /**
     * Apply virtualization - only render elements in or near viewport
     * @param {Array} nodes - Array of nodes
     * @param {Array} edges - Array of edges
     * @param {Object} viewport - Viewport bounds
     * @returns {Object} Virtualized nodes and edges
     */
    applyVirtualization(nodes, edges, viewport) {
        if (!viewport.x || !viewport.y || !viewport.width || !viewport.height) {
            return { nodes, edges };
        }

        const buffer = this.config.viewportBuffer;
        const viewBounds = {
            left: viewport.x - buffer,
            right: viewport.x + viewport.width + buffer,
            top: viewport.y - buffer,
            bottom: viewport.y + viewport.height + buffer
        };

        // Filter nodes within viewport
        const visibleNodes = nodes.filter(node => {
            if (!node.position) return true; // Include nodes without position
            
            return node.position.x >= viewBounds.left &&
                   node.position.x <= viewBounds.right &&
                   node.position.y >= viewBounds.top &&
                   node.position.y <= viewBounds.bottom;
        });

        // Update visible elements tracking
        this.visibleElements.clear();
        visibleNodes.forEach(node => this.visibleElements.add(node.id));

        // Filter edges connected to visible nodes
        const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
        const visibleEdges = edges.filter(edge => 
            visibleNodeIds.has(edge.source) || visibleNodeIds.has(edge.target)
        );

        return {
            nodes: visibleNodes,
            edges: visibleEdges
        };
    }

    /**
     * Apply level of detail - reduce detail for distant/small elements
     * @param {Array} nodes - Array of nodes
     * @param {Object} viewport - Viewport information including zoom level
     * @returns {Array} Nodes with adjusted level of detail
     */
    applyLevelOfDetail(nodes, viewport) {
        const zoomLevel = viewport.zoom || 1;
        const threshold = this.config.lodThreshold;

        return nodes.map(node => {
            const lodNode = { ...node };
            
            // Reduce detail for small zoom levels
            if (zoomLevel < threshold) {
                lodNode.simplified = true;
                lodNode.showIcon = false;
                lodNode.showLabel = zoomLevel > threshold * 0.5;
                lodNode.style = {
                    ...node.style,
                    strokeWidth: Math.max(1, (node.style?.strokeWidth || 2) * zoomLevel),
                    fontSize: Math.max(8, (node.style?.fontSize || 12) * zoomLevel)
                };
            } else {
                lodNode.simplified = false;
                lodNode.showIcon = true;
                lodNode.showLabel = true;
            }
            
            return lodNode;
        });
    }

    /**
     * Prepare nodes for lazy loading of icons and heavy resources
     * @param {Array} nodes - Array of nodes
     * @returns {Array} Nodes prepared for lazy loading
     */
    prepareLazyLoading(nodes) {
        return nodes.map(node => {
            const lazyNode = { ...node };
            
            // Mark icons for lazy loading if not already loaded
            if (node.icon && !this.cache.has(`icon_${node.icon}`)) {
                lazyNode.iconLoading = true;
                lazyNode.iconUrl = node.icon;
                lazyNode.icon = null; // Will be loaded on demand
                
                // Add to loading queue if visible
                if (this.visibleElements.has(node.id)) {
                    this.queueIconLoad(node.id, node.icon);
                }
            }
            
            return lazyNode;
        });
    }

    /**
     * Queue an icon for lazy loading
     * @param {string} nodeId - Node ID
     * @param {string} iconUrl - Icon URL to load
     */
    queueIconLoad(nodeId, iconUrl) {
        this.loadingQueue.push({ nodeId, iconUrl, priority: this.visibleElements.has(nodeId) ? 1 : 0 });
        this.processLoadingQueue();
    }

    /**
     * Process the icon loading queue
     */
    async processLoadingQueue() {
        if (this.isProcessingQueue || this.loadingQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        
        // Sort by priority (visible elements first)
        this.loadingQueue.sort((a, b) => b.priority - a.priority);
        
        // Process in batches
        const batchSize = this.config.batchSize;
        while (this.loadingQueue.length > 0) {
            const batch = this.loadingQueue.splice(0, batchSize);
            
            await Promise.all(batch.map(async item => {
                try {
                    await this.loadIcon(item.nodeId, item.iconUrl);
                } catch (error) {
                    console.warn(`Failed to load icon for node ${item.nodeId}:`, error);
                }
            }));
            
            // Small delay between batches to prevent blocking
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        this.isProcessingQueue = false;
    }

    /**
     * Load an icon and cache it
     * @param {string} nodeId - Node ID
     * @param {string} iconUrl - Icon URL
     */
    async loadIcon(nodeId, iconUrl) {
        const cacheKey = `icon_${iconUrl}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            // Simulate icon loading (in real implementation, this would fetch the icon)
            const iconData = await this.fetchIcon(iconUrl);
            this.cache.set(cacheKey, iconData);
            
            // Notify that icon is loaded
            this.onIconLoaded(nodeId, iconData);
            
            return iconData;
        } catch (error) {
            // Cache the error to avoid repeated failed requests
            this.cache.set(cacheKey, null);
            throw error;
        }
    }

    /**
     * Fetch icon data (placeholder implementation)
     * @param {string} iconUrl - Icon URL
     * @returns {Promise<string>} Icon data
     */
    async fetchIcon(iconUrl) {
        // In a real implementation, this would fetch the actual icon
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`<svg><!-- Icon data for ${iconUrl} --></svg>`);
            }, Math.random() * 100 + 50); // Simulate network delay
        });
    }

    /**
     * Handle icon loaded event
     * @param {string} nodeId - Node ID
     * @param {string} iconData - Loaded icon data
     */
    onIconLoaded(nodeId, iconData) {
        // Emit event or call callback to update the node
        if (this.onIconLoadedCallback) {
            this.onIconLoadedCallback(nodeId, iconData);
        }
    }

    /**
     * Set callback for icon loaded events
     * @param {Function} callback - Callback function
     */
    setIconLoadedCallback(callback) {
        this.onIconLoadedCallback = callback;
    }

    /**
     * Estimate performance speedup from applied strategies
     * @param {string[]} strategies - Applied strategies
     * @param {number} nodeCount - Original node count
     * @returns {number} Estimated speedup factor
     */
    estimateSpeedup(strategies, nodeCount) {
        let speedup = 1;
        
        if (strategies.includes(STRATEGY_TYPES.VIRTUALIZATION)) {
            // Virtualization can provide significant speedup for large diagrams
            speedup *= Math.min(5, Math.max(1.5, nodeCount / 50));
        }
        
        if (strategies.includes(STRATEGY_TYPES.LAZY_LOADING)) {
            // Lazy loading improves initial render time
            speedup *= 1.3;
        }
        
        if (strategies.includes(STRATEGY_TYPES.LEVEL_OF_DETAIL)) {
            // LOD reduces rendering complexity
            speedup *= 1.2;
        }
        
        if (strategies.includes(STRATEGY_TYPES.BATCHING)) {
            // Batching reduces layout thrashing
            speedup *= 1.1;
        }
        
        return Math.round(speedup * 10) / 10;
    }

    /**
     * Update viewport and reapply optimizations
     * @param {Object} viewport - New viewport information
     * @param {Object} graphData - Current graph data
     * @returns {Object} Updated optimization results
     */
    updateViewport(viewport, graphData) {
        return this.optimizeForLargeGraphs(graphData, viewport);
    }

    /**
     * Clear optimization cache
     */
    clearCache() {
        this.cache.clear();
        this.visibleElements.clear();
        this.loadingQueue = [];
    }

    /**
     * Get optimization statistics
     * @returns {Object} Statistics about current optimizations
     */
    getStatistics() {
        return {
            cacheSize: this.cache.size,
            visibleElements: this.visibleElements.size,
            queuedLoads: this.loadingQueue.length,
            isProcessing: this.isProcessingQueue,
            strategies: Object.values(STRATEGY_TYPES).filter(strategy => {
                switch (strategy) {
                    case STRATEGY_TYPES.LAZY_LOADING: return this.config.enableLazyLoading;
                    case STRATEGY_TYPES.VIRTUALIZATION: return this.config.enableVirtualization;
                    case STRATEGY_TYPES.LEVEL_OF_DETAIL: return this.config.enableLevelOfDetail;
                    case STRATEGY_TYPES.BATCHING: return this.config.enableBatching;
                    case STRATEGY_TYPES.CACHING: return this.config.enableCaching;
                    default: return false;
                }
            })
        };
    }
}

export { OptimizationStrategies, STRATEGY_TYPES };