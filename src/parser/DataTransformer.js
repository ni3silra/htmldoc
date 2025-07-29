/**
 * @fileoverview Data Transformer for converting parsed HTML elements to graph data structures
 * This module handles the transformation of ParsedElement objects into Node and Edge objects
 * suitable for force-directed layout algorithms and SVG rendering.
 */

/**
 * DataTransformer class for converting parsed HTML elements to graph structures
 * Transforms hierarchical HTML element data into flat graph representation with nodes and edges
 */
export class DataTransformer {
  /**
   * Creates a new DataTransformer instance
   * @param {Object} options - Transformer configuration options
   * @param {Object} [options.nodeDefaults] - Default properties for nodes
   * @param {Object} [options.edgeDefaults] - Default properties for edges
   * @param {boolean} [options.preserveHierarchy=true] - Whether to create edges for parent-child relationships
   * @param {boolean} [options.autoGeneratePositions=true] - Whether to generate initial positions
   */
  constructor(options = {}) {
    this.options = {
      nodeDefaults: {
        size: { width: 120, height: 80 },
        position: { x: 0, y: 0 },
        weight: 1,
        fixed: false
      },
      edgeDefaults: {
        weight: 1,
        bidirectional: false
      },
      preserveHierarchy: true,
      autoGeneratePositions: true,
      ...options
    };
    
    this.nodeCounter = 0;
    this.edgeCounter = 0;
  }

  /**
   * Transforms parsed HTML elements into graph data structure
   * Converts hierarchical element structure into flat nodes and edges representation
   * suitable for force-directed layout algorithms
   * 
   * @param {import('../types/index.js').ParsedElement[]} elements - Array of parsed HTML elements
   * @returns {import('../types/index.js').GraphData} Complete graph data with nodes, edges, and metadata
   * 
   * @example
   * const transformer = new DataTransformer();
   * const graphData = transformer.transformToGraph(parsedElements);
   * console.log(`Generated ${graphData.nodes.length} nodes and ${graphData.edges.length} edges`);
   */
  transformToGraph(elements) {
    // Reset counters for consistent ID generation
    this.nodeCounter = 0;
    this.edgeCounter = 0;
    
    // Flatten the hierarchical structure into a list of all elements
    const allElements = this._flattenElements(elements);
    
    // Create nodes from all elements
    const nodes = this.createNodes(allElements);
    
    // Create edges from connections and hierarchy
    const edges = this.createEdges(allElements, nodes);
    
    // Calculate graph bounds and center
    const bounds = this._calculateBounds(nodes);
    const center = this._calculateCenter(bounds);
    
    return {
      nodes,
      edges,
      bounds,
      center
    };
  }

  /**
   * Creates Node objects from parsed elements with proper typing and metadata handling
   * Generates comprehensive node data including positioning, styling, and metadata
   * Each node represents a diagram component with all necessary rendering information
   * 
   * @param {import('../types/index.js').ParsedElement[]} elements - Flattened array of parsed elements
   * @returns {import('../types/index.js').Node[]} Array of Node objects ready for layout calculation
   * 
   * @example
   * const nodes = transformer.createNodes(flattenedElements);
   * nodes.forEach(node => {
   *   console.log(`Node ${node.id}: ${node.label} (${node.type})`);
   * });
   */
  createNodes(elements) {
    const nodes = [];
    
    for (const element of elements) {
      // Generate display label from name attribute or fallback to ID
      const label = this._generateNodeLabel(element);
      
      // Determine icon identifier based on element type and brand
      const icon = this._determineNodeIcon(element);
      
      // Calculate initial position if auto-generation is enabled
      const position = this.options.autoGeneratePositions 
        ? this._generateInitialPosition(nodes.length)
        : { ...this.options.nodeDefaults.position };
      
      // Determine node size based on type and content
      const size = this._calculateNodeSize(element);
      
      // Generate styling information based on element type
      const style = this._generateNodeStyle(element);
      
      // Extract and process metadata from element attributes
      const metadata = this._processNodeMetadata(element);
      
      // Create the complete node object
      const node = {
        id: element.id,
        type: element.type,
        label,
        icon,
        position,
        size,
        style,
        metadata,
        fixed: this.options.nodeDefaults.fixed,
        weight: this._calculateNodeWeight(element)
      };
      
      nodes.push(node);
    }
    
    return nodes;
  }

  /**
   * Creates Edge objects for connection and hierarchy relationships
   * Generates edges based on explicit connections (connects attribute) and 
   * implicit hierarchy (parent-child relationships in HTML structure)
   * 
   * @param {import('../types/index.js').ParsedElement[]} elements - All parsed elements
   * @param {import('../types/index.js').Node[]} nodes - Generated nodes for reference
   * @returns {import('../types/index.js').Edge[]} Array of Edge objects representing relationships
   * 
   * @example
   * const edges = transformer.createEdges(elements, nodes);
   * edges.forEach(edge => {
   *   console.log(`Edge: ${edge.source} -> ${edge.target} (${edge.type})`);
   * });
   */
  createEdges(elements, nodes) {
    const edges = [];
    const nodeIdSet = new Set(nodes.map(node => node.id));
    
    // Create a map for quick element lookup
    const elementMap = new Map();
    for (const element of elements) {
      elementMap.set(element.id, element);
    }
    
    // Process each element to create edges
    for (const element of elements) {
      // Create edges for explicit connections (connects attribute)
      for (const targetId of element.connections) {
        if (nodeIdSet.has(targetId) && targetId !== element.id) {
          const edge = this._createConnectionEdge(element.id, targetId, element, elementMap.get(targetId));
          if (edge) {
            edges.push(edge);
          }
        }
      }
      
      // Create edges for hierarchical relationships if enabled
      if (this.options.preserveHierarchy) {
        for (const child of element.children) {
          const hierarchyEdge = this._createHierarchyEdge(element.id, child.id, element, child);
          if (hierarchyEdge) {
            edges.push(hierarchyEdge);
          }
        }
      }
    }
    
    return edges;
  }

  /**
   * Flattens hierarchical element structure into a single array
   * Recursively processes nested elements to create a flat list while preserving relationships
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement[]} elements - Hierarchical elements
   * @param {import('../types/index.js').ParsedElement[]} [result=[]] - Accumulator for flattened elements
   * @returns {import('../types/index.js').ParsedElement[]} Flattened array of all elements
   */
  _flattenElements(elements, result = []) {
    for (const element of elements) {
      result.push(element);
      
      // Recursively flatten children
      if (element.children && element.children.length > 0) {
        this._flattenElements(element.children, result);
      }
    }
    
    return result;
  }

  /**
   * Generates appropriate display label for a node
   * Uses name attribute if available, otherwise falls back to formatted ID
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} element - Element to generate label for
   * @returns {string} Human-readable label for the node
   */
  _generateNodeLabel(element) {
    if (element.attributes.name) {
      return element.attributes.name;
    }
    
    // Generate label from ID by replacing dashes with spaces and capitalizing
    return element.id
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Determines appropriate icon identifier for a node
   * Combines element type and brand information to select the best icon
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} element - Element to determine icon for
   * @returns {string} Icon identifier for the node
   */
  _determineNodeIcon(element) {
    const { type, attributes } = element;
    
    // If brand is specified, use brand-specific icon
    if (attributes.brand) {
      return `${type}-${attributes.brand}`;
    }
    
    // Use generic type icon as fallback
    return type;
  }

  /**
   * Generates initial position for a node using circular layout algorithm
   * Distributes nodes in a circle to provide good starting positions for force simulation
   * 
   * @private
   * @param {number} index - Index of the node in the array
   * @returns {Object} Position object with x and y coordinates
   */
  _generateInitialPosition(index) {
    const radius = 200;
    const angle = (index * 2 * Math.PI) / Math.max(1, index + 1);
    
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }

  /**
   * Calculates appropriate size for a node based on its type and content
   * Different node types may have different default sizes
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} element - Element to calculate size for
   * @returns {Object} Size object with width and height
   */
  _calculateNodeSize(element) {
    const baseSizes = {
      'microservice': { width: 140, height: 90 },
      'api-gateway': { width: 120, height: 80 },
      'database': { width: 100, height: 100 },
      'load-balancer': { width: 130, height: 70 },
      'cache': { width: 110, height: 80 },
      'queue': { width: 120, height: 60 },
      'storage': { width: 100, height: 80 },
      'external-service': { width: 130, height: 80 },
      'user': { width: 80, height: 80 },
      'admin': { width: 80, height: 80 }
    };
    
    return baseSizes[element.type] || this.options.nodeDefaults.size;
  }

  /**
   * Generates styling information for a node based on its type
   * Creates type-specific visual styling while maintaining consistency
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} element - Element to generate style for
   * @returns {import('../types/index.js').NodeStyle} Style object for the node
   */
  _generateNodeStyle(element) {
    const typeStyles = {
      'microservice': {
        fill: '#e3f2fd',
        stroke: '#1976d2',
        strokeWidth: 2,
        textColor: '#1565c0'
      },
      'api-gateway': {
        fill: '#f3e5f5',
        stroke: '#7b1fa2',
        strokeWidth: 2,
        textColor: '#6a1b9a'
      },
      'database': {
        fill: '#e8f5e8',
        stroke: '#388e3c',
        strokeWidth: 2,
        textColor: '#2e7d32'
      },
      'load-balancer': {
        fill: '#fff3e0',
        stroke: '#f57c00',
        strokeWidth: 2,
        textColor: '#ef6c00'
      },
      'cache': {
        fill: '#fce4ec',
        stroke: '#c2185b',
        strokeWidth: 2,
        textColor: '#ad1457'
      },
      'queue': {
        fill: '#f1f8e9',
        stroke: '#689f38',
        strokeWidth: 2,
        textColor: '#558b2f'
      },
      'storage': {
        fill: '#e0f2f1',
        stroke: '#00796b',
        strokeWidth: 2,
        textColor: '#00695c'
      },
      'external-service': {
        fill: '#fafafa',
        stroke: '#616161',
        strokeWidth: 2,
        textColor: '#424242'
      },
      'user': {
        fill: '#e8eaf6',
        stroke: '#3f51b5',
        strokeWidth: 2,
        textColor: '#303f9f'
      },
      'admin': {
        fill: '#ffebee',
        stroke: '#d32f2f',
        strokeWidth: 2,
        textColor: '#c62828'
      }
    };
    
    const baseStyle = {
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      fontWeight: 'normal',
      opacity: 1,
      borderRadius: 8
    };
    
    return {
      ...baseStyle,
      ...(typeStyles[element.type] || {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
        textColor: '#333333'
      })
    };
  }

  /**
   * Processes and enriches metadata from element attributes
   * Extracts custom attributes and adds computed metadata
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} element - Element to process metadata for
   * @returns {Object} Processed metadata object
   */
  _processNodeMetadata(element) {
    const metadata = { ...element.metadata };
    
    // Add computed metadata
    metadata.originalType = element.type;
    metadata.hasChildren = element.children.length > 0;
    metadata.connectionCount = element.connections.length;
    metadata.brand = element.attributes.brand || null;
    
    // Add custom attributes as metadata
    for (const [key, value] of Object.entries(element.attributes)) {
      if (!['id', 'name', 'connects'].includes(key)) {
        metadata[key] = value;
      }
    }
    
    return metadata;
  }

  /**
   * Calculates weight factor for a node based on its connections and importance
   * Nodes with more connections get higher weight for layout calculations
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} element - Element to calculate weight for
   * @returns {number} Weight factor for the node
   */
  _calculateNodeWeight(element) {
    const baseWeight = this.options.nodeDefaults.weight;
    const connectionBonus = element.connections.length * 0.1;
    const childBonus = element.children.length * 0.05;
    
    return baseWeight + connectionBonus + childBonus;
  }

  /**
   * Creates an edge for explicit connections between elements
   * Handles connection-type relationships defined by the connects attribute
   * 
   * @private
   * @param {string} sourceId - ID of the source node
   * @param {string} targetId - ID of the target node
   * @param {import('../types/index.js').ParsedElement} sourceElement - Source element data
   * @param {import('../types/index.js').ParsedElement} [targetElement] - Target element data
   * @returns {import('../types/index.js').Edge|null} Edge object or null if invalid
   */
  _createConnectionEdge(sourceId, targetId, sourceElement, targetElement) {
    const edgeId = `connection-${++this.edgeCounter}`;
    
    // Determine if connection should be bidirectional
    const bidirectional = this._shouldBeBidirectional(sourceElement, targetElement);
    
    // Generate edge styling based on connection type
    const style = this._generateConnectionEdgeStyle(sourceElement, targetElement);
    
    // Calculate edge weight based on element types
    const weight = this._calculateEdgeWeight(sourceElement, targetElement);
    
    return {
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: 'connection',
      style,
      weight,
      bidirectional,
      metadata: {
        sourceType: sourceElement.type,
        targetType: targetElement?.type || 'unknown',
        connectionType: 'explicit'
      }
    };
  }

  /**
   * Creates an edge for hierarchical relationships between parent and child elements
   * Handles parent-child relationships from HTML nesting structure
   * 
   * @private
   * @param {string} parentId - ID of the parent node
   * @param {string} childId - ID of the child node
   * @param {import('../types/index.js').ParsedElement} parentElement - Parent element data
   * @param {import('../types/index.js').ParsedElement} childElement - Child element data
   * @returns {import('../types/index.js').Edge|null} Edge object or null if invalid
   */
  _createHierarchyEdge(parentId, childId, parentElement, childElement) {
    const edgeId = `hierarchy-${++this.edgeCounter}`;
    
    // Generate hierarchy-specific styling
    const style = this._generateHierarchyEdgeStyle(parentElement, childElement);
    
    // Hierarchy edges typically have lower weight
    const weight = this.options.edgeDefaults.weight * 0.5;
    
    return {
      id: edgeId,
      source: parentId,
      target: childId,
      type: 'hierarchy',
      style,
      weight,
      bidirectional: false,
      metadata: {
        sourceType: parentElement.type,
        targetType: childElement.type,
        connectionType: 'hierarchy'
      }
    };
  }

  /**
   * Determines if a connection should be bidirectional based on element types
   * Some element type combinations naturally have bidirectional relationships
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} sourceElement - Source element
   * @param {import('../types/index.js').ParsedElement} [targetElement] - Target element
   * @returns {boolean} Whether the connection should be bidirectional
   */
  _shouldBeBidirectional(sourceElement, targetElement) {
    if (!targetElement) return false;
    
    // Define bidirectional relationship patterns
    const bidirectionalPairs = [
      ['microservice', 'microservice'],
      ['api-gateway', 'load-balancer'],
      ['cache', 'database']
    ];
    
    return bidirectionalPairs.some(([type1, type2]) => 
      (sourceElement.type === type1 && targetElement.type === type2) ||
      (sourceElement.type === type2 && targetElement.type === type1)
    );
  }

  /**
   * Generates styling for connection edges based on element types
   * Creates visually distinct styles for different types of connections
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} sourceElement - Source element
   * @param {import('../types/index.js').ParsedElement} [targetElement] - Target element
   * @returns {import('../types/index.js').EdgeStyle} Style object for the edge
   */
  _generateConnectionEdgeStyle(sourceElement, targetElement) {
    const baseStyle = {
      stroke: '#666666',
      strokeWidth: 2,
      strokeDasharray: 'none',
      opacity: 0.8,
      markerEnd: 'url(#arrowhead)'
    };
    
    // Customize style based on connection type
    if (sourceElement.type === 'api-gateway') {
      return { ...baseStyle, stroke: '#7b1fa2', strokeWidth: 2.5 };
    }
    
    if (targetElement?.type === 'database') {
      return { ...baseStyle, stroke: '#388e3c', strokeDasharray: '5,5' };
    }
    
    if (sourceElement.type === 'user' || sourceElement.type === 'admin') {
      return { ...baseStyle, stroke: '#3f51b5', strokeWidth: 1.5 };
    }
    
    return baseStyle;
  }

  /**
   * Generates styling for hierarchy edges
   * Creates subtle styling for parent-child relationships
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} parentElement - Parent element
   * @param {import('../types/index.js').ParsedElement} childElement - Child element
   * @returns {import('../types/index.js').EdgeStyle} Style object for the edge
   */
  _generateHierarchyEdgeStyle(parentElement, childElement) {
    return {
      stroke: '#cccccc',
      strokeWidth: 1,
      strokeDasharray: '3,3',
      opacity: 0.6,
      markerEnd: 'url(#hierarchy-arrow)'
    };
  }

  /**
   * Calculates weight for an edge based on element types and relationship
   * Higher weights create stronger forces in layout algorithms
   * 
   * @private
   * @param {import('../types/index.js').ParsedElement} sourceElement - Source element
   * @param {import('../types/index.js').ParsedElement} [targetElement] - Target element
   * @returns {number} Weight factor for the edge
   */
  _calculateEdgeWeight(sourceElement, targetElement) {
    let weight = this.options.edgeDefaults.weight;
    
    // Increase weight for critical connections
    if (sourceElement.type === 'api-gateway' || targetElement?.type === 'api-gateway') {
      weight *= 1.5;
    }
    
    if (targetElement?.type === 'database') {
      weight *= 1.3;
    }
    
    return weight;
  }

  /**
   * Calculates bounding box for all nodes
   * Determines the total space required for the graph
   * 
   * @private
   * @param {import('../types/index.js').Node[]} nodes - Array of nodes
   * @returns {Object} Bounds object with width, height, and coordinates
   */
  _calculateBounds(nodes) {
    if (nodes.length === 0) {
      return { width: 800, height: 600, minX: 0, minY: 0, maxX: 800, maxY: 600 };
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const node of nodes) {
      const halfWidth = node.size.width / 2;
      const halfHeight = node.size.height / 2;
      
      minX = Math.min(minX, node.position.x - halfWidth);
      minY = Math.min(minY, node.position.y - halfHeight);
      maxX = Math.max(maxX, node.position.x + halfWidth);
      maxY = Math.max(maxY, node.position.y + halfHeight);
    }
    
    // Add padding around the bounds
    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      minY,
      maxX,
      maxY
    };
  }

  /**
   * Calculates center point of the graph bounds
   * Used for centering the layout and force calculations
   * 
   * @private
   * @param {Object} bounds - Bounds object from _calculateBounds
   * @returns {Object} Center point with x and y coordinates
   */
  _calculateCenter(bounds) {
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2
    };
  }
}