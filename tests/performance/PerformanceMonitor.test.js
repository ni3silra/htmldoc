/**
 * Unit tests for PerformanceMonitor class
 * Tests performance metrics collection, analysis, and warning systems
 */

import { PerformanceMonitor } from '../../src/performance/PerformanceMonitor.js';

describe('PerformanceMonitor', () => {
    let monitor;
    let mockPerformance;

    beforeEach(() => {
        // Mock performance.now()
        mockPerformance = {
            now: jest.fn(() => 1000),
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024 // 50MB
            }
        };
        
        // Use Object.defineProperty to properly mock performance
        Object.defineProperty(global, 'performance', {
            value: mockPerformance,
            writable: true,
            configurable: true
        });

        monitor = new PerformanceMonitor({
            bufferSize: 5,
            enableCollection: true
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default configuration', () => {
            const defaultMonitor = new PerformanceMonitor();
            expect(defaultMonitor.config.bufferSize).toBe(10);
            expect(defaultMonitor.config.enableCollection).toBe(true);
        });

        it('should initialize with custom configuration', () => {
            const customMonitor = new PerformanceMonitor({
                bufferSize: 20,
                enableCollection: false
            });
            expect(customMonitor.config.bufferSize).toBe(20);
            expect(customMonitor.config.enableCollection).toBe(false);
        });

        it('should initialize empty metrics and observers arrays', () => {
            expect(monitor.metrics).toEqual([]);
            expect(monitor.observers).toEqual([]);
            expect(monitor.currentSession).toBeNull();
        });
    });

    describe('session management', () => {
        it('should start a performance session', () => {
            const context = { nodeCount: 25, edgeCount: 30 };
            monitor.startSession('test-session', context);

            expect(monitor.currentSession).toBeDefined();
            expect(monitor.currentSession.id).toBe('test-session');
            expect(monitor.currentSession.context).toEqual(context);
            expect(monitor.currentSession.startTime).toBe(1000);
        });

        it('should not start session when collection is disabled', () => {
            const disabledMonitor = new PerformanceMonitor({ enableCollection: false });
            disabledMonitor.startSession('test-session');
            expect(disabledMonitor.currentSession).toBeNull();
        });

        it('should end session and return metrics', () => {
            // Set up mock to return different values for different calls
            let callCount = 0;
            mockPerformance.now.mockImplementation(() => {
                callCount++;
                if (callCount === 1) return 1000; // startSession
                if (callCount === 2) return 1000; // startTimer
                if (callCount === 3) return 1200; // endTimer
                return 1500; // endSession
            });
            
            monitor.startSession('test-session', { nodeCount: 50 });
            monitor.startTimer('render');
            monitor.endTimer('render');
            
            const metrics = monitor.endSession();

            expect(metrics).toBeDefined();
            expect(metrics.sessionId).toBe('test-session');
            expect(metrics.totalTime).toBe(500);
            expect(metrics.renderTime).toBe(200);
            expect(metrics.nodeCount).toBe(50);
            expect(metrics.memoryUsage).toBe(50);
        });

        it('should return null when ending session with collection disabled', () => {
            const disabledMonitor = new PerformanceMonitor({ enableCollection: false });
            const metrics = disabledMonitor.endSession();
            expect(metrics).toBeNull();
        });
    });

    describe('timer management', () => {
        beforeEach(() => {
            monitor.startSession('test-session');
        });

        it('should start and end timers correctly', () => {
            mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1300);
            
            monitor.startTimer('layout');
            const duration = monitor.endTimer('layout');

            expect(duration).toBe(300);
            expect(monitor.currentSession.measurements.layout).toBe(300);
        });

        it('should return 0 for non-existent timer', () => {
            const duration = monitor.endTimer('non-existent');
            expect(duration).toBe(0);
        });

        it('should not start timer when collection is disabled', () => {
            const disabledMonitor = new PerformanceMonitor({ enableCollection: false });
            disabledMonitor.startTimer('test');
            expect(disabledMonitor.timers.size).toBe(0);
        });
    });

    describe('metrics collection with varying diagram sizes', () => {
        it('should collect metrics for small diagrams (10-25 nodes)', () => {
            const smallDiagramMetrics = {
                sessionId: 'small-diagram',
                totalTime: 150,
                renderTime: 80,
                layoutTime: 50,
                nodeCount: 15,
                edgeCount: 20,
                memoryUsage: 25,
                timestamp: Date.now()
            };

            monitor.addMetrics(smallDiagramMetrics);
            const latest = monitor.getLatestMetrics();

            expect(latest).toEqual(smallDiagramMetrics);
            expect(latest.nodeCount).toBeLessThan(26);
        });

        it('should collect metrics for medium diagrams (50-100 nodes)', () => {
            const mediumDiagramMetrics = {
                sessionId: 'medium-diagram',
                totalTime: 800,
                renderTime: 500,
                layoutTime: 250,
                nodeCount: 75,
                edgeCount: 120,
                memoryUsage: 60,
                timestamp: Date.now()
            };

            monitor.addMetrics(mediumDiagramMetrics);
            const latest = monitor.getLatestMetrics();

            expect(latest.nodeCount).toBeGreaterThanOrEqual(50);
            expect(latest.nodeCount).toBeLessThan(101);
            expect(latest.renderTime).toBeGreaterThan(400);
        });

        it('should collect metrics for large diagrams (100+ nodes)', () => {
            const largeDiagramMetrics = {
                sessionId: 'large-diagram',
                totalTime: 2500,
                renderTime: 1800,
                layoutTime: 600,
                nodeCount: 150,
                edgeCount: 250,
                memoryUsage: 120,
                timestamp: Date.now()
            };

            monitor.addMetrics(largeDiagramMetrics);
            const latest = monitor.getLatestMetrics();

            expect(latest.nodeCount).toBeGreaterThan(100);
            expect(latest.renderTime).toBeGreaterThan(1000);
            expect(latest.memoryUsage).toBeGreaterThan(100);
        });

        it('should handle complex diagrams with many connections', () => {
            const complexDiagramMetrics = {
                sessionId: 'complex-diagram',
                totalTime: 3200,
                renderTime: 2100,
                layoutTime: 900,
                nodeCount: 80,
                edgeCount: 400, // High edge-to-node ratio
                memoryUsage: 95,
                timestamp: Date.now()
            };

            monitor.addMetrics(complexDiagramMetrics);
            const latest = monitor.getLatestMetrics();

            expect(latest.edgeCount / latest.nodeCount).toBeGreaterThan(4);
            expect(latest.layoutTime).toBeGreaterThan(800);
        });
    });

    describe('metrics buffer management', () => {
        it('should maintain buffer size limit', () => {
            // Add more metrics than buffer size
            for (let i = 0; i < 8; i++) {
                monitor.addMetrics({
                    sessionId: `session-${i}`,
                    totalTime: 100 + i * 10,
                    renderTime: 50 + i * 5,
                    nodeCount: 10 + i,
                    timestamp: Date.now()
                });
            }

            expect(monitor.metrics.length).toBe(5); // Buffer size limit
            expect(monitor.metrics[0].sessionId).toBe('session-3'); // Oldest removed
        });

        it('should calculate average metrics correctly', () => {
            const testMetrics = [
                { totalTime: 100, renderTime: 60, nodeCount: 10, memoryUsage: 20 },
                { totalTime: 200, renderTime: 120, nodeCount: 20, memoryUsage: 30 },
                { totalTime: 300, renderTime: 180, nodeCount: 30, memoryUsage: 40 }
            ];

            testMetrics.forEach(metrics => monitor.addMetrics(metrics));
            const average = monitor.getAverageMetrics();

            expect(average.totalTime).toBe(200);
            expect(average.renderTime).toBe(120);
            expect(average.nodeCount).toBe(20);
            expect(average.memoryUsage).toBe(30);
            expect(average.sampleCount).toBe(3);
        });

        it('should return null for average when no metrics exist', () => {
            const average = monitor.getAverageMetrics();
            expect(average).toBeNull();
        });
    });

    describe('performance analysis', () => {
        beforeEach(() => {
            // Add some test metrics
            monitor.addMetrics({
                totalTime: 1500,
                renderTime: 1000,
                nodeCount: 50,
                memoryUsage: 45,
                timestamp: Date.now()
            });
        });

        it('should check performance against thresholds', () => {
            const result = monitor.checkPerformance({
                maxRenderTime: 800,
                maxTotalTime: 1200
            });

            expect(result.status).toBe('poor');
            expect(result.issues.length).toBeGreaterThanOrEqual(2);
            expect(result.issues.some(issue => issue.type === 'slow_render')).toBe(true);
            expect(result.issues.some(issue => issue.type === 'slow_total')).toBe(true);
        });

        it('should identify good performance', () => {
            monitor.addMetrics({
                totalTime: 500,
                renderTime: 300,
                nodeCount: 25,
                memoryUsage: 20,
                timestamp: Date.now()
            });

            const result = monitor.checkPerformance();
            expect(result.status).toBe('good');
            expect(result.issues).toHaveLength(0);
        });

        it('should analyze performance trends', () => {
            // Add trending data
            monitor.addMetrics({ renderTime: 100, timestamp: Date.now() - 3000 });
            monitor.addMetrics({ renderTime: 150, timestamp: Date.now() - 2000 });
            monitor.addMetrics({ renderTime: 200, timestamp: Date.now() - 1000 });

            const trends = monitor.analyzeTrends();
            expect(trends.renderTime).toBe('increasing');
            expect(trends.variance).toBeGreaterThan(0);
        });

        it('should return insufficient data for trends with few samples', () => {
            monitor.clearMetrics();
            monitor.addMetrics({ renderTime: 100, timestamp: Date.now() });

            const trends = monitor.analyzeTrends();
            expect(trends.status).toBe('insufficient_data');
        });
    });

    describe('observer pattern', () => {
        it('should add and notify observers', () => {
            const observer = jest.fn();
            monitor.addObserver(observer);

            const metrics = { renderTime: 100, nodeCount: 10 };
            monitor.addMetrics(metrics);

            expect(observer).toHaveBeenCalledWith(metrics);
        });

        it('should remove observers', () => {
            const observer = jest.fn();
            monitor.addObserver(observer);
            monitor.removeObserver(observer);

            monitor.addMetrics({ renderTime: 100 });
            expect(observer).not.toHaveBeenCalled();
        });

        it('should handle observer errors gracefully', () => {
            const faultyObserver = jest.fn(() => {
                throw new Error('Observer error');
            });
            const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

            monitor.addObserver(faultyObserver);
            monitor.addMetrics({ renderTime: 100 });

            expect(consoleWarn).toHaveBeenCalledWith('Performance observer error:', expect.any(Error));
            consoleWarn.mockRestore();
        });
    });

    describe('performance recommendations', () => {
        it('should generate recommendations for slow renders', () => {
            monitor.addMetrics({
                renderTime: 1500,
                nodeCount: 75,
                memoryUsage: 60,
                timestamp: Date.now()
            });

            const recommendations = monitor.generateRecommendations();
            expect(recommendations).toContain('Consider enabling performance optimizations for large diagrams');
            expect(recommendations).toContain('Enable lazy loading for icons to improve initial render time');
        });

        it('should recommend virtualization for very large diagrams', () => {
            monitor.addMetrics({
                renderTime: 800,
                nodeCount: 150,
                memoryUsage: 40,
                timestamp: Date.now()
            });

            const recommendations = monitor.generateRecommendations();
            expect(recommendations).toContain('Consider using virtualization for very large diagrams');
        });

        it('should recommend memory monitoring for high usage', () => {
            monitor.addMetrics({
                renderTime: 500,
                nodeCount: 30,
                memoryUsage: 80,
                timestamp: Date.now()
            });

            const recommendations = monitor.generateRecommendations();
            expect(recommendations).toContain('Monitor memory usage - consider clearing unused resources');
        });
    });

    describe('performance reporting', () => {
        it('should generate comprehensive performance report', () => {
            // Add multiple metrics for a complete report
            const testMetrics = [
                { totalTime: 800, renderTime: 500, nodeCount: 40, memoryUsage: 35 },
                { totalTime: 1200, renderTime: 800, nodeCount: 60, memoryUsage: 45 },
                { totalTime: 1000, renderTime: 650, nodeCount: 50, memoryUsage: 40 }
            ];

            testMetrics.forEach(metrics => monitor.addMetrics(metrics));
            const report = monitor.generateReport();

            expect(report.summary).toBeDefined();
            expect(report.summary.totalSessions).toBe(3);
            expect(report.summary.averageRenderTime).toBe(650);
            expect(report.latest).toBeDefined();
            expect(report.trends).toBeDefined();
            expect(report.recommendations).toBeDefined();
        });

        it('should handle no data scenario in report', () => {
            monitor.clearMetrics();
            const report = monitor.generateReport();

            expect(report.status).toBe('no_data');
            expect(report.message).toBe('No performance data available');
        });
    });
});