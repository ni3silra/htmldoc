/**
 * Performance configuration management for the HTML Diagram Library
 * Manages optimization settings and thresholds for different diagram sizes
 */

/**
 * Default performance configuration settings
 * @typedef {Object} PerformanceConfig
 * @property {number} maxNodesBeforeOptimization - Threshold for enabling optimizations
 * @property {number} maxRenderTime - Maximum allowed render time in milliseconds
 * @property {number} animationDuration - Duration for animations in milliseconds
 * @property {boolean} enableLazyLoading - Whether to enable lazy loading for icons
 * @property {boolean} enableVirtualization - Whether to enable element virtualization
 * @property {number} viewportBuffer - Buffer around viewport for virtualization
 * @property {boolean} showPerformanceWarnings - Whether to show performance warnings
 * @property {number} warningThreshold - Node count threshold for showing warnings
 * @property {boolean} enableMetricsCollection - Whether to collect performance metrics
 * @property {number} metricsBufferSize - Size of metrics buffer for averaging
 */
const DEFAULT_CONFIG = {
    maxNodesBeforeOptimization: 50,
    maxRenderTime: 2000,
    animationDuration: 300,
    enableLazyLoading: true,
    enableVirtualization: true,
    viewportBuffer: 100,
    showPerformanceWarnings: true,
    warningThreshold: 100,
    enableMetricsCollection: true,
    metricsBufferSize: 10
};

/**
 * Performance optimization levels
 * @enum {string}
 */
const OPTIMIZATION_LEVELS = {
    NONE: 'none',
    BASIC: 'basic',
    AGGRESSIVE: 'aggressive'
};

/**
 * Performance configuration manager
 */
class PerformanceConfig {
    /**
     * Create a new performance configuration
     * @param {Partial<PerformanceConfig>} config - Custom configuration options
     */
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.optimizationLevel = this.determineOptimizationLevel();
    }

    /**
     * Get the current configuration
     * @returns {PerformanceConfig} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Update configuration settings
     * @param {Partial<PerformanceConfig>} updates - Configuration updates
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        this.optimizationLevel = this.determineOptimizationLevel();
    }

    /**
     * Determine optimization level based on configuration
     * @returns {string} Optimization level
     */
    determineOptimizationLevel() {
        if (!this.config.enableLazyLoading && !this.config.enableVirtualization) {
            return OPTIMIZATION_LEVELS.NONE;
        }
        
        if (this.config.maxNodesBeforeOptimization <= 25) {
            return OPTIMIZATION_LEVELS.AGGRESSIVE;
        }
        
        return OPTIMIZATION_LEVELS.BASIC;
    }

    /**
     * Get optimization settings for a given node count
     * @param {number} nodeCount - Number of nodes in the diagram
     * @returns {Object} Optimization settings
     */
    getOptimizationSettings(nodeCount) {
        const shouldOptimize = nodeCount >= this.config.maxNodesBeforeOptimization;
        
        return {
            shouldOptimize,
            enableLazyLoading: shouldOptimize && this.config.enableLazyLoading,
            enableVirtualization: shouldOptimize && this.config.enableVirtualization,
            reducedAnimations: nodeCount > this.config.warningThreshold,
            showWarnings: nodeCount > this.config.warningThreshold && this.config.showPerformanceWarnings,
            optimizationLevel: this.optimizationLevel
        };
    }

    /**
     * Check if performance warnings should be shown
     * @param {number} nodeCount - Number of nodes in the diagram
     * @returns {boolean} Whether to show warnings
     */
    shouldShowWarnings(nodeCount) {
        return this.config.showPerformanceWarnings && nodeCount > this.config.warningThreshold;
    }

    /**
     * Get performance thresholds
     * @returns {Object} Performance thresholds
     */
    getThresholds() {
        return {
            optimization: this.config.maxNodesBeforeOptimization,
            warning: this.config.warningThreshold,
            maxRenderTime: this.config.maxRenderTime
        };
    }

    /**
     * Create a configuration for specific use cases
     * @param {string} preset - Preset name ('fast', 'balanced', 'quality')
     * @returns {PerformanceConfig} Preset configuration
     */
    static createPreset(preset) {
        const presets = {
            fast: {
                maxNodesBeforeOptimization: 25,
                animationDuration: 150,
                enableLazyLoading: true,
                enableVirtualization: true,
                showPerformanceWarnings: true
            },
            balanced: DEFAULT_CONFIG,
            quality: {
                maxNodesBeforeOptimization: 100,
                animationDuration: 500,
                enableLazyLoading: false,
                enableVirtualization: false,
                showPerformanceWarnings: false
            }
        };

        return new PerformanceConfig(presets[preset] || presets.balanced);
    }
}

export { PerformanceConfig, OPTIMIZATION_LEVELS, DEFAULT_CONFIG };