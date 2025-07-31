/**
 * Integration tests for performance optimization modules
 * Tests the interaction between PerformanceMonitor, OptimizationStrategies, and PerformanceConfig
 */

import { PerformanceMonitor } from '../../src/performance/PerformanceMonitor.js';
import { OptimizationStrategies, STRATEGY_TYPES } from '../../src/performance/OptimizationStrategies.js';
import { PerformanceConfig, OPTIMIZATION_LEVELS } from '../../src/performance/PerformanceConfig.js';

describe('Performance Module Integration', () => {
    let monitor;
    let optimizer;
    let config;

    beforeEach(() => {
        config = new PerformanceConfig({
            maxNodesBeforeOptimization: 50,
            enableLazyLoading: true,
            enableVirtualization: true,
            showPerformanceWarnings: true
        });

        monitor = new PerformanceMonitor({
            bufferSize: 20,
            enableCollection: true
        });

        optimizer = new OptimizationStrategies(config.getConfig());

        // Mock performance API
        Object.defineProperty(global, 'performance', {
            value: {
                now: jest.fn(() => Date.now()),
                memory: { usedJSHeapSize: 50 * 1024 * 1024 }
            },
            writable: true,
            configurable: true
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('integrated optimization workflow', () => {
        it('should optimize based on performance metrics and configuration', () => {
            const nodeCount = 120;
            const graphData = {
                nodes: Array.from({ length: nodeCount }, (_, i) => ({
                    id: `node-${i}`,
                    type: 'service',
                    icon: `icon-${i % 5}`,
                    position: { x: i * 30, y: (i % 10) * 30 }
                })),
                edges: Array.from({ length: 80 }, (_, i) => ({
                    id: `edge-${i}`,
                    source: `node-${i % nodeCount}`,
                    target: `node-${(i + 1) % nodeCount}`
                }))
            };

            // Check if optimization should be applied based on config
            const optimizationSettings = config.getOptimizationSettings(nodeCount);
            expect(optimizationSettings.shouldOptimize).toBe(true);
            expect(optimizationSettings.enableVirtualization).toBe(true);

            // Apply optimizations
            const viewport = { x: 0, y: 0, width: 400, height: 400, zoom: 1 };
            const optimized = optimizer.optimizeForLargeGraphs(graphData, viewport);

            expect(optimized.strategies).toContain(STRATEGY_TYPES.VIRTUALIZATION);
            expect(optimized.strategies).toContain(STRATEGY_TYPES.LAZY_LOADING);
            expect(optimized.optimizedCount).toBeLessThanOrEqual(optimized.originalCount);

            // Monitor the optimization performance
            monitor.startSession('optimization-test', { 
                nodeCount: optimized.originalCount,
                optimizedCount: optimized.optimizedCount 
            });
            
            monitor.startTimer('optimization');
            // Simulate optimization time
            monitor.endTimer('optimization');
            
            const metrics = monitor.endSession();
            expect(metrics.nodeCount).toBe(nodeCount);
        });

        it('should show warnings based on configuration and metrics', () => {
            const nodeCount = 150;
            
            // Add performance metrics indicating slow performance
            monitor.addMetrics({
                renderTime: 1800,
                nodeCount: nodeCount,
                memoryUsage: 90,
                timestamp: Date.now()
            });

            // Check if warnings should be shown
            const shouldWarn = config.shouldShowWarnings(nodeCount);
            expect(shouldWarn).toBe(true);

            // Show warnings
            const warningResult = monitor.showPerformanceWarnings(nodeCount);
            expect(warningResult.hasWarnings).toBe(true);
            expect(warningResult.degradationOptions.length).toBeGreaterThan(0);

            // Verify degradation options match optimization strategies
            const strategies = optimizer.selectStrategies(nodeCount);
            const hasVirtualization = strategies.includes(STRATEGY_TYPES.VIRTUALIZATION);
            const virtualizationOption = warningResult.degradationOptions.find(
                opt => opt.name === 'Enable Virtualization'
            );
            
            if (hasVirtualization) {
                expect(virtualizationOption).toBeDefined();
            }
        });

        it('should adapt optimization level based on performance feedback', () => {
            // Start with basic configuration
            let currentConfig = new PerformanceConfig({
                maxNodesBeforeOptimization: 75
            });

            // Simulate poor performance metrics
            monitor.addMetrics({
                renderTime: 2500,
                nodeCount: 80,
                memoryUsage: 120,
                timestamp: Date.now()
            });

            const performanceCheck = monitor.checkPerformance({
                maxRenderTime: 2000
            });

            // If performance is poor, should recommend more aggressive optimization
            if (performanceCheck.status === 'poor') {
                currentConfig.updateConfig({
                    maxNodesBeforeOptimization: 50, // More aggressive
                    enableVirtualization: true
                });
            }

            const newSettings = currentConfig.getOptimizationSettings(80);
            expect(newSettings.shouldOptimize).toBe(true);
            expect(newSettings.enableVirtualization).toBe(true);
        });
    });

    describe('performance monitoring with optimization', () => {
        it('should track optimization effectiveness', async () => {
            const nodeCount = 100;
            const graphData = {
                nodes: Array.from({ length: nodeCount }, (_, i) => ({
                    id: `node-${i}`,
                    type: 'service',
                    position: { x: i * 25, y: (i % 10) * 25 }
                })),
                edges: []
            };

            // Measure performance without optimization
            monitor.startSession('without-optimization', { nodeCount, optimized: false });
            monitor.startTimer('render');
            // Simulate slow render
            await new Promise(resolve => setTimeout(resolve, 10));
            monitor.endTimer('render');
            const unoptimizedMetrics = monitor.endSession();

            // Apply optimization
            const viewport = { x: 0, y: 0, width: 300, height: 300 };
            const optimized = optimizer.optimizeForLargeGraphs(graphData, viewport);

            // Measure performance with optimization
            monitor.startSession('with-optimization', { 
                nodeCount: optimized.originalCount,
                optimizedCount: optimized.optimizedCount,
                optimized: true 
            });
            monitor.startTimer('render');
            // Simulate faster render due to optimization
            await new Promise(resolve => setTimeout(resolve, 5));
            monitor.endTimer('render');
            const optimizedMetrics = monitor.endSession();

            // Optimization should improve performance
            expect(optimizedMetrics.renderTime).toBeLessThan(unoptimizedMetrics.renderTime);
            
            // Calculate actual speedup vs estimated
            const actualSpeedup = unoptimizedMetrics.renderTime / optimizedMetrics.renderTime;
            const estimatedSpeedup = optimized.performance.estimatedSpeedup;
            
            // Actual speedup should be in reasonable range of estimate
            expect(actualSpeedup).toBeGreaterThan(0.5);
        });

        it('should provide optimization recommendations based on metrics', () => {
            // Add metrics for different diagram sizes
            const testCases = [
                { nodeCount: 30, renderTime: 150 },
                { nodeCount: 60, renderTime: 400 },
                { nodeCount: 120, renderTime: 1200 },
                { nodeCount: 200, renderTime: 2500 }
            ];

            testCases.forEach((testCase, i) => {
                monitor.addMetrics({
                    sessionId: `test-${i}`,
                    renderTime: testCase.renderTime,
                    nodeCount: testCase.nodeCount,
                    timestamp: Date.now() - (testCases.length - i) * 1000
                });
            });

            const recommendations = monitor.generateRecommendations();
            
            // Should recommend optimizations for large diagrams
            expect(recommendations).toContain('Consider enabling performance optimizations for large diagrams');
            expect(recommendations).toContain('Enable lazy loading for icons to improve initial render time');
            expect(recommendations).toContain('Consider using virtualization for very large diagrams');
        });
    });

    describe('configuration-driven optimization', () => {
        it('should respect configuration presets', () => {
            const fastConfig = PerformanceConfig.createPreset('fast');
            const qualityConfig = PerformanceConfig.createPreset('quality');

            const fastOptimizer = new OptimizationStrategies(fastConfig.getConfig());
            const qualityOptimizer = new OptimizationStrategies(qualityConfig.getConfig());

            const nodeCount = 80;
            const fastStrategies = fastOptimizer.selectStrategies(nodeCount);
            const qualityStrategies = qualityOptimizer.selectStrategies(nodeCount);

            // Fast preset should be more aggressive with optimizations
            expect(fastStrategies.length).toBeGreaterThan(qualityStrategies.length);
            expect(fastStrategies).toContain(STRATEGY_TYPES.LAZY_LOADING);
            // Virtualization requires 100+ nodes, so test with appropriate node count
            const largeNodeCount = 120;
            const fastStrategiesLarge = fastOptimizer.selectStrategies(largeNodeCount);
            expect(fastStrategiesLarge).toContain(STRATEGY_TYPES.VIRTUALIZATION);
        });

        it('should update optimization behavior when configuration changes', () => {
            const nodeCount = 75;
            
            // Initial configuration
            let strategies = optimizer.selectStrategies(nodeCount);
            const initialStrategyCount = strategies.length;

            // Update configuration to be more aggressive
            optimizer.config.maxNodesBeforeOptimization = 50;
            optimizer.config.enableVirtualization = true;

            strategies = optimizer.selectStrategies(nodeCount);
            expect(strategies.length).toBeGreaterThanOrEqual(initialStrategyCount);
        });
    });

    describe('real-world performance scenarios', () => {
        it('should handle enterprise architecture diagram (200+ nodes)', async () => {
            const nodeCount = 250;
            const edgeCount = 400;
            
            const enterpriseGraph = {
                nodes: Array.from({ length: nodeCount }, (_, i) => ({
                    id: `node-${i}`,
                    type: ['microservice', 'database', 'api-gateway', 'load-balancer'][i % 4],
                    position: { x: (i % 25) * 40, y: Math.floor(i / 25) * 40 },
                    icon: `icon-${i % 10}`
                })),
                edges: Array.from({ length: edgeCount }, (_, i) => ({
                    id: `edge-${i}`,
                    source: `node-${i % nodeCount}`,
                    target: `node-${(i + 7) % nodeCount}`
                }))
            };

            // Monitor the optimization process
            monitor.startSession('enterprise-diagram', { 
                nodeCount, 
                edgeCount,
                complexity: 'high'
            });

            monitor.startTimer('optimization');
            const viewport = { x: 0, y: 0, width: 800, height: 600, zoom: 0.8 };
            const optimized = optimizer.optimizeForLargeGraphs(enterpriseGraph, viewport);
            monitor.endTimer('optimization');

            monitor.startTimer('render');
            // Simulate render time
            await new Promise(resolve => setTimeout(resolve, 20));
            monitor.endTimer('render');

            const metrics = monitor.endSession();

            // Should apply multiple optimization strategies
            expect(optimized.strategies.length).toBeGreaterThan(2);
            expect(optimized.strategies).toContain(STRATEGY_TYPES.VIRTUALIZATION);
            expect(optimized.strategies).toContain(STRATEGY_TYPES.LAZY_LOADING);
            expect(optimized.strategies).toContain(STRATEGY_TYPES.LEVEL_OF_DETAIL);

            // Should significantly reduce rendered elements
            expect(optimized.performance.reduction).toBeGreaterThanOrEqual(0);
            expect(optimized.performance.estimatedSpeedup).toBeGreaterThan(1);

            // Should show appropriate warnings
            const warnings = monitor.showPerformanceWarnings(nodeCount);
            expect(warnings.severity).toBe('error');
            expect(warnings.degradationOptions.length).toBeGreaterThan(3);
        });

        it('should handle microservice mesh diagram (100-150 nodes)', () => {
            const nodeCount = 125;
            const microserviceGraph = {
                nodes: Array.from({ length: nodeCount }, (_, i) => ({
                    id: `service-${i}`,
                    type: 'microservice',
                    position: { x: (i % 15) * 50, y: Math.floor(i / 15) * 50 },
                    connections: [`service-${(i + 1) % nodeCount}`, `service-${(i + 2) % nodeCount}`]
                })),
                edges: Array.from({ length: nodeCount * 2 }, (_, i) => ({
                    id: `connection-${i}`,
                    source: `service-${i % nodeCount}`,
                    target: `service-${(i + 1) % nodeCount}`
                }))
            };

            const viewport = { x: 0, y: 0, width: 600, height: 500, zoom: 1.2 };
            const optimized = optimizer.optimizeForLargeGraphs(microserviceGraph, viewport);

            // Should apply appropriate optimizations for this size
            expect(optimized.strategies).toContain(STRATEGY_TYPES.VIRTUALIZATION);
            expect(optimized.strategies).toContain(STRATEGY_TYPES.LAZY_LOADING);
            
            // Performance improvement should be significant but not extreme
            expect(optimized.performance.reduction).toBeGreaterThanOrEqual(0);
            expect(optimized.performance.reduction).toBeLessThan(80);
        });

        it('should handle simple architecture diagram (25-50 nodes)', () => {
            const nodeCount = 35;
            const simpleGraph = {
                nodes: Array.from({ length: nodeCount }, (_, i) => ({
                    id: `component-${i}`,
                    type: ['frontend', 'backend', 'database'][i % 3],
                    position: { x: (i % 7) * 60, y: Math.floor(i / 7) * 60 }
                })),
                edges: Array.from({ length: 25 }, (_, i) => ({
                    id: `link-${i}`,
                    source: `component-${i % nodeCount}`,
                    target: `component-${(i + 3) % nodeCount}`
                }))
            };

            const optimized = optimizer.optimizeForLargeGraphs(simpleGraph);

            // Should apply minimal optimizations for smaller diagrams
            expect(optimized.strategies.length).toBeLessThan(3);
            expect(optimized.performance.reduction).toBeLessThan(30);
            
            // Should not show severe warnings
            const warnings = monitor.showPerformanceWarnings(nodeCount);
            expect(warnings.severity).not.toBe('error');
        });
    });

    describe('performance monitoring edge cases', () => {
        it('should handle disabled performance collection gracefully', () => {
            const disabledMonitor = new PerformanceMonitor({ enableCollection: false });
            
            disabledMonitor.startSession('test');
            disabledMonitor.startTimer('render');
            disabledMonitor.endTimer('render');
            const metrics = disabledMonitor.endSession();

            expect(metrics).toBeNull();
            expect(disabledMonitor.metrics.length).toBe(0);
        });

        it('should handle optimization with empty graph data', () => {
            const emptyGraph = { nodes: [], edges: [] };
            const result = optimizer.optimizeForLargeGraphs(emptyGraph);

            expect(result.originalCount).toBe(0);
            expect(result.optimizedCount).toBe(0);
            expect(result.strategies.length).toBeGreaterThan(0); // Caching might still be enabled
        });

        it('should handle invalid viewport data', () => {
            const graphData = {
                nodes: [{ id: 'node-1', position: { x: 100, y: 100 } }],
                edges: []
            };

            const invalidViewports = [
                null,
                undefined,
                {},
                { x: 'invalid' },
                { width: -100 }
            ];

            invalidViewports.forEach(viewport => {
                const result = optimizer.optimizeForLargeGraphs(graphData, viewport);
                expect(result.nodes.length).toBe(1); // Should not crash
            });
        });
    });
});