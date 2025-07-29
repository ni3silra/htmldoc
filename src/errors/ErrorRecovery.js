/**
 * ErrorRecovery - Graceful degradation mechanisms for diagram errors
 * Provides fallback strategies and recovery options when errors occur
 */

import { ErrorType, ErrorSeverity } from './DiagramError.js';

/**
 * Recovery strategy enumeration
 * @readonly
 * @enum {string}
 */
export const RecoveryStrategy = {
  SKIP: 'SKIP',
  FALLBACK: 'FALLBACK',
  RETRY: 'RETRY',
  DEGRADE: 'DEGRADE',
  ABORT: 'ABORT'
};

/**
 * Configuration for error recovery behavior
 * @typedef {Object} RecoveryConfig
 * @property {boolean} skipInvalidElements - Skip elements that fail validation
 * @property {boolean} useDefaultIcons - Use default icons when loading fails
 * @property {string} fallbackLayout - Layout to use when primary layout fails
 * @property {boolean} gracefulDegradation - Enable graceful feature degradation
 * @property {number} maxRetries - Maximum number of retry attempts
 * @property {number} retryDelay - Delay between retry attempts (ms)
 */

/**
 * Default recovery configuration
 * @type {RecoveryConfig}
 */
export const DEFAULT_RECOVERY_CONFIG = {
  skipInvalidElements: true,
  useDefaultIcons: true,
  fallbackLayout: 'grid',
  gracefulDegradation: true,
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * Error recovery manager that handles graceful degradation
 */
export class ErrorRecovery {
  /**
   * Creates a new ErrorRecovery instance
   * @param {RecoveryConfig} [config=DEFAULT_RECOVERY_CONFIG] - Recovery configuration
   */
  constructor(config = DEFAULT_RECOVERY_CONFIG) {
    this.config = { ...DEFAULT_RECOVERY_CONFIG, ...config };
    this.retryAttempts = new Map();
  }

  /**
   * Determines the appropriate recovery strategy for an error
   * @param {DiagramError} error - The error to recover from
   * @returns {RecoveryStrategy} Recommended recovery strategy
   */
  getRecoveryStrategy(error) {
    // Critical errors should abort
    if (error.severity === ErrorSeverity.CRITICAL) {
      return RecoveryStrategy.ABORT;
    }

    // Strategy based on error type
    switch (error.type) {
      case ErrorType.PARSE_ERROR:
        return this.config.skipInvalidElements ? RecoveryStrategy.SKIP : RecoveryStrategy.ABORT;
      
      case ErrorType.VALIDATION_ERROR:
        return this.config.skipInvalidElements ? RecoveryStrategy.SKIP : RecoveryStrategy.FALLBACK;
      
      case ErrorType.LAYOUT_ERROR:
        return RecoveryStrategy.FALLBACK;
      
      case ErrorType.RENDER_ERROR:
        return this.canRetry(error) ? RecoveryStrategy.RETRY : RecoveryStrategy.FALLBACK;
      
      case ErrorType.ICON_ERROR:
        return this.config.useDefaultIcons ? RecoveryStrategy.FALLBACK : RecoveryStrategy.SKIP;
      
      case ErrorType.INTERACTION_ERROR:
        return this.config.gracefulDegradation ? RecoveryStrategy.DEGRADE : RecoveryStrategy.SKIP;
      
      case ErrorType.CONFIGURATION_ERROR:
        return RecoveryStrategy.FALLBACK;
      
      case ErrorType.PERFORMANCE_ERROR:
        return RecoveryStrategy.DEGRADE;
      
      default:
        return RecoveryStrategy.FALLBACK;
    }
  }

  /**
   * Executes recovery strategy for a given error
   * @param {DiagramError} error - The error to recover from
   * @param {Object} context - Recovery context (data, callbacks, etc.)
   * @returns {Promise<Object>} Recovery result
   */
  async executeRecovery(error, context = {}) {
    const strategy = this.getRecoveryStrategy(error);
    
    switch (strategy) {
      case RecoveryStrategy.SKIP:
        return this.skipError(error, context);
      
      case RecoveryStrategy.FALLBACK:
        return this.fallbackRecovery(error, context);
      
      case RecoveryStrategy.RETRY:
        return this.retryOperation(error, context);
      
      case RecoveryStrategy.DEGRADE:
        return this.degradeFeature(error, context);
      
      case RecoveryStrategy.ABORT:
        return this.abortOperation(error, context);
      
      default:
        return this.fallbackRecovery(error, context);
    }
  }

  /**
   * Skips the error and continues processing
   * @param {DiagramError} error - The error to skip
   * @param {Object} context - Recovery context
   * @returns {Object} Recovery result
   */
  skipError(error, context) {
    return {
      strategy: RecoveryStrategy.SKIP,
      success: true,
      message: `Skipped ${error.type}: ${error.message}`,
      data: context.data || null
    };
  }

  /**
   * Applies fallback mechanisms based on error type
   * @param {DiagramError} error - The error to recover from
   * @param {Object} context - Recovery context
   * @returns {Object} Recovery result
   */
  fallbackRecovery(error, context) {
    let fallbackData = null;
    let message = '';

    switch (error.type) {
      case ErrorType.LAYOUT_ERROR:
        fallbackData = this.getFallbackLayout(context);
        message = `Using fallback layout: ${this.config.fallbackLayout}`;
        break;
      
      case ErrorType.ICON_ERROR:
        fallbackData = this.getFallbackIcon(context);
        message = 'Using default icon';
        break;
      
      case ErrorType.CONFIGURATION_ERROR:
        fallbackData = this.getDefaultConfiguration(context);
        message = 'Using default configuration';
        break;
      
      case ErrorType.VALIDATION_ERROR:
        fallbackData = this.sanitizeData(context);
        message = 'Using sanitized data';
        break;
      
      default:
        fallbackData = context.data;
        message = 'Applied generic fallback';
    }

    return {
      strategy: RecoveryStrategy.FALLBACK,
      success: true,
      message,
      data: fallbackData
    };
  }

  /**
   * Retries the failed operation with exponential backoff
   * @param {DiagramError} error - The error that caused the failure
   * @param {Object} context - Recovery context with retry function
   * @returns {Promise<Object>} Recovery result
   */
  async retryOperation(error, context) {
    const errorKey = `${error.type}_${error.message}`;
    const attempts = this.retryAttempts.get(errorKey) || 0;

    if (attempts >= this.config.maxRetries) {
      this.retryAttempts.delete(errorKey);
      return this.fallbackRecovery(error, context);
    }

    this.retryAttempts.set(errorKey, attempts + 1);
    
    // Exponential backoff delay
    const delay = this.config.retryDelay * Math.pow(2, attempts);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      if (context.retryFunction && typeof context.retryFunction === 'function') {
        const result = await context.retryFunction();
        this.retryAttempts.delete(errorKey);
        
        return {
          strategy: RecoveryStrategy.RETRY,
          success: true,
          message: `Retry successful after ${attempts + 1} attempts`,
          data: result
        };
      }
    } catch (retryError) {
      // If retry fails, try again or fallback
      return this.retryOperation(error, context);
    }

    return this.fallbackRecovery(error, context);
  }

  /**
   * Degrades features to maintain basic functionality
   * @param {DiagramError} error - The error causing degradation
   * @param {Object} context - Recovery context
   * @returns {Object} Recovery result
   */
  degradeFeature(error, context) {
    let degradedFeatures = [];
    let message = '';

    switch (error.type) {
      case ErrorType.PERFORMANCE_ERROR:
        degradedFeatures = ['animations', 'smooth_transitions', 'complex_interactions'];
        message = 'Disabled animations and complex interactions for better performance';
        break;
      
      case ErrorType.INTERACTION_ERROR:
        degradedFeatures = ['tooltips', 'click_handlers', 'keyboard_navigation'];
        message = 'Disabled interactive features';
        break;
      
      default:
        degradedFeatures = ['non_essential_features'];
        message = 'Disabled non-essential features';
    }

    return {
      strategy: RecoveryStrategy.DEGRADE,
      success: true,
      message,
      data: context.data,
      degradedFeatures
    };
  }

  /**
   * Aborts the operation when recovery is not possible
   * @param {DiagramError} error - The critical error
   * @param {Object} context - Recovery context
   * @returns {Object} Recovery result
   */
  abortOperation(error, context) {
    return {
      strategy: RecoveryStrategy.ABORT,
      success: false,
      message: `Operation aborted due to critical error: ${error.message}`,
      data: null,
      error
    };
  }

  /**
   * Checks if an operation can be retried
   * @param {DiagramError} error - The error to check
   * @returns {boolean} True if retry is possible
   */
  canRetry(error) {
    const errorKey = `${error.type}_${error.message}`;
    const attempts = this.retryAttempts.get(errorKey) || 0;
    return attempts < this.config.maxRetries;
  }

  /**
   * Gets fallback layout configuration
   * @param {Object} context - Layout context
   * @returns {Object} Fallback layout configuration
   */
  getFallbackLayout(context) {
    const fallbackLayouts = {
      grid: {
        type: 'grid',
        columns: Math.ceil(Math.sqrt(context.nodeCount || 10)),
        spacing: 100
      },
      circle: {
        type: 'circle',
        radius: Math.max(100, (context.nodeCount || 10) * 20)
      },
      tree: {
        type: 'tree',
        direction: 'top-down',
        levelHeight: 100
      }
    };

    return fallbackLayouts[this.config.fallbackLayout] || fallbackLayouts.grid;
  }

  /**
   * Gets fallback icon configuration
   * @param {Object} context - Icon context
   * @returns {Object} Fallback icon data
   */
  getFallbackIcon(context) {
    const fallbackIcons = {
      microservice: '⚙️',
      database: '🗄️',
      'api-gateway': '🚪',
      service: '📦',
      default: '⬜'
    };

    const iconType = context.iconType || 'default';
    return {
      type: 'emoji',
      data: fallbackIcons[iconType] || fallbackIcons.default,
      fallback: true
    };
  }

  /**
   * Gets default configuration for various components
   * @param {Object} context - Configuration context
   * @returns {Object} Default configuration
   */
  getDefaultConfiguration(context) {
    return {
      layout: {
        forceStrength: 0.1,
        linkDistance: 100,
        nodeRepulsion: 300,
        centerForce: 0.1
      },
      theme: {
        nodeColor: '#4A90E2',
        edgeColor: '#666666',
        backgroundColor: '#FFFFFF'
      },
      interaction: {
        enableZoom: true,
        enablePan: true,
        enableTooltips: false
      }
    };
  }

  /**
   * Sanitizes data by removing invalid elements
   * @param {Object} context - Data context
   * @returns {Object} Sanitized data
   */
  sanitizeData(context) {
    if (!context.data) return null;

    // Remove elements without required attributes
    const sanitized = {
      ...context.data,
      nodes: (context.data.nodes || []).filter(node => 
        node.id && node.type && node.label
      ),
      edges: (context.data.edges || []).filter(edge => 
        edge.source && edge.target
      )
    };

    return sanitized;
  }

  /**
   * Updates recovery configuration
   * @param {Partial<RecoveryConfig>} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Resets retry attempts counter
   */
  resetRetryAttempts() {
    this.retryAttempts.clear();
  }
}