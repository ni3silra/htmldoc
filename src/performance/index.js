/**
 * Performance optimization module for the HTML Diagram Library
 * Exports all performance-related classes and utilities
 */

import { PerformanceMonitor } from './PerformanceMonitor.js';
import { OptimizationStrategies, STRATEGY_TYPES } from './OptimizationStrategies.js';
import { PerformanceConfig, OPTIMIZATION_LEVELS, DEFAULT_CONFIG } from './PerformanceConfig.js';

/**
 * Main performance manager that coordinates all performance optimization features
 */
class PerformanceManager {
    /**
     * Create a new performance manager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = new PerformanceConfig(config);
        this.monitor = new PerformanceMonitor({
            bufferSize: this.config.getConfig().metricsBufferSize,
            enableCollection: this.config.getConfig().enableMetricsCollection
        });
        this.optimizer = new OptimizationStrategies(this.config.getConfig());
        
        // Set up icon loaded callback
        this.optimizer.setIconLoadedCallback((nodeId, iconData) => {
            this.onIconLoaded(nodeId, iconData);
        });
        
        this.iconLoadedCallbacks = [];
    }

    /**
     * Start monitoring a diagram render session
     * @param {string} sessionId - Unique session identifier
     * @param {Object} graphData - Graph data being rendered
     * @returns {string} Session ID
     */
    startRenderSession(sessionId, graphData) {
        const context = {
            nodeCount: graphData.nodes?.length || 0,
            edgeCount: graphData.edges?.length || 0
        };
        
        this.monitor.startSession(sessionId, context);
        return sessionId;
    }

    /**
     * End monitoring session and get metrics
     * @returns {Object} Performance metrics
     */
    endRenderSession() {
        return this.monitor.endSession();
    }

    /**
     * Optimize graph data for large diagrams
     * @param {Object} graphData - Original graph data
     * @param {Object} viewport - Current viewport information
     * @returns {Object} Optimized graph data and applied strategies
     */
    optimizeForLargeGraphs(graphData, viewport = {}) {
        const nodeCount = graphData.nodes?.length || 0;
        const settings = this.config.getOptimizationSettings(nodeCount);
        
        if (!settings.shouldOptimize) {
            return {
                nodes: graphData.nodes,
                edges: graphData.edges,
                strategies: [],
                originalCount: nodeCount,
                optimizedCount: nodeCount,
                performance: { reduction: 0, estimatedSpeedup: 1 }
            };
        }
        
        return this.optimizer.optimizeForLargeGraphs(graphData, viewport);
    }

    /**
     * Show performance warnings for complex diagrams
     * @param {number} nodeCount - Number of nodes in diagram
     * @param {Object} options - Warning display options
     * @returns {Object} Warning information and degradation options
     */
    showPerformanceWarnings(nodeCount, options = {}) {
        return this.monitor.showPerformanceWarnings(nodeCount, options);
    }

    /**
     * Start timing a specific operation
     * @param {string} operation - Operation name
     */
    startTimer(operation) {
        this.monitor.startTimer(operation);
    }

    /**
     * End timing a specific operation
     * @param {string} operation - Operation name
     * @returns {number} Duration in milliseconds
     */
    endTimer(operation) {
        return this.monitor.endTimer(operation);
    }

    /**
     * Get current performance status
     * @returns {Object} Performance status and recommendations
     */
    getPerformanceStatus() {
        const thresholds = this.config.getThresholds();
        const status = this.monitor.checkPerformance(thresholds);
        const report = this.monitor.generateReport();
        
        return {
            ...status,
            report,
            config: this.config.getConfig(),
            optimizerStats: this.optimizer.getStatistics()
        };
    }

    /**
     * Update viewport and reapply optimizations
     * @param {Object} viewport - New viewport information
     * @param {Object} graphData - Current graph data
     * @returns {Object} Updated optimization results
     */
    updateViewport(viewport, graphData) {
        return this.optimizer.updateViewport(viewport, graphData);
    }

    /**
     * Add callback for icon loaded events
     * @param {Function} callback - Callback function
     */
    onIconLoaded(nodeId, iconData) {
        this.iconLoadedCallbacks.forEach(callback => {
            try {
                callback(nodeId, iconData);
            } catch (error) {
                console.warn('Icon loaded callback error:', error);
            }
        });
    }

    /**
     * Add icon loaded callback
     * @param {Function} callback - Callback function
     */
    addIconLoadedCallback(callback) {
        this.iconLoadedCallbacks.push(callback);
    }

    /**
     * Remove icon loaded callback
     * @param {Function} callback - Callback function to remove
     */
    removeIconLoadedCallback(callback) {
        const index = this.iconLoadedCallbacks.indexOf(callback);
        if (index > -1) {
            this.iconLoadedCallbacks.splice(index, 1);
        }
    }

    /**
     * Clear all performance data and caches
     */
    clearAll() {
        this.monitor.clearMetrics();
        this.optimizer.clearCache();
    }

    /**
     * Update configuration
     * @param {Object} updates - Configuration updates
     */
    updateConfig(updates) {
        this.config.updateConfig(updates);
        
        // Update dependent components
        this.monitor.config = {
            ...this.monitor.config,
            bufferSize: this.config.getConfig().metricsBufferSize,
            enableCollection: this.config.getConfig().enableMetricsCollection
        };
        
        this.optimizer.config = {
            ...this.optimizer.config,
            ...this.config.getConfig()
        };
    }

    /**
     * Create a performance manager with preset configuration
     * @param {string} preset - Preset name ('fast', 'balanced', 'quality')
     * @returns {PerformanceManager} Configured performance manager
     */
    static createWithPreset(preset) {
        const config = PerformanceConfig.createPreset(preset);
        return new PerformanceManager(config.getConfig());
    }
}

export {
    PerformanceManager,
    PerformanceMonitor,
    OptimizationStrategies,
    PerformanceConfig,
    STRATEGY_TYPES,
    OPTIMIZATION_LEVELS,
    DEFAULT_CONFIG
};