/**
 * TypeScript definitions for HTML Diagram Library API
 * Provides comprehensive type definitions for full IDE support and type safety
 */

// Core Library Types

/**
 * Main DiagramLibrary class for creating architectural diagrams from HTML
 */
export declare class DiagramLibrary {
  constructor(container: string | HTMLElement, config?: Partial<LibraryConfig>);
  
  initialize(options?: Partial<LibraryConfig>): Promise<DiagramLibrary>;
  render(htmlContent: string, options?: RenderOptions): Promise<RenderResult>;
  update(updates: string | Partial<LibraryConfig>, options?: UpdateOptions): Promise<RenderResult>;
  destroy(): Promise<void>;
  
  fluent(): FluentAPI;
  
  on(eventName: string, callback: Function): DiagramLibrary;
  off(eventName: string, callback: Function): DiagramLibrary;
  
  getConfig(): LibraryConfig;
  getMetrics(): PerformanceMetrics;
  getCurrentDiagram(): DiagramInfo | null;
}

/**
 * Fluent API wrapper for method chaining
 */
export declare class FluentAPI {
  constructor(diagramLibrary: DiagramLibrary);
  
  // Configuration methods
  layout(config: LayoutConfig | LayoutPreset): FluentAPI;
  theme(theme: ThemeConfig | ThemePreset): FluentAPI;
  icons(config: IconConfig): FluentAPI;
  interaction(config: InteractionConfig): FluentAPI;
  performance(config: PerformanceConfig): FluentAPI;
  parser(config: ParserConfig): FluentAPI;
  
  // Operational methods
  initialize(additionalConfig?: Partial<LibraryConfig>): Promise<FluentAPI>;
  render(htmlContent: string, options?: RenderOptions): Promise<RenderResult>;
  update(updates: string | Partial<LibraryConfig>, options?: UpdateOptions): Promise<RenderResult>;
  
  // Utility methods
  when(condition: boolean | (() => boolean), callback: (api: FluentAPI) => void, elseCallback?: (api: FluentAPI) => void): FluentAPI;
  apply(configFunction: (api: FluentAPI) => void): FluentAPI;
  batch(enabled?: boolean): FluentAPI;
  reset(): FluentAPI;
  debug(enabled?: boolean): FluentAPI;
  
  // Information methods
  getConfig(): LibraryConfig;
  getMetrics(): PerformanceMetrics;
  getCurrentDiagram(): DiagramInfo | null;
  
  // Event handling
  on(eventName: string, callback: Function): FluentAPI;
  off(eventName: string, callback: Function): FluentAPI;
  
  // Cleanup
  destroy(): Promise<void>;
}

// Configuration Types

/**
 * Complete library configuration
 */
export interface LibraryConfig {
  layout: LayoutConfig;
  theme: ThemeConfig | ThemePreset;
  icons: IconConfig;
  interaction: InteractionConfig;
  performance: PerformanceConfig;
  parser: ParserConfig;
  autoResize: boolean;
  enableErrorRecovery: boolean;
  preloadCommonIcons: boolean;
  debug: boolean;
}

/**
 * Layout engine configuration
 */
export interface LayoutConfig {
  forceStrength: number;
  linkDistance: number;
  nodeRepulsion: number;
  centerForce: number;
  iterations: number;
  bounds?: {
    width: number;
    height: number;
  };
  enableCollision: boolean;
  alpha: number;
  alphaDecay: number;
  velocityDecay: number;
  collisionRadius: number;
}

/**
 * Layout preset names
 */
export type LayoutPreset = 'tight' | 'loose' | 'balanced' | 'performance';

/**
 * Theme configuration
 */
export interface ThemeConfig {
  nodeStyles: Record<string, NodeStyle>;
  edgeStyles: Record<string, EdgeStyle>;
  colors: Record<string, string>;
  fonts: FontConfig;
  backgroundColor?: string;
}

/**
 * Theme preset names
 */
export type ThemePreset = 'default' | 'dark' | 'light' | 'colorful' | 'minimal';

/**
 * Node styling configuration
 */
export interface NodeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  opacity: number;
  borderRadius: number;
}

/**
 * Edge styling configuration
 */
export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string;
  opacity: number;
  markerEnd?: string;
  labelColor?: string;
  labelFontFamily?: string;
  labelFontSize?: number;
}

/**
 * Font configuration
 */
export interface FontConfig {
  family: string;
  size: number;
  weight: string;
}

/**
 * Icon management configuration
 */
export interface IconConfig {
  enableCDN: boolean;
  cdnUrls: string[];
  enableFallbacks: boolean;
  iconMappings: Record<string, string>;
  loadTimeout: number;
  cacheConfig: IconCacheConfig;
}

/**
 * Icon cache configuration
 */
export interface IconCacheConfig {
  maxCacheSize: number;
  defaultExpiry: number;
  enablePersistence: boolean;
  enableMemoryCache: boolean;
}

/**
 * User interaction configuration
 */
export interface InteractionConfig {
  enableZoom: boolean;
  enablePan: boolean;
  enableTooltips: boolean;
  enableSelection: boolean;
  zoom: ZoomConfig;
  tooltips: TooltipConfig;
  selection: SelectionConfig;
}

/**
 * Zoom configuration
 */
export interface ZoomConfig {
  minScale: number;
  maxScale: number;
  scaleStep: number;
  smoothZoom: boolean;
  duration: number;
}

/**
 * Tooltip configuration
 */
export interface TooltipConfig {
  delay: number;
  duration: number;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  padding: number;
  borderRadius: number;
  followCursor: boolean;
}

/**
 * Selection configuration
 */
export interface SelectionConfig {
  multiSelect: boolean;
  selectionColor: string;
  selectionWidth: number;
  highlightConnected: boolean;
}

/**
 * Performance optimization configuration
 */
export interface PerformanceConfig {
  maxNodes: number;
  enableOptimizations: boolean;
  animationDuration: number;
  lazyLoading: boolean;
  renderThrottle: number;
}

/**
 * HTML parser configuration
 */
export interface ParserConfig {
  strictMode: boolean;
  allowedElements: string[];
  validateConnections: boolean;
}

// Operation Types

/**
 * Rendering options
 */
export interface RenderOptions {
  animate?: boolean;
  preserveViewport?: boolean;
  layoutOverrides?: Partial<LayoutConfig>;
  themeOverrides?: Partial<ThemeConfig>;
}

/**
 * Update options
 */
export interface UpdateOptions {
  animate?: boolean;
  preservePositions?: boolean;
}

/**
 * Render result information
 */
export interface RenderResult {
  success: boolean;
  nodeCount: number;
  edgeCount: number;
  renderTime: number;
  warnings: ValidationWarning[];
  bounds: LayoutBounds;
  converged: boolean;
  iterations: number;
}

/**
 * Layout bounds information
 */
export interface LayoutBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  type: string;
  message: string;
  elementId?: string;
  suggestion?: string;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  errorCount: number;
  lastError: Error | null;
  initialized: boolean;
  rendering: boolean;
  hasCurrentDiagram: boolean;
}

/**
 * Current diagram information
 */
export interface DiagramInfo {
  nodeCount: number;
  edgeCount: number;
  renderTime: number;
  bounds: LayoutBounds;
  converged: boolean;
}

// Data Model Types

/**
 * Parsed HTML element
 */
export interface ParsedElement {
  type: string;
  id: string;
  attributes: Record<string, string>;
  children: ParsedElement[];
  connections: string[];
  metadata: Record<string, any>;
}

/**
 * Graph node
 */
export interface Node {
  id: string;
  type: string;
  label: string;
  icon: string;
  position: Position;
  size: Size;
  style: NodeStyle;
  metadata: Record<string, any>;
  fixed: boolean;
  weight: number;
}

/**
 * Graph edge
 */
export interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'connection' | 'hierarchy';
  style: EdgeStyle;
  weight: number;
  bidirectional: boolean;
  metadata: Record<string, any>;
}

/**
 * Position coordinates
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Size dimensions
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Graph data structure
 */
export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  bounds: LayoutBounds;
  center: Position;
}

/**
 * Layout calculation result
 */
export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
  bounds: LayoutBounds;
  center: Position;
  converged: boolean;
  iterations: number;
}

/**
 * Parse result from HTML parser
 */
export interface ParseResult {
  elements: ParsedElement[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;
  statistics: ParseStatistics;
}

/**
 * Validation error
 */
export interface ValidationError {
  type: string;
  message: string;
  elementId?: string;
  context?: any;
}

/**
 * Parse statistics
 */
export interface ParseStatistics {
  elementCount: number;
  connectionCount: number;
  topLevelElements: number;
  averageConnectionsPerElement: number;
}

// Error Types

/**
 * Diagram-specific error class
 */
export declare class DiagramError extends Error {
  constructor(type: ErrorType, message: string, context?: any);
  type: ErrorType;
  context: any;
}

/**
 * Error type enumeration
 */
export type ErrorType = 
  | 'INITIALIZATION_ERROR'
  | 'NOT_INITIALIZED'
  | 'RENDER_IN_PROGRESS'
  | 'INVALID_INPUT'
  | 'PARSE_ERROR'
  | 'EMPTY_DIAGRAM'
  | 'LAYOUT_ERROR'
  | 'RENDER_ERROR'
  | 'NO_CURRENT_DIAGRAM'
  | 'INVALID_UPDATE'
  | 'DESTROY_ERROR'
  | 'INVALID_LIBRARY_INSTANCE';

// Event Types

/**
 * Event listener callback types
 */
export interface EventCallbacks {
  initialized: (data: { config: LibraryConfig }) => void;
  renderStart: (data: { htmlContent: string; options: RenderOptions }) => void;
  renderComplete: (result: RenderResult) => void;
  renderError: (data: { error: Error; htmlContent: string; options: RenderOptions }) => void;
  layoutProgress: (progress: LayoutProgress) => void;
  containerResize: () => void;
  destroyStart: () => void;
  destroyComplete: () => void;
}

/**
 * Layout progress information
 */
export interface LayoutProgress {
  iterations: number;
  alpha: number;
  progress: number;
  converged: boolean;
}

// Module Exports

export default DiagramLibrary;

// Global type declarations for browser usage
declare global {
  interface Window {
    DiagramLibrary: typeof DiagramLibrary;
    FluentAPI: typeof FluentAPI;
  }
}

// HTML element type extensions for custom diagram elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'microservice': any;
      'api-gateway': any;
      'database': any;
      'load-balancer': any;
      'cache': any;
      'queue': any;
      'storage': any;
      'external-service': any;
      'user': any;
      'admin': any;
    }
  }
}