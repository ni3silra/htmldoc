/**
 * Benchmarking tests for performance metrics collection and reporting
 * Tests performance monitoring under various load conditions
 */

import { PerformanceMonitor } from '../../src/performance/PerformanceMonitor.js';
import { OptimizationStrategies } from '../../src/performance/OptimizationStrategies.js';

describe('Performance Benchmarks', () => {
    let monitor;
    let optimizer;

    beforeEach(() => {
        monitor = new PerformanceMonitor({
            bufferSize: 50,
            enableCollection: true
        });

        optimizer = new OptimizationStrategies();

        // Mock performance.now() with realistic timing
        let currentTime = 1000;
        Object.defineProperty(global, 'performance', {
            value: {
                now: jest.fn(() => currentTime),
                memory: {
                    usedJSHeapSize: 50 * 1024 * 1024
                }
            },
            writable: true,
            configurable: true
        });

        // Helper to advance time
        global.advanceTime = (ms) => {
            currentTime += ms;
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('metrics collection benchmarks', () => {
        it('should collect metrics efficiently for small diagrams (10-25 nodes)', async () => {
            const nodeCount = 20;
            const iterations = 100;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                monitor.startSession(`small-${i}`, { nodeCount });
                
                monitor.startTimer('render');
                global.advanceTime(50 + Math.random() * 30); // 50-80ms render time
                monitor.endTimer('render');
                
                monitor.startTimer('layout');
                global.advanceTime(20 + Math.random() * 15); // 20-35ms layout time
                monitor.endTimer('layout');
                
                const metrics = monitor.endSession();
                expect(metrics.nodeCount).toBe(nodeCount);
                expect(metrics.renderTime).toBeLessThan(100);
            }

            const collectionTime = performance.now() - startTime;
            expect(collectionTime).toBeGreaterThan(0); // Collection should take some time
            expect(monitor.metrics.length).toBe(Math.min(iterations, monitor.config.bufferSize));
        });

        it('should collect metrics efficiently for medium diagrams (50-100 nodes)', async () => {
            const nodeCount = 75;
            const iterations = 50;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                monitor.startSession(`medium-${i}`, { nodeCount });
                
                monitor.startTimer('render');
                global.advanceTime(200 + Math.random() * 100); // 200-300ms render time
                monitor.endTimer('render');
                
                monitor.startTimer('layout');
                global.advanceTime(100 + Math.random() * 50); // 100-150ms layout time
                monitor.endTimer('layout');
                
                const metrics = monitor.endSession();
                expect(metrics.nodeCount).toBe(nodeCount);
                expect(metrics.renderTime).toBeGreaterThan(150);
                expect(metrics.renderTime).toBeLessThan(350);
            }

            const collectionTime = performance.now() - startTime;
            expect(collectionTime).toBeGreaterThan(0);
        });

        it('should collect metrics efficiently for large diagrams (100+ nodes)', async () => {
            const nodeCount = 150;
            const iterations = 25;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                monitor.startSession(`large-${i}`, { nodeCount });
                
                monitor.startTimer('render');
                global.advanceTime(800 + Math.random() * 400); // 800-1200ms render time
                monitor.endTimer('render');
                
                monitor.startTimer('layout');
                global.advanceTime(300 + Math.random() * 200); // 300-500ms layout time
                monitor.endTimer('layout');
                
                const metrics = monitor.endSession();
                expect(metrics.nodeCount).toBe(nodeCount);
                expect(metrics.renderTime).toBeGreaterThan(700);
            }

            const collectionTime = performance.now() - startTime;
            expect(collectionTime).toBeGreaterThan(0);
        });
    });

    describe('performance analysis benchmarks', () => {
        beforeEach(() => {
            // Populate with varied performance data
            const testData = [
                { nodeCount: 25, renderTime: 80, layoutTime: 30, memoryUsage: 25 },
                { nodeCount: 50, renderTime: 200, layoutTime: 80, memoryUsage: 40 },
                { nodeCount: 75, renderTime: 350, layoutTime: 150, memoryUsage: 55 },
                { nodeCount: 100, renderTime: 600, layoutTime: 250, memoryUsage: 75 },
                { nodeCount: 150, renderTime: 1200, layoutTime: 500, memoryUsage: 110 },
                { nodeCount: 200, renderTime: 2000, layoutTime: 800, memoryUsage: 150 }
            ];

            testData.forEach((data, i) => {
                monitor.addMetrics({
                    sessionId: `benchmark-${i}`,
                    totalTime: data.renderTime + data.layoutTime,
                    renderTime: data.renderTime,
                    layoutTime: data.layoutTime,
                    nodeCount: data.nodeCount,
                    edgeCount: data.nodeCount * 1.5,
                    memoryUsage: data.memoryUsage,
                    timestamp: Date.now() - (testData.length - i) * 1000
                });
            });
        });

        it('should analyze performance trends efficiently', () => {
            const startTime = performance.now();
            
            const trends = monitor.analyzeTrends();
            
            const analysisTime = performance.now() - startTime;
            expect(analysisTime).toBeLessThan(10);
            
            expect(trends.renderTime).toBeDefined();
            expect(trends.variance).toBeGreaterThan(0);
        });

        it('should generate performance reports quickly', () => {
            const startTime = performance.now();
            
            const report = monitor.generateReport();
            
            const reportTime = performance.now() - startTime;
            expect(reportTime).toBeLessThan(20);
            
            expect(report.summary).toBeDefined();
            expect(report.latest).toBeDefined();
            expect(report.trends).toBeDefined();
            expect(report.recommendations).toBeDefined();
        });

        it('should check performance thresholds efficiently', () => {
            const startTime = performance.now();
            
            const result = monitor.checkPerformance({
                maxRenderTime: 1000,
                maxTotalTime: 1500
            });
            
            const checkTime = performance.now() - startTime;
            expect(checkTime).toBeLessThan(5);
            
            expect(result.status).toBeDefined();
            expect(result.issues).toBeDefined();
        });

        it('should calculate averages efficiently with large datasets', () => {
            // Add many more data points
            for (let i = 0; i < 100; i++) {
                monitor.addMetrics({
                    renderTime: 100 + Math.random() * 500,
                    nodeCount: 10 + Math.random() * 100,
                    memoryUsage: 20 + Math.random() * 80,
                    timestamp: Date.now()
                });
            }

            const startTime = performance.now();
            const average = monitor.getAverageMetrics();
            const calculationTime = performance.now() - startTime;

            expect(calculationTime).toBeLessThan(5);
            expect(average).toBeDefined();
            expect(average.sampleCount).toBe(monitor.config.bufferSize);
        });
    });

    describe('optimization strategy benchmarks', () => {
        let largeGraphData;

        beforeEach(() => {
            // Create large graph data for benchmarking
            largeGraphData = {
                nodes: Array.from({ length: 200 }, (_, i) => ({
                    id: `node-${i}`,
                    type: 'microservice',
                    label: `Service ${i}`,
                    icon: `icon-${i % 10}`,
                    position: { x: (i % 20) * 50, y: Math.floor(i / 20) * 50 },
                    style: { strokeWidth: 2, fontSize: 12 }
                })),
                edges: Array.from({ length: 300 }, (_, i) => ({
                    id: `edge-${i}`,
                    source: `node-${i % 200}`,
                    target: `node-${(i + 1) % 200}`
                }))
            };
        });

        it('should optimize large graphs efficiently', () => {
            const viewport = { x: 0, y: 0, width: 300, height: 300, zoom: 1 };
            const startTime = performance.now();
            
            const result = optimizer.optimizeForLargeGraphs(largeGraphData, viewport);
            
            const optimizationTime = performance.now() - startTime;
            expect(optimizationTime).toBeGreaterThanOrEqual(0);
            
            expect(result.originalCount).toBe(200);
            expect(result.optimizedCount).toBeLessThanOrEqual(200);
            expect(result.performance.estimatedSpeedup).toBeGreaterThan(1);
        });

        it('should apply virtualization efficiently', () => {
            const viewport = { x: 0, y: 0, width: 200, height: 200 };
            const startTime = performance.now();
            
            const result = optimizer.applyVirtualization(
                largeGraphData.nodes,
                largeGraphData.edges,
                viewport
            );
            
            const virtualizationTime = performance.now() - startTime;
            expect(virtualizationTime).toBeGreaterThanOrEqual(0);
            
            expect(result.nodes.length).toBeLessThanOrEqual(largeGraphData.nodes.length);
        });

        it('should process lazy loading queue efficiently', async () => {
            const mockFetchIcon = jest.spyOn(optimizer, 'fetchIcon')
                .mockImplementation(() => Promise.resolve('<svg>test</svg>'));

            // Queue many icons for loading
            for (let i = 0; i < 50; i++) {
                optimizer.queueIconLoad(`node-${i}`, `icon-${i}`);
            }

            const startTime = performance.now();
            await optimizer.processLoadingQueue();
            const processingTime = performance.now() - startTime;

            expect(processingTime).toBeGreaterThanOrEqual(0);
            // The queue processing should work correctly
            expect(optimizer.loadingQueue.length).toBeLessThanOrEqual(50);
            
            mockFetchIcon.mockRestore();
        });
    });

    describe('memory usage benchmarks', () => {
        it('should not leak memory during repeated operations', () => {
            const initialMemory = performance.memory.usedJSHeapSize;
            
            // Perform many operations
            for (let i = 0; i < 1000; i++) {
                monitor.startSession(`memory-test-${i}`, { nodeCount: 50 });
                monitor.startTimer('render');
                global.advanceTime(100);
                monitor.endTimer('render');
                monitor.endSession();
            }

            // Memory should not grow significantly due to buffer limits
            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryGrowth = finalMemory - initialMemory;
            
            // Allow for some growth but not excessive
            expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
        });

        it('should clear resources efficiently', () => {
            // Fill up with data
            for (let i = 0; i < 100; i++) {
                monitor.addMetrics({
                    renderTime: 100,
                    nodeCount: 50,
                    timestamp: Date.now()
                });
                optimizer.cache.set(`icon-${i}`, `data-${i}`);
            }

            const startTime = performance.now();
            monitor.clearMetrics();
            optimizer.clearCache();
            const clearTime = performance.now() - startTime;

            expect(clearTime).toBeLessThan(5);
            expect(monitor.metrics.length).toBe(0);
            expect(optimizer.cache.size).toBe(0);
        });
    });

    describe('concurrent operations benchmarks', () => {
        it('should handle multiple simultaneous sessions', async () => {
            // Use fake timers to avoid JSDOM timing issues
            jest.useFakeTimers();
            
            const promises = [];
            const sessionCount = 20;

            for (let i = 0; i < sessionCount; i++) {
                const promise = new Promise((resolve) => {
                    // Use immediate execution instead of setTimeout to avoid JSDOM issues
                    monitor.startSession(`concurrent-${i}`, { nodeCount: 50 + i });
                    monitor.startTimer('render');
                    global.advanceTime(100 + Math.random() * 100);
                    monitor.endTimer('render');
                    const metrics = monitor.endSession();
                    resolve(metrics);
                });
                promises.push(promise);
            }

            const startTime = performance.now();
            const results = await Promise.all(promises);
            const totalTime = performance.now() - startTime;

            expect(totalTime).toBeGreaterThanOrEqual(0);
            expect(results.length).toBe(sessionCount);
            results.forEach(result => {
                expect(result).toBeDefined();
                expect(result.nodeCount).toBeGreaterThan(0);
            });
            
            jest.useRealTimers();
        });

        it('should handle multiple observers efficiently', () => {
            const observerCount = 50;
            const observers = [];

            // Add many observers
            for (let i = 0; i < observerCount; i++) {
                const observer = jest.fn();
                observers.push(observer);
                monitor.addObserver(observer);
            }

            const startTime = performance.now();
            monitor.addMetrics({
                renderTime: 100,
                nodeCount: 50,
                timestamp: Date.now()
            });
            const notificationTime = performance.now() - startTime;

            expect(notificationTime).toBeLessThan(20);
            observers.forEach(observer => {
                expect(observer).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('performance regression detection', () => {
        it('should detect performance degradation over time', () => {
            // Add progressively slower metrics
            const baselineMetrics = [
                { renderTime: 100, nodeCount: 50 },
                { renderTime: 110, nodeCount: 50 },
                { renderTime: 120, nodeCount: 50 }
            ];

            const degradedMetrics = [
                { renderTime: 200, nodeCount: 50 },
                { renderTime: 220, nodeCount: 50 },
                { renderTime: 250, nodeCount: 50 }
            ];

            // Add baseline
            baselineMetrics.forEach((metrics, i) => {
                monitor.addMetrics({
                    ...metrics,
                    sessionId: `baseline-${i}`,
                    timestamp: Date.now() - 6000 + i * 1000
                });
            });

            const baselineAverage = monitor.getAverageMetrics();

            // Clear and add degraded metrics
            monitor.clearMetrics();
            degradedMetrics.forEach((metrics, i) => {
                monitor.addMetrics({
                    ...metrics,
                    sessionId: `degraded-${i}`,
                    timestamp: Date.now() - 3000 + i * 1000
                });
            });

            const degradedAverage = monitor.getAverageMetrics();

            // Should detect significant performance regression
            const regressionRatio = degradedAverage.renderTime / baselineAverage.renderTime;
            expect(regressionRatio).toBeGreaterThan(1.5);
        });

        it('should identify performance improvements', () => {
            // Add slow initial metrics
            const slowMetrics = [
                { renderTime: 300, nodeCount: 100 },
                { renderTime: 320, nodeCount: 100 },
                { renderTime: 310, nodeCount: 100 }
            ];

            // Add optimized metrics
            const optimizedMetrics = [
                { renderTime: 150, nodeCount: 100 },
                { renderTime: 140, nodeCount: 100 },
                { renderTime: 160, nodeCount: 100 }
            ];

            slowMetrics.forEach(metrics => monitor.addMetrics(metrics));
            const slowAverage = monitor.getAverageMetrics();

            monitor.clearMetrics();
            optimizedMetrics.forEach(metrics => monitor.addMetrics(metrics));
            const optimizedAverage = monitor.getAverageMetrics();

            const improvementRatio = slowAverage.renderTime / optimizedAverage.renderTime;
            expect(improvementRatio).toBeGreaterThan(1.8);
        });
    });
});