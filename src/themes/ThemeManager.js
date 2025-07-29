/**
 * Theme Manager for HTML Diagram Library
 * Handles theme application and customization across all diagram elements
 */

import { DefaultTheme } from './DefaultTheme.js';
import { validateTheme, mergeThemes } from './ThemeValidator.js';

/**
 * ThemeManager class handles theme application and customization
 */
export class ThemeManager {
  constructor(customTheme = null) {
    this.defaultTheme = DefaultTheme;
    this.currentTheme = customTheme ? this.setTheme(customTheme) : this.defaultTheme;
    this.appliedElements = new Set();
  }
  
  /**
   * Sets a new theme, validating and merging with defaults
   * @param {Object} customTheme - Custom theme configuration
   * @returns {Object} The merged and validated theme
   * @throws {Error} If theme validation fails
   */
  setTheme(customTheme) {
    const validation = validateTheme(customTheme);
    
    if (!validation.isValid) {
      throw new Error(`Theme validation failed: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('Theme warnings:', validation.warnings);
    }
    
    this.currentTheme = mergeThemes(this.defaultTheme, customTheme);
    return this.currentTheme;
  }
  
  /**
   * Gets the current active theme
   * @returns {Object} Current theme configuration
   */
  getTheme() {
    return this.currentTheme;
  }
  
  /**
   * Applies theme styling to all diagram elements
   * @param {SVGElement} svgContainer - SVG container element
   * @param {Array} nodes - Array of node objects
   * @param {Array} edges - Array of edge objects
   */
  applyTheme(svgContainer, nodes = [], edges = []) {
    if (!svgContainer) {
      throw new Error('SVG container is required for theme application');
    }
    
    // Apply global SVG styles
    this.applyGlobalStyles(svgContainer);
    
    // Apply node styles
    nodes.forEach(node => this.applyNodeTheme(node));
    
    // Apply edge styles
    edges.forEach(edge => this.applyEdgeTheme(edge));
    
    // Apply marker definitions for arrows
    this.applyMarkerDefinitions(svgContainer);
    
    // Track applied elements
    this.appliedElements.add(svgContainer);
  }
  
  /**
   * Applies global SVG container styles
   * @param {SVGElement} svgContainer - SVG container element
   */
  applyGlobalStyles(svgContainer) {
    const theme = this.currentTheme;
    
    // Set SVG background
    svgContainer.style.backgroundColor = theme.colors.background;
    svgContainer.style.fontFamily = theme.fonts.primary.family;
    svgContainer.style.fontSize = theme.fonts.primary.sizes.md;
    
    // Add CSS class for theme-specific styling
    svgContainer.classList.add('html-diagram-svg');
    
    // Apply user-select none to prevent text selection during interactions
    svgContainer.style.userSelect = 'none';
    svgContainer.style.webkitUserSelect = 'none';
    svgContainer.style.mozUserSelect = 'none';
    svgContainer.style.msUserSelect = 'none';
  }
  
  /**
   * Applies theme styling to a node element
   * @param {Object} node - Node object with SVG element reference
   */
  applyNodeTheme(node) {
    if (!node.element) return;
    
    const theme = this.currentTheme;
    const nodeType = node.type || 'default';
    const nodeStyle = theme.nodeStyles[nodeType] || theme.nodeStyles.default;
    
    // Apply base node styles
    const rect = node.element.querySelector('rect') || node.element.querySelector('ellipse');
    if (rect) {
      rect.setAttribute('fill', nodeStyle.backgroundColor || theme.colors.background);
      rect.setAttribute('stroke', nodeStyle.borderColor || theme.colors.border);
      rect.setAttribute('stroke-width', nodeStyle.borderWidth || 2);
      
      if (nodeStyle.borderRadius && rect.tagName === 'rect') {
        rect.setAttribute('rx', nodeStyle.borderRadius);
        rect.setAttribute('ry', nodeStyle.borderRadius);
      }
      
      // Apply shadow effect if supported
      if (nodeStyle.shadowBlur) {
        this.applyShadowFilter(node.element, nodeStyle);
      }
    }
    
    // Apply text styles
    const text = node.element.querySelector('text');
    if (text) {
      text.setAttribute('fill', theme.colors.text);
      text.setAttribute('font-family', theme.fonts.primary.family);
      text.setAttribute('font-size', theme.fonts.primary.sizes.sm);
      text.setAttribute('font-weight', theme.fonts.primary.weights.medium);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
    }
    
    // Apply icon styles
    const icon = node.element.querySelector('.node-icon');
    if (icon) {
      icon.setAttribute('fill', nodeStyle.iconColor || theme.colors.text);
      icon.setAttribute('width', theme.iconStyles.default.size);
      icon.setAttribute('height', theme.iconStyles.default.size);
    }
    
    // Add hover and interaction styles
    this.applyNodeInteractionStyles(node.element, nodeStyle);
  }
  
  /**
   * Applies theme styling to an edge element
   * @param {Object} edge - Edge object with SVG element reference
   */
  applyEdgeTheme(edge) {
    if (!edge.element) return;
    
    const theme = this.currentTheme;
    const edgeType = edge.type || 'default';
    const edgeStyle = theme.edgeStyles[edgeType] || theme.edgeStyles.default;
    
    // Apply line styles
    const line = edge.element.querySelector('line') || edge.element.querySelector('path');
    if (line) {
      line.setAttribute('stroke', edgeStyle.strokeColor || theme.colors.connection);
      line.setAttribute('stroke-width', edgeStyle.strokeWidth || 2);
      line.setAttribute('opacity', edgeStyle.opacity || 1);
      
      if (edgeStyle.strokeDasharray && edgeStyle.strokeDasharray !== 'none') {
        line.setAttribute('stroke-dasharray', edgeStyle.strokeDasharray);
      }
      
      if (edgeStyle.markerEnd) {
        line.setAttribute('marker-end', edgeStyle.markerEnd);
      }
      
      if (edgeStyle.markerStart) {
        line.setAttribute('marker-start', edgeStyle.markerStart);
      }
    }
    
    // Apply edge label styles if present
    const label = edge.element.querySelector('text');
    if (label) {
      label.setAttribute('fill', theme.colors.textSecondary);
      label.setAttribute('font-family', theme.fonts.primary.family);
      label.setAttribute('font-size', theme.fonts.primary.sizes.xs);
      label.setAttribute('text-anchor', 'middle');
    }
  }
  
  /**
   * Applies shadow filter to a node element
   * @param {SVGElement} element - Node SVG element
   * @param {Object} nodeStyle - Node style configuration
   */
  applyShadowFilter(element, nodeStyle) {
    const svgContainer = element.closest('svg');
    if (!svgContainer) return;
    
    // Create or get defs element
    let defs = svgContainer.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgContainer.insertBefore(defs, svgContainer.firstChild);
    }
    
    // Create shadow filter
    const filterId = `shadow-${Math.random().toString(36).substr(2, 9)}`;
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');
    
    const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    feDropShadow.setAttribute('dx', nodeStyle.shadowOffset?.x || 0);
    feDropShadow.setAttribute('dy', nodeStyle.shadowOffset?.y || 2);
    feDropShadow.setAttribute('stdDeviation', nodeStyle.shadowBlur || 4);
    feDropShadow.setAttribute('flood-color', nodeStyle.shadowColor || 'rgba(0, 0, 0, 0.1)');
    
    filter.appendChild(feDropShadow);
    defs.appendChild(filter);
    
    // Apply filter to element
    element.setAttribute('filter', `url(#${filterId})`);
  }
  
  /**
   * Applies marker definitions for arrows and other edge decorations
   * @param {SVGElement} svgContainer - SVG container element
   */
  applyMarkerDefinitions(svgContainer) {
    const theme = this.currentTheme;
    
    // Create or get defs element
    let defs = svgContainer.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgContainer.insertBefore(defs, svgContainer.firstChild);
    }
    
    // Create arrowhead marker
    const arrowMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    arrowMarker.setAttribute('id', 'arrowhead');
    arrowMarker.setAttribute('markerWidth', '10');
    arrowMarker.setAttribute('markerHeight', '7');
    arrowMarker.setAttribute('refX', '9');
    arrowMarker.setAttribute('refY', '3.5');
    arrowMarker.setAttribute('orient', 'auto');
    
    const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrowPath.setAttribute('points', '0 0, 10 3.5, 0 7');
    arrowPath.setAttribute('fill', theme.colors.connection);
    
    arrowMarker.appendChild(arrowPath);
    defs.appendChild(arrowMarker);
  }
  
  /**
   * Applies interaction styles (hover, focus, etc.) to node elements
   * @param {SVGElement} element - Node SVG element
   * @param {Object} nodeStyle - Node style configuration
   */
  applyNodeInteractionStyles(element, nodeStyle) {
    const theme = this.currentTheme;
    
    // Add CSS classes for interaction states
    element.classList.add('diagram-node');
    
    // Store original styles for state transitions
    const rect = element.querySelector('rect') || element.querySelector('ellipse');
    if (rect) {
      rect.setAttribute('data-original-fill', rect.getAttribute('fill'));
      rect.setAttribute('data-original-stroke', rect.getAttribute('stroke'));
    }
    
    // Add hover event listeners
    element.addEventListener('mouseenter', () => {
      if (rect) {
        rect.style.transition = theme.animations.transitions.color;
        rect.setAttribute('fill', this.adjustColorBrightness(rect.getAttribute('fill'), 0.1));
      }
      element.style.cursor = 'pointer';
    });
    
    element.addEventListener('mouseleave', () => {
      if (rect) {
        rect.setAttribute('fill', rect.getAttribute('data-original-fill'));
      }
      element.style.cursor = 'default';
    });
  }
  
  /**
   * Adjusts color brightness for hover effects
   * @param {string} color - Original color
   * @param {number} amount - Brightness adjustment amount (-1 to 1)
   * @returns {string} Adjusted color
   */
  adjustColorBrightness(color, amount) {
    // Simple brightness adjustment for hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * amount)));
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(255 * amount)));
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(255 * amount)));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    return color; // Return original if not hex
  }
  
  /**
   * Gets style for a specific node type
   * @param {string} nodeType - Type of node
   * @returns {Object} Node style configuration
   */
  getNodeStyle(nodeType) {
    return this.currentTheme.nodeStyles[nodeType] || this.currentTheme.nodeStyles.default;
  }
  
  /**
   * Gets style for a specific edge type
   * @param {string} edgeType - Type of edge
   * @returns {Object} Edge style configuration
   */
  getEdgeStyle(edgeType) {
    return this.currentTheme.edgeStyles[edgeType] || this.currentTheme.edgeStyles.default;
  }
  
  /**
   * Gets color from theme
   * @param {string} colorKey - Color key from theme
   * @returns {string} Color value
   */
  getColor(colorKey) {
    return this.currentTheme.colors[colorKey] || this.currentTheme.colors.primary;
  }
  
  /**
   * Resets theme to default
   */
  resetToDefault() {
    this.currentTheme = this.defaultTheme;
    
    // Re-apply theme to all tracked elements
    this.appliedElements.forEach(element => {
      if (element.parentNode) { // Check if element is still in DOM
        this.applyTheme(element);
      }
    });
  }
  
  /**
   * Cleans up theme manager resources
   */
  destroy() {
    this.appliedElements.clear();
    this.currentTheme = null;
  }
}

export default ThemeManager;