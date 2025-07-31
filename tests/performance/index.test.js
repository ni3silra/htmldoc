/**
 * Performance module test suite entry point
 * Tests the main performance module exports and integration
 */

import { 
    PerformanceManager,
    PerformanceMonitor,
    OptimizationStrategies,
    PerformanceConfig,
    STRATEGY_TYPES,
    OPTIMIZATION_LEVELS,
    DEFAULT_CONFIG
} from '../../src/performance/index.js';

describe('Performance Module Integration', () => {
    let performanceManager;

    beforeEach(() => {
        // Mock performance API to avoid JSDOM issues
        Object.defineProperty(global, 'performance', {
            value: {
                now: jest.fn(() => Date.now()),
                memory: {
                    usedJSHeapSize: 50 * 1024 * 1024
                }
            },
            writable: true,
            configurable: true
        });

        performanceManager = new PerformanceManager();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('module exports', () => {
        it('should export all required classes and constants', () => {
            expect(PerformanceManager).toBeDefined();
            expect(PerformanceMonitor).toBeDefined();
            expect(OptimizationStrategies).toBeDefined();
            expect(PerformanceConfig).toBeDefined();
            expect(STRATEGY_TYPES).toBeDefined();
            expect(OPTIMIZATION_LEVELS).toBeDefined();
            expect(DEFAULT_CONFIG).toBeDefined();
        });

        it('should create PerformanceManager instance correctly', () => {
            expect(performanceManager).toBeInstanceOf(PerformanceManager);
            expect(performanceManager.config).toBeDefined();
            expect(performanceManager.monitor).toBeDefined();
            expect(performanceManager.optimizer).toBeDefined();
        });
    });

    describe('performance manager functionality', () => {
        it('should start and end render sessions', () => {
            const graphData = {
                nodes: Array.from({ length: 50 }, (_, i) => ({ id: `node-${i}` })),
                edges: Array.from({ length: 25 }, (_, i) => ({ id: `edge-${i}` }))
            };

            const sessionId = performanceManager.startRenderSession('test-session', graphData);
            expect(sessionId).toBe('test-session');

            const metrics = performanceManager.endRenderSession();
            expect(metrics).toBeDefined();
            expect(metrics.nodeCount).toBe(50);
            expect(metrics.edgeCount).toBe(25);
        });

        it('should optimize large graphs', () => {
            const graphData = {
                nodes: Array.from({ length: 100 }, (_, i) => ({ 
                    id: `node-${i}`,
                    position: { x: i * 10, y: i * 10 }
                })),
                edges: Array.from({ length: 50 }, (_, i) => ({ id: `edge-${i}` }))
            };

            const viewport = { x: 0, y: 0, width: 500, height: 500, zoom: 1 };
            const result = performanceManager.optimizeForLargeGraphs(graphData, viewport);

            expect(result).toBeDefined();
            expect(result.originalCount).toBe(100);
            expect(result.strategies).toBeDefined();
            expect(result.performance).toBeDefined();
        });

        it('should show performance warnings', () => {
            const warnings = performanceManager.showPerformanceWarnings(150, {
                showInConsole: false
            });

            expect(warnings).toBeDefined();
            expect(warnings.hasWarnings).toBe(true);
            expect(warnings.warnings.length).toBeGreaterThan(0);
            expect(warnings.degradationOptions.length).toBeGreaterThan(0);
        });

        it('should handle timing operations', () => {
            performanceManager.startTimer('test-operation');
            
            // Simulate some work
            global.performance.now = jest.fn(() => Date.now() + 100);
            
            const duration = performanceManager.endTimer('test-operation');
            expect(duration).toBeGreaterThanOrEqual(0);
        });

        it('should get performance status', () => {
            // Add some metrics first
            performanceManager.startRenderSession('status-test', { nodes: [], edges: [] });
            performanceManager.endRenderSession();

            const status = performanceManager.getPerformanceStatus();
            expect(status).toBeDefined();
            expect(status.config).toBeDefined();
            expect(status.optimizerStats).toBeDefined();
        });

        it('should update configuration', () => {
            const updates = {
                maxNodesBeforeOptimization: 25,
                enableLazyLoading: false
            };

            performanceManager.updateConfig(updates);
            const config = performanceManager.config.getConfig();
            
            expect(config.maxNodesBeforeOptimization).toBe(25);
            expect(config.enableLazyLoading).toBe(false);
        });
    });

    describe('preset configurations', () => {
        it('should create fast preset', () => {
            const fastManager = PerformanceManager.createWithPreset('fast');
            const config = fastManager.config.getConfig();
            
            expect(config.maxNodesBeforeOptimization).toBe(25);
            expect(config.enableLazyLoading).toBe(true);
            expect(config.enableVirtualization).toBe(true);
        });

        it('should create balanced preset', () => {
            const balancedManager = PerformanceManager.createWithPreset('balanced');
            const config = balancedManager.config.getConfig();
            
            expect(config.maxNodesBeforeOptimization).toBe(50);
            expect(config.enableLazyLoading).toBe(true);
        });

        it('should create quality preset', () => {
            const qualityManager = PerformanceManager.createWithPreset('quality');
            const config = qualityManager.config.getConfig();
            
            expect(config.maxNodesBeforeOptimization).toBe(100);
            expect(config.enableLazyLoading).toBe(false);
            expect(config.enableVirtualization).toBe(false);
        });
    });

    describe('icon loading callbacks', () => {
        it('should handle icon loaded callbacks', () => {
            const callback = jest.fn();
            performanceManager.addIconLoadedCallback(callback);

            // Simulate icon loading
            performanceManager.onIconLoaded('test-node', '<svg>test</svg>');

            expect(callback).toHaveBeenCalledWith('test-node', '<svg>test</svg>');
        });

        it('should remove icon loaded callbacks', () => {
            const callback = jest.fn();
            performanceManager.addIconLoadedCallback(callback);
            performanceManager.removeIconLoadedCallback(callback);

            performanceManager.onIconLoaded('test-node', '<svg>test</svg>');

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('cleanup operations', () => {
        it('should clear all data', () => {
            // Add some data
            performanceManager.startRenderSession('cleanup-test', { nodes: [], edges: [] });
            performanceManager.endRenderSession();

            performanceManager.clearAll();

            const metrics = performanceManager.monitor.getAllMetrics();
            expect(metrics.length).toBe(0);
        });
    });

    describe('viewport updates', () => {
        it('should update viewport and reapply optimizations', () => {
            const graphData = {
                nodes: Array.from({ length: 75 }, (_, i) => ({ 
                    id: `node-${i}`,
                    position: { x: i * 20, y: i * 20 }
                })),
                edges: []
            };

            const viewport = { x: 100, y: 100, width: 400, height: 400, zoom: 1 };
            const result = performanceManager.updateViewport(viewport, graphData);

            expect(result).toBeDefined();
            expect(result.originalCount).toBe(75);
        });
    });

    describe('constants and enums', () => {
        it('should have correct strategy types', () => {
            expect(STRATEGY_TYPES.LAZY_LOADING).toBe('lazy_loading');
            expect(STRATEGY_TYPES.VIRTUALIZATION).toBe('virtualization');
            expect(STRATEGY_TYPES.LEVEL_OF_DETAIL).toBe('level_of_detail');
            expect(STRATEGY_TYPES.BATCHING).toBe('batching');
            expect(STRATEGY_TYPES.CACHING).toBe('caching');
        });

        it('should have correct optimization levels', () => {
            expect(OPTIMIZATION_LEVELS.NONE).toBe('none');
            expect(OPTIMIZATION_LEVELS.BASIC).toBe('basic');
            expect(OPTIMIZATION_LEVELS.AGGRESSIVE).toBe('aggressive');
        });

        it('should have valid default configuration', () => {
            expect(DEFAULT_CONFIG.maxNodesBeforeOptimization).toBe(50);
            expect(DEFAULT_CONFIG.maxRenderTime).toBe(2000);
            expect(DEFAULT_CONFIG.enableLazyLoading).toBe(true);
            expect(DEFAULT_CONFIG.enableVirtualization).toBe(true);
            expect(DEFAULT_CONFIG.showPerformanceWarnings).toBe(true);
        });
    });
});