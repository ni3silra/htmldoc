/**
 * ValidationErrors - HTML input validation with clear error messages
 * Provides specific validation rules and error messages for diagram elements
 */

import { DiagramErrorFactory } from './DiagramError.js';

/**
 * Validation rule types
 * @readonly
 * @enum {string}
 */
export const ValidationRuleType = {
  REQUIRED_ATTRIBUTE: 'REQUIRED_ATTRIBUTE',
  INVALID_ATTRIBUTE_VALUE: 'INVALID_ATTRIBUTE_VALUE',
  UNSUPPORTED_ELEMENT: 'UNSUPPORTED_ELEMENT',
  CIRCULAR_REFERENCE: 'CIRCULAR_REFERENCE',
  MISSING_CONNECTION_TARGET: 'MISSING_CONNECTION_TARGET',
  DUPLICATE_ID: 'DUPLICATE_ID',
  INVALID_NESTING: 'INVALID_NESTING',
  MALFORMED_HTML: 'MALFORMED_HTML'
};

/**
 * Supported diagram element types
 * @readonly
 * @enum {string}
 */
export const SupportedElements = {
  MICROSERVICE: 'microservice',
  DATABASE: 'database',
  API_GATEWAY: 'api-gateway',
  SERVICE: 'service',
  LOAD_BALANCER: 'load-balancer',
  CACHE: 'cache',
  QUEUE: 'queue',
  STORAGE: 'storage'
};

/**
 * Required attributes for each element type
 * @type {Object<string, string[]>}
 */
export const REQUIRED_ATTRIBUTES = {
  [SupportedElements.MICROSERVICE]: ['name'],
  [SupportedElements.DATABASE]: ['name'],
  [SupportedElements.API_GATEWAY]: ['name'],
  [SupportedElements.SERVICE]: ['name'],
  [SupportedElements.LOAD_BALANCER]: ['name'],
  [SupportedElements.CACHE]: ['name'],
  [SupportedElements.QUEUE]: ['name'],
  [SupportedElements.STORAGE]: ['name']
};

/**
 * Valid attribute values for specific attributes
 * @type {Object<string, string[]>}
 */
export const VALID_ATTRIBUTE_VALUES = {
  brand: ['aws', 'azure', 'gcp', 'kubernetes', 'docker', 'generic'],
  type: ['primary', 'secondary', 'backup', 'replica'],
  status: ['active', 'inactive', 'maintenance', 'error']
};

/**
 * HTML input validator for diagram elements
 */
export class ValidationErrors {
  constructor() {
    this.validationRules = new Map();
    this.setupValidationRules();
  }

  /**
   * Sets up all validation rules
   * @private
   */
  setupValidationRules() {
    this.validationRules.set(ValidationRuleType.REQUIRED_ATTRIBUTE, this.validateRequiredAttributes.bind(this));
    this.validationRules.set(ValidationRuleType.INVALID_ATTRIBUTE_VALUE, this.validateAttributeValues.bind(this));
    this.validationRules.set(ValidationRuleType.UNSUPPORTED_ELEMENT, this.validateSupportedElements.bind(this));
    this.validationRules.set(ValidationRuleType.CIRCULAR_REFERENCE, this.validateCircularReferences.bind(this));
    this.validationRules.set(ValidationRuleType.MISSING_CONNECTION_TARGET, this.validateConnectionTargets.bind(this));
    this.validationRules.set(ValidationRuleType.DUPLICATE_ID, this.validateUniqueIds.bind(this));
    this.validationRules.set(ValidationRuleType.INVALID_NESTING, this.validateNesting.bind(this));
    this.validationRules.set(ValidationRuleType.MALFORMED_HTML, this.validateHTMLStructure.bind(this));
  }

  /**
   * Validates a collection of parsed elements
   * @param {Array} elements - Parsed diagram elements
   * @returns {ValidationResult} Validation result with errors and warnings
   */
  validateElements(elements) {
    const errors = [];
    const warnings = [];

    // Run all validation rules
    for (const [ruleType, validator] of this.validationRules) {
      try {
        const result = validator(elements);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      } catch (error) {
        errors.push(DiagramErrorFactory.createValidationError(
          `Validation rule ${ruleType} failed: ${error.message}`,
          { ruleType, originalError: error }
        ));
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      elementCount: elements.length
    };
  }

  /**
   * Validates that required attributes are present
   * @param {Array} elements - Elements to validate
   * @returns {Object} Validation result
   */
  validateRequiredAttributes(elements) {
    const errors = [];
    const warnings = [];

    elements.forEach((element, index) => {
      const requiredAttrs = REQUIRED_ATTRIBUTES[element.type] || [];
      
      requiredAttrs.forEach(attr => {
        if (!element.attributes || !element.attributes[attr]) {
          errors.push(DiagramErrorFactory.createValidationError(
            `Missing required attribute '${attr}' for ${element.type} element`,
            {
              elementIndex: index,
              elementType: element.type,
              elementId: element.id,
              missingAttribute: attr,
              suggestion: `Add ${attr}="your-value" to the ${element.type} element`
            }
          ));
        }
      });

      // Check for empty required attributes
      if (element.attributes) {
        Object.entries(element.attributes).forEach(([key, value]) => {
          if (requiredAttrs.includes(key) && (!value || value.trim() === '')) {
            warnings.push(DiagramErrorFactory.createValidationError(
              `Empty value for required attribute '${key}' in ${element.type} element`,
              {
                elementIndex: index,
                elementType: element.type,
                elementId: element.id,
                emptyAttribute: key
              }
            ));
          }
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Validates attribute values against allowed values
   * @param {Array} elements - Elements to validate
   * @returns {Object} Validation result
   */
  validateAttributeValues(elements) {
    const errors = [];
    const warnings = [];

    elements.forEach((element, index) => {
      if (!element.attributes) return;

      Object.entries(element.attributes).forEach(([attr, value]) => {
        if (VALID_ATTRIBUTE_VALUES[attr]) {
          const validValues = VALID_ATTRIBUTE_VALUES[attr];
          if (!validValues.includes(value.toLowerCase())) {
            errors.push(DiagramErrorFactory.createValidationError(
              `Invalid value '${value}' for attribute '${attr}' in ${element.type} element`,
              {
                elementIndex: index,
                elementType: element.type,
                elementId: element.id,
                invalidAttribute: attr,
                invalidValue: value,
                validValues: validValues,
                suggestion: `Use one of: ${validValues.join(', ')}`
              }
            ));
          }
        }
      });
    });

    return { errors, warnings };
  }

  /**
   * Validates that only supported elements are used
   * @param {Array} elements - Elements to validate
   * @returns {Object} Validation result
   */
  validateSupportedElements(elements) {
    const errors = [];
    const warnings = [];
    const supportedTypes = Object.values(SupportedElements);

    elements.forEach((element, index) => {
      if (!supportedTypes.includes(element.type)) {
        errors.push(DiagramErrorFactory.createValidationError(
          `Unsupported element type '${element.type}'`,
          {
            elementIndex: index,
            elementType: element.type,
            elementId: element.id,
            supportedTypes: supportedTypes,
            suggestion: `Use one of the supported types: ${supportedTypes.join(', ')}`
          }
        ));
      }
    });

    return { errors, warnings };
  }

  /**
   * Validates that there are no circular references in connections
   * @param {Array} elements - Elements to validate
   * @returns {Object} Validation result
   */
  validateCircularReferences(elements) {
    const errors = [];
    const warnings = [];
    const connectionGraph = new Map();

    // Build connection graph
    elements.forEach(element => {
      if (element.attributes && element.attributes.connects) {
        const connections = element.attributes.connects.split(',').map(c => c.trim());
        connectionGraph.set(element.id, connections);
      }
    });

    // Check for circular references using DFS
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (nodeId, path = []) => {
      if (recursionStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        const cycle = path.slice(cycleStart).concat(nodeId);
        errors.push(DiagramErrorFactory.createValidationError(
          `Circular reference detected in connections: ${cycle.join(' → ')}`,
          {
            cycle: cycle,
            suggestion: 'Remove one of the connections to break the cycle'
          }
        ));
        return true;
      }

      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const connections = connectionGraph.get(nodeId) || [];
      for (const connection of connections) {
        if (hasCycle(connection, [...path, nodeId])) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of connectionGraph.keys()) {
      if (!visited.has(nodeId)) {
        hasCycle(nodeId);
      }
    }

    return { errors, warnings };
  }

  /**
   * Validates that connection targets exist
   * @param {Array} elements - Elements to validate
   * @returns {Object} Validation result
   */
  validateConnectionTargets(elements) {
    const errors = [];
    const warnings = [];
    const elementIds = new Set(elements.map(el => el.id).filter(id => id));

    elements.forEach((element, index) => {
      if (element.attributes && element.attributes.connects) {
        const connections = element.attributes.connects.split(',').map(c => c.trim());
        
        connections.forEach(targetId => {
          if (targetId && !elementIds.has(targetId)) {
            errors.push(DiagramErrorFactory.createValidationError(
              `Connection target '${targetId}' not found for ${element.type} element`,
              {
                elementIndex: index,
                elementType: element.type,
                elementId: element.id,
                missingTargetId: targetId,
                availableIds: Array.from(elementIds),
                suggestion: `Ensure an element with id='${targetId}' exists, or remove this connection`
              }
            ));
          }
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Validates that element IDs are unique
   * @param {Array} elements - Elements to validate
   * @returns {Object} Validation result
   */
  validateUniqueIds(elements) {
    const errors = [];
    const warnings = [];
    const idCounts = new Map();

    // Count ID occurrences
    elements.forEach((element, index) => {
      if (element.id) {
        if (!idCounts.has(element.id)) {
          idCounts.set(element.id, []);
        }
        idCounts.get(element.id).push({ element, index });
      } else {
        warnings.push(DiagramErrorFactory.createValidationError(
          `Element at index ${index} has no ID attribute`,
          {
            elementIndex: index,
            elementType: element.type,
            suggestion: 'Add an id attribute for better diagram organization'
          }
        ));
      }
    });

    // Report duplicates
    idCounts.forEach((occurrences, id) => {
      if (occurrences.length > 1) {
        errors.push(DiagramErrorFactory.createValidationError(
          `Duplicate ID '${id}' found in ${occurrences.length} elements`,
          {
            duplicateId: id,
            occurrences: occurrences.map(occ => ({
              index: occ.index,
              type: occ.element.type
            })),
            suggestion: 'Ensure all element IDs are unique'
          }
        ));
      }
    });

    return { errors, warnings };
  }

  /**
   * Validates element nesting rules
   * @param {Array} elements - Elements to validate
   * @returns {Object} Validation result
   */
  validateNesting(elements) {
    const errors = [];
    const warnings = [];

    // Define nesting rules (which elements can contain which)
    const nestingRules = {
      [SupportedElements.MICROSERVICE]: [SupportedElements.DATABASE, SupportedElements.CACHE],
      [SupportedElements.API_GATEWAY]: [SupportedElements.SERVICE],
      // Most elements cannot contain others by default
    };

    elements.forEach((element, index) => {
      if (element.children && element.children.length > 0) {
        const allowedChildren = nestingRules[element.type] || [];
        
        element.children.forEach((child, childIndex) => {
          if (!allowedChildren.includes(child.type)) {
            warnings.push(DiagramErrorFactory.createValidationError(
              `Unusual nesting: ${child.type} inside ${element.type}`,
              {
                parentIndex: index,
                parentType: element.type,
                childIndex: childIndex,
                childType: child.type,
                suggestion: 'Consider if this nesting makes architectural sense'
              }
            ));
          }
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Validates HTML structure and syntax
   * @param {Array} elements - Elements to validate
   * @returns {Object} Validation result
   */
  validateHTMLStructure(elements) {
    const errors = [];
    const warnings = [];

    elements.forEach((element, index) => {
      // Check for malformed attributes
      if (element.attributes) {
        Object.entries(element.attributes).forEach(([key, value]) => {
          // Check for suspicious attribute names
          if (key.includes(' ') || key.includes('\n') || key.includes('\t')) {
            errors.push(DiagramErrorFactory.createValidationError(
              `Malformed attribute name '${key}' contains whitespace`,
              {
                elementIndex: index,
                elementType: element.type,
                malformedAttribute: key,
                suggestion: 'Remove whitespace from attribute names'
              }
            ));
          }

          // Check for unescaped quotes in values
          if (typeof value === 'string' && (value.includes('"') || value.includes("'"))) {
            warnings.push(DiagramErrorFactory.createValidationError(
              `Attribute value contains unescaped quotes: ${key}="${value}"`,
              {
                elementIndex: index,
                elementType: element.type,
                attribute: key,
                value: value,
                suggestion: 'Escape quotes in attribute values'
              }
            ));
          }
        });
      }

      // Check for empty elements
      if (!element.attributes || Object.keys(element.attributes).length === 0) {
        warnings.push(DiagramErrorFactory.createValidationError(
          `Element ${element.type} has no attributes`,
          {
            elementIndex: index,
            elementType: element.type,
            suggestion: 'Add at least a name attribute to make the element meaningful'
          }
        ));
      }
    });

    return { errors, warnings };
  }

  /**
   * Creates a detailed validation report
   * @param {ValidationResult} validationResult - Result from validateElements
   * @returns {string} Formatted validation report
   */
  createValidationReport(validationResult) {
    let report = `Validation Report\n`;
    report += `================\n`;
    report += `Elements validated: ${validationResult.elementCount}\n`;
    report += `Status: ${validationResult.isValid ? 'VALID' : 'INVALID'}\n`;
    report += `Errors: ${validationResult.errors.length}\n`;
    report += `Warnings: ${validationResult.warnings.length}\n\n`;

    if (validationResult.errors.length > 0) {
      report += `ERRORS:\n`;
      report += `-------\n`;
      validationResult.errors.forEach((error, index) => {
        report += `${index + 1}. ${error.message}\n`;
        if (error.context.suggestion) {
          report += `   Suggestion: ${error.context.suggestion}\n`;
        }
        report += `\n`;
      });
    }

    if (validationResult.warnings.length > 0) {
      report += `WARNINGS:\n`;
      report += `---------\n`;
      validationResult.warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning.message}\n`;
        if (warning.context.suggestion) {
          report += `   Suggestion: ${warning.context.suggestion}\n`;
        }
        report += `\n`;
      });
    }

    return report;
  }
}

/**
 * Validation result type definition
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {DiagramError[]} errors - Array of validation errors
 * @property {DiagramError[]} warnings - Array of validation warnings
 * @property {number} elementCount - Number of elements validated
 */