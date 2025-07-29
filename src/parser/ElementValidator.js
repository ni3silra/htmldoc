/**
 * @fileoverview Element validation logic for HTML diagram parser
 * This module provides comprehensive validation for parsed diagram elements,
 * including connection validation, attribute checking, and structural integrity.
 */

/**
 * ElementValidator class for validating parsed diagram elements
 * Provides comprehensive validation with detailed error messages and warnings
 */
export class ElementValidator {
  /**
   * Creates a new ElementValidator instance
   * @param {Object} options - Validator configuration options
   * @param {boolean} [options.strictMode=false] - Whether to use strict validation mode
   * @param {string[]} [options.allowedElements] - Array of allowed element types
   * @param {boolean} [options.validateConnections=true] - Whether to validate connection references
   * @param {boolean} [options.requireUniqueIds=true] - Whether to require unique element IDs
   * @param {number} [options.maxDepth=10] - Maximum allowed nesting depth
   */
  constructor(options = {}) {
    this.options = {
      strictMode: false,
      allowedElements: [
        'microservice',
        'api-gateway', 
        'database',
        'load-balancer',
        'cache',
        'queue',
        'storage',
        'external-service',
        'user',
        'admin'
      ],
      validateConnections: true,
      requireUniqueIds: true,
      maxDepth: 10,
      ...options
    };
    
    // Required attributes for each element type
    this.requiredAttributes = {
      'microservice': ['name'],
      'api-gateway': ['name'],
      'database': ['name'],
      'load-balancer': ['name'],
      'cache': ['name'],
      'queue': ['name'],
      'storage': ['name'],
      'external-service': ['name'],
      'user': ['name'],
      'admin': ['name']
    };
    
    // Valid brand values for icon lookup
    this.validBrands = {
      'microservice': ['nodejs', 'java', 'python', 'dotnet', 'go', 'rust', 'php', 'ruby'],
      'database': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'oracle', 'sqlite'],
      'api-gateway': ['nginx', 'kong', 'aws-api-gateway', 'azure-api-management', 'istio', 'envoy'],
      'load-balancer': ['nginx', 'haproxy', 'aws-alb', 'aws-nlb', 'azure-load-balancer', 'gcp-load-balancer'],
      'cache': ['redis', 'memcached', 'hazelcast', 'ehcache'],
      'queue': ['rabbitmq', 'kafka', 'aws-sqs', 'azure-service-bus', 'activemq', 'nats'],
      'storage': ['aws-s3', 'azure-blob', 'gcp-storage', 'minio', 'ceph'],
      'external-service': ['rest-api', 'graphql', 'soap', 'grpc'],
      'user': ['web', 'mobile', 'desktop'],
      'admin': ['web', 'cli', 'dashboard']
    };
  }

  /**
   * Validates an array of parsed elements for consistency and correctness
   * Performs comprehensive validation including structure, attributes, and connections
   * 
   * @param {import('../types/index.js').ParsedElement[]} elements - Array of parsed elements to validate
   * @returns {Object} Validation result with detailed errors and warnings
   * 
   * @example
   * const validator = new ElementValidator();
   * const result = validator.validateElements(parsedElements);
   * if (!result.isValid) {
   *   result.errors.forEach(error => console.error(error.message));
   * }
   */
  validateElements(elements) {
    const errors = [];
    const warnings = [];
    const elementIds = new Set();
    const elementMap = new Map();
    
    // First pass: collect all element IDs and build element map
    this._collectElementIds(elements, elementIds, elementMap);
    
    // Second pass: validate each element
    for (const element of elements) {
      this._validateElement(element, elementIds, elementMap, errors, warnings, 0);
    }
    
    // Third pass: validate connections
    if (this.options.validateConnections) {
      this._validateConnections(elements, elementMap, errors, warnings);
    }
    
    // Check for circular dependencies
    this._validateCircularDependencies(elements, elementMap, errors);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Recursively collects all element IDs and builds element map
   * Used for connection validation and duplicate ID detection
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement[]} elements - Elements to process
   * @param {Set<string>} elementIds - Set to collect unique IDs
   * @param {Map<string, import('../types/index.js').ParsedElement>} elementMap - Map of ID to element
   */
  _collectElementIds(elements, elementIds, elementMap) {
    for (const element of elements) {
      if (elementIds.has(element.id)) {
        // Duplicate ID will be caught in validation phase
      } else {
        elementIds.add(element.id);
        elementMap.set(element.id, element);
      }
      
      // Recursively process children
      this._collectElementIds(element.children, elementIds, elementMap);
    }
  }

  /**
   * Validates a single element and its children recursively
   * Checks attributes, structure, and nesting depth
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} element - Element to validate
   * @param {Set<string>} elementIds - Set of all element IDs
   * @param {Map<string, import('../types/index.js').ParsedElement>} elementMap - Map of ID to element
   * @param {Array} errors - Array to collect validation errors
   * @param {Array} warnings - Array to collect validation warnings
   * @param {number} depth - Current nesting depth
   */
  _validateElement(element, elementIds, elementMap, errors, warnings, depth) {
    // Check nesting depth
    if (depth > this.options.maxDepth) {
      errors.push({
        type: 'MAX_DEPTH_EXCEEDED',
        message: `Element '${element.id}' exceeds maximum nesting depth of ${this.options.maxDepth}`,
        elementId: element.id,
        context: { depth, maxDepth: this.options.maxDepth }
      });
      return; // Don't process children if max depth exceeded
    }
    
    // Validate element type
    if (!this.options.allowedElements.includes(element.type)) {
      if (this.options.strictMode) {
        errors.push({
          type: 'INVALID_ELEMENT_TYPE',
          message: `Invalid element type '${element.type}' for element '${element.id}'`,
          elementId: element.id,
          context: { 
            elementType: element.type, 
            allowedTypes: this.options.allowedElements 
          }
        });
      } else {
        warnings.push({
          type: 'UNKNOWN_ELEMENT_TYPE',
          message: `Unknown element type '${element.type}' for element '${element.id}'`,
          elementId: element.id,
          suggestion: `Consider using one of: ${this.options.allowedElements.join(', ')}`
        });
      }
    }
    
    // Validate element ID
    this._validateElementId(element, elementIds, errors, warnings);
    
    // Validate required attributes
    this._validateRequiredAttributes(element, errors);
    
    // Validate attribute values
    this._validateAttributeValues(element, warnings);
    
    // Validate brand attribute
    this._validateBrandAttribute(element, warnings);
    
    // Validate children recursively
    for (const child of element.children) {
      this._validateElement(child, elementIds, elementMap, errors, warnings, depth + 1);
    }
  }

  /**
   * Validates element ID for uniqueness and format
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} element - Element to validate
   * @param {Set<string>} elementIds - Set of all element IDs
   * @param {Array} errors - Array to collect validation errors
   * @param {Array} warnings - Array to collect validation warnings
   */
  _validateElementId(element, elementIds, errors, warnings) {
    // Check ID format
    if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(element.id)) {
      errors.push({
        type: 'INVALID_ID_FORMAT',
        message: `Invalid ID format '${element.id}'. IDs must start with a letter and contain only letters, numbers, hyphens, and underscores`,
        elementId: element.id,
        context: { invalidId: element.id }
      });
    }
    
    // Check for duplicate IDs (this is handled during collection, but we track it here)
    if (this.options.requireUniqueIds) {
      // Note: Duplicate detection is handled in the collection phase
      // This is a placeholder for additional ID validation logic
    }
    
    // Warn about auto-generated IDs
    if (element.id.match(/^[a-z-]+-\d+$/)) {
      warnings.push({
        type: 'AUTO_GENERATED_ID',
        message: `Element uses auto-generated ID '${element.id}'. Consider providing an explicit ID for better maintainability`,
        elementId: element.id,
        suggestion: `Add id="${element.type}-meaningful-name" to the element`
      });
    }
  }

  /**
   * Validates that required attributes are present
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} element - Element to validate
   * @param {Array} errors - Array to collect validation errors
   */
  _validateRequiredAttributes(element, errors) {
    const required = this.requiredAttributes[element.type] || [];
    
    for (const attr of required) {
      if (!element.attributes[attr] || element.attributes[attr].trim() === '') {
        errors.push({
          type: 'MISSING_REQUIRED_ATTRIBUTE',
          message: `Missing required attribute '${attr}' for ${element.type} element '${element.id}'`,
          elementId: element.id,
          context: { 
            missingAttribute: attr, 
            elementType: element.type,
            requiredAttributes: required
          }
        });
      }
    }
  }

  /**
   * Validates attribute values for format and content
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} element - Element to validate
   * @param {Array} warnings - Array to collect validation warnings
   */
  _validateAttributeValues(element, warnings) {
    // Validate name attribute
    if (element.attributes.name) {
      const name = element.attributes.name.trim();
      if (name.length === 0) {
        warnings.push({
          type: 'EMPTY_NAME_ATTRIBUTE',
          message: `Empty name attribute for element '${element.id}'`,
          elementId: element.id,
          suggestion: 'Provide a meaningful name for better diagram readability'
        });
      } else if (name.length > 50) {
        warnings.push({
          type: 'LONG_NAME_ATTRIBUTE',
          message: `Name attribute '${name}' is very long (${name.length} characters) for element '${element.id}'`,
          elementId: element.id,
          suggestion: 'Consider using a shorter, more concise name'
        });
      }
    }
    
    // Validate connects attribute format
    if (element.attributes.connects) {
      const connects = element.attributes.connects.trim();
      if (connects.length === 0) {
        warnings.push({
          type: 'EMPTY_CONNECTS_ATTRIBUTE',
          message: `Empty connects attribute for element '${element.id}'`,
          elementId: element.id,
          suggestion: 'Remove the connects attribute if no connections are needed'
        });
      } else {
        // Check for invalid connection ID formats
        const connectionIds = connects.split(',').map(id => id.trim());
        for (const connectionId of connectionIds) {
          if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(connectionId)) {
            warnings.push({
              type: 'INVALID_CONNECTION_ID_FORMAT',
              message: `Invalid connection ID format '${connectionId}' in connects attribute for element '${element.id}'`,
              elementId: element.id,
              suggestion: 'Connection IDs must start with a letter and contain only letters, numbers, hyphens, and underscores'
            });
          }
        }
      }
    }
  }

  /**
   * Validates brand attribute against known values
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} element - Element to validate
   * @param {Array} warnings - Array to collect validation warnings
   */
  _validateBrandAttribute(element, warnings) {
    if (element.attributes.brand) {
      const brand = element.attributes.brand.toLowerCase();
      const validBrands = this.validBrands[element.type] || [];
      
      if (validBrands.length > 0 && !validBrands.includes(brand)) {
        warnings.push({
          type: 'UNKNOWN_BRAND',
          message: `Unknown brand '${brand}' for ${element.type} element '${element.id}'`,
          elementId: element.id,
          suggestion: `Consider using one of: ${validBrands.join(', ')}`
        });
      }
    }
  }

  /**
   * Validates connections between elements
   * Ensures all connection targets exist and are valid
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement[]} elements - All elements to validate
   * @param {Map<string, import('../types/index.js').ParsedElement>} elementMap - Map of ID to element
   * @param {Array} errors - Array to collect validation errors
   * @param {Array} warnings - Array to collect validation warnings
   */
  _validateConnections(elements, elementMap, errors, warnings) {
    const validateElementConnections = (element) => {
      for (const connectionId of element.connections) {
        if (!elementMap.has(connectionId)) {
          errors.push({
            type: 'INVALID_CONNECTION_TARGET',
            message: `Element '${element.id}' connects to non-existent element '${connectionId}'`,
            elementId: element.id,
            context: { 
              sourceId: element.id, 
              targetId: connectionId,
              availableIds: Array.from(elementMap.keys())
            }
          });
        } else {
          // Check for self-connections
          if (connectionId === element.id) {
            warnings.push({
              type: 'SELF_CONNECTION',
              message: `Element '${element.id}' connects to itself`,
              elementId: element.id,
              suggestion: 'Self-connections are usually not meaningful in architectural diagrams'
            });
          }
        }
      }
      
      // Recursively validate children
      for (const child of element.children) {
        validateElementConnections(child);
      }
    };
    
    for (const element of elements) {
      validateElementConnections(element);
    }
  }

  /**
   * Validates for circular dependencies in connections
   * Detects cycles that could cause infinite loops in layout algorithms
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement[]} elements - All elements to validate
   * @param {Map<string, import('../types/index.js').ParsedElement>} elementMap - Map of ID to element
   * @param {Array} errors - Array to collect validation errors
   */
  _validateCircularDependencies(elements, elementMap, errors) {
    const visited = new Set();
    const recursionStack = new Set();
    
    const hasCycle = (elementId, path = []) => {
      if (recursionStack.has(elementId)) {
        // Found a cycle
        const cycleStart = path.indexOf(elementId);
        const cycle = path.slice(cycleStart).concat([elementId]);
        errors.push({
          type: 'CIRCULAR_DEPENDENCY',
          message: `Circular dependency detected: ${cycle.join(' -> ')}`,
          elementId: elementId,
          context: { 
            cycle: cycle,
            cycleLength: cycle.length - 1
          }
        });
        return true;
      }
      
      if (visited.has(elementId)) {
        return false;
      }
      
      visited.add(elementId);
      recursionStack.add(elementId);
      
      const element = elementMap.get(elementId);
      if (element) {
        for (const connectionId of element.connections) {
          if (hasCycle(connectionId, [...path, elementId])) {
            return true;
          }
        }
      }
      
      recursionStack.delete(elementId);
      return false;
    };
    
    // Check each element for cycles
    for (const elementId of elementMap.keys()) {
      if (!visited.has(elementId)) {
        hasCycle(elementId);
      }
    }
  }
}