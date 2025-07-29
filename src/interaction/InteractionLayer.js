/**
 * @fileoverview Interactive features layer for diagram user interactions
 * This module provides tooltip functionality, zoom/pan capabilities, and smooth animations
 * for enhanced user experience with architectural diagrams.
 */

import EventHandlers from './EventHandlers.js';

/**
 * Interactive layer that handles all user interactions with the diagram
 * Provides tooltips, zoom/pan functionality, animations, and click handling
 * with smooth transitions and responsive behavior.
 */
export class InteractionLayer {
  /**
   * Initialize the interaction layer
   * @param {SVGElement} svgElement - The main SVG element for the diagram
   * @param {InteractionConfig} config - Configuration for interaction behavior
   */
  constructor(svgElement, config = {}) {
    /** @type {SVGElement} */
    this.svgElement = svgElement;
    
    /** @type {InteractionConfig} */
    this.config = {
      enableZoom: true,
      enablePan: true,
      enableTooltips: true,
      enableSelection: true,
      zoom: {
        minScale: 0.1,
        maxScale: 10,
        scaleStep: 0.1,
        smoothZoom: true,
        duration: 200
      },
      tooltips: {
        delay: 500,
        duration: 0,
        backgroundColor: '#333333',
        textColor: '#ffffff',
        fontSize: 12,
        padding: 8,
        borderRadius: 4,
        followCursor: false
      },
      selection: {
        multiSelect: false,
        selectionColor: '#007bff',
        selectionWidth: 3,
        highlightConnected: true
      },
      ...config
    };
    
    /** @type {EventHandlers} */
    this.eventHandlers = new EventHandlers(svgElement, this.config);
    
    /** @type {Object} Current transform state */
    this.transform = {
      x: 0,
      y: 0,
      scale: 1
    };
    
    /** @type {Set<string>} Currently selected node IDs */
    this.selectedNodes = new Set();
    
    /** @type {HTMLElement|null} Current tooltip element */
    this.currentTooltip = null;
    
    /** @type {number|null} Tooltip timeout ID */
    this.tooltipTimeout = null;
    
    /** @type {Object|null} Pan state during dragging */
    this.panState = null;
    
    /** @type {Map<string, Node>} Node data cache for interactions */
    this.nodeCache = new Map();
    
    /** @type {Map<string, Edge>} Edge data cache for interactions */
    this.edgeCache = new Map();
    
    /** @type {boolean} Whether interactions are enabled */
    this.enabled = true;
    
    this.initialize();
  }
  
  /**
   * Initialize all interaction features
   * @private
   */
  initialize() {
    // Set up zoom and pan if enabled
    if (this.config.enableZoom || this.config.enablePan) {
      this.enableZoomPan();
    }
    
    // Set up tooltips if enabled
    if (this.config.enableTooltips) {
      this.addTooltips();
    }
    
    // Set up selection handling
    if (this.config.enableSelection) {
      this.enableSelection();
    }
    
    // Set up animation system
    this.setupAnimations();
  }
  
  /**
   * Enable smooth zooming and panning capabilities
   * Implements Requirements 5.2: smooth zooming and panning capabilities
   */
  enableZoomPan() {
    let isZooming = false;
    let isPanning = false;
    
    // Handle wheel events for zooming
    if (this.config.enableZoom) {
      this.eventHandlers.on('raw-wheel', (event) => {
        if (!this.enabled) return;
        
        event.preventDefault();
        isZooming = true;
        
        const delta = -event.deltaY;
        const scaleChange = delta > 0 ? this.config.zoom.scaleStep : -this.config.zoom.scaleStep;
        const newScale = Math.max(
          this.config.zoom.minScale,
          Math.min(this.config.zoom.maxScale, this.transform.scale + scaleChange)
        );
        
        if (newScale !== this.transform.scale) {
          const rect = this.svgElement.getBoundingClientRect();
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          // Calculate zoom center point
          const zoomX = event.clientX - rect.left - centerX;
          const zoomY = event.clientY - rect.top - centerY;
          
          this.zoomToPoint(newScale, zoomX, zoomY);
        }
        
        setTimeout(() => { isZooming = false; }, 100);
      });
    }
    
    // Handle mouse events for panning
    if (this.config.enablePan) {
      this.eventHandlers.on('raw-mousedown', (event) => {
        if (!this.enabled || isZooming || event.button !== 0) return;
        
        // Only start panning on background clicks or with modifier key
        const target = this.eventHandlers.findInteractiveTarget(event.target);
        if (target && !event.ctrlKey && !event.metaKey) return;
        
        event.preventDefault();
        isPanning = true;
        
        this.panState = {
          startX: event.clientX,
          startY: event.clientY,
          initialTransformX: this.transform.x,
          initialTransformY: this.transform.y
        };
        
        this.svgElement.style.cursor = 'grabbing';
      });
      
      this.eventHandlers.on('raw-mousemove', (event) => {
        if (!this.enabled || !isPanning || !this.panState) return;
        
        event.preventDefault();
        
        const deltaX = event.clientX - this.panState.startX;
        const deltaY = event.clientY - this.panState.startY;
        
        this.transform.x = this.panState.initialTransformX + deltaX;
        this.transform.y = this.panState.initialTransformY + deltaY;
        
        this.applyTransform();
      });
      
      this.eventHandlers.on('raw-mouseup', () => {
        if (isPanning) {
          isPanning = false;
          this.panState = null;
          this.svgElement.style.cursor = '';
        }
      });
    }
    
    // Handle touch events for mobile zoom/pan
    this.setupTouchInteractions();
  }
  
  /**
   * Set up touch interactions for mobile devices
   * @private
   */
  setupTouchInteractions() {
    let touchState = null;
    
    this.eventHandlers.on('raw-touchstart', (event) => {
      if (!this.enabled) return;
      
      if (event.touches.length === 1) {
        // Single touch - start panning
        touchState = {
          type: 'pan',
          startX: event.touches[0].clientX,
          startY: event.touches[0].clientY,
          initialTransformX: this.transform.x,
          initialTransformY: this.transform.y
        };
      } else if (event.touches.length === 2) {
        // Two touches - start pinch zoom
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        touchState = {
          type: 'zoom',
          initialDistance: distance,
          initialScale: this.transform.scale,
          centerX: (touch1.clientX + touch2.clientX) / 2,
          centerY: (touch1.clientY + touch2.clientY) / 2
        };
      }
    });
    
    this.eventHandlers.on('raw-touchmove', (event) => {
      if (!this.enabled || !touchState) return;
      
      event.preventDefault();
      
      if (touchState.type === 'pan' && event.touches.length === 1) {
        const deltaX = event.touches[0].clientX - touchState.startX;
        const deltaY = event.touches[0].clientY - touchState.startY;
        
        this.transform.x = touchState.initialTransformX + deltaX;
        this.transform.y = touchState.initialTransformY + deltaY;
        
        this.applyTransform();
      } else if (touchState.type === 'zoom' && event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        const scaleChange = distance / touchState.initialDistance;
        const newScale = Math.max(
          this.config.zoom.minScale,
          Math.min(this.config.zoom.maxScale, touchState.initialScale * scaleChange)
        );
        
        this.transform.scale = newScale;
        this.applyTransform();
      }
    });
    
    this.eventHandlers.on('raw-touchend', () => {
      touchState = null;
    });
  }
  
  /**
   * Zoom to a specific point with smooth animation
   * @param {number} scale - Target scale factor
   * @param {number} pointX - X coordinate of zoom center
   * @param {number} pointY - Y coordinate of zoom center
   * @private
   */
  zoomToPoint(scale, pointX, pointY) {
    if (this.config.zoom.smoothZoom) {
      // Smooth zoom with animation
      const startScale = this.transform.scale;
      const startTime = performance.now();
      const duration = this.config.zoom.duration;
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentScale = startScale + (scale - startScale) * easeProgress;
        
        // Adjust transform to zoom toward the point
        const scaleDiff = currentScale - this.transform.scale;
        this.transform.x -= pointX * scaleDiff;
        this.transform.y -= pointY * scaleDiff;
        this.transform.scale = currentScale;
        
        this.applyTransform();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      // Instant zoom
      const scaleDiff = scale - this.transform.scale;
      this.transform.x -= pointX * scaleDiff;
      this.transform.y -= pointY * scaleDiff;
      this.transform.scale = scale;
      this.applyTransform();
    }
  }
  
  /**
   * Apply current transform to the SVG group
   * @private
   */
  applyTransform() {
    const mainGroup = this.svgElement.querySelector('.diagram-main-group') || 
                     this.svgElement.querySelector('g');
    
    if (mainGroup) {
      mainGroup.setAttribute('transform', 
        `translate(${this.transform.x}, ${this.transform.y}) scale(${this.transform.scale})`
      );
    }
  }
  
  /**
   * Add tooltip functionality with hover event handling and positioning logic
   * Implements Requirement 5.1: display tooltips with additional information
   * @param {Node[]} nodes - Array of node data for tooltip content
   */
  addTooltips(nodes = []) {
    // Update node cache for tooltip content
    if (nodes.length > 0) {
      this.nodeCache.clear();
      nodes.forEach(node => {
        this.nodeCache.set(node.id, node);
      });
    }
    
    // Handle mouse enter for showing tooltips
    this.eventHandlers.on('mouseenter', (event) => {
      if (!this.enabled || !this.config.enableTooltips) return;
      
      const nodeId = event.nodeId;
      if (!nodeId) return;
      
      // Clear any existing tooltip timeout
      if (this.tooltipTimeout) {
        clearTimeout(this.tooltipTimeout);
      }
      
      // Set timeout for tooltip delay
      this.tooltipTimeout = setTimeout(() => {
        this.showTooltip(event, nodeId);
      }, this.config.tooltips.delay);
    });
    
    // Handle mouse leave for hiding tooltips
    this.eventHandlers.on('mouseleave', () => {
      if (this.tooltipTimeout) {
        clearTimeout(this.tooltipTimeout);
        this.tooltipTimeout = null;
      }
      this.hideTooltip();
    });
    
    // Handle mouse move for tooltip positioning
    if (this.config.tooltips.followCursor) {
      this.eventHandlers.on('mousemove', (event) => {
        if (this.currentTooltip && event.nodeId) {
          this.positionTooltip(event);
        }
      });
    }
  }
  
  /**
   * Show tooltip for a specific node
   * @param {Object} event - The mouse event
   * @param {string} nodeId - ID of the node to show tooltip for
   * @private
   */
  showTooltip(event, nodeId) {
    const node = this.nodeCache.get(nodeId);
    if (!node) return;
    
    // Create tooltip element
    this.currentTooltip = document.createElement('div');
    this.currentTooltip.className = 'diagram-tooltip';
    
    // Style the tooltip
    Object.assign(this.currentTooltip.style, {
      position: 'absolute',
      backgroundColor: this.config.tooltips.backgroundColor,
      color: this.config.tooltips.textColor,
      fontSize: `${this.config.tooltips.fontSize}px`,
      padding: `${this.config.tooltips.padding}px`,
      borderRadius: `${this.config.tooltips.borderRadius}px`,
      pointerEvents: 'none',
      zIndex: '1000',
      maxWidth: '200px',
      wordWrap: 'break-word',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      opacity: '0',
      transition: 'opacity 0.2s ease-in-out'
    });
    
    // Set tooltip content
    this.currentTooltip.innerHTML = this.generateTooltipContent(node);
    
    // Add to document
    document.body.appendChild(this.currentTooltip);
    
    // Position tooltip
    this.positionTooltip(event);
    
    // Fade in tooltip
    requestAnimationFrame(() => {
      if (this.currentTooltip) {
        this.currentTooltip.style.opacity = '1';
      }
    });
    
    // Auto-hide tooltip if duration is set
    if (this.config.tooltips.duration > 0) {
      setTimeout(() => {
        this.hideTooltip();
      }, this.config.tooltips.duration);
    }
  }
  
  /**
   * Generate HTML content for tooltip
   * @param {Node} node - Node data
   * @returns {string} HTML content for tooltip
   * @private
   */
  generateTooltipContent(node) {
    let content = `<strong>${node.label || node.id}</strong>`;
    
    if (node.type) {
      content += `<br><em>Type: ${node.type}</em>`;
    }
    
    if (node.metadata) {
      Object.entries(node.metadata).forEach(([key, value]) => {
        if (key !== 'label' && key !== 'type' && value) {
          content += `<br>${key}: ${value}`;
        }
      });
    }
    
    return content;
  }
  
  /**
   * Position tooltip relative to mouse cursor or element
   * @param {Object} event - The mouse event
   * @private
   */
  positionTooltip(event) {
    if (!this.currentTooltip) return;
    
    const rect = this.svgElement.getBoundingClientRect();
    const tooltipRect = this.currentTooltip.getBoundingClientRect();
    
    let x, y;
    
    if (this.config.tooltips.followCursor) {
      // Position relative to cursor
      x = event.clientX + 10;
      y = event.clientY - 10;
    } else {
      // Position relative to element
      const elementRect = event.diagramTarget.getBoundingClientRect();
      x = elementRect.left + elementRect.width / 2;
      y = elementRect.top - 10;
    }
    
    // Adjust position to keep tooltip in viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (x + tooltipRect.width > viewportWidth) {
      x = viewportWidth - tooltipRect.width - 10;
    }
    if (x < 10) {
      x = 10;
    }
    
    if (y < 10) {
      y = y + tooltipRect.height + 20;
    }
    if (y + tooltipRect.height > viewportHeight) {
      y = viewportHeight - tooltipRect.height - 10;
    }
    
    this.currentTooltip.style.left = `${x}px`;
    this.currentTooltip.style.top = `${y}px`;
  }
  
  /**
   * Hide the current tooltip
   * @private
   */
  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.style.opacity = '0';
      setTimeout(() => {
        if (this.currentTooltip && this.currentTooltip.parentNode) {
          this.currentTooltip.parentNode.removeChild(this.currentTooltip);
        }
        this.currentTooltip = null;
      }, 200);
    }
  }
  
  /**
   * Enable selection functionality for nodes
   * @private
   */
  enableSelection() {
    // Handle node clicks for selection
    this.eventHandlers.on('click', (event) => {
      if (!this.enabled || !event.isNode) return;
      
      const nodeId = event.nodeId;
      if (!nodeId) return;
      
      if (event.ctrlKey || event.metaKey) {
        // Multi-select mode
        if (this.config.selection.multiSelect) {
          this.toggleNodeSelection(nodeId);
        }
      } else {
        // Single select mode
        this.selectNode(nodeId, !this.config.selection.multiSelect);
      }
    });
    
    // Handle background clicks for deselection
    this.eventHandlers.on('background-click', () => {
      this.clearSelection();
    });
  }
  
  /**
   * Select a node
   * @param {string} nodeId - ID of the node to select
   * @param {boolean} clearOthers - Whether to clear other selections
   */
  selectNode(nodeId, clearOthers = true) {
    if (clearOthers) {
      this.clearSelection();
    }
    
    this.selectedNodes.add(nodeId);
    this.updateNodeSelection(nodeId, true);
    
    if (this.config.selection.highlightConnected) {
      this.highlightConnectedNodes(nodeId);
    }
  }
  
  /**
   * Toggle node selection
   * @param {string} nodeId - ID of the node to toggle
   */
  toggleNodeSelection(nodeId) {
    if (this.selectedNodes.has(nodeId)) {
      this.selectedNodes.delete(nodeId);
      this.updateNodeSelection(nodeId, false);
    } else {
      this.selectedNodes.add(nodeId);
      this.updateNodeSelection(nodeId, true);
    }
    
    if (this.config.selection.highlightConnected) {
      this.updateConnectedHighlights();
    }
  }
  
  /**
   * Clear all selections
   */
  clearSelection() {
    this.selectedNodes.forEach(nodeId => {
      this.updateNodeSelection(nodeId, false);
    });
    this.selectedNodes.clear();
    this.clearConnectedHighlights();
  }
  
  /**
   * Update visual selection state for a node
   * @param {string} nodeId - ID of the node
   * @param {boolean} selected - Whether the node is selected
   * @private
   */
  updateNodeSelection(nodeId, selected) {
    const nodeElement = this.svgElement.querySelector(`[data-node-id="${nodeId}"]`);
    if (!nodeElement) return;
    
    if (selected) {
      nodeElement.style.stroke = this.config.selection.selectionColor;
      nodeElement.style.strokeWidth = this.config.selection.selectionWidth;
      nodeElement.classList.add('selected');
    } else {
      nodeElement.style.stroke = '';
      nodeElement.style.strokeWidth = '';
      nodeElement.classList.remove('selected');
    }
  }
  
  /**
   * Highlight nodes connected to the selected node
   * @param {string} nodeId - ID of the selected node
   * @private
   */
  highlightConnectedNodes(nodeId) {
    // Find connected edges
    const connectedEdges = this.svgElement.querySelectorAll(
      `[data-source-id="${nodeId}"], [data-target-id="${nodeId}"]`
    );
    
    connectedEdges.forEach(edge => {
      edge.classList.add('connected');
      edge.style.stroke = this.config.selection.selectionColor;
      edge.style.opacity = '0.7';
    });
  }
  
  /**
   * Update highlights for all connected nodes
   * @private
   */
  updateConnectedHighlights() {
    this.clearConnectedHighlights();
    this.selectedNodes.forEach(nodeId => {
      this.highlightConnectedNodes(nodeId);
    });
  }
  
  /**
   * Clear all connected node highlights
   * @private
   */
  clearConnectedHighlights() {
    const connectedElements = this.svgElement.querySelectorAll('.connected');
    connectedElements.forEach(element => {
      element.classList.remove('connected');
      element.style.stroke = '';
      element.style.opacity = '';
    });
  }
  
  /**
   * Set up animation system for smooth transitions
   * Implements Requirement 5.3: animate transitions smoothly
   * @private
   */
  setupAnimations() {
    // Store animation configurations
    this.animations = {
      duration: 300, // Default animation duration in milliseconds
      easing: 'ease-in-out', // CSS easing function
      
      // Timing functions for different animation types
      timings: {
        // Smooth ease-in-out cubic bezier for general animations
        smooth: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        
        // Bounce effect for interactive feedback
        bounce: (t) => {
          if (t < 1/2.75) {
            return 7.5625 * t * t;
          } else if (t < 2/2.75) {
            return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
          } else if (t < 2.5/2.75) {
            return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
          } else {
            return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
          }
        },
        
        // Elastic effect for spring-like animations
        elastic: (t) => {
          return t === 0 ? 0 : t === 1 ? 1 : 
            -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
        }
      }
    };
  }
  
  /**
   * Animate element position changes smoothly
   * @param {Element} element - The SVG element to animate
   * @param {Object} fromPos - Starting position {x, y}
   * @param {Object} toPos - Target position {x, y}
   * @param {number} duration - Animation duration in milliseconds
   * @param {string} timingFunction - Timing function name ('smooth', 'bounce', 'elastic')
   * @returns {Promise} Promise that resolves when animation completes
   */
  addAnimations(element, fromPos, toPos, duration = this.animations.duration, timingFunction = 'smooth') {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const timingFunc = this.animations.timings[timingFunction] || this.animations.timings.smooth;
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply timing function for smooth animation curve
        const easedProgress = timingFunc(progress);
        
        // Calculate current position
        const currentX = fromPos.x + (toPos.x - fromPos.x) * easedProgress;
        const currentY = fromPos.y + (toPos.y - fromPos.y) * easedProgress;
        
        // Update element position
        if (element.tagName === 'g') {
          // For group elements, update transform
          element.setAttribute('transform', `translate(${currentX}, ${currentY})`);
        } else {
          // For individual elements, update x/y or cx/cy attributes
          if (element.hasAttribute('x')) {
            element.setAttribute('x', currentX);
            element.setAttribute('y', currentY);
          } else if (element.hasAttribute('cx')) {
            element.setAttribute('cx', currentX);
            element.setAttribute('cy', currentY);
          }
        }
        
        // Continue animation or resolve
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }
  
  /**
   * Animate element scaling with smooth transitions
   * @param {Element} element - The SVG element to animate
   * @param {number} fromScale - Starting scale factor
   * @param {number} toScale - Target scale factor
   * @param {number} duration - Animation duration in milliseconds
   * @returns {Promise} Promise that resolves when animation completes
   */
  animateScale(element, fromScale, toScale, duration = this.animations.duration) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply smooth timing function
        const easedProgress = this.animations.timings.smooth(progress);
        
        // Calculate current scale
        const currentScale = fromScale + (toScale - fromScale) * easedProgress;
        
        // Update element scale
        const currentTransform = element.getAttribute('transform') || '';
        const newTransform = currentTransform.replace(/scale\([^)]*\)/, '') + 
                           ` scale(${currentScale})`;
        element.setAttribute('transform', newTransform.trim());
        
        // Continue animation or resolve
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }
  
  /**
   * Animate element opacity changes
   * @param {Element} element - The SVG element to animate
   * @param {number} fromOpacity - Starting opacity (0-1)
   * @param {number} toOpacity - Target opacity (0-1)
   * @param {number} duration - Animation duration in milliseconds
   * @returns {Promise} Promise that resolves when animation completes
   */
  animateOpacity(element, fromOpacity, toOpacity, duration = this.animations.duration) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply smooth timing function
        const easedProgress = this.animations.timings.smooth(progress);
        
        // Calculate current opacity
        const currentOpacity = fromOpacity + (toOpacity - fromOpacity) * easedProgress;
        
        // Update element opacity
        element.setAttribute('opacity', currentOpacity);
        
        // Continue animation or resolve
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }
  
  /**
   * Get currently selected node IDs
   * @returns {string[]} Array of selected node IDs
   */
  getSelectedNodes() {
    return Array.from(this.selectedNodes);
  }
  
  /**
   * Get current transform state
   * @returns {Object} Current transform {x, y, scale}
   */
  getTransform() {
    return { ...this.transform };
  }
  
  /**
   * Set transform state programmatically
   * @param {number} x - X translation
   * @param {number} y - Y translation
   * @param {number} scale - Scale factor
   * @param {boolean} animate - Whether to animate the change
   */
  setTransform(x, y, scale, animate = true) {
    if (animate) {
      // Animate to new transform
      const startTransform = { ...this.transform };
      const targetTransform = { x, y, scale };
      const startTime = performance.now();
      const duration = this.animations.duration;
      
      const animateTransform = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = this.animations.timings.smooth(progress);
        
        this.transform.x = startTransform.x + (targetTransform.x - startTransform.x) * easedProgress;
        this.transform.y = startTransform.y + (targetTransform.y - startTransform.y) * easedProgress;
        this.transform.scale = startTransform.scale + (targetTransform.scale - startTransform.scale) * easedProgress;
        
        this.applyTransform();
        
        if (progress < 1) {
          requestAnimationFrame(animateTransform);
        }
      };
      
      requestAnimationFrame(animateTransform);
    } else {
      // Set immediately
      this.transform.x = x;
      this.transform.y = y;
      this.transform.scale = scale;
      this.applyTransform();
    }
  }
  
  /**
   * Reset zoom and pan to default state
   * @param {boolean} animate - Whether to animate the reset
   */
  resetView(animate = true) {
    this.setTransform(0, 0, 1, animate);
  }
  
  /**
   * Enable or disable all interactions
   * @param {boolean} enabled - Whether interactions should be enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (!enabled) {
      this.hideTooltip();
      this.clearSelection();
    }
  }
  
  /**
   * Update node and edge data cache for interactions
   * @param {Node[]} nodes - Array of node data
   * @param {Edge[]} edges - Array of edge data
   */
  updateData(nodes = [], edges = []) {
    // Update node cache
    this.nodeCache.clear();
    nodes.forEach(node => {
      this.nodeCache.set(node.id, node);
    });
    
    // Update edge cache
    this.edgeCache.clear();
    edges.forEach(edge => {
      this.edgeCache.set(edge.id, edge);
    });
  }
  
  /**
   * Clean up all interaction resources and event listeners
   */
  destroy() {
    // Hide any active tooltip
    this.hideTooltip();
    
    // Clear timeouts
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
    
    // Clear selections
    this.clearSelection();
    
    // Destroy event handlers
    this.eventHandlers.destroy();
    
    // Clear caches
    this.nodeCache.clear();
    this.edgeCache.clear();
    this.selectedNodes.clear();
    
    // Reset state
    this.enabled = false;
    this.panState = null;
    this.currentTooltip = null;
  }
}

export default InteractionLayer;