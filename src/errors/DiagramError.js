/**
 * DiagramError - Custom error class for diagram-related errors
 * Provides categorized error types with detailed messages and context
 */

/**
 * Error type enumeration for categorizing different types of diagram errors
 * @readonly
 * @enum {string}
 */
export const ErrorType = {
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  LAYOUT_ERROR: 'LAYOUT_ERROR',
  RENDER_ERROR: 'RENDER_ERROR',
  INTERACTION_ERROR: 'INTERACTION_ERROR',
  ICON_ERROR: 'ICON_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  PERFORMANCE_ERROR: 'PERFORMANCE_ERROR'
};

/**
 * Error severity levels for prioritizing error handling
 * @readonly
 * @enum {string}
 */
export const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Custom error class for diagram library with categorization and context
 * Extends native Error with additional metadata for better error handling
 */
export class DiagramError extends Error {
  /**
   * Creates a new DiagramError instance
   * @param {ErrorType} type - The category of error
   * @param {string} message - Human-readable error message
   * @param {Object} [context={}] - Additional context information
   * @param {ErrorSeverity} [severity=ErrorSeverity.MEDIUM] - Error severity level
   */
  constructor(type, message, context = {}, severity = ErrorSeverity.MEDIUM) {
    super(message);
    
    this.name = 'DiagramError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();
    
    // Maintain proper stack trace for V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DiagramError);
    }
  }

  /**
   * Returns a detailed error object for logging and debugging
   * @returns {Object} Detailed error information
   */
  toDetailedObject() {
    return {
      name: this.name,
      type: this.type,
      severity: this.severity,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * Returns a user-friendly error message
   * @returns {string} User-friendly error message
   */
  getUserMessage() {
    const userMessages = {
      [ErrorType.PARSE_ERROR]: 'There was an issue parsing your diagram HTML. Please check your syntax.',
      [ErrorType.VALIDATION_ERROR]: 'Your diagram contains invalid elements or attributes.',
      [ErrorType.LAYOUT_ERROR]: 'Unable to calculate diagram layout. Try simplifying your diagram.',
      [ErrorType.RENDER_ERROR]: 'Failed to render the diagram. Please try refreshing the page.',
      [ErrorType.INTERACTION_ERROR]: 'Interactive features are not working properly.',
      [ErrorType.ICON_ERROR]: 'Some icons could not be loaded. Using fallback icons instead.',
      [ErrorType.CONFIGURATION_ERROR]: 'Invalid configuration provided. Using default settings.',
      [ErrorType.PERFORMANCE_ERROR]: 'Diagram is too complex and may perform slowly.'
    };

    return userMessages[this.type] || 'An unexpected error occurred while creating your diagram.';
  }

  /**
   * Checks if this error is recoverable
   * @returns {boolean} True if error can be recovered from
   */
  isRecoverable() {
    const recoverableTypes = [
      ErrorType.ICON_ERROR,
      ErrorType.CONFIGURATION_ERROR,
      ErrorType.PERFORMANCE_ERROR
    ];
    
    return recoverableTypes.includes(this.type) || this.severity === ErrorSeverity.LOW;
  }
}

/**
 * Factory functions for creating specific error types with appropriate context
 */
export const DiagramErrorFactory = {
  /**
   * Creates a parse error for HTML parsing issues
   * @param {string} message - Error message
   * @param {Object} context - Parse context (element, line, etc.)
   * @returns {DiagramError} Parse error instance
   */
  createParseError(message, context = {}) {
    return new DiagramError(
      ErrorType.PARSE_ERROR,
      message,
      context,
      ErrorSeverity.HIGH
    );
  },

  /**
   * Creates a validation error for invalid diagram elements
   * @param {string} message - Error message
   * @param {Object} context - Validation context (element, rule, etc.)
   * @returns {DiagramError} Validation error instance
   */
  createValidationError(message, context = {}) {
    return new DiagramError(
      ErrorType.VALIDATION_ERROR,
      message,
      context,
      ErrorSeverity.MEDIUM
    );
  },

  /**
   * Creates a layout error for force-directed layout issues
   * @param {string} message - Error message
   * @param {Object} context - Layout context (nodes, iterations, etc.)
   * @returns {DiagramError} Layout error instance
   */
  createLayoutError(message, context = {}) {
    return new DiagramError(
      ErrorType.LAYOUT_ERROR,
      message,
      context,
      ErrorSeverity.HIGH
    );
  },

  /**
   * Creates a render error for SVG rendering issues
   * @param {string} message - Error message
   * @param {Object} context - Render context (element, container, etc.)
   * @returns {DiagramError} Render error instance
   */
  createRenderError(message, context = {}) {
    return new DiagramError(
      ErrorType.RENDER_ERROR,
      message,
      context,
      ErrorSeverity.HIGH
    );
  },

  /**
   * Creates an interaction error for user interaction issues
   * @param {string} message - Error message
   * @param {Object} context - Interaction context (event, element, etc.)
   * @returns {DiagramError} Interaction error instance
   */
  createInteractionError(message, context = {}) {
    return new DiagramError(
      ErrorType.INTERACTION_ERROR,
      message,
      context,
      ErrorSeverity.MEDIUM
    );
  },

  /**
   * Creates an icon error for icon loading issues
   * @param {string} message - Error message
   * @param {Object} context - Icon context (url, type, etc.)
   * @returns {DiagramError} Icon error instance
   */
  createIconError(message, context = {}) {
    return new DiagramError(
      ErrorType.ICON_ERROR,
      message,
      context,
      ErrorSeverity.LOW
    );
  },

  /**
   * Creates a configuration error for invalid settings
   * @param {string} message - Error message
   * @param {Object} context - Configuration context (setting, value, etc.)
   * @returns {DiagramError} Configuration error instance
   */
  createConfigurationError(message, context = {}) {
    return new DiagramError(
      ErrorType.CONFIGURATION_ERROR,
      message,
      context,
      ErrorSeverity.MEDIUM
    );
  },

  /**
   * Creates a performance error for performance-related issues
   * @param {string} message - Error message
   * @param {Object} context - Performance context (nodeCount, renderTime, etc.)
   * @returns {DiagramError} Performance error instance
   */
  createPerformanceError(message, context = {}) {
    return new DiagramError(
      ErrorType.PERFORMANCE_ERROR,
      message,
      context,
      ErrorSeverity.LOW
    );
  }
};