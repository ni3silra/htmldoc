/**
 * Logger - Debugging and troubleshooting utility with different log levels
 * Provides structured logging for diagram library operations
 */

/**
 * Log level enumeration
 * @readonly
 * @enum {number}
 */
export const LogLevel = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
  OFF: 6
};

/**
 * Log level names for display
 * @readonly
 * @type {Object<number, string>}
 */
export const LogLevelNames = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
};

/**
 * Logger configuration
 * @typedef {Object} LoggerConfig
 * @property {LogLevel} level - Minimum log level to output
 * @property {boolean} enableConsole - Enable console output
 * @property {boolean} enableStorage - Enable local storage logging
 * @property {string} storageKey - Local storage key for logs
 * @property {number} maxStoredLogs - Maximum number of logs to store
 * @property {boolean} includeTimestamp - Include timestamp in log messages
 * @property {boolean} includeStackTrace - Include stack trace for errors
 * @property {string} prefix - Prefix for all log messages
 */

/**
 * Default logger configuration
 * @type {LoggerConfig}
 */
export const DEFAULT_LOGGER_CONFIG = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableStorage: false,
  storageKey: 'diagram-library-logs',
  maxStoredLogs: 1000,
  includeTimestamp: true,
  includeStackTrace: true,
  prefix: '[DiagramLibrary]'
};

/**
 * Logger class for structured logging with multiple output targets
 */
export class Logger {
  /**
   * Creates a new Logger instance
   * @param {LoggerConfig} [config=DEFAULT_LOGGER_CONFIG] - Logger configuration
   */
  constructor(config = DEFAULT_LOGGER_CONFIG) {
    this.config = { ...DEFAULT_LOGGER_CONFIG, ...config };
    this.logs = [];
    this.startTime = Date.now();
    
    // Load existing logs from storage if enabled
    if (this.config.enableStorage) {
      this.loadStoredLogs();
    }
  }

  /**
   * Logs a trace message (most verbose)
   * @param {string} message - Log message
   * @param {Object} [context={}] - Additional context data
   */
  trace(message, context = {}) {
    this.log(LogLevel.TRACE, message, context);
  }

  /**
   * Logs a debug message
   * @param {string} message - Log message
   * @param {Object} [context={}] - Additional context data
   */
  debug(message, context = {}) {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs an info message
   * @param {string} message - Log message
   * @param {Object} [context={}] - Additional context data
   */
  info(message, context = {}) {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Logs a warning message
   * @param {string} message - Log message
   * @param {Object} [context={}] - Additional context data
   */
  warn(message, context = {}) {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Logs an error message
   * @param {string} message - Log message
   * @param {Error|Object} [context={}] - Error object or additional context data
   */
  error(message, context = {}) {
    // If context is an Error object, extract relevant information
    if (context instanceof Error) {
      context = {
        name: context.name,
        message: context.message,
        stack: this.config.includeStackTrace ? context.stack : undefined,
        ...context
      };
    }
    
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Logs a fatal error message
   * @param {string} message - Log message
   * @param {Error|Object} [context={}] - Error object or additional context data
   */
  fatal(message, context = {}) {
    // If context is an Error object, extract relevant information
    if (context instanceof Error) {
      context = {
        name: context.name,
        message: context.message,
        stack: this.config.includeStackTrace ? context.stack : undefined,
        ...context
      };
    }
    
    this.log(LogLevel.FATAL, message, context);
  }

  /**
   * Core logging method
   * @param {LogLevel} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context data
   * @private
   */
  log(level, message, context) {
    // Check if this log level should be output
    if (level < this.config.level) {
      return;
    }

    const logEntry = this.createLogEntry(level, message, context);
    
    // Store log entry
    this.logs.push(logEntry);
    
    // Maintain log size limit
    if (this.logs.length > this.config.maxStoredLogs) {
      this.logs.shift();
    }

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }

    // Store to local storage if enabled
    if (this.config.enableStorage) {
      this.storeLog(logEntry);
    }
  }

  /**
   * Creates a structured log entry
   * @param {LogLevel} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context data
   * @returns {Object} Structured log entry
   * @private
   */
  createLogEntry(level, message, context) {
    const entry = {
      level,
      levelName: LogLevelNames[level],
      message,
      context,
      timestamp: new Date().toISOString(),
      relativeTime: Date.now() - this.startTime
    };

    // Add stack trace for errors if enabled
    if ((level >= LogLevel.ERROR) && this.config.includeStackTrace) {
      entry.stack = new Error().stack;
    }

    return entry;
  }

  /**
   * Outputs log entry to console with appropriate styling
   * @param {Object} logEntry - Log entry to output
   * @private
   */
  outputToConsole(logEntry) {
    const timestamp = this.config.includeTimestamp 
      ? `[${new Date(logEntry.timestamp).toLocaleTimeString()}] `
      : '';
    
    const prefix = this.config.prefix ? `${this.config.prefix} ` : '';
    const levelName = `[${logEntry.levelName}]`;
    const message = `${timestamp}${prefix}${levelName} ${logEntry.message}`;

    // Choose appropriate console method and styling
    switch (logEntry.level) {
      case LogLevel.TRACE:
        console.debug(`%c${message}`, 'color: #888; font-size: 11px;', logEntry.context);
        break;
      
      case LogLevel.DEBUG:
        console.debug(`%c${message}`, 'color: #666;', logEntry.context);
        break;
      
      case LogLevel.INFO:
        console.info(`%c${message}`, 'color: #2196F3;', logEntry.context);
        break;
      
      case LogLevel.WARN:
        console.warn(`%c${message}`, 'color: #FF9800; font-weight: bold;', logEntry.context);
        break;
      
      case LogLevel.ERROR:
        console.error(`%c${message}`, 'color: #F44336; font-weight: bold;', logEntry.context);
        if (logEntry.stack) {
          console.error(logEntry.stack);
        }
        break;
      
      case LogLevel.FATAL:
        console.error(`%c${message}`, 'color: #FFFFFF; background-color: #F44336; font-weight: bold; padding: 2px 4px;', logEntry.context);
        if (logEntry.stack) {
          console.error(logEntry.stack);
        }
        break;
    }
  }

  /**
   * Stores log entry to local storage
   * @param {Object} logEntry - Log entry to store
   * @private
   */
  storeLog(logEntry) {
    try {
      const storedLogs = this.getStoredLogs();
      storedLogs.push(logEntry);
      
      // Maintain storage size limit
      if (storedLogs.length > this.config.maxStoredLogs) {
        storedLogs.shift();
      }
      
      localStorage.setItem(this.config.storageKey, JSON.stringify(storedLogs));
    } catch (error) {
      // Fallback if localStorage is not available
      console.warn('Failed to store log to localStorage:', error);
    }
  }

  /**
   * Loads stored logs from local storage
   * @private
   */
  loadStoredLogs() {
    try {
      const storedLogs = this.getStoredLogs();
      this.logs = storedLogs;
    } catch (error) {
      console.warn('Failed to load stored logs:', error);
    }
  }

  /**
   * Gets stored logs from local storage
   * @returns {Array} Array of stored log entries
   * @private
   */
  getStoredLogs() {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Creates a performance timer
   * @param {string} label - Timer label
   * @returns {Function} Function to end the timer
   */
  time(label) {
    const startTime = performance.now();
    this.debug(`Timer started: ${label}`);
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.debug(`Timer ended: ${label}`, { duration: `${duration.toFixed(2)}ms` });
      return duration;
    };
  }

  /**
   * Logs performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} [context={}] - Additional context
   */
  performance(operation, duration, context = {}) {
    this.info(`Performance: ${operation}`, {
      duration: `${duration.toFixed(2)}ms`,
      ...context
    });
  }

  /**
   * Groups related log messages
   * @param {string} label - Group label
   * @param {Function} callback - Function containing grouped operations
   */
  group(label, callback) {
    if (this.config.enableConsole) {
      console.group(`${this.config.prefix} ${label}`);
    }
    
    this.debug(`Group started: ${label}`);
    
    try {
      callback();
    } finally {
      this.debug(`Group ended: ${label}`);
      
      if (this.config.enableConsole) {
        console.groupEnd();
      }
    }
  }

  /**
   * Gets all logs matching specified criteria
   * @param {Object} [filters={}] - Filter criteria
   * @param {LogLevel} [filters.minLevel] - Minimum log level
   * @param {LogLevel} [filters.maxLevel] - Maximum log level
   * @param {string} [filters.messagePattern] - Message pattern to match
   * @param {Date} [filters.since] - Only logs after this date
   * @returns {Array} Filtered log entries
   */
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    if (filters.minLevel !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= filters.minLevel);
    }

    if (filters.maxLevel !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level <= filters.maxLevel);
    }

    if (filters.messagePattern) {
      const pattern = new RegExp(filters.messagePattern, 'i');
      filteredLogs = filteredLogs.filter(log => pattern.test(log.message));
    }

    if (filters.since) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filters.since);
    }

    return filteredLogs;
  }

  /**
   * Exports logs as JSON string
   * @param {Object} [filters={}] - Filter criteria
   * @returns {string} JSON string of filtered logs
   */
  exportLogs(filters = {}) {
    const logs = this.getLogs(filters);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Clears all stored logs
   */
  clearLogs() {
    this.logs = [];
    
    if (this.config.enableStorage) {
      try {
        localStorage.removeItem(this.config.storageKey);
      } catch (error) {
        console.warn('Failed to clear stored logs:', error);
      }
    }
    
    this.info('Logs cleared');
  }

  /**
   * Updates logger configuration
   * @param {Partial<LoggerConfig>} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.debug('Logger configuration updated', newConfig);
  }

  /**
   * Gets current logger configuration
   * @returns {LoggerConfig} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Creates a child logger with additional context
   * @param {string} name - Child logger name
   * @param {Object} [context={}] - Additional context for all logs
   * @returns {Logger} Child logger instance
   */
  child(name, context = {}) {
    const childConfig = {
      ...this.config,
      prefix: `${this.config.prefix}[${name}]`
    };
    
    const childLogger = new Logger(childConfig);
    
    // Override log method to include additional context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level, message, logContext) => {
      originalLog(level, message, { ...context, ...logContext });
    };
    
    return childLogger;
  }
}

/**
 * Default logger instance
 * @type {Logger}
 */
export const logger = new Logger();

/**
 * Creates a logger with specific configuration
 * @param {LoggerConfig} config - Logger configuration
 * @returns {Logger} Configured logger instance
 */
export function createLogger(config) {
  return new Logger(config);
}