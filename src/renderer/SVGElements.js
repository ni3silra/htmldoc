/**
 * @fileoverview SVG element creation utilities
 * This module provides helper functions for creating and manipulating SVG elements
 * with proper attributes, styling, and cross-browser compatibility.
 */

/**
 * Creates an SVG element with specified attributes and styles
 * @param {string} tagName - SVG element tag name (e.g., 'rect', 'circle', 'path')
 * @param {Object} attributes - Element attributes as key-value pairs
 * @param {Object} styles - CSS styles as key-value pairs
 * @param {string} textContent - Text content for text elements
 * @returns {SVGElement} Created SVG element
 */
export function createSVGElement(tagName, attributes = {}, styles = {}, textContent = '') {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  
  // Set attributes
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== null && value !== undefined) {
      element.setAttribute(key, value);
    }
  }
  
  // Set styles
  for (const [key, value] of Object.entries(styles)) {
    if (value !== null && value !== undefined) {
      element.style[key] = value;
    }
  }
  
  // Set text content if provided
  if (textContent) {
    element.textContent = textContent;
  }
  
  return element;
}

/**
 * Creates an SVG group element with transform and class attributes
 * @param {string} className - CSS class name for the group
 * @param {string} transform - SVG transform attribute value
 * @returns {SVGGElement} Created SVG group element
 */
export function createSVGGroup(className = '', transform = '') {
  const attributes = {};
  if (className) attributes.class = className;
  if (transform) attributes.transform = transform;
  
  return createSVGElement('g', attributes);
}

/**
 * Creates an SVG rectangle element for node backgrounds
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @param {NodeStyle} style - Node styling configuration
 * @returns {SVGRectElement} Created rectangle element
 */
export function createNodeRect(x, y, width, height, style) {
  const attributes = {
    x: x - width / 2,
    y: y - height / 2,
    width,
    height,
    rx: style.borderRadius || 0,
    ry: style.borderRadius || 0
  };
  
  const styles = {
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    opacity: style.opacity
  };
  
  if (style.shadowColor && style.shadowBlur) {
    styles.filter = `drop-shadow(2px 2px ${style.shadowBlur}px ${style.shadowColor})`;
  }
  
  return createSVGElement('rect', attributes, styles);
}

/**
 * Creates an SVG circle element for circular nodes
 * @param {number} cx - Center X coordinate
 * @param {number} cy - Center Y coordinate
 * @param {number} radius - Circle radius
 * @param {NodeStyle} style - Node styling configuration
 * @returns {SVGCircleElement} Created circle element
 */
export function createNodeCircle(cx, cy, radius, style) {
  const attributes = {
    cx,
    cy,
    r: radius
  };
  
  const styles = {
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    opacity: style.opacity
  };
  
  if (style.shadowColor && style.shadowBlur) {
    styles.filter = `drop-shadow(2px 2px ${style.shadowBlur}px ${style.shadowColor})`;
  }
  
  return createSVGElement('circle', attributes, styles);
}

/**
 * Creates an SVG text element for node labels
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string} text - Text content
 * @param {NodeStyle} style - Node styling configuration
 * @returns {SVGTextElement} Created text element
 */
export function createNodeText(x, y, text, style) {
  const attributes = {
    x,
    y,
    'text-anchor': 'middle',
    'dominant-baseline': 'central'
  };
  
  const styles = {
    fill: style.textColor,
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    pointerEvents: 'none' // Prevent text from interfering with mouse events
  };
  
  return createSVGElement('text', attributes, styles, text);
}

/**
 * Creates an SVG line element for simple edges
 * @param {number} x1 - Start X coordinate
 * @param {number} y1 - Start Y coordinate
 * @param {number} x2 - End X coordinate
 * @param {number} y2 - End Y coordinate
 * @param {EdgeStyle} style - Edge styling configuration
 * @returns {SVGLineElement} Created line element
 */
export function createEdgeLine(x1, y1, x2, y2, style) {
  const attributes = {
    x1,
    y1,
    x2,
    y2
  };
  
  const styles = {
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    strokeDasharray: style.strokeDasharray !== 'none' ? style.strokeDasharray : null,
    opacity: style.opacity,
    markerEnd: style.markerEnd
  };
  
  return createSVGElement('line', attributes, styles);
}

/**
 * Creates an SVG path element for curved edges
 * @param {string} pathData - SVG path data string
 * @param {EdgeStyle} style - Edge styling configuration
 * @returns {SVGPathElement} Created path element
 */
export function createEdgePath(pathData, style) {
  const attributes = {
    d: pathData
  };
  
  const styles = {
    fill: 'none',
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    strokeDasharray: style.strokeDasharray !== 'none' ? style.strokeDasharray : null,
    opacity: style.opacity,
    markerEnd: style.markerEnd
  };
  
  return createSVGElement('path', attributes, styles);
}

/**
 * Creates an SVG image element for node icons
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} href - Image URL or data URI
 * @returns {SVGImageElement} Created image element
 */
export function createNodeIcon(x, y, width, height, href) {
  const attributes = {
    x: x - width / 2,
    y: y - height / 2,
    width,
    height,
    href,
    preserveAspectRatio: 'xMidYMid meet'
  };
  
  const styles = {
    pointerEvents: 'none' // Prevent icon from interfering with mouse events
  };
  
  return createSVGElement('image', attributes, styles);
}

/**
 * Creates SVG marker definitions for arrow heads
 * @param {string} id - Marker ID for referencing
 * @param {string} color - Arrow color
 * @param {number} size - Arrow size multiplier
 * @returns {SVGMarkerElement} Created marker element
 */
export function createArrowMarker(id, color = '#666666', size = 1) {
  const marker = createSVGElement('marker', {
    id,
    viewBox: '0 0 10 10',
    refX: 9,
    refY: 3,
    markerWidth: 6 * size,
    markerHeight: 6 * size,
    orient: 'auto',
    markerUnits: 'strokeWidth'
  });
  
  const path = createSVGElement('path', {
    d: 'M0,0 L0,6 L9,3 z'
  }, {
    fill: color,
    stroke: 'none'
  });
  
  marker.appendChild(path);
  return marker;
}

/**
 * Creates SVG definitions element with common markers and gradients
 * @param {ThemeConfig} theme - Theme configuration for colors and styles
 * @returns {SVGDefsElement} Created definitions element
 */
export function createSVGDefinitions(theme) {
  const defs = createSVGElement('defs');
  
  // Create arrow markers for different edge types
  const arrowMarker = createArrowMarker('arrowhead', theme.colors?.primary || '#666666');
  const hierarchyMarker = createArrowMarker('hierarchy-arrow', theme.colors?.secondary || '#999999');
  const dependencyMarker = createArrowMarker('dependency-arrow', theme.colors?.warning || '#ffc107', 0.8);
  
  defs.appendChild(arrowMarker);
  defs.appendChild(hierarchyMarker);
  defs.appendChild(dependencyMarker);
  
  // Create gradient definitions for node backgrounds
  if (theme.colors) {
    const gradient = createSVGElement('linearGradient', {
      id: 'nodeGradient',
      x1: '0%',
      y1: '0%',
      x2: '0%',
      y2: '100%'
    });
    
    const stop1 = createSVGElement('stop', {
      offset: '0%',
      'stop-color': theme.colors.primary,
      'stop-opacity': '0.8'
    });
    
    const stop2 = createSVGElement('stop', {
      offset: '100%',
      'stop-color': theme.colors.primary,
      'stop-opacity': '0.4'
    });
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
  }
  
  return defs;
}

/**
 * Updates SVG element attributes efficiently
 * @param {SVGElement} element - SVG element to update
 * @param {Object} attributes - New attributes to set
 */
export function updateSVGAttributes(element, attributes) {
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== null && value !== undefined) {
      element.setAttribute(key, value);
    }
  }
}

/**
 * Updates SVG element styles efficiently
 * @param {SVGElement} element - SVG element to update
 * @param {Object} styles - New styles to apply
 */
export function updateSVGStyles(element, styles) {
  for (const [key, value] of Object.entries(styles)) {
    if (value !== null && value !== undefined) {
      element.style[key] = value;
    }
  }
}

/**
 * Calculates curved path data for edges between nodes
 * @param {number} x1 - Start X coordinate
 * @param {number} y1 - Start Y coordinate
 * @param {number} x2 - End X coordinate
 * @param {number} y2 - End Y coordinate
 * @param {number} curvature - Curve intensity (0 = straight, 1 = maximum curve)
 * @returns {string} SVG path data string
 */
export function calculateCurvedPath(x1, y1, x2, y2, curvature = 0.3) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate control points for cubic bezier curve
  const controlDistance = distance * curvature;
  const angle = Math.atan2(dy, dx);
  const perpAngle = angle + Math.PI / 2;
  
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  const controlX = midX + Math.cos(perpAngle) * controlDistance;
  const controlY = midY + Math.sin(perpAngle) * controlDistance;
  
  return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
}

/**
 * Calculates the intersection point of a line with a rectangle
 * Used for connecting edges to node boundaries instead of centers
 * @param {number} nodeX - Node center X
 * @param {number} nodeY - Node center Y
 * @param {number} nodeWidth - Node width
 * @param {number} nodeHeight - Node height
 * @param {number} targetX - Target point X
 * @param {number} targetY - Target point Y
 * @returns {Object} Intersection point {x, y}
 */
export function calculateNodeBoundaryIntersection(nodeX, nodeY, nodeWidth, nodeHeight, targetX, targetY) {
  const halfWidth = nodeWidth / 2;
  const halfHeight = nodeHeight / 2;
  
  const dx = targetX - nodeX;
  const dy = targetY - nodeY;
  
  // Calculate intersection with rectangle edges
  const tTop = -halfHeight / dy;
  const tBottom = halfHeight / dy;
  const tLeft = -halfWidth / dx;
  const tRight = halfWidth / dx;
  
  // Find the smallest positive t value
  const validTs = [tTop, tBottom, tLeft, tRight].filter(t => t > 0 && t <= 1);
  
  if (validTs.length === 0) {
    return { x: nodeX, y: nodeY }; // Fallback to center
  }
  
  const t = Math.min(...validTs);
  
  return {
    x: nodeX + dx * t,
    y: nodeY + dy * t
  };
}

/**
 * Creates a tooltip element for node information display
 * @param {string} content - Tooltip content HTML
 * @param {TooltipConfig} config - Tooltip styling configuration
 * @returns {HTMLDivElement} Created tooltip element
 */
export function createTooltip(content, config) {
  const tooltip = document.createElement('div');
  tooltip.className = 'diagram-tooltip';
  tooltip.innerHTML = content;
  
  // Apply tooltip styles
  Object.assign(tooltip.style, {
    position: 'absolute',
    backgroundColor: config.backgroundColor || '#333333',
    color: config.textColor || '#ffffff',
    padding: `${config.padding || 8}px`,
    borderRadius: `${config.borderRadius || 4}px`,
    fontSize: `${config.fontSize || 12}px`,
    pointerEvents: 'none',
    zIndex: '1000',
    opacity: '0',
    transition: 'opacity 0.2s ease-in-out',
    maxWidth: '200px',
    wordWrap: 'break-word'
  });
  
  return tooltip;
}

/**
 * Animates an SVG element's attributes over time
 * @param {SVGElement} element - Element to animate
 * @param {Object} fromAttributes - Starting attribute values
 * @param {Object} toAttributes - Ending attribute values
 * @param {number} duration - Animation duration in milliseconds
 * @param {string} easing - Easing function name
 * @returns {Promise} Promise that resolves when animation completes
 */
export function animateSVGElement(element, fromAttributes, toAttributes, duration = 300, easing = 'ease-in-out') {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    // Set initial values
    updateSVGAttributes(element, fromAttributes);
    
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing function
      const easedProgress = applyEasing(progress, easing);
      
      // Interpolate attribute values
      const currentAttributes = {};
      for (const [key, endValue] of Object.entries(toAttributes)) {
        const startValue = fromAttributes[key] || 0;
        currentAttributes[key] = interpolateValue(startValue, endValue, easedProgress);
      }
      
      updateSVGAttributes(element, currentAttributes);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    
    requestAnimationFrame(animate);
  });
}

/**
 * Applies easing function to animation progress
 * @param {number} t - Progress value (0-1)
 * @param {string} easing - Easing function name
 * @returns {number} Eased progress value
 */
function applyEasing(t, easing) {
  switch (easing) {
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return 1 - (1 - t) * (1 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
    default:
      return t; // linear
  }
}

/**
 * Interpolates between two numeric values
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} progress - Progress (0-1)
 * @returns {number} Interpolated value
 */
function interpolateValue(start, end, progress) {
  if (typeof start === 'number' && typeof end === 'number') {
    return start + (end - start) * progress;
  }
  return progress < 0.5 ? start : end;
}

export default {
  createSVGElement,
  createSVGGroup,
  createNodeRect,
  createNodeCircle,
  createNodeText,
  createEdgeLine,
  createEdgePath,
  createNodeIcon,
  createArrowMarker,
  createSVGDefinitions,
  updateSVGAttributes,
  updateSVGStyles,
  calculateCurvedPath,
  calculateNodeBoundaryIntersection,
  createTooltip,
  animateSVGElement
};