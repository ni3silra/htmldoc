/**
 * @fileoverview SVG rendering engine for diagram visualization
 * This module handles the creation and management of SVG elements for rendering
 * architectural diagrams with nodes, edges, and interactive features.
 */

import {
  createSVGElement,
  createSVGGroup,
  createNodeRect,
  createNodeCircle,
  createNodeText,
  createEdgeLine,
  createEdgePath,
  createNodeIcon,
  createSVGDefinitions,
  updateSVGAttributes,
  updateSVGStyles,
  calculateCurvedPath,
  calculateNodeBoundaryIntersection,
  animateSVGElement
} from './SVGElements.js';

/**
 * SVG renderer class for creating and managing diagram visualizations
 * Handles node rendering, edge drawing, positioning updates, and theme application
 */
export class SVGRenderer {
  /**
   * Creates a new SVGRenderer instance
   * @param {HTMLElement} container - DOM container element for the SVG
   * @param {Object} iconManager - Icon manager instance for loading icons
   * @param {Object} config - Renderer configuration options
   */
  constructor(container, iconManager = null, config = {}) {
    this.container = container;
    this.iconManager = iconManager;
    this.config = {
      enableAnimations: true,
      animationDuration: 300,
      curvedEdges: true,
      edgeCurvature: 0.3,
      showNodeIcons: true,
      iconSize: 24,
      ...config
    };
    
    // SVG elements and groups
    this.svg = null;
    this.defsGroup = null;
    this.edgesGroup = null;
    this.nodesGroup = null;
    
    // Element tracking
    this.nodeElements = new Map(); // nodeId -> SVG group element
    this.edgeElements = new Map(); // edgeId -> SVG element
    this.currentTheme = null;
    
    // Animation state
    this.animationQueue = [];
    this.isAnimating = false;
    
    this.initializeSVG();
  }

  /**
   * Initializes the SVG container and base structure
   * Creates the main SVG element and essential groups for organization
   */
  initializeSVG() {
    // Clear container
    this.container.innerHTML = '';
    
    // Create main SVG element
    this.svg = createSVGElement('svg', {
      width: '100%',
      height: '100%',
      viewBox: '0 0 800 600'
    }, {
      display: 'block',
      backgroundColor: 'transparent'
    });
    
    // Create definitions group for markers, gradients, etc.
    this.defsGroup = createSVGElement('defs');
    this.svg.appendChild(this.defsGroup);
    
    // Create groups for different element types (order matters for z-index)
    this.edgesGroup = createSVGGroup('edges-group');
    this.nodesGroup = createSVGGroup('nodes-group');
    
    this.svg.appendChild(this.edgesGroup);
    this.svg.appendChild(this.nodesGroup);
    
    // Add SVG to container
    this.container.appendChild(this.svg);
  }

  /**
   * Renders the complete diagram with nodes and edges
   * Main entry point for rendering layout results
   * @param {LayoutResult} layoutResult - Layout calculation results with positioned nodes and edges
   */
  async render(layoutResult) {
    try {
      // Update SVG viewBox based on layout bounds
      this.updateViewBox(layoutResult.bounds);
      
      // Clear existing elements
      this.clearElements();
      
      // Render edges first (so they appear behind nodes)
      await this.renderEdges(layoutResult.edges);
      
      // Render nodes
      await this.renderNodes(layoutResult.nodes);
      
      // Apply animations if enabled
      if (this.config.enableAnimations) {
        await this.animateInitialRender();
      }
      
    } catch (error) {
      console.error('SVG rendering failed:', error);
      throw new Error(`Rendering failed: ${error.message}`);
    }
  }

  /**
   * Renders all nodes with proper sizing, positioning, and styling
   * Creates node groups containing background, icon, and label elements
   * @param {Node[]} nodes - Array of positioned nodes to render
   */
  async renderNodes(nodes) {
    for (const node of nodes) {
      await this.renderSingleNode(node);
    }
  }

  /**
   * Renders a single node with all its visual components
   * @param {Node} node - Node data with position, style, and metadata
   */
  async renderSingleNode(node) {
    // Create node group container
    const nodeGroup = createSVGGroup(`node-${node.id}`, 
      `translate(${node.x}, ${node.y})`);
    
    // Get node style (with fallbacks)
    const style = this.getNodeStyle(node);
    const size = node.size || { width: 60, height: 40 };
    
    // Create node background shape
    const background = this.createNodeBackground(0, 0, size.width, size.height, style, node.type);
    nodeGroup.appendChild(background);
    
    // Add icon if enabled and available
    if (this.config.showNodeIcons && node.icon) {
      try {
        const icon = await this.createNodeIconElement(0, -size.height / 4, node.icon);
        if (icon) {
          nodeGroup.appendChild(icon);
        }
      } catch (error) {
        console.warn(`Failed to load icon for node ${node.id}:`, error);
      }
    }
    
    // Add node label
    const label = this.createNodeLabel(0, size.height / 3, node.label || node.id, style);
    nodeGroup.appendChild(label);
    
    // Add interaction attributes
    nodeGroup.setAttribute('data-node-id', node.id);
    nodeGroup.setAttribute('data-node-type', node.type);
    nodeGroup.style.cursor = 'pointer';
    
    // Store reference and add to DOM
    this.nodeElements.set(node.id, nodeGroup);
    this.nodesGroup.appendChild(nodeGroup);
  }

  /**
   * Creates the background shape for a node based on its type
   * @param {number} x - X coordinate relative to node center
   * @param {number} y - Y coordinate relative to node center
   * @param {number} width - Node width
   * @param {number} height - Node height
   * @param {NodeStyle} style - Node styling configuration
   * @param {string} nodeType - Type of node for shape selection
   * @returns {SVGElement} Background shape element
   */
  createNodeBackground(x, y, width, height, style, nodeType) {
    // Choose shape based on node type
    switch (nodeType) {
      case 'database':
        // Databases are typically represented as cylinders (ellipses)
        return createNodeCircle(x, y, Math.max(width, height) / 2, style);
      
      case 'api-gateway':
        // API gateways as diamonds (rotated squares)
        const diamond = createNodeRect(x, y, width * 0.8, height * 0.8, style);
        diamond.setAttribute('transform', `rotate(45 ${x} ${y})`);
        return diamond;
      
      default:
        // Default rectangular shape for microservices and other components
        return createNodeRect(x, y, width, height, style);
    }
  }

  /**
   * Creates an icon element for a node
   * @param {number} x - X coordinate relative to node center
   * @param {number} y - Y coordinate relative to node center
   * @param {string} iconIdentifier - Icon identifier or URL
   * @returns {Promise<SVGElement|null>} Promise resolving to icon element or null
   */
  async createNodeIconElement(x, y, iconIdentifier) {
    if (!this.iconManager) {
      return null;
    }
    
    try {
      const iconData = await this.iconManager.getIcon(iconIdentifier);
      if (!iconData) {
        return null;
      }
      
      // Create icon element based on data type
      if (iconData.startsWith('<svg')) {
        // Inline SVG icon
        const iconGroup = createSVGGroup('node-icon');
        iconGroup.innerHTML = iconData;
        iconGroup.setAttribute('transform', 
          `translate(${x - this.config.iconSize / 2}, ${y - this.config.iconSize / 2}) scale(${this.config.iconSize / 24})`);
        return iconGroup;
      } else {
        // Image URL or data URI
        return createNodeIcon(x, y, this.config.iconSize, this.config.iconSize, iconData);
      }
    } catch (error) {
      console.warn('Failed to create icon element:', error);
      return null;
    }
  }

  /**
   * Creates a text label for a node
   * @param {number} x - X coordinate relative to node center
   * @param {number} y - Y coordinate relative to node center
   * @param {string} text - Label text content
   * @param {NodeStyle} style - Node styling configuration
   * @returns {SVGTextElement} Text element for the label
   */
  createNodeLabel(x, y, text, style) {
    // Truncate long labels
    const maxLength = 15;
    const displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    
    return createNodeText(x, y, displayText, style);
  }

  /**
   * Renders all edges with lines/arrows for relationship visualization
   * Creates edge elements connecting nodes with appropriate styling
   * @param {Edge[]} edges - Array of edges to render
   */
  async renderEdges(edges) {
    for (const edge of edges) {
      this.renderSingleEdge(edge);
    }
  }

  /**
   * Renders a single edge between two nodes
   * @param {Edge} edge - Edge data with source/target positions and styling
   */
  renderSingleEdge(edge) {
    if (!edge.sourcePosition || !edge.targetPosition) {
      console.warn(`Edge ${edge.id} missing position data`);
      return;
    }
    
    const style = this.getEdgeStyle(edge);
    const sourcePos = edge.sourcePosition;
    const targetPos = edge.targetPosition;
    
    // Calculate edge path
    let edgeElement;
    if (this.config.curvedEdges && this.shouldUseCurvedEdge(edge)) {
      // Create curved edge using path
      const pathData = calculateCurvedPath(
        sourcePos.x, sourcePos.y,
        targetPos.x, targetPos.y,
        this.config.edgeCurvature
      );
      edgeElement = createEdgePath(pathData, style);
    } else {
      // Create straight edge using line
      edgeElement = createEdgeLine(
        sourcePos.x, sourcePos.y,
        targetPos.x, targetPos.y,
        style
      );
    }
    
    // Add interaction attributes
    edgeElement.setAttribute('data-edge-id', edge.id);
    edgeElement.setAttribute('data-edge-type', edge.type);
    
    // Add edge label if present
    if (edge.label) {
      const labelGroup = createSVGGroup('edge-label-group');
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;
      
      const labelBg = createNodeRect(midX, midY, edge.label.length * 8, 16, {
        fill: '#ffffff',
        stroke: style.stroke,
        strokeWidth: 1,
        opacity: 0.9,
        borderRadius: 2
      });
      
      const labelText = createNodeText(midX, midY, edge.label, {
        textColor: style.labelColor || style.stroke,
        fontFamily: style.labelFontFamily || 'Arial, sans-serif',
        fontSize: style.labelFontSize || 10,
        fontWeight: 'normal'
      });
      
      labelGroup.appendChild(labelBg);
      labelGroup.appendChild(labelText);
      this.edgesGroup.appendChild(labelGroup);
    }
    
    // Store reference and add to DOM
    this.edgeElements.set(edge.id, edgeElement);
    this.edgesGroup.appendChild(edgeElement);
  }

  /**
   * Determines if an edge should use curved rendering
   * @param {Edge} edge - Edge to evaluate
   * @returns {boolean} True if edge should be curved
   */
  shouldUseCurvedEdge(edge) {
    // Use curves for hierarchy relationships to show clear parent-child connections
    return edge.type === 'hierarchy' || edge.type === 'dependency';
  }

  /**
   * Updates node positions with smooth transitions
   * Used for real-time layout updates and animations
   * @param {Node[]} nodes - Nodes with updated positions
   */
  async updatePositions(nodes) {
    const animations = [];
    
    for (const node of nodes) {
      const nodeElement = this.nodeElements.get(node.id);
      if (!nodeElement) continue;
      
      const currentTransform = nodeElement.getAttribute('transform') || 'translate(0, 0)';
      const newTransform = `translate(${node.x}, ${node.y})`;
      
      if (this.config.enableAnimations && currentTransform !== newTransform) {
        // Animate position change
        animations.push(
          animateSVGElement(
            nodeElement,
            { transform: currentTransform },
            { transform: newTransform },
            this.config.animationDuration
          )
        );
      } else {
        // Immediate update
        nodeElement.setAttribute('transform', newTransform);
      }
    }
    
    // Wait for all animations to complete
    if (animations.length > 0) {
      await Promise.all(animations);
    }
    
    // Update edge positions after nodes have moved
    await this.updateEdgePositions();
  }

  /**
   * Updates edge positions based on current node positions
   */
  async updateEdgePositions() {
    for (const [edgeId, edgeElement] of this.edgeElements) {
      // Find the edge data (this would typically come from the layout engine)
      // For now, we'll update based on current node positions
      const sourceNodeId = edgeElement.getAttribute('data-source-node');
      const targetNodeId = edgeElement.getAttribute('data-target-node');
      
      if (sourceNodeId && targetNodeId) {
        const sourceNode = this.nodeElements.get(sourceNodeId);
        const targetNode = this.nodeElements.get(targetNodeId);
        
        if (sourceNode && targetNode) {
          // Extract positions from transform attributes
          const sourcePos = this.extractPositionFromTransform(sourceNode.getAttribute('transform'));
          const targetPos = this.extractPositionFromTransform(targetNode.getAttribute('transform'));
          
          // Update edge element
          if (edgeElement.tagName === 'line') {
            updateSVGAttributes(edgeElement, {
              x1: sourcePos.x,
              y1: sourcePos.y,
              x2: targetPos.x,
              y2: targetPos.y
            });
          } else if (edgeElement.tagName === 'path') {
            const pathData = calculateCurvedPath(
              sourcePos.x, sourcePos.y,
              targetPos.x, targetPos.y,
              this.config.edgeCurvature
            );
            updateSVGAttributes(edgeElement, { d: pathData });
          }
        }
      }
    }
  }

  /**
   * Applies theme configuration to all rendered elements
   * Updates colors, fonts, and visual styling across the diagram
   * @param {ThemeConfig} theme - Theme configuration object
   */
  applyTheme(theme) {
    this.currentTheme = theme;
    
    // Update SVG definitions with theme colors
    this.updateDefinitions(theme);
    
    // Update existing nodes
    for (const [nodeId, nodeElement] of this.nodeElements) {
      this.updateNodeTheme(nodeElement, theme);
    }
    
    // Update existing edges
    for (const [edgeId, edgeElement] of this.edgeElements) {
      this.updateEdgeTheme(edgeElement, theme);
    }
    
    // Update background color
    if (theme.backgroundColor) {
      this.svg.style.backgroundColor = theme.backgroundColor;
    }
  }

  /**
   * Updates SVG definitions with theme-based markers and gradients
   * @param {ThemeConfig} theme - Theme configuration
   */
  updateDefinitions(theme) {
    // Clear existing definitions
    this.defsGroup.innerHTML = '';
    
    // Add theme-based definitions
    const definitions = createSVGDefinitions(theme);
    this.defsGroup.appendChild(definitions);
  }

  /**
   * Updates theme styling for a single node element
   * @param {SVGElement} nodeElement - Node group element
   * @param {ThemeConfig} theme - Theme configuration
   */
  updateNodeTheme(nodeElement, theme) {
    const nodeType = nodeElement.getAttribute('data-node-type') || 'default';
    const nodeStyle = theme.nodeStyles?.[nodeType] || theme.nodeStyles?.default;
    
    if (!nodeStyle) return;
    
    // Update background element
    const background = nodeElement.querySelector('rect, circle');
    if (background) {
      updateSVGStyles(background, {
        fill: nodeStyle.fill,
        stroke: nodeStyle.stroke,
        strokeWidth: nodeStyle.strokeWidth,
        opacity: nodeStyle.opacity
      });
    }
    
    // Update text element
    const text = nodeElement.querySelector('text');
    if (text) {
      updateSVGStyles(text, {
        fill: nodeStyle.textColor,
        fontFamily: nodeStyle.fontFamily,
        fontSize: `${nodeStyle.fontSize}px`,
        fontWeight: nodeStyle.fontWeight
      });
    }
  }

  /**
   * Updates theme styling for a single edge element
   * @param {SVGElement} edgeElement - Edge element
   * @param {ThemeConfig} theme - Theme configuration
   */
  updateEdgeTheme(edgeElement, theme) {
    const edgeType = edgeElement.getAttribute('data-edge-type') || 'default';
    const edgeStyle = theme.edgeStyles?.[edgeType] || theme.edgeStyles?.default;
    
    if (!edgeStyle) return;
    
    updateSVGStyles(edgeElement, {
      stroke: edgeStyle.stroke,
      strokeWidth: edgeStyle.strokeWidth,
      strokeDasharray: edgeStyle.strokeDasharray !== 'none' ? edgeStyle.strokeDasharray : null,
      opacity: edgeStyle.opacity
    });
  }

  /**
   * Updates the SVG viewBox based on layout bounds
   * @param {Object} bounds - Layout bounding box
   */
  updateViewBox(bounds) {
    if (!bounds) return;
    
    const padding = 50;
    const viewBox = `${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width + 2 * padding} ${bounds.height + 2 * padding}`;
    this.svg.setAttribute('viewBox', viewBox);
  }

  /**
   * Clears all rendered elements
   */
  clearElements() {
    this.nodesGroup.innerHTML = '';
    this.edgesGroup.innerHTML = '';
    this.nodeElements.clear();
    this.edgeElements.clear();
  }

  /**
   * Gets the appropriate style for a node
   * @param {Node} node - Node data
   * @returns {NodeStyle} Resolved node style
   */
  getNodeStyle(node) {
    if (this.currentTheme?.nodeStyles) {
      return this.currentTheme.nodeStyles[node.type] || 
             this.currentTheme.nodeStyles.default ||
             node.style;
    }
    return node.style || this.getDefaultNodeStyle();
  }

  /**
   * Gets the appropriate style for an edge
   * @param {Edge} edge - Edge data
   * @returns {EdgeStyle} Resolved edge style
   */
  getEdgeStyle(edge) {
    if (this.currentTheme?.edgeStyles) {
      return this.currentTheme.edgeStyles[edge.type] || 
             this.currentTheme.edgeStyles.default ||
             edge.style;
    }
    return edge.style || this.getDefaultEdgeStyle();
  }

  /**
   * Gets default node styling
   * @returns {NodeStyle} Default node style
   */
  getDefaultNodeStyle() {
    return {
      fill: '#ffffff',
      stroke: '#333333',
      strokeWidth: 2,
      textColor: '#333333',
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      fontWeight: 'normal',
      opacity: 1,
      borderRadius: 4
    };
  }

  /**
   * Gets default edge styling
   * @returns {EdgeStyle} Default edge style
   */
  getDefaultEdgeStyle() {
    return {
      stroke: '#666666',
      strokeWidth: 1,
      strokeDasharray: 'none',
      opacity: 1,
      markerEnd: 'url(#arrowhead)'
    };
  }

  /**
   * Animates the initial render of all elements
   */
  async animateInitialRender() {
    const animations = [];
    
    // Animate nodes appearing
    for (const [nodeId, nodeElement] of this.nodeElements) {
      nodeElement.style.opacity = '0';
      animations.push(
        animateSVGElement(
          nodeElement,
          { opacity: '0', transform: nodeElement.getAttribute('transform') + ' scale(0.5)' },
          { opacity: '1', transform: nodeElement.getAttribute('transform') + ' scale(1)' },
          this.config.animationDuration
        )
      );
    }
    
    // Animate edges appearing (with slight delay)
    setTimeout(() => {
      for (const [edgeId, edgeElement] of this.edgeElements) {
        edgeElement.style.opacity = '0';
        animateSVGElement(
          edgeElement,
          { opacity: '0' },
          { opacity: '1' },
          this.config.animationDuration / 2
        );
      }
    }, this.config.animationDuration / 2);
    
    await Promise.all(animations);
  }

  /**
   * Extracts position coordinates from SVG transform attribute
   * @param {string} transform - Transform attribute value
   * @returns {Object} Position coordinates {x, y}
   */
  extractPositionFromTransform(transform) {
    if (!transform) return { x: 0, y: 0 };
    
    const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
    if (match) {
      return {
        x: parseFloat(match[1]),
        y: parseFloat(match[2])
      };
    }
    
    return { x: 0, y: 0 };
  }

  /**
   * Gets the SVG element for external manipulation
   * @returns {SVGElement} The main SVG element
   */
  getSVGElement() {
    return this.svg;
  }

  /**
   * Gets a node element by ID
   * @param {string} nodeId - Node identifier
   * @returns {SVGElement|null} Node element or null if not found
   */
  getNodeElement(nodeId) {
    return this.nodeElements.get(nodeId) || null;
  }

  /**
   * Gets an edge element by ID
   * @param {string} edgeId - Edge identifier
   * @returns {SVGElement|null} Edge element or null if not found
   */
  getEdgeElement(edgeId) {
    return this.edgeElements.get(edgeId) || null;
  }

  /**
   * Updates renderer configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Destroys the renderer and cleans up resources
   */
  destroy() {
    this.clearElements();
    if (this.container && this.svg) {
      this.container.removeChild(this.svg);
    }
    this.nodeElements.clear();
    this.edgeElements.clear();
    this.svg = null;
  }
}

export default SVGRenderer;