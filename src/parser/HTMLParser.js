/**
 * @fileoverview HTML Parser for extracting custom diagram elements from HTML markup
 * This module handles parsing of custom HTML tags like <microservice>, <api-gateway>, <database>
 * and extracts their attributes and relationships for diagram generation.
 */

import { ElementValidator } from './ElementValidator.js';

/**
 * HTMLParser class for recognizing and parsing custom diagram elements
 * Supports extraction of microservice, api-gateway, database, and other architectural components
 */
export class HTMLParser {
  /**
   * Creates a new HTMLParser instance
   * @param {Object} options - Parser configuration options
   * @param {boolean} [options.strictMode=false] - Whether to use strict parsing mode
   * @param {string[]} [options.allowedElements] - Array of allowed element types
   * @param {boolean} [options.validateConnections=true] - Whether to validate connection references
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
      ...options
    };
    
    this.validator = new ElementValidator(this.options);
    this.elementIdCounter = 0;
  }

  /**
   * Parses HTML string and extracts custom diagram elements
   * Recognizes custom tags and converts them to ParsedElement objects
   * 
   * @param {string} htmlString - HTML markup containing custom diagram elements
   * @returns {import('../types/index.js').ParseResult} Parse result with elements, errors, and warnings
   * 
   * @example
   * const parser = new HTMLParser();
   * const result = parser.parseHTML(`
   *   <microservice name="user-service" brand="nodejs" connects="database-1">
   *     <database name="user-db" id="database-1" brand="postgresql"/>
   *   </microservice>
   * `);
   */
  parseHTML(htmlString) {
    try {
      // Create a temporary DOM container to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString.trim();
      
      const elements = [];
      const errors = [];
      const warnings = [];
      
      // Process all child nodes in the temporary container
      for (const node of tempDiv.childNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const parsedElement = this._parseElement(node, errors, warnings);
          if (parsedElement) {
            elements.push(parsedElement);
          }
        }
      }
      
      // Validate the parsed elements
      const validationResult = this.validator.validateElements(elements);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);
      
      // Calculate statistics
      const statistics = this._calculateStatistics(elements);
      
      return {
        elements,
        errors,
        warnings,
        isValid: errors.length === 0,
        statistics
      };
      
    } catch (error) {
      return {
        elements: [],
        errors: [{
          type: 'PARSE_ERROR',
          message: `Failed to parse HTML: ${error.message}`,
          context: { originalError: error }
        }],
        warnings: [],
        isValid: false,
        statistics: { elementCount: 0, connectionCount: 0 }
      };
    }
  }

  /**
   * Recursively parses a DOM element and its children
   * Extracts attributes and builds the element hierarchy
   * 
   * @private
   * @param {Element} domElement - DOM element to parse
   * @param {Array} errors - Array to collect parsing errors
   * @param {Array} warnings - Array to collect parsing warnings
   * @param {number} [depth=0] - Current nesting depth for validation
   * @returns {import('../types/index.js').ParsedElement|null} Parsed element or null if invalid
   */
  _parseElement(domElement, errors, warnings, depth = 0) {
    const tagName = domElement.tagName.toLowerCase();
    
    // Check if this is a recognized diagram element
    if (!this.options.allowedElements.includes(tagName)) {
      if (this.options.strictMode) {
        errors.push({
          type: 'UNKNOWN_ELEMENT',
          message: `Unknown element type: ${tagName}`,
          elementId: domElement.id || `unknown-${this.elementIdCounter++}`,
          context: { tagName, allowedElements: this.options.allowedElements }
        });
        return null;
      } else {
        warnings.push({
          type: 'UNKNOWN_ELEMENT',
          message: `Unknown element type '${tagName}' will be treated as generic element`,
          elementId: domElement.id || `unknown-${this.elementIdCounter++}`,
          suggestion: `Use one of: ${this.options.allowedElements.join(', ')}`
        });
      }
    }
    
    // Extract attributes from the DOM element
    const attributes = this.extractAttributes(domElement);
    
    // Generate ID if not provided
    const elementId = attributes.id || this._generateElementId(tagName);
    
    // Extract connections from the connects attribute
    const connections = this._parseConnections(attributes.connects || '');
    
    // Parse child elements recursively
    const children = [];
    for (const childNode of domElement.childNodes) {
      if (childNode.nodeType === Node.ELEMENT_NODE) {
        const childElement = this._parseElement(childNode, errors, warnings, depth + 1);
        if (childElement) {
          children.push(childElement);
        }
      }
    }
    
    // Build metadata from non-standard attributes
    const metadata = this._extractMetadata(attributes);
    
    return {
      type: tagName,
      id: elementId,
      attributes,
      children,
      connections,
      metadata
    };
  }

  /**
   * Extracts all attributes from a DOM element with detailed processing
   * Handles special attributes like name, brand, connects with validation
   * 
   * @param {Element} domElement - DOM element to extract attributes from
   * @returns {Object<string, string>} Object containing all element attributes
   * 
   * @example
   * // For element: <microservice name="user-service" brand="nodejs" connects="db-1,cache-1">
   * // Returns: { name: "user-service", brand: "nodejs", connects: "db-1,cache-1", id: "auto-generated" }
   */
  extractAttributes(domElement) {
    const attributes = {};
    
    // Extract all attributes from the DOM element
    for (const attr of domElement.attributes) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();
      
      // Validate attribute names (must start with letter, contain only alphanumeric, dash, underscore)
      if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(name)) {
        // Skip invalid attribute names but don't error in non-strict mode
        continue;
      }
      
      attributes[name] = value;
    }
    
    // Ensure required attributes have defaults
    if (!attributes.name && !attributes.id) {
      attributes.name = this._generateDefaultName(domElement.tagName);
    }
    
    // Normalize the brand attribute for icon lookup
    if (attributes.brand) {
      attributes.brand = attributes.brand.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }
    
    // Process the connects attribute to ensure proper formatting
    if (attributes.connects) {
      attributes.connects = this._normalizeConnections(attributes.connects);
    }
    
    return attributes;
  }

  /**
   * Validates parsed elements for consistency and correctness
   * Checks for required attributes, valid connections, and structural integrity
   * 
   * @param {import('../types/index.js').ParsedElement[]} elements - Array of parsed elements to validate
   * @returns {Object} Validation result with comprehensive error messages
   * 
   * @example
   * const result = parser.validateElements(parsedElements);
   * if (!result.isValid) {
   *   console.error('Validation errors:', result.errors);
   * }
   */
  validateElements(elements) {
    return this.validator.validateElements(elements);
  }

  /**
   * Parses connection string into array of element IDs
   * Handles comma-separated lists and validates ID format
   * 
   * @private
   * @param {string} connectsString - Comma-separated list of element IDs
   * @returns {string[]} Array of connection target IDs
   */
  _parseConnections(connectsString) {
    if (!connectsString || typeof connectsString !== 'string') {
      return [];
    }
    
    return connectsString
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0)
      .filter(id => /^[a-zA-Z0-9-_]+$/.test(id)); // Only allow valid ID characters
  }

  /**
   * Normalizes connection string format
   * Removes extra whitespace and ensures consistent formatting
   * 
   * @private
   * @param {string} connectsString - Raw connects attribute value
   * @returns {string} Normalized connection string
   */
  _normalizeConnections(connectsString) {
    return connectsString
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0)
      .join(',');
  }

  /**
   * Generates a unique element ID based on type and counter
   * Ensures IDs are valid and unique within the document
   * 
   * @private
   * @param {string} elementType - Type of element (e.g., 'microservice', 'database')
   * @returns {string} Generated unique ID
   */
  _generateElementId(elementType) {
    return `${elementType}-${++this.elementIdCounter}`;
  }

  /**
   * Generates a default name for elements without explicit names
   * Creates human-readable names based on element type
   * 
   * @private
   * @param {string} tagName - HTML tag name
   * @returns {string} Generated default name
   */
  _generateDefaultName(tagName) {
    const typeNames = {
      'microservice': 'Microservice',
      'api-gateway': 'API Gateway',
      'database': 'Database',
      'load-balancer': 'Load Balancer',
      'cache': 'Cache',
      'queue': 'Message Queue',
      'storage': 'Storage',
      'external-service': 'External Service',
      'user': 'User',
      'admin': 'Administrator'
    };
    
    const baseName = typeNames[tagName.toLowerCase()] || 'Component';
    return `${baseName} ${this.elementIdCounter + 1}`;
  }

  /**
   * Extracts metadata from non-standard attributes
   * Preserves custom attributes for advanced use cases
   * 
   * @private
   * @param {Object} attributes - All element attributes
   * @returns {Object} Metadata object with custom attributes
   */
  _extractMetadata(attributes) {
    const standardAttributes = ['id', 'name', 'brand', 'connects', 'class'];
    const metadata = {};
    
    for (const [key, value] of Object.entries(attributes)) {
      if (!standardAttributes.includes(key)) {
        metadata[key] = value;
      }
    }
    
    return metadata;
  }

  /**
   * Calculates parsing statistics for reporting
   * Provides insights into the parsed diagram structure
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement[]} elements - Parsed elements
   * @returns {Object} Statistics object
   */
  _calculateStatistics(elements) {
    let elementCount = 0;
    let connectionCount = 0;
    
    const countElement = (element) => {
      elementCount++;
      connectionCount += element.connections.length;
      
      for (const child of element.children) {
        countElement(child);
      }
    };
    
    for (const element of elements) {
      countElement(element);
    }
    
    return {
      elementCount,
      connectionCount,
      topLevelElements: elements.length,
      averageConnectionsPerElement: elementCount > 0 ? connectionCount / elementCount : 0
    };
  }
}