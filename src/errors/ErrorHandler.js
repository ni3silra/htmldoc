/**
 * ErrorHandler - Centralized error management and reporting
 * Coordinates error handling, recovery, and user notification across the library
 */

import { DiagramError, ErrorType, ErrorSeverity } from './DiagramError.js';
import { ErrorRecovery, RecoveryStrategy } from './ErrorRecovery.js';
import { ValidationErrors } from './ValidationErrors.js';
import { logger } from '../utils/Logger.js';

/**
 * Error handling strategy enumeration
 * @readonly
 * @enum {string}
 */
export const ErrorHandlingStrategy = {
  STRICT: 'STRICT',           // Fail fast on any error
  TOLERANT: 'TOLERANT',       // Try to recover from errors
  SILENT: 'SILENT',           // Suppress non-critical errors
  VERBOSE: 'VERBOSE'          // Report all errors and warnings
};

/**
 * Error handler configuration
 * @typedef {Object} ErrorHandlerConfig
 * @property {ErrorHandlingStrategy} strategy - Overall error handling strategy
 * @property {boolean} enableRecovery - Enable automatic error recovery
 * @property {boolean} enableUserNotification - Show errors to users
 * @property {boolean} enableLogging - Log errors for debugging
 * @property {boolean} enableReporting - Send error reports to external service
 * @property {Function} [onError] - Custom error callback
 * @property {Function} [onRecovery] - Custom recovery callback
 * @property {Function} [onUserNotification] - Custom user notification callback
 * @property {string} [reportingEndpoint] - URL for error reporting
 */

/**
 * Default error handler configuration
 * @type {ErrorHandlerConfig}
 */
export const DEFAULT_ERROR_HANDLER_CONFIG = {
  strategy: ErrorHandlingStrategy.TOLERANT,
  enableRecovery: true,
  enableUserNotification: true,
  enableLogging: true,
  enableReporting: false,
  onError: null,
  onRecovery: null,
  onUserNotification: null,
  reportingEndpoint: null
};

/**
 * Centralized error handler for the diagram library
 */
export class ErrorHandler {
  /**
   * Creates a new ErrorHandler instance
   * @param {ErrorHandlerConfig} [config=DEFAULT_ERROR_HANDLER_CONFIG] - Configuration
   */
  constructor(config = DEFAULT_ERROR_HANDLER_CONFIG) {
    this.config = { ...DEFAULT_ERROR_HANDLER_CONFIG, ...config };
    this.errorRecovery = new ErrorRecovery();
    this.validationErrors = new ValidationErrors();
    this.errorHistory = [];
    this.errorCounts = new Map();
    this.userNotificationQueue = [];
    
    // Initialize error tracking
    this.setupErrorTracking();
  }

  /**
   * Sets up global error tracking
   * @private
   */
  setupErrorTracking() {
    // Track unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleUnhandledError(event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      // Track unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.handleUnhandledError(event.reason, {
          type: 'unhandled_promise_rejection'
        });
      });
    }
  }

  /**
   * Main error handling method
   * @param {Error|DiagramError} error - Error to handle
   * @param {Object} [context={}] - Additional context
   * @returns {Promise<Object>} Handling result
   */
  async handleError(error, context = {}) {
    // Convert to DiagramError if needed
    const diagramError = this.ensureDiagramError(error, context);
    
    // Log the error
    if (this.config.enableLogging) {
      this.logError(diagramError);
    }

    // Track error statistics
    this.trackError(diagramError);

    // Add to error history
    this.errorHistory.push({
      error: diagramError,
      timestamp: new Date().toISOString(),
      context
    });

    // Execute custom error callback
    if (this.config.onError) {
      try {
        await this.config.onError(diagramError, context);
      } catch (callbackError) {
        logger.error('Error in custom error callback', callbackError);
      }
    }

    // Determine if we should attempt recovery
    const shouldRecover = this.shouldAttemptRecovery(diagramError);
    let recoveryResult = null;

    if (shouldRecover && this.config.enableRecovery) {
      recoveryResult = await this.attemptRecovery(diagramError, context);
    }

    // Handle user notification
    if (this.config.enableUserNotification) {
      await this.notifyUser(diagramError, recoveryResult);
    }

    // Report error if enabled
    if (this.config.enableReporting) {
      await this.reportError(diagramError, context);
    }

    return {
      error: diagramError,
      recovery: recoveryResult,
      handled: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handles validation errors specifically
   * @param {Array} elements - Elements that failed validation
   * @param {Object} [context={}] - Additional context
   * @returns {Promise<Object>} Validation handling result
   */
  async handleValidationErrors(elements, context = {}) {
    const validationResult = this.validationErrors.validateElements(elements);
    
    if (!validationResult.isValid) {
      const validationReport = this.validationErrors.createValidationReport(validationResult);
      
      // Create a comprehensive validation error
      const validationError = new DiagramError(
        ErrorType.VALIDATION_ERROR,
        `Validation failed with ${validationResult.errors.length} errors and ${validationResult.warnings.length} warnings`,
        {
          validationResult,
          validationReport,
          elementCount: elements.length
        },
        validationResult.errors.length > 0 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM
      );

      return this.handleError(validationError, context);
    }

    return {
      validation: validationResult,
      handled: true,
      success: true
    };
  }

  /**
   * Handles unhandled errors from global error handlers
   * @param {Error} error - Unhandled error
   * @param {Object} context - Error context
   * @private
   */
  handleUnhandledError(error, context) {
    const diagramError = new DiagramError(
      ErrorType.RENDER_ERROR,
      `Unhandled error: ${error.message}`,
      {
        originalError: error,
        ...context
      },
      ErrorSeverity.CRITICAL
    );

    // Handle asynchronously to avoid blocking
    setTimeout(() => {
      this.handleError(diagramError, { unhandled: true });
    }, 0);
  }

  /**
   * Converts any error to a DiagramError
   * @param {Error|DiagramError} error - Error to convert
   * @param {Object} context - Additional context
   * @returns {DiagramError} DiagramError instance
   * @private
   */
  ensureDiagramError(error, context) {
    if (error instanceof DiagramError) {
      return error;
    }

    // Determine error type based on error characteristics
    let errorType = ErrorType.RENDER_ERROR;
    if (error.name === 'SyntaxError') {
      errorType = ErrorType.PARSE_ERROR;
    } else if (error.name === 'TypeError') {
      errorType = ErrorType.CONFIGURATION_ERROR;
    }

    return new DiagramError(
      errorType,
      error.message || 'Unknown error occurred',
      {
        originalError: error,
        stack: error.stack,
        ...context
      },
      ErrorSeverity.HIGH
    );
  }

  /**
   * Logs error with appropriate level
   * @param {DiagramError} error - Error to log
   * @private
   */
  logError(error) {
    const logContext = {
      type: error.type,
      severity: error.severity,
      context: error.context,
      recoverable: error.isRecoverable()
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        logger.debug(error.message, logContext);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(error.message, logContext);
        break;
      case ErrorSeverity.HIGH:
        logger.error(error.message, logContext);
        break;
      case ErrorSeverity.CRITICAL:
        logger.fatal(error.message, logContext);
        break;
      default:
        logger.error(error.message, logContext);
    }
  }

  /**
   * Tracks error statistics
   * @param {DiagramError} error - Error to track
   * @private
   */
  trackError(error) {
    const errorKey = `${error.type}_${error.severity}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
  }

  /**
   * Determines if recovery should be attempted
   * @param {DiagramError} error - Error to check
   * @returns {boolean} True if recovery should be attempted
   * @private
   */
  shouldAttemptRecovery(error) {
    // Never recover from critical errors in strict mode
    if (this.config.strategy === ErrorHandlingStrategy.STRICT) {
      return false;
    }

    // Always try to recover in tolerant mode
    if (this.config.strategy === ErrorHandlingStrategy.TOLERANT) {
      return error.isRecoverable();
    }

    // Silent mode only recovers from low severity errors
    if (this.config.strategy === ErrorHandlingStrategy.SILENT) {
      return error.severity === ErrorSeverity.LOW;
    }

    return error.isRecoverable();
  }

  /**
   * Attempts error recovery
   * @param {DiagramError} error - Error to recover from
   * @param {Object} context - Recovery context
   * @returns {Promise<Object>} Recovery result
   * @private
   */
  async attemptRecovery(error, context) {
    try {
      const recoveryResult = await this.errorRecovery.executeRecovery(error, context);
      
      if (recoveryResult.success) {
        logger.info(`Recovery successful: ${recoveryResult.message}`, {
          strategy: recoveryResult.strategy,
          errorType: error.type
        });

        // Execute custom recovery callback
        if (this.config.onRecovery) {
          try {
            await this.config.onRecovery(error, recoveryResult);
          } catch (callbackError) {
            logger.error('Error in custom recovery callback', callbackError);
          }
        }
      }

      return recoveryResult;
    } catch (recoveryError) {
      logger.error('Recovery attempt failed', recoveryError);
      return {
        strategy: RecoveryStrategy.ABORT,
        success: false,
        message: `Recovery failed: ${recoveryError.message}`,
        error: recoveryError
      };
    }
  }

  /**
   * Notifies user about errors
   * @param {DiagramError} error - Error to notify about
   * @param {Object} recoveryResult - Recovery result
   * @private
   */
  async notifyUser(error, recoveryResult) {
    // Skip user notification for silent strategy
    if (this.config.strategy === ErrorHandlingStrategy.SILENT) {
      return;
    }

    // Skip low severity errors unless in verbose mode
    if (error.severity === ErrorSeverity.LOW && 
        this.config.strategy !== ErrorHandlingStrategy.VERBOSE) {
      return;
    }

    const notification = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'error',
      severity: error.severity,
      message: error.getUserMessage(),
      details: error.message,
      recoverable: error.isRecoverable(),
      recovered: recoveryResult?.success || false,
      timestamp: new Date().toISOString(),
      actions: this.getNotificationActions(error, recoveryResult)
    };

    // Add to notification queue
    this.userNotificationQueue.push(notification);

    // Execute custom notification callback
    if (this.config.onUserNotification) {
      try {
        await this.config.onUserNotification(notification);
      } catch (callbackError) {
        logger.error('Error in custom notification callback', callbackError);
      }
    }

    // Default notification display (can be overridden)
    this.displayDefaultNotification(notification);
  }

  /**
   * Gets available actions for error notification
   * @param {DiagramError} error - Error instance
   * @param {Object} recoveryResult - Recovery result
   * @returns {Array} Available actions
   * @private
   */
  getNotificationActions(error, recoveryResult) {
    const actions = [];

    if (error.isRecoverable() && !recoveryResult?.success) {
      actions.push({
        label: 'Retry',
        action: 'retry',
        primary: true
      });
    }

    if (error.severity >= ErrorSeverity.HIGH) {
      actions.push({
        label: 'View Details',
        action: 'details',
        primary: false
      });
    }

    actions.push({
      label: 'Dismiss',
      action: 'dismiss',
      primary: false
    });

    return actions;
  }

  /**
   * Displays default error notification
   * @param {Object} notification - Notification to display
   * @private
   */
  displayDefaultNotification(notification) {
    // Simple console-based notification (can be enhanced with UI)
    const style = notification.severity === ErrorSeverity.CRITICAL 
      ? 'color: white; background-color: red; padding: 4px 8px; font-weight: bold;'
      : 'color: red; font-weight: bold;';
    
    console.warn(`%c[Diagram Error] ${notification.message}`, style);
    
    if (notification.recovered) {
      console.info('%c[Diagram Recovery] Error was automatically recovered', 
        'color: green; font-weight: bold;');
    }
  }

  /**
   * Reports error to external service
   * @param {DiagramError} error - Error to report
   * @param {Object} context - Additional context
   * @private
   */
  async reportError(error, context) {
    if (!this.config.reportingEndpoint) {
      return;
    }

    try {
      const errorReport = {
        error: error.toDetailedObject(),
        context,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        timestamp: new Date().toISOString(),
        libraryVersion: '1.0.0' // Should be dynamically set
      };

      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      });

      logger.debug('Error report sent successfully');
    } catch (reportingError) {
      logger.error('Failed to send error report', reportingError);
    }
  }

  /**
   * Gets error statistics
   * @returns {Object} Error statistics
   */
  getErrorStatistics() {
    return {
      totalErrors: this.errorHistory.length,
      errorCounts: Object.fromEntries(this.errorCounts),
      recentErrors: this.errorHistory.slice(-10),
      errorsByType: this.getErrorsByType(),
      errorsBySeverity: this.getErrorsBySeverity()
    };
  }

  /**
   * Gets errors grouped by type
   * @returns {Object} Errors grouped by type
   * @private
   */
  getErrorsByType() {
    const byType = {};
    this.errorHistory.forEach(({ error }) => {
      byType[error.type] = (byType[error.type] || 0) + 1;
    });
    return byType;
  }

  /**
   * Gets errors grouped by severity
   * @returns {Object} Errors grouped by severity
   * @private
   */
  getErrorsBySeverity() {
    const bySeverity = {};
    this.errorHistory.forEach(({ error }) => {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });
    return bySeverity;
  }

  /**
   * Clears error history and statistics
   */
  clearErrorHistory() {
    this.errorHistory = [];
    this.errorCounts.clear();
    this.userNotificationQueue = [];
    logger.info('Error history cleared');
  }

  /**
   * Updates error handler configuration
   * @param {Partial<ErrorHandlerConfig>} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.debug('Error handler configuration updated', newConfig);
  }

  /**
   * Gets pending user notifications
   * @returns {Array} Pending notifications
   */
  getPendingNotifications() {
    return [...this.userNotificationQueue];
  }

  /**
   * Dismisses a user notification
   * @param {string} notificationId - Notification ID to dismiss
   */
  dismissNotification(notificationId) {
    const index = this.userNotificationQueue.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.userNotificationQueue.splice(index, 1);
    }
  }
}

/**
 * Default error handler instance
 * @type {ErrorHandler}
 */
export const errorHandler = new ErrorHandler();

/**
 * Creates an error handler with specific configuration
 * @param {ErrorHandlerConfig} config - Error handler configuration
 * @returns {ErrorHandler} Configured error handler instance
 */
export function createErrorHandler(config) {
  return new ErrorHandler(config);
}