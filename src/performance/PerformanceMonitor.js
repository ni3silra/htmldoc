/**
 * Performance monitoring and metrics collection for the HTML Diagram Library
 * Tracks render times, frame rates, and other performance metrics
 */

/**
 * Performance metrics data structure
 * @typedef {Object} PerformanceMetrics
 * @property {number} renderTime - Time taken to render the diagram
 * @property {number} layoutTime - Time taken to calculate layout
 * @property {number} nodeCount - Number of nodes in the diagram
 * @property {number} edgeCount - Number of edges in the diagram
 * @property {number} memoryUsage - Memory usage in MB (if available)
 * @property {number} timestamp - Timestamp when metrics were collected
 */

/**
 * Performance monitoring class
 */
class PerformanceMonitor {
    /**
     * Create a new performance monitor
     * @param {Object} config - Configuration options
     * @param {number} config.bufferSize - Size of metrics buffer
     * @param {boolean} config.enableCollection - Whether to collect metrics
     */
    constructor(config = {}) {
        this.config = {
            bufferSize: config.bufferSize || 10,
            enableCollection: config.enableCollection !== false
        };
        
        this.metrics = [];
        this.currentSession = null;
        this.timers = new Map();
        this.observers = [];
    }

    /**
     * Start a performance measurement session
     * @param {string} sessionId - Unique identifier for the session
     * @param {Object} context - Additional context information
     */
    startSession(sessionId, context = {}) {
        if (!this.config.enableCollection) return;

        this.currentSession = {
            id: sessionId,
            startTime: performance.now(),
            context,
            measurements: {}
        };
    }

    /**
     * End the current performance measurement session
     * @returns {PerformanceMetrics|null} Collected metrics or null if disabled
     */
    endSession() {
        if (!this.config.enableCollection || !this.currentSession) return null;

        const endTime = performance.now();
        const totalTime = endTime - this.currentSession.startTime;

        const metrics = {
            sessionId: this.currentSession.id,
            totalTime,
            renderTime: this.currentSession.measurements.render || 0,
            layoutTime: this.currentSession.measurements.layout || 0,
            nodeCount: this.currentSession.context.nodeCount || 0,
            edgeCount: this.currentSession.context.edgeCount || 0,
            memoryUsage: this.getMemoryUsage(),
            timestamp: Date.now(),
            ...this.currentSession.context
        };

        this.addMetrics(metrics);
        this.currentSession = null;

        return metrics;
    }

    /**
     * Start timing a specific operation
     * @param {string} operation - Name of the operation
     */
    startTimer(operation) {
        if (!this.config.enableCollection) return;
        this.timers.set(operation, performance.now());
    }

    /**
     * End timing a specific operation
     * @param {string} operation - Name of the operation
     * @returns {number} Duration in milliseconds
     */
    endTimer(operation) {
        if (!this.config.enableCollection) return 0;

        const startTime = this.timers.get(operation);
        if (!startTime) return 0;

        const duration = performance.now() - startTime;
        this.timers.delete(operation);

        if (this.currentSession) {
            this.currentSession.measurements[operation] = duration;
        }

        return duration;
    }

    /**
     * Add metrics to the buffer
     * @param {PerformanceMetrics} metrics - Metrics to add
     */
    addMetrics(metrics) {
        this.metrics.push(metrics);
        
        // Keep buffer size manageable
        if (this.metrics.length > this.config.bufferSize) {
            this.metrics.shift();
        }

        // Notify observers
        this.notifyObservers(metrics);
    }

    /**
     * Get current memory usage (if available)
     * @returns {number} Memory usage in MB or 0 if not available
     */
    getMemoryUsage() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100;
        }
        return 0;
    }

    /**
     * Get average metrics over the buffer
     * @returns {Object} Average metrics
     */
    getAverageMetrics() {
        if (this.metrics.length === 0) return null;

        const totals = this.metrics.reduce((acc, metric) => {
            acc.totalTime += metric.totalTime || 0;
            acc.renderTime += metric.renderTime || 0;
            acc.layoutTime += metric.layoutTime || 0;
            acc.nodeCount += metric.nodeCount || 0;
            acc.edgeCount += metric.edgeCount || 0;
            acc.memoryUsage += metric.memoryUsage || 0;
            return acc;
        }, {
            totalTime: 0,
            renderTime: 0,
            layoutTime: 0,
            nodeCount: 0,
            edgeCount: 0,
            memoryUsage: 0
        });

        const count = this.metrics.length;
        return {
            totalTime: Math.round(totals.totalTime / count * 100) / 100,
            renderTime: Math.round(totals.renderTime / count * 100) / 100,
            layoutTime: Math.round(totals.layoutTime / count * 100) / 100,
            nodeCount: Math.round(totals.nodeCount / count),
            edgeCount: Math.round(totals.edgeCount / count),
            memoryUsage: Math.round(totals.memoryUsage / count * 100) / 100,
            sampleCount: count
        };
    }

    /**
     * Get the latest metrics
     * @returns {PerformanceMetrics|null} Latest metrics or null if none available
     */
    getLatestMetrics() {
        return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
    }

    /**
     * Get all collected metrics
     * @returns {PerformanceMetrics[]} Array of all metrics
     */
    getAllMetrics() {
        return [...this.metrics];
    }

    /**
     * Check if performance is degraded based on thresholds
     * @param {Object} thresholds - Performance thresholds
     * @param {number} thresholds.maxRenderTime - Maximum acceptable render time
     * @param {number} thresholds.maxTotalTime - Maximum acceptable total time
     * @returns {Object} Performance status
     */
    checkPerformance(thresholds = {}) {
        const latest = this.getLatestMetrics();
        const average = this.getAverageMetrics();
        
        if (!latest || !average) {
            return { status: 'unknown', issues: [] };
        }

        const issues = [];
        const maxRenderTime = thresholds.maxRenderTime || 2000;
        const maxTotalTime = thresholds.maxTotalTime || 3000;

        if (latest.renderTime > maxRenderTime) {
            issues.push({
                type: 'slow_render',
                message: `Render time (${latest.renderTime}ms) exceeds threshold (${maxRenderTime}ms)`,
                severity: 'warning'
            });
        }

        if (latest.totalTime > maxTotalTime) {
            issues.push({
                type: 'slow_total',
                message: `Total time (${latest.totalTime}ms) exceeds threshold (${maxTotalTime}ms)`,
                severity: 'error'
            });
        }

        if (average.renderTime > maxRenderTime * 0.8) {
            issues.push({
                type: 'consistently_slow',
                message: `Average render time (${average.renderTime}ms) is consistently high`,
                severity: 'warning'
            });
        }

        const status = issues.some(i => i.severity === 'error') ? 'poor' :
                      issues.length > 0 ? 'degraded' : 'good';

        return { status, issues, latest, average };
    }

    /**
     * Add an observer for performance metrics
     * @param {Function} callback - Callback function to receive metrics
     */
    addObserver(callback) {
        this.observers.push(callback);
    }

    /**
     * Remove an observer
     * @param {Function} callback - Callback function to remove
     */
    removeObserver(callback) {
        const index = this.observers.indexOf(callback);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    /**
     * Notify all observers of new metrics
     * @param {PerformanceMetrics} metrics - New metrics
     */
    notifyObservers(metrics) {
        this.observers.forEach(callback => {
            try {
                callback(metrics);
            } catch (error) {
                console.warn('Performance observer error:', error);
            }
        });
    }

    /**
     * Clear all collected metrics
     */
    clearMetrics() {
        this.metrics = [];
    }

    /**
     * Generate a performance report
     * @returns {Object} Performance report
     */
    generateReport() {
        const average = this.getAverageMetrics();
        const latest = this.getLatestMetrics();
        const all = this.getAllMetrics();

        if (!average || !latest) {
            return { status: 'no_data', message: 'No performance data available' };
        }

        const report = {
            summary: {
                status: 'good',
                totalSessions: all.length,
                averageRenderTime: average.renderTime,
                averageTotalTime: average.totalTime,
                averageNodeCount: average.nodeCount
            },
            latest: {
                renderTime: latest.renderTime,
                totalTime: latest.totalTime,
                nodeCount: latest.nodeCount,
                memoryUsage: latest.memoryUsage
            },
            trends: this.analyzeTrends(),
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    /**
     * Analyze performance trends
     * @returns {Object} Trend analysis
     */
    analyzeTrends() {
        if (this.metrics.length < 3) return { status: 'insufficient_data' };

        const recent = this.metrics.slice(-3);
        const renderTimes = recent.map(m => m.renderTime);
        
        const isIncreasing = renderTimes[2] > renderTimes[1] && renderTimes[1] > renderTimes[0];
        const isDecreasing = renderTimes[2] < renderTimes[1] && renderTimes[1] < renderTimes[0];

        return {
            renderTime: isIncreasing ? 'increasing' : isDecreasing ? 'decreasing' : 'stable',
            variance: this.calculateVariance(renderTimes)
        };
    }

    /**
     * Calculate variance for a set of values
     * @param {number[]} values - Array of values
     * @returns {number} Variance
     */
    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        return Math.round(variance * 100) / 100;
    }

    /**
     * Generate performance recommendations
     * @returns {string[]} Array of recommendations
     */
    generateRecommendations() {
        const average = this.getAverageMetrics();
        if (!average) return [];

        const recommendations = [];

        if (average.renderTime > 1000) {
            recommendations.push('Consider enabling performance optimizations for large diagrams');
        }

        if (average.nodeCount > 50) {
            recommendations.push('Enable lazy loading for icons to improve initial render time');
        }

        if (average.nodeCount > 100) {
            recommendations.push('Consider using virtualization for very large diagrams');
        }

        if (average.memoryUsage > 50) {
            recommendations.push('Monitor memory usage - consider clearing unused resources');
        }

        return recommendations;
    }

    /**
     * Show performance warnings with degradation options for complex diagrams
     * @param {number} nodeCount - Number of nodes in the diagram
     * @param {Object} options - Warning options
     * @param {boolean} options.showInConsole - Whether to show warnings in console
     * @param {Function} options.onWarning - Callback for warning events
     * @param {HTMLElement} options.container - Container to show visual warnings
     * @returns {Object} Warning information and degradation options
     */
    showPerformanceWarnings(nodeCount, options = {}) {
        const {
            showInConsole = true,
            onWarning = null,
            container = null
        } = options;

        const warnings = [];
        const degradationOptions = [];

        // Check for performance thresholds
        if (nodeCount >= 50) {
            warnings.push({
                level: 'info',
                message: `Large diagram detected (${nodeCount} nodes). Consider enabling optimizations.`,
                code: 'LARGE_DIAGRAM'
            });
            
            degradationOptions.push({
                name: 'Enable Lazy Loading',
                description: 'Load icons and resources on demand',
                impact: 'Faster initial render, slight delay for off-screen elements',
                recommended: true
            });
        }

        if (nodeCount >= 100) {
            warnings.push({
                level: 'warning',
                message: `Very large diagram (${nodeCount} nodes). Performance may be impacted.`,
                code: 'VERY_LARGE_DIAGRAM'
            });
            
            degradationOptions.push({
                name: 'Enable Virtualization',
                description: 'Only render elements visible in viewport',
                impact: 'Significant performance improvement, elements outside view not rendered',
                recommended: true
            });
        }

        if (nodeCount >= 200) {
            warnings.push({
                level: 'error',
                message: `Extremely large diagram (${nodeCount} nodes). Severe performance degradation expected.`,
                code: 'EXTREME_DIAGRAM_SIZE'
            });
            
            degradationOptions.push({
                name: 'Reduce Animation Quality',
                description: 'Disable or reduce animation complexity',
                impact: 'Less smooth animations but better performance',
                recommended: true
            }, {
                name: 'Enable Level of Detail',
                description: 'Show simplified elements when zoomed out',
                impact: 'Reduced visual quality at low zoom, better performance',
                recommended: true
            });
        }

        // Check current performance metrics
        const latest = this.getLatestMetrics();
        if (latest) {
            if (latest.renderTime > 2000) {
                warnings.push({
                    level: 'warning',
                    message: `Slow render time detected (${Math.round(latest.renderTime)}ms). Consider optimizations.`,
                    code: 'SLOW_RENDER'
                });
            }

            if (latest.memoryUsage > 100) {
                warnings.push({
                    level: 'warning',
                    message: `High memory usage detected (${latest.memoryUsage}MB). Monitor for memory leaks.`,
                    code: 'HIGH_MEMORY'
                });
                
                degradationOptions.push({
                    name: 'Clear Unused Cache',
                    description: 'Clear cached icons and resources',
                    impact: 'Reduced memory usage, may need to reload some resources',
                    recommended: false
                });
            }
        }

        // Display warnings
        if (showInConsole && warnings.length > 0) {
            warnings.forEach(warning => {
                const method = warning.level === 'error' ? 'error' : 
                              warning.level === 'warning' ? 'warn' : 'info';
                console[method](`[HTML Diagram Library] ${warning.message}`);
            });
        }

        if (container && warnings.length > 0) {
            this.displayVisualWarnings(container, warnings, degradationOptions);
        }

        if (onWarning && warnings.length > 0) {
            warnings.forEach(warning => onWarning(warning));
        }

        return {
            warnings,
            degradationOptions,
            hasWarnings: warnings.length > 0,
            severity: this.getMaxSeverity(warnings),
            nodeCount
        };
    }

    /**
     * Display visual warnings in the container
     * @param {HTMLElement} container - Container element
     * @param {Array} warnings - Array of warnings
     * @param {Array} degradationOptions - Array of degradation options
     */
    displayVisualWarnings(container, warnings, degradationOptions) {
        // Remove existing warnings
        const existingWarnings = container.querySelectorAll('.diagram-performance-warning');
        existingWarnings.forEach(el => el.remove());

        // Create warning element
        const warningEl = document.createElement('div');
        warningEl.className = 'diagram-performance-warning';
        warningEl.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 12px;
            max-width: 300px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
        `;

        // Add warning content
        const title = document.createElement('div');
        title.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #856404;';
        title.textContent = 'Performance Notice';
        warningEl.appendChild(title);

        warnings.forEach(warning => {
            const warningDiv = document.createElement('div');
            warningDiv.style.cssText = 'margin-bottom: 6px; color: #856404;';
            warningDiv.textContent = warning.message;
            warningEl.appendChild(warningDiv);
        });

        if (degradationOptions.length > 0) {
            const optionsTitle = document.createElement('div');
            optionsTitle.style.cssText = 'font-weight: bold; margin: 12px 0 6px 0; color: #856404;';
            optionsTitle.textContent = 'Optimization Options:';
            warningEl.appendChild(optionsTitle);

            degradationOptions.forEach(option => {
                const optionDiv = document.createElement('div');
                optionDiv.style.cssText = 'margin-bottom: 4px; font-size: 12px; color: #6c757d;';
                optionDiv.innerHTML = `<strong>${option.name}:</strong> ${option.description}`;
                warningEl.appendChild(optionDiv);
            });
        }

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 4px;
            right: 8px;
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #856404;
        `;
        closeBtn.onclick = () => warningEl.remove();
        warningEl.appendChild(closeBtn);

        container.appendChild(warningEl);

        // Auto-hide after 10 seconds for info warnings
        const maxSeverity = this.getMaxSeverity(warnings);
        if (maxSeverity === 'info') {
            setTimeout(() => {
                if (warningEl.parentNode) {
                    warningEl.remove();
                }
            }, 10000);
        }
    }

    /**
     * Get the maximum severity level from warnings
     * @param {Array} warnings - Array of warnings
     * @returns {string} Maximum severity level
     */
    getMaxSeverity(warnings) {
        if (warnings.some(w => w.level === 'error')) return 'error';
        if (warnings.some(w => w.level === 'warning')) return 'warning';
        return 'info';
    }
}

export { PerformanceMonitor };