/**
 * Unit tests for showPerformanceWarnings method and degradation options
 * Tests warning system for different diagram sizes and performance scenarios
 */

import { PerformanceMonitor } from '../../src/performance/PerformanceMonitor.js';

describe('PerformanceMonitor - Performance Warnings', () => {
    let monitor;
    let mockContainer;

    beforeEach(() => {
        monitor = new PerformanceMonitor();
        
        // Mock DOM container
        mockContainer = {
            querySelectorAll: jest.fn(() => []),
            appendChild: jest.fn(),
            style: {}
        };
        
        // Mock document.createElement more comprehensively
        const mockElement = {
            tagName: 'DIV',
            className: '',
            style: {},
            textContent: '',
            innerHTML: '',
            appendChild: jest.fn(),
            remove: jest.fn(),
            onclick: null,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };

        // Ensure global document exists and is properly mocked
        if (!global.document) {
            global.document = {};
        }
        
        global.document.createElement = jest.fn(() => ({ ...mockElement }));
        global.document.addEventListener = jest.fn();
        global.document.removeEventListener = jest.fn();
        
        // Mock setTimeout to avoid timing issues
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        // Clean up global document mock
        if (global.document && global.document.createElement && global.document.createElement.mockRestore) {
            global.document.createElement.mockRestore();
        }
    });

    describe('warning thresholds', () => {
        it('should show info warning for 50+ nodes', () => {
            const result = monitor.showPerformanceWarnings(60);

            expect(result.hasWarnings).toBe(true);
            expect(result.severity).toBe('info');
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0].level).toBe('info');
            expect(result.warnings[0].code).toBe('LARGE_DIAGRAM');
            expect(result.warnings[0].message).toContain('60 nodes');
        });

        it('should show warning for 100+ nodes', () => {
            const result = monitor.showPerformanceWarnings(120);

            expect(result.severity).toBe('warning');
            expect(result.warnings.length).toBeGreaterThanOrEqual(2);
            
            const warningLevels = result.warnings.map(w => w.level);
            expect(warningLevels).toContain('warning');
            
            const codes = result.warnings.map(w => w.code);
            expect(codes).toContain('VERY_LARGE_DIAGRAM');
        });

        it('should show error for 200+ nodes', () => {
            const result = monitor.showPerformanceWarnings(250);

            expect(result.severity).toBe('error');
            expect(result.warnings.length).toBeGreaterThanOrEqual(3);
            
            const errorWarnings = result.warnings.filter(w => w.level === 'error');
            expect(errorWarnings.length).toBeGreaterThan(0);
            expect(errorWarnings[0].code).toBe('EXTREME_DIAGRAM_SIZE');
        });

        it('should not show warnings for small diagrams', () => {
            const result = monitor.showPerformanceWarnings(25);

            expect(result.hasWarnings).toBe(false);
            expect(result.warnings).toHaveLength(0);
            expect(result.degradationOptions).toHaveLength(0);
        });
    });

    describe('degradation options for 50+ elements', () => {
        it('should suggest lazy loading for 50+ nodes', () => {
            const result = monitor.showPerformanceWarnings(75);

            const lazyLoadingOption = result.degradationOptions.find(
                option => option.name === 'Enable Lazy Loading'
            );

            expect(lazyLoadingOption).toBeDefined();
            expect(lazyLoadingOption.description).toContain('Load icons and resources on demand');
            expect(lazyLoadingOption.impact).toContain('Faster initial render');
            expect(lazyLoadingOption.recommended).toBe(true);
        });

        it('should suggest virtualization for 100+ nodes', () => {
            const result = monitor.showPerformanceWarnings(150);

            const virtualizationOption = result.degradationOptions.find(
                option => option.name === 'Enable Virtualization'
            );

            expect(virtualizationOption).toBeDefined();
            expect(virtualizationOption.description).toContain('Only render elements visible in viewport');
            expect(virtualizationOption.impact).toContain('Significant performance improvement');
            expect(virtualizationOption.recommended).toBe(true);
        });

        it('should suggest multiple degradation options for 200+ nodes', () => {
            const result = monitor.showPerformanceWarnings(250);

            const optionNames = result.degradationOptions.map(option => option.name);
            expect(optionNames).toContain('Enable Lazy Loading');
            expect(optionNames).toContain('Enable Virtualization');
            expect(optionNames).toContain('Reduce Animation Quality');
            expect(optionNames).toContain('Enable Level of Detail');

            const animationOption = result.degradationOptions.find(
                option => option.name === 'Reduce Animation Quality'
            );
            expect(animationOption.impact).toContain('Less smooth animations but better performance');

            const lodOption = result.degradationOptions.find(
                option => option.name === 'Enable Level of Detail'
            );
            expect(lodOption.impact).toContain('Reduced visual quality at low zoom');
        });
    });

    describe('performance-based warnings', () => {
        beforeEach(() => {
            // Add performance metrics to trigger performance-based warnings
            monitor.addMetrics({
                renderTime: 2500,
                memoryUsage: 120,
                nodeCount: 80,
                timestamp: Date.now()
            });
        });

        it('should warn about slow render times', () => {
            const result = monitor.showPerformanceWarnings(80);

            const slowRenderWarning = result.warnings.find(w => w.code === 'SLOW_RENDER');
            expect(slowRenderWarning).toBeDefined();
            expect(slowRenderWarning.level).toBe('warning');
            expect(slowRenderWarning.message).toContain('2500ms');
        });

        it('should warn about high memory usage', () => {
            const result = monitor.showPerformanceWarnings(80);

            const memoryWarning = result.warnings.find(w => w.code === 'HIGH_MEMORY');
            expect(memoryWarning).toBeDefined();
            expect(memoryWarning.level).toBe('warning');
            expect(memoryWarning.message).toContain('120MB');

            const cacheOption = result.degradationOptions.find(
                option => option.name === 'Clear Unused Cache'
            );
            expect(cacheOption).toBeDefined();
            expect(cacheOption.recommended).toBe(false);
        });
    });

    describe('warning display options', () => {
        it('should display warnings in console when enabled', () => {
            const consoleInfo = jest.spyOn(console, 'info').mockImplementation();
            const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            const consoleError = jest.spyOn(console, 'error').mockImplementation();

            monitor.showPerformanceWarnings(250, { showInConsole: true });

            expect(consoleInfo).toHaveBeenCalled();
            expect(consoleWarn).toHaveBeenCalled();
            expect(consoleError).toHaveBeenCalled();

            consoleInfo.mockRestore();
            consoleWarn.mockRestore();
            consoleError.mockRestore();
        });

        it('should not display warnings in console when disabled', () => {
            const consoleInfo = jest.spyOn(console, 'info').mockImplementation();
            const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

            monitor.showPerformanceWarnings(100, { showInConsole: false });

            expect(consoleInfo).not.toHaveBeenCalled();
            expect(consoleWarn).not.toHaveBeenCalled();

            consoleInfo.mockRestore();
            consoleWarn.mockRestore();
        });

        it('should call warning callback when provided', () => {
            const onWarning = jest.fn();
            monitor.showPerformanceWarnings(150, { onWarning });

            expect(onWarning).toHaveBeenCalled();
            expect(onWarning).toHaveBeenCalledWith(
                expect.objectContaining({
                    level: expect.any(String),
                    message: expect.any(String),
                    code: expect.any(String)
                })
            );
        });

        it('should display visual warnings in container', () => {
            monitor.showPerformanceWarnings(100, { container: mockContainer });

            expect(mockContainer.appendChild).toHaveBeenCalled();
            expect(document.createElement).toHaveBeenCalledWith('div');
        });
    });

    describe('visual warning display', () => {
        it('should create warning element with proper styling', () => {
            const warnings = [
                { level: 'warning', message: 'Test warning', code: 'TEST' }
            ];
            const degradationOptions = [
                { name: 'Test Option', description: 'Test description' }
            ];

            monitor.displayVisualWarnings(mockContainer, warnings, degradationOptions);

            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(document.createElement).toHaveBeenCalledWith('button');
            expect(mockContainer.appendChild).toHaveBeenCalled();
        });

        it('should remove existing warnings before adding new ones', () => {
            const existingWarning = { remove: jest.fn() };
            mockContainer.querySelectorAll.mockReturnValue([existingWarning]);

            monitor.displayVisualWarnings(mockContainer, [], []);

            expect(existingWarning.remove).toHaveBeenCalled();
        });

        it('should include degradation options in visual display', () => {
            const warnings = [{ level: 'info', message: 'Test', code: 'TEST' }];
            const degradationOptions = [
                { name: 'Option 1', description: 'Description 1' },
                { name: 'Option 2', description: 'Description 2' }
            ];

            monitor.displayVisualWarnings(mockContainer, warnings, degradationOptions);

            // Should create elements for title, warnings, options title, and options
            expect(document.createElement).toHaveBeenCalledTimes(7); // div, title, warning, options title, 2 options, close button
        });
    });

    describe('severity calculation', () => {
        it('should return error as maximum severity', () => {
            const warnings = [
                { level: 'info' },
                { level: 'warning' },
                { level: 'error' }
            ];

            const severity = monitor.getMaxSeverity(warnings);
            expect(severity).toBe('error');
        });

        it('should return warning when no errors present', () => {
            const warnings = [
                { level: 'info' },
                { level: 'warning' }
            ];

            const severity = monitor.getMaxSeverity(warnings);
            expect(severity).toBe('warning');
        });

        it('should return info for info-only warnings', () => {
            const warnings = [{ level: 'info' }];

            const severity = monitor.getMaxSeverity(warnings);
            expect(severity).toBe('info');
        });
    });

    describe('comprehensive warning scenarios', () => {
        it('should handle complex scenario with multiple issues', () => {
            // Add metrics indicating poor performance
            monitor.addMetrics({
                renderTime: 3000,
                memoryUsage: 150,
                nodeCount: 200,
                timestamp: Date.now()
            });

            const result = monitor.showPerformanceWarnings(200, {
                showInConsole: true,
                container: mockContainer,
                onWarning: jest.fn()
            });

            expect(result.hasWarnings).toBe(true);
            expect(result.severity).toBe('error');
            expect(result.warnings.length).toBeGreaterThan(3);
            expect(result.degradationOptions.length).toBeGreaterThan(4);

            // Should have warnings for: large diagram, very large, extreme size, slow render, high memory
            const codes = result.warnings.map(w => w.code);
            expect(codes).toContain('LARGE_DIAGRAM');
            expect(codes).toContain('VERY_LARGE_DIAGRAM');
            expect(codes).toContain('EXTREME_DIAGRAM_SIZE');
            expect(codes).toContain('SLOW_RENDER');
            expect(codes).toContain('HIGH_MEMORY');
        });

        it('should provide appropriate degradation options for each scenario', () => {
            const result = monitor.showPerformanceWarnings(300);

            const optionNames = result.degradationOptions.map(o => o.name);
            expect(optionNames).toContain('Enable Lazy Loading');
            expect(optionNames).toContain('Enable Virtualization');
            expect(optionNames).toContain('Reduce Animation Quality');
            expect(optionNames).toContain('Enable Level of Detail');

            // Check that all options have required properties
            result.degradationOptions.forEach(option => {
                expect(option.name).toBeDefined();
                expect(option.description).toBeDefined();
                expect(option.impact).toBeDefined();
                expect(typeof option.recommended).toBe('boolean');
            });
        });

        it('should return complete warning information structure', () => {
            const result = monitor.showPerformanceWarnings(150);

            expect(result).toHaveProperty('warnings');
            expect(result).toHaveProperty('degradationOptions');
            expect(result).toHaveProperty('hasWarnings');
            expect(result).toHaveProperty('severity');
            expect(result).toHaveProperty('nodeCount');

            expect(Array.isArray(result.warnings)).toBe(true);
            expect(Array.isArray(result.degradationOptions)).toBe(true);
            expect(typeof result.hasWarnings).toBe('boolean');
            expect(typeof result.severity).toBe('string');
            expect(typeof result.nodeCount).toBe('number');
        });
    });
});